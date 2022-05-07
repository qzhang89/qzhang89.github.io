/*
 * Basis class
 */

// Creates an instance of Basis
function Basis(l, Ne) {
    var Nsite = 4*l+2;
    var dim = 1;
    for (var k=1; k<=Ne; k++) {
        dim *= Nsite-k+1;
        dim /= k;
    }
    var fdim = 1<<Nsite;
    
    this.l     = l;     // Orbital l
    this.Ne    = Ne;    // Number of e-
    this.Nsite = Nsite; // Number of sites
    this.dim   = dim;   // Basis dimension
    
    // Site ml ms
    var ml = new Int32Array(Nsite);
    var ms = new Float32Array(Nsite);
    for (var i=0; i<Nsite; i++) {
        ml[i] = l-i%(Nsite/2);
        ms[i] = i<Nsite/2 ? 0.5 : -0.5;
    }
    this.ml = ml;
    this.ms = ms;
    
    var index = new Int32Array(fdim);  // Basis indices
    var conf  = new Uint32Array(dim);  // Basis configurations (e.g. 100010)
    var ML    = new Int32Array(dim);   // Basis total ML
    var MS    = new Float32Array(dim); // Basis total MS
    
    // Setup index, conf, ML and MS
    var i = 0;
    for (var iconf=0; iconf<fdim; iconf++) {
        if (this.countBit(iconf) == Ne) {
            index[iconf] = i;
            conf[i] = iconf;
            ML[i] = this.getML(iconf);
            MS[i] = this.getMS(iconf);
            i++;
        }
    }
    
    this.index = index;
    this.conf  = conf;
    this.ML    = ML;
    this.MS    = MS;
};

// Count the number of 1's in iconf
Basis.prototype.countBit = function(iconf) {
    iconf = iconf-((iconf>>1)&0x55555555);
    iconf = (iconf&0x33333333)+((iconf>>2)&0x33333333);
    return (((iconf+(iconf>>4))&0x0F0F0F0F)*0x01010101)>>24;
};

// Test if a bit is set or not
Basis.prototype.isBit = function(isite, iconf) {
    var Nsite = this.Nsite;
    if (iconf&(01<<(Nsite-1-isite))) {
        return true;
    } else {
        return false;
    }
};

// Set a bit on a given configuration
Basis.prototype.setBit = function(isite, iconf) {
    var Nsite = this.Nsite;
    return iconf|(01<<(Nsite-1-isite));
};

// Clear a bit on a given configuration
Basis.prototype.clearBit = function(isite, iconf) {
    var Nsite = this.Nsite;
    return iconf&~(01<<(Nsite-1-isite));
};

// Calculate total ML
Basis.prototype.getML = function(iconf) {
    var Nsite = this.Nsite;
    var ML = 0;
    for (var i=0; i<Nsite; i++) {
        ML += (iconf>>(Nsite-1-i)&01)*this.ml[i];
    }
    return ML;
};

// Calculate total MS
Basis.prototype.getMS = function(iconf) {
    var Nsite = this.Nsite;
    var MS = 0;
    for (var i=0; i<Nsite; i++) {
        MS += (iconf>>(Nsite-1-i)&01)*this.ms[i];
    }
    return MS;
};

// Output the configuration string in bit format
Basis.prototype.printconf = function(iconf) {
    var Nsite = this.Nsite;
    var str = "";
    for (var i=0; i<Nsite; i++) {
        str += iconf>>(Nsite-1-i)&01;
    }
    return str;
};

