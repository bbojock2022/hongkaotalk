import { useState } from 'react';
import { validateRoomName, validateRoomPassword } from '../utils/validate';
import { sanitizeText } from '../utils/sanitize';
import { createRoom } from '../firebase/firestore';

export default function CreateRoomModal({ user, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeText(name);
    const nameErr = validateRoomName(cleanName);
    if (nameErr) return setError(nameErr);

    if (isPrivate) {
      const pwErr = validateRoomPassword(password);
      if (pwErr) return setError(pwErr);
    }

    setLoading(true);
    try {
      const roomId = await createRoom({
        name: cleanName,
        isPrivate,
        password: isPrivate ? password : null,
        ownerUid: user.uid,
        ownerNickname: user.displayName,
      });
      onCreated(roomId);
    } catch (err) {
      setError('채팅방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-sm p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">새 채팅방 만들기</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">채팅방 이름</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="예: 자유수다방"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-accent w-4 h-4"
            />
            비밀번호로 보호하기
          </label>

          {isPrivate && (
            <input
              type="password"
              className="input-field animate-fade-in"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="4자 이상"
            />
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-base-800">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? '생성 중...' : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
