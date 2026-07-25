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

// 메인 화면에는 '오픈채팅'만 노출 (팀/단체채팅은 초대로만 접근, DM은 별도 목록)
// where + orderBy 조합은 복합 인덱스가 필요할 수 있어, 정렬은 클라이언트에서 처리합니다.
export function listenOpenRooms(callback) {
  const q = query(collection(db, 'rooms'), where('type', '==', 'open'));
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rooms.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(rooms);
  });
}

export async function createRoom({ name, type = 'open', isPrivate, password, ownerUid, ownerNickname }) {
  let passwordHash = null;
  let salt = null;
  if (isPrivate && password) {
    salt = generateSalt();
    passwordHash = await hashRoomPassword(password, salt);
  }

  const roomRef = await addDoc(collection(db, 'rooms'), {
    name,
    type, // 'open' | 'team' | 'group'
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

// ---------- 계정별 비밀번호 1회 입력 기억 ----------

export async function isRoomUnlockedForUser(uid, roomId) {
  const snap = await getDoc(doc(db, 'users', uid, 'unlockedRooms', roomId));
  return snap.exists();
}

export async function markRoomUnlocked(uid, roomId) {
  await setDoc(doc(db, 'users', uid, 'unlockedRooms', roomId), {
    unlockedAt: serverTimestamp(),
  });
}

// ---------- 내가 참여 중인 방 목록 (팀/단체/DM 사이드바용) ----------

export async function upsertMyRoom(uid, room, extra = {}) {
  await setDoc(
    doc(db, 'users', uid, 'myRooms', room.id),
    {
      roomId: room.id,
      type: room.type,
      name: room.name,
      isPrivate: !!room.isPrivate,
      ownerUid: room.ownerUid,
      updatedAt: serverTimestamp(),
      ...extra,
    },
    { merge: true }
  );
}

export async function removeMyRoom(uid, roomId) {
  await deleteDoc(doc(db, 'users', uid, 'myRooms', roomId)).catch(() => {});
}

export function listenMyRooms(uid, callback) {
  return onSnapshot(collection(db, 'users', uid, 'myRooms'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
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
  await setDoc(doc(db, 'rooms', roomId, 'banned', uid), {
    bannedAt: serverTimestamp(),
  });
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
