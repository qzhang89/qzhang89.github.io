/*
 * SCFSolver.js
 * Solve for eigen-states by self-consistent field approximation
 * Need to include Orbit.js
 */

// Create an instance of SCFSolver
function SCFSolver(Z, rMin, rMax, dx, cfgString, xcMethod) {
    // Parse configuration string
    try {
        this.parseCfg(cfgString);
    } catch (err) {
        throw err;
    }
    
    // Setup numerical grid
    var xMin = Math.log(Z*rMin);
    var xMax = Math.log(Z*rMax);
    // Require n odd
    var N = Math.floor((xMax-xMin)/dx + 1); N = N%2==1 ? N : N+1;
    // Setup x
    var x = new Float64Array(N);
    for (var i=0; i<N; i++) {
        x[i] = xMin + dx*i;
    }
    // Setup r
    var r = new Float64Array(N);
    for (var i=0; i<N; i++) {
        r[i] = Math.exp(x[i])/Z;
    }
    // Save r.^2 to save computation
    var r2 = new Float64Array(N);
    for (var i=0; i<N; i++) {
        r2[i] = r[i]*r[i];
    }
    // Save r.^3 to save computation
    var r3 = new Float64Array(N);
    for (var i=0; i<N; i++) {
        r3[i] = r2[i]*r[i];
    }
    // Setup V
    var V = new Float64Array(N);
    for (var i=0; i<N; i++) {
        V[i] = -Z/r[i];
    }
    // Save w to save computation (Simpson)
    var w = new Float64Array(N);
    w[0] = dx/3;
    for (var i=1; i<N-1; i+=2) {
        w[i] = dx*4/3;
    }
    for (var i=2; i<N-2; i+=2) {
        w[i] = dx*2/3;
    }
    w[N-1] = dx/3;
    
    var G = {}; // Grid object
    G.Z  = Z;
    G.x  = x;
    G.r  = r;
    G.r2 = r2;
    G.r3 = r3;
    G.dx = dx;
    G.N  = N;
    G.V  = V;
    G.w  = w;
    G.kk = new Float64Array(N); // pre-allocating memory space for kk
    
    this.G = G
    this.orbList = [];
    this.EinitList = [];
    this.xcMethod = xcMethod;
    this.rho  = new Float64Array(this.G.N);
    this.Q    = new Float64Array(this.G.N);
    this.Zeff = new Float64Array(this.G.N);
    this.Vext = new Float64Array(V);
    this.VH   = new Float64Array(this.G.N);
    this.Vxc  = new Float64Array(this.G.N);
    this.exc  = new Float64Array(this.G.N);
    this.VH0  = new Float64Array(this.G.N);
    this.Vxc0 = new Float64Array(this.G.N);
    this.Etot = 0;
    this.Ekin = 0;
    this.Eee  = 0;
    this.Een  = 0;
    this.Exc  = 0;
    this.iter = 0;
    this.cnvg = Infinity;
    this.mix  = 0.5;
};

// Full SCF step
SCFSolver.prototype.full = function(eps) {
    var scfSolver = this;
    if (typeof eps === "undefined") {
        eps = 1e-6;
    }
    if (this.cnvg <= eps) {
        return 0;
    }
    repeatStep();
    
    function repeatStep() {
        if (scfSolver.cnvg <= eps) {
            return 0;
        } else {
            scfSolver.step(null, repeatStep);
        }
    }
};

// One SCF step
SCFSolver.prototype.step = function(prgsBar, callback) {
    var scfSolver = this;
    
    var orbList = this.orbList;
    var EinitList = this.EinitList;
    var G  = this.G;
    var Z  = this.G.Z;
    var r  = this.G.r;
    var r3 = this.G.r3;
    var w  = this.G.w;
    var dx = this.G.dx;
    var N  = this.G.N;
    var V  = this.G.V;
    var cfgList  = this.cfgList;
    var xcMethod = this.xcMethod;
    var Ne   = this.Ne;
    var rho  = this.rho;
    var Q    = this.Q;
    var Zeff = this.Zeff;
    var Vext = this.Vext;
    var VH   = this.VH;
    var Vxc  = this.Vxc;
    var exc  = this.exc;
    var VH0  = this.VH0;
    var Vxc0 = this.Vxc0;
    
    var fourPI = 4*Math.PI;
    
    // Shoot eigen-states for occupied orbitals
    var item = 0;
    orbList.length = 0;
    function shootCfgItem() {
        // Update progress bar
        if (!!prgsBar) {
            prgsBar.value = (item+1) / cfgList.length;
        }
        
        if (item<cfgList.length) {
            var n   = cfgList[item].n;
            var l   = cfgList[item].l;
            var occ = cfgList[item].occ;
            var Einit = -(Z*Z)/(2*n*n);
            if (item<EinitList.length) {
                Einit = EinitList[item];
            }
            // Generate occupied orbitals
            var orb = new Orbit(G, n, l, occ, Einit);
            if (!!orb) {
                orbList.push(orb);
            }
            // Update Einit
            if (item<EinitList.length) {
                EinitList[item] = orb.E;
            } else {
                EinitList.push(orb.E);
            }
            item++;
            setTimeout(function() {shootCfgItem();}, 0);
        } else {
            // Compute rho from orbList
            for (var i=0; i<N; i++) {
                rho[i] = 0;
            }
            for (var i=0; i<orbList.length; i++) {
                var R = orbList[i].R;
                var occ = orbList[i].occ;
                for (var j=0; j<N; j++) {
                    rho[j] += occ*R[j]*R[j]/fourPI;
                }
            }
            
            // Charge
            Q[0] = 0;
            Q[1] = fourPI*0.5*dx*(rho[0]*r3[0]+rho[1]*r3[1]);
            for (var i=2; i<N; i++) {
                Q[i] = Q[i-2] + fourPI*dx/3*(rho[i-2]*r3[i-2]+4*rho[i-1]*r3[i-1]+rho[i]*r3[i]);
            }
            
            // Compute Zeff from Q
            for (var i=0; i<N-1; i++) {
                Zeff[i] = Z - Q[i];
            }
            
            // Hartree potential
            VH[N-1] = Ne/r[N-1];
            VH[N-2] = VH[N-1] + 0.5*dx*(Q[N-2]/r[N-2]+Q[N-1]/r[N-1]);
            for (var i=N-3; i>=0; i--) {
                VH[i] = VH[i+2] + dx/3*(Q[i]/r[i]+4*Q[i+1]/r[i+1]+Q[i+2]/r[i+2]);
            }
            
            // Exchange-correlation potential
            switch (xcMethod) {
            case 0:
                for (var i=0; i<N; i++) {
                    Vxc[i] = 0;
                    exc[i] = 0;
                }
                break;
            case 1:
                VxcKSG(Vxc, exc, rho);
                break;
            case 2:
                VxcHL(Vxc, exc, rho);
                break;
            case 3:
                VxcGLW(Vxc, exc, rho);
                break;
            case 4:
                VxcVBH(Vxc, exc, rho);
                break;
            case 5:
                VxcCAPZ(Vxc, exc, rho);
                break;
            case 6:
                VxcCAVWN(Vxc, exc, rho);
                break;
            default:
                VxcCAVWN(Vxc, exc, rho);
                break;
            }
            
            // Total energy
            var Een  = 0;
            var Eee2 = 0;
            var Evxc = 0;
            var Eee  = 0;
            var Exc  = 0;
            for (var i=0; i<N; i++) {
                Een  += fourPI*w[i]*rho[i]*Vext[i]*r3[i];
                Eee2 += fourPI*w[i]*rho[i]*VH0[i]*r3[i];
                Evxc += fourPI*w[i]*rho[i]*Vxc0[i]*r3[i];
                Eee  += fourPI*0.5*w[i]*rho[i]*VH[i]*r3[i];
                Exc  += fourPI*w[i]*rho[i]*exc[i]*r3[i];
            }
            var Eeig = 0;
            for (var i=0; i<orbList.length; i++) {
                Eeig += orbList[i].occ*orbList[i].E;
            }
            var Ekin = Eeig - Een - Eee2 - Evxc;
            var Etot = Eeig - Eee2 - Evxc + Eee + Exc;
            
            // Convergency
            var cnvg = Math.abs(Etot-scfSolver.Etot);
            
            // Reduce mixing if cnvg increases
            var mix = scfSolver.mix;
            if (cnvg >= scfSolver.cnvg) {
                if (mix >= 0.4) {
                    mix -= 0.1;
                }
            }
            
            // Update V by mixing
            for (var i=0; i<N; i++) {
                V[i] = (1-mix)*V[i] + mix*(Vext[i]+VH[i]+Vxc[i]);
            }
            
            // Update solutions
            scfSolver.Etot = Etot;
            scfSolver.Ekin = Ekin;
            scfSolver.Eee  = Eee;
            scfSolver.Een  = Een;
            scfSolver.Exc  = Exc;
            scfSolver.iter += 1;
            scfSolver.cnvg = cnvg;
            scfSolver.mix  = mix;
            
            // Store old values
            for (var i=0; i<N; i++) {
                VH0[i]  = VH[i];
                Vxc0[i] = Vxc[i];
            }
            
            if (!!callback) {
                callback();
            }
        }
    }
    setTimeout(function() {shootCfgItem();}, 0);
    
    // Exchange-correlation potential correction
    function VxcKSG(Vxc, exc, rho) {
        var n = rho.length;
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        
        for (var i=0; i<N; i++) {
            var rs = Math.pow(3/(fourPI*rho[i]), 1/3);
            Vxc[i] = -1/(Math.PI*alpha*rs);
            exc[i] = -0.75/(Math.PI*alpha*rs);
        }
    }
    
    function VxcHL(Vxc, exc, rho) {
        var n = rho.length;
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 21.0;
        var Cp    = 0.0225;
        
        for (var i=0; i<N; i++) {
            var rs = Math.pow(3/(fourPI*rho[i]), 1/3);
            var xp = rs/Ap;
            Vxc[i] = -1/(Math.PI*alpha*rs) - Cp*Math.log(1+Ap/rs);
            exc[i] = -0.75/(Math.PI*alpha*rs) - Cp*((1+xp*xp*xp)*Math.log(1+1/xp)+0.5*xp-xp*xp-1/3);
        }
    }
    
    function VxcGLW(Vxc, exc, rho) {
        var n = rho.length;
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 11.4;
        var Cp    = 0.0333;
        
        for (var i=0; i<N; i++) {
            var rs = Math.pow(3/(fourPI*rho[i]), 1/3);
            var xp = rs/Ap;
            Vxc[i] = -1/(Math.PI*alpha*rs) - Cp*Math.log(1+Ap/rs);
            exc[i] = -0.75/(Math.PI*alpha*rs) - Cp*((1+xp*xp*xp)*Math.log(1+1/xp)+0.5*xp-xp*xp-1/3);
        }
    }
    
    function VxcVBH(Vxc, exc, rho) {
        var n = rho.length;
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 30.0;
        var Cp    = 0.0252;
        
        for (var i=0; i<N; i++) {
            var rs = Math.pow(3/(fourPI*rho[i]), 1/3);
            var xp = rs/Ap;
            Vxc[i] = -1/(Math.PI*alpha*rs) - Cp*Math.log(1+Ap/rs);
            exc[i] = -0.75/(Math.PI*alpha*rs) - Cp*((1+xp*xp*xp)*Math.log(1+1/xp)+0.5*xp-xp*xp-1/3);
        }
    }
    
    function VxcCAPZ(Vxc, exc, rho) {
        var n = rho.length;
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var gamma = -0.07115;
        var beta1 = 1.0529;
        var beta2 = 0.3334;
        var A     = 0.01555;
        var B     = -0.024;
        var C     = 0.0010;
        var D     = -0.0058;
        
        for (var i=0; i<N; i++) {
            var rs = Math.pow(3/(fourPI*rho[i]), 1/3);
            var rsSqrt = Math.sqrt(rs);
            var rsLn   = Math.log(rs);
            if (!isFinite(rs)) {
                Vxc[i] = 0;
                exc[i] = 0;
            } else if (rs >= 1) {
                Vxc[i] = -1/(Math.PI*alpha*rs) + gamma*(1+7/6*beta1*rsSqrt+4/3*beta2*rs)/(1+beta1*rsSqrt+beta2*rs);
                exc[i] = -0.75/(Math.PI*alpha*rs) + gamma/(1+beta1*rsSqrt+beta2*rs);
            } else {
                Vxc[i] = -1/(Math.PI*alpha*rs) + (A*rsLn+(B-A/3)+2/3*C*rs*rsLn+(2*D-C)/3*rs);
                exc[i] = -0.75/(Math.PI*alpha*rs) + (A*rsLn+B+C*rs*rsLn+D*rs);
            }
        }
    }
    
    function VxcCAVWN(Vxc, exc, rho) {
        var n = rho.length;
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var A     = 0.0310907;
        var b     = 3.72744;
        var c     = 12.9352;
        var x0    = -0.10498;
        var b1    = 9.81379;
        var b2    = 2.82224;
        var b3    = 0.736412;
        var Q     = Math.sqrt(4*c-b*b);
        
        for (var i=0; i<N; i++) {
            var rs = Math.pow(3/(fourPI*rho[i]), 1/3);
            var rsSqrt = Math.sqrt(rs);
            var Xr = rs + b*rsSqrt + c;
            if (!isFinite(rs)) {
                Vxc[i] = 0;
                exc[i] = 0;
            } else {
                var eps = A*(Math.log(rs/Xr) + 2*b/Q*Math.atan(Q/(2*rsSqrt+b)) - b*x0/(x0*x0+b*x0+c)*(Math.log((rsSqrt-x0)*(rsSqrt-x0)/Xr)+2*(b+2*x0)/Q*Math.atan(Q/(2*rsSqrt+b))));
                Vxc[i] = -1/(Math.PI*alpha*rs) + (eps - A/3 * (1+b1*rsSqrt)/(1+b1*rsSqrt+b2*rs+b3*Math.sqrt(rs*rs*rs)));
                exc[i] = -0.75/(Math.PI*alpha*rs) + eps;
            }
        }
    }
};

// Parse configuration string
SCFSolver.prototype.parseCfg = function(cfgString) {
    // Parse configuration string
    var closeReg = /\[[A-z]+\]/;
    var openReg  = /\d[spdfgh]\d+/g;
    var closeStr = cfgString.match(closeReg);
    var openStr  = cfgString.match(openReg);
    var cfgStrList = [];
    if (closeStr != null) {
        if (closeStr == "[He]") {
            cfgStrList = ["1s2"];
        } else if (closeStr == "[Ne]") {
            cfgStrList = ["1s2", "2s2", "2p6"];
        } else if (closeStr == "[Ar]") {
            cfgStrList = ["1s2", "2s2", "2p6", "3s2", "3p6"];
        } else if (closeStr == "[Kr]") {
            cfgStrList = ["1s2", "2s2", "2p6", "3s2", "3p6", "4s2", "3d10", "4p6"];
        } else if (closeStr == "[Xe]") {
            cfgStrList = ["1s2", "2s2", "2p6", "3s2", "3p6", "4s2", "3d10", "4p6", "5s2", "4d10", "5p6"];
        } else if (closeStr == "[Rn]") {
            cfgStrList = ["1s2", "2s2", "2p6", "3s2", "3p6", "4s2", "3d10", "4p6", "5s2", "4d10", "5p6", "6s2", "4f14", "5d10", "6p6"];
        } else if (closeStr == "[Og]") {
            cfgStrList = ["1s2", "2s2", "2p6", "3s2", "3p6", "4s2", "3d10", "4p6", "5s2", "4d10", "5p6", "6s2", "4f14", "5d10", "6p6", "7s2", "5f14", "6d10", "7p6"];
        } else {
            throw closeStr+" is not a close shell element!";
        }
    }
    if (openStr != null) {
        cfgStrList = cfgStrList.concat(openStr);
    }
    if (cfgStrList.length == 0) {
        throw "Illegal input!\nInput should have an electron configuration format.\ne.g. [He] 2s2 2p2";
    }
    var cfgList = [];
    for (var i=0; i<cfgStrList.length; i++) {
        cfgList[i] = parseCfg(cfgStrList[i]);
    }
    
    // Count number of electrons
    var Ne = 0;
    for (var i=0; i<cfgList.length; i++) {
        Ne += cfgList[i].occ;
    }
    
    this.cfgList = cfgList;
    this.Ne = Ne;
    
    // Parse electron configuration string
    function parseCfg(cfg) {
        // Regular expression for understanding cfg format
        var dReg    = /\d+/g;
        var lReg    = /[spdfgh]/;
        
        var nStr    = cfg.match(dReg)[0];
        var lStr    = cfg.match(lReg);
        var occStr = cfg.match(dReg)[1];
        
        var n = parseFloat(nStr);
        var l;
        switch (lStr.toString()) {
        case "s":
            l = 0;
            break;
        case "p":
            l = 1;
            break;
        case "d":
            l = 2;
            break;
        case "f":
            l = 3;
            break;
        case "g":
            l = 4;
            break;
        case "h":
            l = 5;
            break;
        default:
            l = 0;
        }
        var occ = parseFloat(occStr);
        
        return {n:n, l:l, occ:occ};
    }
};

// Slater-Condon paramter
SCFSolver.prototype.Slater = function(k, u1, u2, u3, u4) {
    var r = this.G.r;
    var w = this.G.w;
    var N = this.G.N;
    var dx = this.G.dx;
    
    var fl = new Float64Array(N);
    var fr = new Float64Array(N);
    fl[0] = 0;
    fl[1] = 0.5*dx*(u2[0]*u3[0]*Math.pow(r[0], k+1)+u2[1]*u3[1]*Math.pow(r[1], k+1));
    for (var i=2; i<N; i++) {
        fl[i] = fl[i-2] + dx/3*(u2[i-2]*u3[i-2]*Math.pow(r[i-2], k+1)+4*u2[i-1]*u3[i-1]*Math.pow(r[i-1], k+1)+u2[i]*u3[i]*Math.pow(r[i], k+1));
    }
    fr[N-1] = 0;
    fr[N-2] = 0.5*dx*(u2[N-2]*u3[N-2]/Math.pow(r[N-2], k)+u2[N-1]*u3[N-1]/Math.pow(r[N-1], k));
    for (var i=N-3; i>=0; i--) {
        fr[i]   = fr[i+2] + dx/3*(u2[i]*u3[i]/Math.pow(r[i], k)+4*u2[i+1]*u3[i+1]/Math.pow(r[i+1], k)+u2[i+2]*u3[i+2]/Math.pow(r[i+2], k));
    }
    for (var i=0; i<N; i++) {
        fl[i] /= Math.pow(r[i], k);
        fr[i] *= Math.pow(r[i], k+1);
    }
    Fk = 0;
    for (var i=0; i<N; i++) {
        Fk += w[i]*u1[i]*u4[i]*(fl[i]+fr[i]);
    }
    return Fk;
};

// <nl|Xi|nl>
SCFSolver.prototype.SO = function(u) {
    var r = this.G.r;
    var V = this.G.V;
    var w = this.G.w;
    var N = this.G.N;
    var dx = this.G.dx;
    
    // dV/dx
    var dvdx = new Float64Array(N);
    dvdx[0] = (V[1]-V[0])/dx; // Forward difference
    for (var i=1; i<N-1; i++) {
        dvdx[i] = (V[i+1]-V[i-1])/dx*0.5; // Central difference
    }
    dvdx[N-1] = (V[N-1]-V[N-2])/dx; // Backward difference
    
    var Xi = 0;
    for (var i=0; i<N; i++) {
        Xi += w[i]*dvdx[i]/r[i]*u[i]*u[i];
    }
    Xi /= 2*137.036*137.036;
    
    return Xi;
};

//<nl|r^k|nl>
SCFSolver.prototype.rk = function(k, u) {
    var r = this.G.r;
    var w = this.G.w;
    var N = this.G.N;
    
    var rk = 0;
    for (var i=0; i<N; i++) {
        rk += w[i]*Math.pow(r[i], k+1)*u[i]*u[i];
    }
    
    return rk;
};

// Compute Slater integral (Crystal Field) qavg <n1l1| r^k / Ravg^{k+1} |n2l2>
SCFSolver.prototype.Ik = function(qavg, Ravg, k, u1, u2) {
    var r = this.G.r;
    var w = this.G.w;
    var N = this.G.N;
    
    var I = 0;
    for (var i=0; i<N; i++) {
        I += w[i]*Math.pow(r[i],k+1)*u1[i]*u2[i]; // k``+1'' comes from dr = rdx
    }
    I *= qavg/Math.pow(Ravg,k+1);
    
    return I;
};

// Exports to node.js if possible
if (typeof exports != "undefined") {
    exports.SCFSolver = SCFSolver;
}
