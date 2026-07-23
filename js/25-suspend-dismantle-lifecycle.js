/* =====================================================================
   PATCH 25 — SIKLUS SUSPEND & REAKTIVASI (BARU)
   ---------------------------------------------------------------------
   File ini TIDAK mengedit js/03-app-core.js sama sekali. Semua fungsi
   asli (termasuk rule "4 periode -> cabut" yang sudah ada di
   _recCheckAutoDismantle) dibiarkan 100% seperti semula — file ini
   hanya "menumpang" di titik yang sudah ada, sama seperti pola patch
   01, 09, 10, dst di project ini.

   ATURAN BARU YANG DITAMBAHKAN (sesuai permintaan):
   1) Pelanggan AKTIF yang 2 periode fee_recurring terakhir berturut-turut
      masih berstatus 'menunggu_validasi'/'draft' (belum dikonfirmasi
      finance) -> OTOMATIS pindah status jadi SUSPEND.
      - Data teknis (SN ONT / Port / ODP) TIDAK diutak-atik saat suspend,
        supaya gampang balik aktif lagi.
      - Sesuai keputusan: selama SUSPEND, tagihan bulanan baru TIDAK
        dibuat (mengikuti rule lama _recAutoSinkron yang memang cuma
        menagih pelanggan berstatus 'aktif' — rule itu tidak disentuh).

   2) Karena tagihan berhenti saat suspend, hitungan "bulan ke-4" tidak
      bisa lagi dihitung dari jumlah baris tagihan (karena tidak ada
      baris baru). Maka dipakai hitungan KALENDER:
        - Saat pelanggan disuspend, periode terakhir yang tercatat di
          fee_recurring (yang menunggak) otomatis "membeku" (tidak
          bertambah lagi).
        - Begitu kalender sudah maju 2 bulan penuh dari periode beku
          tsb TANPA ada reaktivasi manual, pelanggan otomatis pindah
          ke CABUT/DISMANTLE (total 2 bulan sebelum suspend + 2 bulan
          selama suspend = 4 bulan, sesuai permintaan).
        - Proses cabut otomatis ini memakai LOGIKA PERSIS SAMA dengan
          proses cabut lama (insert dismantle_orders, kosongkan SN
          ONT/Port/ODP, bebaskan port) — tidak ada aturan baru dibuat,
          cuma diperluas supaya pelanggan yang sudah 'suspend' juga
          ikut kena, karena sebelumnya rule lama cuma cek status 'aktif'.

   3) Reaktivasi (BARU):
        - SUSPEND -> AKTIF : 1 klik, otomatis aktif lagi (data teknis
          aman, tidak pernah dihapus saat suspend).
        - CABUT -> AKTIF   : 1 klik, status balik aktif. SN ONT/Port/ODP
          TIDAK otomatis terisi lagi (karena memang sudah dikosongkan &
          portnya sudah dibebaskan sejak proses cabut lama) — perlu
          dilengkapi manual lewat Edit Pelanggan, sama seperti pasang
          baru. Ini bukan aturan baru, cuma konsekuensi wajar dari rule
          cabut lama yang tidak diubah.
        - Tersedia tombol per-pelanggan (di halaman Detail Pelanggan)
          DAN tombol massal (di halaman daftar Pelanggan).

   TIDAK ADA perubahan skema/kolom database.
   TIDAK ADA perubahan pada proses konfirmasi/validasi finance.
===================================================================== */
(function(){
  'use strict';

  // ---- Ambang batas (gampang diubah kalau suatu saat diperlukan) ----
  var SUSPEND_AFTER   = 2; // 2 periode belum konfirmasi -> suspend
  var DISMANTLE_AFTER = 4; // total 4 (periode/bulan) belum konfirmasi -> cabut
  var EXTRA_BULAN_SUSPEND = DISMANTLE_AFTER - SUSPEND_AFTER; // 2 bulan tambahan setelah suspend

  function _belumKonfirmasi(st){
    return st === 'menunggu_validasi' || st === 'draft';
  }

  function _ymSekarang(){
    var d = new Date();
    return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);
  }

  function _selisihBulan(dariYM, keYM){
    var a = dariYM.split('-'), b = keYM.split('-');
    if(a.length<2 || b.length<2) return 0;
    return (parseInt(b[0],10)*12+parseInt(b[1],10)) - (parseInt(a[0],10)*12+parseInt(a[1],10));
  }

  // ================= 1) AKTIF -> SUSPEND (2 periode belum konfirmasi) =================
  function _wtgAutoSuspendCheck(sb){
    if(!sb) return;
    var FREE_TYPES = window.JENIS_GRATIS || [];

    Promise.all([
      _sbFetchAllRows(sb, 'fee_recurring', 'pel_id,periode,status', function(q){ return q.order('periode', {ascending:false}); }),
      _sbFetchAllRows(sb, 'pelanggan', 'id,cid,nama,jenis_pelanggan,status', function(q){ return q.eq('status','aktif'); })
    ]).then(function(res){
      var rRec = res[0], rPel = res[1];
      if(rRec.error || rPel.error) return;

      var byPel = {};
      (rRec.data||[]).forEach(function(r){
        if(!r.pel_id) return;
        if(!byPel[r.pel_id]) byPel[r.pel_id] = [];
        byPel[r.pel_id].push(r);
      });

      var akanSuspend = [];
      (rPel.data||[]).forEach(function(p){
        if(FREE_TYPES.indexOf(p.jenis_pelanggan) >= 0) return;
        var rows = byPel[p.id]; if(!rows) return;
        rows = rows.slice().sort(function(a,b){ return a.periode < b.periode ? 1 : -1; });
        var lastN = rows.slice(0, SUSPEND_AFTER);
        if(lastN.length < SUSPEND_AFTER) return;
        var semuaBelum = lastN.every(function(r){ return _belumKonfirmasi(r.status); });
        if(semuaBelum) akanSuspend.push(p);
      });

      if(!akanSuspend.length) return;

      var ids = akanSuspend.map(function(p){ return p.id; });
      sb.from('pelanggan').update({status:'suspend'}).in('id', ids).then(function(ru){
        if(ru && ru.error) return;
        if(typeof toast === 'function') toast('⏸ '+akanSuspend.length+' pelanggan belum konfirmasi bayar '+SUSPEND_AFTER+' periode → otomatis di-SUSPEND', 'err');
        if(typeof _pelLoaded !== 'undefined') _pelLoaded = false;
        setTimeout(function(){ if(typeof pelLoad === 'function') pelLoad(); }, 300);
      }).catch(function(){});
    }).catch(function(){});
  }

  // ================= 2) SUSPEND -> CABUT (2 bulan kalender tambahan) =================
  function _wtgAutoDismantleFromSuspend(sb){
    if(!sb) return;
    var FREE_TYPES = window.JENIS_GRATIS || [];
    var todayYM = _ymSekarang();

    Promise.all([
      _sbFetchAllRows(sb, 'pelanggan', 'id,cid,nama,area_id,area_coverage,kecamatan,jenis_pelanggan,ont_item_id,kabel_item_id,status', function(q){ return q.eq('status','suspend'); }),
      _sbFetchAllRows(sb, 'fee_recurring', 'pel_id,periode', function(q){ return q.order('periode', {ascending:false}); }),
      _sbFetchAllRows(sb, 'dismantle_orders', 'pel_id', function(q){ return q.eq('status','selesai'); })
    ]).then(function(res){
      var rPel = res[0], rRec = res[1], rDmt = res[2];
      if(rPel.error || rRec.error) return;

      var sudahDismantle = {};
      (rDmt.data||[]).forEach(function(d){ if(d.pel_id) sudahDismantle[d.pel_id] = 1; });

      var periodeTerakhir = {};
      (rRec.data||[]).forEach(function(r){
        if(!r.pel_id || !r.periode) return;
        if(!periodeTerakhir[r.pel_id] || r.periode > periodeTerakhir[r.pel_id]) periodeTerakhir[r.pel_id] = r.periode;
      });

      var akanDismantle = [];
      (rPel.data||[]).forEach(function(p){
        if(sudahDismantle[p.id]) return;
        if(FREE_TYPES.indexOf(p.jenis_pelanggan) >= 0) return;
        var lp = periodeTerakhir[p.id]; if(!lp) return;
        var selisih = _selisihBulan(lp, todayYM);
        if(selisih >= EXTRA_BULAN_SUSPEND) akanDismantle.push(p);
      });

      if(!akanDismantle.length) return;

      var tgl = new Date().toISOString().slice(0,10);
      var ops = akanDismantle.map(function(pel){
        var payload = {
          pel_id: pel.id, cid_pelanggan: pel.cid || null,
          nama_pelanggan: pel.nama || null, area_id: pel.area_id || null,
          area_coverage: pel.area_coverage || null, kecamatan: pel.kecamatan || null,
          tgl_cabut: tgl, tgl_selesai: tgl,
          alasan: 'menunggak',
          catatan: 'Auto-dismantle: menunggak total '+DISMANTLE_AFTER+' bulan (via status suspend, tanpa konfirmasi finance)',
          status: 'selesai',
          ont_item_id: pel.ont_item_id || null,
          kabel_item_id: pel.kabel_item_id || null,
          dilakukan_oleh: 'SYSTEM', role_aktor: 'auto'
        };
        return sb.from('dismantle_orders').insert([payload]).then(function(rd){
          if(rd && rd.error) return;
          return sb.from('pelanggan').update({status:'cabut', sn_ont:null, nomor_port:null, odp_id:null}).eq('id', pel.id);
        }).then(function(){
          if(pel.cid){
            sb.from('odp_ports').update({status:'kosong', cid_pelanggan:null, paket:null, tgl_pasang:null}).eq('cid_pelanggan', pel.cid).catch(function(){});
          }
          sb.from('fee_recurring').update({status:'stopped'}).eq('pel_id', pel.id).neq('status','paid').catch(function(){});
        }).catch(function(){});
      });

      Promise.all(ops).then(function(){
        if(typeof toast === 'function') toast('⚠️ '+akanDismantle.length+' pelanggan (suspend) menunggak '+DISMANTLE_AFTER+' bulan → otomatis di-DISMANTLE', 'err');
        if(typeof _pelLoaded !== 'undefined') _pelLoaded = false;
        if(typeof _dmtLoaded !== 'undefined') _dmtLoaded = false;
        setTimeout(function(){
          if(typeof pelLoad === 'function') pelLoad();
          if(typeof dmtLoad === 'function') dmtLoad();
        }, 300);
      });
    }).catch(function(){});
  }

  // Sisipkan ke titik pemicu yang SUDAH ADA (jalan tiap kali sinkron tagihan
  // dijalankan) — TANPA mengubah isi _recCheckAutoDismantle aslinya.
  var _origCheckAutoDismantle = window._recCheckAutoDismantle;
  window._recCheckAutoDismantle = function(sb){
    if(typeof _origCheckAutoDismantle === 'function') _origCheckAutoDismantle(sb);
    _wtgAutoSuspendCheck(sb);
    _wtgAutoDismantleFromSuspend(sb);
  };

  // ================= 3) REAKTIVASI =================
  function wtgReaktivasiSatu(id, namaPel, statusAsal){
    var sb = typeof getSB === 'function' ? getSB() : null;
    if(!sb){ if(typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    var pesan = 'Aktifkan kembali "'+(namaPel||'pelanggan ini')+'"?';
    if(statusAsal === 'cabut'){
      pesan += '\n\nCatatan: pelanggan ini sebelumnya CABUT. SN ONT / Port / ODP tidak otomatis terpasang lagi — lengkapi lewat menu Edit Pelanggan setelah ini.';
    }
    if(!confirm(pesan)) return;

    sb.from('pelanggan').update({status:'aktif'}).eq('id', id).then(function(r){
      if(r.error){ if(typeof toast === 'function') toast('Gagal mengaktifkan: '+r.error.message, 'err'); return; }
      if(typeof toast === 'function') toast('✅ '+(namaPel||'Pelanggan')+' berhasil diaktifkan kembali', 'ok');
      if(typeof pelCloseDet === 'function') pelCloseDet();
      if(typeof _pelLoaded !== 'undefined') _pelLoaded = false;
      if(typeof pelLoad === 'function') pelLoad();
    }).catch(function(e){ if(typeof toast === 'function') toast('Error: '+(e&&e.message||'coba lagi'), 'err'); });
  }

  function wtgReaktivasiMassal(statusAsal){
    var label = statusAsal === 'suspend' ? 'SUSPEND' : 'CABUT';
    var sb = typeof getSB === 'function' ? getSB() : null;
    if(!sb){ if(typeof toast === 'function') toast('Database tidak terhubung', 'err'); return; }

    sb.from('pelanggan').select('id,nama,cid').eq('status', statusAsal).then(function(r){
      if(r.error){ if(typeof toast === 'function') toast('Gagal mengambil data: '+r.error.message, 'err'); return; }
      var list = r.data||[];
      if(!list.length){ if(typeof toast === 'function') toast('Tidak ada pelanggan berstatus '+label, 'err'); return; }

      var pesan = 'Aktifkan kembali SEMUA pelanggan berstatus '+label+' ('+list.length+' pelanggan)?';
      if(statusAsal === 'cabut'){
        pesan += '\n\nCatatan: SN ONT / Port / ODP TIDAK otomatis terpasang lagi untuk pelanggan yang sudah CABUT — lengkapi manual lewat Edit Pelanggan satu per satu.';
      }
      if(!confirm(pesan)) return;

      var ids = list.map(function(p){ return p.id; });
      sb.from('pelanggan').update({status:'aktif'}).in('id', ids).then(function(ru){
        if(ru.error){ if(typeof toast === 'function') toast('Gagal mengaktifkan massal: '+ru.error.message, 'err'); return; }
        if(typeof toast === 'function') toast('✅ '+ids.length+' pelanggan berhasil diaktifkan kembali', 'ok');
        if(typeof _pelLoaded !== 'undefined') _pelLoaded = false;
        if(typeof pelLoad === 'function') pelLoad();
      }).catch(function(e){ if(typeof toast === 'function') toast('Error: '+(e&&e.message||'coba lagi'), 'err'); });
    }).catch(function(e){ if(typeof toast === 'function') toast('Error: '+(e&&e.message||'coba lagi'), 'err'); });
  }

  window.wtgReaktivasiSatu = wtgReaktivasiSatu;
  window.wtgReaktivasiMassal = wtgReaktivasiMassal;

  // ================= 4) UI: tombol per-pelanggan di halaman Detail =================
  var _origPelRenderDetBody = window._pelRenderDetBody;
  window._pelRenderDetBody = function(p){
    if(typeof _origPelRenderDetBody === 'function') _origPelRenderDetBody(p);
    if(p && (p.status === 'suspend' || p.status === 'cabut')){
      var body = document.getElementById('pel-det-body');
      if(body){
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;gap:8px;margin-top:8px';
        var namaSafe = String(p.nama||p.cid||'').replace(/'/g,"\\'");
        wrap.innerHTML =
          '<button class="btn" style="flex:1;background:#16a34a;color:#fff" onclick="wtgReaktivasiSatu(\''+p.id+'\',\''+namaSafe+'\',\''+p.status+'\')">'+
            '<i class="ti ti-player-play"></i> Aktifkan Kembali</button>';
        body.appendChild(wrap);
      }
    }
  };

  // ================= 5) UI: tombol massal di halaman daftar Pelanggan =================
  var _wtgToolbarWatch = setInterval(function(){
    var filterBar = document.querySelector('#p-pelanggan .olt-filter-bar');
    if(!filterBar || document.getElementById('wtg-reaktivasi-bar')) return;
    clearInterval(_wtgToolbarWatch);

    var bar = document.createElement('div');
    bar.id = 'wtg-reaktivasi-bar';
    bar.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap';
    bar.innerHTML =
      '<button class="btn btn-ghost" style="flex:1;min-width:160px;font-size:12px;background:rgba(202,138,4,.08);border-color:rgba(202,138,4,.3);color:#a16207" onclick="wtgReaktivasiMassal(\'suspend\')">'+
        '<i class="ti ti-player-play"></i> Aktifkan Semua Suspend</button>'+
      '<button class="btn btn-ghost" style="flex:1;min-width:160px;font-size:12px;background:var(--rg2);border-color:rgba(220,38,38,.25);color:var(--red)" onclick="wtgReaktivasiMassal(\'cabut\')">'+
        '<i class="ti ti-player-play"></i> Aktifkan Semua Cabut</button>';
    filterBar.parentNode.insertBefore(bar, filterBar);
  }, 300);

})();
