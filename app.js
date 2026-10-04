const canvas = document.getElementById('target');
const ctx = canvas.getContext('2d');
const modeEl = document.getElementById('mode');
const difficultyPresetEl = document.getElementById('difficultyPreset');
const contrastEl = document.getElementById('contrast');
const sizeEl = document.getElementById('size');
const roundsEl = document.getElementById('rounds');
const glareCountEl = document.getElementById('glareCount');
const glareLevelEl = document.getElementById('glareLevel');
const contrastValue = document.getElementById('contrastValue');
const sizeValue = document.getElementById('sizeValue');
const startBtn = document.getElementById('startBtn');
const promptEl = document.getElementById('prompt');
const flash = document.getElementById('flashOverlay');
const scoreEl = document.getElementById('score');
const accuracyEl = document.getElementById('accuracy');
const rtEl = document.getElementById('rt');
const glarePanel = document.getElementById('glarePanel');

const dirs = ['N','NE','E','SE','S','SW','W','NW'];
const angle = {E:0,SE:45,S:90,SW:135,W:180,NW:225,N:270,NE:315};
let current = null, active = false, total = 0, correct = 0, maxRounds = 20, startedAt = 0, reaction = [];

function difficultyText(v){
  const n = Number(v);
  if (n <= 2) return '極難';
  if (n <= 5) return '很難';
  if (n <= 10) return '中等';
  if (n <= 18) return '較容易';
  return '容易';
}

function resizeCanvas(){
  const r = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw();
}
window.addEventListener('resize', resizeCanvas);

function updateGlareUI(){
  glarePanel.className = `glare count-${glareCountEl.value} level-${glareLevelEl.value}`;
  if (modeEl.value === 'normal') glarePanel.classList.add('count-0');
}

function applyPresetIfNeeded(){
  if (difficultyPresetEl.value !== 'custom') {
    contrastEl.value = difficultyPresetEl.value;
  }
  updateLabels();
}

function targetGray(){
  const v = Math.round(255 * (Number(contrastEl.value) / 100));
  return `rgb(${v},${v},${v})`;
}

function maybeGlareWash(){
  const count = Number(glareCountEl.value);
  if (modeEl.value === 'normal' || count === 0) return;

  const r = canvas.getBoundingClientRect();
  let alpha = 0.10;
  if (glareLevelEl.value === 'medium') alpha = 0.15;
  if (glareLevelEl.value === 'high') alpha = 0.23;
  if (count === 2) alpha += 0.05;

  const grad = ctx.createRadialGradient(r.width * 0.16, r.height * 0.49, 12, r.width * 0.16, r.height * 0.49, r.width * 0.48);
  grad.addColorStop(0, `rgba(255,225,135,${Math.min(alpha + 0.16, 0.42)})`);
  grad.addColorStop(0.18, `rgba(255,205,90,${alpha})`);
  grad.addColorStop(0.56, `rgba(255,188,60,${alpha * 0.50})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, r.width, r.height);
}

function draw(){
  const r = canvas.getBoundingClientRect();
  ctx.clearRect(0,0,r.width,r.height);
  ctx.fillStyle='#000';
  ctx.fillRect(0,0,r.width,r.height);

  maybeGlareWash();
  if (!current) return;

  const s = Number(sizeEl.value);
  const x = r.width * 0.67;
  const y = r.height * 0.5;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(angle[current] * Math.PI / 180);
  ctx.strokeStyle = targetGray();
  ctx.lineWidth = Math.max(7, s * 0.19);
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(0,0,s * 0.42,Math.PI * .22,Math.PI * 1.78);
  ctx.stroke();
  ctx.restore();
}

function updateLabels(){
  contrastValue.textContent = `${contrastEl.value}（${difficultyText(contrastEl.value)}）`;
  sizeValue.textContent = `${sizeEl.value} px`;
  updateGlareUI();
  draw();
}

contrastEl.addEventListener('input', () => {
  difficultyPresetEl.value = 'custom';
  updateLabels();
});
sizeEl.addEventListener('input', updateLabels);
difficultyPresetEl.addEventListener('change', applyPresetIfNeeded);
glareCountEl.addEventListener('change', updateLabels);
glareLevelEl.addEventListener('change', updateLabels);
modeEl.addEventListener('change', updateLabels);

function next(){
  if (total >= maxRounds) { finish(); return; }
  current = dirs[Math.floor(Math.random() * dirs.length)];
  const mode = modeEl.value;
  promptEl.textContent = `第 ${total + 1} / ${maxRounds} 題`;
  if (mode === 'recovery') {
    current = null;
    draw();
    updateGlareUI();
    flash.style.opacity = glareCountEl.value === '0' ? '.20' : (glareLevelEl.value === 'high' ? '.95' : glareLevelEl.value === 'medium' ? '.78' : '.54');
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        current = dirs[Math.floor(Math.random() * dirs.length)];
        draw();
        startedAt = performance.now();
      }, 760);
    }, 700);
  } else {
    draw();
    startedAt = performance.now();
  }
}

function answer(d){
  if (!active || !current) return;
  const ms = performance.now() - startedAt;
  reaction.push(ms);
  total++;
  if (d === current) correct++;
  scoreEl.textContent = `${correct} / ${total}`;
  accuracyEl.textContent = `${Math.round(correct / total * 100)}%`;
  rtEl.textContent = `${Math.round(reaction.reduce((a,b) => a+b, 0) / reaction.length)} ms`;
  current = null;
  draw();
  setTimeout(next, 280);
}

function finish(){
  active = false;
  current = null;
  draw();
  promptEl.textContent = `完成：${correct}/${total}，正確率 ${Math.round(correct / Math.max(1,total) * 100)}%`;
  startBtn.textContent = '再練一次';
}

startBtn.addEventListener('click', () => {
  maxRounds = Number(roundsEl.value);
  total = 0; correct = 0; reaction = []; active = true;
  scoreEl.textContent = '0 / 0';
  accuracyEl.textContent = '—';
  rtEl.textContent = '—';
  startBtn.textContent = '重新開始';
  next();
});

document.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => answer(b.dataset.dir)));
window.addEventListener('keydown', e => {
  const map = {ArrowUp:'N',ArrowDown:'S',ArrowLeft:'W',ArrowRight:'E',8:'N',9:'NE',6:'E',3:'SE',2:'S',1:'SW',4:'W',7:'NW'};
  if (map[e.key]) { e.preventDefault(); answer(map[e.key]); }
});

applyPresetIfNeeded();
resizeCanvas();