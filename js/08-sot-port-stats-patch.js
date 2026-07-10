
(function(){
'use strict';

function _sotPortStatsForOdp(odpId){
  var ports = (window.SOT && SOT.cache().ports) ? SOT.cache().ports : [];
  var odpp  = ports.filter(function(p){ return String(p.odp_id) === String(odpId); });
  var used    = odpp.filter(function(p){ return PORT_STATUS.isUsed(p.status);    }).length;
  var free    = odpp.filter(function(p){ return PORT_STATUS.isFree(p.status);    }).length;
  var damaged = odpp.filter(function(p){ return PORT_STATUS.isDamaged(p.status); }).length;
  var total   = odpp.length;

  return { total:total, used:used, free:free, damaged:damaged,
           pct: total ? Math.round(used/total*100) : 0 };
}

function _sotOdpPenuhForArea(odps, odpId_optional){
  var ports = (window.SOT && SOT.cache().ports) ? SOT.cache().ports : [];
  if(!ports.length) return null;


  var portsByOdp = {};
  ports.forEach(function(p){
    var k = String(p.odp_id);
    if(!portsByOdp[k]) portsByOdp[k] = { used:0, free:0, damaged:0, total:0 };
    portsByOdp[k].total++;
    if(PORT_STATUS.isUsed(p.status))    portsByOdp[k].used++;
    if(PORT_STATUS.isFree(p.status))    portsByOdp[k].free++;
    if(PORT_STATUS.isDamaged(p.status)) portsByOdp[k].damaged++;
  });

  var penuh = 0;
  odps.forEach(function(o){
    var ps = portsByOdp[String(o.id)];
    if(!ps) return;
    if(ps.total > 0 && ps.free <= 0) penuh++;
  });
  return penuh;
}

window.monSimpleBuildRingkasan = function(){}

})();
