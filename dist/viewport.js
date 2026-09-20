import { WORLD } from './game-model.js';

export function gameViewport(width, height, fullscreen) {
  if (fullscreen) {
    const canvasWidth = Math.max(1, Math.round(WORLD.height * width / Math.max(1, height)));
    // Keep the full flight height and square pixels, with the flyer on the left.
    const left = WORLD.playerX - Math.min(WORLD.playerX, canvasWidth * .25);
    return { left, width: canvasWidth, canvasWidth, cameraLeft: left };
  }
  const scale = Math.max(width / WORLD.width, height / WORLD.height, .001);
  const visibleWidth = Math.min(WORLD.width, width / scale);
  return { left: (WORLD.width - visibleWidth) * .25, width: visibleWidth, canvasWidth: WORLD.width, cameraLeft: 0 };
}
