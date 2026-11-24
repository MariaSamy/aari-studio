const readyCollection = [
  {
    id: 'burgundy-floral', image: 'hero.webp', placement: 'floralDetail',
    name: { en: 'Burgundy Gold Florals', ta: 'அடர் சிவப்பில் தங்கப் பூக்கள்' },
    detail: { en: 'Gold-thread vines and bead accents on burgundy fabric.', ta: 'அடர் சிவப்புத் துணியில் தங்க நூல் கொடிகளும் மணிகளும்.' },
  },
  {
    id: 'emerald-paisley', image: 'ready-emerald.webp', placement: 'neck',
    name: { en: 'Emerald Paisley Neckline', ta: 'மரகதப் பச்சை மாங்காய் கழுத்து வடிவம்' },
    detail: { en: 'Gold paisley vines and seed pearls around a U-shaped neckline.', ta: 'U வடிவக் கழுத்தைச் சுற்றித் தங்க நிற மாங்காய்க் கொடிகளும் சிறு முத்துகளும்.' },
  },
  {
    id: 'marigold-moth', image: 'ready-marigold-moth.webp', placement: 'neck',
    name: { en: 'Marigold Moth Sweetheart Neckline', ta: 'சாமந்தி மஞ்சள் பட்டில் அந்துப்பூச்சிக் கழுத்து வடிவம்' },
  },
  {
    id: 'turquoise-papyrus', image: 'ready-turquoise-papyrus.webp', placement: 'sleeve',
    name: { en: 'Turquoise Papyrus Sleeve', ta: 'நீலப்பச்சைக் கையில் பப்பிரஸ் செடிகள்' },
  },
  {
    id: 'denim-dogwood', image: 'ready-denim-dogwood.webp', placement: 'floralDetail',
    name: { en: 'Denim Dogwood Yoke Sprig', ta: 'டெனிம் ஆடையின் மேற்பகுதியில் டாக்வுட் பூங்கிளை' },
  },
  {
    id: 'indigo-peacock', image: 'ready-navy.webp', placement: 'sleeve',
    name: { en: 'Indigo Peacock Sleeve', ta: 'கருநீல மயில் கை வடிவம்' },
    detail: { en: 'Peacock motifs in pale gold and teal along a curved sleeve edge.', ta: 'வளைந்த கை ஓரத்தில் வெளிர் தங்கமும் நீலப்பச்சையும் கலந்த மயில் வடிவங்கள்.' },
  },
  {
    id: 'rose-jasmine', image: 'ready-rose.webp', placement: 'border',
    name: { en: 'Rose Jasmine Border', ta: 'ரோஜா நிற மல்லிகைக் கரை' },
    detail: { en: 'Ivory jasmine flowers, curling gold vines and pearl accents on rose silk.', ta: 'ரோஜா நிறப் பட்டில் வெண்மை மல்லிகைப் பூக்கள், தங்கக் கொடிகள், முத்துகள்.' },
  },
  {
    id: 'plum-ginkgo', image: 'ready-plum-ginkgo.webp', placement: 'neck',
    name: { en: 'Plum Ginkgo Neckline', ta: 'ஊதாப் பட்டில் ஜிங்கோ இலைக் கழுத்து வடிவம்' },
    detail: { en: 'Lilac and silver fan-shaped ginkgo leaves frame the lower corners of a square neckline on plum silk.', ta: 'அடர் ஊதாப் பட்டில் சதுரக் கழுத்தின் கீழ் மூலைகளில் வெளிர் ஊதா மற்றும் வெள்ளி நிற விசிறி வடிவ ஜிங்கோ இலைகள்.' },
  },
  {
    id: 'ochre-crane', image: 'ready-ochre-crane.webp', placement: 'sleeve',
    name: { en: 'Ochre Crane Sleeve', ta: 'மஞ்சள் காவித் துணியில் கொக்குகள் கொண்ட கை வடிவம்' },
    detail: { en: 'Two ivory cranes fly above rust-coloured chain-stitch swirls at the curved edge of an ochre sleeve.', ta: 'மஞ்சள் காவி நிறக் கை ஓரத்தின் வளைவில் செம்பழுப்பு நிறச் சங்கிலித் தையல் சுருள்களுக்கு மேலே இரண்டு வெண்நிறக் கொக்குகள் பறக்கின்றன.' },
  },
  {
    id: 'cobalt-diamond', image: 'ready-cobalt-diamond.webp', placement: 'border',
    name: { en: 'Cobalt Diamond Border', ta: 'அடர் நீலப் பட்டில் வைர வடிவக் கரை' },
    detail: { en: 'Coral and copper diamonds repeat between two fine copper chain-stitch lines on cobalt-blue silk. Coral knots dot alternate diamonds.', ta: 'அடர் நீலப் பட்டில் செம்பு நிறச் சங்கிலித் தையல் கோடுகளுக்கு இடையே பவள மற்றும் செம்பு நிற வைர வடிவங்கள் தொடர்கின்றன. ஒரு வைரம் விட்டு அடுத்த வைரத்தின் நடுவில் பவள நிற நூல் முடிச்சு உள்ளது.' },
  },
  {
    id: 'ivory-nasturtium', image: 'ready-ivory-nasturtium.webp', placement: 'floralDetail',
    name: { en: 'Ivory Nasturtium Sprig', ta: 'வெண்மை லினனில் நாஸ்டர்ஷியம் பூங்கிளை' },
    detail: { en: 'One bright orange nasturtium and two round olive-green leaves on ivory linen. Use this small motif on a pocket or a yoke.', ta: 'வெண்மை லினன் துணியில் ஓர் ஆரஞ்சு நிற நாஸ்டர்ஷியம் பூவும் இரண்டு வட்ட ஆலிவ் பச்சை இலைகளும். பையிலோ ஆடையின் மேல் பகுதியிலோ தைக்க ஏற்ற சிறிய வடிவம்.' },
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
