// Production eye layer: external aligned SVG assets replace the procedural eye shapes.
// Each shape uses a neutral base sprite plus a separate iris mask so colour can change dynamically.
const CC_EYE_SPRITES={
  round:{base:'assets/eyes/round-base.svg',iris:'assets/eyes/round-iris.svg'},
  mid:{base:'assets/eyes/mid-base.svg',iris:'assets/eyes/mid-iris.svg'},
  narrow:{base:'assets/eyes/narrow-base.svg',iris:'assets/eyes/narrow-iris.svg'}
};
let ccEyeMaskId=0;

function ccDrawEyesSprite(g,state){
  const sprite=CC_EYE_SPRITES[state.eyes.shape]||CC_EYE_SPRITES.mid;
  const irisColor=CC_PALETTES.eyes[state.eyes.color];
  const id='eye-mask-'+(++ccEyeMaskId);

  const base=add(g,'image',{href:sprite.base,x:0,y:0,width:320,height:400,preserveAspectRatio:'none'});
  base.setAttribute('crossorigin','anonymous');

  const defs=add(g,'defs',{});
  const mask=add(defs,'mask',{id,maskUnits:'userSpaceOnUse',x:0,y:0,width:320,height:400});
  const maskImage=add(mask,'image',{href:sprite.iris,x:0,y:0,width:320,height:400,preserveAspectRatio:'none'});
  maskImage.setAttribute('crossorigin','anonymous');
  add(g,'rect',{x:0,y:0,width:320,height:400,fill:irisColor,mask:`url(#${id})`,stroke:'none'});

  const config={
    round:{left:[137,116,3.6,8],right:[183,116,3.6,8],highlightY:108},
    mid:{left:[137,116,3.2,6],right:[183,116,3.2,6],highlightY:110},
    narrow:{left:[136,117,3.5,3.5],right:[184,117,3.5,3.5],highlightY:114}
  }[state.eyes.shape]||{left:[137,116,3.2,6],right:[183,116,3.2,6],highlightY:110};

  [config.left,config.right].forEach(([cx,cy,rx,ry])=>{
    add(g,'ellipse',{cx,cy,rx,ry,fill:'#111',stroke:'none'});
    add(g,'circle',{cx:cx-2.2,cy:config.highlightY,r:2.1,fill:'#fff',stroke:'none'});
  });
}

// sprites.js declares drawEyes globally. Replace only that character layer.
drawEyes=function(g,state){ccDrawEyesSprite(g,state)};
