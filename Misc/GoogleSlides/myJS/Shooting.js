/*
 * Shooting.js
 * Shooting method for time-independent Schrodinger equation
 * Need to include Painter.js
 */

var Shooting = new Object();

window.addEventListener("load", function() {Shooting.loadHandler();}, false);
Shooting.loadHandler = function() {
	var shootManuDivs = document.getElementsByClassName("shootManu");
	for (var i=0; i<shootManuDivs.length; i++) {
		Shooting.setupManu(shootManuDivs[i]);
	}
	var shootAutoDivs = document.getElementsByClassName("shootAuto");
	for (var i=0; i<shootAutoDivs.length; i++) {
		Shooting.setupAuto(shootAutoDivs[i]);
	}
};

// Shooting method manual control setup
Shooting.setupManu = function(container) {
	// Get data from <div>{JSON}</div>
	var jsonData = JSON.parse(container.innerHTML);
	var xMin   = typeof jsonData.xMin   === "undefined" ? -2.0  : jsonData.xMin;
	var xMax   = typeof jsonData.xMax   === "undefined" ? 2.0   : jsonData.xMax;
	var dx     = typeof jsonData.dx     === "undefined" ? 0.001 : jsonData.dx;
	var EMin   = typeof jsonData.EMin   === "undefined" ? 0     : jsonData.EMin;
	var EMax   = typeof jsonData.EMax   === "undefined" ? 50    : jsonData.EMax;
	var cw     = typeof jsonData.cw     === "undefined" ? 0.80  : jsonData.cw;
	var ch     = typeof jsonData.ch     === "undefined" ? 0.65  : jsonData.ch;
	var xRange = typeof jsonData.xRange === "undefined" ? [-2.5, 2.5] : jsonData.xRange;
	var yRange = typeof jsonData.yRange === "undefined" ? [-2, 65]    : jsonData.yRange;
	
	// Add HTML elements
	var html = "";
	html += "<canvas></canvas><br />";
	html += "<div>Energy = </div>";
	html += "<input type='range' step='0.01' />";
	container.innerHTML = html;
	
	// Get HTML elements
	var plotCanvas = container.getElementsByTagName("canvas")[0];
	var energyText  = container.getElementsByTagName("div")[0];
	var energyRange = container.getElementsByTagName("input")[0];
	energyText.innerHTML = "Energy = " + EMin.toFixed(2);
	energyRange.min = EMin;
	energyRange.max = EMax;
	energyRange.value = EMin;
	
	// Setup
	var x = Shooting.setupGrid(xMin, xMax, dx);
	var V = Shooting.setupPotential(x);
	var E = parseFloat(energyRange.value);
	var psi = Shooting.shootManu(x, V, E);
	
	// Painter
    var myPainter = new Painter(plotCanvas);
    myPainter.setXRange(xRange[0], xRange[1]);
    myPainter.setYRange(yRange[0], yRange[1]);
    myPainter.setLabel("x", "Energy and \u03c8");
    
    // Initial plot
    plot();
    resize();
	
	// Add event listeners
	window.addEventListener("resize", resize, false);
	plotCanvas.addEventListener("mousemove", manuMoveHandler, false);
	plotCanvas.addEventListener("mousedown", manuDownHandler, false);
	plotCanvas.addEventListener("mouseup", manuUpHandler, false);
	plotCanvas.addEventListener("mouseout", manuOutHandler, false);
	energyRange.addEventListener("change", energyChangeHandler, false);
	energyRange.addEventListener("click", energyClickHandler, false);
	
	// Event handlers
	// Move energy on canvas
	var isDetected = false;
	var isDown     = false;
	var isFocused  = false;
	function manuDownHandler(evt) {evt.preventDefault(); isDown = true;}
	function manuUpHandler() {isDown = false; isFocused = false;}
	function manuOutHandler() {isDetected = false; document.body.style.cursor = "auto"; isDown = false; isFocused = false;}
	function manuMoveHandler(evt) {
		var marginWidth  = myPainter.marginWidth;
		var marginHeight = myPainter.marginHeight;
		var plotWidth    = myPainter.plotWidth;
		var plotHeight   = myPainter.plotHeight;
		var yScale       = myPainter.yScale;
		var yOrigin      = myPainter.yOrigin;
		
		var rect = plotCanvas.getBoundingClientRect();
		
		var mouseX = Math.round(evt.clientX - rect.left);
		var mouseY = Math.round(evt.clientY - rect.top);
		
		if (mouseX>=marginWidth && mouseX<=marginWidth+plotWidth && mouseY>=marginHeight && mouseY<=marginHeight+plotHeight) {
			if (isFocused == false) {
				if (mouseY>=yOrigin-E*yScale-5 && mouseY<=yOrigin-E*yScale+5) {
                    // energy detected
					isDetected = true;
					document.body.style.cursor = "pointer";
					
					if (isDown == true) {
						isFocused = true;
						document.body.style.cursor = "ns-resize";
					}
				} else {
                    // energy not detected
					isDetected = false;
					document.body.style.cursor = "auto";
				}
			}
			// Move energy
			if (isFocused == true) {
				// Get new energy
				energyRange.value = (yOrigin-mouseY)/yScale;
				E = parseFloat(energyRange.value);
				energyText.innerHTML = "Energy = " + E.toFixed(3);
				
				psi = Shooting.shootManu(x, V, E);
				
				// Plot graph
				plot();
			}
		}
		else {
			manuOutHandler();
        }
	}
    
	// Move energy range bar
	function energyChangeHandler() {
		E = parseFloat(energyRange.value);
		energyText.innerHTML = "Energy = " + E.toFixed(2);
		psi = Shooting.shootManu(x, V, E);
		plot();
	}
	function energyClickHandler() {
        energyRange.focus();
    }
	
	// Window resize
	function resize() {
	    plotCanvas.width  = container.clientWidth*cw;
	    plotCanvas.height = container.clientWidth*ch;
		myPainter.refresh();
	}
	
	function plot() {
		myPainter.setHoldOn(false);
		myPainter.plot(x, V, "rgb(0, 255, 0)");
		myPainter.setHoldOn(true);
		myPainter.plot(x, Shooting.psiOnE(psi, E, 4), "rgb(0, 0, 255)");
		myPainter.plotEnergy(E, "", "rgb(255, 0, 255)");
	}
};

// Shooting method auto shoot setup
Shooting.setupAuto = function(container) {
	// Get data from <div>{JSON}</div>
	var jsonData  = JSON.parse(container.innerHTML);
	var xMin  = typeof jsonData.xMin  === "undefined" ? -2.0  : jsonData.xMin;
	var xMax  = typeof jsonData.xMax  === "undefined" ? 2.0   : jsonData.xMax;
	var dx    = typeof jsonData.dx    === "undefined" ? 0.001 : jsonData.dx;
	var lLim  = typeof jsonData.lLim  === "undefined" ? 0.0   : jsonData.lLim;
	var uLim  = typeof jsonData.uLim  === "undefined" ? 60.0  : jsonData.uLim;
	var cw    = typeof jsonData.cw    === "undefined" ? 0.80  : jsonData.cw;
	var ch    = typeof jsonData.ch    === "undefined" ? 0.65  : jsonData.ch;
	var xRange = typeof jsonData.xRange === "undefined" ? [-2.5, 2.5] : jsonData.xRange;
    var yRange = typeof jsonData.yRange === "undefined" ? [-2, 65]    : jsonData.yRange;
	
	// Add HTML elements
	var html = "";
	html += "<canvas></canvas><br />";
	html += "Upper limit: <input type='text' value='60.0' size='6' /><br />";
	html += "Lower limit: <input type='text' value='0.0' size='6' /><br />";
	html += "<input type='button' value='Start' />";
	container.innerHTML = html;
	
	// Get HTML elements
	var plotCanvas  = container.getElementsByTagName("canvas")[0];
	var upperLimit  = container.getElementsByTagName("input")[0];
    var lowerLimit  = container.getElementsByTagName("input")[1];
	var startButton = container.getElementsByTagName("input")[2];
	upperLimit.value = uLim;
	lowerLimit.value = lLim;
	
	// Setup
	var x = Shooting.setupGrid(xMin, xMax, dx);
	var V = Shooting.setupPotential(x);
	var eigenList = new Array();
	
	// Painter
    var myPainter = new Painter(plotCanvas);
    myPainter.setXRange(xRange[0], xRange[1]);
    myPainter.setYRange(yRange[0], yRange[1]);
    myPainter.setLabel("x", "Energy and \u03c8");
    
    // Initial plot
    plot();
    resize();
	
	// Add event listeners
	window.addEventListener("resize", resize, false);
	startButton.addEventListener("click", startClickHandler, false);
	
	// Event handlers
	// Click start button
	function startClickHandler() {
		// Energy limits
		if (isNaN(lowerLimit.value) || !isFinite(lowerLimit.value) || isNaN(upperLimit.value) || !isFinite(upperLimit.value)) {
			alert("Inputs must be numbers!");
			return -1;
		}
		
		var ELow = parseFloat(lowerLimit.value);
		var EUp  = parseFloat(upperLimit.value);
		
		eigenList = Shooting.shootAuto(x, V, ELow, EUp);
		plot();
	}
	
	// Window resize
    function resize() {
        plotCanvas.width  = container.clientWidth*cw;
        plotCanvas.height = container.clientWidth*ch;
        myPainter.refresh();
    }
	
	function plot() {
		myPainter.setHoldOn(false);
		myPainter.plot(x, V, "rgb(0, 255, 0)");
		myPainter.setHoldOn(true);
		for (var i=0; i<eigenList.length; i++) {
			var xSub = eigenList[i][0];
			var psi  = eigenList[i][1];
			var E    = eigenList[i][2];
			myPainter.plot(xSub, Shooting.psiOnE(psi, E, 4), "rgb(0, 0, 255)");
			myPainter.plotEnergy(E, "", "rgb(255, 0, 255)");
		}
	}
};

// Shooting method manual
Shooting.shootManu = function(x, V, E) {
	// Shooting
	var psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, E);
	return psi;
};

// Shooting method auto
Shooting.shootAuto = function(x, V, ELow, EUp) {
	var eigenList = new Array();
	
	var psi;
	var lowNode, upNode;
	
	// Count nodes
	psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, ELow);
	lowNode = Shooting.countNode(psi);
	psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, EUp);
	upNode  = Shooting.countNode(psi);
	
	if (upNode-lowNode <= 0) {
		console.log("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
		return eigenList;
	}
	
	// Recursively divide energy to find only one node difference in between
	function divideEnergy(ELow, EUp) {
		var psi;
		var lowNode, upNode;
		var eigen;
		
		// Count nodes
		psi = Shooting.initialize(x);
		psi = Shooting.integrate(x, psi, V, ELow);
		lowNode = Shooting.countNode(psi);
		psi = Shooting.initialize(x);
		psi = Shooting.integrate(x, psi, V, EUp);
		upNode  = Shooting.countNode(psi);
		
		if (upNode-lowNode == 1) // base case
		{
			eigen = Shooting.bisect(x, V, ELow, EUp);
			if (eigen != -1)
				eigenList.push(eigen);
		}
		else if (upNode-lowNode > 1) // recursion
		{
			divideEnergy(ELow, (EUp+ELow)/2);
			divideEnergy((EUp+ELow)/2, EUp);
		}
	}
	divideEnergy(ELow, EUp);
	
	return eigenList;
};

// Setup 1D grid
Shooting.setupGrid = function(xMin, xMax, dx) {
	var n = Math.round((xMax-xMin)/dx + 1);
	var x = new Float64Array(n);
	for (var i=0; i<n; i++) {
		x[i] = xMin + dx*i;
	}
	return x;
};

// Infinite potential well
Shooting.setupPotential = function(x) {
	var n = x.length;
	var V = new Float64Array(n);
	for (var i=0; i<n; i++) {
		V[i] = 50*x[i]**2;
	}
	return V;
};

// Initialize psi
Shooting.initialize = function(x) {
	var n = x.length;
	var psi = new Float64Array(n);
	for (var i=0; i<n; i++) {
		psi[i] = 0;
    }
	
	// Initial condition
	psi[0] = 1.0e-8;
	psi[1] = 1.1e-8;
	
	return psi;
};

// Forward integration
Shooting.integrate = function(x, psi, V, E) {
	var n  = x.length;
	var dx = x[1] - x[0];
	
	for (var i=2; i<n; i++) {
		psi[i] = ((2-5/3*dx*dx*(E-V[i-1]))*psi[i-1] - (1+1/6*dx*dx*(E-V[i-2]))*psi[i-2]) / (1+1/6*dx*dx*(E-V[i]));
		if (isNaN(psi[i]) || !isFinite(psi[i])) {
            psi[i] = psi[i-1]; // in case diverges out of machine limit
        }
	}
    
	var area = 0;
	for (var i=0; i<n/2; i++) {
        // normalization based on left side, since right side diverges
		area += dx*psi[i]**2;
    }
	var norm = 1/Math.sqrt(2*area);
	for (var i=0; i<n; i++) {
		psi[i] *= norm;
	}
	return psi;
};

// *A+E for plotting
Shooting.psiOnE = function(psi, E, scale) {
	var n = psi.length;
	var psiOnE = new Float64Array(n);
	
	for (var i=0; i<n; i++) {
		psiOnE[i] = psi[i]*scale + E;
	}
	return psiOnE;
};

// Count the number of nodes
Shooting.countNode = function(psi) {
	var n = psi.length;
	var node = 0;
	for (var i=0; i<n-1; i++) {
		if (psi[i]*psi[i+1] < 0) {
			node++;
        }
	}
	return node;
};

// Bisection method
Shooting.bisect = function(x, V, ELow, EUp) {
	var n = x.length;
	
	var psi;
	var lowDir     = 0;
	var upDir      = 0;
	var currentDir = 0;
	
    var errmsg = "Eigen-energy not found in (" + ELow + ", " + EUp + ").";
    
	// Determine the initial direction of lowDir
	psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, ELow);
	lowDir = psi[n-1];
	
	// Determine the initial direction of upDir
	psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, EUp);
	upDir = psi[n-1];
	
	if (lowDir*upDir > 0) {
		console.log(errmsg);
		return -1;
	}
	
	var E = (ELow+EUp)/2;
	var itMax = 100;
	for (var it=1; it<=itMax; it++) {
		E = (ELow+EUp)/2;
		
		// Determine the direction of currentDir
		psi = Shooting.initialize(x);
		psi = Shooting.integrate(x, psi, V, E);
		currentDir = psi[n-1];
		
		// Check direction
		var eps = 1e-6;
		if (Math.abs(currentDir) < eps) {
			// Truncate diverging tail
			var stop = Math.floor(n/2);
			for (var i=n-1; i>=0; i--) {
				if (Math.abs(psi[i-1]) > Math.abs(psi[i])) {
					stop = i;
					break;
				}
			}
			var xSub   = x.subarray(0, stop);
			var psiSub = psi.subarray(0, stop);
			var node   = Shooting.countNode(psiSub);
			return [xSub, psiSub, E, node];
		} else {
			if (lowDir*upDir > 0) {
				console.log(errmsg);
				return -1;
			} else if (currentDir*lowDir > 0) {
				ELow = E;
				lowDir = currentDir;
			} else if (currentDir*upDir > 0) {
				EUp = E;
				upDir = currentDir;
			} else {
				console.log(errmsg);
				return -1;
			}
		}
	}
	// Cannot converge due to machine accuracy
	// Truncate diverging tail
	var stop = Math.floor(n/2);
	for (var i=n-1; i>=0; i--) {
		if (Math.abs(psi[i-1]) > Math.abs(psi[i])) {
			stop = i;
			break;
		}
	}
	var xSub   = x.subarray(0, stop);
	var psiSub = psi.subarray(0, stop);
	var node   = Shooting.countNode(psiSub);
	return [xSub, psiSub, E, node];
};
