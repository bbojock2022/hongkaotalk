import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import { hashRoomPassword, generateSalt } from '../utils/hash';

// ---------- 채팅방 ----------

export function listenRooms(callback) {
  const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createRoom({ name, isPrivate, password, ownerUid, ownerNickname }) {
  let passwordHash = null;
  let salt = null;
  if (isPrivate && password) {
    salt = generateSalt();
    passwordHash = await hashRoomPassword(password, salt);
  }

  const roomRef = await addDoc(collection(db, 'rooms'), {
    name,
    isPrivate: !!isPrivate,
    passwordHash,
    salt,
    ownerUid,
    ownerNickname,
    memberCount: 1,
    createdAt: serverTimestamp(),
  });
  return roomRef.id;
}

export async function verifyRoomPassword(room, attempt) {
  if (!room.isPrivate) return true;
  if (!room.passwordHash || !room.salt) return true;
  const attemptHash = await hashRoomPassword(attempt, room.salt);
  return attemptHash === room.passwordHash;
}

export async function deleteRoom(roomId) {
  await deleteDoc(doc(db, 'rooms', roomId));
}

export async function getRoomById(roomId) {
  const snap = await getDoc(doc(db, 'rooms', roomId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ---------- 참여자(방 멤버) ----------

export async function joinRoomMembers(roomId, uid, nickname) {
  await setDoc(doc(db, 'rooms', roomId, 'members', uid), {
    nickname,
    joinedAt: serverTimestamp(),
  });
}

export async function leaveRoomMembers(roomId, uid) {
  await deleteDoc(doc(db, 'rooms', roomId, 'members', uid)).catch(() => {});
}

export async function kickMember(roomId, uid) {
  await deleteDoc(doc(db, 'rooms', roomId, 'members', uid));
}

export function listenRoomMembers(roomId, callback) {
  return onSnapshot(collection(db, 'rooms', roomId, 'members'), (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  });
}

// ---------- 메시지 ----------

export function listenMessages(roomId, callback, messageLimit = 100) {
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(messageLimit)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function sendMessage(roomId, { senderUid, senderNickname, text, replyTo, mentions }) {
  await addDoc(collection(db, 'rooms', roomId, 'messages'), {
    senderUid,
    senderNickname,
    text: text || null,
    replyTo: replyTo || null,
    mentions: mentions || [],
    deleted: false,
    createdAt: serverTimestamp(),
  });
}

export async function deleteMessage(roomId, messageId) {
  await updateDoc(doc(db, 'rooms', roomId, 'messages', messageId), {
    deleted: true,
    text: null,
  });
}

export async function sendSystemMessage(roomId, text) {
  await addDoc(collection(db, 'rooms', roomId, 'messages'), {
    senderUid: 'system',
    senderNickname: '시스템',
    text,
    system: true,
    createdAt: serverTimestamp(),
  });
}

export async function searchMessages(roomId, keyword) {
  // Firestore는 부분 문자열 검색을 기본 지원하지 않으므로,
  // 소규모 방 기준으로 클라이언트에서 필터링합니다.
  const snap = await getDocs(collection(db, 'rooms', roomId, 'messages'));
  const kw = keyword.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => !m.deleted && m.text && m.text.toLowerCase().includes(kw));
}

// ---------- 유저 검색 (친구 추가용) ----------

export async function findUsersByNickname(nickname) {
  const q = query(collection(db, 'users'), where('nickname', '==', nickname.trim()));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
