/*
 * Visualizer.js
 * 3D density plot to visualize atomic orbitals
 * Need in include Complex.js
 */

var Visualizer = new Object();

// Generate vertices
Visualizer.generatePoints = function(orbt, cList, lList, mList, nPoints, isReal) {
    // Orbital information
    var Z = orbt.G.Z;
    var x = orbt.G.x;
    var r = orbt.G.r;
    var E = orbt.E;
    var l = orbt.l;
    var R = orbt.R;
    var node = orbt.node;
    var dx = orbt.G.dx;
    
    var len = cList.length;
    
    var fourPI = 4*Math.PI;
    var fact = new Array();
    for (var i=0; i<len; i++) {
        fact[i] = Math.sqrt((2*lList[i]+1)/fourPI * factorial(lList[i]-Math.abs(mList[i])) / factorial(lList[i]+Math.abs(mList[i])));
    }
    
    // Determine sampling curve
    var max = absMax(R);
    var beta = E<0 ? 2*Math.sqrt(-2*E) : 0;
    var A;
    do {
        beta *= 0.5; // Flatten the curve
        A = Math.abs(R[0])/Math.exp(-beta*r[0]);
        for (var i=1; i<R.length; i++) {
            if (Math.abs(R[i]) > 0.001*max) {
                var Ai = Math.abs(R[i])/Math.exp(-beta*r[i]);
                if (Ai > A) {
                    A = Ai;
                }
            }
        }
    } while (beta>0 && A>1000 && (l>0 || node>0)); // Try to find a better sampling curve
    
    // Determine sampling sphere for Y
    fmax = Math.sqrt((2*l+1)/fourPI * factorial(l-Math.abs(0)) / factorial(l+Math.abs(0)));
    Pmax = lgndr(l, 0, Math.cos(0));
    Ymax = new Complex(fmax*Pmax*Math.cos(0), fmax*Pmax*Math.sin(0));
    YmaxAbs = Math.sqrt(Ymax.multiply(Ymax.conjugate()).re);
    
    // Points vertices, colors
    var pointVertices = [];
    var pointNormals  = [];
    var pointColors   = [];
    
    while (pointVertices.length/3 < nPoints) {
        var x  = 2*A*(Math.random()-0.5);
        var y  = 2*A*(Math.random()-0.5);
        var z  = 2*A*(Math.random()-0.5);
        var xi = Math.sqrt(x*x+y*y+z*z);
        
        if (xi <= A) {
            // Map to exp distribution
            var ri  = -Math.log((A-xi)/A)/beta;
            var idx = Math.round(rToIndex(ri, r[0], dx, Z));
            
            if (idx < R.length) {
                // Sample R
                var Ri = R[idx];
                
                var eta = Math.random();
                if (eta < Math.abs(Ri)/(A*Math.exp(-beta*ri))) {
                    var theta = Math.acos(z/Math.sqrt(x*x+y*y+z*z));
                    var phi;
                    if (y >= 0) {
                        phi = Math.acos(x/Math.sqrt(x*x+y*y));
                    } else {
                        phi = 2*Math.PI - Math.acos(x/Math.sqrt(x*x+y*y));
                    }
                    
                    // Sample Y
                    var Plm = new Array();
                    for (var i=0; i<len; i++) {
                        Plm[i] = lgndr(lList[i], Math.abs(mList[i]), Math.cos(theta));
                        if (mList[i] < 0) {
                            Plm[i] = Math.pow(-1, -mList[i]) * Plm[i];
                        }
                    }
                    
                    var Ysum = new Complex(0, 0);
                    for (var i=0; i<len; i++) {
                        Ysum = Ysum.add(cList[i].multiply((new Complex(fact[i]*Plm[i]*Math.cos(mList[i]*phi), fact[i]*Plm[i]*Math.sin(mList[i]*phi)))));
                    }
                    
                    var YsumAbs = Math.sqrt(Ysum.multiply(Ysum.conjugate()).re);
                    
                    var zeta = YmaxAbs * Math.random();
                    if (zeta < YsumAbs) {
                        x *= ri/xi;
                        y *= ri/xi;
                        z *= ri/xi;
                        
                        // Push vertex
                        pointVertices.push(x);
                        pointVertices.push(y);
                        pointVertices.push(z);
                        
                        // Push color
                        if (Ri < 0) {
                            Ysum = Ysum.multiply(new Complex(-1, 0));
                        }
                        
                        if (isReal) {
                            if (Ysum.re>=0) {
                                pointColors.push(1);
                                pointColors.push(0);
                                pointColors.push(0);
                            } else {
                                pointColors.push(0);
                                pointColors.push(0);
                                pointColors.push(1);
                            }
                            pointColors.push(1);
                        } else {
                            var phase = Ysum.phase();
                            if (phase>=0 && phase<Math.PI/3) {
                                var rat = phase/(Math.PI/3);
                                pointColors.push(1);
                                pointColors.push(rat);
                                pointColors.push(0);
                            } else if (phase>=Math.PI/3 && phase<Math.PI*2/3) {
                                var rat = (phase-Math.PI/3)/(Math.PI/3);
                                pointColors.push(1-rat);
                                pointColors.push(1);
                                pointColors.push(0);
                            } else if (phase>=Math.PI*2/3 && phase<Math.PI) {
                                var rat = (phase-Math.PI*2/3)/(Math.PI/3);
                                pointColors.push(0);
                                pointColors.push(1);
                                pointColors.push(rat);
                            } else if (phase>=Math.PI && phase<Math.PI*4/3) {
                                var rat = (phase-Math.PI)/(Math.PI/3);
                                pointColors.push(0);
                                pointColors.push(1-rat);
                                pointColors.push(1);
                            } else if (phase>=Math.PI*4/3 && phase<Math.PI*5/3) {
                                var rat = (phase-Math.PI*4/3)/(Math.PI/3);
                                pointColors.push(rat);
                                pointColors.push(0);
                                pointColors.push(1);
                            } else {
                                var rat = (phase-Math.PI*5/3)/(Math.PI/3);
                                pointColors.push(1);
                                pointColors.push(0);
                                pointColors.push(1-rat);
                            }
                            pointColors.push(1);
                        }
                        
                        // Compute normals
                        var dTheta   = 1e-4;
                        var dPhi     = 1e-4;
                        var sinTheta = Math.sin(theta);
                        var cosTheta = Math.cos(theta);
                        var sinPhi   = Math.sin(phi);
                        var cosPhi   = Math.cos(phi);
                        
                        var PlmpTheta = [];
                        var PlmmTheta = [];
                        for (var i=0; i<len; i++) {
                            PlmpTheta[i] = lgndr(lList[i], Math.abs(mList[i]), Math.cos(theta+dTheta));
                            PlmmTheta[i] = lgndr(lList[i], Math.abs(mList[i]), Math.cos(theta-dTheta));
                            if (mList[i] < 0) {
                                PlmpTheta[i] = Math.pow(-1, -mList[i]) * PlmpTheta[i];
                                PlmmTheta[i] = Math.pow(-1, -mList[i]) * PlmmTheta[i];
                            }
                        }
                        var Ysumup    = new Complex(0, 0);
                        var Ysumdown  = new Complex(0, 0);
                        var Ysumleft  = new Complex(0, 0);
                        var Ysumright = new Complex(0, 0);
                        for (var i=0; i<len; i++) {
                            Ysumup    = Ysumup.add(cList[i].multiply((new Complex(fact[i]*PlmmTheta[i]*Math.cos(mList[i]*phi), fact[i]*PlmmTheta[i]*Math.sin(mList[i]*phi)))));
                            Ysumdown  = Ysumdown.add(cList[i].multiply((new Complex(fact[i]*PlmpTheta[i]*Math.cos(mList[i]*phi), fact[i]*PlmpTheta[i]*Math.sin(mList[i]*phi)))));
                            Ysumleft  = Ysumleft.add(cList[i].multiply((new Complex(fact[i]*Plm[i]*Math.cos(mList[i]*phi-dPhi), fact[i]*Plm[i]*Math.sin(mList[i]*phi-dPhi)))));
                            Ysumright = Ysumright.add(cList[i].multiply((new Complex(fact[i]*Plm[i]*Math.cos(mList[i]*phi+dPhi), fact[i]*Plm[i]*Math.sin(mList[i]*phi+dPhi)))));
                        }
                        
                        var Yme    = YsumAbs;
                        var Yup    = Math.sqrt(Ysumup.multiply(Ysumup.conjugate()).re);
                        var Ydown  = Math.sqrt(Ysumdown.multiply(Ysumdown.conjugate()).re);
                        var Yleft  = Math.sqrt(Ysumleft.multiply(Ysumleft.conjugate()).re);
                        var Yright = Math.sqrt(Ysumright.multiply(Ysumright.conjugate()).re);
                        
                        var rCmpnt     = -1/Yme;
                        var thetaCmpnt = 1/(Yme*Yme) * (Ydown-Yup)/(2*dTheta);
                        var phiCmpnt   = 1/(Yme*Yme*sinTheta) * (Yright-Yleft)/(2*dPhi);
                        
                        var xCmpnt = rCmpnt*sinTheta*cosPhi + thetaCmpnt*cosTheta*cosPhi - phiCmpnt*sinPhi;
                        var yCmpnt = rCmpnt*sinTheta*sinPhi + thetaCmpnt*cosTheta*sinPhi + phiCmpnt*cosPhi;
                        var zCmpnt = rCmpnt*cosTheta - thetaCmpnt*sinTheta;
                        
                        if(Math.abs(Yme) < 1e-8) {
                            // avoid division by zero
                            pointNormals.push(0);
                            pointNormals.push(0);
                            pointNormals.push(1);
                        } else {
                            pointNormals.push(-xCmpnt);
                            pointNormals.push(-yCmpnt);
                            pointNormals.push(-zCmpnt);
                        }
                    }
                }
            }
        }
    }
    
    return {vertices:pointVertices, normals:pointNormals, colors:pointColors};
    
    function factorial(n) {
        var result = 1;
        for (var i=2; i<=n; i++) {
            result *= i;
        }
        return result;
    }
    
    function rToIndex(ri, rMin, dx, Z) {
        return (Math.log(Z*ri)-Math.log(rMin*Z))/dx;
    }
    
    function absMax(arr) {
        var max = Math.abs(arr[0]);
        for (var i=1; i<arr.length; i++) {
            if (Math.abs(arr[i]) > max) {
                max = Math.abs(arr[i]);
            }
        }
        return max;
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
