function otfCloseForm(){ document.getElementById('otf-form-overlay').classList.remove('on'); }

function otfSave(){
  var id=document.getElementById('otff-id').value;
  var tgl=document.getElementById('otff-tgl').value;
  var pelId=document.getElementById('otff-pel').value;
  var nominal=parseFloat(document.getElementById('otff-nominal').value)||0;
  var status=document.getElementById('otff-status').value;
  var area=document.getElementById('otff-area').value||null;
  if(!pelId||!nominal){ toast('Isi pelanggan dan nominal','err'); return; }

  var _dupOtf=_otfData.find(function(x){ return x.pel_id===pelId && x.id!==id; });
  if(_dupOtf){
    toast('Pelanggan '+_otfPelCID(pelId)+' · '+_otfPelName(pelId)+' sudah punya Fee OTF (status: '+(_dupOtf.status||'-')+'). Edit data yang sudah ada, jangan generate baru.','err');
    return;
  }
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('otff-save-btn');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span>';}
  var payload={tgl:tgl||null,pel_id:pelId,area:area,nominal:nominal,status:status};
  var p=id?sb.from('fee_otf').update(payload).eq('id',id):sb.from('fee_otf').insert([payload]);
  p.then(function(r){
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}
    if(r.error){toast('Gagal: '+(r.error.message||'coba lagi'),'err');return;}
    toast(id?'OTF diperbarui':'OTF di-generate','ok');
    if(window.SOT) SOT.invalidate('general');
    otfCloseForm();_otfLoaded=false;_otfLoading=false;otfLoad();
  }).catch(function(e){if(btn){btn.disabled=false;}toast('Error','err');});
}

function otfOpenDet(id){
  var o=_otfData.find(function(x){return x.id===id;}); if(!o) return;
  _otfDetId=id;
  document.getElementById('otf-det-title').textContent='OTF · '+_otfPelCID(o.pel_id);
  var stTag={aktif:'tc1',draft:'ty',menunggu_validasi:'ty',waiting_payment:'tc1',siap_bayar:'tc1',paid:'tg',canceled:'tgr'};
  var stLbl={aktif:'Aktif',draft:'Draft',menunggu_validasi:'Menunggu Validasi',waiting_payment:'Siap Bayar',siap_bayar:'Siap Bayar',paid:'Paid',canceled:'Canceled'};
  function dr(l,v){return '<div class="olt-det-row"><div class="olt-det-lbl">'+l+'</div><div class="olt-det-val">'+v+'</div></div>';}
  function sec(i,t){return '<div class="olt-det-section"><i class="ti ti-'+i+'"></i> '+t+'</div>';}
  var areaN=_otfPelAreaName(o.pel_id); var kec=_otfPelKec(o.pel_id); var rw=_otfPelRW(o.pel_id); var rt=_otfPelRT(o.pel_id);
  var isWaiting = o.status==='menunggu_validasi';
  document.getElementById('otf-det-body').innerHTML=
    sec('bolt','Fee OTF')+
    dr('Tanggal',_esc(o.tgl||'—'))+
    dr('CID','<strong style="font-family:\'JetBrains Mono\',monospace">'+_esc(_otfPelCID(o.pel_id))+'</strong>')+
    dr('Nama',_esc(_otfPelName(o.pel_id)))+
    sec('map-pin','Lokasi')+
    dr('Area','<span class="tag tc1">'+_esc(areaN||o.area||'—')+'</span>')+
    (kec?dr('Kecamatan',_esc(kec)):'')+
    (rw?dr('RW / RT','<strong>RW '+_esc(rw)+'</strong>'+(rt?' · RT '+_esc(rt):'')):'')+
    sec('coin','Pembayaran')+
    dr('Nominal','<span style="font-family:\'JetBrains Mono\',monospace;font-size:16px;font-weight:800;color:var(--c1)">Rp '+_fmt(o.nominal||0)+'</span>')+
    dr('Status','<span class="tag '+(stTag[o.status]||'ty')+'">'+_esc(stLbl[o.status]||o.status)+'</span>')+
    (isWaiting ?
      '<div style="display:flex;gap:8px;margin-top:14px">'+
        '<button class="btn" style="flex:1;background:var(--green)" onclick="otfValidasi(\''+o.id+'\',true);otfCloseDet()"><i class="ti ti-circle-check"></i> Validasi → Siap Bayar</button>'+
        '<button class="btn" style="flex:1;background:var(--red)" onclick="otfValidasi(\''+o.id+'\',false);otfCloseDet()"><i class="ti ti-circle-x"></i> Tolak → Draft</button>'+
      '</div>' : '')+
    '<div style="display:flex;gap:8px;margin-top:'+(isWaiting?'8':'14')+'px">'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="otfDelete(\''+o.id+'\')"><i class="ti ti-trash"></i> Hapus</button>'+
    '</div>';
  document.getElementById('otf-det-overlay').classList.add('on');
}
function otfCloseDet(){document.getElementById('otf-det-overlay').classList.remove('on');_otfDetId=null;}
function otfDetEdit(){var o=_otfData.find(function(x){return x.id===_otfDetId;});if(!o)return;otfCloseDet();otfOpenForm(o);}
function otfDelete(id){
  if(!confirm('Hapus OTF ini?')) return;
  var sb=getSB();if(!sb){toast('Database tidak terhubung','err');return;}
  sb.from('fee_otf').delete().eq('id',id).then(function(r){if(r.error){toast('Gagal hapus','err');return;}toast('OTF dihapus','ok');otfCloseDet();_otfLoaded=false;_otfLoading=false;otfLoad();}).catch(function(){toast('Error','err');});
}
function otfImpFile(input){
  var f=input.files&&input.files[0]; if(!f) return;
  var rd=new FileReader();
  rd.onload=function(){ document.getElementById('otfimp-csv').value=rd.result||''; };
  rd.readAsText(f);
}
function otfImpCommit(){
  var raw=(document.getElementById('otfimp-csv').value||'').trim();
  if(!raw){ toast('Tempel atau pilih file terlebih dahulu','err'); return; }
  var lines=raw.split(/\r?\n/).filter(function(l){return l.trim();});
  if(lines.length){
    var h=_impSplit(lines[0]).map(function(x){return x.toLowerCase();}).join(' ');
    if(h.indexOf('cid')>=0||h.indexOf('nominal')>=0) lines=lines.slice(1);
  }
  var rows=lines.map(function(l){
    var c=_impSplit(l);
    return {cid:c[0]||'', nominal:parseFloat((c[1]||'0').replace(/[^\d.-]/g,''))||0, status:(c[2]||'menunggu_validasi').toLowerCase().trim()||'menunggu_validasi'};
  }).filter(function(r){return r.cid;});
  if(!rows.length){ toast('Tidak ada baris valid (butuh kolom CID)','err'); return; }
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var FREE_TYPES=JENIS_GRATIS;
  toast('Mencocokkan data pelanggan…','info');
  sb.from('pelanggan').select('id,cid,area_coverage,jenis_pelanggan').then(function(r){
    if(r.error){ toast('Gagal baca pelanggan: '+(r.error.message||''),'err'); return; }
    var map={}; (r.data||[]).forEach(function(p){ if(p.cid) map[(''+p.cid).toLowerCase()]=p; });

    var _sudahOtfSet={}; _otfData.forEach(function(o){ if(o.pel_id) _sudahOtfSet[o.pel_id]=true; });
    var ops=[]; var matched=0, unmatched=0, skippedFree=0, skippedDup=0;
    rows.forEach(function(row){
      var p=map[(''+row.cid).toLowerCase()];
      if(!p){ unmatched++; return; }
      if(FREE_TYPES.indexOf(p.jenis_pelanggan)>=0){ skippedFree++; return; }
      if(_sudahOtfSet[p.id]){ skippedDup++; return; }
      matched++;
      ops.push(sb.from('fee_otf').insert([{
        tgl:new Date().toISOString().slice(0,10),
        pel_id:p.id, area:p.area_coverage||null, nominal:row.nominal, status:row.status
      }]));
    });
    if(!ops.length){ toast('Tidak ada CID baru yang valid untuk di-import (kemungkinan semua sudah punya Fee OTF / tidak cocok / pelanggan gratis)','err'); return; }
    Promise.all(ops.map(function(p){return p.then(function(x){return x;}).catch(function(e){return {error:e};});})).then(function(res){
      var err=res.filter(function(x){return x&&x.error;}).length;
      if(err) toast('Sebagian gagal ('+err+')','err');
      else toast(matched+' Fee OTF di-import'+(unmatched?(' · '+unmatched+' CID tak cocok'):'')+(skippedFree?(' · '+skippedFree+' pelanggan gratis dilewati'):'')+(skippedDup?(' · '+skippedDup+' dilewati karena sudah punya Fee OTF'):''),'ok');
      document.getElementById('otfimp-csv').value='';
      _otfLoaded=false;_otfLoading=false;otfLoad();
    });
  }).catch(function(){ toast('Error koneksi','err'); });
}

function _fdbCheckRecurringReminder(){
  var box=document.getElementById('fdb-recurring-reminder');
  var txt=document.getElementById('fdb-recurring-reminder-text');
  if(!box||!txt) return;
  var now=new Date();
  var dom=now.getDate();
  var lastDay=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  var triggerDay = Math.min(30, lastDay);
  var periodeNow = now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2);
  if(dom < triggerDay){ box.style.display='none'; return; }
  var sudahAda = (_recData||[]).some(function(r){ return r.periode===periodeNow; });
  if(sudahAda){ box.style.display='none'; return; }
  txt.textContent='Hari ini tanggal '+dom+' — tagihan Fee Recurring untuk periode '+periodeNow+' belum di-generate. Silakan upload &amp; verifikasi data pembayaran ISP untuk membuat tagihan recurring periode ini.';
  box.style.display='flex';
}
var _recData=[]; var _recFil=[]; var _recPage=1; var _recPerPg=15; var _recLoaded=false;
var _recPelMap={};
var _recDrill={kec:'',kel:'',rw:''};
var FEE_RECURRING_NOMINAL = 10000;

function _recGeo(r){
  var p=r.pel_id&&_recPelMap[r.pel_id];
  if(p) return {kec:p.kecamatan||'',kel:p.kelurahan||'',rw:p.rw||'',rt:p.rt||''};
  return {kec:'',kel:'',rw:'',rt:''};
}

function recLoad(){
  var list=document.getElementById('rec-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat Recurring…</p></div>';
  var sb=getSB();if(!sb){if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-wifi-off"></i><p>Database tidak terhubung</p></div>';return;}
  _recDrill={kec:'',kel:'',rw:''};
  Promise.all([
    sb.from('fee_recurring').select('id,pel_id,periode,nominal,status,tgl_generate,tgl_bayar,catatan,created_at').order('periode',{ascending:false}),
    sb.from('pelanggan').select('id,cid,nama,area_id,area_coverage,kecamatan,kelurahan,rw,rt,jenis_pelanggan,tipe_recurring,status,tgl_pasang,created_at')
  ]).then(function(res){
    var rRec=res[0], rPel=res[1];
    if(rRec.error){
      var _msg=rRec.error.message||'';
      if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+_esc(_msg)+'</p></div>';
      /* tetap set _recLoaded=true walau error, supaya _finEnsure() di Laporan Finance
         tidak polling sampai timeout menunggu _recLoaded yang tidak akan pernah true */
      _recData=[]; _recLoaded=true;
      return;
    }
    _recData=rRec.data||[];
    _recPelMap={};
    (rPel.data||[]).forEach(function(p){ _recPelMap[p.id]=p; });
    _recLoaded=true;
    recUpdateStats(); recRender(); finUpdateDashboard();

    _recAutoSinkron(sb, rPel.data||[]);
  }).catch(function(){if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error</p></div>';});
}

function recUpdateStats(){
  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  e('recst-total',_recData.length);
  var pelSet={};
  _recData.forEach(function(r){ if(r.pel_id && r.status!=='stopped') pelSet[r.pel_id]=1; });
  e('recst-aktif',Object.keys(pelSet).length);
  var nomTotal=_recData.filter(function(r){return r.status!=='stopped';}).reduce(function(a,r){return a+(r.nominal||0);},0);
  e('recst-nominal',_fmtRp(nomTotal)+'\n('+_terbilang(nomTotal)+')');
  var menunggu=_recData.filter(function(r){return r.status==='menunggu_validasi';}).length;
  e('recst-fee-per',menunggu+' menunggu');

  var bw=document.getElementById('rec-validasi-bulk-wrap');
  if(bw) bw.style.display=menunggu>0?'block':'none';
  var bl=document.getElementById('rec-validasi-bulk-lbl');
  if(bl) bl.textContent=menunggu+' recurring menunggu validasi';

  var selPer=document.getElementById('rec-fil-periode');
  if(selPer && selPer.options.length<=1){
    var pers=[]; _recData.forEach(function(r){var v=r.periode||''; if(v&&pers.indexOf(v)<0) pers.push(v);});
    pers.sort().reverse().forEach(function(v){var o=document.createElement('option');o.value=v;o.textContent=v;selPer.appendChild(o);});
  }
}

function recRender(){
  var stFilter=(document.getElementById('rec-fil-status')||{}).value||'';
  var perFilter=(document.getElementById('rec-fil-periode')||{}).value||'';
  var filtered=_recData.filter(function(r){
    if(stFilter && r.status!==stFilter) return false;
    if(perFilter && r.periode!==perFilter) return false;
    return true;
  });

  filtered=filtered.filter(function(r){
    var g=_recGeo(r);
    if(_recDrill.kec && g.kec!==_recDrill.kec) return false;
    if(_recDrill.kel && g.kel!==_recDrill.kel) return false;
    if(_recDrill.rw  && g.rw!==_recDrill.rw) return false;
    return true;
  });

  _recRenderBreadcrumb();

  var level = !_recDrill.kec ? 'kec' : !_recDrill.kel ? 'kel' : !_recDrill.rw ? 'rw' : 'rt';

  var groups={};
  filtered.forEach(function(r){
    var g=_recGeo(r);
    var lbl=g[level]||'(Tanpa Data Wilayah)';
    if(!groups[lbl]) groups[lbl]={name:lbl,items:[],total:0,pelSet:{}};
    groups[lbl].items.push(r);
    groups[lbl].total+=(r.nominal||0);
    if(r.pel_id) groups[lbl].pelSet[r.pel_id]=1;
  });
  var grpArr=Object.keys(groups).map(function(k){return groups[k];});
  grpArr.sort(function(a,b){ return a.name.localeCompare(b.name,'id',{numeric:true,sensitivity:'base'}); });

  var total=grpArr.length;var pages=Math.max(1,Math.ceil(total/_recPerPg));
  if(_recPage>pages) _recPage=pages;
  var start=(_recPage-1)*_recPerPg;
  var list=document.getElementById('rec-list');if(!list)return;
  if(!total){
    list.innerHTML='<div class="olt-empty"><i class="ti ti-refresh-off"></i><p>Belum ada data recurring pada cakupan ini</p></div>';
    var pg0=document.getElementById('rec-pagi'); if(pg0) pg0.style.display='none';
    return;
  }
  list.innerHTML=grpArr.slice(start,start+_recPerPg).map(function(g){return _recLevelCardHTML(g,level);}).join('');
  var pagi=document.getElementById('rec-pagi');
  if(pages>1){pagi.style.display='flex';var prev=document.getElementById('rec-prev');var next=document.getElementById('rec-next');var info=document.getElementById('rec-pagi-info');if(prev)prev.disabled=_recPage<=1;if(next)next.disabled=_recPage>=pages;if(info)info.textContent=_recPage+' / '+pages;}
  else pagi.style.display='none';
}

function _recAttrSafe(s){ return _esc(s).replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

function _recRenderBreadcrumb(){
  var el=document.getElementById('rec-breadcrumb'); if(!el) return;
  var crumbs=[{label:'<i class="ti ti-map-2" style="margin-right:3px"></i>Semua Kecamatan',action:"recDrillReset('root')"}];
  if(_recDrill.kec) crumbs.push({label:'Kec. '+_esc(_recDrill.kec),action:"recDrillReset('kec')"});
  if(_recDrill.kel) crumbs.push({label:_esc(_recDrill.kel),action:"recDrillReset('kel')"});
  if(_recDrill.rw)  crumbs.push({label:'RW '+_esc(_recDrill.rw),action:''});
  el.innerHTML=crumbs.map(function(c,i){
    var isLast=(i===crumbs.length-1);
    var sep = i>0 ? '<i class="ti ti-chevron-right" style="font-size:11px;color:var(--text3);margin:0 1px"></i>' : '';
    if(isLast) return sep+'<span style="font-size:11px;font-weight:800;color:var(--c1)">'+c.label+'</span>';
    return sep+'<span style="font-size:11px;font-weight:600;color:var(--text3);cursor:pointer;touch-action:manipulation" onclick="'+c.action+'">'+c.label+'</span>';
  }).join('');
}

function recDrillInto(level,name){
  if(level==='kec'){ _recDrill={kec:name,kel:'',rw:''}; }
  else if(level==='kel'){ _recDrill.kel=name; _recDrill.rw=''; }
  else if(level==='rw'){ _recDrill.rw=name; }
  _recPage=1; recRender();
}

function recDrillReset(toLevel){
  if(toLevel==='root'){ _recDrill={kec:'',kel:'',rw:''}; }
  else if(toLevel==='kec'){ _recDrill.kel=''; _recDrill.rw=''; }
  else if(toLevel==='kel'){ _recDrill.rw=''; }
  _recPage=1; recRender();
}

function _recLevelCardHTML(g,level){
  var stCounts={menunggu_validasi:0,siap_bayar:0,paid:0,stopped:0,draft:0};
  g.items.forEach(function(r){ var s=r.status||'draft'; if(stCounts[s]!==undefined) stCounts[s]++; else stCounts.draft++; });
  var dominan = stCounts.menunggu_validasi>0 ? 'menunggu_validasi'
    : stCounts.siap_bayar>0 ? 'siap_bayar'
    : stCounts.paid>0 && stCounts.menunggu_validasi===0 && stCounts.siap_bayar===0 ? 'paid'
    : 'draft';
  var stTag={menunggu_validasi:'ty',siap_bayar:'tc1',paid:'tg',stopped:'tgr',draft:'ty'};
  var stLbl={menunggu_validasi:'Menunggu Validasi',siap_bayar:'Siap Bayar',paid:'Paid',stopped:'Stopped',draft:'Draft'};
  var icon={kec:'building-community',kel:'map-2',rw:'home',rt:'users'}[level];
  var titlePrefix={kec:'Kec. ',kel:'',rw:'RW ',rt:'RT '}[level];
  var count=Object.keys(g.pelSet).length;
  var ids=g.items.map(function(r){return r.id;}).join(',');
  var clickAction = level==='rt'
    ? "recOpenGrpDet('"+_esc(ids)+"')"
    : "recDrillInto('"+level+"','"+_recAttrSafe(g.name)+"')";
  var trailing = level==='rt'
    ? '<span style="font-size:10px;color:var(--c1);font-weight:700;display:flex;align-items:center;gap:2px">Detail <i class="ti ti-arrow-right" style="font-size:11px"></i></span>'
    : '<i class="ti ti-chevron-right" style="color:var(--text3);font-size:15px"></i>';
  return '<div class="fin-rekap-card" onclick="'+clickAction+'" style="cursor:pointer">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
      '<div style="font-size:13px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px"><i class="ti ti-'+icon+'" style="color:var(--yellow)"></i>'+titlePrefix+_esc(g.name)+'</div>'+
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:800;color:var(--yellow)">Rp '+_fmt(g.total)+'</div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">'+
      '<span class="tag '+(stTag[dominan]||'ty')+'">'+_esc(stLbl[dominan]||dominan)+'</span>'+
    '</div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'+
      '<div style="display:flex;gap:8px;font-size:11px;color:var(--text3);flex-wrap:wrap">'+
        '<span>'+count+' pelanggan</span>'+
        (stCounts.menunggu_validasi>0?'<span>· <b style="color:var(--yellow)">'+stCounts.menunggu_validasi+' menunggu</b></span>':'')+
        (stCounts.siap_bayar>0?'<span>· <b style="color:var(--c1)">'+stCounts.siap_bayar+' siap bayar</b></span>':'')+
        (stCounts.paid>0?'<span>· <b style="color:var(--green)">'+stCounts.paid+' paid</b></span>':'')+
      '</div>'+
      trailing+
    '</div>'+
  '</div>';
}

function recOpenGrpDet(idsStr){
  var ids=idsStr.split(',');
  var items=_recData.filter(function(r){return ids.indexOf(r.id)>=0;});
  if(!items.length) return;
  var g0=items[0];
  var p0=g0.pel_id&&_recPelMap[g0.pel_id];
  var area=p0?p0.area_coverage:'';
  var rw=p0?p0.rw:'';
  var periode=g0.periode;
  document.getElementById('rec-det-title').textContent='Recurring '+periode+(rw?' · RW '+rw:'');
  var total=items.reduce(function(a,r){return a+(r.nominal||0);},0);
  var stTag={menunggu_validasi:'ty',siap_bayar:'tc1',paid:'tg',stopped:'tgr',draft:'ty'};
  var stLbl={menunggu_validasi:'Menunggu Validasi',siap_bayar:'Siap Bayar',paid:'Paid',stopped:'Stopped',draft:'Draft'};
  function dr(l,v){return '<div class="olt-det-row"><div class="olt-det-lbl">'+l+'</div><div class="olt-det-val">'+v+'</div></div>';}
  function sec(i,t){return '<div class="olt-det-section"><i class="ti ti-'+i+'"></i> '+t+'</div>';}
  var pelRows=items.map(function(r){
    var p=r.pel_id&&_recPelMap[r.pel_id];
    var nama=p?(p.nama||'—'):'—';
    var cid=p?(p.cid||'—'):'—';
    var st=r.status||'draft';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)">'+
      '<div>'+
        '<div style="font-size:11px;font-weight:700;color:var(--text)">'+_esc(nama)+'</div>'+
        '<div style="font-size:10px;color:var(--text3);font-family:\'JetBrains Mono\',monospace">'+_esc(cid)+'</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:6px">'+
        '<span class="tag '+(stTag[st]||'ty')+'">'+_esc(stLbl[st]||st)+'</span>'+
        '<span style="font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:800;color:var(--text)">Rp '+_fmt(r.nominal||0)+'</span>'+
      '</div>'+
    '</div>';
  }).join('');
  var menunggAda=items.some(function(r){return r.status==='menunggu_validasi';});
  var siapIds=items.filter(function(r){return r.status==='siap_bayar';}).map(function(r){return r.id;});
  document.getElementById('rec-det-body').innerHTML=
    sec('refresh','Detail Recurring')+
    dr('Periode','<strong style="font-family:\'JetBrains Mono\',monospace;font-size:14px">'+_esc(periode||'—')+'</strong>')+
    sec('map-pin','Lokasi')+
    dr('Area','<span class="tag tc1"><i class="ti ti-building-community" style="font-size:10px;margin-right:3px"></i>'+_esc(area||'—')+'</span>')+
    (rw?dr('RW','<strong>RW '+_esc(rw)+'</strong>'):'')+
    sec('users','Pelanggan & Fee')+
    dr('Total','<span style="font-family:\'JetBrains Mono\',monospace;font-size:18px;font-weight:800;color:var(--yellow)">Rp '+_fmt(total)+'</span>')+
    '<div style="margin:10px 0">'+pelRows+'</div>'+
    (menunggAda?
      '<button class="btn" style="width:100%;background:var(--green)" onclick="recCloseDet();navFin(\'fin-validasi\',\'validasi\',document.getElementById(\'sbt-fin-validasi\'));valSetJenis(\'rec\');"><i class="ti ti-hand-click"></i> Validasi di Validasi Finance</button>'
    :'')+
    (siapIds.length?
      '<button class="btn" style="width:100%;margin-top:8px;background:var(--c1)" onclick="recBayarGrp([\''+siapIds.join("','")+'\'])"><i class="ti ti-cash"></i> Tandai Lunas (Paid)</button>':'')+
    '<button class="btn btn-ghost" style="width:100%;margin-top:8px;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="recDeleteGrp([\''+ids.join("','")+'\'])"><i class="ti ti-trash"></i> Hapus Semua</button>';
  document.getElementById('rec-det-overlay').classList.add('on');
}

function recBayarGrp(ids){
  var sb=getSB(); if(!sb){toast('Database tidak terhubung','err');return;}
  var tgl=new Date().toISOString().slice(0,10);
  sb.from('fee_recurring').update({status:'paid',tgl_bayar:tgl}).in('id',ids).then(function(r){
    if(r.error){toast('Gagal','err');return;}
    ids.forEach(function(id){ var rec=_recData.find(function(x){return x.id===id;}); if(rec){rec.status='paid';rec.tgl_bayar=tgl;} });
    toast('Recurring ditandai Lunas ✓','ok');
    recCloseDet(); recUpdateStats(); recRender();
  }).catch(function(){toast('Error','err');});
}

function recDeleteGrp(ids){
  if(!confirm('Hapus '+ids.length+' data recurring ini?')) return;
  var sb=getSB(); if(!sb){toast('Database tidak terhubung','err');return;}
  sb.from('fee_recurring').delete().in('id',ids).then(function(r){
    if(r.error){toast('Gagal','err');return;}
    _recData=_recData.filter(function(x){return ids.indexOf(x.id)<0;});
    toast('Recurring dihapus','ok'); recCloseDet(); recUpdateStats(); recRender();
  }).catch(function(){toast('Error','err');});
}

/* Hitung daftar periode 'YYYY-MM' yang sudah jatuh tempo (tanggal 30) untuk satu
   pelanggan, dihitung mulai bulan SETELAH bulan pemasangan (tgl_pasang). */
function _recDueMonths(anchorDateStr, today){
  var out=[];
  if(!anchorDateStr) return out;
  var a=new Date(anchorDateStr);
  if(isNaN(a.getTime())) return out;
  today = today || new Date();
  var y=a.getFullYear(), m=a.getMonth()+1; // mulai bulan setelah pemasangan
  if(m>11){ m=0; y++; }
  var guard=0;
  while(guard++<240){
    var lastDay=new Date(y,m+1,0).getDate();
    var dueDay=Math.min(30,lastDay);
    var dueDate=new Date(y,m,dueDay);
    if(today<dueDate) break;
    out.push(y+'-'+('0'+(m+1)).slice(-2));
    m+=1; if(m>11){ m=0; y++; }
  }
  return out;
}

var _recSinkronRunning=false;
/* Generator recurring per-pelanggan (bukan agregat per-area). BERLAKU UNTUK SEMUA
   pelanggan aktif di area 'existing' (bukan 'expand') — lama maupun baru, bukan
   cuma yang baru dipasang — dan bukan jenis gratis. Untuk tiap pelanggan, dicek
   SEMUA periode yang sudah jatuh tempo (tgl 30) sejak bulan setelah tgl_pasang
   sampai bulan berjalan, lalu dibuatkan 1 baris fee_recurring per periode yang
   belum ada — persis pola OTF, langsung berstatus 'menunggu_validasi' sehingga
   otomatis masuk ke Validasi Finance. Ini berjalan terus tiap bulan selama
   pelanggan masih berstatus 'aktif'; begitu pelanggan berhenti/di-dismantle
   (status berubah dari 'aktif'), generator otomatis berhenti membuat tagihan
   baru untuknya (lihat guard `p.status!=='aktif'` di bawah). */
function _recAutoSinkron(sb, pelData){
  if(_recSinkronRunning) return;
  _recSinkronRunning=true;
  var FREE_TYPES=JENIS_GRATIS;
  var today=new Date();

  var existing={};
  _recData.forEach(function(r){ if(r.pel_id) existing[r.pel_id+'|'+r.periode]=1; });

  var rows=[];
  (pelData||[]).forEach(function(p){
    if(!p || p.status!=='aktif') return;
    if(FREE_TYPES.indexOf(p.jenis_pelanggan)>=0) return;
    if((p.tipe_recurring||'existing')==='expand') return;
    var anchor=p.tgl_pasang||p.created_at; if(!anchor) return;
    var due=_recDueMonths(anchor,today);
    due.forEach(function(per){
      var key=p.id+'|'+per;
      if(existing[key]) return;
      existing[key]=1;
      rows.push({pel_id:p.id, periode:per, nominal:FEE_RECURRING_NOMINAL, status:'menunggu_validasi', tgl_generate:today.toISOString().slice(0,10)});
    });
  });

  if(!rows.length){ _recSinkronRunning=false; _recCheckAutoDismantle(sb); return; }

  sb.from('fee_recurring').insert(rows).select().then(function(r){
    _recSinkronRunning=false;
    if(r.error){ console.error('[recAutoSinkron] insert gagal:', r.error.message||r.error.code); }
    if(!r.error && r.data && r.data.length){
      _recData=_recData.concat(r.data);
      recUpdateStats(); recRender(); finUpdateDashboard();
    }
    _recCheckAutoDismantle(sb);
  }).catch(function(e){ console.error('[recAutoSinkron] catch:', e&&e.message); _recSinkronRunning=false; });
}

function _recCheckAutoDismantle(sb){
  if(!sb) sb=getSB(); if(!sb) return;
  var FREE_TYPES=JENIS_GRATIS;

  Promise.all([
    sb.from('fee_recurring').select('pel_id,periode,status').order('periode',{ascending:false}),
    sb.from('pelanggan').select('id,cid,nama,area_id,area_coverage,kecamatan,jenis_pelanggan,sn_ont,odp_id,nomor_port,ont_item_id,kabel_item_id').eq('status','aktif')
  ]).then(function(res){
    var rRec=res[0], rPel=res[1];
    if(rRec.error||rPel.error) return;

    var byPel={};
    (rRec.data||[]).forEach(function(r){
      if(!r.pel_id) return;
      if(!byPel[r.pel_id]) byPel[r.pel_id]=[];
      byPel[r.pel_id].push(r);
    });

    var akanDismantle=[];
    var aktivMap={};
    (rPel.data||[]).forEach(function(p){ aktivMap[p.id]=p; });

    Object.keys(byPel).forEach(function(pelId){
      var p=aktivMap[pelId]; if(!p) return;
      if(FREE_TYPES.indexOf(p.jenis_pelanggan)>=0) return;
      var rows=byPel[pelId].sort(function(a,b){return b.periode>a.periode?1:-1;});

      var last4=rows.slice(0,4);
      if(last4.length<4) return;

      var semualMenunggu=last4.every(function(r){
        return r.status==='menunggu_validasi'||r.status==='draft';
      });
      if(semualMenunggu) akanDismantle.push(p);
    });

    if(!akanDismantle.length) return;

    var tgl=new Date().toISOString().slice(0,10);
    var ops=akanDismantle.map(function(pel){
      var payload={
        pel_id:pel.id, cid_pelanggan:pel.cid||null,
        nama_pelanggan:pel.nama||null, area_id:pel.area_id||null,
        area_coverage:pel.area_coverage||null, kecamatan:pel.kecamatan||null,
        tgl_cabut:tgl, tgl_selesai:tgl,
        alasan:'menunggak',
        catatan:'Auto-dismantle: 4 periode berturut-turut tidak divalidasi',
        status:'selesai',
        ont_item_id:pel.ont_item_id||null,
        kabel_item_id:pel.kabel_item_id||null,
        dilakukan_oleh:'SYSTEM', role_aktor:'auto'
      };
      return sb.from('dismantle_orders').insert([payload])
        .then(function(rd){
          if(rd&&rd.error) return;
          var sbInner=getSB(); if(!sbInner) return;
          sbInner.from('pelanggan').update({status:'cabut',sn_ont:null,nomor_port:null,odp_id:null}).eq('id',pel.id).catch(function(){});
          if(pel.cid) sbInner.from('odp_ports').update({status:'kosong',cid_pelanggan:null,paket:null,tgl_pasang:null}).eq('cid_pelanggan',pel.cid).catch(function(){});
          sbInner.from('fee_recurring').update({status:'stopped'}).eq('pel_id',pel.id).neq('status','paid').catch(function(){});
        }).catch(function(){});
    });

    Promise.all(ops).then(function(){
      if(akanDismantle.length){
        toast('⚠️ '+akanDismantle.length+' pelanggan menunggak 4 periode → otomatis di-dismantle','err');
        _pelLoaded=false; _dmtLoaded=false;
        setTimeout(function(){ pelLoad(); if(typeof dmtLoad==='function') dmtLoad(); },300);
      }
    });
  }).catch(function(){});
}

function recOpenDet(id){ recOpenGrpDet(''+id); }
function recCloseDet(){document.getElementById('rec-det-overlay').classList.remove('on');}
function recDelete(id){ recDeleteGrp([''+id]); }
function recPage(dir){ _recPage=Math.max(1,_recPage+dir); recRender(); }

var _invData=[]; var _invFil=[]; var _invPage=1; var _invPerPg=15; var _invDetId=null; var _invLoaded=false;

function invLoad(){
  var list=document.getElementById('inv-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat Invoice ISP…</p></div>';
  var sb=getSB();if(!sb){if(list)list.innerHTML='<div class="olt-empty"><i class="ti ti-wifi-off"></i><p>Database tidak terhubung</p></div>';return;}
  sb.from('invoice_isp').select('id,nomor,pel_id,status,total,tgl_invoice,tgl_bayar,keterangan,created_at').order('created_at',{ascending:false})
    .then(function(r){
      if(r.error){if(list)list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+_esc(r.error.message||'coba lagi')+'</p></div>';return;}
      _invData=r.data||[];_invLoaded=true;invUpdateStats();invRender();finUpdateDashboard();
    }).catch(function(){if(list)list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error</p></div>';});
}

function invUpdateStats(){
  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  e('invst-unpaid',_invData.filter(function(i){return i.status==='waiting_payment'||i.status==='sent';}).length);
  e('invst-paid',_invData.filter(function(i){return i.status==='paid';}).length);
  e('invst-void',_invData.filter(function(i){return i.status==='void';}).length);
}

function _genInvNo(){
  var d=new Date();var yy=d.getFullYear().toString().slice(-2);var mm=('0'+(d.getMonth()+1)).slice(-2);
  var n=(_invData.length+1).toString().padStart(4,'0');
  return 'INV-ISP-'+yy+mm+'-'+n;
}

function invSearch(q){_invPage=1;var c=document.getElementById('inv-search-clr');if(c)c.style.display=q?'block':'none';invRender();}
function invClearSearch(){var i=document.getElementById('inv-search');if(i)i.value='';var c=document.getElementById('inv-search-clr');if(c)c.style.display='none';_invPage=1;invRender();}

function invRender(){
  var q=(document.getElementById('inv-search')||{}).value||'';
  var fSt=(document.getElementById('inv-fil-status')||{}).value||'';
  q=q.toLowerCase().trim();
  var stLbl={draft:'Draft',sent:'Sent',waiting_payment:'Waiting Payment',paid:'Paid',void:'Void'};
  _invFil=_invData.filter(function(i){
    var matchQ=!q||(i.nomor_invoice||'').toLowerCase().includes(q)||(i.periode||'').toLowerCase().includes(q);
    var matchSt=!fSt||i.status===fSt;
    return matchQ&&matchSt;
  });
  var total=_invFil.length;var pages=Math.max(1,Math.ceil(total/_invPerPg));
  if(_invPage>pages) _invPage=pages;
  var start=(_invPage-1)*_invPerPg;
  var list=document.getElementById('inv-list');if(!list)return;
  if(!total){list.innerHTML='<div class="olt-empty"><i class="ti ti-file-off"></i><p>Tidak ada invoice</p></div>';document.getElementById('inv-pagi').style.display='none';return;}
  list.innerHTML=_invFil.slice(start,start+_invPerPg).map(_invRowHTML).join('');
  var pagi=document.getElementById('inv-pagi');
  if(pages>1){pagi.style.display='flex';var prev=document.getElementById('inv-prev');var next=document.getElementById('inv-next');var info=document.getElementById('inv-pagi-info');if(prev)prev.disabled=_invPage<=1;if(next)next.disabled=_invPage>=pages;if(info)info.textContent=_invPage+' / '+pages;}
  else pagi.style.display='none';
}

function _invRowHTML(i){
  var stTag={draft:'ty',sent:'tc1',waiting_payment:'tpu',paid:'tg',void:'tgr'};
  var stLbl={draft:'Draft',sent:'Sent',waiting_payment:'Waiting Payment',paid:'Paid',void:'Void'};
  var icoCls={draft:'draft',sent:'unpaid',waiting_payment:'unpaid',paid:'paid',void:'cancelled'};
  return '<div class="inv-row" onclick="invOpenDet(\''+i.id+'\')" >'+
    '<div class="inv-row-top">'+
      '<div class="inv-row-ico '+(icoCls[i.status]||'draft')+'"><i class="ti ti-file-invoice"></i></div>'+
      '<div class="inv-row-info">'+
        '<div class="inv-row-no">'+_esc(i.nomor_invoice||'—')+'</div>'+
        '<div class="inv-row-name">Periode '+_esc(i.periode||'—')+'</div>'+
      '</div>'+
      '<div class="inv-row-nominal">Rp '+_fmt(i.grand_total||0)+'</div>'+
    '</div>'+
    '<div class="inv-row-meta">'+
      '<span class="tag '+(stTag[i.status]||'ty')+'">'+_esc(stLbl[i.status]||i.status)+'</span>'+
      '<span class="tag tgr">OTF: Rp '+_fmt(i.total_otf||0)+'</span>'+
      '<span class="tag tgr">Rec: Rp '+_fmt(i.total_recurring||0)+'</span>'+
    '</div>'+
  '</div>';
}

function invPage(dir){var pages=Math.max(1,Math.ceil(_invFil.length/_invPerPg));_invPage=Math.min(pages,Math.max(1,_invPage+dir));invRender();}

function invOpenForm(data){
  var isEdit=!!data;
  document.getElementById('inv-form-title').textContent=isEdit?'Edit Invoice ISP':'Buat Invoice ISP';
  document.getElementById('invf-id').value=isEdit?(data.id||''):'';
  document.getElementById('invf-no').value=isEdit?(data.nomor_invoice||_genInvNo()):_genInvNo();
  var d=new Date();
  document.getElementById('invf-periode').value=isEdit?(data.periode||''):d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);
  document.getElementById('invf-tgl').value=isEdit?(data.tgl_invoice||''):d.toISOString().slice(0,10);
  document.getElementById('invf-total-otf').value=isEdit?(data.total_otf||0):0;
  document.getElementById('invf-total-rec').value=isEdit?(data.total_recurring||0):0;
  document.getElementById('invf-ppn').value=isEdit?(data.ppn_pct||11):11;
  document.getElementById('invf-status').value=isEdit?(data.status||'draft'):'draft';
  invCalcTotal();
  document.getElementById('invf-total-otf').oninput=invCalcTotal;
  document.getElementById('invf-total-rec').oninput=invCalcTotal;
  document.getElementById('invf-ppn').oninput=invCalcTotal;
  document.getElementById('inv-form-overlay').classList.add('on');
}
function invCalcTotal(){
  var otf=parseFloat(document.getElementById('invf-total-otf').value)||0;
  var rec=parseFloat(document.getElementById('invf-total-rec').value)||0;
  var ppn=parseFloat(document.getElementById('invf-ppn').value)||0;
  var sub=otf+rec;
  var grand=Math.round(sub*(1+ppn/100));
  document.getElementById('invf-subtotal').value='Rp '+_fmt(sub);
  document.getElementById('invf-grand').value='Rp '+_fmt(grand);
}
function invCloseForm(){document.getElementById('inv-form-overlay').classList.remove('on');}

function invSave(){
  var id=document.getElementById('invf-id').value;
  var no=document.getElementById('invf-no').value;
  var periode=document.getElementById('invf-periode').value;
  var tgl=document.getElementById('invf-tgl').value;
  var otf=parseFloat(document.getElementById('invf-total-otf').value)||0;
  var rec=parseFloat(document.getElementById('invf-total-rec').value)||0;
  var ppn=parseFloat(document.getElementById('invf-ppn').value)||0;
  var sub=otf+rec;
  var grand=Math.round(sub*(1+ppn/100));
  var status=document.getElementById('invf-status').value;
  if(!periode){toast('Isi periode','err');return;}
  var sb=getSB();if(!sb){toast('Database tidak terhubung','err');return;}
  var btn=document.getElementById('invf-save-btn');if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span>';}
  var payload={nomor_invoice:no,periode:periode,tgl_invoice:tgl||null,total_otf:otf,total_recurring:rec,subtotal:sub,ppn_pct:ppn,grand_total:grand,status:status};
  var p=id?sb.from('invoice_isp').update(payload).eq('id',id):sb.from('invoice_isp').insert([payload]);
  p.then(function(r){
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}
    if(r.error){toast('Gagal: '+(r.error.message||'coba lagi'),'err');return;}
    toast(id?'Invoice diperbarui':'Invoice ISP dibuat','ok');invCloseForm();_invLoaded=false;invLoad();
  }).catch(function(){if(btn)btn.disabled=false;toast('Error','err');});
}

function invOpenDet(id){
  var i=_invData.find(function(x){return x.id===id;});if(!i)return;
  _invDetId=id;
  document.getElementById('inv-det-title').textContent=i.nomor_invoice||'Detail Invoice';
  var stTag={draft:'ty',sent:'tc1',waiting_payment:'tpu',paid:'tg',void:'tgr'};
  var stLbl={draft:'Draft',sent:'Sent',waiting_payment:'Waiting Payment',paid:'Paid',void:'Void'};
  function dr(l,v){return '<div class="olt-det-row"><div class="olt-det-lbl">'+l+'</div><div class="olt-det-val">'+v+'</div></div>';}
  function sec(ico,t){return '<div class="olt-det-section"><i class="ti ti-'+ico+'"></i> '+t+'</div>';}
  document.getElementById('inv-det-body').innerHTML=
    sec('file-invoice','Invoice ISP')+
    dr('Nomor Invoice','<span style="font-family:\'JetBrains Mono\',monospace;color:var(--c1)">'+_esc(i.nomor_invoice||'—')+'</span>')+
    dr('Periode',_esc(i.periode||'—'))+
    dr('Tanggal Invoice',_esc(i.tgl_invoice||'—'))+
    dr('Status','<span class="tag '+(stTag[i.status]||'ty')+'">'+_esc(stLbl[i.status]||i.status)+'</span>')+
    sec('coin','Rincian')+
    dr('Total OTF','Rp '+_fmt(i.total_otf||0))+
    dr('Total Recurring','Rp '+_fmt(i.total_recurring||0))+
    dr('Subtotal','Rp '+_fmt(i.subtotal||0))+
    dr('PPN',(i.ppn_pct||0)+'%')+
    dr('Grand Total','<span style="font-family:\'JetBrains Mono\',monospace;font-size:16px;font-weight:800;color:var(--green)">Rp '+_fmt(i.grand_total||0)+'</span>')+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="invDelete(\''+i.id+'\')"><i class="ti ti-trash"></i> Hapus</button>'+
    '</div>';
  document.getElementById('inv-det-overlay').classList.add('on');
}
function invCloseDet(){document.getElementById('inv-det-overlay').classList.remove('on');_invDetId=null;}
function invDetEdit(){var i=_invData.find(function(x){return x.id===_invDetId;});if(!i)return;invCloseDet();invOpenForm(i);}
function invDelete(id){
  if(!confirm('Hapus invoice ini?'))return;
  var sb=getSB();if(!sb){toast('Database tidak terhubung','err');return;}
  sb.from('invoice_isp').delete().eq('id',id).then(function(r){if(r.error){toast('Gagal hapus','err');return;}toast('Invoice dihapus','ok');invCloseDet();_invLoaded=false;invLoad();}).catch(function(){toast('Error','err');});
}
function _isSiapBayar(s){ return s==='siap_bayar'||s==='waiting_payment'; }
function _isApproved(pid){ return _approvedPelList.some(function(p){return p&&p.id===pid;}); }
function _finEnsure(needOtf, needRec, cb){

  if(needOtf && !_otfLoaded && !_otfLoading) otfLoad();
  if(needRec && !_recLoaded) recLoad();
  var tries=0;
  (function poll(){
    var ok=(!needOtf||_otfLoaded)&&(!needRec||_recLoaded);

    if(ok||tries++>60){ cb(); return; }
    setTimeout(poll,200);
  })();
}
function _impSplit(line){
  var sep=line.indexOf('\t')>=0?'\t':((line.indexOf(';')>=0&&line.indexOf(',')<0)?';':',');
  return line.split(sep).map(function(c){ return c.replace(/^"|"$/g,'').trim(); });
}
var _valJenis = 'otf'; // 'otf' | 'rec'
function _valData(){ return _valJenis==='rec' ? _recData : _otfData; }
function _valTable(){ return _valJenis==='rec' ? 'fee_recurring' : 'fee_otf'; }
function _valLabel(){ return _valJenis==='rec' ? 'Recurring' : 'OTF'; }
function _valRefreshSource(){
  if(_valJenis==='rec'){ recUpdateStats(); recRender(); } else { otfUpdateStats(); otfRender(); }
}
function _feeNextPeriode(tglStr){
  var d=tglStr?new Date(tglStr):new Date(); d.setMonth(d.getMonth()+1);
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);
}
/* fee_otf pakai kolom 'tgl', fee_recurring pakai kolom 'tgl_bayar' — jangan dicampur,
   supaya tidak mengulang bug "column does not exist" seperti sebelumnya. */
function _feePaidPayload(tgl){
  return _valJenis==='rec' ? {status:'paid', tgl_bayar:tgl||null} : {status:'paid', tgl:tgl||null};
}
/* Payload carry-over "sisa bayar" — bentuknya beda antara OTF (kolom tgl/area/keterangan)
   dan Recurring (kolom periode/catatan), makanya perlu helper terpisah per jenis. */
function _feeCarryOverPayload(o, sisa, tgl, note){
  if(_valJenis==='rec'){
    return {pel_id:o.pel_id, periode:_feeNextPeriode(tgl), nominal:sisa, status:'menunggu_validasi', tgl_generate:new Date().toISOString().slice(0,10), catatan:note};
  }
  return {pel_id:o.pel_id, area:o.area, nominal:sisa, tgl:_feeNextPeriode(tgl)+'-01', status:'menunggu_validasi', keterangan:note};
}
function valSetJenis(j){
  _valJenis = (j==='rec') ? 'rec' : 'otf';
  var pairs=[['val-jenis-otf','val-jenis-rec'],['apvb-jenis-otf','apvb-jenis-rec'],['pay-jenis-otf','pay-jenis-rec']];
  pairs.forEach(function(pr){
    var b1=document.getElementById(pr[0]), b2=document.getElementById(pr[1]);
    if(b1){ b1.style.background=_valJenis==='otf'?'var(--c1)':'#fff'; b1.style.color=_valJenis==='otf'?'#fff':'var(--text2)'; }
    if(b2){ b2.style.background=_valJenis==='rec'?'var(--c1)':'#fff'; b2.style.color=_valJenis==='rec'?'#fff':'var(--text2)'; }
  });
  var lbl=document.getElementById('val-isp-btn-lbl'); if(lbl) lbl.textContent='Cocokkan dengan '+_valLabel();
  var ir=document.getElementById('val-isp-result'); if(ir) ir.innerHTML='';
  var ic=document.getElementById('val-isp-csv'); if(ic) ic.value='';
  window._valIspMatched=[];

  if(document.getElementById('val-list')){ valFillAreaFilter(); valResetFilter(); }
  if(document.getElementById('apvb-list')){ apvbFillFilter(); apvbResetFilter(); }
  if(document.getElementById('pay-list')){ _payLoaded=false; payLoad(); }
}

function valLoad(){
  var list=document.getElementById('val-list');

  if(list && _valTab!=='upload') list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data validasi…</p></div>';
  _finEnsure(true,true,function(){
    valFillAreaFilter();
    valRender();

    var lel=document.getElementById('val-list');
    if(lel && lel.innerHTML.indexOf('ti-loader-2')>=0){
      lel.innerHTML='<div class="olt-empty"><i class="ti ti-inbox" style="opacity:.35"></i><p>Tidak ada data yang menunggu validasi</p></div>';
    }
  });
}

var _valTab = 'manual';
function valTabSwitch(tab){
  _valTab = tab;
  var isUpload = (tab==='upload');

  var pu=document.getElementById('val-panel-upload'); if(pu) pu.style.display=isUpload?'block':'none';
  var pm=document.getElementById('val-panel-manual'); if(pm) pm.style.display=isUpload?'none':'block';

  var btnU=document.getElementById('val-tab-upload');
  var btnM=document.getElementById('val-tab-manual');
  if(btnU){ btnU.style.background=isUpload?'var(--pu)':'transparent'; btnU.style.color=isUpload?'#fff':'var(--text2)'; }
  if(btnM){ btnM.style.background=isUpload?'transparent':'var(--c1)'; btnM.style.color=isUpload?'var(--text2)':'#fff'; }

  var vl=document.getElementById('val-list'); if(vl) vl.style.display=isUpload?'none':'block';
  if(!isUpload) valRender();
}

var _valSearchQ = '';
function valManualSearch(q){
  _valSearchQ = (q||'').toLowerCase().trim();
  _valPage=1;
  var c=document.getElementById('val-search-clr'); if(c) c.style.display=_valSearchQ?'block':'none';
  valRender();
}
function valManualClearSearch(){
  _valSearchQ='';
  _valPage=1;
  var i=document.getElementById('val-search'); if(i) i.value='';
  var c=document.getElementById('val-search-clr'); if(c) c.style.display='none';
  valRender();
}

var _valPage = 1;
var _valPageSize = 20;
function valGoPage(p){
  _valPage = p;
  valRender();
}
function valRender(){
  var list=document.getElementById('val-list'); if(!list) return;
  var data=_valData();

  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  var allPend=data.filter(function(o){return o.status==='menunggu_validasi'||o.status==='draft';});
  e('valst-menunggu',allPend.length);
  e('valst-valid',data.filter(function(o){return _isSiapBayar(o.status);}).length);
  e('valst-invalid',allPend.filter(function(o){return !((o.nominal||0)>0);}).length);
  e('valst-nominal','Rp '+_fmt(allPend.reduce(function(a,o){return a+(o.nominal||0);},0)));

  if(_valTab==='upload'){ list.style.display='none'; return; }
  list.style.display='block';

  var fArea=(document.getElementById('val-fil-area')||{}).value||'';
  var fKec=(document.getElementById('val-fil-kec')||{}).value||'';
  var fKel=(document.getElementById('val-fil-kel')||{}).value||'';
  var fRw=(document.getElementById('val-fil-rw')||{}).value||'';
  var fRt=(document.getElementById('val-fil-rt')||{}).value||'';
  var pend=allPend.filter(function(o){
    var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;});
    if(fArea){ if(!p||p.area_id!==fArea) return false; }
    if(fKec){ if(!p||(p.kecamatan||'')!==fKec) return false; }
    if(fKel){ if(!p||(p.kelurahan||'')!==fKel) return false; }
    if(fRw){ if(!p||(p.rw||'')!==fRw) return false; }
    if(fRt){ if(!p||(p.rt||'')!==fRt) return false; }
    if(_valSearchQ){
      var cid=(_otfPelCID(o.pel_id)||'').toLowerCase();
      var nama=(_otfPelName(o.pel_id)||'').toLowerCase();
      if(!cid.includes(_valSearchQ)&&!nama.includes(_valSearchQ)) return false;
    }
    return true;
  });
  if(!pend.length){ list.innerHTML='<div class="olt-empty"><i class="ti ti-checks"></i><p>Tidak ada '+_valLabel()+' yang menunggu verifikasi</p></div>'; return; }

  var totalItem=pend.length;
  var totalPage=Math.ceil(totalItem/_valPageSize);
  if(_valPage<1) _valPage=1;
  if(_valPage>totalPage) _valPage=totalPage;
  var start=(_valPage-1)*_valPageSize;
  var pageItems=pend.slice(start,start+_valPageSize);
  var cardsHtml=pageItems.map(function(o){
    var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;});
    var nomOk=(o.nominal||0)>0; var ok=nomOk;
    var areaN=_otfPelAreaName(o.pel_id); var kec=p&&p.kecamatan||''; var kel=p&&p.kelurahan||''; var rw=p&&p.rw||''; var rt=p&&p.rt||'';
    var loks=[]; if(areaN) loks.push(areaN); if(kec) loks.push('Kec. '+kec); if(kel) loks.push(kel); if(rw) loks.push('RW '+rw); if(rt) loks.push('RT '+rt);
    var tglFmt=o.tgl||o.periode||(o.created_at?(o.created_at+'').slice(0,10):'');
    return '<div class="fin-rekap-card">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
        '<div><div style="font-size:13px;font-weight:800;color:var(--c1)">'+_esc(_otfPelCID(o.pel_id))+'</div><div style="font-size:12px;font-weight:700">'+_esc(_otfPelName(o.pel_id))+'</div></div>'+
        '<div style="font-family:\'JetBrains Mono\',monospace;font-weight:800;font-size:15px">Rp '+_fmt(o.nominal||0)+'</div>'+
      '</div>'+
      (loks.length?'<div style="font-size:10px;color:var(--text3);margin-bottom:5px"><i class="ti ti-map-pin" style="font-size:9px"></i> '+_esc(loks.join(' \u00b7 '))+'</div>':'')+
      (tglFmt?'<div style="font-size:10px;color:var(--text3);margin-bottom:6px"><i class="ti ti-calendar" style="font-size:9px"></i> '+_esc(tglFmt)+'</div>':'')+
      '<div style="font-size:10px;color:var(--text2);margin:4px 0 8px">'+
        '<span><i class="ti ti-'+(nomOk?'circle-check':'circle-x')+'" style="color:var(--'+(nomOk?'green':'red')+');margin-right:3px"></i>'+(nomOk?'Nominal valid':'Nominal belum diisi')+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:8px;margin-top:4px">'+
        '<button class="btn" style="flex:1;background:var(--green)'+(ok?'':';opacity:.4;pointer-events:none')+'" onclick="valMark(\''+o.id+'\',true)"><i class="ti ti-circle-check"></i> Validasi</button>'+
        '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="valMark(\''+o.id+'\',false)"><i class="ti ti-circle-x"></i> Tolak</button>'+
      '</div>'+
    '</div>';
  }).join('');

  var pgBtns='';
  if(totalPage>1){
    var pStart=Math.max(1,_valPage-2);
    var pEnd=Math.min(totalPage,pStart+4);
    if(pEnd-pStart<4) pStart=Math.max(1,pEnd-4);
    pgBtns='<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 4px;flex-wrap:wrap">'+
      '<button onclick="valGoPage('+(_valPage-1)+')" '+((_valPage===1)?'disabled':'')+' style="min-width:34px;height:34px;border:1.5px solid var(--border2);border-radius:8px;background:var(--bg2);color:var(--text2);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:'+(_valPage===1?'.35':'1')+'"><i class="ti ti-chevron-left"></i></button>';
    for(var pg=pStart;pg<=pEnd;pg++){
      var isActive=(pg===_valPage);
      pgBtns+='<button onclick="valGoPage('+pg+')" style="min-width:34px;height:34px;border:1.5px solid '+(isActive?'var(--c1)':'var(--border2)')+';border-radius:8px;background:'+(isActive?'var(--c1)':'var(--bg2)')+';color:'+(isActive?'#fff':'var(--text2)')+';font-size:13px;font-weight:'+(isActive?'700':'500')+';cursor:pointer">'+pg+'</button>';
    }
    pgBtns+='<button onclick="valGoPage('+(_valPage+1)+')" '+((_valPage===totalPage)?'disabled':'')+' style="min-width:34px;height:34px;border:1.5px solid var(--border2);border-radius:8px;background:var(--bg2);color:var(--text2);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:'+(_valPage===totalPage?'.35':'1')+'"><i class="ti ti-chevron-right"></i></button>'+
      '</div>'+
      '<div style="text-align:center;font-size:11px;color:var(--text3);padding-bottom:8px">'+
        'Halaman '+_valPage+' dari '+totalPage+' &nbsp;·&nbsp; Total '+totalItem+' data'+
      '</div>';
  }
  list.innerHTML=cardsHtml+pgBtns;
}

function valIspFile(input){
  var f=input.files&&input.files[0]; if(!f) return;
  var rd=new FileReader(); rd.onload=function(){ document.getElementById('val-isp-csv').value=rd.result||''; }; rd.readAsText(f);
}
function valIspProses(){
  var raw=(document.getElementById('val-isp-csv').value||'').trim();
  var box=document.getElementById('val-isp-result');
  if(!raw){ toast('Tempel atau pilih file CID dari ISP','err'); return; }
  var lines=raw.split(/\r?\n/).filter(function(l){return l.trim();});

  if(lines.length && /cid/i.test(lines[0])) lines=lines.slice(1);


  var parsed=lines.map(function(l){
    var cols=l.split(/[,;\t]/);
    return {
      cid:(cols[0]||'').trim().toUpperCase(),
      nama:(cols[1]||'').trim().toLowerCase(),
      area:(cols[2]||'').trim().toLowerCase()
    };
  }).filter(function(x){return x.cid;});

  if(!parsed.length){ toast('Tidak ada CID valid pada file','err'); return; }


  var cidCount={};
  parsed.forEach(function(x){ cidCount[x.cid]=(cidCount[x.cid]||0)+1; });
  var doubles=Object.keys(cidCount).filter(function(c){return cidCount[c]>1;});
  if(doubles.length){
    box.innerHTML=
      '<div style="background:var(--rg2);border:1.5px solid rgba(220,38,38,.25);border-radius:var(--rs);padding:12px 14px">'+
        '<div style="font-size:12px;font-weight:800;color:var(--red);margin-bottom:8px"><i class="ti ti-alert-triangle"></i> CID DUPLIKAT DITEMUKAN — Upload Dibatalkan</div>'+
        '<div style="font-size:11px;color:var(--text2);margin-bottom:8px;line-height:1.6">File tidak boleh mengandung CID yang sama lebih dari satu kali. Perbaiki file lalu upload ulang.</div>'+
        '<div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:6px">CID duplikat ('+doubles.length+'):</div>'+
        doubles.map(function(c){
          return '<div style="font-family:\'JetBrains Mono\',monospace;font-size:11px;padding:3px 0;border-bottom:1px solid rgba(220,38,38,.1)">'+
            '<i class="ti ti-copy" style="font-size:10px;color:var(--red)"></i> '+_esc(c)+
            ' <span style="color:var(--text3)">(muncul '+cidCount[c]+'x)</span></div>';
        }).join('')+
      '</div>';
    window._valIspMatched=[];
    return;
  }


  var pending=_valData().filter(function(o){return o.status==='menunggu_validasi'||o.status==='draft';});
  var matched=[]; var tidakCocok=[]; var cidTidakAda=[];

  parsed.forEach(function(row){
    var o=pending.find(function(o){
      var cidOk=(_otfPelCID(o.pel_id)||'').toUpperCase()===row.cid;
      if(!cidOk) return false;

      if(row.nama){
        var namaSys=(_otfPelName(o.pel_id)||'').toLowerCase();
        if(!namaSys.includes(row.nama)&&!row.nama.includes(namaSys.substring(0,4))) return false;
      }

      if(row.area){
        var areaSys=(_otfPelAreaName(o.pel_id)||'').toLowerCase();
        var areaOtf=(o.area||'').toLowerCase();
        if(!areaSys.includes(row.area)&&!areaOtf.includes(row.area)) return false;
      }
      return true;
    });
    if(o) matched.push({otf:o, row:row});
    else {

      var cidAda=pending.some(function(o){return (_otfPelCID(o.pel_id)||'').toUpperCase()===row.cid;});
      if(cidAda) tidakCocok.push(row);
      else cidTidakAda.push(row.cid);
    }
  });

  var matchedOtf=matched.map(function(m){return m.otf;});
  var unmatched=pending.filter(function(o){return !matchedOtf.some(function(m){return m.id===o.id;});});
  var jenisLbl=_valLabel();

  box.innerHTML=
    '<div class="card" style="padding:12px;margin-bottom:8px">'+
      '<div style="font-size:11px;font-weight:800;color:var(--c1);margin-bottom:8px"><i class="ti ti-checks"></i> HASIL PENCOCOKAN</div>'+
      '<div class="fin-rekap-row"><span class="fin-rekap-lbl">Total CID di File ISP</span><span class="fin-rekap-val">'+parsed.length+'</span></div>'+
      '<div class="fin-rekap-row"><span class="fin-rekap-lbl">Cocok (CID + Nama + Area)</span><span class="fin-rekap-val" style="color:var(--green)">'+matched.length+'</span></div>'+
      (tidakCocok.length?'<div class="fin-rekap-row"><span class="fin-rekap-lbl">CID ada tapi Nama/Area tidak cocok</span><span class="fin-rekap-val" style="color:var(--yellow)">'+tidakCocok.length+'</span></div>':'')+
      '<div class="fin-rekap-row"><span class="fin-rekap-lbl">'+jenisLbl+' Pending tidak di file</span><span class="fin-rekap-val" style="color:var(--text3)">'+unmatched.length+'</span></div>'+
      '<div class="fin-rekap-row" style="border:none"><span class="fin-rekap-lbl">CID tidak ditemukan di sistem</span><span class="fin-rekap-val" style="color:var(--text3)">'+cidTidakAda.length+'</span></div>'+
    '</div>'+

    (tidakCocok.length?
      '<div style="background:var(--yg);border:1.5px solid rgba(217,119,6,.25);border-radius:var(--rs);padding:10px 12px;margin-bottom:8px">'+
        '<div style="font-size:11px;font-weight:800;color:var(--yellow);margin-bottom:5px"><i class="ti ti-alert-circle"></i> Nama/Area tidak cocok ('+tidakCocok.length+'):</div>'+
        tidakCocok.map(function(r){
          return '<div style="font-size:10px;padding:3px 0;border-bottom:1px solid rgba(217,119,6,.15)">'+
            '<strong>'+_esc(r.cid)+'</strong>'+(r.nama?' · '+_esc(r.nama):'')+(r.area?' · '+_esc(r.area):'')+'</div>';
        }).join('')+
      '</div>'
    :'')+

    (matched.length?
      '<div style="background:rgba(5,150,105,.08);border:1.5px solid rgba(5,150,105,.2);border-radius:var(--rs);padding:10px 12px;margin-bottom:8px">'+
        '<div style="font-size:11px;font-weight:800;color:var(--green);margin-bottom:6px"><i class="ti ti-list-check"></i> Yang akan divalidasi ('+matched.length+'):</div>'+
        matched.map(function(m){
          var o=m.otf; var areaN=_otfPelAreaName(o.pel_id);
          return '<div style="font-size:11px;padding:4px 0;border-bottom:1px solid rgba(5,150,105,.1)">'+
            '<i class="ti ti-circle-check" style="color:var(--green);font-size:10px"></i> '+
            '<strong>'+_esc(_otfPelCID(o.pel_id))+'</strong> · '+_esc(_otfPelName(o.pel_id))+
            (areaN?' <span style="color:var(--text3);font-size:10px">· '+_esc(areaN)+'</span>':'')+
            ' <span style="float:right;font-family:\'JetBrains Mono\',monospace;font-weight:700;color:var(--green)">Rp '+_fmt(o.nominal||0)+'</span></div>';
        }).join('')+
      '</div>'+
      '<button onclick="valIspKonfirmasi()" style="width:100%;padding:12px;border:none;border-radius:var(--rs);background:var(--green);color:#fff;font-family:\'Sora\',sans-serif;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;touch-action:manipulation">'+
        '<i class="ti ti-circle-check" style="font-size:16px"></i> Konfirmasi & Validasi '+matched.length+' '+jenisLbl+' \u2192 Siap Bayar'+
      '</button>'
    :'<div style="text-align:center;padding:12px;color:var(--text3);font-size:12px"><i class="ti ti-mood-sad"></i> Tidak ada '+jenisLbl+' yang cocok dengan file ISP</div>');

  window._valIspMatched = matchedOtf;
}
function valIspKonfirmasi(){
  var matched=window._valIspMatched||[];
  if(!matched.length){ toast('Tidak ada yang perlu dikonfirmasi','err'); return; }
  var eligible=matched.filter(function(o){return (o.nominal||0)>0;});
  if(!eligible.length){ toast('Tidak ada '+_valLabel()+' dengan nominal valid','err'); return; }
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var ids=eligible.map(function(o){return o.id;});
  sb.from(_valTable()).update({status:'siap_bayar'}).in('id',ids).then(function(r){
    if(r.error){ toast('Gagal: '+(r.error.message||''),'err'); return; }
    eligible.forEach(function(o){ o.status='siap_bayar'; });
    toast(eligible.length+' '+_valLabel()+' \u2192 Siap Bayar \u2713','ok');
    document.getElementById('val-isp-result').innerHTML='';
    document.getElementById('val-isp-csv').value='';
    window._valIspMatched=[];
    valRender(); _valRefreshSource();
  }).catch(function(){ toast('Error','err'); });
}

function valFillAreaFilter(){
  var sel=document.getElementById('val-fil-area'); if(!sel) return;
  var cur=sel.value;
  sel.innerHTML='<option value="">— Semua Area —</option>';
  _areaData.forEach(function(a){ var o=document.createElement('option'); o.value=a.id; o.textContent=a.nama||(a.kode||''); sel.appendChild(o); });
  if(cur) sel.value=cur;
}
function valCascadeArea(){
  var aId=(document.getElementById('val-fil-area')||{}).value||'';
  var selKec=document.getElementById('val-fil-kec');
  selKec.innerHTML='<option value="">— Semua Kecamatan —</option>'; selKec.disabled=!aId;
  if(aId){
    var kecs=[]; _approvedPelList.forEach(function(p){if(p&&p.area_id===aId&&p.kecamatan&&kecs.indexOf(p.kecamatan)<0)kecs.push(p.kecamatan);});
    kecs.sort().forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k;selKec.appendChild(o);});
  }
  ['val-fil-kel','val-fil-rw','val-fil-rt'].forEach(function(id){var s=document.getElementById(id);if(s){s.innerHTML='<option value="">'+s.options[0].text+'</option>';s.disabled=true;}});
  _valPage=1; valRender();
}
function valCascadeKec(){
  var aId=(document.getElementById('val-fil-area')||{}).value||'';
  var kec=(document.getElementById('val-fil-kec')||{}).value||'';
  var selKel=document.getElementById('val-fil-kel');
  selKel.innerHTML='<option value="">— Semua Kelurahan —</option>'; selKel.disabled=!kec;
  if(kec){
    var kels=[]; _approvedPelList.forEach(function(p){if(p&&(!aId||p.area_id===aId)&&p.kecamatan===kec&&p.kelurahan&&kels.indexOf(p.kelurahan)<0)kels.push(p.kelurahan);});
    kels.sort().forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k;selKel.appendChild(o);});
  }
  ['val-fil-rw','val-fil-rt'].forEach(function(id){var s=document.getElementById(id);if(s){s.innerHTML='<option value="">'+s.options[0].text+'</option>';s.disabled=true;}});
  _valPage=1; valRender();
}
function valCascadeKel(){
  var aId=(document.getElementById('val-fil-area')||{}).value||'';
  var kec=(document.getElementById('val-fil-kec')||{}).value||'';
  var kel=(document.getElementById('val-fil-kel')||{}).value||'';
  var selRw=document.getElementById('val-fil-rw');
  selRw.innerHTML='<option value="">— Semua RW —</option>'; selRw.disabled=!kel;
  if(kel){
    var rws=[]; _approvedPelList.forEach(function(p){if(p&&(!aId||p.area_id===aId)&&(!kec||p.kecamatan===kec)&&p.kelurahan===kel&&p.rw&&rws.indexOf(p.rw)<0)rws.push(p.rw);});
    rws.sort().forEach(function(r){var o=document.createElement('option');o.value=r;o.textContent='RW '+r;selRw.appendChild(o);});
  }
  var selRt=document.getElementById('val-fil-rt'); if(selRt){selRt.innerHTML='<option value="">— Semua RT —</option>';selRt.disabled=true;}
  _valPage=1; valRender();
}
function valCascadeRw(){
  var aId=(document.getElementById('val-fil-area')||{}).value||'';
  var kec=(document.getElementById('val-fil-kec')||{}).value||'';
  var kel=(document.getElementById('val-fil-kel')||{}).value||'';
  var rw=(document.getElementById('val-fil-rw')||{}).value||'';
  var selRt=document.getElementById('val-fil-rt');
  selRt.innerHTML='<option value="">— Semua RT —</option>'; selRt.disabled=!rw;
  if(rw){
    var rts=[]; _approvedPelList.forEach(function(p){if(p&&(!aId||p.area_id===aId)&&(!kec||p.kecamatan===kec)&&(!kel||p.kelurahan===kel)&&p.rw===rw&&p.rt&&rts.indexOf(p.rt)<0)rts.push(p.rt);});
    rts.sort().forEach(function(r){var o=document.createElement('option');o.value=r;o.textContent='RT '+r;selRt.appendChild(o);});
  }
  _valPage=1; valRender();
}
function valResetFilter(){
  _valSearchQ='';
  var si=document.getElementById('val-search'); if(si) si.value='';
  var sc=document.getElementById('val-search-clr'); if(sc) sc.style.display='none';
  ['val-fil-area','val-fil-kec','val-fil-kel','val-fil-rw','val-fil-rt'].forEach(function(id){
    var s=document.getElementById(id); if(!s) return; s.value=''; s.disabled=(id!=='val-fil-area');
  });
  _valPage=1; valRender();
}

function valMark(id,valid){
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var o=_valData().find(function(x){return x.id===id;}); if(!o) return;
  if(valid && !((o.nominal||0)>0)){ toast('Nominal '+_valLabel()+' belum diisi','err'); return; }
  var newSt=valid?'siap_bayar':'draft';
  sb.from(_valTable()).update({status:newSt}).eq('id',id).then(function(r){
    if(r.error){ toast('Gagal: '+(r.error.message||''),'err'); return; }
    o.status=newSt; toast(valid?'Tervalidasi \u2192 Siap Bayar':'Dikembalikan ke Draft','ok');
    valRender(); _valRefreshSource();
  }).catch(function(){ toast('Error','err'); });
}
var _apvbPage = 1; var _apvbPerPage = 50;
function apvbLoad(){
  var list=document.getElementById('apvb-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat antrian bayar…</p></div>';
  _apvbPage = 1;
  _finEnsure(true,true,function(){
    var b1=document.getElementById('apvb-jenis-otf'), b2=document.getElementById('apvb-jenis-rec');
    if(b1){ b1.style.background=_valJenis==='otf'?'var(--c1)':'#fff'; b1.style.color=_valJenis==='otf'?'#fff':'var(--text2)'; }
    if(b2){ b2.style.background=_valJenis==='rec'?'var(--c1)':'#fff'; b2.style.color=_valJenis==='rec'?'#fff':'var(--text2)'; }
    apvbFillFilter(); apvbRender();
  });
}
function apvbFillFilter(){
  var sel=document.getElementById('apvb-fil-area'); if(!sel) return;
  sel.innerHTML='<option value="">— Semua Area —</option>';
  _areaData.forEach(function(a){ var o=document.createElement('option'); o.value=a.id; o.textContent=a.nama||(a.kode||''); sel.appendChild(o); });
}
function apvbCascadeArea(){
  var aId=(document.getElementById('apvb-fil-area')||{}).value||'';
  var selKec=document.getElementById('apvb-fil-kec');
  selKec.innerHTML='<option value="">— Semua Kecamatan —</option>'; selKec.disabled=!aId;
  if(aId){
    var kecs=[]; _approvedPelList.forEach(function(p){if(p&&p.area_id===aId&&p.kecamatan&&kecs.indexOf(p.kecamatan)<0)kecs.push(p.kecamatan);});
    kecs.sort().forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k;selKec.appendChild(o);});
  }
  ['apvb-fil-kel','apvb-fil-rw','apvb-fil-rt'].forEach(function(id){var s=document.getElementById(id);if(s){s.innerHTML='<option value="">'+s.options[0].text+'</option>';s.disabled=true;}});
  apvbSetFilter();
}
function apvbCascadeKec(){
  var aId=(document.getElementById('apvb-fil-area')||{}).value||'';
  var kec=(document.getElementById('apvb-fil-kec')||{}).value||'';
  var selKel=document.getElementById('apvb-fil-kel');
  selKel.innerHTML='<option value="">— Semua Kelurahan —</option>'; selKel.disabled=!kec;
  if(kec){
    var kels=[]; _approvedPelList.forEach(function(p){if(p&&(!aId||p.area_id===aId)&&p.kecamatan===kec&&p.kelurahan&&kels.indexOf(p.kelurahan)<0)kels.push(p.kelurahan);});
    kels.sort().forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=k;selKel.appendChild(o);});
  }
  ['apvb-fil-rw','apvb-fil-rt'].forEach(function(id){var s=document.getElementById(id);if(s){s.innerHTML='<option value="">'+s.options[0].text+'</option>';s.disabled=true;}});
  apvbSetFilter();
}
function apvbCascadeKel(){
  var aId=(document.getElementById('apvb-fil-area')||{}).value||'';
  var kec=(document.getElementById('apvb-fil-kec')||{}).value||'';
  var kel=(document.getElementById('apvb-fil-kel')||{}).value||'';
  var selRw=document.getElementById('apvb-fil-rw');
  selRw.innerHTML='<option value="">— Semua RW —</option>'; selRw.disabled=!kel;
  if(kel){
    var rws=[]; _approvedPelList.forEach(function(p){if(p&&(!aId||p.area_id===aId)&&(!kec||p.kecamatan===kec)&&p.kelurahan===kel&&p.rw&&rws.indexOf(p.rw)<0)rws.push(p.rw);});
    rws.sort().forEach(function(r){var o=document.createElement('option');o.value=r;o.textContent='RW '+r;selRw.appendChild(o);});
    var selRt=document.getElementById('apvb-fil-rt'); selRt.innerHTML='<option value="">— Semua RT —</option>'; selRt.disabled=true;
  }
  apvbSetFilter();
}
function apvbResetFilter(){
  ['apvb-fil-area','apvb-fil-kec','apvb-fil-kel','apvb-fil-rw','apvb-fil-rt'].forEach(function(id){
    var s=document.getElementById(id); if(!s) return; s.value=''; s.disabled=(id!=='apvb-fil-area');
  });
  _apvbPage=1; apvbRender();
}
function apvbRender(){
  var list=document.getElementById('apvb-list'); if(!list) return;
  var fArea=(document.getElementById('apvb-fil-area')||{}).value||'';
  var fKec=(document.getElementById('apvb-fil-kec')||{}).value||'';
  var fKel=(document.getElementById('apvb-fil-kel')||{}).value||'';
  var fRw=(document.getElementById('apvb-fil-rw')||{}).value||'';
  var fRt=(document.getElementById('apvb-fil-rt')||{}).value||'';
  var antri=_valData().filter(function(o){
    if(!_isSiapBayar(o.status)) return false;

    if(fArea||fKec||fKel||fRw||fRt){
      var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;});
      if(fArea && (!p||p.area_id!==fArea)) return false;
      if(fKec && (!p||(p.kecamatan||'')!==fKec)) return false;
      if(fKel && (!p||(p.kelurahan||'')!==fKel)) return false;
      if(fRw && (!p||(p.rw||'')!==fRw)) return false;
      if(fRt && (!p||(p.rt||'')!==fRt)) return false;
    }
    return true;
  });
  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  e('apvbst-antri',_valData().filter(function(o){return _isSiapBayar(o.status);}).length);
  e('apvbst-nominal','Rp '+_fmt(_valData().filter(function(o){return _isSiapBayar(o.status);}).reduce(function(a,o){return a+(o.nominal||0);},0)));
  e('apvbst-paid',_valData().filter(function(o){return o.status==='paid';}).length);


  var bWrap=document.getElementById('apvb-bulk-btn-wrap');
  if(bWrap){
    if(antri.length>1){
      bWrap.style.display='block';
      e('apvb-bulk-count', antri.length);
      e('apvb-bulk-total-lbl','Rp '+_fmt(antri.reduce(function(a,o){return a+(o.nominal||0);},0)));
    } else { bWrap.style.display='none'; }
  }

  if(!antri.length){ list.innerHTML='<div class="olt-empty"><i class="ti ti-wallet-off"></i><p>Tidak ada fee di antrian bayar</p></div>'; return; }


  var totalData = antri.length;
  var totalPage = Math.ceil(totalData/_apvbPerPage);
  if(_apvbPage > totalPage) _apvbPage = totalPage;
  if(_apvbPage < 1) _apvbPage = 1;
  var start = (_apvbPage-1)*_apvbPerPage;
  var pageData = antri.slice(start, start+_apvbPerPage);

  var rows = pageData.map(function(o){
    var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;});
    var areaN=_otfPelAreaName(o.pel_id); var kec=p&&p.kecamatan||''; var rw=p&&p.rw||''; var rt=p&&p.rt||'';
    var loks=[]; if(areaN) loks.push(areaN); if(kec) loks.push('Kec. '+kec); if(rw) loks.push('RW '+rw); if(rt) loks.push('RT '+rt);
    return '<div class="fin-rekap-card">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
        '<div><div style="font-size:13px;font-weight:800">'+_esc(_otfPelCID(o.pel_id))+'</div><div style="font-size:11px;color:var(--text3)">'+_esc(_otfPelName(o.pel_id))+'</div></div>'+
        '<div style="font-family:\'JetBrains Mono\',monospace;font-weight:800;color:var(--green)">Rp '+_fmt(o.nominal||0)+'</div>'+
      '</div>'+
      (loks.length?'<div style="font-size:10px;color:var(--text3);margin-bottom:8px"><i class="ti ti-map-pin" style="font-size:9px"></i> '+_esc(loks.join(' · '))+'</div>':'')+
      '<div style="display:flex;gap:8px;align-items:center">'+
        '<span class="tag tg"><i class="ti ti-circle-check"></i> Tervalidasi</span>'+
        '<button class="btn" style="flex:1;background:var(--green)" onclick="otfpayOpen(\''+o.id+'\')"><i class="ti ti-cash"></i> Bayar</button>'+
      '</div>'+
    '</div>';
  }).join('');


  var pgCtrl = '';
  if(totalPage > 1){
    pgCtrl = '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;gap:8px">'+
      '<button onclick="_apvbPage=Math.max(1,_apvbPage-1);apvbRender()" style="flex:1;padding:8px;border:1.5px solid var(--border2);border-radius:var(--rs);background:transparent;color:var(--text2);font-family:\'Sora\',sans-serif;font-size:12px;font-weight:700;cursor:pointer" '+((_apvbPage<=1)?'disabled':'')+'>&#8592; Prev</button>'+
      '<span style="font-size:11px;font-weight:700;color:var(--text3);white-space:nowrap">'+_apvbPage+' / '+totalPage+' <span style="font-weight:400">('+totalData+' data)</span></span>'+
      '<button onclick="_apvbPage=Math.min('+totalPage+',_apvbPage+1);apvbRender()" style="flex:1;padding:8px;border:1.5px solid var(--border2);border-radius:var(--rs);background:transparent;color:var(--text2);font-family:\'Sora\',sans-serif;font-size:12px;font-weight:700;cursor:pointer" '+((_apvbPage>=totalPage)?'disabled':'')+'>Next &#8594;</button>'+
    '</div>';
  } else {
    pgCtrl = '<div style="text-align:center;font-size:10px;color:var(--text3);margin-top:8px">'+totalData+' data</div>';
  }

  list.innerHTML = rows + pgCtrl;
}

function apvbSetFilter(){

  _apvbPage = 1;
  apvbRender();
}

function otfpayOpen(id){
  var o=_valData().find(function(x){return x.id===id;}); if(!o) return;
  document.getElementById('otfpay-id').value=id;
  document.getElementById('otfpay-nominal-full').value=o.nominal||0;
  document.getElementById('otfpay-info').innerHTML=
    '<strong>'+_esc(_otfPelCID(o.pel_id))+'</strong> · '+_esc(_otfPelName(o.pel_id))+
    '<br><span style="font-family:\'JetBrains Mono\',monospace;font-size:13px;font-weight:800">Rp '+_fmt(o.nominal||0)+'</span>';
  document.getElementById('otfpay-tgl').value=new Date().toISOString().slice(0,10);
  document.getElementById('otfpay-nominal').value=o.nominal||0;
  document.getElementById('otfpay-metode').value='transfer';
  document.getElementById('otfpay-ref').value='';
  document.getElementById('otfpay-ket').value='';
  otfpaySetMode('full');
  document.getElementById('otfpay-overlay').classList.add('on');
}
function otfpaySetMode(mode){
  var full=parseFloat(document.getElementById('otfpay-nominal-full').value)||0;
  var modes=['full','half','manual'];
  var colors={full:'var(--green)',half:'var(--yellow)',manual:'var(--c1)'};
  modes.forEach(function(m){
    var btn=document.getElementById('otfpay-mode-'+m); if(!btn) return;
    var active=(m===mode);
    btn.style.borderColor=active?colors[m]:'var(--border2)';
    btn.style.background=active?('rgba('+{full:'5,150,105',half:'217,119,6',manual:'26,86,219'}[m]+',.12)'):'transparent';
    btn.style.color=active?colors[m]:'var(--text2)';
  });
  var nomEl=document.getElementById('otfpay-nominal');
  var sisaWrap=document.getElementById('otfpay-sisa-wrap');
  var coInfo=document.getElementById('otfpay-carryover-info');
  if(mode==='full'){ nomEl.value=full; nomEl.readOnly=true; sisaWrap.style.display='none'; coInfo.style.display='none'; }
  else if(mode==='half'){ nomEl.value=Math.floor(full/2); nomEl.readOnly=false; sisaWrap.style.display='block'; coInfo.style.display='block'; otfpayUpdateSisa(); }
  else { nomEl.value=''; nomEl.readOnly=false; sisaWrap.style.display='block'; coInfo.style.display='block'; otfpayUpdateSisa(); }
  nomEl.dataset.mode=mode;
}
function otfpayUpdateSisa(){
  var full=parseFloat(document.getElementById('otfpay-nominal-full').value)||0;
  var bayar=parseFloat(document.getElementById('otfpay-nominal').value)||0;
  var sisa=Math.max(0,full-bayar);
  var sisaEl=document.getElementById('otfpay-sisa-val');
  if(sisaEl) sisaEl.textContent='Rp '+_fmt(sisa);
}
function otfpayClose(){ document.getElementById('otfpay-overlay').classList.remove('on'); }
function otfpaySave(){
  var id=document.getElementById('otfpay-id').value;
  var o=_valData().find(function(x){return x.id===id;}); if(!o){ toast('Data tidak ditemukan','err'); return; }

  var tgl=document.getElementById('otfpay-tgl').value;
  var nominal=parseFloat(document.getElementById('otfpay-nominal').value)||0;
  var full=parseFloat(document.getElementById('otfpay-nominal-full').value)||0;
  var metode=document.getElementById('otfpay-metode').value;
  var ref=document.getElementById('otfpay-ref').value.trim();
  var ket=document.getElementById('otfpay-ket').value.trim();
  var mode=(document.getElementById('otfpay-nominal')||{}).dataset&&document.getElementById('otfpay-nominal').dataset.mode||'full';
  if(!nominal){ toast('Isi nominal','err'); return; }
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('otfpay-save-btn'); if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }
  var sisa=Math.max(0,full-nominal);
  sb.from(_valTable()).update(_feePaidPayload(tgl)).eq('id',id).then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-check"></i> Bayar &amp; Selesai'; }
    if(r.error){ toast('Gagal: '+(r.error.message||''),'err'); return; }

    try{ sb.from('pembayaran_isp').insert([{tgl_bayar:tgl||null,nominal:nominal,metode:metode,bukti:ref||null,bank:ket||null,status:'verified'}]).then(function(){}).catch(function(){}); }catch(e){}

    if(sisa>0){
      var nextBln=_feeNextPeriode(tgl);
      var note='Carry-over dari '+_valLabel()+' '+(_otfPelCID(o.pel_id)||id)+' \u00b7 sisa Rp '+_fmt(sisa);
      try{ sb.from(_valTable()).insert([_feeCarryOverPayload(o,sisa,tgl,note)]).then(function(){}).catch(function(){}); }catch(e){}
      toast('Paid Rp '+_fmt(nominal)+' · Carry-over Rp '+_fmt(sisa)+' ke '+nextBln,'ok');
    } else {
      toast('Pembayaran selesai · Paid ✓','ok');
    }
    o.status='paid'; if(tgl){ o.tgl=tgl; o.tgl_bayar=tgl; }
    otfpayClose(); _payLoaded=false; apvbRender(); _valRefreshSource();
  }).catch(function(){ if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-check"></i> Bayar &amp; Selesai';} toast('Error','err'); });
}
var _apvbBulkItems = [];
var _apvbBulkMode  = 'rw';
var _apvbBulkRtMap = {};

function apvbBulkOpen(){

  var fArea=(document.getElementById('apvb-fil-area')||{}).value||'';
  var fKec =(document.getElementById('apvb-fil-kec') ||{}).value||'';
  var fKel =(document.getElementById('apvb-fil-kel') ||{}).value||'';
  var fRw  =(document.getElementById('apvb-fil-rw')  ||{}).value||'';
  var fRt  =(document.getElementById('apvb-fil-rt')  ||{}).value||'';

  _apvbBulkItems = _valData().filter(function(o){
    if(!_isSiapBayar(o.status)) return false;
    if(fArea||fKec||fKel||fRw||fRt){
      var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;});
      if(fArea && (!p||p.area_id!==fArea)) return false;
      if(fKec  && (!p||(p.kecamatan||'')!==fKec)) return false;
      if(fKel  && (!p||(p.kelurahan||'')!==fKel)) return false;
      if(fRw   && (!p||(p.rw||'')!==fRw)) return false;
      if(fRt   && (!p||(p.rt||'')!==fRt)) return false;
    }
    return true;
  });
  if(!_apvbBulkItems.length){ toast('Tidak ada antrian di filter ini','err'); return; }

  var totalNom = _apvbBulkItems.reduce(function(a,o){return a+(o.nominal||0);},0);


  var scopeLabel = fRt?'RT '+fRt:(fRw?'RW '+fRw:(fKel?fKel:(fKec?'Kec. '+fKec:(fArea?'Area ini':'Semua'))));
  document.getElementById('apvb-bulk-title').textContent = 'Bayar per '+scopeLabel;
  document.getElementById('apvb-bulk-scope').textContent = _apvbBulkItems.length+' fee · Total Rp '+_fmt(totalNom);


  _apvbBulkRtMap = {};
  _apvbBulkItems.forEach(function(o){
    var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;});
    var rt=(p&&p.rt)?'RT '+(p.rt):'RT ?';
    if(!_apvbBulkRtMap[rt]) _apvbBulkRtMap[rt]={count:0,total:0};
    _apvbBulkRtMap[rt].count++; _apvbBulkRtMap[rt].total+=(o.nominal||0);
  });
  var rtKeys=Object.keys(_apvbBulkRtMap).sort();
  var summaryHtml='<strong>'+scopeLabel+'</strong> — <strong>'+_apvbBulkItems.length+' fee</strong> · Total <strong>Rp '+_fmt(totalNom)+'</strong>';
  if(rtKeys.length>1){
    summaryHtml+='<div style="margin-top:6px;font-size:10px;opacity:.85">'+
      rtKeys.map(function(rt){return '<span style="margin-right:8px">'+rt+': '+_apvbBulkRtMap[rt].count+' fee (Rp '+_fmt(_apvbBulkRtMap[rt].total)+')</span>';}).join('')+'</div>';
  }
  document.getElementById('apvb-bulk-summary').innerHTML = summaryHtml;


  document.getElementById('apvb-bulk-nominal').value = totalNom;
  document.getElementById('apvb-bulk-tgl').value = new Date().toISOString().slice(0,10);
  document.getElementById('apvb-bulk-ref').value = '';
  document.getElementById('apvb-bulk-metode').value = 'transfer';


  var rtInps=document.getElementById('apvb-bulk-rt-inputs'); if(rtInps) rtInps.innerHTML='';
  rtKeys.forEach(function(rt){
    var row=document.createElement('div');
    row.style.cssText='display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center';
    row.innerHTML='<div style="font-size:11px;font-weight:700;color:var(--text2);white-space:nowrap">'+
        '<i class="ti ti-home" style="font-size:10px"></i> '+rt+
        '<div style="font-size:9px;font-weight:400;color:var(--text3)">'+_apvbBulkRtMap[rt].count+' fee · auto Rp '+_fmt(_apvbBulkRtMap[rt].total)+'</div></div>'+
      '<input class="inp" id="apvb-rt-inp-'+rt.replace(/\s+/g,'_')+'" type="number" min="0" value="'+_apvbBulkRtMap[rt].total+'" placeholder="'+_apvbBulkRtMap[rt].total+'" style="font-family:\'JetBrains Mono\',monospace;font-weight:700">';
    if(rtInps) rtInps.appendChild(row);
  });

  apvbBulkSetMode('rw');
  apvbBulkSisaUpdate();
  document.getElementById('apvb-bulk-overlay').style.display='flex';
  document.body.style.overflow='hidden';
}

function apvbBulkClose(){
  document.getElementById('apvb-bulk-overlay').style.display='none';
  document.body.style.overflow='';
}

function apvbBulkSetMode(mode){
  _apvbBulkMode=mode;
  var isRt=(mode==='rt');

  var btnRw=document.getElementById('apvb-bulk-mode-rw');
  var btnRt=document.getElementById('apvb-bulk-mode-rt');
  if(btnRw){btnRw.style.borderColor=isRt?'var(--border2)':'var(--green)';btnRw.style.background=isRt?'transparent':'rgba(5,150,105,.11)';btnRw.style.color=isRt?'var(--text2)':'var(--green)';}
  if(btnRt){btnRt.style.borderColor=isRt?'var(--c1)':'var(--border2)';btnRt.style.background=isRt?'var(--c1b)':'transparent';btnRt.style.color=isRt?'var(--c1)':'var(--text2)';}

  var rwW=document.getElementById('apvb-bulk-rw-wrap');
  var rtW=document.getElementById('apvb-bulk-rt-wrap');
  if(rwW) rwW.style.display=isRt?'none':'block';
  if(rtW) rtW.style.display=isRt?'block':'none';
}

function apvbBulkSisaUpdate(){
  var totalFee=_apvbBulkItems.reduce(function(a,o){return a+(o.nominal||0);},0);
  var bayar=parseFloat((document.getElementById('apvb-bulk-nominal')||{}).value)||0;
  var sisa=Math.max(0,totalFee-bayar);
  var sw=document.getElementById('apvb-bulk-sisa-wrap');
  var sv=document.getElementById('apvb-bulk-sisa-val');
  if(sw) sw.style.display=sisa>0?'block':'none';
  if(sv) sv.textContent='Rp '+_fmt(sisa);
}

function apvbBulkSave(){
  if(!_apvbBulkItems.length){toast('Tidak ada data','err');return;}
  var sb=getSB(); if(!sb){toast('Database tidak terhubung','err');return;}
  var tgl=document.getElementById('apvb-bulk-tgl').value;
  var metode=document.getElementById('apvb-bulk-metode').value;
  var ref=document.getElementById('apvb-bulk-ref').value.trim();
  var btn=document.getElementById('apvb-bulk-save-btn');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span> Memproses…';}

  var ops=[];
  var totalPaid=0; var totalCarry=0;

  if(_apvbBulkMode==='rt'){

    _apvbBulkItems.forEach(function(o){
      var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;});
      var rt=(p&&p.rt)?'RT '+(p.rt):'RT ?';
      var inpId='apvb-rt-inp-'+rt.replace(/\s+/g,'_');
      var inpEl=document.getElementById(inpId);
      var rtTotalNom=inpEl?parseFloat(inpEl.value)||0:0;
      var rtCountInMap=(_apvbBulkRtMap[rt]||{}).count||1;

      var share=Math.floor(rtTotalNom/rtCountInMap);
      var sisa=Math.max(0,(o.nominal||0)-share);
      totalPaid+=share; totalCarry+=sisa;
      ops.push(sb.from(_valTable()).update(_feePaidPayload(tgl)).eq('id',o.id));
      if(sisa>0){
        var note='Carry-over bulk RT \u00b7 sisa Rp '+_fmt(sisa)+' dari '+(_otfPelCID(o.pel_id)||o.id);
        ops.push(sb.from(_valTable()).insert([_feeCarryOverPayload(o,sisa,tgl,note)]));
      }
    });
  } else {

    var nominalRw=parseFloat((document.getElementById('apvb-bulk-nominal')||{}).value)||0;
    if(!nominalRw) nominalRw=_apvbBulkItems.reduce(function(a,o){return a+(o.nominal||0);},0);
    var totalFee=_apvbBulkItems.reduce(function(a,o){return a+(o.nominal||0);},0);
    var sisaRw=Math.max(0,totalFee-nominalRw);
    totalPaid=nominalRw; totalCarry=sisaRw;
    _apvbBulkItems.forEach(function(o){
      ops.push(sb.from(_valTable()).update(_feePaidPayload(tgl)).eq('id',o.id));
    });
    if(sisaRw>0){
      var note2='Carry-over bulk RW \u00b7 sisa Rp '+_fmt(sisaRw)+' dari '+_apvbBulkItems.length+' fee';
      ops.push(sb.from(_valTable()).insert([_feeCarryOverPayload(_apvbBulkItems[0],sisaRw,tgl,note2)]));
    }
  }


  try{
    sb.from('pembayaran_isp').insert([{
      tgl_bayar:tgl||null,nominal:totalPaid,metode:metode,bukti:ref||null,
      status:'verified',bank:'Bulk Bayar '+_apvbBulkItems.length+' fee'
    }]).then(function(){}).catch(function(){});
  }catch(e){}

  Promise.all(ops.map(function(p){return p.then(function(x){return x;}).catch(function(e){return {error:e};});}))
  .then(function(res){
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-cash"></i> Konfirmasi Bayar';}
    var errs=res.filter(function(x){return x&&x.error;}).length;
    if(errs){ toast('Sebagian gagal ('+errs+')','err'); return; }
    var msg='Bulk bayar selesai · '+_apvbBulkItems.length+' fee · Rp '+_fmt(totalPaid);
    if(totalCarry>0) msg+=' · Carry-over Rp '+_fmt(totalCarry);
    toast(msg,'ok');
    apvbBulkClose();
    _apvbBulkItems=[];
    _payLoaded=false;
    if(_valJenis==='rec'){ _recLoaded=false; recLoad(); } else { _otfLoaded=false;_otfLoading=false; otfLoad(); }
    apvbRender();
  }).catch(function(){if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-cash"></i> Konfirmasi Bayar';}toast('Error','err');});
}
function exportOtfCsv(){
  var sb=getSB(); if(!sb){toast('Koneksi belum siap','err');return;}
  toast('Menyiapkan export OTF…','ok');
  Promise.all([
    sb.from('pelanggan').select('id,cid,nama,status,kecamatan,kelurahan,rw,rt,jenis_pelanggan,paket,tgl_pasang,area_coverage'),
    sb.from('fee_otf').select('id,status,nominal,pel_id,tgl,keterangan').order('tgl',{ascending:false})
  ]).then(function(res){
    var pels=res[0].data||[]; var otfAll=res[1].data||[];
    var pelMap={}; pels.forEach(function(p){pelMap[p.id]=p;});
    var rows=[['CID','Nama Pelanggan','Status Pelanggan','Area','Kecamatan','Kelurahan','RW','RT','Paket','Tgl Pasang','Tgl OTF','Nominal (Rp)','Status OTF','Keterangan']];
    otfAll.forEach(function(o){
      var p=pelMap[o.pel_id]||{};
      rows.push([
        p.cid||'',p.nama||'',p.status||'',
        p.area_coverage||'',p.kecamatan||'',p.kelurahan||'',p.rw||'',p.rt||'',
        p.paket||'',p.tgl_pasang||'',
        o.tgl||'',o.nominal||0,o.status||'',o.keterangan||''
      ]);
    });
    _csvDownload(rows,'laporan_fee_otf_'+new Date().toISOString().slice(0,10)+'.csv');
    toast('Export OTF '+otfAll.length+' baris berhasil','ok');
  }).catch(function(e){toast('Gagal export OTF: '+(e.message||e),'err');});
}
function exportRecurringCsv(){
  
  var stFilter=(document.getElementById('rec-fil-status')||{}).value||'';
  var perFilter=(document.getElementById('rec-fil-periode')||{}).value||'';


  var filtered=_recData.filter(function(r){
    if(stFilter && r.status!==stFilter) return false;
    if(perFilter && r.periode!==perFilter) return false;
    var g=_recGeo(r);
    if(_recDrill.kec && g.kec!==_recDrill.kec) return false;
    if(_recDrill.kel && g.kel!==_recDrill.kel) return false;
    if(_recDrill.rw  && g.rw!==_recDrill.rw) return false;
    return true;
  });
  if(!filtered.length){ toast('Tidak ada data recurring pada cakupan/filter yang sedang dibuka','err'); return; }


  var allLevels=['kec','kel','rw','rt'];
  var startIdx = _recDrill.rw ? 3 : _recDrill.kel ? 2 : _recDrill.kec ? 1 : 0;
  var activeLevels=allLevels.slice(startIdx);
  var levelLabel={kec:'Kecamatan',kel:'Kelurahan',rw:'RW',rt:'RT'};

  var rows=[['Level','Kecamatan','Kelurahan','RW','RT','CID','Nama Pelanggan','Jumlah Pelanggan','Total Nominal (Rp)','Status']];


  var scopeTotal=filtered.reduce(function(a,r){return a+(r.nominal||0);},0);
  var scopePelSet={}; filtered.forEach(function(r){ if(r.pel_id) scopePelSet[r.pel_id]=1; });
  var scopeLevelLabel = _recDrill.rw?'RW':_recDrill.kel?'Kelurahan':_recDrill.kec?'Kecamatan':'Semua Wilayah';
  rows.push(['TOTAL '+scopeLevelLabel, _recDrill.kec||'', _recDrill.kel||'', _recDrill.rw||'', '', '', '', Object.keys(scopePelSet).length, Math.round(scopeTotal), '']);


  function geoVal(g,lv){ return lv==='kec'?g.kec:lv==='kel'?g.kel:lv==='rw'?g.rw:g.rt; }
  function groupAndWrite(items, lvIdx, ctx){
    if(lvIdx>=activeLevels.length){
      items.forEach(function(r){
        var p=r.pel_id&&_recPelMap[r.pel_id];
        rows.push(['Pelanggan', ctx.kec||'', ctx.kel||'', ctx.rw||'', ctx.rt||'', p?(p.cid||''):'', p?(p.nama||''):'', 1, Math.round(r.nominal||0), r.status||'']);
      });
      return;
    }
    var lv=activeLevels[lvIdx];
    var buckets={};
    items.forEach(function(r){
      var g=_recGeo(r);
      var v=geoVal(g,lv)||'(Tanpa '+levelLabel[lv]+')';
      if(!buckets[v]){ buckets[v]={items:[],total:0,pelSet:{}}; }
      buckets[v].items.push(r);
      buckets[v].total+=(r.nominal||0);
      if(r.pel_id) buckets[v].pelSet[r.pel_id]=1;
    });
    Object.keys(buckets).sort(function(a,b){ return a.localeCompare(b,'id',{numeric:true,sensitivity:'base'}); }).forEach(function(v){
      var b=buckets[v];
      var newCtx={kec:ctx.kec,kel:ctx.kel,rw:ctx.rw,rt:ctx.rt};
      newCtx[lv]=v;
      rows.push([levelLabel[lv], newCtx.kec||'', newCtx.kel||'', newCtx.rw||'', newCtx.rt||'', '', '', Object.keys(b.pelSet).length, Math.round(b.total), '']);
      groupAndWrite(b.items, lvIdx+1, newCtx);
    });
  }
  groupAndWrite(filtered, 0, {kec:_recDrill.kec,kel:_recDrill.kel,rw:_recDrill.rw,rt:''});

  var scopeFileTag = _recDrill.rw ? ('RW-'+_recDrill.rw) : _recDrill.kel ? _recDrill.kel : _recDrill.kec ? ('Kec-'+_recDrill.kec) : 'Semua';
  var safeTag = scopeFileTag.replace(/[^a-zA-Z0-9_-]+/g,'_');
  _csvDownload(rows,'laporan_fee_recurring_'+safeTag+'_'+new Date().toISOString().slice(0,10)+'.csv');
  toast('Export Recurring berhasil ('+(rows.length-1)+' baris)','ok');
}

function _csvDownload(rows,filename){
  var csv=rows.map(function(row){
    return row.map(function(cell){
      var s=String(cell===null||cell===undefined?'':cell).replace(/"/g,'""');
      return (s.indexOf(',')>=0||s.indexOf('"')>=0||s.indexOf('\n')>=0)?'"'+s+'"':s;
    }).join(',');
  }).join('\r\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
}
var _payData=[]; var _payFil=[]; var _payPage=1; var _payPerPg=15; var _payLoaded=false;
function payLoad(){
  var list=document.getElementById('pay-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat riwayat…</p></div>';
  _finEnsure(true,true,function(){
    var b1=document.getElementById('pay-jenis-otf'), b2=document.getElementById('pay-jenis-rec');
    if(b1){ b1.style.background=_valJenis==='otf'?'var(--c1)':'#fff'; b1.style.color=_valJenis==='otf'?'#fff':'var(--text2)'; }
    if(b2){ b2.style.background=_valJenis==='rec'?'var(--c1)':'#fff'; b2.style.color=_valJenis==='rec'?'#fff':'var(--text2)'; }
    _payData=_valData().filter(function(o){return o.status==='paid';}); _payLoaded=true;
    payFillAreaDropdown();
    payUpdateStats(); payRender();
  });
}
function payFillAreaDropdown(){
  var sel=document.getElementById('pay-fil-area'); if(!sel) return;
  var cur=sel.value;
  sel.innerHTML='<option value="">Semua Area</option>';
  var areas=[]; _payData.forEach(function(o){
    var a=_otfPelAreaName(o.pel_id)||o.area||'';
    if(a && areas.indexOf(a)<0) areas.push(a);
  });
  areas.sort().forEach(function(a){ var opt=document.createElement('option'); opt.value=a; opt.textContent=a; if(a===cur) opt.selected=true; sel.appendChild(opt); });
  payFillKelurahan();
}
function payFillKelurahan(){
  var fArea=(document.getElementById('pay-fil-area')||{}).value||'';
  var sel=document.getElementById('pay-fil-kelurahan'); if(!sel) return;
  var cur=sel.value;
  sel.innerHTML='<option value="">Semua Kelurahan</option>';
  var kels=[]; _payData.forEach(function(o){
    var a=_otfPelAreaName(o.pel_id)||o.area||'';
    if(fArea && a!==fArea) return;
    var k=_otfPelKec(o.pel_id)||''; /* kecamatan field doubles as kelurahan label */
    if(k && kels.indexOf(k)<0) kels.push(k);
  });
  kels.sort().forEach(function(k){ var opt=document.createElement('option'); opt.value=k; opt.textContent=k; if(k===cur) opt.selected=true; sel.appendChild(opt); });
  payFillRW();
}
function payFillRW(){
  var fArea=(document.getElementById('pay-fil-area')||{}).value||'';
  var fKel=(document.getElementById('pay-fil-kelurahan')||{}).value||'';
  var sel=document.getElementById('pay-fil-rw'); if(!sel) return;
  var cur=sel.value;
  sel.innerHTML='<option value="">Semua RW</option>';
  var rws=[]; _payData.forEach(function(o){
    var a=_otfPelAreaName(o.pel_id)||o.area||'';
    var k=_otfPelKec(o.pel_id)||'';
    if(fArea && a!==fArea) return;
    if(fKel && k!==fKel) return;
    var rw=_otfPelRW(o.pel_id)||'';
    if(rw && rws.indexOf(rw)<0) rws.push(rw);
  });
  rws.sort().forEach(function(r){ var opt=document.createElement('option'); opt.value=r; opt.textContent='RW '+r; if(r===cur) opt.selected=true; sel.appendChild(opt); });
}
function payResetFilter(){
  var s=function(id){var e=document.getElementById(id);if(e)e.value='';};
  s('pay-fil-area'); s('pay-fil-kelurahan'); s('pay-fil-rw');
  payFillAreaDropdown(); payRender();
}
function _feeTgl(o){ return o.tgl||o.tgl_bayar||''; }
function payUpdateStats(){
  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  var now=new Date(); var bln=now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2);
  var inBln=_payData.filter(function(o){return (''+_feeTgl(o)).slice(0,7)===bln;});
  e('payst-total',_payData.length);
  e('payst-bulan',inBln.length);
  e('payst-nominal','Rp '+_fmt(_payData.reduce(function(a,o){return a+(o.nominal||0);},0)));
  e('payst-nominal-bulan','Rp '+_fmt(inBln.reduce(function(a,o){return a+(o.nominal||0);},0)));
}
function paySearch(q){_payPage=1;var c=document.getElementById('pay-search-clr');if(c)c.style.display=q?'block':'none';payRender();}
function payClearSearch(){var i=document.getElementById('pay-search');if(i)i.value='';var c=document.getElementById('pay-search-clr');if(c)c.style.display='none';_payPage=1;payRender();}
function payRender(){
  var q=((document.getElementById('pay-search')||{}).value||'').toLowerCase().trim();
  var fArea=(document.getElementById('pay-fil-area')||{}).value||'';
  var fKel=(document.getElementById('pay-fil-kelurahan')||{}).value||'';
  var fRw=(document.getElementById('pay-fil-rw')||{}).value||'';
  _payFil=_payData.filter(function(o){
    var area=_otfPelAreaName(o.pel_id)||o.area||'';
    var kel=_otfPelKec(o.pel_id)||'';
    var rw=_otfPelRW(o.pel_id)||'';
    if(fArea && area!==fArea) return false;
    if(fKel && kel!==fKel) return false;
    if(fRw && rw!==fRw) return false;
    if(!q) return true;
    return (_otfPelCID(o.pel_id)+'').toLowerCase().includes(q)||(_otfPelName(o.pel_id)+'').toLowerCase().includes(q)||((_otfPelAreaName(o.pel_id)||o.area||'')+'').toLowerCase().includes(q);
  });
  var total=_payFil.length; var pages=Math.max(1,Math.ceil(total/_payPerPg));
  if(_payPage>pages)_payPage=pages;
  var start=(_payPage-1)*_payPerPg;
  var list=document.getElementById('pay-list'); if(!list) return;
  if(!total){ list.innerHTML='<div class="olt-empty"><i class="ti ti-credit-card-off"></i><p>Belum ada pembayaran</p></div>'; document.getElementById('pay-pagi').style.display='none'; return; }
  list.innerHTML=_payFil.slice(start,start+_payPerPg).map(function(o){
    var areaN=_otfPelAreaName(o.pel_id)||o.area||''; var tglShow=_feeTgl(o);
    return '<div class="inv-row" style="cursor:default">'+
      '<div class="inv-row-top">'+
        '<div class="inv-row-ico paid"><i class="ti ti-check"></i></div>'+
        '<div class="inv-row-info"><div class="inv-row-no">'+_esc(_otfPelCID(o.pel_id))+'</div><div class="inv-row-name">'+_esc(_otfPelName(o.pel_id))+'</div></div>'+
        '<div class="inv-row-nominal">Rp '+_fmt(o.nominal||0)+'</div>'+
      '</div>'+
      '<div class="inv-row-meta"><span class="tag tg">Paid</span>'+(areaN?'<span class="tag tgr">'+_esc(areaN)+'</span>':'')+(tglShow?'<span style="font-size:10px;color:var(--text3)">'+_esc(tglShow)+'</span>':'')+'</div>'+
      '<div style="margin-top:8px" onclick="event.stopPropagation()">'+
        '<button onclick="kuitansiPrint(\''+o.id+'\')" style="width:100%;padding:8px 0;border:1.5px solid var(--border2);border-radius:9px;background:transparent;color:var(--c1);font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;touch-action:manipulation">'+
          '<i class="ti ti-receipt" style="font-size:14px"></i> Cetak Kuitansi'+
        '</button>'+
      '</div>'+
    '</div>';
  }).join('');
  var pagi=document.getElementById('pay-pagi');
  if(pages>1){ pagi.style.display='flex'; var pv=document.getElementById('pay-prev'),nx=document.getElementById('pay-next'),inf=document.getElementById('pay-pagi-info'); if(pv)pv.disabled=_payPage<=1; if(nx)nx.disabled=_payPage>=pages; if(inf)inf.textContent=_payPage+' / '+pages; }
  else pagi.style.display='none';
}
function payPage(dir){var pages=Math.max(1,Math.ceil(_payFil.length/_payPerPg));_payPage=Math.min(pages,Math.max(1,_payPage+dir));payRender();}

/* ── Cetak Kuitansi KOLEKTIF per RW (atau semua yang terfilter) ── */
function kuitansiRWPrint(){
  var data = _payFil;
  if(!data.length){ toast('Tidak ada data pembayaran yang sesuai filter','err'); return; }
  var fArea=(document.getElementById('pay-fil-area')||{}).value||'';
  var fKel=(document.getElementById('pay-fil-kelurahan')||{}).value||'';
  var fRw=(document.getElementById('pay-fil-rw')||{}).value||'';
  var tgl=new Date().toISOString().slice(0,10);
  var labelFilter=(fArea?fArea:'Semua Area')+(fKel?' · '+fKel:'')+(fRw?' · RW '+fRw:'');
  var noKuitansi='KWK-'+tgl.replace(/-/g,'')+(fRw?'-RW'+fRw:'');
  var totalNominal=data.reduce(function(a,o){return a+(o.nominal||0);},0);

  var rows=data.map(function(o,i){
    return '<tr style="border-bottom:1px solid #e2e8f0">'+
      '<td style="padding:5px 4px;text-align:center">'+(i+1)+'</td>'+
      '<td style="padding:5px 4px;font-family:monospace;font-size:12px">'+_esc(_otfPelCID(o.pel_id))+'</td>'+
      '<td style="padding:5px 4px">'+_esc(_otfPelName(o.pel_id))+'</td>'+
      '<td style="padding:5px 4px;color:#6b7689;font-size:11px">'+_esc(_otfPelRW(o.pel_id)?'RW '+_otfPelRW(o.pel_id):'—')+'</td>'+
      '<td style="padding:5px 4px;text-align:right;font-weight:700">Rp '+_fmt(o.nominal||0)+'</td>'+
    '</tr>';
  }).join('');

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+
    '<title>Kuitansi Kolektif '+_esc(noKuitansi)+'</title>'+
    '<style>'+ '*{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}'+ 'body{padding:20px;color:#1e2a45;max-width:640px;margin:0 auto;font-size:13px}'+ 'h1{font-size:18px;margin:0 0 2px;text-align:center}'+ '.sub{text-align:center;color:#6b7689;font-size:11px;margin-bottom:14px}'+ '.kw-title{text-align:center;font-size:15px;font-weight:bold;letter-spacing:2px;margin:14px 0;border-top:2px solid #1a56db;border-bottom:2px solid #1a56db;padding:5px 0}'+ 'table{width:100%;border-collapse:collapse;font-size:12px}'+ 'th{background:#1a56db;color:#fff;padding:7px 4px;font-size:11px;text-align:left}'+ 'th:last-child{text-align:right}'+ '.total-row td{font-weight:bold;border-top:2px solid #1a56db;background:#f0f4ff;padding:7px 4px}'+ '.info{margin-bottom:12px;background:#f8faff;border:1px solid #c7d2fe;border-radius:6px;padding:10px;font-size:12px}'+ '.info span{color:#6b7689}'+ '.ttd{display:flex;justify-content:space-between;margin-top:40px;font-size:12px;text-align:center}'+ '.ttd .box{width:30%}'+ '.ttd .line{margin-top:48px;border-top:1px solid #1e2a45;padding-top:4px}'+ '.total-box{text-align:right;margin-top:6px;font-size:16px;font-weight:bold;color:#1a56db}'+ '.terbilang{text-align:right;font-size:11px;color:#6b7689;font-style:italic;margin-top:2px}'+ '@media print{body{padding:0}}'+ '</style></head><body>'+
      '<h1>ICRM_JJC</h1><div class="sub">Sistem Operasional ISP</div>'+
      '<div class="kw-title">KUITANSI KOLEKTIF PEMBAYARAN</div>'+
      '<div class="info">'+
        '<div><span>No. Kuitansi  : </span><strong>'+_esc(noKuitansi)+'</strong></div>'+
        '<div><span>Tanggal Cetak  : </span>'+_esc(tgl)+'</div>'+
        '<div><span>Filter         : </span><strong>'+_esc(labelFilter)+'</strong></div>'+
        '<div><span>Jumlah Entri   : </span><strong>'+data.length+' pelanggan</strong></div>'+
      '</div>'+
      '<table>'+
        '<thead><tr>'+
          '<th style="width:30px;text-align:center">#</th>'+
          '<th style="width:90px">CID</th>'+
          '<th>Nama</th>'+
          '<th style="width:60px">RW</th>'+
          '<th style="width:100px;text-align:right">Nominal</th>'+
        '</tr></thead>'+
        '<tbody>'+rows+
        '<tr class="total-row">'+
          '<td colspan="4" style="text-align:right;padding:7px 4px">TOTAL</td>'+
          '<td style="text-align:right;padding:7px 4px">Rp '+_fmt(totalNominal)+'</td>'+
        '</tr>'+
        '</tbody>'+
      '</table>'+
      '<div class="total-box">Total: Rp '+_fmt(totalNominal)+'</div>'+
      '<div class="terbilang">'+_esc(_terbilang(totalNominal))+' rupiah</div>'+
      '<div class="ttd">'+
        '<div class="box"><div class="line">Ketua RW</div></div>'+
        '<div class="box"><div class="line">Sales / Petugas</div></div>'+
        '<div class="box"><div class="line">Admin</div></div>'+
      '</div>'+
    '</body></html>';

  var w=window.open('','_blank');
  if(!w){ toast('Pop-up diblokir. Izinkan pop-up untuk cetak','err'); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(function(){ w.focus(); w.print(); }, 300);
}

/* ── Cetak Kuitansi sederhana untuk satu pembayaran (fee_otf status paid) ── */
function kuitansiPrint(id){
  var o=_payData.find(function(x){return x.id===id;}); if(!o) return;
  var cid=_otfPelCID(o.pel_id);
  var nama=_otfPelName(o.pel_id);
  var areaN=_otfPelAreaName(o.pel_id)||o.area||'—';
  var kec=_otfPelKec(o.pel_id); var rw=_otfPelRW(o.pel_id); var rt=_otfPelRT(o.pel_id);
  var lokParts=[]; if(kec) lokParts.push('Kec. '+kec); if(rw) lokParts.push('RW '+rw); if(rt) lokParts.push('RT '+rt);
  var lokasi=lokParts.length?lokParts.join(' · '):'';
  var nominal=o.nominal||0;
  var tgl=_feeTgl(o)||new Date().toISOString().slice(0,10);
  var noKuitansi='KW-'+(''+tgl).replace(/-/g,'')+'-'+(''+cid).replace(/[^A-Za-z0-9]/g,'');
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'+
    '<title>Kuitansi '+_esc(noKuitansi)+'</title>'+
    '<style>'+ '*{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}'+ 'body{padding:24px;color:#1e2a45;max-width:480px;margin:0 auto}'+ '.hd{text-align:center;margin-bottom:18px}'+ '.hd h1{font-size:18px;margin:0 0 4px}'+ '.hd p{font-size:11px;color:#6b7689;margin:0}'+ '.kw-title{text-align:center;font-size:16px;font-weight:bold;letter-spacing:2px;margin:18px 0;border-top:2px solid #1a56db;border-bottom:2px solid #1a56db;padding:6px 0}'+ 'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px}'+ 'td{padding:5px 0;vertical-align:top}'+ 'td.lbl{width:130px;color:#6b7689}'+ 'td.sep{width:10px}'+ '.nominal-box{border:1.5px solid #1a56db;border-radius:8px;padding:12px;text-align:center;margin-bottom:18px}'+ '.nominal-box .rp{font-size:22px;font-weight:bold;color:#1a56db;font-family:monospace}'+ '.nominal-box .terbilang{font-size:11px;color:#6b7689;margin-top:4px;font-style:italic}'+ '.ttd{display:flex;justify-content:space-between;margin-top:36px;font-size:12px;text-align:center}'+ '.ttd .box{width:45%}'+ '.ttd .line{margin-top:48px;border-top:1px solid #1e2a45;padding-top:4px}'+ '@media print{body{padding:0}}'+ '</style></head><body>'+
      '<div class="hd"><h1>ICRM_JJC</h1><p>Sistem Operasional ISP</p></div>'+
      '<div class="kw-title">KUITANSI PEMBAYARAN</div>'+
      '<table>'+
        '<tr><td class="lbl">No. Kuitansi</td><td class="sep">:</td><td>'+_esc(noKuitansi)+'</td></tr>'+
        '<tr><td class="lbl">Tanggal</td><td class="sep">:</td><td>'+_esc(tgl)+'</td></tr>'+
        '<tr><td class="lbl">CID</td><td class="sep">:</td><td>'+_esc(cid)+'</td></tr>'+
        '<tr><td class="lbl">Nama Pelanggan</td><td class="sep">:</td><td>'+_esc(nama)+'</td></tr>'+
        '<tr><td class="lbl">Area</td><td class="sep">:</td><td>'+_esc(areaN)+(lokasi?' · '+_esc(lokasi):'')+'</td></tr>'+
        '<tr><td class="lbl">Keterangan</td><td class="sep">:</td><td>Pembayaran Fee '+(_valJenis==='rec'?('Recurring'+(o.periode?' · Periode '+_esc(o.periode):'')):'OTF (One-Time Fee)')+'</td></tr>'+
      '</table>'+
      '<div class="nominal-box">'+
        '<div class="rp">Rp '+_fmt(nominal)+'</div>'+
        '<div class="terbilang">'+_esc(_terbilang(nominal))+' rupiah</div>'+
      '</div>'+
      '<div class="ttd">'+
        '<div class="box"><div class="line">Pelanggan</div></div>'+
        '<div class="box"><div class="line">Petugas</div></div>'+
      '</div>'+
    '</body></html>';
  var w=window.open('','_blank');
  if(!w){ toast('Pop-up diblokir. Izinkan pop-up untuk cetak kuitansi','err'); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(function(){ w.focus(); w.print(); }, 300);
}
function lapLoad(){
  var body=document.getElementById('lap-body');
  if(body) body.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Menyiapkan laporan…</p></div>';
  _finEnsure(true,true,function(){ lapFillPeriode(); lapRender(); });
}
function lapFillPeriode(){
  var sel=document.getElementById('lap-periode'); if(!sel) return; var cur=sel.value;
  var ps={}; _otfData.forEach(function(o){ if(o.tgl) ps[(''+o.tgl).slice(0,7)]=1; }); _recData.forEach(function(r){ if(r.periode) ps[r.periode]=1; });
  var arr=Object.keys(ps).sort().reverse();
  sel.innerHTML='<option value="">Semua Periode</option>'+arr.map(function(p){return '<option value="'+p+'"'+(p===cur?' selected':'')+'>'+p+'</option>';}).join('');
}
function lapRender(){
  var body=document.getElementById('lap-body'); if(!body) return;
  var per=(document.getElementById('lap-periode')||{}).value||'';
  var otf=_otfData.filter(function(o){ return !per||(''+(o.tgl||'')).slice(0,7)===per; });
  var rec=_recData.filter(function(r){ return !per||r.periode===per; });
  var by=function(st){ return otf.filter(function(o){ return o.status===st||(st==='siap_bayar'&&o.status==='waiting_payment')||(st==='menunggu_validasi'&&o.status==='draft'); }); };
  var sum=function(a){ return a.reduce(function(s,o){return s+(o.nominal||0);},0); };
  var totOtf=sum(otf);
  var totRec=rec.reduce(function(s,r){return s+(r.total_recurring||0);},0);
  var areaMap={}; otf.forEach(function(o){ var k=o.area||'—'; if(!areaMap[k])areaMap[k]={n:0,v:0}; areaMap[k].n++; areaMap[k].v+=(o.nominal||0); });
  var areaRows=Object.keys(areaMap).sort().map(function(k){
    return '<div class="fin-rekap-row"><span class="fin-rekap-lbl">'+_esc(k)+' ('+areaMap[k].n+')</span><span class="fin-rekap-val">Rp '+_fmt(areaMap[k].v)+'</span></div>';
  }).join('')||'<div class="fin-rekap-row" style="border:none"><span class="fin-rekap-lbl">—</span><span class="fin-rekap-val">Rp 0</span></div>';
  var card=function(h){ return '<div style="background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--r);padding:14px 15px;margin-bottom:10px">'+h+'</div>'; };
  var sr=function(l,c,v,col){ return '<div class="fin-rekap-row"><span class="fin-rekap-lbl">'+l+'</span><span class="fin-rekap-val"'+(col?' style="color:'+col+'"':'')+'>'+c+' · Rp '+_fmt(v)+'</span></div>'; };
  var pMenunggu=by('menunggu_validasi');
  body.innerHTML=
    card('<div class="fin-rekap-title"><i class="ti ti-bolt"></i> FEE OTF'+(per?' · '+per:'')+'</div>'+
      sr('Draft / Menunggu', pMenunggu.length, sum(pMenunggu))+
      sr('Siap Bayar', by('siap_bayar').length, sum(by('siap_bayar')), 'var(--c1)')+
      sr('Paid', by('paid').length, sum(by('paid')), 'var(--green)')+
      '<div class="fin-rekap-row" style="border:none"><span class="fin-rekap-lbl">Total OTF</span><span class="fin-rekap-val" style="font-weight:800">Rp '+_fmt(totOtf)+'</span></div>')+
    card('<div class="fin-rekap-title"><i class="ti ti-refresh"></i> FEE RECURRING'+(per?' · '+per:'')+'</div>'+
      '<div class="fin-rekap-row"><span class="fin-rekap-lbl">Jumlah Record</span><span class="fin-rekap-val">'+rec.length+'</span></div>'+
      '<div class="fin-rekap-row" style="border:none"><span class="fin-rekap-lbl">Total Recurring</span><span class="fin-rekap-val" style="font-weight:800;color:var(--yellow)">Rp '+_fmt(totRec)+'</span></div>')+
    card('<div class="fin-rekap-title"><i class="ti ti-map-2"></i> OTF PER AREA</div>'+areaRows)+
    card('<div class="fin-rekap-title"><i class="ti ti-shield-check"></i> GOVERNANCE</div>'+
      '<div class="fin-rekap-row"><span class="fin-rekap-lbl">Sumber Fee</span><span class="fin-rekap-val" style="color:var(--c1)">Approval ISP = Approved</span></div>'+
      '<div class="fin-rekap-row" style="border:none"><span class="fin-rekap-lbl">Dilarang</span><span class="fin-rekap-val" style="color:var(--red)">Vendor · Fee Teknisi · Komisi</span></div>');
}
var _closingData=[]; var _closingLoaded=false;

function closingLoad(){
  var list=document.getElementById('closing-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat Closing…</p></div>';
  var sb=getSB();if(!sb){if(list)list.innerHTML='<div class="olt-empty"><i class="ti ti-wifi-off"></i><p>Database tidak terhubung</p></div>';return;}
  sb.from('closing_bulanan').select('id,periode,status,total_otf,total_rec,total_bayar,catatan,created_at').order('periode',{ascending:false})
    .then(function(r){
      if(r.error){if(list)list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal memuat closing</p></div>';return;}
      _closingData=r.data||[];_closingLoaded=true;closingRender();finUpdateDashboard();
    }).catch(function(){if(list)list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error</p></div>';});
}

function closingRender(){
  var list=document.getElementById('closing-list');if(!list)return;
  if(!_closingData.length){list.innerHTML='<div class="olt-empty"><i class="ti ti-lock-open"></i><p>Belum ada closing</p></div>';return;}
  list.innerHTML=_closingData.map(_closingRowHTML).join('');
}

function _closingRowHTML(c){
  var stCls=c.status==='closed'?'red':'green';
  var stLbl=c.status==='closed'?'CLOSED':'OPEN';
  var stTag=c.status==='closed'?'tr':'tg';
  return '<div class="fin-rekap-card" onclick="closingOpenDet(\''+c.id+'\')" style="cursor:pointer">'+
    '<div class="fin-rekap-title">'+
      '<i class="ti ti-lock"></i> '+_esc(c.periode||'—')+
      '<span class="tag '+stTag+'" style="margin-left:auto">'+stLbl+'</span>'+
    '</div>'+
    '<div class="fin-rekap-row"><span class="fin-rekap-lbl">Pelanggan Aktif</span><span class="fin-rekap-val green">'+_fmt(c.pelanggan_aktif||0)+'</span></div>'+
    '<div class="fin-rekap-row"><span class="fin-rekap-lbl">Total Invoice</span><span class="fin-rekap-val">Rp '+_fmt(c.total_invoice||0)+'</span></div>'+
    '<div class="fin-rekap-row" style="border:none"><span class="fin-rekap-lbl">Total Pembayaran</span><span class="fin-rekap-val green">Rp '+_fmt(c.total_pembayaran||0)+'</span></div>'+
  '</div>';
}

function closingOpenForm(){
  document.getElementById('closf-id').value='';
  var d=new Date();
  document.getElementById('closf-periode').value=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);
  /* Auto-fill dari data yang ada */
  /* GOVERNANCE: Count pelanggan aktif BERBAYAR saja — FASUM/ODP_TEMPEL/ODC_TEMPEL dikecualikan */
  var FREE_TYPES_CLO=JENIS_GRATIS;
  document.getElementById('closf-aktif').value=_invData.filter?(_getPelData().filter(function(p){return p.status==='aktif'&&FREE_TYPES_CLO.indexOf(p.jenis_pelanggan)===(-1);}).length):0;
  document.getElementById('closf-suspend').value=_getPelData().filter(function(p){return p.status==='suspend';}).length;
  document.getElementById('closf-terminasi').value=_getPelData().filter(function(p){return p.status==='cabut';}).length;
  document.getElementById('closf-otf').value=_otfData.reduce(function(a,o){return a+(o.nominal||0);},0);
  document.getElementById('closf-rec').value=_recData.reduce(function(a,r){return a+(r.total_recurring||0);},0);
  document.getElementById('closf-inv').value=_invData.reduce(function(a,i){return a+(i.grand_total||0);},0);
  document.getElementById('closf-bayar').value=_payData.filter(function(p){return p.status==='verified';}).reduce(function(a,p){return a+(p.nominal||0);},0);
  document.getElementById('closf-status').value='open';
  document.getElementById('closing-form-overlay').classList.add('on');
}
function closingCloseForm(){document.getElementById('closing-form-overlay').classList.remove('on');}

function closingSave(){
  var id=document.getElementById('closf-id').value;
  var periode=document.getElementById('closf-periode').value;
  if(!periode){toast('Isi periode','err');return;}
  var status=document.getElementById('closf-status').value;
  if(status==='closed'&&!confirm('Closing akan mengunci periode '+periode+'. Lanjutkan?'))return;
  var sb=getSB();if(!sb){toast('Database tidak terhubung','err');return;}
  var btn=document.getElementById('closf-save-btn');if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span>';}
  var payload={
    periode:periode,
    pelanggan_aktif:parseFloat(document.getElementById('closf-aktif').value)||0,
    pelanggan_suspend:parseFloat(document.getElementById('closf-suspend').value)||0,
    pelanggan_terminasi:parseFloat(document.getElementById('closf-terminasi').value)||0,
    total_otf:parseFloat(document.getElementById('closf-otf').value)||0,
    total_recurring:parseFloat(document.getElementById('closf-rec').value)||0,
    total_invoice:parseFloat(document.getElementById('closf-inv').value)||0,
    total_pembayaran:parseFloat(document.getElementById('closf-bayar').value)||0,
    status:status
  };
  var p=id?sb.from('closing_bulanan').update(payload).eq('id',id):sb.from('closing_bulanan').insert([payload]);
  p.then(function(r){
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-lock"></i> Closing';}
    if(r.error){toast('Gagal: '+(r.error.message||'coba lagi'),'err');return;}
    toast(status==='closed'?'Periode '+periode+' CLOSED':'Closing disimpan','ok');closingCloseForm();_closingLoaded=false;closingLoad();
  }).catch(function(){if(btn)btn.disabled=false;toast('Error','err');});
}

function closingOpenDet(id){
  var c=_closingData.find(function(x){return x.id===id;});if(!c)return;
  document.getElementById('closing-det-title').textContent='Closing '+c.periode;
  var stTag=c.status==='closed'?'tr':'tg';
  var stLbl=c.status==='closed'?'CLOSED':'OPEN';
  function dr(l,v){return '<div class="olt-det-row"><div class="olt-det-lbl">'+l+'</div><div class="olt-det-val">'+v+'</div></div>';}
  function sec(i,t){return '<div class="olt-det-section"><i class="ti ti-'+i+'"></i> '+t+'</div>';}
  document.getElementById('closing-det-body').innerHTML=
    sec('lock','Closing Bulanan')+
    dr('Periode','<strong style="font-family:\'JetBrains Mono\',monospace">'+_esc(c.periode||'—')+'</strong>')+
    dr('Status','<span class="tag '+stTag+'">'+stLbl+'</span>')+
    sec('users','Pelanggan')+
    dr('Aktif','<span style="color:var(--green);font-weight:800">'+_fmt(c.pelanggan_aktif||0)+'</span>')+
    dr('Suspend','<span style="color:var(--yellow);font-weight:800">'+_fmt(c.pelanggan_suspend||0)+'</span>')+
    dr('Terminasi','<span style="color:var(--red);font-weight:800">'+_fmt(c.pelanggan_terminasi||0)+'</span>')+
    sec('coin','Rekap Keuangan')+
    dr('Total OTF','Rp '+_fmt(c.total_otf||0))+
    dr('Total Recurring','Rp '+_fmt(c.total_recurring||0))+
    dr('Total Invoice','Rp '+_fmt(c.total_invoice||0))+
    dr('Total Pembayaran','<span style="font-family:\'JetBrains Mono\',monospace;font-size:16px;font-weight:800;color:var(--green)">Rp '+_fmt(c.total_pembayaran||0)+'</span>');
  document.getElementById('closing-det-overlay').classList.add('on');
}
function closingCloseDet(){document.getElementById('closing-det-overlay').classList.remove('on');}
/* ── State ── */
var _matiData   = []; var _matiFil  = []; var _matiPage = 1; var _matiPerPg = 15;
var _matiDetId  = null; var _matiLoaded = false;
var _stokData   = []; var _stokFil  = []; var _stokPage = 1; var _stokPerPg = 15;
var _stokLoaded = false;
var _mutData    = []; var _mutFil   = []; var _mutPage  = 1; var _mutPerPg  = 20;
var _mutLoaded  = false;
var _matTabCur  = 'item';

/* ── Material nav hook — inventori via sidebar v3 ── */
/* ════════════════════════════════════════════════
   INVENTORY v3 — Clean, no duplicates, correct logic
   SSOT: material_items.stok = kebenaran stok saat ini
   material_mutasi = riwayat aktivitas saja
   pelanggan = SSOT pemakaian ONT (bukan mutasi)
════════════════════════════════════════════════ */

var _invMatiData   = [];
var _invMatiLoaded = false;
var _invMutOffset  = 0;
var _invMutLimit   = 40;
var _invTabCur     = 'dashboard';
var _invAreaBrandCache = {};

/* ── CSS ── */
(function(){
  if(document.getElementById('_inv3css')) return;
  var s = document.createElement('style'); s.id = '_inv3css';
  s.textContent =
    /* Sub pane */
    '.inv-sub{animation:fadeUp .18s ease}' +
    '.inv-ld{padding:32px 20px;text-align:center;color:var(--text3);font-size:12px;font-weight:600}' +
    /* Material card — used in Master tab */
    '.imc{background:var(--bg2);border-radius:14px;border:1.5px solid var(--border);overflow:hidden;margin-bottom:12px;box-shadow:var(--sh-sm)}' +
    '.imc-top{padding:14px 16px 12px}' +
    '.imc-name{font-size:15px;font-weight:800;color:var(--text);line-height:1.25;margin-bottom:4px}' +
    '.imc-code{font-size:10px;font-family:monospace;color:var(--text3);margin-bottom:3px;letter-spacing:.3px}' +
    '.imc-num{font-size:30px;font-weight:900;line-height:1}' +
    '.imc-numlbl{font-size:9px;font-weight:700;color:var(--text3);margin-top:1px;text-transform:uppercase}' +
    /* Flow bar */
    '.imc-flow{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1.5px solid var(--border);border-bottom:1px solid var(--border)}' +
    '.imc-fcell{padding:11px 6px;text-align:center;border-right:1px solid var(--border)}' +
    '.imc-fcell:last-child{border-right:none}' +
    '.imc-fn{font-size:20px;font-weight:800;line-height:1;margin-bottom:2px}' +
    '.imc-fl{font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px}' +
    /* ONT usage block */
    '.imc-ont{padding:10px 14px;background:var(--c1b);border-bottom:1px solid var(--border)}' +
    '.imc-ont-title{font-size:9px;font-weight:800;color:var(--c1);letter-spacing:.5px;margin-bottom:7px;text-transform:uppercase}' +
    '.imc-ont-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}' +
    '.imc-ont-cell{background:var(--bg2);border-radius:10px;padding:9px 4px;text-align:center;border:1px solid var(--border)}' +
    '.imc-ont-n{font-size:17px;font-weight:800;line-height:1;margin-bottom:2px}' +
    '.imc-ont-l{font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.2px}' +
    /* Rincian keluar chips */
    '.imc-detail{padding:9px 14px;background:var(--bg3);border-bottom:1px solid var(--border)}' +
    '.imc-detail-title{font-size:9px;font-weight:800;color:var(--text3);margin-bottom:6px;letter-spacing:.4px;text-transform:uppercase}' +
    '.imc-chips{display:flex;flex-wrap:wrap;gap:5px}' +
    '.imc-chip{display:flex;align-items:center;gap:4px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:10px;padding:4px 9px}' +
    '.imc-chip-n{font-size:12px;font-weight:800}' +
    '.imc-chip-l{font-size:9px;color:var(--text3)}' +
    /* Actions */
    '.imc-act{padding:11px 13px;display:flex;gap:8px}' +
    '.btn-green{flex:1;padding:10px;background:var(--green);color:#fff;border:none;border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;cursor:pointer;touch-action:manipulation;display:flex;align-items:center;justify-content:center;gap:5px}' +
    '.btn-outline{flex:1;padding:10px;background:var(--bg3);color:var(--text2);border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;cursor:pointer;touch-action:manipulation;display:flex;align-items:center;justify-content:center;gap:5px}' +
    /* Mutasi rows */
    '.irow{padding:11px 14px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:10px}' +
    '.irow:last-child{border-bottom:none}' +
    '.ibadge{font-size:9px;font-weight:800;padding:2px 7px;border-radius:20px;display:inline-block}';
  document.head.appendChild(s);
})();

/* ── Nav dispatch ── */
if(typeof _navDispatch !== 'undefined' && typeof _navDispatch.register === 'function'){
  _navDispatch.register('material', function(){
    setTimeout(function(){
      invLoadMaster(function(){ invNavSub(_invTabCur || 'dashboard'); });
    }, 80);
  });
}

function navMat(key, tab, btnEl){
  nav(key, btnEl);
  var map = { ringkasan:'dashboard', masuk:'masuk', keluar:'keluar',
    dismantle:'dismantle', lacak:'trace', laporan:'laporan' };
  invNavSub(map[tab] || tab);
}

function invNavSub(sub){
  _invTabCur = sub;
  ['dashboard','masuk','keluar','dismantle','trace','laporan','master','kirim','opname'].forEach(function(s){
    var el = document.getElementById('inv-sub-' + s);
    if(el) el.style.display = (s === sub) ? 'block' : 'none';
  });
  if(sub === 'dashboard') { invDashLoad(); }
  if(sub === 'masuk')     { window._invMasukPage = 1; invMasukLoad(); }
  if(sub === 'keluar')    { invKeluarLoad(); }
  if(sub === 'dismantle') { invDismantleLoad(); }
  if(sub === 'trace')     { invTraceLoad(); }
  if(sub === 'laporan')   { if(typeof invLapLoad === 'function') invLapLoad(true); }
  if(sub === 'opname')    { invOpnameLoad(); }
}

/* ════════════════════════════════════════════════
   SSOT: _matMutasi — SATU titik untuk semua gerak stok
   Fetch fresh → update → insert mutasi (atomic)
════════════════════════════════════════════════ */
function _matMutasi(itemId, delta, jenis, payload){
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb || !itemId) return Promise.resolve({ok:false, error:'no_sb_or_item'});
  payload = payload || {};
  return sb.from('material_items').select('stok').eq('id', itemId).single()
    .then(function(r){
      if(r.error || !r.data) return {ok:false, error:'item_not_found'};
      var sebelum = parseFloat(r.data.stok) || 0;
      var sesudah = sebelum + delta;
      return sb.from('material_items').update({stok: sesudah}).eq('id', itemId)
        .then(function(ru){
          if(ru.error) return {ok:false, error:ru.error.message};
          var mut = {
            item_id: itemId, jenis: jenis, jumlah: Math.abs(delta),
            stok_sebelum: sebelum, stok_sesudah: sesudah,
            tgl: payload.tgl || new Date().toISOString().slice(0,10)
          };
          ['area_id','odc_id','odp_id','pel_id','pel_cid','teknisi','sn_ont','no_ref','keterangan']
            .forEach(function(k){ if(payload[k] !== undefined && payload[k] !== null && payload[k] !== '') mut[k] = payload[k]; });
          return sb.from('material_mutasi').insert([mut])
            .then(function(rm){
              if(rm.error){
                return sb.from('material_items').update({stok: sebelum}).eq('id', itemId)
                  .then(function(){ return {ok:false, error:'mutasi_insert_failed'}; });
              }
              var cached = _invMatiData.find(function(x){ return x.id === itemId; });
              if(cached) cached.stok = sesudah;
              if(typeof window.SOT !== 'undefined' && window.SOT) SOT.invalidate('inventory');
              return {ok:true, stokSebelum:sebelum, stokSesudah:sesudah};
            });
        });
    }).catch(function(e){ return {ok:false, error:(e && e.message) || 'exception'}; });
}
window._matMutasi = _matMutasi;

function _matMutasiSequence(ops){
  var res = [];
  return ops.reduce(function(chain, op){
    return chain.then(function(){
      return _matMutasi(op.itemId, op.delta, op.jenis, op.payload)
        .then(function(r){ res.push(r); });
    });
  }, Promise.resolve()).then(function(){ return res; });
}
window._matMutasiSequence = _matMutasiSequence;

/* ════════════════
   LOAD MASTER
════════════════ */
function invLoadMaster(cb){
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb){ _invMatiLoaded = true; if(cb) cb(); return; }
  sb.from('material_items').select('*').order('kode')
    .then(function(r){
      if(!r.error){ _invMatiData = r.data || []; }
      /* Tandai sudah dicoba load, baik berhasil maupun kosong/gagal —
         mencegah invDashLoad memanggil ulang invLoadMaster tanpa henti
         (lihat fix infinite-recursion di invDashLoad). */
      _invMatiLoaded = true;
      _invFillAllDropdowns();
      if(cb) cb();
    }).catch(function(){ _invMatiLoaded = true; if(cb) cb(); });
}

function _esc3(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function _invItemNama(id){
  var m = _invMatiData.find(function(x){ return x.id === id; });
  return m ? (m.kode + ' · ' + m.nama) : '—';
}

function invDashLoad(){
  if(!_invMatiLoaded){
    /* Pengaman anti infinite-loop: dulu di sini mengecek _invMatiData.length,
       jadi kalau tabel material_items memang kosong atau fetch gagal,
       invLoadMaster(invDashLoad) akan saling panggil tanpa henti sampai
       "Maximum call stack size exceeded". Sekarang dicek dari flag
       _invMatiLoaded (ditandai true setelah SATU kali percobaan fetch,
       apa pun hasilnya), plus batas percobaan sebagai pengaman tambahan. */
    window._invDashRetry = (window._invDashRetry || 0) + 1;
    if(window._invDashRetry > 5){
      var rootErr = document.getElementById('inv-d-content');
      if(rootErr) rootErr.innerHTML = '<div class="inv-ld">Gagal memuat data master barang. Coba refresh halaman.</div>';
      window._invDashRetry = 0;
      return;
    }
    invLoadMaster(invDashLoad);
    return;
  }
  window._invDashRetry = 0;
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb) return;

  var root = document.getElementById('inv-d-content');
  if(root) root.innerHTML = '<div class="inv-ld"><div style="width:32px;height:32px;border:3px solid rgba(26,86,219,.15);border-top-color:var(--c1);border-radius:50%;animation:rot 1s linear infinite;margin:0 auto 12px"></div>Memuat data inventory…</div>';

  Promise.all([
    sb.from('material_mutasi')
      .select('jenis,jumlah,item_id,tgl,teknisi,sn_ont,pel_cid,created_at')
      .order('created_at', {ascending:false}).limit(5000),
    sb.from('pelanggan')
      .select('id,cid,nama,area_id,ont_item_id,kabel_item_id,status,sn_ont,teknisi_pasang,tgl_pasang,alamat'),
    sb.from('dismantle_orders')
      .select('id,pel_id,ont_item_id,ont_kembali,ont_kondisi,status,teknisi,tgl_selesai,area_id')
      .eq('status','selesai').limit(2000)
  ]).then(function(results){
    var mutasi    = (!results[0].error && results[0].data) ? results[0].data : [];
    var pelData   = (!results[1].error && results[1].data) ? results[1].data : [];
    var dismantle = (!results[2].error && results[2].data) ? results[2].data : [];

    var JENIS_MASUK  = ['masuk','koreksi','dismantle_kembali','return_dismantle','recovery_dismantle'];
    var JENIS_KELUAR = ['instalasi','keluar','distribusi','maintenance','maintenance_ont',
                        'maintenance_kabel','odp_maintenance','odc_maintenance'];
    var JENIS_RUSAK  = ['rusak'];

    var masukById = {}, keluarById = {}, keluarJenisById = {};
    mutasi.forEach(function(m){
      var qty = m.jumlah || 0;
      /* Koreksi opname bisa menambah ATAU mengurangi stok. Arah ditentukan oleh
         tanda nilai jumlah yang sebenarnya tersimpan, bukan diasumsikan selalu masuk. */
      if(m.jenis === 'koreksi'){
        if(qty > 0) masukById[m.item_id] = (masukById[m.item_id] || 0) + qty;
        else if(qty < 0){
          keluarById[m.item_id] = (keluarById[m.item_id] || 0) + Math.abs(qty);
          if(!keluarJenisById[m.item_id]) keluarJenisById[m.item_id] = {};
          keluarJenisById[m.item_id]['koreksi'] = (keluarJenisById[m.item_id]['koreksi'] || 0) + Math.abs(qty);
        }
        return;
      }
      if(JENIS_MASUK.indexOf(m.jenis) >= 0 && qty > 0){
        masukById[m.item_id] = (masukById[m.item_id] || 0) + qty;
      }
      if(JENIS_KELUAR.indexOf(m.jenis) >= 0 && qty > 0){
        keluarById[m.item_id] = (keluarById[m.item_id] || 0) + qty;
        if(!keluarJenisById[m.item_id]) keluarJenisById[m.item_id] = {};
        keluarJenisById[m.item_id][m.jenis] = (keluarJenisById[m.item_id][m.jenis] || 0) + qty;
      }
      if(JENIS_RUSAK.indexOf(m.jenis) >= 0 && qty > 0){
        if(!keluarJenisById[m.item_id]) keluarJenisById[m.item_id] = {};
        keluarJenisById[m.item_id]['rusak'] = (keluarJenisById[m.item_id]['rusak'] || 0) + qty;
      }
    });


    var ontUsage = {};
    pelData.forEach(function(p){
      if(!p.ont_item_id) return;
      if(!ontUsage[p.ont_item_id]) ontUsage[p.ont_item_id] = {aktif:0, total:0, list:[]};
      ontUsage[p.ont_item_id].total++;
      if(['aktif','maintenance','proses'].indexOf(p.status) >= 0){
        ontUsage[p.ont_item_id].aktif++;
        ontUsage[p.ont_item_id].list.push(p);
      }
    });

    var dismantleKembali = {}, dismantleTidakKembali = {};
    dismantle.forEach(function(d){
      if(!d.ont_item_id) return;
      if(d.ont_kembali) dismantleKembali[d.ont_item_id] = (dismantleKembali[d.ont_item_id]||0) + 1;
      else dismantleTidakKembali[d.ont_item_id] = (dismantleTidakKembali[d.ont_item_id]||0) + 1;
    });

    var rusakById = {}, hilangById = {};
    mutasi.forEach(function(m){
      var qty = m.jumlah || 0;
      if(m.jenis === 'rusak')  rusakById[m.item_id]  = (rusakById[m.item_id]  || 0) + (qty>0?qty:1);
      if(m.jenis === 'hilang') hilangById[m.item_id] = (hilangById[m.item_id] || 0) + (qty>0?qty:1);
    });

    var totalStok   = _invMatiData.reduce(function(s,m){ return s + (m.stok||0); }, 0);
    var totalMasuk  = Object.keys(masukById).reduce(function(s,k){ return s + masukById[k]; }, 0);
    var totalKeluar = Object.keys(keluarById).reduce(function(s,k){ return s + keluarById[k]; }, 0);
    var totalRusak  = Object.keys(rusakById).reduce(function(s,k){ return s + rusakById[k]; }, 0);
    var totalHilang = Object.keys(hilangById).reduce(function(s,k){ return s + hilangById[k]; }, 0);
    var habis       = _invMatiData.filter(function(m){ return (m.stok||0) <= 0; }).length;
    var rendah      = _invMatiData.filter(function(m){ var s=m.stok||0,mn=m.min_stok||0; return mn>0&&s>0&&s<=mn; }).length;
    var aman        = _invMatiData.length - habis - rendah;

    if(!root) return;


        // Update KPI 3 in hero header
    var k3aman = document.getElementById('inv-k3-aman');
    var k3rendah = document.getElementById('inv-k3-rendah');
    var k3habis = document.getElementById('inv-k3-habis');
    var heroTitle = document.getElementById('inv-hero-title');
    var heroSub = document.getElementById('inv-hero-sub');
    if(k3aman) k3aman.textContent = aman;
    if(k3rendah) k3rendah.textContent = rendah;
    if(k3habis) k3habis.textContent = habis;
    if(heroTitle) heroTitle.textContent = 'Stok Material';
    if(heroSub) heroSub.textContent = _invMatiData.length + ' jenis material · ' + totalStok + ' unit di gudang';

    var html = '';

    // Material cards
    _invMatiData.forEach(function(m, idx){
      var stok  = m.stok || 0;
      var min   = m.min_stok || 0;
      var col   = stok <= 0 ? 'var(--red)' : (min > 0 && stok <= min ? 'var(--yellow)' : 'var(--green)');
      var lbl   = stok <= 0 ? 'Stok Habis' : (min > 0 && stok <= min ? 'Hampir Habis' : 'Stok Aman');
      var mMasuk = masukById[m.id] || 0;
      var mKeluar = keluarById[m.id] || 0;
      var mAktif = (ontUsage[m.id] || {}).aktif || 0;
      var iconMap = {'ONT':'📡','Kabel':'🔌','Splitter':'⚡','Patch Cord':'🔗','Splice':'🔧','Adapter':'🔘','Tray':'📦','Precon':'🔌','Clamp':'⚙️','Fast Connector':'🔧'};
      var icon = iconMap[m.kategori] || '📦';

      html += '<div class="inv-card">' +
        '<div class="inv-card-hd" onclick="invMasterOpenForm(\'' + m.id + '\')">' +
          '<div class="inv-card-ico" style="background:' + col + '15">' + icon + '</div>' +
          '<div class="inv-card-info">' +
            '<div class="inv-card-name">' + _esc3(m.nama||'—') + '</div>' +
            '<div class="inv-card-kode">' + _esc3(m.kode||'—') + ' · ' + _esc3(m.kategori||'Lainnya') + '</div>' +
          '</div>' +
          '<div class="inv-card-stok">' +
            '<div class="inv-card-stok-n" style="color:' + col + '">' + stok + '</div>' +
            '<div class="inv-card-stok-l">' + _esc3(m.satuan||'unit') + ' di gudang</div>' +
            '<span class="inv-status" style="background:' + col + '18;color:' + col + ';border:1px solid ' + col + '30">' + lbl + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="inv-card-stat">' +
          '<div class="inv-card-stat-cell">' +
            '<div class="inv-card-stat-n" style="color:var(--green)">' + mMasuk + '</div>' +
            '<div class="inv-card-stat-l">Total Masuk</div>' +
          '</div>' +
          '<div class="inv-card-stat-cell">' +
            '<div class="inv-card-stat-n" style="color:var(--c2)">' + mKeluar + '</div>' +
            '<div class="inv-card-stat-l">Total Keluar</div>' +
          '</div>' +
          '<div class="inv-card-stat-cell">' +
            '<div class="inv-card-stat-n" style="color:var(--c1)">' + mAktif + '</div>' +
            '<div class="inv-card-stat-l">Aktif Terpasang</div>' +
          '</div>' +
        '</div>' +
        '<div class="inv-card-actions">' +
          '<button class="inv-card-btn" style="background:var(--gng2);color:var(--green);border:1px solid var(--gng)" onclick="invStokMasukOpen(\'' + m.id + '\')"><i class="ti ti-plus" style="font-size:10px"></i> Terima Barang</button>' +
          '<button class="inv-card-btn" style="background:var(--c1b);color:var(--c1);border:1px solid var(--c1g)" onclick="invMasterOpenForm(\'' + m.id + '\')"><i class="ti ti-history" style="font-size:10px"></i> Lihat Riwayat →</button>' +
        '</div>' +
      '</div>';
    });

    root.innerHTML = html || '<div class="inv-ld">Belum ada material</div>';

  }).catch(function(e){
    if(root) root.innerHTML = '<div class="inv-ld" style="color:var(--red)"><i class="ti ti-alert-circle" style="font-size:24px;display:block;margin-bottom:8px"></i>Error memuat data. Cek koneksi.</div>';
    console.error('invDashLoad', e);
  });
}


/* ════════════════════════════════════════════════
   TAB: BARANG MASUK
════════════════════════════════════════════════ */
function invMasukLoad(){
  if(!_invMatiData.length){ invLoadMaster(invMasukLoad); return; }
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb) return;
  var list = document.getElementById('inv-masuk-list');
  var jenisFil = document.getElementById('inv-masuk-jenis');
  var jenis = jenisFil ? jenisFil.value : '';
  if(list) list.innerHTML = '<div class="inv-ld"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memuat…</div>';

  var q = sb.from('material_mutasi').select('*,material_items(kode,nama,satuan)')
    .in('jenis', ['masuk','koreksi','dismantle_kembali','return_dismantle'])
    .order('created_at', {ascending:false}).limit(500);

  q.then(function(r){
    if(r.error){ if(list) list.innerHTML='<div class="inv-empty"><i class="ti ti-alert-triangle"></i>Error memuat data</div>'; return; }
    var data = r.data || [];
    if(jenis) data = data.filter(function(x){ return x.jenis === jenis; });
    invMasukRender(data);
  }).catch(function(e){ 
    if(list) list.innerHTML='<div class="inv-empty"><i class="ti ti-alert-triangle"></i>Error: '+(e.message||'coba lagi')+'</div>'; 
  });
}
function invMasukRender(data){
  var list = document.getElementById('inv-masuk-list');
  if(!list) return;
  if(!data.length){ list.innerHTML='<div class="inv-empty"><i class="ti ti-inbox"></i>Belum ada barang masuk</div>'; return; }
  var jenisLbl = {masuk:'Pembelian',koreksi:'Koreksi Opname',dismantle_kembali:'Dismantle Kembali',return_dismantle:'Return'};
  var pg = document.getElementById('inv-masuk-pg');
  var perPage = 20;
  var totalPages = Math.max(1, Math.ceil(data.length / perPage));
  if(!window._invMasukPage) window._invMasukPage = 1;
  if(window._invMasukPage > totalPages) window._invMasukPage = totalPages;
  var start = (window._invMasukPage - 1) * perPage;
  var pageData = data.slice(start, start + perPage);

  list.innerHTML = pageData.map(function(m){
    var item = m.material_items || {};
    var tgl = m.tgl || m.created_at || '';
    var tglStr = tgl ? new Date(tgl).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—';
    return '<div class="inv-card" style="margin-bottom:8px">' +
      '<div class="inv-card-hd">' +
        '<div class="inv-card-ico" style="background:var(--gng2)">📥</div>' +
        '<div class="inv-card-info">' +
          '<div class="inv-card-name">' + _esc3(item.nama||'—') + '</div>' +
          '<div class="inv-card-kode">' + _esc3(item.kode||'—') + ' · ' + (jenisLbl[m.jenis]||m.jenis) + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
          '<div style="font-size:18px;font-weight:800;color:var(--green)">+' + (m.jumlah||0) + '</div>' +
          '<div style="font-size:9px;color:var(--text3)">' + _esc3(item.satuan||'unit') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:8px 14px;font-size:10px;color:var(--text3);border-top:1px solid var(--border)">' +
        '<i class="ti ti-calendar" style="font-size:10px"></i> ' + tglStr +
        (m.teknisi ? ' &nbsp;·&nbsp; <i class="ti ti-user" style="font-size:10px"></i> ' + _esc3(m.teknisi) : '') +
        (m.keterangan ? ' &nbsp;·&nbsp; ' + _esc3(m.keterangan) : '') +
      '</div>' +
    '</div>';
  }).join('');

  if(pg){
    if(totalPages > 1){
      pg.style.display = 'flex';
      pg.innerHTML = '<button onclick="invMasukPage(-1)" style="padding:6px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer" ' + (window._invMasukPage<=1?'disabled':'') + '><i class="ti ti-chevron-left"></i></button>' +
        '<span style="font-size:11px;font-weight:700;color:var(--text3);padding:6px 12px">' + window._invMasukPage + ' / ' + totalPages + '</span>' +
        '<button onclick="invMasukPage(1)" style="padding:6px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer" ' + (window._invMasukPage>=totalPages?'disabled':'') + '><i class="ti ti-chevron-right"></i></button>';
    } else { pg.style.display = 'none'; }
  }
}
function invMasukPage(dir){ window._invMasukPage = (window._invMasukPage||1) + dir; invMasukLoad(); }

/* ════════════════════════════════════════════════
   TAB: BARANG KELUAR
════════════════════════════════════════════════ */
function invKeluarLoad(){
  if(!_invMatiData.length){ invLoadMaster(invKeluarLoad); return; }
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb) return;
  var list = document.getElementById('inv-keluar-list');
  var jenisFil = document.getElementById('inv-keluar-jenis');
  var jenis = jenisFil ? jenisFil.value : '';
  if(list) list.innerHTML = '<div class="inv-ld"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memuat…</div>';

  var jenisKeluar = ['instalasi','keluar','distribusi','maintenance','maintenance_ont','maintenance_kabel','odp_maintenance','odc_maintenance'];
  var q = sb.from('material_mutasi').select('*,material_items(kode,nama,satuan)')
    .in('jenis', jenisKeluar)
    .order('created_at', {ascending:false}).limit(500);

  q.then(function(r){
    if(r.error){ if(list) list.innerHTML='<div class="inv-empty"><i class="ti ti-alert-triangle"></i>Error memuat data</div>'; return; }
    var data = r.data || [];
    if(jenis) data = data.filter(function(x){ return x.jenis === jenis; });
    invKeluarRender(data);
  }).catch(function(e){ 
    if(list) list.innerHTML='<div class="inv-empty"><i class="ti ti-alert-triangle"></i>Error: '+(e.message||'coba lagi')+'</div>'; 
  });
}
function invKeluarRender(data){
  var list = document.getElementById('inv-keluar-list');
  if(!list) return;
  if(!data.length){ list.innerHTML='<div class="inv-empty"><i class="ti ti-inbox"></i>Belum ada barang keluar</div>'; return; }
  var jenisLbl = {instalasi:'Instalasi Baru',keluar:'Pengeluaran',distribusi:'Distribusi',maintenance:'Maintenance',maintenance_ont:'Ganti ONT',maintenance_kabel:'Ganti Kabel',odp_maintenance:'Maintenance ODP',odc_maintenance:'Maintenance ODC'};
  var pg = document.getElementById('inv-keluar-pg');
  var perPage = 20;
  var totalPages = Math.max(1, Math.ceil(data.length / perPage));
  if(!window._invKeluarPage) window._invKeluarPage = 1;
  if(window._invKeluarPage > totalPages) window._invKeluarPage = totalPages;
  var start = (window._invKeluarPage - 1) * perPage;
  var pageData = data.slice(start, start + perPage);

  list.innerHTML = pageData.map(function(m){
    var item = m.material_items || {};
    var tgl = m.tgl || m.created_at || '';
    var tglStr = tgl ? new Date(tgl).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—';
    return '<div class="inv-card" style="margin-bottom:8px">' +
      '<div class="inv-card-hd">' +
        '<div class="inv-card-ico" style="background:var(--c1b)">📤</div>' +
        '<div class="inv-card-info">' +
          '<div class="inv-card-name">' + _esc3(item.nama||'—') + '</div>' +
          '<div class="inv-card-kode">' + _esc3(item.kode||'—') + ' · ' + (jenisLbl[m.jenis]||m.jenis) + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
          '<div style="font-size:18px;font-weight:800;color:var(--c2)">-' + (m.jumlah||0) + '</div>' +
          '<div style="font-size:9px;color:var(--text3)">' + _esc3(item.satuan||'unit') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:8px 14px;font-size:10px;color:var(--text3);border-top:1px solid var(--border)">' +
        '<i class="ti ti-calendar" style="font-size:10px"></i> ' + tglStr +
        (m.teknisi ? ' &nbsp;·&nbsp; <i class="ti ti-user" style="font-size:10px"></i> ' + _esc3(m.teknisi) : '') +
        (m.pel_cid ? ' &nbsp;·&nbsp; <i class="ti ti-id-badge" style="font-size:10px"></i> ' + _esc3(m.pel_cid) : '') +
        (m.keterangan ? ' &nbsp;·&nbsp; ' + _esc3(m.keterangan) : '') +
      '</div>' +
    '</div>';
  }).join('');

  if(pg){
    if(totalPages > 1){
      pg.style.display = 'flex';
      pg.innerHTML = '<button onclick="invKeluarPage(-1)" style="padding:6px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer" ' + (window._invKeluarPage<=1?'disabled':'') + '><i class="ti ti-chevron-left"></i></button>' +
        '<span style="font-size:11px;font-weight:700;color:var(--text3);padding:6px 12px">' + window._invKeluarPage + ' / ' + totalPages + '</span>' +
        '<button onclick="invKeluarPage(1)" style="padding:6px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer" ' + (window._invKeluarPage>=totalPages?'disabled':'') + '><i class="ti ti-chevron-right"></i></button>';
    } else { pg.style.display = 'none'; }
  }
}
function invKeluarPage(dir){ window._invKeluarPage = (window._invKeluarPage||1) + dir; invKeluarLoad(); }

/* ════════════════════════════════════════════════
   TAB: DISMANTLE & KEMBALI
════════════════════════════════════════════════ */
function invDismantleLoad(){
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb) return;
  var list = document.getElementById('inv-dismantle-list');
  var jenisFil = document.getElementById('inv-dism-jenis');
  var jenis = jenisFil ? jenisFil.value : '';
  if(list) list.innerHTML = '<div class="inv-ld"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memuat…</div>';

  sb.from('dismantle_orders').select('*,pelanggan(cid,nama,alamat)')
    .eq('status','selesai').order('tgl_selesai', {ascending:false}).limit(200)
    .then(function(r){
      if(r.error){ if(list) list.innerHTML='<div class="inv-empty"><i class="ti ti-alert-triangle"></i>Error memuat data</div>'; return; }
      var data = r.data || [];
      if(jenis === 'kembali') data = data.filter(function(x){ return x.ont_kembali; });
      if(jenis === 'rusak') data = data.filter(function(x){ return x.ont_kondisi === 'rusak'; });
      if(jenis === 'hilang') data = data.filter(function(x){ return !x.ont_kembali && x.ont_kondisi !== 'rusak'; });
      invDismantleRender(data);
    }).catch(function(e){ 
      if(list) list.innerHTML='<div class="inv-empty"><i class="ti ti-alert-triangle"></i>Error: '+(e.message||'coba lagi')+'</div>'; 
    });
}
function invDismantleRender(data){
  var list = document.getElementById('inv-dismantle-list');
  if(!list) return;
  if(!data.length){ list.innerHTML='<div class="inv-empty"><i class="ti ti-inbox"></i>Belum ada data dismantle</div>'; return; }
  var pg = document.getElementById('inv-dismantle-pg');
  var perPage = 20;
  var totalPages = Math.max(1, Math.ceil(data.length / perPage));
  if(!window._invDismPage) window._invDismPage = 1;
  if(window._invDismPage > totalPages) window._invDismPage = totalPages;
  var start = (window._invDismPage - 1) * perPage;
  var pageData = data.slice(start, start + perPage);

  list.innerHTML = pageData.map(function(d){
    var pel = d.pelanggan || {};
    var tgl = d.tgl_selesai || '';
    var tglStr = tgl ? new Date(tgl).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—';
    var status, col;
    if(d.ont_kembali){ status = 'Kembali ke Gudang'; col = 'var(--green)'; }
    else if(d.ont_kondisi === 'rusak'){ status = 'Rusak'; col = 'var(--red)'; }
    else { status = 'Hilang'; col = 'var(--red)'; }
    return '<div class="inv-card" style="margin-bottom:8px">' +
      '<div class="inv-card-hd">' +
        '<div class="inv-card-ico" style="background:' + col + '15">↩️</div>' +
        '<div class="inv-card-info">' +
          '<div class="inv-card-name">' + _esc3(pel.nama||'—') + '</div>' +
          '<div class="inv-card-kode">' + _esc3(pel.cid||'—') + ' · ' + tglStr + '</div>' +
        '</div>' +
        '<span class="inv-status" style="background:' + col + '18;color:' + col + ';border:1px solid ' + col + '30">' + status + '</span>' +
      '</div>' +
      '<div style="padding:8px 14px;font-size:10px;color:var(--text3);border-top:1px solid var(--border)">' +
        (d.teknisi ? '<i class="ti ti-user" style="font-size:10px"></i> ' + _esc3(d.teknisi) + ' &nbsp;·&nbsp; ' : '') +
        (pel.alamat ? '<i class="ti ti-map-pin" style="font-size:10px"></i> ' + _esc3(pel.alamat) : '') +
      '</div>' +
    '</div>';
  }).join('');

  if(pg){
    if(totalPages > 1){
      pg.style.display = 'flex';
      pg.innerHTML = '<button onclick="invDismPage(-1)" style="padding:6px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer" ' + (window._invDismPage<=1?'disabled':'') + '><i class="ti ti-chevron-left"></i></button>' +
        '<span style="font-size:11px;font-weight:700;color:var(--text3);padding:6px 12px">' + window._invDismPage + ' / ' + totalPages + '</span>' +
        '<button onclick="invDismPage(1)" style="padding:6px 12px;background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer" ' + (window._invDismPage>=totalPages?'disabled':'') + '><i class="ti ti-chevron-right"></i></button>';
    } else { pg.style.display = 'none'; }
  }
}
function invDismPage(dir){ window._invDismPage = (window._invDismPage||1) + dir; invDismantleLoad(); }

/* ════════════════════════════════════════════════
   TAB: LACAK BARANG (stub, uses invTraceSearch)
════════════════════════════════════════════════ */
function invTraceLoad(){
  // Focus the search input
  var q = document.getElementById('inv-trace-q');
  if(q) q.focus();
}

function _invKpiCell(num, lbl, col){
  return '<div class="inv-kpi-cell">' +
    '<div class="inv-kpi-n" style="color:' + col + '">' + num + '</div>' +
    '<div class="inv-kpi-l">' + lbl + '</div>' +
  '</div>';
}

function _invKpiBox(num, lbl, col){
  return _invKpiCell(num, lbl, col);
}

function _invRingkasBlok(judul, totalNum, col, byId, itemList){
  var isMasuk = judul.indexOf('Masuk') >= 0;
  var jenisFil = isMasuk ? 'masuk' : '';

  var html = '<div style="margin-bottom:14px">' +
    '<div style="background:linear-gradient(135deg,' + col + '15,' + col + '06);border:1.5px solid ' + col + '30;border-radius:var(--r);padding:16px;margin-bottom:8px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
        '<div>' +
          '<div style="font-size:9.5px;font-weight:800;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">' + _esc3(judul) + '</div>' +
          '<div style="font-size:36px;font-weight:900;color:' + col + ';line-height:1">' + totalNum + '</div>' +
          '<div style="font-size:9px;color:var(--text3);margin-top:2px">unit sepanjang waktu</div>' +
        '</div>' +
        '<div style="width:44px;height:44px;border-radius:12px;background:' + col + '18;display:flex;align-items:center;justify-content:center">' +
          '<i class="ti ti-' + (isMasuk?'arrow-down-circle':'arrow-up-circle') + '" style="font-size:22px;color:' + col + '"></i>' +
        '</div>' +
      '</div>' +
    '</div>';

  var rows = itemList.filter(function(m){ return (byId[m.item_id||m.id] || 0) > 0; })
    .map(function(m){ return {item:m, jumlah: byId[m.item_id||m.id] || 0}; })
    .sort(function(a,b){ return b.jumlah - a.jumlah; });

  if(rows.length){
    html += '<div style="background:var(--bg2);border:1.5px solid var(--border);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh-sm)">';
    rows.forEach(function(r, idx){
      var m = r.item;
      var pct = rows[0] ? Math.round(r.jumlah/rows[0].jumlah*100) : 0;
      html += '<div onclick="invNavSub(\'mutasi\')" style="cursor:pointer;display:flex;align-items:center;gap:10px;padding:11px 13px;' +
        (idx < rows.length-1 ? 'border-bottom:1px solid var(--border);' : '') +
        'touch-action:manipulation;transition:background .12s" ' +
        'onmouseenter="this.style.background=\'var(--bg3)\'" onmouseleave="this.style.background=\'\'">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:12px;font-weight:700;color:var(--text)">' + _esc3(m.nama||'—') +
            (m.merk && m.merk!==m.nama ? ' <span style="color:var(--text3);font-weight:500;font-size:10px">' + _esc3(m.merk) + '</span>' : '') +
          '</div>' +
          '<div style="font-size:9.5px;color:var(--text3);margin-top:1px">' + _esc3(m.kategori||'Lainnya') + '</div>' +

          '<div style="margin-top:5px;height:3px;background:var(--bg4);border-radius:3px;overflow:hidden">' +
            '<div style="height:100%;width:' + pct + '%;background:' + col + ';border-radius:3px"></div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
          '<div style="font-size:15px;font-weight:800;color:' + col + '">' + r.jumlah + '</div>' +
          '<div style="font-size:8.5px;color:var(--text3)">' + _esc3(m.satuan||'unit') + '</div>' +
        '</div>' +
        '<i class="ti ti-chevron-right" style="color:var(--text3);font-size:13px;flex-shrink:0"></i>' +
      '</div>';
    });
    html += '</div>';
  } else {
    html += '<div style="padding:14px;text-align:center;font-size:11px;color:var(--text3);background:var(--bg2);border:1px solid var(--border2);border-radius:var(--rs)">Belum ada data</div>';
  }

  html += '</div>';
  return html;
}

function _invTotalCell(n, lbl, col, isLast){
  return '<div style="padding:12px 4px;text-align:center;' + (isLast?'':'border-right:1px solid var(--border);') + '">' +
    '<div style="font-size:18px;font-weight:800;color:' + col + ';line-height:1;margin-bottom:3px">' + n + '</div>' +
    '<div style="font-size:8.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.3px">' + lbl + '</div>' +
  '</div>';
}

function invMasterLoad(){
  if(!_invMatiData.length){ invLoadMaster(invMasterRender); return; }
  invMasterRender();
}
function invMasterFilter(q){
  var data = q ? _invMatiData.filter(function(m){
    var s = q.toLowerCase();
    return (m.nama||'').toLowerCase().includes(s) || (m.kode||'').toLowerCase().includes(s) || (m.kategori||'').toLowerCase().includes(s);
  }) : _invMatiData;
  invMasterRender(data);
}
function invMasterRender(data){
  if(!_invMatiData.length){ invLoadMaster(function(){ invMasterRender(); }); return; }
  data = data || _invMatiData;
  var aman   = data.filter(function(m){ var s=m.stok||0,mn=m.min_stok||0; return s>0&&(mn===0||s>mn); }).length;
  var rendah = data.filter(function(m){ var s=m.stok||0,mn=m.min_stok||0; return mn>0&&s<=mn&&s>0; }).length;
  var habis  = data.filter(function(m){ return (m.stok||0)<=0; }).length;
  var st = document.getElementById('inv-m-stats');
  if(st) st.innerHTML = [
    ['var(--green)','Aman',aman,'ti-check-circle'],
    ['var(--yellow)','Rendah',rendah,'ti-alert-triangle'],
    ['var(--red)','Habis',habis,'ti-alert-circle']
  ].map(function(x){
    return '<div style="background:var(--bg2);border-radius:12px;padding:12px 8px;border:1.5px solid ' + x[0] + '20;text-align:center;box-shadow:var(--sh-sm)">' +
      '<div style="font-size:22px;font-weight:800;color:' + x[0] + ';line-height:1;margin-bottom:3px">' + x[2] + '</div>' +
      '<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.3px">' + x[1] + '</div>' +
    '</div>';
  }).join('');

  var list = document.getElementById('inv-m-list');
  if(!list) return;
  if(!data.length){ list.innerHTML = '<div class="inv-ld"><i class="ti ti-package" style="font-size:28px;display:block;margin-bottom:8px;opacity:.2"></i>Tidak ada material</div>'; return; }

  list.innerHTML = data.map(function(m){
    var stok = m.stok||0, min = m.min_stok||0;
    var col  = stok<=0?'var(--red)':(min>0&&stok<=min?'var(--yellow)':'var(--green)');
    var lbl  = stok<=0?'Habis':(min>0&&stok<=min?'Rendah':'Aman');
    return '<div class="imc" style="margin-bottom:10px">' +
      '<div class="imc-top">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<div style="flex:1;min-width:0">' +
            '<div class="imc-code">' + _esc3(m.kode||'') + '</div>' +
            '<div class="imc-name" style="font-size:14px">' + _esc3(m.nama||'—') + '</div>' +
            '<div style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap">' +
              '<span style="font-size:9px;background:var(--c1b);color:var(--c1);padding:2px 8px;border-radius:20px;font-weight:700">' + _esc3(m.kategori||'—') + '</span>' +
              (m.merk?'<span style="font-size:9px;background:var(--bg3);color:var(--text2);padding:2px 8px;border-radius:20px;border:1px solid var(--border)">'+_esc3(m.merk)+'</span>':'') +
            '</div>' +
          '</div>' +
          '<div style="text-align:center;background:' + col + '08;border:1.5px solid ' + col + '25;border-radius:12px;padding:9px 12px;flex-shrink:0">' +
            '<div style="font-size:24px;font-weight:800;color:' + col + ';line-height:1">' + stok + '</div>' +
            '<div style="font-size:8.5px;color:var(--text3);margin-top:2px">' + _esc3(m.satuan||'unit') + '</div>' +
            '<span style="font-size:8px;font-weight:800;padding:1px 6px;border-radius:20px;background:' + col + '18;color:' + col + ';display:inline-block;margin-top:3px">' + lbl + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="imc-act">' +
        '<button onclick="invStokMasukOpen(\'' + m.id + '\')" class="btn-green"><i class="ti ti-arrow-down-circle"></i> Stok Masuk</button>' +
        '<button onclick="invMasterOpenForm(\'' + m.id + '\')" class="btn-outline"><i class="ti ti-edit"></i> Edit</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function invMasterOpenForm(id){
  var m = id ? _invMatiData.find(function(x){ return x.id === id; }) : null;
  var sv = function(eid, v){ var e = document.getElementById(eid); if(e) e.value = v || ''; };
  sv('inv-mf-id', id||''); sv('inv-mf-kode', m?m.kode:''); sv('inv-mf-nama', m?m.nama:'');
  sv('inv-mf-kategori', m?m.kategori:''); sv('inv-mf-satuan', m?(m.satuan||'unit'):'unit');
  sv('inv-mf-stok', m?(m.stok||0):''); sv('inv-mf-min-stok', m?(m.min_stok||0):'5');
  sv('inv-mf-harga', m?(m.harga||0):''); sv('inv-mf-merk', m?(m.merk||''):'');
  sv('inv-mf-status', m?(m.status||'aktif'):'aktif'); sv('inv-mf-ket', m?(m.keterangan||''):'');
  var t = document.getElementById('inv-mf-title');
  if(t) t.textContent = id ? 'Edit Material' : 'Tambah Material';
  document.getElementById('inv-mf-overlay').classList.add('on');
}
function invMasterCloseForm(){ document.getElementById('inv-mf-overlay').classList.remove('on'); }
function invMasterSave(){
  var g = function(id){ return ((document.getElementById(id)||{}).value||'').trim(); };
  var id = g('inv-mf-id') || null;
  var kode = g('inv-mf-kode'), nama = g('inv-mf-nama'), kategori = g('inv-mf-kategori');
  if(!kode||!nama||!kategori){ toast('Kode, nama, kategori wajib diisi','err'); return; }
  var payload = {kode:kode, nama:nama, kategori:kategori,
    satuan: g('inv-mf-satuan')||'unit',
    min_stok: parseInt(g('inv-mf-min-stok'))||0,
    harga: parseFloat(g('inv-mf-harga'))||0,
    merk: g('inv-mf-merk'), status: g('inv-mf-status')||'aktif',
    keterangan: g('inv-mf-ket') };
  if(!id) payload.stok = parseInt(g('inv-mf-stok'))||0;
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn = document.getElementById('inv-mf-save-btn');
  if(btn) btn.disabled = true;
  var p = id ? sb.from('material_items').update(payload).eq('id',id).select()
             : sb.from('material_items').insert([payload]).select();
  p.then(function(r){
    if(btn) btn.disabled = false;
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    toast(id?'Material diperbarui':'Material ditambahkan','ok');
    invMasterCloseForm();
    invLoadMaster(function(){ invMasterRender(); invDashLoad(); _invFillAllDropdowns(); });
  }).catch(function(e){ if(btn) btn.disabled=false; toast('Error: '+(e.message||''),'err'); });
}

function invStokMasukOpen(itemId){
  var item = _invMatiData.find(function(m){ return m.id === itemId; });
  if(!item) return;
  var sv = function(eid,v){ var e=document.getElementById(eid); if(e) e.value=v||''; };
  sv('inv-sm-id',itemId); sv('inv-sm-qty',''); sv('inv-sm-ref',''); sv('inv-sm-ket','');
  var n = document.getElementById('inv-sm-nama');
  if(n) n.textContent = item.kode + ' · ' + item.nama;
  var c = document.getElementById('inv-sm-cur');
  if(c) c.textContent = (item.stok||0) + ' ' + (item.satuan||'unit') + ' saat ini';
  document.getElementById('inv-sm-overlay').classList.add('on');
}
function invStokMasukSave(){
  var g = function(id){ return ((document.getElementById(id)||{}).value||'').trim(); };
  var itemId = g('inv-sm-id');
  var qty = parseInt(g('inv-sm-qty'))||0;
  if(!itemId||qty<=0){ toast('Pilih item dan isi jumlah','err'); return; }
  var btn = document.getElementById('inv-sm-save');
  if(btn) btn.disabled = true;
  _matMutasi(itemId, qty, 'masuk', {no_ref: g('inv-sm-ref')||null, keterangan: g('inv-sm-ket')||'Stok masuk gudang'})
    .then(function(res){
      if(btn) btn.disabled = false;
      if(!res.ok){ toast('Gagal: '+(res.error||'coba lagi'),'err'); return; }
      toast('Stok masuk +' + qty + '. Sisa: ' + res.stokSesudah, 'ok');
      document.getElementById('inv-sm-overlay').classList.remove('on');
      invLoadMaster(function(){ invMasterRender(); invDashLoad(); _invFillAllDropdowns(); });
    }).catch(function(e){ if(btn) btn.disabled=false; toast('Error: '+(e.message||''),'err'); });
}

function invMutasiLoad(){
  var sb = (typeof getSB==='function') ? getSB() : null; if(!sb) return;
  var jenis  = ((document.getElementById('inv-mut-jenis')||{}).value||'');
  var itemId = ((document.getElementById('inv-mut-item')||{}).value||'');
  var list = document.getElementById('inv-mut-list');
  if(list) list.innerHTML = '<div class="inv-ld"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memuat…</div>';
  var q = sb.from('material_mutasi').select('*').order('created_at',{ascending:false})
    .range(_invMutOffset, _invMutOffset + _invMutLimit - 1);
  if(jenis)  q = q.eq('jenis', jenis);
  if(itemId) q = q.eq('item_id', itemId);
  q.then(function(r){
    if(!list) return;
    var rows = (!r.error && r.data) ? r.data : [];
    if(!rows.length){ list.innerHTML = '<div class="inv-ld">Tidak ada mutasi</div>'; return; }
    list.innerHTML = '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);overflow:hidden">' +
      rows.map(function(m){ return _invMutRow(m); }).join('') + '</div>';
    var pg = document.getElementById('inv-mut-pg');
    if(pg){
      var h = '';
      if(_invMutOffset > 0) h += '<button onclick="_invMutPrev()" style="padding:7px 14px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:8px;font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer">← Sebelumnya</button>';
      if(rows.length === _invMutLimit) h += '<button onclick="_invMutNext()" style="padding:7px 14px;border:1.5px solid var(--border2);background:var(--bg2);border-radius:8px;font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:var(--text2);cursor:pointer">Berikutnya →</button>';
      pg.innerHTML = h;
    }
  }).catch(function(){});
}
function _invMutNext(){ _invMutOffset += _invMutLimit; invMutasiLoad(); }
function _invMutPrev(){ _invMutOffset = Math.max(0, _invMutOffset - _invMutLimit); invMutasiLoad(); }

function _invMutRow(m){
  var MASUK = ['masuk','koreksi','dismantle_kembali','return_dismantle','recovery_dismantle'];
  /* Untuk koreksi opname, jumlah bisa tersimpan negatif (stok berkurang) — arah tanda harus
     mengikuti nilai aslinya, bukan diasumsikan selalu masuk seperti jenis lain di array MASUK. */
  var rawJumlah = m.jumlah;
  var isNegatifAsli = (m.jenis === 'koreksi' && typeof rawJumlah === 'number' && rawJumlah < 0);
  var isMasuk = isNegatifAsli ? false : (MASUK.indexOf(m.jenis) >= 0);
  var col = isMasuk ? 'var(--green)' : 'var(--c2)';
  var sign = isMasuk ? '+' : '-';
  return '<div class="irow">' +
    '<div style="width:34px;height:34px;border-radius:10px;background:' + (isMasuk?'rgba(5,150,105,.12)':'rgba(249,115,22,.12)') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
      '<i class="ti ' + (isMasuk?'ti-trending-up':'ti-trending-down') + '" style="font-size:16px;color:' + col + '"></i>' +
    '</div>' +
    '<div style="flex:1;min-width:0">' +
      '<div style="font-size:11px;font-weight:800;color:var(--text);margin-bottom:2px">' + _esc3(_invItemNama(m.item_id)) + '</div>' +
      '<span class="ibadge" style="background:' + col + '18;color:' + col + '">' + _esc3((m.jenis||'').replace(/_/g,' ')) + '</span>' +
      (m.teknisi ? ' <span style="font-size:9px;color:var(--text3)"><i class="ti ti-user"></i> ' + _esc3(m.teknisi) + '</span>' : '') +
      (m.sn_ont ? '<div style="font-size:9px;font-family:monospace;color:var(--c1);margin-top:2px">SN: ' + _esc3(m.sn_ont) + '</div>' : '') +
      (m.pel_cid ? '<div style="font-size:9px;color:var(--text3)">CID: ' + _esc3(m.pel_cid) + '</div>' : '') +
      '<div style="font-size:9px;color:var(--text3);margin-top:2px">' + _esc3((m.tgl||m.created_at||'').slice(0,10)) + '</div>' +
    '</div>' +
    '<div style="text-align:right;flex-shrink:0">' +
      '<div style="font-size:16px;font-weight:900;color:' + col + '">' + sign + Math.abs(rawJumlah||0) + '</div>' +
      (m.stok_sesudah !== undefined ? '<div style="font-size:9px;color:var(--text3)">sisa: ' + m.stok_sesudah + '</div>' : '') +
    '</div>' +
  '</div>';
}

function _invLoadAreaBrandMap(cb){
  if(Object.keys(_invAreaBrandCache).length){ if(cb) cb(); return; }
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb){ if(cb) cb(); return; }
  sb.from('olts').select('area_id,brand')
    .then(function(r){
      if(!r.error && r.data) r.data.forEach(function(o){
        if(!o.area_id) return;
        var b = (o.brand||o.merk||'').trim().toLowerCase();
        var bn = b.indexOf('huawei')>=0?'Huawei':b.indexOf('nokia')>=0?'Nokia':
                 b.indexOf('comnet')>=0?'Comnet':b.indexOf('zte')>=0?'ZTE':(o.brand||o.merk||'');
        if(!_invAreaBrandCache[o.area_id]) _invAreaBrandCache[o.area_id] = bn;
      });
      if(cb) cb();
    }).catch(function(){ if(cb) cb(); });
}

function _invFillAllDropdowns(areaId){
  if(!Object.keys(_invAreaBrandCache).length){
    _invLoadAreaBrandMap(function(){ _invFillAllDropdowns(areaId); });
    return;
  }
  var _aId = areaId || (typeof CR_AREA_ID!=='undefined' ? CR_AREA_ID : null)
    || (typeof _getUserAreaScope==='function' ? (_getUserAreaScope()||{}).area_id : null);


  ['pelf-ont-model','pelf-kabel-precon','fasf-ont-model','fasf-kabel-precon','portf-ont-model','portf-kabel'].forEach(function(id){
    var sel = document.getElementById(id); if(!sel) return;
    var cur = sel.value;
    var isOnt = id.indexOf('ont') >= 0;
    var isKbl = id.indexOf('kabel') >= 0 || id.indexOf('precon') >= 0;
    var items = _invMatiData.filter(function(m){
      if(m.status==='nonaktif') return false;
      if(isOnt) return m.kategori==='ONT';
      if(isKbl) return m.kategori==='Kabel Precon';
      return true;
    });
    if(isOnt && _aId && window.CR==='teknisi'){
      var br = _invAreaBrandCache[_aId]||null;
      if(br){ var bl=br.toLowerCase(); var fi=items.filter(function(m){return (m.merk||m.nama||'').toLowerCase().indexOf(bl)>=0;}); if(fi.length) items=fi; }
    }
    var first = sel.options[0]; sel.innerHTML=''; if(first) sel.appendChild(first);
    items.forEach(function(m){
      var o=document.createElement('option'); o.value=m.id;
      o.textContent=m.kode+' · '+m.nama+(m.merk&&isOnt?' ['+m.merk+']':'')+(m.stok!==undefined?' (stok: '+(m.stok||0)+')':'');
      if(m.id===cur) o.selected=true; sel.appendChild(o);
    });
  });

  _invKirimFillSplit();


  var tkSel = document.getElementById('inv-k-teknisi');
  if(tkSel && tkSel.options.length <= 1){
    var sb=(typeof getSB==='function')?getSB():null;
    if(sb) sb.from('app_users').select('id,nama,username').in('role',['teknisi','area_manager','super_admin']).eq('is_active',true).order('nama')
      .then(function(r){
        if(r.error||!r.data) return;
        r.data.forEach(function(u){ var o=document.createElement('option'); o.value=u.nama||u.username; o.textContent=u.nama||(u.username||'—'); tkSel.appendChild(o); });
      }).catch(function(){});
  }


  var mutSel = document.getElementById('inv-mut-item');
  if(mutSel && mutSel.options.length <= 1){
    _invMatiData.forEach(function(m){ var o=document.createElement('option'); o.value=m.id; o.textContent=m.kode+' · '+m.nama; mutSel.appendChild(o); });
  }
}

function _invKirimFillSplit(){
  var uId = (typeof CR_AREA_ID!=='undefined'?CR_AREA_ID:null)||(typeof _getUserAreaScope==='function'?(_getUserAreaScope()||{}).area_id:null);
  var brand = uId ? (_invAreaBrandCache[uId]||null) : null;
  var brandLow = brand ? brand.toLowerCase() : null;

  var banner = document.getElementById('inv-k-banner');
  if(banner){
    if(window.CR==='teknisi' && uId){
      banner.style.display = 'block';
      var aObj=(_areaData||[]).find(function(a){return a.id===uId;});
      var at=document.getElementById('inv-k-area-txt'); if(at) at.textContent='Area: '+(aObj?(aObj.nama||aObj.kode):'—');
      var bt=document.getElementById('inv-k-brand-txt'); if(bt) bt.textContent=brand?('OLT '+brand):'';
    } else { banner.style.display='none'; }
  }

  var selOnt = document.getElementById('inv-k-ont');
  if(selOnt){
    var ontItems = _invMatiData.filter(function(m){
      if(m.status==='nonaktif'||m.kategori!=='ONT') return false;
      if(brandLow && window.CR==='teknisi') return (m.merk||m.nama||'').toLowerCase().indexOf(brandLow)>=0;
      return true;
    });
    var co=selOnt.value; selOnt.innerHTML='<option value="">— Pilih ONT —</option>';
    ontItems.forEach(function(m){ var o=document.createElement('option'); o.value=m.id; o.textContent=m.kode+' · '+m.nama+(m.merk?' ['+m.merk+']':'')+(m.stok!==undefined?' (stok: '+(m.stok||0)+')':''); if(m.id===co) o.selected=true; selOnt.appendChild(o); });
  }

  var selKbl = document.getElementById('inv-k-kabel');
  if(selKbl){
    var kblItems=_invMatiData.filter(function(m){return m.status!=='nonaktif'&&m.kategori==='Kabel Precon';});
    var ck=selKbl.value; selKbl.innerHTML='<option value="">— Pilih Kabel (opsional) —</option>';
    kblItems.forEach(function(m){ var o=document.createElement('option'); o.value=m.id; o.textContent=m.kode+' · '+m.nama+(m.stok!==undefined?' (stok: '+(m.stok||0)+')':''); if(m.id===ck) o.selected=true; selKbl.appendChild(o); });
  }

  var lainGroup=document.getElementById('inv-k-lain-group');
  var isAdmin=window.CR&&['super_admin','owner','admin','area_manager'].indexOf(window.CR)>=0;
  if(lainGroup) lainGroup.style.display=isAdmin?'block':'none';
  if(isAdmin){
    var selLain=document.getElementById('inv-k-lain');
    if(selLain){
      var lainItems=_invMatiData.filter(function(m){return m.status!=='nonaktif'&&m.kategori!=='ONT'&&m.kategori!=='Kabel Precon';});
      var cl=selLain.value; selLain.innerHTML='<option value="">— Pilih Material Lain —</option>';
      lainItems.forEach(function(m){ var o=document.createElement('option'); o.value=m.id; o.textContent=m.kategori+': '+m.nama+(m.stok!==undefined?' (stok: '+(m.stok||0)+')':''); if(m.id===cl) o.selected=true; selLain.appendChild(o); });
    }
  }
}

function invKirimLoad(){
  if(!_invMatiData.length){ invLoadMaster(invKirimLoad); return; }
  _invLoadAreaBrandMap(function(){ _invFillAllDropdowns(); _invKirimFillSplit(); });
  var tgl=document.getElementById('inv-k-tgl'); if(tgl&&!tgl.value) tgl.value=new Date().toISOString().slice(0,10);
  var sb=(typeof getSB==='function')?getSB():null; if(!sb) return;
  sb.from('material_mutasi').select('*').eq('jenis','distribusi').order('created_at',{ascending:false}).limit(20)
    .then(function(r){
      var hist=document.getElementById('inv-k-history'); if(!hist) return;
      var rows=(!r.error&&r.data)?r.data:[];
      if(!rows.length){hist.innerHTML='<div class="inv-ld">Belum ada distribusi</div>';return;}
      hist.innerHTML='<div>'+rows.map(function(m){return _invMutRow(m);}).join('')+'</div>';
    }).catch(function(){});
}
function invKirimCekStok(type){
  var selId=type==='ont'?'inv-k-ont':type==='kabel'?'inv-k-kabel':'inv-k-lain';
  var infoId='inv-k-'+type+'-info';
  var itemId=((document.getElementById(selId)||{}).value||'');
  var info=document.getElementById(infoId);
  if(!itemId||!info){if(info)info.style.display='none';return;}
  var item=_invMatiData.find(function(m){return m.id===itemId;});
  if(!item){if(info)info.style.display='none';return;}
  var stok=item.stok||0;
  var col=stok<=0?'var(--red)':(item.min_stok&&stok<=item.min_stok?'var(--yellow)':'var(--green)');
  info.style.display='block'; info.style.background=col+'18'; info.style.color=col;
  info.textContent='Stok: '+stok+' '+(item.satuan||'unit')+' — '+(stok<=0?'HABIS':(item.min_stok&&stok<=item.min_stok?'Rendah':'Tersedia'));
}
function invKirimSave(){
  var g=function(id){return((document.getElementById(id)||{}).value||'').trim();};
  var gN=function(id){return parseInt((document.getElementById(id)||{}).value)||0;};
  var ontId=g('inv-k-ont'),kabelId=g('inv-k-kabel'),lainId=g('inv-k-lain');
  var qOnt=gN('inv-k-qty-ont'),qKbl=gN('inv-k-qty-kabel'),qLain=gN('inv-k-qty-lain');
  var teknisi=g('inv-k-teknisi'),tgl=g('inv-k-tgl')||new Date().toISOString().slice(0,10),ket=g('inv-k-ket');
  if(!teknisi){toast('Pilih teknisi penerima','err');return;}
  if(!(ontId&&qOnt>0)&&!(kabelId&&qKbl>0)&&!(lainId&&qLain>0)){toast('Pilih minimal 1 material','err');return;}
  var ops=[];
  if(ontId&&qOnt>0)  ops.push({itemId:ontId,  delta:-qOnt,  jenis:'distribusi',payload:{teknisi,tgl,keterangan:ket||'ONT → '+teknisi}});
  if(kabelId&&qKbl>0)ops.push({itemId:kabelId, delta:-qKbl,  jenis:'distribusi',payload:{teknisi,tgl,keterangan:ket||'Kabel → '+teknisi}});
  if(lainId&&qLain>0)ops.push({itemId:lainId,  delta:-qLain, jenis:'distribusi',payload:{teknisi,tgl,keterangan:ket||'Material → '+teknisi}});
  _matMutasiSequence(ops).then(function(results){
    var ok=results.filter(function(r){return r.ok;}).length;
    var fail=results.filter(function(r){return !r.ok;}).length;
    if(fail>0) toast('Distribusi: '+ok+' ok, '+fail+' gagal','warn');
    else toast('Distribusi ke '+teknisi+' berhasil','ok');
    ['inv-k-qty-ont','inv-k-qty-kabel','inv-k-qty-lain','inv-k-ket'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
    ['inv-k-ont','inv-k-kabel','inv-k-lain'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';var t=id.replace('inv-k-','');var info=document.getElementById('inv-k-'+t+'-info');if(info)info.style.display='none';});
    invLoadMaster(function(){_invKirimFillSplit();invKirimLoad();invDashLoad();});
  }).catch(function(e){toast('Error: '+(e.message||'coba lagi'),'err');});
}

function invOpnameLoad(){
  if(!_invMatiData.length){invLoadMaster(invOpnameLoad);return;}
  var tglEl=document.getElementById('inv-opn-tgl');
  if(tglEl) tglEl.textContent=new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  var list=document.getElementById('inv-opn-list'); if(!list) return;
  list.innerHTML=_invMatiData.map(function(m){
    return '<div style="padding:10px 12px;border-bottom:1px solid var(--border)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">' +
        '<div><div style="font-size:12px;font-weight:700;color:var(--text)">' + _esc3(m.nama||m.kode) + '</div>' +
          '<div style="font-size:10px;color:var(--text3)">Sistem: <b style="color:var(--c1)">' + (m.stok||0) + ' ' + _esc3(m.satuan||'unit') + '</b></div></div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<span style="font-size:10px;color:var(--text3)">Fisik:</span>' +
          '<input id="inv-opn-f-' + m.id + '" type="number" min="0" placeholder="0" oninput="invOpnCalc(\'' + m.id + '\',' + (m.stok||0) + ')"' +
            ' style="width:68px;padding:7px 8px;border:1.5px solid var(--border2);border-radius:8px;font-family:Sora,sans-serif;font-size:13px;font-weight:700;text-align:center;outline:none;background:var(--bg2);color:var(--text)">' +
        '</div>' +
      '</div>' +
      '<div id="inv-opn-d-' + m.id + '" style="font-size:10px;font-weight:700;display:none"></div>' +
    '</div>';
  }).join('');
  var sb=(typeof getSB==='function')?getSB():null; if(!sb) return;
  sb.from('material_mutasi').select('*').eq('jenis','koreksi').order('created_at',{ascending:false}).limit(10)
    .then(function(r){
      var hist=document.getElementById('inv-opn-history'); if(!hist) return;
      var rows=(!r.error&&r.data)?r.data:[];
      if(!rows.length){hist.innerHTML='<div class="inv-ld">Belum ada riwayat opname</div>';return;}
      hist.innerHTML='<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);overflow:hidden">'+rows.map(function(m){return _invMutRow(m);}).join('')+'</div>';
    }).catch(function(){});
}
function invOpnCalc(itemId,sistemStok){
  var inp=document.getElementById('inv-opn-f-'+itemId);
  var diff=document.getElementById('inv-opn-d-'+itemId);
  if(!inp||!diff) return;
  var fisik=parseInt(inp.value);
  if(isNaN(fisik)){diff.style.display='none';return;}
  var sel=fisik-sistemStok;
  diff.style.display='block';
  if(sel===0){diff.textContent='✓ Sesuai sistem';diff.style.color='var(--green)';}
  else if(sel>0){diff.textContent='↑ Lebih +'+sel+' dari sistem';diff.style.color='var(--c1)';}
  else{diff.textContent='↓ Kurang '+Math.abs(sel)+' dari sistem';diff.style.color='var(--red)';}
}
function invOpnameSave(){
  var ops=[];
  _invMatiData.forEach(function(m){
    var inp=document.getElementById('inv-opn-f-'+m.id);
    if(!inp||inp.value==='') return;
    var fisik=parseInt(inp.value); if(isNaN(fisik)) return;
    var old=m.stok||0; if(fisik===old) return;
    ops.push({itemId:m.id,delta:fisik-old,jenis:'koreksi',payload:{keterangan:'Stock Opname',tgl:new Date().toISOString().slice(0,10)}});
  });
  if(!ops.length){toast('Tidak ada perbedaan stok','info');return;}
  if(!confirm('Simpan opname?\n'+ops.length+' item akan dikoreksi.')) return;
  _matMutasiSequence(ops).then(function(results){
    var ok=results.filter(function(r){return r.ok;}).length;
    toast('Opname tersimpan: '+ok+' item','ok');
    invLoadMaster(function(){invOpnameLoad();invDashLoad();});
  }).catch(function(){toast('Sebagian data gagal','err');});
}

function invTraceSearch(q){
  var list=document.getElementById('inv-trace-list');
  if(!q||q.length<2){
    if(list) list.innerHTML='<div style="padding:40px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-qrcode" style="font-size:32px;display:block;margin-bottom:8px;opacity:.25"></i>Ketik minimal 2 karakter</div>';
    return;
  }
  if(list) list.innerHTML='<div class="inv-ld"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Mencari…</div>';
  var sb=(typeof getSB==='function')?getSB():null; if(!sb) return;
  Promise.all([
    sb.from('material_mutasi').select('*').ilike('sn_ont','%'+q+'%').order('created_at',{ascending:false}).limit(20),
    sb.from('material_mutasi').select('*').ilike('pel_cid','%'+q+'%').order('created_at',{ascending:false}).limit(10),
    sb.from('material_mutasi').select('*').ilike('teknisi','%'+q+'%').order('created_at',{ascending:false}).limit(10),
    sb.from('pelanggan').select('id,cid,nama,alamat,sn_ont,ont_item_id,kabel_item_id,teknisi_pasang,status,tgl_pasang')
      .or('cid.ilike.%'+q+'%,sn_ont.ilike.%'+q+'%,nama.ilike.%'+q+'%').limit(5)
  ]).then(function(r){
    var all=[]; var seen={};
    [r[0],r[1],r[2]].forEach(function(res){
      if(!res.error&&res.data) res.data.forEach(function(row){
        var item=_invMatiData.find(function(m){return m.id===row.item_id;});
        if(item&&item.kategori!=='ONT') return;
        if(!seen[row.id]){seen[row.id]=true;all.push(row);}
      });
    });
    all.sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);});
    var pelResults=(!r[3].error&&r[3].data)?r[3].data:[];
    var html='';
    pelResults.forEach(function(p){
      var item=_invMatiData.find(function(m){return m.id===p.ont_item_id;});
      var kabelItem=_invMatiData.find(function(m){return m.id===p.kabel_item_id;});
      var cSt=p.status==='aktif'?'var(--green)':p.status==='maintenance'?'var(--yellow)':'var(--red)';
      html+='<div class="imc" style="border-color:rgba(26,86,219,.25);margin-bottom:10px">' +
        '<div style="padding:11px 14px;background:rgba(26,86,219,.06);border-bottom:1px solid var(--border)">' +
          '<div style="display:flex;align-items:center;justify-content:space-between">' +
            '<div style="font-size:13px;font-weight:800;color:var(--text)"><i class="ti ti-user" style="color:var(--c1);margin-right:4px"></i>' + _esc3(p.nama||'—') + '</div>' +
            '<span style="font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px;background:' + cSt + '18;color:' + cSt + '">' + _esc3(p.status||'—') + '</span>' +
          '</div>' +
          '<div style="font-size:10px;color:var(--c1);margin-top:1px;opacity:.8">CID: ' + _esc3(p.cid||'—') + '</div>' +
        '</div>' +
        '<div style="padding:10px 14px;display:flex;flex-direction:column;gap:7px">' +
          '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg3);border-radius:9px">' +
            '<i class="ti ti-wifi" style="font-size:18px;color:var(--c1);flex-shrink:0"></i>' +
            '<div><div style="font-size:11px;font-weight:800;color:var(--text)">' + _esc3(item?item.nama:'ONT tidak diketahui') + '</div>' +
              (p.sn_ont?'<div style="font-size:10px;font-family:monospace;font-weight:700;color:var(--c1)">SN: ' + _esc3(p.sn_ont) + '</div>':'<div style="font-size:9px;color:var(--red)">⚠ SN belum tercatat</div>') +
            '</div>' +
          '</div>' +
          (kabelItem?'<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg3);border-radius:9px"><i class="ti ti-line-dashed" style="font-size:18px;color:var(--text3);flex-shrink:0"></i><div><div style="font-size:11px;font-weight:800;color:var(--text)">' + _esc3(kabelItem.nama) + '</div><div style="font-size:9px;color:var(--text3)">Kabel Precon</div></div></div>':'') +
          (p.teknisi_pasang?'<div style="font-size:10px;color:var(--text3)"><i class="ti ti-user-check" style="margin-right:3px"></i>Pasang: <b style="color:var(--text)">' + _esc3(p.teknisi_pasang) + '</b></div>':'') +
          (p.tgl_pasang?'<div style="font-size:10px;color:var(--text3)"><i class="ti ti-calendar" style="margin-right:3px"></i>Tanggal: <b>' + _esc3(p.tgl_pasang) + '</b></div>':'') +
          (p.alamat?'<div style="font-size:10px;color:var(--text3)"><i class="ti ti-map-pin" style="margin-right:3px"></i>' + _esc3(p.alamat) + '</div>':'') +
        '</div>' +
      '</div>';
    });
    if(all.length){
      html+='<div style="font-size:10px;font-weight:800;color:var(--text3);margin:8px 0 5px;letter-spacing:.5px;text-transform:uppercase">Riwayat Mutasi ONT</div>';
      html+='<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);overflow:hidden">'+
        all.map(function(m){return (m.sn_ont?'<div style="padding:5px 12px;background:var(--c1b);font-size:9px;font-family:monospace;font-weight:800;color:var(--c1);border-bottom:1px solid var(--border)">SN: '+_esc3(m.sn_ont)+'</div>':'')+_invMutRow(m);}).join('')+'</div>';
    }
    if(!html) html='<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-search-off" style="font-size:26px;display:block;margin-bottom:8px;opacity:.4"></i>Tidak ditemukan</div>';
    list.innerHTML=html;
  }).catch(function(){if(list) list.innerHTML='<div class="inv-ld" style="color:var(--red)">Error pencarian</div>';});
}

function _invRefreshAfterSync(){
  if(_invTabCur==='dashboard') invDashLoad();
  if(_invTabCur==='master')    invMasterRender();
  if(_invTabCur==='mutasi')    { _invMutOffset=0; invMutasiLoad(); }
  _invFillAllDropdowns();
}
function invMatiLoad(){ invLoadMaster(function(){ invDashLoad(); }); }
function invUpdateDashboard(){ invDashLoad(); }
function invMutLoad(){ invMutasiLoad(); }
function invStokRender(){} function invMatiRender(){ invMasterRender(); } function invMutRender(){}
function _invFillItemDropdowns(){ _invFillAllDropdowns(); }
function _invFillPelFormDropdowns(){ if(!_invMatiData.length){ invLoadMaster(function(){ _invFillAllDropdowns(); }); } else { _invFillAllDropdowns(); } }
function _invMutItemName(id){ return _invItemNama(id); }
function _invStokStatus(stok,min){ var s=stok||0,m=min||0; return s<=0?'habis':(m>0&&s<=m?'rendah':'aman'); }
var _invMatiLoaded=false; var _invMutLoaded=false;
var _inv2MatiData=_invMatiData;
function invMasterSearchD(q){ invMasterFilter(q); }
function invStokMasukForm(id){ invStokMasukOpen(id); }
function inv2LoadMaster(cb){ invLoadMaster(cb); }
function inv2DashLoad(){ invDashLoad(); }
function invMutasi2Load(){ invMutasiLoad(); }
function inv2MasterLoad(){ invMasterRender(); }
function inv2MasterRender(d){ invMasterRender(d); }
function inv2PengirimanLoad(){ invKirimLoad(); }
function inv2OpnameLoad(){ invOpnameLoad(); }
function invOpname2Save(){ invOpnameSave(); }
function invOpname2Load(){ invOpnameLoad(); }
function invTrace2Search(q){ invTraceSearch(q); }
function invTab2(tab){ invNavSub(tab); }
var _inv2MutOffset=0; var _inv2TabCur='dashboard';

(function _pelOpenFormHook(){
  var _prevOpen = typeof pelOpenForm === 'function' ? pelOpenForm : null;
  if(typeof window !== 'undefined'){
    var _origPelOpenForm = pelOpenForm;
    pelOpenForm = function(data){
      _origPelOpenForm(data);
      var isEdit = !!data;
      function _fillMatEditValues(){
        if(!isEdit) return;
        var selOnt=document.getElementById('pelf-ont-model'); if(selOnt&&data.ont_item_id) selOnt.value=data.ont_item_id;
        var selKabel=document.getElementById('pelf-kabel-precon'); if(selKabel&&data.kabel_item_id) selKabel.value=data.kabel_item_id;
        var snEl=document.getElementById('pelf-sn-ont'); if(snEl){snEl.value=data.sn_ont||'';snEl.classList.remove('err');}
        var macEl=document.getElementById('pelf-mac-ont'); if(macEl) macEl.value=data.mac_ont||'';
        var panjEl=document.getElementById('pelf-panjang-kabel'); if(panjEl) panjEl.value=data.panjang_kabel||'';
        var snHint=document.getElementById('pelf-sn-hint'); if(snHint){snHint.textContent=data.sn_ont?'SN terdaftar pada pelanggan ini':'Wajib unik — 1 SN hanya untuk 1 pelanggan';snHint.style.color='';}
      }
      if(!_invMatiLoaded){ invMatiLoad(); var _w=setInterval(function(){if(_invMatiLoaded){clearInterval(_w);_fillMatEditValues();}},150); }
      else { _invFillPelFormDropdowns(); _fillMatEditValues(); }
      _pelSetupTeknisiField(data||null);
    };
  }
})();

function _pelSetupTeknisiField(data){
  var roEl=document.getElementById('pelf-teknisi-ro');
  var roVal=document.getElementById('pelf-teknisi-ro-val');
  var selEl=document.getElementById('pelf-teknisi-sel');
  var hidEl=document.getElementById('pelf-teknisi-pasang');
  if(!roEl||!selEl||!hidEl) return;
  if(window.CR==='teknisi'){
    roEl.style.display='flex'; selEl.style.display='none';
    var nm=(window.CU&&(CU.nama||CU.username))||'Saya';
    if(roVal) roVal.textContent=nm;
    hidEl.value=nm;
  } else {


    roEl.style.display  = 'none';
    selEl.style.display = 'block';
    var currentVal = (data && data.teknisi_pasang) || '';
    hidEl.value = currentVal;
    _ensureTeknisiLoaded(function(){
      selEl.innerHTML = _buildTeknisiOpts(currentVal);
      selEl.onchange = function(){ hidEl.value = this.value; };
      if(currentVal) selEl.value = currentVal;
    });
  }
}

function pelSave(){
  var id       = document.getElementById('pelf-id').value;
  var cid      = document.getElementById('pelf-cid').value.trim();
  var nama     = document.getElementById('pelf-nama').value.trim();
  var hp       = document.getElementById('pelf-hp').value.trim();
  var nik      = document.getElementById('pelf-nik').value.trim();
  var alamat   = document.getElementById('pelf-alamat').value.trim();
  var areaId   = document.getElementById('pelf-area').value;
  var odpId    = document.getElementById('pelf-odp').value;
  var nomorPort= parseInt(document.getElementById('pelf-port').value)||null;
  var paket    = document.getElementById('pelf-paket').value;
  var jenisPel = document.getElementById('pelf-jenis').value||'Reguler';
  var tipeRecurring = document.getElementById('pelf-tipe-recurring').value||'existing';
  var tglPasang= document.getElementById('pelf-tgl-pasang').value;
  var status   = document.getElementById('pelf-status').value;
  var lat      = parseFloat(document.getElementById('pelf-lat').value)||null;
  var lng      = parseFloat(document.getElementById('pelf-lng').value)||null;
  var ket        = document.getElementById('pelf-ket').value.trim();
  var kecamatan  = document.getElementById('pelf-kecamatan').value.trim();
  var kelurahan  = document.getElementById('pelf-kelurahan').value.trim();
  var rw         = document.getElementById('pelf-rw').value.trim();
  var rt         = document.getElementById('pelf-rt').value.trim();

  var ok = true;
  var chk = function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('pelf-cid', cid);
  chk('pelf-nama', nama);
  chk('pelf-hp', hp);
  chk('pelf-nik', nik);
  chk('pelf-alamat', alamat);
  chk('pelf-area', areaId);
  chk('pelf-paket', paket);
  chk('pelf-kecamatan', kecamatan);
  chk('pelf-kelurahan', kelurahan);

  var rwFmt = rw.replace(/[^0-9]/g,'').padStart(3,'0').slice(0,3);
  var rtFmt = rt.replace(/[^0-9]/g,'').padStart(3,'0').slice(0,3);
  if(!rw){ var eRw=document.getElementById('pelf-rw'); if(eRw){ eRw.classList.add('err'); ok=false; } }
  else { document.getElementById('pelf-rw').value = rwFmt; document.getElementById('pelf-rw').classList.remove('err'); rw = rwFmt; }
  if(!rt){ var eRt=document.getElementById('pelf-rt'); if(eRt){ eRt.classList.add('err'); ok=false; } }
  else { document.getElementById('pelf-rt').value = rtFmt; document.getElementById('pelf-rt').classList.remove('err'); rt = rtFmt; }
  if(!ok){ toast('Isi semua field wajib termasuk NIK, Kecamatan, Kelurahan, RW, dan RT','err'); return; }


  var dupHp = _getPelData().find(function(p){ return p.hp===hp && p.id!==id; });
  if(dupHp){ toast('No. HP sudah terdaftar pada pelanggan lain','err'); document.getElementById('pelf-hp').classList.add('err'); return; }

  var sb = getSB();
  if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn = document.getElementById('pelf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }


  var _areaObj = (_areaData||[]).find(function(a){ return a.id===areaId; });
  var areaCoverageName = _areaObj ? _areaObj.nama : '';

  var payload = {
    cid: cid,
    nama: nama,
    hp: hp,
    nik: nik||null,
    alamat: alamat,
    area_id: areaId,
    area_coverage: areaCoverageName||null,
    kecamatan: kecamatan||null,
    kelurahan: kelurahan||null,
    rw: rw||null,
    rt: rt||null,
    odp_id: odpId||null,
    nomor_port: nomorPort,
    paket: paket,
    jenis_pelanggan: jenisPel,
    tipe_recurring: tipeRecurring,
    tgl_pasang: tglPasang||null,
    status: status,
    lat: lat,
    lng: lng,
    keterangan: ket||null
  };

  var p = id ? sb.from('pelanggan').update(payload).eq('id',id)
             : sb.from('pelanggan').insert([payload]).select();

  p.then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }

    var FREE_TYPES_OTF=['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
    if(FREE_TYPES_OTF.indexOf(jenisPel)===(-1)){
      var newPelId = id || ((r.data && r.data[0] && r.data[0].id) || null);
      if(newPelId){
        var genOtf = function(){
          sb.from('fee_otf').insert([{
            tgl: tglPasang || new Date().toISOString().slice(0,10),
            pel_id: newPelId,
            area: areaCoverageName || null,
            nominal: 35000,
            status: 'menunggu_validasi'
          }]).then(function(){
            _otfLoaded=false;
            _otfSinkronDone=false;
          }).catch(function(){});
        };
        if(!id){
          genOtf();
        } else {

          sb.from('fee_otf').select('id').eq('pel_id',newPelId).limit(1).then(function(rf){
            if(!rf.error && (!rf.data || !rf.data.length)) genOtf();
          }).catch(function(){});
        }
      }
    }


    if(FREE_TYPES_OTF.indexOf(jenisPel)===(-1)){
      var newPelIdRec = id || ((r.data && r.data[0] && r.data[0].id) || null);
      if(newPelIdRec){
        var periodeNowRec = new Date().toISOString().slice(0,7);
        var genRec = function(){
          var _doInsertRec = function(nominal){
            sb.from('fee_recurring').insert([{
              periode: periodeNowRec,
              pel_id: newPelIdRec,
              nominal: nominal||0,
              status: nominal>0 ? 'aktif' : 'draft'
            }]).then(function(){
              _recLoaded=false;
            }).catch(function(){});
          };

          var nomRec = (tipeRecurring==='expand') ? 0 : 10000;
          _doInsertRec(nomRec);
        };
        if(!id){
          genRec();
        } else {

          sb.from('fee_recurring').select('id').eq('pel_id',newPelIdRec).eq('periode',periodeNowRec).limit(1).then(function(rf){
            if(!rf.error && (!rf.data || !rf.data.length)) genRec();
          }).catch(function(){});
        }
      }
    }
    toast(id ? 'Data pelanggan diperbarui' : 'Pelanggan ditambahkan','ok');

    if(typeof window._auditLog==='function'){
      var _auditNewData = Object.assign({}, payload);
      if(window._pelAuditMatPatch){
        Object.keys(window._pelAuditMatPatch).forEach(function(k){ _auditNewData[k]=window._pelAuditMatPatch[k]; });
      }
      /* PENTING: ref_id di tabel activity_log bertipe UUID — HARUS pakai
         `id` (UUID baris pelanggan), BUKAN `cid` (kode teks seperti
         "JJC-00184"). Kalau pakai cid, insert ke activity_log akan GAGAL
         setiap saat (invalid input syntax for type uuid) dan gagalnya
         tidak kelihatan karena ditangkap .catch kosong. */
      window._auditLog('pelanggan', id?'update':'create', id, window._pelAuditOldSnap||null, _auditNewData);
    }
    window._pelAuditOldSnap = null;
    window._pelAuditMatPatch = null;

    if(window.SOT) SOT.invalidate('general');
    pelCloseForm();
    _pelLoaded = false;
    pelLoad();

    _fdbWilayahCache = null;
    if(_fdbLoaded){ setTimeout(function(){ fdbInitFilters(); fdbLoad(); }, 200); }

    _otfLoaded = false; _otfLoading = false;
    if(_finTabCur==='validasi' || _finTabCur==='otf'){
      setTimeout(function(){ _finEnsure(true,false,function(){ otfUpdateStats(); otfRender(); valRender(); }); }, 800);
    }
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

(function _pelSaveHook(){
  var _origSave = pelSave;
  pelSave = function(){

    var ontItemId    = (document.getElementById('pelf-ont-model')||{}).value||'';
    var snOnt        = ((document.getElementById('pelf-sn-ont')||{}).value||'').trim().toUpperCase();
    var macOnt       = ((document.getElementById('pelf-mac-ont')||{}).value||'').trim();
    var kabelItemId  = (document.getElementById('pelf-kabel-precon')||{}).value||'';
    var panjangKabel = parseInt((document.getElementById('pelf-panjang-kabel')||{}).value)||0;
    var teknisiPasang= ((document.getElementById('pelf-teknisi-pasang')||{}).value||'').trim();
    var editId       = (document.getElementById('pelf-id')||{}).value||'';
    var isNew        = !editId;


    if(isNew){
      var ok=true;
      if(!ontItemId){ var e=document.getElementById('pelf-ont-model'); if(e) e.classList.add('err'); ok=false; }
      if(!snOnt){ var e2=document.getElementById('pelf-sn-ont'); if(e2) e2.classList.add('err'); ok=false; }
      if(!kabelItemId){ var e3=document.getElementById('pelf-kabel-precon'); if(e3) e3.classList.add('err'); ok=false; }
      if(!panjangKabel){ var e4=document.getElementById('pelf-panjang-kabel'); if(e4) e4.classList.add('err'); ok=false; }
      if(!teknisiPasang){

        var selTk=document.getElementById('pelf-teknisi-sel');
        var roTk=document.getElementById('pelf-teknisi-ro');
        if(selTk && selTk.style.display!=='none') selTk.classList.add('err');
        else if(roTk && roTk.style.display!=='none') roTk.style.border='1.5px solid var(--red)';
        ok=false;
      }
      if(!ok){ toast('Isi semua field material instalasi','err'); return; }

      var snHintEl=document.getElementById('pelf-sn-hint');
      if(snHintEl && snHintEl.style.color==='var(--red)'){ toast('SN ONT sudah terdaftar pada pelanggan lain','err'); return; }
    }


    if(isNew && ontItemId){
      var ontItem=_invMatiData.find(function(x){ return x.id===ontItemId; });
      if(ontItem && (ontItem.stok||0)<1){ toast('Stok ONT habis — tidak dapat melanjutkan instalasi','err'); return; }
    }

    if(isNew && kabelItemId && panjangKabel){
      var preconItem=_invMatiData.find(function(x){ return x.id===kabelItemId; });
      var qtyPrecon=1;
      if(preconItem && (preconItem.stok||0)<qtyPrecon){ toast('Stok Kabel Precon habis','err'); return; }
    }


    if(isNew){
      var _sb=getSB(); if(!_sb){ toast('Database tidak terhubung','err'); return; }

      _sb.from('pelanggan').select('id').eq('sn_ont',snOnt).limit(1)
        .then(function(r){
          if(r.data && r.data.length){ toast('SN ONT sudah terdaftar pada pelanggan lain','err'); return; }

          _invPelSaveWithMaterial(ontItemId, snOnt, macOnt, kabelItemId, panjangKabel, teknisiPasang, _origSave);
        }).catch(function(){ _invPelSaveWithMaterial(ontItemId, snOnt, macOnt, kabelItemId, panjangKabel, teknisiPasang, _origSave); });
    } else {

      var editSb=getSB();
      if(editSb && editId){
        var matPatch={};
        if(snOnt)         matPatch.sn_ont          = snOnt;
        if(macOnt)        matPatch.mac_ont          = macOnt;
        if(ontItemId)     matPatch.ont_item_id      = ontItemId;
        if(panjangKabel)  matPatch.panjang_kabel    = panjangKabel;
        if(kabelItemId)   matPatch.kabel_item_id    = kabelItemId;
        if(teknisiPasang) matPatch.teknisi_pasang   = teknisiPasang;

        var ontItemEdit=_invMatiData.find(function(x){ return x.id===ontItemId; });
        if(ontItemEdit) matPatch.ont_model = ontItemEdit.nama+(ontItemEdit.merk?' ('+ontItemEdit.merk+')':'');
        window._pelAuditMatPatch = Object.keys(matPatch).length ? matPatch : null;
        if(Object.keys(matPatch).length){
          editSb.from('pelanggan').update(matPatch).eq('id',editId)
            .then(function(){}).catch(function(){});
        }
      }
      _origSave();
    }
  };
})();

function _invPelSaveWithMaterial(ontItemId, snOnt, macOnt, kabelItemId, panjangKabel, teknisiPasang, origSave){


  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('pelf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }


  var cid      =(document.getElementById('pelf-cid')||{}).value||'';
  var nama     =(document.getElementById('pelf-nama')||{}).value||'';
  var hp       =(document.getElementById('pelf-hp')||{}).value||'';
  var nik      =(document.getElementById('pelf-nik')||{}).value||'';
  var alamat   =(document.getElementById('pelf-alamat')||{}).value||'';
  var areaId   =(document.getElementById('pelf-area')||{}).value||'';
  var odpId    =(document.getElementById('pelf-odp')||{}).value||'';
  var nomorPort=parseInt((document.getElementById('pelf-port')||{}).value)||null;
  var paket    =(document.getElementById('pelf-paket')||{}).value||'';
  var jenisPel =(document.getElementById('pelf-jenis')||{}).value||'Reguler';
  var tglPasang=(document.getElementById('pelf-tgl-pasang')||{}).value||null;
  var status   = 'aktif';
  var lat      =parseFloat((document.getElementById('pelf-lat')||{}).value)||null;
  var lng      =parseFloat((document.getElementById('pelf-lng')||{}).value)||null;
  var ket      =(document.getElementById('pelf-ket')||{}).value||'';
  var kecamatan=(document.getElementById('pelf-kecamatan')||{}).value||'';
  var kelurahan=(document.getElementById('pelf-kelurahan')||{}).value||'';
  var rw       =(document.getElementById('pelf-rw')||{}).value||'';
  var rt       =(document.getElementById('pelf-rt')||{}).value||'';
  var _areaObj =(_areaData||[]).find(function(a){ return a.id===areaId; });
  var areaCoverageName=_areaObj?_areaObj.nama:'';


  var ontItem=_invMatiData.find(function(x){ return x.id===ontItemId; });
  var ontModelName=ontItem?(ontItem.nama+(ontItem.merk?' ('+ontItem.merk+')':'')):'';

  var payload={
    cid:cid, nama:nama, hp:hp, nik:nik||null, alamat:alamat,
    area_id:areaId, area_coverage:areaCoverageName||null,
    kecamatan:kecamatan||null, kelurahan:kelurahan||null, rw:rw||null, rt:rt||null,
    odp_id:odpId||null, nomor_port:nomorPort,
    paket:paket, jenis_pelanggan:jenisPel,
    tgl_pasang:tglPasang||null, status:status, lat:lat, lng:lng, keterangan:ket||null,

    sn_ont:snOnt||null, mac_ont:macOnt||null, ont_item_id:ontItemId||null, ont_model:ontModelName||null,
    kabel_item_id:kabelItemId||null, panjang_kabel:panjangKabel||null,
    teknisi_pasang:teknisiPasang||null
  };


  var _ok=cid&&nama&&hp&&alamat&&areaId&&paket;
  if(!_ok){ if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; } toast('Isi semua field wajib pelanggan','err'); return; }


  var dupHp=_getPelData().find(function(p){ return p.hp===hp; });
  if(dupHp){ if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; } toast('No. HP sudah terdaftar','err'); return; }


  var _matCols = ['sn_ont','mac_ont','ont_item_id','ont_model','kabel_item_id','panjang_kabel','teknisi_pasang'];


  function _isColMissing(err){
    var msg = (err && err.message)||'';
    return msg.indexOf('Could not find') !== -1 || msg.indexOf('column') !== -1 || msg.indexOf('does not exist') !== -1;
  }


  function _doStockAndFinish(newPelId, matPayload){
    var tgl=new Date().toISOString().slice(0,10);
    var matOps=[];
    if(ontItemId){
      matOps.push({ itemId:ontItemId, delta:-1, jenis:'instalasi', payload:{
        sn_ont:snOnt, pel_cid:cid, pel_id:newPelId, area_id:areaId, teknisi:teknisiPasang, tgl:tgl,
        keterangan:'Instalasi pelanggan '+cid
      }});
    }
    if(kabelItemId){
      matOps.push({ itemId:kabelItemId, delta:-1, jenis:'instalasi', payload:{
        pel_cid:cid, pel_id:newPelId, area_id:areaId, teknisi:teknisiPasang, tgl:tgl,
        keterangan:'Instalasi '+panjangKabel+'m kabel, pelanggan '+cid
      }});
    }
    var pelPatch = (newPelId && matPayload) ? sb.from('pelanggan').update(matPayload).eq('id',newPelId) : Promise.resolve();

    _matMutasiSequence(matOps).then(function(results){
      var gagal = results.find(function(r){ return !r.ok; });
      return pelPatch.then(function(){ return {gagal:gagal}; });
    }).then(function(res){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
      if(res.gagal){
        toast('Pelanggan tersimpan tapi stok gagal terpotong ('+(res.gagal.error||'')+') — cek manual','warn');
      } else {
        toast('Pelanggan ditambahkan & stok terpotong otomatis','ok');
      }

      if(newPelId && typeof window._auditLog==='function'){
        window._auditLog('pelanggan','create', newPelId, null, {
          cid:cid, nama:nama, hp:hp, nik:nik, alamat:alamat,
          area_coverage:areaCoverageName, kecamatan:kecamatan, kelurahan:kelurahan,
          rw:rw, rt:rt, nomor_port:nomorPort, paket:paket, jenis_pelanggan:jenisPel,
          tgl_pasang:tglPasang, status:status, keterangan:ket,
          sn_ont:snOnt, mac_ont:macOnt, ont_model:ontModelName,
          panjang_kabel:panjangKabel, teknisi_pasang:teknisiPasang
        });
      }
      window._pelAuditOldSnap = null;
      window._pelAuditMatPatch = null;

      pelCloseForm();
      _pelLoaded=false; _invMatiLoaded=false; _invMutLoaded=false;
      pelLoad();
      if(_invMatiLoaded===false) invMatiLoad();
    }).catch(function(){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
      toast('Pelanggan tersimpan tapi stok gagal terpotong — refresh & cek manual','warn');
      pelCloseForm(); _pelLoaded=false; pelLoad();
    });
  }


  sb.from('pelanggan').insert([payload]).select('id')
    .then(function(r){
      if(r.error){

        if(_isColMissing(r.error)){
          var payloadBase = {};
          for(var k in payload){
            if(payload.hasOwnProperty(k) && _matCols.indexOf(k) === -1){
              payloadBase[k] = payload[k];
            }
          }

          var matPayload = {};
          _matCols.forEach(function(k){ if(payload[k] != null) matPayload[k]=payload[k]; });

          sb.from('pelanggan').insert([payloadBase]).select('id')
            .then(function(r2){
              if(r2.error){
                if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
                toast('Gagal: '+(r2.error.message||'coba lagi'),'err'); return;
              }
              var newPelId=(r2.data&&r2.data[0])?r2.data[0].id:null;

              var patchOps=[];
              if(newPelId){

                ['sn_ont','ont_model','teknisi_pasang','panjang_kabel'].forEach(function(col){
                  if(matPayload[col]!=null){
                    var p={}; p[col]=matPayload[col];
                    patchOps.push(sb.from('pelanggan').update(p).eq('id',newPelId).then(function(){}).catch(function(){}));
                  }
                });
              }
              Promise.all(patchOps).then(function(){
                _doStockAndFinish(newPelId, null);
              });
            }).catch(function(e){
              if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
              toast('Error: '+(e.message||'coba lagi'),'err');
            });
        } else {
          if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
          toast('Gagal: '+(r.error.message||'coba lagi'),'err');
        }
        return;
      }
      var newPelId=(r.data&&r.data[0])?r.data[0].id:null;
      _doStockAndFinish(newPelId, null);
    }).catch(function(e){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
      toast('Error: '+(e.message||'coba lagi'),'err');
    });
}

function matSwitchTab(tab, btn){
  _matTabCur = tab;
  document.querySelectorAll('.mat-tab').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('.mat-subpane').forEach(function(p){ p.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  var pane = document.getElementById('mat-pane-'+tab);
  if(pane) pane.classList.add('on');
}

function _genMatiKode(){
  var n = (_matiData.length + 1).toString().padStart(3,'0');
  return 'MAT-'+n;
}

function _matiFillKatFilter(){
  var sel = document.getElementById('mati-fil-kat');
  if(!sel) return;
  var cur = sel.value;
  var kats = [];
  _matiData.forEach(function(m){ if(m.kategori && kats.indexOf(m.kategori)<0) kats.push(m.kategori); });
  kats.sort();
  sel.innerHTML = '<option value="">Semua Kategori</option>';
  kats.forEach(function(k){
    var opt = document.createElement('option');
    opt.value = k; opt.textContent = k;
    if(k===cur) opt.selected=true;
    sel.appendChild(opt);
  });
}

function _matiStokStatus(stok, minStok){
  var s = stok||0; var m = minStok||0;
  if(s<=0) return 'habis';
  if(m>0 && s<=m) return 'rendah';
  return 'aman';
}

function matiLoad(){
  var list = document.getElementById('mati-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb=getSB();
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }
  sb.from('material_items').select('*').order('kode')
    .then(function(r){
      if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+(r.error.message||'coba lagi')+'</p></div>'; return; }
      _matiData = r.data||[];
      _matiLoaded = true;
      _matiUpdateStats();
      _matiFillKatFilter();
      _matiFillItemDropdowns();
      matiRender();
    }).catch(function(e){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+(e.message||'coba lagi')+'</p></div>'; });
}

function _matiUpdateStats(){
  var total  = _matiData.length;
  var aktif  = _matiData.filter(function(m){ return m.status==='aktif'; }).length;
  var rendah = _matiData.filter(function(m){ return _matiStokStatus(m.stok,m.min_stok)==='rendah'; }).length;
  var habis  = _matiData.filter(function(m){ return _matiStokStatus(m.stok,m.min_stok)==='habis'; }).length;
  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=_fmt(v);};
  e('matst-total',total); e('matst-aktif',aktif); e('matst-rendah',rendah); e('matst-habis',habis);
}

function _matiFillItemDropdowns(){
  ['stokf-item','mutf-item','mut-fil-item'].forEach(function(selId){
    var sel=document.getElementById(selId); if(!sel) return;
    var cur=sel.value;
    var ph = selId==='mut-fil-item' ? '<option value="">Semua Item</option>' : '<option value="">— Pilih Item —</option>';
    sel.innerHTML = ph;
    _matiData.filter(function(m){ return m.status==='aktif'; }).forEach(function(m){
      var opt=document.createElement('option');
      opt.value=m.id; opt.textContent=m.kode+' · '+m.nama;
      if(m.id===cur) opt.selected=true;
      sel.appendChild(opt);
    });
  });
}

function matiSearch(q){ _matiPage=1; var clr=document.getElementById('mati-search-clr'); if(clr) clr.style.display=q?'block':'none'; matiRender(); }
function matiClearSearch(){ var inp=document.getElementById('mati-search'); if(inp) inp.value=''; var clr=document.getElementById('mati-search-clr'); if(clr) clr.style.display='none'; _matiPage=1; matiRender(); }

function matiRender(){
  var q    = (document.getElementById('mati-search')||{}).value||'';
  var fKat = (document.getElementById('mati-fil-kat')||{}).value||'';
  var fSt  = (document.getElementById('mati-fil-status')||{}).value||'';
  q = q.toLowerCase().trim();
  _matiFil = _matiData.filter(function(m){
    var matchQ  = !q || (m.nama||'').toLowerCase().includes(q) || (m.kode||'').toLowerCase().includes(q) || (m.kategori||'').toLowerCase().includes(q);
    var matchK  = !fKat || m.kategori===fKat;
    var matchSt = !fSt || _matiStokStatus(m.stok,m.min_stok)===fSt;
    return matchQ && matchK && matchSt;
  });
  var total=_matiFil.length; var pages=Math.max(1,Math.ceil(total/_matiPerPg));
  if(_matiPage>pages) _matiPage=pages;
  var start=(_matiPage-1)*_matiPerPg;
  var list=document.getElementById('mati-list'); if(!list) return;
  if(!total){ list.innerHTML='<div class="olt-empty"><i class="ti ti-package-off"></i><p>Tidak ada item ditemukan</p></div>'; document.getElementById('mati-pagi').style.display='none'; return; }
  list.innerHTML=_matiFil.slice(start,start+_matiPerPg).map(_matiRowHTML).join('');
  var pagi=document.getElementById('mati-pagi');
  if(pages>1){ pagi.style.display='flex'; var prev=document.getElementById('mati-prev'); var next=document.getElementById('mati-next'); var info=document.getElementById('mati-pagi-info'); if(prev) prev.disabled=_matiPage<=1; if(next) next.disabled=_matiPage>=pages; if(info) info.textContent=_matiPage+' / '+pages; }
  else pagi.style.display='none';
}

function _matiRowHTML(m){
  var st = _matiStokStatus(m.stok, m.min_stok);
  var stTag = st==='habis'?'tr':st==='rendah'?'ty':'tg';
  var stLbl = st==='habis'?'Habis':st==='rendah'?'Stok Rendah':'Stok Aman';
  var stok = m.stok||0; var min = m.min_stok||0;
  var pct = min>0 ? Math.min(100,Math.round(stok/Math.max(min*2,1)*100)) : (stok>0?100:0);
  var barCls = st==='habis'?'habis':st==='rendah'?'rendah':'aman';
  return '<div class="mati-row" onclick="matiOpenDet(\''+m.id+'\')">'+
    '<button class="mati-row-detail-btn" onclick="event.stopPropagation();matiOpenDet(\''+m.id+'\')"><i class="ti ti-chevron-right"></i></button>'+
    '<div class="mati-row-top">'+
      '<div class="mati-row-ico"><i class="ti ti-package"></i></div>'+
      '<div class="mati-row-info">'+
        '<div class="mati-row-name">'+_esc(m.nama||'—')+'</div>'+
        '<div class="mati-row-kode">'+_esc(m.kode||'—')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="mati-row-meta">'+
      '<span class="tag '+stTag+'">'+stLbl+'</span>'+
      '<span class="tag tgr">'+_esc(m.kategori||'—')+'</span>'+
      '<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;font-weight:800;color:var(--text)">'+_fmt(stok)+' '+_esc(m.satuan||'')+'</span>'+
      (m.harga_satuan?'<span class="tag tgr">Rp '+_fmt(m.harga_satuan)+'</span>':'')+
    '</div>'+
    '<div class="mati-stok-bar-wrap"><div class="mati-stok-bar '+barCls+'" style="width:'+pct+'%"></div></div>'+
  '</div>';
}

function matiPage(dir){ var pages=Math.max(1,Math.ceil(_matiFil.length/_matiPerPg)); _matiPage=Math.min(pages,Math.max(1,_matiPage+dir)); matiRender(); }

function matiOpenForm(data){
  var isEdit=!!data;
  document.getElementById('mati-form-title').textContent=isEdit?'Edit Item Material':'Tambah Item Material';
  document.getElementById('matif-id').value       = isEdit?(data.id||''):'';
  document.getElementById('matif-kode').value     = isEdit?(data.kode||''):_genMatiKode();
  document.getElementById('matif-nama').value     = isEdit?(data.nama||''):'';
  document.getElementById('matif-kategori').value = isEdit?(data.kategori||''):'';
  document.getElementById('matif-satuan').value   = isEdit?(data.satuan||'pcs'):'pcs';
  document.getElementById('matif-stok').value     = isEdit?(data.stok||0):0;
  document.getElementById('matif-min-stok').value = isEdit?(data.min_stok||0):5;
  document.getElementById('matif-harga').value    = isEdit?(data.harga_satuan||0):0;
  document.getElementById('matif-status').value   = isEdit?(data.status||'aktif'):'aktif';
  document.getElementById('matif-ket').value      = isEdit?(data.keterangan||''):'';
  ['matif-kode','matif-nama','matif-kategori'].forEach(function(id){ var e=document.getElementById(id); if(e) e.classList.remove('err'); });
  document.getElementById('mati-form-overlay').classList.add('on');
}
function matiCloseForm(){ document.getElementById('mati-form-overlay').classList.remove('on'); }

function matiSave(){
  var id      = document.getElementById('matif-id').value;
  var kode    = document.getElementById('matif-kode').value.trim().toUpperCase();
  var nama    = document.getElementById('matif-nama').value.trim();
  var kat     = document.getElementById('matif-kategori').value;
  var satuan  = document.getElementById('matif-satuan').value;
  var stok    = parseInt(document.getElementById('matif-stok').value)||0;
  var minStok = parseInt(document.getElementById('matif-min-stok').value)||0;
  var harga   = parseFloat(document.getElementById('matif-harga').value)||0;
  var status  = document.getElementById('matif-status').value;
  var ket     = document.getElementById('matif-ket').value.trim();

  var ok=true;
  var chk=function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('matif-kode',kode); chk('matif-nama',nama); chk('matif-kategori',kat);
  if(!ok){ toast('Isi semua field wajib','err'); return; }

  var dup=_matiData.find(function(m){ return m.kode===kode && m.id!==id; });
  if(dup){ toast('Kode item sudah digunakan','err'); document.getElementById('matif-kode').classList.add('err'); return; }

  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('matif-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var payload={kode:kode,nama:nama,kategori:kat,satuan:satuan,stok:stok,min_stok:minStok,harga_satuan:harga,status:status,keterangan:ket||null};
  var _MATI2_OPT = ['min_stok','harga_satuan','keterangan'];
  function _doMatiSave(pl){
    var p=id?sb.from('material_items').update(pl).eq('id',id):sb.from('material_items').insert([pl]);
    p.then(function(r){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
      if(r.error){
        var msg=r.error.message||'';
        var isColErr=msg.indexOf('Could not find')!==-1||msg.indexOf('column')!==-1||msg.indexOf('does not exist')!==-1;
        var hasOpt=_MATI2_OPT.some(function(k){ return pl.hasOwnProperty(k); });
        if(isColErr && hasOpt){
          var pl2={}; Object.keys(pl).forEach(function(k){ if(_MATI2_OPT.indexOf(k)===-1) pl2[k]=pl[k]; });
          toast('⚠ Kolom belum ada di DB, menyimpan data dasar…','info');
          _doMatiSave(pl2); return;
        }
        toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return;
      }
      toast(id?'Item diperbarui':'Item ditambahkan','ok');
      matiCloseForm(); _matiLoaded=false; _stokLoaded=false; matiLoad(); stokLoad();
    }).catch(function(e){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
      toast('Error: '+(e.message||'coba lagi'),'err');
    });
  }
  _doMatiSave(payload);
}

function matiOpenDet(id){
  var m=_matiData.find(function(x){ return x.id===id; }); if(!m) return;
  _matiDetId=id;
  document.getElementById('mati-det-title').textContent=m.nama||'Detail Item';
  var st=_matiStokStatus(m.stok,m.min_stok);
  var stTag=st==='habis'?'tr':st==='rendah'?'ty':'tg';
  var stLbl=st==='habis'?'Habis':st==='rendah'?'Stok Rendah':'Stok Aman';
  var created=m.created_at?new Date(m.created_at):null;
  var createdStr=created?(function(d){var p=function(n){return n<10?'0'+n:n;};return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear();})(created):'—';
  var dr = _drRow;
  var sec = _secRow;
  document.getElementById('mati-det-body').innerHTML=
    sec('package','Informasi Item')+
    dr('Kode','<span style="font-family:\'JetBrains Mono\',monospace;color:var(--c2);font-weight:700">'+_esc(m.kode||'—')+'</span>')+
    dr('Nama',_esc(m.nama||'—'))+
    dr('Kategori','<span class="tag tgr">'+_esc(m.kategori||'—')+'</span>')+
    dr('Satuan',_esc(m.satuan||'—'))+
    dr('Status',m.status==='aktif'?'<span class="tag tg">Aktif</span>':'<span class="tag tgr">Non-Aktif</span>')+
    sec('stack-2','Stok & Harga')+
    dr('Stok Saat Ini','<span style="font-family:\'JetBrains Mono\',monospace;font-size:16px;font-weight:800;color:var(--text)">'+_fmt(m.stok||0)+' '+_esc(m.satuan||'')+'</span> <span class="tag '+stTag+'">'+stLbl+'</span>')+
    dr('Stok Minimum',_fmt(m.min_stok||0)+' '+_esc(m.satuan||''))+
    dr('Harga Satuan','Rp '+_fmt(m.harga_satuan||0))+
    dr('Nilai Stok','Rp '+_fmt((m.stok||0)*(m.harga_satuan||0)))+
    sec('notes','Keterangan')+
    dr('Keterangan',_esc(m.keterangan||'—'))+
    dr('Dibuat',createdStr)+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
      '<button class="btn btn-ghost" style="flex:1" onclick="matiCloseDet();mutOpenForm(\''+m.id+'\')"><i class="ti ti-transfer"></i> Mutasi</button>'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="matiDelete(\''+m.id+'\')"><i class="ti ti-trash"></i> Hapus</button>'+
    '</div>';
  document.getElementById('mati-det-overlay').classList.add('on');
}
function matiCloseDet(){ document.getElementById('mati-det-overlay').classList.remove('on'); _matiDetId=null; }
function matiDetEdit(){
  var m=_matiData.find(function(x){ return x.id===_matiDetId; }); if(!m) return;
  matiCloseDet(); matiOpenForm(m);
}
function matiDelete(id){
  var m=_matiData.find(function(x){ return x.id===id; }); if(!m) return;
  if(!confirm('Hapus item "'+m.nama+'"?\nData tidak bisa dikembalikan.')) return;
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  sb.from('material_items').delete().eq('id',id)
    .then(function(r){
      if(r.error){ toast('Gagal hapus: '+(r.error.message||'coba lagi'),'err'); return; }
      toast('Item "'+m.nama+'" dihapus','ok');
      matiCloseDet(); _matiLoaded=false; _stokLoaded=false; matiLoad(); stokLoad();
    }).catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });
}

function stokLoad(){
  var list=document.getElementById('stok-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat stok…</p></div>';
  var sb=getSB();
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }
  var p1 = _matiData.length>0 ? Promise.resolve()
    : sb.from('material_items').select('*').order('kode').then(function(r){ if(!r.error){ _matiData=r.data||[]; _matiFillItemDropdowns(); } });
  p1.then(function(){
    _stokData = _matiData.slice();
    _stokLoaded = true;
    _stokUpdateSummary();
    stokRender();
  });
}

function _stokUpdateSummary(){
  var totalNilai = _stokData.reduce(function(acc,m){ return acc + (m.stok||0)*(m.harga_satuan||0); },0);
  var e=function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  e('stokst-nilai','Rp '+_fmt(totalNilai));
  e('stokst-masuk',_fmt(_stokData.length)+' Item');
}

function stokSearch(q){ _stokPage=1; var clr=document.getElementById('stok-search-clr'); if(clr) clr.style.display=q?'block':'none'; stokRender(); }
function stokClearSearch(){ var inp=document.getElementById('stok-search'); if(inp) inp.value=''; var clr=document.getElementById('stok-search-clr'); if(clr) clr.style.display='none'; _stokPage=1; stokRender(); }

function stokRender(){
  var q = (document.getElementById('stok-search')||{}).value||'';
  q = q.toLowerCase().trim();
  _stokFil = _stokData.filter(function(m){
    return !q || (m.nama||'').toLowerCase().includes(q) || (m.kode||'').toLowerCase().includes(q);
  });
  var total=_stokFil.length; var pages=Math.max(1,Math.ceil(total/_stokPerPg));
  if(_stokPage>pages) _stokPage=pages;
  var start=(_stokPage-1)*_stokPerPg;
  var list=document.getElementById('stok-list'); if(!list) return;
  if(!total){ list.innerHTML='<div class="olt-empty"><i class="ti ti-stack-x"></i><p>Tidak ada item</p></div>'; document.getElementById('stok-pagi').style.display='none'; return; }
  list.innerHTML=_stokFil.slice(start,start+_stokPerPg).map(_stokRowHTML).join('');
  var pagi=document.getElementById('stok-pagi');
  if(pages>1){ pagi.style.display='flex'; var prev=document.getElementById('stok-prev'); var next=document.getElementById('stok-next'); var info=document.getElementById('stok-pagi-info'); if(prev) prev.disabled=_stokPage<=1; if(next) next.disabled=_stokPage>=pages; if(info) info.textContent=_stokPage+' / '+pages; }
  else pagi.style.display='none';
}

function _stokRowHTML(m){
  var st=_matiStokStatus(m.stok,m.min_stok);
  var qCls=st==='habis'?'habis':st==='rendah'?'rendah':'';
  var stTag=st==='habis'?'tr':st==='rendah'?'ty':'tg';
  var stLbl=st==='habis'?'Habis':st==='rendah'?'Rendah':'Aman';
  return '<div class="stok-row">'+
    '<div class="stok-row-top">'+
      '<div class="stok-row-info">'+
        '<div class="stok-row-name">'+_esc(m.nama||'—')+'</div>'+
        '<div class="stok-row-kode">'+_esc(m.kode||'—')+' · '+_esc(m.kategori||'—')+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div class="stok-qty '+qCls+'">'+_fmt(m.stok||0)+' <span style="font-size:10px;font-weight:600;color:var(--text3)">'+_esc(m.satuan||'')+'</span></div>'+
        '<span class="tag '+stTag+'" style="margin-top:3px;display:inline-block">'+stLbl+'</span>'+
      '</div>'+
    '</div>'+
    (m.harga_satuan?'<div style="font-size:10px;color:var(--text3);margin-top:4px">Nilai: <strong style="color:var(--text)">Rp '+_fmt((m.stok||0)*(m.harga_satuan||0))+'</strong> · Rp '+_fmt(m.harga_satuan)+'/'+_esc(m.satuan||'')+'</div>':'')+
  '</div>';
}

function stokPage(dir){ var pages=Math.max(1,Math.ceil(_stokFil.length/_stokPerPg)); _stokPage=Math.min(pages,Math.max(1,_stokPage+dir)); stokRender(); }

function stokOpnForm(itemId){
  var sel=document.getElementById('stokf-item');
  var p1 = _matiData.length>0 ? Promise.resolve()
    : (function(){ var sb=getSB(); return sb ? sb.from('material_items').select('*').order('kode').then(function(r){ if(!r.error){ _matiData=r.data||[]; } }) : Promise.resolve(); })();
  p1.then(function(){
    _matiFillItemDropdowns();
    if(sel && itemId) sel.value=itemId;
    document.getElementById('stokf-qty').value='';
    document.getElementById('stokf-harga').value='';
    document.getElementById('stokf-ket').value='';
    ['stokf-item','stokf-qty','stokf-ket'].forEach(function(id){ var e=document.getElementById(id); if(e) e.classList.remove('err'); });
    document.getElementById('stok-form-overlay').classList.add('on');
  });
}
function stokClsForm(){ document.getElementById('stok-form-overlay').classList.remove('on'); }

function stokSave(){
  var itemId = document.getElementById('stokf-item').value;
  var qty    = parseInt(document.getElementById('stokf-qty').value);
  var harga  = parseFloat(document.getElementById('stokf-harga').value)||null;
  var ket    = document.getElementById('stokf-ket').value.trim();
  var ok=true;
  var chk=function(fid,v){ var e=document.getElementById(fid); if(!v&&v!==0){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('stokf-item',itemId); chk('stokf-qty',!isNaN(qty)); chk('stokf-ket',ket);
  if(!ok){ toast('Isi semua field wajib','err'); return; }
  var item=_matiData.find(function(x){ return x.id===itemId; });
  if(!item){ toast('Item tidak ditemukan','err'); return; }
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('stokf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }
  var oldQty=item.stok||0;

  var upd={stok:qty};
  if(harga!==null) upd.harga_satuan=harga;
  var p1=sb.from('material_items').update(upd).eq('id',itemId);
  var p2=sb.from('material_mutasi').insert([{
    item_id:itemId, jenis:'koreksi',
    jumlah:qty-oldQty, stok_sebelum:oldQty, stok_sesudah:qty,
    keterangan:ket, tgl:new Date().toISOString().slice(0,10)
  }]);
  Promise.all([p1,p2]).then(function(results){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan Koreksi'; }
    var err=results.find(function(r){ return r.error; });
    if(err){ toast('Gagal: '+(err.error.message||'coba lagi'),'err'); return; }
    toast('Koreksi stok berhasil ('+oldQty+' → '+qty+')','ok');
    stokClsForm(); _matiLoaded=false; _stokLoaded=false; _mutLoaded=false;
    matiLoad(); stokLoad(); mutLoad();
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan Koreksi'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

function mutLoad(){
  var list=document.getElementById('mut-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat mutasi…</p></div>';
  var sb=getSB();
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }
  var p1 = _matiData.length>0 ? Promise.resolve()
    : sb.from('material_items').select('*').order('kode').then(function(r){ if(!r.error){ _matiData=r.data||[]; _matiFillItemDropdowns(); } });
  p1.then(function(){
    return sb.from('material_mutasi').select('*').order('created_at',{ascending:false}).limit(200);
  }).then(function(r){
    if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+(r.error.message||'coba lagi')+'</p></div>'; return; }
    _mutData=r.data||[];
    _mutLoaded=true;
    _mutUpdateStats();
    _matiFillItemDropdowns();
    mutRender();
  }).catch(function(e){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+(e.message||'coba lagi')+'</p></div>'; });
}

function _mutUpdateStats(){
  var masuk   = _mutData.filter(function(m){ return m.jenis==='masuk'; }).length;
  var keluar  = _mutData.filter(function(m){ return m.jenis==='keluar'; }).length;
  var koreksi = _mutData.filter(function(m){ return m.jenis==='koreksi'; }).length;
  var e=function(id,v){ var el=document.getElementById(id); if(el) el.textContent=_fmt(v); };
  e('mutst-masuk',masuk); e('mutst-keluar',keluar); e('mutst-koreksi',koreksi); e('mutst-total',_mutData.length);
}

function _mutItemName(item_id){
  var m=_matiData.find(function(x){ return x.id===item_id; });
  return m ? (m.kode+' · '+m.nama) : '—';
}
function _mutItemSatuan(item_id){
  var m=_matiData.find(function(x){ return x.id===item_id; });
  return m ? (m.satuan||'') : '';
}

function mutSearch(q){ _mutPage=1; var clr=document.getElementById('mut-search-clr'); if(clr) clr.style.display=q?'block':'none'; mutRender(); }
function mutClearSearch(){ var inp=document.getElementById('mut-search'); if(inp) inp.value=''; var clr=document.getElementById('mut-search-clr'); if(clr) clr.style.display='none'; _mutPage=1; mutRender(); }

function mutRender(){
  var q    = (document.getElementById('mut-search')||{}).value||'';
  var fJ   = (document.getElementById('mut-fil-jenis')||{}).value||'';
  var fI   = (document.getElementById('mut-fil-item')||{}).value||'';
  q = q.toLowerCase().trim();
  _mutFil = _mutData.filter(function(m){
    var nm = _mutItemName(m.item_id);
    var matchQ = !q || nm.toLowerCase().includes(q) || (m.no_ref||'').toLowerCase().includes(q) || (m.keterangan||'').toLowerCase().includes(q);
    var matchJ = !fJ || m.jenis===fJ;
    var matchI = !fI || m.item_id===fI;
    return matchQ && matchJ && matchI;
  });
  var total=_mutFil.length; var pages=Math.max(1,Math.ceil(total/_mutPerPg));
  if(_mutPage>pages) _mutPage=pages;
  var start=(_mutPage-1)*_mutPerPg;
  var list=document.getElementById('mut-list'); if(!list) return;
  if(!total){ list.innerHTML='<div class="olt-empty"><i class="ti ti-transfer-off"></i><p>Tidak ada mutasi ditemukan</p></div>'; document.getElementById('mut-pagi').style.display='none'; return; }
  list.innerHTML=_mutFil.slice(start,start+_mutPerPg).map(_mutRowHTML).join('');
  var pagi=document.getElementById('mut-pagi');
  if(pages>1){ pagi.style.display='flex'; var prev=document.getElementById('mut-prev'); var next=document.getElementById('mut-next'); var info=document.getElementById('mut-pagi-info'); if(prev) prev.disabled=_mutPage<=1; if(next) next.disabled=_mutPage>=pages; if(info) info.textContent=_mutPage+' / '+pages; }
  else pagi.style.display='none';
}

function _mutRowHTML(m){
  var jMap={masuk:'Masuk',keluar:'Keluar',koreksi:'Koreksi'};
  var icMap={masuk:'ti-arrow-down-circle',keluar:'ti-arrow-up-circle',koreksi:'ti-adjustments'};
  var qSign=m.jenis==='masuk'?'+':m.jenis==='keluar'?'-':'±';
  var date=m.tgl||m.created_at||(m.created_at?new Date(m.created_at).toISOString().slice(0,10):'');
  if(m.created_at && !m.tgl){ try{ date=new Date(m.created_at).toISOString().slice(0,10); }catch(e){} }
  return '<div class="mut-row">'+
    '<div class="mut-row-ico '+m.jenis+'"><i class="ti '+(icMap[m.jenis]||'ti-transfer')+'"></i></div>'+
    '<div class="mut-row-info">'+
      '<div class="mut-row-name">'+_esc(_mutItemName(m.item_id))+'</div>'+
      '<div class="mut-row-meta">'+_esc(jMap[m.jenis]||m.jenis)+(m.no_ref?' · '+_esc(m.no_ref):'')+' · '+_esc(date)+(m.keterangan?((['odp_maintenance','odc_maintenance','maintenance_ont','maintenance_kabel','reject_maintenance'].indexOf(m.jenis)>=0)?'</div><div class="mut-row-meta full">'+_esc(m.keterangan)+'</div>':' · '+_esc(m.keterangan)+'</div>'):'</div>')+
    '</div>'+
    '<div class="mut-row-qty '+m.jenis+'">'+qSign+_fmt(Math.abs(m.jumlah||0))+' <span style="font-size:9px;font-weight:600;color:var(--text3)">'+_esc(_mutItemSatuan(m.item_id))+'</span></div>'+
  '</div>';
}

function mutPage(dir){ var pages=Math.max(1,Math.ceil(_mutFil.length/_mutPerPg)); _mutPage=Math.min(pages,Math.max(1,_mutPage+dir)); mutRender(); }

function mutOpenForm(preItemId){
  var p1 = _matiData.length>0 ? Promise.resolve()
    : (function(){ var sb=getSB(); return sb ? sb.from('material_items').select('*').order('kode').then(function(r){ if(!r.error) _matiData=r.data||[]; }) : Promise.resolve(); })();
  p1.then(function(){
    _matiFillItemDropdowns();
    var sel=document.getElementById('mutf-item');
    if(sel && preItemId) sel.value=preItemId;
    document.getElementById('mutf-jenis').value='keluar';
    document.getElementById('mutf-qty').value='';
    document.getElementById('mutf-tgl').value=new Date().toISOString().slice(0,10);
    document.getElementById('mutf-ref').value='';
    document.getElementById('mutf-ket').value='';
    ['mutf-item','mutf-qty'].forEach(function(id){ var e=document.getElementById(id); if(e) e.classList.remove('err'); });
    document.getElementById('mut-form-overlay').classList.add('on');
  });
}
function mutCloseForm(){ document.getElementById('mut-form-overlay').classList.remove('on'); }

function mutSave(){
  var itemId = document.getElementById('mutf-item').value;
  var jenis  = document.getElementById('mutf-jenis').value;
  var qty    = parseInt(document.getElementById('mutf-qty').value)||0;
  var tgl    = document.getElementById('mutf-tgl').value;
  var ref    = document.getElementById('mutf-ref').value.trim();
  var ket    = document.getElementById('mutf-ket').value.trim();
  var ok=true;
  var chk=function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('mutf-item',itemId); chk('mutf-qty',qty>0);
  if(!ok){ toast('Isi semua field wajib','err'); return; }
  var item=_matiData.find(function(x){ return x.id===itemId; });
  if(!item){ toast('Item tidak ditemukan','err'); return; }
  if(jenis==='keluar' && (item.stok||0)<qty){ toast('Stok tidak cukup (ada: '+_fmt(item.stok||0)+' '+item.satuan+')','err'); return; }
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('mutf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var delta = (jenis==='masuk') ? qty : -qty;
  _matMutasi(itemId, delta, jenis, {
    tgl:tgl||new Date().toISOString().slice(0,10),
    no_ref:ref||null, keterangan:ket||null
  }).then(function(res){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    if(!res.ok){ toast('Gagal: '+(res.error||'coba lagi'),'err'); return; }
    toast('Mutasi '+jenis+' dicatat (stok: '+res.stokSebelum+' → '+res.stokSesudah+')','ok');
    mutCloseForm(); _matiLoaded=false; _stokLoaded=false; _mutLoaded=false;
    matiLoad(); stokLoad(); mutLoad();
    inv2LoadMaster(function(){ inv2DashLoad(); if(typeof _invFillAllDropdowns==='function') _invFillAllDropdowns(); });
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}
var _appData    = [];
var _appFil     = [];
var _appPage    = 1;
var _appPerPg   = 15;
var _appDetId   = null;
var _appLoaded  = false;
var _appPelList = [];
var _appOdpList = [];

_navDispatch.register('approval', function(){ if(typeof appLoad==='function') appLoad(); });

function _genAppNo(){
  var d = new Date();
  var yy = d.getFullYear().toString().slice(-2);
  var mm = ('0'+(d.getMonth()+1)).slice(-2);
  var n  = (_appData.length + 1).toString().padStart(4,'0');
  return 'APV-'+yy+mm+'-'+n;
}

function _appFillAreaFilter(){
  var sel = document.getElementById('app-fil-area');
  if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">Semua Area</option>';
  _areaData.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.id; opt.textContent = a.nama;
    if(a.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
}

function _appFillOdpDropdown(currentVal){
  var sel = document.getElementById('appf-odp'); if(!sel) return;
  var cur = currentVal || sel.value;
  sel.innerHTML = '<option value="">— Pilih ODP —</option>';
  _appOdpList.forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = (o.nama && o.nama !== o.kode) ? o.kode + ' · ' + o.nama : o.kode;
    if(o.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
}

function _appPelName(pel_id){
  var p = _appPelList.find(function(x){ return x.id === pel_id; });
  return p ? (p.nama||'—') : '—';
}
function _appPelCID(pel_id){
  var p = _appPelList.find(function(x){ return x.id === pel_id; });
  return p ? (p.cid||'—') : '—';
}
function _appPelArea(pel_id){
  var p = _appPelList.find(function(x){ return x.id === pel_id; });
  if(!p) return '';
  var a = _areaData.find(function(x){ return x.id === p.area_id; });
  return a ? a.id : '';
}
function _appPelAreaName(pel_id){
  var p = _appPelList.find(function(x){ return x.id === pel_id; });
  if(!p) return '—';
  var a = _areaData.find(function(x){ return x.id === p.area_id; });
  return a ? a.nama : '—';
}
function _appOdpName(odp_id){
  var o = _appOdpList.find(function(x){ return x.id === odp_id; });
  return o ? (o.kode+' · '+o.nama) : '—';
}

function appLoad(){
  var list = document.getElementById('app-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = getSB();
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  var p1 = _areaData.length > 0 ? Promise.resolve() : _ensureAreas(sb);
  var p2 = _appPelList.length > 0 ? Promise.resolve()
    : sb.from('pelanggan').select('id,cid,nama,area_id,status').order('nama').then(function(r){ if(!r.error) _appPelList = r.data||[]; });
  var p3 = _appOdpList.length > 0 ? Promise.resolve()
    : sb.from('odps').select('id,kode,nama,area_id').order('kode').then(function(r){ if(!r.error) _appOdpList = r.data||[]; });

  Promise.all([p1, p2, p3]).then(function(){
    _appFillAreaFilter();
    return sb.from('approval_isp').select('*').order('created_at',{ascending:false});
  }).then(function(r){
    if(r.error){
      if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+(r.error.message||'coba lagi')+'</p></div>';
      return;
    }
    _appData   = r.data||[];
    _appLoaded = true;
    _appUpdateStats();
    appRender();
  }).catch(function(e){
    if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+(e.message||'coba lagi')+'</p></div>';
  });
}

function _appUpdateStats(){
  var total    = _appData.length;
  var pending  = _appData.filter(function(a){ return a.status==='pending'; }).length;
  var approved = _appData.filter(function(a){ return a.status==='approved'; }).length;
  var rejected = _appData.filter(function(a){ return a.status==='rejected'; }).length;
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=_fmt(v); };
  e('appst-total',total); e('appst-pending',pending);
  e('appst-approved',approved); e('appst-rejected',rejected);
}

function appSearch(q){
  _appPage = 1;
  var clr = document.getElementById('app-search-clr');
  if(clr) clr.style.display = q ? 'block' : 'none';
  appRender();
}
function appClearSearch(){
  var inp = document.getElementById('app-search'); if(inp) inp.value='';
  var clr = document.getElementById('app-search-clr'); if(clr) clr.style.display='none';
  _appPage = 1; appRender();
}

function appRender(){
  var q    = (document.getElementById('app-search')||{}).value||'';
  var fSt  = (document.getElementById('app-fil-status')||{}).value||'';
  var fAr  = (document.getElementById('app-fil-area')||{}).value||'';
  q = q.toLowerCase().trim();

  _appFil = _appData.filter(function(a){
    var pelName = _appPelName(a.pel_id).toLowerCase();
    var pelCID  = _appPelCID(a.pel_id).toLowerCase();
    var pengaju = (a.pengaju||'').toLowerCase();
    var matchQ  = !q || pelName.includes(q) || pelCID.includes(q) ||
                  pengaju.includes(q) || (a.no_pengajuan||'').toLowerCase().includes(q);
    var matchSt = !fSt || a.status === fSt;
    var matchAr = !fAr || _appPelArea(a.pel_id) === fAr;
    return matchQ && matchSt && matchAr;
  });

  var total  = _appFil.length;
  var pages  = Math.max(1, Math.ceil(total / _appPerPg));
  if(_appPage > pages) _appPage = pages;
  var start  = (_appPage - 1) * _appPerPg;
  var slice  = _appFil.slice(start, start + _appPerPg);

  var list = document.getElementById('app-list'); if(!list) return;

  if(!total){
    list.innerHTML = '<div class="olt-empty"><i class="ti ti-checks"></i><p>Tidak ada pengajuan ditemukan</p><small>Klik tombol Ajukan untuk membuat pengajuan baru</small></div>';
    document.getElementById('app-pagi').style.display = 'none';
    return;
  }

  list.innerHTML = slice.map(_appRowHTML).join('');

  var pagi = document.getElementById('app-pagi');
  if(pages > 1){
    pagi.style.display = 'flex';
    var prev = document.getElementById('app-prev');
    var next = document.getElementById('app-next');
    var info = document.getElementById('app-pagi-info');
    if(prev) prev.disabled = _appPage<=1;
    if(next) next.disabled = _appPage>=pages;
    if(info) info.textContent = _appPage+' / '+pages;
  } else { pagi.style.display = 'none'; }
}

function _appRowHTML(a){
  var stMap = {pending:'pending',approved:'approved',rejected:'rejected',revision:'revision'};
  var stTag = {pending:'ty',approved:'tg',rejected:'tr',revision:'tc1'};
  var stLbl = {pending:'Pending',approved:'Disetujui',rejected:'Ditolak',revision:'Perlu Revisi'};
  var icMap = {pending:'ti-clock-hour-4',approved:'ti-circle-check',rejected:'ti-circle-x',revision:'ti-pencil'};
  var cls   = stMap[a.status]||'pending';
  var d     = a.created_at ? new Date(a.created_at) : null;
  var dStr  = d ? (function(dt){
    var p=function(n){return n<10?'0'+n:n;};
    return p(dt.getDate())+'/'+p(dt.getMonth()+1)+'/'+dt.getFullYear();
  })(d) : '—';

  return '<div class="app-row" onclick="appOpenDet(\''+a.id+'\')">'+
    '<button class="app-row-det-btn" onclick="event.stopPropagation();appOpenDet(\''+a.id+'\')"><i class="ti ti-chevron-right"></i></button>'+
    '<div class="app-row-top">'+
      '<div class="app-row-ico '+cls+'"><i class="ti '+(icMap[a.status]||'ti-checks')+'"></i></div>'+
      '<div class="app-row-info">'+
        '<div class="app-row-no">'+_esc(a.no_pengajuan||'—')+'</div>'+
        '<div class="app-row-name">'+_esc(_appPelName(a.pel_id))+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="app-row-meta">'+
      '<span class="tag '+(stTag[a.status]||'ty')+'">'+_esc(stLbl[a.status]||a.status)+'</span>'+
      '<span class="tag tpu" style="padding:3px 8px;border-radius:20px;font-size:9px;font-weight:700">'+_esc(_appPelCID(a.pel_id))+'</span>'+
      (a.paket?'<span class="tag tgr"><i class="ti ti-wifi" style="font-size:9px"></i> '+_esc(a.paket)+'</span>':'')+
      '<span class="tag tgr">'+_esc(_appPelAreaName(a.pel_id))+'</span>'+
      '<span class="tag tgr"><i class="ti ti-calendar" style="font-size:9px"></i> '+dStr+'</span>'+
    '</div>'+
  '</div>';
}

function appPage(dir){
  var pages = Math.max(1, Math.ceil(_appFil.length/_appPerPg));
  _appPage  = Math.min(pages, Math.max(1, _appPage+dir));
  appRender();
}

function appOpenForm(data){
  var isEdit = !!data;
  document.getElementById('app-form-title').textContent = isEdit ? 'Edit Pengajuan' : 'Ajukan Approval';
  document.getElementById('appf-id').value         = isEdit ? (data.id||'') : '';
  document.getElementById('appf-no').value         = isEdit ? (data.no_pengajuan||'') : _genAppNo();
  document.getElementById('appf-port').value       = isEdit ? (data.nomor_port||'') : '';
  document.getElementById('appf-tgl-pasang').value = isEdit ? (data.tgl_pasang||'') : new Date().toISOString().slice(0,10);
  document.getElementById('appf-pengaju').value    = isEdit ? (data.pengaju||'') : '';
  document.getElementById('appf-catatan').value    = isEdit ? (data.catatan_pengaju||'') : '';


  var sb = getSB();
  var p1 = _areaData.length > 0 ? Promise.resolve() : _ensureAreas(sb);
  var p2 = _appPelList.length > 0 ? Promise.resolve()
    : sb.from('pelanggan').select('id,cid,nama,area_id,status,paket').order('nama').then(function(r){ if(!r.error) _appPelList=r.data||[]; });
  var p3 = _appOdpList.length > 0 ? Promise.resolve()
    : sb.from('odps').select('id,kode,nama,area_id').order('kode').then(function(r){ if(!r.error) _appOdpList=r.data||[]; });

  Promise.all([p1,p2,p3]).then(function(){

    var selPel = document.getElementById('appf-pel');
    if(selPel){
      selPel.innerHTML = '<option value="">— Pilih Pelanggan —</option>';
      _appPelList.forEach(function(p){
        var opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = (p.cid||'—')+' · '+(p.nama||'—')+' ('+( p.status||'—')+')';
        if(isEdit && p.id === data.pel_id) opt.selected = true;
        selPel.appendChild(opt);
      });

      selPel.onchange = function(){
        var p = _appPelList.find(function(x){ return x.id===selPel.value; });
        if(p && p.paket){
          var selPaket = document.getElementById('appf-paket');
          if(selPaket) selPaket.value = p.paket;
        }
      };
    }
    _appFillOdpDropdown(isEdit ? data.odp_id : '');

    if(isEdit && data.paket){
      var sp = document.getElementById('appf-paket');
      if(sp) sp.value = data.paket;
    }
  });

  ['appf-pel','appf-odp','appf-port','appf-paket','appf-tgl-pasang','appf-pengaju'].forEach(function(id){
    var e = document.getElementById(id); if(e) e.classList.remove('err');
  });
  document.getElementById('app-form-overlay').classList.add('on');
}
function appCloseForm(){ document.getElementById('app-form-overlay').classList.remove('on'); }

function appSave(){
  var id        = document.getElementById('appf-id').value;
  var noApv     = document.getElementById('appf-no').value.trim();
  var pelId     = document.getElementById('appf-pel').value;
  var odpId     = document.getElementById('appf-odp').value;
  var nomorPort = parseInt(document.getElementById('appf-port').value)||0;
  var paket     = document.getElementById('appf-paket').value;
  var tglPasang = document.getElementById('appf-tgl-pasang').value;
  var pengaju   = document.getElementById('appf-pengaju').value.trim();
  var catatan   = document.getElementById('appf-catatan').value.trim();

  var ok = true;
  var chk = function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('appf-pel',pelId); chk('appf-odp',odpId); chk('appf-port',nomorPort>0);
  chk('appf-paket',paket); chk('appf-tgl-pasang',tglPasang); chk('appf-pengaju',pengaju);
  if(!ok){ toast('Isi semua field wajib','err'); return; }

  var sb = getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn = document.getElementById('appf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var now = new Date().toISOString();
  var histEntry = {
    action:'ajukan', by: pengaju,
    time: now, note: catatan||''
  };

  var payload = {
    no_pengajuan: noApv,
    pel_id: pelId,
    odp_id: odpId,
    nomor_port: nomorPort,
    paket: paket,
    tgl_pasang: tglPasang,
    pengaju: pengaju,
    catatan_pengaju: catatan||null,
    status: 'pending',
    history: JSON.stringify([histEntry])
  };

  var p = id
    ? sb.from('approval_isp').update(payload).eq('id',id)
    : sb.from('approval_isp').insert([payload]);

  p.then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-send"></i> Ajukan'; }
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    toast(id ? 'Pengajuan diperbarui' : 'Pengajuan berhasil dikirim','ok');
    appCloseForm(); _appLoaded=false; appLoad();
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-send"></i> Ajukan'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

function appOpenDet(id){
  var a = _appData.find(function(x){ return x.id===id; }); if(!a) return;
  _appDetId = id;
  document.getElementById('app-det-title').textContent = a.no_pengajuan||'Review Approval';

  var stTag={pending:'ty',approved:'tg',rejected:'tr',revision:'tc1'};
  var stLbl={pending:'Pending',approved:'Disetujui',rejected:'Ditolak',revision:'Perlu Revisi'};
  var created = a.created_at ? new Date(a.created_at) : null;
  var createdStr = created ? (function(d){
    var p=function(n){return n<10?'0'+n:n;};
    return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());
  })(created) : '—';

  var dr = _drRow;
  var sec = _secRow;


  var histArr = [];
  try{ histArr = JSON.parse(a.history||'[]'); }catch(e){}
  var tlHtml = '';
  if(histArr.length){
    var tlMap = {
      ajukan:  {cls:'ajukan',  icon:'ti-send',         label:'Diajukan'},
      approve: {cls:'approve', icon:'ti-circle-check',  label:'Disetujui'},
      reject:  {cls:'reject',  icon:'ti-circle-x',      label:'Ditolak'},
      revision:{cls:'revision',icon:'ti-pencil',         label:'Perlu Revisi'}
    };
    tlHtml = '<div class="app-timeline">';
    histArr.forEach(function(h){
      var m = tlMap[h.action]||{cls:'ajukan',icon:'ti-point',label:h.action};
      tlHtml += '<div class="app-tl-item">'+
        '<div class="app-tl-dot '+m.cls+'"><i class="ti '+m.icon+'"></i></div>'+
        '<div class="app-tl-info">'+
          '<div class="app-tl-action">'+m.label+'</div>'+
          '<div class="app-tl-by">Oleh: '+_esc(h.by||'—')+' · '+_esc((h.time||'').slice(0,16).replace('T',' '))+'</div>'+
          (h.note?'<div class="app-tl-note">'+_esc(h.note)+'</div>':'')+
        '</div>'+
      '</div>';
    });
    tlHtml += '</div>';
  }

  document.getElementById('app-det-body').innerHTML =
    sec('user','Pelanggan')+
    dr('Nama','<strong>'+_esc(_appPelName(a.pel_id))+'</strong>')+
    dr('CID','<span style="font-family:\'JetBrains Mono\',monospace;color:var(--pu)">'+_esc(_appPelCID(a.pel_id))+'</span>')+
    dr('Area',_esc(_appPelAreaName(a.pel_id)))+
    sec('wifi','Detail Layanan')+
    dr('Paket','<span class="tpu" style="padding:3px 10px;border-radius:20px">'+_esc(a.paket||'—')+'</span>')+
    dr('ODP',_esc(_appOdpName(a.odp_id)))+
    dr('No. Port',a.nomor_port?'Port '+a.nomor_port:'—')+
    dr('Tgl Pasang',a.tgl_pasang||'—')+
    sec('checks','Status Pengajuan')+
    dr('No. Pengajuan','<span style="font-family:\'JetBrains Mono\',monospace;color:var(--c1)">'+_esc(a.no_pengajuan||'—')+'</span>')+
    dr('Status','<span class="tag '+(stTag[a.status]||'ty')+'">'+_esc(stLbl[a.status]||a.status)+'</span>')+
    dr('Pengaju',_esc(a.pengaju||'—'))+
    dr('Catatan',_esc(a.catatan_pengaju||'—'))+
    (a.catatan_reviewer?dr('Catatan Reviewer','<span style="color:var(--red)">'+_esc(a.catatan_reviewer)+'</span>'):'')+
    dr('Dibuat',createdStr)+
    (tlHtml ? sec('list','Riwayat / Audit Trail')+tlHtml : '');


  var foot = document.getElementById('app-det-foot');
  if(a.status === 'pending' || a.status === 'revision'){
    foot.innerHTML =
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" '+
        'onclick="appOpenReject(\''+a.id+'\',\'rejected\')">'+
        '<i class="ti ti-x"></i> Tolak</button>'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--yg);color:var(--yellow);border-color:rgba(217,119,6,.2)" '+
        'onclick="appOpenReject(\''+a.id+'\',\'revision\')">'+
        '<i class="ti ti-pencil"></i> Revisi</button>'+
      '<button class="btn" style="flex:1;background:var(--green)" '+
        'onclick="appApprove(\''+a.id+'\')">'+
        '<i class="ti ti-check"></i> Setujui</button>';
  } else if(a.status === 'approved'){
    foot.innerHTML =
      '<button class="btn btn-ghost" style="flex:1" onclick="appCloseDet()">Tutup</button>'+
      '<div style="flex:1;text-align:center;font-size:11px;font-weight:700;color:var(--green);display:flex;align-items:center;justify-content:center;gap:5px">'+
        '<i class="ti ti-circle-check"></i> Sudah Disetujui</div>';
  } else {
    foot.innerHTML =
      '<button class="btn btn-ghost" style="flex:1" onclick="appCloseDet()">Tutup</button>'+
      '<button class="btn btn-ghost" style="flex:1" onclick="appCloseDet();appOpenForm(_appData.find(function(x){return x.id===\''+a.id+'\';}))">'+
        '<i class="ti ti-edit"></i> Edit</button>';
  }

  document.getElementById('app-det-overlay').classList.add('on');
}
function appCloseDet(){ document.getElementById('app-det-overlay').classList.remove('on'); _appDetId=null; }

function appApprove(id){
  var a = _appData.find(function(x){ return x.id===id; }); if(!a) return;
  var sb = getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }

  var reviewer = (CU && (CU.nama||CU.name||CU.username)) || 'Reviewer';
  var now      = new Date().toISOString();
  var hist     = [];
  try{ hist = JSON.parse(a.history||'[]'); }catch(e){}
  hist.push({action:'approve', by:reviewer, time:now, note:''});


  var p1 = sb.from('approval_isp').update({
    status:'approved',
    reviewer: reviewer,
    tgl_review: now,
    history: JSON.stringify(hist)
  }).eq('id',id);


  var p2 = sb.from('pelanggan').update({
    status: 'aktif',
    odp_id: a.odp_id,
    nomor_port: a.nomor_port,
    paket: a.paket,
    tgl_pasang: a.tgl_pasang
  }).eq('id', a.pel_id);


  var p3 = sb.from('odp_ports')
    .update({ status:'terpakai', cid_pelanggan: _appPelCID(a.pel_id), paket: a.paket, tgl_pasang: a.tgl_pasang })
    .eq('odp_id', a.odp_id)
    .eq('nomor_port', a.nomor_port);

  Promise.all([p1, p2, p3]).then(function(results){
    var err = results.find(function(r){ return r.error; });
    if(err){ toast('Gagal approve: '+(err.error.message||'coba lagi'),'err'); return; }
    toast('Pengajuan DISETUJUI · Pelanggan diaktivasi','ok');
    appCloseDet();
    _appLoaded  = false;
    _pelLoaded  = false;
    appLoad();
  }).catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });
}

function appOpenReject(id, action){
  document.getElementById('apprej-id').value     = id;
  document.getElementById('apprej-action').value = action;
  document.getElementById('apprej-alasan').value = '';
  document.getElementById('apprej-alasan').classList.remove('err');
  var isRej = action==='rejected';
  document.getElementById('app-reject-title').textContent = isRej ? 'Tolak Pengajuan' : 'Minta Revisi';
  var btn = document.getElementById('apprej-btn');
  if(btn){
    btn.style.background = isRej ? 'var(--red)' : 'var(--yellow)';
    btn.style.color      = '#fff';
    btn.innerHTML        = isRej
      ? '<i class="ti ti-x"></i> Tolak'
      : '<i class="ti ti-pencil"></i> Minta Revisi';
  }
  document.getElementById('app-reject-overlay').classList.add('on');
}
function appCloseReject(){ document.getElementById('app-reject-overlay').classList.remove('on'); }

function appDoReject(){
  var id      = document.getElementById('apprej-id').value;
  var action  = document.getElementById('apprej-action').value;
  var alasan  = document.getElementById('apprej-alasan').value.trim();
  if(!alasan){ document.getElementById('apprej-alasan').classList.add('err'); toast('Tuliskan alasan terlebih dahulu','err'); return; }

  var a  = _appData.find(function(x){ return x.id===id; }); if(!a) return;
  var sb = getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }

  var reviewer = (CU && (CU.nama||CU.name||CU.username)) || 'Reviewer';
  var now      = new Date().toISOString();
  var hist     = [];
  try{ hist = JSON.parse(a.history||'[]'); }catch(e){}
  hist.push({action:action, by:reviewer, time:now, note:alasan});

  var btn = document.getElementById('apprej-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  sb.from('approval_isp').update({
    status: action,
    reviewer: reviewer,
    catatan_reviewer: alasan,
    tgl_review: now,
    history: JSON.stringify(hist)
  }).eq('id',id)
    .then(function(r){
      if(btn){ btn.disabled=false; btn.innerHTML = action==='rejected'?'<i class="ti ti-x"></i> Tolak':'<i class="ti ti-pencil"></i> Minta Revisi'; }
      if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
      toast(action==='rejected' ? 'Pengajuan DITOLAK' : 'Pengajuan diminta REVISI','ok');
      appCloseReject(); appCloseDet();
      _appLoaded=false; appLoad();
    }).catch(function(e){
      if(btn){ btn.disabled=false; }
      toast('Error: '+(e.message||'coba lagi'),'err');
    });
}
var _pelData   = [];

function _getPelData(){
  if(_pelData && _pelData.length) return _pelData;

  /* PENTING: kalau ada filter aktif (termasuk rentang tanggal aktif),
     array _pelData kosong berarti MEMANG TIDAK ADA yang cocok dengan
     filter — bukan tanda "belum termuat". Jangan fallback ke seluruh
     cache SOT (semua pelanggan tanpa filter), karena itu akan membuat
     filter terlihat "tidak bekerja" (menampilkan semua pelanggan). */
  var _adaFilterAktif = _pelActiveFilter && (
    _pelActiveFilter.status || _pelActiveFilter.area || _pelActiveFilter.paket ||
    _pelActiveFilter.jenis  || _pelActiveFilter.tglDari || _pelActiveFilter.tglSampai
  );
  if(_adaFilterAktif) return _pelData || [];

  if(window.SOT){ var c=SOT.cache(); if(c&&c.pelanggan&&c.pelanggan.length){ _pelData=c.pelanggan; return _pelData; } }
  return _pelData;
}

var _pelPage   = 1;
var _pelPerPage = 50;
/* Token pengaman: berbagai jalur kode (nav masuk menu, realtime refresh, fallback
   timer) bisa memicu pelLoadPage()/pelSearchServer() hampir bersamaan. Tanpa ini,
   request yang lebih LAMBAT bisa selesai belakangan dan menimpa hasil dari request
   yang lebih BARU dengan data basi — bikin daftar kelihatan "berubah sendiri"
   padahal sebenarnya cuma race condition antar beberapa fetch yang tumpang tindih. */
var _pelReqToken = 0;
var _pelPerPg  = 50;
var _pelTotal  = 0;
var _pelFallbackCount = 0;

var _pelSearchMode = false;
var _pelSearchQ    = '';
var _pelFil    = [];
var _pelDetId  = null;
var _pelLoaded = false;

var _pelActiveFilter = {status:'', area:'', paket:'', jenis:'', tglDari:'', tglSampai:''};
var _pelOdpList = [];

var _PEL_FREE_TYPES_FALLBACK = ['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
Object.defineProperty(window, '_PEL_FREE_TYPES', {
  get: function(){ return window.JENIS_GRATIS || _PEL_FREE_TYPES_FALLBACK; },
  configurable: true
});
var _PEL_PAID_TYPES = ['Reguler','UMKM','Corporate'];

_navDispatch.register('pelanggan', function(){ pelLoad(); });

function _genCID(){
  var n = (_getPelData().length + 1).toString().padStart(4,'0');
  var yy = new Date().getFullYear().toString().slice(-2);
  return 'CID-'+yy+'-'+n;
}

function _pelFillAreaDropdown(selId, currentVal){
  var sel = document.getElementById(selId);
  if(!sel) return;

  var cur = (currentVal !== undefined && currentVal !== null) ? currentVal : sel.value;


  if(!_isGlobalRole() && !cur){
    var _sc = _getUserAreaScope();
    if(_sc && _sc.area_coverage_id) cur = _sc.area_coverage_id;
  }

  sel.innerHTML = '<option value="">— Pilih Area —</option>';
  _areaData.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.nama + ' (' + a.kode + ')';
    if(a.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
  if(!cur) sel.value = '';


  if(!_isGlobalRole()){
    var _sc2 = _getUserAreaScope();
    if(_sc2 && _sc2.area_coverage_id){
      sel.disabled = true;
      sel.style.opacity = '0.7';
      sel.style.cursor = 'not-allowed';
      sel.title = 'Area dikunci sesuai akun Anda';
    }
  } else {
    sel.disabled = false;
    sel.style.opacity = '';
    sel.style.cursor = '';
    sel.title = '';
  }
}

function _pelFillOdcDropdown(selId, currentVal, areaId){
  var sel = document.getElementById(selId);
  if(!sel) return;
  sel.innerHTML = '<option value="">— Pilih ODC (opsional) —</option>';
  var all = window._pelOdcList||[];

  var list = areaId
    ? all.filter(function(o){ return o.area_id===areaId || !o.area_id; })
    : all;
  list.sort(function(a,b){
    var aM=a.area_id===areaId?0:1, bM=b.area_id===areaId?0:1;
    if(aM!==bM) return aM-bM;
    return (a.kode||'').localeCompare(b.kode||'');
  });
  list.forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o.id;
    var suffix = !o.area_id ? ' ⚠ (area belum diset)' : '';
    opt.textContent = ((o.nama && o.nama !== o.kode) ? o.kode + ' · ' + o.nama : o.kode) + suffix;
    if(o.id === currentVal) opt.selected = true;
    sel.appendChild(opt);
  });
}

function _pelFillOdpDropdown(selId, currentVal, areaId, odcId){
  var sel = document.getElementById(selId);
  if(!sel) return;

  var cur = (currentVal !== undefined && currentVal !== null) ? currentVal : sel.value;
  sel.innerHTML = '<option value="">— Pilih ODP (opsional) —</option>';
  var list = _pelOdpList;
  if(areaId) list = list.filter(function(o){ return o.area_id===areaId; });
  if(odcId)  list = list.filter(function(o){ return o.odc_id===odcId; });
  list.forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = (o.nama && o.nama !== o.kode) ? o.kode + ' · ' + o.nama : o.kode;
    if(o.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });

  if(!cur) sel.value = '';
}

function _pelLoadPortDropdown(odpId, currentPort){
  var sb = getSB(); if(!sb) return;
  var portGrp  = document.getElementById('pelf-port-group');
  var portSel  = document.getElementById('pelf-port-sel');
  var portInfo = document.getElementById('pelf-port-info');
  if(!portSel) return;

  portSel.innerHTML = '<option value="">— Memuat port… —</option>';
  portGrp.style.display = 'block';


  sb.from('odp_ports').select('*').eq('odp_id', odpId).order('nomor_port').then(function(r){
    if(r.error){ portSel.innerHTML = '<option value="">Gagal memuat port</option>'; return; }
    var ports = r.data || [];


    if(!ports.length){
      var odp = _pelOdpList.find(function(o){ return o.id===odpId; });
      var jml = (odp && odp.jumlah_port) ? odp.jumlah_port : 8;
      ports = [];
      for(var i=1;i<=jml;i++) ports.push({nomor_port:i, status:'kosong', cid_pelanggan:null, paket:null, tgl_pasang:null});
    }

    portSel.innerHTML = '<option value="">— Pilih Port —</option>';
    ports.forEach(function(pt){
      var opt = document.createElement('option');
      opt.value = pt.nomor_port;
      var lbl = 'Port ' + pt.nomor_port + ' — ';
      if(pt.status === 'terpakai' || pt.cid_pelanggan){
        lbl += '🔴 Terpakai (' + (pt.cid_pelanggan||'—') + ')';
        opt.style.color = '#ef4444';
      } else {
        lbl += '🟢 Kosong';
      }
      opt.textContent = lbl;
      if(String(pt.nomor_port) === String(currentPort)) opt.selected = true;
      portSel.appendChild(opt);
    });


    if(currentPort) document.getElementById('pelf-port').value = currentPort;


    portSel.onchange = function(){
      document.getElementById('pelf-port').value = this.value;
      var chosen = ports.find(function(pt){ return String(pt.nomor_port)===String(portSel.value); });
      if(!chosen || (!chosen.cid_pelanggan && chosen.status !== 'terpakai')){
        portInfo.style.display = 'none'; return;
      }

      var cid = chosen.cid_pelanggan;
      var pelDetail = _getPelData().find(function(p){ return p.cid===cid; });
      var tglPasang = chosen.tgl_pasang || (pelDetail && pelDetail.tgl_pasang) || null;
      var durasi = '—';
      if(tglPasang){
        var ms = Date.now() - new Date(tglPasang).getTime();
        var bln = Math.floor(ms / (1000*60*60*24*30));
        durasi = bln < 1 ? '< 1 bulan' : bln + ' bulan';
      }
      portInfo.style.display = 'block';
      portInfo.style.background = 'rgba(239,68,68,.07)';
      portInfo.style.borderColor = '#ef4444';
      portInfo.innerHTML =
        '<div style="font-weight:700;color:#ef4444;margin-bottom:4px">⚠️ Port sudah dipakai</div>'+
        '<div><b>CID:</b> '+(cid||'—')+'</div>'+
        '<div><b>Nama:</b> '+(pelDetail?pelDetail.nama:'—')+'</div>'+
        '<div><b>Paket:</b> '+(chosen.paket||(pelDetail&&pelDetail.paket)||'—')+'</div>'+
        '<div><b>Tgl Pasang:</b> '+(tglPasang||'—')+'</div>'+
        '<div><b>Lama Berlangganan:</b> '+durasi+'</div>';
    };


    if(currentPort) portSel.onchange();
  });
}

function _pelFillFilters(){

  var selArea = document.getElementById('pel-fil-area');
  if(selArea){

    var curA = _pelActiveFilter.area || selArea.value;

    var allAreas = (window.SOT && SOT.cache().areas && SOT.cache().areas.length)
      ? SOT.cache().areas
      : (_areaData || []);
    selArea.innerHTML = '<option value="">Semua Area</option>';
    allAreas.forEach(function(a){
      var opt = document.createElement('option');
      opt.value = a.id; opt.textContent = a.nama;
      if(a.id === curA) opt.selected = true;
      selArea.appendChild(opt);
    });

    if(curA) selArea.value = curA;
  }

  var selStatus = document.getElementById('pel-fil-status');
  if(selStatus && _pelActiveFilter.status) selStatus.value = _pelActiveFilter.status;

  var selJenis = document.getElementById('pel-fil-jenis');
  if(selJenis && _pelActiveFilter.jenis) selJenis.value = _pelActiveFilter.jenis;

  var selPaket = document.getElementById('pel-fil-paket');
  if(selPaket){
    var curP = _pelActiveFilter.paket || selPaket.value;
    var _fillPaketOpts = function(list){
      var pakets = [];
      list.forEach(function(p){ if(p.paket && pakets.indexOf(p.paket)<0) pakets.push(p.paket); });
      pakets.sort();
      selPaket.innerHTML = '<option value="">Semua Paket</option>';
      pakets.forEach(function(pk){
        var opt = document.createElement('option');
        opt.value = pk; opt.textContent = pk;
        if(pk === curP) opt.selected = true;
        selPaket.appendChild(opt);
      });

      if(curP) selPaket.value = curP;
    };
    _fillPaketOpts(_getPelData());

    var _sbPk = (typeof getSB==='function') ? getSB() : null;
    if(_sbPk){
      _sbPk.from('pelanggan').select('paket').then(function(r){
        if(!r.error && r.data && r.data.length) _fillPaketOpts(r.data);
      }).catch(function(){});
    }
  }
}

function _pelRenderPagination(){

  var nav = document.getElementById('pel-pagination');
  if(nav) nav.style.display = 'none';
}

function pelLoadPage(pageNum){
  var list = document.getElementById('pel-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4;"></i><p>Memuat halaman ' + pageNum + '…</p></div>';

  _pelPage = pageNum;
  var _myReqToken = ++_pelReqToken;
  var sb = getSB();
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  var p1 = _areaData.length > 0 ? Promise.resolve() : _ensureAreas(sb);
  var p2 = _pelOdpList.length > 0 ? Promise.resolve()
    : sb.from('odps').select('id,kode,nama,area_id,odc_id,jumlah_port').order('kode').then(function(r){ if(!r.error) _pelOdpList=r.data||[]; });
  var p3 = (window._pelOdcList && window._pelOdcList.length > 0) ? Promise.resolve()
    : sb.from('odcs').select('id,kode,nama,area_id').order('kode').then(function(r){ if(!r.error) window._pelOdcList=r.data||[]; });

  Promise.all([p1, p2, p3]).then(function(){
    var offset = (_pelPage-1) * _pelPerPage;
    var q = sb.from('pelanggan').select('*', {count:'exact'}).order('created_at', {ascending:false}).order('id', {ascending:false}).range(offset, offset+_pelPerPage-1);
    if(!_isGlobalRole()){
      var sc = _getUserAreaScope();
      if(sc && sc.area_coverage_id) q = q.eq('area_id', sc.area_coverage_id);
    }

    if(_pelActiveFilter.area)   q = q.eq('area_id', _pelActiveFilter.area);
    if(_pelActiveFilter.status) q = q.eq('status',  _pelActiveFilter.status);
    if(_pelActiveFilter.paket)  q = q.eq('paket',   _pelActiveFilter.paket);
    if(_pelActiveFilter.jenis)  q = q.eq('jenis_pelanggan', _pelActiveFilter.jenis);
    /* Filter TANGGAL AKTIF (tgl_pasang) — bukan tanggal input/dibuat (created_at).
       tgl_pasang adalah tanggal instalasi/aktivasi sesungguhnya di lapangan,
       yang bisa berbeda jauh dari kapan datanya dimasukkan ke sistem. */
    if(_pelActiveFilter.tglDari)   q = q.gte('tgl_pasang', _pelActiveFilter.tglDari);
    if(_pelActiveFilter.tglSampai) q = q.lte('tgl_pasang', _pelActiveFilter.tglSampai);
    return q;
  }).then(function(r){
    /* Kalau ada request LAIN yang lebih baru sudah dikirim setelah request ini
       (misal karena beberapa jalur nav/timer/realtime saling tumpang tindih),
       buang hasil yang ini — biar yang tampil selalu dari request TERBARU. */
    if(_myReqToken !== _pelReqToken) return;
    if(r.error){
      if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+(r.error.message||'coba lagi')+'</p></div>';
      return;
    }
    var rawData = r.data || [];
    _pelTotal = r.count || 0;



    if(!_isGlobalRole()){
      var sc2 = _getUserAreaScope();
      var _allAreasT20 = (window.SOT && SOT.cache().areas && SOT.cache().areas.length)
        ? SOT.cache().areas : (_areaData||[]);
      var _areaObj2 = sc2 && _allAreasT20.find(function(a){ return a.id===sc2.area_coverage_id; });
      var _areaNama2 = _areaObj2 ? (_areaObj2.nama||'').toLowerCase() : '';
      if(sc2 && sc2.area_coverage_id && _areaNama2){
        var _JGT20=JENIS_GRATIS;
        sb.from('pelanggan').select('*').is('area_id',null)
          .then(function(r2){
            if(!r2.error && r2.data && r2.data.length){
              var extras = r2.data.filter(function(p){
                var ac = (p.area_coverage||'').toLowerCase();

                return ac && (ac===_areaNama2 || ac.indexOf(_areaNama2)>=0)
                  && _JGT20.indexOf(p.jenis_pelanggan) < 0;
              });
              if(extras.length){
                var ids = {}; rawData.forEach(function(p){ ids[p.id]=true; });
                extras.forEach(function(p){ if(!ids[p.id]) rawData.push(p); });
                _pelFallbackCount = extras.length;
              }
            }
            _finishPelRender(rawData);
          }).catch(function(){ _finishPelRender(rawData); });
        return;
      }
    }
    _finishPelRender(rawData);
  }).catch(function(e){
    if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+(e.message||'coba lagi')+'</p></div>';
  });
}

function _finishPelRender(rawData){
  _pelData = rawData.filter(function(p){
    var _JG=JENIS_GRATIS;
    return _JG.indexOf(p.jenis_pelanggan) < 0;
  });
  _pelLoaded = true;
  _pelFillFilters();
  _pelRenderPagination();
  pelRender();
  if(typeof pelCheckActiveFilterNote==='function') pelCheckActiveFilterNote();

  if(window.SOT && SOT.cache().pelanggan.length){
    _pelUpdateStats();
  } else if(window.SOT){
    SOT.refresh(false, function(){ _pelUpdateStats(); });
  } else {
    _pelUpdateStats();
  }
}

function pelResetAllFilters(){
  var ids = ['pel-fil-status','pel-fil-area','pel-fil-paket','pel-fil-jenis','pel-fil-tgl-dari','pel-fil-tgl-sampai'];
  ids.forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  pelApplyFilter();
}

function pelCheckActiveFilterNote(){
  var note = document.getElementById('pel-active-fil-note');
  var txt  = document.getElementById('pel-active-fil-text');
  if(!note || !txt) return;
  var parts = [];
  if(_pelActiveFilter.status) parts.push('Status: '+_pelActiveFilter.status);
  if(_pelActiveFilter.area)   parts.push('Area tertentu');
  if(_pelActiveFilter.paket)  parts.push('Paket: '+_pelActiveFilter.paket);
  if(_pelActiveFilter.jenis)  parts.push('Jenis: '+_pelActiveFilter.jenis);
  if(_pelActiveFilter.tglDari || _pelActiveFilter.tglSampai) parts.push('Rentang tanggal aktif');
  if(parts.length){
    txt.textContent = 'Filter aktif: '+parts.join(' · ')+' — sebagian pelanggan mungkin tersembunyi karena ini.';
    note.style.display = 'flex';
  } else {
    note.style.display = 'none';
  }
}

function pelLoad(){
  pelLoadPage(1);
}

function pelApplyFilter(){
  _pelActiveFilter.status = (document.getElementById('pel-fil-status')||{}).value||'';
  _pelActiveFilter.area   = (document.getElementById('pel-fil-area')||{}).value||'';
  _pelActiveFilter.paket  = (document.getElementById('pel-fil-paket')||{}).value||'';
  _pelActiveFilter.jenis  = (document.getElementById('pel-fil-jenis')||{}).value||'';
  _pelActiveFilter.tglDari   = (document.getElementById('pel-fil-tgl-dari')||{}).value||'';
  _pelActiveFilter.tglSampai = (document.getElementById('pel-fil-tgl-sampai')||{}).value||'';

  /* validasi ringan: kalau dari > sampai, tukar otomatis biar tidak query kosong percuma */
  if(_pelActiveFilter.tglDari && _pelActiveFilter.tglSampai && _pelActiveFilter.tglDari > _pelActiveFilter.tglSampai){
    var tmp = _pelActiveFilter.tglDari;
    _pelActiveFilter.tglDari = _pelActiveFilter.tglSampai;
    _pelActiveFilter.tglSampai = tmp;
    var elD=document.getElementById('pel-fil-tgl-dari'), elS=document.getElementById('pel-fil-tgl-sampai');
    if(elD) elD.value = _pelActiveFilter.tglDari;
    if(elS) elS.value = _pelActiveFilter.tglSampai;
  }

  var badge = document.getElementById('pel-fil-tgl-badge');
  if(badge) badge.style.display = (_pelActiveFilter.tglDari || _pelActiveFilter.tglSampai) ? 'flex' : 'none';

  _pelSearchMode = false;
  _pelSearchQ    = '';
  pelLoadPage(1);
}

function pelClearTglFilter(){
  var elD=document.getElementById('pel-fil-tgl-dari'), elS=document.getElementById('pel-fil-tgl-sampai');
  if(elD) elD.value = '';
  if(elS) elS.value = '';
  pelApplyFilter();
}

function _pelUpdateStats(){
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=_fmt(v); };

  var _af = function(list){
    return list.filter(function(p){
      if(_pelActiveFilter.area   && p.area_id          !== _pelActiveFilter.area)   return false;
      if(_pelActiveFilter.status && p.status            !== _pelActiveFilter.status) return false;
      if(_pelActiveFilter.paket  && p.paket              !== _pelActiveFilter.paket)  return false;
      if(_pelActiveFilter.jenis  && p.jenis_pelanggan    !== _pelActiveFilter.jenis)  return false;
      return true;
    });
  };

  if(window.SOT && typeof SOT.customerStats==='function' && SOT.cache().pelanggan.length){
    var JG=JENIS_GRATIS;
    var allPel = SOT.cache().pelanggan;

    if(!_isGlobalRole()){
      var sc = _getUserAreaScope();
      if(sc && sc.area_coverage_id){
        allPel = allPel.filter(function(p){ return p.area_id === sc.area_coverage_id; });
      }
    }
    allPel = _af(allPel);
    var berbayarAll = allPel.filter(function(p){ return JG.indexOf(p.jenis_pelanggan)<0; });
    e('pelst-total',   berbayarAll.length);
    e('pelst-aktif',   berbayarAll.filter(function(p){ return p.status==='aktif'||p.status==='maintenance'; }).length);
    e('pelst-suspend', berbayarAll.filter(function(p){ return p.status==='suspend'; }).length);
    e('pelst-cabut',   berbayarAll.filter(function(p){ return p.status==='cabut'; }).length);
    e('pelst-reguler', berbayarAll.filter(function(p){ return p.jenis_pelanggan==='Reguler'||!p.jenis_pelanggan; }).length);
    e('pelst-umkm',    berbayarAll.filter(function(p){ return p.jenis_pelanggan==='UMKM'; }).length);
    e('pelst-corp',    berbayarAll.filter(function(p){ return p.jenis_pelanggan==='Corporate'; }).length);
  } else {

    var pd = _af(_getPelData());
    e('pelst-total',   pd.length);
    e('pelst-aktif',   pd.filter(function(p){ return p.status==='aktif'||p.status==='maintenance'; }).length);
    e('pelst-suspend', pd.filter(function(p){ return p.status==='suspend'; }).length);
    e('pelst-cabut',   pd.filter(function(p){ return p.status==='cabut'; }).length);
    e('pelst-reguler', pd.filter(function(p){ return p.jenis_pelanggan==='Reguler'||!p.jenis_pelanggan; }).length);
    e('pelst-umkm',    pd.filter(function(p){ return p.jenis_pelanggan==='UMKM'; }).length);
    e('pelst-corp',    pd.filter(function(p){ return p.jenis_pelanggan==='Corporate'; }).length);
  }
}

function _pelAreaName(area_id){
  var a = _areaData.find(function(x){ return x.id===area_id; });
  return a ? a.nama : '—';
}
function _pelOdpName(odp_id){
  var o = _pelOdpList.find(function(x){ return x.id===odp_id; });
  return o ? (o.kode+' · '+o.nama) : '—';
}

function pelSearch(q){
  var clr = document.getElementById('pel-search-clr');
  if(clr) clr.style.display = q ? 'block' : 'none';

  q = (q||'').trim();
  if(!q){

    _pelSearchMode = false;
    _pelSearchQ = '';
    pelLoadPage(1);
    return;
  }
  _pelSearchQ = q;
  pelSearchServer(q, 1);
}

function pelSearchServer(q, pageNum){
  var list = document.getElementById('pel-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4;"></i><p>Mencari…</p></div>';

  var sb = getSB();
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  _pelSearchMode = true;
  _pelPage = pageNum || 1;
  var _myReqToken = ++_pelReqToken;

  var p1 = _areaData.length > 0 ? Promise.resolve() : _ensureAreas(sb);
  var p2 = _pelOdpList.length > 0 ? Promise.resolve()
    : sb.from('odps').select('id,kode,nama,area_id,odc_id,jumlah_port').order('kode').then(function(r){ if(!r.error) _pelOdpList=r.data||[]; });

  Promise.all([p1, p2]).then(function(){
    var esc = q.replace(/[%,]/g,'').trim();
    var offset = (_pelPage-1) * _pelPerPage;
    var orFilter = 'cid.ilike.%'+esc+'%,nama.ilike.%'+esc+'%,hp.ilike.%'+esc+'%,alamat.ilike.%'+esc+'%,nik.ilike.%'+esc+'%';
    var query = sb.from('pelanggan').select('*', {count:'exact'}).or(orFilter)
      .order('created_at', {ascending:false}).order('id', {ascending:false}).range(offset, offset+_pelPerPage-1);
    if(!_isGlobalRole()){
      var sc = _getUserAreaScope();
      if(sc && sc.area_coverage_id) query = query.eq('area_id', sc.area_coverage_id);
    }

    if(_pelActiveFilter.area)   query = query.eq('area_id', _pelActiveFilter.area);
    if(_pelActiveFilter.status) query = query.eq('status',  _pelActiveFilter.status);
    if(_pelActiveFilter.paket)  query = query.eq('paket',   _pelActiveFilter.paket);
    if(_pelActiveFilter.jenis)  query = query.eq('jenis_pelanggan', _pelActiveFilter.jenis);
    return query;
  }).then(function(r){
    if(_myReqToken !== _pelReqToken) return;
    if(r.error){
      if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+(r.error.message||'coba lagi')+'</p></div>';
      return;
    }
    _pelTotal = r.count || 0;
    _finishPelRender(r.data || []);
  }).catch(function(e){
    if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+(e.message||'coba lagi')+'</p></div>';
  });
}
function pelClearSearch(){
  var inp = document.getElementById('pel-search');
  if(inp) inp.value = '';
  var clr = document.getElementById('pel-search-clr');
  if(clr) clr.style.display = 'none';
  _pelSearchMode = false;
  _pelSearchQ = '';

  pelLoadPage(1);
}

function pelRender(){
  var q     = (document.getElementById('pel-search')||{}).value||'';
  var fSt   = (document.getElementById('pel-fil-status')||{}).value||'';
  var fAr   = (document.getElementById('pel-fil-area')||{}).value||'';
  var fPk   = (document.getElementById('pel-fil-paket')||{}).value||'';
  var fJn   = (document.getElementById('pel-fil-jenis')||{}).value||'';
  q = q.toLowerCase().trim();
  _pelFil = _getPelData().filter(function(p){
    var matchQ = !q ||
      (p.nama||'').toLowerCase().includes(q) ||
      (p.cid||'').toLowerCase().includes(q) ||
      (p.hp||'').includes(q) ||
      (p.alamat||'').toLowerCase().includes(q) ||
      (p.nik||'').includes(q);
    var matchSt = !fSt || p.status===fSt;

    var matchCabut = fSt ? true : p.status!=='cabut';
    var matchAr = !fAr || p.area_id===fAr;
    var matchPk = !fPk || p.paket===fPk;
    var matchJn = !fJn || (p.jenis_pelanggan||'Reguler')===fJn;

    /* Filter tanggal aktif (tgl_pasang) — lapisan pertahanan kedua di sisi
       klien, agar tetap benar walau _pelData datang dari sumber lain
       (mis. realtime update / fallback) yang belum tersaring tanggal. */
    var pTgl = (p.tgl_pasang||'').slice(0,10);
    var matchTglDari   = !_pelActiveFilter.tglDari   || (pTgl && pTgl >= _pelActiveFilter.tglDari);
    var matchTglSampai = !_pelActiveFilter.tglSampai || (pTgl && pTgl <= _pelActiveFilter.tglSampai);

    return matchQ && matchSt && matchCabut && matchAr && matchPk && matchJn && matchTglDari && matchTglSampai;
  });

  var total = _pelFil.length;

  var pages = Math.max(1, Math.ceil(total / _pelPerPg));
  if(_pelTotal <= 0 && _pelPage > pages) _pelPage = pages;
  var start = 0;
  var slice = _pelFil.slice(start, start + _pelPerPg);

  var list = document.getElementById('pel-list');
  if(!list) return;

  if(!total){
    list.innerHTML = '<div class="olt-empty"><i class="ti ti-users-minus"></i><p>Tidak ada pelanggan ditemukan</p><small>Coba ubah filter atau tambah pelanggan baru</small></div>';
    document.getElementById('pel-pagi').style.display = 'none';
    return;
  }

  list.innerHTML = slice.map(function(p){ return _pelRowHTML(p); }).join('');


  var dbMaxPage = _pelTotal > 0 ? Math.ceil(_pelTotal / _pelPerPage) : pages;
  var totalBerbayar = (window.SOT && SOT.cache().pelanggan && SOT.cache().pelanggan.length)
    ? SOT.customerStats().berbayar : _pelTotal;
  var showNext = _pelPage < dbMaxPage;
  var showPrev = _pelPage > 1;

  var pagi = document.getElementById('pel-pagi');
  if(pages > 1 || dbMaxPage > 1){
    pagi.style.display = 'flex';
    var prev = document.getElementById('pel-prev');
    var next = document.getElementById('pel-next');
    var info = document.getElementById('pel-pagi-info');
    if(prev) prev.disabled = !showPrev;
    if(next) next.disabled = !showNext;
    if(info){
      var infoTxt = 'Halaman ' + _pelPage + ' / ' + dbMaxPage;
      if(totalBerbayar > 0) infoTxt += ' (' + totalBerbayar + ' pelanggan berbayar)';
      info.textContent = infoTxt;
      info.style.fontSize = '10px';
    }
  } else {
    pagi.style.display = 'none';
  }
}

function _pelRowHTML(p){
  var stMap = {aktif:'tg',suspend:'ty',cabut:'tr',proses:'tcy'};
  var stLbl = {aktif:'Aktif',suspend:'Suspend',cabut:'Cabut',proses:'Proses'};
  var stClass = stMap[p.status]||'tgr';
  var stLabel = stLbl[p.status]||p.status||'—';
  var avCls = p.status==='aktif'?'aktif':p.status==='suspend'?'suspend':p.status==='cabut'?'cabut':'proses';
  var initials = (p.nama||'?').trim().split(/\s+/).slice(0,2).map(function(w){ return w[0]||''; }).join('').toUpperCase();

  var jenis = p.jenis_pelanggan||'Reguler';
  var isGratis = _PEL_FREE_TYPES.indexOf(jenis)>=0;
  var jenisCls = isGratis ? 'tgr' : 'tc1';
  var jenisLbl = jenis==='ODP_TEMPEL'?'ODP Tempel':jenis==='ODC_TEMPEL'?'ODC Tempel':jenis;
  var jenisTag = '<span class="tag '+jenisCls+'" style="font-size:9px">'+(isGratis?'<i class="ti ti-gift" style="font-size:8px"></i> ':'<i class="ti ti-cash" style="font-size:8px"></i> ')+_esc(jenisLbl)+'</span>';

  return '<div class="pel-row" onclick="pelOpenDet(\''+p.id+'\')">'+
    '<button class="pel-row-detail-btn" onclick="event.stopPropagation();pelOpenDet(\''+p.id+'\')"><i class="ti ti-chevron-right"></i></button>'+
    '<div class="pel-row-top">'+
      '<div class="pel-row-av '+avCls+'">'+_esc(initials)+'</div>'+
      '<div class="pel-row-info">'+
        '<div class="pel-row-name">'+_esc(p.nama||'—')+'</div>'+
        '<div class="pel-row-cid">'+_esc(p.cid||'—')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="pel-row-meta">'+
      '<span class="tag '+stClass+'">'+stLabel+'</span>'+
      jenisTag+
      (p.paket?'<span class="tag tpu"><i class="ti ti-wifi" style="font-size:9px"></i> '+_esc(p.paket)+'</span>':'')+
      (p.hp?'<span class="tag tgr"><i class="ti ti-phone" style="font-size:9px"></i> '+_esc(p.hp)+'</span>':'')+
      '<span class="tag tgr">'+_esc(_pelAreaName(p.area_id))+'</span>'+
      (p.tgl_pasang?'<span class="tag tgr"><i class="ti ti-calendar" style="font-size:9px"></i> '+_esc(p.tgl_pasang)+'</span>':'')+
    '</div>'+
  '</div>';
}

function pelPage(dir){
  var dbMaxPage = _pelTotal > 0 ? Math.ceil(_pelTotal / _pelPerPage) : 1;
  var newPage   = Math.min(dbMaxPage, Math.max(1, _pelPage + dir));
  if(newPage === _pelPage) return;

  if(_pelSearchMode){
    pelSearchServer(_pelSearchQ, newPage);
  } else {
    pelLoadPage(newPage);
  }
}

function pelOpenForm(data){
  var isEdit = !!data;
  document.getElementById('pel-form-title').textContent = isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan';
  document.getElementById('pelf-id').value         = isEdit ? (data.id||'') : '';

  var cidEl = document.getElementById('pelf-cid');
  cidEl.value    = isEdit ? (data.cid||'') : '';
  cidEl.readOnly = isEdit;
  cidEl.style.background = isEdit ? 'var(--bg3)' : '';
  document.getElementById('pelf-nama').value       = isEdit ? (data.nama||'') : '';
  document.getElementById('pelf-hp').value         = isEdit ? (data.hp||'') : '';
  document.getElementById('pelf-nik').value        = isEdit ? (data.nik||'') : '';
  document.getElementById('pelf-alamat').value     = isEdit ? (data.alamat||'') : '';
  document.getElementById('pelf-paket').value      = isEdit ? (data.paket||'') : '';
  document.getElementById('pelf-jenis').value      = isEdit ? (data.jenis_pelanggan||'Reguler') : 'Reguler';
  document.getElementById('pelf-tipe-recurring').value = isEdit ? (data.tipe_recurring||'existing') : 'existing';
  document.getElementById('pelf-tgl-pasang').value = isEdit ? (data.tgl_pasang||'') : '';
  document.getElementById('pelf-status').value     = isEdit ? (data.status||'aktif') : 'aktif';
  document.getElementById('pelf-port').value       = isEdit ? (data.nomor_port||'') : '';
  document.getElementById('pelf-lat').value        = isEdit ? (data.lat||'') : '';
  document.getElementById('pelf-lng').value        = isEdit ? (data.lng||'') : '';
  document.getElementById('pelf-ket').value        = isEdit ? (data.keterangan||'') : '';

  window._pelf_edit_kec = isEdit ? (data.kecamatan||'') : '';
  window._pelf_edit_kel = isEdit ? (data.kelurahan||'') : '';
  document.getElementById('pelf-rw').value         = isEdit ? (data.rw||'') : '';
  document.getElementById('pelf-rt').value         = isEdit ? (data.rt||'') : '';


  var odcSel = document.getElementById('pelf-odc');
  odcSel.innerHTML = '<option value="">— Pilih ODC (opsional) —</option>';


  var odpSel = document.getElementById('pelf-odp');
  if(odpSel){ odpSel.innerHTML = '<option value="">— Pilih ODP (opsional) —</option>'; odpSel.value = ''; }


  document.getElementById('pelf-port-group').style.display = 'none';
  document.getElementById('pelf-port-info').style.display  = 'none';
  document.getElementById('pelf-port').value = '';


  if(!isEdit){
    var _matResetIds = ['pelf-ont-model','pelf-sn-ont','pelf-mac-ont','pelf-kabel-precon','pelf-panjang-kabel','pelf-teknisi-pasang'];
    _matResetIds.forEach(function(id){
      var el = document.getElementById(id);
      if(el){ el.value = ''; el.classList.remove('err'); }
    });

    var snHint = document.getElementById('pelf-sn-hint');
    if(snHint){ snHint.textContent = ''; snHint.style.color = ''; }

    var tkSel = document.getElementById('pelf-teknisi-sel');
    if(tkSel){ tkSel.value = ''; tkSel.classList.remove('err'); }
    var tkRo = document.getElementById('pelf-teknisi-ro');
    if(tkRo){ tkRo.style.border = ''; }
  }

  var sb = getSB();

  var p1 = _areaData.length > 0 ? Promise.resolve() : _ensureAreas(sb);
  var p2 = _pelOdpList.length > 0 ? Promise.resolve()
    : sb.from('odps').select('id,kode,nama,area_id,odc_id,jumlah_port').order('kode').then(function(r){ if(!r.error) _pelOdpList=r.data||[]; });
  var p3 = (window._pelOdcList && window._pelOdcList.length > 0) ? Promise.resolve()
    : sb.from('odcs').select('id,kode,nama,area_id').order('kode').then(function(r){ if(!r.error) window._pelOdcList=r.data||[]; });

  Promise.all([p1, p2, p3]).then(function(){
    _pelFillAreaDropdown('pelf-area', isEdit ? data.area_id : '');


    var selArea = document.getElementById('pelf-area');
    if(selArea){
      selArea.onchange = function(){
        _pelFillOdcDropdown('pelf-odc', '', this.value);
        _pelFillOdpDropdown('pelf-odp', '', this.value, '');
        document.getElementById('pelf-port-group').style.display = 'none';
        document.getElementById('pelf-port-info').style.display  = 'none';
        document.getElementById('pelf-port').value = '';

        _pelOnAreaChangeWilayah();

        if(typeof _invFillAllDropdowns==='function') _invFillAllDropdowns(this.value);
      };
    }

    if(isEdit){

      var savedOdp = _pelOdpList.find(function(o){ return o.id===data.odp_id; });
      var savedOdcId = savedOdp ? (savedOdp.odc_id||'') : '';
      _pelFillOdcDropdown('pelf-odc', savedOdcId, data.area_id);
      _pelFillOdpDropdown('pelf-odp', data.odp_id, data.area_id, savedOdcId);
      if(data.odp_id) _pelLoadPortDropdown(data.odp_id, data.nomor_port);
    } else {

      var _defaultAreaId = (!_isGlobalRole() && CU) ? (CU.area_coverage_id||CU.area_id||'') : '';
      _pelFillOdcDropdown('pelf-odc', '', _defaultAreaId);
      _pelFillOdpDropdown('pelf-odp', '', _defaultAreaId, '');
    }


    var selOdc = document.getElementById('pelf-odc');
    if(selOdc){
      selOdc.onchange = function(){
        var aId = document.getElementById('pelf-area').value;
        _pelFillOdpDropdown('pelf-odp', '', aId, this.value);
        document.getElementById('pelf-port-group').style.display = 'none';
        document.getElementById('pelf-port').value = '';
      };
    }


    var selOdp = document.getElementById('pelf-odp');
    if(selOdp){
      selOdp.onchange = function(){
        document.getElementById('pelf-port').value = '';
        document.getElementById('pelf-port-info').style.display = 'none';
        if(this.value) _pelLoadPortDropdown(this.value, '');
        else document.getElementById('pelf-port-group').style.display = 'none';
      };
    }
  });


  _pelFillWilayahDropdowns(window._pelf_edit_kec||'', window._pelf_edit_kel||'');

  ['pelf-cid','pelf-nama','pelf-hp','pelf-alamat','pelf-area','pelf-paket'].forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.classList.remove('err');
  });
  document.getElementById('pel-form-overlay').classList.add('on');
}
function pelCloseForm(){ document.getElementById('pel-form-overlay').classList.remove('on'); }

var _pelWilayahMaster = null;

function _pelFillKecamatanDropdown(selectedKec){
  var areaName = (_areaData.find(function(a){
    return a.id === (document.getElementById('pelf-area')||{}).value;
  })||{}).nama || '';

  var sel = document.getElementById('pelf-kecamatan');
  if(!sel) return;
  var cur = selectedKec !== undefined ? selectedKec : sel.value;


  var kecs = [];
  (_pelWilayahMaster||[]).forEach(function(w){
    if(!w.kecamatan) return;
    if(areaName && w.area_coverage && w.area_coverage !== areaName) return;
    if(kecs.indexOf(w.kecamatan) < 0) kecs.push(w.kecamatan);
  });
  kecs.sort();

  sel.innerHTML = '<option value="">— Pilih Kecamatan —</option>';
  kecs.forEach(function(k){
    var o = document.createElement('option');
    o.value = k; o.textContent = k;
    if(k === cur) o.selected = true;
    sel.appendChild(o);
  });


  if(cur && kecs.indexOf(cur) < 0 && cur !== ''){
    var o = document.createElement('option');
    o.value = cur; o.textContent = cur; o.selected = true;
    sel.appendChild(o);
  }
}

function _pelFillKelurahanDropdown(selectedKel){
  var kec = (document.getElementById('pelf-kecamatan')||{}).value || '';
  var sel = document.getElementById('pelf-kelurahan');
  if(!sel) return;
  var cur = selectedKel !== undefined ? selectedKel : sel.value;

  var kels = [];
  (_pelWilayahMaster||[]).forEach(function(w){
    if(!w.kelurahan) return;
    if(kec && w.kecamatan !== kec) return;
    if(kels.indexOf(w.kelurahan) < 0) kels.push(w.kelurahan);
  });
  kels.sort();

  sel.innerHTML = '<option value="">— Pilih Kelurahan —</option>';
  kels.forEach(function(k){
    var o = document.createElement('option');
    o.value = k; o.textContent = k;
    if(k === cur) o.selected = true;
    sel.appendChild(o);
  });


  if(cur && kels.indexOf(cur) < 0 && cur !== ''){
    var o = document.createElement('option');
    o.value = cur; o.textContent = cur; o.selected = true;
    sel.appendChild(o);
  }
}

function pelOnKecamatanChange(){
  _pelFillKelurahanDropdown('');
}

function _pelFillWilayahDropdowns(kec, kel){

  var doFill = function(){
    _pelLoadWilayahMaster(function(){
      _pelFillKecamatanDropdown(kec);
      _pelFillKelurahanDropdown(kel);
    });
  };

  if(_fdbWilayahCache){
    doFill();
  } else {
    var sb = getSB();
    if(sb){
      doFill();
    } else { doFill(); }
  }
}

function _pelRenderDetBody(p){
  var stMap = {aktif:'tg',suspend:'ty',cabut:'tr',proses:'tcy'};
  var stLbl = {aktif:'Aktif',suspend:'Suspend',cabut:'Cabut',proses:'Proses Pasang'};
  var stClass = stMap[p.status]||'tgr';
  var stLabel = stLbl[p.status]||p.status||'—';
  var created = p.created_at ? new Date(p.created_at) : null;
  var createdStr = created ? (function(d){
    var pad=function(n){return n<10?'0'+n:n;};
    return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes());
  })(created) : '—';

  var dr = _drRow;
  var sec = _secRow;

  document.getElementById('pel-det-title').textContent = p.nama || 'Detail Pelanggan';
  document.getElementById('pel-det-body').innerHTML =
    '<div style="text-align:center;padding:14px 0 10px">'+
      '<div style="width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,var(--pu),#6d28d9);display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;margin-bottom:8px">'+
        _esc((p.nama||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase())+
      '</div>'+
      '<div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:4px">'+_esc(p.nama||'—')+'</div>'+
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:13px;color:var(--pu);font-weight:700;margin-bottom:6px">'+_esc(p.cid||'—')+'</div>'+
      '<span class="tag '+stClass+'">'+stLabel+'</span>'+
    '</div>'+
    sec('user','Data Pribadi')+
    dr('No. HP', p.hp ? '<a href="tel:'+_esc(p.hp)+'" style="color:var(--c1);text-decoration:none;font-weight:600">'+_esc(p.hp)+'</a>' : '<span style="color:var(--text3)">—</span>')+
    dr('NIK', p.nik ? _esc(p.nik) : '<span style="color:var(--text3)">—</span>')+
    dr('Alamat', _esc(p.alamat||'—'))+
    dr('Area', '<span class="tag tc1">'+_esc(_pelAreaName(p.area_id))+'</span>')+
    sec('wifi','Layanan')+
    dr('Paket', p.paket ? '<span class="tpu" style="padding:3px 10px;border-radius:20px">'+_esc(p.paket)+'</span>' : '—')+
    dr('Jenis Pelanggan', (function(){ var FREE=['FASUM','ODP_TEMPEL','ODC_TEMPEL']; var j=p.jenis_pelanggan||'Reguler'; var lbl=j==='ODP_TEMPEL'?'ODP Tempel':j==='ODC_TEMPEL'?'ODC Tempel':j; var cls=FREE.indexOf(j)>=0?'tgr':'tc1'; return '<span class="tag '+cls+'">'+_esc(lbl)+'</span>'+(FREE.indexOf(j)>=0?' <span style="font-size:10px;color:var(--text3)">(Tidak menghasilkan fee)</span>':''); })())+
    dr('Tgl Pasang', p.tgl_pasang||'—')+
    sec('plug','Infra Jaringan')+
    dr('ODP', p.odp_id ? _esc(_pelOdpName(p.odp_id)) : '<span style="color:var(--text3)">Belum di-assign</span>')+
    dr('No. Port', p.nomor_port ? 'Port '+_esc(String(p.nomor_port)) : '<span style="color:var(--text3)">—</span>')+
    dr('SN ONT', p.sn_ont ? '<span style="font-family:JetBrains Mono,monospace;font-size:12px;font-weight:700;background:var(--c1b);color:var(--c1);padding:3px 10px;border-radius:8px">'+_esc(p.sn_ont)+'</span>' : '<span style="color:var(--text3)">—</span>')+
    (p.mac_ont ? dr('MAC ONT', '<span style="font-family:monospace;font-size:11px;color:var(--text2)">'+_esc(p.mac_ont)+'</span>') : '')+
    (p.ont_model ? dr('Model ONT', _esc(p.ont_model)) : '')+
    (function(){
      var kabelNama = '';
      if(p.kabel_item_id && typeof _invMatiData !== 'undefined' && _invMatiData.length){
        var kItem = _invMatiData.find(function(m){ return m.id===p.kabel_item_id; });
        if(kItem) kabelNama = kItem.nama + (kItem.merk ? ' ('+kItem.merk+')' : '');
      }
      var kabelStr = kabelNama || (p.kabel_item_id ? '<span style="font-family:monospace;font-size:11px;color:var(--text2)">'+_esc(p.kabel_item_id)+'</span>' : '');
      var panjangStr = p.panjang_kabel ? '<span style="font-weight:800;color:var(--c1)">'+_esc(String(p.panjang_kabel))+'</span> <span style="font-size:10px;color:var(--text3)">roll</span>' : '';
      return (kabelStr ? dr('Kabel Precon', kabelStr) : '')+
             (panjangStr ? dr('Panjang Kabel', panjangStr) : '');
    })()+
    sec('users','Petugas')+
    dr('Teknisi Pasang', p.teknisi_pasang ? '<span style="font-weight:700;color:var(--cyan)"><i class="ti ti-user-cog" style="font-size:11px"></i> '+_esc(p.teknisi_pasang)+'</span>' : '<span style="color:var(--text3)">—</span>')+
    dr('Sales / RW', p.rw ? '<span style="font-weight:700;color:var(--green)"><i class="ti ti-user-check" style="font-size:11px"></i> '+_esc(p.rw)+'</span>' : '<span style="color:var(--text3)">—</span>')+
    sec('map-pin','Lokasi & Catatan')+
    dr('Koordinat', (p.lat && p.lng) ? p.lat+', '+p.lng : '<span style="color:var(--text3)">—</span>')+
    dr('Keterangan', _esc(p.keterangan||'—'))+
    dr('Dibuat', createdStr)+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="pelDelete(\''+p.id+'\')"><i class="ti ti-trash"></i> Hapus</button>'+
    '</div>';
}

function pelOpenDet(id){
  if(!id) return;
  _pelDetId = id;


  var detBody = document.getElementById('pel-det-body');
  var detTitle = document.getElementById('pel-det-title');
  if(detTitle) detTitle.textContent = 'Memuat…';
  if(detBody) detBody.innerHTML =
    '<div style="padding:24px 0;text-align:center">'+
      '<i class="ti ti-loader-2" style="font-size:28px;color:var(--c1);animation:rot 1s linear infinite;display:block;margin-bottom:10px"></i>'+
      '<div style="font-size:12px;color:var(--text3)">Mengambil data terbaru dari server…</div>'+
    '</div>';
  document.getElementById('pel-det-overlay').classList.add('on');


  var sb = getSB();
  if(!sb){
    if(detBody) detBody.innerHTML = '<div style="padding:20px;text-align:center;color:var(--red)"><i class="ti ti-alert-triangle"></i> Koneksi tidak aktif</div>';
    return;
  }

  sb.from('pelanggan').select('*').eq('id', id).limit(1)
    .then(function(r){

      if(_pelDetId !== id) return;
      if(r.error || !r.data || !r.data.length){
        if(detBody) detBody.innerHTML = '<div style="padding:20px;text-align:center;color:var(--red)"><i class="ti ti-alert-triangle"></i> Data tidak ditemukan atau gagal dimuat.<br><small style="color:var(--text3)">'+(r.error?r.error.message:'')+'</small></div>';
        return;
      }
      var p = r.data[0];

      if(typeof _pelData !== 'undefined'){
        var idx = -1;
        for(var i=0;i<_pelData.length;i++){ if(_pelData[i].id===p.id){ idx=i; break; } }
        if(idx>=0) _pelData[idx] = p; else _pelData.push(p);
      }
      _pelDetData = p;
      _pelRenderDetBody(p);
    })
    .catch(function(e){
      if(_pelDetId !== id) return;
      if(detBody) detBody.innerHTML = '<div style="padding:20px;text-align:center;color:var(--red)"><i class="ti ti-alert-triangle"></i> Error: '+(e.message||'coba lagi')+'</div>';
    });
}

function pelCloseDet(){ document.getElementById('pel-det-overlay').classList.remove('on'); _pelDetId=null; }

var _pelDetData = null;

/* Loncat ke Peta Jaringan dan auto-zoom ke lokasi pelanggan ini.
   Dipanggil dari tombol "Lihat di Peta" di sheet detail Pelanggan. */
function pelGotoMap(){
  if(!_pelDetId || !_pelDetData) return;
  var id = _pelDetId;
  var p  = _pelDetData;

  if(!p.lat || !p.lng){
    if(typeof toast==='function') toast('Pelanggan ini belum punya koordinat lokasi','err');
    return;
  }

  pelCloseDet();
  nav('gis', null);

  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    var ready = window._gisMap && window._gisMarkers && window._gisMarkers.pel && window._gisMarkers.pel.length;
    if(ready){
      clearInterval(iv);
      var found = _gisMarkers.pel.some(function(m){ return String(m.data.id)===String(id); });
      if(found && typeof gisGotoResult==='function'){
        gisGotoResult('pel', id);
      } else if(typeof window._gisMap.setView==='function'){
        /* fallback: marker belum ke-load di GIS (mis. belum tersinkron), tetap zoom pakai koordinat langsung */
        window._gisMap.setView([p.lat, p.lng], 18, {animate:true});
      }
    } else if(tries > 40){
      clearInterval(iv);
      if(window._gisMap && typeof window._gisMap.setView==='function'){
        window._gisMap.setView([p.lat, p.lng], 18, {animate:true});
      } else if(typeof toast==='function'){
        toast('Peta belum siap, coba lagi','err');
      }
    }
  }, 200);
}

function pelDetEdit(){
  var id = _pelDetId;
  if(!id){ pelCloseDet(); return; }
  var p = (_pelData||[]).find(function(x){ return x.id===id; });
  if(p){
    pelCloseDet(); pelOpenForm(p);
    return;
  }

  var sb = getSB();
  if(!sb){ pelCloseDet(); return; }
  sb.from('pelanggan').select('*').eq('id', id).limit(1).then(function(r){
    pelCloseDet();
    if(!r.error && r.data && r.data[0]) pelOpenForm(r.data[0]);
  }).catch(function(){ pelCloseDet(); });
}

function pelDelete(id){
  var p = _getPelData().find(function(x){ return x.id===id; });
  if(!p) return;
  if(!confirm('Hapus pelanggan "'+p.nama+'" ('+p.cid+')?\nData tidak bisa dikembalikan.')) return;
  var sb = getSB();
  if(!sb){ toast('Database tidak terhubung','err'); return; }
  sb.from('pelanggan').delete().eq('id',id)
    .then(function(r){
      if(r.error){ toast('Gagal hapus: '+(r.error.message||'coba lagi'),'err'); return; }
      toast('Pelanggan "'+p.nama+'" dihapus','ok');
      pelCloseDet();
      _pelLoaded = false;
      pelLoad();
    })
    .catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });
}
var GOV = {
  projectName: 'ICRM VNEXT',
  buildVersion: '2.8.0',
  currentStageIdx: 18,
  lastUpdate: new Date().toISOString(),
  stages: [
    { id: 0,  name: 'Menu & Navigasi',                    done: true  },
    { id: 1,  name: 'Master Area & Coverage',             done: true  },
    { id: 2,  name: 'Master OLT',                         done: true  },
    { id: 3,  name: 'Master ODC',                         done: true  },
    { id: 4,  name: 'Master ODP',                         done: true  },
    { id: 5,  name: 'Port Management',                    done: true  },
    { id: 6,  name: 'Pelanggan',                          done: true  },
    { id: 7,  name: 'Approval ISP',                       done: true  },
    { id: 8,  name: 'Finance & Fee',                      done: true  },
    { id: 11, name: 'GIS & Mapping',                      done: true  },
    { id: 12, name: 'Import Export',                      done: true  },
    { id: 13, name: 'Audit Log',                          done: true  },
    { id: 14, name: 'User & Role',                        done: true  },
    { id: 15, name: 'Realtime Sync',                      done: true },
    { id: 16, name: 'Reporting',                          done: true  },
    { id: 17, name: 'Stabilization',                      done: true  },
    { id: 18, name: 'UAT',                                done: true  },
    { id: 19, name: 'Pilot',                              done: false },
    { id: 20, name: 'Go Live',                            done: false }
  ]
};
var _dashLoaded = false;
var _dashLastLoad = 0;

function _fmtRp(n){
  if(!n||isNaN(n)) return 'Rp 0';
  return 'Rp '+Number(Math.round(n)).toLocaleString('id-ID');
}

function _fmtRpShort(n){ if(!n) return 'Rp 0'; return 'Rp '+Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
function _terbilang(n){
  n = Math.round(Math.abs(n||0));
  if(n===0) return 'nol rupiah';
  var satuan=['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan',
              'sepuluh','sebelas','dua belas','tiga belas','empat belas','lima belas',
              'enam belas','tujuh belas','delapan belas','sembilan belas'];
  function ratusan(x){
    if(x===0) return '';
    if(x<20) return satuan[x];
    var r='';
    if(x>=100){ r+=(x>=100&&Math.floor(x/100)===1?'seratus':satuan[Math.floor(x/100)]+' ratus'); x=x%100; if(x) r+=' '; }
    if(x>=20){ r+=satuan[Math.floor(x/10)]+' puluh'; x=x%10; if(x) r+=' '+satuan[x]; }
    else if(x>0) r+=satuan[x];
    return r;
  }
  var parts=[];
  if(n>=1000000000){ parts.push(ratusan(Math.floor(n/1000000000))+' miliar'); n=n%1000000000; }
  if(n>=1000000){ parts.push(ratusan(Math.floor(n/1000000))+' juta'); n=n%1000000; }
  if(n>=1000){ var rb=Math.floor(n/1000); parts.push((rb===1?'seribu':ratusan(rb)+' ribu')); n=n%1000; }
  if(n>0) parts.push(ratusan(n));
  return parts.join(' ')+' rupiah';
}
function _dSet(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; }

function _drRow(lbl,val){ return '<div class="olt-det-row"><div class="olt-det-lbl">'+lbl+'</div><div class="olt-det-val">'+val+'</div></div>'; }
function _secRow(ico,t){ return '<div class="olt-det-section"><i class="ti ti-'+ico+'"></i> '+t+'</div>'; }
function _drDmt(lbl,val){ return '<div class="dmt-det-row"><div class="dmt-det-lbl">'+lbl+'</div><div class="dmt-det-val">'+val+'</div></div>'; }
function _secDmt(ico,t){ return '<div class="dmt-det-section"><i class="ti ti-'+ico+'"></i> '+t+'</div>'; }
var _DKF = { area_id:'', area_name:'', kecamatan:'', kelurahan:'', rw:'' };
var _DKF_OPTS = { areas:[], kec:[], kel:[], rw:[] };

var _DKF_BLK = {};
function _getDkfBlk(blk){
  if(!_DKF_BLK[blk]) _DKF_BLK[blk]={area_id:'',area_name:'',kecamatan:'',kelurahan:'',rw:''};
  return _DKF_BLK[blk];
}

function _getDashFilter(blk){

  if(!_isGlobalRole()){
    var sc=_getUserAreaScope();
    var areaName='';
    if(sc&&sc.area_coverage_id&&typeof _areaData!=='undefined'){
      var a=_areaData.find(function(x){return x.id===sc.area_coverage_id;});
      if(a) areaName=a.nama||'';
    }
    return {area_id:(sc&&sc.area_coverage_id)||'',area_name:areaName,kecamatan:'',kelurahan:'',rw:'',rt:''};
  }

  if(blk && blk!=='master'){
    var bf=_getDkfBlk(blk);
    return { area_id:bf.area_id, area_name:bf.area_name, kecamatan:bf.kecamatan, kelurahan:bf.kelurahan, rw:bf.rw, rt:'' };
  }

  return { area_id:_DKF.area_id, area_name:_DKF.area_name, kecamatan:_DKF.kecamatan, kelurahan:_DKF.kelurahan, rw:_DKF.rw, rt:'' };
}

function _dkFilterRowHTML(blk){
  var DF=_getDashFilter(blk);
  var locked = !_isGlobalRole();
  function opt(val,label,sel){ return '<option value="'+val+'"'+(sel?' selected':'')+'>'+label+'</option>'; }
  function sel(field,placeholder,items,labelFn,valFn){
    var html='<select data-blk="'+blk+'" data-key="'+field+'" onchange="dkFilterChange(this)"'
      + (locked?' disabled':'')
      + ' style="padding:6px 7px;border:1.5px solid var(--border2);border-radius:var(--rs);font-family:Sora,sans-serif;font-size:10.5px;background:'+(locked?'var(--bg3)':'#fff')+';color:var(--text)">';
    html+=opt('',placeholder,!DF[field]);
    items.forEach(function(it){
      var v=valFn(it), l=labelFn(it);
      html+=opt(v,l, String(DF[field]||'')===String(v));
    });
    html+='</select>';
    return html;
  }
  var html='';
  var kecOpts = window['_DKF_KEC_'+blk] || _DKF_OPTS.kec;
  var kelOpts = window['_DKF_KEL_'+blk] || _DKF_OPTS.kel;
  var rwOpts  = window['_DKF_RW_'+blk]  || _DKF_OPTS.rw;
  html+=sel('area_id','Semua Area',_DKF_OPTS.areas,function(a){return a.nama;},function(a){return a.id;});
  html+=sel('kecamatan','Semua Kecamatan',kecOpts,function(k){return k;},function(k){return k;});
  html+=sel('kelurahan','Semua Kelurahan',kelOpts,function(k){return k;},function(k){return k;});
  html+=sel('rw','Semua RW',rwOpts,function(r){return 'RW '+r;},function(r){return r;});
  return html;
}

function _dkRenderAllFilters(){
  document.querySelectorAll('.dk-blk-filter').forEach(function(el){
    var blk=el.getAttribute('data-blk');
    el.innerHTML=_dkFilterRowHTML(blk);
  });
}

function _dkRenderBlkFilter(blk){
  var el = document.querySelector('.dk-blk-filter[data-blk="'+blk+'"]');
  if(el) el.innerHTML=_dkFilterRowHTML(blk);
}
