/**
 * Spark(무료) 플랜에는 Cloud Functions를 배포할 수 없으므로,
 * 방 비밀번호는 서버가 아닌 브라우저의 Web Crypto API(SHA-256 + salt)로 해시해서
 * Firestore에는 평문이 아닌 해시값만 저장합니다.
 *
 * ⚠️ 주의: 이는 "평문 노출"은 막아주지만, 진짜 서버사이드 인증만큼 안전하지는 않습니다.
 * Blaze로 업그레이드하면 Cloud Functions에서 검증하도록 옮기는 것을 권장합니다.
 * (README의 "보안 한계" 섹션 참고)
 */
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashRoomPassword(password, salt) {
  return sha256(`${salt}:${password}`);
}

export function generateSalt() {
  const arr = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}
