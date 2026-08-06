const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const muteButton = document.getElementById("muteButton");

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

const keys = new Set();
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
    ctx.fillStyle = "#20203a";
    ctx.fillRect(x + 4, y + 11, 16, 15);
    ctx.fillStyle = "#5b3ad6";
    ctx.fillRect(x + 2, y + 8, 20, 16);
    ctx.fillStyle = "#d8c6ff";
    ctx.fillRect(x + 7, y + 5, 10, 9);
    ctx.fillStyle = "#2d195d";
    ctx.fillRect(x + 4, y, 16, 7);
    ctx.fillRect(x + 7, y - 5, 10, 8);
    ctx.fillStyle = "#ffd45c";
    ctx.fillRect(x + 11, y - 8, 3, 5);
    ctx.fillStyle = "#321b17";
    ctx.fillRect(x + 7, y + 25, 5, 3);
    ctx.fillRect(x + 14, y + 25, 5, 3);
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
  }

  update(dt) {
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
    const multiplier = strongAgainst(element, this.type) ? 1.6 : 1;
    const finalDamage = Math.round(amount * multiplier);
    this.health -= finalDamage;
    game.floaters.push(new Floater(this.x, this.y - 10, multiplier > 1 ? `${finalDamage}!` : `${finalDamage}`, multiplier > 1 ? "#fff176" : "#ffffff"));
    game.particles.burst(center(this), ELEMENT_COLORS[element], multiplier > 1 ? 18 : 9);
    if (this.health <= 0) this.defeat();
  }

  defeat() {
    this.dead = true;
    const count = Math.floor(rand(2, 5));
    for (let i = 0; i < count; i++) {
      game.coins.push(new Coin(this.x + rand(-10, 22), this.y + rand(-10, 22), 1));
    }
    if (Math.random() < 0.16) game.treasures.push(new Treasure(this.x, this.y));
    game.audio.play(180, 0.08);
  }

  draw() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = ELEMENT_COLORS[this.type];
    ctx.fillRect(x + 4, y + 6, 18, 13);
    ctx.fillRect(x + 7, y + 2, 12, 5);
    ctx.fillStyle = "#221318";
    ctx.fillRect(x + 8, y + 9, 4, 4);
    ctx.fillRect(x + 16, y + 9, 4, 4);
    ctx.fillRect(x + 5, y + 19, 5, 4);
    ctx.fillRect(x + 16, y + 19, 5, 4);
    if (this.type === "fire") {
      ctx.fillStyle = "#fff176";
      ctx.fillRect(x + 11, y - 2, 5, 5);
    }
    if (this.type === "water") {
      ctx.fillStyle = "#b7edff";
      ctx.fillRect(x + 3, y + 4, 4, 8);
    }
    if (this.type === "grass") {
      ctx.fillStyle = "#285e2e";
      ctx.fillRect(x + 10, y - 3, 8, 5);
    }
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
    this.health = Math.max(18, monster.health);
    this.speed = 88;
    this.attackCooldown = 0;
  }

  update(dt) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const target = game.monsters
      .filter((monster) => !monster.dead)
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
      if (monster.dead || Math.hypot(this.x - center(monster).x, this.y - center(monster).y) > this.r + 14) continue;
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
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    for (let i = 0; i < 5; i++) this.spawnMonster();
  }

  end() {
    this.state = "gameover";
    finalScore.textContent = `Final coins: ${this.player.coins}`;
    gameOverScreen.classList.remove("hidden");
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

  tryTame(monster) {
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

    for (const group of [this.monsters, this.allies, this.spells, this.coins, this.treasures, this.tameSlotItems, this.floaters]) {
      for (const item of group) item.update(dt);
    }
    this.particles.update(dt);

    this.monsters = this.monsters.filter((monster) => !monster.dead);
    this.allies = this.allies.filter((ally) => !ally.dead);
    this.spells = this.spells.filter((spell) => !spell.dead);
    this.coins = this.coins.filter((coin) => !coin.dead);
    this.tameSlotItems = this.tameSlotItems.filter((item) => !item.dead);
    this.floaters = this.floaters.filter((floater) => floater.life > 0);
  }

  draw() {
    drawMap(this);
    for (const treasure of this.treasures) treasure.draw();
    for (const item of this.tameSlotItems) item.draw();
    for (const coin of this.coins) coin.draw();
    for (const spell of this.spells) spell.draw();
    for (const ally of this.allies) ally.draw();
    for (const monster of this.monsters) monster.draw();
    this.player.draw();
    this.particles.draw();
    for (const floater of this.floaters) floater.draw();
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
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  keys.add(key);
  const skillIndex = SKILLS.findIndex((skill) => skill.key === key);
  if (skillIndex >= 0) {
    game.player.selectedSkill = skillIndex;
    if (game.state === "playing" && !event.repeat) game.cast();
  }
  if (key === " " && game.state === "playing") game.cast();
  if (key === "r" && game.state === "gameover") game.start();
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
canvas.addEventListener("click", (event) => {
  const point = canvasPoint(event);
  game.cast(point.x, point.y);
});

startButton.addEventListener("click", () => game.start());
restartButton.addEventListener("click", () => game.start());
muteButton.addEventListener("click", () => {
  soundMuted = !soundMuted;
  muteButton.textContent = soundMuted ? "S" : "On";
  if (!soundMuted) game.audio.play(440, 0.05);
});

game = new Game();
requestAnimationFrame(loop);
