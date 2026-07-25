import { useEffect, useRef, useState } from 'react';
import RoomList from '../components/RoomList';
import MemberList from '../components/MemberList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinPasswordModal from '../components/JoinPasswordModal';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';
import { logOut } from '../firebase/auth';
import { initPresence, watchOnlineUsers } from '../firebase/presence';
import {
  listenOpenRooms,
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
  isRoomUnlockedForUser,
  markRoomUnlocked,
  upsertMyRoom,
  removeMyRoom,
  listenMyRooms,
} from '../firebase/firestore';
import { declineRoomInvite } from '../firebase/social';
import { MessageRateLimiter } from '../utils/rateLimit';

export default function ChatApp({ user }) {
  const [openRooms, setOpenRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [mobilePanel, setMobilePanel] = useState('rooms'); // rooms | chat | members
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(false);
  const [confirmLeaveRoom, setConfirmLeaveRoom] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [joinError, setJoinError] = useState('');
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

  // 오픈채팅 목록 + 내가 참여 중인 방(팀/단체/DM) 목록 구독
  useEffect(() => listenOpenRooms(setOpenRooms), []);
  useEffect(() => listenMyRooms(user.uid, setMyRooms), [user.uid]);

  // 현재 방의 메시지/멤버 구독 + 입장/퇴장 처리
  useEffect(() => {
    if (!currentRoom) return;
    let cancelled = false;

    async function join() {
      let isNewMember = false;
      try {
        isNewMember = await joinRoomMembers(currentRoom.id, user.uid, user.displayName);
      } catch (err) {
        // 강퇴당한 방에는 재입장이 규칙으로 차단됨
        if (!cancelled) {
          setJoinError('이 채팅방에서 강퇴되어 다시 입장할 수 없습니다.');
          removeMyRoom(user.uid, currentRoom.id);
          setCurrentRoom(null);
          setMobilePanel('rooms');
        }
        return;
      }

      const extra = {};
      if (currentRoom.type === 'dm' && currentRoom.dmParticipants) {
        const otherUid = currentRoom.dmParticipants.find((u) => u !== user.uid);
        extra.otherUid = otherUid;
        if (currentRoom.participantNicknames?.[otherUid]) {
          extra.otherNickname = currentRoom.participantNicknames[otherUid];
        }
      }
      upsertMyRoom(user.uid, currentRoom, extra);

      // 방을 잠깐 보다가 다른 방으로 넘어가거나 브라우저를 닫는 것은 '퇴장'이 아니므로,
      // 진짜로 이 방에 처음 들어온 순간에만 입장 메시지를 보냅니다.
      if (currentRoom.type !== 'dm' && isNewMember) {
        sendSystemMessage(currentRoom.id, `${user.displayName}님이 입장했습니다.`);
      }
    }
    join();

    const unsubMsg = listenMessages(currentRoom.id, setMessages);
    const unsubMembers = listenRoomMembers(currentRoom.id, (list) => {
      setMembers(list);
      // DM일 경우 상대방 닉네임을 실시간으로 내 myRooms 미러에도 반영
      if (currentRoom.type === 'dm') {
        const other = list.find((m) => m.uid !== user.uid);
        if (other) upsertMyRoom(user.uid, currentRoom, { otherUid: other.uid, otherNickname: other.nickname });
      }
    });

    return () => {
      cancelled = true;
      unsubMsg();
      unsubMembers();
      // 여기서는 멤버십을 지우거나 '퇴장' 메시지를 보내지 않습니다 — 단순히 다른 화면을 보거나
      // 브라우저를 닫은 것과, 실제로 방을 나가는 것을 명확히 구분하기 위함입니다.
      // 실제로 방을 나가려면 상단의 '나가기' 버튼을 사용하세요 (handleLeaveRoom).
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom?.id]);

  async function handleSelectRoom(room) {
    setJoinError('');
    if (room.id === currentRoom?.id) {
      setMobilePanel('chat');
      return;
    }
    if (room.isPrivate && room.passwordHash) {
      const unlocked = await isRoomUnlockedForUser(user.uid, room.id);
      if (!unlocked) {
        setPendingRoom(room);
        return;
      }
    }
    setMessages([]);
    setCurrentRoom(room);
    setMobilePanel('chat');
  }

  async function handleSelectMyRoom(mirror) {
    setJoinError('');
    if (mirror.roomId === currentRoom?.id) {
      setMobilePanel('chat');
      return;
    }
    const room = await getRoomById(mirror.roomId);
    if (!room) {
      removeMyRoom(user.uid, mirror.roomId);
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
    await removeMyRoom(user.uid, currentRoom.id);
    setConfirmDeleteRoom(false);
    setCurrentRoom(null);
    setMobilePanel('rooms');
  }

  async function handleKick() {
    await kickMember(currentRoom.id, kickTarget.uid);
    await sendSystemMessage(currentRoom.id, `${kickTarget.nickname}님이 강퇴되었습니다.`);
    setKickTarget(null);
  }

  async function handleLeaveRoom() {
    await leaveRoomMembers(currentRoom.id, user.uid);
    await removeMyRoom(user.uid, currentRoom.id);
    await sendSystemMessage(currentRoom.id, `${user.displayName}님이 퇴장했습니다.`).catch(() => {});
    setConfirmLeaveRoom(false);
    setCurrentRoom(null);
    setMobilePanel('rooms');
  }

  async function handleJoinRoomInvite(invite) {
    const room = await getRoomById(invite.roomId);
    await declineRoomInvite(user.uid, invite.id);
    if (!room) return;
    setMessages([]);
    setCurrentRoom(room);
    setMobilePanel('chat');
  }

  function handleOpenDM(room) {
    setJoinError('');
    setMessages([]);
    setCurrentRoom(room);
    setMobilePanel('chat');
  }

  const dmOtherUid =
    currentRoom?.type === 'dm' ? currentRoom.dmParticipants?.find((u) => u !== user.uid) : null;
  const dmOtherNickname =
    currentRoom?.type === 'dm'
      ? currentRoom.participantNicknames?.[dmOtherUid] ||
        members.find((m) => m.uid !== user.uid)?.nickname ||
        '상대방'
      : null;
  // onlineUsers는 브라우저 종료/네트워크 끊김을 Realtime Database의 onDisconnect로 감지하는
  // 신뢰도 높은 전역 접속 상태입니다 (presence.js). 방을 그냥 안 보고 있는 것과는 다릅니다.
  const dmOtherOnline = dmOtherUid ? onlineUsers.some((u) => u.uid === dmOtherUid && u.state === 'online') : false;

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-base-950 text-gray-100">
      {/* 왼쪽: 채팅방 목록 */}
      <div className={`w-full sm:w-64 shrink-0 ${mobilePanel === 'rooms' ? 'block' : 'hidden'} sm:block`}>
        <RoomList
          openRooms={openRooms}
          myRooms={myRooms}
          currentRoomId={currentRoom?.id}
          currentRoom={currentRoom}
          onlineUsers={onlineUsers}
          onSelectRoom={handleSelectRoom}
          onSelectMyRoom={handleSelectMyRoom}
          onCreateClick={() => setShowCreate(true)}
          onOpenDM={handleOpenDM}
          onJoinRoomInvite={handleJoinRoomInvite}
          user={user}
          onLogout={logOut}
        />
      </div>

      {/* 가운데: 메시지 영역 */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobilePanel === 'chat' ? 'flex' : 'hidden'} sm:flex`}>
        {joinError && (
          <div className="bg-danger/20 text-danger text-xs px-4 py-2 text-center">{joinError}</div>
        )}
        {currentRoom ? (
          <>
            <div className="h-14 border-b border-base-800 flex items-center gap-2 px-4 shrink-0">
              <button onClick={() => setMobilePanel('rooms')} className="sm:hidden text-gray-400 mr-1">←</button>
              <span className="text-gray-500">
                {currentRoom.type === 'dm' ? '💬' : currentRoom.isPrivate ? '🔒' : '#'}
              </span>
              <h2 className="font-semibold truncate">
                {currentRoom.type === 'dm' ? dmOtherNickname : currentRoom.name}
              </h2>
              {currentRoom.type === 'dm' && (
                <span
                  className={`flex items-center gap-1 text-xs shrink-0 ${dmOtherOnline ? 'text-online' : 'text-gray-500'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${dmOtherOnline ? 'bg-online' : 'bg-base-600'}`} />
                  {dmOtherOnline ? '온라인' : '오프라인'}
                </span>
              )}
              {currentRoom.type !== 'dm' && currentRoom.ownerUid === user.uid && (
                <span className="text-[10px] bg-accent/20 text-accent-light px-1.5 py-0.5 rounded shrink-0">👑 방장</span>
              )}
              <div className="flex-1" />
              <button onClick={() => setShowSearch(true)} title="검색" className="text-gray-400 hover:text-gray-200 px-2">🔍</button>
              {currentRoom.type !== 'dm' && currentRoom.ownerUid === user.uid && (
                <button onClick={() => setConfirmDeleteRoom(true)} title="방 삭제" className="text-gray-400 hover:text-danger px-2">🗑</button>
              )}
              {currentRoom.type !== 'dm' && currentRoom.ownerUid !== user.uid && (
                <button onClick={() => setConfirmLeaveRoom(true)} title="나가기" className="text-gray-400 hover:text-danger px-2">🚪</button>
              )}
              {currentRoom.type !== 'dm' && (
                <button onClick={() => setMobilePanel('members')} className="sm:hidden text-gray-400 px-2">👥</button>
              )}
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
            <p className="text-xs text-gray-700">친구 추가와 1:1 대화는 왼쪽 상단 '친구' 탭에서 할 수 있어요.</p>
          </div>
        )}
      </div>

      {/* 오른쪽: 접속자 목록 (DM에는 표시 안 함) */}
      {currentRoom && currentRoom.type !== 'dm' && (
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
          onCreated={async (roomId) => {
            setShowCreate(false);
            const room = await getRoomById(roomId);
            if (!room) return;
            setJoinError('');
            setMessages([]);
            setCurrentRoom(room);
            setMobilePanel('chat');
          }}
        />
      )}

      {pendingRoom && (
        <JoinPasswordModal
          room={pendingRoom}
          onClose={() => setPendingRoom(null)}
          onSuccess={async () => {
            await markRoomUnlocked(user.uid, pendingRoom.id);
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

      {confirmDeleteRoom && (
        <ConfirmModal
          title="채팅방을 삭제할까요?"
          message={`#${currentRoom.name} 방과 모든 메시지가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onConfirm={handleDeleteRoom}
          onCancel={() => setConfirmDeleteRoom(false)}
        />
      )}

      {confirmLeaveRoom && (
        <ConfirmModal
          title="채팅방에서 나갈까요?"
          message={`#${currentRoom.name} 방에서 나갑니다. 다시 들어오려면 초대를 받거나 다시 검색해서 입장해야 해요.`}
          confirmLabel="나가기"
          onConfirm={handleLeaveRoom}
          onCancel={() => setConfirmLeaveRoom(false)}
        />
      )}

      {kickTarget && (
        <ConfirmModal
          title="멤버를 강퇴할까요?"
          message={`${kickTarget.nickname}님을 이 방에서 내보냅니다. 강퇴된 사용자는 이 방에 다시 입장할 수 없습니다.`}
          confirmLabel="강퇴"
          onConfirm={handleKick}
          onCancel={() => setKickTarget(null)}
        />
      )}
    </div>
  );
}
