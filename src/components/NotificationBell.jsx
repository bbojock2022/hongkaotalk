import { useEffect, useState } from 'react';
import { sanitizeText } from '../utils/sanitize';
import {
  listenIncomingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  listenRoomInvites,
  declineRoomInvite,
} from '../firebase/social';

export default function NotificationBell({ user, onJoinRoomInvite }) {
  const [requests, setRequests] = useState([]);
  const [invites, setInvites] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub1 = listenIncomingFriendRequests(user.uid, setRequests);
    const unsub2 = listenRoomInvites(user.uid, setInvites);
    return () => {
      unsub1();
      unsub2();
    };
  }, [user.uid]);

  const total = requests.length + invites.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="알림"
        className="relative text-gray-400 hover:text-gray-200 px-2 py-1"
      >
        🔔
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 card w-72 max-h-96 overflow-y-auto z-30 animate-pop p-2">
          {total === 0 && <p className="text-xs text-gray-500 text-center py-6">새 알림이 없어요.</p>}

          {requests.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 px-2 py-1">친구 요청</p>
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-base-800">
                  <span className="text-sm truncate">{sanitizeText(r.fromNickname)}</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={async () => {
                        await acceptFriendRequest(user.uid, r);
                      }}
                      className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent-light"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => declineFriendRequest(user.uid, r.fromUid)}
                      className="text-xs px-2 py-1 rounded bg-base-700 hover:bg-base-600 text-gray-300"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {invites.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 px-2 py-1">초대 / 대화 신청</p>
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-base-800">
                  <span className="text-sm truncate">
                    {inv.roomType === 'dm'
                      ? `${sanitizeText(inv.fromNickname)}님이 1:1 대화를 신청했어요`
                      : `${sanitizeText(inv.fromNickname)} → #${sanitizeText(inv.roomName)}`}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={async () => {
                        await onJoinRoomInvite(inv);
                        setOpen(false);
                      }}
                      className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent-light"
                    >
                      입장
                    </button>
                    <button
                      onClick={() => declineRoomInvite(user.uid, inv.id)}
                      className="text-xs px-2 py-1 rounded bg-base-700 hover:bg-base-600 text-gray-300"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
