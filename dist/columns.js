import { sceneryPalette } from './scenes.js';

export const COLUMN_STYLES = [
  { id: 'basilica-marble', name: 'Basilica Marble', accent: 'marble' },
  { id: 'gothic-tracery', name: 'Gothic Tracery', accent: 'granite' },
  { id: 'romanesque-abbey', name: 'Romanesque Abbey', accent: 'sandstone' },
  { id: 'campanile', name: 'Campanile Bells', accent: 'sandstone' },
  { id: 'cosmati-mosaic', name: 'Cosmati Mosaic', accent: 'marble' },
  { id: 'papal-keys', name: 'Papal Keys', accent: 'marble' },
  { id: 'celtic-abbey', name: 'Celtic Abbey', accent: 'granite' },
  { id: 'monastery-timber', name: 'Monastery Timber', accent: 'sandstone' },
  { id: 'baroque-chapel', name: 'Baroque Chapel', accent: 'marble' },
  { id: 'stained-glass', name: 'Stained Glass', accent: 'granite' },
];

const materials = {
  'basilica-marble': {
    light: { stone: '#eee5d0', light: '#fff8e7', shadow: '#b6aaa0', recess: '#915566', jewel: '#ba6975' },
    dark: { stone: '#ada5b5', light: '#ded4d0', shadow: '#726981', recess: '#673c58', jewel: '#d9879b' },
  },
  'gothic-tracery': {
    light: { stone: '#9daebe', light: '#e0e8e2', shadow: '#718095', recess: '#303d57', jewel: '#76d5d7' },
    dark: { stone: '#63778f', light: '#abbfd0', shadow: '#3b4867', recess: '#22263d', jewel: '#85e6dc' },
  },
  'romanesque-abbey': {
    light: { stone: '#deb082', light: '#ffe2b1', shadow: '#a77360', recess: '#805348', jewel: '#ce8262' },
    dark: { stone: '#b08b7e', light: '#e6bd96', shadow: '#715367', recess: '#493a4f', jewel: '#de9b77' },
  },
  campanile: {
    light: { stone: '#c46f5c', light: '#f2a47c', shadow: '#894c4a', mortar: '#efc4a0', recess: '#513c49', jewel: '#ffcb63' },
    dark: { stone: '#914f60', light: '#ce8088', shadow: '#563b52', mortar: '#b08792', recess: '#2f293e', jewel: '#ffe494' },
  },
  'cosmati-mosaic': {
    light: { stone: '#ece5cb', light: '#fff7df', shadow: '#aa9a8c', recess: '#275f5d', jewel: '#ba4e56', secondary: '#268b77' },
    dark: { stone: '#b8acb5', light: '#e5dace', shadow: '#756579', recess: '#183e4b', jewel: '#e4818a', secondary: '#60bdaa' },
  },
  'papal-keys': {
    light: { stone: '#3d6490', light: '#7da2bd', shadow: '#253b64', recess: '#273958', jewel: '#fff2c7', secondary: '#edd9b0' },
    dark: { stone: '#364668', light: '#748eae', shadow: '#222943', recess: '#202338', jewel: '#fff4cf', secondary: '#cbd6e5' },
  },
  'celtic-abbey': {
    light: { stone: '#a6b69a', light: '#e5e3be', shadow: '#758978', recess: '#53655d', jewel: '#547c5b', secondary: '#bacc83' },
    dark: { stone: '#697e7a', light: '#adba9c', shadow: '#3d5258', recess: '#303e47', jewel: '#89b487', secondary: '#b8c893' },
  },
  'monastery-timber': {
    light: { stone: '#a16b45', light: '#e1a865', shadow: '#714b3c', mortar: '#805038', recess: '#5a3d36', jewel: '#4f5661', secondary: '#95969a' },
    dark: { stone: '#805967', light: '#c89378', shadow: '#523a50', mortar: '#684554', recess: '#3d3043', jewel: '#87909d', secondary: '#b5adad' },
  },
  'baroque-chapel': {
    light: { stone: '#c8969b', light: '#ffe4ce', shadow: '#966b82', recess: '#8e566f', jewel: '#fff0b3' },
    dark: { stone: '#896581', light: '#d9acb1', shadow: '#543d60', recess: '#54374f', jewel: '#ffe3a0' },
  },
  'stained-glass': {
    light: { stone: '#466e7b', light: '#abcacc', shadow: '#2d435e', recess: '#25384e', jewel: '#55c9c2', secondary: '#bb718f', blue: '#559bd5' },
    dark: { stone: '#42516f', light: '#8ba7bf', shadow: '#27314d', recess: '#22283d', jewel: '#80e7d3', secondary: '#e991b5', blue: '#82bded' },
  },
};

export function columnPalette(theme, style = COLUMN_STYLES[0]) {
  const mode = theme === 'light' ? 'light' : 'dark';
  const material = materials[style.id] || materials[COLUMN_STYLES[0].id];
  return { ...sceneryPalette(mode, style.accent), ...material[mode] };
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function cross(ctx, x, y, p, color = p.trim) {
  rect(ctx, x + 4, y, 3, 15, color);
  rect(ctx, x, y + 4, 11, 3, color);
}
function masonry(ctx, x, start, end, p, row = 12, brick = 17) {
  for (let y = Math.floor(start / row) * row; y < end; y += row) {
    rect(ctx, x + 2, y, 35, 1, p.mortar);
    const shift = Math.abs(Math.floor(y / row) % 2) * Math.floor(brick / 2);
    for (let xx = x + 2 + shift; xx < x + 37; xx += brick) rect(ctx, xx, y, 1, row, p.mortar);
  }
}
function pilasters(ctx, x, start, height, p, width = 4) {
  rect(ctx, x + 2, start, width, height, p.light);
  rect(ctx, x + 2 + width, start, 2, height, p.shadow);
  rect(ctx, x + 35 - width, start, width, height, p.light);
  rect(ctx, x + 35, start, 2, height, p.shadow);
}
function pointedFrame(ctx, x, y, p, height = 33, frame = p.light) {
  rect(ctx, x + 8, y, 5, 3, frame);
  rect(ctx, x + 5, y + 3, 11, 3, frame);
  rect(ctx, x + 2, y + 6, 17, 3, frame);
  rect(ctx, x, y + 9, 21, height - 9, frame);
  rect(ctx, x + 8, y + 4, 5, 3, p.recess);
  rect(ctx, x + 5, y + 7, 11, 3, p.recess);
  rect(ctx, x + 3, y + 10, 15, height - 13, p.recess);
}
function roundFrame(ctx, x, y, p) {
  rect(ctx, x + 5, y, 13, 3, p.light);
  rect(ctx, x + 2, y + 3, 19, 4, p.light);
  rect(ctx, x, y + 7, 23, 26, p.light);
  rect(ctx, x + 6, y + 4, 11, 3, p.recess);
  rect(ctx, x + 3, y + 7, 17, 23, p.recess);
  rect(ctx, x - 1, y + 31, 25, 3, p.shadow);
}
function rose(ctx, x, y, p) {
  rect(ctx, x + 4, y, 10, 18, p.edge);
  rect(ctx, x, y + 4, 18, 10, p.edge);
  rect(ctx, x + 3, y + 3, 12, 12, p.jewel);
  rect(ctx, x + 7, y + 1, 4, 16, p.trim);
  rect(ctx, x + 1, y + 7, 16, 4, p.trim);
  rect(ctx, x + 6, y + 6, 6, 6, p.recess);
  rect(ctx, x + 8, y + 8, 2, 2, p.cross);
}
function diamond(ctx, x, y, color, size = 2) {
  rect(ctx, x + size, y, size, size * 3, color);
  rect(ctx, x, y + size, size * 3, size, color);
}
function bell(ctx, x, y, p) {
  rect(ctx, x + 6, y, 3, 4, p.trimShade);
  rect(ctx, x + 4, y + 4, 7, 3, p.trim);
  rect(ctx, x + 2, y + 7, 11, 9, p.trim);
  rect(ctx, x + 2, y + 7, 3, 8, p.cross);
  rect(ctx, x, y + 15, 15, 3, p.cross);
  rect(ctx, x + 6, y + 18, 3, 3, p.trimShade);
}
function keys(ctx, x, y, p) {
  // Two interlocking pixel keys, with open bows and opposing teeth.
  rect(ctx, x, y, 7, 7, p.trim);
  rect(ctx, x + 2, y + 2, 3, 3, p.recess);
  rect(ctx, x + 16, y, 7, 7, p.secondary);
  rect(ctx, x + 18, y + 2, 3, 3, p.recess);
  for (let i = 0; i < 6; i++) {
    rect(ctx, x + 5 + i * 2, y + 6 + i * 2, 3, 3, p.trim);
    rect(ctx, x + 15 - i * 2, y + 6 + i * 2, 3, 3, p.secondary);
  }
  rect(ctx, x + 15, y + 15, 7, 3, p.trim);
  rect(ctx, x + 19, y + 16, 3, 5, p.trim);
  rect(ctx, x + 1, y + 15, 7, 3, p.secondary);
  rect(ctx, x + 1, y + 16, 3, 5, p.secondary);
}
function mitre(ctx, x, y, p) {
  rect(ctx, x + 6, y, 3, 3, p.jewel);
  rect(ctx, x + 3, y + 3, 9, 5, p.jewel);
  rect(ctx, x + 1, y + 8, 13, 11, p.jewel);
  rect(ctx, x + 1, y + 17, 13, 3, p.trim);
  rect(ctx, x + 6, y + 5, 3, 12, p.trimShade);
  rect(ctx, x + 3, y + 9, 9, 3, p.trimShade);
}
function celticCross(ctx, x, y, p) {
  rect(ctx, x + 5, y + 2, 13, 3, p.light);
  rect(ctx, x + 2, y + 5, 3, 12, p.light);
  rect(ctx, x + 18, y + 5, 3, 12, p.light);
  rect(ctx, x + 5, y + 17, 13, 3, p.light);
  rect(ctx, x + 9, y, 5, 28, p.trimShade);
  rect(ctx, x, y + 8, 23, 5, p.trimShade);
  rect(ctx, x + 10, y, 3, 27, p.light);
  rect(ctx, x, y + 9, 22, 3, p.light);
  rect(ctx, x + 10, y + 9, 3, 3, p.jewel);
}

// The cap always ends at the gap, and its entire width is opaque. Ornament
// remains within the same 39px shaft / 47px capital as the collision model.
function capital(ctx, x, y, top, p, id) {
  rect(ctx, x - 4, y, 47, 12, p.edge);
  rect(ctx, x - 3, y + 1, 45, 10, p.stone);
  const lip = top ? y + 9 : y + 1;
  rect(ctx, x - 4, lip, 47, 3, p.trim);
  switch (id) {
    case 'gothic-tracery':
      rect(ctx, x - 2, y + 4, 43, 3, p.light);
      for (let i = 0; i < 7; i++) rect(ctx, x + i * 6, y + 6, 3, 3, p.recess);
      break;
    case 'romanesque-abbey':
      rect(ctx, x - 2, y + 4, 43, 4, p.light);
      for (let i = 0; i < 5; i++) rect(ctx, x + 1 + i * 8, y + 4, 2, 4, p.shadow);
      break;
    case 'campanile':
      rect(ctx, x - 2, y + 4, 43, 2, p.light);
      for (let i = 0; i < 7; i++) rect(ctx, x + i * 6, y + 6, 3, 3, p.shadow);
      break;
    case 'cosmati-mosaic':
      rect(ctx, x - 2, y + 4, 43, 4, p.light);
      for (let i = 0; i < 10; i++) rect(ctx, x + i * 4, y + 4, 3, 3, i % 2 ? p.jewel : p.secondary);
      break;
    case 'papal-keys':
      rect(ctx, x - 2, y + 4, 43, 4, p.recess);
      for (let i = 0; i < 5; i++) diamond(ctx, x + 1 + i * 8, y + 3, p.cross, 1);
      break;
    case 'celtic-abbey':
      rect(ctx, x - 2, y + 4, 43, 4, p.shadow);
      for (let i = 0; i < 7; i++) {
        rect(ctx, x + i * 6, y + 4, 4, 2, p.light);
        rect(ctx, x + 2 + i * 6, y + 6, 4, 2, p.light);
      }
      break;
    case 'monastery-timber':
      rect(ctx, x - 2, y + 4, 43, 4, p.jewel);
      for (let i = 0; i < 5; i++) rect(ctx, x + 2 + i * 8, y + 5, 2, 2, p.secondary);
      break;
    case 'baroque-chapel':
      rect(ctx, x - 2, y + 3, 43, 6, p.trimShade);
      rect(ctx, x + 6, y + 5, 27, 2, p.cross);
      for (const dx of [-1, 33]) {
        rect(ctx, x + dx, y + 3, 7, 6, p.trim);
        rect(ctx, x + dx + 2, y + 5, 3, 2, p.recess);
      }
      break;
    case 'stained-glass':
      rect(ctx, x - 2, y + 4, 43, 4, p.edge);
      for (let i = 0; i < 7; i++) rect(ctx, x + i * 6, y + 4, 4, 3, i % 2 ? p.secondary : p.jewel);
      break;
    default:
      rect(ctx, x - 2, y + 4, 43, 4, p.light);
      for (let i = 0; i < 6; i++) rect(ctx, x + i * 7, y + 6, 3, 3, p.trimShade);
  }
}

function body(ctx, x, start, end, p, id) {
  const height = end - start;
  switch (id) {
    case 'basilica-marble':
      pilasters(ctx, x, start, height, p, 4);
      rect(ctx, x + 10, start, 2, height, p.shadow);
      rect(ctx, x + 27, start, 2, height, p.light);
      for (let y = Math.floor(start / 29) * 29; y < end; y += 29) {
        rect(ctx, x + 13, y, 7, 1, p.shadow);
        rect(ctx, x + 18, y + 1, 5, 1, p.shadow);
      }
      break;
    case 'gothic-tracery':
      masonry(ctx, x, start, end, p, 18, 19);
      pilasters(ctx, x, start, height, p, 3);
      rect(ctx, x + 8, start, 2, height, p.shadow);
      rect(ctx, x + 29, start, 2, height, p.light);
      break;
    case 'romanesque-abbey':
      masonry(ctx, x, start, end, p, 10, 14);
      rect(ctx, x + 2, start, 2, height, p.light);
      rect(ctx, x + 35, start, 2, height, p.shadow);
      break;
    case 'campanile':
      masonry(ctx, x, start, end, p, 7, 11);
      rect(ctx, x + 2, start, 3, height, p.shadow);
      rect(ctx, x + 34, start, 3, height, p.light);
      break;
    case 'cosmati-mosaic':
      rect(ctx, x + 3, start, 5, height, p.recess);
      rect(ctx, x + 31, start, 5, height, p.recess);
      for (let y = Math.floor(start / 8) * 8; y < end; y += 8) {
        diamond(ctx, x + 3, y, p.light, 1);
        diamond(ctx, x + 32, y + 4, p.light, 1);
      }
      break;
    case 'papal-keys':
      rect(ctx, x + 3, start, 3, height, p.trim);
      rect(ctx, x + 7, start, 1, height, p.light);
      rect(ctx, x + 31, start, 1, height, p.light);
      rect(ctx, x + 33, start, 3, height, p.trim);
      break;
    case 'celtic-abbey':
      masonry(ctx, x, start, end, p, 15, 24);
      rect(ctx, x + 3, start, 4, height, p.shadow);
      rect(ctx, x + 32, start, 4, height, p.shadow);
      for (let y = Math.floor(start / 10) * 10; y < end; y += 10) {
        rect(ctx, x + 3, y, 2, 5, p.light);
        rect(ctx, x + 5, y + 5, 2, 5, p.light);
        rect(ctx, x + 34, y, 2, 5, p.light);
        rect(ctx, x + 32, y + 5, 2, 5, p.light);
        rect(ctx, x + 9, y + 2, 4, 2, p.jewel);
      }
      break;
    case 'monastery-timber':
      for (const dx of [3, 12, 25, 34]) rect(ctx, x + dx, start, 2, height, p.shadow);
      for (let y = Math.floor(start / 23) * 23; y < end; y += 23) {
        rect(ctx, x + 6, y, 1, 12, p.light);
        rect(ctx, x + 28, y + 6, 2, 9, p.light);
        rect(ctx, x + 15, y + 3, 4, 2, p.shadow);
        rect(ctx, x + 19, y + 5, 2, 6, p.shadow);
      }
      break;
    case 'baroque-chapel':
      rect(ctx, x + 13, start, 13, height, p.recess);
      for (let y = Math.floor(start / 12) * 12; y < end; y += 12) {
        rect(ctx, x + 2, y, 10, 6, p.trimShade);
        rect(ctx, x + 4, y, 7, 3, p.cross);
        rect(ctx, x + 2, y + 6, 10, 6, p.trim);
        rect(ctx, x + 2, y + 6, 7, 3, p.cross);
        rect(ctx, x + 27, y, 10, 6, p.trim);
        rect(ctx, x + 27, y, 7, 3, p.cross);
        rect(ctx, x + 27, y + 6, 10, 6, p.trimShade);
        rect(ctx, x + 29, y + 6, 7, 3, p.cross);
      }
      break;
    case 'stained-glass':
      rect(ctx, x + 3, start, 3, height, p.trim);
      rect(ctx, x + 33, start, 3, height, p.trim);
      rect(ctx, x + 8, start, 23, height, p.recess);
      for (let y = Math.floor(start / 10) * 10; y < end; y += 10) {
        rect(ctx, x + 9, y + 1, 9, 8, p.blue);
        rect(ctx, x + 21, y + 1, 9, 8, p.secondary);
        rect(ctx, x + 18, y + 1, 3, 8, p.jewel);
      }
      break;
  }
}

function motif(ctx, x, y, p, id, index) {
  switch (id) {
    case 'basilica-marble':
      rect(ctx, x + 11, y, 17, 31, p.trimShade);
      rect(ctx, x + 13, y + 2, 13, 27, p.recess);
      cross(ctx, x + 14, y + 7, p, p.cross);
      rect(ctx, x + 9, y + 30, 21, 3, p.light);
      break;
    case 'gothic-tracery':
      pointedFrame(ctx, x + 9, y, p);
      if (index % 2) {
        rose(ctx, x + 11, y + 12, p);
      } else {
        rect(ctx, x + 14, y + 13, 4, 16, p.jewel);
        rect(ctx, x + 22, y + 13, 3, 16, p.jewel);
        rect(ctx, x + 18, y + 10, 3, 20, p.trimShade);
        rect(ctx, x + 13, y + 19, 13, 2, p.trimShade);
      }
      break;
    case 'romanesque-abbey':
      roundFrame(ctx, x + 8, y, p);
      cross(ctx, x + 14, y + 10, p, p.cross);
      rect(ctx, x + 12, y + 3, 3, 4, p.shadow);
      rect(ctx, x + 24, y + 3, 3, 4, p.shadow);
      break;
    case 'campanile':
      roundFrame(ctx, x + 8, y, p);
      bell(ctx, x + 12, y + 7, p);
      break;
    case 'cosmati-mosaic':
      rect(ctx, x + 11, y, 17, 32, p.shadow);
      rect(ctx, x + 12, y + 1, 15, 30, p.light);
      for (let row = 0; row < 4; row++) {
        diamond(ctx, x + 15, y + 2 + row * 7, row % 2 ? p.secondary : p.jewel, 2);
      }
      rect(ctx, x + 18, y + 8, 3, 15, p.trimShade);
      rect(ctx, x + 13, y + 12, 13, 3, p.trimShade);
      rect(ctx, x + 19, y + 9, 1, 13, p.cross);
      break;
    case 'papal-keys':
      if (index % 2) mitre(ctx, x + 12, y + 6, p);
      else keys(ctx, x + 8, y + 5, p);
      rect(ctx, x + 9, y + 32, 21, 2, p.trim);
      break;
    case 'celtic-abbey':
      rect(ctx, x + 9, y, 21, 32, p.recess);
      celticCross(ctx, x + 8, y + 2, p);
      break;
    case 'monastery-timber':
      rect(ctx, x + 2, y, 35, 5, p.jewel);
      rect(ctx, x + 4, y + 1, 2, 2, p.secondary);
      rect(ctx, x + 33, y + 1, 2, 2, p.secondary);
      rect(ctx, x + 12, y + 9, 15, 22, p.recess);
      cross(ctx, x + 14, y + 12, p, p.light);
      rect(ctx, x + 19, y + 14, 1, 12, p.trimShade);
      break;
    case 'baroque-chapel':
      rect(ctx, x + 16, y + 1, 7, 3, p.trim);
      rect(ctx, x + 13, y + 4, 13, 24, p.trim);
      rect(ctx, x + 15, y + 6, 9, 19, p.recess);
      rect(ctx, x + 16, y + 28, 7, 3, p.trim);
      rect(ctx, x + 18, y + 9, 3, 14, p.cross);
      rect(ctx, x + 15, y + 13, 9, 3, p.cross);
      break;
    case 'stained-glass':
      pointedFrame(ctx, x + 9, y, p, 34, p.trim);
      rect(ctx, x + 14, y + 11, 4, 9, p.jewel);
      rect(ctx, x + 22, y + 11, 3, 9, p.blue);
      rect(ctx, x + 14, y + 23, 4, 8, p.secondary);
      rect(ctx, x + 22, y + 23, 3, 8, p.jewel);
      rect(ctx, x + 18, y + 8, 4, 23, p.cross);
      rect(ctx, x + 12, y + 19, 15, 4, p.cross);
      break;
  }
}

export function drawCatholicColumn(ctx, x, start, end, top, palette, style = COLUMN_STYLES[0]) {
  const height = end - start;
  if (height <= 0) return;
  const id = style.id;
  ctx.save();
  ctx.beginPath();
  ctx.rect(Math.round(x - 4), Math.round(start), 47, Math.round(height));
  ctx.clip();
  rect(ctx, x, start, 39, height, palette.edge);
  rect(ctx, x + 2, start, 35, height, palette.stone);
  body(ctx, x, start, end, palette, id);
  // Full-size motifs are upright on both the ceiling and floor columns.
  // Position them from the gap so even short pillars have a finished face.
  if (height >= 49) {
    for (let index = 0, offset = 16; offset + 33 <= height; index++, offset += 43) {
      motif(ctx, x, top ? end - offset - 33 : start + offset, palette, id, index);
    }
  } else if (height >= 21) {
    const y = top ? end - 21 : start + 14;
    rect(ctx, x + 18, y, 3, 7, palette.cross);
    rect(ctx, x + 16, y + 2, 7, 2, palette.cross);
  }
  capital(ctx, x, top ? end - 12 : start, top, palette, id);
  ctx.restore();
}
