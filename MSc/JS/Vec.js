/*
 * Vector operations
 */

var Vec = new Object();

// Create a vector of zeros
Vec.zeros = function(n) {
    var v = new Float64Array(n);
    return v;
};

// Create a vector of ones
Vec.ones = function(n) {
    var v = new Float64Array(n);
    for (var i=0; i<n; i++) {
        v[i] = 1;
    }
    return v;
};

// Create a vector of alpha's
Vec.alphas = function(a, n) {
    var v = new Float64Array(n);
    for (var i=0; i<n; i++) {
        v[i] = a;
    }
    return v;
};

// Create a vector of random numbers (0 to 1)
Vec.rands = function(n) {
    var v = new Float64Array(n);
    for (var i=0; i<n; i++) {
        v[i] = Math.random();
    }
    return v;
};

// Duplicate a vector
Vec.duplicate = function(v) {
    var w = new Float64Array(v);
    return w;
};

// Calculate the norm of a vector
Vec.norm = function(v) {
    var n = v.length;
    var norm = 0.0;
    for (var i=0; i<n; i++) {
        norm += v[i]*v[i];
    }
    norm = Math.sqrt(norm);
    return norm;
};

// Scale a vector by a factor
Vec.scale = function(a, v) {
    var n = v.length;
    for (var i=0; i<n; i++) {
        v[i] = a*v[i];
    }
    return v;
};

// Normalize a vector
Vec.normalize = function(v) {
    var n = v.length;
    var norm = Vec.norm(v);
    if (norm != 0) {
        var ninv = 1.0/norm;
        for (var i=0; i<n; i++) {
            v[i] = ninv*v[i];
        }
    }
    return v;
};

// Dot product of of two vectors
Vec.dot = function(v, w) {
    var n = v.length;
    var sum = 0.0;
    for (var i=0; i<n; i++) {
        sum += v[i]*w[i];
    }
    return sum;
};

// w = a*v + w
Vec.axpy = function(a, v, w) {
    var m = v.length%4;
    var n = v.length;
    if (m!=0) {
        for (var i=0; i<m; i++) {
            w[i] = w[i]+a*v[i];
        }
    }
    if (n<4) {
        return w;
    }
    for (var i=m; i<n; i+=4) {
        w[i  ] = w[i  ]+a*v[i  ];
        w[i+1] = w[i+1]+a*v[i+1];
        w[i+2] = w[i+2]+a*v[i+2];
        w[i+3] = w[i+3]+a*v[i+3];
    }
    return w;
};

// Orthogonalize ortVec to refVec
Vec.orthogonalize = function(ortVec, refVec) {
    var n = ortVec.length;
    var proj = Vec.dot(ortVec, refVec); //refVec is unit vector
    for(var i=0; i<n; i++) {
        ortVec[i] = ortVec[i] - proj*refVec[i];
    }
    return ortVec;
};

// Matrix vector multiplication A[i*dim+j]
Vec.matMult = function(A, v) {
    var n = v.length;
    var w = Vec.zeros(n);
    for (var j=0; j<n; j++) {
        if (Math.abs(v[j])>1e-8) {
            for (var i=0; i<n; i++) {
                w[i] += A[i*n+j]*v[j];
            }
        }
    }
    return w;
};

// Check Av=Ev
Vec.residual = function(A, E, v) {
    var n = v.length;
    var w = Vec.matMult(A, v);
    for (var i=0; i<n; i++) {
        w[i] -= E*v[i];
    }
    return(Vec.norm(w));
};
