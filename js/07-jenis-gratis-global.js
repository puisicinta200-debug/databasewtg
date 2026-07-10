

window.JENIS_GRATIS=['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
window.PORT_STATUS   = {
  USED    : ['terpakai','used'],
  FREE    : ['kosong','available'],
  DAMAGED : ['rusak'],
  isFree    : function(s){ return this.FREE.indexOf(s)   >= 0; },
  isUsed    : function(s){ return this.USED.indexOf(s)   >= 0; },
  isDamaged : function(s){ return this.DAMAGED.indexOf(s)>= 0; }
};
window.ROLE_FINAL  = ['super_admin','owner','area_manager','finance','sales','teknisi','viewer'];
window.ROLE_GLOBAL = ['super_admin','owner','finance'];

window.SOT = {
  _cache: { areas:[], odcs:[], odps:[], ports:[], pelanggan:[], ts:{ areas:0, odcs:0, odps:0, ports:0, pelanggan:0, tickets:0, fasilitasimpanan:0, inventory:0, network:0, other:0 } },
  _ttl  : 0, // Always 0 — no local TTL cache
  _subs : [],


  _portByOdp: null,
  _odpById  : null,
  _idxDirty : true,

  _buildIdx: function(){
    var pbo = {}, obi = {};
    this._cache.ports.forEach(function(p){
      (pbo[p.odp_id] || (pbo[p.odp_id]=[])).push(p);
    });
    this._cache.odps.forEach(function(o){ obi[o.id]=o; });
    this._portByOdp = pbo;
    this._odpById   = obi;
    this._idxDirty  = false;
  },

  refresh: function(force, cb){
    var self = this, now = Date.now();
    var sb = typeof getSB==='function' ? getSB() : null;
    if(!sb){ if(cb) cb(self._cache); return; }

    var anyExpired = force;
    if(!anyExpired){
      for(var mod in self._cache.ts){
        if((now - self._cache.ts[mod]) >= self._ttl){
          anyExpired = true;
          break;
        }
      }
    }
    /* Always refresh from Supabase */
    var areaId = null;
    if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
      var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
      areaId = sc && sc.area_coverage_id;
    }
    var q = function(table, cols){
      var qr = sb.from(table).select(cols);
      if(areaId) qr = qr.eq('area_id', areaId);
      return qr;
    };
    Promise.all([
      sb.from('areas').select('id,nama,kode,status').order('nama'),
      q('odcs','id,kode,nama,area_id,status,jumlah_port').order('kode'),
      q('odps','id,kode,nama,area_id,odc_id,status,jumlah_port').order('kode'),

      sb.from('odp_ports').select('id,odp_id,nomor_port,status,cid_pelanggan,pel_id').order('nomor_port').limit(5000),

      /* FIX (terpusat Supabase): pelanggan WAJIB di-bulk-fetch di sini, karena
         Ringkasan Owner, Dashboard Finance, dan kartu statistik Data Pelanggan
         semuanya membaca dari SOT.cache().pelanggan — bukan dari halaman aktif. */
      q('pelanggan','id,cid,nama,status,jenis_pelanggan,area_id,odp_id,nomor_port,tgl_pasang,created_at').limit(20000)
    ]).then(function(r){
      if(!r[0].error) self._cache.areas     = r[0].data||[];
      if(!r[1].error) self._cache.odcs      = r[1].data||[];
      if(!r[2].error) self._cache.odps      = r[2].data||[];
      if(!r[3].error) self._cache.ports     = r[3].data||[];
      if(!r[4].error) self._cache.pelanggan = r[4].data||[];

      self._cache.ts['areas'] = now;
      self._cache.ts['odcs'] = now;
      self._cache.ts['odps'] = now;
      self._cache.ts['ports'] = now;
      self._cache.ts['pelanggan'] = now;
      self._cache.ts['network'] = now;
      self._idxDirty = true;
      self._subs.forEach(function(fn){ try{ fn('refresh'); }catch(e){} });
      if(cb) cb(self._cache);
    }).catch(function(){ if(cb) cb(self._cache); });
  },

  invalidate: function(module){

    if(module){
      // Selective: only this module's timestamp
      if(this._cache.ts[module] !== undefined){
        this._cache.ts[module] = 0;
      } else {
        // Unknown module, default to general
        this._cache.ts['other'] = 0;
      }
    } else {
      // Full invalidate: all modules
      for(var key in this._cache.ts){
        this._cache.ts[key] = 0;
      }
    }
    this._idxDirty = true;
    this._subs.forEach(function(fn){ try{ fn('invalidate', module); }catch(e){} });
  },

  onUpdate : function(fn){ this._subs.push(fn); return this; },
  offUpdate : function(fn){ var i=this._subs.indexOf(fn); if(i>=0) this._subs.splice(i,1); return this; },
  cache    : function(){ return this._cache; },

  /* portStats — SSOT: hanya dari odp_ports, bukan odp.port_used */
  portStats:function(areaId){
    var odps=this._cache.odps,ports=this._cache.ports,pels=this._cache.pelanggan;
    if(areaId){
      odps=odps.filter(function(o){return o.area_id===areaId;});
      var ids={};odps.forEach(function(o){ids[o.id]=1;});
      ports=ports.filter(function(p){return ids[p.odp_id];});
      pels=pels.filter(function(p){return p.area_id===areaId;});
    }
    var total=odps.reduce(function(s,o){return s+(parseInt(o.jumlah_port)||0);},0);
    var usedSet={};
    ports.filter(function(p){return PORT_STATUS.isUsed(p.status)&&p.nomor_port!=null;})
         .forEach(function(p){usedSet[p.odp_id+'::'+p.nomor_port]=1;});
    pels.filter(function(p){
      return(p.status==='aktif'||p.status==='maintenance')&&p.odp_id&&p.nomor_port!=null;
    }).forEach(function(p){var k=p.odp_id+'::'+p.nomor_port;if(!usedSet[k])usedSet[k]=1;});
    var used=Object.keys(usedSet).length;
    var damaged=ports.filter(function(p){return PORT_STATUS.isDamaged(p.status);}).length;
    var free=total-used-damaged;
    return{total:total,used:used,free:free<0?0:free,damaged:damaged,
           pct:total?Math.round(used/total*100):0};
  },

  /* odp utilization — dari odp_ports (SSOT)
     OPT P3.1: pakai index map (_buildIdx) alih-alih filter()+find() linear di seluruh cache.
     Hasil numerik identik dgn versi lama — hanya cara akses data yg berubah. */
  odpStats:function(odpId){
    if(this._idxDirty)this._buildIdx();
    var ports=this._portByOdp[odpId]||[];
    var odp=this._odpById[odpId]||{};
    var total=parseInt(odp.jumlah_port)||ports.length||0;
    var usedSet={};
    ports.filter(function(p){return PORT_STATUS.isUsed(p.status)&&p.nomor_port!=null;})
         .forEach(function(p){usedSet[p.nomor_port]=1;});
    (this._cache.pelanggan||[]).filter(function(p){
      return p.odp_id===odpId&&(p.status==='aktif'||p.status==='maintenance')&&p.nomor_port!=null;
    }).forEach(function(p){if(!usedSet[p.nomor_port])usedSet[p.nomor_port]=1;});
    var used=Object.keys(usedSet).length;
    var free=total-used;
    var damaged=ports.filter(function(p){return PORT_STATUS.isDamaged(p.status);}).length;
    return{total:total,used:used,free:free<0?0:free,damaged:damaged,
           pct:total?Math.round(used/total*100):0};
  },

  /* pelStats — menggunakan JENIS_GRATIS global */
  pelStats: function(areaId){
    var d = areaId
      ? this._cache.pelanggan.filter(function(p){ return p.area_id===areaId; })
      : this._cache.pelanggan;
    var berbayar = d.filter(function(p){ return JENIS_GRATIS.indexOf(p.jenis_pelanggan)<0; });
    return {
      total   : d.length,
      berbayar: berbayar.length,
      aktif   : berbayar.filter(function(p){ return p.status==='aktif';   }).length,
      suspend : berbayar.filter(function(p){ return p.status==='suspend'; }).length,
      cabut   : berbayar.filter(function(p){ return p.status==='cabut';   }).length
    };
  }
};

/* ── _scopedQuery / _scopedFilter — satu helper untuk area filter ── */
window._scopedQuery = function(query, field){
  if(typeof _isGlobalRole==='function' && _isGlobalRole()) return query;
  var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
  var aid = sc && sc.area_coverage_id;
  return aid ? query.eq(field||'area_id', aid) : query;
};
window._scopedFilter = function(arr, field){
  if(typeof _isGlobalRole==='function' && _isGlobalRole()) return arr;
  var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
  var aid = sc && sc.area_coverage_id;
  if(!aid) return [];
  return arr.filter(function(x){ return x[field||'area_id']===aid; });
};

/* ── _portStatsForOdp — realtime dari SOT, bukan odp.port_used ── */
window._portStatsForOdp = function(odpId){
  return typeof SOT!=='undefined' ? SOT.odpStats(odpId)
    : { total:0, used:0, free:0, damaged:0, pct:0 };
};

/* ══════════════════════════════════════════════════════════════
   NAV BLOCKER v22 — Role final, hapus alias area_manager
══════════════════════════════════════════════════════════════ */
var _NAV_BLOCKS = {
  super_admin  : [],
  owner        : ['area','wilayah','olt','odc','odp','factoryreset','userrole','approval'],
  area_manager : ['insight','factoryreset','userrole'],
  finance      : ['area','olt','odc','odp','factoryreset','userrole'],
  sales        : ['insight','area','olt','odc','odp','factoryreset','userrole','finance','fin-dashboard','fin-otf','fin-recurring','fin-invoice'],
  teknisi      : ['insight','area','olt','odc','odp','factoryreset','userrole','finance','fin-dashboard','fin-otf','fin-recurring','fin-invoice'],
  viewer       : ['insight','area','olt','odc','odp','factoryreset','userrole','finance','fin-dashboard','fin-otf','fin-recurring','fin-invoice','approval','dismantle']
  /* area_manager dihapus — normalizeRole() sudah map ke area_manager */
};

var _navOrig = window.nav;
window.nav = function(key, btn){
  var r       = typeof normalizeRole==='function' ? normalizeRole(CR) : (CR||'viewer');
  var blocked = _NAV_BLOCKS[r] || [];
  if(blocked.indexOf(key)>=0){
    if(typeof toast==='function') toast('Akses tidak diizinkan untuk role '+r.toUpperCase(),'err');
    return;
  }
  /* _navDispatch.run dipanggil di dalam _navOrig — tidak perlu duplikat di sini */
  if(typeof _navOrig==='function') _navOrig(key, btn);
};

/* ══════════════════════════════════════════════════════════════
   SOT BRIDGE v22 — Sinkronisasi penuh semua cache & flag
══════════════════════════════════════════════════════════════ */
(function(){
  SOT.onUpdate(function(evt){
    var c = SOT.cache();
    /* Sync master data arrays */
    if(typeof _areaData !=='undefined'&&c.areas    &&c.areas.length)    _areaData = c.areas;
    /* FIX: _pelData sebelumnya diganti diam-diam dari halaman 50 baris
       menjadi SELURUH cache SOT tanpa render ulang — efeknya filter Area
       (mis. PARUNGKUDA) tampak "kosong" di percobaan pertama karena 50
       baris awal belum mencakup area tsb, dan baru terlihat benar setelah
       user ganti-ganti filter (kebetulan men-trigger pelRender() lagi).
       Sekarang begitu _pelData terisi penuh, langsung render ulang list
       & filter dropdown jika halaman Data Pelanggan sudah pernah dimuat. */
    var _pelDataWasUpdated = false;
    if(typeof _pelData  !=='undefined'&&c.pelanggan&&c.pelanggan.length){
      var _JGbridge = window.JENIS_GRATIS || ['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
      var _newPelData = c.pelanggan.filter(function(p){ return _JGbridge.indexOf(p.jenis_pelanggan) < 0; });
      if(_newPelData.length !== _pelData.length){ _pelData = _newPelData; _pelDataWasUpdated = true; }
      else { _pelData = _newPelData; }
    }
    if(typeof _odcData  !=='undefined'&&c.odcs     &&c.odcs.length)      _odcData  = c.odcs;
    if(typeof _odpData  !=='undefined'&&c.odps     &&c.odps.length)      _odpData  = c.odps;
    if(typeof _portData !=='undefined'&&c.ports    &&c.ports.length)     _portData = c.ports;

    if(_pelDataWasUpdated && typeof window._pelLoaded!=='undefined' && window._pelLoaded
       && typeof _pelFillFilters==='function' && typeof pelRender==='function'){
      _pelFillFilters();
      pelRender();
    }

    if(evt==='invalidate'){
      /* Reset semua loaded flags */
      ['_dashLoaded','_monLoaded','_insLoaded','_rptLoaded','_fdbLoaded',
       '_pelLoaded','_odpLoaded','_odcLoaded','_invMatiLoaded','_invMutLoaded'
      ].forEach(function(f){ if(typeof window[f]!=='undefined') window[f]=false; });
      window._dashLastLoad = 0;
      if(typeof window._monData!=='undefined')
        window._monData = { olt:[], odc:[], odp:[], port:[] };
      /* Hapus private caches modul lain */
      window._fdbWilayahCache = null;
      if(typeof window._sdPelData !=='undefined') window._sdPelData  = [];
      if(typeof window._sdOdpData !=='undefined') window._sdOdpData  = [];
      if(typeof window._sdOdcData !=='undefined') window._sdOdcData  = [];
    }

    if(evt==='refresh' && typeof dashLoad==='function' && !window._dashLoaded){
      setTimeout(dashLoad, 150);
    }
  });

  /* Helper global */
  /* Auto-load SOT setelah login */
  var _origLoginOK = window._loginOK;
  if(typeof _origLoginOK==='function' && !_origLoginOK._sotPatched){
    window._loginOK = function(usr){
      _origLoginOK.apply(this, arguments);
      setTimeout(function(){ SOT.refresh(true); }, 600);
    };
    window._loginOK._sotPatched = true;
  }

  /* SOT.invalidate() setelah setiap write operation */
  ['areaSave','areaDelete','oltSave','oltDelete','odcSave','odcDelete',
   'odpSave','odpDelete','portSave','portDelete','pelSave','pelDelete',
   'appSave','otfSave','recSave','dmtSave','dmtAdvance',
   'mntWsSubmitOdp','mntWsSubmitOdc','mntWsSubmitPel'
  ].forEach(function(name){
    var _orig = window[name];
    if(typeof _orig!=='function' || _orig._sotPatched) return;
    window[name] = function(){
      var r = _orig.apply(this, arguments);
      if(r && typeof r.then==='function') r.then(function(){ SOT.invalidate('general'); }).catch(function(){});
      return r;
    };
    window[name]._sotPatched = true;
  });

  /* Auto-load SOT on startup */
  setTimeout(function(){
    var tryLoad = function(n){
      if(typeof getSB!=='function' || !getSB()){
        if(n<12) setTimeout(function(){ tryLoad(n+1); }, 1000);
        return;
      }
      if(window.CU) SOT.refresh(true, function(c){

      });
    };
    tryLoad(0);
  }, 2500);


  /* _ensureAreas/_ensureOdps/_ensureOdcs didefinisikan di Phase 3 (dual-API) */
})();

/* ══════════════════════════════════════════════════════════════
   SOT AUDIT & MIGRATION SQL — dijalankan 1x di Supabase
   Panggil: SOT_showAudit()  →  audit violations
   Panggil: SOT_getMigrationSQL()  →  dapatkan SQL
══════════════════════════════════════════════════════════════ */
window.SOT_showAudit = function(){
  SOT.refresh(true, function(c){
    var ps  = SOT.portStats();
    var pel = SOT.pelStats();
    var noArea     = c.pelanggan.filter(function(p){ return !p.area_id; }).length;
    var noOdp      = c.pelanggan.filter(function(p){ return p.status==='aktif'&&!p.odp_id; }).length;
    var orphanPort = c.ports.filter(function(p){
      return PORT_STATUS.isUsed(p.status) && !p.cid_pelanggan && !p.pel_id;
    }).length;
    alert(
      '════ SOT AUDIT v22 ════\n'+
      'Area: '+c.areas.length+'  ODC: '+c.odcs.length+'\n'+
      'ODP: '+c.odps.length+'  Port: '+ps.total+
        ' (terpakai:'+ps.used+' kosong:'+ps.free+' rusak:'+ps.damaged+')\n'+
      'Pelanggan: '+pel.total+' (berbayar:'+pel.berbayar+
        ' aktif:'+pel.aktif+' suspend:'+pel.suspend+' cabut:'+pel.cabut+')\n'+
      '──── SSOT Violations ────\n'+
      '  Tanpa area_id   : '+noArea    +(noArea    ?' ⚠':' ✓')+'\n'+
      '  Aktif tanpa ODP : '+noOdp     +(noOdp     ?' ⚠':' ✓')+'\n'+
      '  Port orphan     : '+orphanPort+(orphanPort?' ⚠':' ✓')+'\n'+
      '──────────────────────\n'+
      'SOT_getMigrationSQL() → SQL untuk Supabase'
    );
  });
};

