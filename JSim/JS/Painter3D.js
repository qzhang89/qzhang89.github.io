/**
 * @file Painter3D class for plotting 3D graphs on HTML canvas element
 * @author Qian Zhang
 */

/**
 * Creates an instance of Painter3D
 * 
 * @class Painter3D class for plotting 3D graphs on HTML canvas element.
 *        We are aiming at providing super simple and fully functional WebGL interface for 3D data plotting.
 * @param    {DOMElement}   canvas             - HTML canvas element
 * @property {DOMElement}   this.canvas        - HTML canvas element
 * @property {WebGLRenderingContext} this.gl   - canvas webgl context
 * @property {Array.Number} this.bkgdColor     - graph background color (default [0.0,0.0,0.0])
 * @property {Boolean}      this.axisOn        - axis on property (true or false) (default false)
 * @property {Boolean}      this.gridOn        - grid on property (true or false) (default false)
 * @property {Boolean}      this.meshOn        - mesh on property (true or false) (default false)
 * @property {Boolean}      this.lightOn       - light on property (true or false) (default false)
 * @property {Boolean}      this.xSpinOn       - x-spin animation on property (true or false) (default false)
 * @property {Boolean}      this.ySpinOn       - y-spin animation on property (true or false) (default false)
 * @property {Boolean}      this.zSpinOn       - z-spin animation on property (true or false) (default false)
 * @property {Array.Number} this.transMatrix   - translation matrix (default translate [0.0,0.0,-25.0])
 * @property {Array.Number} this.rotatMatrix   - rotation matrix (default rotate [-1.2,0.0,-0.785])
 * @property {Object}       this.axisLineObj   - axis arrow line object
 * @property {Object}       this.axisHeadObj   - axis arrow head object
 * @property {Object}       this.gridObj       - grid object
 * @property {Object}       this.meshObj       - mesh object
 * @property {Array.Object} this.objList       - list of objects
 * @property {WebGLProgram} this.shaderProgram - webgl shader program
 * @example
 * var glCanvas = document.getElementsByTagName("canvas")[0]; // Get a canvas element from HTML
 * var glPainter = new Painter3D(glCanvas);                   // Create a Painter3D object
 */
function Painter3D(canvas) {
    // Attributes
    this.canvas = canvas;
    this.gl     = this.canvas.getContext("webgl", {preserveDrawingBuffer:true}) ||
                  this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer:true});
    if (!this.gl) {
        console.log("Your browser does not support WebGL.");
        return -1;
    }
    var gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    
    // Default width and height
    gl.viewportWidth  = 300;
    gl.viewportHeight = 150;
    
    this.bkgdColor = [0.0, 0.0, 0.0];
    this.pointSize = 2;
    
    this.axisOn  = false;
    this.gridOn  = false;
    this.meshOn  = false;
    this.lightOn = false;
    this.xSpinOn = false;
    this.ySpinOn = false;
    this.zSpinOn = false;
    
    // Transformation matrices
    this.transMatrix = mat4.create();
    this.rotatMatrix = mat4.create();
    this.setMatrices([0.0,0.0,-27.0], [-1.2,0.0,Math.PI*5/4]);
    
    // Axis object
    this.axisLineObj = {};
    this.axisHeadObj = {};
    
    // Grid object
    this.gridObj = {};
    
    // Mesh-grid object
    this.meshObj = {};
    
    // Object list
    this.objList = [];
    
    // Shader program
    this.shaderProgram = gl.createProgram();
    var shaderProgram = this.shaderProgram;
    
    var vSource = "attribute vec3 aVertexPosition;" +
                  "attribute vec3 aVertexNormal;" +
                  "attribute vec4 aVertexColor;" +
                  "uniform mat4 uMVMatrix;" +
                  "uniform mat4 uPMatrix;" +
                  "uniform mat4 uNMatrix;" +
                  "uniform bool uUseLight;" +
                  "uniform float uPointSize;" +
                  "varying vec3 vNormal;" +
                  "varying vec3 vEyeVec;" +
                  "varying vec4 vColor;" +
                  "void main() {" +
                      "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);" +
                      "gl_PointSize = uPointSize;" +
                      "if (uUseLight) {" +
                          "vNormal = vec3(uNMatrix*vec4(aVertexNormal, 1.0));" +
                          "vEyeVec = -vec3((uMVMatrix*vec4(aVertexPosition, 1.0)).xyz);" +
                      "}" +
                      "vColor = aVertexColor;" +
                  "}";
    
    var fSource = "precision mediump float;" +
                  "uniform vec3 uLightDirection;" +
                  "uniform vec3 uLightAmbient;" +
                  "uniform vec3 uLightDiffuse;" +
                  "uniform vec3 uLightSpecular;" +
                  "uniform float uShininess;" +
                  "uniform bool uUseLight;" +
                  "varying vec3 vNormal;" +
                  "varying vec3 vEyeVec;" +
                  "varying vec4 vColor;" +
                  "void main() {" +
                      "vec3 lightWeight;" +
                      "if (!uUseLight) {" +
                          "lightWeight = vec3(1.0, 1.0, 1.0);" +
                      "} else {" +
                          "vec3 L = normalize(uLightDirection);" +
                          "vec3 N = normalize(vNormal);" +
                          "vec3 R = reflect(-L, N);" +
                          "vec3 V = normalize(vEyeVec);" +
                          "float diffuseWeight = max(dot(L, N), 0.0);" +
                          "float specularWeight = pow(max(dot(R, V), 0.0), uShininess);" +
                          "lightWeight = uLightAmbient + uLightDiffuse*diffuseWeight + uLightSpecular*specularWeight;" +
                      "}" +
                      "gl_FragColor = vec4(vColor.rgb*lightWeight, vColor.a);" +
                  "}";
    
    // Compile shader programs
    var vShader = gl.createShader(gl.VERTEX_SHADER);
    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vShader, vSource);
    gl.shaderSource(fShader, fSource);
    gl.compileShader(vShader);
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
        console.log("Compile " + gl.getShaderInfoLog(vShader));
        return -1;
    }
    gl.compileShader(fShader);
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
        console.log("Compile " + gl.getShaderInfoLog(fShader));
        return -1;
    }
    
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        console.log("Could not initialize shaders");
        return -1;
    }
    gl.useProgram(shaderProgram);
    
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.useLightUniform = gl.getUniformLocation(shaderProgram, "uUseLight");
    shaderProgram.pointSizeUniform = gl.getUniformLocation(shaderProgram, "uPointSize");
    shaderProgram.lightDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightDirection");
    shaderProgram.lightAmbientUniform = gl.getUniformLocation(shaderProgram, "uLightAmbient");
    shaderProgram.lightDiffuseUniform = gl.getUniformLocation(shaderProgram, "uLightDiffuse");
    shaderProgram.lightSpecularUniform = gl.getUniformLocation(shaderProgram, "uLightSpecular");
    shaderProgram.shininessUniform = gl.getUniformLocation(shaderProgram, "uShininess");
    
    // Default axis
    this.setupAxis(14, 1);
    
    // Default grid
    this.setupGrid(1, 12, [0.5, 0.5, 0.5]);
    
    // Default mesh
    var x = [];
    var y = [];
    for (var i=0; i<=48; i++) {
        x[i] = (i-24)/2;
        y[i] = (i-24)/2;
    }
    this.setupMesh(x, y, 0, true);
    
    // Default light
    this.setupLight([0.0,1.0,2.0], [0.3,0.3,0.3], [0.6,0.6,0.6], [0.8,0.8,0.8], 100.0);
    
    // Make the canvas focusable
    this.canvas.setAttribute("tabindex", "0");
    
    // Control message
    this.canvas.title = "1. Click to focus on the graph\n" +
                        "2. Use mouse wheel to zoom\n" +
                        "3. Drag with mouse to rotate graphics\n" +
                        "4. Press \"Shift\" and drag to pan graphics\n" +
                        "5. Press \"A\" to toggle axis\n" +
                        "6. Press \"G\" to toggle grid\n" +
                        "7. Press \"M\" to toggle mesh\n" +
                        "8. Press \"L\" to toggle light\n" +
                        "9. Press \"V\" to toggle view\n" +
                        "10. Press \"X\" to toggle x-spin\n" +
                        "11. Press \"Y\" to toggle y-spin\n" +
                        "12. Press \"Z\" to toggle z-spin";
    
    // Setup perspective
    this.setupView();
    
    // Add event listeners
    // Click to focus the canvas
    var isFocus = false;
    function addClickHandler(canvas, painter) {
        canvas.addEventListener("click", function(evt) {
            canvas.focus();
            isFocus = true;
        }, false);
        canvas.addEventListener("touchend", function(evt) {
            canvas.focus();
            isFocus = true;
        }, false);
        canvas.addEventListener("blur", function(evt) {
            isFocus = false;
        }, false);
    }
    addClickHandler(this.canvas, this);
    
    // Rotate or Pan the plot
    function addRotPanHandler(canvas, painter) {
        var oldX = 0, oldY = 0;
        var newX = 0, newY = 0;
        var shiftIsDown = false;
        var mouseIsDown = false;
        canvas.addEventListener("keydown", function(evt) {
            if (evt.keyCode==16) {
                shiftIsDown = true;
            }
        }, false);
        canvas.addEventListener("keyup", function(evt) {
            if (evt.keyCode==16) {
                shiftIsDown = false;
            }
        }, false);
        canvas.addEventListener("mousedown", function(evt) {
            evt.preventDefault();
            mouseIsDown = true;
            oldX = evt.clientX;
            oldY = evt.clientY;
        }, false);
        canvas.addEventListener("mouseup", function(evt) {
            mouseIsDown = false;
        }, false);
        canvas.addEventListener("mouseout", function(evt) {
            mouseIsDown = false;
        }, false);
        canvas.addEventListener("mousemove", function(evt) {
            if (isFocus&&mouseIsDown) {
                newX = evt.clientX;
                newY = evt.clientY;
                var dX = newX - oldX;
                var dY = newY - oldY;
                if (shiftIsDown) {
                    // Pan
                    var scale = painter.transMatrix[14]*0.0015;
                    var newTransMatrix = mat4.create();
                    mat4.identity(newTransMatrix);
                    mat4.translate(newTransMatrix, [-dX*scale, dY*scale, 0]);
                    mat4.multiply(newTransMatrix, painter.transMatrix, painter.transMatrix);
                } else {
                    // Rotate
                    var newRotatMatrix = mat4.create();
                    mat4.identity(newRotatMatrix);
                    mat4.rotate(newRotatMatrix, dX/200, [0, 1, 0]);
                    mat4.rotate(newRotatMatrix, dY/200, [1, 0, 0]);
                    mat4.multiply(newRotatMatrix, painter.rotatMatrix, painter.rotatMatrix);
                }
                oldX = newX;
                oldY = newY;
                painter.refresh();
            }
        }, false);
        canvas.addEventListener("touchstart", function(evt) {
            var touchObj = evt.changedTouches[0]; // first finger
            oldX = parseInt(touchObj.clientX);
            oldY = parseInt(touchObj.clientY);
        }, false);
        canvas.addEventListener("touchmove", function(evt) {
            if (isFocus) {
                evt.preventDefault();
                var touchObj = evt.changedTouches[0]; // first finger
                newX = parseInt(touchObj.clientX);
                newY = parseInt(touchObj.clientY);
                var dX = newX - oldX;
                var dY = newY - oldY;
                
                // Rotate
                var newRotatMatrix = mat4.create();
                mat4.identity(newRotatMatrix);
                mat4.rotate(newRotatMatrix, dX/200, [0, 1, 0]);
                mat4.rotate(newRotatMatrix, dY/200, [1, 0, 0]);
                mat4.multiply(newRotatMatrix, painter.rotatMatrix, painter.rotatMatrix);
                
                oldX = newX;
                oldY = newY;
                painter.refresh();
            }
        }, false);
    }
    addRotPanHandler(this.canvas, this);
    
    // Wheel to zoom the plot
    function addZoomHandler(canvas, painter) {
        function mouseWheelHandler(evt) {
            if (isFocus) {
                evt.preventDefault();
                var scale = painter.transMatrix[14]*0.075;
                var ds = (evt.wheelDelta>0 || evt.detail<0) ? -scale : scale;
                if ((ds>0 && ds>0.04) || (ds<0 && ds>-6)) {
                    var newTransMatrix = mat4.create();
                    mat4.identity(newTransMatrix);
                    mat4.translate(newTransMatrix, [0, 0, ds]);
                    mat4.multiply(newTransMatrix, painter.transMatrix, painter.transMatrix);
                    painter.refresh();
                }
            }
        }
        canvas.addEventListener("mousewheel", mouseWheelHandler, false);
        canvas.addEventListener("DOMMouseScroll", mouseWheelHandler, false);
    }
    addZoomHandler(this.canvas, this);
    
    // Toggle objects
    var vCounter = 0;
    function addKeyDownHandler(canvas, painter) {
        canvas.addEventListener("keydown", function(evt) {
            if (evt.keyCode == 65) {
                // Toggle axis
                painter.setAxisOn(!painter.axisOn);
                painter.refresh();
            }
            if (evt.keyCode == 71) {
                // Toggle grid
                painter.setGridOn(!painter.gridOn);
                painter.refresh();
            }
            if (evt.keyCode == 77) {
                // Toggle mesh
                painter.meshObj.type = (painter.meshObj.type+1)%4;
                var type = painter.meshObj.type;
                if (type == 3) {
                    painter.setMeshOn(false);
                } else {
                    painter.setMeshOn(true);
                }
                var gl = painter.gl;
                var nx = painter.meshObj.x.length;
                var ny = painter.meshObj.y.length;
                
                var indices = null;
                if (type == 0) {
                    indices = new Uint16Array(6*nx*ny);
                    for (var j=0; j<ny-1; j++) {
                        for (var i=0; i<nx-1; i++) {
                            indices[6*(j*nx+i)]   = j*nx+i;
                            indices[6*(j*nx+i)+1] = j*nx+i+1;
                            indices[6*(j*nx+i)+2] = j*nx+i+1+nx;
                            
                            indices[6*(j*nx+i)+3] = j*nx+i;
                            indices[6*(j*nx+i)+4] = j*nx+i+1+nx;
                            indices[6*(j*nx+i)+5] = j*nx+i+nx;
                        }
                    }
                } else if (type == 1) {
                    indices = new Uint16Array(4*nx*ny);
                    for (var j=0; j<ny; j++) {
                        for (var i=0; i<nx-1; i++) {
                            indices[4*(j*nx+i)]   = j*nx+i;
                            indices[4*(j*nx+i)+1] = j*nx+i+1;
                        }
                    }
                    for (var j=0; j<ny-1; j++) {
                        for (var i=0; i<nx; i++) {
                            indices[4*(j*nx+i)+2] = j*nx+i;
                            indices[4*(j*nx+i)+3] = j*nx+i+nx;
                        }
                    }
                }
                // Re-Setup mesh object index buffer
                if (type == 0 || type == 1) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, painter.meshObj.indexBuffer);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
                    painter.meshObj.indexBuffer.itemSize = 1;
                    painter.meshObj.indexBuffer.numItems = indices.length;
                }
                painter.refresh();
            }
            if (evt.keyCode == 76) {
                // Toggle light
                painter.setLightOn(!painter.lightOn);
                painter.refresh();
            }
            if (evt.keyCode == 86) {
                // Toggle view
                mat4.identity(painter.transMatrix);
                mat4.identity(painter.rotatMatrix);
                mat4.translate(painter.transMatrix, [0.0, 0.0, -25.0]);
                if (vCounter == 1) {
                    mat4.rotate(painter.rotatMatrix, -Math.PI/2, [1, 0, 0]);
                } else if (vCounter == 2) {
                    mat4.rotate(painter.rotatMatrix, -Math.PI/2, [1, 0, 0]);
                    mat4.rotate(painter.rotatMatrix, -Math.PI/2, [0, 0, 1]);
                }
                painter.refresh();
                vCounter = (vCounter+1)%3;
            }
            if (evt.keyCode==88||evt.keyCode==89||evt.keyCode==90) {
                // Toggle spin animation
                if (evt.keyCode==88) {
                    painter.setXSpinOn(!painter.xSpinOn);
                    painter.setYSpinOn(false);
                    painter.setZSpinOn(false);
                } else if (evt.keyCode==89) {
                    painter.setXSpinOn(false);
                    painter.setYSpinOn(!painter.ySpinOn);
                    painter.setZSpinOn(false);
                } else {
                    painter.setXSpinOn(false);
                    painter.setYSpinOn(false);
                    painter.setZSpinOn(!painter.zSpinOn);
                }
            }
        }, false);
    }
    addKeyDownHandler(this.canvas, this);
}

/**
 * Set background color
 * 
 * @method
 * @param {Array.Number} bkgdColor - background color [r, g, b] (e.g. [1.0, 0.0, 0.0] is red)
 * @example
 * glPainter.setBkgdColor([1.0, 1.0, 1.0]); // Set backgournd color to white
 * glPainter.refresh();                     // Refresh
 */
Painter3D.prototype.setBkgdColor = function(bkgdColor) {
    this.bkgdColor = bkgdColor;
};

/**
 * Turn on or turn off axis
 * 
 * @method
 * @param {Boolean} axisOn - axis on property (true or false)
 * @example
 * glPainter.setAxisOn(true); // Turn on axis
 * glPainter.refresh();       // Refresh
 */
Painter3D.prototype.setAxisOn = function(axisOn) {
    this.axisOn = axisOn;
};

/**
 * Turn on or turn off grid
 * 
 * @method
 * @param {Boolean} gridOn - grid on property (true or false)
 * @example
 * glPainter.setGridOn(true); // Turn on grid
 * glPainter.refresh();       // Refresh
 */
Painter3D.prototype.setGridOn = function(gridOn) {
    this.gridOn = gridOn;
};

/**
 * Turn on or turn off mesh
 * 
 * @method
 * @param {Boolean} meshOn - mesh on property (true or false)
 * @example
 * glPainter.setMeshOn(true); // Turn on mesh
 * glPainter.refresh();       // Refresh
 */
Painter3D.prototype.setMeshOn = function(meshOn) {
    this.meshOn = meshOn;
};

/**
 * Turn on or turn off light
 * 
 * @method
 * @param {Boolean} lightOn - light on property (true or false)
 * @example
 * glPainter.setLightOn(true); // Turn on light
 * glPainter.refresh();        // Refresh
 */
Painter3D.prototype.setLightOn = function(lightOn) {
    this.lightOn = lightOn;
};

/**
 * Turn on or turn off x-spin animation
 * 
 * @method
 * @param {Boolean} xSpinOn - x-spin animation on property (true or false)
 * @example
 * glPainter.setXSpinOn(true);
 */
Painter3D.prototype.setXSpinOn = function(xSpinOn) {
    if (this.xSpinOn != xSpinOn) {
        this.xSpinOn = xSpinOn;
        function spin(painter) {
            function anim() {
                if (painter.xSpinOn) {
                    mat4.rotate(painter.rotatMatrix, 0.005, [1, 0, 0]);
                    painter.refresh();
                    setTimeout(function() {anim();}, 25);
                } else {
                    return;
                }
            }
            setTimeout(function() {anim();}, 25);
        }
        spin(this);
    }
};

/**
 * Turn on or turn off y-spin animation
 * 
 * @method
 * @param {Boolean} ySpinOn - y-spin animation on property (true or false)
 * @example
 * glPainter.setYSpinOn(true);
 */
Painter3D.prototype.setYSpinOn = function(ySpinOn) {
    if (this.ySpinOn != ySpinOn) {
        this.ySpinOn = ySpinOn;
        function spin(painter) {
            function anim() {
                if (painter.ySpinOn) {
                    mat4.rotate(painter.rotatMatrix, 0.005, [0, 1, 0]);
                    painter.refresh();
                    setTimeout(function() {anim();}, 25);
                } else {
                    return;
                }
            }
            setTimeout(function() {anim();}, 25);
        }
        spin(this);
    }
};

/**
 * Turn on or turn off z-spin animation
 * 
 * @method
 * @param {Boolean} zSpinOn - z-spin animation on property (true or false)
 * @example
 * glPainter.setZSpinOn(true);
 */
Painter3D.prototype.setZSpinOn = function(zSpinOn) {
    if (this.zSpinOn != zSpinOn) {
        this.zSpinOn = zSpinOn;
        function spin(painter) {
            function anim() {
                if (painter.zSpinOn) {
                    mat4.rotate(painter.rotatMatrix, 0.005, [0, 0, 1]);
                    painter.refresh();
                    setTimeout(function() {anim();}, 25);
                } else {
                    return;
                }
            }
            setTimeout(function() {anim();}, 25);
        }
        spin(this);
    }
};

/**
 * Set point size
 * 
 * @method
 * @param {Number} size - point size
 * @example
 * glPainter.setPointSize(5); // Set point size
 * glPainter.refresh();       // Refresh
 */
Painter3D.prototype.setPointSize = function(size) {
    this.pointSize = size;
};

/**
 * Set transformation matrices
 * 
 * @method
 * @param {Array.Number} trans - translation operation [x, y, z]
 * @param {Array.Number} rotat - rotation operation [Rx, Ry, Rz]
 * @example
 * glPainter.setMatrices([0,0,-15], [-1.1,0,0]) // Specify perspective
 * glPainter.refresh();                         // Refresh
 */
Painter3D.prototype.setMatrices = function(trans, rotat) {
    mat4.identity(this.transMatrix);
    mat4.identity(this.rotatMatrix);
    mat4.translate(this.transMatrix, trans);
    mat4.rotate(this.rotatMatrix, rotat[0], [1, 0, 0]);
    mat4.rotate(this.rotatMatrix, rotat[1], [0, 1, 0]);
    mat4.rotate(this.rotatMatrix, rotat[2], [0, 0, 1]);
};

/**
 * Setup axis object
 * 
 * @method
 * @param {Number}       length   - length of axis (in unit of 1)
 * @param {Number}       headSize - size of the arrow head (in unit of 1)
 * @param {Array.Number} [origin] - origin of axis (default [0, 0, 0])
 * @example
 * glPainter.setupAxis(20, 2); // Setup axis
 * glPainter.setAxisOn(true);  // Turn on axis
 * glPainter.refresh();        // Refresh
 */
Painter3D.prototype.setupAxis = function(length, headSize, origin) {
    origin = typeof origin === "undefined" ? [0,0,0] : origin;
    
    var gl = this.gl;
    var lineObj = this.axisLineObj;
    var headObj = this.axisHeadObj;
    lineObj.vertexBuffer = gl.createBuffer(); // vertex buffer
    lineObj.normalBuffer = gl.createBuffer(); // normal buffer
    lineObj.colorBuffer  = gl.createBuffer(); // color buffer
    lineObj.indexBuffer  = gl.createBuffer(); // index buffer
    lineObj.type         = 1;                 // object type (0=face, 1=line, 2=point)
    lineObj.lightRespon  = false;             // true or false
    headObj.vertexBuffer = gl.createBuffer(); // vertex buffer
    headObj.normalBuffer = gl.createBuffer(); // normal buffer
    headObj.colorBuffer  = gl.createBuffer(); // color buffer
    headObj.indexBuffer  = gl.createBuffer(); // index buffer
    headObj.type         = 0;                 // object type (0=face, 1=line, 2=point)
    headObj.lightRespon  = false;             // true or false
    
    var lineVertices = [];
    var lineColors   = [];
    var lineIndices  = [];
    var headVertices = [];
    var headColors   = [];
    var headIndices  = [];
    
    var x0 = origin[0];
    var y0 = origin[1];
    var z0 = origin[2];
    
    // Axis line
    lineVertices.push(x0-length);lineVertices.push(y0);lineVertices.push(z0);
    lineVertices.push(x0+length);lineVertices.push(y0);lineVertices.push(z0);
    lineVertices.push(x0);lineVertices.push(y0-length);lineVertices.push(z0);
    lineVertices.push(x0);lineVertices.push(y0+length);lineVertices.push(z0);
    lineVertices.push(x0);lineVertices.push(y0);lineVertices.push(z0-length);
    lineVertices.push(x0);lineVertices.push(y0);lineVertices.push(z0+length);
    lineColors.push(1);lineColors.push(0);lineColors.push(0);lineColors.push(1);
    lineColors.push(1);lineColors.push(0);lineColors.push(0);lineColors.push(1);
    lineColors.push(0);lineColors.push(1);lineColors.push(0);lineColors.push(1);
    lineColors.push(0);lineColors.push(1);lineColors.push(0);lineColors.push(1);
    lineColors.push(0);lineColors.push(0);lineColors.push(1);lineColors.push(1);
    lineColors.push(0);lineColors.push(0);lineColors.push(1);lineColors.push(1);
    for (var i=0; i<6; i++) {
        lineIndices.push(i);
    }
    
    // Axis head
    var r = 0.5*headSize;
    var h = headSize;
    var s = 16;
    headVertices.push(x0+length);headVertices.push(y0);headVertices.push(z0);
    for (var i=0; i<s; i++) {
        var theta = 2*Math.PI/s*i;
        headVertices.push(x0+length-h);
        headVertices.push(y0+r*Math.sin(theta));
        headVertices.push(z0+r*Math.cos(theta));
    }
    for (var i=0; i<s+1; i++) {
        headColors.push(1);
        headColors.push(0);
        headColors.push(0);
        headColors.push(1);
    }
    for (var i=0; i<s-1; i++) {
        headIndices.push(i+1);
        headIndices.push(0);
        headIndices.push(i+2);
    }
    headIndices.push(s);
    headIndices.push(0);
    headIndices.push(1);
    headVertices.push(x0);headVertices.push(y0+length);headVertices.push(z0);
    for (var i=0; i<s; i++) {
        var theta = 2*Math.PI/s*i;
        headVertices.push(x0+r*Math.sin(theta));
        headVertices.push(y0+length-h);
        headVertices.push(z0+r*Math.cos(theta));
    }
    for (var i=0; i<s+1; i++) {
        headColors.push(0);
        headColors.push(1);
        headColors.push(0);
        headColors.push(1);
    }
    for (var i=0; i<s-1; i++) {
        headIndices.push(s+1+i+1);
        headIndices.push(s+1);
        headIndices.push(s+1+i+2);
    }
    headIndices.push(s+1+s);
    headIndices.push(s+1);
    headIndices.push(s+1+1);
    headVertices.push(x0);headVertices.push(y0);headVertices.push(z0+length);
    for (var i=0; i<s; i++) {
        var theta = 2*Math.PI/s*i;
        headVertices.push(x0+r*Math.sin(theta));
        headVertices.push(y0+r*Math.cos(theta));
        headVertices.push(z0+length-h);
    }
    for (var i=0; i<s+1; i++) {
        headColors.push(0);
        headColors.push(0);
        headColors.push(1);
        headColors.push(1);
    }
    for (var i=0; i<s-1; i++) {
        headIndices.push(2*s+2+i+1);
        headIndices.push(2*s+2);
        headIndices.push(2*s+2+i+2);
    }
    headIndices.push(2*s+2+s);
    headIndices.push(2*s+2);
    headIndices.push(2*s+2+1);
    
    // Setup line object buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, lineObj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
    lineObj.vertexBuffer.itemSize = 3;
    lineObj.vertexBuffer.numItems = lineVertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, lineObj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
    lineObj.normalBuffer.itemSize = 3;
    lineObj.normalBuffer.numItems = lineVertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, lineObj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.STATIC_DRAW);
    lineObj.colorBuffer.itemSize = 4;
    lineObj.colorBuffer.numItems = lineColors.length/4;
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineObj.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndices), gl.STATIC_DRAW);
    lineObj.indexBuffer.itemSize = 1;
    lineObj.indexBuffer.numItems = lineIndices.length;
    
    // Setup head object buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, headObj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(headVertices), gl.STATIC_DRAW);
    headObj.vertexBuffer.itemSize = 3;
    headObj.vertexBuffer.numItems = headVertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, headObj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(headVertices), gl.STATIC_DRAW);
    headObj.normalBuffer.itemSize = 3;
    headObj.normalBuffer.numItems = headVertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, headObj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(headColors), gl.STATIC_DRAW);
    headObj.colorBuffer.itemSize = 4;
    headObj.colorBuffer.numItems = headColors.length/4;
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, headObj.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(headIndices), gl.STATIC_DRAW);
    headObj.indexBuffer.itemSize = 1;
    headObj.indexBuffer.numItems = headIndices.length;
};

/**
 * Setup grid object (for axis purpose, not to be confused with setupMesh)
 * 
 * @method
 * @param {Number}       unit     - unit of grid
 * @param {Number}       length   - length of grid
 * @param {Array.Number} color    - color of grid [r, g, b]
 * @param {Array.Number} [origin] - origin of grid (default [0, 0, 0])
 * @param {Array.Number} [rotate] - rotation of grid [Rx, Ry, Rz] (default [0, 0, 0])
 * @example
 * glPainter.setupGrid(1, 20, [0.5,0.5,0.5]); // Setup grid
 * glPainter.setGridOn(true);                 // Turn on grid
 * glPainter.refresh();                       // Refresh
 */
Painter3D.prototype.setupGrid = function(unit, length, color, origin, rotate) {
    origin = typeof origin === "undefined" ? [0,0,0] : origin;
    rotate = typeof rotate === "undefined" ? [0,0,0] : rotate;
    
    var gl = this.gl;
    var obj = this.gridObj;
    obj.vertexBuffer = gl.createBuffer(); // vertex buffer
    obj.normalBuffer = gl.createBuffer(); // normal buffer
    obj.colorBuffer  = gl.createBuffer(); // color buffer
    obj.indexBuffer  = gl.createBuffer(); // index buffer
    obj.type         = 1;                 // object type (0=face, 1=line, 2=point)
    obj.lightRespon  = false;             // true or false
    
    var x0 = origin[0];
    var y0 = origin[1];
    var z0 = origin[2];
    
    var vertices = [];
    var colors   = [];
    var indices  = [];
    
    var rotatMatrix = mat4.create();
    mat4.identity(rotatMatrix);
    mat4.rotate(rotatMatrix, rotate[0], [1,0,0]);
    mat4.rotate(rotatMatrix, rotate[1], [0,1,0]);
    mat4.rotate(rotatMatrix, rotate[2], [0,0,1]);
    var v = [];
    for (var i=-length; i<=length; i++) {
        v = [i*unit, -length*unit, 0];
        mat4.multiplyVec3(rotatMatrix, v);
        vertices.push(x0+v[0]);
        vertices.push(y0+v[1]);
        vertices.push(z0+v[2]);
        
        v = [i*unit, length*unit, 0];
        mat4.multiplyVec3(rotatMatrix, v);
        vertices.push(x0+v[0]);
        vertices.push(y0+v[1]);
        vertices.push(z0+v[2]);
    }
    for (var i=-length; i<=length; i++) {
        v = [-length*unit, i*unit, 0];
        mat4.multiplyVec3(rotatMatrix, v);
        vertices.push(x0+v[0]);
        vertices.push(y0+v[1]);
        vertices.push(z0+v[2]);
        
        v = [length*unit, i*unit, 0];
        mat4.multiplyVec3(rotatMatrix, v);
        vertices.push(x0+v[0]);
        vertices.push(y0+v[1]);
        vertices.push(z0+v[2]);
    }
    
    for (var i=0; i<vertices.length/3; i++) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
        colors.push(1.0);
    }
    
    for (var i=0; i<vertices.length/3; i++) {
        indices.push(i);
    }
    
    // Setup grid object buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    obj.vertexBuffer.itemSize = 3;
    obj.vertexBuffer.numItems = vertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    obj.normalBuffer.itemSize = 3;
    obj.normalBuffer.numItems = vertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    obj.colorBuffer.itemSize = 4;
    obj.colorBuffer.numItems = colors.length/4;
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    obj.indexBuffer.itemSize = 1;
    obj.indexBuffer.numItems = indices.length;
};

Painter3D.prototype.setupGridPolar = function(unit, length, sect, color, origin, rotate) {
    origin = typeof origin === "undefined" ? [0,0,0] : origin;
    rotate = typeof rotate === "undefined" ? [0,0,0] : rotate;
    
    var gl = this.gl;
    var obj = this.gridObj;
    obj.vertexBuffer = gl.createBuffer(); // vertex buffer
    obj.normalBuffer = gl.createBuffer(); // normal buffer
    obj.colorBuffer  = gl.createBuffer(); // color buffer
    obj.indexBuffer  = gl.createBuffer(); // index buffer
    obj.type         = 1;                 // object type (0=face, 1=line, 2=point)
    obj.lightRespon  = false;             // true or false
    
    var x0 = origin[0];
    var y0 = origin[1];
    var z0 = origin[2];
    
    var vertices = [];
    var colors   = [];
    var indices  = [];
    
    var rotatMatrix = mat4.create();
    mat4.identity(rotatMatrix);
    mat4.rotate(rotatMatrix, rotate[0], [1,0,0]);
    mat4.rotate(rotatMatrix, rotate[1], [0,1,0]);
    mat4.rotate(rotatMatrix, rotate[2], [0,0,1]);
    var v = [];
    for (var phi=0; phi<=2*Math.PI; phi+=sect) {
        v = [0*unit*Math.cos(phi), 0*unit*Math.sin(phi), 0];
        mat4.multiplyVec3(rotatMatrix, v);
        vertices.push(x0+v[0]);
        vertices.push(y0+v[1]);
        vertices.push(z0+v[2]);
        
        v = [length*unit*Math.cos(phi), length*unit*Math.sin(phi), 0];
        mat4.multiplyVec3(rotatMatrix, v);
        vertices.push(x0+v[0]);
        vertices.push(y0+v[1]);
        vertices.push(z0+v[2]);
    }
    for (var i=0; i<=length; i++) {
        for (var phi=0; phi<=2*Math.PI; phi+=Math.PI/24) {
            v = [i*unit*Math.cos(phi), i*unit*Math.sin(phi), 0];
            mat4.multiplyVec3(rotatMatrix, v);
            vertices.push(x0+v[0]);
            vertices.push(y0+v[1]);
            vertices.push(z0+v[2]);
        }
    }
    
    for (var i=0; i<vertices.length/3; i++) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
        colors.push(1.0);
    }
    
    for (var i=0; i<vertices.length/3-1; i++) {
        indices.push(i);
        indices.push(i+1);
    }
    
    // Setup grid object buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    obj.vertexBuffer.itemSize = 3;
    obj.vertexBuffer.numItems = vertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    obj.normalBuffer.itemSize = 3;
    obj.normalBuffer.numItems = vertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    obj.colorBuffer.itemSize = 4;
    obj.colorBuffer.numItems = colors.length/4;
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    obj.indexBuffer.itemSize = 1;
    obj.indexBuffer.numItems = indices.length;
};

/**
 * Setup mesh object (for z=f(x,y) plot purpose, not to be confused with setupGrid)
 * 
 * @method
 * @param {Array.Number} x           - x array
 * @param {Array.Number} y           - y array
 * @param {Number}       type        - object type (0=face, 1=line, 2=point)
 * @param {Boolean}      lightRespon - response to light (true or false)
 * @example
 * var x = [-10, -5, 0, 5, 10];
 * var y = [-10, -5, 0, 5, 10];
 * glPainter.setupMesh(x, y, 0, true); // Setup mesh
 * glPainter.setMeshOn(true);          // Turn on mesh
 * glPainter.setLightOn(true);         // Turn on light
 * glPainter.refresh();                // Refresh
 */
Painter3D.prototype.setupMesh = function(x, y, type, lightRespon) {
    var gl = this.gl;
    
    // Mesh data
    var nx = x.length;
    var ny = y.length;
    
    var obj = this.meshObj;
    obj.vertexBuffer = gl.createBuffer(); // vertex buffer
    obj.normalBuffer = gl.createBuffer(); // normal buffer
    obj.colorBuffer  = gl.createBuffer(); // color buffer
    obj.indexBuffer  = gl.createBuffer(); // index buffer
    obj.type         = type;                  // object type (0=face, 1=line, 2=point)
    obj.lightRespon  = lightRespon;           // true or false
    obj.x        = x;                         // mesh x
    obj.y        = y;                         // mesh y
    obj.vertices = new Float64Array(3*nx*ny); // mesh vertices
    obj.normals  = new Float64Array(3*nx*ny); // mesh normals
    obj.colors   = new Float64Array(4*nx*ny); // mesh colors
    var vertices = obj.vertices;
    var normals  = obj.normals;
    var colors   = obj.colors;
    
    // Vertices
    for (var j=0; j<ny; j++) {
        for (var i=0; i<nx; i++) {
            vertices[3*(j*nx+i)]   = x[i];
            vertices[3*(j*nx+i)+1] = y[j];
            vertices[3*(j*nx+i)+2] = 0;
        }
    }
    
    // Normals
    for (var j=0; j<ny; j++) {
        for (var i=0; i<nx; i++) {
            normals[3*(j*nx+i)]   = 0;
            normals[3*(j*nx+i)+1] = 0;
            normals[3*(j*nx+i)+2] = 1;
        }
    }
    
    // Colors
    for (var j=0; j<ny; j++) {
        for (var i=0; i<nx; i++) {
            colors[4*(j*nx+i)]   = 1.0;
            colors[4*(j*nx+i)+1] = 0.0;
            colors[4*(j*nx+i)+2] = 0.0;
            colors[4*(j*nx+i)+3] = 1.0;
        }
    }
    
    // Indices
    var indices = null;
    if (type == 0) {
        indices = new Uint16Array(6*nx*ny);
        for (var j=0; j<ny-1; j++) {
            for (var i=0; i<nx-1; i++) {
                indices[6*(j*nx+i)]   = j*nx+i;
                indices[6*(j*nx+i)+1] = j*nx+i+1;
                indices[6*(j*nx+i)+2] = j*nx+i+1+nx;
                
                indices[6*(j*nx+i)+3] = j*nx+i;
                indices[6*(j*nx+i)+4] = j*nx+i+1+nx;
                indices[6*(j*nx+i)+5] = j*nx+i+nx;
            }
        }
    } else if (type == 1) {
        indices = new Uint16Array(4*nx*ny);
        for (var j=0; j<ny; j++) {
            for (var i=0; i<nx-1; i++) {
                indices[4*(j*nx+i)]   = j*nx+i;
                indices[4*(j*nx+i)+1] = j*nx+i+1;
            }
        }
        for (var j=0; j<ny-1; j++) {
            for (var i=0; i<nx; i++) {
                indices[4*(j*nx+i)+2] = j*nx+i;
                indices[4*(j*nx+i)+3] = j*nx+i+nx;
            }
        }
    }
    
    // Setup mesh object buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    obj.vertexBuffer.itemSize = 3;
    obj.vertexBuffer.numItems = vertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    obj.normalBuffer.itemSize = 3;
    obj.normalBuffer.numItems = normals.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    obj.colorBuffer.itemSize = 4;
    obj.colorBuffer.numItems = colors.length/4;
    
    if (type != 2) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        obj.indexBuffer.itemSize = 1;
        obj.indexBuffer.numItems = indices.length;
    }
};

/**
 * Update mesh z value
 * 
 * @method
 * @param {Array.Number} z - z value of mesh
 * @example
 * var x = [-10, -5, 0, 5, 10];
 * var y = [-10, -5, 0, 5, 10];
 * var z = [ 2, 0,-2, 0, 2,
 *           0, 2, 0, 2, 0,
 *          -2, 0, 2, 0,-2,
 *           0, 2, 0, 2, 0,
 *           2, 0,-2, 0, 2];
 * glPainter.setupMesh(x, y, 0, true); // Setup mesh
 * glPainter.updateMesh(z);            // Update mesh
 * glPainter.setMeshOn(true);          // Turn on mesh
 * glPainter.setLightOn(true);         // Turn on light
 * glPainter.refresh();                // Refresh
 */
Painter3D.prototype.updateMesh = function(z) {
    var gl = this.gl;
    var obj = this.meshObj;
    var x = obj.x;
    var y = obj.y;
    var vertices = obj.vertices;
    var normals  = obj.normals;
    var nx = x.length;
    var ny = y.length;
    
    // Update mesh vertices z vaule
    for (var i=0; i<z.length; i++) {
        vertices[3*i+2] = z[i];
    }
    // In case z.length < nx*ny
    for (var i=z.length; i<nx*ny; i++) {
        z[i] = vertices[3*i+2];
    }
    
    // Update normals
    var dx = x[1] - x[0];
    var dy = y[1] - y[0];
    //inside
    for (var j=1; j<ny-1; j++) {
        for (var i=1; i<nx-1; i++) {
            normals[3*(j*nx+i)]   = z[j*nx+i-1] - z[j*nx+i+1];
            normals[3*(j*nx+i)+1] = z[(j-1)*nx+i] - z[(j+1)*nx+i];
            normals[3*(j*nx+i)+2] = 2*dx + 2*dy;
        }
    }
    //4 boundaries
    for (var j=1; j<ny-1; j++) {
        normals[3*(j*nx)]   = 0 - z[j*nx+1];
        normals[3*(j*nx)+1] = z[(j-1)*nx] - z[(j+1)*nx];
        normals[3*(j*nx)+2] = 2*dx + 2*dy;
        normals[3*(j*nx+nx-1)]   = z[j*nx+nx-2] - 0;
        normals[3*(j*nx+nx-1)+1] = z[(j-1)*nx+nx-1] - z[(j+1)*nx+nx-1];
        normals[3*(j*nx+nx-1)+2] = 2*dx + 2*dy;
    }
    for (var i=1; i<nx-1; i++) {
        normals[3*(0*nx+i)]   = z[0*nx+i-1] - z[0*nx+i+1];
        normals[3*(0*nx+i)+1] = 0 - z[1*nx+i];
        normals[3*(0*nx+i)+2] = 2*dx + 2*dy;
        normals[3*((ny-1)*nx+i)]   = z[(ny-1)*nx+i-1] - z[(ny-1)*nx+i+1];
        normals[3*((ny-1)*nx+i)+1] = z[(ny-2)*nx+i] - 0;
        normals[3*((ny-1)*nx+i)+2] = 2*dx + 2*dy;
    }
    //4 corners
    normals[3*(0*nx+0)]   = 0 - z[0*nx+1];
    normals[3*(0*nx+0)+1] = 0 - z[1*nx+0];
    normals[3*(0*nx+0)+2] = 2*dx + 2*dy;
    normals[3*(0*nx+nx-1)]   = z[0*nx+nx-2] - 0;
    normals[3*(0*nx+nx-1)+1] = 0 - z[1*nx+nx-1];
    normals[3*(0*nx+nx-1)+2] = 2*dx + 2*dy;
    normals[3*((ny-1)*nx+0)]   = 0 - z[(ny-1)*nx+1];
    normals[3*((ny-1)*nx+0)+1] = z[(ny-2)*nx+0] - 0;
    normals[3*((ny-1)*nx+0)+2] = 2*dx + 2*dy;
    normals[3*((ny-1)*nx+nx-1)]   = z[(ny-1)*nx+nx-2] - 0;
    normals[3*((ny-1)*nx+nx-1)+1] = z[(ny-2)*nx+nx-1] - 0;
    normals[3*((ny-1)*nx+nx-1)+2] = 2*dx + 2*dy;
    
    // Setup mesh object buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    obj.vertexBuffer.itemSize = 3;
    obj.vertexBuffer.numItems = vertices.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    obj.normalBuffer.itemSize = 3;
    obj.normalBuffer.numItems = normals.length/3;
};

/**
 * Setup color of mesh
 * 
 * @method
 * @param {Array.Number} meshColor - color of mesh [r1,g1,b1,a1, r2,g2,b2,a2, ...]
 * @example
 * var x = [-10, -5, 0, 5, 10];
 * var y = [-10, -5, 0, 5, 10];
 * var c = [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1,
 *          0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1,
 *          0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1,
 *          0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1,
 *          0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1];
 * glPainter.setupMesh(x, y, 0, true); // Setup mesh
 * glPainter.setupMeshColor(c);        // Setup color (a green mesh)
 * glPainter.setMeshOn(true);          // Turn on mesh
 * glPainter.setLightOn(true);         // Turn on light
 * glPainter.refresh();                // Refresh
 */
Painter3D.prototype.setupMeshColor = function(meshColor) {
    var gl = this.gl;
    
    var obj = this.meshObj;
    var colors = obj.colors;
    
    for (var i=0; i<colors.length; i++) {
        colors[i]   = meshColor[i];
    }
    
    // Setup mesh object color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    obj.colorBuffer.itemSize = 4;
    obj.colorBuffer.numItems = colors.length/4;
};

/**
 * Setup color (by phase) of mesh (After call setupMesh())
 * 
 * @method
 * @param {Array.Number} phase - phase of vertices (from 0 to 2*Math.PI)
 * @example
 * var x = [-10, -5, 0, 5, 10];
 * var y = [-10, -5, 0, 5, 10];
 * var p = [0, 1, 3.1, 5, 6.2,
 *          0, 1, 3.1, 5, 6.2,
 *          0, 1, 3.1, 5, 6.2,
 *          0, 1, 3.1, 5, 6.2,
 *          0, 1, 3.1, 5, 6.2];
 * glPainter.setupMesh(x, y, 0, true); // Setup mesh
 * glPainter.setupMeshColorByPhase(p); // Setup color by phase (a rainbow mesh)
 * glPainter.setMeshOn(true);          // Turn on mesh
 * glPainter.setLightOn(true);         // Turn on light
 * glPainter.refresh();                // Refresh
 */
Painter3D.prototype.setupMeshColorByPhase = function(phase) {
    var gl = this.gl;
    
    var obj = this.meshObj;
    var colors = obj.colors;
    var x = obj.x;
    var y = obj.y;
    var nx = x.length;
    var ny = y.length;
    
    // Phase colors
    for (var i=0; i<phase.length; i++) {
        if (phase[i]>=0 && phase[i]<Math.PI/3) {
            var r = phase[i]/(Math.PI/3);
            colors[4*i]   = 1;
            colors[4*i+1] = r;
            colors[4*i+2] = 0;
            colors[4*i+3] = 1;
        } else if (phase[i]>=Math.PI/3 && phase[i]<Math.PI*2/3) {
            var r = (phase[i]-Math.PI/3)/(Math.PI/3);
            colors[4*i]   = 1-r;
            colors[4*i+1] = 1;
            colors[4*i+2] = 0;
            colors[4*i+3] = 1;
        } else if (phase[i]>=Math.PI*2/3 && phase[i]<Math.PI) {
            var r = (phase[i]-Math.PI*2/3)/(Math.PI/3);
            colors[4*i]   = 0;
            colors[4*i+1] = 1;
            colors[4*i+2] = r;
            colors[4*i+3] = 1;
        } else if (phase[i]>=Math.PI && phase[i]<Math.PI*4/3) {
            var r = (phase[i]-Math.PI)/(Math.PI/3);
            colors[4*i]   = 0;
            colors[4*i+1] = 1-r;
            colors[4*i+2] = 1;
            colors[4*i+3] = 1;
        }  else if (phase[i]>=Math.PI*4/3 && phase[i]<Math.PI*5/3) {
            var r = (phase[i]-Math.PI*4/3)/(Math.PI/3);
            colors[4*i]   = r;
            colors[4*i+1] = 0;
            colors[4*i+2] = 1;
            colors[4*i+3] = 1;
        } else {
            var r = (phase[i]-Math.PI*5/3)/(Math.PI/3);
            colors[4*i]   = 1;
            colors[4*i+1] = 0;
            colors[4*i+2] = 1-r;
            colors[4*i+3] = 1;
        }
    }
    
    // In case phase.length < 4*nx*ny
    for (var i=phase.length; i<4*nx*ny; i++) {
        colors[4*i]   = 1;
        colors[4*i+1] = 0;
        colors[4*i+2] = 0;
        colors[4*i+3] = 1;
    }
    
    // Setup mesh object color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    obj.colorBuffer.itemSize = 4;
    obj.colorBuffer.numItems = colors.length/4;
};

/**
 * Setup light
 * 
 * @method
 * @param {Array.Number} lightDirection - direction of light
 * @param {Array.Number} lightAmbient   - ambient light color
 * @param {Array.Number} lightDiffuse   - diffuse light color
 * @param {Array.Number} lightSpecular  - specular light color
 * @param {Number}       shininess      - shininess of surface
 * @example
 * glPainter.setupLight([0.0,1.0,0.0], // Setup light
 *                      [0.4,0.4,0.4],
 *                      [0.6,0.6,0.6],
 *                      [0.8,0.8,0.8],
 *                      100.0);
 * glPainter.setLightOn(true);         // Turn on light
 * glPainter.refresh();
 */
Painter3D.prototype.setupLight = function(lightDirection, lightAmbient, lightDiffuse, lightSpecular, shininess) {
    var gl = this.gl;
    var shaderProgram = this.shaderProgram;
    
    gl.uniform3fv(shaderProgram.lightDirectionUniform, lightDirection);
    gl.uniform3fv(shaderProgram.lightAmbientUniform, lightAmbient);
    gl.uniform3fv(shaderProgram.lightDiffuseUniform, lightDiffuse);
    gl.uniform3fv(shaderProgram.lightSpecularUniform, lightSpecular);
    gl.uniform1f(shaderProgram.shininessUniform, shininess);
};

/**
 * Setup object and push this object to objList
 * 
 * @method
 * @param {Array.Number} vertices    - vertex array [x1,y1,z1, x2,y2,z2, ...]
 * @param {Array.Number} normals     - normal array [nx1,ny1,nz1, nx2,ny2,nz2, ...] (null if not interested in light)
 * @param {Array.Number} colors      - color array [r1,g1,b1,a1, r2,g2,b2,a2, ...]
 * @param {Array.Number} indices     - index array [i1, i2, ...] (null if type=2)
 * @param {Number}       type        - object type (0=face, 1=line, 2=point)
 * @param {Boolean}      lightRespon - response to light (true or false)
 * @example
 * var vertices = [0,7,0, -5,-4,0, 5,-4,0];
 * var colors   = [1,1,1,1, 1,1,1,1, 1,1,1,1];
 * var indices  = [0, 1, 2];
 * glPainter.setupObject(vertices, null, colors, indices, 0, false); // A white triangle with no light effect
 * glPainter.refresh();
 */
Painter3D.prototype.setupObject = function(vertices, normals, colors, indices, type, lightRespon) {
    var gl = this.gl;
    
    var obj = {};
    obj.vertexBuffer = gl.createBuffer(); // vertex buffer
    obj.normalBuffer = gl.createBuffer(); // normal buffer
    obj.colorBuffer  = gl.createBuffer(); // color buffer
    obj.indexBuffer  = gl.createBuffer(); // index buffer
    obj.type         = type;              // object type (0=face, 1=line, 2=point)
    obj.lightRespon  = lightRespon;       // true or false
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    obj.vertexBuffer.itemSize = 3;
    obj.vertexBuffer.numItems = vertices.length/3;
    
    normals = normals == null ? vertices : normals;
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    obj.normalBuffer.itemSize = 3;
    obj.normalBuffer.numItems = normals.length/3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    obj.colorBuffer.itemSize = 4;
    obj.colorBuffer.numItems = colors.length/4;
    
    if (type != 2) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        obj.indexBuffer.itemSize = 1;
        obj.indexBuffer.numItems = indices.length;
    }
    
    this.objList.push(obj);
};

/**
 * Clear object list
 * 
 * @method
 * @example
 * glPainter.clearObjectList(); // Clear all objects
 * glPainter.refresh();
 */
Painter3D.prototype.clearObjectList = function() {
    this.objList.length = 0;
};

/**
 * Setup perspective and clear canvas
 * 
 * @method
 * @example
 * glPainter.setupView();
 * glPainter.refresh();
 */
Painter3D.prototype.setupView = function() {
    var gl = this.gl;
    var shaderProgram = this.shaderProgram;
    
    // Get width and height from the actual canvas
    var canvasWidth  = this.canvas.width;
    var canvasHeight = this.canvas.height;
    
    // Adjust width and height
    if (canvasWidth>0&&canvasHeight>0) {
        this.gl.viewportWidth  = canvasWidth;
        this.gl.viewportHeight = canvasHeight;
    }
    
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(this.bkgdColor[0], this.bkgdColor[1], this.bkgdColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.uniform1f(shaderProgram.pointSizeUniform, this.pointSize);
    
    var mvMatrix = mat4.create();
    var pMatrix  = mat4.create();
    var nMatrix  = mat4.create();
    
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 200.0, pMatrix);
    
    mat4.identity(mvMatrix);
    
    mat4.multiply(mvMatrix, this.transMatrix);
    mat4.multiply(mvMatrix, this.rotatMatrix);
    
    mat4.set(mvMatrix, nMatrix);
    mat4.inverse(nMatrix);
    mat4.transpose(nMatrix);
    
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
};

/**
 * Draw an object
 * 
 * @method
 * @param {Object} obj - 3D graph object
 * @example
 * var vertices = [0,7,0, -5,-4,0, 5,-4,0];
 * var colors   = [1,1,1,1, 1,1,1,1, 1,1,1,1];
 * var indices  = [0, 1, 2];
 * glPainter.setupObject(vertices, null, colors, indices, 0, false);
 * glPainter.drawObject(glPainter.objList[glPainter.objList.length-1]); // Draw the new object
 */
Painter3D.prototype.drawObject = function(obj) {
    var gl = this.gl;
    var shaderProgram = this.shaderProgram;
    
    // Light on or light off
    gl.uniform1i(shaderProgram.useLightUniform, this.lightOn&obj.lightRespon);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, obj.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, obj.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, obj.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    if (obj.type == 0) {
        // Face
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
        gl.drawElements(gl.TRIANGLES, obj.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    } else if (obj.type == 1) {
        // Line
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
        gl.drawElements(gl.LINES, obj.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    } else {
        // Point
        gl.drawArrays(gl.POINTS, 0, obj.vertexBuffer.numItems);
    }
};

/**
 * Re-plot all objects
 * 
 * @method
 * @example
 * glCanvas.width  = 500; // Resize the HTML canvas element
 * glCanvas.height = 300;
 * glPainter.refresh();   // Re-plot buffered data
 */
Painter3D.prototype.refresh = function() {
    // Setup perspective and clear canvas
    this.setupView();
    
    if (this.axisOn) {
        this.drawObject(this.axisLineObj);
        this.drawObject(this.axisHeadObj);
    }
    if (this.gridOn) {
        this.drawObject(this.gridObj);
    }
    if (this.meshOn) {
        this.drawObject(this.meshObj);
    }
    
    // Plot all buffered data
    for (var i=0; i<this.objList.length; i++) {
        this.drawObject(this.objList[i]);
    }
};

// For ease of use, append gl-matrix 1.3.7 - https://github.com/toji/gl-matrix/blob/master/LICENSE.md
(function(w,D){"object"===typeof exports?module.exports=D(global):"function"===typeof define&&define.amd?define([],function(){return D(w)}):D(w)})(this,function(w){function D(a){return o=a}function G(){return o="undefined"!==typeof Float32Array?Float32Array:Array}var E={};(function(){if("undefined"!=typeof Float32Array){var a=new Float32Array(1),b=new Int32Array(a.buffer);E.invsqrt=function(c){a[0]=c;b[0]=1597463007-(b[0]>>1);var d=a[0];return d*(1.5-0.5*c*d*d)}}else E.invsqrt=function(a){return 1/
Math.sqrt(a)}})();var o=null;G();var r={create:function(a){var b=new o(3);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2]):b[0]=b[1]=b[2]=0;return b},createFrom:function(a,b,c){var d=new o(3);d[0]=a;d[1]=b;d[2]=c;return d},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])},add:function(a,b,c){if(!c||a===c)return a[0]+=b[0],a[1]+=b[1],a[2]+=b[2],a;c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];
return c},subtract:function(a,b,c){if(!c||a===c)return a[0]-=b[0],a[1]-=b[1],a[2]-=b[2],a;c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c},multiply:function(a,b,c){if(!c||a===c)return a[0]*=b[0],a[1]*=b[1],a[2]*=b[2],a;c[0]=a[0]*b[0];c[1]=a[1]*b[1];c[2]=a[2]*b[2];return c},negate:function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b},scale:function(a,b,c){if(!c||a===c)return a[0]*=b,a[1]*=b,a[2]*=b,a;c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c},normalize:function(a,b){b||(b=a);var c=
a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(!g)return b[0]=0,b[1]=0,b[2]=0,b;if(1===g)return b[0]=c,b[1]=d,b[2]=e,b;g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b},cross:function(a,b,c){c||(c=a);var d=a[0],e=a[1],a=a[2],g=b[0],f=b[1],b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c},length:function(a){var b=a[0],c=a[1],a=a[2];return Math.sqrt(b*b+c*c+a*a)},squaredLength:function(a){var b=a[0],c=a[1],a=a[2];return b*b+c*c+a*a},dot:function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]},direction:function(a,
b,c){c||(c=a);var d=a[0]-b[0],e=a[1]-b[1],a=a[2]-b[2],b=Math.sqrt(d*d+e*e+a*a);if(!b)return c[0]=0,c[1]=0,c[2]=0,c;b=1/b;c[0]=d*b;c[1]=e*b;c[2]=a*b;return c},lerp:function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);return d},dist:function(a,b){var c=b[0]-a[0],d=b[1]-a[1],e=b[2]-a[2];return Math.sqrt(c*c+d*d+e*e)}},H=null,y=new o(4);r.unproject=function(a,b,c,d,e){e||(e=a);H||(H=x.create());var g=H;y[0]=2*(a[0]-d[0])/d[2]-1;y[1]=2*(a[1]-d[1])/d[3]-1;y[2]=
2*a[2]-1;y[3]=1;x.multiply(c,b,g);if(!x.inverse(g))return null;x.multiplyVec4(g,y);if(0===y[3])return null;e[0]=y[0]/y[3];e[1]=y[1]/y[3];e[2]=y[2]/y[3];return e};var L=r.createFrom(1,0,0),M=r.createFrom(0,1,0),N=r.createFrom(0,0,1),z=r.create();r.rotationTo=function(a,b,c){c||(c=k.create());var d=r.dot(a,b);if(1<=d)k.set(O,c);else if(-0.999999>d)r.cross(L,a,z),1.0E-6>r.length(z)&&r.cross(M,a,z),1.0E-6>r.length(z)&&r.cross(N,a,z),r.normalize(z),k.fromAngleAxis(Math.PI,z,c);else{var d=Math.sqrt(2*(1+
d)),e=1/d;r.cross(a,b,z);c[0]=z[0]*e;c[1]=z[1]*e;c[2]=z[2]*e;c[3]=0.5*d;k.normalize(c)}1<c[3]?c[3]=1:-1>c[3]&&(c[3]=-1);return c};r.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+"]"};var A={create:function(a){var b=new o(9);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3],b[4]=a[4],b[5]=a[5],b[6]=a[6],b[7]=a[7],b[8]=a[8]):b[0]=b[1]=b[2]=b[3]=b[4]=b[5]=b[6]=b[7]=b[8]=0;return b},createFrom:function(a,b,c,d,e,g,f,h,j){var i=new o(9);i[0]=a;i[1]=b;i[2]=c;i[3]=d;i[4]=e;i[5]=g;i[6]=f;i[7]=h;i[8]=j;return i},
determinant:function(a){var b=a[3],c=a[4],d=a[5],e=a[6],g=a[7],f=a[8];return a[0]*(f*c-d*g)+a[1]*(-f*b+d*e)+a[2]*(g*b-c*e)},inverse:function(a,b){var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],j=a[6],i=a[7],m=a[8],l=m*f-h*i,C=-m*g+h*j,q=i*g-f*j,n=c*l+d*C+e*q;if(!n)return null;n=1/n;b||(b=A.create());b[0]=l*n;b[1]=(-m*d+e*i)*n;b[2]=(h*d-e*f)*n;b[3]=C*n;b[4]=(m*c-e*j)*n;b[5]=(-h*c+e*g)*n;b[6]=q*n;b[7]=(-i*c+d*j)*n;b[8]=(f*c-d*g)*n;return b},multiply:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],
f=a[3],h=a[4],j=a[5],i=a[6],m=a[7],a=a[8],l=b[0],C=b[1],q=b[2],n=b[3],k=b[4],p=b[5],o=b[6],s=b[7],b=b[8];c[0]=l*d+C*f+q*i;c[1]=l*e+C*h+q*m;c[2]=l*g+C*j+q*a;c[3]=n*d+k*f+p*i;c[4]=n*e+k*h+p*m;c[5]=n*g+k*j+p*a;c[6]=o*d+s*f+b*i;c[7]=o*e+s*h+b*m;c[8]=o*g+s*j+b*a;return c},multiplyVec2:function(a,b,c){c||(c=b);var d=b[0],b=b[1];c[0]=d*a[0]+b*a[3]+a[6];c[1]=d*a[1]+b*a[4]+a[7];return c},multiplyVec3:function(a,b,c){c||(c=b);var d=b[0],e=b[1],b=b[2];c[0]=d*a[0]+e*a[3]+b*a[6];c[1]=d*a[1]+e*a[4]+b*a[7];c[2]=
d*a[2]+e*a[5]+b*a[8];return c},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>Math.abs(a[3]-b[3])&&1.0E-6>Math.abs(a[4]-b[4])&&1.0E-6>Math.abs(a[5]-b[5])&&1.0E-6>Math.abs(a[6]-b[6])&&1.0E-6>Math.abs(a[7]-b[7])&&1.0E-6>Math.abs(a[8]-b[8])},identity:function(a){a||(a=A.create());a[0]=1;a[1]=0;a[2]=0;a[3]=0;
a[4]=1;a[5]=0;a[6]=0;a[7]=0;a[8]=1;return a},transpose:function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[5];a[1]=a[3];a[2]=a[6];a[3]=c;a[5]=a[7];a[6]=d;a[7]=e;return a}b[0]=a[0];b[1]=a[3];b[2]=a[6];b[3]=a[1];b[4]=a[4];b[5]=a[7];b[6]=a[2];b[7]=a[5];b[8]=a[8];return b},toMat4:function(a,b){b||(b=x.create());b[15]=1;b[14]=0;b[13]=0;b[12]=0;b[11]=0;b[10]=a[8];b[9]=a[7];b[8]=a[6];b[7]=0;b[6]=a[5];b[5]=a[4];b[4]=a[3];b[3]=0;b[2]=a[2];b[1]=a[1];b[0]=a[0];return b},str:function(a){return"["+a[0]+", "+a[1]+
", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+"]"}},x={create:function(a){var b=new o(16);a&&(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3],b[4]=a[4],b[5]=a[5],b[6]=a[6],b[7]=a[7],b[8]=a[8],b[9]=a[9],b[10]=a[10],b[11]=a[11],b[12]=a[12],b[13]=a[13],b[14]=a[14],b[15]=a[15]);return b},createFrom:function(a,b,c,d,e,g,f,h,j,i,m,l,C,q,n,k){var p=new o(16);p[0]=a;p[1]=b;p[2]=c;p[3]=d;p[4]=e;p[5]=g;p[6]=f;p[7]=h;p[8]=j;p[9]=i;p[10]=m;p[11]=l;p[12]=C;p[13]=q;p[14]=n;p[15]=k;return p},set:function(a,
b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>Math.abs(a[3]-b[3])&&1.0E-6>Math.abs(a[4]-b[4])&&1.0E-6>Math.abs(a[5]-b[5])&&1.0E-6>Math.abs(a[6]-b[6])&&1.0E-6>Math.abs(a[7]-b[7])&&1.0E-6>Math.abs(a[8]-b[8])&&1.0E-6>Math.abs(a[9]-b[9])&&1.0E-6>
Math.abs(a[10]-b[10])&&1.0E-6>Math.abs(a[11]-b[11])&&1.0E-6>Math.abs(a[12]-b[12])&&1.0E-6>Math.abs(a[13]-b[13])&&1.0E-6>Math.abs(a[14]-b[14])&&1.0E-6>Math.abs(a[15]-b[15])},identity:function(a){a||(a=x.create());a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a},transpose:function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[3],g=a[6],f=a[7],h=a[11];a[1]=a[4];a[2]=a[8];a[3]=a[12];a[4]=c;a[6]=a[9];a[7]=a[13];a[8]=d;a[9]=g;a[11]=
a[14];a[12]=e;a[13]=f;a[14]=h;return a}b[0]=a[0];b[1]=a[4];b[2]=a[8];b[3]=a[12];b[4]=a[1];b[5]=a[5];b[6]=a[9];b[7]=a[13];b[8]=a[2];b[9]=a[6];b[10]=a[10];b[11]=a[14];b[12]=a[3];b[13]=a[7];b[14]=a[11];b[15]=a[15];return b},determinant:function(a){var b=a[0],c=a[1],d=a[2],e=a[3],g=a[4],f=a[5],h=a[6],j=a[7],i=a[8],m=a[9],l=a[10],C=a[11],q=a[12],n=a[13],k=a[14],a=a[15];return q*m*h*e-i*n*h*e-q*f*l*e+g*n*l*e+i*f*k*e-g*m*k*e-q*m*d*j+i*n*d*j+q*c*l*j-b*n*l*j-i*c*k*j+b*m*k*j+q*f*d*C-g*n*d*C-q*c*h*C+b*n*h*C+
g*c*k*C-b*f*k*C-i*f*d*a+g*m*d*a+i*c*h*a-b*m*h*a-g*c*l*a+b*f*l*a},inverse:function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],j=a[6],i=a[7],m=a[8],l=a[9],k=a[10],q=a[11],n=a[12],o=a[13],p=a[14],r=a[15],s=c*h-d*f,v=c*j-e*f,t=c*i-g*f,u=d*j-e*h,w=d*i-g*h,x=e*i-g*j,y=m*o-l*n,z=m*p-k*n,F=m*r-q*n,A=l*p-k*o,D=l*r-q*o,E=k*r-q*p,B=s*E-v*D+t*A+u*F-w*z+x*y;if(!B)return null;B=1/B;b[0]=(h*E-j*D+i*A)*B;b[1]=(-d*E+e*D-g*A)*B;b[2]=(o*x-p*w+r*u)*B;b[3]=(-l*x+k*w-q*u)*B;b[4]=(-f*E+j*F-i*z)*B;b[5]=
(c*E-e*F+g*z)*B;b[6]=(-n*x+p*t-r*v)*B;b[7]=(m*x-k*t+q*v)*B;b[8]=(f*D-h*F+i*y)*B;b[9]=(-c*D+d*F-g*y)*B;b[10]=(n*w-o*t+r*s)*B;b[11]=(-m*w+l*t-q*s)*B;b[12]=(-f*A+h*z-j*y)*B;b[13]=(c*A-d*z+e*y)*B;b[14]=(-n*u+o*v-p*s)*B;b[15]=(m*u-l*v+k*s)*B;return b},toRotationMat:function(a,b){b||(b=x.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b},toMat3:function(a,b){b||(b=A.create());b[0]=
a[0];b[1]=a[1];b[2]=a[2];b[3]=a[4];b[4]=a[5];b[5]=a[6];b[6]=a[8];b[7]=a[9];b[8]=a[10];return b},toInverseMat3:function(a,b){var c=a[0],d=a[1],e=a[2],g=a[4],f=a[5],h=a[6],j=a[8],i=a[9],m=a[10],l=m*f-h*i,k=-m*g+h*j,q=i*g-f*j,n=c*l+d*k+e*q;if(!n)return null;n=1/n;b||(b=A.create());b[0]=l*n;b[1]=(-m*d+e*i)*n;b[2]=(h*d-e*f)*n;b[3]=k*n;b[4]=(m*c-e*j)*n;b[5]=(-h*c+e*g)*n;b[6]=q*n;b[7]=(-i*c+d*j)*n;b[8]=(f*c-d*g)*n;return b},multiply:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],f=a[3],h=a[4],j=a[5],
i=a[6],m=a[7],l=a[8],k=a[9],q=a[10],n=a[11],o=a[12],p=a[13],r=a[14],a=a[15],s=b[0],v=b[1],t=b[2],u=b[3];c[0]=s*d+v*h+t*l+u*o;c[1]=s*e+v*j+t*k+u*p;c[2]=s*g+v*i+t*q+u*r;c[3]=s*f+v*m+t*n+u*a;s=b[4];v=b[5];t=b[6];u=b[7];c[4]=s*d+v*h+t*l+u*o;c[5]=s*e+v*j+t*k+u*p;c[6]=s*g+v*i+t*q+u*r;c[7]=s*f+v*m+t*n+u*a;s=b[8];v=b[9];t=b[10];u=b[11];c[8]=s*d+v*h+t*l+u*o;c[9]=s*e+v*j+t*k+u*p;c[10]=s*g+v*i+t*q+u*r;c[11]=s*f+v*m+t*n+u*a;s=b[12];v=b[13];t=b[14];u=b[15];c[12]=s*d+v*h+t*l+u*o;c[13]=s*e+v*j+t*k+u*p;c[14]=s*g+
v*i+t*q+u*r;c[15]=s*f+v*m+t*n+u*a;return c},multiplyVec3:function(a,b,c){c||(c=b);var d=b[0],e=b[1],b=b[2];c[0]=a[0]*d+a[4]*e+a[8]*b+a[12];c[1]=a[1]*d+a[5]*e+a[9]*b+a[13];c[2]=a[2]*d+a[6]*e+a[10]*b+a[14];return c},multiplyVec4:function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2],b=b[3];c[0]=a[0]*d+a[4]*e+a[8]*g+a[12]*b;c[1]=a[1]*d+a[5]*e+a[9]*g+a[13]*b;c[2]=a[2]*d+a[6]*e+a[10]*g+a[14]*b;c[3]=a[3]*d+a[7]*e+a[11]*g+a[15]*b;return c},translate:function(a,b,c){var d=b[0],e=b[1],b=b[2],g,f,h,j,i,m,l,k,q,
n,o,p;if(!c||a===c)return a[12]=a[0]*d+a[4]*e+a[8]*b+a[12],a[13]=a[1]*d+a[5]*e+a[9]*b+a[13],a[14]=a[2]*d+a[6]*e+a[10]*b+a[14],a[15]=a[3]*d+a[7]*e+a[11]*b+a[15],a;g=a[0];f=a[1];h=a[2];j=a[3];i=a[4];m=a[5];l=a[6];k=a[7];q=a[8];n=a[9];o=a[10];p=a[11];c[0]=g;c[1]=f;c[2]=h;c[3]=j;c[4]=i;c[5]=m;c[6]=l;c[7]=k;c[8]=q;c[9]=n;c[10]=o;c[11]=p;c[12]=g*d+i*e+q*b+a[12];c[13]=f*d+m*e+n*b+a[13];c[14]=h*d+l*e+o*b+a[14];c[15]=j*d+k*e+p*b+a[15];return c},scale:function(a,b,c){var d=b[0],e=b[1],b=b[2];if(!c||a===c)return a[0]*=
d,a[1]*=d,a[2]*=d,a[3]*=d,a[4]*=e,a[5]*=e,a[6]*=e,a[7]*=e,a[8]*=b,a[9]*=b,a[10]*=b,a[11]*=b,a;c[0]=a[0]*d;c[1]=a[1]*d;c[2]=a[2]*d;c[3]=a[3]*d;c[4]=a[4]*e;c[5]=a[5]*e;c[6]=a[6]*e;c[7]=a[7]*e;c[8]=a[8]*b;c[9]=a[9]*b;c[10]=a[10]*b;c[11]=a[11]*b;c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15];return c},rotate:function(a,b,c,d){var e=c[0],g=c[1],c=c[2],f=Math.sqrt(e*e+g*g+c*c),h,j,i,m,l,k,q,n,o,p,r,s,v,t,u,w,x,y,z,A;if(!f)return null;1!==f&&(f=1/f,e*=f,g*=f,c*=f);h=Math.sin(b);j=Math.cos(b);i=1-j;b=a[0];
f=a[1];m=a[2];l=a[3];k=a[4];q=a[5];n=a[6];o=a[7];p=a[8];r=a[9];s=a[10];v=a[11];t=e*e*i+j;u=g*e*i+c*h;w=c*e*i-g*h;x=e*g*i-c*h;y=g*g*i+j;z=c*g*i+e*h;A=e*c*i+g*h;e=g*c*i-e*h;g=c*c*i+j;d?a!==d&&(d[12]=a[12],d[13]=a[13],d[14]=a[14],d[15]=a[15]):d=a;d[0]=b*t+k*u+p*w;d[1]=f*t+q*u+r*w;d[2]=m*t+n*u+s*w;d[3]=l*t+o*u+v*w;d[4]=b*x+k*y+p*z;d[5]=f*x+q*y+r*z;d[6]=m*x+n*y+s*z;d[7]=l*x+o*y+v*z;d[8]=b*A+k*e+p*g;d[9]=f*A+q*e+r*g;d[10]=m*A+n*e+s*g;d[11]=l*A+o*e+v*g;return d},rotateX:function(a,b,c){var d=Math.sin(b),
b=Math.cos(b),e=a[4],g=a[5],f=a[6],h=a[7],j=a[8],i=a[9],m=a[10],l=a[11];c?a!==c&&(c[0]=a[0],c[1]=a[1],c[2]=a[2],c[3]=a[3],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[4]=e*b+j*d;c[5]=g*b+i*d;c[6]=f*b+m*d;c[7]=h*b+l*d;c[8]=e*-d+j*b;c[9]=g*-d+i*b;c[10]=f*-d+m*b;c[11]=h*-d+l*b;return c},rotateY:function(a,b,c){var d=Math.sin(b),b=Math.cos(b),e=a[0],g=a[1],f=a[2],h=a[3],j=a[8],i=a[9],m=a[10],l=a[11];c?a!==c&&(c[4]=a[4],c[5]=a[5],c[6]=a[6],c[7]=a[7],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=
a[15]):c=a;c[0]=e*b+j*-d;c[1]=g*b+i*-d;c[2]=f*b+m*-d;c[3]=h*b+l*-d;c[8]=e*d+j*b;c[9]=g*d+i*b;c[10]=f*d+m*b;c[11]=h*d+l*b;return c},rotateZ:function(a,b,c){var d=Math.sin(b),b=Math.cos(b),e=a[0],g=a[1],f=a[2],h=a[3],j=a[4],i=a[5],m=a[6],l=a[7];c?a!==c&&(c[8]=a[8],c[9]=a[9],c[10]=a[10],c[11]=a[11],c[12]=a[12],c[13]=a[13],c[14]=a[14],c[15]=a[15]):c=a;c[0]=e*b+j*d;c[1]=g*b+i*d;c[2]=f*b+m*d;c[3]=h*b+l*d;c[4]=e*-d+j*b;c[5]=g*-d+i*b;c[6]=f*-d+m*b;c[7]=h*-d+l*b;return c},frustum:function(a,b,c,d,e,g,f){f||
(f=x.create());var h=b-a,j=d-c,i=g-e;f[0]=2*e/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2*e/j;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/j;f[10]=-(g+e)/i;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(2*g*e)/i;f[15]=0;return f},perspective:function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b*=a;return x.frustum(-b,b,-a,a,c,d,e)},ortho:function(a,b,c,d,e,g,f){f||(f=x.create());var h=b-a,j=d-c,i=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/j;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/i;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/j;f[14]=
-(g+e)/i;f[15]=1;return f},lookAt:function(a,b,c,d){d||(d=x.create());var e,g,f,h,j,i,m,l,k=a[0],o=a[1],a=a[2];f=c[0];h=c[1];g=c[2];m=b[0];c=b[1];e=b[2];if(k===m&&o===c&&a===e)return x.identity(d);b=k-m;c=o-c;m=a-e;l=1/Math.sqrt(b*b+c*c+m*m);b*=l;c*=l;m*=l;e=h*m-g*c;g=g*b-f*m;f=f*c-h*b;(l=Math.sqrt(e*e+g*g+f*f))?(l=1/l,e*=l,g*=l,f*=l):f=g=e=0;h=c*f-m*g;j=m*e-b*f;i=b*g-c*e;(l=Math.sqrt(h*h+j*j+i*i))?(l=1/l,h*=l,j*=l,i*=l):i=j=h=0;d[0]=e;d[1]=h;d[2]=b;d[3]=0;d[4]=g;d[5]=j;d[6]=c;d[7]=0;d[8]=f;d[9]=
i;d[10]=m;d[11]=0;d[12]=-(e*k+g*o+f*a);d[13]=-(h*k+j*o+i*a);d[14]=-(b*k+c*o+m*a);d[15]=1;return d},fromRotationTranslation:function(a,b,c){c||(c=x.create());var d=a[0],e=a[1],g=a[2],f=a[3],h=d+d,j=e+e,i=g+g,a=d*h,m=d*j,d=d*i,k=e*j,e=e*i,g=g*i,h=f*h,j=f*j,f=f*i;c[0]=1-(k+g);c[1]=m+f;c[2]=d-j;c[3]=0;c[4]=m-f;c[5]=1-(a+g);c[6]=e+h;c[7]=0;c[8]=d+j;c[9]=e-h;c[10]=1-(a+k);c[11]=0;c[12]=b[0];c[13]=b[1];c[14]=b[2];c[15]=1;return c},str:function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+
a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"}},k={create:function(a){var b=new o(4);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3]):b[0]=b[1]=b[2]=b[3]=0;return b},createFrom:function(a,b,c,d){var e=new o(4);e[0]=a;e[1]=b;e[2]=c;e[3]=d;return e},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>
Math.abs(a[3]-b[3])},identity:function(a){a||(a=k.create());a[0]=0;a[1]=0;a[2]=0;a[3]=1;return a}},O=k.identity();k.calculateW=function(a,b){var c=a[0],d=a[1],e=a[2];if(!b||a===b)return a[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e)),a;b[0]=c;b[1]=d;b[2]=e;b[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return b};k.dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]};k.inverse=function(a,b){var c=a[0],d=a[1],e=a[2],g=a[3],c=(c=c*c+d*d+e*e+g*g)?1/c:0;if(!b||a===b)return a[0]*=-c,a[1]*=-c,a[2]*=-c,a[3]*=
c,a;b[0]=-a[0]*c;b[1]=-a[1]*c;b[2]=-a[2]*c;b[3]=a[3]*c;return b};k.conjugate=function(a,b){if(!b||a===b)return a[0]*=-1,a[1]*=-1,a[2]*=-1,a;b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=a[3];return b};k.length=function(a){var b=a[0],c=a[1],d=a[2],a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)};k.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=Math.sqrt(c*c+d*d+e*e+g*g);if(0===f)return b[0]=0,b[1]=0,b[2]=0,b[3]=0,b;f=1/f;b[0]=c*f;b[1]=d*f;b[2]=e*f;b[3]=g*f;return b};k.add=function(a,b,c){if(!c||
a===c)return a[0]+=b[0],a[1]+=b[1],a[2]+=b[2],a[3]+=b[3],a;c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];c[3]=a[3]+b[3];return c};k.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],a=a[3],f=b[0],h=b[1],j=b[2],b=b[3];c[0]=d*b+a*f+e*j-g*h;c[1]=e*b+a*h+g*f-d*j;c[2]=g*b+a*j+d*h-e*f;c[3]=a*b-d*f-e*h-g*j;return c};k.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2],b=a[0],f=a[1],h=a[2],a=a[3],j=a*d+f*g-h*e,i=a*e+h*d-b*g,k=a*g+b*e-f*d,d=-b*d-f*e-h*g;c[0]=j*a+d*-b+i*-h-k*-f;c[1]=i*a+
d*-f+k*-b-j*-h;c[2]=k*a+d*-h+j*-f-i*-b;return c};k.scale=function(a,b,c){if(!c||a===c)return a[0]*=b,a[1]*=b,a[2]*=b,a[3]*=b,a;c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;c[3]=a[3]*b;return c};k.toMat3=function(a,b){b||(b=A.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,j=e+e,i=c*f,k=c*h,c=c*j,l=d*h,d=d*j,e=e*j,f=g*f,h=g*h,g=g*j;b[0]=1-(l+e);b[1]=k+g;b[2]=c-h;b[3]=k-g;b[4]=1-(i+e);b[5]=d+f;b[6]=c+h;b[7]=d-f;b[8]=1-(i+l);return b};k.toMat4=function(a,b){b||(b=x.create());var c=a[0],d=a[1],e=a[2],g=
a[3],f=c+c,h=d+d,j=e+e,i=c*f,k=c*h,c=c*j,l=d*h,d=d*j,e=e*j,f=g*f,h=g*h,g=g*j;b[0]=1-(l+e);b[1]=k+g;b[2]=c-h;b[3]=0;b[4]=k-g;b[5]=1-(i+e);b[6]=d+f;b[7]=0;b[8]=c+h;b[9]=d-f;b[10]=1-(i+l);b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};k.slerp=function(a,b,c,d){d||(d=a);var e=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3],g,f;if(1<=Math.abs(e))return d!==a&&(d[0]=a[0],d[1]=a[1],d[2]=a[2],d[3]=a[3]),d;g=Math.acos(e);f=Math.sqrt(1-e*e);if(0.001>Math.abs(f))return d[0]=0.5*a[0]+0.5*b[0],d[1]=0.5*a[1]+0.5*b[1],
d[2]=0.5*a[2]+0.5*b[2],d[3]=0.5*a[3]+0.5*b[3],d;e=Math.sin((1-c)*g)/f;c=Math.sin(c*g)/f;d[0]=a[0]*e+b[0]*c;d[1]=a[1]*e+b[1]*c;d[2]=a[2]*e+b[2]*c;d[3]=a[3]*e+b[3]*c;return d};k.fromRotationMatrix=function(a,b){b||(b=k.create());var c=a[0]+a[4]+a[8],d;if(0<c)d=Math.sqrt(c+1),b[3]=0.5*d,d=0.5/d,b[0]=(a[7]-a[5])*d,b[1]=(a[2]-a[6])*d,b[2]=(a[3]-a[1])*d;else{d=k.fromRotationMatrix.s_iNext=k.fromRotationMatrix.s_iNext||[1,2,0];c=0;a[4]>a[0]&&(c=1);a[8]>a[3*c+c]&&(c=2);var e=d[c],g=d[e];d=Math.sqrt(a[3*c+
c]-a[3*e+e]-a[3*g+g]+1);b[c]=0.5*d;d=0.5/d;b[3]=(a[3*g+e]-a[3*e+g])*d;b[e]=(a[3*e+c]+a[3*c+e])*d;b[g]=(a[3*g+c]+a[3*c+g])*d}return b};A.toQuat4=k.fromRotationMatrix;(function(){var a=A.create();k.fromAxes=function(b,c,d,e){a[0]=c[0];a[3]=c[1];a[6]=c[2];a[1]=d[0];a[4]=d[1];a[7]=d[2];a[2]=b[0];a[5]=b[1];a[8]=b[2];return k.fromRotationMatrix(a,e)}})();k.identity=function(a){a||(a=k.create());a[0]=0;a[1]=0;a[2]=0;a[3]=1;return a};k.fromAngleAxis=function(a,b,c){c||(c=k.create());var a=0.5*a,d=Math.sin(a);
c[3]=Math.cos(a);c[0]=d*b[0];c[1]=d*b[1];c[2]=d*b[2];return c};k.toAngleAxis=function(a,b){b||(b=a);var c=a[0]*a[0]+a[1]*a[1]+a[2]*a[2];0<c?(b[3]=2*Math.acos(a[3]),c=E.invsqrt(c),b[0]=a[0]*c,b[1]=a[1]*c,b[2]=a[2]*c):(b[3]=0,b[0]=1,b[1]=0,b[2]=0);return b};k.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"};var J={create:function(a){var b=new o(2);a?(b[0]=a[0],b[1]=a[1]):(b[0]=0,b[1]=0);return b},createFrom:function(a,b){var c=new o(2);c[0]=a;c[1]=b;return c},add:function(a,b,c){c||
(c=b);c[0]=a[0]+b[0];c[1]=a[1]+b[1];return c},subtract:function(a,b,c){c||(c=b);c[0]=a[0]-b[0];c[1]=a[1]-b[1];return c},multiply:function(a,b,c){c||(c=b);c[0]=a[0]*b[0];c[1]=a[1]*b[1];return c},divide:function(a,b,c){c||(c=b);c[0]=a[0]/b[0];c[1]=a[1]/b[1];return c},scale:function(a,b,c){c||(c=a);c[0]=a[0]*b;c[1]=a[1]*b;return c},dist:function(a,b){var c=b[0]-a[0],d=b[1]-a[1];return Math.sqrt(c*c+d*d)},set:function(a,b){b[0]=a[0];b[1]=a[1];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-
b[0])&&1.0E-6>Math.abs(a[1]-b[1])},negate:function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];return b},normalize:function(a,b){b||(b=a);var c=a[0]*a[0]+a[1]*a[1];0<c?(c=Math.sqrt(c),b[0]=a[0]/c,b[1]=a[1]/c):b[0]=b[1]=0;return b},cross:function(a,b,c){a=a[0]*b[1]-a[1]*b[0];if(!c)return a;c[0]=c[1]=0;c[2]=a;return c},length:function(a){var b=a[0],a=a[1];return Math.sqrt(b*b+a*a)},squaredLength:function(a){var b=a[0],a=a[1];return b*b+a*a},dot:function(a,b){return a[0]*b[0]+a[1]*b[1]},direction:function(a,
b,c){c||(c=a);var d=a[0]-b[0],a=a[1]-b[1],b=d*d+a*a;if(!b)return c[0]=0,c[1]=0,c[2]=0,c;b=1/Math.sqrt(b);c[0]=d*b;c[1]=a*b;return c},lerp:function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);return d},str:function(a){return"["+a[0]+", "+a[1]+"]"}},I={create:function(a){var b=new o(4);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3]):b[0]=b[1]=b[2]=b[3]=0;return b},createFrom:function(a,b,c,d){var e=new o(4);e[0]=a;e[1]=b;e[2]=c;e[3]=d;return e},set:function(a,b){b[0]=a[0];b[1]=a[1];
b[2]=a[2];b[3]=a[3];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>Math.abs(a[3]-b[3])},identity:function(a){a||(a=I.create());a[0]=1;a[1]=0;a[2]=0;a[3]=1;return a},transpose:function(a,b){if(!b||a===b){var c=a[1];a[1]=a[2];a[2]=c;return a}b[0]=a[0];b[1]=a[2];b[2]=a[1];b[3]=a[3];return b},determinant:function(a){return a[0]*a[3]-a[2]*a[1]},inverse:function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=c*g-e*
d;if(!f)return null;f=1/f;b[0]=g*f;b[1]=-d*f;b[2]=-e*f;b[3]=c*f;return b},multiply:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],a=a[3];c[0]=d*b[0]+e*b[2];c[1]=d*b[1]+e*b[3];c[2]=g*b[0]+a*b[2];c[3]=g*b[1]+a*b[3];return c},rotate:function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],a=a[3],f=Math.sin(b),b=Math.cos(b);c[0]=d*b+e*f;c[1]=d*-f+e*b;c[2]=g*b+a*f;c[3]=g*-f+a*b;return c},multiplyVec2:function(a,b,c){c||(c=b);var d=b[0],b=b[1];c[0]=d*a[0]+b*a[1];c[1]=d*a[2]+b*a[3];return c},scale:function(a,
b,c){c||(c=a);var d=a[1],e=a[2],g=a[3],f=b[0],b=b[1];c[0]=a[0]*f;c[1]=d*b;c[2]=e*f;c[3]=g*b;return c},str:function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"}},K={create:function(a){var b=new o(4);a?(b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3]):(b[0]=0,b[1]=0,b[2]=0,b[3]=0);return b},createFrom:function(a,b,c,d){var e=new o(4);e[0]=a;e[1]=b;e[2]=c;e[3]=d;return e},add:function(a,b,c){c||(c=b);c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];c[3]=a[3]+b[3];return c},subtract:function(a,b,c){c||(c=
b);c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];c[3]=a[3]-b[3];return c},multiply:function(a,b,c){c||(c=b);c[0]=a[0]*b[0];c[1]=a[1]*b[1];c[2]=a[2]*b[2];c[3]=a[3]*b[3];return c},divide:function(a,b,c){c||(c=b);c[0]=a[0]/b[0];c[1]=a[1]/b[1];c[2]=a[2]/b[2];c[3]=a[3]/b[3];return c},scale:function(a,b,c){c||(c=a);c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;c[3]=a[3]*b;return c},set:function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b},equal:function(a,b){return a===b||1.0E-6>Math.abs(a[0]-b[0])&&1.0E-6>
Math.abs(a[1]-b[1])&&1.0E-6>Math.abs(a[2]-b[2])&&1.0E-6>Math.abs(a[3]-b[3])},negate:function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=-a[3];return b},length:function(a){var b=a[0],c=a[1],d=a[2],a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)},squaredLength:function(a){var b=a[0],c=a[1],d=a[2],a=a[3];return b*b+c*c+d*d+a*a},lerp:function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);d[3]=a[3]+c*(b[3]-a[3]);return d},str:function(a){return"["+a[0]+", "+
a[1]+", "+a[2]+", "+a[3]+"]"}};w&&(w.glMatrixArrayType=o,w.MatrixArray=o,w.setMatrixArrayType=D,w.determineMatrixArrayType=G,w.glMath=E,w.vec2=J,w.vec3=r,w.vec4=K,w.mat2=I,w.mat3=A,w.mat4=x,w.quat4=k);return{glMatrixArrayType:o,MatrixArray:o,setMatrixArrayType:D,determineMatrixArrayType:G,glMath:E,vec2:J,vec3:r,vec4:K,mat2:I,mat3:A,mat4:x,quat4:k}});
