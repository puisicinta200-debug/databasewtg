
(function(){
  function isDesktop(){ return window.innerWidth >= 1200; }
  function syncDesktopUI(){
    try{
      var dev = document.getElementById('ww-device');
      if(dev) dev.textContent = isDesktop() ? 'Desktop Browser' : 'Mobile Browser';
    }catch(e){}
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', syncDesktopUI);
  } else {
    syncDesktopUI();
  }
  window.addEventListener('resize', syncDesktopUI);
})();
