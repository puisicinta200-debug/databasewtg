

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

