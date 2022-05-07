/*
 * Shooting.js
 * Shooting method for time-independent Schrodinger equation
 * Need to include Painter.js
 */

var Shooting = new Object();

window.addEventListener("load", function() {Shooting.loadHandler();}, false);
Shooting.loadHandler = function()
{
	var shootManuDivs = document.getElementsByClassName("shootManu");
	for(var i=0; i<shootManuDivs.length; i++)
	{
		Shooting.setupManu(shootManuDivs[i]);
	}
	var shootAutoDivs = document.getElementsByClassName("shootAuto");
	for(var i=0; i<shootAutoDivs.length; i++)
	{
		Shooting.setupAuto(shootAutoDivs[i]);
	}
};

//Shooting method manual control setup
Shooting.setupManu = function(container)
{
	//Get data from <div>{JSON}</div>
	var jsonData   = JSON.parse(container.innerHTML);
	var xMin   = typeof jsonData.xMin   === "undefined" ? -2.0  : jsonData.xMin;
	var xMax   = typeof jsonData.xMax   === "undefined" ? 2.0   : jsonData.xMax;
	var dx     = typeof jsonData.dx     === "undefined" ? 0.001 : jsonData.dx;
	var VType  = typeof jsonData.VType  === "undefined" ? 0     : jsonData.VType;
	var EMin   = typeof jsonData.EMin   === "undefined" ? 0     : jsonData.EMin;
	var EMax   = typeof jsonData.EMax   === "undefined" ? 50    : jsonData.EMax;
	var cw     = typeof jsonData.cw     === "undefined" ? 0.80  : jsonData.cw;
	var ch     = typeof jsonData.ch     === "undefined" ? 0.65  : jsonData.ch;
	var xRange = typeof jsonData.xRange === "undefined" ? [-2.5, 2.5] : jsonData.xRange;
	var yRange = typeof jsonData.yRange === "undefined" ? [-2, 65]    : jsonData.yRange;
	
	//Add HTML elements
	var html = "";
	html += "<canvas></canvas><br />";
	if(VType == 4)
	{
		html += "<div>Alpha = -40.0</div>";
		html += "<input type='range' min='-50' max='10' step='0.1' value='-40.0' /><br />";
	}
	html += "<div>Energy = </div>";
	html += "<input type='range' step='0.001' />";
	container.innerHTML = html;
	
	//Get HTML elements
	var plotCanvas = container.getElementsByTagName("canvas")[0];
	var alphaText, energyText, alphaRange, energyRange;
	if(VType == 4)
	{
		alphaText   = container.getElementsByTagName("div")[0];
		energyText  = container.getElementsByTagName("div")[1];
		alphaRange  = container.getElementsByTagName("input")[0];
		energyRange = container.getElementsByTagName("input")[1];
	}
	else
	{
		energyText  = container.getElementsByTagName("div")[0];
		energyRange = container.getElementsByTagName("input")[0];
	}
	energyText.innerHTML = "Energy = " + EMin.toFixed(3);
	energyRange.min = EMin;
	energyRange.max = EMax;
	energyRange.value = EMin;
	
	//Setup
	var x = Shooting.setupGrid(xMin, xMax, dx);
	var V;
	switch(VType)
	{
	case 0:
		V = Shooting.setupPotential(x, function(xi) {return 0;});
		break;
	case 1:
		V = Shooting.setupPotential(x, function(xi) {return -20*xi+15;});
		break;
	case 2:
		V = Shooting.setupPotential(x, function(xi) {if(xi<=-1 || xi>=1) return 1000; else return 0;});
		break;
	case 3:
		V = Shooting.setupPotential(x, function(xi) {return 50*xi*xi;});
		break;
	case 4:
		V = Shooting.setupPotential(x, function(xi) {return 30*xi*xi*xi*xi-40*xi*xi;});
		break;
	default:
		V = Shooting.setupPotential(x, function(xi) {return 0;});
		break;
	}
	var E = parseFloat(energyRange.value);
	var psi = Shooting.shootManu(x, V, E, VType);
	
	//Painter
    var myPainter = new Painter(plotCanvas);
    myPainter.setXRange(xRange[0], xRange[1]);
    myPainter.setYRange(yRange[0], yRange[1]);
    myPainter.setLabel("x", "Energy and \u03c8");
    switch(VType)
    {
    case 0:
        myPainter.setTitle("Constant potential");
        break;
    case 1:
        myPainter.setTitle("Linear potential");
        break;
    case 2:
        myPainter.setTitle("Infinite potential well");
        break;
    case 3:
        myPainter.setTitle("Harmonic oscillator");
        break;
    case 4:
        myPainter.setTitle("W-shape potential well");
        break;
    default:
        myPainter.setTitle("Constant potential");
        break;
    }
    
    // Initial plot
    plot();
    resize();
	
	//Add event listeners
	window.addEventListener("resize", resize, false);
	plotCanvas.addEventListener("mousemove", manuMoveHandler, false);
	plotCanvas.addEventListener("mousedown", manuDownHandler, false);
	plotCanvas.addEventListener("mouseup", manuUpHandler, false);
	plotCanvas.addEventListener("mouseout", manuOutHandler, false);
	energyRange.addEventListener("change", energyChangeHandler, false);
	energyRange.addEventListener("click", energyClickHandler, false);
	if(VType == 4)
		alphaRange.addEventListener("change", potentialChangeHandler, false);
	
	//Event handlers
	//Move energy on canvas
	var isDetected = false;
	var isDown     = false;
	var isFocused  = false;
	function manuDownHandler(evt) {evt.preventDefault(); isDown = true;}
	function manuUpHandler() {isDown = false; isFocused = false;}
	function manuOutHandler() {isDetected = false; document.body.style.cursor = "auto"; isDown = false; isFocused = false;}
	function manuMoveHandler(evt)
	{
		var marginWidth  = myPainter.marginWidth;
		var marginHeight = myPainter.marginHeight;
		var plotWidth    = myPainter.plotWidth;
		var plotHeight   = myPainter.plotHeight;
		var yScale     = myPainter.yScale;
		var yOrigin    = myPainter.yOrigin;
		
		var rect = plotCanvas.getBoundingClientRect();
		
		var mouseX = Math.round(evt.clientX - rect.left);
		var mouseY = Math.round(evt.clientY - rect.top);
		
		if(mouseX>=marginWidth && mouseX<=marginWidth+plotWidth && mouseY>=marginHeight && mouseY<=marginHeight+plotHeight)
		{
			if(isFocused == false)
			{
				if(mouseY>=yOrigin-E*yScale-5 && mouseY<=yOrigin-E*yScale+5) //energy detected
				{		
					isDetected = true;
					document.body.style.cursor = "pointer";
					
					if(isDown == true)
					{
						isFocused = true;
						document.body.style.cursor = "n-resize";
					}
				}
				else //energy not detected
				{		
					isDetected = false;
					document.body.style.cursor = "auto";
				}
			}
			
			//Move energy
			if(isFocused == true)
			{
				//Get new energy
				energyRange.value = (yOrigin-mouseY)/yScale;
				E = parseFloat(energyRange.value);
				energyText.innerHTML = "Energy = " + E.toFixed(3);
				
				psi = Shooting.shootManu(x, V, E, VType);
				
				//Plot graph
				plot();
			}
		}
		else
			manuOutHandler();
	}
	
	//Potential change action
	function potentialChangeHandler()
	{
		//Change potential
		var alpha = parseFloat(alphaRange.value);
		alphaText.innerHTML = "Alpha = " + alpha.toFixed(1);
		V = Shooting.setupPotential(x, function(xi) {return 30*xi*xi*xi*xi+alpha*xi*xi;});
		
		psi = Shooting.shootManu(x, V, E, VType);
		
		//Plot graph
		plot();
	}
	
	//Move energy range bar
	function energyChangeHandler()
	{
		E = parseFloat(energyRange.value);
		energyText.innerHTML = "Energy = " + E.toFixed(3);
		
		psi = Shooting.shootManu(x, V, E, VType);
		
		//Plot graph
		plot();
	}
	function energyClickHandler() {energyRange.focus();}
	
	//Window resize
	function resize()
	{
	    plotCanvas.width  = container.clientWidth*cw;
	    plotCanvas.height = container.clientWidth*ch;
		
		myPainter.refresh();
	}
	
	function plot()
	{
		myPainter.setHoldOn(false);
		myPainter.plot(x, V, "rgb(0, 255, 0)");
		myPainter.setHoldOn(true);
		myPainter.plot(x, Shooting.psiOnE(psi, E, VType), "rgb(0, 0, 255)");
		myPainter.plotEnergy(E, "", "rgb(255, 0, 255)");
	}
};

//Shooting method auto shoot setup
Shooting.setupAuto = function(container)
{
	//Get data from <div>{JSON}</div>
	var jsonData  = JSON.parse(container.innerHTML);
	var xMin  = typeof jsonData.xMin  === "undefined" ? -2.0  : jsonData.xMin;
	var xMax  = typeof jsonData.xMax  === "undefined" ? 2.0   : jsonData.xMax;
	var dx    = typeof jsonData.dx    === "undefined" ? 0.001 : jsonData.dx;
	var VType = typeof jsonData.VType === "undefined" ? 0     : jsonData.VType;
	var lLim  = typeof jsonData.lLim  === "undefined" ? 0.0   : jsonData.lLim;
	var uLim  = typeof jsonData.uLim  === "undefined" ? 60.0  : jsonData.uLim;
	var cw    = typeof jsonData.cw    === "undefined" ? 0.80  : jsonData.cw;
	var ch    = typeof jsonData.ch    === "undefined" ? 0.65  : jsonData.ch;
	var xRange = typeof jsonData.xRange === "undefined" ? [-2.5, 2.5] : jsonData.xRange;
    var yRange = typeof jsonData.yRange === "undefined" ? [-2, 65]    : jsonData.yRange;
	
	//Add HTML elements
	var html = "";
	html += "<canvas></canvas><br />";
	if(VType == 4)
	{
		html += "<div>Alpha = -40.0</div>";
		html += "<input type='range' min='-50' max='10' step='0.1' value='-40.0' /><br />";
	}
	html += "Upper limit: <input type='text' value='60.0' size='6' /><br />";
	html += "Lower limit: <input type='text' value='0.0' size='6' /><br />";
	html += "<input type='button' value='Start' />";
	container.innerHTML = html;
	
	//Get HTML elements
	var plotCanvas  = container.getElementsByTagName("canvas")[0];
	var alphaText, alphaRange, upperLimit, lowerLimit, startButton;
	if(VType == 4)
	{
		alphaText   = container.getElementsByTagName("div")[0];
		alphaRange  = container.getElementsByTagName("input")[0];
		upperLimit  = container.getElementsByTagName("input")[1];
		lowerLimit  = container.getElementsByTagName("input")[2];
		startButton = container.getElementsByTagName("input")[3];
	}
	else
	{
		upperLimit  = container.getElementsByTagName("input")[0];
		lowerLimit  = container.getElementsByTagName("input")[1];
		startButton = container.getElementsByTagName("input")[2];
	}
	upperLimit.value = uLim;
	lowerLimit.value = lLim;
	
	//Setup
	var x = Shooting.setupGrid(xMin, xMax, dx);
	var V;
	switch(VType)
	{
	case 0:
		V = Shooting.setupPotential(x, function(xi) {return 0;});
		break;
	case 1:
		V = Shooting.setupPotential(x, function(xi) {return -20*xi+15;});
		break;
	case 2:
		V = Shooting.setupPotential(x, function(xi) {if(xi<=-1 || xi>=1) return 1000; else return 0;});
		break;
	case 3:
		V = Shooting.setupPotential(x, function(xi) {return 50*xi*xi;});
		break;
	case 4:
		V = Shooting.setupPotential(x, function(xi) {return 30*xi*xi*xi*xi-40*xi*xi;});
		break;
	default:
		V = Shooting.setupPotential(x, function(xi) {return 0;});
		break;
	}
	var eigenList = new Array();
	
	//Painter
    var myPainter = new Painter(plotCanvas);
    myPainter.setXRange(xRange[0], xRange[1]);
    myPainter.setYRange(yRange[0], yRange[1]);
    myPainter.setLabel("x", "Energy and \u03c8");
    switch(VType)
    {
    case 0:
        myPainter.setTitle("Constant potential");
        break;
    case 1:
        myPainter.setTitle("Linear potential");
        break;
    case 2:
        myPainter.setTitle("Infinite potential well");
        break;
    case 3:
        myPainter.setTitle("Harmonic oscillator");
        break;
    case 4:
        myPainter.setTitle("W-shape potential well");
        break;
    default:
        myPainter.setTitle("Constant potential");
        break;
    }
    
    // Initial plot
    plot();
    resize();
	
	//Add event listeners
	window.addEventListener("resize", resize, false);
	startButton.addEventListener("click", startClickHandler, false);
	if(VType == 4)
		alphaRange.addEventListener("change", potentialChangeHandler, false);
	
	//Event handlers
	//Click start button
	function startClickHandler()
	{
		//Energy limits
		if(isNaN(lowerLimit.value) || !isFinite(lowerLimit.value) || isNaN(upperLimit.value) || !isFinite(upperLimit.value))
		{
			alert("Inputs must be numbers!");
			return -1;
		}
		
		var ELow = parseFloat(lowerLimit.value);
		var EUp  = parseFloat(upperLimit.value);
		
		eigenList = Shooting.shootAuto(x, V, ELow, EUp, VType);
		
		//Plot all eigen functions
		plot();
	}
	
	//Potential change action
	function potentialChangeHandler()
	{
		//Change potential
		var alpha = parseFloat(alphaRange.value);
		alphaText.innerHTML = "Alpha = " + alpha.toFixed(1);
		V = Shooting.setupPotential(x, function(xi) {return 30*xi*xi*xi*xi+alpha*xi*xi;});
		
		myPainter.setHoldOn(false);
		myPainter.plot(x, V, "rgb(0, 255, 0)");
	}
	
	//Window resize
    function resize()
    {
        plotCanvas.width  = container.clientWidth*cw;
        plotCanvas.height = container.clientWidth*ch;
        
        myPainter.refresh();
    }
	
	function plot()
	{
		myPainter.setHoldOn(false);
		myPainter.plot(x, V, "rgb(0, 255, 0)");
		myPainter.setHoldOn(true);
		for(var i=0; i<eigenList.length; i++)
		{
			var xSub = eigenList[i][0];
			var psi  = eigenList[i][1];
			var E    = eigenList[i][2];
			myPainter.plot(xSub, Shooting.psiOnE(psi, E, VType), "rgb(0, 0, 255)");
			myPainter.plotEnergy(E, "", "rgb(255, 0, 255)");
		}
	}
};

//Shooting method manual
Shooting.shootManu = function(x, V, E, VType)
{
	//Shooting
	var psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, E);
	psi = Shooting.normalize(x, psi, VType);
	
	return psi;
};

//Shooting method auto
Shooting.shootAuto = function(x, V, ELow, EUp, VType)
{
	var eigenList = new Array();
	
	var psi;
	var lowNode, upNode;
	
	//Count nodes
	psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, ELow);
	psi = Shooting.normalize(x, psi, VType);
	lowNode = Shooting.countNode(psi);
	psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, EUp);
	psi = Shooting.normalize(x, psi, VType);
	upNode  = Shooting.countNode(psi);
	
	if(upNode-lowNode <= 0)
	{
		alert("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
		return eigenList;
	}
	
	//Recursively divide energy to find only one node difference in between
	function divideEnergy(ELow, EUp)
	{
		var psi;
		var lowNode, upNode;
		var eigen;
		
		//Count nodes
		psi = Shooting.initialize(x);
		psi = Shooting.integrate(x, psi, V, ELow);
		psi = Shooting.normalize(x, psi, VType);
		lowNode = Shooting.countNode(psi);
		psi = Shooting.initialize(x);
		psi = Shooting.integrate(x, psi, V, EUp);
		psi = Shooting.normalize(x, psi, VType);
		upNode  = Shooting.countNode(psi);
		
		if(upNode-lowNode == 1) //base case
		{
			eigen = Shooting.bisect(x, V, ELow, EUp, VType);
			if(eigen != -1)
				eigenList.push(eigen);
		}
		else if(upNode-lowNode > 1) //recursion
		{
			divideEnergy(ELow, (EUp+ELow)/2);
			divideEnergy((EUp+ELow)/2, EUp);
		}
	}
	divideEnergy(ELow, EUp);
	
	return eigenList;
};

//Setup 1D grid
Shooting.setupGrid = function(xMin, xMax, dx)
{
	var n = Math.round((xMax-xMin)/dx + 1);
	var x = new Float64Array(n);
	for(var i=0; i<n; i++)
	{
		x[i] = xMin + dx*i;
	}
	return x;
};

//Infinite potential well
Shooting.setupPotential = function(x, Vi)
{
	var n = x.length;
	var V = new Float64Array(n);
	for(var i=0; i<n; i++)
	{
		V[i] = Vi(x[i]);
	}
	return V;
};

//Initialize psi
Shooting.initialize = function(x)
{
	var n = x.length;
	var psi = new Float64Array(n);
	for(var i=0; i<n; i++)
		psi[i] = 0;
	
	//Initial condition
	psi[0] = 1.0;
	psi[1] = 1.0;
	
	return psi;
};

//Forward integration
Shooting.integrate = function(x, psi, V, E)
{
	var n  = x.length;
	var dx = x[1] - x[0];
	
	for(var i=2; i<n; i++)
	{
		psi[i] = ((2-5/3*dx*dx*(E-V[i-1]))*psi[i-1] - (1+1/6*dx*dx*(E-V[i-2]))*psi[i-2]) / (1+1/6*dx*dx*(E-V[i]));
		if(isNaN(psi[i]) || !isFinite(psi[i])) //in case diverges out of machine limit
			psi[i] = psi[i-1];
	}
	
	return psi;
};

//Normalization
Shooting.normalize = function(x, psi, VType)
{
	var n  = x.length;
	var dx = x[1] - x[0];
	
	if(VType == 0 || VType == 1)
	{
		var max = Math.abs(psi[0]);
		for(var i=0; i<n-1; i++)
		{
			if(max < Math.abs(psi[i+1]))
				max = Math.abs(psi[i+1]);
		}
		
		for(var i=0; i<n; i++)
			psi[i] = psi[i]/max;
	}
	else
	{
		var sum = 0;
		for(var i=0; i<n/2; i++) //normalization based on left side, since right side diverges
			sum = sum + psi[i]*psi[i];
		
		var norm = Math.sqrt(2*sum*dx);
		for(var i=0; i<n; i++)
			psi[i] = psi[i]/norm;
	}
	
	return psi;
};

//*A+E for plotting
Shooting.psiOnE = function(psi, E, VType)
{
	var n = psi.length;
	var psiOnE = new Float64Array(n);
	
	var A = 4;
	if(VType == 0)
		A = 5;
	else if(VType == 1)
		A = 10;
	
	for(var i=0; i<n; i++)
		psiOnE[i] = psi[i]*A + E;
	
	return psiOnE;
};

//Count the number of nodes
Shooting.countNode = function(psi)
{
	var nNode = 0;
	var preValue = 0;
	var curValue = 0;
	
	var n = psi.length;
	for(var i=0; i<n; i++)
	{
		curValue = psi[i];
		if(preValue*curValue < 0) //node detected
			nNode++;
		preValue = curValue;
	}
	
	return nNode;
};

//Bisection method
Shooting.bisect = function(x, V, ELow, EUp, VType)
{
	var n = x.length;
	
	var psi;
	var lowDir     = 0;
	var upDir      = 0;
	var currentDir = 0;
	
	//Determine the initial direction of lowDir
	psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, ELow);
	psi = Shooting.normalize(x, psi, VType);
	lowDir = psi[n-1];
	
	//Determine the initial direction of upDir
	psi = Shooting.initialize(x);
	psi = Shooting.integrate(x, psi, V, EUp);
	psi = Shooting.normalize(x, psi, VType);
	upDir = psi[n-1];
	
	if(lowDir*upDir > 0)
	{
		alert("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
		return -1;
	}
	
	var E = (ELow+EUp)/2;
	var itMax = 100;
	for(var it=1; it<=itMax; it++)
	{
		E = (ELow+EUp)/2;
		
		//Determine the direction of currentDir
		psi = Shooting.initialize(x);
		psi = Shooting.integrate(x, psi, V, E);
		psi = Shooting.normalize(x, psi, VType);
		currentDir = psi[n-1];
		
		//Check direction
		var eps = 1e-6;
		if(Math.abs(currentDir) < eps)
		{
			//Truncate diverging tail
			var stop = Math.floor(n/2);
			for(var i=n-1; i>=0; i--)
			{
				if(Math.abs(psi[i-1]) > Math.abs(psi[i]))
				{
					stop = i;
					break;
				}
			}
			var xSub   = x.subarray(0, stop);
			var psiSub = psi.subarray(0, stop);
			var node   = Shooting.countNode(psiSub);
			return [xSub, psiSub, E, node];
		}
		else
		{
			if(lowDir*upDir > 0)
			{
				alert("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
				return -1;
			}
			else if(currentDir*lowDir > 0)
			{
				ELow = E;
				lowDir = currentDir;
			}
			else if(currentDir*upDir > 0)
			{
				EUp = E;
				upDir = currentDir;
			}
			else
			{
				alert("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
				return -1;
			}
		}
	}
	//Cannot converge due to machine accuracy
	//Truncate diverging tail
	var stop = Math.floor(n/2);
	for(var i=n-1; i>=0; i--)
	{
		if(Math.abs(psi[i-1]) > Math.abs(psi[i]))
		{
			stop = i;
			break;
		}
	}
	var xSub   = x.subarray(0, stop);
	var psiSub = psi.subarray(0, stop);
	var node   = Shooting.countNode(psiSub);
	return [xSub, psiSub, E, node];
};
