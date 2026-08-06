/* =====================================================================
   PATCH 31 — PERBAIKAN AKAR MASALAH: APP MACET SAAT AKTIFKAN MASSAL
   ---------------------------------------------------------------------
   TEMUAN AUDIT:
   1) Dulu window.monLoad() adalah fungsi KOSONG (bug lama, sudah
      diperbaiki di patch 25) — jadi walau realtime "banjir" notifikasi
      saat reaktivasi massal, tidak ada dampak nyata karena monLoad
      tidak melakukan apa-apa.
   2) Sekarang monLoad() SUDAH BENAR dan memang seharusnya begitu, TAPI
      ini artinya: kalau ratusan notifikasi perubahan pelanggan datang
      hampir bersamaan (misal habis "Aktifkan Semua Suspend/Cabut"),
      Halaman Monitoring & Ringkasan Owner ikut mencoba REFRESH ULANG
      PENUH berkali-kali dalam waktu singkat.
   3) Akar masalah sebenarnya ada di fungsi inti "SOT.refresh" (dipakai
      Monitoring, Ringkasan Owner, Dashboard Finance, Data Pelanggan) —
      fungsi ini TIDAK PUNYA PENGAMAN: kalau dipanggil 200x dalam
      beberapa detik, dia akan benar-benar menjalankan 200x pengambilan
      data PENUH dari server secara bertumpuk (tidak menunggu yang
      sebelumnya selesai). Inilah yang bikin SELURUH app macet — bukan
      cuma Monitoring, tapi semua halaman yang memakai data yang sama.

   PERBAIKAN (di file ini saja, TIDAK mengedit file manapun yang lain):
   SOT.refresh() dibungkus dengan "antrian satu-pintu" — kalau ada
   proses refresh yang MASIH BERJALAN, panggilan baru tidak memicu
   pengambilan data baru, cukup "menumpang" menunggu hasil yang sedang
   diproses. Begitu proses yang berjalan selesai DAN ada panggilan baru
   yang sempat masuk selagi sibuk, baru dijalankan SATU KALI refresh
   susulan (bukan satu-satu per notifikasi). Efeknya: mau ada 5 atau
   500 notifikasi datang beruntun, yang benar-benar diproses ke server
   tetap cuma beberapa kali, bukan ratusan kali.

   TIDAK ADA perubahan data, aturan bisnis, atau tampilan apapun.
   Murni perbaikan performa/kestabilan pada satu titik pusat yang
   dipakai bersama oleh Monitoring, Ringkasan Owner, Finance, dan
   Data Pelanggan.
===================================================================== */
(function(){
  'use strict';

  if (typeof window.SOT === 'undefined' || typeof SOT.refresh !== 'function'){
    console.warn('[Patch 31] SOT.refresh tidak ditemukan — perbaikan dilewati.');
    return;
  }

  var _origSOTRefreshGuarded = SOT.refresh.bind(SOT);
  var _sotBusy = false;
  var _sotQueuedCbs = [];
  var _sotQueuedForce = false;
  var _sotHasQueued = false;

  function runRefresh(){
    _sotBusy = true;
    var force = _sotQueuedForce;
    var cbs = _sotQueuedCbs;
    _sotQueuedCbs = [];
    _sotQueuedForce = false;
    _sotHasQueued = false;

    _origSOTRefreshGuarded(force, function(c){
      cbs.forEach(function(fn){ try{ if (fn) fn(c); }catch(e){ console.error('[Patch 31] callback error', e); } });
      _sotBusy = false;
      // Kalau selagi kita sibuk tadi ada panggilan BARU yang masuk,
      // jalankan SATU KALI LAGI supaya data yang ditampilkan tetap
      // ter-update — tapi tidak dobel-dobel seperti sebelumnya.
      if (_sotHasQueued) runRefresh();
    });
  }

  SOT.refresh = function(force, cb){
    if (cb) _sotQueuedCbs.push(cb);
    if (force) _sotQueuedForce = true;

    if (_sotBusy){
      _sotHasQueued = true; // cukup menumpang antrian, tidak memicu fetch baru
      return;
    }
    runRefresh();
  };

})();
