import { useEffect, useRef, useState } from 'react';
import RoomList from '../components/RoomList';
import MemberList from '../components/MemberList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinPasswordModal from '../components/JoinPasswordModal';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';
import NotificationBell from '../components/NotificationBell';
import FriendsModal from '../components/FriendsModal';
import { logOut } from '../firebase/auth';
import { initPresence, watchOnlineUsers } from '../firebase/presence';
import {
  listenRooms,
  listenMessages,
  listenRoomMembers,
  joinRoomMembers,
  leaveRoomMembers,
  kickMember,
  sendMessage,
  deleteMessage,
  sendSystemMessage,
  deleteRoom,
  getRoomById,
} from '../firebase/firestore';
import { declineRoomInvite } from '../firebase/social';
import { MessageRateLimiter } from '../utils/rateLimit';

export default function ChatApp({ user }) {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [mobilePanel, setMobilePanel] = useState('rooms'); // rooms | chat | members
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const rateLimiter = useRef(new MessageRateLimiter());

  // 온라인 상태(presence) 초기화
  useEffect(() => {
    const cleanup = initPresence(user.uid, user.displayName);
    const unsubOnline = watchOnlineUsers(setOnlineUsers);
    return () => {
      cleanup();
      unsubOnline();
    };
  }, [user.uid]);

  // 채팅방 목록 구독
  useEffect(() => listenRooms(setRooms), []);

  // 현재 방의 메시지/멤버 구독 + 입장/퇴장 처리
  useEffect(() => {
    if (!currentRoom) return;
    joinRoomMembers(currentRoom.id, user.uid, user.displayName);
    sendSystemMessage(currentRoom.id, `${user.displayName}님이 입장했습니다.`);

    const unsubMsg = listenMessages(currentRoom.id, setMessages);
    const unsubMembers = listenRoomMembers(currentRoom.id, setMembers);

    return () => {
      unsubMsg();
      unsubMembers();
      leaveRoomMembers(currentRoom.id, user.uid);
      sendSystemMessage(currentRoom.id, `${user.displayName}님이 퇴장했습니다.`).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom?.id]);

  function handleSelectRoom(room) {
    if (room.id === currentRoom?.id) {
      setMobilePanel('chat');
      return;
    }
    if (room.isPrivate && room.passwordHash) {
      setPendingRoom(room);
      return;
    }
    setMessages([]);
    setCurrentRoom(room);
    setMobilePanel('chat');
  }

  function handleSend(payload) {
    sendMessage(currentRoom.id, {
      senderUid: user.uid,
      senderNickname: user.displayName,
      ...payload,
    });
  }

  async function handleDeleteRoom() {
    await deleteRoom(currentRoom.id);
    setConfirmDeleteRoom(false);
    setCurrentRoom(null);
    setMobilePanel('rooms');
  }

  async function handleKick() {
    await kickMember(currentRoom.id, kickTarget.uid);
    await sendSystemMessage(currentRoom.id, `${kickTarget.nickname}님이 강퇴되었습니다.`);
    setKickTarget(null);
  }

  async function handleJoinRoomInvite(invite) {
    const room = await getRoomById(invite.roomId);
    await declineRoomInvite(user.uid, invite.id);
    if (!room) return;
    setMessages([]);
    setCurrentRoom(room);
    setMobilePanel('chat');
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-base-950 text-gray-100">
      {/* 왼쪽: 채팅방 목록 */}
      <div className={`w-full sm:w-64 shrink-0 ${mobilePanel === 'rooms' ? 'block' : 'hidden'} sm:block`}>
        <RoomList
          rooms={rooms}
          currentRoomId={currentRoom?.id}
          onSelectRoom={handleSelectRoom}
          onCreateClick={() => setShowCreate(true)}
          user={user}
          onLogout={logOut}
        />
      </div>

      {/* 가운데: 메시지 영역 */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobilePanel === 'chat' ? 'flex' : 'hidden'} sm:flex`}>
        {currentRoom ? (
          <>
            <div className="h-14 border-b border-base-800 flex items-center gap-2 px-4 shrink-0">
              <button onClick={() => setMobilePanel('rooms')} className="sm:hidden text-gray-400 mr-1">←</button>
              <span className="text-gray-500">{currentRoom.isPrivate ? '🔒' : '#'}</span>
              <h2 className="font-semibold truncate">{currentRoom.name}</h2>
              {currentRoom.ownerUid === user.uid && (
                <span className="text-[10px] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded shrink-0">👑 방장</span>
              )}
              <div className="flex-1" />
              <button onClick={() => setShowFriends(true)} title="친구" className="text-gray-400 hover:text-gray-200 px-2">👤</button>
              <NotificationBell user={user} onJoinRoomInvite={handleJoinRoomInvite} />
              <button onClick={() => setShowSearch(true)} title="검색" className="text-gray-400 hover:text-gray-200 px-2">🔍</button>
              {currentRoom.ownerUid === user.uid && (
                <button onClick={() => setConfirmDeleteRoom(true)} title="방 삭제" className="text-gray-400 hover:text-danger px-2">🗑</button>
              )}
              <button onClick={() => setMobilePanel('members')} className="sm:hidden text-gray-400 px-2">👥</button>
            </div>

            <MessageList
              messages={messages}
              myUid={user.uid}
              myNickname={user.displayName}
              onDelete={(id) => deleteMessage(currentRoom.id, id)}
              onReply={setReplyingTo}
            />

            <MessageInput
              members={members}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              onSend={handleSend}
              rateLimiter={rateLimiter.current}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 text-sm px-4 text-center gap-3">
            <p>왼쪽에서 채팅방을 선택하거나 새로 만들어보세요.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowFriends(true)} className="text-accent-light hover:underline text-sm">
                친구 관리 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 오른쪽: 접속자 목록 */}
      {currentRoom && (
        <div className={`w-full sm:w-60 shrink-0 ${mobilePanel === 'members' ? 'block' : 'hidden'} sm:block`}>
          <MemberList
            members={members}
            onlineUsers={onlineUsers}
            ownerUid={currentRoom.ownerUid}
            myUid={user.uid}
            onKick={setKickTarget}
          />
        </div>
      )}

      {showCreate && (
        <CreateRoomModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}

      {pendingRoom && (
        <JoinPasswordModal
          room={pendingRoom}
          onClose={() => setPendingRoom(null)}
          onSuccess={() => {
            setMessages([]);
            setCurrentRoom(pendingRoom);
            setPendingRoom(null);
            setMobilePanel('chat');
          }}
        />
      )}

      {showSearch && currentRoom && (
        <SearchBar
          roomId={currentRoom.id}
          onClose={() => setShowSearch(false)}
          onJumpTo={() => setShowSearch(false)}
        />
      )}

      {showFriends && (
        <FriendsModal user={user} currentRoom={currentRoom} onClose={() => setShowFriends(false)} />
      )}

      {confirmDeleteRoom && (
        <ConfirmModal
          title="채팅방을 삭제할까요?"
          message={`#${currentRoom.name} 방과 모든 메시지가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onConfirm={handleDeleteRoom}
          onCancel={() => setConfirmDeleteRoom(false)}
        />
      )}

      {kickTarget && (
        <ConfirmModal
          title="멤버를 강퇴할까요?"
          message={`${kickTarget.nickname}님을 이 방에서 내보냅니다.`}
          confirmLabel="강퇴"
          onConfirm={handleKick}
          onCancel={() => setKickTarget(null)}
        />
      )}
    </div>
  );
}
