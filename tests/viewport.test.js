import test from 'node:test';
import assert from 'node:assert/strict';
import { gameViewport } from '../dist/viewport.js';
import { WORLD } from '../dist/game-model.js';
import { drawScene, drawChurchFloor, sceneryPalette } from '../dist/scenes.js';

test('fullscreen fits portrait, landscape, square, and ultrawide screens without stretching', () => {
  for (const [width, height] of [[390,844],[844,390],[1024,1024],[1920,1080],[3440,1440],[5120,1440]]) {
    const view = gameViewport(width, height, true);
    const scaleX = width / view.canvasWidth, scaleY = height / WORLD.height;
    assert.ok(Math.abs(scaleX / scaleY - 1) < .005, 'square pixels stay proportional');
    const playerX = WORLD.playerX - view.cameraLeft;
    assert.ok(playerX > WORLD.radius && playerX < view.width / 2, 'flyer is visible toward the left');
    assert.equal(view.left, view.cameraLeft);
    assert.equal(view.width, view.canvasWidth);
  }
});

test('leaving fullscreen restores the original desktop and mobile framing', () => {
  assert.deepEqual(gameViewport(1280,600,false), {left:0,width:640,canvasWidth:640,cameraLeft:0});
  const mobile = gameViewport(360,423,false);
  assert.equal(mobile.canvasWidth, WORLD.width);
  assert.equal(mobile.cameraLeft, 0);
  assert.ok(mobile.width < WORLD.width);
  assert.equal(mobile.left, (WORLD.width-mobile.width)*.25);
});

test('scenery and floor cover the entire fullscreen width, including near the panorama seam', () => {
  for (const width of [139, 577, 600, 638, 639, 640, 1057, 1400]) {
    const view = gameViewport(width, 300, true);
    for (const theme of ['light', 'dark']) {
      const strips = [], floor = [], stack = [];
      let x = 0, scale = 1;
      const ctx = {
        save(){ stack.push([x, scale]); },
        restore(){ [x, scale] = stack.pop(); },
        translate(dx){ x += dx * scale; },
        scale(dx){ scale *= dx; },
        drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh){
          assert.equal(sy, theme === 'light' ? 0 : 627);
          assert.ok(dh >= WORLD.ground);
          const ends = [x + dx * scale, x + (dx + dw) * scale];
          strips.push(ends.sort((a,b)=>a-b));
        },
        fillRect(x,y,w,h){ floor.push({x,y,w,h}); }
      };
      drawScene(ctx, {naturalWidth:1254,naturalHeight:1254}, theme, view);
      strips.sort((a,b)=>a[0]-b[0]);
      assert.ok(strips[0][0] <= view.left);
      assert.ok(strips.at(-1)[1] >= view.left + view.width);
      for(let i=1;i<strips.length;i++)assert.equal(strips[i][0],strips[i-1][1],'no bare-sky seams');
      drawChurchFloor(ctx, 29, sceneryPalette(theme, 'marble'), view.left, view.width);
      for(const row of floor.slice(0,3)){
        assert.ok(row.x <= view.left);
        assert.ok(row.x + row.w >= view.left + view.width);
      }
    }
  }
});
