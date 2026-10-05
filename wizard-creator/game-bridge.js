(() => {
  const saveButton=document.getElementById('useWizard');
  const status=document.getElementById('exportStatus');
  const defaults={...state};
  const options={skin:Object.keys(P.head),clothing:Object.keys(P.clothing),eyes:Object.keys(P.eyes),eyeColor:EYE_COLORS,mouth:Object.keys(P.mouth),mouthColor:['skin','red','plum'],hair:Object.keys(P.hair),hairColor:Object.keys(HAIR_FILTERS)};
  function restore(value){
    Object.assign(state,defaults);
    if(value && typeof value==='object')for(const [key,values] of Object.entries(options))if(values.includes(value[key]))state[key]=value[key];
    state.freckles=value?.freckles===true;render();
  }
  function send(type,extra={}){if(parent!==window)parent.postMessage({type,...extra},location.origin==='null'?'*':location.origin);}
  window.addEventListener('message',event=>{
    if(event.source!==parent || event.origin!==location.origin)return;
    if(event.data?.type==='wild-mage:edit')restore(event.data.appearance);
  });
  async function composite(appearance){
    const hair=appearance.hair, long=LONG_HAIR.has(hair);
    const hairLayer={src:P.hair[hair],position:FIXED.hair[hair],filter:HAIR_FILTERS[appearance.hairColor]};
    const layers=[{src:P.head[appearance.skin],position:{x:0,y:0,s:100}},long?hairLayer:null,
      {src:P.eyes[appearance.eyes][appearance.eyeColor],position:FIXED.eyes[appearance.eyes]},
      appearance.freckles?{src:P.freckles,position:FIXED.freckles}:null,
      {src:P.mouth[appearance.mouth][appearance.mouthColor==='skin'?appearance.skin:appearance.mouthColor],position:FIXED.mouth[appearance.mouth]},
      long?null:hairLayer,{src:P.clothing[appearance.clothing],position:FIXED.clothing}].filter(Boolean);
    const images=await Promise.all(layers.map(layer=>new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve({...layer,img});img.onerror=()=>reject(Error('An artwork layer could not load. Please try again.'));img.src=layer.src;
    })));
    const sheet=document.createElement('canvas');sheet.width=1120;sheet.height=1120;const ctx=sheet.getContext('2d');
    for(const {img,position:p,filter} of images){
      const fit=560/Math.max(img.naturalWidth,img.naturalHeight),w=img.naturalWidth*fit,h=img.naturalHeight*fit;
      ctx.save();ctx.translate(560+p.x,560+p.y);ctx.scale(p.s/100,p.s/100);ctx.filter=filter||'none';ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
    }
    const rgba=ctx.getImageData(0,0,1120,1120).data;let left=1120,top=1120,right=0,bottom=0;
    for(let y=0;y<1120;y++)for(let x=0;x<1120;x++)if(rgba[(y*1120+x)*4+3]>8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    if(right<=left || bottom<=top)throw Error('The wizard could not be rendered. Please try again.');
    const w=right-left+1,h=bottom-top+1;const output=document.createElement('canvas');output.height=256;output.width=Math.ceil(256*w/h);const out=output.getContext('2d');out.imageSmoothingQuality='high';out.drawImage(sheet,left,top,w,h,0,0,output.width,256);
    return output.toDataURL('image/png');
  }
  saveButton.onclick=async()=>{
    if(saveButton.disabled)return;saveButton.disabled=true;status.textContent='Preparing your wizard…';
    try{const appearance={...state};const sprite=await composite(appearance);send('wild-mage:apply',{appearance,sprite});status.textContent='Your wizard is ready.';}
    catch(error){status.textContent=error.message;}finally{saveButton.disabled=false;}
  };
  document.getElementById('cancelWizard').onclick=()=>send('wild-mage:cancel');
  window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();send('wild-mage:cancel');}});
  send('wild-mage:ready');
})();
