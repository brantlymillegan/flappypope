import test from 'node:test';
import assert from 'node:assert/strict';
import { ShuffleBag } from '../dist/rotation.js';

test('random rotations use all ten entries before repeating and never repeat across cycles', () => {
  const items=Array.from({length:10},(_,i)=>i);
  let seed=19;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const bag=new ShuffleBag(items,random);let previous=null;
  for(let cycle=0;cycle<20;cycle++){
    const seen=new Set();
    for(let i=0;i<10;i++){const next=bag.next();assert.notEqual(next,previous);seen.add(next);previous=next;}
    assert.equal(seen.size,10);
  }
});

test('rotations also handle a fixed random source and a single-item collection', () => {
  const bag=new ShuffleBag(['a','b','c'],()=>0);
  const values=Array.from({length:12},()=>bag.next());
  for(let i=1;i<values.length;i++)assert.notEqual(values[i],values[i-1]);
  assert.equal(new ShuffleBag(['only']).next(),'only');
  assert.throws(()=>new ShuffleBag([]),/at least one item/);
});
