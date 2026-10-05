// Registered only for enabled origins, before asynchronous module/storage loading.
(() => {
 const style=document.createElement('style');style.id='coss-tweak-loading';
 style.textContent='html { visibility: hidden !important; }';
 const attach=()=>{if(document.documentElement)document.documentElement.append(style);};
 if(document.documentElement)attach();else {const o=new MutationObserver(()=>{if(document.documentElement){attach();o.disconnect();}});o.observe(document,{childList:true});}
 // Fail open if the extension is unavailable; never leave a site invisible.
 setTimeout(()=>style.remove(),1500);
})();
