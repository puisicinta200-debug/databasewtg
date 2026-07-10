
(function(){
'use strict';

window.DMT_FLOW = [
  { key:'selesai', label:'Selesai', ico:'ti-circle-check', color:'var(--green)' }
];

window.dmtUpdateStats = function(){
  var d = window._dmtData || [];
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  e('dmt-stat-total',   d.length);
  e('dmt-stat-open',    0);
  e('dmt-stat-proses',  0);
  e('dmt-stat-selesai', d.length);


  var now   = new Date();
  var mon   = now.getFullYear()+'-'+(String(now.getMonth()+1).padStart(2,'0'));
  var blnIni= d.filter(function(x){
    return (x.tgl_cabut||x.tgl_selesai||x.created_at||'').slice(0,7)===mon;
  }).length;
  e('dmt-bln-ini',      blnIni);
  e('dmt-mat-kembali',  d.filter(function(x){return x.ont_kembali;}).length);
  e('dmt-ont-hilang',   d.filter(function(x){return !x.ont_kembali&&x.ont_item_id;}).length);
  e('dmt-port-released',d.filter(function(x){return x.odp_id||x.nomor_port;}).length);
};

window.dmtUpdateCtxStats = function(){
  var src = window._dmtSelArea
    ? (window._dmtData||[]).filter(function(x){return x.area_id===window._dmtSelArea;})
    : (window._dmtData||[]);
  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  e('dmt-ctx-total',   src.length);
  e('dmt-ctx-open',    0);
  e('dmt-ctx-proses',  0);
  e('dmt-ctx-selesai', src.length);
};

window.dmtBuildAreaChips = function(){
  var chips = document.getElementById('dmt-area-chips'); if(!chips) return;
  var agg = {};
  (window._dmtData||[]).forEach(function(x){
    var ar = (window._areaData||[]).find(function(a){return a.id===x.area_id;});
    var key = x.area_id||'';
    var nm  = ar ? ar.nama : (x.area_coverage||'Tanpa Area');
    if(!agg[key]) agg[key]={id:key,nama:nm,total:0};
    agg[key].total++;
  });
  var arr = Object.values(agg).sort(function(a,b){return b.total-a.total;});
  chips.innerHTML='';
  var allChip=document.createElement('button');
  allChip.className='tkt-chip'+((window._dmtSelArea||'')==='')?' on':'';
  allChip.style.cssText='white-space:nowrap;flex-shrink:0;font-size:11px;padding:6px 12px';
  allChip.innerHTML='Semua <span style="font-weight:800;color:var(--red)">'+(window._dmtData||[]).length+'</span>';
  allChip.onclick=function(){ window.dmtSelectArea(''); };
  chips.appendChild(allChip);
  arr.forEach(function(a){
    var chip=document.createElement('button');
    chip.className='tkt-chip'+((window._dmtSelArea===a.id)?' on':'');
    chip.style.cssText='white-space:nowrap;flex-shrink:0;font-size:11px;padding:6px 12px';
    chip.dataset.areaId=a.id;
    chip.innerHTML='<span style="font-weight:700">'+a.nama+'</span> <span style="background:var(--gng);color:var(--green);border-radius:10px;padding:1px 5px;font-size:9px;font-weight:800">'+a.total+'</span>';
    chip.onclick=(function(aid){ return function(){ window.dmtSelectArea(aid); }; })(a.id);
    chips.appendChild(chip);
  });
  window.dmtUpdateCtxStats();
};

window.dmtOpenDet = function(id){
  var x=(window._dmtData||[]).find(function(d){return d.id===id;}); if(!x) return;
  window._dmtDetId=id;

  var el_title=document.getElementById('dmt-det-title');
  if(el_title) el_title.textContent='Dismantle · '+(x.cid_pelanggan||x.id.slice(0,8));

  var alasanLbl=(window.DMT_ALASAN||{})[x.alasan]||x.alasan||'—';
  var ar=(window._areaData||[]).find(function(a){return a.id===x.area_id;});
  var arNm=ar?ar.nama:(x.area_coverage||'—');

  var dr = _drRow;
  var sec = _secRow;

  var aktorInfo='';
  if(x.dilakukan_oleh||x.role_aktor){
    aktorInfo='<div style="background:var(--c1b);border:1px solid rgba(26,86,219,.18);border-radius:var(--rs);padding:10px 13px;margin-bottom:12px;display:flex;align-items:center;gap:9px">'+
      '<div style="width:32px;height:32px;border-radius:9px;background:var(--c1);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-user-check" style="color:#fff;font-size:15px"></i></div>'+
      '<div>'+
        '<div style="font-size:10px;font-weight:700;color:var(--c1);text-transform:uppercase;letter-spacing:.5px">Dilakukan Oleh</div>'+
        '<div style="font-size:13px;font-weight:700;color:var(--text)">'+(typeof _esc==='function'?_esc(x.dilakukan_oleh||'—'):x.dilakukan_oleh||'—')+'</div>'+
        '<div style="font-size:10px;color:var(--text3)">'+(typeof _esc==='function'?_esc(x.role_aktor||''):x.role_aktor||'')+'</div>'+
      '</div>'+
    '</div>';
  }

  var body=document.getElementById('dmt-det-body');
  if(body) body.innerHTML=
    aktorInfo+
    sec('circle-check','Status: Selesai')+
    dr('Pelanggan','<strong>'+((typeof _esc==='function'?_esc(x.nama_pelanggan||'—'):x.nama_pelanggan||'—'))+'</strong> <span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--pu)">'+(typeof _esc==='function'?_esc(x.cid_pelanggan||''):x.cid_pelanggan||'')+'</span>')+
    dr('Status','<span class="tag tg"><i class="ti ti-circle-check"></i> Selesai</span>')+
    dr('Tgl Cabut',(typeof _esc==='function'?_esc(x.tgl_cabut||'—'):x.tgl_cabut||'—'))+
    dr('Tgl Selesai',(typeof _esc==='function'?_esc(x.tgl_selesai||x.tgl_cabut||'—'):x.tgl_selesai||x.tgl_cabut||'—'))+
    dr('Alasan','<span class="tag tgr">'+(typeof _esc==='function'?_esc(alasanLbl):alasanLbl)+'</span>')+
    dr('Area',(typeof _esc==='function'?_esc(arNm):arNm))+
    (x.kecamatan?dr('Kecamatan',(typeof _esc==='function'?_esc(x.kecamatan):x.kecamatan)):'')+
    (x.kelurahan?dr('Kelurahan',(typeof _esc==='function'?_esc(x.kelurahan):x.kelurahan)):'')+
    (x.catatan?dr('Catatan',(typeof _esc==='function'?_esc(x.catatan):x.catatan)):'')+
    sec('user-cog','Penugasan')+
    dr('Teknisi',(typeof _esc==='function'?_esc(x.teknisi||'—'):x.teknisi||'—'))+
    sec('package-import','Recovery Material')+
    dr('ONT',x.ont_kembali
      ? '<span class="tag tg"><i class="ti ti-check"></i> Kembali</span>'+(x.sn_ont?' <span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--text3)">'+(typeof _esc==='function'?_esc(x.sn_ont):x.sn_ont)+'</span>':'')
      : '<span class="tag tr"><i class="ti ti-x"></i> Hilang</span>'+(x.sn_ont?' SN: '+(typeof _esc==='function'?_esc(x.sn_ont):x.sn_ont):''))+
    dr('Precon/Kabel',x.precon_kembali
      ? '<span class="tag tg"><i class="ti ti-check"></i> Kembali</span>'+(x.panjang_kabel?' '+x.panjang_kabel+' roll':'')
      : '<span class="tag tr"><i class="ti ti-x"></i> Hilang</span>')+
    dr('Adapter',x.adapter_kembali
      ? '<span class="tag tg"><i class="ti ti-check"></i> Kembali</span>'
      : '<span class="tag tr"><i class="ti ti-x"></i> Hilang</span>')+
    dr('Dibuat',x.created_at ? new Date(x.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—');

  var foot=document.getElementById('dmt-det-foot');
  var isAdmin = (typeof CR !== 'undefined') && (CR === 'super_admin' || CR === 'owner');
  if(foot) foot.innerHTML=
    '<button class="btn btn-ghost" style="flex:1" onclick="dmtCloseDet()">Tutup</button>'+
    (isAdmin
      ? '<button class="btn" style="flex:1;background:var(--red);color:#fff;gap:6px" onclick="dmtHapusSatu(\''+id+'\')">'
        + '<i class="ti ti-trash"></i> Hapus</button>'
      : '');

  var overlay=document.getElementById('dmt-det-overlay');
  if(overlay) overlay.classList.add('on');
};

window.dmtSave = function(){
  var pelId  = (document.getElementById('dmtf-pel-id')||{}).value||'';
  var tgl    = (document.getElementById('dmtf-tgl')||{}).value||'';
  var alasan = (document.getElementById('dmtf-alasan')||{}).value||'';

  if(!pelId){
    if(typeof toast==='function') toast('Pilih pelanggan terlebih dahulu','err');
    return;
  }
  if(!tgl){
    if(typeof toast==='function') toast('Isi tanggal cabut','err');
    return;
  }
  if(!alasan){
    if(typeof toast==='function') toast('Pilih alasan cabut','err');
    return;
  }

  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){
    if(typeof toast==='function') toast('Database tidak terhubung','err');
    return;
  }

  var pel = (window._dmtPelData||[]).find(function(x){ return x.id===pelId; });


  var odcId = null;
  if(pel){
    odcId = pel._odc_id || pel.odc_id || null;
    if(!odcId && pel.odp_id && window.SOT){
      var c2 = SOT.cache();
      var odpObj = (c2.odps||[]).find(function(o){return o.id===pel.odp_id;});
      if(odpObj && odpObj.odc_id) odcId = odpObj.odc_id;
    }
  }

  var aktorNama = (window.CU && (CU.nama||CU.username||CU.name)) || 'Unknown';
  var aktorRole = window.CR || 'unknown';
  var today     = new Date().toISOString().slice(0,10);
  var teknisi   = (document.getElementById('dmtf-teknisi')||{}).value ||
                  (document.getElementById('dmtf-teknisi-ro-val')||{}).textContent || null;
  if(teknisi === '—' || teknisi === '') teknisi = null;

  var ctx = {
    ont_kembali      : (document.getElementById('dmtf-ont-kembali')||{}).value === 'ya',
    ont_kondisi      : (document.getElementById('dmtf-ont-kembali')||{}).value || 'ya',
    sn_ont           : ((document.getElementById('dmtf-sn-ont')||{}).value||'').trim()||null,
    precon_kembali   : (document.getElementById('dmtf-precon-kembali')||{}).value === 'ya',
    panjang_kabel    : parseFloat((document.getElementById('dmtf-panjang-kabel')||{}).value)||0,
    adapter_kembali  : (document.getElementById('dmtf-adapter-kembali')||{}).value === 'ya',
    adapter_item_id  : ((document.getElementById('dmtf-adapter-item-id')||{}).value||null),
    fastconn_kembali : (document.getElementById('dmtf-fastconn-kembali')||{}).value === 'ya',
    fastconn_item_id : ((document.getElementById('dmtf-fastconn-item-id')||{}).value||null),
    fastconn_qty     : parseInt((document.getElementById('dmtf-fastconn-qty')||{}).value)||2,
    dropcore_kembali : (document.getElementById('dmtf-dropcore-kembali')||{}).value === 'ya',
    dropcore_item_id : ((document.getElementById('dmtf-dropcore-item-id')||{}).value||null),
    dropcore_qty     : parseInt((document.getElementById('dmtf-dropcore-qty')||{}).value)||1,
    splitter_kembali : (document.getElementById('dmtf-splitter-kembali')||{}).value === 'ya',
    splitter_item_id : ((document.getElementById('dmtf-splitter-item-id')||{}).value||null),
    lain_kembali     : !!(document.getElementById('dmtf-lain-item-id') &&
                          (document.getElementById('dmtf-lain-item-id')||{}).value),
    lain_item_id     : ((document.getElementById('dmtf-lain-item-id')||{}).value||null),
    lain_qty         : parseInt((document.getElementById('dmtf-lain-qty')||{}).value)||1,
    lain_ket         : ((document.getElementById('dmtf-lain-ket')||{}).value||'').trim()||null,
    teknisi          : teknisi
  };

  var areaName = null;
  if(pel && pel.area_id){
    var ar = (window._areaData||[]).find(function(a){return a.id===pel.area_id;});
    areaName = ar ? (ar.nama||null) : null;
  }

  var payload = {
    pel_id         : pelId,
    cid_pelanggan  : pel ? (pel.cid||null)  : null,
    nama_pelanggan : pel ? (pel.nama||null) : null,
    area_id        : pel ? (pel.area_id||null) : null,
    area_coverage  : areaName,
    odc_id         : odcId,
    odp_id         : pel ? (pel.odp_id||null) : null,
    nomor_port     : pel ? (pel.nomor_port||null) : null,
    tgl_cabut      : tgl,
    tgl_selesai    : today,
    alasan         : alasan,
    catatan        : ((document.getElementById('dmtf-catatan')||{}).value||'').trim()||null,
    teknisi        : teknisi,
    ont_kembali    : ctx.ont_kembali,
    sn_ont         : ctx.sn_ont,
    precon_kembali : ctx.precon_kembali,
    panjang_kabel  : ctx.panjang_kabel||null,
    adapter_kembali: ctx.adapter_kembali,
    ont_item_id    : pel ? (pel.ont_item_id||null) : null,
    kabel_item_id  : pel ? (pel.kabel_item_id||null) : null,
    status         : 'selesai',
    dilakukan_oleh : aktorNama,
    role_aktor     : aktorRole
  };

  var btn = document.getElementById('dmtf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span> Memproses…'; }


  function _runAfterInsert(insertedId){
    ctx.dismantle_id = insertedId;
    var sideOps = [];


    if(pel && pel.id){
      sideOps.push(
        sb.from('pelanggan')
          .update({status:'cabut', sn_ont:null, nomor_port:null, odp_id:null})
          .eq('id', pel.id)
          .then(undefined, function(){
            return sb.from('pelanggan').update({status:'cabut'}).eq('id', pel.id);
          })
      );
    }


    if(pel && pel.cid){
      sideOps.push(
        sb.from('odp_ports')
          .update({status:'kosong', cid_pelanggan:null, paket:null, tgl_pasang:null})
          .eq('cid_pelanggan', pel.cid)
          .then(undefined, function(){})
      );
    }

    if(pel && !pel.cid && pel.odp_id && pel.id){
      sideOps.push(
        sb.from('odp_ports')
          .update({status:'kosong', cid_pelanggan:null, paket:null, tgl_pasang:null})
          .eq('odp_id', pel.odp_id)
          .eq('pel_id', pel.id)
          .then(undefined, function(){})
      );
    }


    if(typeof window._dmtBuildReturnOps === 'function'){
      sideOps.push(
        window._dmtBuildReturnOps(sb, ctx, pel, today)
          .then(function(res){
            if(res && res.mutasi_count > 0){
              if(typeof toast==='function')
                toast('📦 '+res.mutasi_count+' item material dikembalikan ke stok','ok');
              if(typeof window._invMatiLoaded!=='undefined') window._invMatiLoaded=false;
              if(typeof window._invMatiData!=='undefined')   window._invMatiData=[];
            }
          })
          .catch(function(){})
      );
    } else {

      if(ctx.ont_kembali && pel && pel.ont_item_id){
        sideOps.push(
          _matMutasi(pel.ont_item_id, 1, 'return_dismantle', {
            sn_ont: ctx.sn_ont||null, pel_cid: pel.cid||null,
            keterangan: 'Return ONT dismantle '+(pel.cid||pelId), tgl: today
          }).catch(function(){})
        );
      }
    }


    if(pel && pel.id){
      sideOps.push(
        sb.from('fee_recurring').update({status:'stopped'})
          .eq('pel_id', pel.id).neq('status','paid')
          .then(undefined, function(){})
      );
    }


    /* Pencatatan Aktivitas & Log Ubahan untuk dismantle — kategori #3.
       Dipanggil sekali di sini karena _runAfterInsert hanya berjalan
       setelah record dismantle utama berhasil disimpan (bukan prematur). */
    sideOps.push(
      (function(){
        if(typeof window._auditLog === 'function'){
          var oldSnap = (typeof window._pelSnapshot==='function' && pel) ? window._pelSnapshot(pel) : null;
          window._auditLog('dismantle', 'cabut', pelId||(pel&&pel.id)||null, oldSnap, {
            cid      : pel ? pel.cid  : null,
            nama     : pel ? pel.nama : null,
            status   : 'cabut',
            alasan   : alasan,
            catatan  : ((document.getElementById('dmtf-catatan')||{}).value||'').trim()||null,
            teknisi  : teknisi,
            tgl_cabut: today
          });
          return Promise.resolve();
        }
        /* fallback bila _auditLog belum termuat (seharusnya tidak pernah terjadi) */
        return sb.from('activity_log').insert([{
          jenis         : 'dismantle_cabut',
          keterangan    : 'Dismantle '+(pel?(pel.cid||pel.nama||pelId):'')+
                          ' oleh '+aktorNama+' ('+aktorRole+') — '+alasan,
          dilakukan_oleh: aktorNama,
          role_aktor    : aktorRole,
          ref_id        : insertedId||null,
          tgl           : today
        }]).then(undefined, function(){});
      })()
    );

    Promise.all(sideOps)
      .then(function(){
        if(typeof toast==='function')
          toast('✅ Dismantle selesai! '+
            (pel?'Pelanggan '+pel.cid+' ':'')+'dicabut, port dilepas, stok diupdate, recurring dihentikan','ok');


        if(window.SOT) SOT.invalidate('general');


        if(typeof window._pelLoaded!=='undefined')  window._pelLoaded  = false;
        if(typeof window._portLoaded!=='undefined') window._portLoaded = false;
        if(typeof window._odpLoaded!=='undefined')  window._odpLoaded  = false;
        if(typeof window._monLoaded!=='undefined')  window._monLoaded  = false;
        if(typeof window._dmtLoaded!=='undefined')  window._dmtLoaded  = false;
        if(typeof window._dashLoaded!=='undefined') window._dashLoaded = false;
        if(typeof window._dashLastLoad!=='undefined') window._dashLastLoad = 0;
        if(typeof window._invMatiLoaded!=='undefined') window._invMatiLoaded = false;


        if(typeof dmtCloseForm==='function') dmtCloseForm();
        if(typeof dmtLoad==='function') setTimeout(function(){ dmtLoad(); }, 400);
      })
      .catch(function(e){
        if(typeof toast==='function')
          toast('✅ Dismantle tersimpan (sync parsial: '+(e&&e.message||'')+')','ok');
        if(window.SOT) SOT.invalidate('general');
        if(typeof dmtCloseForm==='function') dmtCloseForm();
        if(typeof dmtLoad==='function') setTimeout(function(){ dmtLoad(); }, 400);
      });
  }


  function _doInsert(pl){
    sb.from('dismantle_orders').insert([pl])
      .then(function(r){
        if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-plug-x"></i> Simpan Dismantle'; }
        if(r && r.error){
          if(typeof toast==='function') toast('Gagal menyimpan dismantle: '+(r.error.message||''),'err');
          return;
        }
        _runAfterInsert((r.data&&r.data[0]&&r.data[0].id)||null);
      }).catch(function(e){
        if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-plug-x"></i> Simpan Dismantle'; }
        if(typeof toast==='function') toast('Error: '+(e.message||''),'err');
      });
  }

  _doInsert(payload);
};

})();
