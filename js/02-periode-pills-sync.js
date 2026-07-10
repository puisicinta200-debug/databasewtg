
/* ── Sync periode pills ke hidden select ── */
(function(){
  /* Map shortcut ke nilai hidden select */
  var MAP = {
    thisDay:   'hari',
    thisWeek:  'minggu',
    thisMonth: 'bulan',
    thisYear:  'tahun',
    lastMonth: 'custom',
    semua:     'semua'
  };
  /* Highlight pill yang aktif */
  function _highlightPill(activeShortcut){
    var PILLS = { thisDay:'hari', thisWeek:'minggu', thisMonth:'bulan', thisYear:'tahun' };
    document.querySelectorAll('#fin-pane-dashboard .fdp-pill').forEach(function(b){
      b.classList.remove('on');
    });
    Object.keys(PILLS).forEach(function(k){
      if(k === activeShortcut){
        var idx = { thisDay:0, thisWeek:1, thisMonth:2, thisYear:3 }[k];
        var pills = document.querySelectorAll('#fin-pane-dashboard .fdp-pill');
        if(pills[idx]) pills[idx].classList.add('on');
      }
    });
    /* Custom = last pill */
    if(!PILLS[activeShortcut]){
      var pills2 = document.querySelectorAll('#fin-pane-dashboard .fdp-pill');
      if(pills2[4]) pills2[4].classList.add('on');
    }
  }

  /* Override _fdpShortcut jika belum ada (guard) */
  var _origShortcut = window._fdpShortcut;
  window._fdpShortcutPill = function(shortcut){
    _highlightPill(shortcut);
    if(typeof _origShortcut === 'function'){
      _origShortcut(shortcut);
    }
  };

  /* Patch pills onclick di atas ke wrapper */
  document.querySelectorAll('#fin-pane-dashboard .fdp-pill').forEach(function(btn){
    var onclick = btn.getAttribute('onclick');
    if(onclick && onclick.indexOf('_fdpShortcut') >= 0){
      var match = onclick.match(/_fdpShortcut\('([^']+)'\)/);
      if(match){
        var shortcut = match[1];
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function(){
          _highlightPill(shortcut);
          if(typeof window._fdpShortcut === 'function') window._fdpShortcut(shortcut);
        });
      }
    }
  });
})();
