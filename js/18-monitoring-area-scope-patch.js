
(function(){
'use strict';

var _origMonAreaRender = window._monAreaRender;
window._monAreaRender = function(c, olts){
  if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
    var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
    var aId = sc && sc.area_coverage_id;
    if(aId){
      var cFiltered = {
        areas      : (c.areas      ||[]).filter(function(a){ return a.id===aId; }),
        odcs       : (c.odcs       ||[]).filter(function(o){ return o.area_id===aId; }),
        odps       : (c.odps       ||[]).filter(function(o){ return o.area_id===aId; }),
        pelanggan  : (c.pelanggan  ||[]).filter(function(p){ return p.area_id===aId; }),
        ports      : c.ports||[]
      };
      var oltsFiltered = (olts||[]).filter(function(o){ return o.area_id===aId; });
      if(typeof _origMonAreaRender==='function') _origMonAreaRender(cFiltered, oltsFiltered);
      return;
    }
  }
  if(typeof _origMonAreaRender==='function') _origMonAreaRender(c, olts);
};

var _origPortLoad = window.portLoad;
window.portLoad = function(){
  if(typeof _isGlobalRole==='function' && _isGlobalRole()){
    if(typeof _origPortLoad==='function') _origPortLoad();
    return;
  }
  var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
  var aId = sc && sc.area_coverage_id;
  if(!aId){ if(typeof _origPortLoad==='function') _origPortLoad(); return; }

  var list = document.getElementById('port-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  var p1 = sb.from('odps').select('id,kode,nama,area_id,jumlah_port').eq('area_id', aId).order('kode')
    .then(function(r){ if(!r.error) window._portOdpList = r.data||[]; });

  var p2 = (window._areaData && window._areaData.length > 0) ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama')
        .then(function(r){ if(!r.error) _areaMergeLookup(r.data); });

  Promise.all([p1, p2]).then(function(){
    if(typeof _portFillFilters==='function') _portFillFilters();
    var selArea = document.getElementById('port-fil-area');
    if(selArea && aId) selArea.value = aId;

    var odpIds = (window._portOdpList||[]).map(function(o){ return o.id; });
    if(!odpIds.length){
      window._portData = [];
      window._portLoaded = true;
      if(typeof _portUpdateStats==='function') _portUpdateStats();
      if(typeof portRender==='function') portRender();
      return;
    }
    sb.from('odp_ports').select('*').in('odp_id', odpIds).order('created_at', {ascending:false})
      .then(function(r){
        if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+(r.error.message||'coba lagi')+'</p></div>'; return; }
        window._portData = r.data||[];
        window._portLoaded = true;
        if(typeof _portUpdateStats==='function') _portUpdateStats();
        if(typeof portRender==='function') portRender();
      }).catch(function(e){
        if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+(e.message||'coba lagi')+'</p></div>';
      });
  });
};

var _origOdcLoad = window.odcLoad;
window.odcLoad = function(){
  if(typeof _isGlobalRole==='function' && _isGlobalRole()){
    if(typeof _origOdcLoad==='function') _origOdcLoad(); return;
  }
  var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
  var aId = sc && sc.area_coverage_id;
  if(!aId){ if(typeof _origOdcLoad==='function') _origOdcLoad(); return; }

  var list = document.getElementById('odc-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  var p1 = (window._areaData && window._areaData.length > 0) ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaMergeLookup(r.data); });
  var p2 = (window._oltData && window._oltData.length > 0) ? Promise.resolve()
    : sb.from('olts').select('id,nama,kode,area_id').eq('area_id', aId).order('nama').then(function(r){ if(!r.error) window._oltMergeLookup ? window._oltMergeLookup(r.data) : _oltMergeLookup(r.data); });

  Promise.all([p1, p2]).then(function(){
    if(typeof _odcFillFilters==='function') _odcFillFilters();
    var selArea = document.getElementById('odc-fil-area');
    if(selArea && aId){ selArea.value = aId; selArea.disabled = true; }

    sb.from('odcs').select('*').eq('area_id', aId).order('created_at', {ascending:false})
      .then(function(r){
        if(r.error){ if(typeof odcRenderEmpty==='function') odcRenderEmpty('Gagal: '+(r.error.message||'coba lagi')); return; }
        window._odcData = r.data||[];
        window._odcLoaded = true;
        if(typeof odcUpdateStats==='function') odcUpdateStats();
        if(typeof odcRender==='function') odcRender();
      }).catch(function(e){ if(typeof odcRenderEmpty==='function') odcRenderEmpty('Error: '+(e.message||'coba lagi')); });
  });
};

var _origOdpLoad = window.odpLoad;
window.odpLoad = function(){
  if(typeof _isGlobalRole==='function' && _isGlobalRole()){
    if(typeof _origOdpLoad==='function') _origOdpLoad(); return;
  }
  var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
  var aId = sc && sc.area_coverage_id;
  if(!aId){ if(typeof _origOdpLoad==='function') _origOdpLoad(); return; }

  var list = document.getElementById('odp-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  var p1 = (window._areaData && window._areaData.length > 0) ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaMergeLookup(r.data); });
  var p2 = (window._odcData && window._odcData.length > 0) ? Promise.resolve()
    : sb.from('odcs').select('id,nama,kode,area_id,olt_id').eq('area_id', aId).order('nama').then(function(r){ if(!r.error) window._odcMergeLookup ? window._odcMergeLookup(r.data) : _odcMergeLookup(r.data); });

  Promise.all([p1, p2]).then(function(){
    if(typeof _odpFillFilters==='function') _odpFillFilters();
    var selArea = document.getElementById('odp-fil-area');
    if(selArea && aId){ selArea.value = aId; selArea.disabled = true; }

    sb.from('odps').select('*').eq('area_id', aId).order('created_at', {ascending:false})
      .then(function(r){
        if(r.error){ if(typeof odpRenderEmpty==='function') odpRenderEmpty('Gagal: '+(r.error.message||'coba lagi')); return; }
        window._odpData = r.data||[];
        window._odpLoaded = true;
        if(typeof odpUpdateStats==='function') odpUpdateStats();
        if(typeof odpRender==='function') odpRender();
      }).catch(function(e){ if(typeof odpRenderEmpty==='function') odpRenderEmpty('Error: '+(e.message||'coba lagi')); });
  });
};

var _origPortFillFilters = window._portFillFilters;
window._portFillFilters = function(){
  if(typeof _origPortFillFilters==='function') _origPortFillFilters();
  if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
    var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
    var aId = sc && sc.area_coverage_id;
    if(!aId) return;
    var selArea = document.getElementById('port-fil-area');
    if(selArea){
      Array.from(selArea.options).forEach(function(opt){
        if(opt.value && opt.value !== aId) opt.style.display = 'none';
      });
      selArea.value = aId;
      selArea.disabled = true;
    }
    var selOdp = document.getElementById('port-fil-odp');
    if(selOdp){
      Array.from(selOdp.options).forEach(function(opt){
        if(!opt.value) return;
        var odp = (window._portOdpList||[]).find(function(o){ return o.id===opt.value; });
        if(odp && odp.area_id !== aId) opt.style.display = 'none';
      });
    }
  }
};

var _origLoginOKScope = window._loginOK;
if(typeof _origLoginOKScope==='function' && !_origLoginOKScope._scopePatch){
  window._loginOK = function(usr){

    if(window.SOT) SOT.invalidate('general');

    window._portOdpList = [];
    window._odcData     = [];
    window._odpData     = [];
    if(typeof _origLoginOKScope==='function') _origLoginOKScope.apply(this, arguments);
  };
  window._loginOK._scopePatch = true;
}

})();
