const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function world() {
  const context = new Proxy({}, { get: (o, k) => o[k] || (() => {}), set: (o,k,v) => (o[k]=v,true) });
  const element = () => ({ width:960, height:640, getContext:()=>context, classList:{add(){},remove(){},toggle(){}}, addEventListener(){}, setAttribute(){}, focus(){} });
  const sandbox = { document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){}}, window:{addEventListener(){}}, requestAnimationFrame(){},performance:{now:()=>0} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8') + '\nthis.api={Monster,Ally,Spell,SKILLS,game,center};',sandbox);
  sandbox.api.game.state='playing';
  return sandbox.api;
}
test('underground grass monsters reject fire, water, and taming; grass connects',()=>{
  const {Monster,Spell,SKILLS,game,center}=world();
  const bush=new Monster(100,100,'grass'); bush.burrowState='underground'; game.monsters=[bush];
  for(const skill of SKILLS){
    const {x,y}=center(bush); const spell=new Spell(x,y,0,0,skill);
    spell.update(0);
    assert.equal(spell.dead,skill.element==='grass');
  }
  assert.equal(bush.health,54); assert.equal(game.allies.length,0);
  bush.takeDamage(100,'fire'); assert.equal(bush.health,54);
  game.tryTame(bush); assert.equal(game.allies.length,0);
  bush.burrowState='surface'; bush.takeDamage(10,'fire'); assert.equal(bush.health,38);
});
test('burrow moves with a trail, warns at a fixed point, erupts once, and recovers',()=>{
  const {Monster,game,center}=world(); const bush=new Monster(100,100,'grass');
  game.player.x=180; game.player.y=100; bush.burrowTimer=0;
  bush.update(.01); assert.equal(bush.burrowState,'digging');
  bush.update(.56); assert.equal(bush.underground,true);
  bush.update(.1); assert.ok(bush.x>100); assert.ok(bush.trail.length>0);
  bush.burrowTimer=0; bush.update(.01); assert.equal(bush.burrowState,'warning');
  const x=bush.x; game.player.x=bush.x; game.player.y=bush.y;
  bush.update(.2); assert.equal(bush.x,x); assert.equal(game.player.health,120);
  bush.update(.56); assert.equal(bush.burrowState,'recovery'); assert.equal(game.player.health,106);
  assert.equal(bush.underground,false); bush.update(.2); assert.equal(game.player.health,106);
  bush.update(1); assert.equal(bush.burrowState,'surface');
});
test('ambush can be dodged during the warning',()=>{
  const {Monster,game}=world(); const bush=new Monster(100,100,'grass');
  bush.burrowState='warning'; bush.burrowTimer=.2;
  game.player.x=300; game.player.y=300;
  bush.update(.21); assert.equal(game.player.health,120);
});
test('grass damage can kill a burrower before eruption; dead monsters cannot ambush',()=>{
  const {Monster,game}=world(); const bush=new Monster(game.player.x,game.player.y,'grass');
  bush.burrowState='warning'; bush.burrowTimer=0;
  bush.takeDamage(100,'grass'); assert.equal(bush.dead,true);
  const coins=game.coins.length; bush.takeDamage(100,'grass'); bush.update(1);
  assert.equal(game.coins.length,coins); assert.equal(game.player.health,120);
});
test('only grass allies target underground enemies; allied bushes stay above ground',()=>{
  const {Monster,Ally,game}=world(); const bush=new Monster(100,100,'grass'); bush.burrowState='underground'; game.monsters=[bush];
  const fire=new Ally(new Monster(100,100,'fire')); fire.update(.01); assert.equal(bush.health,80);
  const grass=new Ally(new Monster(100,100,'grass')); grass.update(.01); assert.equal(bush.health,68);
  grass.update(10); assert.equal(grass.burrowState,'surface');
});
test('pause freezes burrow timers and rendering accepts every creature state',()=>{
  const {Monster,game}=world(); const bush=new Monster(100,100,'grass'); game.monsters=[bush];
  game.state='paused'; const before=bush.burrowTimer; game.update(1); assert.equal(bush.burrowTimer,before);
  for(const type of ['fire','water','grass']){
    const monster=new Monster(100,100,type); monster.draw();
    if(type==='grass') for(const state of ['digging','underground','warning','recovery']){monster.burrowState=state;monster.draw();}
  }
  game.player.draw();
});

test('fire dash rejects non-water spells; water damages and quenches it',()=>{
  const {Monster,Spell,SKILLS,game,center}=world(); const bird=new Monster(100,100,'fire');
  bird.dashState='dashing';bird.dashTimer=.65;game.monsters=[bird];
  for(const element of ['fire','grass','tame']){
    const skill=SKILLS.find(s=>s.element===element),p=center(bird);
    const spell=new Spell(p.x,p.y,0,0,skill);spell.update(0);assert.equal(spell.dead,false);
    bird.takeDamage(200,element); assert.equal(bird.health,80);assert.equal(bird.dashState,'dashing');
  }
  game.tryTame(bird);assert.equal(game.allies.length,0);
  const p=center(bird),spell=new Spell(p.x,p.y,0,0,SKILLS[1]);spell.update(0);
  assert.equal(spell.dead,true);assert.equal(bird.health,38);assert.equal(bird.dashState,'recovery');
  const x=bird.x;bird.update(.2);assert.equal(bird.x,x);
});
test('fire dash locks its aim, can be dodged, and has a finite recovery',()=>{
  const {Monster,game}=world(); const bird=new Monster(100,100,'fire');game.player.x=240;game.player.y=97.5;
  bird.dashTimer=0;bird.update(.01);assert.equal(bird.dashState,'windup');
  const direction={...bird.dashDirection};game.player.y=300;bird.update(.71);assert.equal(bird.dashState,'dashing');
  bird.update(.3);assert.equal(bird.dashDirection.y,direction.y);assert.equal(bird.y,100);assert.ok(bird.x>220);assert.equal(game.player.health,120);
  bird.update(.4);assert.equal(bird.dashState,'recovery');bird.update(1);assert.equal(bird.dashState,'ready');
});
test('dash sweeps collisions without tunneling and damages each target once',()=>{
  const {Monster,game}=world();const bird=new Monster(100,100,'fire');game.player.x=180;game.player.y=100;
  bird.dashState='dashing';bird.dashTimer=.65;bird.update(.4);assert.equal(game.player.health,100);
  game.player.invulnerable=0;game.player.x=bird.x;bird.update(.01);assert.equal(game.player.health,100);
});
test('fire dash stops at map edge, pauses correctly, and renders warning/fireball',()=>{
  const {Monster,game}=world();const bird=new Monster(920,100,'fire');bird.dashState='dashing';bird.dashTimer=.65;game.monsters=[bird];
  game.state='paused';game.update(1);assert.equal(bird.x,920);assert.equal(bird.dashTimer,.65);
  bird.draw();bird.update(.1);assert.equal(bird.x,927);assert.equal(bird.dashState,'recovery');
  bird.dashState='windup';bird.draw();
});
