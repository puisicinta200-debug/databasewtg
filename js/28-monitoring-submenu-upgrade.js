/* =====================================================================
   PATCH 28 — MONITORING JARINGAN: ROMBAK SUB-MENU (TAHAP 2)
   ---------------------------------------------------------------------
   File ini TIDAK mengedit js/03-app-core.js. Fungsi pengambilan data
   (monOltLoad, monOdcLoad, monOdpLoad, monPortLoad, monMasalahLoad)
   dan fungsi pencarian/paginasi yang SUDAH ADA dan sudah berjalan baik
   TIDAK diganggu — hanya fungsi RENDER (tampilan) yang ditingkatkan:
   filter status, toggle Grid/Tabel, bar utilisasi, dan info sinyal.

   CATATAN PENTING soal "Peta Jaringan":
   Setelah dicek, halaman ini TERNYATA SUDAH sangat lengkap — peta
   Leaflet asli, citra satelit + auto-alih ke peta jalan, GPS "Lokasi
   Saya", pencarian, filter area, legenda, popup detail. Jadi SENGAJA
   TIDAK dirombak/diganti supaya tidak merusak yang sudah bagus.
   Kalau nanti ada yang spesifik ingin ditambah di Peta Jaringan,
   sebutkan saja secara terpisah.
===================================================================== */
(function(){
  'use strict';

  function esc(s){ return (typeof _monEsc === 'function') ? _monEsc(s) : String(s == null ? '' : s); }
  function areaName(id){ return (typeof _monAreaName === 'function') ? _monAreaName(id) : (id || '—'); }

  /* ================= data tambahan (di-cache sekali per sesi) ================= */
  var _odcOltMap = null;   // odc_id -> olt_id (kolom ini tidak ikut di cache utama)
  function fetchOdcOltMapOnce(cb){
    if (_odcOltMap){ cb(_odcOltMap); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ cb({}); return; }
    sb.from('odcs').select('id,olt_id').limit(5000).then(function(r){
      var map = {}; (r.data || []).forEach(function(o){ if (o.olt_id) map[o.id] = o.olt_id; });
      _odcOltMap = map; cb(map);
    }).catch(function(){ cb({}); });
  }
  var _signalMap = null;   // "odp_id::nomor_port" -> dBm (kolom ini juga tidak ikut cache utama)
  function fetchSignalMapOnce(cb){
    if (_signalMap){ cb(_signalMap); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ cb({}); return; }
    sb.from('odp_ports').select('odp_id,nomor_port,sinyal_dbm').not('sinyal_dbm', 'is', null).limit(5000).then(function(r){
      var map = {}; (r.data || []).forEach(function(p){ map[p.odp_id + '::' + p.nomor_port] = parseFloat(p.sinyal_dbm); });
      _signalMap = map; cb(map);
    }).catch(function(){ cb({}); });
  }
  function signalOfPort(odpId, nomorPort){
    if (!_signalMap) return null;
    var v = _signalMap[odpId + '::' + nomorPort];
    return (v == null || isNaN(v)) ? null : v;
  }
  function signalClass(dbm){
    if (dbm == null) return { c: 'var(--text3)', label: '—' };
    if (dbm >= -25) return { c: 'var(--green)', label: 'Baik' };
    if (dbm >= -30) return { c: 'var(--yellow)', label: 'Waspada' };
    return { c: 'var(--red)', label: 'Kritis' };
  }
  function avgSignalForOdp(odpId, jumlahPort){
    if (!_signalMap) return null;
    var vals = [];
    for (var i = 1; i <= (jumlahPort || 0); i++){ var v = _signalMap[odpId + '::' + i]; if (v != null && !isNaN(v)) vals.push(v); }
    if (!vals.length) return null;
    return Math.round((vals.reduce(function(a,b){return a+b;},0) / vals.length) * 10) / 10;
  }

  /* ================= util kecil bersama ================= */
  function chipBarHTML(items, activeVal, onFn){
    return '<div style="display:flex;gap:6px;flex-wrap:wrap;overflow-x:auto;margin-bottom:10px">' +
      items.map(function(it){
        var val = it[0], label = it[1], col = it[2] || 'var(--c1)';
        var active = (activeVal || '') === val;
        return '<button type="button" onclick="' + onFn + '(\'' + val + '\')" style="flex-shrink:0;font-size:11px;font-weight:700;padding:7px 12px;border-radius:20px;cursor:pointer;font-family:Sora,sans-serif;border:1.5px solid ' +
          (active ? col : 'var(--border2)') + ';background:' + (active ? col : 'var(--bg2)') + ';color:' + (active ? '#fff' : 'var(--text)') + '">' + label + '</button>';
      }).join('') + '</div>';
  }
  // Tombol ikon kecil di SISI KANAN kotak pencarian (bukan tombol/baris
  // header terpisah) — dipasang sekali per tab dengan menjadikan wrapper
  // input pencarian sebagai posisi relative kalau belum.
  function mountViewToggle(searchInputId, prefix){
    var input = document.getElementById(searchInputId);
    if (!input) return;
    var wrap = input.parentElement;
    if (!wrap) return;
    if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    var btn = document.getElementById(prefix + '-viewbtn');
    if (!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = prefix + '-viewbtn';
      btn.onclick = function(){ window._wtgToggleView(prefix); };
      btn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:8px;border:none;background:var(--bg4);color:var(--text2);display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation';
      wrap.appendChild(btn);
      input.style.paddingRight = '42px';
    }
    var key = prefix.replace('mon-', '');
    btn.innerHTML = '<i class="ti ' + (_viewMode[key] === 'grid' ? 'ti-list' : 'ti-layout-grid') + '" style="font-size:14px"></i>';
    btn.title = _viewMode[key] === 'grid' ? 'Tampilan tabel' : 'Tampilan grid';
  }
  var _viewMode = { olt: 'grid', odc: 'grid', odp: 'grid' };
  window._wtgToggleView = function(prefix){
    var key = prefix.replace('mon-', '');
    _viewMode[key] = _viewMode[key] === 'grid' ? 'table' : 'grid';
    if (key === 'olt') monOltRender();
    if (key === 'odc') monOdcRender();
    if (key === 'odp') monOdpRender();
  };
  function pctColor(pct){ return pct >= 85 ? 'var(--red)' : pct >= 60 ? 'var(--yellow)' : 'var(--c1)'; }
  function utilBarHTML(pct, used, cap){
    return '<div style="margin-top:6px">' +
      '<div style="height:5px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + Math.min(100, pct) + '%;background:' + pctColor(pct) + ';border-radius:3px"></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:9.5px;color:var(--text3);margin-top:3px"><span>' + used + '/' + cap + ' port</span><span style="font-weight:700;color:' + pctColor(pct) + '">' + pct + '%</span></div>' +
    '</div>';
  }

  /* =====================================================================
     OLT — ditingkatkan penuh: filter status + utilisasi + Grid/Tabel
  ===================================================================== */
  var _monOltFilStatus = '';
  window._wtgOltFilStatus = function(v){ _monOltFilStatus = v; monOltRender(); };

  function oltAggUtil(olt, odcOltMap, cache){
    var myOdcIds = Object.keys(odcOltMap).filter(function(id){ return odcOltMap[id] === olt.id; });
    var myOdps = (cache.odps || []).filter(function(p){ return myOdcIds.indexOf(p.odc_id) >= 0; });
    var oids = {}; myOdps.forEach(function(p){ oids[p.id] = 1; });
    var cap = myOdps.reduce(function(s, p){ return s + (parseInt(p.jumlah_port) || 0); }, 0);
    var used = (cache.ports || []).filter(function(p){ return oids[p.odp_id] && p.status === 'terpakai'; }).length;
    return { cap: cap, used: used, pct: cap ? Math.round(used / cap * 100) : 0, odcCount: myOdcIds.length, odpCount: myOdps.length };
  }

  window.monOltRender = function(q){
    fetchOdcOltMapOnce(function(map){
      q = q !== undefined ? q : ((document.getElementById('mon-olt-search') || {}).value || '');
      var data = (typeof _monOltFiltered === 'function') ? _monOltFiltered(q) : (window._monOltData || []);
      if (_monOltFilStatus) data = data.filter(function(o){ return o.status === _monOltFilStatus; });

      var total = data.length, aktif = data.filter(function(o){ return o.status === 'aktif'; }).length,
          maint = data.filter(function(o){ return o.status === 'maintenance'; }).length,
          down = data.filter(function(o){ return o.status === 'down'; }).length;
      var statsEl = document.getElementById('mon-olt-stats');
      if (statsEl){
        statsEl.style.gridTemplateColumns = 'repeat(4,1fr)';
        statsEl.innerHTML = [['var(--c1)', 'Total', total], ['var(--green)', 'Aktif', aktif], ['var(--yellow)', 'Maint.', maint], ['var(--red)', 'Down', down]].map(function(x){
          return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px 6px;border:1.5px solid var(--border);text-align:center"><div style="font-size:18px;font-weight:800;color:' + x[0] + '">' + x[2] + '</div><div style="font-size:9px;font-weight:700;color:var(--text3)">' + x[1].toUpperCase() + '</div></div>';
        }).join('');
      }

      var chipHost = document.getElementById('mon-olt-chips');
      if (!chipHost){
        chipHost = document.createElement('div'); chipHost.id = 'mon-olt-chips';
        statsEl.insertAdjacentElement('beforebegin', chipHost);
      }
      chipHost.innerHTML = chipBarHTML([['', 'Semua Status'], ['aktif', 'Aktif', 'var(--green)'], ['maintenance', 'Maintenance', 'var(--yellow)'], ['down', 'Down', 'var(--red)']], _monOltFilStatus, '_wtgOltFilStatus');
      mountViewToggle('mon-olt-search', 'mon-olt');

      var list = document.getElementById('mon-olt-list');
      if (!list) return;
      if (!data.length){ list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">Tidak ada OLT</div>'; return; }

      var cache = (typeof _monGetScopedCache === 'function') ? _monGetScopedCache() : { odps: [], ports: [] };

      if (_viewMode.olt === 'table'){
        list.innerHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">' +
          '<thead><tr style="background:var(--bg3)">' + ['Kode', 'Area', 'Status', 'Utilisasi', 'ODC'].map(function(h){ return '<th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;white-space:nowrap">' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
          data.map(function(o){
            var u = oltAggUtil(o, map, cache);
            var stColor = o.status === 'aktif' ? 'var(--green)' : o.status === 'maintenance' ? 'var(--yellow)' : 'var(--red)';
            return '<tr style="border-top:1px solid var(--border)">' +
              '<td style="padding:8px 10px;font-family:monospace;font-weight:700;color:var(--text)">' + esc(o.kode) + '</td>' +
              '<td style="padding:8px 10px;color:var(--text2)">' + esc(areaName(o.area_id)) + '</td>' +
              '<td style="padding:8px 10px"><span style="font-size:9.5px;font-weight:700;padding:2px 8px;border-radius:20px;background:' + stColor + '18;color:' + stColor + '">' + esc(o.status) + '</span></td>' +
              '<td style="padding:8px 10px;width:100px"><div style="display:flex;align-items:center;gap:5px"><div style="flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + Math.min(100, u.pct) + '%;background:' + pctColor(u.pct) + '"></div></div><span style="font-size:9.5px;color:var(--text3)">' + u.pct + '%</span></div></td>' +
              '<td style="padding:8px 10px;color:var(--text2)">' + u.odcCount + '</td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>';
      } else {
        list.innerHTML = data.map(function(o){
          var u = oltAggUtil(o, map, cache);
          var stColor = o.status === 'aktif' ? 'var(--green)' : o.status === 'maintenance' ? 'var(--yellow)' : 'var(--red)';
          return '<div style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
              '<div><div style="font-size:10px;font-family:monospace;color:var(--text3)">' + esc(o.kode || '—') + '</div>' +
              '<div style="font-size:13px;font-weight:800;color:var(--text)">' + esc(o.nama || '—') + '</div></div>' +
              '<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:' + stColor + '18;color:' + stColor + '">' + esc(o.status || '—') + '</span>' +
            '</div>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:2px">' +
              '<span style="font-size:10px;color:var(--text3)"><i class="ti ti-map-pin" style="font-size:11px"></i> ' + esc(areaName(o.area_id)) + '</span>' +
              '<span style="font-size:10px;color:var(--text3)"><i class="ti ti-box" style="font-size:11px"></i> ' + u.odcCount + ' ODC · ' + u.odpCount + ' ODP</span>' +
              (o.lokasi ? '<span style="font-size:10px;color:var(--text3)">' + esc(o.lokasi) + '</span>' : '') +
            '</div>' +
            (u.cap > 0 ? utilBarHTML(u.pct, u.used, u.cap) : '') +
          '</div>';
        }).join('') + (typeof _monPagiHTML === 'function' ? _monPagiHTML(window._monOltPage || 1, total, window._monPgSize || total, 'monOltPageNav(-1)', 'monOltPageNav(1)') : '');
      }
    });
  };

  /* =====================================================================
     ODC — tambah filter status + bar utilisasi port + Grid/Tabel
  ===================================================================== */
  var _monOdcFilStatus = '';
  window._wtgOdcFilStatus = function(v){ _monOdcFilStatus = v; monOdcRender(); };

  function odcUtil(odc, cache){
    var myOdps = (cache.odps || []).filter(function(p){ return p.odc_id === odc.id; });
    var oids = {}; myOdps.forEach(function(p){ oids[p.id] = 1; });
    var cap = myOdps.reduce(function(s, p){ return s + (parseInt(p.jumlah_port) || 0); }, 0);
    var used = (cache.ports || []).filter(function(p){ return oids[p.odp_id] && p.status === 'terpakai'; }).length;
    return { cap: cap, used: used, pct: cap ? Math.round(used / cap * 100) : 0, odpCount: myOdps.length };
  }

  var _origMonOdcFiltered = window._monOdcFiltered;
  window._monOdcFiltered = function(q, fA){
    var data = typeof _origMonOdcFiltered === 'function' ? _origMonOdcFiltered(q, fA) : (window._monOdcData || []);
    if (_monOdcFilStatus) data = data.filter(function(o){ return o.status === _monOdcFilStatus; });
    return data;
  };

  window.monOdcRender = function(q){
    q = q !== undefined ? q : ((document.getElementById('mon-odc-search') || {}).value || '');
    var fA = (document.getElementById('mon-odc-fil-area') || {}).value || '';
    var data = window._monOdcFiltered(q, fA);
    var total = data.length, aktif = data.filter(function(o){ return o.status === 'aktif'; }).length, maint = data.filter(function(o){ return o.status === 'maintenance'; }).length;
    var statsEl = document.getElementById('mon-odc-stats');
    if (statsEl) statsEl.innerHTML = [['var(--c2)', 'Total', total], ['var(--green)', 'Aktif', aktif], ['var(--yellow)', 'Maintenance', maint]].map(function(x){
      return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px;border:1.5px solid var(--border);text-align:center"><div style="font-size:20px;font-weight:800;color:' + x[0] + '">' + x[2] + '</div><div style="font-size:10px;font-weight:700;color:var(--text3)">' + x[1].toUpperCase() + '</div></div>';
    }).join('');

    var chipHost = document.getElementById('mon-odc-chips');
    if (!chipHost){ chipHost = document.createElement('div'); chipHost.id = 'mon-odc-chips'; statsEl.insertAdjacentElement('beforebegin', chipHost); }
    chipHost.innerHTML = chipBarHTML([['', 'Semua Status'], ['aktif', 'Aktif', 'var(--green)'], ['maintenance', 'Maintenance', 'var(--yellow)']], _monOdcFilStatus, '_wtgOdcFilStatus');
    mountViewToggle('mon-odc-search', 'mon-odc');

    var pgSize = window._monPgSize || total;
    var pages = Math.max(1, Math.ceil(total / pgSize));
    if ((window._monOdcPage || 1) > pages) window._monOdcPage = 1;
    var slice = data.slice(((window._monOdcPage || 1) - 1) * pgSize, (window._monOdcPage || 1) * pgSize);
    var cache = (typeof _monGetScopedCache === 'function') ? _monGetScopedCache() : { odps: [], ports: [] };
    var list = document.getElementById('mon-odc-list');
    if (!list) return;
    if (!slice.length){ list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">Tidak ada ODC</div>'; return; }

    if (_viewMode.odc === 'table'){
      list.innerHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">' +
        '<thead><tr style="background:var(--bg3)">' + ['Kode', 'Area', 'Status', 'Utilisasi', 'ODP'].map(function(h){ return '<th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;white-space:nowrap">' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
        slice.map(function(o){
          var u = odcUtil(o, cache);
          var stColor = o.status === 'aktif' ? 'var(--green)' : o.status === 'maintenance' ? 'var(--yellow)' : 'var(--red)';
          return '<tr onclick="monOdcDetail(\'' + o.id + '\')" style="border-top:1px solid var(--border);cursor:pointer">' +
            '<td style="padding:8px 10px;font-family:monospace;font-weight:700;color:var(--text)">' + esc(o.kode) + '</td>' +
            '<td style="padding:8px 10px;color:var(--text2)">' + esc(areaName(o.area_id)) + '</td>' +
            '<td style="padding:8px 10px"><span style="font-size:9.5px;font-weight:700;padding:2px 8px;border-radius:20px;background:' + stColor + '18;color:' + stColor + '">' + esc(o.status) + '</span></td>' +
            '<td style="padding:8px 10px;width:100px"><div style="display:flex;align-items:center;gap:5px"><div style="flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + Math.min(100, u.pct) + '%;background:' + pctColor(u.pct) + '"></div></div><span style="font-size:9.5px;color:var(--text3)">' + u.pct + '%</span></div></td>' +
            '<td style="padding:8px 10px;color:var(--text2)">' + u.odpCount + '</td>' +
          '</tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      list.innerHTML = slice.map(function(o){
        var stColor = o.status === 'aktif' ? 'var(--green)' : o.status === 'maintenance' ? 'var(--yellow)' : 'var(--red)';
        var u = odcUtil(o, cache);
        return '<div onclick="monOdcDetail(\'' + o.id + '\')" style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px;cursor:pointer">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
            '<div><div style="font-size:10px;font-family:monospace;color:var(--text3)">' + esc(o.kode || '—') + '</div>' +
            '<div style="font-size:13px;font-weight:800;color:var(--text)">' + esc(o.nama || '—') + '</div></div>' +
            '<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:' + stColor + '18;color:' + stColor + '">' + esc(o.status || '—') + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
            '<span style="font-size:10px;color:var(--text3)"><i class="ti ti-map-pin" style="font-size:11px"></i> ' + esc(areaName(o.area_id)) + '</span>' +
            '<span style="font-size:10px;color:var(--text3)">' + u.odpCount + ' ODP</span>' +
          '</div>' +
          (u.cap > 0 ? utilBarHTML(u.pct, u.used, u.cap) : '') +
          '<div style="font-size:10px;color:var(--c1);font-weight:600;display:flex;align-items:center;gap:4px;margin-top:6px"><i class="ti ti-chevron-right" style="font-size:12px"></i> Tap untuk lihat ODP</div>' +
        '</div>';
      }).join('') + (typeof _monPagiHTML === 'function' ? _monPagiHTML(window._monOdcPage || 1, total, pgSize, 'monOdcPageNav(-1)', 'monOdcPageNav(1)') : '');
    }
  };

  /* =====================================================================
     ODP — tambah Grid/Tabel + badge kualitas sinyal rata-rata
  ===================================================================== */
  window.monOdpRender = function(q){
    fetchSignalMapOnce(function(){
      q = q !== undefined ? q : ((document.getElementById('mon-odp-search') || {}).value || '');
      var fA = (document.getElementById('mon-odp-fil-area') || {}).value || '';
      var data = (typeof _monOdpFiltered === 'function') ? _monOdpFiltered(q, fA) : (window._monOdpData || []);
      var total = data.length, aktif = data.filter(function(o){ return o.status === 'aktif'; }).length;
      var penuh = 0; data.forEach(function(o){ var ps = typeof SOT !== 'undefined' ? SOT.odpStats(o.id) : { pct: 0 }; if (ps.pct >= 100) penuh++; });
      var statsEl = document.getElementById('mon-odp-stats');
      if (statsEl) statsEl.innerHTML = [['var(--green)', 'Total', total], ['var(--c1)', 'Aktif', aktif], ['var(--red)', 'Penuh', penuh]].map(function(x){
        return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px;border:1.5px solid var(--border);text-align:center"><div style="font-size:20px;font-weight:800;color:' + x[0] + '">' + x[2] + '</div><div style="font-size:10px;font-weight:700;color:var(--text3)">' + x[1].toUpperCase() + '</div></div>';
      }).join('');

      mountViewToggle('mon-odp-search', 'mon-odp');

      var pgSize = window._monPgSize || total;
      var pages = Math.max(1, Math.ceil(total / pgSize));
      if ((window._monOdpPage || 1) > pages) window._monOdpPage = 1;
      var slice = data.slice(((window._monOdpPage || 1) - 1) * pgSize, (window._monOdpPage || 1) * pgSize);
      var list = document.getElementById('mon-odp-list');
      if (!list) return;
      if (!slice.length){ list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">Tidak ada ODP</div>'; return; }

      if (_viewMode.odp === 'table'){
        list.innerHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">' +
          '<thead><tr style="background:var(--bg3)">' + ['Kode', 'Area', 'Status', 'Utilisasi', 'Sinyal'].map(function(h){ return '<th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;white-space:nowrap">' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
          slice.map(function(o){
            var ps = typeof SOT !== 'undefined' ? SOT.odpStats(o.id) : { total: parseInt(o.jumlah_port) || 0, used: 0, pct: 0 };
            var sig = avgSignalForOdp(o.id, o.jumlah_port); var si = signalClass(sig);
            var stColor = o.status === 'aktif' ? 'var(--green)' : o.status === 'maintenance' ? 'var(--yellow)' : 'var(--red)';
            return '<tr onclick="monOdpDetail(\'' + o.id + '\')" style="border-top:1px solid var(--border);cursor:pointer">' +
              '<td style="padding:8px 10px;font-family:monospace;font-weight:700;color:var(--text)">' + esc(o.kode) + '</td>' +
              '<td style="padding:8px 10px;color:var(--text2)">' + esc(areaName(o.area_id)) + '</td>' +
              '<td style="padding:8px 10px"><span style="font-size:9.5px;font-weight:700;padding:2px 8px;border-radius:20px;background:' + stColor + '18;color:' + stColor + '">' + esc(o.status) + '</span></td>' +
              '<td style="padding:8px 10px;width:90px"><div style="display:flex;align-items:center;gap:5px"><div style="flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + Math.min(100, ps.pct) + '%;background:' + pctColor(ps.pct) + '"></div></div><span style="font-size:9.5px;color:var(--text3)">' + ps.pct + '%</span></div></td>' +
              '<td style="padding:8px 10px;font-weight:700;color:' + si.c + '">' + (sig != null ? sig + ' dBm' : '—') + '</td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>';
      } else {
        list.innerHTML = slice.map(function(o){
          var ps = typeof SOT !== 'undefined' ? SOT.odpStats(o.id) : { total: parseInt(o.jumlah_port) || 0, used: 0, free: 0, pct: 0 };
          var pct = ps.pct || 0;
          var stColor = o.status === 'aktif' ? 'var(--green)' : o.status === 'maintenance' ? 'var(--yellow)' : 'var(--red)';
          var sig = avgSignalForOdp(o.id, o.jumlah_port); var si = signalClass(sig);
          return '<div onclick="monOdpDetail(\'' + o.id + '\')" style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px;cursor:pointer">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">' +
              '<div style="flex:1;min-width:0">' +
                '<div style="font-size:10px;font-family:monospace;color:var(--text3)">' + esc(o.kode || '—') + '</div>' +
                '<div style="font-size:12px;font-weight:800;color:var(--text)">' + esc(o.nama || '—') + '</div>' +
                '<div style="display:flex;align-items:center;gap:6px;margin-top:2px">' +
                  '<span style="font-size:10px;color:var(--text3)">' + esc(areaName(o.area_id)) + '</span>' +
                  (sig != null ? '<span style="font-size:10px;font-weight:700;color:' + si.c + '"><i class="ti ti-antenna-bars-5" style="font-size:11px"></i> ' + sig + ' dBm</span>' : '') +
                '</div>' +
              '</div>' +
              '<div style="text-align:right;flex-shrink:0">' +
                '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:' + stColor + '18;color:' + stColor + '">' + esc(o.status || '—') + '</span>' +
                '<div style="font-size:13px;font-weight:800;color:' + pctColor(pct) + ';margin-top:4px">' + pct + '%</div>' +
              '</div>' +
            '</div>' +
            '<div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden;margin-bottom:4px"><div style="height:100%;width:' + Math.min(100, pct) + '%;background:' + pctColor(pct) + ';border-radius:3px"></div></div>' +
            '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);font-weight:600">' +
              '<span>' + ps.used + ' terpakai · ' + ps.free + ' kosong · ' + ps.total + ' port</span>' +
              '<span style="color:var(--c1)"><i class="ti ti-chevron-right" style="font-size:11px"></i> Detail port</span>' +
            '</div>' +
          '</div>';
        }).join('') + (typeof _monPagiHTML === 'function' ? _monPagiHTML(window._monOdpPage || 1, total, pgSize, 'monOdpPageNav(-1)', 'monOdpPageNav(1)') : '');
      }
    });
  };

  /* =====================================================================
     CEK PORT (tab "port") — tambah pintasan cepat + info sinyal per baris
  ===================================================================== */
  window._wtgCekPortQuick = function(kind){
    var searchEl = document.getElementById('mon-port-search');
    var statusEl = document.getElementById('mon-port-fil-status');
    if (searchEl) searchEl.value = '';
    if (statusEl) statusEl.value = kind === 'rusak' ? 'rusak' : '';
    window._wtgCekPortQuickKind = kind;
    monPortRender();
  };

  var _origMonPortRenderPage = window._monPortRenderPage;
  window._monPortRenderPage = function(){
    fetchSignalMapOnce(function(){
      var quick = window._wtgCekPortQuickKind;
      var baseFil = (window._monPortFil || []).slice();
      var fil = baseFil;
      if (quick === 'kritis') fil = fil.filter(function(p){ var v = signalOfPort(p.odp_id, p.nomor_port); return v != null && v < -30; });
      else if (quick === 'belum') fil = fil.filter(function(p){ return p.status === 'terpakai' && signalOfPort(p.odp_id, p.nomor_port) == null; });

      window._monPortFil = fil;
      if (typeof _origMonPortRenderPage === 'function') _origMonPortRenderPage();
      window._monPortFil = baseFil;

      var list = document.getElementById('mon-port-list');
      if (!list) return;
      var rows = list.querySelectorAll(':scope > div');
      var pgSize = window._monPgSize || fil.length;
      var slice = fil.slice((window._monPortOffset || 0) * pgSize, ((window._monPortOffset || 0) + 1) * pgSize);
      slice.forEach(function(p, i){
        var row = rows[i]; if (!row) return;
        var v = signalOfPort(p.odp_id, p.nomor_port);
        if (v == null) return;
        var si = signalClass(v);
        var badge = document.createElement('span');
        badge.style.cssText = 'font-family:monospace;font-size:10.5px;font-weight:700;color:' + si.c + ';flex-shrink:0;margin-left:6px';
        badge.textContent = v + ' dBm';
        row.appendChild(badge);
      });
    });
  };

  var _quickBarInserted = false;
  var _origMonPortLoad = window.monPortLoad;
  window.monPortLoad = function(){
    if (typeof _origMonPortLoad === 'function') _origMonPortLoad();
    if (!_quickBarInserted){
      var statsEl = document.getElementById('mon-port-stats');
      if (statsEl && statsEl.parentNode){
        var bar = document.createElement('div');
        bar.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap';
        bar.innerHTML =
          '<button onclick="_wtgCekPortQuick(\'kritis\')" style="flex:1;min-width:100px;text-align:left;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:10px 12px;cursor:pointer">' +
            '<div style="font-size:9.5px;font-weight:700;color:var(--text3);text-transform:uppercase">Sinyal Kritis</div>' +
            '<div style="font-size:10px;color:var(--red);font-weight:700;margin-top:2px"><i class="ti ti-alert-triangle" style="font-size:11px"></i> &lt; -30 dBm</div>' +
          '</button>' +
          '<button onclick="_wtgCekPortQuick(\'rusak\')" style="flex:1;min-width:100px;text-align:left;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:10px 12px;cursor:pointer">' +
            '<div style="font-size:9.5px;font-weight:700;color:var(--text3);text-transform:uppercase">Port Rusak</div>' +
            '<div style="font-size:10px;color:var(--red);font-weight:700;margin-top:2px"><i class="ti ti-plug-x" style="font-size:11px"></i> Perlu dicek</div>' +
          '</button>' +
          '<button onclick="_wtgCekPortQuick(\'belum\')" style="flex:1;min-width:100px;text-align:left;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:10px 12px;cursor:pointer">' +
            '<div style="font-size:9.5px;font-weight:700;color:var(--text3);text-transform:uppercase">Belum Dicek</div>' +
            '<div style="font-size:10px;color:var(--yellow);font-weight:700;margin-top:2px"><i class="ti ti-clock" style="font-size:11px"></i> Data sinyal kosong</div>' +
          '</button>' +
          '<button onclick="_wtgCekPortQuick(null)" style="flex:0 0 auto;background:var(--bg3);border:1.5px solid var(--border2);border-radius:12px;padding:10px 12px;cursor:pointer;color:var(--text3);font-size:10px;font-weight:700">Reset</button>';
        statsEl.insertAdjacentElement('afterend', bar);
        _quickBarInserted = true;
      }
    }
  };

  /* =====================================================================
     MASALAH — tambah ringkasan & filter tingkat keparahan + kategori
  ===================================================================== */
  var _masalahSev = 'all', _masalahKat = 'all';
  window._wtgMasalahSev = function(v){ _masalahSev = v; monMasalahLoad(); };
  window._wtgMasalahKat = function(v){ _masalahKat = v; monMasalahLoad(); };

  window.monMasalahLoad = function(){
    var c = (typeof _monGetScopedCache === 'function') ? _monGetScopedCache() : { odcs: [], odps: [], ports: [] };
    var list = document.getElementById('mon-masalah-list');
    if (!list) return;

    var masalah = [];
    (window._monOltData || []).filter(function(o){ return o.status !== 'aktif'; }).forEach(function(o){
      masalah.push({ sev: 'high', ikon: 'ti-antenna', kat: 'OLT', judul: 'OLT ' + o.kode + ' — ' + o.status, detail: 'Area: ' + areaName(o.area_id) });
    });
    (c.odcs || []).filter(function(o){ return o.status !== 'aktif'; }).forEach(function(o){
      masalah.push({ sev: 'medium', ikon: 'ti-box', kat: 'ODC', judul: 'ODC ' + o.kode + ' — ' + o.status, detail: 'Area: ' + areaName(o.area_id) });
    });
    (c.ports || []).filter(function(p){ return p.status === 'rusak'; }).forEach(function(p){
      masalah.push({ sev: 'medium', ikon: 'ti-plug-x', kat: 'Port', judul: 'Port ' + (p.nomor_port || '?') + ' rusak', detail: 'ODP terkait perlu diperiksa teknisi' });
    });
    (c.odps || []).filter(function(o){ return o.status !== 'aktif' && o.status !== 'full'; }).forEach(function(o){
      masalah.push({ sev: 'low', ikon: 'ti-plug', kat: 'ODP', judul: 'ODP ' + o.kode + ' non-aktif', detail: 'Status: ' + o.status + ' · ' + areaName(o.area_id) });
    });

    var sevCount = { high: masalah.filter(function(m){ return m.sev === 'high'; }).length, medium: masalah.filter(function(m){ return m.sev === 'medium'; }).length, low: masalah.filter(function(m){ return m.sev === 'low'; }).length };
    var sevColor = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--c1)' };
    var sevLabel = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

    var summary = document.getElementById('mon-masalah-summary');
    if (!summary){
      summary = document.createElement('div'); summary.id = 'mon-masalah-summary';
      list.parentNode.insertBefore(summary, list);
    }
    summary.innerHTML =
      '<div style="display:flex;gap:8px;margin-bottom:10px">' +
        ['high', 'medium', 'low'].map(function(s){
          return '<button onclick="_wtgMasalahSev(\'' + (_masalahSev === s ? 'all' : s) + '\')" style="flex:1;text-align:center;background:var(--bg2);border:1.5px solid ' + (_masalahSev === s ? sevColor[s] : 'var(--border)') + ';border-radius:12px;padding:10px;cursor:pointer">' +
            '<div style="font-size:19px;font-weight:800;color:' + sevColor[s] + '">' + sevCount[s] + '</div><div style="font-size:9px;font-weight:700;color:var(--text3)">' + sevLabel[s].toUpperCase() + '</div></button>';
        }).join('') +
      '</div>' +
      chipBarHTML([['all', 'Semua Kategori'], ['OLT', 'OLT'], ['ODC', 'ODC'], ['ODP', 'ODP'], ['Port', 'Port']], _masalahKat, '_wtgMasalahKat');

    var filtered = masalah.filter(function(m){ return (_masalahSev === 'all' || m.sev === _masalahSev) && (_masalahKat === 'all' || m.kat === _masalahKat); });

    if (!filtered.length){
      list.innerHTML = '<div style="padding:50px 20px;text-align:center"><div style="width:60px;height:60px;border-radius:16px;background:var(--gng2);display:flex;align-items:center;justify-content:center;margin:0 auto 14px"><i class="ti ti-circle-check" style="font-size:28px;color:var(--green)"></i></div><div style="font-size:15px;font-weight:800;color:var(--green);margin-bottom:6px">Semua Normal</div><div style="font-size:12px;color:var(--text3)">Tidak ada masalah sesuai filter yang dipilih</div></div>';
      return;
    }
    var sevBg = { high: 'var(--rg2)', medium: 'var(--yg)', low: 'var(--c1b)' };
    list.innerHTML = '<div style="margin-bottom:8px;font-size:11px;font-weight:700;color:var(--text3)">' + filtered.length + ' masalah ditampilkan</div>' +
      filtered.map(function(m){
        var col = sevColor[m.sev] || 'var(--text3)', bg = sevBg[m.sev] || 'var(--bg3)';
        return '<div style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px;display:flex;align-items:flex-start;gap:10px">' +
          '<div style="width:34px;height:34px;border-radius:10px;background:' + bg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ' + m.ikon + '" style="font-size:16px;color:' + col + '"></i></div>' +
          '<div style="flex:1;min-width:0">' +
            '<span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:20px;background:' + bg + ';color:' + col + '">' + m.kat + '</span>' +
            '<div style="font-size:12px;font-weight:700;color:var(--text);margin-top:3px">' + esc(m.judul) + '</div>' +
            '<div style="font-size:11px;color:var(--text3)">' + esc(m.detail) + '</div>' +
          '</div></div>';
      }).join('');
  };

})();
