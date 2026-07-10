
(function(){
'use strict';

if(typeof window.SOT === 'undefined'){
  console.error('[2A] SOT engine tidak ditemukan. Pastikan P1-P4 sudah di-load.');
  return;
}

var _origSdBuildWilayahData2A = window._sdBuildWilayahData;
window._sdBuildWilayahData = function(){
  if(typeof _origSdBuildWilayahData2A !== 'function' || !window.SOT){
    return typeof _origSdBuildWilayahData2A === 'function' ? _origSdBuildWilayahData2A() : [];
  }
  var result = _origSdBuildWilayahData2A();

  result.forEach(function(d){
    var ps = SOT.portStats(d.area && d.area.id ? d.area.id : null);
    d.totalPort = ps.total;
    d.usedPort  = ps.used;
  });
  return result;
};
window._sdBuildWilayahData._sot2a = true;

var _origSdCekGo2A = window.sdCekGo;
window.sdCekGo = function(){
  if(typeof _origSdCekGo2A !== 'function' || !window.SOT) { if(_origSdCekGo2A) _origSdCekGo2A(); return; }

  var origOdpStats = SOT.odpStats.bind(SOT);


  var _wrapBuild = window._sdBuildWilayahData;
  window._sdBuildWilayahData = function(){
    var data = _wrapBuild ? _wrapBuild() : [];
    data.forEach(function(d){
      var odpsRawCopy = (d.odpsRaw||[]).map(function(o){
        var copy = {}; for(var k in o) copy[k]=o[k];
        copy.port_used = origOdpStats(o.id).used;
        return copy;
      });
      d.odcs = (d.odcs||[]).map(function(odc){
        var copy = {}; for(var k in odc) copy[k]=odc[k];
        var odpsOfOdc = odpsRawCopy.filter(function(o){ return o.odc_id===odc.id; });
        var tot=0, used=0;
        odpsOfOdc.forEach(function(o){ tot += origOdpStats(o.id).total; used += o.port_used; });
        copy.port_used = used;
        copy.jumlah_port = tot || odc.jumlah_port;
        return copy;
      });
      d.odpsRaw = odpsRawCopy;
    });
    return data;
  };

  _origSdCekGo2A();


  window._sdBuildWilayahData = _wrapBuild;
};
window.sdCekGo._sot2a = true;

var _origSdRenderRingkasan2A = window._sdRenderRingkasan;
window._sdRenderRingkasan = function(){
  if(typeof _origSdRenderRingkasan2A !== 'function') return;
  _origSdRenderRingkasan2A();

  if(!window.SOT) return;


  var scope = (typeof _salesGetScope==='function') ? _salesGetScope() : null;
  var pickedArea = scope ? scope.area_coverage_id : null;
  var areaPick = document.getElementById('sd-area-pick');
  if(areaPick && areaPick.value) pickedArea = areaPick.value;

  var ps = SOT.portStats(pickedArea||null);
  var _dSet2 = (typeof _dSet==='function') ? _dSet : function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  _dSet2('sd-port-total', ps.total);
  _dSet2('sd-port-pakai', ps.used);
  _dSet2('sd-port-sisa',  ps.free);
  _dSet2('sd-tgt-lbl', 'Terpakai '+ps.pct+'%');
  _dSet2('sd-tgt-pct-lbl', ps.used+' / '+ps.total+' port');
  var bar2=document.getElementById('sd-tgt-bar');
  if(bar2){
    bar2.style.width=ps.pct+'%';
    var barCls2=ps.pct>=90?'background:linear-gradient(90deg,var(--red),#b91c1c)':ps.pct>=70?'background:linear-gradient(90deg,var(--yellow),var(--c2))':'background:linear-gradient(90deg,var(--green),#34d399)';
    bar2.style.cssText+=';'+barCls2;
  }
  var bdg2=document.getElementById('sd-tgt-badge');
  if(bdg2){
    bdg2.textContent=ps.pct+'% Terisi';
    bdg2.style.cssText=ps.pct>=90?'background:var(--rg2);color:var(--red)':ps.pct>=70?'background:var(--yg);color:var(--yellow)':'background:var(--gng2);color:var(--green)';
  }


  var c = SOT.cache();
  var pelAll = pickedArea ? c.pelanggan.filter(function(p){return p.area_id===pickedArea;}) : c.pelanggan;
  var aNm={}; (c.areas||[]).forEach(function(a){ aNm[a.id]=a.nama||a.kode||'Area'; });
  var byArea2={};
  pelAll.forEach(function(p){
    if(p.status!=='aktif') return;
    var k = aNm[p.area_id] || p.area_id || '(tanpa area)';
    byArea2[k]=(byArea2[k]||0)+1;
  });
  var arr2=Object.entries(byArea2).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
  var max2=arr2.length?arr2[0][1]:1;
  var COLS2=['#7c3aed','#1a56db','#059669','#d97706','#0891b2'];
  var esc3 = typeof _esc==='function' ? _esc : function(s){return String(s||'');};
  var html2 = arr2.length ? arr2.map(function(kv,i){
    var pct3=Math.round(kv[1]/max2*100);
    return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);padding:9px 11px;margin-bottom:5px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
      +'<span style="font-size:11px;font-weight:700">'+(i+1)+'. '+esc3(kv[0])+'</span>'
      +'<span style="font-size:12px;font-weight:800;color:'+COLS2[i%5]+'">'+kv[1]+'</span></div>'
      +'<div style="background:var(--bg4);border-radius:99px;height:5px;overflow:hidden">'
      +'<div style="height:5px;border-radius:99px;background:'+COLS2[i%5]+';width:'+pct3+'%"></div></div></div>';
  }).join('') : '<div style="color:var(--text3);font-size:11px;padding:10px;text-align:center">Belum ada data pelanggan aktif</div>';
  var elKel=document.getElementById('sd-top-kel');
  if(elKel) elKel.innerHTML = html2;
};
window._sdRenderRingkasan._sot2a = true;

window.monRenderOdc = function(){}
window.monRenderOdc._sot2a = true;

window.monRenderOdp = function(){}
window.monRenderOdp._sot2a = true;

window.monRenderOdc = function(){}
window.monRenderOdp = function(){}

function _2aCloneWithPortUsed(arr, usedMap){
  return (arr||[]).map(function(x){
    var copy = {}; for(var k in x) copy[k]=x[k];
    copy.port_used = usedMap[x.id]||0;
    return copy;
  });
}
window.monOltDetOpen = function(){}
window.monOltDetOpen._sot2a = true;

window.monOdcDetOpen = function(){}
window.monOdcDetOpen._sot2a = true;

})();

