
(function(){
'use strict';

if(typeof window.SOT === 'undefined'){
  console.error('[Phase 2B] SOT engine tidak ditemukan.');
  return;
}
window.rptSummaryLoad = function(){
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb) return;

  var areaId = null;
  if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
    var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
    areaId = sc && sc.area_coverage_id;
  }

  var _renderRpt = function(c){
    var cs = SOT.customerStats(areaId);
    var ps = SOT.portStats(areaId);

    var _s = _dSet;
    _s('rpt-kpi-pel',   cs.total);
    _s('rpt-kpi-aktif', cs.aktif);


    var data = areaId
      ? c.pelanggan.filter(function(p){ return p.area_id===areaId; })
      : c.pelanggan;
    var JG=JENIS_GRATIS;
    data = data.filter(function(p){ return JG.indexOf(p.jenis_pelanggan)<0; });
    var statusMap={};
    data.forEach(function(p){ var s=p.status||'lainnya'; statusMap[s]=(statusMap[s]||0)+1; });
    var scol={aktif:'gr',isolir:'yw',cabut:'rd',proses:'c1',lainnya:'c1',suspend:'yw',maintenance:'ty'};
    var slbl={aktif:'Aktif',isolir:'Isolir',cabut:'Cabut',proses:'Proses',lainnya:'Lainnya',suspend:'Suspend',maintenance:'Maintenance'};
    var sorted=Object.keys(statusMap).sort(function(a,b){return statusMap[b]-statusMap[a];});
    var el2=document.getElementById('rpt-pel-status-chart');
    if(el2) el2.innerHTML=sorted.map(function(s){
      var pct=data.length>0?Math.round(statusMap[s]/data.length*100):0;
      return '<div class="rpt-bar-row">'+
        '<div class="rpt-bar-label"><span class="rpt-bar-name">'+(slbl[s]||s)+'</span>'+
        '<span class="rpt-bar-val">'+statusMap[s]+' ('+pct+'%)</span></div>'+
        '<div class="rpt-bar-bg"><div class="rpt-bar-fill '+(scol[s]||'c1')+'" style="width:'+pct+'%"></div></div>'+
      '</div>';
    }).join('');


    _s('rpt-kpi-port',       ps.total);
    _s('rpt-kpi-port-used',  ps.used);
    _s('rpt-kpi-port-free',  ps.free);
    _s('rpt-kpi-port-rusak', ps.damaged);


    var now = new Date();
    var bulan = now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2);
    var baru = data.filter(function(p){
      return (p.tgl_pasang||p.created_at||'').slice(0,7)===bulan;
    }).length;
    _s('rpt-kpi-baru', baru);


    var areaMap={}, aNm={};
    (c.areas||[]).forEach(function(a){aNm[a.id]=a.nama||a.kode||'Area';});
    data.filter(function(p){return p.status==='aktif';}).forEach(function(p){
      var k=aNm[p.area_id]||'Tanpa Area';
      areaMap[k]=(areaMap[k]||0)+1;
    });
    var areaArr=Object.entries(areaMap).sort(function(a,b){return b[1]-a[1];}).slice(0,8);
    var maxA=areaArr.length?areaArr[0][1]:1;
    var el3=document.getElementById('rpt-pel-area-chart');
    if(el3) el3.innerHTML=areaArr.map(function(kv){
      var pct=Math.round(kv[1]/maxA*100);
      return '<div class="rpt-bar-row">'+
        '<div class="rpt-bar-label"><span class="rpt-bar-name">'+(typeof _esc==='function'?_esc(kv[0]):kv[0])+'</span><span class="rpt-bar-val">'+kv[1]+'</span></div>'+
        '<div class="rpt-bar-bg"><div class="rpt-bar-fill gr" style="width:'+pct+'%"></div></div>'+
      '</div>';
    }).join('')||'<div style="color:var(--text3);font-size:12px;padding:16px;text-align:center">Tidak ada data</div>';


    var odps = areaId ? c.odps.filter(function(o){return o.area_id===areaId;}) : c.odps;
    _s('rpt-kpi-odp', odps.length);
    _s('rpt-net-odp', odps.length);
  };

  var c = SOT.cache();
  if(c.pelanggan.length && c.ports.length){
    _renderRpt(c);
  } else {
    SOT.refresh(true, function(c2){ _renderRpt(c2); });
  }
};
var _origMonLoad2B = window.monLoad || function(){};
window.monLoad = function(){}
var _origPelLoadWilayah2B = window._pelLoadWilayahMaster;
window._pelLoadWilayahMaster = function(cb){
  var role = (typeof normalizeRole==='function') ? normalizeRole(window.CR) : (window.CR||'viewer');
  var isAdmin = (role==='super_admin'||role==='owner');


  if(isAdmin){
    if(typeof _origPelLoadWilayah2B==='function') _origPelLoadWilayah2B(cb);
    else if(typeof cb==='function') cb();
    return;
  }


  var c = SOT.cache();
  var src = c.pelanggan && c.pelanggan.length ? c.pelanggan : (window._pelData||[]);
  var seen={};
  window._pelWilayahMaster = src
    .filter(function(p){ return p.kecamatan; })
    .reduce(function(acc,p){
      var key=(p.kecamatan||'')+'|'+(p.kelurahan||'');
      if(!seen[key]){
        seen[key]=true;
        acc.push({area_coverage:p.area_id||'', kecamatan:p.kecamatan, kelurahan:p.kelurahan||''});
      }
      return acc;
    },[]);
  if(typeof cb==='function') cb();
};
var _origSdRenderCekList2B = window._sdRenderCekList;
window._sdRenderCekList = function(){
  if(!window.SOT || typeof _origSdRenderCekList2B !== 'function'){
    if(typeof _origSdRenderCekList2B === 'function') _origSdRenderCekList2B();
    return;
  }

  if(window._sdOdpEnriched && _sdOdpEnriched.length){
    var enrichedClone = _sdOdpEnriched.map(function(o){
      var ps = SOT.odpStats(o.id);
      var copy = {}; for(var k in o) copy[k]=o[k];
      copy.used = ps.used; copy.sisa = ps.free;
      return copy;
    });
    window._sdOdpEnriched = enrichedClone;
    _origSdRenderCekList2B();
    window._sdOdpEnriched = _origEnriched;
  } else {
    _origSdRenderCekList2B();
  }
};
window._sotKPI = function(areaId){
  return {
    pelanggan : SOT.customerStats(areaId),
    port      : SOT.portStats(areaId),
    area      : SOT.areaStats(areaId)
  };
};

})();

