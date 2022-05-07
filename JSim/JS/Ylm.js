/*
 * Ylm.js
 * Generate spherical harmonics plots
 * Need to include Complex.js, Painter3D.js
 */

var Ylm = new Object();

window.addEventListener("load", function() {Ylm.loadHandler();}, false);
Ylm.loadHandler = function() {
    var YlmDivs = document.getElementsByClassName("Ylm");
    for (var i=0; i<YlmDivs.length; i++) {
        Ylm.setup(YlmDivs[i]);
    }
};

// Spherical hamonics setup
Ylm.setup = function(container) {
    // Get data from <div>{JSON}</div>
    var jsonData = JSON.parse(container.innerHTML);
    var orbtIndex = typeof jsonData.orbtIndex === "undefined" ? 0             : jsonData.orbtIndex;
    var bkgdColor = typeof jsonData.bkgdColor === "undefined" ? [1.0,1.0,1.0] : jsonData.bkgdColor;
    var gridColor = typeof jsonData.gridColor === "undefined" ? [0.8,0.8,0.8] : jsonData.gridColor;
    var panelOn   = typeof jsonData.panelOn   === "undefined" ? true          : jsonData.panelOn;
    var cWidth    = typeof jsonData.cWidth    === "undefined" ? 1.0           : jsonData.cWidth;
    var cHeight   = typeof jsonData.cHeight   === "undefined" ? 1.0           : jsonData.cHeight;
    
    // Add HTML elements
    var html = "<canvas></canvas><br />";
    html += "<div>";
    html += "Pre-defined orbitals<br />";
    html += "<select>";
    html += "<optgroup label='Pure harmonics'>";
    html += "<option>l = 0, m = 0</option>";
    html += "<option>l = 1, m =-1</option>";
    html += "<option>l = 1, m = 0</option>";
    html += "<option>l = 1, m = 1</option>";
    html += "<option>l = 2, m =-2</option>";
    html += "<option>l = 2, m =-1</option>";
    html += "<option>l = 2, m = 0</option>";
    html += "<option>l = 2, m = 1</option>";
    html += "<option>l = 2, m = 2</option>";
    html += "<option>l = 3, m =-3</option>";
    html += "<option>l = 3, m =-2</option>";
    html += "<option>l = 3, m =-1</option>";
    html += "<option>l = 3, m = 0</option>";
    html += "<option>l = 3, m = 1</option>";
    html += "<option>l = 3, m = 2</option>";
    html += "<option>l = 3, m = 3</option>";
    html += "</optgroup>";
    html += "<optgroup label='Real harmonics'>";
    html += "<option>s</option>";
    html += "<option>p_z</option>";
    html += "<option>p_x</option>";
    html += "<option>p_y</option>";
    html += "<option>d_3zz-1</option>";
    html += "<option>d_xz</option>";
    html += "<option>d_yz</option>";
    html += "<option>d_xx-yy</option>";
    html += "<option>d_xy</option>";
    html += "<option>f_z(5zz-3)</option>";
    html += "<option>f_x(5zz-1)</option>";
    html += "<option>f_y(5zz-1)</option>";
    html += "<option>f_z(xx-yy)</option>";
    html += "<option>f_xyz</option>";
    html += "<option>f_x(xx-3yy)</option>";
    html += "<option>f_y(3xx-yy)</option>";
    html += "</optgroup>";
    html += "<optgroup label='Hybrid orbitals'>";
    html += "<option>sp3_1</option>";
    html += "<option>sp3_2</option>";
    html += "<option>sp3_3</option>";
    html += "<option>sp3_4</option>";
    html += "<option>sp2_1</option>";
    html += "<option>sp2_2</option>";
    html += "<option>sp2_3</option>";
    html += "<option>sp_1</option>";
    html += "<option>sp_2</option>";
    html += "</optgroup>";
    html += "</select><br /><br />";
    html += "Linear combinations";
    html += "<table border='1' style='width:25%; margin:auto;'>";
    html += "<tr><th>Y<sub>lm</sub></th><th>coeff</th><th>l</th><th>m</th></tr>";
    html += "<tr><td>1</td>";
    html += "<td><span class='c' contenteditable='true'>0.5</span></td>";
    html += "<td><span class='l' contenteditable='true'>1</span></td>";
    html += "<td><span class='m' contenteditable='true'>0</span></td></tr>";
    html += "<tr><td>2</td>";
    html += "<td><span class='c' contenteditable='true'>1.0i</span></td>";
    html += "<td><span class='l' contenteditable='true'>5</span></td>";
    html += "<td><span class='m' contenteditable='true'>3</span></td></tr>";
    html += "<tr><td>3</td>";
    html += "<td><span class='c' contenteditable='true'>0.5+0.5i</span></td>";
    html += "<td><span class='l' contenteditable='true'>7</span></td>";
    html += "<td><span class='m' contenteditable='true'>-3</span></td></tr>";
    html += "</table>";
    html += "<input type='button' value='Add row' />&nbsp;";
    html += "<input type='button' value='Delete row' />&nbsp;";
    html += "<input type='button' value='Create' />";
    html += "<div />";
    container.innerHTML = html;
    
    // Get HTML elements
    var glCanvas  = container.getElementsByTagName("canvas")[0];
    var orbtList  = container.getElementsByTagName("select")[0];
    var linTable  = container.getElementsByTagName("table")[0];
    var cList     = container.getElementsByClassName("c");
    var lList     = container.getElementsByClassName("l");
    var mList     = container.getElementsByClassName("m");
    var addButton = container.getElementsByTagName("input")[0];
    var delButton = container.getElementsByTagName("input")[1];
    var creButton = container.getElementsByTagName("input")[2];
    var panelDiv  = container.getElementsByTagName("div")[0];
    
    //  Control panel display
    if (!panelOn) {
        panelDiv.style.display = "none";
    }
    
    // Painter3D
    var glPainter = new Painter3D(glCanvas);
    glPainter.setMatrices([0.0,0.0,-28.0], [-1.2,0.0,-Math.PI*3/4]);
    glPainter.setBkgdColor(bkgdColor);
    
    // Setup axis
    glPainter.setupAxis(10, 0.5);
    glPainter.setAxisOn(true);
    
    // Setup grid
    glPainter.setupGrid(1, 12, gridColor);
    glPainter.setGridOn(false);
    
    // Setup light
    var lightDirection = [0.0, 1.0, 2.0];
    var lightAmbient   = [0.3, 0.3, 0.3];
    var lightDiffuse   = [0.6, 0.6, 0.6];
    var lightSpecular  = [0.8, 0.8, 0.8];
    var shininess      = 100.0;
    glPainter.setupLight(lightDirection, lightAmbient, lightDiffuse, lightSpecular, shininess);
    glPainter.setLightOn(true);
    
    // Initial plot
    orbtList.selectedIndex = orbtIndex;
    orbtChangeHandler();
    resize();
    
    // Add event listener
    window.addEventListener("resize", resize, false);
    orbtList.addEventListener("change", orbtChangeHandler, false);
    addButton.addEventListener("click", addRowHandler, false);
    delButton.addEventListener("click", delRowHandler, false);
    creButton.addEventListener("click", createHandler, false);
    
    // Event handlers
    function orbtChangeHandler() {
        var index = orbtList.selectedIndex;
        var c, l, m;
        switch(index) {
        case 0:
            c = [new Complex(1,0)]; l = [0]; m = [0];
            break;
        case 1:
            c = [new Complex(1,0)]; l = [1]; m = [-1];
            break;
        case 2:
            c = [new Complex(1,0)]; l = [1]; m = [0];
            break;
        case 3:
            c = [new Complex(1,0)]; l = [1]; m = [1];
            break;
        case 4:
            c = [new Complex(1,0)]; l = [2]; m = [-2];
            break;
        case 5:
            c = [new Complex(1,0)]; l = [2]; m = [-1];
            break;
        case 6:
            c = [new Complex(1,0)]; l = [2]; m = [0];
            break;
        case 7:
            c = [new Complex(1,0)]; l = [2]; m = [1];
            break;
        case 8:
            c = [new Complex(1,0)]; l = [2]; m = [2];
            break;
        case 9:
            c = [new Complex(1,0)]; l = [3]; m = [-3];
            break;
        case 10:
            c = [new Complex(1,0)]; l = [3]; m = [-2];
            break;
        case 11:
            c = [new Complex(1,0)]; l = [3]; m = [-1];
            break;
        case 12:
            c = [new Complex(1,0)]; l = [3]; m = [0];
            break;
        case 13:
            c = [new Complex(1,0)]; l = [3]; m = [1];
            break;
        case 14:
            c = [new Complex(1,0)]; l = [3]; m = [2];
            break;
        case 15:
            c = [new Complex(1,0)]; l = [3]; m = [3];
            break;
        case 16:
            c = [new Complex(1,0)]; l = [0]; m = [0];
            break;
        case 17:
            c = [new Complex(1,0)]; l = [1]; m = [0];
            break;
        case 18:
            c = [new Complex(1,0), new Complex(-1,0)]; l = [1,1]; m = [-1,1];
            break;
        case 19:
            c = [new Complex(0,1), new Complex(0,1)]; l = [1,1]; m = [-1,1];
            break;
        case 20:
            c = [new Complex(1,0)]; l = [2]; m = [0];
            break;
        case 21:
            c = [new Complex(1,0), new Complex(-1,0)]; l = [2,2]; m = [-1,1];
            break;
        case 22:
            c = [new Complex(0,1), new Complex(0,1)]; l = [2,2]; m = [-1,1];
            break;
        case 23:
            c = [new Complex(1,0), new Complex(1,0)]; l = [2,2]; m = [-2,2];
            break;
        case 24:
            c = [new Complex(0,1), new Complex(0,-1)]; l = [2,2]; m = [-2,2];
            break;
        case 25:
            c = [new Complex(1,0)]; l = [3]; m = [0];
            break;
        case 26:
            c = [new Complex(1,0), new Complex(-1,0)]; l = [3,3]; m = [-1,1];
            break;
        case 27:
            c = [new Complex(0,1), new Complex(0,1)]; l = [3,3]; m = [-1,1];
            break;
        case 28:
            c = [new Complex(1,0), new Complex(1,0)]; l = [3,3]; m = [-2,2];
            break;
        case 29:
            c = [new Complex(0,1), new Complex(0,-1)]; l = [3,3]; m = [-2,2];
            break;
        case 30:
            c = [new Complex(1,0), new Complex(-1,0)]; l = [3,3]; m = [-3,3];
            break;
        case 31:
            c = [new Complex(0,1), new Complex(0,1)]; l = [3,3]; m = [-3,3];
            break;
        case 32:
            c = [new Complex(1,0), new Complex(Math.sqrt(1/2),Math.sqrt(1/2)), new Complex(1,0), new Complex(-Math.sqrt(1/2),Math.sqrt(1/2))];
            l = [0, 1, 1, 1]; m = [0, -1, 0, 1];
            break;
        case 33:
            c = [new Complex(1,0), new Complex(Math.sqrt(1/2),-Math.sqrt(1/2)), new Complex(-1,0), new Complex(-Math.sqrt(1/2),-Math.sqrt(1/2))];
            l = [0, 1, 1, 1]; m = [0, -1, 0, 1];
            break;
        case 34:
            c = [new Complex(1,0), new Complex(-Math.sqrt(1/2),Math.sqrt(1/2)), new Complex(-1,0), new Complex(Math.sqrt(1/2),Math.sqrt(1/2))];
            l = [0, 1, 1, 1]; m = [0, -1, 0, 1];
            break;
        case 35:
            c = [new Complex(1,0), new Complex(-Math.sqrt(1/2),-Math.sqrt(1/2)), new Complex(1,0), new Complex(Math.sqrt(1/2),-Math.sqrt(1/2))];
            l = [0, 1, 1, 1]; m = [0, -1, 0, 1];
            break;
        case 36:
            c = [new Complex(Math.sqrt(1/3),0), new Complex(Math.sqrt(1/3),0), new Complex(-Math.sqrt(1/3),0)];
            l = [0, 1 ,1]; m = [0, -1, 1];
            break;
        case 37:
            c = [new Complex(Math.sqrt(1/3),0), new Complex(-Math.sqrt(1/12),1/2), new Complex(Math.sqrt(1/12),1/2)];
            l = [0, 1 ,1]; m = [0, -1, 1];
            break;
        case 38:
            c = [new Complex(Math.sqrt(1/3),0), new Complex(-Math.sqrt(1/12),-1/2), new Complex(Math.sqrt(1/12),-1/2)];
            l = [0, 1 ,1]; m = [0, -1, 1];
            break;
        case 39:
            c = [new Complex(1,0), new Complex(1,0)];
            l = [0, 1]; m = [0, 0];
            break;
        case 40:
            c = [new Complex(1,0), new Complex(-1,0)];
            l = [0, 1]; m = [0, 0];
            break;
        default:
            c = [new Complex(1,0)]; l = [0]; m = [0];
            break;
        }
        
        var vertices = new Array();
        var normals  = new Array();
        var colors   = new Array();
        var indices  = new Array();
        Ylm.setupYlmArrays(c, l, m, vertices, normals, colors, indices);
        
        // Setup buffers
        glPainter.clearObjectList();
        glPainter.setupObject(vertices, normals, colors, indices, 0, true);
        glPainter.refresh();
    }
    
    function addRowHandler() {
        var cRe = (2*(Math.random()-0.5)).toFixed(1);
        var cIm = (2*(Math.random()-0.5)).toFixed(1);
        var l   = Math.floor(10*Math.random());
        var m   = Math.floor(l*2*(Math.random()-0.5));
        
        var row = linTable.insertRow(linTable.rows.length);
        var c0  = row.insertCell(0);
        var c1  = row.insertCell(1);
        var c2  = row.insertCell(2);
        var c3  = row.insertCell(3);
        c0.innerHTML = linTable.rows.length-1;
        c1.innerHTML = "<span class='c' contenteditable='true'>"+cRe+(cIm>=0?"+":"-")+Math.abs(cIm).toFixed(1)+"i</span>";
        c2.innerHTML = "<span class='l' contenteditable='true'>"+l+"</span>";
        c3.innerHTML = "<span class='m' contenteditable='true'>"+m+"</span>";
        cList = container.getElementsByClassName("c");
        lList = container.getElementsByClassName("l");
        mList = container.getElementsByClassName("m");
    }
    
    function delRowHandler() {
        if (linTable.rows.length-1 > 0) {
            linTable.deleteRow(linTable.rows.length-1);
            cList = container.getElementsByClassName("c");
            lList = container.getElementsByClassName("l");
            mList = container.getElementsByClassName("m");
        }
    }
    
    function createHandler() {
        /* Regular expression for matching complex numbers */
        var cReg = /([-+]?\d+\.?\d*|[-+]?\d*\.?\d+)([-+]\d+\.?\d*|[-+]\d*\.?\d+)i/;
        var iReg = /([-+]?\d+\.?\d*|[-+]?\d*\.?\d+)i/;
        var rReg = /([-+]?\d+\.?\d*|[-+]?\d*\.?\d+)/;
        
        var c = new Array();
        var l = new Array();
        var m = new Array();
        
        var n = cList.length;
        for (var i=0; i<n; i++) {
            var cStr = cList[i].innerHTML.match(cReg);
            var iStr = cList[i].innerHTML.match(iReg);
            var rStr = cList[i].innerHTML.match(rReg);
            
            if (cStr!=null && cStr[0]==cList[i].innerHTML) {
                c[i] = new Complex(parseFloat(cStr[1]), parseFloat(cStr[2]));
            } else if (iStr!=null && iStr[0]==cList[i].innerHTML) {
                c[i] = new Complex(0, parseFloat(iStr[1]));
            } else if (rStr!=null && rStr[0]==cList[i].innerHTML) {
                c[i] = new Complex(parseFloat(rStr[1]), 0);
            } else {
                alert("coeff must have a complex number format: a+bi");
                return -1;
            }
            
            if (isNaN(lList[i].innerHTML) || !isFinite(lList[i].innerHTML) ||
                isNaN(mList[i].innerHTML) || !isFinite(mList[i].innerHTML)) {
                alert("l and m must be numbers!");
                return -1;
            }
            
            l[i] = Math.floor(parseFloat(lList[i].innerHTML));
            m[i] = Math.floor(parseFloat(mList[i].innerHTML));
            
            if (Math.abs(m[i]) > l[i]) {
                alert("Invalid arguments: |m| > l");
                return -1;
            }
        }
        
        var vertices = new Array();
        var normals  = new Array();
        var colors   = new Array();
        var indices  = new Array();
        Ylm.setupYlmArrays(c, l, m, vertices, normals, colors, indices);
        
        // Setup buffers
        glPainter.clearObjectList();
        glPainter.setupObject(vertices, normals, colors, indices, 0, true);
        glPainter.refresh();
    }
    
    // Window resize
    function resize() {
        glCanvas.width  = container.clientWidth*cWidth;
        glCanvas.height = container.clientWidth*cHeight;
        
        glPainter.refresh();
    }
};

// Create (linear combination of) spherical harmonics and setup buffers, c, l, m are arrays.
Ylm.setupYlmArrays = function(c, l, m, vertices, normals, colors, indices) {
    var latN = 100;
    var lonN = 100;
    
    var n = c.length;
    
    // Normalize coefficient list
    var norm = 0;
    for (var i=0; i<n; i++)
        norm = norm + c[i].multiply(c[i].conjugate()).re;
    norm = 1/Math.sqrt(norm);
    for (var i=0; i<n; i++)
        c[i] = c[i].multiply(new Complex(norm, 0));
    
    function factorial(n) {
        var result = 1;
        for (var i=2; i<=n; i++)
            result *= i;
        return result;
    }
    var fact = new Array();
    for (var i=0; i<n; i++) {
        fact[i] = Math.sqrt((2*l[i]+1)/(4*Math.PI) * factorial(l[i]-Math.abs(m[i])) / factorial(l[i]+Math.abs(m[i])));
    }
    
    // vertices and colors
    for (var i=0; i<=latN; i++) {
        var theta = i / latN * Math.PI;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var j=0; j<=lonN; j++) {
            var phi = j / lonN * 2 * Math.PI;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var Plm = new Array();
            for (var k=0; k<n; k++) {
                Plm[k] = Ylm.lgndr(l[k], Math.abs(m[k]), cosTheta);
                if (m[k] < 0)
                    Plm[k] = Math.pow(-1, -m[k]) * Plm[k];
            }
            
            var Ysum = new Complex(0, 0);
            for (var k=0; k<n; k++) {
                Ysum = Ysum.add(c[k].multiply((new Complex(fact[k]*Plm[k]*Math.cos(m[k]*phi), fact[k]*Plm[k]*Math.sin(m[k]*phi)))));
            }
            var r = 12 * Math.sqrt(Ysum.multiply(Ysum.conjugate()).re);
            
            var x = r*cosPhi*sinTheta;
            var y = r*sinPhi*sinTheta;
            var z = r*cosTheta;
            
            vertices.push(x);
            vertices.push(y);
            vertices.push(z);
            
            var phase = Ysum.phase();
            if (phase>=0 && phase<Math.PI/3) {
                var rat = phase/(Math.PI/3);
                colors.push(1);
                colors.push(rat);
                colors.push(0);
                colors.push(1);
            } else if (phase>=Math.PI/3 && phase<Math.PI*2/3) {
                var rat = (phase-Math.PI/3)/(Math.PI/3);
                colors.push(1-rat);
                colors.push(1);
                colors.push(0);
                colors.push(1);
            } else if (phase>=Math.PI*2/3 && phase<Math.PI) {
                var rat = (phase-Math.PI*2/3)/(Math.PI/3);
                colors.push(0);
                colors.push(1);
                colors.push(rat);
                colors.push(1);
            } else if (phase>=Math.PI && phase<Math.PI*4/3) {
                var rat = (phase-Math.PI)/(Math.PI/3);
                colors.push(0);
                colors.push(1-rat);
                colors.push(1);
                colors.push(1);
            } else if (phase>=Math.PI*4/3 && phase<Math.PI*5/3) {
                var rat = (phase-Math.PI*4/3)/(Math.PI/3);
                colors.push(rat);
                colors.push(0);
                colors.push(1);
                colors.push(1);
            } else {
                var rat = (phase-Math.PI*5/3)/(Math.PI/3);
                colors.push(1);
                colors.push(0);
                colors.push(1-rat);
                colors.push(1);
            }
        }
    }
    
    // normals
    for (var j=0; j<=lonN; j++) { // north pole
        normals.push(0);
        normals.push(0);
        normals.push(0);
    }
    for (var i=1; i<latN; i++) { // in between
        var theta    = i / latN * Math.PI;
        var dTheta   = 1 / latN * Math.PI;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var j=0; j<=lonN; j++) {
            var phi    = j / lonN * 2 * Math.PI;
            var dPhi   = 1 / lonN * 2 * Math.PI;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var me    = 3*(i*(lonN+1)+j);
            var up    = 3*((i-1)*(lonN+1)+j);
            var down  = 3*((i+1)*(lonN+1)+j);
            var left  = j==0 ? 3*(i*(lonN+1)+lonN-1) : 3*(i*(lonN+1)+j-1);
            var right = j==lonN ? 3*(i*(lonN+1)+1) : 3*(i*(lonN+1)+j+1);
            
            var Yme    = vertices[me]*vertices[me] + vertices[me+1]*vertices[me+1] + vertices[me+2]*vertices[me+2];
            var Yup    = vertices[up]*vertices[up] + vertices[up+1]*vertices[up+1] + vertices[up+2]*vertices[up+2];
            var Ydown  = vertices[down]*vertices[down] + vertices[down+1]*vertices[down+1] + vertices[down+2]*vertices[down+2];
            var Yleft  = vertices[left]*vertices[left] + vertices[left+1]*vertices[left+1] + vertices[left+2]*vertices[left+2];
            var Yright = vertices[right]*vertices[right] + vertices[right+1]*vertices[right+1] + vertices[right+2]*vertices[right+2];
            
            var rCmpnt     = -1/Yme;
            var thetaCmpnt = 1/(Yme*Yme) * (Ydown-Yup)/(2*dTheta);
            var phiCmpnt   = 1/(Yme*Yme*sinTheta) * (Yright-Yleft)/(2*dPhi);
            
            var xCmpnt = rCmpnt*sinTheta*cosPhi + thetaCmpnt*cosTheta*cosPhi - phiCmpnt*sinPhi;
            var yCmpnt = rCmpnt*sinTheta*sinPhi + thetaCmpnt*cosTheta*sinPhi + phiCmpnt*cosPhi;
            var zCmpnt = rCmpnt*cosTheta - thetaCmpnt*sinTheta;
            
            if (Math.abs(Yme) < 1e-8) { // avoid division by zero
                normals.push(0);
                normals.push(0);
                normals.push(1);
            } else {
                normals.push(-xCmpnt);
                normals.push(-yCmpnt);
                normals.push(-zCmpnt);
            }
        }
    }
    for (var j=0; j<=lonN; j++) { // south pole
        normals.push(0);
        normals.push(0);
        normals.push(0);
    }
    
    // Replacing north pole and south pole by taking average from neighbors
    var northNormal = [0, 0, 0];
    var southNormal = [0, 0, 0];
    for (var j=0; j<lonN; j++) {
        for (var k=0; k<3; k++) {
            northNormal[k] = northNormal[k] + normals[3*(1*(lonN+1)+j)+k];
            southNormal[k] = southNormal[k] + normals[3*((latN-1)*(lonN+1)+j)+k];
        }
    }
    for (var k=0; k<3; k++) {
        northNormal[k] = northNormal[k] / lonN;
        southNormal[k] = southNormal[k] / lonN;
    }
    for (var j=0; j<=lonN; j++) {
        normals[3*(0*(lonN+1)+j)]      = northNormal[0];
        normals[3*(0*(lonN+1)+j)+1]    = northNormal[1];
        normals[3*(0*(lonN+1)+j)+2]    = northNormal[2];
        normals[3*(latN*(lonN+1)+j)]   = southNormal[0];
        normals[3*(latN*(lonN+1)+j)+1] = southNormal[1];
        normals[3*(latN*(lonN+1)+j)+2] = southNormal[2];
    }
    
    // indices
    for (var i=0; i<latN; i++) {
        for (var j=0; j<lonN; j++) {
            var first  = i*(lonN + 1) + j;
            var second = first + lonN + 1;
            indices.push(first);
            indices.push(second);
            indices.push(first + 1);
            indices.push(second);
            indices.push(second + 1);
            indices.push(first + 1);
        }
    }
};

// Legendre polynomial Plm(x)
Ylm.lgndr = function(l, m, x) {
    if (m<0 || m>l || Math.abs(x)>1.0) {
        alert("Invalid arguments for Plm.");
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
            var Plm;
            for (var ll=m+2; ll<=l; ll++) {
                Plm = (x*(2*ll-1)*Pmp1m - (ll+m-1)*Pmm) / (ll-m);
                Pmm = Pmp1m;
                Pmp1m = Plm;
            }
            return Plm;
        }
    }
};
