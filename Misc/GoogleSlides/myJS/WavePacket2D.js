/*
 * WavePacket2D.js
 * Wave packet in 2D space
 * Need to include Complex.js, CrankNicolson.js, Painter3D.js
 */

var WavePacket2D = new Object();

window.addEventListener("load", function() {WavePacket2D.loadHandler();}, false);
WavePacket2D.loadHandler = function() {
    var WavePacket2DDivs = document.getElementsByClassName("WavePacket2D");
    for (var i=0; i<WavePacket2DDivs.length; i++) {
        WavePacket2D.setupWP2D(WavePacket2DDivs[i]);
    }
};

// Wave packet setup
WavePacket2D.setupWP2D = function(container) {
    // Get data from <div>{JSON}</div>
    var data   = JSON.parse(container.innerHTML);
    var xMin   = typeof data.xMin   === "undefined" ? -6.0  : data.xMin;
    var xMax   = typeof data.xMax   === "undefined" ? 6.0   : data.xMax;
    var dx     = typeof data.dx     === "undefined" ? 0.1   : data.dx;
    var yMin   = typeof data.yMin   === "undefined" ? -6.0  : data.yMin;
    var yMax   = typeof data.yMax   === "undefined" ? 6.0   : data.yMax;
    var dy     = typeof data.dy     === "undefined" ? 0.1   : data.dy;
    var tMax   = typeof data.tMax   === "undefined" ? 50.00 : data.tMax;
    var dt     = typeof data.dt     === "undefined" ? 0.02  : data.dt;
    var kx0Min = typeof data.kx0Min === "undefined" ? -3    : data.kx0Min;
    var kx0Max = typeof data.kx0Max === "undefined" ? 3     : data.kx0Max;
    var ky0Min = typeof data.ky0Min === "undefined" ? -3    : data.ky0Min;
    var ky0Max = typeof data.ky0Max === "undefined" ? 3     : data.ky0Max;
    var stdMin = typeof data.stdMin === "undefined" ? 0.5   : data.stdMin;
    var stdMax = typeof data.stdMax === "undefined" ? 1.5   : data.stdMax;
    
    // Add HTML elements
    var html = "<canvas></canvas><br />";
    html += "<div>t = 0.00</div>";
    html += "<table border='0'>";
    html += "<tr><td class='text'>kx<sub>0</sub> = 0.0</td>";
    html += "<td><input type='range' step='0.1' value='0.0' /></td></tr>";
    html += "<tr><td class='text'>ky<sub>0</sub> = 0.0</td>";
    html += "<td><input type='range' step='0.1' value='0.0' /></td></tr>";
    html += "<tr><td class='text'>std = 1.5</td>";
    html += "<td><input type='range' step='0.1' value='1.5' /></td></tr>";
    html += "</table>";
    html += "<input type='button' value='\u25b6' />";
    html += "<input type='button' value='\u2759\u2759' />";
    html += "<input type='button' value='\u220e' />";
    container.innerHTML = html;
    
    // Get HTML elements
    var glCanvas    = container.getElementsByTagName("canvas")[0];
    var timeText    = container.getElementsByTagName("div")[0];
    var kx0Text     = container.getElementsByTagName("td")[0];
    var ky0Text     = container.getElementsByTagName("td")[2];
    var stdText     = container.getElementsByTagName("td")[4];
    var kx0Range    = container.getElementsByTagName("input")[0];
    var ky0Range    = container.getElementsByTagName("input")[1];
    var stdRange    = container.getElementsByTagName("input")[2];
    var startButton = container.getElementsByTagName("input")[3];
    var pauseButton = container.getElementsByTagName("input")[4];
    var stopButton  = container.getElementsByTagName("input")[5];
    
    kx0Range.min = kx0Min;
    kx0Range.max = kx0Max;
    ky0Range.min = ky0Min;
    ky0Range.max = ky0Max;
    stdRange.min = stdMin;
    stdRange.max = stdMax;
    startButton.disabled = "";
    pauseButton.disabled = "disabled";
    stopButton.disabled  = "disabled";
    
    // Setup
    var x = WavePacket2D.setupGrid(xMin, xMax, dx);
    var y = WavePacket2D.setupGrid(yMin, yMax, dy);
    var t = WavePacket2D.setupGrid(0, tMax, dt);
    var H = WavePacket2D.setupHamiltonian2D(x, y, dt);
    var HaX = H[0], HbX = H[1], HcX = H[2], AaX = H[3], AbX = H[4], AcX = H[5], BaX = H[6], BbX = H[7], BcX = H[8];
    var HaY = H[9], HbY = H[10], HcY = H[11], AaY = H[12], AbY = H[13], AcY = H[14], BaY = H[15], BbY = H[16], BcY = H[17];
    var kx0 = parseFloat(kx0Range.value);
    var ky0 = parseFloat(ky0Range.value);
    var std = parseFloat(stdRange.value);
    var Psi = WavePacket2D.initialize2D(x, y, kx0, ky0, std);
    var sqrtPsiSq = WavePacket2D.sqrtSq(Psi);
    var phase = PsiPhase(Psi);
    
    // Painter3D
    var glPainter = new Painter3D(glCanvas);
    glPainter.setMatrices([0.0,0.0,-15.0], [-1.2,0.0,-Math.PI*3/4]);
    
    // Setup axis
    glPainter.setupAxis(xMax+2, 0.3);
    glPainter.setAxisOn(true);
    
    // Setup grid
    glPainter.setupGrid(0.5, 2*xMax, [0.5,0.5,0.5]);
    glPainter.setGridOn(true);
    
    // Setup mesh
    glPainter.setupMesh(x, y, 0, true);
    glPainter.updateMesh(sqrtPsiSq);
    glPainter.setupMeshColorByPhase(phase);
    glPainter.setupMeshColor(fadeColor(glPainter.meshObj.colors));
    glPainter.setMeshOn(true);
    
    // Setup light
    var lightDirection = [0.0, 1.0, 0.0];
    var lightAmbient   = [0.4, 0.4, 0.4];
    var lightDiffuse   = [0.6, 0.6, 0.6];
    var lightSpecular  = [0.8, 0.8, 0.8];
    var shininess      = 100.0;
    glPainter.setupLight(lightDirection, lightAmbient, lightDiffuse, lightSpecular, shininess);
    glPainter.setLightOn(true);
    
    // Initial plot
    resize();
    
    // Add event listeners
    window.addEventListener("resize", resize, false);
    kx0Range.addEventListener("change", inputChangeHandler, false);
    ky0Range.addEventListener("change", inputChangeHandler, false);
    stdRange.addEventListener("change", inputChangeHandler, false);
    startButton.addEventListener("click", startClickHandler, false);
    pauseButton.addEventListener("click", pauseClickHandler, false);
    stopButton.addEventListener("click", stopClickHandler, false);
    
    // Event handlers
    // Start to solve PDE
    var playState = 0;
    function startClickHandler() {
        if (playState == 0) {
            // is stopped
            playState = 1;
            
            // Time iteration
            var it = 1;
            function iterate() {
                if (playState == 0) {
                    // stop
                    kx0Range.disabled    = "";
                    ky0Range.disabled    = "";
                    stdRange.disabled    = "";
                    startButton.disabled = "";
                    pauseButton.disabled = "disabled";
                    stopButton.disabled  = "disabled";
                    
                    timeText.innerHTML = "t = 0.00";
                    
                    Psi = WavePacket2D.initialize2D(x, y, kx0, ky0, std);
                    
                    // drawScene
                    sqrtPsiSq = WavePacket2D.sqrtSq(Psi);
                    glPainter.updateMesh(sqrtPsiSq);
                    glPainter.setupMeshColorByPhase(PsiPhase(Psi));
                    glPainter.setupMeshColor(fadeColor(glPainter.meshObj.colors));
                    glPainter.refresh();
                    
                    return 0;
                }
                if (playState == 1) {
                    // play
                    kx0Range.disabled    = "disabled";
                    ky0Range.disabled    = "disabled";
                    stdRange.disabled    = "disabled";
                    startButton.disabled = "disabled";
                    pauseButton.disabled = "";
                    stopButton.disabled  = "";
                    
                    timeText.innerHTML = "t = " + t[it].toFixed(2);
                    
                    // ADI Crank Nicolson integration
                    Psi = CrankNicolson.complexADI(Psi, AaX, AbX, AcX, BaX, BbX, BcX, AaY, AbY, AcY, BaY, BbY, BcY);
                    
                    // drawScene
                    sqrtPsiSq = WavePacket2D.sqrtSq(Psi);
                    glPainter.updateMesh(sqrtPsiSq);
                    glPainter.setupMeshColorByPhase(PsiPhase(Psi));
                    glPainter.setupMeshColor(fadeColor(glPainter.meshObj.colors));
                    glPainter.refresh();
                    
                    // Iterate
                    it++;
                    if (it>=t.length)
                        playState = 0;
                }
                if (playState == 2) {
                    // pause
                    kx0Range.disabled    = "disabled";
                    ky0Range.disabled    = "disabled";
                    stdRange.disabled    = "disabled";
                    startButton.disabled = "";
                    pauseButton.disabled = "disabled";
                    stopButton.disabled  = "";
                }
                setTimeout(function() {iterate();}, 10);
            }
            setTimeout(function() {iterate();}, 10);
        } else {
            // is paused
            playState = 1;
        }
    }
    function pauseClickHandler() {playState = 2;}
    function stopClickHandler() {playState = 0;}
    
    // Input change action
    function inputChangeHandler() {
        kx0 = parseFloat(kx0Range.value);
        ky0 = parseFloat(ky0Range.value);
        std = parseFloat(stdRange.value);
        
        kx0Text.innerHTML = "kx<sub>0</sub> = " + kx0.toFixed(1);
        ky0Text.innerHTML = "ky<sub>0</sub> = " + ky0.toFixed(1);
        stdText.innerHTML = "std = " + std.toFixed(1);
        
        Psi = WavePacket2D.initialize2D(x, y, kx0, ky0, std);
        
        // Re-drawScene
        glPainter.updateMesh(WavePacket2D.sqrtSq(Psi));
        glPainter.setupMeshColorByPhase(PsiPhase(Psi));
        glPainter.setupMeshColor(fadeColor(glPainter.meshObj.colors));
        glPainter.refresh();
    }
    
    // Phase array
    function PsiPhase(Psi) {
        var n = Psi.length;
        var phase = new Float64Array(n);
        for (var i=0; i<n; i++) {
            phase[i] = Psi[i].phase();
        }
        return phase;
    }
    
    function fadeColor(colors) {
        var fadedColors = new Float64Array(colors.length);
        for (var i=0; i<sqrtPsiSq.length; i++) {
            var a = 0.5;
            var b = 0.01;
            var c = 50.0;
            var A = (c-1.0)/(a-b);
            var B = 1.0-A*b;
            if (sqrtPsiSq[i] > a) {
                fadedColors[4*i  ] = colors[4*i  ];
                fadedColors[4*i+1] = colors[4*i+1];
                fadedColors[4*i+2] = colors[4*i+2];
            } else if (sqrtPsiSq[i] > b) {
                var factor = Math.log(A*sqrtPsiSq[i]+B)/Math.log(c);
                fadedColors[4*i  ] = factor*colors[4*i  ];
                fadedColors[4*i+1] = factor*colors[4*i+1];
                fadedColors[4*i+2] = factor*colors[4*i+2];
            } else {
                fadedColors[4*i  ] = 0;
                fadedColors[4*i+1] = 0;
                fadedColors[4*i+2] = 0;
            }
            fadedColors[4*i+3] = colors[4*i+3];
        }
        return fadedColors;
    }
    
    // Window resize
    function resize() {
        glCanvas.width  = container.clientWidth*0.75;
        glCanvas.height = container.clientWidth*0.5;
        
        glPainter.refresh();
    }
};

// Setup 1D grid
WavePacket2D.setupGrid = function(xMin, xMax, dx) {
    var n = Math.round((xMax-xMin)/dx + 1);
    var x = new Float64Array(n);
    for (var i=0; i<n; i++) {
        x[i] = xMin + dx*i;
    }
    return x;
};

// Setup tridiagonal matrix of 2D Hamiltonian (zero potential)
WavePacket2D.setupHamiltonian2D = function(x, y, dt) {
    var nx = x.length;
    var ny = y.length;
    var dx = x[1] - x[0];
    var dy = y[1] - y[0];
    
    // Tridiagonal matrices
    // The 3 diagonal vectors of the Hamiltonian matrix H
    var HaX = new Array(nx);
    var HbX = new Array(nx);
    var HcX = new Array(nx);
    for (var i=0; i<nx; i++) {
        HaX[i] = new Complex(-0.5/(dx*dx), 0); // HaX[0] is redundant
        HbX[i] = new Complex(1/(dx*dx), 0);
        HcX[i] = new Complex(-0.5/(dx*dx), 0); // HcX[N-1] is redundant
    }
    var HaY = new Array(ny);
    var HbY = new Array(ny);
    var HcY = new Array(ny);
    for (var i=0; i<ny; i++) {
        HaY[i] = new Complex(-0.5/(dy*dy), 0); // HaY[0] is redundant
        HbY[i] = new Complex(1/(dy*dy), 0);
        HcY[i] = new Complex(-0.5/(dy*dy), 0); // HcY[N-1] is redundant
    }
    // The 3 diagonal vectors of matrix A = I + dt/2*i*H
    var AaX = new Array(nx);
    var AbX = new Array(nx);
    var AcX = new Array(nx);
    for (var i=0; i<nx; i++) {
        AaX[i] = (new Complex(0, dt/2)).multiply(HaX[i]); // AaX[0] is redundant
        AbX[i] = (new Complex(1, 0)).add((new Complex(0, dt/2)).multiply(HbX[i]));
        AcX[i] = (new Complex(0, dt/2)).multiply(HcX[i]); // AcX[N-1] is redundant
    }
    var AaY = new Array(ny);
    var AbY = new Array(ny);
    var AcY = new Array(ny);
    for (var i=0; i<ny; i++) {
        AaY[i] = (new Complex(0, dt/2)).multiply(HaY[i]); // AaY[0] is redundant
        AbY[i] = (new Complex(1, 0)).add((new Complex(0, dt/2)).multiply(HbY[i]));
        AcY[i] = (new Complex(0, dt/2)).multiply(HcY[i]); // AcY[N-1] is redundant
    }
    // The 3 diagonal vectors of matrix B = I - dt/2*i*H
    var BaX = new Array(nx);
    var BbX = new Array(nx);
    var BcX = new Array(nx);
    for (var i=0; i<nx; i++) {
        BaX[i] = (new Complex(0, -dt/2)).multiply(HaX[i]); // BaX[0] is redundant
        BbX[i] = (new Complex(1, 0)).add((new Complex(0, -dt/2)).multiply(HbX[i]));
        BcX[i] = (new Complex(0, -dt/2)).multiply(HcX[i]); // BcX[N-1] is redundant
    }
    var BaY = new Array(ny);
    var BbY = new Array(ny);
    var BcY = new Array(ny);
    for (var i=0; i<ny; i++) {
        BaY[i] = (new Complex(0, -dt/2)).multiply(HaY[i]); // BaX[0] is redundant
        BbY[i] = (new Complex(1, 0)).add((new Complex(0, -dt/2)).multiply(HbY[i]));
        BcY[i] = (new Complex(0, -dt/2)).multiply(HcY[i]); // BcX[N-1] is redundant
    }
    return [HaX, HbX, HcX, AaX, AbX, AcX, BaX, BbX, BcX, HaY, HbY, HcY, AaY, AbY, AcY, BaY, BbY, BcY];
};

// Initialize 2D Psi
WavePacket2D.initialize2D = function(x, y, kx0, ky0, std) {
    var nx = x.length;
    var ny = y.length;
    var dx = x[1] - x[0];
    var dy = y[1] - y[0];
    
    var Psi = new Array(nx*ny);
    // Initialize
    for (var j=0; j<ny; j++) {
        for (var i=0; i<nx; i++) {
            Psi[j*nx+i] = new Complex(Math.exp(-(x[i]*x[i]/(std*std)+y[j]*y[j]/(std*std)))*Math.cos(kx0*x[i]+ky0*y[j]), Math.exp(-(x[i]*x[i]/(std*std)+y[j]*y[j]/(std*std)))*Math.sin(kx0*x[i]+ky0*y[j]));
        }
    }
    // Normalize
    var sum = 0;
    for (var j=0; j<ny; j++) {
        for (var i=0; i<nx; i++) {
            sum = sum + Psi[j*nx+i].conjugate().multiply(Psi[j*nx+i]).re;
        }
    }
    var norm = Math.sqrt(sum*dx*dy);
    for (var j=0; j<ny; j++) {
        for (var i=0; i<nx; i++) {
            Psi[j*nx+i] = Psi[j*nx+i].divide(new Complex(norm, 0));
        }
    }
    return Psi;
};

// Take square of Psi and take square root
WavePacket2D.sqrtSq = function(Psi)
{
    var n = Psi.length;
    var sqrtPsiSq = new Float64Array(n);
    for (var i=0; i<n; i++) {
        sqrtPsiSq[i] = 8*Math.sqrt(Psi[i].conjugate().multiply(Psi[i]).re);
    }
    return sqrtPsiSq;
};
