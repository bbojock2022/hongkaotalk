const MUTE_KEY = 'wavelength_notif_muted';

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function isSoundMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // localStorage 접근이 막힌 환경(사생활 보호 모드 등)이면 조용히 무시
  }
}

let audioCtx = null;
function getAudioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

// 브라우저의 자동재생 정책 때문에, 사용자가 버튼을 누르는 등 실제 상호작용이 있었던
// 시점에 한 번 호출해서 AudioContext를 미리 준비/재개해두면, 이후 백그라운드 탭에서도
// 소리가 안정적으로 재생됩니다. ("알림 켜기" 버튼 클릭 시 호출)
export function initNotificationSound() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

// 파일 없이 Web Audio API로 짧은 2음 차임벨 소리를 생성합니다 (디스코드/카톡 알림음과 비슷한 느낌).
export function playNotificationSound() {
  if (isSoundMuted()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const notes = [
    { freq: 880, start: 0, dur: 0.14 },
    { freq: 1174.66, start: 0.09, dur: 0.22 },
  ];
  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.22, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.02);
  });
}

export function showMessageNotification({ title, body, tag, onClick }) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  // 지금 실제로 탭을 보고 있으면 굳이 알림을 띄우지 않음(카톡/디스코드와 동일한 동작)
  if (document.visibilityState === 'visible' && document.hasFocus()) return;

  playNotificationSound();

  try {
    const notif = new Notification(title, {
      body,
      tag, // 같은 tag는 겹쳐 쌓이지 않고 갱신됨 (방별로 tag를 다르게 주면 방마다 최신 1개만 유지)
      silent: true, // OS 기본음 대신 위에서 생성한 차임벨 소리를 사용
    });
    notif.onclick = () => {
      window.focus();
      onClick?.();
      notif.close();
    };
  } catch {
    // 일부 브라우저(특히 모바일)는 new Notification() 생성자를 지원하지 않을 수 있음 — 조용히 무시
  }
}
