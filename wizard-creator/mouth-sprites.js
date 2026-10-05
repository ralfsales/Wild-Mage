window.WILD_MAGE_MOUTH_SPRITES = {
  thinSmile: 'assets/mouth/thin-smile.png',
  thinStraight: 'assets/mouth/thin-straight.png',
  thickSmile: 'assets/mouth/thick-smile.png',
  thickStraight: 'assets/mouth/thick-straight.png'
};

window.WILD_MAGE_LIP_COLORS = {
  none: null,
  softPink: '#d97988',
  red: '#b72e3f',
  plum: '#713449'
};

// Draws a neutral grayscale sprite, then tints it while preserving
// highlights/shadows and the original transparent alpha channel.
window.drawTintedMouth = function drawTintedMouth(ctx, image, color, x = 0, y = 0, width = image.width, height = image.height) {
  ctx.save();
  ctx.drawImage(image, x, y, width, height);
  if (color) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.42;
    ctx.drawImage(image, x, y, width, height);
  }
  ctx.restore();
};
