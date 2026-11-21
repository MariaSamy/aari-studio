function drawDesign(canvas, placement, main, accent, palette) {
  const context = canvas.getContext('2d');
  const [cloth, gold, thread] = palettes[palette];
  const { base, spots } = arrangements[placement];
  const gradient = context.createLinearGradient(0, 0, 600, 360);
  gradient.addColorStop(0, cloth);
  gradient.addColorStop(1, '#19131f');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 600, 360);
  context.fillStyle = '#ffffff0a';
  for (let y = 0; y < 360; y += 4) context.fillRect(0, y, 600, 1);
  context.lineWidth = 2.5;
  context.strokeStyle = gold;
  context.strokeRect(14, 14, 572, 332);
  context.lineCap = 'round';
  context.stroke(new Path2D(base));
  spots.forEach(([x, y, scale, rotation = 0], index) => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation * Math.PI / 180);
    context.scale(scale, scale);
    const alternate = placement !== 'small' && index % 2 === 1;
    context.strokeStyle = alternate ? thread : gold;
    context.lineWidth = 3;
    context.stroke(new Path2D(motifPaths[alternate ? accent : main]));
    context.restore();
  });
  if (placement === 'small') {
    for (const [x, angle] of [[157, -24], [443, 156]]) {
      context.save();
      context.translate(x, 178);
      context.rotate(angle * Math.PI / 180);
      context.scale(.65, .65);
      context.strokeStyle = thread;
      context.lineWidth = 3.5;
      context.stroke(new Path2D(motifPaths[accent]));
      context.restore();
    }
  }
}

const filters = ['placement-filter', 'level-filter'];
const mixerFields = ['mix-placement', 'mix-main', 'mix-accent', 'mix-palette'];
const mixPreview = byId('mix-preview');
const mixValues = () => mixerFields.map(id => byId(id).value);

function showDesigns() {
  const t = copy[state.language];
  const [placement, level] = filters.map(id => byId(id).value);
  const matches = galleryDesigns.filter(design =>
    (!placement || design.placement === placement) && (!level || design.level === level));
  byId('gallery-empty').hidden = matches.length > 0;
  byId('gallery-cards').replaceChildren(...matches.map(design => {
    const card = byId('gallery-card-template').content.firstElementChild.cloneNode(true);
    const name = design.name[state.language];
    const media = card.querySelector('.gallery-media');
    if (design.image) {
      const image = new Image();
      image.src = design.image;
      image.alt = name;
      image.loading = 'lazy';
      media.append(image);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 360;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', name);
      drawDesign(canvas, design.placement, design.main, design.accent, design.palette);
      media.append(canvas);
    }
    card.querySelector('h3').textContent = name;
    card.querySelector('p').textContent = [t[design.placement], t[design.level]].join(' · ');
    const action = card.querySelector('a');
    action.textContent = t.download;
    if (design.pdf) action.href = design.pdf;
    else action.remove();
    return card;
  }));
}

function mixDesign() {
  drawDesign(mixPreview, ...mixValues());
  byId('mix-download').href = mixPreview.toDataURL('image/png');
  byId('ai-prompt').hidden = true;
  byId('mix-feedback').textContent = '';
}

function updateDesignLanguage() {
  showDesigns();
  byId('mix-feedback').textContent = '';
}

for (const id of filters) byId(id).addEventListener('change', showDesigns);
for (const id of mixerFields) byId(id).addEventListener('change', mixDesign);
byId('mix-surprise').addEventListener('click', () => {
  for (const id of ['mix-main', 'mix-accent', 'mix-palette']) {
    const field = byId(id);
    const offset = 1 + Math.floor(Math.random() * (field.length - 1));
    field.selectedIndex = (field.selectedIndex + offset) % field.length;
  }
  mixDesign();
});
byId('ai-copy').addEventListener('click', async () => {
  const [placement, main, accent, palette] = mixValues();
  const en = copy.en;
  const prompt = `Create one original Aari embroidery design image for the ${en[placement].toLowerCase()} placement on a saree blouse. Use ${en[main].toLowerCase()} as the main motif and ${en[accent].toLowerCase()} as the accent, in the ${en[palette].toLowerCase()} palette. Use clean stitchable outlines, even spacing and small gold bead accents. Show one complete, top-down design on plain fabric, with no text, watermark or mock-up. Keep the motifs simple enough to trace and stitch by hand.`;
  const t = copy[state.language];
  const field = byId('ai-prompt');
  field.value = prompt;
  field.hidden = false;
  try {
    await navigator.clipboard.writeText(prompt);
    byId('mix-feedback').textContent = t.aiCopied;
  } catch {
    field.select();
    byId('mix-feedback').textContent = t.aiManual;
  }
});
byId('language').addEventListener('click', updateDesignLanguage);
updateDesignLanguage();
mixDesign();
