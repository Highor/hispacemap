let acceptMap;
export const mapConsent=new Promise(resolve=>{acceptMap=resolve;});
const dialog=document.getElementById('spoiler-dialog');
const sessionKey='hispace-map-spoiler-accepted';
const unlock=()=>{
 document.body.classList.remove('spoiler-locked');
 dialog.close();
 performance.mark("hispace-map-consent");
 acceptMap();
 document.querySelector('.hp-seed-input')?.focus();
};
const leave=()=>{if(history.length>1)history.back();else location.replace('about:blank');};
dialog.addEventListener('cancel',event=>{event.preventDefault();leave();});
document.getElementById('spoiler-leave').addEventListener('click',leave);
document.getElementById('spoiler-continue').addEventListener('click',()=>{
 try{sessionStorage.setItem(sessionKey,'1');}catch{}
 unlock();
});
let accepted=false;
try{accepted=sessionStorage.getItem(sessionKey)==='1';}catch{}
if(accepted)unlock();else dialog.showModal();
