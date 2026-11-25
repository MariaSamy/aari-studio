(() => {
  if (navigator.globalPrivacyControl === true || !crypto.randomUUID) return;
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
    const data = { browserId, event };
    if (event === 'unlock') data.eventId = crypto.randomUUID();
    fetch('/api/reporting/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {});
  }
  report('visit');
  document.addEventListener('aari:training-unlocked', () => report('unlock'));
})();
