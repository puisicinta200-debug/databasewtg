
(function(){
'use strict';

if(typeof window.SOT === 'undefined'){
  console.error('[Phase 3] SOT engine tidak ditemukan.');
  return;
}

SOT._ttl = 0; // No local cache — always fetch from Supabase

SOT._cache.material     = [];
SOT._cache.maintenance  = [];
SOT._cache.dismantle    = [];

var _origSOTRefresh3 = SOT.refresh.bind(SOT);
SOT.refresh = function(force, cb){
  var self = this;

  _origSOTRefresh3.call(self, force, function(c){

    var sb = (typeof getSB === 'function') ? getSB() : null;
    if(!sb){ if(cb) cb(c); return; }

    var areaId = null;
    if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
      var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
      areaId = sc && sc.area_coverage_id;
    }

    var q2 = function(tbl, cols){
      var qr = sb.from(tbl).select(cols).order('created_at',{ascending:false}).limit(2000);
      if(areaId) qr = qr.eq('area_id', areaId);
      return qr;
    };

    Promise.all([
      q2('material_mutasi','id,item_id,jenis,jumlah,area_id,odp_id,odc_id,pel_id,pel_cid,teknisi,tgl,stok_sesudah,keterangan'),
      q2('dismantle_orders','id,pel_id,cid_pelanggan,area_id,odc_id,odp_id,nomor_port,status,tgl_cabut,tgl_selesai,alasan,ont_kembali,precon_kembali,adapter_kembali,teknisi'),
      sb.from('work_orders').select('id,pel_id,area_id,odp_id,teknisi_id,status,jenis,tgl_mulai,tgl_selesai').order('tgl_mulai',{ascending:false}).limit(1000)
    ]).then(function(r){
      if(r[0] && !r[0].error) self._cache.material    = r[0].data||[];
      if(r[1] && !r[1].error) self._cache.dismantle   = r[1].data||[];
      if(r[2] && !r[2].error) self._cache.maintenance = r[2].data||[];
      if(cb) cb(self._cache);
    }).catch(function(){ if(cb) cb(self._cache); });
  });
};

SOT.materialStats = function(areaId){
  var muts = areaId
    ? this._cache.material.filter(function(m){ return m.area_id === areaId; })
    : this._cache.material;
  var masuk = muts.filter(function(m){ return (m.jenis||'').indexOf('masuk') >= 0 || m.jenis === 'pembelian'; });
  var keluar = muts.filter(function(m){ return (m.jenis||'').indexOf('keluar') >= 0 || (m.jenis||'').indexOf('pakai') >= 0; });
  var retur  = muts.filter(function(m){ return (m.jenis||'').indexOf('return') >= 0 || (m.jenis||'').indexOf('recovery') >= 0; });
  var qMasuk  = masuk.reduce(function(s,m){ return s + (parseFloat(m.jumlah)||0); }, 0);
  var qKeluar = keluar.reduce(function(s,m){ return s + (parseFloat(m.jumlah)||0); }, 0);
  var qRetur  = retur.reduce(function(s,m){ return s + (parseFloat(m.jumlah)||0); }, 0);
  return { total_mutasi: muts.length, masuk: qMasuk, keluar: qKeluar, retur: qRetur,
    net: qMasuk - qKeluar + qRetur, raw: muts };
};

SOT.maintenanceStats = function(areaId){
  var wo = areaId
    ? this._cache.maintenance.filter(function(w){ return w.area_id === areaId; })
    : this._cache.maintenance;
  var done    = wo.filter(function(w){ return w.status === 'selesai'; });
  var pending = wo.filter(function(w){ return w.status === 'proses' || w.status === 'pending' || !w.status; });
  return { total: wo.length, selesai: done.length, pending: pending.length,
    in_progress: wo.filter(function(w){ return w.status==='proses'; }).length, raw: wo };
};

SOT.dismantleStats = function(areaId){
  var dmt = areaId
    ? this._cache.dismantle.filter(function(d){ return d.area_id === areaId; })
    : this._cache.dismantle;
  var selesai = dmt.filter(function(d){ return d.status === 'selesai'; });
  var proses  = dmt.filter(function(d){ return d.status !== 'selesai'; });
  var ont_ret = dmt.filter(function(d){ return d.ont_kembali; }).length;
  return { total: dmt.length, selesai: selesai.length, proses: proses.length,
    ont_kembali: ont_ret, raw: dmt };
};

var _origFinUpdate3 = window.finUpdateDashboard;
window.finUpdateDashboard = function(){
  if(typeof _origFinUpdate3 === 'function') _origFinUpdate3.apply(this, arguments);

  if(window.SOT && SOT.cache().pelanggan.length){
    var ms = SOT.maintenanceStats();
    var ds = SOT.dismantleStats();
    var cs = SOT.customerStats();
    var _s = _dSet;
    _s('fd-mnt-total',    ms.total);
    _s('fd-mnt-pending',  ms.pending);
    _s('fd-dmt-total',    ds.total);
    _s('fd-pel-aktif',    cs.aktif);
    _s('fd-pel-total',    cs.total);
  }
};
SOT.onUpdate(function(evt){
  if(evt !== 'refresh') return;

  var isMainPane = function(id){
    var el=document.getElementById(id);
    return el && (el.classList.contains('on') || el.style.display!=='none');
  };
  if(!window.SOT) return;

  var scopeAid1 = (!_isGlobalRole() && _getUserAreaScope()) ? _getUserAreaScope().area_coverage_id : null;
  var cs = SOT.customerStats(scopeAid1);
  var ps = SOT.portStats(scopeAid1);
  var _s = _dSet;

  _s('dk-pel-total', cs.total);   _s('dk-pel-aktif', cs.aktif);
  _s('dk-port-total', ps.total);  _s('dk-port-used', ps.used);
  _s('dk-port-kosong', ps.free);  _s('dk-port-rusak', ps.damaged);
  _s('dk-port-pct', ps.pct+'%');
});

var _origRenderMonCharts = window._renderMonCharts;
window._renderMonCharts = function(odpAll, portData, pelData){

  var enriched = (odpAll||[]).map(function(o){
    var ps = (window.SOT && typeof SOT.odpStats==='function') ? SOT.odpStats(o.id) : null;
    if(!ps) return o;
    var copy = {}; for(var k in o) copy[k]=o[k];
    copy.port_used   = ps.used;
    copy.port_free   = ps.free;
    copy.jumlah_port = ps.total || (parseInt(o.jumlah_port)||0);
    return copy;
  });
  if(typeof _origRenderMonCharts === 'function'){
    _origRenderMonCharts(enriched, portData, pelData);
  }
};
window.monCekRender = function(){}
if(typeof window.rptPelLoad === 'function'){
  var _origRptPelLoad3 = window.rptPelLoad;
  window.rptPelLoad = function(){
    var c = SOT.cache();
    if(!c.pelanggan.length){ _origRptPelLoad3.apply(this,arguments); return; }

    var JG=JENIS_GRATIS;
    var berbayar = c.pelanggan.filter(function(p){ return JG.indexOf(p.jenis_pelanggan)<0; });
    var _s = _dSet;
    _s('rpt-kpi-pel',   berbayar.length);
    _s('rpt-kpi-aktif', berbayar.filter(function(p){ return p.status==='aktif'; }).length);
    _s('rpt-kpi-new',   SOT.customerStats().baru_bulan_ini);
  };
}

var _origRptJar3 = window.rptJaringanLoad;
window.rptJaringanLoad = function(){

  var c = SOT.cache();
  if(c.ports.length){
    if(typeof _origRptJar3==='function') _origRptJar3.apply(this,arguments);
  } else {
    SOT.refresh(false, function(){ if(typeof _origRptJar3==='function') _origRptJar3.apply(this,arguments); });
  }
};
var ROLE_CANONICAL = {

  'super_admin':'super_admin','owner':'owner','admin':'admin',
  'finance':'finance','sales':'sales','teknisi':'teknisi',
  'vendor':'vendor','area_manager':'area_manager','viewer':'viewer',

  'admin_wilayah':'area_manager','coverage_admin':'area_manager',
  'regional_admin':'area_manager','rw_admin':'area_manager',
  'rt_admin':'area_manager','area_admin':'area_manager',
  'superadmin':'super_admin','super admin':'super_admin',
  'keuangan':'finance','field':'teknisi','lapangan':'teknisi'
};

window.normalizeRole = function(role){
  if(!role) return 'viewer';
  var r = String(role).toLowerCase().trim();
  return ROLE_CANONICAL[r] || r;
};
window.ROLE_CANONICAL = ROLE_CANONICAL;

window.ROLE_PERMS = {
  super_admin  : ['all'],
  owner        : ['dashboard','pelanggan','odp','odc','monitoring','finance','sales','reporting','material','maintenance','dismantle','approval','audit','role'],
  admin        : ['dashboard','pelanggan','odp','odc','monitoring','finance','sales','reporting','material','maintenance','dismantle','approval'],
  finance      : ['dashboard','finance','reporting'],
  sales        : ['dashboard','pelanggan','sales','reporting'],
  teknisi      : ['dashboard','monitoring','maintenance','material'],
  vendor       : ['maintenance','material'],
  area_manager : ['dashboard','pelanggan','monitoring','material','maintenance'],
  viewer       : ['dashboard']
};

window.hasPermission = function(role, module){
  var r = normalizeRole(role);
  var perms = ROLE_PERMS[r] || ['dashboard'];
  return perms.indexOf('all') >= 0 || perms.indexOf(module) >= 0;
};

var _origInvLoad3 = window.invLoad;
window.invLoad = function(){
  if(typeof _origInvLoad3==='function') _origInvLoad3.apply(this,arguments);

  setTimeout(function(){
    if(!window.SOT) return;
    var sb = (typeof getSB==='function') ? getSB() : null;
    if(!sb) return;
    sb.from('material_mutasi')
      .select('id,item_id,jenis,jumlah,area_id,odp_id,odc_id,pel_id,pel_cid,teknisi,tgl,stok_sesudah,keterangan')
      .order('tgl',{ascending:false}).limit(2000)
      .then(function(r){
        if(r && !r.error && r.data){
          SOT._cache.material = r.data;
        }
      }).catch(function(){});
  }, 800);
};
SOT.onUpdate(function(evt){
  if(evt === 'invalidate'){
    SOT._cache.material    = [];
    SOT._cache.maintenance = [];
    SOT._cache.dismantle   = [];

    if(typeof _invLapCache !== 'undefined') _invLapCache.ts = 0;

    if(typeof _inv2MatiData !== 'undefined' && typeof inv2LoadMaster === 'function'){
      inv2LoadMaster(function(){
        if(typeof _invFillAllDropdowns==='function') _invFillAllDropdowns();
        if(typeof _invKirimFillSplit==='function') _invKirimFillSplit();
      });
    }
  }
});

var _origDmtLoad3 = window.dmtLoad;
window.dmtLoad = function(){
  if(typeof _origDmtLoad3==='function') _origDmtLoad3.apply(this,arguments);
  setTimeout(function(){
    if(!window.SOT) return;
    var sb = (typeof getSB==='function') ? getSB() : null;
    if(!sb) return;
    sb.from('dismantle_orders')
      .select('id,pel_id,cid_pelanggan,area_id,odc_id,odp_id,nomor_port,status,tgl_cabut,tgl_selesai,alasan,ont_kembali,precon_kembali,adapter_kembali,teknisi')
      .order('tgl_selesai',{ascending:false}).limit(1000)
      .then(function(r){
        if(r && !r.error && r.data) SOT._cache.dismantle = r.data;
      }).catch(function(){});
  }, 600);
};
var _p3RealtimeBusy = false;
var _p3RealtimeQueue = [];

window._p3ProcessRealtime = function(entity){

  if(_p3RealtimeBusy){
    if(_p3RealtimeQueue.indexOf(entity) < 0) _p3RealtimeQueue.push(entity);
    return;
  }
  _p3RealtimeBusy = true;
  setTimeout(function(){
    var entities = [entity].concat(_p3RealtimeQueue);
    _p3RealtimeQueue = [];
    _p3RealtimeBusy = false;


    if(window.SOT) SOT.invalidate('general');


    var active = function(id){
      var el=document.getElementById(id);
      return el && (el.classList.contains('on') || el.style.display==='block');
    };
    entities.forEach(function(ent){
      if(ent==='pelanggan' && active('p-pelanggan') && typeof pelLoad==='function') setTimeout(pelLoad,300);
      if(ent==='odp'       && active('p-odp')       && typeof odpLoad==='function') setTimeout(odpLoad,300);
      if(ent==='monitoring'&& active('p-monitoring') && typeof monLoad==='function') setTimeout(function(){ if(typeof monLoad==='function') monLoad(); },300);
    });
  }, 250);
};

(function(){

  var _origSOTInvalidate3 = SOT.invalidate.bind(SOT);
  SOT.invalidate = function(scope){

    _origSOTInvalidate3(scope);

    if(typeof window._p3ProcessRealtime === 'function'){
      var entity = (scope === 'inventory') ? 'odp'
                 : (scope === 'pelanggan') ? 'pelanggan'
                 : 'general';

      if(entity !== 'general') window._p3ProcessRealtime(entity);
    }
  };
  SOT.invalidate._p3 = true;


  document.addEventListener('DOMContentLoaded', function(){

    if(typeof window._rtOnChange === 'function'){
      var _origRtOnChange = window._rtOnChange;
      window._rtOnChange = function(table, payload){

        var entity = ({'pelanggan':'pelanggan','odps':'odp','odp_ports':'odp','monitoring':'monitoring'})[table] || 'general';
        if(typeof window._p3ProcessRealtime === 'function') window._p3ProcessRealtime(entity);

        if(typeof _origRtOnChange === 'function') _origRtOnChange(table, payload);
      };
}
  });
})();

window.SOT.ensure = function(tables, cb){
  var c = this.cache();
  var tableArr = Array.isArray(tables) ? tables : [tables];
  var allLoaded = tableArr.every(function(t){
    return (c[t] && c[t].length > 0);
  });
  if(allLoaded){ if(cb) cb(c); return; }
  this.refresh(false, cb);
};

window._ensureAreas = function(sbOrCb){
  var isCallback = typeof sbOrCb === 'function';
  if(isCallback){
    SOT.ensure(['areas'], function(c){ sbOrCb(c.areas); });
  } else {

    return new Promise(function(resolve){
      SOT.ensure(['areas'], function(c){
        if(c && c.areas && c.areas.length) window._areaData = c.areas;
        resolve();
      });
    });
  }
};
window._ensureOdcs = function(areaIdOrCb, cb){
  var areaId = typeof areaIdOrCb === 'string' ? areaIdOrCb : null;
  var callback = typeof areaIdOrCb === 'function' ? areaIdOrCb : cb;
  if(callback){
    SOT.ensure(['odcs'], function(c){
      var odcs = areaId ? c.odcs.filter(function(o){return o.area_id===areaId;}) : c.odcs;
      callback(odcs);
    });
  } else {
    return new Promise(function(resolve){
      SOT.ensure(['odcs'], function(c){
        if(c && c.odcs) window._odcData = areaId ? c.odcs.filter(function(o){return o.area_id===areaId;}) : c.odcs;
        resolve();
      });
    });
  }
};
window._ensureOdps = function(odcIdOrCb, cb){
  var odcId = typeof odcIdOrCb === 'string' ? odcIdOrCb : null;
  var callback = typeof odcIdOrCb === 'function' ? odcIdOrCb : cb;
  if(callback){
    SOT.ensure(['odps'], function(c){
      var odps = odcId ? c.odps.filter(function(o){return o.odc_id===odcId;}) : c.odps;
      callback(odps);
    });
  } else {
    return new Promise(function(resolve){
      SOT.ensure(['odps'], function(c){
        if(c && c.odps) window._odpData = odcId ? c.odps.filter(function(o){return o.odc_id===odcId;}) : c.odps;
        resolve();
      });
    });
  }
};

window._refreshMonKpi = function(){
  if(!window.SOT) return;
  var c = SOT.cache();
  var ps = SOT.portStats(null);
  var _s = _dSet;
  _s('mon-kpi-total',  ps.total);
  _s('mon-kpi-used',   ps.used);
  _s('mon-kpi-free',   ps.free);
  _s('mon-kpi-rusak',  ps.damaged);
  _s('mon-kpi-pct',    ps.pct+'%');
  _s('mon-kpi-odp',    c.odps.length);
  _s('mon-kpi-odc',    c.odcs.length);
  _s('mon-kpi-area',   c.areas.length);
};
SOT.onUpdate(function(evt){
  if(evt === 'refresh' && document.getElementById('p-monitoring')){
    var monPane = document.getElementById('p-monitoring');
    if(monPane && monPane.classList.contains('on')) window._refreshMonKpi();
  }
});

var _origOwdPane3 = window.owdPaneLoad;
window.owdPaneLoad = function(force){

  if(typeof _origOwdPane3 === 'function') _origOwdPane3.call(this, force);


  setTimeout(function(){
    if(!window.SOT) return;
    var c = SOT.cache();
    if(!c || !c.areas || !c.areas.length) return;

    var ms  = SOT.maintenanceStats();
    var ds  = SOT.dismantleStats();
    var mts = SOT.materialStats();
    var _s  = typeof _dSet === 'function' ? _dSet : function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };


    _s('owd-exec-mnt-total',  ms.total);
    _s('owd-exec-mnt-pending',ms.pending);
    _s('owd-exec-dmt-total',  ds.total);
    _s('owd-exec-dmt-proses', ds.proses);
    _s('owd-exec-mat-keluar', mts.keluar);
    _s('owd-exec-mat-retur',  mts.retur);


    var tbl = document.getElementById('owd-exec-area-tbl');
    if(!tbl) return;
    tbl.innerHTML = (c.areas||[]).map(function(a){
      var cs2 = SOT.customerStats(a.id);
      var ps2 = SOT.portStats(a.id);
      var ms2 = SOT.maintenanceStats(a.id);
      var ds2 = SOT.dismantleStats(a.id);
      var esc = typeof _owdEsc==='function' ? _owdEsc : function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;'); };
      return '<tr>'
        +'<td style="font-size:11px;font-weight:700;color:var(--text)">'+esc(a.nama||a.kode)+'</td>'
        +'<td style="text-align:right;font-size:11px;color:var(--c1);font-weight:700">'+cs2.aktif+'</td>'
        +'<td style="text-align:right;font-size:11px;color:var(--text2)">'+ps2.used+'/'+ps2.total+'</td>'
        +'<td style="text-align:right;font-size:11px;color:var(--red)">'+ms2.pending+'</td>'
        +'<td style="text-align:right;font-size:11px;color:var(--red)">'+ds2.proses+'</td>'
        +'</tr>';
    }).join('');
  }, 600);
};
window.owdPaneLoad._fix3 = true;
window.owdPaneLoad._fix5 = true;

window.SOT_PHASE3_audit = function(){
  if(!window.SOT){ console.error('SOT not found'); return; }
  var c   = SOT.cache();
  var cs  = SOT.customerStats();
  var ps  = SOT.portStats();
  var ms  = SOT.maintenanceStats();
  var ds  = SOT.dismantleStats();
  var mts = SOT.materialStats();

  var line = '═'.repeat(50);























  var markers = {
    'FIX-1 pelSave→port' : !!(window.pelSave && window.pelSave._fix1),
    'FIX-3 owdPane→SOT'  : !!(window.owdPaneLoad && (window.owdPaneLoad._fix3 || window.owdPaneLoad._p3)),
    '2B-1 dashLoad→SOT'  : !!(window.dashLoad && window.dashLoad._2b),
    '2B-2 rptSummary→SOT': !!(window.rptSummaryLoad && window.rptSummaryLoad._2b),
    '2C-1 dmtSave→SSOT'  : !!(window.dmtSave && window.dmtSave._2c),
    '3.2 materialStats'  : typeof SOT.materialStats==='function',
    '3.2 maintStats'     : typeof SOT.maintenanceStats==='function',
    '3.2 dismantleStats' : typeof SOT.dismantleStats==='function',
    '3.6 normalizeRole'  : !!(window.normalizeRole && window.normalizeRole._p3),
    '3.6 ROLE_PERMS'     : typeof window.ROLE_PERMS==='object',
    '3.10 SOT.ensure'    : typeof SOT.ensure==='function',
    '3.11 execView'      : !!(window.owdPaneLoad && window.owdPaneLoad._p3),
  };
  Object.keys(markers).forEach(function(k){

  });

  return { cache: c, cs: cs, ps: ps, ms: ms, ds: ds, mts: mts, markers: markers };
};

})();

