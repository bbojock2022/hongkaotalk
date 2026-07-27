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

// 소리는 아직 없음(요청대로 추후 추가) — silent: true
export function showMessageNotification({ title, body, tag, onClick }) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  // 지금 실제로 탭을 보고 있으면 굳이 알림을 띄우지 않음(카톡/디스코드와 동일한 동작)
  if (document.visibilityState === 'visible' && document.hasFocus()) return;

  try {
    const notif = new Notification(title, {
      body,
      tag, // 같은 tag는 겹쳐 쌓이지 않고 갱신됨 (방별로 tag를 다르게 주면 방마다 최신 1개만 유지)
      silent: true,
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
