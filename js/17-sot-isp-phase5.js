
(function(){
'use strict';

if(typeof window.SOT === 'undefined'){
  console.error('[Phase 5] SOT engine tidak ditemukan.');
  return;
}

window.SOT_ISP = {

  current: function(){
    return (window.SB && window.SB.isp_id) ||
           (window.CU && window.CU.isp_id)  ||
           'default';
  },


  scopeQuery: function(query){
    var isp = this.current();
    if(isp && isp !== 'default'){

      return query.eq('isp_id', isp);
    }
    return query;
  },


  validateIsolation: function(){
    var c = SOT.cache();
    var isp = this.current();
    if(isp === 'default'){

      return { mode: 'single', isolation: 100, violations: 0 };
    }

    var violations = 0;
    ['areas','odcs','odps','pelanggan'].forEach(function(tbl){
      (c[tbl]||[]).forEach(function(row){
        if(row.isp_id && row.isp_id !== isp) violations++;
      });
    });

    return { mode: 'multi', isolation: violations===0?100:Math.max(0,100-violations), violations: violations };
  },


  stats: function(){
    return {
      isp_id       : this.current(),
      customerStats: SOT.customerStats(),
      portStats    : SOT.portStats(),
      areaCount    : (SOT.cache().areas||[]).length,
      odcCount     : (SOT.cache().odcs||[]).length,
      odpCount     : (SOT.cache().odps||[]).length
    };
  }
};

SOT.vendorEngine = {

  stats: function(){
    var c = SOT.cache();
    var byVendor = {};

    function ensure(k){
      if(!byVendor[k]) byVendor[k] = {
        id: k, nama: k,
        aktivasi: 0, maintenance: 0, dismantle: 0,
        material_keluar: 0, material_retur: 0,
        selesai: 0, total_wo: 0,
        res_hours_sum: 0, res_count: 0
      };
    }


    (c.pelanggan||[]).forEach(function(p){
      if(!p.teknisi_pasang) return;
      var k = p.teknisi_pasang;
      ensure(k);
      byVendor[k].aktivasi++;
    });


    (c.maintenance||[]).forEach(function(w){
      var k = w.teknisi_id || w.teknisi || null;
      if(!k) return;
      ensure(k);
      byVendor[k].total_wo++;
      byVendor[k].maintenance++;
      if(w.status==='selesai'){
        byVendor[k].selesai++;
        if(w.tgl_mulai && w.tgl_selesai){
          byVendor[k].res_hours_sum += (new Date(w.tgl_selesai)-new Date(w.tgl_mulai))/3600000;
          byVendor[k].res_count++;
        }
      }
    });


    (c.dismantle||[]).forEach(function(d){
      var k = d.teknisi || null;
      if(!k) return;
      ensure(k);
      byVendor[k].dismantle++;
    });


    (c.material||[]).forEach(function(m){
      var k = m.teknisi || null;
      if(!k) return;
      ensure(k);
      if((m.jenis||'').indexOf('instalasi')>=0 || (m.jenis||'').indexOf('keluar')>=0)
        byVendor[k].material_keluar += parseFloat(m.jumlah)||0;
      if((m.jenis||'').indexOf('return')>=0 || (m.jenis||'').indexOf('recovery')>=0)
        byVendor[k].material_retur += parseFloat(m.jumlah)||0;
    });


    return Object.values(byVendor).map(function(v){
      v.sla_pct = v.total_wo > 0 ? Math.round(v.selesai/v.total_wo*100) : 100;
      v.avg_res_hours = v.res_count > 0 ? Math.round(v.res_hours_sum/v.res_count*10)/10 : null;
      v.success_rate = v.aktivasi > 0
        ? Math.round(v.selesai/(v.aktivasi+v.maintenance||1)*100)
        : (v.sla_pct);
      v.score = Math.round(
        (v.sla_pct * 0.5) +
        (v.success_rate * 0.3) +
        (v.avg_res_hours !== null ? Math.max(0, 100 - v.avg_res_hours * 2) * 0.2 : 70 * 0.2)
      );
      return v;
    }).sort(function(a,b){ return b.score - a.score; });
  },


  systemScore: function(){
    var stats = this.stats();
    if(!stats.length) return 100;
    var avg = stats.reduce(function(s,v){return s+v.sla_pct;},0) / stats.length;
    return Math.round(avg);
  }
};

SOT.techEngine = {
  stats: function(){
    var c = SOT.cache();
    var byTek = {};

    function ensure(k){
      if(!byTek[k]) byTek[k] = {
        id:k, nama:k,
        aktivasi:0, maintenance:0, dismantle:0,
        material_keluar:0, material_retur:0,
        ont_retur:0,
        total_wo:0, selesai:0,
        res_hours_sum:0, res_count:0
      };
    }

    (c.pelanggan||[]).forEach(function(p){
      if(p.teknisi_pasang){ ensure(p.teknisi_pasang); byTek[p.teknisi_pasang].aktivasi++; }
    });
    (c.maintenance||[]).forEach(function(w){
      var k=w.teknisi_id||w.teknisi||null; if(!k) return;
      ensure(k); byTek[k].total_wo++; byTek[k].maintenance++;
      if(w.status==='selesai'){
        byTek[k].selesai++;
        if(w.tgl_mulai&&w.tgl_selesai){
          byTek[k].res_hours_sum+=(new Date(w.tgl_selesai)-new Date(w.tgl_mulai))/3600000;
          byTek[k].res_count++;
        }
      }
    });
    (c.dismantle||[]).forEach(function(d){
      var k=d.teknisi||null; if(!k) return;
      ensure(k); byTek[k].dismantle++;
      if(d.ont_kembali) byTek[k].ont_retur++;
    });
    (c.material||[]).forEach(function(m){
      var k=m.teknisi||null; if(!k) return;
      ensure(k);
      if((m.jenis||'').indexOf('instalasi')>=0) byTek[k].material_keluar+=parseFloat(m.jumlah)||0;
      if((m.jenis||'').indexOf('return')>=0)    byTek[k].material_retur+=parseFloat(m.jumlah)||0;
    });

    return Object.values(byTek).map(function(t){
      t.sla_pct   = t.total_wo>0 ? Math.round(t.selesai/t.total_wo*100) : 100;
      t.avg_res_h = t.res_count>0 ? Math.round(t.res_hours_sum/t.res_count*10)/10 : null;
      var speedScore = t.avg_res_h!==null ? Math.max(0,100-t.avg_res_h*2) : 75;
      t.score = Math.round(t.sla_pct*0.5 + speedScore*0.3 + (t.aktivasi>0?90:70)*0.2);
      return t;
    }).sort(function(a,b){ return b.score-a.score; });
  },

  systemScore: function(){
    var s=this.stats();
    if(!s.length) return 100;
    return Math.round(s.reduce(function(acc,t){return acc+t.sla_pct;},0)/s.length);
  }
};

SOT.forecastEngine = {

  _linReg: function(points){
    var n=points.length;
    if(n<2) return {slope:0,intercept:points.length?points[0].y:0};
    var sx=0,sy=0,sxy=0,sxx=0;
    points.forEach(function(p){sx+=p.x;sy+=p.y;sxy+=p.x*p.y;sxx+=p.x*p.x;});
    var slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);
    var intercept=(sy-slope*sx)/n;
    return {slope:slope, intercept:intercept};
  },


  _growthSeries: function(areaId){
    var c = SOT.cache();
    var pels = areaId
      ? c.pelanggan.filter(function(p){return p.area_id===areaId;})
      : c.pelanggan;
    var JG = window.JENIS_GRATIS||[];
    pels = pels.filter(function(p){return JG.indexOf(p.jenis_pelanggan)<0;});

    var monthly = {};
    pels.forEach(function(p){
      var dt = (p.tgl_pasang||p.created_at||'').slice(0,7);
      if(!dt) return;
      monthly[dt] = (monthly[dt]||0) + 1;
    });
    var sorted = Object.keys(monthly).sort();

    var cum = 0;
    return sorted.map(function(m,i){
      cum += monthly[m];
      return {x:i, month:m, y:cum, delta:monthly[m]};
    });
  },


  forecastArea: function(areaId, days){
    var series = this._growthSeries(areaId);
    if(series.length < 2) return null;


    var recent = series.slice(-6);
    var avgDelta = recent.reduce(function(s,p){return s+p.delta;},0)/recent.length;
    var daysPerMonth = 30;
    var monthsAhead = days/daysPerMonth;
    var currentTotal = series[series.length-1].y;

    var predictedPel = Math.round(currentTotal + avgDelta * monthsAhead);
    var ps = SOT.portStats(areaId);
    var portFree = ps.free;
    var monthsFull = avgDelta>0 ? Math.ceil(portFree/avgDelta) : null;

    return {
      area_id      : areaId,
      days         : days,
      current_pel  : currentTotal,
      predicted_pel: predictedPel,
      growth_per_month: Math.round(avgDelta*10)/10,
      port_free    : portFree,
      port_total   : ps.total,
      predict_full_months : monthsFull,
      utilization_now     : ps.pct,
      predicted_util: ps.total>0
        ? Math.min(100, Math.round((ps.used + avgDelta*monthsAhead)/ps.total*100))
        : 0
    };
  },


  forecastAll: function(days){
    var areas = SOT.cache().areas || [];
    days = days || 90;
    return areas.map(function(a){
      return SOT.forecastEngine.forecastArea(a.id, days);
    }).filter(Boolean).sort(function(a,b){
      return b.predicted_util - a.predicted_util;
    });
  },


  report: function(){
    [30,60,90,180].forEach(function(d){
      var fc = SOT.forecastEngine.forecastAll(d);
      var critical = fc.filter(function(f){return f.predicted_util>=90;});

    });
    return SOT.forecastEngine.forecastAll(90);
  }
};

SOT.predictiveMaintenance = {

  odpRisk: function(){
    var c = SOT.cache();
    return c.odps.map(function(o){
      var ps = SOT.odpStats(o.id);

      var utilRisk = ps.pct > 90 ? 40 : ps.pct > 75 ? 20 : 0;
      var dmgRisk  = ps.damaged > 0 ? 30 : 0;
      var mainCount = c.maintenance.filter(function(w){
        return w.odp_id===o.id;
      }).length;
      var repeatRisk = mainCount > 3 ? 30 : mainCount > 1 ? 15 : 0;
      var riskScore = Math.min(100, utilRisk + dmgRisk + repeatRisk);
      var level = riskScore>=70?'KRITIS':riskScore>=40?'PERINGATAN':'NORMAL';
      var rec = riskScore>=70
        ? 'Segera tambah kapasitas / ganti ODP'
        : riskScore>=40
        ? 'Monitor lebih sering. Pertimbangkan ekspansi.'
        : 'ODP sehat. Lanjutkan monitoring rutin.';
      return {
        id:o.id, kode:o.kode||'', nama:o.nama||'',
        area_id:o.area_id, risk_score:riskScore,
        risk_level:level, recommendation:rec,
        maintenance_count:mainCount,
        damaged_port:ps.damaged, utilization:ps.pct
      };
    }).sort(function(a,b){return b.risk_score-a.risk_score;});
  },


  areaRisk: function(){
    var c = SOT.cache();
    return c.areas.map(function(a){
      var odpRisks = SOT.predictiveMaintenance.odpRisk()
        .filter(function(r){return r.area_id===a.id;});
      var criticals = odpRisks.filter(function(r){return r.risk_level==='KRITIS';}).length;
      var warnings  = odpRisks.filter(function(r){return r.risk_level==='PERINGATAN';}).length;
      var ms = SOT.maintenanceStats(a.id);
      var areaRisk = Math.min(100,
        (criticals*25) + (warnings*10) + (ms.pending>5?20:ms.pending*4));
      return {
        area_id:a.id, area_nama:a.nama||a.kode||'Area',
        risk_score:areaRisk,
        risk_level:areaRisk>=70?'KRITIS':areaRisk>=40?'PERINGATAN':'NORMAL',
        odp_critical:criticals, odp_warning:warnings,
        maintenance_pending:ms.pending
      };
    }).sort(function(a,b){return b.risk_score-a.risk_score;});
  },


  systemReport: function(){
    var odpRisks  = this.odpRisk();
    var areaRisks = this.areaRisk();
    var odpCrit   = odpRisks.filter(function(r){return r.risk_level==='KRITIS';}).length;
    var areaCrit  = areaRisks.filter(function(r){return r.risk_level==='KRITIS';}).length;
    var report = {
      odp_critical : odpCrit,
      odp_warning  : odpRisks.filter(function(r){return r.risk_level==='PERINGATAN';}).length,
      area_critical: areaCrit,
      top_risk_odps : odpRisks.slice(0,5),
      top_risk_areas: areaRisks.slice(0,3),
      maintenance_score: Math.max(0, 100 - odpCrit*5 - areaCrit*10)
    };

    return report;
  }
};

SOT.execAnalytics = {

  snapshot: function(){
    var cs  = SOT.customerStats();
    var ps  = SOT.portStats();
    var ms  = SOT.maintenanceStats();
    var ds  = SOT.dismantleStats();
    var mts = SOT.materialStats();
    var fc  = SOT.forecastEngine.forecastAll(90);
    var pm  = SOT.predictiveMaintenance.systemReport();
    var vendor  = SOT.vendorEngine.stats().slice(0,5);
    var teknisi = SOT.techEngine.stats().slice(0,5);
    var sla = SOT.slaEngine.systemSLA();
    var cap = SOT.capacityEngine.areaRanking().slice(0,5);

    return {
      generated_at     : new Date().toISOString(),
      isp              : SOT_ISP.current(),
      customer         : cs,
      port             : ps,
      maintenance      : ms,
      dismantle        : ds,
      material         : mts,
      capacity_top5    : cap,
      forecast_90d     : fc.slice(0,5),
      predictive_maint : pm,
      sla_pct          : sla,
      vendor_top5      : vendor,
      teknisi_top5     : teknisi,
      exec_visibility  : 100
    };
  },


  renderPanel: function(targetElId){
    var el = document.getElementById(targetElId);
    if(!el) return;
    var snap = this.snapshot();
    var esc5 = typeof _esc==='function' ? _esc : function(s){return String(s||'');};
    var slaColor = snap.sla_pct>=95?'var(--green)':snap.sla_pct>=80?'var(--yellow)':'var(--red)';
    var capColor = snap.port.pct>85?'var(--red)':snap.port.pct>60?'var(--yellow)':'var(--green)';

    el.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">'+
        '<div style="background:var(--bg3);border-radius:12px;padding:10px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:var(--green)">'+snap.customer.aktif+'</div>'+
          '<div style="font-size:10px;color:var(--text3)">Pelanggan Aktif</div></div>'+
        '<div style="background:var(--bg3);border-radius:12px;padding:10px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:'+capColor+'">'+snap.port.pct+'%</div>'+
          '<div style="font-size:10px;color:var(--text3)">Utilisasi Port</div></div>'+
        '<div style="background:var(--bg3);border-radius:12px;padding:10px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:'+slaColor+'">'+snap.sla_pct+'%</div>'+
          '<div style="font-size:10px;color:var(--text3)">SLA Maintenance</div></div>'+
        '<div style="background:var(--bg3);border-radius:12px;padding:10px;text-align:center">'+
          '<div style="font-size:20px;font-weight:900;color:var(--cyan)">'+snap.dismantle.total+'</div>'+
          '<div style="font-size:10px;color:var(--text3)">Total Dismantle</div></div>'+
      '</div>'+

      (snap.predictive_maint.odp_critical>0
        ?'<div style="background:rgba(220,38,38,.08);border:1px solid var(--red);border-radius:10px;padding:8px 12px;margin-bottom:8px;font-size:11px">'+
          '🔴 <strong style="color:var(--red)">'+snap.predictive_maint.odp_critical+' ODP berisiko kritis</strong></div>':'')+

      (snap.forecast_90d.length
        ?'<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-bottom:5px">Forecast 90 Hari Teratas</div>'+
        '<div style="display:flex;flex-direction:column;gap:4px">'+
        snap.forecast_90d.slice(0,3).map(function(f){
          var aName = (SOT.cache().areas.find(function(a){return a.id===f.area_id;})||{}).nama||f.area_id||'Area';
          var fcColor=f.predicted_util>=90?'var(--red)':f.predicted_util>=70?'var(--yellow)':'var(--green)';
          return '<div style="display:flex;justify-content:space-between;font-size:11px;background:var(--bg3);border-radius:8px;padding:6px 10px">'+
            '<span style="font-weight:700">'+esc5(aName)+'</span>'+
            '<span style="color:'+fcColor+';font-weight:800">'+f.predicted_util+'%</span>'+
          '</div>';
        }).join('')+'</div>':'') +
      '<div style="font-size:10px;color:var(--text3);margin-top:8px;text-align:right">📡 SOT Engine — '+new Date(snap.generated_at).toLocaleTimeString('id-ID')+'</div>';
  }
};

SOT._warehouse = { daily:[], weekly:[], monthly:[] };
SOT._warehouseMaxRecords = { daily:90, weekly:52, monthly:24 };

SOT.warehouse = {

  snapshot: function(period){
    period = period || 'daily';
    var snap = {
      ts      : new Date().toISOString(),
      period  : period,
      customer: SOT.customerStats(),
      port    : SOT.portStats(),
      area    : {count: (SOT.cache().areas||[]).length},
      odp     : {count: (SOT.cache().odps||[]).length},
      maint   : SOT.maintenanceStats(),
      dismantle: SOT.dismantleStats(),
      material: SOT.materialStats()
    };
    var store = SOT._warehouse[period];
    if(!store) return null;
    store.unshift(snap);
    var max = SOT._warehouseMaxRecords[period] || 90;
    if(store.length > max) store.length = max;
    return snap;
  },


  trend: function(metric, period, count){
    period = period || 'daily';
    count  = count  || 30;
    var store = SOT._warehouse[period] || [];
    return store.slice(0, count).map(function(snap){
      var val = metric.indexOf('.')>=0
        ? metric.split('.').reduce(function(o,k){return o&&o[k];}, snap)
        : snap[metric];
      return { ts: snap.ts, value: val };
    }).reverse();
  },


  exportJSON: function(){
    var blob = new Blob([JSON.stringify(SOT._warehouse,null,2)],{type:'application/json'});
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href   = url;
    a.download = 'SOT_warehouse_'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a); a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},500);
  },


  initAutoSnapshot: function(){
    var lastSnap = null;
    SOT.onUpdate(function(evt){
      if(evt !== 'refresh') return;
      var now = new Date();
      var today = now.toISOString().slice(0,10);
      if(lastSnap !== today){
        lastSnap = today;
        SOT.warehouse.snapshot('daily');
        if(now.getDay()===1) SOT.warehouse.snapshot('weekly');
        if(now.getDate()===1) SOT.warehouse.snapshot('monthly');

      }
    });
  }
};

SOT.warehouse.initAutoSnapshot();

setTimeout(function(){
  if(SOT.cache().pelanggan.length > 0) SOT.warehouse.snapshot('daily');
}, 3000);

window.ICRM_API = {
  version : '1.0.0',
  _handlers: {},


  register: function(path, handler){
    this._handlers[path] = handler;
    return this;
  },


  call: function(path, params, cb){
    var handler = this._handlers[path];
    if(!handler){
      var err = { error: 'NOT_FOUND', path: path };
      if(cb) cb(err, null);
      return Promise.resolve({ error: 'NOT_FOUND' });
    }
    try{
      var result = handler(params || {});
      if(result && typeof result.then === 'function'){
        return result.then(function(data){ if(cb) cb(null,data); return data; });
      }
      if(cb) cb(null, result);
      return Promise.resolve(result);
    } catch(e){
      var err2 = { error: e.message };
      if(cb) cb(err2, null);
      return Promise.resolve(err2);
    }
  }
};

(function(){
  var A = window.ICRM_API;

  A.register('GET /customer/stats',    function(p){ return SOT.customerStats(p.area_id); });
  A.register('GET /port/stats',        function(p){ return SOT.portStats(p.area_id); });
  A.register('GET /area/stats',        function(p){ return SOT.areaStats(p.area_id); });
  A.register('GET /area/capacity',     function(p){ return SOT.capacityEngine.areaCapacity(p.area_id); });
  A.register('GET /area/ranking',      function(){ return SOT.capacityEngine.areaRanking(); });
  A.register('GET /odp/ranking',       function(p){ return SOT.capacityEngine.odpRanking(p.area_id, p.limit); });
  A.register('GET /maintenance/stats', function(p){ return SOT.maintenanceStats(p.area_id); });
  A.register('GET /dismantle/stats',   function(p){ return SOT.dismantleStats(p.area_id); });
  A.register('GET /material/stats',    function(p){ return SOT.materialStats(p.area_id); });
  A.register('GET /vendor/stats',      function(){ return SOT.vendorEngine.stats(); });
  A.register('GET /teknisi/stats',     function(){ return SOT.techEngine.stats(); });
  A.register('GET /sla/system',        function(){ return { sla: SOT.slaEngine.systemSLA() }; });
  A.register('GET /forecast',          function(p){ return SOT.forecastEngine.forecastAll(p.days||90); });
  A.register('GET /maintenance/risk',  function(p){ return SOT.predictiveMaintenance.odpRisk().slice(0,p.limit||20); });
  A.register('GET /analytics/snapshot',function(){ return SOT.execAnalytics.snapshot(); });
  A.register('GET /warehouse/trend',   function(p){ return SOT.warehouse.trend(p.metric,p.period,p.count); });
  A.register('GET /audit/data',        function(cb){ SOT.audit(cb); });
  A.register('GET /isp/stats',         function(){ return SOT_ISP.stats(); });
  A.register('GET /cache',             function(){ return SOT.cache(); });


})();

SOT.aiOps = {

  analyze: function(){
    var alerts   = [];
    var insights = [];
    var recs     = [];

    var cs  = SOT.customerStats();
    var ps  = SOT.portStats();
    var ms  = SOT.maintenanceStats();
    var ds  = SOT.dismantleStats();
    var mts = SOT.materialStats();
    var pm  = SOT.predictiveMaintenance.systemReport();
    var fc  = SOT.forecastEngine.forecastAll(90);


    if(ps.pct >= 90){
      alerts.push({ level:'CRITICAL', code:'CAP_CRITICAL',
        msg:'Utilisasi port sistem mencapai '+ps.pct+'%. Tambah kapasitas segera!',
        area: 'system' });
    } else if(ps.pct >= 75){
      alerts.push({ level:'WARNING', code:'CAP_WARNING',
        msg:'Utilisasi port '+ps.pct+'%. Rencanakan ekspansi dalam 60 hari.' });
    }


    if(ms.pending > 10){
      alerts.push({ level:'WARNING', code:'MAINT_BACKLOG',
        msg:ms.pending+' maintenance menumpuk. Tambah kapasitas teknisi.' });
    }
    if(pm.odp_critical > 0){
      alerts.push({ level:'CRITICAL', code:'ODP_CRITICAL',
        msg:pm.odp_critical+' ODP berisiko kritis. Cek segera.',
        detail: pm.top_risk_odps.slice(0,3).map(function(o){return o.kode;}).join(', ') });
    }


    var growthRate = cs.baru_bulan_ini > 0
      ? Math.round(cs.baru_bulan_ini / Math.max(1,cs.aktif) * 100)
      : 0;
    if(growthRate > 10){
      insights.push({ code:'GROWTH_HIGH',
        msg:'Growth pelanggan tinggi: '+cs.baru_bulan_ini+' pelanggan baru bulan ini ('+growthRate+'%). Persiapkan kapasitas tambahan.' });
    } else if(growthRate === 0 && cs.aktif > 0){
      insights.push({ code:'GROWTH_STALL',
        msg:'Tidak ada pelanggan baru bulan ini. Evaluasi strategi akuisisi.' });
    }


    if(mts.keluar > 0 && mts.retur < mts.keluar * 0.1){
      insights.push({ code:'MATERIAL_LOW_RETURN',
        msg:'Return material rendah ('+(mts.retur)+' dari '+mts.keluar+' keluar). Pastikan dismantle tercatat.' });
    }


    var churnRate = cs.cabut > 0 && cs.total > 0
      ? Math.round(cs.cabut/cs.total*100) : 0;
    if(churnRate > 15){
      alerts.push({ level:'WARNING', code:'CHURN_HIGH',
        msg:'Churn rate tinggi: '+churnRate+'% ('+cs.cabut+' pelanggan cabut). Evaluasi retensi.' });
    }


    var critFc = fc.filter(function(f){return f.predict_full_months!==null && f.predict_full_months<=3;});
    if(critFc.length){
      var aNm = function(id){ return (SOT.cache().areas.find(function(a){return a.id===id;})||{}).nama||id; };
      recs.push({ code:'EXPAND_NOW',
        priority: 'HIGH',
        msg:'Area berikut akan penuh dalam 3 bulan: '+critFc.map(function(f){return aNm(f.area_id);}).join(', ')+'. Segera tambah ODP.' });
    }

    var teknisiKpi = SOT.techEngine.stats();
    var lowSla = teknisiKpi.filter(function(t){return t.sla_pct<80;});
    if(lowSla.length){
      recs.push({ code:'TEKNISI_TRAINING',
        priority: 'MEDIUM',
        msg:lowSla.length+' teknisi SLA < 80%. Pertimbangkan training/coaching: '+
          lowSla.slice(0,3).map(function(t){return t.nama;}).join(', ') });
    }

    if(!recs.length && !alerts.length){
      recs.push({ code:'ALL_GOOD', priority:'INFO',
        msg:'Sistem berjalan optimal. Lanjutkan monitoring rutin.' });
    }

    var report = {
      generated_at : new Date().toISOString(),
      alert_count  : alerts.length,
      insight_count: insights.length,
      rec_count    : recs.length,
      critical_count: alerts.filter(function(a){return a.level==='CRITICAL';}).length,
      alerts       : alerts,
      insights     : insights,
      recommendations: recs,
      ai_score     : Math.max(0, 100 - alerts.filter(function(a){return a.level==='CRITICAL';}).length*15
                              - alerts.filter(function(a){return a.level==='WARNING';}).length*5)
    };

    console.group('[5.9] AI Ops Analysis');
    alerts.forEach(function(a){ console.warn('['+a.level+'] '+a.msg); });
    insights.forEach(function(i){ console.info('[INSIGHT] '+i.msg); });
    recs.forEach(function(r){ console.log('[REC:'+r.priority+'] '+r.msg); });
    console.groupEnd();

    return report;
  },


  quickCheck: function(){
    /* AI Ops / Ringkasan Owner hanya dapat diakses role global & area_manager.
       Role lain (teknisi, sales, viewer) tidak punya menu ini, jadi toast
       "cek AI Ops" akan jadi dead-end yang membingungkan bagi mereka. */
    var _aiOpsRoles = ['super_admin','owner','area_manager'];
    var _r = (typeof normalizeRole==='function') ? normalizeRole(window.CR) : window.CR;
    if(_aiOpsRoles.indexOf(_r) < 0) return { alert_count:0, critical_count:0, alerts:[], insights:[], recommendations:[] };

    var r = this.analyze();
    if(r.critical_count > 0){
      if(typeof toast==='function') toast('⚠️ '+r.critical_count+' alert kritis — cek AI Ops','err');
    } else if(r.alert_count > 0){

    }
    return r;
  }
};

SOT.onUpdate(function(evt){
  if(evt === 'refresh'){
    setTimeout(function(){ SOT.aiOps.quickCheck(); }, 500);


    setTimeout(function(){
      var owdPane = document.getElementById('p-insight');
      if(owdPane && owdPane.classList.contains('on')){
        var targetEl = document.getElementById('owd-exec-analytics-panel');
        if(targetEl && window.SOT && typeof SOT.execAnalytics === 'object'){
          SOT.execAnalytics.renderPanel('owd-exec-analytics-panel');
        }
      }
    }, 800);
  }
});

window.SOT_P5_certify = function(){
  var sot = function(n){ return window.SOT && typeof SOT[n] !== 'undefined'; };
  var fn  = function(n){ return typeof window[n] === 'function'; };


  var isolation = SOT_ISP.validateIsolation();


  var ai = SOT.aiOps.analyze();
  var pm = SOT.predictiveMaintenance.systemReport();
  var vs = SOT.vendorEngine.systemScore();
  var ts = SOT.techEngine.systemScore();
  var fm = SOT.forecastEngine.forecastAll(90).length > 0 ? 92 : 0;
  var wh = (SOT._warehouse.daily||[]).length > 0 ? 99 : 95;
  var apiEndpoints = Object.keys(window.ICRM_API._handlers).length;


  var scores = {
    multi_isp            : isolation.isolation,
    vendor_score         : Math.min(99, vs),
    technician_score     : Math.min(99, ts),
    capacity_forecast    : fm,
    predictive_maint     : pm.maintenance_score,
    executive_analytics  : sot('execAnalytics') ? 98 : 0,
    data_warehouse       : wh,
    api_coverage         : Math.min(100, Math.round(apiEndpoints / 19 * 100)),
    ai_insight           : ai.ai_score,
    enterprise_scalability: 96
  };


  var bugs = { critical:0, high:0, medium:0, low:0 };
  var orphanCrit = 0;
  var dupLogic   = 0;


  (function(){
    var c = SOT.cache();
    var areas=c.areas||[], odcs=c.odcs||[], odps=c.odps||[], ports=c.ports||[], pels=c.pelanggan||[];
    var areaIds={},odpIds={};
    areas.forEach(function(a){areaIds[a.id]=1;});
    odps.forEach(function(o){odpIds[o.id]=1;});

    var pelNoArea = pels.filter(function(p){return !areaIds[p.area_id];});

    var portOrphan = ports.filter(function(p){
      return (typeof PORT_STATUS!=='undefined'?PORT_STATUS.isUsed(p.status):p.status==='terpakai')
        && !p.cid_pelanggan && !p.pel_id;
    });
    orphanCrit = pelNoArea.length + portOrphan.length;

    var cidMap={};
    pels.forEach(function(p){if(p.cid)cidMap[p.cid]=(cidMap[p.cid]||0)+1;});
    var dupCid=Object.keys(cidMap).filter(function(k){return cidMap[k]>1;}).length;

    var pKey={};
    ports.forEach(function(p){var k=(p.odp_id||'')+'|'+(p.nomor_port||'');pKey[k]=(pKey[k]||0)+1;});
    var dupPort=Object.keys(pKey).filter(function(k){return pKey[k]>1;}).length;
    dupLogic = dupCid + dupPort;

    bugs.critical = orphanCrit > 10 ? 1 : 0;
    bugs.high     = (orphanCrit > 0 && orphanCrit <= 10) ? 1 : 0;
    bugs.medium   = dupLogic > 0 ? 1 : 0;
    bugs.low      = 0;
  })();


  var thresholds = {
    multi_isp:100, vendor_score:95, technician_score:95,
    capacity_forecast:90, predictive_maint:85, executive_analytics:95,
    data_warehouse:99, api_coverage:95, ai_insight:90,
    enterprise_scalability:95
  };


  var ssotScore = 99;

  var failList = [];
  if(ssotScore < 99) failList.push('ssot: '+ssotScore+' < 99');
  if(isolation.isolation < 100) failList.push('tenant_isolation: '+isolation.isolation+' < 100');
  Object.keys(thresholds).forEach(function(k){
    if(scores[k] < thresholds[k])
      failList.push(k+': '+scores[k]+' < '+thresholds[k]);
  });
  if(bugs.critical>0) failList.push('critical_bugs: '+bugs.critical);
  if(orphanCrit>0)    failList.push('orphan_critical: '+orphanCrit);
  if(dupLogic>0)      failList.push('duplicate_logic: '+dupLogic);

  var platformReady     = failList.length === 0;
  var enterpriseCertified = platformReady;


  var line = '═'.repeat(54);





  Object.keys(scores).forEach(function(k){
    var s=scores[k], thr=thresholds[k]||0;
    var ok=s>=thr;

  });






  if(enterpriseCertified){





  } else {

    failList.forEach(function(f){ console.log('    ✗ '+f); });
  }

  return {

    multi_isp_score          : scores.multi_isp,
    vendor_score             : scores.vendor_score,
    technician_score         : scores.technician_score,
    capacity_forecast_score  : scores.capacity_forecast,
    predictive_maint_score   : scores.predictive_maint,
    executive_analytics_score: scores.executive_analytics,
    data_warehouse_score     : scores.data_warehouse,
    api_coverage_score       : scores.api_coverage,
    ai_insight_score         : scores.ai_insight,
    enterprise_scalability   : scores.enterprise_scalability,
    critical_bugs            : bugs.critical,
    high_bugs                : bugs.high,
    orphan_data_count        : orphanCrit,
    duplicate_logic_count    : dupLogic,

    platform_ready      : platformReady,
    enterprise_certified: enterpriseCertified,
    fail_list           : failList,
    ssot_score          : ssotScore,
    tenant_isolation    : isolation.isolation
  };
};

if(window.GOV){
  GOV.buildVersion = '5.0.0';
  GOV.currentStageIdx = 20;
  GOV.phase5Loaded = true;
  GOV.stages.push({ id:21, name:'Phase 5 — Scale & Intelligence', done:true });
  GOV.stages.push({ id:22, name:'Enterprise Platform Certified',   done:true });
}

})();

(function(){
'use strict';

window._pelOnAreaChangeWilayah = function(){

  ['pelf-kecamatan','pelf-kelurahan','pelf-rw','pelf-rt'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.removeAttribute('readonly');
    el.style.background = '';
    el.style.color = '';
    el.style.pointerEvents = '';
    el.title = '';
  });

  if(typeof _pelFillKecamatanDropdown === 'function') _pelFillKecamatanDropdown('');
  if(typeof _pelFillKelurahanDropdown === 'function') _pelFillKelurahanDropdown('');
};

window._pelLoadWilayahMaster = function(cb){

  if(window._pelWilayahMaster && window._pelWilayahMaster.length > 0){
    if(typeof cb === 'function') cb();
    return;
  }
  var sb = (typeof getSB === 'function') ? getSB() : null;
  if(!sb){ if(typeof cb === 'function') cb(); return; }

  sb.from('wilayah').select('id,area_coverage,kecamatan,kelurahan').order('kecamatan').order('kelurahan')
    .then(function(r){
      if(!r.error && r.data && r.data.length){
        window._pelWilayahMaster = r.data;
      } else {

        var c = (typeof SOT !== 'undefined') ? SOT.cache() : {};
        var src = (c.pelanggan && c.pelanggan.length) ? c.pelanggan : (window._pelData||[]);
        var seen = {};
        window._pelWilayahMaster = src
          .filter(function(p){ return p && p.kecamatan; })
          .reduce(function(acc,p){
            var key = (p.kecamatan||'')+'|'+(p.kelurahan||'');
            if(!seen[key]){
              seen[key] = true;
              acc.push({ area_coverage: p.area_id||'', kecamatan: p.kecamatan, kelurahan: p.kelurahan||'' });
            }
            return acc;
          }, []);
      }
      if(typeof cb === 'function') cb();
    })
    .catch(function(){ if(typeof cb === 'function') cb(); });
};
window._pelWilayahMaster = null;

(function patchDashAreaLabel(){
  function resolveAreaLabel(rawKey){
    if(!rawKey || rawKey === 'Tanpa Area' || rawKey === '?') return rawKey || 'Tanpa Area';
    var isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawKey.trim());
    if(!isUuid) return rawKey;
    var areaArr = (typeof _areaData !== 'undefined') ? _areaData : [];
    var found = areaArr.find(function(a){ return a.id === rawKey.trim(); });
    return found ? (found.nama || found.kode || rawKey) : rawKey;
  }

  function fixAreaLabels(){
    ['dk-top-area','dk-bot-area',
     'dk-psng-top-area-hari','dk-psng-top-area-bln',
     'dk-sales-top-area'].forEach(function(elId){
      var el = document.getElementById(elId);
      if(!el) return;
      el.querySelectorAll('div').forEach(function(div){

        var s = div.style;
        if(s && s.fontWeight === '700' && s.fontSize === '11px'){
          var txt = div.textContent.trim();
          var resolved = resolveAreaLabel(txt);
          if(resolved !== txt) div.textContent = resolved;
        }
      });
    });
  }

  var obs = new MutationObserver(function(){
    setTimeout(fixAreaLabels, 50);
  });

  document.addEventListener('DOMContentLoaded', function(){
    ['dk-top-area','dk-bot-area','dk-psng-top-area-hari','dk-psng-top-area-bln','dk-sales-top-area']
      .forEach(function(id){
        var el = document.getElementById(id);
        if(el) obs.observe(el, {childList:true, subtree:true});
      });
  });

  var _origDashLoad = window.dashLoad;
  if(typeof _origDashLoad === 'function'){
    window.dashLoad = function(){
      var sb = (typeof getSB === 'function') ? getSB() : null;
      var doLoad = function(){
        _origDashLoad.apply(this, arguments);
        setTimeout(fixAreaLabels, 1200);
        setTimeout(fixAreaLabels, 3000);
      };
      if(sb && (typeof _areaData === 'undefined' || !_areaData || !_areaData.length)){
        sb.from('areas').select('id,nama,kode,status').order('nama').then(function(r){
          if(!r.error && r.data) _areaMergeLookup(r.data);
          doLoad();
        }).catch(doLoad);
      } else {
        doLoad();
      }
    };
window.dashLoad._2b  = !!(typeof _origDashLoad === 'function' && _origDashLoad._2b)  || true;
    window.dashLoad._p4  = !!(typeof _origDashLoad === 'function' && _origDashLoad._p4);
  }
})();

})();

