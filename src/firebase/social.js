import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from './config';

function pairId(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

// ---------- 친구 요청 ----------

export async function sendFriendRequest(fromUid, fromNickname, toUid, toNickname) {
  if (fromUid === toUid) throw new Error('자기 자신에게는 친구 요청을 보낼 수 없습니다.');
  await setDoc(doc(db, 'users', toUid, 'friendRequests', fromUid), {
    fromUid,
    fromNickname,
    toUid,
    toNickname,
    createdAt: serverTimestamp(),
  });
}

export function listenIncomingFriendRequests(myUid, callback) {
  return onSnapshot(collection(db, 'users', myUid, 'friendRequests'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function acceptFriendRequest(myUid, request) {
  const id = pairId(myUid, request.fromUid);
  await setDoc(doc(db, 'friendships', id), {
    members: [myUid, request.fromUid],
    createdAt: serverTimestamp(),
  });
  await deleteDoc(doc(db, 'users', myUid, 'friendRequests', request.fromUid));
}

export async function declineFriendRequest(myUid, fromUid) {
  await deleteDoc(doc(db, 'users', myUid, 'friendRequests', fromUid));
}

// ---------- 친구 목록 ----------

export function listenFriends(myUid, callback) {
  const q = query(collection(db, 'friendships'), where('members', 'array-contains', myUid));
  return onSnapshot(q, (snap) => {
    const friends = snap.docs.map((d) => {
      const data = d.data();
      const friendUid = data.members.find((m) => m !== myUid);
      return { pairId: d.id, uid: friendUid };
    });
    callback(friends);
  });
}

export async function removeFriend(myUid, friendUid) {
  await deleteDoc(doc(db, 'friendships', pairId(myUid, friendUid)));
}

// ---------- 채팅방 초대 ----------

export async function inviteToRoom(toUid, room, fromUid, fromNickname) {
  await addDoc(collection(db, 'users', toUid, 'roomInvites'), {
    roomId: room.id,
    roomName: room.name,
    fromUid,
    fromNickname,
    createdAt: serverTimestamp(),
  });
}

export function listenRoomInvites(myUid, callback) {
  return onSnapshot(collection(db, 'users', myUid, 'roomInvites'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function declineRoomInvite(myUid, inviteId) {
  await deleteDoc(doc(db, 'users', myUid, 'roomInvites', inviteId));
}
