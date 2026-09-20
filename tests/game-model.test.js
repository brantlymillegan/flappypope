import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, createRun, flap, advance } from '../dist/game-model.js';

test('a flap starts a flight and no input eventually reaches the ground', () => {
  const run=createRun(()=>.5);flap(run);assert.equal(run.status,'playing');assert.ok(run.velocity<0);
  for(let i=0;i<360&&run.status==='playing';i++)advance(run,1/120);
  assert.equal(run.status,'over');assert.equal(run.score,0);
});

test('passing safely through a column pair awards exactly one point', () => {
  const run=createRun(()=>.5);run.status='playing';run.y=139;
  run.pipes=[{x:92,center:139,gap:WORLD.gap,passed:false}];
  assert.equal(advance(run,1/120).scored,true);assert.equal(run.score,1);
  advance(run,1/120);assert.equal(run.score,1);assert.equal(run.status,'playing');
});

test('both a shaft and its wider capital collide with the player', () => {
  for(const x of [WORLD.playerX, WORLD.playerX+WORLD.radius+3]){
    const run=createRun(()=>.5);run.status='playing';run.y=65;run.pipes=[{x,center:139,gap:WORLD.gap,passed:false}];
    assert.equal(advance(run,1/120).collided,true);assert.equal(run.score,0);
  }
});

test('ceiling and floor collisions end a flight', () => {
  for(const y of [2,WORLD.ground-2]){
    const run=createRun(()=>.5);run.status='playing';run.y=y;
    assert.equal(advance(run,1/120).collided,true);
  }
});

test('paused and ended flights do not advance or react to flaps', () => {
  for(const status of ['paused','over']){
    const run=createRun();run.status=status;const before=JSON.stringify(run);
    advance(run,.05,3000);flap(run);assert.equal(JSON.stringify(run),before);
  }
});

test('widening the view fills the course at regular spacing and narrowing preserves it', () => {
  const run=createRun(()=>.5);flap(run);
  advance(run,1/120);
  const existing=run.pipes.map(pipe=>({pipe,x:pipe.x,center:pipe.center,gap:pipe.gap}));
  const rightEdge=2400;
  advance(run,1/120,rightEdge);
  assert.ok(run.pipes.length>10,'the expanded view receives its whole course immediately');
  assert.ok(run.pipes.at(-1).x>rightEdge-WORLD.spacing);
  assert.ok(run.pipes.at(-1).x<=rightEdge);
  for(let i=1;i<run.pipes.length;i++){
    assert.ok(Math.abs(run.pipes[i].x-run.pipes[i-1].x-WORLD.spacing)<1e-8);
  }
  for(const [i,before] of existing.entries()){
    assert.equal(run.pipes[i],before.pipe);
    assert.ok(Math.abs(run.pipes[i].x-(before.x-WORLD.speed/120))<1e-8);
    assert.equal(run.pipes[i].center,before.center);
    assert.equal(run.pipes[i].gap,before.gap);
  }
  const widePipes=[...run.pipes];
  advance(run,1/120,300);
  assert.deepEqual(run.pipes,widePipes,'narrowing does not remove future columns');
});

test('the visible width does not alter flight physics', () => {
  const narrow=createRun(()=>.5),wide=createRun(()=>.5);
  flap(narrow);flap(wide);
  for(let frame=0;frame<12;frame++){
    advance(narrow,1/120);
    advance(wide,1/120,2400);
  }
  for(const property of ['status','y','velocity','score','elapsed','distance','flapAt']){
    assert.equal(wide[property],narrow[property],property);
  }
});

test('gap heights span high, middle, and low positions with frequent large changes', () => {
  let seed=43;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const run=createRun(random);flap(run);
  const centers=[];
  for(let i=0;i<120;i++){
    // Move the latest pair to the spawn boundary to sample the course layout.
    run.pipes=[run.pipes.at(-1)];run.pipes[0].x=WORLD.width-WORLD.spacing;
    run.y=139;run.velocity=0;
    advance(run,1/120);
    const pipe=run.pipes.at(-1);centers.push(pipe.center);
    assert.ok(pipe.center-pipe.gap/2>=20,'top pillar keeps a visible edge');
    assert.ok(pipe.center+pipe.gap/2<=WORLD.ground-20,'bottom pillar keeps a visible edge');
  }
  assert.ok(Math.min(...centers)<75);assert.ok(Math.max(...centers)>200);
  for(const inZone of [y=>y<100,y=>y>=100&&y<=178,y=>y>178]){
    assert.ok(centers.filter(inZone).length>=25,'every altitude appears regularly');
  }
  assert.ok(centers.filter((y,i)=>i>0&&Math.abs(y-centers[i-1])>100).length>=25,'large climbs and drops are common');
});

test('a simple timing controller can pass 20 varying column pairs', () => {
  let seed=71;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const run=createRun(random);flap(run);
  for(let frame=0;frame<120*60&&run.status==='playing'&&run.score<20;frame++){
    const next=run.pipes.find(pipe=>pipe.x+WORLD.pipeWidth+4>WORLD.playerX-WORLD.radius);
    const target=next?.center??139;
    if(run.y>target+24&&run.velocity>0)flap(run);
    advance(run,1/120);
  }
  assert.equal(run.status,'playing');assert.equal(run.score,20);
});
