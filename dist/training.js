const trainingLessons = byId('training-lessons');
const referenceForm = byId('member-reference-form');
const paymentReference = byId('member-reference');
const trainingSubmit = referenceForm.querySelector('button');
const trainingRetry = byId('training-retry');
const trainingAccessKey = 'aari-training-access';
const trainingDay = 24 * 60 * 60 * 1000;
const trainingDuration = 30 * trainingDay;
let trainingAccess;
let course;
let memberMessage;
let expiryTimer;

function hasTrainingAccess() {
  return trainingAccess?.expiresAt > Date.now();
}

function renderTraining() {
  const t = copy[state.language];
  const active = hasTrainingAccess();
  byId('member-message').textContent = memberMessage ? t[memberMessage] : '';
  byId('member-payment').hidden = active || !trainingAccess;
  trainingRetry.hidden = !(active && !course && memberMessage === 'memberTryAgain');
  trainingLessons.hidden = !active || !course;
  byId('ready-training-link').hidden = trainingLessons.hidden;
  if (trainingLessons.hidden) {
    trainingLessons.replaceChildren();
    return;
  }

  const heading = document.createElement('h3');
  heading.textContent = t.trainingLessons;
  const expiry = document.createElement('p');
  const date = new Intl.DateTimeFormat(state.language === 'ta' ? 'ta-IN' : 'en-IN', { dateStyle: 'long' });
  expiry.textContent = t.memberExpires + ' ' + date.format(trainingAccess.expiresAt);
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
  trainingLessons.replaceChildren(heading, expiry, ...lessons);
}

function readTrainingAccess() {
  const raw = localStorage.getItem(trainingAccessKey);
  if (!raw) return { expiresAt: 0, usedReferences: [] };
  try {
    const saved = JSON.parse(raw);
    if (Number.isFinite(saved?.expiresAt) && Array.isArray(saved.usedReferences)) return saved;
  } catch {
    // A malformed record cannot grant access.
  }
  return { expiresAt: 0, usedReferences: [] };
}

async function loadTrainingCourse() {
  if (course) return;
  const response = await fetch('training-lessons.json');
  if (!response.ok) throw new Error('Training lessons are unavailable.');
  course = await response.json();
}

async function showExistingTraining() {
  memberMessage = undefined;
  renderTraining();
  try {
    await loadTrainingCourse();
  } catch {
    memberMessage = 'memberTryAgain';
  }
  renderTraining();
}

function checkTrainingExpiry() {
  clearTimeout(expiryTimer);
  const remaining = trainingAccess.expiresAt - Date.now();
  if (remaining > 0) {
    expiryTimer = setTimeout(checkTrainingExpiry, Math.min(remaining, trainingDay));
    return;
  }
  if (trainingAccess.expiresAt) memberMessage = 'memberInvalid';
  renderTraining();
}

paymentReference.addEventListener('input', () => {
  paymentReference.setCustomValidity('');
  memberMessage = undefined;
  byId('member-message').textContent = '';
});

referenceForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (trainingSubmit.disabled || hasTrainingAccess()) return;
  const reference = paymentReference.value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{4,46}[A-Z0-9]$/.test(reference)) {
    paymentReference.setCustomValidity(copy[state.language].memberBadReference);
    paymentReference.reportValidity();
    return;
  }

  trainingSubmit.disabled = true;
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(reference));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    await loadTrainingCourse();
    const saved = readTrainingAccess();
    if (saved.expiresAt > Date.now()) {
      trainingAccess = saved;
    } else if (saved.usedReferences.includes(hash)) {
      memberMessage = 'memberReferenceUsed';
      return;
    } else {
      const access = { expiresAt: Date.now() + trainingDuration, usedReferences: [...saved.usedReferences, hash] };
      localStorage.setItem(trainingAccessKey, JSON.stringify(access));
      trainingAccess = access;
    }
    paymentReference.value = '';
    memberMessage = 'memberReady';
    checkTrainingExpiry();
    renderTraining();
    location.hash = 'ready-designs';
    byId('ready-designs').scrollIntoView();
    byId('ready-title').focus({ preventScroll: true });
  } catch {
    memberMessage = 'memberTryAgain';
  } finally {
    trainingSubmit.disabled = false;
    renderTraining();
  }
});

function initTraining() {
  try {
    if (!crypto.subtle) throw new Error('This browser does not support payment reference hashing.');
    trainingAccess = readTrainingAccess();
    localStorage.setItem(trainingAccessKey, JSON.stringify(trainingAccess));
    trainingSubmit.disabled = false;
  } catch {
    trainingAccess = undefined;
    memberMessage = 'memberStorageUnavailable';
    renderTraining();
    return;
  }
  checkTrainingExpiry();
  renderTraining();
  if (hasTrainingAccess()) showExistingTraining();
}

trainingRetry.addEventListener('click', showExistingTraining);
byId('language').addEventListener('click', renderTraining);
initTraining();
