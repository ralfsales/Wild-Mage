(() => {
  const ENERGY_CAP = 5;
  const CHARGED_COST = 1;

  const chargedRange = element => SKILLS.find(skill => skill.element === element)?.range ?? 100;
  const EXPLOSIVE_RADIUS = chargedRange('grass') * 0.50;
  const EXPLOSIVE_SPEED_MULTIPLIER = 1.50;
  const BASE_PROJECTILE_SPEED = 420;
  const EXPLOSIVE_TRAVEL_DISTANCE = chargedRange('tame');

  const chargedSprites = {
    water: new Image(),
    grass: new Image(),
    fire: new Image(),
  };
  chargedSprites.water.src = 'assets/effects/water-charged-ring.svg';
  chargedSprites.grass.src = 'assets/effects/grass-charged-ring.svg';
  chargedSprites.fire.src = 'assets/effects/fire-charged-ring.svg';

  // Approved pixel-bomb artwork, downscaled to a compact pickup sprite and
  // embedded so GitHub Pages can load it without requiring a binary asset commit.
  const bombUpgradeSprite = new Image();
  bombUpgradeSprite.src = 'data:image/png;base64,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';

  const originalAreaAttackDraw = AreaAttack.prototype.draw;
  AreaAttack.prototype.draw = function() {
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

  // Upgrade drops choose their mode when they spawn so the icon tells the
  // player exactly what will be equipped before they collect it.
  const originalPickupDraw = Pickup.prototype.draw;
  const originalPickupUpdate = Pickup.prototype.update;

  function ensureUpgradeMode(pickup) {
    if (pickup.kind === 'upgrade' && !pickup.plannedUpgradeMode) {
      pickup.plannedUpgradeMode = Math.random() < 0.5 ? 'spread' : 'blast';
    }
  }

  Pickup.prototype.draw = function() {
    ensureUpgradeMode(this);
    if (this.kind !== 'upgrade' || this.plannedUpgradeMode !== 'blast') {
      originalPickupDraw.call(this);
      return;
    }

    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = '#14251f';
    ctx.fillRect(x - 3, y - 3, 24, 24);
    ctx.strokeStyle = '#ff9a3c';
    ctx.strokeRect(x - 3, y - 3, 24, 24);

    if (bombUpgradeSprite.complete && bombUpgradeSprite.naturalWidth) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bombUpgradeSprite, x - 1, y - 1, 20, 20);
      ctx.restore();
    } else {
      // Fallback bomb silhouette while the image is loading.
      ctx.fillStyle = '#242235';
      ctx.beginPath();
      ctx.arc(x + 9, y + 11, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c47f49';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 6);
      ctx.quadraticCurveTo(x + 15, y + 2, x + 17, y + 3);
      ctx.stroke();
      ctx.fillStyle = '#ffd84a';
      ctx.fillRect(x + 16, y + 1, 3, 3);
    }
  };

  Pickup.prototype.update = function(dt) {
    ensureUpgradeMode(this);
    if (this.kind !== 'upgrade') {
      originalPickupUpdate.call(this, dt);
      return;
    }

    if (game.state !== 'playing' || expirePickup(this, dt) || !rectsOverlap(this, game.player)) return;
    this.dead = true;
    game.buffs.upgrade = 1;
    game.upgradeMode = this.plannedUpgradeMode;
    const label = game.upgradeMode === 'blast' ? 'explosive shots equipped' : 'spread shots equipped';
    game.floaters.push(new Floater(this.x - 30, this.y - 14, label, '#ffedb7'));
  };

  const originalSpellUpdate = Spell.prototype.update;
  Spell.prototype.update = function(dt) {
    if (this.explosive && !this.explosiveSpeedBoosted) {
      this.vx *= EXPLOSIVE_SPEED_MULTIPLIER;
      this.vy *= EXPLOSIVE_SPEED_MULTIPLIER;
      this.life = EXPLOSIVE_TRAVEL_DISTANCE / (BASE_PROJECTILE_SPEED * EXPLOSIVE_SPEED_MULTIPLIER);
      this.explosiveSpeedBoosted = true;
    }
    originalSpellUpdate.call(this, dt);
  };

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

      ready.forEach(ally => {
        const pulse = new AreaAttack(center(ally), ally.type, chargedRange(ally.type), 42);
        pulse.charged = true;
        pulse.ace = this.buffs.ace > 0;
        this.areaAttacks.push(pulse);
        this.particles.burst(center(ally), ELEMENT_COLORS[ally.type] || "#cfb2ff", 16);
      });
    } else {
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
