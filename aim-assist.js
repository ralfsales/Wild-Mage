(() => {
  const ASSIST_CONE_DEGREES = 70;
  const ASSIST_DOT_MIN = Math.cos((ASSIST_CONE_DEGREES * Math.PI) / 180);
  const ASSIST_MAX_DISTANCE = 320;
  const AIM_SMOOTHING = 9;
  const POINTER_DISTANCE = 23;

  const normalize = (v, fallback = { x: 1, y: 0 }) => {
    const length = Math.hypot(v?.x || 0, v?.y || 0);
    return length > 0.0001 ? { x: v.x / length, y: v.y / length } : { ...fallback };
  };

  function currentSkill(player) {
    return SKILLS[player.selectedSkill] || SKILLS[0];
  }

  function targetableMonster(monster, skill) {
    if (!monster || monster.dead) return false;
    if (skill.element === 'tame') return monster.canBeHit('tame');
    return monster.canBeHit(skill.element, game.buffs.ace > 0);
  }

  function assistedDirection(player) {
    const origin = center(player);
    const forward = normalize(player.facing, player.aimDirection || { x: 1, y: 0 });
    const skill = currentSkill(player);
    let best = null;

    for (const monster of game.monsters) {
      if (!targetableMonster(monster, skill)) continue;
      const target = center(monster);
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      const distance = Math.hypot(dx, dy);
      if (!distance || distance > ASSIST_MAX_DISTANCE) continue;

      const dir = { x: dx / distance, y: dy / distance };
      const dot = forward.x * dir.x + forward.y * dir.y;
      if (dot < ASSIST_DOT_MIN) continue;

      // Prefer the nearest foe, with a small alignment bonus so a foe almost
      // directly ahead wins over a similarly close foe at the edge of the cone.
      const alignmentPenalty = 1 + (1 - dot) * 0.7;
      const score = distance * alignmentPenalty;
      if (!best || score < best.score) best = { dir, score };
    }

    return best?.dir || forward;
  }

  const originalPlayerUpdate = Player.prototype.update;
  Player.prototype.update = function(dt) {
    originalPlayerUpdate.call(this, dt);

    if (!this.aimDirection) this.aimDirection = normalize(this.facing);
    const desired = assistedDirection(this);
    const blend = Math.min(1, AIM_SMOOTHING * dt);
    this.aimDirection = normalize({
      x: this.aimDirection.x + (desired.x - this.aimDirection.x) * blend,
      y: this.aimDirection.y + (desired.y - this.aimDirection.y) * blend,
    }, this.facing);
  };

  // Use the softly assisted direction for keyboard/key-release casts. Explicit
  // mouse clicks keep their exact clicked target and are not auto-corrected.
  const originalCast = Game.prototype.cast;
  Game.prototype.cast = function(targetX, targetY) {
    if (targetX === undefined && targetY === undefined) {
      const origin = center(this.player);
      const aim = normalize(this.player.aimDirection || this.player.facing);
      return originalCast.call(this, origin.x + aim.x * 200, origin.y + aim.y * 200);
    }
    return originalCast.call(this, targetX, targetY);
  };

  const originalPlayerDraw = Player.prototype.draw;
  Player.prototype.draw = function() {
    const movementFacing = this.facing;
    const aim = normalize(this.aimDirection || movementFacing);

    // The original custom-avatar renderer includes a tiny round pointer based on
    // facing. Temporarily point it along the assisted aim, then cover it with the
    // new diamond so there is only one apparent aiming direction.
    this.facing = aim;
    originalPlayerDraw.call(this);
    this.facing = movementFacing;

    if (game.state !== 'playing' && game.state !== 'paused') return;

    const p = center(this);
    const skill = currentSkill(this);
    const color = ELEMENT_COLORS[skill.element] || '#ffffff';
    const pulse = 1 + Math.sin(performance.now() / 120) * 0.12;
    const px = p.x + aim.x * POINTER_DISTANCE;
    const py = p.y + aim.y * POINTER_DISTANCE;
    const size = 5.5 * pulse;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = color;
    ctx.shadowBlur = 11;
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = color;
    ctx.fillRect(-size, -size, size * 2, size * 2);

    ctx.shadowBlur = 3;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#fff7df';
    ctx.fillRect(-size * 0.34, -size * 0.34, size * 0.68, size * 0.68);
    ctx.restore();
  };
})();
