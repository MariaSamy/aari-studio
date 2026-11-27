const readyCollection = [
  {
    id: 'crimson-peacock-palanquin', placement: 'back', image: 'gallery-crimson-peacock-palanquin.webp',
    name: { en: 'Crimson peacock and palanquin blouse back', ta: 'மயில்களும் பல்லக்கும் கொண்ட செந்நிற ரவிக்கைப் பின்புறம்' },
    detail: { en: 'Two green-and-gold peacocks frame a palanquin procession above a diamond-patterned border.', ta: 'வைர வடிவக் கரைக்கு மேலே பல்லக்கு ஊர்வலம் உள்ளது. இருபுறமும் பச்சையும் தங்க நிறமும் கலந்த மயில்கள் உள்ளன.' },
  },
  {
    id: 'magenta-dancer-vines', placement: 'sleeve', image: 'gallery-magenta-dancer-vines.webp',
    name: { en: 'Magenta dancer and leaf-vine sleeve panel', ta: 'நடன உருவமும் இலைக்கொடிகளும் கொண்ட அடர் இளஞ்சிவப்புக் கை வடிவம்' },
    detail: { en: 'Gold and red leaf vines surround a dancer beneath a pointed arch, with a beaded band below.', ta: 'கூர்முனை வளைவுக்குள் நடன உருவம் உள்ளது. அதைச் சிவப்பும் தங்க நிறமும் கலந்த இலைக்கொடிகள் சுற்றியுள்ளன. கீழே மணி வேலைப்பாடு கொண்ட பட்டை உள்ளது.' },
  },
  {
    id: 'green-gold-arch-medallion', placement: 'sleeve', image: 'gallery-green-gold-arch-medallion.webp',
    name: { en: 'Green sleeve with a gold arch and floral medallion', ta: 'தங்க நிற வளைவும் பூ வடிவமும் கொண்ட பச்சை ரவிக்கைக் கை' },
    detail: { en: 'A pink-and-gold floral motif sits inside a pointed arch, between a diamond lattice and a scalloped cuff.', ta: 'கூர்முனை வளைவுக்குள் இளஞ்சிவப்பும் தங்க நிறமும் கலந்த பூ வடிவம் உள்ளது. மேலே வைர வடிவ வலைப்பின்னலும் கீழே அலை வடிவக் கை ஓரமும் உள்ளன.' },
  },
  {
    id: 'red-floral-grid-peacock', placement: 'sleeve', image: 'gallery-red-floral-grid-peacock.webp',
    name: { en: 'Red floral-grid sleeve with peacock cuff', ta: 'பூக் கட்டங்களும் மயில் கை ஓரமும் கொண்ட சிவப்பு ரவிக்கைக் கை' },
    detail: { en: 'Gold squares hold small green-centred flowers above a round medallion and a peacock cuff motif.', ta: 'தங்க நிறக் கட்டங்களுக்குள் பச்சை நடுப்பகுதி கொண்ட சிறு பூக்கள் உள்ளன. அவற்றுக்குக் கீழே வட்ட வடிவமும் கை ஓரத்தில் மயில் வடிவமும் உள்ளன.' },
  },
  {
    id: 'coral-diamond-pearl-neckline', placement: 'neck', image: 'gallery-coral-diamond-pearl-neckline.webp',
    name: { en: 'Coral blouse with a pearl neckline and diamond cuffs', ta: 'முத்துக் கழுத்துக் கரையும் வைர வடிவக் கை ஓரமும் கொண்ட பவள நிற ரவிக்கை' },
    detail: { en: 'Pearls and gold beads trace the neckline, and dense diamond motifs cover the broad cuff panels.', ta: 'முத்துகளும் தங்க நிற மணிகளும் கழுத்துக் கோட்டைச் சுற்றியுள்ளன. அகன்ற கை ஓரங்களில் நெருக்கமான வைர வடிவங்கள் உள்ளன.' },
  },
  {
    id: 'fuchsia-floral-blouse-back', placement: 'back', image: 'gallery-fuchsia-floral-blouse-back.webp',
    name: { en: 'Fuchsia blouse back with gold floral sleeves', ta: 'தங்க நிறப் பூங்கொடிகள் தைத்த கைகளுடன் அடர் இளஞ்சிவப்பு ரவிக்கைப் பின்புறம்' },
    detail: { en: 'An embroidered centrepiece fills a pale pink inset framed by gold beads and floral sleeves.', ta: 'வெளிர் இளஞ்சிவப்பு நடுப்பகுதியில் அலங்கார உருவம் தைக்கப்பட்டுள்ளது. அதைச் சுற்றித் தங்க நிற மணிக் கரையும் இருபுறக் கைகளில் பூங்கொடிகளும் உள்ளன.' },
  },
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
  {
    id: 'teal-teardrop-neckline', placement: 'neck', image: 'gallery-teal-teardrop-neckline.webp',
    name: { en: 'Teal teardrop-stone neckline', ta: 'துளி வடிவக் கற்கள் பதித்த நீலப்பச்சைக் கழுத்து வடிவம்' },
    detail: { en: 'Rows of gold beads and pearls frame teal teardrop stones along the neckline.', ta: 'கழுத்து ஓரத்தில் நீலப்பச்சைத் துளி வடிவக் கற்களைத் தங்க நிற மணிகளும் முத்து வரிசைகளும் சுற்றியுள்ளன.' },
  },
  {
    id: 'purple-turquoise-birds', placement: 'back', image: 'gallery-purple-turquoise-birds.webp',
    name: { en: 'Turquoise twin-bird motif', ta: 'நீலப்பச்சை இரட்டைப் பறவை வடிவம்' },
    detail: { en: 'Two turquoise birds sit above gold leaves and strands of hanging beads on purple fabric.', ta: 'ஊதாத் துணியில் இரு நீலப்பச்சைப் பறவைகளின் கீழே தங்க நிற இலைகளும் தொங்கும் மணி வரிசைகளும் உள்ளன.' },
  },
  {
    id: 'purple-peacock-leaf-neckline', placement: 'neck', image: 'gallery-purple-peacock-leaf-neckline.webp',
    name: { en: 'Purple peacock neckline with a leaf border', ta: 'இலைக் கரையுடன் ஊதா மயில் கழுத்து வடிவம்' },
    detail: { en: 'A narrow gold-and-green leaf border frames the curve and meets a large peacock motif on one side.', ta: 'தங்க நிறமும் பச்சையும் கலந்த சிறிய இலைகள் கழுத்து வளைவைச் சுற்றி, ஒரு பக்கத்தில் பெரிய மயில் வடிவத்துடன் இணைகின்றன.' },
  },
  {
    id: 'mint-paisley-lattice-sleeve', placement: 'sleeve', image: 'gallery-mint-paisley-lattice-sleeve.webp',
    name: { en: 'Mint paisley sleeve with a lattice cuff', ta: 'கட்ட வடிவக் கை ஓரத்துடன் இளம்பச்சை மாங்காய் வடிவம்' },
    detail: { en: 'Gold bead rosettes surround a central paisley, with a square-stone lattice at the cuff.', ta: 'நடுவிலுள்ள மாங்காய் வடிவத்தைத் தங்க நிற மணிப்பூக்கள் சுற்றியுள்ளன. கை ஓரத்தில் சதுரக் கற்களால் ஆன கட்ட வடிவம் உள்ளது.' },
  },
  {
    id: 'aqua-floral-trellis-sleeve', placement: 'sleeve', image: 'gallery-aqua-floral-trellis-sleeve.webp',
    name: { en: 'Aqua sleeve with a gold floral trellis', ta: 'தங்க நிறப் பூ வலைப்பின்னலுடன் நீலப்பச்சைக் கை வடிவம்' },
    detail: { en: 'Gold flowers and curling vines frame a diamond trellis dotted with small bead clusters.', ta: 'சிறிய மணிக்கொத்துகள் கொண்ட வைர வடிவ வலைப்பின்னலைத் தங்க நிறப் பூக்களும் வளைந்த கொடிகளும் சுற்றியுள்ளன.' },
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
