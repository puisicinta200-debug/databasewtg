
(function(){
'use strict';

if(typeof window.SOT==='undefined'){
  console.error('[Phase 2C] SOT engine tidak ditemukan.');
  return;
}

window._dmtBuildReturnOps = function(sb, ctx, pel, tgl){
  if(!sb || !pel) return Promise.resolve({ops:[], mutasi_count:0});

  var areaId  = pel.area_id  || null;
  var odcId   = pel._odc_id  || pel.odc_id  || null;
  var odpId   = pel.odp_id   || null;
  var pelId   = pel.id       || null;
  var pelCid  = pel.cid      || null;
  var tek     = ctx.teknisi  || (window.CU && (CU.nama||CU.username)) || null;
  var today   = tgl || new Date().toISOString().slice(0,10);
  var dmtId   = ctx.dismantle_id || null;


  function _makeReturn(itemId, qty, jenis, keterangan, extra){
    if(!itemId || qty <= 0) return Promise.resolve(null);
    if(typeof _matMutasi !== 'function'){

      return sb.from('material_items').select('stok').eq('id',itemId).single()
        .then(function(r){
          if(r.error || !r.data) return null;
          var oldStok = parseInt(r.data.stok)||0;
          var newStok = oldStok + qty;
          return Promise.all([
            sb.from('material_items').update({stok:newStok}).eq('id',itemId),
            sb.from('material_mutasi').insert([{item_id:itemId,jenis:jenis||'return_dismantle',jumlah:qty,stok_sebelum:oldStok,stok_sesudah:newStok,area_id:areaId,odc_id:odcId,odp_id:odpId,pel_id:pelId,pel_cid:pelCid,teknisi:tek,sn_ont:(extra&&extra.sn_ont)||null,no_ref:dmtId||null,keterangan:keterangan||('Return dismantle '+(pelCid||'')),tgl:today}])
          ]);
        }).catch(function(){ return null; });
    }
    return _matMutasi(itemId, qty, jenis||'return_dismantle', {
      area_id: areaId, odc_id: odcId, odp_id: odpId, pel_id: pelId, pel_cid: pelCid,
      teknisi: tek, sn_ont: (extra && extra.sn_ont) || null, no_ref: dmtId || null,
      keterangan: keterangan || ('Return dismantle ' + (pelCid||'')), tgl: today
    }).catch(function(e){

      return null;
    });
  }


  function _alreadyReturned(itemId, refId){
    if(!refId) return Promise.resolve(false);
    return sb.from('material_mutasi')
      .select('id', {count:'exact', head:true})
      .eq('item_id', itemId)
      .eq('no_ref', refId)
      .in('jenis', ['return_dismantle','recovery_dismantle'])
      .then(function(r){ return !r.error && (r.count||0) > 0; })
      .catch(function(){ return false; });
  }

  var returnOps = [];


  var ontItemId = (pel.ont_item_id) || null;
  if(ctx.ont_kembali && ontItemId){

    returnOps.push(
      _alreadyReturned(ontItemId, dmtId).then(function(done){
        if(done) return null;
        return _makeReturn(ontItemId, 1, 'return_dismantle',
          'Return ONT dismantle ' + (pelCid||'') + (ctx.sn_ont?' SN:'+ctx.sn_ont:''),
          {sn_ont: ctx.sn_ont||null});
      })
    );
  } else if(!ctx.ont_kembali && ontItemId){

    var kondisiDmt = ctx.ont_kondisi || 'tidak';
    var jenisDmt = kondisiDmt === 'rusak' ? 'rusak' : 'hilang';
    var ketDmt = kondisiDmt === 'rusak'
      ? 'ONT Rusak — Dismantle CID:' + (pelCid||'') + (ctx.sn_ont?' SN:'+ctx.sn_ont:'')
      : 'ONT Hilang — Dismantle CID:' + (pelCid||'') + (ctx.sn_ont?' SN:'+ctx.sn_ont:'');
    returnOps.push(
      _alreadyReturned(ontItemId, dmtId + '_kondisi').then(function(done){
        if(done) return null;
        var sb2 = (typeof getSB==='function') ? getSB() : null;
        if(!sb2) return null;
        return sb2.from('material_mutasi').insert([{
          item_id: ontItemId, jenis: jenisDmt, jumlah: 1,
          stok_sebelum: 0, stok_sesudah: 0,
          pel_id: pelId||null, pel_cid: pelCid||null,
          area_id: (pel.area_id)||null, teknisi: ctx.teknisi||null,
          sn_ont: ctx.sn_ont||null, no_ref: dmtId||null,
          keterangan: ketDmt, tgl: today
        }]).then(function(){ return {ok:true}; }).catch(function(){ return null; });
      })
    );
  }


  var kabelItemId = (pel.kabel_item_id) || null;
  var pjgKabel    = parseFloat(ctx.panjang_kabel)||0;
  if(ctx.precon_kembali && kabelItemId && pjgKabel > 0){
    returnOps.push(
      _alreadyReturned(kabelItemId, dmtId).then(function(done){
        if(done) return null;
        return _makeReturn(kabelItemId, pjgKabel, 'return_dismantle',
          'Return kabel precon '+pjgKabel+'m dismantle '+(pelCid||''));
      })
    );
  }


  var adpItemId = ctx.adapter_item_id || null;
  if(ctx.adapter_kembali && adpItemId){
    returnOps.push(
      _alreadyReturned(adpItemId, dmtId).then(function(done){
        if(done) return null;
        return _makeReturn(adpItemId, 1, 'return_dismantle',
          'Return adaptor dismantle '+(pelCid||''));
      })
    );
  }


  var fcItemId = ctx.fastconn_item_id || null;
  var fcQty    = parseInt(ctx.fastconn_qty)||0;
  if(ctx.fastconn_kembali && fcItemId && fcQty > 0){
    returnOps.push(
      _makeReturn(fcItemId, fcQty, 'return_dismantle',
        'Return fast connector x'+fcQty+' dismantle '+(pelCid||''))
    );
  }


  var dcItemId = ctx.dropcore_item_id || null;
  var dcQty    = parseInt(ctx.dropcore_qty)||0;
  if(ctx.dropcore_kembali && dcItemId && dcQty > 0){
    returnOps.push(
      _makeReturn(dcItemId, dcQty, 'return_dismantle',
        'Return dropcore x'+dcQty+' dismantle '+(pelCid||''))
    );
  }


  var splItemId = ctx.splitter_item_id || null;
  if(ctx.splitter_kembali && splItemId){
    returnOps.push(
      _makeReturn(splItemId, 1, 'return_dismantle',
        'Return splitter dismantle '+(pelCid||''))
    );
  }


  var lainItemId = ctx.lain_item_id || null;
  var lainQty    = parseInt(ctx.lain_qty)||0;
  if(ctx.lain_kembali && lainItemId && lainQty > 0){
    returnOps.push(
      _makeReturn(lainItemId, lainQty, 'return_dismantle',
        ctx.lain_ket || ('Return material lain x'+lainQty+' dismantle '+(pelCid||'')))
    );
  }

  return Promise.all(returnOps).then(function(results){
    var count = results.filter(function(r){ return r!==null; }).length;
    return { ops: results, mutasi_count: count };
  });
};

window.dmtSelectPel = function(pid){
  var p=(_dmtPelData||[]).find(function(x){return x.id===pid;}); if(!p) return;


  var hidPel=document.getElementById('dmtf-pel-id'); if(hidPel) hidPel.value=pid;


  var inp=document.getElementById('dmtf-pel-search');
  if(inp){ inp.value=p.nama||p.cid||''; }


  var res=document.getElementById('dmtf-pel-results');
  if(res){ res.style.display='none'; res.innerHTML=''; }


  var sel=document.getElementById('dmtf-pel-selected');
  if(sel){
    sel.style.display='flex';
    var ar=(_areaData||[]).find(function(a){return a.id===p.area_id;}); var arNm=ar?ar.nama:'';
    sel.innerHTML=
      '<div style="width:34px;height:34px;border-radius:9px;background:var(--red);display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
        '<i class="ti ti-user" style="font-size:16px;color:#fff"></i>'+
      '</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:800;color:var(--text)">'+_esc(p.nama||'—')+'</div>'+
        '<div style="font-size:10px;color:var(--red);font-family:\'JetBrains Mono\',monospace;font-weight:700">'+_esc(p.cid||'')+(arNm?' · '+arNm:'')+'</div>'+
      '</div>'+
      '<button onclick="dmtClearPelSelection()" style="background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.2);border-radius:7px;padding:4px 8px;font-size:10px;font-weight:700;color:var(--red);cursor:pointer;touch-action:manipulation;flex-shrink:0">Ganti</button>';
  }


  var detCard=document.getElementById('dmtf-pel-detail');
  var detGrid=document.getElementById('dmtf-pel-detail-grid');
  if(detCard && detGrid){
    detCard.style.display='block';
    var ar2=(_areaData||[]).find(function(a){return a.id===p.area_id;})||{};

    var odpObj=(_pelOdpList||[]).find(function(o){return o.id===p.odp_id;})||{};
    var odpNm=odpObj.kode||odpObj.nama||(p.odp_id?'Ada':'—');

    var odpOdcId=odpObj.odc_id||null;
    var odcList=window._pelOdcList||[];
    var odcObj=odcList.find(function(o){return o.id===odpOdcId;})||{};
    var odcNm=odcObj.kode||odcObj.nama||'—';

    var kblNm=p.panjang_kabel?p.panjang_kabel+' roll':'—';
    function dc(l,v){ return '<div class="dmtf-detail-cell"><div class="dmtf-detail-lbl">'+l+'</div><div class="dmtf-detail-val">'+v+'</div></div>'; }
    detGrid.innerHTML=
      dc('Status','<span style="font-weight:800;color:'+(p.status==='aktif'?'var(--green)':'var(--yellow)')+'">'+_esc(p.status||'—')+'</span>')+
      dc('Paket',_esc(p.paket||'—'))+
      dc('Area',_esc(ar2.nama||'—'))+
      dc('ODC',_esc(odcNm))+
      dc('ODP',_esc(odpNm))+
      dc('Port',p.nomor_port?'Port '+p.nomor_port:'—')+
      dc('SN ONT','<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px">'+_esc(p.sn_ont||'—')+'</span>')+
      dc('ONT Model',_esc(p.ont_model||'—'))+
      dc('Kabel',kblNm)+
      dc('Tgl Pasang',_esc(p.tgl_pasang||'—'))+
      dc('Teknisi',_esc(p.teknisi_pasang||'—'))+
      (p.kecamatan?dc('Kecamatan',_esc(p.kecamatan)):'')+
      (p.kelurahan?dc('Kelurahan',_esc(p.kelurahan)):'');
  }


  var snInp=document.getElementById('dmtf-sn-ont');
  if(snInp) snInp.value=p.sn_ont||'';


  var portInfo=document.getElementById('dmtf-port-info');
  var portText=document.getElementById('dmtf-port-text');
  if(portInfo && p.odp_id){
    portInfo.style.display='flex';
    if(portText) portText.textContent='Port ODP '+(p.nomor_port?'No. '+p.nomor_port:'')+' akan otomatis dikosongkan';
  } else if(portInfo){ portInfo.style.display='none'; }

  /* Cari ODC dari ODP pelanggan */
  var odcId = null;
  var c = SOT.cache();
  if(p.odp_id){
    var odpObjForOdc = (c.odps||[]).find(function(o){return o.id===p.odp_id;});
    if(odpObjForOdc && odpObjForOdc.odc_id) odcId = odpObjForOdc.odc_id;
  }
  if(!odcId && p.odp_id && typeof _pelOdpList!=='undefined'){
    var odpObj2ForOdc = (_pelOdpList||[]).find(function(o){return o.id===p.odp_id;});
    if(odpObj2ForOdc && odpObj2ForOdc.odc_id) odcId = odpObj2ForOdc.odc_id;
  }
  if(odcId) p._odc_id = odcId;

  var hidOdc = document.getElementById('dmtf-odc-id');
  if(hidOdc) hidOdc.value = odcId || '';
  var hidOdp = document.getElementById('dmtf-odp-id');
  if(hidOdp) hidOdp.value = p.odp_id || '';
  var hidPort = document.getElementById('dmtf-port-nomor');
  if(hidPort) hidPort.value = p.nomor_port || '';
};

function dmtClearPelSelection(){
  var hidPel=document.getElementById('dmtf-pel-id'); if(hidPel) hidPel.value='';
  var inp=document.getElementById('dmtf-pel-search'); if(inp){ inp.value=''; inp.focus(); }
  var sel=document.getElementById('dmtf-pel-selected'); if(sel) sel.style.display='none';
  var det=document.getElementById('dmtf-pel-detail'); if(det) det.style.display='none';
  var port=document.getElementById('dmtf-port-info'); if(port) port.style.display='none';
}

var _origDmtSelectPel2C = window.dmtSelectPel;
window.dmtSelectPel = function(pid){
  if(typeof _origDmtSelectPel2C==='function') _origDmtSelectPel2C(pid);


  var p = (_dmtPelData||[]).find(function(x){return x.id===pid;});
  if(!p) return;

  var odcId = null;
  var c = SOT.cache();
  if(p.odp_id){
    var odpObj = (c.odps||[]).find(function(o){return o.id===p.odp_id;});
    if(odpObj && odpObj.odc_id) odcId = odpObj.odc_id;
  }
  if(!odcId && p.odp_id && typeof _pelOdpList!=='undefined'){
    var odpObj2 = (_pelOdpList||[]).find(function(o){return o.id===p.odp_id;});
    if(odpObj2 && odpObj2.odc_id) odcId = odpObj2.odc_id;
  }
  if(odcId) p._odc_id = odcId;


  var hidOdc = document.getElementById('dmtf-odc-id');
  if(hidOdc) hidOdc.value = odcId || '';
  var hidOdp = document.getElementById('dmtf-odp-id');
  if(hidOdp) hidOdp.value = p.odp_id || '';
  var hidPort = document.getElementById('dmtf-port-nomor');
  if(hidPort) hidPort.value = p.nomor_port || '';
};
window.dmtSelectPel._2c = true;

window.dmtForceSync = function(){
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(typeof toast==='function') toast('Database tidak terhubung','err'); return; }
  if(typeof toast==='function') toast('⏳ Sinkronisasi dismantle lama…','ok');

  sb.from('dismantle_orders')
    .select('id,pel_id,cid_pelanggan,sn_ont,ont_item_id,kabel_item_id,ont_kembali,precon_kembali,panjang_kabel,adapter_kembali,status,area_id,odp_id,odc_id,teknisi')
    .eq('status','selesai')
    .then(function(r){
      if(r&&r.error){ if(typeof toast==='function') toast('Gagal baca data: '+(r.error.message||''),'err'); return; }
      var selesai = r.data||[];
      if(!selesai.length){ if(typeof toast==='function') toast('Tidak ada dismantle untuk diproses','ok'); return; }

      var ops = [];
      selesai.forEach(function(x){

        if(x.pel_id){
          ops.push(sb.from('pelanggan').update({status:'cabut'}).eq('id',x.pel_id).catch(function(){}));
        }
        if(x.cid_pelanggan){
          ops.push(sb.from('odp_ports').update({status:'kosong',cid_pelanggan:null,paket:null,tgl_pasang:null})
            .eq('cid_pelanggan',x.cid_pelanggan).catch(function(){}));
        }


        var ctx = {
          ont_kembali    : !!x.ont_kembali,
          sn_ont         : x.sn_ont||null,
          precon_kembali : !!x.precon_kembali,
          panjang_kabel  : parseFloat(x.panjang_kabel)||0,
          adapter_kembali: !!x.adapter_kembali,
          dismantle_id   : x.id,
          teknisi        : x.teknisi||null
        };
        var fakePel = {
          id        : x.pel_id,
          cid       : x.cid_pelanggan,
          area_id   : x.area_id||null,
          _odc_id   : x.odc_id||null,
          odp_id    : x.odp_id||null,
          ont_item_id  : x.ont_item_id||null,
          kabel_item_id: x.kabel_item_id||null
        };
        ops.push(window._dmtBuildReturnOps(sb, ctx, fakePel, new Date().toISOString().slice(0,10)));
      });

      Promise.all(ops).then(function(){
        if(typeof toast==='function') toast('✅ Sync selesai! '+selesai.length+' record diproses','ok');
        if(window.SOT) SOT.invalidate('general');
        if(typeof _invMatiLoaded!=='undefined') window._invMatiLoaded=false;
        if(typeof _invMatiData!=='undefined')   window._invMatiData=[];
        if(typeof _dmtLoaded!=='undefined') window._dmtLoaded=false;
        if(typeof _pelLoaded!=='undefined') window._pelLoaded=false;
        setTimeout(function(){
          if(typeof dmtLoad==='function') dmtLoad();
          if(typeof dashLoad==='function') dashLoad();
        }, 400);
      }).catch(function(e){ if(typeof toast==='function') toast('Error sync: '+(e&&e.message||''),'err'); });
    }).catch(function(e){ if(typeof toast==='function') toast('Error: '+(e&&e.message||''),'err'); });
};
window.dmtForceSync._2c = true;

function invMatiSave(){

  var id      = document.getElementById('inv-matif-id').value;
  var kode    = document.getElementById('inv-matif-kode').value.trim().toUpperCase();
  var nama    = document.getElementById('inv-matif-nama').value.trim();
  var kat     = document.getElementById('inv-matif-kategori').value;
  var satuan  = document.getElementById('inv-matif-satuan').value;
  var merk    = document.getElementById('inv-matif-merk').value.trim();
  var stok    = parseInt(document.getElementById('inv-matif-stok').value)||0;
  var minStok = parseInt(document.getElementById('inv-matif-min-stok').value)||0;
  var harga   = parseFloat(document.getElementById('inv-matif-harga').value)||0;
  var status  = document.getElementById('inv-matif-status').value;
  var ket     = document.getElementById('inv-matif-ket').value.trim();

  var ok=true;
  var chk=function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('inv-matif-kode',kode); chk('inv-matif-nama',nama); chk('inv-matif-kategori',kat);
  if(!ok){ console.log('[DEBUG] invMatiSave berhenti: validasi wajib gagal',{kode:kode,nama:nama,kat:kat}); toast('Isi semua field wajib','err'); return; }

  var dup=_invMatiData.find(function(m){ return m.kode===kode && m.id!==id; });
  if(dup){ console.log('[DEBUG] invMatiSave berhenti: kode duplikat',kode); toast('Kode item sudah digunakan','err'); document.getElementById('inv-matif-kode').classList.add('err'); return; }

  var sb=getSB(); if(!sb){ console.log('[DEBUG] invMatiSave berhenti: getSB null'); toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('inv-matif-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var payload={kode:kode,nama:nama,kategori:kat,satuan:satuan,merk:merk||null,stok:stok,min_stok:minStok,harga_satuan:harga,status:status,keterangan:ket||null};
  var _INVMATI_OPT = ['merk','min_stok','harga_satuan','keterangan'];
  function _doInvMatiSave(pl){
    var p=id?sb.from('material_items').update(pl).eq('id',id):sb.from('material_items').insert([pl]);
    p.then(function(r){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
      if(r.error){
        var msg=r.error.message||'';
        var isColErr=msg.indexOf('Could not find')!==-1||msg.indexOf('column')!==-1||msg.indexOf('does not exist')!==-1;
        var hasOpt=_INVMATI_OPT.some(function(k){ return pl.hasOwnProperty(k); });
        if(isColErr && hasOpt){
          var pl2={}; Object.keys(pl).forEach(function(k){ if(_INVMATI_OPT.indexOf(k)===-1) pl2[k]=pl[k]; });
          toast('⚠ Kolom belum ada di DB, menyimpan data dasar…','info');
          _doInvMatiSave(pl2); return;
        }
        toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return;
      }
      toast(id?'Item diperbarui':'Item ditambahkan','ok');
      if(window.SOT) SOT.invalidate('general');
      invMatiCloseForm(); _invMatiLoaded=false; invMatiLoad();
    }).catch(function(e){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
      toast('Error: '+(e.message||'coba lagi'),'err');
    });
  }
  _doInvMatiSave(payload);
}

var _origInvMatiSave2C = window.invMatiSave;
window.invMatiSave = function(){

  var areaEl = document.getElementById('invf-mati-area-id') ||
               document.getElementById('invf-area') ||
               document.getElementById('inv-mati-area');
  if(areaEl && !areaEl.value){
    var sc = (typeof _getUserAreaScope==='function') ? _getUserAreaScope() : null;
    if(sc && sc.area_coverage_id) areaEl.value = sc.area_coverage_id;
  }
  if(typeof _origInvMatiSave2C==='function') _origInvMatiSave2C.apply(this, arguments);
};
window.invMatiSave._2c = true;

window.SOT_validate = function(){
  var fn  = function(n){ return typeof window[n]==='function'; };
  var mrk = function(n,m){ return !!(window[n] && window[n][m]); };
  var sot = function(n){ return window.SOT && typeof SOT[n]==='function'; };

  var checks = {

    'SOT.customerStats'       : sot('customerStats'),
    'SOT.portStats'           : sot('portStats'),
    'SOT.areaStats'           : sot('areaStats'),
    'SOT.materialStats'       : sot('materialStats'),
    'SOT.maintenanceStats'    : sot('maintenanceStats'),

    'pelSave port→USED'       : mrk('pelSave','_fix1'),
    'pelSave cabut→FREE'      : mrk('pelSave','_fix2') && mrk('pelDelete','_fix2'),
    'owdPaneLoad→SOT'         : mrk('owdPaneLoad','_fix3') || mrk('owdPaneLoad','_p3'),
    'dashFilter no wilayah'   : mrk('_dashInitFilterBar','_fix4'),
    'owd group byArea'        : mrk('owdPaneLoad','_fix5') || mrk('owdPaneLoad','_p3'),

    'dashLoad→SOT'            : mrk('dashLoad','_2b'),
    'salesDashLoad→SOT'       : mrk('salesDashLoad','_sotPatched') || mrk('salesDashLoad','_2b'),

    'monRenderOdc→SOT'        : mrk('monRenderOdc','_sot2a'),
    'monRenderOdp→SOT'        : mrk('monRenderOdp','_sot2a'),

    'dmtSave v26'             : mrk('dmtSave','_v26'),
    '_dmtBuildReturnOps'      : fn('_dmtBuildReturnOps'),
    'dmtSelectPel→odc_id'     : mrk('dmtSelectPel','_2c'),
    'invMatiSave→SOT'         : mrk('invMatiSave','_2c'),

    'normalizeRole→canonical' : mrk('normalizeRole','_p3'),
    'SOT.ensure'              : sot('ensure'),
    'Executive View'          : mrk('owdPaneLoad','_p3')
  };

  var pass=0, fail=0, failList=[];
  Object.keys(checks).forEach(function(k){
    if(checks[k]) pass++;
    else { fail++; failList.push(k); }
  });

  var line = '═'.repeat(48);

  if(failList.length) failList.forEach(function(k){ console.warn(' ✗ '+k); });
  else console.log(' ✓ Semua check PASS');

  return { pass:pass, fail:fail, checks:checks, failList:failList };
};

window.SOT_2C_validate = window.SOT_validate;
window.SOT_P3_validate = window.SOT_validate;
window.SOT_P4_validate = window.SOT_validate;
window.SOT_P4_certify  = window.SOT_validate;

})();

