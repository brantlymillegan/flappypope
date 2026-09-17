import test from 'node:test';
import assert from 'node:assert/strict';
import { Chiptune } from '../dist/audio.js';
import { HYMNS } from '../dist/hymns.js';

function player(){
  const audio=new Chiptune();audio.context={currentTime:10,state:'running'};
  audio.note=()=>{};audio.unlock=async()=>{};audio.setTrack(HYMNS[0]);return audio;
}

test('returning to an already-playing menu does not reset the music deadline',()=>{
  const audio=player();audio.nextNote=12;
  audio.setPaused(false);assert.equal(audio.nextNote,12);
  audio.setPaused(true);audio.context.currentTime=20;audio.setPaused(false);
  assert.equal(audio.nextNote,20.05);
});

test('quick unmute schedules fresh audio instead of waiting for the previous held note',()=>{
  const audio=player();audio.nextNote=12;
  audio.setEnabled(false);audio.context.currentTime=10.2;audio.setEnabled(true);
  assert.equal(audio.nextNote,10.25);
});

test('switching hymns stops old voices and starts the new melody at its first note',()=>{
  const audio=player();let stopped=0;audio.voices.add({stop:()=>stopped++});
  audio.step=10;audio.beat=8;audio.setTrack(HYMNS[1]);
  assert.equal(stopped,1);assert.equal(audio.voices.size,0);assert.equal(audio.step,0);assert.equal(audio.beat,0);assert.equal(audio.track.id,HYMNS[1].id);
  const heard=[];audio.note=(pitch,time)=>heard.push([pitch,time]);audio.schedule();
  assert.ok(heard.length>0);assert.equal(heard[0][0],HYMNS[1].melody[0][0]+audio.transpose);
});
