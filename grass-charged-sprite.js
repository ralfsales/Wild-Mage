(() => {
  if (typeof AreaAttack === 'undefined') return;

  const grassChargedSprite = new Image();
  grassChargedSprite.src = 'assets/effects/grass-charged-ring.webp';

  const previousAreaAttackDraw = AreaAttack.prototype.draw;

  AreaAttack.prototype.draw = function() {
    const useApprovedGrassSprite =
      this.element === 'grass' &&
      (this.charged || this.explosiveUpgrade) &&
      grassChargedSprite.complete &&
      grassChargedSprite.naturalWidth;

    if (!useApprovedGrassSprite) {
      previousAreaAttackDraw.call(this);
      return;
    }

    const progress = Math.max(0, Math.min(1, this.age / this.life));
    const minimumRadius = this.explosiveUpgrade ? 3 : 8;
    const radius = Math.max(minimumRadius, this.maxRadius * progress);
    const diameter = radius * 2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.age * -0.45);
    ctx.globalAlpha = 0.98 - progress * 0.16;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      grassChargedSprite,
      -diameter / 2,
      -diameter / 2,
      diameter,
      diameter
    );
    ctx.restore();
  };
})();
