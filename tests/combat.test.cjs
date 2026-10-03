const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function world() {
  const context = new Proxy({}, { get: (o, k) => o[k] || (() => {}), set: (o,k,v) => (o[k]=v,true) });
  const element = () => ({ width:960, height:640, getContext:()=>context, classList:{add(){},remove(){},toggle(){}}, addEventListener(){}, setAttribute(){}, focus(){} });
  const testMath=Object.create(Math);
  const events={};
  const sandbox = { Math:testMath, document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){}}, window:{addEventListener(name,fn){events[name]=fn;}}, requestAnimationFrame(){},performance:{now:()=>0} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8') + '\nthis.api={Monster,Ally,Spell,EnergyOrb,AreaAttack,SKILLS,game,center,keys};',sandbox);
  sandbox.api.game.state='playing';
  sandbox.api.events=events;
  sandbox.api.setRandom=value=>testMath.random=()=>value;
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

test('charges require a full segment, spend one, and never fall back to a normal spell',()=>{
  const {game,keys}=world();keys.add('e');game.energy=2;game.castCharged();assert.equal(game.spells.length,0);assert.equal(game.areaAttacks.length,0);assert.equal(game.energy,2);
  game.energy=9;game.castCharged();assert.equal(game.energy,6);assert.equal(game.areaAttacks[0].element,'fire');
  game.castCharged();assert.equal(game.energy,6);game.player.cooldown=0;game.state='paused';game.castCharged();assert.equal(game.energy,6);
  game.state='playing';keys.clear();game.cast();assert.equal(game.spells.length,1);assert.equal(game.energy,6);
});
test('energy only drops on some defeats and is collected up to three charges',()=>{
  const {game,Monster,EnergyOrb,setRandom}=world();setRandom(.8);new Monster(100,100,'water').defeat();assert.equal(game.energyDrops.length,0);
  setRandom(.1);const m=new Monster(100,100,'fire');m.defeat();m.defeat();assert.equal(game.energyDrops.length,1);assert.equal(game.energy,0);
  const orb=new EnergyOrb(game.player.x,game.player.y);game.energy=8;orb.update(0);orb.update(0);assert.equal(game.energy,9);
  const excess=new EnergyOrb(game.player.x,game.player.y);excess.update(0);assert.equal(excess.dead,false);assert.equal(game.energy,9);
  game.energy=6;excess.update(0);assert.equal(game.energy,7);
  game.energy=0;game.monsters=[];game.energyDrops=[];game.update(.1);assert.equal(game.energy,0);
  const tame=new Monster(100,100,'grass');game.tryTame(tame);assert.equal(game.energyDrops.length,0);
  game.reset();assert.equal(game.energy,0);assert.equal(game.energyDrops.length,0);
});
test('area attacks hit multiple enemies once, obey range and existing elemental defenses',()=>{
  const {game,Monster,AreaAttack,center}=world();const p=center(game.player);
  const a=new Monster(p.x+30,p.y,'water'),b=new Monster(p.x-50,p.y,'water'),far=new Monster(p.x+300,p.y,'water');game.monsters=[a,b,far];
  const pulse=new AreaAttack(p,'fire',170,20);pulse.update(.4);pulse.update(.1);assert.equal(a.health,60);assert.equal(b.health,60);assert.equal(far.health,80);
  const bush=new Monster(p.x,p.y,'grass');bush.burrowState='underground';const bird=new Monster(p.x,p.y,'fire');bird.dashState='dashing';game.monsters=[bush,bird];
  new AreaAttack(p,'fire',170,20).update(.4);assert.equal(bush.health,80);assert.equal(bird.health,80);
  new AreaAttack(p,'grass',170,20).update(.4);assert.equal(bush.health,60);
  new AreaAttack(p,'water',170,20).update(.4);assert.equal(bird.dashState,'recovery');assert.equal(bird.health,48);
});
test('Ally command costs one charge for the ready team, triggers each special, and never hurts the mage',()=>{
  const {game,Monster,Ally}=world();game.player.selectedSkill=3;game.energy=6;assert.equal(game.castCharged(),false);assert.equal(game.energy,6);
  game.allies=['fire','water','grass'].map(t=>new Ally(new Monster(100,100,t)));
  assert.equal(game.castCharged(),false);assert.equal(game.energy,6);
  const target=new Monster(190,100,'water');game.monsters=[target];assert.equal(game.castCharged(),true);assert.equal(game.energy,3);
  assert.equal(game.allies[0].special.kind,'fire');assert.equal(game.allies[1].special.kind,'rest');assert.equal(game.allies[2].special.kind,'grass');
  game.player.cooldown=0;assert.equal(game.castCharged(),false);assert.equal(game.energy,3);
  game.allies.forEach(a=>a.update(1));game.areaAttacks.forEach(a=>a.update(.4));assert.equal(game.player.health,120);assert.ok(target.health<80);
  assert.equal(game.allies[0].dashState,'ready');assert.equal(game.allies[2].burrowState,'surface');
});
test('each charged spell has the selected element; pause freezes effects and energy',()=>{
  const {game,keys}=world();keys.add('e');
  for(let i=0;i<3;i++){game.player.selectedSkill=i;game.player.cooldown=0;game.energy=3;game.castCharged();assert.equal(game.areaAttacks.at(-1).element,['fire','water','grass'][i]);}
  const effect=game.areaAttacks[0];game.state='paused';game.update(1);assert.equal(effect.age,0);assert.equal(game.energy,0);
});

test('tap releases a normal spell; holding fires exactly one charged move without E',()=>{
  const {game,events}=world();const down=(key,repeat=false)=>events.keydown({key,repeat,preventDefault(){}});const up=key=>events.keyup({key});
  game.energy=9;down('d');assert.equal(game.spells.length,0);game.update(.1);up('d');assert.equal(game.spells.length,1);assert.equal(game.energy,9);
  game.player.cooldown=0;down('s');game.update(.25);assert.equal(game.energy,9);down('s',true);game.update(.25);assert.equal(game.energy,6);assert.equal(game.areaAttacks[0].element,'grass');
  game.update(.5);game.update(.5);up('s');assert.equal(game.energy,6);assert.equal(game.spells.length,0);
});
test('unfunded holds do not cast or repeat, and pausing cancels pending taps',()=>{
  const {game,events}=world();const down=key=>events.keydown({key,repeat:false,preventDefault(){}});
  down('f');game.update(.51);events.keyup({key:'f'});assert.equal(game.spells.length,0);assert.equal(game.areaAttacks.length,0);
  down('d');down('Escape');events.keyup({key:'d'});assert.equal(game.state,'paused');assert.equal(game.spells.length,0);
  down('Escape');game.update(.6);assert.equal(game.areaAttacks.length,0);
});
