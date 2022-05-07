/*
 * Basis class for jj-coupling
 */

// Creates an instance of BasisJJ
function BasisJJ(l, Ne) {
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
    
    // Site j mj
    var j  = new Float32Array(Nsite);
    var mj = new Float32Array(Nsite);
    for (var i=0; i<=Nsite/2; i++) {
        j[i]  = l+0.5;
        mj[i] = l+0.5-i;
    }
    for (var i=Nsite/2+1; i<Nsite; i++) {
        j[i]  = l-0.5;
        mj[i] = l-0.5-i+Nsite/2+1;
    }
    this.j  = j;
    this.mj = mj;
    
    var index = new Int32Array(fdim);  // Basis indices
    var conf  = new Uint32Array(dim);  // Basis configurations (e.g. 100010)
    var jList = new Array(dim);        // Basis j List (e.g. [[1.5,1.5], [1.5,0.5], ...])
    var MJ    = new Float32Array(dim); // Basis total MJ
    
    // Setup index, conf, jList and MJ
    var i = 0;
    for (var iconf=0; iconf<fdim; iconf++) {
        if (this.countBit(iconf) == Ne) {
            index[iconf] = i;
            conf[i] = iconf;
            jList[i] = this.getjList(iconf);
            MJ[i] = this.getMJ(iconf);
            i++;
        }
    }
    
    this.index = index;
    this.conf  = conf;
    this.jList = jList;
    this.MJ    = MJ;
};

// Count the number of 1's in iconf
BasisJJ.prototype.countBit = function(iconf) {
    iconf = iconf-((iconf>>1)&0x55555555);
    iconf = (iconf&0x33333333)+((iconf>>2)&0x33333333);
    return (((iconf+(iconf>>4))&0x0F0F0F0F)*0x01010101)>>24;
};

// Test if a bit is set or not
BasisJJ.prototype.isBit = function(isite, iconf) {
    var Nsite = this.Nsite;
    if (iconf&(01<<(Nsite-1-isite))) {
        return true;
    } else {
        return false;
    }
};

// Set a bit on a given configuration
BasisJJ.prototype.setBit = function(isite, iconf) {
    var Nsite = this.Nsite;
    return iconf|(01<<(Nsite-1-isite));
};

// Clear a bit on a given configuration
BasisJJ.prototype.clearBit = function(isite, iconf) {
    var Nsite = this.Nsite;
    return iconf&~(01<<(Nsite-1-isite));
};

// Calculate j List
BasisJJ.prototype.getjList = function(iconf) {
    var Nsite = this.Nsite;
    var jList = [];
    for (var i=0; i<Nsite; i++) {
        if (iconf>>(Nsite-1-i)&01) {
            jList.push(this.j[i]);
        }
    }
    return jList;
};

// Calculate total MJ
BasisJJ.prototype.getMJ = function(iconf) {
    var Nsite = this.Nsite;
    var MJ = 0;
    for (var i=0; i<Nsite; i++) {
        MJ += (iconf>>(Nsite-1-i)&01)*this.mj[i];
    }
    return MJ;
};

// Apply J+ to a vector
BasisJJ.prototype.Jp = function(v) {
    var Nsite = this.Nsite;
    var dim   = this.dim;
    var index = this.index;
    var conf  = this.conf;
    
    var w = new Float64Array(dim);
    // Search for non-zero basis in the given vector
    for (var i=0; i<dim; i++) {
        if (v[i]!=0) {
            // This basis is non-zero, let's J+ it
            var iconf = conf[i];
            // Search for occupied site
            for (var isite=1; isite<Nsite; isite++) {
                if (this.isBit(isite, iconf)) {
                    // This site has an electron, let's kick it <-- direction if possible
                    var j  = this.j[isite];
                    var mj = this.mj[isite];
                    var jsite = isite-1;
                    if (isite!=Nsite/2+1 && !this.isBit(jsite, iconf)) {
                        var jconf = this.setBit(jsite, this.clearBit(isite, iconf));
                        w[index[jconf]] += ap(j, mj)*v[i];
                    }
                }
            }
        }
    }
    return w;
    
    function ap(j, m) {
        return Math.sqrt((j+m+1)*(j-m));
    }
};

// Apply J- to a vector
BasisJJ.prototype.Jm = function(v) {
    var Nsite = this.Nsite;
    var dim   = this.dim;
    var index = this.index;
    var conf  = this.conf;
    
    var w = new Float64Array(dim);
    // Search for non-zero basis in the given vector
    for (var i=0; i<dim; i++) {
        if (v[i]!=0) {
            // This basis is non-zero, let's J- it
            var iconf = conf[i];
            // Search for occupied site
            for (var isite=0; isite<Nsite-1; isite++) {
                if (this.isBit(isite, iconf)) {
                    // This site has an electron, let's kick it --> direction if possible
                    var j  = this.j[isite];
                    var mj = this.mj[isite];
                    var jsite = isite+1;
                    if (isite!=Nsite/2 && !this.isBit(jsite, iconf)) {
                        var jconf = this.setBit(jsite, this.clearBit(isite, iconf));
                        w[index[jconf]] += am(j, mj)*v[i];
                    }
                }
            }
        }
    }
    return w;
    
    function am(j, m) {
        return Math.sqrt((j+m)*(j-m+1));
    }
};

// Output the configuration string in bit format
BasisJJ.prototype.printconf = function(iconf) {
    var Nsite = this.Nsite;
    var str = "";
    for (var i=0; i<Nsite; i++) {
        str += iconf>>(Nsite-1-i)&01;
    }
    return str;
};

// Output the configuration string in 2nd quantization format
BasisJJ.prototype.printconf2nd = function(iconf) {
    var Nsite = this.Nsite;
    var str = "";
    for (var i=Nsite-1; i>=0; i--) {
        var bit = iconf>>(Nsite-1-i)&01;
        if (bit) {
            var j  = this.j[i];
            var mj = this.mj[i];
            str += "c_{"+j+mj+"}^\\dagger ";
        }
    }
    return str;
};

// Output the configuration string in 2nd quantization format (hole)
BasisJJ.prototype.printconf2ndHole = function(iconf) {
    var Nsite = this.Nsite;
    var str = "";
    for (var i=Nsite-1; i>=0; i--) {
        var bit = iconf>>(Nsite-1-i)&01;
        if (!bit) {
            var j  = -this.j[i];;
            var mj = -this.mj[i];
            str += "h_{"+j+mj+"}^\\dagger ";
        }
    }
    return str;
};
