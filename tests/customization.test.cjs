const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(saved){const sandbox={localStorage:{getItem(){return saved;}},document:{readyState:'loading',addEventListener(){}},drawMage(){}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../customizer.js'),'utf8')+'\nthis.api={MAGE_OPTIONS,loadMageAppearance,drawEditableMage,appearanceColor};',sandbox);return sandbox.api;}
test('saved appearance validates fractional indices, invalid JSON, and custom colors',()=>{
 const api=setup('{"skin":{"style":1.5,"color":-4,"customColor":"#542f24"}}');const a=api.loadMageAppearance();assert.equal(a.skin.style,1);assert.equal(a.skin.color,0);assert.equal(api.appearanceColor(a,'skin'),'#542f24');assert.ok(setup('broken').loadMageAppearance().hat);
});
test('every existing shape and unrestricted custom color renders',()=>{
 const api=setup(null);const ctx=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const part of Object.keys(api.MAGE_OPTIONS))for(let i=0;i<api.MAGE_OPTIONS[part].styles.length;i++){const a=api.loadMageAppearance();a[part].style=i;a[part].customColor='#20d4b0';api.drawEditableMage(ctx,0,0,{x:1,y:0},0,'#abcdef',a);assert.equal(api.appearanceColor(a,part),'#20d4b0');}
});
