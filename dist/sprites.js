const palette = { o:'#382c3c', w:'#fff3d6', s:'#c9c6d4', g:'#e7b95e', y:'#ffdf83', b:'#9c6d38', f:'#edb495', h:'#c78675', e:'#392d38', r:'#c98178', t:'#765044', d:'#4f3540', c:'#b38457', a:'#9f876a' };
const maps = {
  pope: [
    '       oo         ',
    '      oww o       ',
    '     owwwwwo      ',
    '     owwwgwo      ',
    '    owwwgggwo     ',
    '    owwwwgwwo     ',
    '    owwwwwwwo     ',
    '    ogggggggo     ',
    '    osssffffo     ',
    '    owsffffeo     ',
    '    owshfffffo    ',
    '     osffffhhfo   ',
    '      offffwoo    ',
    '      owwwwo      ',
    '     owwwwgo      ',
    '      owwgo       ',
  ],
  angel: [
    '      ggggggg     ',
    '     gy     yg    ',
    '      ggggggg     ',
    '                  ',
    '     bgggggbo     ',
    '    bgyyyyygbo    ',
    '    ogyyyyyygo    ',
    '   ogyyyyffffo    ',
    '   oggyyffffeo    ',
    '   ogyyhffffffo   ',
    '   oggyfffffhffo  ',
    '    ogyfffffeoo   ',
    '     ogfffffo     ',
    '      offffo      ',
    '     owwwwgo      ',
    '      owwwo       ',
  ],
  friar: [
    '                  ',
    '                  ',
    '      offffo      ',
    '     offffffo     ',
    '    otfffffffo    ',
    '    otttfffffo    ',
    '    otttttfffo    ',
    '    otttffffeo    ',
    '    otthffffffo   ',
    '     otfffffhffo  ',
    '      offcffeoo   ',
    '      occccco     ',
    '     ottccco      ',
    '     ottttto      ',
    '     ottttco      ',
    '      otcco       ',
  ],
  bell: [
    '         oo       ',
    '        oggo      ',
    '         bo       ',
    '       obggbo     ',
    '      obgyygbo    ',
    '      obgyyygo    ',
    '     obggyyygo    ',
    '     obgyyyygo    ',
    '    obggyyyygbo   ',
    '    obgyyyyyggo   ',
    '   obggyyyyyygbo  ',
    '  obgggggggggggo  ',
    '   obbbbbbbbbbo   ',
    '    oooooooggo    ',
    '           oggo   ',
    '            oo    ',
  ],
};
function pixel(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x,y,w,h); }
function wing(ctx, side, up) {
  ctx.save();ctx.scale(side,1);
  const y = up ? -5 : 0;
  pixel(ctx,5,y,7,5,'#89829b');pixel(ctx,8,y-2,5,6,'#e1dfea');pixel(ctx,11,y-5,5,7,'#fff5df');pixel(ctx,14,y-7,3,7,'#fff5df');
  pixel(ctx,7,y+3,6,3,'#b6b2cd');pixel(ctx,10,y+1,6,3,'#ece5ef');pixel(ctx,13,y-1,4,3,'#fff5df');
  ctx.restore();
}
export function drawSprite(ctx, character, x, y, scale = 1, wingUp = true, rotation = 0) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(rotation);ctx.scale(scale,scale);
  // Both wings trail to the left so every flyer reads as a right-facing profile.
  ctx.save();ctx.translate(5,-3);ctx.globalAlpha=.8;wing(ctx,-1,!wingUp);ctx.restore();
  const map = maps[character] || maps.pope;
  map.forEach((row, yy) => [...row].forEach((char,xx) => { if(palette[char]) pixel(ctx,xx-8,yy-9,1,1,palette[char]); }));
  ctx.save();ctx.translate(2,2);wing(ctx,-1,wingUp);ctx.restore();
  ctx.restore();
}
export function paintPortrait(canvas, character, scale = 1.7) {
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);drawSprite(ctx,character,canvas.width/2,canvas.height/2+3,scale,true);
}
