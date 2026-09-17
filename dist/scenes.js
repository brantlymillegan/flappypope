export const SCENES = [
  { id: 'rome-basilica', name: 'Roman Basilica', accent: 'marble' },
  { id: 'assisi-hills', name: 'Assisi Hills', accent: 'sandstone' },
  { id: 'alpine-chapel', name: 'Alpine Chapel', accent: 'granite' },
  { id: 'gothic-cathedral', name: 'Gothic Cathedral', accent: 'granite' },
  { id: 'monastery-garden', name: 'Monastery Garden', accent: 'sandstone' },
  { id: 'seaside-church', name: 'Seaside Church', accent: 'marble' },
  { id: 'spanish-mission', name: 'Spanish Mission', accent: 'sandstone' },
  { id: 'island-abbey', name: 'Island Abbey', accent: 'granite' },
  { id: 'woodland-shrine', name: 'Woodland Chapel', accent: 'sandstone' },
  { id: 'riverside-basilica', name: 'Riverside Basilica', accent: 'marble' },
].map(scene => ({ ...scene, asset: new URL(`./assets/scenes/${scene.id}.png`, import.meta.url).href }));

const cache = new Map();
export function loadScene(scene) {
  if (!cache.has(scene.id)) {
    const image = new Image();
    const promise = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => { cache.delete(scene.id); reject(new Error(`Could not load ${scene.name}.`)); };
    });
    image.src = scene.asset;
    cache.set(scene.id, promise);
  }
  return cache.get(scene.id);
}

export function drawScene(ctx, image, theme, viewport) {
  const panelHeight = image.naturalHeight / 2;
  const sourceY = theme === 'light' ? 0 : panelHeight;
  // Paired day/night panels keep the same framing. Keep the church in the phone crop.
  const offset = viewport.width < 639 ? viewport.left + viewport.width / 2 - 640 * .55 : 0;
  ctx.drawImage(image, 0, sourceY, image.naturalWidth, panelHeight, Math.round(offset), 0, 640, 281);
}

const palettes = {
  dark: { edge: '#302738', stone: '#7f7089', light: '#b0a0b2', shadow: '#524760', mortar: '#62566f', trim: '#efc67e', trimShade: '#a88162', recess: '#302c47', cross: '#ffe1a0', floor: '#494454', tile: '#716578', tileLight: '#9d8897' },
  light: { edge: '#655663', stone: '#ddd4c4', light: '#fff4dc', shadow: '#b0a3a3', mortar: '#c0b0aa', trim: '#c59a51', trimShade: '#8e7050', recess: '#64566b', cross: '#ffdc77', floor: '#a49d9c', tile: '#dbcdba', tileLight: '#f5e4c5' },
};
export function sceneryPalette(theme, accent) {
  const palette = { ...palettes[theme] };
  if (accent === 'sandstone') Object.assign(palette, theme === 'light' ? { stone: '#e6caad', light: '#fff0d6', shadow: '#b99585', mortar: '#c5a58d' } : { stone: '#967b86', light: '#c2a3a7', shadow: '#665362', mortar: '#745d6d' });
  if (accent === 'granite') Object.assign(palette, theme === 'light' ? { stone: '#cbd2d5', light: '#eff2ec', shadow: '#929cab', mortar: '#a8b0bc' } : { stone: '#777e99', light: '#a5b1c4', shadow: '#474e69', mortar: '#575f7a' });
  return palette;
}

function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function roseWindow(ctx, x, y, palette) {
  const pixels = ['   ooo   ',' ooyyyoo ',' oybbrbyo ','oybbyrryo','oyyyyyyyo','oygbyrryo',' oyggbyo ',' ooyyyoo ','   ooo   '];
  const colors = { o: palette.edge, y: '#f4c979', b: '#76b7dd', r: '#ce7187', g: '#95c5b6' };
  pixels.forEach((row, yy) => [...row].forEach((pixel, xx) => { if (colors[pixel]) rect(ctx,x+xx*2,y+yy*2,2,2,colors[pixel]); }));
}
function crossNiche(ctx, x, y, palette) {
  rect(ctx,x+6,y,9,3,palette.trim);rect(ctx,x+3,y+3,15,3,palette.trim);rect(ctx,x,y+6,21,27,palette.edge);
  rect(ctx,x+2,y+7,17,24,palette.recess);
  rect(ctx,x+9,y+9,3,18,palette.cross);rect(ctx,x+4,y+14,13,3,palette.cross);
  rect(ctx,x-1,y+32,23,3,palette.trim);rect(ctx,x+2,y+35,17,2,palette.trimShade);
}
function bellNiche(ctx, x, y, palette) {
  rect(ctx,x+5,y,11,3,palette.edge);rect(ctx,x+2,y+3,17,4,palette.edge);rect(ctx,x,y+7,21,22,palette.edge);
  rect(ctx,x+3,y+7,15,19,palette.recess);rect(ctx,x+9,y+8,3,4,palette.trimShade);
  rect(ctx,x+7,y+12,7,7,palette.trim);rect(ctx,x+5,y+19,11,3,palette.cross);rect(ctx,x+9,y+22,3,3,palette.trim);
  rect(ctx,x-1,y+29,23,3,palette.light);
}

// Projecting capitals stay inside the existing obstacle collision boundaries.
export function drawCatholicColumn(ctx, x, start, end, top, palette) {
  const height = end - start;
  if (height <= 0) return;
  ctx.save();ctx.beginPath();ctx.rect(Math.round(x-4),Math.round(start),47,Math.round(height));ctx.clip();
  rect(ctx,x,start,39,height,palette.edge);rect(ctx,x+2,start,34,height,palette.stone);
  for (let y=Math.floor(start/16)*16;y<end;y+=16) {
    rect(ctx,x+2,y,34,1,palette.mortar);rect(ctx,x+(Math.floor(y/16)%2?14:26),y,1,16,palette.mortar);
  }
  // Paired fluted pilasters and a recessed central bay.
  rect(ctx,x+2,start,4,height,palette.light);rect(ctx,x+6,start,2,height,palette.shadow);
  rect(ctx,x+31,start,3,height,palette.light);rect(ctx,x+34,start,3,height,palette.shadow);
  const capY = top ? end-11 : start;
  rect(ctx,x-4,capY,47,3,palette.trim);rect(ctx,x-4,capY+3,47,2,palette.trimShade);
  rect(ctx,x-2,capY+5,43,4,palette.light);rect(ctx,x,capY+9,39,2,palette.edge);
  for(let i=0;i<5;i++)rect(ctx,x+3+i*7,capY+6,2,3,palette.trimShade);
  if(height>=55)crossNiche(ctx,x+9,top?end-51:start+16,palette);
  if(height>=86)roseWindow(ctx,x+11,top?end-78:start+60,palette);
  if(height>=136)bellNiche(ctx,x+9,top?end-121:start+89,palette);
  // Small repeating golden cross inlays on taller sections.
  if(height>=177){const y=top?end-157:start+143;rect(ctx,x+18,y,3,17,palette.trim);rect(ctx,x+13,y+5,13,3,palette.trim);}
  ctx.restore();
}

export function drawChurchFloor(ctx, distance, palette) {
  rect(ctx,0,278,640,2,palette.trim);rect(ctx,0,280,640,3,palette.trimShade);rect(ctx,0,283,640,17,palette.floor);
  const shift = Math.floor(distance)%24;
  for(let x=-24-shift;x<664;x+=24){rect(ctx,x,284,22,6,palette.tile);rect(ctx,x+1,284,20,1,palette.tileLight);rect(ctx,x+12,292,22,7,palette.shadow);}
}
