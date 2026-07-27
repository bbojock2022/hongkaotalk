import { useEffect, useState } from 'react';
import { watchAuth } from './firebase/auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChatApp from './pages/ChatApp';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = 로딩중, null = 미로그인
  const [mode, setMode] = useState('login');

  useEffect(() => {
    const unsub = watchAuth(setUser);
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div className="h-dvh flex items-center justify-center bg-base-950">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return mode === 'login' ? (
      <Login onSwitchToSignup={() => setMode('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setMode('login')} />
    );
  }

  return <ChatApp user={user} />;
}
