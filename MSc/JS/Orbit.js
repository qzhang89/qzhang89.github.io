/*
 * Orbit.js
 * Eigen-state solver for radial wave function
 */

// Create an instance of Orbit
function Orbit(G, n, l, occ, Einit, isSolved) {
    if (typeof isSolved === "undefined") {
        isSolved = true;
    }
    this.G    = G;
    this.n    = n;
    this.l    = l;
    this.occ  = occ;
    this.R    = new Float64Array(G.N);
    this.u    = new Float64Array(G.N);
    this.E    = 0;
    this.node = 0;
    this.M    = 0;
    this.dE   = 0;
    if (isSolved) {
        this.solve(Einit);
    }
}

// Forward + Backward integration for u_tilde
Orbit.prototype.shoot = function(E) {
    var u  = this.u;
    var l  = this.l;
    var r  = this.G.r;
    var r2 = this.G.r2;
    var V  = this.G.V;
    var w  = this.G.w;
    var kk = this.G.kk;
    var N  = this.G.N;
    var dx = this.G.dx;
    var dx2   = dx*dx;
    var dx253 = dx2*5/3;
    var dx26  = dx2/6;
    
    // Matching point
    var M = Math.round(N/2);
    for (var i=0; i<N; i++) {
        if (E < V[i]) {
            M = i;
            break;
        }
    }
    
    // Numerov's method
    var ll = 0.5*(l+0.5)*(l+0.5);
    for (var i=0; i<N; i++) {
        kk[i] = r2[i]*(E - V[i]) - ll;
    }
    
    // Forward initial condition
    u[0] = Math.pow(r[0], l+1) / Math.sqrt(r[0]);
    u[1] = Math.pow(r[1], l+1) / Math.sqrt(r[1]);
    
    // Backward initial condition
    var end = N-1;
    if (E < V[N-1]) {
        var beta = Math.sqrt(Math.abs(-2*E));
        for (var i=N-1; i>M; i--) {
            u[i] = Math.exp(-beta*r[i])/Math.sqrt(r[i]);
            if (Math.abs(u[i]) > 0) {
                u[i-1] = Math.exp(-beta*r[i-1])/Math.sqrt(r[i-1]);
                end = i;
                break;
            }
        }
    } else { // E too high, then particle in a box
        u[N-1] = 0;
        u[N-2] = 1e-6;
    }
    
    // Forward integration
    for (var i=2; i<=M; i++) {
        u[i] = ((2-dx253*kk[i-1])*u[i-1] - (1+dx26*kk[i-2])*u[i-2]) / (1+dx26*kk[i]);
        /*
        if (isNaN(u[i]) || !isFinite(u[i])) { // in case diverges out of machine limit
            u[i] = u[i-1];
            console.log("EigenSolver: Forward integration overflow.");
        }
        */
    }
    var FM = u[M];
    
    // Backward integration
    for (var i=end-2; i>=M; i--) {
        u[i] = ((2-dx253*kk[i+1])*u[i+1] - (1+dx26*kk[i+2])*u[i+2]) / (1+dx26*kk[i]);
        /*
        if (isNaN(u[i]) || !isFinite(u[i])) { // in case diverges out of machine limit
            u[i] = u[i+1];
            console.log("EigenSolver: Backward integration overflow.");
        }
        */
    }
    var BM = u[M];
    
    // Connect left and right parts
    var A = FM / BM;
    for (var i=M; i<N; i++) {
        u[i] *= A;
    }
    
    // Normalization (notice: dr=rdx and u_tilde)
    var area = 0;
    for (var i=0; i<N; i++) {
        area += w[i]*r2[i]*u[i]*u[i];
    }
    var norm = 1/Math.sqrt(area);
    for (var i=0; i<N; i++) {
        u[i] *= norm;
    }
    
    // Count number of nodes
    var node = 0;
    for (var i=0; i<N-1; i++) {
        if (u[i]*u[i+1] < 0) { // node detected
            node++;
        }
    }
    
    // Propose a better energy by perturbation
    var kkuM = 3.0/5.0*(2.0/dx2*u[M]-(1.0/dx2+1.0/6.0*kk[M+1])*u[M+1]
               -(1.0/dx2+1.0/6.0*kk[M-1])*u[M-1]);
    var dE   = (kkuM-kk[M]*u[M])*u[M]*dx*0.834; // 0.834 empirical speed up
    
    // Collect results
    this.E    = E;
    this.node = node;
    this.M    = M;
    this.dE   = dE;
};

// Try 10x repeatly from Einit until eigen-energy
Orbit.prototype.tryinit = function(Einit) {
    var r = this.G.r;
    var N = this.G.N;
    var u = this.u;
    var R = this.R;
    
    var eps = 1e-8;
    this.shoot(Einit);
    for (var it=1; it<=10; it++) {
        this.shoot(this.E+this.dE); dE = this.dE; uM = this.u[this.M];
        if (Math.abs(dE)<eps && uM*uM>eps) {
            // Coverged, now rescale u and R
            for (var i=0; i<N; i++) {
                u[i] *= Math.sqrt(r[i]);
                R[i] = u[i] / r[i];
            }
            return true;
        } 
    }
    return false;
}

// Shoot repeatly within (Em, Ep) until eigen-energy
Orbit.prototype.shootbracket = function(Em, Ep) {
    var r = this.G.r;
    var N = this.G.N;
    var u = this.u;
    var R = this.R;
    
    var dEm, dEp, dE, uM;
    var eps = 1e-8;
    
    errmsg = "Orbit: not found in (" + Em + ", " + Ep + ")";
    
    // Determine the boundary dE
    this.shoot(Em); dEm = this.dE;
    this.shoot(Ep); dEp = this.dE;
    if (dEm*dEp > 0) {
        console.log(errmsg);
        return false;
    }
    
    var E;
    var itMax = 100;
    for (var it=1; it<=itMax; it++) {
        E = this.E+this.dE;
        if (E<=Em || E>=Ep) { // prevent going beyond bracket
            E = (Em+Ep)*0.5;
        }
        
        // Determine the dE of current energy
        this.shoot(E); dE = this.dE; uM = this.u[this.M];
        
        // Check dE
        if (Math.abs(dE)<eps && uM*uM>eps) {
            // Coverged, now rescale u and R
            for (var i=0; i<N; i++) {
                u[i] *= Math.sqrt(r[i]);
                R[i] = u[i] / r[i];
            }
            return true;
        } else if (dE*dEm > 0) {
            Em  = E;
            dEm = dE;
        } else if (dE*dEp > 0) {
            Ep  = E;
            dEp = dE;
        }
    }
    // Cannot converge to the tolerance
    console.log(errmsg);
    return false;
};

// Solve the eigen-state
Orbit.prototype.solve = function(Einit) {
    var Z = this.G.Z;
    var n = this.n;
    var l = this.l;
    
    // Try Einit if available
    if (typeof Einit != "undefined") {
        test = this.tryinit(Einit);
        if (test && this.node==n-l-1) {
            return true;
        }
    }
    
    // Big bracket
    var Ep =  0.2*0.5*Z*Z;
    var Em = -1.2*0.5*Z*Z;
    
    var errmsg = "Orbit: n=" + n + " l=" + l + " not found in (" + Em + ", " + Ep + ")";
    
    var ndm, ndp, dEm, dEp, em, ep;
    
    // Check lower and upper bound
    this.shoot(Em); ndm = this.node; dEm = this.dE;
    this.shoot(Ep); ndp = this.node; dEp = this.dE;
    if (ndm>n-l-1 || ndp<n-l-1 || (ndm==n-l-1 && dEm<0) || (ndp==n-l-1 && dEp>0)) {
        console.log(errmsg);
        return false;
    }
    
    var itMax = 100;
    var mPass = false;
    var pPass = false;
    // Find lower bracket
    em = Em;
    ep = Ep;
    for (var i=1; i<=itMax; i++) {
        E = (em + ep)*0.5;
        this.shoot(E); nd = this.node; dE = this.dE;
        if (nd==n-l-1 && dE>0) {
            Em = E;
            mPass = true;
            break;
        } else if (nd>=n-l-1) {
            ep = E;
        } else {
            em = E;
        }
    }
    // Find upper bracket
    em = Em;
    ep = Ep;
    for (var i=1; i<=itMax; i++) {
        E = (em + ep)*0.5;
        this.shoot(E); nd = this.node; dE = this.dE;
        if (nd==n-l-1 && dE<0) {
            Ep = E;
            pPass = true;
            break;
        } else if (nd<=n-l-1) {
            em = E;
        } else {
            ep = E;
        }
    }
    
    if (mPass && pPass) { // Bracket found
        return this.shootbracket(Em, Ep);
    } else {
        console.log(errmsg);
        return false;
    }
};

// Exports to node.js if possible
if (typeof exports != "undefined") {
    exports.Orbit = Orbit;
}
