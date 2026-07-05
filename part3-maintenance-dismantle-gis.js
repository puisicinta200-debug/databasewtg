
function dkFilterChange(elOrLevel){
  if(!elOrLevel || elOrLevel.tagName!=='SELECT') return;
  var key=elOrLevel.getAttribute('data-key');
  var val=elOrLevel.value;
  var blk=elOrLevel.getAttribute('data-blk');

  if(blk && blk!=='master'){
    var bf=_getDkfBlk(blk);
    bf[key]=val;
    if(key==='area_id'){
      var a=_DKF_OPTS.areas.find(function(x){return x.id===val;});
      bf.area_name = a?a.nama:'';
      bf.kecamatan=''; bf.kelurahan=''; bf.rw='';

      _dkCascadeKec(blk, val);
    }
    if(key==='kecamatan'){ bf.kelurahan=''; bf.rw=''; _dkCascadeKel(blk, bf.area_id, val); }
    if(key==='kelurahan'){ bf.rw=''; _dkCascadeRw(blk, bf.area_id, bf.kecamatan, val); }
    _dkRenderBlkFilter(blk);
  } else {
    _DKF[key]=val;
    if(key==='area_id'){
      var am=_DKF_OPTS.areas.find(function(x){return x.id===val;});
      _DKF.area_name = am?am.nama:'';
      _DKF.kecamatan=''; _DKF.kelurahan=''; _DKF.rw='';
    }
    if(key==='kecamatan'){ _DKF.kelurahan=''; _DKF.rw=''; }
    if(key==='kelurahan'){ _DKF.rw=''; }
  }

  _dkRefreshBlk(blk);
}

function _dkKecForArea(areaId){
  var pel=(window._DKF_PEL_LOC||[]);
  var kecs=[];
  pel.forEach(function(p){
    if(areaId && p.area_id!==areaId) return;
    if(p.kecamatan && kecs.indexOf(p.kecamatan)<0) kecs.push(p.kecamatan);
  });
  if(!kecs.length) kecs=_DKF_OPTS.kec.slice();
  return kecs.sort();
}
function _dkKelForKec(areaId, kec){
  var pel=(window._DKF_PEL_LOC||[]);
  var kels=[];
  pel.forEach(function(p){
    if(areaId && p.area_id!==areaId) return;
    if(kec && p.kecamatan!==kec) return;
    if(p.kelurahan && kels.indexOf(p.kelurahan)<0) kels.push(p.kelurahan);
  });
  if(!kels.length) kels=_DKF_OPTS.kel.slice();
  return kels.sort();
}
function _dkRwForKel(areaId, kec, kel){
  var pel=(window._DKF_PEL_LOC||[]);
  var rws=[];
  pel.forEach(function(p){
    if(areaId && p.area_id!==areaId) return;
    if(kec && p.kecamatan!==kec) return;
    if(kel && p.kelurahan!==kel) return;
    if(p.rw!=null && rws.indexOf(String(p.rw))<0) rws.push(String(p.rw));
  });
  if(!rws.length) rws=_DKF_OPTS.rw.slice();
  return rws.sort(function(a,b){return (parseInt(a)||0)-(parseInt(b)||0);});
}
function _dkCascadeKec(blk, areaId){

  var kecs = _dkKecForArea(areaId);
  window['_DKF_KEC_'+blk] = kecs;
}
function _dkCascadeKel(blk, areaId, kec){
  var kels = _dkKelForKec(areaId, kec);
  window['_DKF_KEL_'+blk] = kels;
}
function _dkCascadeRw(blk, areaId, kec, kel){
  var rws = _dkRwForKel(areaId, kec, kel);
  window['_DKF_RW_'+blk] = rws;
}
function _dkRefreshBlk(blk){


  if(window._dkBlkFns && window._dkBlkFns[blk]) window._dkBlkFns[blk]();
}
function _dashRenderTarget(totalAktif, pelData, sortedArea, sb, _retry){
  var el = document.getElementById('dk-target-utilisasi');
  if(!el) return;
  _retry = _retry || 0;


  if((typeof _areaData==='undefined' || !_areaData.length) && _retry < 1){
    sb.from('areas').select('id,nama,kode').order('nama').then(function(r){
      if(!r.error && r.data) _areaData = r.data;
      _dashRenderTarget(totalAktif, pelData, sortedArea, sb, _retry+1);
    }).catch(function(){ _dashRenderTarget(totalAktif, pelData, sortedArea, sb, _retry+1); });
    return;
  }

  if(typeof _areaData==='undefined') _areaData = [];


  var odpSrc = (typeof _odpData!=='undefined' && _odpData.length) ? _odpData
               : (typeof _pelOdpList!=='undefined' && _pelOdpList.length) ? _pelOdpList : null;

  function _render(odps){

    if(!_isGlobalRole()){
      var _sc = _getUserAreaScope();
      if(_sc && _sc.area_coverage_id){
        odps = odps.filter(function(o){ return o.area_id === _sc.area_coverage_id; });
      }
    }


    var kapMap = {};
    odps.forEach(function(o){
      if(o.status && o.status!=='aktif') return;
      var a = o.area_id || '—';
      kapMap[a] = (kapMap[a]||0) + (parseInt(o.jumlah_port)||0);
    });
    var totalKap = Object.values ? Object.keys(kapMap).reduce(function(s,k){return s+kapMap[k];},0)
                  : (function(){ var s=0; for(var k in kapMap) s+=kapMap[k]; return s; })();


    var pelMap = window.SOT
      ? SOT.networkActiveByAreaFromList(pelData)
      : (function(){
          var m={};
          pelData.forEach(function(p){
            if(p.status!=='aktif' && p.status!=='maintenance') return;
            var a=p.area_id||'—'; m[a]=(m[a]||0)+1;
          });
          return m;
        })();


    totalAktif = 0;
    for(var _ka in pelMap) totalAktif += pelMap[_ka];


    var aNm = {};
    if(typeof _areaData!=='undefined') _areaData.forEach(function(a){ aNm[a.id]=a.nama||a.kode||'Area'; });

    var allPct  = totalKap>0 ? Math.round(totalAktif/totalKap*100) : 0;
    var allSisa = totalKap - totalAktif;
    var allBarC = allPct>=80?'#22c55e':allPct>=50?'#f59e0b':'#ef4444';
    var allLabel = allPct>=80?'🟢 Baik':allPct>=50?'🟡 Berkembang':'🔴 Perlu Dorong';

    var h = '';


    var heroLabel = 'Semua Area';
    if(!_isGlobalRole()){
      var _heroLbl = (typeof _getAreaScopeLabel==='function') ? _getAreaScopeLabel() : '';
      heroLabel = (_heroLbl && _heroLbl!=='Area tidak diset' && _heroLbl!=='Belum ditentukan') ? _heroLbl : 'Area Saya';
    }


    h += '<div style="background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--r);padding:14px;margin-bottom:8px">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    h += '<div>';
    h += '<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">'+_esc(heroLabel)+'</div>';
    h += '<div style="font-size:11px;font-weight:700;color:var(--text2)">'+totalAktif+' aktif <span style="color:var(--text3);font-weight:500">dari</span> '+totalKap+' kapasitas</div>';
    h += '</div>';
    h += '<div style="text-align:right">';
    h += '<div style="font-size:32px;font-weight:800;font-family:JetBrains Mono,monospace;color:'+allBarC+';line-height:1">'+allPct+'<span style="font-size:16px">%</span></div>';
    h += '<div style="font-size:10px;font-weight:700;color:var(--text3);margin-top:2px">'+allLabel+'</div>';
    h += '</div>';
    h += '</div>';
    h += '<div style="height:10px;background:var(--bg4);border-radius:5px;overflow:hidden;margin-bottom:6px">';
    h += '<div style="height:10px;background:'+allBarC+';border-radius:5px;width:'+allPct+'%;transition:width .6s"></div></div>';
    h += '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700">';
    h += '<span style="color:var(--text3)">Sisa belum terisi</span>';
    h += '<span style="color:'+(allSisa>0?'var(--c1)':'var(--green)')+'">'+allSisa+' port</span>';
    h += '</div></div>';



    var areaKeys = {};
    for(var k in kapMap) areaKeys[k]=true;
    for(var k in pelMap) areaKeys[k]=true;
    var areaList = Object.keys(areaKeys).map(function(a){
      var kap = kapMap[a]||0, pel = pelMap[a]||0;
      return { id:a, nama: aNm[a]||'Area', kap:kap, pel:pel,
               pct: kap>0?Math.round(pel/kap*100):0 };
    }).sort(function(a,b){ return b.pct-a.pct; });

    if(areaList.length){
      h += '<div style="background:var(--bg2);border:1.5px solid var(--border2);border-radius:var(--r);overflow:hidden">';
      areaList.forEach(function(a, i){
        var bc = a.pct>=80?'#22c55e':a.pct>=50?'#f59e0b':'#ef4444';
        var sisa = a.kap - a.pel;
        var isLast = i===areaList.length-1;
        h += '<div style="padding:10px 12px;'+(isLast?'':'border-bottom:1px solid var(--border)')+'">';
        h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">';
        h += '<div style="font-size:12px;font-weight:700;color:var(--text)">📍 '+_esc(a.nama)+'</div>';
        h += '<div style="display:flex;align-items:center;gap:6px">';
        h += '<span style="font-size:10px;color:var(--text3);font-weight:600">'+a.pel+'/'+a.kap+'</span>';
        h += '<span style="font-size:13px;font-weight:800;color:'+bc+';font-family:JetBrains Mono,monospace;min-width:38px;text-align:right">'+a.pct+'%</span>';
        h += '</div></div>';
        h += '<div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden;margin-bottom:4px">';
        h += '<div style="height:6px;background:'+bc+';border-radius:3px;width:'+a.pct+'%;transition:width .5s"></div></div>';
        h += '<div style="font-size:10px;color:var(--text3);font-weight:600">';
        h += sisa>0 ? 'Perlu <b style="color:var(--c1)">'+sisa+'</b> pelanggan lagi ke 100%'
                    : '<span style="color:var(--green)">✅ Kapasitas penuh</span>';
        h += '</div></div>';
      });
      h += '</div>';
    }

    el.innerHTML = h;
  }

  if(odpSrc){
    _render(odpSrc);
  } else {

    el.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text3);font-size:11px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i> Menghitung kapasitas…</div>';
    var qOdpTarget = sb.from('odps').select('id,area_id,jumlah_port,status').limit(5000);

    if(!_isGlobalRole()){
      var _scFetch = _getUserAreaScope();
      if(_scFetch && _scFetch.area_coverage_id){
        qOdpTarget = qOdpTarget.eq('area_id', _scFetch.area_coverage_id);
      }
    }
    qOdpTarget.then(function(r){
      if(r.error||!r.data||!r.data.length){
        el.innerHTML='<div style="text-align:center;padding:12px;color:var(--text3);font-size:11px">Data kapasitas belum tersedia</div>';
        return;
      }

      if(_isGlobalRole()) _odpData = r.data;
      _render(r.data);
    }).catch(function(){ el.innerHTML=''; });
  }
}

function _dashWatchdog(){
  ['dk-target-utilisasi','dk-top-area'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el || !el.querySelector('.ti-loader-2')) return;
    el.innerHTML =
      '<div style="text-align:center;padding:16px;color:var(--text3);font-size:11px;background:var(--bg2);border:1.5px dashed var(--border3);border-radius:var(--r)">'+
        '<i class="ti ti-alert-triangle" style="font-size:20px;display:block;margin-bottom:6px;color:var(--c2);opacity:.7"></i>'+
        'Data belum berhasil dimuat. Periksa kembali Master Area, lalu coba lagi.<br>'+
        '<button onclick="dashLoad()" style="margin-top:8px;background:var(--c1);color:#fff;border:none;border-radius:8px;padding:6px 14px;font-family:Sora,sans-serif;font-size:11px;font-weight:700;cursor:pointer">Coba Lagi</button>'+
      '</div>';
  });
}
function dashLoad(){

  var _now = Date.now();
  var _manualRefresh = document.activeElement && document.activeElement.onclick &&
    (document.activeElement.id === 'dash-refresh-ico' || document.activeElement.closest && document.activeElement.closest('.dash-sync-refresh'));
  if(_dashLoaded && !_manualRefresh && (_now - _dashLastLoad < 5000)){ return; }
  _dashLastLoad = _now;
  var sb = getSB();
  var ico = document.getElementById('dash-refresh-ico');
  if(ico){ ico.style.animation='rot .6s linear infinite'; }
  _dSet('dash-sync-time','Memuat data…');
  var dot=document.getElementById('dash-sync-dot');
  if(dot){ dot.className='dash-sync-dot ld'; }


  if(typeof _dashInitFilterBar==='function'){
    try{ _dashInitFilterBar(); }catch(e){ console.error('[dashLoad] _dashInitFilterBar error:',e); }
  } else {
    console.error('[dashLoad] _dashInitFilterBar belum terdefinisi saat dipanggil — dilewati.');
  }


  if(_isSuperAdmin()){
    if(window._dashWatchdogTimer) clearTimeout(window._dashWatchdogTimer);
    window._dashWatchdogTimer = setTimeout(_dashWatchdog, 9000);
  }


  (function(){
    var h = new Date().getHours();
    var gr = h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam';
    _dSet('dash-greet-time', gr);
    var name = (CU && (CU.nama||CU.username)) || 'Admin';
    _dSet('dash-greet-name', name);
    var gSub = document.getElementById('dash-greet-area');
    if(gSub){
      if(!_isGlobalRole()){
        gSub.textContent = '📍 '+_getAreaScopeLabel();
        gSub.style.display = '';
      } else {
        gSub.style.display = 'none';
      }
    }
  })();

  if(!sb){
    _dSet('dash-sync-time','Database tidak terhubung');
    if(ico) ico.style.animation='';
    if(dot) dot.className='dash-sync-dot err';
    return;
  }

  var now = new Date();
  var todayStr = now.toISOString().slice(0,10);
  var mm = ('0'+(now.getMonth()+1)).slice(-2);
  var yy = now.getFullYear();
  var bulanIni = yy+'-'+mm;

  var done = 0, total = 6;
  /* Watchdog: pastikan spinner berhenti setelah max 8 detik */
  var _tickWatchdog = setTimeout(function(){
    var ico2 = document.getElementById('dash-refresh-ico');
    var dot2 = document.getElementById('dash-sync-dot');
    if(ico2) ico2.style.animation = '';
    if(dot2) dot2.className = 'dash-sync-dot ok';
    var now2 = new Date();
    var pad2 = function(n){ return n<10?'0'+n:n; };
    _dSet('dash-sync-time', 'Update: '+pad2(now2.getHours())+':'+pad2(now2.getMinutes())+':'+pad2(now2.getSeconds())+' · Selesai');
    _dashLoaded = true;
    /* Trigger hero update setelah data pasti sudah ada */
    if(typeof _updateHero === 'function') setTimeout(_updateHero, 100);
  }, 8000);
  function tick(){
    done++;
    if(done>=total){
      clearTimeout(_tickWatchdog);
      if(ico) ico.style.animation='';
      if(dot) dot.className='dash-sync-dot ok';
      var pad=function(n){return n<10?'0'+n:n;};
      _dSet('dash-sync-time','Update: '+pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds())+' · Selesai');
      _dashLoaded=true;
      if(typeof _updateHero==='function') setTimeout(_updateHero, 100);
    }
  }



  function renderRankList(elId, items, labelFn, valFn, color){
    var el=document.getElementById(elId); if(!el) return;
    if(!items||!items.length){ el.innerHTML='<div style="color:var(--text3);font-size:11px;padding:10px;background:var(--bg2);border-radius:var(--rs);text-align:center"><i class=\"ti ti-chart-off\"></i> Tidak ada data</div>'; return; }

    var top5 = items.slice(0,5);
    var total = top5.reduce(function(s,x){ return s+valFn(x); },0);
    var maxVal = valFn(top5[0]) || 1;


    var PALETTES = {
      'var(--c1)':  ['#1a56db','#3b82f6','#60a5fa','#93c5fd','#bfdbfe'],
      'var(--red)': ['#dc2626','#ef4444','#f87171','#fca5a5','#fecaca'],
      'var(--pu)':  ['#7c3aed','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe'],
      'var(--c2)':  ['#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5'],
      'var(--cyan)':['#0891b2','#06b6d4','#22d3ee','#67e8f9','#a5f3fc'],
      'var(--green)':['#059669','#10b981','#34d399','#6ee7b7','#a7f3d0'],
    };
    var palette = PALETTES[color] || PALETTES['var(--c1)'];


    var cx=60, cy=60, r=46, ri=30;
    var circ = 2*Math.PI*r;
    var offset = 0;

    var GAP = total > 1 ? 2 : 0;
    var segments = top5.map(function(item, i){
      var v = valFn(item);
      var frac = total>0 ? v/total : 0;
      var dash = Math.max(0, frac*circ - GAP);
      var seg = '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"'+
        ' fill="none"'+
        ' stroke="'+palette[i]+'"'+
        ' stroke-width="'+(ri===30?16:14)+'"'+
        ' stroke-dasharray="'+dash.toFixed(2)+' '+(circ-dash).toFixed(2)+'"'+
        ' stroke-dashoffset="'+(-offset).toFixed(2)+'"'+
        ' style="transition:stroke-dasharray .5s ease;transform:rotate(-90deg);transform-origin:'+cx+'px '+cy+'px"'+
        '/>';
      offset += frac*circ;
      return seg;
    });


    var centerSVG = '<text x="'+cx+'" y="'+(cy-6)+'" text-anchor="middle" font-size="20" font-weight="800" fill="#1e2a45" font-family="Sora,sans-serif">'+total+'</text>'+
      '<text x="'+cx+'" y="'+(cy+10)+'" text-anchor="middle" font-size="9" fill="#8494b2" font-family="Sora,sans-serif">TOTAL</text>';

    var svgDonut = '<svg width="120" height="120" viewBox="0 0 120 120">'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(26,86,219,.07)" stroke-width="16"/>'+
      segments.join('')+
      centerSVG+
    '</svg>';


    var rows = top5.map(function(item,i){
      var v = valFn(item);
      var pct = maxVal>0 ? Math.round(v/maxVal*100) : 0;
      var medals = ['🥇','🥈','🥉','④','⑤'];
      return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">' +
        '<div style="width:22px;height:22px;border-radius:50%;background:'+palette[i]+';display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
          '<span style="font-size:10px;font-weight:800;color:#fff">'+(i+1)+'</span>'+
        '</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:11px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(labelFn(item))+'</div>'+
          '<div style="background:rgba(26,86,219,.07);border-radius:99px;height:4px;margin-top:3px;overflow:hidden">'+
            '<div style="height:4px;border-radius:99px;background:'+palette[i]+';width:'+pct+'%;transition:width .5s ease"></div>'+
          '</div>'+
        '</div>'+
        '<span style="font-size:13px;font-weight:800;color:'+palette[i]+';flex-shrink:0;min-width:24px;text-align:right">'+v+'</span>'+
      '</div>';
    }).join('');

    el.innerHTML =
      '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);overflow:hidden">'+
        '<div style="display:flex;align-items:center;gap:8px;padding:12px 12px 6px">'+
          '<div style="flex-shrink:0">'+svgDonut+'</div>'+
          '<div style="flex:1;min-width:0;padding-right:4px">'+rows+'</div>'+
        '</div>'+
      '</div>';
  }

  function renderFinList(elId, items, labelFn, valFn, color){
    var el=document.getElementById(elId); if(!el) return;
    if(!items||!items.length){ el.innerHTML='<div style="color:var(--text3);font-size:11px;padding:8px;background:var(--bg2);border-radius:var(--rs)">Tidak ada data</div>'; return; }
    el.innerHTML = items.slice(0,5).map(function(item,i){
      return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);padding:9px 11px;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">'+
        '<span style="font-size:11px;font-weight:700;color:var(--text);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(i+1)+'. '+_esc(labelFn(item))+'</span>'+
        '<span style="font-size:11px;font-weight:800;color:'+(color||'var(--c1)')+';margin-left:8px;flex-shrink:0">'+_fmtRp(valFn(item))+'</span>'+
      '</div>';
    }).join('');
  }


  (function(){
    var FREE_TYPES=JENIS_GRATIS;
    var PAID_TYPES=['Reguler','UMKM','Corporate'];
    var DF = _getDashFilter('1');
    var qPel = sb.from('pelanggan').select('id,status,jenis_pelanggan,area_id,area_coverage,kecamatan,kelurahan,rw,rt,tgl_pasang,created_at').order('created_at',{ascending:false});
    if(!_isGlobalRole()){
      var sc = _getUserAreaScope();
      if(sc && sc.area_coverage_id){
        qPel = qPel.eq('area_id', sc.area_coverage_id); // SOT
      }
    }
    qPel.then(function(r){
      if(r.error||!r.data){

        console.error('[dashLoad BLOK1] query pelanggan gagal:', r.error);
        var elTopArea0=document.getElementById('dk-top-area');
        if(elTopArea0) elTopArea0.innerHTML='<div style="color:var(--text3);font-size:11px;padding:10px;background:var(--bg2);border-radius:var(--rs);text-align:center">Gagal memuat ringkasan area</div>';
        var elTU0=document.getElementById('dk-target-utilisasi');
        if(elTU0) elTU0.innerHTML='<div style="text-align:center;padding:12px;color:var(--text3);font-size:11px">Gagal memuat data utilisasi</div>';
        _dSet('dk-pel-suspend','0'); _dSet('dk-pel-cabut','0');
        tick(); return;
      }
      try{
      var d=r.data||[];

      d = _applyDashFilterClient(d, DF);
      /* SSOT: total = aktif + suspend + cabut SAJA (proses tidak dihitung) */
      var aktifRaw=d.filter(function(p){return p.status==='aktif'||p.status==='maintenance';}).length;
      var aktif=aktifRaw;
      var totalAktifSemua=aktifRaw;
      var suspend=d.filter(function(p){return p.status==='suspend';}).length;
      var cabut=d.filter(function(p){return p.status==='cabut';}).length;
      /* total TANPA proses — sesuai prinsip dashboard */
      var total = aktif + suspend + cabut;

      if(!DF.area_id && window.SOT && typeof SOT.customerStats==='function'){
        var scopeAid = (!_isGlobalRole() && _getUserAreaScope()) ? _getUserAreaScope().area_coverage_id : null;
        var csSot = SOT.customerStats(scopeAid);
        if(csSot && csSot.raw && csSot.raw.length){
          /* Override dari SOT — hitung ulang tanpa proses */
          var _raw = csSot.raw;
          aktif   = _raw.filter(function(p){return p.status==='aktif';}).length;
          suspend = _raw.filter(function(p){return p.status==='suspend';}).length;
          cabut   = _raw.filter(function(p){return p.status==='cabut';}).length;
          total   = aktif + suspend + cabut; /* TANPA proses */
          totalAktifSemua = (typeof SOT.networkActiveStats==='function') ? SOT.networkActiveStats(scopeAid).aktif : aktif;
        }
      }
      var berbayar=d.filter(function(p){return PAID_TYPES.indexOf(p.jenis_pelanggan||'Reguler')>=0;}).length;
      var fasum=d.filter(function(p){return p.jenis_pelanggan==='FASUM';}).length;
      var odpTempel=d.filter(function(p){return p.jenis_pelanggan==='ODP_TEMPEL';}).length;
      var odcTempel=d.filter(function(p){return p.jenis_pelanggan==='ODC_TEMPEL';}).length;
      var gratis=fasum+odpTempel+odcTempel;


      _dSet('dk-pel-total', total);
      _dSet('dk-pel-aktif', aktif);
      _dSet('dk-pel-suspend', suspend);
      _dSet('dk-pel-cabut', cabut);
      _dSet('dk-pel-pct', total>0?aktif+' berbayar aktif dari '+total+' total':'');
      _dSet('dk-pel-berbayar', berbayar);
      _dSet('dk-pel-gratis', gratis);
      _dSet('dk-pel-fasum', fasum);
      _dSet('dk-pel-odp-tempel', odpTempel);
      _dSet('dk-pel-odc-tempel', odcTempel);

      _dSet('dk-bd-fasum', fasum);
      _dSet('dk-bd-odp', odpTempel);
      _dSet('dk-bd-odc', odcTempel);
      _dSet('dk-bd-total-aktif', totalAktifSemua);

      var barPct = total > 0 ? Math.min(100, Math.round(aktif/total*100)) : 0;
      var barEl = document.getElementById('dk-aktif-bar'); if(barEl) barEl.style.width = barPct+'%';


      var _aNmDash={};
      if(typeof _areaData!=='undefined' && _areaData){
        _areaData.forEach(function(a){ _aNmDash[a.id]=a.nama||a.kode||a.id; });
      } else if(window.SOT){ (SOT.cache().areas||[]).forEach(function(a){ _aNmDash[a.id]=a.nama||a.kode||a.id; }); }
      var byArea={}, byKec={}, byKel={}, byRw={}, byRt={};
      d.forEach(function(p){

        if(window.SOT ? !SOT.isPortActive(p) : (p.status!=='aktif' && p.status!=='maintenance')) return;

        var ar=(_aNmDash[p.area_id])||p.area_coverage||'Tanpa Area';
        byArea[ar]=(byArea[ar]||0)+1;
        if(p.kecamatan){ var kec=p.kecamatan; byKec[kec]=(byKec[kec]||0)+1; }
        if(p.kelurahan){ var kel=p.kelurahan; byKel[kel]=(byKel[kel]||0)+1; }
        if(p.rw){
          var rwKey=(p.kelurahan||'?')+' · RW '+p.rw;
          if(!byRw[rwKey]) byRw[rwKey]={label:rwKey,count:0};
          byRw[rwKey].count++;
        }
        if(p.rt){
          var rtKey=(p.kelurahan||'?')+' RW '+p.rw+' RT '+p.rt;
          if(!byRt[rtKey]) byRt[rtKey]={label:rtKey,count:0};
          byRt[rtKey].count++;
        }
      });


      function sortDesc(obj){ return Object.keys(obj).map(function(k){return {k:k,v:obj[k]};}).sort(function(a,b){return b.v-a.v;}); }
      var sortedArea=sortDesc(byArea);
      var sortedKec=sortDesc(byKec);
      var sortedKel=sortDesc(byKel);
      var sortedRw=Object.values(byRw).sort(function(a,b){return b.count-a.count;});
      var sortedRt=Object.values(byRt).sort(function(a,b){return b.count-a.count;});


      _dSet('dk-wil-kec', Object.keys(byKec).length);
      _dSet('dk-wil-kel', Object.keys(byKel).length);
      _dSet('dk-wil-rw', Object.keys(byRw).length);
      _dSet('dk-wil-rt', Object.keys(byRt).length);


      renderRankList('dk-top-area', sortedArea, function(x){return x.k;}, function(x){return x.v;}, 'var(--c1)');


      _dashRenderTarget(aktif, d, sortedArea, sb);


      var botArea=[].concat(sortedArea).reverse();
      renderRankList('dk-bot-area', botArea, function(x){return x.k;}, function(x){return x.v;}, 'var(--red)');


      renderRankList('dk-top-rw', sortedRw, function(x){return x.label;}, function(x){return x.count;}, 'var(--pu)');


      var botRw=[].concat(sortedRw).reverse();
      renderRankList('dk-bot-rw', botRw, function(x){return x.label;}, function(x){return x.count;}, 'var(--c2)');


      var hari=d.filter(function(p){return (p.tgl_pasang||'').slice(0,10)===todayStr;});
      var bln=d.filter(function(p){return (p.tgl_pasang||'').slice(0,7)===bulanIni;});
      _dSet('dk-psng-hari-total', hari.length);
      _dSet('dk-psng-bln-total', bln.length);

      /* ── Sparkline + enriched pasang baru ── */
      (function(){
        try {
          var today = new Date();
          var getDateStr = function(daysAgo){
            var dt = new Date(today);
            dt.setDate(dt.getDate() - daysAgo);
            return dt.toISOString().slice(0, 10);
          };

          /* ── 1. Sparkline 30 hari ── */
          var counts = [];
          for (var i = 29; i >= 0; i--) {
            var ds = getDateStr(i);
            counts.push(d.filter(function(p){ return (p.tgl_pasang||'').slice(0,10) === ds; }).length);
          }
          var maxVal = Math.max.apply(null, counts); if (maxVal < 1) maxVal = 1;
          var W = 200, H = 30, pad = 3;
          var pts = counts.map(function(v, idx){
            var x = Math.round((idx / (counts.length - 1)) * W);
            var y = Math.round(pad + (1 - v / maxVal) * (H - pad * 2));
            return x + ',' + y;
          }).join(' ');
          var lastY = Math.round(pad + (1 - counts[29] / maxVal) * (H - pad * 2));
          var line = document.getElementById('dk-psng-spark-line');
          var dot  = document.getElementById('dk-psng-spark-dot');
          if (line) { line.setAttribute('points', pts); line.setAttribute('stroke', '#0891b2'); }
          if (dot)  { dot.setAttribute('cx', W); dot.setAttribute('cy', lastY); }

          /* ── 2. Badge % bulan vs bulan lalu ── */
          var prevBln = new Date(today); prevBln.setMonth(prevBln.getMonth() - 1);
          var prevBlnStr = prevBln.toISOString().slice(0, 7);
          var blnLaluArr = d.filter(function(p){ return (p.tgl_pasang||'').slice(0,7) === prevBlnStr; });
          var badge = document.getElementById('dk-psng-pct-badge');
          if (badge && blnLaluArr.length > 0) {
            var pctBln = Math.round(((bln.length - blnLaluArr.length) / blnLaluArr.length) * 100);
            var upBln = pctBln >= 0;
            badge.style.display = 'inline-flex';
            badge.style.background = upBln ? '#dcfce7' : '#fee2e2';
            badge.style.color = upBln ? '#059669' : '#dc2626';
            badge.textContent = (upBln ? '↑ +' : '↓ ') + pctBln + '%';
          }

          /* ── 3. Mini stats: kemarin, minggu ini, rata-rata harian ── */
          var kemarin = d.filter(function(p){ return (p.tgl_pasang||'').slice(0,10) === getDateStr(1); }).length;
          var mingguIni = 0;
          for (var j = 0; j < 7; j++) {
            var dj = getDateStr(j);
            mingguIni += d.filter(function(p){ return (p.tgl_pasang||'').slice(0,10) === dj; }).length;
          }
          var avg30 = counts.reduce(function(a,b){ return a+b; }, 0) / 30;
          var elK = document.getElementById('dk-psng-kemarin');
          var elM = document.getElementById('dk-psng-minggu');
          var elA = document.getElementById('dk-psng-avg');
          if (elK) elK.textContent = kemarin;
          if (elM) elM.textContent = mingguIni;
          if (elA) elA.textContent = avg30 % 1 === 0 ? avg30 : avg30.toFixed(1);

          /* ── 4. Trend flag: 7 hari ini vs 7 hari lalu ── */
          var tujuhLalu = 0;
          for (var k = 7; k < 14; k++) {
            var dk2 = getDateStr(k);
            tujuhLalu += d.filter(function(p){ return (p.tgl_pasang||'').slice(0,10) === dk2; }).length;
          }
          var el7h = document.getElementById('dk-psng-7hari');
          var el7l = document.getElementById('dk-psng-7lalu');
          var el7t = document.getElementById('dk-psng-7trend');
          if (el7h) el7h.textContent = mingguIni;
          if (el7l) el7l.textContent = tujuhLalu;
          if (el7t && tujuhLalu > 0) {
            var pct7 = Math.round(((mingguIni - tujuhLalu) / tujuhLalu) * 100);
            el7t.textContent = (pct7 >= 0 ? '↑ +' : '↓ ') + pct7 + '%';
            el7t.style.color = pct7 >= 0 ? '#059669' : '#dc2626';
          } else if (el7t && tujuhLalu === 0 && mingguIni > 0) {
            el7t.textContent = '↑ baru';
            el7t.style.color = '#059669';
          }

          /* ── 5. Top area mini hari ini ── */
          var byArea = {};
          hari.forEach(function(p){
            var ar = (_aNmDash && _aNmDash[p.area_id]) || p.area_coverage || '?';
            byArea[ar] = (byArea[ar] || 0) + 1;
          });
          var sortedA = Object.keys(byArea).map(function(k){ return {k:k, v:byArea[k]}; })
                              .sort(function(a,b){ return b.v - a.v; }).slice(0, 4);
          var elAreaMini = document.getElementById('dk-psng-area-mini');
          if (elAreaMini) {
            if (sortedA.length === 0) {
              elAreaMini.innerHTML = '<div style="font-size:10px;color:var(--text3);text-align:center;padding:4px">Belum ada pasang hari ini</div>';
            } else {
              var maxA = sortedA[0].v;
              elAreaMini.innerHTML = sortedA.map(function(a){
                var pctW = Math.round((a.v / maxA) * 100);
                return '<div style="display:flex;align-items:center;gap:7px">' +
                  '<div style="font-size:9px;color:var(--text3);width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + a.k + '</div>' +
                  '<div style="flex:1;height:5px;background:rgba(8,145,178,.15);border-radius:3px;overflow:hidden">' +
                    '<div style="width:' + pctW + '%;height:100%;background:#0891b2;border-radius:3px"></div>' +
                  '</div>' +
                  '<div style="font-size:9px;font-weight:700;color:#0891b2;width:14px;text-align:right">' + a.v + '</div>' +
                '</div>';
              }).join('');
            }
          }

        } catch(e) {}
      })();

      function rankFrom(arr){
        var ba={},bk={},bl={},br={};
        arr.forEach(function(p){
          var ar=(_aNmDash[p.area_id])||p.area_coverage||'?'; ba[ar]=(ba[ar]||0)+1;
          if(p.kecamatan){ var kc=p.kecamatan; bk[kc]=(bk[kc]||0)+1; }
          if(p.kelurahan){ var kl=p.kelurahan; bl[kl]=(bl[kl]||0)+1; }
          if(p.rw){ var rk=(p.kelurahan||'?')+' RW '+p.rw; if(!br[rk]) br[rk]={label:rk,count:0}; br[rk].count++; }
        });
        return {a:sortDesc(ba),k:sortDesc(bk),l:sortDesc(bl),r:Object.values(br).sort(function(a,b){return b.count-a.count;})};
      }
      var h7=rankFrom(hari), b7=rankFrom(bln);
      renderRankList('dk-psng-top-area-hari',h7.a,function(x){return x.k;},function(x){return x.v;},'var(--cyan)');
      renderRankList('dk-psng-top-kec-hari', h7.k,function(x){return x.k;},function(x){return x.v;},'var(--cyan)');
      renderRankList('dk-psng-top-kel-hari', h7.l,function(x){return x.k;},function(x){return x.v;},'var(--cyan)');
      renderRankList('dk-psng-top-rw-hari',  h7.r,function(x){return x.label;},function(x){return x.count;},'var(--cyan)');
      renderRankList('dk-psng-top-area-bln', b7.a,function(x){return x.k;},function(x){return x.v;},'var(--c1)');
      renderRankList('dk-psng-top-kec-bln',  b7.k,function(x){return x.k;},function(x){return x.v;},'var(--c1)');
      renderRankList('dk-psng-top-kel-bln',  b7.l,function(x){return x.k;},function(x){return x.v;},'var(--c1)');
      renderRankList('dk-psng-top-rw-bln',   b7.r,function(x){return x.label;},function(x){return x.count;},'var(--c1)');


      renderRankList('dk-sales-top-rw',   sortedRw,  function(x){return x.label;}, function(x){return x.count;}, 'var(--pu)');
      renderRankList('dk-sales-top-rt',   sortedRt,  function(x){return x.label;}, function(x){return x.count;}, 'var(--pu)');
      renderRankList('dk-sales-top-area', sortedArea, function(x){return x.k;},    function(x){return x.v;},     'var(--pu)');

      tick();
      } catch(e){


        var elTopArea=document.getElementById('dk-top-area');
        if(elTopArea) elTopArea.innerHTML='<div style="color:var(--text3);font-size:11px;padding:10px;background:var(--bg2);border-radius:var(--rs);text-align:center">Gagal memuat ringkasan area</div>';
        var elTU=document.getElementById('dk-target-utilisasi');
        if(elTU) elTU.innerHTML='<div style="text-align:center;padding:12px;color:var(--text3);font-size:11px">Gagal memuat data utilisasi</div>';
        tick();
      }
    }).catch(function(e){ console.warn('dashLoad pel error',e); tick(); });
  })();


  (function(){
    var qArea = sb.from('areas').select('id,nama,status').order('nama');
    qArea.then(function(r){
      if(!r.error&&r.data) _dSet('dk-wil-area', r.data.length);
      tick();
    }).catch(function(){ tick(); });
  })();


  (function(){
    var DF = _getDashFilter('13');
    var qOlt=sb.from('olts').select('id,status,area_id');
    var qOdc=sb.from('odcs').select('id,status,area_id');
    var qOdp=sb.from('odps').select('id,status,area_id,jumlah_port');
    if(!_isGlobalRole()){
      var sc=_getUserAreaScope();
      if(sc&&sc.area_coverage_id){
        qOlt=qOlt.eq('area_id',sc.area_coverage_id);
        qOdc=qOdc.eq('area_id',sc.area_coverage_id);
        qOdp=qOdp.eq('area_id',sc.area_coverage_id);
      }
    } else if(DF.area_id){
      qOlt=qOlt.eq('area_id',DF.area_id);
      qOdc=qOdc.eq('area_id',DF.area_id);
      qOdp=qOdp.eq('area_id',DF.area_id);
    }
    Promise.all([qOlt,qOdc,qOdp]).then(function(res){
      var olt=res[0],odc=res[1],odp=res[2];
      if(!olt.error&&olt.data){ _dSet('dk-olt-total',olt.data.length); _dSet('dk-olt-aktif',olt.data.filter(function(o){return o.status==='aktif';}).length); }
      if(!odc.error&&odc.data){ _dSet('dk-odc-total',odc.data.length); _dSet('dk-odc-aktif',odc.data.filter(function(o){return o.status==='aktif';}).length); }

      if(!odp.error&&odp.data){
        var odpData=odp.data||[];
        _dSet('dk-odp-total',odpData.length);
        _dSet('dk-odp-aktif',odpData.filter(function(o){return o.status==='aktif';}).length);


        var odpIds = odpData.map(function(o){return o.id;});

        var qPort = sb.from('odp_ports').select('id,status,odp_id');
        if(odpIds.length > 0 && odpIds.length <= 50){

          qPort = qPort.in('odp_id', odpIds);
        } else if(DF.area_id || (!_isGlobalRole() && _getUserAreaScope()&&_getUserAreaScope().area_coverage_id)){

          var aId = DF.area_id || (_getUserAreaScope()&&_getUserAreaScope().area_coverage_id)||'';
          if(aId) qPort = qPort.eq('area_id', aId);
        }
        qPort.then(function(rp){
          var pd = (!rp.error&&rp.data) ? rp.data : [];

          if(!pd.length && odpData.length){
            var pTotal=0,pUsed=0;
            odpData.forEach(function(o){ pTotal+=(o.jumlah_port||0); pUsed+=0 ; });
            var pKosong=Math.max(0,pTotal-pUsed), pct=pTotal>0?Math.round(pUsed/pTotal*100):0;
            _dSet('dk-port-total',pTotal); _dSet('dk-port-used',pUsed);
            _dSet('dk-port-terpakai',pUsed); _dSet('dk-port-kosong',pKosong);
            _dSet('dk-port-rusak','—'); _dSet('dk-port-pct',pct+'%');
            var bar=document.getElementById('dk-port-bar');
            if(bar) setTimeout(function(){ bar.style.width=pct+'%'; bar.style.background=pct>85?'linear-gradient(90deg,var(--yellow),var(--red))':pct>60?'linear-gradient(90deg,var(--c1),var(--cyan))':'linear-gradient(90deg,var(--green),var(--cyan))'; },100);
          } else {
            var ptotal=pd.length;
            var pused=pd.filter(function(p){return p.status==='used'||p.status==='terpakai';}).length;
            var pkosong=pd.filter(function(p){return p.status==='kosong';}).length;
            var prusak=pd.filter(function(p){return p.status==='rusak';}).length;
            _dSet('dk-port-total',ptotal); _dSet('dk-port-used',pused);
            _dSet('dk-port-terpakai',pused); _dSet('dk-port-kosong',pkosong);
            _dSet('dk-port-rusak',prusak);
            var pct2=ptotal>0?Math.round(pused/ptotal*100):0;
            _dSet('dk-port-pct',pct2+'%');
            var bar2=document.getElementById('dk-port-bar');
            if(bar2) setTimeout(function(){ bar2.style.width=pct2+'%'; bar2.style.background=pct2>85?'linear-gradient(90deg,var(--yellow),var(--red))':pct2>60?'linear-gradient(90deg,var(--c1),var(--cyan))':'linear-gradient(90deg,var(--green),var(--cyan))'; },100);
          }
          tick();
        }).catch(function(){

          var pTotal=0,pUsed=0;
          odpData.forEach(function(o){ pTotal+=(o.jumlah_port||0); pUsed+=0 ; });
          var pct3=pTotal>0?Math.round(pUsed/pTotal*100):0;
          _dSet('dk-port-total',pTotal); _dSet('dk-port-used',pUsed);
          _dSet('dk-port-terpakai',pUsed); _dSet('dk-port-kosong',Math.max(0,pTotal-pUsed));
          _dSet('dk-port-pct',pct3+'%');
          tick();
        });
      } else {
        tick();
      }
    }).catch(function(){ tick(); });
  })();


  Promise.all([
    sb.from('invoice_isp').select('id,status,total'),
    sb.from('pembayaran_isp').select('id,nominal,tgl_bayar')
  ]).then(function(res){
    var inv=res[0]; var pay=res[1];
    if(!inv.error&&inv.data){
      var id=inv.data||[];
      var pendingCnt=id.filter(function(i){return i.status==='waiting_payment'||i.status==='sent';}).length;
      var paidCnt=id.filter(function(i){return i.status==='paid';}).length;

      if(CR==='teknisi'){
        _dSet('dk-inv-pending', pendingCnt);
      }
    }
    if(!pay.error&&pay.data){
      var pd=pay.data||[];
      var bayarBulan=pd.filter(function(p){return (p.tgl_bayar||'').slice(0,7)===bulanIni;})
        .reduce(function(a,p){return a+(p.nominal||0);},0);
    }
    tick();
  }).catch(function(){ tick(); });


}

function dkPasangTab(tab){
  var hari=document.getElementById('dk-psng-hari');
  var bln=document.getElementById('dk-psng-bulan');
  var tH=document.getElementById('dk-psng-tab-hari');
  var tB=document.getElementById('dk-psng-tab-bulan');
  if(tab==='hari'){
    if(hari) hari.style.display='';
    if(bln) bln.style.display='none';
    if(tH){ tH.style.background='var(--c1)'; tH.style.color='#fff'; tH.style.borderColor='var(--c1)'; }
    if(tB){ tB.style.background='var(--bg2)'; tB.style.color='var(--text2)'; tB.style.borderColor='var(--border2)'; }
  } else {
    if(hari) hari.style.display='none';
    if(bln) bln.style.display='';
    if(tH){ tH.style.background='var(--bg2)'; tH.style.color='var(--text2)'; tH.style.borderColor='var(--border2)'; }
    if(tB){ tB.style.background='var(--c1)'; tB.style.color='#fff'; tB.style.borderColor='var(--c1)'; }
  }
}
var _insLoaded = false;

_navDispatch.register('insight', function(){

  var pi = document.getElementById('p-insight');
  if(pi) pi.style.display = 'flex';

  if(typeof owdPaneLoad === 'function') owdPaneLoad();

  try{ if(typeof _insFillArea==='function') _insFillArea(); }catch(e){}
  try{ if(!_insLoaded && typeof insLoad==='function') insLoad(); }catch(e){}
});

function _insFillArea(){
  var sel = document.getElementById('ins-fil-area'); if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">— Semua Area —</option>';
  _areaData.forEach(function(a){
    var o = document.createElement('option');
    o.value = a.nama; o.textContent = a.nama;
    if(a.nama === cur) o.selected = true;
    sel.appendChild(o);
  });
}

function insLoad(){
  var sb = getSB(); if(!sb) return;
  var area = (document.getElementById('ins-fil-area')||{}).value||'';


  document.getElementById('ins-loading').style.display='block';
  document.getElementById('ins-summary').style.display='none';
  document.getElementById('ins-empty').style.display='none';


  var pArea  = _areaData.length  ? Promise.resolve() : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; });
  var pOdp   = sb.from('odps').select('id,kode,nama,area_id,jumlah_port').order('kode');
  var pPort  = sb.from('odp_ports').select('odp_id,status');
  var pPel   = sb.from('pelanggan').select('id,area_id,kelurahan,rw,status,jenis_pelanggan');

  Promise.all([pArea, pOdp, pPort, pPel]).then(function(res){
    var odpAll  = (res[1]&&res[1].data)||[];
    var portAll = (res[2]&&res[2].data)||[];
    var pelAll  = (res[3]&&res[3].data)||[];


    var areaIds = _areaData.filter(function(a){ return !area || a.nama===area; }).map(function(a){return a.id;});
    var odpFil  = odpAll.filter(function(o){ return areaIds.indexOf(o.area_id)>=0; });
    var pelFil  = pelAll.filter(function(p){ return areaIds.indexOf(p.area_id)>=0 && p.status==='aktif' && ['FASUM','ODP_TEMPEL','ODC_TEMPEL'].indexOf(p.jenis_pelanggan)<0; });

    if(!odpFil.length && !pelFil.length){
      document.getElementById('ins-loading').style.display='none';
      document.getElementById('ins-empty').style.display='block';
      return;
    }


    var odpStats = odpFil.map(function(odp){
      var ports = portAll.filter(function(p){return p.odp_id===odp.id;});
      var totalPort = odp.jumlah_port || ports.length || 0;
      var terpakai  = ports.filter(function(p){return p.status==='terpakai';}).length;
      var kosong    = ports.filter(function(p){return p.status==='kosong';}).length;
      var pct = totalPort>0 ? Math.round(terpakai/totalPort*100) : 0;
      var areaNama = (_areaData.find(function(a){return a.id===odp.area_id;})||{}).nama||'—';
      return { id:odp.id, kode:odp.kode, nama:odp.nama, areaNama:areaNama, totalPort:totalPort, terpakai:terpakai, kosong:kosong, pct:pct };
    });

    var sepi   = odpStats.filter(function(o){return o.pct<=30 && o.totalPort>0;}).sort(function(a,b){return a.pct-b.pct;});
    var penuh  = odpStats.filter(function(o){return o.pct>=70;}).sort(function(a,b){return b.pct-a.pct;});
    var sedang = odpStats.filter(function(o){return o.pct>30 && o.pct<70;});


    var kelMap = {};
    pelFil.forEach(function(p){
      var k = p.kelurahan||'Tidak Diketahui';
      kelMap[k] = (kelMap[k]||0)+1;
    });
    var kelArr = Object.keys(kelMap).map(function(k){return {nama:k,total:kelMap[k]};}).sort(function(a,b){return b.total-a.total;});


    document.getElementById('ins-odp-sepi').textContent   = sepi.length;
    document.getElementById('ins-odp-ramai').textContent  = penuh.length;
    document.getElementById('ins-odp-sedang').textContent = sedang.length;
    document.getElementById('ins-odp-total').textContent  = odpStats.length;


    var potEl = document.getElementById('ins-potensi-cards');
    var topPel = kelArr.slice(0,4);
    potEl.innerHTML = topPel.length ? topPel.map(function(k){
      var pctBar = Math.min(100, Math.round(k.total/Math.max(1,pelFil.length)*100));
      return '<div style="background:#fff;border-radius:14px;padding:12px;box-shadow:var(--shadow)">'+
        '<div style="font-size:14px;font-weight:800;color:var(--c1)">'+k.total+'</div>'+
        '<div style="font-size:11px;color:var(--text3);margin:2px 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(k.nama)+'</div>'+
        '<div style="height:5px;background:#f1f5f9;border-radius:3px"><div style="height:5px;background:var(--c1);border-radius:3px;width:'+pctBar+'%"></div></div>'+
      '</div>';
    }).join('') : '<div style="color:var(--text3);font-size:12px;padding:10px">Belum ada data pelanggan</div>';


    var rek = [];
    if(sepi.length){
      rek.push('⚠️ Ada <strong>'+sepi.length+' ODP tidak laku</strong> (port kosong). Evaluasi lokasi pemasangannya — mungkin perlu promosi lebih aktif di wilayah tersebut.');
    }
    if(penuh.length){
      rek.push('🔥 Ada <strong>'+penuh.length+' ODP hampir penuh</strong>. Segera tambah ODP baru di sekitar lokasi tersebut sebelum kehilangan calon pelanggan.');
    }
    if(sedang.length===0 && sepi.length===0 && penuh.length>0){
      rek.push('✅ Semua ODP sudah efisien dan penuh — saatnya ekspansi ke wilayah baru!');
    }
    if(kelArr.length && kelArr[kelArr.length-1].total<=1){
      rek.push('📍 Beberapa kelurahan baru punya 1 pelanggan. Wilayah tersebut bisa jadi target pemasaran berikutnya.');
    }
    if(!rek.length) rek.push('✅ Data terlihat sehat. Tidak ada masalah kritis yang ditemukan saat ini.');
    document.getElementById('ins-rek-text').innerHTML = rek.join('<br><br>');


    var sepiEl = document.getElementById('ins-list-sepi');
    sepiEl.innerHTML = sepi.length ? sepi.map(function(o){
      return _insOdpRow(o,'var(--red)','ti-mood-sad');
    }).join('') : '<div style="text-align:center;color:var(--green);font-size:12px;padding:14px"><i class="ti ti-mood-happy"></i> Semua ODP aktif dipakai — bagus!</div>';


    var penuhEl = document.getElementById('ins-list-penuh');
    penuhEl.innerHTML = penuh.length ? penuh.map(function(o){
      return _insOdpRow(o,'var(--green)','ti-trending-up');
    }).join('') : '<div style="text-align:center;color:var(--text3);font-size:12px;padding:14px"><i class="ti ti-circle-dashed"></i> Belum ada ODP yang hampir penuh</div>';


    var kelEl = document.getElementById('ins-list-kelurahan');
    kelEl.innerHTML = kelArr.length ? kelArr.map(function(k){
      var maxPel = kelArr[0].total||1;
      var pct = Math.round(k.total/maxPel*100);
      var color = k.total===0?'var(--text3)':k.total<=2?'#f59e0b':'var(--green)';
      return '<div style="margin-bottom:10px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">'+
          '<span style="font-size:12px;font-weight:700;color:var(--text)">'+_esc(k.nama)+'</span>'+
          '<span style="font-size:12px;font-weight:800;color:'+color+'">'+k.total+' pelanggan</span>'+
        '</div>'+
        '<div style="height:7px;background:#f1f5f9;border-radius:4px">'+
          '<div style="height:7px;background:'+color+';border-radius:4px;width:'+pct+'%;transition:.4s"></div>'+
        '</div>'+
      '</div>';
    }).join('') : '<div style="color:var(--text3);font-size:12px;padding:14px;text-align:center">Belum ada data pelanggan aktif</div>';

    document.getElementById('ins-loading').style.display='none';
    document.getElementById('ins-summary').style.display='block';
    _insLoaded = true;
  }).catch(function(){
    document.getElementById('ins-loading').style.display='none';
    document.getElementById('ins-empty').style.display='block';
  });
}

function _insOdpRow(o, color, icon){
  var pctColor = o.pct>=70?'var(--green)':o.pct>=30?'#f59e0b':'var(--red)';
  return '<div style="border:1.5px solid var(--border2);border-radius:10px;padding:10px 12px;margin-bottom:8px">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
      '<div>'+
        '<div style="font-size:12px;font-weight:800;color:var(--text)">'+_esc(o.kode)+'</div>'+
        '<div style="font-size:10px;color:var(--text3)">'+_esc(o.nama)+(o.areaNama&&o.areaNama!=='—'?' · '+_esc(o.areaNama):'')+'</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div style="font-size:16px;font-weight:800;color:'+pctColor+'">'+o.pct+'%</div>'+
        '<div style="font-size:10px;color:var(--text3)">'+o.terpakai+'/'+o.totalPort+' port</div>'+
      '</div>'+
    '</div>'+
    '<div style="height:7px;background:#f1f5f9;border-radius:4px">'+
      '<div style="height:7px;background:'+pctColor+';border-radius:4px;width:'+o.pct+'%;transition:.4s"></div>'+
    '</div>'+
  '</div>';
}

function _dmtShowSqlBanner(){
  var b=document.getElementById('dmt-sql-banner');
  if(b) b.style.display='block';
}

var _dmtData    = [];
var _dmtFil     = [];
var _dmtPage    = 1;
var _dmtPerPg   = 15;
var _dmtLoaded  = false;
var _dmtSearch  = '';
var _dmtDetId   = null;
var _dmtWilTab  = 'area';

var DMT_ALASAN = {
  pindah_provider:'Pindah Provider',
  tidak_aktif:'Tidak Aktif',
  menunggak:'Menunggak',
  pindah_rumah:'Pindah Rumah',
  lainnya:'Lainnya'
};

function navDismantle(btnEl){
  nav('dismantle', btnEl);
  setTimeout(function(){
    if(typeof dmtLoad === 'function') {
      dmtLoad();
    } else {
      if(typeof dmtUpdateStats==='function') dmtUpdateStats();
      if(typeof dmtRender==='function') dmtRender();
      if(typeof dmtWilRender==='function') dmtWilRender();
      if(typeof dmtBuildAreaChips==='function') dmtBuildAreaChips();
    }
  }, 80);

  var sb=getSB(); if(!sb) return;
  if(!_dmtPelLoading && !(window._dmtPelData && window._dmtPelData.length)){
    _dmtPelLoading=true;
    sb.from('pelanggan').select('id,cid,nama,status,area_id,kecamatan,kelurahan,sn_ont,odp_id,odc_id,nomor_port,ont_item_id,kabel_item_id,paket,tgl_pasang,teknisi_pasang,ont_model,panjang_kabel,mac_ont,lat,lng,keterangan')
      .neq('status','cabut')
      .then(function(r){ _dmtPelLoading=false; if(!r.error && r.data && r.data.length){ window._dmtPelData=r.data; _dmtPelData=window._dmtPelData; } })
      .catch(function(){ _dmtPelLoading=false; });
  }
}

var _mntWs = {
  areas:[], odcs:[], odps:[], ports:[], pel:[], material:[],
  areaId:null, odcId:null, ctx:null, ctxJenis:null, loaded:false, loading:false,
  _rawOdcs:null, _rawOdps:null, _rawPel:null, _rawPorts:null
};

var _mntOdpPage=1, _mntOdpPerPg=15, _mntOdpFil=[];
var _mntOdcPage=1, _mntOdcPerPg=15, _mntOdcFil=[];
var _mntPelPage=1, _mntPelPerPg=20, _mntPelFil=[];

if(typeof _navDispatch !== 'undefined'){
  _navDispatch.register('maintenance', function(){ setTimeout(function(){ mntWsInit(); }, 80); });
}

function mntWsInit(){
  if(typeof _isGlobalRole === 'function' && !_isGlobalRole()){
    var sc = typeof _getUserAreaScope === 'function' ? _getUserAreaScope() : null;
    _mntWs.areaId = sc && sc.area_coverage_id ? sc.area_coverage_id : null;
    var bar = document.getElementById('mnt-ws-area-bar');
    if(bar) bar.style.display='none';
  } else {
    var bar2 = document.getElementById('mnt-ws-area-bar');
    if(bar2) bar2.style.display='block';
    _mntWsFillAreaSel();
  }
  mntWsLoad();
}

function mntWsLoad(force){
  if(_mntWs.loading) return;
  _mntWs.loading = true;
  _mntWsSpinner(true);
  if(force){

    _mntWs._rawOdcs=null; _mntWs._rawOdps=null;
    _mntWs._rawPel=null; _mntWs._rawPorts=null;
  }

  var sb=getSB();
  if(!sb){ _mntWs.loading=false; _mntWsSpinner(false); toast('DB tidak terhubung','err'); return; }
  var aid = _mntWs.areaId;


  function loadInfra(cb){
    if(typeof SOT !== 'undefined' && !force){
      var c = SOT.cache();
      if(c && c.ts && (Date.now()-c.ts < 45000) && c.odps && c.odps.length){
        _mntWs.areas=c.areas||[]; _mntWs.odcs=c.odcs||[]; _mntWs.odps=c.odps||[];
        _mntWs.ports=c.ports||[]; cb(); return;
      }
      SOT.refresh(true, function(c2){
        _mntWs.areas=c2.areas||[]; _mntWs.odcs=c2.odcs||[]; _mntWs.odps=c2.odps||[];
        _mntWs.ports=c2.ports||[]; cb();
      }); return;
    }
    function q(t,cols){ var x=sb.from(t).select(cols); if(aid) x=x.eq('area_id',aid); return x; }
    Promise.all([
      sb.from('areas').select('id,nama,kode,status').order('nama'),
      q('odcs','id,kode,nama,area_id,status,jumlah_port').order('kode'),
      q('odps','id,kode,nama,area_id,odc_id,status,jumlah_port').order('kode'),
      sb.from('odp_ports').select('id,odp_id,nomor_port,status,cid_pelanggan,pel_id').order('nomor_port')
    ]).then(function(r){
      if(!r[0].error) _mntWs.areas=r[0].data||[];
      if(!r[1].error) _mntWs.odcs=r[1].data||[];
      if(!r[2].error) _mntWs.odps=r[2].data||[];
      if(!r[3].error) _mntWs.ports=r[3].data||[];
      cb();
    }).catch(function(){ _mntWs.loading=false; _mntWsSpinner(false); toast('Gagal muat data','err'); });
  }


  function loadPelanggan(cb){
    var qPel = sb.from('pelanggan')
      .select('id,cid,nama,status,jenis_pelanggan,area_id,odp_id,odc_id,nomor_port,paket,tgl_pasang,teknisi_pasang,sn_ont,ont_model,ont_item_id,kabel_item_id,panjang_kabel,kecamatan,kelurahan,rw,rt,lat,lng,keterangan,mac_ont')
      .neq('status','cabut');
    if(aid) qPel = qPel.eq('area_id', aid);
    qPel.then(function(r){ if(!r.error) _mntWs.pel=r.data||[]; cb(); })
        .catch(function(){ cb(); });
  }

  loadInfra(function(){
    loadPelanggan(function(){
      _mntWsLoadMat();
    });
  });
}

function _mntWsLoadMat(){
  var sb=getSB(); if(!sb){ _mntWsAfterLoad(); return; }
  sb.from('material_items').select('id,kode,nama,satuan,stok,min_stok,kategori,status').eq('status','aktif').order('nama')
    .then(function(r){ if(!r.error) _mntWs.material=r.data||[]; _mntWsAfterLoad(); })
    .catch(function(){ _mntWsAfterLoad(); });
}

function _mntWsAfterLoad(){
  _mntWs.loading=false; _mntWs.loaded=true; _mntWsSpinner(false);



  if(!_mntWs._rawOdcs || _mntWs.odcs.length > 0) _mntWs._rawOdcs = _mntWs.odcs.slice();
  if(!_mntWs._rawOdps || _mntWs.odps.length > 0) _mntWs._rawOdps = _mntWs.odps.slice();
  if(!_mntWs._rawPel  || _mntWs.pel.length  > 0) _mntWs._rawPel  = _mntWs.pel.slice();
  if(!_mntWs._rawPorts|| _mntWs.ports.length> 0) _mntWs._rawPorts= _mntWs.ports.slice();

  _mntWsApplyAreaFilter();
}

function _mntWsApplyAreaFilter(){
  var aid = _mntWs.areaId;
  if(aid){
    _mntWs.odcs  = (_mntWs._rawOdcs ||[]).filter(function(o){return o.area_id===aid;});
    _mntWs.odps  = (_mntWs._rawOdps ||[]).filter(function(o){return o.area_id===aid;});
    _mntWs.pel   = (_mntWs._rawPel  ||[]).filter(function(p){return p.area_id===aid;});
    var ids={}; _mntWs.odps.forEach(function(o){ids[o.id]=1;});
    _mntWs.ports = (_mntWs._rawPorts||[]).filter(function(p){return ids[p.odp_id];});
  } else {
    _mntWs.odcs  = (_mntWs._rawOdcs ||[]).slice();
    _mntWs.odps  = (_mntWs._rawOdps ||[]).slice();
    _mntWs.pel   = (_mntWs._rawPel  ||[]).slice();
    _mntWs.ports = (_mntWs._rawPorts||[]).slice();
  }
  _mntWsRenderKpi(); _mntFillOdcSel(); mntOdpSearch(''); mntOdcSearch(''); mntMatRender(); mntHistLoad();
}

function mntWsRefresh(){
  _mntWs.loaded=false;

  _mntWs._rawOdcs=null; _mntWs._rawOdps=null;
  _mntWs._rawPel=null; _mntWs._rawPorts=null;
  if(typeof SOT!=='undefined') SOT.invalidate('general');
  mntWsLoad(true);
}
function _mntWsSpinner(on){
  var i=document.getElementById('mnt-ws-refresh-ico');
  if(i) i.style.animation=on?'rot .6s linear infinite':'';
}
function _mntWsFillAreaSel(){
  var sel=document.getElementById('mnt-ws-area-sel'); if(!sel) return;
  var src=_mntWs.areas.length?_mntWs.areas:(_areaData||[]);
  sel.innerHTML='<option value="">— Semua Area —</option>';
  src.forEach(function(a){
    var o=document.createElement('option'); o.value=a.id; o.textContent=a.nama; sel.appendChild(o);
  });
}
function mntWsAreaChange(){
  var s=document.getElementById('mnt-ws-area-sel');
  _mntWs.areaId=s?s.value||null:null;
  if(_mntWs._rawOdcs){

    _mntWsApplyAreaFilter();
  } else {
    mntWsLoad(true);
  }
}
function _mntWsRenderKpi(){
  var ports=_mntWs.ports;
  var JG=window.JENIS_GRATIS||['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
  var pel=_mntWs.pel.filter(function(p){return JG.indexOf(p.jenis_pelanggan)<0;});
  var pT=ports.length,pU=0,pF=0,pD=0;
  ports.forEach(function(p){
    var s=p.status||'';
    if(s==='terpakai'||s==='used') pU++;
    else if(s==='kosong'||s==='available') pF++;
    else if(s==='rusak') pD++;
  });
  function set(id,v){var e=document.getElementById(id);if(e) e.textContent=v;}
  set('mntk-odc',_mntWs.odcs.length); set('mntk-odp',_mntWs.odps.length);
  set('mntk-ptotal',pT); set('mntk-pfree',pF); set('mntk-pused',pU); set('mntk-pdmg',pD);
  set('mntk-aktif',pel.filter(function(p){return p.status==='aktif';}).length);
  set('mntk-suspend',pel.filter(function(p){return p.status==='suspend';}).length);
}

function mntWsTab(tab, btn){
  document.querySelectorAll('.mnt-ws-tab').forEach(function(b){b.classList.remove('on');});
  document.querySelectorAll('.mnt-ws-pane').forEach(function(p){p.style.display='none'; p.classList.remove('active');});
  if(btn) btn.classList.add('on');
  var pane=document.getElementById('mnt-ws-pane-'+tab);
  if(pane){pane.style.display='block';pane.classList.add('active');}
  if(tab==='mat') mntMatRender();
  if(tab==='hist') mntHistLoad();
  if(tab==='odc') mntOdcSearch('');
  if(tab==='pel') { var q=document.getElementById('mnt-pel-q'); mntPelSearch(q?q.value:''); }
  if(tab==='odp') { var q2=document.getElementById('mnt-odp-q'); mntOdpSearch(q2?q2.value:''); }
}

function _mntFillOdcSel(){
  var sel=document.getElementById('mnt-odp-fil-odc'); if(!sel) return;
  sel.innerHTML='<option value="">— Filter berdasarkan ODC —</option>';
  _mntWs.odcs.forEach(function(o){
    var opt=document.createElement('option'); opt.value=o.id; opt.textContent=o.kode||o.nama; sel.appendChild(opt);
  });
}
function mntOdpFilterOdc(){
  var s=document.getElementById('mnt-odp-fil-odc'); _mntWs.odcId=s?s.value||null:null;
  var q=document.getElementById('mnt-odp-q'); mntOdpSearch(q?q.value:'');
}
function mntOdpSearch(q){
  var query=(q||'').toLowerCase().trim();
  var odcMap={},aMap={};
  _mntWs.odcs.forEach(function(o){odcMap[o.id]=o;});
  _mntWs.areas.forEach(function(a){aMap[a.id]=a;});
  _mntOdpFil = _mntWs.odps.filter(function(o){
    if(_mntWs.odcId && o.odc_id!==_mntWs.odcId) return false;
    if(query && (o.kode||'').toLowerCase().indexOf(query)<0 && (o.nama||'').toLowerCase().indexOf(query)<0) return false;
    return true;
  });
  _mntOdpPage=1; _mntRenderOdp(odcMap, aMap);
}
function mntOdpPage(dir){
  var pages=Math.max(1,Math.ceil(_mntOdpFil.length/_mntOdpPerPg));
  _mntOdpPage=Math.min(pages,Math.max(1,_mntOdpPage+dir));
  var odcMap={},aMap={};
  _mntWs.odcs.forEach(function(o){odcMap[o.id]=o;});
  _mntWs.areas.forEach(function(a){aMap[a.id]=a;});
  _mntRenderOdp(odcMap,aMap);
}
function _mntRenderOdp(odcMap, aMap){
  var el=document.getElementById('mnt-odp-list'); if(!el) return;
  var data=_mntOdpFil;
  if(!data.length){ el.innerHTML='<div class="mnt-empty"><i class="ti ti-plug-x"></i><p>Tidak ada ODP</p></div>'; document.getElementById('mnt-odp-pagi').style.display='none'; return; }
  var total=data.length, pages=Math.max(1,Math.ceil(total/_mntOdpPerPg));
  if(_mntOdpPage>pages) _mntOdpPage=pages;
  var slice=data.slice((_mntOdpPage-1)*_mntOdpPerPg, _mntOdpPage*_mntOdpPerPg);
  var html='';
  slice.forEach(function(odp){
    var pts=_mntWs.ports.filter(function(p){return p.odp_id===odp.id;});
    var pT=pts.length||odp.jumlah_port||0,pU=0,pK=0,pR=0;
    pts.forEach(function(p){var s=p.status||'';if(s==='terpakai'||s==='used')pU++;else if(s==='kosong'||s==='available')pK++;else if(s==='rusak')pR++;});
    var pct=pT>0?Math.round(pU/pT*100):0;
    var barC=pct>=90?'full':pct>=70?'warn':'';
    var accentC=pR>0||pct>=90?'crit':pct>=70?'warn':'';
    var odc=odcMap[odp.odc_id]||{}; var area=aMap[odp.area_id]||{};
    var pelN=_mntWs.pel.filter(function(p){return p.odp_id===odp.id&&p.status==='aktif';}).length;
    html+='<div class="mnt-card" onclick="mntWsOpenOdp(\''+odp.id+'\')">'+
      '<div class="mnt-card-accent '+accentC+'"></div>'+
      '<div style="padding-left:8px">'+
        '<div class="mnt-card-top">'+
          '<div class="mnt-card-ico odp"><i class="ti ti-plug"></i></div>'+
          '<div style="flex:1;min-width:0">'+
            '<div class="mnt-card-name">'+_esc(odp.kode)+'</div>'+
            '<div class="mnt-card-sub">'+(area.nama?_esc(area.nama)+' · ':'')+_esc(odc.kode||'')+(pelN?' · <span style="color:var(--cyan)">'+pelN+' pel</span>':'')+'</div>'+
          '</div>'+
          (pR>0?'<span class="mnt-pill-badge r"><i class="ti ti-alert-triangle" style="font-size:9px"></i> '+pR+' rusak</span>':'<i class="ti ti-chevron-right mnt-card-arrow" style="font-size:14px"></i>')+
        '</div>'+
        (pT>0?'<div class="mnt-card-stats"><span style="color:var(--text2)">'+pT+' port</span><span style="color:var(--yellow)">'+pU+' pakai</span><span style="color:var(--green)">'+pK+' kosong</span></div>'+
          '<div class="mnt-util-bg"><div class="mnt-util-fill '+barC+'" style="width:'+pct+'%"></div></div>':'')+
      '</div>'+
    '</div>';
  });
  el.innerHTML=html;
  var pagi=document.getElementById('mnt-odp-pagi');
  if(pages>1){
    pagi.style.display='flex';
    var prev=document.getElementById('mnt-odp-prev'); var next=document.getElementById('mnt-odp-next');
    var info=document.getElementById('mnt-odp-pagi-info');
    if(prev) prev.disabled=_mntOdpPage<=1;
    if(next) next.disabled=_mntOdpPage>=pages;
    if(info) info.textContent=_mntOdpPage+' / '+pages+' ('+total+')';
  } else { pagi.style.display='none'; }
}

function mntOdcSearch(q){
  var query=(q||'').toLowerCase().trim();
  _mntOdcFil = _mntWs.odcs.filter(function(o){
    return !query||(o.kode||'').toLowerCase().indexOf(query)>=0||(o.nama||'').toLowerCase().indexOf(query)>=0;
  });
  _mntOdcPage=1; _mntRenderOdc();
}
function mntOdcPage(dir){
  var pages=Math.max(1,Math.ceil(_mntOdcFil.length/_mntOdcPerPg));
  _mntOdcPage=Math.min(pages,Math.max(1,_mntOdcPage+dir));
  _mntRenderOdc();
}
function _mntRenderOdc(){
  var el=document.getElementById('mnt-odc-list'); if(!el) return;
  var aMap={}; _mntWs.areas.forEach(function(a){aMap[a.id]=a;});
  var data=_mntOdcFil;
  if(!data.length){ el.innerHTML='<div class="mnt-empty"><i class="ti ti-box"></i><p>Tidak ada ODC</p></div>'; document.getElementById('mnt-odc-pagi').style.display='none'; return; }
  var total=data.length, pages=Math.max(1,Math.ceil(total/_mntOdcPerPg));
  if(_mntOdcPage>pages) _mntOdcPage=pages;
  var slice=data.slice((_mntOdcPage-1)*_mntOdcPerPg, _mntOdcPage*_mntOdcPerPg);
  var html='';
  slice.forEach(function(odc){
    var odpsU=_mntWs.odps.filter(function(o){return o.odc_id===odc.id;});
    var ids={}; odpsU.forEach(function(o){ids[o.id]=1;});
    var pts=_mntWs.ports.filter(function(p){return ids[p.odp_id];});
    var pT=pts.length,pU=0,pK=0,pR=0;
    pts.forEach(function(p){var s=p.status||'';if(s==='terpakai'||s==='used')pU++;else if(s==='kosong'||s==='available')pK++;else if(s==='rusak')pR++;});
    var pelN=_mntWs.pel.filter(function(p){return ids[p.odp_id]&&p.status==='aktif';}).length;
    var pct=pT>0?Math.round(pU/pT*100):0; var barC=pct>=90?'full':pct>=70?'warn':'';
    var accentC=pR>0||pct>=90?'crit':pct>=70?'warn':'';
    var area=aMap[odc.area_id]||{};
    html+='<div class="mnt-card" onclick="mntWsOpenOdc(\''+odc.id+'\')">'+
      '<div class="mnt-card-accent '+accentC+'"></div>'+
      '<div style="padding-left:8px">'+
        '<div class="mnt-card-top">'+
          '<div class="mnt-card-ico odc"><i class="ti ti-box"></i></div>'+
          '<div style="flex:1;min-width:0">'+
            '<div class="mnt-card-name">'+_esc(odc.kode)+'</div>'+
            '<div class="mnt-card-sub">'+(area.nama?_esc(area.nama)+' · ':'')+odpsU.length+' ODP'+(pelN?' · <span style="color:var(--cyan)">'+pelN+' pel</span>':'')+'</div>'+
          '</div>'+
          (pR>0?'<span class="mnt-pill-badge r"><i class="ti ti-alert-triangle" style="font-size:9px"></i> '+pR+' rusak</span>':'<i class="ti ti-chevron-right mnt-card-arrow" style="font-size:14px"></i>')+
        '</div>'+
        (pT>0?'<div class="mnt-card-stats"><span style="color:var(--text2)">'+pT+' port</span><span style="color:var(--yellow)">'+pU+' pakai</span><span style="color:var(--green)">'+pK+' kosong</span></div>'+
          '<div class="mnt-util-bg"><div class="mnt-util-fill '+barC+'" style="width:'+pct+'%"></div></div>':'')+
      '</div>'+
    '</div>';
  });
  el.innerHTML=html;
  var pagi=document.getElementById('mnt-odc-pagi');
  if(pages>1){
    pagi.style.display='flex';
    var prev=document.getElementById('mnt-odc-prev'); var next=document.getElementById('mnt-odc-next');
    var info=document.getElementById('mnt-odc-pagi-info');
    if(prev) prev.disabled=_mntOdcPage<=1;
    if(next) next.disabled=_mntOdcPage>=pages;
    if(info) info.textContent=_mntOdcPage+' / '+pages+' ('+total+')';
  } else { pagi.style.display='none'; }
}

function mntPelSearch(q){
  var query=(q||'').toLowerCase().trim();
  var el=document.getElementById('mnt-pel-list');
  if(!query){
    if(el) el.innerHTML='<div class="mnt-empty"><i class="ti ti-user-search"></i><p>Cari pelanggan</p><small>Ketik CID atau nama</small></div>';
    var pagi=document.getElementById('mnt-pel-pagi'); if(pagi) pagi.style.display='none';
    return;
  }

  if(_mntWs.loading){
    if(el) el.innerHTML='<div class="mnt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i><p>Memuat data pelanggan…</p></div>';
    var pagi2=document.getElementById('mnt-pel-pagi'); if(pagi2) pagi2.style.display='none';
    setTimeout(function(){ var curQ=(document.getElementById('mnt-pel-q')||{}).value||''; if(curQ) mntPelSearch(curQ); }, 400);
    return;
  }
  var JG=window.JENIS_GRATIS||['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
  _mntPelFil = _mntWs.pel.filter(function(p){
    return JG.indexOf(p.jenis_pelanggan)<0 && ((p.cid||'').toLowerCase().indexOf(query)>=0||(p.nama||'').toLowerCase().indexOf(query)>=0);
  });
  _mntPelPage=1; _mntRenderPel();
}
function mntPelPage(dir){
  var pages=Math.max(1,Math.ceil(_mntPelFil.length/_mntPelPerPg));
  _mntPelPage=Math.min(pages,Math.max(1,_mntPelPage+dir));
  _mntRenderPel();
}
function _mntRenderPel(){
  var el=document.getElementById('mnt-pel-list'); if(!el) return;
  var data=_mntPelFil;
  if(!data.length){ el.innerHTML='<div class="mnt-empty"><i class="ti ti-search-off"></i><p>Tidak ditemukan</p></div>'; document.getElementById('mnt-pel-pagi').style.display='none'; return; }
  var total=data.length, pages=Math.max(1,Math.ceil(total/_mntPelPerPg));
  if(_mntPelPage>pages) _mntPelPage=pages;
  var slice=data.slice((_mntPelPage-1)*_mntPelPerPg, _mntPelPage*_mntPelPerPg);
  var stC={aktif:'var(--green)',suspend:'var(--yellow)',cabut:'var(--red)'};
  var html='';
  slice.forEach(function(p){
    var odp=_mntWs.odps.find(function(o){return o.id===p.odp_id;})||{};
    var sc=stC[p.status]||'var(--text3)';
    var nm=p.nama||'?'; var ini=nm.trim().split(/\s+/).slice(0,2).map(function(w){return (w[0]||'').toUpperCase();}).join('');
    html+='<div class="mnt-card" onclick="mntWsOpenPel(\''+p.id+'\')">'+
      '<div class="mnt-card-accent" style="background:'+sc+'"></div>'+
      '<div style="padding-left:8px">'+
        '<div class="mnt-card-top">'+
          '<div class="mnt-pel-ini" style="background:linear-gradient(135deg,var(--c1),var(--pu))">'+ini+'</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div class="mnt-card-name">'+_esc(p.nama)+'</div>'+
            '<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--pu);font-weight:700">'+_esc(p.cid||'')+'</div>'+
          '</div>'+
          '<div style="text-align:right;flex-shrink:0">'+
            '<div style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;background:rgba(0,0,0,.05);color:'+sc+'">'+_esc(p.status||'')+'</div>'+
            '<div style="font-size:10px;color:var(--text3);margin-top:2px">'+_esc(odp.kode||'—')+'</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  });
  el.innerHTML=html;
  var pagi=document.getElementById('mnt-pel-pagi');
  if(pages>1){
    pagi.style.display='flex';
    var prev=document.getElementById('mnt-pel-prev'); var next=document.getElementById('mnt-pel-next');
    var info=document.getElementById('mnt-pel-pagi-info');
    if(prev) prev.disabled=_mntPelPage<=1;
    if(next) next.disabled=_mntPelPage>=pages;
    if(info) info.textContent=_mntPelPage+' / '+pages+' ('+total+')';
  } else { pagi.style.display='none'; }
}

function mntMatRender(){
  var el=document.getElementById('mnt-mat-list'); if(!el) return;
  if(!_mntWs.material.length){ el.innerHTML='<div class="mnt-empty"><i class="ti ti-package-off"></i><p>Belum ada material</p></div>'; return; }
  var html='';
  _mntWs.material.forEach(function(m){
    var stokC=m.stok<=0?'var(--red)':(m.min_stok&&m.stok<=m.min_stok)?'var(--yellow)':'var(--green)';
    html+='<div class="mnt-mat-card">'+
      '<div class="mnt-mat-ico"><i class="ti ti-package"></i></div>'+
      '<div style="flex:1;min-width:0"><div class="mnt-mat-name">'+_esc(m.nama||'')+'</div>'+(m.kode?'<div class="mnt-mat-kat" style="font-family:\'JetBrains Mono\',monospace">'+_esc(m.kode)+'</div>':''+(m.kategori?'<div class="mnt-mat-kat">'+_esc(m.kategori)+'</div>':''))+
      '</div>'+
      '<div class="mnt-mat-stok"><div class="mnt-mat-stok-n" style="color:'+stokC+'">'+_fmt(m.stok||0)+'</div><div class="mnt-mat-stok-l">'+_esc(m.satuan||'pcs')+'</div></div>'+
    '</div>';
  });
  el.innerHTML=html;
}

function mntHistLoad(){
  var el=document.getElementById('mnt-hist-list'); if(!el) return;
  var sb=getSB(); if(!sb) return;
  var jenis=(document.getElementById('mnt-hist-jenis')||{}).value||'';
  var hari=parseInt((document.getElementById('mnt-hist-periode')||{}).value||'30');
  var since=new Date(Date.now()-hari*86400000).toISOString().slice(0,10);
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3)"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:24px;display:block;margin-bottom:8px;opacity:.4"></i></div>';
  var mntJenis=['ont_replace','kabel_replace','odp_maintenance','odc_maintenance','signal_check','maintenance_ont','maintenance_kabel','odp_port_move'];
  var q=sb.from('material_mutasi').select('id,jenis,jumlah,keterangan,tgl,teknisi,sn_ont,pel_cid,item_id').gte('tgl',since).order('tgl',{ascending:false}).limit(200);
  if(jenis) q=q.eq('jenis',jenis); else q=q.in('jenis',mntJenis);
  q.then(function(r){
    if(r.error||!r.data||!r.data.length){ el.innerHTML='<div class="mnt-empty"><i class="ti ti-history"></i><p>Belum ada riwayat</p></div>'; return; }
    var rows = r.data;

    /* Filter sesuai area workspace maintenance aktif (_mntWs.areaId).
       Tabel material_mutasi tidak punya kolom area_id langsung, jadi
       dicocokkan via pel_cid terhadap daftar pelanggan area tersebut. */
    var aid = (typeof _mntWs!=='undefined') ? _mntWs.areaId : null;
    if(aid){
      var pelSet = {};
      ((typeof _mntWs!=='undefined' && _mntWs._rawPel) ? _mntWs._rawPel : []).forEach(function(p){
        if(p.area_id===aid && p.cid) pelSet[p.cid]=1;
      });
      rows = rows.filter(function(h){ return h.pel_cid && pelSet[h.pel_cid]; });
    }

    rows = rows.slice(0,60);
    if(!rows.length){ el.innerHTML='<div class="mnt-empty"><i class="ti ti-history"></i><p>Belum ada riwayat</p></div>'; return; }

    var matMap={}; _mntWs.material.forEach(function(m){matMap[m.id]=m;});
    var jLbl={maintenance_ont:'Ganti ONT',ont_replace:'Ganti ONT',maintenance_kabel:'Ganti Kabel',kabel_replace:'Ganti Kabel',odp_maintenance:'Maint. ODP',odc_maintenance:'Maint. ODC',odp_port_move:'Pindah Port',signal_check:'Cek Sinyal'};
    var jIco={maintenance_ont:'ti-device-desktop',ont_replace:'ti-device-desktop',maintenance_kabel:'ti-cable',kabel_replace:'ti-cable',odp_maintenance:'ti-plug',odc_maintenance:'ti-box',odp_port_move:'ti-arrows-exchange',signal_check:'ti-signal'};
    var html='<div style="padding-bottom:8px">';
    rows.forEach(function(h){
      var mat=matMap[h.item_id]||{}; var lbl=jLbl[h.jenis]||_esc(h.jenis||''); var ico=jIco[h.jenis]||'ti-tool';
      html+='<div class="mnt-hist-item">'+
        '<div style="width:30px;height:30px;border-radius:8px;background:var(--bg3);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti '+ico+'" style="font-size:14px;color:var(--cyan)"></i></div>'+
        '<div class="mnt-hist-body">'+
          '<div class="mnt-hist-title">'+lbl+(mat.nama?' - '+_esc(mat.nama):'')+'</div>'+
          '<div class="mnt-hist-sub">'+(h.pel_cid?_esc(h.pel_cid)+' · ':'')+_esc(h.teknisi||'')+(h.jumlah?' · '+h.jumlah+(mat.satuan?' '+_esc(mat.satuan):''):'')+'</div>'+
          (h.keterangan?'<div style="font-size:9px;color:var(--text3);margin-top:2px">'+_esc((h.keterangan||'').slice(0,80))+'</div>':'')+
        '</div>'+
        '<div class="mnt-hist-time">'+(h.tgl?h.tgl.slice(0,10):'—')+'</div>'+
      '</div>';
    });
    html+='</div>';
    el.innerHTML=html;
  }).catch(function(){ el.innerHTML='<div class="mnt-empty"><i class="ti ti-alert-circle"></i><p>Gagal muat history</p></div>'; });
}

function mntWsOpenOdp(odpId){
  var odp=_mntWs.odps.find(function(o){return o.id===odpId;}); if(!odp) return;
  var odc=_mntWs.odcs.find(function(o){return o.id===odp.odc_id;})||{};
  var area=_mntWs.areas.find(function(a){return a.id===odp.area_id;})||{};
  var pts=_mntWs.ports.filter(function(p){return p.odp_id===odpId;});
  var pT=pts.length||odp.jumlah_port||0,pU=0,pK=0,pR=0;
  pts.forEach(function(p){var s=p.status||'';if(s==='terpakai'||s==='used')pU++;else if(s==='kosong'||s==='available')pK++;else if(s==='rusak')pR++;});
  var pct=pT>0?Math.round(pU/pT*100):0;
  var barC=pct>=90?'full':pct>=70?'warn':'';
  var pelTd=_mntWs.pel.filter(function(p){return p.odp_id===odpId&&p.status==='aktif';});
  _mntWs.ctx={type:'odp',id:odpId,data:odp};


  document.getElementById('mnt-ws-sheet-hd-area').innerHTML=
    '<div class="mnt-sheet-hero odp">'+
      '<div class="mnt-sheet-hero-ico"><i class="ti ti-plug"></i></div>'+
      '<div><div class="mnt-sheet-hero-title">'+_esc(odp.kode||'ODP')+'</div>'+
      '<div class="mnt-sheet-hero-sub">'+(area.nama?_esc(area.nama)+' · ':'')+_esc(odc.kode||'')+'</div></div>'+
      '<button class="mnt-sheet-close" onclick="mntWsCloseSheet()"><i class="ti ti-x"></i></button>'+
    '</div>';

  var matOpts=_mntWs.material.map(function(m){return '<option value="'+m.id+'">'+(m.kode?m.kode+' - ':'')+_esc(m.nama)+' ('+_fmt(m.stok||0)+' '+_esc(m.satuan||'pcs')+')</option>';}).join('');


  var portGrid='<div class="mnt-port-grid">'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n">'+pT+'</div><div class="mnt-port-cell-l">Total</div></div>'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n" style="color:var(--yellow)">'+pU+'</div><div class="mnt-port-cell-l">Terpakai</div></div>'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n" style="color:var(--green)">'+pK+'</div><div class="mnt-port-cell-l">Kosong</div></div>'+
    '<div class="mnt-port-bar-wrap" style="grid-column:span 3">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">'+
        '<span style="font-size:10px;font-weight:700;color:var(--text2)">Utilisasi port</span>'+
        '<span style="font-size:10px;font-weight:800;color:'+(pct>=90?'var(--red)':pct>=70?'var(--yellow)':'var(--green)')+'">'+pU+'/'+pT+' ('+pct+'%)</span>'+
      '</div>'+
      '<div class="mnt-port-bar-bg"><div class="mnt-port-bar-fill '+barC+'" style="width:'+pct+'%"></div></div>'+
    '</div>'+
    (pR>0?'<div class="mnt-port-cell" style="grid-column:span 3;background:var(--rg2);border-color:rgba(220,38,38,.2)"><div class="mnt-port-cell-n" style="color:var(--red)">'+pR+'</div><div class="mnt-port-cell-l" style="color:var(--red)">Port Rusak</div></div>':'')+
  '</div>';


  var pelHtml='<div class="mnt-sec-hd or"><i class="ti ti-users"></i> Pelanggan Terdampak ('+pelTd.length+') — hanya lihat</div>';
  if(pelTd.length){
    pelHtml+='<div class="mnt-pel-affected">';
    pelTd.slice(0,10).forEach(function(p){
      var ini=(p.nama||'?').trim().split(/\s+/).slice(0,2).map(function(w){return (w[0]||'').toUpperCase();}).join('');
      pelHtml+='<div class="mnt-pel-affected-item">'+
        '<div class="mnt-pel-affected-ini">'+ini+'</div>'+
        '<div><div class="mnt-pel-affected-name">'+_esc(p.nama||'—')+'</div><div class="mnt-pel-affected-cid">'+_esc(p.cid||'')+'</div></div>'+
        '<span class="mnt-pill-badge '+(p.status==='aktif'?'g':'y')+'" style="margin-left:auto">'+_esc(p.status)+'</span>'+
      '</div>';
    });
    if(pelTd.length>10) pelHtml+='<div style="font-size:10px;color:var(--text3);padding:8px 11px;text-align:center">…+'+(pelTd.length-10)+' lainnya</div>';
    pelHtml+='</div>';
  } else {
    pelHtml+='<div style="font-size:11px;color:var(--text3);padding:10px;background:var(--bg3);border-radius:var(--rs);text-align:center">Tidak ada pelanggan aktif</div>';
  }

  document.getElementById('mnt-ws-sheet-body').innerHTML=
    '<div class="mnt-sec-hd or"><i class="ti ti-circuit-switchboard"></i> Kondisi Port</div>'+
    portGrid+
    pelHtml+
    '<div class="mnt-sec-hd"><i class="ti ti-tool"></i> Catat Maintenance</div>'+
    '<div class="mnt-form-area">'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-package"></i> Material</div><select class="mnt-form-sel" id="mnt-ws-odp-mat"><option value="">— Tidak pakai material —</option>'+matOpts+'</select></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-user-cog"></i> Teknisi</div><select class="mnt-form-sel" id="mnt-ws-odp-tek"><option value="">— Pilih Teknisi —</option></select></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-note"></i> Keterangan</div><textarea class="mnt-form-ta" id="mnt-ws-odp-ket" placeholder="Deskripsi pekerjaan…"></textarea></div>'+
    '</div>';

  document.getElementById('mnt-ws-sheet-foot').innerHTML=
    '<button class="mnt-btn-cancel" onclick="mntWsCloseSheet()">Batal</button>'+
    '<button class="mnt-btn-save" onclick="mntWsSubmitOdp()"><i class="ti ti-device-floppy"></i> Simpan</button>';
  document.getElementById('mnt-ws-overlay').classList.add('on');
  _ensureTeknisiLoaded(function(){ _mntFillTeknisiSel('mnt-ws-odp-tek'); });
}

function mntWsOpenOdc(odcId){
  var odc=_mntWs.odcs.find(function(o){return o.id===odcId;}); if(!odc) return;
  var area=_mntWs.areas.find(function(a){return a.id===odc.area_id;})||{};
  var odpsU=_mntWs.odps.filter(function(o){return o.odc_id===odcId;});
  var ids={}; odpsU.forEach(function(o){ids[o.id]=1;});
  var pts=_mntWs.ports.filter(function(p){return ids[p.odp_id];});
  var pT=pts.length,pU=0,pK=0,pR=0;
  pts.forEach(function(p){var s=p.status||'';if(s==='terpakai'||s==='used')pU++;else if(s==='kosong'||s==='available')pK++;else if(s==='rusak')pR++;});
  var pelN=_mntWs.pel.filter(function(p){return ids[p.odp_id]&&p.status==='aktif';}).length;
  var pct=pT>0?Math.round(pU/pT*100):0; var barC=pct>=90?'full':pct>=70?'warn':'';
  _mntWs.ctx={type:'odc',id:odcId,data:odc};


  document.getElementById('mnt-ws-sheet-hd-area').innerHTML=
    '<div class="mnt-sheet-hero odc">'+
      '<div class="mnt-sheet-hero-ico"><i class="ti ti-box"></i></div>'+
      '<div><div class="mnt-sheet-hero-title">'+_esc(odc.kode||'ODC')+'</div>'+
      '<div class="mnt-sheet-hero-sub">'+(area.nama?_esc(area.nama)+' · ':'')+odpsU.length+' ODP · '+pelN+' pelanggan</div></div>'+
      '<button class="mnt-sheet-close" onclick="mntWsCloseSheet()"><i class="ti ti-x"></i></button>'+
    '</div>';

  var matOpts=_mntWs.material.map(function(m){return '<option value="'+m.id+'">'+(m.kode?m.kode+' - ':'')+_esc(m.nama)+' ('+_fmt(m.stok||0)+' '+_esc(m.satuan||'pcs')+')</option>';}).join('');


  var portGrid='<div class="mnt-port-grid">'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n">'+odpsU.length+'</div><div class="mnt-port-cell-l">ODP</div></div>'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n">'+pT+'</div><div class="mnt-port-cell-l">Port</div></div>'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n" style="color:var(--cyan)">'+pelN+'</div><div class="mnt-port-cell-l">Pelanggan</div></div>'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n" style="color:var(--yellow)">'+pU+'</div><div class="mnt-port-cell-l">Terpakai</div></div>'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n" style="color:var(--green)">'+pK+'</div><div class="mnt-port-cell-l">Kosong</div></div>'+
    '<div class="mnt-port-cell"><div class="mnt-port-cell-n" style="color:'+(pR>0?'var(--red)':'var(--text3)')+'">'+pR+'</div><div class="mnt-port-cell-l">Rusak</div></div>'+
    (pT>0?'<div class="mnt-port-bar-wrap" style="grid-column:span 3">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:3px">'+
        '<span style="font-size:10px;font-weight:700;color:var(--text2)">Utilisasi</span>'+
        '<span style="font-size:10px;font-weight:800;color:'+(pct>=90?'var(--red)':pct>=70?'var(--yellow)':'var(--green)')+'">'+pU+'/'+pT+' ('+pct+'%)</span>'+
      '</div>'+
      '<div class="mnt-port-bar-bg"><div class="mnt-port-bar-fill '+barC+'" style="width:'+pct+'%"></div></div>'+
    '</div>':'')+
  '</div>';


  var odpHtml='<div class="mnt-sec-hd pu"><i class="ti ti-plug"></i> ODP Terdampak ('+odpsU.length+') — hanya lihat</div>';
  if(odpsU.length){
    odpHtml+='<div class="mnt-odp-affected">';
    odpsU.slice(0,12).forEach(function(odp){
      var ptO=_mntWs.ports.filter(function(p){return p.odp_id===odp.id;});
      var pTO=ptO.length||odp.jumlah_port||0, pUO=0, pKO=0, pRO=0;
      ptO.forEach(function(p){var s=p.status||'';if(s==='terpakai'||s==='used')pUO++;else if(s==='kosong'||s==='available')pKO++;else if(s==='rusak')pRO++;});
      var pelO=_mntWs.pel.filter(function(p){return p.odp_id===odp.id&&p.status==='aktif';}).length;
      odpHtml+='<div class="mnt-odp-affected-item">'+
        '<div class="mnt-odp-affected-ico"><i class="ti ti-plug"></i></div>'+
        '<div style="flex:1;min-width:0">'+
          '<div class="mnt-odp-affected-name">'+_esc(odp.kode||'—')+'</div>'+
          '<div class="mnt-odp-affected-sub">'+pTO+' port · '+pUO+' pakai · '+pKO+' kosong'+(pRO>0?' · <span style="color:var(--red)">'+pRO+' rusak</span>':'')+'</div>'+
        '</div>'+
        '<div class="mnt-odp-affected-badge">'+
          (pelO?'<span class="mnt-pill-badge c">'+pelO+' pel</span>':'')+
          (pRO>0?'<span class="mnt-pill-badge r" style="margin-left:3px">'+pRO+' rusak</span>':'')+
        '</div>'+
      '</div>';
    });
    if(odpsU.length>12) odpHtml+='<div style="font-size:10px;color:var(--text3);padding:8px 11px;text-align:center">…+'+(odpsU.length-12)+' ODP lainnya</div>';
    odpHtml+='</div>';
  } else {
    odpHtml+='<div style="font-size:11px;color:var(--text3);padding:10px;background:var(--bg3);border-radius:var(--rs);text-align:center">Tidak ada ODP terdaftar</div>';
  }

  document.getElementById('mnt-ws-sheet-body').innerHTML=
    '<div class="mnt-sec-hd pu" style="border-top:none;padding-top:0"><i class="ti ti-chart-bar"></i> Ringkasan</div>'+
    portGrid+
    odpHtml+
    '<div class="mnt-sec-hd"><i class="ti ti-tool"></i> Catat Maintenance</div>'+
    '<div class="mnt-form-area">'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-package"></i> Material</div><select class="mnt-form-sel" id="mnt-ws-odc-mat"><option value="">— Tidak pakai material —</option>'+matOpts+'</select></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-user-cog"></i> Teknisi</div><select class="mnt-form-sel" id="mnt-ws-odc-tek"><option value="">— Pilih Teknisi —</option></select></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-note"></i> Keterangan</div><textarea class="mnt-form-ta" id="mnt-ws-odc-ket" placeholder="Deskripsi pekerjaan…"></textarea></div>'+
    '</div>';

  document.getElementById('mnt-ws-sheet-foot').innerHTML=
    '<button class="mnt-btn-cancel" onclick="mntWsCloseSheet()">Batal</button>'+
    '<button class="mnt-btn-save" style="background:var(--pu);box-shadow:0 4px 14px rgba(124,58,237,.3)" onclick="mntWsSubmitOdc()"><i class="ti ti-device-floppy"></i> Simpan</button>';
  document.getElementById('mnt-ws-overlay').classList.add('on');
  _ensureTeknisiLoaded(function(){ _mntFillTeknisiSel('mnt-ws-odc-tek'); });
}

function mntWsOpenPel(pelId){
  var pel=_mntWs.pel.find(function(p){return p.id===pelId;}); if(!pel) return;
  var odp=_mntWs.odps.find(function(o){return o.id===pel.odp_id;})||{};
  var odc=_mntWs.odcs.find(function(o){return o.id===(odp.odc_id||pel.odc_id);})||{};
  var area=_mntWs.areas.find(function(a){return a.id===pel.area_id;})||{};
  var portObj=_mntWs.ports.find(function(p){return p.odp_id===pel.odp_id&&(p.cid_pelanggan===pel.cid||String(p.nomor_port)===String(pel.nomor_port));});
  var portSt=portObj?portObj.status:'—';
  _mntWs.ctx={type:'pel',id:pelId,data:pel}; _mntWs.ctxJenis=null;
  var nm=pel.nama||'?'; var ini=nm.trim().split(/\s+/).slice(0,2).map(function(w){return (w[0]||'').toUpperCase();}).join('');
  var stC=pel.status==='aktif'?'var(--green)':pel.status==='suspend'?'var(--yellow)':'var(--red)';
  var matOpts=_mntWs.material.map(function(m){return '<option value="'+m.id+'">'+(m.kode?m.kode+' - ':'')+_esc(m.nama)+' ('+_fmt(m.stok||0)+' '+_esc(m.satuan||'pcs')+')</option>';}).join('');
  var odpOpts=_mntWs.odps.map(function(o){
    var k=_mntWs.ports.filter(function(p){return p.odp_id===o.id&&(p.status==='kosong'||p.status==='available');}).length;
    return '<option value="'+o.id+'"'+(o.id===pel.odp_id?' selected':'')+'>'+_esc(o.kode)+(k?' ('+k+' kosong)':' — PENUH')+'</option>';
  }).join('');


  document.getElementById('mnt-ws-sheet-hd-area').innerHTML=
    '<div class="mnt-sheet-hero pel">'+
      '<div class="mnt-pel-avatar" style="width:40px;height:40px;border-radius:11px;font-size:15px">'+ini+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div class="mnt-sheet-hero-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(pel.nama||'Pelanggan')+'</div>'+
        '<div class="mnt-sheet-hero-sub" style="font-family:\'JetBrains Mono\',monospace">'+_esc(pel.cid||'')+'</div>'+
      '</div>'+
      '<button class="mnt-sheet-close" onclick="mntWsCloseSheet()"><i class="ti ti-x"></i></button>'+
    '</div>';


  var odpNm=odp.kode||odp.nama||'—';
  var odcNm=odc.kode||odc.nama||'—';
  var kblNm=pel.panjang_kabel?_fmt(pel.panjang_kabel)+' roll':'—';
  var koordinat=(pel.lat&&pel.lng)?pel.lat+', '+pel.lng:'—';
  var detailGrid=
    '<div class="mnt-sec-hd" style="border-top:none;padding-top:0;color:var(--c1)"><i class="ti ti-id-badge-2"></i> Identitas</div>'+
    '<div class="mnt-pel-detail-grid">'+
      _mntDetailCell('Status','<span style="font-weight:800;color:'+stC+'">'+_esc(pel.status||'—')+'</span>')+
      _mntDetailCell('Paket',_esc(pel.paket||'—'))+
      _mntDetailCell('Area',_esc(area.nama||'—'))+
      _mntDetailCell('Kecamatan',_esc(pel.kecamatan||'—'))+
      _mntDetailCell('Kelurahan',_esc(pel.kelurahan||'—'))+
      (pel.rw||pel.rt?_mntDetailCell('RW/RT',_esc((pel.rw||'—')+' / '+(pel.rt||'—'))):'')+
    '</div>'+
    '<div class="mnt-sec-hd" style="color:var(--c2)"><i class="ti ti-topology-star-ring-3"></i> Jaringan</div>'+
    '<div class="mnt-pel-detail-grid">'+
      _mntDetailCell('ODC',_esc(odcNm))+
      _mntDetailCell('ODP',_esc(odpNm))+
      _mntDetailCell('Port',pel.nomor_port?'Port '+pel.nomor_port:'—')+
      _mntDetailCell('Status Port',_esc(portSt))+
    '</div>'+
    '<div class="mnt-sec-hd" style="color:var(--pu)"><i class="ti ti-router"></i> Perangkat</div>'+
    '<div class="mnt-pel-detail-grid">'+
      _mntDetailCell('ONT Model',_esc(pel.ont_model||'—'))+
      _mntDetailCell('MAC ONT','<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px">'+_esc(pel.mac_ont||'—')+'</span>')+
      _mntDetailCell('SN ONT','<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--pu)">'+_esc(pel.sn_ont||'—')+'</span>')+
      _mntDetailCell('Kabel Precon',kblNm)+
    '</div>'+
    '<div class="mnt-sec-hd" style="color:var(--green)"><i class="ti ti-users"></i> Petugas & Info</div>'+
    '<div class="mnt-pel-detail-grid">'+
      _mntDetailCell('Teknisi Pasang',_esc(pel.teknisi_pasang||'—'))+
      _mntDetailCell('Sales',_esc(pel.sales||'—'))+
      _mntDetailCell('Tgl Pasang',_esc(pel.tgl_pasang||'—'))+
      _mntDetailCell('Koordinat',koordinat)+
      (pel.keterangan?_mntDetailCell('Keterangan',_esc(pel.keterangan)):'')+
    '</div>';

  document.getElementById('mnt-ws-sheet-body').innerHTML=
    detailGrid+
    '<div class="mnt-sec-hd"><i class="ti ti-tool"></i> Pilih Jenis Perbaikan</div>'+
    '<div class="mnt-jenis-opt" id="mnt-jenis-opt-kabel_replace" onclick="mntWsSelJenis(\'kabel_replace\')">'+
      '<div class="mnt-jenis-opt-ico"><i class="ti ti-cable"></i></div>'+
      '<div><div class="mnt-jenis-opt-name">Ganti Kabel Precon</div><div class="mnt-jenis-opt-desc">Penggantian kabel precon (roll)</div></div>'+
      '<i class="ti ti-chevron-right" style="font-size:14px;color:var(--text3);margin-left:auto;flex-shrink:0"></i>'+
    '</div>'+
    '<div class="mnt-jenis-opt" id="mnt-jenis-opt-odp_port_move" onclick="mntWsSelJenis(\'odp_port_move\')">'+
      '<div class="mnt-jenis-opt-ico"><i class="ti ti-arrows-exchange"></i></div>'+
      '<div><div class="mnt-jenis-opt-name">Pindah Port</div><div class="mnt-jenis-opt-desc">Pindah ke port atau ODP lain</div></div>'+
      '<i class="ti ti-chevron-right" style="font-size:14px;color:var(--text3);margin-left:auto;flex-shrink:0"></i>'+
    '</div>'+
    '<div class="mnt-jenis-opt" id="mnt-jenis-opt-signal_check" onclick="mntWsSelJenis(\'signal_check\')">'+
      '<div class="mnt-jenis-opt-ico"><i class="ti ti-signal"></i></div>'+
      '<div><div class="mnt-jenis-opt-name">Cek Sinyal</div><div class="mnt-jenis-opt-desc">Catat nilai sinyal Rx (dBm)</div></div>'+
      '<i class="ti ti-chevron-right" style="font-size:14px;color:var(--text3);margin-left:auto;flex-shrink:0"></i>'+
    '</div>'+
    '<div class="mnt-jenis-opt" id="mnt-jenis-opt-ont_rusak" onclick="mntWsSelJenis(\'ont_rusak\')">'+
      '<div class="mnt-jenis-opt-ico" style="background:rgba(220,38,38,.1)"><i class="ti ti-replace" style="color:var(--red)"></i></div>'+
      '<div><div class="mnt-jenis-opt-name">ONT Rusak / Hilang → Ganti ONT</div><div class="mnt-jenis-opt-desc">Catat kondisi (rusak/hilang) sekaligus input SN ONT pengganti</div></div>'+
      '<i class="ti ti-chevron-right" style="font-size:14px;color:var(--text3);margin-left:auto;flex-shrink:0"></i>'+
    '</div>'+
    '<div id="mnt-ws-pel-form-area" style="margin-top:6px">'+
      '<div style="background:var(--bg3);border-radius:var(--rs);padding:14px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-hand-click" style="display:block;font-size:20px;margin-bottom:5px;opacity:.4"></i>Pilih jenis perbaikan di atas</div>'+
    '</div>';

  document.getElementById('mnt-ws-sheet-foot').innerHTML=
    '<button class="mnt-btn-cancel" onclick="mntWsCloseSheet()">Batal</button>'+
    '<button class="mnt-btn-save" id="mnt-ws-pel-submit-btn" onclick="mntWsSubmitPel()" style="display:none"><i class="ti ti-device-floppy"></i> Simpan</button>';
  document.getElementById('mnt-ws-overlay').classList.add('on');
  _mntWs._matOpts = matOpts;
  _mntWs._odpOpts = odpOpts;
}

function _mntDetailCell(lbl, val){
  return '<div class="mnt-pel-detail-cell"><div class="mnt-pel-detail-lbl">'+lbl+'</div><div class="mnt-pel-detail-val">'+val+'</div></div>';
}

function _buildTeknisiOpts(selectedVal){
  var teknisiList=(_users||[]).filter(function(u){
    return (u.role==='teknisi'||u.role==='area_manager'||u.role==='super_admin'||u.role==='owner') && u.is_active!==false && u.status!=='nonaktif';
  }).sort(function(a,b){ return (a.nama||'').localeCompare(b.nama||''); });
  var opts='<option value="">— Pilih Teknisi —</option>';
  teknisiList.forEach(function(u){
    var nm=u.nama||u.username||''; var sel=(nm===selectedVal)?' selected':'';
    opts+='<option value="'+_esc(nm)+'"'+sel+'>'+_esc(nm)+'</option>';
  });

  if(window.CR==='teknisi' && window.CU){
    var selfNm=(CU.nama||CU.username||'');
    if(selfNm && opts.indexOf('value="'+_esc(selfNm)+'"')<0){
      opts+='<option value="'+_esc(selfNm)+'" selected>'+_esc(selfNm)+' (Saya)</option>';
    }
  }
  return opts;
}

function _ensureTeknisiLoaded(cb){
  if(_users && _users.length>0){ cb(); return; }
  var sb=getSB(); if(!sb){ cb(); return; }
  sb.from('app_users').select('id,nama,username,role,status,is_active').order('nama')
    .then(function(r){ if(!r.error) _users=r.data||[]; cb(); })
    .catch(function(){ cb(); });
}

function _mntFillTeknisiSel(selId, defaultVal){
  var el=document.getElementById(selId); if(!el) return;
  el.innerHTML=_buildTeknisiOpts(defaultVal||'');
  if(window.CR==='teknisi' && window.CU){
    var nm=(CU.nama||CU.username||'');
    if(nm){ el.value=nm; }
  }
}

function mntWsSelJenis(jenis){
  _mntWs.ctxJenis=jenis;
  document.querySelectorAll('.mnt-jenis-opt').forEach(function(e){e.classList.remove('selected');});
  var se=document.getElementById('mnt-jenis-opt-'+jenis); if(se) se.classList.add('selected');
  var fa=document.getElementById('mnt-ws-pel-form-area'); if(!fa) return;
  var mo=_mntWs._matOpts||'';
  var oo=_mntWs._odpOpts||'';
  var pel=_mntWs.ctx&&_mntWs.ctx.data;
  var snLama=pel&&pel.sn_ont?_esc(pel.sn_ont):'—';
  if(jenis==='signal_check'){
    fa.innerHTML='<div class="mnt-form-area">'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-antenna"></i> Sinyal Rx (dBm) <span class="mnt-req">*</span></div><input class="mnt-form-inp" id="mnt-ws-sig-rx" type="number" step="0.01" placeholder="-20.00" style="font-family:monospace;font-size:16px;font-weight:800;text-align:center"></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-note"></i> Catatan</div><input class="mnt-form-inp" id="mnt-ws-sig-ket" type="text" placeholder="Normal / perlu tindak lanjut…"></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-user-cog"></i> Teknisi <span class="mnt-req">*</span></div><select class="mnt-form-sel" id="mnt-ws-sig-tek"><option value="">— Pilih Teknisi —</option></select></div>'+
    '</div>';
    _ensureTeknisiLoaded(function(){ _mntFillTeknisiSel('mnt-ws-sig-tek'); });
  } else if(jenis==='ont_replace'){
    fa.innerHTML='<div class="mnt-form-area">'+
      '<div style="background:rgba(8,145,178,.07);border:1px solid rgba(8,145,178,.2);border-radius:var(--rs);padding:10px 12px;margin-bottom:10px;display:flex;align-items:center;gap:8px">'+
        '<i class="ti ti-info-circle" style="color:var(--cyan);font-size:15px;flex-shrink:0"></i>'+
        '<div style="font-size:11px;color:var(--cyan);font-weight:600">SN Lama: <span style="font-family:\'JetBrains Mono\',monospace">'+snLama+'</span></div>'+
      '</div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-router"></i> Material ONT</div><select class="mnt-form-sel" id="mnt-ws-ont-mat"><option value="">— Tanpa material —</option>'+mo+'</select></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-scan"></i> SN ONT Baru <span class="mnt-req">*</span></div><input class="mnt-form-inp" id="mnt-ws-ont-sn" type="text" placeholder="Scan atau ketik SN ONT baru…" style="font-family:\'JetBrains Mono\',monospace;font-weight:700"></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-user-cog"></i> Teknisi <span class="mnt-req">*</span></div><select class="mnt-form-sel" id="mnt-ws-ont-tek"><option value="">— Pilih Teknisi —</option></select></div>'+
    '</div>';
    _ensureTeknisiLoaded(function(){ _mntFillTeknisiSel('mnt-ws-ont-tek'); });
  } else if(jenis==='kabel_replace'){
    fa.innerHTML='<div class="mnt-form-area">'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-timeline"></i> Material Kabel Precon</div><select class="mnt-form-sel" id="mnt-ws-kbl-mat"><option value="">— Tanpa material —</option>'+mo+'</select></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-ruler-measure"></i> Jumlah Kabel (roll) <span class="mnt-req">*</span></div><input class="mnt-form-inp" id="mnt-ws-kbl-pjg" type="number" min="1" placeholder="0" style="font-size:20px;font-weight:800;text-align:center"></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-user-cog"></i> Teknisi <span class="mnt-req">*</span></div><select class="mnt-form-sel" id="mnt-ws-kbl-tek"><option value="">— Pilih Teknisi —</option></select></div>'+
    '</div>';
    _ensureTeknisiLoaded(function(){ _mntFillTeknisiSel('mnt-ws-kbl-tek'); });
  } else if(jenis==='ont_rusak'){

    fa.innerHTML='<div class="mnt-form-area">'+
      '<div style="background:rgba(220,38,38,.07);border:1px solid rgba(220,38,38,.2);border-radius:var(--rs);padding:10px 12px;margin-bottom:10px">'+
        '<div style="font-size:11px;color:var(--red);font-weight:700"><i class="ti ti-alert-triangle"></i> ONT lama akan dicatat rusak/hilang — stok berkurang 1</div>'+
        (pel.sn_ont?'<div style="font-size:10px;color:var(--text3);margin-top:4px">SN Lama: <span style="font-family:monospace;font-weight:700">'+snLama+'</span></div>':'')+
      '</div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-alert-triangle" style="color:var(--red)"></i> Kondisi ONT Lama <span class="mnt-req">*</span></div>'+
        '<select class="mnt-form-sel" id="mnt-ws-rsk-alasan">'+
          '<option value="rusak">ONT Rusak (hardware)</option>'+
          '<option value="hilang">ONT Hilang / Dicuri</option>'+
        '</select>'+
      '</div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-router"></i> Item ONT Lama (stok berkurang) <span style="color:var(--text3);font-weight:600;text-transform:none;letter-spacing:0">— otomatis</span></div>'+
        '<select class="mnt-form-sel" id="mnt-ws-rsk-mat" disabled style="background:var(--bg4);color:var(--text2);cursor:not-allowed"><option value="">— Tanpa material —</option>'+mo+'</select>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:4px"><i class="ti ti-lock"></i> Mengikuti data material ONT pelanggan, tidak dapat diubah</div>'+
      '</div>'+
      '<div style="background:rgba(5,150,105,.07);border:1px solid rgba(5,150,105,.2);border-radius:var(--rs);padding:10px 12px;margin-bottom:10px;margin-top:4px">'+
        '<div style="font-size:11px;color:var(--green);font-weight:700"><i class="ti ti-replace"></i> ONT Pengganti (wajib diisi)</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:2px">ONT rusak/hilang harus langsung diganti. Isi SN ONT baru.</div>'+
      '</div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-router"></i> Material ONT Baru</div>'+
        '<select class="mnt-form-sel" id="mnt-ws-rsk-mat-baru"><option value="">— Pilih material ONT —</option>'+mo+'</select>'+
      '</div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-scan"></i> SN ONT Baru <span class="mnt-req">*</span></div>'+
        '<input class="mnt-form-inp" id="mnt-ws-rsk-sn-baru" type="text" placeholder="Scan atau ketik SN ONT baru…" style="font-family:monospace;font-weight:700">'+
      '</div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-user-cog"></i> Teknisi <span class="mnt-req">*</span></div>'+
        '<select class="mnt-form-sel" id="mnt-ws-rsk-tek"><option value="">— Pilih Teknisi —</option></select>'+
      '</div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-note"></i> Keterangan</div>'+
        '<input class="mnt-form-inp" id="mnt-ws-rsk-ket" type="text" placeholder="Deskripsi kejadian…">'+
      '</div>'+
    '</div>';
    if(pel.ont_item_id){ var sr=document.getElementById('mnt-ws-rsk-mat'); if(sr) sr.value=pel.ont_item_id; }
    _ensureTeknisiLoaded(function(){ _mntFillTeknisiSel('mnt-ws-rsk-tek'); });
    } else if(jenis==='odp_port_move'){
    fa.innerHTML='<div class="mnt-form-area">'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-plug"></i> ODP Tujuan <span class="mnt-req">*</span></div><select class="mnt-form-sel" id="mnt-ws-pm-odp" onchange="mntWsFillPortSel()"><option value="">— Pilih ODP —</option>'+oo+'</select></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-circuit-switchboard"></i> Port Tujuan <span class="mnt-req">*</span></div><select class="mnt-form-sel" id="mnt-ws-pm-port" disabled><option value="">— Pilih ODP dulu —</option></select></div>'+
      '<div class="mnt-form-group"><div class="mnt-form-lbl"><i class="ti ti-user-cog"></i> Teknisi <span class="mnt-req">*</span></div><select class="mnt-form-sel" id="mnt-ws-pm-tek"><option value="">— Pilih Teknisi —</option></select></div>'+
    '</div>';
    _ensureTeknisiLoaded(function(){ _mntFillTeknisiSel('mnt-ws-pm-tek'); });
  }
  var btn=document.getElementById('mnt-ws-pel-submit-btn'); if(btn) btn.style.display='flex';
}

function mntWsFillPortSel(){
  var os=document.getElementById('mnt-ws-pm-odp'); var ps=document.getElementById('mnt-ws-pm-port');
  if(!os||!ps) return; var oid=os.value;
  if(!oid){ps.disabled=true;ps.innerHTML='<option value="">— Pilih ODP dulu —</option>';return;}
  var pts=_mntWs.ports.filter(function(p){return p.odp_id===oid&&(p.status==='kosong'||p.status==='available');});
  ps.disabled=!pts.length;
  ps.innerHTML='<option value="">— Pilih port —</option>'+pts.map(function(p){return '<option value="'+p.id+'">Port '+p.nomor_port+'</option>';}).join('');
}

function mntWsCloseSheet(){
  var ov=document.getElementById('mnt-ws-overlay'); if(ov) ov.classList.remove('on');
  _mntWs.ctx=null; _mntWs.ctxJenis=null;

  var hd=document.getElementById('mnt-ws-sheet-hd-area'); if(hd) hd.innerHTML='';
}

function mntWsSubmitOdp(){
  var matId=(document.getElementById('mnt-ws-odp-mat')||{}).value||'';
  var tek=((document.getElementById('mnt-ws-odp-tek')||{}).value||'').trim();
  var ket=((document.getElementById('mnt-ws-odp-ket')||{}).value||'').trim();
  var ctx=_mntWs.ctx; if(!ctx||ctx.type!=='odp'){toast('Konteks tidak valid','err');return;}
  var sb=getSB(); if(!sb){toast('DB tidak terhubung','err');return;}
  var odp=ctx.data; var tgl=new Date().toISOString().slice(0,10);
  var btn=document.querySelector('#mnt-ws-sheet-foot .mnt-btn-save');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span> Menyimpan…';}
  var matTask = matId
    ? _matMutasi(matId, -1, 'odp_maintenance', {area_id:odp.area_id||null, odp_id:odp.id, teknisi:tek||null, tgl:tgl, keterangan:ket||('Maintenance ODP '+odp.kode)})
    : Promise.resolve({ok:true});
  matTask.then(function(res){
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}
    if(!res.ok){ toast('Maintenance dicatat tapi stok gagal: '+(res.error||''),'warn'); }
    else toast('Maintenance ODP '+_esc(odp.kode)+' tersimpan','ok');
    mntWsCloseSheet(); mntMatRender(); mntHistLoad(); mntOdpSearch('');
    if(typeof SOT!=='undefined') SOT.invalidate('general');
  }).catch(function(e){if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}toast('Error: '+(e.message||''),'err');});
}

function mntWsSubmitOdc(){
  var matId=(document.getElementById('mnt-ws-odc-mat')||{}).value||'';
  var tek=((document.getElementById('mnt-ws-odc-tek')||{}).value||'').trim();
  var ket=((document.getElementById('mnt-ws-odc-ket')||{}).value||'').trim();
  var ctx=_mntWs.ctx; if(!ctx||ctx.type!=='odc'){toast('Konteks tidak valid','err');return;}
  var sb=getSB(); if(!sb){toast('DB tidak terhubung','err');return;}
  var odc=ctx.data; var tgl=new Date().toISOString().slice(0,10);
  var btn=document.querySelector('#mnt-ws-sheet-foot .mnt-btn-save');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span> Menyimpan…';}
  var matTask = matId
    ? _matMutasi(matId, -1, 'odc_maintenance', {area_id:odc.area_id||null, odc_id:odc.id, teknisi:tek||null, tgl:tgl, keterangan:ket||('Maintenance ODC '+odc.kode)})
    : Promise.resolve({ok:true});
  matTask.then(function(res){
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}
    if(!res.ok){ toast('Maintenance dicatat tapi stok gagal: '+(res.error||''),'warn'); }
    else toast('Maintenance ODC '+_esc(odc.kode)+' tersimpan','ok');
    mntWsCloseSheet(); mntMatRender(); mntHistLoad();
    if(typeof SOT!=='undefined') SOT.invalidate('general');
  }).catch(function(e){if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}toast('Error: '+(e.message||''),'err');});
}

function mntWsSubmitPel(){
  var jenis=_mntWs.ctxJenis; if(!jenis){toast('Pilih jenis perbaikan','err');return;}
  var ctx=_mntWs.ctx; if(!ctx||ctx.type!=='pel'){toast('Konteks tidak valid','err');return;}
  var sb=getSB(); if(!sb){toast('DB tidak terhubung','err');return;}
  var pel=ctx.data; var tgl=new Date().toISOString().slice(0,10);
  var btn=document.getElementById('mnt-ws-pel-submit-btn');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span>';}
  function done(msg){if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}toast(msg,'ok');mntWsCloseSheet();mntWsRefresh();}
  function fail(msg){if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}toast(msg,'err');}
  if(jenis==='signal_check'){
    var rx=(document.getElementById('mnt-ws-sig-rx')||{}).value||'';
    var ket=((document.getElementById('mnt-ws-sig-ket')||{}).value||'').trim();
    var tek=((document.getElementById('mnt-ws-sig-tek')||{}).value||'').trim();
    sb.from('material_mutasi').insert([{jenis:'signal_check',jumlah:0,stok_sebelum:0,stok_sesudah:0,pel_cid:pel.cid,pel_id:pel.id,area_id:pel.area_id||null,odp_id:pel.odp_id||null,teknisi:tek||null,tgl:tgl,keterangan:'[Cek Sinyal] '+pel.cid+(rx?' Rx:'+rx+'dBm':'')+(ket?' - '+ket:'')}])
      .then(function(r){if(r&&r.error)fail('Gagal: '+(r.error.message||'')); else done('Cek sinyal dicatat'+(rx?' Rx:'+rx+' dBm':''));}).catch(function(e){fail('Error: '+(e.message||''));});
  } else if(jenis==='ont_replace'){
    var matId=(document.getElementById('mnt-ws-ont-mat')||{}).value||'';
    var sn=((document.getElementById('mnt-ws-ont-sn')||{}).value||'').trim().toUpperCase();
    var tek2=((document.getElementById('mnt-ws-ont-tek')||{}).value||'').trim();
    if(!sn){fail('Masukkan SN ONT baru');return;}
    var oldOntItemId = pel.ont_item_id || null;
    var pelPatchData = {sn_ont:sn};
    if(matId) pelPatchData.ont_item_id = matId;
    var pelPatch=sb.from('pelanggan').update(pelPatchData).eq('id',pel.id);

    var matTask = matId
      ? _matMutasi(matId, -1, 'maintenance_ont', {sn_ont:sn, pel_cid:pel.cid, pel_id:pel.id, area_id:pel.area_id||null, odp_id:pel.odp_id||null, teknisi:tek2||null, tgl:tgl, keterangan:'Ganti ONT '+pel.cid+' SN:'+sn})
      : Promise.resolve({ok:true});

    var rusakTask = oldOntItemId
      ? sb.from('material_mutasi').insert([{
          item_id:oldOntItemId, jenis:'rusak', jumlah:1, stok_sebelum:0, stok_sesudah:0,
          pel_cid:pel.cid, pel_id:pel.id, area_id:pel.area_id||null, odp_id:pel.odp_id||null,
          teknisi:tek2||null, tgl:tgl, sn_ont:pel.sn_ont||null,
          keterangan:'ONT lama rusak — diganti SN baru '+sn+' CID '+pel.cid
        }]).then(function(){return {ok:true};}).catch(function(){return {ok:false};})
      : Promise.resolve({ok:true});
    Promise.all([pelPatch, matTask, rusakTask]).then(function(rs){
      var pr=rs[0], mr=rs[1];
      if(pr && pr.error) fail('Gagal: '+(pr.error.message||''));
      else if(!mr.ok) { toast('SN ONT diganti tapi stok gagal: '+(mr.error||''),'warn'); done('ONT diganti - SN: '+sn); }
      else done('ONT diganti - SN: '+sn+(oldOntItemId?' · ONT lama dicatat Rusak':''));
    }).catch(function(e){fail('Error: '+(e.message||''));});
  } else if(jenis==='ont_rusak'){
    var alasan=((document.getElementById('mnt-ws-rsk-alasan')||{}).value||'rusak');
    var matId5=(document.getElementById('mnt-ws-rsk-mat')||{}).value||'';
    var matIdBaru=(document.getElementById('mnt-ws-rsk-mat-baru')||{}).value||'';
    var snBaru=((document.getElementById('mnt-ws-rsk-sn-baru')||{}).value||'').trim().toUpperCase();
    var tek5=((document.getElementById('mnt-ws-rsk-tek')||{}).value||'').trim();
    var ket5=((document.getElementById('mnt-ws-rsk-ket')||{}).value||'').trim();
    var jenisMutasi = (alasan==='hilang') ? 'hilang' : 'rusak';
    var labelMutasi = (alasan==='hilang') ? 'ONT Hilang/Dicuri' : 'ONT Rusak';

    if(!snBaru){ fail('SN ONT baru wajib diisi — ONT harus langsung diganti'); return; }

    // Step 1: Catat ONT lama rusak/hilang (kurangi stok jika ada matId)
    var step1 = matId5
      ? _matMutasi(matId5, -1, jenisMutasi, {sn_ont:pel.sn_ont||null, pel_cid:pel.cid, pel_id:pel.id, area_id:pel.area_id||null, odp_id:pel.odp_id||null, teknisi:tek5||null, tgl:tgl, keterangan:labelMutasi+' '+pel.cid+(ket5?' - '+ket5:'')})
      : Promise.resolve({ok:true});

    step1.then(function(mr){
      if(!mr||!mr.ok){ fail('Gagal mencatat ONT lama: '+(mr&&mr.error||'')); return; }

      // Step 2: Ganti ONT (catat maintenance_ont + update pelanggan)
      var pelPatchData = {sn_ont:snBaru};
      if(matIdBaru) pelPatchData.ont_item_id = matIdBaru;

      var patchPel = sb.from('pelanggan').update(pelPatchData).eq('id',pel.id);
      var matGanti = matIdBaru
        ? _matMutasi(matIdBaru, -1, 'maintenance_ont', {sn_ont:snBaru, pel_cid:pel.cid, pel_id:pel.id, area_id:pel.area_id||null, odp_id:pel.odp_id||null, teknisi:tek5||null, tgl:tgl, keterangan:'Ganti ONT ('+labelMutasi+') '+pel.cid+' SN baru:'+snBaru})
        : Promise.resolve({ok:true});

      Promise.all([patchPel, matGanti]).then(function(rs){
        var pe=rs[0]; var me=rs[1];
        if(pe&&pe.error){ toast('Data pelanggan gagal diupdate: '+(pe.error.message||''),'warn'); }
        if(!me.ok){ toast('Stok ONT baru gagal dikurangi: '+(me.error||''),'warn'); }
        done(labelMutasi+' + Ganti ONT → SN baru: '+snBaru);
      }).catch(function(e){ fail('Error ganti ONT: '+(e.message||'')); });
    }).catch(function(e){fail('Error: '+(e.message||''));});
  } else if(jenis==='kabel_replace'){
    var matId2=(document.getElementById('mnt-ws-kbl-mat')||{}).value||'';
    var pjg=parseInt((document.getElementById('mnt-ws-kbl-pjg')||{}).value||'0');
    var tek3=((document.getElementById('mnt-ws-kbl-tek')||{}).value||'').trim();
    if(!pjg||pjg<=0){fail('Masukkan jumlah kabel dalam roll');return;}
    var pelPatch2=sb.from('pelanggan').update({panjang_kabel:pjg}).eq('id',pel.id);
    var matTask2 = matId2
      ? _matMutasi(matId2, -pjg, 'maintenance_kabel', {pel_cid:pel.cid, pel_id:pel.id, area_id:pel.area_id||null, odp_id:pel.odp_id||null, teknisi:tek3||null, tgl:tgl, keterangan:'Ganti kabel precon '+pjg+' roll CID '+pel.cid})
      : Promise.resolve({ok:true});
    Promise.all([pelPatch2, matTask2]).then(function(rs){
      var pr=rs[0], mr=rs[1];
      if(pr && pr.error) fail('Gagal: '+(pr.error.message||''));
      else if(!mr.ok) toast('Kabel diganti tapi stok gagal: '+(mr.error||''),'warn'),done('Kabel precon '+pjg+' roll tersimpan');
      else done('Kabel precon '+pjg+' roll tersimpan');
    }).catch(function(e){fail('Error: '+(e.message||''));});
  } else if(jenis==='odp_port_move'){
    var newOdp=(document.getElementById('mnt-ws-pm-odp')||{}).value||'';
    var newPort=(document.getElementById('mnt-ws-pm-port')||{}).value||'';
    var tek4=((document.getElementById('mnt-ws-pm-tek')||{}).value||'').trim();
    if(!newOdp||!newPort){fail('Pilih ODP dan Port tujuan');return;}
    var portObj=_mntWs.ports.find(function(p){return p.id===newPort;});
    var portN=portObj?portObj.nomor_port:null;
    var ops3=[
      sb.from('pelanggan').update({odp_id:newOdp,nomor_port:portN}).eq('id',pel.id),
      sb.from('odp_ports').update({status:'terpakai',cid_pelanggan:pel.cid,pel_id:pel.id}).eq('id',newPort)
    ];
    if(pel.odp_id&&pel.nomor_port){
      var oldP=_mntWs.ports.find(function(p){return p.odp_id===pel.odp_id&&String(p.nomor_port)===String(pel.nomor_port);});
      if(oldP) ops3.push(sb.from('odp_ports').update({status:'kosong',cid_pelanggan:null,pel_id:null}).eq('id',oldP.id));
    }
    Promise.all(ops3).then(function(rs){var e=rs.find(function(r){return r&&r.error;});if(e)fail('Gagal: '+(e.error.message||'')); else done('Pindah ke port '+portN);}).catch(function(e){fail('Error: '+(e.message||''));});
  }
}

function navMaintenance(btnEl){ nav('maintenance',btnEl); setTimeout(function(){mntWsInit();},80); }
function mntLoad(){ mntWsInit(); }
function mntTab(){ }
function mntSearchPelanggan(q){ mntPelSearch(q); }
function mntSearchOdp(q){ mntOdpSearch(q); }
function mntSearchOdc(q){ mntOdcSearch(q); }
function mntFillMaterialDropdown(){ } function mntFillAreaChips(){ }
function mntResetOdp(){ } function mntResetOdc(){ } function mntResetPelanggan(){ }
function mntOdpMaterialChange(){ } function mntOdcMaterialChange(){ }
function mntSubmitOdp(){ mntWsSubmitOdp(); }
function mntSubmitOdc(){ mntWsSubmitOdc(); }
function mntSubmitPelanggan(){ mntWsSubmitPel(); }
function mntSelectPelanggan(id){ mntWsOpenPel(id); }
function mntSelectOdp(id){ mntWsOpenOdp(id); }
function mntSelectOdc(id){ mntWsOpenOdc(id); }
function mntPelJenisChange(){ } function mntFillOdpOdcSelect(){ } function mntSearchOdpForPort(){ }

function escapeHtml(text){
  if(!text) return '';
  return text.replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

/* ── Load ── */

/* ── Force sync semua data dari dismantle yang sudah selesai ── */

function dmtLoad(){
  var list = document.getElementById('dmt-list');
  if(list) list.innerHTML = '<div class="dmt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:32px;opacity:.3"></i></div>';
  var sb = getSB();
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Database tidak terhubung</p></div>'; return; }

  /* Preload data pelanggan aktif agar siap saat form dismantle dibuka */
  if(!_dmtPelLoading && !(window._dmtPelData && window._dmtPelData.length)){
    _dmtPelLoading=true;
    var qPelBase = sb.from('pelanggan')
      .select('id,cid,nama,status,area_id,kecamatan,kelurahan,sn_ont,odp_id,odc_id,nomor_port,ont_item_id,kabel_item_id,paket,tgl_pasang,teknisi_pasang,ont_model,panjang_kabel,mac_ont,lat,lng,keterangan')
      .neq('status','cabut');
    if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
      var sc=typeof _getUserAreaScope==='function'?_getUserAreaScope():null;
      if(sc&&sc.area_coverage_id) qPelBase=qPelBase.eq('area_id',sc.area_coverage_id);
    }
    qPelBase.then(function(r){ _dmtPelLoading=false; if(!r.error&&r.data){ window._dmtPelData=r.data; _dmtPelData=window._dmtPelData; } }).catch(function(){ _dmtPelLoading=false; });
  }

  /* Pastikan areaData tersedia */
  var p1 = _areaData.length>0 ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; });

  p1.then(function(){
    _dmtFillFilters();
    dmtBuildAreaChips(); /* Render area chips segera setelah _areaData siap */
    /* Kolom eksplisit — hindari * agar tidak error jika ada kolom baru/beda */
    var cols = 'id,pel_id,cid_pelanggan,nama_pelanggan,tgl_cabut,alasan,catatan,teknisi,ont_kembali,sn_ont,precon_kembali,panjang_kabel,adapter_kembali,status,area_id,kecamatan,kelurahan,created_at,ont_item_id,kabel_item_id';
    var qDmt = sb.from('dismantle_orders').select(cols).order('created_at',{ascending:false});
    if(typeof _applyAreaFilter==='function') qDmt = _applyAreaFilter(qDmt, 'area_id');
    return qDmt;
  }).then(function(r){
    if(r && r.error){
      /* Coba fallback minimal columns jika ada error */
      var qDmtFb = sb.from('dismantle_orders').select('id,pel_id,cid_pelanggan,tgl_cabut,alasan,status,ont_kembali,ont_item_id,kabel_item_id,created_at,area_id').order('created_at',{ascending:false});
      if(typeof _applyAreaFilter==='function') qDmtFb = _applyAreaFilter(qDmtFb, 'area_id');
      return qDmtFb;
    }
    return r;
  }).then(function(r){
    if(r && r.error){
      /* Cek apakah error karena kolom tidak ada → tampilkan SQL banner */
      var em=(r.error.message||'');
      if(em.indexOf('column')!==-1||em.indexOf('does not exist')!==-1||em.indexOf('Could not find')!==-1){ _dmtShowSqlBanner(); }
      if(list) list.innerHTML='<div class="dmt-empty"><div class="dmt-empty-ico"><i class="ti ti-alert-triangle"></i></div><div class="dmt-empty-t">Gagal memuat data</div><div class="dmt-empty-d">Coba refresh halaman.</div></div>';
      return;
    }
    _dmtData = (r && r.data) || [];
    _dmtLoaded = true;
    dmtUpdateStats();
    dmtRender();
    dmtWilRender();
    dmtBuildAreaChips();
  }).catch(function(e){
    if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+_esc((e&&e.message)||'coba lagi')+'</p></div>';
  });
}

/* ── Fill filters ── */
function _dmtFillFilters(){
  var sel = document.getElementById('dmt-fil-area');
  if(sel){
    var cur = sel.value;
    var scoped = (typeof _isGlobalRole==='function' && !_isGlobalRole());
    var sc = scoped && typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
    sel.innerHTML = scoped ? '' : '<option value="">Semua Area</option>';
    _areaData.forEach(function(a){
      if(scoped && sc && a.id!==sc.area_coverage_id) return;
      var o=document.createElement('option'); o.value=a.id; o.textContent=a.nama;
      if(a.id===cur || (scoped && sc && a.id===sc.area_coverage_id)) o.selected=true; sel.appendChild(o);
    });
    if(scoped){ sel.disabled = true; }
  }
}

/* ── Stats ── */
function dmtUpdateStats(){
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  var now=new Date(), bulan=now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2);
  e('dmt-stat-total',   _dmtData.length);
  e('dmt-stat-open',    _dmtData.filter(function(x){return x.status==='pengajuan';}).length);
  e('dmt-stat-proses',  _dmtData.filter(function(x){return ['verifikasi','penugasan','eksekusi','recovery'].indexOf(x.status)>=0;}).length);
  e('dmt-stat-selesai', _dmtData.filter(function(x){return x.status==='selesai';}).length);
  e('dmt-bln-ini',      _dmtData.filter(function(x){return x.status==='selesai'&&(x.tgl_cabut||'').slice(0,7)===bulan;}).length);
  e('dmt-mat-kembali',  _dmtData.filter(function(x){return x.status==='selesai'&&x.ont_kembali;}).length);
  e('dmt-ont-hilang',   _dmtData.filter(function(x){return x.status==='selesai'&&!x.ont_kembali;}).length);
  e('dmt-port-released',_dmtData.filter(function(x){return x.status==='selesai';}).length);
}

/* ── Search / Page ── */
function dmtSearch(q){ _dmtSearch=q; _dmtPage=1; var c=document.getElementById('dmt-search-clr'); if(c) c.style.display=q?'block':'none'; dmtRender(); }
function dmtClearSearch(){ _dmtSearch=''; var i=document.getElementById('dmt-search'); if(i) i.value=''; var c=document.getElementById('dmt-search-clr'); if(c) c.style.display='none'; _dmtPage=1; dmtRender(); }
function dmtPage(dir){ var pages=Math.max(1,Math.ceil(_dmtFil.length/_dmtPerPg)); _dmtPage=Math.min(pages,Math.max(1,_dmtPage+dir)); dmtRender(); }

/* ── Render list ── */
function dmtRender(){
  var q = (_dmtSearch||'').toLowerCase().trim();
  var fSt = (document.getElementById('dmt-fil-status')||{}).value||'';
  var fAr = (document.getElementById('dmt-fil-area')||{}).value||'';
  var fAl = (document.getElementById('dmt-fil-alasan')||{}).value||'';

  _dmtFil = _dmtData.filter(function(x){
    var matchQ  = !q || (x.cid_pelanggan||'').toLowerCase().includes(q) || (x.nama_pelanggan||'').toLowerCase().includes(q);
    var matchSt = !fSt || x.status===fSt;
    var effArea = _dmtSelArea || fAr;
    var matchAr = !effArea || x.area_id===effArea;
    var matchAl = !fAl || x.alasan===fAl;
    return matchQ && matchSt && matchAr && matchAl;
  });

  var total=_dmtFil.length, pages=Math.max(1,Math.ceil(total/_dmtPerPg));
  if(_dmtPage>pages) _dmtPage=pages;
  var list=document.getElementById('dmt-list'); if(!list) return;

  if(!total){
    list.innerHTML='<div class="olt-empty"><i class="ti ti-plug-x"></i><p>Tidak ada pengajuan dismantle</p></div>';
    document.getElementById('dmt-pagi').style.display='none'; return;
  }

  var slice=_dmtFil.slice((_dmtPage-1)*_dmtPerPg, _dmtPage*_dmtPerPg);
  list.innerHTML = slice.map(function(x){
    var stFlow = DMT_FLOW.find(function(f){return f.key===x.status;})||DMT_FLOW[0];
    var alasanLbl = DMT_ALASAN[x.alasan]||x.alasan||'—';
    var ar = _areaData.find(function(a){return a.id===x.area_id;}); var arNm=ar?ar.nama:(x.area_coverage||'');
    var isSelesai = x.status==='selesai';
    var accentStyle = isSelesai ? 'background:var(--green)' : 'background:var(--c1)';
    var ontkmbStr = x.ont_kembali
      ? '<span class="tag tg" style="font-size:9px"><i class="ti ti-check" style="font-size:9px"></i> ONT Kembali</span>'
      : '<span class="tag tr" style="font-size:9px"><i class="ti ti-x" style="font-size:9px"></i> ONT Hilang</span>';
    return '<div class="dmt-row" onclick="dmtOpenDet(\''+x.id+'\')">'+
      '<div class="dmt-row-accent" style="'+accentStyle+'"></div>'+
      '<div class="dmt-row-body">'+
        '<div class="dmt-row-top">'+
          '<div class="dmt-row-ico" style="background:'+stFlow.color+'20;"><i class="ti '+stFlow.ico+'" style="color:'+stFlow.color+';font-size:18px"></i></div>'+
          '<div style="flex:1;min-width:0">'+
            '<div class="dmt-row-name">'+_esc(x.nama_pelanggan||'Pelanggan')+'</div>'+
            '<div class="dmt-row-cid">'+_esc(x.cid_pelanggan||'')+'</div>'+
          '</div>'+
          '<i class="ti ti-chevron-right" style="font-size:14px;color:var(--text4);flex-shrink:0;margin-left:4px;margin-top:2px"></i>'+
        '</div>'+
        '<div class="dmt-row-tags">'+
          '<span class="tag" style="background:'+stFlow.color+'18;color:'+stFlow.color+';font-size:9px">'+stFlow.label+'</span>'+
          '<span class="tag tgr" style="font-size:9px">'+_esc(alasanLbl)+'</span>'+
          (arNm?'<span class="tag tc1" style="font-size:9px">'+_esc(arNm)+'</span>':'')+
          ontkmbStr+
        '</div>'+
        '<div class="dmt-row-meta">'+
          (x.tgl_cabut?'<span><i class="ti ti-calendar"></i> '+_esc(x.tgl_cabut)+'</span>':'')+
          (x.teknisi?'<span><i class="ti ti-user-cog"></i> '+_esc(x.teknisi)+'</span>':'')+
          (x.sn_ont?'<span style="font-family:\'JetBrains Mono\',monospace">'+_esc(x.sn_ont)+'</span>':'')+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');

  var pagi=document.getElementById('dmt-pagi');
  if(pages>1){ pagi.style.display='flex'; var prev=document.getElementById('dmt-prev'); var next=document.getElementById('dmt-next'); var info=document.getElementById('dmt-pagi-info'); if(prev) prev.disabled=_dmtPage<=1; if(next) next.disabled=_dmtPage>=pages; if(info) info.textContent=_dmtPage+' / '+pages; }
  else pagi.style.display='none';
}

var _dmtSelArea = '';

function dmtBuildAreaChips(){
  var chips = document.getElementById('dmt-area-chips'); if(!chips) return;

  var scoped = (typeof _isGlobalRole==='function' && !_isGlobalRole());

  var agg = {};
  _dmtData.forEach(function(x){
    var key = x.area_id||'';
    if(!agg[key]) agg[key]=0;
    agg[key]++;
  });

  /* Role scoped ke 1 area: data sudah difilter server-side, chip area tidak relevan/menyesatkan */
  if(scoped){
    chips.innerHTML='';
    return;
  }

  var areaList = [];
  if(_areaData && _areaData.length){
    _areaData.forEach(function(a){ areaList.push({id:a.id, nama:a.nama}); });
  } else {

    var seen={};
    _dmtData.forEach(function(x){
      if(!seen[x.area_id||'']){
        var ar=_areaData.find(function(a){return a.id===x.area_id;});
        areaList.push({id:x.area_id||'', nama:ar?ar.nama:(x.area_coverage||'Tanpa Area')});
        seen[x.area_id||'']=1;
      }
    });
  }

  areaList.sort(function(a,b){ return (agg[b.id]||0)-(agg[a.id]||0) || (a.nama||'').localeCompare(b.nama||''); });

  chips.innerHTML='';
  var allChip = document.createElement('button');
  allChip.className = 'dmt-chip' + (_dmtSelArea===''?' on':'');
  allChip.innerHTML = 'Semua <span class="dmt-chip-cnt">'+_dmtData.length+'</span>';
  allChip.onclick = function(){ dmtSelectArea(''); };
  chips.appendChild(allChip);

  areaList.forEach(function(a){
    var cnt = agg[a.id]||0;
    var c = document.createElement('button');
    c.className = 'dmt-chip' + (a.id===_dmtSelArea?' on':'');
    c.innerHTML = _esc(a.nama)+' <span class="dmt-chip-cnt">'+cnt+'</span>';
    c.onclick = (function(aid){ return function(){ dmtSelectArea(aid); }; })(a.id);
    chips.appendChild(c);
  });
}

function dmtSelectArea(areaId){
  _dmtSelArea = areaId;

  var sel = document.getElementById('dmt-fil-area');
  if(sel) sel.value = areaId;

  var chips = document.getElementById('dmt-area-chips');
  if(chips) chips.querySelectorAll('button').forEach(function(b){
    var match = (b.dataset.areaId||'')=== areaId || (areaId===''&&!b.dataset.areaId);
    b.classList.toggle('on', match);
  });

  var hint = document.getElementById('dmt-area-hint');
  if(hint){
    if(areaId){
      var ar=_areaData.find(function(a){return a.id===areaId;});
      hint.textContent='Filter: '+(ar?ar.nama:areaId);
      hint.style.color='var(--red)';
    } else {
      hint.textContent='Tap area untuk filter';
      hint.style.color='var(--text3)';
    }
  }
  dmtUpdateCtxStats();
  _dmtPage=1; dmtRender();
}

function dmtUpdateCtxStats(){
  var src = _dmtSelArea ? _dmtData.filter(function(x){return x.area_id===_dmtSelArea;}) : _dmtData;
  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  e('dmt-ctx-total',  src.length);
  e('dmt-ctx-open',   src.filter(function(x){return x.status==='pengajuan';}).length);
  e('dmt-ctx-proses', src.filter(function(x){return['verifikasi','penugasan','eksekusi','recovery'].indexOf(x.status)>=0;}).length);
  e('dmt-ctx-selesai',src.filter(function(x){return x.status==='selesai';}).length);
}

function dmtWilTab(tab, btn){
  _dmtWilTab=tab;
  document.querySelectorAll('#p-dismantle .tkt-chip').forEach(function(b){ b.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  dmtWilRender();
}

function dmtWilRender(){
  var el=document.getElementById('dmt-wil-chart'); if(!el) return;
  var tab=_dmtWilTab;
  var agg={};
  _dmtData.filter(function(x){return x.status==='selesai';}).forEach(function(x){
    var k='';
    if(tab==='area'){ var ar=_areaData.find(function(a){return a.id===x.area_id;}); k=ar?ar.nama:(x.area_coverage||'Tanpa Area'); }
    else if(tab==='kec') k=x.kecamatan||'Tanpa Kecamatan';
    else k=x.kelurahan||'Tanpa Kelurahan';
    agg[k]=(agg[k]||0)+1;
  });
  var arr=Object.keys(agg).map(function(k){return {k:k,v:agg[k]};}).sort(function(a,b){return b.v-a.v;});
  if(!arr.length){ el.innerHTML='<div style="color:var(--text3);font-size:11px;padding:10px;background:#fff;border-radius:var(--rs);text-align:center"><i class="ti ti-info-circle" style="font-size:13px;margin-right:4px"></i>Belum ada data selesai</div>'; return; }
  var mx=arr[0].v;
  el.innerHTML=arr.slice(0,8).map(function(item,i){
    var pct=mx>0?Math.round(item.v/mx*100):0;
    return '<div class="dmt-wil-bar-item">'+
      '<div class="dmt-wil-bar-row">'+
        '<span class="dmt-wil-bar-name">'+(i+1)+'. '+_esc(item.k)+'</span>'+
        '<span class="dmt-wil-bar-val">'+item.v+' cabut</span>'+
      '</div>'+
      '<div class="dmt-wil-track"><div class="dmt-wil-fill" style="width:'+pct+'%"></div></div>'+
    '</div>';
  }).join('');
}
window._dmtPelData = window._dmtPelData || [];
var _dmtPelData = window._dmtPelData;
var _dmtPelLoading = false;

function _dmtSetupTeknisiField(){
  var roEl  = document.getElementById('dmtf-teknisi-ro');
  var roVal = document.getElementById('dmtf-teknisi-ro-val');
  var selEl = document.getElementById('dmtf-teknisi-sel');
  var hidEl = document.getElementById('dmtf-teknisi');
  if(!roEl||!selEl||!hidEl) return;

  if(CR === 'teknisi'){

    roEl.style.display  = 'flex';
    selEl.style.display = 'none';
    var nm = (CU && (CU.nama || CU.username)) || 'Saya';
    roVal.textContent   = nm;
    hidEl.value         = nm;
  } else {

    roEl.style.display  = 'none';
    selEl.style.display = 'block';
    hidEl.value         = '';
    _ensureTeknisiLoaded(function(){
      selEl.innerHTML = _buildTeknisiOpts('');
      selEl.onchange = function(){ hidEl.value = this.value; };
    });
  }
}

function dmtOpenForm(){
  document.getElementById('dmt-form-title').textContent='Ajukan Dismantle / Cabut';
  document.getElementById('dmtf-id').value='';
  document.getElementById('dmtf-pel-id').value='';
  document.getElementById('dmtf-pel-search').value='';
  document.getElementById('dmtf-pel-results').style.display='none';
  document.getElementById('dmtf-pel-selected').style.display='none';

  var detCard=document.getElementById('dmtf-pel-detail');
  if(detCard) detCard.style.display='none';
  var detGrid=document.getElementById('dmtf-pel-detail-grid');
  if(detGrid) detGrid.innerHTML='';
  document.getElementById('dmtf-tgl').value=new Date().toISOString().slice(0,10);
  document.getElementById('dmtf-alasan').value='';
  document.getElementById('dmtf-catatan').value='';
  document.getElementById('dmtf-teknisi').value='';
  document.getElementById('dmtf-ont-kembali').value='ya';
  document.getElementById('dmtf-sn-ont').value='';
  document.getElementById('dmtf-precon-kembali').value='ya';
  document.getElementById('dmtf-panjang-kabel').value='';
  document.getElementById('dmtf-adapter-kembali').value='ya';
  document.getElementById('dmtf-port-info').style.display='none';

  _dmtSetupTeknisiField();
  document.getElementById('dmt-form-overlay').classList.add('on');

  // Load pelanggan aktif - filter area SOT
  var sb=getSB(); if(!sb) return;

  if(!_dmtPelLoading && !(window._dmtPelData && window._dmtPelData.length > 0)){
    _dmtPelLoading=true;
    var qPelBase2 = sb.from('pelanggan')
      .select('id,cid,nama,status,area_id,kecamatan,kelurahan,sn_ont,odp_id,odc_id,nomor_port,ont_item_id,kabel_item_id,paket,tgl_pasang,teknisi_pasang,ont_model,panjang_kabel,mac_ont,lat,lng,keterangan')
      .neq('status','cabut');
    if (!_isGlobalRole()) {
      var sc2 = _getUserAreaScope();
      if (sc2 && sc2.area_coverage_id) qPelBase2 = qPelBase2.eq('area_id', sc2.area_coverage_id);
    }
    qPelBase2.then(function(r){ _dmtPelLoading=false; if(!r.error){ window._dmtPelData=r.data||[]; _dmtPelData=window._dmtPelData; } }).catch(function(){ _dmtPelLoading=false; });
  }
  var qOdp = _pelOdpList.length > 0 ? Promise.resolve()
    : sb.from('odps').select('id,kode,nama,area_id,odc_id').order('kode')
        .then(function(r){ if(!r.error) _pelOdpList=r.data||[]; });
  var qOdc = (window._pelOdcList && window._pelOdcList.length > 0) ? Promise.resolve()
    : sb.from('odcs').select('id,kode,nama,area_id').order('kode')
        .then(function(r){ if(!r.error) window._pelOdcList=r.data||[]; });
  Promise.all([qOdp, qOdc]).then(function(){
    var pelId = document.getElementById('dmtf-pel-id').value;
    if(pelId) dmtSelectPel(pelId);
  }).catch(function(){});
}
function dmtCloseForm(){ document.getElementById('dmt-form-overlay').classList.remove('on'); document.getElementById('dmtf-pel-results').style.display='none'; }

var _dmtPelSearchTimer = null;
function dmtSearchPel(q){
  var res=document.getElementById('dmtf-pel-results'); if(!res) return;
  var term=(q||'').toLowerCase().trim();
  if(!term){ res.style.display='none'; return; }


  _dmtPelData = window._dmtPelData || [];


  if(_dmtPelData.length){
    _dmtDoSearch(term, res);
    return;
  }


  if(_dmtPelLoading){
    res.style.display='block';
    res.innerHTML='<div style="padding:12px;text-align:center;font-size:12px;color:var(--text3)"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memuat data pelanggan…</div>';
    clearTimeout(_dmtPelSearchTimer);
    _dmtPelSearchTimer = setTimeout(function(){
      var curTerm=((document.getElementById('dmtf-pel-search')||{}).value||'').toLowerCase().trim();
      if(curTerm) dmtSearchPel(curTerm);
    }, 300);
    return;
  }


  res.style.display='block';
  res.innerHTML='<div style="padding:12px;text-align:center;font-size:12px;color:var(--text3)"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memuat data pelanggan…</div>';
  clearTimeout(_dmtPelSearchTimer);
  _dmtPelLoading=true;
  var sb3=getSB();
  if(!sb3){ res.style.display='none'; _dmtPelLoading=false; return; }
  var qPelB=sb3.from('pelanggan')
    .select('id,cid,nama,status,area_id,kecamatan,kelurahan,sn_ont,odp_id,odc_id,nomor_port,ont_item_id,kabel_item_id,paket,tgl_pasang,teknisi_pasang,ont_model,panjang_kabel,mac_ont,lat,lng,keterangan')
    .neq('status','cabut');
  if(typeof _isGlobalRole==='function'&&!_isGlobalRole()){
    var sc3=typeof _getUserAreaScope==='function'?_getUserAreaScope():null;
    if(sc3&&sc3.area_coverage_id) qPelB=qPelB.eq('area_id',sc3.area_coverage_id);
  }
  qPelB.then(function(r){
    _dmtPelLoading=false;
    if(!r.error&&r.data&&r.data.length){
      window._dmtPelData=r.data; _dmtPelData=window._dmtPelData;
      var curTerm=((document.getElementById('dmtf-pel-search')||{}).value||'').toLowerCase().trim();
      if(curTerm) _dmtDoSearch(curTerm, res);
      else res.style.display='none';
    } else { res.style.display='none'; }
  }).catch(function(){ _dmtPelLoading=false; res.style.display='none'; });
}

function _dmtDoSearch(term, res){

  var src = (window._dmtPelData && window._dmtPelData.length) ? window._dmtPelData : (_dmtPelData||[]);
  var matches=src.filter(function(p){
    return (p.cid||'').toLowerCase().indexOf(term)>=0||(p.nama||'').toLowerCase().indexOf(term)>=0;
  }).slice(0,10);
  if(!matches.length){ res.style.display='none'; return; }
  res.style.display='block';
  res.innerHTML='';
  matches.forEach(function(p){
    var ar=(_areaData||[]).find(function(a){return a.id===p.area_id;}); var arNm=ar?ar.nama:'';
    var div=document.createElement('div');
    div.style.cssText='padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;touch-action:manipulation;-webkit-tap-highlight-color:rgba(0,0,0,.06);user-select:none;background:#fff;';
    div.innerHTML=
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:700;color:var(--text)">'+_esc(p.nama||'—')+'</div>'+
        '<div style="font-size:10px;color:var(--text3);font-family:\'JetBrains Mono\',monospace">'+_esc(p.cid||'')+(arNm?' · '+_esc(arNm):'')+'</div>'+
      '</div>'+
      '<span class="tag '+(p.status==='aktif'?'tg':'ty')+'">'+_esc(p.status)+'</span>';
    (function(pid){
      function selectIt(e){ e.preventDefault(); e.stopPropagation(); dmtSelectPel(pid); }
      div.addEventListener('click', selectIt);
      div.addEventListener('touchend', selectIt, {passive:false});
    })(p.id);
    res.appendChild(div);
  });
}

function dmtOnOntChange(){

}

function dmtCloseDet(){
  var o=document.getElementById('dmt-det-overlay'); if(o) o.classList.remove('on');
}
function dmtOpenDet(id){
  var x=_dmtData.find(function(d){return d.id===id;}); if(!x) return;
  _dmtDetId=id;
  document.getElementById('dmt-det-title').textContent='Detail · '+(x.cid_pelanggan||x.id.slice(0,8));

  var alasanLbl=DMT_ALASAN[x.alasan]||x.alasan||'—';
  var ar=_areaData.find(function(a){return a.id===x.area_id;}); var arNm=ar?ar.nama:(x.area_coverage||'—');

  var dr = _drDmt;
  var sec = _secDmt;

  var stColor='var(--green)'; var stLabel='Selesai';
  if(x.status&&x.status!=='selesai'){
    var stFlow=DMT_FLOW.find(function(f){return f.key===x.status;})||DMT_FLOW[0];
    stColor=stFlow.color; stLabel=stFlow.label;
  }

  var aktorInfo='';
  if(x.dilakukan_oleh||x.role_aktor){
    aktorInfo='<div class="dmt-det-aktor">'+
      '<div class="dmt-det-aktor-ico"><i class="ti ti-user-check"></i></div>'+
      '<div>'+
        '<div class="dmt-det-aktor-lbl">Dilakukan Oleh</div>'+
        '<div class="dmt-det-aktor-name">'+_esc(x.dilakukan_oleh||'—')+'</div>'+
        '<div class="dmt-det-aktor-role">'+_esc(x.role_aktor||'')+'</div>'+
      '</div>'+
    '</div>';
  }

  document.getElementById('dmt-det-body').innerHTML =
    aktorInfo+
    sec('info-circle','Informasi Cabut')+
    dr('Pelanggan','<strong>'+_esc(x.nama_pelanggan||'—')+'</strong> <span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--pu)">'+_esc(x.cid_pelanggan||'')+'</span>')+
    dr('Status','<span class="tag" style="background:'+stColor+'22;color:'+stColor+'">'+stLabel+'</span>')+
    dr('Tgl Cabut', _esc(x.tgl_cabut||'—'))+
    dr('Tgl Selesai', _esc(x.tgl_selesai||x.tgl_cabut||'—'))+
    dr('Alasan', '<span class="tag tgr">'+_esc(alasanLbl)+'</span>')+
    dr('Area', _esc(arNm))+
    (x.kecamatan?dr('Kecamatan',_esc(x.kecamatan)):'')+
    (x.kelurahan?dr('Kelurahan',_esc(x.kelurahan)):'')+
    (x.catatan?dr('Catatan',_esc(x.catatan)):'')+
    sec('user-cog','Penugasan')+
    dr('Teknisi', _esc(x.teknisi||'—'))+
    sec('package-import','Recovery Material')+
    dr('ONT', x.ont_kembali
      ? '<span class="tag tg"><i class="ti ti-check"></i> Kembali</span>'+(x.sn_ont?' <span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--text3)">'+_esc(x.sn_ont)+'</span>':'')
      : '<span class="tag tr"><i class="ti ti-x"></i> Hilang</span>'+(x.sn_ont?' SN: '+_esc(x.sn_ont):''))+
    dr('Precon/Kabel', x.precon_kembali
      ? '<span class="tag tg"><i class="ti ti-check"></i> Kembali</span>'+(x.panjang_kabel?' '+x.panjang_kabel+' m':'')
      : '<span class="tag tr"><i class="ti ti-x"></i> Hilang</span>')+
    dr('Adapter', x.adapter_kembali
      ? '<span class="tag tg"><i class="ti ti-check"></i> Kembali</span>'
      : '<span class="tag tr"><i class="ti ti-x"></i> Hilang</span>')+
    dr('Dibuat', x.created_at ? new Date(x.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—');

  document.getElementById('dmt-det-foot').innerHTML='<button class="dmtf-btn-cancel" style="flex:1" onclick="dmtCloseDet()">Tutup</button>';
  document.getElementById('dmt-det-overlay').classList.add('on');
}
var _stwData    = [];
var _stwFil     = [];
var _stwPage    = 1;
var _stwPerPg   = 15;
var _stwLoaded  = false;
var _stwDetId   = null;
var _stwSearch  = '';

var _salesTabPel   = 'rw';
var _salesTabFin   = 'area';
var _salesTabLap   = 'pel-rw';
var _salesLapData  = [];

/* ── Sales Territory JS ── */
var stCurrentRole = 'rt';
var _stScope = { area_id: null };
var ST_ADMIN_ROLES = ['super_admin','owner','area_manager','finance'];
function stIsAdmin(){ return ST_ADMIN_ROLES.indexOf(window.CR||'') >= 0; }

/* ══ HELPERS ══ */
var _stColors=['#7c3aed','#f97316','#2563eb','#16a34a','#d97706','#0891b2','#dc2626','#059669','#ea580c','#0284c7'];
function _stC(i){ return _stColors[i%_stColors.length]; }
function _stI(n){ return (n||'?').split(' ').map(function(w){return w[0]||'';}).slice(0,2).join('').toUpperCase()||'?'; }
function _stFmt(n){ if(!n&&n!==0) return 'Rp 0'; if(n>=1000000) return 'Rp '+(n/1000000).toFixed(1)+'Jt'; if(n>=1000) return 'Rp '+(n/1000).toFixed(0)+'k'; return 'Rp '+n; }
function _stLoading(id){ var e=document.getElementById(id); if(e) e.innerHTML='<div class="st-shimmer"></div><div class="st-shimmer"></div>'; }
function _stEsc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
/* Drill click handler - avoids quote escaping in onclick string building */
function _stDrillClick(el){
  var fn=el.dataset.fn, f=el.dataset.f, id=el.dataset.id, name=el.dataset.name, nl=el.dataset.nl;
  if(fn==='pel')  stPelDrill(f, id, name, nl);
  if(fn==='net')  stNetDrill(f, id, name, nl);
  if(fn==='fee')  stFeeDrill(f, id, name, nl);
  if(fn==='odp')  stNetOpenOdp(id, name);
}

function getSB2(){ return (typeof getSB==='function')?getSB():null; }

/* ══ ENTRY ══ */
function navSalesNew(btnEl){
  if(typeof nav==='function') nav('sales-dash', btnEl||null);
  if(typeof sbClose==='function') sbClose();
  setTimeout(function(){
    var role=window.CR||'';
    var pane=document.getElementById('p-sales-dash');
    if(pane&&pane.classList.contains('on')){ pane.style.display='flex'; pane.style.flexDirection='column'; pane.style.height='100%'; pane.style.overflow='hidden'; }
    var sub=document.getElementById('st-topbar-sub'), badge=document.getElementById('st-role-badge');
    var lblMap={super_admin:'Super Admin',owner:'Owner',area_manager:'Area Manager',finance:'Finance'};
    if(stIsAdmin()){
      var sc=(typeof getScopeContext==='function')?getScopeContext():null;
      _stScope.area_id=sc?sc.area_coverage_id:null;
      if(sub) sub.textContent='Semua Wilayah · '+(lblMap[role]||role);
      if(badge){ badge.textContent=lblMap[role]||role; badge.style.cssText='font-size:9px;font-weight:800;padding:3px 9px;border-radius:20px;white-space:nowrap;background:rgba(37,99,235,.12);color:#2563eb;border:1px solid rgba(37,99,235,.25)'; }
    } else {
      if(sub) sub.textContent='Wilayah Sales';
      if(badge){ badge.textContent='Sales'; badge.style.cssText='font-size:9px;font-weight:800;padding:3px 9px;border-radius:20px;white-space:nowrap;background:rgba(249,115,22,.12);color:#ea580c;border:1px solid rgba(249,115,22,.25)'; }
    }
    stGoTab('pelanggan');
  }, 30);
}
function navSales(k,s,b){ navSalesNew(b); }

/* ══ TAB NAV ══ */
function stGoTab(tab){
  document.querySelectorAll('#p-sales-dash .st-pane').forEach(function(p){ p.classList.remove('on'); });
  var el=document.getElementById('st-pane-'+tab); if(el) el.classList.add('on');
  stUpdateNav(tab);
  var c=document.getElementById('st-content'); if(c) c.scrollTop=0;
  if(tab==='home')      stHomeLoad();
  if(tab==='pelanggan') { _stPelStack=[]; _stPelLevel='area'; stPelLoad(); }
  if(tab==='jaringan')  { _stNetStack=[]; _stNetLevel='area'; stNetLoad(); }
  if(tab==='fee')       { _stFeeStack=[]; _stFeeLevel='area'; stFeeLoad(); }
}
function stUpdateNav(tab){
  /* Update tab bar baru (horizontal tab, bukan bottom nav) */
  ['pelanggan','jaringan','fee'].forEach(function(t){
    var btn = document.getElementById('st-tab-'+t);
    if(!btn) return;
    var active = (t === tab);
    btn.style.color = active ? 'var(--c2)' : 'var(--text3)';
    btn.style.borderBottomColor = active ? 'var(--c2)' : 'transparent';
    btn.style.fontWeight = active ? '800' : '700';
    btn.style.background = active ? 'rgba(249,115,22,.06)' : 'transparent';
  });
  /* Update KPI */
  setTimeout(_stUpdateKPI, 300);
}
function stCloseSheet(t){ var e=document.getElementById('st-'+t+'-overlay'); if(e) e.classList.remove('on'); }

/* ═══════════════════════════════════════
   HOME — minimal query
═══════════════════════════════════════ */
function stHomeLoad(){
  var body=document.getElementById('st-home-body'); if(!body) return;
  body.innerHTML='<div class="st-shimmer"></div><div class="st-shimmer"></div>';
  var sb=getSB2();
  if(!sb){ body.innerHTML='<div class="st-empty"><div class="st-empty-ico">⚠️</div><div class="st-empty-txt">DB tidak terhubung</div></div>'; return; }
  // Only 2 lightweight aggregate queries
  var qP=sb.from('pelanggan').select('id',{count:'exact',head:true}).eq('status','aktif');
  var qO=sb.from('odps').select('jumlah_port').eq('status','aktif');
  if(_stScope.area_id){ qP=qP.eq('area_id',_stScope.area_id); qO=qO.eq('area_id',_stScope.area_id); }
  Promise.all([qP,qO]).then(function(res){
    var pelN=(res[0]&&!res[0].error)?res[0].count||0:0;
    var odpD=(res[1]&&!res[1].error)?(res[1].data||[]):[];
    var portN=odpD.reduce(function(s,o){return s+(o.jumlah_port||0);},0);
    var util=portN>0?Math.round(pelN*100/portN):0;
    var grad=stIsAdmin()?'linear-gradient(135deg,#0f172a,#1e3a8a,#2563eb)':'linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)';
    body.innerHTML=
      '<div class="st-hero" style="background:'+grad+';margin:0">'
      +'<div class="st-hero-eyebrow">'+(stIsAdmin()?'Admin View · Semua Wilayah':'Sales Territory')+'</div>'
      +'<div class="st-hero-name">'+(stIsAdmin()?'Ringkasan Wilayah':'Halo, Sales!')+'</div>'
      +'<div class="st-hero-sub">Data real-time dari Supabase</div></div>'
      +'<div class="st-kpi-strip" style="margin:0 14px;margin-top:-28px;position:relative;z-index:10">'
      +'<div class="st-kpi-cell" onclick="stGoTab(\'pelanggan\')" style="cursor:pointer"><div class="st-kpi-n" style="color:#16a34a">'+pelN+'</div><div class="st-kpi-l">Pelanggan</div></div>'
      +'<div class="st-kpi-cell" onclick="stGoTab(\'jaringan\')" style="cursor:pointer"><div class="st-kpi-n" style="color:#2563eb">'+util+'%</div><div class="st-kpi-l">Utilisasi</div></div>'
      +'<div class="st-kpi-cell" onclick="stGoTab(\'fee\')" style="cursor:pointer"><div class="st-kpi-n" style="color:#7c3aed">'+portN+'</div><div class="st-kpi-l">Total Port</div></div></div>'
      +'<div style="padding:10px 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">'
      +'<button onclick="stGoTab(\'pelanggan\')" style="padding:12px 8px;background:#dcfce7;border:none;border-radius:10px;cursor:pointer;font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;color:#16a34a">👥 Pelanggan</button>'
      +'<button onclick="stGoTab(\'jaringan\')" style="padding:12px 8px;background:#dbeafe;border:none;border-radius:10px;cursor:pointer;font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;color:#2563eb">📡 Jaringan</button>'
      +'<button onclick="stGoTab(\'fee\')" style="padding:12px 8px;background:#ede9fe;border:none;border-radius:10px;cursor:pointer;font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;color:#7c3aed">💰 Fee</button>'
      +'</div>';
  }).catch(function(e){ body.innerHTML='<div class="st-empty"><div class="st-empty-ico">⚠️</div><div class="st-empty-txt">'+_stEsc(String(e.message||e))+'</div></div>'; });
}

/* ═══════════════════════════════════════
   SHARED DRILL HELPERS
═══════════════════════════════════════ */
function _stDrillUpdate(backBarId, backLblId, filterBarId, secTitleId, stack, levelLbls, crumbFn){
  var back=document.getElementById(backBarId), backLbl=document.getElementById(backLblId);
  var bar=document.getElementById(filterBarId), secT=document.getElementById(secTitleId);
  var depth=stack.length;
  if(back) back.style.display=depth>0?'block':'none';
  var curLevel=depth>0?stack[stack.length-1].nextLevel:'area';
  if(secT) secT.textContent=levelLbls[curLevel]||curLevel;
  if(backLbl&&depth>0) backLbl.textContent='← '+(stack[depth-1].name||'Kembali');
  if(bar){
    var crumbs=[{name:'Semua Area',d:-1}];
    stack.forEach(function(s,i){crumbs.push({name:s.name,d:i});});
    bar.innerHTML=crumbs.map(function(cr,i){
      return (i>0?'<span class="st-crumb-sep">›</span>':'')
        +'<button class="st-crumb-btn'+(i===0?' root':'')+'" onclick="'+crumbFn+'('+cr.d+')">'+_stEsc(cr.name)+'</button>';
    }).join('');
  }
}

/* ═══════════════════════════════════════
   PELANGGAN — server-side drill, no client cache
   Each level: query only count or distinct values
   Final list: paginated server-side (10/page)
═══════════════════════════════════════ */
var _stPelLevel='area', _stPelStack=[], _stPelPage=1, _stPelSearch='', _stPelTotal=0;
var _stPelLvlLbl={area:'Area Coverage',kecamatan:'Kecamatan',kelurahan:'Kelurahan',rw:'RW',rt:'RT',list:'Pelanggan'};

function stPelLoad(){
  var list=document.getElementById('st-pel-list'), cnt=document.getElementById('st-pel-count');
  var back=document.getElementById('st-pel-back-bar'), srch=document.getElementById('st-pel-search-bar');
  var pagi=document.getElementById('st-pel-pagi'), inp=document.getElementById('st-pel-search');
  if(back) back.style.display=_stPelStack.length>0?'block':'none';
  if(srch) srch.style.display=_stPelLevel==='list'?'block':'none';
  if(pagi) pagi.style.display='none';
  if(inp&&_stPelLevel!=='list') inp.value='';
  if(_stPelLevel!=='list') _stPelSearch='';
  _stDrillUpdate('st-pel-back-bar','st-pel-back-label','st-pel-filter-bar','st-pel-sec-title',_stPelStack,_stPelLvlLbl,'stPelCrumbGo');
  if(list) list.innerHTML='<div class="st-shimmer"></div><div class="st-shimmer"></div><div class="st-shimmer"></div>';
  if(cnt) cnt.textContent='—';
  var sb=getSB2(); if(!sb){ if(list) list.innerHTML='<div class="st-empty"><div class="st-empty-ico">⚠️</div><div class="st-empty-txt">DB tidak terhubung</div></div>'; return; }

  // Build filter from stack
  var ctx=_stPelCtx();

  if(_stPelLevel==='area'){
    // Just list areas — tiny query
    var q=sb.from('areas').select('id,nama,kode').order('nama');
    if(_stScope.area_id) q=q.eq('id',_stScope.area_id);
    q.then(function(r){
      var areas=(r&&!r.error)?(r.data||[]):[];
      if(cnt) cnt.textContent=areas.length+' area';
      if(!areas.length){ list.innerHTML='<div class="st-empty"><div class="st-empty-ico">🗺️</div><div class="st-empty-txt">Tidak ada area</div></div>'; return; }
      list.innerHTML=areas.map(function(a,i){
        return '<div class="st-drill-card" onclick="stPelDrill(\'area_id\',\''+_stEsc(a.id)+'\',\''+_stEsc(a.nama)+'\',\'kecamatan\')">'  
          +'<div class="st-drill-av" style="background:'+_stC(i)+';font-size:11px;font-weight:900">'+_stEsc((a.kode||a.nama||'?').replace(/\s+/g,'').slice(0,3).toUpperCase())+'</div>'
          +'<div class="st-drill-info"><div class="st-drill-name">'+_stEsc(a.nama)+'</div><div class="st-drill-sub">Klik untuk lihat kecamatan</div></div>'
          +'<span class="st-drill-chev">›</span></div>';
      }).join('');
    });
    return;
  }

  if(_stPelLevel==='list'){
    // Server-side paginated list with filters
    var offset=(_stPelPage-1)*10;
    var q2=sb.from('pelanggan').select('id,cid,nama,status,kecamatan,kelurahan,rw,rt,paket',{count:'exact'}).order('nama').range(offset,offset+9);
    q2=_stPelApplyCtx(q2,ctx);
    if(_stPelSearch) q2=q2.or('nama.ilike.%'+_stPelSearch+'%,cid.ilike.%'+_stPelSearch+'%');
    q2.then(function(r){
      var data=(r&&!r.error)?(r.data||[]):[], total=(r&&!r.error)?r.count||0:0;
      _stPelTotal=total;
      if(cnt) cnt.textContent=total+' data';
      if(!data.length){ list.innerHTML='<div class="st-empty"><div class="st-empty-ico">👥</div><div class="st-empty-txt">Tidak ada pelanggan</div></div>'; pagi.style.display='none'; return; }
      list.innerHTML=data.map(function(p,i){
        var sc=p.status==='aktif'?'ps-aktif':p.status==='suspend'?'ps-suspend':'ps-cabut';
        var st=p.status==='aktif'?'Aktif':p.status==='suspend'?'Suspend':'Cabut';
        var meta=[p.cid,p.paket,p.kelurahan?(p.rw?'Kel.'+p.kelurahan+' RW'+p.rw+(p.rt?' RT'+p.rt:''):'Kel.'+p.kelurahan):''].filter(Boolean).join(' · ');
        return '<div class="st-pel-item"><div class="st-pel-av" style="background:'+_stC(i+offset)+'">'+_stI(p.nama)+'</div>'
          +'<div class="st-pel-info"><div class="st-pel-name">'+_stEsc(p.nama)+'</div><div class="st-pel-meta">'+_stEsc(meta)+'</div></div>'
          +'<span class="st-pel-status '+sc+'">'+st+'</span></div>';
      }).join('');
      var pages=Math.ceil(total/10);
      if(pagi) pagi.style.display=pages>1?'flex':'none';
      var prev=document.getElementById('st-pel-prev'); if(prev) prev.disabled=_stPelPage<=1;
      var next=document.getElementById('st-pel-next'); if(next) next.disabled=_stPelPage>=pages;
      var info=document.getElementById('st-pel-pagi-info'); if(info) info.textContent=_stPelPage+' / '+pages;
    });
    return;
  }

  // Drill levels: kecamatan, kelurahan, rw, rt — query distinct values with counts
  var fieldMap={kecamatan:'kecamatan',kelurahan:'kelurahan',rw:'rw',rt:'rt'};
  var groupField=fieldMap[_stPelLevel];
  var nextLvl={kecamatan:'kelurahan',kelurahan:'rw',rw:'rt',rt:'list'}[_stPelLevel]||'list';
  var prefix={kecamatan:'Kec. ',kelurahan:'Kel. ',rw:'RW ',rt:'RT '}[_stPelLevel]||'';
  // Query only the group field + status — minimal payload
  var q3=sb.from('pelanggan').select(groupField+',status');
  q3=_stPelApplyCtx(q3,ctx);
  q3.then(function(r){
    var data=(r&&!r.error)?(r.data||[]):[];
    var groups={}; data.forEach(function(p){ var v=p[groupField]; if(!v) return; if(!groups[v]) groups[v]={aktif:0,total:0}; groups[v].total++; if(p.status==='aktif') groups[v].aktif++; });
    var keys=Object.keys(groups).sort();
    if(cnt) cnt.textContent=keys.length;
    list.innerHTML=keys.length?keys.map(function(k,i){
      var d=groups[k];
      return '<div class="st-drill-card" data-fn="pel" data-f="'+_stEsc(groupField)+'" data-id="'+_stEsc(k)+'" data-name="'+_stEsc(prefix+k)+'" data-nl="'+_stEsc(nextLvl)+'" onclick="_stDrillClick(this)">'
        +'<div class="st-drill-av" style="background:'+_stC(i)+';font-size:11px;font-weight:900">'+_stEsc(k.slice(-3))+'</div>'
        +'<div class="st-drill-info"><div class="st-drill-name">'+_stEsc(prefix+k)+'</div><div class="st-drill-sub">'+d.aktif+' aktif · '+d.total+' total</div></div>'
        +'<span class="st-drill-badge" style="background:#dcfce7;color:#16a34a">'+d.aktif+'</span>'
        +'<span class="st-drill-chev">›</span></div>';
    }).join(''):'<div class="st-empty"><div class="st-empty-ico">📭</div><div class="st-empty-txt">Tidak ada data</div></div>';
  });
}
function _stPelCtx(){ var ctx={}; _stPelStack.forEach(function(s){ctx[s.fieldName]=s.id;}); return ctx; }
function _stPelApplyCtx(q,ctx){
  if(ctx.area_id)    q=q.eq('area_id',ctx.area_id);    else if(_stScope.area_id) q=q.eq('area_id',_stScope.area_id);
  if(ctx.kecamatan)  q=q.eq('kecamatan',ctx.kecamatan);
  if(ctx.kelurahan)  q=q.eq('kelurahan',ctx.kelurahan);
  if(ctx.rw)         q=q.eq('rw',ctx.rw);
  if(ctx.rt)         q=q.eq('rt',ctx.rt);
  return q;
}
function stPelDrill(fieldName,id,name,nextLevel){ _stPelStack.push({fieldName:fieldName,id:id,name:name,prevLevel:_stPelLevel}); _stPelLevel=nextLevel; _stPelPage=1; _stPelSearch=''; stPelLoad(); }
function stPelBack(){ if(!_stPelStack.length) return; var p=_stPelStack.pop(); _stPelLevel=p.prevLevel; stPelLoad(); }
function stPelCrumbGo(d){ if(d<0){_stPelStack=[];_stPelLevel='area';}else{_stPelStack=_stPelStack.slice(0,d+1);var s=_stPelStack[_stPelStack.length-1];_stPelLevel=s?s.prevLevel:'area';_stPelStack.pop();} _stPelPage=1; stPelLoad(); }
function stPelSearch(q){ _stPelSearch=q; _stPelPage=1; stPelLoad(); }
function stPelPage(dir){ var pages=Math.ceil(_stPelTotal/10); _stPelPage=Math.min(pages,Math.max(1,_stPelPage+dir)); stPelLoad(); }

/* ═══════════════════════════════════════
   JARINGAN — server-side drill
═══════════════════════════════════════ */
var _stNetLevel='area', _stNetStack=[];
var _stNetLvlLbl={area:'Area Coverage',kecamatan:'Kecamatan',kelurahan:'Kelurahan',rw:'RW',rt:'RT',odp:'ODP'};

function stNetLoad(){
  var list=document.getElementById('st-net-list'), cnt=document.getElementById('st-net-count');
  _stDrillUpdate('st-net-back-bar','st-net-back-label','st-net-filter-bar','st-net-sec-title',_stNetStack,_stNetLvlLbl,'stNetCrumbGo');
  if(list) list.innerHTML='<div class="st-shimmer"></div><div class="st-shimmer"></div>';
  if(cnt) cnt.textContent='—';
  var sb=getSB2(); if(!sb){ if(list) list.innerHTML='<div class="st-empty"><div class="st-empty-ico">⚠️</div><div class="st-empty-txt">DB tidak terhubung</div></div>'; return; }
  var ctx={}; _stNetStack.forEach(function(s){ctx[s.fieldName]=s.id;});

  if(_stNetLevel==='area'){
    var q=sb.from('areas').select('id,nama,kode').order('nama');
    if(_stScope.area_id) q=q.eq('id',_stScope.area_id);
    q.then(function(r){
      var data=(r&&!r.error)?(r.data||[]):[];
      if(cnt) cnt.textContent=data.length;
      list.innerHTML=data.length?data.map(function(a,i){
        return '<div class="st-drill-card" onclick="stNetDrill(\'area_id\',\''+_stEsc(a.id)+'\',\''+_stEsc(a.nama)+'\',\'kecamatan\')">'  
          +'<div class="st-drill-av" style="background:'+_stC(i)+';font-size:11px;font-weight:900">'+_stEsc((a.kode||a.nama||'?').replace(/\s+/g,'').slice(0,3).toUpperCase())+'</div>'
          +'<div class="st-drill-info"><div class="st-drill-name">'+_stEsc(a.nama)+'</div><div class="st-drill-sub">'+_stEsc(a.kode||'—')+'</div></div>'
          +'<span class="st-drill-chev">›</span></div>';
      }).join(''):'<div class="st-empty"><div class="st-empty-ico">🗺️</div><div class="st-empty-txt">Tidak ada area</div></div>';
    });
    return;
  }
  if(_stNetLevel==='odp'){
    var q2=sb.from('odps').select('id,nama,kode,jumlah_port').eq('status','aktif');
    if(ctx.area_id) q2=q2.eq('area_id',ctx.area_id); else if(_stScope.area_id) q2=q2.eq('area_id',_stScope.area_id);
    q2.order('kode').then(function(r){
      var data=(r&&!r.error)?(r.data||[]):[];
      if(cnt) cnt.textContent=data.length;
      list.innerHTML=data.length?data.map(function(o,i){
        return '<div class="st-drill-card" data-fn="odp" data-id="'+_stEsc(o.id)+'" data-name="'+_stEsc(o.kode||o.nama)+'" onclick="_stDrillClick(this)">'
          +'<div class="st-drill-av" style="background:'+_stC(i)+'"><i class="ti ti-antenna" style="font-size:15px;color:#fff"></i></div>'
          +'<div class="st-drill-info"><div class="st-drill-name">'+_stEsc(o.kode||o.nama)+'</div><div class="st-drill-sub">'+(o.jumlah_port||0)+' port</div></div>'
          +'<span class="st-drill-badge" style="background:#dbeafe;color:#2563eb">'+(o.jumlah_port||0)+' port</span>'
          +'<span class="st-drill-chev">›</span></div>';
      }).join(''):'<div class="st-empty"><div class="st-empty-ico">📡</div><div class="st-empty-txt">Belum ada ODP</div></div>';
    });
    return;
  }
  // kecamatan/kelurahan/rw/rt — query only group field from pelanggan
  var fieldMap={kecamatan:'kecamatan',kelurahan:'kelurahan',rw:'rw',rt:'rt'};
  var groupField=fieldMap[_stNetLevel];
  var nextLvl={kecamatan:'kelurahan',kelurahan:'rw',rw:'rt',rt:'odp'}[_stNetLevel]||'odp';
  var prefix={kecamatan:'Kec. ',kelurahan:'Kel. ',rw:'RW ',rt:'RT '}[_stNetLevel]||'';
  var q3=sb.from('pelanggan').select(groupField+',status');
  if(ctx.area_id)   q3=q3.eq('area_id',ctx.area_id);   else if(_stScope.area_id) q3=q3.eq('area_id',_stScope.area_id);
  if(ctx.kecamatan) q3=q3.eq('kecamatan',ctx.kecamatan);
  if(ctx.kelurahan) q3=q3.eq('kelurahan',ctx.kelurahan);
  if(ctx.rw)        q3=q3.eq('rw',ctx.rw);
  q3.then(function(r){
    var data=(r&&!r.error)?(r.data||[]):[];
    var groups={}; data.forEach(function(p){var v=p[groupField]; if(!v) return; if(!groups[v]) groups[v]={aktif:0,total:0}; groups[v].total++; if(p.status==='aktif') groups[v].aktif++;});
    var keys=Object.keys(groups).sort();
    if(cnt) cnt.textContent=keys.length;
    list.innerHTML=keys.length?keys.map(function(k,i){
      var d=groups[k];
      return '<div class="st-drill-card" data-fn="net" data-f="'+_stEsc(groupField)+'" data-id="'+_stEsc(k)+'" data-name="'+_stEsc(prefix+k)+'" data-nl="'+_stEsc(nextLvl)+'" onclick="_stDrillClick(this)">'
        +'<div class="st-drill-av" style="background:'+_stC(i)+';font-size:11px;font-weight:900">'+_stEsc(k.slice(-3))+'</div>'
        +'<div class="st-drill-info"><div class="st-drill-name">'+_stEsc(prefix+k)+'</div><div class="st-drill-sub">'+d.aktif+' aktif · '+d.total+' total</div></div>'
        +'<span class="st-drill-badge" style="background:#dcfce7;color:#16a34a">'+d.aktif+'</span>'
        +'<span class="st-drill-chev">›</span></div>';
    }).join(''):'<div class="st-empty"><div class="st-empty-ico">📭</div><div class="st-empty-txt">Tidak ada data</div></div>';
  });
}
function stNetDrill(fn,id,name,nl){ _stNetStack.push({fieldName:fn,id:id,name:name,prevLevel:_stNetLevel}); _stNetLevel=nl; stNetLoad(); }
function stNetBack(){ if(!_stNetStack.length) return; var p=_stNetStack.pop(); _stNetLevel=p.prevLevel; stNetLoad(); }
function stNetCrumbGo(d){ if(d<0){_stNetStack=[];_stNetLevel='area';}else{_stNetStack=_stNetStack.slice(0,d+1);var s=_stNetStack[_stNetStack.length-1];_stNetLevel=s?s.prevLevel:'area';_stNetStack.pop();} stNetLoad(); }

function stNetOpenOdp(odpId,odpName){
  var sheet=document.getElementById('st-odp-overlay'), title=document.getElementById('st-odp-title'), body=document.getElementById('st-odp-body');
  if(!sheet||!body) return;
  if(title) title.textContent=odpName;
  body.innerHTML='<div class="st-shimmer"></div><div class="st-shimmer"></div>';
  sheet.classList.add('on');
  var sb=getSB2(); if(!sb){ body.innerHTML='<div class="st-empty"><div class="st-empty-ico">⚠️</div><div class="st-empty-txt">DB tidak terhubung</div></div>'; return; }
  Promise.all([
    sb.from('odps').select('id,jumlah_port,kode,nama').eq('id',odpId).single(),
    sb.from('pelanggan').select('id,nama,cid,status,paket,nomor_port').eq('odp_id',odpId).order('nomor_port')
  ]).then(function(res){
    var odp=(res[0]&&!res[0].error)?res[0].data:{jumlah_port:8};
    var pList=(res[1]&&!res[1].error)?(res[1].data||[]):[];
    var totalPort=odp.jumlah_port||8, terpakai=pList.length, kosong=totalPort-terpakai;
    var pct=totalPort>0?Math.round(terpakai*100/totalPort):0;
    var barC=pct>=85?'#f59e0b':pct>=60?'#3b82f6':'#22c55e';
    var usedPorts={}; pList.forEach(function(p){ if(p.nomor_port) usedPorts[p.nomor_port]=p; });
    var stat='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;background:#f8fafc;border-radius:10px;padding:10px;margin-bottom:12px;text-align:center">'
      +'<div><div style="font-size:18px;font-weight:900;font-family:monospace;color:#2563eb">'+terpakai+'</div><div style="font-size:8px;color:#94a3b8;font-weight:700;text-transform:uppercase">Terpakai</div></div>'
      +'<div><div style="font-size:18px;font-weight:900;font-family:monospace;color:#16a34a">'+kosong+'</div><div style="font-size:8px;color:#94a3b8;font-weight:700;text-transform:uppercase">Kosong</div></div>'
      +'<div><div style="font-size:18px;font-weight:900;font-family:monospace;color:'+barC+'">'+pct+'%</div><div style="font-size:8px;color:#94a3b8;font-weight:700;text-transform:uppercase">Utilisasi</div></div></div>';
    var utilBar='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;color:#475569;margin-bottom:4px"><span>Utilisasi Port</span><span style="color:'+barC+'">'+pct+'%</span></div><div style="background:#f1f5f9;border-radius:6px;height:7px;overflow:hidden"><div style="height:7px;border-radius:6px;width:'+Math.min(pct,100)+'%;background:'+barC+'"></div></div></div>';
    var grid='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px">';
    for(var pn=1;pn<=totalPort;pn++){
      var p=usedPorts[pn];
      var bg=p?'rgba(37,99,235,.07)':'rgba(22,163,74,.07)', bd=p?'rgba(37,99,235,.25)':'rgba(22,163,74,.25)', tc=p?'#2563eb':'#16a34a';
      grid+='<div style="border-radius:9px;padding:8px 4px;text-align:center;border:1.5px solid '+bd+';background:'+bg+'"><div style="font-size:15px;font-weight:800;font-family:monospace;color:'+tc+'">'+pn+'</div><div style="font-size:8px;font-weight:600;margin-top:2px;color:'+tc+';opacity:.75">'+(p?_stI(p.nama):'✓')+'</div></div>';
    }
    grid+='</div>';
    var pelHtml=pList.length?'<div style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Pelanggan Terpasang</div>'
      +pList.map(function(p,i){
        var sc=p.status==='aktif'?'ps-aktif':p.status==='suspend'?'ps-suspend':'ps-cabut';
        return '<div style="display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid #f8fafc">'
          +'<div style="width:30px;height:30px;border-radius:8px;background:'+_stC(i)+';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;font-family:monospace">'+_stI(p.nama)+'</div>'
          +'<div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_stEsc(p.nama)+'</div><div style="font-size:9px;color:#94a3b8">'+_stEsc(p.cid||'—')+' · '+_stEsc(p.paket||'—')+'</div></div>'
          +'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0"><span style="font-size:10px;font-weight:800;color:#2563eb;background:rgba(37,99,235,.09);padding:2px 7px;border-radius:6px">Port '+(p.nomor_port||'—')+'</span><span class="st-pel-status '+sc+'" style="font-size:8px">'+_stEsc(p.status||'—')+'</span></div></div>';
      }).join('')
      :'<div class="st-empty"><div class="st-empty-ico">📭</div><div class="st-empty-txt">Belum ada pelanggan terpasang</div></div>';
    body.innerHTML=stat+utilBar+grid+pelHtml;
  }).catch(function(){ body.innerHTML='<div class="st-empty"><div class="st-empty-ico">⚠️</div><div class="st-empty-txt">Gagal load ODP</div></div>'; });
}

/* ═══════════════════════════════════════
   FEE — server-side aggregate per area
   Status mapping sesuai Finance:
   paid → Paid | siap_bayar/waiting_payment → Siap Bayar
   menunggu_validasi/draft/null → Pending | canceled → Batal
═══════════════════════════════════════ */
var _stFeeLevel='area', _stFeeStack=[], _stFeeTab='paid';
var _stFeeStore=[], _stFeeTotalByIdx={};
var _stFeeLvlLbl={area:'Area Coverage',kecamatan:'Kecamatan',kelurahan:'Kelurahan',rw:'RW',rt:'RT',list:'Riwayat Fee'};

function _stFeeStatus(s){
  if(s==='paid') return 'paid';
  if(s==='siap_bayar'||s==='waiting_payment') return 'sbayar';
  if(s==='canceled'||s==='cancelled'||s==='rejected') return 'rej';
  return 'pending';
}

function stFeeLoad(){
  var sb=getSB2(); if(!sb) return;
  _stDrillUpdate('st-fee-back-bar','st-fee-back-label','st-fee-filter-bar','st-fee-sec-title',_stFeeStack,_stFeeLvlLbl,'stFeeCrumbGo');
  var areaWrap=document.getElementById('st-fee-area-wrap'), detWrap=document.getElementById('st-fee-detail-wrap');
  if(_stFeeLevel==='list'){ if(areaWrap) areaWrap.style.display='none'; if(detWrap) detWrap.style.display='block'; }
  else { if(areaWrap) areaWrap.style.display='block'; if(detWrap) detWrap.style.display='none'; }

  var areaList=document.getElementById('st-fee-area-list'), cnt=document.getElementById('st-fee-count');
  if(areaList) areaList.innerHTML='<div class="st-shimmer"></div><div class="st-shimmer"></div>';
  if(cnt) cnt.textContent='—';

  var ctx={}; _stFeeStack.forEach(function(s){ctx[s.fieldName]=s.id;});

  if(_stFeeLevel==='area'){
    // List areas, get fee count per area using a single query
    sb.from('areas').select('id,nama,kode').order('nama').then(function(ra){
      var areas=(ra&&!ra.error)?(ra.data||[]):[];
      if(!areas.length){ if(areaList) areaList.innerHTML='<div class="st-empty"><div class="st-empty-ico">💸</div><div class="st-empty-txt">Tidak ada area</div></div>'; return; }
      // One query: fee_otf with join to get area grouping
      // Use count per area from pelanggan join — aggregate in JS from small query
      sb.from('fee_otf').select('status,nominal,pelanggan!inner(area_id)').then(function(rf){
        var fdata=(rf&&!rf.error)?(rf.data||[]):[];
        var byArea={};
        fdata.forEach(function(f){
          var aid=f.pelanggan?f.pelanggan.area_id:null; if(!aid) return;
          if(!byArea[aid]) byArea[aid]={paid:0,sbayar:0,pending:0,rej:0,nomPaid:0,nomPending:0};
          var bucket=_stFeeStatus(f.status);
          byArea[aid][bucket]++;
          var nom=Number(f.nominal)||0;
          if(bucket==='paid') byArea[aid].nomPaid+=nom;
          if(bucket==='pending'||bucket==='sbayar') byArea[aid].nomPending+=nom;
        });
        if(cnt) cnt.textContent=areas.length+' area';
        if(areaList) areaList.innerHTML=areas.map(function(a,i){
          var d=byArea[a.id]||{paid:0,sbayar:0,pending:0,rej:0,nomPaid:0,nomPending:0};
          var _rp=function(n){if(!n)return'Rp 0';if(n>=1000000)return'Rp '+(n/1000000).toFixed(1).replace('.0','')+'jt';if(n>=1000)return'Rp '+(Math.round(n/1000))+'rb';return'Rp '+n;};
          var total=d.nomPaid+d.nomPending;
          var sub='';
          if(total>0) sub+='<div style="font-size:11px;font-weight:800;color:#0f172a;margin-bottom:3px">'+_rp(total)+'</div>';
          var badges='';
          if(d.paid)    badges+='<span style="background:rgba(22,163,74,.1);color:#16a34a;padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700;margin-right:4px">✓ Paid '+d.paid+'</span>';
          if(d.sbayar)  badges+='<span style="background:rgba(37,99,235,.1);color:#2563eb;padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700;margin-right:4px">💳 '+d.sbayar+'</span>';
          if(d.pending) badges+='<span style="background:rgba(217,119,6,.1);color:#d97706;padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700;margin-right:4px">⏳ '+d.pending+'</span>';
          if(d.rej)     badges+='<span style="background:rgba(220,38,38,.08);color:#dc2626;padding:2px 6px;border-radius:6px;font-size:9px;font-weight:700">✗ '+d.rej+'</span>';
          if(!badges) badges='<span style="color:#94a3b8;font-size:9px">Belum ada fee</span>';
          sub+=badges;
          if(!total&&!d.paid&&!d.pending&&!d.sbayar&&!d.rej) sub='<span style="color:#94a3b8">Belum ada fee</span>';
          return '<div class="st-drill-card" onclick="stFeeDrill(\'area_id\',\''+_stEsc(a.id)+'\',\''+_stEsc(a.nama)+'\',\'kecamatan\')">'  
            +'<div class="st-drill-av" style="background:'+_stC(i)+';font-size:11px;font-weight:900">'+_stEsc((a.kode||a.nama||'?').replace(/\s+/g,'').slice(0,3).toUpperCase())+'</div>'
            +'<div class="st-drill-info"><div class="st-drill-name">'+_stEsc(a.nama)+'</div><div class="st-drill-sub">'+sub+'</div></div>'
            +'<span class="st-drill-chev">›</span></div>';
        }).join('');
      });
    });
    return;
  }

  if(_stFeeLevel==='list'){
    // Load actual fee items — filtered, paginated
    stFeeLoadList(sb, ctx);
    return;
  }

  // Drill through kecamatan/kelurahan/rw/rt using pelanggan table
  var fieldMap={kecamatan:'kecamatan',kelurahan:'kelurahan',rw:'rw',rt:'rt'};
  var groupField=fieldMap[_stFeeLevel];
  var nextLvl={kecamatan:'kelurahan',kelurahan:'rw',rw:'rt',rt:'list'}[_stFeeLevel]||'list';
  var prefix={kecamatan:'Kec. ',kelurahan:'Kel. ',rw:'RW ',rt:'RT '}[_stFeeLevel]||'';
  // Get distinct values + fee counts
  var q=sb.from('fee_otf').select('status,nominal,pelanggan!inner('+groupField+',area_id,kecamatan,kelurahan,rw,rt)');
  if(ctx.area_id)   q=q.eq('pelanggan.area_id',ctx.area_id);
  if(ctx.kecamatan) q=q.eq('pelanggan.kecamatan',ctx.kecamatan);
  if(ctx.kelurahan) q=q.eq('pelanggan.kelurahan',ctx.kelurahan);
  if(ctx.rw)        q=q.eq('pelanggan.rw',ctx.rw);
  q.then(function(r){
    var data=(r&&!r.error)?(r.data||[]):[];
    var groups={};
    data.forEach(function(f){
      var v=f.pelanggan?f.pelanggan[groupField]:null; if(!v) return;
      if(!groups[v]) groups[v]={paid:0,sbayar:0,pending:0,rej:0,nomPaid:0,nomPending:0};
      var bucket=_stFeeStatus(f.status);
      groups[v][bucket]++;
      var nom=Number(f.nominal)||0;
      if(bucket==='paid') groups[v].nomPaid+=nom;
      if(bucket==='pending'||bucket==='sbayar') groups[v].nomPending+=nom;
    });
    var keys=Object.keys(groups).sort();
    if(cnt) cnt.textContent=keys.length;
    if(areaList) areaList.innerHTML=keys.length?keys.map(function(k,i){
      var d=groups[k];
      var _rp2=function(n){if(!n)return'Rp 0';if(n>=1000000)return'Rp '+(n/1000000).toFixed(1).replace('.0','')+'jt';if(n>=1000)return'Rp '+(Math.round(n/1000))+'rb';return'Rp '+n;};
      var tot2=d.nomPaid+d.nomPending;
      var sub='';
      if(tot2>0) sub+='<span style="font-size:11px;font-weight:800;color:#0f172a;margin-right:8px">'+_rp2(tot2)+'</span>';
      if(d.paid)    sub+='<span style="color:#16a34a;margin-right:5px">✓'+d.paid+'</span>';
      if(d.sbayar)  sub+='<span style="color:#2563eb;margin-right:5px">💳'+d.sbayar+'</span>';
      if(d.pending) sub+='<span style="color:#d97706;margin-right:5px">⏳'+d.pending+'</span>';
      if(d.rej)     sub+='<span style="color:#dc2626">✗'+d.rej+'</span>';
      var ctxCopy=Object.assign({},ctx); ctxCopy[groupField]=k;
      return '<div class="st-drill-card" data-fn="fee" data-f="'+_stEsc(groupField)+'" data-id="'+_stEsc(k)+'" data-name="'+_stEsc(prefix+k)+'" data-nl="'+_stEsc(nextLvl)+'" onclick="_stDrillClick(this)">'
        +'<div class="st-drill-av" style="background:'+_stC(i)+';font-size:11px;font-weight:900">'+_stEsc(k.slice(-3))+'</div>'
        +'<div class="st-drill-info"><div class="st-drill-name">'+_stEsc(prefix+k)+'</div><div class="st-drill-sub">'+sub+'</div></div>'
        +'<span class="st-drill-chev">›</span></div>';
    }).join(''):'<div class="st-empty"><div class="st-empty-ico">📭</div><div class="st-empty-txt">Tidak ada data</div></div>';
  });
}

function stFeeLoadList(sb, ctx){
  var el; _stLoading('st-fee-list-paid'); _stLoading('st-fee-list-sbayar'); _stLoading('st-fee-list-pending'); _stLoading('st-fee-list-rej');
  el=document.getElementById('st-fee-otf-total'); if(el) el.textContent='—';
  el=document.getElementById('st-fee-rec-total'); if(el) el.textContent='—';
  _stFeeStore=[];

  // Join fee_otf with pelanggan inline — filter at server
  var baseOtf=sb.from('fee_otf').select('id,nominal,status,created_at,keterangan,pel_id,pelanggan!inner(cid,nama,area_id,kecamatan,kelurahan,rw,rt)').order('created_at',{ascending:false}).limit(200);
  var baseRec=sb.from('fee_recurring').select('id,nominal,status,periode,catatan,pel_id,pelanggan!inner(cid,nama,area_id,kecamatan,kelurahan,rw,rt)').order('periode',{ascending:false}).limit(200);

  function applyCtx(q){
    if(ctx.area_id)   q=q.eq('pelanggan.area_id',ctx.area_id);
    if(ctx.kecamatan) q=q.eq('pelanggan.kecamatan',ctx.kecamatan);
    if(ctx.kelurahan) q=q.eq('pelanggan.kelurahan',ctx.kelurahan);
    if(ctx.rw)        q=q.eq('pelanggan.rw',ctx.rw);
    if(ctx.rt)        q=q.eq('pelanggan.rt',ctx.rt);
    return q;
  }

  Promise.all([applyCtx(baseOtf), applyCtx(baseRec)]).then(function(res){
    var otf=(res[0]&&!res[0].error)?(res[0].data||[]):[];
    var rec=(res[1]&&!res[1].error)?(res[1].data||[]):[];
    var items=[];
    otf.forEach(function(f){ if(f.pelanggan) items.push({type:'otf',data:f,pel:f.pelanggan}); });
    rec.forEach(function(f){ if(f.pelanggan) items.push({type:'rec',data:f,pel:f.pelanggan}); });
    _stFeeStore=items;

    var otfPaid=otf.filter(function(f){return f.status==='paid';});
    var recPaid=rec.filter(function(f){return f.status==='paid';});
    el=document.getElementById('st-fee-otf-total'); if(el) el.textContent=_stFmt(otfPaid.reduce(function(s,f){return s+(f.nominal||0);},0));
    el=document.getElementById('st-fee-rec-total'); if(el) el.textContent=_stFmt(recPaid.reduce(function(s,f){return s+(f.nominal||0);},0));

    var buckets={paid:[],sbayar:[],pending:[],rej:[]};
    items.forEach(function(item,idx){ buckets[_stFeeStatus(item.data.status)].push(idx); });
    el=document.getElementById('st-fee-cnt-paid');    if(el) el.textContent=buckets.paid.length;
    el=document.getElementById('st-fee-cnt-sbayar');  if(el) el.textContent=buckets.sbayar.length;
    el=document.getElementById('st-fee-cnt-pending'); if(el) el.textContent=buckets.pending.length;
    el=document.getElementById('st-fee-cnt-rej');     if(el) el.textContent=buckets.rej.length;
    stFeeRenderList('st-fee-list-paid',    buckets.paid);
    stFeeRenderList('st-fee-list-sbayar',  buckets.sbayar);
    stFeeRenderList('st-fee-list-pending', buckets.pending);
    stFeeRenderList('st-fee-list-rej',     buckets.rej);
  }).catch(function(e){ console.error('stFeeLoadList',e); });
}

function stFeeDrill(fn,id,name,nl){ _stFeeStack.push({fieldName:fn,id:id,name:name,prevLevel:_stFeeLevel}); _stFeeLevel=nl; stFeeLoad(); }
function stFeeBack(){ if(!_stFeeStack.length) return; var p=_stFeeStack.pop(); _stFeeLevel=p.prevLevel; stFeeLoad(); }
function stFeeCrumbGo(d){ if(d<0){_stFeeStack=[];_stFeeLevel='area';}else{_stFeeStack=_stFeeStack.slice(0,d+1);var s=_stFeeStack[_stFeeStack.length-1];_stFeeLevel=s?s.prevLevel:'area';_stFeeStack.pop();} stFeeLoad(); }

function stSwitchFeeTab(tab,btn){
  _stFeeTab=tab;
  document.querySelectorAll('#p-sales-dash .st-fee-tab').forEach(function(b){b.classList.remove('on');});
  document.querySelectorAll('#p-sales-dash .st-ftpane').forEach(function(p){p.classList.remove('on');});
  if(btn) btn.classList.add('on');
  var pane=document.getElementById('st-ftab-'+tab); if(pane) pane.classList.add('on');
}

function stFeeRenderList(elId,indices){
  var el=document.getElementById(elId); if(!el) return;
  if(!indices||!indices.length){ el.innerHTML='<div class="st-empty"><div class="st-empty-ico">💸</div><div class="st-empty-txt">Tidak ada data</div></div>'; return; }
  el.innerHTML=indices.slice(0,50).map(function(idx){
    var item=_stFeeStore[idx]; if(!item) return '';
    var f=item.data, isRec=item.type==='rec', s=f.status||'', p=item.pel||{};
    var bucket=_stFeeStatus(s);
    var ico={paid:'💰',sbayar:'💳',pending:'⏳',rej:'❌'}[bucket]||'💰';
    var icoCls={paid:'otf',sbayar:'wait',pending:'wait',rej:'rej'}[bucket];
    var amtCls={paid:'',sbayar:'pending',pending:'pending',rej:'rejected'}[bucket];
    var stLbl={paid:'Paid',sbayar:'Siap Bayar',pending:'Pending',rej:'Batal'}[bucket]||s;
    var badge=isRec?'<span class="st-type-badge stb-rec">REC</span>':'<span class="st-type-badge stb-otf">OTF</span>';
    var meta=isRec?(f.periode||'—'):(f.created_at?f.created_at.slice(0,10):'—');
    return '<div class="st-fee-item" onclick="stOpenFeeSheetIdx('+idx+')">'
      +'<div class="st-fee-ico '+icoCls+'">'+ico+'</div>'
      +'<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">'+badge
      +'<span class="st-fee-name">'+_stEsc(p.nama||'—')+'</span></div>'
      +'<div class="st-fee-meta">'+_stEsc(p.cid||'—')+' · '+_stEsc(meta)+'</div></div>'
      +'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">'
      +'<div class="st-fee-amount '+amtCls+'">'+_stFmt(f.nominal)+'</div>'
      +'<div style="font-size:8px;font-weight:700;color:#94a3b8">'+_stEsc(stLbl)+'</div>'
      +'</div></div>';
  }).join('');
}

function stOpenFeeSheetIdx(idx){
  var item=_stFeeStore[idx]; if(!item) return;
  var f=item.data, isRec=item.type==='rec', s=f.status||'', p=item.pel||{};
  var bucket=_stFeeStatus(s);
  var ico={paid:'✅',sbayar:'💳',pending:'⏳',rej:'❌'}[bucket];
  var icoBg={paid:'rgba(22,163,74,.1)',sbayar:'rgba(37,99,235,.1)',pending:'rgba(217,119,6,.1)',rej:'rgba(220,38,38,.1)'}[bucket];
  var nomColor={paid:'#16a34a',sbayar:'#2563eb',pending:'#d97706',rej:'#dc2626'}[bucket];
  var chipTxt={paid:'✓ Paid',sbayar:'💳 Siap Bayar',pending:'⏳ Menunggu Validasi',rej:'✗ Dibatalkan'}[bucket];
  var chipCls={paid:'paid',sbayar:'wait',pending:'wait',rej:'rej'}[bucket];
  var el;
  el=document.getElementById('st-fee-sheet-ico'); if(el){el.textContent=ico;el.style.background=icoBg;}
  el=document.getElementById('st-fee-sheet-title'); if(el) el.textContent=(isRec?'Recurring · ':'OTF · ')+_stEsc(p.nama||'—');
  var html='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
    +'<div style="font-size:20px;font-weight:900;font-family:monospace;color:'+nomColor+'">'+_stFmt(f.nominal)+'</div>'
    +'<span class="st-chip '+chipCls+'">'+chipTxt+'</span></div>'
    +'<div style="background:#f8fafc;border-radius:10px;padding:2px 12px;margin-bottom:10px">';
  function dr(l,v){ return '<div class="st-det-row"><span class="st-det-lbl">'+l+'</span><span class="st-det-val">'+v+'</span></div>'; }
  html+=dr('Pelanggan',_stEsc(p.nama||'—'));
  html+=dr('CID','<span style="font-family:monospace">'+_stEsc(p.cid||'—')+'</span>');
  if(p.kelurahan) html+=dr('Wilayah','Kel.'+_stEsc(p.kelurahan)+(p.rw?' RW'+_stEsc(p.rw):'')+(p.rt?' RT'+_stEsc(p.rt):''));
  html+=dr('Jenis',isRec?'Recurring':'OTF Pemasangan');
  html+=dr('Nominal',_stFmt(f.nominal));
  html+=isRec?dr('Periode',_stEsc(f.periode||'—')):dr('Tanggal',f.created_at?f.created_at.slice(0,10):'—');
  html+=dr('Status',_stEsc(s||'—'));
  html+='</div>';
  if(bucket==='rej') html+='<div class="st-rej-box"><div class="st-rej-title">✗ Keterangan</div><div class="st-rej-text">'+_stEsc(f.keterangan||f.catatan||'Tidak ada keterangan.')+'</div></div>';
  el=document.getElementById('st-fee-body'); if(el) el.innerHTML=html;
  el=document.getElementById('st-fee-overlay'); if(el) el.classList.add('on');
}
/* ── end Sales Territory JS ── */


/* ════════════════════════════════════════ */

var _gpsTargetLat   = null;
var _gpsTargetLng   = null;
var _gpsMapLat      = null;
var _gpsMapLng      = null;
var _gpsSearchTimer = null;
var _gpsWatchId     = null;
var _gpsTracking    = false;
var _Nominatim      = 'https://nominatim.openstreetmap.org';

function gpsGetLocation(latId, lngId, btn){
  if(!navigator.geolocation){ toast('GPS tidak tersedia','err'); return; }
  var prefix = latId.replace(/-lat$/,'');
  var statusEl = document.getElementById(prefix+'-gps-status');
  function setStatus(msg, color){
    if(statusEl){ statusEl.style.display='block'; statusEl.style.color=color; statusEl.innerHTML=msg; }
  }
  setStatus('<i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Mendeteksi GPS…','var(--c1)');
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:13px"></i>'; }
  navigator.geolocation.getCurrentPosition(
    function(pos){
      var lat=pos.coords.latitude.toFixed(7), lng=pos.coords.longitude.toFixed(7);
      var acc=Math.round(pos.coords.accuracy);
      var latEl=document.getElementById(latId), lngEl=document.getElementById(lngId);
      if(latEl) latEl.value=lat; if(lngEl) lngEl.value=lng;
      setStatus('✅ '+lat+', '+lng+' <span style="color:var(--text3)">(±'+acc+'m)</span>','var(--green)');
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-current-location" style="font-size:13px"></i> GPS Auto'; }
      toast('GPS berhasil (±'+acc+'m)','ok');
    },
    function(err){
      var msg=err.code===1?'Izin GPS ditolak — aktifkan di pengaturan':err.code===2?'Sinyal GPS tidak tersedia':'GPS timeout';
      setStatus('⚠ '+msg,'var(--red)');
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-current-location" style="font-size:13px"></i> GPS Auto'; }
      toast(msg,'err');
    },
    {enableHighAccuracy:true,timeout:14000,maximumAge:0}
  );
}

function gpsOpenMap(latId, lngId){
  _gpsTargetLat=latId; _gpsTargetLng=lngId;
  _gpsMapLat=null; _gpsMapLng=null;
  var existLat=parseFloat((document.getElementById(latId)||{}).value)||null;
  var existLng=parseFloat((document.getElementById(lngId)||{}).value)||null;
  var clat=existLat||-6.2088, clng=existLng||106.8456;


  document.getElementById('gps-map-overlay').style.display='block';
  document.getElementById('gps-search-inp').value='';
  document.getElementById('gps-search-results').style.display='none';
  document.getElementById('gps-coord-lat').value=existLat||'';
  document.getElementById('gps-coord-lng').value=existLng||'';
  var disp=document.getElementById('gps-coord-display');
  if(disp) disp.textContent=existLat?(existLat+', '+existLng):'Tap peta untuk pin lokasi';
  var badge=document.getElementById('gps-coord-badge'); if(badge) badge.style.display=existLat?'block':'none';
  var cbtn=document.getElementById('gps-confirm-btn'); if(cbtn){ cbtn.disabled=!existLat; cbtn.style.opacity=existLat?'1':'0.5'; }
  document.getElementById('gps-map-hint').textContent='Tap peta untuk pin · GPS ikon untuk posisi saat ini';
  if(existLat){ _gpsMapLat=existLat; _gpsMapLng=existLng; }


  var sc='<'+'script', ec='</'+'script>';
  var tile='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var initMarker=existLat?'setMarker('+existLat+','+existLng+',false);':'';

  var mapCode=[
    'var map=L.map("map",{zoomControl:true,attributionControl:true}).setView(['+clat+','+clng+'],16);',
    'L.tileLayer("'+tile+'",{attribution:"&copy; OpenStreetMap",maxZoom:20,tileSize:256}).addTo(map);',


    'var pinIcon=L.divIcon({html:\'<div style="width:28px;height:36px;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 32" width="28" height="36"><path d="M12 0C7.6 0 4 3.6 4 8c0 6 8 18 8 18s8-12 8-18c0-4.4-3.6-8-8-8z" fill="#dc2626"/><circle cx="12" cy="8" r="3" fill="white"/></svg></div>\',iconSize:[28,36],iconAnchor:[14,36],popupAnchor:[0,-36],className:""});',
    'var gpsIcon=L.divIcon({html:\'<div style="width:20px;height:20px;border-radius:50%;background:rgba(26,86,219,.25);border:3px solid #1a56db;display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:50%;background:#1a56db"></div></div>\',iconSize:[20,20],iconAnchor:[10,10],className:""});',

    'var pinMarker=null, gpsMarker=null, gpsCircle=null;',
    'var isTracking=false, watchId=null;',

    'function setMarker(lat,lng,pan){',
    '  if(pinMarker)map.removeLayer(pinMarker);',
    '  pinMarker=L.marker([lat,lng],{icon:pinIcon,draggable:true}).addTo(map);',
    '  pinMarker.on("dragend",function(){var p=pinMarker.getLatLng();window.parent.gpsMapPicked(p.lat,p.lng);});',
    '  if(pan)map.panTo([lat,lng]);',
    '  window.parent.gpsMapPicked(lat,lng);',
    '}',

    'map.on("click",function(e){setMarker(e.latlng.lat,e.latlng.lng,false);});',


    'function startTracking(){',
    '  if(!navigator.geolocation)return;',
    '  isTracking=true;',
    '  window.parent.gpsSetTrackBtn(true);',
    '  watchId=navigator.geolocation.watchPosition(',
    '    function(pos){',
    '      var la=pos.coords.latitude,ln=pos.coords.longitude,ac=pos.coords.accuracy;',
    '      if(gpsMarker)map.removeLayer(gpsMarker);',
    '      if(gpsCircle)map.removeLayer(gpsCircle);',
    '      gpsCircle=L.circle([la,ln],{radius:ac,color:"#1a56db",fillColor:"#1a56db",fillOpacity:.08,weight:1.5}).addTo(map);',
    '      gpsMarker=L.marker([la,ln],{icon:gpsIcon}).addTo(map);',
    '      map.setView([la,ln],17,{animate:true});',
    '      window.parent.gpsLiveUpdate(la,ln,ac);',
    '    },',
    '    function(){isTracking=false;window.parent.gpsSetTrackBtn(false);},',
    '    {enableHighAccuracy:true,timeout:10000,maximumAge:500}',
    '  );',
    '}',
    'function stopTracking(){',
    '  if(watchId!==null)navigator.geolocation.clearWatch(watchId);',
    '  watchId=null;isTracking=false;',
    '  window.parent.gpsSetTrackBtn(false);',
    '}',
    'window.toggleTracking=function(){isTracking?stopTracking():startTracking();};',
    'window.goTo=function(la,ln,zm){map.setView([la,ln],zm||17);setMarker(la,ln,false);};',
    initMarker
  ].join('\n');

  var html=[
    '<!DOCTYPE html><html><head>',
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">',
    sc+' src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">'+ec,
    '<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100%}.leaflet-control-attribution{font-size:8px!important;max-width:160px}</style>',
    ec+'</head><body><div id="map"></div>'+sc+'>',
    mapCode,
    ec+'</body></html>'
  ].join('');

  var fr=document.getElementById('gps-map-frame');
  fr.srcdoc=html;
}

function gpsMapPicked(lat,lng){
  _gpsMapLat=lat; _gpsMapLng=lng;
  var disp=lat.toFixed(6)+', '+lng.toFixed(6);
  var el=document.getElementById('gps-coord-display'); if(el) el.textContent=disp;
  var badge=document.getElementById('gps-coord-badge'); if(badge) badge.style.display='block';
  document.getElementById('gps-coord-lat').value=lat.toFixed(7);
  document.getElementById('gps-coord-lng').value=lng.toFixed(7);
  var btn=document.getElementById('gps-confirm-btn'); if(btn){ btn.disabled=false; btn.style.opacity='1'; }
  document.getElementById('gps-map-hint').textContent='📍 '+disp;
}

function gpsLiveUpdate(lat,lng,acc){

  var hint=document.getElementById('gps-map-hint');
  if(hint) hint.textContent='🔵 Posisi saat ini: '+lat.toFixed(5)+', '+lng.toFixed(5)+' (±'+Math.round(acc)+'m)';
}

function gpsSetTrackBtn(active){
  var btn=document.getElementById('gps-track-btn');
  if(!btn) return;
  if(active){
    btn.style.background='#1a56db'; btn.style.color='#fff';
    btn.innerHTML='<i class="ti ti-current-location" style="font-size:20px"></i>';
    btn.title='Berhenti tracking';
  } else {
    btn.style.background='#fff'; btn.style.color='#1a56db';
    btn.innerHTML='<i class="ti ti-current-location" style="font-size:20px"></i>';
    btn.title='Mulai tracking posisi';
  }
}

function gpsToggleTracking(){
  var fr=document.getElementById('gps-map-frame');
  try{ fr.contentWindow.toggleTracking&&fr.contentWindow.toggleTracking(); }catch(e){}
}

function gpsManualCoord(){
  var lat=parseFloat(document.getElementById('gps-coord-lat').value);
  var lng=parseFloat(document.getElementById('gps-coord-lng').value);
  if(!isNaN(lat)&&!isNaN(lng)){
    _gpsMapLat=lat; _gpsMapLng=lng;
    var disp=lat.toFixed(6)+', '+lng.toFixed(6);
    var el=document.getElementById('gps-coord-display'); if(el) el.textContent=disp;
    var badge=document.getElementById('gps-coord-badge'); if(badge) badge.style.display='block';
    var btn=document.getElementById('gps-confirm-btn'); if(btn){ btn.disabled=false; btn.style.opacity='1'; }
    var fr=document.getElementById('gps-map-frame');
    try{ fr.contentWindow.goTo&&fr.contentWindow.goTo(lat,lng,17); }catch(e){}
  }
}

function gpsSearchDebounce(q){
  clearTimeout(_gpsSearchTimer);
  if(!q||q.length<3){ document.getElementById('gps-search-results').style.display='none'; return; }
  _gpsSearchTimer=setTimeout(gpsSearchNow,600);
}
function gpsSearchNow(){
  var q=(document.getElementById('gps-search-inp').value||'').trim();
  if(q.length<2) return;
  var res=document.getElementById('gps-search-results');
  res.style.display='block';
  res.innerHTML='<div style="padding:10px 14px;font-size:11px;color:var(--text3);display:flex;align-items:center;gap:6px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Mencari…</div>';
  fetch(_Nominatim+'/search?format=json&q='+encodeURIComponent(q)+'&limit=6&countrycodes=id&accept-language=id')
    .then(function(r){return r.json();})
    .then(function(data){
      if(!data||!data.length){
        res.innerHTML='<div style="padding:10px 14px;font-size:11px;color:var(--text3)">Tidak ditemukan. Coba nama jalan, kota, atau kecamatan.</div>';
        return;
      }
      res.innerHTML=data.map(function(item){
        var name=item.display_name.split(',').slice(0,3).join(', ');
        return '<div onclick="gpsSelectResult('+item.lat+','+item.lon+')" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);touch-action:manipulation;display:flex;align-items:center;gap:8px" onmouseover="this.style.background=\'var(--bg3)\'" onmouseout="this.style.background=\'\'">'+
          '<i class="ti ti-map-pin" style="font-size:13px;color:var(--c1);flex-shrink:0"></i>'+
          '<div style="min-width:0">'+
            '<div style="font-size:11px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+_esc(name)+'</div>'+
            '<div style="font-size:10px;color:var(--text3);font-family:\'JetBrains Mono\',monospace">'+parseFloat(item.lat).toFixed(6)+', '+parseFloat(item.lon).toFixed(6)+'</div>'+
          '</div>'+
        '</div>';
      }).join('');
    }).catch(function(){
      res.innerHTML='<div style="padding:10px 14px;font-size:11px;color:var(--red)">Gagal terhubung ke server pencarian.</div>';
    });
}

function gpsSelectResult(lat,lng){
  lat=parseFloat(lat); lng=parseFloat(lng);
  document.getElementById('gps-search-results').style.display='none';
  gpsMapPicked(lat,lng);
  var fr=document.getElementById('gps-map-frame');
  try{ fr.contentWindow.goTo&&fr.contentWindow.goTo(lat,lng,17); }catch(e){}
}

function gpsConfirmCoord(){
  if(_gpsMapLat===null||_gpsMapLng===null){ toast('Tap peta atau cari alamat dulu','err'); return; }
  var latEl=document.getElementById(_gpsTargetLat), lngEl=document.getElementById(_gpsTargetLng);
  if(latEl) latEl.value=parseFloat(_gpsMapLat).toFixed(7);
  if(lngEl) lngEl.value=parseFloat(_gpsMapLng).toFixed(7);
  var prefix=_gpsTargetLat.replace(/-lat$/,'');
  var statusEl=document.getElementById(prefix+'-gps-status');
  if(statusEl){ statusEl.style.display='block'; statusEl.style.color='var(--green)'; statusEl.textContent='📍 '+parseFloat(_gpsMapLat).toFixed(6)+', '+parseFloat(_gpsMapLng).toFixed(6)+' (dari peta)'; }
  gpsCloseMap();
  toast('Koordinat disimpan','ok');
}

function gpsCloseMap(){

  var fr=document.getElementById('gps-map-frame');
  try{ fr.contentWindow.stopTracking&&fr.contentWindow.stopTracking(); }catch(e){}
  document.getElementById('gps-map-overlay').style.display='none';
  if(fr) fr.srcdoc='about:blank';
  _gpsTargetLat=null; _gpsTargetLng=null; _gpsMapLat=null; _gpsMapLng=null;
  document.getElementById('gps-search-results').style.display='none';
  gpsSetTrackBtn(false);
}
var FR_TABLES = [
  { key:'dismantle_orders',  label:'Dismantle / Cabut',    ico:'ti-plug-x',        group:'Operasional'  },
  { key:'tickets',           label:'Ticketing (semua)',    ico:'ti-ticket',         group:'Operasional'  },
  { key:'fee_otf',           label:'Fee OTF',             ico:'ti-bolt',           group:'Finance'      },
  { key:'fee_recurring',     label:'Fee Recurring',       ico:'ti-refresh',        group:'Finance'      },
  { key:'invoice_isp',       label:'Invoice ISP',         ico:'ti-file-invoice',   group:'Finance'      },
  { key:'pembayaran_isp',    label:'Riwayat Pembayaran',  ico:'ti-credit-card',    group:'Finance'      },
  { key:'closing_bulanan',   label:'Closing Bulanan',     ico:'ti-calendar-check', group:'Finance'      },
  { key:'material_mutasi',   label:'Mutasi Material',     ico:'ti-transfer',       group:'Material'     },
  { key:'approval_isp',      label:'Approval ISP',        ico:'ti-checks',         group:'Pelanggan'    },
  { key:'pelanggan',         label:'Data Pelanggan',      ico:'ti-users',          group:'Pelanggan'    },
  { key:'sales_territory',   label:'Sales Territory',     ico:'ti-map-route',      group:'Sales'        },
  { key:'odp_ports',         label:'Port ODP',            ico:'ti-plug',           group:'Infrastruktur'},
  { key:'odps',              label:'Master ODP',          ico:'ti-plug',           group:'Infrastruktur'},
  { key:'odcs',              label:'Master ODC',          ico:'ti-box',            group:'Infrastruktur'},
  { key:'olts',              label:'Master OLT',          ico:'ti-antenna',        group:'Infrastruktur'},
  { key:'material_items',    label:'Master Material',     ico:'ti-package',        group:'Material'     },
  { key:'wilayah',           label:'Master Wilayah',      ico:'ti-map-pin',        group:'Master'       },
  { key:'areas',             label:'Master Area Coverage',ico:'ti-map-2',          group:'Master'       }
];
var _frStep=1, _frSelected={}, _frRunning=false;

_navDispatch.register('factoryreset', function(){
  var el=document.getElementById('fr-table-checklist'); if(!el||el.innerHTML) return;
  var groups={}, gc={Operasional:'var(--red)',Finance:'var(--green)',Pelanggan:'var(--c1)',Sales:'var(--pu)',Infrastruktur:'var(--cyan)',Material:'var(--yellow)',Master:'var(--c2)'};
  FR_TABLES.forEach(function(t){ if(!groups[t.group]) groups[t.group]=[]; groups[t.group].push(t); });
  var h='';
  Object.keys(groups).forEach(function(g){
    h+='<div style="font-size:9px;font-weight:800;color:'+(gc[g]||'var(--text3)')+';text-transform:uppercase;letter-spacing:.6px;margin:6px 0 4px">'+g+'</div>';
    groups[g].forEach(function(t){
      h+='<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs)">'+
        '<i class="ti '+t.ico+'" style="font-size:13px;color:var(--red);flex-shrink:0"></i>'+
        '<span style="font-size:11px;font-weight:600;color:var(--text);flex:1">'+_esc(t.label)+'</span>'+
        '<span style="font-size:9px;font-family:\'JetBrains Mono\',monospace;color:var(--text3)">'+_esc(t.key)+'</span></div>';
    });
  });
  h+='<div style="margin-top:8px;padding:8px 10px;background:var(--gng2);border:1px solid rgba(5,150,105,.2);border-radius:var(--rs);font-size:10px;color:var(--green);font-weight:700;display:flex;align-items:center;gap:6px">'+
     '<i class="ti ti-lock" style="font-size:13px"></i> <code>app_users</code> (akun login) tidak akan dihapus</div>';
  el.innerHTML=h;
});

function frOpenConfirm(){
  if(CR!=='super_admin'&&CR!=='owner'){ toast('Hanya SUPER_ADMIN / Owner','err'); return; }
  if(_frRunning){ toast('Reset sedang berjalan…','err'); return; }
  _frStep=1; _frSelected={};
  FR_TABLES.forEach(function(t){ _frSelected[t.key]=true; });
  var listEl=document.getElementById('fr-check-list');
  if(listEl){
    var groups={}, gc={Operasional:'var(--red)',Finance:'var(--green)',Pelanggan:'var(--c1)',Sales:'var(--pu)',Infrastruktur:'var(--cyan)',Material:'var(--yellow)',Master:'var(--c2)'};
    FR_TABLES.forEach(function(t){ if(!groups[t.group]) groups[t.group]=[]; groups[t.group].push(t); });
    var h='';
    Object.keys(groups).forEach(function(g){
      h+='<div style="font-size:9px;font-weight:800;color:'+(gc[g]||'var(--text3)')+';text-transform:uppercase;letter-spacing:.6px;margin:8px 0 4px">'+g+'</div>';
      groups[g].forEach(function(t){
        h+='<div id="frlbl-'+t.key+'" onclick="frToggleLabel(\''+t.key+'\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;'+
          'background:rgba(220,38,38,.08);border:2px solid rgba(220,38,38,.45);border-radius:var(--rs);cursor:pointer;touch-action:manipulation;transition:all .15s ease;user-select:none;-webkit-user-select:none">'+

          '<div id="frck-'+t.key+'" style="width:22px;height:22px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;'+
            'background:var(--red);border:2px solid var(--red);transition:all .15s ease">'+
            '<i class="ti ti-check" style="font-size:14px;color:#fff;font-weight:900"></i>'+
          '</div>'+
          '<i class="ti '+t.ico+'" style="font-size:14px;color:var(--red);flex-shrink:0"></i>'+
          '<span style="font-size:11px;font-weight:700;color:var(--text);flex:1">'+_esc(t.label)+'</span>'+
          '<span style="font-size:9px;font-family:\'JetBrains Mono\',monospace;color:var(--text3)">'+_esc(t.key)+'</span>'+
        '</div>';
      });
    });
    listEl.innerHTML=h;

    FR_TABLES.forEach(function(t){ frUpdateLabel(t.key, true); });
  }
  document.getElementById('fr-step-1').style.display='';
  document.getElementById('fr-step-2').style.display='none';
  document.getElementById('fr-step-3').style.display='none';
  document.getElementById('fr-confirm-title').textContent='Pilih Data yang Akan Dihapus';
  var btn=document.getElementById('fr-next-btn'); if(btn){ btn.innerHTML='<i class="ti ti-arrow-right"></i> Lanjut'; btn.disabled=false; }
  document.getElementById('fr-confirm-overlay').classList.add('on');
}
function frCloseConfirm(){ if(_frRunning) return; document.getElementById('fr-confirm-overlay').classList.remove('on'); }

function frUpdateLabel(key, checked){
  var lbl=document.getElementById('frlbl-'+key);
  var ck =document.getElementById('frck-'+key);
  if(!lbl||!ck) return;
  if(checked){
    lbl.style.background='rgba(220,38,38,.08)';
    lbl.style.borderColor='rgba(220,38,38,.45)';
    ck.style.background='var(--red)';
    ck.style.borderColor='var(--red)';
    ck.innerHTML='<i class="ti ti-check" style="font-size:14px;color:#fff;font-weight:900"></i>';
  } else {
    lbl.style.background='var(--bg2)';
    lbl.style.borderColor='var(--border2)';
    ck.style.background='var(--bg3)';
    ck.style.borderColor='rgba(0,0,0,.15)';
    ck.innerHTML='';
  }
}
function frToggleLabel(key){
  _frSelected[key]=!_frSelected[key];
  frUpdateLabel(key, _frSelected[key]);
}
function frToggleTable(key,checked){ _frSelected[key]=!!checked; frUpdateLabel(key,!!checked); }
function frCheckAll(val){
  FR_TABLES.forEach(function(t){
    _frSelected[t.key]=val;
    frUpdateLabel(t.key,val);
  });
}
function frNextStep(){
  if(_frStep===1){
    var sel=FR_TABLES.filter(function(t){ return _frSelected[t.key]; });
    if(!sel.length){ toast('Pilih minimal 1 tabel','err'); return; }
    _frStep=2;
    document.getElementById('fr-step-1').style.display='none';
    document.getElementById('fr-step-2').style.display='';
    document.getElementById('fr-confirm-title').textContent='Konfirmasi Penghapusan';
    document.getElementById('fr-confirm-count').textContent=sel.length+' tabel ('+sel.map(function(t){return t.label;}).join(', ')+')';
    document.getElementById('fr-confirm-text').value='';
    var btn=document.getElementById('fr-next-btn'); if(btn){ btn.innerHTML='<i class="ti ti-arrow-right"></i> Lanjut'; btn.disabled=true; }
  } else if(_frStep===2){
    _frStep=3;
    document.getElementById('fr-step-2').style.display='none';
    document.getElementById('fr-step-3').style.display='';
    document.getElementById('fr-confirm-title').textContent='Verifikasi PIN';
    document.getElementById('fr-pin').value='';
    document.getElementById('fr-pin-err').style.display='none';
    var btn=document.getElementById('fr-next-btn'); if(btn){ btn.innerHTML='<i class="ti ti-trash-x"></i> HAPUS SEKARANG'; btn.style.background='var(--red)'; btn.disabled=false; }
  } else if(_frStep===3){
    frExecuteReset();
  }
}
function frCheckConfirmText(){
  var val=(document.getElementById('fr-confirm-text').value||'').trim();
  var btn=document.getElementById('fr-next-btn'); if(btn) btn.disabled=(val!=='HAPUS SEMUA');
}
function frTogglePin(){
  var inp=document.getElementById('fr-pin'), ico=document.getElementById('fr-pin-eye'); if(!inp||!ico) return;
  var show=inp.type==='password'; inp.type=show?'text':'password'; ico.className=show?'ti ti-eye-off':'ti ti-eye';
}
function frExecuteReset(){
  var pin=(document.getElementById('fr-pin').value||'').trim();
  if(!pin||pin.length<4){ frPinErr('PIN minimal 4 digit'); return; }
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('fr-next-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span> Verifikasi…'; }
  var username=(CU&&CU.username)||'';
  sb.from('app_users').select('*').ilike('username',username).limit(1)
    .then(function(r){
      if(r.error||!r.data||!r.data.length){
        frPinErr('User tidak ditemukan. Logout & login ulang.');
        if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-trash-x"></i> HAPUS SEKARANG'; } return;
      }
      var usr=r.data[0];

      var stored=String(usr.pin||usr.pin_hash||'').trim();
      var input=String(pin).trim();
      if(!stored||stored!==input){
        frPinErr('PIN salah. Gunakan PIN yang sama saat login.');
        if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-trash-x"></i> HAPUS SEKARANG'; } return;
      }
      frCloseConfirm(); _frRunning=true; frRunReset(sb);
    }).catch(function(e){
      frPinErr('Gagal: '+(e&&e.message||'cek koneksi'));
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-trash-x"></i> HAPUS SEKARANG'; }
    });
}
function frPinErr(msg){
  var el=document.getElementById('fr-pin-err'); if(el){ el.textContent=msg; el.style.display='block'; }
  var inp=document.getElementById('fr-pin'); if(inp){ inp.style.borderColor='var(--red)'; setTimeout(function(){ inp.style.borderColor=''; },2000); }
}
function frRunReset(sb){
  var panel=document.getElementById('fr-progress-panel'),
      ico=document.getElementById('fr-progress-ico'),
      lbl=document.getElementById('fr-progress-label'),
      bar=document.getElementById('fr-progress-bar'),
      steps=document.getElementById('fr-progress-steps');
  if(panel) panel.style.display=''; if(steps) steps.innerHTML='';
  var ct=document.getElementById('content'); if(ct) setTimeout(function(){ ct.scrollTop=ct.scrollHeight; },100);
  var selected=FR_TABLES.filter(function(t){ return _frSelected[t.key]; });
  var total=selected.length, done=0, errors=[];

  function addStep(tbl,label,ok,msg){
    if(!steps) return;
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border-radius:var(--rs);margin-bottom:3px;background:'+(ok?'var(--gng2)':'var(--rg2)');
    row.innerHTML='<i class="ti '+(ok?'ti-circle-check':'ti-circle-x')+'" style="font-size:14px;color:'+(ok?'var(--green)':'var(--red)')+';flex-shrink:0;margin-top:1px"></i>'+
      '<span style="font-size:11px;font-weight:600;color:var(--text);flex:1">'+_esc(label)+'</span>'+
      (msg?'<span style="font-size:9px;color:var(--text3);max-width:140px;text-align:right;line-height:1.4">'+_esc(msg)+'</span>':
           '<span style="font-size:10px;font-weight:700;color:'+(ok?'var(--green)':'var(--red)')+'">'+_esc(ok?'✓ Terhapus':'✗ Gagal')+'</span>');
    steps.appendChild(row); steps.scrollTop=steps.scrollHeight;
  }

  function updateBar(){
    var pct=total>0?Math.round(done/total*100):0;
    if(bar) bar.style.width=pct+'%';
    if(lbl) lbl.textContent='Menghapus… '+done+'/'+total+' ('+pct+'%)';
  }


  var MASTER_FK_TABLES = ['areas','wilayah'];


  function nullifyAppUsersFKs(cb){
    var needNull = selected.some(function(t){ return MASTER_FK_TABLES.indexOf(t.key)>=0; });
    if(!needNull){ cb(); return; }
    if(lbl) lbl.textContent='Melepas foreign key di app_users…';

    sb.from('app_users').update({
      area_coverage_id : null,
      area_id          : null,
      kecamatan_id     : null,
      kelurahan_id     : null,
      rw               : null
    }).neq('id','00000000-0000-0000-0000-000000000000')
    .then(function(r){
      if(r && r.error){

        sb.from('app_users').update({ area_coverage_id: null })
          .neq('id','00000000-0000-0000-0000-000000000000')
          .then(function(){ cb(); }).catch(function(){ cb(); });
      } else {
        cb();
      }
    }).catch(function(){ cb(); });
  }

  function deleteNext(idx){
    if(idx>=selected.length){
      _frRunning=false;
      if(ico){ ico.style.animation=''; ico.className='ti '+(errors.length?'ti-alert-triangle':'ti-circle-check'); ico.style.color=errors.length?'var(--yellow)':'var(--green)'; }
      if(lbl) lbl.textContent=errors.length?'⚠ Selesai dengan '+errors.length+' error':'✅ Factory reset selesai! '+total+' tabel dihapus.';
      if(bar){ bar.style.width='100%'; bar.style.background=errors.length?'linear-gradient(90deg,var(--yellow),var(--c1))':'linear-gradient(90deg,var(--green),var(--cyan))'; }
      _pelLoaded=false; _areaLoaded=false; _oltLoaded=false; _odcLoaded=false; _odpLoaded=false; _dmtLoaded=false; _stwLoaded=false;
      try{ sb.from('audit_log').insert([{ aksi:'factory_reset', username:(CU&&CU.username)||'?', detail:'Reset: '+selected.map(function(t){return t.key;}).join(', '), tgl:new Date().toISOString() }]).then(function(){}).catch(function(){}); }catch(e){}
      toast(errors.length?'Reset selesai dengan beberapa error':'Factory reset berhasil!',errors.length?'err':'ok');
      return;
    }
    var t=selected[idx];
    if(lbl) lbl.textContent='Menghapus '+t.label+'…';


    sb.from(t.key).delete().neq('id','00000000-0000-0000-0000-000000000000')
      .then(function(r){
        done++; updateBar();
        if(r && r.error){
          var msg = r.error.message||'error';

          if(msg.indexOf('foreign key')>=0 || msg.indexOf('violates')>=0){

            sb.rpc('exec_sql', { sql: 'TRUNCATE TABLE '+t.key+' CASCADE;' })
              .then(function(r2){
                if(r2 && r2.error){
                  errors.push(t.key);
                  addStep(t.key, t.label, false, 'FK constraint — perlu TRUNCATE manual');
                } else {
                  addStep(t.key, t.label, true, 'via TRUNCATE CASCADE');
                }
                setTimeout(function(){ deleteNext(idx+1); },120);
              }).catch(function(){
                errors.push(t.key);
                addStep(t.key, t.label, false, 'FK constraint — perlu TRUNCATE manual');
                setTimeout(function(){ deleteNext(idx+1); },120);
              });
          } else {
            errors.push(t.key);
            addStep(t.key, t.label, false, msg.length>60?msg.slice(0,60)+'…':msg);
            setTimeout(function(){ deleteNext(idx+1); },120);
          }
        } else {
          addStep(t.key,t.label,true);
          setTimeout(function(){ deleteNext(idx+1); },120);
        }
      }).catch(function(e){
        done++; updateBar(); errors.push(t.key);
        addStep(t.key,t.label,false,(e&&e.message)||'exception');
        setTimeout(function(){ deleteNext(idx+1); },120);
      });
  }

  updateBar();

  nullifyAppUsersFKs(function(){ deleteNext(0); });
}

function govRender() {
  var total = GOV.stages.length;
  var completed = GOV.stages.filter(function(s){ return s.done; }).length;
  var remaining = total - completed;
  var pct = Math.round((completed / total) * 100);
  var currentStage = GOV.stages[GOV.currentStageIdx];
  var nextIdx = GOV.currentStageIdx + 1;
  var nextStage = nextIdx < total ? GOV.stages[nextIdx] : null;


  var bar = document.getElementById('gov-progress-bar');
  var pctEl = document.getElementById('gov-progress-pct');
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';


  var compEl = document.getElementById('gov-completed');
  var remEl = document.getElementById('gov-remaining');
  var luEl = document.getElementById('gov-last-update');
  if (compEl) compEl.textContent = completed + ' Tahap';
  if (remEl) remEl.textContent = remaining + ' Tahap';
  if (luEl) {
    var d = new Date(GOV.lastUpdate);
    var pad = function(n){ return n < 10 ? '0'+n : n; };
    luEl.textContent = pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes());
  }


  var csEl = document.getElementById('gov-current-stage');
  var nsEl = document.getElementById('gov-next-stage');
  if (csEl) csEl.textContent = 'Tahap ' + currentStage.id + ' · ' + currentStage.name;
  if (nsEl) nsEl.textContent = nextStage ? 'Tahap ' + nextStage.id + ' · ' + nextStage.name : '— Semua Selesai —';


  var ftEl = document.getElementById('gov-footer-time');
  if (ftEl) {
    var now = new Date();
    var pad2 = function(n){ return n < 10 ? '0'+n : n; };
    ftEl.textContent = 'Last render: '+pad2(now.getHours())+':'+pad2(now.getMinutes())+':'+pad2(now.getSeconds());
  }


  var syncEl = document.getElementById('dash-sync-time');
  if (syncEl) syncEl.textContent = 'Governance · CURRENT STAGE: Tahap ' + currentStage.id;


  var list = document.getElementById('gov-stages-list');
  if (!list) return;


  var allDone = GOV.stages[20] && GOV.stages[20].done;

  if (allDone) {
    list.innerHTML = '';
    var hist = document.createElement('div');
    hist.style.cssText = 'background:linear-gradient(135deg,var(--gng2),rgba(5,150,105,.03));border:1.5px solid rgba(5,150,105,.25);border-radius:10px;padding:14px;text-align:center';
    hist.innerHTML = '<i class="ti ti-trophy" style="font-size:32px;color:var(--green);display:block;margin-bottom:8px"></i><div style="font-size:14px;font-weight:800;color:var(--green);margin-bottom:4px">🎉 PROJECT HISTORY</div><div style="font-size:11px;color:var(--text2);line-height:1.7">Semua tahap selesai. Governance Dashboard telah berubah menjadi arsip permanen.</div>';
    list.appendChild(hist);
    var govHdr = document.querySelector('.gov-header-title h3');
    if (govHdr) govHdr.textContent = '📁 PROJECT HISTORY';
    return;
  }

  list.innerHTML = '';
  GOV.stages.forEach(function(stage) {
    var isActive = stage.id === GOV.currentStageIdx && !stage.done;
    var isDone = stage.done;
    var item = document.createElement('div');
    item.className = 'gov-stage-item' + (isDone ? ' done' : '') + (isActive ? ' active' : '');

    var checkIcon = isDone ? '<i class="ti ti-check"></i>' : (isActive ? '<i class="ti ti-player-play" style="font-size:9px"></i>' : '');
    var statusText = isDone ? '✓ SELESAI' : (isActive ? '▶ AKTIF' : '—');

    item.innerHTML =
      '<div class="gov-stage-check">' + checkIcon + '</div>' +
      '<div class="gov-stage-num">' + stage.id + '</div>' +
      '<div class="gov-stage-name">Tahap ' + stage.id + ' · ' + stage.name + '</div>' +
      '<div class="gov-stage-status">' + statusText + '</div>';

    list.appendChild(item);
  });


  var progressPercent = pct;
  var currentStageName = 'Tahap ' + currentStage.id + ' · ' + currentStage.name;
  var nextStageName = nextStage ? 'Tahap ' + nextStage.id + ' · ' + nextStage.name : 'SELESAI';

}

setTimeout(govRender, 100);
var _gisMap        = null;
var _gisLoaded     = false;
var _gisLoading    = false;
var _gisMarkers    = {olt:[],odc:[],odp:[],pel:[]};
var _gisGroups     = {};
var _gisLayers     = {olt:true,odc:true,odp:true,pel:true};
var _gisCurLat     = null;
var _gisCurLng     = null;
var _gisDetData    = null;
var _gisTileSat    = null;
var _gisTileJalan  = null;
var _gisBasemapMode= 'satelit';
var _gisMyLocMarker= null;

_navDispatch.register('gis', function(){ setTimeout(function(){ if(typeof gisInitMap==='function') gisInitMap(); if(typeof gisLoad==='function') gisLoad(false); }, 80); });

function gisInitMap(){
  if(_gisMap) return;
  if(typeof L === 'undefined') return;
  var container = document.getElementById('gis-map');
  if(!container) return;


  _gisMap = L.map('gis-map', {
    center: [-2.5, 118.0],
    zoom: 5,
    zoomControl: false,
    attributionControl: true
  });


  /* Citra satelit (Esri World Imagery — gratis, tanpa API key).
     Untuk banyak lokasi di pelosok Indonesia, Esri TIDAK punya foto udara
     sama sekali di titik itu — server tetap balas "berhasil" (bukan error),
     tapi isinya cuma gambar watermark abu-abu bertuliskan
     "Map data not yet available". Supaya user tidak pernah lihat watermark
     jelek itu, kita sampling piksel tiap tile yang baru dimuat (lewat
     canvas) — kalau warnanya seragam & abu-abu terang khas placeholder,
     otomatis dianggap "kosong" dan peta langsung dialihkan sendiri ke
     Peta Jalan (yang hampir selalu ada isinya, walau minim). */
  _gisTileSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 20,
    maxNativeZoom: 19,
    crossOrigin: true
  });

  /* Peta jalan (OSM) — cadangan otomatis kalau citra satelit tidak tersedia
     untuk suatu lokasi, juga bisa ditoggle manual lewat tombol "Satelit/Jalan". */
  _gisTileJalan = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20
  });

  _gisTileSat.addTo(_gisMap);
  _gisBasemapMode = 'satelit';

  _gisGroups.olt = L.layerGroup().addTo(_gisMap);
  _gisGroups.odc = L.layerGroup().addTo(_gisMap);
  _gisGroups.odp = L.layerGroup().addTo(_gisMap);
  _gisGroups.pel = L.layerGroup().addTo(_gisMap);

  var _gisSatBlank = 0, _gisSatTotal = 0, _gisSatCheckTimer = null;

  _gisTileSat.on('loading', function(){ _gisSatBlank = 0; _gisSatTotal = 0; });

  _gisTileSat.on('tileload', function(e){
    _gisSatTotal++;
    try{
      var cv = document.createElement('canvas');
      cv.width = 8; cv.height = 8;
      var ctx = cv.getContext('2d');
      ctx.drawImage(e.tile, 0, 0, 8, 8);
      var d = ctx.getImageData(0, 0, 8, 8).data;
      var sum = 0, sumSq = 0, n = 0;
      for(var i=0;i<d.length;i+=4){
        var lum = (d[i]+d[i+1]+d[i+2])/3;
        sum += lum; sumSq += lum*lum; n++;
      }
      var mean = sum/n, variance = sumSq/n - mean*mean;
      /* Placeholder Esri: latar seragam abu-abu terang (variansi sangat rendah) */
      if(variance < 60 && mean > 195 && mean < 250) _gisSatBlank++;
    } catch(err){ /* tile lintas-origin gagal dibaca kanvas — abaikan diam-diam, deteksi cuma skip */ }
  });

  _gisTileSat.on('load', function(){
    clearTimeout(_gisSatCheckTimer);
    _gisSatCheckTimer = setTimeout(gisCheckSatCoverage, 150);
  });

  function gisCheckSatCoverage(){
    if(_gisBasemapMode !== 'satelit' || !_gisMap) return;
    if(_gisMap.getZoom() < 15) return; /* di zoom jauh, jangan overreaktif */
    if(_gisSatTotal === 0 || _gisSatBlank / _gisSatTotal < 0.5) return;
    /* Mayoritas tile yang barusan dimuat kosong -> auto-alih ke peta jalan */
    gisToggleBasemap();
    if(typeof toast==='function') toast('Citra satelit tidak tersedia di lokasi ini — otomatis dialihkan ke Peta Jalan', 'info');
  }

  /* Kalau user zoom lebih dalam dari resolusi asli citra satelit (maxNativeZoom
     19) sementara basemap masih 'satelit', tampilkan saran pindah ke peta jalan
     sebagai cadangan kedua (di luar auto-alih di atas). */
  _gisMap.on('zoomend', gisCheckZoomWarn);
}

function gisCheckZoomWarn(){
  var warn = document.getElementById('gis-zoom-warn');
  if(!warn || !_gisMap) return;
  var tooDeep = _gisBasemapMode === 'satelit' && _gisMap.getZoom() > 19;
  warn.style.display = tooDeep ? 'flex' : 'none';
}

/* Toggle antara citra satelit dan peta jalan (OSM).
   Berguna kalau satelit tidak punya data untuk suatu area terpencil. */
function gisToggleBasemap(){
  if(!_gisMap || !_gisTileSat || !_gisTileJalan) return;
  var btn = document.getElementById('gis-basemap-btn');
  if(_gisBasemapMode === 'satelit'){
    _gisMap.removeLayer(_gisTileSat);
    _gisTileJalan.addTo(_gisMap);
    _gisTileJalan.bringToBack();
    _gisBasemapMode = 'jalan';
    if(btn) btn.innerHTML = '<i class="ti ti-satellite"></i>';
    if(btn) btn.title = 'Ganti ke citra satelit';
  } else {
    _gisMap.removeLayer(_gisTileJalan);
    _gisTileSat.addTo(_gisMap);
    _gisTileSat.bringToBack();
    _gisBasemapMode = 'satelit';
    if(btn) btn.innerHTML = '<i class="ti ti-map"></i>';
    if(btn) btn.title = 'Ganti ke peta jalan';
  }
  if(typeof gisCheckZoomWarn==='function') gisCheckZoomWarn();
}

/* Tombol "Lokasi Saya" — pusatkan peta ke posisi GPS user saat ini
   dan tandai dengan marker biru berdenyut. */
function gisLocateMe(){
  if(!_gisMap) return;
  var btn = document.getElementById('gis-locate-btn');
  if(!navigator.geolocation){
    if(typeof toast==='function') toast('Perangkat tidak mendukung GPS','err');
    return;
  }
  if(btn) btn.innerHTML = '<i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i>';
  navigator.geolocation.getCurrentPosition(function(pos){
    if(btn) btn.innerHTML = '<i class="ti ti-current-location"></i>';
    var lat = pos.coords.latitude, lng = pos.coords.longitude;
    _gisMap.setView([lat,lng], 17);
    if(_gisMyLocMarker) _gisMap.removeLayer(_gisMyLocMarker);
    var html = '<div style="width:18px;height:18px;border-radius:50%;background:#1a56db;border:3px solid #fff;box-shadow:0 0 0 4px rgba(26,86,219,.35),0 2px 8px rgba(0,0,0,.3)"></div>';
    var ic = L.divIcon({className:'',html:html,iconSize:[18,18],iconAnchor:[9,9]});
    _gisMyLocMarker = L.marker([lat,lng], {icon:ic, zIndexOffset:1000}).addTo(_gisMap);
    _gisMyLocMarker.bindPopup('<b>Lokasi Anda</b>', {className:'gis-popup'});
  }, function(err){
    if(btn) btn.innerHTML = '<i class="ti ti-current-location"></i>';
    var msg = 'Tidak bisa mengambil lokasi';
    if(err && err.code === 1) msg = 'Izin lokasi ditolak — aktifkan di pengaturan browser';
    else if(err && err.code === 2) msg = 'Lokasi tidak tersedia saat ini';
    else if(err && err.code === 3) msg = 'Waktu pencarian lokasi habis, coba lagi';
    if(typeof toast==='function') toast(msg,'err');
  }, {enableHighAccuracy:true, timeout:10000, maximumAge:0});
}

function _gisIcon(color, letter, size){
  size = size || 26;
  var html = '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+color+';border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-family:Sora,sans-serif;font-size:'+(size*0.38)+'px;font-weight:800;color:#fff;letter-spacing:0">'+letter+'</div>';
  return L.divIcon({className:'',html:html,iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-(size/2+4)]});
}

function gisLoad(forceReload){
  if(!_gisMap) gisInitMap();
  if(!_gisMap) return;

  /* Cegah pemanggilan gisLoad() yang tumpang-tindih (misal user membuka
     menu Peta Jaringan berkali-kali sebelum request sebelumnya selesai).
     Tanpa guard ini, setiap request yang selesai belakangan akan ikut
     nge-push data ke _gisMarkers tanpa reset ulang, sehingga ODP/ODC/
     pelanggan yang sama muncul dobel/triple di pencarian & marker peta. */
  if(_gisLoading) return;
  _gisLoading = true;

  var loading = document.getElementById('gis-map-loading');
  if(loading) loading.style.display='flex';
  var info = document.getElementById('gis-load-info');

  var sb = getSB();
  if(!sb){
    if(loading) loading.style.display='none';
    toast('Koneksi database tidak aktif','err');
    return;
  }


  Object.keys(_gisGroups).forEach(function(k){ _gisGroups[k].clearLayers(); _gisMarkers[k]=[]; });


  if(info) info.textContent='Mengambil data dari Supabase…';

  var p1 = (_areaData.length && !forceReload) ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; });

  var pOlt = sb.from('olts').select('id,kode,nama,area_id,status,lat,lng,lokasi,brand').order('kode');
  var pOdc = sb.from('odcs').select('id,kode,nama,area_id,olt_id,status,lat,lng,lokasi').order('kode');
  var pOdp = sb.from('odps').select('id,kode,nama,area_id,odc_id,status,lat,lng,lokasi,jumlah_port').order('kode');
  var pPelQ = sb.from('pelanggan').select('id,cid,nama,area_id,odp_id,status,paket,lat,lng,alamat').order('cid');
  if(!_isGlobalRole()){
    var sc = _getUserAreaScope();
    if(sc && sc.area_coverage_id){
      if(sc.kelurahan_id){
        pPelQ = pPelQ.eq('kelurahan', sc.kelurahan_id);
        pOdp  = pOdp.eq('area_id', sc.area_coverage_id);
      } else if(sc.kecamatan_id){
        pPelQ = pPelQ.eq('kecamatan', sc.kecamatan_id);
        pOdp  = pOdp.eq('area_id', sc.area_coverage_id);
      } else {
        pPelQ = pPelQ.eq('area_id', sc.area_coverage_id);
        pOdp  = pOdp.eq('area_id', sc.area_coverage_id);
        pOdc  = pOdc.eq('area_id', sc.area_coverage_id);
      }
    }
  }
  var pPel = pPelQ;

  Promise.all([p1]).then(function(){
    gisPopulateAreaFilter();
    return Promise.all([pOlt, pOdc, pOdp, pPel]);
  }).then(function(results){
    var rOlt = results[0]; var rOdc = results[1]; var rOdp = results[2]; var rPel = results[3];

    var oltData  = (!rOlt.error  ? rOlt.data  : []) || [];
    var odcData  = (!rOdc.error  ? rOdc.data  : []) || [];
    var odpData  = (!rOdp.error  ? rOdp.data  : []) || [];
    var pelData  = (!rPel.error  ? rPel.data  : []) || [];


    _gisSetStat('gisst-olt', oltData.length);
    _gisSetStat('gisst-odc', odcData.length);
    _gisSetStat('gisst-odp', odpData.length);
    _gisSetStat('gisst-pel', pelData.length);

    var noCoord = 0;


    oltData.forEach(function(o){
      if(!o.lat || !o.lng){ noCoord++; return; }
      var ic = _gisIcon('#1a56db','O',28);
      var mk = L.marker([parseFloat(o.lat), parseFloat(o.lng)], {icon:ic});
      var popup = _gisPopupHTML('OLT','#1a56db',o.nama,o.kode,
        'Area: '+_gisAreaName(o.area_id)+'<br>Status: '+_gisStatusBadge(o.status)+'<br>Brand: '+(o.brand||'—')+'<br>Lokasi: '+(o.lokasi||'—'),
        'olt', o.id, o.lat, o.lng);
      mk.bindPopup(popup, {className:'gis-popup',maxWidth:240});
      mk.on('click', function(){ _gisDetData = {type:'olt', data:o}; });
      _gisGroups.olt.addLayer(mk);
      _gisMarkers.olt.push({marker:mk, data:o, type:'olt'});
    });


    odcData.forEach(function(o){
      if(!o.lat || !o.lng){ noCoord++; return; }
      var ic = _gisIcon('#7c3aed','D',24);
      var mk = L.marker([parseFloat(o.lat), parseFloat(o.lng)], {icon:ic});
      var popup = _gisPopupHTML('ODC','#7c3aed',o.nama,o.kode,
        'Area: '+_gisAreaName(o.area_id)+'<br>Status: '+_gisStatusBadge(o.status)+'<br>Lokasi: '+(o.lokasi||'—'),
        'odc', o.id, o.lat, o.lng);
      mk.bindPopup(popup, {className:'gis-popup',maxWidth:240});
      mk.on('click', function(){ _gisDetData = {type:'odc', data:o}; });
      _gisGroups.odc.addLayer(mk);
      _gisMarkers.odc.push({marker:mk, data:o, type:'odc'});
    });


    odpData.forEach(function(o){
      if(!o.lat || !o.lng){ noCoord++; return; }
      var pct = o.jumlah_port>0 ? Math.round((typeof SOT!=="undefined"?SOT.odpStats(o.id).used:(o.port_used||0))/o.jumlah_port*100) : 0;
      var color = o.status==='full' ? '#dc2626' : o.status==='maintenance' ? '#d97706' : '#f97316';
      var ic = _gisIcon(color,'P',20);
      var mk = L.marker([parseFloat(o.lat), parseFloat(o.lng)], {icon:ic});
      var popup = _gisPopupHTML('ODP',color,o.nama,o.kode,
        'Area: '+_gisAreaName(o.area_id)+'<br>Status: '+_gisStatusBadge(o.status)+'<br>Port: '+(typeof SOT!=="undefined"?SOT.odpStats(o.id).used:(o.port_used||0))+'/'+(o.jumlah_port||0)+' ('+pct+'%)',
        'odp', o.id, o.lat, o.lng);
      mk.bindPopup(popup, {className:'gis-popup',maxWidth:240});
      mk.on('click', function(){ _gisDetData = {type:'odp', data:o}; });
      _gisGroups.odp.addLayer(mk);
      _gisMarkers.odp.push({marker:mk, data:o, type:'odp'});
    });


    pelData.forEach(function(p){
      if(!p.lat || !p.lng){ noCoord++; return; }
      var color = p.status==='aktif' ? '#059669' : p.status==='isolir' ? '#d97706' : p.status==='cabut' ? '#9ca3af' : '#059669';
      var ic = _gisIcon(color,'★',18);
      var mk = L.marker([parseFloat(p.lat), parseFloat(p.lng)], {icon:ic});
      var popup = _gisPopupHTML('Pelanggan',color,p.nama,p.cid,
        'Area: '+_gisAreaName(p.area_id)+'<br>Status: '+_gisStatusBadge(p.status)+'<br>Paket: '+(p.paket||'—')+'<br>Alamat: '+(p.alamat||'—'),
        'pel', p.id, p.lat, p.lng);
      mk.bindPopup(popup, {className:'gis-popup',maxWidth:240});
      mk.on('click', function(){ _gisDetData = {type:'pel', data:p}; });
      _gisGroups.pel.addLayer(mk);
      _gisMarkers.pel.push({marker:mk, data:p, type:'pel'});
    });


    var noCoordPanel = document.getElementById('gis-no-coord-panel');
    var noCoordText  = document.getElementById('gis-no-coord-text');
    if(noCoord > 0 && noCoordPanel){
      noCoordPanel.style.display = 'flex';
      if(noCoordText) noCoordText.textContent = noCoord + ' item tidak memiliki koordinat dan tidak ditampilkan di peta. Isi kolom Latitude/Longitude pada data terkait.';
    } else if(noCoordPanel){
      noCoordPanel.style.display = 'none';
    }


    gisFitBounds();


    Object.keys(_gisLayers).forEach(function(k){ if(!_gisLayers[k]) _gisGroups[k].remove(); });

    _gisLoaded = true;
    _gisLoading = false;
    if(loading) loading.style.display='none';

  }).catch(function(e){
    _gisLoading = false;
    if(loading) loading.style.display='none';
    toast('Gagal memuat data peta: '+(e.message||'coba lagi'),'err');
  });
}

function _gisSetStat(id, val){
  var el = document.getElementById(id);
  if(el) el.textContent = val;
}
function _gisAreaName(id){
  var a = _areaData.find(function(x){ return x.id===id; });
  return a ? a.nama : '—';
}
function _gisStatusBadge(s){
  var map = {aktif:'<span style="color:#059669;font-weight:800">Aktif</span>',
             down:'<span style="color:#dc2626;font-weight:800">Down</span>',
             maintenance:'<span style="color:#d97706;font-weight:800">Maintenance</span>',
             full:'<span style="color:#dc2626;font-weight:800">Full</span>',
             isolir:'<span style="color:#d97706;font-weight:800">Isolir</span>',
             cabut:'<span style="color:#6b7280;font-weight:800">Cabut</span>',
             planning:'<span style="color:#1a56db;font-weight:800">Planning</span>',
             open:'<span style="color:#1a56db;font-weight:800">Open</span>',
             in_progress:'<span style="color:#d97706;font-weight:800">In Progress</span>'};
  return map[s] || '<span style="color:var(--text3)">'+(_esc(s||'—'))+'</span>';
}
function _gisPriorTag(p){
  var map={critical:'<span style="color:#7f1d1d;font-weight:800">Critical</span>',high:'<span style="color:#dc2626;font-weight:800">High</span>',medium:'<span style="color:#d97706;font-weight:800">Medium</span>',low:'<span style="color:#059669;font-weight:800">Low</span>'};
  return map[p]||p||'—';
}

function _gisPopupHTML(type, color, name, code, meta, dataType, dataId, lat, lng){
  var extLinks = '';
  if(lat && lng){
    var gmaps = 'https://www.google.com/maps/search/?api=1&query='+lat+','+lng;
    var mapillary = 'https://www.mapillary.com/app/?lat='+lat+'&lng='+lng+'&z=17&focus=map';
    extLinks = '<div style="display:flex;gap:6px;margin-top:6px">'+
      '<a href="'+gmaps+'" target="_blank" rel="noopener" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 6px;font-size:10px;font-weight:700;color:var(--text2);text-decoration:none"><i class="ti ti-map-2"></i>Google Maps</a>'+
      '<a href="'+mapillary+'" target="_blank" rel="noopener" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 6px;font-size:10px;font-weight:700;color:var(--text2);text-decoration:none"><i class="ti ti-camera"></i>Mapillary</a>'+
    '</div>';
  }
  return '<div class="gis-popup-inner">'+
    '<div class="gis-popup-type" style="color:'+color+'">'+_esc(type)+'</div>'+
    '<div class="gis-popup-name">'+_esc(name||'—')+'</div>'+
    '<div style="font-family:JetBrains Mono,monospace;font-size:10px;color:'+color+';margin-bottom:5px">'+_esc(code||'')+'</div>'+
    '<div class="gis-popup-meta">'+meta+'</div>'+
    extLinks+
    '</div>'+
    '<button class="gis-popup-btn" onclick="gisOpenDet(\''+dataType+'\',\''+dataId+'\')">'+
      '<i class="ti ti-info-circle"></i> Lihat Detail</button>';
}

function gisToggleLayer(layer, btn){
  if(!_gisMap || !_gisGroups[layer]) return;
  _gisLayers[layer] = !_gisLayers[layer];
  if(_gisLayers[layer]){
    _gisGroups[layer].addTo(_gisMap);
    if(btn){ btn.classList.add('on'); }
  } else {
    _gisGroups[layer].remove();
    if(btn){ btn.classList.remove('on'); }
  }
}

function gisFilterArea(areaId){
  if(!_gisMap) return;
  /* Catatan: hanya olt/odc/odp/pel yang punya grup layer & data marker di peta.
     'tkt' (gangguan) sengaja dihapus dari daftar ini karena grupnya belum
     pernah dibuat — kalau dibiarkan, baris di bawah akan crash setiap kali
     filter area diganti dan menghentikan proses sebelum selesai. */
  var allTypes = ['olt','odc','odp','pel'];
  allTypes.forEach(function(t){
    _gisGroups[t].clearLayers();
    _gisMarkers[t].forEach(function(m){
      var d = m.data;
      var match = !areaId;
      if(!match){
        if(t==='olt'||t==='odc'||t==='odp'||t==='pel') match = d.area_id === areaId;
        if(t==='tkt'){

          match = true;
        }
      }
      if(match && _gisLayers[t]) _gisGroups[t].addLayer(m.marker);
    });
  });
}

var _gisIconMap = {olt:'ti-router',odc:'ti-plug',odp:'ti-antenna',pel:'ti-home',tkt:'ti-alert-triangle'};
var _gisColorMap = {olt:'#1a56db',odc:'#7c3aed',odp:'#f97316',pel:'#059669',tkt:'#dc2626'};
var _gisLabelMap = {olt:'OLT',odc:'ODC',odp:'ODP',pel:'Pelanggan',tkt:'Gangguan'};

function gisSearchMap(q){
  q = q.trim().toLowerCase();
  var resultsEl = document.getElementById('gis-search-results');
  var clrBtn    = document.getElementById('gis-search-clr');
  var backdrop  = document.getElementById('gis-search-backdrop');
  if(clrBtn) clrBtn.style.display = q ? 'flex' : 'none';

  if(!q){
    gisFilterArea(document.getElementById('gis-fil-area').value);
    if(resultsEl){ resultsEl.style.display='none'; resultsEl.innerHTML=''; }
    if(backdrop) backdrop.style.display='none';
    return;
  }

  /* Sama seperti gisFilterArea: 'tkt' dihapus karena grup/data-nya tidak
     pernah dibuat. Sebelumnya baris ini bikin fungsi crash tepat SEBELUM
     sampai ke bagian render daftar hasil di bawah — makanya marker sempat
     muncul di peta tapi daftar teksnya tidak pernah tampil. */
  var allTypes = ['olt','odc','odp','pel'];
  var matches = [];
  allTypes.forEach(function(t){
    _gisGroups[t].clearLayers();
    _gisMarkers[t].forEach(function(m){
      var d = m.data;
      var name  = (d.nama||d.judul||'').toLowerCase();
      var code  = (d.kode||d.cid||d.no_tiket||'').toLowerCase();
      var lokasi= (d.lokasi||d.alamat||'').toLowerCase();
      if((name.includes(q)||code.includes(q)||lokasi.includes(q)) && _gisLayers[t]){
        _gisGroups[t].addLayer(m.marker);
        matches.push({type:t, data:d, marker:m.marker});
      }
    });
  });

  /* Render daftar hasil (list biasa, bukan dropdown) — tap salah satu untuk
     auto-zoom ke lokasinya di peta */
  if(resultsEl){
    if(!matches.length){
      resultsEl.innerHTML = '<div style="padding:16px;text-align:center;font-size:12px;color:var(--text3)"><i class="ti ti-map-pin-off" style="font-size:20px;display:block;margin-bottom:6px;opacity:.4"></i>Tidak ada lokasi ditemukan</div>';
    } else {
      var countHeader = '<div style="padding:8px 12px;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;background:var(--bg3);border-bottom:1px solid var(--border)">'+
        matches.length+' hasil ditemukan'+(matches.length>30 ? ' · menampilkan 30 teratas, persempit kata kunci untuk hasil lebih spesifik' : '')+
        '</div>';
      resultsEl.innerHTML = countHeader + matches.slice(0,30).map(function(m,i){
        var d = m.data;
        var color = _gisColorMap[m.type] || 'var(--c1)';
        var name  = _esc(d.nama || d.judul || '—');
        var code  = _esc(d.kode || d.cid || d.no_tiket || '');
        var lokasi= _esc(d.lokasi || d.alamat || '');
        var hasCoord = !!(d.latitude && d.longitude) || (m.marker.getLatLng && m.marker.getLatLng());
        return '<div onclick="gisGotoResult(\''+m.type+'\',\''+d.id+'\')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid var(--border);cursor:pointer;touch-action:manipulation">'+
          '<div style="width:32px;height:32px;border-radius:9px;background:'+color+'18;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
            '<i class="ti '+(_gisIconMap[m.type]||'ti-map-pin')+'" style="font-size:15px;color:'+color+'"></i>'+
          '</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+name+'</div>'+
            '<div style="font-size:10px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(_gisLabelMap[m.type]||m.type)+(code?' · '+code:'')+(lokasi?' · '+lokasi:'')+'</div>'+
          '</div>'+
          (hasCoord ? '<i class="ti ti-map-pin-filled" style="font-size:15px;color:'+color+';flex-shrink:0"></i>' : '<i class="ti ti-map-pin-off" style="font-size:14px;color:var(--text4);flex-shrink:0" title="Tidak ada koordinat"></i>')+
        '</div>';
      }).join('');
    }
    resultsEl.style.display = 'block';
  }
  if(backdrop) backdrop.style.display = 'block';
}

/* Auto-zoom ke lokasi hasil pencarian / marker terpilih.
   Dipakai oleh dropdown hasil pencarian DAN bisa dipanggil dari mana saja
   (mis. dari detail sheet pelanggan/ODC/ODP) via gisGotoResult(type, id). */
function gisGotoResult(type, id){
  gisCloseSearchResults();
  if(!_gisMap) return;

  var entry = _gisMarkers[type] ? _gisMarkers[type].find(function(m){ return String(m.data.id)===String(id); }) : null;
  var ll = (entry && entry.marker.getLatLng) ? entry.marker.getLatLng() : null;
  var usedFallback = false;

  /* Fallback: kalau pelanggan yang dipilih belum punya koordinat presisi sendiri,
     zoom ke ODP tempat dia terhubung — supaya user tetap terbantu ke lokasi
     terdekat, dan bukan cuma dibiarkan diam di peta. */
  if(!ll && type==='pel' && entry && entry.data && entry.data.odp_id){
    var odpEntry = _gisMarkers.odp.find(function(m){ return String(m.data.id)===String(entry.data.odp_id); });
    if(odpEntry && odpEntry.marker.getLatLng){
      ll = odpEntry.marker.getLatLng();
      entry = odpEntry;
      type = 'odp';
      usedFallback = true;
    }
  }

  if(!entry || !ll){
    if(typeof toast==='function') toast('Lokasi ini belum punya koordinat — isi Latitude/Longitude dulu di data terkait','err');
    return;
  }

  /* pastikan layer jenis ini aktif & marker ada di grup supaya kelihatan */
  if(!_gisLayers[type]){
    var chip = document.getElementById('glayer-'+type);
    if(chip) gisToggleLayer(type, chip);
  }
  if(_gisGroups[type] && !_gisGroups[type].hasLayer(entry.marker)) _gisGroups[type].addLayer(entry.marker);

  /* flyTo memberi animasi zoom yang kelihatan jelas dari zoom jauh ke dekat,
     beda dengan setView yang kadang terasa 'diam' kalau titik awal & akhir
     jauh. Target zoom DIBATASI di 18 (bukan 19) — di banyak lokasi, zoom 19
     itu sudah lewat batas resolusi asli Esri dan cuma nampilin watermark
     abu-abu "Map data not yet available". Zoom 18 sudah cukup untuk lihat
     atap rumah/lokasi jelas, dan hampir selalu masih citra asli (bukan blank). */
  _gisMap.flyTo(ll, 18, {animate:true, duration:1.1});
  setTimeout(function(){
    entry.marker.openPopup();
    if(usedFallback && typeof toast==='function') toast('Pelanggan belum punya koordinat sendiri — ditampilkan di lokasi ODP terdekat','info');
  }, 1150);
}

function gisCloseSearchResults(){
  var resultsEl = document.getElementById('gis-search-results');
  var backdrop  = document.getElementById('gis-search-backdrop');
  if(resultsEl) resultsEl.style.display = 'none';
  if(backdrop) backdrop.style.display = 'none';
}

function gisZoom(dir){
  if(_gisMap) _gisMap.setZoom(_gisMap.getZoom()+dir);
}
function gisFitBounds(){
  if(!_gisMap) return;
  var allMarkers = [];
  Object.keys(_gisMarkers).forEach(function(k){
    _gisMarkers[k].forEach(function(m){ allMarkers.push(m.marker); });
  });
  if(!allMarkers.length) return;
  try{
    var bounds = L.featureGroup(allMarkers).getBounds();
    if(bounds.isValid()) _gisMap.fitBounds(bounds, {padding:[30,30],maxZoom:16});
  } catch(e){}
}

function gisPopulateAreaFilter(){
  var sel = document.getElementById('gis-fil-area');
  if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">Semua Area</option>';
  _areaData.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.id; opt.textContent = a.nama;
    if(a.id===cur) opt.selected=true;
    sel.appendChild(opt);
  });
}

function gisOpenDet(type, id){

  if(_gisMap) _gisMap.closePopup();


  var entry = _gisMarkers[type] ? _gisMarkers[type].find(function(m){ return m.data.id===id; }) : null;
  if(!entry) return;
  var d = entry.data;
  _gisDetData = {type:type, data:d};


  var typeConf = {
    olt:  {ico:'ti-antenna',    color:'var(--c1)',   bg:'var(--c1b)',   title:'Detail OLT'},
    odc:  {ico:'ti-box',        color:'var(--pu)',   bg:'var(--pug)',   title:'Detail ODC'},
    odp:  {ico:'ti-plug',       color:'var(--c2)',   bg:'var(--c2b)',   title:'Detail ODP'},
    pel:  {ico:'ti-user-circle',color:'var(--green)','bg':'var(--gng)', title:'Detail Pelanggan'},
    tkt:  {ico:'ti-alert-circle',color:'var(--red)', bg:'var(--rg2)',   title:'Detail Gangguan'}
  };
  var tc = typeConf[type]||typeConf.olt;
  var ico  = document.getElementById('gis-det-ico');
  var wrap = document.getElementById('gis-det-ico-wrap');
  var ttl  = document.getElementById('gis-det-title');
  if(ico){ ico.className='ti '+tc.ico; ico.style.color=tc.color; }
  if(wrap){ wrap.style.background=tc.bg; }
  if(ttl) ttl.textContent = tc.title;


  function dr(lbl, val){ return '<div class="olt-det-row"><div class="olt-det-lbl">'+lbl+'</div><div class="olt-det-val">'+val+'</div></div>'; }
  function sec(ico2, t){ return '<div class="olt-det-section"><i class="ti ti-'+ico2+'"></i> '+t+'</div>'; }

  var html = '';
  if(type==='olt'){
    html += sec('info-circle','Informasi OLT');
    html += dr('Kode','<span style="font-family:JetBrains Mono,monospace;color:var(--c1)">'+_esc(d.kode||'—')+'</span>');
    html += dr('Nama',_esc(d.nama||'—'));
    html += dr('Area','<span class="tag tc1">'+_esc(_gisAreaName(d.area_id))+'</span>');
    html += dr('Brand / Model',_esc((d.brand||'—')+' '+(d.model||'')));
    html += dr('Status',_gisStatusBadge(d.status));
    html += dr('Lokasi',_esc(d.lokasi||'—'));
    html += sec('map-pin','Koordinat');
    html += dr('Latitude',d.lat||'—');
    html += dr('Longitude',d.lng||'—');
  } else if(type==='odc'){
    html += sec('info-circle','Informasi ODC');
    html += dr('Kode','<span style="font-family:JetBrains Mono,monospace;color:var(--pu)">'+_esc(d.kode||'—')+'</span>');
    html += dr('Nama',_esc(d.nama||'—'));
    html += dr('Area','<span class="tag tc1">'+_esc(_gisAreaName(d.area_id))+'</span>');
    html += dr('Status',_gisStatusBadge(d.status));
    html += dr('Lokasi',_esc(d.lokasi||'—'));
    html += sec('map-pin','Koordinat');
    html += dr('Latitude',d.lat||'—');
    html += dr('Longitude',d.lng||'—');
  } else if(type==='odp'){
    var pct2 = d.jumlah_port>0 ? Math.round((typeof SOT!=="undefined"?SOT.odpStats(d.id).used:(d.port_used||0))/d.jumlah_port*100) : 0;
    var barC2 = pct2>=90?'full':pct2>=70?'warn':'ok';
    html += sec('info-circle','Informasi ODP');
    html += dr('Kode','<span style="font-family:JetBrains Mono,monospace;color:var(--c2)">'+_esc(d.kode||'—')+'</span>');
    html += dr('Nama',_esc(d.nama||'—'));
    html += dr('Area','<span class="tag tc1">'+_esc(_gisAreaName(d.area_id))+'</span>');
    html += dr('Status',_gisStatusBadge(d.status));
    html += dr('Lokasi',_esc(d.lokasi||'—'));
    html += sec('circuit-switchboard','Kapasitas Port');
    html += dr('Total Port',(d.jumlah_port||0)+' port');
    html += dr('Terpakai',(typeof SOT!=="undefined"?SOT.odpStats(d.id).used:(d.port_used||0))+' port');
    html += dr('Utilisasi',
      d.jumlah_port>0 ?
        '<div style="display:flex;align-items:center;gap:8px;flex:1">'+
        '<div class="olt-port-bar-bg" style="flex:1"><div class="olt-port-bar '+barC2+'" style="width:'+pct2+'%"></div></div>'+
        '<span style="font-weight:800;font-family:JetBrains Mono,monospace;font-size:12px">'+pct2+'%</span></div>' : '—');
    html += sec('map-pin','Koordinat');
    html += dr('Latitude',d.lat||'—');
    html += dr('Longitude',d.lng||'—');
  } else if(type==='pel'){
    html += sec('user-circle','Informasi Pelanggan');
    html += dr('CID','<span style="font-family:JetBrains Mono,monospace;color:var(--green)">'+_esc(d.cid||'—')+'</span>');
    html += dr('Nama',_esc(d.nama||'—'));
    html += dr('Area','<span class="tag tc1">'+_esc(_gisAreaName(d.area_id))+'</span>');
    html += dr('Status',_gisStatusBadge(d.status));
    html += dr('Paket',_esc(d.paket||'—'));
    html += dr('Alamat',_esc(d.alamat||'—'));
    html += sec('map-pin','Koordinat');
    html += dr('Latitude',d.lat||'—');
    html += dr('Longitude',d.lng||'—');
  } else if(type==='tkt'){
    html += sec('alert-circle','Informasi Gangguan');
    html += dr('No. Tiket','<span style="font-family:JetBrains Mono,monospace;color:var(--red)">'+_esc(d.no_tiket||'—')+'</span>');
    html += dr('Judul',_esc(d.judul||'—'));
    html += dr('Jenis',_esc(d.jenis||'—'));
    html += dr('Prioritas',_gisPriorTag(d.prioritas));
    html += dr('Status',_gisStatusBadge(d.status));
    html += dr('Tgl Buat',_esc(d.tgl_buat||'—'));
    html += sec('map-pin','Koordinat');
    html += dr('Latitude',d.lat||'—');
    html += dr('Longitude',d.lng||'—');
  }

  var body = document.getElementById('gis-det-body');
  if(body) body.innerHTML = html;


  var navBtn = document.getElementById('gis-det-nav-btn');
  if(navBtn){
    if(d.lat && d.lng){
      navBtn.style.display = 'flex';
      _gisCurLat = parseFloat(d.lat);
      _gisCurLng = parseFloat(d.lng);
    } else {
      navBtn.style.display = 'none';
    }
  }

  document.getElementById('gis-det-overlay').classList.add('on');
}
function gisCloseDet(){ document.getElementById('gis-det-overlay').classList.remove('on'); _gisDetData=null; }

function gisNavToMarker(){
  if(_gisCurLat===null || _gisCurLng===null) return;
  var url = 'https://www.google.com/maps/dir/?api=1&destination='+_gisCurLat+','+_gisCurLng;
  window.open(url, '_blank');
}

var _ieFixCoordFound = [];

function ieFixCoordScan(){
  var sb = getSB();
  var btn = document.getElementById('ie-fixcoord-scan-btn');
  if(!sb){ if(typeof toast==='function') toast('Koneksi tidak aktif','err'); return; }
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memindai…'; }

  document.getElementById('ie-fixcoord-result-wrap').style.display='none';
  document.getElementById('ie-fixcoord-empty').style.display='none';

  sb.from('pelanggan').select('id,cid,nama,lat,lng')
    .not('lat','is',null).not('lng','is',null)
    .then(function(r){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-search"></i> Deteksi Sekarang'; }
      if(r.error){ if(typeof toast==='function') toast('Gagal memindai: '+(r.error.message||''),'err'); return; }

      /* Pola koordinat Indonesia: latitude ±11 s/d 6, longitude ±95 s/d 141.
         Kalau nilai di kolom latitude jauh melampaui rentang wajar (>15 atau <-15)
         SEMENTARA nilai longitude-nya justru kecil (masuk rentang latitude wajar),
         itu ciri khas lat/long tertukar posisi. */
      _ieFixCoordFound = (r.data||[]).filter(function(p){
        var la = parseFloat(p.lat), lo = parseFloat(p.lng);
        if(isNaN(la) || isNaN(lo)) return false;
        var latLooksWrong = Math.abs(la) > 15;
        var lngLooksLikeLat = Math.abs(lo) <= 15;
        return latLooksWrong && lngLooksLikeLat;
      });

      var wrap  = document.getElementById('ie-fixcoord-result-wrap');
      var empty = document.getElementById('ie-fixcoord-empty');
      var list  = document.getElementById('ie-fixcoord-list');
      var cnt   = document.getElementById('ie-fixcoord-count');

      if(!_ieFixCoordFound.length){
        empty.style.display = 'block';
        return;
      }

      cnt.textContent = _ieFixCoordFound.length;
      list.innerHTML = _ieFixCoordFound.map(function(p){
        return '<div style="background:var(--bg3);border:1px solid var(--border2);border-radius:var(--rs);padding:10px 12px">'+
          '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px">'+_esc(p.nama||'—')+'</div>'+
          '<div style="font-size:10px;font-family:monospace;color:var(--c1);margin-bottom:6px">'+_esc(p.cid||'')+'</div>'+
          '<div style="display:flex;gap:8px;font-size:10px;font-family:monospace">'+
            '<div style="flex:1;background:var(--rg2);border-radius:6px;padding:5px 8px;color:var(--red)">Sekarang<br>lat: '+p.lat+'<br>lng: '+p.lng+'</div>'+
            '<div style="flex:1;background:var(--gng2);border-radius:6px;padding:5px 8px;color:var(--green)">Jadi (ditukar)<br>lat: '+p.lng+'<br>lng: '+p.lat+'</div>'+
          '</div>'+
        '</div>';
      }).join('');
      wrap.style.display = 'block';
    }).catch(function(e){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-search"></i> Deteksi Sekarang'; }
      if(typeof toast==='function') toast('Error: '+(e.message||'coba lagi'),'err');
    });
}

function ieFixCoordApplyAll(){
  if(!_ieFixCoordFound.length) return;
  if(!confirm('Tukar lat/long untuk '+_ieFixCoordFound.length+' pelanggan yang terdeteksi?\n\nTindakan ini langsung mengubah data di database.')) return;

  var sb = getSB();
  var btn = document.getElementById('ie-fixcoord-apply-btn');
  if(!sb){ if(typeof toast==='function') toast('Koneksi tidak aktif','err'); return; }
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="ti ti-loader-2" style="animation:rot 1s linear infinite"></i> Memperbaiki…'; }

  var ops = _ieFixCoordFound.map(function(p){
    return sb.from('pelanggan').update({lat:p.lng, lng:p.lat}).eq('id',p.id);
  });

  Promise.all(ops).then(function(results){
    var failed = results.filter(function(r){ return r && r.error; });
    if(typeof window._auditLog==='function'){
      window._auditLog('pelanggan','update', null, null, {
        catatan: 'Perbaikan massal lat/long tertukar — '+_ieFixCoordFound.length+' pelanggan ('+_ieFixCoordFound.map(function(p){return p.cid;}).join(', ')+')'
      });
    }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-tool"></i> Perbaiki Semua yang Terdeteksi'; }
    if(failed.length){
      if(typeof toast==='function') toast(failed.length+' gagal diperbaiki, '+(_ieFixCoordFound.length-failed.length)+' berhasil','err');
    } else {
      if(typeof toast==='function') toast(_ieFixCoordFound.length+' koordinat pelanggan berhasil diperbaiki','ok');
    }
    _ieFixCoordFound = [];
    document.getElementById('ie-fixcoord-result-wrap').style.display='none';
    if(typeof _pelLoaded!=='undefined') _pelLoaded=false;
    if(window.SOT) SOT.invalidate('general');
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-tool"></i> Perbaiki Semua yang Terdeteksi'; }
    if(typeof toast==='function') toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

function ieSetTab(tab, btn){
  ['import','export','fixcoord','log'].forEach(function(t){
    var pane = document.getElementById('ie-pane-'+t);
    var b    = document.getElementById('ie-tab-'+t);
    if(pane) pane.classList.toggle('on', t===tab);
    if(b)    b.classList.toggle('on', t===tab);
  });
  if(tab==='export') ieBuildExportList();
}

var _ieSchemas = {
  areas:     {label:'Area & Coverage',   cols:['kode','nama','kota','provinsi','type','status','target_homes','keterangan'],                              required:['kode','nama','kota']},
  olts:      {label:'Master OLT',        cols:['kode','nama','lokasi','brand','model','jumlah_pon','pon_used','uplink','status','lat','lng','keterangan'],required:['kode','nama']},
  odcs:      {label:'Master ODC',        cols:['kode','nama','area_kode','olt_kode','lokasi','type','jumlah_port','status','lat','lng','keterangan'],                required:['kode','nama']},
  odps:      {label:'Master ODP',        cols:['kode','nama','area_kode','odc_kode','lokasi','type','jumlah_port','status','lat','lng','keterangan'],                required:['kode','nama']},
  pelanggan: {label:'Pelanggan', cols:['cid','nama','hp','nik','alamat','kecamatan','kelurahan','rw','rt','paket','jenis_pelanggan','tgl_pasang','status','tipe_recurring','area_id','odp_id','nomor_port','sn_ont','mac_ont','ont_model','teknisi_pasang','lat','lng','keterangan'], resolve_cols:['area_kode','odp_kode','area_coverage'], required:['cid','nama']},
  material_items: {label:'Material',     cols:['kode','nama','kategori','satuan','merk','stok','min_stok','harga_satuan','status','keterangan'],         required:['kode','nama','kategori']},
  tickets:   {label:'Ticketing',         cols:['no_tiket','jenis','prioritas','status','judul','deskripsi','teknisi','tgl_buat'],                        required:['no_tiket','jenis']}
};

var _ieCurrentModul = '';
var _ieParsedData   = [];
var _ieLog          = [];

function ieModulChange(){
  var modul = document.getElementById('ie-modul').value;
  _ieCurrentModul = modul;
  var tmplWrap = document.getElementById('ie-template-wrap');
  var dropzone  = document.getElementById('ie-dropzone');
  var schema    = _ieSchemas[modul];
  ieResetPreview();
  if(!schema || !modul){
    if(tmplWrap) tmplWrap.style.display='none';
    if(dropzone)  dropzone.style.display='none';
    return;
  }
  if(tmplWrap) tmplWrap.style.display='block';
  if(dropzone)  dropzone.style.display='block';
  var colEl = document.getElementById('ie-template-cols');
  if(colEl){
    if(modul === 'pelanggan'){
      colEl.innerHTML =
        '<b style="color:var(--text2)">📋 Data Pribadi:</b> cid, nama, hp, nik, alamat, kecamatan, kelurahan, rw, rt<br>'+
        '<b style="color:var(--text2)">📶 Layanan:</b> paket, jenis_pelanggan, tgl_pasang, status, tipe_recurring<br>'+
        '<b style="color:var(--text2)">🔌 Infra Jaringan:</b> area_kode, odp_kode, nomor_port, sn_ont, mac_ont, ont_model<br>'+
        '<b style="color:var(--text2)">👷 Petugas:</b> teknisi_pasang<br>'+
        '<b style="color:var(--text2)">📍 Lokasi & Catatan:</b> lat, lng, keterangan';
    } else {
      colEl.textContent = schema.cols.join(', ');
    }
  }


  var hintEl = document.getElementById('ie-fk-hint');
  if(!hintEl){
    hintEl = document.createElement('div');
    hintEl.id = 'ie-fk-hint';
    hintEl.style.cssText='font-size:10px;line-height:1.7;margin-top:6px;padding:7px 10px;border-radius:8px;';
    var tmplWrap2 = document.getElementById('ie-template-wrap');
    if(tmplWrap2) tmplWrap2.appendChild(hintEl);
  }
  if(modul==='odcs'){
    hintEl.style.display='block';
    hintEl.style.background='rgba(26,86,219,.07)';
    hintEl.style.color='var(--c1)';
    hintEl.innerHTML='<i class="ti ti-info-circle"></i> <strong>area_kode</strong>: isi dengan kode Area (contoh: <code>AREA-001</code>) &nbsp;·&nbsp; <strong>olt_kode</strong>: isi dengan kode OLT parent (contoh: <code>OLT-001</code>). Sistem akan otomatis menghubungkan ke ID yang sesuai.';
  } else if(modul==='odps'){
    hintEl.style.display='block';
    hintEl.style.background='rgba(26,86,219,.07)';
    hintEl.style.color='var(--c1)';
    hintEl.innerHTML='<i class="ti ti-info-circle"></i> <strong>area_kode</strong>: isi dengan kode Area (contoh: <code>AREA-001</code>) &nbsp;·&nbsp; <strong>odc_kode</strong>: isi dengan kode ODC parent (contoh: <code>ODC-001</code>). Sistem akan otomatis menghubungkan ke ID yang sesuai.';
  } else if(modul==='pelanggan'){
    hintEl.style.display='block';
    hintEl.style.background='rgba(5,150,105,.07)';
    hintEl.style.color='var(--green)';
    hintEl.innerHTML='<i class="ti ti-info-circle"></i> '+
      '<strong>📤 Export lalu Import:</strong> Gunakan tombol <b>Export</b> untuk mengunduh data existing dalam format CSV yang langsung bisa diimpor kembali — semua kolom (hp, nik, sn_ont, odp, area, dll) sudah terpetakan otomatis.<br>'+
      '<strong>📥 Import baru:</strong> Unduh template, isi datanya, lalu upload. '+
      '<strong>area_kode</strong> / <strong>Area</strong>: kode atau nama Area (cth: <code>CBD</code> atau <code>Cibadak</code>) &nbsp;·&nbsp; '+
      '<strong>odp_kode</strong> / <strong>ODP</strong>: kode ODP (cth: <code>W1_CBD_JJC.JKBN_001_001</code>). '+
      '<strong>status</strong>: <code>aktif</code> / <code>proses</code> / <code>isolir</code> / <code>cabut</code>. '+
      '<strong>jenis_pelanggan</strong>: <code>Reguler</code> / <code>UMKM</code> / <code>Corporate</code>.';
  } else {
    hintEl.style.display='none';
  }


  var sqlBanner = document.getElementById('ie-sql-constraint-hint');
  if(!sqlBanner && (modul==='odcs'||modul==='odps'||modul==='olts'||modul==='areas')){
    sqlBanner = document.createElement('div');
    sqlBanner.id = 'ie-sql-constraint-hint';
    sqlBanner.style.cssText='font-size:10px;line-height:1.7;margin-top:8px;padding:9px 11px;border-radius:9px;background:rgba(217,119,6,.08);border:1px solid rgba(217,119,6,.25);color:var(--yellow)';
    var sqlMap = {
      areas: 'ALTER TABLE areas ADD CONSTRAINT areas_kode_unique UNIQUE (kode);',
      olts:  'ALTER TABLE olts  ADD CONSTRAINT olts_kode_unique  UNIQUE (kode);',
      odcs:  'ALTER TABLE odcs  ADD CONSTRAINT odcs_kode_unique  UNIQUE (kode);',
      odps:  'ALTER TABLE odps  ADD CONSTRAINT odps_kode_unique  UNIQUE (kode);'
    };
    var sql = sqlMap[modul] || '';
    sqlBanner.innerHTML = '<i class="ti ti-terminal"></i> <strong>Jika import gagal "ON CONFLICT"</strong> — jalankan SQL ini di Supabase sekali:<br>'
      +'<code style="display:block;margin-top:4px;padding:5px 8px;background:rgba(0,0,0,.08);border-radius:6px;font-size:10px;word-break:break-all">'+sql+'</code>'
      +'<span style="display:block;margin-top:4px;font-size:10px;opacity:.8">Setelah itu import akan berjalan normal (upsert by kode).</span>';
    var tmplW2 = document.getElementById('ie-template-wrap');
    if(tmplW2) tmplW2.appendChild(sqlBanner);
  } else if(sqlBanner){
    sqlBanner.style.display = (modul==='odcs'||modul==='odps'||modul==='olts'||modul==='areas') ? 'block' : 'none';
  }
}

function ieDownloadTemplate(){
  var schema = _ieSchemas[_ieCurrentModul];
  if(!schema) return;

  var _ex = {
    areas:     [['AREA-001','Bandung Utara','Bandung','Jawa Barat','urban','aktif','500','Wilayah padat']],
    olts:      [['OLT-001','OLT Gegerkalong','Jl. Gegerkalong No.1','Huawei','MA5608T','16','8','10G','aktif','-6.870','107.577','']],
    odcs:      [['ODC-001','ODC Sukajadi','AREA-001','OLT-001','Jl. Sukajadi No.10','aerial','8','0','aktif','-6.890','107.580',''],
                ['ODC-002','ODC Cipedes','AREA-001','OLT-001','Jl. Cipedes No.5','aerial','8','2','aktif','-6.895','107.582','']],
    odps:      [['ODP-001','ODP Sukajadi-01','AREA-001','ODC-001','Tiang Listrik depan warung','aerial','8','0','aktif','-6.891','107.581',''],
                ['ODP-002','ODP Sukajadi-02','AREA-001','ODC-001','Tiang PLN No.23','aerial','8','3','aktif','-6.892','107.583','']],
    pelanggan: [
      ['CID-26-0001','Budi Santoso','081234567890','3273010101010001','Jl. Merdeka No.1 RT01/02','Cibadak','Cibadak','01','02','20 Mbps','Reguler','2026-01-15','aktif','bulanan','CBD','W1_CBD_JJC.JKBN_001_001','3','SN12345678','AA:BB:CC:DD:EE:01','NOKIA G-010G-A','Budi Teknisi','-6.900','107.590','Pelanggan perdana'],
      ['CID-26-0002','Siti Rahayu','082345678901','3273020202020002','Jl. Sudirman No.5 RT02/03','Cibadak','Parakansalak','02','03','10 Mbps','Reguler','2026-02-01','aktif','bulanan','CBD','W1_CBD_JJC.JKBN_001_001','5','SN87654321','AA:BB:CC:DD:EE:02','HUAWEI EG8145V5','Siti Teknisi','-6.901','107.591',''],
      ['CID-26-0003','Ahmad Yusuf','083456789012','3273030303030003','Jl. Diponegoro No.8','Cicurug','Benda','03','04','50 Mbps','UMKM','2026-03-10','aktif','bulanan','CCR','W1_CCR_JJC.JKBN_002_001','1','SN11223344','','ZTE F660','Budi Teknisi','-6.902','107.592','Warung kopi']
    ],
    tickets:   [['TKT-001','gangguan','high','open','Internet tidak bisa','Pelanggan tidak bisa browsing sejak pagi','Teknisi A',new Date().toISOString().slice(0,10)],
                ['TKT-002','pemasangan','medium','open','Pasang baru pelanggan','Request pemasangan baru','Teknisi B',new Date().toISOString().slice(0,10)]]
  };
  var rows = _ex[_ieCurrentModul] || [schema.cols.map(function(){ return ''; })];
  var csv = schema.cols.join(',') + '\n';
  rows.forEach(function(r){ csv += r.map(function(v){ return '"'+String(v).replace(/"/g,'""')+'"'; }).join(',') + '\n'; });
  _ieDownloadBlob(csv, 'template_'+_ieCurrentModul+'.csv', 'text/csv');
  toast('Template diunduh — '+rows.length+' baris contoh','ok');
}

/* ── Handle drop ── */
function ieHandleDrop(e){
  e.preventDefault();
  document.getElementById('ie-dropzone').style.borderColor='var(--border3)';
  var file = e.dataTransfer.files[0];
  if(file) ieHandleFile(file);
}

/* ── Parse CSV file ── */
function ieHandleFile(file){
  if(!file) return;
  if(!_ieCurrentModul){ toast('Pilih modul terlebih dahulu','err'); return; }
  if(file.size > 5*1024*1024){ toast('File terlalu besar (maks 5MB)','err'); return; }
  var ext = file.name.split('.').pop().toLowerCase();
  if(ext !== 'csv'){ toast('Hanya file .csv yang didukung','err'); return; }

  var reader = new FileReader();
  reader.onload = function(e){
    var text = e.target.result;
    /* FIX v23: Strip BOM UTF-8 di level byte sebelum parsing */
    if(typeof text === 'string'){
      /* BOM sebagai karakter unicode */
      if(text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      /* BOM yang ter-encode salah menjadi 3 karakter latin: ï»¿ */
      if(text.charCodeAt(0)===0xEF||text.charCodeAt(0)===0xC3)
        text = text.replace(/^[\xEF\xBB\xBF\xC3\xAF\xC2\xBB\xC2\xBF]+/,'');
    }
    ieParseCSV(text);
  };
  /* Coba baca sebagai UTF-8, fallback ke tanpa encoding hint */
  try {
    reader.readAsText(file, 'UTF-8');
  } catch(e) {
    reader.readAsText(file);
  }
}

/* ── Parse CSV text ── */
function ieParseCSV(text){
  /* FIX v23: Strip BOM UTF-8 (0xEF 0xBB 0xBF) yang merusak nama kolom pertama */
  if(text.charCodeAt(0)===0xFEFF) text = text.slice(1);
  /* Juga strip BOM yang sudah salah-encode sebagai string (terjadi saat double-encode) */
  text = text.replace(/^[\uFEFF\u00EF\u00BB\u00BF]+/, '');
  /* Strip karakter tidak terlihat lain di awal */
  text = text.replace(/^\xEF\xBB\xBF/, '');

  var lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(function(l){ return l.trim(); });
  if(lines.length < 2){ toast('File CSV kosong atau hanya berisi header','err'); return; }

  var schema = _ieSchemas[_ieCurrentModul];
  if(!schema) return;

  /* FIX v23: Deteksi separator otomatis dari baris header */
  var _firstLine = lines[0];
  var _sep = ',';
  if((_firstLine.match(/\t/g)||[]).length > (_firstLine.match(/,/g)||[]).length){
    _sep = '\t';
  } else if((_firstLine.match(/;/g)||[]).length > (_firstLine.match(/,/g)||[]).length){
    _sep = ';';
  }

  /* Override _ieCSVLine lokal dengan separator yang terdeteksi */
  var _parseLine = function(line){
    if(_sep === ',') return _ieCSVLine(line);
    var result=[]; var cur=''; var inQ=false;
    for(var i=0;i<line.length;i++){
      var c=line[i];
      if(c==='"'){ inQ=!inQ; }
      else if(c===_sep&&!inQ){ result.push(cur.trim()); cur=''; }
      else { cur+=c; }
    }
    result.push(cur.trim());
    return result;
  };

  /* Parse header — normalisasi nama kolom & alias */
  var _colAlias = {
    /* kode aliases */
    'kode':'kode',
    /* area — semua variasi kolom area dari export maupun manual */
    'area':'area_kode','area_kode':'area_kode','area_coverage':'area_kode',
    'area & coverage':'area_kode','area id':'area_kode',
    /* olt */
    'olt':'olt_kode','olt_kode':'olt_kode','olt induk':'olt_kode',
    /* odc */
    'odc':'odc_kode','odc_kode':'odc_kode','odc induk':'odc_kode',
    /* odp */
    'odp':'odp_kode','odp_kode':'odp_kode','odp id':'odp_kode',
    /* port */
    'jumlah port':'jumlah_port','total port':'jumlah_port',
    'port used':'port_used','port terpakai':'port_used',
    'nomor port':'nomor_port','no port':'nomor_port','no. port':'nomor_port',
    /* pelanggan fields — alias untuk kolom export */
    'no. hp':'hp','no hp':'hp','telepon':'hp','phone':'hp',
    'nama pelanggan':'nama','nama lengkap':'nama',
    'tgl pasang':'tgl_pasang','tanggal pasang':'tgl_pasang',
    'jenis pelanggan':'jenis_pelanggan','jenis':'jenis_pelanggan',
    'sn ont':'sn_ont','serial number':'sn_ont','serial ont':'sn_ont',
    'mac ont':'mac_ont','mac address':'mac_ont',
    'model ont':'ont_model','ont model':'ont_model',
    'teknisi_pasang':'teknisi_pasang','teknisi pasang':'teknisi_pasang','teknisi':'teknisi_pasang',
    'tipe recurring':'tipe_recurring','tipe langganan':'tipe_recurring',
    /* tiket */
    'no tiket':'no_tiket','no_tiket':'no_tiket',
    /* material */
    'harga satuan':'harga_satuan','min stok':'min_stok'
  };

  var headers = _parseLine(lines[0]).map(function(h){
    /* FIX v23: bersihkan karakter BOM dan non-printable dari setiap nama header */
    var clean = h.replace(/[\uFEFF\u00EF\u00BB\u00BF\x00-\x1F]/g,'').trim().toLowerCase();
    /* Jika masih ada karakter aneh sebelum nama asli (mis: ï»¿kode → kode) */
    clean = clean.replace(/^[^a-z_]+/, '');
    return _colAlias[clean] || clean;
  });
  var rows    = [];
  var errors  = [];

  for(var i=1; i<lines.length; i++){
    var vals = _parseLine(lines[i]);
    if(!vals.length || (vals.length===1&&!vals[0])) continue;
    var row = {};
    headers.forEach(function(h,idx){ row[h] = (vals[idx]||'').trim(); });

    /* Validate required fields */
    var rowErrs = [];
    schema.required.forEach(function(req){
      if(!row[req]) rowErrs.push(req+' wajib diisi');
    });
    if(rowErrs.length) errors.push('Baris '+(i)+': '+rowErrs.join(', '));
    row._row   = i;
    row._valid = rowErrs.length === 0;
    rows.push(row);
  }

  _ieParsedData = rows;
  ieShowPreview(headers, rows, errors);
}

/* ── CSV line parser (handles quoted fields) ── */
function _ieCSVLine(line){
  var result=[]; var cur=''; var inQ=false;
  for(var i=0;i<line.length;i++){
    var c=line[i];
    if(c==='"'){ inQ=!inQ; }
    else if(c===','&&!inQ){ result.push(cur); cur=''; }
    else { cur+=c; }
  }
  result.push(cur);
  return result;
}

/* ── Show preview ── */
function ieShowPreview(headers, rows, errors){
  var wrap = document.getElementById('ie-preview-wrap');
  var cnt  = document.getElementById('ie-preview-count');
  var errDiv = document.getElementById('ie-err-summary');
  var head = document.getElementById('ie-preview-head');
  var body = document.getElementById('ie-preview-body');
  var importBtn = document.getElementById('ie-import-btn');

  var validCount = rows.filter(function(r){ return r._valid; }).length;

  if(cnt) cnt.textContent = rows.length+' baris · '+validCount+' valid';

  /* Errors — FIX v23: tampilkan kolom yang terbaca untuk debugging */
  if(errors.length && errDiv){
    errDiv.style.display='block';
    var schema2 = _ieSchemas[_ieCurrentModul];
    var missingReq = schema2 ? schema2.required.filter(function(r){
      return headers.indexOf(r) < 0;
    }) : [];
    var debugInfo = missingReq.length
      ? '<div style="margin-top:6px;font-size:10px;color:var(--text2)">'+
        '⚠ Kolom wajib tidak ditemukan: <b>'+missingReq.join(', ')+'</b><br>'+
        'Kolom CSV yang terbaca: <span style="font-family:monospace">'+headers.join(', ')+'</span>'+
        '</div>'
      : '';
    errDiv.innerHTML = '<strong><i class="ti ti-alert-circle"></i> '+errors.length+' baris bermasalah:</strong><br>'+
      errors.slice(0,5).map(function(e){ return '• '+_esc(e); }).join('<br>')+
      (errors.length>5 ? '<br>... dan '+(errors.length-5)+' lainnya' : '')+
      debugInfo;
  } else if(errDiv) { errDiv.style.display='none'; }

  /* Header row */
  var schema = _ieSchemas[_ieCurrentModul];
  var displayCols = headers.filter(function(h){ return schema.cols.indexOf(h.trim())>=0; }).slice(0,6);
  if(head) head.innerHTML = '<tr>'+displayCols.map(function(h){ return '<th>'+_esc(h)+'</th>'; }).join('')+'<th>Status</th></tr>';

  /* Body rows */
  if(body) body.innerHTML = rows.slice(0,50).map(function(r){
    var cells = displayCols.map(function(h){ return '<td>'+_esc(r[h.trim()]||'—')+'</td>'; }).join('');
    var badge = r._valid
      ? '<td><span style="color:var(--green);font-weight:700;font-size:10px">✓ OK</span></td>'
      : '<td><span style="color:var(--red);font-weight:700;font-size:10px">✗ ERR</span></td>';
    return '<tr style="'+(r._valid?'':'background:var(--rg2)')+'">'+cells+badge+'</tr>';
  }).join('');

  if(importBtn) importBtn.disabled = validCount===0;
  if(wrap) wrap.style.display='block';
}

/* ════════════════════════════════════════════════════════════════
   [T5.2] BATCH IMPORT HELPERS — N+1 refactor
   ════════════════════════════════════════════════════════════════ */

/**
 * Execute single batch chunk: upsert + fallback insert + error tracking
 * @param {*} sb - Supabase client
 * @param {string} modul - Module name (areas, olts, ...)
 * @param {Array} chunkRows - Rows to import (typically 500/batch)
 * @param {string} conflictKey - Unique key (kode, cid, etc)
 * @returns {Promise} {ok: [], fail: [], portOps: []}
 */
function _executeBatchChunk(sb, modul, chunkRows, conflictKey){
  if(!chunkRows.length) return Promise.resolve({ok: [], fail: [], portOps: []});

  var result = {ok: [], fail: [], portOps: []};

  /* [FIX] Kumpulkan portOps SEBELUM strip, lalu bersihkan __portMeta dari
     setiap row agar tidak ikut masuk ke payload DB (kolom tidak ada di schema). */
  chunkRows.forEach(function(row){
    if(row.__portMeta && row.__portMeta.odpId){
      result.portOps.push({row: row, meta: row.__portMeta});
    }
    delete row.__portMeta;
  });

  // Step 1: Try batch upsert
  return sb.from(modul).upsert(chunkRows, {onConflict: conflictKey})
    .then(function(upsertRes){
      if(!upsertRes.error){
        // Upsert success — all rows accepted
        result.ok = chunkRows;
        return result;
      }

      // Upsert failed (e.g., constraint violation) — fallback to individual insert
      var failedChunk = chunkRows;
      return sb.from(modul).insert(failedChunk)
        .then(function(insertRes){
          if(!insertRes.error){
            result.ok = failedChunk;
            return result;
          }

          // Insert still failed — mark all as fail
          failedChunk.forEach(function(row){
            result.fail.push({row: row, err: insertRes.error.message || 'Insert gagal'});
          });
          return result;
        })
        .catch(function(insertErr){
          failedChunk.forEach(function(row){
            result.fail.push({row: row, err: insertErr.message || 'Insert error'});
          });
          return result;
        });
    })
    .catch(function(upsertErr){
      // Upsert network error — mark all as fail
      chunkRows.forEach(function(row){
        result.fail.push({row: row, err: upsertErr.message || 'Upsert error'});
      });
      return result;
    });
}

/**
 * [P30] Assign ports to pelanggan — CONFLICT-SAFE, NO OVERWRITE
 *
 * Aturan:
 * 1. Jika port sudah dimiliki CID LAIN yang ada di DB → SKIP, catat portConflict.
 *    Port tidak pernah berpindah secara diam-diam dari pelanggan lama ke pelanggan baru.
 * 2. Jika port sudah dimiliki CID YANG SAMA (re-import) → update pel_id saja (aman).
 * 3. Jika CID pindah port (ODP/nomor berbeda dari yang tercatat di DB) →
 *    kosongkan port lama dulu (port reclaim) lalu assign port baru.
 *    Mencegah "ghost port" — port lama masih tercatat terpakai padahal pelanggan sudah pindah.
 * 4. Jika port belum ada di odp_ports → insert baru.
 *
 * @param {*} sb - Supabase client
 * @param {Array} portOps - Array of {row, meta: {odpId, nomorPort, areaId}}
 * @returns {Promise} when all assignments done
 */
function _batchAssignPorts(sb, portOps){
  if(!portOps.length) return Promise.resolve();

  var cidList = portOps.map(function(op){ return op.row.cid; }).filter(Boolean);

  /* Step 1: lookup pel_id dan port lama yang dimiliki masing-masing CID di DB */
  var _pelLookup = {}; /* cid → {id, odp_id, nomor_port} */
  var _pPel = cidList.length
    ? sb.from('pelanggan')
        .select('id,cid,odp_id,nomor_port')
        .in('cid', cidList)
        .then(function(r){
          (r.data||[]).forEach(function(p){
            _pelLookup[p.cid] = { id: p.id, odp_id: p.odp_id||null, nomor_port: p.nomor_port||null };
          });
        })
        .catch(function(e){ console.warn('[Port Assign] Gagal lookup pelanggan:', e.message); })
    : Promise.resolve();

  return _pPel.then(function(){
    /* [P30] Eksekusi SATU PER SATU (sequential, bukan parallel) agar tidak ada race condition
       saat 2 CID berbeda claim port yang sama dalam 1 batch — yang pertama menang,
       yang kedua masuk ke portConflict. Parallel Promise.all() tidak memberi jaminan urutan. */
    var ops = portOps.slice();
    function _next(){
      if(!ops.length) return Promise.resolve();
      var op = ops.shift();
      return _assignOnePort(sb, op, _pelLookup).then(_next);
    }
    return _next();
  });
}

/* [P30] Assign satu port — dipanggil sequential dari _batchAssignPorts */
function _assignOnePort(sb, op, _pelLookup){
  var portMeta = op.meta;
  var cid      = op.row.cid || '';
  var pelInfo  = _pelLookup[cid] || null;
  var pelId    = pelInfo ? pelInfo.id : null;

  if(!portMeta || !portMeta.odpId || !portMeta.nomorPort){
    window._ieImportDiag = window._ieImportDiag || {};
    window._ieImportDiag.assignSkipped = window._ieImportDiag.assignSkipped || [];
    window._ieImportDiag.assignSkipped.push(cid || '(tanpa cid)');
    return Promise.resolve();
  }

  var odpId = portMeta.odpId;
  var nomor = parseInt(portMeta.nomorPort) || portMeta.nomorPort;
  var ST_TERPAKAI = (typeof PORT_STATUS !== 'undefined' && PORT_STATUS.TERPAKAI) ? PORT_STATUS.TERPAKAI : 'terpakai';
  var ST_KOSONG   = (typeof PORT_STATUS !== 'undefined' && PORT_STATUS.KOSONG)   ? PORT_STATUS.KOSONG   : 'kosong';

  /* [P30-2] Cek apakah CID ini punya port lama yang BERBEDA — harus dikosongkan dulu */
  var oldOdpId  = pelInfo && pelInfo.odp_id;
  var oldNomor  = pelInfo && pelInfo.nomor_port;
  var portPindah = oldOdpId && (oldOdpId !== odpId || String(oldNomor) !== String(nomor));

  /* Fungsi reclaim port lama */
  function _reclaimOldPort(){
    if(!portPindah) return Promise.resolve();
    return sb.from('odp_ports')
      .update({ status: ST_KOSONG, cid_pelanggan: null, pel_id: null })
      .eq('odp_id', oldOdpId)
      .eq('nomor_port', parseInt(oldNomor)||oldNomor)
      .eq('cid_pelanggan', cid) /* hanya kosongkan jika masih milik CID ini */
      .then(function(r){
        if(r && r.error) console.warn('[Port Assign] Gagal reclaim port lama CID '+cid+':', r.error.message);
        else console.log('[Port Assign] Port lama dikosongkan: CID '+cid+' ODP '+oldOdpId+' port '+oldNomor);
      })
      .catch(function(e){ console.warn('[Port Assign] Error reclaim:', e.message); });
  }

  /* [P30-1] Cek kepemilikan port tujuan */
  return sb.from('odp_ports')
    .select('id,status,cid_pelanggan,pel_id')
    .eq('odp_id', odpId)
    .eq('nomor_port', nomor)
    .limit(1)
    .then(function(r){
      var existing = r.data && r.data[0];

      if(existing){
        var ownerCid = existing.cid_pelanggan || null;

        /* [P30-1] Port sudah dimiliki CID LAIN → SKIP, catat conflict */
        if(ownerCid && ownerCid !== cid){
          window._ieImportDiag = window._ieImportDiag || {};
          window._ieImportDiag.portConflict = window._ieImportDiag.portConflict || [];
          window._ieImportDiag.portConflict.push({
            cid: cid,
            odp_id: odpId,
            nomor_port: nomor,
            owner_cid: ownerCid
          });

          return Promise.resolve();
        }

        /* Port kosong ATAU sudah milik CID yang sama (re-import aman) → update */
        return _reclaimOldPort().then(function(){
          return sb.from('odp_ports')
            .update({ status: ST_TERPAKAI, cid_pelanggan: cid, pel_id: pelId })
            .eq('id', existing.id)
            .then(function(r2){
              if(r2 && r2.error){
                _logAssignFailed(cid, r2.error.message);
              }
            });
        });

      } else {
        /* Port belum ada di odp_ports → insert baru */
        return _reclaimOldPort().then(function(){
          return sb.from('odp_ports').insert([{
            odp_id: odpId,
            nomor_port: parseInt(nomor)||nomor,
            status: ST_TERPAKAI,
            cid_pelanggan: cid,
            pel_id: pelId
          }]).then(function(r2){
            if(r2 && r2.error){
              _logAssignFailed(cid, r2.error.message);
            }
          });
        });
      }
    })
    .catch(function(e){
      _logAssignFailed(cid, e.message || 'error tidak diketahui');
    });
}

function _logAssignFailed(cid, msg){
  window._ieImportDiag = window._ieImportDiag || {};
  window._ieImportDiag.assignFailed = window._ieImportDiag.assignFailed || [];
  window._ieImportDiag.assignFailed.push({ cid: cid||'(tanpa cid)', err: msg });

}

/* ── Reset import ── */
function ieResetImport(){
  window._ieLastErr = null;
  var dp = document.getElementById('ie-debug-panel');
  if(dp){ dp.style.display='none'; dp._shown=false; dp.innerHTML=''; }
  _ieParsedData = [];
  var inp = document.getElementById('ie-file-input'); if(inp) inp.value='';
  ieResetPreview();
  document.getElementById('ie-result-wrap').style.display='none';
}
function ieResetPreview(){
  var wrap = document.getElementById('ie-preview-wrap'); if(wrap) wrap.style.display='none';
  var res  = document.getElementById('ie-result-wrap');  if(res)  res.style.display='none';
}

/* ── Do Import → Supabase upsert ── */
function ieDoImport(){
  var sb = getSB();
  if(!sb){ toast('Database tidak terhubung','err'); return; }
  if(!_ieParsedData.length){ toast('Tidak ada data untuk diimpor','err'); return; }

  var validRows = _ieParsedData.filter(function(r){ return r._valid; });
  if(!validRows.length){ toast('Semua baris memiliki error','err'); return; }

  var btn = document.getElementById('ie-import-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span> Menyimpan…'; }

  /* ── Pre-load referensi FK jika belum ada di cache ── */
  var _needArea = (_ieCurrentModul==='odcs'||_ieCurrentModul==='odps'||_ieCurrentModul==='olts');
  var _needOlt  = (_ieCurrentModul==='odcs');
  var _needOdc  = (_ieCurrentModul==='odps');

  /* Force reload area jika cache tidak punya field kode (load dari halaman lain bisa kurang kolom) */
  var _areaNeedReload = _needArea && (_areaData.length===0 || !_areaData[0] || _areaData[0].kode===undefined);
  var _pArea = _areaNeedReload
    ? sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; })
    : Promise.resolve();

  var _pOlt = (_needOlt && _oltData.length===0)
    ? sb.from('olts').select('id,kode,nama,area_id').order('kode').then(function(r){
        if(!r.error){ _oltData=r.data||[]; }
      })
    : Promise.resolve();

  var _pOdc = (_needOdc && _odcData.length===0)
    ? sb.from('odcs').select('id,kode,nama,area_id').order('kode').then(function(r){ if(!r.error) _odcData=r.data||[]; })
    : Promise.resolve();

  /* [FIX] Pre-load ODP & Area — SELALU reload saat import pelanggan agar kode tersedia */
  var _needOdp = (_ieCurrentModul==='pelanggan');
  var _pOdp = _needOdp
    ? sb.from('odps').select('id,kode,nama,area_id,odc_id').order('kode').then(function(r){
        if(!r.error){ window._odpData=r.data||[]; console.log('[Import] ODP loaded:', window._odpData.length); }
      })
    : Promise.resolve();

  var _pAreaPel = _needOdp
    ? sb.from('areas').select('id,nama,kode').order('nama').then(function(r){
        if(!r.error){ _areaData=r.data||[]; console.log('[Import] Area loaded:', _areaData.length); }
      })
    : Promise.resolve();

  Promise.all([_pArea, _pOlt, _pOdc, _pOdp, _pAreaPel]).then(function(){
    /* Debug: tampilkan berapa OLT/Area yg berhasil di-load */
    if(_needOlt && _oltData.length===0){
      toast('⚠️ Data OLT tidak ditemukan di cache — pastikan tabel olts tidak kosong','err');
    }
    _ieDoImportCore(sb, btn, validRows);
  }).catch(function(e){
    toast('Gagal memuat data referensi: '+(e.message||'coba lagi'),'err');
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-database-import"></i> Simpan ke Database'; }
  });
}

function _ieDoImportCore(sb, btn, validRows){
  /* [DIAG] Reset diagnostik dari run sebelumnya */
  window._ieImportDiag = {odpNotFound: [], noPort: []};

  /* [FIX DATA HILANG] Untuk modul pelanggan: muat dulu CID yang sudah ada di DB.
     Tanpa ini, kolom yang kosong di CSV (mis. sn_ont, odp_kode tidak diisi untuk
     sebagian baris) akan dikirim sebagai null saat upsert dan MENIMPA data yang
     sudah terisi manual di database untuk pelanggan dengan CID yang sama.
     Solusi: field kosong di CSV untuk baris yang CID-nya SUDAH ADA tidak ikut
     dikirim ke payload sama sekali (preserve nilai lama). Baris baru (CID belum
     ada) tetap boleh null karena memang belum punya nilai sebelumnya. */
  var _existingCidSet = {};
  var _needExistingCheck = (_ieCurrentModul === 'pelanggan');
  var _pExistingCid = _needExistingCheck
    ? sb.from('pelanggan').select('cid').then(function(r){
        (r.data||[]).forEach(function(row){ if(row.cid) _existingCidSet[row.cid] = true; });
      }).catch(function(e){ console.warn('[Import] Gagal load CID existing:', e.message); })
    : Promise.resolve();

  return _pExistingCid.then(function(){
    _ieDoImportCoreRun(sb, btn, validRows, _existingCidSet);
  });
}

function _ieDoImportCoreRun(sb, btn, validRows, _existingCidSet){
  _existingCidSet = _existingCidSet || {};

  /* ── Ambil allowed cols dari schema (satu sumber kebenaran) ── */
  var _schema    = _ieSchemas[_ieCurrentModul];
  var _allowed   = _schema ? _schema.cols : [];       /* kolom DB asli */
  var _resolveCols = _schema ? (_schema.resolve_cols||[]) : []; /* kolom CSV helper (tidak masuk DB) */
  /* Konversi angka — hanya kolom yang memang ada di schema modul ini */
  var _allNumFields = {
    areas:     ['target_homes'],
    olts:      ['jumlah_pon','pon_used'],
    odcs:      ['jumlah_port'],
    odps:      ['jumlah_port'],
    pelanggan: [],
    material_items: ['stok','min_stok','harga_satuan'],
    tickets:   []
  };
  var _numFields = _allNumFields[_ieCurrentModul] || [];
  var _conflictKey = {
    areas:'kode', olts:'kode', odcs:'kode', odps:'kode',
    pelanggan:'cid', material_items:'kode', tickets:'no_tiket'
  }[_ieCurrentModul] || 'kode';

  /* Bangun payload: hanya kolom DB (_allowed), resolve FK dari resolve_cols */
  var _dedupMap   = {};
  var _dupKodes   = {};
  validRows.forEach(function(r){
    var obj = {};
    var _isUpdateRow = (_ieCurrentModul === 'pelanggan') && r.cid && _existingCidSet[r.cid.trim()];
    /* Hanya ambil kolom DB yang ada di _allowed.
       [FIX DATA HILANG] Jika ini baris UPDATE (cid sudah ada di DB) dan nilai
       CSV untuk kolom ini kosong, JANGAN masukkan ke obj sama sekali — biarkan
       Supabase upsert mempertahankan nilai lama, bukan menimpanya jadi null. */
    _allowed.forEach(function(k){
      var v = (r[k]||'').trim() || null;
      if(v === null && _isUpdateRow){
        return; /* skip — pertahankan nilai lama di DB, jangan kirim null */
      }
      obj[k] = v;
    });
    _numFields.forEach(function(f){ if(obj[f]!==undefined && obj[f]!==null) obj[f]=Number(obj[f])||0; });
    /* Fix nik: Excel export sebagai scientific notation (3.27E+15) */
    if(obj.nik && (obj.nik.indexOf('E+')>=0 || obj.nik.indexOf('e+')>=0)){
      try{ obj.nik = String(Math.round(parseFloat(obj.nik))); }catch(e){}
    }
    /* Baca resolve_cols dari CSV ke obj sementara (akan dihapus setelah resolve) */
    _resolveCols.forEach(function(k){ obj[k] = (r[k]||'').trim() || null; });

    /* ── Resolve area_kode → area_id (juga handle area_coverage sebagai alias) ── */
    var _areaKodeVal = obj.area_kode || obj.area_coverage || null;
    if(_areaKodeVal !== null){
      var _areaVal = (_areaKodeVal||'').trim().toLowerCase();
      var _ar = (_areaData||[]).find(function(a){
        return (a.kode||'').trim().toLowerCase()===_areaVal
            || (a.nama||'').trim().toLowerCase()===_areaVal;
      });
      if(_ar) obj.area_id = _ar.id;
      delete obj.area_kode;
      delete obj.area_coverage;
    }
    /* ── Resolve area_id: jika berisi nama/kode (bukan UUID), resolve ke UUID ── */
    if(obj.area_id){
      var _isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(obj.area_id.trim());
      if(!_isUuid){
        var _areaIdVal = obj.area_id.trim().toLowerCase();
        var _arById = (_areaData||[]).find(function(a){
          return (a.kode||'').trim().toLowerCase()===_areaIdVal
              || (a.nama||'').trim().toLowerCase()===_areaIdVal;
        });
        if(_arById) obj.area_id = _arById.id;
        else obj.area_id = null; /* tidak ditemukan, kosongkan agar tidak error UUID */
      }
    }
    /* ── Resolve olt_kode → olt_id (untuk ODC) ── */
    if(obj.olt_kode !== undefined){
      var _oltKodeCsv = (obj.olt_kode||'').trim().toLowerCase();
      var _olt = (_oltData||[]).find(function(o){
        return (o.kode||'').trim().toLowerCase()===_oltKodeCsv
            || (o.nama||'').trim().toLowerCase()===_oltKodeCsv;
      });
      if(_olt){ obj.olt_id = _olt.id; }
      else {
        /* Fallback: coba partial match kode */
        _olt = (_oltData||[]).find(function(o){
          return (o.kode||'').toLowerCase().indexOf(_oltKodeCsv)>=0
              || _oltKodeCsv.indexOf((o.kode||'').toLowerCase())>=0;
        });
        if(_olt) obj.olt_id = _olt.id;
        else {
          /* Log kode yang tidak ditemukan untuk debugging */
          console.warn('[Import ODC] olt_kode tidak ditemukan di cache:', obj.olt_kode, '| Total OLT di cache:', (_oltData||[]).length, '| Sample kode:', (_oltData||[]).slice(0,3).map(function(x){return x.kode;}));
        }
      }
      delete obj.olt_kode;
    }
    /* ── Resolve odc_kode → odc_id (untuk ODP) ── */
    if(obj.odc_kode !== undefined){
      var _odcVal = (obj.odc_kode||'').trim().toLowerCase();
      var _odc = (_odcData||[]).find(function(o){
        return (o.kode||'').trim().toLowerCase()===_odcVal
            || (o.nama||'').trim().toLowerCase()===_odcVal;
      });
      if(_odc) obj.odc_id = _odc.id;
      delete obj.odc_kode;
    }
    /* ── [FIX v23] Resolve odp_kode → odp_id (untuk Pelanggan) ── */
    if(_ieCurrentModul === 'pelanggan'){
      /* Normalisasi jenis_pelanggan — sesuai CHECK constraint DB */
      var _JP_MAP = {
        'reguler':'Reguler','reg':'Reguler','regular':'Reguler',
        'rumahan':'Reguler','personal':'Reguler','perorangan':'Reguler',
        'home':'Reguler','residensial':'Reguler',
        'Reguler':'Reguler','REGULER':'Reguler',
        'umkm':'UMKM','usaha':'UMKM','bisnis kecil':'UMKM','ukm':'UMKM',
        'mikro':'UMKM','UMKM':'UMKM',
        'corporate':'Corporate','corp':'Corporate','korporat':'Corporate',
        'perusahaan':'Corporate','bisnis':'Corporate','business':'Corporate',
        'enterprise':'Corporate','kantor':'Corporate','Corporate':'Corporate','CORPORATE':'Corporate',
        'fasum':'FASUM','fasilitas umum':'FASUM','FASUM':'FASUM',
        'odp_tempel':'ODP_TEMPEL','odp tempel':'ODP_TEMPEL','tempel odp':'ODP_TEMPEL','ODP_TEMPEL':'ODP_TEMPEL',
        'odc_tempel':'ODC_TEMPEL','odc tempel':'ODC_TEMPEL','tempel odc':'ODC_TEMPEL','ODC_TEMPEL':'ODC_TEMPEL'
      };
      var _jpRaw = (obj.jenis_pelanggan||'').trim();
      var _jpNorm = _JP_MAP[_jpRaw] || _JP_MAP[_jpRaw.toLowerCase()];
      if(_jpNorm){
        obj.jenis_pelanggan = _jpNorm;
      } else if(['Reguler','UMKM','Corporate','FASUM','ODP_TEMPEL','ODC_TEMPEL'].indexOf(_jpRaw) >= 0){
        obj.jenis_pelanggan = _jpRaw;
      } else if(!_isUpdateRow){
        /* [FIX DATA HILANG] Default 'Reguler' hanya untuk baris BARU.
           Baris update dengan jenis_pelanggan kosong di CSV: jangan kirim
           field ini sama sekali — biarkan nilai lama di DB tetap utuh. */
        obj.jenis_pelanggan = 'Reguler';
      } else {
        delete obj.jenis_pelanggan;
      }
      /* Normalisasi status pelanggan agar lolos CHECK constraint DB */
      var _ST_MAP = {
        'active':'aktif','aktif':'aktif','on':'aktif','up':'aktif','ak':'aktif',
        'suspend':'isolir','isolir':'isolir','suspended':'isolir','hold':'isolir',
        'terminated':'cabut','cabut':'cabut','off':'cabut','cancel':'cabut','berhenti':'cabut',
        'proses':'proses','process':'proses','pending':'proses','pasang':'proses'
      };
      var _stRaw = (obj.status||'').trim();
      var _stNorm = _ST_MAP[_stRaw.toLowerCase()];
      if(_stNorm){
        obj.status = _stNorm;
      } else if(['aktif','isolir','cabut','proses'].indexOf(_stRaw) < 0){
        if(!_isUpdateRow){
          /* [FIX DATA HILANG] Default 'proses' hanya untuk baris BARU */
          obj.status = 'proses';
        } else {
          delete obj.status;
        }
      }

      /* Simpan nomor_port untuk dipakai post-insert (assign ke odp_ports) */
      var _nomorPort = (obj.nomor_port||'').toString().trim();
      /* nomor_port tetap di obj — kolom ini ada di tabel pelanggan */

      /* Resolve odp_kode → odp_id */
      if(obj.odp_kode !== undefined){
        var _odpVal = (obj.odp_kode||'').trim().toLowerCase();
        var _odpFound = (_odpData && _odpData.length)
          ? _odpData.find(function(o){ return (o.kode||'').trim().toLowerCase()===_odpVal || (o.nama||'').trim().toLowerCase()===_odpVal; })
          : null;
        if(_odpFound){
          obj.odp_id = _odpFound.id;
          /* Simpan info port ke variabel TERPISAH — BUKAN di obj (tidak boleh masuk ke DB) */
          obj.__portMeta = { odpId: _odpFound.id, nomorPort: _nomorPort, areaId: _odpFound.area_id };
          if(!obj.area_id && _odpFound.area_id) obj.area_id = _odpFound.area_id;
          /* [DIAG] log ringkas jika nomor_port kosong walau ODP berhasil resolve —
             ini akan membuat __portMeta tidak menghasilkan assign port nantinya */
          if(!_nomorPort){
            window._ieImportDiag = window._ieImportDiag || {noPort:[]};
            window._ieImportDiag.noPort.push(obj.cid || _odpVal);
          }
        } else {
          /* [DIAG] ODP tidak ketemu di cache _odpData — catat utk ringkasan akhir,
             bukan cuma console.warn yang mudah terlewat */
          window._ieImportDiag = window._ieImportDiag || {odpNotFound:[]};
          window._ieImportDiag.odpNotFound = window._ieImportDiag.odpNotFound || [];
          window._ieImportDiag.odpNotFound.push({cid: obj.cid||'(tanpa cid)', odp_kode: (obj.odp_kode||'').trim()});
        }
        delete obj.odp_kode;
      }
      /* Resolve odp_id: jika berisi kode/nama (bukan UUID), resolve ke UUID */
      if(obj.odp_id){
        var _isOdpUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(obj.odp_id.trim());
        if(!_isOdpUuid){
          var _odpIdVal = obj.odp_id.trim().toLowerCase();
          var _odpByKode = (_odpData && _odpData.length)
            ? _odpData.find(function(o){ return (o.kode||'').trim().toLowerCase()===_odpIdVal || (o.nama||'').trim().toLowerCase()===_odpIdVal; })
            : null;
          if(_odpByKode){
            obj.odp_id = _odpByKode.id;
            obj.__portMeta = { odpId: _odpByKode.id, nomorPort: _nomorPort, areaId: _odpByKode.area_id };
            if(!obj.area_id && _odpByKode.area_id) obj.area_id = _odpByKode.area_id;
          } else {
            console.warn('[Import] odp_id tidak ditemukan di _odpData:', obj.odp_id, '| Sample kode ODP:', (window._odpData||[]).slice(0,3).map(function(x){return x.kode;}));
            window._ieImportDiag = window._ieImportDiag || {odpNotFound:[]};
            window._ieImportDiag.odpNotFound = window._ieImportDiag.odpNotFound || [];
            window._ieImportDiag.odpNotFound.push({cid: obj.cid||'(tanpa cid)', odp_kode: obj.odp_id});
            obj.odp_id = null; /* tidak ditemukan, kosongkan agar tidak error UUID */
          }
        }
      }
    }

    /* Hapus semua resolve_cols dari obj — tidak boleh masuk ke payload DB */
    _resolveCols.forEach(function(k){ delete obj[k]; });

    var key = obj[_conflictKey];
    if(!key) return;
    if(_dedupMap[key]){
      /* Sudah ada — catat sebagai duplikat */
      _dupKodes[key] = (_dupKodes[key]||1) + 1;
    }
    _dedupMap[key] = obj;
  });
  var _uniquePayload = Object.keys(_dedupMap).map(function(k){ return _dedupMap[k]; });
  var _dupList = Object.keys(_dupKodes);

  /* Tampilkan peringatan duplikat di CSV sebelum import */
  if(_dupList.length){
    var dupWarn = document.getElementById('ie-dup-warn');
    if(!dupWarn){
      dupWarn = document.createElement('div');
      dupWarn.id = 'ie-dup-warn';
      dupWarn.style.cssText = 'background:var(--yg);border:1px solid rgba(217,119,6,.3);border-radius:var(--rs);padding:10px 12px;margin-bottom:10px;font-size:11px;color:var(--yellow);line-height:1.7';
      var previewWrap = document.getElementById('ie-preview-wrap');
      if(previewWrap) previewWrap.insertBefore(dupWarn, previewWrap.firstChild);
    }
    dupWarn.innerHTML = '<strong><i class="ti ti-alert-triangle"></i> '+_dupList.length+' kode duplikat di CSV — hanya baris terakhir yang diambil:</strong><br>'+
      _dupList.slice(0,10).map(function(k){ return '• <b>'+k+'</b> muncul '+_dupKodes[k]+'x'; }).join('<br>')+
      (_dupList.length>10 ? '<br>... dan '+(_dupList.length-10)+' lainnya' : '')+
      '<br><small style="opacity:.8">Pastikan setiap kode unik di CSV. Kode duplikat kemungkinan adalah ODC di area berbeda yang perlu diberi kode berbeda.</small>';
  } else {
    var dupWarn = document.getElementById('ie-dup-warn');
    if(dupWarn) dupWarn.remove();
  }

  /* Debug: hitung berapa yg berhasil resolve FK */
  if(_ieCurrentModul==='odcs'){
    var _resolvedOlt = _uniquePayload.filter(function(r){ return !!r.olt_id; }).length;
    var _resolvedArea = _uniquePayload.filter(function(r){ return !!r.area_id; }).length;
    toast('Resolve: '+_resolvedArea+' area, '+_resolvedOlt+' OLT dari '+_uniquePayload.length+' ODC','ok');
    /* OPT: debug log removed */
  }

  /* Import per-baris agar bisa tracking berhasil/gagal per row */
  var _total   = _uniquePayload.length;
  var _ok      = [];
  var _fail    = [];
  var _done    = 0;

  function _checkDone(){
    _done++;
    if(_done < _total) return;
    /* Semua selesai */
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-database-import"></i> Simpan ke Database'; }
    if(_ieCurrentModul==='areas')     _areaLoaded=false;
    if(_ieCurrentModul==='olts')      _oltLoaded=false;
    if(_ieCurrentModul==='odcs')      _odcLoaded=false;
    if(_ieCurrentModul==='odps')      _odpLoaded=false;
    if(_ieCurrentModul==='pelanggan') _pelLoaded=false;
    if(_ieCurrentModul==='material_items') _invMatiData=[];
    _ieAddLog('Import', _ieSchemas[_ieCurrentModul].label, _ok.length+' berhasil, '+_fail.length+' gagal');
    ieShowDetailResult(_total, _ok, _fail, _conflictKey, _dupList||[]);
    /* Tampilkan panel Update Data Teknis jika modul pelanggan */
    if(_ieCurrentModul === 'pelanggan'){
      var _patchWrap = document.getElementById('ie-patch-teknis-wrap');
      if(_patchWrap) _patchWrap.style.display = 'block';
    }
  }

  /* [T5.2] BATCH EXECUTION — Import chunks (500 rows/chunk) */
  var _chunkSize = 500;
  var _chunks = [];
  for(var i=0; i<_uniquePayload.length; i+=_chunkSize){
    _chunks.push(_uniquePayload.slice(i, i+_chunkSize));
  }

  var _ok = [];
  var _fail = [];
  var _allPortOps = [];
  var _chunkIndex = 0;

  function _processNextChunk(){
    if(_chunkIndex >= _chunks.length){
      if(_allPortOps.length){
        _batchAssignPorts(sb, _allPortOps).then(function(){
          _finishImport();
        }).catch(function(portErr){

          _finishImport();
        });
      } else {
        _finishImport();
      }
      return;
    }

    var chunk = _chunks[_chunkIndex];
    _chunkIndex++;

    _executeBatchChunk(sb, _ieCurrentModul, chunk, _conflictKey)
      .then(function(chunkResult){
        _ok = _ok.concat(chunkResult.ok);
        _fail = _fail.concat(chunkResult.fail);
        _allPortOps = _allPortOps.concat(chunkResult.portOps);
        _processNextChunk();
      })
      .catch(function(chunkErr){

        chunk.forEach(function(row){
          _fail.push({row: row, err: chunkErr.message || 'Chunk error'});
        });
        _processNextChunk();
      });
  }

  function _finishImport(){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-database-import"></i> Simpan ke Database'; }
    if(_ieCurrentModul==='areas')     _areaLoaded=false;
    if(_ieCurrentModul==='olts')      _oltLoaded=false;
    if(_ieCurrentModul==='odcs')      _odcLoaded=false;
    if(_ieCurrentModul==='odps')      _odpLoaded=false;
    if(_ieCurrentModul==='pelanggan') _pelLoaded=false;
    if(_ieCurrentModul==='material_items') _invMatiData=[];
    _ieAddLog('Import', _ieSchemas[_ieCurrentModul].label, _ok.length+' berhasil, '+_fail.length+' gagal');
    ieShowDetailResult(_total, _ok, _fail, _conflictKey, _dupList||[]);
    if(_ieCurrentModul === 'pelanggan'){
      var _patchWrap = document.getElementById('ie-patch-teknis-wrap');
      if(_patchWrap) _patchWrap.style.display = 'block';
      /* [DIAG] Tampilkan ringkasan ODP/Port yang gagal di-assign — biar tidak diam-diam hilang */
      _ieShowPortDiag();
    }
  }

  _total = _uniquePayload.length;
  _processNextChunk();
}

/* [DIAG] Tampilkan ringkasan baris pelanggan yang ODP/Port-nya gagal di-assign saat import.
   Tujuan: agar masalah "X terpakai tidak sesuai jumlah pelanggan" langsung kelihatan
   akar penyebabnya per-baris, bukan cuma diam-diam masuk console log yang jarang dibuka. */
function _ieShowPortDiag(){
  var diag = window._ieImportDiag || {};
  var notFound      = diag.odpNotFound    || [];
  var noPort        = diag.noPort         || [];
  var assignFailed  = diag.assignFailed   || [];
  var assignSkipped = diag.assignSkipped  || [];
  /* [P30-3] Kategori baru: port tabrakan dengan pelanggan lain — TIDAK ditimpa */
  var portConflict  = diag.portConflict   || [];

  var totalIssue = notFound.length + noPort.length + assignFailed.length + assignSkipped.length + portConflict.length;
  if(!totalIssue) return;

  var wrap = document.getElementById('ie-result-wrap') || document.body;
  var box = document.getElementById('ie-port-diag-box');
  if(!box){
    box = document.createElement('div');
    box.id = 'ie-port-diag-box';
    box.style.cssText = 'margin-top:12px;padding:12px 13px;border-radius:var(--r);background:rgba(217,119,6,.07);border:1px solid rgba(217,119,6,.25);font-size:11px;line-height:1.7;color:var(--yellow)';
    wrap.appendChild(box);
  }
  var html = '<div style="font-weight:800;margin-bottom:6px"><i class="ti ti-alert-triangle"></i> '+
    totalIssue+' pelanggan TIDAK ter-assign ke Port Management</div>';

  /* [P30-3] PORT CONFLICT — tampilkan paling atas karena perlu tindakan manual */
  if(portConflict.length){
    html += '<div style="margin-bottom:4px;padding:6px 8px;background:rgba(220,38,38,.08);border-radius:6px;border-left:3px solid var(--red)">'+
      '<b style="color:var(--red)">⚠ KONFLIK PORT — Tidak Ditimpa ('+portConflict.length+'):</b><br>'+
      '<span style="font-size:10px;opacity:.85">Port sudah dimiliki CID lain di database. Data pelanggan lama TIDAK diubah (aman).<br>'+
      'Periksa apakah ada data ganda (1 port untuk 2 pelanggan) atau salah input nomor port di CSV.</span>'+
    '</div>';
    html += portConflict.slice(0,20).map(function(x){
      return '• CID <b>'+_esc(x.cid)+'</b> → ODP '+_esc(x.odp_id)+' Port '+_esc(String(x.nomor_port))+
             ' sudah milik <b style="color:var(--red)">'+_esc(x.owner_cid)+'</b>';
    }).join('<br>');
    if(portConflict.length>20) html += '<br>... dan '+(portConflict.length-20)+' lainnya';
    html += '<br>';
  }

  if(notFound.length){
    html += '<div style="margin-bottom:4px"><b>Kode ODP di CSV tidak ditemukan di Master ODP ('+notFound.length+'):</b></div>';
    html += notFound.slice(0,15).map(function(x){
      return '• CID '+_esc(x.cid)+' — ODP "'+_esc(x.odp_kode)+'" tidak ada di database';
    }).join('<br>');
    if(notFound.length>15) html += '<br>... dan '+(notFound.length-15)+' lainnya';
  }
  if(noPort.length){
    html += '<div style="margin:8px 0 4px"><b>ODP ditemukan tapi nomor_port kosong di CSV ('+noPort.length+'):</b></div>';
    html += noPort.slice(0,15).map(function(c){ return '• '+_esc(c); }).join('<br>');
    if(noPort.length>15) html += '<br>... dan '+(noPort.length-15)+' lainnya';
  }
  if(assignFailed.length){
    html += '<div style="margin:8px 0 4px"><b>Gagal simpan ke Port Management saat proses akhir ('+assignFailed.length+'):</b></div>';
    html += assignFailed.slice(0,15).map(function(x){
      return '• CID '+_esc(x.cid)+' — '+_esc(x.err);
    }).join('<br>');
    if(assignFailed.length>15) html += '<br>... dan '+(assignFailed.length-15)+' lainnya';
  }
  if(assignSkipped.length){
    html += '<div style="margin:8px 0 4px"><b>Dilewati karena data ODP/Port tidak lengkap ('+assignSkipped.length+'):</b></div>';
    html += assignSkipped.slice(0,15).map(function(c){ return '• '+_esc(c); }).join('<br>');
    if(assignSkipped.length>15) html += '<br>... dan '+(assignSkipped.length-15)+' lainnya';
  }
  html += '<div style="margin-top:8px;opacity:.85">Perbaiki data di atas lalu import ulang hanya baris yang bermasalah.</div>';
  box.innerHTML = html;
  if(typeof toast==='function'){
    var conflictMsg = portConflict.length ? portConflict.length+' konflik port, ' : '';
    toast(conflictMsg+(totalIssue - portConflict.length)+' gagal assign ODP/Port — lihat detail di bawah','err');
  }
}

/* ── [FIX v23] Assign port di odp_ports setelah pelanggan berhasil di-insert ── */
function _ieAssignPort(sb, portMeta, cid){
  if(!sb || !portMeta || !portMeta.odpId || !portMeta.nomorPort) return;

  var odpId = portMeta.odpId;
  var nomor = parseInt(portMeta.nomorPort) || portMeta.nomorPort; /* cast ke int agar cocok dengan tipe kolom DB */
  cid = cid || '';

  /* Cari port yang sesuai di odp_ports: odp_id + nomor_port */
  sb.from('odp_ports')
    .select('id,status,cid_pelanggan')
    .eq('odp_id', odpId)
    .eq('nomor_port', nomor)
    .limit(1)
    .then(function(r){
      var existing = r.data && r.data[0];

      if(existing){
        /* Port sudah ada — update status ke terpakai + isi cid_pelanggan */
        return sb.from('odp_ports')
          .update({ status: PORT_STATUS.TERPAKAI || 'terpakai', cid_pelanggan: cid })
          .eq('id', existing.id);
      } else {
        /* Port belum ada di odp_ports — buat baru */
        return sb.from('odp_ports').insert([{
          odp_id       : odpId,
          nomor_port   : parseInt(nomor) || nomor,
          status       : PORT_STATUS.TERPAKAI || 'terpakai',
          cid_pelanggan: cid
        }]);
      }
    })
    .then(function(r2){
      if(r2 && r2.error){

      } else {
        /* Invalidate SOT agar Monitoring/Dashboard sinkron */
        if(window.SOT && typeof SOT.invalidate === 'function' ) SOT.invalidate('general');
      }
    })
    .catch(function(e){

    });
}

/* ── Patch Data Teknis: update ODP/SN/Port/MAC untuk pelanggan yg sudah ada di DB ── */
function iePatchTeknis(){
  var sb = getSB();
  if(!sb){ toast('Database tidak terhubung','err'); return; }
  if(!_ieParsedData || !_ieParsedData.length){ toast('Upload CSV terlebih dahulu','err'); return; }

  var resEl = document.getElementById('ie-patch-teknis-result');
  if(resEl) resEl.innerHTML = '<i class="ti ti-loader" style="animation:rot 1s linear infinite"></i> Memuat referensi ODP & Area…';

  /* Selalu reload ODP & Area agar kode tersedia */
  var pOdp   = sb.from('odps').select('id,kode,nama,area_id').order('kode').then(function(r){ if(!r.error) window._odpData=r.data||[]; });
  var pArea  = sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) window._areaData=r.data||[]; });

  Promise.all([pOdp, pArea]).then(function(){
    window._odpResolveWarnDone = false; /* reset flag debug */
    /* Debug: log jumlah ODP & Area yang ter-load + sample kode */
    var _odpSample = (window._odpData||[]).slice(0,3).map(function(o){return o.kode;});
    var _csvSample = (_ieParsedData||[]).slice(0,3).map(function(r){return r.odp_kode||r.odp_id||'—';});


    if((window._odpData||[]).length === 0){
      toast('⚠️ Data ODP tidak ditemukan — pastikan tabel odps tidak kosong','err');
    }
    var rows = _ieParsedData;
    var total = 0, ok = 0, fail = 0, skip = 0;

    var promises = rows.map(function(r){
      var cid       = (r.cid||'').trim();
      var odpRaw    = (r.odp_kode||r.odp_id||'').trim();
      var snOnt     = (r.sn_ont||'').trim() || null;
      var macOnt    = (r.mac_ont||'').trim() || null;
      var nomorPort = (r.nomor_port||'').toString().trim();
      var areaRaw   = (r.area_kode||r.area_id||'').trim();
      var kecamatan = (r.kecamatan||'').trim() || null;
      var kelurahan = (r.kelurahan||'').trim() || null;
      var rw        = (r.rw||'').trim() || null;
      var rt        = (r.rt||'').trim() || null;
      var teknisi   = (r.teknisi_pasang||'').trim() || null;
      var tipeRec   = (r.tipe_recurring||'').trim() || null;
      var hp        = (r.hp||'').trim() || null;
      /* nik: Excel sering export sebagai scientific notation (3.27E+15) — konversi ke integer string */
      var _nikRaw = (r.nik||'').toString().trim();
      var nik = null;
      if(_nikRaw){
        if(_nikRaw.indexOf('E+') >= 0 || _nikRaw.indexOf('e+') >= 0){
          try { nik = String(Math.round(parseFloat(_nikRaw))); } catch(e){ nik = _nikRaw; }
        } else {
          nik = _nikRaw;
        }
      }
      var alamat    = (r.alamat||'').trim() || null;

      if(!cid){ skip++; return Promise.resolve(); }

      /* Resolve ODP */
      var odpId = null, portMeta = null;
      if(odpRaw){
        var _isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(odpRaw);
        if(_isUuid){
          odpId = odpRaw;
        } else {
          /* Cari ODP: exact match (case-insensitive) */
          var _odpVal = odpRaw.trim().toLowerCase();
          var _found = (window._odpData||[]).find(function(o){
            return (o.kode||'').trim().toLowerCase()===_odpVal
                || (o.nama||'').trim().toLowerCase()===_odpVal;
          });
          if(_found){
            odpId = _found.id;
          } else {
            console.warn('[PatchTeknis] ODP tidak ditemukan:', odpRaw, '| Sample DB:', (window._odpData||[]).slice(0,3).map(function(o){return o.kode;}));
          }
        }
        if(odpId && nomorPort) portMeta = { odpId: odpId, nomorPort: nomorPort };
      }

      /* Resolve area */
      var areaId = null;
      if(areaRaw){
        var _isUuidA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(areaRaw);
        if(_isUuidA){
          areaId = areaRaw;
        } else {
          var _aVal = areaRaw.toLowerCase();
          var _aFound = (window._areaData||[]).find(function(a){
            return (a.kode||'').trim().toLowerCase()===_aVal || (a.nama||'').trim().toLowerCase()===_aVal;
          });
          if(_aFound) areaId = _aFound.id;
        }
      }

      /* Bangun payload update — semua kolom yang ada di CSV */
      var payload = {};
      if(odpId)     payload.odp_id        = odpId;
      if(nomorPort) payload.nomor_port     = parseInt(nomorPort)||nomorPort;
      if(snOnt)     payload.sn_ont        = snOnt;
      if(macOnt)    payload.mac_ont       = macOnt;
      if(areaId)    payload.area_id       = areaId;
      if(kecamatan) payload.kecamatan     = kecamatan;
      if(kelurahan) payload.kelurahan     = kelurahan;
      if(rw)        payload.rw            = rw;
      if(rt)        payload.rt            = rt;
      if(teknisi)   payload.teknisi_pasang= teknisi;
      if(tipeRec)   payload.tipe_recurring= tipeRec;
      if(hp)        payload.hp            = hp;
      if(nik)       payload.nik           = nik;
      if(alamat)    payload.alamat        = alamat;

      if(!Object.keys(payload).length){ skip++; return Promise.resolve(); }

      total++;
      return sb.from('pelanggan').update(payload).eq('cid', cid)
        .then(function(res){
          if(res.error){ fail++; console.warn('[PatchTeknis] Gagal '+cid+':', res.error.message); }
          else {
            ok++;
            /* Assign port jika ada portMeta */
            if(portMeta) _ieAssignPort(sb, portMeta, cid);
          }
        })
        .catch(function(e){ fail++; console.warn('[PatchTeknis] Error '+cid+':', e.message); });
    });

    Promise.all(promises).then(function(){
      var msg = '<b style="color:var(--green)"><i class="ti ti-circle-check"></i> '+ok+' pelanggan berhasil diupdate</b>';
      if(fail)  msg += ' &nbsp;|&nbsp; <span style="color:var(--red)">'+fail+' gagal</span>';
      if(skip)  msg += ' &nbsp;|&nbsp; <span style="color:var(--text3)">'+skip+' dilewati (tidak ada data teknis)</span>';
      if(resEl) resEl.innerHTML = msg;
      /* Invalidate SOT cache */
      if(window.SOT && typeof SOT.invalidate === 'function' ) SOT.invalidate('general');
      toast('Update data teknis selesai: '+ok+' berhasil','ok');
    });
  }).catch(function(e){
    if(resEl) resEl.innerHTML = '<span style="color:var(--red)">Gagal memuat referensi: '+(e.message||'coba lagi')+'</span>';
  });
}
