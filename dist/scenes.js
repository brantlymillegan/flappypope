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
  const offset = Math.round(viewport.width < 639 ? viewport.left + viewport.width / 2 - 640 * .55 : 0);
  ctx.drawImage(image, 0, sourceY, image.naturalWidth, panelHeight, offset, 0, 640, 281);
  // Continue the panorama on wide displays without stretching its pixel art.
  for(let tile=1,x=offset+640;x<viewport.left+viewport.width;tile++,x+=640){
    ctx.save();
    ctx.translate(x+(tile%2?640:0),0);
    if(tile%2)ctx.scale(-1,1);
    ctx.drawImage(image,0,sourceY,image.naturalWidth,panelHeight,0,0,640,281);
    ctx.restore();
  }
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
export function drawChurchFloor(ctx, distance, palette, left=0, width=640) {
  const start=Math.floor(left), span=Math.ceil(left+width)-start;
  rect(ctx,start,278,span,2,palette.trim);rect(ctx,start,280,span,3,palette.trimShade);rect(ctx,start,283,span,17,palette.floor);
  const shift = Math.floor(distance)%24;
  for(let x=Math.floor(left/24)*24-24-shift;x<left+width+24;x+=24){rect(ctx,x,284,22,6,palette.tile);rect(ctx,x+1,284,20,1,palette.tileLight);rect(ctx,x+12,292,22,7,palette.shadow);}
}
