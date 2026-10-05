(() => {
  if (typeof Player === 'undefined') return;

  const ACE_DURATION = 20;
  const ACE_ATTACK_MULTIPLIER = 1.20;

  const originalPlayerDraw = Player.prototype.draw;
  const originalPickupUpdate = Pickup.prototype.update;

  // Ace now lasts 20 seconds. This wrapper only replaces Ace pickup handling;
  // all other pickup types keep their existing behavior from the loaded game.
  Pickup.prototype.update = function(dt) {
    if (this.kind !== 'ace') {
      originalPickupUpdate.call(this, dt);
      return;
    }

    if (game.state !== 'playing' || expirePickup(this, dt) || !rectsOverlap(this, game.player)) return;
    this.dead = true;
    game.buffs.ace = ACE_DURATION;
    game.floaters.push(new Floater(this.x - 30, this.y - 14, `Ace · ${ACE_DURATION}s · +20% attack`, '#fff0b0'));
  };

  // Ace keeps its all-element / special-state hit access, but its damage bonus
  // is now a clear +20%. Normal elemental advantages remain at their original 1.6x.
  Monster.prototype.takeDamage = function(amount, element, ace = false) {
    if (this.dead || !this.canBeHit(element, ace)) return;
    if (this.dashState === 'dashing' && element === 'water') this.finishDash(true);

    const multiplier = ace ? ACE_ATTACK_MULTIPLIER : (strongAgainst(element, this.type) ? 1.6 : 1);
    const finalDamage = Math.round(amount * multiplier);
    this.health -= finalDamage;

    game.floaters.push(new Floater(
      this.x,
      this.y - 10,
      multiplier > 1 ? `${finalDamage}!` : `${finalDamage}`,
      multiplier > 1 ? '#fff176' : '#ffffff'
    ));
    game.particles.burst(center(this), ELEMENT_COLORS[element], multiplier > 1 ? 18 : 9);
    if (this.health <= 0) this.defeat();
  };

  function drawAceAura(player, time) {
    const p = center(player);
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);
    const outer = 27 + pulse * 5;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Soft golden halo behind the wizard.
    const glow = ctx.createRadialGradient(p.x, p.y - 4, 4, p.x, p.y - 4, outer);
    glow.addColorStop(0, 'rgba(255,255,230,0.26)');
    glow.addColorStop(0.45, 'rgba(255,224,112,0.20)');
    glow.addColorStop(1, 'rgba(255,191,70,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 4, outer, 0, Math.PI * 2);
    ctx.fill();

    // Thin shimmering rings to make the buff readable during movement.
    ctx.strokeStyle = `rgba(255,238,166,${0.30 + pulse * 0.18})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 3, 20 + pulse * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,197,74,${0.16 + (1 - pulse) * 0.12})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 3, 25 + (1 - pulse) * 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawAceSparkles(player, time) {
    const p = center(player);
    const t = time * 0.001;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Orbiting drizzles / sparkles. Positions are deterministic, so no extra
    // gameplay state is created and pausing does not affect combat logic.
    for (let i = 0; i < 10; i++) {
      const phase = t * (1.25 + (i % 3) * 0.17) + i * 1.93;
      const radius = 18 + (i % 4) * 4;
      const x = p.x + Math.cos(phase) * radius;
      const y = p.y - 5 + Math.sin(phase * 1.17) * (15 + (i % 3) * 3);
      const twinkle = 0.45 + 0.55 * Math.sin(t * 6 + i * 2.2);
      const size = 1.2 + (i % 3) * 0.7;

      ctx.globalAlpha = 0.45 + twinkle * 0.45;
      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#fff1a8' : '#ffd45c';

      ctx.fillRect(Math.round(x - size / 2), Math.round(y - size * 2.2), Math.max(1, Math.round(size)), Math.max(2, Math.round(size * 4.4)));
      ctx.fillRect(Math.round(x - size * 2.2), Math.round(y - size / 2), Math.max(2, Math.round(size * 4.4)), Math.max(1, Math.round(size)));
    }

    // A few short falling streaks make the effect feel like magical drizzle.
    for (let i = 0; i < 6; i++) {
      const cycle = (t * (0.8 + i * 0.05) + i * 0.19) % 1;
      const x = p.x - 24 + i * 9 + Math.sin(t * 2 + i) * 2;
      const y = p.y - 32 + cycle * 55;
      ctx.globalAlpha = 0.15 + (1 - cycle) * 0.45;
      ctx.strokeStyle = i % 2 ? '#fff4b8' : '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x - 1.5, y + 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  Player.prototype.draw = function() {
    const aceActive = !!(game?.buffs?.ace > 0);
    const time = performance.now();

    if (aceActive) drawAceAura(this, time);
    originalPlayerDraw.call(this);
    if (aceActive) drawAceSparkles(this, time);
  };
})();
