/*
 * CrysView.js
 * 3D plot to visualize lattice structure
 */

var CrysView = new Object();

// Plot a list of spheres
CrysView.plot = function(qList, glPainter) {
    var latN = 20;
    var lonN = 20;
    
    glPainter.clearObjectList();
    
    // Setup sphere objects
    for (var c=0; c<qList.length; c++) {
        var qc     = qList[c].q;
        var rc     = qList[c].r;
        var thetac = qList[c].theta;
        var phic   = qList[c].phi;
        
        var xc = rc*Math.sin(thetac)*Math.cos(phic);
        var yc = rc*Math.sin(thetac)*Math.sin(phic);
        var zc = rc*Math.cos(thetac);
        
        var radius = 0.5;
        var color  = null;
        if (qc>0) {
            color = [1,0,0];
        } else if (qc==0) {
            color = [0,1,0];
        } else {
            color = [0,0,1];
        }
        
        var vertices = [];
        var normals  = [];
        var colors   = [];
        var indices  = [];
        
        for (var i=0; i<=latN; i++) {
            var theta = i/latN*Math.PI;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);
            
            for (var j=0; j<=lonN; j++) {
                var phi = j/lonN*2*Math.PI;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);
                
                var x = xc+radius*cosPhi*sinTheta;
                var y = yc+radius*sinPhi*sinTheta;
                var z = zc+radius*cosTheta;
                
                vertices.push(x);
                vertices.push(y);
                vertices.push(z);
                
                normals.push(x-xc);
                normals.push(y-yc);
                normals.push(z-zc);
            }
        }
        
        for (var i=0; i<=latN; i++) {
            for (var j=0; j<=lonN; j++) {
                colors.push(color[0]);
                colors.push(color[1]);
                colors.push(color[2]);
                colors.push(1.0);
            }
        }
        
        for (var i=0; i<latN; i++) {
            for (var j=0; j<lonN; j++) {
                var first  = i*(lonN+1)+j;
                var second = first+lonN+1;
                indices.push(first);
                indices.push(second);
                indices.push(first+1);
                indices.push(second);
                indices.push(second+1);
                indices.push(first+1);
            }
        }
        
        glPainter.setupObject(vertices, normals, colors, indices, 0, true);
    }
    
    glPainter.refresh();
};
