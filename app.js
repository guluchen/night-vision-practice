const canvas = document.getElementById('target');
const ctx = canvas.getContext('2d');
const modeEl = document.getElementById('mode');
const contrastEl = document.getElementById('contrast');
const sizeEl = document.getElementById('size');
const roundsEl = document.getElementById('rounds');
const contrastValue = document.getElementById('contrastValue');
const sizeValue = document.getElementById('sizeValue');
const startBtn = document.getElementById('startBtn');
const promptEl = document.getElementById('prompt');
const flash = document.getElementById('flashOverlay');
const scoreEl = document.getElementById('score');
const accuracyEl = document.getElementById('accuracy');
const rtEl = document.getElementById('rt');
const glareEl = document.querySelector('.glare');

const dirs = ['N','NE','E','SE','S','SW','W','NW'];
const angle = {E:0,SE:45,S:90,SW:135,W:180,NW:225,N:270,NE:315};
let current=null, active=false, total=0, correct=0, maxRounds=20, startedAt=0, reaction=[];

function resizeCanvas(){
  const r=canvas.getBoundingClientRect(); const dpr=Math.max(1,window.devicePixelRatio||1);
  canvas.width=Math.round(r.width*dpr); canvas.height=Math.round(r.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0); draw();
}
window.addEventListener('resize',resizeCanvas);

function targetGray(){
  const p=Number(contrastEl.value)/100;
  const v=Math.round(255*p);
  return `rgb(${v},${v},${v})`;
}

function draw(){
  const r=canvas.getBoundingClientRect(); ctx.clearRect(0,0,r.width,r.height); ctx.fillStyle='#000'; ctx.fillRect(0,0,r.width,r.height);
  if(!current) return;
  const s=Number(sizeEl.value); const x=r.width*0.67, y=r.height*0.5;
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle[current]*Math.PI/180);
  ctx.strokeStyle=targetGray(); ctx.lineWidth=Math.max(7,s*.19); ctx.lineCap='butt';
  ctx.beginPath(); ctx.arc(0,0,s*.42,Math.PI*.22,Math.PI*1.78); ctx.stroke(); ctx.restore();
}

function updateLabels(){contrastValue.textContent=`${contrastEl.value}%`;sizeValue.textContent=`${sizeEl.value} px`;draw()}
contrastEl.addEventListener('input',updateLabels); sizeEl.addEventListener('input',updateLabels);
modeEl.addEventListener('change',()=>{ glareEl.style.display=modeEl.value==='normal'?'none':'flex'; });

function next(){
  if(total>=maxRounds){finish();return}
  current=dirs[Math.floor(Math.random()*dirs.length)];
  const mode=modeEl.value;
  promptEl.textContent=`第 ${total+1} / ${maxRounds} 題`;
  if(mode==='recovery'){
    current=null; draw(); glareEl.style.display='flex'; flash.style.opacity='.72';
    setTimeout(()=>{flash.style.opacity='0'; setTimeout(()=>{current=dirs[Math.floor(Math.random()*dirs.length)]; draw(); startedAt=performance.now();},700)},700);
  } else {
    glareEl.style.display=mode==='normal'?'none':'flex'; draw(); startedAt=performance.now();
  }
}

function answer(d){
  if(!active||!current)return;
  const ms=performance.now()-startedAt; reaction.push(ms); total++;
  if(d===current) correct++;
  scoreEl.textContent=`${correct} / ${total}`;
  accuracyEl.textContent=`${Math.round(correct/total*100)}%`;
  rtEl.textContent=`${Math.round(reaction.reduce((a,b)=>a+b,0)/reaction.length)} ms`;
  current=null; draw(); setTimeout(next,280);
}

function finish(){active=false;current=null;draw();promptEl.textContent=`完成：${correct}/${total}，正確率 ${Math.round(correct/Math.max(1,total)*100)}%`;startBtn.textContent='再練一次'}

startBtn.addEventListener('click',()=>{maxRounds=Number(roundsEl.value);total=0;correct=0;reaction=[];active=true;scoreEl.textContent='0 / 0';accuracyEl.textContent='—';rtEl.textContent='—';startBtn.textContent='重新開始';next()});

document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>answer(b.dataset.dir)));
window.addEventListener('keydown',e=>{
  const map={ArrowUp:'N',ArrowDown:'S',ArrowLeft:'W',ArrowRight:'E',8:'N',9:'NE',6:'E',3:'SE',2:'S',1:'SW',4:'W',7:'NW'};
  if(map[e.key]){e.preventDefault();answer(map[e.key])}
});

updateLabels(); glareEl.style.display='none'; resizeCanvas();