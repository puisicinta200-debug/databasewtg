

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
  if(window.ProgUI) ProgUI.open({title:'Export Keuangan (Semua Area)', step:'Mengambil data pelanggan & fee…'});
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
    if(window.ProgUI) ProgUI.step('Mengunduh file ('+(rows.length-1)+' baris)…', 90);
    var bom='\uFEFF';
    var blob=new Blob([bom+csv],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='finance_export_'+per.from+'_sd_'+per.to+'.csv';
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
    toast('Export '+rows.length+' baris berhasil','ok');
    if(window.ProgUI) ProgUI.success((rows.length-1)+' baris data keuangan berhasil di-export');
  }).catch(function(e){ toast('Gagal export: '+(e.message||e),'err'); if(window.ProgUI)ProgUI.error('Gagal export: '+(e.message||e)); });
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
  if(window.ProgUI) ProgUI.open({title:'Export Keuangan — '+areaName, step:'Mengambil data pelanggan & fee area ini…'});
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
    if(window.ProgUI) ProgUI.step('Mengunduh file ('+(rows.length-1)+' baris)…', 90);
    var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='finance_'+areaName.replace(/\s+/g,'_')+'_'+per.from+'_sd_'+per.to+'.csv';
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
    toast('Export '+areaName+' — '+rows.length+' baris','ok');
    if(window.ProgUI) ProgUI.success((rows.length-1)+' baris data '+areaName+' berhasil di-export');
  }).catch(function(e){toast('Gagal: '+(e.message||e),'err');if(window.ProgUI)ProgUI.error('Gagal: '+(e.message||e));});
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
