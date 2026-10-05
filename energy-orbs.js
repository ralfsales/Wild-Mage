(() => {
  const ENERGY_CAP = 5;
  const CHARGED_COST = 1;

  const chargedRange = element => SKILLS.find(skill => skill.element === element)?.range ?? 100;

  const waterChargedSprite = new Image();
  waterChargedSprite.src = 'assets/effects/water-charged-ring.svg';

  const originalAreaAttackDraw = AreaAttack.prototype.draw;
  AreaAttack.prototype.draw = function() {
    if (this.charged && this.element === 'water' && waterChargedSprite.complete && waterChargedSprite.naturalWidth) {
      const progress = Math.max(0, Math.min(1, this.age / this.life));
      const radius = Math.max(8, this.maxRadius * progress);
      const diameter = radius * 2;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.age * 0.9);
      ctx.globalAlpha = 0.96 - progress * 0.18;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(waterChargedSprite, -diameter / 2, -diameter / 2, diameter, diameter);
      ctx.restore();
      return;
    }

    originalAreaAttackDraw.call(this);
  };

  Game.prototype.castCharged = function() {
    if (this.state !== "playing" || this.player.cooldown > 0) return false;
    const element = SKILLS[this.player.selectedSkill].element;

    if (this.energy < CHARGED_COST) {
      this.floaters.push(new Floater(this.player.x - 30, this.player.y - 20, "Need 1 energy orb", "#bbabed"));
      return false;
    }

    if (element === "tame") {
      const ready = this.allies.filter(ally => !ally.dead);

      if (!ready.length) {
        this.floaters.push(new Floater(this.player.x - 30, this.player.y - 20, "No tamed allies ready", "#bbabed"));
        return false;
      }

      // Every living tamed ally casts the charged version of its own element.
      // Its charged AoE reaches the same distance as that element's normal shot,
      // but expands in every direction from the ally instead of travelling linearly.
      ready.forEach(ally => {
        const pulse = new AreaAttack(center(ally), ally.type, chargedRange(ally.type), 42);
        pulse.charged = true;
        pulse.ace = this.buffs.ace > 0;
        this.areaAttacks.push(pulse);
        this.particles.burst(center(ally), ELEMENT_COLORS[ally.type] || "#cfb2ff", 16);
      });
    } else {
      // Charged elemental attacks use the same maximum reach as their normal shot,
      // but cover a full circle around the caster.
      const pulse = new AreaAttack(center(this.player), element, chargedRange(element), 42);
      pulse.charged = true;
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
