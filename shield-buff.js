(() => {
  const SHIELD_DURATION = 20;
  const originalPickupUpdate = Pickup.prototype.update;
  const originalPlayerDraw = Player.prototype.draw;

  Pickup.prototype.update = function(dt) {
    const collectingShield =
      this.kind === "shield" &&
      !this.dead &&
      game?.state === "playing" &&
      rectsOverlap(this, game.player) &&
      (this.age ?? 0) < PICKUP_LIFETIME;

    originalPickupUpdate.call(this, dt);

    if (!collectingShield || !this.dead) return;

    game.buffs[this.type] = SHIELD_DURATION;

    for (let i = game.floaters.length - 1; i >= 0; i--) {
      const floater = game.floaters[i];
      if (typeof floater.text === "string" && floater.text.includes(`${this.type} shield`)) {
        floater.text = `${this.type} shield · ${SHIELD_DURATION}s`;
        break;
      }
    }
  };

  function drawShieldBubble(actor, type, index, foreground = false) {
    const c = center(actor);
    const pulse = Math.sin((game?.elapsed || 0) * 6 + index * 1.7) * 2;
    const baseRadius = Math.max(actor.w, actor.h) * 1.12;
    const radius = baseRadius + 14 + index * 6 + pulse;
    const color = ELEMENT_COLORS[type] || "#cfb2ff";

    ctx.save();

    if (!foreground) {
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(c.x - radius * 0.28, c.y - radius * 0.3, radius * 0.45, Math.PI * 1.05, Math.PI * 1.55);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius + 6, 0, Math.PI * 2);
      ctx.stroke();

      const t = (game?.elapsed || 0) * 2.4 + index * 2.1;
      for (let i = 0; i < 3; i++) {
        const a = t + i * (Math.PI * 2 / 3);
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(c.x + Math.cos(a) * (radius + 3), c.y + Math.sin(a) * (radius + 3), 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  Player.prototype.draw = function() {
    const activeShields = ELEMENTS.filter(type => (game?.buffs?.[type] || 0) > 0);

    activeShields.forEach((type, index) => drawShieldBubble(this, type, index, false));
    originalPlayerDraw.call(this);
    activeShields.forEach((type, index) => drawShieldBubble(this, type, index, true));
  };
})();
