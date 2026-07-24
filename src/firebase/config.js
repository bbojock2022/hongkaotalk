// ⚠️ 여기는 사용자가 직접 설정해야 합니다.
// Firebase 콘솔(https://console.firebase.google.com) > 프로젝트 설정 > 일반 > 내 앱
// 에서 발급받은 값을 .env 파일에 넣으세요. (.env.example 참고)
//
// 절대로 이 값들을 코드에 직접 하드코딩해서 GitHub에 올리지 마세요.
// Cloudflare Pages 배포 시에는 대시보드 > Settings > Environment variables 에
// 동일한 이름/값으로 등록해야 합니다.
//
// 이 프로젝트는 Firebase Storage를 사용하지 않습니다 (Spark 무료 플랜에서
// 완전히 무료로 동작하도록 Authentication + Firestore + Realtime Database만 사용).

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // 온라인 상태(접속/퇴장 감지)는 Firestore가 아닌 Realtime Database의
  // onDisconnect 기능으로 처리합니다 (브라우저가 갑자기 닫혀도 정확히 감지됨).
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// 필수 값이 비어있으면 개발 중 바로 알아챌 수 있도록 경고
const missing = Object.entries(firebaseConfig).filter(([, v]) => !v);
if (missing.length) {
  console.warn(
    '[Firebase] .env에 다음 값이 비어 있습니다:',
    missing.map(([k]) => k).join(', '),
    '\n→ .env.example을 복사해 .env를 만들고 Firebase 콘솔의 값을 채워주세요.'
  );
}

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
