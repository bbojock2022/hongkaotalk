import { useState } from 'react';
import { verifyRoomPassword } from '../firebase/firestore';

export default function JoinPasswordModal({ room, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await verifyRoomPassword(room, password);
    setLoading(false);
    if (ok) {
      onSuccess();
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-xs p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-1">🔒 {room.name}</h2>
        <p className="text-xs text-gray-500 mb-4">비밀번호가 필요한 채팅방입니다.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="비밀번호 입력"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-base-800">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              입장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
