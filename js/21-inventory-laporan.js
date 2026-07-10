

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
    sb.from('pelanggan').select('id,cid,nama,area_id,ont_item_id,kabel_item_id,status,sn_ont,teknisi_pasang,tgl_pasang,alamat'),
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
  var KELUAR = ['instalasi','keluar','distribusi','maintenance','maintenance_ont','maintenance_kabel','odp_maintenance','odc_maintenance'];
  var RUSAK  = ['rusak'];
  var HILANG = ['hilang'];

  var byItem = {};
  items.forEach(function(m){ byItem[m.id]={masuk:0,keluar:0,rusak:0,hilang:0,mutasiList:[]}; });

  mutasi.forEach(function(m){
    if(!byItem[m.item_id]) return;
    var qty = m.jumlah || 0;
    /* Koreksi opname: jumlah positif = stok bertambah (masuk), jumlah negatif = stok berkurang (keluar).
       Sebelumnya koreksi selalu dianggap masuk, sehingga opname yang menurunkan stok tidak pernah
       tercatat sebagai aktivitas keluar. */
    if(m.jenis === 'koreksi'){
      if(qty > 0) byItem[m.item_id].masuk += qty;
      else if(qty < 0) byItem[m.item_id].keluar += Math.abs(qty);
    } else {
      if(MASUK.indexOf(m.jenis)>=0 && qty>0)  byItem[m.item_id].masuk  += qty;
      if(KELUAR.indexOf(m.jenis)>=0 && qty>0) byItem[m.item_id].keluar += qty;
    }
    if(RUSAK.indexOf(m.jenis)>=0){  var rq=(qty>0?qty:1); byItem[m.item_id].rusak += rq; }
    if(HILANG.indexOf(m.jenis)>=0){ var hq=(qty>0?qty:1); byItem[m.item_id].hilang += hq; }
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
    var sc   = stok<=0?'var(--red)':(m.min_stok&&stok<=m.min_stok?'var(--yellow)':'var(--green)');
    var sl   = stok<=0?'Habis':(m.min_stok&&stok<=m.min_stok?'Rendah':'Aman');
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
      '<div style="padding:8px 14px;display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--border)">' +
        '<span style="font-size:8px;font-weight:800;padding:2px 8px;border-radius:20px;background:' + sc + '18;color:' + sc + '">' + sl + '</span>' +
        '<span style="font-size:8px;color:var(--text4)">Stok ' + (stok<=0?'habis':(m.min_stok&&stok<=m.min_stok?'di bawah minimum ('+m.min_stok+')':'normal')) + '</span>' +
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
          /* Arah +/- mengikuti nilai jumlah sebenarnya (bisa negatif untuk koreksi pengurangan),
             bukan hanya kategori jenis, supaya tidak terjadi tanda ganda seperti "+-285" */
          var rawJumlah = mut.jumlah;
          var isNegatifAsli = (typeof rawJumlah === 'number' && rawJumlah < 0);
          var isMasuk = isNegatifAsli ? false : (MASUK.indexOf(mut.jenis)>=0);
          var mc = isMasuk?'var(--green)':'var(--c2)';
          var jenisLabel = _lapEsc((mut.jenis||'').replace(/_/g,' '));
          var pelRec = mut.pel_cid ? (pelByCid[mut.pel_cid]||null) : null;
          var pelNama = pelRec ? (pelRec.nama||'') : '';
          var isDupCid = (mut.jenis === 'instalasi' && mut.pel_cid && !!cidDupSet[mut.pel_cid]);
          return '<div style="padding:6px 14px;border-bottom:1px solid var(--border2);display:flex;align-items:flex-start;gap:8px' + (isDupCid?';background:rgba(239,68,68,.05)':'') + '">' +
            '<i class="ti ' + (isMasuk?'ti-arrow-down-left':'ti-arrow-up-right') + '" style="font-size:12px;color:' + mc + ';flex-shrink:0;margin-top:2px"></i>' +
            '<div style="flex:1;min-width:0">' +
              '<span style="font-size:9px;font-weight:700;color:' + mc + '">' + jenisLabel + '</span>' +
              (mut.teknisi?' <span style="font-size:8px;color:var(--text4)">· <i class="ti ti-user" style="font-size:8px"></i> ' + _lapEsc(mut.teknisi) + '</span>':'') +
              (isDupCid?'<span style="font-size:8px;font-weight:800;color:var(--red);background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);border-radius:20px;padding:1px 6px;margin-left:4px"><i class="ti ti-alert-triangle" style="font-size:8px"></i> CID duplikat</span>':'') +
              (mut.pel_cid?'<div style="font-size:8px;color:var(--c1);margin-top:2px"><i class="ti ti-id" style="font-size:8px"></i> CID: ' + _lapEsc(mut.pel_cid) + (pelNama?' · '+_lapEsc(pelNama):'') + '</div>':'') +
            '</div>' +
            '<div style="text-align:right;flex-shrink:0">' +
              '<div style="font-size:12px;font-weight:800;color:' + mc + '">' + (isMasuk?'+':'−') + Math.abs(rawJumlah||0) + '</div>' +
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
