
'use strict';

if(typeof _fdbPeriode === 'undefined'){
  window._fdbPeriode = function(){ return {from:'', to:''}; };
}

/* ═══════════════════════════════════════════════════════
   ICRM_JJC — 100% ONLINE · No Local Cache · Supabase SSOT
   ✅ Semua data dari Supabase (realtime subscription)
   ❌ Tidak ada localStorage / sessionStorage / SW cache
   ❌ Tidak ada optimistic UI / stale TTL
   ═══════════════════════════════════════════════════════ */
var SB = {
  url: 'https://foambnxappwgchnjkojr.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYW1ibnhhcHB3Z2Nobmprb2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjYyMTEsImV4cCI6MjA5NjE0MjIxMX0.Rpqles8_DsDZqNpwCjJWx-ofNWlN2jb_v6u4ZCe6r9k'
};

var _sbc = null;
function getSB(){
  if(_sbc) return _sbc;
  try{ if(typeof supabase!=='undefined'&&supabase.createClient) _sbc=supabase.createClient(SB.url,SB.key); }catch(e){}
  return _sbc;
}

function _debounce(fn, delay){
  var timer = null;
  return function(){
    var args = arguments, ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function(){ fn.apply(ctx, args); }, delay || 300);
  };
}

function _throttle(fn, limit){
  var last = 0;
  return function(){
    var now = Date.now();
    if(now - last >= (limit||200)){ last = now; fn.apply(this, arguments); }
  };
}
var _dWilSearch   = null;
var _dOltSearch   = null;
var _dOdcSearch   = null;
var _dOdpSearch   = null;
var _dPortSearch  = null;
var _dPelSearch   = null;

var _dAreaSearch  = null;
var _dFasSearch   = null;
var _dTicketSearch = null;
var _dInvMasterSearch = null;

var _dMonOltSearch = null;
var _dMonOdcSearch = null;
var _dMonOdpSearch = null;
var _dMonPortSearch = null;
var _dMntOdpSearch = null;
var _dMntOdcSearch = null;
var _dMntPelSearch = null;

function _initDebounceWrappers(){
  if(typeof wilSearch  === 'function') _dWilSearch  = _debounce(function(v){ wilSearch(v); }, 280);
  if(typeof oltSearch  === 'function') _dOltSearch  = _debounce(function(v){ oltSearch(v); }, 280);
  if(typeof odcSearch  === 'function') _dOdcSearch  = _debounce(function(v){ odcSearch(v); }, 280);
  if(typeof odpSearch  === 'function') _dOdpSearch  = _debounce(function(v){ odpSearch(v); }, 280);
  if(typeof portSearch === 'function') _dPortSearch = _debounce(function(v){ portSearch(v); }, 280);
  if(typeof pelSearch  === 'function') _dPelSearch  = _debounce(function(v){ pelSearch(v); }, 280);

  if(typeof areaSearch === 'function') _dAreaSearch = _debounce(function(v){ areaSearch(v); }, 200);
  if(typeof fasSearch === 'function') _dFasSearch = _debounce(function(v){ fasSearch(v); }, 200);
  if(typeof invMasterSearch === 'function') _dInvMasterSearch = _debounce(function(v){ invMasterSearch(v); }, 200);

  if(typeof monOltSearch === 'function') _dMonOltSearch = _debounce(function(v){ monOltSearch(v); }, 150);
  if(typeof monOdcSearch === 'function') _dMonOdcSearch = _debounce(function(v){ monOdcSearch(v); }, 150);
  if(typeof monOdpSearch === 'function') _dMonOdpSearch = _debounce(function(v){ monOdpSearch(v); }, 150);
  if(typeof monPortSearch === 'function') _dMonPortSearch = _debounce(function(v){ monPortSearch(v); }, 150);

  if(typeof mntOdpSearch === 'function') _dMntOdpSearch = _debounce(function(v){ mntOdpSearch(v); }, 200);
  if(typeof mntOdcSearch === 'function') _dMntOdcSearch = _debounce(function(v){ mntOdcSearch(v); }, 200);
  if(typeof mntPelSearch === 'function') _dMntPelSearch = _debounce(function(v){ mntPelSearch(v); }, 200);
}

function wilSearchD(v){  if(_dWilSearch)  _dWilSearch(v);  else if(typeof wilSearch==='function')  wilSearch(v);  }
function oltSearchD(v){  if(_dOltSearch)  _dOltSearch(v);  else if(typeof oltSearch==='function')  oltSearch(v);  }
function odcSearchD(v){  if(_dOdcSearch)  _dOdcSearch(v);  else if(typeof odcSearch==='function')  odcSearch(v);  }
function odpSearchD(v){  if(_dOdpSearch)  _dOdpSearch(v);  else if(typeof odpSearch==='function')  odpSearch(v);  }
function portSearchD(v){ if(_dPortSearch) _dPortSearch(v); else if(typeof portSearch==='function') portSearch(v); }
function pelSearchD(v){  if(_dPelSearch)  _dPelSearch(v);  else if(typeof pelSearch==='function')  pelSearch(v);  }

function areaSearchD(v){ if(_dAreaSearch) _dAreaSearch(v); else if(typeof areaSearch==='function') areaSearch(v); }
function fasSearchD(v){  if(_dFasSearch)  _dFasSearch(v);  else if(typeof fasSearch==='function')  fasSearch(v);  }
function invMasterSearchD(v){ if(_dInvMasterSearch) _dInvMasterSearch(v); else if(typeof invMasterSearch==='function') invMasterSearch(v); }

function monOltSearchD(v){ if(_dMonOltSearch) _dMonOltSearch(v); else if(typeof monOltSearch==='function') monOltSearch(v); }
function monOdcSearchD(v){ if(_dMonOdcSearch) _dMonOdcSearch(v); else if(typeof monOdcSearch==='function') monOdcSearch(v); }
function monOdpSearchD(v){ if(_dMonOdpSearch) _dMonOdpSearch(v); else if(typeof monOdpSearch==='function') monOdpSearch(v); }
function monPortSearchD(v){ if(_dMonPortSearch) _dMonPortSearch(v); else if(typeof monPortSearch==='function') monPortSearch(v); }

function mntOdpSearchD(v){ if(_dMntOdpSearch) _dMntOdpSearch(v); else if(typeof mntOdpSearch==='function') mntOdpSearch(v); }
function mntOdcSearchD(v){ if(_dMntOdcSearch) _dMntOdcSearch(v); else if(typeof mntOdcSearch==='function') mntOdcSearch(v); }
function mntPelSearchD(v){ if(_dMntPelSearch) _dMntPelSearch(v); else if(typeof mntPelSearch==='function') mntPelSearch(v); }

var _navDispatch = (function(){
  var _handlers = [];
  return {
    register: function(key, fn){ _handlers.push({key:key, fn:fn}); },
    run: function(key){
      for(var i=0;i<_handlers.length;i++){
        if(_handlers[i].key === key){
          try{ _handlers[i].fn(); }catch(e){ console.warn('[navDispatch]',key,e); }
        }
      }
    }
  };
})();

function sbStatus(s){
  var live=document.getElementById('sb-live');
  var pill=document.getElementById('net-pill');
  var nlbl=document.getElementById('net-lbl');
  var isOk = s==='ok';
  if(live){ live.style.background=isOk?'var(--green)':s==='err'?'var(--red)':'var(--yellow)'; live.className='sb-live'+(isOk?' ok':''); }
  if(pill) pill.className='net-pill '+(isOk?'on':'off');
  if(nlbl) nlbl.textContent=isOk?'LIVE':'OFFLINE';
}

(function _boot(){
  function _ping(){
    var sb=getSB();
    if(!sb){ sbStatus('off'); return; }
    sbStatus('load');
    sb.from('app_users').select('id',{count:'exact',head:true})
      .then(function(r){ sbStatus(r.error?'err':'ok'); })
      .catch(function(){ sbStatus('err'); });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){ setTimeout(_ping,500); });
  } else { setTimeout(_ping,500); }

  setTimeout(loadUsers, 700);
})();

var CU = null;
var CR = null;
var _users = [];

var ROLES = {
  super_admin  : { label:'Super Admin',   short:'SA', color:'#dc2626', needsArea:false, isGlobal:true,  desc:'Akses penuh seluruh sistem.' },
  owner        : { label:'Owner',         short:'OW', color:'#7c3aed', needsArea:false, isGlobal:true,  desc:'Read-only semua area. Lihat Dashboard, Finance, Monitoring, KPI.' },
  area_manager : { label:'Area Manager',  short:'AM', color:'#0d9488', needsArea:true,  isGlobal:false, desc:'Kelola 1 Area OLT: Sales, Teknisi, ODC, ODP, Port, Pelanggan, Tiket.' },
  finance      : { label:'Finance',       short:'FN', color:'#059669', needsArea:false, isGlobal:true,  desc:'Akses Finance global atau per-area.' },
  sales        : { label:'Sales',         short:'SL', color:'#f97316', needsArea:true,  isGlobal:false, desc:'Input & edit pelanggan area. Lihat ODP & port area.' },
  teknisi      : { label:'Teknisi',       short:'TK', color:'#0891b2', needsArea:true,  isGlobal:false, desc:'ODC, ODP, Port, Maintenance, Dismantle, Tiket seluruh area kerja.' },
  viewer       : { label:'Viewer',        short:'VW', color:'#6b7280', needsArea:true,  isGlobal:false, desc:'Read-only. Tidak bisa ubah data.' },

};

function normalizeRole(role) {
  if (role === 'area_manager') return 'area_manager';
  return role || 'viewer';
}

var _ROLES_GLOBAL = ['super_admin','owner','finance'];

function _isGlobalRole() {
  var r = normalizeRole(CR);
  return !r || _ROLES_GLOBAL.indexOf(r) >= 0;
}

function _isSuperAdmin() {
  return CR === 'super_admin';
}

function _getUserAreaScope() {
  if (!CU) return null;
  return { area_coverage_id: CU.area_coverage_id || CU.area_id || null };
}

function _getAreaScopeLabel(){
  if(_isGlobalRole()) return 'Semua Area';
  var sc = _getUserAreaScope();
  if(!sc || !sc.area_coverage_id) return 'Belum ditentukan';
  if(typeof _areaData !== 'undefined'){
    var a = _areaData.find(function(x){ return x.id===sc.area_coverage_id; });
    if(a) return a.nama || a.kode || 'Area';
  }
  return 'Area';
}

function _applyAreaFilter(q, areaField){
  if(_isGlobalRole()) return q;
  var sc = _getUserAreaScope();
  if(!sc || !sc.area_coverage_id) return q;
  return q.eq(areaField || 'area_id', sc.area_coverage_id);
}

function _filterByAreaScope(arr, opts){
  if(_isGlobalRole()) return arr;
  var sc = _getUserAreaScope();
  if(!sc || !sc.area_coverage_id) return [];
  var aField = (opts && opts.areaField) || 'area_id';
  return arr.filter(function(item){
    var v = item[aField] || item['area_coverage_id'] || item['area_id'];
    return v === sc.area_coverage_id;
  });
}

function _renderAreaBadge(){
  var badge = document.getElementById('area-scope-badge');
  if(!badge) return;
  if(_isGlobalRole()){
    badge.style.display = 'none';
    return;
  }
  var label = _getAreaScopeLabel();
  badge.style.display = 'flex';
  badge.innerHTML = '<i class="ti ti-map-pin" style="font-size:12px"></i> ' + _esc(label);
}

var _pelIncompleteData = [];
var _pelIncompleteRoles = ['teknisi','area_manager'];

function _pelIncompleteFields(p){
  var missing = [];
  if(!p.odp_id)        missing.push('ODP');
  if(!p.nomor_port)    missing.push('No. Port');
  if(!p.paket)         missing.push('Paket');
  if(!p.sn_ont)        missing.push('SN ONT');
  if(!p.teknisi_pasang)missing.push('Teknisi Pasang');
  return missing;
}

function pelIncompleteCheck(){
  var bell = document.getElementById('pel-incomplete-bell');
  if(!bell) return;
  var r = normalizeRole(CR);
  if(_pelIncompleteRoles.indexOf(r) < 0){
    bell.style.display = 'none';
    return;
  }
  var sb = getSB();
  if(!sb) return;
  var sc = _getUserAreaScope();
  if(!sc || !sc.area_coverage_id){
    bell.style.display = 'none';
    return;
  }
  bell.style.display = 'flex';
  sb.from('pelanggan')
    .select('id,cid,nama,odp_id,nomor_port,paket,sn_ont,teknisi_pasang,status,area_id,alamat,created_at')
    .eq('area_id', sc.area_coverage_id)
    .in('status', ['aktif','proses'])
    .order('created_at', {ascending:false})
    .limit(500)
    .then(function(res){
      if(res.error){ console.warn('[Incomplete Check] gagal load:', res.error.message); return; }
      var rows = res.data || [];
      var withMissing = rows.map(function(p){
        return { p:p, missing:_pelIncompleteFields(p) };
      }).filter(function(x){ return x.missing.length > 0; });
      _pelIncompleteData = withMissing;
      _pelIncompleteRender();
    })
    .catch(function(e){ console.warn('[Incomplete Check] error:', e.message); });
}

function _pelIncompleteRender(){
  var badge = document.getElementById('pel-incomplete-badge');
  var list  = document.getElementById('pel-incomplete-list');
  var n = _pelIncompleteData.length;
  if(badge){
    if(n>0){ badge.style.display='block'; badge.textContent = n>99?'99+':String(n); }
    else badge.style.display='none';
  }
  if(!list) return;
  if(!n){
    list.innerHTML = '<div style="padding:24px 14px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-circle-check" style="font-size:26px;color:var(--green);display:block;margin-bottom:6px"></i>Semua data pelanggan di area Anda sudah lengkap</div>';
    return;
  }
  list.innerHTML = _pelIncompleteData.map(function(x){
    var p = x.p;
    return '<div onclick="nav(\'pelanggan\');pelIncompleteTogglePanel();setTimeout(function(){var inp=document.getElementById(\'fas-search\');if(inp)inp.value=\''+_escAttr(p.cid||'')+'\';if(typeof fasSearch===\'function\')fasSearch(\''+_escAttr(p.cid||'')+'\');},300)" style="padding:10px 11px;border-bottom:1px solid var(--border);cursor:pointer;touch-action:manipulation">'+
      '<div style="display:flex;justify-content:space-between;align-items:start;gap:8px">'+
        '<div style="min-width:0">'+
          '<div style="font-size:12px;font-weight:700;color:var(--text)">'+_esc(p.nama||'—')+'</div>'+
          '<div style="font-size:10px;color:var(--text3);font-family:monospace">CID: '+_esc(p.cid||'—')+'</div>'+
        '</div>'+
        '<span style="font-size:9px;font-weight:800;padding:2px 7px;border-radius:20px;background:rgba(220,38,38,.1);color:var(--red);flex-shrink:0;white-space:nowrap">'+x.missing.length+' kosong</span>'+
      '</div>'+
      '<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px">'+
        x.missing.map(function(f){
          return '<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:6px;background:rgba(217,119,6,.1);color:var(--yellow)">'+_esc(f)+'</span>';
        }).join('')+
      '</div>'+
    '</div>';
  }).join('');
}

function pelIncompleteTogglePanel(){
  var panel = document.getElementById('pel-incomplete-panel');
  if(!panel) return;
  panel.style.display = (panel.style.display==='none'||!panel.style.display) ? 'block' : 'none';
}

var _pelIncompleteRtActive = false;
function _pelIncompleteStartRealtime(){
  if(_pelIncompleteRtActive) return;
  var sb = (typeof getSB==='function') ? getSB() : null;
  if(!sb || typeof sb.channel !== 'function') return;
  var r = normalizeRole(CR);
  if(_pelIncompleteRoles.indexOf(r) < 0) return;
  _pelIncompleteRtActive = true;
  try {
    sb.channel('pel-incomplete-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pelanggan' },
        function(payload){

          if(window._pelIncompleteDebounce) clearTimeout(window._pelIncompleteDebounce);
          window._pelIncompleteDebounce = setTimeout(function(){
            if(typeof pelIncompleteCheck==='function') pelIncompleteCheck();
          }, 1500);
        }
      )
      .subscribe(function(status){
        if(status === 'CLOSED' || status === 'CHANNEL_ERROR'){
          _pelIncompleteRtActive = false;
          setTimeout(_pelIncompleteStartRealtime, 10000);
        }
      });
  } catch(e){
    _pelIncompleteRtActive = false;

  }
}
function loadUsers(cb){
  var sb=getSB(); if(!sb){ if(cb) cb([]); return; }
  sb.from('app_users').select('*')
    .then(function(r){
      _users=(r.data||[]).filter(function(u){ return u.is_active!==false; });
      var el=document.getElementById('l-noact');
      if(el) el.style.display=_users.length?'none':'block';
      if(cb) cb(_users);
    }).catch(function(){ if(cb) cb([]); });
}
function applyRoleUI(role) {
  role = role || 'viewer';
  var r = normalizeRole(role);
  document.querySelectorAll('.sb-grp[data-roles]').forEach(function(grp) {
    var allowed = grp.getAttribute('data-roles').split(',').map(function(x){ return x.trim(); });
    grp.style.display = (allowed.indexOf(role) >= 0 || allowed.indexOf(r) >= 0) ? '' : 'none';
  });
  /* Filter per-item di dalam grup (mis. grup "Sistem" tetap kelihatan untuk
     finance, tapi item sensitif seperti Factory Reset / User & Role /
     Import-Export tetap disembunyikan khusus dari finance). */
  document.querySelectorAll('.sb-sub[data-roles]').forEach(function(sub) {
    var allowed = sub.getAttribute('data-roles').split(',').map(function(x){ return x.trim(); });
    sub.style.display = (allowed.indexOf(role) >= 0 || allowed.indexOf(r) >= 0) ? '' : 'none';
  });
  var urAdd = document.getElementById('ur-add-btn');
  if (urAdd) urAdd.style.display = (r==='super_admin' || r==='owner') ? '' : 'none';
  if (r === 'viewer') {
    document.querySelectorAll('.olt-add-btn').forEach(function(btn){ btn.style.display='none'; });
  }

  if(typeof window._hideWilayahNav === 'function') window._hideWilayahNav();
}

function lerr(){ var e=document.getElementById('l-err'); if(e) e.textContent=''; }

function _btnState(loading){
  var btn=document.getElementById('l-btn');
  var txt=document.getElementById('l-btn-txt');
  var ico=document.getElementById('l-btn-ico');
  if(btn) btn.disabled=loading;
  if(loading){
    if(txt) txt.innerHTML='<span class="spin"></span>&nbsp;Memverifikasi…';
    if(ico) ico.style.display='none';
  } else {
    if(txt) txt.textContent='Masuk';
    if(ico){ ico.style.display=''; ico.className='ti ti-login'; }
  }
}

function _showErr(msg){ _btnState(false); var e=document.getElementById('l-err'); if(e) e.textContent=msg; }

function doLogin(){
  var u=(document.getElementById('f-user')||{}).value||'';
  var p=(document.getElementById('f-pin')||{}).value||'';
  u=u.trim().toLowerCase(); p=p.trim();
  if(!u){ _showErr('Username tidak boleh kosong'); return; }
  if(!p){ _showErr('PIN tidak boleh kosong'); return; }
  if(!/^\d{4,6}$/.test(p)){ _showErr('PIN harus 4-6 digit angka'); return; }
  _btnState(true);
  var sb=getSB();
  if(!sb){ _showErr('Database tidak terhubung. Periksa koneksi.'); return; }
  sb.from('app_users').select('*').ilike('username',u).limit(1)
    .then(function(r){
      if(r.error){ _showErr('Error: '+(r.error.message||'coba lagi')); return; }
      if(!r.data||!r.data.length){ _showErr('Username tidak ditemukan.'); return; }
      var usr=r.data[0];
      var pin=String(usr.pin||usr.pin_hash||'').trim();
      var pinInput=String(p).trim();
      if(!pin){ _showErr('Akun belum punya PIN. Hubungi Admin.'); return; }
      if(pin!==pinInput){ _showErr('PIN salah. Coba lagi.'); document.getElementById('f-pin').value=''; return; }

      var isInactive = (usr.is_active===false) || (usr.status==='nonaktif');
      if(isInactive){ _showErr('Akun dinonaktifkan. Hubungi Admin.'); return; }
      _loginOK(usr);
    })
    .catch(function(e){ _showErr('Koneksi error: '+(e.message||'coba lagi')); });
}

function _loginOK(usr) {

  var resetArr = ['_pelData','_areaData','_oltData','_odcData','_odpData','_otfData','_recData',
                  '_appData','_dmtData','_payData','_invData','_pelOdpList','_appPelList'];
  resetArr.forEach(function(v){ if(typeof window[v]!=='undefined') window[v]=[]; });
  window._pelOdcList = [];
  var resetBool = ['_pelLoaded','_areaLoaded','_oltLoaded','_odcLoaded','_odpLoaded',
                   '_portLoaded','_otfLoaded','_recLoaded','_appLoaded','_dmtLoaded',
                   '_dashLoaded','_monLoaded','_insLoaded','_fdbLoaded','_rptLoaded',
                   '_otfSinkronDone','_otfSinkronRunning','_recSinkronRunning'];
  resetBool.forEach(function(v){ if(typeof window[v]!=='undefined') window[v]=false; });
  window._dashLastLoad = 0;
  window._monData = { olt:[], odc:[], odp:[], port:[] };

  CU = usr;
  CR = usr.role || 'viewer';
  applyRoleUI(CR);

  var name = usr.nama || usr.username || 'User';
  var av = name.trim().split(' ').slice(0,2).map(function(w){ return w[0]||''; }).join('').toUpperCase() || 'U';


  var scopeLabel = _isGlobalRole() ? 'Semua Area' : _getAreaScopeLabel();
  var els={'sb-av':av,'sb-uname':name,'sb-urole':(CR||'user').toUpperCase(),'hd-sub':'ICRM_JJC · '+name};
  Object.keys(els).forEach(function(id){ var e=document.getElementById(id); if(e) e.textContent=els[id]; });


  var sbArea = document.getElementById('sb-area-scope');
  if(sbArea){
    sbArea.style.display = _isGlobalRole() ? 'none' : 'flex';
    sbArea.innerHTML = _isGlobalRole() ? '' :
      '<i class="ti ti-map-pin" style="font-size:11px;color:var(--c2);flex-shrink:0"></i>'+
      '<span style="font-size:10px;color:var(--text2);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(scopeLabel)+'</span>';
  }


  var hour=new Date().getHours();
  var greet=hour<12?'Selamat Pagi':hour<15?'Selamat Siang':hour<19?'Selamat Sore':'Selamat Malam';
  var gt=document.getElementById('dash-greet-time');
  var gn=document.getElementById('dash-greet-name');
  if(gt) gt.textContent=greet+', '+name;
  if(gn) gn.textContent=_isGlobalRole()?'Dashboard Overview':'Dashboard · '+scopeLabel;


  var lw = document.getElementById('login-wall');
  if(lw) lw.style.display='none';


  setTimeout(function(){
    if(typeof pelIncompleteCheck==='function') pelIncompleteCheck();
    if(typeof _pelIncompleteStartRealtime==='function') _pelIncompleteStartRealtime();
  }, 1200);


  _showWelcome(usr, name, av, scopeLabel, greet);

  _btnState(false);
  sbStatus('ok');
}

function _showWelcome(usr, name, av, scopeLabel, greet){
  var ww = document.getElementById('welcome-wall');
  if(!ww) { _wwGoDashDirect(); return; }


  var elAv=document.getElementById('ww-av'); if(elAv) elAv.textContent=av;
  var elGreet=document.getElementById('ww-greet'); if(elGreet) elGreet.textContent=(greet||'Selamat Datang')+',';
  var elName=document.getElementById('ww-name'); if(elName) elName.textContent=name;
  var elRole=document.getElementById('ww-role'); if(elRole) elRole.textContent=(CR||'user').toUpperCase()+(scopeLabel?' · '+scopeLabel:'');


  var _s = _dSet;
  _s('ww-username', usr.username||'—');
  _s('ww-role2', (CR||'user').toUpperCase());

  var rawAreaId = usr.area_coverage_id || usr.area_id || null;

  var rowEl = document.getElementById('ww-area-id-row');
  if(rowEl) rowEl.style.display = 'none';

  function _fillAreaName(){
    var areaLabel = 'Semua Area';
    if(!_isGlobalRole() && rawAreaId){
      var found = (typeof _areaData!=='undefined' ? _areaData : []).find(function(a){ return a.id===rawAreaId; });
      areaLabel = found ? (found.nama||found.kode||rawAreaId) : (scopeLabel||'Area tidak diset');
    } else if(_isGlobalRole()){
      areaLabel = 'Semua Area';
    } else {
      areaLabel = scopeLabel||'Semua Area';
    }
    _s('ww-area', areaLabel);
  }

  if(!_isGlobalRole() && rawAreaId && (typeof _areaData==='undefined' || !_areaData.length)){
    var _sb = getSB();
    if(_sb){
      _sb.from('areas').select('id,nama,kode').order('nama').then(function(r){
        if(!r.error && r.data) _areaData = r.data;
        _fillAreaName();
      }).catch(function(){ _fillAreaName(); });
    } else { _fillAreaName(); }
  } else {
    _fillAreaName();
  }
  _s('ww-status', (usr.is_active===false||usr.status==='nonaktif') ? '✗ Nonaktif' : '● Aktif');
  _s('ww-hp', usr.hp||usr.phone||'—');
  _s('ww-ket', usr.keterangan||usr.notes||'—');


  var now = new Date();
  var tStr = (now.getDate()<10?'0':'')+now.getDate()+'/'+(now.getMonth()<9?'0':'')+(now.getMonth()+1)+'/'+now.getFullYear()+' · '+(now.getHours()<10?'0':'')+now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes();
  _s('ww-login-time', tStr);
  var ua = navigator.userAgent||'';
  var dev = /android/i.test(ua)?'Android':(/iphone|ipad/i.test(ua)?'iOS':'Desktop Browser');
  _s('ww-device', dev);


  _wwLoadStats();

  ww.style.display = '';
  ww.classList.add('on');
}

function _wwLoadStats(){
  var sb=getSB(); if(!sb) return;

  var qPel = sb.from('pelanggan').select('id',{count:'exact',head:true}).eq('status','aktif');
  var qOdp = sb.from('odps').select('id',{count:'exact',head:true}).eq('status','aktif');
  if (!_isGlobalRole()) {
    var sc = _getUserAreaScope();
    if (sc && sc.area_coverage_id) {
      qPel = qPel.eq('area_id', sc.area_coverage_id);
      qOdp = qOdp.eq('area_id', sc.area_coverage_id);
    }
  }
  Promise.all([
    qPel,
    sb.from('areas').select('id',{count:'exact',head:true}),
    qOdp
  ]).then(function(r){
    var _n=function(id,v){ var e=document.getElementById(id); if(e) e.textContent=(v||0); };
    _n('ww-s-pel',  r[0].count||0);
    _n('ww-s-area', r[1].count||0);
    _n('ww-s-odp',  r[2].count||0);
    var eb=document.getElementById('ww-s-pel-b'); if(eb) eb.textContent=(r[0].count||0)+' aktif';
  }).catch(function(){});
}

function wwTab(tab, btn){
  document.querySelectorAll('.ww-tab').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('.ww-tab-pane').forEach(function(p){ p.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  var pane=document.getElementById('ww-pane-'+tab); if(pane) pane.classList.add('on');
}

function wwGoDash(){
  var ww=document.getElementById('welcome-wall');
  if(ww){ ww.classList.remove('on'); ww.style.display=''; }
  _wwGoDashDirect();
}
function _applyDesktopLayout(){
  var isDesktop = window.innerWidth >= 768;
  var app     = document.getElementById('app');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sb-overlay');
  var hd      = document.querySelector('.hd');
  var ct      = document.getElementById('content');
  if(!app) return;

  if(isDesktop){
    var sw = '260px';
    var topH = '64px';


    if(sidebar){
      sidebar.style.position   = 'fixed';
      sidebar.style.top        = '0';
      sidebar.style.left       = '0';
      sidebar.style.bottom     = '0';
      sidebar.style.width      = sw;
      sidebar.style.zIndex     = '150';
      sidebar.style.display    = 'flex';
      sidebar.style.flexDirection = 'column';
      sidebar.style.overflow   = 'hidden';
      sidebar.style.transform  = 'translateX(0)';
      sidebar.style.boxShadow  = 'none';
      sidebar.style.transition = 'none';
      sidebar.style.background = '#fff';
      sidebar.style.borderRight = '1px solid #dadce0';
    }

    if(overlay){ overlay.style.display = 'none'; }


    app.style.position   = 'fixed';
    app.style.top        = '0';
    app.style.left       = sw;
    app.style.right      = '0';
    app.style.bottom     = '0';
    app.style.width      = 'auto';
    app.style.height     = '100%';
    app.style.display    = 'flex';
    app.style.flexDirection = 'column';
    app.style.background = '#f1f3f4';
    app.style.zIndex     = '1';
    app.style.overflow   = 'hidden';


    if(hd){
      hd.style.height      = topH;
      hd.style.minHeight   = topH;
      hd.style.flexShrink  = '0';
      hd.style.background  = '#fff';
      hd.style.borderBottom = '1px solid #dadce0';
      hd.style.padding     = '0 24px';
      hd.style.boxShadow   = 'none';
    }


    if(ct){
      ct.style.flex        = '1';
      ct.style.height      = '0';
      ct.style.minHeight   = '0';
      ct.style.overflowY   = 'auto';
      ct.style.overflowX   = 'hidden';
      ct.style.background  = '#f1f3f4';
      ct.style.padding     = '24px 32px 40px';
      ct.style.display     = 'block';
    }

  } else {

    if(sidebar){ sidebar.style.cssText = ''; }
    if(overlay){ overlay.style.cssText = ''; }
    if(hd)     { hd.style.cssText = ''; }
    if(ct)     { ct.style.cssText = ''; }
    app.style.position  = 'fixed';
    app.style.inset     = '0';
    app.style.left      = '0';
    app.style.top       = '0';
    app.style.right     = '0';
    app.style.bottom    = '0';
    app.style.width     = '';
    app.style.height    = '100vh';
    app.style.display   = 'flex';
    app.style.flexDirection = 'column';
    app.style.background = '';
    app.style.zIndex    = '1';
    app.style.overflow  = 'hidden';
  }
}

if(!window._bndResize1){ window.addEventListener('resize', function(){ _applyDesktopLayout(); }); window._bndResize1=true; }

function _wwGoDashDirect(){
  var app=document.getElementById('app');
  if(app){
    app.style.display='flex';
    app.style.zIndex='100';

    void app.offsetHeight;
  }

  _applyDesktopLayout();

  setTimeout(_renderAreaBadge, 100);
  _initDebounceWrappers();
  nav('dash', document.getElementById('sbt-dash'));
  toast('Selamat datang, '+(CU&&(CU.nama||CU.username)||'')+'!','ok');


  setTimeout(_autoSyncStart, 800);
}

function wwGo(key){
  wwGoDash();
  setTimeout(function(){
    nav(key, document.getElementById('sbt-'+key));
  }, 120);
}

function wwLogout(){
  var ww=document.getElementById('welcome-wall');
  if(ww){ ww.classList.remove('on'); ww.style.display=''; }
  doLogout();
}

function doLogout() {
  if (!confirm('Keluar dari aplikasi?')) return;

  if(typeof _autoSyncStop==='function') _autoSyncStop();
  CU = null; CR = null;

  // Reset semua cache modul
  ['_pelData','_areaData','_oltData','_odcData','_odpData','_otfData','_recData',
   '_appData','_dmtData','_payData','_invData','_pelOdpList','_appPelList'].forEach(function(v){
    if (typeof window[v] !== 'undefined') window[v] = [];
  });
  window._pelOdcList = [];
  ['_pelLoaded','_areaLoaded','_oltLoaded','_odcLoaded','_odpLoaded','_portLoaded',
   '_otfLoaded','_recLoaded','_appLoaded','_dmtLoaded','_dashLoaded','_monLoaded',
   '_insLoaded','_fdbLoaded','_rptLoaded','_otfSinkronDone','_otfSinkronRunning',
   '_recSinkronRunning'].forEach(function(v){
    if (typeof window[v] !== 'undefined') window[v] = false;
  });
  window._dashLastLoad = 0;
  window._monData = { olt:[], odc:[], odp:[], port:[] };
  if (typeof _rptHeartbeatInterval !== 'undefined' && _rptHeartbeatInterval) { clearInterval(_rptHeartbeatInterval); _rptHeartbeatInterval = null; }

  sbClose();
  var ww = document.getElementById('welcome-wall');
  if (ww) { ww.classList.remove('on'); ww.style.display=''; }
  var eu = document.getElementById('f-user'), ep = document.getElementById('f-pin');
  if (eu) eu.value=''; if (ep) ep.value='';
  lerr(); _btnState(false);
  var app = document.getElementById('app');
  var lw  = document.getElementById('login-wall');
  if (app) { app.style.display='none'; app.style.opacity=''; }
  if (lw)  { lw.style.display='flex'; lw.style.zIndex='999'; }
  setTimeout(function(){ if (eu) eu.focus(); }, 100);
}
function sbOpen(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sb-overlay').classList.add('on');
}
function sbClose(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').classList.remove('on');
}
function sbToggle(grpId, btn){
  var body=document.getElementById(grpId);
  if(!body) return;
  var was=body.classList.contains('open');
  document.querySelectorAll('.sb-grp-body').forEach(function(b){ b.classList.remove('open'); });
  document.querySelectorAll('.sb-grp-hd').forEach(function(b){ b.classList.remove('open'); });
  if(!was){
    body.classList.add('open');
    if(btn) btn.classList.add('open');
  }
}

var PANES = {
  'dash':         ['p-dash',         'Dashboard'],
  'monitoring':   ['p-monitoring',   'Monitoring Jaringan'],
  'insight':      ['p-insight',      'Ringkasan Owner'],
  'area':         ['p-area',         'Area Management (SSOT)'],
   'wilayah': ['p-wilayah','Master Wilayah'],
  'olt':          ['p-olt',          'Master OLT'],
  'odc':          ['p-odc',          'Master ODC'],
  'odp':          ['p-odp',          'Master ODP'],
  'port':         ['p-port',         'Port Management'],
  'pelanggan':    ['p-pelanggan',    'Data Pelanggan'],
  'fasum':        ['p-fasum',        'FASUM & Gratis'],
  'approval':     ['p-approval',     'Approval ISP'],
  'finance':        ['p-finance',      'Finance & Fee'],
  'fin-dashboard':   ['p-finance',      'Dashboard Finance'],
  'fin-otf':        ['p-finance',      'Fee OTF'],
  'fin-recurring':  ['p-finance',      'Fee Recurring'],
  'fin-invoice':    ['p-finance',      'Invoice ISP'],
  'fin-validasi':   ['p-finance',      'Validasi Finance'],
  'fin-apv-bayar':  ['p-finance',      'Approval Pembayaran'],
  'fin-pembayaran': ['p-finance',      'Riwayat Pembayaran'],
  'fin-laporan':    ['p-finance',      'Laporan Finance'],
  'gis':          ['p-gis',          'Peta Jaringan'],
  'importexport': ['p-importexport', 'Import / Export'],
  'userrole':     ['p-userrole',     'User & Role'],
  'realtimesync': ['p-realtimesync', 'Realtime Sync'],
  'reporting':    ['p-reporting',    'Audit Log'],
  'material':     ['p-material',     'Inventory Material'],

  'sales-dash':     ['p-sales-dash',     'Dashboard Sales'],
  'sales-wilayah':  ['p-sales-wilayah',  'Master Territory'],
  'sales-pel':      ['p-sales-pel',      'Pelanggan per Wilayah'],
  'sales-finance':  ['p-sales-finance',  'Finance per Wilayah'],
  'sales-laporan':  ['p-sales-laporan',  'Laporan Territory'],

  'dismantle':      ['p-dismantle',      'Dismantle / Cabut Pelanggan'],
  'maintenance':    ['p-maintenance',    'Maintenance & Perbaikan'],

  'factoryreset':   ['p-factoryreset',   'Factory Reset — Hapus Semua Data'],

  'owner-dash':     ['p-owner-dash',     'Dashboard Owner'],
  'port-cek':       ['p-port-cek',       'Cek Port Area']
};

var _cur = 'dash';

function nav(key, btnEl, type){
  if(!PANES[key]) return;
  window._currentPane = key;

  var allPanes = document.querySelectorAll('.pane');
  var targetPaneId = PANES[key][0];
  for(var _pi=0; _pi<allPanes.length; _pi++){
    var _p = allPanes[_pi];
    if(_p.id === targetPaneId){

      _p.style.display = (_p.id === 'p-insight') ? 'flex' : 'block';
      void _p.offsetHeight;
      _p.classList.add('on');
    } else {
      _p.classList.remove('on');
      _p.style.display='';
    }
  }
  var ht=document.getElementById('hd-title');
  if(ht) ht.textContent=PANES[key][1];
  document.querySelectorAll('.sb-grp-hd,.sb-sub').forEach(function(b){ b.classList.remove('on'); });
  if(key==='dash'){
    var sbtDash=document.getElementById('sbt-dash');
    if(sbtDash) sbtDash.classList.add('on');
    setTimeout(dashLoad, 100);
  } else if(key==='monitoring'){
    var sbtMon=document.getElementById('sbt-monitoring');
    if(sbtMon) sbtMon.classList.add('on');

    if(!_monLoaded) setTimeout(monLoad, 100);
  } else {
    if(btnEl) btnEl.classList.add('on');
  }
  var ct=document.getElementById('content');
  if(ct) ct.scrollTop=0;
  _cur=key;

  _navDispatch.run(key);
  sbClose();
}

var _finSubTitles = {
  otf:         ['Fee OTF',              'One-Time Fee dari Approval ISP'],
  recurring:   ['Fee Recurring',        'Fee bulanan pelanggan aktif'],
  invoice:     ['Invoice ISP',           'Invoice OTF + Recurring ke ISP'],
  validasi:    ['Validasi Finance',     'Cocokkan data sistem vs data ISP'],
  'apv-bayar': ['Approval Pembayaran',  'Setujui pembayaran fee tervalidasi'],
  pembayaran:  ['Riwayat Pembayaran',   'Riwayat transfer fee yang sudah dibayar'],
  laporan:     ['Laporan Finance',      'Rekap fee OTF & recurring']
};

function navFin(key, tab, btnEl){
  nav(key, btnEl);
  setTimeout(function(){

    document.querySelectorAll('#p-finance .mat-subpane').forEach(function(p){ p.classList.remove('on'); });
    var tabPane = document.getElementById('fin-pane-'+tab);
    if(tabPane) tabPane.classList.add('on');

    var t = _finSubTitles[tab]||['Finance & Fee',''];
    var titleEl = document.getElementById('fin-pane-title');
    var subEl   = document.getElementById('fin-pane-sub');
    if(titleEl) titleEl.textContent = t[0];
    if(subEl)   subEl.textContent   = 'Finance · Tahap 8 ✓';

    _finTabCur = tab;
    if(tab==='otf' && !_otfLoaded) otfLoad();
    if(tab==='recurring' && !_recLoaded) recLoad();
    if(tab==='invoice' && !_invLoaded) invLoad();
    if(tab==='validasi') valLoad();
    if(tab==='apv-bayar') apvbLoad();
    if(tab==='pembayaran') payLoad();
    if(tab==='laporan') lapLoad();
  }, 50);
}

var _monTabCur     = 'area';
var _monOltData    = [];
var _monOdcData    = [];
var _monOdpData    = [];
var _monPortData   = [];
var _monPortFil    = [];
var _monPortOffset = 0;
var _monPortLimit  = 30;
var _monLoaded     = false;
var _monPgSize     = 15;
var _monOdcPage    = 1;
var _monOdpPage    = 1;
var _monOltPage    = 1;

function monTab(tab, btn){
  _monTabCur = tab;
  ['area','olt','odc','odp','port','masalah'].forEach(function(t){
    var pane = document.getElementById('mon-pane-'+t);
    var b    = document.getElementById('mon-tb-'+t);
    if(pane) pane.style.display = (t===tab) ? 'block' : 'none';
    if(b){
      b.style.background  = (t===tab) ? 'var(--c1)' : 'var(--bg2)';
      b.style.color       = (t===tab) ? '#fff'       : 'var(--text2)';
      b.style.borderColor = (t===tab) ? 'var(--c1)'  : 'var(--border2)';
    }
  });
  if(tab==='area')    _monAreaInit();
  if(tab==='olt')     monOltLoad();
  if(tab==='odc')     monOdcLoad();
  if(tab==='odp')     monOdpLoad();
  if(tab==='port')    { _monPortOffset=0; monPortLoad(); }
  if(tab==='masalah') monMasalahLoad();
}

function navMonitoring(tab, btnEl){
  if(typeof nav==='function') nav('monitoring', btnEl||null);
  if(typeof sbClose==='function') sbClose();
  var map={ringkasan:'area',olt:'olt',odc:'odc',odp:'odp',cek:'port',rusak:'masalah'};
  var t = map[tab]||tab;
  setTimeout(function(){
    monTab(t, document.getElementById('mon-tb-'+t));
  }, 80);
}

if(typeof _navDispatch!=='undefined' && typeof _navDispatch.register==='function'){
  _navDispatch.register('monitoring', function(){
    setTimeout(function(){ _monAreaInit(); }, 80);
  });
}

function _monGetScopedCache(){
  if(typeof SOT==='undefined') return {areas:[],odcs:[],odps:[],ports:[],pelanggan:[]};
  var c = SOT.cache();
  if(typeof _isGlobalRole==='function' && !_isGlobalRole()){
    var sc = typeof _getUserAreaScope==='function' ? _getUserAreaScope() : null;
    var aId = sc && sc.area_coverage_id;
    if(aId){
      var fAreas = (c.areas||[]).filter(function(a){ return a.id===aId; });
      var fOdcs  = (c.odcs ||[]).filter(function(o){ return o.area_id===aId; });
      var fOdps  = (c.odps ||[]).filter(function(o){ return o.area_id===aId; });
      var oids={}; fOdps.forEach(function(o){ oids[o.id]=1; });
      var fPorts = (c.ports||[]).filter(function(p){ return oids[p.odp_id]; });
      var fPels  = (c.pelanggan||[]).filter(function(p){ return p.area_id===aId; });
      return {areas:fAreas,odcs:fOdcs,odps:fOdps,ports:fPorts,pelanggan:fPels};
    }
  }
  return c;
}

function _monEsc(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _monPad(n){ return n<10?'0'+n:n; }
function _monAreaName(aId){
  var c=_monGetScopedCache();
  var a=(c.areas||[]).find(function(x){return x.id===aId;});
  return a?(a.nama||a.kode||'—'):'—';
}
function _monPelNama(cid){
  var c=_monGetScopedCache();
  var p=(c.pelanggan||[]).find(function(x){return x.cid===cid;});
  return p?p.nama:'—';
}
function _monPelByCid(cid){
  var c=_monGetScopedCache();
  return (c.pelanggan||[]).find(function(x){return x.cid===cid;})||null;
}
function _monFmtDate(s){
  if(!s) return '—';
  var d=new Date(s); if(isNaN(d)) return s;
  return _monPad(d.getDate())+'/'+_monPad(d.getMonth()+1)+'/'+d.getFullYear();
}

/* Generic pagination HTML */
function _monPagiHTML(page, total, pgSize, onPrev, onNext){
  var pages = Math.max(1, Math.ceil(total/pgSize));
  if(pages<=1) return '';
  return '<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 0">'+
    '<button onclick="'+onPrev+'" '+(page<=1?'disabled':'')+' style="padding:6px 14px;border:1.5px solid var(--border2);border-radius:20px;background:var(--bg2);font-family:Sora,sans-serif;font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;touch-action:manipulation"><i class="ti ti-chevron-left"></i></button>'+
    '<span style="font-size:12px;font-weight:700;color:var(--text2)">'+page+' / '+pages+'</span>'+
    '<button onclick="'+onNext+'" '+(page>=pages?'disabled':'')+' style="padding:6px 14px;border:1.5px solid var(--border2);border-radius:20px;background:var(--bg2);font-family:Sora,sans-serif;font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;touch-action:manipulation"><i class="ti ti-chevron-right"></i></button>'+
  '</div>';
}

/* ----------------------------------------------------------------
   TAB 1 — AREA
---------------------------------------------------------------- */
function _monAreaInit(){
  /* Show loading state immediately */
  var list = document.getElementById('mon-area-list');
  if(list) list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:20px;display:block;margin-bottom:8px;opacity:.4"></i>Memuat data area…</div>';

  if(typeof SOT==='undefined'){ setTimeout(_monAreaInit, 800); return; }

  /* Load OLT list first (not in SOT cache) */
  var sb = (typeof getSB==='function') ? getSB() : null;
  var pOlt = Promise.resolve();
  if(sb && !_monOltData.length){
    var qOlt = sb.from('olts').select('id,kode,nama,status,area_id,brand,model,lokasi');
    if(typeof _scopedQuery==='function') qOlt = _scopedQuery(qOlt,'area_id');
    pOlt = qOlt.then(function(r){ if(!r.error) _monOltData = r.data||[]; }).catch(function(){});
  }

  pOlt.then(function(){
    SOT.refresh(false, function(c){
      _monAreaRenderBanner(c);
      _monAreaRenderCards(c);
      _monLoaded = true;
    });
  });
}

function monAreaLoad(force){
  /* Called by refresh button */
  var list = document.getElementById('mon-area-list');
  if(list) list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:20px;display:block;margin-bottom:8px;opacity:.4"></i>Memuat ulang…</div>';
  if(typeof SOT==='undefined') return;
  _monOltData = []; /* force reload OLT */
  _monAreaInit();
}

function _monAreaRenderBanner(c){
  var sc = _monGetScopedCache();
  var JG = (typeof JENIS_GRATIS!=='undefined') ? JENIS_GRATIS : ['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
  var odps  = sc.odps||[];
  var ports = sc.ports||[];
  var pels  = (sc.pelanggan||[]).filter(function(p){ return JG.indexOf(p.jenis_pelanggan)<0; });

  var pelAll = sc.pelanggan||[];
  var kapGlobal = odps.reduce(function(s,o){return s+(parseInt(o.jumlah_port)||0);},0);
  /* Ghost port: pelanggan aktif dengan odp+port tapi tidak di odp_ports */
  var globUsedSet={};
  ports.filter(function(p){
    return (typeof PORT_STATUS!=='undefined'?PORT_STATUS.isUsed(p.status):p.status==='terpakai')&&p.nomor_port!=null;
  }).forEach(function(p){globUsedSet[p.odp_id+'::'+p.nomor_port]=1;});
  pelAll.filter(function(p){
    return (p.status==='aktif'||p.status==='maintenance')&&p.odp_id&&p.nomor_port!=null;
  }).forEach(function(p){
    var k=p.odp_id+'::'+p.nomor_port;if(!globUsedSet[k])globUsedSet[k]=1;
  });
  var usedGlobal = Object.keys(globUsedSet).length;
  var pct      = kapGlobal ? Math.round(usedGlobal/kapGlobal*100) : 0;
  var sisa     = Math.max(0, kapGlobal-usedGlobal);
  var odpAktif = odps.filter(function(o){return o.status==='aktif';}).length;
  var aktifPel = pels.filter(function(p){return p.status==='aktif'||p.status==='maintenance';}).length;

  var s=function(id,v){var e=document.getElementById(id);if(e)e.textContent=v;};
  s('mon-glob-pct',   pct+'%');
  s('mon-glob-sisa',  'Sisa '+sisa+' port');
  s('mon-glob-odp',   'dari '+odpAktif+' ODP aktif');
  s('mon-glob-detail',usedGlobal+' / '+kapGlobal+' port terisi');
  var bar=document.getElementById('mon-glob-bar');
  if(bar) bar.style.width=Math.min(100,pct)+'%';

  /* KPI */
  s('mon-kpi-olt', _monOltData.length);
  s('mon-kpi-odc', (sc.odcs||[]).length);
  s('mon-kpi-odp', odps.length);
  s('mon-kpi-pel', aktifPel);
}

function _monAreaRenderCards(c){
  var sc    = _monGetScopedCache();
  var areas = sc.areas||[];
  var odcs  = sc.odcs||[];
  var odps  = sc.odps||[];
  var ports = sc.ports||[];
  var JG    = (typeof JENIS_GRATIS!=='undefined') ? JENIS_GRATIS : ['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
  var pelAll = sc.pelanggan||[];
  var pels  = pelAll.filter(function(p){return JG.indexOf(p.jenis_pelanggan)<0;});
  var olts  = _monOltData;

  var el = document.getElementById('mon-area-list');
  if(!el) return;

  if(!areas.length){
    el.innerHTML='<div style="padding:40px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:.3"></i>Tidak ada data area</div>';
    return;
  }

  el.innerHTML = areas.map(function(a){
    var aOlt  = olts.filter(function(o){return o.area_id===a.id;});
    var aOdc  = odcs.filter(function(o){return o.area_id===a.id;});
    var aOdp  = odps.filter(function(o){return o.area_id===a.id;});
    var oids  = {}; aOdp.forEach(function(o){oids[o.id]=1;});
    var aPorts= ports.filter(function(p){return oids[p.odp_id];});

    var aOltOk = aOlt.filter(function(o){return o.status==='aktif';}).length;
    var aOdcOk = aOdc.filter(function(o){return o.status==='aktif';}).length;
    var aOdpOk = aOdp.filter(function(o){return o.status==='aktif';}).length;
    var semuaOk= aOltOk===aOlt.length && aOdcOk===aOdc.length && aOdpOk===aOdp.length && aOlt.length>0;

    var kapArea   = aOdp.reduce(function(s,o){return s+(parseInt(o.jumlah_port)||0);},0);
    /* usedPorts: gabungkan odp_ports + ghost (pelanggan aktif tanpa entry port) */
    var portUsedSet={};
    aPorts.filter(function(p){
      return (typeof PORT_STATUS!=='undefined'?PORT_STATUS.isUsed(p.status):p.status==='terpakai')&&p.nomor_port!=null;
    }).forEach(function(p){portUsedSet[p.odp_id+'::'+p.nomor_port]=1;});
    /* Ghost: pelanggan aktif di area ini punya odp+port tapi tidak ada di odp_ports */
    pelAll.filter(function(p){
      return p.area_id===a.id&&(p.status==='aktif'||p.status==='maintenance')&&p.odp_id&&p.nomor_port!=null;
    }).forEach(function(p){
      var k=p.odp_id+'::'+p.nomor_port;if(!portUsedSet[k])portUsedSet[k]=1;
    });
    var usedPorts=Object.keys(portUsedSet).length;

    /* Pelanggan aktif berbayar (termasuk maintenance) */
    var aktifBerbayar = pels.filter(function(p){return p.area_id===a.id&&(p.status==='aktif'||p.status==='maintenance');}).length;

    /* Pelanggan FASUM & Gratis (ikut pakai port tapi gratis) */
    var areaPelAll = pelAll.filter(function(p){return p.area_id===a.id&&p.status==='aktif';});
    var fasumArea  = areaPelAll.filter(function(p){return p.jenis_pelanggan==='FASUM';}).length;
    var odpTempel  = areaPelAll.filter(function(p){return p.jenis_pelanggan==='ODP_TEMPEL';}).length;
    var odcTempel  = areaPelAll.filter(function(p){return p.jenis_pelanggan==='ODC_TEMPEL';}).length;
    var totalGratis= fasumArea+odpTempel+odcTempel;
    /* Total aktif = berbayar + gratis (keduanya pakai port) */
    var totalAktif = aktifBerbayar + totalGratis;

    var pctArea   = kapArea?Math.round(usedPorts/kapArea*100):0;
    var sisaArea  = Math.max(0,kapArea-usedPorts);
    var pctColor  = pctArea>=80?'var(--red)':pctArea>=50?'var(--yellow)':'var(--c1)';
    var badge     = semuaOk
      ? '<span style="font-size:10px;font-weight:700;background:var(--gng2);color:var(--green);padding:3px 10px;border-radius:20px">✓ Normal</span>'
      : '<span style="font-size:10px;font-weight:700;background:var(--rg2);color:var(--red);padding:3px 10px;border-radius:20px">⚠ Perlu Cek</span>';

    function statBox(lbl,ok,tot){
      var color=(tot>0&&ok===tot)?'var(--green)':(tot>0?'var(--red)':'var(--text3)');
      return '<div style="flex:1;background:var(--bg3);border-radius:8px;padding:8px 4px;text-align:center">'+
        '<div style="font-size:9px;font-weight:700;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:2px">'+lbl+'</div>'+
        '<div style="font-size:15px;font-weight:800;color:'+color+'">'+ok+'/'+tot+'</div>'+
        '<div style="font-size:9px;font-weight:700;color:'+color+'">'+(tot>0&&ok===tot?'OK':tot>0?'CEK':'–')+'</div></div>';
    }

    var fasumBadge = totalGratis > 0
      ? '<div style="display:flex;align-items:center;gap:6px;background:rgba(124,58,237,.07);border:1px solid rgba(124,58,237,.18);border-radius:8px;padding:8px 10px;margin-bottom:8px">'+
          '<i class="ti ti-school" style="font-size:14px;color:var(--pu);flex-shrink:0"></i>'+
          '<div style="flex:1">'+
            '<div style="font-size:10px;font-weight:700;color:var(--pu)">FASUM &amp; Gratis: '+totalGratis+' pelanggan</div>'+
            '<div style="font-size:10px;color:var(--text3);margin-top:1px">'+
              (fasumArea?'FASUM: <b>'+fasumArea+'</b>':'')+
              (fasumArea&&(odpTempel||odcTempel)?' · ':'')+
              (odpTempel?'ODP Tempel: <b>'+odpTempel+'</b>':'')+
              (odpTempel&&odcTempel?' · ':'')+
              (odcTempel?'ODC Tempel: <b>'+odcTempel+'</b>':'')+
            '</div>'+
          '</div>'+
          '<button onclick="nav(\'fasum\');setTimeout(function(){var s=document.getElementById(\'fas-fil-area\');if(s){s.value=\''+a.id+'\';fasRender();}},300)" '+
            'style="font-size:9px;font-weight:700;padding:4px 10px;border:1px solid rgba(124,58,237,.3);border-radius:20px;background:rgba(124,58,237,.1);color:var(--pu);cursor:pointer;font-family:Sora,sans-serif;white-space:nowrap;touch-action:manipulation">'+
            'Detail</button>'+
        '</div>'
      : '';

    return '<div style="background:var(--bg2);border-radius:var(--r);padding:14px;border:1.5px solid var(--border);box-shadow:var(--sh-sm)">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
        '<div style="font-size:14px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px"><i class="ti ti-map-pin" style="color:var(--red)"></i>'+_monEsc(a.nama||a.kode)+'</div>'+
        badge+
      '</div>'+
      '<div style="display:flex;gap:8px;margin-bottom:12px">'+
        statBox('OLT',aOltOk,aOlt.length)+
        statBox('ODC',aOdcOk,aOdc.length)+
        statBox('ODP',aOdpOk,aOdp.length)+
      '</div>'+
      fasumBadge+
      '<div style="background:var(--bg3);border-radius:10px;padding:10px 12px;margin-bottom:10px">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
          '<div style="font-size:11px;font-weight:700;color:var(--text2);display:flex;align-items:center;gap:5px"><i class="ti ti-plug-connected" style="font-size:13px"></i> Utilisasi Port</div>'+
          '<div style="font-size:14px;font-weight:800;color:'+pctColor+'">'+pctArea+'%</div>'+
        '</div>'+
        '<div style="height:7px;background:var(--bg4);border-radius:4px;overflow:hidden;margin-bottom:6px">'+
          '<div style="height:100%;width:'+Math.min(100,pctArea)+'%;background:'+pctColor+';border-radius:4px;transition:width .4s"></div>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);font-weight:600">'+
          '<div>'+usedPorts+' terpakai / '+kapArea+' kapasitas</div>'+
          '<div>'+sisaArea+' sisa</div>'+
        '</div>'+
      '</div>'+
      '<div style="padding-top:8px;border-top:1px solid var(--border)">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
          '<div style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:5px"><i class="ti ti-users" style="font-size:13px"></i> Pelanggan Aktif (Berbayar)</div>'+
          '<div style="font-size:13px;font-weight:800;color:var(--green)">'+aktifBerbayar+'</div>'+
        '</div>'+
        (totalGratis>0?
          '<div style="display:flex;align-items:center;justify-content:space-between">'+
            '<div style="font-size:10px;color:var(--text3);display:flex;align-items:center;gap:5px"><i class="ti ti-school" style="font-size:11px;color:var(--pu)"></i> + FASUM/Gratis</div>'+
            '<div style="font-size:12px;font-weight:700;color:var(--pu)">+'+totalGratis+
              ' <span style="font-size:10px;font-weight:500;color:var(--text3)">= '+totalAktif+' total</span></div>'+
          '</div>':'')+
      '</div>'+
    '</div>';
  }).join('');
}

function monOltLoad(){
  var list = document.getElementById('mon-olt-list');
  if(list) list.innerHTML='<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:20px;display:block;margin-bottom:8px;opacity:.4"></i>Memuat OLT…</div>';
  var sb=(typeof getSB==='function')?getSB():null;
  if(!sb){ monOltRender(); return; }
  var q=sb.from('olts').select('id,kode,nama,area_id,status,lokasi,brand,model').order('kode');
  if(typeof _scopedQuery==='function') q=_scopedQuery(q,'area_id');
  q.then(function(r){
    _monOltData=(!r.error&&r.data)?r.data:[];
    _monOltPage=1;
    monOltRender();
  }).catch(function(){ monOltRender(); });
}
window.monOltSearch = function(q){ _monOltPage=1; monOltRender(q); };
window.monOltPageNav = function(d){
  var q=(document.getElementById('mon-olt-search')||{}).value||'';
  var data=_monOltFiltered(q);
  var pages=Math.max(1,Math.ceil(data.length/_monPgSize));
  _monOltPage=Math.min(pages,Math.max(1,_monOltPage+d));
  monOltRender(q);
};
function _monOltFiltered(q){
  q=(q||'').toLowerCase().trim();
  return q?_monOltData.filter(function(o){
    return (o.kode||'').toLowerCase().includes(q)||(o.nama||'').toLowerCase().includes(q)||(o.lokasi||'').toLowerCase().includes(q);
  }):_monOltData;
}
function monOltRender(q){
  q=q!==undefined?q:((document.getElementById('mon-olt-search')||{}).value||'');
  var data=_monOltFiltered(q);
  var total=data.length,aktif=data.filter(function(o){return o.status==='aktif';}).length,maint=data.filter(function(o){return o.status==='maintenance';}).length;
  var statsEl=document.getElementById('mon-olt-stats');
  if(statsEl) statsEl.innerHTML=[['var(--c1)','Total',total],['var(--green)','Aktif',aktif],['var(--yellow)','Maintenance',maint]].map(function(x){
    return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px;border:1.5px solid var(--border);text-align:center"><div style="font-size:20px;font-weight:800;color:'+x[0]+'">'+x[2]+'</div><div style="font-size:10px;font-weight:700;color:var(--text3)">'+x[1].toUpperCase()+'</div></div>';
  }).join('');
  var pages=Math.max(1,Math.ceil(total/_monPgSize));
  if(_monOltPage>pages)_monOltPage=1;
  var slice=data.slice((_monOltPage-1)*_monPgSize,_monOltPage*_monPgSize);
  var list=document.getElementById('mon-olt-list');
  if(!list) return;
  if(!slice.length){list.innerHTML='<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">Tidak ada OLT</div>';return;}
  list.innerHTML=slice.map(function(o){
    var stColor=o.status==='aktif'?'var(--green)':o.status==='maintenance'?'var(--yellow)':'var(--red)';
    return '<div style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
        '<div><div style="font-size:10px;font-family:monospace;color:var(--text3)">'+_monEsc(o.kode||'—')+'</div>'+
        '<div style="font-size:13px;font-weight:800;color:var(--text)">'+_monEsc(o.nama||'—')+'</div></div>'+
        '<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+stColor+'18;color:'+stColor+'">'+_monEsc(o.status||'—')+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap">'+
        '<span style="font-size:10px;color:var(--text3)"><i class="ti ti-map-pin" style="font-size:11px"></i> '+_monEsc(_monAreaName(o.area_id))+'</span>'+
        '<span style="font-size:10px;color:var(--text3)"><i class="ti ti-building" style="font-size:11px"></i> '+_monEsc((o.brand||'')+(o.model?' '+o.model:''))+'</span>'+
        (o.lokasi?'<span style="font-size:10px;color:var(--text3)">'+_monEsc(o.lokasi)+'</span>':'')+
      '</div>'+
    '</div>';
  }).join('')+
  _monPagiHTML(_monOltPage,total,_monPgSize,"monOltPageNav(-1)","monOltPageNav(1)");
}

function monOdcLoad(){
  var c=_monGetScopedCache();
  _monOdcData=c.odcs||[];
  _monOdcPage=1;

  var selArea=document.getElementById('mon-odc-fil-area');
  if(selArea&&selArea.options.length<=1){
    (c.areas||[]).forEach(function(a){
      var o=document.createElement('option'); o.value=a.id; o.textContent=a.nama||a.kode; selArea.appendChild(o);
    });
  }
  monOdcRender();
}
window.monOdcSearch = function(q){ _monOdcPage=1; monOdcRender(q); };
window.monOdcPageNav = function(d){
  var q=(document.getElementById('mon-odc-search')||{}).value||'';
  var fA=(document.getElementById('mon-odc-fil-area')||{}).value||'';
  var data=_monOdcFiltered(q,fA);
  var pages=Math.max(1,Math.ceil(data.length/_monPgSize));
  _monOdcPage=Math.min(pages,Math.max(1,_monOdcPage+d));
  monOdcRender(q);
};
function _monOdcFiltered(q,fA){
  q=(q||'').toLowerCase().trim();
  fA=fA||((document.getElementById('mon-odc-fil-area')||{}).value||'');
  return _monOdcData.filter(function(o){
    if(fA&&o.area_id!==fA) return false;
    if(!q) return true;
    return (o.kode||'').toLowerCase().includes(q)||(o.nama||'').toLowerCase().includes(q);
  });
}
function monOdcRender(q){
  q=q!==undefined?q:((document.getElementById('mon-odc-search')||{}).value||'');
  var fA=(document.getElementById('mon-odc-fil-area')||{}).value||'';
  var data=_monOdcFiltered(q,fA);
  var total=data.length,aktif=data.filter(function(o){return o.status==='aktif';}).length,maint=data.filter(function(o){return o.status==='maintenance';}).length;
  var statsEl=document.getElementById('mon-odc-stats');
  if(statsEl) statsEl.innerHTML=[['var(--c2)','Total',total],['var(--green)','Aktif',aktif],['var(--yellow)','Maintenance',maint]].map(function(x){
    return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px;border:1.5px solid var(--border);text-align:center"><div style="font-size:20px;font-weight:800;color:'+x[0]+'">'+x[2]+'</div><div style="font-size:10px;font-weight:700;color:var(--text3)">'+x[1].toUpperCase()+'</div></div>';
  }).join('');
  var pages=Math.max(1,Math.ceil(total/_monPgSize));
  if(_monOdcPage>pages)_monOdcPage=1;
  var slice=data.slice((_monOdcPage-1)*_monPgSize,_monOdcPage*_monPgSize);
  var c=_monGetScopedCache();
  var list=document.getElementById('mon-odc-list');
  if(!list) return;
  if(!slice.length){list.innerHTML='<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">Tidak ada ODC</div>';return;}
  list.innerHTML=slice.map(function(o){
    var stColor=o.status==='aktif'?'var(--green)':o.status==='maintenance'?'var(--yellow)':'var(--red)';
    var odpCount=(c.odps||[]).filter(function(p){return p.odc_id===o.id;}).length;
    var odpAktif=(c.odps||[]).filter(function(p){return p.odc_id===o.id&&p.status==='aktif';}).length;
    return '<div onclick="monOdcDetail(\''+o.id+'\')" style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px;cursor:pointer;active:opacity:.8">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
        '<div><div style="font-size:10px;font-family:monospace;color:var(--text3)">'+_monEsc(o.kode||'—')+'</div>'+
        '<div style="font-size:13px;font-weight:800;color:var(--text)">'+_monEsc(o.nama||'—')+'</div></div>'+
        '<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+stColor+'18;color:'+stColor+'">'+_monEsc(o.status||'—')+'</span>'+
      '</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px">'+
        '<span style="font-size:10px;color:var(--text3)"><i class="ti ti-map-pin" style="font-size:11px"></i> '+_monEsc(_monAreaName(o.area_id))+'</span>'+
        '<span style="font-size:10px;font-weight:700;color:var(--c1)">'+odpAktif+'/'+odpCount+' ODP aktif</span>'+
        '<span style="font-size:10px;color:var(--text3)">'+(o.jumlah_port||0)+' port kapasitas</span>'+
      '</div>'+
      '<div style="font-size:10px;color:var(--c1);font-weight:600;display:flex;align-items:center;gap:4px"><i class="ti ti-chevron-right" style="font-size:12px"></i> Tap untuk lihat ODP</div>'+
    '</div>';
  }).join('')+
  _monPagiHTML(_monOdcPage,total,_monPgSize,"monOdcPageNav(-1)","monOdcPageNav(1)");
}

window.monOdcDetail = function(odcId){
  var odc = _monOdcData.find(function(o){return o.id===odcId;});
  if(!odc) return;
  var c = _monGetScopedCache();
  var odps = (c.odps||[]).filter(function(o){return o.odc_id===odcId;});
  var stColor=odc.status==='aktif'?'var(--green)':odc.status==='maintenance'?'var(--yellow)':'var(--red)';

  var html = '<div style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5)" onclick="this.remove()" id="mon-odc-detail-overlay">'+
    '<div onclick="event.stopPropagation()" style="position:fixed;bottom:0;left:0;right:0;background:var(--bg);border-radius:20px 20px 0 0;max-height:85vh;overflow-y:auto;-webkit-overflow-scrolling:touch">'+
      '<div style="padding:16px 16px 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
        '<div>'+
          '<div style="font-size:10px;font-family:monospace;color:var(--text3)">'+_monEsc(odc.kode||'—')+'</div>'+
          '<div style="font-size:16px;font-weight:800;color:var(--text)">'+_monEsc(odc.nama||'—')+'</div>'+
          '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:'+stColor+'18;color:'+stColor+'">'+_monEsc(odc.status||'—')+'</span>'+
        '</div>'+
        '<button onclick="document.getElementById(\'mon-odc-detail-overlay\').remove()" style="width:32px;height:32px;border-radius:50%;border:none;background:var(--bg3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2)"><i class="ti ti-x"></i></button>'+
      '</div>'+
      '<div style="padding:0 16px;margin-bottom:10px;font-size:12px;font-weight:700;color:var(--text2);display:flex;align-items:center;gap:6px"><i class="ti ti-plug" style="color:var(--c1)"></i> '+odps.length+' ODP terhubung</div>'+
      '<div style="padding:0 16px 24px">'+
      (odps.length ? odps.map(function(odp){
        var ps = typeof SOT!=='undefined' ? SOT.odpStats(odp.id) : {total:parseInt(odp.jumlah_port)||0,used:0,free:0,pct:0};
        var pct=ps.pct||0;
        var pctColor=pct>=90?'var(--red)':pct>=60?'var(--yellow)':'var(--green)';
        var stC=odp.status==='aktif'?'var(--green)':odp.status==='maintenance'?'var(--yellow)':'var(--red)';
        return '<div onclick="document.getElementById(\'mon-odc-detail-overlay\').remove();setTimeout(function(){monOdpDetail(\''+odp.id+'\');},100)" style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px;cursor:pointer">'+
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:10px;font-family:monospace;color:var(--text3)">'+_monEsc(odp.kode||'—')+'</div>'+
              '<div style="font-size:12px;font-weight:800;color:var(--text)">'+_monEsc(odp.nama||'—')+'</div>'+
            '</div>'+
            '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:'+stC+'18;color:'+stC+'">'+_monEsc(odp.status||'—')+'</span>'+
          '</div>'+
          '<div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden;margin-bottom:4px">'+
            '<div style="height:100%;width:'+Math.min(100,pct)+'%;background:'+pctColor+';border-radius:3px"></div>'+
          '</div>'+
          '<div style="font-size:10px;color:var(--text3);font-weight:600;display:flex;justify-content:space-between">'+
            '<span>'+ps.used+' terpakai · '+ps.free+' kosong · '+ps.total+' port</span>'+
            '<span style="color:'+pctColor+'">'+pct+'%</span>'+
          '</div>'+
          '<div style="font-size:10px;color:var(--c1);margin-top:4px"><i class="ti ti-chevron-right" style="font-size:11px"></i> Tap untuk lihat port</div>'+
        '</div>';
      }).join('') :
      '<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px">Tidak ada ODP terhubung</div>')+
      '</div>'+
    '</div>'+
  '</div>';

  var old = document.getElementById('mon-odc-detail-overlay');
  if(old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
};

function monOdpLoad(){
  var c=_monGetScopedCache();
  _monOdpData=c.odps||[];
  _monOdpPage=1;
  var selArea=document.getElementById('mon-odp-fil-area');
  if(selArea&&selArea.options.length<=1){
    (c.areas||[]).forEach(function(a){
      var o=document.createElement('option'); o.value=a.id; o.textContent=a.nama||a.kode; selArea.appendChild(o);
    });
  }
  monOdpRender();
}
window.monOdpSearch = function(q){ _monOdpPage=1; monOdpRender(q); };
window.monOdpPageNav = function(d){
  var q=(document.getElementById('mon-odp-search')||{}).value||'';
  var fA=(document.getElementById('mon-odp-fil-area')||{}).value||'';
  var data=_monOdpFiltered(q,fA);
  var pages=Math.max(1,Math.ceil(data.length/_monPgSize));
  _monOdpPage=Math.min(pages,Math.max(1,_monOdpPage+d));
  monOdpRender(q);
};
function _monOdpFiltered(q,fA){
  q=(q||'').toLowerCase().trim();
  fA=fA||((document.getElementById('mon-odp-fil-area')||{}).value||'');
  return _monOdpData.filter(function(o){
    if(fA&&o.area_id!==fA) return false;
    if(!q) return true;
    return (o.kode||'').toLowerCase().includes(q)||(o.nama||'').toLowerCase().includes(q);
  });
}
function monOdpRender(q){
  q=q!==undefined?q:((document.getElementById('mon-odp-search')||{}).value||'');
  var fA=(document.getElementById('mon-odp-fil-area')||{}).value||'';
  var data=_monOdpFiltered(q,fA);
  var total=data.length,aktif=data.filter(function(o){return o.status==='aktif';}).length;
  var penuh=0;
  data.forEach(function(o){var ps=typeof SOT!=='undefined'?SOT.odpStats(o.id):{pct:0};if(ps.pct>=100)penuh++;});
  var statsEl=document.getElementById('mon-odp-stats');
  if(statsEl) statsEl.innerHTML=[['var(--green)','Total',total],['var(--c1)','Aktif',aktif],['var(--red)','Penuh',penuh]].map(function(x){
    return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px;border:1.5px solid var(--border);text-align:center"><div style="font-size:20px;font-weight:800;color:'+x[0]+'">'+x[2]+'</div><div style="font-size:10px;font-weight:700;color:var(--text3)">'+x[1].toUpperCase()+'</div></div>';
  }).join('');
  var pages=Math.max(1,Math.ceil(total/_monPgSize));
  if(_monOdpPage>pages)_monOdpPage=1;
  var slice=data.slice((_monOdpPage-1)*_monPgSize,_monOdpPage*_monPgSize);
  var list=document.getElementById('mon-odp-list');
  if(!list) return;
  if(!slice.length){list.innerHTML='<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">Tidak ada ODP</div>';return;}
  list.innerHTML=slice.map(function(o){
    var ps=typeof SOT!=='undefined'?SOT.odpStats(o.id):{total:parseInt(o.jumlah_port)||0,used:0,free:0,pct:0};
    var pct=ps.pct||0;
    var pctColor=pct>=90?'var(--red)':pct>=60?'var(--yellow)':'var(--green)';
    var stColor=o.status==='aktif'?'var(--green)':o.status==='maintenance'?'var(--yellow)':'var(--red)';
    return '<div onclick="monOdpDetail(\''+o.id+'\')" style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px;cursor:pointer">'+
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:10px;font-family:monospace;color:var(--text3)">'+_monEsc(o.kode||'—')+'</div>'+
          '<div style="font-size:12px;font-weight:800;color:var(--text)">'+_monEsc(o.nama||'—')+'</div>'+
          '<div style="font-size:10px;color:var(--text3);margin-top:2px">'+_monEsc(_monAreaName(o.area_id))+'</div>'+
        '</div>'+
        '<div style="text-align:right;flex-shrink:0">'+
          '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:'+stColor+'18;color:'+stColor+'">'+_monEsc(o.status||'—')+'</span>'+
          '<div style="font-size:13px;font-weight:800;color:'+pctColor+';margin-top:4px">'+pct+'%</div>'+
        '</div>'+
      '</div>'+
      '<div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden;margin-bottom:4px">'+
        '<div style="height:100%;width:'+Math.min(100,pct)+'%;background:'+pctColor+';border-radius:3px;transition:width .4s"></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);font-weight:600">'+
        '<span>'+ps.used+' terpakai · '+ps.free+' kosong · '+ps.total+' port</span>'+
        '<span style="color:var(--c1)"><i class="ti ti-chevron-right" style="font-size:11px"></i> Detail port</span>'+
      '</div>'+
    '</div>';
  }).join('')+
  _monPagiHTML(_monOdpPage,total,_monPgSize,"monOdpPageNav(-1)","monOdpPageNav(1)");
}

window.monOdpDetail = function(odpId){
  var odp = _monOdpData.find(function(o){return o.id===odpId;});
  if(!odp){

    var cc = _monGetScopedCache();
    odp = (cc.odps||[]).find(function(o){return o.id===odpId;});
  }
  var c = _monGetScopedCache();
  var ports = (c.ports||[]).filter(function(p){return p.odp_id===odpId;});

  ports.sort(function(a,b){ return (parseInt(a.nomor_port)||0)-(parseInt(b.nomor_port)||0); });
  var ps = typeof SOT!=='undefined' ? SOT.odpStats(odpId) : {total:0,used:0,free:0,pct:0};
  var stColor = odp ? (odp.status==='aktif'?'var(--green)':odp.status==='maintenance'?'var(--yellow)':'var(--red)') : 'var(--text3)';

  function portCard(p){
    var isUsed = typeof PORT_STATUS!=='undefined' ? PORT_STATUS.isUsed(p.status) : p.status==='terpakai';
    var isRusak = p.status==='rusak';
    var pColor = isUsed?'var(--c2)':isRusak?'var(--red)':'var(--green)';
    var pBg    = isUsed?'rgba(249,115,22,.1)':isRusak?'var(--rg2)':'var(--gng2)';
    var pel    = p.cid_pelanggan ? _monPelByCid(p.cid_pelanggan) : null;
    return '<div style="background:var(--bg2);border-radius:12px;border:1.5px solid '+(isUsed?'rgba(249,115,22,.25)':isRusak?'rgba(220,38,38,.25)':'var(--border)')+';margin-bottom:8px;overflow:hidden">'+
      '<div style="padding:10px 14px;background:'+pBg+';display:flex;align-items:center;justify-content:space-between">'+
        '<div style="font-size:13px;font-weight:800;color:'+pColor+'">Port '+_monEsc(String(p.nomor_port||'?'))+'</div>'+
        '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,.4);color:'+pColor+'">'+
          (isUsed?'Terpakai':isRusak?'Rusak':'Kosong')+
        '</span>'+
      '</div>'+
      (isUsed && pel ?
        '<div style="padding:10px 14px">'+
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+
            '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--pu),#6d28d9);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0">'+
              _monEsc((pel.nama||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase())+
            '</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:13px;font-weight:800;color:var(--text)">'+_monEsc(pel.nama||'—')+'</div>'+
              '<div style="font-family:monospace;font-size:11px;color:var(--pu);font-weight:700">'+_monEsc(pel.cid||p.cid_pelanggan||'—')+'</div>'+
            '</div>'+
          '</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+
            _monDR('Paket', pel.paket ? '<span style="background:var(--pug);color:var(--pu);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">'+_monEsc(pel.paket)+'</span>' : '—')+
            _monDR('Status', '<span style="color:'+(pel.status==='aktif'?'var(--green)':'var(--red)')+'">'+_monEsc(pel.status||'—')+'</span>')+
            _monDR('Tgl Pasang', _monFmtDate(pel.tgl_pasang))+
            _monDR('Alamat', _monEsc(pel.alamat||'—'))+
            (pel.hp?_monDR('No. HP','<a href="tel:'+_monEsc(pel.hp)+'" style="color:var(--c1);font-weight:700">'+_monEsc(pel.hp)+'</a>'):'')+
            (pel.kecamatan?_monDR('Kecamatan',_monEsc(pel.kecamatan)):'') +
            (p.cid_pelanggan&&pel.sn_ont?_monDR('SN ONT','<span style="font-family:monospace;font-size:11px;background:var(--c1b);color:var(--c1);padding:2px 8px;border-radius:6px">'+_monEsc(pel.sn_ont)+'</span>'):'') +
          '</div>'+
        '</div>'
      : isUsed && p.cid_pelanggan ?
        '<div style="padding:10px 14px">'+
          '<div style="font-size:12px;font-weight:700;color:var(--pu);font-family:monospace">'+_monEsc(p.cid_pelanggan)+'</div>'+
          '<div style="font-size:10px;color:var(--text3);margin-top:2px">Detail pelanggan tidak ada di cache</div>'+
        '</div>'
      : isRusak ?
        '<div style="padding:8px 14px;font-size:11px;color:var(--red)">Port ditandai rusak</div>'
      : '')+
    '</div>';
  }

  function _monDR(lbl,val){
    return '<div style="background:var(--bg3);border-radius:8px;padding:7px 10px">'+
      '<div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">'+lbl+'</div>'+
      '<div style="font-size:12px;font-weight:600;color:var(--text)">'+val+'</div>'+
    '</div>';
  }

  var html = '<div style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5)" onclick="this.remove()" id="mon-odp-detail-overlay">'+
    '<div onclick="event.stopPropagation()" style="position:fixed;bottom:0;left:0;right:0;background:var(--bg);border-radius:20px 20px 0 0;max-height:88vh;overflow-y:auto;-webkit-overflow-scrolling:touch">'+
      '<div style="padding:16px 16px 0;display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;position:sticky;top:0;background:var(--bg);z-index:1;padding-bottom:12px;border-bottom:1px solid var(--border)">'+
        '<div>'+
          '<div style="font-size:10px;font-family:monospace;color:var(--text3)">'+(odp?_monEsc(odp.kode||'—'):'—')+'</div>'+
          '<div style="font-size:15px;font-weight:800;color:var(--text)">'+(odp?_monEsc(odp.nama||'—'):'ODP')+'</div>'+
          '<div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">'+
            '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:'+stColor+'18;color:'+stColor+'">'+(odp?_monEsc(odp.status||'—'):'—')+'</span>'+
            '<span style="font-size:10px;color:var(--c2);font-weight:700">'+ps.used+' terpakai</span>'+
            '<span style="font-size:10px;color:var(--green);font-weight:700">'+ps.free+' kosong</span>'+
          '</div>'+
        '</div>'+
        '<button onclick="document.getElementById(\'mon-odp-detail-overlay\').remove()" style="width:32px;height:32px;border-radius:50%;border:none;background:var(--bg3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);flex-shrink:0"><i class="ti ti-x"></i></button>'+
      '</div>'+
      '<div style="padding:0 16px;margin-bottom:8px">'+
        '<div style="height:7px;background:var(--bg4);border-radius:4px;overflow:hidden">'+
          '<div style="height:100%;width:'+Math.min(100,ps.pct)+'%;background:'+(ps.pct>=90?'var(--red)':ps.pct>=60?'var(--yellow)':'var(--c1)')+';border-radius:4px"></div>'+
        '</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:4px;text-align:right">'+ps.pct+'% utilisasi · '+ps.total+' total port</div>'+
      '</div>'+
      '<div style="padding:0 16px 24px">'+
      (ports.length ?
        ports.map(portCard).join('') :
        '<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-plug-x" style="font-size:24px;display:block;margin-bottom:8px;opacity:.4"></i>Tidak ada data port untuk ODP ini</div>')+
      '</div>'+
    '</div>'+
  '</div>';

  var old = document.getElementById('mon-odp-detail-overlay');
  if(old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
};

function monPortLoad(){
  var c=_monGetScopedCache();
  _monPortData=c.ports||[];
  _monPortFil=_monPortData;
  _monPortOffset=0;
  monPortRender();
}
window.monPortSearch = function(q){ _monPortOffset=0; monPortRender(); };
window.monPortPageNav = function(d){
  var filSt=((document.getElementById('mon-port-fil-status')||{}).value||'');
  var q=((document.getElementById('mon-port-search')||{}).value||'').toLowerCase().trim();
  var c=_monGetScopedCache(); var odpsMap={}; (c.odps||[]).forEach(function(o){odpsMap[o.id]=o;});
  _monPortFil=_monPortData.filter(function(p){
    if(filSt&&p.status!==filSt) return false;
    if(!q) return true;
    var odp=odpsMap[p.odp_id]||{};
    return String(p.nomor_port||'').includes(q)||(p.cid_pelanggan||'').toLowerCase().includes(q)||(odp.kode||'').toLowerCase().includes(q);
  });
  var pages=Math.max(1,Math.ceil(_monPortFil.length/_monPgSize));
  _monPortOffset=Math.min(pages-1,Math.max(0,_monPortOffset+d));
  _monPortRenderPage();
};
function monPortRender(){
  var filSt=((document.getElementById('mon-port-fil-status')||{}).value||'');
  var q=((document.getElementById('mon-port-search')||{}).value||'').toLowerCase().trim();
  var c=_monGetScopedCache(); var odpsMap={}; (c.odps||[]).forEach(function(o){odpsMap[o.id]=o;});
  _monPortFil=_monPortData.filter(function(p){
    if(filSt&&p.status!==filSt) return false;
    if(!q) return true;
    var odp=odpsMap[p.odp_id]||{};
    return String(p.nomor_port||'').includes(q)||(p.cid_pelanggan||'').toLowerCase().includes(q)||(odp.kode||'').toLowerCase().includes(q);
  });
  var all=_monPortData;
  var terpakai=all.filter(function(p){return p.status==='terpakai';}).length;
  var kosong=all.filter(function(p){return p.status==='kosong';}).length;
  var rusak=all.filter(function(p){return p.status==='rusak';}).length;
  var statsEl=document.getElementById('mon-port-stats');
  if(statsEl) statsEl.innerHTML=[['var(--c1)','Total',all.length],['var(--c2)','Terpakai',terpakai],['var(--green)','Kosong',kosong],['var(--red)','Rusak',rusak]].map(function(x){
    return '<div style="background:var(--bg2);border-radius:var(--rs);padding:10px 6px;border:1.5px solid var(--border);text-align:center"><div style="font-size:18px;font-weight:800;color:'+x[0]+'">'+x[2]+'</div><div style="font-size:9px;font-weight:700;color:var(--text3)">'+x[1].toUpperCase()+'</div></div>';
  }).join('');
  _monPortOffset=0;
  _monPortRenderPage();
}
function _monPortRenderPage(){
  var c=_monGetScopedCache(); var odpsMap={}; (c.odps||[]).forEach(function(o){odpsMap[o.id]=o;});
  var total=_monPortFil.length;
  var pages=Math.max(1,Math.ceil(total/_monPgSize));
  if(_monPortOffset>=pages)_monPortOffset=0;
  var slice=_monPortFil.slice(_monPortOffset*_monPgSize,(_monPortOffset+1)*_monPgSize);
  var list=document.getElementById('mon-port-list');
  if(!list) return;
  if(!slice.length){list.innerHTML='<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px">Tidak ada port</div>';return;}
  list.innerHTML=slice.map(function(p){
    var odp=odpsMap[p.odp_id]||{};
    var stColor=p.status==='terpakai'?'var(--c2)':p.status==='kosong'?'var(--green)':'var(--red)';
    return '<div style="background:var(--bg2);border-radius:10px;padding:10px 12px;border:1.5px solid var(--border);margin-bottom:6px;display:flex;align-items:center;gap:10px">'+
      '<div style="width:32px;height:32px;border-radius:8px;background:'+stColor+'15;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:'+stColor+';flex-shrink:0">P'+(p.nomor_port||'?')+'</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:11px;font-family:monospace;color:var(--text3)">'+_monEsc(odp.kode||'—')+'</div>'+
        (p.cid_pelanggan?'<div style="font-size:12px;font-weight:700;color:var(--pu)">'+_monEsc(p.cid_pelanggan)+'</div>':'')+
        (p.cid_pelanggan&&_monPelNama(p.cid_pelanggan)!=='—'?'<div style="font-size:11px;color:var(--text2)">'+_monEsc(_monPelNama(p.cid_pelanggan))+'</div>':'')+
      '</div>'+
      '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:'+stColor+'15;color:'+stColor+'">'+_monEsc(p.status||'—')+'</span>'+
    '</div>';
  }).join('')+
  _monPagiHTML(_monPortOffset+1,total,_monPgSize,"monPortPageNav(-1)","monPortPageNav(1)");
}

function monMasalahLoad(){
  var c=_monGetScopedCache();
  var list=document.getElementById('mon-masalah-list');
  if(!list) return;
  var masalah=[];
  _monOltData.filter(function(o){return o.status!=='aktif';}).forEach(function(o){
    masalah.push({sev:'high',ikon:'ti-antenna',kat:'OLT',judul:'OLT '+o.kode+' — '+o.status,detail:'Area: '+_monAreaName(o.area_id)});
  });
  (c.odcs||[]).filter(function(o){return o.status!=='aktif';}).forEach(function(o){
    masalah.push({sev:'medium',ikon:'ti-box',kat:'ODC',judul:'ODC '+o.kode+' — '+o.status,detail:'Area: '+_monAreaName(o.area_id)});
  });
  (c.odps||[]).forEach(function(o){
    var ps=typeof SOT!=='undefined'?SOT.odpStats(o.id):{pct:0,used:0,total:0};
    if(ps.pct>=90&&ps.total>0){
      masalah.push({sev:ps.pct>=100?'high':'medium',ikon:'ti-plug',kat:'ODP',judul:'ODP '+o.kode+' hampir penuh ('+ps.pct+'%)',detail:'Terpakai '+ps.used+'/'+ps.total+' port · '+_monAreaName(o.area_id)});
    }
  });
  var rusak=(c.ports||[]).filter(function(p){return p.status==='rusak';});
  if(rusak.length) masalah.push({sev:'medium',ikon:'ti-plug-x',kat:'Port',judul:rusak.length+' port berstatus Rusak',detail:'Perlu diperiksa dan ditangani'});
  (c.odps||[]).filter(function(o){return o.status!=='aktif'&&o.status!=='full';}).forEach(function(o){
    masalah.push({sev:'low',ikon:'ti-plug',kat:'ODP',judul:'ODP '+o.kode+' non-aktif',detail:'Status: '+o.status+' · '+_monAreaName(o.area_id)});
  });
  if(!masalah.length){
    list.innerHTML='<div style="padding:50px 20px;text-align:center"><div style="width:60px;height:60px;border-radius:16px;background:var(--gng2);display:flex;align-items:center;justify-content:center;margin:0 auto 14px"><i class="ti ti-circle-check" style="font-size:28px;color:var(--green)"></i></div><div style="font-size:15px;font-weight:800;color:var(--green);margin-bottom:6px">Semua Normal</div><div style="font-size:12px;color:var(--text3)">Tidak ada masalah jaringan yang terdeteksi</div></div>';
    return;
  }
  var sevColor={high:'var(--red)',medium:'var(--yellow)',low:'var(--c1)'};
  var sevBg={high:'var(--rg2)',medium:'var(--yg)',low:'var(--c1b)'};
  list.innerHTML='<div style="margin-bottom:8px;font-size:11px;font-weight:700;color:var(--text3)">'+masalah.length+' masalah terdeteksi</div>'+
    masalah.map(function(m){
      var col=sevColor[m.sev]||'var(--text3)', bg=sevBg[m.sev]||'var(--bg3)';
      return '<div style="background:var(--bg2);border-radius:12px;padding:12px 14px;border:1.5px solid var(--border);margin-bottom:8px;display:flex;align-items:flex-start;gap:10px">'+
        '<div style="width:34px;height:34px;border-radius:10px;background:'+bg+';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti '+m.ikon+'" style="font-size:16px;color:'+col+'"></i></div>'+
        '<div style="flex:1;min-width:0">'+
          '<span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:20px;background:'+bg+';color:'+col+'">'+m.kat+'</span>'+
          '<div style="font-size:12px;font-weight:700;color:var(--text);margin-top:3px">'+_monEsc(m.judul)+'</div>'+
          '<div style="font-size:11px;color:var(--text3)">'+_monEsc(m.detail)+'</div>'+
        '</div></div>';
    }).join('');
}

var _monFasumLoaded = false;

function monFasumLoad(){
  var el = document.getElementById('fas-area-list');
  if(el) el.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:20px;display:block;margin-bottom:8px;opacity:.4"></i>Memuat data FASUM…</div>';
  if(typeof SOT === 'undefined'){ setTimeout(monFasumLoad, 800); return; }
  SOT.refresh(false, function(){ monFasumRender(); });
}

function monFasumRender(){
  var sc    = _monGetScopedCache();
  var areas = sc.areas||[];
  var pelAll= sc.pelanggan||[];
  var JG    = (typeof JENIS_GRATIS!=='undefined') ? JENIS_GRATIS : ['FASUM','ODP_TEMPEL','ODC_TEMPEL'];
  var odps  = sc.odps||[];


  var pelGratis = pelAll.filter(function(p){
    return p.status==='aktif' && JG.indexOf(p.jenis_pelanggan)>=0;
  });


  var cntFasum  = pelGratis.filter(function(p){return p.jenis_pelanggan==='FASUM';}).length;
  var cntOdp    = pelGratis.filter(function(p){return p.jenis_pelanggan==='ODP_TEMPEL';}).length;
  var cntOdc    = pelGratis.filter(function(p){return p.jenis_pelanggan==='ODC_TEMPEL';}).length;
  var grandTotal= pelGratis.length;


  var kapTotal  = odps.reduce(function(s,o){return s+(parseInt(o.jumlah_port)||0);},0);

  function s(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; }
  s('fas-total-grand', grandTotal);
  s('fas-cnt-fasum',   cntFasum);
  s('fas-cnt-odp',     cntOdp);
  s('fas-cnt-odc',     cntOdc);
  var infoEl = document.getElementById('fas-info-kapasitas');
  if(infoEl) infoEl.textContent = grandTotal+' port dipakai FASUM/Gratis dari total '+kapTotal+' port kapasitas jaringan';


  var selArea = document.getElementById('fas-fil-area');
  if(selArea && selArea.options.length<=1){
    areas.forEach(function(a){
      var o = document.createElement('option');
      o.value = a.id; o.textContent = a.nama||a.kode;
      selArea.appendChild(o);
    });
  }


  var filArea = selArea ? selArea.value : '';
  var areasFil = filArea ? areas.filter(function(a){return a.id===filArea;}) : areas;

  var el = document.getElementById('fas-area-list');
  if(!el) return;

  var hasAny = false;
  var html = areasFil.map(function(a){
    var areaGratis = pelGratis.filter(function(p){return p.area_id===a.id;});
    if(!areaGratis.length) return '';
    hasAny = true;

    var aFasum = areaGratis.filter(function(p){return p.jenis_pelanggan==='FASUM';});
    var aOdpT  = areaGratis.filter(function(p){return p.jenis_pelanggan==='ODP_TEMPEL';});
    var aOdcT  = areaGratis.filter(function(p){return p.jenis_pelanggan==='ODC_TEMPEL';});


    var areaOdps = odps.filter(function(o){return o.area_id===a.id;});
    var kapArea  = areaOdps.reduce(function(s,o){return s+(parseInt(o.jumlah_port)||0);},0);

    function typeSection(label, color, bgColor, icoClass, list){
      if(!list.length) return '';
      return '<div style="margin-bottom:10px">'+
        '<div style="font-size:10px;font-weight:700;color:'+color+';text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:flex;align-items:center;gap:5px">'+
          '<i class="ti '+icoClass+'" style="font-size:12px"></i> '+label+' ('+list.length+')'+
        '</div>'+
        list.map(function(p){
          var odpNama = '—';
          if(p.odp_id){
            var odpObj = (sc.odps||[]).find(function(o){return o.id===p.odp_id;});
            if(odpObj) odpNama = odpObj.kode||odpObj.nama||'—';
          }
          return '<div style="background:var(--bg3);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:10px">'+
            '<div style="width:34px;height:34px;border-radius:10px;background:'+bgColor+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:800;color:'+color+'">'+
              _monEsc((p.nama||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase())+
            '</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:12px;font-weight:700;color:var(--text)">'+_monEsc(p.nama||'—')+'</div>'+
              '<div style="font-size:10px;color:var(--text3);margin-top:1px;display:flex;gap:8px;flex-wrap:wrap">'+
                '<span style="font-family:monospace;color:var(--pu);font-weight:700">'+_monEsc(p.cid||'—')+'</span>'+
                (odpNama!=='—'?'<span><i class="ti ti-plug" style="font-size:10px"></i> '+_monEsc(odpNama)+'</span>':'')+
                (p.alamat?'<span>'+_monEsc(p.alamat)+'</span>':'')+
              '</div>'+
            '</div>'+
            '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:'+bgColor+';color:'+color+';white-space:nowrap">'+
              (p.jenis_pelanggan==='FASUM'?'FASUM':p.jenis_pelanggan==='ODP_TEMPEL'?'ODP Tempel':'ODC Tempel')+
            '</span>'+
          '</div>';
        }).join('')+
      '</div>';
    }

    return '<div style="background:var(--bg2);border-radius:var(--r);padding:14px;border:1.5px solid rgba(124,58,237,.2);box-shadow:var(--sh-sm);margin-bottom:4px">'+

      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)">'+
        '<div style="display:flex;align-items:center;gap:6px">'+
          '<i class="ti ti-map-pin" style="font-size:16px;color:var(--red)"></i>'+
          '<div>'+
            '<div style="font-size:14px;font-weight:800;color:var(--text)">'+_monEsc(a.nama||a.kode)+'</div>'+
            '<div style="font-size:10px;color:var(--text3)">Kapasitas: '+kapArea+' port</div>'+
          '</div>'+
        '</div>'+
        '<div style="text-align:right">'+
          '<div style="font-size:22px;font-weight:800;color:var(--pu);line-height:1">'+areaGratis.length+'</div>'+
          '<div style="font-size:9px;color:var(--text3);font-weight:700">FASUM/Gratis</div>'+
        '</div>'+
      '</div>'+

      (aFasum.length||aOdpT.length||aOdcT.length?
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+
          (aFasum.length?'<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(124,58,237,.1);color:var(--pu)"><i class="ti ti-school" style="font-size:10px"></i> FASUM: '+aFasum.length+'</span>':'')+
          (aOdpT.length ?'<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(8,145,178,.1);color:var(--cyan)"><i class="ti ti-plug" style="font-size:10px"></i> ODP Tempel: '+aOdpT.length+'</span>':'')+
          (aOdcT.length ?'<span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(217,119,6,.1);color:var(--yellow)"><i class="ti ti-box" style="font-size:10px"></i> ODC Tempel: '+aOdcT.length+'</span>':'')+
        '</div>':'')+

      typeSection('FASUM','var(--pu)','rgba(124,58,237,.1)','ti-school',aFasum)+
      typeSection('ODP Tempel','var(--cyan)','rgba(8,145,178,.1)','ti-plug',aOdpT)+
      typeSection('ODC Tempel','var(--yellow)','rgba(217,119,6,.1)','ti-box',aOdcT)+
    '</div>';
  }).join('');

  el.innerHTML = hasAny ? html :
    '<div style="padding:50px 20px;text-align:center">'+
      '<div style="width:60px;height:60px;border-radius:16px;background:rgba(124,58,237,.08);display:flex;align-items:center;justify-content:center;margin:0 auto 14px">'+
        '<i class="ti ti-school" style="font-size:28px;color:var(--pu);opacity:.5"></i></div>'+
      '<div style="font-size:14px;font-weight:800;color:var(--text2);margin-bottom:6px">Tidak Ada Data FASUM</div>'+
      '<div style="font-size:12px;color:var(--text3)">Belum ada pelanggan FASUM/Gratis terdaftar di area ini</div>'+
    '</div>';
  _monFasumLoaded = true;
}

window.monFasumLoad   = monFasumLoad;
window.monFasumRender = monFasumRender;

var _fasData   = [];
var _fasLoaded = false;
var _fasPg     = 1;
var _fasPgSize = 20;
var _fasQ      = '';

var _fasDrill = { level:'area', area_id:'', area_nm:'', kec:'', kel:'', rw:'' };

if(typeof _navDispatch!=='undefined' && typeof _navDispatch.register==='function'){
  _navDispatch.register('fasum', function(){ fasLoad(); });
}

function fasLoad(force){
  /* Always fetch fresh from Supabase */
  var sb=(typeof getSB==='function')?getSB():null; if(!sb) return;
  var listEl=document.getElementById('fas-drill-list');
  if(listEl) listEl.innerHTML='<div style="padding:30px;text-align:center;color:var(--text3);font-size:12px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:20px;display:block;margin-bottom:8px;opacity:.4"></i>Memuat data…</div>';

  var q=sb.from('pelanggan')
    .select('id,cid,nama,status,jenis_pelanggan,area_id,area_coverage,alamat,hp,odp_id,nomor_port,tgl_pasang,keterangan,kecamatan,kelurahan,rw,rt,paket,sn_ont,teknisi_pasang,lat,lng')
    .in('jenis_pelanggan',['FASUM','ODP_TEMPEL','ODC_TEMPEL'])
    .order('nama');

  if(typeof _scopedQuery==='function') q=_scopedQuery(q,'area_id');

  q.then(function(r){
    _fasData=(!r.error&&r.data)?r.data:[];
    _fasLoaded=true;
    _fasDrill={level:'area',area_id:'',area_nm:'',kec:'',kel:'',rw:''};
    _fasPg=1;
    fasRender();
  }).catch(function(){ fasRender(); });
}

function fasSearch(v){
  _fasQ=v||''; _fasPg=1;
  if(_fasQ){ _fasDrill={level:'pelanggan',area_id:'',area_nm:'',kec:'',kel:'',rw:''}; }
  else { _fasDrill={level:'area',area_id:'',area_nm:'',kec:'',kel:'',rw:''}; }
  fasRender();
}

window.fasDrillReset=function(){ _fasDrill={level:'area',area_id:'',area_nm:'',kec:'',kel:'',rw:''};_fasPg=1;fasRender(); };
window.fasDrillTo=function(level){
  if(level==='area'){ _fasDrill.level='area';_fasDrill.kec='';_fasDrill.kel='';_fasDrill.rw=''; }
  else if(level==='kec'){ _fasDrill.level='kec';_fasDrill.kel='';_fasDrill.rw=''; }
  else if(level==='kel'){ _fasDrill.level='kel';_fasDrill.rw=''; }
  _fasPg=1; fasRender();
};
window.fasDrillArea=function(aId,aNm){ _fasDrill={level:'kec',area_id:aId,area_nm:aNm,kec:'',kel:'',rw:''};_fasPg=1;fasRender(); };
window.fasDrillKec=function(kec){ _fasDrill.level='kel';_fasDrill.kec=kec;_fasDrill.kel='';_fasDrill.rw='';_fasPg=1;fasRender(); };
window.fasDrillKel=function(kel){ _fasDrill.level='rw';_fasDrill.kel=kel;_fasDrill.rw='';_fasPg=1;fasRender(); };
window.fasDrillRw=function(rw){ _fasDrill.level='pelanggan';_fasDrill.rw=rw;_fasPg=1;fasRender(); };
window.fasPgNav=function(d){
  var pages=parseInt(document.getElementById('fas-pagi-info').textContent.split('/')[1])||1;
  _fasPg=Math.min(pages,Math.max(1,_fasPg+d)); fasRender();
};

function _fasFiltered(){
  var fJenis=(document.getElementById('fas-fil-jenis')||{}).value||'';
  var sc=window.SOT?SOT.cache():{};
  var areaNm={};(sc.areas||[]).forEach(function(a){areaNm[a.id]=a.nama||a.kode;});

  return _fasData.filter(function(p){
    if(fJenis&&p.jenis_pelanggan!==fJenis) return false;

    if(_fasDrill.area_id && p.area_id!==_fasDrill.area_id) return false;
    if(_fasDrill.kec && _fasDrill.kec!=='(tidak ada kecamatan)' && (p.kecamatan||'')!==_fasDrill.kec) return false;
    if(_fasDrill.kec==='(tidak ada kecamatan)' && (p.kecamatan||'')!=='') return false;
    if(_fasDrill.kel && _fasDrill.kel!=='(tidak ada kelurahan)' && (p.kelurahan||'')!==_fasDrill.kel) return false;
    if(_fasDrill.kel==='(tidak ada kelurahan)' && (p.kelurahan||'')!=='') return false;
    if(_fasDrill.rw && _fasDrill.rw!=='(tanpa RW)' && (p.rw||'')!==_fasDrill.rw) return false;
    if(_fasDrill.rw==='(tanpa RW)' && (p.rw||'')!=='') return false;
    if(_fasQ){
      var ql=_fasQ.toLowerCase();
      return (p.nama||'').toLowerCase().includes(ql)||(p.cid||'').toLowerCase().includes(ql)||(p.alamat||'').toLowerCase().includes(ql)||(p.kecamatan||'').toLowerCase().includes(ql);
    }
    return true;
  });
}

function fasRender(){
  var sc=window.SOT?SOT.cache():{};
  var areaNm={};(sc.areas||[]).forEach(function(a){areaNm[a.id]=a.nama||a.kode;});
  var odpNm={};(sc.odps||[]).forEach(function(o){odpNm[o.id]=o.kode||o.nama;});


  var all=_fasData;
  var fJenis=(document.getElementById('fas-fil-jenis')||{}).value||'';
  if(fJenis) all=all.filter(function(p){return p.jenis_pelanggan===fJenis;});
  function s(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  s('fas-kpi-total',all.length);
  s('fas-kpi-fasum',all.filter(function(p){return p.jenis_pelanggan==='FASUM';}).length);
  s('fas-kpi-odp',  all.filter(function(p){return p.jenis_pelanggan==='ODP_TEMPEL';}).length);
  s('fas-kpi-odc',  all.filter(function(p){return p.jenis_pelanggan==='ODC_TEMPEL';}).length);


  var bc=document.getElementById('fas-breadcrumb');
  var showBc=_fasDrill.level!=='area'||_fasQ;
  if(bc) bc.style.display=showBc?'block':'none';
  function setBc(id,lbl,show){
    var sp=document.getElementById(id);var lb=document.getElementById(id+'-lbl');
    if(sp) sp.style.display=show?'inline':'none';
    if(lb) lb.textContent=lbl;
  }
  setBc('fas-bc-area',_fasDrill.area_nm,!!_fasDrill.area_id);
  setBc('fas-bc-kec',_fasDrill.kec,!!_fasDrill.kec);
  setBc('fas-bc-kel',_fasDrill.kel,!!_fasDrill.kel);
  setBc('fas-bc-rw','RW '+_fasDrill.rw,!!_fasDrill.rw&&_fasDrill.level==='pelanggan');

  var listEl=document.getElementById('fas-drill-list');
  if(!listEl) return;
  var pagiEl=document.getElementById('fas-pagi');

  var jenisBadge=function(jp){
    var lbl={'FASUM':'FASUM','ODP_TEMPEL':'ODP Tempel','ODC_TEMPEL':'ODC Tempel'};
    var col={'FASUM':'var(--pu)','ODP_TEMPEL':'var(--cyan)','ODC_TEMPEL':'var(--yellow)'};
    var bg={'FASUM':'rgba(124,58,237,.1)','ODP_TEMPEL':'rgba(8,145,178,.1)','ODC_TEMPEL':'rgba(217,119,6,.1)'};
    return '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;background:'+(bg[jp]||'var(--bg3)')+';color:'+(col[jp]||'var(--text3)')+'">'+(lbl[jp]||jp)+'</span>';
  };

  function groupCard(label,total,sublabel,onclick,icon){
    var pctColor=total>20?'var(--red)':total>10?'var(--yellow)':'var(--pu)';
    return '<div onclick="'+onclick+'" style="background:var(--bg2);border-radius:var(--r);padding:14px 16px;border:1.5px solid rgba(124,58,237,.15);box-shadow:var(--sh-sm);cursor:pointer;display:flex;align-items:center;gap:12px;active:opacity:.8">'+
      '<div style="width:40px;height:40px;border-radius:12px;background:rgba(124,58,237,.08);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti '+icon+'" style="font-size:18px;color:var(--pu)"></i></div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:800;color:var(--text)">'+_monEsc(label)+'</div>'+
        '<div style="font-size:10px;color:var(--text3);margin-top:2px">'+_monEsc(sublabel)+'</div>'+
      '</div>'+
      '<div style="font-size:24px;font-weight:800;color:'+pctColor+'">'+total+'</div>'+
      '<i class="ti ti-chevron-right" style="color:var(--text4);font-size:16px;flex-shrink:0"></i>'+
    '</div>';
  }

  function pelCard(p){
    var ini=(p.nama||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase();
    var jc={'FASUM':'var(--pu)','ODP_TEMPEL':'var(--cyan)','ODC_TEMPEL':'var(--yellow)'};
    var jbg={'FASUM':'rgba(124,58,237,.1)','ODP_TEMPEL':'rgba(8,145,178,.1)','ODC_TEMPEL':'rgba(217,119,6,.1)'};
    var stColor=p.status==='aktif'?'var(--green)':'var(--red)';
    var odpText=p.odp_id&&odpNm[p.odp_id]?odpNm[p.odp_id]:'';
    var locParts=[(p.rw?'RW '+p.rw:''),(p.kelurahan||''),(p.kecamatan||'')].filter(Boolean).join(' · ');
    return '<div style="background:var(--bg2);border-radius:var(--r);padding:12px 14px;border:1.5px solid var(--border);box-shadow:var(--sh-sm)">'+
      '<div style="display:flex;align-items:flex-start;gap:10px">'+
        '<div style="width:38px;height:38px;border-radius:10px;background:'+(jbg[p.jenis_pelanggan]||'var(--bg3)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;color:'+(jc[p.jenis_pelanggan]||'var(--text3)')+'">'+_monEsc(ini)+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
            '<div style="font-size:13px;font-weight:800;color:var(--text)">'+_monEsc(p.nama||'—')+'</div>'+
            jenisBadge(p.jenis_pelanggan)+
          '</div>'+
          '<div style="font-family:monospace;font-size:11px;color:var(--pu);font-weight:700;margin-bottom:4px">'+_monEsc(p.cid||'—')+'</div>'+
          '<div style="font-size:10px;color:var(--text3);display:flex;gap:8px;flex-wrap:wrap">'+
            '<span><i class="ti ti-map-pin" style="font-size:10px"></i> '+_monEsc(areaNm[p.area_id]||p.area_coverage||'—')+'</span>'+
            (locParts?'<span>'+_monEsc(locParts)+'</span>':'')+
            (odpText?'<span><i class="ti ti-plug" style="font-size:10px"></i> '+_monEsc(odpText)+(p.nomor_port?' P'+p.nomor_port:'')+'</span>':'')+
            '<span style="color:'+stColor+';font-weight:700">'+_monEsc(p.status||'—')+'</span>'+
          '</div>'+
          (p.paket&&p.paket!=='Gratis'?'<div style="margin-top:4px"><span style="font-size:10px;font-weight:700;background:var(--c1b);color:var(--c1);padding:2px 8px;border-radius:20px">'+_monEsc(p.paket)+'</span></div>':'')+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">'+
        (p.hp?'<a href="tel:'+_monEsc(p.hp)+'" style="flex:1;text-align:center;padding:7px;background:rgba(8,145,178,.08);border:1px solid rgba(8,145,178,.2);border-radius:8px;font-size:11px;font-weight:700;color:var(--cyan);text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px"><i class="ti ti-phone" style="font-size:12px"></i>Hubungi</a>':'<div style="flex:1"></div>')+
        '<button onclick="fasEdit(\''+p.id+'\')" style="flex:1;padding:7px;background:var(--c1b);border:1px solid var(--border2);border-radius:8px;font-size:11px;font-weight:700;color:var(--c1);cursor:pointer;font-family:Sora,sans-serif;touch-action:manipulation;display:flex;align-items:center;justify-content:center;gap:4px"><i class="ti ti-pencil" style="font-size:12px"></i>Edit</button>'+
        '<button onclick="fasDel(\''+p.id+'\',\''+_monEsc(p.nama||'')+'\')" style="flex:1;padding:7px;background:var(--rg2);border:1px solid rgba(220,38,38,.2);border-radius:8px;font-size:11px;font-weight:700;color:var(--red);cursor:pointer;font-family:Sora,sans-serif;touch-action:manipulation;display:flex;align-items:center;justify-content:center;gap:4px"><i class="ti ti-trash" style="font-size:12px"></i>Hapus</button>'+
      '</div>'+
    '</div>';
  }


  var d = _fasFiltered();


  if(_fasQ){
    if(!d.length){ listEl.innerHTML='<div style="padding:40px;text-align:center;color:var(--text3)"><i class="ti ti-search" style="font-size:28px;display:block;opacity:.3;margin-bottom:8px"></i>Tidak ditemukan</div>'; if(pagiEl)pagiEl.style.display='none'; return; }
    var pages=Math.max(1,Math.ceil(d.length/_fasPgSize));
    if(_fasPg>pages)_fasPg=1;
    var slice=d.slice((_fasPg-1)*_fasPgSize,_fasPg*_fasPgSize);
    listEl.innerHTML=slice.map(pelCard).join('');
    _fasSetPagi(pages);
    return;
  }

  if(_fasDrill.level==='area'){

    if(!d.length){ listEl.innerHTML='<div style="padding:40px;text-align:center;color:var(--text3)"><i class="ti ti-school" style="font-size:28px;display:block;opacity:.3;margin-bottom:8px"></i>Belum ada data</div>'; if(pagiEl)pagiEl.style.display='none'; return; }
    var byArea={};
    d.forEach(function(p){
      var aid=p.area_id||'';
      if(!byArea[aid]) byArea[aid]={id:aid,nama:areaNm[aid]||p.area_coverage||'Tanpa Area',total:0,f:0,odp:0,odc:0};
      byArea[aid].total++; if(p.jenis_pelanggan==='FASUM')byArea[aid].f++; else if(p.jenis_pelanggan==='ODP_TEMPEL')byArea[aid].odp++; else byArea[aid].odc++;
    });
    var aList=Object.values(byArea).sort(function(a,b){return b.total-a.total;});
    listEl.innerHTML=aList.map(function(a){
      var sub=[(a.f?'FASUM: '+a.f:''),(a.odp?'ODP Tempel: '+a.odp:''),(a.odc?'ODC Tempel: '+a.odc:'')].filter(Boolean).join(' · ');
      return groupCard(a.nama,a.total,sub,'fasDrillArea(\''+a.id+'\',\''+a.nama.replace(/'/g,"\\'")+'\')', 'ti-map-pin');
    }).join('');
    if(pagiEl)pagiEl.style.display='none';
    return;
  }

  if(_fasDrill.level==='kec'){
    var byKec={};
    d.forEach(function(p){var k=p.kecamatan||'';if(!byKec[k])byKec[k]=0;byKec[k]++;});
    var kList=Object.keys(byKec).sort(function(a,b){return byKec[b]-byKec[a];});
    /* Jika semua data tidak punya kecamatan → langsung tampil pelanggan */
    var hasRealKec = kList.some(function(k){return k!=='';});
    if(!hasRealKec){
      _fasDrill.level='pelanggan';
    } else {
      listEl.innerHTML=kList.map(function(k){
        var lbl=k||'(tidak ada kecamatan)';
        return groupCard(lbl,byKec[k],byKec[k]+' pelanggan','fasDrillKec(\''+lbl.replace(/'/g,"\\'")+'\')', 'ti-building-community');
      }).join('');
      if(pagiEl)pagiEl.style.display='none';
      return;
    }
  }

  if(_fasDrill.level==='kel'){
    var byKel={};
    d.forEach(function(p){var k=p.kelurahan||'';if(!byKel[k])byKel[k]=0;byKel[k]++;});
    var kl=Object.keys(byKel).sort(function(a,b){return byKel[b]-byKel[a];});
    var hasRealKel = kl.some(function(k){return k!=='';});
    if(!hasRealKel){
      _fasDrill.level='pelanggan';
    } else {
      listEl.innerHTML=kl.map(function(k){
        var lbl=k||'(tidak ada kelurahan)';
        return groupCard(lbl,byKel[k],'Kelurahan/Desa','fasDrillKel(\''+lbl.replace(/'/g,"\\'")+'\')','ti-home-2');
      }).join('');
      if(pagiEl)pagiEl.style.display='none';
      return;
    }
  }

  if(_fasDrill.level==='rw'){
    var byRw={};
    d.forEach(function(p){var r=p.rw||'';if(!byRw[r])byRw[r]=0;byRw[r]++;});
    var rl=Object.keys(byRw).sort(function(a,b){return (a<b?-1:1);});
    var hasRealRw = rl.some(function(r){return r!=='';});
    if(!hasRealRw){
      _fasDrill.level='pelanggan';
    } else {
      listEl.innerHTML=rl.map(function(r){
        var lbl=r||'(tanpa RW)';
        return groupCard(r?'RW '+r:lbl,byRw[r],'Klik untuk lihat detail','fasDrillRw(\''+lbl.replace(/'/g,"\\'")+'\')','ti-users');
      }).join('');
      if(pagiEl)pagiEl.style.display='none';
      return;
    }
  }


  if(!d.length){ listEl.innerHTML='<div style="padding:40px;text-align:center;color:var(--text3)"><i class="ti ti-users-minus" style="font-size:28px;display:block;opacity:.3;margin-bottom:8px"></i>Tidak ada pelanggan di RW ini</div>'; if(pagiEl)pagiEl.style.display='none'; return; }
  var pages2=Math.max(1,Math.ceil(d.length/_fasPgSize));
  if(_fasPg>pages2)_fasPg=1;
  var slice2=d.slice((_fasPg-1)*_fasPgSize,_fasPg*_fasPgSize);

  var locHdr='';
  if(_fasDrill.rw) locHdr='<div style="font-size:11px;font-weight:700;color:var(--text3);padding:8px 0 6px;display:flex;align-items:center;gap:5px"><i class="ti ti-users" style="color:var(--pu)"></i> RW '+_monEsc(_fasDrill.rw)+' · '+d.length+' pelanggan</div>';
  listEl.innerHTML=locHdr+slice2.map(pelCard).join('');
  _fasSetPagi(pages2);
}

function _fasSetPagi(pages){
  var pagiEl=document.getElementById('fas-pagi');
  var infoEl=document.getElementById('fas-pagi-info');
  var prevEl=document.getElementById('fas-prev');
  var nextEl=document.getElementById('fas-next');
  if(!pagiEl) return;
  if(pages<=1){ pagiEl.style.display='none'; return; }
  pagiEl.style.display='block';
  if(infoEl) infoEl.textContent=_fasPg+' / '+pages;
  if(prevEl) prevEl.disabled=_fasPg<=1;
  if(nextEl) nextEl.disabled=_fasPg>=pages;
}

window.fasExport=function(){
  var d=_fasFiltered();
  if(!d.length){if(typeof toast==='function')toast('Tidak ada data untuk diekspor','err');return;}
  var sc=window.SOT?SOT.cache():{};
  var areaById={};(sc.areas||_areaData||[]).forEach(function(a){areaById[a.id]=a.kode||a.nama||'';});
  var odpById={};(sc.odps||_pelOdpList||[]).forEach(function(o){odpById[o.id]=o.kode||o.nama||'';});

  var hdr=['cid','nama','jenis','status','area_kode','kecamatan','kelurahan','rw','rt','alamat',
           'no_hp','nik','odp_kode','nomor_port','paket','tgl_pasang',
           'sn_ont','mac_ont','ont_model','teknisi_pasang','lat','lng','keterangan'];
  var rows=d.map(function(p){
    return [
      p.cid||'', p.nama||'', p.jenis_pelanggan||'', p.status||'',
      areaById[p.area_id]||p.area_coverage||'',
      p.kecamatan||'', p.kelurahan||'', p.rw||'', p.rt||'', p.alamat||'',
      p.hp||'', p.nik||'',
      p.odp_id?odpById[p.odp_id]||'':'',
      p.nomor_port||'', p.paket||'', p.tgl_pasang||'',
      p.sn_ont||'', p.mac_ont||'', p.ont_model||'',
      p.teknisi_pasang||'', p.lat||'', p.lng||'', p.keterangan||''
    ].map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');
  });
  var csv=hdr.map(function(h){return '"'+h+'"';}).join(',')+'\n'+rows.join('\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='fasum_gratis_export_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  if(typeof toast==='function')toast('Export selesai — '+d.length+' data (format re-importable)','ok');
};

/* ── Import CSV ── */
window.fasImport=function(input){
  var file=input.files&&input.files[0]; if(!file){return;}
  var sb=(typeof getSB==='function')?getSB():null;
  if(!sb){if(typeof toast==='function')toast('Database tidak terhubung','err');return;}
  if(typeof toast==='function')toast('Membaca file CSV…','info');
  var reader=new FileReader();
  reader.onload=function(e){
    var text=e.target.result;
    /* Strip BOM */
    if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
    /* BOM handled by charCodeAt above */
    var lines=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(function(l){return l.trim();});
    if(lines.length<2){if(typeof toast==='function')toast('File CSV kosong atau format salah','err');return;}

    /* Auto-detect separator */
    var _sep=',';
    if((lines[0].match(/	/g)||[]).length>(lines[0].match(/,/g)||[]).length) _sep='	';
    else if((lines[0].match(/;/g)||[]).length>(lines[0].match(/,/g)||[]).length) _sep=';';

    /* Parse line helper (handles quoted fields) */
    function parseLine(line){
      var res=[],cur='',inQ=false;
      for(var i=0;i<line.length;i++){
        var c=line[i];
        if(c==='"'){inQ=!inQ;}
        else if(c===_sep&&!inQ){res.push(cur.trim());cur='';}
        else{cur+=c;}
      }
      res.push(cur.trim());
      return res;
    }

    /* Column alias map — normalize header names */
    var _alias={
      'cid':'cid','nama':'nama','jenis':'jenis','jenis pelanggan':'jenis','jenis_pelanggan':'jenis',
      'status':'status','area':'area_kode','area_kode':'area_kode','area_coverage':'area_kode',
      'kecamatan':'kecamatan','kelurahan':'kelurahan','rw':'rw','rt':'rt','alamat':'alamat',
      'no hp':'no_hp','no. hp':'no_hp','no_hp':'no_hp','hp':'no_hp','telepon':'no_hp',
      'nik':'nik',
      'odp':'odp_kode','odp_kode':'odp_kode','odp kode':'odp_kode',
      'nomor port':'nomor_port','nomor_port':'nomor_port','no port':'nomor_port','port':'nomor_port',
      'paket':'paket',
      'tgl pasang':'tgl_pasang','tgl_pasang':'tgl_pasang','tanggal pasang':'tgl_pasang',
      'sn ont':'sn_ont','sn_ont':'sn_ont','serial number':'sn_ont','serial ont':'sn_ont',
      'mac ont':'mac_ont','mac_ont':'mac_ont','mac address':'mac_ont',
      'ont model':'ont_model','ont_model':'ont_model','model ont':'ont_model',
      'teknisi pasang':'teknisi_pasang','teknisi_pasang':'teknisi_pasang','teknisi':'teknisi_pasang',
      'lat':'lat','lng':'lng','longitude':'lng','latitude':'lat',
      'keterangan':'keterangan'
    };

    /* Parse headers */
    var rawHdrs=parseLine(lines[0]);
    var hdrs=rawHdrs.map(function(h){
      var clean=h.replace(/[\x00-\x1f"]/g,'').trim().toLowerCase();

      return _alias[clean]||clean;
    });


    var sc=window.SOT?SOT.cache():{};
    var _areas=sc.areas||_areaData||[];
    var _odps=sc.odps||window._odpData||_pelOdpList||[];


    var areaByKode={},areaByNama={};
    _areas.forEach(function(a){
      if(a.kode) areaByKode[(a.kode||'').toLowerCase()]=a;
      if(a.nama) areaByNama[(a.nama||'').toLowerCase()]=a;
    });
    var odpByKode={};
    _odps.forEach(function(o){
      if(o.kode) odpByKode[(o.kode||'').toLowerCase()]=o;
      if(o.nama) odpByKode[(o.nama||'').toLowerCase()]=o;
    });


    var jMap={
      'fasum':'FASUM','fasilitasumum':'FASUM','fasilitas umum':'FASUM',
      'odp tempel':'ODP_TEMPEL','odp_tempel':'ODP_TEMPEL','odptempel':'ODP_TEMPEL',
      'odc tempel':'ODC_TEMPEL','odc_tempel':'ODC_TEMPEL','odctempel':'ODC_TEMPEL'
    };

    var rows=lines.slice(1);
    var ops=[];var skip=0;
    rows.forEach(function(row){
      if(!row.trim())return;
      var vals=parseLine(row);
      var r={};
      hdrs.forEach(function(h,i){r[h]=(vals[i]||'').replace(/^"|"$/g,'').trim();});

      var nm=r.nama||''; var cid=r.cid||'';
      if(!nm||!cid){skip++;return;}


      var jRaw=(r.jenis||'FASUM').toLowerCase().replace(/\s+/g,'');
      var jenis=jMap[jRaw]||jMap[r.jenis.toLowerCase()]||'FASUM';


      var areaKodeRaw=(r.area_kode||'').trim().toLowerCase();
      var areaObj=areaByKode[areaKodeRaw]||areaByNama[areaKodeRaw]||null;


      var odpKodeRaw=(r.odp_kode||'').trim().toLowerCase();
      var odpObj=odpByKode[odpKodeRaw]||null;
      var odpId=odpObj?odpObj.id:null;

      if(!areaObj&&odpObj&&odpObj.area_id){
        areaObj=_areas.find(function(a){return a.id===odpObj.area_id;})||null;
      }

      var payload={
        cid:cid,
        nama:nm,
        jenis_pelanggan:jenis,
        status:(r.status||'aktif').toLowerCase()||'aktif',
        area_id:areaObj?areaObj.id:null,
        area_coverage:areaObj?(areaObj.nama||areaObj.kode):(r.area_kode||null),
        kecamatan:r.kecamatan||null,
        kelurahan:r.kelurahan||null,
        rw:r.rw||null,
        rt:r.rt||null,
        alamat:r.alamat||null,
        hp:r.no_hp||null,
        nik:r.nik||null,
        odp_id:odpId,
        nomor_port:r.nomor_port?parseInt(r.nomor_port)||null:null,
        paket:r.paket||'Gratis',
        tgl_pasang:r.tgl_pasang||null,
        sn_ont:r.sn_ont||null,
        mac_ont:r.mac_ont||null,
        ont_model:r.ont_model||null,
        teknisi_pasang:r.teknisi_pasang||null,
        lat:r.lat?parseFloat(r.lat)||null:null,
        lng:r.lng?parseFloat(r.lng)||null:null,
        keterangan:r.keterangan||null,
        tipe_recurring:null,
        nominal_otf:0
      };
      ops.push(payload);
    });

    if(!ops.length){if(typeof toast==='function')toast('Tidak ada baris valid (skip: '+skip+')','err');input.value='';return;}
    if(!confirm('Import '+ops.length+' baris FASUM/Gratis?\n\nData dengan CID yang sudah ada akan diperbarui (upsert by CID).')){{input.value='';return;}}


    var _needOdp=(ops.some(function(o){return !o.odp_id;}) && lines[0].toLowerCase().indexOf('odp')>=0);
    var _pOdp=_needOdp&&(!window._odpData||!window._odpData.length)
      ? sb.from('odps').select('id,kode,nama,area_id').order('kode').then(function(r2){
          if(!r2.error) window._odpData=r2.data||[];

          var _od={};(window._odpData||[]).forEach(function(o){if(o.kode)_od[(o.kode||'').toLowerCase()]=o;if(o.nama)_od[(o.nama||'').toLowerCase()]=o;});
          ops.forEach(function(p){
            if(!p.odp_id&&p.__odpKode){var o=_od[p.__odpKode];if(o){p.odp_id=o.id;if(!p.area_id&&o.area_id)p.area_id=o.area_id;}}
          });
        })
      : Promise.resolve();

    _pOdp.then(function(){
      var batchSize=50;var done=0;var errs=0;
      function _batch(i){
        if(i>=ops.length){
          if(typeof toast==='function')toast('Import selesai: '+done+' berhasil'+(errs?' · '+errs+' gagal':'')+(skip?' · '+skip+' dilewati':''),'ok');
          _fasLoaded=false;fasLoad(true);if(window.SOT)SOT.invalidate('general');input.value='';return;
        }
        var chunk=ops.slice(i,i+batchSize);
        sb.from('pelanggan').upsert(chunk,{onConflict:'cid',ignoreDuplicates:false})
          .then(function(r){if(r&&r.error){console.error('[fasImport]',r.error);errs+=chunk.length;}else done+=chunk.length;_batch(i+batchSize);})
          .catch(function(e){console.error('[fasImport]',e);errs+=chunk.length;_batch(i+batchSize);});
      }
      _batch(0);
      if(typeof toast==='function')toast('Mengimport '+ops.length+' data…','info');
    });
  };
  reader.readAsText(file,'UTF-8');
};

window.fasDownloadTemplate = function(){
  var hdr=['cid','nama','jenis','status','area_kode','kecamatan','kelurahan','rw','rt','alamat',
           'no_hp','nik','odp_kode','nomor_port','paket','tgl_pasang',
           'sn_ont','mac_ont','ont_model','teknisi_pasang','lat','lng','keterangan'];
  var ex=[
    ['FAS-001','Balai Desa Cibadak','FASUM','aktif','CBD','Cibadak','Cibadak','01','01','Jl. Raya Cibadak No.1','','','W1_CBD_JJC.JKBN_001_001','3','Gratis','2026-01-15','SN11223344','AA:BB:CC:DD:EE:01','HUAWEI EG8145V5','Budi Teknisi','-6.900','107.590','FASUM desa'],
    ['ODP-T-001','Toko Pak Ahmad','ODP_TEMPEL','aktif','CBD','Cibadak','Parakansalak','02','03','Jl. Pasar No.5','081234567890','','W1_CBD_JJC.JKBN_001_001','5','Gratis','2026-02-01','','','','','','','ODP Tempel'],
    ['ODC-T-001','Gudang PT ABC','ODC_TEMPEL','aktif','PKD','Parungkuda','Parungkuda','03','04','Kawasan Industri Blok A','085678901234','','','','Gratis','2026-03-10','','','','','','','ODC Tempel']
  ];
  var csv = hdr.map(function(h){return '"'+h+'"';}).join(',') + '\n';
  ex.forEach(function(r){
    csv += r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',') + '\n';
  });
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='template_fasum_gratis.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  if(typeof toast==='function')toast('Template diunduh — isi kolom lalu import','ok');
};

/* ── Form handlers — identik form pelanggan, tanpa NIK/material/recurring ── */
window.fasOpenForm = function(data){
  var isEdit = !!data;
  document.getElementById('fas-form-title').textContent = isEdit ? 'Edit '+(data.nama||'FASUM') : 'Tambah FASUM / Gratis';
  document.getElementById('fas-form-id').value  = isEdit ? (data.id||'') : '';
  var cidEl = document.getElementById('fas-f-cid');
  cidEl.value = isEdit?(data.cid||''):''; cidEl.readOnly=isEdit; cidEl.style.background=isEdit?'var(--bg3)':'';
  document.getElementById('fas-f-jenis').value   = isEdit?(data.jenis_pelanggan||'FASUM'):'FASUM';
  document.getElementById('fas-f-nama').value    = isEdit?(data.nama||''):'';
  document.getElementById('fas-f-hp').value      = isEdit?(data.hp||''):'';
  document.getElementById('fas-f-alamat').value  = isEdit?(data.alamat||''):'';
  document.getElementById('fas-f-tgl').value     = isEdit?((data.tgl_pasang||'').slice(0,10)):'';
  document.getElementById('fas-f-status').value  = isEdit?(data.status||'aktif'):'aktif';
  document.getElementById('fas-f-lat').value     = isEdit?(data.lat||''):'';
  document.getElementById('fas-f-lng').value     = isEdit?(data.lng||''):'';
  document.getElementById('fas-f-ket').value     = isEdit?(data.keterangan||''):'';
  document.getElementById('fas-f-rw').value      = isEdit?(data.rw||''):'';
  document.getElementById('fas-f-rt').value      = isEdit?(data.rt||''):'';
  document.getElementById('fas-f-port').value    = isEdit?(data.nomor_port||''):'';
  window._fasf_edit_kec = isEdit?(data.kecamatan||''):'';
  window._fasf_edit_kel = isEdit?(data.kelurahan||''):'';
  document.getElementById('fas-f-port-group').style.display='none';
  document.getElementById('fas-f-port-info').style.display='none';
  var odpSel=document.getElementById('fas-f-odp');
  if(odpSel){odpSel.innerHTML='<option value="">— Pilih ODP (opsional) —</option>';odpSel.value='';}
  var odcSel=document.getElementById('fas-f-odc');
  if(odcSel){odcSel.innerHTML='<option value="">— Pilih ODC (opsional) —</option>';odcSel.value='';}
  /* Paket */
  var paketEl=document.getElementById('fasf-paket');
  if(paketEl) paketEl.value=isEdit?(data.paket||''):'';
  /* Material fields */
  if(!isEdit){
    ['fasf-ont-model','fasf-sn-ont','fasf-mac-ont','fasf-kabel-precon','fasf-panjang-kabel','fasf-teknisi-pasang'].forEach(function(id){var e=document.getElementById(id);if(e){e.value='';e.classList.remove('err');}});
    var snH=document.getElementById('fasf-sn-hint');if(snH){snH.textContent='Wajib unik — 1 SN hanya untuk 1 pelanggan';snH.style.color='';}
    var pw=document.getElementById('fasf-precon-warning');if(pw)pw.style.display='none';
  }
  /* Load material dropdowns */
  if(typeof _invMatiLoaded!=='undefined'&&!_invMatiLoaded&&typeof invMatiLoad==='function') invMatiLoad();
  if(typeof _invFillPelFormDropdowns==='function'){
    /* Reuse but also fill fasf-* via _invFillAllDropdowns */
    setTimeout(function(){if(typeof _invFillAllDropdowns==='function')_invFillAllDropdowns();},100);
  }
  /* Fill material edit values */
  if(isEdit){
    setTimeout(function(){
      var selOnt=document.getElementById('fasf-ont-model');if(selOnt&&data.ont_item_id)selOnt.value=data.ont_item_id;
      var selKbl=document.getElementById('fasf-kabel-precon');if(selKbl&&data.kabel_item_id)selKbl.value=data.kabel_item_id;
      var snEl=document.getElementById('fasf-sn-ont');if(snEl){snEl.value=data.sn_ont||'';snEl.classList.remove('err');}
      var macEl=document.getElementById('fasf-mac-ont');if(macEl)macEl.value=data.mac_ont||'';
      var pjEl=document.getElementById('fasf-panjang-kabel');if(pjEl)pjEl.value=data.panjang_kabel||'';
      var snH2=document.getElementById('fasf-sn-hint');if(snH2){snH2.textContent=data.sn_ont?'SN terdaftar pada pelanggan ini':'Wajib unik — 1 SN hanya untuk 1 pelanggan';snH2.style.color='';}
    },200);
  }
  /* Setup teknisi field */
  _fasSetupTeknisiField(data||null);
  ['fas-f-cid','fas-f-nama','fas-f-alamat','fas-f-area'].forEach(function(id){var e=document.getElementById(id);if(e)e.classList.remove('err');});
  var sb=(typeof getSB==='function')?getSB():null;
  if(!sb){document.getElementById('fas-form-overlay').style.display='flex';return;}
  var p1=_areaData.length>0?Promise.resolve():_ensureAreas(sb);
  var p2=_pelOdpList.length>0?Promise.resolve():sb.from('odps').select('id,kode,nama,area_id,odc_id,jumlah_port').order('kode').then(function(r){if(!r.error)_pelOdpList=r.data||[];});
  var p3=(window._pelOdcList&&window._pelOdcList.length>0)?Promise.resolve():sb.from('odcs').select('id,kode,nama,area_id').order('kode').then(function(r){if(!r.error)window._pelOdcList=r.data||[];});
  Promise.all([p1,p2,p3]).then(function(){
    _pelFillAreaDropdown('fas-f-area',isEdit?data.area_id:'');
    var selArea=document.getElementById('fas-f-area');
    if(selArea){selArea.onchange=function(){_pelFillOdcDropdown('fas-f-odc','',this.value);_pelFillOdpDropdown('fas-f-odp','',this.value,'');document.getElementById('fas-f-port-group').style.display='none';document.getElementById('fas-f-port').value='';_fasOnAreaChangeWilayah();};}
    if(isEdit){
      var savedOdp=_pelOdpList.find(function(o){return o.id===data.odp_id;});
      var savedOdcId=savedOdp?(savedOdp.odc_id||''):'';
      _pelFillOdcDropdown('fas-f-odc',savedOdcId,data.area_id);
      _pelFillOdpDropdown('fas-f-odp',data.odp_id,data.area_id,savedOdcId);
      if(data.odp_id)_fasLoadPortDropdown(data.odp_id,data.nomor_port);
    } else {
      var _defArea=(!_isGlobalRole()&&typeof CU!=='undefined'&&CU)?(CU.area_coverage_id||CU.area_id||''):'';
      _pelFillOdcDropdown('fas-f-odc','',_defArea);_pelFillOdpDropdown('fas-f-odp','',_defArea,'');
    }
    var selOdc2=document.getElementById('fas-f-odc');
    if(selOdc2){selOdc2.onchange=function(){var aId=document.getElementById('fas-f-area').value;_pelFillOdpDropdown('fas-f-odp','',aId,this.value);document.getElementById('fas-f-port-group').style.display='none';document.getElementById('fas-f-port').value='';};}
    var selOdp2=document.getElementById('fas-f-odp');
    if(selOdp2){selOdp2.onchange=function(){document.getElementById('fas-f-port').value='';document.getElementById('fas-f-port-info').style.display='none';if(this.value)_fasLoadPortDropdown(this.value,'');else document.getElementById('fas-f-port-group').style.display='none';};}
  });
  _fassFillWilayahDropdowns(window._fasf_edit_kec||'',window._fasf_edit_kel||'');
  document.getElementById('fas-form-overlay').style.display='flex';
};
window.fasCloseForm=function(){document.getElementById('fas-form-overlay').style.display='none';};
window.fasEdit=function(id){var p=_fasData.find(function(x){return x.id===id;});if(!p)return;window.fasOpenForm(p);};
function _fasLoadPortDropdown(odpId,currentPort){
  var grp=document.getElementById('fas-f-port-group');
  var sel=document.getElementById('fas-f-port-sel');
  var inf=document.getElementById('fas-f-port-info');
  var hid=document.getElementById('fas-f-port');
  if(!grp||!sel)return; grp.style.display='block'; sel.innerHTML='<option value="">— Memuat port… —</option>';
  var sb=(typeof getSB==='function')?getSB():null; if(!sb)return;
  sb.from('odp_ports').select('id,nomor_port,status,cid_pelanggan').eq('odp_id',odpId).order('nomor_port').then(function(r){
    if(r.error||!r.data){sel.innerHTML='<option value="">Error</option>';return;}
    sel.innerHTML='<option value="">— Pilih Port —</option>'+r.data.map(function(p){
      var used=(p.status==='terpakai'||p.cid_pelanggan);
      var isCur=currentPort&&parseInt(currentPort)===p.nomor_port;
      return '<option value="'+p.id+'" data-nomor="'+p.nomor_port+'"'+(used&&!isCur?' disabled':'')+(isCur?' selected':'')+'>Port '+p.nomor_port+(used&&!isCur?' (Terpakai)':' (Kosong)')+'</option>';
    }).join('');
    if(currentPort){hid.value=currentPort;var found=r.data.find(function(p){return parseInt(currentPort)===p.nomor_port;});if(found&&inf){inf.style.display='block';inf.innerHTML='<b>Port '+found.nomor_port+'</b> · '+(found.status==='terpakai'?'Terpakai':'Kosong');}}
    sel.onchange=function(){var opt=this.selectedOptions[0];hid.value=opt?(opt.getAttribute('data-nomor')||''):'';if(inf)inf.style.display='none';};
  }).catch(function(){sel.innerHTML='<option value="">Error</option>';});
}
window.fasOnOdpChange=function(){var v=document.getElementById('fas-f-odp').value;document.getElementById('fas-f-port').value='';document.getElementById('fas-f-port-info').style.display='none';if(v)_fasLoadPortDropdown(v,'');else document.getElementById('fas-f-port-group').style.display='none';};
function _fassFillWilayahDropdowns(kec,kel){
  var selKec=document.getElementById('fas-f-kecamatan');var selKel=document.getElementById('fas-f-kelurahan');
  if(!selKec||!selKel)return;
  var src=typeof _wilData!=='undefined'?_wilData:[];
  var kecs=[];src.forEach(function(w){if(w.kecamatan&&kecs.indexOf(w.kecamatan)<0)kecs.push(w.kecamatan);});kecs.sort();
  selKec.innerHTML='<option value="">— Pilih Kecamatan —</option>'+kecs.map(function(k){return '<option value="'+k+'"'+(k===kec?' selected':'')+'>'+k+'</option>';}).join('');
  _fasOnKecamatanChangeInternal(kec,kel);
}
window.fasOnKecamatanChange=function(){_fasOnKecamatanChangeInternal();};
function _fasOnKecamatanChangeInternal(kec,kel){
  var selKec=document.getElementById('fas-f-kecamatan');var selKel=document.getElementById('fas-f-kelurahan');
  if(!selKec||!selKel)return;
  var curKec=kec||selKec.value;
  var src=typeof _wilData!=='undefined'?_wilData:[];
  var kels=[];src.filter(function(w){return w.kecamatan===curKec;}).forEach(function(w){if(w.kelurahan&&kels.indexOf(w.kelurahan)<0)kels.push(w.kelurahan);});kels.sort();
  selKel.innerHTML='<option value="">— Pilih Kelurahan —</option>'+kels.map(function(k){return '<option value="'+k+'"'+(k===(kel||'')?' selected':'')+'>'+k+'</option>';}).join('');
}
function _fasOnAreaChangeWilayah(){_fassFillWilayahDropdowns('','');}

/* ── Teknisi field setup untuk form FASUM ── */
function _fasSetupTeknisiField(data){
  var roEl=document.getElementById('fasf-teknisi-ro');
  var roVal=document.getElementById('fasf-teknisi-ro-val');
  var selEl=document.getElementById('fasf-teknisi-sel');
  var hidEl=document.getElementById('fasf-teknisi-pasang');
  if(!roEl||!selEl||!hidEl) return;
  if(window.CR==='teknisi'){
    roEl.style.display='flex';selEl.style.display='none';
    var nm=(window.CU&&(CU.nama||CU.username))||'Saya';
    if(roVal)roVal.textContent=nm;hidEl.value=nm;
  } else {
    roEl.style.display='none';selEl.style.display='block';
    var curVal=(data&&data.teknisi_pasang)||'';hidEl.value=curVal;
    if(typeof _ensureTeknisiLoaded==='function'){
      _ensureTeknisiLoaded(function(){
        if(typeof _buildTeknisiOpts==='function')selEl.innerHTML=_buildTeknisiOpts(curVal);
        selEl.onchange=function(){hidEl.value=this.value;};
        if(curVal)selEl.value=curVal;
      });
    }
  }
}
window.fasCheckSnOnt=function(val){
  val=(val||'').trim().toUpperCase();
  var hint=document.getElementById('fasf-sn-hint');
  var editId=document.getElementById('fas-form-id').value;
  if(!val||!hint) return;
  var sb=(typeof getSB==='function')?getSB():null;if(!sb)return;
  sb.from('pelanggan').select('id,cid,nama').eq('sn_ont',val).limit(1).then(function(r){
    if(!r.error&&r.data&&r.data.length){var p=r.data[0];if(p.id===editId){hint.textContent='SN terdaftar pada pelanggan ini';hint.style.color='';}else{hint.textContent='⚠ SN sudah terdaftar: '+(p.cid||'')+(p.nama?' – '+p.nama:'');hint.style.color='var(--red)';}}
    else{hint.textContent='✓ SN tersedia';hint.style.color='var(--green)';}
  }).catch(function(){});
};
window.fasCheckPreconRoll=function(val){
  var pw=document.getElementById('fasf-precon-warning');if(pw)pw.style.display=(parseInt(val)||0)>3?'block':'none';
};
window.fasSave=function(){
  var id=document.getElementById('fas-form-id').value;
  var cid=(document.getElementById('fas-f-cid').value||'').trim();
  var nama=(document.getElementById('fas-f-nama').value||'').trim();
  var area=document.getElementById('fas-f-area').value;
  var jenis=document.getElementById('fas-f-jenis').value;
  var alamat=(document.getElementById('fas-f-alamat').value||'').trim();
  var isNew=!id;
  var ontItemId=(document.getElementById('fasf-ont-model')||{}).value||'';
  var snOnt=((document.getElementById('fasf-sn-ont')||{}).value||'').trim().toUpperCase();
  var macOnt=((document.getElementById('fasf-mac-ont')||{}).value||'').trim();
  var kabelItemId=(document.getElementById('fasf-kabel-precon')||{}).value||'';
  var panjangKabel=parseInt((document.getElementById('fasf-panjang-kabel')||{}).value)||0;
  var teknisiPasang=((document.getElementById('fasf-teknisi-pasang')||{}).value||'').trim();
  var paket=(document.getElementById('fasf-paket')||{}).value||'Gratis';
  var ok=true;
  function chk(fid,v){var e=document.getElementById(fid);if(!v){if(e)e.classList.add('err');ok=false;}else if(e)e.classList.remove('err');}
  if(isNew)chk('fas-f-cid',cid);
  chk('fas-f-nama',nama);chk('fas-f-area',area);chk('fas-f-alamat',alamat);
  if(isNew){
    if(!ontItemId){var eO=document.getElementById('fasf-ont-model');if(eO)eO.classList.add('err');ok=false;}
    if(!snOnt){var eS=document.getElementById('fasf-sn-ont');if(eS)eS.classList.add('err');ok=false;}
    if(!kabelItemId){var eK=document.getElementById('fasf-kabel-precon');if(eK)eK.classList.add('err');ok=false;}
    if(!panjangKabel){var eP=document.getElementById('fasf-panjang-kabel');if(eP)eP.classList.add('err');ok=false;}
    if(!teknisiPasang){var selTk=document.getElementById('fasf-teknisi-sel');var roTk=document.getElementById('fasf-teknisi-ro');if(selTk&&selTk.style.display!=='none')selTk.classList.add('err');else if(roTk&&roTk.style.display!=='none')roTk.style.border='1.5px solid var(--red)';ok=false;}
    var snH=document.getElementById('fasf-sn-hint');
    if(snH&&snH.style.color==='var(--red)'){if(typeof toast==='function')toast('SN ONT sudah terdaftar pada pelanggan lain','err');return;}
  }
  if(!ok){if(typeof toast==='function')toast('Isi semua field wajib','err');return;}
  if(isNew&&ontItemId&&typeof _invMatiData!=='undefined'){var ontChk=_invMatiData.find(function(x){return x.id===ontItemId;});if(ontChk&&(ontChk.stok||0)<1){if(typeof toast==='function')toast('Stok ONT habis','err');return;}}
  var btn=document.getElementById('fas-form-save');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span>';}
  var sb=(typeof getSB==='function')?getSB():null;
  if(!sb){if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}return;}
  var areaObj=(_areaData||[]).find(function(a){return a.id===area;});
  var nomorPort=parseInt(document.getElementById('fas-f-port').value)||null;
  var odpId=document.getElementById('fas-f-odp').value||null;
  var rwRaw=document.getElementById('fas-f-rw').value;var rwFmt=rwRaw?rwRaw.replace(/[^0-9]/g,"").padStart(3,"0").slice(0,3):null;
  var rtRaw=document.getElementById('fas-f-rt').value;var rtFmt=rtRaw?rtRaw.replace(/[^0-9]/g,"").padStart(3,"0").slice(0,3):null;
  var ontModelName='';if(ontItemId&&typeof _invMatiData!=='undefined'){var oItem=_invMatiData.find(function(x){return x.id===ontItemId;});if(oItem)ontModelName=oItem.nama+(oItem.merk?" ("+oItem.merk+")":'');}
  var payload={nama:nama,area_id:area,area_coverage:areaObj?(areaObj.nama||areaObj.kode):'',jenis_pelanggan:jenis,status:document.getElementById('fas-f-status').value||'aktif',hp:document.getElementById('fas-f-hp').value||null,alamat:alamat||null,kecamatan:document.getElementById('fas-f-kecamatan').value||null,kelurahan:document.getElementById('fas-f-kelurahan').value||null,rw:rwFmt||null,rt:rtFmt||null,odp_id:odpId||null,nomor_port:nomorPort,paket:paket,tgl_pasang:document.getElementById('fas-f-tgl').value||null,keterangan:document.getElementById('fas-f-ket').value||null,lat:parseFloat(document.getElementById('fas-f-lat').value)||null,lng:parseFloat(document.getElementById('fas-f-lng').value)||null,tipe_recurring:null,nominal_otf:0,sn_ont:snOnt||null,mac_ont:macOnt||null,ont_item_id:ontItemId||null,ont_model:ontModelName||null,kabel_item_id:kabelItemId||null,panjang_kabel:panjangKabel||null,teknisi_pasang:teknisiPasang||null};
  if(isNew)payload.cid=cid;
  function _doSave(){
    var q=id?sb.from('pelanggan').update(payload).eq('id',id):sb.from('pelanggan').insert([payload]).select();
    q.then(function(r){
      if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}
      if(r&&r.error){if(typeof toast==='function')toast('Gagal: '+(r.error.message||''),'err');return;}
      var newId=id||(r.data&&r.data[0]&&r.data[0].id)||null;
      var newCid=(!id&&r.data&&r.data[0])?r.data[0].cid:cid;
      function _doPortAssign(cb){
        if(!odpId||!newId||!nomorPort){if(cb)cb();return;}
        sb.from('odp_ports').select('id,nomor_port,status').eq('odp_id',odpId).eq('nomor_port',nomorPort).limit(1).then(function(rp){
          var portRec=rp.data&&rp.data[0];if(!portRec){if(cb)cb();return;}
          var ops=[];
          if(id){var oldD=_fasData.find(function(x){return x.id===id;});if(oldD&&oldD.odp_id&&oldD.nomor_port&&(oldD.odp_id!==odpId||oldD.nomor_port!==nomorPort))ops.push(sb.from('odp_ports').update({status:'kosong',cid_pelanggan:null,pel_id:null,paket:null,tgl_pasang:null}).eq('odp_id',oldD.odp_id).eq('nomor_port',oldD.nomor_port));}
          ops.push(sb.from('odp_ports').update({status:'terpakai',cid_pelanggan:newCid,pel_id:newId,paket:paket,tgl_pasang:payload.tgl_pasang}).eq('id',portRec.id));
          Promise.all(ops).then(function(){if(cb)cb();}).catch(function(){if(cb)cb();});
        }).catch(function(){if(cb)cb();});
      }
      function _doMaterialDeduct(cb){
        if(!isNew||(!ontItemId&&!kabelItemId)){if(cb)cb();return;}
        /* SSOT: _matMutasiSequence — fetch fresh, atomic, jenis='instalasi' */
        var today=new Date().toISOString().slice(0,10);
        var matOps=[];
        var _pl={pel_cid:newCid||null,teknisi:teknisiPasang||null,tgl:today};
        if(ontItemId) matOps.push({itemId:ontItemId,delta:-1,jenis:'instalasi',payload:Object.assign({},_pl,{sn_ont:snOnt||null,keterangan:'Instalasi '+jenis+' '+(newCid||'')})});
        if(kabelItemId&&panjangKabel) matOps.push({itemId:kabelItemId,delta:-panjangKabel,jenis:'instalasi',payload:Object.assign({},_pl,{keterangan:'Kabel instalasi '+jenis+' '+(newCid||'')})});
        if(typeof _matMutasiSequence==='function'){
          _matMutasiSequence(matOps).then(function(){if(cb)cb();}).catch(function(){if(cb)cb();});
        } else { if(cb)cb(); }
      }
      _doPortAssign(function(){_doMaterialDeduct(function(){
        if(window.SOT)SOT.invalidate('general');
        if(typeof _invMatiLoaded!=='undefined')_invMatiLoaded=false;
        if(typeof _inv2AreaBrandCache!=='undefined') _inv2AreaBrandCache={}; /* Reset brand cache on save */
        if(typeof toast==='function')toast(id?'Data diperbarui':jenis+' berhasil ditambahkan','ok');
        window.fasCloseForm();_fasLoaded=false;fasLoad(true);
        if(typeof _dashLoaded!=='undefined')_dashLoaded=false;
      });});
    }).catch(function(e){if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}if(typeof toast==='function')toast('Error: '+(e.message||''),'err');});
  }
  if(isNew&&snOnt){sb.from('pelanggan').select('id').eq('sn_ont',snOnt).limit(1).then(function(r){if(r.data&&r.data.length){if(typeof toast==='function')toast('SN ONT sudah terdaftar pada pelanggan lain','err');if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan';}return;}_doSave();}).catch(function(){_doSave();});}else{_doSave();}
};

window.fasDel = function(id,nama){
  if(!confirm('Hapus data '+nama+'?')) return;
  var sb=(typeof getSB==='function')?getSB():null; if(!sb) return;
  sb.from('pelanggan').delete().eq('id',id).then(function(r){
    if(r&&r.error){if(typeof toast==='function')toast('Gagal hapus: '+(r.error.message||''),'err');return;}
    if(typeof toast==='function')toast('Data dihapus','ok');
    _fasLoaded=false;fasLoad(true);
    if(window.SOT)SOT.invalidate('general');
    if(typeof _dashLoaded!=='undefined')_dashLoaded=false;
  }).catch(function(){});
};

/* ── Migrasi: pastikan data FASUM yang ada di DB tampil di sini ── */
window.fasMigrateConfirm = function(){
  var sb=(typeof getSB==='function')?getSB():null;
  if(!sb){if(typeof toast==='function')toast('Database tidak terhubung','err');return;}
  var btn=document.getElementById('fas-migrate-btn');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span> Mengecek…';}
  sb.from('pelanggan').select('id,nama,jenis_pelanggan',{count:'exact'})
    .in('jenis_pelanggan',['FASUM','ODP_TEMPEL','ODC_TEMPEL'])
    .then(function(r){
      if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-arrows-transfer-up"></i> Migrasi dari Data Pelanggan';}
      var cnt=(r.data&&r.data.length)||0;
      if(!cnt){
        if(typeof toast==='function')toast('Tidak ada data FASUM/Gratis yang perlu dimuat','ok');
        return;
      }
      if(!confirm(cnt+' data FASUM/ODP Tempel/ODC Tempel ditemukan.\n\nData sudah tersimpan di database yang benar.\nProses ini akan me-refresh tampilan & membersihkan dari daftar Pelanggan Reguler.\n\nLanjutkan?')) return;
      _fasLoaded=false;
      if(typeof _pelLoaded!=='undefined')_pelLoaded=false;
      if(window.SOT)SOT.invalidate('general');
      fasLoad(true);
      setTimeout(function(){if(typeof _pelLoaded!=='undefined'&&!_pelLoaded&&typeof pelLoad==='function')pelLoad();},600);
      if(typeof toast==='function')toast('Refresh selesai — '+cnt+' data FASUM dimuat','ok');
    }).catch(function(e){
      if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-arrows-transfer-up"></i> Migrasi dari Data Pelanggan';}
      if(typeof toast==='function')toast('Error: '+(e&&e.message||''),'err');
    });
};

window.fasLoad   = fasLoad;
window.fasRender = fasRender;
window.fasSearch = fasSearch;

/* ----------------------------------------------------------------
   BACKWARD COMPAT SHIMS — no recursion
---------------------------------------------------------------- */
function _monAreaRender(c,olts){ if(c) _monAreaRenderCards(c); }
function _monRenderAreaBanner(c){ if(c) _monAreaRenderBanner(c); }
function _monRenderAreaCards(c){ if(c) _monAreaRenderCards(c); }
var _monData={olt:[],odc:[],odp:[],port:[]};

var _tt = null;
function toast(msg, type, dur){
  var e=document.getElementById('toast');
  if(!e) return;
  clearTimeout(_tt);
  e.textContent=msg;
  e.className='toast '+(type||'info')+' show';
  _tt=setTimeout(function(){ e.classList.remove('show'); }, dur||2800);
}
function retryNet(){
  if(navigator.onLine){
    document.getElementById('wall').style.display='none';
    toast('Koneksi aktif kembali','ok');
    _sbc=null; var sb=getSB();
    if(sb) sb.from('app_users').select('id',{count:'exact',head:true})
      .then(function(r){ sbStatus(r.error?'err':'ok'); })
      .catch(function(){ sbStatus('err'); });
  } else { toast('Masih belum ada koneksi','err'); }
}
if(!window._bndNetStatus){
window.addEventListener('online', function(){
  var w=document.getElementById('wall'); if(w) w.style.display='none';
  toast('Koneksi aktif','ok');
  setTimeout(function(){ _sbc=null; var sb=getSB(); if(sb) sb.from('app_users').select('id',{count:'exact',head:true}).then(function(r){ sbStatus(r.error?'err':'ok'); }).catch(function(){ sbStatus('err'); }); }, 400);
});
window.addEventListener('offline', function(){
  var w=document.getElementById('wall'); if(w) w.style.display='flex';
  sbStatus('off'); toast('Koneksi terputus','err');
});
window._bndNetStatus=true;
}
var _wilData   = [];
var _wilFil    = [];
var _wilLoaded = false;

/* Auto-load saat nav ke wilayah */
/* OPT: dispatch hook ganti IIFE wrapper */
_navDispatch.register('wilayah', function(){ wilLoad(); });

function wilLoad(){
  var list = document.getElementById('wil-list');
  if(list) list.innerHTML = '<div class="area-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = getSB(); if(!sb){ wilRenderEmpty('Database tidak terhubung'); return; }
  sb.from('wilayah').select('id,kecamatan,kelurahan,kode_pos,created_at').order('kecamatan').order('kelurahan')
    .then(function(r){
      if(r.error){
        /* Tabel mungkin belum dibuat */
        wilRenderEmpty('Tabel <b>wilayah</b> belum ada di Supabase.<br><br>Buat tabel dengan SQL:<br><code style="font-size:10px;background:var(--bg3);padding:4px 8px;border-radius:6px;display:inline-block;margin-top:4px">CREATE TABLE wilayah (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, area_coverage text, kecamatan text NOT NULL, kelurahan text NOT NULL, kode_pos text, created_at timestamptz DEFAULT now());</code>');
        return;
      }
      _wilData = r.data || [];
      _wilLoaded = true;
      /* Reset master cache agar dibangun ulang */
      _pelWilayahMaster = null;
      wilUpdateStats();
      wilFillAreaFilter();
      wilRender();
    }).catch(function(e){ wilRenderEmpty('Error: '+(e.message||'coba lagi')); });
}

function wilUpdateStats(){
  var kecs = [], kels = 0;
  _wilData.forEach(function(w){
    if(w.kecamatan && kecs.indexOf(w.kecamatan)<0) kecs.push(w.kecamatan);
    if(w.kelurahan) kels++;
  });
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  e('wil-cnt-kec', kecs.length);
  e('wil-cnt-kel', kels);
}

function wilFillAreaFilter(){
  var sel = document.getElementById('wil-filter-area'); if(!sel) return;
  var cur = sel.value;
  var areas = [];
  _wilData.forEach(function(w){ if(w.area_coverage && areas.indexOf(w.area_coverage)<0) areas.push(w.area_coverage); });
  areas.sort();
  sel.innerHTML = '<option value="">Semua Area Coverage</option>';
  areas.forEach(function(a){ var o=document.createElement('option');o.value=a;o.textContent=a;if(a===cur)o.selected=true;sel.appendChild(o); });
}

function wilSearch(q){
  _wilFil = _wilData.filter(function(w){
    var ql = (q||'').toLowerCase();
    return !ql || (w.kecamatan||'').toLowerCase().includes(ql) || (w.kelurahan||'').toLowerCase().includes(ql);
  });
  wilRender();
}

function wilRender(){
  var q   = (document.getElementById('wil-search')||{}).value||'';
  var ac  = (document.getElementById('wil-filter-area')||{}).value||'';
  var src = _wilData.filter(function(w){
    var ql = q.toLowerCase();
    var matchQ  = !ql || (w.kecamatan||'').toLowerCase().includes(ql) || (w.kelurahan||'').toLowerCase().includes(ql);
    var matchAC = !ac || w.area_coverage === ac;
    return matchQ && matchAC;
  });

  var list = document.getElementById('wil-list');
  if(!list) return;
  if(!src.length){ list.innerHTML = '<div class="area-empty"><i class="ti ti-map-pin-off"></i><p>Belum ada data wilayah</p></div>'; return; }

  /* Group by kecamatan */
  var grouped = {};
  src.forEach(function(w){
    var k = w.kecamatan||'—';
    if(!grouped[k]) grouped[k] = [];
    grouped[k].push(w);
  });

  var html = '';
  Object.keys(grouped).sort().forEach(function(kec){
    html += '<div style="margin-bottom:12px">' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--green);padding:4px 0 6px;display:flex;align-items:center;gap:6px">' +
        '<i class="ti ti-building-community" style="font-size:13px"></i>' + _esc(kec) +
        '<span style="font-size:10px;color:var(--text3);font-weight:500">('+grouped[kec].length+' kelurahan)</span>' +
      '</div>';
    grouped[kec].forEach(function(w){
      var wid = w.id||'';
      html += '<div style="background:var(--bg2);border-radius:10px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;border:1.5px solid var(--border)">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--text)">' + _esc(w.kelurahan||'—') + '</div>' +
          (w.area_coverage ? '<div style="font-size:11px;color:var(--text3);margin-top:2px"><i class="ti ti-map-2" style="font-size:10px"></i> ' + _esc(w.area_coverage) + '</div>' : '') +
        '</div>' +
        '<div style="display:flex;gap:6px">' +
          '<button class="wil-edit-btn" data-wilid="' + _esc(wid) + '" style="width:30px;height:30px;border-radius:8px;border:1.5px solid var(--border2);background:var(--bg3);color:var(--c1);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center"><i class="ti ti-edit"></i></button>' +
          '<button style="width:30px;height:30px;border-radius:8px;border:1.5px solid var(--rg);background:var(--rg2);color:var(--red);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center" onclick="wilDelete(\'' + wid + '\',\'' + _esc(w.kelurahan||'') + '\')"><i class="ti ti-trash"></i></button>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
  });
  list.innerHTML = html;
  /* OPT: event delegation — 1 listener pada container, bukan N listener per tombol */
  if(!list._wilDelegated){
    list._wilDelegated = true;
    list.addEventListener('click', function(e){
      var btn = e.target.closest('.wil-edit-btn');
      if(!btn) return;
      var wid = btn.getAttribute('data-wilid');
      var wobj = (_wilData||[]).find(function(x){ return x.id === wid; });
      if(wobj) wilOpenForm(wobj);
    });
  }
}

function wilRenderEmpty(msg){
  var list = document.getElementById('wil-list');
  if(list) list.innerHTML = '<div class="area-empty" style="text-align:left;padding:20px">' + msg + '</div>';
}

function wilOpenForm(data){
  var isEdit = !!data;
  document.getElementById('wil-form-title').textContent = isEdit ? 'Edit Wilayah' : 'Tambah Wilayah';
  document.getElementById('wilf-id').value = isEdit ? (data.id||'') : '';
  document.getElementById('wilf-kecamatan').value = isEdit ? (data.kecamatan||'') : '';
  document.getElementById('wilf-kelurahan').value  = isEdit ? (data.kelurahan||'') : '';

  /* Isi dropdown area */
  var selArea = document.getElementById('wilf-area');
  if(selArea){
    var p = _areaData.length > 0 ? Promise.resolve()
      : getSB().from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; });
    p.then(function(){
      selArea.innerHTML = '<option value="">— Pilih Area (opsional) —</option>';
      _areaData.forEach(function(a){
        var o=document.createElement('option');o.value=a.nama;o.textContent=a.nama;
        if(isEdit && a.nama===data.area_coverage) o.selected=true;
        selArea.appendChild(o);
      });
    });
  }

  ['wilf-kecamatan','wilf-kelurahan'].forEach(function(id){ var e=document.getElementById(id);if(e)e.classList.remove('err'); });
  document.getElementById('wil-form-overlay').classList.add('on');
}

function wilCloseForm(){ document.getElementById('wil-form-overlay').classList.remove('on'); }

function wilSave(){
  var id  = document.getElementById('wilf-id').value;
  var ac  = document.getElementById('wilf-area').value.trim();
  var kec = document.getElementById('wilf-kecamatan').value.trim();
  var kel = document.getElementById('wilf-kelurahan').value.trim();

  var ok=true;
  if(!kec){ document.getElementById('wilf-kecamatan').classList.add('err'); ok=false; }
  else document.getElementById('wilf-kecamatan').classList.remove('err');
  if(!kel){ document.getElementById('wilf-kelurahan').classList.add('err'); ok=false; }
  else document.getElementById('wilf-kelurahan').classList.remove('err');
  if(!ok){ toast('Isi field wajib','err'); return; }

  /* Cek duplikat */
  var dup = _wilData.find(function(w){ return w.kecamatan===kec && w.kelurahan===kel && w.id!==id; });
  if(dup){ toast('Kelurahan sudah ada di kecamatan ini','err'); return; }

  var sb = getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn = document.getElementById('wilf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var payload = { area_coverage: ac||null, kecamatan: kec, kelurahan: kel };
  var p = id ? sb.from('wilayah').update(payload).eq('id',id)
             : sb.from('wilayah').insert([payload]);

  p.then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    toast(id ? 'Wilayah diperbarui' : 'Wilayah ditambahkan','ok');
    wilCloseForm();
    /* Reset cache wilayah master agar dropdown form pelanggan ikut refresh */
    _pelWilayahMaster = null;
    _wilLoaded = false;
    wilLoad();
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

function wilDelete(id, nama){
  if(!confirm('Hapus kelurahan "'+nama+'"?')) return;
  var sb = getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  sb.from('wilayah').delete().eq('id',id).then(function(r){
    if(r.error){ toast('Gagal hapus','err'); return; }
    toast('Wilayah dihapus','ok');
    _pelWilayahMaster = null;
    _wilLoaded = false;
    wilLoad();
  }).catch(function(){ toast('Error','err'); });
}
var _areaData   = [];  /* semua data dari Supabase */
var _areaFil    = [];  /* data setelah filter/search */
var _areaPage   = 1;
var _areaPerPg  = 15;
var _areaDetId  = null;
var _areaLoaded = false;

/* ── Auto-load saat pane area dibuka ── */
/* OPT: dispatch hook */
_navDispatch.register('area', function(){ areaLoad(); });

/* ── Generate kode unik ── */
function _genAreaKode(){
  var n = (_areaData.length + 1).toString().padStart(3,'0');
  return 'AREA-' + n;
}

/* ── Load data dari Supabase ── */
function areaLoad(){
  var list = document.getElementById('area-list');
  if(list) list.innerHTML = '<div class="area-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = getSB();
  if(!sb){ areaRenderEmpty('Koneksi Supabase tidak aktif'); return; }
  sb.from('areas').select('id,kode,nama,kota,provinsi,type,status,target_homes,pelanggan,lat,lng,keterangan,created_at,updated_at').order('created_at',{ascending:false})
    .then(function(r){
      if(r.error){ areaRenderEmpty('Gagal memuat: ' + (r.error.message||'coba lagi')); return; }
      _areaData = r.data || [];
      _areaLoaded = true;
      areaUpdateStats();
      areaRender();
    })
    .catch(function(e){ areaRenderEmpty('Error: ' + (e.message||'coba lagi')); });
}

/* ── Update stat strip ── */
function areaUpdateStats(){
  var total   = _areaData.length;
  var aktif   = _areaData.filter(function(a){ return a.status==='aktif'; }).length;
  var plan    = _areaData.filter(function(a){ return a.status==='planning'; }).length;
  var nonaktif= _areaData.filter(function(a){ return a.status==='nonaktif'; }).length;
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  e('ast-total', total);
  e('ast-aktif', aktif);
  e('ast-plan', plan);
  e('ast-nonaktif', nonaktif);
}

/* ── Search ── */
function areaSearch(q){
  _areaPage = 1;
  var clr = document.getElementById('area-search-clr');
  if(clr) clr.style.display = q ? 'block' : 'none';
  areaRender();
}
function areaClearSearch(){
  var inp = document.getElementById('area-search');
  if(inp){ inp.value=''; }
  var clr = document.getElementById('area-search-clr');
  if(clr) clr.style.display='none';
  _areaPage=1;
  areaRender();
}

/* ── Render list ── */
function areaRender(){
  var q      = (document.getElementById('area-search')||{}).value||'';
  var fSt    = (document.getElementById('area-fil-status')||{}).value||'';
  var fTy    = (document.getElementById('area-fil-type')||{}).value||'';
  q = q.toLowerCase().trim();

  _areaFil = _areaData.filter(function(a){
    var matchQ  = !q || (a.nama||'').toLowerCase().includes(q) || (a.kode||'').toLowerCase().includes(q) || (a.kota||'').toLowerCase().includes(q);
    var matchSt = !fSt || a.status===fSt;
    var matchTy = !fTy || a.type===fTy;
    return matchQ && matchSt && matchTy;
  });

  var total = _areaFil.length;
  var pages = Math.max(1, Math.ceil(total / _areaPerPg));
  if(_areaPage > pages) _areaPage = pages;

  var start = (_areaPage - 1) * _areaPerPg;
  var slice = _areaFil.slice(start, start + _areaPerPg);

  var list = document.getElementById('area-list');
  if(!list) return;

  if(!total){
    list.innerHTML = '<div class="area-empty"><i class="ti ti-map-search"></i><p>Tidak ada data area</p><small>Coba ubah filter atau tambah area baru</small></div>';
    document.getElementById('area-pagi').style.display='none';
    return;
  }

  var html = slice.map(function(a){ return areaRowHTML(a); }).join('');
  list.innerHTML = html;

  /* Pagination */
  var pagi = document.getElementById('area-pagi');
  var prev = document.getElementById('area-prev');
  var next = document.getElementById('area-next');
  var info = document.getElementById('area-pagi-info');
  if(pages > 1){
    pagi.style.display='flex';
    if(prev) prev.disabled = _areaPage<=1;
    if(next) next.disabled = _areaPage>=pages;
    if(info) info.textContent = _areaPage + ' / ' + pages;
  } else {
    pagi.style.display='none';
  }
}

function areaRenderEmpty(msg){
  var list = document.getElementById('area-list');
  if(list) list.innerHTML = '<div class="area-empty"><i class="ti ti-alert-triangle"></i><p>'+msg+'</p></div>';
}

/* ── Row HTML builder ── */
function areaRowHTML(a){
  var stClass = a.status==='aktif' ? 'tg' : a.status==='planning' ? 'ty' : 'tgr';
  var stLabel = a.status==='aktif' ? 'Aktif' : a.status==='planning' ? 'Planning' : 'Non-Aktif';
  var tyClass = a.type==='urban' ? 'tc1' : a.type==='suburban' ? 'tpu' : a.type==='industrial' ? 'tc2' : 'tgr';
  var tyLabel = (a.type||'-').charAt(0).toUpperCase()+(a.type||'').slice(1);
  var avClass = a.status==='planning' ? 'plan' : a.status==='nonaktif' ? 'nonaktif' : '';

  /* Utilization */
  var pct = 0;
  if(a.target_homes && a.target_homes > 0) pct = Math.min(100, Math.round((a.pelanggan||0) / a.target_homes * 100));
  var barClass = pct >= 90 ? 'full' : pct >= 70 ? 'warn' : '';

  var utilHtml = (a.target_homes > 0) ?
    '<div class="area-util-wrap">' +
    '<span class="area-util-label">Util</span>' +
    '<div class="area-util-bar-bg"><div class="area-util-bar '+barClass+'" style="width:'+pct+'%"></div></div>' +
    '<span class="area-util-pct">'+pct+'%</span>' +
    '</div>' : '';

  return '<div class="area-row" onclick="areaOpenDet(\''+a.id+'\')">' +
    '<button class="area-row-detail-btn" onclick="event.stopPropagation();areaOpenDet(\''+a.id+'\')"><i class="ti ti-chevron-right"></i></button>' +
    '<div class="area-row-top">' +
      '<div class="area-row-av '+avClass+'"><i class="ti ti-map-2"></i></div>' +
      '<div class="area-row-info">' +
        '<div class="area-row-name">'+_esc(a.nama||'—')+'</div>' +
        '<div class="area-row-kode">'+_esc(a.kode||'—')+' · '+_esc(a.kota||'—')+'</div>' +
      '</div>' +
    '</div>' +
    '<div class="area-row-meta">' +
      '<span class="tag '+stClass+'">'+stLabel+'</span>' +
      '<span class="tag '+tyClass+'">'+tyLabel+'</span>' +
      (a.target_homes ? '<span class="tag tgr"><i class="ti ti-home" style="font-size:9px"></i> '+_fmt(a.target_homes)+' HU</span>' : '') +
      (a.pelanggan ? '<span class="tag tc1"><i class="ti ti-users" style="font-size:9px"></i> '+_fmt(a.pelanggan)+'</span>' : '') +
    '</div>' +
    utilHtml +
  '</div>';
}

/* ── Pagination ── */
function areaPage(dir){
  var pages = Math.max(1, Math.ceil(_areaFil.length / _areaPerPg));
  _areaPage = Math.min(pages, Math.max(1, _areaPage + dir));
  areaRender();
  var ct = document.getElementById('content');
  if(ct) ct.scrollTop = document.getElementById('p-area').offsetTop;
}

/* ── Open Form (Add) ── */
function areaOpenForm(data){
  var isEdit = !!data;
  document.getElementById('area-form-title').textContent = isEdit ? 'Edit Area' : 'Tambah Area';
  document.getElementById('af-id').value       = isEdit ? data.id : '';
  document.getElementById('af-kode').value     = isEdit ? (data.kode||'') : _genAreaKode();
  document.getElementById('af-nama').value     = isEdit ? (data.nama||'') : '';
  document.getElementById('af-kota').value     = isEdit ? (data.kota||'') : '';
  document.getElementById('af-provinsi').value = isEdit ? (data.provinsi||'Jawa Barat') : 'Jawa Barat';
  document.getElementById('af-type').value     = isEdit ? (data.type||'urban') : 'urban';
  document.getElementById('af-status').value   = isEdit ? (data.status||'aktif') : 'aktif';
  document.getElementById('af-target').value   = isEdit ? (data.target_homes||0) : 0;
  document.getElementById('af-pel').value      = isEdit ? (data.pelanggan||0) : 0;
  document.getElementById('af-ket').value      = isEdit ? (data.keterangan||'') : '';
  /* clear err */
  ['af-kode','af-nama','af-kota'].forEach(function(id){ document.getElementById(id).classList.remove('err'); });
  document.getElementById('area-form-overlay').classList.add('on');
}

function areaCloseForm(){
  document.getElementById('area-form-overlay').classList.remove('on');
}

/* ── Save (Insert / Update) ── */
function areaSave(){
  var id     = document.getElementById('af-id').value;
  var kode   = document.getElementById('af-kode').value.trim().toUpperCase();
  var nama   = document.getElementById('af-nama').value.trim();
  var kota   = document.getElementById('af-kota').value.trim();
  var prov   = document.getElementById('af-provinsi').value.trim();
  var type   = document.getElementById('af-type').value;
  var status = document.getElementById('af-status').value;
  var target = parseInt(document.getElementById('af-target').value)||0;
  var pel    = parseInt(document.getElementById('af-pel').value)||0;
  var ket    = document.getElementById('af-ket').value.trim();

  /* Validation */
  var ok = true;
  if(!kode){ document.getElementById('af-kode').classList.add('err'); ok=false; }
  else document.getElementById('af-kode').classList.remove('err');
  if(!nama){ document.getElementById('af-nama').classList.add('err'); ok=false; }
  else document.getElementById('af-nama').classList.remove('err');
  if(!kota){ document.getElementById('af-kota').classList.add('err'); ok=false; }
  else document.getElementById('af-kota').classList.remove('err');
  if(!ok){ toast('Isi semua field wajib','err'); return; }

  /* Duplicate kode check */
  var dup = _areaData.find(function(a){ return a.kode===kode && a.id!==id; });
  if(dup){ toast('Kode area sudah digunakan','err'); document.getElementById('af-kode').classList.add('err'); return; }

  var sb = getSB();
  if(!sb){ toast('Database tidak terhubung','err'); return; }

  var btn = document.getElementById('af-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var payload = {kode:kode,nama:nama,kota:kota,provinsi:prov||'—',type:type,status:status,target_homes:target,pelanggan:pel,keterangan:ket};

  var p;
  if(id){
    p = sb.from('areas').update(payload).eq('id',id);
  } else {
    p = sb.from('areas').insert([payload]);
  }

  p.then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    toast(id ? 'Area diperbarui' : 'Area ditambahkan','ok');
    if(window.SOT) SOT.invalidate('general'); /* B4 KRITIS: area sync */
    areaCloseForm();
    _areaLoaded=false;
    areaLoad();
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

/* ── Open Detail ── */
function areaOpenDet(id){
  var a = _areaData.find(function(x){ return x.id===id; });
  if(!a) return;
  _areaDetId = id;
  document.getElementById('area-det-title').textContent = a.nama || 'Detail Area';

  var stClass = a.status==='aktif' ? 'tg' : a.status==='planning' ? 'ty' : 'tgr';
  var stLabel = a.status==='aktif' ? 'Aktif' : a.status==='planning' ? 'Planning' : 'Non-Aktif';
  var tyLabel = (a.type||'-').charAt(0).toUpperCase()+(a.type||'').slice(1);
  var pct = (a.target_homes > 0) ? Math.min(100, Math.round((a.pelanggan||0) / a.target_homes * 100)) : 0;
  var barClass = pct >= 90 ? 'full' : pct >= 70 ? 'warn' : '';
  var created = a.created_at ? new Date(a.created_at) : null;
  var createdStr = created ? (function(d){ var p=function(n){return n<10?'0'+n:n;}; return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes()); })(created) : '—';

  document.getElementById('area-det-body').innerHTML =
    '<div class="area-det-section"><i class="ti ti-info-circle"></i> Informasi Dasar</div>' +
    _detRow('Kode Area', '<span style="font-family:\'JetBrains Mono\',monospace;color:var(--c1)">'+_esc(a.kode||'—')+'</span>') +
    _detRow('Nama Area', _esc(a.nama||'—')) +
    _detRow('Kota', _esc(a.kota||'—')) +
    _detRow('Provinsi', _esc(a.provinsi||'—')) +
    _detRow('Tipe', tyLabel) +
    _detRow('Status', '<span class="tag '+stClass+'">'+stLabel+'</span>') +
    '<div class="area-det-section"><i class="ti ti-chart-bar"></i> Coverage & Utilisasi</div>' +
    _detRow('Target HU', _fmt(a.target_homes||0)+' Homes') +
    _detRow('Pelanggan', _fmt(a.pelanggan||0)+' orang') +
    _detRow('Utilisasi',
      a.target_homes > 0 ?
        '<div style="display:flex;align-items:center;gap:8px;flex:1">'+
        '<div class="area-util-bar-bg" style="flex:1"><div class="area-util-bar '+barClass+'" style="width:'+pct+'%"></div></div>'+
        '<span style="font-weight:800;font-family:\'JetBrains Mono\',monospace;font-size:12px">'+pct+'%</span>'+
        '</div>' : '<span style="color:var(--text3)">—</span>'
    ) +
    '<div class="area-det-section"><i class="ti ti-notes"></i> Keterangan</div>' +
    _detRow('Catatan', _esc(a.keterangan||'—')) +
    _detRow('Dibuat', createdStr) +
    '<div style="display:flex;gap:8px;margin-top:14px">' +
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="areaDelete(\''+a.id+'\')"><i class="ti ti-trash"></i> Hapus</button>' +
    '</div>';

  document.getElementById('area-det-overlay').classList.add('on');
}

function areaCloseDet(){
  document.getElementById('area-det-overlay').classList.remove('on');
  _areaDetId = null;
}

function areaDetEdit(){
  var a = _areaData.find(function(x){ return x.id===_areaDetId; });
  if(!a) return;
  areaCloseDet();
  areaOpenForm(a);
}

/* ── Delete ── */
function areaDelete(id){
  var a = _areaData.find(function(x){ return x.id===id; });
  if(!a) return;
  if(!confirm('Hapus area "'+a.nama+'"?\nData tidak bisa dikembalikan.')) return;
  var sb = getSB();
  if(!sb){ toast('Database tidak terhubung','err'); return; }
  sb.from('areas').delete().eq('id',id)
    .then(function(r){
      if(r.error){ toast('Gagal hapus: '+(r.error.message||'coba lagi'),'err'); return; }
      toast('Area "'+a.nama+'" dihapus','ok');
      if(window.SOT) SOT.invalidate('general'); /* invalidate area cache */
      areaCloseDet();
      _areaLoaded=false;
      areaLoad();
    })
    .catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });
}

/* ── Helpers ── */
function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _fmt(n){ return Number(n||0).toLocaleString('id-ID'); }
function _detRow(lbl, val){
  return '<div class="area-det-row"><div class="area-det-lbl">'+lbl+'</div><div class="area-det-val">'+val+'</div></div>';
}
var _oltData   = [];
var _oltFil    = [];
var _oltPage   = 1;
var _oltPerPg  = 15;
var _oltDetId  = null;
var _oltLoaded = false;

/* ── Auto-load hook ── */
/* OPT: dispatch hook */
_navDispatch.register('olt', function(){ oltLoad(); });

/* ── Generate kode ── */
function _genOltKode(){
  var n = (_oltData.length + 1).toString().padStart(3,'0');
  return 'OLT-' + n;
}

/* ── Populate area dropdown helper ── */
function _oltFillAreaDropdown(selId, currentVal){
  var sel = document.getElementById(selId);
  if(!sel) return;
  var cur = currentVal || sel.value;
  sel.innerHTML = '<option value="">— Pilih Area —</option>';
  _areaData.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.nama + ' (' + a.kode + ')';
    if(a.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
}

/* ── Populate area filter dropdown ── */
function _oltFillAreaFilter(){
  var sel = document.getElementById('olt-fil-area');
  if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">Semua Area</option>';
  _areaData.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.nama;
    if(a.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
}

/* ── Load ── */
function oltLoad(){
  var list = document.getElementById('olt-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = getSB();
  if(!sb){ oltRenderEmpty('Koneksi Supabase tidak aktif'); return; }

  /* Load area dulu kalau belum ada */
  var areaPromise = _areaData.length > 0
    ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData = r.data||[]; });

  areaPromise.then(function(){
    _oltFillAreaFilter();
    sb.from('olts').select('id,kode,nama,area_id,status,lokasi,brand,model,jumlah_pon,pon_used,uplink,lat,lng,keterangan,created_at').order('created_at',{ascending:false})
      .then(function(r){
        if(r.error){ oltRenderEmpty('Gagal memuat: '+(r.error.message||'coba lagi')); return; }
        _oltData = r.data || [];
        _oltLoaded = true;
        oltUpdateStats();
        oltRender();
      })
      .catch(function(e){ oltRenderEmpty('Error: '+(e.message||'coba lagi')); });
  });
}

/* ── Stats ── */
function oltUpdateStats(){
  var total = _oltData.length;
  var aktif = _oltData.filter(function(o){ return o.status==='aktif'; }).length;
  var maint = _oltData.filter(function(o){ return o.status==='maintenance'; }).length;
  var down  = _oltData.filter(function(o){ return o.status==='down'; }).length;
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  e('ost-total',total); e('ost-aktif',aktif); e('ost-maint',maint); e('ost-down',down);
}

/* ── Search ── */
function oltSearch(q){
  _oltPage=1;
  var clr=document.getElementById('olt-search-clr');
  if(clr) clr.style.display=q?'block':'none';
  oltRender();
}
function oltClearSearch(){
  var inp=document.getElementById('olt-search'); if(inp) inp.value='';
  var clr=document.getElementById('olt-search-clr'); if(clr) clr.style.display='none';
  _oltPage=1; oltRender();
}

/* ── Render ── */
function oltRender(){
  var q    = (document.getElementById('olt-search')||{}).value||'';
  var fSt  = (document.getElementById('olt-fil-status')||{}).value||'';
  var fAr  = (document.getElementById('olt-fil-area')||{}).value||'';
  var fBr  = (document.getElementById('olt-fil-brand')||{}).value||'';
  q = q.toLowerCase().trim();

  _oltFil = _oltData.filter(function(o){
    var matchQ  = !q || (o.nama||'').toLowerCase().includes(q) || (o.kode||'').toLowerCase().includes(q) || (o.lokasi||'').toLowerCase().includes(q);
    var matchSt = !fSt || o.status===fSt;
    var matchAr = !fAr || o.area_id===fAr;
    var matchBr = !fBr || o.brand===fBr;
    return matchQ && matchSt && matchAr && matchBr;
  });

  var total = _oltFil.length;
  var pages = Math.max(1, Math.ceil(total/_oltPerPg));
  if(_oltPage>pages) _oltPage=pages;
  var start = (_oltPage-1)*_oltPerPg;
  var slice = _oltFil.slice(start, start+_oltPerPg);

  var list = document.getElementById('olt-list');
  if(!list) return;

  if(!total){
    list.innerHTML='<div class="olt-empty"><i class="ti ti-antenna-off"></i><p>Tidak ada data OLT</p><small>Coba ubah filter atau tambah OLT baru</small></div>';
    document.getElementById('olt-pagi').style.display='none';
    return;
  }

  list.innerHTML = slice.map(function(o){ return oltRowHTML(o); }).join('');

  var pagi=document.getElementById('olt-pagi');
  var prev=document.getElementById('olt-prev');
  var next=document.getElementById('olt-next');
  var info=document.getElementById('olt-pagi-info');
  if(pages>1){
    pagi.style.display='flex';
    if(prev) prev.disabled=_oltPage<=1;
    if(next) next.disabled=_oltPage>=pages;
    if(info) info.textContent=_oltPage+' / '+pages;
  } else { pagi.style.display='none'; }
}

function oltRenderEmpty(msg){
  var list=document.getElementById('olt-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>'+msg+'</p></div>';
}

/* ── Area name lookup ── */
function _areaName(id){
  var a = _areaData.find(function(x){ return x.id===id; });
  return a ? a.nama : '—';
}

/* ── Row HTML ── */
function oltRowHTML(o){
  var stClass = o.status==='aktif' ? 'tg' : o.status==='maintenance' ? 'ty' : o.status==='down' ? 'tr' : 'tgr';
  var stLabel = {aktif:'Aktif',maintenance:'Maintenance',down:'Down',planning:'Planning'}[o.status] || o.status;
  var avClass = o.status||'aktif';
  var brand   = o.brand||'—';
  var initials= brand.substring(0,3).toUpperCase();

  /* Port utilization */
  var pon  = o.jumlah_pon||0;
  var used = o.pon_used||0;
  var pct  = pon>0 ? Math.min(100,Math.round(used/pon*100)) : 0;
  var barC = pct>=90?'full':pct>=70?'warn':'ok';

  var portHtml = pon>0 ?
    '<div class="olt-port-wrap">'+
    '<span class="olt-port-label">PON '+used+'/'+pon+'</span>'+
    '<div class="olt-port-bar-bg"><div class="olt-port-bar '+barC+'" style="width:'+pct+'%"></div></div>'+
    '<span class="olt-port-pct">'+pct+'%</span>'+
    '</div>' : '';

  return '<div class="olt-row" onclick="oltOpenDet(\''+o.id+'\')">'+
    '<button class="olt-row-detail-btn" onclick="event.stopPropagation();oltOpenDet(\''+o.id+'\')"><i class="ti ti-chevron-right"></i></button>'+
    '<div class="olt-row-top">'+
      '<div class="olt-row-av '+avClass+'">'+initials+'</div>'+
      '<div class="olt-row-info">'+
        '<div class="olt-row-name">'+_esc(o.nama||'—')+'</div>'+
        '<div class="olt-row-kode">'+_esc(o.kode||'—')+' · '+_esc(o.lokasi||'—')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="olt-row-meta">'+
      '<span class="tag '+stClass+'">'+stLabel+'</span>'+
      '<span class="tag tc"><span style="color:var(--cyan);background:var(--cyg);padding:3px 8px;border-radius:20px;font-size:9px;font-weight:700">'+_esc(brand)+'</span></span>'+
      (o.model ? '<span class="tag tgr">'+_esc(o.model)+'</span>' : '')+
      (o.uplink ? '<span class="tag tpu">'+_esc(o.uplink)+'</span>' : '')+
      '<span class="tag tgr">'+_esc(_areaName(o.area_id))+'</span>'+
    '</div>'+
    portHtml+
  '</div>';
}

/* ── Pagination ── */
function oltPage(dir){
  var pages=Math.max(1,Math.ceil(_oltFil.length/_oltPerPg));
  _oltPage=Math.min(pages,Math.max(1,_oltPage+dir));
  oltRender();
}

/* ── Open Form ── */
function oltOpenForm(data){
  var isEdit=!!data;
  document.getElementById('olt-form-title').textContent=isEdit?'Edit OLT':'Tambah OLT';
  document.getElementById('of-id').value      = isEdit?(data.id||''):'';
  document.getElementById('of-kode').value    = isEdit?(data.kode||''):_genOltKode();
  document.getElementById('of-nama').value    = isEdit?(data.nama||''):'';
  document.getElementById('of-lokasi').value  = isEdit?(data.lokasi||''):'';
  document.getElementById('of-brand').value   = isEdit?(data.brand||'Huawei'):'Huawei';
  document.getElementById('of-model').value   = isEdit?(data.model||''):'';
  document.getElementById('of-pon').value     = isEdit?(data.jumlah_pon||16):16;
  document.getElementById('of-pon-used').value= isEdit?(data.pon_used||0):0;
  document.getElementById('of-status').value  = isEdit?(data.status||'aktif'):'aktif';
  document.getElementById('of-uplink').value  = isEdit?(data.uplink||'10G'):'10G';
  document.getElementById('of-lat').value     = isEdit?(data.lat||''):'';
  document.getElementById('of-lng').value     = isEdit?(data.lng||''):'';
  document.getElementById('of-ket').value     = isEdit?(data.keterangan||''):'';
  _oltFillAreaDropdown('of-area', isEdit?data.area_id:'');
  ['of-kode','of-nama','of-lokasi','of-area'].forEach(function(id){ var e=document.getElementById(id); if(e) e.classList.remove('err'); });
  document.getElementById('olt-form-overlay').classList.add('on');
}
function oltCloseForm(){ document.getElementById('olt-form-overlay').classList.remove('on'); }

/* ── Save ── */
function oltSave(){
  var id     = document.getElementById('of-id').value;
  var kode   = document.getElementById('of-kode').value.trim().toUpperCase();
  var nama   = document.getElementById('of-nama').value.trim();
  var areaId = document.getElementById('of-area').value;
  var lokasi = document.getElementById('of-lokasi').value.trim();
  var brand  = document.getElementById('of-brand').value;
  var model  = document.getElementById('of-model').value.trim();
  var pon    = parseInt(document.getElementById('of-pon').value)||0;
  var ponUsed= parseInt(document.getElementById('of-pon-used').value)||0;
  var status = document.getElementById('of-status').value;
  var uplink = document.getElementById('of-uplink').value;
  var lat    = parseFloat(document.getElementById('of-lat').value)||null;
  var lng    = parseFloat(document.getElementById('of-lng').value)||null;
  var ket    = document.getElementById('of-ket').value.trim();

  var ok=true;
  var chk=function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('of-kode',kode); chk('of-nama',nama); chk('of-lokasi',lokasi); chk('of-area',areaId);
  if(!ok){ toast('Isi semua field wajib','err'); return; }

  var dup=_oltData.find(function(o){ return o.kode===kode && o.id!==id; });
  if(dup){ toast('Kode OLT sudah digunakan','err'); document.getElementById('of-kode').classList.add('err'); return; }

  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('of-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var payload={kode:kode,nama:nama,area_id:areaId,lokasi:lokasi,brand:brand,model:model,jumlah_pon:pon,pon_used:ponUsed,status:status,uplink:uplink,lat:lat,lng:lng,keterangan:ket};
  var p = id ? sb.from('olts').update(payload).eq('id',id) : sb.from('olts').insert([payload]);

  p.then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    toast(id?'OLT diperbarui':'OLT ditambahkan','ok');
    if(window.SOT) SOT.invalidate('general'); /* invalidate olt cache */
    oltCloseForm(); _oltLoaded=false; oltLoad();
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

/* ── Detail ── */
function oltOpenDet(id){
  var o=_oltData.find(function(x){ return x.id===id; });
  if(!o) return;
  _oltDetId=id;
  document.getElementById('olt-det-title').textContent=o.nama||'Detail OLT';

  /* Pastikan data ODC tersedia agar pemetaan Port OLT → ODC akurat */
  var odcPromise;
  if(_odcData.length>0){
    odcPromise=Promise.resolve();
  } else {
    var sb=getSB();
    odcPromise = sb
      ? sb.from('odcs').select('id,nama,kode,area_id,olt_id,olt_port_no,status,jumlah_port').order('olt_port_no')
          .then(function(r){ if(!r.error) _odcData=r.data||[]; })
          .catch(function(){})
      : Promise.resolve();
  }

  odcPromise.then(function(){ _oltRenderDet(o); });
}

function _oltRenderDet(o){
  if(_oltDetId!==o.id) return; /* user sudah pindah detail lain sebelum fetch selesai */

  var stClass={aktif:'tg',maintenance:'ty',down:'tr',planning:'tgr'}[o.status]||'tgr';
  var stLabel={aktif:'Aktif',maintenance:'Maintenance',down:'Down',planning:'Planning'}[o.status]||o.status;
  var pon=o.jumlah_pon||0; var used=o.pon_used||0;
  var pct=pon>0?Math.min(100,Math.round(used/pon*100)):0;
  var barC=pct>=90?'full':pct>=70?'warn':'ok';
  var created=o.created_at?new Date(o.created_at):null;
  var createdStr=created?(function(d){var p=function(n){return n<10?'0'+n:n;};return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());})(created):'—';

  var dr = _drRow;
  var sec = _secRow;

  /* ── Pemetaan Port OLT (PON) → ODC ── */
  var oltOdcs=_odcData.filter(function(x){ return x.olt_id===o.id; }).slice().sort(function(a,b){
    return (parseInt(a.olt_port_no)||9999)-(parseInt(b.olt_port_no)||9999);
  });
  var mapHtml;
  if(oltOdcs.length===0){
    mapHtml='<div class="olt-det-row"><div class="olt-det-val" style="color:var(--text3)">Belum ada ODC yang terhubung ke OLT ini</div></div>';
  } else {
    mapHtml=oltOdcs.map(function(d){
      var portLbl = d.olt_port_no ? 'Port '+_esc(String(d.olt_port_no)) : 'Port —';
      return '<div class="olt-det-row">'+
        '<div class="olt-det-lbl" style="font-family:\'JetBrains Mono\',monospace;color:var(--pu)">'+portLbl+'</div>'+
        '<div class="olt-det-val" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="oltCloseDet();odcOpenDet(\''+d.id+'\')">'+
          '<span class="tag tpu">'+_esc(d.nama||d.kode||'—')+'</span>'+
          '<i class="ti ti-chevron-right" style="font-size:13px;color:var(--text3)"></i>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  document.getElementById('olt-det-body').innerHTML =
    sec('info-circle','Informasi Dasar')+
    dr('Kode','<span style="font-family:\'JetBrains Mono\',monospace;color:var(--cyan)">'+_esc(o.kode||'—')+'</span>')+
    dr('Nama OLT',_esc(o.nama||'—'))+
    dr('Area','<span class="tag tc1">'+_esc(_areaName(o.area_id))+'</span>')+
    dr('Lokasi',_esc(o.lokasi||'—'))+
    dr('Status','<span class="tag '+stClass+'">'+stLabel+'</span>')+
    sec('cpu','Spesifikasi Perangkat')+
    dr('Brand',_esc(o.brand||'—'))+
    dr('Model',_esc(o.model||'—'))+
    dr('Uplink','<span class="tag tpu">'+_esc(o.uplink||'—')+'</span>')+
    sec('circuit-switchboard','Port & Kapasitas')+
    dr('Total PON',_fmt(pon)+' port')+
    dr('Terpakai',_fmt(used)+' port')+
    dr('Utilisasi', pon>0 ?
      '<div style="display:flex;align-items:center;gap:8px;flex:1">'+
      '<div class="olt-port-bar-bg" style="flex:1"><div class="olt-port-bar '+barC+'" style="width:'+pct+'%"></div></div>'+
      '<span style="font-weight:800;font-family:\'JetBrains Mono\',monospace;font-size:12px">'+pct+'%</span>'+
      '</div>' : '<span style="color:var(--text3)">—</span>')+
    sec('topology-star','Pemetaan Port → ODC')+
    mapHtml+
    sec('map-pin','Koordinat & Catatan')+
    dr('Latitude', o.lat ? String(o.lat) : '—')+
    dr('Longitude', o.lng ? String(o.lng) : '—')+
    dr('Keterangan',_esc(o.keterangan||'—'))+
    dr('Dibuat',createdStr)+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="oltDelete(\''+o.id+'\')"><i class="ti ti-trash"></i> Hapus</button>'+
    '</div>';

  document.getElementById('olt-det-overlay').classList.add('on');
}
function oltCloseDet(){ document.getElementById('olt-det-overlay').classList.remove('on'); _oltDetId=null; }
function oltDetEdit(){
  var o=_oltData.find(function(x){ return x.id===_oltDetId; });
  if(!o) return;
  oltCloseDet(); oltOpenForm(o);
}

/* ── Delete ── */
function oltDelete(id){
  var o=_oltData.find(function(x){ return x.id===id; });
  if(!o) return;
  if(!confirm('Hapus OLT "'+o.nama+'"?\nData tidak bisa dikembalikan.')) return;
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  sb.from('olts').delete().eq('id',id)
    .then(function(r){
      if(r.error){ toast('Gagal hapus: '+(r.error.message||'coba lagi'),'err'); return; }
      toast('OLT "'+o.nama+'" dihapus','ok');
      if(window.SOT) SOT.invalidate('general'); /* invalidate olt cache */
      oltCloseDet(); _oltLoaded=false; oltLoad();
    })
    .catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });
}
var _odcData   = [];
var _odcFil    = [];
var _odcPage   = 1;
var _odcPerPg  = 15;
var _odcDetId  = null;
var _odcLoaded = false;

/* ── Auto-load hook ── */
/* OPT: dispatch hook */
_navDispatch.register('odc', function(){ odcLoad(); });

/* ── Generate kode ── */
function _genOdcKode(){
  var n = (_odcData.length + 1).toString().padStart(3,'0');
  return 'ODC-' + n;
}

/* ── Fill Area dropdown ── */
function _odcFillAreaDropdown(selId, currentVal){
  var sel = document.getElementById(selId);
  if(!sel) return;
  var cur = currentVal || sel.value;
  sel.innerHTML = '<option value="">— Pilih Area —</option>';
  _areaData.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.nama + ' (' + a.kode + ')';
    if(a.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
}

/* ── Fill OLT dropdown — STRICT filter by area ── */
function _odcFillOltDropdown(selId, currentVal, areaId){
  var sel = document.getElementById(selId);
  if(!sel) return;
  var cur = currentVal || sel.value;

  if(!areaId){
    sel.innerHTML = '<option value="">— Pilih Area dulu —</option>';
    sel.disabled = true;
    _odcSetOltHint(0, '');
    return;
  }

  /* Filter STRICT: hanya OLT di area yang dipilih */
  var list = _oltData.filter(function(o){ return o.area_id === areaId; });
  list.sort(function(a,b){ return (a.kode||'').localeCompare(b.kode||''); });

  var areaNama = (_areaData.find(function(a){ return a.id===areaId; })||{}).nama||'';

  if(!list.length){
    sel.innerHTML = '<option value="">— Tidak ada OLT di area ini —</option>';
    sel.disabled = true;
    _odcSetOltHint(0, areaNama);
    return;
  }

  sel.disabled = false;
  sel.innerHTML = '<option value="">— Pilih OLT ('+list.length+' tersedia) —</option>';
  list.forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = o.kode + (o.nama ? ' — ' + o.nama : '') + (o.status==='aktif'?'':' ⚠');
    if(o.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
  _odcSetOltHint(list.length, areaNama);
}

function _odcSetOltHint(count, areaNama){
  var hint = document.getElementById('odcf-olt-hint');
  if(!hint) return;
  if(!areaNama){ hint.textContent=''; hint.style.display='none'; return; }
  hint.style.display='block';
  hint.style.color = count>0 ? 'var(--green)' : 'var(--red)';
  hint.textContent = count>0
    ? '✓ '+count+' OLT tersedia di '+areaNama
    : '⚠ Belum ada OLT di '+areaNama+' — tambahkan OLT dulu';
}

/* ── Dropdown Port OLT (PON): tampilkan kosong/terpakai + detail ODC pemakai ── */
function _odcLoadOltPortDropdown(oltId, currentPort, excludeOdcId){
  var sel  = document.getElementById('odcf-olt-port');
  var info = document.getElementById('odcf-olt-port-info');
  if(!sel) return;
  if(info){ info.style.display='none'; info.innerHTML=''; }

  if(!oltId){
    sel.innerHTML = '<option value="">— Pilih OLT dulu —</option>';
    sel.disabled = true;
    return;
  }

  var olt = _oltData.find(function(o){ return o.id===oltId; });
  var totalPon = (olt && olt.jumlah_pon) ? parseInt(olt.jumlah_pon) : 0;
  if(!totalPon){
    sel.innerHTML = '<option value="">— OLT ini belum punya jumlah PON —</option>';
    sel.disabled = true;
    return;
  }

  /* ODC lain (selain yang sedang diedit) yang sudah memakai port OLT ini */
  var pakai = {};
  _odcData.forEach(function(o){
    if(o.olt_id===oltId && o.id!==excludeOdcId && o.olt_port_no){
      pakai[parseInt(o.olt_port_no)] = o;
    }
  });

  sel.disabled = false;
  var opts = ['<option value="">— Pilih Port PON —</option>'];
  for(var i=1;i<=totalPon;i++){
    var used = pakai[i];
    var isCur = currentPort && parseInt(currentPort)===i;
    opts.push('<option value="'+i+'"'+(used&&!isCur?' disabled':'')+(isCur?' selected':'')+'>'+
      'Port '+i+(used&&!isCur?' — 🔴 Dipakai ('+_esc(used.nama||used.kode||'')+')':' — 🟢 Kosong')+
    '</option>');
  }
  sel.innerHTML = opts.join('');

  sel.onchange = function(){
    var v = parseInt(this.value)||0;
    var used = v ? pakai[v] : null;
    if(!info) return;
    if(used){
      info.style.display='block';
      info.style.background='rgba(239,68,68,.07)';
      info.style.borderColor='#ef4444';
      info.innerHTML = '<div style="font-weight:700;color:#ef4444;margin-bottom:4px">⚠️ Port sudah dipakai</div>'+
        '<div><b>ODC:</b> '+_esc(used.nama||used.kode||'—')+'</div>';
    } else {
      info.style.display='none'; info.innerHTML='';
    }
  };

  /* Tampilkan info jika sedang edit dengan port yang (seharusnya) kosong untuk ODC ini */
  if(currentPort) sel.onchange();
}

/* ── Fill filter dropdowns ── */
function _odcFillFilters(){
  var selArea = document.getElementById('odc-fil-area');
  if(selArea){
    var curA = selArea.value;
    selArea.innerHTML = '<option value="">Semua Area</option>';
    _areaData.forEach(function(a){
      var opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.nama;
      if(a.id === curA) opt.selected = true;
      selArea.appendChild(opt);
    });
  }
  var selOlt = document.getElementById('odc-fil-olt');
  if(selOlt){
    var curO = selOlt.value;
    selOlt.innerHTML = '<option value="">Semua OLT</option>';
    _oltData.forEach(function(o){
      var opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = o.nama;
      if(o.id === curO) opt.selected = true;
      selOlt.appendChild(opt);
    });
  }
}

/* ── Load ── */
function odcLoad(){
  var list = document.getElementById('odc-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = getSB();
  if(!sb){ odcRenderEmpty('Koneksi Supabase tidak aktif'); return; }

  /* Pastikan area & olt sudah dimuat */
  var p1 = _areaData.length > 0
    ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData = r.data||[]; });
  var p2 = _oltData.length > 0
    ? Promise.resolve()
    : sb.from('olts').select('id,nama,kode,area_id').order('nama').then(function(r){ if(!r.error) _oltData = r.data||[]; });

  Promise.all([p1, p2]).then(function(){
    _odcFillFilters();
    /* OPT: cek cache */
    var _odcC = null; /* SOT cache — always re-fetch if empty */
    sb.from('odcs').select('id,kode,nama,area_id,olt_id,status,jumlah_port,lat,lng,created_at').order('created_at',{ascending:false})
      .then(function(r){
        if(r.error){ odcRenderEmpty('Gagal memuat: '+(r.error.message||'coba lagi')); return; }
        _odcData = r.data || [];
        _odcLoaded = true;
        odcUpdateStats();
        odcRender();
        (function(){})() /* removed */;
      })
      .catch(function(e){ odcRenderEmpty('Error: '+(e.message||'coba lagi')); });
  });
}

/* ── Stats ──
   T20: Statistik dihitung berdasarkan AREA (dan OLT) yang dipilih
   pada filter, TIDAK ikut filter status/pencarian. Ini supaya saat
   user memilih satu area (misal Cicurug = 20 ODC), kartu statistik
   menampilkan total 20 ODC tersebut (dipecah aktif/maintenance/full),
   bukan gabungan seluruh area lain. Jika "Semua Area" dipilih, stat
   tetap menunjukkan total keseluruhan seperti sebelumnya. */
function odcUpdateStats(){
  var fAr = (document.getElementById('odc-fil-area')||{}).value||'';
  var fOl = (document.getElementById('odc-fil-olt')||{}).value||'';
  var src = _odcData.filter(function(o){
    var matchAr = !fAr || o.area_id===fAr;
    var matchOl = !fOl || o.olt_id===fOl;
    return matchAr && matchOl;
  });
  var total = src.length;
  var aktif = src.filter(function(o){ return o.status==='aktif'; }).length;
  var maint = src.filter(function(o){ return o.status==='maintenance'; }).length;
  var full  = src.filter(function(o){ return o.status==='full'; }).length;
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  e('odcst-total',total); e('odcst-aktif',aktif); e('odcst-maint',maint); e('odcst-full',full);
}

/* ── Search ── */
function odcSearch(q){
  _odcPage=1;
  var clr=document.getElementById('odc-search-clr');
  if(clr) clr.style.display=q?'block':'none';
  odcRender();
}
function odcClearSearch(){
  var inp=document.getElementById('odc-search'); if(inp) inp.value='';
  var clr=document.getElementById('odc-search-clr'); if(clr) clr.style.display='none';
  _odcPage=1; odcRender();
}

/* ── Render ── */
function odcRender(){
  var q   = (document.getElementById('odc-search')||{}).value||'';
  var fSt = (document.getElementById('odc-fil-status')||{}).value||'';
  var fAr = (document.getElementById('odc-fil-area')||{}).value||'';
  var fOl = (document.getElementById('odc-fil-olt')||{}).value||'';
  q = q.toLowerCase().trim();

  _odcFil = _odcData.filter(function(o){
    var matchQ  = !q || (o.nama||'').toLowerCase().includes(q) || (o.kode||'').toLowerCase().includes(q) || (o.lokasi||'').toLowerCase().includes(q);
    var matchSt = !fSt || o.status===fSt;
    var matchAr = !fAr || o.area_id===fAr;
    var matchOl = !fOl || o.olt_id===fOl;
    return matchQ && matchSt && matchAr && matchOl;
  });

  /* T20: update kartu statistik mengikuti filter Area yang aktif */
  odcUpdateStats();

  var total = _odcFil.length;
  var pages = Math.max(1, Math.ceil(total/_odcPerPg));
  if(_odcPage>pages) _odcPage=pages;
  var start = (_odcPage-1)*_odcPerPg;
  var slice = _odcFil.slice(start, start+_odcPerPg);

  var list = document.getElementById('odc-list');
  if(!list) return;

  if(!total){
    list.innerHTML='<div class="olt-empty"><i class="ti ti-box-off"></i><p>Tidak ada data ODC</p><small>Coba ubah filter atau tambah ODC baru</small></div>';
    document.getElementById('odc-pagi').style.display='none';
    return;
  }

  list.innerHTML = slice.map(function(o){ return odcRowHTML(o); }).join('');

  var pagi=document.getElementById('odc-pagi');
  var prev=document.getElementById('odc-prev');
  var next=document.getElementById('odc-next');
  var info=document.getElementById('odc-pagi-info');
  if(pages>1){
    pagi.style.display='flex';
    if(prev) prev.disabled=_odcPage<=1;
    if(next) next.disabled=_odcPage>=pages;
    if(info) info.textContent=_odcPage+' / '+pages;
  } else { pagi.style.display='none'; }
}

function odcRenderEmpty(msg){
  var list=document.getElementById('odc-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>'+msg+'</p></div>';
}

/* ── Lookup helpers ── */
function _odcAreaName(id){ var a=_areaData.find(function(x){return x.id===id;}); return a?a.nama:'—'; }
function _odcOltName(id){ var o=_oltData.find(function(x){return x.id===id;}); return o?o.nama:'—'; }

/* ── Row HTML ── */
function odcRowHTML(o){
  var stMap = {aktif:'tg',maintenance:'ty',full:'tr',planning:'tgr',nonaktif:'tgr'};
  var stLbl = {aktif:'Aktif',maintenance:'Maintenance',full:'Full',planning:'Planning',nonaktif:'Non-Aktif'};
  var stClass = stMap[o.status]||'tgr';
  var stLabel = stLbl[o.status]||o.status;

  var port  = o.jumlah_port||0;
  var used  = (function(){ var ids={}; (typeof _odpData!=='undefined'?_odpData:[]).filter(function(x){return x.odc_id===o.id;}).forEach(function(x){ids[x.id]=1;}); return (typeof SOT!=='undefined'&&SOT.cache().ports.length)?SOT.cache().ports.filter(function(p){return ids[p.odp_id]&&typeof PORT_STATUS!=='undefined'&&PORT_STATUS.isUsed(p.status);}).length:0; })();
  var pct   = port>0 ? Math.min(100,Math.round(used/port*100)) : 0;
  var barC  = pct>=90?'full':pct>=70?'warn':'ok';

  var portHtml = port>0 ?
    '<div class="olt-port-wrap">'+
    '<span class="olt-port-label">Port '+used+'/'+port+'</span>'+
    '<div class="olt-port-bar-bg"><div class="olt-port-bar '+barC+'" style="width:'+pct+'%"></div></div>'+
    '<span class="olt-port-pct">'+pct+'%</span>'+
    '</div>' : '';

  var typeLabel = {aerial:'Aerial',pedestal:'Pedestal',wall:'Wall Mount',indoor:'Indoor'}[o.type]||o.type||'—';

  return '<div class="olt-row" onclick="odcOpenDet(\''+o.id+'\')">'+
    '<button class="olt-row-detail-btn" onclick="event.stopPropagation();odcOpenDet(\''+o.id+'\')"><i class="ti ti-chevron-right"></i></button>'+
    '<div class="olt-row-top">'+
      '<div class="olt-row-av '+(o.status==='full'?'down':o.status==='maintenance'?'maintenance':'aktif')+'"><i class="ti ti-box" style="font-size:16px"></i></div>'+
      '<div class="olt-row-info">'+
        '<div class="olt-row-name">'+_esc(o.nama||'—')+'</div>'+
        '<div class="olt-row-kode">'+_esc(o.kode||'—')+' · '+_esc(o.lokasi||'—')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="olt-row-meta">'+
      '<span class="tag '+stClass+'">'+stLabel+'</span>'+
      '<span class="tag tc"><span style="color:var(--cyan);background:var(--cyg);padding:3px 8px;border-radius:20px;font-size:9px;font-weight:700">'+_esc(typeLabel)+'</span></span>'+
      '<span class="tag tgr">'+_esc(_odcAreaName(o.area_id))+'</span>'+
      '<span class="tag tpu" style="background:var(--pug);color:var(--pu)">'+_esc(_odcOltName(o.olt_id))+(o.olt_port_no?(' P'+_esc(String(o.olt_port_no))):'')+'</span>'+
    '</div>'+
    portHtml+
  '</div>';
}

/* ── Pagination ── */
function odcPage(dir){
  var pages=Math.max(1,Math.ceil(_odcFil.length/_odcPerPg));
  _odcPage=Math.min(pages,Math.max(1,_odcPage+dir));
  odcRender();
}

/* ── Open Form ── */
function odcOpenForm(data){
  var isEdit=!!data;
  document.getElementById('odc-form-title').textContent=isEdit?'Edit ODC':'Tambah ODC';
  document.getElementById('odcf-id').value        = isEdit?(data.id||''):'';
  document.getElementById('odcf-kode').value      = isEdit?(data.kode||''):_genOdcKode();
  document.getElementById('odcf-nama').value      = isEdit?(data.nama||''):''; /* hidden, di-set saat save */
  document.getElementById('odcf-lokasi').value    = isEdit?(data.lokasi||''):'';
  document.getElementById('odcf-type').value      = isEdit?(data.type||'aerial'):'aerial';
  document.getElementById('odcf-port').value      = isEdit?(data.jumlah_port||16):16;
  document.getElementById('odcf-port-used').value = 0; /* dihitung realtime dari odp_ports */
  document.getElementById('odcf-status').value    = isEdit?(data.status||'aktif'):'aktif';
  document.getElementById('odcf-lat').value       = isEdit?(data.lat||''):'';
  document.getElementById('odcf-lng').value       = isEdit?(data.lng||''):'';
  document.getElementById('odcf-ket').value       = isEdit?(data.keterangan||''):'';
  var sb=getSB();
  var p1 = _areaData.length>0 ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; });
  /* Selalu reload _oltData agar filter area akurat + jumlah_pon untuk dropdown port */
  var p2 = sb.from('olts').select('id,nama,kode,area_id,status,jumlah_pon').order('kode')
    .then(function(r){ if(!r.error) _oltData=r.data||[]; });
  /* Pastikan _odcData tersedia agar pengecekan port OLT terpakai akurat */
  var p3 = _odcData.length>0 ? Promise.resolve()
    : sb.from('odcs').select('id,nama,kode,area_id,olt_id,olt_port_no').order('kode')
        .then(function(r){ if(!r.error) _odcData=r.data||[]; });
  Promise.all([p1,p2,p3]).then(function(){
    _odcFillAreaDropdown('odcf-area', isEdit?data.area_id:'');
    _odcFillOltDropdown('odcf-olt', isEdit?data.olt_id:'', isEdit?data.area_id:'');
    _odcLoadOltPortDropdown(isEdit?data.olt_id:'', isEdit?(data.olt_port_no||''):'', isEdit?(data.id||''):'');
    /* Wire: area change → filter OLT STRICT, reset port OLT */
    var selArea = document.getElementById('odcf-area');
    if(selArea){
      selArea.onchange = function(){
        _odcFillOltDropdown('odcf-olt', '', this.value);
        _odcLoadOltPortDropdown('', '', isEdit?(data.id||''):'');
      };
    }
    /* Wire: OLT change → reload dropdown port PON sesuai OLT terpilih */
    var selOlt = document.getElementById('odcf-olt');
    if(selOlt){
      selOlt.onchange = function(){
        _odcLoadOltPortDropdown(this.value, '', isEdit?(data.id||''):'');
      };
    }
  });
  ['odcf-kode','odcf-lokasi','odcf-area','odcf-olt','odcf-olt-port'].forEach(function(id){ var e=document.getElementById(id); if(e) e.classList.remove('err'); });
  document.getElementById('odc-form-overlay').classList.add('on');
}
function odcCloseForm(){ document.getElementById('odc-form-overlay').classList.remove('on'); }

/* ── Save ── */
function odcSave(){
  var id      = document.getElementById('odcf-id').value;
  var kode    = document.getElementById('odcf-kode').value.trim().toUpperCase();
  var nama    = document.getElementById('odcf-nama').value.trim();
  var areaId  = document.getElementById('odcf-area').value;
  var oltId   = document.getElementById('odcf-olt').value;
  var oltPort = parseInt(document.getElementById('odcf-olt-port').value)||0;
  var lokasi  = document.getElementById('odcf-lokasi').value.trim();
  var type    = document.getElementById('odcf-type').value;
  var port    = parseInt(document.getElementById('odcf-port').value)||0;
  /* port_used tidak disimpan — dihitung realtime dari odp_ports (SSOT Phase 7) */
  var status  = document.getElementById('odcf-status').value;
  var lat     = parseFloat(document.getElementById('odcf-lat').value)||null;
  var lng     = parseFloat(document.getElementById('odcf-lng').value)||null;
  var ket     = document.getElementById('odcf-ket').value.trim();

  var ok=true;
  var chk=function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('odcf-kode',kode); chk('odcf-lokasi',lokasi); chk('odcf-area',areaId); chk('odcf-olt',oltId); chk('odcf-olt-port',oltPort);
  if(!ok){ toast('Isi semua field wajib','err'); return; }

  var dup=_odcData.find(function(o){ return o.kode===kode && o.id!==id; });
  if(dup){ toast('Kode ODC sudah digunakan','err'); document.getElementById('odcf-kode').classList.add('err'); return; }

  /* Validasi 1:1 — 1 port PON OLT hanya untuk 1 ODC */
  var dupPort=_odcData.find(function(o){ return o.olt_id===oltId && parseInt(o.olt_port_no)===oltPort && o.id!==id; });
  if(dupPort){ toast('Port OLT '+oltPort+' sudah dipakai ODC "'+(dupPort.nama||dupPort.kode)+'"','err'); document.getElementById('odcf-olt-port').classList.add('err'); return; }

  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('odcf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var nama = kode; /* nama ODC = kode ODC */
  var payload={kode:kode,nama:nama,area_id:areaId,olt_id:oltId,olt_port_no:oltPort,lokasi:lokasi,type:type,jumlah_port:port,status:status,lat:lat,lng:lng,keterangan:ket};
  /* port_used TIDAK disimpan — dihitung realtime dari odp_ports (SSOT) */
  var p = id ? sb.from('odcs').update(payload).eq('id',id) : sb.from('odcs').insert([payload]);

  p.then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    toast(id?'ODC diperbarui':'ODC ditambahkan','ok');
    if(window.SOT) SOT.invalidate('general'); /* invalidate odc cache */
    odcCloseForm(); _odcLoaded=false; odcLoad();
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

/* ── Detail ── */
function odcOpenDet(id){
  var o=_odcData.find(function(x){ return x.id===id; });
  if(!o) return;
  _odcDetId=id;
  document.getElementById('odc-det-title').textContent=o.nama||'Detail ODC';

  /* Pastikan data ODP tersedia agar pemetaan Port ODC → ODP akurat */
  var odpPromise;
  if(_odpData.length>0){
    odpPromise=Promise.resolve();
  } else {
    var sb=getSB();
    odpPromise = sb
      ? sb.from('odps').select('id,nama,kode,area_id,odc_id,odc_port_no,status,jumlah_port').order('odc_port_no')
          .then(function(r){ if(!r.error) _odpData=r.data||[]; })
          .catch(function(){})
      : Promise.resolve();
  }

  odpPromise.then(function(){ _odcRenderDet(o); });
}

function _odcRenderDet(o){
  if(_odcDetId!==o.id) return; /* user sudah pindah detail lain sebelum fetch selesai */

  var stMap={aktif:'tg',maintenance:'ty',full:'tr',planning:'tgr',nonaktif:'tgr'};
  var stLbl={aktif:'Aktif',maintenance:'Maintenance',full:'Full',planning:'Planning',nonaktif:'Non-Aktif'};
  var stClass=stMap[o.status]||'tgr';
  var stLabel=stLbl[o.status]||o.status;
  var typeLabel={aerial:'Aerial (Udara)',pedestal:'Pedestal (Tanah)',wall:'Wall Mount',indoor:'Indoor'}[o.type]||o.type||'—';
  var port=o.jumlah_port||0; var _opsODC=(typeof SOT!=="undefined"&&SOT.odpStats)?{used:0}:{used:0}; var _odcOdps=(typeof _odpData!=="undefined")?_odpData.filter(function(x){return x.odc_id===o.id;}):[];var _odcPts=(typeof SOT!=="undefined"&&SOT.cache().ports.length)?SOT.cache().ports.filter(function(p){var r={}; _odcOdps.forEach(function(x){r[x.id]=1;}); return r[p.odp_id];}):[];var used=_odcPts.length?_odcPts.filter(function(p){return typeof PORT_STATUS!=="undefined"&&PORT_STATUS.isUsed(p.status);}).length:0;
  var pct=port>0?Math.min(100,Math.round(used/port*100)):0;
  var barC=pct>=90?'full':pct>=70?'warn':'ok';
  var created=o.created_at?new Date(o.created_at):null;
  var createdStr=created?(function(d){var p=function(n){return n<10?'0'+n:n;};return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());})(created):'—';

  var dr = _drRow;
  var sec = _secRow;

  /* ── Pemetaan Port ODC → ODP ── */
  var odcOdps=_odpData.filter(function(x){ return x.odc_id===o.id; }).slice().sort(function(a,b){
    return (parseInt(a.odc_port_no)||9999)-(parseInt(b.odc_port_no)||9999);
  });
  var mapHtml;
  if(odcOdps.length===0){
    mapHtml='<div class="olt-det-row"><div class="olt-det-val" style="color:var(--text3)">Belum ada ODP yang terhubung ke ODC ini</div></div>';
  } else {
    mapHtml=odcOdps.map(function(d){
      var portLbl = d.odc_port_no ? 'Port '+_esc(String(d.odc_port_no)) : 'Port —';
      return '<div class="olt-det-row">'+
        '<div class="olt-det-lbl" style="font-family:\'JetBrains Mono\',monospace;color:var(--c1)">'+portLbl+'</div>'+
        '<div class="olt-det-val" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="odcCloseDet();odpOpenDet(\''+d.id+'\')">'+
          '<span class="tag tc1" style="background:var(--c1b)">'+_esc(d.nama||d.kode||'—')+'</span>'+
          '<i class="ti ti-chevron-right" style="font-size:13px;color:var(--text3)"></i>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  document.getElementById('odc-det-body').innerHTML =
    sec('info-circle','Informasi Dasar')+
    dr('Kode','<span style="font-family:\'JetBrains Mono\',monospace;color:var(--c1)">'+_esc(o.kode||'—')+'</span>')+
    dr('Nama ODC',_esc(o.nama||'—'))+
    dr('Area','<span class="tag tc1">'+_esc(_odcAreaName(o.area_id))+'</span>')+
    dr('OLT Induk','<span class="tag tpu" style="background:var(--pug);color:var(--pu)">'+_esc(_odcOltName(o.olt_id))+'</span>')+
    dr('Port OLT (PON)', o.olt_port_no ? '<span style="font-family:\'JetBrains Mono\',monospace;font-weight:700">Port '+_esc(String(o.olt_port_no))+'</span>' : '<span style="color:var(--text3)">—</span>')+
    dr('Lokasi',_esc(o.lokasi||'—'))+
    dr('Tipe',typeLabel)+
    dr('Status','<span class="tag '+stClass+'">'+stLabel+'</span>')+
    sec('circuit-switchboard','Port & Kapasitas')+
    dr('Total Port',_fmt(port)+' port')+
    dr('Terpakai',_fmt(used)+' port')+
    dr('Utilisasi', port>0 ?
      '<div style="display:flex;align-items:center;gap:8px;flex:1">'+
      '<div class="olt-port-bar-bg" style="flex:1"><div class="olt-port-bar '+barC+'" style="width:'+pct+'%"></div></div>'+
      '<span style="font-weight:800;font-family:\'JetBrains Mono\',monospace;font-size:12px">'+pct+'%</span>'+
      '</div>' : '<span style="color:var(--text3)">—</span>')+
    sec('topology-star','Pemetaan Port → ODP')+
    mapHtml+
    sec('map-pin','Koordinat & Catatan')+
    dr('Latitude', o.lat ? String(o.lat) : '—')+
    dr('Longitude', o.lng ? String(o.lng) : '—')+
    dr('Keterangan',_esc(o.keterangan||'—'))+
    dr('Dibuat',createdStr)+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="odcDelete(\''+o.id+'\')"><i class="ti ti-trash"></i> Hapus</button>'+
    '</div>';

  document.getElementById('odc-det-overlay').classList.add('on');
}
function odcCloseDet(){ document.getElementById('odc-det-overlay').classList.remove('on'); _odcDetId=null; }
function odcDetEdit(){
  var o=_odcData.find(function(x){ return x.id===_odcDetId; });
  if(!o) return;
  odcCloseDet(); odcOpenForm(o);
}

/* ── Delete ── */
function odcDelete(id){
  var o=_odcData.find(function(x){ return x.id===id; });
  if(!o) return;
  if(!confirm('Hapus ODC "'+o.nama+'"?\nData tidak bisa dikembalikan.')) return;
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  sb.from('odcs').delete().eq('id',id)
    .then(function(r){
      if(r.error){ toast('Gagal hapus: '+(r.error.message||'coba lagi'),'err'); return; }
      toast('ODC "'+o.nama+'" dihapus','ok');
      if(window.SOT) SOT.invalidate('general'); /* invalidate odc cache */
      odcCloseDet(); _odcLoaded=false; odcLoad();
    })
    .catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });
}
var _odpData   = [];
var _odpFil    = [];
var _odpPage   = 1;
var _odpPerPg  = 15;
var _odpDetId  = null;
var _odpLoaded = false;

/* ── Auto-load hook ── */
/* OPT: dispatch hook */
_navDispatch.register('odp', function(){ odpLoad(); });

/* ── Generate kode ── */
function _genOdpKode(){
  var n = (_odpData.length + 1).toString().padStart(3,'0');
  return 'ODP-' + n;
}

/* ── Fill Area dropdown ── */
function _odpFillAreaDropdown(selId, currentVal){
  var sel = document.getElementById(selId);
  if(!sel) return;
  var cur = currentVal || sel.value;
  sel.innerHTML = '<option value="">— Pilih Area —</option>';
  _areaData.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.nama + ' (' + a.kode + ')';
    if(a.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
}

/* ── Fill ODC dropdown — STRICT filter by area ── */
function _odpFillOdcDropdown(selId, currentVal, areaId){
  var sel = document.getElementById(selId);
  if(!sel) return;
  var cur = currentVal || sel.value;

  if(!areaId){
    sel.innerHTML = '<option value="">— Pilih Area dulu —</option>';
    sel.disabled = true;
    _odpSetOdcHint(0, '');
    return;
  }

  /* Filter STRICT: hanya ODC di area yang dipilih */
  var list = _odcData.filter(function(o){ return o.area_id === areaId; });
  list.sort(function(a,b){ return (a.kode||'').localeCompare(b.kode||''); });

  var areaNama = (_areaData.find(function(a){ return a.id===areaId; })||{}).nama||'';

  if(!list.length){
    sel.innerHTML = '<option value="">— Tidak ada ODC di area ini —</option>';
    sel.disabled = true;
    _odpSetOdcHint(0, areaNama);
    return;
  }

  sel.disabled = false;
  sel.innerHTML = '<option value="">— Pilih ODC ('+list.length+' tersedia) —</option>';
  list.forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o.id;
    var portInfo = (o.jumlah_port) ? ' [Port: ?/'+o.jumlah_port+' (realtime)]' : '';
    opt.textContent = o.kode + (o.nama ? ' — '+o.nama : '') + portInfo + (o.status==='aktif'?'':' ⚠');
    if(o.id === cur) opt.selected = true;
    sel.appendChild(opt);
  });
  _odpSetOdcHint(list.length, areaNama);
}

function _odpSetOdcHint(count, areaNama){
  var hint = document.getElementById('odpf-odc-hint');
  if(!hint) return;
  if(!areaNama){ hint.textContent=''; hint.style.display='none'; return; }
  hint.style.display='block';
  hint.style.color = count>0 ? 'var(--green)' : 'var(--red)';
  hint.textContent = count>0
    ? '✓ '+count+' ODC tersedia di '+areaNama
    : '⚠ Belum ada ODC di '+areaNama+' — tambahkan ODC dulu';
}

/* ── Dropdown Port ODC: tampilkan kosong/terpakai + detail ODP pemakai ── */
function _odpLoadOdcPortDropdown(odcId, currentPort, excludeOdpId){
  var sel  = document.getElementById('odpf-odc-port');
  var info = document.getElementById('odpf-odc-port-info');
  if(!sel) return;
  if(info){ info.style.display='none'; info.innerHTML=''; }

  if(!odcId){
    sel.innerHTML = '<option value="">— Pilih ODC dulu —</option>';
    sel.disabled = true;
    return;
  }

  var odc = _odcData.find(function(o){ return o.id===odcId; });
  var totalPort = (odc && odc.jumlah_port) ? parseInt(odc.jumlah_port) : 0;
  if(!totalPort){
    sel.innerHTML = '<option value="">— ODC ini belum punya jumlah port —</option>';
    sel.disabled = true;
    return;
  }

  /* ODP lain (selain yang sedang diedit) yang sudah memakai port ODC ini */
  var pakai = {};
  _odpData.forEach(function(o){
    if(o.odc_id===odcId && o.id!==excludeOdpId && o.odc_port_no){
      pakai[parseInt(o.odc_port_no)] = o;
    }
  });

  sel.disabled = false;
  var opts = ['<option value="">— Pilih Port ODC —</option>'];
  for(var i=1;i<=totalPort;i++){
    var used = pakai[i];
    var isCur = currentPort && parseInt(currentPort)===i;
    opts.push('<option value="'+i+'"'+(used&&!isCur?' disabled':'')+(isCur?' selected':'')+'>'+
      'Port '+i+(used&&!isCur?' — 🔴 Dipakai ('+_esc(used.nama||used.kode||'')+')':' — 🟢 Kosong')+
    '</option>');
  }
  sel.innerHTML = opts.join('');

  sel.onchange = function(){
    var v = parseInt(this.value)||0;
    var used = v ? pakai[v] : null;
    if(!info) return;
    if(used){
      info.style.display='block';
      info.style.background='rgba(239,68,68,.07)';
      info.style.borderColor='#ef4444';
      info.innerHTML = '<div style="font-weight:700;color:#ef4444;margin-bottom:4px">⚠️ Port sudah dipakai</div>'+
        '<div><b>ODP:</b> '+_esc(used.nama||used.kode||'—')+'</div>';
    } else {
      info.style.display='none'; info.innerHTML='';
    }
  };

  if(currentPort) sel.onchange();
}

/* ── Fill filter dropdowns ── */
function _odpFillFilters(){
  var selArea = document.getElementById('odp-fil-area');
  if(selArea){
    var curA = selArea.value;
    selArea.innerHTML = '<option value="">Semua Area</option>';
    _areaData.forEach(function(a){
      var opt = document.createElement('option');
      opt.value = a.id; opt.textContent = a.nama;
      if(a.id === curA) opt.selected = true;
      selArea.appendChild(opt);
    });
  }
  var selOdc = document.getElementById('odp-fil-odc');
  if(selOdc){
    var curO = selOdc.value;
    selOdc.innerHTML = '<option value="">Semua ODC</option>';
    _odcData.forEach(function(o){
      var opt = document.createElement('option');
      opt.value = o.id; opt.textContent = o.nama;
      if(o.id === curO) opt.selected = true;
      selOdc.appendChild(opt);
    });
  }
}

/* ── Load ── */
function odpLoad(){
  var list = document.getElementById('odp-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = getSB();
  if(!sb){ odpRenderEmpty('Koneksi Supabase tidak aktif'); return; }

  var p1 = _areaData.length > 0 ? Promise.resolve() : _ensureAreas(sb); /* OPT: cache-aware */
  var p2 = _odcData.length > 0 ? Promise.resolve() : _ensureOdcs(sb); /* OPT: cache-aware */

  Promise.all([p1, p2]).then(function(){
    _odpFillFilters();
    /* OPT: cek cache */
    var _odpC = null; /* SOT cache — always re-fetch if empty */
    sb.from('odps').select('id,kode,nama,area_id,odc_id,status,jumlah_port,lat,lng,lokasi,type,keterangan,created_at').order('created_at',{ascending:false})
      .then(function(r){
        if(r.error){ odpRenderEmpty('Gagal memuat: '+(r.error.message||'coba lagi')); return; }
        _odpData = r.data || [];
        _odpLoaded = true;
        odpUpdateStats();
        odpRender();
        (function(){})() /* removed */;
      })
      .catch(function(e){ odpRenderEmpty('Error: '+(e.message||'coba lagi')); });
  });
}

/* ── Stats ──
   T20: Statistik ODP dihitung berdasarkan AREA (dan ODC) yang dipilih
   pada filter, tidak ikut filter status/pencarian. Sehingga jika area
   Cibadak punya 10 ODC, ODP yang ditampilkan juga hanya milik
   area/ODC tersebut — owner tidak bingung melihat "port kosong"
   gabungan dari area lain. */
function odpUpdateStats(){
  var fAr = (document.getElementById('odp-fil-area')||{}).value||'';
  var fOc = (document.getElementById('odp-fil-odc')||{}).value||'';
  var src = _odpData.filter(function(o){
    var matchAr = !fAr || o.area_id===fAr;
    var matchOc = !fOc || o.odc_id===fOc;
    return matchAr && matchOc;
  });
  var total = src.length;
  var aktif = src.filter(function(o){ return o.status==='aktif'; }).length;
  var maint = src.filter(function(o){ return o.status==='maintenance'; }).length;
  var full  = src.filter(function(o){ return o.status==='full'; }).length;
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  e('odpst-total',total); e('odpst-aktif',aktif); e('odpst-maint',maint); e('odpst-full',full);
}

/* ── Search ── */
function odpSearch(q){
  _odpPage=1;
  var clr=document.getElementById('odp-search-clr');
  if(clr) clr.style.display=q?'block':'none';
  odpRender();
}
function odpClearSearch(){
  var inp=document.getElementById('odp-search'); if(inp) inp.value='';
  var clr=document.getElementById('odp-search-clr'); if(clr) clr.style.display='none';
  _odpPage=1; odpRender();
}

/* ── Render ── */
function odpRender(){
  var q   = (document.getElementById('odp-search')||{}).value||'';
  var fSt = (document.getElementById('odp-fil-status')||{}).value||'';
  var fAr = (document.getElementById('odp-fil-area')||{}).value||'';
  var fOc = (document.getElementById('odp-fil-odc')||{}).value||'';
  q = q.toLowerCase().trim();

  _odpFil = _odpData.filter(function(o){
    var matchQ  = !q || (o.nama||'').toLowerCase().includes(q) || (o.kode||'').toLowerCase().includes(q) || (o.lokasi||'').toLowerCase().includes(q);
    var matchSt = !fSt || o.status===fSt;
    var matchAr = !fAr || o.area_id===fAr;
    var matchOc = !fOc || o.odc_id===fOc;
    return matchQ && matchSt && matchAr && matchOc;
  });

  /* T20: update kartu statistik mengikuti filter Area/ODC yang aktif */
  odpUpdateStats();

  var total = _odpFil.length;
  var pages = Math.max(1, Math.ceil(total/_odpPerPg));
  if(_odpPage>pages) _odpPage=pages;
  var start = (_odpPage-1)*_odpPerPg;
  var slice = _odpFil.slice(start, start+_odpPerPg);

  var list = document.getElementById('odp-list');
  if(!list) return;

  if(!total){
    list.innerHTML='<div class="olt-empty"><i class="ti ti-plug-x"></i><p>Tidak ada data ODP</p><small>Coba ubah filter atau tambah ODP baru</small></div>';
    document.getElementById('odp-pagi').style.display='none';
    return;
  }

  list.innerHTML = slice.map(function(o){ return odpRowHTML(o); }).join('');

  var pagi=document.getElementById('odp-pagi');
  var prev=document.getElementById('odp-prev');
  var next=document.getElementById('odp-next');
  var info=document.getElementById('odp-pagi-info');
  if(pages>1){
    pagi.style.display='flex';
    if(prev) prev.disabled=_odpPage<=1;
    if(next) next.disabled=_odpPage>=pages;
    if(info) info.textContent=_odpPage+' / '+pages;
  } else { pagi.style.display='none'; }
}

function odpRenderEmpty(msg){
  var list=document.getElementById('odp-list');
  if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>'+msg+'</p></div>';
}

/* ── Lookup helpers ── */
function _odpAreaName(id){ var a=_areaData.find(function(x){return x.id===id;}); return a?a.nama:'—'; }
function _odpOdcName(id){ var o=_odcData.find(function(x){return x.id===id;}); return o?o.nama:'—'; }

/* ── Row HTML ── */
function odpRowHTML(o){
  var stMap = {aktif:'tg',maintenance:'ty',full:'tr',planning:'tgr',nonaktif:'tgr'};
  var stLbl = {aktif:'Aktif',maintenance:'Maintenance',full:'Full',planning:'Planning',nonaktif:'Non-Aktif'};
  var stClass = stMap[o.status]||'tgr';
  var stLabel = stLbl[o.status]||o.status;

  var port  = o.jumlah_port||0;
  var used  = (typeof SOT!=='undefined') ? SOT.odpStats(o.id).used : 0;
  var pct   = port>0 ? Math.min(100,Math.round(used/port*100)) : 0;
  var barC  = pct>=90?'full':pct>=70?'warn':'ok';

  var portHtml = port>0 ?
    '<div class="olt-port-wrap">'+
    '<span class="olt-port-label">Port '+used+'/'+port+'</span>'+
    '<div class="olt-port-bar-bg"><div class="olt-port-bar '+barC+'" style="width:'+pct+'%"></div></div>'+
    '<span class="olt-port-pct">'+pct+'%</span>'+
    '</div>' : '';

  var typeLabel = {aerial:'Aerial',pedestal:'Pedestal',wall:'Wall Mount',closure:'Closure'}[o.type]||o.type||'—';
  var avSt = o.status==='full'?'down':o.status==='maintenance'?'maintenance':'aktif';

  return '<div class="olt-row" onclick="odpOpenDet(\''+o.id+'\')">'+
    '<button class="olt-row-detail-btn" onclick="event.stopPropagation();odpOpenDet(\''+o.id+'\')"><i class="ti ti-chevron-right"></i></button>'+
    '<div class="olt-row-top">'+
      '<div class="olt-row-av '+avSt+'" style="background:var(--pug);color:var(--pu)"><i class="ti ti-plug" style="font-size:15px"></i></div>'+
      '<div class="olt-row-info">'+
        '<div class="olt-row-name">'+_esc(o.nama||'—')+'</div>'+
        '<div class="olt-row-kode">'+_esc(o.kode||'—')+' · '+_esc(o.lokasi||'—')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="olt-row-meta">'+
      '<span class="tag '+stClass+'">'+stLabel+'</span>'+
      '<span style="background:var(--cyg);color:var(--cyan);padding:3px 8px;border-radius:20px;font-size:9px;font-weight:700">'+_esc(typeLabel)+'</span>'+
      '<span class="tag tgr">'+_esc(_odpAreaName(o.area_id))+'</span>'+
      '<span class="tag tc1">'+_esc(_odpOdcName(o.odc_id))+'</span>'+
    '</div>'+
    portHtml+
  '</div>';
}

/* ── Pagination ── */
function odpPage(dir){
  var pages=Math.max(1,Math.ceil(_odpFil.length/_odpPerPg));
  _odpPage=Math.min(pages,Math.max(1,_odpPage+dir));
  odpRender();
}

/* ── Open Form ── */
function odpOpenForm(data){
  var isEdit=!!data;
  document.getElementById('odp-form-title').textContent=isEdit?'Edit ODP':'Tambah ODP';
  document.getElementById('odpf-id').value        = isEdit?(data.id||''):'';
  document.getElementById('odpf-kode').value      = isEdit?(data.kode||''):'';
  document.getElementById('odpf-nama').value      = isEdit?(data.nama||''):'';
  document.getElementById('odpf-lokasi').value    = isEdit?(data.lokasi||''):'';
  document.getElementById('odpf-type').value      = isEdit?(data.type||'aerial'):'aerial';
  document.getElementById('odpf-port').value      = isEdit?(data.jumlah_port||8):8;
  document.getElementById('odpf-port-used').value = (typeof SOT!=='undefined') ? SOT.odpStats(isEdit&&data&&data.id?data.id:'').used : 0; /* realtime */
  document.getElementById('odpf-status').value    = isEdit?(data.status||'aktif'):'aktif';
  document.getElementById('odpf-lat').value       = isEdit?(data.lat||''):'';
  document.getElementById('odpf-lng').value       = isEdit?(data.lng||''):'';
  document.getElementById('odpf-ket').value       = isEdit?(data.keterangan||''):'';

  var sb=getSB();
  var p1 = _areaData.length>0 ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; });
  /* Selalu reload _odcData dengan jumlah_port dan port_used agar info port akurat */
  var p2 = sb.from('odcs').select('id,nama,kode,area_id,status,jumlah_port').order('kode')
    .then(function(r){ if(!r.error) _odcData=r.data||[]; });

  Promise.all([p1,p2]).then(function(){
    _odpFillAreaDropdown('odpf-area', isEdit?data.area_id:'');
    _odpFillOdcDropdown('odpf-odc', isEdit?data.odc_id:'', isEdit?data.area_id:'');
    _odpLoadOdcPortDropdown(isEdit?data.odc_id:'', isEdit?(data.odc_port_no||''):'', isEdit?(data.id||''):'');

    /* Wire: area change → filter ODC STRICT, reset port ODC */
    var selArea = document.getElementById('odpf-area');
    if(selArea){
      selArea.onchange = function(){
        _odpFillOdcDropdown('odpf-odc','',this.value);
        _odpLoadOdcPortDropdown('', '', isEdit?(data.id||''):'');
        document.getElementById('odpf-kode-group').style.display='none';
        document.getElementById('odpf-kode').value='';
        document.getElementById('odpf-nama').value='';
      };
    }

    /* Wire: ODC change → generate kode ODP dropdown + reload dropdown port ODC */
    var selOdc = document.getElementById('odpf-odc');
    if(selOdc){
      selOdc.onchange = function(){
        _odpGenKodeDropdown(this.value);
        _odpLoadOdcPortDropdown(this.value, '', isEdit?(data.id||''):'');
      };
    }

    /* Jika edit, tampilkan kode dropdown dengan kode yg sudah ada terpilih */
    if(isEdit && data.odc_id) _odpGenKodeDropdown(data.odc_id, data.kode);
  });

  ['odpf-area','odpf-odc','odpf-odc-port','odpf-kode-sel','odpf-lokasi'].forEach(function(id){ var e=document.getElementById(id); if(e) e.classList.remove('err'); });
  document.getElementById('odp-form-overlay').classList.add('on');
}
function odpCloseForm(){ document.getElementById('odp-form-overlay').classList.remove('on'); }

/* ── Generate kode ODP dropdown dari ODC ── */
function _odpGenKodeDropdown(odcId, currentKode){
  var kodeGrp = document.getElementById('odpf-kode-group');
  var kodeSel = document.getElementById('odpf-kode-sel');
  if(!odcId){ kodeGrp.style.display='none'; return; }

  var odc = _odcData.find(function(o){ return o.id===odcId; });
  if(!odc){ kodeGrp.style.display='none'; return; }

  /* Generate 4 kandidat kode dari kode ODC */
  var candidates = ['01','02','03','04'].map(function(n){ return odc.kode+'_'+n; });

  /* Kode yang sudah dipakai oleh ODP lain dalam ODC ini */
  var usedKodes = _odpData
    .filter(function(o){ return o.odc_id===odcId && o.id!==document.getElementById('odpf-id').value; })
    .map(function(o){ return o.kode; });

  kodeSel.innerHTML = '<option value="">— Pilih Kode ODP —</option>';
  candidates.forEach(function(k){
    var opt = document.createElement('option');
    opt.value = k;
    var taken = usedKodes.indexOf(k) >= 0;
    opt.textContent = taken ? k + ' (sudah dipakai)' : k;
    opt.disabled = taken;
    opt.style.color = taken ? '#ef4444' : '';
    if(k === currentKode) opt.selected = true;
    kodeSel.appendChild(opt);
  });

  kodeGrp.style.display = 'block';

  /* Wire: kode dipilih → set hidden field + nama */
  kodeSel.onchange = function(){
    document.getElementById('odpf-kode').value = this.value;
    document.getElementById('odpf-nama').value = this.value;
  };

  /* Restore hidden jika edit */
  if(currentKode){
    document.getElementById('odpf-kode').value = currentKode;
    document.getElementById('odpf-nama').value = currentKode;
  }
}

/* ── Save ── */
function odpSave(){
  var id      = document.getElementById('odpf-id').value;
  var kode    = document.getElementById('odpf-kode').value.trim().toUpperCase();
  var nama    = document.getElementById('odpf-nama').value.trim();
  var areaId  = document.getElementById('odpf-area').value;
  var odcId   = document.getElementById('odpf-odc').value;
  var odcPort = parseInt(document.getElementById('odpf-odc-port').value)||0;
  var lokasi  = document.getElementById('odpf-lokasi').value.trim();
  var type    = document.getElementById('odpf-type').value;
  var port    = parseInt(document.getElementById('odpf-port').value)||0;
  /* port_used TIDAK disimpan — dihitung realtime dari odp_ports (SSOT Phase 7) */
  var status  = document.getElementById('odpf-status').value;
  var lat     = parseFloat(document.getElementById('odpf-lat').value)||null;
  var lng     = parseFloat(document.getElementById('odpf-lng').value)||null;
  var ket     = document.getElementById('odpf-ket').value.trim();

  var ok=true;
  var chk=function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('odpf-kode-sel',kode); chk('odpf-lokasi',lokasi); chk('odpf-area',areaId); chk('odpf-odc',odcId); chk('odpf-odc-port',odcPort);
  if(!ok){ toast('Isi semua field wajib','err'); return; }

  var dup=_odpData.find(function(o){ return o.kode===kode && o.id!==id; });
  if(dup){ toast('Kode ODP sudah digunakan','err'); document.getElementById('odpf-kode').classList.add('err'); return; }

  /* Validasi 1:1 — 1 port ODC hanya untuk 1 ODP */
  var dupPort=_odpData.find(function(o){ return o.odc_id===odcId && parseInt(o.odc_port_no)===odcPort && o.id!==id; });
  if(dupPort){ toast('Port ODC '+odcPort+' sudah dipakai ODP "'+(dupPort.nama||dupPort.kode)+'"','err'); document.getElementById('odpf-odc-port').classList.add('err'); return; }

  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('odpf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var nama = kode; /* nama ODP = kode ODP */
  /* port_used dihapus dari payload — SSOT: nilai dihitung dari odp_ports */
  var payload={kode:kode,nama:nama,area_id:areaId,odc_id:odcId,odc_port_no:odcPort,lokasi:lokasi,type:type,jumlah_port:port,status:status,lat:lat,lng:lng,keterangan:ket};
  var p = id ? sb.from('odps').update(payload).eq('id',id) : sb.from('odps').insert([payload]);

  p.then(function(r){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    toast(id?'ODP diperbarui':'ODP ditambahkan','ok');

    /* Auto-generate port di odp_ports jika ODP baru atau jumlah_port berubah */
    var savedId = id || (r.data && r.data[0] && r.data[0].id);
    if(savedId && port > 0){
      var inserts = [];
      for(var i=1; i<=port; i++) inserts.push({odp_id:savedId, nomor_port:i, status:'kosong'});
      /* Insert yang belum ada saja — gunakan onConflict ignore */
      sb.from('odp_ports')
        .upsert(inserts, {onConflict:'odp_id,nomor_port', ignoreDuplicates:true})
        .then(function(){ SOT.invalidate && SOT.invalidate('network'); })
        .catch(function(){});
    }

    if(window.SOT) SOT.invalidate('general'); /* invalidate odp cache */
    odpCloseForm(); _odpLoaded=false; odpLoad();
  }).catch(function(e){
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; }
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

/* ── Detail ── */
function odpOpenDet(id){
  var o=_odpData.find(function(x){ return x.id===id; });
  if(!o) return;
  _odpDetId=id;
  document.getElementById('odp-det-title').textContent=o.nama||'Detail ODP';

  var stMap={aktif:'tg',maintenance:'ty',full:'tr',planning:'tgr',nonaktif:'tgr'};
  var stLbl={aktif:'Aktif',maintenance:'Maintenance',full:'Full',planning:'Planning',nonaktif:'Non-Aktif'};
  var stClass=stMap[o.status]||'tgr';
  var stLabel=stLbl[o.status]||o.status;
  var typeLabel={aerial:'Aerial (Udara)',pedestal:'Pedestal (Tanah)',wall:'Wall Mount',closure:'Closure'}[o.type]||o.type||'—';
  var port=o.jumlah_port||0; var _odp_ps=(typeof SOT!=="undefined")?SOT.odpStats(o.id):{used:0,free:0,pct:0,damaged:0}; var used=_odp_ps.used;
  var pct=port>0?Math.min(100,Math.round(used/port*100)):0;
  var barC=pct>=90?'full':pct>=70?'warn':'ok';
  var created=o.created_at?new Date(o.created_at):null;
  var createdStr=created?(function(d){var p=function(n){return n<10?'0'+n:n;};return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());})(created):'—';

  var dr = _drRow;
  var sec = _secRow;

  document.getElementById('odp-det-body').innerHTML =
    sec('info-circle','Informasi Dasar')+
    dr('Kode','<span style="font-family:\'JetBrains Mono\',monospace;color:var(--pu)">'+_esc(o.kode||'—')+'</span>')+
    dr('Nama ODP',_esc(o.nama||'—'))+
    dr('Area','<span class="tag tc1">'+_esc(_odpAreaName(o.area_id))+'</span>')+
    dr('ODC Induk','<span class="tag tc1" style="background:var(--c1b)">'+_esc(_odpOdcName(o.odc_id))+'</span>')+
    dr('Port ODC', o.odc_port_no ? '<span style="font-family:\'JetBrains Mono\',monospace;font-weight:700">Port '+_esc(String(o.odc_port_no))+'</span>' : '<span style="color:var(--text3)">—</span>')+
    dr('Lokasi',_esc(o.lokasi||'—'))+
    dr('Tipe',typeLabel)+
    dr('Status','<span class="tag '+stClass+'">'+stLabel+'</span>')+
    sec('circuit-switchboard','Port & Kapasitas')+
    dr('Total Port',_fmt(port)+' port')+
    dr('Terpakai',_fmt(used)+' port')+
    dr('Utilisasi', port>0 ?
      '<div style="display:flex;align-items:center;gap:8px;flex:1">'+
      '<div class="olt-port-bar-bg" style="flex:1"><div class="olt-port-bar '+barC+'" style="width:'+pct+'%"></div></div>'+
      '<span style="font-weight:800;font-family:\'JetBrains Mono\',monospace;font-size:12px">'+pct+'%</span>'+
      '</div>' : '<span style="color:var(--text3)">—</span>')+
    sec('map-pin','Koordinat & Catatan')+
    dr('Latitude', o.lat ? String(o.lat) : '—')+
    dr('Longitude', o.lng ? String(o.lng) : '—')+
    dr('Keterangan',_esc(o.keterangan||'—'))+
    dr('Dibuat',createdStr)+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="odpDelete(\''+o.id+'\')"><i class="ti ti-trash"></i> Hapus</button>'+
    '</div>';

  document.getElementById('odp-det-overlay').classList.add('on');
}
function odpCloseDet(){ document.getElementById('odp-det-overlay').classList.remove('on'); _odpDetId=null; }
function odpDetEdit(){
  var o=_odpData.find(function(x){ return x.id===_odpDetId; });
  if(!o) return;
  odpCloseDet(); odpOpenForm(o);
}

/* ── Delete ── */
function odpDelete(id){
  var o=_odpData.find(function(x){ return x.id===id; });
  if(!o) return;
  if(!confirm('Hapus ODP "'+o.nama+'"?\nData tidak bisa dikembalikan.')) return;
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  sb.from('odps').delete().eq('id',id)
    .then(function(r){
      if(r.error){ toast('Gagal hapus: '+(r.error.message||'coba lagi'),'err'); return; }
      toast('ODP "'+o.nama+'" dihapus','ok');
      if(window.SOT) SOT.invalidate('general'); /* invalidate odp cache */ /* OPT: invalidate cache */
      odpCloseDet(); _odpLoaded=false; odpLoad();
    })
    .catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });
}
var _portData   = [];
var _portFil    = [];
var _portPage   = 1;
var _portPerPg  = 15;
var _portDetId  = null;
var _portLoaded = false;
var _portOdpList = []; /* cache list ODP untuk dropdown */

/* ── Auto-load saat pane port dibuka ── */
/* OPT: dispatch hook */
_navDispatch.register('port', function(){ portLoad(); });

/* ── Load data ── */
function portLoad(){
  var list = document.getElementById('port-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat data…</p></div>';
  var sb = getSB();
  if(!sb){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Koneksi tidak aktif</p></div>'; return; }

  /* Load ODP list — cek cache dahulu */
  var _odpsC = null; /* SOT cache — always re-fetch if empty */
  if(_odpsC && _odpsC.length) _portOdpList = _odpsC;
  var p1 = _portOdpList.length > 0 ? Promise.resolve()
    : sb.from('odps').select('id,kode,nama,area_id,jumlah_port').order('kode')
        .then(function(r){ if(!r.error){ _portOdpList = r.data||[]; } });

  /* Load areas — cek cache */
  var _areasC = null; /* SOT cache — always re-fetch if empty */
  if(_areasC && _areasC.length) _areaData = _areasC;
  var p2 = _areaData.length > 0 ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama')
        .then(function(r){ if(!r.error){ _areaData = r.data||[]; } });

  Promise.all([p1, p2]).then(function(){
    _portFillFilters();
    return sb.from('odp_ports').select('*').order('created_at', {ascending:false});
  }).then(function(r){
    if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal: '+(r.error.message||'coba lagi')+'</p></div>'; return; }
    _portData = r.data || [];
    _portLoaded = true;
    _portUpdateStats();
    portRender();
  }).catch(function(e){
    if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error: '+(e.message||'coba lagi')+'</p></div>';
  });
}

/* ── Fill filter dropdowns ── */
function _portFillFilters(){
  /* ODP filter */
  var selOdp = document.getElementById('port-fil-odp');
  if(selOdp){
    var cur = selOdp.value;
    selOdp.innerHTML = '<option value="">Semua ODP</option>' +
      _portOdpList.map(function(o){ return '<option value="'+o.id+'">'+_esc(o.kode)+' · '+_esc(o.nama)+'</option>'; }).join('');
    selOdp.value = cur;
  }
  /* Area filter (based on ODP's area_id) */
  var selArea = document.getElementById('port-fil-area');
  if(selArea && _areaData.length){
    var cur2 = selArea.value;
    selArea.innerHTML = '<option value="">Semua Area</option>' +
      _areaData.map(function(a){ return '<option value="'+a.id+'">'+_esc(a.nama)+'</option>'; }).join('');
    selArea.value = cur2;
  }
}

function _portUpdateStats(){
  var fOdp  = (document.getElementById('port-fil-odp')||{}).value||'';
  var fArea = (document.getElementById('port-fil-area')||{}).value||'';
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };

  if(window.SOT && !fOdp){

    var ps = SOT.portStats(fArea||null);
    e('portst-total',  ps.total);
    e('portst-free',   ps.free);
    e('portst-used',   ps.used);
    e('portst-broken', ps.damaged);
    return;
  }


  var odpSrc = _portOdpList.filter(function(o){
    var matchOdp  = !fOdp  || o.id===fOdp;
    var matchArea = !fArea || o.area_id===fArea;
    return matchOdp && matchArea;
  });
  var total = odpSrc.reduce(function(s,o){ return s+(parseInt(o.jumlah_port)||0); }, 0);
  var src = _portData.filter(function(p){
    return (!fOdp||p.odp_id===fOdp) && (!fArea||_portAreaId(p.odp_id)===fArea);
  });
  var used    = src.filter(function(p){ return p.status==='terpakai'; }).length;
  var broken  = src.filter(function(p){ return p.status==='rusak'; }).length;
  e('portst-total',  total);
  e('portst-free',   Math.max(0, total-used-broken));
  e('portst-used',   used);
  e('portst-broken', broken);
}

function _portOdpName(odp_id){
  var o = _portOdpList.find(function(x){ return x.id===odp_id; });
  return o ? (o.kode+' · '+o.nama) : '—';
}
function _portOdpKode(odp_id){
  var o = _portOdpList.find(function(x){ return x.id===odp_id; });
  return o ? o.kode : '—';
}
function _portAreaId(odp_id){
  var o = _portOdpList.find(function(x){ return x.id===odp_id; });
  return o ? o.area_id : null;
}
function _portAreaName(odp_id){
  var aId = _portAreaId(odp_id);
  var a = _areaData.find(function(x){ return x.id===aId; });
  return a ? a.nama : '—';
}

function _portSignalClass(dbm){
  if(dbm===null||dbm===undefined||dbm==='') return '';
  var v = parseFloat(dbm);
  if(isNaN(v)) return '';
  if(v >= -25) return 'ok';
  if(v >= -30) return 'warn';
  return 'bad';
}

function portSearch(q){
  _portPage = 1;
  var clr = document.getElementById('port-search-clr');
  if(clr) clr.style.display = q ? 'block' : 'none';
  portRender();
}
function portClearSearch(){
  var inp = document.getElementById('port-search');
  if(inp) inp.value = '';
  var clr = document.getElementById('port-search-clr');
  if(clr) clr.style.display = 'none';
  _portPage = 1;
  portRender();
}

function portRender(){
  var q       = (document.getElementById('port-search')||{}).value||'';
  var fSt     = (document.getElementById('port-fil-status')||{}).value||'';
  var fOdp    = (document.getElementById('port-fil-odp')||{}).value||'';
  var fArea   = (document.getElementById('port-fil-area')||{}).value||'';
  q = q.toLowerCase().trim();


  var _portAreaMap = {};
  _portOdpList.forEach(function(o){ _portAreaMap[o.id] = o.area_id; });

  _portFil = _portData.filter(function(p){
    var areaId = _portAreaMap[p.odp_id] || null;
    var matchQ   = !q ||
      String(p.nomor_port||'').includes(q) ||
      (p.cid_pelanggan||'').toLowerCase().includes(q) ||
      (_portOdpKode(p.odp_id)||'').toLowerCase().includes(q) ||
      (_portOdpName(p.odp_id)||'').toLowerCase().includes(q) ||
      (p.paket||'').toLowerCase().includes(q);
    var matchSt  = !fSt   || p.status===fSt;
    var matchOdp = !fOdp  || p.odp_id===fOdp;
    var matchArea= !fArea || areaId===fArea;
    return matchQ && matchSt && matchOdp && matchArea;
  });


  _portUpdateStats();

  var total = _portFil.length;
  var pages = Math.max(1, Math.ceil(total / _portPerPg));
  if(_portPage > pages) _portPage = pages;
  var start = (_portPage - 1) * _portPerPg;
  var slice = _portFil.slice(start, start + _portPerPg);

  var list = document.getElementById('port-list');
  if(!list) return;

  if(!total){
    list.innerHTML = '<div class="olt-empty"><i class="ti ti-plug-x"></i><p>Tidak ada port ditemukan</p><small>Coba ubah filter atau tambah port baru</small></div>';
    document.getElementById('port-pagi').style.display='none';
    return;
  }

  list.innerHTML = slice.map(function(p){ return _portRowHTML(p); }).join('');

  var pagi = document.getElementById('port-pagi');
  if(pages > 1){
    pagi.style.display='flex';
    var prev = document.getElementById('port-prev');
    var next = document.getElementById('port-next');
    var info = document.getElementById('port-pagi-info');
    if(prev) prev.disabled = _portPage<=1;
    if(next) next.disabled = _portPage>=pages;
    if(info) info.textContent = _portPage+' / '+pages;
  } else {
    pagi.style.display='none';
  }
}

function _portRowHTML(p){
  var stMap={kosong:'kosong',terpakai:'terpakai',reserved:'reserved',rusak:'rusak'};
  var stLbl={kosong:'Kosong',terpakai:'Terpakai',reserved:'Reserved',rusak:'Rusak'};
  var stTag={kosong:'tg',terpakai:'tc1',reserved:'ty',rusak:'tr'};
  var avCls = stMap[p.status]||'kosong';
  var stClass = stTag[p.status]||'tgr';
  var stLabel = stLbl[p.status]||p.status;
  var sigClass = _portSignalClass(p.sinyal_dbm);
  var sigHtml = p.sinyal_dbm != null ? '<div class="port-signal '+sigClass+'"><i class="ti ti-signal" style="font-size:9px"></i> '+p.sinyal_dbm+' dBm</div>' : '';

  return '<div class="port-row" onclick="portOpenDet(\''+p.id+'\')">' +
    '<button class="port-row-detail-btn" onclick="event.stopPropagation();portOpenDet(\''+p.id+'\')"><i class="ti ti-chevron-right"></i></button>' +
    '<div class="port-row-top">' +
      '<div class="port-row-av '+avCls+'"><i class="ti ti-plug-connected" style="font-size:16px"></i><span>P'+_esc(String(p.nomor_port||'?'))+'</span></div>' +
      '<div class="port-row-info">' +
        '<div class="port-row-name">'+_esc(_portOdpKode(p.odp_id))+' · Port '+_esc(String(p.nomor_port||'?'))+'</div>' +
        '<div class="port-row-sub">'+_esc(_portAreaName(p.odp_id))+(p.cid_pelanggan?' · CID: '+_esc(p.cid_pelanggan):'')+'</div>' +
      '</div>' +
    '</div>' +
    '<div class="port-row-meta">' +
      '<span class="tag '+stClass+'">'+stLabel+'</span>' +
      (p.paket ? '<span class="tag tgr"><i class="ti ti-wifi" style="font-size:9px"></i> '+_esc(p.paket)+'</span>' : '') +
      (p.tgl_pasang ? '<span class="tag tgr"><i class="ti ti-calendar" style="font-size:9px"></i> '+_esc(p.tgl_pasang)+'</span>' : '') +
    '</div>' +
    sigHtml +
  '</div>';
}

function portPage(dir){
  var pages = Math.max(1, Math.ceil(_portFil.length / _portPerPg));
  _portPage = Math.min(pages, Math.max(1, _portPage + dir));
  portRender();
}

function portOpenForm(data){
  var isEdit = !!data;
  document.getElementById('port-form-title').textContent = isEdit ? 'Edit Port' : 'Tambah Port';
  document.getElementById('portf-id').value         = isEdit ? (data.id||'') : '';
  document.getElementById('portf-odp').value        = isEdit ? (data.odp_id||'') : '';
  document.getElementById('portf-nomor').value      = isEdit ? (data.nomor_port||'') : '';
  document.getElementById('portf-status').value     = isEdit ? (data.status||'kosong') : 'kosong';
  document.getElementById('portf-cid').value        = isEdit ? (data.cid_pelanggan||'') : '';
  document.getElementById('portf-paket').value      = isEdit ? (data.paket||'') : '';
  document.getElementById('portf-tgl-pasang').value = isEdit ? (data.tgl_pasang||'') : '';
  document.getElementById('portf-sinyal').value     = isEdit ? (data.sinyal_dbm||'') : '';
  document.getElementById('portf-ket').value        = isEdit ? (data.keterangan||'') : '';
  document.getElementById('portf-tgl-input').value  = '';


  document.getElementById('portf-pel-info').style.display  = 'none';
  document.getElementById('portf-pindah-group').style.display = 'none';
  _portSetUserReadOnly(false);


  document.getElementById('portf-status').onchange = function(){
    _portTogglePindahGroup(this.value);
  };


  ['portf-olt','portf-odc','portf-odp-sel'].forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.innerHTML = '<option value="">— Pilih dulu —</option>';
  });
  var nomorSel = document.getElementById('portf-nomor-sel');
  if(nomorSel) nomorSel.innerHTML = '<option value="">— Pilih ODP dulu —</option>';

  var sb = getSB();

  var pa = _areaData.length>0 ? Promise.resolve()
    : sb.from('areas').select('id,nama,kode').order('nama').then(function(r){ if(!r.error) _areaData=r.data||[]; });
  var po = _oltData.length>0 ? Promise.resolve()
    : sb.from('olts').select('id,nama,kode,area_id').order('kode').then(function(r){ if(!r.error) _oltData=r.data||[]; });

  var pc = sb.from('odcs').select('id,nama,kode,area_id,olt_id').order('kode').then(function(r){ if(!r.error) _odcData=r.data||[]; });
  var pp = sb.from('odps').select('id,kode,nama,area_id,odc_id,jumlah_port').order('kode').then(function(r){ if(!r.error) _portOdpList=r.data||[]; });

  Promise.all([pa,po,pc,pp]).then(function(){

    var selArea = document.getElementById('portf-area');
    selArea.innerHTML = '<option value="">— Pilih Area —</option>';
    _areaData.forEach(function(a){
      var opt=document.createElement('option');
      opt.value=a.id; opt.textContent=a.nama+' ('+a.kode+')';
      selArea.appendChild(opt);
    });


    selArea.onchange = function(){
      _portFillOlt(this.value);
      _portFillOdc('','');
      _portFillOdp('','');
      _portFillNomor('');
    };


    document.getElementById('portf-olt').onchange = function(){
      var aId = document.getElementById('portf-area').value;
      _portFillOdc(aId, this.value);
      _portFillOdp('','');
      _portFillNomor('');
    };


    document.getElementById('portf-odc').onchange = function(){
      var aId = document.getElementById('portf-area').value;
      _portFillOdp(aId, this.value);
      _portFillNomor('');
    };


    document.getElementById('portf-odp-sel').onchange = function(){
      document.getElementById('portf-odp').value = this.value;
      _portFillNomor(this.value);
    };


    document.getElementById('portf-nomor-sel').onchange = function(){
      document.getElementById('portf-nomor').value = this.value;
      _portOnNomorChange(this.value, document.getElementById('portf-odp').value);
    };


    if(isEdit && data.odp_id){
      var odp = _portOdpList.find(function(o){ return o.id===data.odp_id; });
      var aId = odp ? odp.area_id : '';
      var odc = odp ? (_odcData.find(function(c){ return c.id===odp.odc_id; })||null) : null;
      var cId = odc ? odc.id : '';
      var oltId = odc ? odc.olt_id : '';


      if(aId) selArea.value = aId;
      _portFillOlt(aId, oltId);
      _portFillOdc(aId, oltId, cId);
      _portFillOdp(aId, cId, data.odp_id);
      _portFillNomor(data.odp_id, data.nomor_port);
    }


    if(isEdit) _portTogglePindahGroup(data.status||'kosong');
  });

  ['portf-area','portf-odp-sel','portf-nomor-sel'].forEach(function(id){ var e=document.getElementById(id); if(e) e.classList.remove('err'); });
  document.getElementById('port-form-overlay').classList.add('on');
}
function portCloseForm(){ document.getElementById('port-form-overlay').classList.remove('on'); }

function _portTogglePindahGroup(status){
  var grp = document.getElementById('portf-pindah-group');
  if(!grp) return;
  if(status === 'pindahkan'){
    grp.style.display = 'block';

    var odpId  = document.getElementById('portf-odp').value;
    var thisNomor = parseInt(document.getElementById('portf-nomor').value)||0;
    var sel = document.getElementById('portf-pindah-target');
    if(sel && odpId){
      var odp = _portOdpList.find(function(o){ return o.id===odpId; });
      var jml = (odp && odp.jumlah_port) ? parseInt(odp.jumlah_port) : 8;
      var usedNomor = _portData
        .filter(function(p){ return p.odp_id===odpId && p.status!=='kosong'; })
        .map(function(p){ return p.nomor_port; });
      sel.innerHTML = '<option value="">— Pilih Port Tujuan —</option>';
      for(var i=1;i<=jml;i++){
        if(i===thisNomor) continue;
        var isFree = usedNomor.indexOf(i)<0;
        if(!isFree) continue;
        var opt=document.createElement('option');
        opt.value=i; opt.textContent='Port '+i+' — 🟢 Kosong';
        sel.appendChild(opt);
      }
    }
  } else {
    grp.style.display = 'none';
  }
}

function _portOnNomorChange(nomor, odpId){
  var infoBox  = document.getElementById('portf-pel-info');
  var statusSel= document.getElementById('portf-status');
  if(!infoBox || !statusSel) return;

  if(!nomor || !odpId){
    infoBox.style.display = 'none';
    _portSetStatusOptions('kosong_mode');
    return;
  }


  var portRec = _portData.find(function(p){
    return p.odp_id===odpId && String(p.nomor_port)===String(nomor);
  });

  var isTerpakai = portRec && (portRec.status==='terpakai' || portRec.cid_pelanggan);

  if(isTerpakai){

    var cid = portRec.cid_pelanggan;
    var pel = cid ? _getPelData().find(function(p){ return p.cid===cid; }) : null;
    var tglPasang = portRec.tgl_pasang || (pel&&pel.tgl_pasang) || null;
    var durasi='—';
    if(tglPasang){
      var ms=Date.now()-new Date(tglPasang).getTime();
      var bln=Math.floor(ms/(1000*60*60*24*30));
      durasi=bln<1?'< 1 bulan':bln+' bulan';
    }
    var rows=[
      ['CID', cid||'—'],
      ['Nama', (pel&&pel.nama)||portRec.cid_pelanggan||'—'],
      ['Paket', portRec.paket||(pel&&pel.paket)||'—'],
      ['Tgl Pasang', tglPasang ? tglPasang.slice(0,10) : '—'],
      ['Teknisi', portRec.teknisi_pasang||'—'],
      ['Sales', portRec.sales_input||'—'],
      ['Lama', durasi],
      ['Sinyal', portRec.sinyal_dbm!=null ? portRec.sinyal_dbm+' dBm' : '—']
    ];
    var body=document.getElementById('portf-pel-info-body');
    if(body) body.innerHTML = rows.map(function(r){
      return '<div><span style="font-weight:700;color:var(--text)">'+r[0]+'</span><br>'+
             '<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px">'+r[1]+'</span></div>';
    }).join('');
    infoBox.style.display='block';


    document.getElementById('portf-cid').value        = cid||'';
    document.getElementById('portf-paket').value      = portRec.paket||'';
    document.getElementById('portf-tgl-pasang').value = tglPasang ? tglPasang.slice(0,10) : '';
    document.getElementById('portf-sinyal').value     = portRec.sinyal_dbm!=null ? portRec.sinyal_dbm : '';
    document.getElementById('portf-ket').value        = portRec.keterangan||'';


    _portSetUserReadOnly(true, portRec.teknisi_pasang||'—', portRec.sales_input||'—', portRec.tgl_input||'');


    _portSetStatusOptions('terpakai_mode');
    statusSel.value = 'pindahkan';
    _portTogglePindahGroup('pindahkan');
  } else {
    infoBox.style.display='none';
    _portSetStatusOptions('kosong_mode');
    statusSel.value = portRec ? (portRec.status||'kosong') : 'kosong';
    _portTogglePindahGroup(statusSel.value);

    _portSetUserReadOnly(false);
  }
}

function _portSetUserReadOnly(readOnly, teknisiVal, salesVal, tglInputVal){
  var grp    = document.getElementById('portf-user-ro-group');
  var roTekV = document.getElementById('portf-teknisi-ro-val');
  var roSalV = document.getElementById('portf-sales-ro-val');
  var tglIn  = document.getElementById('portf-tgl-input');
  var tglRo  = document.getElementById('portf-tgl-input-ro');
  var tglRoV = document.getElementById('portf-tgl-input-ro-val');
  if(!grp) return;
  if(readOnly){
    grp.style.display = 'grid';
    if(roTekV) roTekV.textContent = teknisiVal||'—';
    if(roSalV) roSalV.textContent = salesVal||'—';
    if(tglIn)  tglIn.style.display = 'none';
    if(tglRo)  tglRo.style.display = 'flex';
    if(tglRoV) tglRoV.textContent  = tglInputVal ? tglInputVal.slice(0,10) : '—';
  } else {
    grp.style.display = 'none';
    if(tglIn)  tglIn.style.display = 'none';
    if(tglRo)  tglRo.style.display = 'none';
  }
}

function _portSetStatusOptions(mode){
  var sel = document.getElementById('portf-status');
  if(!sel) return;
  sel.innerHTML = '';
  if(mode==='terpakai_mode'){
    [['pindahkan','🔄 Pindahkan'],['rusak','⚠️ Rusak']].forEach(function(o){
      var opt=document.createElement('option'); opt.value=o[0]; opt.textContent=o[1]; sel.appendChild(opt);
    });
  } else {
    [['kosong','Kosong'],['terpakai','Terpakai'],['reserved','Reserved'],['rusak','Rusak']].forEach(function(o){
      var opt=document.createElement('option'); opt.value=o[0]; opt.textContent=o[1]; sel.appendChild(opt);
    });
  }
}

function _portFillOlt(areaId, currentVal){
  var sel = document.getElementById('portf-olt');
  sel.innerHTML = '<option value="">— Semua OLT —</option>';
  var list = areaId ? _oltData.filter(function(o){ return o.area_id===areaId; }) : _oltData;
  list.forEach(function(o){
    var opt=document.createElement('option');
    opt.value=o.id; opt.textContent=o.kode+' · '+o.nama;
    sel.appendChild(opt);
  });
  if(currentVal) sel.value = currentVal;
}

function _portFillOdc(areaId, oltId, currentVal){
  var sel = document.getElementById('portf-odc');
  sel.innerHTML = '<option value="">— Semua ODC —</option>';
  var list = _odcData;
  if(areaId) list = list.filter(function(o){ return o.area_id===areaId; });
  if(oltId)  list = list.filter(function(o){ return o.olt_id===oltId; });
  list.forEach(function(o){
    var opt=document.createElement('option');
    opt.value=o.id; opt.textContent=o.kode;
    sel.appendChild(opt);
  });
  if(currentVal) sel.value = currentVal;
}

function _portFillOdp(areaId, odcId, currentVal){
  var sel = document.getElementById('portf-odp-sel');
  sel.innerHTML = '<option value="">— Pilih ODP —</option>';
  var list = _portOdpList;
  if(areaId) list = list.filter(function(o){ return o.area_id===areaId; });
  if(odcId)  list = list.filter(function(o){ return o.odc_id===odcId; });


  var sotPorts = (window.SOT && SOT.cache().ports && SOT.cache().ports.length)
    ? SOT.cache().ports : _portData || [];

  list.forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o.id;


    var portsOdp = sotPorts.filter(function(p){ return p.odp_id===o.id; });
    var terpakai = portsOdp.filter(function(p){ return p.status==='terpakai'||p.cid_pelanggan; }).length;
    var kap      = parseInt(o.jumlah_port)||0;
    var sisa     = kap - terpakai;
    var penuh    = kap > 0 && sisa <= 0;

    opt.textContent = o.kode + (penuh ? ' — PENUH' : ' (' + sisa + ' kosong)');
    if(penuh && String(o.id) !== String(currentVal)){
      opt.disabled = true;
      opt.style.color = '#9ca3af';
    }
    sel.appendChild(opt);
  });

  if(currentVal) sel.value = currentVal;
  var resolved = sel.value;
  document.getElementById('portf-odp').value = resolved;
  if(resolved) _portFillNomor(resolved);
}

function _portFillNomor(odpId, currentNomor){
  var sel = document.getElementById('portf-nomor-sel');
  if(!odpId){ sel.innerHTML='<option value="">— Pilih ODP dulu —</option>'; document.getElementById('portf-nomor').value=''; return; }
  var odp = _portOdpList.find(function(o){ return o.id===odpId; });
  var jml = (odp && odp.jumlah_port) ? parseInt(odp.jumlah_port) : 8;

  var portRecords = _portData.filter(function(p){ return p.odp_id===odpId; });
  sel.innerHTML = '<option value="">— Pilih Port —</option>';
  for(var i=1; i<=jml; i++){
    var opt=document.createElement('option');
    opt.value=i;
    var rec = portRecords.find(function(p){ return String(p.nomor_port)===String(i); });
    var taken = rec && (rec.status==='terpakai' || rec.cid_pelanggan);
    if(taken){
      opt.textContent = 'Port '+i+' 🔴 — '+(rec.cid_pelanggan||'Terpakai');
      opt.style.color = '#ef4444';
    } else if(rec && rec.status==='rusak'){
      opt.textContent = 'Port '+i+' ⚠️ — Rusak';
      opt.style.color = '#f59e0b';
    } else if(rec && rec.status==='reserved'){
      opt.textContent = 'Port '+i+' 🟡 — Reserved';
      opt.style.color = '#d97706';
    } else {
      opt.textContent = 'Port '+i+' 🟢 — Kosong';
    }
    if(currentNomor && String(i)===String(currentNomor)) opt.selected=true;
    sel.appendChild(opt);
  }
  if(currentNomor){
    document.getElementById('portf-nomor').value=currentNomor;

    _portOnNomorChange(currentNomor, odpId);
  }
}

function portSave(){
  var id       = document.getElementById('portf-id').value;
  var odpId    = document.getElementById('portf-odp').value;
  var nomor    = parseInt(document.getElementById('portf-nomor').value)||0;
  var status   = document.getElementById('portf-status').value;
  var cid      = document.getElementById('portf-cid').value.trim();
  var paket    = document.getElementById('portf-paket').value.trim();
  var tglPasang= document.getElementById('portf-tgl-pasang').value;
  var sinyal   = document.getElementById('portf-sinyal').value;
  var ket      = document.getElementById('portf-ket').value.trim();

  var ok=true;
  var chk=function(fid,v){ var e=document.getElementById(fid); if(!v){e.classList.add('err');ok=false;}else e.classList.remove('err'); };
  chk('portf-odp-sel', odpId);
  chk('portf-nomor-sel', nomor);


  if(status==='pindahkan'){
    var pindahTarget = document.getElementById('portf-pindah-target').value;
    if(!pindahTarget){ document.getElementById('portf-pindah-target').classList.add('err'); ok=false; }
    else document.getElementById('portf-pindah-target').classList.remove('err');
  }

  if(!ok){ toast('Isi semua field wajib','err'); return; }


  if(status!=='pindahkan'){
    var dup = _portData.find(function(p){ return p.odp_id===odpId && p.nomor_port===nomor && p.id!==id; });
    if(dup){ toast('Port '+nomor+' pada ODP ini sudah ada','err'); document.getElementById('portf-nomor').classList.add('err'); return; }
  }

  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var btn=document.getElementById('portf-save-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="spin"></span>'; }

  var resetBtn=function(){ if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-device-floppy"></i> Simpan'; } };


  if(status==='pindahkan'){
    var pindahTarget = parseInt(document.getElementById('portf-pindah-target').value)||0;
    var portLama = _portData.find(function(p){ return p.odp_id===odpId && p.nomor_port===nomor; });
    var portBaru = _portData.find(function(p){ return p.odp_id===odpId && p.nomor_port===pindahTarget; });

    var pKosongkan = portLama
      ? sb.from('odp_ports').update({status:'kosong',cid_pelanggan:null,paket:null,tgl_pasang:null,sinyal_dbm:null,teknisi_pasang:null,sales_input:null,tgl_input:null,keterangan:'Dipindahkan ke Port '+pindahTarget}).eq('id',portLama.id)
      : Promise.resolve({error:null});

    var payloadBaru = {
      odp_id:odpId, nomor_port:pindahTarget, status:'terpakai',
      cid_pelanggan:cid||null, paket:paket||null, tgl_pasang:tglPasang||null,
      sinyal_dbm:sinyal!=='' ? parseFloat(sinyal) : null,
      teknisi_pasang: portLama ? (portLama.teknisi_pasang||null) : null,
      sales_input:    portLama ? (portLama.sales_input||null)    : null,
      tgl_input:      portLama ? (portLama.tgl_input||null)      : null,
      keterangan:ket||('Dipindahkan dari Port '+nomor)
    };

    var pPindah = portBaru
      ? sb.from('odp_ports').update(payloadBaru).eq('id',portBaru.id)
      : sb.from('odp_ports').insert([payloadBaru]);

    Promise.all([pKosongkan, pPindah]).then(function(rs){
      resetBtn();
      if(rs[0].error||rs[1].error){
        toast('Gagal memindahkan port: '+((rs[0].error||rs[1].error).message||'coba lagi'),'err'); return;
      }
      toast('Port berhasil dipindahkan ke Port '+pindahTarget,'ok');
      if(window.SOT) SOT.invalidate('general');
      portCloseForm(); _portLoaded=false; portLoad();
    }).catch(function(e){ resetBtn(); toast('Error: '+(e.message||'coba lagi'),'err'); });
    return;
  }

  var payload = {
    odp_id: odpId,
    nomor_port: nomor,
    status: status,
    cid_pelanggan: cid||null,
    paket: paket||null,
    tgl_pasang: tglPasang||null,
    sinyal_dbm: sinyal!=='' ? parseFloat(sinyal) : null,
    keterangan: ket||null
  };

  var p = id ? sb.from('odp_ports').update(payload).eq('id',id)
              : sb.from('odp_ports').insert([payload]);

  p.then(function(r){
    resetBtn();
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    toast(id?'Port diperbarui':'Port ditambahkan','ok');
    if(window.SOT) SOT.invalidate('general');
    portCloseForm(); _portLoaded=false; portLoad();
  }).catch(function(e){
    resetBtn();
    toast('Error: '+(e.message||'coba lagi'),'err');
  });
}

function portOpenDet(id){
  var p = _portData.find(function(x){ return x.id===id; });
  if(!p) return;
  _portDetId = id;
  document.getElementById('port-det-title').textContent = _portOdpKode(p.odp_id)+' · Port '+p.nomor_port;

  var stLbl={kosong:'Kosong',terpakai:'Terpakai',reserved:'Reserved',rusak:'Rusak'};
  var stTag={kosong:'tg',terpakai:'tc1',reserved:'ty',rusak:'tr'};
  var stClass = stTag[p.status]||'tgr';
  var stLabel = stLbl[p.status]||p.status;
  var sigClass = _portSignalClass(p.sinyal_dbm);
  var created = p.created_at ? new Date(p.created_at) : null;
  var createdStr = created ? (function(d){var pad=function(n){return n<10?'0'+n:n;};return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes());})(created) : '—';

  var dr = _drRow;
  var sec = _secRow;

  document.getElementById('port-det-body').innerHTML =
    sec('info-circle','Informasi Port')+
    dr('ODP Induk','<span style="font-family:\'JetBrains Mono\',monospace;color:var(--cyan)">'+_esc(_portOdpKode(p.odp_id))+'</span>')+
    dr('Nama ODP',_esc(_portOdpName(p.odp_id)))+
    dr('Area',_esc(_portAreaName(p.odp_id)))+
    dr('Nomor Port','<span style="font-family:\'JetBrains Mono\',monospace;font-size:16px;font-weight:800;color:var(--c1)">Port '+_esc(String(p.nomor_port||'?'))+'</span>')+
    dr('Status','<span class="tag '+stClass+'">'+stLabel+'</span>')+
    sec('user','Data Pelanggan')+
    dr('CID Pelanggan', p.cid_pelanggan ? '<span style="font-family:\'JetBrains Mono\',monospace;color:var(--pu)">'+_esc(p.cid_pelanggan)+'</span>' : '<span style="color:var(--text3)">— Belum ada —</span>')+
    dr('Paket Layanan', p.paket ? _esc(p.paket) : '—')+
    dr('Tgl Pasang', p.tgl_pasang||'—')+
    sec('signal','Monitoring Sinyal')+
    dr('Daya Sinyal', p.sinyal_dbm != null ?
      '<span class="port-signal '+sigClass+'" style="font-size:13px;font-family:\'JetBrains Mono\',monospace">'+p.sinyal_dbm+' dBm</span>' :
      '<span style="color:var(--text3)">Belum diukur</span>')+
    dr('Keterangan',_esc(p.keterangan||'—'))+
    dr('Dibuat',createdStr)+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
      '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="portDelete(\''+p.id+'\')"><i class="ti ti-trash"></i> Hapus</button>'+
    '</div>';

  document.getElementById('port-det-overlay').classList.add('on');
}
function portCloseDet(){ document.getElementById('port-det-overlay').classList.remove('on'); _portDetId=null; }
function portDetEdit(){
  var p = _portData.find(function(x){ return x.id===_portDetId; });
  if(!p) return;
  portCloseDet(); portOpenForm(p);
}

function portDelete(id){
  var p = _portData.find(function(x){ return x.id===id; });
  if(!p) return;
  if(!confirm('Hapus Port '+p.nomor_port+' pada ODP "'+_portOdpKode(p.odp_id)+'"?\nData tidak bisa dikembalikan.')) return;
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  sb.from('odp_ports').delete().eq('id',id)
    .then(function(r){
      if(r.error){ toast('Gagal hapus: '+(r.error.message||'coba lagi'),'err'); return; }
      toast('Port dihapus','ok');
      portCloseDet(); _portLoaded=false; portLoad();
    })
    .catch(function(e){ toast('Error: '+(e.message||'coba lagi'),'err'); });
}
var _finTabCur = 'otf';

_navDispatch.register('finance', function(){ finInit(); });

function finInit(){

  var _valid = ['otf','recurring','invoice','validasi','apv-bayar','pembayaran','laporan'];
  if(!_finTabCur || _valid.indexOf(_finTabCur)<0) _finTabCur = 'otf';
  document.querySelectorAll('#p-finance .mat-subpane').forEach(function(p){ p.classList.remove('on'); });
  var dp = document.getElementById('fin-pane-'+_finTabCur);
  if(dp) dp.classList.add('on');
  var titleEl = document.getElementById('fin-pane-title');
  if(titleEl && _finSubTitles[_finTabCur]) titleEl.textContent = _finSubTitles[_finTabCur][0];
  var sideBtn = document.getElementById('sbt-fin-'+_finTabCur);
  if(sideBtn){ document.querySelectorAll('.sb-sub').forEach(function(b){b.classList.remove('on');}); sideBtn.classList.add('on'); }
  finSwitchTab(_finTabCur);
}

function finSwitchTab(tab, btn){
  _finTabCur = tab;
  document.querySelectorAll('#p-finance .mat-subpane').forEach(function(p){ p.classList.remove('on'); });
  var pane = document.getElementById('fin-pane-'+tab);
  if(pane) pane.classList.add('on');

  var t = _finSubTitles && _finSubTitles[tab] ? _finSubTitles[tab] : ['Finance & Fee',''];
  var titleEl = document.getElementById('fin-pane-title');
  if(titleEl) titleEl.textContent = t[0];

  document.querySelectorAll('.sb-sub').forEach(function(b){ b.classList.remove('on'); });
  var sideBtn = document.getElementById('sbt-fin-'+tab);
  if(sideBtn) sideBtn.classList.add('on');
  if(tab==='otf' && !_otfLoaded) otfLoad();
  if(tab==='recurring'){
    if(!_recLoaded){
      recLoad();
    } else {
      var sbSync=getSB();
      if(sbSync && !_recSinkronRunning) _recAutoSinkron(sbSync);
    }
  }
  if(tab==='invoice' && !_invLoaded) invLoad();
  if(tab==='validasi') valLoad();
  if(tab==='apv-bayar') apvbLoad();
  if(tab==='pembayaran') payLoad();
  if(tab==='laporan') lapLoad();
}

function finUpdateDashboard(){
  var e = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  _fdbCheckRecurringReminder();
  var otfDraft   = _otfData.filter(function(o){ return o.status==='draft'||o.status==='waiting_payment'; }).length;
  var recPending = _recData.filter(function(r){ return !r.periode; }).length;
  var invUnpaid  = _invData.filter(function(i){ return i.status==='waiting_payment'||i.status==='sent'; }).length;
  var invPaid    = _invData.filter(function(i){ return i.status==='paid'; }).length;
  var now = new Date(); var mm = ('0'+(now.getMonth()+1)).slice(-2); var yy = now.getFullYear();
  var bulanIni = yy+'-'+mm;
  var bayarBulan = _payData.filter(function(p){ return (p.tgl_bayar||'').slice(0,7)===bulanIni; }).reduce(function(a,p){ return a+(p.nominal||0); },0);
  var totalOTF  = _otfData.filter(function(o){ return o.status==='siap_bayar'||o.status==='paid'||o.status==='waiting_payment'; }).reduce(function(a,o){ return a+(o.nominal||0); },0);
  var totalRec  = _recData.filter(function(r){return r.status!=='stopped';}).reduce(function(a,r){ return a+(r.nominal!=null?r.nominal:r.total_recurring||0); },0);
  var closingBulan = _closingData.filter(function(c){ return c.status==='closed'; }).length;
  e('fd-waiting-otf', otfDraft);
  e('fd-waiting-rec', _recData.filter(function(r){return r.status==='menunggu_validasi';}).length);
  e('fd-inv-unpaid', invUnpaid);
  e('fd-inv-paid', invPaid);
  e('fd-bayar-bulan', 'Rp '+_fmt(bayarBulan));
  e('fd-total-otf', 'Rp '+_fmt(totalOTF));
  e('fd-total-rec', 'Rp '+_fmt(totalRec));
  e('fd-closing-st', closingBulan+' Closed');
}
var _otfData = []; var _otfFil = []; var _otfPage = 1; var _otfPerPg = 15;
var _otfDetId = null; var _otfLoaded = false; var _otfLoading = false;
var _approvedPelList = [];
var _otfPaketMap = {};

function otfLoad(){

  if(_otfLoading) return;
  _otfLoading = true;
  _otfLoaded  = false;

  var list = document.getElementById('otf-list');
  if(list) list.innerHTML = '<div class="olt-empty"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;opacity:.4"></i><p>Memuat Fee OTF…</p></div>';
  var sb = getSB();
  if(!sb){
    if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-wifi-off"></i><p>Database tidak terhubung</p></div>';
    _otfLoading=false; _otfLoaded=true; return;
  }



  var p1 = sb.from('pelanggan').select('id,cid,nama,area_id,jenis_pelanggan,kecamatan,kelurahan,rw,rt,paket')
    .then(function(r){
      if(!r.error && r.data){
        var FREE_TYPES=JENIS_GRATIS;
        _approvedPelList = r.data.filter(function(p){
          return p && FREE_TYPES.indexOf(p.jenis_pelanggan)===-1;
        });
      }
    });

  var p2 = sb.from('fee_otf').select('*').order('created_at',{ascending:false})
    .then(function(r){
      if(r.error){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Gagal memuat: '+_esc(r.error.message||'coba lagi')+'</p></div>'; return; }
      _otfData = r.data||[];
    }).catch(function(e){ if(list) list.innerHTML='<div class="olt-empty"><i class="ti ti-alert-triangle"></i><p>Error</p></div>'; });

  var p3 = sb.from('paket_master').select('nama,harga_otf')
    .then(function(r){
      _otfPaketMap={};
      ((!r.error&&r.data)||[]).forEach(function(p){ _otfPaketMap[p.nama]=p.harga_otf||0; });
    }).catch(function(){});


  Promise.all([p1,p2,p3]).then(function(){
    _otfLoaded=true; _otfLoading=false;
    otfUpdateStats(); otfFillAreaFilter(); otfRender(); finUpdateDashboard();

    _otfAutoSinkron(sb);
  }).catch(function(){
    _otfLoaded=true; _otfLoading=false;
    otfUpdateStats(); otfRender(); finUpdateDashboard();
  });
}

var _otfSinkronRunning = false;
var _otfSinkronDone = false;

function _otfAutoSinkron(sb){

  if(_otfSinkronRunning || _otfSinkronDone) return;
  _otfSinkronRunning = true;

  var FREE_TYPES=JENIS_GRATIS;

  var sudahSet={};
  _otfData.forEach(function(o){ if(o.pel_id) sudahSet[o.pel_id]=true; });


  Promise.all([
    sb.from('pelanggan').select('id,paket,jenis_pelanggan,tgl_pasang,area_coverage,status'),
    sb.from('paket_master').select('nama,harga_otf')
  ]).then(function(res){
    var rPel=res[0], rPaket=res[1];
    if(rPel.error||!rPel.data){ _otfSinkronRunning=false; return; }

    var paketMap={};
    ((!rPaket.error&&rPaket.data)||[]).forEach(function(p){ paketMap[p.nama]=p.harga_otf||0; });

    var perlu=rPel.data.filter(function(p){

      return p.status==='aktif' && FREE_TYPES.indexOf(p.jenis_pelanggan)<0 && !sudahSet[p.id];
    });


    var nolIds=_otfData.filter(function(o){return (o.nominal||0)===0;}).map(function(o){return o.id;});
    if(nolIds.length){

      for(var ui=0;ui<nolIds.length;ui+=100){
        var batch=nolIds.slice(ui,ui+100);
        sb.from('fee_otf').update({nominal:35000}).in('id',batch).then(function(r){
          if(r&&r.error){ console.error('[otfAutoSinkron] update nominal gagal:', r.error.message); return; }

          _otfData.forEach(function(o){if((o.nominal||0)===0) o.nominal=35000;});
          otfUpdateStats(); otfRender();
        }).catch(function(e){console.error('[otfAutoSinkron] catch update:', e&&e.message);});
      }
    }

    if(!perlu.length){

      _otfSinkronRunning=false;
      _otfSinkronDone=true;
      return;
    }

    var today=new Date().toISOString().slice(0,10);


    var BATCH=50;
    function runBatch(idx){
      if(idx>=perlu.length){
        _otfSinkronRunning=false;
        _otfSinkronDone=true;
        otfUpdateStats(); otfFillAreaFilter(); otfRender(); finUpdateDashboard();

        return;
      }
      var slice=perlu.slice(idx, idx+BATCH);
      var ops=slice.map(function(p){
        var row={
          tgl: p.tgl_pasang||today,
          pel_id: p.id,
          area: p.area_coverage||null,
          nominal: 35000,
          status: 'menunggu_validasi'
        };
        return sb.from('fee_otf').insert([row]).select()
          .then(function(r){
            if(r.error){ console.error('[otfAutoSinkron] insert gagal pel_id='+p.id+' paket='+p.paket+':', r.error.message||r.error.code); }
            if(!r.error && r.data && r.data[0]) _otfData.push(r.data[0]);
            return r;
          }).catch(function(e){ console.error('[otfAutoSinkron] catch:', e&&e.message); return {error:e}; });
      });
      Promise.all(ops).then(function(){
        otfUpdateStats(); otfFillAreaFilter(); otfRender();
        runBatch(idx+BATCH);
      }).catch(function(){ _otfSinkronRunning=false; _otfSinkronDone=true; });
    }
    runBatch(0);
  }).catch(function(){ _otfSinkronRunning=false; });
}

function otfUpdateStats(){
  var e=function(id,v){var el=document.getElementById(id);if(el)el.textContent=v;};
  e('otfst-total', _otfData.length);
  e('otfst-draft', _otfData.filter(function(o){return o.status==='menunggu_validasi'||o.status==='draft';}).length);
  e('otfst-paid', _otfData.filter(function(o){return o.status==='paid';}).length);
  var _otfNomTotal=_otfData.reduce(function(a,o){return a+(o.nominal||0);},0);
  e('otfst-nominal',_fmtRp(_otfNomTotal)+'\n('+_terbilang(_otfNomTotal)+')');
}

function otfFillAreaFilter(){
  var sel = document.getElementById('otf-fil-area'); if(!sel) return;
  var cur = sel.value;
  sel.innerHTML = '<option value="">Semua Area</option>';
  var areas = []; _otfData.forEach(function(o){ if(o.area&&areas.indexOf(o.area)<0) areas.push(o.area); }); areas.sort();
  areas.forEach(function(a){ var opt=document.createElement('option'); opt.value=a; opt.textContent=a; if(a===cur) opt.selected=true; sel.appendChild(opt); });


  var selKec = document.getElementById('otf-fil-kecamatan'); if(!selKec) return;
  var curKec = selKec.value;
  selKec.innerHTML = '<option value="">Semua Kecamatan</option>';
  var kecs = [];
  _otfData.forEach(function(o){ var v=_otfPelKec(o.pel_id); if(v&&kecs.indexOf(v)<0) kecs.push(v); }); kecs.sort();
  kecs.forEach(function(v){ var opt=document.createElement('option'); opt.value=v; opt.textContent='Kec. '+v; if(v===curKec) opt.selected=true; selKec.appendChild(opt); });


  var selKel = document.getElementById('otf-fil-kelurahan'); if(!selKel) return;
  var curKel = selKel.value;
  selKel.innerHTML = '<option value="">Semua Kelurahan</option>';
  var kels = [];
  _otfData.forEach(function(o){ var v=_otfPelKel(o.pel_id); if(v&&kels.indexOf(v)<0) kels.push(v); }); kels.sort();
  kels.forEach(function(v){ var opt=document.createElement('option'); opt.value=v; opt.textContent=v; if(v===curKel) opt.selected=true; selKel.appendChild(opt); });

  otfFillRWFilter();
}

function otfFillRWFilter(){
  var fKec = (document.getElementById('otf-fil-kecamatan')||{}).value||'';
  var fKel = (document.getElementById('otf-fil-kelurahan')||{}).value||'';
  var selRW = document.getElementById('otf-fil-rw'); if(!selRW) return;
  var curRW = selRW.value;
  selRW.innerHTML = '<option value="">Semua RW</option>';
  var rws = [];
  _otfData.forEach(function(o){
    var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;}); if(!p) return;
    if(fKec && (p.kecamatan||'')!==fKec) return;
    if(fKel && (p.kelurahan||'')!==fKel) return;
    var v=p.rw||''; if(v&&rws.indexOf(v)<0) rws.push(v);
  }); rws.sort();
  rws.forEach(function(v){ var opt=document.createElement('option'); opt.value=v; opt.textContent='RW '+v; if(v===curRW) opt.selected=true; selRW.appendChild(opt); });
  otfFillRTFilter();
}

function otfFillRTFilter(){
  var fKec = (document.getElementById('otf-fil-kecamatan')||{}).value||'';
  var fKel = (document.getElementById('otf-fil-kelurahan')||{}).value||'';
  var fRW  = (document.getElementById('otf-fil-rw')||{}).value||'';
  var selRT = document.getElementById('otf-fil-rt'); if(!selRT) return;
  var curRT = selRT.value;
  selRT.innerHTML = '<option value="">Semua RT</option>';
  var rts = [];
  _otfData.forEach(function(o){
    var p=_approvedPelList.find(function(x){return x&&x.id===o.pel_id;}); if(!p) return;
    if(fKec && (p.kecamatan||'')!==fKec) return;
    if(fKel && (p.kelurahan||'')!==fKel) return;
    if(fRW  && (p.rw||'')!==fRW) return;
    var v=p.rt||''; if(v&&rts.indexOf(v)<0) rts.push(v);
  }); rts.sort();
  rts.forEach(function(v){ var opt=document.createElement('option'); opt.value=v; opt.textContent='RT '+v; if(v===curRT) opt.selected=true; selRT.appendChild(opt); });
}

function otfSearch(q){ _otfPage=1; var c=document.getElementById('otf-search-clr'); if(c) c.style.display=q?'block':'none'; otfRender(); }
function otfClearSearch(){ var i=document.getElementById('otf-search'); if(i) i.value=''; var c=document.getElementById('otf-search-clr'); if(c) c.style.display='none'; _otfPage=1; otfRender(); }

function otfRender(){
  var q   = (document.getElementById('otf-search')||{}).value||'';
  var fSt = (document.getElementById('otf-fil-status')||{}).value||'';
  var fAr = (document.getElementById('otf-fil-area')||{}).value||'';
  var fKec = (document.getElementById('otf-fil-kecamatan')||{}).value||'';
  var fKel = (document.getElementById('otf-fil-kelurahan')||{}).value||'';
  var fRW  = (document.getElementById('otf-fil-rw')||{}).value||'';
  var fRT  = (document.getElementById('otf-fil-rt')||{}).value||'';
  q = q.toLowerCase().trim();
  var stLbl={draft:'Draft',waiting_payment:'Waiting Payment',paid:'Paid',canceled:'Canceled'};
  _otfFil = _otfData.filter(function(o){
    var cid=_otfPelCID(o.pel_id);
    var nama=_otfPelName(o.pel_id);
    var matchQ = !q || (cid+'').toLowerCase().includes(q) || (nama+'').toLowerCase().includes(q) || (o.area||'').toLowerCase().includes(q);
    var matchSt = !fSt || o.status===fSt;
    var matchAr = !fAr || o.area===fAr;
    var matchKec = !fKec || _otfPelKec(o.pel_id)===fKec;
    var matchKel = !fKel || _otfPelKel(o.pel_id)===fKel;
    var matchRW  = !fRW  || _otfPelRW(o.pel_id)===fRW;
    var matchRT  = !fRT  || _otfPelRT(o.pel_id)===fRT;
    return matchQ&&matchSt&&matchAr&&matchKec&&matchKel&&matchRW&&matchRT;
  });
  var total=_otfFil.length; var pages=Math.max(1,Math.ceil(total/_otfPerPg));
  if(_otfPage>pages) _otfPage=pages;
  var start=(_otfPage-1)*_otfPerPg;
  var list=document.getElementById('otf-list'); if(!list) return;
  if(!total){ list.innerHTML='<div class="olt-empty"><i class="ti ti-bolt-off"></i><p>Tidak ada data OTF</p></div>'; document.getElementById('otf-pagi').style.display='none'; return; }
  list.innerHTML=_otfFil.slice(start,start+_otfPerPg).map(_otfRowHTML).join('');
  var pagi=document.getElementById('otf-pagi');
  if(pages>1){ pagi.style.display='flex'; var prev=document.getElementById('otf-prev'); var next=document.getElementById('otf-next'); var info=document.getElementById('otf-pagi-info'); if(prev) prev.disabled=_otfPage<=1; if(next) next.disabled=_otfPage>=pages; if(info) info.textContent=_otfPage+' / '+pages; }
  else pagi.style.display='none';
}

function _otfPelName(pid){ var p=_approvedPelList.find(function(x){return x&&x.id===pid;}); return p?(p.nama||'—'):'—'; }
function _otfPelCID(pid){ var p=_approvedPelList.find(function(x){return x&&x.id===pid;}); return p?(p.cid||'—'):'—'; }

function _otfPelKec(pid){ var p=_approvedPelList.find(function(x){return x&&x.id===pid;}); return p?(p.kecamatan||''):''; }
function _otfPelKel(pid){ var p=_approvedPelList.find(function(x){return x&&x.id===pid;}); return p?(p.kelurahan||''):''; }
function _otfPelRW(pid){ var p=_approvedPelList.find(function(x){return x&&x.id===pid;}); return p?(p.rw||''):''; }
function _otfPelRT(pid){ var p=_approvedPelList.find(function(x){return x&&x.id===pid;}); return p?(p.rt||''):''; }
function _otfPelAreaName(pid){
  var p=_approvedPelList.find(function(x){return x&&x.id===pid;});
  if(!p) return '';
  var a=_areaData.find(function(x){return x.id===p.area_id;});
  return a?(a.nama||a.kode||''):'';
}

function _otfRowHTML(o){
  var stTag={aktif:'tc1',draft:'ty',menunggu_validasi:'ty',waiting_payment:'tc1',siap_bayar:'tc1',paid:'tg',canceled:'tgr'};
  var stLbl={aktif:'Aktif',draft:'Draft',menunggu_validasi:'Menunggu Validasi',waiting_payment:'Siap Bayar',siap_bayar:'Siap Bayar',paid:'Paid',canceled:'Canceled'};
  var ico={aktif:'ti-bolt',draft:'ti-pencil',menunggu_validasi:'ti-clock',waiting_payment:'ti-wallet',siap_bayar:'ti-wallet',paid:'ti-check',canceled:'ti-x'};
  var icoCls={aktif:'unpaid',draft:'draft',menunggu_validasi:'draft',waiting_payment:'unpaid',siap_bayar:'unpaid',paid:'paid',canceled:'cancelled'};
  var isWaiting = o.status==='menunggu_validasi';
  var areaN=_otfPelAreaName(o.pel_id); var kec=_otfPelKec(o.pel_id); var rw=_otfPelRW(o.pel_id); var rt=_otfPelRT(o.pel_id);
  var loks=[]; if(areaN) loks.push(areaN); if(kec) loks.push('Kec. '+kec); if(rw) loks.push('RW '+rw); if(rt) loks.push('RT '+rt);
  var lokasiStr = loks.length ? loks.join(' \u00b7 ') : (o.area||'');
  var valBtn = isWaiting ?
    '<div style="display:flex;gap:6px;margin-top:8px" onclick="event.stopPropagation()">'+
      '<button onclick="otfValidasi(\''+o.id+'\',true)" style="flex:1;padding:8px 0;border:none;border-radius:9px;background:rgba(5,150,105,.12);color:var(--green);font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;touch-action:manipulation">'+
        '<i class="ti ti-circle-check" style="font-size:15px"></i> Validasi'+
      '</button>'+
      '<button onclick="otfValidasi(\''+o.id+'\',false)" style="flex:1;padding:8px 0;border:none;border-radius:9px;background:rgba(220,38,38,.1);color:var(--red);font-family:\'Sora\',sans-serif;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;touch-action:manipulation">'+
        '<i class="ti ti-circle-x" style="font-size:15px"></i> Tolak'+
      '</button>'+
    '</div>' : '';
  return '<div class="inv-row" onclick="otfOpenDet(\''+o.id+'\')" >'+
    '<div class="inv-row-top">'+
      '<div class="inv-row-ico '+(icoCls[o.status]||'draft')+'"><i class="ti '+(ico[o.status]||'ti-bolt')+'"></i></div>'+
      '<div class="inv-row-info">'+
        '<div class="inv-row-no">'+_esc(_otfPelCID(o.pel_id))+'</div>'+
        '<div class="inv-row-name">'+_esc(_otfPelName(o.pel_id))+'</div>'+
      '</div>'+
      '<div class="inv-row-nominal">Rp '+_fmt(o.nominal||0)+'</div>'+
    '</div>'+
    '<div class="inv-row-meta">'+
      '<span class="tag '+(stTag[o.status]||'ty')+'">'+_esc(stLbl[o.status]||o.status)+'</span>'+
      ((!o.nominal||o.nominal===0)&&o.status==='draft'?'<span class="tag tr"><i class="ti ti-alert-triangle" style="font-size:10px"></i> Belum Sinkron</span>':'')+
      (lokasiStr?'<span class="tag tgr" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle"><i class="ti ti-map-pin" style="font-size:9px;margin-right:2px"></i>'+_esc(lokasiStr)+'</span>':'')+
      (o.tgl?'<span style="font-size:10px;color:var(--text3)">'+_esc(o.tgl)+'</span>':'')+
    '</div>'+
    valBtn+
  '</div>';
}

function otfPage(dir){ var pages=Math.max(1,Math.ceil(_otfFil.length/_otfPerPg)); _otfPage=Math.min(pages,Math.max(1,_otfPage+dir)); otfRender(); }

function otfValidasi(id, setValid){
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var o=_otfData.find(function(x){return x.id===id;}); if(!o) return;
  if(setValid && !((o.nominal||0)>0)){ toast('Nominal OTF belum diisi','err'); return; }
  var newStatus = setValid ? 'siap_bayar' : 'draft';
  var label = setValid ? 'Valid → Siap Bayar ✓' : 'Dikembalikan ke Draft';
  sb.from('fee_otf').update({status:newStatus}).eq('id',id).then(function(r){
    if(r.error){ toast('Gagal: '+(r.error.message||'coba lagi'),'err'); return; }
    o.status=newStatus;
    toast(label,'ok');
    otfUpdateStats(); otfRender();
  }).catch(function(){ toast('Error','err'); });
}

function otfValidasiSemua(){
  var pending = _otfData.filter(function(o){ return o.status==='menunggu_validasi'; });
  if(!pending.length){ toast('Tidak ada yang menunggu validasi','info'); return; }
  var eligible = pending.filter(function(o){ return (o.nominal||0)>0; });
  if(!eligible.length){ toast('Tidak ada OTF yang memenuhi syarat (perlu Nominal terisi)','err'); return; }
  if(!confirm('Validasi '+eligible.length+' OTF → Siap Bayar?')) return;
  var sb=getSB(); if(!sb){ toast('Database tidak terhubung','err'); return; }
  var ids = eligible.map(function(o){return o.id;});
  sb.from('fee_otf').update({status:'siap_bayar'}).in('id',ids).then(function(r){
    if(r.error){ toast('Gagal: '+(r.error.message||''),'err'); return; }
    eligible.forEach(function(o){ o.status='siap_bayar'; });
    toast('Semua OTF divalidasi → Siap Bayar ('+eligible.length+')','ok');
    otfUpdateStats(); otfRender();
  }).catch(function(){ toast('Error','err'); });
}

function otfOpenForm(data){
  var isEdit=!!data;
  document.getElementById('otf-form-title').textContent=isEdit?'Edit Fee OTF':'Generate Fee OTF';
  document.getElementById('otff-id').value=isEdit?(data.id||''):'';
  document.getElementById('otff-tgl').value=isEdit?(data.tgl||''):new Date().toISOString().slice(0,10);
  document.getElementById('otff-nominal').value=isEdit?(data.nominal||0):35000;
  document.getElementById('otff-status').value=isEdit?(data.status||'draft'):'menunggu_validasi';
  document.getElementById('otff-area').value=isEdit?(data.area||''):'';

  var sel=document.getElementById('otff-pel');
  sel.innerHTML='<option value="">— Pilih Pelanggan Approved —</option>';
  _approvedPelList.forEach(function(p){
    if(!p) return;
    var opt=document.createElement('option');
    opt.value=p.id; opt.textContent=(p.cid||'—')+' · '+(p.nama||'—');
    if(isEdit&&data.pel_id===p.id) opt.selected=true;
    sel.appendChild(opt);
  });
  if(isEdit) {  var found=_approvedPelList.find(function(x){return x&&x.id===data.pel_id;}); if(found) document.getElementById('otff-area').value=found.area||data.area||''; }
  document.getElementById('otff-pel').onchange=function(){
    var pid=this.value;
    var p=_approvedPelList.find(function(x){return x&&x.id===pid;});
    document.getElementById('otff-area').value=p&&p.area_id?p.area_id:'';

    if(!isEdit) document.getElementById('otff-nominal').value=35000;  };
  document.getElementById('otf-form-overlay').classList.add('on');
}
