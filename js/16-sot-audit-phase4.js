
(function(){
'use strict';

if(typeof window.SOT === 'undefined'){
  console.error('[Phase 4] SOT engine tidak ditemukan.');
  return;
}

SOT.audit = function(cb){
  var self = this;
  self.refresh(true, function(c){
    var areas  = c.areas    || [];
    var odcs   = c.odcs     || [];
    var odps   = c.odps     || [];
    var ports  = c.ports    || [];
    var pels   = c.pelanggan || [];


    var areaIds = {}; areas.forEach(function(a){ areaIds[a.id]=1; });
    var odcIds  = {}; odcs.forEach(function(o){  odcIds[o.id]=1;  });
    var odpIds  = {}; odps.forEach(function(o){  odpIds[o.id]=1;  });


    var orphan = {
      odc_no_area  : odcs.filter(function(o){ return !areaIds[o.area_id]; }),
      odp_no_odc   : odps.filter(function(o){ return !odcIds[o.odc_id];   }),
      odp_no_area  : odps.filter(function(o){ return !areaIds[o.area_id]; }),
      port_no_odp  : ports.filter(function(p){ return !odpIds[p.odp_id];  }),
      port_used_no_pel: ports.filter(function(p){
        return PORT_STATUS.isUsed(p.status) && !p.cid_pelanggan && !p.pel_id;
      }),
      pel_no_area  : pels.filter(function(p){ return !p.area_id;  }),
      pel_aktif_no_odp : pels.filter(function(p){
        return p.status==='aktif' && !p.odp_id;
      }),
      pel_aktif_no_port: pels.filter(function(p){
        return p.status==='aktif' && !p.nomor_port;
      })
    };


    var cidMap = {};
    pels.forEach(function(p){
      if(!p.cid) return;
      cidMap[p.cid] = (cidMap[p.cid]||0) + 1;
    });
    var dup_cid = Object.keys(cidMap).filter(function(k){ return cidMap[k]>1; });

    var portKey = {};
    ports.forEach(function(p){
      var k = (p.odp_id||'') + '|' + (p.nomor_port||'');
      portKey[k] = (portKey[k]||0) + 1;
    });
    var dup_port = Object.keys(portKey).filter(function(k){ return portKey[k]>1; });

    var odpKodeMap = {};
    odps.forEach(function(o){
      if(!o.kode) return;
      odpKodeMap[o.kode] = (odpKodeMap[o.kode]||0) + 1;
    });
    var dup_odp_kode = Object.keys(odpKodeMap).filter(function(k){ return odpKodeMap[k]>1; });


    var totalChecks = pels.length + ports.length + odps.length + odcs.length;
    var issues = orphan.pel_no_area.length + orphan.pel_aktif_no_odp.length +
      orphan.port_no_odp.length + orphan.port_used_no_pel.length +
      orphan.odp_no_odc.length + orphan.odc_no_area.length +
      dup_cid.length + dup_port.length;
    var qualityScore = totalChecks > 0
      ? Math.max(0, Math.round((1 - issues/totalChecks)*100))
      : 100;

    var result = {
      orphan: orphan,
      duplicate: { cid: dup_cid, port: dup_port, odp_kode: dup_odp_kode },
      summary: {
        orphan_critical : orphan.pel_no_area.length + orphan.port_used_no_pel.length,
        orphan_total    : Object.values(orphan).reduce(function(s,a){return s+a.length;},0),
        dup_critical    : dup_cid.length + dup_port.length,
        quality_score   : qualityScore
      }
    };

    console.group('[4.1] SOT Data Governance Audit');




    Object.keys(orphan).forEach(function(k){
      if(orphan[k].length) console.warn('  ORPHAN '+k+':', orphan[k].length);
    });
    console.groupEnd();

    if(cb) cb(result);
    return result;
  });
};

var _origMntWsSubmitOdp4 = window.mntWsSubmitOdp;
window.mntWsSubmitOdp = function(){
  if(typeof _origMntWsSubmitOdp4==='function') _origMntWsSubmitOdp4.apply(this,arguments);
  setTimeout(function(){ if(window.SOT) SOT.invalidate('general'); }, 800);
};
var _origAppApprove4 = window.appApprove;
window.appApprove = function(id, status){
  if(typeof _origAppApprove4==='function') _origAppApprove4.apply(this,arguments);
  setTimeout(function(){
    if(window.SOT) SOT.invalidate('general');

    if(typeof finUpdateDashboard==='function') setTimeout(finUpdateDashboard, 1000);
  }, 600);
};
(function(){
  if(typeof RT_TABLES === 'undefined') return;
  var portRT = RT_TABLES.find(function(t){ return t.name==='odp_ports'; });
  if(!portRT){
    RT_TABLES.push({ name:'odp_ports', icon:'ti-plug', color:'var(--c1)' });
    RT_TABLES.push({ name:'work_orders', icon:'ti-tool', color:'var(--cyan)' });

  }
})();

SOT.capacityEngine = {

  areaCapacity: function(areaId){
    var c   = SOT.cache();
    var odps = areaId ? c.odps.filter(function(o){ return o.area_id===areaId; }) : c.odps;
    var ps  = SOT.portStats(areaId);
    var pct = ps.pct;

    var cs  = SOT.customerStats(areaId);
    var now = new Date();
    var prevBulan = new Date(now.getFullYear(), now.getMonth()-1, 1);
    var prevKey = prevBulan.getFullYear()+'-'+('0'+(prevBulan.getMonth()+1)).slice(-2);
    var pelPrev = (areaId ? c.pelanggan.filter(function(p){ return p.area_id===areaId; }) : c.pelanggan)
      .filter(function(p){
        var JG=window.JENIS_GRATIS||[];
        return JG.indexOf(p.jenis_pelanggan)<0 &&
          (p.tgl_pasang||p.created_at||'').slice(0,7)===prevKey;
      }).length;
    var growthPct = pelPrev > 0
      ? Math.round((cs.baru_bulan_ini - pelPrev) / pelPrev * 100)
      : (cs.baru_bulan_ini > 0 ? 100 : 0);

    var monthToFull = null;
    if(ps.free > 0 && cs.baru_bulan_ini > 0){
      monthToFull = Math.ceil(ps.free / cs.baru_bulan_ini);
    }
    return {
      area_id      : areaId,
      total_odc    : (areaId ? c.odcs.filter(function(o){return o.area_id===areaId;}) : c.odcs).length,
      total_odp    : odps.length,
      total_port   : ps.total,
      used_port    : ps.used,
      free_port    : ps.free,
      damaged_port : ps.damaged,
      utilization  : pct,
      growth_pct   : growthPct,
      predict_full_months : monthToFull,
      baru_bulan_ini : cs.baru_bulan_ini
    };
  },


  areaRanking: function(){
    var areas = SOT.cache().areas || [];
    return areas.map(function(a){
      return SOT.capacityEngine.areaCapacity(a.id);
    }).sort(function(a,b){ return b.utilization - a.utilization; });
  },


  odpRanking: function(areaId, limit){
    var c    = SOT.cache();
    var odps = areaId ? c.odps.filter(function(o){return o.area_id===areaId;}) : c.odps;
    return odps.map(function(o){
      var ps = SOT.odpStats(o.id);
      return {
        id: o.id, kode: o.kode, nama: o.nama,
        area_id: o.area_id,
        total: ps.total, used: ps.used, free: ps.free,
        damaged: ps.damaged, pct: ps.pct
      };
    })
    .sort(function(a,b){ return b.pct - a.pct; })
    .slice(0, limit || 20);
  },


  renderCapacityCard: function(areaId, targetElId){
    var cap = this.areaCapacity(areaId);
    var el  = document.getElementById(targetElId);
    if(!el) return;
    var pctColor = cap.utilization>85?'var(--red)':cap.utilization>60?'var(--yellow)':'var(--green)';
    el.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11px">'+
        '<div style="background:var(--bg3);border-radius:10px;padding:8px;text-align:center">'+
          '<div style="font-size:16px;font-weight:800;color:'+pctColor+'">'+cap.utilization+'%</div>'+
          '<div style="color:var(--text3);font-size:10px;margin-top:2px">Utilisasi</div>'+
        '</div>'+
        '<div style="background:var(--bg3);border-radius:10px;padding:8px;text-align:center">'+
          '<div style="font-size:16px;font-weight:800;color:var(--c1)">'+cap.used_port+'</div>'+
          '<div style="color:var(--text3);font-size:10px;margin-top:2px">Port Pakai</div>'+
        '</div>'+
        '<div style="background:var(--bg3);border-radius:10px;padding:8px;text-align:center">'+
          '<div style="font-size:16px;font-weight:800;color:var(--green)">'+cap.free_port+'</div>'+
          '<div style="color:var(--text3);font-size:10px;margin-top:2px">Port Sisa</div>'+
        '</div>'+
      '</div>'+
      (cap.predict_full_months!==null?
        '<div style="margin-top:6px;font-size:11px;background:rgba(220,38,38,.07);border-radius:8px;padding:6px 10px;color:var(--red)">'+
        '⏱ Prediksi kapasitas penuh: <strong>~'+cap.predict_full_months+' bulan</strong></div>':'');
  }
};
SOT.slaEngine = {

  teknisiStats: function(){
    var wo = SOT.cache().maintenance || [];
    var byTek = {};
    wo.forEach(function(w){
      var k = w.teknisi_id || w.teknisi || 'unknown';
      if(!byTek[k]) byTek[k] = { id:k, total:0, selesai:0, pending:0, totalHours:0 };
      byTek[k].total++;
      if(w.status==='selesai'){
        byTek[k].selesai++;

        if(w.tgl_mulai && w.tgl_selesai){
          var ms = new Date(w.tgl_selesai) - new Date(w.tgl_mulai);
          byTek[k].totalHours += ms / 3600000;
        }
      } else {
        byTek[k].pending++;
      }
    });
    return Object.values(byTek).map(function(t){
      t.sla_pct = t.total > 0 ? Math.round(t.selesai/t.total*100) : 0;
      t.avg_hours = t.selesai > 0 ? Math.round(t.totalHours/t.selesai*10)/10 : null;
      return t;
    }).sort(function(a,b){ return b.sla_pct - a.sla_pct; });
  },


  areaStats: function(areaId){
    var wo = SOT.cache().maintenance || [];
    var filtered = areaId ? wo.filter(function(w){return w.area_id===areaId;}) : wo;
    var selesai = filtered.filter(function(w){return w.status==='selesai';});
    var pending = filtered.filter(function(w){return w.status!=='selesai';});
    var totalRes = 0, countRes = 0;
    selesai.forEach(function(w){
      if(w.tgl_mulai && w.tgl_selesai){
        totalRes += (new Date(w.tgl_selesai) - new Date(w.tgl_mulai)) / 3600000;
        countRes++;
      }
    });
    return {
      area_id      : areaId,
      total        : filtered.length,
      selesai      : selesai.length,
      pending      : pending.length,
      sla_pct      : filtered.length > 0 ? Math.round(selesai.length/filtered.length*100) : 100,
      avg_resolution_hours : countRes > 0 ? Math.round(totalRes/countRes*10)/10 : null
    };
  },


  systemSLA: function(){
    var wo = SOT.cache().maintenance || [];
    if(!wo.length) return 100;
    var selesai = wo.filter(function(w){return w.status==='selesai';}).length;
    return Math.round(selesai/wo.length*100);
  }
};

/* Catatan: window._auditLog didefinisikan SATU KALI saja, di bagian
   "PATCH: Audit Log Pelanggan Human-Readable" (lebih jauh di bawah file
   ini). Definisi itu mendukung modul 'pelanggan' (create/update) dan
   'dismantle' (cabut) dengan keterangan yang rapi, serta modul generik
   lain seperti 'odp'/'port'/'material' yang dipakai di bawah ini.
   Karena assignment ke window._auditLog bersifat global dan semua
   pemanggilannya terjadi saat interaksi user (bukan saat parsing file),
   urutan definisi di file tidak menjadi masalah — tapi sengaja hanya
   ada SATU definisi untuk menghindari duplikasi/log ganda. */

if(typeof window.pelSave === 'function') window.pelSave._p4audit = true;

if(typeof window.odpSave === 'function'){
  var _origOdpSave4 = window.odpSave;
  window.odpSave = function(){
    if(typeof _origOdpSave4==='function') _origOdpSave4.apply(this,arguments);
    setTimeout(function(){ window._auditLog('odp','save'); }, 1200);
  };
  window.odpSave._p4audit = true;
}

if(typeof window.portSave === 'function'){
  var _origPortSave4 = window.portSave;
  window.portSave = function(){
    if(typeof _origPortSave4==='function') _origPortSave4.apply(this,arguments);
    setTimeout(function(){ window._auditLog('port','save'); }, 1200);
  };
  window.portSave._p4audit = true;
}

if(typeof window.dmtSave === 'function'){ window.dmtSave._p4audit = true; }

if(window.invMatiSave){
  var _origInvMatiSave4 = window.invMatiSave;
  window.invMatiSave = function(){
    if(typeof _origInvMatiSave4==='function') _origInvMatiSave4.apply(this,arguments);
    setTimeout(function(){ window._auditLog('material','save'); }, 1200);
  };
  window.invMatiSave._p4audit = true;
}

window.SOT_recovery = {

  softDelete: function(table, id, cb){
    var sb = (typeof getSB==='function') ? getSB() : null;
    if(!sb){ console.error('[Recovery] No DB connection'); return; }
    sb.from(table).update({ deleted_at: new Date().toISOString(), is_deleted: true })
      .eq('id', id)
      .then(function(r){
        if(r.error){ console.error('[Recovery] softDelete error:', r.error); return; }
        window._auditLog(table, 'soft_delete', id);
        if(window.SOT) SOT.invalidate('general');
        if(cb) cb(null, id);
      })
      .catch(function(e){ console.error('[Recovery] softDelete catch:', e); });
  },


  restore: function(table, id, cb){
    var sb = (typeof getSB==='function') ? getSB() : null;
    if(!sb) return;
    sb.from(table).update({ deleted_at: null, is_deleted: false })
      .eq('id', id)
      .then(function(r){
        if(r.error){ console.error('[Recovery] restore error:', r.error); return; }
        window._auditLog(table, 'restore', id);
        if(window.SOT) SOT.invalidate('general');
        if(cb) cb(null, id);
      })
      .catch(function(e){ console.error('[Recovery] restore catch:', e); });
  },


  snapshot: function(){
    var snap = {
      ts      : new Date().toISOString(),
      version : 'ICRM_v24_PHASE4',
      cache   : SOT.cache(),
      stats   : {
        customerStats   : SOT.customerStats(),
        portStats       : SOT.portStats(),
        maintenanceStats: SOT.maintenanceStats(),
        dismantleStats  : SOT.dismantleStats(),
        materialStats   : SOT.materialStats()
      }
    };
    var blob = new Blob([JSON.stringify(snap, null, 2)], {type:'application/json'});
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url;
    a.download = 'SOT_snapshot_'+ new Date().toISOString().slice(0,19).replace(/:/g,'-') +'.json';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);

    return snap;
  }
};

(function(){
  var _origOnUpdate4 = SOT.onUpdate.bind(SOT);
  var _regCount = SOT._subs ? SOT._subs.length : 0;
  SOT.onUpdate = function(fn){

    var src = fn.toString().slice(0,50);
    var already = (SOT._subs||[]).some(function(f){ return f.toString().slice(0,50)===src; });
    if(already){ console.warn('[4.8] SOT.onUpdate: duplicate subscriber skipped.'); return this; }
    return _origOnUpdate4(fn);
  };

})();

var _dashThrottle = { last: 0, min: 1500 };
var _origDashLoad4 = window.dashLoad;
window.dashLoad = function(){
  var now = Date.now();
  if(now - _dashThrottle.last < _dashThrottle.min){

    return;
  }
  _dashThrottle.last = now;
  if(typeof _origDashLoad4==='function') _origDashLoad4.apply(this,arguments);
};

window.dashLoad._2b  = !!(typeof _origDashLoad4==='function' && _origDashLoad4._2b);
SOT.onUpdate(function(evt){
  if(evt !== 'refresh') return;

  /* Cap memori dihapus — data dari Supabase, tidak dipotong */
});

window.SOT_fieldOps = {

  getScope: function(){
    var role = (typeof normalizeRole==='function') ? normalizeRole(window.CR) : (window.CR||'viewer');
    if(typeof hasPermission==='function' && !hasPermission(role,'all')){
      var sc = (typeof _getUserAreaScope==='function') ? _getUserAreaScope() : null;
      return { area_id: sc && sc.area_coverage_id, role: role, is_field: role==='teknisi'||role==='vendor' };
    }
    return { area_id: null, role: role, is_field: false };
  },


  filterToScope: function(arr, areaKey){
    var scope = this.getScope();
    if(!scope.area_id || !scope.is_field) return arr;
    return arr.filter(function(item){ return item[areaKey||'area_id'] === scope.area_id; });
  },


  offlineQueue: {
    add: function(action){


    },
    flush: function(){


    },
    count: function(){ return 0; }
  },


  initConnectivityMonitor: function(){
    if(!window._bndOnlineSync){
      window.addEventListener('online', function(){

        if(typeof toast === 'function') toast('Koneksi pulih — data diperbarui dari server','ok');
        if(window.SOT && typeof SOT.refresh === 'function') SOT.refresh(true);
      });
      window.addEventListener('offline', function(){
        if(typeof toast === 'function') toast('Koneksi terputus — simpan data tidak tersedia','err');
      });
      window._bndOnlineSync = true;
    }

  }
};

window.SOT_fieldOps.initConnectivityMonitor();

})();

