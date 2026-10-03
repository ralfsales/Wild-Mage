// Wild Mage layered character customizer.
// The approved green-hooded mage is the default sample; every visible part is data-driven.
const MAGE_STORAGE_KEY = "wildMageAppearanceV1";

const MAGE_OPTIONS = {
  hair: {
    icon: "✦", label: "Hair",
    styles: [
      ["shortWavy", "Short wavy", "Soft, short waves"], ["shortStraight", "Short straight", "Clean cropped shape"],
      ["sidePart", "Side part", "Neat swept fringe"], ["messyCurl", "Messy curls", "Loose textured curls"],
      ["mediumWavy", "Medium wavy", "Longer soft waves"], ["shaggy", "Shaggy", "Layered adventurer cut"],
      ["slickBack", "Slick back", "Open forehead"], ["tiedBack", "Tied back", "Small traveller tie"]
    ],
    colors: [
      ["#171717","Black"],["#30231d","Dark brown"],["#5a3a27","Brown"],["#875a38","Light brown"],
      ["#b4874d","Dark blond"],["#dbc37c","Blond"],["#8a4637","Auburn"],["#b8bcc0","Silver"]
    ]
  },
  staff: {
    icon: "⌁", label: "Staff",
    styles: [
      ["forkedWood","Forked wood","The original wildwood staff"],["twistedRoot","Twisted root","Gnarled forest growth"],
      ["crystalTop","Crystal","Elemental crystal crown"],["moonCrest","Moon crest","A crescent-shaped focus"],
      ["antlerStaff","Antler","Branching woodland crown"],["orbStaff","Orb","Classic arcane focus"],
      ["runeStaff","Rune","Carved ancient symbol"],["vineStaff","Vine","Living wrapped vines"]
    ],
    colors: [["#3c281a","Dark oak"],["#604329","Oak"],["#815b35","Warm wood"],["#382c27","Walnut"],["#667078","Iron"],["#9a8a70","Bonewood"],["#415d45","Mosswood"],["#65538c","Arcane violet"]]
  },
  hat: {
    icon: "⌃", label: "Hat / Hood",
    styles: [
      ["hoodClassic","Classic hood","The main sample hood"],["hoodWide","Wide hood","Broader face framing"],
      ["pointedHat","Pointed hat","Traditional wild mage"],["shortHood","Short hood","Compact traveller hood"],
      ["druidCowl","Druid cowl","Heavy woodland folds"],["capeHood","Cape hood","Long shoulder drape"],
      ["splitMantle","Split mantle","Two layered collar points"],["highCollar","High collar","Hood down, collar raised"]
    ],
    colors: [["#315842","Forest green"],["#4c3d72","Arcane purple"],["#713f3c","Crimson"],["#34546b","Deep blue"],["#6b6036","Old gold"],["#36383a","Charcoal"],["#72828a","Storm gray"],["#78543a","Leather brown"]]
  },
  eyes: {
    icon: "◉", label: "Eyes",
    styles: [
      ["soft","Soft","Friendly rounded eyes"],["focused","Focused","Narrow determined gaze"],
      ["sleepy","Sleepy","Relaxed half-lids"],["heroic","Heroic","Raised confident brows"],
      ["cheerful","Cheerful","Bright curved eyes"],["stern","Stern","Sharper brow angle"],
      ["wide","Wide","Large curious eyes"],["mystic","Mystic","Small magical pupils"]
    ],
    colors: [["#3a281e","Brown"],["#66502e","Hazel"],["#45657d","Blue gray"],["#3f7159","Green"],["#6d7377","Gray"],["#1b1d20","Near black"],["#70527f","Violet"],["#9a632e","Amber"]]
  },
  mouth: {
    icon: "⌣", label: "Mouth",
    styles: [
      ["neutral","Neutral","Calm expression"],["softSmile","Soft smile","Friendly and subtle"],
      ["serious","Serious","Straight focused mouth"],["smirk","Smirk","A little mischievous"],
      ["open","Open","Small speaking mouth"],["grin","Grin","Big adventurer smile"],
      ["worried","Worried","Slight uncertainty"],["determined","Determined","Firm heroic expression"]
    ],
    colors: [["#714d49","Natural"],["#855953","Rose"],["#5d3d3a","Muted"],["#9a6a63","Warm"],["#aa7770","Light rose"],["#503331","Deep"],["#7c5751","Clay"],["#3f2b2a","Dark"]]
  },
  coat: {
    icon: "♜", label: "Coat",
    styles: [
      ["trimmedCloak","Trimmed cloak","The main sample coat"],["longRobe","Long robe","Traditional mage robes"],
      ["splitCoat","Split coat","Fast-moving front panels"],["shortCape","Short cape","Lightweight adventurer"],
      ["druidWrap","Druid wrap","Organic layered cloth"],["traveller","Traveller coat","Practical pockets and folds"],
      ["armored","Armored robe","Reinforced shoulder pieces"],["layered","Layered mantle","Rich overlapping panels"]
    ],
    colors: [["#315842","Forest green"],["#514078","Purple"],["#314f67","Navy"],["#70403f","Burgundy"],["#70633a","Olive gold"],["#373a39","Charcoal"],["#74777e","Ash gray"],["#7a563c","Earth brown"]]
  },
  boots: {
    icon: "◒", label: "Boots",
    styles: [
      ["wrapped","Wrapped leather","The sample boots"],["traveller","Traveller","Simple sturdy boots"],
      ["heavy","Heavy","Chunkier protective sole"],["pointed","Pointed","Classic mage toe"],
      ["short","Short","Low ankle boots"],["cuffed","Cuffed","Wide folded top"],
      ["ranger","Ranger","Strapped field boots"],["mage","Mage","Decorative magical trim"]
    ],
    colors: [["#38271e","Dark leather"],["#553823","Brown"],["#785137","Warm leather"],["#292b2d","Black"],["#55595b","Gray"],["#4a382e","Umber"],["#654438","Red brown"],["#8a6748","Tan"]]
  },
  skin: {
    icon: "●", label: "Skin",
    styles: [
      ["soft","Soft","Rounded chibi face"],["angular","Angular","A slightly sharper jaw"],
      ["round","Round","Fuller cheek shape"],["long","Long","A slightly longer face"]
    ],
    colors: [["#f3d7c4","Porcelain"],["#ecc6ab","Light warm"],["#dcac88","Warm beige"],["#c58d68","Golden tan"],["#a96f4f","Medium brown"],["#8b593e","Warm brown"],["#6d4330","Deep brown"],["#4c3025","Deep umber"]]
  }
};

const DEFAULT_MAGE_APPEARANCE = {
  hair: { style: 0, color: 1 }, staff: { style: 0, color: 1 }, hat: { style: 0, color: 0 },
  eyes: { style: 0, color: 0 }, mouth: { style: 1, color: 0 }, coat: { style: 0, color: 0 },
  boots: { style: 0, color: 1 }, skin: { style: 1, color: 1 }
};

function cloneDefaultMage() { return JSON.parse(JSON.stringify(DEFAULT_MAGE_APPEARANCE)); }
function loadMageAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem(MAGE_STORAGE_KEY));
    const appearance = cloneDefaultMage();
    if (!saved) return appearance;
    Object.keys(appearance).forEach(part => {
      if (saved[part]) {
        if (/^#[0-9a-f]{6}$/i.test(saved[part].customColor)) appearance[part].customColor=saved[part].customColor;
        const maxStyle = MAGE_OPTIONS[part].styles.length - 1;
        const maxColor = MAGE_OPTIONS[part].colors.length - 1;
        appearance[part].style = Math.max(0, Math.min(maxStyle, Math.floor(Number(saved[part].style)) || 0));
        appearance[part].color = Math.max(0, Math.min(maxColor, Math.floor(Number(saved[part].color)) || 0));
      }
    });
    return appearance;
  } catch { return cloneDefaultMage(); }
}
let mageAppearance = loadMageAppearance();

function appearanceColor(appearance,part){return appearance[part].customColor || MAGE_OPTIONS[part].colors[appearance[part].color][0];}
function mageColor(part) { return MAGE_OPTIONS[part].colors[mageAppearance[part].color][0]; }
function darker(hex, factor=.72) {
  const n=parseInt(hex.slice(1),16), r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  return `rgb(${Math.round(r*factor)},${Math.round(g*factor)},${Math.round(b*factor)})`;
}
function lighter(hex, amount=38) {
  const n=parseInt(hex.slice(1),16), r=Math.min(255,((n>>16)&255)+amount),g=Math.min(255,((n>>8)&255)+amount),b=Math.min(255,(n&255)+amount);
  return `rgb(${r},${g},${b})`;
}
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(g,pts,c){g.fillStyle=c;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();}
function ell(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
function stroke(g,pts,c,w=1){g.strokeStyle=c;g.lineWidth=w;g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();}

function drawEditableMage(g, x, y, facing={x:1,y:0}, time=0, accent="#d9c27c", appearance=mageAppearance, scale=1) {
  g.save(); g.translate(x,y); g.scale(scale,scale);
  const bob=Math.round(Math.abs(Math.sin(time))*1), step=Math.round(Math.sin(time)*1.5);
  const skin=appearanceColor(appearance,'skin'), hair=appearanceColor(appearance,'hair');
  const coat=appearanceColor(appearance,'coat'), hat=appearanceColor(appearance,'hat');
  const boots=appearanceColor(appearance,'boots'), eye=appearanceColor(appearance,'eyes');
  const mouth=appearanceColor(appearance,'mouth'), wood=appearanceColor(appearance,'staff');

  // Shadow + legs
  ell(g,15,35,18,4,"#0b1713aa");
  drawBootLayer(g,appearance.boots.style,boots,step);
  rect(g,8,24+step,7,8,"#272322"); rect(g,18,24-step,7,8,"#272322");
  drawCoatLayer(g,appearance.coat.style,coat,bob);
  // belt and pouch
  rect(g,7,22+bob,21,3,"#6d4a2c"); rect(g,15,21+bob,5,5,"#b78a50"); rect(g,16,22+bob,3,3,"#52351f");
  rect(g,24,24+bob,6,8,"#684429"); rect(g,25,25+bob,4,2,"#9c6d3d");
  // neck + face
  rect(g,13,10+bob,8,6,darker(skin,.88));
  drawFaceLayer(g,appearance.skin.style,skin,bob);
  drawEyesLayer(g,appearance.eyes.style,eye,bob);
  drawMouthLayer(g,appearance.mouth.style,mouth,bob);
  drawHairLayer(g,appearance.hair.style,hair,bob);
  drawHatLayer(g,appearance.hat.style,hat,bob);
  // cloak clasp
  ell(g,17,14+bob,2.5,2.5,"#c2a05f"); ell(g,17,14+bob,1.2,1.2,"#6e5633");
  drawStaffLayer(g,appearance.staff.style,wood,accent,facing,time);
  g.restore();
}

function drawFaceLayer(g,style,skin,bob){
  if(style===1) poly(g,[[9,6+bob],[12,2+bob],[22,2+bob],[26,7+bob],[24,14+bob],[18,18+bob],[12,15+bob],[9,10+bob]],skin);
  else if(style===2) ell(g,17,9+bob,9,9,skin);
  else if(style===3) { ell(g,17,8+bob,8,9.5,skin); rect(g,11,7+bob,12,7,skin); }
  else { ell(g,17,9+bob,8.5,8,skin); rect(g,10,8+bob,14,5,skin); }
  rect(g,8,8+bob,2,4,darker(skin,.92)); rect(g,24,8+bob,2,4,darker(skin,.92));
}
function drawEyesLayer(g,style,color,bob){
  let y=8+bob;
  const white="#f7f1df";
  if(style===2){rect(g,11,y,5,1,"#42352f");rect(g,19,y,5,1,"#42352f");rect(g,13,y+1,2,1,color);rect(g,20,y+1,2,1,color);return;}
  if(style===4){stroke(g,[[11,y+2],[13,y],[16,y+2]],"#44352e",1);stroke(g,[[19,y+2],[21,y],[24,y+2]],"#44352e",1);return;}
  const wide=style===6?4:3, tall=style===6?4:3;
  ell(g,13.5,y+1,wide,tall,white);ell(g,21,y+1,wide,tall,white);
  ell(g,14,y+1,style===7?1:1.6,style===7?2.2:1.7,color);ell(g,20.5,y+1,style===7?1:1.6,style===7?2.2:1.7,color);
  rect(g,13,y,1,1,"#ffffff");rect(g,20,y,1,1,"#ffffff");
  const brow="#392c27";
  if(style===1||style===5){stroke(g,[[10,y-3],[16,y-2]],brow,1.5);stroke(g,[[19,y-2],[25,y-3]],brow,1.5);}
  else if(style===3){stroke(g,[[10,y-2],[16,y-3]],brow,1.5);stroke(g,[[19,y-3],[25,y-2]],brow,1.5);}
  else {rect(g,10,y-3,6,1,brow);rect(g,19,y-3,6,1,brow);}
}
function drawMouthLayer(g,style,color,bob){
  const y=14+bob;
  if(style===0) rect(g,15,y,5,1,color);
  else if(style===1){stroke(g,[[14,y],[17,y+1],[21,y-1]],color,1);}
  else if(style===2) rect(g,14,y,7,1,darker(color,.7));
  else if(style===3) stroke(g,[[14,y],[17,y+1],[21,y]],color,1);
  else if(style===4) ell(g,17.5,y,2.5,1.7,darker(color,.7));
  else if(style===5){rect(g,14,y,7,2,"#f2e6d5");stroke(g,[[14,y+2],[21,y+2]],color,1);}
  else if(style===6) stroke(g,[[14,y+1],[17,y],[21,y+1]],color,1);
  else stroke(g,[[14,y+1],[17,y-1],[21,y+1]],darker(color,.7),1.2);
}
function drawHairLayer(g,style,color,bob){
  const d=darker(color,.7), l=lighter(color,22);
  if(style===0){rect(g,10,1+bob,14,4,color);rect(g,9,4+bob,4,5,color);rect(g,21,3+bob,4,5,d);rect(g,13,0+bob,4,3,l);rect(g,18,1+bob,3,2,d);}
  else if(style===1){poly(g,[[9,5+bob],[10,1+bob],[24,1+bob],[25,6+bob],[21,4+bob],[17,5+bob],[13,4+bob]],color);}
  else if(style===2){poly(g,[[9,5+bob],[10,1+bob],[24,1+bob],[25,4+bob],[18,3+bob],[15,7+bob],[12,6+bob]],color);rect(g,19,1+bob,5,2,l);}
  else if(style===3){ell(g,12,3+bob,4,3,color);ell(g,17,1+bob,4,3,l);ell(g,22,3+bob,4,3,color);ell(g,10,6+bob,3,3,d);ell(g,24,6+bob,3,3,d);}
  else if(style===4){rect(g,9,2+bob,16,5,color);rect(g,8,5+bob,5,9,d);rect(g,22,5+bob,4,9,color);rect(g,13,1+bob,4,3,l);}
  else if(style===5){poly(g,[[8,2+bob],[12,0+bob],[15,2+bob],[18,-1+bob],[21,2+bob],[25,0+bob],[26,8+bob],[22,6+bob],[20,10+bob],[15,6+bob],[11,9+bob]],color);}
  else if(style===6){poly(g,[[9,5+bob],[12,1+bob],[25,2+bob],[24,5+bob],[16,3+bob],[11,7+bob]],color);rect(g,21,0+bob,5,3,l);}
  else {rect(g,9,2+bob,16,5,color);rect(g,8,5+bob,4,8,d);rect(g,23,5+bob,4,8,d);ell(g,26,10+bob,3,3,color);}
}
function drawHatLayer(g,style,color,bob){
  const dark=darker(color,.68), light=lighter(color,26);
  if(style===7){poly(g,[[7,12+bob],[10,5+bob],[13,9+bob],[17,7+bob],[22,9+bob],[25,5+bob],[28,13+bob],[24,16+bob],[10,16+bob]],color);rect(g,9,12+bob,18,2,light);return;}
  if(style===2){poly(g,[[6,5+bob],[12,0+bob],[17,-12+bob],[21,-16+bob],[23,-9+bob],[21,-8+bob],[27,4+bob]],color);rect(g,5,4+bob,23,3,dark);rect(g,10,3+bob,14,2,light);return;}
  let left=6,right=28,top=-4;
  if(style===1){left=3;right=31;top=-5;} if(style===3){left=8;right=26;top=-1;}
  poly(g,[[left,7+bob],[left+3,0+bob],[12,top+bob],[21,top+bob],[right-2,1+bob],[right,8+bob],[25,15+bob],[22,12+bob],[12,12+bob],[9,15+bob]],dark);
  poly(g,[[left+2,6+bob],[left+5,1+bob],[13,top+2+bob],[21,top+2+bob],[right-4,2+bob],[right-2,7+bob],[24,12+bob],[21,9+bob],[13,9+bob],[10,12+bob]],color);
  if(style===4){rect(g,6,11+bob,22,5,color);rect(g,8,14+bob,18,3,dark);} 
  if(style===5){poly(g,[[7,11+bob],[2,23+bob],[11,20+bob],[17,24+bob],[24,20+bob],[32,23+bob],[27,11+bob]],dark);}
  if(style===6){poly(g,[[7,11+bob],[2,19+bob],[14,15+bob],[17,20+bob],[20,15+bob],[32,19+bob],[27,11+bob]],color);}
  rect(g,12,top+3+bob,7,2,light);
}
function drawCoatLayer(g,style,color,bob){
  const d=darker(color,.66), l=lighter(color,26), trim="#aeb5ad";
  if(style===3){poly(g,[[8,14+bob],[2,17+bob],[6,25+bob],[11,23+bob],[13,18+bob],[21,18+bob],[24,23+bob],[30,25+bob],[33,17+bob],[26,14+bob]],d);rect(g,10,16+bob,14,12,color);}
  else {poly(g,[[8,13+bob],[3,19+bob],[5,34+bob],[11,31+bob],[17,34+bob],[23,31+bob],[30,34+bob],[32,19+bob],[26,13+bob]],d);poly(g,[[10,14+bob],[6,19+bob],[8,31+bob],[14,28+bob],[17,33+bob],[20,28+bob],[27,31+bob],[29,19+bob],[24,14+bob]],color);}
  if(style===1){rect(g,9,17+bob,6,16,l);rect(g,20,17+bob,6,16,l);}
  if(style===2){poly(g,[[10,17+bob],[16,17+bob],[15,34+bob],[7,31+bob]],color);poly(g,[[19,17+bob],[25,17+bob],[28,31+bob],[20,34+bob]],l);}
  if(style===4){stroke(g,[[8,18+bob],[15,15+bob],[23,20+bob],[29,16+bob]],l,2);}
  if(style===5){rect(g,7,20+bob,5,5,d);rect(g,24,20+bob,5,5,d);}
  if(style===6){rect(g,5,15+bob,8,5,"#69736f");rect(g,22,15+bob,8,5,"#69736f");}
  if(style===7){poly(g,[[5,14+bob],[17,18+bob],[29,14+bob],[27,19+bob],[17,22+bob],[7,19+bob]],l);}
  rect(g,10,17+bob,2,12,trim);rect(g,23,17+bob,2,12,trim);
  // hands at sleeve ends
  ell(g,5,23+bob,3,3,appearanceColor(mageAppearance,'skin'));ell(g,29,23+bob,3,3,appearanceColor(mageAppearance,'skin'));
}
function drawBootLayer(g,style,color,step){
  const d=darker(color,.64),l=lighter(color,20), y=31;
  let h=5,w=10; if(style===2){h=7;w=11;} if(style===4){h=4;} if(style===5){h=6;}
  rect(g,5,y+step,w,h,color);rect(g,19,y-step,w,h,color);rect(g,4,y+h-1+step,w+2,2,d);rect(g,18,y+h-1-step,w+2,2,d);
  if(style===0||style===6){stroke(g,[[6,y+1+step],[13,y+4+step]],l,1);stroke(g,[[20,y+1-step],[27,y+4-step]],l,1);}
  if(style===3){poly(g,[[4,y+step],[13,y+step],[16,y+h+step],[4,y+h+step]],color);poly(g,[[18,y-step],[27,y-step],[30,y+h-step],[18,y+h-step]],color);}
  if(style===5){rect(g,4,y-2+step,w+2,2,l);rect(g,18,y-2-step,w+2,2,l);}
  if(style===7){rect(g,7,y+1+step,2,2,"#c3aa68");rect(g,21,y+1-step,2,2,"#c3aa68");}
}
function drawStaffLayer(g,style,color,accent,facing,time){
  const side=facing.x<0?-1:1, sx=side<0?-5:39, sway=Math.sin(time*.7)*.6, d=darker(color,.64),l=lighter(color,30);
  g.save();g.translate(sx,0);g.rotate(sway*.02*side);
  rect(g,-1,2,3,34,color);rect(g,0,3,1,31,l);
  if(style===0){poly(g,[[-1,4],[-7,-3],[-5,-11],[-2,-15],[0,-7],[3,-15],[7,-11],[6,-3],[2,4]],color);poly(g,[[-4,-4],[-3,-9],[-1,-12],[-1,-5],[1,-1]],l);}
  else if(style===1){stroke(g,[[0,4],[-4,-1],[2,-6],[-3,-10],[3,-15]],color,4);stroke(g,[[1,4],[-2,-1],[3,-6],[-2,-10],[4,-15]],l,1);}
  else if(style===2){poly(g,[[-5,-7],[0,-14],[5,-7],[0,-1]],accent);rect(g,-1,-9,2,5,"#fff4d9");}
  else if(style===3){g.strokeStyle=accent;g.lineWidth=3;g.beginPath();g.arc(1,-8,6,-1.1,1.1);g.stroke();ell(g,3,-8,2,2,"#f5e6b0");}
  else if(style===4){stroke(g,[[0,2],[-4,-5],[-8,-10]],color,3);stroke(g,[[0,2],[4,-5],[8,-10]],color,3);stroke(g,[[-4,-5],[-1,-13]],color,2);stroke(g,[[4,-5],[1,-13]],color,2);}
  else if(style===5){ell(g,0,-7,6,6,d);ell(g,0,-7,4,4,accent);ell(g,-1,-8,1,1,"#fff");}
  else if(style===6){poly(g,[[0,-15],[6,-6],[0,1],[-6,-6]],d);poly(g,[[0,-12],[3,-6],[0,-1],[-3,-6]],accent);}
  else {stroke(g,[[-1,5],[-5,0],[0,-4],[-4,-8],[1,-13]],"#558552",2);ell(g,-5,0,2,1,"#78ad69");ell(g,-4,-8,2,1,"#78ad69");}
  rect(g,-3,11,7,4,"#7b5836");g.restore();
}

// Replace the original fixed mage renderer while preserving all game mechanics.
const originalDrawMage = drawMage;
drawMage = function(x,y,facing,time,gem){ drawEditableMage(ctx,x,y,facing,time,gem,mageAppearance,1); };


let openMageCustomizer;
function mageCustomizerOpen(){return Boolean(document.getElementById('mageCustomizer')?.open);}
function initMageCustomizer(){
  const modal=document.getElementById('mageCustomizer'),preview=document.getElementById('magePreview'),pctx=preview.getContext('2d');
  const tabs=document.getElementById('partTabs'),swatches=document.getElementById('colourSwatches');
  const partOrder=['skin','hair','eyes','mouth','hat','coat','boots','staff'];
  let part='skin',frame=null,time=0,before=null,startsGame=false,returnFocus=null;
  function refresh(){
    const opt=MAGE_OPTIONS[part],state=mageAppearance[part];
    tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.part===part);b.setAttribute('aria-pressed',String(b.dataset.part===part));});
    document.getElementById('currentPartLabel').textContent=opt.label;
    document.getElementById('currentStyleName').textContent=opt.styles[state.style][1];
    document.getElementById('currentStyleHint').textContent=opt.styles[state.style][2];
    document.getElementById('styleCounter').textContent=(state.style+1)+' / '+opt.styles.length;
    document.getElementById('colourName').textContent=state.customColor?'Custom color':opt.colors[state.color][1];
    document.getElementById('customMageColor').value=appearanceColor(mageAppearance,part);
    document.getElementById('customMageColor').setAttribute('aria-label',opt.label+' custom color');
    swatches.replaceChildren();
    opt.colors.forEach(([hex,name],i)=>{const b=document.createElement('button');b.type='button';b.className='colour-swatch'+(!state.customColor&&i===state.color?' active':'');b.style.setProperty('--swatch',hex);b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(!state.customColor&&i===state.color));b.addEventListener('click',()=>{state.color=i;delete state.customColor;refresh();});swatches.append(b);});
  }
  function render(){time+=.035;pctx.clearRect(0,0,320,380);pctx.imageSmoothingEnabled=false;drawEditableMage(pctx,72,78,{x:1,y:0},time,'#e3c66e',mageAppearance,5.2);frame=requestAnimationFrame(render);}
  openMageCustomizer=function(start=false){
    if(game.state==='playing')setPaused(true);
    startsGame=start;before=JSON.parse(JSON.stringify(mageAppearance));returnFocus=document.activeElement;part='skin';keys.clear();
    document.getElementById('saveMage').textContent=start?'Save & begin':'Save mage';
    refresh();modal.showModal();render();tabs.querySelector('button').focus();
  };
  function close(save=false){
    if(save){try{localStorage.setItem(MAGE_STORAGE_KEY,JSON.stringify(mageAppearance));}catch{}}
    else mageAppearance=before;
    cancelAnimationFrame(frame);frame=null;modal.close();returnFocus?.focus();
    if(save&&startsGame)game.start();
  }
  partOrder.forEach(key=>{const b=document.createElement('button');b.type='button';b.className='part-tab';b.dataset.part=key;b.textContent=MAGE_OPTIONS[key].label;b.addEventListener('click',()=>{part=key;refresh();});tabs.append(b);});
  function shift(delta){const state=mageAppearance[part];state.style=(state.style+delta+MAGE_OPTIONS[part].styles.length)%MAGE_OPTIONS[part].styles.length;refresh();}
  document.getElementById('previousStyle').addEventListener('click',()=>shift(-1));
  document.getElementById('nextStyle').addEventListener('click',()=>shift(1));
  document.getElementById('customMageColor').addEventListener('input',e=>{mageAppearance[part].customColor=e.target.value;refresh();});
  ['customizeButton','startCustomizeButton','pauseCustomizeButton'].forEach(id=>document.getElementById(id).addEventListener('click',()=>openMageCustomizer(false)));
  document.getElementById('closeCustomizer').addEventListener('click',()=>close(false));
  document.getElementById('saveMage').addEventListener('click',()=>close(true));
  document.getElementById('randomizeMage').addEventListener('click',()=>{partOrder.forEach(k=>{mageAppearance[k]={style:Math.floor(Math.random()*MAGE_OPTIONS[k].styles.length),color:Math.floor(Math.random()*MAGE_OPTIONS[k].colors.length)};});refresh();});
  document.getElementById('resetMage').addEventListener('click',()=>{mageAppearance=cloneDefaultMage();refresh();});
  modal.addEventListener('cancel',e=>{e.preventDefault();close(false);});
  refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMageCustomizer);else initMageCustomizer();
