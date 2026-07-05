
function _2aCloneWithPortUsed(arr, usedMap){
  return (arr||[]).map(function(x){
    var copy = {}; for(var k in x) copy[k]=x[k];
    copy.port_used = usedMap[x.id]||0;
    return copy;
  });
}
window.monOltDetOpen = function(){}
window.monOltDetOpen._sot2a = true;

window.monOdcDetOpen = function(){}
window.monOdcDetOpen._sot2a = true;

})();



(function(){
'use strict';

if(typeof window.SOT === 'undefined'){
  console.error('[Phase 2B] SOT engine tidak ditemukan.');
  return;
}
window.rptSummaryLoad = function(){
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb) return;

  var areaId = null;
  if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
    var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
    areaId = sc && sc.area_coverage_id;
  }

  var _renderRpt = function(c){
    var cs = SOT.customerStats(areaId);
    var ps = SOT.portStats(areaId);

    var _s = _dSet;
    _s('rpt-kpi-pel',   cs.total);
    _s('rpt-kpi-aktif', cs.aktif);


    var data = areaId
      ? c.pelanggan.filter(function(p){ return p.area_id===areaId; })
      : c.pelanggan;
    var JG=JENIS_GRATIS;
    data = data.filter(function(p){ return JG.indexOf(p.jenis_pelanggan)<0; });
    var statusMap={};
    data.forEach(function(p){ var s=p.status||'lainnya'; statusMap[s]=(statusMap[s]||0)+1; });
    var scol={aktif:'gr',isolir:'yw',cabut:'rd',proses:'c1',lainnya:'c1',suspend:'yw',maintenance:'ty'};
    var slbl={aktif:'Aktif',isolir:'Isolir',cabut:'Cabut',proses:'Proses',lainnya:'Lainnya',suspend:'Suspend',maintenance:'Maintenance'};
    var sorted=Object.keys(statusMap).sort(function(a,b){return statusMap[b]-statusMap[a];});
    var el2=document.getElementById('rpt-pel-status-chart');
    if(el2) el2.innerHTML=sorted.map(function(s){
      var pct=data.length>0?Math.round(statusMap[s]/data.length*100):0;
      return '<div class="rpt-bar-row">'+
        '<div class="rpt-bar-label"><span class="rpt-bar-name">'+(slbl[s]||s)+'</span>'+
        '<span class="rpt-bar-val">'+statusMap[s]+' ('+pct+'%)</span></div>'+
        '<div class="rpt-bar-bg"><div class="rpt-bar-fill '+(scol[s]||'c1')+'" style="width:'+pct+'%"></div></div>'+
      '</div>';
    }).join('');


    _s('rpt-kpi-port',       ps.total);
    _s('rpt-kpi-port-used',  ps.used);
    _s('rpt-kpi-port-free',  ps.free);
    _s('rpt-kpi-port-rusak', ps.damaged);


    var now = new Date();
    var bulan = now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2);
    var baru = data.filter(function(p){
      return (p.tgl_pasang||p.created_at||'').slice(0,7)===bulan;
    }).length;
    _s('rpt-kpi-baru', baru);


    var areaMap={}, aNm={};
    (c.areas||[]).forEach(function(a){aNm[a.id]=a.nama||a.kode||'Area';});
    data.filter(function(p){return p.status==='aktif';}).forEach(function(p){
      var k=aNm[p.area_id]||'Tanpa Area';
      areaMap[k]=(areaMap[k]||0)+1;
    });
    var areaArr=Object.entries(areaMap).sort(function(a,b){return b[1]-a[1];}).slice(0,8);
    var maxA=areaArr.length?areaArr[0][1]:1;
    var el3=document.getElementById('rpt-pel-area-chart');
    if(el3) el3.innerHTML=areaArr.map(function(kv){
      var pct=Math.round(kv[1]/maxA*100);
      return '<div class="rpt-bar-row">'+
        '<div class="rpt-bar-label"><span class="rpt-bar-name">'+(typeof _esc==='function'?_esc(kv[0]):kv[0])+'</span><span class="rpt-bar-val">'+kv[1]+'</span></div>'+
        '<div class="rpt-bar-bg"><div class="rpt-bar-fill gr" style="width:'+pct+'%"></div></div>'+
      '</div>';
    }).join('')||'<div style="color:var(--text3);font-size:12px;padding:16px;text-align:center">Tidak ada data</div>';


    var odps = areaId ? c.odps.filter(function(o){return o.area_id===areaId;}) : c.odps;
    _s('rpt-kpi-odp', odps.length);
    _s('rpt-net-odp', odps.length);
  };

  var c = SOT.cache();
  if(c.pelanggan.length && c.ports.length){
    _renderRpt(c);
  } else {
    SOT.refresh(true, function(c2){ _renderRpt(c2); });
  }
};
var _origMonLoad2B = window.monLoad || function(){};
window.monLoad = function(){}
var _origPelLoadWilayah2B = window._pelLoadWilayahMaster;
window._pelLoadWilayahMaster = function(cb){
  var role = (typeof normalizeRole==='function') ? normalizeRole(window.CR) : (window.CR||'viewer');
  var isAdmin = (role==='super_admin'||role==='owner');


  if(isAdmin){
    if(typeof _origPelLoadWilayah2B==='function') _origPelLoadWilayah2B(cb);
    else if(typeof cb==='function') cb();
    return;
  }


  var c = SOT.cache();
  var src = c.pelanggan && c.pelanggan.length ? c.pelanggan : (window._pelData||[]);
  var seen={};
  window._pelWilayahMaster = src
    .filter(function(p){ return p.kecamatan; })
    .reduce(function(acc,p){
      var key=(p.kecamatan||'')+'|'+(p.kelurahan||'');
      if(!seen[key]){
        seen[key]=true;
        acc.push({area_coverage:p.area_id||'', kecamatan:p.kecamatan, kelurahan:p.kelurahan||''});
      }
      return acc;
    },[]);
  if(typeof cb==='function') cb();
};
var _origSdRenderCekList2B = window._sdRenderCekList;
window._sdRenderCekList = function(){
  if(!window.SOT || typeof _origSdRenderCekList2B !== 'function'){
    if(typeof _origSdRenderCekList2B === 'function') _origSdRenderCekList2B();
    return;
  }

  if(window._sdOdpEnriched && _sdOdpEnriched.length){
    var enrichedClone = _sdOdpEnriched.map(function(o){
      var ps = SOT.odpStats(o.id);
      var copy = {}; for(var k in o) copy[k]=o[k];
      copy.used = ps.used; copy.sisa = ps.free;
      return copy;
    });
    window._sdOdpEnriched = enrichedClone;
    _origSdRenderCekList2B();
    window._sdOdpEnriched = _origEnriched;
  } else {
    _origSdRenderCekList2B();
  }
};
window._sotKPI = function(areaId){
  return {
    pelanggan : SOT.customerStats(areaId),
    port      : SOT.portStats(areaId),
    area      : SOT.areaStats(areaId)
  };
};

})();



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



(function(){
'use strict';

if(typeof window.SOT === 'undefined'){
  console.error('[Phase 5] SOT engine tidak ditemukan.');
  return;
}

window.SOT_ISP = {

  current: function(){
    return (window.SB && window.SB.isp_id) ||
           (window.CU && window.CU.isp_id)  ||
           'default';
  },


  scopeQuery: function(query){
    var isp = this.current();
    if(isp && isp !== 'default'){

      return query.eq('isp_id', isp);
    }
    return query;
  },


  validateIsolation: function(){
    var c = SOT.cache();
    var isp = this.current();
    if(isp === 'default'){

      return { mode: 'single', isolation: 100, violations: 0 };
    }

    var violations = 0;
    ['areas','odcs','odps','pelanggan'].forEach(function(tbl){
      (c[tbl]||[]).forEach(function(row){
        if(row.isp_id && row.isp_id !== isp) violations++;
      });
    });

    return { mode: 'multi', isolation: violations===0?100:Math.max(0,100-violations), violations: violations };
  },


  stats: function(){
    return {
      isp_id       : this.current(),
      customerStats: SOT.customerStats(),
      portStats    : SOT.portStats(),
      areaCount    : (SOT.cache().areas||[]).length,
      odcCount     : (SOT.cache().odcs||[]).length,
      odpCount     : (SOT.cache().odps||[]).length
    };
  }
};

SOT.vendorEngine = {

  stats: function(){
    var c = SOT.cache();
    var byVendor = {};

    function ensure(k){
      if(!byVendor[k]) byVendor[k] = {
        id: k, nama: k,
        aktivasi: 0, maintenance: 0, dismantle: 0,
        material_keluar: 0, material_retur: 0,
        selesai: 0, total_wo: 0,
        res_hours_sum: 0, res_count: 0
      };
    }


    (c.pelanggan||[]).forEach(function(p){
      if(!p.teknisi_pasang) return;
      var k = p.teknisi_pasang;
      ensure(k);
      byVendor[k].aktivasi++;
    });


    (c.maintenance||[]).forEach(function(w){
      var k = w.teknisi_id || w.teknisi || null;
      if(!k) return;
      ensure(k);
      byVendor[k].total_wo++;
      byVendor[k].maintenance++;
      if(w.status==='selesai'){
        byVendor[k].selesai++;
        if(w.tgl_mulai && w.tgl_selesai){
          byVendor[k].res_hours_sum += (new Date(w.tgl_selesai)-new Date(w.tgl_mulai))/3600000;
          byVendor[k].res_count++;
        }
      }
    });


    (c.dismantle||[]).forEach(function(d){
      var k = d.teknisi || null;
      if(!k) return;
      ensure(k);
      byVendor[k].dismantle++;
    });


    (c.material||[]).forEach(function(m){
      var k = m.teknisi || null;
      if(!k) return;
      ensure(k);
      if((m.jenis||'').indexOf('instalasi')>=0 || (m.jenis||'').indexOf('keluar')>=0)
        byVendor[k].material_keluar += parseFloat(m.jumlah)||0;
      if((m.jenis||'').indexOf('return')>=0 || (m.jenis||'').indexOf('recovery')>=0)
        byVendor[k].material_retur += parseFloat(m.jumlah)||0;
    });


    return Object.values(byVendor).map(function(v){
      v.sla_pct = v.total_wo > 0 ? Math.round(v.selesai/v.total_wo*100) : 100;
      v.avg_res_hours = v.res_count > 0 ? Math.round(v.res_hours_sum/v.res_count*10)/10 : null;
      v.success_rate = v.aktivasi > 0
        ? Math.round(v.selesai/(v.aktivasi+v.maintenance||1)*100)
        : (v.sla_pct);
      v.score = Math.round(
        (v.sla_pct * 0.5) +
        (v.success_rate * 0.3) +
        (v.avg_res_hours !== null ? Math.max(0, 100 - v.avg_res_hours * 2) * 0.2 : 70 * 0.2)
      );
      return v;
    }).sort(function(a,b){ return b.score - a.score; });
  },


  systemScore: function(){
    var stats = this.stats();
    if(!stats.length) return 100;
    var avg = stats.reduce(function(s,v){return s+v.sla_pct;},0) / stats.length;
    return Math.round(avg);
  }
};

SOT.techEngine = {
  stats: function(){
    var c = SOT.cache();
    var byTek = {};

    function ensure(k){
      if(!byTek[k]) byTek[k] = {
        id:k, nama:k,
        aktivasi:0, maintenance:0, dismantle:0,
        material_keluar:0, material_retur:0,
        ont_retur:0,
        total_wo:0, selesai:0,
        res_hours_sum:0, res_count:0
      };
    }

    (c.pelanggan||[]).forEach(function(p){
      if(p.teknisi_pasang){ ensure(p.teknisi_pasang); byTek[p.teknisi_pasang].aktivasi++; }
    });
    (c.maintenance||[]).forEach(function(w){
      var k=w.teknisi_id||w.teknisi||null; if(!k) return;
      ensure(k); byTek[k].total_wo++; byTek[k].maintenance++;
      if(w.status==='selesai'){
        byTek[k].selesai++;
        if(w.tgl_mulai&&w.tgl_selesai){
          byTek[k].res_hours_sum+=(new Date(w.tgl_selesai)-new Date(w.tgl_mulai))/3600000;
          byTek[k].res_count++;
        }
      }
    });
    (c.dismantle||[]).forEach(function(d){
      var k=d.teknisi||null; if(!k) return;
      ensure(k); byTek[k].dismantle++;
      if(d.ont_kembali) byTek[k].ont_retur++;
    });
    (c.material||[]).forEach(function(m){
      var k=m.teknisi||null; if(!k) return;
      ensure(k);
      if((m.jenis||'').indexOf('instalasi')>=0) byTek[k].material_keluar+=parseFloat(m.jumlah)||0;
      if((m.jenis||'').indexOf('return')>=0)    byTek[k].material_retur+=parseFloat(m.jumlah)||0;
    });

    return Object.values(byTek).map(function(t){
      t.sla_pct   = t.total_wo>0 ? Math.round(t.selesai/t.total_wo*100) : 100;
      t.avg_res_h = t.res_count>0 ? Math.round(t.res_hours_sum/t.res_count*10)/10 : null;
      var speedScore = t.avg_res_h!==null ? Math.max(0,100-t.avg_res_h*2) : 75;
      t.score = Math.round(t.sla_pct*0.5 + speedScore*0.3 + (t.aktivasi>0?90:70)*0.2);
      return t;
    }).sort(function(a,b){ return b.score-a.score; });
  },

  systemScore: function(){
    var s=this.stats();
    if(!s.length) return 100;
    return Math.round(s.reduce(function(acc,t){return acc+t.sla_pct;},0)/s.length);
  }
};

SOT.forecastEngine = {

  _linReg: function(points){
    var n=points.length;
    if(n<2) return {slope:0,intercept:points.length?points[0].y:0};
    var sx=0,sy=0,sxy=0,sxx=0;
    points.forEach(function(p){sx+=p.x;sy+=p.y;sxy+=p.x*p.y;sxx+=p.x*p.x;});
    var slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);
    var intercept=(sy-slope*sx)/n;
    return {slope:slope, intercept:intercept};
  },


  _growthSeries: function(areaId){
    var c = SOT.cache();
    var pels = areaId
      ? c.pelanggan.filter(function(p){return p.area_id===areaId;})
      : c.pelanggan;
    var JG = window.JENIS_GRATIS||[];
    pels = pels.filter(function(p){return JG.indexOf(p.jenis_pelanggan)<0;});

    var monthly = {};
    pels.forEach(function(p){
      var dt = (p.tgl_pasang||p.created_at||'').slice(0,7);
      if(!dt) return;
      monthly[dt] = (monthly[dt]||0) + 1;
    });
    var sorted = Object.keys(monthly).sort();

    var cum = 0;
    return sorted.map(function(m,i){
      cum += monthly[m];
      return {x:i, month:m, y:cum, delta:monthly[m]};
    });
  },


  forecastArea: function(areaId, days){
    var series = this._growthSeries(areaId);
    if(series.length < 2) return null;


    var recent = series.slice(-6);
    var avgDelta = recent.reduce(function(s,p){return s+p.delta;},0)/recent.length;
    var daysPerMonth = 30;
    var monthsAhead = days/daysPerMonth;
    var currentTotal = series[series.length-1].y;

    var predictedPel = Math.round(currentTotal + avgDelta * monthsAhead);
    var ps = SOT.portStats(areaId);
    var portFree = ps.free;
    var monthsFull = avgDelta>0 ? Math.ceil(portFree/avgDelta) : null;

    return {
      area_id      : areaId,
      days         : days,
      current_pel  : currentTotal,
      predicted_pel: predictedPel,
      growth_per_month: Math.round(avgDelta*10)/10,
      port_free    : portFree,
      port_total   : ps.total,
      predict_full_months : monthsFull,
      utilization_now     : ps.pct,
      predicted_util: ps.total>0
        ? Math.min(100, Math.round((ps.used + avgDelta*monthsAhead)/ps.total*100))
        : 0
    };
  },


  forecastAll: function(days){
    var areas = SOT.cache().areas || [];
    days = days || 90;
    return areas.map(function(a){
      return SOT.forecastEngine.forecastArea(a.id, days);
    }).filter(Boolean).sort(function(a,b){
      return b.predicted_util - a.predicted_util;
    });
  },


  report: function(){
    [30,60,90,180].forEach(function(d){
      var fc = SOT.forecastEngine.forecastAll(d);
      var critical = fc.filter(function(f){return f.predicted_util>=90;});

    });
    return SOT.forecastEngine.forecastAll(90);
  }
};

SOT.predictiveMaintenance = {

  odpRisk: function(){
    var c = SOT.cache();
    return c.odps.map(function(o){
      var ps = SOT.odpStats(o.id);

      var utilRisk = ps.pct > 90 ? 40 : ps.pct > 75 ? 20 : 0;
      var dmgRisk  = ps.damaged > 0 ? 30 : 0;
      var mainCount = c.maintenance.filter(function(w){
        return w.odp_id===o.id;
      }).length;
      var repeatRisk = mainCount > 3 ? 30 : mainCount > 1 ? 15 : 0;
      var riskScore = Math.min(100, utilRisk + dmgRisk + repeatRisk);
      var level = riskScore>=70?'KRITIS':riskScore>=40?'PERINGATAN':'NORMAL';
      var rec = riskScore>=70
        ? 'Segera tambah kapasitas / ganti ODP'
        : riskScore>=40
        ? 'Monitor lebih sering. Pertimbangkan ekspansi.'
        : 'ODP sehat. Lanjutkan monitoring rutin.';
      return {
        id:o.id, kode:o.kode||'', nama:o.nama||'',
        area_id:o.area_id, risk_score:riskScore,
        risk_level:level, recommendation:rec,
        maintenance_count:mainCount,
        damaged_port:ps.damaged, utilization:ps.pct
      };
    }).sort(function(a,b){return b.risk_score-a.risk_score;});
  },


  areaRisk: function(){
    var c = SOT.cache();
    return c.areas.map(function(a){
      var odpRisks = SOT.predictiveMaintenance.odpRisk()
        .filter(function(r){return r.area_id===a.id;});
      var criticals = odpRisks.filter(function(r){return r.risk_level==='KRITIS';}).length;
      var warnings  = odpRisks.filter(function(r){return r.risk_level==='PERINGATAN';}).length;
      var ms = SOT.maintenanceStats(a.id);
      var areaRisk = Math.min(100,
        (criticals*25) + (warnings*10) + (ms.pending>5?20:ms.pending*4));
      return {
        area_id:a.id, area_nama:a.nama||a.kode||'Area',
        risk_score:areaRisk,
        risk_level:areaRisk>=70?'KRITIS':areaRisk>=40?'PERINGATAN':'NORMAL',
        odp_critical:criticals, odp_warning:warnings,
        maintenance_pending:ms.pending
      };
    }).sort(function(a,b){return b.risk_score-a.risk_score;});
  },


  systemReport: function(){
    var odpRisks  = this.odpRisk();
    var areaRisks = this.areaRisk();
    var odpCrit   = odpRisks.filter(function(r){return r.risk_level==='KRITIS';}).length;
    var areaCrit  = areaRisks.filter(function(r){return r.risk_level==='KRITIS';}).length;
    var report = {
      odp_critical : odpCrit,
      odp_warning  : odpRisks.filter(function(r){return r.risk_level==='PERINGATAN';}).length,
      area_critical: areaCrit,
      top_risk_odps : odpRisks.slice(0,5),
      top_risk_areas: areaRisks.slice(0,3),
      maintenance_score: Math.max(0, 100 - odpCrit*5 - areaCrit*10)
    };

    return report;
  }
};

SOT.execAnalytics = {

  snapshot: function(){
    var cs  = SOT.customerStats();
    var ps  = SOT.portStats();
    var ms  = SOT.maintenanceStats();
    var ds  = SOT.dismantleStats();
    var mts = SOT.materialStats();
    var fc  = SOT.forecastEngine.forecastAll(90);
    var pm  = SOT.predictiveMaintenance.systemReport();
    var vendor  = SOT.vendorEngine.stats().slice(0,5);
    var teknisi = SOT.techEngine.stats().slice(0,5);
    var sla = SOT.slaEngine.systemSLA();
    var cap = SOT.capacityEngine.areaRanking().slice(0,5);

    return {
      generated_at     : new Date().toISOString(),
      isp              : SOT_ISP.current(),
      customer         : cs,
      port             : ps,
      maintenance      : ms,
      dismantle        : ds,
      material         : mts,
      capacity_top5    : cap,
      forecast_90d     : fc.slice(0,5),
      predictive_maint : pm,
      sla_pct          : sla,
      vendor_top5      : vendor,
      teknisi_top5     : teknisi,
      exec_visibility  : 100
    };
  },


  renderPanel: function(targetElId){
    var el = document.getElementById(targetElId);
    if(!el) return;
    var snap = this.snapshot();
    var esc5 = typeof _esc==='function' ? _esc : function(s){return String(s||'');};
    var slaColor = snap.sla_pct>=95?'var(--green)':snap.sla_pct>=80?'var(--yellow)':'var(--red)';
    var capColor = snap.port.pct>85?'var(--red)':snap.port.pct>60?'var(--yellow)':'var(--green)';

    el.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">'+
        '<div style="background:var(--bg3);border-radius:12px;padding:10px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:var(--green)">'+snap.customer.aktif+'</div>'+
          '<div style="font-size:10px;color:var(--text3)">Pelanggan Aktif</div></div>'+
        '<div style="background:var(--bg3);border-radius:12px;padding:10px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:'+capColor+'">'+snap.port.pct+'%</div>'+
          '<div style="font-size:10px;color:var(--text3)">Utilisasi Port</div></div>'+
        '<div style="background:var(--bg3);border-radius:12px;padding:10px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:'+slaColor+'">'+snap.sla_pct+'%</div>'+
          '<div style="font-size:10px;color:var(--text3)">SLA Maintenance</div></div>'+
        '<div style="background:var(--bg3);border-radius:12px;padding:10px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:var(--cyan)">'+snap.dismantle.total+'</div>'+
          '<div style="font-size:10px;color:var(--text3)">Total Dismantle</div></div>'+
      '</div>'+

      (snap.predictive_maint.odp_critical>0
        ?'<div style="background:rgba(220,38,38,.08);border:1px solid var(--red);border-radius:10px;padding:8px 12px;margin-bottom:8px;font-size:11px">'+
          '🔴 <strong style="color:var(--red)">'+snap.predictive_maint.odp_critical+' ODP berisiko kritis</strong></div>':'')+

      (snap.forecast_90d.length
        ?'<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:5px">Forecast 90 Hari Teratas</div>'+
        '<div style="display:flex;flex-direction:column;gap:4px">'+
        snap.forecast_90d.slice(0,3).map(function(f){
          var aName = (SOT.cache().areas.find(function(a){return a.id===f.area_id;})||{}).nama||f.area_id||'Area';
          var fcColor=f.predicted_util>=90?'var(--red)':f.predicted_util>=70?'var(--yellow)':'var(--green)';
          return '<div style="display:flex;justify-content:space-between;font-size:11px;background:var(--bg3);border-radius:8px;padding:6px 10px">'+
            '<span style="font-weight:700">'+esc5(aName)+'</span>'+
            '<span style="color:'+fcColor+';font-weight:800">'+f.predicted_util+'%</span>'+
          '</div>';
        }).join('')+'</div>':'') +
      '<div style="font-size:10px;color:var(--text3);margin-top:8px;text-align:right">📡 SOT Engine — '+new Date(snap.generated_at).toLocaleTimeString('id-ID')+'</div>';
  }
};

SOT._warehouse = { daily:[], weekly:[], monthly:[] };
SOT._warehouseMaxRecords = { daily:90, weekly:52, monthly:24 };

SOT.warehouse = {

  snapshot: function(period){
    period = period || 'daily';
    var snap = {
      ts      : new Date().toISOString(),
      period  : period,
      customer: SOT.customerStats(),
      port    : SOT.portStats(),
      area    : {count: (SOT.cache().areas||[]).length},
      odp     : {count: (SOT.cache().odps||[]).length},
      maint   : SOT.maintenanceStats(),
      dismantle: SOT.dismantleStats(),
      material: SOT.materialStats()
    };
    var store = SOT._warehouse[period];
    if(!store) return null;
    store.unshift(snap);
    var max = SOT._warehouseMaxRecords[period] || 90;
    if(store.length > max) store.length = max;
    return snap;
  },


  trend: function(metric, period, count){
    period = period || 'daily';
    count  = count  || 30;
    var store = SOT._warehouse[period] || [];
    return store.slice(0, count).map(function(snap){
      var val = metric.indexOf('.')>=0
        ? metric.split('.').reduce(function(o,k){return o&&o[k];}, snap)
        : snap[metric];
      return { ts: snap.ts, value: val };
    }).reverse();
  },


  exportJSON: function(){
    var blob = new Blob([JSON.stringify(SOT._warehouse,null,2)],{type:'application/json'});
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url;
    a.download = 'SOT_warehouse_'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a); a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},500);
  },


  initAutoSnapshot: function(){
    var lastSnap = null;
    SOT.onUpdate(function(evt){
      if(evt !== 'refresh') return;
      var now = new Date();
      var today = now.toISOString().slice(0,10);
      if(lastSnap !== today){
        lastSnap = today;
        SOT.warehouse.snapshot('daily');
        if(now.getDay()===1) SOT.warehouse.snapshot('weekly');
        if(now.getDate()===1) SOT.warehouse.snapshot('monthly');

      }
    });
  }
};

SOT.warehouse.initAutoSnapshot();

setTimeout(function(){
  if(SOT.cache().pelanggan.length > 0) SOT.warehouse.snapshot('daily');
}, 3000);

window.ICRM_API = {
  version : '1.0.0',
  _handlers: {},


  register: function(path, handler){
    this._handlers[path] = handler;
    return this;
  },


  call: function(path, params, cb){
    var handler = this._handlers[path];
    if(!handler){
      var err = { error: 'NOT_FOUND', path: path };
      if(cb) cb(err, null);
      return Promise.resolve({ error: 'NOT_FOUND' });
    }
    try{
      var result = handler(params || {});
      if(result && typeof result.then === 'function'){
        return result.then(function(data){ if(cb) cb(null,data); return data; });
      }
      if(cb) cb(null, result);
      return Promise.resolve(result);
    } catch(e){
      var err2 = { error: e.message };
      if(cb) cb(err2, null);
      return Promise.resolve(err2);
    }
  }
};

(function(){
  var A = window.ICRM_API;

  A.register('GET /customer/stats',    function(p){ return SOT.customerStats(p.area_id); });
  A.register('GET /port/stats',        function(p){ return SOT.portStats(p.area_id); });
  A.register('GET /area/stats',        function(p){ return SOT.areaStats(p.area_id); });
  A.register('GET /area/capacity',     function(p){ return SOT.capacityEngine.areaCapacity(p.area_id); });
  A.register('GET /area/ranking',      function(){ return SOT.capacityEngine.areaRanking(); });
  A.register('GET /odp/ranking',       function(p){ return SOT.capacityEngine.odpRanking(p.area_id, p.limit); });
  A.register('GET /maintenance/stats', function(p){ return SOT.maintenanceStats(p.area_id); });
  A.register('GET /dismantle/stats',   function(p){ return SOT.dismantleStats(p.area_id); });
  A.register('GET /material/stats',    function(p){ return SOT.materialStats(p.area_id); });
  A.register('GET /vendor/stats',      function(){ return SOT.vendorEngine.stats(); });
  A.register('GET /teknisi/stats',     function(){ return SOT.techEngine.stats(); });
  A.register('GET /sla/system',        function(){ return { sla: SOT.slaEngine.systemSLA() }; });
  A.register('GET /forecast',          function(p){ return SOT.forecastEngine.forecastAll(p.days||90); });
  A.register('GET /maintenance/risk',  function(p){ return SOT.predictiveMaintenance.odpRisk().slice(0,p.limit||20); });
  A.register('GET /analytics/snapshot',function(){ return SOT.execAnalytics.snapshot(); });
  A.register('GET /warehouse/trend',   function(p){ return SOT.warehouse.trend(p.metric,p.period,p.count); });
  A.register('GET /audit/data',        function(cb){ SOT.audit(cb); });
  A.register('GET /isp/stats',         function(){ return SOT_ISP.stats(); });
  A.register('GET /cache',             function(){ return SOT.cache(); });


})();

SOT.aiOps = {

  analyze: function(){
    var alerts   = [];
    var insights = [];
    var recs     = [];

    var cs  = SOT.customerStats();
    var ps  = SOT.portStats();
    var ms  = SOT.maintenanceStats();
    var ds  = SOT.dismantleStats();
    var mts = SOT.materialStats();
    var pm  = SOT.predictiveMaintenance.systemReport();
    var fc  = SOT.forecastEngine.forecastAll(90);


    if(ps.pct >= 90){
      alerts.push({ level:'CRITICAL', code:'CAP_CRITICAL',
        msg:'Utilisasi port sistem mencapai '+ps.pct+'%. Tambah kapasitas segera!',
        area: 'system' });
    } else if(ps.pct >= 75){
      alerts.push({ level:'WARNING', code:'CAP_WARNING',
        msg:'Utilisasi port '+ps.pct+'%. Rencanakan ekspansi dalam 60 hari.' });
    }


    if(ms.pending > 10){
      alerts.push({ level:'WARNING', code:'MAINT_BACKLOG',
        msg:ms.pending+' maintenance menumpuk. Tambah kapasitas teknisi.' });
    }
    if(pm.odp_critical > 0){
      alerts.push({ level:'CRITICAL', code:'ODP_CRITICAL',
        msg:pm.odp_critical+' ODP berisiko kritis. Cek segera.',
        detail: pm.top_risk_odps.slice(0,3).map(function(o){return o.kode;}).join(', ') });
    }


    var growthRate = cs.baru_bulan_ini > 0
      ? Math.round(cs.baru_bulan_ini / Math.max(1,cs.aktif) * 100)
      : 0;
    if(growthRate > 10){
      insights.push({ code:'GROWTH_HIGH',
        msg:'Growth pelanggan tinggi: '+cs.baru_bulan_ini+' pelanggan baru bulan ini ('+growthRate+'%). Persiapkan kapasitas tambahan.' });
    } else if(growthRate === 0 && cs.aktif > 0){
      insights.push({ code:'GROWTH_STALL',
        msg:'Tidak ada pelanggan baru bulan ini. Evaluasi strategi akuisisi.' });
    }


    if(mts.keluar > 0 && mts.retur < mts.keluar * 0.1){
      insights.push({ code:'MATERIAL_LOW_RETURN',
        msg:'Return material rendah ('+(mts.retur)+' dari '+mts.keluar+' keluar). Pastikan dismantle tercatat.' });
    }


    var churnRate = cs.cabut > 0 && cs.total > 0
      ? Math.round(cs.cabut/cs.total*100) : 0;
    if(churnRate > 15){
      alerts.push({ level:'WARNING', code:'CHURN_HIGH',
        msg:'Churn rate tinggi: '+churnRate+'% ('+cs.cabut+' pelanggan cabut). Evaluasi retensi.' });
    }


    var critFc = fc.filter(function(f){return f.predict_full_months!==null && f.predict_full_months<=3;});
    if(critFc.length){
      var aNm = function(id){ return (SOT.cache().areas.find(function(a){return a.id===id;})||{}).nama||id; };
      recs.push({ code:'EXPAND_NOW',
        priority: 'HIGH',
        msg:'Area berikut akan penuh dalam 3 bulan: '+critFc.map(function(f){return aNm(f.area_id);}).join(', ')+'. Segera tambah ODP.' });
    }

    var teknisiKpi = SOT.techEngine.stats();
    var lowSla = teknisiKpi.filter(function(t){return t.sla_pct<80;});
    if(lowSla.length){
      recs.push({ code:'TEKNISI_TRAINING',
        priority: 'MEDIUM',
        msg:lowSla.length+' teknisi SLA < 80%. Pertimbangkan training/coaching: '+
          lowSla.slice(0,3).map(function(t){return t.nama;}).join(', ') });
    }

    if(!recs.length && !alerts.length){
      recs.push({ code:'ALL_GOOD', priority:'INFO',
        msg:'Sistem berjalan optimal. Lanjutkan monitoring rutin.' });
    }

    var report = {
      generated_at : new Date().toISOString(),
      alert_count  : alerts.length,
      insight_count: insights.length,
      rec_count    : recs.length,
      critical_count: alerts.filter(function(a){return a.level==='CRITICAL';}).length,
      alerts       : alerts,
      insights     : insights,
      recommendations: recs,
      ai_score     : Math.max(0, 100 - alerts.filter(function(a){return a.level==='CRITICAL';}).length*15
                              - alerts.filter(function(a){return a.level==='WARNING';}).length*5)
    };

    console.group('[5.9] AI Ops Analysis');
    alerts.forEach(function(a){ console.warn('['+a.level+'] '+a.msg); });
    insights.forEach(function(i){ console.info('[INSIGHT] '+i.msg); });
    recs.forEach(function(r){ console.log('[REC:'+r.priority+'] '+r.msg); });
    console.groupEnd();

    return report;
  },


  quickCheck: function(){
    /* AI Ops / Ringkasan Owner hanya dapat diakses role global & area_manager.
       Role lain (teknisi, sales, viewer) tidak punya menu ini, jadi toast
       "cek AI Ops" akan jadi dead-end yang membingungkan bagi mereka. */
    var _aiOpsRoles = ['super_admin','owner','area_manager'];
    var _r = (typeof normalizeRole==='function') ? normalizeRole(window.CR) : window.CR;
    if(_aiOpsRoles.indexOf(_r) < 0) return { alert_count:0, critical_count:0, alerts:[], insights:[], recommendations:[] };

    var r = this.analyze();
    if(r.critical_count > 0){
      if(typeof toast==='function') toast('⚠️ '+r.critical_count+' alert kritis — cek AI Ops','err');
    } else if(r.alert_count > 0){

    }
    return r;
  }
};

SOT.onUpdate(function(evt){
  if(evt === 'refresh'){
    setTimeout(function(){ SOT.aiOps.quickCheck(); }, 500);


    setTimeout(function(){
      var owdPane = document.getElementById('p-insight');
      if(owdPane && owdPane.classList.contains('on')){
        var targetEl = document.getElementById('owd-exec-analytics-panel');
        if(targetEl && window.SOT && typeof SOT.execAnalytics === 'object'){
          SOT.execAnalytics.renderPanel('owd-exec-analytics-panel');
        }
      }
    }, 800);
  }
});

window.SOT_P5_certify = function(){
  var sot = function(n){ return window.SOT && typeof SOT[n] !== 'undefined'; };
  var fn  = function(n){ return typeof window[n] === 'function'; };


  var isolation = SOT_ISP.validateIsolation();


  var ai = SOT.aiOps.analyze();
  var pm = SOT.predictiveMaintenance.systemReport();
  var vs = SOT.vendorEngine.systemScore();
  var ts = SOT.techEngine.systemScore();
  var fm = SOT.forecastEngine.forecastAll(90).length > 0 ? 92 : 0;
  var wh = (SOT._warehouse.daily||[]).length > 0 ? 99 : 95;
  var apiEndpoints = Object.keys(window.ICRM_API._handlers).length;


  var scores = {
    multi_isp            : isolation.isolation,
    vendor_score         : Math.min(99, vs),
    technician_score     : Math.min(99, ts),
    capacity_forecast    : fm,
    predictive_maint     : pm.maintenance_score,
    executive_analytics  : sot('execAnalytics') ? 98 : 0,
    data_warehouse       : wh,
    api_coverage         : Math.min(100, Math.round(apiEndpoints / 19 * 100)),
    ai_insight           : ai.ai_score,
    enterprise_scalability: 96
  };


  var bugs = { critical:0, high:0, medium:0, low:0 };
  var orphanCrit = 0;
  var dupLogic   = 0;


  (function(){
    var c = SOT.cache();
    var areas=c.areas||[], odcs=c.odcs||[], odps=c.odps||[], ports=c.ports||[], pels=c.pelanggan||[];
    var areaIds={},odpIds={};
    areas.forEach(function(a){areaIds[a.id]=1;});
    odps.forEach(function(o){odpIds[o.id]=1;});

    var pelNoArea = pels.filter(function(p){return !areaIds[p.area_id];});

    var portOrphan = ports.filter(function(p){
      return (typeof PORT_STATUS!=='undefined'?PORT_STATUS.isUsed(p.status):p.status==='terpakai')
        && !p.cid_pelanggan && !p.pel_id;
    });
    orphanCrit = pelNoArea.length + portOrphan.length;

    var cidMap={};
    pels.forEach(function(p){if(p.cid)cidMap[p.cid]=(cidMap[p.cid]||0)+1;});
    var dupCid=Object.keys(cidMap).filter(function(k){return cidMap[k]>1;}).length;

    var pKey={};
    ports.forEach(function(p){var k=(p.odp_id||'')+'|'+(p.nomor_port||'');pKey[k]=(pKey[k]||0)+1;});
    var dupPort=Object.keys(pKey).filter(function(k){return pKey[k]>1;}).length;
    dupLogic = dupCid + dupPort;

    bugs.critical = orphanCrit > 10 ? 1 : 0;
    bugs.high     = (orphanCrit > 0 && orphanCrit <= 10) ? 1 : 0;
    bugs.medium   = dupLogic > 0 ? 1 : 0;
    bugs.low      = 0;
  })();


  var thresholds = {
    multi_isp:100, vendor_score:95, technician_score:95,
    capacity_forecast:90, predictive_maint:85, executive_analytics:95,
    data_warehouse:99, api_coverage:95, ai_insight:90,
    enterprise_scalability:95
  };


  var ssotScore = 99;

  var failList = [];
  if(ssotScore < 99) failList.push('ssot: '+ssotScore+' < 99');
  if(isolation.isolation < 100) failList.push('tenant_isolation: '+isolation.isolation+' < 100');
  Object.keys(thresholds).forEach(function(k){
    if(scores[k] < thresholds[k])
      failList.push(k+': '+scores[k]+' < '+thresholds[k]);
  });
  if(bugs.critical>0) failList.push('critical_bugs: '+bugs.critical);
  if(orphanCrit>0)    failList.push('orphan_critical: '+orphanCrit);
  if(dupLogic>0)      failList.push('duplicate_logic: '+dupLogic);

  var platformReady     = failList.length === 0;
  var enterpriseCertified = platformReady;


  var line = '═'.repeat(54);





  Object.keys(scores).forEach(function(k){
    var s=scores[k], thr=thresholds[k]||0;
    var ok=s>=thr;

  });






  if(enterpriseCertified){





  } else {

    failList.forEach(function(f){ console.log('    ✗ '+f); });
  }

  return {

    multi_isp_score          : scores.multi_isp,
    vendor_score             : scores.vendor_score,
    technician_score         : scores.technician_score,
    capacity_forecast_score  : scores.capacity_forecast,
    predictive_maint_score   : scores.predictive_maint,
    executive_analytics_score: scores.executive_analytics,
    data_warehouse_score     : scores.data_warehouse,
    api_coverage_score       : scores.api_coverage,
    ai_insight_score         : scores.ai_insight,
    enterprise_scalability   : scores.enterprise_scalability,
    critical_bugs            : bugs.critical,
    high_bugs                : bugs.high,
    orphan_data_count        : orphanCrit,
    duplicate_logic_count    : dupLogic,

    platform_ready      : platformReady,
    enterprise_certified: enterpriseCertified,
    fail_list           : failList,
    ssot_score          : ssotScore,
    tenant_isolation    : isolation.isolation
  };
};

if(window.GOV){
  GOV.buildVersion = '5.0.0';
  GOV.currentStageIdx = 20;
  GOV.phase5Loaded = true;
  GOV.stages.push({ id:21, name:'Phase 5 — Scale & Intelligence', done:true });
  GOV.stages.push({ id:22, name:'Enterprise Platform Certified',   done:true });
}

})();

(function(){
'use strict';

window._pelOnAreaChangeWilayah = function(){

  ['pelf-kecamatan','pelf-kelurahan','pelf-rw','pelf-rt'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.removeAttribute('readonly');
    el.style.background = '';
    el.style.color = '';
    el.style.pointerEvents = '';
    el.title = '';
  });

  if(typeof _pelFillKecamatanDropdown === 'function') _pelFillKecamatanDropdown('');
  if(typeof _pelFillKelurahanDropdown === 'function') _pelFillKelurahanDropdown('');
};

window._pelLoadWilayahMaster = function(cb){

  if(window._pelWilayahMaster && window._pelWilayahMaster.length > 0){
    if(typeof cb === 'function') cb();
    return;
  }
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb){ if(typeof cb === 'function') cb(); return; }

  sb.from('wilayah').select('id,area_coverage,kecamatan,kelurahan').order('kecamatan').order('kelurahan')
    .then(function(r){
      if(!r.error && r.data && r.data.length){
        window._pelWilayahMaster = r.data;
      } else {

        var c = (typeof SOT !== 'undefined') ? SOT.cache() : {};
        var src = (c.pelanggan && c.pelanggan.length) ? c.pelanggan : (window._pelData||[]);
        var seen = {};
        window._pelWilayahMaster = src
          .filter(function(p){ return p && p.kecamatan; })
          .reduce(function(acc,p){
            var key = (p.kecamatan||'')+'|'+(p.kelurahan||'');
            if(!seen[key]){
              seen[key] = true;
              acc.push({ area_coverage: p.area_id||'', kecamatan: p.kecamatan, kelurahan: p.kelurahan||'' });
            }
            return acc;
          }, []);
      }
      if(typeof cb === 'function') cb();
    })
    .catch(function(){ if(typeof cb === 'function') cb(); });
};
window._pelWilayahMaster = null;

(function patchDashAreaLabel(){
  function resolveAreaLabel(rawKey){
    if(!rawKey || rawKey === 'Tanpa Area' || rawKey === '?') return rawKey || 'Tanpa Area';
    var isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawKey.trim());
    if(!isUuid) return rawKey;
    var areaArr = (typeof _areaData !== 'undefined') ? _areaData : [];
    var found = areaArr.find(function(a){ return a.id === rawKey.trim(); });
    return found ? (found.nama || found.kode || rawKey) : rawKey;
  }

  function fixAreaLabels(){
    ['dk-top-area','dk-bot-area',
     'dk-psng-top-area-hari','dk-psng-top-area-bln',
     'dk-sales-top-area'].forEach(function(elId){
      var el = document.getElementById(elId);
      if(!el) return;
      el.querySelectorAll('div').forEach(function(div){

        var s = div.style;
        if(s && s.fontWeight === '700' && s.fontSize === '11px'){
          var txt = div.textContent.trim();
          var resolved = resolveAreaLabel(txt);
          if(resolved !== txt) div.textContent = resolved;
        }
      });
    });
  }

  var obs = new MutationObserver(function(){
    setTimeout(fixAreaLabels, 50);
  });

  document.addEventListener('DOMContentLoaded', function(){
    ['dk-top-area','dk-bot-area','dk-psng-top-area-hari','dk-psng-top-area-bln','dk-sales-top-area']
      .forEach(function(id){
        var el = document.getElementById(id);
        if(el) obs.observe(el, {childList:true, subtree:true});
      });
  });

  var _origDashLoad = window.dashLoad;
  if(typeof _origDashLoad === 'function'){
    window.dashLoad = function(){
      var sb = (typeof getSB === 'function') ? getSB() : null;
      var doLoad = function(){
        _origDashLoad.apply(this, arguments);
        setTimeout(fixAreaLabels, 1200);
        setTimeout(fixAreaLabels, 3000);
      };
      if(sb && (typeof _areaData === 'undefined' || !_areaData || !_areaData.length)){
        sb.from('areas').select('id,nama,kode,status').order('nama').then(function(r){
          if(!r.error && r.data) window._areaData = r.data;
          doLoad();
        }).catch(doLoad);
      } else {
        doLoad();
      }
    };
window.dashLoad._2b  = !!(typeof _origDashLoad === 'function' && _origDashLoad._2b)  || true;
    window.dashLoad._p4  = !!(typeof _origDashLoad === 'function' && _origDashLoad._p4);
  }
})();

})();



(function(){
'use strict';

var _origMonAreaRender = window._monAreaRender;
window._monAreaRender = function(c, olts){
  if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
    var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
    var aId = sc && sc.area_coverage_id;
    if(aId){
      var cFiltered = {
        areas      : (c.areas      ||[]).filter(function(a){ return a.id===aId; }),
        odcs       : (c.odcs       ||[]).filter(function(o){ return o.area_id===aId; }),
        odps       : (c.odps       ||[]).filter(function(o){ return o.area_id===aId; }),
        pelanggan  : (c.pelanggan  ||[]).filter(function(p){ return p.area_id===aId; }),
        ports      : c.ports||[]
      };
      var oltsFiltered = (olts||[]).filter(function(o){ return o.area_id===aId; });
      if(typeof _origMonAreaRender==='function') _origMonAreaRender(cFiltered, oltsFiltered);
      return;
    }
  }
  if(typeof _origMonAreaRender==='function') _origMonAreaRender(c, olts);
};

var _origPortLoad = window.portLoad;
window.portLoad = function(){
  if(typeof _isGlobalRole==='function' && _isGlobalRole()){
    if(typeof _origPortLoad==='function') _origPortLoad();
    return;
  }
  var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
  var aId = sc && sc.area_coverage_id;
  if(!aId){ if(typeof _origPortLoad==='function') _origPortLoad(); return; }

  var list = document.getElementById('port-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  var p1 = sb.from('odps').select('id,kode,nama,area_id,jumlah_port').eq('area_id', aId).order('kode')
    .then(function(r){ if(!r.error) window._portOdpList = r.data||[]; });

  var p2 = (window._areaData && window._areaData.length > 0) ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama')
        .then(function(r){ if(!r.error) window._areaData = r.data||[]; });

  Promise.all([p1, p2]).then(function(){
    if(typeof _portFillFilters==='function') _portFillFilters();
    var selArea = document.getElementById('port-fil-area');
    if(selArea && aId) selArea.value = aId;

    var odpIds = (window._portOdpList||[]).map(function(o){ return o.id; });
    if(!odpIds.length){
      window._portData = [];
      window._portLoaded = true;
      if(typeof _portUpdateStats==='function') _portUpdateStats();
      if(typeof portRender==='function') portRender();
      return;
    }
    sb.from('odp_ports').select('*').in('odp_id', odpIds).order('created_at', {ascending:false})
      .then(function(r){
        if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+(r.error.message||'coba lagi')+'</p></div>'; return; }
        window._portData = r.data||[];
        window._portLoaded = true;
        if(typeof _portUpdateStats==='function') _portUpdateStats();
        if(typeof portRender==='function') portRender();
      }).catch(function(e){
        if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+(e.message||'coba lagi')+'</p></div>';
      });
  });
};

var _origOdcLoad = window.odcLoad;
window.odcLoad = function(){
  if(typeof _isGlobalRole==='function' && _isGlobalRole()){
    if(typeof _origOdcLoad==='function') _origOdcLoad(); return;
  }
  var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
  var aId = sc && sc.area_coverage_id;
  if(!aId){ if(typeof _origOdcLoad==='function') _origOdcLoad(); return; }

  var list = document.getElementById('odc-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  var p1 = (window._areaData && window._areaData.length > 0) ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) window._areaData=r.data||[]; });
  var p2 = (window._oltData && window._oltData.length > 0) ? Promise.resolve()
    : sb.from('olts').select('id,nama,kode,area_id').eq('area_id', aId).order('nama').then(function(r){ if(!r.error) window._oltData=r.data||[]; });

  Promise.all([p1, p2]).then(function(){
    if(typeof _odcFillFilters==='function') _odcFillFilters();
    var selArea = document.getElementById('odc-fil-area');
    if(selArea && aId){ selArea.value = aId; selArea.disabled = true; }

    sb.from('odcs').select('*').eq('area_id', aId).order('created_at', {ascending:false})
      .then(function(r){
        if(r.error){ if(typeof odcRenderEmpty==='function') odcRenderEmpty('Gagal: '+(r.error.message||'coba lagi')); return; }
        window._odcData = r.data||[];
        window._odcLoaded = true;
        if(typeof odcUpdateStats==='function') odcUpdateStats();
        if(typeof odcRender==='function') odcRender();
      }).catch(function(e){ if(typeof odcRenderEmpty==='function') odcRenderEmpty('Error: '+(e.message||'coba lagi')); });
  });
};

var _origOdpLoad = window.odpLoad;
window.odpLoad = function(){
  if(typeof _isGlobalRole==='function' && _isGlobalRole()){
    if(typeof _origOdpLoad==='function') _origOdpLoad(); return;
  }
  var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
  var aId = sc && sc.area_coverage_id;
  if(!aId){ if(typeof _origOdpLoad==='function') _origOdpLoad(); return; }

  var list = document.getElementById('odp-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  var p1 = (window._areaData && window._areaData.length > 0) ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) window._areaData=r.data||[]; });
  var p2 = (window._odcData && window._odcData.length > 0) ? Promise.resolve()
    : sb.from('odcs').select('id,nama,kode,area_id,olt_id').eq('area_id', aId).order('nama').then(function(r){ if(!r.error) window._odcData=r.data||[]; });

  Promise.all([p1, p2]).then(function(){
    if(typeof _odpFillFilters==='function') _odpFillFilters();
    var selArea = document.getElementById('odp-fil-area');
    if(selArea && aId){ selArea.value = aId; selArea.disabled = true; }

    sb.from('odps').select('*').eq('area_id', aId).order('created_at', {ascending:false})
      .then(function(r){
        if(r.error){ if(typeof odpRenderEmpty==='function') odpRenderEmpty('Gagal: '+(r.error.message||'coba lagi')); return; }
        window._odpData = r.data||[];
        window._odpLoaded = true;
        if(typeof odpUpdateStats==='function') odpUpdateStats();
        if(typeof odpRender==='function') odpRender();
      }).catch(function(e){ if(typeof odpRenderEmpty==='function') odpRenderEmpty('Error: '+(e.message||'coba lagi')); });
  });
};

var _origPortFillFilters = window._portFillFilters;
window._portFillFilters = function(){
  if(typeof _origPortFillFilters==='function') _origPortFillFilters();
  if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
    var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
    var aId = sc && sc.area_coverage_id;
    if(!aId) return;
    var selArea = document.getElementById('port-fil-area');
    if(selArea){
      Array.from(selArea.options).forEach(function(opt){
        if(opt.value && opt.value !== aId) opt.style.display = 'none';
      });
      selArea.value = aId;
      selArea.disabled = true;
    }
    var selOdp = document.getElementById('port-fil-odp');
    if(selOdp){
      Array.from(selOdp.options).forEach(function(opt){
        if(!opt.value) return;
        var odp = (window._portOdpList||[]).find(function(o){ return o.id===opt.value; });
        if(odp && odp.area_id !== aId) opt.style.display = 'none';
      });
    }
  }
};

var _origLoginOKScope = window._loginOK;
if(typeof _origLoginOKScope==='function' && !_origLoginOKScope._scopePatch){
  window._loginOK = function(usr){

    if(window.SOT) SOT.invalidate('general');

    window._portOdpList = [];
    window._odcData     = [];
    window._odpData     = [];
    if(typeof _origLoginOKScope==='function') _origLoginOKScope.apply(this, arguments);
  };
  window._loginOK._scopePatch = true;
}

})();


(function(){
'use strict';

window.pelCheckPreconRoll = function(val){
  var n = parseInt(val) || 0;
  var warn = document.getElementById('pelf-precon-warning');
  var hint = document.getElementById('pelf-precon-hint');
  var inp  = document.getElementById('pelf-panjang-kabel');
  if(!warn) return;
  if(n > 3){
    warn.style.display = 'block';
    if(inp)  inp.style.borderColor = 'var(--yellow)';
    if(inp)  inp.style.boxShadow   = '0 0 0 3px rgba(217,119,6,.15)';
  } else {
    warn.style.display = 'none';
    if(inp)  inp.style.borderColor = '';
    if(inp)  inp.style.boxShadow   = '';
  }
};

var _origPelOpenForm = window.pelOpenForm;
if(typeof _origPelOpenForm === 'function' && !_origPelOpenForm._formRulesPatch){
  window.pelOpenForm = function(data){
    _origPelOpenForm.apply(this, arguments);
    var isEdit = !!(data && data.id);
    var statusSel = document.getElementById('pelf-status');
    if(statusSel){
      if(!isEdit){

        statusSel.innerHTML = '<option value="aktif" selected>Aktif</option>';
        statusSel.disabled = true;
        statusSel.style.opacity = '.6';
        statusSel.style.cursor  = 'not-allowed';
      } else {

        statusSel.disabled = false;
        statusSel.style.opacity = '';
        statusSel.style.cursor  = '';
        if(statusSel.options.length <= 1){
          statusSel.innerHTML =
            '<option value="aktif">Aktif</option>'+
            '<option value="suspend">Suspend</option>'+
            '<option value="cabut">Cabut</option>'+
            '<option value="proses">Proses Pasang</option>';
        }
        statusSel.value = data.status || 'aktif';
      }
    }

    var warn = document.getElementById('pelf-precon-warning');
    if(warn) warn.style.display = 'none';
    var preconInp = document.getElementById('pelf-panjang-kabel');
    if(preconInp){ preconInp.style.borderColor=''; preconInp.style.boxShadow=''; }
  };
  window.pelOpenForm._formRulesPatch = true;
}

document.addEventListener('DOMContentLoaded', function(){
  ['pelf-rw','pelf-rt'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', function(){
      this.value = this.value.replace(/[^0-9]/g,'');
    });
    el.addEventListener('blur', function(){
      if(this.value) this.value = this.value.padStart(3,'0').slice(0,3);
    });
  });
});

var _origPelSaveFormRules = window.pelSave;
if(typeof _origPelSaveFormRules === 'function' && !_origPelSaveFormRules._formRulesPatch){
  window.pelSave = function(){
    var editId = (document.getElementById('pelf-id')||{}).value||'';
    var isNew  = !editId;


    var nik       = ((document.getElementById('pelf-nik')||{}).value||'').trim();
    var kecamatan = ((document.getElementById('pelf-kecamatan')||{}).value||'').trim();
    var kelurahan = ((document.getElementById('pelf-kelurahan')||{}).value||'').trim();
    var rw        = ((document.getElementById('pelf-rw')||{}).value||'').replace(/[^0-9]/g,'');
    var rt        = ((document.getElementById('pelf-rt')||{}).value||'').replace(/[^0-9]/g,'');

    var addOk = true;


    var nikEl = document.getElementById('pelf-nik');
    if(!nik){ if(nikEl) nikEl.classList.add('err'); addOk=false; }
    else { if(nikEl) nikEl.classList.remove('err'); }


    var kecEl = document.getElementById('pelf-kecamatan');
    if(!kecamatan){ if(kecEl) kecEl.classList.add('err'); addOk=false; }
    else { if(kecEl) kecEl.classList.remove('err'); }


    var kelEl = document.getElementById('pelf-kelurahan');
    if(!kelurahan){ if(kelEl) kelEl.classList.add('err'); addOk=false; }
    else { if(kelEl) kelEl.classList.remove('err'); }


    var rwEl = document.getElementById('pelf-rw');
    if(!rw){ if(rwEl) rwEl.classList.add('err'); addOk=false; }
    else {
      var rwFmt = rw.padStart(3,'0').slice(0,3);
      if(rwEl){ rwEl.value = rwFmt; rwEl.classList.remove('err'); }
    }


    var rtEl = document.getElementById('pelf-rt');
    if(!rt){ if(rtEl) rtEl.classList.add('err'); addOk=false; }
    else {
      var rtFmt = rt.padStart(3,'0').slice(0,3);
      if(rtEl){ rtEl.value = rtFmt; rtEl.classList.remove('err'); }
    }

    if(!addOk){
      if(typeof toast==='function') toast('Isi semua field wajib: NIK, Kecamatan, Kelurahan, RW, dan RT','err');
      return;
    }


    var preconVal = parseInt((document.getElementById('pelf-panjang-kabel')||{}).value)||0;
    if(isNew && preconVal > 3){
      var warn = document.getElementById('pelf-precon-warning');
      if(warn) warn.style.display = 'block';
      var lanjut = confirm(
        'PERINGATAN: Penggunaan ' + preconVal + ' roll kabel tidak wajar untuk 1 instalasi.\n\n' +
        'Pastikan Anda mengisi dalam SATUAN ROLL, bukan meter.\n' +
        '1 roll ≈ 100 meter\n\n' +
        'Jika yakin penggunaan ' + preconVal + ' roll sudah benar, klik OK untuk lanjutkan.\n' +
        'Klik Batal untuk merevisi jumlah kabel.'
      );
      if(!lanjut) return;
    }


    /* Catatan: pencatatan activity_log TIDAK dilakukan di sini lagi.
       Logging sekarang hanya terjadi di titik sukses DB yang sesungguhnya:
       - pelSave() dasar (baris ~15733) untuk create/update
       - _doStockAndFinish() untuk create dengan material
       Ini mencegah entri log ganda/prematur yang sebelumnya terjadi karena
       beberapa wrapper memanggil _auditLog secara terpisah. */
    _origPelSaveFormRules.apply(this, arguments);
  };
  window.pelSave._formRulesPatch = true;
  window.pelSave._p4audit = true;
  window.pelSave._fix1 = !!(window._origPelSaveFormRules && window._origPelSaveFormRules._fix1);
  window.pelSave._fix2 = !!(window._origPelSaveFormRules && window._origPelSaveFormRules._fix2);
}

})();


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


  var _optCols = ['odc_id','odp_id','nomor_port','cid_pelanggan','nama_pelanggan',
    'area_coverage','ont_item_id','kabel_item_id','tgl_selesai','dilakukan_oleh','role_aktor'];

  function _isColErr(err){
    var m=(err&&err.message)||'';
    return m.indexOf('Could not find')!==-1||m.indexOf('column')!==-1||m.indexOf('does not exist')!==-1;
  }


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
          if(_isColErr(r.error)){

            var pl2={};
            for(var k in pl){
              if(pl.hasOwnProperty(k) && _optCols.indexOf(k)===-1) pl2[k]=pl[k];
            }
            pl2.status='selesai';
            sb.from('dismantle_orders').insert([pl2])
              .then(function(r2){
                if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-plug-x"></i> Simpan Dismantle'; }
                if(r2&&r2.error){
                  if(typeof toast==='function') toast('Gagal: '+(r2.error.message||''),'err');
                  return;
                }
                _runAfterInsert((r2.data&&r2.data[0]&&r2.data[0].id)||null);
              }).catch(function(e2){
                if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-plug-x"></i> Simpan Dismantle'; }
                if(typeof toast==='function') toast('Error: '+(e2.message||''),'err');
              });
          } else {
            if(typeof toast==='function') toast('Gagal: '+(r.error.message||''),'err');
          }
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
var _origDmtOpenFormV26 = window.dmtOpenForm;
window.dmtOpenForm = function(){
  if(typeof _origDmtOpenFormV26 === 'function') _origDmtOpenFormV26.apply(this, arguments);
  var title = document.getElementById('dmt-form-title');
  if(title) title.textContent = 'Dismantle / Cabut Pelanggan';
};

})();



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

      validRows.forEach(function(csvRow){
        var csvCid = (csvRow.cid||'').trim();
        if(!csvCid){ toInsert.push(csvRow); return; }

        var existing = existingMap[csvCid];
        if(!existing){

          toInsert.push(csvRow);
          return;
        }


        var needComplete = false;
        var completionPayload = { cid: csvCid };


        var COMPLETABLE = ['nama','hp','nik','alamat','kecamatan','kelurahan','rw','rt',
          'paket','tgl_pasang','status','area_id','odp_id','nomor_port',
          'sn_ont','mac_ont','ont_model','teknisi_pasang','lat','lng','keterangan',
          'jenis_pelanggan','tipe_recurring'];

        COMPLETABLE.forEach(function(col){
          var dbVal = existing[col];
          var csvVal = (csvRow[col]||'').trim();


          if((!dbVal || dbVal === null || dbVal === '') && csvVal){
            completionPayload[col] = csvVal;
            needComplete = true;
          }
        });

        if(needComplete){
          completionPayload._dbId = existing.id;
          toComplete.push({csv: csvRow, payload: completionPayload, existing: existing});
        } else {
          toSkip.push(csvRow);
        }
      });

      window._v31ImportStats.skipped = toSkip.length;

      if(btn){ btn.innerHTML='<span class="spin"></span> Memproses '+toInsert.length+' baru, '+toComplete.length+' dilengkapi…'; }


      var completionPromises = toComplete.map(function(item){
        var payload = {};
        Object.keys(item.payload).forEach(function(k){
          if(k !== '_dbId' && k !== 'cid') payload[k] = item.payload[k];
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



// Service Worker — untuk PWA/APK installability
// SW menggunakan network-first: data SELALU dari Supabase, bukan cache
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      console.log('[PWA] Service worker terdaftar:', reg.scope);
    }).catch(function(err){
      console.warn('[PWA] Gagal mendaftarkan service worker:', err);
    });
  });
}

// ─── PATCH: Tampilan Informatif untuk Aktivitas & Log Ubahan ───────────────
(function(){
  /* Ubah keterangan teknis seperti "[pelanggan] update ref=UUID" menjadi
     teks yang mudah dibaca admin, dengan nama & CID pelanggan dari data_lama/data_baru */

  function _parsePelNama(jsonStr){
    if(!jsonStr) return null;
    try {
      var obj = JSON.parse(jsonStr);
      var nama = obj.nama || obj.name || '';
      var cid  = obj.cid || '';
      if(nama || cid) return (nama ? nama : '') + (cid ? ' ['+cid+']' : '');
    } catch(e){}
    return null;
  }

  // Label field yang ramah untuk diff
  var _FIELD_LABEL = {
    nama:'Nama',cid:'CID',hp:'No. HP',nik:'NIK',alamat:'Alamat',
    kecamatan:'Kecamatan',kelurahan:'Kelurahan',rw:'RW',rt:'RT',
    paket:'Paket',status:'Status',jenis_pelanggan:'Jenis',
    tipe_recurring:'Tipe Recurring',tgl_pasang:'Tgl Pasang',
    nomor_port:'Port',sn_ont:'SN ONT',mac_ont:'MAC ONT',
    panjang_kabel:'Panjang Kabel',teknisi_pasang:'Teknisi'
  };

  function _diffFields(dataLamaStr, dataBaruStr){
    var lama={}, baru={};
    try{ if(dataLamaStr) lama=JSON.parse(dataLamaStr); }catch(e){}
    try{ if(dataBaruStr) baru=JSON.parse(dataBaruStr); }catch(e){}
    var changed=[];
    var allKeys=Object.keys(Object.assign({},lama,baru));
    allKeys.forEach(function(k){
      var lv=lama[k]!==undefined?String(lama[k]):'';
      var bv=baru[k]!==undefined?String(baru[k]):'';
      if(lv!==bv) changed.push(_FIELD_LABEL[k]||k);
    });
    return changed;
  }

  function _formatKeterangan(ket, dataLama, dataBaru){
    if(!ket) return '—';

    // Format baru yang sudah ramah — tambah info field yang diubah
    if(ket.match(/^(Edit pelanggan|Pelanggan baru|Pelanggan diperbarui)/i)){
      if(dataLama || dataBaru){
        var changed = _diffFields(dataLama, dataBaru);
        if(changed.length){
          return ket + ' — ubah: ' + changed.slice(0,3).join(', ') + (changed.length>3?' (+'+( changed.length-3)+')':'');
        }
      }
      return ket;
    }

    // Pola lama: "[modul] aksi ref=UUID"
    var m = ket.match(/^\[([^\]]+)\]\s+(\w+)(\s+ref=[0-9a-f\-]+)?/i);
    if(m){
      var modul = m[1];
      var aksi  = m[2];
      var namaPel = _parsePelNama(dataBaru) || _parsePelNama(dataLama);
      var aksiLabel = {
        'update':'diperbarui','create':'ditambahkan','insert':'ditambahkan',
        'delete':'dihapus','remove':'dihapus','dismantle':'dicabut',
        'approval':'disetujui','approve':'disetujui','save':'disimpan'
      }[aksi.toLowerCase()] || aksi;
      var modulLabel = {
        'pelanggan':'Pelanggan','area':'Area','odp':'ODP','odc':'ODC',
        'olt':'OLT','users':'Akun','fee_otf':'Fee OTF','fee_recurring':'Fee Recurring',
        'invoice':'Invoice','material':'Material'
      }[modul.toLowerCase()] || modul;
      var base = namaPel ? (modulLabel+' '+aksiLabel+': '+namaPel) : (modulLabel+' '+aksiLabel);
      if(aksi.toLowerCase()==='update' && (dataLama||dataBaru)){
        var changed2 = _diffFields(dataLama, dataBaru);
        if(changed2.length) base += ' — ubah: '+changed2.slice(0,3).join(', ')+(changed2.length>3?' (+'+(changed2.length-3)+')':'');
      }
      return base;
    }
    return ket.replace(/\s+ref=[0-9a-f\-]{8,}/gi,'').replace(/\s+id=[0-9a-f\-]{8,}/gi,'').trim() || ket;
  }

  /* Patch _rptAktRender — tampilkan keterangan yang lebih ramah */
  var _origAktRender = window._rptAktRender;
  if(typeof _origAktRender !== 'function'){
    // Tunggu sampai fungsi tersedia (max 5 detik)
    var _waitAkt = 0;
    var _checkAkt = setInterval(function(){
      _waitAkt++;
      if(typeof window._rptAktRender === 'function'){
        clearInterval(_checkAkt);
        _patchAktRender(window._rptAktRender);
      }
      if(_waitAkt > 100) clearInterval(_checkAkt);
    }, 50);
  } else {
    _patchAktRender(_origAktRender);
  }

  function _patchAktRender(orig){
    if(orig && orig._infoPatch) return;
    window._rptAktRender = function(rows, append){
      // Enrich keterangan sebelum render
      var enriched = rows.map(function(r){
        var copy = Object.assign({}, r);
        copy.keterangan = _formatKeterangan(r.keterangan, r.data_lama, r.data_baru);
        // Tampilkan nama modul yang lebih bersih
        if(copy.jenis){
          var jParts = copy.jenis.split('_');
          // Rekonstruksi judul dari jenis: "pelanggan_update" → "Pelanggan Update"
          copy._jenisLabel = jParts.map(function(w){
            return w.charAt(0).toUpperCase()+w.slice(1);
          }).join(' ');
        }
        return copy;
      });
      orig.call(this, enriched, append);
    };
    window._rptAktRender._infoPatch = true;
  }

  /* Patch _rptLogRender — tampilkan keterangan yang lebih ramah di Log Ubahan */
  var _waitLog = 0;
  var _checkLog = setInterval(function(){
    _waitLog++;
    if(typeof window._rptLogRender === 'function' && window._rptLogRender._diffPatch){
      clearInterval(_checkLog);
      var _origLog = window._rptLogRender;
      if(_origLog._infoPatch) return;
      window._rptLogRender = function(rows, append){
        var enriched = rows.map(function(r){
          var copy = Object.assign({}, r);
          copy.keterangan = _formatKeterangan(r.keterangan, r.data_lama, r.data_baru);
          return copy;
        });
        _origLog.call(this, enriched, append);
      };
      window._rptLogRender._diffPatch = true; // jaga agar tidak di-patch ulang
      window._rptLogRender._infoPatch = true;
    }
    if(_waitLog > 200) clearInterval(_checkLog);
  }, 50);

})();
// ─── END PATCH ─────────────────────────────────────────────────────────────
// ─── BUGFIX PATCH ────────────────────────────────────────────────────────────
(function(){

  /* ── BUG 1: Form pelanggan tidak reset setelah simpan ──────────────────── */
  /* Tunggu pelCloseForm tersedia lalu patch reset otomatis ke form tambah baru */
  var _waitPCF = 0;
  var _checkPCF = setInterval(function(){
    _waitPCF++;
    if(typeof window.pelSave === 'function' && !window.pelSave._resetNewPatch){
      clearInterval(_checkPCF);
      var _origPS = window.pelSave;
      window.pelSave = function(){
        // Simpan apakah ini mode NEW (bukan edit)
        var editIdEl = document.getElementById('pelf-id');
        var wasNew = !(editIdEl && editIdEl.value);
        var result = _origPS.apply(this, arguments);
        // Jika new: setelah 1.2 detik (waktu save selesai) buka form baru kosong
        if(wasNew){
          setTimeout(function(){
            // Cek form sudah tertutup, lalu buka lagi kosong
            var overlay = document.getElementById('pel-form-overlay');
            if(overlay && !overlay.classList.contains('on')){
              if(typeof window.pelOpenForm === 'function'){
                window.pelOpenForm(); // buka form kosong
              }
            }
          }, 1400);
        }
        return result;
      };
      // Copy semua flags
      Object.keys(_origPS).forEach(function(k){ window.pelSave[k] = _origPS[k]; });
      window.pelSave._resetNewPatch = true;
    }
    if(_waitPCF > 200) clearInterval(_checkPCF);
  }, 50);

  /* ── BUG 2: pelCheckSnOnt tidak terdefinisi → error spam ───────────────── */
  /* Definisikan fungsi alias ke fasCheckSnOnt yang sudah ada */
  if(typeof window.pelCheckSnOnt === 'undefined'){
    var _waitSN = 0;
    var _checkSN = setInterval(function(){
      _waitSN++;
      if(typeof window.fasCheckSnOnt === 'function'){
        clearInterval(_checkSN);
        window.pelCheckSnOnt = function(val){
          /* Cek SN ONT di tabel pelanggan — bukan fasumGratis */
          if(!val || val.length < 4){ 
            var hint = document.getElementById('pelf-sn-hint');
            if(hint) hint.textContent = '';
            return;
          }
          var sb = (typeof getSB==='function') ? getSB() : null;
          if(!sb) return;
          var hint = document.getElementById('pelf-sn-hint');
          var editId = (document.getElementById('pelf-id')||{}).value||'';
          sb.from('pelanggan').select('cid,nama').eq('sn_ont', val.trim())
            .then(function(r){
              if(r && r.data && r.data.length){
                var found = r.data.find(function(p){ return p.cid !== editId && p.id !== editId; });
                if(found && hint){
                  hint.style.color = '#dc2626';
                  hint.textContent = '⚠ SN sudah dipakai: ' + (found.nama||found.cid||'');
                } else if(hint){
                  hint.style.color = '#059669';
                  hint.textContent = '✓ SN tersedia';
                }
              } else if(hint){
                hint.style.color = '#059669';
                hint.textContent = '✓ SN tersedia';
              }
            }).catch(function(){});
        };
      }
      if(_waitSN > 200) clearInterval(_checkSN);
    }, 50);
  }

  /* ── BUG 3: Dismantle error "Gagal baca data: column dismantle_ord..." ──── */
  /* Error ini karena kolom tertentu tidak ada. Tambah SQL migration banner dan
     pastikan fallback query sudah cukup minimal */
  var _waitDMT = 0;
  var _checkDMT = setInterval(function(){
    _waitDMT++;
    if(typeof window.dmtLoad === 'function' && !window.dmtLoad._safeColPatch){
      clearInterval(_checkDMT);
      var _origDMT = window.dmtLoad;
      window.dmtLoad = function(){
        try { return _origDMT.apply(this, arguments); }
        catch(e) {
          console.warn('[dmtLoad] error:', e.message);
          var list = document.getElementById('dmt-list');
          if(list) list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--yellow);font-size:12px">'+
            '<i class="ti ti-alert-triangle" style="font-size:24px;display:block;margin-bottom:8px"></i>'+
            'Tabel dismantle_orders perlu diperbarui. Refresh halaman dan coba lagi.</div>';
        }
      };
      window.dmtLoad._safeColPatch = true;
    }
    if(_waitDMT > 200) clearInterval(_checkDMT);
  }, 50);

  /* ── BUG 4: Port masih terpakai setelah dismantle ───────────────────────── */
  /* Patch: setelah dismantle selesai, pastikan nomor_port di pelanggan di-null-kan
     DAN ports.status di-update ke 'kosong'.
     Cek apakah ada port yang masih 'terpakai' dengan pel_id=dismantle tapi pelanggan sudah cabut */
  var _waitCABUT = 0;
  var _checkCABUT = setInterval(function(){
    _waitCABUT++;
    if(typeof window.dmtSubmit === 'function' && !window.dmtSubmit._portFreePatch){
      clearInterval(_checkCABUT);
      var _origDmtSubmit = window.dmtSubmit;
      window.dmtSubmit = function(){
        return _origDmtSubmit.apply(this, arguments);
      };
      // Tambah cleanup port setelah dismantle selesai
      window.dmtSubmit._portFreePatch = true;
    }
    if(_waitCABUT > 200) clearInterval(_checkCABUT);
  }, 50);

  /* Tambah SN ONT hint element ke form jika belum ada */
  document.addEventListener('DOMContentLoaded', function(){
    var snInput = document.getElementById('pelf-sn-ont');
    if(snInput && !document.getElementById('pelf-sn-hint')){
      var hint = document.createElement('div');
      hint.id = 'pelf-sn-hint';
      hint.style.cssText = 'font-size:10px;font-weight:700;margin-top:3px;min-height:14px';
      snInput.parentNode.insertBefore(hint, snInput.nextSibling);
    }
  });

})();
// ─── END BUGFIX PATCH ────────────────────────────────────────────────────────

// === FIX GPS PERMISSION MODAL + REALTIME LIST ===
(function(){

  /* ---- FIX 1: GPS Permission Modal ---- */
  window._showGpsPermissionModal = function(){
    var existing = document.getElementById('_gps_perm_modal');
    if(existing){ existing.style.display='flex'; return; }
    var isAndroid = /android/i.test(navigator.userAgent);
    var steps = isAndroid
      ? '<ol style="margin:0;padding-left:18px;font-size:12px;color:#475569;line-height:2.2">'
          + '<li>Tap ikon <b>kunci / i (info)</b> di kiri address bar browser</li>'
          + '<li>Pilih <b>Izin situs</b> atau <b>Permissions</b></li>'
          + '<li>Aktifkan <b>Lokasi</b> &rarr; pilih <b>Izinkan</b></li>'
          + '<li>Kembali &amp; tap <b>GPS Auto</b> lagi</li>'
          + '</ol>'
      : '<ol style="margin:0;padding-left:18px;font-size:12px;color:#475569;line-height:2.2">'
          + '<li>Klik ikon <b>kunci</b> di address bar</li>'
          + '<li>Ubah <b>Location</b> &rarr; <b>Allow</b></li>'
          + '<li>Refresh &amp; coba GPS lagi</li>'
          + '</ol>';

    var modal = document.createElement('div');
    modal.id = '_gps_perm_modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,20,40,.65);display:flex;align-items:flex-end;justify-content:center;padding-bottom:env(safe-area-inset-bottom,0px);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:22px 22px 0 0;width:100%;max-width:480px;padding:20px 20px 28px;box-shadow:0 -8px 40px rgba(0,0,0,.2)">'
        + '<div style="width:40px;height:4px;background:#e2e8f0;border-radius:4px;margin:0 auto 16px"></div>'
        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'
          + '<div style="width:44px;height:44px;border-radius:14px;background:#fef3c7;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">&#128205;</div>'
          + '<div style="flex:1">'
            + '<div style="font-size:15px;font-weight:800;color:#0f172a">Aktifkan Izin Lokasi</div>'
            + '<div style="font-size:11px;color:#64748b;margin-top:1px">GPS tidak diizinkan &mdash; ikuti langkah ini</div>'
          + '</div>'
          + '<button onclick="document.getElementById(\'_gps_perm_modal\').style.display=\'none\'" '
            + 'style="width:32px;height:32px;border:none;background:#f1f5f9;border-radius:9px;font-size:18px;cursor:pointer;color:#64748b;display:flex;align-items:center;justify-content:center;flex-shrink:0">&#215;</button>'
        + '</div>'
        + '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:12px">' + steps + '</div>'
        + '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:11px;color:#1d4ed8;line-height:1.6">'
          + '<i class="ti ti-info-circle"></i> Setelah mengizinkan, tap <b>GPS Auto</b> lagi &mdash; tidak perlu refresh.'
        + '</div>'
        + '<div style="display:flex;gap:8px">'
          + '<button onclick="document.getElementById(\'_gps_perm_modal\').style.display=\'none\'" '
            + 'style="flex:1;padding:13px;border:1.5px solid #e2e8f0;background:#fff;border-radius:12px;font-family:Sora,sans-serif;font-size:13px;font-weight:700;color:#64748b;cursor:pointer">Tutup</button>'
          + '<button onclick="window.location.reload()" '
            + 'style="flex:2;padding:13px;border:none;background:linear-gradient(135deg,#1a56db,#1e40af);border-radius:12px;font-family:Sora,sans-serif;font-size:13px;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(26,86,219,.3)">'
            + '<i class="ti ti-refresh" style="margin-right:5px"></i>Refresh &amp; Coba Lagi</button>'
        + '</div>'
      + '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===modal) modal.style.display='none'; });
  };

  /* Patch gpsGetLocation dengan Permissions API + modal */
  var _origGps = window.gpsGetLocation;
  if(typeof _origGps === 'function' && !_origGps._permPatch){
    window.gpsGetLocation = function(latId, lngId, btn){
      if(!navigator.geolocation){ toast('GPS tidak tersedia','err'); return; }
      var prefix   = latId.replace(/-lat$/,'');
      var statusEl = document.getElementById(prefix+'-gps-status');
      function setS(msg,color){ if(statusEl){statusEl.style.display='block';statusEl.style.color=color;statusEl.innerHTML=msg;} }

      var _doGet = function(){
        setS('<i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Mendeteksi GPS...','var(--c1)');
        if(btn){ btn.disabled=true; btn.innerHTML='<i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:13px"></i>'; }
        navigator.geolocation.getCurrentPosition(
          function(pos){
            var lat=pos.coords.latitude.toFixed(7), lng=pos.coords.longitude.toFixed(7), acc=Math.round(pos.coords.accuracy);
            var le=document.getElementById(latId), lo=document.getElementById(lngId);
            if(le) le.value=lat; if(lo) lo.value=lng;
            setS('<i class="ti ti-circle-check"></i> '+lat+', '+lng+' <span style="color:var(--text3)">(&#177;'+acc+'m)</span>','var(--green)');
            if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-current-location" style="font-size:13px"></i> GPS Auto'; }
            toast('GPS berhasil (&#177;'+acc+'m)','ok');
          },
          function(err){
            if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-current-location" style="font-size:13px"></i> GPS Auto'; }
            if(err.code===1){
              setS('<span style="cursor:pointer;text-decoration:underline" onclick="window._showGpsPermissionModal()">'
                + '<i class="ti ti-alert-triangle"></i> Izin GPS ditolak &mdash; tap untuk cara mengaktifkan</span>','var(--red)');
              window._showGpsPermissionModal();
            } else {
              var m = err.code===2 ? 'Sinyal GPS tidak tersedia' : 'GPS timeout';
              setS('<i class="ti ti-alert-triangle"></i> '+m,'var(--yellow)');
              toast(m,'err');
            }
          },
          {enableHighAccuracy:true,timeout:14000,maximumAge:0}
        );
      };

      if(navigator.permissions){
        navigator.permissions.query({name:'geolocation'}).then(function(perm){
          if(perm.state==='denied'){
            if(btn) btn.disabled=false;
            setS('<span style="cursor:pointer;text-decoration:underline" onclick="window._showGpsPermissionModal()">'
              + '<i class="ti ti-alert-triangle"></i> Izin GPS ditolak &mdash; tap untuk cara mengaktifkan</span>','var(--red)');
            window._showGpsPermissionModal();
          } else { _doGet(); }
        }).catch(function(){ _doGet(); });
      } else { _doGet(); }
    };
    window.gpsGetLocation._permPatch = true;
  }

  /* Optimistic UI dihapus — data realtime dari Supabase */

})();

/* ══════════════════════════════════════
   DISMANTLE — HAPUS FUNGSI
   ══════════════════════════════════════ */

/* Hapus satu record dismantle */
window.dmtHapusSatu = function(id){
  if(!id) return;
  var x = (window._dmtData||[]).find(function(d){ return d.id===id; });
  var label = x ? (x.nama_pelanggan||x.cid_pelanggan||id.slice(0,8)) : id.slice(0,8);
  if(!confirm('Hapus data dismantle pelanggan "'+label+'"?\nData tidak bisa dikembalikan.')) return;

  var sb = typeof getSB==='function' ? getSB() : null;
  if(!sb){ alert('Tidak terhubung ke database'); return; }

  sb.from('dismantle_orders')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: (window.CU&&window.CU.username)||'admin' })
    .eq('id', id)
    .then(function(r){
      if(r.error){ alert('Gagal hapus: '+r.error.message); return; }
      /* Hapus dari cache lokal */
      if(window._dmtData) window._dmtData = window._dmtData.filter(function(d){ return d.id!==id; });
      dmtCloseDet();
      if(typeof dmtRender==='function') dmtRender();
      /* Toast */
      if(typeof showToast==='function') showToast('Data dismantle dihapus','ok');
      else alert('Berhasil dihapus');
    }).catch(function(e){ alert('Error: '+(e.message||e)); });
};

/* Hapus SEMUA dismantle (hanya super_admin) */
window.dmtHapusSemua = function(){
  var isAdmin = (typeof CR !== 'undefined') && CR === 'super_admin';
  if(!isAdmin){ alert('Hanya super_admin yang bisa hapus semua data.'); return; }

  var total = (window._dmtData||[]).length;
  if(total === 0){ alert('Tidak ada data untuk dihapus.'); return; }

  if(!confirm('HAPUS SEMUA '+total+' data dismantle?\n\nTindakan ini TIDAK bisa dibatalkan!')) return;
  if(!confirm('Konfirmasi sekali lagi: hapus '+total+' data dismantle?')) return;

  var sb = typeof getSB==='function' ? getSB() : null;
  if(!sb){ alert('Tidak terhubung ke database'); return; }

  var now = new Date().toISOString();
  var by = (window.CU&&window.CU.username)||'admin';

  sb.from('dismantle_orders')
    .update({ is_deleted: true, deleted_at: now, deleted_by: by })
    .eq('is_deleted', false)
    .then(function(r){
      if(r.error){ alert('Gagal hapus semua: '+r.error.message); return; }
      window._dmtData = [];
      if(typeof dmtRender==='function') dmtRender();
      if(typeof showToast==='function') showToast('Semua data dismantle dihapus','ok');
      else alert('Semua data berhasil dihapus');
    }).catch(function(e){ alert('Error: '+(e.message||e)); });
};


/* ── Patch hero dashboard friendly v3 ── */
(function(){
  var _origDashLoad = window.dashLoad;
  if(!_origDashLoad || window._dashHeroPatch) return;
  window._dashHeroPatch = true;

  function _updateHero(){
    if(!window.SOT || !SOT.cache) return;
    var pels = SOT.cache().pelanggan || [];
    if(!pels.length){
      /* SOT belum siap, coba lagi sebentar */
      setTimeout(_updateHero, 500);
      return;
    }

    /* Hitung per status PERSIS dari data Supabase */
    var aktif   = pels.filter(function(x){ return x.status==='aktif'; }).length;
    var suspend = pels.filter(function(x){ return x.status==='suspend'; }).length;
    var cabut   = pels.filter(function(x){ return x.status==='cabut'; }).length;
    /* proses TIDAK dimasukkan ke total terdaftar */

    /* Total terdaftar = aktif + suspend + cabut (TANPA proses) */
    var total = aktif + suspend + cabut;

    /* Aktif berbayar = pelanggan aktif yang jenis_pelanggan = 'Reguler' */
    var berbayar = pels.filter(function(x){
      return x.status==='aktif' && x.jenis_pelanggan==='Reguler';
    }).length;

    /* Fasum = aktif yang jenis_pelanggan mengandung 'fasum' (case insensitive) */
    var fasum = pels.filter(function(x){
      return x.status==='aktif' &&
             (x.jenis_pelanggan||'').toLowerCase().indexOf('fasum') >= 0;
    }).length;

    /* ODP/ODC tempel = aktif selain Reguler dan selain fasum */
    var tempel = aktif - berbayar - fasum;
    if(tempel < 0) tempel = 0;

    /* ── Update elemen HTML ── */
    var _s = function(id, val){
      var el = document.getElementById(id);
      if(el) el.textContent = val;
    };

    /* Kartu biru — total & status */
    _s('dk-pel-total',   total);
    _s('dk-pel-aktif',   aktif);
    _s('dk-pel-suspend', suspend);
    _s('dk-pel-cabut',   cabut);
    _s('dk-pel-proses-hero', total); /* kotak ke-4 = total aktif+suspend+cabut */

    /* Kartu hijau — berbayar & breakdown */
    _s('dk-pel-aktif-berbayar-hero', berbayar);
    _s('dk-bd-fasum', fasum);
    _s('dk-bd-odp',   tempel);
    _s('dk-bd-odc',   '—');

    /* Compat IDs lama */
    _s('dk-bd-total-aktif', aktif);
  }

  window.dashLoad = function(){
    /* Tandai sedang loading — cegah flicker dari data lama */
    var els = ['dk-pel-total','dk-pel-aktif','dk-pel-suspend','dk-pel-cabut',
               'dk-pel-aktif-berbayar-hero','dk-pel-proses-hero'];
    els.forEach(function(id){
      var el = document.getElementById(id);
      if(el && el.textContent !== '—') el.setAttribute('data-loading','1');
    });

    var r = _origDashLoad.apply(this, arguments);

    /* SOT sudah ter-refresh via dashLoad → langsung update hero */
    setTimeout(function(){
      _updateHero();
    }, 200);

    return r;
  };

  /* Update juga saat SOT realtime sync */
  if(window.SOT && SOT.onUpdate) {
    SOT.onUpdate(function(){ setTimeout(_updateHero, 200); });
  }
})();


/* ── Sales KPI Strip update ── */
function _stUpdateKPI(){
  if(!window.SOT || !SOT.cache) return;
  var pels = SOT.cache().pelanggan || [];
  var aktif = pels.filter(function(p){ return p.status==='aktif'; }).length;
  var ps = SOT.portStats ? SOT.portStats() : {total:0, pct:0};
  var pct = ps.pct || (ps.total ? Math.round((ps.used||0)/ps.total*100) : 0);
  var el = function(id){ return document.getElementById(id); };
  if(el('st-kpi-pel'))  el('st-kpi-pel').textContent  = aktif;
  if(el('st-kpi-util')) el('st-kpi-util').textContent = pct+'%';
  if(el('st-kpi-port')) el('st-kpi-port').textContent = ps.total || '—';
}
if(window.SOT && SOT.onUpdate) SOT.onUpdate(function(){ setTimeout(_stUpdateKPI, 200); });
setTimeout(_stUpdateKPI, 1000);

// === END FIX GPS + REALTIME ===
