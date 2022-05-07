/*
 * SpecRelat.js
 * Visualization of special relativity
 * Need to include WebGLSetup.js, glMatrix.js
 */

var SpecRelat = new Object();

window.addEventListener("load", function() {SpecRelat.loadHandler();}, false);
SpecRelat.loadHandler = function() {
    var specrelatDivs = document.getElementsByClassName("specrelat");
    for (var i=0; i<specrelatDivs.length; i++) {
        SpecRelat.setupSpecRelat(specrelatDivs[i]);
    }
};

// Special relativity setup
SpecRelat.setupSpecRelat = function(container) {
    // Add HTML elements
    var html = "<canvas></canvas><br />";
    html += "<div></div>";
    container.innerHTML = html;
    
    // Get HTML elements
    var glCanvas = container.getElementsByTagName("canvas")[0];
    var vDiv = container.getElementsByTagName("div")[0];
    
    vDiv.style.position = "absolute";
    vDiv.style.top      = glCanvas.getBoundingClientRect().top+50+"px";
    vDiv.style.left     = glCanvas.getBoundingClientRect().right+150+"px";
    vDiv.style.color    = "blue";
    
    var gl = glCanvas.getContext("experimental-webgl", {preserveDrawingBuffer:true});
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    // Setup shader program
    var shaderProgram = gl.createProgram();
    WebGLSetup.setupShaders(gl, shaderProgram);
    
    // Grid vertices, normals, colors, indices
    var gridN      = 50;
    var gridUnit   = 1;
    var gridHeight = -1.5;
    
    var gridVertices = new Float64Array(3*4*gridN);
    for (var i=0; i<gridN; i++) {
        gridVertices[3*i]   = gridUnit*(-0.5*(gridN-1)+i%gridN);
        gridVertices[3*i+1] = gridUnit*(-0.5*(gridN-1));
        gridVertices[3*i+2] = gridHeight;
    }
    for (var i=gridN; i<2*gridN; i++) {
        gridVertices[3*i]   = gridUnit*(-0.5*(gridN-1)+i%gridN);
        gridVertices[3*i+1] = gridUnit*(0.5*(gridN-1));
        gridVertices[3*i+2] = gridHeight;
    }
    for (var i=2*gridN; i<3*gridN; i++) {
        gridVertices[3*i]   = gridUnit*(-0.5*(gridN-1));
        gridVertices[3*i+1] = gridUnit*(-0.5*(gridN-1)+i%gridN);
        gridVertices[3*i+2] = gridHeight;
    }
    for (var i=3*gridN; i<4*gridN; i++) {
        gridVertices[3*i]   = gridUnit*(0.5*(gridN-1));
        gridVertices[3*i+1] = gridUnit*(-0.5*(gridN-1)+i%gridN);
        gridVertices[3*i+2] = gridHeight;
    }
    
    var gridNormals = new Float64Array(3*4*gridN);
    for (var i=0; i<4*gridN; i++) {
        gridNormals[3*i]   = 0.0;
        gridNormals[3*i+1] = 0.0;
        gridNormals[3*i+2] = 1.0;
    }
    
    var gridColors = new Float64Array(4*4*gridN);
    for (var i=0; i<4*gridN; i++) {
        gridColors[4*i]   = 0.6;
        gridColors[4*i+1] = 0.6;
        gridColors[4*i+2] = 0.6;
        gridColors[4*i+3] = 1.0;
    }
    
    var gridIndices = new Float64Array(2*2*gridN);
    for (var i=0; i<gridN; i++) {
        gridIndices[2*i]   = i;
        gridIndices[2*i+1] = i+gridN;
    }
    for (var i=gridN; i<2*gridN; i++) {
        gridIndices[2*i]   = gridN+i;
        gridIndices[2*i+1] = gridN+i+gridN;
    }
    
    // Setup grid buffers
    var gridVertexBuffer = gl.createBuffer();
    var gridNormalBuffer = gl.createBuffer();
    var gridColorBuffer  = gl.createBuffer();
    var gridIndexBuffer  = gl.createBuffer();
    WebGLSetup.setupBuffers(gl, gridVertices, gridNormals, gridColors, gridIndices, gridVertexBuffer, gridNormalBuffer, gridColorBuffer, gridIndexBuffer);
    
    // Spheres
    var objList = new Array();
    objList.push(new Sphere(gl, [10, 10, gridHeight], 1.5, 12, 12, [1, 0, 0]));
    objList.push(new Sphere(gl, [-10, 10, gridHeight], 1.5, 12, 12, [1, 1, 0]));
    objList.push(new Sphere(gl, [-10, -10, gridHeight], 1.5, 12, 12, [0, 1, 0]));
    objList.push(new Sphere(gl, [10, -10, gridHeight], 1.5, 12, 12, [0, 0, 1]));
    
    //Setup light
    var lightDirection = [0.0, 1.0, 2.0];
    var lightAmbient   = [0.3, 0.3, 0.3];
    var lightDiffuse   = [0.6, 0.6, 0.6];
    var lightSpecular  = [0.8, 0.8, 0.8];
    var shininess      = 100.0;
    WebGLSetup.setupLight(gl, shaderProgram, true, lightDirection, lightAmbient, lightDiffuse, lightSpecular, shininess);
    
    // Transformations
    var transMatrix = mat4.create();
    var rotatMatrix = mat4.create();
    
    var theta = 1.5;
    var thetaRate = 0;
    
    var phi = 0;
    var phiRate = 0;
    
    var xPos = 0;
    var yPos = -0.5*gridN*gridUnit;
    var vVer = 0.0;
    var vHor = 0.0;
    
    var pressedKeys = new Array();
    
    dt = 30;
    function animate() {
        var vSquare = vVer*vVer+vHor*vHor;
        if (pressedKeys[87] || pressedKeys[38]) { // W or up-arrow
            if (vVer<0) {
                vVer += 0.05;
            } else if (vSquare < 0.99*0.99) {
                vVer += 0.01;
            }
        } else if (pressedKeys[83] || pressedKeys[40]) { // S or down-arrow
            if (vVer>0) {
                vVer -= 0.05;
            } else if (vSquare < 0.99*0.99) {
                vVer -= 0.01;
            }
        } else {
            if (Math.abs(vVer)<0.01) {
                vVer = 0.00;
            } else if (vVer>0) {
                vVer -= 0.01;
            } else if (vVer<0) {
                vVer += 0.01;
            }
        }
        
        if (pressedKeys[65] || pressedKeys[37]) { // A or left-arrow
            if (vHor>0) {
                vHor -= 0.05;
            } else if (vSquare < 0.99*0.99) {
                vHor -= 0.01;
            }
        } else if (pressedKeys[68] || pressedKeys[39]) { // D or right-arrow
            if (vHor<0) {
                vHor += 0.05;
            } else if (vSquare < 0.99*0.99) {
                vHor += 0.01;
            }
        } else {
            if (Math.abs(vHor)<0.01) {
                vHor = 0.00;
            } else if (vHor>0) {
                vHor -= 0.01;
            } else if (vHor<0) {
                vHor += 0.01;
            }
        }
        
        if (pressedKeys[33]) { // page-up
            thetaRate = 0.001;
        } else if (pressedKeys[34]) { // page-down
            thetaRate = -0.001;
        } else {
            thetaRate = 0;
        }
        if (pressedKeys[81]) { // Q
            phiRate = 0.001;
        } else if (pressedKeys[69]) { // E
            phiRate = -0.001;
        } else {
            phiRate = 0;
        }
        
        var vX = Math.sin(-phi)*vVer+Math.cos(-phi)*vHor;
        var vY = Math.cos(-phi)*vVer-Math.sin(-phi)*vHor;
        
        vDiv.innerHTML = "vx = "+vX.toFixed(2)+"<br />vy = "+vY.toFixed(2);
        
        // Transform objects
        for (var i=0; i<objList.length; i++) {
            var objVerticesNew = SpecRelat.lorentz(objList[i].vertices, xPos, yPos, vX, vY);
            gl.bindBuffer(gl.ARRAY_BUFFER, objList[i].vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objVerticesNew), gl.STATIC_DRAW);
        }
        
        // Transform grid
        var gridVerticesNew = SpecRelat.lorentz(gridVertices, xPos, yPos, vX, vY);
        gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVerticesNew), gl.STATIC_DRAW);
        
        xPos += 0.01*vX*dt;
        yPos += 0.01*vY*dt;
        
        theta += thetaRate*dt;
        phi += phiRate*dt;
        
        mat4.identity(transMatrix);
        mat4.identity(rotatMatrix);
        mat4.translate(transMatrix, [-xPos, -yPos, 0]);
        mat4.rotate(rotatMatrix, -theta, [1, 0, 0]);
        mat4.rotate(rotatMatrix, -phi, [0, 0, 1]);
        
        drawScene();
        
        setTimeout(function() {animate();}, dt);
    }
    setTimeout(function() {animate();}, dt);
    
    // Add event listener
    window.addEventListener("resize", resize, false);
    window.addEventListener("keydown", keyDownHandler, false);
    window.addEventListener("keyup", keyUpHandler, false);
    
    // Event handlers
    // Pressed keys
    function keyDownHandler(evt) {
        var key = evt.keyCode;
        if (key==37||key==38||key==39||key==40||key==33||key==34) {
            evt.preventDefault();
        }
        pressedKeys[evt.keyCode] = true;
    }
    function keyUpHandler(evt) {
        pressedKeys[evt.keyCode] = false;
    }
    
    // Window resize
    function resize() {
        // Adjust width and height
        var canvasWidth  = document.getElementById("content").clientWidth*0.80;
        var canvasHeight = document.getElementById("content").clientWidth*0.50;
        
        glCanvas.width  = canvasWidth;
        glCanvas.height = canvasHeight;
        
        gl.viewportWidth  = canvasWidth;
        gl.viewportHeight = canvasHeight;
        
        drawScene();
    }
    resize();
    
    function drawScene() {
        WebGLSetup.setupView(gl, shaderProgram, rotatMatrix, transMatrix);
        gl.uniform1i(shaderProgram.useLightUniform, true);
        for (var i=0; i<objList.length; i++) {
            WebGLSetup.drawFaces(gl, shaderProgram, objList[i].vertexBuffer, objList[i].normalBuffer, objList[i].colorBuffer, objList[i].indexBuffer);
        }
        gl.uniform1i(shaderProgram.useLightUniform, false);
        WebGLSetup.drawLines(gl, shaderProgram, gridVertexBuffer, gridNormalBuffer, gridColorBuffer, gridIndexBuffer);
    }
};

SpecRelat.lorentz = function(vertices0, x0, y0, vx, vy) {
    var n = vertices0.length;
    var vertices = new Float64Array(n);
    
    var gx = Math.sqrt(1-vx*vx);
    var gy = Math.sqrt(1-vy*vy);
    
    for (var i=0; i<4*50; i++) {
        vertices[3*i]   = x0+gx*(vertices0[3*i]-x0);
        vertices[3*i+1] = y0+gy*(vertices0[3*i+1]-y0);
        vertices[3*i+2] = vertices0[3*i+2];
    }
    
    return vertices;
};

// Sphere class
function Sphere(gl, origin, radius, latN, lonN, RGBcolor) {
    this.origin   = origin;
    this.radius   = radius;
    this.latN     = latN;
    this.lonN     = lonN;
    this.RGBcolor = RGBcolor;
    this.vertices = new Array();
    this.normals  = new Array();
    this.colors   = new Array();
    this.indices  = new Array();
    this.vertexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.colorBuffer  = gl.createBuffer();
    this.indexBuffer  = gl.createBuffer();
    
    for (var i=0; i<=this.latN; i++) {
        var theta = i/this.latN*Math.PI;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        
        for (var j=0; j<=this.lonN; j++) {
            var phi = j/this.lonN*2*Math.PI;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            
            var x = this.origin[0]+this.radius*cosPhi*sinTheta;
            var y = this.origin[1]+this.radius*sinPhi*sinTheta;
            var z = this.origin[2]+this.radius*cosTheta;
            
            this.vertices.push(x);
            this.vertices.push(y);
            this.vertices.push(z);
            
            this.normals.push(x-this.origin[0]);
            this.normals.push(y-this.origin[1]);
            this.normals.push(z-this.origin[2]);
        }
    }
    
    for (var i=0; i<=this.latN; i++) {
        for (var j=0; j<=this.lonN; j++) {
            this.colors.push(this.RGBcolor[0]);
            this.colors.push(this.RGBcolor[1]);
            this.colors.push(this.RGBcolor[2]);
            this.colors.push(1.0);
        }
    }
    
    for (var i=0; i<this.latN; i++) {
        for (var j=0; j<this.lonN; j++) {
            var first  = i*(this.lonN+1)+j;
            var second = first+this.lonN+1;
            this.indices.push(first);
            this.indices.push(second);
            this.indices.push(first+1);
            this.indices.push(second);
            this.indices.push(second+1);
            this.indices.push(first+1);
        }
    }
    WebGLSetup.setupBuffers(gl, this.vertices, this.normals, this.colors, this.indices, this.vertexBuffer, this.normalBuffer, this.colorBuffer, this.indexBuffer);
}
