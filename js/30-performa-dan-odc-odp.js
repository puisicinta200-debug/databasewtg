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
