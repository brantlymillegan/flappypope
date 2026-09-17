import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SCENES } from '../dist/scenes.js';
import { HYMNS } from '../dist/hymns.js';

test('all ten settings have bundled square day/night atlases', async () => {
  assert.equal(SCENES.length,10);assert.equal(new Set(SCENES.map(scene=>scene.id)).size,10);
  for(const scene of SCENES){
    const png=await readFile(new URL(scene.asset));
    assert.equal(png.toString('ascii',1,4),'PNG');
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    assert.equal(width,height,scene.id);assert.equal(height%2,0,scene.id);assert.ok(width>=640,scene.id);
  }
});

test('all ten hymns have distinct source-based melodies that can loop at their tempos', () => {
  assert.equal(HYMNS.length,10);assert.equal(new Set(HYMNS.map(track=>track.id)).size,10);
  assert.equal(new Set(HYMNS.map(track=>JSON.stringify(track.melody))).size,10);
  for(const track of HYMNS){
    assert.ok(track.source.startsWith('https://'),track.id);
    assert.ok(track.tempo>=60&&track.tempo<=180,track.id);
    let beats=0;
    for(const [pitch,length] of track.melody){assert.ok(pitch===null||(Number.isInteger(pitch)&&pitch>=36&&pitch<=96),track.id);assert.ok(Number.isFinite(length)&&length>0,track.id);beats+=length;}
    const seconds=beats*60/track.tempo;assert.ok(seconds>=15&&seconds<=100,`${track.id}: ${seconds}s`);
  }
});
