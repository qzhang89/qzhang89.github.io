// Import scripts to worker
importScripts('Gaunt.js');
importScripts('Eig.js');
importScripts('Basis.js');
importScripts('Crystal.js');

// Worker receives message
self.addEventListener('message', function(evt) {
    var data = evt.data;
    var qList = data.qList;
    var l     = data.l;
    var Ne    = data.Ne;
    var Fk    = data.Fk;
    var SO    = data.SO;
    var Ik    = data.Ik;
    
    var crystal = new Crystal(qList, l, Ne);
    var energy  = crystal.getEnergy(Fk, SO, Ik);
    
    self.postMessage({"energy":energy});
}, false);
