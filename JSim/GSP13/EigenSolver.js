/*
 * EigenSolver.js
 * Eigen-state solver for radial wave function
 */

var EigenSolver = new Object();

// Setup 1D grid
EigenSolver.setupGrid = function(xMin, xMax, dx) {
    var n = Math.round((xMax-xMin)/dx + 1);
    var x = new Float64Array(n);
    for (var i=0; i<n; i++) {
        x[i] = xMin + dx*i;
    }
    return x;
};

// x grid (log) to r grid (radial)
EigenSolver.x2r = function(x, Z) {
    var r = new Float64Array(x.length);
    for (var i=0; i<x.length; i++) {
        r[i] = Math.exp(x[i])/Z;
    }
    return r;
};

// Setup Coulomb potential
EigenSolver.setupPotential = function(r, Z) {
    var n = r.length;
    var V = new Float64Array(n);
    for (var i=0; i<n; i++) {
        V[i] = -Z/r[i];
    }
    return V;
};

// Forward + Backward integration for u_tilde and rescale to u = sqrt(r) u_tilde
EigenSolver.shoot = function(x, r, V, l, E) {
    var n  = x.length;
    var dx = x[1] - x[0];
    
    var u = new Float64Array(n);
    
    // Matching point
    var M = Math.round(0.5*n);
    for (var i=0; i<n; i++) {
        if (E < V[i]) {
            M = i;
            break;
        }
    }
    
    // Numerov's method
    var kk = new Float64Array(n);
    for(var i=0; i<n; i++) {
        kk[i] = r[i]*r[i]*E - r[i]*r[i]*V[i] - 0.5*(l+0.5)*(l+0.5);
    }
    
    // Forward initial condition
    u[0] = Math.pow(r[0], l+1) / Math.sqrt(r[0]);
    u[1] = Math.pow(r[1], l+1) / Math.sqrt(r[1]);
    
    // Forward integration
    for (var i=2; i<=M; i++) {
        u[i] = ((2-5/3*dx*dx*kk[i-1])*u[i-1] - (1+1/6*dx*dx*kk[i-2])*u[i-2]) / (1+1/6*dx*dx*kk[i]);
        if (isNaN(u[i]) || !isFinite(u[i])) { // in case diverges out of machine limit
            u[i] = u[i-1];
            console.log("EigenSolver: Forward integration overflow.");
        }
    }
    var uMatchL = u[M];
    
    // Backward initial condition
    var A = uMatchL/Math.abs(uMatchL);
    var beta = E<0 ? Math.sqrt(-2*E) : 0;
    var start = n-1;
    for (var i=n-1; i>M; i--) {
        u[i] = A*Math.exp(-beta*r[i])/Math.sqrt(r[i]);
        if (Math.abs(u[i]) > 0) {
            u[i-1] = A*Math.exp(-beta*r[i-1])/Math.sqrt(r[i-1]);
            start = i;
            break;
        }
    }
    
    // Backward integration
    for (var i=start-2; i>=M; i--) {
        u[i] = ((2-5/3*dx*dx*kk[i+1])*u[i+1] - (1+1/6*dx*dx*kk[i+2])*u[i+2]) / (1+1/6*dx*dx*kk[i]);
        if (isNaN(u[i]) || !isFinite(u[i])) { // in case diverges out of machine limit
            u[i] = u[i+1];
            console.log("EigenSolver: Backward integration overflow.");
        }
    }
    var uMatchR = u[M];
    
    // Connect left and right parts
    var A = uMatchL / uMatchR;
    for (var i=M; i<n; i++) {
        u[i] *= A;
    }
    
    // Matching quality
    var match = (u[M+1]-2*u[M]+u[M-1])/dx + (kk[M]*u[M]-kk[M-1]*u[M-1])*dx;
    
    // Rescale u_tilde to u
    for (var i=0; i<n; i++) {
        u[i] = u[i]*Math.sqrt(r[i]);
        if (isNaN(u[i]) || !isFinite(u[i])) { //in case diverges out of machine limit
            u[i] = u[i-1];
        }
    }
    
    // Normalization
    var sum = 0;
    for(var i=0; i<n-1; i++) {
        sum += 0.5*(u[i+1]*u[i+1]+u[i]*u[i])*(r[i+1]-r[i]);
    }
    var norm = 1/Math.sqrt(sum);
    for(var i=0; i<n; i++) {
        u[i] *= norm;
    }
    
    // Rescale u to R = u/r
    var R = new Float64Array(n);
    for (var i=0; i<n; i++) {
        R[i] = u[i] / r[i];
    }
    
    // Count number of nodes
    var node = 0;
    var preValue = 0;
    var curValue = 0;
    for (var i=0; i<n; i++) {
        curValue = R[i];
        if (preValue*curValue < 0) { // node detected
            node++;
        }
        preValue = curValue;
    }
    
    // Package results
    var eigen = {};
    eigen.r = r;
    eigen.u = u;
    eigen.R = R;
    eigen.E = E;
    eigen.node = node;
    eigen.n = node+l+1;
    eigen.l = l;
    eigen.match = match;
    return eigen;
};

// Bisection method
EigenSolver.bisect = function(x, r, V, l, ELow, EUp) {
    var eigen;
    var lowM = 0;
    var upM  = 0;
    var curM = 0;
    
    var eps = 1e-8;
    
    // Determine the initial matching of ELow
    eigen = EigenSolver.shoot(x, r, V, l, ELow);
    lowM = eigen.match;
    if (Math.abs(lowM) < eps) {
        return eigen;
    }
    
    // Determine the initial matching of EUp
    eigen = EigenSolver.shoot(x, r, V, l, EUp);
    upM = eigen.match;
    if (Math.abs(upM) < eps) {
        return eigen;
    }
    
    if (lowM*upM > 0) {
        console.log("EigenSolver: 1. Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
        return -1;
    }
    
    var E = (ELow+EUp)/2;
    var itMax = 100;
    for (var it=1; it<=itMax; it++) {
        E = (ELow+EUp)/2;
        
        //Determine the matching of current energy
        eigen = EigenSolver.shoot(x, r, V, l, E);
        curM = eigen.match;
        
        //Check matching
        if (Math.abs(curM) < eps) {
            return eigen;
        } else {
            if (lowM*upM > 0) {
                console.log("EigenSolver: 2. Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
                return -1;
            } else if (curM*lowM > 0) {
                ELow = E;
                lowM = curM;
            } else if (curM*upM > 0) {
                EUp = E;
                upM = curM;
            } else {
                console.log("EigenSolver: 3. Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
                return -1;
            }
        }
    }
    // Cannot converge due to machine accuracy
    return eigen;
};

// Recursively divide energy to find state with n and l in between ELow and EUp
EigenSolver.solveNL = function(x, r, V, n, l, ELowLow, ELowUp, EUpLow, EUpUp, checkFlag) {
    var eigen;
    var lowNode, upNode;
    var lowM, upM;
    
    var eps = 1e-8;
    
    if (checkFlag == 1) {
        // Check lower and upper bound
        eigen = EigenSolver.shoot(x, r, V, l, ELowLow);
        lowNode = eigen.node;
        lowM = eigen.match;
        eigen = EigenSolver.shoot(x, r, V, l, EUpUp);
        upNode = eigen.node;
        upM = eigen.match;
        if (lowNode>n-l-1 || upNode<n-l-1) {
            console.log("EigenSolver: 1. Eigen-energy with n = " + n + " and l = " + l + " not found between ELow = " + ELowLow + " and EUp = " + EUpUp + "!");
            return -1;
        } else if (lowNode==n-l-1 && lowM*Math.pow(-1,n-l-1)>0) {
            console.log("EigenSolver: 2. Eigen-energy with n = " + n + " and l = " + l + " not found between ELow = " + ELowLow + " and EUp = " + EUpUp + "!");
            return -1;
        } else if (upNode==n-l-1 && upM*Math.pow(-1,n-l-1)<0) {
            console.log("EigenSolver: 3. Eigen-energy with n = " + n + " and l = " + l + " not found between ELow = " + ELowLow + " and EUp = " + EUpUp + "!");
            return -1;
        }
    }
    
    var ELowCur = (ELowLow + ELowUp)/2;
    var EUpCur  = (EUpLow + EUpUp)/2;
    
    // Test nodes and match
    eigen = EigenSolver.shoot(x, r, V, l, ELowCur);
    lowNode = eigen.node;
    lowM = eigen.match;
    eigen = EigenSolver.shoot(x, r, V, l, EUpCur);
    upNode = eigen.node;
    upM = eigen.match;
    
    var lowPass = false;
    if (lowNode==n-l-1) {
        if (lowM*Math.pow(-1,n-l-1)<=0) {
            ELowLow = ELowCur;
            ELowUp = ELowCur;
            lowPass = true;
        } else {
            ELowUp = ELowCur;
        }
    } else if (lowNode==n-l-2) {
        if (lowM*Math.pow(-1,n-l-1)<-eps) {
            ELowLow = ELowCur;
            ELowUp = ELowCur;
            lowPass = true;
        } else {
            ELowLow = ELowCur;
        }
    } else if (lowNode<n-l-2) {
        ELowLow = ELowCur;
    } else if (lowNode>n-l-1) {
        ELowUp = ELowCur;
    }
    
    var upPass = false;
    if (upNode==n-l-1) {
        if (upM*Math.pow(-1,n-l-1)>=0) {
            EUpLow = EUpCur;
            EUpUp = EUpCur;
            upPass = true;
        } else {
            EUpLow = EUpCur;
        }
    } else if (upNode==n-l) {
        if (upM*Math.pow(-1,n-l-1)>eps) {
            EUpLow = EUpCur;
            EUpUp = EUpCur;
            upPass = true;
        } else {
            EUpUp = EUpCur;
        }
    } else if(upNode<n-l-1) {
        EUpLow = EUpCur;
    } else if(upNode>n-l) {
        EUpUp = EUpCur;
    }
    
    if(lowPass && upPass) { // base case, return this eigen state
        return EigenSolver.bisect(x, r, V, l, ELowCur, EUpCur);
    } else {
        return EigenSolver.solveNL(x, r, V, n, l, ELowLow, ELowUp, EUpLow, EUpUp, 0);
    }
};
