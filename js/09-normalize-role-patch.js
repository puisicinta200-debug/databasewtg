
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


    sb.rpc('list_legacy_role_users')
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

  sb.rpc('migrate_legacy_roles')
    .then(function(r){
      if(r.error){
        if(typeof toast==='function') toast('Gagal migrasi: '+(r.error.message||''),'err');
        if(btn){ btn.disabled=false; btn.innerHTML='<i class="ti ti-database-cog"></i> Migrasi Sekarang'; }
        return;
      }
      if(typeof toast==='function') toast('Migrasi role berhasil ('+(r.data||0)+' user)! Memuat ulang data…','ok');
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
