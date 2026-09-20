import test from 'node:test';
import assert from 'node:assert/strict';
import { COLUMN_STYLES, columnPalette, drawCatholicColumn } from '../dist/columns.js';

// Rasterize the renderer's rectangles so checks cover visible output and gap edges.
function render(style, theme, height, top) {
  const pixels=new Map(), stack=[];
  let bounds=[-Infinity,-Infinity,Infinity,Infinity], path;
  const ctx={
    fillStyle:'#000',
    save(){stack.push([...bounds]);},
    restore(){bounds=stack.pop();},
    beginPath(){path=null;},
    rect(x,y,w,h){path=[x,y,x+w,y+h];},
    clip(){bounds=[Math.max(bounds[0],path[0]),Math.max(bounds[1],path[1]),Math.min(bounds[2],path[2]),Math.min(bounds[3],path[3])];},
    fillRect(x,y,w,h){
      assert.ok([x,y,w,h].every(Number.isFinite));
      assert.equal(typeof this.fillStyle,'string');
      for(let yy=Math.max(y,bounds[1]);yy<Math.min(y+h,bounds[3]);yy++){
        for(let xx=Math.max(x,bounds[0]);xx<Math.min(x+w,bounds[2]);xx++)pixels.set(`${xx},${yy}`,this.fillStyle);
      }
    },
  };
  drawCatholicColumn(ctx,20,10,10+height,top,columnPalette(theme,style),style);
  assert.equal(stack.length,0,'renderer restores the canvas');
  return pixels;
}

test('ten column styles produce different art in each theme',()=>{
  assert.equal(COLUMN_STYLES.length,10);
  assert.equal(new Set(COLUMN_STYLES.map(style=>style.id)).size,10);
  for(const height of [24,180]){
    for(const theme of ['light','dark']){
      const drawings=COLUMN_STYLES.map(style=>JSON.stringify([...render(style,theme,height,false)].sort()));
      assert.equal(new Set(drawings).size,10,`${theme} columns at ${height}px remain distinct`);
    }
  }
  for(const style of COLUMN_STYLES){
    assert.notDeepEqual(render(style,'light',180,false),render(style,'dark',180,false),`${style.id} follows the theme`);
  }
});

test('every style fills its shaft and keeps the entire gap clear',()=>{
  for(const style of COLUMN_STYLES)for(const theme of ['light','dark'])for(const height of [23,55,120,219])for(const top of [true,false]){
    const pixels=render(style,theme,height,top);
    for(const key of pixels.keys()){
      const [x,y]=key.split(',').map(Number);
      assert.ok(x>=16&&x<63&&y>=10&&y<10+height,`${style.id} paints only inside the obstacle`);
    }
    for(let y=10;y<10+height;y++)for(let x=20;x<59;x++)assert.ok(pixels.has(`${x},${y}`),`${style.id} has no invisible shaft collision`);
    const edgeY=top?9+height:10;
    for(let x=16;x<63;x++)assert.ok(pixels.has(`${x},${edgeY}`),`${style.id} shows the full capital at the gap`);
  }
});
