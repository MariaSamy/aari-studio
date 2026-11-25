(() => {
  if (navigator.globalPrivacyControl === true || !crypto.randomUUID) return;
  const sections = new Map([
    ['/', 'designs'], ['/index.html', 'designs'], ['/learn.html', 'training'],
    ['/mixer.html', 'mixer'], ['/practice.html', 'practice'], ['/payment.html', 'checkout'],
  ]);
  const section = sections.get(location.pathname);
  if (!section) return;
  const endpoint = new URL('/api/reporting/event', document.currentScript.src);
  const key = 'aari-reporting-browser-id';
  let browserId;
  try {
    browserId = localStorage.getItem(key);
    if (!browserId) {
      browserId = crypto.randomUUID();
      localStorage.setItem(key, browserId);
    }
  } catch {
    return;
  }

  function report(event) {
    const data = { browserId, event, eventId: crypto.randomUUID() };
    if (event === 'visit') data.section = section;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'omit',
      keepalive: true,
    }).catch(() => {});
  }
  report('visit');
  document.addEventListener('aari:training-unlocked', () => report('unlock'));
})();
