
(function(){
  /* Tambah tombol Hapus Semua di toolbar dismantle — tampil hanya untuk super_admin */
  var _dmtToolbarPatch = setInterval(function(){
    var toolbar = document.querySelector('.dmt-toolbar');
    if(!toolbar || document.getElementById('dmt-hapus-semua-btn')) return;
    clearInterval(_dmtToolbarPatch);
    var isAdmin = (typeof CR !== 'undefined') && CR === 'super_admin';
    if(!isAdmin) return;
    var btn = document.createElement('button');
    btn.id = 'dmt-hapus-semua-btn';
    btn.className = 'dmt-sync-btn';
    btn.title = 'Hapus Semua Data Dismantle';
    btn.style.cssText = 'background:var(--rg2);border-color:rgba(220,38,38,.25);color:var(--red)';
    btn.innerHTML = '<i class="ti ti-trash" style="font-size:16px"></i>';
    btn.onclick = function(){ window.dmtHapusSemua && window.dmtHapusSemua(); };
    toolbar.appendChild(btn);
  }, 300);
})();
