
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
