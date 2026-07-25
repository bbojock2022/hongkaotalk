import { useState } from 'react';
import { validateRoomName, validateRoomPassword } from '../utils/validate';
import { sanitizeText } from '../utils/sanitize';
import { createRoom } from '../firebase/firestore';

const TYPE_OPTIONS = [
  { value: 'open', label: '오픈채팅', desc: '누구나 메인 목록에서 보고 자유롭게 입장' },
  { value: 'team', label: '팀채팅', desc: '초대받은 사람만 입장 (업무/소모임용)' },
  { value: 'group', label: '단체채팅', desc: '초대받은 사람만 입장 (친목/모임용)' },
];

export default function CreateRoomModal({ user, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('open');
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
        type,
        isPrivate,
        password: isPrivate ? password : null,
        ownerUid: user.uid,
        ownerNickname: user.displayName,
      });
      onCreated(roomId, type);
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
            <label className="block text-xs text-gray-400 mb-1">종류</label>
            <div className="space-y-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    type === opt.value ? 'border-accent bg-accent/10' : 'border-base-700 hover:bg-base-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="roomType"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={() => setType(opt.value)}
                    className="accent-accent mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{opt.label}</span>
                    <span className="block text-xs text-gray-500">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">채팅방 이름</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="예: 자유수다방"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-accent w-4 h-4"
            />
            비밀번호로 보호하기 (계정별로 1회만 입력하면 이후 자동 입장)
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
