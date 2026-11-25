const summaryProblem = document.getElementById('summary-problem');
const message = document.getElementById('record-message');
const form = document.getElementById('record-payment');
const date = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
});
const number = new Intl.NumberFormat('en-IN');

async function refreshSummary() {
  try {
    const response = await fetch('/admin/reporting/summary', { cache: 'no-store' });
    if (!response.ok) throw new Error('Summary unavailable.');
    const stats = await response.json();
    document.getElementById('measurement-period').textContent =
      'Measurement began ' + date.format(new Date(stats.startedAt)) + ' India time.';
    document.getElementById('tracked-browsers').textContent = number.format(stats.trackedBrowsers);
    document.getElementById('unverified-unlocks').textContent = number.format(stats.unverifiedUnlocks);
    document.getElementById('confirmed-payments').textContent = number.format(stats.confirmedPayments);
    const entries = stats.recentPayments.map(payment => {
      const item = document.createElement('li');
      item.textContent = '₹99 · Reference ending ' + payment.referenceSuffix + ' · ' +
        date.format(new Date(payment.recordedAt)) + ' India time';
      return item;
    });
    if (entries.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'No payments recorded yet.';
      entries.push(item);
    }
    document.getElementById('recent-payments').replaceChildren(...entries);
    summaryProblem.textContent = '';
  } catch {
    summaryProblem.textContent = 'The counts could not be refreshed.';
  }
}

document.getElementById('refresh-metrics').addEventListener('click', refreshSummary);
form.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = form.querySelector('button');
  submit.disabled = true;
  message.textContent = '';
  try {
    const response = await fetch('/admin/reporting/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: document.getElementById('reference').value,
        bankCreditMatched: document.getElementById('matched').checked,
        amountPaise: 9900,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      message.textContent = error.error || 'Payment could not be recorded.';
      return;
    }
    form.reset();
    message.textContent = '₹99 payment recorded.';
    await refreshSummary();
  } catch {
    message.textContent = 'Please check the recent records before retrying.';
  } finally {
    submit.disabled = false;
  }
});
refreshSummary();
