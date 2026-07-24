/**
 * 간단한 클라이언트 사이드 rate limiter.
 * Cloud Functions 없이도 최소한의 스팸 방지가 되도록,
 * 짧은 시간에 너무 많은 메시지를 보내면 막습니다.
 * (진짜 방어선은 firestore.rules 의 시간 검증 규칙입니다 — 클라이언트 체크는 UX용 보조 수단)
 */
export class MessageRateLimiter {
  constructor({ maxMessages = 5, windowMs = 10000 } = {}) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
    this.timestamps = [];
  }

  canSend() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxMessages) return false;
    this.timestamps.push(now);
    return true;
  }

  msUntilNextSlot() {
    if (this.timestamps.length === 0) return 0;
    return Math.max(0, this.windowMs - (Date.now() - this.timestamps[0]));
  }
}
