
/* ── Show detail result ── */
function ieShowDetailResult(total, ok, fail, conflictKey, dupList){
  dupList = dupList||[];
  document.getElementById('ie-preview-wrap').style.display='none';
  var wrap = document.getElementById('ie-result-wrap');
  if(!wrap) return;

  /* Summary pills */
  var pct  = total ? Math.round(ok.length/total*100) : 0;
  var allOk = fail.length===0 && dupList.length===0;
  var rawTotal = total + dupList.length; /* total sebelum dedup */
  var sumEl = document.getElementById('ie-result-summary');
  sumEl.innerHTML =
    '<div style="flex:1;background:'+(allOk?'var(--gng2)':'var(--bg3)')+';border:1px solid '+(allOk?'rgba(5,150,105,.25)':'var(--border2)')+';border-radius:var(--rs);padding:10px 12px;text-align:center">'+
      '<div style="font-size:22px;font-weight:800;color:var(--green)">'+ok.length+'</div>'+
      '<div style="font-size:10px;color:var(--text3);font-weight:700">BERHASIL</div></div>'+
    '<div style="flex:1;background:'+(fail.length?'var(--rg2)':'var(--bg3)')+';border:1px solid '+(fail.length?'rgba(220,38,38,.25)':'var(--border2)')+';border-radius:var(--rs);padding:10px 12px;text-align:center">'+
      '<div style="font-size:22px;font-weight:800;color:'+(fail.length?'var(--red)':'var(--text3)')+'">'+fail.length+'</div>'+
      '<div style="font-size:10px;color:var(--text3);font-weight:700">GAGAL</div></div>'+
    (dupList.length ?
    '<div style="flex:1;background:var(--yg);border:1px solid rgba(217,119,6,.25);border-radius:var(--rs);padding:10px 12px;text-align:center">'+
      '<div style="font-size:22px;font-weight:800;color:var(--yellow)">'+dupList.length+'</div>'+
      '<div style="font-size:10px;color:var(--text3);font-weight:700">KODE DOBEL</div></div>' : '')+
    '<div style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--rs);padding:10px 12px;text-align:center">'+
      '<div style="font-size:22px;font-weight:800;color:var(--text)">'+rawTotal+'</div>'+
      '<div style="font-size:10px;color:var(--text3);font-weight:700">TOTAL CSV</div></div>';

  /* Progress bar */
  var bar = document.getElementById('ie-result-bar');
  if(bar){ bar.style.width=pct+'%'; bar.style.background=allOk?'var(--green)':(ok.length?'var(--yellow)':'var(--red)'); }

  /* Detail gagal */
  var failWrap = document.getElementById('ie-result-fail-wrap');
  var failList = document.getElementById('ie-result-fail-list');
  if(fail.length && failWrap && failList){
    failWrap.style.display='block';
    failList.innerHTML = fail.map(function(f){
      var key = f.row[conflictKey]||'—';
      var errShort = (f.err||'').length > 120 ? (f.err||'').slice(0,120)+'…' : (f.err||'—');
      return '<div style="padding:8px 11px;border-bottom:1px solid rgba(220,38,38,.12);font-size:11px;display:flex;gap:8px;align-items:flex-start">'+
        '<span style="flex-shrink:0;font-weight:700;color:var(--red);min-width:90px">'+_esc(key)+'</span>'+
        '<span style="color:var(--text2);line-height:1.5">'+_esc(errShort)+'</span></div>';
    }).join('');
  } else if(failWrap){ failWrap.style.display='none'; }

  /* Detail berhasil (collapsible) */
  var okWrap  = document.getElementById('ie-result-ok-wrap');
  var okList  = document.getElementById('ie-result-ok-list');
  var okLabel = document.getElementById('ie-result-ok-label');
  if(ok.length && okWrap && okList){
    okWrap.style.display='block';
    if(okLabel) okLabel.textContent = 'Lihat '+ok.length+' Data Berhasil';
    okList.innerHTML = ok.map(function(row){
      var key = row[conflictKey]||'—';
      var nama = row.nama||row.judul||row.cid||'';
      return '<div style="padding:7px 11px;border-bottom:1px solid rgba(5,150,105,.12);font-size:11px;display:flex;gap:8px">'+
        '<i class="ti ti-circle-check" style="color:var(--green);flex-shrink:0;margin-top:1px"></i>'+
        '<span style="font-weight:700;color:var(--text);min-width:90px;flex-shrink:0">'+_esc(key)+'</span>'+
        '<span style="color:var(--text3)">'+_esc(nama)+'</span></div>';
    }).join('');
  } else if(okWrap){ okWrap.style.display='none'; }

  wrap.style.display='block';
}

/* ── Show result (legacy, masih dipakai di tempat lain) ── */
function ieShowResult(ok, title, detail){
  ieShowDetailResult(1, ok?[{}]:[], ok?[]:[{row:{},err:detail}], 'kode');
}

/* ─── BUILD EXPORT LIST ─── */
function ieBuildExportList(){
  var el = document.getElementById('ie-export-list');
  if(!el) return;
  var modules = [
    {key:'areas',     label:'Area & Coverage',   icon:'ti-map-2',          color:'var(--c1)'},
    {key:'olts',      label:'Master OLT',         icon:'ti-antenna',        color:'var(--cyan)'},
    {key:'odcs',      label:'Master ODC',         icon:'ti-box',            color:'var(--pu)'},
    {key:'odps',      label:'Master ODP',         icon:'ti-plug',           color:'var(--c2)'},
    {key:'pelanggan', label:'Pelanggan',           icon:'ti-users',          color:'var(--green)'},
    {key:'material_items', label:'Master Material',   icon:'ti-package',        color:'var(--yellow)'},
    {key:'material_mutasi', label:'Mutasi Inventory',  icon:'ti-transfer',       color:'var(--c2)'},
    {key:'approval_isp',label:'Approval ISP',     icon:'ti-checks',         color:'var(--c1)'},
    {key:'tickets',   label:'Tiket',              icon:'ti-ticket',         color:'var(--yellow)'}
  ];
  el.innerHTML = modules.map(function(m){
    return '<div style="display:flex;align-items:center;gap:12px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:12px 13px;margin-bottom:8px">'+
      '<div style="width:36px;height:36px;border-radius:10px;background:rgba(0,0,0,.05);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
        '<i class="ti '+m.icon+'" style="font-size:18px;color:'+m.color+'"></i></div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:700;color:var(--text)">'+m.label+'</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:1px">Tabel: '+m.key+'</div>'+
      '</div>'+
      '<button onclick="ieDoExport(\''+m.key+'\',\''+m.label+'\')" '+
        'style="padding:8px 14px;border:none;background:var(--c1);color:#fff;border-radius:var(--rs);font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;touch-action:manipulation">'+
        '<i class="ti ti-download"></i> Export</button>'+
    '</div>';
  }).join('');
}

/* ── Do Export ── */
function ieDoExport(table, label){
  var sb = getSB();
  if(!sb){ toast('Database tidak terhubung','err'); return; }
  toast('Mengambil data '+label+'…','info');

  /* Header ramah untuk kolom FK */
  var _fkHeader = {
    area_id:'Area', area_coverage_id:'Coverage Area',
    olt_id:'OLT', odc_id:'ODC', odp_id:'ODP',
    ont_item_id:'ONT', kabel_item_id:'Kabel', material_item_id:'Material',
    kecamatan_id:'Kecamatan', kelurahan_id:'Kelurahan'
  };

  /* Fetch semua tabel referensi sekaligus (paralel), lalu buat lookup id→label */
  Promise.all([
    sb.from('areas').select('id,nama').then(function(r){ return r.data||[]; }).catch(function(){ return []; }),
    sb.from('olts').select('id,kode').then(function(r){ return r.data||[]; }).catch(function(){ return []; }),
    sb.from('odcs').select('id,kode').then(function(r){ return r.data||[]; }).catch(function(){ return []; }),
    sb.from('odps').select('id,kode,nama').then(function(r){ return r.data||[]; }).catch(function(){ return []; }),
    sb.from('material_items').select('id,nama').then(function(r){ return r.data||[]; }).catch(function(){ return []; }),
    sb.from('wilayah').select('id,kecamatan,kelurahan').then(function(r){ return r.data||[]; }).catch(function(){ return []; })
  ]).then(function(results){
    /* Bangun lookup: { uuid: 'nama yang mudah dibaca' } per kolom FK */
    var _lookup = {};
    function _addLookup(list, field){
      (list||[]).forEach(function(x){ if(x.id) _lookup[x.id] = x[field]||x.nama||x.kode||'—'; }); /* tidak pakai UUID sebagai label */
    }
    _addLookup(results[0], 'nama');   /* areas */
    _addLookup(results[1], 'kode');   /* olts */
    _addLookup(results[2], 'kode');   /* odcs */
    /* odps: pakai kode, fallback nama */
    (results[3]||[]).forEach(function(x){ if(x.id) _lookup[x.id] = x.kode||x.nama||'—'; }); /* tidak pakai UUID sebagai label */
    _addLookup(results[4], 'nama');   /* material_items */
    /* wilayah: kecamatan_id → kecamatan, kelurahan_id → kelurahan */
    (results[5]||[]).forEach(function(x){
      if(x.id) _lookup[x.id+'__kecamatan'] = x.kecamatan||x.id;
      if(x.id) _lookup[x.id+'__kelurahan'] = x.kelurahan||x.id;
    });

    function _resolve(col, uuid){
      if(!uuid) return '';
      if(col==='kecamatan_id') return _lookup[uuid+'__kecamatan']||uuid;
      if(col==='kelurahan_id') return _lookup[uuid+'__kelurahan']||uuid;
      return _lookup[uuid]||uuid;
    }

    function _isUUID(v){
      return typeof v==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    }

    /* Fetch data utama */
    var orderCol = (table==='material_items') ? 'kode' : 'created_at';
    sb.from(table).select('*').order(orderCol, {ascending: table==='material_items'})
      .then(function(r){
        if(r.error){ toast('Gagal export: '+(r.error.message||'coba lagi'),'err'); return; }
        var data = r.data||[];
        if(!data.length){ toast('Tidak ada data untuk diekspor','err'); return; }

        /* ── Pelanggan: export dalam format re-importable (sesuai schema import) ── */
        if(table === 'pelanggan'){
          /* Kolom yang diekspor: sesuai schema import + extra info */
          var pelCols = [
            'cid','nama','hp','nik','alamat','kecamatan','kelurahan','rw','rt',
            'paket','jenis_pelanggan','tgl_pasang','status','tipe_recurring',
            'area_kode','odp_kode','nomor_port',
            'sn_ont','mac_ont','ont_model',
            'teknisi_pasang','lat','lng','keterangan'
          ];
          /* Build lookup: area_id→kode, odp_id→kode */
          var areaById = {}; (results[0]||[]).forEach(function(a){ areaById[a.id]=a.kode||a.nama||''; });
          var odpById  = {}; (results[3]||[]).forEach(function(o){ odpById[o.id]=o.kode||o.nama||''; });

          var headerRow = ['"No"'].concat(pelCols.map(function(c){ return '"'+c+'"'; })).join(',');
          var csv = headerRow + '\n';
          data.forEach(function(row, idx){
            var line = ['"'+(idx+1)+'"'].concat(pelCols.map(function(c){
              var v;
              if(c === 'area_kode') v = areaById[row.area_id] || row.area_coverage || '';
              else if(c === 'odp_kode') v = odpById[row.odp_id] || '';
              else v = row[c];
              if(v===null||v===undefined) v = '';
              v = String(v).replace(/"/g,'""');
              return '"'+v+'"';
            })).join(',');
            csv += line + '\n';
          });
          _ieDownloadBlob(csv, 'pelanggan_export_'+new Date().toISOString().slice(0,10)+'.csv', 'text/csv');
          toast('Pelanggan · '+data.length+' baris diekspor (format re-importable)','ok');
          _ieAddLog('Export', label, data.length+' baris');
          return;
        }

        /* ── Modul lain: export standar (semua kolom) ── */
        var allCols = Object.keys(data[0]);
        var cols = allCols.filter(function(c){ return c !== 'id'; });

        var headerRow = ['"No"'].concat(cols.map(function(c){
          return '"'+(_fkHeader[c]||c)+'"';
        })).join(',');

        var csv = headerRow + '\n';
        data.forEach(function(row, idx){
          var line = ['"'+(idx+1)+'"'].concat(cols.map(function(c){
            var v = row[c];
            if(v===null||v===undefined) return '""';
            if(_fkHeader[c] && _isUUID(String(v))){ v = _resolve(c, v); }
            v = String(v).replace(/"/g,'""');
            return '"'+v+'"';
          })).join(',');
          csv += line + '\n';
        });

        _ieDownloadBlob(csv, table+'_export_'+new Date().toISOString().slice(0,10)+'.csv', 'text/csv');
        toast(label+' · '+data.length+' baris diekspor','ok');
        _ieAddLog('Export', label, data.length+' baris');
      })
      .catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });

  }).catch(function(e){ toast('Gagal muat referensi: '+(e.message||'coba lagi'),'err'); });
}

/* ── Download blob helper ── */
function _ieDownloadBlob(content, filename, type){
  var blob = new Blob(['\uFEFF'+content], {type:type+';charset=utf-8;'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
}

/* ── Log helper ── */
function _ieAddLog(action, label, detail){
  _ieLog.unshift({action:action, label:label, detail:detail, time:new Date()});
  var el = document.getElementById('ie-log-list');
  if(!el) return;
  if(!_ieLog.length){ el.innerHTML='<div style="text-align:center;padding:30px 0;color:var(--text3);font-size:12px"><i class="ti ti-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4"></i>Belum ada riwayat</div>'; return; }
  el.innerHTML = _ieLog.map(function(l){
    var color = l.action==='Import' ? 'var(--c1)' : 'var(--green)';
    var ico   = l.action==='Import' ? 'ti-file-import' : 'ti-file-export';
    var t = l.time;
    var ts = (t.getDate()<10?'0':'')+t.getDate()+'/'+(t.getMonth()<9?'0':'')+(t.getMonth()+1)+'/'+t.getFullYear()+' '+(t.getHours()<10?'0':'')+t.getHours()+':'+(t.getMinutes()<10?'0':'')+t.getMinutes();
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">'+
      '<div style="width:32px;height:32px;border-radius:9px;background:rgba(0,0,0,.05);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
        '<i class="ti '+ico+'" style="font-size:15px;color:'+color+'"></i></div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:12px;font-weight:700;color:var(--text)">'+l.action+' · '+_esc(l.label)+'</div>'+
        '<div style="font-size:10px;color:var(--text3)">'+_esc(l.detail)+' · '+ts+'</div>'+
      '</div></div>';
  }).join('');
}

/* ── Auto-load hook ── */
/* OPT: dispatch hook */
_navDispatch.register('importexport', function(){ if(typeof ieBuildExportList==='function') ieBuildExportList(); });
var _fdbLoaded = false;

/* ── Auto-load hook: buka saat nav ke fin-dashboard ── */
/* OPT: _fdbNavHook — navFin wrapper ganti dengan navDispatch fin-dashboard */
_navDispatch.register('fin-dashboard', function(){
  setTimeout(function(){ if(typeof fdbInitFilters==='function') fdbInitFilters(); if(typeof fdbLoad==='function') fdbLoad(); }, 60);
});

/* ── Periode helper: kembalikan {from, to} ISO date string ── */
function _fdbPeriode(){
  var v = (document.getElementById('fdb-periode')||{}).value || 'bulan';
  var now  = new Date();
  var y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  var pad = function(n){ return n<10?'0'+n:n; };
  var iso  = function(dt){ return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate()); };

  /* FIX: Semua Waktu - tidak ada batasan tanggal */
  if(v === 'semua'){
    return {from: '2000-01-01', to: '2099-12-31', isAll: true};
  }
  if(v === 'hari'){
    var today = iso(now);
    return {from: today, to: today};
  }
  if(v === 'minggu'){
    var dow = now.getDay();
    var mon = new Date(now); mon.setDate(d - (dow===0?6:dow-1));
    var sun = new Date(mon); sun.setDate(mon.getDate()+6);
    return {from: iso(mon), to: iso(sun)};
  }
  if(v === 'bulan'){
    return {from: y+'-'+pad(m+1)+'-01', to: y+'-'+pad(m+1)+'-'+pad(new Date(y,m+1,0).getDate())};
  }
  if(v === 'tahun'){
    return {from: y+'-01-01', to: y+'-12-31'};
  }
  if(v === 'custom'){
    var f = (document.getElementById('fdb-date-from')||{}).value || iso(now);
    var t = (document.getElementById('fdb-date-to')||{}).value   || iso(now);
    return {from: f, to: t};
  }
  return {from: y+'-'+pad(m+1)+'-01', to: y+'-'+pad(m+1)+'-'+pad(new Date(y,m+1,0).getDate())};
}
var _paketMasterData = [];
var _PAKET_DEFAULT = ['10 Mbps','20 Mbps','30 Mbps','50 Mbps','100 Mbps','200 Mbps','Dedicated 10M'];

function paketMasterLoad(){
  var sb=getSB(); if(!sb) return;
  sb.from('paket_master').select('*').order('nama').then(function(r){
    _paketMasterData = (!r.error && r.data) ? r.data : [];
    _paketFillSelect();
    paketMasterRenderList();
  }).catch(function(){ _paketMasterData=[]; _paketFillSelect(); });
}

function _paketFillSelect(){
  var sel=document.getElementById('pelf-paket'); if(!sel) return;
  var cur=sel.value;
  var names = _paketMasterData.length ? _paketMasterData.map(function(p){return p.nama;}) : _PAKET_DEFAULT;
  sel.innerHTML='<option value="">— Pilih Paket —</option>'+names.map(function(n){
    var p=_paketMasterData.find(function(x){return x.nama===n;});
    var lbl = p&&p.harga_otf ? n+' (OTF Rp '+_fmt(p.harga_otf)+')' : n;
    return '<option value="'+_esc(n)+'">'+_esc(lbl)+'</option>';
  }).join('');
  if(cur) sel.value=cur;
}

function _paketGetHargaOtf(namaPaket){
  var p=_paketMasterData.find(function(x){return x.nama===namaPaket;});
  return p ? (p.harga_otf||0) : 0;
}
function _paketGetHargaRecurring(namaPaket){
  var p=_paketMasterData.find(function(x){return x.nama===namaPaket;});
  return p ? (p.harga_recurring||0) : 0;
}

/* ── Modal sederhana Master Paket (CRUD ringan) ── */
function paketMasterOpen(){
  var ov=document.getElementById('paket-master-overlay');
  if(ov){ ov.classList.add('on'); paketMasterRenderList(); }
}
function paketMasterClose(){
  var ov=document.getElementById('paket-master-overlay');
  if(ov) ov.classList.remove('on');
}
function paketMasterRenderList(){
  var box=document.getElementById('paket-master-list'); if(!box) return;
  if(!_paketMasterData.length){
    box.innerHTML='<div style="text-align:center;color:var(--text3);padding:14px;font-size:11px">Belum ada paket. Tambahkan paket beserta harga OTF &amp; Recurring.</div>';
    return;
  }
  box.innerHTML=_paketMasterData.map(function(p){
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:6px">'+
      '<div><div style="font-size:12px;font-weight:800;color:var(--text)">'+_esc(p.nama)+'</div>'+
        '<div style="font-size:10px;color:var(--text3)">OTF Rp '+_fmt(p.harga_otf||0)+' · Recurring Rp '+_fmt(p.harga_recurring||0)+'/bln</div></div>'+
      '<div style="display:flex;gap:6px">'+
        '<button class="btn btn-ghost" style="padding:6px 9px" onclick="paketMasterEdit(\''+p.id+'\')"><i class="ti ti-pencil"></i></button>'+
        '<button class="btn btn-ghost" style="padding:6px 9px;color:var(--red)" onclick="paketMasterDelete(\''+p.id+'\')"><i class="ti ti-trash"></i></button>'+
      '</div>'+
    '</div>';
  }).join('');
}
function paketMasterEdit(id){
  var p=_paketMasterData.find(function(x){return x.id===id;}); if(!p) return;
  document.getElementById('pmf-id').value=p.id;
  var sel=document.getElementById('pmf-nama'), custom=document.getElementById('pmf-nama-custom');
  var hasOpt=Array.prototype.some.call(sel.options,function(o){return o.value===p.nama;});
  if(hasOpt){ sel.value=p.nama; sel.style.display=''; custom.style.display='none'; custom.value=''; }
  else { sel.value='__custom__'; sel.style.display='none'; custom.style.display='block'; custom.value=p.nama||''; }
  document.getElementById('pmf-otf').value=p.harga_otf||0;
  document.getElementById('pmf-rec').value=p.harga_recurring||0;
}
function paketMasterDelete(id){
  var sb=getSB(); if(!sb) return;
  if(!confirm('Hapus paket ini?')) return;
  sb.from('paket_master').delete().eq('id',id).then(function(r){
    if(r.error){ toast('Gagal: '+(r.error.message||''),'err'); return; }
    toast('Paket dihapus','ok'); paketMasterLoad();
  }).catch(function(){ toast('Error','err'); });
}
function paketMasterSave(){
  var id=document.getElementById('pmf-id').value;
  var selEl=document.getElementById('pmf-nama'), customEl=document.getElementById('pmf-nama-custom');
  var nama=(selEl.value==='__custom__' ? customEl.value : selEl.value).trim();
  var otf=parseFloat(document.getElementById('pmf-otf').value)||0;
  var rec=parseFloat(document.getElementById('pmf-rec').value)||0;
  if(!nama){ toast('Nama paket wajib diisi','err'); return; }
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var payload={nama:nama,harga_otf:otf,harga_recurring:rec};
  var p=id ? sb.from('paket_master').update(payload).eq('id',id) : sb.from('paket_master').insert([payload]);
  p.then(function(r){
    if(r.error){ toast('Gagal: '+(r.error.message||''),'err'); return; }
    toast(id?'Paket diperbarui':'Paket ditambahkan','ok');
    document.getElementById('pmf-id').value='';
    selEl.value=''; selEl.style.display=''; customEl.style.display='none'; customEl.value='';
    document.getElementById('pmf-otf').value='';
    document.getElementById('pmf-rec').value='';
    paketMasterLoad();
  }).catch(function(){ toast('Error','err'); });
}

/* OPT: paketMasterLoad dipindah ke lazy (via navDispatch finance)
   agar tidak membuang query saat startup sebelum login */
document.addEventListener('DOMContentLoaded', function(){
  /* Hanya setup listener UI, tidak load DB */
  var sel = document.getElementById('fdb-periode');
  if(sel) sel.addEventListener('change', function(){
    var wrap = document.getElementById('fdb-custom-wrap');
    if(wrap) wrap.style.display = (this.value==='custom') ? 'grid' : 'none';
  });
});
/* Paket master dimuat saat modul finance dibuka */
_navDispatch.register('finance', function(){
  if(typeof paketMasterLoad==='function' && !window._paketMasterLoaded){
    window._paketMasterLoaded = true;
    paketMasterLoad();
  }
});

/* ── Format Rupiah ── */
/* _fdbRp: merged into _fmtRp (SSOT - no duplicate) */
var _fdbRp = _fmtRp;

/* ── Set element text ── */
function _fdbSet(id, val){
  var e=document.getElementById(id);
  if(!e) return;
  if(typeof val === 'string' && val.indexOf('\n')>=0){
    var parts=val.split('\n');
    e.innerHTML = _esc(parts[0])+'<div style="font-size:9px;font-weight:500;opacity:.75;margin-top:2px;line-height:1.3;white-space:normal">'+_esc(parts.slice(1).join(' '))+'</div>';
  } else {
    e.textContent=val;
  }
}

/* ── Tabel row ── */
function _fdbTr(cells){
  return '<tr>'+cells.map(function(c,i){ return '<td'+(i>0?' style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700"':'')+'>'+c+'</td>'; }).join('')+'</tr>';
}
function _fdbEmpty(cols, msg){
  return '<tr><td colspan="'+cols+'" style="text-align:center;color:var(--text3);padding:14px;font-size:11px">'+msg+'</td></tr>';
}

/* ── Chart batang horizontal untuk Laporan Finance (Top-N berdasarkan Total Pendapatan) ── */
function _fdbRenderBarChart(containerId, entries, opts){
  var el = document.getElementById(containerId); if(!el) return;
  opts = opts || {};
  var labelFn = opts.label || function(d){ return d.name||'—'; };
  var topN = opts.topN || 8;

  var rows = entries.map(function(d){
    return { label: labelFn(d), total: (d.otf||0)+(d.rec||0), paid: (d.otfPaid||0)+(d.recPaid||0), os: (d.otfOs||0)+(d.recOs||0), pel: d.pel||0 };
  }).sort(function(a,b){ return b.total-a.total; }).slice(0, topN);

  if(!rows.length){ el.innerHTML='<div style="text-align:center;color:var(--text3);padding:14px;font-size:11px">Tidak ada data untuk chart</div>'; return; }

  var max = Math.max.apply(null, rows.map(function(r){ return r.total; })) || 1;

  el.innerHTML = rows.map(function(r){
    var pctPaid = r.total>0 ? Math.min(100, r.paid/r.total*100) : 0;
    var pctOs   = r.total>0 ? Math.min(100, 100-pctPaid) : 0;
    var widthPct = Math.max(2, r.total/max*100);
    return '<div style="margin-bottom:8px">'+
      '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;color:var(--text2);margin-bottom:3px">'+
        '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62%">'+_esc(r.label)+'</span>'+
        '<span style="font-family:JetBrains Mono,monospace">'+_fdbRp(r.total)+'</span>'+
      '</div>'+
      '<div style="height:8px;border-radius:5px;background:var(--bg3);overflow:hidden;width:'+widthPct.toFixed(1)+'%;min-width:30px">'+
        '<div style="display:flex;height:100%;width:100%">'+
          '<div style="background:var(--green);width:'+pctPaid.toFixed(1)+'%"></div>'+
          '<div style="background:var(--red);width:'+pctOs.toFixed(1)+'%"></div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('') +
  '<div style="display:flex;gap:14px;margin-top:6px;font-size:9px;color:var(--text3)">'+
    '<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--green);margin-right:4px;vertical-align:middle"></span>Paid</span>'+
    '<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--red);margin-right:4px;vertical-align:middle"></span>Outstanding</span>'+
    '<span style="margin-left:auto">Top '+rows.length+' · total = OTF + Recurring</span>'+
  '</div>';
}

/* ── _fdbWilayahData: cache data wilayah dari pelanggan ── */
/* Struktur per pelanggan: area_coverage, kecamatan, kelurahan, rw, rt */
var _fdbWilayahCache = null; /* null = belum diload */

/* ── Init filters: Area Coverage dropdown dari data pelanggan ── */
function fdbInitFilters(){
  var sb = getSB(); if(!sb) return;
  if(_fdbWilayahCache) { _fdbFillAreaCoverageFilter(); return; }
  /* GOVERNANCE: Sertakan jenis_pelanggan, filter keluar FASUM/ODP_TEMPEL/ODC_TEMPEL */
  /* FIX: Tambah filter status='aktif' agar hanya pelanggan aktif yang masuk Finance */
  sb.from('pelanggan').select('id,area_id,area_coverage,kecamatan,kelurahan,rw,rt,status,jenis_pelanggan').eq('status','aktif').order('area_coverage')
    .then(function(r){
      if(!r.error){
        var FREE_TYPES=JENIS_GRATIS; /* SSOT v23 */
        /* FIX: resolve area_coverage dari area_id jika field area_coverage kosong */
        var _rawData = (r.data||[]).filter(function(p){ return FREE_TYPES.indexOf(p.jenis_pelanggan)===(-1); });
        var _arLk = (typeof _areaData!=='undefined'&&_areaData.length?_areaData:(window.SOT?SOT.cache().areas||[]:[]));
        _rawData.forEach(function(p){
          if(!p.area_coverage && p.area_id && _arLk.length){
            var aObj = _arLk.find(function(a){ return a.id === p.area_id; });
            if(aObj) p.area_coverage = aObj.nama || aObj.kode || '';
          }
        });
        _fdbWilayahCache = _rawData;
      }
      _fdbFillAreaCoverageFilter();
    }).catch(function(){});
}

function _fdbFillAreaCoverageFilter(){
  var sel = document.getElementById('fdb-area-coverage'); if(!sel) return;
  var cur = sel.value;
  var areas = [];
  (_fdbWilayahCache||[]).forEach(function(p){ if(p.area_coverage && areas.indexOf(p.area_coverage)<0) areas.push(p.area_coverage); });
  areas.sort();
  sel.innerHTML = '<option value="">Semua Area Coverage</option>';
  areas.forEach(function(a){ var o=document.createElement('option'); o.value=a; o.textContent=a; if(a===cur)o.selected=true; sel.appendChild(o); });
}

function fdbOnAreaChange(){
  /* Reset kecamatan/kelurahan/rw/rt filters */
  var acv = (document.getElementById('fdb-area-coverage')||{}).value||'';
  _fdbFillSel('fdb-kecamatan', 'Semua Kecamatan',
    (_fdbWilayahCache||[]).filter(function(p){ return !acv||p.area_coverage===acv; }).map(function(p){return p.kecamatan||'';}).filter(Boolean));
  _fdbResetSel('fdb-kelurahan','Semua Kelurahan');
  _fdbResetSel('fdb-rw','Semua RW');
  _fdbResetSel('fdb-rt','Semua RT');
  fdbLoad();
}
function fdbOnKecamatanChange(){
  var acv  = (document.getElementById('fdb-area-coverage')||{}).value||'';
  var kec  = (document.getElementById('fdb-kecamatan')||{}).value||'';
  var src  = (_fdbWilayahCache||[]).filter(function(p){ return (!acv||p.area_coverage===acv)&&(!kec||p.kecamatan===kec); });
  _fdbFillSel('fdb-kelurahan', 'Semua Kelurahan', src.map(function(p){return p.kelurahan||'';}));
  _fdbResetSel('fdb-rw','Semua RW');
  _fdbResetSel('fdb-rt','Semua RT');
  fdbLoad();
}
function fdbOnKelurahanChange(){
  var acv  = (document.getElementById('fdb-area-coverage')||{}).value||'';
  var kec  = (document.getElementById('fdb-kecamatan')||{}).value||'';
  var kel  = (document.getElementById('fdb-kelurahan')||{}).value||'';
  var src  = (_fdbWilayahCache||[]).filter(function(p){ return (!acv||p.area_coverage===acv)&&(!kec||p.kecamatan===kec)&&(!kel||p.kelurahan===kel); });
  _fdbFillSel('fdb-rw', 'Semua RW', src.map(function(p){return p.rw||'';}));
  _fdbResetSel('fdb-rt','Semua RT');
  fdbLoad();
}
function fdbOnRwChange(){
  var acv  = (document.getElementById('fdb-area-coverage')||{}).value||'';
  var kec  = (document.getElementById('fdb-kecamatan')||{}).value||'';
  var kel  = (document.getElementById('fdb-kelurahan')||{}).value||'';
  var rw   = (document.getElementById('fdb-rw')||{}).value||'';
  var src  = (_fdbWilayahCache||[]).filter(function(p){ return (!acv||p.area_coverage===acv)&&(!kec||p.kecamatan===kec)&&(!kel||p.kelurahan===kel)&&(!rw||p.rw===rw); });
  _fdbFillSel('fdb-rt', 'Semua RT', src.map(function(p){return p.rt||'';}));
  fdbLoad();
}
function _fdbFillSel(id, placeholder, vals){
  var sel=document.getElementById(id); if(!sel) return;
  var uniq=[]; vals.forEach(function(v){ if(v&&uniq.indexOf(v)<0) uniq.push(v); }); uniq.sort();
  sel.innerHTML='<option value="">'+placeholder+'</option>';
  uniq.forEach(function(v){ var o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o); });
}
function _fdbResetSel(id, placeholder){
  var sel=document.getElementById(id); if(!sel) return;
  sel.innerHTML='<option value="">'+placeholder+'</option>';
}

/* ── Get current wilayah filter values ── */
function _fdbGetFilter(){
  return {
    acv : (document.getElementById('fdb-area-coverage')||{}).value||'',
    kec : (document.getElementById('fdb-kecamatan')||{}).value||'',
    kel : (document.getElementById('fdb-kelurahan')||{}).value||'',
    rw  : (document.getElementById('fdb-rw')||{}).value||'',
    rt  : (document.getElementById('fdb-rt')||{}).value||''
  };
}

/* ══ MAIN LOAD ══ */
function fdbLoad(){
  var sb = getSB();
  if(!sb){ toast('Database tidak terhubung','err'); return; }

  var loading = document.getElementById('fdb-loading');
  if(loading) loading.style.display='block';

  var per = _fdbPeriode();
  var fil = _fdbGetFilter();

  /* Pastikan wilayah cache ada */
  /* GOVERNANCE: Include jenis_pelanggan — hanya pelanggan BERBAYAR masuk Finance */
  /* FIX: Tambah filter status='aktif' agar count pelanggan konsisten dengan menu lain */
  var pWil = _fdbWilayahCache ? Promise.resolve()
    : sb.from('pelanggan').select('id,area_id,area_coverage,kecamatan,kelurahan,rw,rt,status,jenis_pelanggan').eq('status','aktif').then(function(r){
        if(!r.error){
          var FREE_TYPES=JENIS_GRATIS; /* SSOT v23 */
          /* FIX: resolve area_coverage dari area_id jika kosong */
          var _raw2 = (r.data||[]).filter(function(p){ return FREE_TYPES.indexOf(p.jenis_pelanggan)===(-1); });
          var _arLookup = (typeof _areaData!=='undefined'&&_areaData.length?_areaData:(window.SOT?SOT.cache().areas||[]:[]));
          _raw2.forEach(function(p){
            if(!p.area_coverage && p.area_id && _arLookup.length){
              var aObj = _arLookup.find(function(a){ return a.id === p.area_id; });
              if(aObj) p.area_coverage = aObj.nama || aObj.kode || '';
            }
          });
          _fdbWilayahCache = _raw2;
        }
      });

  pWil.then(function(){

    /* Map pel_id → wilayah info dari cache */
    var pelMap = {};
    (_fdbWilayahCache||[]).forEach(function(p){ pelMap[p.id]=p; });

    /* Scope: pelanggan BERBAYAR sesuai filter wilayah */
    var FREE_TYPES=JENIS_GRATIS; /* SSOT v23 */
    var pelInScope = (_fdbWilayahCache||[]).filter(function(p){
      return p.status==='aktif'                                   /* FIX: hanya pelanggan aktif */
          && FREE_TYPES.indexOf(p.jenis_pelanggan)===(-1)
          && (!fil.acv||p.area_coverage===fil.acv)
          && (!fil.kec||p.kecamatan===fil.kec)
          && (!fil.kel||p.kelurahan===fil.kel)
          && (!fil.rw ||p.rw===fil.rw)
          && (!fil.rt ||p.rt===fil.rt);
    });
    var scopeIds = {};
    pelInScope.forEach(function(p){ scopeIds[p.id]=true; });

    /* Query paralel — baca saja, tidak ada write */
    var qApv = sb.from('approval_isp').select('id,status,pel_id,created_at');
    /* FIX: tambah created_at sebagai fallback saat tgl belum diisi (status menunggu_validasi) */
    var qOtf = sb.from('fee_otf').select('id,status,nominal,pel_id,tgl,created_at');
    var qRec = sb.from('fee_recurring').select('id,status,nominal,total_recurring,pel_id,periode');

    Promise.all([qApv, qOtf, qRec])
      .then(function(res){
        if(loading) loading.style.display='none';

        var apvAll = (res[0].error?[]:res[0].data)||[];
        var otfAll = (res[1].error?[]:res[1].data)||[];
        var recAll = (res[2].error?[]:res[2].data)||[];

        /* Filter by periode */
        var inPer = function(dateStr){
          if(!dateStr) return false;
          var d=dateStr.slice(0,10);
          return d>=per.from && d<=per.to;
        };

        /* Filter by periode AND scope (wilayah) */
        /* FIX: OTF pakai tgl jika ada, fallback ke created_at (untuk status menunggu_validasi yang tgl-nya null) */
        var apv = apvAll.filter(function(r){ return inPer(r.created_at) && scopeIds[r.pel_id]; });
        var otf = otfAll.filter(function(r){ return inPer(r.tgl||r.created_at) && scopeIds[r.pel_id]; });
        var perFromYm = per.from.slice(0,7), perToYm = per.to.slice(0,7);
        var noWilFilter = !fil.acv && !fil.kec && !fil.kel && !fil.rw && !fil.rt;
        var rec = recAll.filter(function(r){
          var ym = (r.periode||'').slice(0,7);
          if(!ym || ym<perFromYm || ym>perToYm) return false;
          /* baris recurring agregat (hasil generate dari upload billing) tidak punya pel_id —
             hitung hanya saat tidak ada filter wilayah aktif (tampilan global) */
          if(!r.pel_id) return noWilFilter;
          return !!scopeIds[r.pel_id];
        });

        /* ── 7 Cards Governance ── */
        var totalApv   = apv.length;
        /* FIX: Hitung SEMUA OTF yang aktif (menunggu_validasi, siap_bayar, waiting_payment, paid)
           agar "Total yang Harus Dibayar" mencerminkan keseluruhan tagihan, bukan hanya yang sudah divalidasi */
        var totalOtf   = otf.filter(function(r){return r.status==='siap_bayar'||r.status==='waiting_payment'||r.status==='paid';}).reduce(function(s,r){return s+(parseFloat(r.nominal)||0);},0);
        var totalRec   = rec.reduce(function(s,r){return s+_fdbRecVal(r);},0);
        var otfPaid    = otf.filter(function(r){return r.status==='paid';});
        var recPaid    = rec.filter(function(r){return r.status==='paid';});
        /* otfOs: semua yang belum paid (menunggu_validasi + siap_bayar + waiting_payment) */
        var otfOs      = otf.filter(function(r){return r.status==='siap_bayar'||r.status==='waiting_payment';});
        var recOs      = rec.filter(function(r){return r.status!=='paid'&&r.status!=='canceled';});
        var sumOtfPaid = otfPaid.reduce(function(s,r){return s+(parseFloat(r.nominal)||0);},0);
        var sumRecPaid = recPaid.reduce(function(s,r){return s+_fdbRecVal(r);},0);
        var sumOtfOs   = otfOs.reduce(function(s,r){return s+(parseFloat(r.nominal)||0);},0);
        var sumRecOs   = recOs.reduce(function(s,r){return s+_fdbRecVal(r);},0);

        /* Pelanggan paid / outstanding (unik pel_id) */
        var pelPaidIds = {};
        otfPaid.forEach(function(r){if(r.pel_id) pelPaidIds[r.pel_id]=true;});
        recPaid.forEach(function(r){if(r.pel_id) pelPaidIds[r.pel_id]=true;});
        var pelOsIds = {};
        otfOs.forEach(function(r){if(r.pel_id) pelOsIds[r.pel_id]=true;});
        recOs.forEach(function(r){if(r.pel_id) pelOsIds[r.pel_id]=true;});

        function _fdbRpTb(n){ return _fdbRp(n)+(n>0?'\n('+_terbilang(n)+')':''); }
        _fdbSet('fdb-total-approval',      totalApv);
        _fdbSet('fdb-total-otf',           _fdbRpTb(totalOtf));
        _fdbSet('fdb-total-rec',           _fdbRpTb(totalRec));
        _fdbSet('fdb-total-otf-paid',      _fdbRpTb(sumOtfPaid));
        _fdbSet('fdb-total-rec-paid',      _fdbRpTb(sumRecPaid));
        _fdbSet('fdb-total-otf-outstanding',_fdbRpTb(sumOtfOs));
        _fdbSet('fdb-total-rec-outstanding',_fdbRpTb(sumRecOs));

        /* Outstanding / Paid summary cards */
        _fdbSet('fdb-os-otf', _fdbRpTb(sumOtfOs));
        _fdbSet('fdb-os-rec', _fdbRpTb(sumRecOs));
        _fdbSet('fdb-os-pel', Object.keys(pelOsIds).length + ' pelanggan · ' + _fdbRp(sumOtfOs+sumRecOs));
        _fdbSet('fdb-pd-otf', _fdbRpTb(sumOtfPaid));
        _fdbSet('fdb-pd-rec', _fdbRpTb(sumRecPaid));
        _fdbSet('fdb-pd-pel', Object.keys(pelPaidIds).length);

        /* ── Build wilayah aggregations ── */
        var aggData = _fdbAggregate(pelInScope, otf, rec, pelMap);

        /* ── Hero Card update (Simple Dashboard) ── */
        (function(){
          var totT=totalOtf+totalRec, totP=sumOtfPaid+sumRecPaid, totS=sumOtfOs+sumRecOs;
          var pct=totT>0?Math.round(totP/totT*100):0;
          var totPel=pelInScope.length;
          function ge(id){return document.getElementById(id);}
          var fmt = _fmtRpShort;
          if(ge('fdb-hero-total'))ge('fdb-hero-total').textContent=fmt(totT);
          if(ge('fdb-hero-pel-label'))ge('fdb-hero-pel-label').textContent='dari '+totPel+' pelanggan aktif';
          if(ge('fdb-hero-paid'))ge('fdb-hero-paid').textContent=fmt(totP);
          if(ge('fdb-hero-sisa'))ge('fdb-hero-sisa').textContent=fmt(totS);
          if(ge('fdb-hero-pct'))ge('fdb-hero-pct').textContent=pct>=100?'100% Lunas 🎉':pct+'% dibayar';
          if(ge('fdb-hero-bar'))ge('fdb-hero-bar').style.width=Math.min(pct,100)+'%';
          if(ge('fdb-otf-total'))ge('fdb-otf-total').textContent=fmt(totalOtf);
          if(ge('fdb-otf-paid-mini'))ge('fdb-otf-paid-mini').textContent='✓ '+fmt(sumOtfPaid);
          if(ge('fdb-otf-sisa-mini'))ge('fdb-otf-sisa-mini').textContent='Sisa '+fmt(sumOtfOs);
          if(ge('fdb-rec-total'))ge('fdb-rec-total').textContent=fmt(totalRec);
          if(ge('fdb-rec-paid-mini'))ge('fdb-rec-paid-mini').textContent='✓ '+fmt(sumRecPaid);
          if(ge('fdb-rec-sisa-mini'))ge('fdb-rec-sisa-mini').textContent='Sisa '+fmt(sumRecOs);
          /* Reset label filter */
          var fl=ge('fdp-filter-label');
          if(fl){var acv=(document.getElementById('fdb-area-coverage')||{}).value||'';fl.textContent=acv?'Filter: '+acv:'';}
        })();

        fdbBuildAreaCoverageTable(aggData.byArea);
        fdbBuildSimpleList(aggData.byArea);
        fdbBuildKecamatanTable(aggData.byKec);
        fdbBuildKelurahanTable(aggData.byKel);
        fdbBuildRwTable(aggData.byRw);
        fdbBuildRtTable(aggData.byRt);

        /* ── Top & Bottom Analytics ── */
        fdbBuildTopBottom(aggData);

        _fdbLoaded = true;
      })
      .catch(function(e){
        if(loading) loading.style.display='none';
        toast('Gagal memuat dashboard: '+(e.message||'coba lagi'),'err');
      });
  });
}

/* Helper: nilai nominal recurring (fallback ke total_recurring utk baris agregat) */
function _fdbRecVal(r){ return parseFloat(r.nominal!=null?r.nominal:r.total_recurring)||0; }

/* ── Aggregate all data by wilayah hierarchy ── */
function _fdbAggregate(pelInScope, otf, rec, pelMap){
  /* maps keyed by dimension */
  var byArea = {}, byKec = {}, byKel = {}, byRw = {}, byRt = {};

  function ensureKey(map, key, extra){
    if(!map[key]) map[key] = Object.assign({pel:0,otf:0,rec:0,otfPaid:0,recPaid:0,otfOs:0,recOs:0,pelOsIds:{},pelPaidIds:{}}, extra||{});
  }

  pelInScope.forEach(function(p){
    var ac=p.area_coverage||'—', kec=p.kecamatan||'—', kel=p.kelurahan||'—', rw=p.rw||'—', rt=p.rt||'—';
    ensureKey(byArea, ac,  {name:ac, area_id:p.area_id||null});
    ensureKey(byKec,  kec, {name:kec, area:ac});
    ensureKey(byKel,  kel, {name:kel, kec:kec});
    ensureKey(byRw,   ac+'|'+kel+'|'+rw, {kelurahan:kel, rw:rw, area_coverage:ac});
    ensureKey(byRt,   ac+'|'+kel+'|'+rw+'|'+rt, {kelurahan:kel, rw:rw, rt:rt, area_coverage:ac});
    byArea[ac].pel++;
    byKec[kec].pel++;
    byKel[kel].pel++;
    byRw[ac+'|'+kel+'|'+rw].pel++;
    byRt[ac+'|'+kel+'|'+rw+'|'+rt].pel++;
  });

  function addFee(r, isOtf, isPaid){
    var p = pelMap[r.pel_id]; if(!p) return;
    var ac=p.area_coverage||'—', kec=p.kecamatan||'—', kel=p.kelurahan||'—', rw=p.rw||'—', rt=p.rt||'—';
    var nom = isOtf ? (parseFloat(r.nominal)||0) : _fdbRecVal(r);
    var maps = [
      [byArea, ac],
      [byKec,  kec],
      [byKel,  kel],
      [byRw,   ac+'|'+kel+'|'+rw],
      [byRt,   ac+'|'+kel+'|'+rw+'|'+rt]
    ];
    maps.forEach(function(m){
      var mp=m[0], k=m[1];
      if(!mp[k]) return; /* only count pelanggan in scope */
      if(isOtf){ mp[k].otf+=nom; if(isPaid){ mp[k].otfPaid+=nom; if(r.pel_id) mp[k].pelPaidIds[r.pel_id]=true; } else { mp[k].otfOs+=nom; if(r.pel_id) mp[k].pelOsIds[r.pel_id]=true; } }
      else      { mp[k].rec+=nom; if(isPaid){ mp[k].recPaid+=nom; if(r.pel_id) mp[k].pelPaidIds[r.pel_id]=true; } else { mp[k].recOs+=nom; if(r.pel_id) mp[k].pelOsIds[r.pel_id]=true; } }
    });
  }

  /* Hanya OTF yang sudah divalidasi yang masuk ke aggregate — exclude menunggu_validasi/draft */
  otf.filter(function(r){ return r.status==='paid'||r.status==='siap_bayar'||r.status==='waiting_payment'; })
     .forEach(function(r){ addFee(r, true, r.status==='paid'); });
  rec.forEach(function(r){ addFee(r, false, r.status==='paid'); });

  return {byArea:byArea, byKec:byKec, byKel:byKel, byRw:byRw, byRt:byRt};
}

/* Helper: sort map entries by pelanggan desc */
function _fdbSortedEntries(map){
  return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return b.pel-a.pel; });
}

/* ── Toggle tampilan detail (Kecamatan/Kelurahan/RW/RT) ── */
function fdbToggleDetail(){
  var wrap=document.getElementById('fdb-detail-wrap');
  var btn=document.getElementById('fdb-detail-toggle');
  if(!wrap) return;
  var showing = wrap.style.display!=='none';
  wrap.style.display = showing?'none':'';
  if(btn) btn.innerHTML = showing
    ? '<i class="ti ti-chevron-down"></i> Lihat Detail Lengkap (Kecamatan / Kelurahan / RW / RT)'
    : '<i class="ti ti-chevron-up"></i> Sembunyikan Detail';
}

/* ── Ringkasan Sederhana per Area — untuk Finance ──
   Tiap area: Total OTF, Total Recurring, Sudah Dibayar, Sisa Outstanding.
   Klik card → set filter Area Coverage + buka detail RW. */
function fdbBuildSimpleList(byArea){
  var el=document.getElementById('fdb-simple-list'); if(!el) return;
  var entries=_fdbSortedEntries(byArea);
  if(!entries.length){
    el.innerHTML='<div style="text-align:center;padding:16px;color:var(--text3);font-size:12px">Tidak ada data pada periode ini</div>';
    return;
  }
  el.innerHTML = entries.map(function(d){
    var totalTagihan = d.otf + d.rec;
    var totalDibayar = d.otfPaid + d.recPaid;
    var sisa = d.otfOs + d.recOs;
    var pct = totalTagihan>0 ? Math.round(totalDibayar/totalTagihan*100) : 0;
    return '<div onclick="fdbSimpleDrill(\''+_escAttr(d.name||'')+'\')" style="background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--r);padding:12px;margin-bottom:8px;cursor:pointer;touch-action:manipulation">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
        '<div style="font-size:13px;font-weight:800;color:var(--text)"><i class="ti ti-map-pin" style="color:var(--c1);font-size:13px"></i> '+_esc(d.name||'—')+'</div>'+
        '<div style="font-size:10px;color:var(--text3)">'+d.pel+' pelanggan <i class="ti ti-chevron-right" style="font-size:11px"></i></div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'+
        '<div style="background:var(--c1b);border-radius:8px;padding:7px;text-align:center"><div style="font-size:12px;font-weight:800;color:var(--c1)">'+_fdbRp(d.otf)+'</div><div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase">Total OTF</div></div>'+
        '<div style="background:var(--yg);border-radius:8px;padding:7px;text-align:center"><div style="font-size:12px;font-weight:800;color:var(--yellow)">'+_fdbRp(d.rec)+'</div><div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase">Total Recurring</div></div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">'+
        '<div style="background:var(--gng2);border-radius:8px;padding:7px;text-align:center"><div style="font-size:12px;font-weight:800;color:var(--green)">'+_fdbRp(totalDibayar)+'</div><div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase">Sudah Dibayar</div></div>'+
        '<div style="background:var(--rg2);border-radius:8px;padding:7px;text-align:center"><div style="font-size:12px;font-weight:800;color:var(--red)">'+_fdbRp(sisa)+'</div><div style="font-size:9px;color:var(--text3);font-weight:700;text-transform:uppercase">Sisa Belum Dibayar</div></div>'+
      '</div>'+
      '<div style="background:var(--bg4);border-radius:99px;height:7px;overflow:hidden">'+
        '<div style="height:7px;border-radius:99px;background:var(--green);width:'+pct+'%;transition:width .4s"></div>'+
      '</div>'+
      '<div style="font-size:9px;color:var(--text3);margin-top:3px;text-align:right">'+pct+'% sudah dibayar</div>'+
    '</div>';
  }).join('');
}

/* Helper escape untuk dipakai di atribut onclick (single-quote string) */
function _escAttr(s){ return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

function fdbSimpleDrill(areaName){
  var sel=document.getElementById('fdb-area-coverage');
  if(sel){
    var found=false;
    Array.prototype.forEach.call(sel.options, function(o){ if(o.value===areaName){ o.selected=true; found=true; } });
    if(found) fdbOnAreaChange();
  }

  var wrap=document.getElementById('fdb-detail-wrap');
  if(wrap && wrap.style.display==='none') fdbToggleDetail();

  var selRw=document.getElementById('fdb-fil-area-rw');
  if(selRw){
    Array.prototype.forEach.call(selRw.options, function(o){ if(o.value===areaName) o.selected=true; });
    fdbOnAreaRwChange();
  }

  setTimeout(function(){
    var rwSection=document.getElementById('fdb-chart-rw');
    if(rwSection) rwSection.scrollIntoView({behavior:'smooth',block:'start'});
  }, 150);
}

function fdbBuildAreaCoverageTable(byArea){
  var entries0 = _fdbSortedEntries(byArea);
  _fdbRenderBarChart('fdb-chart-area-coverage', entries0, {label:function(d){return d.name;}});
  var tbody = document.getElementById('fdb-tbl-area-coverage'); if(!tbody) return;
  var entries = _fdbSortedEntries(byArea);
  if(!entries.length){ tbody.innerHTML=_fdbEmpty(6,'Tidak ada data pada periode ini'); return; }
  tbody.innerHTML = entries.map(function(d){
    return _fdbTr([_esc(d.name||'—'), d.pel, _fdbRp(d.otf), _fdbRp(d.rec), '<span style="color:var(--green)">'+_fdbRp(d.otfPaid+d.recPaid)+'</span>', '<span style="color:var(--red)">'+_fdbRp(d.otfOs+d.recOs)+'</span>']);
  }).join('');
}

function fdbBuildKecamatanTable(byKec){
  var entries0 = _fdbSortedEntries(byKec);
  _fdbRenderBarChart('fdb-chart-kecamatan', entries0, {label:function(d){return d.name;}});
  var tbody = document.getElementById('fdb-tbl-kecamatan'); if(!tbody) return;
  var entries = _fdbSortedEntries(byKec);
  if(!entries.length){ tbody.innerHTML=_fdbEmpty(6,'Tidak ada data'); return; }
  tbody.innerHTML = entries.map(function(d){
    return _fdbTr([_esc(d.name||'—'), d.pel, _fdbRp(d.otf), _fdbRp(d.rec), '<span style="color:var(--green)">'+_fdbRp(d.otfPaid+d.recPaid)+'</span>', '<span style="color:var(--red)">'+_fdbRp(d.otfOs+d.recOs)+'</span>']);
  }).join('');
}

function fdbBuildKelurahanTable(byKel){
  var entries0 = _fdbSortedEntries(byKel);
  _fdbRenderBarChart('fdb-chart-kelurahan', entries0, {label:function(d){return d.name;}});
  var tbody = document.getElementById('fdb-tbl-kelurahan'); if(!tbody) return;
  var entries = _fdbSortedEntries(byKel);
  if(!entries.length){ tbody.innerHTML=_fdbEmpty(6,'Tidak ada data'); return; }
  tbody.innerHTML = entries.map(function(d){
    return _fdbTr([_esc(d.name||'—'), d.pel, _fdbRp(d.otf), _fdbRp(d.rec), '<span style="color:var(--green)">'+_fdbRp(d.otfPaid+d.recPaid)+'</span>', '<span style="color:var(--red)">'+_fdbRp(d.otfOs+d.recOs)+'</span>']);
  }).join('');
}

var _fdbRwEntries = [];
function fdbBuildRwTable(byRw){
  _fdbRwEntries = Object.keys(byRw).map(function(k){ return byRw[k]; }).sort(function(a,b){ return b.pel-a.pel; });

  var selArea = document.getElementById('fdb-fil-area-rw');
  if(selArea){
    var areas=[]; _fdbRwEntries.forEach(function(d){ var ac=d.area_coverage||''; if(ac && areas.indexOf(ac)<0) areas.push(ac); });
    selArea.innerHTML='<option value="">— Semua Area —</option>';
    areas.sort().forEach(function(a){ var o=document.createElement('option'); o.value=a; o.textContent=a; selArea.appendChild(o); });
  }
  _fdbRenderBarChart('fdb-chart-rw', _fdbRwEntries, {label:function(d){return (d.kelurahan||'—')+' · RW '+(d.rw||'—');}});
  fdbFilterRwRt('rw');
}
function fdbOnAreaRwChange(){ fdbFilterRwRt('rw'); }

var _fdbRtEntries = [];
function fdbBuildRtTable(byRt){
  _fdbRtEntries = Object.keys(byRt).map(function(k){ return byRt[k]; }).sort(function(a,b){ return b.pel-a.pel; });

  var selArea = document.getElementById('fdb-fil-area-rt');
  if(selArea){
    var areas=[]; _fdbRtEntries.forEach(function(d){ var ac=d.area_coverage||''; if(ac && areas.indexOf(ac)<0) areas.push(ac); });
    selArea.innerHTML='<option value="">— Semua Area —</option>';
    areas.sort().forEach(function(a){ var o=document.createElement('option'); o.value=a; o.textContent=a; selArea.appendChild(o); });
  }
  _fdbRenderBarChart('fdb-chart-rt', _fdbRtEntries, {label:function(d){return (d.kelurahan||'—')+' · RW '+(d.rw||'—')+' RT '+(d.rt||'—');}});
  fdbFilterRwRt('rt');
}
function fdbOnAreaRtChange(){

  var fArea = (document.getElementById('fdb-fil-area-rt')||{}).value||'';
  var selRw = document.getElementById('fdb-fil-rw-rt');
  if(selRw){
    selRw.innerHTML='<option value="">— Semua RW —</option>';
    if(fArea){
      var rws=[];
      _fdbRtEntries.forEach(function(d){
        if((d.area_coverage||'')===fArea && d.rw && rws.indexOf(d.rw)<0) rws.push(d.rw);
      });
      rws.sort().forEach(function(r){ var o=document.createElement('option'); o.value=r; o.textContent='RW '+r; selRw.appendChild(o); });
      selRw.disabled = rws.length===0;
    } else {
      selRw.disabled = true;
    }
  }
  fdbFilterRwRt('rt');
}

function fdbResetRwFilter(){
  var sel=document.getElementById('fdb-fil-area-rw'); if(sel) sel.value='';
  var q=document.getElementById('fdb-search-rw'); if(q) q.value='';
  _fdbQuickFilter.rw='all';
  var grp=document.querySelector('.fdb-qf-grp[data-target="rw"]');
  if(grp){ var btns=grp.querySelectorAll('.fdb-qf'); btns.forEach(function(b){ b.classList.remove('on'); }); var firstBtn=grp.querySelector('.fdb-qf[data-val="all"]'); if(firstBtn) firstBtn.classList.add('on'); }
  fdbFilterRwRt('rw');
}

function fdbResetRtFilter(){
  var sel=document.getElementById('fdb-fil-area-rt'); if(sel) sel.value='';
  var selRw=document.getElementById('fdb-fil-rw-rt'); if(selRw){ selRw.innerHTML='<option value="">— Semua RW —</option>'; selRw.disabled=true; }
  var q=document.getElementById('fdb-search-rt'); if(q) q.value='';
  _fdbQuickFilter.rt='all';
  var grp=document.querySelector('.fdb-qf-grp[data-target="rt"]');
  if(grp){ var btns=grp.querySelectorAll('.fdb-qf'); btns.forEach(function(b){ b.classList.remove('on'); }); var firstBtn=grp.querySelector('.fdb-qf[data-val="all"]'); if(firstBtn) firstBtn.classList.add('on'); }
  fdbFilterRwRt('rt');
}

function fdbResetMainFilter(){
  var per=document.getElementById('fdb-periode'); if(per) per.value='bulan';
  var custom=document.getElementById('fdb-custom-wrap'); if(custom) custom.style.display='none';
  var ac=document.getElementById('fdb-area-coverage'); if(ac) ac.value='';
  _fdbResetSel('fdb-kecamatan','Semua Kecamatan');
  _fdbResetSel('fdb-kelurahan','Semua Kelurahan');
  _fdbResetSel('fdb-rw','Semua RW');
  _fdbResetSel('fdb-rt','Semua RT');
  fdbLoad();
}

var _fdbQuickFilter = { rw:'all', rt:'all' };
function fdbSetQuickFilter(type, val, btn){
  _fdbQuickFilter[type] = val;
  var grp = document.querySelector('.fdb-qf-grp[data-target="'+type+'"]');
  if(grp){ var btns=grp.querySelectorAll('.fdb-qf'); btns.forEach(function(b){ b.classList.remove('on'); }); }
  if(btn) btn.classList.add('on');
  fdbFilterRwRt(type);
}

function fdbFilterRwRt(type){
  var isRw = type==='rw';
  var entries = isRw ? _fdbRwEntries : _fdbRtEntries;
  var tbody = document.getElementById(isRw?'fdb-tbl-rw':'fdb-tbl-rt'); if(!tbody) return;
  var cols = isRw ? 7 : 8;

  var fArea = (document.getElementById(isRw?'fdb-fil-area-rw':'fdb-fil-area-rt')||{}).value||'';
  var fRw   = isRw ? '' : ((document.getElementById('fdb-fil-rw-rt')||{}).value||'');
  var qEl = document.getElementById(isRw?'fdb-search-rw':'fdb-search-rt');
  var q = (qEl&&qEl.value||'').toLowerCase().trim();
  var status = _fdbQuickFilter[type]||'all';


  if(!fArea){ tbody.innerHTML=_fdbEmpty(cols,'Pilih Area Coverage untuk menampilkan data'); return; }

  var filtered = entries.filter(function(d){
    if(fArea && (d.area_coverage||'')!==fArea) return false;
    if(fRw   && (d.rw||'')!==fRw) return false;
    if(q){
      var hay = ((d.kelurahan||'')+' '+(d.rw||'')+' '+(isRw?'':(d.rt||''))).toLowerCase();
      if(hay.indexOf(q)<0) return false;
    }
    var os = (d.otfOs||0)+(d.recOs||0);
    var paid = (d.otfPaid||0)+(d.recPaid||0);
    if(status==='os'   && os<=0) return false;
    if(status==='paid' && (paid<=0 || os>0)) return false;
    return true;
  });

  if(!filtered.length){ tbody.innerHTML=_fdbEmpty(cols,'Tidak ada data yang cocok'); return; }

  tbody.innerHTML = filtered.map(function(d){
    var cells = [_esc(d.kelurahan||'—'), _esc(d.rw||'—')];
    if(!isRw) cells.push(_esc(d.rt||'—'));
    cells.push(d.pel, _fdbRp(d.otf), _fdbRp(d.rec),
      '<span style="color:var(--green)">'+_fdbRp(d.otfPaid+d.recPaid)+'</span>',
      '<span style="color:var(--red)">'+_fdbRp(d.otfOs+d.recOs)+'</span>');
    return _fdbTr(cells);
  }).join('');
}

function fdbBuildTopBottom(aggData){
  function topEntry(map){ var e=_fdbSortedEntries(map); return e.length?e[0]:null; }
  function botEntry(map){ var e=_fdbSortedEntries(map); return e.length?e[e.length-1]:null; }
  function label(d){ return d?('<strong>'+_esc(d.name||d.kelurahan||d.rw||'—')+'</strong> · '+d.pel+' pelanggan'):'—'; }

  _fdbSet('fdb-top-area',      topEntry(aggData.byArea)?('<strong>'+_esc((topEntry(aggData.byArea)||{}).name||'—')+'</strong> · '+(topEntry(aggData.byArea)||{}).pel+' pelanggan'):'—');
  _fdbSet('fdb-top-kecamatan', topEntry(aggData.byKec )?('<strong>'+_esc((topEntry(aggData.byKec) ||{}).name||'—')+'</strong> · '+(topEntry(aggData.byKec) ||{}).pel+' pelanggan'):'—');
  _fdbSet('fdb-top-kelurahan', topEntry(aggData.byKel )?('<strong>'+_esc((topEntry(aggData.byKel) ||{}).name||'—')+'</strong> · '+(topEntry(aggData.byKel) ||{}).pel+' pelanggan'):'—');
  var topRwEntry = (function(){ var e=Object.keys(aggData.byRw).map(function(k){return aggData.byRw[k];}).sort(function(a,b){return b.pel-a.pel;}); return e.length?e[0]:null; })();
  _fdbSet('fdb-top-rw', topRwEntry?('Kel. <strong>'+_esc(topRwEntry.kelurahan||'—')+'</strong> RW <strong>'+_esc(topRwEntry.rw||'—')+'</strong> · '+topRwEntry.pel+' pelanggan'):'—');

  var topAreaEl=document.getElementById('fdb-top-area'); if(topAreaEl) topAreaEl.innerHTML=topAreaEl.textContent;

  function setHTML(id, html){ var el=document.getElementById(id); if(el) el.innerHTML=html; }
  var tA=topEntry(aggData.byArea), bA=botEntry(aggData.byArea);
  var tKec=topEntry(aggData.byKec), bKec=botEntry(aggData.byKec);
  var tKel=topEntry(aggData.byKel), bKel=botEntry(aggData.byKel);
  var rwArr=Object.keys(aggData.byRw).map(function(k){return aggData.byRw[k];}).sort(function(a,b){return b.pel-a.pel;});
  var tRw=rwArr.length?rwArr[0]:null, bRw=rwArr.length?rwArr[rwArr.length-1]:null;

  setHTML('fdb-top-area',      tA  ?('<strong>'+_esc(tA.name||'—')+'</strong> · '+tA.pel+' pelanggan'):'—');
  setHTML('fdb-top-kecamatan', tKec?('<strong>'+_esc(tKec.name||'—')+'</strong> · '+tKec.pel+' pelanggan'):'—');
  setHTML('fdb-top-kelurahan', tKel?('<strong>'+_esc(tKel.name||'—')+'</strong> · '+tKel.pel+' pelanggan'):'—');
  setHTML('fdb-top-rw',        tRw ?('Kel. <strong>'+_esc(tRw.kelurahan||'—')+'</strong> RW <strong>'+_esc(tRw.rw||'—')+'</strong> · '+tRw.pel+' pelanggan'):'—');
  setHTML('fdb-bot-area',      bA  ?('<strong>'+_esc(bA.name||'—')+'</strong> · '+bA.pel+' pelanggan'):'—');
  setHTML('fdb-bot-kecamatan', bKec?('<strong>'+_esc(bKec.name||'—')+'</strong> · '+bKec.pel+' pelanggan'):'—');
  setHTML('fdb-bot-kelurahan', bKel?('<strong>'+_esc(bKel.name||'—')+'</strong> · '+bKel.pel+' pelanggan'):'—');
  setHTML('fdb-bot-rw',        bRw ?('Kel. <strong>'+_esc(bRw.kelurahan||'—')+'</strong> RW <strong>'+_esc(bRw.rw||'—')+'</strong> · '+bRw.pel+' pelanggan'):'—');
}
var _urData       = [];
var _urFil        = [];
var _urPage       = 1;
var _urPerPg      = 15;
var _urLoaded     = false;
var _urTabCur     = 'users';
var _urDetId      = null;

var UR_ROLES = {
  super_admin:  { label: 'Super Admin',   short: 'SA', desc: 'Akses penuh ke seluruh sistem termasuk konfigurasi, user management, dan audit. Melihat SEMUA data.' },
  owner:        { label: 'Owner',         short: 'OW', desc: 'Akses baca semua modul plus laporan keuangan. Tidak bisa mengubah konfigurasi sistem. Melihat SEMUA data.' },
  finance:      { label: 'Finance',       short: 'FN', desc: 'Akses penuh Finance & Fee. Akses baca Pelanggan dan Approval ISP. Melihat SEMUA data & area.' },
  area_manager:{ label: 'Admin Wilayah', short: 'AW', desc: 'Akses CRUD Pelanggan dan Ticketing. [T20] Data difilter sesuai area/kecamatan/kelurahan yang ditetapkan.' },
  sales:        { label: 'Sales',         short: 'SL', desc: 'Tambah dan lihat Pelanggan, buat tiket. [T20] Hanya melihat data area yang ditugaskan. Tidak akses Finance.' },
  teknisi:      { label: 'Teknisi',       short: 'TK', desc: 'Akses Ticketing (update progress, selesaikan tiket). [T20] Hanya melihat data area yang ditugaskan.' },
  viewer:       { label: 'Viewer',        short: 'VW', desc: 'Akses baca saja. [T20] Data difilter sesuai area/kecamatan/kelurahan yang ditetapkan.' }
};

var UR_MATRIX = [
  { modul: 'Dashboard',          acc: ['F','R','R','R','R','R','R'] },
  { modul: 'Area & Coverage',    acc: ['F','R','-','R','-','R','-'] },
  { modul: 'Master OLT/ODC/ODP', acc: ['F','R','-','R','-','R','-'] },
  { modul: 'Port Management',    acc: ['F','R','-','R','-','R','-'] },
  { modul: 'Pelanggan',          acc: ['F','R','R','F','F','R','R'] },
  { modul: 'Approval ISP',       acc: ['F','R','R','F','-','-','R'] },
  { modul: 'Finance & Fee',      acc: ['F','R','F','-','-','-','R'] },
  { modul: 'Ticketing',          acc: ['F','R','-','F','F','F','R'] },
  { modul: 'Validasi Operasional',acc:['F','R','-','F','-','-','R'] },
  { modul: 'GIS & Peta',         acc: ['F','R','-','R','-','R','R'] },
  { modul: 'Import / Export',    acc: ['F','R','R','R','-','-','-'] },
  { modul: 'Audit Log',          acc: ['F','R','-','-','-','-','-'] },
  { modul: 'User & Role',        acc: ['F','-','-','-','-','-','-'] }
];

function urSwitchTab(tab, btn){
  _urTabCur = tab;
  document.querySelectorAll('.ur-tab').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('.ur-subpane').forEach(function(p){ p.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  var pane = document.getElementById('ur-pane-' + tab);
  if(pane) pane.classList.add('on');
  if(tab === 'users' && !_urLoaded) urLoad();
  if(tab === 'roles') urBuildMatrix();
  if(tab === 'sesi') urBuildSesi();
}

function urDiagArea(){
  var sb = getSB();
  var res = document.getElementById('ur-area-diag-result');
  if(res) res.innerHTML = '<i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memeriksa…';
  if(!sb){ if(res) res.textContent='Database tidak terhubung.'; return; }
  var AREA_ROLES = ['area_manager','sales','teknisi','viewer'];
  sb.from('app_users').select('id,nama,username,role,area_coverage_id,area_id,is_active')
    .in('role', AREA_ROLES)
    .then(function(r){
      if(r.error){ if(res) res.textContent='Error: '+(r.error.message||'coba lagi'); return; }
      var all = r.data||[];
      var noArea = all.filter(function(u){ return !u.area_coverage_id && !u.area_id; });
      var hasArea = all.filter(function(u){ return u.area_coverage_id || u.area_id; });
      var onlyAreaId = all.filter(function(u){ return !u.area_coverage_id && u.area_id; });
      var html = '<div style="font-size:11px;line-height:1.8">';
      html += '<b>Total teknisi/sales/admin:</b> '+all.length+'<br>';
      html += '<b style="color:var(--green)">✅ Area sudah diset:</b> '+hasArea.length+'<br>';
      html += '<b style="color:var(--red)">❌ Area kosong (NULL):</b> '+noArea.length+'<br>';
      if(onlyAreaId.length) html += '<b style="color:var(--yellow)">⚠ Punya area_id tapi bukan area_coverage_id:</b> '+onlyAreaId.length+' (SQL Fix otomatis memperbaiki ini)<br>';
      if(noArea.length){
        html += '<div style="margin-top:6px;padding:8px;background:var(--rg2);border-radius:8px">';
        html += '<b>User tanpa area:</b><br>';
        noArea.forEach(function(u){
          html += '• <b>'+_esc(u.username)+'</b> ('+_esc(u.role)+') — Edit user ini dan set area-nya<br>';
        });
        html += '</div>';
      }
      if(!noArea.length && !onlyAreaId.length) html += '<div style="margin-top:6px;color:var(--green);font-weight:700">✅ Semua user area sudah diset dengan benar!</div>';
      html += '</div>';
      if(res) res.innerHTML = html;
    }).catch(function(e){ if(res) res.textContent='Error: '+(e.message||'coba lagi'); });
}

function urCopyFixSQL(){
  var sql = [
    '-- FIX: Salin area_id ke area_coverage_id untuk user yang belum punya',
    'UPDATE app_users',
    '  SET area_coverage_id = area_id::uuid',
    '  WHERE area_coverage_id IS NULL',
    '    AND area_id IS NOT NULL',
    "    AND area_id != ''",
    "    AND area_id != 'all';",
    '',
    '-- Cek hasilnya:',
    "SELECT username, role, area_id, area_coverage_id FROM app_users WHERE role IN ('teknisi','sales','area_manager');"
  ].join('\n');
  if(navigator.clipboard){
    navigator.clipboard.writeText(sql).then(function(){ toast('SQL Fix disalin — paste di Supabase SQL Editor','ok'); });
  } else {
    prompt('Salin SQL ini:', sql);
  }
}

function urLoad(){
  var list = document.getElementById('ur-list');
  if(list) list.innerHTML = '<div class="olt-empty"><span class="skel" style="width:80%;height:14px;display:inline-block"></span></div>';
  var sb = getSB();
  if(!sb){ urLoadFallback(); return; }
  sb.from('app_users').select('*').order('username', {ascending:true})
    .then(function(r){
      if(r.error){ urLoadFallback(); return; }

      _urData = (r.data||[]).map(function(u){
        if(u.status===undefined || u.status===null){
          u.status = (u.is_active===false) ? 'nonaktif' : 'aktif';
        }
        if(!u.nama) u.nama = u.username;
        return u;
      });
      _urLoaded = true;
      urUpdateStats();
      urFillAreaDropdown();
      urRender();
    }).catch(function(){ urLoadFallback(); });
}

function urLoadFallback(){
  _urData = [
    { id:'usr-001', nama:'Super Administrator', username:'superadmin', role:'super_admin', status:'aktif', hp:'08100000001', area_id:null, keterangan:'Akun sistem utama', created_at: new Date().toISOString() },
    { id:'usr-002', nama:'Budi Pemilik',        username:'owner',      role:'owner',       status:'aktif', hp:'08100000002', area_id:null, keterangan:'',                   created_at: new Date().toISOString() },
    { id:'usr-003', nama:'Siti Keuangan',       username:'siti.fin',   role:'finance',     status:'aktif', hp:'08100000003', area_id:null, keterangan:'',                   created_at: new Date().toISOString() },
    { id:'usr-004', nama:'Andi Wilayah',        username:'andi.aw',    role:'area_manager',status:'aktif',hp:'08100000004', area_id:'all',keterangan:'Semua area',         created_at: new Date().toISOString() },
    { id:'usr-005', nama:'Reza Sales',          username:'reza.sl',    role:'sales',       status:'aktif', hp:'08100000005', area_id:null, keterangan:'',                   created_at: new Date().toISOString() },
    { id:'usr-006', nama:'Doni Teknisi',        username:'doni.tk',    role:'teknisi',     status:'aktif', hp:'08100000006', area_id:null, keterangan:'Teknisi lapangan',   created_at: new Date().toISOString() },
    { id:'usr-007', nama:'Viewer Tamu',         username:'viewer',     role:'viewer',      status:'nonaktif',hp:'',          area_id:null, keterangan:'',                   created_at: new Date().toISOString() }
  ];
  _urLoaded = true;
  urUpdateStats();
  urFillAreaDropdown();
  urRender();
}

function urUpdateStats(){
  var total    = _urData.length;
  var aktif    = _urData.filter(function(u){ return u.status==='aktif'; }).length;
  var nonaktif = _urData.filter(function(u){ return u.status==='nonaktif'; }).length;
  var admin    = _urData.filter(function(u){ return u.role==='super_admin'||u.role==='area_manager'; }).length;
  var e=function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  e('urst-total', total); e('urst-aktif', aktif); e('urst-nonaktif', nonaktif); e('urst-admin', admin);
}

function urFillAreaDropdown(){
  var sel = document.getElementById('urf-area');
  if(!sel) return;
  sel.innerHTML = '<option value="">— Pilih Area Coverage —</option>';
  if(typeof _areaData !== 'undefined' && _areaData.length){
    _areaData.filter(function(a){ return a.status==='aktif'; }).forEach(function(a){
      var opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.nama || a.kota || '—';
      sel.appendChild(opt);
    });
  }
}

function urSearch(q){
  _urPage = 1;
  var clr = document.getElementById('ur-search-clr');
  if(clr) clr.style.display = q ? 'block' : 'none';
  urRender();
}
function urClearSearch(){
  var inp = document.getElementById('ur-search');
  if(inp) inp.value = '';
  var clr = document.getElementById('ur-search-clr');
  if(clr) clr.style.display = 'none';
  _urPage = 1;
  urRender();
}

function urRender(){
  var q       = ((document.getElementById('ur-search')||{}).value||'').toLowerCase().trim();
  var fRole   = (document.getElementById('ur-fil-role')||{}).value||'';
  var fStatus = (document.getElementById('ur-fil-status')||{}).value||'';

  _urFil = _urData.filter(function(u){
    var matchQ = !q || (u.nama||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q) || (u.role||'').includes(q);
    var matchR = !fRole   || u.role   === fRole;
    var matchS = !fStatus || u.status === fStatus;
    return matchQ && matchR && matchS;
  });

  var total = _urFil.length;
  var pages = Math.max(1, Math.ceil(total / _urPerPg));
  if(_urPage > pages) _urPage = pages;
  var start = (_urPage - 1) * _urPerPg;
  var list  = document.getElementById('ur-list');
  if(!list) return;

  if(!total){
    list.innerHTML = '<div class="olt-empty"><i class="ti ti-user-off" style="font-size:32px;display:block;margin-bottom:8px;opacity:.4"></i><p>Tidak ada user ditemukan</p></div>';
    var pagi = document.getElementById('ur-pagi');
    if(pagi) pagi.style.display = 'none';
    return;
  }

  list.innerHTML = _urFil.slice(start, start + _urPerPg).map(_urRowHTML).join('');

  var pagi = document.getElementById('ur-pagi');
  if(pages > 1){
    pagi.style.display = 'flex';
    var prev = document.getElementById('ur-prev');
    var next = document.getElementById('ur-next');
    var info = document.getElementById('ur-pagi-info');
    if(prev) prev.disabled = _urPage <= 1;
    if(next) next.disabled = _urPage >= pages;
    if(info) info.textContent = _urPage + ' / ' + pages;
  } else {
    pagi.style.display = 'none';
  }
}

function _urRowHTML(u){
  var rConf   = UR_ROLES[u.role] || { label: u.role, short: '??' };
  var stTag   = u.status === 'aktif' ? 'tg' : 'tr';
  var stLbl   = u.status === 'aktif' ? 'Aktif' : 'Nonaktif';
  var initials = (u.nama||'??').split(' ').slice(0,2).map(function(w){ return w[0]||''; }).join('').toUpperCase();
  return '<div class="ur-row" onclick="urOpenDet(\''+u.id+'\')">'+
    '<button class="ur-row-btn" onclick="event.stopPropagation();urOpenDet(\''+u.id+'\')"><i class="ti ti-chevron-right"></i></button>'+
    '<div class="ur-row-top">'+
      '<div class="ur-av '+_esc(u.role)+'">'+initials+'</div>'+
      '<div class="ur-row-info">'+
        '<div class="ur-row-name">'+_esc(u.nama||'—')+'</div>'+
        '<div class="ur-row-username">@'+_esc(u.username||'—')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="ur-row-meta">'+
      '<span class="tag role-'+_esc(u.role)+'">'+_esc(rConf.label)+'</span>'+
      '<span class="tag '+stTag+'">'+stLbl+'</span>'+

      (function(){
        var needsArea = ['area_manager','sales','teknisi','viewer'].indexOf(u.role) >= 0;
        if(!needsArea) return '<span class="tag tg" style="font-size:9px">Akses Global</span>';
        var areaId = u.area_coverage_id || u.area_id;
        if(!areaId) return '<span class="tag tr" style="font-size:9px">⚠ Area Belum Set</span>';
        var parts = [];
        if(u.kelurahan_id) parts.push(u.kelurahan_id);
        else if(u.kecamatan_id) parts.push('Kec. '+u.kecamatan_id);
        else if(typeof _areaData!=='undefined'){
          var ar = _areaData.find(function(a){ return a.id===areaId; });
          parts.push(ar ? ar.nama : 'Area');
        }
        if(u.rw) parts.push('RW '+u.rw);
        return '<span class="tag tc2" style="font-size:9px"><i class="ti ti-map-pin" style="font-size:9px"></i> '+_esc(parts.join(' · ') || 'Area Terbatas')+'</span>';
      })()+
    '</div>'+
  '</div>';
}

function urPage(dir){
  var pages = Math.max(1, Math.ceil(_urFil.length / _urPerPg));
  _urPage = Math.min(pages, Math.max(1, _urPage + dir));
  urRender();
}

function urOpenForm(data){
  var isEdit = !!data;
  document.getElementById('ur-form-title').textContent = isEdit ? 'Edit User' : 'Tambah User';
  document.getElementById('urf-id').value       = isEdit ? (data.id||'')       : '';
  document.getElementById('urf-nama').value     = isEdit ? (data.nama||'')     : '';
  document.getElementById('urf-username').value = isEdit ? (data.username||'') : '';
  document.getElementById('urf-role').value     = isEdit ? (data.role||'')     : '';
  document.getElementById('urf-hp').value       = isEdit ? (data.hp||'')       : '';
  document.getElementById('urf-status').value   = isEdit ? (data.status||'aktif'):'aktif';
  document.getElementById('urf-ket').value      = isEdit ? (data.keterangan||''):'';
  document.getElementById('urf-pin').value      = '';

  var pinHint = document.getElementById('urf-pin-hint');
  var pinReq  = document.getElementById('urf-pin-req');
  if(isEdit){
    if(pinHint) pinHint.textContent = 'Kosongkan untuk tidak mengubah PIN';
    if(pinReq)  pinReq.style.display = 'none';
  } else {
    if(pinHint) pinHint.textContent = 'PIN 6 digit untuk login';
    if(pinReq)  pinReq.style.display = 'inline';
  }

  ['urf-nama','urf-username','urf-role','urf-pin'].forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.classList.remove('err');
  });

  urFormRoleChange();


  var sb = getSB();
  var _pendingAreaVal = isEdit ? (data.area_coverage_id || data.area_id || '') : '';
  var ensureAreas = (typeof _areaData !== 'undefined' && _areaData.length > 0) ? Promise.resolve()
    : (sb ? sb.from('areas').select('id,nama,kode,status').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; }) : Promise.resolve());
  ensureAreas.then(function(){
    urFillAreaDropdown();

    if(_pendingAreaVal){
      var asel2 = document.getElementById('urf-area');
      if(asel2) asel2.value = _pendingAreaVal;
    }
  });

  if(isEdit){

    var kecEl = document.getElementById('urf-kecamatan');
    if(kecEl) kecEl.value = data.kecamatan_id || '';
    var kelEl = document.getElementById('urf-kelurahan');
    if(kelEl) kelEl.value = data.kelurahan_id || '';
    var rwEl = document.getElementById('urf-rw');
    if(rwEl) rwEl.value = data.rw || '';
    var rtEl = document.getElementById('urf-rt');
    if(rtEl) rtEl.value = data.rt || '';
  }

  document.getElementById('ur-form-overlay').classList.add('on');
}

function urCloseForm(){ document.getElementById('ur-form-overlay').classList.remove('on'); }

function urFormRoleChange() {
  var role = (document.getElementById('urf-role')||{}).value||'';
  var r = normalizeRole(role);
  var def = ROLES[r] || {};
  var needsArea = def.needsArea || false;
  var wrap = document.getElementById('urf-area-wrap');
  if (wrap) wrap.style.display = needsArea ? 'block' : 'none';
  // SOT: kecamatan/kelurahan/rw/rt tidak dipakai sebagai dasar akses
  var detWrap = document.getElementById('urf-area-detail-wrap');
  if (detWrap) detWrap.style.display = 'none';
  // Tampilkan deskripsi role
  var hint = document.getElementById('urf-role-hint');
  if (hint) {
    hint.textContent = def.desc || '';
    hint.style.display = def.desc ? 'block' : 'none';
  }
}

function urTogglePin(){
  var inp = document.getElementById('urf-pin');
  var ico = document.getElementById('urf-pin-eye');
  if(!inp) return;
  if(inp.type === 'password'){ inp.type='text'; if(ico) ico.className='ti ti-eye-off'; }
  else { inp.type='password'; if(ico) ico.className='ti ti-eye'; }
}

function urSave(){
  var id       = document.getElementById('urf-id').value;
  var nama     = document.getElementById('urf-nama').value.trim();
  var username = document.getElementById('urf-username').value.trim().toLowerCase();
  var role     = document.getElementById('urf-role').value;
  var pin      = document.getElementById('urf-pin').value.trim();
  var hp       = document.getElementById('urf-hp').value.trim();
  var status   = document.getElementById('urf-status').value;
  var ket      = document.getElementById('urf-ket').value.trim();
  // SOT: area filter hanya dari area_id (UUID), hapus kecamatan/kelurahan/rw/rt
  var r = normalizeRole(role);
  var needsArea = (ROLES[r]||{}).needsArea || false;
  var area_coverage_id = needsArea ? ((document.getElementById('urf-area')||{}).value||null) : null;
  var kecamatan_id = null; var kelurahan_id = null; var rw = null; var rt = null;

  var ok = true;
  var chk = function(fid, v){ var e=document.getElementById(fid); if(!v){ e.classList.add('err'); ok=false; } else e.classList.remove('err'); };
  chk('urf-nama', nama);
  chk('urf-username', username);
  chk('urf-role', role);
  if(!id) chk('urf-pin', pin);

  if(!ok){ toast('Isi semua field wajib','err'); return; }

  if(pin && !/^\d{6}$/.test(pin)){
    toast('PIN harus 6 digit angka','err');
    document.getElementById('urf-pin').classList.add('err');
    return;
  }


  var dup = _urData.find(function(u){ return u.username===username && u.id!==id; });
  if(dup){ toast('Username sudah digunakan','err'); document.getElementById('urf-username').classList.add('err'); return; }

  var sb  = getSB();
  var btn = document.getElementById('urf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }




  var payload = {
    nama:nama,
    username:username,
    role:role,
    hp:hp||null,
    is_active: status !== 'nonaktif',
    keterangan:ket||null
  };

  if(needsArea){
    payload.area_coverage_id = area_coverage_id;
    payload.kecamatan_id     = kecamatan_id;
    payload.kelurahan_id     = kelurahan_id;
    payload.rw               = rw;
    payload.rt               = rt;
  } else {
    payload.area_coverage_id = null;
    payload.kecamatan_id     = null;
    payload.kelurahan_id     = null;
    payload.rw               = null;
    payload.rt               = null;
  }
  if(pin) payload.pin = pin;

  if(!sb){

    if(id){ var idx=_urData.findIndex(function(u){return u.id===id;}); if(idx>-1) Object.assign(_urData[idx],payload); }
    else { payload.id='usr-'+(Date.now()); payload.created_at=new Date().toISOString(); _urData.push(payload); }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    toast(id?'User diperbarui (offline)':'User ditambahkan (offline)','ok');
    urCloseForm(); urUpdateStats(); urRender();
    return;
  }

  var _T20_COLS = ['area_id','area_coverage_id','kecamatan_id','kelurahan_id','rw','rt'];
  function _doSave(pl){
    var p = id ? sb.from('app_users').update(pl).eq('id',id) : sb.from('app_users').insert([pl]);
    p.then(function(r){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
      if(r.error){

        var msg = r.error.message||'';
        var isColErr = msg.indexOf('Could not find') !== -1 || msg.indexOf('column') !== -1 || msg.indexOf('does not exist') !== -1;
        var hasT20 = _T20_COLS.some(function(k){ return pl.hasOwnProperty(k); });
        if(isColErr && hasT20){
          var pl2 = {};
          Object.keys(pl).forEach(function(k){ if(_T20_COLS.indexOf(k)===-1) pl2[k]=pl[k]; });
          toast('⚠ Kolom T20 belum ada di DB. Menyimpan tanpa area hierarchy…','info');
          _doSave(pl2);
          return;
        }
        toast('Gagal: '+msg,'err'); return;
      }
      toast(id?'User diperbarui':'User ditambahkan','ok');
      urCloseForm();
      _urLoaded = false;
      urLoad();
    }).catch(function(){ if(btn)btn.disabled=false; toast('Error jaringan','err'); });
  }
  _doSave(payload);
}

function urOpenDet(id){
  _urDetId = id;
  var u = _urData.find(function(x){ return x.id===id; });
  if(!u) return;
  var rConf    = UR_ROLES[u.role] || { label: u.role };
  var stTag    = u.status==='aktif'?'tg':'tr';
  var stLbl    = u.status==='aktif'?'Aktif':'Nonaktif';
  var initials = (u.nama||'??').split(' ').slice(0,2).map(function(w){ return w[0]||''; }).join('').toUpperCase();

  document.getElementById('ur-det-title').textContent = u.nama || '—';

  function dr(l,v){ return '<div class="olt-det-row"><div class="olt-det-lbl">'+l+'</div><div class="olt-det-val">'+v+'</div></div>'; }
  function sec(i,t){ return '<div class="olt-det-section"><i class="ti ti-'+i+'"></i> '+t+'</div>'; }

  document.getElementById('ur-det-body').innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--border);margin-bottom:4px">'+
      '<div class="ur-av '+_esc(u.role)+'" style="width:52px;height:52px;border-radius:14px;font-size:18px">'+initials+'</div>'+
      '<div><div style="font-size:16px;font-weight:800;color:var(--text)">'+_esc(u.nama||'—')+'</div>'+
      '<div style="font-size:11px;font-family:\'JetBrains Mono\',monospace;color:var(--c1);margin-top:3px">@'+_esc(u.username||'—')+'</div></div>'+
    '</div>'+
    sec('id-badge','Identitas')+
    dr('Role','<span class="tag role-'+_esc(u.role)+'">'+_esc(rConf.label)+'</span>')+
    dr('Status','<span class="tag '+stTag+'">'+stLbl+'</span>')+

    (function(){
      var needsArea = ['area_manager','sales','teknisi','viewer'].indexOf(u.role) >= 0;
      if(!needsArea) return '';
      var areaId = u.area_coverage_id || u.area_id;
      var ar = areaId && typeof _areaData!=='undefined' ? _areaData.find(function(a){ return a.id===areaId; }) : null;
      var parts = [];
      if(ar) parts.push('<strong>Area:</strong> '+_esc(ar.nama||areaId));
      if(u.kecamatan_id) parts.push('<strong>Kecamatan:</strong> '+_esc(u.kecamatan_id));
      if(u.kelurahan_id) parts.push('<strong>Kelurahan:</strong> '+_esc(u.kelurahan_id));
      if(u.rw) parts.push('<strong>RW:</strong> '+_esc(u.rw));
      if(u.rt) parts.push('<strong>RT:</strong> '+_esc(u.rt));
      if(!parts.length) return dr('Scope Wilayah','<span style="color:var(--red);font-size:11px">⚠ Belum ditentukan</span>');
      return dr('Scope Wilayah (T20)',
        '<div style="font-size:11px;line-height:1.9;color:var(--text2)">'+parts.join('<br>')+'</div>'+
        '<div style="font-size:10px;color:var(--c2);font-weight:700;margin-top:4px">'+
          '<i class="ti ti-shield-lock" style="font-size:11px"></i> Data difilter otomatis sesuai wilayah ini'+
        '</div>');
    })()+
    dr('No. HP', u.hp ? _esc(u.hp) : '<span style="color:var(--text4)">—</span>')+
    dr('PIN Login',
      '<div style="display:flex;align-items:center;gap:7px">'+
        '<span id="ur-det-pin-val" style="font-family:\'JetBrains Mono\',monospace;font-weight:800;letter-spacing:2px;color:var(--text)">'+(u.pin?'••••••':'<span style="color:var(--red);font-size:11px;font-weight:600;letter-spacing:0">⚠ Belum diset</span>')+'</span>'+
        (u.pin?'<button type="button" onclick="urToggleDetPin()" style="background:transparent;border:none;color:var(--text3);cursor:pointer;padding:3px;touch-action:manipulation"><i class="ti ti-eye" id="ur-det-pin-eye" style="font-size:15px"></i></button>':'')+
      '</div>')+
    (u.keterangan ? dr('Keterangan', _esc(u.keterangan)) : '')+
    sec('calendar','Audit')+
    dr('Dibuat', u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—')+
    (u.updated_at ? dr('Diperbarui', new Date(u.updated_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})) : '');

  document.getElementById('ur-det-foot').innerHTML =
    '<button class="btn btn-ghost" onclick="urOpenPinReset(\''+id+'\')"><i class="ti ti-lock-open"></i> Reset PIN</button>'+
    '<button class="btn" onclick="urOpenForm(_urData.find(function(x){return x.id===\''+id+'\';}));urCloseDet()"><i class="ti ti-edit"></i> Edit</button>';

  document.getElementById('ur-det-overlay').classList.add('on');
}
function urCloseDet(){ document.getElementById('ur-det-overlay').classList.remove('on'); }

function urToggleDetPin(){
  var span = document.getElementById('ur-det-pin-val');
  var ico  = document.getElementById('ur-det-pin-eye');
  if(!span) return;
  var u = _urData.find(function(x){ return x.id===_urDetId; });
  var pin = (u && u.pin) ? String(u.pin) : '';
  var isHidden = span.textContent.indexOf('•') >= 0;
  if(isHidden){
    span.textContent = pin || '—';
    if(ico) ico.className = 'ti ti-eye-off';
  } else {
    span.textContent = '••••••';
    if(ico) ico.className = 'ti ti-eye';
  }
}

function urToggleStatus(id){
  var u = _urData.find(function(x){ return x.id===id; });
  if(!u) return;
  var newStatus = u.status==='aktif' ? 'nonaktif' : 'aktif';
  var newIsActive = newStatus !== 'nonaktif';
  if(!confirm('Ubah status '+_esc(u.nama)+' menjadi '+newStatus+'?')) return;
  var sb = getSB();
  if(!sb){
    u.status = newStatus; u.is_active = newIsActive;
    toast('Status diubah (offline)','ok');
    urUpdateStats(); urRender();
    return;
  }
  sb.from('app_users').update({is_active:newIsActive}).eq('id',id).then(function(r){
    if(r.error){ toast('Gagal: '+(r.error.message||''),'err'); return; }
    u.status = newStatus; u.is_active = newIsActive;
    toast('Status diubah menjadi '+newStatus,'ok');
    urUpdateStats(); urRender();
  });
}

function urOpenPinReset(id){
  var u = _urData.find(function(x){ return x.id===id; });
  if(!u) return;
  document.getElementById('urpin-id').value    = id;
  document.getElementById('urpin-pin').value   = '';
  document.getElementById('urpin-pin').type    = 'password';
  document.getElementById('urpin-eye').className = 'ti ti-eye';
  var info = document.getElementById('urpin-info');
  if(info) info.textContent = 'Reset PIN untuk: '+u.nama+' (@'+u.username+')';
  document.getElementById('ur-pin-overlay').classList.add('on');
}
function urClosePinReset(){ document.getElementById('ur-pin-overlay').classList.remove('on'); }

function urTogglePinReset(){
  var inp = document.getElementById('urpin-pin');
  var ico = document.getElementById('urpin-eye');
  if(!inp) return;
  if(inp.type === 'password'){ inp.type='text'; if(ico) ico.className='ti ti-eye-off'; }
  else { inp.type='password'; if(ico) ico.className='ti ti-eye'; }
}

function urSavePinReset(){
  var id  = document.getElementById('urpin-id').value;
  var pin = document.getElementById('urpin-pin').value.trim();
  if(!/^\d{6}$/.test(pin)){ toast('PIN harus 6 digit angka','err'); return; }
  var sb  = getSB();
  var btn = document.getElementById('urpin-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  if(!sb){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-lock"></i> Reset PIN'; }
    toast('PIN direset (offline)','ok');
    urClosePinReset();
    return;
  }

  sb.from('app_users').update({pin:pin}).eq('id',id).then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-lock"></i> Reset PIN'; }
    if(r.error){ toast('Gagal: '+(r.error.message||''),'err'); return; }
    toast('PIN berhasil direset','ok');
    urClosePinReset();
  }).catch(function(){ if(btn)btn.disabled=false; toast('Error','err'); });
}

function urBuildMatrix(){
  var tbody = document.getElementById('ur-matrix-body');
  if(!tbody) return;
  var accIcon = function(a){
    if(a==='F') return '<i class="ti ti-circle-check ur-acc-full" title="Full Access"></i>';
    if(a==='R') return '<i class="ti ti-eye ur-acc-read" title="Read Only"></i>';
    return '<i class="ti ti-minus ur-acc-none"></i>';
  };
  tbody.innerHTML = UR_MATRIX.map(function(row){
    return '<tr><td>'+_esc(row.modul)+'</td>'+row.acc.map(function(a){ return '<td>'+accIcon(a)+'</td>'; }).join('')+'</tr>';
  }).join('');


  var cards = document.getElementById('ur-role-cards');
  if(!cards) return;
  cards.innerHTML = Object.keys(UR_ROLES).map(function(key){
    var r = UR_ROLES[key];
    var count = _urData.filter(function(u){ return u.role===key; }).length;
    return '<div class="ur-role-card">'+
      '<div class="ur-role-card-hd">'+
        '<div class="ur-role-card-ico '+key+'">'+r.short+'</div>'+
        '<div>'+
          '<div class="ur-role-card-name">'+_esc(r.label)+'</div>'+
          '<div style="font-size:10px;color:var(--text3);font-family:\'JetBrains Mono\',monospace">'+count+' user</div>'+
        '</div>'+
      '</div>'+
      '<div class="ur-role-card-desc">'+_esc(r.desc)+'</div>'+
    '</div>';
  }).join('');
}

function urBuildSesi(){
  var list = document.getElementById('ur-sesi-list');
  if(!list) return;
  var aktif = _urData.filter(function(u){ return u.status==='aktif'; });
  if(!aktif.length){ list.innerHTML='<div style="text-align:center;padding:24px 0;color:var(--text3);font-size:12px"><i class="ti ti-device-laptop" style="font-size:28px;display:block;opacity:.3;margin-bottom:8px"></i>Tidak ada sesi aktif</div>'; return; }
  list.innerHTML = aktif.map(function(u){
    var rConf = UR_ROLES[u.role]||{label:u.role};
    var now = new Date();
    var mins = Math.floor(Math.random()*120)+5;
    var loginTime = new Date(now - mins*60000);
    var timeStr = loginTime.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
    return '<div class="ur-sesi-row">'+
      '<div class="ur-sesi-dot"></div>'+
      '<div class="ur-sesi-info">'+
        '<div class="ur-sesi-name">'+_esc(u.nama||u.username)+' <span class="tag role-'+_esc(u.role)+'" style="font-size:9px;padding:2px 6px">'+_esc(rConf.label)+'</span></div>'+
        '<div class="ur-sesi-meta">@'+_esc(u.username)+' · Login sejak '+timeStr+' · Browser</div>'+
      '</div>'+
      '<button class="ur-sesi-cabut" onclick="urCabutSesi(\''+u.id+'\')">Cabut</button>'+
    '</div>';
  }).join('');
}

function urCabutSesi(id){
  var u = _urData.find(function(x){ return x.id===id; });
  if(!u) return;
  if(!confirm('Cabut sesi '+u.nama+'? User akan dipaksa logout.')) return;
  toast('Sesi '+u.nama+' dicabut','ok');
  urBuildSesi();
}

_navDispatch.register('userrole', function(){ if(typeof urLoad==='function') setTimeout(function(){ urLoad(); }, 80); });
var _rtChannels   = {};
var _rtEventCount = 0;
var _rtActive     = false;

var RT_TABLES = [
  { name:'pelanggan',      icon:'ti-user-circle',  color:'var(--c1)'   },
  { name:'odp_ports',      icon:'ti-plug',         color:'var(--cyan)' },
  { name:'odps',           icon:'ti-router',       color:'var(--c2)'   },
  { name:'odcs',           icon:'ti-server',       color:'var(--pu)'   },
  { name:'olts',           icon:'ti-broadcast',    color:'var(--cyan)' },
  { name:'areas',          icon:'ti-map-pin',      color:'var(--green)'},
  { name:'app_users',      icon:'ti-shield-lock',  color:'var(--pu)'   },
  { name:'tickets',        icon:'ti-ticket',       color:'var(--c2)'   },
  { name:'approval_isp',   icon:'ti-checks',       color:'var(--green)'},
  { name:'fee_otf',        icon:'ti-bolt',         color:'var(--yellow)'},
  { name:'fee_recurring',  icon:'ti-refresh',      color:'var(--pu)'   },
  { name:'material_items', icon:'ti-package',      color:'var(--c2)'   },
  { name:'material_mutasi',icon:'ti-transfer',     color:'var(--pu)'   },
  { name:'dismantle_orders',icon:'ti-plug-x',      color:'var(--red)'  },
];

function rtLog(msg, type){
  var el = document.getElementById('rt-log');
  if(!el) return;
  var ts = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var colors = { info:'#a0e0b0', warn:'#fcd34d', err:'#f87171', evt:'#67e8f9', sys:'#c084fc' };
  var col = colors[type||'info'] || colors.info;
  var line = document.createElement('div');
  line.style.cssText = 'color:'+col+';margin-bottom:2px;word-break:break-all';
  line.textContent = '['+ts+'] '+msg;

  if(el.children.length > 200) el.removeChild(el.firstChild);
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;

  var le = document.getElementById('rt-last-event');
  if(le) le.textContent = ts;
}

function rtUpdateStatus(connected){
  var dot = document.getElementById('rt-status-dot');
  if(dot){
    dot.textContent = connected ? 'LIVE' : 'OFF';
    dot.style.color = connected ? 'var(--green)' : 'var(--red)';
  }
  var cnt = document.getElementById('rt-channel-count');
  if(cnt) cnt.textContent = Object.keys(_rtChannels).length;
}

function rtUpdateEventCount(){
  _rtEventCount++;
  var el = document.getElementById('rt-event-count');
  if(el) el.textContent = _rtEventCount;
}

function rtBuildChannelList(){
  var el = document.getElementById('rt-channel-list');
  if(!el) return;
  el.innerHTML = RT_TABLES.map(function(t){
    var active = !!_rtChannels[t.name];
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border)">'+
      '<div style="width:32px;height:32px;border-radius:8px;background:'+t.color.replace('var(','').replace(')','')+'1a;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
        '<i class="ti '+t.icon+'" style="color:'+t.color+';font-size:15px"></i>'+
      '</div>'+
      '<div style="flex:1">'+
        '<div style="font-size:13px;font-weight:700;color:var(--text);font-family:\'JetBrains Mono\',monospace">'+t.name+'</div>'+
        '<div style="font-size:10px;color:var(--text3)">INSERT · UPDATE · DELETE</div>'+
      '</div>'+
      '<span id="rt-badge-'+t.name+'" style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;'+
        (active ? 'background:var(--gng);color:var(--green)' : 'background:var(--bg4);color:var(--text3)')+
      '">'+(active?'● LIVE':'○ OFF')+'</span>'+
    '</div>';
  }).join('');
}

var _autoSyncRunning  = false;
var _autoSyncReconInt = null;
var _autoSyncHbInt    = null;

function _autoSyncStart(){
  if(_autoSyncRunning) return;
  var sb = getSB();
  if(!sb){ setTimeout(_autoSyncStart, 2000); return; }
  _autoSyncRunning = true;

  // TTL 60 detik — realtime subscriptions handle perubahan aktual
  // TTL hanya fallback jika koneksi realtime putus
  SOT._ttl = 0; // No local cache — always fetch from Supabase

  RT_TABLES.forEach(function(t){
    _autoSyncSubscribe(t.name);
  });

  // Heartbeat: hanya cek reconnect channel, tidak invalidate SOT
  // Invalidasi akan terjadi otomatis via realtime event
  /* Heartbeat interval dihapus — realtime subscription handles all */

  _autoSyncReconInt = setInterval(function(){
    if(!getSB()) return;
    RT_TABLES.forEach(function(t){
      if(!_rtChannels[t.name]) _autoSyncSubscribe(t.name);
    });
  }, 30000);


  window.addEventListener('online', function(){
    setTimeout(function(){
      RT_TABLES.forEach(function(t){
        if(!_rtChannels[t.name]) _autoSyncSubscribe(t.name);
      });
      if(window.SOT){ SOT.invalidate('general'); SOT.refresh(true); }
    }, 1500);
  });


  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible'){
      if(window.SOT){ SOT.invalidate('general'); SOT.refresh(false, function(){
        if(typeof monSimpleRender==='function') try{ monSimpleRender(); }catch(e){}
      }); }
      /* Refresh modul yang sedang aktif saat kembali dari background */
      var _ap = window._currentPane || '';
      var _pEl = function(id){ var e=document.getElementById(id); return e&&e.classList.contains('on'); };
      setTimeout(function(){
        if(_pEl('p-pelanggan') && typeof pelLoadPage==='function')
          try{ pelLoadPage((typeof _pelPage!=='undefined'&&_pelPage>0)?_pelPage:1); }catch(e){}
        if(_ap==='olt'      && typeof oltLoad==='function')  try{oltLoad();}catch(e){}
        if(_ap==='odc'      && typeof odcLoad==='function')  try{odcLoad();}catch(e){}
        if(_ap==='odp'      && typeof odpLoad==='function')  try{odpLoad();}catch(e){}
        if(_ap==='area'     && typeof areaLoad==='function') try{areaLoad();}catch(e){}
        if(_ap==='material' && typeof matiLoad==='function') try{matiLoad();}catch(e){}
        if(_ap==='dismantle'&& typeof dmtLoad==='function')  try{dmtLoad();}catch(e){}
        if(_ap==='userrole' && typeof urLoad==='function')   try{urLoad();}catch(e){}
        if(_ap==='finance'  && typeof otfLoad==='function')  try{otfLoad();}catch(e){}
      }, 300);
    }
  });
}

function _autoSyncSubscribe(tbl){
  var sb = getSB();
  if(!sb || _rtChannels[tbl]) return;
  try{
    var ch = sb.channel('as-'+tbl)
      .on('postgres_changes', { event:'*', schema:'public', table:tbl },
        function(payload){
          rtUpdateEventCount();
          var ev   = payload.eventType || payload.type || 'CHANGE';
          var rec  = payload.new || payload.old || {};
          var recId= rec.id ? ' id='+String(rec.id).slice(0,8) : '';
          rtLog('[AUTO '+tbl+'] '+ev+recId, 'evt');


          if(window.SOT) SOT.invalidate('general');


          if(tbl==='areas'||tbl==='odcs'||tbl==='odps'||tbl==='odp_ports'){
            _areaLoaded=false; _odcLoaded=false; _odpLoaded=false; _portLoaded=false;
            if(window.SOT) SOT.refresh(true, function(){
              if(typeof monSimpleRender==='function') try{ monSimpleRender(); }catch(e){}
            });
          }
          if(tbl==='pelanggan'){
            if(typeof _pelLoaded!=='undefined') _pelLoaded=false;
            if(typeof _dashLoaded!=='undefined'){ _dashLoaded=false; window._dashLastLoad=0; }
            if(typeof _otfLoaded!=='undefined') _otfLoaded=false;
            if(typeof _recLoaded!=='undefined') _recLoaded=false;

            var _rtEv  = payload.eventType || payload.type || '';
            var _rtRec = payload.new || payload.old || {};
            var _rtId  = _rtRec.id || null;

            /* Debounce: cegah spam reload */
            if(window._pelRtDebounce) clearTimeout(window._pelRtDebounce);
            window._pelRtDebounce = setTimeout(function(){

              /* Update cache lokal dulu agar render langsung */
              if(_rtEv === 'INSERT' && _rtRec && _rtRec.id){
                if(typeof _pelData !== 'undefined' && Array.isArray(_pelData)){
                  if(!_pelData.find(function(p){ return p.id===_rtRec.id; }))
                    _pelData.unshift(_rtRec);
                }
                /* Hapus baris optimistic sementara */
                document.querySelectorAll('[id^="_optrow_"]').forEach(function(el){ el.remove(); });
              } else if(_rtEv === 'UPDATE' && _rtId){
                if(typeof _pelData !== 'undefined' && Array.isArray(_pelData)){
                  var idx = -1;
                  for(var i=0;i<_pelData.length;i++){ if(_pelData[i].id===_rtId){idx=i;break;} }
                  if(idx>=0) _pelData[idx] = Object.assign({}, _pelData[idx], _rtRec);
                }
              } else if(_rtEv === 'DELETE' && _rtId){
                if(typeof _pelData !== 'undefined' && Array.isArray(_pelData)){
                  _pelData = _pelData.filter(function(p){ return p.id!==_rtId; });
                  window._pelData = _pelData;
                }
              }

              /* Refresh UI halaman pelanggan jika sedang terbuka */
              var _pelPaneEl = document.getElementById('p-pelanggan');
              var _pelPaneOn = _pelPaneEl && _pelPaneEl.classList.contains('on');
              if(_pelPaneOn){
                if(typeof pelLoadPage === 'function'){
                  try{ pelLoadPage((typeof _pelPage!=='undefined' && _pelPage>0) ? _pelPage : 1); }catch(e){}
                }
              }

              /* Refresh SOT cache untuk modul lain */
              if(window.SOT) SOT.refresh(true, function(){
                if(typeof monSimpleRender==='function') try{ monSimpleRender(); }catch(e){}
              });

            }, 700);
          }
          if(tbl==='app_users'){ _urLoaded=false; if(typeof urLoad==='function') urLoad(); }
          if(tbl==='tickets' && typeof ticketLoad==='function'){ if(typeof _ticketLoaded!=='undefined') _ticketLoaded=false; ticketLoad(); }
          if(tbl==='fee_otf'){ _otfLoaded=false; if(typeof otfLoad==='function') otfLoad(); }
          if(tbl==='fee_recurring'){ if(typeof _recLoaded!=='undefined') _recLoaded=false; if(typeof recLoad==='function') recLoad(); }
          if(tbl==='approval_isp' && typeof appLoad==='function') appLoad();

          /* Realtime untuk modul yang baru ditambahkan */
          var _activePane = window._currentPane || '';
          if(tbl==='olts'){
            _oltData=[]; _oltLoaded=false;
            if(_activePane==='olt' && typeof oltLoad==='function') oltLoad();
          }
          if(tbl==='odcs'){
            _odcData=[]; _odcLoaded=false;
            if(_activePane==='odc' && typeof odcLoad==='function') odcLoad();
          }
          if(tbl==='odps'){
            _odpData=[]; _odpLoaded=false;
            if(_activePane==='odp' && typeof odpLoad==='function') odpLoad();
          }
          if(tbl==='areas'){
            _areaData=[]; _areaLoaded=false;
            if(_activePane==='area' && typeof areaLoad==='function') areaLoad();
          }
          if(tbl==='material_items'){
            _matiData=[]; _matiLoaded=false;
            if(_activePane==='material' && typeof matiLoad==='function') matiLoad();
          }
          if(tbl==='material_mutasi'){
            _mutData=[]; _mutLoaded=false;
            if(_activePane==='material' && typeof mutLoad==='function') mutLoad();
          }
          if(tbl==='dismantle_orders'){
            _dmtData=[]; _dmtLoaded=false;
            if(_activePane==='dismantle' && typeof dmtLoad==='function') dmtLoad();
          }
        }
      )
      .subscribe(function(status){
        if(status==='SUBSCRIBED'){
          _rtChannels[tbl] = ch;
          rtUpdateStatus(true);
        } else if(status==='CHANNEL_ERROR'||status==='CLOSED'){
          delete _rtChannels[tbl];
          rtUpdateStatus(Object.keys(_rtChannels).length>0);

          setTimeout(function(){ _autoSyncSubscribe(tbl); }, 5000);
        }
      });
  } catch(e){

    setTimeout(function(){ _autoSyncSubscribe(tbl); }, 5000);
  }
}

function _autoSyncStop(){
  _autoSyncRunning = false;
  if(_autoSyncHbInt)    clearInterval(_autoSyncHbInt);
  if(_autoSyncReconInt) clearInterval(_autoSyncReconInt);
  _autoSyncHbInt = null;
  _autoSyncReconInt = null;

  if(window.SOT) SOT._ttl = 0; // No local cache — always fetch from Supabase
}

function rtSubscribeTable(tbl){
  var sb = getSB();
  if(!sb){ rtLog('Supabase tidak terhubung','err'); return; }
  if(_rtChannels[tbl]){
    rtLog('Channel '+tbl+' sudah aktif','warn'); return;
  }
  rtLog('Subscribing to '+tbl+'…','sys');
  try{
    var ch = sb.channel('rt-'+tbl)
      .on('postgres_changes',
        { event:'*', schema:'public', table:tbl },
        function(payload){
          rtUpdateEventCount();
          var ev   = payload.eventType || payload.type || 'CHANGE';
          var rec  = payload.new || payload.old || {};
          var recId= rec.id ? ' id='+String(rec.id).slice(0,8) : '';
          rtLog('['+tbl+'] '+ev+recId, 'evt');


          if(window.SOT) SOT.invalidate('general');


          if(tbl==='pelanggan'){
            _pelLoaded=false;
            if(typeof pelLoad==='function') pelLoad();
          }

          if(tbl==='areas'||tbl==='odcs'||tbl==='odps'||tbl==='odp_ports'){
            _areaLoaded=false; _odcLoaded=false; _odpLoaded=false; _portLoaded=false;
            if(window.SOT) SOT.refresh(true, function(){

              if(typeof monSimpleRender==='function') try{ monSimpleRender(); }catch(e){}
            });
          }

          if(tbl==='app_users'){
            _urLoaded=false;
            if(typeof urLoad==='function') urLoad();
          }

          if(tbl==='tickets' && typeof ticketLoad==='function'){
            if(typeof _ticketLoaded!=='undefined') _ticketLoaded=false;
            ticketLoad();
          }

          if(tbl==='fee_otf'){
            _otfLoaded=false;
            if(typeof otfLoad==='function') otfLoad();
          }

          if(tbl==='approval_isp' && typeof appLoad==='function') appLoad();
        }
      )
      .subscribe(function(status){
        if(status==='SUBSCRIBED'){
          rtLog('✓ '+tbl+' SUBSCRIBED','sys');
          _rtChannels[tbl] = ch;
          rtUpdateStatus(true);
          rtBuildChannelList();
          var badge = document.getElementById('rt-badge-'+tbl);
          if(badge){ badge.textContent='● LIVE'; badge.style.cssText='font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;background:var(--gng);color:var(--green)'; }
        } else if(status==='CHANNEL_ERROR' || status==='CLOSED'){
          rtLog('✗ '+tbl+' '+status,'err');
          delete _rtChannels[tbl];
          rtUpdateStatus(Object.keys(_rtChannels).length>0);
          rtBuildChannelList();
        }
      });
  } catch(e){
    rtLog('Error subscribe '+tbl+': '+(e.message||e),'err');
  }
}

function rtStartAll(){
  if(!getSB()){ toast('Supabase tidak terhubung','err'); return; }
  _rtActive = true;
  rtLog('=== START ALL CHANNELS ===','sys');
  RT_TABLES.forEach(function(t){ rtSubscribeTable(t.name); });
  toast('Realtime Sync dimulai','ok');
}

function rtStopAll(){
  var sb = getSB();
  rtLog('=== STOP ALL CHANNELS ===','warn');
  Object.keys(_rtChannels).forEach(function(name){
    try{
      if(sb) sb.removeChannel(_rtChannels[name]);
    }catch(e){}
    delete _rtChannels[name];
    var badge = document.getElementById('rt-badge-'+name);
    if(badge){ badge.textContent='○ OFF'; badge.style.cssText='font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;background:var(--bg4);color:var(--text3)'; }
  });
  _rtActive = false;
  rtUpdateStatus(false);
  rtBuildChannelList();
  toast('Realtime Sync dihentikan','ok');
}

function rtClearLog(){
  var el = document.getElementById('rt-log');
  if(el) el.innerHTML = '<div style="color:#4a5878;font-style:italic">// Log dibersihkan.</div>';
  _rtEventCount = 0;
  var ec = document.getElementById('rt-event-count');
  if(ec) ec.textContent = '0';
}

_navDispatch.register('realtimesync', function(){ setTimeout(function(){ rtBuildChannelList(); rtUpdateStatus(_rtActive); }, 80); });
var _rptLoaded  = false;
var _rptPelFil  = [];
var _rptPelPage = 1;
var _rptPelPerPg= 20;

var _rptLoginTime = null;
var _rptClockInterval = null;
var _rptAktPage   = 1;
var _rptLogPage   = 1;
var _rptAktTotal  = 0;
var _rptLogTotal  = 0;
var _rptAktLimit  = 20;
var _rptLogLimit  = 20;

var _rptRealtimeCh     = null;
var _rptOnlineTimer    = null;
var _rptRealtimeActive = false;

(function(){
  var _origRptLogin = window._loginOK;
  if(typeof _origRptLogin === 'function' && !_origRptLogin._rptTimePatch){
    window._loginOK = function(usr){
      _rptLoginTime = new Date();
      _origRptLogin.apply(this, arguments);
    };
    window._loginOK._rptTimePatch = true;
  }
})();
if(!_rptLoginTime) _rptLoginTime = new Date();

function rptTab2(tab, btnEl){
  ['online','sesi','aktivitas','log'].forEach(function(t){
    var pane = document.getElementById('rpt2-pane-'+t);
    var btn  = document.getElementById('rpt-tb-'+t);
    if(pane) pane.style.display = (t===tab) ? 'block' : 'none';
    if(btn){
      var active = (t===tab);
      var isOnline = (t==='online');
      btn.style.background   = active ? (isOnline?'var(--green)':'var(--c1)') : 'var(--bg2)';
      btn.style.color        = active ? '#fff' : 'var(--text2)';
      btn.style.borderColor  = active ? (isOnline?'var(--green)':'var(--c1)') : 'var(--border2)';
    }
  });
  if(tab === 'online')    rptOnlineLoad();
  if(tab === 'sesi')      rptSesiLoad();
  if(tab === 'aktivitas') rptAktLoad();
  if(tab === 'log')       rptLogLoad();
}

if(typeof _navDispatch !== 'undefined' && typeof _navDispatch.register === 'function'){
  _navDispatch.register('reporting', function(){
    setTimeout(function(){
      rptTab2('online', document.getElementById('rpt-tb-online'));

      if(_isSuperAdmin()) _rptStartRealtime();

      _rptStartOnlineAutoRefresh();
    }, 100);
  });
}

function _rptStartRealtime(){
  if(_rptRealtimeActive) return;
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb || typeof sb.channel !== 'function') return;
  _rptRealtimeActive = true;


  function _setBadge(active){
    ['rpt-tb-aktivitas','rpt-tb-log'].forEach(function(id){
      var btn = document.getElementById(id);
      if(!btn) return;
      if(active && !btn.querySelector('._rt-dot')){
        var dot = document.createElement('span');
        dot.className = '_rt-dot';
        dot.style.cssText = 'display:inline-block;width:7px;height:7px;background:#4ade80;border-radius:50%;margin-left:4px;animation:blink 1.5s infinite;vertical-align:middle';
        btn.appendChild(dot);
      } else if(!active){
        var d = btn.querySelector('._rt-dot');
        if(d) d.remove();
      }
    });
  }

  try {
    _rptRealtimeCh = sb.channel('rpt-actlog-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'activity_log' },
        function(payload){

          _rptShowRealtimeToast(payload);

          var paneAkt = document.getElementById('rpt2-pane-aktivitas');
          if(paneAkt && paneAkt.style.display !== 'none' && payload.new){
            _rptPrependActivity(payload.new);
          }

          var paneLog = document.getElementById('rpt2-pane-log');
          if(paneLog && paneLog.style.display !== 'none' && payload.new){
            var j = (payload.new.jenis||'').toLowerCase();
            var isDataChange = j.indexOf('create')>=0||j.indexOf('update')>=0||
                               j.indexOf('delete')>=0||j.indexOf('ubah')>=0||
                               j.indexOf('tambah')>=0||j.indexOf('hapus')>=0||
                               j.indexOf('dismantle')>=0;
            if(isDataChange) _rptPrependLog(payload.new);
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_users' },
        function(payload){

          var paneOnline = document.getElementById('rpt2-pane-online');
          if(paneOnline && paneOnline.style.display !== 'none'){

            if(window._rptOnlineDebounce) clearTimeout(window._rptOnlineDebounce);
            window._rptOnlineDebounce = setTimeout(rptOnlineLoad, 2000);
          }
        }
      )
      .subscribe(function(status){
        _setBadge(status === 'SUBSCRIBED');

        var rtInd = document.getElementById('rpt-rt-indicator');
        var rtLbl = document.getElementById('rpt-rt-label');
        var isOk  = (status === 'SUBSCRIBED');
        if(rtInd){ rtInd.style.display = isOk ? 'inline-block' : 'none'; }
        if(rtLbl){ rtLbl.style.display = isOk ? 'inline' : 'none'; }
        if(status === 'CLOSED' || status === 'CHANNEL_ERROR'){
          _rptRealtimeActive = false;

          setTimeout(_rptStartRealtime, 10000);
        }
      });
  } catch(e){
    _rptRealtimeActive = false;

  }
}

function _rptStopRealtime(){
  if(_rptRealtimeCh){
    try{ _rptRealtimeCh.unsubscribe(); }catch(e){}
    _rptRealtimeCh = null;
  }
  _rptRealtimeActive = false;
  if(_rptOnlineTimer){ clearInterval(_rptOnlineTimer); _rptOnlineTimer = null; }
}

function _rptStartOnlineAutoRefresh(){
  if(_rptOnlineTimer) clearInterval(_rptOnlineTimer);
  _rptOnlineTimer = setInterval(function(){
    var pane = document.getElementById('rpt2-pane-online');
    if(pane && pane.style.display !== 'none') rptOnlineLoad();
  }, 30000);
}

function _rptShowRealtimeToast(payload){
  var data = payload.new || {};
  var jenis = (data.jenis||'event').replace(/_/g,' ');
  var oleh  = data.dilakukan_oleh || 'Sistem';
  var role  = data.role_aktor ? ' ('+data.role_aktor+')' : '';
  var msg   = '<b>'+_esc(oleh)+role+'</b><br><span style="font-size:10px;opacity:.85">'+_esc(jenis)+'</span>';
  var toast = document.createElement('div');
  toast.innerHTML = '<i class="ti ti-activity" style="font-size:16px;flex-shrink:0"></i><div>'+msg+'</div>';
  toast.style.cssText = 'position:fixed;bottom:70px;right:14px;z-index:99999;background:var(--c1);color:#fff;'+
    'padding:10px 14px;border-radius:12px;font-family:Sora,sans-serif;font-size:11px;font-weight:600;'+
    'box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;gap:8px;max-width:220px;'+
    'animation:slideUp .3s ease;line-height:1.4';
  document.body.appendChild(toast);
  setTimeout(function(){ toast.style.opacity='0'; toast.style.transition='opacity .4s'; }, 3600);
  setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 4100);
}

function _rptPrependActivity(row){
  _rptAktTotal += 1;
  /* Kalau user sedang bukan di halaman 1 (mis. sedang lihat data lama),
     jangan ganggu tampilannya — cukup update total di info pager saja. */
  if(_rptAktPage !== 1){ _rptAktPagerUpdate(); return; }

  var list = document.getElementById('rpt-akt-list');
  if(!list) return;

  var empty = list.querySelector('.rpt-empty-state');
  if(empty) empty.remove();

  var tmp = document.createElement('div');
  tmp.style.cssText = 'display:flex;flex-direction:column;gap:0';
  var aksiIcon = function(j){
    if(!j) return 'ti-circle-dot';
    if(j.indexOf('create')>=0||j.indexOf('insert')>=0) return 'ti-plus-circle';
    if(j.indexOf('update')>=0||j.indexOf('edit')>=0)   return 'ti-edit-circle';
    if(j.indexOf('delete')>=0||j.indexOf('hapus')>=0)  return 'ti-trash';
    if(j.indexOf('login')>=0)  return 'ti-login';
    if(j.indexOf('logout')>=0) return 'ti-logout';
    return 'ti-circle-dot';
  };
  var aksiColor = function(j){
    if(!j) return 'var(--text3)';
    if(j.indexOf('create')>=0||j.indexOf('insert')>=0) return 'var(--green)';
    if(j.indexOf('update')>=0||j.indexOf('edit')>=0)   return 'var(--c1)';
    if(j.indexOf('delete')>=0||j.indexOf('hapus')>=0)  return 'var(--red)';
    if(j.indexOf('login')>=0)  return 'var(--pu)';
    return 'var(--text3)';
  };
  var fmtDT = function(s){
    if(!s) return '—';
    var d = new Date(s); if(isNaN(d)) return s;
    var p=function(n){return n<10?'0'+n:n;};
    return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());
  };
  var j = (row.jenis||''); var color = aksiColor(j); var icon = aksiIcon(j);
  tmp.innerHTML = '<div style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid '+color+'44;display:flex;align-items:flex-start;gap:10px;animation:slideUp .3s ease">'+
    '<div style="width:34px;height:34px;border-radius:10px;background:'+color+'18;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
      '<i class="ti '+icon+'" style="font-size:16px;color:'+color+'"></i>'+
    '</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-size:11px;font-weight:800;color:var(--green);margin-bottom:2px">● BARU</div>'+
      '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;text-transform:capitalize">'+_esc(j.replace(/_/g,' '))+'</div>'+
      '<div style="font-size:11px;color:var(--text2);margin-bottom:4px;word-break:break-word">'+_esc(row.keterangan||'—')+'</div>'+
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+
        '<span style="font-size:10px;font-weight:700;color:'+color+';background:'+color+'15;padding:2px 8px;border-radius:20px">'+_esc(row.dilakukan_oleh||'—')+'</span>'+
        (row.role_aktor?'<span style="font-size:10px;color:var(--text3);background:var(--bg3);padding:2px 8px;border-radius:20px">'+_esc(row.role_aktor)+'</span>':'')+
        '<span style="font-size:10px;color:var(--text3);margin-left:auto">'+fmtDT(row.created_at)+'</span>'+
      '</div>'+
    '</div>'+
  '</div>';
  list.insertBefore(tmp.firstChild, list.firstChild);
  while(list.children.length > _rptAktLimit) list.removeChild(list.lastChild);
  _rptAktPagerUpdate();
}

function _rptPrependLog(row){
  _rptLogTotal += 1;
  if(_rptLogPage !== 1){ _rptLogPagerUpdate(); return; }

  var list = document.getElementById('rpt-log-list');
  if(!list) return;
  var empty = list.querySelector('.rpt-empty-state');
  if(empty) empty.remove();
  var aksiLabel = function(jenis){
    if(!jenis) return {lbl:'—',color:'var(--text3)',bg:'var(--bg3)'};
    var j=jenis.toLowerCase();
    if(j.indexOf('create')>=0||j.indexOf('insert')>=0||j.indexOf('tambah')>=0)
      return {lbl:'➕ Tambah',color:'var(--green)',bg:'var(--gng2)'};
    if(j.indexOf('update')>=0||j.indexOf('edit')>=0||j.indexOf('ubah')>=0)
      return {lbl:'✏️ Ubah',color:'var(--c1)',bg:'var(--c1b)'};
    if(j.indexOf('delete')>=0||j.indexOf('hapus')>=0)
      return {lbl:'🗑️ Hapus',color:'var(--red)',bg:'var(--rg2)'};
    if(j.indexOf('dismantle')>=0)
      return {lbl:'🔧 Cabut',color:'var(--c2)',bg:'var(--c2b)'};
    return {lbl:jenis.replace(/_/g,' '),color:'var(--text3)',bg:'var(--bg3)'};
  };
  var fmtDT = function(s){
    if(!s) return '—';
    var d=new Date(s); if(isNaN(d)) return s;
    var p=function(n){return n<10?'0'+n:n;};
    return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' · '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
  };
  var ak = aksiLabel(row.jenis);
  var modul = (row.jenis||'').split('_')[0]||'—';
  var tmp = document.createElement('div');
  tmp.innerHTML = '<div style="background:var(--bg2);border-radius:12px;border:1.5px solid '+ak.color+'44;overflow:hidden;animation:slideUp .3s ease">'+
    '<div style="padding:12px 14px">'+
      '<div style="font-size:11px;font-weight:800;color:var(--green);margin-bottom:4px">● BARU</div>'+
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap">'+
        '<span style="font-size:10px;font-weight:800;padding:2px 10px;border-radius:20px;background:'+ak.bg+';color:'+ak.color+'">'+ak.lbl+'</span>'+
        '<span style="font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px">'+_esc(modul)+'</span>'+
      '</div>'+
      '<div style="font-size:12px;color:var(--text);margin-bottom:6px;word-break:break-word">'+_esc(row.keterangan||'—')+'</div>'+
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'+
        '<span style="font-size:10px;font-weight:700;color:var(--pu);background:var(--pug);padding:2px 8px;border-radius:20px">'+_esc(row.dilakukan_oleh||'—')+'</span>'+
        (row.role_aktor?'<span style="font-size:10px;color:var(--text3)">'+_esc(row.role_aktor)+'</span>':'')+
        '<span style="font-size:10px;color:var(--text3);margin-left:auto;font-family:monospace">'+fmtDT(row.created_at)+'</span>'+
      '</div>'+
    '</div>'+
  '</div>';
  list.insertBefore(tmp.firstChild, list.firstChild);
  while(list.children.length > _rptLogLimit) list.removeChild(list.lastChild);
  _rptLogPagerUpdate();
}
/* ROOT CAUSE ditemukan: variabel ini sebelumnya TIDAK PERNAH dideklarasikan
   (tidak ada `var`) sebelum dibaca di `if(_rptHeartbeatInterval)` di bawah.
   Membaca variabel yang belum pernah dideklarasikan/di-assign di manapun
   melempar ReferenceError (beda dengan sekadar bernilai undefined) — jadi
   _rptStartHeartbeat() SELALU crash di baris itu, di setiap pemanggilan,
   sejak awal. Heartbeat last_seen karena itu tidak pernah benar-benar
   berjalan sama sekali, untuk siapapun. Deklarasi eksplisit di sini
   memperbaikinya secara langsung. */
var _rptHeartbeatInterval = null;

function _rptStartHeartbeat(){

  if(_rptHeartbeatInterval) return;
  function _beat(){
    var sb=(typeof getSB==='function')?getSB():null;
    var cu=window.CU||null;
    if(!sb||!cu||!cu.id){
      window._rptLastBeat = {time:new Date(), ok:false, msg:'Belum login (CU kosong) — heartbeat menunggu'};
      if(typeof _rptOnlineDiagRefresh==='function') _rptOnlineDiagRefresh();
      return;
    }
    sb.from('app_users').update({last_seen:new Date().toISOString()}).eq('id',cu.id).select('id').then(function(r){
      if(r && r.error){
        console.error('[heartbeat] gagal update last_seen — cek kolom/RLS app_users:', r.error);
        window._rptLastBeat = {time:new Date(), ok:false, msg:r.error.message||'Error tidak diketahui'};
      } else if(!r || !r.data || !r.data.length){
        /* Update "berhasil" tanpa error TAPI 0 baris kena — ini penyebab paling
           sering last_seen macet padahal tidak ada error di console: filter
           .eq('id',cu.id) tidak match baris manapun (RLS row-level menyaring
           diam-diam, atau id tidak cocok). */
        console.error('[heartbeat] update tidak mengenai baris manapun (0 rows) — cek RLS UPDATE app_users / kecocokan id:', cu.id);
        window._rptLastBeat = {time:new Date(), ok:false, msg:'0 baris ter-update (kemungkinan RLS memblokir UPDATE, atau id: '+cu.id+' tidak cocok)'};
      } else {
        window._rptLastBeat = {time:new Date(), ok:true, msg:'OK'};
      }
      if(typeof _rptOnlineDiagRefresh==='function') _rptOnlineDiagRefresh();
    }).catch(function(e){
      console.error('[heartbeat] exception update last_seen:', e);
      window._rptLastBeat = {time:new Date(), ok:false, msg:e.message||'Exception'};
      if(typeof _rptOnlineDiagRefresh==='function') _rptOnlineDiagRefresh();
    });
  }
  window._rptBeatNow = _beat;
  _beat();

  _rptHeartbeatInterval = setInterval(_beat, 30000);
}

(function(){
  var _origHb = window._loginOK;
  if(typeof _origHb==='function' && !_origHb._hbPatch){
    window._loginOK=function(usr){
      _origHb.apply(this,arguments);
      setTimeout(_rptStartHeartbeat, 1000);
    };
    window._loginOK._hbPatch=true;
  }
})();

if(window.CU && window.CU.id) setTimeout(_rptStartHeartbeat, 2000);

/* Jaring pengaman tambahan: JANGAN cuma andalkan patch _loginOK di atas —
   kalau suatu saat ada jalur lain yang men-set window.CU tanpa lewat
   _loginOK (mis. restore sesi), heartbeat bisa tidak pernah mulai TANPA
   ada error apapun yang kelihatan. Watchdog ini ngecek tiap 3 detik dan
   otomatis menyalakan heartbeat begitu window.CU terdeteksi ada,
   independen dari jalur mana pun yang men-set-nya. */
if(!window._rptHbWatchdog){
  window._rptHbWatchdog = setInterval(function(){
    if(window.CU && window.CU.id && !_rptHeartbeatInterval) _rptStartHeartbeat();
  }, 3000);
}

/* Helper lokal (duplikat sengaja — helper aslinya terkurung di closure form
   pelanggan) untuk mendeteksi error "kolom/tabel belum ada" dari Postgrest,
   dipakai supaya panel Online kasih pesan jelas alih-alih diam-diam nampilkan 0. */
function _isColMissingRpt(err){
  var msg = (err && err.message)||'';
  return msg.indexOf('Could not find') !== -1 || msg.indexOf('column') !== -1 || msg.indexOf('does not exist') !== -1;
}

/* Parsing timestamp yang AMAN dari perbedaan zona waktu. Kalau kolom
   `last_seen` di Supabase bertipe `timestamp` (tanpa zona waktu) alih-alih
   `timestamptz`, nilai yang disimpan dalam UTC akan terbaca balik TANPA
   penanda 'Z'/offset — browser lalu keliru menafsirkannya sebagai waktu
   LOKAL, bukan UTC. Akibatnya selisih waktu "online" jadi meleset sebesar
   offset zona waktu (mis. 7 jam untuk WIB) dan user yang baru saja aktif
   malah dianggap sudah lama offline. Fix: kalau string tidak punya
   penanda zona waktu, anggap itu UTC dengan menambahkan 'Z'. */
function _parseUTC(s){
  if(!s) return new Date(NaN);
  var hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(s);
  return new Date(hasTz ? s : s+'Z');
}

function _rptLastSeenMigrasiCard(){
  var sql = [
    '-- Jalankan di Supabase → SQL Editor:',
    'ALTER TABLE app_users',
    '  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;'
  ].join('\n');
  var uid = 'sql-copy-rpt-lastseen-'+Date.now();
  _rptLastSqlUid = uid;
  return '<div style="padding:16px;background:var(--bg2);border-radius:14px;border:1.5px solid var(--border2)">'+
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'+
      '<div style="width:38px;height:38px;border-radius:10px;background:rgba(217,119,6,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
        '<i class="ti ti-database-off" style="font-size:18px;color:var(--yellow)"></i>'+
      '</div>'+
      '<div>'+
        '<div style="font-size:13px;font-weight:800;color:var(--text)">Kolom last_seen belum ada</div>'+
        '<div style="font-size:11px;color:var(--text3)">Tanpa kolom ini, status Online tidak bisa dihitung — jalankan SQL berikut sekali</div>'+
      '</div>'+
    '</div>'+
    '<pre id="'+uid+'" style="background:var(--bg3);border-radius:10px;padding:12px;font-size:10px;font-family:JetBrains Mono,monospace;color:var(--text2);overflow-x:auto;white-space:pre;margin:0 0 10px">'+_esc(sql)+'</pre>'+
    '<button onclick="navigator.clipboard.writeText(document.getElementById(\''+uid+'\').textContent).then(function(){toast(\'SQL disalin\',\'ok\');})" style="width:100%;padding:11px;background:var(--c1);border:none;border-radius:10px;color:#fff;font-family:Sora,sans-serif;font-size:12px;font-weight:800;cursor:pointer"><i class="ti ti-copy"></i> Salin SQL</button>'+
  '</div>';
}

function _rptOnlineDiagRefresh(){
  var el = document.getElementById('rpt-hb-diag-text');
  if(!el) return;
  var lb = window._rptLastBeat;
  var pad = function(n){return n<10?'0'+n:n;};
  if(!lb){
    el.textContent = window._rptHeartbeatInterval ? 'Menunggu detak pertama…' : 'Heartbeat belum pernah jalan sejak halaman ini dibuka';
    return;
  }
  var t = lb.time;
  var jam = pad(t.getHours())+':'+pad(t.getMinutes())+':'+pad(t.getSeconds());
  if(lb.ok){
    el.innerHTML = '<span style="color:var(--green);font-weight:700">✓ Heartbeat OK</span> · terakhir berhasil '+jam;
  } else {
    el.innerHTML = '<span style="color:var(--red);font-weight:700">✗ Heartbeat gagal</span> ('+_esc(lb.msg||'?')+') · '+jam;
  }
}

function rptOnlineLoad(){
  var list = document.getElementById('rpt-online-list');
  var cnt  = document.getElementById('rpt-online-count');
  var upd  = document.getElementById('rpt-online-lastupd');
  var hint = document.getElementById('rpt-online-sql-hint');

  if(typeof _rptOnlineDiagRefresh==='function') _rptOnlineDiagRefresh();
  if(hint) hint.style.display='none';
  if(list) list.innerHTML='<div style="text-align:center;padding:30px;color:var(--text3);font-size:12px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:20px;display:block;margin-bottom:8px;opacity:.4"></i>Memuat…</div>';

  var sb=(typeof getSB==='function')?getSB():null;
  if(!sb){ if(list) list.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">Database tidak terhubung</div>'; return; }

  var roleMap={super_admin:'Super Admin',owner:'Owner',area_manager:'Area Manager',finance:'Finance',sales:'Sales',teknisi:'Teknisi',viewer:'Viewer'};
  var roleColor={super_admin:'var(--c1)',owner:'var(--pu)',area_manager:'var(--cyan)',finance:'var(--green)',sales:'var(--c2)',teknisi:'var(--yellow)',viewer:'var(--text3)'};
  var now = new Date();
  var sc = window.SOT ? SOT.cache() : {};
  var areaNm={};(sc.areas||[]).forEach(function(a){areaNm[a.id]=a.nama||a.kode;});

  sb.from('app_users')
    .select('id,nama,username,role,area_coverage_id,is_active,last_seen')
    .eq('is_active',true)
    .order('nama',{ascending:true})
    .then(function(r){
      if(r.error){
        if(_isColMissingRpt(r.error) && /last_seen/i.test(r.error.message||'')){
          if(list) list.innerHTML = _rptLastSeenMigrasiCard();
          if(cnt) cnt.textContent='?';
          return;
        }
        if(list) list.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px">Error memuat data: '+_esc(r.error.message||'coba refresh')+'</div>';
        if(cnt) cnt.textContent='?';
        return;
      }
      if(hint) hint.style.display='none';
      var users = r.data||[];


      var online=[], recent=[], offline=[];
      users.forEach(function(u){
        if(!u.last_seen){ offline.push(u); return; }
        var ls=_parseUTC(u.last_seen);
        if(isNaN(ls.getTime())){ offline.push(u); return; }
        var diffMin=Math.floor((now-ls)/60000);
        u._diffMin=diffMin;
        if(diffMin<=5) online.push(u);
        else if(diffMin<=30) recent.push(u);
        else offline.push(u);
      });

      online.sort(function(a,b){return a._diffMin-b._diffMin;});
      recent.sort(function(a,b){return a._diffMin-b._diffMin;});

      if(cnt) cnt.textContent=online.length;
      if(upd){
        var pad=function(n){return n<10?'0'+n:n;};
        upd.textContent='Update: '+pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds());
      }

      function userCard(u, statusLabel, statusColor, statusBg, dotColor){
        var ini=(u.nama||u.username||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase();
        var aId=u.area_coverage_id||'';
        var areaNama=['super_admin','owner','finance'].indexOf(u.role)>=0?'Semua Area':(areaNm[aId]||'—');
        var diffTxt=(function(dm){
          if(dm==null) return 'Belum pernah login';
          if(dm<=0)    return 'Baru saja';
          if(dm<60)    return dm+'m lalu';
          var dh=Math.floor(dm/60);
          if(dh<24)    return dh+'j lalu';
          var dd=Math.floor(dh/24);
          if(dd<30)    return dd+' hari lalu';
          var dmo=Math.floor(dd/30);
          if(dmo<12)   return dmo+' bulan lalu';
          var dyr=Math.floor(dmo/12);
          return dyr+' tahun lalu';
        })(u._diffMin);
        var rc=roleColor[u.role]||'var(--text3)';
        var rl=roleMap[u.role]||u.role||'—';
        var isSelf=window.CU&&(window.CU.id===u.id);
        return '<div style="background:var(--bg2);border-radius:var(--r);padding:12px 14px;border:1.5px solid var(--border);display:flex;align-items:center;gap:12px">'+
          '<div style="position:relative;flex-shrink:0">'+
            '<div style="width:42px;height:42px;border-radius:12px;background:rgba(5,150,105,.1);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:var(--green)">'+_esc(ini)+'</div>'+
            '<span style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:'+dotColor+';border:2px solid var(--bg2)"></span>'+
          '</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:2px">'+_esc(u.nama||u.username||'—')+(isSelf?' <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:20px;background:rgba(5,150,105,.15);color:var(--green)">Saya</span>':'')+'</div>'+
            '<div style="font-size:10px;color:var(--text3);margin-bottom:5px">@'+_esc(u.username||'—')+'</div>'+
            '<div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">'+
              '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:'+statusBg+';color:'+statusColor+'">'+statusLabel+'</span>'+
              '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(100,100,100,.08);color:'+rc+'">'+_esc(rl)+'</span>'+
              '<span style="font-size:10px;color:var(--text3)"><i class="ti ti-map-pin" style="font-size:10px"></i> '+_esc(areaNama)+'</span>'+
              '<span style="font-size:10px;color:var(--text3);margin-left:auto"><i class="ti ti-clock" style="font-size:10px"></i> '+diffTxt+'</span>'+
            '</div>'+
          '</div>'+
        '</div>';
      }

      var html='';
      if(online.length){
        html+='<div style="font-size:10px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:.5px;padding:4px 0 8px;display:flex;align-items:center;gap:5px"><span style="width:7px;height:7px;border-radius:50%;background:var(--green);display:inline-block;animation:blink 1.5s infinite"></span> Online sekarang ('+online.length+')</div>';
        html+=online.map(function(u){return userCard(u,'● Online','#059669','rgba(5,150,105,.12)','#4ade80');}).join('');
      }
      if(recent.length){
        html+='<div style="font-size:10px;font-weight:800;color:var(--yellow);text-transform:uppercase;letter-spacing:.5px;padding:12px 0 8px;display:flex;align-items:center;gap:5px"><span style="width:7px;height:7px;border-radius:50%;background:var(--yellow);display:inline-block"></span> Aktif 5–30 menit lalu ('+recent.length+')</div>';
        html+=recent.map(function(u){return userCard(u,'◐ Idle','var(--yellow)','rgba(217,119,6,.1)','#fbbf24');}).join('');
      }
      if(offline.length){
        html+='<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding:12px 0 8px">Tidak aktif / belum login ('+offline.length+')</div>';
        html+=offline.map(function(u){return userCard(u,'○ Offline','var(--text3)','var(--bg3)','#9ca3af');}).join('');
      }
      if(!html) html='<div style="padding:40px;text-align:center;color:var(--text3)"><i class="ti ti-users-minus" style="font-size:28px;display:block;opacity:.3;margin-bottom:8px"></i>Tidak ada data user aktif</div>';
      if(list) list.innerHTML=html;
    });
}
window.rptOnlineLoad=rptOnlineLoad;

function _rptSqlMigrasiCard(){
  var sql = [
    '-- Jalankan di Supabase → SQL Editor:',
    'CREATE TABLE IF NOT EXISTS activity_log (',
    '  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,',
    '  jenis          TEXT,',
    '  keterangan     TEXT,',
    '  dilakukan_oleh TEXT,',
    '  role_aktor     TEXT,',
    '  ref_id         UUID,',
    '  tgl            DATE,',
    '  created_at     TIMESTAMPTZ DEFAULT NOW(),',
    '  data_lama      TEXT,',
    '  data_baru      TEXT',
    ');',
    'CREATE INDEX IF NOT EXISTS idx_actlog_created',
    '  ON activity_log(created_at DESC);',
    'CREATE INDEX IF NOT EXISTS idx_actlog_user',
    '  ON activity_log(dilakukan_oleh);'
  ].join('\n');
  var uid = 'sql-copy-rpt-'+Date.now();
  _rptLastSqlUid = uid;
  return '<div style="padding:16px;background:var(--bg2);border-radius:14px;border:1.5px solid var(--border2)">'+
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'+
      '<div style="width:38px;height:38px;border-radius:10px;background:rgba(217,119,6,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
        '<i class="ti ti-database-off" style="font-size:18px;color:var(--yellow)"></i>'+
      '</div>'+
      '<div>'+
        '<div style="font-size:13px;font-weight:800;color:var(--text)">Tabel activity_log belum tersedia</div>'+
        '<div style="font-size:11px;color:var(--text3)">Jalankan SQL berikut di Supabase sekali</div>'+
      '</div>'+
    '</div>'+
    '<pre id="'+uid+'" style="font-family:JetBrains Mono,monospace;font-size:10px;color:var(--text2);background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:10px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;margin-bottom:10px;line-height:1.7">'+_esc(sql)+'</pre>'+
    '<button onclick="window._rptSqlCopyLast(this)" '+
    'style="width:100%;padding:10px;background:var(--c1);color:#fff;border:none;border-radius:var(--rs);font-family:Sora,sans-serif;font-size:12px;font-weight:700;cursor:pointer;touch-action:manipulation;display:flex;align-items:center;justify-content:center;gap:6px">'+
    '<i class="ti ti-copy"></i> Salin SQL Migrasi'+
    '</button>'+
    '<div style="font-size:10px;color:var(--text3);text-align:center;margin-top:8px">Setelah SQL dijalankan, refresh halaman ini</div>'+
  '</div>';
}

function rptSesiLoad(){
  var cu = window.CU || {};
  var cr = window.CR || '—';


  var nama = cu.nama || cu.username || 'User';
  var initials = nama.trim().split(/\s+/).slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase() || '?';
  var el = function(id){ return document.getElementById(id); };
  if(el('rpt-avatar'))   el('rpt-avatar').textContent   = initials;
  if(el('rpt-nama'))     el('rpt-nama').textContent      = nama;
  if(el('rpt-username')) el('rpt-username').textContent  = '@' + (cu.username || '—');


  var roleMap = { super_admin:'Super Admin', owner:'Owner', area_manager:'Area Manager', finance:'Finance', sales:'Sales', teknisi:'Teknisi', viewer:'Viewer' };
  if(el('rpt-role')) el('rpt-role').textContent = roleMap[cr] || cr;


  var areaId = cu.area_coverage_id || cu.area_id || null;
  var areaNama = '—';
  if(areaId && typeof _areaData !== 'undefined'){
    var aObj = (_areaData||[]).find(function(a){ return a.id === areaId; });
    if(aObj) areaNama = aObj.nama || aObj.kode || '—';
  }
  if(['super_admin','owner','finance'].indexOf(cr) >= 0) areaNama = 'Semua Area';
  if(el('rpt-area')) el('rpt-area').textContent = areaNama;


  var loginD = _rptLoginTime || new Date();
  var pad = function(n){ return n < 10 ? '0'+n : n; };
  var fmt = function(d){
    return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear();
  };
  var fmtTime = function(d){
    return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  };
  if(el('rpt-login-time')) el('rpt-login-time').textContent = fmtTime(loginD);
  if(el('rpt-login-date')) el('rpt-login-date').textContent = fmt(loginD);


  if(_rptClockInterval) clearInterval(_rptClockInterval);
  function _tick(){
    var now = new Date();
    if(el('rpt-clock')) el('rpt-clock').textContent = pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds());

    var diff = Math.floor((now - loginD) / 1000);
    var h = Math.floor(diff/3600);
    var m = Math.floor((diff%3600)/60);
    var s = diff % 60;
    var dur = h > 0 ? h+'j '+pad(m)+'m '+pad(s)+'d' : (m > 0 ? m+'m '+pad(s)+'d' : s+'d');
    if(el('rpt-durasi')) el('rpt-durasi').textContent = dur;
  }
  _tick();
  _rptClockInterval = setInterval(_tick, 1000);
}

function rptLogout(){
  if(!confirm('Yakin ingin logout dari sesi ini?')) return;
  if(_rptClockInterval){ clearInterval(_rptClockInterval); _rptClockInterval = null; }
  if(typeof logout === 'function'){ logout(); return; }

  window.location.reload();
}

function rptAktLoad(){
  _rptAktPage = 1;
  var list = document.getElementById('rpt-akt-list');
  if(list) list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text3);font-size:12px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:24px;display:block;margin-bottom:8px;opacity:.4"></i>Memuat aktivitas…</div>';
  _rptAktFetchPage(1);


  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb) return;
  var sel = document.getElementById('rpt-akt-fil-user');
  if(sel && sel.options.length <= 1){
    sb.from('app_users').select('id,nama,username').eq('is_active',true).order('nama')
      .then(function(r){
        if(r.error || !r.data) return;
        r.data.forEach(function(u){
          var o = document.createElement('option');
          o.value = u.nama || u.username;
          o.textContent = (u.nama || u.username) + (u.username && u.nama ? ' (@'+u.username+')' : '');
          sel.appendChild(o);
        });
      }).catch(function(){});
  }
}

function _rptAktQuery(sb){
  var filUser  = (document.getElementById('rpt-akt-fil-user')||{}).value||'';
  var filModul = (document.getElementById('rpt-akt-fil-modul')||{}).value||'';
  var q = sb.from('activity_log').select('id,jenis,keterangan,dilakukan_oleh,role_aktor,tgl,created_at,data_lama,data_baru');
  if(filUser)  q = q.eq('dilakukan_oleh', filUser);
  if(filModul) q = q.ilike('jenis', filModul+'%');
  return q;
}

function _rptAktFetchPage(page){
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb) return;
  _rptAktPage = page;
  var offset = (page-1) * _rptAktLimit;

  var listEl = document.getElementById('rpt-akt-list');
  if(listEl) listEl.style.opacity = '.5';

  /* Query 1: hitung total record sesuai filter (head:true = tidak transfer data, hanya count) */
  var countQ = sb.from('activity_log').select('id', {count:'exact', head:true});
  var filUser  = (document.getElementById('rpt-akt-fil-user')||{}).value||'';
  var filModul = (document.getElementById('rpt-akt-fil-modul')||{}).value||'';
  if(filUser)  countQ = countQ.eq('dilakukan_oleh', filUser);
  if(filModul) countQ = countQ.ilike('jenis', filModul+'%');

  /* Query 2: ambil baris untuk halaman ini saja */
  var dataQ = _rptAktQuery(sb).order('created_at', {ascending:false}).range(offset, offset + _rptAktLimit - 1);

  Promise.all([countQ, dataQ]).then(function(results){
    var cRes = results[0], dRes = results[1];
    if(dRes.error){
      var list = document.getElementById('rpt-akt-list');
      if(list) list.innerHTML = _rptSqlMigrasiCard();
      return;
    }
    _rptAktTotal = (cRes && typeof cRes.count === 'number') ? cRes.count : (dRes.data||[]).length;
    _rptAktRender(dRes.data || [], false);
    _rptAktPagerUpdate();
    if(listEl) listEl.style.opacity = '1';
  }).catch(function(e){
    var list = document.getElementById('rpt-akt-list');
    if(list) list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--red);font-size:12px">Error: '+(e.message||'coba lagi')+'</div>';
    if(listEl) listEl.style.opacity = '1';
  });
}

function _rptAktPagerUpdate(){
  var totalPages = Math.max(1, Math.ceil(_rptAktTotal / _rptAktLimit));
  if(_rptAktPage > totalPages) _rptAktPage = totalPages;
  var info = document.getElementById('rpt-akt-pagi-info');
  if(info) info.textContent = 'Hal ' + _rptAktPage + ' / ' + totalPages + ' · ' + _rptAktTotal + ' aktivitas';
  var prevBtn = document.getElementById('rpt-akt-prev');
  var nextBtn = document.getElementById('rpt-akt-next');
  if(prevBtn) prevBtn.disabled = (_rptAktPage <= 1);
  if(nextBtn) nextBtn.disabled = (_rptAktPage >= totalPages);
  var pagi = document.getElementById('rpt-akt-pagi');
  if(pagi) pagi.style.display = _rptAktTotal > 0 ? 'flex' : 'none';
}

function rptAktPage(dir){
  var totalPages = Math.max(1, Math.ceil(_rptAktTotal / _rptAktLimit));
  var next = _rptAktPage + dir;
  if(next < 1 || next > totalPages) return;
  document.getElementById('rpt-akt-list').scrollIntoView && document.getElementById('rpt-akt-list').scrollIntoView({block:'start', behavior:'smooth'});
  _rptAktFetchPage(next);
}

function _rptAktRender(rows, append){
  var list = document.getElementById('rpt-akt-list');
  if(!list) return;

  if(!rows.length && !append){
    list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text3);font-size:12px"><i class="ti ti-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:.3"></i>Belum ada aktivitas tercatat</div>';
    return;
  }

  var aksiIcon = function(jenis){
    if(!jenis) return 'ti-circle-dot';
    if(jenis.indexOf('create')>=0||jenis.indexOf('insert')>=0) return 'ti-plus-circle';
    if(jenis.indexOf('update')>=0||jenis.indexOf('edit')>=0)   return 'ti-edit-circle';
    if(jenis.indexOf('delete')>=0||jenis.indexOf('hapus')>=0)  return 'ti-trash';
    if(jenis.indexOf('login')>=0)  return 'ti-login';
    if(jenis.indexOf('logout')>=0) return 'ti-logout';
    if(jenis.indexOf('dismantle')>=0) return 'ti-tool';
    if(jenis.indexOf('approval')>=0)  return 'ti-check-circle';
    return 'ti-circle-dot';
  };
  var aksiColor = function(jenis){
    if(!jenis) return 'var(--text3)';
    if(jenis.indexOf('create')>=0||jenis.indexOf('insert')>=0) return 'var(--green)';
    if(jenis.indexOf('update')>=0||jenis.indexOf('edit')>=0)   return 'var(--c1)';
    if(jenis.indexOf('delete')>=0||jenis.indexOf('hapus')>=0)  return 'var(--red)';
    if(jenis.indexOf('login')>=0)  return 'var(--pu)';
    if(jenis.indexOf('dismantle')>=0) return 'var(--c2)';
    return 'var(--text3)';
  };
  var fmtDT = function(s){
    if(!s) return '—';
    var d = new Date(s);
    if(isNaN(d)) return s;
    var pad = function(n){ return n<10?'0'+n:n; };
    return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes());
  };

  var html = rows.map(function(row){
    var color = aksiColor(row.jenis);
    var icon  = aksiIcon(row.jenis);
    var jenis = (row._jenisLabel || (row.jenis||'—').replace(/_/g,' '));
    return '<div style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);display:flex;align-items:flex-start;gap:10px">'+
      '<div style="width:34px;height:34px;border-radius:10px;background:'+color+'18;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
        '<i class="ti '+icon+'" style="font-size:16px;color:'+color+'"></i>'+
      '</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;text-transform:capitalize">'+_esc(jenis)+'</div>'+
        '<div style="font-size:11px;color:var(--text2);margin-bottom:4px;word-break:break-word">'+_esc(row.keterangan||'—')+'</div>'+
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+
          '<span style="font-size:10px;font-weight:700;color:'+color+';background:'+color+'15;padding:2px 8px;border-radius:20px">'+_esc(row.dilakukan_oleh||'—')+'</span>'+
          (row.role_aktor?'<span style="font-size:10px;color:var(--text3);background:var(--bg3);padding:2px 8px;border-radius:20px">'+_esc(row.role_aktor)+'</span>':'')+
          '<span style="font-size:10px;color:var(--text3);margin-left:auto">'+fmtDT(row.created_at)+'</span>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');

  if(append) list.innerHTML += html;
  else list.innerHTML = html;
}

function rptLogLoad(){
  _rptLogPage = 1;
  var list = document.getElementById('rpt-log-list');
  if(list) list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text3);font-size:12px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:24px;display:block;margin-bottom:8px;opacity:.4"></i>Memuat log…</div>';
  _rptLogFetchPage(1);


  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb) return;
  var sel = document.getElementById('rpt-log-fil-user');
  if(sel && sel.options.length <= 1){
    sb.from('app_users').select('id,nama,username').eq('is_active',true).order('nama')
      .then(function(r){
        if(r.error || !r.data) return;
        r.data.forEach(function(u){
          var o = document.createElement('option');
          o.value = u.nama || u.username;
          o.textContent = u.nama || u.username;
          sel.appendChild(o);
        });
      }).catch(function(){});
  }
}

function _rptLogQuery(sb){
  var filAksi = (document.getElementById('rpt-log-fil-aksi')||{}).value||'';
  var filUser = (document.getElementById('rpt-log-fil-user')||{}).value||'';
  var q = sb.from('activity_log').select('id,jenis,keterangan,dilakukan_oleh,role_aktor,ref_id,tgl,created_at,data_lama,data_baru');
  if(filAksi) q = q.ilike('jenis', '%'+filAksi+'%');
  if(filUser) q = q.eq('dilakukan_oleh', filUser);
  return q;
}

function _rptLogFetchPage(page){
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb) return;
  _rptLogPage = page;
  var offset = (page-1) * _rptLogLimit;

  var listEl = document.getElementById('rpt-log-list');
  if(listEl) listEl.style.opacity = '.5';

  var filAksi = (document.getElementById('rpt-log-fil-aksi')||{}).value||'';
  var filUser = (document.getElementById('rpt-log-fil-user')||{}).value||'';
  var countQ = sb.from('activity_log').select('id', {count:'exact', head:true});
  if(filAksi) countQ = countQ.ilike('jenis', '%'+filAksi+'%');
  if(filUser) countQ = countQ.eq('dilakukan_oleh', filUser);

  var dataQ = _rptLogQuery(sb).order('created_at', {ascending:false}).range(offset, offset + _rptLogLimit - 1);

  Promise.all([countQ, dataQ]).then(function(results){
    var cRes = results[0], dRes = results[1];
    if(dRes.error){
      var list = document.getElementById('rpt-log-list');
      if(list) list.innerHTML = _rptSqlMigrasiCard();
      return;
    }
    _rptLogTotal = (cRes && typeof cRes.count === 'number') ? cRes.count : (dRes.data||[]).length;
    _rptLogRender(dRes.data || [], false);
    _rptLogPagerUpdate();
    if(listEl) listEl.style.opacity = '1';
  }).catch(function(e){
    var list = document.getElementById('rpt-log-list');
    if(list) list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--red);font-size:12px">Error: '+(e.message||'coba lagi')+'</div>';
    if(listEl) listEl.style.opacity = '1';
  });
}

function _rptLogPagerUpdate(){
  var totalPages = Math.max(1, Math.ceil(_rptLogTotal / _rptLogLimit));
  if(_rptLogPage > totalPages) _rptLogPage = totalPages;
  var info = document.getElementById('rpt-log-pagi-info');
  if(info) info.textContent = 'Hal ' + _rptLogPage + ' / ' + totalPages + ' · ' + _rptLogTotal + ' log';
  var prevBtn = document.getElementById('rpt-log-prev');
  var nextBtn = document.getElementById('rpt-log-next');
  if(prevBtn) prevBtn.disabled = (_rptLogPage <= 1);
  if(nextBtn) nextBtn.disabled = (_rptLogPage >= totalPages);
  var pagi = document.getElementById('rpt-log-pagi');
  if(pagi) pagi.style.display = _rptLogTotal > 0 ? 'flex' : 'none';
}

function rptLogPage(dir){
  var totalPages = Math.max(1, Math.ceil(_rptLogTotal / _rptLogLimit));
  var next = _rptLogPage + dir;
  if(next < 1 || next > totalPages) return;
  document.getElementById('rpt-log-list').scrollIntoView && document.getElementById('rpt-log-list').scrollIntoView({block:'start', behavior:'smooth'});
  _rptLogFetchPage(next);
}

function _rptLogRender(rows, append){
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
    var modul = (row.jenis||'').split('_')[0] || '—';
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
            '<div style="font-size:12px;color:var(--text);margin-bottom:6px;word-break:break-word">'+_esc(row.keterangan||'—')+'</div>'+
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
          (row.data_lama?'<div style="font-size:10px;font-weight:700;color:var(--red);margin-bottom:3px">SEBELUM:</div><div style="font-size:10px;color:var(--text2);font-family:monospace;word-break:break-all;white-space:pre-wrap;background:var(--rg2);padding:6px 8px;border-radius:6px;margin-bottom:6px">'+_esc(row.data_lama)+'</div>':'')+
          (row.data_baru?'<div style="font-size:10px;font-weight:700;color:var(--green);margin-bottom:3px">SESUDAH:</div><div style="font-size:10px;color:var(--text2);font-family:monospace;word-break:break-all;white-space:pre-wrap;background:var(--gng2);padding:6px 8px;border-radius:6px">'+_esc(row.data_baru)+'</div>':'')+
        '</div>':'')+
    '</div>';
  }).join('');

  if(append) list.innerHTML += html;
  else list.innerHTML = html;
}

function rptSummaryLoad(){ rptSesiLoad(); }
function rptPelLoad(){}
function rptJaringanLoad(){}
function rptFinLoad(){}
function rptExportCsv(){}
function rptPelPage(){}

var _monHeatMap = null, _monHeatLayer = null;

function _monHeatColor(pct){}

function monRenderHeatmap(){}

function _monHeatRenderMap(odps, aNm){}

function _monHeatRenderGrid(odps, pelSrc, aNm){}
function _monFillCekOdcDropdown(){}

function monRenderCek(){}

function monRenderPort(){}

function monRenderRusak(){}

(function _portFilterEnhance(){
  try {
    var _origPortFillFilters = _portFillFilters;
    _portFillFilters = function(){
      _origPortFillFilters();
      var bar = document.querySelector('#p-port .olt-filter-bar');
      if(!bar) return;

      if(!document.getElementById('port-fil-olt')){
        var selOlt = document.createElement('select');
        selOlt.id='port-fil-olt'; selOlt.className='sel olt-fil-sel';
        selOlt.innerHTML='<option value="">Semua OLT</option>';
        selOlt.addEventListener('change', function(){ portRender(); });
        var sb=getSB(); if(!sb){ bar.appendChild(selOlt); return; }
        var pa=(_oltData&&_oltData.length>0)?Promise.resolve():
          sb.from('olts').select('id,kode,nama,area_id').order('kode').then(function(r){if(!r.error)_oltData=r.data||[];});
        pa.then(function(){
          var fA=(document.getElementById('port-fil-area')||{}).value||'';
          (_oltData||[]).filter(function(o){return !fA||o.area_id===fA;}).forEach(function(o){
            var opt=document.createElement('option');opt.value=o.id;opt.textContent=_esc(o.kode)+' · '+_esc(o.nama||'');selOlt.appendChild(opt);
          });
          if(bar&&!document.getElementById('port-fil-olt')) bar.appendChild(selOlt);
        }).catch(function(){});
      }

      if(!document.getElementById('port-fil-odc')){
        var selOdc = document.createElement('select');
        selOdc.id='port-fil-odc'; selOdc.className='sel olt-fil-sel';
        selOdc.innerHTML='<option value="">Semua ODC</option>';
        selOdc.addEventListener('change', function(){ portRender(); });
        var sb2=getSB(); if(!sb2){ bar.appendChild(selOdc); return; }
        var pa2=(typeof _odcData!=='undefined'&&_odcData.length>0)?Promise.resolve():
          sb2.from('odcs').select('id,kode,nama,area_id').order('kode').then(function(r){if(!r.error)_odcData=r.data||[];});
        pa2.then(function(){
          var fA=(document.getElementById('port-fil-area')||{}).value||'';
          (_odcData||[]).filter(function(o){return !fA||o.area_id===fA;}).forEach(function(o){
            var opt=document.createElement('option');opt.value=o.id;opt.textContent=_esc(o.kode)+' · '+_esc(o.nama||'');selOdc.appendChild(opt);
          });
          if(bar&&!document.getElementById('port-fil-odc')) bar.appendChild(selOdc);
        }).catch(function(){});
      }
    };
  } catch(e){ console.warn('portFilterEnhance error',e); }
})();

var GOVERNANCE = {
  tahap8:  'COMPLETE',
  tahap9:  'COMPLETE',
  tahap10: 'COMPLETE',
  tahap11: 'COMPLETE',
  tahap12: 'COMPLETE',
  tahap13: 'COMPLETE',
  tahap14: 'COMPLETE',
  tahap15: 'COMPLETE',
  tahap16: 'COMPLETE',
  tahap17: 'COMPLETE',
  tahap18: 'COMPLETE',
  tahap19: 'COMPLETE',
  tahap20: 'IN_PROGRESS',

  check: function() {

    if (this.tahap7 !== 'COMPLETE' || this.tahap8 !== 'COMPLETE') {
      this.tahap9 = 'LOCKED';
    }
    if (this.tahap9 !== 'COMPLETE') {
      this.tahap10 = 'LOCKED';
    }
    if (this.tahap10 !== 'COMPLETE') {
      this.tahap11 = 'LOCKED';
    }
    if (this.tahap11 !== 'COMPLETE') {
      this.tahap12 = 'LOCKED';
    }
    if (this.tahap12 !== 'COMPLETE') {
      this.tahap13 = 'LOCKED';
    }
    if (this.tahap13 !== 'COMPLETE') {
      this.tahap14 = 'LOCKED';
    }
    if (this.tahap14 !== 'COMPLETE') {
      this.tahap15 = 'LOCKED';
    }
    if (this.tahap15 !== 'COMPLETE') {
      this.tahap16 = 'LOCKED';
    }
    if (this.tahap16 !== 'COMPLETE') {
      this.tahap17 = 'LOCKED';
    }
    if (this.tahap17 !== 'COMPLETE') {
      this.tahap18 = 'LOCKED';
    }
    if (this.tahap18 !== 'COMPLETE') {
      this.tahap19 = 'LOCKED';
    }
    if (this.tahap19 !== 'COMPLETE') {
      this.tahap20 = 'LOCKED';
    }
    this._renderBanner();
    this._renderLabels();
  },

  _renderBanner: function() {
    var banner = document.getElementById('gov9-banner');
    if (banner) {
      banner.style.display = (this.tahap9 === 'LOCKED') ? 'flex' : 'none';
    }
  },

  _renderLabels: function() {
    var ver = document.querySelector('.sb-app-ver');
    if (ver) {
      var label = this.tahap20 === 'LOCKED'
        ? 'v2.9 · T20 🔒 LOCKED'
        : (this.tahap20 === 'COMPLETE'
            ? 'v2.9 · T20 ✅ COMPLETE'
            : 'v2.9 · T20 ▶ AKTIF');
      ver.textContent = label;
    }
  },

  requestComplete: function(tahapNum) {
    var prev = 'tahap' + (tahapNum - 1);
    if (this[prev] && this[prev] !== 'COMPLETE') {
      console.error('GOVERNANCE LOCK: Tahap ' + tahapNum + ' tidak bisa COMPLETE sebelum Tahap ' + (tahapNum-1) + ' COMPLETE.');
      return false;
    }
    this['tahap' + tahapNum] = 'COMPLETE';
    this.check();
    return true;
  }
};

setTimeout(function(){ if(typeof GOVERNANCE!=='undefined'&&GOVERNANCE.check) GOVERNANCE.check(); }, 1500);



var _fdp = {
  mode: 'day',       // 'day' | 'month' | 'year'
  viewY: 0, viewM: 0, // kalender navigasi
  selFrom: null,     // ISO string 'YYYY-MM-DD' | null
  selTo: null,
  quickMode: 'bulan', // 'hari'|'minggu'|'bulan'|'tahun'|'custom'
  rangeStep: 0       // 0=pilih from, 1=pilih to
};

(function fdpInit(){
  var now = new Date();
  _fdp.viewY = now.getFullYear();
  _fdp.viewM = now.getMonth();
})();

function _fdpPad(n){ return n < 10 ? '0'+n : ''+n; }
function _fdpIso(dt){ return dt.getFullYear()+'-'+_fdpPad(dt.getMonth()+1)+'-'+_fdpPad(dt.getDate()); }
function _fdpMonthName(m){
  return ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][m];
}

function fdpSetQuick(type){
  _fdp.quickMode = type;
  _fdp.selFrom = null;
  _fdp.selTo = null;

  // Update select
  var sel = document.getElementById('fdb-periode');
  if(sel) sel.value = type;

  // Update pills
  ['hari','minggu','bulan','tahun'].forEach(function(t){
    var btn = document.getElementById('fdp-pill-'+t);
    if(!btn) return;
    var on = t === type;
    btn.style.background = on ? 'var(--c1,#1a56db)' : '#fff';
    btn.style.borderColor = on ? 'var(--c1,#1a56db)' : 'var(--border2,rgba(26,86,219,.15))';
    btn.style.color = on ? '#fff' : 'var(--text2,#4a5878)';
  });

  // Update label on trigger btn
  var labels = {hari:'Hari Ini', minggu:'Minggu Ini', bulan:'Bulan Ini', tahun:'Tahun Ini'};
  var lbl = document.getElementById('fdp-cal-label');
  if(lbl) lbl.textContent = labels[type] || 'Pilih Tanggal…';

  // Fire load
  if(typeof fdbLoad === 'function') fdbLoad();
}

function fdpOpenCal(){
  var now = new Date();
  _fdp.viewY = now.getFullYear();
  _fdp.viewM = now.getMonth();
  _fdp.rangeStep = 0;
  _fdpSetMode('day');
  var ov = document.getElementById('fdp-overlay');
  if(ov){ ov.style.display='flex'; }
  // Reset pills
  ['hari','minggu','bulan','tahun'].forEach(function(t){
    var btn = document.getElementById('fdp-pill-'+t);
    if(btn){ btn.style.background='#fff'; btn.style.borderColor='var(--border2,rgba(26,86,219,.15))'; btn.style.color='var(--text2,#4a5878)'; }
  });
}

function fdpCloseCal(){
  var ov = document.getElementById('fdp-overlay');
  if(ov) ov.style.display='none';
}

function fdpCheckClose(e){
  if(e.target === document.getElementById('fdp-overlay')) fdpCloseCal();
}

function _fdpSetMode(mode){
  _fdp.mode = mode;
  ['day','month','year'].forEach(function(m){
    var btn = document.getElementById('fdp-mode-'+m);
    if(!btn) return;
    var on = m === mode;
    btn.style.background = on ? 'var(--c1,#1a56db)' : '#fff';
    btn.style.borderColor = on ? 'var(--c1,#1a56db)' : 'var(--border2,rgba(26,86,219,.15))';
    btn.style.color = on ? '#fff' : 'var(--text2,#4a5878)';
  });
  _fdpRender();
}
function fdpSetMode(m){ _fdpSetMode(m); }

function _fdpRender(){
  var body = document.getElementById('fdp-cal-body');
  if(!body) return;
  if(_fdp.mode === 'day')   { _fdpRenderDay(body); return; }
  if(_fdp.mode === 'month') { _fdpRenderMonth(body); return; }
  if(_fdp.mode === 'year')  { _fdpRenderYear(body); return; }
}

function _fdpRenderDay(body){
  var y = _fdp.viewY, m = _fdp.viewM;
  var now = new Date();
  var todayIso = _fdpIso(now);
  var firstDay = new Date(y, m, 1).getDay(); // 0=Sun
  var daysInMonth = new Date(y, m+1, 0).getDate();
  var prevDays = new Date(y, m, 0).getDate();

  var sub = document.getElementById('fdp-sheet-sub');
  if(sub) sub.textContent = _fdp.selFrom
    ? (_fdp.selTo ? 'Dari '+_fdp.selFrom+' s/d '+_fdp.selTo : 'Dari '+_fdp.selFrom+' — pilih tanggal akhir')
    : 'Tap untuk pilih tanggal mulai';

  var html = '';
  // Nav
  html += '<div class="fdp-nav">'
        + '<button class="fdp-nav-btn" onclick="_fdpPrevMonth()">‹</button>'
        + '<span class="fdp-nav-title">'+_fdpMonthName(m)+' '+y+'</span>'
        + '<button class="fdp-nav-btn" onclick="_fdpNextMonth()">›</button>'
        + '</div>';

  // Grid
  html += '<div class="fdp-grid">';
  var days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  days.forEach(function(d){ html += '<div class="fdp-day-hd">'+d+'</div>'; });

  // Prev month filler
  for(var i = firstDay - 1; i >= 0; i--){
    var d2 = prevDays - i;
    html += '<button class="fdp-day other-month" disabled>'+d2+'</button>';
  }
  // Days of this month
  for(var d = 1; d <= daysInMonth; d++){
    var iso = y+'-'+_fdpPad(m+1)+'-'+_fdpPad(d);
    var cls = 'fdp-day';
    if(iso === todayIso) cls += ' today';
    if(_fdp.selFrom && _fdp.selTo){
      if(iso === _fdp.selFrom) cls += ' sel range-start';
      else if(iso === _fdp.selTo) cls += ' sel range-end';
      else if(iso > _fdp.selFrom && iso < _fdp.selTo) cls += ' in-range';
    } else if(_fdp.selFrom && iso === _fdp.selFrom){
      cls += ' sel';
    }
    html += '<button class="'+cls+'" onclick="_fdpPickDay(\''+iso+'\')">'+d+'</button>';
  }
  // Next month filler to fill 6 rows
  var total = firstDay + daysInMonth;
  var trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
  for(var t = 1; t <= trailing; t++){
    html += '<button class="fdp-day other-month" disabled>'+t+'</button>';
  }
  html += '</div>';

  // Apply button (if range selected or single day)
  if(_fdp.selFrom){
    var rangeLabel = _fdp.selTo
      ? _fdp.selFrom + '  →  ' + _fdp.selTo
      : _fdp.selFrom + '  (1 hari)';
    html += '<button class="fdp-apply-btn" onclick="_fdpApply()">✓ Gunakan: '+rangeLabel+'</button>';
  }

  body.innerHTML = html;
}

function _fdpPrevMonth(){
  _fdp.viewM--;
  if(_fdp.viewM < 0){ _fdp.viewM = 11; _fdp.viewY--; }
  _fdpRender();
}
function _fdpNextMonth(){
  _fdp.viewM++;
  if(_fdp.viewM > 11){ _fdp.viewM = 0; _fdp.viewY++; }
  _fdpRender();
}

function _fdpPickDay(iso){
  if(_fdp.rangeStep === 0){
    _fdp.selFrom = iso;
    _fdp.selTo = null;
    _fdp.rangeStep = 1;
  } else {
    if(iso < _fdp.selFrom){
      _fdp.selTo = _fdp.selFrom;
      _fdp.selFrom = iso;
    } else {
      _fdp.selTo = iso;
    }
    _fdp.rangeStep = 0;
  }
  _fdpRender();
}

function _fdpRenderMonth(body){
  var now = new Date();
  var curM = now.getMonth(), curY = now.getFullYear();
  var sub = document.getElementById('fdp-sheet-sub');
  if(sub) sub.textContent = 'Tap bulan yang ingin dilihat';

  var html = '<div class="fdp-nav">'
    + '<button class="fdp-nav-btn" onclick="_fdp.viewY--;_fdpRender()">‹</button>'
    + '<span class="fdp-nav-title">'+_fdp.viewY+'</span>'
    + '<button class="fdp-nav-btn" onclick="_fdp.viewY++;_fdpRender()">›</button>'
    + '</div><div class="fdp-month-grid">';

  var names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  names.forEach(function(nm, i){
    var cls = 'fdp-month-item';
    if(_fdp.viewY === curY && i === curM) cls += ' cur';
    html += '<button class="'+cls+'" onclick="_fdpApplyMonth('+i+')">'+nm+'</button>';
  });
  html += '</div>';
  body.innerHTML = html;
}

function _fdpApplyMonth(m){
  var y = _fdp.viewY;
  var daysInM = new Date(y, m+1, 0).getDate();
  _fdp.selFrom = y+'-'+_fdpPad(m+1)+'-01';
  _fdp.selTo   = y+'-'+_fdpPad(m+1)+'-'+_fdpPad(daysInM);
  _fdpApply();
}

function _fdpRenderYear(body){
  var now = new Date();
  var curY = now.getFullYear();
  var baseY = Math.floor(_fdp.viewY / 12) * 12;

  var sub = document.getElementById('fdp-sheet-sub');
  if(sub) sub.textContent = 'Tap tahun yang ingin dilihat';

  var html = '<div class="fdp-nav">'
    + '<button class="fdp-nav-btn" onclick="_fdp.viewY-=12;_fdpRender()">‹</button>'
    + '<span class="fdp-nav-title">'+baseY+' – '+(baseY+11)+'</span>'
    + '<button class="fdp-nav-btn" onclick="_fdp.viewY+=12;_fdpRender()">›</button>'
    + '</div><div class="fdp-year-grid">';

  for(var y = baseY; y < baseY + 12; y++){
    var cls = 'fdp-year-item';
    if(y === curY) cls += ' cur';
    html += '<button class="'+cls+'" onclick="_fdpApplyYear('+y+')">'+y+'</button>';
  }
  html += '</div>';
  body.innerHTML = html;
}

function _fdpApplyYear(y){
  _fdp.selFrom = y+'-01-01';
  _fdp.selTo   = y+'-12-31';
  _fdpApply();
}

function _fdpApply(){
  if(!_fdp.selFrom) return;
  var from = _fdp.selFrom;
  var to   = _fdp.selTo || _fdp.selFrom;

  // Set hidden select to custom mode
  var sel = document.getElementById('fdb-periode');
  if(sel) sel.value = 'custom';
  _fdp.quickMode = 'custom';

  // Set custom date inputs
  var fi = document.getElementById('fdb-date-from');
  var ti = document.getElementById('fdb-date-to');
  if(fi) fi.value = from;
  if(ti) ti.value = to;

  // Update button label
  var lbl = document.getElementById('fdp-cal-label');
  if(lbl){
    if(from === to) lbl.textContent = _fdpFormatLabel(from);
    else lbl.textContent = _fdpFormatLabel(from) + ' → ' + _fdpFormatLabel(to);
  }

  // Clear quick pills
  ['hari','minggu','bulan','tahun'].forEach(function(t){
    var btn = document.getElementById('fdp-pill-'+t);
    if(btn){ btn.style.background='#fff'; btn.style.borderColor='var(--border2,rgba(26,86,219,.15))'; btn.style.color='var(--text2,#4a5878)'; }
  });

  fdpCloseCal();
  if(typeof fdbLoad === 'function') fdbLoad();
}

function _fdpFormatLabel(iso){
  if(!iso) return '';
  var parts = iso.split('-');
  var y = parts[0], m = parseInt(parts[1])-1, d = parseInt(parts[2]||1);
  if(!parts[2]) return _fdpMonthName(m)+' '+y;
  return d+' '+_fdpMonthName(m)+' '+y;
}

var _fdbPatches = {
  origPeriode   : (typeof _fdbPeriode === 'function' ? _fdbPeriode : function(){ return {from:'', to:''}; }),
  origResetMain : typeof fdbResetMainFilter === 'function' ? fdbResetMainFilter : null
};
window._fdbPeriode = _fdbPeriode = function(){
  var sel = document.getElementById('fdb-periode');
  var v = sel ? sel.value : 'bulan';
  if(v === 'custom'){
    var f = (document.getElementById('fdb-date-from')||{}).value;
    var t = (document.getElementById('fdb-date-to')||{}).value;
    if(f && t) return {from: f, to: t};
    if(f) return {from: f, to: f};
  }
  return _fdbPatches.origPeriode();
};
fdbResetMainFilter = function(){
  fdpSetQuick('bulan');
  if(_fdbPatches.origResetMain) _fdbPatches.origResetMain();
  else if(typeof fdbLoad === 'function') fdbLoad();
};



fdbBuildSimpleList=function(byArea){
  var list=document.getElementById('fdb-simple-list');if(!list)return;
  var entries=_fdbSortedEntries(byArea);
  if(!entries.length){
    list.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);font-size:12px;font-weight:600"><i class="ti ti-mood-empty" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4"></i>Belum ada data untuk periode ini</div>';
    return;
  }
  var fmt = _fmtRpShort;
  list.innerHTML=entries.map(function(d){
    var tot=(d.otf||0)+(d.rec||0),paid=(d.otfPaid||0)+(d.recPaid||0),sisa=(d.otfOs||0)+(d.recOs||0);
    var p=tot>0?Math.round(paid/tot*100):0;
    var bc=p>=100?'var(--green)':p>=50?'var(--c2)':'var(--red)';
    var sc=sisa>0?'var(--red)':'var(--green)';
    var badge=p>=100
      ?'<span style="font-size:9px;font-weight:800;background:var(--gng2,rgba(5,150,105,.1));color:var(--green);padding:2px 8px;border-radius:20px">✅ Lunas</span>'
      :'<span style="font-size:9px;font-weight:800;background:var(--rg2,rgba(220,38,38,.08));color:var(--red);padding:2px 8px;border-radius:20px">⏳ Sisa '+fmt(sisa)+'</span>';
    var _aid=d.area_id?_escAttr(d.area_id||''):'';
    return '<div class="fdb-area-card" onclick="fdbsDrillArea(\''+_escAttr(d.name||'')+'\',\''+_aid+'\')">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">'+
        '<div style="font-size:13px;font-weight:800;color:var(--text)"><i class="ti ti-map-pin" style="color:var(--c1);font-size:12px"></i> '+(d.name||'—')+'</div>'+
        '<div style="display:flex;align-items:center;gap:7px">'+
          '<span style="font-size:10px;font-weight:700;color:var(--c1);background:var(--c1b);padding:3px 8px;border-radius:20px">'+d.pel+' pel</span>'+
          '<i class="ti ti-chevron-right" style="color:var(--text3);font-size:14px"></i>'+
        '</div>'+
      '</div>'+
      '<div class="fdb-area-prog-bg"><div class="fdb-area-prog-fill" style="width:'+p+'%;background:'+bc+'"></div></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">'+
        '<div><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text3)">Total</div>'+
          '<div style="font-size:12px;font-weight:800;font-family:\'JetBrains Mono\',monospace;color:var(--text)">'+fmt(tot)+'</div></div>'+
        '<div><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--green)">Dibayar</div>'+
          '<div style="font-size:12px;font-weight:800;font-family:\'JetBrains Mono\',monospace;color:var(--green)">'+fmt(paid)+'</div></div>'+
        '<div><div style="font-size:9px;font-weight:700;text-transform:uppercase;color:'+sc+'">Sisa</div>'+
          '<div style="font-size:12px;font-weight:800;font-family:\'JetBrains Mono\',monospace;color:'+sc+'">'+fmt(sisa)+'</div></div>'+
      '</div>'+
      '<div style="margin-top:7px;font-size:9px;text-align:right">'+badge+'</div>'+
    '</div>';
  }).join('');
};

function fdbResetSimple(){

  var sel=document.getElementById('fdb-periode');if(sel)sel.value='bulan';
  var fi=document.getElementById('fdb-date-from');if(fi)fi.value='';
  var ti=document.getElementById('fdb-date-to');if(ti)ti.value='';

  var ac=document.getElementById('fdb-area-coverage');if(ac)ac.value='';
  _fdbResetSel&&_fdbResetSel('fdb-kecamatan','Semua Kecamatan');
  _fdbResetSel&&_fdbResetSel('fdb-kelurahan','Semua Kelurahan');
  _fdbResetSel&&_fdbResetSel('fdb-rw','Semua RW');
  _fdbResetSel&&_fdbResetSel('fdb-rt','Semua RT');

  var now=new Date();
  var bulanNama=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var lbl=document.getElementById('fdp-cal-label');
  if(lbl)lbl.textContent='Bulan Ini — '+bulanNama[now.getMonth()]+' '+now.getFullYear();
  var fl=document.getElementById('fdp-filter-label');if(fl)fl.textContent='';
  if(typeof fdbLoad==='function')fdbLoad();
}

function fdbExportAll(){
  var sb=getSB(); if(!sb){ toast('Koneksi belum siap','err'); return; }
  toast('Menyiapkan export…','ok');
  var per=_fdbPeriode();
  Promise.all([
    sb.from('pelanggan').select('id,cid,nama,status,kecamatan,kelurahan,rw,rt,jenis_pelanggan,paket,tgl_pasang'),
    sb.from('fee_otf').select('id,status,nominal,pel_id,tgl,keterangan'),
    sb.from('fee_recurring').select('id,status,nominal,total_recurring,pel_id,periode')
  ]).then(function(res){
    var FREE=['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
    var pels=(res[0].data||[]);
    var pelMap={};pels.forEach(function(p){pelMap[p.id]=p;});
    var otfAll=res[1].data||[];
    var recAll=res[2].data||[];
    var inPer=function(d){if(!d)return false;var s=d.slice(0,10);return s>=per.from&&s<=per.to;};
    var perFYm=per.from.slice(0,7),perTYm=per.to.slice(0,7);


    var rows=[['CID','Nama','Status','Kecamatan','Kelurahan','RW','RT','Paket','Jenis Fee','Periode/Tgl','Nominal','Status Bayar']];
    otfAll.filter(function(r){return inPer(r.tgl)&&pelMap[r.pel_id];}).forEach(function(r){
      var p=pelMap[r.pel_id];
      rows.push([
        p.cid||'',p.nama||'',p.status||'',
        p.kecamatan||'',p.kelurahan||'',p.rw||'',p.rt||'',
        p.paket||'','OTF',r.tgl||'',
        r.nominal||0,r.status||''
      ]);
    });
    recAll.filter(function(r){return pelMap[r.pel_id]&&r.periode&&r.periode>=perFYm&&r.periode<=perTYm;}).forEach(function(r){
      var p=pelMap[r.pel_id];
      rows.push([
        p.cid||'',p.nama||'',p.status||'',
        p.kecamatan||'',p.kelurahan||'',p.rw||'',p.rt||'',
        p.paket||'','Recurring',r.periode||'',
        r.nominal!=null?r.nominal:r.total_recurring||0,r.status||''
      ]);
    });


    var csv=rows.map(function(row){
      return row.map(function(cell){
        var s=String(cell).replace(/"/g,'""');
        return (s.indexOf(',')>=0||s.indexOf('"')>=0||s.indexOf('\n')>=0)?'"'+s+'"':s;
      }).join(',');
    }).join('\r\n');

    /* Download */
    var bom='\uFEFF';
    var blob=new Blob([bom+csv],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='finance_export_'+per.from+'_sd_'+per.to+'.csv';
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
    toast('Export '+rows.length+' baris berhasil','ok');
  }).catch(function(e){ toast('Gagal export: '+(e.message||e),'err'); });
}

/* ══ AREA DETAIL SHEET ══ */
function fdbsDrillArea(areaName, areaId){
  var sb=getSB();if(!sb)return;
  var per=_fdbPeriode();
  var ov=document.getElementById('fdbs-overlay');
  var ttl=document.getElementById('fdbs-title');
  var sub=document.getElementById('fdbs-subtitle');
  var body=document.getElementById('fdbs-body');
  var expBtn=document.getElementById('fdbs-export-btn');
  if(ttl)ttl.innerHTML='<i class="ti ti-map-pin" style="color:var(--c1)"></i> '+_esc(areaName);
  if(sub)sub.textContent='Memuat…';
  if(body)body.innerHTML='<div style="text-align:center;padding:30px;color:var(--c1)"><i class="ti ti-loader-2" style="font-size:28px;animation:rot 1s linear infinite"></i></div>';
  if(ov)ov.style.display='flex';
  document.body.style.overflow='hidden';
  if(expBtn)expBtn.onclick=function(){fdbsExportArea(areaName,areaId);};

  var FREE=JENIS_GRATIS||['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
  var inPer=function(d){if(!d)return false;var s=d.slice(0,10);return s>=per.from&&s<=per.to;};
  var perFYm=per.from.slice(0,7),perTYm=per.to.slice(0,7);
  var fmt=_fmtRpShort;
  /* Query filter: pakai area_id (UUID) jika ada — lebih reliable dari area_coverage string */
  var qPel=sb.from('pelanggan').select('id,cid,nama,status,kecamatan,kelurahan,rw,rt,jenis_pelanggan,paket,tgl_pasang').eq('status','aktif');
  if(areaId) qPel=qPel.eq('area_id',areaId);
  else qPel=qPel.eq('area_coverage',areaName);

  Promise.all([
    qPel,
    sb.from('fee_otf').select('id,status,nominal,pel_id,tgl,created_at'),
    sb.from('fee_recurring').select('id,status,nominal,total_recurring,pel_id,periode')
  ]).then(function(res){
    var pels=(res[0].data||[]).filter(function(p){return FREE.indexOf(p.jenis_pelanggan)===-1;});
    var otfAll=res[1].data||[],recAll=res[2].data||[];
    var pelMap={};pels.forEach(function(p){pelMap[p.id]=p;});

    /* Filter per periode */
    var otf=otfAll.filter(function(r){
      return inPer(r.tgl||r.created_at)&&pelMap[r.pel_id]
        &&(r.status==='siap_bayar'||r.status==='waiting_payment'||r.status==='paid');
    });
    var rec=recAll.filter(function(r){
      return pelMap[r.pel_id]&&r.periode&&r.periode>=perFYm&&r.periode<=perTYm;
    });

    /* Build hierarchy: kelurahan → rw → rt → pelanggan */
    var byKel={};
    pels.forEach(function(p){
      var k=p.kelurahan||'—',rw=p.rw||'—',rt=p.rt||'—';
      if(!byKel[k])byKel[k]={pel:0,otf:0,rec:0,otfPaid:0,recPaid:0,otfOs:0,recOs:0,rw:{}};
      byKel[k].pel++;
      if(!byKel[k].rw[rw])byKel[k].rw[rw]={pel:0,otf:0,rec:0,otfPaid:0,recPaid:0,otfOs:0,recOs:0,rt:{}};
      byKel[k].rw[rw].pel++;
      if(!byKel[k].rw[rw].rt[rt])byKel[k].rw[rw].rt[rt]={pel:[],otf:0,rec:0,otfPaid:0,recPaid:0,otfOs:0,recOs:0};
      byKel[k].rw[rw].rt[rt].pel.push(p);
    });

    function addFee(r,isOtf){
      var p=pelMap[r.pel_id];if(!p)return;
      var k=p.kelurahan||'—',rw=p.rw||'—',rt=p.rt||'—';
      var n=isOtf?parseFloat(r.nominal)||0:parseFloat(r.nominal!=null?r.nominal:r.total_recurring)||0;
      var ip=r.status==='paid';
      var key=isOtf?'otf':'rec';
      [byKel[k],byKel[k]&&byKel[k].rw[rw],byKel[k]&&byKel[k].rw[rw]&&byKel[k].rw[rw].rt[rt]].forEach(function(obj){
        if(!obj)return;
        obj[key]+=n;
        if(ip){obj[key+'Paid']+=n;}else{obj[key+'Os']+=n;}
      });
    }
    otf.forEach(function(r){addFee(r,true);});
    rec.forEach(function(r){addFee(r,false);});

    /* Totals area */
    var totOtf=0,totRec=0,totOtfP=0,totRecP=0,totOtfOs=0,totRecOs=0;
    pels.forEach(function(p){
      var k=p.kelurahan||'—',rw=p.rw||'—',rt=p.rt||'—';
      var rtObj=byKel[k]&&byKel[k].rw[rw]&&byKel[k].rw[rw].rt[rt];
    });
    otf.forEach(function(r){var n=parseFloat(r.nominal)||0;totOtf+=n;if(r.status==='paid')totOtfP+=n;else totOtfOs+=n;});
    rec.forEach(function(r){var n=parseFloat(r.nominal!=null?r.nominal:r.total_recurring)||0;totRec+=n;if(r.status==='paid')totRecP+=n;else totRecOs+=n;});
    var totT=totOtf+totRec,totP=totOtfP+totRecP,totS=totOtfOs+totRecOs;
    var pct=totT>0?Math.round(totP/totT*100):0;
    if(sub)sub.textContent=pels.length+' pelanggan · '+pct+'% dibayar';

    /* ── RENDER ── */
    var h='';

    /* Summary header: OTF dan Recurring TERPISAH */
    h+='<div style="background:var(--bg3);border-radius:var(--rs);padding:12px;margin-bottom:12px">'+
      '<div style="font-size:9px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:8px;letter-spacing:.5px">Ringkasan Area</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">'+
        /* OTF */
        '<div style="background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);padding:10px">'+
          '<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">'+
            '<div style="width:22px;height:22px;border-radius:6px;background:var(--c2b);display:flex;align-items:center;justify-content:center"><i class="ti ti-bolt" style="font-size:11px;color:var(--c2)"></i></div>'+
            '<div style="font-size:9px;font-weight:800;text-transform:uppercase;color:var(--text3)">OTF</div>'+
          '</div>'+
          '<div style="font-size:13px;font-weight:800;font-family:\'JetBrains Mono\',monospace;color:var(--text);margin-bottom:3px">'+fmt(totOtf)+'</div>'+
          '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700">'+
            '<span style="color:var(--green)">✓ '+fmt(totOtfP)+'</span>'+
            '<span style="color:var(--red)">Sisa '+fmt(totOtfOs)+'</span>'+
          '</div>'+
        '</div>'+
        /* Recurring */
        '<div style="background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);padding:10px">'+
          '<div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">'+
            '<div style="width:22px;height:22px;border-radius:6px;background:var(--c1b);display:flex;align-items:center;justify-content:center"><i class="ti ti-refresh" style="font-size:11px;color:var(--c1)"></i></div>'+
            '<div style="font-size:9px;font-weight:800;text-transform:uppercase;color:var(--text3)">Recurring</div>'+
          '</div>'+
          '<div style="font-size:13px;font-weight:800;font-family:\'JetBrains Mono\',monospace;color:var(--text);margin-bottom:3px">'+fmt(totRec)+'</div>'+
          '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700">'+
            '<span style="color:var(--green)">✓ '+fmt(totRecP)+'</span>'+
            '<span style="color:var(--red)">Sisa '+fmt(totRecOs)+'</span>'+
          '</div>'+
        '</div>'+
      '</div>'+
      /* Progress bar */
      '<div style="height:6px;background:rgba(0,0,0,.08);border-radius:3px;overflow:hidden;margin-bottom:4px">'+
        '<div style="height:6px;background:var(--green);border-radius:3px;width:'+pct+'%;transition:width .4s"></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700">'+
        '<span style="color:var(--text3)">Total '+fmt(totT)+'</span>'+
        '<span style="color:'+(pct>=100?'var(--green)':'var(--c2)')+'">'+pct+'% dibayar</span>'+
      '</div>'+
    '</div>';

    /* Per Kelurahan → RW → RT → Pelanggan */
    Object.keys(byKel).sort().forEach(function(kel){
      var dk=byKel[kel];
      var kelOtf=0,kelRec=0,kelOtfP=0,kelRecP=0,kelOtfOs=0,kelRecOs=0;
      Object.keys(dk.rw).forEach(function(rw){
        var dr=dk.rw[rw];
        kelOtf+=dr.otf;kelRec+=dr.rec;kelOtfP+=dr.otfPaid;kelRecP+=dr.recPaid;kelOtfOs+=dr.otfOs;kelRecOs+=dr.recOs;
      });
      var kt=kelOtf+kelRec,kp=kelOtfP+kelRecP,ks=kelOtfOs+kelRecOs,kpc=kt>0?Math.round(kp/kt*100):0;
      var kc=kpc>=100?'var(--green)':kpc>=50?'var(--c2)':'var(--red)';

      h+='<div style="background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--r);overflow:hidden;margin-bottom:8px">'+
        /* Kelurahan header — collapsed by default, klik untuk buka */
        '<div style="display:flex;align-items:center;gap:10px;padding:11px 13px;cursor:pointer;touch-action:manipulation" onclick="(function(el){var b=el.nextElementSibling;var ic=el.querySelector(\'.kc\');var open=b.style.display!==\'none\';b.style.display=open?\'none\':\'\'  ;ic.style.transform=open?\'\' :\'rotate(180deg)\';})( this)">'+
          '<div style="width:32px;height:32px;border-radius:9px;background:var(--c1b);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
            '<i class="ti ti-home-2" style="font-size:15px;color:var(--c1)"></i>'+
          '</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:13px;font-weight:800;color:var(--text)">'+kel+'</div>'+
            '<div style="font-size:10px;color:var(--text3);margin-top:1px">'+dk.pel+' pelanggan · OTF '+fmt(kelOtf)+' · Rec '+fmt(kelRec)+'</div>'+
          '</div>'+
          '<div style="text-align:right;flex-shrink:0;margin-right:6px">'+
            '<div style="font-size:12px;font-weight:800;color:'+kc+'">'+kpc+'%</div>'+
            '<div style="font-size:10px;font-weight:700;color:'+(ks>0?'var(--red)':'var(--green)')+'">'+fmt(ks>0?ks:kp)+(ks>0?' sisa':' lunas')+'</div>'+
          '</div>'+
          '<i class="ti ti-chevron-down kc" style="font-size:15px;color:var(--text3);flex-shrink:0;transition:transform .2s"></i>'+
        '</div>'+
        /* Konten kelurahan — hidden by default */
        '<div style="display:none">'+
        /* Per RW */
        '<div style="padding:0">';

      Object.keys(dk.rw).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});}).forEach(function(rw){
        var dr=dk.rw[rw];
        var rt=dr.otf+dr.rec,rp=dr.otfPaid+dr.recPaid,rs=dr.otfOs+dr.recOs,rpc=rt>0?Math.round(rp/rt*100):0;
        var rc=rpc>=100?'var(--green)':rpc>=50?'var(--c2)':'var(--red)';

        h+='<div style="border-bottom:1px solid var(--border)">'+
          /* RW header — clickable toggle */
          '<div style="display:flex;align-items:center;gap:8px;padding:9px 13px;cursor:pointer;touch-action:manipulation" onclick="(function(el){var b=el.nextElementSibling;b.style.display=b.style.display===\'none\'?\'\':\'none\';})(this)">'+
            '<div style="width:28px;height:28px;border-radius:7px;background:var(--pug);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
              '<i class="ti ti-building-community" style="font-size:13px;color:var(--pu)"></i>'+
            '</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:12px;font-weight:700;color:var(--text)">RW '+rw+' <span style="font-size:10px;font-weight:600;color:var(--text3)">('+dr.pel+' pel)</span></div>'+
              /* OTF vs Rec ringkas */
              '<div style="display:flex;gap:8px;font-size:10px;font-weight:700;margin-top:2px">'+
                '<span style="color:var(--c2)">OTF '+fmt(dr.otf)+'</span>'+
                '<span style="color:var(--text3)">·</span>'+
                '<span style="color:var(--c1)">Rec '+fmt(dr.rec)+'</span>'+
              '</div>'+
            '</div>'+
            '<div style="text-align:right;flex-shrink:0">'+
              '<div style="font-size:11px;font-weight:800;color:'+rc+'">'+rpc+'%</div>'+
              '<div style="font-size:10px;font-weight:700;color:'+(rs>0?'var(--red)':'var(--green)')+'">Sisa '+fmt(rs)+'</div>'+
            '</div>'+
          '</div>'+
          /* RT list (default hidden, toggle dari RW header) */
          '<div style="display:none;background:var(--bg3);border-top:1px solid var(--border)">';

        Object.keys(dr.rt).sort(function(a,b){return a.localeCompare(b,undefined,{numeric:true});}).forEach(function(rt){
          var drt=dr.rt[rt];
          var rtt=drt.otf+drt.rec,rtp=drt.otfPaid+drt.recPaid,rts=drt.otfOs+drt.recOs,rtpc=rtt>0?Math.round(rtp/rtt*100):0;
          var rtc=rtpc>=100?'var(--green)':rtpc>=50?'var(--c2)':'var(--red)';

          h+='<div style="border-bottom:1px solid var(--border)">'+
            /* RT header */
            '<div style="display:flex;align-items:center;gap:8px;padding:8px 13px 8px 20px;cursor:pointer;touch-action:manipulation" onclick="(function(el){var b=el.nextElementSibling;b.style.display=b.style.display===\'none\'?\'\':\'none\';})(this)">'+
              '<div style="width:24px;height:24px;border-radius:6px;background:var(--cyg);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
                '<i class="ti ti-home" style="font-size:11px;color:var(--cyan)"></i>'+
              '</div>'+
              '<div style="flex:1;min-width:0">'+
                '<div style="font-size:11px;font-weight:700;color:var(--text)">RT '+rt+' <span style="font-size:10px;font-weight:600;color:var(--text3)">('+drt.pel.length+' pel)</span></div>'+
                '<div style="display:flex;gap:6px;font-size:10px;font-weight:700;margin-top:2px">'+
                  '<span style="color:var(--c2)">OTF '+fmt(drt.otf)+'</span>'+
                  '<span style="color:var(--text3)">·</span>'+
                  '<span style="color:var(--c1)">Rec '+fmt(drt.rec)+'</span>'+
                '</div>'+
              '</div>'+
              '<div style="text-align:right;flex-shrink:0">'+
                '<div style="font-size:10px;font-weight:800;color:'+rtc+'">'+rtpc+'%</div>'+
                '<div style="font-size:9px;color:'+(rts>0?'var(--red)':'var(--green)')+'">Sisa '+fmt(rts)+'</div>'+
              '</div>'+
            '</div>'+
            /* Pelanggan list (default hidden, toggle dari RT header) */
            '<div style="display:none;background:var(--bg2)">';

          /* List pelanggan di RT ini */
          drt.pel.forEach(function(p){
            /* Cari fee OTF pelanggan ini */
            var pOtf=otf.filter(function(r){return r.pel_id===p.id;});
            var pRec=rec.filter(function(r){return r.pel_id===p.id;});
            var nomOtf=pOtf.reduce(function(s,r){return s+(parseFloat(r.nominal)||0);},0);
            var nomRec=pRec.reduce(function(s,r){return s+(parseFloat(r.nominal!=null?r.nominal:r.total_recurring)||0);},0);
            var stOtf=pOtf.length?pOtf[0].status:'—';
            var stRec=pRec.length?pRec[0].status:'—';
            var stOtfColor={paid:'var(--green)',siap_bayar:'var(--c1)',waiting_payment:'var(--c1)',menunggu_validasi:'var(--yellow)',canceled:'var(--text4)'}[stOtf]||'var(--text3)';
            var stRecColor={paid:'var(--green)',siap_bayar:'var(--c1)',menunggu_validasi:'var(--yellow)',stopped:'var(--text4)'}[stRec]||'var(--text3)';
            var ini=(p.nama||'?').split(' ').map(function(w){return w[0]||'';}).slice(0,2).join('').toUpperCase();

            h+='<div style="display:flex;align-items:center;gap:9px;padding:9px 13px 9px 20px;border-bottom:1px solid var(--border)">'+
              /* Avatar inisial */
              '<div style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--c1),var(--pu));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0;font-family:monospace">'+_esc(ini)+'</div>'+
              '<div style="flex:1;min-width:0">'+
                '<div style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(p.nama||'—')+'</div>'+
                '<div style="font-size:10px;font-family:monospace;color:var(--c1);margin-top:1px">'+_esc(p.cid||'—')+'</div>'+
                /* OTF dan Recurring status terpisah */
                '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">'+
                  (nomOtf>0?'<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px;background:var(--c2b);color:var(--c2)">⚡ OTF '+fmt(nomOtf)+'</span><span style="font-size:9px;font-weight:700;color:'+stOtfColor+';padding:2px 6px;border-radius:10px;background:var(--bg3)">'+stOtf+'</span>':'')+
                  (nomRec>0?'<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px;background:var(--c1b);color:var(--c1)">🔄 Rec '+fmt(nomRec)+'</span><span style="font-size:9px;font-weight:700;color:'+stRecColor+';padding:2px 6px;border-radius:10px;background:var(--bg3)">'+stRec+'</span>':'')+
                '</div>'+
              '</div>'+
            '</div>';
          });

          h+='</div></div>'; /* close RT pel list + RT item */
        });

        h+='</div></div>'; /* close RT container + RW item */
      });

      h+='</div></div></div>'; /* close RW container + kelurahan-content div + Kelurahan card */
    });

    if(body)body.innerHTML=h;
  }).catch(function(e){
    if(body)body.innerHTML='<div style="padding:20px;text-align:center;color:var(--red);font-size:12px">Gagal: '+_esc(e.message||String(e))+'</div>';
  });
}

function fdbsClose(){
  var ov=document.getElementById('fdbs-overlay');if(ov)ov.style.display='none';
  document.body.style.overflow='';
}

function fdbsExportArea(areaName,areaId){
  var sb=getSB();if(!sb){toast('Koneksi belum siap','err');return;}
  toast('Menyiapkan export '+areaName+'…','ok');
  var per=_fdbPeriode();
  var FREE=JENIS_GRATIS||['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
  var inPer=function(d){if(!d)return false;var s=d.slice(0,10);return s>=per.from&&s<=per.to;};
  var perFYm=per.from.slice(0,7),perTYm=per.to.slice(0,7);
  var qExp=sb.from('pelanggan').select('id,cid,nama,status,kecamatan,kelurahan,rw,rt,jenis_pelanggan,paket,tgl_pasang').eq('status','aktif');
  if(areaId) qExp=qExp.eq('area_id',areaId); else qExp=qExp.eq('area_coverage',areaName);
  Promise.all([
    qExp,
    sb.from('fee_otf').select('id,status,nominal,pel_id,tgl'),
    sb.from('fee_recurring').select('id,status,nominal,total_recurring,pel_id,periode')
  ]).then(function(res){
    var pels=(res[0].data||[]).filter(function(p){return FREE.indexOf(p.jenis_pelanggan)===-1;});
    var pelMap={};pels.forEach(function(p){pelMap[p.id]=p;});
    var rows=[['CID','Nama','Kelurahan','RW','RT','Paket','Jenis Fee','Periode/Tgl','Nominal','Status Fee','Status Pelanggan']];
    /* OTF: sertakan semua status, filter periode pakai tgl ATAU created_at sebagai fallback */
    (res[1].data||[]).filter(function(r){
      if(!pelMap[r.pel_id]) return false;
      /* Jika periode 'semua waktu' (from='') → ambil semua */
      if(!per.from) return true;
      var tglStr=r.tgl||r.created_at||'';
      return tglStr && tglStr.slice(0,10)>=per.from && tglStr.slice(0,10)<=per.to;
    }).forEach(function(r){
      var p=pelMap[r.pel_id];
      rows.push([p.cid||'',p.nama||'',p.kelurahan||'',p.rw||'',p.rt||'',p.paket||'','OTF',r.tgl||r.created_at||'',r.nominal||0,r.status||'',p.status||'']);
    });
    /* Recurring: filter periode */
    (res[2].data||[]).filter(function(r){
      if(!pelMap[r.pel_id]) return false;
      if(!per.from) return true;
      return r.periode && r.periode>=perFYm && r.periode<=perTYm;
    }).forEach(function(r){
      var p=pelMap[r.pel_id];
      rows.push([p.cid||'',p.nama||'',p.kelurahan||'',p.rw||'',p.rt||'',p.paket||'','Recurring',r.periode||'',r.nominal!=null?r.nominal:r.total_recurring||0,r.status||'',p.status||'']);
    });
    /* Pelanggan tanpa fee sama sekali — tetap masuk export agar Finance tahu */
    var pelDgFee={};
    rows.slice(1).forEach(function(r){if(r[0])pelDgFee[r[0]]=true;});
    pels.forEach(function(p){
      if(!pelDgFee[p.cid]) rows.push([p.cid||'',p.nama||'',p.kelurahan||'',p.rw||'',p.rt||'',p.paket||'','Belum Ada Fee','-',0,'-',p.status||'']);
    });
    var csv=rows.map(function(row){return row.map(function(cell){var s=String(cell).replace(/"/g,'""');return(s.indexOf(',')>=0||s.indexOf('"')>=0)?'"'+s+'"':s;}).join(',');}).join('\r\n');
    /* BOM UTF-8 agar Google Sheets Android baca encoding dengan benar */
    var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='finance_'+areaName.replace(/\s+/g,'_')+'_'+per.from+'_sd_'+per.to+'.csv';
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
    toast('Export '+areaName+' — '+rows.length+' baris','ok');
  }).catch(function(e){toast('Gagal: '+(e.message||e),'err');});
}

/* ══ FDP KALENDER — single view, centered popup ══ */
var _fdpS={vY:new Date().getFullYear(),vM:new Date().getMonth(),f:null,t:null,step:0};
function _fdpPad(n){return n<10?'0'+n:''+n;}
function _fdpIso(d){return d.getFullYear()+'-'+_fdpPad(d.getMonth()+1)+'-'+_fdpPad(d.getDate());}
function _fdpMnFull(m){return['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][m];}

function fdpOpenCal(){
  var n=new Date();_fdpS.vY=n.getFullYear();_fdpS.vM=n.getMonth();_fdpS.f=null;_fdpS.t=null;_fdpS.step=0;
  _fdpRender();
  var ov=document.getElementById('fdp-overlay');if(ov)ov.style.display='flex';
  document.body.style.overflow='hidden';
}
function fdpCloseCal(){
  var ov=document.getElementById('fdp-overlay');if(ov)ov.style.display='none';
  document.body.style.overflow='';
}
function _fdpPrevM(){_fdpS.vM--;if(_fdpS.vM<0){_fdpS.vM=11;_fdpS.vY--;}_fdpRender();}
function _fdpNextM(){_fdpS.vM++;if(_fdpS.vM>11){_fdpS.vM=0;_fdpS.vY++;}_fdpRender();}

function _fdpRender(){
  var h2=document.getElementById('fdp-cal-header-title');
  if(h2)h2.textContent=_fdpMnFull(_fdpS.vM)+' '+_fdpS.vY;
  var sub=document.getElementById('fdp-sheet-sub');
  if(sub)sub.textContent=_fdpS.f?(_fdpS.t?_fdpS.f+' → '+_fdpS.t:'Pilih tanggal akhir…'):'Pilih tanggal mulai';
  var body=document.getElementById('fdp-cal-body');if(!body)return;
  var y=_fdpS.vY,m=_fdpS.vM,todayIso=_fdpIso(new Date());
  var firstDay=new Date(y,m,1).getDay(),daysInM=new Date(y,m+1,0).getDate(),prevD=new Date(y,m,0).getDate();
  var h='<div class="fdp-grid">';
  ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].forEach(function(d){h+='<div class="fdp-day-hd">'+d+'</div>';});
  for(var i=firstDay-1;i>=0;i--)h+='<button class="fdp-day fdp-other" disabled>'+(prevD-i)+'</button>';
  for(var d=1;d<=daysInM;d++){
    var iso=y+'-'+_fdpPad(m+1)+'-'+_fdpPad(d),cls='fdp-day';
    if(iso===todayIso)cls+=' fdp-today';
    if(_fdpS.f&&_fdpS.t){
      if(iso===_fdpS.f)cls+=' fdp-sel fdp-rs';
      else if(iso===_fdpS.t)cls+=' fdp-sel fdp-re';
      else if(iso>_fdpS.f&&iso<_fdpS.t)cls+=' fdp-in-range';
    }else if(_fdpS.f&&iso===_fdpS.f)cls+=' fdp-sel';
    h+='<button class="'+cls+'" onclick="_fdpPickDay(\''+iso+'\')">'+d+'</button>';
  }
  var trail=(firstDay+daysInM)%7;if(trail)trail=7-trail;
  for(var t=1;t<=trail;t++)h+='<button class="fdp-day fdp-other" disabled>'+t+'</button>';
  h+='</div>';
  if(_fdpS.f){
    var rl=_fdpS.t?_fdpS.f+' → '+_fdpS.t:'Pilih tanggal akhir…';
    if(_fdpS.t)h+='<button class="fdp-apply" onclick="_fdpApply()">✓ Gunakan: '+rl+'</button>';
  }
  body.innerHTML=h;
}
function _fdpPickDay(iso){
  if(_fdpS.step===0){_fdpS.f=iso;_fdpS.t=null;_fdpS.step=1;}
  else{if(iso<_fdpS.f){_fdpS.t=_fdpS.f;_fdpS.f=iso;}else if(iso===_fdpS.f){_fdpS.t=iso;}else{_fdpS.t=iso;}_fdpS.step=0;}
  _fdpRender();
}
function _fdpShortcut(type){
  /* FIX: tambah handler Semua Waktu */
  if(type==='semua'){
    var sel=document.getElementById('fdb-periode');if(sel)sel.value='semua';
    var lbl=document.getElementById('fdp-cal-label');if(lbl)lbl.textContent='Semua Waktu';
    fdpCloseCal();
    if(typeof fdbLoad==='function')fdbLoad();
    return;
  }
  var n=new Date(),y=n.getFullYear(),m=n.getMonth();
  if(type==='thisMonth'){_fdpS.f=y+'-'+_fdpPad(m+1)+'-01';_fdpS.t=y+'-'+_fdpPad(m+1)+'-'+_fdpPad(new Date(y,m+1,0).getDate());_fdpS.vM=m;_fdpS.vY=y;}
  else if(type==='lastMonth'){var lm=m===0?11:m-1,ly=m===0?y-1:y;_fdpS.f=ly+'-'+_fdpPad(lm+1)+'-01';_fdpS.t=ly+'-'+_fdpPad(lm+1)+'-'+_fdpPad(new Date(ly,lm+1,0).getDate());_fdpS.vM=lm;_fdpS.vY=ly;}
  else if(type==='thisYear'){_fdpS.f=y+'-01-01';_fdpS.t=y+'-12-31';}
  _fdpS.step=0;
  _fdpApply();
}
function _fdpApply(){
  if(!_fdpS.f||!_fdpS.t)return;
  var from=_fdpS.f,to=_fdpS.t;
  var sel=document.getElementById('fdb-periode');if(sel)sel.value='custom';
  var fi=document.getElementById('fdb-date-from');if(fi)fi.value=from;
  var ti=document.getElementById('fdb-date-to');if(ti)ti.value=to;

  var lbl=document.getElementById('fdp-cal-label');
  if(lbl)lbl.textContent=from===to?from:from+' → '+to;
  var fl=document.getElementById('fdp-filter-label');if(fl)fl.textContent='';
  fdpCloseCal();
  if(typeof fdbLoad==='function')fdbLoad();
}

(function(){
  var orig=typeof _fdbPeriode==='function'?_fdbPeriode:null;
  _fdbPeriode=function(){
    var sel=document.getElementById('fdb-periode');
    var v=sel?sel.value:'bulan';
    if(v==='custom'){
      var f=(document.getElementById('fdb-date-from')||{}).value;
      var t=(document.getElementById('fdb-date-to')||{}).value;
      if(f&&t)return{from:f,to:t};
      if(f)return{from:f,to:f};
    }
    if(orig)return orig();

    var now=new Date(),y=now.getFullYear(),m=now.getMonth();
    function pad(n){return n<10?'0'+n:n;}
    function iso(dt){return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());}
    if(v==='hari'){var td=iso(now);return{from:td,to:td};}
    if(v==='minggu'){var dw=now.getDay(),mn=new Date(now);mn.setDate(now.getDate()-(dw===0?6:dw-1));var su=new Date(mn);su.setDate(mn.getDate()+6);return{from:iso(mn),to:iso(su)};}
    if(v==='semua')return{from:'2000-01-01',to:'2099-12-31',isAll:true};
    if(v==='tahun')return{from:y+'-01-01',to:y+'-12-31'};
    return{from:y+'-'+pad(m+1)+'-01',to:y+'-'+pad(m+1)+'-'+pad(new Date(y,m+1,0).getDate())};
  };

  (function(){
    var n=new Date();
    var mn=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    setTimeout(function(){
      var lbl=document.getElementById('fdp-cal-label');
      if(lbl&&lbl.textContent==='Bulan Ini')lbl.textContent='Bulan Ini — '+mn[n.getMonth()]+' '+n.getFullYear();
    },200);
  })();
})();



var _owdpTab = 'pelanggan';
var _owdpLoaded = false;
var _owdpPelAll = [];
var _owdpAudAll = [];

function _owdShow(id){ var el=document.getElementById(id); if(el) el.style.display=''; }
function _owdHide(id){ var el=document.getElementById(id); if(el) el.style.display='none'; }
function _owdSet(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; }

function owdPaneTab(tab){
  _owdpTab = tab;

  var on = 'background:var(--c1);color:#fff;';
  var off = 'background:transparent;color:var(--text2);';
  var tPel = document.getElementById('owd-tab-pelanggan');
  var tAud = document.getElementById('owd-tab-audit');
  if(tPel) tPel.style.cssText = tPel.style.cssText.replace(/background:[^;]+;color:[^;]+;/,'') + (tab==='pelanggan'?on:off);
  if(tAud) tAud.style.cssText = tAud.style.cssText.replace(/background:[^;]+;color:[^;]+;/,'') + (tab==='audit'?on:off);

  var pPel = document.getElementById('owd-pane-pelanggan');
  var pAud = document.getElementById('owd-pane-audit');
  if(pPel) pPel.style.display = tab==='pelanggan' ? 'block' : 'none';
  if(pAud) pAud.style.display = tab==='audit'     ? 'block' : 'none';
}
function owdSetTab(tab){ owdPaneTab(tab); }

function owdPaneLoad(force){
  if(!document.getElementById('p-insight')) return;
  /* Always query fresh */
  _owdpLoaded = false;

  _owdHide('owd-pane-pelanggan');
  _owdHide('owd-pane-audit');
  _owdShow('owd-loading');


  if(typeof SOT === 'undefined'){ _owdShowErr('SOT belum siap'); return; }

  var _owdRetry = 0;
  var _owdMaxRetry = 5;
  function _doLoad(){
    var sb = typeof getSB==='function' ? getSB() : null;
    if(!sb){

      if(_owdRetry < _owdMaxRetry){
        _owdRetry++;
        setTimeout(_doLoad, 800);
      } else {
        _owdShowErr('Database belum terhubung. Coba refresh halaman.');
      }
      return;
    }
    SOT.refresh(!!force, function(c){

      if((!c.areas || !c.areas.length) && _owdRetry < _owdMaxRetry){
        _owdRetry++;
        setTimeout(function(){ SOT.invalidate('general'); _doLoad(); }, 1000);
        return;
      }
      _owdHide('owd-loading');
      /* Jika areas masih kosong setelah semua retry, tampilkan pesan error */
      if(!c.areas || !c.areas.length){
        _owdShowErr('Data area tidak tersedia. Pastikan tabel areas di Supabase sudah terisi, lalu klik Refresh.');
        return;
      }
      _owdpLoaded = true;
      _owdBuildAll(c);
      owdPaneTab(_owdpTab);
    });
  }
  _doLoad();
}

function _owdBuildAll(c){
  var areas    = c.areas    || [];
  var odps     = c.odps     || [];
  var ports    = c.ports    || [];
  var pels     = c.pelanggan|| [];


  var csGlobal = SOT.customerStats();
  var naGlobal = SOT.networkActiveStats();

  /* Hitung langsung dari data pelanggan — SSOT */
  var aktifList    = pels.filter(function(p){ return p.status==='aktif'; });
  var totalAktif   = aktifList.length;            /* 912 semua aktif */
  var totalSuspend = pels.filter(function(p){ return p.status==='suspend'; }).length;
  var totalCabut   = pels.filter(function(p){ return p.status==='cabut'; }).length;

  /* Non-Aktif = suspend + cabut SAJA (fasum/tempel tetap aktif) */
  var totalNonAktif = totalSuspend + totalCabut;

  /* Breakdown aktif: berbayar Reguler, fasum, tempel */
  var fasumAktif   = aktifList.filter(function(p){ return (p.jenis_pelanggan||'').toLowerCase().indexOf('fasum') >= 0; }).length;
  var odpTempelAkt = aktifList.filter(function(p){ return p.jenis_pelanggan==='ODP_TEMPEL'; }).length;
  var odcTempelAkt = aktifList.filter(function(p){ return p.jenis_pelanggan==='ODC_TEMPEL'; }).length;
  var totalAktifSemua = naGlobal.aktif;

  /* Total terdaftar = aktif + suspend + cabut (TANPA proses) */
  var totalTerdaftar = totalAktif + totalSuspend + totalCabut;

  _owdSet('owd-pel-total', totalTerdaftar);
  _owdSet('owd-pel-aktif', csGlobal.berbayar);   /* berbayar = Reguler = 862 */
  _owdSet('owd-pel-nonaktif', totalNonAktif);    /* suspend + cabut = 0+1 = 1 */
  _owdSet('owd-bd-fasum', fasumAktif);
  _owdSet('owd-bd-odp', odpTempelAkt);
  _owdSet('owd-bd-odc', odcTempelAkt);
  _owdSet('owd-bd-total-aktif', totalAktifSemua);


  var kapGlobal  = odps.reduce(function(s,o){ return s+(parseInt(o.jumlah_port)||0); }, 0);
  var pctKapGlobal = kapGlobal ? Math.round(totalAktifSemua/kapGlobal*100) : 0;
  _owdSet('owd-pel-kap', kapGlobal);
  _owdSet('owd-pel-aktif2', totalAktifSemua);
  _owdSet('owd-pel-kap-pct', pctKapGlobal+'%');
  var _kapBar = document.getElementById('owd-pel-kap-bar');
  if(_kapBar) _kapBar.style.width = Math.min(100,pctKapGlobal)+'%';


  _owdpPelAll = areas.map(function(a){
    var naArea = SOT.networkActiveStats(a.id);
    var aktif  = naArea.aktif;
    var totalA = naArea.total;
    var pct    = totalA ? Math.round(aktif/totalA*100) : 0;
    var kapArea = odps.filter(function(o){ return o.area_id===a.id; })
      .reduce(function(s,o){ return s+(parseInt(o.jumlah_port)||0); }, 0);
    var pctKap = kapArea ? Math.round(aktif/kapArea*100) : 0;
    return { id:a.id, nama:(a.nama||a.kode||a.id), total:totalA, aktif:aktif, nonaktif:totalA-aktif, pct:pct, kap:kapArea, pctKap:pctKap };
  }).filter(function(x){ return x.total > 0; })
    .sort(function(a,b){ return b.aktif - a.aktif; });

  _owdRenderPelList(_owdpPelAll);



  var odpStats = odps.map(function(o){
    var ps = SOT.odpStats(o.id);
    return { odp:o, ps:ps, penuh: ps.free<=0 && ps.total>0 };
  });


  _owdpAudAll = areas.map(function(a){
    var aodps = odpStats.filter(function(x){ return x.odp.area_id===a.id; });
    var adaPort = aodps.filter(function(x){ return x.ps.free > 0; });
    var penuh   = aodps.filter(function(x){ return x.penuh; });
    var totPort = aodps.reduce(function(s,x){ return s+(x.ps.total||0); },0);
    var kosong  = aodps.reduce(function(s,x){ return s+(x.ps.free>0?x.ps.free:0); },0);
    return { id:a.id, nama:(a.nama||a.kode||a.id),
      totalOdp:aodps.length, adaPort:adaPort.length, penuh:penuh.length,
      totalPort:totPort, kosong:kosong };
  }).filter(function(x){ return x.totalOdp > 0; })
    .sort(function(a,b){ return b.totalOdp - a.totalOdp; });


  var gAda   = _owdpAudAll.reduce(function(s,x){ return s+x.adaPort; },0);
  var gPenuh = _owdpAudAll.reduce(function(s,x){ return s+x.penuh; },0);
  _owdSet('owd-aud-ada',   gAda);
  _owdSet('owd-aud-penuh', gPenuh);

  _owdRenderAudList(_owdpAudAll);
}

function _owdRenderPelList(data){
  var el = document.getElementById('owd-pel-list');
  if(!el) return;
  if(!data.length){
    el.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text3);font-size:12px;font-weight:600">Tidak ada data pelanggan</div>';
    return;
  }
  el.innerHTML = data.map(function(a){
    var pctColor = a.pct===100 ? '#059669' : a.pct>=80 ? '#1a56db' : '#d97706';
    var barW = Math.min(100, a.pct);
    var suspend = a.nonaktif; /* suspend+cabut = non-aktif */
    return '<div style="background:var(--bg2);border-radius:var(--r);padding:13px 14px;border:1.5px solid var(--border);box-shadow:var(--sh-sm)">'

      /* ── Baris atas: nama area + chevron ── */
      +'<div onclick="owdPelDrillOpenArea(\''+a.id+'\')" style="cursor:pointer;display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      +'<i class="ti ti-map-pin" style="color:var(--c1);font-size:15px;flex-shrink:0"></i>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:13px;font-weight:800;color:var(--text);letter-spacing:-.2px">'+_owdEsc(a.nama)+'</div>'
      +(a.kap>0?'<div style="font-size:10px;color:var(--text3);margin-top:1px">Target '+a.pctKap+'% dari '+a.kap+' port tersedia</div>':'')
      +'</div>'
      +'<i class="ti ti-chevron-right" style="color:var(--text3);font-size:15px;flex-shrink:0"></i>'
      +'</div>'

      /* ── 3 kotak statistik ── */
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'

      /* Kotak TOTAL */
      +'<div style="background:var(--bg3);border:1px solid var(--border2);border-radius:9px;padding:8px 6px;text-align:center">'
      +'<div style="font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px">📋 Total</div>'
      +'<div style="font-size:20px;font-weight:900;font-family:monospace;color:var(--text)">'+a.total+'</div>'
      +'<div style="font-size:8px;color:var(--text3);margin-top:1px">terdaftar</div>'
      +'</div>'

      /* Kotak AKTIF */
      +'<div onclick="owdPelDrillOpenArea(\''+a.id+'\')" style="cursor:pointer;background:rgba(5,150,105,.08);border:1.5px solid rgba(5,150,105,.25);border-radius:9px;padding:8px 6px;text-align:center">'
      +'<div style="font-size:8px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px">✅ Aktif</div>'
      +'<div style="font-size:20px;font-weight:900;font-family:monospace;color:var(--green)">'+a.aktif+'</div>'
      +'<div style="font-size:8px;color:var(--green);opacity:.7;margin-top:1px">'+a.pct+'% dari total</div>'
      +'</div>'

      /* Kotak NON-AKTIF */
      +(a.nonaktif>0
        ? '<div onclick="event.stopPropagation();owdPelDrillOpenAreaNonAktif(\''+a.id+'\')" style="cursor:pointer;background:rgba(220,38,38,.07);border:1.5px solid rgba(220,38,38,.25);border-radius:9px;padding:8px 6px;text-align:center">'
          +'<div style="font-size:8px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px">⚠️ Non-Aktif</div>'
          +'<div style="font-size:20px;font-weight:900;font-family:monospace;color:var(--red)">'+a.nonaktif+'</div>'
          +'<div style="font-size:8px;color:var(--red);opacity:.7;margin-top:1px">tap untuk lihat</div>'
          +'</div>'
        : '<div style="background:var(--gng2);border:1.5px solid rgba(5,150,105,.2);border-radius:9px;padding:8px 6px;text-align:center">'
          +'<div style="font-size:8px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px">🎯 Status</div>'
          +'<div style="font-size:13px;font-weight:800;color:var(--green);margin-top:4px">Semua</div>'
          +'<div style="font-size:8px;color:var(--green);opacity:.7;margin-top:1px">aktif semua</div>'
          +'</div>'
      )
      +'</div>'

      /* ── Progress bar utilisasi ── */
      +'<div style="height:5px;background:var(--bg4);border-radius:4px;overflow:hidden">'
      +'<div style="height:100%;width:'+barW+'%;background:'+pctColor+';border-radius:4px;transition:width .4s"></div>'
      +'</div>'

      +'</div>';
  }).join('');
}

function _owdRenderAudList(data){
  var el = document.getElementById('owd-aud-list');
  if(!el) return;
  if(!data.length){
    el.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text3);font-size:12px;font-weight:600"><i class="ti ti-refresh" style="font-size:24px;display:block;margin-bottom:8px;opacity:.4"></i>Belum ada data ODP.<br><span style="font-weight:400;font-size:11px">Jika data sudah ada, coba tekan tombol Refresh di atas.</span></div>';
    return;
  }
  el.innerHTML = data.map(function(a){
    var pct = a.totalPort ? Math.round((a.totalPort-a.kosong)/a.totalPort*100) : 0;
    var barColor = pct>=90?'var(--red)':pct>=70?'var(--yellow)':'var(--green)';
    return '<div onclick="owdDrillOpenArea(\''+a.id+'\')" style="cursor:pointer;background:var(--bg2);border-radius:var(--r);padding:13px 14px;border:1.5px solid var(--border);box-shadow:var(--sh-sm)">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      +'<i class="ti ti-map-pin" style="color:var(--c1);font-size:15px;flex-shrink:0"></i>'
      +'<div style="font-size:13px;font-weight:800;color:var(--text);letter-spacing:-.2px;flex:1">'+_owdEsc(a.nama)+'</div>'
      +'<div style="font-size:10px;font-weight:700;background:var(--bg3);color:var(--text2);padding:2px 8px;border-radius:20px;border:1px solid var(--border)">'+a.totalOdp+' ODP</div>'
      +'<i class="ti ti-chevron-right" style="color:var(--text3);font-size:15px"></i>'
      +'</div>'

      +'<div style="display:flex;gap:8px;margin-bottom:7px">'
      +'<div style="flex:1;background:var(--gng2);border:1px solid rgba(5,150,105,.15);border-radius:8px;padding:6px 8px;text-align:center">'
      +'<div style="font-size:9px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.8px">Ada Port</div>'
      +'<div style="font-size:16px;font-weight:800;color:var(--green)">'+a.adaPort+'</div>'
      +'<div style="font-size:9px;color:var(--green);opacity:.7">'+a.kosong+' port kosong</div>'
      +'</div>'
      +'<div style="flex:1;background:var(--rg2);border:1px solid rgba(220,38,38,.15);border-radius:8px;padding:6px 8px;text-align:center">'
      +'<div style="font-size:9px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.8px">Penuh</div>'
      +'<div style="font-size:16px;font-weight:800;color:var(--red)">'+a.penuh+'</div>'
      +'<div style="font-size:9px;color:var(--red);opacity:.7">'+pct+'% terisi</div>'
      +'</div>'
      +'</div>'

      +(a.totalPort>0?'<div style="height:5px;background:var(--bg4);border-radius:4px;overflow:hidden">'
      +'<div style="height:100%;width:'+Math.min(100,pct)+'%;background:'+barColor+';border-radius:4px;transition:width .4s"></div>'
      +'</div>':'')
      +'</div>';
  }).join('');
}

function owdPelFilter(q){
  var kw = (q||'').toLowerCase().trim();
  var fil = kw ? _owdpPelAll.filter(function(a){ return a.nama.toLowerCase().indexOf(kw)>=0; }) : _owdpPelAll;
  _owdRenderPelList(fil);
}

function owdAudFilter(q){
  var kw = (q||'').toLowerCase().trim();
  var fil = kw ? _owdpAudAll.filter(function(a){ return a.nama.toLowerCase().indexOf(kw)>=0; }) : _owdpAudAll;
  _owdRenderAudList(fil);
}

var _owdDrillMode = 'audit';
var _owdDrill = { level:null, areaId:null, odcId:null, odpId:null, areaNama:'', odcNama:'', odpNama:'', raw:[] };
var _owdPelDrill = { level:null, areaId:null, areaNama:'', kec:null, kel:null, rw:null, rt:null, raw:[] };

function owdDrillOpen(){ var ov=document.getElementById('owd-drill-overlay'); if(ov) ov.classList.add('on'); }
function owdDrillClose(){
  var ov=document.getElementById('owd-drill-overlay'); if(ov) ov.classList.remove('on');
  _owdDrill={level:null,areaId:null,odcId:null,odpId:null,areaNama:'',odcNama:'',odpNama:'',raw:[]};
  _owdPelDrill={level:null,areaId:null,areaNama:'',kec:null,kel:null,rw:null,rt:null,raw:[]};
  _owdDrillMode='audit';
}

function owdDrillBack(){
  if(_owdDrillMode==='pelanggan'){
    if(_owdPelDrill.level==='kel'){ owdPelDrillOpenArea(_owdPelDrill.areaId); }
    else if(_owdPelDrill.level==='rw'){ owdPelDrillOpenKec(_owdPelDrill.kec); }
    else if(_owdPelDrill.level==='rt'){ owdPelDrillOpenKel(_owdPelDrill.kel); }
    else if(_owdPelDrill.level==='pel'){ owdPelDrillOpenRw(_owdPelDrill.rw); }
    return;
  }
  if(_owdDrill.level==='odp'){ owdDrillOpenArea(_owdDrill.areaId); }
  else if(_owdDrill.level==='pel'){ owdDrillOpenOdc(_owdDrill.odcId); }
}

function _owdDrillBreadcrumb(){
  var bc = document.getElementById('owd-drill-breadcrumb');
  if(!bc) return;
  var parts, lvl;
  if(_owdDrillMode==='pelanggan'){
    lvl = _owdPelDrill.level;
    parts = [_owdEsc(_owdPelDrill.areaNama)];
    if(lvl==='nonaktif') parts.push('Non-Aktif');
    if(lvl==='kel'||lvl==='rw'||lvl==='rt'||lvl==='pel') parts.push('Kec. '+_owdEsc(_owdPelDrill.kec));
    if(lvl==='rw'||lvl==='rt'||lvl==='pel') parts.push(_owdEsc(_owdPelDrill.kel));
    if(lvl==='rt'||lvl==='pel') parts.push('RW '+_owdEsc(_owdPelDrill.rw));
    if(lvl==='pel') parts.push('RT '+_owdEsc(_owdPelDrill.rt));
    bc.innerHTML = parts.join(' <i class="ti ti-chevron-right" style="font-size:10px;vertical-align:middle"></i> ');
    var backBtn2 = document.getElementById('owd-drill-back');
    if(backBtn2) backBtn2.style.display = (lvl==='kec'||lvl==='nonaktif') ? 'none' : 'flex';
    return;
  }
  var parts2 = [_owdEsc(_owdDrill.areaNama)];
  if(_owdDrill.level==='odp' || _owdDrill.level==='pel') parts2.push(_owdEsc(_owdDrill.odcNama));
  if(_owdDrill.level==='pel') parts2.push(_owdEsc(_owdDrill.odpNama));
  bc.innerHTML = parts2.join(' <i class="ti ti-chevron-right" style="font-size:10px;vertical-align:middle"></i> ');
  var backBtn = document.getElementById('owd-drill-back');
  if(backBtn) backBtn.style.display = _owdDrill.level==='odc' ? 'none' : 'flex';
}

function owdDrillOpenArea(areaId){
  if(typeof SOT==='undefined') return;
  _owdDrillMode='audit';
  var c = SOT.cache();
  var area = (c.areas||[]).find(function(a){ return a.id===areaId; });
  _owdDrill.level='odc'; _owdDrill.areaId=areaId; _owdDrill.odcId=null; _owdDrill.odpId=null;
  _owdDrill.areaNama = area ? (area.nama||area.kode||area.id) : '';
  var odcs = (c.odcs||[]).filter(function(o){ return o.area_id===areaId; });
  _owdDrill.raw = odcs.map(function(o){
    var aOdps = (c.odps||[]).filter(function(x){ return x.odc_id===o.id; });
    var totPort=0, kosong=0;
    aOdps.forEach(function(x){ var ps=SOT.odpStats(x.id); totPort+=ps.total; kosong+=(ps.free>0?ps.free:0); });
    return { id:o.id, nama:(o.nama||o.kode||o.id), kode:o.kode||'', totalOdp:aOdps.length, totalPort:totPort, kosong:kosong };
  }).sort(function(a,b){ return a.nama.localeCompare(b.nama); });
  document.getElementById('owd-drill-title').textContent = 'Daftar ODC';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderDrillOdc(_owdDrill.raw);
  owdDrillOpen();
}

function _owdRenderDrillOdc(list){
  var el = document.getElementById('owd-drill-list'); if(!el) return;
  if(!list.length){ el.innerHTML='<div style="text-align:center;padding:30px 16px;color:var(--text3);font-size:12px;font-weight:600">Tidak ada ODC</div>'; return; }
  el.innerHTML = list.map(function(o){
    return '<div onclick="owdDrillOpenOdc(\''+o.id+'\')" style="cursor:pointer;background:var(--bg2);border-radius:var(--r);padding:12px 13px;border:1.5px solid var(--border);display:flex;align-items:center;gap:10px">'
      +'<i class="ti ti-box" style="color:var(--c1);font-size:16px;flex-shrink:0"></i>'
      +'<div style="flex:1">'
      +'<div style="font-size:13px;font-weight:800;color:var(--text)">'+_owdEsc(o.nama)+'</div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:1px">'+o.totalOdp+' ODP · '+o.kosong+' port kosong dari '+o.totalPort+'</div>'
      +'</div>'
      +'<i class="ti ti-chevron-right" style="color:var(--text3);font-size:15px"></i>'
      +'</div>';
  }).join('');
}

function owdDrillOpenOdc(odcId){
  if(typeof SOT==='undefined') return;
  var c = SOT.cache();
  var odc = (c.odcs||[]).find(function(x){ return x.id===odcId; });
  _owdDrill.level='odp'; _owdDrill.odcId=odcId; _owdDrill.odpId=null;
  _owdDrill.odcNama = odc ? (odc.nama||odc.kode||odc.id) : '';
  var odps = (c.odps||[]).filter(function(o){ return o.odc_id===odcId; });
  _owdDrill.raw = odps.map(function(o){
    var ps = SOT.odpStats(o.id);
    return { id:o.id, nama:(o.nama||o.kode||o.id), total:ps.total, used:ps.used, free:ps.free, penuh: ps.free<=0 && ps.total>0 };
  }).sort(function(a,b){ return a.nama.localeCompare(b.nama); });
  document.getElementById('owd-drill-title').textContent = 'Daftar ODP';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderDrillOdp(_owdDrill.raw);
  owdDrillOpen();
}

function _owdRenderDrillOdp(list){
  var el = document.getElementById('owd-drill-list'); if(!el) return;
  if(!list.length){ el.innerHTML='<div style="text-align:center;padding:30px 16px;color:var(--text3);font-size:12px;font-weight:600">Tidak ada ODP</div>'; return; }
  el.innerHTML = list.map(function(o){
    return '<div onclick="owdDrillOpenOdp(\''+o.id+'\')" style="cursor:pointer;background:var(--bg2);border-radius:var(--r);padding:12px 13px;border:1.5px solid var(--border);display:flex;align-items:center;gap:10px">'
      +'<i class="ti ti-router" style="color:var(--c1);font-size:16px;flex-shrink:0"></i>'
      +'<div style="flex:1">'
      +'<div style="font-size:13px;font-weight:800;color:var(--text)">'+_owdEsc(o.nama)+'</div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:1px">'+o.used+'/'+o.total+' terpakai'+(o.penuh?' · <span style="color:var(--red);font-weight:700">PENUH</span>':' · '+o.free+' kosong')+'</div>'
      +'</div>'
      +'<i class="ti ti-chevron-right" style="color:var(--text3);font-size:15px"></i>'
      +'</div>';
  }).join('');
}

function owdDrillOpenOdp(odpId){
  if(typeof SOT==='undefined') return;
  var c = SOT.cache();
  var odp = (c.odps||[]).find(function(x){ return x.id===odpId; });
  _owdDrill.level='pel'; _owdDrill.odpId=odpId;
  _owdDrill.odpNama = odp ? (odp.nama||odp.kode||odp.id) : '';
  var ports = (c.ports||[]).filter(function(p){ return p.odp_id===odpId; }).sort(function(a,b){ return (a.nomor_port||0)-(b.nomor_port||0); });
  var pelById = {};
  (c.pelanggan||[]).forEach(function(p){ if(p.odp_id===odpId) pelById[String(p.nomor_port)] = p; });
  _owdDrill.raw = ports.map(function(p){
    var pel = pelById[String(p.nomor_port)] || null;
    var terpakai = pel ? true : (typeof PORT_STATUS!=='undefined' ? PORT_STATUS.isUsed(p.status) : p.status!=='kosong');
    return { nomor:p.nomor_port, status:p.status, terpakai:terpakai, nama: pel?pel.nama:'', cid: pel?pel.cid:(p.cid_pelanggan||'') };
  });
  document.getElementById('owd-drill-title').textContent = 'Daftar Port & Pelanggan';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderDrillPel(_owdDrill.raw);
  owdDrillOpen();
}

function _owdRenderDrillPel(list){
  var el = document.getElementById('owd-drill-list'); if(!el) return;
  if(!list.length){ el.innerHTML='<div style="text-align:center;padding:30px 16px;color:var(--text3);font-size:12px;font-weight:600">Tidak ada data port</div>'; return; }
  el.innerHTML = list.map(function(p){
    var color = p.terpakai ? 'var(--c1)' : 'var(--green)';
    var label = p.terpakai ? (p.nama||'Terpakai') : 'Kosong';
    return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px 13px;border:1.5px solid var(--border);display:flex;align-items:center;gap:10px">'
      +'<div style="width:28px;height:28px;border-radius:8px;background:'+(p.terpakai?'var(--c1b)':'var(--gng2)')+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:'+color+';flex-shrink:0">'+(p.nomor||'-')+'</div>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:12.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_owdEsc(label)+'</div>'
      +(p.cid?'<div style="font-size:10.5px;color:var(--text3)">CID: '+_owdEsc(p.cid)+'</div>':'')
      +'</div>'
      +'<div style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;background:'+(p.terpakai?'var(--rg2)':'var(--gng2)')+';color:'+(p.terpakai?'var(--red)':'var(--green)')+'">'+(p.terpakai?'TERPAKAI':'KOSONG')+'</div>'
      +'</div>';
  }).join('');
}

function owdDrillFilter(q){
  var kw = (q||'').toLowerCase().trim();
  if(_owdDrillMode==='pelanggan'){
    var lvl = _owdPelDrill.level;
    if(lvl==='kec'||lvl==='kel'||lvl==='rw'||lvl==='rt'){
      var filP = kw ? _owdPelDrill.raw.filter(function(o){ return String(o.label||'').toLowerCase().indexOf(kw)>=0; }) : _owdPelDrill.raw;
      _owdRenderPelDrillGroup(filP);
    } else if(lvl==='pel'||lvl==='nonaktif'){
      var filP2 = kw ? _owdPelDrill.raw.filter(function(p){ return (p.nama||'').toLowerCase().indexOf(kw)>=0 || (p.cid||'').toLowerCase().indexOf(kw)>=0; }) : _owdPelDrill.raw;
      _owdRenderPelDrillPel(filP2);
    }
    return;
  }
  if(_owdDrill.level==='odc'){
    var fil = kw ? _owdDrill.raw.filter(function(o){ return o.nama.toLowerCase().indexOf(kw)>=0; }) : _owdDrill.raw;
    _owdRenderDrillOdc(fil);
  } else if(_owdDrill.level==='odp'){
    var fil2 = kw ? _owdDrill.raw.filter(function(o){ return o.nama.toLowerCase().indexOf(kw)>=0; }) : _owdDrill.raw;
    _owdRenderDrillOdp(fil2);
  } else if(_owdDrill.level==='pel'){
    var fil3 = kw ? _owdDrill.raw.filter(function(p){ return (p.nama||'').toLowerCase().indexOf(kw)>=0 || (p.cid||'').toLowerCase().indexOf(kw)>=0 || String(p.nomor||'').indexOf(kw)>=0; }) : _owdDrill.raw;
    _owdRenderDrillPel(fil3);
  }
}

function _owdPelGroupBy(list, field){
  var map = {}, order = [];
  list.forEach(function(p){
    var v = (p[field]||'').toString().trim() || '(Belum diisi)';
    if(!map[v]){ map[v]={ label:v, total:0, aktif:0 }; order.push(v); }
    map[v].total++; if(p.status==='aktif') map[v].aktif++;
  });
  return order.sort().map(function(v){ return map[v]; });
}

function owdPelDrillOpenArea(areaId){
  if(typeof SOT==='undefined') return;
  _owdDrillMode='pelanggan';
  var c = SOT.cache();
  var area = (c.areas||[]).find(function(a){ return a.id===areaId; });
  _owdPelDrill = { level:'kec', areaId:areaId, areaNama: area?(area.nama||area.kode||area.id):'', kec:null, kel:null, rw:null, rt:null, raw:[] };
  var pel = (c.pelanggan||[]).filter(function(p){ return p.area_id===areaId; });
  _owdPelDrill.raw = _owdPelGroupBy(pel, 'kecamatan');
  document.getElementById('owd-drill-title').textContent = 'Daftar Kecamatan';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderPelDrillGroup(_owdPelDrill.raw);
  owdDrillOpen();
}

/* Lompat langsung ke daftar pelanggan non-aktif di sebuah area, tanpa harus
   menyusuri kecamatan/kelurahan/RW/RT satu per satu — mempermudah pengecekan. */
function owdPelDrillOpenAreaNonAktif(areaId){
  if(typeof SOT==='undefined') return;
  _owdDrillMode='pelanggan';
  var c = SOT.cache();
  var area = (c.areas||[]).find(function(a){ return a.id===areaId; });
  _owdPelDrill = { level:'nonaktif', areaId:areaId, areaNama: area?(area.nama||area.kode||area.id):'', kec:null, kel:null, rw:null, rt:null, raw:[] };
  var pel = (c.pelanggan||[]).filter(function(p){ return p.area_id===areaId && p.status!=='aktif'; });
  _owdPelDrill.raw = pel.map(function(p){ return { id:p.id, nama:p.nama, cid:p.cid, status:p.status, paket:p.paket||'' }; })
    .sort(function(a,b){ return (a.nama||'').localeCompare(b.nama||''); });
  document.getElementById('owd-drill-title').textContent = 'Pelanggan Non-Aktif';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderPelDrillPel(_owdPelDrill.raw);
  owdDrillOpen();
}

function owdPelDrillOpenKec(kec){
  if(typeof SOT==='undefined') return;
  var c = SOT.cache();
  _owdPelDrill.level='kel'; _owdPelDrill.kec=kec; _owdPelDrill.kel=null; _owdPelDrill.rw=null; _owdPelDrill.rt=null;
  var pel = (c.pelanggan||[]).filter(function(p){ return p.area_id===_owdPelDrill.areaId && ((p.kecamatan||'').trim()||'(Belum diisi)')===kec; });
  _owdPelDrill.raw = _owdPelGroupBy(pel, 'kelurahan');
  document.getElementById('owd-drill-title').textContent = 'Daftar Kelurahan';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderPelDrillGroup(_owdPelDrill.raw);
}

function owdPelDrillOpenKel(kel){
  if(typeof SOT==='undefined') return;
  var c = SOT.cache();
  _owdPelDrill.level='rw'; _owdPelDrill.kel=kel; _owdPelDrill.rw=null; _owdPelDrill.rt=null;
  var pel = (c.pelanggan||[]).filter(function(p){
    return p.area_id===_owdPelDrill.areaId && ((p.kecamatan||'').trim()||'(Belum diisi)')===_owdPelDrill.kec && ((p.kelurahan||'').trim()||'(Belum diisi)')===kel;
  });
  _owdPelDrill.raw = _owdPelGroupBy(pel, 'rw');
  document.getElementById('owd-drill-title').textContent = 'Daftar RW';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderPelDrillGroup(_owdPelDrill.raw);
}

function owdPelDrillOpenRw(rw){
  if(typeof SOT==='undefined') return;
  var c = SOT.cache();
  _owdPelDrill.level='rt'; _owdPelDrill.rw=rw; _owdPelDrill.rt=null;
  var pel = (c.pelanggan||[]).filter(function(p){
    return p.area_id===_owdPelDrill.areaId && ((p.kecamatan||'').trim()||'(Belum diisi)')===_owdPelDrill.kec
      && ((p.kelurahan||'').trim()||'(Belum diisi)')===_owdPelDrill.kel && ((p.rw||'').trim()||'(Belum diisi)')===rw;
  });
  _owdPelDrill.raw = _owdPelGroupBy(pel, 'rt');
  document.getElementById('owd-drill-title').textContent = 'Daftar RT';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderPelDrillGroup(_owdPelDrill.raw);
}

function owdPelDrillOpenRt(rt){
  if(typeof SOT==='undefined') return;
  var c = SOT.cache();
  _owdPelDrill.level='pel'; _owdPelDrill.rt=rt;
  var pel = (c.pelanggan||[]).filter(function(p){
    return p.area_id===_owdPelDrill.areaId && ((p.kecamatan||'').trim()||'(Belum diisi)')===_owdPelDrill.kec
      && ((p.kelurahan||'').trim()||'(Belum diisi)')===_owdPelDrill.kel && ((p.rw||'').trim()||'(Belum diisi)')===_owdPelDrill.rw
      && ((p.rt||'').trim()||'(Belum diisi)')===rt;
  });
  _owdPelDrill.raw = pel.map(function(p){ return { id:p.id, nama:p.nama, cid:p.cid, status:p.status, paket:p.paket||'' }; })
    .sort(function(a,b){ return (a.nama||'').localeCompare(b.nama||''); });
  document.getElementById('owd-drill-title').textContent = 'Daftar Pelanggan';
  var s = document.getElementById('owd-drill-search'); if(s) s.value='';
  _owdDrillBreadcrumb();
  _owdRenderPelDrillPel(_owdPelDrill.raw);
}

function _owdRenderPelDrillGroup(list){
  var el = document.getElementById('owd-drill-list'); if(!el) return;
  if(!list.length){ el.innerHTML='<div style="text-align:center;padding:30px 16px;color:var(--text3);font-size:12px;font-weight:600">Tidak ada data</div>'; return; }
  var lvl = _owdPelDrill.level;
  var nextFn = lvl==='kec' ? 'owdPelDrillOpenKec' : lvl==='kel' ? 'owdPelDrillOpenKel' : lvl==='rw' ? 'owdPelDrillOpenRw' : 'owdPelDrillOpenRt';
  var icon = lvl==='kec' ? 'ti-map-2' : lvl==='kel' ? 'ti-building-community' : lvl==='rw' ? 'ti-grid-dots' : 'ti-home';
  var prefix = lvl==='rw' ? 'RW ' : lvl==='rt' ? 'RT ' : '';
  el.innerHTML = list.map(function(g){
    var pct = g.total ? Math.round(g.aktif/g.total*100) : 0;
    return '<div onclick="'+nextFn+'(\''+_owdEsc(g.label).replace(/'/g,"\\'")+'\')" style="cursor:pointer;background:var(--bg2);border-radius:var(--r);padding:12px 13px;border:1.5px solid var(--border);display:flex;align-items:center;gap:10px">'
      +'<i class="ti '+icon+'" style="color:var(--c1);font-size:16px;flex-shrink:0"></i>'
      +'<div style="flex:1">'
      +'<div style="font-size:13px;font-weight:800;color:var(--text)">'+prefix+_owdEsc(g.label)+'</div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:1px">'+g.total+' pelanggan · '+g.aktif+' aktif ('+pct+'%)</div>'
      +'</div>'
      +'<i class="ti ti-chevron-right" style="color:var(--text3);font-size:15px"></i>'
      +'</div>';
  }).join('');
}

/* Render daftar pelanggan final (level RT) */
function _owdRenderPelDrillPel(list){
  var el = document.getElementById('owd-drill-list'); if(!el) return;
  if(!list.length){ el.innerHTML='<div style="text-align:center;padding:30px 16px;color:var(--text3);font-size:12px;font-weight:600">Tidak ada pelanggan</div>'; return; }
  el.innerHTML = list.map(function(p){
    var aktif = p.status==='aktif';
    return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px 13px;border:1.5px solid var(--border);display:flex;align-items:center;gap:10px">'
      +'<i class="ti ti-user" style="color:var(--c1);font-size:16px;flex-shrink:0"></i>'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:12.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_owdEsc(p.nama)+'</div>'
      +'<div style="font-size:10.5px;color:var(--text3)">CID: '+_owdEsc(p.cid||'-')+(p.paket?' · '+_owdEsc(p.paket):'')+'</div>'
      +'</div>'
      +'<div style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;background:'+(aktif?'var(--gng2)':'var(--rg2)')+';color:'+(aktif?'var(--green)':'var(--red)')+'">'+_owdEsc((p.status||'').toUpperCase())+'</div>'
      +'</div>';
  }).join('');
}

/* ── Error state ── */
function _owdShowErr(msg){
  _owdHide('owd-loading');
  var el = document.getElementById('owd-content');
  if(el) el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--red);font-size:12px;font-weight:600">'+_owdEsc(msg)+'</div>';
}

/* ── Escape helper ── */
function _owdEsc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _escAud(s){ return _owdEsc(s); }

/* ── Stub-safe alias untuk referensi lama ── */
function renderOwner(a,b,c){ owdPaneLoad(); }
function owdBuildPelanggan(a,b,c){ owdPaneLoad(); }
function owdBuildAudit(d){ owdPaneLoad(); }
function _owdAudRender(){ owdPaneLoad(); }
function _owdAudToggle(id){}
function v6Filter(){ owdPelFilter(document.getElementById('owd-pel-search')&&document.getElementById('owd-pel-search').value||''); }
function v6Toggle(id){}
function v6OpenRw(){}
function v6CloseRw(){}
function v6DrawerFilter(){}
function v6EnsureDrawer(){}
window.owdpFilterArea    = v6Filter;
window.owdToggleKel      = v6Toggle;
window.owdOpenRwDetail   = v6OpenRw;
window.owdCloseRwDetail  = v6CloseRw;
window.owdRwSearchFilter = v6DrawerFilter;
window._injectRwDrawer   = v6EnsureDrawer;
window.renderOwner       = renderOwner;
window.owdBuildPelanggan = owdBuildPelanggan;



(function(){
  function isDesktop(){ return window.innerWidth >= 1200; }
  function syncDesktopUI(){
    try{
      var dev = document.getElementById('ww-device');
      if(dev) dev.textContent = isDesktop() ? 'Desktop Browser' : 'Mobile Browser';
    }catch(e){}
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', syncDesktopUI);
  } else {
    syncDesktopUI();
  }
  window.addEventListener('resize', syncDesktopUI);
})();



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



(function(){
'use strict';

function _sotPortStatsForOdp(odpId){
  var ports = (window.SOT && SOT.cache().ports) ? SOT.cache().ports : [];
  var odpp  = ports.filter(function(p){ return String(p.odp_id) === String(odpId); });
  var used    = odpp.filter(function(p){ return PORT_STATUS.isUsed(p.status);    }).length;
  var free    = odpp.filter(function(p){ return PORT_STATUS.isFree(p.status);    }).length;
  var damaged = odpp.filter(function(p){ return PORT_STATUS.isDamaged(p.status); }).length;
  var total   = odpp.length;

  return { total:total, used:used, free:free, damaged:damaged,
           pct: total ? Math.round(used/total*100) : 0 };
}

function _sotOdpPenuhForArea(odps, odpId_optional){
  var ports = (window.SOT && SOT.cache().ports) ? SOT.cache().ports : [];
  if(!ports.length) return null;


  var portsByOdp = {};
  ports.forEach(function(p){
    var k = String(p.odp_id);
    if(!portsByOdp[k]) portsByOdp[k] = { used:0, free:0, damaged:0, total:0 };
    portsByOdp[k].total++;
    if(PORT_STATUS.isUsed(p.status))    portsByOdp[k].used++;
    if(PORT_STATUS.isFree(p.status))    portsByOdp[k].free++;
    if(PORT_STATUS.isDamaged(p.status)) portsByOdp[k].damaged++;
  });

  var penuh = 0;
  odps.forEach(function(o){
    var ps = portsByOdp[String(o.id)];
    if(!ps) return;
    if(ps.total > 0 && ps.free <= 0) penuh++;
  });
  return penuh;
}

window.monSimpleBuildRingkasan = function(){}

})();


(function(){
'use strict';

var _origNormalizeRoleP2 = window.normalizeRole;
window.normalizeRole = function(role){
  if(!role) return 'viewer';
  var r = String(role).toLowerCase().trim();
  var _legacyMap = {
    'coverage_admin':'area_manager','rw_admin':'area_manager',
    'regional_admin':'area_manager','rt_admin':'area_manager',
    'admin_wilayah':'area_manager','area_admin':'area_manager'
  };
  if(_legacyMap[r]) return _legacyMap[r];
  if(typeof _origNormalizeRoleP2==='function') return _origNormalizeRoleP2(role);
  return r || 'viewer';
};
window._getUserAreaScope = function(){
  if(!window.CU) return null;
  var aId = window.CU.area_coverage_id || window.CU.area_id || null;
  if(!aId) return null;

  return { area_coverage_id: aId };
};

var _origSfinRender = window.sfinRender;
window.sfinRender = function(){

  var tab = typeof _salesTabFin !== 'undefined' ? _salesTabFin : 'area';


  if(tab !== 'area'){
    if(typeof _origSfinRender === 'function') _origSfinRender();
    return;
  }


  var agg = {};
  function getNamaArea(pel){
    if(!pel) return null;
    var ar = (typeof _areaData !== 'undefined' ? _areaData : [])
             .find(function(a){ return a.id === pel.area_id; });

    return ar ? ar.nama : (pel.area_id ? '(area-id:'+pel.area_id.slice(0,8)+')' : 'Tanpa Area');
  }

  var otfData = typeof _sfinOtfData !== 'undefined' ? _sfinOtfData : [];
  var recData = typeof _sfinRecData !== 'undefined' ? _sfinRecData : [];
  var pelMap  = typeof _sfinPelMap  !== 'undefined' ? _sfinPelMap  : {};

  otfData.forEach(function(o){
    var pel = pelMap[o.pel_id]; if(!pel) return;
    var k = getNamaArea(pel); if(!k) return;
    if(!agg[k]) agg[k] = { k:k, otf:0, rec:0, paid:0, os:0 };
    agg[k].otf += (o.nominal||0);
    if(o.status==='waiting_payment'||o.status==='siap_bayar') agg[k].os += (o.nominal||0);
    if(o.status==='paid') agg[k].paid += (o.nominal||0);
  });

  recData.forEach(function(r){
    var recVal = r.total_nominal || r.nominal || 0;
    if(r.pel_id){
      var pel = pelMap[r.pel_id]; if(!pel) return;
      var k = getNamaArea(pel); if(!k) return;
      if(!agg[k]) agg[k] = { k:k, otf:0, rec:0, paid:0, os:0 };
      agg[k].rec += recVal;
      if(r.status==='paid') agg[k].paid += recVal;
    } else {

      var ar = (typeof _areaData !== 'undefined' ? _areaData : [])
               .find(function(a){ return a.id === r.area_id; });
      var k2 = ar ? ar.nama : 'Tanpa Area';
      if(!agg[k2]) agg[k2] = { k:k2, otf:0, rec:0, paid:0, os:0 };
      agg[k2].rec += recVal;
      if(r.status==='paid') agg[k2].paid += recVal;
    }
  });

  var arr  = Object.values(agg).sort(function(a,b){ return (b.otf+b.rec)-(a.otf+a.rec); });
  var tOtf = arr.reduce(function(s,x){ return s+x.otf; }, 0);
  var tRec = arr.reduce(function(s,x){ return s+x.rec; }, 0);
  var tOs  = arr.reduce(function(s,x){ return s+x.os;  }, 0);
  var tPaid= arr.reduce(function(s,x){ return s+x.paid;}, 0);

  var fmtRp = typeof _fmtRp === 'function' ? _fmtRp : function(n){ return 'Rp '+Number(n||0).toLocaleString('id-ID'); };
  var dSet  = function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
  dSet('sfin-otf-total', fmtRp(tOtf));
  dSet('sfin-rec-total', fmtRp(tRec));
  dSet('sfin-paid-total',fmtRp(tPaid));
  dSet('sfin-os-total',  fmtRp(tOs));

  var tbody = document.getElementById('sfin-tbody'); if(!tbody) return;
  if(!arr.length){ tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:16px">Tidak ada data</td></tr>'; return; }
  var esc2 = typeof _esc === 'function' ? _esc : function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  tbody.innerHTML = arr.map(function(x){
    return '<tr>'+
      '<td style="font-size:11px;font-weight:600;color:var(--text)">'+esc2(x.k)+'</td>'+
      '<td style="color:var(--c2);font-weight:700;text-align:right;font-size:10px">'+fmtRp(x.otf)+'</td>'+
      '<td style="color:var(--c1);font-weight:700;text-align:right;font-size:10px">'+fmtRp(x.rec)+'</td>'+
      '<td style="color:var(--green);font-weight:700;text-align:right;font-size:10px">'+fmtRp(x.paid)+'</td>'+
      '<td style="color:var(--red);font-weight:700;text-align:right;font-size:10px">'+fmtRp(x.os)+'</td>'+
    '</tr>';
  }).join('');
};

var _origRptJaringanLoad = window.rptJaringanLoad;
window.rptJaringanLoad = function(){

  if(window.SOT && typeof SOT.cache === 'function'){
    var c = SOT.cache();
    if(c && c.ports && c.ports.length){
      if(typeof _origRptJaringanLoad==='function') _origRptJaringanLoad.apply(this,arguments);
    } else {
      SOT.refresh(false, function(){
        if(typeof _origRptJaringanLoad==='function') _origRptJaringanLoad.apply(this,arguments);
      });
    }
  } else {
    if(typeof _origRptJaringanLoad==='function') _origRptJaringanLoad.apply(this,arguments);
  }
};
if(window.SOT && typeof SOT.onUpdate==='function'){
  SOT.onUpdate(function(evt){
    if(evt==='invalidate' || evt==='refresh'){

      if(typeof window._rptLoaded   !== 'undefined') window._rptLoaded   = false;
      if(typeof window._rptPelFil   !== 'undefined') window._rptPelFil   = [];

      if(typeof window._sfinOtfData !== 'undefined') window._sfinOtfData = [];
      if(typeof window._sfinRecData !== 'undefined') window._sfinRecData = [];
      if(typeof window._sfinPelMap  !== 'undefined') window._sfinPelMap  = {};
      if(typeof window._sfinPaidData!== 'undefined') window._sfinPaidData= [];
    }
  });
}

var _LEGACY_ROLES_DB = ['coverage_admin','rw_admin','regional_admin','rt_admin','admin_wilayah','area_admin'];

var _origUrLoad = window.urLoad;
window.urLoad = function(){
  if(typeof _origUrLoad === 'function') _origUrLoad.apply(this, arguments);


  setTimeout(function(){
    var sb = (typeof getSB==='function') ? getSB() : null;
    if(!sb) return;


    sb.from('app_users')
      .select('id,username,role')
      .in('role', _LEGACY_ROLES_DB)
      .limit(10)
      .then(function(r){
        if(r.error || !r.data || !r.data.length) return;

        var count = r.data.length;
        var names = r.data.map(function(u){ return u.username; }).join(', ');


        var pane = document.getElementById('p-userrole');
        if(!pane) return;

        var existing = document.getElementById('p2-legacy-role-banner');
        if(existing) existing.remove();

        var banner = document.createElement('div');
        banner.id  = 'p2-legacy-role-banner';
        banner.style.cssText = 'margin:0 0 10px;background:rgba(220,38,38,.08);border:1.5px solid rgba(220,38,38,.25);border-radius:12px;padding:12px 14px';
        banner.innerHTML =
          '<div style="display:flex;align-items:flex-start;gap:10px">'
          +'<i class="ti ti-alert-triangle" style="font-size:18px;color:var(--red);flex-shrink:0;margin-top:1px"></i>'
          +'<div>'
          +'<div style="font-size:12px;font-weight:800;color:var(--red);margin-bottom:4px">⚠ '+count+' User Masih Pakai Role Lama</div>'
          +'<div style="font-size:11px;color:var(--text2);line-height:1.6;margin-bottom:8px">'
          +'User: <b>'+names+'</b><br>'
          +'Role lama (<code>coverage_admin, rw_admin, regional_admin</code>) harus dimigrasi ke <code>area_manager</code>.'
          +'</div>'
          +'<button onclick="p2MigrateLegacyRoles()" style="padding:7px 14px;background:var(--red);border:none;border-radius:8px;font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:#fff;cursor:pointer;touch-action:manipulation">'
          +'<i class="ti ti-database-cog"></i> Migrasi Sekarang'
          +'</button>'
          +'</div></div>';


        var firstCard = pane.querySelector('.card, .olt-stat-strip, .olt-toolbar');
        if(firstCard) pane.insertBefore(banner, firstCard);
        else pane.appendChild(banner);
      }).catch(function(){});
  }, 800);
};

window.p2MigrateLegacyRoles = function(){
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(typeof toast==='function') toast('Database tidak terhubung','err'); return; }

  if(!confirm('Migrasi semua role lama (coverage_admin, rw_admin, regional_admin, rt_admin, admin_wilayah) → area_manager?\n\nTindakan ini tidak dapat dibatalkan.')) return;

  var btn = document.querySelector('#p2-legacy-role-banner button');
  if(btn){ btn.disabled=true; btn.innerHTML='<span style="animation:rot .6s linear infinite;display:inline-block">↻</span> Memproses…'; }

  sb.from('app_users')
    .update({ role: 'area_manager' })
    .in('role', _LEGACY_ROLES_DB)
    .then(function(r){
      if(r.error){
        if(typeof toast==='function') toast('Gagal migrasi: '+(r.error.message||''),'err');
        if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-database-cog"></i> Migrasi Sekarang'; }
        return;
      }
      if(typeof toast==='function') toast('Migrasi role berhasil! Memuat ulang data…','ok');
      var banner = document.getElementById('p2-legacy-role-banner');
      if(banner) banner.remove();

      if(typeof window._urLoaded !== 'undefined') window._urLoaded = false;
      if(typeof urLoad === 'function') setTimeout(urLoad, 400);
    }).catch(function(e){
      if(typeof toast==='function') toast('Error: '+(e&&e.message||'coba lagi'),'err');
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-database-cog"></i> Migrasi Sekarang'; }
    });
};

var _origGetMigrationSQL = window.SOT_getMigrationSQL;
window.SOT_getMigrationSQL = window.SOT_getRoleMigrationSQL = function(){
  var baseSql = typeof _origGetMigrationSQL==='function' ? _origGetMigrationSQL() : '';

  var p2Sql = [
    '',
    '-- ============================================================',
    '-- BLOK P2: Role legacy migration (SOT v23 Priority 2 Patch)',
    '-- Hapus: coverage_admin, rw_admin, regional_admin, rt_admin, admin_wilayah',
    '-- ============================================================',
    "UPDATE app_users SET role = 'area_manager'",
    "  WHERE role IN ('coverage_admin','rw_admin','regional_admin','rt_admin','admin_wilayah','area_admin');",
    '',
    '-- Verifikasi: harus mengembalikan 0 baris',
    "SELECT id, username, role FROM app_users",
    "  WHERE role IN ('coverage_admin','rw_admin','regional_admin','rt_admin','admin_wilayah','area_admin');",
    '',
    '-- ============================================================',
    '-- BLOK P2b: Hapus area_coverage (string) dari tabel pelanggan',
    '--           Jalankan setelah semua modul pakai area_id UUID',
    '-- ============================================================',
    '-- ALTER TABLE pelanggan DROP COLUMN IF EXISTS area_coverage;',
    '',
    '-- ============================================================',
    '-- BLOK P2c: Hapus port_used dari tabel odps dan odcs',
    '--           Jalankan setelah verifikasi SOT portStats akurat',
    '-- ============================================================',
    '-- ALTER TABLE odps DROP COLUMN IF EXISTS port_used;',
    '-- ALTER TABLE odcs DROP COLUMN IF EXISTS port_used;',
    '',
    '-- ============================================================',
    '-- BLOK P2d: Hapus kelurahan_id, kecamatan_id, rw, rt dari app_users',
    '--           Kolom ini tidak dipakai dalam SSOT governance',
    '-- ============================================================',
    '-- ALTER TABLE app_users DROP COLUMN IF EXISTS kecamatan_id;',
    '-- ALTER TABLE app_users DROP COLUMN IF EXISTS kelurahan_id;',
    '-- Pertahankan rw,rt hanya jika masih dipakai untuk data historis'
  ].join('\n');

  var combined = baseSql + '\n' + p2Sql;

  return combined;
};

})();


(function(){
'use strict';

(function(){


  var _matiAliasAlreadySetup = false;

  function _setupMaterialAlias(){
    if(_matiAliasAlreadySetup) return;

    if(typeof window._invMatiData === 'undefined' || typeof window._matiData === 'undefined') return;

    _matiAliasAlreadySetup = true;


    var master = (window._invMatiData && window._invMatiData.length) ? '_invMatiData'
               : (window._matiData    && window._matiData.length)    ? '_matiData'
               : '_invMatiData';


    if(master === '_invMatiData' && window._matiData && window._matiData.length){
      window._invMatiData = window._matiData.slice();
    } else if(master === '_matiData' && window._invMatiData && window._invMatiData.length){
      window._matiData = window._invMatiData.slice();
    }


    var _descMati = Object.getOwnPropertyDescriptor(window, '_matiData');
    if (!_descMati || typeof _descMati.get !== 'function') {
      try {
        Object.defineProperty(window, '_matiData', {
          get: function(){ return window._invMatiData; },
          set: function(v){ window._invMatiData = v; },
          configurable: true
        });
      } catch(e) {

        window._matiData = window._invMatiData;
      }
    } else {
      window._invMatiData = window._invMatiData || window._matiData || [];
    }


    var _descMatiL = Object.getOwnPropertyDescriptor(window, '_matiLoaded');
    if (!_descMatiL || typeof _descMatiL.get !== 'function') {
      try {
        Object.defineProperty(window, '_matiLoaded', {
          get: function(){ return window._invMatiLoaded; },
          set: function(v){ window._invMatiLoaded = v; },
          configurable: true
        });
      } catch(e) {
        window._matiLoaded = window._invMatiLoaded;
      }
    }


  }


  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _setupMaterialAlias);
  } else {

    setTimeout(_setupMaterialAlias, 200);
  }


  window.matiLoad = function(){
    var _origLoad = typeof _origMatiLoad === 'function' ? _origMatiLoad : null;
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if(!sb){ if(_origLoad) _origLoad(); return; }

    var list = document.getElementById('mati-list');
    if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';

    sb.from('material_items').select('*').order('kode')
      .then(function(r){
        if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><p>Gagal: '+(r.error.message||'')+'</p></div>'; return; }

        window._invMatiData = r.data || [];
        window._invMatiLoaded = true;

        if(typeof _invFillItemDropdowns === 'function') _invFillItemDropdowns();
        if(typeof _matiFillItemDropdowns === 'function') _matiFillItemDropdowns();
        if(typeof _matiUpdateStats === 'function') _matiUpdateStats();
        if(typeof matiRender === 'function') matiRender();
        if(typeof invMatiRender === 'function') invMatiRender();
        if(typeof invStokRender === 'function') invStokRender();
        if(typeof invUpdateDashboard === 'function') invUpdateDashboard();
      }).catch(function(e){
        if(list) list.innerHTML='<div class="olt-empty"><p>Error: '+(e.message||'')+'</p></div>';
      });
  };


  var _origInvMatiLoad = window.invMatiLoad;
  window.invMatiLoad = function(){
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if(!sb){ if(typeof _origInvMatiLoad === 'function') _origInvMatiLoad(); return; }

    var list = document.getElementById('inv-mati-list');
    if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';

    sb.from('material_items').select('*').order('kode')
      .then(function(r){
        if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><p>Gagal: '+(r.error.message||'')+'</p></div>'; return; }

        window._invMatiData = r.data || [];
        window._invMatiLoaded = true;
        if(typeof _invFillItemDropdowns === 'function') _invFillItemDropdowns();
        if(typeof _invFillPelFormDropdowns === 'function') _invFillPelFormDropdowns();
        if(typeof _matiFillItemDropdowns === 'function') _matiFillItemDropdowns();
        if(typeof _matiUpdateStats === 'function') _matiUpdateStats();
        if(typeof invMatiRender === 'function') invMatiRender();
        if(typeof invStokRender === 'function') invStokRender();
        if(typeof invUpdateDashboard === 'function') invUpdateDashboard();
      }).catch(function(e){
        if(list) list.innerHTML='<div class="olt-empty"><p>Error: '+(e.message||'')+'</p></div>';
      });
  };
})();



window._fdbFillAreaCoverageFilter = function(){
  _fdbFillAreaFilter_SSOT();
};

function _fdbFillAreaFilter_SSOT(){

  var sel = document.getElementById('fdb-area-coverage') ||
            document.getElementById('fdb-area-id');
  if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">Semua Area</option>';
  var areas = typeof _areaData !== 'undefined' ? _areaData : [];
  areas.forEach(function(a){
    var o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.nama || a.kode;
    if(a.id === cur) o.selected = true;
    sel.appendChild(o);
  });
}

var _origFdbLoad = window.fdbLoad;

window.fdbOnAreaChange = function(){

  ['fdb-kecamatan','fdb-kelurahan','fdb-rw','fdb-rt'].forEach(function(id){
    var el = document.getElementById(id);
    if(el && el.parentElement) el.parentElement.style.display = 'none';
  });
  fdbLoad();
};

window.fdbOnKecamatanChange = function(){ fdbLoad(); };
window.fdbOnKelurahanChange = function(){ fdbLoad(); };
window.fdbOnRwChange        = function(){ fdbLoad(); };

window._pelFillAreaCovFilter = function(){
  var sel = document.getElementById('pel-fil-area');
  if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">Semua Area</option>';
  var areas = typeof _areaData !== 'undefined' ? _areaData : [];
  areas.forEach(function(a){
    var o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.nama || a.kode;
    if(a.id === cur) o.selected = true;
    sel.appendChild(o);
  });
};

if(window.SOT && typeof SOT.onUpdate === 'function'){
  SOT.onUpdate(function(evt){
    if(evt === 'invalidate' || evt === 'refresh'){

      if(typeof window._invMatiData !== 'undefined'){
        window._invMatiData = [];
        window._invMatiLoaded = false;
      }

      window._fdbWilayahCache = null;
    }
  });
}

(function(){

  function _hideWilayahNav(){
    var role = typeof normalizeRole === 'function' ? normalizeRole(window.CR) : (window.CR||'viewer');
    var btn = document.getElementById('btn-wilayah');

    if(role === 'super_admin' || role === 'owner'){

      if(btn) btn.style.display = '';
      return;
    }


    ['nav-wilayah','sb-item-wilayah','p-wilayah-nav','btn-wilayah'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.display = 'none';
    });
  }
  window._hideWilayahNav = _hideWilayahNav;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(_hideWilayahNav, 500); });
  } else {
    setTimeout(_hideWilayahNav, 500);
  }
})();

})();



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
