/*
 * WavePacket.js
 * Wave packet in 1D space
 * Need to include Complex.js, CrankNicolson.js, Painter.js
 */

var WavePacket = new Object();

window.addEventListener("load", function() {WavePacket.loadHandler();}, false);
WavePacket.loadHandler = function()
{
	var WavePacketDivs = document.getElementsByClassName("WavePacket");
	for(var i=0; i<WavePacketDivs.length; i++)
	{
		WavePacket.setupWP(WavePacketDivs[i]);
	}
};

//Wave packet setup
WavePacket.setupWP = function(container)
{
	//Get data from <div>{JSON}</div>
	var jsonData   = JSON.parse(container.innerHTML);
	var xMin   = typeof jsonData.xMin   === "undefined" ? -4.0  : jsonData.xMin;
	var xMax   = typeof jsonData.xMax   === "undefined" ? 4.0   : jsonData.xMax;
	var dx     = typeof jsonData.dx     === "undefined" ? 0.01  : jsonData.dx;
	var tMax   = typeof jsonData.tMax   === "undefined" ? 5.000 : jsonData.tMax;
	var dt     = typeof jsonData.dt     === "undefined" ? 0.002 : jsonData.dt;
	var VType  = typeof jsonData.VType  === "undefined" ? 0     : jsonData.VType;
	var BC     = typeof jsonData.BC     === "undefined" ? 0     : jsonData.BC;
	var k0Min  = typeof jsonData.k0Min  === "undefined" ? -10   : jsonData.k0Min;
	var k0Max  = typeof jsonData.k0Max  === "undefined" ? 10    : jsonData.k0Max;
	var stdMin = typeof jsonData.stdMin === "undefined" ? 0.2   : jsonData.stdMin;
	var stdMax = typeof jsonData.stdMax === "undefined" ? 0.8   : jsonData.stdMax;
	var x0Min  = typeof jsonData.x0Min  === "undefined" ? -2.0  : jsonData.x0Min;
	var x0Max  = typeof jsonData.x0Max  === "undefined" ? 2.0   : jsonData.x0Max;
	var cw     = typeof jsonData.cw     === "undefined" ? 0.80  : jsonData.cw;
	var ch     = typeof jsonData.ch     === "undefined" ? 0.45  : jsonData.ch;
    var xRange = typeof jsonData.xRange === "undefined" ? [-4, 4] : jsonData.xRange;
    var yRange = typeof jsonData.yRange === "undefined" ? [0, 85] : jsonData.yRange;
	
	//Add HTML elements
	var html = "";
	html += "<canvas></canvas><br />";
	html += "<div>t = 0.000</div>";
	html += "<input type='checkbox' />Show phase";
	html += "<table>";
	html += "<tr><td class='text'>k<sub>0</sub> = 0.00</td>";
	html += "<td><input type='range' step='0.01' value='0.00' /></td></tr>";
	html += "<tr><td class='text'>std = 0.45</td>";
	html += "<td><input type='range' step='0.01' value='0.45' /></td></tr>";
	html += "<tr><td class='text'>x<sub>0</sub> = 0.00</td>";
	html += "<td><input type='range' step='0.01' value='0.00' /></td></tr>";
	html += "</table>";
	html += "<input type='button' value='\u25b6' />";
	html += "<input type='button' value='\u2759\u2759' />";
	html += "<input type='button' value='\u220e' />";
	container.innerHTML = html;
	
	//Get HTML elements
	var plotCanvas  = container.getElementsByTagName("canvas")[0];
	var timeText    = container.getElementsByTagName("div")[0];
	var phaseCheck  = container.getElementsByTagName("input")[0];
	var k0Text      = container.getElementsByTagName("td")[0];
	var stdText     = container.getElementsByTagName("td")[2];
	var x0Text      = container.getElementsByTagName("td")[4];
	var k0Range     = container.getElementsByTagName("input")[1];
	var stdRange    = container.getElementsByTagName("input")[2];
	var x0Range     = container.getElementsByTagName("input")[3];
	var startButton = container.getElementsByTagName("input")[4];
	var pauseButton = container.getElementsByTagName("input")[5];
	var stopButton  = container.getElementsByTagName("input")[6];
	
	k0Range.min  = k0Min;
	k0Range.max  = k0Max;
	stdRange.min = stdMin;
	stdRange.max = stdMax;
	x0Range.min  = x0Min;
	x0Range.max  = x0Max;
	startButton.disabled = "";
	pauseButton.disabled = "disabled";
	stopButton.disabled  = "disabled";
	
	//Setup
	var x, xLOut, xIn, xROut;
	if(BC != 2)
		x = WavePacket.setupGrid(xMin, xMax, dx);
	else
	{
		var xxxx = WavePacket.setupNonUniGrid(xMin-(xMax-xMin)*3, xMin, xMax, xMax+(xMax-xMin)*3, 5*dx, dx);
		x     = xxxx[0];
		xLOut = xxxx[1];
		xIn   = xxxx[2];
		xROut = xxxx[3];
	}
	var t = WavePacket.setupGrid(0, tMax, dt);
	var V;
	switch(VType)
	{
	case 0:
		V = WavePacket.setupPotential(x, function(xi) {return 0;});
		break;
	case 1:
		V = WavePacket.setupPotential(x, function(xi) {return 50*xi*xi;});
		break;
	case 2:
		V = WavePacket.setupPotential(x, function(xi) {return 10*(xi+4.0);});
		break;
	case 3:
		V = WavePacket.setupPotential(x, function(xi) {return 5*Math.sin(2*Math.PI*xi/1-Math.PI/2)+5;});
		break;
	case 4:
		V = WavePacket.setupPotential(x, function(xi) {return -80/(Math.exp(2*xi)+Math.exp(-2*xi))/(Math.exp(2*xi)+Math.exp(-2*xi))+20;});
		break;
	default:
		V = WavePacket.setupPotential(x, function(xi) {return 0;});
		break;
	}
	var H;
	if(BC != 2)
		H = WavePacket.setupHamiltonian(x, dt, V);
	else
		H = WavePacket.setupNonUniHamiltonian(xLOut, xIn, xROut, dt, V);
	var Ha = H[0], Hb = H[1], Hc = H[2], Aa = H[3], Ab = H[4], Ac = H[5], Ba = H[6], Bb = H[7], Bc = H[8];
	var k0  = parseFloat(k0Range.value);
	var std = parseFloat(stdRange.value);
	var x0  = parseFloat(x0Range.value);
	var Psi, E;
	if(BC != 2)
	{
		Psi = WavePacket.initialize(x, k0, std, x0);
		E   = WavePacket.expectE(x, Ha, Hb, Hc, Psi);
	}
	else
	{
		Psi = WavePacket.initializeNonUni(xLOut, xIn, xROut, k0, std, x0);
		E   = WavePacket.expectENonUni(xLOut, xIn, xROut, Ha, Hb, Hc, Psi);
	}
	
	//Painter
    var myPainter = new Painter(plotCanvas);
    myPainter.setXRange(xRange[0], xRange[1]);
    myPainter.setYRange(yRange[0], yRange[1]);
    myPainter.setLabel("x", "Energy and |\u03a8|");
    switch(VType)
    {
    case 0:
        myPainter.setTitle("Wave packet in constant potential");
        break;
    case 1:
        myPainter.setTitle("Wave packet in harmonic potential");
        break;
    case 2:
        myPainter.setTitle("Wave packet in linear potential");
        break;
    case 3:
        myPainter.setTitle("Wave packet in sinusoidal potential");
        break;
    case 4:
        myPainter.setTitle("Wave packet in reflectionless potential");
        break;
    default:
        myPainter.setTitle("Wave packet in constant potential");
        break;
    }
	
	//Initial plot
    plot();
    resize();
	
	//Add event listeners
	window.addEventListener("resize", resize, false);
	phaseCheck.addEventListener("change", plot, false);
	k0Range.addEventListener("change", inputChangeHandler, false);
	stdRange.addEventListener("change", inputChangeHandler, false);
	x0Range.addEventListener("change", inputChangeHandler, false);
	startButton.addEventListener("click", startClickHandler, false);
	pauseButton.addEventListener("click", pauseClickHandler, false);
	stopButton.addEventListener("click", stopClickHandler, false);
	
	//Event handlers
	//Start to solve PDE
	var playState = 0;
	function startClickHandler()
	{
		if(playState == 0) //is stopped
		{
			playState = 1;
			
			//Time iteration
			var it = 1;
			function iterate()
			{
				if(playState == 0) //stop
				{
					k0Range.disabled     = "";
					stdRange.disabled    = "";
					x0Range.disabled     = "";
					startButton.disabled = "";
					pauseButton.disabled = "disabled";
					stopButton.disabled  = "disabled";
					
					timeText.innerHTML = "t = 0.000";
					
					if(BC != 2)
						Psi = WavePacket.initialize(x, k0, std, x0);
					else
						Psi = WavePacket.initializeNonUni(xLOut, xIn, xROut, k0, std, x0);
					
					//Plot
					plot();
					
					return 0;
				}
				if(playState == 1) //play
				{
					k0Range.disabled     = "disabled";
					stdRange.disabled    = "disabled";
					x0Range.disabled     = "disabled";
					startButton.disabled = "disabled";
					pauseButton.disabled = "";
					stopButton.disabled  = "";
					
					timeText.innerHTML = "t = " + t[it].toFixed(3);
					
					//Crank Nicolson integration
					if(BC != 1)
						Psi = CrankNicolson.complexTridiagmatrixSolver(Aa, Ab, Ac, CrankNicolson.complexTridiagmatrixMultiplyVector(Ba, Bb, Bc, Psi));
					else
						Psi = CrankNicolson.complexPeriodicTridiagmatrixSolver(Aa, Ab, Ac, CrankNicolson.complexPeriodicTridiagmatrixMultiplyVector(Ba, Bb, Bc, Psi));
					
					//Plot
					plot();
					
					//Iterate
					it++;
					if(it>=t.length)
						playState = 0;
				}
				if(playState == 2) //pause
				{
					k0Range.disabled     = "disabled";
					stdRange.disabled    = "disabled";
					x0Range.disabled     = "disabled";
					startButton.disabled = "";
					pauseButton.disabled = "disabled";
					stopButton.disabled  = "";
				}
				setTimeout(function() {iterate();}, 5);
			}
			setTimeout(function() {iterate();}, 5);
		}
		else //is paused
			playState = 1;
	}
	function pauseClickHandler() {playState = 2;}
	function stopClickHandler() {playState = 0;}
	
	//Input change action
	function inputChangeHandler()
	{
		k0  = parseFloat(k0Range.value);
		std = parseFloat(stdRange.value);
		x0  = parseFloat(x0Range.value);
		
		k0Text.innerHTML  = "k<sub>0</sub> = " + k0.toFixed(2);
		stdText.innerHTML = "std = " + std.toFixed(2);
		x0Text.innerHTML  = "x<sub>0</sub> = " + x0.toFixed(2);
		
		if(BC != 2)
		{
			Psi = WavePacket.initialize(x, k0, std, x0);
			E   = WavePacket.expectE(x, Ha, Hb, Hc, Psi);
		}
		else
		{
			Psi = WavePacket.initializeNonUni(xLOut, xIn, xROut, k0, std, x0);
			E   = WavePacket.expectENonUni(xLOut, xIn, xROut, Ha, Hb, Hc, Psi);
		}
		
		//Re-plot
		plot();
	}
	
	//Window resize
	function resize()
	{
		//Canvas new width and height
		plotCanvas.width  = container.clientWidth*cw;
		plotCanvas.height = container.clientWidth*ch;
		
		myPainter.refresh();
	}
	
	function plot()
	{
		if(phaseCheck.checked)
		{
			if(BC != 2)
			{
			    var phase = complexToPhase(Psi);
				myPainter.setHoldOn(false);
				myPainter.plot(x, V, "rgb(0, 255, 0)");
				myPainter.setHoldOn(true);
				myPainter.plotPhase(x, WavePacket.sqrtSqOnE(Psi, E), phase, E);
				myPainter.plotEnergy(E, "", "rgb(255, 0, 255)");
			}
			else
			{
			    var phase = complexToPhase(Psi.slice(xLOut.length, xLOut.length+xIn.length));
				myPainter.setHoldOn(false);
				myPainter.plot(xIn, V.subarray(xLOut.length, xLOut.length+xIn.length), "rgb(0, 255, 0)");
				myPainter.setHoldOn(true);
				myPainter.plotPhase(xIn, WavePacket.sqrtSqOnE(Psi.slice(xLOut.length, xLOut.length+xIn.length), E), phase, E);
				myPainter.plotEnergy(E, "", "rgb(255, 0, 255)");
			}
		}
		else
		{
			if(BC != 2)
			{
				myPainter.setHoldOn(false);
				myPainter.plot(x, V, "rgb(0, 255, 0)");
				myPainter.setHoldOn(true);
				myPainter.plot(x, WavePacket.sqrtSqOnE(Psi, E), "rgb(0, 0, 255)");
				myPainter.plotEnergy(E, "", "rgb(255, 0, 255)");
			}
			else
			{
				myPainter.setHoldOn(false);
				myPainter.plot(xIn, V.subarray(xLOut.length, xLOut.length+xIn.length), "rgb(0, 255, 0)");
				myPainter.setHoldOn(true);
				myPainter.plot(xIn, WavePacket.sqrtSqOnE(Psi.slice(xLOut.length, xLOut.length+xIn.length), E), "rgb(0, 0, 255)");
				myPainter.plotEnergy(E, "", "rgb(255, 0, 255)");
			}
		}
	}
	
	function complexToPhase(z) {
	    var phi = new Float64Array(z.length);
	    for (var i=0; i<z.length; i++) {
	        phi[i] = z[i].phase();
	    }
	    return phi;
	}
};

//Setup 1D grid
WavePacket.setupGrid = function(xMin, xMax, dx)
{
	var n = Math.round((xMax-xMin)/dx + 1);
	var x = new Float64Array(n);
	for(var i=0; i<n; i++)
	{
		x[i] = xMin + dx*i;
	}
	return x;
};

//Setup 1D non-uniform grid
WavePacket.setupNonUniGrid = function(xL, xLM, xRM, xR, dxOut, dxIn)
{
	var xLOut = WavePacket.setupGrid(xL, xLM-dxOut, dxOut);
	var xIn   = WavePacket.setupGrid(xLM, xRM, dxIn);
	var xROut = WavePacket.setupGrid(xRM+dxOut, xR, dxOut);
	var nLOut = xLOut.length, nIn = xIn.length, nROut = xROut.length;
	var n = nLOut + nIn + nROut;
	var x = new Float64Array(n);
	x.set(xLOut, 0);
	x.set(xIn, nROut);
	x.set(xROut, nLOut+nIn);
	return [x, xLOut, xIn, xROut];
};

//Potential distribution
WavePacket.setupPotential = function(x, Vi)
{
	var n = x.length;
	var V = new Float64Array(n);
	for(var i=0; i<n; i++)
	{
		V[i] = Vi(x[i]);
	}
	return V;
};

//Setup tridiagonal matrix of Hamiltonian
WavePacket.setupHamiltonian = function(x, dt, V)
{
	var n  = x.length;
	var dx = x[1] - x[0];
	
	//Tridiagonal matrices
	//The 3 diagonal vectors of the Hamiltonian matrix H
	var Ha = new Array(n);
	var Hb = new Array(n);
	var Hc = new Array(n);
	for(var i=0; i<n; i++)
	{
		Ha[i] = new Complex(-0.5/(dx*dx), 0); //Ha[0] is redundant
		Hb[i] = new Complex(1/(dx*dx)+V[i], 0);
		Hc[i] = new Complex(-0.5/(dx*dx), 0); //Hc[n-1] is redundant
	}
	//The 3 diagonal vectors of matrix A = I + dt/2*i*H
	var Aa = new Array(n);
	var Ab = new Array(n);
	var Ac = new Array(n);
	for(var i=0; i<n; i++)
	{
		Aa[i] = (new Complex(0, dt/2)).multiply(Ha[i]); //Aa[0] is redundant
		Ab[i] = (new Complex(1, 0)).add((new Complex(0, dt/2)).multiply(Hb[i]));
		Ac[i] = (new Complex(0, dt/2)).multiply(Hc[i]); //Ac[n-1] is redundant
	}
	//The 3 diagonal vectors of matrix B = I - dt/2*i*H
	var Ba = new Array(n);
	var Bb = new Array(n);
	var Bc = new Array(n);
	for(var i=0; i<n; i++)
	{
		Ba[i] = (new Complex(0, -dt/2)).multiply(Ha[i]); //Ba[0] is redundant
		Bb[i] = (new Complex(1, 0)).add((new Complex(0, -dt/2)).multiply(Hb[i]));
		Bc[i] = (new Complex(0, -dt/2)).multiply(Hc[i]); //Bc[n-1] is redundant
	}
	return [Ha, Hb, Hc, Aa, Ab, Ac, Ba, Bb, Bc];
};

//Setup tridiagonal matrix of Hamiltonian with non-uniform grid
WavePacket.setupNonUniHamiltonian = function(xLOut, xIn, xROut, dt, V)
{
	var nLOut = xLOut.length, nIn = xIn.length, nROut = xROut.length;
	var n     = nLOut + nIn + nROut;
	var dxOut = xLOut[1] - xLOut[0];
	var dxIn  = xIn[1] - xIn[0];
	
	//Tridiagonal matrices
	//The 3 diagonal vectors of the Hamiltonian matrix H
	var Ha = new Array(n);
	var Hb = new Array(n);
	var Hc = new Array(n);
	for(var i=0; i<nLOut; i++)
	{
		Ha[i] = new Complex(-0.5/(dxOut*dxOut), 0); //Ha[0] is redundant
		Hb[i] = new Complex(1/(dxOut*dxOut)+V[i], 0);
		Hc[i] = new Complex(-0.5/(dxOut*dxOut), 0);
	}
	for(var i=nLOut; i<nLOut+nIn; i++)
	{
		Ha[i] = new Complex(-0.5/(dxIn*dxIn), 0);
		Hb[i] = new Complex(1/(dxIn*dxIn)+V[i], 0);
		Hc[i] = new Complex(-0.5/(dxIn*dxIn), 0);
	}
	for(var i=nLOut+nIn; i<n; i++)
	{
		Ha[i] = new Complex(-0.5/(dxOut*dxOut), 0);
		Hb[i] = new Complex(1/(dxOut*dxOut)+V[i], 0);
		Hc[i] = new Complex(-0.5/(dxOut*dxOut), 0); //Hc[N-1] is redundant
	}
	Ha[nLOut]       = new Complex(-0.5*dxIn/(0.5*dxIn*dxOut*(dxIn+dxOut)), 0);
	Hb[nLOut]       = new Complex(0.5*(dxIn+dxOut)/(0.5*dxIn*dxOut*(dxIn+dxOut))+V[nLOut], 0);
	Hc[nLOut]       = new Complex(-0.5*dxOut/(0.5*dxIn*dxOut*(dxIn+dxOut)), 0);
	Ha[nLOut+nIn-1] = new Complex(-0.5*dxOut/(0.5*dxIn*dxOut*(dxIn+dxOut)), 0);
	Hb[nLOut+nIn-1] = new Complex(0.5*(dxIn+dxOut)/(0.5*dxIn*dxOut*(dxIn+dxOut))+V[nLOut+nIn-1], 0);
	Hc[nLOut+nIn-1] = new Complex(-0.5*dxIn/(0.5*dxIn*dxOut*(dxIn+dxOut)), 0);
	//The 3 diagonal vectors of matrix A = I + dt/2*i*H
	var Aa = new Array(n);
	var Ab = new Array(n);
	var Ac = new Array(n);
	for(var i=0; i<n; i++)
	{
		Aa[i] = (new Complex(0, dt/2)).multiply(Ha[i]); //Aa[0] is redundant
		Ab[i] = (new Complex(1, 0)).add((new Complex(0, dt/2)).multiply(Hb[i]));
		Ac[i] = (new Complex(0, dt/2)).multiply(Hc[i]); //Ac[N-1] is redundant
	}
	//The 3 diagonal vectors of matrix B = I - dt/2*i*H
	var Ba = new Array(n);
	var Bb = new Array(n);
	var Bc = new Array(n);
	for(var i=0; i<n; i++)
	{
		Ba[i] = (new Complex(0, -dt/2)).multiply(Ha[i]); //Ba[0] is redundant
		Bb[i] = (new Complex(1, 0)).add((new Complex(0, -dt/2)).multiply(Hb[i]));
		Bc[i] = (new Complex(0, -dt/2)).multiply(Hc[i]); //Bc[N-1] is redundant
	}
	return [Ha, Hb, Hc, Aa, Ab, Ac, Ba, Bb, Bc];
};

//Initialize Psi
WavePacket.initialize = function(x, k0, std, x0)
{
	var n  = x.length;
	var dx = x[1] - x[0];
	
	var Psi = new Array(n);
	//Initialize
	for(var i=0; i<n; i++)
	{
		Psi[i] = new Complex(Math.exp(-(x[i]-x0)*(x[i]-x0)/(std*std))*Math.cos(k0*(x[i]-x0)), Math.exp(-(x[i]-x0)*(x[i]-x0)/(std*std))*Math.sin(k0*(x[i]-x0)));
	}
	//Normalize
	var sum = 0;
	for(var i=0; i<n; i++)
	{
		sum = sum + Psi[i].conjugate().multiply(Psi[i]).re;
	}
	var norm = Math.sqrt(sum*dx);
	for(var i=0; i<n; i++)
	{
		Psi[i] = Psi[i].divide(new Complex(norm, 0));
	}
	return Psi;
};

//Initialize Psi with non-uniform grid
WavePacket.initializeNonUni = function(xLOut, xIn, xROut, k0, std, x0)
{
	var nLOut = xLOut.length, nIn = xIn.length, nROut = xROut.length;
	var n     = nLOut + nIn + nROut;
	var dxOut = xLOut[1] - xLOut[0];
	var dxIn  = xIn[1] - xIn[0];
	var x = new Float64Array(n);
	x.set(xLOut, 0);
	x.set(xIn, nROut);
	x.set(xROut, nLOut+nIn);
	
	var Psi = new Array(n);
	//Initialize
	for(var i=0; i<n; i++)
	{
		Psi[i] = new Complex(Math.exp(-(x[i]-x0)*(x[i]-x0)/(std*std))*Math.cos(k0*(x[i]-x0)), Math.exp(-(x[i]-x0)*(x[i]-x0)/(std*std))*Math.sin(k0*(x[i]-x0)));
	}
	//Normalize
	var sum = 0;
	for(var i=nLOut; i<nLOut+nIn; i++)
	{
		sum = sum + Psi[i].conjugate().multiply(Psi[i]).re;
	}
	var norm = Math.sqrt(sum*dxIn);
	for(var i=0; i<n; i++)
	{
		Psi[i] = Psi[i].divide(new Complex(norm, 0));
	}
	return Psi;
};

//Expectation value of energy
WavePacket.expectE = function(x, Ha, Hb, Hc, Psi)
{
	var n  = x.length;
	var dx = x[1] - x[0];
	
	var E = 0;
	var HPsi = CrankNicolson.complexTridiagmatrixMultiplyVector(Ha, Hb, Hc, Psi);
	for(var i=0; i<n; i++)
	{
		E = E + Psi[i].conjugate().multiply(HPsi[i]).re;
	}
	E = E*dx;
	return E;
};

//Expectation value of energy with non-uniform gird
WavePacket.expectENonUni = function(xLOut, xIn, xROut, Ha, Hb, Hc, Psi)
{
	var nLOut = xLOut.length, nIn = xIn.length, nROut = xROut.length;
	var dxIn  = xIn[1] - xIn[0];
	
	var E = 0;
	var HPsi = CrankNicolson.complexTridiagmatrixMultiplyVector(Ha, Hb, Hc, Psi);
	for(var i=nLOut; i<nLOut+nIn; i++)
	{
		E = E + Psi[i].conjugate().multiply(HPsi[i]).re;
	}
	E = E*dxIn;
	return E;
};

//Take square of Psi and add expactation value of energy
WavePacket.sqrtSqOnE = function(Psi, E)
{
	var n = Psi.length;
	var PsiSq = new Float64Array(n);
	for(var i=0; i<n; i++)
	{
		PsiSq[i] = 15*Math.sqrt(Psi[i].conjugate().multiply(Psi[i]).re) + E;
	}
	return PsiSq;
};
