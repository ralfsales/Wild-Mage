// Production hair layer: external aligned SVG assets replace procedural hair drawing.
// Every sprite uses the same 320x400 coordinate system as the character preview.
const CC_HAIR_SPRITES={
  moicano:'assets/hair/moicano.svg',
  curlyShort:'assets/hair/curly-short.svg',
  coil:'assets/hair/coil.svg',
  militar:'assets/hair/militar.svg',
  sidePart:'assets/hair/side-part.svg',
  chanel:'assets/hair/chanel.svg',
  straightLong:'assets/hair/straight-long.svg',
  curlyLong:'assets/hair/curly-long.svg',
  ponytail:'assets/hair/ponytail.svg',
  dreads:'assets/hair/dreads.svg',
  blackPower:'assets/hair/black-power.svg'
};
let ccHairMaskId=0;

function ccDrawHairSprite(g,state){
  if(state.hair.style==='bald')return;
  const href=CC_HAIR_SPRITES[state.hair.style];
  if(!href)return;
  const color=CC_PALETTES.hair[state.hair.color];
  const id='hair-mask-'+(++ccHairMaskId);
  const defs=add(g,'defs',{});
  const mask=add(defs,'mask',{id,maskUnits:'userSpaceOnUse',x:0,y:0,width:320,height:400});
  const maskImage=add(mask,'image',{href,x:0,y:0,width:320,height:400,preserveAspectRatio:'none'});
  maskImage.setAttribute('crossorigin','anonymous');
  add(g,'rect',{x:0,y:0,width:320,height:400,fill:color,mask:`url(#${id})`,stroke:'none'});
  const shadeLayer=add(g,'image',{href,x:0,y:0,width:320,height:400,preserveAspectRatio:'none',opacity:.32,style:'mix-blend-mode:multiply'});
  shadeLayer.setAttribute('crossorigin','anonymous');
}

// sprites.js declares drawHair as a global function. Replace only that layer.
drawHair=function(g,state){ccDrawHairSprite(g,state)};
