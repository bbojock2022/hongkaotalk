import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

export async function signUp(email, password, nickname) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: nickname });

  await setDoc(doc(db, 'users', cred.user.uid), {
    nickname,
    photoURL: null,
    status: 'online',
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await updateDoc(doc(db, 'users', cred.user.uid), {
    status: 'online',
    lastSeen: serverTimestamp(),
  }).catch(() => {});
  return cred.user;
}

export async function logOut() {
  const uid = auth.currentUser?.uid;
  if (uid) {
    await updateDoc(doc(db, 'users', uid), {
      status: 'offline',
      lastSeen: serverTimestamp(),
    }).catch(() => {});
  }
  await signOut(auth);
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
