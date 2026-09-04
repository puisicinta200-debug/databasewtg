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
  var state = {
    odc: { kap: new Set(), area: new Set() },
    odp: { kap: new Set(), area: new Set() },
  };

  var KAP_OPTIONS = [
    ['kosong', 'Kosong', 'var(--green)'],
    ['isi', 'Isi (Belum Penuh)', 'var(--yellow)'],
    ['penuh', 'Penuh', 'var(--red)'],
  ];
  // Catatan penting: ini BEDA dengan filter "Status: Full" yang sudah
  // ada sebelumnya. "Status: Full" itu label yang diisi MANUAL oleh
  // staf (bisa saja sudah tidak sesuai kondisi terkini kalau lupa
  // diupdate). Filter "Kapasitas Real-time" di sini dihitung OTOMATIS
  // dari data port yang sungguhan sekarang — jadi selalu akurat, dan
  // saling melengkapi (bukan gantikan) filter Status yang lama.

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

  /* ================= komponen dropdown multi-pilih (dipakai ulang) ================= */
  function ensureMultiSelectCSS(){
    if (document.getElementById('wtg-multisel-css')) return;
    var st = document.createElement('style');
    st.id = 'wtg-multisel-css';
    st.textContent =
      '.wtg-msel{position:relative;flex-shrink:0}' +
      '.wtg-msel-btn{display:flex;align-items:center;gap:5px;white-space:nowrap}' +
      '.wtg-msel-panel{position:absolute;top:calc(100% + 6px);left:0;z-index:60;background:var(--bg2);border:1.5px solid var(--border2);border-radius:12px;box-shadow:var(--sh-md);padding:8px;min-width:190px;display:none}' +
      '.wtg-msel-panel.on{display:block}' +
      '.wtg-msel-opt{display:flex;align-items:center;gap:8px;padding:7px 6px;border-radius:8px;cursor:pointer;font-size:12.5px;color:var(--text)}' +
      '.wtg-msel-opt:hover{background:var(--bg3)}' +
      '.wtg-msel-opt input{width:16px;height:16px;flex-shrink:0}' +
      '.wtg-msel-foot{display:flex;justify-content:space-between;border-top:1px solid var(--border);margin-top:4px;padding-top:6px}' +
      '.wtg-msel-foot button{background:none;border:none;color:var(--c1);font-size:11px;font-weight:700;cursor:pointer;padding:4px 6px}';
    document.head.appendChild(st);
  }

  function closeAllPanels(exceptId){
    document.querySelectorAll('.wtg-msel-panel.on').forEach(function(p){
      if (p.id !== exceptId) p.classList.remove('on');
    });
  }
  document.addEventListener('click', function(e){
    if (!e.target.closest('.wtg-msel')) closeAllPanels(null);
  });

  function buildMultiSelect(id, label, options, selectedSet, onChange){
    var wrap = document.createElement('div');
    wrap.className = 'wtg-msel';
    wrap.id = id + '-wrap';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sel olt-fil-sel wtg-msel-btn';
    btn.id = id + '-btn';
    wrap.appendChild(btn);

    var panel = document.createElement('div');
    panel.className = 'wtg-msel-panel';
    panel.id = id + '-panel';
    wrap.appendChild(panel);

    function renderBtn(){
      var n = selectedSet.size;
      btn.innerHTML = label + ': <b style="color:var(--c1)">' + (n === 0 ? 'Semua' : n + ' dipilih') + '</b> <i class="ti ti-chevron-down" style="font-size:12px"></i>';
    }
    function renderPanel(){
      panel.innerHTML = '';
      options.forEach(function(opt){
        var val = opt[0], lbl = opt[1], col = opt[2] || 'var(--c1)';
        var row = document.createElement('label');
        row.className = 'wtg-msel-opt';
        row.innerHTML = '<input type="checkbox" ' + (selectedSet.has(val) ? 'checked' : '') + '> ' +
          '<span style="width:8px;height:8px;border-radius:50%;background:' + col + ';flex-shrink:0"></span> ' + lbl;
        row.querySelector('input').addEventListener('change', function(e){
          if (e.target.checked) selectedSet.add(val); else selectedSet.delete(val);
          renderBtn();
          onChange();
        });
        panel.appendChild(row);
      });
      var foot = document.createElement('div');
      foot.className = 'wtg-msel-foot';
      foot.innerHTML = '<button type="button" data-act="all">Pilih Semua</button><button type="button" data-act="clear">Bersihkan</button>';
      foot.querySelector('[data-act="all"]').onclick = function(){
        options.forEach(function(o){ selectedSet.add(o[0]); });
        renderPanel(); renderBtn(); onChange();
      };
      foot.querySelector('[data-act="clear"]').onclick = function(){
        selectedSet.clear();
        renderPanel(); renderBtn(); onChange();
      };
      panel.appendChild(foot);
    }

    btn.onclick = function(e){
      e.stopPropagation();
      var willOpen = !panel.classList.contains('on');
      closeAllPanels(panel.id);
      if (willOpen){ renderPanel(); panel.classList.add('on'); } else panel.classList.remove('on');
    };

    renderBtn();
    return { el: wrap, refreshOptions: function(newOptions){ options = newOptions; if (panel.classList.contains('on')) renderPanel(); renderBtn(); } };
  }

  /* ================= pasang UI filter ke halaman ODC & ODP ================= */
  function ensureFilterUI(page){
    ensureMultiSelectCSS();
    var barSelector = page === 'odc' ? '#odc-fil-olt' : '#odp-fil-odc';
    var anchor = document.querySelector(barSelector);
    if (!anchor || !anchor.parentNode) return false;
    if (document.getElementById('wtg-' + page + '-kap-wrap')) return true;

    var areaOptions = (window._areaData || []).map(function(a){ return [a.id, a.nama || a.kode]; });

    var kapMs = buildMultiSelect('wtg-' + page + '-kap', 'Kapasitas Real-time', KAP_OPTIONS, state[page].kap, function(){ window[page + 'Render'](); });
    var areaMs = buildMultiSelect('wtg-' + page + '-area', 'Area', areaOptions, state[page].area, function(){ window[page + 'Render'](); });

    anchor.parentNode.appendChild(kapMs.el);
    anchor.parentNode.appendChild(areaMs.el);

    // simpan referensi supaya opsi Area bisa disegarkan kalau data area berubah
    window['_wtg' + page + 'AreaMs'] = areaMs;
    return true;
  }

  function refreshAreaOptionsIfNeeded(page){
    var ms = window['_wtg' + page + 'AreaMs'];
    if (!ms) return;
    var areaOptions = (window._areaData || []).map(function(a){ return [a.id, a.nama || a.kode]; });
    ms.refreshOptions(areaOptions);
  }

  /* ================= override odcRender (logika ASLI + 2 kriteria baru) ================= */
  window.odcRender = function(){
    ensureFilterUI('odc');
    refreshAreaOptionsIfNeeded('odc');

    var q   = (document.getElementById('odc-search') || {}).value || '';
    var fSt = (document.getElementById('odc-fil-status') || {}).value || '';
    var fAr = (document.getElementById('odc-fil-area') || {}).value || '';
    var fOl = (document.getElementById('odc-fil-olt') || {}).value || '';
    q = q.toLowerCase().trim();
    var kapSet = state.odc.kap, areaSet = state.odc.area;

    _odcFil = _odcData.filter(function(o){
      var matchQ  = !q || (o.nama || '').toLowerCase().includes(q) || (o.kode || '').toLowerCase().includes(q) || (o.lokasi || '').toLowerCase().includes(q);
      var matchSt = !fSt || o.status === fSt;
      var matchAr = !fAr || o.area_id === fAr;
      var matchOl = !fOl || o.olt_id === fOl;
      var matchKap = !kapSet.size || kapSet.has(odcCapClass(o));
      var matchAreaMulti = !areaSet.size || areaSet.has(o.area_id);
      return matchQ && matchSt && matchAr && matchOl && matchKap && matchAreaMulti;
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
    refreshAreaOptionsIfNeeded('odp');

    var q   = (document.getElementById('odp-search') || {}).value || '';
    var fSt = (document.getElementById('odp-fil-status') || {}).value || '';
    var fAr = (document.getElementById('odp-fil-area') || {}).value || '';
    var fOc = (document.getElementById('odp-fil-odc') || {}).value || '';
    q = q.toLowerCase().trim();
    var kapSet = state.odp.kap, areaSet = state.odp.area;

    _odpFil = _odpData.filter(function(o){
      var matchQ  = !q || (o.nama || '').toLowerCase().includes(q) || (o.kode || '').toLowerCase().includes(q) || (o.lokasi || '').toLowerCase().includes(q);
      var matchSt = !fSt || o.status === fSt;
      var matchAr = !fAr || o.area_id === fAr;
      var matchOc = !fOc || o.odc_id === fOc;
      var matchKap = !kapSet.size || kapSet.has(odpCapClass(o));
      var matchAreaMulti = !areaSet.size || areaSet.has(o.area_id);
      return matchQ && matchSt && matchAr && matchOc && matchKap && matchAreaMulti;
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
