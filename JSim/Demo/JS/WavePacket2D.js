/*
 * WavePacket2D.js
 * Wave packet in 2D space
 * Need to include Complex.js, CrankNicolson.js, WebGLSetup.js, glMatrix.js
 */

var WavePacket2D = new Object();

window.addEventListener("load", function() {WavePacket2D.loadHandler();}, false);
WavePacket2D.loadHandler = function()
{
	var wp2dDivs = document.getElementsByClassName("wp2d");
	for(var i=0; i<wp2dDivs.length; i++)
	{
		WavePacket2D.setupWP2D(wp2dDivs[i]);
	}
};

//Wave packet setup
WavePacket2D.setupWP2D = function(container)
{
	var xMin   = -6.0;
	var xMax   = 6.0;
	var dx     = 0.1;
	var yMin   = -6.0;
	var yMax   = 6.0;
	var dy     = 0.1;
	var tMax   = 50.00;
	var dt     = 0.02;
	var kx0Min = -3;
	var kx0Max = 3;
	var ky0Min = -3;
	var ky0Max = 3;
	var stdMin = 1.0;
	var stdMax = 2.0;
	
	//Add HTML elements
	var html = "<br /><canvas id='glCanvas'></canvas><br />";
	html += "<div id='timeText'>t = 0.00</div><br />";
	html += "<input id='startButton' type='button' value='\u25b6' />&nbsp;";
	html += "<input id='pauseButton' type='button' value='\u2759\u2759' />&nbsp;";
	html += "<input id='stopButton' type='button' value='\u220e' />";
	container.innerHTML = html;
	
	//Get HTML elements
	var glCanvas    = document.getElementById("glCanvas");
	var timeText    = document.getElementById("timeText");
	var kx0Text     = document.getElementById("kx0Text");
	var ky0Text     = document.getElementById("ky0Text");
	var stdText     = document.getElementById("stdText");
	var kx0Range    = document.getElementById("kx0Range");
	var ky0Range    = document.getElementById("ky0Range");
	var stdRange    = document.getElementById("stdRange");
	var startButton = document.getElementById("startButton");
	var pauseButton = document.getElementById("pauseButton");
	var stopButton  = document.getElementById("stopButton");
	
	kx0Range.min = kx0Min;
	kx0Range.max = kx0Max;
	ky0Range.min = ky0Min;
	ky0Range.max = ky0Max;
	stdRange.min = stdMin;
	stdRange.max = stdMax;
	
	kx0Range.value = 0.5*(kx0Min+kx0Max);
	ky0Range.value = 0.5*(ky0Min+ky0Max);
	stdRange.value = 0.5*(stdMin+stdMax);
	
	startButton.disabled = "";
	pauseButton.disabled = "disabled";
	stopButton.disabled  = "disabled";
	
	//Setup
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
	
	//Get gl context
	var gl = glCanvas.getContext("experimental-webgl");
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	//Setup shader program
	var shaderProgram = gl.createProgram();
	WebGLSetup.setupShaders(gl, shaderProgram);
	
	//Setup buffers
	var vertexBuffer = gl.createBuffer();
	var normalBuffer = gl.createBuffer();
	var colorBuffer  = gl.createBuffer();
   	var indexBuffer  = gl.createBuffer();
	
	var vertices = new Float64Array(3*x.length*y.length);
	
	WebGLSetup.setupSurfVertexBuffer(gl, x, y, vertices, vertexBuffer);
	WebGLSetup.updateSurfVertexBuffer(gl, sqrtPsiSq, vertices, vertexBuffer);
	WebGLSetup.setupSurfNormalBuffer(gl, x, y, sqrtPsiSq, normalBuffer);
	WebGLSetup.setupPhaseSurfColorBuffer(gl, Psi, colorBuffer);
	WebGLSetup.setupSurfIndexBuffer(gl, x, y, indexBuffer);
	
	//Setup buffers for box
	var verticesBox = [
		xMin-dx, yMin-dy, 0.0,
		xMax+dx, yMin-dy, 0.0,
		xMax+dx, yMax+dy, 0.0,
		xMin-dx, yMax+dy, 0.0
	];
	var normalsBox = [
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0
	];
	var colorsBox = [
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0,
  		1.0, 1.0, 1.0, 1.0
	];
	var indicesBox = [
		0, 1, 1, 2, 2, 3, 3, 0
	];
	var vertexBufferBox = gl.createBuffer();
	var normalBufferBox = gl.createBuffer();
	var colorBufferBox  = gl.createBuffer();
	var indexBufferBox  = gl.createBuffer();
	WebGLSetup.setupBuffers(gl, verticesBox, normalsBox, colorsBox, indicesBox, vertexBufferBox, normalBufferBox, colorBufferBox, indexBufferBox);
	
	//Setup light
	var lightDirection = [0.0, 1.0, 0.0];
	var lightAmbient   = [0.4, 0.4, 0.4];
	var lightDiffuse   = [0.6, 0.6, 0.6];
	var lightSpecular  = [0.8, 0.8, 0.8];
	var shininess      = 100.0;
	WebGLSetup.setupLight(gl, shaderProgram, true, lightDirection, lightAmbient, lightDiffuse, lightSpecular, shininess);
	
	//Add event listeners
	window.addEventListener("resize", resize, false);
	window.addEventListener("keydown", keyDownHandler, false);
	window.addEventListener("keyup", keyUpHandler, false);
	glCanvas.addEventListener("mousemove", mouseMoveHandler, false);
	glCanvas.addEventListener("mousedown", mouseDownHandler, false);
	glCanvas.addEventListener("mouseup", mouseUpHandler, false);
	glCanvas.addEventListener("mouseout", mouseOutHandler, false);
	glCanvas.addEventListener("mousewheel", mouseWheelHandler, false);
	glCanvas.addEventListener("DOMMouseScroll", mouseWheelHandler, false);
	kx0Range.addEventListener("change", inputChangeHandler, false);
	ky0Range.addEventListener("change", inputChangeHandler, false);
	stdRange.addEventListener("change", inputChangeHandler, false);
	startButton.addEventListener("click", startClickHandler, false);
	pauseButton.addEventListener("click", pauseClickHandler, false);
	stopButton.addEventListener("click", stopClickHandler, false);
	
	//Event handlers
	//Transformations
	var transMatrix = mat4.create();
	var rotatMatrix = mat4.create();
	mat4.identity(transMatrix);
	mat4.identity(rotatMatrix);
	mat4.translate(transMatrix, [0.0, 0.0, -15.0]);
	mat4.rotate(rotatMatrix, -1.0, [1, 0, 0]);
	var oldX = 0, oldY = 0;
	var newX = 0, newY = 0;
	var mouseIsDown = false;
	var shftIsDown  = false;
	function mouseDownHandler(evt)
	{
		evt.preventDefault();
		mouseIsDown = true;
		oldX = evt.clientX;
		oldY = evt.clientY;
	}
	function mouseUpHandler() {document.body.style.cursor = "auto"; mouseIsDown = false;}
	function keyDownHandler(evt) {if(evt.keyCode == 16) shftIsDown = true;}
	function keyUpHandler(evt) {if(evt.keyCode == 16) shftIsDown = false;}
	function mouseOutHandler() {document.body.style.cursor = "auto"; mouseIsDown = false;}
	function mouseMoveHandler(evt)
	{	
		if(mouseIsDown == true)
		{
			newX = evt.clientX;
			newY = evt.clientY;
			
			var dX = newX - oldX;
			var dY = newY - oldY;
			
			if(shftIsDown == true)
			{
				document.body.style.cursor = "move";
				var newTransMatrix = mat4.create();
				mat4.identity(newTransMatrix);
				mat4.translate(newTransMatrix, [-dX*transMatrix[14]*0.0015, dY*transMatrix[14]*0.0015, 0]);
				mat4.multiply(newTransMatrix, transMatrix, transMatrix);
			}
			else
			{
				document.body.style.cursor = "auto";
				var newRotatMatrix = mat4.create();
				mat4.identity(newRotatMatrix);
				mat4.rotate(newRotatMatrix, dX/200, [0, 1, 0]);
				mat4.rotate(newRotatMatrix, dY/200, [1, 0, 0]);
				mat4.multiply(newRotatMatrix, rotatMatrix, rotatMatrix);
			}
			
			oldX = newX;
			oldY = newY;
			
			plot();
		}
	}
	function mouseWheelHandler(evt)
	{
		evt.preventDefault();
		document.body.style.cursor = "crosshair";
		var ds = (evt.wheelDelta>0 || evt.detail<0) ? -0.05*transMatrix[14] : 0.05*transMatrix[14];
		if((ds>0 && ds>0.04) || (ds<0 && ds>-3))
		{
			var newTransMatrix = mat4.create();
			mat4.identity(newTransMatrix);
			mat4.translate(newTransMatrix, [0, 0, ds]);
			mat4.multiply(newTransMatrix, transMatrix, transMatrix);
			
			plot();
		}
	}
	
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
					kx0Range.disabled    = "";
					ky0Range.disabled    = "";
					stdRange.disabled    = "";
					startButton.disabled = "";
					pauseButton.disabled = "disabled";
					stopButton.disabled  = "disabled";
					
					timeText.innerHTML = "t = 0.00";
					
					Psi = WavePacket2D.initialize2D(x, y, kx0, ky0, std);
					
					//Plot
					var sqrtPsiSq = WavePacket2D.sqrtSq(Psi);
					WebGLSetup.updateSurfVertexBuffer(gl, sqrtPsiSq, vertices, vertexBuffer);
					WebGLSetup.setupSurfNormalBuffer(gl, x, y, sqrtPsiSq, normalBuffer);
					WebGLSetup.setupPhaseSurfColorBuffer(gl, Psi, colorBuffer);
					plot();
					
					return 0;
				}
				if(playState == 1) //play
				{
					kx0Range.disabled    = "disabled";
					ky0Range.disabled    = "disabled";
					stdRange.disabled    = "disabled";
					startButton.disabled = "disabled";
					pauseButton.disabled = "";
					stopButton.disabled  = "";
					
					timeText.innerHTML = "t = " + t[it].toFixed(2);
					
					//ADI Crank Nicolson integration
					Psi = CrankNicolson.complexADI(Psi, AaX, AbX, AcX, BaX, BbX, BcX, AaY, AbY, AcY, BaY, BbY, BcY);
					
					//Plot
					var sqrtPsiSq = WavePacket2D.sqrtSq(Psi);
					WebGLSetup.updateSurfVertexBuffer(gl, sqrtPsiSq, vertices, vertexBuffer);
					WebGLSetup.setupSurfNormalBuffer(gl, x, y, sqrtPsiSq, normalBuffer);
					WebGLSetup.setupPhaseSurfColorBuffer(gl, Psi, colorBuffer);
					plot();
					
					//Iterate
					it++;
					if(it>=t.length)
						playState = 0;
				}
				if(playState == 2) //pause
				{
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
		}
		else //is paused
			playState = 1;
	}
	function pauseClickHandler() {playState = 2;}
	function stopClickHandler() {playState = 0;}
	
	//Input change action
	function inputChangeHandler()
	{
		kx0 = parseFloat(kx0Range.value);
		ky0 = parseFloat(ky0Range.value);
		std = parseFloat(stdRange.value);
		
		kx0Text.innerHTML = "kx<sub>0</sub> = " + kx0.toFixed(1);
		ky0Text.innerHTML = "ky<sub>0</sub> = " + ky0.toFixed(1);
		stdText.innerHTML = "std = " + std.toFixed(1);
		
		Psi = WavePacket2D.initialize2D(x, y, kx0, ky0, std);
		
		//Re-plot
		var sqrtPsiSq = WavePacket2D.sqrtSq(Psi);
		WebGLSetup.updateSurfVertexBuffer(gl, sqrtPsiSq, vertices, vertexBuffer);
		WebGLSetup.setupSurfNormalBuffer(gl, x, y, sqrtPsiSq, normalBuffer);
		WebGLSetup.setupPhaseSurfColorBuffer(gl, Psi, colorBuffer);
		plot();
	}
	
	//Window resize
	function resize()
	{
		var canvasWidth  = window.innerWidth - 400;
		var canvasHeight = window.innerHeight - 150;
		
		//Adjust width and height
		if(canvasWidth > 0 && canvasHeight > 0)
		{
			glCanvas.width  = canvasWidth;
			glCanvas.height = canvasHeight;
		}
		
		gl.viewportWidth  = glCanvas.width;
		gl.viewportHeight = glCanvas.height;
		
		plot();
	}
	resize();
	
	//Plot
	function plot()
	{
		gl.uniform1i(shaderProgram.useLightUniform, true);
		WebGLSetup.drawScene(gl, shaderProgram, transMatrix, rotatMatrix, vertexBuffer, normalBuffer, colorBuffer, indexBuffer);
		gl.uniform1i(shaderProgram.useLightUniform, false);
		WebGLSetup.drawLines(gl, shaderProgram, vertexBufferBox, normalBufferBox, colorBufferBox, indexBufferBox);
	}
};

//Setup 1D grid
WavePacket2D.setupGrid = function(xMin, xMax, dx)
{
	var n = Math.round((xMax-xMin)/dx + 1);
	var x = new Float64Array(n);
	for(var i=0; i<n; i++)
	{
		x[i] = xMin + dx*i;
	}
	return x;
};

//Setup tridiagonal matrix of 2D Hamiltonian (zero potential)
WavePacket2D.setupHamiltonian2D = function(x, y, dt)
{
	var nx = x.length;
	var ny = y.length;
	var dx = x[1] - x[0];
	var dy = y[1] - y[0];
	
	//Tridiagonal matrices
	//The 3 diagonal vectors of the Hamiltonian matrix H
	var HaX = new Array(nx);
	var HbX = new Array(nx);
	var HcX = new Array(nx);
	for(var i=0; i<nx; i++)
	{
		HaX[i] = new Complex(-0.5/(dx*dx), 0); //HaX[0] is redundant
		HbX[i] = new Complex(1/(dx*dx), 0);
		HcX[i] = new Complex(-0.5/(dx*dx), 0); //HcX[N-1] is redundant
	}
	var HaY = new Array(ny);
	var HbY = new Array(ny);
	var HcY = new Array(ny);
	for(var i=0; i<ny; i++)
	{
		HaY[i] = new Complex(-0.5/(dy*dy), 0); //HaY[0] is redundant
		HbY[i] = new Complex(1/(dy*dy), 0);
		HcY[i] = new Complex(-0.5/(dy*dy), 0); //HcY[N-1] is redundant
	}
	//The 3 diagonal vectors of matrix A = I + dt/2*i*H
	var AaX = new Array(nx);
	var AbX = new Array(nx);
	var AcX = new Array(nx);
	for(var i=0; i<nx; i++)
	{
		AaX[i] = (new Complex(0, dt/2)).multiply(HaX[i]); //AaX[0] is redundant
		AbX[i] = (new Complex(1, 0)).add((new Complex(0, dt/2)).multiply(HbX[i]));
		AcX[i] = (new Complex(0, dt/2)).multiply(HcX[i]); //AcX[N-1] is redundant
	}
	var AaY = new Array(ny);
	var AbY = new Array(ny);
	var AcY = new Array(ny);
	for(var i=0; i<ny; i++)
	{
		AaY[i] = (new Complex(0, dt/2)).multiply(HaY[i]); //AaY[0] is redundant
		AbY[i] = (new Complex(1, 0)).add((new Complex(0, dt/2)).multiply(HbY[i]));
		AcY[i] = (new Complex(0, dt/2)).multiply(HcY[i]); //AcY[N-1] is redundant
	}
	//The 3 diagonal vectors of matrix B = I - dt/2*i*H
	var BaX = new Array(nx);
	var BbX = new Array(nx);
	var BcX = new Array(nx);
	for(var i=0; i<nx; i++)
	{
		BaX[i] = (new Complex(0, -dt/2)).multiply(HaX[i]); //BaX[0] is redundant
		BbX[i] = (new Complex(1, 0)).add((new Complex(0, -dt/2)).multiply(HbX[i]));
		BcX[i] = (new Complex(0, -dt/2)).multiply(HcX[i]); //BcX[N-1] is redundant
	}
	var BaY = new Array(ny);
	var BbY = new Array(ny);
	var BcY = new Array(ny);
	for(var i=0; i<ny; i++)
	{
		BaY[i] = (new Complex(0, -dt/2)).multiply(HaY[i]); //BaX[0] is redundant
		BbY[i] = (new Complex(1, 0)).add((new Complex(0, -dt/2)).multiply(HbY[i]));
		BcY[i] = (new Complex(0, -dt/2)).multiply(HcY[i]); //BcX[N-1] is redundant
	}
	return [HaX, HbX, HcX, AaX, AbX, AcX, BaX, BbX, BcX, HaY, HbY, HcY, AaY, AbY, AcY, BaY, BbY, BcY];
};

//Initialize 2D Psi
WavePacket2D.initialize2D = function(x, y, kx0, ky0, std)
{
	var nx = x.length;
	var ny = y.length;
	var dx = x[1] - x[0];
	var dy = y[1] - y[0];
	
	var Psi = new Array(nx*ny);
	//Initialize
	for(var j=0; j<ny; j++)
	{
		for(var i=0; i<nx; i++)
		{
			Psi[j*nx+i] = new Complex(Math.exp(-(x[i]*x[i]/(std*std)+y[j]*y[j]/(std*std)))*Math.cos(kx0*x[i]+ky0*y[j]), Math.exp(-(x[i]*x[i]/(std*std)+y[j]*y[j]/(std*std)))*Math.sin(kx0*x[i]+ky0*y[j]));
		}
	}
	//Normalize
	var sum = 0;
	for(var j=0; j<ny; j++)
	{
		for(var i=0; i<nx; i++)
		{
			sum = sum + Psi[j*nx+i].conjugate().multiply(Psi[j*nx+i]).re;
		}
	}
	var norm = Math.sqrt(sum*dx*dy);
	for(var j=0; j<ny; j++)
	{
		for(var i=0; i<nx; i++)
		{
			Psi[j*nx+i] = Psi[j*nx+i].divide(new Complex(norm, 0));
		}
	}
	return Psi;
};

//Take square of Psi and take square root
WavePacket2D.sqrtSq = function(Psi)
{
	var n = Psi.length;
	var sqrtPsiSq = new Float64Array(n);
	for(var i=0; i<n; i++)
	{
		sqrtPsiSq[i] = 8*Math.sqrt(Psi[i].conjugate().multiply(Psi[i]).re);
	}
	return sqrtPsiSq;
};
