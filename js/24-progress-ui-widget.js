
(function(){
  var _els = {};
  function el(id){ return _els[id] || (_els[id]=document.getElementById(id)); }

  var _autoCloseTimer = null;
  var _state = 'idle';

  var ProgUI = {
    /* Buka modal & mulai proses. opts: {title, step, total} */
    open: function(opts){
      opts = opts || {};
      _state = 'running';
      clearTimeout(_autoCloseTimer);
      if(el('progui-title')) el('progui-title').textContent = opts.title || 'Memproses…';
      this.setIco('spin');
      this.step(opts.step || 'Mempersiapkan…', 0, opts.total || 0);
      var logEl = el('progui-log'); if(logEl){ logEl.innerHTML=''; logEl.classList.remove('on'); }
      var closeBtn = el('progui-close-btn'); if(closeBtn) closeBtn.classList.remove('on');
      var bar = el('progui-bar'); if(bar){ bar.classList.remove('ok','err'); }
      var ov = el('progui-overlay'); if(ov) ov.classList.add('on');
      return this;
    },
    /* Update step label + persentase. pct 0-100, atau berikan done/total agar dihitung otomatis */
    step: function(label, pct, doneOverTotal){
      if(el('progui-step') && label!=null) el('progui-step').textContent = label;
      var pctVal = pct;
      var countTxt = '';
      if(typeof doneOverTotal === 'number' && doneOverTotal > 0){
        /* pct param di sini dipakai sbg "done", doneOverTotal sbg "total" */
        var done = pct, total = doneOverTotal;
        pctVal = total>0 ? Math.min(100, Math.round(done/total*100)) : 0;
        countTxt = done+' / '+total;
      }
      if(typeof pctVal === 'number'){
        pctVal = Math.max(0, Math.min(100, pctVal));
        if(el('progui-bar')) el('progui-bar').style.width = pctVal+'%';
        if(el('progui-pct')) el('progui-pct').textContent = pctVal+'%';
      }
      if(el('progui-count')) el('progui-count').textContent = countTxt;
      return this;
    },
    /* Tambah baris log kecil (mis. "Batch 2/5 tersimpan") */
    log: function(msg, isErr){
      var logEl = el('progui-log'); if(!logEl) return this;
      logEl.classList.add('on');
      var row = document.createElement('div');
      row.className = 'progui-log-item'+(isErr?' err':'');
      row.innerHTML = '<i class="ti ti-'+(isErr?'alert-circle':'circle-check')+'"></i><span></span>';
      row.querySelector('span').textContent = msg;
      logEl.appendChild(row);
      logEl.scrollTop = logEl.scrollHeight;
      return this;
    },
    setIco: function(kind){
      var ico = el('progui-ico'); if(!ico) return this;
      ico.className = 'progui-ico '+kind;
      var i = ico.querySelector('i'); if(!i) return this;
      i.className = kind==='ok' ? 'ti ti-circle-check' : (kind==='err' ? 'ti ti-alert-triangle' : 'ti ti-loader-2');
      return this;
    },
    /* Tandai selesai sukses. autoCloseMs=0 berarti tidak auto-close (tunggu user klik Tutup) */
    success: function(msg, autoCloseMs){
      _state = 'done';
      this.setIco('ok');
      if(el('progui-title')) el('progui-title').textContent = msg || 'Selesai';
      if(el('progui-step')) el('progui-step').textContent = 'Proses berhasil diselesaikan';
      if(el('progui-bar')){ el('progui-bar').classList.add('ok'); el('progui-bar').style.width='100%'; }
      if(el('progui-pct')) el('progui-pct').textContent = '100%';
      var closeBtn = el('progui-close-btn'); if(closeBtn) closeBtn.classList.add('on');
      clearTimeout(_autoCloseTimer);
      if(autoCloseMs !== 0){
        var self=this;
        _autoCloseTimer = setTimeout(function(){ self.close(); }, autoCloseMs || 1400);
      }
      return this;
    },
    /* Tandai gagal — modal tetap terbuka sampai user menutup manual */
    error: function(msg){
      _state = 'error';
      this.setIco('err');
      if(el('progui-title')) el('progui-title').textContent = 'Gagal';
      if(el('progui-step')) el('progui-step').textContent = msg || 'Terjadi kesalahan';
      if(el('progui-bar')) el('progui-bar').classList.add('err');
      var closeBtn = el('progui-close-btn'); if(closeBtn) closeBtn.classList.add('on');
      clearTimeout(_autoCloseTimer);
      return this;
    },
    close: function(){
      _state = 'idle';
      clearTimeout(_autoCloseTimer);
      var ov = el('progui-overlay'); if(ov) ov.classList.remove('on');
      return this;
    },
    isOpen: function(){ return _state==='running' || _state==='done' || _state==='error'; }
  };

  window.ProgUI = ProgUI;
})();
