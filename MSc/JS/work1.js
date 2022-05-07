// Import scripts to worker
importScripts('Gaunt.js');
importScripts('CGcoeff.js');
importScripts('Vec.js');
importScripts('Eig.js');
importScripts('Basis.js');
importScripts('BasisJJ.js');
importScripts('Multiplet.js');

// Worker receives message
self.addEventListener('message', function(evt) {
    var data = evt.data;
    var l  = data.l;
    var Ne = data.Ne;
    var Fk = data.Fk;
    var SO = data.SO;
    
    var mtp = new Multiplet(l, Ne);
    var energy = mtp.getEnergy(Fk, SO);
    
    self.postMessage({"mtp":mtp, "energy":energy});
}, false);