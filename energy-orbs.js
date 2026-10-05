(() => {
  const ENERGY_CAP = 5;
  const CHARGED_COST = 1;

  const originalDrawChargeMeter = drawChargeMeter;

  Game.prototype.castCharged = function() {
    if (this.state !== "playing" || this.player.cooldown > 0) return false;
    const element = SKILLS[this.player.selectedSkill].element;

    if (this.energy < CHARGED_COST) {
      this.floaters.push(new Floater(this.player.x - 30, this.player.y - 20, "Need 1 energy orb", "#bbabed"));
      return false;
    }

    if (element === "tame") {
      const ready = this.allies.filter(
        ally => !ally.dead && !ally.special && this.monsters.some(m => !m.dead && m.canBeHit(ally.type))
      );

      if (!ready.length) {
        this.floaters.push(new Floater(this.player.x - 30, this.player.y - 20, "No allies ready / no targets", "#bbabed"));
        return false;
      }

      ready.forEach(ally => ally.useSpecial());
    } else {
      const pulse = new AreaAttack(center(this.player), element, 170, 42);
      pulse.ace = this.buffs.ace > 0;
      this.areaAttacks.push(pulse);
    }

    this.energy -= CHARGED_COST;
    this.player.cooldown = 0.7;
    this.audio.play(620, 0.15, "triangle");
    return true;
  };

  EnergyOrb.prototype.update = function(dt) {
    if (expirePickup(this, dt)) return;
    this.phase += dt * 4;

    if (game.energy < ENERGY_CAP && rectsOverlap(this, game.player)) {
      game.energy = Math.min(ENERGY_CAP, game.energy + 1);
      this.dead = true;
      game.floaters.push(new Floater(this.x, this.y - 14, "+1 energy", "#c9acff"));
      game.audio.play(760, 0.1, "sine");
    }
  };

  drawChargeMeter = function(currentGame) {
    const energy = Math.max(0, Math.min(ENERGY_CAP, currentGame.energy));

    ctx.fillStyle = '#111421e8';
    ctx.fillRect(12, HEIGHT - 43, 480, 31);

    ctx.fillStyle = '#e2d2ff';
    ctx.font = "12px 'Courier New'";
    ctx.fillText(`ENERGY ${energy}/${ENERGY_CAP}`, 23, HEIGHT - 23);

    for (let i = 0; i < ENERGY_CAP; i++) {
      const x = 111 + i * 43;
      ctx.fillStyle = '#362c49';
      ctx.fillRect(x, HEIGHT - 34, 36, 13);

      if (i < energy) {
        ctx.fillStyle = '#c3a1ff';
        ctx.fillRect(x, HEIGHT - 34, 36, 13);
      }

      ctx.strokeStyle = '#c3a1ff';
      ctx.strokeRect(x, HEIGHT - 34, 36, 13);
    }

    ctx.fillStyle = '#b8a9d4';
    ctx.fillText('1 orb = 1 charged move', 337, HEIGHT - 23);
  };
})();
