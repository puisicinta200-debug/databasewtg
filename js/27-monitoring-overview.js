/* =====================================================================
   PATCH 27 — MONITORING JARINGAN: OVERVIEW BARU (TAHAP 1)
   ---------------------------------------------------------------------
   File ini TIDAK mengedit js/03-app-core.js. Fungsi asli
   (_monAreaInit, _monAreaRenderBanner, _monAreaRenderCards, monTab,
   monMasalahLoad, dst) dibiarkan 100% seperti semula — file ini cuma
   MENAMBAH widget baru ke tab "Area" (halaman utama Monitoring), dan
   membaca ulang data yang SAMA yang sudah diambil (SOT cache +
   _monOltData) — tidak menambah pengambilan data baru ke server,
   KECUALI 1 query kecil khusus untuk data sinyal (dijelaskan di bawah).

   PERBAIKAN BUG LAMA (tidak berhubungan dengan permintaan, ditemukan
   saat audit): window.monLoad sebelumnya ditimpa jadi fungsi kosong
   oleh patch lama, sehingga Monitoring tidak auto-refresh saat ada
   perubahan data real-time. Diperbaiki di bagian bawah file ini.

   WARNA & GAYA: memakai variabel CSS yang SUDAH ADA di app ini
   (var(--c1), var(--c2), var(--green), var(--yellow), var(--red),
   var(--pu), var(--bg2), var(--border), dst) — bukan skema warna baru.
===================================================================== */
(function(){
  'use strict';

  /* ================= state topologi (expand/collapse, zoom) ================= */
  var _topoExpanded = null; // Set, diisi saat pertama render
  var _topoZoom = 1;
  var _topoOnlyIssue = false;
  var _topoQuery = '';
  var _topoTree = null;      // pohon hasil build terakhir (untuk detail sheet)
  var _signalRows = null;    // cache hasil query sinyal (null = belum diambil)
  var _odcOltMap = null;     // cache pemetaan odc_id -> olt_id (null = belum diambil)

  function fetchOdcOltMapOnce(cb){
    if (_odcOltMap){ cb(_odcOltMap); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb){ cb({}); return; }
    // Query KECIL & terpisah — kolom olt_id tidak ikut di cache bersama (SOT),
    // jadi diambil sendiri di sini supaya ODC ditampilkan di bawah OLT yang
    // BENAR, bukan mengubah query cache bersama yang dipakai menu lain.
    sb.from('odcs').select('id,olt_id').limit(5000).then(function(r){
      var map = {};
      (r.data || []).forEach(function(o){ if (o.olt_id) map[o.id] = o.olt_id; });
      _odcOltMap = map;
      cb(map);
    }).catch(function(){ cb({}); });
  }

  function esc(s){ return (typeof _monEsc === 'function') ? _monEsc(s) : String(s == null ? '' : s); }
  function areaName(id){ return (typeof _monAreaName === 'function') ? _monAreaName(id) : (id || '—'); }

  /* ================= bangun pohon Area>OLT>ODC>ODP dari data NYATA ================= */
  function buildTree(sc, odcOltMap){
    var JG = (typeof JENIS_GRATIS !== 'undefined') ? JENIS_GRATIS : ['FASUM', 'ODP_TEMPEL', 'ODC_TEMPEL'];
    var areas = sc.areas || [], odcs = sc.odcs || [], odps = sc.odps || [], ports = sc.ports || [];
    var olts = (typeof _monOltData !== 'undefined') ? _monOltData : [];
    odcOltMap = odcOltMap || {};

    function aggPorts(odpList){
      var oids = {}; odpList.forEach(function(o){ oids[o.id] = 1; });
      var cap = odpList.reduce(function(s, o){ return s + (parseInt(o.jumlah_port) || 0); }, 0);
      var pset = {};
      ports.filter(function(p){ return oids[p.odp_id] && p.status === 'terpakai' && p.nomor_port != null; })
        .forEach(function(p){ pset[p.odp_id + '::' + p.nomor_port] = 1; });
      return { cap: cap, used: Object.keys(pset).length };
    }

    function buildOdcNode(c){
      var cOdp = odps.filter(function(p){ return p.odc_id === c.id; });
      var odpNodes = cOdp.map(function(p){
        var pp = aggPorts([p]);
        return { id: p.id, type: 'odp', kode: p.kode || p.nama, status: p.status, cap: pp.cap, used: pp.used, children: [], raw: p };
      });
      var pc = aggPorts(cOdp);
      return { id: c.id, type: 'odc', kode: c.kode || c.nama, status: c.status, cap: pc.cap, used: pc.used, children: odpNodes, raw: c };
    }

    var areaNodes = areas.map(function(a){
      var aOlt = olts.filter(function(o){ return o.area_id === a.id; });
      var aOdcArea = odcs.filter(function(c){ return c.area_id === a.id; });
      var assignedOdcIds = {};
      var oltNodes = aOlt.map(function(o){
        var oOdc = aOdcArea.filter(function(c){ return odcOltMap[c.id] === o.id; });
        oOdc.forEach(function(c){ assignedOdcIds[c.id] = 1; });
        var odcNodes = oOdc.map(buildOdcNode);
        var allOdpUnderOlt = [];
        odcNodes.forEach(function(c){ c.children.forEach(function(p){ allOdpUnderOlt.push(p.raw); }); });
        var po = aggPorts(allOdpUnderOlt);
        return { id: o.id, type: 'olt', kode: o.kode, status: o.status, lokasi: o.lokasi, cap: po.cap, used: po.used, children: odcNodes, raw: o };
      });
      // ODC yang belum terhubung ke OLT manapun (data belum lengkap) — tetap
      // ditampilkan langsung di bawah Area, supaya tidak hilang diam-diam.
      var orphanOdcNodes = aOdcArea.filter(function(c){ return !assignedOdcIds[c.id]; }).map(buildOdcNode);
      var childNodes = oltNodes.concat(orphanOdcNodes);

      var allOdpUnderArea = odps.filter(function(p){ return p.area_id === a.id; });
      var pa = aggPorts(allOdpUnderArea);
      var anyDown = oltNodes.some(function(o){ return o.status === 'down'; });
      var anyIssue = childNodes.some(function(o){ return o.status !== 'aktif'; }) ||
        oltNodes.some(function(o){ return o.children.some(function(c){ return c.status !== 'aktif'; }); });
      return {
        id: a.id, type: 'area', kode: a.nama || a.kode, status: anyDown ? 'down' : (anyIssue ? 'maintenance' : 'aktif'),
        cap: pa.cap, used: pa.used, children: childNodes, raw: a,
      };
    });

    return { id: 'root', type: 'root', kode: 'Seluruh Jaringan', status: 'aktif',
      cap: areaNodes.reduce(function(s, a){ return s + a.cap; }, 0),
      used: areaNodes.reduce(function(s, a){ return s + a.used; }, 0),
      children: areaNodes };
  }

  function findNode(node, id){
    if (node.id === id) return node;
    for (var i = 0; i < (node.children || []).length; i++){ var f = findNode(node.children[i], id); if (f) return f; }
    return null;
  }
  function ancestorIds(node, id, trail){
    trail = trail || [];
    if (node.id === id) return trail;
    for (var i = 0; i < (node.children || []).length; i++){
      var r = ancestorIds(node.children[i], id, trail.concat([node.id]));
      if (r) return r;
    }
    return null;
  }
  function hasIssueDeep(node){
    if (node.status !== 'aktif' && node.status !== 'full') return true;
    return (node.children || []).some(hasIssueDeep);
  }
  function countLeaf(node){
    if (node.type === 'odp') return 1;
    return (node.children || []).reduce(function(s, c){ return s + countLeaf(c); }, 0);
  }

  var STAT_COLOR = { aktif: 'var(--green)', full: 'var(--green)', maintenance: 'var(--yellow)', down: 'var(--red)', planning: 'var(--text3)' };
  var STAT_BG    = { aktif: 'var(--gng2)', full: 'var(--gng2)', maintenance: 'var(--yg,rgba(217,119,6,.12))', down: 'var(--rg2)', planning: 'var(--bg3)' };
  var TYPE_ICON  = { root: 'ti-topology-star', area: 'ti-map-pin', olt: 'ti-antenna', odc: 'ti-box', odp: 'ti-plug' };

  /* ================= layout pohon (node-link) ================= */
  var NODE_W = 132, NODE_H = 58, LEVEL_H = 96, LEAF_GAP = 148;

  function layoutTree(root, expanded){
    var cursor = 0;
    var pos = {};
    var edges = [];
    function visit(node, depth, parentId){
      var canExpand = node.children && node.children.length > 0;
      var isOpen = canExpand && expanded.has(node.id);
      var x;
      if (!isOpen){
        x = cursor * LEAF_GAP + LEAF_GAP / 2;
        cursor += 1;
      } else {
        var xs = node.children.map(function(c){ return visit(c, depth + 1, node.id); });
        x = (xs[0] + xs[xs.length - 1]) / 2;
      }
      pos[node.id] = { x: x, y: depth * LEVEL_H, node: node, depth: depth, canExpand: canExpand, isOpen: isOpen };
      if (parentId) edges.push({ from: parentId, to: node.id });
      return x;
    }
    visit(root, 0, null);
    var maxDepth = 0;
    Object.keys(pos).forEach(function(k){ if (pos[k].depth > maxDepth) maxDepth = pos[k].depth; });
    return { pos: pos, edges: edges, width: Math.max(cursor * LEAF_GAP, LEAF_GAP), height: (maxDepth + 1) * LEVEL_H + NODE_H + 30 };
  }
  function edgePath(a, b){
    var x1 = a.x, y1 = a.y + NODE_H, x2 = b.x, y2 = b.y, midY = (y1 + y2) / 2;
    return 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + midY + ', ' + x2 + ' ' + midY + ', ' + x2 + ' ' + y2;
  }

  /* ================= render 1 kotak node ================= */
  function nodeHTML(p, selectedDim){
    var n = p.node;
    var col = STAT_COLOR[n.status] || STAT_COLOR.planning;
    var bg = STAT_BG[n.status] || STAT_BG.planning;
    var icon = TYPE_ICON[n.type] || 'ti-circle';
    var pct = n.cap ? Math.round((n.used / n.cap) * 100) : null;
    var sub = '';
    if (n.type === 'root') sub = countLeaf(n) + ' ODP total';
    else if (n.type === 'area') sub = n.children.length + ' OLT · ' + countLeaf(n) + ' ODP';
    else if (n.type === 'olt') sub = esc(n.lokasi || (n.children.length + ' ODC'));
    else if (n.type === 'odc') sub = n.children.length + ' ODP';
    else if (n.type === 'odp') sub = n.used + '/' + n.cap + ' port';

    var barHtml = pct != null
      ? '<div style="margin-top:5px;display:flex;align-items:center;gap:5px">'+
          '<div style="flex:1;height:4px;border-radius:4px;background:var(--bg4);overflow:hidden">'+
            '<div style="height:100%;width:'+Math.min(100,pct)+'%;background:'+(pct>=85?'var(--red)':pct>=60?'var(--yellow)':'var(--c1)')+'"></div>'+
          '</div><span style="font-size:9px;color:var(--text3);font-weight:700">'+pct+'%</span>'+
        '</div>'
      : '';

    var toggleHtml = p.canExpand
      ? '<button onclick="event.stopPropagation();_monTopoToggle(\''+n.id+'\')" style="position:absolute;left:50%;bottom:-11px;transform:translateX(-50%);width:22px;height:22px;border-radius:50%;background:var(--bg2);border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;color:var(--text2);cursor:pointer;z-index:2;touch-action:manipulation"><i class="ti '+(p.isOpen ? 'ti-minus' : 'ti-plus')+'" style="font-size:12px"></i></button>'
      : '';

    return '<div style="position:absolute;left:'+(p.x - NODE_W/2)+'px;top:'+p.y+'px;width:'+NODE_W+'px;opacity:'+(selectedDim ? .3 : 1)+';transition:opacity .2s">'+
      '<button onclick="_monTopoOpenDetail(\''+n.id+'\')" style="width:100%;text-align:left;background:var(--bg2);border:1.5px solid '+col+'55;border-radius:12px;padding:7px 8px;cursor:pointer;box-shadow:var(--sh-sm);touch-action:manipulation">'+
        '<div style="display:flex;align-items:center;gap:6px">'+
          '<div style="width:24px;height:24px;border-radius:7px;background:'+bg+';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti '+icon+'" style="font-size:12px;color:'+col+'"></i></div>'+
          '<div style="min-width:0;flex:1">'+
            '<div style="display:flex;align-items:center;gap:4px"><span style="font-size:11px;font-weight:800;color:var(--text);font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(n.kode)+'</span>'+
              '<span style="width:6px;height:6px;border-radius:50%;background:'+col+';flex-shrink:0"></span></div>'+
            '<div style="font-size:9px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sub+'</div>'+
          '</div>'+
        '</div>'+
        barHtml+
      '</button>'+
      toggleHtml+
    '</div>';
  }

  /* ================= render diagram penuh ================= */
  function renderTopology(){
    var host = document.getElementById('mon-topo-canvas');
    var innerWrap = document.getElementById('mon-topo-innerwrap');
    if (!host || !_topoTree) return;

    var layout = layoutTree(_topoTree, _topoExpanded);
    var dimSet = null;
    if (_topoOnlyIssue){
      dimSet = {};
      (function walk(n){ if (hasIssueDeep(n)) dimSet[n.id] = 1; (n.children || []).forEach(walk); })(_topoTree);
    }

    var svg = '<svg width="'+layout.width+'" height="'+layout.height+'" style="position:absolute;left:0;top:0;pointer-events:none">';
    layout.edges.forEach(function(e, i){
      var a = layout.pos[e.from], b = layout.pos[e.to];
      if (!a || !b) return;
      var d = edgePath(a, b);
      var dim = dimSet && !(dimSet[e.from] && dimSet[e.to]);
      svg += '<g opacity="'+(dim ? 0.15 : 1)+'">'+
        '<path d="'+d+'" fill="none" stroke="var(--border3)" stroke-width="1.5" />'+
        '<circle r="2.6" fill="var(--c1)"><animateMotion dur="'+(2.4 + (i % 4) * .4)+'s" repeatCount="indefinite" begin="'+((i % 6) * .25)+'s" path="'+d+'" /></circle>'+
      '</g>';
    });
    svg += '</svg>';

    var nodesHtml = Object.keys(layout.pos).map(function(id){
      var p = layout.pos[id];
      var dim = dimSet ? !dimSet[id] : false;
      return nodeHTML(p, dim);
    }).join('');

    innerWrap.style.width = layout.width + 'px';
    innerWrap.style.height = layout.height + 'px';
    innerWrap.style.transform = 'scale(' + _topoZoom + ')';
    innerWrap.style.transformOrigin = 'top left';
    innerWrap.innerHTML = svg + nodesHtml;

    var zoomLbl = document.getElementById('mon-topo-zoomlbl');
    if (zoomLbl) zoomLbl.textContent = Math.round(_topoZoom * 100) + '%';
    var countLbl = document.getElementById('mon-topo-count');
    if (countLbl) countLbl.textContent = _topoTree.children.length + ' Area · ' + (typeof _monOltData!=='undefined'?_monOltData.length:0) + ' OLT · ' + countLeaf(_topoTree) + ' ODP';
  }

  window._monTopoToggle = function(id){
    if (_topoExpanded.has(id)) _topoExpanded.delete(id); else _topoExpanded.add(id);
    renderTopology();
  };
  window._monTopoZoomSet = function(delta){
    if (delta === 0) _topoZoom = 1;
    else _topoZoom = Math.max(.5, Math.min(1.5, +(_topoZoom + delta).toFixed(1)));
    renderTopology();
  };
  window._monTopoToggleIssueFilter = function(){
    _topoOnlyIssue = !_topoOnlyIssue;
    var btn = document.getElementById('mon-topo-fil-btn');
    if (btn){
      btn.style.background = _topoOnlyIssue ? 'var(--yg,rgba(217,119,6,.12))' : 'var(--bg2)';
      btn.style.color = _topoOnlyIssue ? 'var(--yellow)' : 'var(--text3)';
      btn.style.borderColor = _topoOnlyIssue ? 'var(--yellow)' : 'var(--border2)';
    }
    renderTopology();
  };
  window._monTopoSearch = function(q){
    _topoQuery = (q || '').trim().toLowerCase();
    if (!_topoQuery || !_topoTree) return;
    var found = null;
    (function walk(n){ if (!found && String(n.kode||'').toLowerCase().indexOf(_topoQuery) >= 0) found = n; (n.children||[]).forEach(walk); })(_topoTree);
    if (!found) return;
    var trail = ancestorIds(_topoTree, found.id) || [];
    trail.concat([found.id]).forEach(function(id){ _topoExpanded.add(id); });
    renderTopology();
    setTimeout(function(){
      var layout = layoutTree(_topoTree, _topoExpanded);
      var p = layout.pos[found.id];
      var canvas = document.getElementById('mon-topo-canvas');
      if (p && canvas) canvas.scrollTo({ left: Math.max(0, p.x * _topoZoom - canvas.clientWidth/2), top: Math.max(0, p.y * _topoZoom - 60), behavior: 'smooth' });
    }, 30);
  };
  window._monTopoExpandAll = function(){
    var all = new Set();
    (function walk(n){ all.add(n.id); (n.children||[]).forEach(walk); })(_topoTree);
    _topoExpanded = all;
    renderTopology();
  };
  window._monTopoCollapseAll = function(){
    _topoExpanded = new Set(['root']);
    renderTopology();
  };

  /* ================= detail sheet (pakai chrome overlay yang SUDAH ADA) ================= */
  window._monTopoOpenDetail = function(id){
    var n = findNode(_topoTree, id);
    if (!n) return;
    var overlay = document.getElementById('mon-topo-overlay');
    if (!overlay) return;
    var col = STAT_COLOR[n.status] || STAT_COLOR.planning;
    var bg = STAT_BG[n.status] || STAT_BG.planning;
    var pct = n.cap ? Math.round((n.used / n.cap) * 100) : null;
    var typeLabel = { root:'Ringkasan', area:'Area', olt:'OLT', odc:'ODC', odp:'ODP' }[n.type];

    var childRows = '';
    if (n.children && n.children.length){
      childRows = '<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 8px">'+
        (n.type==='root'?'Area':n.type==='area'?'OLT':n.type==='olt'?'ODC':'ODP')+' di Bawahnya</div>'+
        n.children.map(function(c){
          var cc = STAT_COLOR[c.status] || STAT_COLOR.planning;
          return '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg3);border-radius:10px;padding:9px 12px;margin-bottom:6px">'+
            '<div style="display:flex;align-items:center;gap:7px;min-width:0"><span style="width:7px;height:7px;border-radius:50%;background:'+cc+';flex-shrink:0"></span><span style="font-family:monospace;font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(c.kode)+'</span></div>'+
            '<span style="font-size:10px;font-weight:700;color:'+cc+';flex-shrink:0;text-transform:capitalize">'+esc(c.status)+'</span>'+
          '</div>';
        }).join('');
    }

    var body = document.getElementById('mon-topo-det-body');
    if (body){
      body.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'+
          '<div style="width:40px;height:40px;border-radius:11px;background:'+bg+';display:flex;align-items:center;justify-content:center"><i class="ti '+(TYPE_ICON[n.type]||'ti-circle')+'" style="font-size:19px;color:'+col+'"></i></div>'+
          '<div><div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">'+typeLabel+'</div><div style="font-size:15px;font-weight:800;color:var(--text);font-family:monospace">'+esc(n.kode)+'</div></div>'+
        '</div>'+
        '<div style="display:inline-flex;align-items:center;gap:6px;background:'+bg+';padding:6px 12px;border-radius:20px;margin-bottom:14px"><span style="width:7px;height:7px;border-radius:50%;background:'+col+'"></span><span style="font-size:11px;font-weight:700;color:'+col+';text-transform:capitalize">'+esc(n.status)+'</span></div>'+
        (pct != null ? (
          '<div style="background:var(--bg3);border-radius:12px;padding:12px 14px;margin-bottom:8px">'+
            '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px"><span><i class="ti ti-plug-connected" style="font-size:12px"></i> Utilisasi Port</span><span style="color:'+(pct>=85?'var(--red)':pct>=60?'var(--yellow)':'var(--c1)')+'">'+pct+'%</span></div>'+
            '<div style="height:6px;background:var(--bg4);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+Math.min(100,pct)+'%;background:'+(pct>=85?'var(--red)':pct>=60?'var(--yellow)':'var(--c1)')+'"></div></div>'+
            '<div style="font-size:10px;color:var(--text3);margin-top:5px">'+n.used+' terpakai / '+n.cap+' kapasitas</div>'+
          '</div>'
        ) : '') +
        childRows +
        (n.type === 'odp' ? '<div style="font-size:10.5px;color:var(--text3);line-height:1.5;border-top:1px solid var(--border);padding-top:12px;margin-top:12px">Buka tab <b>Port</b> untuk melihat rincian tiap port &amp; data sinyal ODP ini.</div>' : '');
    }
    overlay.classList.add('on');
  };
  window._monTopoCloseDetail = function(){
    var overlay = document.getElementById('mon-topo-overlay');
    if (overlay) overlay.classList.remove('on');
  };

  /* ================= widget: Masalah ringkas (real, dari logika yg sama dgn tab Masalah) ================= */
  function renderIssuesWidget(sc){
    var el = document.getElementById('mon-ov-issues');
    if (!el) return;
    var olts = (typeof _monOltData !== 'undefined') ? _monOltData : [];
    var list = [];
    olts.filter(function(o){ return o.status !== 'aktif'; }).forEach(function(o){
      list.push({ sev: 'high', icon: 'ti-antenna', kat: 'OLT', judul: o.kode + ' — ' + o.status, det: areaName(o.area_id) });
    });
    (sc.odcs || []).filter(function(o){ return o.status !== 'aktif'; }).forEach(function(o){
      list.push({ sev: 'medium', icon: 'ti-box', kat: 'ODC', judul: o.kode + ' — ' + o.status, det: areaName(o.area_id) });
    });
    var rusak = (sc.ports || []).filter(function(p){ return p.status === 'rusak'; });
    if (rusak.length) list.push({ sev: 'medium', icon: 'ti-plug-x', kat: 'Port', judul: rusak.length + ' port berstatus Rusak', det: 'Perlu diperiksa teknisi' });
    (sc.odps || []).filter(function(o){ return o.status !== 'aktif' && o.status !== 'full'; }).forEach(function(o){
      list.push({ sev: 'low', icon: 'ti-plug', kat: 'ODP', judul: o.kode + ' non-aktif', det: areaName(o.area_id) });
    });

    if (!list.length){
      el.innerHTML = '<div style="padding:22px;text-align:center"><i class="ti ti-circle-check" style="font-size:24px;color:var(--green);display:block;margin-bottom:6px"></i><div style="font-size:12px;font-weight:700;color:var(--green)">Semua Normal</div></div>';
      return;
    }
    var col = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--c1)' };
    var bg = { high: 'var(--rg2)', medium: 'var(--yg,rgba(217,119,6,.12))', low: 'var(--c1b)' };
    el.innerHTML = list.slice(0, 5).map(function(m){
      return '<div style="display:flex;align-items:flex-start;gap:9px;padding:9px 0;border-bottom:1px solid var(--border)">'+
        '<div style="width:28px;height:28px;border-radius:8px;background:'+bg[m.sev]+';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti '+m.icon+'" style="font-size:13px;color:'+col[m.sev]+'"></i></div>'+
        '<div style="min-width:0;flex:1"><span style="font-size:8.5px;font-weight:800;color:'+col[m.sev]+'">'+m.kat.toUpperCase()+'</span>'+
          '<div style="font-size:11.5px;font-weight:700;color:var(--text)">'+esc(m.judul)+'</div>'+
          '<div style="font-size:10px;color:var(--text3)">'+esc(m.det)+'</div></div>'+
      '</div>';
    }).join('') + (list.length > 5 ? '<div style="text-align:center;padding-top:8px"><button onclick="monTab(\'masalah\',document.getElementById(\'mon-tb-masalah\'))" style="font-size:10.5px;font-weight:700;color:var(--c1);background:none;border:none;cursor:pointer">Lihat semua ('+list.length+') →</button></div>' : '');
  }

  /* ================= widget: Aktivitas Terbaru (data NYATA, sumber sudah ada) ================= */
  function renderActivityWidget(){
    var el = document.getElementById('mon-ov-activity');
    if (!el || typeof SOT === 'undefined') return;
    var cache = SOT.cache();
    var items = [];
    (cache.dismantle || []).slice(0, 15).forEach(function(d){
      items.push({ tgl: d.tgl_selesai || d.tgl_cabut || '', icon: 'ti-scissors', col: 'var(--red)', teks: 'Pencabutan ' + (d.cid_pelanggan || '—') + (d.alasan ? ' · ' + d.alasan : '') });
    });
    (cache.maintenance || []).slice(0, 15).forEach(function(w){
      items.push({ tgl: w.tgl_selesai || w.tgl_mulai || '', icon: 'ti-tool', col: 'var(--yellow)', teks: (w.jenis || 'Maintenance') + ' · status ' + (w.status || '—') });
    });
    (cache.material || []).filter(function(m){ return m.jenis === 'signal_check'; }).slice(0, 15).forEach(function(m){
      items.push({ tgl: m.tgl || '', icon: 'ti-signal', col: 'var(--c1)', teks: 'Cek sinyal ' + (m.pel_cid || '—') + (m.keterangan ? ' · ' + m.keterangan : '') });
    });
    items.sort(function(a, b){ return String(b.tgl).localeCompare(String(a.tgl)); });
    items = items.slice(0, 6);

    if (!items.length){
      el.innerHTML = '<div style="padding:18px;text-align:center;font-size:11.5px;color:var(--text3)">Belum ada aktivitas tercatat</div>';
      return;
    }
    el.innerHTML = items.map(function(it){
      return '<div style="display:flex;align-items:flex-start;gap:9px;padding:8px 0;border-bottom:1px solid var(--border)">'+
        '<i class="ti '+it.icon+'" style="font-size:13px;color:'+it.col+';margin-top:2px;flex-shrink:0"></i>'+
        '<div style="min-width:0;flex:1"><div style="font-size:11.5px;color:var(--text2);line-height:1.4">'+esc(it.teks)+'</div>'+
          '<div style="font-size:9.5px;color:var(--text4);margin-top:2px">'+esc(it.tgl || '—')+'</div></div>'+
      '</div>';
    }).join('') +
    '<div style="font-size:9.5px;color:var(--text4);text-align:center;padding-top:8px">Sumber: riwayat cabut, work order &amp; cek sinyal teknisi</div>';
  }

  /* ================= widget: Distribusi Sinyal (1 query tambahan, ringan & sekali per kunjungan) ================= */
  function renderSignalWidget(rows){
    var el = document.getElementById('mon-ov-signal');
    if (!el) return;
    if (!rows){
      el.innerHTML = '<div style="padding:18px;text-align:center;color:var(--text3);font-size:11.5px"><i class="ti ti-loader-2" style="animation:rot 1s linear infinite;font-size:16px;display:block;margin-bottom:5px;opacity:.4"></i>Memuat data sinyal…</div>';
      return;
    }
    var vals = rows.map(function(r){ return parseFloat(r.sinyal_dbm); }).filter(function(v){ return !isNaN(v); });
    if (!vals.length){
      el.innerHTML = '<div style="padding:18px;text-align:center;color:var(--text3);font-size:11.5px">Belum ada data sinyal tercatat</div>';
      return;
    }
    var buckets = [
      { lbl: '≥ -25 (Baik)', col: 'var(--green)', n: vals.filter(function(v){ return v >= -25; }).length },
      { lbl: '-30 s/d -25 (Waspada)', col: 'var(--yellow)', n: vals.filter(function(v){ return v < -25 && v >= -30; }).length },
      { lbl: '< -30 (Kritis)', col: 'var(--red)', n: vals.filter(function(v){ return v < -30; }).length },
    ];
    var max = Math.max.apply(null, buckets.map(function(b){ return b.n; })) || 1;
    el.innerHTML = '<div style="font-size:10px;color:var(--text3);margin-bottom:10px">Dari ' + vals.length + ' sampel port dengan data sinyal</div>' +
      buckets.map(function(b){
        var pct = Math.round((b.n / max) * 100);
        return '<div style="margin-bottom:9px">'+
          '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="color:var(--text2);font-weight:600">'+b.lbl+'</span><span style="font-weight:800;color:'+b.col+'">'+b.n+'</span></div>'+
          '<div style="height:6px;background:var(--bg4);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+b.col+'"></div></div>'+
        '</div>';
      }).join('') +
      '<div style="font-size:9.5px;color:var(--text4);margin-top:4px">Ambang sama seperti detail port: ≥-25 baik, -30 s/d -25 waspada, di bawah -30 kritis.</div>';
  }
  function fetchSignalOnce(){
    if (_signalRows !== null) { renderSignalWidget(_signalRows); return; }
    var sb = (typeof getSB === 'function') ? getSB() : null;
    if (!sb) return;
    sb.from('odp_ports').select('sinyal_dbm').not('sinyal_dbm', 'is', null).limit(3000).then(function(r){
      if (r.error) { _signalRows = []; } else { _signalRows = r.data || []; }
      renderSignalWidget(_signalRows);
    }).catch(function(){ _signalRows = []; renderSignalWidget(_signalRows); });
  }

  /* ================= pasang container widget (sekali saja) ================= */
  function ensureContainer(){
    if (document.getElementById('mon-ov-root')) return true;
    var anchor = document.getElementById('mon-area-list');
    if (!anchor || !anchor.parentNode) return false;

    var root = document.createElement('div');
    root.id = 'mon-ov-root';
    root.style.marginTop = '14px';
    root.innerHTML =
      '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);overflow:hidden;margin-bottom:12px">'+
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--border)">'+
          '<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--text)"><i class="ti ti-topology-star" style="color:var(--c1)"></i> Diagram Topologi</div>'+
          '<div id="mon-topo-count" style="font-size:9.5px;color:var(--text3);font-family:monospace"></div>'+
          '<div style="position:relative;flex:1;min-width:110px">'+
            '<i class="ti ti-search" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--text3)"></i>'+
            '<input oninput="_monTopoSearch(this.value)" placeholder="Cari kode…" style="width:100%;box-sizing:border-box;padding:6px 8px 6px 26px;border-radius:8px;border:1.5px solid var(--border2);font-size:11px;background:var(--bg3);color:var(--text)" />'+
          '</div>'+
          '<button id="mon-topo-fil-btn" onclick="_monTopoToggleIssueFilter()" style="font-size:10px;font-weight:700;padding:6px 10px;border-radius:20px;border:1.5px solid var(--border2);background:var(--bg2);color:var(--text3);cursor:pointer;white-space:nowrap">⚠ Bermasalah</button>'+
        '</div>'+
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 14px;background:var(--bg3)">'+
          '<button onclick="_monTopoExpandAll()" style="font-size:10px;font-weight:700;padding:5px 9px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);cursor:pointer">Perluas Semua</button>'+
          '<button onclick="_monTopoCollapseAll()" style="font-size:10px;font-weight:700;padding:5px 9px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);cursor:pointer">Ciutkan</button>'+
          '<div style="flex:1"></div>'+
          '<button onclick="_monTopoZoomSet(-0.1)" style="width:26px;height:26px;border-radius:7px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);cursor:pointer"><i class="ti ti-minus" style="font-size:11px"></i></button>'+
          '<span id="mon-topo-zoomlbl" style="font-size:10px;font-family:monospace;color:var(--text3);width:36px;text-align:center">100%</span>'+
          '<button onclick="_monTopoZoomSet(0.1)" style="width:26px;height:26px;border-radius:7px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);cursor:pointer"><i class="ti ti-plus" style="font-size:11px"></i></button>'+
        '</div>'+
        '<div id="mon-topo-canvas" style="position:relative;overflow:auto;height:300px;background:var(--bg3)">'+
          '<div id="mon-topo-innerwrap" style="position:relative"></div>'+
        '</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:10px;padding:8px 14px;border-top:1px solid var(--border)">'+
          ['aktif:Aktif','maintenance:Maintenance','down:Down'].map(function(x){
            var parts=x.split(':'); return '<div style="display:flex;align-items:center;gap:4px"><span style="width:7px;height:7px;border-radius:50%;background:'+STAT_COLOR[parts[0]]+'"></span><span style="font-size:9.5px;color:var(--text3)">'+parts[1]+'</span></div>';
          }).join('')+
          '<div style="display:flex;align-items:center;gap:4px;margin-left:auto"><span style="width:5px;height:5px;border-radius:50%;background:var(--c1)"></span><span style="font-size:9.5px;color:var(--text3)">Aliran data</span></div>'+
        '</div>'+
      '</div>'+

      '<div style="display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:12px" id="mon-ov-grid2">'+
        '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:14px">'+
          '<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--text);margin-bottom:4px"><i class="ti ti-alert-triangle" style="color:var(--yellow)"></i> Masalah Terdeteksi</div>'+
          '<div id="mon-ov-issues"></div>'+
        '</div>'+
        '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:14px">'+
          '<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--text);margin-bottom:4px"><i class="ti ti-activity" style="color:var(--c1)"></i> Aktivitas Terbaru</div>'+
          '<div id="mon-ov-activity"></div>'+
        '</div>'+
        '<div style="background:var(--bg2);border-radius:var(--r);border:1.5px solid var(--border);padding:14px">'+
          '<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--text);margin-bottom:4px"><i class="ti ti-signal" style="color:var(--c1)"></i> Distribusi Sinyal</div>'+
          '<div id="mon-ov-signal"></div>'+
        '</div>'+
      '</div>';

    anchor.parentNode.insertBefore(root, anchor.nextSibling);

    // overlay detail node (pakai chrome sheet yang SUDAH ADA: .olt-overlay/.olt-sheet)
    var overlay = document.createElement('div');
    overlay.id = 'mon-topo-overlay';
    overlay.className = 'olt-overlay';
    overlay.onclick = function(e){ if (e.target === overlay) window._monTopoCloseDetail(); };
    overlay.innerHTML =
      '<div class="olt-sheet">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--border)">'+
          '<div style="font-size:13px;font-weight:800;color:var(--text)">Detail Node</div>'+
          '<button onclick="_monTopoCloseDetail()" style="width:30px;height:30px;border-radius:9px;background:var(--bg3);border:none;color:var(--text2);cursor:pointer"><i class="ti ti-x"></i></button>'+
        '</div>'+
        '<div class="olt-sheet-body" id="mon-topo-det-body"></div>'+
      '</div>';
    document.body.appendChild(overlay);

    // beri jarak media query kolom di layar lebar (tanpa mengubah file css)
    if (window.innerWidth >= 900){
      document.getElementById('mon-ov-grid2').style.gridTemplateColumns = '1fr 1fr 1fr';
    }
    return true;
  }

  /* ================= entry point: dipanggil tiap kali _monAreaRenderCards jalan ================= */
  function renderAll(sc){
    if (!ensureContainer()) return;
    fetchOdcOltMapOnce(function(map){
      _topoTree = buildTree(sc, map);
      if (!_topoExpanded) _topoExpanded = new Set(['root'].concat(_topoTree.children.map(function(a){ return a.id; })));
      renderTopology();
      renderIssuesWidget(sc);
    });
    renderActivityWidget();
    fetchSignalOnce();
  }

  var _origMonAreaRenderCards = window._monAreaRenderCards;
  if (typeof _origMonAreaRenderCards === 'function' && !_origMonAreaRenderCards._wtgWrapped){
    window._monAreaRenderCards = function(c){
      _origMonAreaRenderCards(c);
      try { renderAll(_monGetScopedCache()); } catch (e) { console.error('[mon-overview]', e); }
    };
    window._monAreaRenderCards._wtgWrapped = true;
  }

  /* =====================================================================
     PERBAIKAN BUG LAMA: monLoad ditimpa kosong oleh patch sebelumnya,
     sehingga auto-refresh real-time Monitoring tidak pernah jalan.
     Dikembalikan supaya benar-benar me-refresh tab yang sedang dibuka.
  ===================================================================== */
  window.monLoad = function(){
    if (typeof monTab === 'function'){
      monTab(window._monTabCur || 'area');
    } else if (typeof _monAreaInit === 'function'){
      _monAreaInit();
    }
  };

})();
