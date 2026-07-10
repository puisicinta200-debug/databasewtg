

(function(){
  var logs=[];
  function push(type,args){
    try{
      var msg=Array.prototype.map.call(args,function(a){
        if(a instanceof Error) return a.message+' | '+(a.stack||'');
        try{ return typeof a==='object'? JSON.stringify(a) : String(a); }catch(e){ return String(a); }
      }).join(' ');
      logs.push('['+type+'] '+msg);
      if(logs.length>200) logs.shift();
      render();
    }catch(e){}
  }
  ['log','warn','error'].forEach(function(type){
    var orig=console[type];
    console[type]=function(){ push(type,arguments); orig.apply(console,arguments); };
  });
  window.addEventListener('error',function(e){
    push('error',['Uncaught: '+e.message+' @ '+(e.filename||'')+':'+(e.lineno||'')]);
  });
  window.addEventListener('unhandledrejection',function(e){
    push('error',['Unhandled promise rejection: '+(e.reason&&e.reason.message||e.reason)]);
  });
  function render(){
    var panel=document.getElementById('_dbgPanel');
    if(!panel) return;
    panel.innerHTML=logs.map(function(l){
      var color = l.indexOf('[error]')===0 ? '#ff6b6b' : l.indexOf('[warn]')===0 ? '#ffd166' : '#9ad1ff';
      return '<div style="border-bottom:1px solid #333;padding:4px 0;color:'+color+'">'+
        l.replace(/</g,'&lt;') + '</div>';
    }).join('');
  }
  document.addEventListener('DOMContentLoaded',function(){
    var btn=document.createElement('div');
    btn.textContent='🐞';
    btn.style.cssText='position:fixed;right:10px;bottom:10px;width:42px;height:42px;background:#111;color:#fff;border-radius:50%;display:none;align-items:center;justify-content:center;font-size:20px;z-index:999999;box-shadow:0 2px 8px rgba(0,0,0,.4)';
    var panel=document.createElement('div');
    panel.id='_dbgPanel';
    panel.style.cssText='position:fixed;left:0;right:0;bottom:60px;max-height:60vh;overflow:auto;background:rgba(15,15,20,.96);color:#eee;font-family:monospace;font-size:11px;padding:8px;z-index:999998;display:none;-webkit-overflow-scrolling:touch';
    var clearBtn=document.createElement('div');
    clearBtn.textContent='Bersihkan log';
    clearBtn.style.cssText='position:fixed;left:10px;bottom:10px;background:#111;color:#fff;padding:8px 12px;border-radius:8px;font-size:11px;font-family:sans-serif;z-index:999999;display:none';
    document.body.appendChild(panel);
    document.body.appendChild(btn);
    document.body.appendChild(clearBtn);
    var open=false;
    btn.addEventListener('click',function(){
      open=!open;
      panel.style.display = open?'block':'none';
      clearBtn.style.display = open?'block':'none';
      render();
    });
    clearBtn.addEventListener('click',function(){ logs=[]; render(); });

    var _dbgLastCR=null;
    setInterval(function(){
      var cr=window.CR||null;
      if(cr===_dbgLastCR) return;
      _dbgLastCR=cr;
      var show=(cr==='super_admin');
      btn.style.display=show?'flex':'none';
      if(!show){ open=false; panel.style.display='none'; clearBtn.style.display='none'; }
    },500);
  });
})();
