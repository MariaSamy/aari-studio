const readyCollection = [
  {
    id: 'navy-twin-peacock', placement: 'sleeve', image: 'gallery-navy-twin-peacock.webp',
    name: { en: 'Navy twin-peacock sleeve', ta: 'இரு மயில்கள் கொண்ட கருநீலக் கை வடிவம்' },
  },
  {
    id: 'red-gold-peacock', placement: 'sleeve', image: 'gallery-red-gold-peacock.webp',
    name: { en: 'Red and gold peacock sleeve', ta: 'சிவப்புத் துணியில் தங்க நிற மயில் கை வடிவம்' },
  },
  {
    id: 'magenta-lotus-pearl', placement: 'neck', image: 'gallery-magenta-lotus-pearl.webp',
    name: { en: 'Magenta lotus and pearl neckline', ta: 'அடர் இளஞ்சிவப்புத் துணியில் தாமரையும் முத்துகளும் கொண்ட கழுத்து வடிவம்' },
  },
  {
    id: 'green-temple-back', placement: 'back', image: 'gallery-green-temple-back.webp',
    name: { en: 'Green temple-tower blouse back', ta: 'கோபுர வேலைப்பாடுள்ள பச்சை ரவிக்கையின் பின்புறம்' },
  },
  {
    id: 'blue-scalloped-vine', placement: 'neck', image: 'gallery-blue-scalloped-vine.webp',
    name: { en: 'Royal blue scalloped vine neckline', ta: 'அலை வடிவப் பூங்கொடி கொண்ட நீலக் கழுத்து வடிவம்' },
  },
];

const readyDialog = byId('ready-preview');
const readyCards = byId('ready-cards');
let previewDesign;

function showReadyDesign(design) {
  const lang = state.language;
  const t = copy[lang];
  previewDesign = design;
  byId('ready-preview-title').textContent = design.name[lang];
  byId('ready-preview-place').textContent = t[design.placement];
  byId('ready-preview-detail').textContent = design.detail?.[lang] || '';
  const preview = byId('ready-preview-image');
  preview.src = design.image;
  preview.alt = design.detail?.[lang] || design.name[lang];
  const choose = byId('ready-choose');
  choose.disabled = design.id === state.readyChoice;
  choose.textContent = choose.disabled ? t.readyChosen : t.readyChoose;
  readyDialog.showModal();
}

function renderReadyCollection() {
  const lang = state.language;
  const t = copy[lang];
  const active = readyCollection.find(design => design.id === state.readyChoice);
  byId('ready-selection').hidden = !active;
  byId('ready-selected').textContent = active ? t.readySelected + ' · ' + active.name[lang] : '';
  byId('ready-save-note').textContent = active && storageError ? t.readyUnsaved : '';
  const template = byId('ready-template');
  readyCards.replaceChildren(...readyCollection.map(design => {
    const card = template.content.firstElementChild.cloneNode(true);
    const button = document.createElement('button');
    button.className = 'ready-open';
    button.type = 'button';
    button.dataset.readyId = design.id;
    card.querySelector('img').src = design.image;
    card.querySelector('strong').textContent = design.name[lang];
    card.querySelector('small').textContent = t[design.placement];
    card.querySelector('.ready-action').textContent = design === active ? t.readyChosen : t.readyView;
    button.append(...card.childNodes);
    card.append(button);
    button.addEventListener('click', () => showReadyDesign(design));
    return card;
  }));
}

byId('ready-choose').addEventListener('click', () => {
  state.readyChoice = previewDesign.id;
  persist();
  readyDialog.close();
  renderReadyCollection();
  readyCards.querySelector(`[data-ready-id="${state.readyChoice}"]`).focus();
});
byId('ready-clear').addEventListener('click', () => {
  const previousChoice = state.readyChoice;
  state.readyChoice = null;
  persist();
  renderReadyCollection();
  readyCards.querySelector(`[data-ready-id="${previousChoice}"]`)?.focus();
});
byId('ready-close').addEventListener('click', () => readyDialog.close());
byId('language').addEventListener('click', renderReadyCollection);
renderReadyCollection();
