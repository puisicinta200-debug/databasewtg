
(function(){
'use strict';

(function(){


  var _matiAliasAlreadySetup = false;

  function _setupMaterialAlias(){
    if(_matiAliasAlreadySetup) return;

    if(typeof window._invMatiData === 'undefined' || typeof window._matiData === 'undefined') return;

    _matiAliasAlreadySetup = true;


    var master = (window._invMatiData && window._invMatiData.length) ? '_invMatiData'
               : (window._matiData    && window._matiData.length)    ? '_matiData'
               : '_invMatiData';


    if(master === '_invMatiData' && window._matiData && window._matiData.length){
      window._invMatiData = window._matiData.slice();
    } else if(master === '_matiData' && window._invMatiData && window._invMatiData.length){
      window._matiData = window._invMatiData.slice();
    }


    var _descMati = Object.getOwnPropertyDescriptor(window, '_matiData');
    if (!_descMati || typeof _descMati.get !== 'function') {
      try {
        Object.defineProperty(window, '_matiData', {
          get: function(){ return window._invMatiData; },
          set: function(v){ window._invMatiData = v; },
          configurable: true
        });
      } catch(e) {

        window._matiData = window._invMatiData;
      }
    } else {
      window._invMatiData = window._invMatiData || window._matiData || [];
    }


    var _descMatiL = Object.getOwnPropertyDescriptor(window, '_matiLoaded');
    if (!_descMatiL || typeof _descMatiL.get !== 'function') {
      try {
        Object.defineProperty(window, '_matiLoaded', {
          get: function(){ return window._invMatiLoaded; },
          set: function(v){ window._invMatiLoaded = v; },
          configurable: true
        });
      } catch(e) {
        window._matiLoaded = window._invMatiLoaded;
      }
    }


  }


  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _setupMaterialAlias);
  } else {

    setTimeout(_setupMaterialAlias, 200);
  }


  window.matiLoad = function(){
    var _origLoad = typeof _origMatiLoad === 'function' ? _origMatiLoad : null;
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if(!sb){ if(_origLoad) _origLoad(); return; }

    var list = document.getElementById('mati-list');
    if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';

    sb.from('material_items').select('*').order('kode')
      .then(function(r){
        if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><p>Gagal: '+(r.error.message||'')+'</p></div>'; return; }

        window._invMatiData = r.data || [];
        window._invMatiLoaded = true;

        if(typeof _invFillItemDropdowns === 'function') _invFillItemDropdowns();
        if(typeof _matiFillItemDropdowns === 'function') _matiFillItemDropdowns();
        if(typeof _matiUpdateStats === 'function') _matiUpdateStats();
        if(typeof matiRender === 'function') matiRender();
        if(typeof invMatiRender === 'function') invMatiRender();
        if(typeof invStokRender === 'function') invStokRender();
        if(typeof invUpdateDashboard === 'function') invUpdateDashboard();
      }).catch(function(e){
        if(list) list.innerHTML='<div class="olt-empty"><p>Error: '+(e.message||'')+'</p></div>';
      });
  };


  var _origInvMatiLoad = window.invMatiLoad;
  window.invMatiLoad = function(){
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if(!sb){ if(typeof _origInvMatiLoad === 'function') _origInvMatiLoad(); return; }

    var list = document.getElementById('inv-mati-list');
    if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';

    sb.from('material_items').select('*').order('kode')
      .then(function(r){
        if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><p>Gagal: '+(r.error.message||'')+'</p></div>'; return; }

        window._invMatiData = r.data || [];
        window._invMatiLoaded = true;
        if(typeof _invFillItemDropdowns === 'function') _invFillItemDropdowns();
        if(typeof _invFillPelFormDropdowns === 'function') _invFillPelFormDropdowns();
        if(typeof _matiFillItemDropdowns === 'function') _matiFillItemDropdowns();
        if(typeof _matiUpdateStats === 'function') _matiUpdateStats();
        if(typeof invMatiRender === 'function') invMatiRender();
        if(typeof invStokRender === 'function') invStokRender();
        if(typeof invUpdateDashboard === 'function') invUpdateDashboard();
      }).catch(function(e){
        if(list) list.innerHTML='<div class="olt-empty"><p>Error: '+(e.message||'')+'</p></div>';
      });
  };
})();



window._fdbFillAreaCoverageFilter = function(){
  _fdbFillAreaFilter_SSOT();
};

function _fdbFillAreaFilter_SSOT(){

  var sel = document.getElementById('fdb-area-coverage') ||
            document.getElementById('fdb-area-id');
  if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">Semua Area</option>';
  var areas = typeof _areaData !== 'undefined' ? _areaData : [];
  areas.forEach(function(a){
    var o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.nama || a.kode;
    if(a.id === cur) o.selected = true;
    sel.appendChild(o);
  });
}

var _origFdbLoad = window.fdbLoad;

window.fdbOnAreaChange = function(){

  ['fdb-kecamatan','fdb-kelurahan','fdb-rw','fdb-rt'].forEach(function(id){
    var el = document.getElementById(id);
    if(el && el.parentElement) el.parentElement.style.display = 'none';
  });
  fdbLoad();
};

window.fdbOnKecamatanChange = function(){ fdbLoad(); };
window.fdbOnKelurahanChange = function(){ fdbLoad(); };
window.fdbOnRwChange        = function(){ fdbLoad(); };

window._pelFillAreaCovFilter = function(){
  var sel = document.getElementById('pel-fil-area');
  if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">Semua Area</option>';
  var areas = typeof _areaData !== 'undefined' ? _areaData : [];
  areas.forEach(function(a){
    var o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.nama || a.kode;
    if(a.id === cur) o.selected = true;
    sel.appendChild(o);
  });
};

if(window.SOT && typeof SOT.onUpdate === 'function'){
  SOT.onUpdate(function(evt){
    if(evt === 'invalidate' || evt === 'refresh'){

      if(typeof window._invMatiData !== 'undefined'){
        window._invMatiData = [];
        window._invMatiLoaded = false;
      }

      window._fdbWilayahCache = null;
    }
  });
}

(function(){

  function _hideWilayahNav(){
    var role = typeof normalizeRole === 'function' ? normalizeRole(window.CR) : (window.CR||'viewer');
    var btn = document.getElementById('btn-wilayah');

    if(role === 'super_admin' || role === 'owner'){

      if(btn) btn.style.display = '';
      return;
    }


    ['nav-wilayah','sb-item-wilayah','p-wilayah-nav','btn-wilayah'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.display = 'none';
    });
  }
  window._hideWilayahNav = _hideWilayahNav;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(_hideWilayahNav, 500); });
  } else {
    setTimeout(_hideWilayahNav, 500);
  }
})();

})();

