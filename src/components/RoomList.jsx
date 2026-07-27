import { useState } from 'react';
import NotificationBell from './NotificationBell';
import FriendsPanel from './FriendsPanel';
import Avatar from './Avatar';

const TYPE_ICON = { open: '#', team: '🧑‍💼', group: '👥' };

function RoomButton({ isActive, onClick, icon, iconNode, label, online }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors duration-150 ${
        isActive ? 'bg-accent/20 text-white' : 'text-gray-400 hover:bg-base-800 hover:text-gray-200'
      }`}
    >
      <span className="relative shrink-0">
        {iconNode || (
          <span className="w-8 h-8 rounded-full bg-base-700 flex items-center justify-center text-sm">
            {icon}
          </span>
        )}
        {online !== undefined && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-base-900 ${
              online ? 'bg-online' : 'bg-base-600'
            }`}
          />
        )}
      </span>
      <span className="truncate text-sm font-medium">{label}</span>
    </button>
  );
}

export default function RoomList({
  openRooms,
  myRooms,
  currentRoomId,
  currentRoom,
  onlineUsers,
  myProfile,
  onSelectRoom,
  onSelectMyRoom,
  onCreateClick,
  onOpenDM,
  onJoinRoomInvite,
  onOpenProfile,
  user,
  onLogout,
}) {
  const [tab, setTab] = useState('chats'); // chats | friends
  const teamGroupRooms = myRooms.filter((r) => r.type === 'team' || r.type === 'group');
  const dmRooms = myRooms.filter((r) => r.type === 'dm');
  const isOnline = (uid) => (onlineUsers || []).some((u) => u.uid === uid && u.state === 'online');

  return (
    <div className="h-full flex flex-col bg-base-900 border-r border-base-800">
      <div className="p-4 border-b border-base-800 flex items-center justify-between">
        <h1 className="font-bold text-lg tracking-tight">Wavelength</h1>
        <div className="flex items-center gap-1">
          <NotificationBell user={user} onJoinRoomInvite={onJoinRoomInvite} />
          <button
            onClick={onCreateClick}
            title="채팅방 만들기"
            className="w-8 h-8 rounded-lg bg-base-800 hover:bg-accent flex items-center justify-center text-lg transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex border-b border-base-800 shrink-0">
        <button
          onClick={() => setTab('chats')}
          className={`flex-1 text-sm font-medium py-2.5 transition-colors ${
            tab === 'chats' ? 'text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          채팅
        </button>
        <button
          onClick={() => setTab('friends')}
          className={`flex-1 text-sm font-medium py-2.5 transition-colors ${
            tab === 'friends' ? 'text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          친구
        </button>
      </div>

      {tab === 'chats' ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div>
            <p className="text-xs text-gray-500 px-2 py-1 uppercase tracking-wide">오픈채팅</p>
            {openRooms.length === 0 && (
              <p className="text-xs text-gray-600 px-3 py-2">아직 오픈채팅이 없어요.</p>
            )}
            <div className="space-y-1">
              {openRooms.map((room) => (
                <RoomButton
                  key={room.id}
                  room={room}
                  isActive={currentRoomId === room.id}
                  onClick={() => onSelectRoom(room)}
                  icon={room.isPrivate ? '🔒' : TYPE_ICON.open}
                  label={room.name}
                />
              ))}
            </div>
          </div>

          {teamGroupRooms.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 px-2 py-1 uppercase tracking-wide">내 채팅방</p>
              <div className="space-y-1">
                {teamGroupRooms.map((room) => (
                  <RoomButton
                    key={room.roomId}
                    room={room}
                    isActive={currentRoomId === room.roomId}
                    onClick={() => onSelectMyRoom(room)}
                    icon={room.isPrivate ? '🔒' : TYPE_ICON[room.type]}
                    label={room.name}
                  />
                ))}
              </div>
            </div>
          )}

          {dmRooms.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 px-2 py-1 uppercase tracking-wide">다이렉트 메시지</p>
              <div className="space-y-1">
                {dmRooms.map((room) => (
                  <RoomButton
                    key={room.roomId}
                    isActive={currentRoomId === room.roomId}
                    onClick={() => onSelectMyRoom(room)}
                    iconNode={
                      <Avatar
                        nickname={room.otherNickname || '?'}
                        avatarColor={room.otherAvatarColor}
                        avatarEmoji={room.otherAvatarEmoji}
                        className="w-8 h-8 text-sm"
                      />
                    }
                    label={room.otherNickname || 'DM'}
                    online={room.otherUid ? isOnline(room.otherUid) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <FriendsPanel user={user} currentRoom={currentRoom} onOpenDM={onOpenDM} />
        </div>
      )}

      <div className="p-3 border-t border-base-800 flex items-center gap-2">
        <button onClick={onOpenProfile} title="프로필 꾸미기" className="shrink-0">
          <Avatar nickname={user.displayName} avatarColor={myProfile?.avatarColor} avatarEmoji={myProfile?.avatarEmoji} className="w-9 h-9 text-sm" />
        </button>
        <button onClick={onOpenProfile} className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium truncate">{user.displayName}</p>
          <p className="text-xs text-gray-500 truncate">{myProfile?.statusMessage || <span className="text-online">온라인</span>}</p>
        </button>
        <button onClick={onLogout} title="로그아웃" className="text-gray-500 hover:text-danger text-sm px-2">
          ⏻
        </button>
      </div>
    </div>
  );
}
