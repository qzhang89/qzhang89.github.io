/*
 * Solve eigenvalue and eigenvectors for real symmetric matrix
 * A JavaScript version modified from Numerical Recipes in C
 */

var Eig = new Object();

/*
 * A - Input: Float64Array(n*n) real symmetric matrix
 * E - Output: Float64Array(n) eigenvalues
 * V - Output: Array(n) of Float64Array(n) eigenvectors
 */
Eig.solve = function(A, isV) {
    var n = Math.round(Math.sqrt(A.length));
    var a = new Float64Array(A);
    var d = new Float64Array(n);
    var e = new Float64Array(n);
    
    if (isV) {
        Eig.tred2(a, n, d, e);
        Eig.tqli(d, e, n, a);
        var V = [];
        for (var j=0; j<n; j++) {
            V[j] = new Float64Array(n);
            for (var i=0; i<n; i++) {
                V[j][i] = a[i*n+j];
            }
        }
        return {E:d, V:V};
    } else {
        Eig.tred2N(a, n, d, e);
        Eig.tqliN(d, e, n);
        return d;
    }
};

/*
 *  Perform a Housholder reduction of a real symmetric matrix
 *  a[n*n]. On output a[n*n] is replaced by the orthogonal matrix 
 *  effecting the transformation. d[] returns the diagonal elements
 *  of the tri-diagonal matrix, and e[] the off-diagonal elements, 
 *  with e[0] = 0.
 */
Eig.tred2 = function(a, n, d, e) {
    var l, k, j, i;
    var scale, hh, h, g, f;

    for (i=n-1; i>0; i--) {
        l = i-1;
        h = scale = 0.0;
        if (l > 0) {
            for (k=0; k<=l; k++) {
                scale += Math.abs(a[i*n+k]);
            }
            if (scale == 0.0) { // skip transformation
                e[i] = a[i*n+l];
            } else {
                for (k=0; k<=l; k++) {
                    a[i*n+k] /= scale; // used scaled a's for transformation
                    h += a[i*n+k]*a[i*n+k];
                }
                f = a[i*n+l];
                g = (f >= 0.0 ? -Math.sqrt(h) : Math.sqrt(h));
                e[i] = scale*g;
                h -= f*g;
                a[i*n+l] = f-g;
                f = 0.0;

                for (j=0; j<=l; j++) {
                    a[j*n+i] = a[i*n+j]/h; // can be omitted if eigenvectors not wanted
                    g = 0.0;
                    for (k=0; k<=j; k++) {
                        g += a[j*n+k]*a[i*n+k];
                    }
                    for (k=j+1; k<=l; k++) {
                        g += a[k*n+j]*a[i*n+k];
                    }
                    e[j] = g/h;
                    f += e[j]*a[i*n+j];
                }
                hh = f/(h+h);
                for (j=0; j<=l; j++) {
                    f = a[i*n+j];
                    e[j] = g = e[j]-hh*f;
                    for (k=0; k<=j; k++) {
                        a[j*n+k] -= (f*e[k]+g*a[i*n+k]);
                    }
                }
            }
        }
        else {
            e[i] = a[i*n+l];
        }
        d[i] = h;
    }
    d[0] = 0.0; // can be omitted if eigenvectors not wanted
    e[0] = 0.0;

    // Contents of this loop can be omitted if eigenvectors not wanted
    // except for statement d[i]=a[i*n+i];
    for (i=0; i<n; i++) {
        l = i-1;
        if (d[i]) {
            for (j=0; j<=l; j++) {
                g = 0.0;
                for (k=0; k<=l; k++) {
                    g += a[i*n+k]*a[k*n+j];
                }
                for (k=0; k<=l; k++) {
                    a[k*n+j] -= g*a[k*n+i];
                }
            }
        }
        d[i] = a[i*n+i];
        a[i*n+i] = 1.0;
        for (j=0; j<=l; j++) {
            a[j*n+i] = a[i*n+j] = 0.0;
        }
    }
};

// tred2 eigenvectors not wanted
Eig.tred2N = function(a, n, d, e) {
    var l, k, j, i;
    var scale, hh, h, g, f;

    for (i=n-1; i>0; i--) {
        l = i-1;
        h = scale = 0.0;
        if (l > 0) {
            for (k=0; k<=l; k++) {
                scale += Math.abs(a[i*n+k]);
            }
            if (scale == 0.0) { // skip transformation
                e[i] = a[i*n+l];
            } else {
                for (k=0; k<=l; k++) {
                    a[i*n+k] /= scale; // used scaled a's for transformation
                    h += a[i*n+k]*a[i*n+k];
                }
                f = a[i*n+l];
                g = (f >= 0.0 ? -Math.sqrt(h) : Math.sqrt(h));
                e[i] = scale*g;
                h -= f*g;
                a[i*n+l] = f-g;
                f = 0.0;

                for (j=0; j<=l; j++) {
                    g = 0.0;
                    for (k=0; k<=j; k++) {
                        g += a[j*n+k]*a[i*n+k];
                    }
                    for (k=j+1; k<=l; k++) {
                        g += a[k*n+j]*a[i*n+k];
                    }
                    e[j] = g/h;
                    f += e[j]*a[i*n+j];
                }
                hh = f/(h+h);
                for (j=0; j<=l; j++) {
                    f = a[i*n+j];
                    e[j] = g = e[j]-hh*f;
                    for (k=0; k<=j; k++) {
                        a[j*n+k] -= (f*e[k]+g*a[i*n+k]);
                    }
                }
            }
        }
        else {
            e[i] = a[i*n+l];
        }
        d[i] = h;
    }
    e[0] = 0.0;

    for (i=0; i<n; i++) {
        d[i] = a[i*n+i];
    }
};

/*
 *  Determine eigenvalues and eigenvectors of a real symmetric
 *  tri-diagonal matrix, or a real, symmetric matrix previously
 *  reduced by function tred2[] to tri-diagonal form. On input,
 *  d[] contains the diagonal element and e[] the sub-diagonal
 *  of the tri-diagonal matrix. On output d[] contains the
 *  eigenvalues and  e[] is destroyed. If eigenvectors are
 *  desired z[n*n] on input contains the identity matrix. If
 *  eigenvectors of a matrix reduced by tred2() are required,
 *  then z[n*n] on input is the matrix output from tred2().
 *  On output, the k'th column returns the normalized eigenvector
 *  corresponding to d[k].
 */
Eig.tqli = function(d, e, n, z) {
    var m, l, iter, i, k;
    var s, r, p, g, f, dd, c, b;

    for (i=1; i<n; i++) {
        e[i-1] = e[i];
    }
    e[n] = 0.0;
    for (l=0; l<n; l++) {
        iter = 0;
        do {
            for (m=l; m<n-1; m++) {
                dd = Math.abs(d[m])+Math.abs(d[m+1]);
                if ((Math.abs(e[m])+dd) == dd) {
                    break;
                }
            }
            if (m != l) {
                if (iter++ == 30) {
                    console.log("Too many iterations in tqli.");
                    return -1;
                }
                g = (d[l+1]-d[l])/(2.0*e[l]);
                r = pythag(g, 1.0);
                g = d[m]-d[l]+e[l]/(g+(g<0?-Math.abs(r):Math.abs(r)));
                s = c = 1.0;
                p = 0.0;
                for (i=m-1; i>=l; i--) {
                    f = s*e[i];
                    b = c*e[i];
                    e[i+1] = (r = pythag(f, g));
                    if (r == 0.0) {
                        d[i+1] -= p;
                        e[m] = 0.0;
                        break;
                    }
                    s = f/r;
                    c = g/r;
                    g = d[i+1]-p;
                    r = (d[i]-g)*s+2.0*c*b;
                    d[i+1] = g+(p = s*r);
                    g = c*r-b;
                    // Contents of this loop can be omitted if eigenvectors not wanted
                    for (k=0; k<n; k++) {
                        f = z[k*n+i+1];
                        z[k*n+i+1] = s*z[k*n+i]+c*f;
                        z[k*n+i] = c*z[k*n+i]-s*f;
                    }
                }
                if (r == 0.0 && i >= l) {
                    continue;
                }
                d[l] -= p;
                e[l] = g;
                e[m] = 0.0;
            }
        } while (m != l);
    }

    function pythag(a, b) {
        var absa, absb;
        absa = Math.abs(a);
        absb = Math.abs(b);
        if (absa > absb) {
            return absa*Math.sqrt(1.0+(absb/absa)*(absb/absa));
        } else {
            return (absb == 0.0 ? 0.0 : absb*Math.sqrt(1.0+(absa/absb)*(absa/absb)));
        }
    }
};

// tqli eigenvectors not wanted
Eig.tqliN = function(d, e, n) {
    var m, l, iter, i;
    var s, r, p, g, f, dd, c, b;

    for (i=1; i<n; i++) {
        e[i-1] = e[i];
    }
    e[n] = 0.0;
    for (l=0; l<n; l++) {
        iter = 0;
        do {
            for (m=l; m<n-1; m++) {
                dd = Math.abs(d[m])+Math.abs(d[m+1]);
                if ((Math.abs(e[m])+dd) == dd) {
                    break;
                }
            }
            if (m != l) {
                if (iter++ == 30) {
                    console.log("Too many iterations in tqli.");
                    return -1;
                }
                g = (d[l+1]-d[l])/(2.0*e[l]);
                r = pythag(g, 1.0);
                g = d[m]-d[l]+e[l]/(g+(g<0?-Math.abs(r):Math.abs(r)));
                s = c = 1.0;
                p = 0.0;
                for (i=m-1; i>=l; i--) {
                    f = s*e[i];
                    b = c*e[i];
                    e[i+1] = (r = pythag(f, g));
                    if (r == 0.0) {
                        d[i+1] -= p;
                        e[m] = 0.0;
                        break;
                    }
                    s = f/r;
                    c = g/r;
                    g = d[i+1]-p;
                    r = (d[i]-g)*s+2.0*c*b;
                    d[i+1] = g+(p = s*r);
                    g = c*r-b;
                }
                if (r == 0.0 && i >= l) {
                    continue;
                }
                d[l] -= p;
                e[l] = g;
                e[m] = 0.0;
            }
        } while (m != l);
    }

    function pythag(a, b) {
        var absa, absb;
        absa = Math.abs(a);
        absb = Math.abs(b);
        if (absa > absb) {
            return absa*Math.sqrt(1.0+(absb/absa)*(absb/absa));
        } else {
            return (absb == 0.0 ? 0.0 : absb*Math.sqrt(1.0+(absa/absb)*(absa/absb)));
        }
    }
};
