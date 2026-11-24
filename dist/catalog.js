const motifPaths = {
  lotus: 'M0 28 Q-47 14 -48 -18 Q-18 -14 0 19 Q18 -14 48 -18 Q47 14 0 28Z M-20 12 Q-25 -10 0 -38 Q25 -10 20 12 M0 28 Q-13 43 -30 35 M0 28 Q13 43 30 35',
  paisley: 'M-21 31 C-63 7 -23 -42 32 -42 C12 -28 43 -17 37 5 C29 36 -4 47 -21 31Z M-17 21 C-44 3 -18 -26 12 -29 C4 -20 24 -12 22 4 C18 22 -3 32 -17 21Z',
  jasmine: 'M0 -8 C-16 -45 16 -45 0 -8 C30 -40 51 -12 8 -3 C49 14 28 39 5 7 C17 52 -17 52 -5 7 C-28 39 -49 14 -8 -3 C-51 -12 -30 -40 0 -8Z M5 0 A5 5 0 1 0 -5 0 A5 5 0 1 0 5 0',
  leaf: 'M-43 26 Q-39 -21 39 -32 Q42 25 -43 26Z M-43 26 Q-3 -4 25 -21 M-22 10 Q-27 -4 -20 -12 M-5 -2 Q1 10 16 8 M7 -11 Q4 -23 13 -25',
  spiral: 'M0 0 C0 -7 11 -9 17 -2 C26 12 10 26 -5 23 C-33 19 -39 -11 -20 -32 C-1 -51 34 -45 47 -22',
  bud: 'M0 40 Q-14 15 0 -6 C-31 -8 -30 -33 0 -15 C-15 -48 15 -48 0 -15 C30 -33 31 -8 0 -6 Q12 16 36 3 Q24 26 0 28 Q-12 13 -34 12 Q-27 30 0 40Z',
};
const arrangements = {
  small: { base: '', spots: [[300, 171, 2.15]] },
  sleeve: { base: 'M105 238 Q300 79 495 238', spots: [[155,179,.72,-25],[300,116,1.04],[445,179,.72,25]] },
  neck: { base: 'M130 58 Q156 255 300 276 Q444 255 470 58', spots: [[159,121,.67,-25],[205,204,.72,-25],[300,233,.86],[395,204,.72,25],[441,121,.67,25]] },
  border: { base: 'M35 249 H565 M35 269 H565', spots: [[110,202,.83],[205,202,.83],[300,202,.83],[395,202,.83],[490,202,.83]] },
};
const galleryDesigns = [
  {
    id: 'navy-twin-peacock', placement: 'sleeve', level: 'advanced', image: 'gallery-navy-twin-peacock.webp', photo: true,
    name: { en: 'Navy twin-peacock sleeve', ta: 'இரு மயில்கள் கொண்ட கருநீலக் கை வடிவம்' },
  },
  {
    id: 'red-gold-peacock', placement: 'sleeve', level: 'advanced', image: 'gallery-red-gold-peacock.webp', photo: true,
    name: { en: 'Red and gold peacock sleeve', ta: 'சிவப்புத் துணியில் தங்க நிற மயில் கை வடிவம்' },
  },
  {
    id: 'magenta-lotus-pearl', placement: 'neck', level: 'advanced', image: 'gallery-magenta-lotus-pearl.webp', photo: true,
    name: { en: 'Magenta lotus and pearl neckline', ta: 'அடர் இளஞ்சிவப்புத் துணியில் தாமரையும் முத்துகளும் கொண்ட கழுத்து வடிவம்' },
  },
  {
    id: 'green-temple-back', placement: 'back', level: 'advanced', image: 'gallery-green-temple-back.webp', photo: true,
    name: { en: 'Green temple-tower blouse back', ta: 'கோபுர வேலைப்பாடுள்ள பச்சை ரவிக்கையின் பின்புறம்' },
  },
  {
    id: 'blue-scalloped-vine', placement: 'neck', level: 'intermediate', image: 'gallery-blue-scalloped-vine.webp', photo: true,
    name: { en: 'Royal blue scalloped vine neckline', ta: 'அலை வடிவப் பூங்கொடி கொண்ட நீலக் கழுத்து வடிவம்' },
  },
  { id: 'lotus-spiral-neckline', placement: 'neck', level: 'intermediate', name: { en: 'Lotus and spiral neckline', ta: 'தாமரையும் சுருளும் கொண்ட கழுத்து வடிவம்' }, main: 'lotus', accent: 'spiral', palette: 'wine' },
  { id: 'sleeve-vine', placement: 'sleeve', level: 'beginner', name: { en: 'Floral sleeve vine', ta: 'கைப் பகுதிக்கான பூங்கொடி' }, image: 'floral-sleeve.png', pdf: 'floral-sleeve-a4.pdf' },
  { id: 'practice-flower', placement: 'small', level: 'beginner', name: { en: 'Five-petal practice flower', ta: 'ஐந்து இதழ்கள் கொண்ட பூ' }, image: 'floral-motif.png', pdf: 'small-flower-a4.pdf' },
  { id: 'lotus-medallion', placement: 'small', level: 'beginner', name: { en: 'Lotus medallion', ta: 'தாமரை வடிவம்' }, main: 'lotus', accent: 'leaf', palette: 'wine' },
  { id: 'paisley-neckline', placement: 'neck', level: 'intermediate', name: { en: 'Paisley neckline', ta: 'மாங்காய் வடிவக் கழுத்து' }, main: 'paisley', accent: 'jasmine', palette: 'teal' },
  { id: 'jasmine-border', placement: 'border', level: 'beginner', name: { en: 'Jasmine border', ta: 'மல்லிகைக் கரை' }, main: 'jasmine', accent: 'bud', palette: 'wine' },
  { id: 'leaf-sleeve', placement: 'sleeve', level: 'intermediate', name: { en: 'Leaf and bud sleeve', ta: 'இலையும் மொட்டும் கொண்ட கை வடிவம்' }, main: 'leaf', accent: 'bud', palette: 'indigo' },
];
const palettes = {
  wine: ['#411727', '#f4cd85', '#ec91a9'],
  teal: ['#123c39', '#f4d88e', '#9cdcc5'],
  indigo: ['#252949', '#fbda91', '#bcbcff'],
};
