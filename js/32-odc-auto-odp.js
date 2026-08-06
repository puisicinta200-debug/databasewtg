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
