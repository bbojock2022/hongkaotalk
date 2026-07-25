const TYPE_ICON = { open: '#', team: '🧑‍💼', group: '👥' };

function RoomButton({ room, isActive, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors duration-150 ${
        isActive ? 'bg-accent/20 text-white' : 'text-gray-400 hover:bg-base-800 hover:text-gray-200'
      }`}
    >
      <span className="w-8 h-8 rounded-full bg-base-700 flex items-center justify-center text-sm shrink-0">
        {icon}
      </span>
      <span className="truncate text-sm font-medium">{label}</span>
    </button>
  );
}

export default function RoomList({
  openRooms,
  myRooms,
  currentRoomId,
  onSelectRoom,
  onSelectMyRoom,
  onCreateClick,
  onFriendsClick,
  user,
  onLogout,
}) {
  const teamGroupRooms = myRooms.filter((r) => r.type === 'team' || r.type === 'group');
  const dmRooms = myRooms.filter((r) => r.type === 'dm');

  return (
    <div className="h-full flex flex-col bg-base-900 border-r border-base-800">
      <div className="p-4 border-b border-base-800 flex items-center justify-between">
        <h1 className="font-bold text-lg tracking-tight">Wavelength</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onFriendsClick}
            title="친구"
            className="w-8 h-8 rounded-lg bg-base-800 hover:bg-base-700 flex items-center justify-center text-sm transition-colors"
          >
            👤
          </button>
          <button
            onClick={onCreateClick}
            title="채팅방 만들기"
            className="w-8 h-8 rounded-lg bg-base-800 hover:bg-accent flex items-center justify-center text-lg transition-colors"
          >
            +
          </button>
        </div>
      </div>

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
                  room={room}
                  isActive={currentRoomId === room.roomId}
                  onClick={() => onSelectMyRoom(room)}
                  icon={(room.otherNickname || '?')[0].toUpperCase()}
                  label={room.otherNickname || 'DM'}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-base-800 flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold shrink-0">
          {(user.displayName || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.displayName}</p>
          <p className="text-xs text-online">온라인</p>
        </div>
        <button onClick={onLogout} title="로그아웃" className="text-gray-500 hover:text-danger text-sm px-2">
          ⏻
        </button>
      </div>
    </div>
  );
}
