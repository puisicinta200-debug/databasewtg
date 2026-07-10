
(function(){
'use strict';

if(typeof window.SOT === 'undefined'){
  console.error('[P4] SOT engine tidak ditemukan. Pastikan P1-P3 sudah di-load.');
  return;
}

SOT.customerStats = function(areaId){
  var d = areaId
    ? this._cache.pelanggan.filter(function(p){ return p.area_id === areaId; })
    : this._cache.pelanggan;

  /* SSOT: total = aktif + suspend + cabut SAJA, proses tidak dihitung */
  var aktifList   = d.filter(function(p){ return p.status==='aktif'; });
  var suspendList = d.filter(function(p){ return p.status==='suspend'; });
  var cabutList   = d.filter(function(p){ return p.status==='cabut'; });
  var totalSSOT   = aktifList.length + suspendList.length + cabutList.length;

  /* Berbayar = aktif dengan jenis_pelanggan Reguler */
  var berbayarList = aktifList.filter(function(p){
    return (p.jenis_pelanggan||'Reguler') === 'Reguler';
  });

  var now = new Date();
  var bulan = now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2);

  return {
    total         : totalSSOT,
    berbayar      : berbayarList.length,
    aktif         : aktifList.length,
    suspend       : suspendList.length,
    cabut         : cabutList.length,
    maintenance   : 0,
    baru_bulan_ini: aktifList.filter(function(p){
      return (p.tgl_pasang||p.created_at||'').slice(0,7)===bulan;
    }).length,
    raw: d
  };
};

SOT.areaStats = function(areaId){
  var c    = this._cache;
  var odcs = areaId ? c.odcs.filter(function(o){ return o.area_id===areaId; }) : c.odcs;
  var odps = areaId ? c.odps.filter(function(o){ return o.area_id===areaId; }) : c.odps;
  var ps   = this.portStats(areaId);
  var pel  = this.customerStats(areaId);
  return {
    total_odc      : odcs.length,
    total_odp      : odps.length,
    total_port     : ps.total,
    used_port      : ps.used,
    free_port      : ps.free,
    damaged_port   : ps.damaged,
    pct_port       : ps.pct,
    total_pelanggan: pel.total,
    aktif_pelanggan: pel.aktif,
    berbayar       : pel.berbayar
  };
};
SOT.isPortActive = function(p){
  return p.status==='aktif' || p.status==='maintenance';
};
SOT.networkActiveStats = function(areaId){
  var d = areaId
    ? this._cache.pelanggan.filter(function(p){ return p.area_id === areaId; })
    : this._cache.pelanggan;
  var aktifList = d.filter(this.isPortActive);
  var byArea = {};
  aktifList.forEach(function(p){
    var a = p.area_id || '—';
    byArea[a] = (byArea[a]||0) + 1;
  });
  return { total: d.length, aktif: aktifList.length, byArea: byArea, raw: aktifList };
};

SOT.networkActiveByAreaFromList = function(list){
  var self = this;
  var byArea = {};
  (list||[]).forEach(function(p){
    if(!self.isPortActive(p)) return;
    var a = p.area_id || '—';
    byArea[a] = (byArea[a]||0) + 1;
  });
  return byArea;
};
if(typeof window.dashLoad === 'function') window.dashLoad._sotPatched=true;

if(typeof window.finUpdateDashboard === 'function') window.finUpdateDashboard._sotPatched=true;

window._pelOnAreaChangeWilayah = function(){
  ['pelf-kecamatan','pelf-kelurahan','pelf-rw','pelf-rt'].forEach(function(id){
    var el=document.getElementById(id); if(!el) return;
    el.setAttribute('readonly','true');
    el.style.background='var(--bg3)'; el.style.color='var(--text3)';
    el.style.pointerEvents='none'; el.title='Field historis — tidak mempengaruhi KPI';
  });
};
if(typeof window.pelSave === 'function') window.pelSave._sotPatched=true;

var _origMonSyncRingkasan = window._monSyncRingkasan;
window._monSyncRingkasan = function(){
  if(!window.SOT || !SOT.cache().odps.length){
    if(typeof _origMonSyncRingkasan==='function') _origMonSyncRingkasan(); return;
  }
  var c=SOT.cache(), aNm={}, odcM={};
  (c.areas||[]).forEach(function(a){aNm[a.id]=a.nama||a.kode||'Area';});
  (c.odcs||[]).forEach(function(o){odcM[o.id]=o;});
  window._monData = window._monData||{olt:[],odc:[],odp:[],port:[]};
  window._monData.odp = c.odps.map(function(o){
    var ps=SOT.odpStats(o.id);
    return {id:o.id,kode:o.kode||'',nama:o.nama||'',area_id:o.area_id,
      areaNama:aNm[o.area_id]||'—',odc_id:o.odc_id,kap:parseInt(o.jumlah_port)||0,
      used:ps.used,free:ps.free,damaged:ps.damaged,pct:ps.pct,status:o.status||''};
  });
  window._monData.port=c.ports;
  window._monData.odc=c.odcs.map(function(o){
    var odpsOdc=c.odps.filter(function(od){return od.odc_id===o.id;});
    var tot=0,used=0,dmg=0;
    odpsOdc.forEach(function(od){var p2=SOT.odpStats(od.id);tot+=p2.total;used+=p2.used;dmg+=p2.damaged;});
    return {id:o.id,kode:o.kode||'',nama:o.nama||'',area_id:o.area_id,areaNama:aNm[o.area_id]||'—',
      used:used,free:Math.max(0,tot-used-dmg),total:tot,damaged:dmg};
  });
};
window._monSyncRingkasan._sotPatched=true;

window.insLoad = function(){
  var area=(document.getElementById('ins-fil-area')||{}).value||'';
  var loadingEl=document.getElementById('ins-loading'),summaryEl=document.getElementById('ins-summary'),emptyEl=document.getElementById('ins-empty');
  if(loadingEl) loadingEl.style.display='block';
  if(summaryEl) summaryEl.style.display='none';
  if(emptyEl)   emptyEl.style.display='none';
  var c=SOT.cache(), hasData=c.odps.length&&c.ports.length;
  function _run(c2){
    var areaAll=c2.areas||[],odpAll=c2.odps||[],pelAll=c2.pelanggan||[];
    var areaIds=areaAll.filter(function(a){return !area||a.nama===area;}).map(function(a){return a.id;});
    var odpFil=odpAll.filter(function(o){return areaIds.indexOf(o.area_id)>=0;});
    var JG=window.JENIS_GRATIS||['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
    var pelFil=pelAll.filter(function(p){return areaIds.indexOf(p.area_id)>=0&&p.status==='aktif'&&JG.indexOf(p.jenis_pelanggan)<0;});
    if(!odpFil.length&&!pelFil.length){if(loadingEl)loadingEl.style.display='none';if(emptyEl)emptyEl.style.display='block';return;}
    var odpStats=odpFil.map(function(odp){
      var ps=SOT.odpStats(odp.id);
      var areaNama=(areaAll.find(function(a){return a.id===odp.area_id;})||{}).nama||'—';
      return {id:odp.id,kode:odp.kode,nama:odp.nama,areaNama:areaNama,totalPort:ps.total,terpakai:ps.used,kosong:ps.free,pct:ps.pct};
    });
    var sepi=odpStats.filter(function(o){return o.pct<=30&&o.totalPort>0;}).sort(function(a,b){return a.pct-b.pct;});
    var penuh=odpStats.filter(function(o){return o.pct>=70;}).sort(function(a,b){return b.pct-a.pct;});
    var sedang=odpStats.filter(function(o){return o.pct>30&&o.pct<70;});
    var _s = _dSet;
    _s('ins-odp-sepi',sepi.length);_s('ins-odp-ramai',penuh.length);_s('ins-odp-sedang',sedang.length);_s('ins-odp-total',odpStats.length);
    var areaMap={};
    pelFil.forEach(function(p){var aN=(areaAll.find(function(a){return a.id===p.area_id;})||{}).nama||'Area';areaMap[aN]=(areaMap[aN]||0)+1;});
    var areaArr=Object.keys(areaMap).map(function(k){return{nama:k,total:areaMap[k]};}).sort(function(a,b){return b.total-a.total;});
    var potEl=document.getElementById('ins-potensi-cards');
    if(potEl) potEl.innerHTML=areaArr.slice(0,4).map(function(k){
      var pBar=Math.min(100,Math.round(k.total/Math.max(1,pelFil.length)*100));
      return '<div style="background:#fff;border-radius:14px;padding:12px;box-shadow:var(--shadow)"><div style="font-size:14px;font-weight:800;color:var(--c1)">'+k.total+'</div><div style="font-size:11px;color:var(--text3);margin:2px 0 6px">'+k.nama+'</div><div style="height:5px;background:#f1f5f9;border-radius:3px"><div style="height:5px;background:var(--c1);border-radius:3px;width:'+pBar+'%"></div></div></div>';
    }).join('')||'<div style="color:var(--text3);font-size:12px;padding:10px">Belum ada data</div>';
    var rek=[];
    if(sepi.length)  rek.push('⚠️ Ada <strong>'+sepi.length+' ODP tidak laku</strong>. Evaluasi lokasi.');
    if(penuh.length) rek.push('🔥 Ada <strong>'+penuh.length+' ODP hampir penuh</strong>. Segera tambah ODP baru.');
    if(!sepi.length&&penuh.length>0) rek.push('✅ Semua ODP efisien — pertimbangkan ekspansi!');
    var rekEl=document.getElementById('ins-rekomendasi');
    if(rekEl) rekEl.innerHTML=rek.length?'<ul style="padding-left:16px;margin:0">'+rek.map(function(r){return'<li style="margin-bottom:6px;font-size:13px">'+r+'</li>';}).join('')+'</ul>':'<p style="color:var(--text3);font-size:13px">Sistem berjalan normal.</p>';
    if(loadingEl) loadingEl.style.display='none';
    if(summaryEl) summaryEl.style.display='block';
    window._insLoaded=true;
  }
  hasData ? _run(c) : SOT.refresh(true, function(c2){_run(c2);});
};
window.insLoad._sotPatched=true;

var _origSfinFillFilters = window.sfinFillFilters;
window.sfinFillFilters = function(){
  var sel=document.getElementById('sfin-fil-area');
  if(sel){
    var cur=sel.value; sel.innerHTML='<option value="">Semua Area</option>';
    var areas=(SOT.cache().areas&&SOT.cache().areas.length)?SOT.cache().areas:(window._areaData||[]);
    areas.forEach(function(a){var o=document.createElement('option');o.value=a.id;o.textContent=a.nama||a.kode;if(a.id===cur)o.selected=true;sel.appendChild(o);});
  }
  if(typeof _origSfinFillFilters==='function') _origSfinFillFilters.apply(this,arguments);
};
window.sfinFillFilters._sotPatched=true;

(function(){
  if(window.fdpOpenCal)  window.fdpOpenCal._p4unified=true;
  if(window.fdpCloseCal) window.fdpCloseCal._p4unified=true;
  if(window._fdpRender)  window._fdpRender._p4unified=true;
  if(window._fdpPickDay) window._fdpPickDay._p4unified=true;
  if(window._fdpApply)   window._fdpApply._p4unified=true;

})();

(function(){

  var _fixMarkers = function(){

    if(window.portSave && !window.portSave._sotPatched){
      window.portSave._sotPatched = true;
    }

    if(window.invMatiSave && !window.invMatiSave._p4audit){
      window.invMatiSave._p4audit = true;
    }

    if(window.dashLoad && !window.dashLoad._2b){
}
  };

  _fixMarkers();
  document.addEventListener('DOMContentLoaded', _fixMarkers);
  window._p4MarkersFixed = true;
})();

if(typeof window._pelLoadWilayahMaster === 'function'){
  window._pelLoadWilayahMaster._sotPatched = true;
} else {
  document.addEventListener('DOMContentLoaded', function(){
    if(typeof window._pelLoadWilayahMaster === 'function') window._pelLoadWilayahMaster._sotPatched = true;
  });
}

if(typeof SOT.onUpdate==='function'){
  SOT.onUpdate(function(evt){
    if(evt==='invalidate') window._insLoaded=false;
    if(evt==='refresh'){
      var pane=document.getElementById('p-dash');
      if(pane&&pane.classList.contains('on')){
        setTimeout(function(){
          if(!window.SOT) return;

          var scopeAid0 = (!_isGlobalRole() && _getUserAreaScope()) ? _getUserAreaScope().area_coverage_id : null;
          var cs=SOT.customerStats(scopeAid0), ps=SOT.portStats(scopeAid0);
          var s=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
          s('dk-pel-aktif',cs.aktif); s('dk-pel-total',cs.total);
          s('dk-port-total',ps.total); s('dk-port-used',ps.used);
          s('dk-port-kosong',ps.free); s('dk-port-rusak',ps.damaged); s('dk-port-pct',ps.pct+'%');
        },500);
      }
    }
  });
}

(function(){
'use strict';

if(typeof window.pelSave === 'function'){
  window.pelSave._fix1 = true;
  window.pelSave._fix2 = true;
}

var _origPelDeleteFix = window.pelDelete;
window.pelDelete = function(id){
  var _sb = (typeof getSB==='function') ? getSB() : null;
  var pel = _getPelData().find(function(p){return p.id===id;});
  if(typeof _origPelDeleteFix==='function') _origPelDeleteFix.apply(this,arguments);
  if(_sb && pel && pel.cid){
    setTimeout(function(){
      _sb.from('odp_ports')
        .update({status:'kosong', cid_pelanggan:null, pel_id:null})
        .eq('cid_pelanggan', pel.cid)
        .then(function(r){
          if(r && !r.error && window.SOT) SOT.invalidate('general');
        })
        .catch(function(){});
    }, 800);
  }
};
window.pelDelete._fix2=true;

window.owdPaneLoad._fix3 = true;
window.owdPaneLoad._fix5 = true;

window._dashInitFilterBar = function(){
  if(_DKF_OPTS && _DKF_OPTS.areas && _DKF_OPTS.areas.length){
    if(typeof _dkRenderAllFilters==='function') _dkRenderAllFilters();
    return;
  }


  var sb2 = (typeof getSB==='function') ? getSB() : null;
  if(!sb2){ if(typeof _dkRenderAllFilters==='function') _dkRenderAllFilters(); return; }


  var c = SOT.cache();
  if(c.areas && c.areas.length){
    if(typeof _areaData!=='undefined') _areaData = c.areas;
    if(typeof _DKF_OPTS!=='undefined'){
      _DKF_OPTS.areas = c.areas.map(function(a){ return {id:a.id, nama:a.nama}; });

      _DKF_OPTS.kec = []; _DKF_OPTS.kel = []; _DKF_OPTS.rw = [];
    }
    if(typeof _dkRenderAllFilters==='function') _dkRenderAllFilters();
    return;
  }


  sb2.from('areas').select('id,nama').order('nama')
    .then(function(res){
      if(!res.error && res.data){
        if(typeof _areaData!=='undefined') _areaData = res.data;
        if(typeof _DKF_OPTS!=='undefined'){
          _DKF_OPTS.areas = res.data.map(function(a){ return {id:a.id, nama:a.nama}; });

          _DKF_OPTS.kec = []; _DKF_OPTS.kel = []; _DKF_OPTS.rw = [];
        }
      }
      if(typeof _dkRenderAllFilters==='function') _dkRenderAllFilters();
    })
    .catch(function(){
      if(typeof _dkRenderAllFilters==='function') _dkRenderAllFilters();
    });
};
window._dashInitFilterBar._fix4 = true;

window._applyDashFilterClient = function(arr, DF){
  if(!DF) return arr;
  return arr.filter(function(p){

    if(DF.area_id){
      var pArea = p.area_id;
      if(pArea !== DF.area_id) return false;
    }

    return true;
  });
};
window._applyDashFilterClient._fix4=true;

var _origSdRenderWilayah = window._sdRenderWilayah;
window._sdRenderWilayah = function(){
  var el = document.getElementById('sd-wilayah-list');
  if(!el){ if(typeof _origSdRenderWilayah==='function') _origSdRenderWilayah(); return; }


  var pel = window._sdPelData || [];
  if(!pel.length){ el.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">Belum ada data pelanggan</div>'; return; }

  var c = SOT.cache();
  var areaAll = c.areas && c.areas.length ? c.areas : (window._areaData||[]);
  var aNm = {}; areaAll.forEach(function(a){ aNm[a.id]=a.nama||a.kode||'Area'; });

  var byArea = {};
  pel.forEach(function(p){
    var key = p.area_id || 'tanpa-area';
    var label = aNm[key] || p.area_coverage || 'Tanpa Area';
    if(!byArea[key]) byArea[key]={label:label,total:0,aktif:0,suspend:0,cabut:0};
    byArea[key].total++;
    if(p.status==='aktif') byArea[key].aktif++;
    else if(p.status==='suspend') byArea[key].suspend++;
    else if(p.status==='cabut') byArea[key].cabut++;
  });

  var arr = Object.values(byArea).sort(function(a,b){return b.aktif-a.aktif;});
  if(!arr.length){ el.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">Belum ada data</div>'; return; }

  var esc2 = typeof _esc==='function' ? _esc : function(s){return String(s||'');};
  el.innerHTML = arr.map(function(row){
    var ps = SOT.portStats(Object.keys(byArea).find(function(k){return byArea[k].label===row.label;})||null);
    return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);padding:10px 12px;margin-bottom:6px">'+
      '<div style="font-size:12px;font-weight:800;color:var(--c1);margin-bottom:4px">'+esc2(row.label)+'</div>'+
      '<div style="display:flex;gap:10px;font-size:11px;color:var(--text3)">'+
        '<span>👥 <strong style="color:var(--text)">'+row.aktif+'</strong> aktif</span>'+
        '<span>⏸ '+row.suspend+' suspend</span>'+
        '<span>❌ '+row.cabut+' cabut</span>'+
        '<span>🔌 <strong style="color:var(--c1)">'+ps.used+'</strong>/'+ps.total+' port</span>'+
      '</div>'+
    '</div>';
  }).join('');
};
window._sdRenderWilayah._fix5=true;

})();

})();
