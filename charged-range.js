(() => {
  const CHARGED_COST = 1;
  const CHARGED_RANGE_MULTIPLIER = 1.5;
  const chargedRange = element => (SKILLS.find(skill => skill.element === element)?.range ?? 100) * CHARGED_RANGE_MULTIPLIER;

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
})();
