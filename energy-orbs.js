(() => {
  const ENERGY_CAP = 5;
  const CHARGED_COST = 1;

  const chargedRange = element => SKILLS.find(skill => skill.element === element)?.range ?? 100;
  const EXPLOSIVE_RADIUS = chargedRange('grass') * 0.50;

  const chargedSprites = {
    water: new Image(),
    grass: new Image(),
    fire: new Image(),
  };
  chargedSprites.water.src = 'assets/effects/water-charged-ring.svg';
  chargedSprites.grass.src = 'assets/effects/grass-charged-ring.svg';
  chargedSprites.fire.src = 'assets/effects/fire-charged-ring.svg';

  const originalAreaAttackDraw = AreaAttack.prototype.draw;
  AreaAttack.prototype.draw = function() {
    // Charged attacks and upgraded explosive shots share the same elemental
    // visual language. Explosions are smaller versions of the charged effects.
    const usesElementSprite = this.charged || this.explosiveUpgrade;
    const sprite = usesElementSprite ? chargedSprites[this.element] : null;

    if (sprite?.complete && sprite.naturalWidth) {
      const progress = Math.max(0, Math.min(1, this.age / this.life));
      const minimumRadius = this.explosiveUpgrade ? 3 : 8;
      const radius = Math.max(minimumRadius, this.maxRadius * progress);
      const diameter = radius * 2;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.age * (this.element === 'grass' ? -0.45 : this.element === 'fire' ? 0.55 : 0.9));
      ctx.globalAlpha = 0.98 - progress * 0.16;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sprite, -diameter / 2, -diameter / 2, diameter, diameter);
      ctx.restore();
      return;
    }

    originalAreaAttackDraw.call(this);
  };

  // The explosive-shot upgrade reuses the same sprite for each element, but
  // its blast radius is exactly 50% of the grass charged attack's radius
  // (grass range 150 => explosion radius 75).
  Spell.prototype.explode = function() {
    const blast = new AreaAttack(
      { x: this.x, y: this.y },
      this.skill.element,
      EXPLOSIVE_RADIUS,
      this.skill.damage
    );
    blast.explosiveUpgrade = true;
    blast.ace = this.ace;
    game.areaAttacks.push(blast);
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
      // The attack expands 360 degrees from the ally and reaches exactly the
      // same distance as that element's normal linear shot.
      ready.forEach(ally => {
        const pulse = new AreaAttack(center(ally), ally.type, chargedRange(ally.type), 42);
        pulse.charged = true;
        pulse.ace = this.buffs.ace > 0;
        this.areaAttacks.push(pulse);
        this.particles.burst(center(ally), ELEMENT_COLORS[ally.type] || "#cfb2ff", 16);
      });
    } else {
      // Wizard charged attacks use the same reach as the corresponding normal
      // shot, but expand around the wizard instead of travelling in one line.
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
