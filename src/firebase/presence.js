import { ref, onValue, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { rtdb, db } from './config';

/**
 * 브라우저가 강제로 닫히거나 네트워크가 끊겨도 onDisconnect가 자동으로
 * "offline"으로 바꿔줍니다 (Cloud Functions 없이도 정확한 접속 감지 가능).
 */
export function initPresence(uid, nickname) {
  const myStatusRef = ref(rtdb, `status/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');

  const unsub = onValue(connectedRef, (snap) => {
    if (snap.val() === false) return;

    onDisconnect(myStatusRef)
      .set({ state: 'offline', nickname, lastChanged: rtdbServerTimestamp() })
      .then(() => {
        set(myStatusRef, { state: 'online', nickname, lastChanged: rtdbServerTimestamp() });
      });
  });

  return () => {
    unsub();
    set(myStatusRef, { state: 'offline', nickname, lastChanged: rtdbServerTimestamp() });
    updateDoc(doc(db, 'users', uid), { status: 'offline', lastSeen: serverTimestamp() }).catch(() => {});
  };
}

export function watchOnlineUsers(callback) {
  const statusRef = ref(rtdb, 'status');
  return onValue(statusRef, (snap) => {
    const val = snap.val() || {};
    const users = Object.entries(val).map(([uid, data]) => ({ uid, ...data }));
    callback(users);
  });
}
