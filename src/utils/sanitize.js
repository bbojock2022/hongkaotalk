import DOMPurify from 'dompurify';

/**
 * 사용자 입력(메시지, 닉네임, 방 이름 등)을 렌더링하기 전에 반드시 이 함수를 거칩니다.
 * 태그를 전부 제거하고 순수 텍스트만 남깁니다 (메시지에 HTML을 허용하지 않는 정책).
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  const clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return clean.trim();
}

/** 표시용으로 줄바꿈만 허용하고 싶을 때 (메시지 본문 렌더링) */
export function sanitizeMultiline(input) {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: ['br'], ALLOWED_ATTR: [] });
}
