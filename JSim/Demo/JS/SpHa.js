/*
 * SpHa.js
 * Generate spherical harmonics plots
 * Need to include Complex.js, WebGLSetup.js, glMatrix.js
 */

var SpHa = new Object();

window.addEventListener("load", function() {SpHa.loadHandler();}, false);
SpHa.loadHandler = function()
{
	var sphaDivs = document.getElementsByClassName("spha");
	for(var i=0; i<sphaDivs.length; i++)
	{
		SpHa.setupSpHa(sphaDivs[i]);
	}
};

//Spherical hamonics setup
SpHa.setupSpHa = function(container)
{
	//Add HTML elements
	var html = "<br /><canvas id='glCanvas'></canvas>";
	container.innerHTML = html;
	
	//Get HTML elements
	var glCanvas  = document.getElementById("glCanvas");
	var orbtList  = document.getElementById("orbtList");
	var linTable  = document.getElementById("linTable");
	var cList     = document.getElementsByClassName("c");
	var lList     = document.getElementsByClassName("l");
	var mList     = document.getElementsByClassName("m");
	var addButton = document.getElementById("addButton");
	var delButton = document.getElementById("delButton");
	var creButton = document.getElementById("creButton");
	
	var gl = glCanvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	//Setup shader program
	var shaderProgram = gl.createProgram();
	WebGLSetup.setupShaders(gl, shaderProgram);
	
	//Grid vertices, normals, colors, indices
	var gridVertices = new Array();
	for(var i=0; i<25; i++)
	{
		gridVertices.push(-12+i);
		gridVertices.push(-12);
		gridVertices.push(0);
	}
	for(var i=0; i<25; i++)
	{
		gridVertices.push(-12+i);
		gridVertices.push(12);
		gridVertices.push(0);
	}
	for(var i=0; i<25; i++)
	{
		gridVertices.push(-12);
		gridVertices.push(-12+i);
		gridVertices.push(0);
	}
	for(var i=0; i<25; i++)
	{
		gridVertices.push(12);
		gridVertices.push(-12+i);
		gridVertices.push(0);
	}
	gridVertices.push(0);
	gridVertices.push(0);
	gridVertices.push(-12);
	gridVertices.push(0);
	gridVertices.push(0);
	gridVertices.push(12);
	
	var gridNormals = new Array();
	for(var i=0; i<102; i++)
	{
		gridNormals.push(0.0);
		gridNormals.push(0.0);
		gridNormals.push(1.0);
	}
	
	var gridColors = new Array();
	for(var i=0; i<102; i++)
	{
		if(i!=12 && i!=37 && i!=62 && i!=87 && i!=100 && i!=101)
		{
			gridColors.push(0.4);
			gridColors.push(0.4);
			gridColors.push(0.4);
		}
		else if(i==12 || i==37)
		{
			gridColors.push(0.0);
			gridColors.push(1.0);
			gridColors.push(0.0);
		}
		else if(i==62 || i==87)
		{
			gridColors.push(1.0);
			gridColors.push(0.0);
			gridColors.push(0.0);
		}
		else
		{
			gridColors.push(0.0);
			gridColors.push(0.0);
			gridColors.push(1.0);
		}
		gridColors.push(1.0);
	}
	
	var gridIndices = [
		0, 25, 1, 26, 2, 27, 3 ,28, 4, 29, 5, 30, 6, 31, 7, 32, 8, 33, 9, 34, 10, 35, 11, 36, 12, 37,
		13, 38, 14, 39, 15, 40, 16, 41, 17, 42, 18, 43, 19, 44, 20, 45, 21, 46, 22, 47, 23, 48, 24, 49,
		50, 75, 51, 76, 52, 77, 53, 78, 54, 79, 55, 80, 56, 81, 57, 82, 58, 83, 59, 84, 60, 85, 61, 86, 62, 87,
		63, 88, 64, 89, 65, 90, 66, 91, 67, 92, 68, 93, 69, 94, 70, 95, 71, 96, 72, 97, 73, 98, 74, 99,
		100, 101
	];
	
	//Setup grid buffers
	var gridVertexBuffer = gl.createBuffer();
	var gridNormalBuffer = gl.createBuffer();
	var gridColorBuffer  = gl.createBuffer();
	var gridIndexBuffer  = gl.createBuffer();
	WebGLSetup.setupBuffers(gl, gridVertices, gridNormals, gridColors, gridIndices, gridVertexBuffer, gridNormalBuffer, gridColorBuffer, gridIndexBuffer);
	
	//Setup spherical harmonics buffers
	var sphaVertexBuffer = gl.createBuffer();
	var sphaNormalBuffer = gl.createBuffer();
	var sphaColorBuffer  = gl.createBuffer();
	var sphaIndexBuffer  = gl.createBuffer();
	SpHa.setupSpHaBuffers([new Complex(1, 0)], [0], [0], gl, sphaVertexBuffer, sphaNormalBuffer, sphaColorBuffer, sphaIndexBuffer);
	
	//Setup light
	var lightDirection = [0.0, 1.0, 2.0];
	var lightAmbient   = [0.3, 0.3, 0.3];
	var lightDiffuse   = [0.6, 0.6, 0.6];
	var lightSpecular  = [0.8, 0.8, 0.8];
	var shininess      = 100.0;
	WebGLSetup.setupLight(gl, shaderProgram, true, lightDirection, lightAmbient, lightDiffuse, lightSpecular, shininess);
	
	//Add event listener
	window.addEventListener("resize", resize, false);
	window.addEventListener("keydown", keyDownHandler, false);
	window.addEventListener("keyup", keyUpHandler, false);
	glCanvas.addEventListener("mousemove", mouseMoveHandler, false);
	glCanvas.addEventListener("mousedown", mouseDownHandler, false);
	glCanvas.addEventListener("mouseup", mouseUpHandler, false);
	glCanvas.addEventListener("mouseout", mouseOutHandler, false);
	glCanvas.addEventListener("mousewheel", mouseWheelHandler, false);
	glCanvas.addEventListener("DOMMouseScroll", mouseWheelHandler, false);
	orbtList.addEventListener("change", orbtChangeHandler, false);
	addButton.addEventListener("click", addRowHandler, false);
	delButton.addEventListener("click", delRowHandler, false);
	creButton.addEventListener("click", createHandler, false);
	
	//Event handlers
	//Transformations
	var transMatrix = mat4.create();
	var rotatMatrix = mat4.create();
	mat4.identity(transMatrix);
	mat4.identity(rotatMatrix);
	mat4.translate(transMatrix, [0.0, 0.0, -30.0]);
	mat4.rotate(rotatMatrix, -1.2, [1, 0, 0]);
	mat4.rotate(rotatMatrix, -0.785, [0, 0, 1]);
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
			
			WebGLSetup.drawScene(gl, shaderProgram, transMatrix, rotatMatrix, sphaVertexBuffer, sphaNormalBuffer, sphaColorBuffer, sphaIndexBuffer);
			WebGLSetup.drawLines(gl, shaderProgram, gridVertexBuffer, gridNormalBuffer, gridColorBuffer, gridIndexBuffer);
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
			
			WebGLSetup.drawScene(gl, shaderProgram, transMatrix, rotatMatrix, sphaVertexBuffer, sphaNormalBuffer, sphaColorBuffer, sphaIndexBuffer);
			WebGLSetup.drawLines(gl, shaderProgram, gridVertexBuffer, gridNormalBuffer, gridColorBuffer, gridIndexBuffer);
		}
	}
	
	function orbtChangeHandler()
	{
		var index = orbtList.selectedIndex;
		var c, l, m;
		switch(index)
		{
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
		SpHa.setupSpHaBuffers(c, l, m, gl, sphaVertexBuffer, sphaNormalBuffer, sphaColorBuffer, sphaIndexBuffer);
		
		WebGLSetup.drawScene(gl, shaderProgram, transMatrix, rotatMatrix, sphaVertexBuffer, sphaNormalBuffer, sphaColorBuffer, sphaIndexBuffer);
		WebGLSetup.drawLines(gl, shaderProgram, gridVertexBuffer, gridNormalBuffer, gridColorBuffer, gridIndexBuffer);
	}
	
	function addRowHandler()
	{
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
		cList = document.getElementsByClassName("c");
		lList = document.getElementsByClassName("l");
		mList = document.getElementsByClassName("m");
	}
	
	function delRowHandler()
	{
		if(linTable.rows.length-1 > 0)
		{
			linTable.deleteRow(linTable.rows.length-1);
			cList = document.getElementsByClassName("c");
			lList = document.getElementsByClassName("l");
			mList = document.getElementsByClassName("m");
		}
	}
	
	function createHandler()
	{
		/* Regular expression for matching complex numbers */
		var cReg = /([-+]?\d+\.?\d*|[-+]?\d*\.?\d+)([-+]\d+\.?\d*|[-+]\d*\.?\d+)i/;
		var iReg = /([-+]?\d+\.?\d*|[-+]?\d*\.?\d+)i/;
		var rReg = /([-+]?\d+\.?\d*|[-+]?\d*\.?\d+)/;
		
		var c = new Array();
		var l = new Array();
		var m = new Array();
		
		var n = cList.length;
		for(var i=0; i<n; i++)
		{
			var cStr = cList[i].innerHTML.match(cReg);
			var iStr = cList[i].innerHTML.match(iReg);
			var rStr = cList[i].innerHTML.match(rReg);
			
			if(cStr!=null && cStr[0]==cList[i].innerHTML)
				c[i] = new Complex(parseFloat(cStr[1]), parseFloat(cStr[2]));
			else if(iStr!=null && iStr[0]==cList[i].innerHTML)
				c[i] = new Complex(0, parseFloat(iStr[1]));
			else if(rStr!=null && rStr[0]==cList[i].innerHTML)
				c[i] = new Complex(parseFloat(rStr[1]), 0);
			else
			{
				alert("coeff must have a complex number format: a+bi");
				return -1;
			}
			
			if(isNaN(lList[i].innerHTML) || !isFinite(lList[i].innerHTML) ||
			   isNaN(mList[i].innerHTML) || !isFinite(mList[i].innerHTML))
			{
				alert("l and m must be numbers!");
				return -1;
			}
			
			l[i] = Math.floor(parseFloat(lList[i].innerHTML));
			m[i] = Math.floor(parseFloat(mList[i].innerHTML));
			
			if(Math.abs(m[i]) > l[i])
			{
				alert("Invalid arguments: |m| > l");
				return -1;
			}
		}
		SpHa.setupSpHaBuffers(c, l, m, gl, sphaVertexBuffer, sphaNormalBuffer, sphaColorBuffer, sphaIndexBuffer);
		
		WebGLSetup.drawScene(gl, shaderProgram, transMatrix, rotatMatrix, sphaVertexBuffer, sphaNormalBuffer, sphaColorBuffer, sphaIndexBuffer);
		WebGLSetup.drawLines(gl, shaderProgram, gridVertexBuffer, gridNormalBuffer, gridColorBuffer, gridIndexBuffer);
	}
	
	//Window resize
	function resize()
	{
		//Adjust width and height
		var canvasWidth  = window.innerWidth - 400;
		var canvasHeight = window.innerHeight - 35;
		
		if(canvasWidth > 0 && canvasHeight > 0)
		{
			glCanvas.width  = canvasWidth;
			glCanvas.height = canvasHeight;
		}
		
		gl.viewportWidth  = canvasWidth;
		gl.viewportHeight = canvasHeight;
		
		WebGLSetup.drawScene(gl, shaderProgram, transMatrix, rotatMatrix, sphaVertexBuffer, sphaNormalBuffer, sphaColorBuffer, sphaIndexBuffer);
		WebGLSetup.drawLines(gl, shaderProgram, gridVertexBuffer, gridNormalBuffer, gridColorBuffer, gridIndexBuffer);
	}
	resize();
};

//Create (linear combination of) spherical harmonics and setup buffers, c, l, m are arrays.
SpHa.setupSpHaBuffers = function(c, l, m, gl, vertexBuffer, normalBuffer, colorBuffer, indexBuffer)
{
	var latN = 100;
	var lonN = 100;
	
	var vertices = new Array();
	var normals  = new Array();
	var colors   = new Array();
	var indices  = new Array();
	
	var n = c.length;
	
	//Normalize coefficient list
	var norm = 0;
	for(var i=0; i<n; i++)
		norm = norm + c[i].multiply(c[i].conjugate()).re;
	norm = 1/Math.sqrt(norm);
	for(var i=0; i<n; i++)
		c[i] = c[i].multiply(new Complex(norm, 0));
	
	function factorial(n)
	{
		var result = 1;
		for(var i=2; i<=n; i++)
			result *= i;
		return result;
	}
	var fact = new Array();
	for(var i=0; i<n; i++)
		fact[i] = Math.sqrt((2*l[i]+1)/(4*Math.PI) * factorial(l[i]-Math.abs(m[i])) / factorial(l[i]+Math.abs(m[i])));
	
	//vertices and colors
	for(var i=0; i<=latN; i++)
	{
		var theta = i / latN * Math.PI;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);
		for(var j=0; j<=lonN; j++)
		{
			var phi = j / lonN * 2 * Math.PI;
			var sinPhi = Math.sin(phi);
			var cosPhi = Math.cos(phi);
			
			var Plm = new Array();
			for(var k=0; k<n; k++)
			{
				Plm[k] = SpHa.lgndr(l[k], Math.abs(m[k]), cosTheta);
				if(m[k] < 0)
					Plm[k] = Math.pow(-1, -m[k]) * Plm[k];
			}
			
			var Ysum = new Complex(0, 0);
			for(var k=0; k<n; k++)
				Ysum = Ysum.add(c[k].multiply((new Complex(fact[k]*Plm[k]*Math.cos(m[k]*phi), fact[k]*Plm[k]*Math.sin(m[k]*phi)))));
			
			var r = 12 * Math.sqrt(Ysum.multiply(Ysum.conjugate()).re);
			
			var x = r*cosPhi*sinTheta;
			var y = r*sinPhi*sinTheta;
			var z = r*cosTheta;
			
			vertices.push(x);
			vertices.push(y);
			vertices.push(z);
			
			var phase;
			if(Ysum.im>=0 && Ysum.re>0)
				phase = Math.atan(Ysum.im/Ysum.re);
			else if(Ysum.im>0 && Ysum.re==0)
				phase = 0.5 * Math.PI;
			else if(Ysum.im>0 && Ysum.re<0)
				phase = Math.atan(Ysum.im/Ysum.re) + Math.PI;
			else if(Ysum.im<=0 && Ysum.re<0)
				phase = Math.atan(Ysum.im/Ysum.re) + Math.PI;
			else if(Ysum.im<0 && Ysum.re==0)
				phase = 1.5 * Math.PI;
			else if(Ysum.im<0 && Ysum.re>0)
				phase = Math.atan(Ysum.im/Ysum.re) + 2*Math.PI;
			else
				phase = 0;
			
			if(phase>=0 && phase<Math.PI/3)
			{
				var rat = phase/(Math.PI/3);
				colors.push(1);
				colors.push(rat);
				colors.push(0);
				colors.push(1);
			}
			else if(phase>=Math.PI/3 && phase<Math.PI*2/3)
			{
				var rat = (phase-Math.PI/3)/(Math.PI/3);
				colors.push(1-rat);
				colors.push(1);
				colors.push(0);
				colors.push(1);
			}
			else if(phase>=Math.PI*2/3 && phase<Math.PI)
			{
				var rat = (phase-Math.PI*2/3)/(Math.PI/3);
				colors.push(0);
				colors.push(1);
				colors.push(rat);
				colors.push(1);
			}
			else if(phase>=Math.PI && phase<Math.PI*4/3)
			{
				var rat = (phase-Math.PI)/(Math.PI/3);
				colors.push(0);
				colors.push(1-rat);
				colors.push(1);
				colors.push(1);
			}
			else if(phase>=Math.PI*4/3 && phase<Math.PI*5/3)
			{
				var rat = (phase-Math.PI*4/3)/(Math.PI/3);
				colors.push(rat);
				colors.push(0);
				colors.push(1);
				colors.push(1);
			}
			else
			{
				var rat = (phase-Math.PI*5/3)/(Math.PI/3);
				colors.push(1);
				colors.push(0);
				colors.push(1-rat);
				colors.push(1);
			}
		}
	}
	
	//normals
	for(var j=0; j<=lonN; j++) //north pole
	{
		normals.push(0);
		normals.push(0);
		normals.push(0);
	}
	for(var i=1; i<latN; i++) //in between
	{
		var theta    = i / latN * Math.PI;
		var dTheta   = 1 / latN * Math.PI;
		var sinTheta = Math.sin(theta);
		var cosTheta = Math.cos(theta);
		for(var j=0; j<=lonN; j++)
		{
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
			
			if(Math.abs(Yme) < 1e-8) //avoid division by zero
			{
				normals.push(0);
				normals.push(0);
				normals.push(1);
			}
			else
			{
				normals.push(-xCmpnt);
				normals.push(-yCmpnt);
				normals.push(-zCmpnt);
			}
		}
	}
	for(var j=0; j<=lonN; j++) //south pole
	{
		normals.push(0);
		normals.push(0);
		normals.push(0);
	}
	
	//Replacing north pole and south pole by taking average from neighbors
	var northNormal = [0, 0, 0];
	var southNormal = [0, 0, 0];
	for(var j=0; j<lonN; j++)
	{
		for(var k=0; k<3; k++)
		{
			northNormal[k] = northNormal[k] + normals[3*(1*(lonN+1)+j)+k];
			southNormal[k] = southNormal[k] + normals[3*((latN-1)*(lonN+1)+j)+k];
		}
	}
	for(var k=0; k<3; k++)
	{
		northNormal[k] = northNormal[k] / lonN;
		southNormal[k] = southNormal[k] / lonN;
	}
	for(var j=0; j<=lonN; j++)
	{
		normals[3*(0*(lonN+1)+j)]      = northNormal[0];
		normals[3*(0*(lonN+1)+j)+1]    = northNormal[1];
		normals[3*(0*(lonN+1)+j)+2]    = northNormal[2];
		normals[3*(latN*(lonN+1)+j)]   = southNormal[0];
		normals[3*(latN*(lonN+1)+j)+1] = southNormal[1];
		normals[3*(latN*(lonN+1)+j)+2] = southNormal[2];
	}
	
	//indices
	for(var i=0; i<latN; i++)
	{
		for(var j=0; j<lonN; j++)
		{
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
	WebGLSetup.setupBuffers(gl, vertices, normals, colors, indices, vertexBuffer, normalBuffer, colorBuffer, indexBuffer);
};

//Legendre polynomial Plm(x)
SpHa.lgndr = function(l, m, x)
{
	if(m<0 || m>l || Math.abs(x)>1.0)
		alert("Invalid arguments for Plm.");
	
	//Compute Pmm
	var Pmm = 1.0;
	if(m > 0)
	{
		var somx2 = Math.sqrt((1.0+x)*(1.0-x));
		var fact  = 1.0;
		for(var i=1; i<=m; i++)
		{
			Pmm  = Pmm * (-fact*somx2);
			fact = fact + 2.0;
		}
	}
	
	if(l == m)
		return Pmm;
	else //Compute Pmp1m
	{
		var Pmp1m = x*(2*m+1)*Pmm;
		if(l == m+1)
			return Pmp1m;
		else //Compute Plm, l > m + 1
		{
			var Plm;
			for(var ll=m+2; ll<=l; ll++)
			{
				Plm = (x*(2*ll-1)*Pmp1m - (ll+m-1)*Pmm) / (ll-m);
				Pmm = Pmp1m;
				Pmp1m = Plm;
			}
			return Plm;
		}
	}
};
