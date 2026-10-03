const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const muteButton = document.getElementById("muteButton");
const pauseButton = document.getElementById("pauseButton");
const pauseScreen = document.getElementById("pauseScreen");
const resumeButton = document.getElementById("resumeButton");
const spellButtons = [...document.querySelectorAll("[data-skill]")];

function selectSkill(index) {
  game.player.selectedSkill = index;
  spellButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
}

function setPaused(paused) {

  if (game.state !== "playing" && game.state !== "paused") return;
  game.state = paused ? "paused" : "playing";
  clearInput();
  pauseScreen.classList.toggle("hidden", !paused);
  pauseButton.innerHTML = paused ? "Resume <kbd>Esc</kbd>" : "Pause <kbd>Esc</kbd>";
  (paused ? resumeButton : canvas).focus({ preventScroll: true });
}

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TILE = 32;
const ELEMENTS = ["fire", "water", "grass"];
const ELEMENT_COLORS = {
  fire: "#ff6b35",
  water: "#42c9ff",
  grass: "#77d353",
  tame: "#f2dc6d",
};
const SKILLS = [
  { key: "f", name: "Fire", element: "fire", damage: 26, cooldown: 390, range: 130 },
  { key: "d", name: "Water", element: "water", damage: 26, cooldown: 390, range: 100 },
  { key: "s", name: "Grass", element: "grass", damage: 26, cooldown: 390, range: 150 },
  { key: "a", name: "Tame", element: "tame", damage: 0, cooldown: 850, range: 80 },
];

const ENERGY_PER_CHARGE = 3;
const MAX_CHARGES = 3;
const ENERGY_DROP_CHANCE = 0.2;
const keys = new Set();
const attackHolds = new Map();
const CHARGE_HOLD_SECONDS = 0.5;
let game;
let lastTime = 0;
let soundMuted = true;

const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const center = (entity) => ({ x: entity.x + entity.w / 2, y: entity.y + entity.h / 2 });

function strongAgainst(attacker, defender) {
  return (
    (attacker === "water" && defender === "fire") ||
    (attacker === "fire" && defender === "grass") ||
    (attacker === "grass" && defender === "water")
  );
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

class AudioBlips {
  constructor() {
    this.ctx = null;
  }

  play(freq, duration = 0.06, type = "square") {
    if (soundMuted) return;
    this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 24;
    this.h = 28;
    this.speed = 154;
    this.maxHealth = 120;
    this.health = this.maxHealth;
    this.coins = 0;
    this.selectedSkill = 0;
    this.cooldown = 0;
    this.invulnerable = 0;
    this.facing = { x: 1, y: 0 };
  }

  update(dt) {
    let dx = 0;
    let dy = 0;
    if (keys.has("arrowup")) dy -= 1;
    if (keys.has("arrowdown")) dy += 1;
    if (keys.has("arrowleft")) dx -= 1;
    if (keys.has("arrowright")) dx += 1;
    if (dx || dy) {
      this.walkTime = (this.walkTime || 0) + dt * 10;
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      this.facing = { x: dx, y: dy };
      this.x = clamp(this.x + dx * this.speed * dt, 8, WIDTH - this.w - 8);
      this.y = clamp(this.y + dy * this.speed * dt, 48, HEIGHT - this.h - 8);
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  takeDamage(amount) {
    if (this.invulnerable > 0 || game.state !== "playing") return;
    this.health = Math.max(0, this.health - amount);
    this.invulnerable = 0.55;
    game.floaters.push(new Floater(this.x, this.y - 8, `-${amount}`, "#ff7373"));
    game.particles.burst(center(this), "#ff7373", 10);
    game.audio.play(96, 0.08, "sawtooth");
    if (this.health <= 0) game.end();
  }

  draw() {
    const blink = this.invulnerable > 0 && Math.floor(performance.now() / 90) % 2 === 0;
    if (blink) return;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    drawMage(x, y, this.facing, this.walkTime || 0, ELEMENT_COLORS[SKILLS[this.selectedSkill].element]);
  }
}

class Monster {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 23;
    this.type = type;
    this.maxHealth = 80;
    this.health = this.maxHealth;
    this.speed = rand(18, 30);
    this.damage = type === "fire" ? 15 : 5;
    this.attackCooldown = rand(0.1, 0.8);
    this.dead = false;
    this.spawnGlow = 0.5;
    this.animationTime = rand(0, 6);
    this.burrowState = "surface";
    this.burrowTimer = rand(3, 5);
    this.trail = [];
    this.dashState = "ready";
    this.dashTimer = rand(2.5, 4.5);
    this.dashDirection = { x: 1, y: 0 };
    this.dashHits = new Set();
  }

  get underground() {
    return this.burrowState === "underground" || this.burrowState === "warning";
  }

  canBeHit(element) {
    if (this.underground) return element === "grass";
    return this.dashState !== "dashing" || element === "water";
  }

  finishDash(quenched = false) {
    this.dashState = "recovery";
    this.dashTimer = quenched ? 1.4 : 0.9;
    this.attackCooldown = this.dashTimer;
    if (quenched) {
      game.particles.burst(center(this), "#b7edff", 22);
      game.floaters.push(new Floater(this.x - 15, this.y - 16, "Quenched!", "#b7edff"));
    }
  }

  updateDash(dt, target) {
    if (this.dashState === "ready") {
      this.dashTimer -= dt;
      if (this.dashTimer > 0) return false;
      const from = center(this), to = center(target);
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      this.dashDirection = length > 0 ? { x: (to.x - from.x) / length, y: (to.y - from.y) / length } : { x: 1, y: 0 };
      this.dashState = "windup";
      this.dashTimer = 0.7;
      return true;
    }
    if (this.dashState === "windup") {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.dashState = "dashing";
        this.dashTimer = 0.65;
        this.dashHits.clear();
        game.particles.burst(center(this), "#f9d76e", 16);
      }
      return true;
    }
    if (this.dashState === "dashing") {
      // Short collision steps prevent the fast bird from skipping over a target.
      const travel = Math.min(dt, this.dashTimer) * 420;
      const steps = Math.max(1, Math.ceil(travel / 6));
      for (let i = 0; i < steps; i++) {
        const nextX = this.x + this.dashDirection.x * travel / steps;
        const nextY = this.y + this.dashDirection.y * travel / steps;
        this.x = clamp(nextX, 8, WIDTH - this.w - 8);
        this.y = clamp(nextY, 58, HEIGHT - this.h - 8);
        for (const victim of [game.player, ...game.allies]) {
          if (!victim.dead && !this.dashHits.has(victim) && rectsOverlap(this, victim)) {
            this.dashHits.add(victim);
            victim.takeDamage(20, "fire");
          }
        }
        if (nextX !== this.x || nextY !== this.y) { this.finishDash(); break; }
      }
      if (this.dashState === "dashing") {
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) this.finishDash();
      }
      return true;
    }
    this.dashTimer -= dt;
    if (this.dashTimer <= 0) {
      this.dashState = "ready";
      this.dashTimer = rand(3, 5);
    }
    return true;
  }

  updateBurrow(dt, target) {
    this.burrowTimer -= dt;
    if (this.burrowState === "surface") {
      if (this.burrowTimer <= 0) {
        this.burrowState = "digging";
        this.burrowTimer = 0.55;
        game.particles.burst(center(this), "#aa8250", 10);
      }
      return false;
    }
    if (this.burrowState === "digging") {
      if (this.burrowTimer <= 0) {
        this.burrowState = "underground";
        this.burrowTimer = 3;
        this.trail = [];
      }
      return true;
    }
    if (this.burrowState === "underground") {
      const from = center(this), to = center(target);
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      if (distance < 22 || this.burrowTimer <= 0) {
        this.burrowState = "warning";
        this.burrowTimer = 0.75;
      } else {
        const step = Math.min(distance, 100 * dt);
        this.x = clamp(this.x + (to.x - from.x) / distance * step, 8, WIDTH - this.w - 8);
        this.y = clamp(this.y + (to.y - from.y) / distance * step, 58, HEIGHT - this.h - 8);
        const last = this.trail[this.trail.length - 1];
        if (!last || Math.hypot(this.x - last.x, this.y - last.y) >= 7) {
          this.trail.push({ x: this.x, y: this.y, life: 0.65 });
        }
      }
      return true;
    }
    if (this.burrowState === "warning") {
      if (this.burrowTimer <= 0) {
        this.burrowState = "recovery";
        this.burrowTimer = 1.1;
        this.attackCooldown = 1.1;
        game.particles.burst(center(this), "#aa8250", 24);
        game.particles.burst(center(this), "#a9ce65", 16);
        game.floaters.push(new Floater(this.x - 12, this.y - 18, "Ambush!", "#e4c77d"));
        for (const victim of [game.player, ...game.allies]) {
          if (!victim.dead && dist(center(this), center(victim)) < 44) victim.takeDamage(14, "grass");
        }
      }
      return true;
    }
    if (this.burrowTimer <= 0) {
      this.burrowState = "surface";
      this.burrowTimer = rand(4, 6);
    }
    return true;
  }

  update(dt) {
    if (this.dead) return;
    this.animationTime += dt * 7;
    this.trail.forEach(point => point.life -= dt);
    this.trail = this.trail.filter(point => point.life > 0);
    this.spawnGlow = Math.max(0, this.spawnGlow - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const playerCenter = center(game.player);
    let target = game.player;
    let targetCenter = playerCenter;

    for (const ally of game.allies) {
      if (dist(this, ally) < dist(this, target)) {
        target = ally;
        targetCenter = center(ally);
      }
    }

    if (this.type === "grass" && this.updateBurrow(dt, target)) return;
    if (this.type === "fire" && this.updateDash(dt, target)) return;

    const selfCenter = center(this);
    const d = Math.hypot(targetCenter.x - selfCenter.x, targetCenter.y - selfCenter.y);
    if (d > 4) {
      this.x += ((targetCenter.x - selfCenter.x) / d) * this.speed * dt;
      this.y += ((targetCenter.y - selfCenter.y) / d) * this.speed * dt;
    }

    if (rectsOverlap(this, target) && this.attackCooldown <= 0) {
      target.takeDamage(this.damage, this.type);
      this.attackCooldown = 1.0;
    }
  }

  takeDamage(amount, element) {
    if (this.dead || !this.canBeHit(element)) return;
    if (this.dashState === "dashing" && element === "water") this.finishDash(true);
    const multiplier = strongAgainst(element, this.type) ? 1.6 : 1;
    const finalDamage = Math.round(amount * multiplier);
    this.health -= finalDamage;
    game.floaters.push(new Floater(this.x, this.y - 10, multiplier > 1 ? `${finalDamage}!` : `${finalDamage}`, multiplier > 1 ? "#fff176" : "#ffffff"));
    game.particles.burst(center(this), ELEMENT_COLORS[element], multiplier > 1 ? 18 : 9);
    if (this.health <= 0) this.defeat();
  }

  defeat() {
    if (this.dead) return;
    this.dead = true;
    const count = Math.floor(rand(2, 5));
    for (let i = 0; i < count; i++) {
      game.coins.push(new Coin(this.x + rand(-10, 22), this.y + rand(-10, 22), 1));
    }
    if (Math.random() < ENERGY_DROP_CHANCE) game.energyDrops.push(new EnergyOrb(this.x, this.y));
    if (Math.random() < 0.16) game.treasures.push(new Treasure(this.x, this.y));
    game.audio.play(180, 0.08);
  }

  draw() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    if (this.dashState === "dashing") {
      drawFireDash(this);
      return;
    }
    if (this.dashState === "windup") drawDashWarning(this);
    if (this.underground) {
      drawBurrow(this);
      return;
    }
    drawCreature(x, y, this.type, this.animationTime, this.burrowState === "digging");
    drawHealthBar(this, "#ff5252");
    if (this.spawnGlow > 0) {
      ctx.strokeStyle = "#f6e58d";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 3, y - 3, this.w + 6, this.h + 6);
    }
  }
}

class Ally extends Monster {
  constructor(monster) {
    super(monster.x, monster.y, monster.type);
    this.maxHealth = monster.maxHealth;
    this.health = Math.max(28, monster.health);
    this.speed = 88;
    this.attackCooldown = 0;
    this.special = null;
  }

  useSpecial() {
    const target = game.monsters.filter(m => !m.dead && m.canBeHit(this.type)).sort((a,b) => dist(this,a)-dist(this,b))[0];
    if (!target || this.dead || this.special) return false;
    if (this.type === "water") {
      game.areaAttacks.push(new AreaAttack(center(this), "water", 160, 36));
      this.special = { kind: "rest", time: 0.7 };
    } else {
      const from = center(this), to = center(target), d = Math.hypot(to.x-from.x,to.y-from.y) || 1;
      this.special = { kind: this.type, time: this.type === "fire" ? 0.65 : 0.9, direction: {x:(to.x-from.x)/d,y:(to.y-from.y)/d}, target, hits: new Set() };
      if (this.type === "fire") { this.dashState = "dashing"; this.dashDirection = this.special.direction; }
      else { this.burrowState = "underground"; this.trail = []; }
    }
    return true;
  }

  updateSpecial(dt) {
    const s = this.special;
    const duration = Math.min(dt, s.time);
    s.time -= dt;
    if (s.kind === "fire") {
      const steps = Math.max(1, Math.ceil(420 * duration / 6));
      for (let i=0;i<steps;i++) {
        this.x = clamp(this.x+s.direction.x*420*duration/steps,8,WIDTH-this.w-8);
        this.y = clamp(this.y+s.direction.y*420*duration/steps,58,HEIGHT-this.h-8);
        for (const m of game.monsters) if (!m.dead && !s.hits.has(m) && m.canBeHit("fire") && rectsOverlap(this,m)) { s.hits.add(m); m.takeDamage(36,"fire"); }
      }
    } else if (s.kind === "grass") {
      if (!s.target.dead) {
        const from=center(this),to=center(s.target),d=dist(from,to);
        const step=Math.min(d,210*duration);
        if(d>0){this.x=clamp(this.x+(to.x-from.x)/d*step,8,WIDTH-this.w-8);this.y=clamp(this.y+(to.y-from.y)/d*step,58,HEIGHT-this.h-8);}
      }
      this.trail.forEach(p=>p.life-=dt);this.trail=this.trail.filter(p=>p.life>0);
      this.trail.push({x:this.x,y:this.y,life:0.3});
      if(s.time<=0) game.areaAttacks.push(new AreaAttack(center(this),"grass",110,36));
    }
    if(s.time<=0){this.special=null;this.dashState="ready";this.burrowState="surface";this.attackCooldown=0.6;}
  }

  update(dt) {
    if (this.dead) return;
    if (this.special) { this.animationTime += dt * 7; this.updateSpecial(dt); return; }
    this.animationTime += dt * 7;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const target = game.monsters
      .filter((monster) => !monster.dead && monster.canBeHit(this.type))
      .sort((a, b) => dist(this, a) - dist(this, b))[0];

    let destination = center(game.player);
    if (target && dist(this, target) < 210) destination = center(target);
    else {
      destination.x += rand(-35, 35);
      destination.y += rand(-35, 35);
    }

    const selfCenter = center(this);
    const d = Math.hypot(destination.x - selfCenter.x, destination.y - selfCenter.y);
    if (d > 38) {
      this.x += ((destination.x - selfCenter.x) / d) * this.speed * dt;
      this.y += ((destination.y - selfCenter.y) / d) * this.speed * dt;
    }

    if (target && rectsOverlap(this, target) && this.attackCooldown <= 0) {
      target.takeDamage(12, this.type);
      this.attackCooldown = 0.85;
    }
  }

  takeDamage(amount, attackerType) {
    if (strongAgainst(this.type, attackerType)) {
      game.floaters.push(new Floater(this.x - 8, this.y - 8, "Immune", "#b7edff"));
      return;
    }
    this.health = Math.max(0, this.health - Math.round(amount * 0.5));
    if (this.health <= 0) this.dead = true;
  }

  draw() {
    super.draw();
    ctx.strokeStyle = "#f2dc6d";
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(this.x) - 2, Math.round(this.y) - 2, this.w + 4, this.h + 4);
  }
}

class Spell {
  constructor(x, y, vx, vy, skill) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.skill = skill;
    this.r = skill.element === "tame" ? 9 : 6;
    this.life = skill.range / 420;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 || this.x < 0 || this.x > WIDTH || this.y < 0 || this.y > HEIGHT) this.dead = true;

    for (const monster of game.monsters) {
      if (monster.dead || !monster.canBeHit(this.skill.element) || Math.hypot(this.x - center(monster).x, this.y - center(monster).y) > this.r + 14) continue;
      if (this.skill.element === "tame") game.tryTame(monster);
      else monster.takeDamage(this.skill.damage, this.skill.element);
      this.dead = true;
      break;
    }
  }

  draw() {
    ctx.fillStyle = ELEMENT_COLORS[this.skill.element];
    ctx.fillRect(Math.round(this.x - this.r), Math.round(this.y - this.r), this.r * 2, this.r * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(Math.round(this.x - 2), Math.round(this.y - 2), 4, 4);
  }
}

class Coin {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.w = 12;
    this.h = 12;
    this.value = value;
    this.spin = rand(0, Math.PI * 2);
  }

  update(dt) {
    this.spin += dt * 8;
    if (rectsOverlap(this, game.player)) {
      game.player.coins += this.value;
      this.dead = true;
      game.floaters.push(new Floater(this.x, this.y - 8, `+${this.value}`, "#ffd45c"));
      game.audio.play(620, 0.04);
    }
  }

  draw() {
    const w = Math.max(4, Math.abs(Math.cos(this.spin)) * 10);
    ctx.fillStyle = "#8a5a17";
    ctx.fillRect(Math.round(this.x + 6 - w / 2), Math.round(this.y + 1), Math.round(w), 10);
    ctx.fillStyle = "#ffd45c";
    ctx.fillRect(Math.round(this.x + 6 - w / 2), Math.round(this.y), Math.round(w), 9);
  }
}

class Treasure {
  constructor(x, y) {
    this.x = clamp(x, 20, WIDTH - 38);
    this.y = clamp(y, 62, HEIGHT - 34);
    this.w = 24;
    this.h = 18;
    this.opened = false;
  }

  update() {
    if (!this.opened && rectsOverlap(this, game.player)) {
      this.opened = true;
      const value = Math.floor(rand(6, 13));
      game.player.coins += value;
      game.floaters.push(new Floater(this.x, this.y - 10, `+${value}`, "#ffd45c"));
      game.particles.burst(center(this), "#ffd45c", 18);
      game.audio.play(740, 0.09, "triangle");
    }
  }

  draw() {
    ctx.fillStyle = this.opened ? "#5a3520" : "#8f5427";
    ctx.fillRect(Math.round(this.x), Math.round(this.y + 5), this.w, 13);
    ctx.fillStyle = this.opened ? "#3b2518" : "#b47534";
    ctx.fillRect(Math.round(this.x + 2), Math.round(this.y), this.w - 4, 8);
    ctx.fillStyle = "#ffd45c";
    ctx.fillRect(Math.round(this.x + 10), Math.round(this.y + 7), 5, 5);
  }
}

class TameSlotItem {
  constructor(x, y) {
    this.x = clamp(x, 24, WIDTH - 40);
    this.y = clamp(y, 66, HEIGHT - 40);
    this.w = 22;
    this.h = 22;
    this.pulse = rand(0, Math.PI * 2);
  }

  update(dt) {
    this.pulse += dt * 5;
    if (rectsOverlap(this, game.player)) {
      game.tameSlots = Math.min(game.maxTameSlots, game.tameSlots + 1);
      this.dead = true;
      game.floaters.push(new Floater(this.x - 14, this.y - 8, "Slot +1", "#f2dc6d"));
      game.particles.burst(center(this), "#f2dc6d", 26);
      game.audio.play(900, 0.1, "triangle");
    }
  }

  draw() {
    const bob = Math.sin(this.pulse) * 3;
    const x = Math.round(this.x);
    const y = Math.round(this.y + bob);
    ctx.fillStyle = "#7f5cff";
    ctx.fillRect(x + 7, y + 2, 8, 18);
    ctx.fillRect(x + 2, y + 7, 18, 8);
    ctx.fillStyle = "#f2dc6d";
    ctx.fillRect(x + 9, y + 4, 4, 14);
    ctx.fillRect(x + 4, y + 9, 14, 4);
  }
}

class Floater {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 0.85;
  }

  update(dt) {
    this.y -= 30 * dt;
    this.life -= dt;
  }

  draw() {
    ctx.globalAlpha = clamp(this.life, 0, 1);
    ctx.fillStyle = this.color;
    ctx.font = "16px 'Courier New'";
    ctx.fillText(this.text, Math.round(this.x), Math.round(this.y));
    ctx.globalAlpha = 1;
  }
}

class ParticleSystem {
  constructor() {
    this.items = [];
  }

  burst(origin, color, count) {
    for (let i = 0; i < count; i++) {
      this.items.push({
        x: origin.x,
        y: origin.y,
        vx: rand(-80, 80),
        vy: rand(-80, 80),
        life: rand(0.22, 0.55),
        color,
      });
    }
  }

  update(dt) {
    for (const p of this.items) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.items = this.items.filter((p) => p.life > 0);
  }

  draw() {
    for (const p of this.items) {
      ctx.globalAlpha = clamp(p.life * 2, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}

class Game {
  constructor() {
    this.audio = new AudioBlips();
    this.reset();
  }

  reset() {
    this.state = "start";
    this.player = new Player(WIDTH / 2, HEIGHT / 2);
    this.monsters = [];
    this.allies = [];
    this.spells = [];
    this.coins = [];
    this.energy = 0;
    this.energyDrops = [];
    this.areaAttacks = [];
    this.treasures = [];
    this.tameSlotItems = [];
    this.floaters = [];
    this.particles = new ParticleSystem();
    this.spawnTimer = 0.9;
    this.slotSpawnTimer = 8;
    this.tameSlots = 1;
    this.maxTameSlots = 5;
    this.bushes = [
      { x: 78, y: 92 }, { x: 440, y: 78 }, { x: 820, y: 112 },
      { x: 92, y: 488 }, { x: 504, y: 540 }, { x: 835, y: 468 },
      { x: 710, y: 282 }, { x: 220, y: 304 },
    ];
    this.decor = this.makeDecor();
    this.treasures.push(new Treasure(735, 95), new Treasure(158, 532));
  }

  start() {
    this.reset();
    this.state = "playing";
    clearInput();
    selectSkill(0);
    pauseScreen.classList.add("hidden");
    pauseButton.disabled = false;
    pauseButton.innerHTML = "Pause <kbd>Esc</kbd>";
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    for (let i = 0; i < 5; i++) this.spawnMonster();
    canvas.focus({ preventScroll: true });
  }

  end() {
    this.state = "gameover";
    clearInput();
    pauseButton.disabled = true;
    finalScore.textContent = `Final coins: ${this.player.coins}`;
    gameOverScreen.classList.remove("hidden");
    restartButton.focus({ preventScroll: true });
  }

  makeDecor() {
    const rocks = Array.from({ length: 20 }, () => ({ x: rand(20, WIDTH - 30), y: rand(62, HEIGHT - 25), kind: "rock" }));
    const flowers = Array.from({ length: 34 }, () => ({ x: rand(15, WIDTH - 15), y: rand(58, HEIGHT - 14), kind: "flower" }));
    return [...rocks, ...flowers];
  }

  spawnMonster() {
    if (this.monsters.length > 16) return;
    const bush = this.bushes[Math.floor(Math.random() * this.bushes.length)];
    const type = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    this.monsters.push(new Monster(bush.x + rand(-8, 24), bush.y + rand(-8, 24), type));
    this.particles.burst({ x: bush.x + 16, y: bush.y + 16 }, "#77d353", 14);
  }

  spawnTameSlotItem() {
    if (this.tameSlots >= this.maxTameSlots || this.tameSlotItems.length > 0) return;
    this.tameSlotItems.push(new TameSlotItem(rand(55, WIDTH - 70), rand(85, HEIGHT - 70)));
  }

  cast(targetX, targetY) {
    if (this.player.cooldown > 0 || this.state !== "playing") return;
    const skill = SKILLS[this.player.selectedSkill];
    const origin = center(this.player);
    const aimX = targetX ?? origin.x + this.player.facing.x * 100;
    const aimY = targetY ?? origin.y + this.player.facing.y * 100;
    const angle = Math.atan2(aimY - origin.y, aimX - origin.x);
    this.spells.push(new Spell(origin.x, origin.y, Math.cos(angle) * 420, Math.sin(angle) * 420, skill));
    this.player.cooldown = skill.cooldown / 1000;
    this.audio.play(skill.element === "tame" ? 500 : 300, 0.06);
  }

  castCharged() {
    if (this.state !== "playing" || this.player.cooldown > 0) return false;
    const element = SKILLS[this.player.selectedSkill].element;
    if (this.energy < ENERGY_PER_CHARGE) {
      this.floaters.push(new Floater(this.player.x - 30, this.player.y - 20, "Need a full charge", "#bbabed"));
      return false;
    }
    if (element === "tame") {
      const ready = this.allies.filter(ally => !ally.dead && !ally.special && this.monsters.some(m => !m.dead && m.canBeHit(ally.type)));
      if (!ready.length) {
        this.floaters.push(new Floater(this.player.x - 30, this.player.y - 20, "No allies ready / no targets", "#bbabed"));
        return false;
      }
      ready.forEach(ally => ally.useSpecial());
    } else {
      this.areaAttacks.push(new AreaAttack(center(this.player), element, 170, 42));
    }
    this.energy -= ENERGY_PER_CHARGE;
    this.player.cooldown = 0.7;
    this.audio.play(620, 0.15, "triangle");
    return true;
  }

  tryTame(monster) {
    if (monster.dead || !monster.canBeHit("tame")) return;
    if (this.allies.length >= this.tameSlots) {
      this.floaters.push(new Floater(monster.x - 8, monster.y - 8, "No slot", "#f8f0ce"));
      return;
    }
    if (Math.random() < 0.75) {
      monster.dead = true;
      this.allies.push(new Ally(monster));
      this.floaters.push(new Floater(monster.x - 8, monster.y - 8, "Tamed!", "#f2dc6d"));
      this.particles.burst(center(monster), "#f2dc6d", 28);
      this.audio.play(820, 0.1, "triangle");
    } else {
      this.floaters.push(new Floater(monster.x - 8, monster.y - 8, "Failed", "#ff7373"));
      this.particles.burst(center(monster), "#ff7373", 10);
    }
  }

  update(dt) {
    if (this.state !== "playing") return;
    this.player.update(dt);
    updateAttackHolds(dt);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnMonster();
      this.spawnTimer = rand(2.2, 4.4);
    }
    this.slotSpawnTimer -= dt;
    if (this.slotSpawnTimer <= 0) {
      this.spawnTameSlotItem();
      this.slotSpawnTimer = rand(13, 20);
    }

    for (const group of [this.monsters, this.allies, this.spells, this.coins, this.treasures, this.tameSlotItems, this.energyDrops, this.areaAttacks, this.floaters]) {
      for (const item of group) item.update(dt);
    }
    this.particles.update(dt);

    this.monsters = this.monsters.filter((monster) => !monster.dead);
    this.allies = this.allies.filter((ally) => !ally.dead);
    this.spells = this.spells.filter((spell) => !spell.dead);
    this.energyDrops = this.energyDrops.filter(item => !item.dead);
    this.areaAttacks = this.areaAttacks.filter(item => !item.dead);
    this.coins = this.coins.filter((coin) => !coin.dead);
    this.tameSlotItems = this.tameSlotItems.filter((item) => !item.dead);
    this.floaters = this.floaters.filter((floater) => floater.life > 0);
  }

  draw() {
    drawMap(this);
    for (const treasure of this.treasures) treasure.draw();
    for (const item of this.tameSlotItems) item.draw();
    for (const coin of this.coins) coin.draw();
    for (const orb of this.energyDrops) orb.draw();
    for (const spell of this.spells) spell.draw();
    for (const ally of this.allies) ally.draw();
    for (const monster of this.monsters) monster.draw();
    this.player.draw();
    for (const attack of this.areaAttacks) attack.draw();
    this.particles.draw();
    for (const floater of this.floaters) floater.draw();
    for (const hold of attackHolds.values()) {
      if (hold.triggered) continue;
      const p = center(this.player);
      ctx.strokeStyle = this.energy >= ENERGY_PER_CHARGE ? ELEMENT_COLORS[SKILLS[hold.index].element] : "#85768f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, hold.elapsed / CHARGE_HOLD_SECONDS));
      ctx.stroke();
    }
    drawUI(this);
  }
}

function drawMap(currentGame) {
  ctx.fillStyle = "#244f2f";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let y = 0; y < HEIGHT; y += TILE) {
    for (let x = 0; x < WIDTH; x += TILE) {
      ctx.fillStyle = (x / TILE + y / TILE) % 2 === 0 ? "#2b6136" : "#285a34";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(x + 5, y + 10, 3, 2);
      ctx.fillRect(x + 20, y + 22, 5, 2);
    }
  }
  ctx.fillStyle = "#8c7042";
  for (let x = 0; x < WIDTH; x += 16) ctx.fillRect(x, 328 + Math.sin(x / 54) * 10, 16, 22);
  for (let y = 80; y < HEIGHT; y += 16) ctx.fillRect(472 + Math.cos(y / 64) * 10, y, 22, 16);

  for (const item of currentGame.decor) {
    if (item.kind === "rock") {
      ctx.fillStyle = "#59645e";
      ctx.fillRect(Math.round(item.x), Math.round(item.y), 14, 9);
      ctx.fillStyle = "#879087";
      ctx.fillRect(Math.round(item.x + 3), Math.round(item.y + 1), 5, 3);
    } else {
      ctx.fillStyle = "#ffd1ee";
      ctx.fillRect(Math.round(item.x), Math.round(item.y), 3, 3);
      ctx.fillStyle = "#ffe86b";
      ctx.fillRect(Math.round(item.x + 3), Math.round(item.y + 2), 3, 3);
    }
  }

  for (const bush of currentGame.bushes) drawBush(bush.x, bush.y);
}

function drawBush(x, y) {
  ctx.fillStyle = "#163d22";
  ctx.fillRect(x + 4, y + 10, 26, 18);
  ctx.fillStyle = "#2f8b43";
  ctx.fillRect(x, y + 12, 18, 15);
  ctx.fillRect(x + 12, y + 4, 18, 19);
  ctx.fillRect(x + 22, y + 13, 16, 13);
  ctx.fillStyle = "#4db85e";
  ctx.fillRect(x + 9, y + 9, 6, 4);
  ctx.fillRect(x + 24, y + 12, 6, 4);
}

function drawHealthBar(entity, color) {
  const x = Math.round(entity.x);
  const y = Math.round(entity.y - 9);
  ctx.fillStyle = "#23131a";
  ctx.fillRect(x, y, entity.w, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, (entity.health / entity.maxHealth) * entity.w), 4);
}

function drawUI(currentGame) {
  const player = currentGame.player;
  ctx.fillStyle = "rgba(16, 16, 24, 0.86)";
  ctx.fillRect(12, 12, WIDTH - 24, 42);
  ctx.strokeStyle = "#d2b35f";
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, WIDTH - 24, 42);

  ctx.fillStyle = "#f8f0ce";
  ctx.font = "18px 'Courier New'";
  ctx.fillText("HP", 26, 39);
  ctx.fillStyle = "#331922";
  ctx.fillRect(62, 24, 164, 16);
  ctx.fillStyle = "#ff5252";
  ctx.fillRect(62, 24, (player.health / player.maxHealth) * 164, 16);
  ctx.strokeStyle = "#f8f0ce";
  ctx.strokeRect(62, 24, 164, 16);

  ctx.fillStyle = "#ffd45c";
  ctx.fillText(`Coins ${player.coins}`, 252, 39);
  ctx.fillStyle = "#f8f0ce";
  ctx.fillText(`Skill ${SKILLS[player.selectedSkill].name}`, 390, 39);
  ctx.fillText(`Allies ${currentGame.allies.length}/${currentGame.tameSlots}`, 560, 39);
  const ready = player.cooldown <= 0 ? "Ready" : `${player.cooldown.toFixed(1)}s`;
  ctx.fillText(ready, 690, 39);

  drawChargeMeter(currentGame);

  SKILLS.forEach((skill, index) => {
    const x = 810 + index * 32;
    ctx.fillStyle = index === player.selectedSkill ? "#f8f0ce" : "#3a2f27";
    ctx.fillRect(x, 21, 24, 24);
    ctx.fillStyle = ELEMENT_COLORS[skill.element];
    ctx.fillRect(x + 5, 26, 14, 14);
    ctx.fillStyle = "#101018";
    ctx.font = "12px 'Courier New'";
    ctx.fillText(skill.key.toUpperCase(), x + 8, 38);
  });
}

function loop(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

window.addEventListener("keydown", (event) => {

  const key = event.key.toLowerCase();
  if (key === "escape" && !event.repeat) {
    setPaused(game.state === "playing");
    return;
  }
  if (key === " " && event.target instanceof HTMLButtonElement) return;
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  keys.add(key);
  const skillIndex = SKILLS.findIndex((skill) => skill.key === key);
  if (skillIndex >= 0 && game.state === "playing") {
    selectSkill(skillIndex);
    if (game.state === "playing" && !event.repeat && !attackHolds.has(key)) {
      attackHolds.set(key, { index: skillIndex, elapsed: 0, triggered: false });
    }
  }
  if (key === " " && game.state === "playing" && !event.repeat) game.cast();
  if (key === "r" && game.state === "gameover") game.start();
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  const hold = attackHolds.get(key);
  attackHolds.delete(key);
  if (hold && !hold.triggered && game.state === "playing") {
    selectSkill(hold.index);
    game.cast();
  }
});
canvas.addEventListener("click", (event) => {
  const point = canvasPoint(event);
  game.cast(point.x, point.y);
});

startButton.addEventListener("click", () => game.start());
restartButton.addEventListener("click", () => game.start());
muteButton.addEventListener("click", () => {
  soundMuted = !soundMuted;
  muteButton.textContent = soundMuted ? "Sound off" : "Sound on";
  muteButton.setAttribute("aria-pressed", String(soundMuted));
  muteButton.setAttribute("aria-label", soundMuted ? "Sound muted. Enable sound" : "Sound enabled. Mute sound");
  if (!soundMuted) game.audio.play(440, 0.05);
});

pauseButton.addEventListener("click", () => setPaused(game.state === "playing"));
resumeButton.addEventListener("click", () => setPaused(false));
spellButtons.forEach((button, index) => button.addEventListener("click", () => {
  if (game.state !== "playing") return;
  selectSkill(index);
  canvas.focus({ preventScroll: true });
}));
window.addEventListener("blur", () => { clearInput(); setPaused(true); });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { clearInput(); setPaused(true); }
});

game = new Game();
requestAnimationFrame(loop);
// Code-drawn pixel silhouettes keep the game self-contained and crisp at any scale.
function pixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function pixelShape(x, y, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([px, py], i) => i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py));
  ctx.closePath();
  ctx.fill();
}

function drawMage(x, y, facing, time, gem) {
  const step = Math.round(Math.sin(time) * 2);
  pixelRect(x + 1, y + 26, 26, 4, '#10221ca0');
  pixelRect(x + 5, y + 23 + step, 6, 6, '#231e31');
  pixelRect(x + 15, y + 23 - step, 6, 6, '#231e31');
  pixelShape(x, y, [[5,9],[20,9],[25,25],[0,25]], '#33274f');
  pixelShape(x, y, [[9,10],[19,10],[21,24],[5,24]], '#6652a0');
  pixelRect(x + 9, y + 12, 3, 12, '#a18bcc');
  pixelRect(x + 5, y + 21, 16, 2, '#d6b96f');
  pixelRect(x + 8, y + 4, 12, 8, '#dbb899');
  pixelRect(x + (facing.x < 0 ? 9 : 15), y + 7, 3, 2, '#2b2541');
  pixelRect(x + 6, y + 1, 16, 4, '#30263f');
  pixelShape(x, y, [[-3,3],[3,-1],[8,-14],[15,-18],[19,-13],[15,-12],[21,-1],[27,3]], '#362852');
  pixelShape(x, y, [[6,-2],[10,-13],[15,-16],[13,-10],[17,-2]], '#7b63b0');
  pixelRect(x + 4, y - 2, 18, 3, '#c8a766');
  pixelRect(x + 13, y - 2, 3, 3, gem);
  const staffX = x + (facing.x < 0 ? -5 : 28);
  pixelRect(staffX, y + 4, 3, 25, '#54392f');
  pixelRect(staffX, y + 5, 1, 22, '#b58b59');
  pixelRect(staffX - 3, y, 9, 7, '#d5b67a');
  pixelShape(staffX, y, [[1,-7],[5,-2],[1,3],[-3,-2]], gem);
  pixelRect(staffX, y - 4, 2, 3, '#fff4d9');
  pixelRect(staffX - 1, y + 12, 5, 4, '#dbb899');
}

function drawCreature(x, y, type, time, digging) {
  const step = Math.round(Math.sin(time) * 2);
  pixelRect(x, y + 22, 27, 4, '#10221c99');
  if (type === 'grass') {
    // Root feet and branch arms give the bush a walking silhouette.
    pixelRect(x + 5, y + 17 + step, 5, 9, '#7d5938');
    pixelRect(x + 2, y + 24 + step, 9, 3, '#ba8a50');
    pixelRect(x + 17, y + 17 - step, 5, 9, '#7d5938');
    pixelRect(x + 17, y + 24 - step, 9, 3, '#ba8a50');
    pixelRect(x - 4, y + 11 - step, 7, 4, '#84623b');
    pixelRect(x + 24, y + 9 + step, 7, 4, '#84623b');
    const bob = digging ? 5 + step : step;
    pixelShape(x, y + bob, [[-5,7],[0,2],[0,-3],[8,-3],[12,-8],[20,-5],[22,0],[28,2],[31,11],[25,20],[2,20],[-4,15]], '#204c2e');
    pixelRect(x - 1, y + bob + 1, 25, 15, '#397f3d');
    pixelRect(x + 4, y + bob - 4, 13, 9, '#589f45');
    pixelRect(x - 3, y + bob + 6, 9, 7, '#66ad4b');
    pixelRect(x + 18, y + bob + 1, 9, 8, '#4a903e');
    pixelRect(x + 8, y + bob - 4, 6, 3, '#98c962');
    pixelRect(x + 20, y + bob + 10, 6, 3, '#75b44c');
    pixelRect(x + 5, y + bob + 8, 6, 5, '#182f24');
    pixelRect(x + 16, y + bob + 8, 6, 5, '#182f24');
    pixelRect(x + 7, y + bob + 9, 3, 2, '#e6eaa0');
    pixelRect(x + 17, y + bob + 9, 3, 2, '#e6eaa0');
    pixelRect(x + 11, y + bob + 15, 5, 2, '#182f24');
    pixelRect(x + 2, y + bob + 2, 3, 3, '#df9d81');
    pixelRect(x + 22, y + bob + 4, 3, 3, '#df9d81');
    if (digging) pixelRect(x - 4, y + 23, 34, 4, '#987144');
  } else if (type === 'fire') {
    // Swept flame-feather wings, hooked beak, crest, and talons.
    const flap = Math.round(Math.sin(time) * 5);
    pixelShape(x,y,[[-12,1+flap],[-5,4+flap],[-8,-5+flap],[5,5],[10,16],[-1,18]],'#bd4234');
    pixelShape(x,y,[[37,1+flap],[30,4+flap],[33,-5+flap],[20,5],[15,16],[26,18]],'#bd4234');
    pixelShape(x,y,[[-9,3+flap],[3,8],[8,15],[-1,13]],'#ff9a40');
    pixelShape(x,y,[[34,3+flap],[22,8],[17,15],[26,13]],'#ff9a40');
    pixelShape(x,y,[[6,15],[19,15],[23,29],[16,24],[12,31],[9,24],[2,29]],'#d84f31');
    pixelShape(x,y,[[7,4],[12,-7],[16,0],[22,-3],[19,6],[21,17],[16,23],[8,23],[4,16]],'#e76d32');
    pixelShape(x,y,[[9,8],[16,8],[18,17],[13,23],[8,18]],'#ffd473');
    pixelRect(x+5,y+5,6,4,'#562637');
    pixelRect(x+16,y+5,6,4,'#562637');
    pixelRect(x+8,y+5,3,2,'#fff5c2');
    pixelRect(x+16,y+5,3,2,'#fff5c2');
    pixelShape(x,y,[[10,9],[17,9],[13,15]],'#ffec98');
    pixelRect(x+6,y+23,3,4,'#ebbc66');
    pixelRect(x+17,y+23,3,4,'#ebbc66');
    pixelRect(x+4,y+26,7,2,'#ebbc66');
    pixelRect(x+16,y+26,7,2,'#ebbc66');
  } else {
    pixelShape(x, y + step, [[12,-8],[18,0],[23,5],[27,14],[25,21],[19,25],[5,25],[-1,20],[-2,12],[3,5],[8,1]], '#265a88');
    pixelShape(x, y + step, [[12,-5],[16,2],[22,8],[24,16],[20,22],[6,22],[1,17],[3,9],[9,3]], '#469db9');
    pixelRect(x + 5, y + step + 5, 5, 8, '#9ce5e3');
    pixelRect(x + 9, y + step + 1, 3, 5, '#d5f6e9');
    pixelRect(x + 5, y + step + 14, 5, 4, '#16384f');
    pixelRect(x + 16, y + step + 14, 5, 4, '#16384f');
    pixelRect(x + 6, y + step + 14, 2, 2, '#e5fff0');
    pixelRect(x + 17, y + step + 14, 2, 2, '#e5fff0');
    pixelRect(x + 11, y + step + 20, 4, 2, '#a8e5db');
    pixelRect(x - 4, y + 24, 10, 2, '#6abfc999');
    pixelRect(x + 20, y + 24, 10, 2, '#6abfc999');
  }
}

function drawBurrow(monster) {
  for (const point of monster.trail) {
    ctx.globalAlpha = Math.max(0, point.life / 0.65) * 0.65;
    pixelRect(point.x + 3, point.y + 15, 21, 6, '#59472e');
    pixelRect(point.x + 7, point.y + 12, 13, 4, '#a68551');
  }
  ctx.globalAlpha = 1;
  const x = Math.round(monster.x), y = Math.round(monster.y);
  const shake = Math.round(Math.sin(monster.animationTime * 3) * 2);
  pixelShape(x, y, [[-5,22],[1,15],[5,15],[7,9+shake],[18,8+shake],[23,14],[27,16],[31,23]], '#57442e');
  pixelRect(x + 2, y + 15 + shake, 23, 5, '#967147');
  pixelRect(x + 7, y + 10 + shake, 13, 5, '#bd975d');
  pixelRect(x + 10, y + 9 + shake, 6, 2, '#c8af75');
  pixelRect(x + 13, y + 14, 3, 6, '#483a2c');
  pixelRect(x + 16, y + 19, 7, 2, '#483a2c');
  pixelRect(x - 4, y + 10 - shake, 3, 3, '#b48a51');
  pixelRect(x + 29, y + 15 + shake, 3, 3, '#b48a51');
  if (monster.burrowState === 'warning') {
    ctx.strokeStyle = '#edcc7c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + monster.w / 2, y + monster.h / 2, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#edcc7c';
    ctx.font = "bold 18px 'Courier New'";
    ctx.fillText('!', x + 8, y - 5);
  }
}

function drawDashWarning(monster) {
  const origin = center(monster), direction = monster.dashDirection;
  const end = {
    x: clamp(origin.x + direction.x * 273, 8 + monster.w / 2, WIDTH - 8 - monster.w / 2),
    y: clamp(origin.y + direction.y * 273, 58 + monster.h / 2, HEIGHT - 8 - monster.h / 2),
  };
  ctx.strokeStyle = '#ffbb70';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffe1a1'; ctx.font = "bold 18px 'Courier New'";
  ctx.fillText('!', monster.x + 9, monster.y - 13);
}

function drawFireDash(monster) {
  const origin = center(monster);
  ctx.save();
  ctx.translate(Math.round(origin.x), Math.round(origin.y));
  ctx.rotate(Math.atan2(monster.dashDirection.y, monster.dashDirection.x));
  const flicker = Math.round(Math.sin(monster.animationTime * 3) * 4);
  pixelShape(0,0,[[-40-flicker,-8],[-20,-6],[-31,-15],[-7,-12],[11,-10],[17,0],[11,10],[-8,12],[-33,13],[-21,5],[-44+flicker,4]],'#db5730');
  pixelShape(0,0,[[-28,-5],[-9,-9],[9,-7],[14,0],[8,8],[-9,8],[-30,5],[-17,0]],'#ffac44');
  pixelShape(0,0,[[-10,-4],[7,-5],[11,0],[6,5],[-13,4],[-5,0]],'#fff2ac');
  pixelRect(-39, -13 + flicker, 3, 3, '#f2b75c');
  pixelRect(-48, 8 - flicker, 4, 2, '#e77939');
  ctx.restore();
}

class EnergyOrb {
  constructor(x,y) { this.x=x;this.y=y;this.w=14;this.h=14;this.dead=false;this.phase=0; }
  update(dt) {
    if(this.dead)return;
    this.phase+=dt*4;
    if(game.energy<ENERGY_PER_CHARGE*MAX_CHARGES && rectsOverlap(this,game.player)) {
      game.energy=Math.min(ENERGY_PER_CHARGE*MAX_CHARGES,game.energy+1);
      this.dead=true;
      game.floaters.push(new Floater(this.x,this.y-14,"+1 energy","#c9acff"));
      game.audio.play(760,0.1,"sine");
    }
  }
  draw(){
    const y=this.y+Math.sin(this.phase)*2;
    ctx.fillStyle='#b68aff33';ctx.beginPath();ctx.arc(this.x+7,y+7,13,0,Math.PI*2);ctx.fill();
    pixelShape(this.x,y,[[7,-1],[14,7],[7,15],[0,7]],'#a879ef');
    pixelShape(this.x,y,[[7,2],[11,7],[7,11],[4,7]],'#eee0ff');
  }
}

class AreaAttack {
  constructor(origin,element,radius,damage){
    this.x=origin.x;this.y=origin.y;this.element=element;this.maxRadius=radius;this.damage=damage;
    this.age=0;this.life=0.6;this.dead=false;this.hits=new Set();
  }
  update(dt){
    if(this.dead)return;
    this.age+=dt;
    const radius=this.maxRadius*Math.min(1,this.age/0.4);
    for(const m of game.monsters){
      if(m.dead||this.hits.has(m)||!m.canBeHit(this.element))continue;
      if(dist(this,center(m))<=radius+12){this.hits.add(m);m.takeDamage(this.damage,this.element);}
    }
    if(this.age>=this.life)this.dead=true;
  }
  draw(){
    const radius=this.maxRadius*Math.min(1,this.age/0.4);
    ctx.save();ctx.globalAlpha=Math.max(0,1-this.age/this.life);
    ctx.strokeStyle=ELEMENT_COLORS[this.element];ctx.lineWidth=this.element==='water'?7:4;
    ctx.beginPath();ctx.arc(this.x,this.y,radius,0,Math.PI*2);ctx.stroke();
    if(this.element==='grass'){
      ctx.strokeStyle='#d9bb75';ctx.lineWidth=3;
      for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(this.x+Math.cos(a)*radius*.3,this.y+Math.sin(a)*radius*.3);ctx.lineTo(this.x+Math.cos(a+.1)*radius*.65,this.y+Math.sin(a+.1)*radius*.65);ctx.lineTo(this.x+Math.cos(a)*radius,this.y+Math.sin(a)*radius);ctx.stroke();}
    }else{
      ctx.lineWidth=2;ctx.beginPath();ctx.arc(this.x,this.y,radius*.72,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<16;i++){const a=i*Math.PI/8;pixelRect(this.x+Math.cos(a)*radius-3,this.y+Math.sin(a)*radius-3,6,this.element==='fire'?10:4,this.element==='fire'?'#ffd87a':'#cbf9ff');}
    }
    ctx.restore();
  }
}

function drawChargeMeter(currentGame){
  const full=Math.floor(currentGame.energy/ENERGY_PER_CHARGE);
  ctx.fillStyle='#111421e8';ctx.fillRect(12,HEIGHT-43,480,31);
  ctx.fillStyle='#e2d2ff';ctx.font="12px 'Courier New'";
  ctx.fillText(`ENERGY ${full}/3`,23,HEIGHT-23);
  for(let i=0;i<MAX_CHARGES;i++){
    const x=111+i*43,amount=clamp(currentGame.energy-i*ENERGY_PER_CHARGE,0,ENERGY_PER_CHARGE);
    ctx.fillStyle='#362c49';ctx.fillRect(x,HEIGHT-34,36,13);
    ctx.fillStyle=amount===ENERGY_PER_CHARGE?'#c3a1ff':'#7958a6';ctx.fillRect(x,HEIGHT-34,36*amount/ENERGY_PER_CHARGE,13);
    ctx.strokeStyle='#c3a1ff';ctx.strokeRect(x,HEIGHT-34,36,13);
  }
  ctx.fillStyle=full?'#e8dfff':'#a79db7';
  ctx.fillText(full?'Hold F / D / S / A':'Collect dropped violet energy',247,HEIGHT-23);
}


function clearInput() {
  keys.clear();
  attackHolds.clear();
}

function updateAttackHolds(dt) {
  for (const hold of attackHolds.values()) {
    if (hold.triggered) continue;
    hold.elapsed += dt;
    if (hold.elapsed >= CHARGE_HOLD_SECONDS) {
      hold.triggered = true;
      selectSkill(hold.index);
      game.castCharged();
    }
  }
}
