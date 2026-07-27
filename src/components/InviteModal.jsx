import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Avatar from './Avatar';
import { sanitizeText } from '../utils/sanitize';
import { listenFriends, inviteToRoom } from '../firebase/social';

export default function InviteModal({ user, room, onClose }) {
  const [friends, setFriends] = useState([]);
  const [invited, setInvited] = useState({});

  useEffect(() => listenFriends(user.uid, setFriends), [user.uid]);

  async function handleInvite(friendUid, friendNickname) {
    await inviteToRoom(friendUid, room, user.uid, user.displayName);
    setInvited((prev) => ({ ...prev, [friendUid]: true }));
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-sm p-5 animate-pop max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-1">#{room.name}에 초대</h2>
        <p className="text-xs text-gray-500 mb-4">친구를 이 채팅방으로 초대해요.</p>

        <div className="flex-1 overflow-y-auto space-y-1">
          {friends.length === 0 && <p className="text-sm text-gray-600 py-6 text-center">초대할 친구가 없어요.</p>}
          {friends.map((f) => (
            <InviteRow key={f.uid} friendUid={f.uid} invited={!!invited[f.uid]} onInvite={handleInvite} />
          ))}
        </div>

        <button onClick={onClose} className="mt-4 w-full rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-base-800">
          닫기
        </button>
      </div>
    </div>
  );
}

function InviteRow({ friendUid, invited, onInvite }) {
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
        <Avatar nickname={nickname} avatarColor={profile?.avatarColor} avatarEmoji={profile?.avatarEmoji} className="w-7 h-7 text-xs" />
        <span className="text-sm truncate">{sanitizeText(nickname)}</span>
      </div>
      <button
        onClick={() => onInvite(friendUid, nickname)}
        disabled={invited}
        className={`text-xs px-2 py-1 rounded shrink-0 ${
          invited ? 'bg-base-700 text-gray-500' : 'bg-accent hover:bg-accent-light'
        }`}
      >
        {invited ? '초대됨 ✓' : '초대'}
      </button>
    </div>
  );
}
