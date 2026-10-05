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
const ITEM_DROP_CHANCE = 0.1;
const PICKUP_LIFETIME = 10;
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
      moveActor(this, dx * this.speed * dt, dy * this.speed * dt);
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  takeDamage(amount, element) {
    if (game.buffs.ace > 0 || game.buffs[element] > 0) return;
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
    const sprite=window.MageAvatar?.sprite;
    if(sprite){
      const h=54,w=h*sprite.naturalWidth/sprite.naturalHeight;
      const bob=Math.sin(this.walkTime||0)*1.4;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.fillStyle='#10221c80';ctx.beginPath();ctx.ellipse(x+this.w/2,y+this.h-1,15,5,0,0,Math.PI*2);ctx.fill();
      ctx.drawImage(sprite,x+this.w/2-w/2,y+this.h-h+bob,w,h);
      ctx.fillStyle=ELEMENT_COLORS[SKILLS[this.selectedSkill].element];ctx.beginPath();ctx.arc(x+this.w/2+this.facing.x*20,y+12+this.facing.y*15,3,0,Math.PI*2);ctx.fill();ctx.restore();
    }else drawMage(x, y, this.facing, this.walkTime || 0, ELEMENT_COLORS[SKILLS[this.selectedSkill].element]);
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
    this.rainState="ready";this.rainTimer=6;this.rainTarget=null;
  }

  get underground() {
    return this.burrowState === "underground" || this.burrowState === "warning";
  }

  canBeHit(element, ace = false) {
    if(ace) return true;
    if(this.rainState==="vanished" || this.rainState==="falling")return false;
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
        moveActor(this, nextX-this.x, nextY-this.y);
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
        Object.assign(this,game.freeSpot(this.x,this.y,this.w,this.h));
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

  beginRain(target) {
    this.rainTarget={...center(target)};this.rainState="vanished";this.rainTimer=.8;
    game.particles.burst(center(this),"#a7ecff",16);
  }

  updateRain(dt, allied=false) {
    this.rainTimer-=dt;
    if(this.rainState==="ready"){
      if(this.rainTimer>0)return false;
      this.beginRain(game.player);return true;
    }
    if(this.rainState==="vanished" && this.rainTimer<=0){this.rainState="falling";this.rainTimer=.5;}
    else if(this.rainState==="falling" && this.rainTimer<=0){
      const victims=allied?game.monsters:[game.player,...game.allies];
      for(const victim of victims){
        if(victim.dead || dist(center(victim),this.rainTarget)>52)continue;
        if(allied)victim.takeDamage(36,"water");else victim.takeDamage(16,"water");
      }
      const p=game.freeSpot(this.rainTarget.x-this.w/2,this.rainTarget.y-this.h/2,this.w,this.h);
      this.x=p.x;this.y=p.y;this.rainState="recovery";this.rainTimer=1;this.attackCooldown=1;
      game.particles.burst(this.rainTarget,"#9ce8f5",24);
    }else if(this.rainState==="recovery" && this.rainTimer<=0){this.rainState="ready";this.rainTimer=rand(5,8);}
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

    if (this.type === "water" && this.updateRain(dt)) return;
    if (this.type === "grass" && this.updateBurrow(dt, target)) return;
    if (this.type === "fire" && this.updateDash(dt, target)) return;

    const selfCenter = center(this);
    const d = Math.hypot(targetCenter.x - selfCenter.x, targetCenter.y - selfCenter.y);
    if (d > 4) {
      walkToward(this, targetCenter, this.speed * dt);
    }

    if (rectsOverlap(this, target) && this.attackCooldown <= 0) {
      target.takeDamage(this.damage, this.type);
      this.attackCooldown = 1.0;
    }
  }

  takeDamage(amount, element, ace = false) {
    if (this.dead || !this.canBeHit(element, ace)) return;
    if (this.dashState === "dashing" && element === "water") this.finishDash(true);
    const multiplier = (ace || strongAgainst(element, this.type)) ? 1.6 : 1;
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
      const p=game.freeSpot(this.x + rand(-10,22),this.y + rand(-10,22),12,12);
      game.coins.push(new Coin(p.x,p.y,1));
    }
    if (Math.random() < ITEM_DROP_CHANCE) {
      const kind=["energy","shield","union","upgrade","ace"][Math.floor(Math.random()*5)];
      const p=game.freeSpot(this.x,this.y,18,18);
      if(kind==="energy") game.energyDrops.push(new EnergyOrb(p.x,p.y));
      else game.pickups.push(new Pickup(p.x,p.y,kind,this.type));
    }
    game.audio.play(180, 0.08);
  }

  draw() {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    if(this.rainState==="vanished" || this.rainState==="falling"){drawSlimeRain(this);return;}
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
      this.beginRain(target);
      this.special = { kind: "rain" };
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
    if(s.kind==="rain"){this.updateRain(dt,true);if(this.rainState==="ready")this.special=null;return;}
    const duration = Math.min(dt, s.time);
    s.time -= dt;
    if (s.kind === "fire") {
      const steps = Math.max(1, Math.ceil(420 * duration / 6));
      for (let i=0;i<steps;i++) {
        if (!moveActor(this,s.direction.x*420*duration/steps,s.direction.y*420*duration/steps)) { s.time=0; break; }
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
    if(s.time<=0){Object.assign(this,game.freeSpot(this.x,this.y,this.w,this.h));this.special=null;this.dashState="ready";this.burrowState="surface";this.attackCooldown=0.6;}
  }

  update(dt) {
    if (this.dead) return;
    if (this.summonLife !== undefined && (this.summonLife -= dt) <= 0) { this.dead=true; return; }
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
      walkToward(this, destination, this.speed * dt);
    }

    if (target && rectsOverlap(this, target) && this.attackCooldown <= 0) {
      target.takeDamage(12, this.type);
      this.attackCooldown = 0.85;
    }
  }

  takeDamage(amount, attackerType) {
    if(this.rainState==="vanished" || this.rainState==="falling")return;
    if (strongAgainst(this.type, attackerType)) {
      game.floaters.push(new Floater(this.x - 8, this.y - 8, "Immune", "#b7edff"));
      return;
    }
    this.health = Math.max(0, this.health - Math.round(amount * 0.5));
    if (this.health <= 0) this.dead = true;
  }

  draw() {
    super.draw();
    if(this.rainState==="vanished" || this.rainState==="falling")return;
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
    this.ace = game.buffs.ace > 0 && skill.element !== "tame";
    this.explosive = game.buffs.upgrade > 0 && game.upgradeMode === "blast" && skill.element !== "tame";
  }

  update(dt) {
    if(this.dead)return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 || this.x < 0 || this.x > WIDTH || this.y < 0 || this.y > HEIGHT || game.obstacles.some(o=>rectsOverlap({x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2},o))) { this.dead=true; if(this.explosive)this.explode(); return; }

    for (const monster of game.monsters) {
      if (monster.dead || !monster.canBeHit(this.skill.element, this.ace) || Math.hypot(this.x - center(monster).x, this.y - center(monster).y) > this.r + 14) continue;
      if (this.skill.element === "tame") game.tryTame(monster);
      else if(this.explosive) this.explode();
      else monster.takeDamage(this.skill.damage, this.skill.element, this.ace);
      this.dead = true;
      break;
    }
  }

  explode() {
    const blast=new AreaAttack({x:this.x,y:this.y},this.skill.element,75,this.skill.damage);
    blast.ace=this.ace;game.areaAttacks.push(blast);
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
    if (expirePickup(this, dt)) return;
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
    if (expirePickup(this, dt)) return;
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
    this.level=1; this.elapsed=0; this.tamedElements=new Set(); this.spawnIndex=0;
    this.buffs={fire:0,water:0,grass:0,ace:0,upgrade:0};this.upgradeMode="spread";
    this.pickups=[];this.potionTimer=rand(10,16);
    this.obstacles=[{x:275,y:165,w:105,h:45},{x:605,y:175,w:48,h:110},{x:290,y:410,w:48,h:105},{x:590,y:440,w:115,h:45}];
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
    this.tameSlots = 3;
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
    document.getElementById("levelCompleteScreen").classList.add("hidden");
    for (let i = 0; i < 3; i++) this.spawnMonster();
    this.spawnTimer=6; this.updateLesson();
    canvas.focus({ preventScroll: true });
  }

  end() {
    this.state = "gameover";
    this.buffs.upgrade=0;
    this.updateLesson();
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

  freeSpot(x=rand(40,WIDTH-60),y=rand(80,HEIGHT-90),w=25,h=28) {
    const valid=p=>!this.obstacles.some(o=>rectsOverlap({...p,w,h},o));
    const p={x:clamp(x,12,WIDTH-w-12),y:clamp(y,70,HEIGHT-h-55)};
    if(valid(p))return p;
    const edges=this.obstacles.flatMap(o=>[{x:o.x-w-2,y:p.y},{x:o.x+o.w+2,y:p.y},{x:p.x,y:o.y-h-2},{x:p.x,y:o.y+o.h+2}]).filter(q=>q.x>=12&&q.y>=70&&q.x<=WIDTH-w-12&&q.y<=HEIGHT-h-55&&valid(q)).sort((a,b)=>dist(a,p)-dist(b,p));
    if(edges.length)return edges[0];
    for(let yy=80;yy<HEIGHT-h-55;yy+=40)for(let xx=30;xx<WIDTH-w-12;xx+=40)if(valid({x:xx,y:yy}))return {x:xx,y:yy};
    return {x:40,y:80};
  }

  spawnMonster() {
    if(this.monsters.filter(m=>!m.dead).length >= (this.level===1?6:10))return;
    const available=this.bushes.filter(b=>dist(b,this.player)>180);
    const bush=available[Math.floor(Math.random()*available.length)] || this.bushes[0];
    const needed=ELEMENTS.filter(t=>!this.tamedElements.has(t)&&!this.monsters.some(m=>!m.dead&&m.type===t));
    const type=this.level===1 && needed.length?needed[0]:ELEMENTS[this.spawnIndex++%3];
    const p=this.freeSpot(bush.x+rand(-8,24),bush.y+rand(-8,24));
    const m=new Monster(p.x,p.y,type);
    if(this.level===1){m.speed=20;m.dashTimer=6;m.burrowTimer=6;}
    this.monsters.push(m);
    this.particles.burst(center(m),"#77d353",14);
  }

  updateLesson() {
    const marks=ELEMENTS.map(t=>(this.tamedElements.has(t)?"✓ ":"○ ")+t).join(" · ");
    const lesson=this.level===1
      ? "LEVEL 1 · Survive "+Math.min(60,Math.floor(this.elapsed))+" / 60s · Befriend "+marks
      : "LEVEL 2 · The deeper wildwood · "+Math.floor(this.elapsed)+"s survived";
    const progress=document.getElementById("lessonProgress");if(progress.textContent!==lesson)progress.textContent=lesson;
    const active=Object.entries(this.buffs).filter(([,t])=>t>0).map(([k,t])=>k==="upgrade"?this.upgradeMode+" shots · until replaced or defeated":(k==="ace"?"Ace":k+" shield")+" "+Math.ceil(t)+"s");
    const summons=this.allies.filter(a=>!a.dead&&a.summonLife!==undefined);
    if(summons.length)active.push("Union: "+summons.length+" helpers · "+Math.ceil(Math.max(...summons.map(a=>a.summonLife)))+"s");
    const buffText=active.join(" · ") || "Walk over drops to collect them. Red bottles restore 35 health.";
    const status=document.getElementById("activeBuffs");if(status.textContent!==buffText)status.textContent=buffText;
  }

  nextLevel() {
    if(this.state!=="levelcomplete")return;
    this.level=2;this.elapsed=0;this.state="playing";this.monsters=[];this.spells=[];this.areaAttacks=[];
    this.spawnTimer=4;this.player.health=this.player.maxHealth;clearInput();
    document.getElementById("levelCompleteScreen").classList.add("hidden");pauseButton.disabled=false;
    for(let i=0;i<4;i++)this.spawnMonster();this.updateLesson();canvas.focus({preventScroll:true});
  }

  spawnTameSlotItem() {
    if (this.tameSlots >= this.maxTameSlots || this.tameSlotItems.length > 0) return;
    if(this.level===1)return;
    const p=this.freeSpot();this.tameSlotItems.push(new TameSlotItem(p.x,p.y));
  }

  cast(targetX, targetY) {
    if (this.player.cooldown > 0 || this.state !== "playing") return;
    const skill = SKILLS[this.player.selectedSkill];
    const origin = center(this.player);
    const aimX = targetX ?? origin.x + this.player.facing.x * 100;
    const aimY = targetY ?? origin.y + this.player.facing.y * 100;
    const angle = Math.atan2(aimY - origin.y, aimX - origin.x);
    const offsets=this.buffs.upgrade>0 && this.upgradeMode==="spread" && skill.element!=="tame"?[-0.23,0,0.23]:[0];
    for(const offset of offsets)this.spells.push(new Spell(origin.x, origin.y, Math.cos(angle+offset) * 420, Math.sin(angle+offset) * 420, skill));
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
      const pulse=new AreaAttack(center(this.player), element, 170, 42);pulse.ace=this.buffs.ace>0;this.areaAttacks.push(pulse);
    }
    this.energy -= ENERGY_PER_CHARGE;
    this.player.cooldown = 0.7;
    this.audio.play(620, 0.15, "triangle");
    return true;
  }

  tryTame(monster) {
    if (monster.dead || !monster.canBeHit("tame")) return;
    if(this.level===1 && this.allies.some(a=>!a.dead&&a.summonLife===undefined&&a.type===monster.type)){
      this.floaters.push(new Floater(monster.x-25,monster.y-15,"Try another element", "#f2dc6d"));return;
    }
    if (this.allies.filter(a=>!a.dead&&a.summonLife===undefined).length >= this.tameSlots) {
      this.floaters.push(new Floater(monster.x - 8, monster.y - 8, "No slot", "#f8f0ce"));
      return;
    }
    if (Math.random() < 0.75) {
      monster.dead = true;
      this.allies.push(new Ally(monster));
      this.tamedElements.add(monster.type);
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
    this.elapsed+=dt;
    for(const k of Object.keys(this.buffs))if(k!=="upgrade")this.buffs[k]=Math.max(0,this.buffs[k]-dt);
    this.potionTimer-=dt;
    if(this.potionTimer<=0){if(this.pickups.filter(p=>p.kind==="health").length<3){const p=this.freeSpot();this.pickups.push(new Pickup(p.x,p.y,"health"));}this.potionTimer=rand(12,20);}
    this.player.update(dt);
    updateAttackHolds(dt);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnMonster();
      this.spawnTimer = this.level===1?rand(6,9):rand(2.2,4.4);
    }
    this.slotSpawnTimer -= dt;
    if (this.slotSpawnTimer <= 0) {
      this.spawnTameSlotItem();
      this.slotSpawnTimer = rand(13, 20);
    }

    for (const group of [this.monsters, this.allies, this.spells, this.coins, this.treasures, this.tameSlotItems, this.energyDrops, this.pickups, this.areaAttacks, this.floaters]) {
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
    this.pickups=this.pickups.filter(p=>!p.dead);
    this.updateLesson();
    if(this.state==="playing" && this.level===1 && this.elapsed>=60 && this.tamedElements.size===3){
      this.state="levelcomplete";clearInput();pauseButton.disabled=true;
      document.getElementById("levelCompleteScreen").classList.remove("hidden");
      document.getElementById("nextLevelButton").focus({preventScroll:true});
    }
  }

  draw() {
    drawMap(this);
    for(const o of this.obstacles){
      ctx.fillStyle="#142d24";ctx.fillRect(o.x-3,o.y+7,o.w+6,o.h);
      pixelShape(o.x,o.y,[[0,9],[9,0],[o.w-9,0],[o.w,9],[o.w,o.h-7],[o.w-7,o.h],[7,o.h],[0,o.h-7]],"#75816a");
      ctx.fillStyle="#a3ad83";ctx.fillRect(o.x+9,o.y+3,o.w-18,5);
      ctx.fillStyle="#526044";ctx.fillRect(o.x+6,o.y+o.h-10,o.w-12,7);
      ctx.strokeStyle="#45503f";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x+o.w*.65,o.y+6);ctx.lineTo(o.x+o.w*.48,o.y+o.h*.48);ctx.lineTo(o.x+o.w*.61,o.y+o.h*.73);ctx.stroke();
      for(let i=0;i<3;i++){ctx.fillStyle=i%2?"#759453":"#3e693c";ctx.fillRect(o.x+6+i*9,o.y+o.h-10-i%2*5,10,7);}
    }
    for(const p of this.pickups)p.draw();
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
  ctx.fillText(`Allies ${currentGame.allies.filter(a=>a.summonLife===undefined&&!a.dead).length}/${currentGame.tameSlots}`, 560, 39);
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

  if(window.MageAvatar?.editing)return;
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

startButton.addEventListener("click", () => window.beginWithMage ? window.beginWithMage() : game.start());
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
    // Low, rounded jelly silhouette with squash and stretch, rather than a pointed droplet.
    const squash=Math.sin(time)*1.5;
    ctx.save();ctx.translate(x+12,y+24);ctx.scale(1+squash*.025,1-squash*.035);
    ctx.fillStyle='#17495f';ctx.beginPath();ctx.ellipse(0,-9,17,12,0,Math.PI,Math.PI*2);ctx.quadraticCurveTo(21,3,7,2);ctx.quadraticCurveTo(0,5,-8,2);ctx.quadraticCurveTo(-21,3,-17,-9);ctx.fill();
    ctx.fillStyle='#52bbd5';ctx.beginPath();ctx.ellipse(0,-9,14,10,0,Math.PI,Math.PI*2);ctx.quadraticCurveTo(17,0,5,0);ctx.quadraticCurveTo(-14,3,-14,-9);ctx.fill();
    ctx.fillStyle='#b8f5ed';ctx.beginPath();ctx.ellipse(-6,-14,5,2.5,-.4,0,Math.PI*2);ctx.fill();
    pixelRect(-8,-9,4,5,'#133e55');pixelRect(5,-9,4,5,'#133e55');pixelRect(-7,-9,1,2,'#fff9dc');pixelRect(6,-9,1,2,'#fff9dc');
    ctx.strokeStyle='#24657a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-4,3,0,Math.PI);ctx.stroke();ctx.restore();
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
    if(expirePickup(this,dt))return;
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
      if(m.dead||this.hits.has(m)||!m.canBeHit(this.element,this.ace))continue;
      if(dist(this,center(m))<=radius+12){this.hits.add(m);m.takeDamage(this.damage,this.element,this.ace);}
    }
    if(this.age>=this.life)this.dead=true;
  }
  draw(){
    const reach=Math.min(1,this.age/0.4), radius=this.maxRadius*reach;
    const fade=Math.min(1,this.age/.045)*Math.max(0,1-Math.max(0,this.age-.34)/.26);
    if(radius<1 || fade<=0)return;
    ctx.save();ctx.translate(this.x,this.y);ctx.globalAlpha=fade;
    ctx.lineCap='round';ctx.lineJoin='round';
    if(this.element==='water')drawWaterWave(radius,reach,this.age);
    else if(this.element==='grass')drawEarthquake(radius,reach,this.age);
    else drawFirePulse(radius,reach,this.age);
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

// Axis-separated, swept collision permits sliding without tunneling through rocks.
function moveActor(actor,dx,dy){
  const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/5));let clear=true;
  for(let i=0;i<n;i++)for(const [axis,delta,min,max] of [["x",dx/n,8,WIDTH-actor.w-8],["y",dy/n,58,HEIGHT-actor.h-8]]){
    const old=actor[axis];actor[axis]=clamp(old+delta,min,max);
    if(game.obstacles.some(o=>rectsOverlap(actor,o))){actor[axis]=old;clear=false;}
    if(actor[axis]!==old+delta)clear=false;
  }return clear;
}
function walkToward(actor,target,step){
  const p=center(actor),d=dist(p,target)||1;
  if(!moveActor(actor,(target.x-p.x)/d*step,(target.y-p.y)/d*step)){
    // Follow a consistent side of the blocking rock until the direct route opens.
    moveActor(actor,-(target.y-p.y)/d*step,(target.x-p.x)/d*step);
  }
}
class Pickup {
  constructor(x,y,kind,type){Object.assign(this,{x,y,kind,type,w:18,h:18,dead:false,age:0});}
  update(dt){
    if(game.state!=="playing" || expirePickup(this,dt)||!rectsOverlap(this,game.player))return;
    if(this.kind==="health" && game.player.health===game.player.maxHealth)return;
    this.dead=true;
    let label="";
    if(this.kind==="shield"){game.buffs[this.type]=10;label=this.type+" shield · 10s";}
    if(this.kind==="ace"){game.buffs.ace=8;label="Ace · 8s";}
    if(this.kind==="health"){game.player.health=Math.min(game.player.maxHealth,game.player.health+35);label="+35 health";}
    if(this.kind==="upgrade"){game.buffs.upgrade=1;game.upgradeMode=Math.random()<.5?"spread":"blast";label=game.upgradeMode+" shots equipped";}
    if(this.kind==="union"){
      for(let i=0;i<5;i++){const p=game.freeSpot(this.x+Math.cos(i*Math.PI*2/5)*40,this.y+Math.sin(i*Math.PI*2/5)*40);const ally=new Ally(new Monster(p.x,p.y,this.type));ally.summonLife=15;game.allies.push(ally);}
      label=this.type+" union · 15s";
    }
    game.floaters.push(new Floater(this.x-30,this.y-14,label,"#ffedb7"));
  }
  draw(){
    const color=this.kind==="health"?"#ed777b":this.kind==="ace"?"#fff0b0":ELEMENT_COLORS[this.type]||"#cfb2ff";
    ctx.fillStyle="#14251f";ctx.fillRect(this.x-3,this.y-3,24,24);ctx.strokeStyle=color;ctx.strokeRect(this.x-3,this.y-3,24,24);
    ctx.fillStyle=color;ctx.font="bold 17px sans-serif";ctx.textAlign="center";
    ctx.fillText({health:"+",shield:"◇",union:"5",upgrade:"↗",ace:"★"}[this.kind],this.x+9,this.y+15);ctx.textAlign="left";
  }
}
document.getElementById("nextLevelButton").addEventListener("click",()=>game.nextLevel());

// Field lifetime uses simulation time, so pausing freezes uncollected drops.
function expirePickup(item, dt) {
  if (item.dead) return true;
  item.age = (item.age || 0) + dt;
  if (item.age >= PICKUP_LIFETIME) item.dead = true;
  return !!item.dead;
}

// Effects are deterministic and use attack age; pause freezes every visual layer.
function chargeRing(radius,width,color,start=0,end=Math.PI*2){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(0,0,Math.max(.1,radius),start,end);ctx.stroke();
}
function drawWaterWave(r,p,t){
  // A translucent body, dark trough, luminous crest, and broken foam follow the hit front.
  chargeRing(r*.86,Math.max(3,r*.24),'#248cbe45');
  chargeRing(r*.92,Math.max(2,r*.10),'#086886b0');
  chargeRing(r,Math.max(3,11*(1-p*.4)),'#5be0ed');
  chargeRing(r+2,2,'#e6ffff');
  chargeRing(r*.69,3,'#73d9ee70');
  for(let i=0;i<18;i++){
    const a=i*Math.PI/9+t*.5, wobble=Math.sin(i*2.4+t*15);
    chargeRing(r-4+wobble*2,3,'#f0ffff',a,a+.07+(i%3)*.025);
    ctx.save();ctx.rotate(a);
    ctx.strokeStyle='#aaf7ff';ctx.lineWidth=2;ctx.beginPath();
    ctx.moveTo(r-9,0);ctx.quadraticCurveTo(r+9,-8,r+5,-14);ctx.quadraticCurveTo(r,-19,r-2,-12);ctx.stroke();
    const spray=r+8+Math.sin(p*Math.PI)*(8+i%4*3);
    ctx.fillStyle=i%2?'#d9ffff':'#73dbea';ctx.beginPath();ctx.ellipse(spray,5+i%3*4,2,3+i%3,a,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  chargeRing(r*.43,2,'#9af0f03d');
}
function drawEarthquake(r,p,t){
  chargeRing(r,9,'#b6925c35');chargeRing(r*.97,2,'#dbc68b65');
  for(let i=0;i<11;i++){
    const a=i*Math.PI*2/11, bend=Math.sin(i*7.2)*.12;
    const points=[[Math.cos(a)*12,Math.sin(a)*12], [Math.cos(a+bend)*r*.38,Math.sin(a+bend)*r*.38], [Math.cos(a-bend)*r*.68,Math.sin(a-bend)*r*.68], [Math.cos(a+.035)*r,Math.sin(a+.035)*r]];
    for(const [width,color] of [[7,'#c6a56670'],[4,'#30271e'],[1,'#e4bc6a']]){
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    }
    ctx.strokeStyle='#423223';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...points[2]);ctx.lineTo(Math.cos(a+.20)*r*.80,Math.sin(a+.20)*r*.80);ctx.lineTo(Math.cos(a+.24)*r*.95,Math.sin(a+.24)*r*.95);ctx.stroke();
    const x=Math.cos(a)*r*.82,y=Math.sin(a)*r*.82;
    const lift=Math.sin(Math.min(1,p)*Math.PI)*(10+i%3*5),size=4+i%3*2;
    ctx.fillStyle='#171f1855';ctx.beginPath();ctx.ellipse(x,y+5,size+3,3,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(x,y-lift);ctx.rotate(Math.sin(i)*t*5);
    ctx.fillStyle='#61533c';ctx.beginPath();ctx.moveTo(-size,1);ctx.lineTo(-size*.4,-size);ctx.lineTo(size*.7,-size*.7);ctx.lineTo(size,size*.5);ctx.lineTo(0,size);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#cfb786';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-size*.4,-size);ctx.lineTo(size*.7,-size*.7);ctx.stroke();ctx.restore();
    ctx.fillStyle='#d1b98445';ctx.beginPath();ctx.ellipse(Math.cos(a+.1)*r,Math.sin(a+.1)*r,6+i%3*2,4,0,0,Math.PI*2);ctx.fill();
  }
}
function drawFirePulse(r,p,t){
  chargeRing(r*.88,Math.max(3,r*.22),'#ef481d30');
  chargeRing(r,14,'#d8392055');chargeRing(r,7,'#ff7329');chargeRing(r-2,3,'#ffe098');
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12, flicker=Math.sin(t*30+i*2.3),length=(9+i%4*3)*(0.6+Math.sin(p*Math.PI)*.6);
    ctx.save();ctx.rotate(a);
    ctx.fillStyle=i%2?'#f45b24':'#ff923a';ctx.beginPath();ctx.moveTo(r-7,-6);
    ctx.quadraticCurveTo(r+length*.7,-10,r+length+flicker*3,-4);
    ctx.quadraticCurveTo(r+length*.35,0,r+length*.65,5);
    ctx.quadraticCurveTo(r+3,3,r-7,7);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff2af';ctx.beginPath();ctx.moveTo(r-6,-3);ctx.quadraticCurveTo(r+9,-4,r+length*.45,-1);ctx.lineTo(r-4,3);ctx.closePath();ctx.fill();
    const ember=r+12+(i%5)*5*p;ctx.fillStyle=i%3?'#ffad45':'#ffe4a3';ctx.fillRect(ember,-8+flicker*5,2+i%2,2+i%2);ctx.restore();
  }
  chargeRing(r*.61,2,'#ffbb5845');
}

function drawSlimeRain(slime){
  const p=slime.rainTarget;if(!p)return;
  ctx.save();
  // Ground ripples indicate the landing area, never the route of the attack.
  ctx.strokeStyle='#b8eced80';ctx.lineWidth=2;
  const pulse=slime.rainState==='vanished'?1-slime.rainTimer/.8:1;
  ctx.beginPath();ctx.ellipse(p.x,p.y,20+pulse*20,9+pulse*8,0,0,Math.PI*2);ctx.stroke();
  if(slime.rainState==='falling'){
    const progress=clamp(1-slime.rainTimer/.5,0,1);
    for(let i=0;i<15;i++){
      const a=i*2.399,r=8+(i%5)*8,x=p.x+Math.cos(a)*r;
      const y=p.y+Math.sin(a)*r*.5-(1-progress)*(140+(i%4)*18);
      ctx.strokeStyle=i%3?'#6fd9f0':'#defcff';ctx.lineWidth=3+i%3;
      ctx.beginPath();ctx.moveTo(x,y-9-i%4);ctx.lineTo(x,y);ctx.stroke();
    }
    ctx.globalAlpha=.8;drawCreature(p.x-12,p.y-23-(1-progress)*160,'water',slime.animationTime,false);
  }
  ctx.restore();
}
