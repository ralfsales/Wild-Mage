const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function world() {
  const elements = {}, events = {}, timers = [];
  const context = new Proxy({}, {get:(o,k)=>o[k] || (String(k).includes('Gradient') ? ()=>({addColorStop(){}}) : ()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const element = id => elements[id] ||= {width:960,height:640,events:{},contentWindow:{postMessage(){}},getContext:()=>context,querySelector:()=>null,getAttribute(k){return this[k];},classList:{add(){},remove(){},toggle(){}},addEventListener(k,fn){(this.events[k] ||= []).push(fn);},setAttribute(){},focus(){},showModal(){},close(){}};
  const sandbox = {console,Math,document:{getElementById:element,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(k,fn){(events[k] ||= []).push(fn);}},location:{origin:'http://localhost'},localStorage:{getItem:()=>null,setItem(){}},Image:class{},setTimeout(fn){timers.push(fn);},requestAnimationFrame(){},performance:{now:()=>0}};
  vm.createContext(sandbox);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for(const [,src] of html.matchAll(/<script src="([^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',src),'utf8'),sandbox,{filename:src});
  vm.runInContext('this.api={game,Monster,Ally,Pickup,Coin,EnergyOrb,center};',sandbox);
  const {game}=sandbox.api; game.state='playing';game.obstacles=[];game.spawnTimer=100;game.slotSpawnTimer=100;game.potionTimer=100;
  return {...sandbox.api,sandbox,elements,events,timers};
}
test('all shipped scripts load together and render all levels and active buffs',()=>{
  const {game}=world();game.buffs.ace=20;game.buffs.fire=20;
  for(const level of [1,2,3]){game.level=level;game.update(.016);game.draw();}
});
test('allies close to melee distance and damage a stationary foe',()=>{
  const {game,Monster,Ally}=world();const foe=new Monster(200,200,'grass');game.monsters=[foe];
  const ally=new Ally(new Monster(100,200,'fire'));game.allies=[ally];
  for(let i=0;i<180;i++)ally.update(1/60);
  assert.ok(foe.health<80,'ally must reach its target instead of stopping outside contact');
});
test('fatal damage stops the frame before coins or attack upgrades can be collected',()=>{
  const {game,Pickup,Coin,Monster}=world();const p=game.player;
  game.coins=[new Coin(p.x,p.y,1)];game.pickups=[new Pickup(p.x,p.y,'upgrade','fire')];
  const foe=new Monster(p.x,p.y,'water');foe.update=()=>p.takeDamage(999,'water');
  game.monsters=[foe];game.update(.016);
  assert.equal(game.state,'gameover');assert.equal(p.coins,0);assert.equal(game.buffs.upgrade,0);
});
test('Ace boosts an advantageous attack instead of weakening it',()=>{
  const {Monster}=world();const normal=new Monster(200,200,'grass'),ace=new Monster(200,200,'grass');
  normal.takeDamage(20,'fire');ace.takeDamage(20,'fire',true);
  assert.ok(ace.health<normal.health,'Ace must not reduce elemental advantage damage');
});
test('invalid creator apply cannot start a run through another listener',async()=>{
  const w=world();w.game.state='start';await w.sandbox.window.openMageCreator(true);
  for(const listener of w.events.message)await listener({source:w.elements.wizardFrame.contentWindow,origin:'http://localhost',data:{type:'wild-mage:apply',sprite:'invalid'}});
  for(const timer of w.timers)timer();assert.equal(w.game.state,'start');
});
test('one orb powers a charge; full inventory leaves an orb on the field',()=>{
  const {game,EnergyOrb}=world();game.energy=1;game.player.selectedSkill=0;
  assert.equal(game.castCharged(),true);assert.equal(game.energy,0);assert.equal(game.areaAttacks.length,1);
  game.energy=5;const orb=new EnergyOrb(game.player.x,game.player.y);orb.update(.01);assert.ok(!orb.dead);assert.equal(game.energy,5);
});
