import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

const MAX_IMAGE_MB = 5;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export async function uploadChatImage(roomId, uid, file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('png, jpg, gif, webp 형식의 이미지만 업로드할 수 있습니다.');
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error(`이미지는 ${MAX_IMAGE_MB}MB 이하만 업로드할 수 있습니다.`);
  }
  const path = `chat-images/${roomId}/${uid}-${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function uploadProfileImage(uid, file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('png, jpg, gif, webp 형식의 이미지만 업로드할 수 있습니다.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('프로필 이미지는 2MB 이하만 업로드할 수 있습니다.');
  }
  const path = `profile-images/${uid}-${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
