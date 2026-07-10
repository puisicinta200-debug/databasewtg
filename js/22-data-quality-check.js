

(function(){
'use strict';

var CRITICAL_COLS = ['nama','hp','area_id','odp_id','nomor_port','paket','status'];

function _isDataLengkap(row){

  return !!(row.nama && row.hp && row.area_id && row.paket);
}

function _getMissingCols(row){
  var missing = [];
  if(!row.nama)     missing.push('nama');
  if(!row.hp)       missing.push('hp');
  if(!row.area_id)  missing.push('area_id');
  if(!row.paket)    missing.push('paket');
  if(!row.odp_id)   missing.push('odp_id');
  if(!row.nomor_port) missing.push('nomor_port');
  return missing;
}

window._pelLastAppliedFilter = {status:'', area:'', paket:'', jenis:'', tglDari:'', tglSampai:''};
window._pelFilterApplying = false;

window.pelApplyFilter = function(){
  if(window._pelFilterApplying) return;

  var newStatus = (document.getElementById('pel-fil-status')||{}).value||'';
  var newArea   = (document.getElementById('pel-fil-area')||{}).value||'';
  var newPaket  = (document.getElementById('pel-fil-paket')||{}).value||'';
  var newJenis  = (document.getElementById('pel-fil-jenis')||{}).value||'';
  var newTglDari   = (document.getElementById('pel-fil-tgl-dari')||{}).value||'';
  var newTglSampai = (document.getElementById('pel-fil-tgl-sampai')||{}).value||'';

  /* kalau "dari" > "sampai", tukar otomatis biar tidak query kosong percuma */
  if(newTglDari && newTglSampai && newTglDari > newTglSampai){
    var _tmp = newTglDari; newTglDari = newTglSampai; newTglSampai = _tmp;
    var elD=document.getElementById('pel-fil-tgl-dari'), elS=document.getElementById('pel-fil-tgl-sampai');
    if(elD) elD.value = newTglDari;
    if(elS) elS.value = newTglSampai;
  }
  var badge = document.getElementById('pel-fil-tgl-badge');
  if(badge) badge.style.display = (newTglDari || newTglSampai) ? 'flex' : 'none';

  if(window._pelActiveFilter){
    _pelActiveFilter.status = newStatus;
    _pelActiveFilter.area   = newArea;
    _pelActiveFilter.paket  = newPaket;
    _pelActiveFilter.jenis  = newJenis;
    _pelActiveFilter.tglDari   = newTglDari;
    _pelActiveFilter.tglSampai = newTglSampai;
  }

  window._pelLastAppliedFilter = {
    status: newStatus, area: newArea,
    paket: newPaket, jenis: newJenis,
    tglDari: newTglDari, tglSampai: newTglSampai
  };

  window._pelFilterApplying = true;
  if(typeof window._pelSearchMode !== 'undefined') window._pelSearchMode = false;
  if(typeof window._pelSearchQ    !== 'undefined') window._pelSearchQ    = '';

  if(typeof pelLoadPage === 'function'){
    pelLoadPage(1);
  }


  setTimeout(function(){ window._pelFilterApplying = false; }, 100);
};

window._pelFillFilters = function(){
  var af = window._pelActiveFilter || {status:'', area:'', paket:'', jenis:''};


  var selArea = document.getElementById('pel-fil-area');
  if(selArea){
    var curA = af.area || selArea.value || '';
    var allAreas = (window.SOT && SOT.cache && SOT.cache().areas && SOT.cache().areas.length)
      ? SOT.cache().areas
      : (window._areaData || []);


    var oldOnchange = selArea.onchange;
    selArea.onchange = null;

    selArea.innerHTML = '<option value="">Semua Area</option>';
    allAreas.forEach(function(a){
      var opt = document.createElement('option');
      opt.value = a.id; opt.textContent = a.nama;
      if(a.id === curA) opt.selected = true;
      selArea.appendChild(opt);
    });
    if(curA) selArea.value = curA;


    setTimeout(function(){ selArea.onchange = oldOnchange || function(){ pelApplyFilter(); }; }, 0);
  }


  var selStatus = document.getElementById('pel-fil-status');
  if(selStatus){
    var oldOnchangeSt = selStatus.onchange;
    selStatus.onchange = null;
    if(af.status) selStatus.value = af.status;
    setTimeout(function(){ selStatus.onchange = oldOnchangeSt || function(){ pelApplyFilter(); }; }, 0);
  }


  var selJenis = document.getElementById('pel-fil-jenis');
  if(selJenis){
    var oldOnchangeJn = selJenis.onchange;
    selJenis.onchange = null;
    if(af.jenis) selJenis.value = af.jenis;
    setTimeout(function(){ selJenis.onchange = oldOnchangeJn || function(){ pelApplyFilter(); }; }, 0);
  }


  var selPaket = document.getElementById('pel-fil-paket');
  if(selPaket){
    var curP = af.paket || '';
    var oldOnchangePk = selPaket.onchange;
    selPaket.onchange = null;

    var pelList = (typeof _getPelData === 'function') ? _getPelData() : (window._pelData || []);
    var pakets = [];
    pelList.forEach(function(p){ if(p.paket && pakets.indexOf(p.paket)<0) pakets.push(p.paket); });
    pakets.sort();
    selPaket.innerHTML = '<option value="">Semua Paket</option>';
    pakets.forEach(function(pk){
      var opt = document.createElement('option');
      opt.value = pk; opt.textContent = pk;
      if(pk === curP) opt.selected = true;
      selPaket.appendChild(opt);
    });
    if(curP) selPaket.value = curP;


    var sb = (typeof getSB==='function') ? getSB() : null;
    if(sb){
      sb.from('pelanggan').select('paket').then(function(r){
        if(r.error || !r.data || !r.data.length) return;
        r.data.forEach(function(row){
          if(row.paket && pakets.indexOf(row.paket)<0){
            pakets.push(row.paket);
            var opt2 = document.createElement('option');
            opt2.value = row.paket; opt2.textContent = row.paket;
            if(row.paket === curP) opt2.selected = true;
            selPaket.appendChild(opt2);
          }
        });
        if(curP) selPaket.value = curP;
      }).catch(function(){});
    }

    setTimeout(function(){ selPaket.onchange = oldOnchangePk || function(){ pelApplyFilter(); }; }, 0);
  }
};

var _origIeDoImportCore = window._ieDoImportCore;
window._ieDoImportCore = function(sb, btn, validRows){
  if(window._ieCurrentModul !== 'pelanggan'){

    return _origIeDoImportCore(sb, btn, validRows);
  }


  window._ieImportDiag = {odpNotFound:[], noPort:[], portConflict:[], assignFailed:[], assignSkipped:[]};
  window._v31ImportStats = {skipped:0, completed:0, inserted:0, incomplete:[]};


  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span> Mengecek data existing…'; }
  if(window.ProgUI) ProgUI.step('Mengecek data pelanggan yang sudah ada di database…', 25);

  return sb.from('pelanggan')
    .select('id,cid,nama,hp,area_id,odp_id,nomor_port,paket,status,sn_ont,mac_ont,nik,kecamatan,kelurahan,rw,rt,teknisi_pasang,tgl_pasang,alamat,lat,lng,keterangan,jenis_pelanggan,tipe_recurring')
    .then(function(r){
      if(r.error){

        return _origIeDoImportCore(sb, btn, validRows);
      }


      var existingMap = {};
      (r.data||[]).forEach(function(p){
        if(p.cid) existingMap[p.cid.trim()] = p;
      });


      var toInsert   = [];
      var toComplete = [];
      var toOverwrite = [];
      var toSkip     = [];

      var fullUpdateMode = (function(){
        var cb = document.getElementById('ie-full-update-toggle');
        return !!(cb && cb.checked);
      })();

      validRows.forEach(function(csvRow){
        var csvCid = (csvRow.cid||'').trim();
        if(!csvCid){ toInsert.push(csvRow); return; }

        var existing = existingMap[csvCid];
        if(!existing){

          toInsert.push(csvRow);
          return;
        }


        var completionPayload = { cid: csvCid };


        var COMPLETABLE = ['nama','hp','nik','alamat','kecamatan','kelurahan','rw','rt',
          'paket','tgl_pasang','status','area_id','odp_id','nomor_port',
          'sn_ont','mac_ont','ont_model','teknisi_pasang','lat','lng','keterangan',
          'jenis_pelanggan','tipe_recurring'];

        var filledCount = 0, changedCount = 0;
        var filledCols = [], changedCols = [];

        COMPLETABLE.forEach(function(col){
          var dbVal = existing[col];
          var csvVal = (csvRow[col]||'').trim();
          if(!csvVal) return; /* CSV kosong utk kolom ini -> jangan sentuh data lama */

          var dbValNorm = (dbVal===null || dbVal===undefined) ? '' : String(dbVal).trim();

          if(!dbValNorm){
            /* Kolom masih kosong di DB -> selalu diisi (baik mode biasa maupun full-update) */
            completionPayload[col] = csvVal;
            filledCount++;
            filledCols.push(col);
          } else if(fullUpdateMode && dbValNorm !== csvVal){
            /* Mode full-update aktif & nilai CSV berbeda dari DB -> timpa */
            completionPayload[col] = csvVal;
            changedCount++;
            changedCols.push(col);
          }
        });

        var totalChanges = filledCount + changedCount;
        if(totalChanges){
          completionPayload._dbId = existing.id;
          completionPayload._cid = csvCid;
          completionPayload._filled = filledCols;
          completionPayload._changed = changedCols;
          var item = {csv: csvRow, payload: completionPayload, existing: existing};
          if(changedCount > 0) toOverwrite.push(item);
          else toComplete.push(item);
        } else {
          toSkip.push(csvRow);
        }
      });

      window._v31ImportStats.skipped = toSkip.length;

      if(btn){ btn.innerHTML='<span class="spin"></span> Memproses '+toInsert.length+' baru, '+toComplete.length+' dilengkapi, '+toOverwrite.length+' diupdate…'; }
      if(window.ProgUI) ProgUI.step((fullUpdateMode?'Mengupdate ':'Melengkapi ')+(toComplete.length+toOverwrite.length)+' data pelanggan…', 35);


      var completionPromises = toComplete.concat(toOverwrite).map(function(item){
        var payload = {};
        Object.keys(item.payload).forEach(function(k){
          if(k !== '_dbId' && k !== 'cid' && k !== '_cid' && k !== '_filled' && k !== '_changed') payload[k] = item.payload[k];
        });
        if(!Object.keys(payload).length) return Promise.resolve();
        return sb.from('pelanggan')
          .update(payload)
          .eq('id', item.payload._dbId)
          .then(function(res){
            if(!res.error) window._v31ImportStats.completed++;
            return res;
          }).catch(function(e){ console.warn('[V31] Completion error:', e.message); });
      });

      return Promise.all(completionPromises).then(function(){

        if(!toInsert.length){

          _v31FinishImport(sb, btn, toInsert, toComplete, toOverwrite, toSkip, existingMap);
          return;
        }

        var existingCidForInsert = existingMap;
        if(btn){ btn.innerHTML='<span class="spin"></span> Menyimpan '+toInsert.length+' pelanggan baru…'; }
        if(typeof window._ieDoImportCoreRun === 'function'){

          var fakeExistingSet = {};

          window._ieDoImportCoreRun(sb, btn, toInsert, fakeExistingSet);

          setTimeout(function(){
            _v31ShowStats(toInsert, toComplete, toOverwrite, toSkip, existingMap, sb);
          }, 500);
        }
      });
    }).catch(function(e){

      return _origIeDoImportCore(sb, btn, validRows);
    });
};

function _v31FinishImport(sb, btn, toInsert, toComplete, toOverwrite, toSkip, existingMap){
  if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-database-import"></i> Simpan ke Database'; }
  _v31ShowStats(toInsert, toComplete, toOverwrite, toSkip, existingMap, sb);

  if(typeof window !== 'undefined') window._pelLoaded = false;
  if(typeof toast === 'function'){
    toast(toInsert.length+' baru · '+toComplete.length+' dilengkapi · '+(toOverwrite||[]).length+' diperbarui · '+toSkip.length+' sama','ok');
  if(window.ProgUI) ProgUI.success(toInsert.length+' baru · '+toComplete.length+' dilengkapi · '+(toOverwrite||[]).length+' diperbarui · '+toSkip.length+' sama (tidak berubah)');
  }
}

function _v31ShowStats(toInsert, toComplete, toOverwrite, toSkip, existingMap, sb){
  toOverwrite = toOverwrite || [];
  var wrap = document.getElementById('ie-result-wrap');
  if(!wrap) return;

  var existing = document.getElementById('v31-import-stats-box');
  if(existing) existing.remove();

  var box = document.createElement('div');
  box.id = 'v31-import-stats-box';
  box.style.cssText = 'margin-top:10px;border-radius:var(--r);overflow:hidden;border:1.5px solid var(--border2)';

  var html = '<div style="padding:10px 13px;background:var(--c1);color:#fff;font-size:12px;font-weight:800"><i class="ti ti-report-analytics"></i> Hasil Import — Logika 4 Kondisi</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:var(--bg2)">';
  html += '<div style="padding:10px 6px;text-align:center;border-right:1px solid var(--border)">'
    +'<div style="font-size:20px;font-weight:800;color:var(--green)">'+toInsert.length+'</div>'
    +'<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;line-height:1.4">Baru<br>Ditambah</div>'
    +'</div>';
  html += '<div style="padding:10px 6px;text-align:center;border-right:1px solid var(--border)">'
    +'<div style="font-size:20px;font-weight:800;color:var(--c1)">'+toComplete.length+'</div>'
    +'<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;line-height:1.4">Data<br>Dilengkapi</div>'
    +'</div>';
  html += '<div style="padding:10px 6px;text-align:center;border-right:1px solid var(--border)">'
    +'<div style="font-size:20px;font-weight:800;color:var(--yellow)">'+toOverwrite.length+'</div>'
    +'<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;line-height:1.4">Data<br>Diperbarui</div>'
    +'</div>';
  html += '<div style="padding:10px 6px;text-align:center">'
    +'<div style="font-size:20px;font-weight:800;color:var(--text4)">'+toSkip.length+'</div>'
    +'<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;line-height:1.4">Identik<br>Dilewati</div>'
    +'</div>';
  html += '</div>';

  html += '<div style="padding:8px 12px;background:var(--bg3);border-top:1px solid var(--border);font-size:10px;color:var(--text2);line-height:1.8">'
    +'<b>Baru:</b> CID belum ada di DB — langsung insert. &nbsp;'
    +'<b>Dilengkapi:</b> CID ada, field kosong di DB diisi dari CSV. &nbsp;'
    +'<b>Diperbarui:</b> CID ada & isi, tapi beda — <b style="color:var(--yellow)">data CSV menang</b>. &nbsp;'
    +'<b>Dilewati:</b> Data identik, tidak perlu update.'
    +'</div>';

  if(toOverwrite.length){
    html += '<div style="padding:8px 12px;background:rgba(217,119,6,.05);border-top:1px solid var(--border);font-size:11px">';
    html += '<div style="font-weight:700;color:var(--yellow);margin-bottom:5px"><i class="ti ti-refresh"></i> Data Diperbarui dari CSV (CSV prioritas):</div>';
    html += toOverwrite.slice(0,10).map(function(item){
      var changed = item.payload._changed || [];
      var filled  = item.payload._filled  || [];
      var parts = [];
      if(changed.length) parts.push('<span style="color:var(--yellow)">diubah: '+changed.join(', ')+'</span>');
      if(filled.length)  parts.push('<span style="color:var(--c1)">diisi: '+filled.join(', ')+'</span>');
      return '<div style="padding:4px 0;border-bottom:1px solid var(--border)">• <b>'+(item.payload._cid||'—')+'</b>: '+parts.join(' · ')+'</div>';
    }).join('');
    if(toOverwrite.length > 10) html += '<div style="color:var(--text3);margin-top:4px">... dan '+(toOverwrite.length-10)+' lainnya</div>';
    html += '</div>';
  }

  if(toComplete.length){
    html += '<div style="padding:8px 12px;background:rgba(26,86,219,.04);border-top:1px solid var(--border);font-size:11px">';
    html += '<div style="font-weight:700;color:var(--c1);margin-bottom:5px"><i class="ti ti-pencil"></i> Field yang Dilengkapi (tadinya kosong):</div>';
    html += toComplete.slice(0,10).map(function(item){
      var filled = item.payload._filled || [];
      return '<div style="padding:3px 0;border-bottom:1px solid var(--border)">• <b>'+(item.payload._cid||'—')+'</b>: '+filled.join(', ')+'</div>';
    }).join('');
    if(toComplete.length > 10) html += '<div style="color:var(--text3);margin-top:4px">... dan '+(toComplete.length-10)+' lainnya</div>';
    html += '</div>';
  }

  box.innerHTML = html;
  wrap.appendChild(box);

  _v31ShowIncompletePanel(sb);
}

window.v31LoadIncomplete = function(){
  _v31ShowIncompletePanel(typeof getSB==='function' ? getSB() : null);
};

function _v31ShowIncompletePanel(sb){
  if(!sb) return;
  var targetEl = document.getElementById('v31-incomplete-panel');
  if(!targetEl){
    var pelPane = document.getElementById('p-pelanggan');
    if(!pelPane) return;
    targetEl = document.createElement('div');
    targetEl.id = 'v31-incomplete-panel';
    targetEl.style.cssText = 'margin-bottom:10px';
    var statStrip = pelPane.querySelector('.olt-stat-strip');
    if(statStrip && statStrip.parentNode){
      statStrip.parentNode.insertBefore(targetEl, statStrip.nextSibling);
    } else {
      pelPane.insertBefore(targetEl, pelPane.firstChild);
    }
  }

  targetEl.innerHTML = '<div style="padding:10px 13px;background:rgba(217,119,6,.07);border-radius:var(--r);border:1.5px solid rgba(217,119,6,.2);font-size:11px;color:var(--yellow)"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memeriksa data tidak lengkap…</div>';

  var v31Q = sb.from('pelanggan')
    .select('id,cid,nama,hp,nik,alamat,kecamatan,area_id,paket,odp_id,nomor_port,sn_ont,tgl_pasang,status,jenis_pelanggan');
  if(typeof _applyAreaFilter==='function') v31Q = _applyAreaFilter(v31Q, 'area_id');
  v31Q.then(function(r){
      if(r.error){ targetEl.innerHTML=''; return; }
      var all = r.data||[];
      var JG = JENIS_GRATIS;

      /* Kategorisasi kolom */
      var CAT = {
        pribadi  : ['nama','hp','nik','alamat','kecamatan'],
        teknis   : ['area_id','odp_id','nomor_port','sn_ont'],
        layanan  : ['paket','tgl_pasang']
      };
      var CAT_LABEL = {
        pribadi:'📋 Data Pribadi',
        teknis :'🔌 Teknis/Jaringan',
        layanan:'📦 Layanan'
      };
      var CAT_COLOR = {
        pribadi:'rgba(26,86,219,.07)',
        teknis :'rgba(220,38,38,.06)',
        layanan:'rgba(217,119,6,.06)'
      };
      var CAT_BORDER = {
        pribadi:'rgba(26,86,219,.2)',
        teknis :'rgba(220,38,38,.2)',
        layanan:'rgba(217,119,6,.2)'
      };
      var CAT_TEXT = {
        pribadi:'var(--c1)',
        teknis :'var(--red)',
        layanan:'var(--yellow)'
      };

      function getMissing(p){
        var m = {pribadi:[],teknis:[],layanan:[]};
        CAT.pribadi.forEach(function(c){ if(!p[c]) m.pribadi.push(c==='area_id'?'area':c); });
        CAT.teknis.forEach(function(c){ if(!p[c]) m.teknis.push(c==='area_id'?'area':c==='odp_id'?'ODP':c==='nomor_port'?'port':c==='sn_ont'?'SN ONT':c); });
        CAT.layanan.forEach(function(c){ if(!p[c]) m.layanan.push(c==='tgl_pasang'?'tgl pasang':c); });
        return m;
      }

      var incomplete = all.filter(function(p){
        if(JG.indexOf(p.jenis_pelanggan)>=0) return false;
        var m = getMissing(p);
        return m.pribadi.length>0||m.teknis.length>0||m.layanan.length>0;
      });

      if(!incomplete.length){
        targetEl.innerHTML='<div style="padding:10px 13px;background:rgba(5,150,105,.07);border-radius:var(--r);border:1.5px solid rgba(5,150,105,.2);font-size:11px;color:var(--green)"><i class="ti ti-circle-check"></i> Semua data pelanggan berbayar sudah lengkap ✓</div>';
        return;
      }

      /* Hitung per kategori */
      var countCat={pribadi:0,teknis:0,layanan:0};
      incomplete.forEach(function(p){
        var m=getMissing(p);
        if(m.pribadi.length) countCat.pribadi++;
        if(m.teknis.length)  countCat.teknis++;
        if(m.layanan.length) countCat.layanan++;
      });

      /* State: filter aktif + halaman (panel disembunyikan otomatis saat pertama kali dibuka) */
      var _state = {filter:'semua', page:1, perPage:20, bodyVisible:false};
      var _allData = incomplete;

      function render(){
        var data = _state.filter==='semua' ? _allData
          : _allData.filter(function(p){
              var m=getMissing(p);
              return m[_state.filter] && m[_state.filter].length>0;
            });
        var total = data.length;
        var pages = Math.max(1, Math.ceil(total/_state.perPage));
        if(_state.page>pages) _state.page=pages;
        var slice = data.slice((_state.page-1)*_state.perPage, _state.page*_state.perPage);

        var h='';
        /* Header */
        h+='<div style="padding:9px 13px;background:rgba(217,119,6,.1);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">';
        h+='<div style="font-size:11px;font-weight:800;color:var(--yellow)"><i class="ti ti-alert-triangle"></i> '+_allData.length+' Pelanggan Data Belum Lengkap'+((typeof _isGlobalRole==='function'&&!_isGlobalRole())?' · '+_esc(_getAreaScopeLabel()):'')+'</div>';
        h+='<button onclick="v31IncToggle()" style="background:none;border:none;font-size:11px;font-weight:700;color:var(--yellow);cursor:pointer">Lihat/Sembunyikan</button>';
        h+='</div>';

        h+='<div id="v31-inc-body" style="display:'+(_state.bodyVisible?'block':'none')+'">';

        /* Filter tabs */
        h+='<div style="display:flex;gap:6px;padding:8px 13px;background:var(--bg3);flex-wrap:wrap">';
        var tabs=[
          ['semua','Semua ('+_allData.length+')','var(--text2)'],
          ['pribadi',CAT_LABEL.pribadi+' ('+countCat.pribadi+')',CAT_TEXT.pribadi],
          ['teknis', CAT_LABEL.teknis +' ('+countCat.teknis +')',CAT_TEXT.teknis],
          ['layanan',CAT_LABEL.layanan+' ('+countCat.layanan+')',CAT_TEXT.layanan]
        ];
        tabs.forEach(function(t){
          var active=_state.filter===t[0];
          h+='<button onclick="v31IncFilter(\''+t[0]+'\')" style="padding:4px 10px;border-radius:20px;font-family:\'Sora\',sans-serif;font-size:10px;font-weight:700;cursor:pointer;border:1.5px solid '+(active?t[2]:'var(--border2)')+';background:'+(active?t[2]+'18':'transparent')+';color:'+(active?t[2]:'var(--text3)')+'">'+t[1]+'</button>';
        });
        h+='</div>';

        /* List */
        h+='<div style="max-height:320px;overflow-y:auto">';
        if(!slice.length){
          h+='<div style="padding:16px;text-align:center;color:var(--text3);font-size:11px">Tidak ada pelanggan dengan masalah ini</div>';
        } else {
          slice.forEach(function(p){
            var m=getMissing(p);
            var cats=[];
            ['pribadi','teknis','layanan'].forEach(function(cat){
              if(m[cat]&&m[cat].length){
                cats.push('<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;background:'+CAT_COLOR[cat]+';color:'+CAT_TEXT[cat]+';border:1px solid '+CAT_BORDER[cat]+'">'+CAT_LABEL[cat].split(' ')[1]+': '+m[cat].slice(0,3).join(', ')+(m[cat].length>3?'…':'')+'</span>');
              }
            });
            h+='<div style="padding:8px 13px;border-top:1px solid var(--border);display:flex;align-items:flex-start;gap:8px">';
            h+='<div style="flex:1;min-width:0">';
            h+='<div style="font-size:11px;font-weight:700;color:var(--text)">'+(p.nama||'—')+'</div>';
            h+='<div style="font-size:10px;color:var(--text3);font-family:\'JetBrains Mono\',monospace">'+( p.cid||'—')+'</div>';
            h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:3px">'+cats.join('')+'</div>';
            h+='</div>';
            if(typeof pelOpenDet==='function'){
              h+='<button onclick="pelOpenDet(\''+p.id+'\')" style="flex-shrink:0;padding:5px 10px;border:none;border-radius:var(--rs);background:var(--c1);color:#fff;font-family:\'Sora\',sans-serif;font-size:10px;font-weight:700;cursor:pointer;touch-action:manipulation">Edit</button>';
            }
            h+='</div>';
          });
        }
        h+='</div>';

        /* Pagination */
        if(pages>1){
          h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 13px;background:var(--bg3);border-top:1px solid var(--border)">';
          h+='<button onclick="v31IncPage(-1)" '+((_state.page<=1)?'disabled':'')+' style="padding:5px 10px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:var(--rs);font-size:10px;font-weight:700;cursor:pointer;color:'+(_state.page<=1?'var(--text4)':'var(--c1)')+';touch-action:manipulation">‹ Prev</button>';
          h+='<span style="font-size:10px;color:var(--text3);font-weight:700">'+_state.page+'/'+pages+' ('+total+' total)</span>';
          h+='<button onclick="v31IncPage(1)" '+((_state.page>=pages)?'disabled':'')+' style="padding:5px 10px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:var(--rs);font-size:10px;font-weight:700;cursor:pointer;color:'+(_state.page>=pages?'var(--text4)':'var(--c1)')+';touch-action:manipulation">Next ›</button>';
          h+='</div>';
        }

        h+='</div>'; /* /v31-inc-body */
        targetEl.innerHTML=h;

        /* Expose controllers */
        window.v31IncFilter = function(f){
          _state.filter=f; _state.page=1; render();
        };
        window.v31IncPage = function(d){
          _state.page=Math.max(1,_state.page+d); render();
        };
        window.v31IncToggle = function(){
          _state.bodyVisible = !_state.bodyVisible; render();
        };
      }

      render();
    }).catch(function(){ targetEl.innerHTML=''; });
}

var _origPelLoad = window.pelLoad;
window.pelLoad = function(){
  if(typeof _origPelLoad === 'function') _origPelLoad.apply(this, arguments);

  setTimeout(function(){
    var sb = (typeof getSB==='function') ? getSB() : null;
    _v31ShowIncompletePanel(sb);
  }, 800);
};

function _patchSotPortStats(){
  if(!window.SOT || typeof SOT.portStats !== 'function') return;

  var _origPortStats = SOT.portStats;
  SOT.portStats = function(areaId){
    var baseStats = _origPortStats.call(this, areaId);


    var c = this._cache;
    var pels = c.pelanggan || [];
    if(areaId){
      pels = pels.filter(function(p){ return p.area_id === areaId; });
    }


    var pelWithPort = pels.filter(function(p){
      return (p.status === 'aktif' || p.status === 'maintenance')
          && p.odp_id && p.nomor_port;
    });


    var ports = c.ports || [];
    if(areaId){
      var odpIds = {};
      (c.odps||[]).filter(function(o){ return o.area_id===areaId; })
        .forEach(function(o){ odpIds[o.id]=1; });
      ports = ports.filter(function(p){ return odpIds[p.odp_id]; });
    }


    var portInTable = {};
    ports.forEach(function(p){
      if(p.odp_id && p.nomor_port){
        portInTable[p.odp_id+'::'+p.nomor_port] = true;
      }
    });


    var ghostUsed = 0;
    pelWithPort.forEach(function(p){
      var key = p.odp_id+'::'+p.nomor_port;
      if(!portInTable[key]) ghostUsed++;
    });

    if(ghostUsed > 0){

      var newUsed = baseStats.used + ghostUsed;
      var newFree = baseStats.free - ghostUsed;
      return {
        total   : baseStats.total,
        used    : newUsed,
        free    : newFree < 0 ? 0 : newFree,
        damaged : baseStats.damaged,
        pct     : baseStats.total ? Math.round(newUsed/baseStats.total*100) : 0,
        ghost   : ghostUsed
      };
    }

    return baseStats;
  };
  SOT.portStats._v31 = true;


  var _origOdpStats = SOT.odpStats;
  SOT.odpStats = function(odpId){
    var baseStats = _origOdpStats.call(this, odpId);

    var c = this._cache;

    var pelWithPort = (c.pelanggan||[]).filter(function(p){
      return p.odp_id === odpId
          && (p.status === 'aktif' || p.status === 'maintenance')
          && p.nomor_port;
    });


    var portInTable = {};
    (this._portByOdp && this._portByOdp[odpId] || []).forEach(function(p){
      if(p.nomor_port) portInTable[p.nomor_port] = true;
    });

    var ghostUsed = 0;
    pelWithPort.forEach(function(p){
      if(!portInTable[p.nomor_port]) ghostUsed++;
    });

    if(ghostUsed > 0){
      var newUsed = baseStats.used + ghostUsed;
      var newFree = baseStats.free - ghostUsed;
      return {
        total   : baseStats.total,
        used    : newUsed,
        free    : newFree < 0 ? 0 : newFree,
        damaged : baseStats.damaged,
        pct     : baseStats.total ? Math.round(newUsed/baseStats.total*100) : 0,
        ghost   : ghostUsed
      };
    }

    return baseStats;
  };
  SOT.odpStats._v31 = true;
}

if(window.SOT && typeof SOT.portStats === 'function'){
  _patchSotPortStats();
} else {
  var _v31PatchInterval = setInterval(function(){
    if(window.SOT && typeof SOT.portStats === 'function'){
      clearInterval(_v31PatchInterval);
      _patchSotPortStats();
    }
  }, 200);
}

window.pelPortReconcile = function(autoFix){
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(typeof toast==='function') toast('Database tidak terhubung','err'); return; }

  if(typeof toast==='function') toast('Memeriksa konsistensi port & pelanggan…','info');

  Promise.all([
    sb.from('pelanggan')
      .select('id,cid,nama,status,jenis_pelanggan,area_id,odp_id,nomor_port')
      .in('status', ['aktif','maintenance']),
    sb.from('odp_ports')
      .select('id,odp_id,nomor_port,status,cid_pelanggan,pel_id')
  ]).then(function(results){
    var pels  = (results[0].error ? [] : results[0].data) || [];
    var ports = (results[1].error ? [] : results[1].data) || [];


    var portMap = {};
    ports.forEach(function(p){
      if(p.odp_id && p.nomor_port != null){
        portMap[p.odp_id+'::'+p.nomor_port] = p;
      }
    });


    var missing    = [];
    var wrongCid   = [];
    var orphaned   = [];


    var pelWithPort = pels.filter(function(p){ return p.odp_id && p.nomor_port != null; });

    pelWithPort.forEach(function(p){
      var key = p.odp_id+'::'+p.nomor_port;
      var portRow = portMap[key];
      if(!portRow){
        missing.push(p);
      } else if(portRow.cid_pelanggan && portRow.cid_pelanggan !== p.cid){
        wrongCid.push({pelanggan: p, port: portRow, conflict_cid: portRow.cid_pelanggan});
      }
    });


    var pelCids = {};
    pelWithPort.forEach(function(p){ if(p.cid && p.odp_id && p.nomor_port!=null) pelCids[p.odp_id+'::'+p.nomor_port] = p; });
    ports.filter(function(pt){ return pt.status==='terpakai'||pt.status==='used'; })
      .forEach(function(pt){
        var key = pt.odp_id+'::'+pt.nomor_port;
        if(!pelCids[key]) orphaned.push(pt);
      });


    var resultEl = document.getElementById('v31-reconcile-result');
    if(!resultEl){

      var pelPane = document.getElementById('p-pelanggan');
      if(!pelPane) return;
      resultEl = document.createElement('div');
      resultEl.id = 'v31-reconcile-result';
      pelPane.appendChild(resultEl);
    }

    var html = '<div style="border-radius:var(--r);overflow:hidden;border:1.5px solid var(--border2);margin-bottom:10px">';
    html += '<div style="padding:10px 13px;background:var(--bg3);font-size:12px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">';
    html += '<i class="ti ti-git-compare"></i> Hasil Rekonsiliasi Port ↔ Pelanggan';
    html += '<button onclick="document.getElementById(\'v31-reconcile-result\').remove()" style="margin-left:auto;background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px">✕</button>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);background:var(--bg2)">';
    html += '<div style="padding:10px;text-align:center;border-right:1px solid var(--border)">';
    html += '<div style="font-size:20px;font-weight:800;color:'+(missing.length?'var(--red)':'var(--green)')+'">'+missing.length+'</div>';
    html += '<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase">Pelanggan tanpa Port Entry</div></div>';

    html += '<div style="padding:10px;text-align:center;border-right:1px solid var(--border)">';
    html += '<div style="font-size:20px;font-weight:800;color:'+(wrongCid.length?'var(--yellow)':'var(--green)')+'">'+wrongCid.length+'</div>';
    html += '<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase">CID Port Berbeda</div></div>';

    html += '<div style="padding:10px;text-align:center">';
    html += '<div style="font-size:20px;font-weight:800;color:'+(orphaned.length?'var(--yellow)':'var(--green)')+'">'+orphaned.length+'</div>';
    html += '<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase">Port Terpakai tanpa Pelanggan</div></div>';
    html += '</div>';

    if(missing.length || wrongCid.length){
      html += '<div style="padding:8px 13px;border-top:1px solid var(--border);background:var(--bg2)">';
      if(missing.length && autoFix !== false){
        html += '<button onclick="pelPortAutoFix()" style="padding:7px 14px;border:none;border-radius:var(--rs);background:var(--c1);color:#fff;font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;cursor:pointer;margin-right:8px"><i class="ti ti-tool"></i> Auto-Fix '+missing.length+' Entri Missing</button>';
      }
      html += '</div>';

      if(missing.length){
        html += '<div style="max-height:200px;overflow-y:auto;border-top:1px solid var(--border)">';
        html += missing.slice(0,20).map(function(p){
          return '<div style="padding:6px 13px;border-bottom:1px solid var(--border);font-size:10.5px;display:flex;align-items:center;gap:6px">'
            +'<i class="ti ti-circle-x" style="color:var(--red);flex-shrink:0"></i>'
            +'<div><b>'+_esc(p.cid||'—')+'</b> · '+_esc(p.nama||'—')+' · ODP: '+_esc(p.odp_id||'—')+' Port: '+_esc(String(p.nomor_port||'—'))+'</div>'
            +'</div>';
        }).join('');
        if(missing.length>20) html += '<div style="padding:6px 13px;font-size:10px;color:var(--text3)">... dan '+(missing.length-20)+' lainnya</div>';
        html += '</div>';
      }
    } else {
      html += '<div style="padding:12px 13px;background:rgba(5,150,105,.06);border-top:1px solid var(--border);font-size:11px;color:var(--green);font-weight:700"><i class="ti ti-circle-check"></i> Data port dan pelanggan sudah konsisten!</div>';
    }

    html += '</div>';
    resultEl.innerHTML = html;


    window._v31MissingPorts = missing;

    if(typeof toast === 'function'){
      var msg = missing.length+' missing, '+wrongCid.length+' wrong CID, '+orphaned.length+' orphaned';
      toast('Rekonsiliasi selesai: '+msg, (missing.length||wrongCid.length)?'err':'ok');
    }
  }).catch(function(e){
    if(typeof toast==='function') toast('Error rekonsiliasi: '+(e.message||'coba lagi'),'err');
  });
};

window.pelPortAutoFix = function(){
  var missing = window._v31MissingPorts || [];
  if(!missing.length){ if(typeof toast==='function') toast('Tidak ada yang perlu diperbaiki','info'); return; }

  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(typeof toast==='function') toast('Database tidak terhubung','err'); return; }

  if(!confirm('Auto-fix akan menambahkan '+missing.length+' baris ke tabel odp_ports untuk pelanggan yang belum ter-daftarkan. Lanjutkan?')) return;

  if(typeof toast==='function') toast('Memproses auto-fix…','info');

  var toInsert = missing.filter(function(p){ return p.odp_id && p.nomor_port != null; })
    .map(function(p){
      return {
        odp_id       : p.odp_id,
        nomor_port   : parseInt(p.nomor_port) || p.nomor_port,
        status       : 'terpakai',
        cid_pelanggan: p.cid || null,
        pel_id       : p.id  || null
      };
    });

  if(!toInsert.length){
    if(typeof toast==='function') toast('Tidak ada data yang cukup untuk auto-fix','err');
    return;
  }


  var batches = [];
  for(var i=0; i<toInsert.length; i+=50) batches.push(toInsert.slice(i,i+50));

  var successCount = 0;
  var batchPromises = batches.map(function(batch){
    return sb.from('odp_ports').upsert(batch, {onConflict:'odp_id,nomor_port',ignoreDuplicates:true})
      .then(function(r){
        if(!r.error) successCount += batch.length;
        else console.warn('[V31 AutoFix]', r.error.message);
      }).catch(function(e){ console.warn('[V31 AutoFix error]', e.message); });
  });

  Promise.all(batchPromises).then(function(){
    if(typeof toast==='function') toast('Auto-fix selesai: '+successCount+'/'+toInsert.length+' berhasil ditambahkan','ok');

    if(window.SOT && typeof SOT.invalidate==='function') SOT.invalidate('general');

    setTimeout(function(){ window.pelPortReconcile(false); }, 800);
  });
};

function _v31AddReconcileBtn(){
  var toolbar = document.querySelector('#p-pelanggan .olt-toolbar');
  if(!toolbar) return;
  if(document.getElementById('v31-reconcile-btn')) return;

  var btn = document.createElement('button');
  btn.id = 'v31-reconcile-btn';
  btn.className = 'btn';
  btn.style.cssText = 'background:var(--pu);font-size:11px;padding:8px 12px;flex-shrink:0';
  btn.innerHTML = '<i class="ti ti-git-compare"></i> Cek Port';
  btn.onclick = function(){ window.pelPortReconcile(true); };
  btn.title = 'Rekonsiliasi: bandingkan jumlah pelanggan aktif vs port terpakai';

  toolbar.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', function(){
  setTimeout(_v31AddReconcileBtn, 1500);
});

if(typeof window.navTo === 'function'){
  var _origNavTo = window.navTo;
  window.navTo = function(pane){
    _origNavTo.apply(this, arguments);
    if(pane === 'p-pelanggan'){
      setTimeout(_v31AddReconcileBtn, 300);
    }
  };
}

if(typeof window._esc !== 'function'){
  window._esc = function(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  };
}

/* ═══════════════════════════════════════════════════════════════════
   PATCH: Audit Log Pelanggan Human-Readable
   - Tangkap data SEBELUM disimpan (dari cache _getPelData) dan SESUDAH
     (dari form) lalu kirim ke _auditLog sebagai oldData/newData.
   - keterangan jadi "Edit pelanggan: Nama (CID)" / "Pelanggan baru: ..."
   - data_lama/data_baru disimpan sebagai JSON ringkas berisi field
     yang relevan saja (bukan seluruh row), supaya diff mudah dibaca.
   ═══════════════════════════════════════════════════════════════════ */
(function(){

  var PEL_FIELD_LABEL = {
    cid              : 'CID',
    nama             : 'Nama Pelanggan',
    hp               : 'No. HP',
    nik              : 'NIK',
    alamat           : 'Alamat',
    area_id          : 'Area',
    area_coverage    : 'Area Coverage',
    kecamatan        : 'Kecamatan',
    kelurahan        : 'Kelurahan',
    rw               : 'RW',
    rt               : 'RT',
    odp_id           : 'ODP',
    nomor_port       : 'Nomor Port',
    paket            : 'Paket',
    jenis_pelanggan  : 'Jenis Pelanggan',
    tipe_recurring   : 'Tipe Recurring',
    tgl_pasang       : 'Tanggal Pasang',
    status           : 'Status',
    lat              : 'Latitude',
    lng              : 'Longitude',
    keterangan       : 'Keterangan',
    sn_ont           : 'SN ONT',
    mac_ont          : 'MAC ONT',
    ont_model        : 'Model ONT',
    panjang_kabel    : 'Panjang Kabel',
    teknisi_pasang   : 'Teknisi Pasang',
    alasan           : 'Alasan Cabut',
    catatan          : 'Catatan Cabut',
    tgl_cabut        : 'Tanggal Cabut',
    teknisi          : 'Teknisi'
  };

  function pelFieldLabel(key){
    return PEL_FIELD_LABEL[key] || key.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();});
  }

  /* Snapshot ringkas dari object pelanggan/dismantle (cache lama atau data baru) —
     hanya field yang ada di PEL_FIELD_LABEL agar payload kecil & relevan.
     Diekspos ke window supaya bisa dipakai modul lain (mis. dismantle). */
  function pelSnapshot(obj){
    if(!obj) return null;
    var out = {};
    Object.keys(PEL_FIELD_LABEL).forEach(function(k){
      if(obj[k] !== undefined && obj[k] !== null && obj[k] !== '') out[k] = obj[k];
    });
    return out;
  }
  window._pelSnapshot = pelSnapshot;

  /* ═══════════════════════════════════════════════════════════════════
     SATU-SATUNYA fungsi pencatat activity_log untuk seluruh aplikasi.
     Dipanggil HANYA dari titik yang memastikan operasi DB benar-benar
     berhasil (bukan dari wrapper UI yang tereksekusi lebih dulu),
     supaya tidak ada entri log yang hilang, ganda, atau prematur.

     3 kategori yang dipakai modul Pelanggan (Reporting > Aktivitas & Log Ubahan):
       1) _auditLog('pelanggan', 'create', cid, null,    dataBaru)   → Pelanggan baru
       2) _auditLog('pelanggan', 'update', cid, dataLama, dataBaru)  → Edit / maintenance
       3) _auditLog('dismantle','cabut',   cid, dataLama, dataBaru)  → Dismantle/cabut
     ═══════════════════════════════════════════════════════════════════ */
  window._auditLog = function(module, action, refId, oldData, newData){
    var sb = (typeof getSB==='function') ? getSB() : null;
    if(!sb) return;
    var aktorNama = (window.CU && (CU.nama||CU.username||CU.name)) || 'System';
    var aktorRole = (typeof normalizeRole==='function') ? normalizeRole(window.CR) : (window.CR||'unknown');

    var _isUuidRef = refId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(refId));

    var displayNama = (newData && newData.nama) || (oldData && oldData.nama) || '';
    var displayCid  = (newData && newData.cid)  || (oldData && oldData.cid)  || (!_isUuidRef ? refId : '') || '';

    var keterangan;
    if(module === 'pelanggan' && action === 'create'){
      keterangan = 'Pelanggan baru: ' + (displayNama||'—') + (displayCid?' ('+displayCid+')':'');
    } else if(module === 'pelanggan' && action === 'update'){
      keterangan = 'Edit pelanggan: ' + (displayNama||'—') + (displayCid?' ('+displayCid+')':'');
    } else if(module === 'dismantle'){
      var alasanTxt = (newData && newData.alasan) || '';
      keterangan = 'Dismantle pelanggan: ' + (displayNama||'—') + (displayCid?' ('+displayCid+')':'') +
                   (alasanTxt ? ' — ' + alasanTxt : '');
    } else {
      var _refDisplay = refId ? ((!_isUuidRef) ? String(refId).slice(0,40) : ('ID:'+String(refId).slice(0,8))) : '';
      keterangan = '['+module+'] '+action+(_refDisplay?' · '+_refDisplay:'');
    }

    var payload = {
      jenis          : module + '_' + action,
      keterangan     : keterangan,
      dilakukan_oleh : aktorNama,
      role_aktor     : aktorRole,
      /* PENTING: kolom ref_id di tabel activity_log bertipe UUID.
         Kalau refId yang dikirim BUKAN berformat UUID (mis. kode CID
         seperti "JJC-00184"), JANGAN dikirim ke ref_id — biarkan null,
         supaya insert tidak gagal (Postgres akan menolak string bukan
         UUID di kolom UUID). Info refId non-UUID tetap muncul di
         `keterangan` di atas, jadi tidak ada informasi yang hilang. */
      ref_id         : _isUuidRef ? refId : null,
      tgl            : new Date().toISOString().slice(0,10)
    };

    if(oldData) payload.data_lama = JSON.stringify(oldData).slice(0,1000);
    if(newData) payload.data_baru = JSON.stringify(newData).slice(0,1000);
    sb.from('activity_log').insert([payload]).then(function(r){
      if(r && r.error) console.error('[_auditLog] gagal insert activity_log:', r.error, payload);
    }).catch(function(e){
      console.error('[_auditLog] exception saat insert activity_log:', e, payload);
    });
  };

  /* Bungkus window.pelSave HANYA untuk menangkap snapshot data LAMA
     (dari cache, sebelum form disimpan) dan menitipkannya lewat variabel
     sementara window._pelAuditOldSnap. Snapshot ini dibaca dan langsung
     dibersihkan oleh pelSave dasar / _doStockAndFinish tepat setelah DB
     benar-benar sukses — di sanalah _auditLog benar-benar dipanggil
     (lihat pelSave dasar ~baris 15733 dan _doStockAndFinish di dekatnya).
     Wrapper ini SENGAJA tidak lagi memanggil _auditLog sendiri, supaya
     tidak terjadi log ganda / log yang tercatat sebelum save selesai. */
  var _origPelSaveAuditDiff = window.pelSave;
  if(typeof _origPelSaveAuditDiff === 'function' && !_origPelSaveAuditDiff._auditDiffPatch){
    window.pelSave = function(){
      var editId = (document.getElementById('pelf-id')||{}).value||'';
      var isNew  = !editId;

      window._pelAuditOldSnap = null;
      if(!isNew && typeof _getPelData==='function'){
        var existing = _getPelData().find(function(p){ return p.id===editId; });
        if(existing) window._pelAuditOldSnap = pelSnapshot(existing);
      }

      return _origPelSaveAuditDiff.apply(this, arguments);
    };
    window.pelSave._auditDiffPatch = true;
    window.pelSave._p4audit = true;
  }

  /* ── Render diff field human-readable di Reporting (Aktivitas & Log Ubahan) ──
     Mengganti tampilan JSON mentah dengan daftar "Field: lama → baru". */
  function pelDiffRows(dataLamaStr, dataBaruStr){
    var lama = {}, baru = {};
    try{ if(dataLamaStr) lama = JSON.parse(dataLamaStr); }catch(e){}
    try{ if(dataBaruStr) baru = JSON.parse(dataBaruStr); }catch(e){}
    var keys = [];
    Object.keys(baru).forEach(function(k){ if(keys.indexOf(k)<0) keys.push(k); });
    Object.keys(lama).forEach(function(k){ if(keys.indexOf(k)<0) keys.push(k); });

    var rows = [];
    keys.forEach(function(k){
      var lv = lama[k]!==undefined ? String(lama[k]) : '';
      var bv = baru[k]!==undefined ? String(baru[k]) : '';
      if(lv === bv) return; /* hanya field yang benar-benar berubah */
      rows.push({ label: pelFieldLabel(k), lama: lv||'—', baru: bv||'—' });
    });
    return rows;
  }

  window._rptLogRenderDetail = function(detailId, row){
    var rows = pelDiffRows(row.data_lama, row.data_baru);
    if(!rows.length){
      /* fallback: bukan modul pelanggan / tidak ada diff terdeteksi → tampilkan mentah seperti semula */
      var raw = '';
      if(row.data_lama) raw += '<div style="font-size:10px;font-weight:700;color:var(--red);margin-bottom:3px">SEBELUM:</div><div style="font-size:10px;color:var(--text2);font-family:monospace;word-break:break-all;white-space:pre-wrap;background:var(--rg2);padding:6px 8px;border-radius:6px;margin-bottom:6px">'+_esc(row.data_lama)+'</div>';
      if(row.data_baru) raw += '<div style="font-size:10px;font-weight:700;color:var(--green);margin-bottom:3px">SESUDAH:</div><div style="font-size:10px;color:var(--text2);font-family:monospace;word-break:break-all;white-space:pre-wrap;background:var(--gng2);padding:6px 8px;border-radius:6px">'+_esc(row.data_baru)+'</div>';
      return raw;
    }
    return '<div style="font-size:10px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px">Yang Diubah</div>' +
      rows.map(function(r){
        return '<div style="margin-bottom:7px;font-size:11px">' +
          '<div style="font-weight:700;color:var(--text);margin-bottom:2px">'+_esc(r.label)+'</div>' +
          '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
            '<span style="color:var(--red);background:var(--rg2);padding:2px 7px;border-radius:6px;word-break:break-word">'+_esc(r.lama)+'</span>' +
            '<i class="ti ti-arrow-right" style="font-size:11px;color:var(--text3)"></i>' +
            '<span style="color:var(--green);background:var(--gng2);padding:2px 7px;border-radius:6px;word-break:break-word">'+_esc(r.baru)+'</span>' +
          '</div>' +
        '</div>';
      }).join('');
  };

  /* Patch _rptLogRender supaya memakai window._rptLogRenderDetail di atas,
     sambil tetap memakai layout kartu & filter yang sudah ada. */
  if(typeof window._rptLogRender === 'function' && !window._rptLogRender._diffPatch){
    window._rptLogRender = function(rows, append){
      var list = document.getElementById('rpt-log-list');
      if(!list) return;

      if(!rows.length && !append){
        list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text3);font-size:12px"><i class="ti ti-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:.3"></i>Tidak ada log ditemukan</div>';
        return;
      }

      var aksiLabel = function(jenis){
        if(!jenis) return {lbl:'—', color:'var(--text3)', bg:'var(--bg3)'};
        var j = jenis.toLowerCase();
        if(j.indexOf('create')>=0||j.indexOf('insert')>=0||j.indexOf('tambah')>=0||j.indexOf('add')>=0)
          return {lbl:'➕ Tambah', color:'var(--green)', bg:'var(--gng2)'};
        if(j.indexOf('update')>=0||j.indexOf('edit')>=0||j.indexOf('ubah')>=0||j.indexOf('perbarui')>=0)
          return {lbl:'✏️ Ubah',   color:'var(--c1)',   bg:'var(--c1b)'};
        if(j.indexOf('delete')>=0||j.indexOf('hapus')>=0||j.indexOf('remove')>=0)
          return {lbl:'🗑️ Hapus',  color:'var(--red)',  bg:'var(--rg2)'};
        if(j.indexOf('dismantle')>=0)
          return {lbl:'🔧 Cabut',  color:'var(--c2)',   bg:'var(--c2b)'};
        if(j.indexOf('approval')>=0||j.indexOf('approve')>=0)
          return {lbl:'✅ Approve', color:'var(--green)', bg:'var(--gng2)'};
        return {lbl:jenis.replace(/_/g,' '), color:'var(--text3)', bg:'var(--bg3)'};
      };

      var fmtDT = function(s){
        if(!s) return '—';
        var d = new Date(s);
        if(isNaN(d)) return s;
        var pad = function(n){ return n<10?'0'+n:n; };
        return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' · '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
      };

      var html = rows.map(function(row){
        var ak = aksiLabel(row.jenis);
        var _jenisMap={'pelanggan':'PELANGGAN','area':'AREA','odp':'ODP','odc':'ODC',
          'olt':'OLT','users':'AKUN','fee':'FEE','dismantle':'CABUT','material':'MATERIAL',
          'invoice':'INVOICE'};
        var jenisArr=(row.jenis||'').split('_');
        var modul = _jenisMap[jenisArr[0]] || jenisArr[0].toUpperCase() || '—';
        var hasDetail = row.data_lama || row.data_baru;
        var detailId  = 'rptlog-detail-'+(row.id||Math.random().toString(36).slice(2));
        return '<div style="background:var(--bg2);border-radius:12px;border:1.5px solid var(--border);overflow:hidden">'+
          '<div style="padding:12px 14px">'+
            '<div style="display:flex;align-items:flex-start;gap:10px">'+
              '<div style="flex:1;min-width:0">'+
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap">'+
                  '<span style="font-size:10px;font-weight:800;padding:2px 10px;border-radius:20px;background:'+ak.bg+';color:'+ak.color+'">'+ak.lbl+'</span>'+
                  '<span style="font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px">'+_esc(modul)+'</span>'+
                '</div>'+
                '<div style="font-size:12px;color:var(--text);margin-bottom:6px;word-break:break-word;font-weight:600">'+_esc(row.keterangan||'—')+'</div>'+
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'+
                  '<span style="font-size:10px;font-weight:700;color:var(--pu);background:var(--pug);padding:2px 8px;border-radius:20px">'+_esc(row.dilakukan_oleh||'—')+'</span>'+
                  (row.role_aktor?'<span style="font-size:10px;color:var(--text3)">'+_esc(row.role_aktor)+'</span>':'')+
                  '<span style="font-size:10px;color:var(--text3);margin-left:auto;font-family:monospace">'+fmtDT(row.created_at)+'</span>'+
                '</div>'+
              '</div>'+
            '</div>'+
            (hasDetail?
              '<button onclick="(function(id){var el=document.getElementById(id);el.style.display=el.style.display===\'none\'?\'\':\'none\';})(\''+detailId+'\')" '+
              'style="margin-top:8px;width:100%;padding:6px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-family:Sora,sans-serif;font-size:10px;font-weight:700;color:var(--text2);cursor:pointer;touch-action:manipulation">'+
              '&#128269; Lihat Detail Perubahan</button>':'')+
          '</div>'+
          (hasDetail?
            '<div id="'+detailId+'" style="display:none;padding:10px 14px;background:var(--bg3);border-top:1px solid var(--border)">'+
              window._rptLogRenderDetail(detailId, row) +
            '</div>':'')+
        '</div>';
      }).join('');

      if(append) list.innerHTML += html;
      else list.innerHTML = html;
    };
    window._rptLogRender._diffPatch = true;
  }

})();

})();

