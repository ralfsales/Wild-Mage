const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const png='data:image/png;base64,dGVzdA==';
function setup(stored=null,blocked=false){
 const elements={},events={},writes=[];
 const el=id=>elements[id]??=( {textContent:'',src:'',open:false,events:{},contentWindow:{postMessage(){}},getAttribute(k){return this[k];},showModal(){this.open=true;},close(){this.open=false;},focus(){},addEventListener(k,fn){this.events[k]=fn;}} );
 const game={state:'start',starts:0,start(){this.starts++;this.state='playing';}};
 const sandbox={window:{addEventListener(k,fn){events[k]=fn;}},document:{getElementById:el,activeElement:el('opener')},location:{origin:'http://localhost'},game,clearInput(){},setPaused(){game.state='paused';},localStorage:{getItem(){return stored;},setItem(k,v){if(blocked)throw Error('denied');writes.push(v);}},Image:class{naturalWidth=128;naturalHeight=256;set src(v){queueMicrotask(()=>this.onload());}}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/../wizard-player.js','utf8'),sandbox);
 return {...sandbox,elements,events,writes,send:async(data,source=el('wizardFrame').contentWindow,origin='http://localhost')=>events.message({data,source,origin})};
}
test('first adventure opens creator; apply starts with the chosen image and stores it',async()=>{
 const w=setup();await w.window.beginWithMage();assert.equal(w.game.starts,0);assert.equal(w.elements.wizardDialog.open,true);
 await w.send({type:'wild-mage:apply',appearance:{skin:'dark'},sprite:png});assert.equal(w.game.starts,1);assert.equal(w.window.MageAvatar.appearance.skin,'dark');assert.ok(w.window.MageAvatar.sprite);assert.equal(w.elements.wizardDialog.open,false);assert.equal(JSON.parse(w.writes[0]).appearance.skin,'dark');
});
test('pause editing and cancel preserve the active run and saved appearance',async()=>{
 const w=setup(JSON.stringify({version:1,sprite:png,appearance:{hair:'dreads'}}));await w.window.MageAvatar.ready;w.game.state='playing';await w.window.openMageCreator();
 assert.equal(w.game.state,'paused');await w.send({type:'wild-mage:cancel'});assert.equal(w.game.state,'paused');assert.equal(w.game.starts,0);assert.equal(w.window.MageAvatar.appearance.hair,'dreads');
 await w.window.openMageCreator();await w.send({type:'wild-mage:apply',sprite:png,appearance:{hair:'bob'}});assert.equal(w.game.state,'paused');assert.equal(w.game.starts,0);assert.equal(w.window.MageAvatar.appearance.hair,'bob');
});
test('saved sprite reloads and starts directly; corrupt saves reopen the creator',async()=>{
 const w=setup(JSON.stringify({version:1,sprite:png,appearance:{skin:'medium'}}));await w.window.beginWithMage();assert.equal(w.game.starts,1);assert.equal(w.window.MageAvatar.appearance.skin,'medium');
 const broken=setup('{broken');await broken.window.beginWithMage();assert.equal(broken.game.starts,0);assert.equal(broken.elements.wizardDialog.open,true);
});
test('unrelated frames, origins and invalid images cannot change the playable wizard',async()=>{
 const w=setup();await w.window.openMageCreator();const msg={type:'wild-mage:apply',sprite:png,appearance:{}};
 await w.send(msg,{});await w.send(msg,w.elements.wizardFrame.contentWindow,'https://unrelated.example');await w.send({...msg,sprite:'https://unrelated.example/image.png'});assert.equal(w.window.MageAvatar.sprite,null);assert.equal(w.writes.length,0);
});
test('storage failure still applies the wizard for the current session',async()=>{
 const w=setup(null,true);await w.window.openMageCreator();await w.send({type:'wild-mage:apply',sprite:png,appearance:{}});assert.ok(w.window.MageAvatar.sprite);assert.match(w.elements.wizardNotice.textContent,/session/);
});
