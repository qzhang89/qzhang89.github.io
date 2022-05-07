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

//Apply L+ to a vector
Basis.prototype.Lp = function(v) {
    var Nsite = this.Nsite;
    var dim   = this.dim;
    var index = this.index;
    var conf  = this.conf;
    
    var w = new Float64Array(dim);
    // Search for non-zero basis in the given vector
    for (var i=0; i<dim; i++) {
        if (v[i]!=0) {
            // This basis is non-zero, let's L+ it
            var iconf = conf[i];
            // Search for occupied site
            for (var isite=0; isite<Nsite; isite++) {
                if (this.isBit(isite, iconf)) {
                    // This site has an electron, let's kick it <-- direction if possible
                    var ml = this.ml[isite];
                    var jsite = isite-1;
                    if (isite%(Nsite/2)!=0 && !this.isBit(jsite, iconf)) {
                        var jconf = this.setBit(jsite, this.clearBit(isite, iconf));
                        w[index[jconf]] += ap(this.l, ml)*v[i];
                    }
                }
            }
        }
    }
    return w;
    
    function ap(l, m) {
        return Math.sqrt((l+m+1)*(l-m));
    }
};

// Apply L- to a vector
Basis.prototype.Lm = function(v) {
    var Nsite = this.Nsite;
    var dim   = this.dim;
    var index = this.index;
    var conf  = this.conf;
    
    var w = new Float64Array(dim);
    // Search for non-zero basis in the given vector
    for (var i=0; i<dim; i++) {
        if (v[i]!=0) {
            // This basis is non-zero, let's L- it
            var iconf = conf[i];
            // Search for occupied site
            for (var isite=0; isite<Nsite; isite++) {
                if (this.isBit(isite, iconf)) {
                    // This site has an electron, let's kick it --> direction if possible
                    var ml = this.ml[isite];
                    var jsite = isite+1;
                    if (isite%(Nsite/2)!=Nsite/2-1 && !this.isBit(jsite, iconf)) {
                        var jconf = this.setBit(jsite, this.clearBit(isite, iconf));
                        w[index[jconf]] += am(this.l, ml)*v[i];
                    }
                }
            }
        }
    }
    return w;
    
    function am(l, m) {
        return Math.sqrt((l+m)*(l-m+1));
    }
};

// Apply S+ to a vector
Basis.prototype.Sp = function(v) {
    var Nsite = this.Nsite;
    var dim   = this.dim;
    var index = this.index;
    var conf  = this.conf;
    
    var w = new Float64Array(dim);
    // Search for non-zero basis in the given vector
    for (var i=0; i<dim; i++) {
        if (v[i]!=0) {
            // This basis is non-zero, let's S+ it
            var iconf = conf[i];
            // Search for occupied site
            for (var isite=Nsite/2; isite<Nsite; isite++) {
                if (this.isBit(isite, iconf)) {
                    // This site has an electron, let's kick it up if possible
                    var jsite = isite-Nsite/2;
                    if (!this.isBit(jsite, iconf)) {
                        var jconf = this.setBit(jsite, this.clearBit(isite, iconf));
                        var mask = (0xFFFFFFFF<<(Nsite-isite))^(0xFFFFFFFF<<(Nsite-jsite-1));
                        var fsign = 1-2*(this.countBit(iconf&mask)&01);
                        w[index[jconf]] += fsign*ap(0.5, -0.5)*v[i];
                    }
                }
            }
        }
    }
    return w;
    
    function ap(s, m) {
        return Math.sqrt((s+m+1)*(s-m));
    }
};

// Apply S- to a vector
Basis.prototype.Sm = function(v) {
    var Nsite = this.Nsite;
    var dim   = this.dim;
    var index = this.index;
    var conf  = this.conf;
    
    var w = new Float64Array(dim);
    // Search for non-zero basis in the given vector
    for (var i=0; i<dim; i++) {
        if (v[i]!=0) {
            // This basis is non-zero, let's S- it
            var iconf = conf[i];
            // Search for occupied site
            for (var isite=0; isite<Nsite/2; isite++) {
                if (this.isBit(isite, iconf)) {
                    // This site has an electron, let's kick it down if possible
                    var jsite = isite+Nsite/2;
                    if (!this.isBit(jsite, iconf)) {
                        var jconf = this.setBit(jsite, this.clearBit(isite, iconf));
                        var mask = (0xFFFFFFFF<<(Nsite-isite-1))^(0xFFFFFFFF<<(Nsite-jsite));
                        var fsign = 1-2*(this.countBit(iconf&mask)&01);
                        w[index[jconf]] += fsign*am(0.5, 0.5)*v[i];
                    }
                }
            }
        }
    }
    return w;
    
    function am(s, m) {
        return Math.sqrt((s+m)*(s-m+1));
    }
};

// Apply singlet S to a parent vector (d shell only)
Basis.prototype.sigS = function(v) {
    if (this.l!=2) {
        return -1;
    }
    var Ne = this.Ne;
    var Ne2 = Ne<=5 ? Ne-2 : Ne+2;
    var Nsite = this.Nsite;
    var dim   = this.dim;
    var index = this.index;
    var pBasis = new Basis(this.l, Ne2);
    var pdim = pBasis.dim;
    var conf = pBasis.conf;
    
    var w = new Float64Array(dim);
    // Search for non-zero basis in the given vector
    for (var i=0; i<pdim; i++) {
        if (v[i]!=0) {
            // This basis is non-zero, let's sigS it
            var iconf = conf[i];
            
            if (Ne<=5) {
                for (var j=0; j<5; j++) {
                    var jsite = 4-j, ksite = 5+j;
                    if (!this.isBit(jsite, iconf) && !this.isBit(ksite, iconf)) {
                        var jconf = this.setBit(jsite, iconf);
                        var mask = ~(0xFFFFFFFF<<(Nsite-jsite-1));
                        var fsign = 1-2*(this.countBit(iconf&mask)&01);
                        var kconf = this.setBit(ksite, jconf);
                        mask = ~(0xFFFFFFFF<<(Nsite-ksite-1));
                        fsign *= 1-2*(this.countBit(jconf&mask)&01);
                        w[index[kconf]] += Math.pow(-1,j)*fsign*v[i];
                    }
                }
            } else {
                for (var j=0; j<5; j++) {
                    var jsite = 4-j, ksite = 5+j;
                    if (this.isBit(jsite, iconf) && this.isBit(ksite, iconf)) {
                        var jconf = this.clearBit(jsite, iconf);
                        var mask = ~(0xFFFFFFFF<<(Nsite-jsite-1));
                        var fsign = 1-2*(this.countBit(iconf&mask)&01);
                        var kconf = this.clearBit(ksite, jconf);
                        mask = ~(0xFFFFFFFF<<(Nsite-ksite-1));
                        fsign *= 1-2*(this.countBit(jconf&mask)&01);
                        w[index[kconf]] += Math.pow(-1,j)*fsign*v[i];
                    }
                }
            }
        }
    }
    return w;
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

// Output the configuration string in 2nd quantization format
Basis.prototype.printconf2nd = function(iconf) {
    var Nsite = this.Nsite;
    var str = "";
    for (var i=Nsite-1; i>=0; i--) {
        var bit = iconf>>(Nsite-1-i)&01;
        if (bit) {
            var ml = this.ml[i];
            var ms = i<Nsite/2 ? "\\uparrow" : "\\downarrow";
            str += "c_{"+ml+ms+"}^\\dagger ";
        }
    }
    return str;
};

// Output the configuration string in 2nd quantization format (hole)
Basis.prototype.printconf2ndHole = function(iconf) {
    var Nsite = this.Nsite;
    var str = "";
    for (var i=Nsite-1; i>=0; i--) {
        var bit = iconf>>(Nsite-1-i)&01;
        if (!bit) {
            var ml = -this.ml[i];;
            var ms = i<Nsite/2 ? "\\downarrow" : "\\uparrow";
            str += "h_{"+ml+ms+"}^\\dagger ";
        }
    }
    return str;
};
