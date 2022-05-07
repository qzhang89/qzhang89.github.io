/*
 * Gaunt coefficients
 */
var Gaunt = new Object();

// Evaluate Gaunt coefficient <l1m1|kmu|l2m2>
Gaunt.eval = function(l1, l2, k, m1, m2) {
    var mu = m1-m2;
    
    // Trivial cases
    if (l1<Math.abs(m1) || l2<Math.abs(m2) || k<Math.abs(mu)) {
        return 0;
    } else if ((l1+l2+k)%2!=0 || k<Math.abs(l1-l2) || k>l1+l2) {
        return 0;
    }
    
    // Re-arrange such that |m1|>=|m2|>=|mu|
    var tmp, sign = 1;
    if (Math.abs(m1)<Math.abs(m2)) {
        tmp = l1; l1 =  l2; l2 =  tmp;
        tmp = m1; m1 = -m2; m2 = -tmp;
        sign *= Math.pow(-1, mu);
    }
    if (Math.abs(m1)<Math.abs(mu)) {
        tmp = l1; l1 =   k;  k =  tmp;
        tmp = m1; m1 = -mu; mu = -tmp;
        sign *= Math.pow(-1, m2);
    }
    if (Math.abs(m2)<Math.abs(mu)) {
        tmp = l2; l2 =  k;  k = tmp;
        tmp = m2; m2 = mu; mu = tmp;
    }
    
    // Make mu positive
    if (mu<0) {
        m1 *= -1; m2 *= -1; mu *= -1;
    }
    var absm1 = Math.abs(m1);
    var absmu = Math.abs(mu);
    
    // Allocate memory
    var rows = (k+l1-l2)/2+1;
    var cols = (k-l1+l2)/2+1;
    var Gnew = new Float64Array(cols);
    var Gold = new Float64Array(cols);
    
    // Recursion
    for (var j=0; j<cols; j++) {
        var lij = l2-j;
        var kij = j;
        if (lij>=absm1 && kij>=absmu) {
            if (kij==absmu) {
                Gnew[j] = Base(lij, l2, kij, m1, m2);
            } else {
                Gnew[j] = B(lij, kij, m1, mu)*Gnew[j-1];
            }
        }
    }
    for (var i=1; i<rows; i++) {
        for (var j=0; j<cols; j++) {
            Gold[j] = Gnew[j];
        }
        var lij = l2+i;
        var kij = i;
        if (lij>=absm1 && kij>=absmu) {
            if (kij==absmu) {
                Gnew[0] = Base(lij, l2, kij, m1, m2);
            } else {
                Gnew[0] = A(lij, kij, m1, mu)*Gold[0];
            }
        }
        for (var j=1; j<cols; j++) {
            var lij = l2+i-j;
            var kij = i+j;
            if (lij>=absm1 && kij>=absmu) {
                if (kij==absmu) {
                    Gnew[j] = Base(lij, l2, kij, m1, m2);
                } else {
                    Gnew[j] =   A(lij, kij, m1, mu)*Gold[j]
                              + B(lij, kij, m1, mu)*Gnew[j-1]
                              + C(     kij,     mu)*Gold[j-1];
                }
            }
        }
    }
    
    // Final result
    var G = sign*Gnew[cols-1]/(2*Math.sqrt(Math.PI));   
    return G;
    
    // Gaunt coefficient <l1m1|kk|l2m2>*sqrt(4*pi)
    function Base(l1, l2, k, m1, m2) {
        // Trivial cases
        if (l1<Math.abs(m1) || l2<Math.abs(m2) || m1-m2!=k) {
            return 0;
        } else if ((l1+l2+k)%2!=0 || k<Math.abs(l1-l2) || k>l1+l2) {
            return 0;
        }
    
        // Allocate memory
        var rows = (k+l1-l2)/2+1;
        var cols = (k-l1+l2)/2+1;
        var Gnew = new Float64Array(cols);
        var Gold = new Float64Array(cols);
    
        // Recursion
        Gnew[0] = 1.0;
        for (var j=1; j<cols; j++) {
            var lij = l2-j;
            var kij = j;
            var mij = m1-(k-kij);
            Gnew[j] = E(lij, kij, mij)*Gnew[j-1];
        }
        for (var i=1; i<rows; i++) {
            for (j=0; j<cols; j++) {
                Gold[j] = Gnew[j];
            }
            var lij = l2+i;
            var kij = i;
            var mij = m1-(k-kij);
            Gnew[0] = D(lij, kij, mij)*Gold[0];
            for (var j=1; j<cols; j++) {
                var lij = l2+i-j;
                var kij = i+j;
                var mij = m1-(k-kij);
                Gnew[j] = D(lij, kij, mij)*Gold[j] + E(lij, kij, mij)*Gnew[j-1];
            }
        }
    
        var G = Gnew[cols-1];
        return G;
    }
    
    // Recursion coeffcients
    function A(l, k, m, mu) {
        return Math.sqrt((2*k+1)*(2*k-1)*(l+m)*(l-m)/((k+mu)*(k-mu)*(2*l+1)*(2*l-1)));
    }
    function B(l, k, m, mu) {
        return Math.sqrt((2*k+1)*(2*k-1)*(l+m+1)*(l-m+1)/((k+mu)*(k-mu)*(2*l+3)*(2*l+1)));
    }
    function C(k, mu) {
        return -Math.sqrt((2*k+1)*(k+mu-1)*(k-mu-1)/((k+mu)*(k-mu)*(2*k-3)));
    }
    function D(l, k, m) {
        return Math.sqrt((2*k+1)*(l+m-1)*(l+m)/(2*k*(2*l+1)*(2*l-1)));
    }
    function E(l, k, m) {
        return -Math.sqrt((2*k+1)*(l-m+1)*(l-m+2)/(2*k*(2*l+1)*(2*l+3)));
    }
};

// Create a Gaunt matrix
// (-l1,-l2) ... (-l1, l2)
//    ...           ...
// ( l1,-l2) ... ( l1, l2)
Gaunt.mat = function(l1, l2, k) {
    // Initialize Gaunt matrix (negative indices allowed)
    var G = [];
    for (var m1=-l1; m1<=l1; m1++) {
        G[m1] = [];
        for (var m2=-l2; m2<=l2; m2++) {
            G[m1][m2] = 0;
        }
    }
    
    // Central element
    G[0][0] = Gaunt.eval(l1, l2, k, 0, 0);
    
    // On the diagonal
    for (var m=1; m<=Math.min(l1,l2); m++) {
        G[m][m]   = Gaunt.eval(l1, l2, k, m, m);
        G[-m][-m] = G[m][m]; // Inverse symmetry
    }
    
    // Along mu direction
    for (var mu=1; mu<=k; mu++) {
        for (var m1=Math.max(-l2+mu,-l1); m1<=Math.min(l2+mu,l1); m1++) {
            var m2 = m1-mu;
            G[m1][m2]   = Gaunt.eval(l1, l2, k, m1, m2);
            G[-m1][-m2] = G[m1][m2]; // Inverse symmetry
        }
    }
    
    return G;
};
