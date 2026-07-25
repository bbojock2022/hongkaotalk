import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  getDoc,
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

// ---------- 채팅방 초대 (팀/단체채팅 초대 + 1:1 대화 신청 알림) ----------

export async function inviteToRoom(toUid, room, fromUid, fromNickname) {
  await addDoc(collection(db, 'users', toUid, 'roomInvites'), {
    roomId: room.id,
    roomName: room.name,
    roomType: room.type || 'group',
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

// ---------- 1:1 다이렉트 메시지(DM) ----------

export function dmRoomId(uidA, uidB) {
  return `dm_${pairId(uidA, uidB)}`;
}

/**
 * 이미 있으면 그 방으로, 없으면 새로 만들고 상대방에게 알림(roomInvites)을 보냅니다.
 * 상대방은 본인이 직접 join(self-write)해야 하므로, 알림을 열어 "입장"을 눌러야 대화방에 들어옵니다
 * (Cloud Functions 없이도 다른 사람의 데이터를 대신 쓰지 않도록 하기 위한 구조).
 */
export async function startDirectMessage(myUid, myNickname, friendUid, friendNickname) {
  const roomId = dmRoomId(myUid, friendUid);
  const roomRef = doc(db, 'rooms', roomId);
  const existing = await getDoc(roomRef);

  if (!existing.exists()) {
    await setDoc(roomRef, {
      name: '다이렉트 메시지',
      type: 'dm',
      isPrivate: false,
      passwordHash: null,
      salt: null,
      ownerUid: myUid,
      ownerNickname: myNickname,
      dmParticipants: [myUid, friendUid],
      memberCount: 2,
      createdAt: serverTimestamp(),
    });
    await inviteToRoom(friendUid, { id: roomId, name: `${myNickname}님과의 1:1 대화`, type: 'dm' }, myUid, myNickname);
  }

  return { id: roomId, name: '다이렉트 메시지', type: 'dm', dmParticipants: [myUid, friendUid], ownerUid: myUid };
}
