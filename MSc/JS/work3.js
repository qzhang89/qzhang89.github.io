// Import scripts to worker
importScripts('Gaunt.js');
importScripts('Eig.js');
importScripts('Basis.js');
importScripts('Crystal.js');

// Worker receives message
self.addEventListener('message', function(evt) {
    var data = evt.data;
    var cList = data.cList;
    var aList = data.aList;
    
    var energyList = [];
    
    for (var i=0; i<aList.length; i++) {
        var ci = cList[i];
        var crystal = new Crystal(ci.qList, ci.l, ci.Ne);
        var energy = crystal.getEnergy(ci.Fk, ci.SO, ci.Ik);
        energyList.push(energy);
    }
    
    self.postMessage({"aList":aList, "energyList":energyList});
}, false);
