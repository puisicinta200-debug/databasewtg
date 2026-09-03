

(function(){
'use strict';

var _invLapPeriode = 'semua';
var _invLapCache   = { ts:0, data:null, ttl:120000 };
var _invLapPageState = {};
var _invLapOpenItem  = {};
var _invLapOpenDetail = {};
var _invLapActPage   = {}; /* pagination aktivitas terbaru per item-card, terpisah dari pagination halaman ringkasan */

function invLapToggleItem(itemId){
  _invLapOpenItem[itemId] = !_invLapOpenItem[itemId];
  if(_invLapCache.data) _invLapRender(_invLapCache.data);
}
window.invLapToggleItem = invLapToggleItem;

function invLapToggleDetail(itemId, jenis){
  var key = itemId + '_' + jenis;
  _invLapOpenDetail[key] = !_invLapOpenDetail[key];
  if(_invLapCache.data) _invLapRender(_invLapCache.data);
}
window.invLapToggleDetail = invLapToggleDetail;
window._invLapFilPer = 'semua';

function invLapGotoPage(p){
  _invLapPageState['_page_items'] = p;
  if(_invLapCache.data) _invLapRender(_invLapCache.data);
}
window.invLapGotoPage = invLapGotoPage;

function invLapActGoto(itemId, p){
  _invLapActPage[itemId] = p;
  if(_invLapCache.data) _invLapRender(_invLapCache.data);
}
window.invLapActGoto = invLapActGoto;

function invLapShowMore(key, total, step){
  _invLapPageState[key] = Math.min((_invLapPageState[key]||step) + step, total);
  if(_invLapCache.data) _invLapRender(_invLapCache.data);
}
window.invLapShowMore = invLapShowMore;

function invLapShowLess(key){
  delete _invLapPageState[key];
  if(_invLapCache.data) _invLapRender(_invLapCache.data);
}
window.invLapShowLess = invLapShowLess;

function invLapSetPeriode(v){
  _invLapPeriode = v;
  window._invLapFilPer = v;
  var sel = document.getElementById('inv-lap-periode');
  if(sel) sel.value = v;
  if(_invLapCache.data) _invLapRender(_invLapCache.data);
}
window.invLapSetPeriode = invLapSetPeriode;

function invLapLoad(force){
  var root = document.getElementById('inv-lap-root');
  if(!root) return;


  if(!force && _invLapCache.data && (Date.now()-_invLapCache.ts) < _invLapCache.ttl){
    _invLapRender(_invLapCache.data); return;
  }

  root.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">' +
    '<i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:24px;display:block;margin-bottom:8px"></i>' +
    'Memuat laporan…</div>';

  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ root.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">Database tidak terhubung</div>'; return; }

  Promise.all([
    sb.from('material_items').select('id,kode,nama,kategori,merk,satuan,stok,min_stok,status').order('kode'),
    sb.from('material_mutasi').select('id,item_id,jenis,jumlah,area_id,odp_id,odc_id,pel_id,pel_cid,teknisi,tgl,sn_ont,stok_sebelum,stok_sesudah,created_at').order('tgl',{ascending:false}).limit(5000),
    sb.from('pelanggan').select('id,cid,nama,area_id,ont_item_id,kabel_item_id,status,sn_ont,ont_model,teknisi_pasang,tgl_pasang,alamat'),
    sb.from('dismantle_orders').select('id,pel_id,cid_pelanggan,area_id,ont_item_id,ont_kembali,ont_kondisi,status,teknisi,tgl_selesai').eq('status','selesai').limit(2000),
    sb.from('areas').select('id,nama,kode')
  ]).then(function(res){
    var items     = (!res[0].error && res[0].data) ? res[0].data : [];
    var mutasi    = (!res[1].error && res[1].data) ? res[1].data : [];
    var pelanggan = (!res[2].error && res[2].data) ? res[2].data : [];
    var dismantle = (!res[3].error && res[3].data) ? res[3].data : [];
    var areas     = (!res[4].error && res[4].data) ? res[4].data : [];

    var areaNama = {};
    areas.forEach(function(a){ areaNama[a.id] = a.nama || a.kode; });

    /* ── Auto-bersihkan duplikat instalasi per CID sebelum render ── */
    (function(){
      var sb2 = (typeof getSB==='function') ? getSB() : null;
      if(!sb2) return;
      var cidEvents = {};
      mutasi.forEach(function(m){
        if(!m.pel_cid) return;
        if(m.jenis==='instalasi'||m.jenis==='maintenance_ont'){
          if(!cidEvents[m.pel_cid]) cidEvents[m.pel_cid]=[];
          cidEvents[m.pel_cid].push({id:m.id,jenis:m.jenis,tgl:m.tgl||m.created_at||''});
        }
      });
      var toDelete=[];
      Object.keys(cidEvents).forEach(function(cid){
        var evs=cidEvents[cid].slice().sort(function(a,b){return a.tgl<b.tgl?-1:1;});
        var lastIns=null;
        evs.forEach(function(ev){
          if(ev.jenis==='instalasi'){
            if(lastIns!==null) toDelete.push(lastIns);
            lastIns=ev.id;
          } else if(ev.jenis==='maintenance_ont'){ lastIns=null; }
        });
      });
      if(!toDelete.length) return;
      /* Hapus diam-diam tanpa notifikasi, invalidasi cache agar reload bersih */
      var batches=[];
      for(var i=0;i<toDelete.length;i+=50) batches.push(toDelete.slice(i,i+50));
      var run=function(idx){
        if(idx>=batches.length){
          _invLapCache={ts:0,data:null,ttl:0};
          invLapLoad(true);
          return;
        }
        sb2.from('material_mutasi').delete().in('id',batches[idx])
          .then(function(){ run(idx+1); })
          .catch(function(){ run(idx+1); });
      };
      run(0);
    })();

    _invLapCache = { ts: Date.now(), data: {items,mutasi,pelanggan,dismantle,areaNama}, ttl:120000 };
    _invLapRender({items,mutasi,pelanggan,dismantle,areaNama});
  }).catch(function(e){
    root.innerHTML = '<div style="padding:20px;text-align:center;color:var(--red);font-size:12px">Error: '+(e&&e.message||'coba lagi')+'</div>';
  });
}
window.invLapLoad = invLapLoad;

function _lapEsc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function _lapFilterDate(tgl){
  if(_invLapPeriode === 'semua') return true;
  var d = new Date(tgl);
  var now = new Date();
  if(_invLapPeriode === 'bulan_ini'){
    return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
  }
  if(_invLapPeriode === '3bulan'){
    var cut = new Date(now); cut.setMonth(cut.getMonth()-3);
    return d >= cut;
  }
  return true;
}

function _invLapRender(d){
  var root = document.getElementById('inv-lap-root');
  if(!root) return;

  var items     = d.items;
  var mutasi    = d.mutasi.filter(function(m){ return _lapFilterDate(m.tgl||m.created_at); });
  var pelanggan = d.pelanggan;
  var dismantle = d.dismantle;
  var areaNama  = d.areaNama;

  var periodeLabel = {semua:'Semua Waktu', bulan_ini:'Bulan Ini', '3bulan':'3 Bulan Terakhir'}[_invLapPeriode] || 'Semua Waktu';

  /* ── Build item lookup ── */
  var itemById = {};
  items.forEach(function(m){ itemById[m.id]=m; });

  /* ── Per-item stats from mutasi ── */
  var MASUK  = ['masuk','koreksi','dismantle_kembali','return_dismantle','recovery_dismantle'];
  var KELUAR = (typeof JENIS_KELUAR_GUDANG!=='undefined') ? JENIS_KELUAR_GUDANG : ['instalasi','instalasi_lama','keluar','distribusi','maintenance','maintenance_ont','maintenance_kabel','odp_maintenance','odc_maintenance'];
  var RUSAK  = ['rusak'];
  var HILANG = ['hilang'];

  /* SATU-SATUNYA fungsi penentu arah mutasi (masuk/keluar/rusak/hilang).
     Dipakai baik untuk total agregat MAUPUN untuk render tiap baris
     aktivitas — sebelumnya ada 2 logika terpisah yang bisa saling tidak
     sinkron (total bisa beda dari yang ditampilkan per-baris). */
  function _lapMutasiArah(m){
    var qty = m.jumlah || 0;
    if(m.jenis === 'koreksi'){
      /* Koreksi opname: tanda jumlah menentukan arah (positif=masuk, negatif=keluar) */
      return qty > 0 ? {arah:'masuk', qty:qty} : (qty < 0 ? {arah:'keluar', qty:Math.abs(qty)} : {arah:null, qty:0});
    }
    if(RUSAK.indexOf(m.jenis)>=0)  return {arah:'rusak',  qty:(qty>0?qty:1)};
    if(HILANG.indexOf(m.jenis)>=0) return {arah:'hilang', qty:(qty>0?qty:1)};
    if(MASUK.indexOf(m.jenis)>=0)  return {arah:'masuk',  qty:Math.abs(qty)||1};
    if(KELUAR.indexOf(m.jenis)>=0) return {arah:'keluar', qty:Math.abs(qty)||1};
    /* jenis tidak dikenali di kedua daftar — jangan diam-diam diabaikan,
       tandai supaya kelihatan di UI daripada hilang tanpa jejak */
    return {arah:'unknown', qty:Math.abs(qty)||1};
  }

  var byItem = {};
  items.forEach(function(m){ byItem[m.id]={masuk:0,keluar:0,rusak:0,hilang:0,unknown:0,mutasiList:[]}; });

  mutasi.forEach(function(m){
    if(!byItem[m.item_id]) return;
    var a = _lapMutasiArah(m);
    if(a.arah && byItem[m.item_id][a.arah]!==undefined) byItem[m.item_id][a.arah] += a.qty;
    byItem[m.item_id].mutasiList.push(m);
  });

  /* Lookup pelanggan by CID */
  var pelByCid = {};
  pelanggan.forEach(function(p){ if(p.cid) pelByCid[p.cid] = p; });

  /* Deteksi CID duplikat: 2 instalasi tanpa maintenance_ont di antaranya = invalid */
  var cidDupSet = {};
  (function(){
    var cidEvents = {};
    mutasi.forEach(function(m){
      if(!m.pel_cid) return;
      if(m.jenis === 'instalasi' || m.jenis === 'maintenance_ont'){
        if(!cidEvents[m.pel_cid]) cidEvents[m.pel_cid] = [];
        cidEvents[m.pel_cid].push({jenis:m.jenis, tgl:m.tgl||m.created_at||''});
      }
    });
    Object.keys(cidEvents).forEach(function(cid){
      var evs = cidEvents[cid].slice().sort(function(a,b){ return a.tgl < b.tgl ? -1 : 1; });
      var lastWasInstalasi = false;
      evs.forEach(function(ev){
        if(ev.jenis === 'instalasi'){
          if(lastWasInstalasi) cidDupSet[cid] = true;
          lastWasInstalasi = true;
        } else if(ev.jenis === 'maintenance_ont'){
          lastWasInstalasi = false;
        }
      });
    });
  })();

  /* ════════════ RENDER ════════════ */
  var cacheMin = Math.floor((Date.now()-_invLapCache.ts)/60000);
  var html =
    /* Sub-header info */
    '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">' +
      '<div>' +
        '<div style="font-size:10px;color:var(--text3)">' + periodeLabel + ' · ' + items.length + ' item · data ' + (cacheMin===0?'baru saja':cacheMin+' mnt lalu') + '</div>' +
      '</div>' +
      '<button onclick="invLapLoad(true)" style="padding:6px 10px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:10px;font-weight:700;color:var(--text2);cursor:pointer;display:flex;align-items:center;gap:4px;touch-action:manipulation"><i class="ti ti-refresh"></i> Refresh</button>' +
    '</div>';

  /* ── 4 Global KPI: Masuk / Keluar / Rusak / Hilang ── */
  var totalMasuk  = items.reduce(function(s,m){ return s+(byItem[m.id]?byItem[m.id].masuk:0); },0);
  var totalKeluar = items.reduce(function(s,m){ return s+(byItem[m.id]?byItem[m.id].keluar:0); },0);
  var totalRusak  = items.reduce(function(s,m){ return s+(byItem[m.id]?byItem[m.id].rusak:0); },0);
  var totalHilang = items.reduce(function(s,m){ return s+(byItem[m.id]?byItem[m.id].hilang:0); },0);

  html +=
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">' +
      _lapKpiCard(totalMasuk,  'Barang Masuk',  'var(--green)', 'ti-arrow-down-circle') +
      _lapKpiCard(totalKeluar, 'Barang Keluar', 'var(--c2)',    'ti-arrow-up-circle') +
      _lapKpiCard(totalRusak,  'Barang Rusak',  'var(--yellow)', 'ti-alert-triangle') +
      _lapKpiCard(totalHilang, 'Barang Hilang', 'var(--red)',   'ti-x-circle') +
    '</div>';

  /* ── Distribusi ONT Pelanggan ──
     Menjawab pertanyaan "2000+ pelanggan tapi ONT di inventory cuma
     terpakai sedikit, sisanya pakai ONT siapa?" — sebagian besar pelanggan
     hasil import punya nama model ONT sebagai teks bebas (ont_model) tapi
     tidak tertaut ke katalog material (ont_item_id). Laporan ini
     menghitung SEMUA pelanggan aktif berdasarkan data yang benar-benar
     ada, bukan cuma yang sudah tertaut ke katalog. */
  (function(){
    var pelAktif = pelanggan.filter(function(p){ return p.status==='aktif'||p.status==='maintenance'; });
    var groups = {};
    pelAktif.forEach(function(p){
      var key, label;
      if(p.ont_item_id && itemById[p.ont_item_id]){
        key = 'item:'+p.ont_item_id;
        label = itemById[p.ont_item_id].nama + (itemById[p.ont_item_id].merk?' ('+itemById[p.ont_item_id].merk+')':'');
      } else if(p.ont_model && String(p.ont_model).trim()){
        key = 'text:'+String(p.ont_model).trim().toUpperCase();
        label = String(p.ont_model).trim() + ' (catatan teks, belum tertaut katalog)';
      } else if(p.sn_ont && String(p.sn_ont).trim()){
        key = 'sn_only';
        label = 'Ada SN ONT, tapi model tidak dicatat';
      } else {
        key = 'none';
        label = 'Tidak ada data ONT sama sekali';
      }
      if(!groups[key]) groups[key] = {label:label, count:0, linked:!!(p.ont_item_id&&itemById[p.ont_item_id])};
      groups[key].count++;
    });
    var groupList = Object.keys(groups).map(function(k){ return groups[k]; }).sort(function(a,b){ return b.count-a.count; });
    var totalPel = pelAktif.length;

    html += '<div style="background:var(--bg2);border-radius:14px;border:1.5px solid var(--border);padding:14px;margin-bottom:14px">' +
      '<div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:2px"><i class="ti ti-router" style="color:var(--cyan)"></i> Distribusi ONT Pelanggan Aktif</div>' +
      '<div style="font-size:10px;color:var(--text3);margin-bottom:10px">Dari ' + totalPel + ' pelanggan aktif — menjawab "sisanya pakai ONT apa"</div>';

    groupList.forEach(function(g){
      var pct = totalPel ? Math.round(g.count/totalPel*100) : 0;
      var col = g.linked ? 'var(--green)' : (g.count && g.label.indexOf('Tidak ada data')>=0 ? 'var(--red)' : 'var(--yellow)');
      html += '<div style="margin-bottom:8px">' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">' +
          '<span style="color:var(--text2)">' + _lapEsc(g.label) + '</span>' +
          '<span style="font-weight:800;color:'+col+'">' + g.count + ' <span style="font-weight:400;color:var(--text3)">(' + pct + '%)</span></span>' +
        '</div>' +
        '<div style="height:6px;background:var(--bg3);border-radius:4px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + col + '"></div>' +
        '</div>' +
      '</div>';
    });

    html += '<div style="margin-top:10px;padding:10px;background:var(--c1b);border-radius:10px;font-size:10px;color:var(--text2);line-height:1.5">' +
      '<i class="ti ti-info-circle" style="color:var(--c1)"></i> Baris <strong>hijau</strong> = sudah tertaut katalog material (ikut dihitung di stok/laporan per-item). Baris <strong>kuning</strong> = modelnya tercatat sebagai teks (biasanya dari data import) tapi belum tertaut, jadi tidak ikut terhitung di kartu material manapun di bawah. Baris <strong>merah</strong> = benar-benar tidak ada catatan ONT sama sekali.' +
    '</div>' +
    '</div>';
  })();

  /* ── Pagination ── */
  var ITEM_PAGE_SIZE = 5;
  var totalItemPages = Math.max(1, Math.ceil(items.length / ITEM_PAGE_SIZE));
  var itemPage = _invLapPageState['_page_items'] || 1;
  if(itemPage > totalItemPages) itemPage = totalItemPages;
  if(itemPage < 1) itemPage = 1;
  var pagedItems = items.slice((itemPage-1)*ITEM_PAGE_SIZE, itemPage*ITEM_PAGE_SIZE);

  /* ── Per Item Card ── */
  pagedItems.forEach(function(m){
    var b    = byItem[m.id] || {masuk:0,keluar:0,rusak:0,hilang:0,mutasiList:[]};
    var stok = m.stok || 0;
    var stInfo = (typeof _matiStokLabel==='function' && typeof _matiStokStatus==='function')
      ? _matiStokLabel(_matiStokStatus(stok, m.min_stok))
      : {color: stok<=0?'var(--red)':(m.min_stok&&stok<=m.min_stok?'var(--yellow)':'var(--green)'), short: stok<=0?'Habis':(m.min_stok&&stok<=m.min_stok?'Rendah':'Aman')};
    var sc   = stInfo.color;
    var sl   = stInfo.short;
    var isOpen = !!_invLapOpenItem[m.id];

    html += '<div style="background:var(--bg2);border-radius:14px;border:1.5px solid var(--border);overflow:hidden;margin-bottom:12px;box-shadow:var(--sh-sm)">';

    /* Header: nama + stok */
    html +=
      '<div onclick="invLapToggleItem(\'' + m.id + '\')" style="cursor:pointer;touch-action:manipulation;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px">' +
        '<div style="display:flex;gap:10px;align-items:center;min-width:0">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:' + sc + '18;display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
            '<i class="ti ti-package" style="color:' + sc + ';font-size:18px"></i>' +
          '</div>' +
          '<div style="min-width:0">' +
            '<div style="font-size:13px;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _lapEsc(m.nama||'—') + '</div>' +
            '<div style="display:flex;gap:4px;margin-top:2px;flex-wrap:wrap">' +
              '<span style="font-size:8px;background:var(--c1b);color:var(--c1);padding:1px 6px;border-radius:20px;font-weight:700">' + _lapEsc(m.kategori||'—') + '</span>' +
              (m.merk?'<span style="font-size:8px;background:var(--bg3);color:var(--text2);padding:1px 6px;border-radius:20px;border:1px solid var(--border)">' + _lapEsc(m.merk) + '</span>':'') +
              '<span style="font-size:8px;font-family:monospace;color:var(--text3)">' + _lapEsc(m.kode||'') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;min-width:52px">' +
          '<div style="font-size:22px;font-weight:900;color:' + sc + ';line-height:1">' + stok + '</div>' +
          '<div style="font-size:8px;color:var(--text3);text-transform:uppercase;letter-spacing:.3px">' + _lapEsc(m.satuan||'unit') + ' sisa</div>' +
        '</div>' +
      '</div>';

    if(!isOpen){
      html += '</div>';
      return;
    }

    /* Expanded: 4 angka utama */
    html +=
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)">' +
        _lapQCell(b.masuk,  'Masuk',  'var(--green)') +
        _lapQCell(b.keluar, 'Keluar', 'var(--c2)') +
        _lapQCell(b.rusak,  'Rusak',  'var(--yellow)') +
        _lapQCell(b.hilang, 'Hilang', 'var(--red)') +
      '</div>';

    /* Status badge */
    html +=
      '<div style="padding:8px 14px;display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--border);flex-wrap:wrap">' +
        '<span style="font-size:8px;font-weight:800;padding:2px 8px;border-radius:20px;background:' + sc + '18;color:' + sc + '">' + sl + '</span>' +
        '<span style="font-size:8px;color:var(--text4)">Stok ' + (stok<=0?'habis':(m.min_stok&&stok<=m.min_stok?'di bawah minimum ('+m.min_stok+')':'normal')) + '</span>' +
        (b.unknown>0 ? '<span style="font-size:8px;font-weight:800;padding:2px 8px;border-radius:20px;background:rgba(217,119,6,.12);color:var(--yellow)"><i class="ti ti-alert-triangle" style="font-size:8px"></i> ' + b.unknown + ' aktivitas jenis tidak dikenali</span>' : '') +
      '</div>';

    /* Aktivitas terbaru — dengan pagination per-card (5 per halaman), terpisah dari pagination halaman ringkasan */
    if(b.mutasiList.length){
      var ACT_PAGE_SIZE = 5;
      var totalActPages = Math.max(1, Math.ceil(b.mutasiList.length / ACT_PAGE_SIZE));
      var actPage = _invLapActPage[m.id] || 1;
      if(actPage > totalActPages) actPage = totalActPages;
      if(actPage < 1) actPage = 1;
      var pagedAct = b.mutasiList.slice((actPage-1)*ACT_PAGE_SIZE, actPage*ACT_PAGE_SIZE);

      html += '<div style="border-bottom:1px solid var(--border)">' +
        '<div style="padding:6px 14px;font-size:8px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;background:var(--bg3)">Aktivitas Terbaru</div>' +
        pagedAct.map(function(mut){
          var arahInfo = _lapMutasiArah(mut);
          var isMasuk = arahInfo.arah==='masuk';
          var isUnknown = arahInfo.arah==='unknown';
          var mc = isUnknown ? 'var(--yellow)' : (isMasuk?'var(--green)':'var(--c2)');
          var jenisLabel = _lapEsc((mut.jenis||'').replace(/_/g,' '));
          var pelRec = mut.pel_cid ? (pelByCid[mut.pel_cid]||null) : null;
          var pelNama = pelRec ? (pelRec.nama||'') : '';
          var isDupCid = (mut.jenis === 'instalasi' && mut.pel_cid && !!cidDupSet[mut.pel_cid]);
          return '<div style="padding:6px 14px;border-bottom:1px solid var(--border2);display:flex;align-items:flex-start;gap:8px' + (isDupCid?';background:rgba(239,68,68,.05)':'') + '">' +
            '<i class="ti ' + (isUnknown?'ti-help-circle':(isMasuk?'ti-arrow-down-left':'ti-arrow-up-right')) + '" style="font-size:12px;color:' + mc + ';flex-shrink:0;margin-top:2px"></i>' +
            '<div style="flex:1;min-width:0">' +
              '<span style="font-size:9px;font-weight:700;color:' + mc + '">' + jenisLabel + (isUnknown?' (jenis tidak dikenali)':'') + '</span>' +
              (mut.teknisi?' <span style="font-size:8px;color:var(--text4)">· <i class="ti ti-user" style="font-size:8px"></i> ' + _lapEsc(mut.teknisi) + '</span>':'') +
              (isDupCid?'<span style="font-size:8px;font-weight:800;color:var(--red);background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:20px;padding:1px 6px;margin-left:4px"><i class="ti ti-alert-triangle" style="font-size:8px"></i> CID duplikat</span>':'') +
              (mut.pel_cid?'<div style="font-size:8px;color:var(--c1);margin-top:2px"><i class="ti ti-id" style="font-size:8px"></i> CID: ' + _lapEsc(mut.pel_cid) + (pelNama?' · '+_lapEsc(pelNama):'') + '</div>':'') +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0">' +
              '<div style="font-size:12px;font-weight:800;color:' + mc + '">' + (isMasuk?'+':'−') + arahInfo.qty + '</div>' +
              '<div style="font-size:8px;color:var(--text4)">' + _lapEsc((mut.tgl||mut.created_at||'').slice(0,10)) + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        (totalActPages > 1
          ? '<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 14px">' +
              '<button onclick="event.stopPropagation();invLapActGoto(\'' + m.id + '\',' + (actPage-1) + ')" ' + (actPage<=1?'disabled':'') +
                ' style="padding:5px 9px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:8px;font-family:Sora,sans-serif;font-size:9px;font-weight:700;color:' + (actPage<=1?'var(--text4)':'var(--text2)') + ';cursor:' + (actPage<=1?'default':'pointer') + ';touch-action:manipulation"><i class="ti ti-chevron-left" style="font-size:10px"></i></button>' +
              '<span style="font-size:9px;font-weight:700;color:var(--text3)">' + actPage + ' / ' + totalActPages + ' · ' + b.mutasiList.length + ' aktivitas</span>' +
              '<button onclick="event.stopPropagation();invLapActGoto(\'' + m.id + '\',' + (actPage+1) + ')" ' + (actPage>=totalActPages?'disabled':'') +
                ' style="padding:5px 9px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:8px;font-family:Sora,sans-serif;font-size:9px;font-weight:700;color:' + (actPage>=totalActPages?'var(--text4)':'var(--text2)') + ';cursor:' + (actPage>=totalActPages?'default':'pointer') + ';touch-action:manipulation"><i class="ti ti-chevron-right" style="font-size:10px"></i></button>' +
            '</div>'
          : '') +
      '</div>';
    }

    html += '</div>';
  });

  /* Pagination */
  if(totalItemPages > 1){
    html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:6px 0 18px">' +
      '<button onclick="invLapGotoPage('+(itemPage-1)+')" ' + (itemPage<=1?'disabled':'') +
        ' style="padding:8px 12px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:' + (itemPage<=1?'var(--text4)':'var(--text2)') + ';cursor:' + (itemPage<=1?'default':'pointer') + ';touch-action:manipulation"><i class="ti ti-chevron-left"></i></button>' +
      '<span style="font-size:11px;font-weight:700;color:var(--text3)">' + itemPage + ' / ' + totalItemPages + '</span>' +
      '<button onclick="invLapGotoPage('+(itemPage+1)+')" ' + (itemPage>=totalItemPages?'disabled':'') +
        ' style="padding:8px 12px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:' + (itemPage>=totalItemPages?'var(--text4)':'var(--text2)') + ';cursor:' + (itemPage>=totalItemPages?'default':'pointer') + ';touch-action:manipulation"><i class="ti ti-chevron-right"></i></button>' +
    '</div>';
  }

  root.innerHTML = html;
}

/* Simplified KPI card with icon */
function _lapKpiCard(n, lbl, col, icon){
  return '<div style="background:var(--bg2);border-radius:12px;padding:12px;border:1.5px solid ' + col + '18;text-align:center">' +
    '<i class="ti ' + icon + '" style="font-size:20px;color:' + col + ';display:block;margin-bottom:4px"></i>' +
    '<div style="font-size:22px;font-weight:900;color:' + col + ';line-height:1;margin-bottom:3px">' + n + '</div>' +
    '<div style="font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px">' + lbl + '</div>' +
  '</div>';
}

/* Simplified quantity cell */
function _lapQCell(n, lbl, col){
  return '<div style="padding:10px 4px;text-align:center;border-right:1px solid var(--border)">' +
    '<div style="font-size:18px;font-weight:900;color:' + col + ';line-height:1;margin-bottom:2px">' + n + '</div>' +
    '<div style="font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.3px">' + lbl + '</div>' +
  '</div>';
}

})();

/* =====================================================================
   ↓↓↓ TAMBAHAN (menyatu di file ini, bukan file terpisah) ↓↓↓
===================================================================== */
/* =====================================================================
   PATCH 30 — INVENTORY MATERIAL: UPGRADE PENUH SEMUA SUB-MENU
   ---------------------------------------------------------------------
   File ini TIDAK mengedit js/03-app-core.js maupun js/21-inventory-laporan.js.
   Fungsi inti (_matMutasi, _matMutasiSequence, invLoadMaster, dan semua
   fetch data asli) TIDAK disentuh — murni menambah widget ringkasan
   serta pencarian/filter/sort di ATAS tampilan yang sudah ada, dengan
   cara membaca ulang data yang sama (_invMatiData, dan proses render
   yang sudah selesai lewat MutationObserver) — bukan mengambil ulang
   dari server kecuali disebutkan.

   YANG DITAMBAHKAN:
   1) Ringkasan Gudang — Health Strip (Total Jenis, Total Unit, Stok
      Kritis, Nilai Total Stok Rp) + grafik tren Masuk vs Keluar 8
      minggu terakhir + pencarian/filter kategori/status + urutkan.
      (1 query tambahan ringan utk data tren, sisanya pakai data yang
      sama seperti yang sudah dipakai invDashLoad)
   2) Barang Masuk / Barang Keluar / Dismantle & Kembali — tambah
      kotak pencarian (nama barang / teknisi / CID) di atas daftar
      yang sudah ada, plus ringkasan kecil (total hari ini/minggu ini).
   3) Stok Opname — tambah pencarian + penghitung progres (sudah
      diinput berapa dari berapa, ada berapa yang beda dari sistem).
===================================================================== */
(function(){
  'use strict';

  function esc(s){ return (typeof _esc3 === 'function') ? _esc3(s) : String(s == null ? '' : s); }
  function fmtRp(n){ return 'Rp' + Math.round(n || 0).toLocaleString('id-ID'); }

  /* =====================================================================
     1) RINGKASAN GUDANG
  ===================================================================== */
  var _trendCache = null; // null = belum diambil
  function fetchTrendOnce(cb){
    if (_trendCache){ cb(_trendCache); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ cb(null); return; }
    var since = new Date(); since.setDate(since.getDate() - 56); // 8 minggu
    sb.from('material_mutasi').select('jenis,jumlah,tgl,created_at')
      .gte('created_at', since.toISOString()).limit(5000)
      .then(function(r){ _trendCache = (r.error) ? [] : (r.data || []); cb(_trendCache); })
      .catch(function(){ _trendCache = []; cb(_trendCache); });
  }

  var _dashFilKategori = '', _dashFilKritis = false, _dashSearch = '', _dashSort = 'default';

  function ensureDashWidgets(){
    if (document.getElementById('inv-ov-root')) return true;
    var content = document.getElementById('inv-d-content');
    if (!content || !content.parentNode) return false;

    var root = document.createElement('div');
    root.id = 'inv-ov-root';
    root.style.marginBottom = '14px';
    root.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px" id="inv-ov-health"></div>' +
      '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:14px;margin-bottom:12px">' +
        '<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--text);margin-bottom:2px"><i class="ti ti-chart-bar" style="color:var(--c1)"></i> Tren Masuk vs Keluar (8 Minggu)</div>' +
        '<div id="inv-ov-trend" style="margin-top:8px"></div>' +
      '</div>' +
      '<div style="margin-bottom:10px">' +
        '<div style="position:relative;margin-bottom:8px">' +
          '<i class="ti ti-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:15px;color:var(--text3)"></i>' +
          '<input id="inv-ov-search" type="search" placeholder="Cari nama atau kode material…" oninput="_invOvApply()" ' +
            'style="display:block;width:100%;box-sizing:border-box;padding:11px 12px 11px 36px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:13px;color:var(--text);outline:none">' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
          '<select id="inv-ov-kategori" onchange="_invOvApply()" style="padding:7px 10px;border:1.5px solid var(--border2);border-radius:20px;font-family:Sora,sans-serif;font-size:11px;background:var(--bg2);color:var(--text)"><option value="">Semua Kategori</option></select>' +
          '<button type="button" onclick="_invOvToggleKritis()" id="inv-ov-kritis-btn" style="font-size:11px;font-weight:700;padding:7px 12px;border-radius:20px;border:1.5px solid var(--border2);background:var(--bg2);color:var(--text);cursor:pointer">⚠ Stok Kritis</button>' +
          '<select id="inv-ov-sort" onchange="_invOvApply()" style="margin-left:auto;padding:7px 10px;border:1.5px solid var(--border2);border-radius:20px;font-family:Sora,sans-serif;font-size:11px;background:var(--bg2);color:var(--text)">' +
            '<option value="default">Urutan Default</option><option value="stok-asc">Stok Terendah</option><option value="stok-desc">Stok Tertinggi</option><option value="nama">Nama A-Z</option>' +
          '</select>' +
        '</div>' +
      '</div>';
    content.parentNode.insertBefore(root, content);

    if (window.innerWidth >= 900) document.getElementById('inv-ov-health').style.gridTemplateColumns = 'repeat(4,1fr)';

    // pantau setiap kali daftar kartu di-render ulang oleh invDashLoad asli,
    // supaya filter/urutan yang sedang aktif ikut diterapkan ulang.
    // Observer di-nonaktifkan sementara tiap kali KITA sendiri yang mengubah
    // urutan kartu (lihat _invOvApply), supaya tidak memicu dirinya sendiri
    // berulang-ulang (infinite loop).
    _invOvObserver = new MutationObserver(function(){ _invOvApply(true); });
    _invOvObserver.observe(content, { childList: true });

    return true;
  }
  var _invOvObserver = null;

  function healthCard(icon, c, bg, label, value, unit, sub){
    return '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:12px">' +
      '<div style="width:26px;height:26px;border-radius:8px;background:' + bg + ';display:flex;align-items:center;justify-content:center;margin-bottom:8px"><i class="ti ' + icon + '" style="font-size:13px;color:' + c + '"></i></div>' +
      '<div style="font-family:monospace;font-size:17px;font-weight:800;color:var(--text);line-height:1">' + value + '<span style="font-size:10.5px;color:var(--text3);font-weight:600;margin-left:2px">' + unit + '</span></div>' +
      '<div style="font-size:9.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-top:4px">' + label + '</div>' +
      (sub ? '<div style="font-size:9px;color:' + c + ';font-weight:700;margin-top:2px">' + sub + '</div>' : '') +
    '</div>';
  }

  function renderDashHealth(){
    var el = document.getElementById('inv-ov-health');
    if (!el || typeof _invMatiData === 'undefined') return;
    var total = _invMatiData.length;
    var totalUnit = _invMatiData.reduce(function(s, m){ return s + (m.stok || 0); }, 0);
    var habis = _invMatiData.filter(function(m){ return (m.stok || 0) <= 0; }).length;
    var rendah = _invMatiData.filter(function(m){ var s = m.stok || 0, mn = m.min_stok || 0; return mn > 0 && s > 0 && s <= mn; }).length;
    var nilaiTotal = _invMatiData.reduce(function(s, m){ return s + (m.stok || 0) * (m.harga_satuan || 0); }, 0);
    var adaHarga = _invMatiData.some(function(m){ return (m.harga_satuan || 0) > 0; });

    el.innerHTML =
      healthCard('ti-category', 'var(--c1)', 'var(--c1b)', 'Jenis Material', total, '') +
      healthCard('ti-boxes', 'var(--pu)', 'var(--pug,rgba(124,58,237,.08))', 'Total Unit', totalUnit, '') +
      healthCard('ti-alert-triangle', (habis + rendah) > 0 ? 'var(--red)' : 'var(--green)', (habis + rendah) > 0 ? 'var(--rg2)' : 'var(--gng2)', 'Stok Kritis', habis + rendah, '', habis + ' habis · ' + rendah + ' hampir habis') +
      (adaHarga ? healthCard('ti-cash', 'var(--green)', 'var(--gng2)', 'Nilai Total Stok', fmtRp(nilaiTotal), '')
                : healthCard('ti-cash-off', 'var(--text3)', 'var(--bg3)', 'Nilai Total Stok', '—', '', 'Harga satuan belum diisi'));

    var kategoriSel = document.getElementById('inv-ov-kategori');
    if (kategoriSel && kategoriSel.children.length <= 1){
      var kats = {}; _invMatiData.forEach(function(m){ if (m.kategori) kats[m.kategori] = 1; });
      Object.keys(kats).sort().forEach(function(k){
        var o = document.createElement('option'); o.value = k; o.textContent = k; kategoriSel.appendChild(o);
      });
    }
  }

  function renderDashTrend(){
    var el = document.getElementById('inv-ov-trend');
    if (!el) return;
    fetchTrendOnce(function(rows){
      if (!rows){ el.innerHTML = '<div style="font-size:11px;color:var(--text3);text-align:center;padding:20px">Data tren tidak tersedia</div>'; return; }
      var JENIS_MASUK = ['masuk', 'koreksi', 'dismantle_kembali', 'return_dismantle', 'recovery_dismantle'];
      var JENIS_KELUAR = (typeof JENIS_KELUAR_GUDANG !== 'undefined') ? JENIS_KELUAR_GUDANG : [];
      var weeks = [];
      var now = new Date();
      for (var i = 7; i >= 0; i--){
        var start = new Date(now); start.setDate(start.getDate() - (i * 7 + 6));
        var end = new Date(now); end.setDate(end.getDate() - (i * 7));
        weeks.push({ start: start, end: end, masuk: 0, keluar: 0 });
      }
      rows.forEach(function(m){
        var d = new Date(m.tgl || m.created_at);
        var w = weeks.find(function(x){ return d >= x.start && d <= x.end; });
        if (!w) return;
        var qty = Math.abs(m.jumlah || 0);
        if (JENIS_MASUK.indexOf(m.jenis) >= 0 && (m.jumlah || 0) > 0) w.masuk += qty;
        else if (JENIS_KELUAR.indexOf(m.jenis) >= 0) w.keluar += qty;
      });
      var max = Math.max.apply(null, weeks.map(function(w){ return Math.max(w.masuk, w.keluar); })) || 1;
      el.innerHTML = '<div style="display:flex;align-items:flex-end;gap:5px;height:80px;margin-bottom:6px">' +
        weeks.map(function(w){
          var hM = Math.max(3, Math.round(w.masuk / max * 64)), hK = Math.max(3, Math.round(w.keluar / max * 64));
          return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%">' +
            '<div style="display:flex;gap:2px;align-items:flex-end;height:100%">' +
              '<div title="Masuk: ' + w.masuk + '" style="width:7px;height:' + hM + 'px;background:var(--green);border-radius:3px 3px 0 0"></div>' +
              '<div title="Keluar: ' + w.keluar + '" style="width:7px;height:' + hK + 'px;background:var(--c2);border-radius:3px 3px 0 0"></div>' +
            '</div>' +
          '</div>';
        }).join('') + '</div>' +
        '<div style="display:flex;gap:14px;font-size:9.5px;color:var(--text3)">' +
          '<span><span style="display:inline-block;width:7px;height:7px;background:var(--green);border-radius:2px;margin-right:4px"></span>Masuk</span>' +
          '<span><span style="display:inline-block;width:7px;height:7px;background:var(--c2);border-radius:2px;margin-right:4px"></span>Keluar</span>' +
        '</div>';
    });
  }

  window._invOvToggleKritis = function(){
    _dashFilKritis = !_dashFilKritis;
    var btn = document.getElementById('inv-ov-kritis-btn');
    if (btn){
      btn.style.background = _dashFilKritis ? 'var(--rg2)' : 'var(--bg2)';
      btn.style.color = _dashFilKritis ? 'var(--red)' : 'var(--text)';
      btn.style.borderColor = _dashFilKritis ? 'var(--red)' : 'var(--border2)';
    }
    _invOvApply();
  };

  var _applyingOv = false;
  window._invOvApply = function(fromObserver){
    if (_applyingOv) return; // cegah observer memicu diri sendiri berulang
    _applyingOv = true;
    var content = document.getElementById('inv-d-content');
    if (!content || typeof _invMatiData === 'undefined'){ _applyingOv = false; return; }

    if (!fromObserver){
      _dashSearch = ((document.getElementById('inv-ov-search') || {}).value || '').toLowerCase().trim();
      _dashFilKategori = (document.getElementById('inv-ov-kategori') || {}).value || '';
      _dashSort = (document.getElementById('inv-ov-sort') || {}).value || 'default';
    }

    var cards = Array.prototype.slice.call(content.children).filter(function(el){ return el.classList && el.classList.contains('inv-card'); });
    if (!cards.length){ _applyingOv = false; return; }

    // urutan kartu SAMA PERSIS urutan _invMatiData (dirender via forEach) —
    // jadi index array = index kartu, dipakai untuk mencocokkan tanpa
    // perlu membaca ulang isi HTML kartu.
    var withData = cards.map(function(card, i){ return { card: card, m: _invMatiData[i] }; }).filter(function(x){ return x.m; });

    withData.forEach(function(x){
      var m = x.m;
      var show = true;
      if (_dashSearch && (m.nama || '').toLowerCase().indexOf(_dashSearch) < 0 && (m.kode || '').toLowerCase().indexOf(_dashSearch) < 0) show = false;
      if (_dashFilKategori && m.kategori !== _dashFilKategori) show = false;
      if (_dashFilKritis){
        var stok = m.stok || 0, min = m.min_stok || 0;
        var kritis = stok <= 0 || (min > 0 && stok <= min);
        if (!kritis) show = false;
      }
      x.card.style.display = show ? '' : 'none';
    });

    if (_dashSort !== 'default'){
      var visible = withData.filter(function(x){ return x.card.style.display !== 'none'; });
      visible.sort(function(a, b){
        if (_dashSort === 'stok-asc') return (a.m.stok || 0) - (b.m.stok || 0);
        if (_dashSort === 'stok-desc') return (b.m.stok || 0) - (a.m.stok || 0);
        if (_dashSort === 'nama') return (a.m.nama || '').localeCompare(b.m.nama || '');
        return 0;
      });
      if (_invOvObserver) _invOvObserver.disconnect();
      visible.forEach(function(x){ content.appendChild(x.card); });
      if (_invOvObserver) _invOvObserver.observe(content, { childList: true });
    }

    var visibleCount = withData.filter(function(x){ return x.card.style.display !== 'none'; }).length;
    var emptyMsg = document.getElementById('inv-ov-empty');
    if (_invOvObserver) _invOvObserver.disconnect();
    if (visibleCount === 0){
      if (!emptyMsg){
        emptyMsg = document.createElement('div'); emptyMsg.id = 'inv-ov-empty';
        emptyMsg.style.cssText = 'padding:30px;text-align:center;color:var(--text3);font-size:12px';
        emptyMsg.textContent = 'Tidak ada material yang cocok dengan pencarian/filter';
        content.appendChild(emptyMsg);
      }
    } else if (emptyMsg){ emptyMsg.remove(); }
    if (_invOvObserver) _invOvObserver.observe(content, { childList: true });

    _applyingOv = false;
  };

  var _origInvDashLoad = window.invDashLoad;
  window.invDashLoad = function(){
    if (typeof _origInvDashLoad === 'function') _origInvDashLoad();
    if (!ensureDashWidgets()) return;
    renderDashHealth();
    renderDashTrend();
  };

  /* =====================================================================
     2) BARANG MASUK / BARANG KELUAR / DISMANTLE — kotak pencarian
  ===================================================================== */
  function mountSearchBox(toolbarSelectId, searchStateKey, placeholder, onSearch){
    var jenisSel = document.getElementById(toolbarSelectId);
    if (!jenisSel || document.getElementById(toolbarSelectId + '-searchbox')) return;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;flex:1;min-width:140px';
    wrap.innerHTML = '<i class="ti ti-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--text3)"></i>' +
      '<input id="' + toolbarSelectId + '-searchbox" type="search" placeholder="' + placeholder + '" ' +
      'style="width:100%;box-sizing:border-box;padding:8px 10px 8px 30px;border:1.5px solid var(--border2);border-radius:20px;font-family:Sora,sans-serif;font-size:11.5px;background:var(--bg2);color:var(--text);outline:none">';
    jenisSel.parentNode.insertBefore(wrap, jenisSel);
    wrap.querySelector('input').addEventListener('input', function(e){ onSearch(e.target.value); });
  }

  var _masukSearch = '', _keluarSearch = '', _dismSearch = '';

  var _origInvMasukRender = window.invMasukRender;
  window.invMasukRender = function(data){
    mountSearchBox('inv-masuk-jenis', 'masuk', 'Cari barang/teknisi…', function(v){ _masukSearch = v.toLowerCase(); window.invMasukRender(window._invMasukLastData || []); });
    window._invMasukLastData = data;
    var fil = _masukSearch ? data.filter(function(m){
      var item = m.material_items || {};
      return (item.nama || '').toLowerCase().indexOf(_masukSearch) >= 0 || (m.teknisi || '').toLowerCase().indexOf(_masukSearch) >= 0 || (item.kode || '').toLowerCase().indexOf(_masukSearch) >= 0;
    }) : data;
    if (typeof _origInvMasukRender === 'function') _origInvMasukRender(fil);
    mountSummaryBar('inv-masuk-list', fil, false);
  };

  var _origInvKeluarRender = window.invKeluarRender;
  window.invKeluarRender = function(data){
    mountSearchBox('inv-keluar-jenis', 'keluar', 'Cari barang/teknisi/CID…', function(v){ _keluarSearch = v.toLowerCase(); window.invKeluarRender(window._invKeluarLastData || []); });
    window._invKeluarLastData = data;
    var fil = _keluarSearch ? data.filter(function(m){
      var item = m.material_items || {};
      return (item.nama || '').toLowerCase().indexOf(_keluarSearch) >= 0 || (m.teknisi || '').toLowerCase().indexOf(_keluarSearch) >= 0 || (m.pel_cid || '').toLowerCase().indexOf(_keluarSearch) >= 0;
    }) : data;
    if (typeof _origInvKeluarRender === 'function') _origInvKeluarRender(fil);
    mountSummaryBar('inv-keluar-list', fil, true);
  };

  var _origInvDismantleRender = window.invDismantleRender;
  window.invDismantleRender = function(data){
    mountSearchBox('inv-dism-jenis', 'dism', 'Cari nama/CID pelanggan…', function(v){ _dismSearch = v.toLowerCase(); window.invDismantleRender(window._invDismLastData || []); });
    window._invDismLastData = data;
    var fil = _dismSearch ? data.filter(function(d){
      var pel = d.pelanggan || {};
      return (pel.nama || '').toLowerCase().indexOf(_dismSearch) >= 0 || (pel.cid || '').toLowerCase().indexOf(_dismSearch) >= 0;
    }) : data;
    if (typeof _origInvDismantleRender === 'function') _origInvDismantleRender(fil);
    mountDismSummary(fil);
  };

  function mountSummaryBar(listId, data, isKeluar){
    var list = document.getElementById(listId);
    if (!list || !list.parentNode) return;
    var today = new Date().toISOString().slice(0, 10);
    var weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    var totalHariIni = 0, totalMingguIni = 0;
    data.forEach(function(m){
      var tgl = (m.tgl || m.created_at || '').slice(0, 10);
      var qty = m.jumlah || 0;
      if (tgl === today) totalHariIni += qty;
      if (tgl && new Date(tgl) >= weekAgo) totalMingguIni += qty;
    });
    var col = isKeluar ? 'var(--c2)' : 'var(--green)';
    var id = listId + '-summary';
    var bar = document.getElementById(id);
    if (!bar){ bar = document.createElement('div'); bar.id = id; bar.style.cssText = 'display:flex;gap:8px;margin-bottom:10px'; list.parentNode.insertBefore(bar, list); }
    bar.innerHTML =
      '<div style="flex:1;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:9px 12px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:' + col + '">' + totalHariIni + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">HARI INI</div></div>' +
      '<div style="flex:1;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:9px 12px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:' + col + '">' + totalMingguIni + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">7 HARI TERAKHIR</div></div>' +
      '<div style="flex:1;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:9px 12px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:var(--text)">' + data.length + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">TOTAL CATATAN</div></div>';
  }

  function mountDismSummary(data){
    var list = document.getElementById('inv-dismantle-list');
    if (!list || !list.parentNode) return;
    var kembali = data.filter(function(d){ return d.ont_kembali; }).length;
    var total = data.length;
    var pct = total ? Math.round(kembali / total * 100) : 0;
    var bar = document.getElementById('inv-dismantle-summary');
    if (!bar){ bar = document.createElement('div'); bar.id = 'inv-dismantle-summary'; bar.style.cssText = 'margin-bottom:10px'; list.parentNode.insertBefore(bar, list); }
    var col = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';
    bar.innerHTML = '<div style="background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:11px 14px">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:5px"><span>Tingkat Pengembalian ONT</span><span style="color:' + col + '">' + pct + '% (' + kembali + '/' + total + ')</span></div>' +
      '<div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + col + '"></div></div>' +
    '</div>';
  }

  /* =====================================================================
     3) STOK OPNAME — pencarian + progres
  ===================================================================== */
  var _opnSearch = '';
  var _origInvOpnameLoad = window.invOpnameLoad;
  window.invOpnameLoad = function(){
    if (typeof _origInvOpnameLoad === 'function') _origInvOpnameLoad();
    setTimeout(mountOpnameTools, 50);
  };
  function mountOpnameTools(){
    var list = document.getElementById('inv-opn-list');
    if (!list || !list.parentNode || typeof _invMatiData === 'undefined') return;
    if (!document.getElementById('inv-opn-search')){
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;margin-bottom:10px';
      wrap.innerHTML = '<i class="ti ti-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--text3)"></i>' +
        '<input id="inv-opn-search" type="search" placeholder="Cari nama material…" oninput="_invOpnFilter(this.value)" ' +
        'style="width:100%;box-sizing:border-box;padding:10px 12px 10px 34px;border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:12.5px;background:var(--bg2);color:var(--text);outline:none">';
      list.parentNode.insertBefore(wrap, list);
    }
    if (!document.getElementById('inv-opn-progress')){
      var prog = document.createElement('div');
      prog.id = 'inv-opn-progress';
      prog.style.cssText = 'display:flex;gap:8px;margin-bottom:10px';
      list.parentNode.insertBefore(prog, list.nextSibling);
    }
    updateOpnameProgress();
  }
  window._invOpnFilter = function(q){
    _opnSearch = (q || '').toLowerCase();
    var rows = document.querySelectorAll('#inv-opn-list > div');
    _invMatiData.forEach(function(m, i){
      var row = rows[i]; if (!row) return;
      var match = !_opnSearch || (m.nama || '').toLowerCase().indexOf(_opnSearch) >= 0 || (m.kode || '').toLowerCase().indexOf(_opnSearch) >= 0;
      row.style.display = match ? '' : 'none';
    });
  };
  window.invOpnCalc_wtgWrap = function(){ updateOpnameProgress(); };
  var _origInvOpnCalc = window.invOpnCalc;
  window.invOpnCalc = function(itemId, sistemStok){
    if (typeof _origInvOpnCalc === 'function') _origInvOpnCalc(itemId, sistemStok);
    updateOpnameProgress();
  };
  function updateOpnameProgress(){
    var el = document.getElementById('inv-opn-progress');
    if (!el || typeof _invMatiData === 'undefined') return;
    var diisi = 0, beda = 0;
    _invMatiData.forEach(function(m){
      var inp = document.getElementById('inv-opn-f-' + m.id);
      if (!inp || inp.value === '') return;
      diisi++;
      var fisik = parseInt(inp.value);
      if (!isNaN(fisik) && fisik !== (m.stok || 0)) beda++;
    });
    el.innerHTML =
      '<div style="flex:1;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:9px 12px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:var(--c1)">' + diisi + '/' + _invMatiData.length + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">SUDAH DIINPUT</div></div>' +
      '<div style="flex:1;background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:9px 12px;text-align:center"><div style="font-family:monospace;font-size:16px;font-weight:800;color:' + (beda > 0 ? 'var(--red)' : 'var(--green)') + '">' + beda + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">ADA SELISIH</div></div>';
  }

})();
