
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

/* =====================================================================
   ↓↓↓ TAMBAHAN (menyatu di file ini, bukan file terpisah) ↓↓↓
===================================================================== */
/* =====================================================================
   PATCH 25 — SIKLUS SUSPEND & REAKTIVASI (BARU)
   ---------------------------------------------------------------------
   File ini TIDAK mengedit js/03-app-core.js sama sekali. Semua fungsi
   asli (termasuk rule "4 periode -> cabut" yang sudah ada di
   _recCheckAutoDismantle) dibiarkan 100% seperti semula — file ini
   hanya "menumpang" di titik yang sudah ada, sama seperti pola patch
   01, 09, 10, dst di project ini.

   ATURAN BARU YANG DITAMBAHKAN (sesuai permintaan):
   1) Pelanggan AKTIF yang 2 periode fee_recurring terakhir berturut-turut
      masih berstatus 'menunggu_validasi'/'draft' (belum dikonfirmasi
      finance) -> OTOMATIS pindah status jadi SUSPEND.
      - Data teknis (SN ONT / Port / ODP) TIDAK diutak-atik saat suspend,
        supaya gampang balik aktif lagi.
      - Sesuai keputusan: selama SUSPEND, tagihan bulanan baru TIDAK
        dibuat (mengikuti rule lama _recAutoSinkron yang memang cuma
        menagih pelanggan berstatus 'aktif' — rule itu tidak disentuh).

   2) Karena tagihan berhenti saat suspend, hitungan "bulan ke-4" tidak
      bisa lagi dihitung dari jumlah baris tagihan (karena tidak ada
      baris baru). Maka dipakai hitungan KALENDER:
        - Saat pelanggan disuspend, periode terakhir yang tercatat di
          fee_recurring (yang menunggak) otomatis "membeku" (tidak
          bertambah lagi).
        - Begitu kalender sudah maju 2 bulan penuh dari periode beku
          tsb TANPA ada reaktivasi manual, pelanggan otomatis pindah
          ke CABUT/DISMANTLE (total 2 bulan sebelum suspend + 2 bulan
          selama suspend = 4 bulan, sesuai permintaan).
        - Proses cabut otomatis ini memakai LOGIKA PERSIS SAMA dengan
          proses cabut lama (insert dismantle_orders, kosongkan SN
          ONT/Port/ODP, bebaskan port) — tidak ada aturan baru dibuat,
          cuma diperluas supaya pelanggan yang sudah 'suspend' juga
          ikut kena, karena sebelumnya rule lama cuma cek status 'aktif'.

   3) Reaktivasi (BARU):
        - SUSPEND -> AKTIF : 1 klik, otomatis aktif lagi (data teknis
          aman, tidak pernah dihapus saat suspend).
        - CABUT -> AKTIF   : 1 klik, status balik aktif. SN ONT/Port/ODP
          TIDAK otomatis terisi lagi (karena memang sudah dikosongkan &
          portnya sudah dibebaskan sejak proses cabut lama) — perlu
          dilengkapi manual lewat Edit Pelanggan, sama seperti pasang
          baru. Ini bukan aturan baru, cuma konsekuensi wajar dari rule
          cabut lama yang tidak diubah.
        - Tersedia tombol per-pelanggan (di halaman Detail Pelanggan)
          DAN tombol massal (di halaman daftar Pelanggan).

   TIDAK ADA perubahan skema/kolom database.
   TIDAK ADA perubahan pada proses konfirmasi/validasi finance.
===================================================================== */
(function(){
  'use strict';

  // ---- Ambang batas (gampang diubah kalau suatu saat diperlukan) ----
  var SUSPEND_AFTER   = 2; // 2 periode belum konfirmasi -> suspend
  var DISMANTLE_AFTER = 4; // total 4 (periode/bulan) belum konfirmasi -> cabut
  var EXTRA_BULAN_SUSPEND = DISMANTLE_AFTER - SUSPEND_AFTER; // 2 bulan tambahan setelah suspend

  function _belumKonfirmasi(st){
    return st === 'menunggu_validasi' || st === 'draft';
  }

  function _ymSekarang(){
    var d = new Date();
    return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);
  }

  function _selisihBulan(dariYM, keYM){
    var a = dariYM.split('-'), b = keYM.split('-');
    if(a.length<2 || b.length<2) return 0;
    return (parseInt(b[0],10)*12+parseInt(b[1],10)) - (parseInt(a[0],10)*12+parseInt(a[1],10));
  }

  // ================= 1) AKTIF -> SUSPEND (2 periode belum konfirmasi) =================
  function _wtgAutoSuspendCheck(sb){
    if(!sb) return;
    var FREE_TYPES = window.JENIS_GRATIS || [];

    Promise.all([
      _sbFetchAllRows(sb, 'fee_recurring', 'pel_id,periode,status', function(q){ return q.order('periode', {ascending:false}); }),
      _sbFetchAllRows(sb, 'pelanggan', 'id,cid,nama,jenis_pelanggan,status', function(q){ return q.eq('status','aktif'); })
    ]).then(function(res){
      var rRec = res[0], rPel = res[1];
      if(rRec.error || rPel.error) return;

      var byPel = {};
      (rRec.data||[]).forEach(function(r){
        if(!r.pel_id) return;
        if(!byPel[r.pel_id]) byPel[r.pel_id] = [];
        byPel[r.pel_id].push(r);
      });

      var akanSuspend = [];
      (rPel.data||[]).forEach(function(p){
        if(FREE_TYPES.indexOf(p.jenis_pelanggan) >= 0) return;
        var rows = byPel[p.id]; if(!rows) return;
        rows = rows.slice().sort(function(a,b){ return a.periode < b.periode ? 1 : -1; });
        var lastN = rows.slice(0, SUSPEND_AFTER);
        if(lastN.length < SUSPEND_AFTER) return;
        var semuaBelum = lastN.every(function(r){ return _belumKonfirmasi(r.status); });
        if(semuaBelum) akanSuspend.push(p);
      });

      if(!akanSuspend.length) return;

      var ids = akanSuspend.map(function(p){ return p.id; });
      _wtgUpdateStatusBatched(sb, ids, 'suspend', function(totalOk){
        if(!totalOk) return;
        if(typeof toast === 'function') toast('⏸ '+totalOk+' pelanggan belum konfirmasi bayar '+SUSPEND_AFTER+' periode → otomatis di-SUSPEND', 'err');
        if(typeof _pelLoaded !== 'undefined') _pelLoaded = false;
        setTimeout(function(){ if(typeof pelLoad === 'function') pelLoad(); }, 300);
      });
    }).catch(function(){});
  }

  // ================= 2) SUSPEND -> CABUT (2 bulan kalender tambahan) =================
  function _wtgAutoDismantleFromSuspend(sb){
    if(!sb) return;
    var FREE_TYPES = window.JENIS_GRATIS || [];
    var todayYM = _ymSekarang();

    Promise.all([
      _sbFetchAllRows(sb, 'pelanggan', 'id,cid,nama,area_id,area_coverage,kecamatan,jenis_pelanggan,ont_item_id,kabel_item_id,status', function(q){ return q.eq('status','suspend'); }),
      _sbFetchAllRows(sb, 'fee_recurring', 'pel_id,periode', function(q){ return q.order('periode', {ascending:false}); }),
      _sbFetchAllRows(sb, 'dismantle_orders', 'pel_id', function(q){ return q.eq('status','selesai'); })
    ]).then(function(res){
      var rPel = res[0], rRec = res[1], rDmt = res[2];
      if(rPel.error || rRec.error) return;

      var sudahDismantle = {};
      (rDmt.data||[]).forEach(function(d){ if(d.pel_id) sudahDismantle[d.pel_id] = 1; });

      var periodeTerakhir = {};
      (rRec.data||[]).forEach(function(r){
        if(!r.pel_id || !r.periode) return;
        if(!periodeTerakhir[r.pel_id] || r.periode > periodeTerakhir[r.pel_id]) periodeTerakhir[r.pel_id] = r.periode;
      });

      var akanDismantle = [];
      (rPel.data||[]).forEach(function(p){
        if(sudahDismantle[p.id]) return;
        if(FREE_TYPES.indexOf(p.jenis_pelanggan) >= 0) return;
        var lp = periodeTerakhir[p.id]; if(!lp) return;
        var selisih = _selisihBulan(lp, todayYM);
        if(selisih >= EXTRA_BULAN_SUSPEND) akanDismantle.push(p);
      });

      if(!akanDismantle.length) return;

      var tgl = new Date().toISOString().slice(0,10);
      var ops = akanDismantle.map(function(pel){
        var payload = {
          pel_id: pel.id, cid_pelanggan: pel.cid || null,
          nama_pelanggan: pel.nama || null, area_id: pel.area_id || null,
          area_coverage: pel.area_coverage || null, kecamatan: pel.kecamatan || null,
          tgl_cabut: tgl, tgl_selesai: tgl,
          alasan: 'menunggak',
          catatan: 'Auto-dismantle: menunggak total '+DISMANTLE_AFTER+' bulan (via status suspend, tanpa konfirmasi finance)',
          status: 'selesai',
          ont_item_id: pel.ont_item_id || null,
          kabel_item_id: pel.kabel_item_id || null,
          dilakukan_oleh: 'SYSTEM', role_aktor: 'auto'
        };
        return sb.from('dismantle_orders').insert([payload]).then(function(rd){
          if(rd && rd.error) return;
          return sb.from('pelanggan').update({status:'cabut', sn_ont:null, nomor_port:null, odp_id:null}).eq('id', pel.id);
        }).then(function(){
          if(pel.cid){
            sb.from('odp_ports').update({status:'kosong', cid_pelanggan:null, paket:null, tgl_pasang:null}).eq('cid_pelanggan', pel.cid).catch(function(){});
          }
          sb.from('fee_recurring').update({status:'stopped'}).eq('pel_id', pel.id).neq('status','paid').catch(function(){});
        }).catch(function(){});
      });

      Promise.all(ops).then(function(){
        if(typeof toast === 'function') toast('⚠️ '+akanDismantle.length+' pelanggan (suspend) menunggak '+DISMANTLE_AFTER+' bulan → otomatis di-DISMANTLE', 'err');
        if(typeof _pelLoaded !== 'undefined') _pelLoaded = false;
        if(typeof _dmtLoaded !== 'undefined') _dmtLoaded = false;
        setTimeout(function(){
          if(typeof pelLoad === 'function') pelLoad();
          if(typeof dmtLoad === 'function') dmtLoad();
        }, 300);
      });
    }).catch(function(){});
  }

  // Sisipkan ke titik pemicu yang SUDAH ADA (jalan tiap kali sinkron tagihan
  // dijalankan) — TANPA mengubah isi _recCheckAutoDismantle aslinya.
  var _origCheckAutoDismantle = window._recCheckAutoDismantle;
  window._recCheckAutoDismantle = function(sb){
    if(typeof _origCheckAutoDismantle === 'function') _origCheckAutoDismantle(sb);
    _wtgAutoSuspendCheck(sb);
    _wtgAutoDismantleFromSuspend(sb);
  };

  // ================= 3) REAKTIVASI =================
  function wtgReaktivasiSatu(id, namaPel, statusAsal){
    var sb = typeof getSB === 'function' ? getSB() : null;
    if(!sb){ if(typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    var pesan = 'Aktifkan kembali "'+(namaPel||'pelanggan ini')+'"?';
    if(statusAsal === 'cabut'){
      pesan += '\n\nCatatan: pelanggan ini sebelumnya CABUT. SN ONT / Port / ODP tidak otomatis terpasang lagi — lengkapi lewat menu Edit Pelanggan setelah ini.';
    }
    if(!confirm(pesan)) return;

    sb.from('pelanggan').update({status:'aktif'}).eq('id', id).then(function(r){
      if(r.error){ if(typeof toast === 'function') toast('Gagal mengaktifkan: '+r.error.message, 'err'); return; }
      if(typeof toast === 'function') toast('✅ '+(namaPel||'Pelanggan')+' berhasil diaktifkan kembali', 'ok');
      if(typeof pelCloseDet === 'function') pelCloseDet();
      if(typeof _pelLoaded !== 'undefined') _pelLoaded = false;
      if(typeof pelLoad === 'function') pelLoad();
    }).catch(function(e){ if(typeof toast === 'function') toast('Error: '+(e&&e.message||'coba lagi'), 'err'); });
  }

  // Update banyak ID sekaligus lewat URL query bisa kepanjangan & ditolak
  // server ("Bad Request") kalau jumlah pelanggannya ratusan. Makanya
  // dipecah per BATCH_SIZE, dikirim satu-satu berurutan (bukan barengan),
  // sama seperti pola batching yang sudah dipakai di bagian lain aplikasi.
  // Batch diperkecil (samakan dengan pola aman yang sudah dipakai fitur
  // import lain di aplikasi ini) + diberi jeda antar batch. Ini supaya
  // notifikasi realtime yang muncul akibat perubahan banyak baris sekaligus
  // tidak "membanjiri" cache data (SOT) yang dipakai halaman Monitoring /
  // Inventory / Owner Dashboard, yang bisa bikin halaman itu macet
  // "Memuat data..." kalau reaktivasi dilakukan untuk ratusan pelanggan
  // sekaligus dalam waktu singkat.
  var WTG_BATCH_SIZE = 50;
  var WTG_BATCH_DELAY_MS = 600;

  function _wtgUpdateStatusBatched(sb, ids, statusBaru, onDone, progOpts){
    var totalOk = 0, totalGagal = 0;
    var chunks = [];
    for(var i=0; i<ids.length; i+=WTG_BATCH_SIZE){ chunks.push(ids.slice(i, i+WTG_BATCH_SIZE)); }
    var pakaiProg = progOpts && window.ProgUI;

    function jalankan(idx){
      if(idx >= chunks.length){
        if(pakaiProg){
          if(totalGagal){
            ProgUI.error(totalOk+' berhasil, '+totalGagal+' gagal — coba ulangi untuk sisanya');
          } else {
            ProgUI.success((progOpts.doneTitle||'Selesai')+' — '+totalOk+' data', 1400);
          }
        }
        onDone(totalOk, totalGagal);
        return;
      }
      if(pakaiProg){
        ProgUI.step((progOpts.stepLabel||'Memproses')+' batch '+(idx+1)+'/'+chunks.length, idx, chunks.length);
      }
      sb.from('pelanggan').update({status:statusBaru}).in('id', chunks[idx]).then(function(ru){
        if(ru && ru.error) totalGagal += chunks[idx].length;
        else totalOk += chunks[idx].length;
        if(pakaiProg) ProgUI.step(null, idx+1, chunks.length);
        setTimeout(function(){ jalankan(idx+1); }, WTG_BATCH_DELAY_MS);
      }).catch(function(){
        totalGagal += chunks[idx].length;
        setTimeout(function(){ jalankan(idx+1); }, WTG_BATCH_DELAY_MS);
      });
    }
    jalankan(0);
  }

  function wtgReaktivasiMassal(statusAsal){
    var label = statusAsal === 'suspend' ? 'SUSPEND' : 'CABUT';
    var sb = typeof getSB === 'function' ? getSB() : null;
    if(!sb){ if(typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    sb.from('pelanggan').select('id,nama,cid').eq('status', statusAsal).then(function(r){
      if(r.error){ if(typeof toast === 'function') toast('Gagal mengambil data: '+r.error.message, 'err'); return; }
      var list = r.data||[];
      if(!list.length){ if(typeof toast === 'function') toast('Tidak ada pelanggan berstatus '+label, 'err'); return; }

      var pesan = 'Aktifkan kembali SEMUA pelanggan berstatus '+label+' ('+list.length+' pelanggan)?';
      if(statusAsal === 'cabut'){
        pesan += '\n\nCatatan: SN ONT / Port / ODP TIDAK otomatis terpasang lagi untuk pelanggan yang sudah CABUT — lengkapi manual lewat Edit Pelanggan satu per satu.';
      }
      if(!confirm(pesan)) return;

      var ids = list.map(function(p){ return p.id; });

      if(window.ProgUI){
        ProgUI.open({ title:'Mengaktifkan '+ids.length+' Pelanggan', step:'Mempersiapkan…', total: ids.length });
      } else if(typeof toast === 'function'){
        toast('⏳ Mengaktifkan '+ids.length+' pelanggan, mohon tunggu…', 'ok');
      }

      _wtgUpdateStatusBatched(sb, ids, 'aktif', function(totalOk, totalGagal){
        if(!window.ProgUI){
          if(totalOk && !totalGagal){
            if(typeof toast === 'function') toast('✅ '+totalOk+' pelanggan berhasil diaktifkan kembali', 'ok');
          } else if(totalOk && totalGagal){
            if(typeof toast === 'function') toast('⚠ '+totalOk+' berhasil, '+totalGagal+' gagal — coba ulangi lagi untuk sisanya', 'err');
          } else {
            if(typeof toast === 'function') toast('Gagal mengaktifkan massal, coba lagi', 'err');
          }
        }
        if(typeof _pelLoaded !== 'undefined') _pelLoaded = false;
        if(typeof pelLoad === 'function') pelLoad();
      }, { stepLabel:'Mengaktifkan pelanggan', doneTitle:'Reaktivasi selesai' });
    }).catch(function(e){ if(typeof toast === 'function') toast('Error: '+(e&&e.message||'coba lagi'), 'err'); });
  }

  window.wtgReaktivasiSatu = wtgReaktivasiSatu;
  window.wtgReaktivasiMassal = wtgReaktivasiMassal;

  // ================= 4) UI: tombol per-pelanggan di halaman Detail =================
  var _origPelRenderDetBody = window._pelRenderDetBody;
  window._pelRenderDetBody = function(p){
    if(typeof _origPelRenderDetBody === 'function') _origPelRenderDetBody(p);
    if(p && (p.status === 'suspend' || p.status === 'cabut')){
      var body = document.getElementById('pel-det-body');
      if(body){
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;gap:8px;margin-top:8px';
        var namaSafe = String(p.nama||p.cid||'').replace(/'/g,"\\'");
        wrap.innerHTML =
          '<button class="btn" style="flex:1;background:#16a34a;color:#fff" onclick="wtgReaktivasiSatu(\''+p.id+'\',\''+namaSafe+'\',\''+p.status+'\')">'+
            '<i class="ti ti-player-play"></i> Aktifkan Kembali</button>';
        body.appendChild(wrap);
      }
    }
  };

  // ================= 5) UI: tombol massal di halaman daftar Pelanggan =================
  var _wtgToolbarWatch = setInterval(function(){
    var filterBar = document.querySelector('#p-pelanggan .olt-filter-bar');
    if(!filterBar || document.getElementById('wtg-reaktivasi-bar')) return;
    clearInterval(_wtgToolbarWatch);

    var bar = document.createElement('div');
    bar.id = 'wtg-reaktivasi-bar';
    bar.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap';
    bar.innerHTML =
      '<button class="btn btn-ghost" style="flex:1;min-width:160px;font-size:12px;background:rgba(202,138,4,.08);border-color:rgba(202,138,4,.3);color:#a16207" onclick="wtgReaktivasiMassal(\'suspend\')">'+
        '<i class="ti ti-player-play"></i> Aktifkan Semua Suspend</button>'+
      '<button class="btn btn-ghost" style="flex:1;min-width:160px;font-size:12px;background:var(--rg2);border-color:rgba(220,38,38,.25);color:var(--red)" onclick="wtgReaktivasiMassal(\'cabut\')">'+
        '<i class="ti ti-player-play"></i> Aktifkan Semua Cabut</button>';
    filterBar.parentNode.insertBefore(bar, filterBar);
  }, 300);

})();

/* =====================================================================
   FITUR BARU — EXPORT DATA PELANGGAN SESUAI FILTER TANGGAL PASANG
   ---------------------------------------------------------------------
   TEMUAN AUDIT: Data Pelanggan SUDAH PUNYA "Filter Tanggal Aktif"
   (tgl_pasang dari-sampai) bawaan — jadi fitur ini TIDAK membuat ulang
   filter tanggal (itu sudah ada). Yang ditambah HANYA tombol "Export
   CSV" yang mengekspor pelanggan sesuai filter yang SEDANG AKTIF di
   layar (tanggal pasang + status/area/paket/jenis kalau ada) — cocok
   untuk laporan OTF pelanggan baru pasang di periode tertentu.

   TIDAK mengedit js/03-app-core.js. Query filter yang dipakai di sini
   MENIRU PERSIS logika filter pelLoadPage() yang sudah ada (supaya
   hasil export = persis sama dengan yang tampil di layar), hanya saja
   tanpa batas halaman (ambil SEMUA yang cocok, bukan cuma 1 halaman).
===================================================================== */
(function(){
  'use strict';

  function esc(s){ return String(s == null ? '' : s); }
  function csvCell(v){ return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }

  function ensureExportButton(){
    if (document.getElementById('pel-export-btn')) return;
    var badge = document.getElementById('pel-fil-tgl-badge');
    var container = badge ? badge.parentNode : null;
    if (!container) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'pel-export-btn';
    btn.onclick = window.pelExportFiltered;
    btn.style.cssText = 'display:flex;align-items:center;gap:5px;margin-left:8px;background:var(--gng2);border:1.5px solid rgba(5,150,105,.3);color:var(--green);font-size:10.5px;font-weight:700;padding:5px 10px;border-radius:20px;cursor:pointer;white-space:nowrap';
    btn.innerHTML = '<i class="ti ti-file-export" style="font-size:12px"></i> Export CSV';
    container.appendChild(btn);
  }

  // Pasang tombolnya setiap kali pelApplyFilter jalan (supaya badge/tombol
  // selalu ada begitu halaman Data Pelanggan dibuka), tanpa mengubah
  // logika filter aslinya sama sekali.
  var _origPelApplyFilter = window.pelApplyFilter;
  if (typeof _origPelApplyFilter === 'function'){
    window.pelApplyFilter = function(){
      _origPelApplyFilter();
      ensureExportButton();
    };
  }
  setTimeout(ensureExportButton, 800); // jaga-jaga kalau halaman sudah kebuka duluan

  window.pelExportFiltered = function(){
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ if (typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    if (window.ProgUI) ProgUI.open({ title: 'Export Data Pelanggan', step: 'Mengambil data sesuai filter…' });

    // Meniru PERSIS kriteria filter yang sudah ada di pelLoadPage(),
    // cuma tanpa .range() supaya SEMUA yang cocok ikut ke-export,
    // bukan cuma 1 halaman yang sedang tampil.
    var q = sb.from('pelanggan').select('*').order('tgl_pasang', { ascending: false });
    if (typeof _isGlobalRole === 'function' && !_isGlobalRole()){
      var sc = (typeof _getUserAreaScope === 'function') ? _getUserAreaScope() : null;
      if (sc && sc.area_coverage_id) q = q.eq('area_id', sc.area_coverage_id);
    }
    var f = window._pelActiveFilter || {};
    if (f.area)   q = q.eq('area_id', f.area);
    if (f.status) q = q.eq('status', f.status);
    if (f.paket)  q = q.eq('paket', f.paket);
    if (f.jenis)  q = q.eq('jenis_pelanggan', f.jenis);
    if (f.tglDari)   q = q.gte('tgl_pasang', f.tglDari);
    if (f.tglSampai) q = q.lte('tgl_pasang', f.tglSampai);

    q.then(function(r){
      if (r.error){
        if (typeof toast === 'function') toast('Gagal export: ' + (r.error.message || 'coba lagi'), 'err');
        if (window.ProgUI) ProgUI.error('Gagal export: ' + (r.error.message || 'coba lagi'));
        return;
      }
      var rows = r.data || [];
      if (!rows.length){
        if (typeof toast === 'function') toast('Tidak ada pelanggan yang cocok dengan filter saat ini', 'err');
        if (window.ProgUI) ProgUI.error('Tidak ada data untuk diekspor sesuai filter saat ini');
        return;
      }

      if (window.ProgUI) ProgUI.step('Melengkapi data OTF untuk ' + rows.length + ' pelanggan…', 55);
      var ids = rows.map(function(p){ return p.id; });

      sb.from('fee_otf').select('pel_id,status,nominal,tgl').in('pel_id', ids).then(function(ro){
        var otfMap = {};
        (ro.data || []).forEach(function(o){
          // kalau 1 pelanggan punya beberapa baris OTF, ambil yang paling baru saja
          if (!otfMap[o.pel_id] || (o.tgl || '') > (otfMap[o.pel_id].tgl || '')) otfMap[o.pel_id] = o;
        });

        if (window.ProgUI) ProgUI.step('Menyusun ' + rows.length + ' baris menjadi CSV…', 80);

        var areaById = {};
        (window._areaData || (window.SOT ? SOT.cache().areas : []) || []).forEach(function(a){ areaById[a.id] = a.nama || a.kode; });

        var cols = ['CID', 'Nama', 'Alamat', 'Area', 'Kecamatan', 'Kelurahan', 'RW', 'RT', 'Paket', 'Status Pelanggan', 'Tanggal Pasang', 'Teknisi Pasang', 'SN ONT', 'Status OTF', 'Nominal OTF'];
        var csv = cols.map(csvCell).join(',') + '\n';
        rows.forEach(function(p){
          var otf = otfMap[p.id];
          var line = [
            p.cid, p.nama, p.alamat, areaById[p.area_id] || p.area_coverage || '', p.kecamatan, p.kelurahan, p.rw, p.rt,
            p.paket, p.status, p.tgl_pasang, p.teknisi_pasang, p.sn_ont,
            otf ? otf.status : 'belum ada tagihan OTF', otf ? otf.nominal : '',
          ].map(csvCell).join(',');
          csv += line + '\n';
        });

        var fileName = 'pelanggan_export_' + new Date().toISOString().slice(0, 10) + '.csv';
        if (typeof _ieDownloadBlob === 'function') _ieDownloadBlob(csv, fileName, 'text/csv');
        else { // jaga-jaga kalau helper belum ke-load, unduh manual dengan cara yang sama
          var blob = new Blob([csv], { type: 'text/csv' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName;
          document.body.appendChild(a); a.click(); a.remove();
        }

        if (typeof toast === 'function') toast('✅ ' + rows.length + ' pelanggan berhasil di-export', 'ok');
        if (typeof _ieAddLog === 'function') _ieAddLog('Export', 'Data Pelanggan (sesuai filter)', rows.length + ' baris');
        if (window.ProgUI) ProgUI.success(rows.length + ' baris pelanggan berhasil di-export');
      }).catch(function(){
        if (typeof toast === 'function') toast('Gagal melengkapi data OTF, export dibatalkan', 'err');
        if (window.ProgUI) ProgUI.error('Gagal mengambil data OTF');
      });
    }).catch(function(e){
      if (typeof toast === 'function') toast('Error: ' + (e.message || 'coba lagi'), 'err');
      if (window.ProgUI) ProgUI.error('Error: ' + (e.message || 'coba lagi'));
    });
  };

})();
