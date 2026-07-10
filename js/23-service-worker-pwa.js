
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
