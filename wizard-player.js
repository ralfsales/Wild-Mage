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

// Taming-slot pickup: use the approved leash/collar sprite while preserving the existing pickup logic and hitbox.
(() => {
  if (typeof TameSlotItem === 'undefined') return;
  const originalDraw = TameSlotItem.prototype.draw;
  const leashSprite = new Image();
  leashSprite.src = 'data:image/webp;base64,UklGRuYJAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSIAEAAABoEVtmyFJ+v6IGKxt27Zt27Zt27Zt27Zm1ra9O+yKP/4/v4uszqrpudqzNxExAfiPXmKKYTSSiHoIo0sAxl9ms3VnBMLoETHxWT+THHnvDAijQ8SS35BF1fnTLAh9L2CJYWxZyeYtfjB23wth0h+Z3cjKvcVz0OcjzmOrMn5wR8vNfPgMzSSmFGMIMaUUpTuCif52K9Wn42JzFlce2kCSoMOQpAsRa7K4clsMwCAWrR7rRSKAyVfY+5ybH3n6yfuvPmm7RcYHEKWjhD2rbNWQyaS/XMRs/LRdAKbe/5l/2PiXR3afCohdYC58B5JwdO27NgETn/sPyZJzVlXNORvJvy+YBrGDiDVZlE8iJDmp9lEtYOGvyazmjU0z+cc2iM0CphhWZT6DEHE7s1YPAggy7W9smXfRMnkEYiMEPMUWPwgiY/7AojwAQMKF7PG6aW6vVnMvynUQGyXsyxb/nRTYhGrV8BkACAZVpWZsqmru7mpfTSLSJGA+N+OiIb1blcybAQgm/ofm7uQ/b9xw8gG773/i9W8MIVnzzNsQmwgGfscWt8fRVCtlTgEilqG5m/+yTX/0PtVm9wypzN2t+m1sSAMEPMOR3GtuK9biMYi19aju7vnT63Zc4YSnXrlh06nGAmSrP93cC78e2CyGO9jDBz5jyXwyRGlTtanY+98/vPj6T8OKu7tWjyGgacItzE565rsTiqC2Mtu4ZS1ZNSvber3FY5GaCKb+zIubZX44BQIAiIz5KVu1hlZUzWrmP84ioYHIRJ+zuHvhB1Mgom3AokOpWqxBQ7UfJ4GgYcRyVHcv/vGUiOg1YL5XSFou1oGpch8kNA1yU1XL1e7oj4YBss6D35Gs1NqYas5K8jRENA2Yg15XbiapCQKAsVa89MNMtmHbIfcvh4BOtKb+7JhBGkFiABBnu+Cn4m723vX3Xnv8hlMDAZ0s2OPmnrkGEjqWGAEs7FaMvy6HeojoMOFyttwL3xo3SGcApF+/CYZWxV6ohk/fv38M6DjKNlXxYh9PCEFXA7BdT6Et9Q5vR7+ALmDZqnjmA0jo8iSTfsTyr3lPD3cGIJ1ICm9Ti321aAhdCen8v/8coTxzhUEV1bafE0hRmkg/nEB15RKI6GbC+qxYKR8EFrqHRn98IgDSW4zYkeqZT0hCVyNWGKJmXvy0CJxRsnHQdbv2Q78okBAjcBiLF/4wo4TuIOJKqrsZl4myJNWV5MsTodeFH2OxYn/OgoDuBuw3sngxz34V4gT3sxSe9wMHnb3aBBhz1u0eMqqbcj0kdDdiWdLsg+ym3A8RRzq/mH2okfzt/e+UdHV17o2ELotMuOs5Q/mpFc/+BAZgMX4y1tbMJRvJStVKZs92SBilD111Fns8cyekMOZHPGSQqrsX1aLZyJcWRMIolJTGRP87mO33CSAB839LkqrZ2fbNbYGIUR0EZ5NnIAGC8Xc45dBvSfo/Q7557tSlAASMaoEE7PDmFBIABACYaIPdzlhikikGAkBE3wzoXVJK6DWkiD4bIe3qElMKIoL/LQJWUDggQAUAAFAZAJ0BKkAAQAA+bSyRRaQioZgM/YBABsS2AF2Z42kx8Z4GMdtifMB+sHrZ+jXyZusd9ADpOf7x54F3efefBfwZ+lMu9pLw0735Sxyv+ef6zv19QK844gbvf2AP5h/V/+p7JP9D/4f8P5uPzL/C/9r/B/AH/Kf6T/w/712ovRJ/YRuUBPH1MnmmfRsR1x6JT93eftwYbbxU9IALBjdi7/phW2KdUrrFzZZFTEI+BnAYf9HrNtvGTO1D8CU6P8Hgu+9ZHodvOG2gMgALWSmubb+zQAAA/v5+B//HP/+NF//0fdf/0a/hvLf+uK97FoMJ3/1n/J8lSqURN4PIxAKn1WtTKxszpIHJJ98a2LUTXPvyTaeaEoO624WyKo4hdpowVUlk7j0quPSI8yTS60TAy/kHQl0IduOYbIRY/LWNBiXLso+8IC1TaBMdFFZ1cGX8C1DBcmacSH3Dwm6N2iPqEuja4Uey4WRGPBkZXUdQHtY+UTvNTnNw0IJXwIoJthYoovdcistlB8yw7cOZNcY0smFHepPYyToQF/MA6VJOseTLIddaOqkJN6Lflvy6bD3q6oBgFxZo720auwhTQEQ4KEYFev+sFKYPeGKhDq9cNK0DeQdwm8CWyNwGw5Umdx0/7yaXng1uVhe5xOut8qTRuI0gFkaUGBAYLGZ1mmxeOklSgGfHOINftEDfaiUb6w6xHYIMepPgsidqYoYxySU4rvZp6mksd9JEOYTeXuFgWy5YROKHAzP3uVXbgNB8gT+kJYvotv2/mkEIbhNVKc9E3WQU8F9bREbyP8xxFhDGFp2dp6yiVS6Tsf1/wH4r3Q5glsLpbU1yRNoJVnpLS7DMwAVV9K2BwcquNVBmkWomiLM5TJQJAH4WH13i1mNRs858Ic/XkGh3YW5lDVO9eUQqa8Eg/QDcP4wg/A72aP4MsjoZW4U301bGFhFMyDZCbFApau+HGf7ifoiqjWC2+Gov33qrZsLtcD+dM+KWeiel0FGOvfyfxUp37tugS96UHshxyWpSyN/23ynmNF7UHC65War4eewj0uoh9Rk23M6XHvTCdxLPDfSieZ66XdaXC8Ck+tGXn+a1bojIAeJE1WfEa/IQRnCUlIxHq//lI8fBeADjzDN40Ti+Drcw/HHHo02mUWW8VeNu0nUFpGiyRzjF83u7at/B1x2LWYV64YB1cLfh4We+KthmXoFIceL+E9LgTkUVj6rOFLolzl3HJfrWFHkF/uY7oMDG1IuHy9Lex43rw7qqAX5hzJa2/T5Ev6+VBBtVL5j3PyEnXiXPhnfGGTGhbNgzQBz++qWeLjik71N8K89suikt0levFGvruBvZKhKrD+ZsMnAos0le/8jyIXArAq8PRu+0ptMQFf0W+njQF6wop6UvNr9FVj2I55QCS1cqksM/g5LFN57zN6g3PTuoA3SWPjaWY+qGUOhLuNvyW2otJ1Xdhm1UC5Wk+FuyiGBtmdr7Nn1nf59rl5D7gN9Gp2T6pPD//wyin4WV7uoqZqxgIBTVLl4vfHlHTcbOzfzDyS9XrWtbEdv2Wn/UWFf++gr69FGpMEEF98fW/wjxAAkGRn1rSlTvAtlujHr/FOHy4O1KGU4Y5xqQl7EaxvW7KAsFFmVstcrJYlAaqZ7qyBs7BxffC7GpxvNovYdM4kH12E4K/kz1+wz2nfF0epQezBI9vjcq/4/rBfXSSAKx6Pe+O/On6oVfjMaOHbXQ+MQ0mkcQ/wNyMxC8rWnPd/tgy/BDFm/c90GeAXW9fgm/LOq/9/xc++/cY+AoAAAAAA==';

  TameSlotItem.prototype.draw = function(){
    if (!leashSprite.complete || !leashSprite.naturalWidth) {
      originalDraw.call(this);
      return;
    }
    const size = 38;
    const bob = Math.sin(performance.now() / 240 + this.x * 0.02) * 1.5;
    const dx = Math.round(this.x + this.w / 2 - size / 2);
    const dy = Math.round(this.y + this.h / 2 - size / 2 + bob);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.shadowColor = '#73bfff';
    ctx.shadowBlur = 7;
    ctx.globalAlpha = 0.98;
    ctx.drawImage(leashSprite, dx, dy, size, size);
    ctx.restore();
  };
})();
