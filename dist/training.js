const trainingLessons = byId('training-lessons');
const referenceForm = byId('member-reference-form');
const paymentReference = byId('member-reference');
const memberStorageKey = 'aari-membership-code';
const manualClaimKey = 'aari-manual-claim-key';
let course;
let memberCode;
let memberMessage;
let manualUpiAvailable = false;
let paymentCheck;
let paymentTimer;

function renderTraining() {
  const t = copy[state.language];
  byId('member-message').textContent = memberMessage ? t[memberMessage] : '';
  byId('member-payment').hidden = !manualUpiAvailable || Boolean(course);
  byId('member-status').hidden = manualUpiAvailable;
  trainingLessons.hidden = !course;
  if (!course) {
    trainingLessons.replaceChildren();
    return;
  }

  const heading = document.createElement('h3');
  heading.textContent = t.trainingLessons;
  const locale = course[state.language];
  const openLesson = trainingLessons.querySelector('details[open]')?.dataset.lesson;
  const lessons = locale.map((lesson, index) => {
    const panel = document.createElement('details');
    panel.dataset.lesson = String(index);
    panel.open = openLesson ? openLesson === panel.dataset.lesson : index === 0;
    const title = document.createElement('summary');
    title.textContent = lesson.title;
    const goal = document.createElement('p');
    goal.textContent = lesson.goal;
    const steps = document.createElement('ol');
    for (const text of lesson.steps) {
      const step = document.createElement('li');
      step.textContent = text;
      steps.append(step);
    }
    const exercise = document.createElement('p');
    exercise.className = 'exercise';
    const label = document.createElement('strong');
    label.textContent = t.trainingExercise;
    exercise.append(label, ' ', lesson.exercise);
    const check = document.createElement('p');
    check.textContent = lesson.check;
    panel.append(title, goal, steps, exercise, check);
    return panel;
  });
  trainingLessons.replaceChildren(heading, ...lessons);
}

async function loadTrainingLessons(code) {
  try {
    const response = await fetch('/api/membership/training', {
      headers: { Authorization: 'Bearer ' + code },
    });
    if (response.status === 403) {
      localStorage.removeItem(memberStorageKey);
      sessionStorage.removeItem(memberStorageKey);
      memberMessage = 'memberInvalid';
      renderTraining();
      return false;
    }
    if (!response.ok) throw new Error('Training unavailable.');
    course = await response.json();
    memberCode = code;
    try {
      localStorage.setItem(memberStorageKey, code);
    } catch {
      // Training remains available in the current tab.
    }
    renderTraining();
    return true;
  } catch {
    memberMessage = 'memberTryAgain';
    renderTraining();
    return false;
  }
}

async function loadMembership() {
  try {
    const response = await fetch('/api/membership/config');
    if (!response.ok) return;
    const config = await response.json();
    if (!config.available) return;
    manualUpiAvailable = config.manualUpi === true;
    renderTraining();
    const stored = localStorage.getItem(memberStorageKey) || sessionStorage.getItem(memberStorageKey);
    if (stored && manualUpiAvailable) await loadTrainingLessons(stored);
  } catch {
    // Enrollment stays closed when the payment service is unavailable.
  }
}

async function sendMembershipRequest(path, data) {
  return fetch('/api/membership' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

function stopCheckingPayment() {
  clearTimeout(paymentTimer);
  paymentCheck = undefined;
}

async function verifyDirectPayment(check) {
  const submit = referenceForm.querySelector('button');
  submit.disabled = true;
  try {
    const response = await sendMembershipRequest('/manual/claim', check);
    if (paymentCheck !== check || memberCode) return;
    if (response.status === 200) {
      if (!await loadTrainingLessons(check.code)) {
        stopCheckingPayment();
        return;
      }
      try {
        localStorage.removeItem(manualClaimKey);
      } catch {
        // Access is already saved in memory.
      }
      stopCheckingPayment();
      paymentReference.value = '';
      memberMessage = 'memberReady';
      renderTraining();
      trainingLessons.focus();
    } else if (response.status === 202 || response.status === 429) {
      memberMessage = 'memberPending';
      paymentTimer = setTimeout(() => verifyDirectPayment(check), 15000);
    } else {
      stopCheckingPayment();
      memberMessage = response.status === 409 ? 'memberReferenceUsed' : 'memberTryAgain';
    }
  } catch {
    if (paymentCheck !== check) return;
    stopCheckingPayment();
    memberMessage = 'memberTryAgain';
  } finally {
    submit.disabled = false;
    byId('member-message').textContent = memberMessage ? copy[state.language][memberMessage] : '';
  }
}

paymentReference.addEventListener('input', () => {
  paymentReference.setCustomValidity('');
  stopCheckingPayment();
  memberMessage = undefined;
  byId('member-message').textContent = '';
});
referenceForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!manualUpiAvailable || memberCode) return;
  const reference = paymentReference.value.trim();
  const t = copy[state.language];
  if (!/^[A-Z0-9][A-Z0-9-]{4,46}[A-Z0-9]$/i.test(reference)) {
    paymentReference.setCustomValidity(t.memberBadReference);
    paymentReference.reportValidity();
    return;
  }
  clearTimeout(paymentTimer);
  let code = paymentCheck?.code;
  if (!code) {
    try {
      code = localStorage.getItem(manualClaimKey);
    } catch {
      // This tab can still claim a payment when browser storage is unavailable.
    }
    if (!/^[A-F0-9]{20}$/.test(code ?? '')) {
      code = Array.from(crypto.getRandomValues(new Uint8Array(10)), byte =>
        byte.toString(16).padStart(2, '0')).join('').toUpperCase();
      try {
        localStorage.setItem(manualClaimKey, code);
      } catch {
        // Keep the random claim key in memory for this tab.
      }
    }
  }
  paymentCheck = { reference, code };
  verifyDirectPayment(paymentCheck);
});

byId('language').addEventListener('click', renderTraining);
renderTraining();
loadMembership();
