export default function MemberList({ members, onlineUsers }) {
  const onlineMap = new Map(onlineUsers.map((u) => [u.uid, u.state === 'online']));
  const sorted = [...members].sort((a, b) => (onlineMap.get(b.uid) ? 1 : 0) - (onlineMap.get(a.uid) ? 1 : 0));

  return (
    <div className="h-full bg-base-900 border-l border-base-800 flex flex-col">
      <div className="p-4 border-b border-base-800">
        <h2 className="text-sm font-semibold text-gray-400">참여자 — {members.length}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sorted.map((m) => {
          const isOnline = onlineMap.get(m.uid);
          return (
            <div key={m.uid} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-base-800">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-base-700 flex items-center justify-center text-xs font-semibold">
                  {(m.nickname || '?')[0].toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-base-900 ${
                    isOnline ? 'bg-online' : 'bg-base-600'
                  }`}
                />
              </div>
              <span className={`text-sm truncate ${isOnline ? 'text-gray-200' : 'text-gray-500'}`}>{m.nickname}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
