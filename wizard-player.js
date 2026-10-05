(() => {
  const KEY='wild-mage:playable-wizard:v1';
  const dialog=document.getElementById('wizardDialog'),frame=document.getElementById('wizardFrame'),notice=document.getElementById('wizardNotice');
  let saved=null,mode='edit',opener=null,applying=false;
  const avatar=window.MageAvatar={sprite:null,appearance:null,editing:false};
  function validSprite(value){return typeof value==='string' && value.startsWith('data:image/png;base64,') && value.length<1500000;}
  function decode(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>img.naturalWidth<=1024&&img.naturalHeight<=1024?resolve(img):reject(Error('Invalid wizard image.'));img.onerror=()=>reject(Error('Your wizard image could not load.'));img.src=src;});}
  avatar.ready=(async()=>{
    try{const data=JSON.parse(localStorage.getItem(KEY));if(data?.version===1 && validSprite(data.sprite)){avatar.sprite=await decode(data.sprite);avatar.appearance=data.appearance;saved=data;}}
    catch{notice.textContent='Create a wizard to save a new appearance.';}
  })();
  function sendAppearance(){frame.contentWindow.postMessage({type:'wild-mage:edit',appearance:avatar.appearance},location.origin==='null'?'*':location.origin);}
  function close(){avatar.editing=false;dialog.close();clearInput();opener?.focus({preventScroll:true});}
  window.openMageCreator=async(startAfter=false)=>{
    await avatar.ready;if(avatar.editing)return;
    mode=startAfter?'start':'edit';opener=document.activeElement;
    if(game.state==='playing')setPaused(true);clearInput();avatar.editing=true;dialog.showModal();
    if(!frame.getAttribute('src'))frame.src='wizard-creator/preview.html';else sendAppearance();
  };
  window.beginWithMage=async()=>{await avatar.ready;if(saved)game.start();else window.openMageCreator(true);};
  window.addEventListener('message',async event=>{
    if(event.source!==frame.contentWindow || event.origin!==location.origin || !avatar.editing)return;
    const data=event.data;
    if(data?.type==='wild-mage:ready'){sendAppearance();return;}
    if(data?.type==='wild-mage:cancel' && !applying){close();return;}
    if(data?.type!=='wild-mage:apply' || applying || !validSprite(data.sprite))return;
    applying=true;
    try{
      const sprite=await decode(data.sprite);avatar.sprite=sprite;avatar.appearance=data.appearance;
      saved={version:1,appearance:data.appearance,sprite:data.sprite};
      try{localStorage.setItem(KEY,JSON.stringify(saved));notice.textContent='Wizard saved. You can change your appearance from the pause menu.';}
      catch{notice.textContent='Wizard applied for this session. Browser storage is unavailable.';}
      close();if(mode==='start')game.start();
    }catch(error){notice.textContent=error.message;}
    finally{applying=false;}
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(!applying)close();});
  document.getElementById('closeWizard').addEventListener('click',()=>{if(!applying)close();});
  for(const id of ['customizeStart','customizePaused'])document.getElementById(id).addEventListener('click',()=>window.openMageCreator(false));
})();
