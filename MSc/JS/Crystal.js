/*
 * Creates an instance of crystal structure
 */
function Crystal(qList, l, Ne) {
    this.qList = qList;
    this.l     = l;
    this.Ne    = Ne;
    this.basis = new Basis(l, Ne);
    
    // qavg and Ravg
    var Nq = qList.length;
    var qavg = 0;
    var Ravg = 0;
    for (var c=0; c<Nq; c++) {
        qavg += qList[c].q;
        Ravg += qList[c].r;
        if (qList[c].r<=0) {
            console.log("Crystal: Non-positive point charge distance.");
            return -1;
        } else if (qList[c].r<1) {
            console.log("Crystal Warning: point charge distance too small.");
        }
    }
    if (qavg==0) {
        console.log("Crystal: Zero average charge not allowed.");
        return -1;
    }
    qavg /= Nq;
    Ravg /= Nq;
    this.qavg = qavg;
    this.Ravg = Ravg;
}

Crystal.prototype.getEnergy = function(Fk, SO, Ik) {
    var qList   = this.qList;
    var myBasis = this.basis;
    
    var qavg = this.qavg;
    var Ravg = this.Ravg;
    
    var Nq  = qList.length;
    var dim = myBasis.dim;
    var l   = this.l;
    var Nsite = 4*l+2;
    
    // Slater integral
    var Rck = [];
    if (qavg!=0) { // Avoid division by zero
        for (var c=0; c<Nq; c++) {
            var qc = qList[c].q;
            var Rc = qList[c].r;
            Rck[c] = [];
            for (var k=0; k<=2*l; k+=2) {
                Rck[c][k] = qc/qavg*Math.pow(Ravg/Rc,k+1)*Ik[k];
            }
        }
    } else {
        console.log("Crystal: Zero average charge not allowed.");
        return -1;
    }
    
    // Gaunt coefficients
    var Gauntk = [];
    for (var k=0; k<=2*l; k+=2) {
        Gauntk[k] = Gaunt.mat(l, l, k);
    }
    
    // Angular integral
    var AckRe = [];
    var AckIm = [];
    for (var c=0; c<Nq; c++) {
        AckRe[c] = [];
        AckIm[c] = [];
        for (var k=0; k<=2*l; k+=2) {
            AckRe[c][k] = [];
            AckIm[c][k] = [];
            for (var m1=-l; m1<=l; m1++) {
                AckRe[c][k][m1] = [];
                AckIm[c][k][m1] = [];
            }
        }
    }
    for (var c=0; c<Nq; c++) {
        var thetac = qList[c].theta;
        var phic   = qList[c].phi;
        for (var k=0; k<=2*l; k+=2) {
            for (var m1=-l; m1<=l; m1++) {
                for (var m2=-l; m2<=l; m2++) {
                    var mu = m2-m1;
                    var amu = Math.abs(mu);
                    var YkmuRe = 0;
                    var YkmuIm = 0;
                    if (amu<=k) {
                        var fact = Math.sqrt((2*k+1)/(4*Math.PI) * factorial(k-amu) / factorial(k+amu));
                        var Pkmu = lgndr(k, amu, Math.cos(thetac));
                        if (mu<0) {
                            Pkmu *= Math.pow(-1, amu);
                        }
                        YkmuRe = fact*Pkmu*Math.cos(mu*phic);
                        YkmuIm = fact*Pkmu*Math.sin(mu*phic);
                    }
                    AckRe[c][k][m1][m2] = Math.pow(-1,mu)*Gauntk[k][m1][m2]*YkmuRe;
                    AckIm[c][k][m1][m2] = Math.pow(-1,mu)*Gauntk[k][m1][m2]*YkmuIm;
                }
            }
        }
    }
    
    // Setup Hcf (a complex Hermitian)
    var HcfRe = new Float64Array(dim*dim);
    var HcfIm = new Float64Array(dim*dim);
    for (var i=0; i<dim; i++) {
        // | i >
        var iconf = myBasis.conf[i];
        for (var site1=0; site1<Nsite; site1++) {
            if (myBasis.isBit(site1, iconf)) {
                var conf1 = myBasis.clearBit(site1, iconf);
                var mask = ~(0xFFFFFFFF<<(Nsite-site1-1));
                var fsign1 = 1-2*(myBasis.countBit(iconf&mask)&01);
                // < j |
                for (var site2=0; site2<Nsite; site2++) {
                    if (!myBasis.isBit(site2, conf1)) {
                        var conf2 = myBasis.setBit(site2, conf1);
                        var jconf = conf2;
                        mask = ~(0xFFFFFFFF<<(Nsite-site2-1));
                        var fsign2 = fsign1*(1-2*(myBasis.countBit(conf1&mask)&01));
                        var j = myBasis.index[jconf];
                        var m1 = myBasis.ml[site1];
                        var m2 = myBasis.ml[site2];
                        var s1 = myBasis.ms[site1];
                        var s2 = myBasis.ms[site2];
                        if (s1 != s2) {
                            HcfRe[i*dim+j] += 0;
                            HcfIm[i*dim+j] += 0;
                        } else {
                            for (var c=0; c<Nq; c++) {
                                for (var k=2; k<=2*l; k+=2) {
                                    var kfact = 4*Math.PI/(2*k+1);
                                    HcfRe[i*dim+j] += kfact*fsign2*Rck[c][k]*AckRe[c][k][m1][m2];
                                    HcfIm[i*dim+j] += kfact*fsign2*Rck[c][k]*AckIm[c][k][m1][m2];
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    var isCplx = false;
    for (var i=0; i<dim*dim; i++) {
        if (Math.abs(HcfIm[i])>1e-12) {
            isCplx = true;
            break;
        }
    }
    
    // Prepare [Re -Im; Im Re] for diagonalization
    var dim2 = 2*dim;
    var Hcf = null;
    if (isCplx) {
        Hcf = new Float64Array(dim2*dim2);
        for (var i=0; i<dim; i++) {
            for (var j=0; j<dim; j++) {
                Hcf[i*dim2+j] = HcfRe[i*dim+j];
            }
            for (var j=dim; j<dim2; j++) {
                Hcf[i*dim2+j] = -HcfIm[i*dim+(j-dim)];
            }
        }
        for (var i=dim; i<dim2; i++) {
            for (var j=0; j<dim; j++) {
                Hcf[i*dim2+j] = HcfIm[(i-dim)*dim+j];
            }
            for (var j=dim; j<dim2; j++) {
                Hcf[i*dim2+j] = HcfRe[(i-dim)*dim+(j-dim)];
            }
        }
    } else {
        Hcf = HcfRe;
    }
    
    // Setup Hu
    var Hu = new Float64Array(dim*dim);
    for (var i=0; i<dim; i++) {
        // | i >
        var iconf = myBasis.conf[i];
        for (var site1=0; site1<Nsite; site1++) {
            if (myBasis.isBit(site1, iconf)) {
                var conf1 = myBasis.clearBit(site1, iconf);
                var mask = ~(0xFFFFFFFF<<(Nsite-site1-1));
                var fsign1 = 1-2*(myBasis.countBit(iconf&mask)&01);
                for (var site2=0; site2<Nsite; site2++) {
                    if (myBasis.isBit(site2, conf1)) {
                        var conf2 = myBasis.clearBit(site2, conf1);
                        mask = ~(0xFFFFFFFF<<(Nsite-site2-1));
                        var fsign2 = fsign1*(1-2*(myBasis.countBit(conf1&mask)&01));
                        // < j |
                        for (var site3=0; site3<Nsite; site3++) {
                            if (!myBasis.isBit(site3, conf2)) {
                                var conf3 = myBasis.setBit(site3, conf2);
                                mask = ~(0xFFFFFFFF<<(Nsite-site3-1));
                                var fsign3 = fsign2*(1-2*(myBasis.countBit(conf2&mask)&01));
                                for (var site4=0; site4<Nsite; site4++) {
                                    if (!myBasis.isBit(site4, conf3)) {
                                        var conf4 = myBasis.setBit(site4, conf3);
                                        var jconf = conf4;
                                        mask = ~(0xFFFFFFFF<<(Nsite-site4-1));
                                        var fsign4 = fsign3*(1-2*(myBasis.countBit(conf3&mask)&01));
                                        var j = myBasis.index[jconf];
                                        var m1 = myBasis.ml[site1];
                                        var m2 = myBasis.ml[site2];
                                        var m3 = myBasis.ml[site3];
                                        var m4 = myBasis.ml[site4];
                                        var s1 = myBasis.ms[site1];
                                        var s2 = myBasis.ms[site2];
                                        var s3 = myBasis.ms[site3];
                                        var s4 = myBasis.ms[site4];
                                        if (s1!=s4 || s2!=s3 || m1+m2!=m3+m4) {
                                            Hu[i*dim+j] += 0;
                                        } else {
                                            for (var k=0; k<=2*l; k+=2) {
                                                var kfact = 4*Math.PI/(2*k+1);
                                                Hu[i*dim+j] += 0.5*kfact*fsign4*Math.pow(-1,m1-m4)*Fk[k]
                                                               *Gauntk[k][m1][m4]*Gauntk[k][m2][m3];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Setup spin-orbit Hamiltonian
    var Hso = new Float64Array(dim*dim);
    for (var i=0; i<dim; i++) {
        // | i >
        var iconf = myBasis.conf[i];
        for (var site1=0; site1<Nsite; site1++) {
            if (myBasis.isBit(site1, iconf)) {
                var conf1 = myBasis.clearBit(site1, iconf);
                var mask = ~(0xFFFFFFFF<<(Nsite-site1-1));
                var fsign1 = 1-2*(myBasis.countBit(iconf&mask)&01);
                // < j |
                for (var site2=0; site2<Nsite; site2++) {
                    if (!myBasis.isBit(site2, conf1)) {
                        var conf2 = myBasis.setBit(site2, conf1);
                        var jconf = conf2;
                        mask = ~(0xFFFFFFFF<<(Nsite-site2-1));
                        var fsign2 = fsign1*(1-2*(myBasis.countBit(conf1&mask)&01));
                        var j = myBasis.index[jconf];
                        var m1 = myBasis.ml[site1];
                        var m2 = myBasis.ml[site2];
                        var s1 = myBasis.ms[site1];
                        var s2 = myBasis.ms[site2];
                        if (m1==m2+1 && s1==s2-1) {
                            Hso[i*dim+j] += fsign2*SO*0.5*ap(l,m2)*am(0.5,s2);
                        } else if (m1==m2-1 && s1==s2+1) {
                            Hso[i*dim+j] += fsign2*SO*0.5*am(l,m2)*ap(0.5,s2);
                        } else if (m1==m2 && s1==s2) {
                            Hso[i*dim+j] += fsign2*SO*m2*s2;
                        }
                    }
                }
            }
        }
    }
    
    // Full Hamiltonian
    var Hfull = null;
    if (isCplx) {
        Hfull = new Float64Array(dim2*dim2);
        for (var i=0; i<dim; i++) {
            for (var j=0; j<dim; j++) {
                Hfull[i*dim2+j] = Hcf[i*dim2+j] + Hu[i*dim+j] + Hso[i*dim+j];
            }
        }
        for (var i=dim; i<dim2; i++) {
            for (var j=dim; j<dim2; j++) {
                Hfull[i*dim2+j] = Hcf[i*dim2+j] + Hu[(i-dim)*dim+(j-dim)] + Hso[(i-dim)*dim+(j-dim)];
            }
        }
    } else {
        Hfull = new Float64Array(dim*dim);
        for (var i=0; i<dim*dim; i++) {
            Hfull[i] = Hcf[i] + Hu[i] + Hso[i];
        }
    }
    var E = Eig.solve(Hfull);
    
    return E;
    
    function ArrayToString(arr) {
        var n = arr.length;
        var str = "[" + arr[0];
        for (var i=0; i<n; i++) {
            str += ", " + arr[i];
        }
        str += "]";
        return str;
    }
    
    function factorial(n) {
        var result = 1;
        for(var i=2; i<=n; i++) {
            result *= i;
        }
        return result;
    }
    
    function ap(l, m) {
        return Math.sqrt((l+m+1)*(l-m));
    }
    
    function am(l, m) {
        return Math.sqrt((l+m)*(l-m+1));
    }
    
    // Legendre polynomial Plm(x)
    function lgndr(l, m, x) {
        if (m<0 || m>l || Math.abs(x)>1.0) {
            console.log("Invalid arguments for Plm.");
        }
        
        // Compute Pmm
        var Pmm = 1.0;
        if (m > 0) {
            var somx2 = Math.sqrt((1.0+x)*(1.0-x));
            var fact  = 1.0;
            for (var i=1; i<=m; i++) {
                Pmm  = Pmm * (-fact*somx2);
                fact = fact + 2.0;
            }
        }
        
        if (l == m) {
            return Pmm;
        } else {
            // Compute Pmp1m
            var Pmp1m = x*(2*m+1)*Pmm;
            if (l == m+1) {
                return Pmp1m;
            } else {
                // Compute Plm, l > m + 1
                var Plm = 0;
                for (var ll=m+2; ll<=l; ll++) {
                    Plm = (x*(2*ll-1)*Pmp1m - (ll+m-1)*Pmm) / (ll-m);
                    Pmm = Pmp1m;
                    Pmp1m = Plm;
                }
                return Plm;
            }
        }
    }
};
