export default function RoomList({ rooms, currentRoomId, onSelectRoom, onCreateClick, user, onLogout }) {
  return (
    <div className="h-full flex flex-col bg-base-900 border-r border-base-800">
      <div className="p-4 border-b border-base-800 flex items-center justify-between">
        <h1 className="font-bold text-lg tracking-tight">Wavelength</h1>
        <button
          onClick={onCreateClick}
          title="채팅방 만들기"
          className="w-8 h-8 rounded-lg bg-base-800 hover:bg-accent flex items-center justify-center text-lg transition-colors"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {rooms.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-8 px-4">
            아직 채팅방이 없어요.
            <br />+ 버튼으로 첫 방을 만들어보세요.
          </p>
        )}
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room)}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors duration-150 ${
              currentRoomId === room.id ? 'bg-accent/20 text-white' : 'text-gray-400 hover:bg-base-800 hover:text-gray-200'
            }`}
          >
            <span className="w-8 h-8 rounded-full bg-base-700 flex items-center justify-center text-sm shrink-0">
              {room.isPrivate ? '🔒' : '#'}
            </span>
            <span className="truncate text-sm font-medium">{room.name}</span>
          </button>
        ))}
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
