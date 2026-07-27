export const LIMITS = {
  NICKNAME_MIN: 2,
  NICKNAME_MAX: 20,
  ROOM_NAME_MIN: 2,
  ROOM_NAME_MAX: 30,
  MESSAGE_MAX: 4000,
  ROOM_PASSWORD_MIN: 4,
};

export function validateNickname(nickname) {
  const v = (nickname || '').trim();
  if (v.length < LIMITS.NICKNAME_MIN || v.length > LIMITS.NICKNAME_MAX) {
    return `닉네임은 ${LIMITS.NICKNAME_MIN}~${LIMITS.NICKNAME_MAX}자여야 합니다.`;
  }
  if (!/^[a-zA-Z0-9가-힣_\- ]+$/.test(v)) {
    return '닉네임에는 한글, 영문, 숫자, -, _ 만 사용할 수 있습니다.';
  }
  return null;
}

export function validateEmail(email) {
  const v = (email || '').trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(v)) return '올바른 이메일 형식이 아닙니다.';
  return null;
}

export function validatePassword(password) {
  if (!password || password.length < 6) return '비밀번호는 6자 이상이어야 합니다.';
  if (password.length > 128) return '비밀번호가 너무 깁니다.';
  return null;
}

export function validateRoomName(name) {
  const v = (name || '').trim();
  if (v.length < LIMITS.ROOM_NAME_MIN || v.length > LIMITS.ROOM_NAME_MAX) {
    return `채팅방 이름은 ${LIMITS.ROOM_NAME_MIN}~${LIMITS.ROOM_NAME_MAX}자여야 합니다.`;
  }
  return null;
}

export function validateRoomPassword(pw) {
  if (!pw) return null; // 공개방은 비밀번호 없음
  if (pw.length < LIMITS.ROOM_PASSWORD_MIN) {
    return `방 비밀번호는 ${LIMITS.ROOM_PASSWORD_MIN}자 이상이어야 합니다.`;
  }
  return null;
}

export function validateMessage(text) {
  const v = (text || '').trim();
  if (!v) return '메시지를 입력하세요.';
  if (v.length > LIMITS.MESSAGE_MAX) return `메시지는 ${LIMITS.MESSAGE_MAX}자를 넘을 수 없습니다.`;
  return null;
}
