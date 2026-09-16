/* =====================================================================
   FILE INI GABUNGAN 2 TOPIK YANG BELUM PUNYA "RUMAH" DI FILE MANAPUN:
   1) Performa loading Finance (Fee OTF & Fee Recurring)
   2) Auto-buat ODP saat ODC dibuat + perbaikan dropdown pilih ODC
   Digabung 1 file supaya tidak menambah banyak file baru — dua topik
   ini memang belum ada file khusus sebelumnya di project ini.
===================================================================== */
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

  function _wtgBatchUpdateStatus(sb, table, ids, payload, onDone, progOpts){
    var ok = 0, gagal = 0;
    var chunks = [];
    for(var i=0; i<ids.length; i+=WTG_VAL_BATCH_SIZE){ chunks.push(ids.slice(i, i+WTG_VAL_BATCH_SIZE)); }
    var pakaiProg = progOpts && window.ProgUI;
    function jalan(idx){
      if(idx >= chunks.length){
        if(pakaiProg){
          if(gagal) ProgUI.error(ok+' berhasil, '+gagal+' gagal — coba ulangi untuk sisanya');
          else ProgUI.success((progOpts.doneTitle||'Selesai')+' — '+ok+' data', 1400);
        }
        onDone(ok, gagal);
        return;
      }
      if(pakaiProg) ProgUI.step((progOpts.stepLabel||'Mengonfirmasi')+' batch '+(idx+1)+'/'+chunks.length, idx, chunks.length);
      sb.from(table).update(payload).in('id', chunks[idx]).then(function(r){
        if(r && r.error) gagal += chunks[idx].length; else ok += chunks[idx].length;
        if(pakaiProg) ProgUI.step(null, idx+1, chunks.length);
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
      if(window.ProgUI){
        ProgUI.open({ title:'Konfirmasi '+ids.length+' Data', step:'Mempersiapkan…', total: ids.length });
      }

      _wtgBatchUpdateStatus(sb, table, ids, {status:'siap_bayar'}, function(ok, gagal){
        eligible.forEach(function(o){ o.status = 'siap_bayar'; });
        if(!window.ProgUI){
          if(ok && !gagal){
            if(typeof toast === 'function') toast(ok+' '+(typeof _valLabel==='function'?_valLabel():'data')+' → Siap Bayar ✓', 'ok');
          } else if(ok && gagal){
            if(typeof toast === 'function') toast(ok+' berhasil, '+gagal+' gagal — coba ulangi untuk sisanya', 'err');
          } else {
            if(typeof toast === 'function') toast('Gagal mengonfirmasi, coba lagi', 'err');
          }
        }
        var hasil = document.getElementById('val-isp-result'); if(hasil) hasil.innerHTML = '';
        var csvInput = document.getElementById('val-isp-csv'); if(csvInput) csvInput.value = '';
        window._valIspMatched = [];
        if(typeof valRender === 'function') valRender();
        if(typeof _valRefreshSource === 'function') _valRefreshSource();
      }, { stepLabel:'Mengonfirmasi data', doneTitle:'Konfirmasi selesai' });
    };
    window.valIspKonfirmasi._wtgBatched = true;
  }

})();


/* =====================================================================
   PATCH 32 — FITUR BARU: AUTO-BUAT ODP SAAT ODC DIBUAT
   ---------------------------------------------------------------------
   File ini TIDAK mengedit js/03-app-core.js. Fungsi asli odcSave(),
   odcOpenForm(), odcRender(), dan odpSave() dibiarkan 100% seperti
   semula — file ini cuma "menumpang" di titik-titik itu.

   CARA KERJA:
   1) Saat membuka form "Tambah ODC" (bukan Edit), muncul 1 pilihan
      baru: "Buat ODP otomatis?" — bisa pilih Tidak / 1 / 2 / 3 / 4.
      Defaultnya 4.
   2) Begitu ODC berhasil disimpan, sistem otomatis membuat sejumlah
      ODP yang dipilih tadi, langsung terhubung ke ODC tersebut
      (kode contoh: ODC-01-ODP-01, ODC-01-ODP-02, dst), lengkap dengan
      daftar port kosongnya — PERSIS seperti kalau dibuat manual satu
      per satu lewat menu ODP.
   3) ODP hasil otomatis ini adalah ODP BIASA — tetap bisa dibuka,
      diedit, diganti kode/lokasi/status/jumlah port-nya kapan saja
      lewat menu ODP seperti biasa. Tidak ada perbedaan/pembatasan
      apapun dibanding ODP yang dibuat manual.
   4) Kalau user pilih "Tidak" (0), tidak ada yang berubah — ODC
      dibuat seperti biasa tanpa ODP otomatis, sama seperti sebelumnya.

   TIDAK ADA perubahan pada proses simpan ODC/ODP yang sudah ada,
   TIDAK ADA perubahan skema/kolom database — hanya menambahkan baris
   data baru dengan cara yang PERSIS SAMA seperti simpan manual biasa.
===================================================================== */
(function(){
  'use strict';

  var DEFAULT_JUMLAH = 4;

  /* ================= 1) UI: pilihan jumlah ODP otomatis di form ODC ================= */
  function ensureAutoOdpField(){
    if (document.getElementById('odcf-auto-odp-wrap')) return;
    var saveBtn = document.getElementById('odcf-save-btn');
    if (!saveBtn || !saveBtn.parentNode) return;

    var wrap = document.createElement('div');
    wrap.id = 'odcf-auto-odp-wrap';
    wrap.className = 'form-group';
    wrap.style.marginBottom = '12px';
    wrap.innerHTML =
      '<label class="form-lbl"><i class="ti ti-sitemap"></i> Buat ODP Otomatis?</label>' +
      '<select class="sel inp" id="odcf-auto-odp">' +
        '<option value="0">Tidak, saya buat ODP manual nanti</option>' +
        '<option value="1">1 ODP</option>' +
        '<option value="2">2 ODP</option>' +
        '<option value="3">3 ODP</option>' +
        '<option value="4" selected>4 ODP</option>' +
      '</select>' +
      '<div style="font-size:10.5px;color:var(--text3);margin-top:4px">ODP yang dibuat otomatis tetap bisa diedit kapan saja lewat menu ODP.</div>';

    saveBtn.parentNode.insertBefore(wrap, saveBtn);
  }

  var _origOdcOpenForm = window.odcOpenForm;
  window.odcOpenForm = function(data){
    if (typeof _origOdcOpenForm === 'function') _origOdcOpenForm(data);
    ensureAutoOdpField();
    var wrap = document.getElementById('odcf-auto-odp-wrap');
    var sel = document.getElementById('odcf-auto-odp');
    var isEdit = !!data;
    if (wrap) wrap.style.display = isEdit ? 'none' : 'block';
    if (sel && !isEdit) sel.value = String(DEFAULT_JUMLAH);
  };

  /* ================= 2) Tangkap niat user SEBELUM simpan ================= */
  var _pendingAutoOdp = null; // { kode, jumlah } | null

  var _origOdcSave = window.odcSave;
  window.odcSave = function(){
    var isEdit = !!((document.getElementById('odcf-id') || {}).value);
    if (!isEdit){
      var kode = ((document.getElementById('odcf-kode') || {}).value || '').trim().toUpperCase();
      var selEl = document.getElementById('odcf-auto-odp');
      var jumlah = selEl ? (parseInt(selEl.value) || 0) : 0;
      _pendingAutoOdp = jumlah > 0 ? { kode: kode, jumlah: jumlah } : null;
    } else {
      _pendingAutoOdp = null; // edit ODC tidak pernah memicu auto-buat ODP
    }
    if (typeof _origOdcSave === 'function') _origOdcSave();
  };

  /* ================= 3) Begitu daftar ODC selesai dimuat ulang, cari ODC baru & buatkan ODP ================= */
  var _origOdcRender = window.odcRender;
  window.odcRender = function(){
    if (typeof _origOdcRender === 'function') _origOdcRender();
    if (!_pendingAutoOdp) return;
    var target = _pendingAutoOdp; _pendingAutoOdp = null;

    // odcLoad() mengambil data terurut created_at TERBARU DULU, jadi ODC
    // yang baru saja disimpan selalu berada di indeks paling awal.
    var list = window._odcData || [];
    var odc = list.find(function(o){ return o.kode === target.kode; }) || list[0];
    if (!odc || odc.kode !== target.kode) return;

    buatOdpOtomatis(odc, target.jumlah);
  };

  /* ================= 4) Pembuat ODP otomatis (memakai logika & kolom PERSIS sama seperti odpSave) ================= */
  function pad2(n){ return n < 10 ? '0' + n : '' + n; }

  function buatOdpOtomatis(odc, jumlah){
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ if (typeof toast === 'function') toast('Database tidak terhubung — ODP otomatis dibatalkan, silakan buat manual', 'err'); return; }

    var payloads = [];
    for (var i = 1; i <= jumlah; i++){
      var kode = odc.kode + '-ODP-' + pad2(i);
      payloads.push({
        kode: kode, nama: kode,
        area_id: odc.area_id, odc_id: odc.id, odc_port_no: i,
        lokasi: odc.lokasi || '', type: 'aerial', jumlah_port: 8, status: 'aktif',
        lat: odc.lat || null, lng: odc.lng || null,
        keterangan: 'Dibuat otomatis bersama ODC ' + odc.kode,
      });
    }

    sb.from('odps').insert(payloads).select('id,jumlah_port').then(function(r){
      if (r.error){
        if (typeof toast === 'function') toast('ODC tersimpan, tapi ODP otomatis gagal dibuat: ' + (r.error.message || 'coba buat manual') , 'err');
        return;
      }
      var created = r.data || [];

      // Buat juga daftar port kosong untuk tiap ODP baru — PERSIS seperti
      // yang dilakukan odpSave() untuk ODP yang dibuat manual.
      var portInserts = [];
      created.forEach(function(o){
        for (var p = 1; p <= (o.jumlah_port || 8); p++) portInserts.push({ odp_id: o.id, nomor_port: p, status: 'kosong' });
      });
      if (portInserts.length){
        sb.from('odp_ports').upsert(portInserts, { onConflict: 'odp_id,nomor_port', ignoreDuplicates: true }).catch(function(){});
      }

      if (typeof toast === 'function') toast('✅ ' + created.length + ' ODP otomatis dibuat untuk ODC ' + odc.kode + ' — bisa diedit kapan saja', 'ok');
      if (window.SOT && typeof SOT.invalidate === 'function') SOT.invalidate('general');
      if (typeof window._odpLoaded !== 'undefined') window._odpLoaded = false;
      if (typeof odpLoad === 'function') odpLoad();
    }).catch(function(e){
      if (typeof toast === 'function') toast('ODC tersimpan, tapi ODP otomatis gagal dibuat: ' + (e.message || 'coba buat manual'), 'err');
    });
  }

})();
/* =====================================================================
   PATCH 33 — PERBAIKAN TAMPILAN DROPDOWN "PILIH ODC" DI FORM ODP
   ---------------------------------------------------------------------
   TEMUAN AUDIT (bug lama, sudah ada sebelum patch-patch saya):
   Di kode asli (_odpFillOdcDropdown, 03-app-core.js), teks tiap pilihan
   ODC dibangun begini:
       o.kode + (o.nama ? ' — '+o.nama : '') + ' [Port: ?/'+jumlah+']'
   Ada 2 masalah:
   1) Kolom "nama" ODC MEMANG SELALU SAMA PERSIS dengan "kode" (ini
      memang didesain begitu di seluruh app) — jadi baris di atas akan
      SELALU menampilkan tulisan yang sama dua kali, contoh:
      "W1_CBD_JJC.JKBN_012 — W1_CBD_JJC.JKBN_012" — makanya terlihat
      seperti dobel. Ini murni soal TAMPILAN, datanya sendiri tidak
      dobel/rusak.
   2) Angka port terpakai memang HARDCODE tanda tanya "?" — sepertinya
      memang belum sempat diisi angka sungguhan oleh penulis kode
      aslinya, jadi selalu tampil "?" untuk semua ODC.

   PERBAIKAN DI FILE INI (murni tampilan, tidak mengubah data/aturan):
   - Nama ODC yang dobel dihilangkan (cukup tampilkan kode 1x).
   - "?" diganti angka port yang BENERAN terpakai, dihitung dari
     jumlah ODP yang sudah terhubung ke ODC tersebut.
===================================================================== */
(function(){
  'use strict';

  var _origOdpFillOdcDropdown = window._odpFillOdcDropdown;
  if (typeof _origOdpFillOdcDropdown !== 'function') return;

  window._odpFillOdcDropdown = function(selId, currentVal, areaId){
    var sel = document.getElementById(selId);
    if (!sel) return;
    var cur = currentVal || sel.value;

    if (!areaId){
      sel.innerHTML = '<option value="">— Pilih Area dulu —</option>';
      sel.disabled = true;
      if (typeof _odpSetOdcHint === 'function') _odpSetOdcHint(0, '');
      return;
    }

    var list = (window._odcData || []).filter(function(o){ return o.area_id === areaId; });
    list.sort(function(a, b){ return (a.kode || '').localeCompare(b.kode || ''); });

    var areaNama = ((window._areaData || []).find(function(a){ return a.id === areaId; }) || {}).nama || '';

    if (!list.length){
      sel.innerHTML = '<option value="">— Tidak ada ODC di area ini —</option>';
      sel.disabled = true;
      if (typeof _odpSetOdcHint === 'function') _odpSetOdcHint(0, areaNama);
      return;
    }

    sel.disabled = false;
    sel.innerHTML = '<option value="">— Pilih ODC (' + list.length + ' tersedia) —</option>';
    list.forEach(function(o){
      var opt = document.createElement('option');
      opt.value = o.id;

      // Hitung port ODC yang BENERAN sudah terpakai (= jumlah ODP yang
      // sudah terhubung ke ODC ini), bukan tanda tanya lagi.
      var terpakai = (window._odpData || []).filter(function(p){ return p.odc_id === o.id; }).length;
      var portInfo = o.jumlah_port ? (' [Port: ' + terpakai + '/' + o.jumlah_port + ']') : '';

      opt.textContent = o.kode + portInfo + (o.status === 'aktif' ? '' : ' ⚠');
      if (o.id === cur) opt.selected = true;
      sel.appendChild(opt);
    });
    if (typeof _odpSetOdcHint === 'function') _odpSetOdcHint(list.length, areaNama);
  };

})();


/* =====================================================================
   FITUR BARU — FILTER KAPASITAS & MULTI-AREA UNTUK MASTER ODC & ODP
   ---------------------------------------------------------------------
   TIDAK mengedit js/03-app-core.js. Fungsi odcRender()/odpRender() asli
   di-timpa dengan versi yang PERSIS SAMA logikanya, hanya ditambah 2
   kriteria filter baru di bagian akhir (kapasitas & multi-area) —
   pencarian, filter status, filter OLT/ODC yang sudah ada TIDAK diubah
   sama sekali.

   FITUR:
   1) Filter "Kapasitas" — Kosong / Isi (Belum Penuh) / Penuh.
      Bisa pilih salah satu, beberapa, atau semua (kalau tidak pilih
      sama sekali = tampilkan semua, tidak difilter).
        - Kosong        = belum ada yang terpasang sama sekali
        - Isi (Belum Penuh) = sudah ada isinya tapi masih ada slot kosong
        - Penuh         = sudah maksimal, tidak ada slot tersisa
   2) Filter "Area" jadi bisa pilih LEBIH DARI SATU sekaligus (sebelumnya
      cuma bisa 1 area atau semua). Bisa pilih 1 area, beberapa area,
      atau semua area.
   Berlaku di halaman Master ODC dan Master ODP.
===================================================================== */
(function(){
  'use strict';

  /* ================= state pilihan filter (per halaman) ================= */
  /* ================= state pilihan filter kapasitas (per halaman) ================= */
  var state = {
    odc: { kap: new Set() },
    odp: { kap: new Set() },
  };
  // CATATAN AUDIT: filter "Area" versi saya SEBELUMNYA dihapus di sini —
  // ternyata dobel dengan filter Area yang MEMANG SUDAH ADA bawaan di
  // halaman Master ODC/ODP (dropdown "Semua Area"). Sekarang HANYA ada
  // 1 filter Area (yang bawaan), tidak ada duplikasi lagi.

  var KAP_OPTIONS = [
    ['kosong', 'Kosong (belum ada isi)', 'var(--green)'],
    ['isi', 'Isi (Belum Penuh)', 'var(--yellow)'],
    ['penuh', 'Full (sudah penuh)', 'var(--red)'],
  ];

  /* ================= hitung status kapasitas ================= */
  function odcCapClass(o){
    var usedOdp = (window._odpData || []).filter(function(p){ return p.odc_id === o.id; }).length;
    var cap = parseInt(o.jumlah_port) || 0;
    if (usedOdp <= 0) return 'kosong';
    if (cap > 0 && usedOdp >= cap) return 'penuh';
    return 'isi';
  }
  function odpCapClass(o){
    var used = 0, total = parseInt(o.jumlah_port) || 0;
    if (typeof SOT !== 'undefined' && typeof SOT.odpStats === 'function'){
      var ps = SOT.odpStats(o.id);
      used = ps.used || 0; total = ps.total || total;
    } else if (window.SOT && typeof SOT.cache === 'function'){
      var ports = (SOT.cache().ports || []).filter(function(p){ return p.odp_id === o.id; });
      used = ports.filter(function(p){ return p.status === 'terpakai'; }).length;
    }
    if (used <= 0) return 'kosong';
    if (total > 0 && used >= total) return 'penuh';
    return 'isi';
  }

  /* =====================================================================
     FILTER KAPASITAS — dipindah jadi BOTTOM SHEET (bukan dropdown kecil)
     ---------------------------------------------------------------------
     PERBAIKAN AUDIT: versi sebelumnya pakai kotak kecil yang muncul di
     bawah tombol (position:absolute) — ternyata KEPOTONG/tidak kelihatan
     karena kotak filternya ada di dalam area yang bisa di-scroll ke
     samping (overflow-x). Sekarang pakai tampilan geser-dari-bawah yang
     SAMA seperti fitur "Rapikan Kode" — dijamin selalu kelihatan & bisa
     diklik di layar manapun.
  ===================================================================== */
  function ensureKapasitasCSS(){
    if (document.getElementById('wtg-kap-css')) return;
    var st = document.createElement('style');
    st.id = 'wtg-kap-css';
    st.textContent =
      '.wtg-kap-opt{display:flex;align-items:center;gap:10px;padding:13px 6px;border-bottom:1px solid var(--border);cursor:pointer;font-size:13px;color:var(--text)}' +
      '.wtg-kap-opt input{width:18px;height:18px;flex-shrink:0}';
    document.head.appendChild(st);
  }

  function bukaSheetKapasitas(page){
    ensureKapasitasCSS();
    var existing = document.getElementById('wtg-kap-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'wtg-kap-overlay';
    overlay.className = 'olt-overlay on';
    overlay.onclick = function(e){ if (e.target === overlay) overlay.remove(); };

    var selectedSet = state[page].kap;
    var optsHtml = KAP_OPTIONS.map(function(opt){
      var val = opt[0], lbl = opt[1], col = opt[2];
      return '<label class="wtg-kap-opt">' +
        '<input type="checkbox" data-val="' + val + '" ' + (selectedSet.has(val) ? 'checked' : '') + '>' +
        '<span style="width:9px;height:9px;border-radius:50%;background:' + col + ';flex-shrink:0"></span>' +
        '<span>' + lbl + '</span>' +
      '</label>';
    }).join('');

    overlay.innerHTML =
      '<div class="olt-sheet">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)">' +
          '<div style="font-size:13px;font-weight:800;color:var(--text)">Filter Kapasitas Real-time</div>' +
          '<button onclick="document.getElementById(\'wtg-kap-overlay\').remove()" style="width:30px;height:30px;border-radius:9px;background:var(--bg3);border:none;cursor:pointer"><i class="ti ti-x"></i></button>' +
        '</div>' +
        '<div class="olt-sheet-body">' +
          '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">Pilih salah satu, beberapa, atau kosongkan semua untuk menampilkan semuanya.</div>' +
          '<div id="wtg-kap-opts">' + optsHtml + '</div>' +
          '<button id="wtg-kap-terapkan" style="width:100%;margin-top:16px;padding:13px;border-radius:12px;border:none;background:var(--c1);color:#fff;font-weight:700;font-size:13px;cursor:pointer">Terapkan</button>' +
          '<button id="wtg-kap-reset" style="width:100%;margin-top:8px;padding:11px;border-radius:12px;border:1.5px solid var(--border2);background:var(--bg2);color:var(--text2);font-weight:700;font-size:12px;cursor:pointer">Bersihkan Filter</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelectorAll('#wtg-kap-opts input').forEach(function(inp){
      inp.addEventListener('change', function(){
        if (inp.checked) selectedSet.add(inp.dataset.val); else selectedSet.delete(inp.dataset.val);
      });
    });
    document.getElementById('wtg-kap-terapkan').onclick = function(){
      overlay.remove();
      updateKapButtonLabel(page);
      window[page + 'Render']();
    };
    document.getElementById('wtg-kap-reset').onclick = function(){
      selectedSet.clear();
      overlay.remove();
      updateKapButtonLabel(page);
      window[page + 'Render']();
    };
  }

  function updateKapButtonLabel(page){
    var btn = document.getElementById('wtg-' + page + '-kap-btn');
    if (!btn) return;
    var n = state[page].kap.size;
    btn.innerHTML = 'Kapasitas Real-time: <b style="color:var(--c1)">' + (n === 0 ? 'Semua' : n + ' dipilih') + '</b> <i class="ti ti-chevron-down" style="font-size:12px"></i>';
  }

  function ensureFilterUI(page){
    if (document.getElementById('wtg-' + page + '-kap-btn')) return;
    var anchor = page === 'odc' ? document.querySelector('#odc-fil-olt') : document.querySelector('#odp-fil-odc');
    if (!anchor || !anchor.parentNode) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'wtg-' + page + '-kap-btn';
    btn.className = 'sel olt-fil-sel';
    btn.style.flexShrink = '0';
    btn.onclick = function(){ bukaSheetKapasitas(page); };
    anchor.parentNode.insertBefore(btn, anchor.nextSibling);
    updateKapButtonLabel(page);
  }

  /* ================= override odcRender (logika ASLI + 2 kriteria baru) ================= */
  window.odcRender = function(){
    ensureFilterUI('odc');

    var q   = (document.getElementById('odc-search') || {}).value || '';
    var fSt = (document.getElementById('odc-fil-status') || {}).value || '';
    var fAr = (document.getElementById('odc-fil-area') || {}).value || '';
    var fOl = (document.getElementById('odc-fil-olt') || {}).value || '';
    q = q.toLowerCase().trim();
    var kapSet = state.odc.kap;

    _odcFil = _odcData.filter(function(o){
      var matchQ  = !q || (o.nama || '').toLowerCase().includes(q) || (o.kode || '').toLowerCase().includes(q) || (o.lokasi || '').toLowerCase().includes(q);
      var matchSt = !fSt || o.status === fSt;
      var matchAr = !fAr || o.area_id === fAr;
      var matchOl = !fOl || o.olt_id === fOl;
      var matchKap = !kapSet.size || kapSet.has(odcCapClass(o));
      return matchQ && matchSt && matchAr && matchOl && matchKap;
    });

    if (typeof odcUpdateStats === 'function') odcUpdateStats();

    var total = _odcFil.length;
    var pages = Math.max(1, Math.ceil(total / _odcPerPg));
    if (_odcPage > pages) _odcPage = pages;
    var start = (_odcPage - 1) * _odcPerPg;
    var slice = _odcFil.slice(start, start + _odcPerPg);

    var list = document.getElementById('odc-list');
    if (!list) return;

    if (!total){
      list.innerHTML = '<div class="olt-empty"><i class="ti ti-box-off"></i><p>Tidak ada data ODC</p><small>Coba ubah filter atau tambah ODC baru</small></div>';
      document.getElementById('odc-pagi').style.display = 'none';
      return;
    }

    list.innerHTML = slice.map(function(o){ return odcRowHTML(o); }).join('');

    var pagi = document.getElementById('odc-pagi');
    var prev = document.getElementById('odc-prev');
    var next = document.getElementById('odc-next');
    var info = document.getElementById('odc-pagi-info');
    if (pages > 1){
      pagi.style.display = 'flex';
      if (prev) prev.disabled = _odcPage <= 1;
      if (next) next.disabled = _odcPage >= pages;
      if (info) info.textContent = _odcPage + ' / ' + pages;
    } else { pagi.style.display = 'none'; }
  };

  /* ================= override odpRender (logika ASLI + 2 kriteria baru) ================= */
  window.odpRender = function(){
    ensureFilterUI('odp');

    var q   = (document.getElementById('odp-search') || {}).value || '';
    var fSt = (document.getElementById('odp-fil-status') || {}).value || '';
    var fAr = (document.getElementById('odp-fil-area') || {}).value || '';
    var fOc = (document.getElementById('odp-fil-odc') || {}).value || '';
    q = q.toLowerCase().trim();
    var kapSet = state.odp.kap;

    _odpFil = _odpData.filter(function(o){
      var matchQ  = !q || (o.nama || '').toLowerCase().includes(q) || (o.kode || '').toLowerCase().includes(q) || (o.lokasi || '').toLowerCase().includes(q);
      var matchSt = !fSt || o.status === fSt;
      var matchAr = !fAr || o.area_id === fAr;
      var matchOc = !fOc || o.odc_id === fOc;
      var matchKap = !kapSet.size || kapSet.has(odpCapClass(o));
      return matchQ && matchSt && matchAr && matchOc && matchKap;
    });

    if (typeof odpUpdateStats === 'function') odpUpdateStats();

    var total = _odpFil.length;
    var pages = Math.max(1, Math.ceil(total / _odpPerPg));
    if (_odpPage > pages) _odpPage = pages;
    var start = (_odpPage - 1) * _odpPerPg;
    var slice = _odpFil.slice(start, start + _odpPerPg);

    var list = document.getElementById('odp-list');
    if (!list) return;

    if (!total){
      list.innerHTML = '<div class="olt-empty"><i class="ti ti-plug-x"></i><p>Tidak ada data ODP</p><small>Coba ubah filter atau tambah ODP baru</small></div>';
      document.getElementById('odp-pagi').style.display = 'none';
      return;
    }

    list.innerHTML = slice.map(function(o){ return odpRowHTML(o); }).join('');

    var pagi = document.getElementById('odp-pagi');
    var prev = document.getElementById('odp-prev');
    var next = document.getElementById('odp-next');
    var info = document.getElementById('odp-pagi-info');
    if (pages > 1){
      pagi.style.display = 'flex';
      if (prev) prev.disabled = _odpPage <= 1;
      if (next) next.disabled = _odpPage >= pages;
      if (info) info.textContent = _odpPage + ' / ' + pages;
    } else { pagi.style.display = 'none'; }
  };

})();


/* =====================================================================
   PERBAIKAN LANJUTAN — 4 TEMUAN AUDIT DI MASTER ODC/ODP
   ---------------------------------------------------------------------
   1) BUG NYATA (bukan buatan saya, sudah ada dari awal): kode asli
      salah hitung "port terpakai" ODC. Yang seharusnya dihitung =
      "berapa ODP yang sudah terhubung ke ODC ini" (dibanding kapasitas
      slot ODC, misal 4). Tapi kode asli malah menghitung "berapa PORT
      PELANGGAN yang aktif di SEMUA ODP di bawah ODC itu" — dua angka
      yang beda skala sama sekali. Makanya bisa muncul "13/4" atau
      "0/4" padahal 1 ODP sudah terhubung. Sudah diperbaiki di bawah.
   2) Kode ODP sekarang pakai 3 digit (001, 002, dst) — SEPUTAR ODP
      BARU saja. ODP lama yang formatnya masih 2 digit (01, 02) TIDAK
      diubah otomatis, supaya tidak mengubah data yang sudah ada.
   3 & 4) Sudah tercakup oleh perbaikan poin 1 di atas.
   TAMBAHAN: tombol "Buat Semua Sisa ODP Sekaligus" di halaman detail
   ODC, untuk ODC yang sudah ada tapi belum lengkap ODP-nya.
===================================================================== */
(function(){
  'use strict';

  /* ================= util: hitung ODP yang BENERAN terhubung ke 1 ODC ================= */
  function hitungOdpTerhubung(odcId){
    return (typeof _odpData !== 'undefined' ? _odpData : []).filter(function(x){ return x.odc_id === odcId; });
  }

  /* ================= PERBAIKAN 1: kartu baris ODC (list) ================= */
  window.odcRowHTML = function(o){
    var stMap = { aktif: 'tg', maintenance: 'ty', full: 'tr', planning: 'tgr', nonaktif: 'tgr' };
    var stLbl = { aktif: 'Aktif', maintenance: 'Maintenance', full: 'Full', planning: 'Planning', nonaktif: 'Non-Aktif' };
    var stClass = stMap[o.status] || 'tgr';
    var stLabel = stLbl[o.status] || o.status;

    var port = o.jumlah_port || 0;
    var used = hitungOdpTerhubung(o.id).length; // <-- DIPERBAIKI: hitung ODP, bukan port pelanggan
    var pct = port > 0 ? Math.min(100, Math.round(used / port * 100)) : 0;
    var barC = pct >= 90 ? 'full' : pct >= 70 ? 'warn' : 'ok';

    var portHtml = port > 0 ?
      '<div class="olt-port-wrap">' +
      '<span class="olt-port-label">ODP ' + used + '/' + port + '</span>' +
      '<div class="olt-port-bar-bg"><div class="olt-port-bar ' + barC + '" style="width:' + pct + '%"></div></div>' +
      '<span class="olt-port-pct">' + pct + '%</span>' +
      '</div>' : '';

    var typeLabel = { aerial: 'Aerial', pedestal: 'Pedestal', wall: 'Wall Mount', indoor: 'Indoor' }[o.type] || o.type || '—';

    return '<div class="olt-row" onclick="odcOpenDet(\'' + o.id + '\')">' +
      '<button class="olt-row-detail-btn" onclick="event.stopPropagation();odcOpenDet(\'' + o.id + '\')"><i class="ti ti-chevron-right"></i></button>' +
      '<div class="olt-row-top">' +
        '<div class="olt-row-av ' + (o.status === 'full' ? 'down' : o.status === 'maintenance' ? 'maintenance' : 'aktif') + '"><i class="ti ti-box" style="font-size:16px"></i></div>' +
        '<div class="olt-row-info">' +
          '<div class="olt-row-name">' + _esc(o.nama || '—') + '</div>' +
          '<div class="olt-row-kode">' + _esc(o.kode || '—') + ' · ' + _esc(o.lokasi || '—') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="olt-row-meta">' +
        '<span class="tag ' + stClass + '">' + stLabel + '</span>' +
        '<span class="tag tc"><span style="color:var(--cyan);background:var(--cyg);padding:3px 8px;border-radius:20px;font-size:9px;font-weight:700">' + _esc(typeLabel) + '</span></span>' +
        '<span class="tag tgr">' + _esc(_odcAreaName(o.area_id)) + '</span>' +
        '<span class="tag tpu" style="background:var(--pug);color:var(--pu)">' + _esc(_odcOltName(o.olt_id)) + (o.olt_port_no ? (' P' + _esc(String(o.olt_port_no))) : '') + '</span>' +
      '</div>' +
      portHtml +
    '</div>';
  };

  /* ================= PERBAIKAN 1: halaman detail ODC ================= */
  var _origOdcRenderDet = window._odcRenderDet;
  window._odcRenderDet = function(o){
    if (window._odcDetId !== o.id) return;

    var stMap = { aktif: 'tg', maintenance: 'ty', full: 'tr', planning: 'tgr', nonaktif: 'tgr' };
    var stLbl = { aktif: 'Aktif', maintenance: 'Maintenance', full: 'Full', planning: 'Planning', nonaktif: 'Non-Aktif' };
    var stClass = stMap[o.status] || 'tgr';
    var stLabel = stLbl[o.status] || o.status;
    var typeLabel = { aerial: 'Aerial (Udara)', pedestal: 'Pedestal (Tanah)', wall: 'Wall Mount', indoor: 'Indoor' }[o.type] || o.type || '—';

    var port = o.jumlah_port || 0;
    var terhubung = hitungOdpTerhubung(o.id);
    var used = terhubung.length; // <-- DIPERBAIKI
    var pct = port > 0 ? Math.min(100, Math.round(used / port * 100)) : 0;
    var barC = pct >= 90 ? 'full' : pct >= 70 ? 'warn' : 'ok';
    var created = o.created_at ? new Date(o.created_at) : null;
    var createdStr = created ? (function(d){ var p = function(n){ return n < 10 ? '0' + n : n; }; return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); })(created) : '—';

    var dr = _drRow, sec = _secRow;

    var odcOdps = terhubung.slice().sort(function(a, b){ return (parseInt(a.odc_port_no) || 9999) - (parseInt(b.odc_port_no) || 9999); });
    var mapHtml;
    if (odcOdps.length === 0){
      mapHtml = '<div class="olt-det-row"><div class="olt-det-val" style="color:var(--text3)">Belum ada ODP yang terhubung ke ODC ini</div></div>';
    } else {
      mapHtml = odcOdps.map(function(d){
        var portLbl = d.odc_port_no ? 'Port ' + _esc(String(d.odc_port_no)) : 'Port —';
        return '<div class="olt-det-row">' +
          '<div class="olt-det-lbl" style="font-family:\'JetBrains Mono\',monospace;color:var(--c1)">' + portLbl + '</div>' +
          '<div class="olt-det-val" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="odcCloseDet();odpOpenDet(\'' + d.id + '\')">' +
            '<span class="tag tc1" style="background:var(--c1b)">' + _esc(d.nama || d.kode || '—') + '</span>' +
            '<i class="ti ti-chevron-right" style="font-size:13px;color:var(--text3)"></i>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    var sisaSlot = Math.max(0, port - used);
    var tombolSisaOdp = sisaSlot > 0 ?
      '<button class="btn btn-ghost" style="flex:1;background:var(--c1b);color:var(--c1);border-color:rgba(26,86,219,.2)" onclick="odcBuatSisaOdp(\'' + o.id + '\')"><i class="ti ti-plus"></i> Buat ' + sisaSlot + ' Sisa ODP</button>' : '';

    document.getElementById('odc-det-body').innerHTML =
      sec('info-circle', 'Informasi Dasar') +
      dr('Kode', '<span style="font-family:\'JetBrains Mono\',monospace;color:var(--c1)">' + _esc(o.kode || '—') + '</span>') +
      dr('Nama ODC', _esc(o.nama || '—')) +
      dr('Area', '<span class="tag tc1">' + _esc(_odcAreaName(o.area_id)) + '</span>') +
      dr('OLT Induk', '<span class="tag tpu" style="background:var(--pug);color:var(--pu)">' + _esc(_odcOltName(o.olt_id)) + '</span>') +
      dr('Port OLT (PON)', o.olt_port_no ? '<span style="font-family:\'JetBrains Mono\',monospace;font-weight:700">Port ' + _esc(String(o.olt_port_no)) + '</span>' : '<span style="color:var(--text3)">—</span>') +
      dr('Lokasi', _esc(o.lokasi || '—')) +
      dr('Tipe', typeLabel) +
      dr('Status', '<span class="tag ' + stClass + '">' + stLabel + '</span>') +
      sec('circuit-switchboard', 'Kapasitas ODP (bukan port pelanggan)') +
      dr('Total Slot ODP', _fmt(port) + ' slot') +
      dr('ODP Terhubung', _fmt(used) + ' ODP') +
      dr('Utilisasi', port > 0 ?
        '<div style="display:flex;align-items:center;gap:8px;flex:1">' +
        '<div class="olt-port-bar-bg" style="flex:1"><div class="olt-port-bar ' + barC + '" style="width:' + pct + '%"></div></div>' +
        '<span style="font-weight:800;font-family:\'JetBrains Mono\',monospace;font-size:12px">' + pct + '%</span>' +
        '</div>' : '<span style="color:var(--text3)">—</span>') +
      sec('topology-star', 'Pemetaan Port → ODP') +
      mapHtml +
      sec('map-pin', 'Koordinat & Catatan') +
      dr('Latitude', o.lat ? String(o.lat) : '—') +
      dr('Longitude', o.lng ? String(o.lng) : '—') +
      dr('Keterangan', _esc(o.keterangan || '—')) +
      dr('Dibuat', createdStr) +
      '<div style="display:flex;gap:8px;margin-top:14px">' +
        tombolSisaOdp +
        '<button class="btn btn-ghost" style="flex:1;background:var(--rg2);color:var(--red);border-color:rgba(220,38,38,.2)" onclick="odcDelete(\'' + o.id + '\')"><i class="ti ti-trash"></i> Hapus</button>' +
      '</div>';

    document.getElementById('odc-det-overlay').classList.add('on');
  };

  /* ================= FITUR: Buat Semua Sisa ODP Sekaligus ================= */
  function pad3(n){ n = String(n); while (n.length < 3) n = '0' + n; return n; }

  window.odcBuatSisaOdp = function(odcId){
    var odc = (window._odcData || []).find(function(o){ return o.id === odcId; });
    if (!odc) return;
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ if (typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    var port = odc.jumlah_port || 0;
    var terpakaiPortNo = {};
    hitungOdpTerhubung(odcId).forEach(function(x){ if (x.odc_port_no) terpakaiPortNo[x.odc_port_no] = 1; });

    var slotKosong = [];
    for (var i = 1; i <= port; i++){ if (!terpakaiPortNo[i]) slotKosong.push(i); }
    if (!slotKosong.length){ if (typeof toast === 'function') toast('Semua slot ODC ini sudah terisi', 'err'); return; }

    if (!confirm('Buat ' + slotKosong.length + ' ODP sekaligus untuk mengisi sisa slot kosong di ODC ' + odc.kode + '?\n\nBisa diedit satu-satu kapan saja setelah dibuat.')) return;

    var payloads = slotKosong.map(function(portNo){
      var kode = odc.kode + '_' + pad3(portNo);
      return {
        kode: kode, nama: kode, area_id: odc.area_id, odc_id: odc.id, odc_port_no: portNo,
        lokasi: odc.lokasi || '', type: 'aerial', jumlah_port: 8, status: 'aktif',
        lat: odc.lat || null, lng: odc.lng || null,
        keterangan: 'Dibuat otomatis (lengkapi sisa slot ODC ' + odc.kode + ')',
      };
    });

    if (window.ProgUI) ProgUI.open({ title: 'Membuat ' + slotKosong.length + ' ODP', step: 'Menyimpan ke database…' });

    sb.from('odps').insert(payloads).select('id,jumlah_port').then(function(r){
      if (r.error){
        if (typeof toast === 'function') toast('Gagal membuat ODP: ' + (r.error.message || 'coba lagi'), 'err');
        if (window.ProgUI) ProgUI.error('Gagal: ' + (r.error.message || 'coba lagi'));
        return;
      }
      var created = r.data || [];
      var portInserts = [];
      created.forEach(function(o){
        for (var p = 1; p <= (o.jumlah_port || 8); p++) portInserts.push({ odp_id: o.id, nomor_port: p, status: 'kosong' });
      });
      if (portInserts.length) sb.from('odp_ports').upsert(portInserts, { onConflict: 'odp_id,nomor_port', ignoreDuplicates: true }).catch(function(){});

      if (typeof toast === 'function') toast('✅ ' + created.length + ' ODP berhasil dibuat', 'ok');
      if (window.ProgUI) ProgUI.success(created.length + ' ODP berhasil dibuat');
      if (window.SOT && typeof SOT.invalidate === 'function') SOT.invalidate('general');
      window._odpLoaded = false;
      if (typeof odpLoad === 'function') odpLoad();
      if (typeof odcCloseDet === 'function') odcCloseDet();
      window._odpData = []; // paksa data ODP diambil ulang biar detail ODC akurat kalau dibuka lagi
    }).catch(function(e){
      if (typeof toast === 'function') toast('Error: ' + (e.message || 'coba lagi'), 'err');
      if (window.ProgUI) ProgUI.error('Error: ' + (e.message || 'coba lagi'));
    });
  };

  /* ================= PERBAIKAN 2: kode ODP 3-digit + jumlah kandidat mengikuti kapasitas ODC ================= */
  window._odpGenKodeDropdown = function(odcId, currentKode){
    var kodeGrp = document.getElementById('odpf-kode-group');
    var kodeSel = document.getElementById('odpf-kode-sel');
    if (!odcId){ kodeGrp.style.display = 'none'; return; }

    var odc = _odcData.find(function(o){ return o.id === odcId; });
    if (!odc){ kodeGrp.style.display = 'none'; return; }

    // Jumlah kandidat sekarang MENGIKUTI kapasitas slot ODC (dulu selalu
    // di-hardcode 4, padahal kapasitas ODC bisa beda-beda), dan formatnya
    // 3 digit (001, 002, ...) supaya seragam. ODP lama berformat 2 digit
    // TIDAK diubah — ini cuma berlaku untuk ODP BARU mulai sekarang.
    var totalSlot = Math.max(1, parseInt(odc.jumlah_port) || 4);
    var candidates = [];
    for (var i = 1; i <= totalSlot; i++) candidates.push(odc.kode + '_' + pad3(i));

    var usedKodes = _odpData
      .filter(function(o){ return o.odc_id === odcId && o.id !== document.getElementById('odpf-id').value; })
      .map(function(o){ return o.kode; });

    kodeSel.innerHTML = '<option value="">— Pilih Kode ODP —</option>';
    candidates.forEach(function(k){
      var opt = document.createElement('option');
      opt.value = k;
      var taken = usedKodes.indexOf(k) >= 0;
      opt.textContent = taken ? k + ' (sudah dipakai)' : k;
      opt.disabled = taken;
      opt.style.color = taken ? '#ef4444' : '';
      if (k === currentKode) opt.selected = true;
      kodeSel.appendChild(opt);
    });

    kodeGrp.style.display = 'block';
    kodeSel.onchange = function(){
      document.getElementById('odpf-kode').value = this.value;
      document.getElementById('odpf-nama').value = this.value;
    };
    if (currentKode){
      document.getElementById('odpf-kode').value = currentKode;
      document.getElementById('odpf-nama').value = currentKode;
    }
  };

})();


/* =====================================================================
   FITUR BARU — RAPIKAN KODE ODP LAMA (2 digit) JADI SERAGAM (3 digit)
   ---------------------------------------------------------------------
   PENTING: Ini MENGUBAH DATA yang sudah ada (kode & nama ODP lama),
   jadi SENGAJA dibuat aman:
   1) Khusus Super Admin.
   2) WAJIB lihat daftar pratinjau dulu (apa saja yang akan diubah)
      sebelum bisa eksekusi — tidak langsung jalan.
   3) Kalau ada calon kode baru yang TERNYATA sudah dipakai ODP lain,
      baris itu OTOMATIS DILEWATI (tidak dipaksa), supaya tidak
      menabrak/menimpa data yang sudah ada.
   4) Diproses per-batch kecil dengan jeda, supaya tidak membebani
      server (sama seperti pola aman yang sudah dipakai di fitur lain).
   Yang diubah HANYA kolom "kode" dan "nama" (karena nama ODP memang
   selalu sama dengan kode) — tidak ada kolom lain yang disentuh,
   tidak ada ODP yang dihapus/ditambah.
===================================================================== */
(function(){
  'use strict';

  function isSuperAdmin(){
    var role = (typeof normalizeRole === 'function') ? normalizeRole(window.CR) : window.CR;
    return role === 'super_admin';
  }

  // Pola kode ODP yang masih 2 digit di ujung, contoh: XXXX_01, XXXX_12
  // (bukan yang sudah 3 digit seperti XXXX_001 — itu dilewati karena
  // memang sudah sesuai format baru).
  var POLA_2_DIGIT = /^(.+_)(\d{2})$/;

  function hitungRencanaRename(semuaOdp){
    var kodeSet = {};
    semuaOdp.forEach(function(o){ kodeSet[o.kode] = 1; });

    var rencana = [];
    semuaOdp.forEach(function(o){
      var m = POLA_2_DIGIT.exec(o.kode || '');
      if (!m) return; // bukan format 2-digit, lewati (sudah 3 digit atau format lain)
      var kodeBaru = m[1] + m[2].padStart(3, '0');
      if (kodeSet[kodeBaru]){
        rencana.push({ id: o.id, lama: o.kode, baru: kodeBaru, bentrok: true });
      } else {
        rencana.push({ id: o.id, lama: o.kode, baru: kodeBaru, bentrok: false });
      }
    });
    return rencana;
  }

  function ensureToolButton(){
    if (!isSuperAdmin()) return;
    if (document.getElementById('odp-rapikan-btn')) return;
    var addBtn = document.querySelector('#odp-fil-odc');
    var anchor = addBtn ? addBtn.closest('.olt-filter-bar') || addBtn.parentNode : null;
    if (!anchor) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'odp-rapikan-btn';
    btn.onclick = window.odpBukaRapikanKode;
    btn.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;padding:6px 11px;border-radius:20px;border:1.5px solid rgba(124,58,237,.3);background:var(--pug,rgba(124,58,237,.08));color:var(--pu);cursor:pointer;white-space:nowrap;margin-top:8px';
    btn.innerHTML = '<i class="ti ti-sparkles" style="font-size:12px"></i> Rapikan Kode Lama';
    anchor.parentNode.insertBefore(btn, anchor.nextSibling);
  }

  var _origOdpRenderForTool = window.odpRender;
  window.odpRender = function(){
    _origOdpRenderForTool();
    ensureToolButton();
  };
  setTimeout(ensureToolButton, 900);

  window.odpBukaRapikanKode = function(){
    if (!isSuperAdmin()){ if (typeof toast === 'function') toast('Khusus Super Admin', 'err'); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ if (typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    if (window.ProgUI) ProgUI.open({ title: 'Memeriksa Kode ODP', step: 'Mengambil semua data ODP…' });

    sb.from('odps').select('id,kode,nama').then(function(r){
      if (r.error){ if (window.ProgUI) ProgUI.error('Gagal: ' + r.error.message); return; }
      var rencana = hitungRencanaRename(r.data || []);
      var bisaJalan = rencana.filter(function(x){ return !x.bentrok; });
      var bentrok = rencana.filter(function(x){ return x.bentrok; });

      if (window.ProgUI) ProgUI.close ? ProgUI.close() : null;
      tampilkanPratinjau(bisaJalan, bentrok);
    }).catch(function(e){
      if (window.ProgUI) ProgUI.error('Error: ' + (e.message || 'coba lagi'));
    });
  };

  function tampilkanPratinjau(bisaJalan, bentrok){
    var existing = document.getElementById('odp-rapikan-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'odp-rapikan-overlay';
    overlay.className = 'olt-overlay on';
    overlay.onclick = function(e){ if (e.target === overlay) overlay.remove(); };

    var contohHtml = bisaJalan.slice(0, 30).map(function(x){
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--border);font-family:monospace;font-size:11.5px">' +
        '<span style="color:var(--text3);text-decoration:line-through">' + x.lama + '</span>' +
        '<i class="ti ti-arrow-right" style="font-size:12px;color:var(--text3)"></i>' +
        '<span style="color:var(--green);font-weight:700">' + x.baru + '</span>' +
      '</div>';
    }).join('');

    overlay.innerHTML =
      '<div class="olt-sheet">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)">' +
          '<div style="font-size:13px;font-weight:800;color:var(--text)"><i class="ti ti-sparkles" style="color:var(--pu)"></i> Pratinjau Rapikan Kode ODP</div>' +
          '<button onclick="document.getElementById(\'odp-rapikan-overlay\').remove()" style="width:30px;height:30px;border-radius:9px;background:var(--bg3);border:none;cursor:pointer"><i class="ti ti-x"></i></button>' +
        '</div>' +
        '<div class="olt-sheet-body">' +
          '<div style="display:flex;gap:8px;margin-bottom:12px">' +
            '<div style="flex:1;background:var(--gng2);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--green)">' + bisaJalan.length + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">SIAP DIUBAH</div></div>' +
            '<div style="flex:1;background:var(--yg,rgba(217,119,6,.1));border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--yellow)">' + bentrok.length + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">DILEWATI (BENTROK)</div></div>' +
          '</div>' +
          (bisaJalan.length === 0
            ? '<div style="text-align:center;padding:30px;color:var(--text3);font-size:12.5px">Tidak ada kode ODP yang perlu dirapikan — semua sudah seragam.</div>'
            : '<div style="font-size:11px;color:var(--text3);margin-bottom:6px">Contoh perubahan (menampilkan maks. 30 dari ' + bisaJalan.length + '):</div>' +
              '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;max-height:280px;overflow-y:auto">' + contohHtml + '</div>' +
              (bentrok.length > 0 ? '<div style="font-size:10.5px;color:var(--yellow);margin-top:10px"><i class="ti ti-alert-triangle"></i> ' + bentrok.length + ' kode dilewati karena nama barunya sudah dipakai ODP lain — tidak akan diubah, aman.</div>' : '') +
              '<button onclick="odpJalankanRapikanKode(' + bisaJalan.length + ')" style="width:100%;margin-top:14px;padding:13px;border-radius:12px;border:none;background:var(--pu);color:#fff;font-weight:700;font-size:13px;cursor:pointer">Ya, Ubah ' + bisaJalan.length + ' Kode ODP Ini</button>' +
              '<div style="font-size:10px;color:var(--text3);text-align:center;margin-top:8px">Tindakan ini bisa dibatalkan manual satu-satu lewat Edit ODP kalau ada yang keliru.</div>'
          ) +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    window._odpRencanaRapikan = bisaJalan; // simpan sementara utk dieksekusi
  }

  window.odpJalankanRapikanKode = function(jumlah){
    var rencana = window._odpRencanaRapikan || [];
    if (!rencana.length) return;
    if (!confirm('Yakin ubah ' + rencana.length + ' kode ODP sekarang? Tindakan ini akan langsung tersimpan ke database.')) return;

    var overlay = document.getElementById('odp-rapikan-overlay');
    if (overlay) overlay.remove();

    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb) return;

    var BATCH = 30, DELAY = 500;
    var ok = 0, gagal = 0;

    if (window.ProgUI) ProgUI.open({ title: 'Merapikan ' + rencana.length + ' Kode ODP', step: 'Memulai…' });

    function jalan(idx){
      if (idx >= rencana.length){
        if (window.ProgUI) ProgUI.success(ok + ' kode berhasil diubah' + (gagal ? ', ' + gagal + ' gagal' : ''));
        if (typeof toast === 'function') toast('✅ ' + ok + ' kode ODP dirapikan' + (gagal ? ', ' + gagal + ' gagal' : ''), 'ok');
        if (window.SOT && typeof SOT.invalidate === 'function') SOT.invalidate('general');
        window._odpLoaded = false;
        if (typeof odpLoad === 'function') odpLoad();
        return;
      }
      var item = rencana[idx];
      if (window.ProgUI) ProgUI.step('Mengubah ' + (idx + 1) + '/' + rencana.length + '…', Math.round((idx / rencana.length) * 100));
      sb.from('odps').update({ kode: item.baru, nama: item.baru }).eq('id', item.id).then(function(r){
        if (r.error) gagal++; else ok++;
        setTimeout(function(){ jalan(idx + 1); }, DELAY / 10); // jeda kecil per item, dipercepat krn 1x1 (bukan batch besar)
      }).catch(function(){ gagal++; setTimeout(function(){ jalan(idx + 1); }, DELAY / 10); });
    }
    jalan(0);
  };

})();


/* =====================================================================
   PERBAIKAN LANJUTAN #2 — 3 KASUS BARU (audit ulang form Tambah/Edit ODP)
   ---------------------------------------------------------------------
   TEMUAN:
   Case 1 ("Port ODC kosong padahal sudah dipakai") DAN sebagian dari
   Case 3 ("Port ODP & ODC induk reset saat edit") — TERNYATA 1 akar
   masalah yang sama: ODP yang dibuat SEBELUM kolom "odc_port_no" ada
   di database (sebelum perbaikan kolom kemarin), otomatis nilainya
   KOSONG (NULL) — jadi sistem tidak tahu ODP itu menempati port yang
   mana. Makanya semua port kelihatan "Kosong" padahal sebenarnya sudah
   dipakai, dan saat di-edit, pilihan Port ODC-nya ikut kosong juga.
   → Solusi: tombol "Lengkapi Nomor Port dari Kode" (dengan pratinjau
     dulu, aman) — mengisi ulang odc_port_no berdasarkan angka di
     ujung kode ODP yang SUDAH ADA (misal ..._001 → Port 1).

   Case 2 ("Area kepilih otomatis tapi ODC induk tidak ikut terbuka")
   DAN sisa Case 3 (ODC induk reset saat edit ODP yang area-nya kosong)
   — akar masalahnya: dropdown Area MEMANG SENGAJA "mengingat" pilihan
   area terakhir (ini perilaku asli, bukan bug, supaya tidak perlu
   pilih ulang tiap kali). Tapi dropdown ODC yang saya perbaiki
   sebelumnya belum ikut membaca "ingatan" itu, jadi dua dropdown itu
   jadi tidak sinkron. Sudah diperbaiki di bawah — dropdown ODC sekarang
   ikut ke area yang sama seperti yang ditampilkan di layar.
===================================================================== */
(function(){
  'use strict';

  /* ================= PERBAIKAN Case 2 & sebagian Case 3: sinkronkan dropdown Area <-> ODC ================= */
  var _origOdpFillOdcDropdown2 = window._odpFillOdcDropdown;
  window._odpFillOdcDropdown = function(selId, currentVal, areaId){
    // Kalau areaId tidak dikirim (form "Tambah" baru), ikuti apa yang
    // SEDANG TAMPIL di dropdown Area (termasuk kalau itu "ingatan" dari
    // sesi sebelumnya) — supaya dropdown ODC selalu sinkron dgn Area.
    if (!areaId){
      var areaEl = document.getElementById('odpf-area');
      if (areaEl && areaEl.value) areaId = areaEl.value;
    }
    // Kalau tetap tidak ada areaId (data ODP lama areanya kosong), coba
    // tebak dari ODC yang sedang dipilih/di-edit.
    if (!areaId && currentVal){
      var odcTerkait = (window._odcData || []).find(function(o){ return o.id === currentVal; });
      if (odcTerkait) areaId = odcTerkait.area_id;
    }
    return _origOdpFillOdcDropdown2(selId, currentVal, areaId);
  };

  /* ================= FITUR: Lengkapi Nomor Port ODC dari Kode (backfill aman) ================= */
  function tebakNomorPortDariKode(kode){
    var m = /_(\d{1,3})$/.exec(kode || '');
    if (!m) return null;
    return parseInt(m[1], 10);
  }

  function isSuperAdmin2(){
    var role = (typeof normalizeRole === 'function') ? normalizeRole(window.CR) : window.CR;
    return role === 'super_admin';
  }

  function ensureBackfillButton(){
    if (!isSuperAdmin2()) return;
    if (document.getElementById('odp-backfill-btn')) return;
    var rapikanBtn = document.getElementById('odp-rapikan-btn');
    if (!rapikanBtn || !rapikanBtn.parentNode) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'odp-backfill-btn';
    btn.onclick = window.odpBukaBackfillPort;
    btn.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;padding:6px 11px;border-radius:20px;border:1.5px solid rgba(26,86,219,.3);background:var(--c1b);color:var(--c1);cursor:pointer;white-space:nowrap;margin-top:8px;margin-left:8px';
    btn.innerHTML = '<i class="ti ti-plug-connected" style="font-size:12px"></i> Lengkapi Nomor Port dari Kode';
    rapikanBtn.parentNode.insertBefore(btn, rapikanBtn.nextSibling);
  }
  var _origOdpRenderForBackfill = window.odpRender;
  window.odpRender = function(){
    _origOdpRenderForBackfill();
    ensureBackfillButton();
  };
  setTimeout(ensureBackfillButton, 950);

  window.odpBukaBackfillPort = function(){
    if (!isSuperAdmin2()){ if (typeof toast === 'function') toast('Khusus Super Admin', 'err'); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ if (typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    if (window.ProgUI) ProgUI.open({ title: 'Memeriksa Nomor Port ODC', step: 'Mengambil semua data ODP…' });

    sb.from('odps').select('id,kode,odc_id,odc_port_no').then(function(r){
      if (r.error){ if (window.ProgUI) ProgUI.error('Gagal: ' + r.error.message); return; }
      var semua = r.data || [];
      var terpakaiPerOdc = {}; // odc_id -> { portNo: true }
      semua.forEach(function(o){
        if (o.odc_id && o.odc_port_no){
          terpakaiPerOdc[o.odc_id] = terpakaiPerOdc[o.odc_id] || {};
          terpakaiPerOdc[o.odc_id][o.odc_port_no] = true;
        }
      });

      var rencana = [], tidakBisaTebak = 0, bentrok = 0;
      semua.forEach(function(o){
        if (!o.odc_id || o.odc_port_no) return; // sudah ada nomor port, lewati
        var tebakan = tebakNomorPortDariKode(o.kode);
        if (!tebakan){ tidakBisaTebak++; return; }
        terpakaiPerOdc[o.odc_id] = terpakaiPerOdc[o.odc_id] || {};
        if (terpakaiPerOdc[o.odc_id][tebakan]){ bentrok++; return; } // sudah dipakai ODP lain di ODC yg sama, lewati demi aman
        terpakaiPerOdc[o.odc_id][tebakan] = true; // tandai terpakai supaya tidak dobel dalam 1 proses ini
        rencana.push({ id: o.id, kode: o.kode, portNo: tebakan });
      });

      if (window.ProgUI && ProgUI.close) ProgUI.close();
      tampilkanPratinjauBackfill(rencana, tidakBisaTebak, bentrok);
    }).catch(function(e){
      if (window.ProgUI) ProgUI.error('Error: ' + (e.message || 'coba lagi'));
    });
  };

  function tampilkanPratinjauBackfill(rencana, tidakBisaTebak, bentrok){
    var existing = document.getElementById('odp-backfill-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'odp-backfill-overlay';
    overlay.className = 'olt-overlay on';
    overlay.onclick = function(e){ if (e.target === overlay) overlay.remove(); };

    var contohHtml = rencana.slice(0, 30).map(function(x){
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--border);font-family:monospace;font-size:11px">' +
        '<span style="color:var(--text)">' + x.kode + '</span>' +
        '<span style="color:var(--c1);font-weight:700">Port ' + x.portNo + '</span>' +
      '</div>';
    }).join('');

    overlay.innerHTML =
      '<div class="olt-sheet">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)">' +
          '<div style="font-size:13px;font-weight:800;color:var(--text)"><i class="ti ti-plug-connected" style="color:var(--c1)"></i> Pratinjau Lengkapi Port ODC</div>' +
          '<button onclick="document.getElementById(\'odp-backfill-overlay\').remove()" style="width:30px;height:30px;border-radius:9px;background:var(--bg3);border:none;cursor:pointer"><i class="ti ti-x"></i></button>' +
        '</div>' +
        '<div class="olt-sheet-body">' +
          '<div style="font-size:11px;color:var(--text3);margin-bottom:12px">Nomor port ditebak dari angka di ujung kode ODP (misal <code>..._001</code> → Port 1). Ini hanya melengkapi data yang KOSONG — tidak menimpa yang sudah terisi.</div>' +
          '<div style="display:flex;gap:8px;margin-bottom:12px">' +
            '<div style="flex:1;background:var(--gng2);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--green)">' + rencana.length + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">SIAP DILENGKAPI</div></div>' +
            '<div style="flex:1;background:var(--yg,rgba(217,119,6,.1));border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--yellow)">' + bentrok + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">DILEWATI (BENTROK)</div></div>' +
            '<div style="flex:1;background:var(--bg3);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--text3)">' + tidakBisaTebak + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">TAK BISA DITEBAK</div></div>' +
          '</div>' +
          (rencana.length === 0
            ? '<div style="text-align:center;padding:30px;color:var(--text3);font-size:12.5px">Tidak ada yang perlu dilengkapi.</div>'
            : '<div style="font-size:11px;color:var(--text3);margin-bottom:6px">Contoh (maks. 30 dari ' + rencana.length + '):</div>' +
              '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;max-height:280px;overflow-y:auto">' + contohHtml + '</div>' +
              '<button onclick="odpJalankanBackfillPort(' + rencana.length + ')" style="width:100%;margin-top:14px;padding:13px;border-radius:12px;border:none;background:var(--c1);color:#fff;font-weight:700;font-size:13px;cursor:pointer">Ya, Lengkapi ' + rencana.length + ' Nomor Port Ini</button>' +
              '<div style="font-size:10px;color:var(--text3);text-align:center;margin-top:8px">Yang "Tak Bisa Ditebak" atau "Bentrok" perlu diisi manual lewat Edit ODP.</div>'
          ) +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    window._odpRencanaBackfill = rencana;
  }

  window.odpJalankanBackfillPort = function(jumlah){
    var rencana = window._odpRencanaBackfill || [];
    if (!rencana.length) return;
    if (!confirm('Yakin lengkapi ' + rencana.length + ' nomor port ODC sekarang? Langsung tersimpan ke database.')) return;

    var overlay = document.getElementById('odp-backfill-overlay');
    if (overlay) overlay.remove();

    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb) return;
    var ok = 0, gagal = 0;

    if (window.ProgUI) ProgUI.open({ title: 'Melengkapi ' + rencana.length + ' Port ODC', step: 'Memulai…' });

    function jalan(idx){
      if (idx >= rencana.length){
        if (window.ProgUI) ProgUI.success(ok + ' berhasil dilengkapi' + (gagal ? ', ' + gagal + ' gagal' : ''));
        if (typeof toast === 'function') toast('✅ ' + ok + ' nomor port ODC dilengkapi' + (gagal ? ', ' + gagal + ' gagal' : ''), 'ok');
        if (window.SOT && typeof SOT.invalidate === 'function') SOT.invalidate('general');
        window._odpLoaded = false;
        if (typeof odpLoad === 'function') odpLoad();
        return;
      }
      var item = rencana[idx];
      if (window.ProgUI) ProgUI.step('Melengkapi ' + (idx + 1) + '/' + rencana.length + '…', Math.round((idx / rencana.length) * 100));
      sb.from('odps').update({ odc_port_no: item.portNo }).eq('id', item.id).then(function(r){
        if (r.error) gagal++; else ok++;
        setTimeout(function(){ jalan(idx + 1); }, 60);
      }).catch(function(){ gagal++; setTimeout(function(){ jalan(idx + 1); }, 60); });
    }
    jalan(0);
  };

})();


/* =====================================================================
   PERBAIKAN LANJUTAN #3 — Port PON (ODC → OLT) masih kosong semua
   ---------------------------------------------------------------------
   TEMUAN: sama seperti kasus "Port ODC" sebelumnya, tapi ini di level
   ODC → OLT. Kolom "olt_port_no" MEMANG SUDAH ADA di database (beda
   dengan odc_port_no yang kemarin harus ditambah), tapi banyak ODC yang
   dibuat lewat import massal dulu kemungkinan besar tidak terisi kolom
   ini — makanya semua Port PON kelihatan "Kosong".

   PENTING — INI BEDA DENGAN BACKFILL ODP SEBELUMNYA: kode ODC (misal
   "W1_CBD_JJC.JKBN_021") TIDAK mengandung info "ini nomor port PON
   yang keberapa" — jadi TIDAK BISA ditebak seakurat kasus ODP kemarin.
   Yang saya buat di sini cuma pengisian NOMOR URUT sementara (ODC ke-1
   di OLT itu → Port 1, ke-2 → Port 2, dst) SUPAYA tidak ada 2 ODC yang
   bentrok nomor port-nya lagi — BUKAN jaminan sesuai kabel fisik yang
   sebenarnya. Karena itu, tombol ini punya peringatan jelas & tetap
   wajib lihat pratinjau dulu, dan sangat disarankan dicek ulang manual
   ke lapangan kalau presisi port fisik penting untuk Anda.
===================================================================== */
(function(){
  'use strict';

  function isSuperAdmin3(){
    var role = (typeof normalizeRole === 'function') ? normalizeRole(window.CR) : window.CR;
    return role === 'super_admin';
  }

  function ensureOltPortBackfillButton(){
    if (!isSuperAdmin3()) return;
    if (document.getElementById('odc-oltport-btn')) return;
    var rapikanBtn = document.querySelector('#odc-fil-olt'); // toolbar Master ODC
    var anchor = rapikanBtn ? rapikanBtn.closest('.olt-filter-bar') : null;
    if (!anchor) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'odc-oltport-btn';
    btn.onclick = window.odcBukaBackfillOltPort;
    btn.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;padding:6px 11px;border-radius:20px;border:1.5px solid rgba(217,119,6,.35);background:var(--yg,rgba(217,119,6,.1));color:var(--yellow);cursor:pointer;white-space:nowrap;margin-top:8px';
    btn.innerHTML = '<i class="ti ti-alert-triangle" style="font-size:12px"></i> Lengkapi Port PON (perkiraan)';
    anchor.parentNode.insertBefore(btn, anchor.nextSibling);
  }
  var _origOdcRenderForOltPort = window.odcRender;
  window.odcRender = function(){
    _origOdcRenderForOltPort();
    ensureOltPortBackfillButton();
  };
  setTimeout(ensureOltPortBackfillButton, 1000);

  window.odcBukaBackfillOltPort = function(){
    if (!isSuperAdmin3()){ if (typeof toast === 'function') toast('Khusus Super Admin', 'err'); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ if (typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    if (window.ProgUI) ProgUI.open({ title: 'Memeriksa Port PON', step: 'Mengambil semua data ODC…' });

    sb.from('odcs').select('id,kode,olt_id,olt_port_no').then(function(r){
      if (r.error){ if (window.ProgUI) ProgUI.error('Gagal: ' + r.error.message); return; }
      var semua = r.data || [];
      var tanpaOlt = semua.filter(function(o){ return !o.olt_id; }).length;
      var perOlt = {};
      semua.forEach(function(o){
        if (!o.olt_id) return;
        perOlt[o.olt_id] = perOlt[o.olt_id] || [];
        perOlt[o.olt_id].push(o);
      });

      var rencana = [];
      Object.keys(perOlt).forEach(function(oltId){
        var list = perOlt[oltId];
        var terpakai = {};
        list.forEach(function(o){ if (o.olt_port_no) terpakai[o.olt_port_no] = true; });
        var kosong = list.filter(function(o){ return !o.olt_port_no; }).sort(function(a, b){ return (a.kode || '').localeCompare(b.kode || ''); });
        var nomor = 1;
        kosong.forEach(function(o){
          while (terpakai[nomor]) nomor++;
          terpakai[nomor] = true;
          rencana.push({ id: o.id, kode: o.kode, portNo: nomor });
          nomor++;
        });
      });

      if (window.ProgUI && ProgUI.close) ProgUI.close();
      tampilkanPratinjauOltPort(rencana, tanpaOlt);
    }).catch(function(e){
      if (window.ProgUI) ProgUI.error('Error: ' + (e.message || 'coba lagi'));
    });
  };

  function tampilkanPratinjauOltPort(rencana, tanpaOlt){
    var existing = document.getElementById('odc-oltport-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'odc-oltport-overlay';
    overlay.className = 'olt-overlay on';
    overlay.onclick = function(e){ if (e.target === overlay) overlay.remove(); };

    var contohHtml = rencana.slice(0, 30).map(function(x){
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--border);font-family:monospace;font-size:11px">' +
        '<span style="color:var(--text)">' + x.kode + '</span>' +
        '<span style="color:var(--yellow);font-weight:700">Port ' + x.portNo + '</span>' +
      '</div>';
    }).join('');

    overlay.innerHTML =
      '<div class="olt-sheet">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)">' +
          '<div style="font-size:13px;font-weight:800;color:var(--text)"><i class="ti ti-alert-triangle" style="color:var(--yellow)"></i> Pratinjau Port PON (Perkiraan)</div>' +
          '<button onclick="document.getElementById(\'odc-oltport-overlay\').remove()" style="width:30px;height:30px;border-radius:9px;background:var(--bg3);border:none;cursor:pointer"><i class="ti ti-x"></i></button>' +
        '</div>' +
        '<div class="olt-sheet-body">' +
          '<div style="background:var(--yg,rgba(217,119,6,.1));border:1px solid rgba(217,119,6,.3);border-radius:12px;padding:12px;margin-bottom:12px;font-size:11px;color:var(--text2);line-height:1.5">' +
            '<b>Ini nomor urut PERKIRAAN</b>, bukan hasil baca dari kabel fisik — karena kode ODC tidak menyimpan info nomor port PON aslinya. Cuma memastikan tidak ada 2 ODC bentrok nomor port. Kalau presisi ke lapangan penting, cek &amp; sesuaikan manual satu-satu lewat Edit ODC.' +
          '</div>' +
          (tanpaOlt > 0 ? '<div style="font-size:10.5px;color:var(--red);margin-bottom:10px"><i class="ti ti-alert-circle"></i> ' + tanpaOlt + ' ODC tidak punya OLT induk sama sekali — tidak bisa diisikan port PON, perlu dihubungkan ke OLT dulu lewat Edit ODC.</div>' : '') +
          '<div style="display:flex;gap:8px;margin-bottom:12px">' +
            '<div style="flex:1;background:var(--gng2);border-radius:12px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--green)">' + rencana.length + '</div><div style="font-size:9px;color:var(--text3);font-weight:700">SIAP DIISI</div></div>' +
          '</div>' +
          (rencana.length === 0
            ? '<div style="text-align:center;padding:30px;color:var(--text3);font-size:12.5px">Tidak ada yang perlu diisi.</div>'
            : '<div style="font-size:11px;color:var(--text3);margin-bottom:6px">Contoh (maks. 30 dari ' + rencana.length + '):</div>' +
              '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;max-height:260px;overflow-y:auto">' + contohHtml + '</div>' +
              '<button onclick="odcJalankanBackfillOltPort(' + rencana.length + ')" style="width:100%;margin-top:14px;padding:13px;border-radius:12px;border:none;background:var(--yellow);color:#fff;font-weight:700;font-size:13px;cursor:pointer">Ya, Isi ' + rencana.length + ' Port PON (Perkiraan) Ini</button>'
          ) +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    window._odcRencanaOltPort = rencana;
  }

  window.odcJalankanBackfillOltPort = function(jumlah){
    var rencana = window._odcRencanaOltPort || [];
    if (!rencana.length) return;
    if (!confirm('Yakin isi ' + rencana.length + ' nomor Port PON dengan PERKIRAAN sekarang? Ini bukan data pasti — pastikan Anda memahami itu.')) return;

    var overlay = document.getElementById('odc-oltport-overlay');
    if (overlay) overlay.remove();
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb) return;
    var ok = 0, gagal = 0;

    if (window.ProgUI) ProgUI.open({ title: 'Mengisi ' + rencana.length + ' Port PON', step: 'Memulai…' });

    function jalan(idx){
      if (idx >= rencana.length){
        if (window.ProgUI) ProgUI.success(ok + ' berhasil diisi' + (gagal ? ', ' + gagal + ' gagal' : ''));
        if (typeof toast === 'function') toast('✅ ' + ok + ' Port PON diisi (perkiraan)' + (gagal ? ', ' + gagal + ' gagal' : ''), 'ok');
        if (window.SOT && typeof SOT.invalidate === 'function') SOT.invalidate('general');
        window._odcData = [];
        if (typeof odcLoad === 'function') odcLoad();
        return;
      }
      var item = rencana[idx];
      if (window.ProgUI) ProgUI.step('Mengisi ' + (idx + 1) + '/' + rencana.length + '…', Math.round((idx / rencana.length) * 100));
      sb.from('odcs').update({ olt_port_no: item.portNo }).eq('id', item.id).then(function(r){
        if (r.error) gagal++; else ok++;
        setTimeout(function(){ jalan(idx + 1); }, 60);
      }).catch(function(){ gagal++; setTimeout(function(){ jalan(idx + 1); }, 60); });
    }
    jalan(0);
  };

})();
