(() => {
  const ENERGY_CAP = 5;
  const CHARGED_COST = 1;

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

  // Shield gameplay: 20 seconds of matching-element immunity plus a visible elemental bubble.
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
    const pulse = Math.sin((game?.elapsed || 0) * 6 + index * 1.7) * 1.8;
    const radius = 27 + index * 5 + pulse;
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
      ctx.arc(c.x, c.y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();

      const t = (game?.elapsed || 0) * 2.4 + index * 2.1;
      for (let i = 0; i < 3; i++) {
        const a = t + i * (Math.PI * 2 / 3);
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(c.x + Math.cos(a) * (radius + 2), c.y + Math.sin(a) * (radius + 2), 1.8, 0, Math.PI * 2);
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

  // On the start screen, customizing the wizard is part of starting a new game.
  // Capture the click before the generic editor listener in wizard-player.js.
  const customizeStart = document.getElementById('customizeStart');
  customizeStart?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (window.openMageCreator) window.openMageCreator(true);
    else game.start();
  }, true);
})();
