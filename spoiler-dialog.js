const dialog=document.getElementById('spoiler-dialog');
const leave=()=>{if(history.length>1)history.back();else location.replace('about:blank');};
dialog.addEventListener('cancel',event=>{event.preventDefault();leave();});
document.getElementById('spoiler-leave').addEventListener('click',leave);
document.getElementById('spoiler-continue').addEventListener('click',()=>{
 document.body.classList.remove('spoiler-locked');
 dialog.close();
 document.querySelector('.hp-seed-input')?.focus();
});
dialog.showModal();
