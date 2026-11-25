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
  {
    id: 'maroon-gold-arch', placement: 'sleeve', image: 'gallery-maroon-gold-arch.webp',
    name: { en: 'Maroon and gold arch sleeves', ta: 'மரூன் நிறக் கைகளில் தங்க நிற வளைவுகள்' },
    detail: { en: 'Gold beadwork outlines the arches and forms a diamond lattice along the cuffs.', ta: 'தங்க நிற மணிகள் வளைவுகளின் ஓரங்களை அலங்கரிக்கின்றன. கை ஓரத்தில் வைர வடிவ வலைப்பின்னல் உள்ளது.' },
  },
  {
    id: 'wine-jhumka', placement: 'sleeve', image: 'gallery-wine-jhumka.webp',
    name: { en: 'Deep maroon jhumka sleeves', ta: 'அடர் மரூன் நிற ஜிமிக்கி கை வடிவம்' },
    detail: { en: 'Jhumka motifs hang inside pointed arches above round medallions and beaded cuffs.', ta: 'கூர்முனை வளைவுகளுக்குள் ஜிமிக்கி வடிவங்கள் தொங்குகின்றன. கை ஓரங்களில் வட்ட வடிவங்களும் மணி வேலைப்பாடும் உள்ளன.' },
  },
  {
    id: 'emerald-floral-lattice', placement: 'sleeve', image: 'gallery-emerald-floral-lattice.webp',
    name: { en: 'Emerald floral lattice sleeves', ta: 'மரகதப் பச்சைக் கைகளில் பூவும் கட்ட வடிவமும்' },
    detail: { en: 'Gold floral vines and green stones sit between bands of gold lattice and leaf motifs.', ta: 'தங்க நிறப் பூங்கொடிகளும் பச்சைக் கற்களும் கட்ட வடிவப் பட்டைகளையும் இலை வடிவங்களையும் அலங்கரிக்கின்றன.' },
  },
  {
    id: 'pink-brocade-cuff', placement: 'sleeve', image: 'gallery-pink-brocade-cuff.webp',
    name: { en: 'Bright pink blouse with a gold brocade cuff', ta: 'தங்க நிறச் சரிகைக் கை ஓரமுள்ள பளிச்சிடும் இளஞ்சிவப்பு ரவிக்கை' },
    detail: { en: 'Small gold motifs are scattered above a wide brocade cuff edged with beading.', ta: 'மணிகள் பதித்த அகன்ற சரிகைக் கை ஓரத்துக்கு மேலே சிறிய தங்க நிற வடிவங்கள் பரவலாக உள்ளன.' },
  },
  {
    id: 'teal-floral-neckline', placement: 'neck', image: 'gallery-teal-floral-neckline.webp',
    name: { en: 'Teal blouse with a floral neckline', ta: 'பூ வேலைப்பாடு கொண்ட நீலப்பச்சை ரவிக்கைக் கழுத்து' },
    detail: { en: 'Red and gold embroidery frames the neckline, and small floral sprigs decorate the blouse.', ta: 'சிவப்பும் தங்க நிறமும் கலந்த வேலைப்பாடு கழுத்தைச் சுற்றியுள்ளது. சிறு பூங்கிளைகள் ரவிக்கையை அலங்கரிக்கின்றன.' },
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
