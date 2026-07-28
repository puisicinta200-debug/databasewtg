/* =====================================================================
   PATCH 29 — RINGKASAN OWNER: WIDGET "RINGKASAN UTAMA" (BARU)
   ---------------------------------------------------------------------
   File ini TIDAK mengedit js/05-owner-dashboard.js maupun 03-app-core.js.
   Fungsi asli (_owdBuildAll, owdPaneLoad, drill-down Area>Kec>Kel>RW>RT,
   tab Audit ODP) dibiarkan 100% seperti semula — cuma dibungkus supaya
   setelah selesai menghitung data, widget BARU ini ikut ditampilkan
   di ATAS 2 tab yang sudah ada (Pelanggan & Audit ODP), pakai data yang
   SAMA yang sudah diambil (SOT cache) — tanpa pengambilan data baru,
   KECUALI 1 query kecil untuk snapshot pendapatan bulan ini.

   WIDGET BARU:
   1) Health Strip: Pelanggan Aktif (+tren vs bulan lalu), Non-Aktif %,
      Utilisasi Port Global, Pendapatan Bulan Ini.
   2) Tren Pertumbuhan: pelanggan baru per bulan, 6 bulan terakhir
      (dihitung dari tgl_pasang — data yang sudah ada, bukan rekayasa).
   3) Papan Peringkat Area: 3 area dengan pelanggan aktif terbanyak,
      dan area dengan tingkat non-aktif tertinggi (perlu perhatian).
===================================================================== */
(function(){
  'use strict';

  function esc(s){ return (typeof _owdEsc === 'function') ? _owdEsc(s) : String(s == null ? '' : s); }

  var _revenueCache = null; // null = belum diambil sama sekali
  function fetchRevenueOnce(cb){
    if (_revenueCache !== null){ cb(_revenueCache); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ cb(null); return; }
    var now = new Date();
    var periode = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
    sb.from('fee_recurring').select('status,nominal,total_recurring').eq('periode', periode).then(function(r){
      if (r.error){ _revenueCache = false; cb(false); return; }
      var rows = r.data || [];
      var sum = function(pred){ return rows.filter(pred).reduce(function(s, x){ return s + (parseFloat(x.total_recurring || x.nominal) || 0); }, 0); };
      _revenueCache = {
        periode: periode,
        siapBayar: sum(function(x){ return x.status === 'siap_bayar' || x.status === 'paid'; }),
        pending: sum(function(x){ return x.status === 'menunggu_validasi' || x.status === 'draft'; }),
        totalTagihan: rows.reduce(function(s, x){ return s + (parseFloat(x.total_recurring || x.nominal) || 0); }, 0),
        jumlahTagihan: rows.length,
      };
      cb(_revenueCache);
    }).catch(function(){ _revenueCache = false; cb(false); });
  }

  function fmtRupiah(n){
    n = Math.round(n || 0);
    if (n >= 1000000000) return 'Rp' + (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000000) return 'Rp' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
    if (n >= 1000) return 'Rp' + Math.round(n / 1000) + 'rb';
    return 'Rp' + n;
  }

  function monthKey(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
  function monthLabel(d){
    var bln = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return bln[d.getMonth()];
  }

  function ensureRoot(){
    if (document.getElementById('owd-ov-root')) return true;
    var content = document.getElementById('owd-content');
    if (!content) return false;
    var root = document.createElement('div');
    root.id = 'owd-ov-root';
    root.style.marginBottom = '16px';
    root.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px" id="owd-ov-health"></div>' +
      '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:14px;margin-bottom:12px">' +
        '<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--text);margin-bottom:2px"><i class="ti ti-trending-up" style="color:var(--c1)"></i> Tren Pelanggan Baru (6 Bulan)</div>' +
        '<div style="font-size:10px;color:var(--text3);margin-bottom:10px">Dihitung dari tanggal pasang pelanggan</div>' +
        '<div id="owd-ov-trend"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:12px">' +
        '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:14px">' +
          '<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--text);margin-bottom:8px"><i class="ti ti-trophy" style="color:var(--yellow)"></i> Area Pelanggan Terbanyak</div>' +
          '<div id="owd-ov-top"></div>' +
        '</div>' +
        '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:14px">' +
          '<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--text);margin-bottom:8px"><i class="ti ti-alert-triangle" style="color:var(--red)"></i> Perlu Perhatian (Non-Aktif Tertinggi)</div>' +
          '<div id="owd-ov-worst"></div>' +
        '</div>' +
      '</div>';
    content.insertBefore(root, content.firstChild);
    if (window.innerWidth >= 900) document.getElementById('owd-ov-health').style.gridTemplateColumns = 'repeat(4,1fr)';
    return true;
  }

  function healthCard(icon, c, bg, label, value, unit, sub){
    return '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:12px">' +
      '<div style="width:26px;height:26px;border-radius:8px;background:' + bg + ';display:flex;align-items:center;justify-content:center;margin-bottom:8px"><i class="ti ' + icon + '" style="font-size:13px;color:' + c + '"></i></div>' +
      '<div style="font-family:monospace;font-size:18px;font-weight:800;color:var(--text);line-height:1">' + value + '<span style="font-size:11px;color:var(--text3);font-weight:600;margin-left:2px">' + unit + '</span></div>' +
      '<div style="font-size:9.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-top:4px">' + label + '</div>' +
      (sub ? '<div style="font-size:9.5px;color:' + c + ';font-weight:700;margin-top:2px">' + sub + '</div>' : '') +
    '</div>';
  }

  function renderHealth(c){
    var el = document.getElementById('owd-ov-health');
    if (!el) return;
    var pels = c.pelanggan || [], odps = c.odps || [];
    var aktifList = pels.filter(function(p){ return p.status === 'aktif'; });
    var nonAktif = pels.filter(function(p){ return p.status === 'suspend' || p.status === 'cabut'; });
    var totalTerdaftar = aktifList.length + nonAktif.length;
    var churnPct = totalTerdaftar ? Math.round(nonAktif.length / totalTerdaftar * 100) : 0;

    var now = new Date();
    var bulanIni = monthKey(now);
    var bulanLalu = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    var baruBulanIni = pels.filter(function(p){ return p.tgl_pasang && p.tgl_pasang.slice(0, 7) === bulanIni; }).length;
    var baruBulanLalu = pels.filter(function(p){ return p.tgl_pasang && p.tgl_pasang.slice(0, 7) === bulanLalu; }).length;
    var trendTxt = baruBulanLalu === 0 ? (baruBulanIni > 0 ? '+' + baruBulanIni + ' baru' : 'Tidak ada data') :
      (baruBulanIni >= baruBulanLalu ? '▲ ' : '▼ ') + Math.abs(Math.round((baruBulanIni - baruBulanLalu) / baruBulanLalu * 100)) + '% vs bulan lalu';

    var kap = odps.reduce(function(s, o){ return s + (parseInt(o.jumlah_port) || 0); }, 0);
    var pctKap = kap ? Math.round(aktifList.length / kap * 100) : 0;

    el.innerHTML =
      healthCard('ti-users', 'var(--c1)', 'var(--c1b)', 'Pelanggan Aktif', aktifList.length, '', trendTxt) +
      healthCard('ti-user-x', churnPct > 10 ? 'var(--red)' : 'var(--yellow)', churnPct > 10 ? 'var(--rg2)' : 'var(--yg)', 'Non-Aktif', churnPct, '%', nonAktif.length + ' pelanggan') +
      healthCard('ti-plug-connected', 'var(--pu)', 'var(--pug,rgba(124,58,237,.08))', 'Utilisasi Port', pctKap, '%', kap + ' port total') +
      '<div id="owd-ov-revenue">' + healthCard('ti-cash', 'var(--green)', 'var(--gng2)', 'Pendapatan Bulan Ini', '…', '', 'Memuat…') + '</div>';

    fetchRevenueOnce(function(rev){
      var box = document.getElementById('owd-ov-revenue');
      if (!box) return;
      if (!rev){ box.innerHTML = healthCard('ti-cash', 'var(--text3)', 'var(--bg3)', 'Pendapatan Bulan Ini', '—', '', 'Tidak tersedia'); return; }
      box.innerHTML = healthCard('ti-cash', 'var(--green)', 'var(--gng2)', 'Pendapatan Bulan Ini', fmtRupiah(rev.siapBayar), '', fmtRupiah(rev.pending) + ' menunggu konfirmasi');
    });
  }

  function renderTrend(c){
    var el = document.getElementById('owd-ov-trend');
    if (!el) return;
    var pels = c.pelanggan || [];
    var months = [];
    var now = new Date();
    for (var i = 5; i >= 0; i--){ months.push(new Date(now.getFullYear(), now.getMonth() - i, 1)); }
    var counts = months.map(function(d){
      var key = monthKey(d);
      return { label: monthLabel(d), n: pels.filter(function(p){ return p.tgl_pasang && p.tgl_pasang.slice(0, 7) === key; }).length };
    });
    var max = Math.max.apply(null, counts.map(function(x){ return x.n; })) || 1;
    el.innerHTML = '<div style="display:flex;align-items:flex-end;gap:8px;height:90px">' +
      counts.map(function(x){
        var h = Math.max(4, Math.round(x.n / max * 74));
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%">' +
          '<div style="font-size:10px;font-weight:800;color:var(--text);margin-bottom:3px">' + x.n + '</div>' +
          '<div style="width:100%;max-width:34px;height:' + h + 'px;background:var(--c1);border-radius:5px 5px 0 0;opacity:.85"></div>' +
          '<div style="font-size:9px;color:var(--text3);margin-top:5px;font-weight:700">' + x.label + '</div>' +
        '</div>';
      }).join('') + '</div>';
  }

  function renderLeaderboards(c){
    var areas = c.areas || [], pels = c.pelanggan || [];
    var rows = areas.map(function(a){
      var ap = pels.filter(function(p){ return p.area_id === a.id; });
      var aktif = ap.filter(function(p){ return p.status === 'aktif'; }).length;
      var nonAktif = ap.filter(function(p){ return p.status === 'suspend' || p.status === 'cabut'; }).length;
      var total = aktif + nonAktif;
      return { nama: a.nama || a.kode || a.id, aktif: aktif, nonAktif: nonAktif, total: total, pctNon: total ? Math.round(nonAktif / total * 100) : 0 };
    }).filter(function(r){ return r.total > 0; });

    var top = document.getElementById('owd-ov-top');
    if (top){
      var byAktif = rows.slice().sort(function(a, b){ return b.aktif - a.aktif; }).slice(0, 3);
      top.innerHTML = byAktif.length ? byAktif.map(function(r, i){
        var medal = ['🥇', '🥈', '🥉'][i] || '';
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">' +
          '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:15px">' + medal + '</span><span style="font-size:12px;font-weight:700;color:var(--text)">' + esc(r.nama) + '</span></div>' +
          '<span style="font-family:monospace;font-size:13px;font-weight:800;color:var(--c1)">' + r.aktif + '</span>' +
        '</div>';
      }).join('') : '<div style="font-size:11px;color:var(--text3);text-align:center;padding:10px">Belum ada data</div>';
    }

    var worst = document.getElementById('owd-ov-worst');
    if (worst){
      var byNon = rows.slice().filter(function(r){ return r.nonAktif > 0; }).sort(function(a, b){ return b.pctNon - a.pctNon; }).slice(0, 3);
      worst.innerHTML = byNon.length ? byNon.map(function(r){
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">' +
          '<div><span style="font-size:12px;font-weight:700;color:var(--text)">' + esc(r.nama) + '</span><div style="font-size:9.5px;color:var(--text3)">' + r.nonAktif + ' dari ' + r.total + ' pelanggan</div></div>' +
          '<span style="font-family:monospace;font-size:13px;font-weight:800;color:var(--red)">' + r.pctNon + '%</span>' +
        '</div>';
      }).join('') : '<div style="font-size:11px;color:var(--green);text-align:center;padding:10px"><i class="ti ti-circle-check"></i> Semua area dalam kondisi baik</div>';
    }
  }

  var _origOwdBuildAll = window._owdBuildAll;
  window._owdBuildAll = function(c){
    if (typeof _origOwdBuildAll === 'function') _origOwdBuildAll(c);
    if (!ensureRoot()) return;
    try{ renderHealth(c); }catch(e){ console.error('[owd-overview]', e); }
    try{ renderTrend(c); }catch(e){ console.error('[owd-overview]', e); }
    try{ renderLeaderboards(c); }catch(e){ console.error('[owd-overview]', e); }
  };

})();
