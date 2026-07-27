import { useState } from 'react';
import { logIn } from '../firebase/auth';
import { validateEmail, validatePassword } from '../utils/validate';

export default function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const emailErr = validateEmail(email);
    const pwErr = validatePassword(password);
    if (emailErr || pwErr) {
      setError(emailErr || pwErr);
      return;
    }

    setLoading(true);
    try {
      await logIn(email, password);
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-dvh flex items-center justify-center bg-base-950 px-4">
      <div className="card w-full max-w-sm p-8 animate-slide-up">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent mx-auto mb-3 flex items-center justify-center text-xl font-bold">
            W
          </div>
          <h1 className="text-xl font-semibold">Wavelength에 로그인</h1>
          <p className="text-sm text-gray-500 mt-1">실시간으로 대화를 이어가세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-danger animate-fade-in">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          계정이 없으신가요?{' '}
          <button onClick={onSwitchToSignup} className="text-accent-light hover:underline">
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
}

function mapAuthError(code) {
  const map = {
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'auth/user-not-found': '가입되지 않은 이메일입니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/too-many-requests': '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
  };
  return map[code] || '로그인에 실패했습니다. 다시 시도해주세요.';
}
