import { useState } from 'react';
import { signUp } from '../firebase/auth';
import { validateEmail, validatePassword, validateNickname } from '../utils/validate';

export default function Signup({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const emailErr = validateEmail(email);
    const pwErr = validatePassword(password);
    const nickErr = validateNickname(nickname);
    const firstError = emailErr || pwErr || nickErr;
    if (firstError) {
      setError(firstError);
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, nickname.trim());
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-base-950 px-4">
      <div className="card w-full max-w-sm p-8 animate-slide-up">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent mx-auto mb-3 flex items-center justify-center text-xl font-bold">
            W
          </div>
          <h1 className="text-xl font-semibold">Wavelength 시작하기</h1>
          <p className="text-sm text-gray-500 mt-1">몇 초면 대화방에 들어갈 수 있어요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">닉네임</label>
            <input
              className="input-field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="2~20자"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">이메일</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">비밀번호</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-danger animate-fade-in">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          이미 계정이 있으신가요?{' '}
          <button onClick={onSwitchToLogin} className="text-accent-light hover:underline">
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}

function mapAuthError(code) {
  const map = {
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
    'auth/weak-password': '비밀번호가 너무 약합니다.',
  };
  return map[code] || '회원가입에 실패했습니다. 다시 시도해주세요.';
}
