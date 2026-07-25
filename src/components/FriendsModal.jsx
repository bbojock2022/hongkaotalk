import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sanitizeText } from '../utils/sanitize';
import { findUsersByNickname } from '../firebase/firestore';
import { sendFriendRequest, listenFriends, removeFriend, inviteToRoom, startDirectMessage } from '../firebase/social';

export default function FriendsModal({ user, currentRoom, onClose, onOpenDM }) {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => listenFriends(user.uid, setFriends), [user.uid]);

  async function handleSearch(e) {
    e.preventDefault();
    setMessage('');
    if (!searchTerm.trim()) return;
    const results = await findUsersByNickname(searchTerm);
    setSearchResults(results.filter((r) => r.uid !== user.uid));
    if (results.length === 0) setMessage('해당 닉네임의 사용자를 찾을 수 없습니다. (온라인 여부와 상관없이 요청 가능해요)');
  }

  async function handleAddFriend(target) {
    try {
      await sendFriendRequest(user.uid, user.displayName, target.uid, target.nickname);
      setMessage(`${target.nickname}님에게 친구 요청을 보냈습니다.`);
    } catch (err) {
      setMessage(err.message || '친구 요청에 실패했습니다.');
    }
  }

  async function handleInvite(friendUid, friendNickname) {
    if (!currentRoom || currentRoom.type === 'dm') return;
    await inviteToRoom(friendUid, currentRoom, user.uid, user.displayName);
    setMessage(`${friendNickname}님을 #${currentRoom.name}로 초대했습니다.`);
  }

  async function handleStartDM(friendUid, friendNickname) {
    const room = await startDirectMessage(user.uid, user.displayName, friendUid, friendNickname);
    onOpenDM(room, friendNickname);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-sm p-5 animate-pop max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">친구</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200">✕</button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <input
            className="input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="닉네임으로 검색"
          />
          <button type="submit" className="btn-primary shrink-0">검색</button>
        </form>

        {message && <p className="text-xs text-gray-400 mb-2">{message}</p>}

        {searchResults.length > 0 && (
          <div className="mb-4 space-y-1">
            <p className="text-xs text-gray-500">검색 결과</p>
            {searchResults.map((r) => (
              <div key={r.uid} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-base-800">
                <span className="text-sm truncate">{sanitizeText(r.nickname)}</span>
                <button
                  onClick={() => handleAddFriend(r)}
                  className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent-light shrink-0"
                >
                  친구 요청
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <p className="text-xs text-gray-500 mb-1">내 친구 — {friends.length}</p>
          {friends.length === 0 && <p className="text-sm text-gray-600 py-4 text-center">아직 친구가 없어요.</p>}
          {friends.map((f) => (
            <FriendRow
              key={f.uid}
              friendUid={f.uid}
              currentRoom={currentRoom}
              onInvite={handleInvite}
              onStartDM={handleStartDM}
              onRemove={() => removeFriend(user.uid, f.uid)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FriendRow({ friendUid, currentRoom, onInvite, onStartDM, onRemove }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, 'users', friendUid)).then((snap) => {
      if (!cancelled && snap.exists()) setProfile(snap.data());
    });
    return () => {
      cancelled = true;
    };
  }, [friendUid]);

  const nickname = profile?.nickname || '(불러오는 중...)';

  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-base-800">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full bg-base-700 flex items-center justify-center text-xs font-semibold shrink-0">
          {nickname[0]?.toUpperCase() || '?'}
        </div>
        <span className="text-sm truncate">{sanitizeText(nickname)}</span>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onStartDM(friendUid, nickname)}
          title="1:1 채팅"
          className="text-xs px-2 py-1 rounded bg-base-700 hover:bg-accent"
        >
          💬
        </button>
        {currentRoom && currentRoom.type !== 'dm' && (
          <button
            onClick={() => onInvite(friendUid, nickname)}
            title="현재 채팅방으로 초대"
            className="text-xs px-2 py-1 rounded bg-base-700 hover:bg-accent"
          >
            초대
          </button>
        )}
        <button onClick={onRemove} title="친구 삭제" className="text-xs px-2 py-1 rounded bg-base-700 hover:bg-danger">
          삭제
        </button>
      </div>
    </div>
  );
}
