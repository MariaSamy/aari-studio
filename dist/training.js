const trainingLessons = byId('training-lessons');
const referenceForm = byId('member-reference-form');
const paymentReference = byId('member-reference');
const trainingSubmit = referenceForm?.querySelector('button');
const galleryRetry = byId('training-gallery-retry');
const mixerTool = byId('mixer-tool');
const checkoutFromMixer = new URLSearchParams(location.search).get('from') === 'mixer';
const trainingAccessKey = 'aari-training-access';
const trainingDay = 24 * 60 * 60 * 1000;
const trainingDuration = 30 * trainingDay;
let trainingAccess;
let course;
let memberMessage;
let expiryTimer;

const trainingMedia = {
  beads: { image: 'beads-demo-poster.png', video: 'beads-demo', caption: 'trainingBeadsDemo' },
  flower: {
    image: 'floral-motif.png', pdf: 'small-flower-a4.pdf',
    alt: {
      en: 'A five-petal tracing, a stitched outline and a gold bead in the centre.',
      ta: 'வரைந்த ஐந்து இதழ்கள், தைத்த வெளிக்கோடு, நடுவில் தங்க நிற மணி.',
    },
  },
  backstitch: {
    image: 'backstitch.png',
    alt: {
      en: 'Three steps showing how to come up ahead and stitch back to the previous hole.',
      ta: 'ஊசியை முன்னால் எடுத்து முந்தைய துளைக்குப் பின்னோக்கித் தைக்கும் மூன்று படிகள்.',
    },
  },
  spiral: {
    image: 'spiral-chain.png',
    alt: {
      en: 'A spiral guide with short chain stitches at the centre and wider turns farther out.',
      ta: 'நடுவில் சிறிய சங்கிலித் தையல்களும் வெளிப்புறத்தில் அகலமான வளைவுகளும் உள்ள சுருள்.',
    },
  },
  'long-short': {
    image: 'long-short-chain.png',
    alt: {
      en: 'A row of chain stitches alternating between long and short loops.',
      ta: 'நீண்ட மற்றும் குறுகிய வளையங்கள் மாறி வரும் சங்கிலித் தையல் வரிசை.',
    },
  },
  neckline: {
    image: 'gallery-magenta-lotus-pearl.webp',
    alt: {
      en: 'A magenta blouse neckline with a centred gold lotus, paired leaf motifs and pearl accents.',
      ta: 'நடுவில் தங்க நிறத் தாமரையும் இருபுற இலை வடிவங்களும் முத்துகளும் கொண்ட அடர் இளஞ்சிவப்பு ரவிக்கை.',
    },
  },
  'chain-row-fill': {
    image: 'leaf-fill-demo-poster.png',
    video: 'leaf-fill-demo',
    caption: 'trainingLeafFillDemo',
  },
  'gold-cord-couching': {
    image: 'gold-cord-demo-poster.png',
    video: 'gold-cord-demo',
    caption: 'trainingGoldCordDemo',
  },
  'whipped-chain-border': {
    image: 'whipped-chain-demo-poster.png',
    video: 'whipped-chain-demo',
    caption: 'trainingWhippedChainDemo',
  },
  'overlapping-sequin-border': {
    image: 'overlapping-sequins-demo-poster.png',
    video: 'overlapping-sequins-demo',
    caption: 'trainingOverlappingSequinsDemo',
  },
  'curved-leaf-border': {
    image: 'gallery-purple-peacock-leaf-neckline.webp',
    alt: {
      en: 'Green leaf shapes outlined in gold follow a curved neckline on purple fabric.',
      ta: 'ஊதாத் துணியில் கழுத்து வளைவைத் தொடர்ந்து தங்க நிற ஓரமிட்ட பச்சை இலை வடிவங்கள் உள்ளன.',
    },
  },
  'beaded-rosette': {
    image: 'gallery-mint-paisley-lattice-sleeve.webp',
    alt: {
      en: 'Small circular gold-bead flowers surround the central paisley on a mint-green sleeve.',
      ta: 'இளம்பச்சைக் கையின் நடுவிலுள்ள மாங்காய் வடிவத்தைச் சுற்றிச் சிறிய வட்டமான தங்க நிற மணிப்பூக்கள் உள்ளன.',
    },
  },
  'herringbone-cuff-band': {
    image: 'herringbone-cuff-stitch-diagram.webp',
    video: 'herringbone-cuff-demo',
    caption: 'trainingCaptionedAnimation',
    alt: {
      en: 'First, cross from the lower guide to the upper guide, then move back to the left under the fabric. Next, alternate guides to form a row of X shapes between two gold chain borders.',
      ta: 'முதலில் கீழ்க் கோட்டிலிருந்து மேல் கோட்டுக்குக் குறுக்காகத் தைத்து, துணியின் அடியில் சற்று இடப்புறம் நகருங்கள். பின் மேல், கீழ் கோடுகளுக்கு மாறி மாறித் தைத்து, இரு தங்க நிறச் சங்கிலிக் கரைகளுக்கிடையில் X வடிவங்களை உருவாக்குங்கள்.',
    },
  },
  'shisha-mirror-chain-edge': {
    image: 'shisha-mirror-stitch-diagram.webp',
    video: 'shisha-mirror-demo',
    caption: 'trainingCaptionedAnimation',
    alt: {
      en: 'Three vertical threads run across the mirror and anchor in the surrounding fabric. Weave three horizontal threads over and under them, then stitch a gold chain ring outside the rim.',
      ta: 'கண்ணாடியின் மேல் மூன்று செங்குத்து நூல்கள் செல்கின்றன. அவற்றின் முனைகள் சுற்றியுள்ள துணியில் பிடிக்கப்பட்டுள்ளன. மூன்று கிடைமட்ட நூல்களை மேலும் கீழுமாகப் பின்னி, விளிம்புக்கு வெளியே தங்க நிறச் சங்கிலித் தையல் போடுங்கள்.',
    },
  },
};

function hasTrainingAccess() {
  return trainingAccess?.expiresAt > Date.now();
}

function buildLessonDiagram(media) {
  const image = document.createElement('img');
  image.className = 'diagram';
  image.src = media.image;
  image.alt = media.alt[state.language];
  image.loading = 'lazy';
  return image;
}

function buildLessonMedia(lesson, media, t) {
  const figure = document.createElement('figure');
  figure.className = 'training-lesson-media';
  if (media.video) {
    figure.classList.add('stitch-demo');
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = media.image;
    video.width = 768;
    video.height = 432;
    video.setAttribute('aria-label', lesson.title);
    const source = document.createElement('source');
    source.src = media.video + '.mp4';
    source.type = 'video/mp4';
    video.append(source);
    for (const [lang, label] of [['en', 'English'], ['ta', 'தமிழ்']]) {
      const track = document.createElement('track');
      track.kind = 'captions';
      track.srclang = lang;
      track.label = label;
      track.src = media.video + '-' + lang + '.vtt';
      track.default = lang === state.language;
      video.append(track);
    }
    const caption = document.createElement('figcaption');
    caption.textContent = t[media.caption];
    figure.append(video);
    if (media.alt) {
      const diagram = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = t.trainingStitchDiagram;
      diagram.append(summary, buildLessonDiagram(media));
      figure.append(diagram);
    }
    figure.append(caption);
    return figure;
  }

  figure.append(buildLessonDiagram(media));
  if (lesson.id === 'neckline') {
    const caption = document.createElement('figcaption');
    caption.textContent = t.trainingNecklineExample;
    figure.append(caption);
  }
  if (media.pdf) {
    const link = document.createElement('a');
    link.className = 'button soft';
    link.href = media.pdf;
    link.download = '';
    link.textContent = t.flowerPdf;
    figure.append(link);
  }
  return figure;
}

function renderTraining() {
  const t = copy[state.language];
  const active = hasTrainingAccess();
  const message = byId('member-message');
  if (message) message.textContent = memberMessage ? t[memberMessage] : '';
  const readyLink = byId('ready-training-link');
  if (readyLink) readyLink.hidden = !active;
  if (referenceForm) {
    byId('member-payment').hidden = active || !trainingAccess;
    const continueLink = byId('checkout-continue');
    continueLink.hidden = !active;
    if (checkoutFromMixer) {
      continueLink.href = 'mixer.html';
      continueLink.textContent = t.mixerTitle;
    }
  }
  if (mixerTool) {
    mixerTool.hidden = !active;
    byId('mixer-locked').hidden = active;
  }
  if (!trainingLessons) return;

  galleryRetry.hidden = !(active && !course && memberMessage === 'memberTryAgain');
  byId('training-enroll-link').hidden = active;
  for (const id of ['lesson-three-tab', 'next-paid-lesson']) {
    byId(id).href = active ? '#lesson-3' : 'payment.html';
  }
  trainingLessons.hidden = !active || !course;
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
  const openLesson = trainingLessons.querySelector(':scope > details[open]')?.id;
  const lessons = locale.map((lesson, index) => {
    const panel = document.createElement('details');
    panel.id = 'lesson-' + (index + 3);
    panel.open = openLesson ? openLesson === panel.id : index === 0;
    const title = document.createElement('summary');
    const media = trainingMedia[lesson.id];
    const titleText = document.createElement('span');
    titleText.textContent = t.lessonNumber + ' ' + (index + 3) + ' · ' + lesson.title;
    if (media) {
      const preview = document.createElement('img');
      preview.className = 'training-preview';
      preview.src = media.image;
      preview.alt = '';
      preview.loading = 'lazy';
      preview.width = 104;
      preview.height = 68;
      title.append(preview);
    }
    title.append(titleText);
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
    panel.append(title, goal);
    if (media) panel.append(buildLessonMedia(lesson, media, t));
    panel.append(steps, exercise, check);
    return panel;
  });
  trainingLessons.replaceChildren(heading, expiry, ...lessons);
}

function openPaidLessonFromHash() {
  if (!trainingLessons) return;
  const hash = location.hash;
  if (!hasTrainingAccess() && /^(?:#training-lessons|#lesson-(?:[3-9]|[1-9][0-9]+))$/.test(hash)) {
    location.replace('payment.html');
    return;
  }
  if (trainingLessons.hidden) return;
  const target = byId(hash.slice(1));
  if (!target || !trainingLessons.contains(target)) return;
  if (target instanceof HTMLDetailsElement) target.open = true;
  target.scrollIntoView();
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
  openPaidLessonFromHash();
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

paymentReference?.addEventListener('input', () => {
  paymentReference.setCustomValidity('');
  memberMessage = undefined;
  byId('member-message').textContent = '';
});

referenceForm?.addEventListener('submit', async event => {
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
      document.dispatchEvent(new Event('aari:training-unlocked'));
    }
    paymentReference.value = '';
    memberMessage = 'memberReady';
    checkTrainingExpiry();
    renderTraining();
    location.assign(checkoutFromMixer ? 'mixer.html' : './#ready-designs');
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
    if (trainingSubmit) trainingSubmit.disabled = false;
  } catch {
    trainingAccess = undefined;
    memberMessage = 'memberStorageUnavailable';
    renderTraining();
    return;
  }
  checkTrainingExpiry();
  renderTraining();
  if (trainingLessons && hasTrainingAccess()) showExistingTraining();
  else openPaidLessonFromHash();
}

galleryRetry?.addEventListener('click', showExistingTraining);
window.addEventListener('hashchange', openPaidLessonFromHash);
byId('language').addEventListener('click', renderTraining);
initTraining();
