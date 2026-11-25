const summaryProblem = document.getElementById('summary-problem');
const message = document.getElementById('record-message');
const form = document.getElementById('record-payment');
const date = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
});
const calendarDate = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' });
const number = new Intl.NumberFormat('en-IN');
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const sections = {
  designs: 'Ready-Made Designs', training: 'Training Gallery', mixer: 'Design Mixer',
  practice: 'My Practice', checkout: 'Checkout',
};

function updateTable(id, rows, emptyText, width) {
  if (!rows.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = width;
    cell.textContent = emptyText;
    row.append(cell);
    document.getElementById(id).replaceChildren(row);
    return;
  }
  document.getElementById(id).replaceChildren(...rows.map(values => {
    const row = document.createElement('tr');
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  }));
}

async function refreshSummary() {
  try {
    const response = await fetch('/admin/reporting/summary', { cache: 'no-store' });
    if (!response.ok) throw new Error('Summary unavailable.');
    const stats = await response.json();
    document.getElementById('measurement-period').textContent =
      'Measurement began ' + date.format(new Date(stats.startedAt)) + ' India time.';
    document.getElementById('tracked-browsers').textContent = number.format(stats.trackedBrowsers);
    document.getElementById('page-opens').textContent = number.format(stats.pageOpens);
    document.getElementById('unverified-unlocks').textContent = number.format(stats.unverifiedUnlocks);
    document.getElementById('confirmed-payments').textContent = number.format(stats.confirmedPayments);
    document.getElementById('confirmed-total').textContent = rupees.format(stats.confirmedAmountPaise / 100);
    updateTable('recent-payments', stats.recentPayments.map(payment => [
      payment.referenceSuffix, rupees.format(payment.amountPaise / 100),
      payment.creditDate ? calendarDate.format(new Date(payment.creditDate + 'T00:00:00Z')) : 'Not entered',
      date.format(new Date(payment.recordedAt)),
    ]), 'No payments recorded yet.', 4);
    const counts = new Map(stats.bySection.map(row => [row.section, row]));
    updateTable('page-activity', Object.entries(sections).map(([key, label]) => [
      label, number.format(counts.get(key)?.opens ?? 0), number.format(counts.get(key)?.browsers ?? 0),
    ]), 'No page opens recorded yet.', 3);
    updateTable('recent-activity', stats.recentActivity.map(event => {
      const label = event.kind === 'view' ? 'Opened ' + sections[event.section]
        : event.kind === 'unlock' ? 'Training unlocked (unverified)' : 'Confirmed ₹99 payment recorded';
      return [label, date.format(new Date(event.occurredAt))];
    }), 'No activity recorded yet.', 2);
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
        creditDate: document.getElementById('credit-date').value,
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
