import { WORLD, createRun, flap, advance } from './game-model.js';
import { drawSprite, paintPortrait } from './sprites.js';
import { Chiptune } from './audio.js';
import { HYMNS } from './hymns.js';
import { ShuffleBag } from './rotation.js';
import { SCENES, loadScene, drawScene, sceneryPalette, drawChurchFloor } from './scenes.js';
import { COLUMN_STYLES, columnPalette, drawCatholicColumn } from './columns.js';

const $ = id => document.getElementById(id);
const canvas=$('game'), ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const read=(key,fallback)=>{try{return localStorage.getItem(`flappy-catholic:${key}`)??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(`flappy-catholic:${key}`,String(value));}catch{/* Private browsing can disable storage. */}};
const names={pope:'The Pope',angel:'The Angel',friar:'The Friar',bell:'The Bell'};
let character='pope';
let best=Math.max(0,Number(read('best','0'))||0);
let run=createRun(), previousTime=0, accumulator=0, sceneTime=0;
let reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio=new Chiptune();audio.enabled=read('sound','on')==='on';
const sceneRotation=new ShuffleBag(SCENES), hymnRotation=new ShuffleBag(HYMNS), columnRotation=new ShuffleBag(COLUMN_STYLES);
let activeScene=sceneRotation.next(), activeHymn=hymnRotation.next(), activeColumnStyle=columnRotation.next(), sceneImage=null;
let currentTheme=document.documentElement.dataset.theme==='light'?'light':'dark';
let palette=sceneryPalette(currentTheme,activeScene.accent), flightsStarted=0, preparing=false;
let pillarPalette=columnPalette(currentTheme,activeColumnStyle);
let viewport={left:0,width:640};
function resizeViewport(){const scale=Math.max(canvas.clientWidth/640,canvas.clientHeight/300);const width=Math.min(640,canvas.clientWidth/scale);viewport={left:(640-width)*.25,width};}
new ResizeObserver(resizeViewport).observe(canvas);
resizeViewport();
const scoreText=n=>String(n).padStart(2,'0');
const particles=[];

function announce(message){$('announcement').textContent=message;}
function updateSound(){ $('sound-toggle').setAttribute('aria-pressed',String(audio.enabled));$('sound-label').textContent=audio.enabled?'Sound on':'Sound off';$('sound-toggle').setAttribute('aria-label',audio.enabled?'Sound on':'Sound off'); }
function updateScore(){ $('score').textContent=scoreText(run.score);$('best').textContent=scoreText(best); }
function selectCharacter(id, notify=true){
  if(!names[id] || run.status==='playing' || run.status==='paused')return false;
  character=id;
  document.querySelectorAll('[data-character]').forEach(button=>{const selected=button.dataset.character===id;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
  paintPortrait($('hero-sprite'),character,2.05);
  if(notify)announce(`${names[id]} selected.`);
  return true;
}
function syncUI(){
  $('ready-overlay').hidden=run.status!=='ready';$('over-overlay').hidden=run.status!=='over';$('pause-overlay').hidden=run.status!=='paused';
  $('pause-button').hidden=run.status!=='playing';$('scene-caption').hidden=run.status!=='ready';
  const locked=run.status==='playing'||run.status==='paused';
  document.querySelectorAll('[data-character]').forEach(button=>{button.disabled=locked;});
  $('picker-note').textContent=locked?'Your flyer is on a mission.':'Different wings. Same mission.';
  updateScore();
}
function updateSceneLabels(){
  const period=currentTheme==='light'?'Day':'Night';
  $('scene-label').textContent=activeScene.name.toUpperCase();
  $('scene-caption-label').textContent=`${activeScene.name.toUpperCase()} · ${period.toUpperCase()}`;
  $('game-frame').dataset.scene=activeScene.id;
  $('game-frame').dataset.sceneTheme=currentTheme;
  $('game-frame').dataset.columnStyle=activeColumnStyle.id;
  palette=sceneryPalette(currentTheme,activeScene.accent);
  pillarPalette=columnPalette(currentTheme,activeColumnStyle);
}
function updateHymnLabel(){
  $('track-credit').textContent=`8-BIT HYMN · ${activeHymn.title.toUpperCase()}`;
  $('track-credit').dataset.hymn=activeHymn.id;
}
new MutationObserver(()=>{
  currentTheme=document.documentElement.dataset.theme==='light'?'light':'dark';
  updateSceneLabels();
}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
async function start(){
  if(preparing)return;
  preparing=true;
  $('start-button').disabled=true;$('retry-button').disabled=true;
  $('game-frame').setAttribute('aria-busy','true');
  try{
    const nextScene=flightsStarted?sceneRotation.next():activeScene;
    const image=await loadScene(nextScene);
    activeScene=nextScene;sceneImage=image;
    if(flightsStarted){activeHymn=hymnRotation.next();activeColumnStyle=columnRotation.next();}
    flightsStarted++;
    audio.setTrack(activeHymn);updateSceneLabels();updateHymnLabel();
    run=createRun();particles.length=0;accumulator=0;flap(run);
    const away=document.hidden||!document.hasFocus();
    if(away)run.status='paused';
    audio.setPaused(away);syncUI();
    if(!away){
      void audio.unlock().then(()=>audio.flap(character)).catch(()=>{});
      canvas.focus({preventScroll:true});announce(`Flying with ${names[character]} at ${activeScene.name}.`);
    }else announce('Flight ready and paused. Resume when you return.');
  }catch(error){
    announce('Scenery could not load. Try starting again.');
    $('scene-caption-label').textContent='SCENERY COULD NOT LOAD. TRY AGAIN.';
    console.error(error);
  }finally{
    preparing=false;$('start-button').disabled=false;$('retry-button').disabled=false;
    $('game-frame').removeAttribute('aria-busy');
  }
}
function doFlap(){
  if(run.status==='ready'||run.status==='over')start();
  else if(run.status==='playing') {flap(run);audio.flap(character);}
}
function finish(){
  const isBest=run.score>best;
  if(isBest){best=run.score;save('best',best);}
  $('final-score').textContent=run.score;$('final-best').textContent=best;
  $('result-message').textContent=isBest?'A new personal best.':run.score===0?'A fresh start is one flap away.':'Every flight takes you a little further.';
  audio.bump();syncUI();announce(`Flight finished. Score ${run.score}. Best ${best}.`);
  $('retry-button').focus({preventScroll:true});
}
function pause(){if(run.status!=='playing')return;run.status='paused';audio.setPaused(true);syncUI();$('resume-button').focus({preventScroll:true});announce('Flight paused.');}
function resume(){if(run.status!=='paused')return;run.status='playing';accumulator=0;previousTime=performance.now();audio.setPaused(false);syncUI();canvas.focus({preventScroll:true});announce('Flight resumed.');}
function ready(){run=createRun();particles.length=0;audio.setPaused(false);syncUI();$('start-button').focus({preventScroll:true});}

function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function drawPipe(pipe,opacity=1){
  ctx.save();ctx.globalAlpha=opacity;
  drawCatholicColumn(ctx,pipe.x,0,pipe.center-pipe.gap/2,true,pillarPalette,activeColumnStyle);
  drawCatholicColumn(ctx,pipe.x,pipe.center+pipe.gap/2,WORLD.ground,false,pillarPalette,activeColumnStyle);
  ctx.restore();
}
function render(dt){
  sceneTime+=dt;
  rect(0,0,640,300,currentTheme==='light'?'#8bc7eb':'#111b36');
  if(sceneImage)drawScene(ctx,sceneImage,currentTheme,viewport);
  if(run.status==='ready'){
    drawPipe({x:54,center:156,gap:WORLD.gap},.94);drawPipe({x:562,center:124,gap:WORLD.gap},.94);
  }else{
    for(const pipe of run.pipes)drawPipe(pipe);
    if(run.status==='playing' && !reducedMotion && Math.random()<dt*18)particles.push({x:WORLD.playerX-12,y:run.y+Math.random()*8-4,life:.5});
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];if(run.status==='playing'){p.x-=dt*45;p.life-=dt;}if(p.life<=0){particles.splice(i,1);continue;}ctx.globalAlpha=p.life;rect(p.x,p.y,2,2,currentTheme==='light'?'#8c6229':'#f4d490');}ctx.globalAlpha=1;
    const tilt=Math.max(-.3,Math.min(.65,run.velocity/430));
    drawSprite(ctx,character,WORLD.playerX,run.y,1.15,run.elapsed-run.flapAt<.15||Math.sin(run.elapsed*16)>0,tilt);
  }
  drawChurchFloor(ctx,run.status==='ready'?(reducedMotion?0:sceneTime*12):run.distance,palette);
}
function frame(time){
  const dt=previousTime?Math.min((time-previousTime)/1000,.05):0;previousTime=time;
  if(run.status==='playing'){
    accumulator+=dt;
    while(accumulator>=1/120){const event=advance(run,1/120);accumulator-=1/120;if(event.scored){audio.point();updateScore();}if(event.collided){finish();accumulator=0;break;}}
  }else accumulator=0;
  render(dt);requestAnimationFrame(frame);
}

document.querySelectorAll('[data-sprite]').forEach(c=>paintPortrait(c,c.dataset.sprite));
document.querySelectorAll('[data-character]').forEach(button=>button.addEventListener('click',()=>{selectCharacter(button.dataset.character);if(run.status==='over')ready();}));
$('start-button').addEventListener('click',start);$('retry-button').addEventListener('click',start);$('choose-button').addEventListener('click',ready);
$('pause-button').addEventListener('click',pause);$('resume-button').addEventListener('click',resume);
const pointerControls='button, a, input, select, textarea, label, [contenteditable="true"], .theme-toggle';
const waitingToFly=()=>run.status==='ready'||run.status==='over';
let startTap=null;
// Wait for a completed tap so scrolling the page does not launch a flight.
document.addEventListener('pointerdown',event=>{
  startTap=!event.defaultPrevented&&event.isPrimary&&event.button===0&&waitingToFly()&&!event.target.closest(pointerControls)
    ?{x:event.clientX,y:event.clientY}:null;
});
document.addEventListener('pointercancel',()=>{startTap=null;});
document.addEventListener('click',event=>{
  const tap=startTap;startTap=null;
  if(!tap||event.defaultPrevented||event.button!==0||event.target.closest(pointerControls)||!waitingToFly())return;
  if(Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>12)return;
  event.preventDefault();doFlap();
});
$('game-frame').addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||event.target.closest(pointerControls)||run.status!=='playing')return;
  event.preventDefault();doFlap();
});
window.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.target.closest('.theme-toggle, select, input, textarea, [contenteditable="true"]'))return;
  if(event.code==='KeyP'||event.code==='Escape'){event.preventDefault();if(!event.repeat)run.status==='playing'?pause():resume();return;}
  if(event.code==='Space'||event.code==='ArrowUp'){
    const button=event.target.closest('button');
    if(event.code==='Space'&&button&&!button.matches('#start-button, #retry-button, #resume-button, [data-character]'))return;
    event.preventDefault();if(event.repeat)return;
    if(run.status==='over')start();else if(run.status==='paused')resume();else doFlap();
  }
});
$('sound-toggle').addEventListener('click',()=>{audio.setEnabled(!audio.enabled);save('sound',audio.enabled?'on':'off');updateSound();if(run.status==='playing')canvas.focus({preventScroll:true});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();audio.setPaused(true);}else audio.setPaused(run.status==='paused');});
window.addEventListener('blur',()=>{pause();audio.setPaused(true);});
window.addEventListener('focus',()=>audio.setPaused(run.status==='paused'));
audio.setTrack(activeHymn);updateSceneLabels();updateHymnLabel();
loadScene(activeScene).then(image=>{if(!flightsStarted)sceneImage=image;}).catch(()=>{});
SCENES.filter(scene=>scene!==activeScene).forEach(scene=>loadScene(scene).catch(()=>{}));
selectCharacter(character,false);updateSound();syncUI();requestAnimationFrame(frame);

// Optional browser-standard tools share exactly the visible character selection.
if(document.modelContext?.registerTool){
  try{
    const registration=document.modelContext.registerTool({name:'select_flyer',description:'Select a Flappy Pope flyer before a flight. All flyers have the same physics.',inputSchema:{type:'object',properties:{character:{type:'string',enum:Object.keys(names)}},required:['character'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!names[input.character])throw new Error('Choose pope, angel, friar, or bell.');if(!selectCharacter(input.character))throw new Error('Finish the current flight before choosing a flyer.');return {character,status:run.status};}});
    Promise.resolve(registration).catch(()=>{});
  }catch{/* Browsers without the proposed API use the regular controls. */}
}
