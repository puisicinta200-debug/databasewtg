/* =====================================================================
   PATCH 26 — REDAM DOBEL-LOAD MODUL FINANCE (OTF & RECURRING)
   ---------------------------------------------------------------------
   File ini TIDAK mengedit js/03-app-core.js sama sekali. Fungsi asli
   otfLoad() dan recLoad() dibiarkan 100% seperti semula — file ini
   cuma "membungkus" pemanggilannya.

   TEMUAN AUDIT:
   Setiap kali ada perubahan di tabel fee_otf / fee_recurring (approve,
   simpan, hapus, dll), ADA 2 SUMBER yang sama-sama memanggil otfLoad()/
   recLoad() untuk muat ulang SEMUA data dari server:
     1) Aksi itu sendiri (mis. setelah approve/simpan) memanggil
        otfLoad()/recLoad() secara eksplisit.
     2) Sistem "realtime" aplikasi ini mendeteksi perubahan yang SAMA
        di database, lalu ikut memanggil otfLoad()/recLoad() lagi —
        tanpa jeda sama sekali (tidak seperti tabel 'pelanggan' yang
        sudah diberi jeda/debounce).
   Akibatnya: 1 kali approve = 2 (atau lebih, kalau menu "Realtime Sync"
   pernah dinyalakan manual) kali download ULANG seluruh data. Ini yang
   bikin terasa lambat, boros kuota, kadang force-close di HP, dan bikin
   tampilan sempat "seperti balik ke data lama" sebelum akhirnya benar
   lagi (race antara reload pertama & kedua).

   PERBAIKAN:
   otfLoad() dan recLoad() dibungkus dengan "peredam" — kalau dipanggil
   berkali-kali dalam waktu singkat (misalnya oleh 2 sumber di atas),
   yang benar-benar jalan cuma SATU KALI. Panggilan PERTAMA tetap
   langsung jalan (supaya buka halaman tetap terasa cepat seperti
   biasa), panggilan-panggilan berikutnya dalam ~1.2 detik digabung
   jadi 1 panggilan susulan saja.

   TIDAK ADA perubahan skema/kolom database.
   TIDAK ADA perubahan pada proses konfirmasi/validasi finance itu
   sendiri (approve/reject tetap sama persis seperti sebelumnya).
===================================================================== */
(function(){
  'use strict';

  var WTG_LOADER_JEDA_MS = 1200;

  // "Peredam": panggilan pertama langsung jalan; panggilan susulan yang
  // datang dalam jeda waktu tertentu digabung jadi 1 panggilan terakhir.
  function _wtgPeredamLoader(fn, jedaMs, label){
    var terakhirJalan = 0;
    var timer = null;
    var adaPending = false;

    return function(){
      var now = Date.now();
      var sisaWaktu = jedaMs - (now - terakhirJalan);

      if(sisaWaktu <= 0){
        terakhirJalan = now;
        try{ fn(); }catch(e){ console.error('['+label+']', e); }
      } else {
        adaPending = true;
        if(timer) clearTimeout(timer);
        timer = setTimeout(function(){
          if(adaPending){
            adaPending = false;
            terakhirJalan = Date.now();
            try{ fn(); }catch(e){ console.error('['+label+']', e); }
          }
        }, sisaWaktu);
      }
    };
  }

  function pasangPeredam(namaFungsi){
    var asli = window[namaFungsi];
    if(typeof asli !== 'function' || asli._wtgPeredam) return;
    var terbungkus = _wtgPeredamLoader(asli, WTG_LOADER_JEDA_MS, namaFungsi);
    terbungkus._wtgPeredam = true;
    window[namaFungsi] = terbungkus;
  }

  pasangPeredam('otfLoad');
  pasangPeredam('recLoad');

  /* ===================================================================
     TAMBAHAN: batasi jumlah ID per-request saat "Cocokkan dengan file
     ISP" (CSV) di-konfirmasi. Fungsi asli (valIspKonfirmasi) mengirim
     SEMUA baris yang cocok dalam 1 kali update — kalau CSV-nya besar
     (ratusan baris), ini bisa gagal "Bad Request" persis seperti bug
     yang sudah diperbaiki di fitur reaktivasi pelanggan. Di sini
     dipecah jadi batch kecil + jeda, TANPA mengubah cara pencocokan
     atau aturan validasinya sama sekali — cuma cara kirimnya ke server.
  =================================================================== */
  var WTG_VAL_BATCH_SIZE = 50;
  var WTG_VAL_BATCH_DELAY_MS = 500;

  function _wtgBatchUpdateStatus(sb, table, ids, payload, onDone){
    var ok = 0, gagal = 0;
    var chunks = [];
    for(var i=0; i<ids.length; i+=WTG_VAL_BATCH_SIZE){ chunks.push(ids.slice(i, i+WTG_VAL_BATCH_SIZE)); }
    function jalan(idx){
      if(idx >= chunks.length){ onDone(ok, gagal); return; }
      sb.from(table).update(payload).in('id', chunks[idx]).then(function(r){
        if(r && r.error) gagal += chunks[idx].length; else ok += chunks[idx].length;
        setTimeout(function(){ jalan(idx+1); }, WTG_VAL_BATCH_DELAY_MS);
      }).catch(function(){
        gagal += chunks[idx].length;
        setTimeout(function(){ jalan(idx+1); }, WTG_VAL_BATCH_DELAY_MS);
      });
    }
    jalan(0);
  }

  var _origValIspKonfirmasi = window.valIspKonfirmasi;
  if(typeof _origValIspKonfirmasi === 'function' && !_origValIspKonfirmasi._wtgBatched){
    window.valIspKonfirmasi = function(){
      var matched = window._valIspMatched || [];
      if(!matched.length){ if(typeof toast === 'function') toast('Tidak ada yang perlu dikonfirmasi', 'err'); return; }
      var eligible = matched.filter(function(o){ return (o.nominal||0) > 0; });
      if(!eligible.length){ if(typeof toast === 'function') toast('Tidak ada '+(typeof _valLabel==='function'?_valLabel():'data')+' dengan nominal valid', 'err'); return; }

      // Untuk jumlah kecil (di bawah 1 batch), pakai fungsi asli persis
      // seperti biasa — supaya tidak ada risiko perubahan perilaku untuk
      // kasus yang paling umum/normal sehari-hari.
      if(eligible.length <= WTG_VAL_BATCH_SIZE){
        _origValIspKonfirmasi();
        return;
      }

      var sb = typeof getSB === 'function' ? getSB() : null;
      if(!sb){ if(typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }
      var table = typeof _valTable === 'function' ? _valTable() : 'fee_otf';
      var ids = eligible.map(function(o){ return o.id; });

      if(typeof toast === 'function') toast('⏳ Mengonfirmasi '+ids.length+' data, mohon tunggu…', 'ok');

      _wtgBatchUpdateStatus(sb, table, ids, {status:'siap_bayar'}, function(ok, gagal){
        eligible.forEach(function(o){ o.status = 'siap_bayar'; });
        if(ok && !gagal){
          if(typeof toast === 'function') toast(ok+' '+(typeof _valLabel==='function'?_valLabel():'data')+' → Siap Bayar ✓', 'ok');
        } else if(ok && gagal){
          if(typeof toast === 'function') toast(ok+' berhasil, '+gagal+' gagal — coba ulangi untuk sisanya', 'err');
        } else {
          if(typeof toast === 'function') toast('Gagal mengonfirmasi, coba lagi', 'err');
        }
        var hasil = document.getElementById('val-isp-result'); if(hasil) hasil.innerHTML = '';
        var csvInput = document.getElementById('val-isp-csv'); if(csvInput) csvInput.value = '';
        window._valIspMatched = [];
        if(typeof valRender === 'function') valRender();
        if(typeof _valRefreshSource === 'function') _valRefreshSource();
      });
    };
    window.valIspKonfirmasi._wtgBatched = true;
  }

})();
