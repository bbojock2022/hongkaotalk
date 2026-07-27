import { useState } from 'react';
import Avatar from './Avatar';
import { updateUserProfile } from '../firebase/firestore';

export const AVATAR_COLORS = [
  '#5865f2', '#eb459e', '#ed4245', '#faa61a',
  '#3ba55d', '#00b0f4', '#9b59b6', '#607d8b',
];

const AVATAR_EMOJIS = ['😀', '😎', '🐱', '🐶', '🦊', '🐼', '🐧', '🦉', '🌟', '🔥', '🍀', '🎧', '🎨', '⚡', '🌙', '👾'];

export default function ProfileModal({ user, profile, onClose }) {
  const [avatarColor, setAvatarColor] = useState(profile?.avatarColor || AVATAR_COLORS[0]);
  const [avatarEmoji, setAvatarEmoji] = useState(profile?.avatarEmoji || '');
  const [statusMessage, setStatusMessage] = useState(profile?.statusMessage || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        avatarColor,
        avatarEmoji: avatarEmoji || null,
        statusMessage: statusMessage.trim().slice(0, 40),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-sm p-6 animate-pop" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">프로필 꾸미기</h2>

        <div className="flex flex-col items-center mb-5">
          <Avatar nickname={user.displayName} avatarColor={avatarColor} avatarEmoji={avatarEmoji} className="w-16 h-16 text-2xl mb-2" />
          <p className="text-sm font-medium">{user.displayName}</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1.5">아바타 색상</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setAvatarColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  avatarColor === c ? 'ring-2 ring-offset-2 ring-offset-base-850 ring-white scale-105' : ''
                }`}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1.5">아바타 이모지 (선택)</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setAvatarEmoji('')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${
                avatarEmoji === '' ? 'border-accent bg-accent/10' : 'border-base-700 hover:bg-base-800'
              }`}
              title="이니셜 사용"
            >
              Aa
            </button>
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setAvatarEmoji(e)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border ${
                  avatarEmoji === e ? 'border-accent bg-accent/10' : 'border-base-700 hover:bg-base-800'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-1.5">상태 메시지</label>
          <input
            className="input-field"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            maxLength={40}
            placeholder="예: 오늘도 화이팅 🔥"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-base-800">
            닫기
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? '저장 중...' : saved ? '저장됨 ✓' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
