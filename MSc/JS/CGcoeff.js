/*
 * Creates an instance of Clebsch-Gordan matrix
 * Need Vec.js
 */
function CGcoeff(ja, jb) {
    var jaDim  = 2*ja+1;
    var jbDim  = 2*jb+1;
    var vecDim = jaDim*jbDim;
    
    //Matrix CG coefficients [ v0 | v1 | ... | vn-1 ]
    var CGmat = new Array();
    
    //Compute coefficients
    var n = 0;
    for (var j=ja+jb; j>=Math.abs(ja-jb); j--) {
        var vec = Vec.zeros(vecDim);
        
        //Find the start vector by orthogonality
        do {
            for (var i=0; i<vecDim; i++) {
                var ma = getmamb(i)[0];
                var mb = getmamb(i)[1];
                if (ma+mb == j)
                    vec[i] = Math.random();
            }
            var ref = ja+jb-j;
            for (var jn=ja+jb; jn>j; jn--) {
                Vec.orthogonalize(vec, CGmat[ref]);
                ref += (2*jn+1)-1;
            }
        } while (Vec.norm(vec) < 1e-4);
        
        //Phase convention
        var i=0;
        while (Math.abs(vec[i]) < 1e-8)
            i++;
        if (vec[i] < 0) //if the first non-zero element is negative
            vec = Vec.scale(-1, vec);
        
        //Normalize the start vector and push onto CGmat
        CGmat.push(Vec.normalize(vec));
        n++;
        
        //Apply J- to get following vectors
        for (var m=j-1; m>=-j; m--) {
            vec = Vec.zeros(vecDim);
            for (var i=0; i<vecDim; i++) {
                var ma = getmamb(i)[0];
                var mb = getmamb(i)[1];
                if (ma > -ja)
                    vec[getIndex(ma-1,mb)] += CGmat[n-1][i]*Math.sqrt((ja*(ja+1)-ma*(ma-1))/(j*(j+1)-m*(m+1)));
                if (mb > -jb)
                    vec[getIndex(ma,mb-1)] += CGmat[n-1][i]*Math.sqrt((jb*(jb+1)-mb*(mb-1))/(j*(j+1)-m*(m+1)));
            }
            CGmat.push(Vec.normalize(vec));
            n++;
        }
    }
    
    this.ja = ja;
    this.jb = jb;
    this.CG = CGmat;
    
    // Get index: [ma, mb] to vector element i
    function getIndex(ma, mb) {
        return (ja-ma)*jbDim + (jb-mb);
    }

    // Get ma mb: vector element i to [ma, mb]
    function getmamb(i) {
        var ma = ja - Math.floor(i/jbDim);
        var mb = jb - i%jbDim;
        return [ma, mb];
    }
}