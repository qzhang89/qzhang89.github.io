/*
 * Creates an instance of multiplet list
 * Need to include Basis.js, BasisJJ.js, Gaunt.js, CGcoeff.js, Eig.js
 */
function Multiplet(l, Ne) {
    if (l<0 || Ne<0 || Ne>4*l+2) {
        console.log("Multiplet: Illegal inputs.");
        return -1;
    }
    
    // Basis
    var myBasis = new Basis(l, Ne);
    var Nsite = myBasis.Nsite;
    var dim   = myBasis.dim;
    
    // Setup ML-MS table (negative and 0.5 index allowed)
    var MLmax = (l+l-Math.ceil(Ne/2)+1)*Math.ceil(Ne/2)/2
               +(l+l-Math.floor(Ne/2)+1)*Math.floor(Ne/2)/2;
    var MSmax = Ne<=Nsite/2 ? 0.5*Ne : 0.5*(Nsite-Ne);
    var MTable = [];
    var M0Table = [];
    for (var ML=-MLmax; ML<=MLmax; ML++) {
        MTable[ML] = [];
        M0Table[ML] = [];
        for (var MS=-MSmax; MS<=MSmax; MS++) {
            MTable[ML][MS] = 0;
            M0Table[ML][MS] = 0;
        }
    }
    for (var i=0; i<dim; i++) {
        ML = myBasis.ML[i];
        MS = myBasis.MS[i];
        MTable[ML][MS]++;
        M0Table[ML][MS]++;
    }
    
    // Multiplet list
    var utList = [];
    
    // Initialize vuList
    var vuList = [];
    for (var L=MLmax; L>=0; L--) {
        vuList[L] = [];
        for (var S=MSmax; S>=0; S--) {
            vuList[L][S] = [];
            for (var ML=L; ML>=-L; ML--) {
                vuList[L][S][ML] = [];
                for (var MS=S; MS>=-S; MS--) {
                    vuList[L][S][ML][MS] = [];
                }
            }
        }
    }
    
    // Apply ladder operators
    for (var S=MSmax; S>=0; S--) {
        for (var L=MLmax; L>=0; L--) {
            // Start from the largest ML MS
            if (MTable[L][S]!=0) {
                var N = MTable[L][S];
                for (var sn=0; sn<N; sn++) {
                    // Is eigen-state by itself OR is waiting for orthogonization?
                    if (M0Table[L][S]==1) {
                        for (var i=0; i<dim; i++) {
                            if (L==myBasis.ML[i] && S==myBasis.MS[i]) {
                                var v = Vec.zeros(dim);
                                v[i] = 1;
                                vuList[L][S][L][S][0] = v;
                            }
                        }
                    } else if (l==2 && Ne>2 && Ne<8 && MTable[L][S]>1) {
                        // Seniority for d shell
                        var Ne2 = Ne<=5 ? Ne-2 : Ne+2;
                        var parent = new Multiplet(l, Ne2);
                        var pvList = parent.vuList;
                        
                        // Apply singlet S operator
                        var v = myBasis.sigS(pvList[L][S][L][S][sn]);
                        vuList[L][S][L][S][sn] = Vec.normalize(v);
                    } else {
                        var ref = [];
                        for (var LL=MLmax; LL>=L; LL--) {
                            for (var SS=MSmax; SS>=S; SS--) {
                                for (var nn=0; nn<vuList[LL][SS][L][S].length; nn++) {
                                    ref.push(vuList[LL][SS][L][S][nn]);
                                }
                            }
                        }
                        var v = Vec.zeros(dim);
                        do {
                            for (var i=0; i<dim; i++) {
                                if(Math.abs(ref[0][i])>1e-8) {
                                    v[i] = Math.random();
                                }
                            }
                            for (var i=0; i<ref.length; i++) {
                                Vec.orthogonalize(v, ref[i]);
                            }
                        } while (Vec.dot(v, v)<1e-4);
                        vuList[L][S][L][S][sn] = Vec.normalize(v);
                    }
                    MTable[L][S]--;
                    
                    // Phase convention for the leading vector
                    var i = 0;
                    while (Math.abs(vuList[L][S][L][S][sn][i])<1e-8) {
                        i++;
                        if (vuList[L][S][L][S][sn][i]<0) {
                            vuList[L][S][L][S][sn] = Vec.scale(-1, vuList[L][S][L][S][sn]);
                        }
                    }
                    
                    for (var MS=S; MS>=-S; MS--) {
                        // Apply L-
                        for (var ML=L; ML>-L; ML--) {
                            var v = myBasis.Lm(vuList[L][S][ML][MS][sn]);
                            vuList[L][S][ML-1][MS][sn] = Vec.normalize(v);
                            MTable[ML-1][MS]--;
                        }
                        // Apply S-
                        if (MS>-S) {
                            var v = myBasis.Sm(vuList[L][S][L][MS][sn]);
                            vuList[L][S][L][MS-1][sn] = Vec.normalize(v);
                            MTable[L][MS-1]--;
                        }
                    }
                }
                utList.push({L:L, S:S, N:N});
            }
        }
    }
    
    // jj-coupling scheme
    // BasisJJ
    var myBasisJJ = new BasisJJ(l, Ne);
    
    // Find MJmax
    var MJmax = 0;
    for (var i=0; i<dim; i++) {
        var MJ = myBasisJJ.MJ[i];
        if (MJ>MJmax) {
            MJmax = MJ;
        }
    }
    
    // Generate non-repeated jList
    var jList0 = [myBasisJJ.jList[0]];
    for (var i=1; i<dim; i++) {
        var jList = myBasisJJ.jList[i];
        var isRep = false;
        for (var j=0; j<jList0.length; j++) {
            if (jList0[j].toString()==jList.toString()) {
                isRep = true;
            }
        }
        if (!isRep) {
            jList0.push(jList);
        }
    }
    
    // Setup jList-MJ table (list index allowed)
    var JTable  = [];
    var J0Table = [];
    for (var ji=0; ji<jList0.length; ji++) {
        var jList = jList0[ji];
        JTable[jList]  = [];
        J0Table[jList] = [];
        for (var MJ=MJmax; MJ>=-MJmax; MJ--) {
            JTable[jList][MJ]  = 0;
            J0Table[jList][MJ] = 0;
        }
    }
    for (var i=0; i<dim; i++) {
        var jList = myBasisJJ.jList[i];
        var MJ = myBasisJJ.MJ[i];
        JTable[jList][MJ]++;
        J0Table[jList][MJ]++;
    }
    
    // Get spin-orbit-terms
    var sotList = [];
    var vsoList = [];
    var register = [];
    for (var p=0; p<jList0.length; p++) {
        var jList = jList0[p];
        var JList = [];
        vsoList[p] = [];
        for (var J=MJmax; J>=0; J--) {
            // Start from the largest MJ
            if (JTable[jList][J]!=0) {
                var N = JTable[jList][J];
                for (var sn=0; sn<N; sn++) {
                    for (var MJ=J; MJ>=-J; MJ--) {
                        for (var i=0; i<dim; i++) {
                            if (jList.toString()==myBasisJJ.jList[i].toString() && MJ==myBasisJJ.MJ[i]) {
                                // Check if the i-th vector has been used
                                var isReg = false;
                                for (var j=0; j<register.length; j++) {
                                    if (i == register[j]) {
                                        isReg = true;
                                        break;
                                    }
                                }
                                if (!isReg) {
                                    var v = Vec.zeros(dim);
                                    v[i] = 1;
                                    vsoList[p].push(v);
                                    JTable[jList][MJ]--;
                                    register.push(i);
                                    break;
                                }
                            }
                        }
                    }
                    JList.push(J);
                }
            }
        }
        sotList.push({jList:jList, JList:JList});
    }
    
    // Re-set JTable
    for (var i=0; i<dim; i++) {
        var jList = myBasisJJ.jList[i];
        var MJ = myBasisJJ.MJ[i];
        JTable[jList][MJ]++;
    }
    
    // Spin-orbit-Coulomb-term list
    var soutList = [];
    
    // Initialize vsouList
    var vsouList = [];
    for (var ji=0; ji<jList0.length; ji++) {
        var jList = jList0[ji];
        vsouList[jList] = [];
        for (var J=MJmax; J>=0; J--) {
            vsouList[jList][J] = [];
            for (var MJ=J; MJ>=-J; MJ--) {
                vsouList[jList][J][MJ] = [];
            }
        }
    }
    
    // Apply ladder operators
    for (var ji=0; ji<jList0.length; ji++) {
        var jList = jList0[ji];
        for (var J=MJmax; J>=0; J--) {
            // Start from the largest MJ
            if (JTable[jList][J]!=0) {
                var N = JTable[jList][J];
                for (var sn=0; sn<N; sn++) {
                    // Is eigen-state by itself OR is waiting for orthogonization?
                    if (J0Table[jList][J]==1) {
                        for (var i=0; i<dim; i++) {
                            if (jList.toString()==myBasisJJ.jList[i].toString() && J==myBasisJJ.MJ[i]) {
                                var v = Vec.zeros(dim);
                                v[i] = 1;
                                vsouList[jList][J][J][0] = v;
                            }
                        }
                    } else {
                        var ref = [];
                        for (var JJ=MJmax; JJ>=J; JJ--) {
                            for (var nn=0; nn<vsouList[jList][JJ][J].length; nn++) {
                                ref.push(vsouList[jList][JJ][J][nn]);
                            }
                        }
                        var v = Vec.zeros(dim);
                        do {
                            for (var i=0; i<dim; i++) {
                                if(Math.abs(ref[0][i])>1e-8) {
                                    v[i] = Math.random();
                                }
                            }
                            for (var i=0; i<ref.length; i++) {
                                Vec.orthogonalize(v, ref[i]);
                            }
                        } while (Vec.dot(v, v)<1e-4);
                        vsouList[jList][J][J][sn] = Vec.normalize(v);
                    }
                    JTable[jList][J]--;
                    
                    // Phase convention for the leading vector
                    var i = 0;
                    while (Math.abs(vsouList[jList][J][J][sn][i])<1e-8) {
                        i++;
                        if (vsouList[jList][J][J][sn][i]<0) {
                            vsouList[jList][J][J][sn] = Vec.scale(-1, vsouList[jList][J][J][sn]);
                        }
                    }
                    
                    // Apply J-
                    for (var MJ=J; MJ>-J; MJ--) {
                        var v = myBasisJJ.Jm(vsouList[jList][J][MJ][sn]);
                        vsouList[jList][J][MJ-1][sn] = Vec.normalize(v);
                        JTable[jList][MJ-1]--;
                    }
                }
                soutList.push({jList:jList, J:J, N:N});
            }
        }
    }
    
    this.l  = l;
    this.Ne = Ne;
    
    this.basis = myBasis;
    this.MLmax = MLmax;
    this.MSmax = MSmax;
    
    this.utList = utList;
    this.vuList = vuList;
    
    this.BasisJJ = myBasisJJ;
    this.jList0 = jList0;
    this.MJmax  = MJmax;
    
    this.sotList  = sotList;
    this.vsoList  = vsoList;
    this.soutList = soutList;
    this.vsouList = vsouList;
}

Multiplet.prototype.getEnergy = function(Fk, SO) {
    var l  = this.l;
    var Ne = this.Ne;
    var myBasis = this.basis;
    var Nsite   = myBasis.Nsite;
    var dim     = myBasis.dim;
    var utList  = this.utList;
    var vuList  = this.vuList;
    
    // Compute k=0,...,2l Gaunt matrices
    var Gauntk = [];
    for (var k=0; k<=2*l; k+=2) {
        Gauntk[k] = Gaunt.mat(l, l, k);
    }
    
    // Setup Hamitonian(k) in terms of Gaunt coefficients (Slater-Condon(k) are just prefactors)
    var Hk = [];
    for (var k=0; k<=2*l; k+=2) {
        Hk[k] = new Float64Array(dim*dim);
    }
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
                                            for (var k=0; k<=2*l; k+=2) {
                                                Hk[k][i*dim+j] += 0;
                                            }
                                        } else {
                                            for (var k=0; k<=2*l; k+=2) {
                                                var kfact = 4*Math.PI/(2*k+1);
                                                Hk[k][i*dim+j] += 0.5*kfact*fsign4*Math.pow(-1,m1-m4)
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
    
    // Analytical eigen-energies
    var euList = [];
    for (var p=0; p<utList.length; p++) {
        euList[p] = [];
        var L = utList[p].L;
        var S = utList[p].S;
        var N = utList[p].N;
        for (var k=0; k<=2*l; k+=2) {
            euList[p][k] = new Float64Array(N*N);
            for (var n1=0; n1<N; n1++) {
                var v1 = vuList[L][S][L][S][n1];
                for (var n2=0; n2<N; n2++) {
                    var v2 = vuList[L][S][L][S][n2];
                    euList[p][k][n1*N+n2] = Vec.dot(v1, Vec.matMult(Hk[k], v2));
                }
            }
        }
    }
    
    // Multiplet average eigen-energy
    var Eavg = 0;
    Eavg += Fk[0]*(2*(2*l+1)*(2*l+1)-(2*l+1)*Math.sqrt(4*Math.PI)*Gauntk[0][0][0]);
    for (var k=2; k<=2*l; k+=2) {
        Eavg += Fk[k]*(-(2*l+1)*Math.sqrt(4*Math.PI/(2*k+1))*Gauntk[k][0][0]);
    }
    Eavg *= Ne*(Ne-1)/(4*l+2)/(4*l+1);
    
    // Multiplet eigen-energies
    var Eu = [];
    var Vu = [];
    for (var p=0; p<utList.length; p++) {
        var N = utList[p].N;
        Eu[p] = [];
        Vu[p] = [];
        var Ep = new Float64Array(N*N);
        for (var k=0; k<=2*l; k+=2) {
            var Fkk = Fk[k];
            for (var i=0; i<N*N; i++) {
                Ep[i] += Fkk*euList[p][k][i];
            }
        }
        var EVu = Eig.solve(Ep, true);
        for (var sn=0; sn<N; sn++) {
            Eu[p][sn] = EVu.E[sn];
            Vu[p][sn] = EVu.V[sn];
        }
    }
    
    // Multiplet eigen-vectors
    var vuEigList = [];
    for (var L=this.MLmax; L>=0; L--) {
        vuEigList[L] = [];
        for (var S=this.MSmax; S>=0; S--) {
            vuEigList[L][S] = [];
            for (var ML=L; ML>=-L; ML--) {
                vuEigList[L][S][ML] = [];
                for (var MS=S; MS>=-S; MS--) {
                    vuEigList[L][S][ML][MS] = [];
                }
            }
        }
    }
    for (var p=0; p<utList.length; p++) {
        var L = utList[p].L;
        var S = utList[p].S;
        var N = utList[p].N;
        for (var ML=L; ML>=-L; ML--) {
            for (var MS=S; MS>=-S; MS--) {
                for (var sn=0; sn<N; sn++) {
                    vuEigList[L][S][ML][MS][sn] = Vec.zeros(dim);
                    for (var i=0; i<dim; i++) {
                        var coeff = 0;
                        for (var w=0; w<N; w++) {
                            coeff += Vu[p][sn][w]*vuList[L][S][ML][MS][w][i];
                        }
                        vuEigList[L][S][ML][MS][sn][i] = coeff;
                    }
                }
            }
        }
    }
    
    // Spin-orbit energies within multiplet terms
    var Euso = [];
    for (var p=0; p<utList.length; p++) {
        Euso[p] = [];
        var L = utList[p].L;
        var S = utList[p].S;
        var N = utList[p].N;
        var Jmin = Math.abs(L-S);
        var Jmax = Math.abs(L+S);
        for (var sn=0; sn<N; sn++) {
            // M factor
            var Mfact = 0;
            if (L*S!=0) {
                for (var i=0; i<dim; i++) {
                    var coeff = vuEigList[L][S][L][S][sn][i];
                    if (Math.abs(coeff)>1e-8) {
                        for (var j=Nsite-1; j>=0; j--) {
                            var bit = myBasis.conf[i]>>(Nsite-1-j)&01;
                            if (bit) {
                                var ml = myBasis.ml[j];
                                var ms = myBasis.ms[j];
                                Mfact += coeff*coeff*ml*ms;
                            }
                        }
                    }
                }
                Mfact /= (L*S);
            }
            
            Euso[p][sn] = [];
            for (var J=Jmax; J>=Jmin; J--) {
                Euso[p][sn].push(Eu[p][sn] + SO*Mfact*0.5*(J*(J+1)-L*(L+1)-S*(S+1)));
            }
        }
    }
    
    // Huso eigen-vectors
    var vusoList = [];
    for (var L=this.MLmax; L>=0; L--) {
        vusoList[L] = [];
        for (var S=this.MSmax; S>=0; S--) {
            vusoList[L][S] = [];
            var Jmin = Math.abs(L-S);
            var Jmax = Math.abs(L+S);
            for (var J=Jmax; J>=Jmin; J--) {
                vusoList[L][S][J] = [];
                for (var MJ=J; MJ>=-J; MJ--) {
                    vusoList[L][S][J][MJ] = [];
                }
            }
        }
    }
    
    // Construct Huso eigen-vectors from CG transformation
    for (var p=0; p<utList.length; p++) {
        var L = utList[p].L;
        var S = utList[p].S;
        var N = utList[p].N;
        var Jmin = Math.abs(L-S);
        var Jmax = Math.abs(L+S);
        var CGmat = new CGcoeff(L, S);
        var CG = CGmat.CG;
        for (var J=Jmax; J>=Jmin; J--) {
            for (var MJ=J; MJ>=-J; MJ--) {
                for (var sn=0; sn<N; sn++) {
                    vusoList[L][S][J][MJ][sn] = Vec.zeros(dim);
                    
                    // Find |L S J MJ> from CG table
                    var n = J-MJ;
                    for (var j=Jmax; j>J; j--) {
                        n += 2*j+1;
                    }
                    var v = CG[n];
                    for (var ii=0; ii<v.length; ii++) {
                        var coeff = v[ii];
                        if (Math.abs(coeff)>1e-8) {
                            var ML = L - Math.floor(ii/(2*S+1));
                            var MS = S - ii%(2*S+1);
                            Vec.axpy(coeff, vuEigList[L][S][ML][MS][sn], vusoList[L][S][J][MJ][sn]);
                        }
                    }
                }
            }
        }
    }
    
    // Setup spin-orbit Hamiltonian
    var Huso = new Float64Array(dim*dim);
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
                            Huso[i*dim+j] += fsign2*SO*0.5*ap(l,m2)*am(0.5,s2);
                        } else if (m1==m2-1 && s1==s2+1) {
                            Huso[i*dim+j] += fsign2*SO*0.5*am(l,m2)*ap(0.5,s2);
                        } else if (m1==m2 && s1==s2) {
                            Huso[i*dim+j] += fsign2*SO*m2*s2;
                        }
                    }
                }
            }
        }
    }
    
    function ap(l, m) {
        return Math.sqrt((l+m+1)*(l-m));
    }
    
    function am(l, m) {
        return Math.sqrt((l+m)*(l-m+1));
    }
    
    // Numerical eigen-energies of Hu + Huso (intermediate)
    var Hu = new Float64Array(dim*dim);
    for (var k=0; k<=2*l; k+=2) {
        var Fkk = Fk[k];
        var Hkk = Hk[k];
        for (var i=0; i<dim*dim; i++) {
            Hu[i] += Fkk*Hkk[i];
        }
    }
    var Hint = new Float64Array(dim*dim);
    for (var i=0; i<dim*dim; i++) {
        Hint[i] = Hu[i]+Huso[i];
    }
    var EVint = Eig.solve(Hint, true);
    var Eint = EVint.E;
    var Vint = EVint.V;
    
    // Hu characters
    var Ku = [];
    for (var p=0; p<utList.length; p++) {
        var L = utList[p].L;
        var S = utList[p].S;
        var N = utList[p].N;
        Ku[p] = [];
        for (var sn=0; sn<N; sn++) {
            Ku[p][sn] = new Float64Array(dim);
            for (var i=0; i<dim; i++) {
                var ichar = 0;
                for (var ML=L; ML>=-L; ML--) {
                    for (var MS=S; MS>=-S; MS--) {
                        ichar += Math.pow(Vec.dot(Vint[i], vuEigList[L][S][ML][MS][sn]), 2);
                    }
                }
                Ku[p][sn][i] = ichar;
            }
        }
    }
    
    // Huso characters
    var Kuso = [];
    for (var p=0; p<utList.length; p++) {
        var L = utList[p].L;
        var S = utList[p].S;
        var N = utList[p].N;
        var Jmin = Math.abs(L-S);
        var Jmax = Math.abs(L+S);
        Kuso[p] = [];
        for (var sn=0; sn<N; sn++) {
            Kuso[p][sn] = [];
            var KusoGroup = [];
            for (var J=Jmax; J>=Jmin; J--) {
                var v = new Float64Array(dim);
                for (var i=0; i<dim; i++) {
                    var ichar = 0;
                    for (var MJ=J; MJ>=-J; MJ--) {
                        ichar += Math.pow(Vec.dot(Vint[i], vusoList[L][S][J][MJ][sn]), 2);
                    }
                    v[i] = ichar;
                }
                KusoGroup.push(v);
            }
            Kuso[p][sn] = KusoGroup;
        }
    }
    
    // J quantum numbers
    var Jint = [];
    for (var p=0; p<utList.length; p++) {
        var L = utList[p].L;
        var S = utList[p].S;
        var N = utList[p].N;
        var Jmin = Math.abs(L-S);
        var Jmax = Math.abs(L+S);
        for (var sn=0; sn<N; sn++) {
            for (var J=Jmax; J>=Jmin; J--) {
                var v = Kuso[p][sn][Jmax-J];
                for (var i=0; i<dim; i++) {
                    if (v[i]>=1.0/dim) {
                        Jint[i] = J;
                    }
                }
            }
        }
    }
    
    // jj-coupling scheme
    var myBasisJJ = this.BasisJJ;
    var sotList   = this.sotList;
    var vsoList   = this.vsoList;
    var soutList  = this.soutList;
    var vsouList  = this.vsouList;
    
    // Calculate spin-orbit-term energy
    var Eso = new Float64Array(sotList.length);
    for (var p=0; p<sotList.length; p++) {
        var jList = sotList[p].jList;
        for (var ji=0; ji<jList.length; ji++) {
            var j = jList[ji];
            Eso[p] += SO*0.5*(j*(j+1)-l*(l+1)-0.5*(0.5+1));
        }
    }
    
    // Generate CG matrix
    var CGmat = new CGcoeff(this.l, 0.5);
    
    // Set up full Hamiltonian under jj-basis
    var Hintjj = new Float64Array(dim*dim);
    for (var i=0; i<dim; i++) {
        var iconf = myBasisJJ.conf[i];
        var iList = jj2ls(iconf, CGmat.CG);
        for (var j=0; j<dim; j++) {
            var jconf = myBasisJJ.conf[j];
            var jList = jj2ls(jconf, CGmat.CG);
            for (var ii=0; ii<iList.length; ii++) {
                var iCG  = iList[ii].CG;
                var iidx = myBasis.index[iList[ii].conf];
                for (var jj=0; jj<jList.length; jj++) {
                    var jCG  = jList[jj].CG;
                    var jidx = myBasis.index[jList[jj].conf];
                    Hintjj[i*dim+j] += iCG*jCG*Hint[iidx*dim+jidx];
                }
            }
        }
    }
    
    // Spin-orbit-term eigen-energies from <n|Hintjj|n>
    var Esou = [];
    var Vsou = [];
    for (var p=0; p<soutList.length; p++) {
        var jList = soutList[p].jList;
        var J = soutList[p].J;
        var N = soutList[p].N;
        Esou[p] = [];
        Vsou[p] = [];
        var Etm = new Float64Array(N*N);
        for (var n1=0; n1<N; n1++) {
            var v1 = vsouList[jList][J][J][n1];
            for (var n2=0; n2<N; n2++) {
                var v2 = vsouList[jList][J][J][n2];
                Etm[n1*N+n2] = Vec.dot(v1, Vec.matMult(Hintjj, v2));
            }
        }
        var EVu = Eig.solve(Etm, true);
        for (var sn=0; sn<N; sn++) {
            Esou[p][sn] = EVu.E[sn];
            Vsou[p][sn] = EVu.V[sn];
        }
    }
    
    // Spin-orbit-term eigen-vectors
    var vsouEigList = [];
    for (var ji=0; ji<this.jList0.length; ji++) {
        var jList = this.jList0[ji];
        vsouEigList[jList] = [];
        for (var J=this.MJmax; J>=0; J--) {
            vsouEigList[jList][J] = [];
            for (var MJ=J; MJ>=-J; MJ--) {
                vsouEigList[jList][J][MJ] = [];
            }
        }
    }
    for (var p=0; p<soutList.length; p++) {
        var jList = soutList[p].jList;
        var J = soutList[p].J;
        var N = soutList[p].N;
        for (var MJ=J; MJ>=-J; MJ--) {
            for (var sn=0; sn<N; sn++) {
                vsouEigList[jList][J][MJ][sn] = Vec.zeros(dim);
                for (var i=0; i<dim; i++) {
                    var coeff = 0;
                    for (var w=0; w<N; w++) {
                        coeff += Vsou[p][sn][w]*vsouList[jList][J][MJ][w][i];
                    }
                    vsouEigList[jList][J][MJ][sn][i] = coeff;
                }
            }
        }
    }
    
    // Full diagonalization in jj-basis
    var EVintjj = Eig.solve(Hintjj, true);
    var Eintjj = EVintjj.E;
    var Vintjj = EVintjj.V;
    
    // Characters
    var Ksou = [];
    for (var p=0; p<soutList.length; p++) {
        var jList = soutList[p].jList;
        var J = soutList[p].J;
        var N = soutList[p].N;
        Ksou[p] = [];
        for (var sn=0; sn<N; sn++) {
            Ksou[p][sn] = new Float64Array(dim);
            for (var i=0; i<dim; i++) {
                var ichar = 0;
                for (var MJ=J; MJ>=-J; MJ--) {
                    ichar += Math.pow(Vec.dot(Vintjj[i], vsouEigList[jList][J][MJ][sn]), 2);
                }
                Ksou[p][sn][i] = ichar;
            }
        }
    }
    
    var Kso = [];
    for (var p=0; p<sotList.length; p++) {
        Kso[p] = new Float64Array(dim);
        for (var i=0; i<dim; i++) {
            var ichar = 0;
            for (var j=0; j<vsoList[p].length; j++) {
                ichar += Math.pow(Vec.dot(Vintjj[i], vsoList[p][j]), 2);
            }
            Kso[p][i] = ichar;
        }
    }
    
    // J quantum numbers
    var Jintjj = [];
    for (var p=0; p<soutList.length; p++) {
        var J = soutList[p].J;
        var N = soutList[p].N;
        for (var sn=0; sn<N; sn++) {
            var v = Ksou[p][sn];
            for (var i=0; i<dim; i++) {
                if (v[i]>=1.0/dim) {
                    Jintjj[i] = J;
                }
            }
        }
    }
    
    // Shift Eso by Eavg
    for (var p=0; p<soutList.length; p++) {
        Eso[p] += Eavg;
    }
    
    var energy = {};
    energy.euList = euList;
    energy.Eavg = Eavg;
    energy.Eu   = Eu;
    energy.Euso = Euso;
    energy.Eint = Eint;
    energy.Ku   = Ku;
    energy.Kuso = Kuso;
    energy.Jint = Jint;
    
    energy.Eso    = Eso;
    energy.Esou   = Esou;
    energy.Eintjj = Eintjj;
    energy.Kso    = Kso;
    energy.Ksou   = Ksou;
    energy.Jintjj = Jintjj;
    
    energy.Hu   = Hu;
    energy.Hint = Hint;
    
    return energy;
    
    // jj-basis vector to ls-basis vector
    function jj2ls(iconf, CG) {
        // Express each d in terms of c
        var dList = [];
        for (var i=0; i<Nsite; i++) {
            if (myBasisJJ.isBit(i, iconf)) {
                var d  = [];
                var j  = myBasisJJ.j[i];
                var mj = myBasisJJ.mj[i];
                var n  = (j==l+0.5 ? 0 : 2*(l+0.5)+1) + (j-mj);
                var v  = CG[n];
                for (var ii=0; ii<v.length; ii++) {
                    var coeff = v[ii];
                    if (Math.abs(coeff)>1e-8) {
                        var ml = l - Math.floor(ii/2);
                        var ms = 0.5 - ii%2;
                        var conf = myBasis.setBit((ms==0.5?0:2*l+1)+l-ml, 0);
                        d.push({CG:coeff, conf:conf});
                    }
                }
                dList.push(d);
            }
        }
        
        // Expand prod of d
        var expand = dList.length>0 ? dList[0] : [];
        for (var n=1; n<Ne; n++) {
            var d = dList[n];
            var expdn = [];
            for (var i=0; i<expand.length; i++) {
                var iCG = expand[i].CG;
                var iconf = expand[i].conf;
                for (var j=0; j<d.length; j++) {
                    var jCG = d[j].CG;
                    var jconf = d[j].conf;
                    if (!(iconf&jconf)) {
                        var mask = 0;
                        for (var site=0; site<Nsite; site++) {
                            if (myBasis.isBit(site, jconf)) {
                                mask = ~(0xFFFFFFFF<<(Nsite-site-1));
                                break;
                            }
                        }
                        var fsign = (1-2*(myBasis.countBit(iconf&mask)&01));
                        var kCG   = fsign*iCG*jCG;
                        var kconf = iconf|jconf;
                        expdn.push({CG:kCG, conf:kconf});
                    }
                }
            }
            expand = expdn;
        }
        
        return expand;
    }
};
