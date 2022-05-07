/*
 * DensVisual.js
 * Visualization of probability density
 * Need to include Complex.js, glMatrix.js
 */

var DensVisual = new Object();

window.addEventListener("load", function() {DensVisual.loadHandler();}, false);
DensVisual.loadHandler = function()
{
	var dvDivs = document.getElementsByClassName("dv");
	for(var i=0; i<dvDivs.length; i++)
	{
		DensVisual.setupDensVisual(dvDivs[i]);
	}
};

//DensVisual setup
DensVisual.setupDensVisual = function(container)
{
	//Add HTML elements
	var html = "<br />";
	html += "<canvas id='glCanvas'></canvas><br />";
	html += "<input id='gridCheck' type='checkbox' />Show grid &nbsp;";
	html += "<select id='viewList'>";
	html += "<option>free view</option>";
	html += "<option>x-y view</option>";
	html += "<option>x-z view</option>";
	html += "<option>y-z view</option>";
	html += "</select><br />";
	container.innerHTML = html;
	
	//Get HTML elements
	var glCanvas    = document.getElementById("glCanvas");
	var gridCheck   = document.getElementById("gridCheck");
	var viewList    = document.getElementById("viewList");
	var densRange   = document.getElementById("densRange");
	var nlList      = document.getElementById("nlList");
	var mList       = document.getElementById("mList");
	var fileList    = document.getElementById("fileList");
	var loadButton  = document.getElementById("loadButton");
	
	gridCheck.checked = true;
	densRange.disabled = "disabled";
	
	//Orbital data
	var rMin, dx, Z, r, orbitals; //to be read from JSON
	
	//Read filenames from server
	var nameList = null;
	$.ajaxSetup({async: false});
	$.getJSON("../PHP/readJSON.php", function(msg) {nameList = msg;});
	
	for(var i=2; i<nameList.length; i++)
	{
		var option = document.createElement("option");
		option.text = nameList[i];
		fileList.add(option, null);
	}
	fileList.selectedIndex = 0;
	
	//Setup WebGL
	var gl = glCanvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	//Setup shader program
	var shaderProgram = gl.createProgram();
	DensVisual.setupShaders(gl, shaderProgram);
	
	//Grid vertices, colors, indices
	var gridVertices = new Array();
	for(var i=0; i<25; i++)
	{
		gridVertices.push(-0.5*12+0.5*i);
		gridVertices.push(-0.5*12);
		gridVertices.push(0);
	}
	for(var i=0; i<25; i++)
	{
		gridVertices.push(-0.5*12+0.5*i);
		gridVertices.push(0.5*12);
		gridVertices.push(0);
	}
	for(var i=0; i<25; i++)
	{
		gridVertices.push(-0.5*12);
		gridVertices.push(-0.5*12+0.5*i);
		gridVertices.push(0);
	}
	for(var i=0; i<25; i++)
	{
		gridVertices.push(0.5*12);
		gridVertices.push(-0.5*12+0.5*i);
		gridVertices.push(0);
	}
	gridVertices.push(0);
	gridVertices.push(0);
	gridVertices.push(-0.5*12);
	gridVertices.push(0);
	gridVertices.push(0);
	gridVertices.push(0.5*12);
	
	var gridColors = new Array();
	for(var i=0; i<102; i++)
	{
		if(i!=12 && i!=37 && i!=62 && i!=87 && i!=100 && i!=101)
		{
			gridColors.push(0.3);
			gridColors.push(0.3);
			gridColors.push(0.3);
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
	var gridColorBuffer  = gl.createBuffer();
	var gridIndexBuffer  = gl.createBuffer();
	DensVisual.setupGridBuffers(gl, gridVertices, gridColors, gridIndices, gridVertexBuffer, gridColorBuffer, gridIndexBuffer);
	
	//Points vertices, colors
	var pointsVertices = new Array();
	var pointsColors   = new Array();
	
	//Points buffers
	var pointsVertexBuffer = gl.createBuffer();
	var pointsColorBuffer  = gl.createBuffer();
	DensVisual.setupPointsBuffers(gl, [], [], pointsVertexBuffer, pointsColorBuffer);
	
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
	gridCheck.addEventListener("change", gridChangeHandler, false);
	viewList.addEventListener("change", viewChangeHandler, false);
	densRange.addEventListener("change", densChangeHandler, false);
	nlList.addEventListener("change", nlChangeHandler, false);
	mList.addEventListener("change", mChangeHandler, false);
	loadButton.addEventListener("click", loadClickHandler, false);
	
	//Event handlers
	//Transformations
	var transMatrix = mat4.create();
	var rotatMatrix = mat4.create();
	mat4.identity(transMatrix);
	mat4.identity(rotatMatrix);
	mat4.translate(transMatrix, [0.0, 0.0, -12.5]);
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
			
			plot();
			
			if(viewList.selectedIndex != 0)
				viewList.selectedIndex = 0;
		}
	}
	function mouseWheelHandler(evt)
	{
		evt.preventDefault();
		document.body.style.cursor = "crosshair";
		var ds = (evt.wheelDelta>0 || evt.detail<0) ? -0.05*transMatrix[14] : 0.05*transMatrix[14];
		if((ds>0 && ds>0.02) || (ds<0 && ds>-1.5))
		{
			var newTransMatrix = mat4.create();
			mat4.identity(newTransMatrix);
			mat4.translate(newTransMatrix, [0, 0, ds]);
			mat4.multiply(newTransMatrix, transMatrix, transMatrix);
			
			plot();
		}
	}
	
	//View change
	function viewChangeHandler()
	{
		if(viewList.selectedIndex == 1)
		{
			mat4.identity(transMatrix);
			mat4.identity(rotatMatrix);
			mat4.translate(transMatrix, [0.0, 0.0, -12.5]);
		}
		else if(viewList.selectedIndex == 2)
		{
			mat4.identity(transMatrix);
			mat4.identity(rotatMatrix);
			mat4.translate(transMatrix, [0.0, 0.0, -12.5]);
			mat4.rotate(rotatMatrix, -Math.PI/2, [1, 0, 0]);
		}
		else if(viewList.selectedIndex == 3)
		{
			mat4.identity(transMatrix);
			mat4.identity(rotatMatrix);
			mat4.translate(transMatrix, [0.0, 0.0, -12.5]);
			mat4.rotate(rotatMatrix, -Math.PI/2, [1, 0, 0]);
			mat4.rotate(rotatMatrix, -Math.PI/2, [0, 0, 1]);
		}
		
		plot();
	}
	
	//Load data from server
	function loadClickHandler()
	{
		$.getJSON("../PHP/JSON/"+nameList[fileList.selectedIndex+2], function(data) {
			rMin     = data.rMin;
			dx       = data.dx;
			Z        = data.Z;
			r        = data.r;
			orbitals = data.orbitals;
			
			//Update nlList
			nlList.length = 0;
			for(var i=0; i<orbitals.length; i++)
			{
				var option = document.createElement("option");
				var lStr;
				switch(orbitals[i].l)
				{
				case 0:
					lStr = "s";
					break;
				case 1:
					lStr = "p";
					break;
				case 2:
					lStr = "d";
					break;
				case 3:
					lStr = "f";
					break;
				case 4:
					lStr = "g";
					break;
				case 5:
					lStr = "h";
					break;
				default:
					lStr = "s";
				}
				option.text = orbitals[i].n + lStr;
				nlList.add(option, null);
			}
			nlList.selectedIndex = orbitals.length-1;
			
			//Invoke nlChangeHandler
			nlChangeHandler();
		});
	}
	
	//On nlList change
	function nlChangeHandler()
	{
		var nlIdx = nlList.selectedIndex;
		var l = orbitals[nlIdx].l;
		
		//Update mList
		mList.length = 0;
		for(var m=-l; m<=l; m++)
		{
			var option = document.createElement("option");
			option.text = "m=" + m;
			mList.add(option, null);
		}
		//Append real harmonics options
		if(l == 0)
		{
			var option = document.createElement("option");
			option.text = "s";
			mList.add(option, null);
		}
		else if(l == 1)
		{
			var option = document.createElement("option");
			option.text = "p_z";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "p_x";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "p_y";
			mList.add(option, null);
		}
		else if(l == 2)
		{
			var option = document.createElement("option");
			option.text = "d_3zz-1";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "d_xz";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "d_yz";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "d_xx-yy";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "d_xy";
			mList.add(option, null);
		}
		else if(l == 3)
		{
			var option = document.createElement("option");
			option.text = "f_z(5zz-3)";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "f_x(5zz-1)";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "f_y(5zz-1)";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "f_z(xx-yy)";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "f_xyz";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "f_x(xx-3yy)";
			mList.add(option, null);
			var option = document.createElement("option");
			option.text = "f_y(3xx-yy)";
			mList.add(option, null);
		}
		mList.selectedIndex = l;
		
		//Invoke mChangeHandler
		mChangeHandler();
	}
	
	//On mList change
	function mChangeHandler()
	{
		var nlIdx = nlList.selectedIndex;
		var mIdx  = mList.selectedIndex;
		
		var E = orbitals[nlIdx].E;
		var l = orbitals[nlIdx].l;
		var R = orbitals[nlIdx].R;
		
		var cc, ll, mm;
		if(mIdx <= 2*l) //Pure harmonics
		{
			cc = [new Complex(1,0)]; ll = [orbitals[nlIdx].l]; mm = [mIdx - l];
		}
		else //Real harmonics
		{
			var sq2inv = 1/Math.sqrt(2.0);
			
			switch(mList[mIdx].value)
			{
			case "s":
				cc = [new Complex(1,0)]; ll = [0]; mm = [0];
				break;
			case "p_z":
				cc = [new Complex(1,0)]; ll = [1]; mm = [0];
				break;
			case "p_x":
				cc = [new Complex(sq2inv,0), new Complex(-sq2inv,0)]; ll = [1,1]; mm = [-1,1];
				break;
			case "p_y":
				cc = [new Complex(0,sq2inv), new Complex(0,sq2inv)]; ll = [1,1]; mm = [-1,1];
				break;
			case "d_3zz-1":
				cc = [new Complex(1,0)]; ll = [2]; mm = [0];
				break;
			case "d_xz":
				cc = [new Complex(sq2inv,0), new Complex(-sq2inv,0)]; ll = [2,2]; mm = [-1,1];
				break;
			case "d_yz":
				cc = [new Complex(0,sq2inv), new Complex(0,sq2inv)]; ll = [2,2]; mm = [-1,1];
				break;
			case "d_xx-yy":
				cc = [new Complex(sq2inv,0), new Complex(sq2inv,0)]; ll = [2,2]; mm = [-2,2];
				break;
			case "d_xy":
				cc = [new Complex(0,sq2inv), new Complex(0,-sq2inv)]; ll = [2,2]; mm = [-2,2];
				break;
			case "f_z(5zz-3)":
				cc = [new Complex(1,0)]; ll = [3]; mm = [0];
				break;
			case "f_x(5zz-1)":
				cc = [new Complex(sq2inv,0), new Complex(-sq2inv,0)]; ll = [3,3]; mm = [-1,1];
				break;
			case "f_y(5zz-1)":
				cc = [new Complex(0,sq2inv), new Complex(0,sq2inv)]; ll = [3,3]; mm = [-1,1];
				break;
			case "f_z(xx-yy)":
				cc = [new Complex(sq2inv,0), new Complex(sq2inv,0)]; ll = [3,3]; mm = [-2,2];
				break;
			case "f_xyz":
				cc = [new Complex(0,sq2inv), new Complex(0,-sq2inv)]; ll = [3,3]; mm = [-2,2];
				break;
			case "f_x(xx-3yy)":
				cc = [new Complex(sq2inv,0), new Complex(-sq2inv,0)]; ll = [3,3]; mm = [-3,3];
				break;
			case "f_y(3xx-yy)":
				cc = [new Complex(0,sq2inv), new Complex(0,sq2inv)]; ll = [3,3]; mm = [-3,3];
				break;
			default:
				cc = [new Complex(1,0)]; ll = [0]; mm = [0];
				break;
			}
		}
		
		var len = cc.length;
		
		function factorial(n)
		{
			var result = 1;
			for(var i=2; i<=n; i++)
				result *= i;
			return result;
		}
		
		var fact = new Array();
		for(var i=0; i<len; i++)
			fact[i] = Math.sqrt((2*ll[i]+1)/(4*Math.PI) * factorial(ll[i]-Math.abs(mm[i])) / factorial(ll[i]+Math.abs(mm[i])));
		
		//Determine sampling curve
		var max = absMax(R);
		var beta = Z/(Math.sqrt((-0.5*Z*Z)/E));
		var A = Math.abs(R[0])/Math.exp(-beta*r[0]);
		for(var i=1; i<R.length; i++)
		{
			if(Math.abs(R[i]) > 0.001*max)
			{
				var Ai = Math.abs(R[i])/Math.exp(-beta*r[i]);
				if(Ai > A)
					A = Ai;
			}
		}
		
		//Determine sampling sphere for Y
		fmax = Math.sqrt((2*l+1)/(4*Math.PI) * factorial(l-Math.abs(0)) / factorial(l+Math.abs(0)));
		Pmax = lgndr(l, 0, Math.cos(0));
		Ymax = new Complex(fmax*Pmax*Math.cos(0), fmax*Pmax*Math.sin(0));
		YmaxAbs = Math.sqrt(Ymax.multiply(Ymax.conjugate()).re);
		
		//Points vertices, colors
		pointsVertices.length = 0;
		pointsColors.length   = 0;
		
		while(pointsVertices.length/3 < 40000)
		{
			var x  = 2*A*(Math.random()-0.5);
			var y  = 2*A*(Math.random()-0.5);
			var z  = 2*A*(Math.random()-0.5);
			var xi = Math.sqrt(x*x+y*y+z*z);
			
			if(xi <= A)
			{
				//Map to exp distribution
				var ri  = -Math.log((A-xi)/A)/beta;
				var idx = Math.round(rToIndex(ri));
				
				if(idx < R.length)
				{
					//Sample R
					var Ri = R[idx];
					
					var eta = Math.random();
					if(eta < Math.abs(Ri)/(A*Math.exp(-beta*ri)))
					{
						var theta = Math.acos(z/Math.sqrt(x*x+y*y+z*z));
						var phi;
						if(y >= 0)
							phi = Math.acos(x/Math.sqrt(x*x+y*y));
						else
							phi = 2*Math.PI - Math.acos(x/Math.sqrt(x*x+y*y));
						
						//Sample Y
						var Plm = new Array();
						for(var i=0; i<len; i++)
						{
							Plm[i] = lgndr(ll[i], Math.abs(mm[i]), Math.cos(theta));
							if(mm[i] < 0)
								Plm[i] = Math.pow(-1, -mm[i]) * Plm[i];
						}
						
						var Ysum = new Complex(0, 0);
						for(var i=0; i<len; i++)
							Ysum = Ysum.add(cc[i].multiply((new Complex(fact[i]*Plm[i]*Math.cos(mm[i]*phi), fact[i]*Plm[i]*Math.sin(mm[i]*phi)))));
						
						var YsumAbs = Math.sqrt(Ysum.multiply(Ysum.conjugate()).re);
						
						var zeta = YmaxAbs * Math.random();
						if(zeta < YsumAbs)
						{
							x *= ri/xi;
							y *= ri/xi;
							z *= ri/xi;
							
							//Push vertex
							pointsVertices.push(x);
							pointsVertices.push(y);
							pointsVertices.push(z);
							
							//Push color
							if(Ri < 0)
								Ysum = Ysum.multiply(new Complex(-1, 0));
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
								pointsColors.push(1);
								pointsColors.push(rat);
								pointsColors.push(0);
							}
							else if(phase>=Math.PI/3 && phase<Math.PI*2/3)
							{
								var rat = (phase-Math.PI/3)/(Math.PI/3);
								pointsColors.push(1-rat);
								pointsColors.push(1);
								pointsColors.push(0);
							}
							else if(phase>=Math.PI*2/3 && phase<Math.PI)
							{
								var rat = (phase-Math.PI*2/3)/(Math.PI/3);
								pointsColors.push(0);
								pointsColors.push(1);
								pointsColors.push(rat);
							}
							else if(phase>=Math.PI && phase<Math.PI*4/3)
							{
								var rat = (phase-Math.PI)/(Math.PI/3);
								pointsColors.push(0);
								pointsColors.push(1-rat);
								pointsColors.push(1);
							}
							else if(phase>=Math.PI*4/3 && phase<Math.PI*5/3)
							{
								var rat = (phase-Math.PI*4/3)/(Math.PI/3);
								pointsColors.push(rat);
								pointsColors.push(0);
								pointsColors.push(1);
							}
							else
							{
								var rat = (phase-Math.PI*5/3)/(Math.PI/3);
								pointsColors.push(1);
								pointsColors.push(0);
								pointsColors.push(1-rat);
							}
							pointsColors.push(1);
						}
					}
				}
			}
		}
		
		densRange.max = pointsVertices.length/3;
		densRange.value = densRange.max/2;
		densRange.disabled = "";
		
		//Setup points buffers
		DensVisual.setupPointsBuffers(gl, pointsVertices.slice(0, densRange.value*3), pointsColors.slice(0, densRange.value*4), pointsVertexBuffer, pointsColorBuffer);
		
		//Plot
		plot();
		
		function rToIndex(ri)
		{
			return (Math.log(Z*ri)-Math.log(Z*rMin))/dx;
		}
		
		function absMax(arr)
		{
			var max = Math.abs(arr[0]);
			for(var i=1; i<arr.length; i++)
			{
				if(Math.abs(arr[i]) > max)
					max = Math.abs(arr[i]);
			}
			return max;
		}
		
		//Legendre polynomial Plm(x)
		function lgndr(l, m, x)
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
		}
	}
	
	function gridChangeHandler() {plot();}
	
	function densChangeHandler()
	{
		//Setup points buffers
		DensVisual.setupPointsBuffers(gl, pointsVertices.slice(0, densRange.value*3), pointsColors.slice(0, densRange.value*4), pointsVertexBuffer, pointsColorBuffer);
		
		//Plot
		plot();
	}
	
	//Window resize
	function resize()
	{
		//Adjust width and height
		var canvasWidth  = window.innerWidth - 400;
		var canvasHeight = window.innerHeight - 60;
		
		if(canvasWidth > 0 && canvasHeight > 0)
		{
			glCanvas.width  = canvasWidth;
			glCanvas.height = canvasHeight;
		}
		
		gl.viewportWidth  = canvasWidth;
		gl.viewportHeight = canvasHeight;
		
		plot();
	}
	resize();
	
	function plot()
	{
		DensVisual.drawScene(gl, shaderProgram, transMatrix, rotatMatrix, pointsVertexBuffer, pointsColorBuffer);
		if(gridCheck.checked)
			DensVisual.drawGrid(gl, shaderProgram, gridVertexBuffer, gridColorBuffer, gridIndexBuffer);
	}
};

//Load shader source
DensVisual.loadShader = function(gl, id)
{
	var shaderScript = document.getElementById(id);
	var shaderSource = "";
	var currentChild = shaderScript.firstChild;
	while(currentChild)
	{
		if(currentChild.nodeType == 3)
			shaderSource += currentChild.textContent;
		currentChild = currentChild.nextSibling;
	}
	
	var shader;
	if(shaderScript.type == "x-shader/x-vertex")
		shader = gl.createShader(gl.VERTEX_SHADER);
	else if(shaderScript.type == "x-shader/x-fragment")
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	else
		return -1;
	
	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader);
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		alert("Compile " + gl.getShaderInfoLog(shader));
		return -1;
	}
	
	return shader;
};

//Setup shaders
DensVisual.setupShaders = function(gl, shaderProgram)
{
	var vertexShader   = DensVisual.loadShader(gl, "shader-vs");
	var fragmentShader = DensVisual.loadShader(gl, "shader-fs");
	
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert("Could not initialize shaders");
		return -1;
	}
	gl.useProgram(shaderProgram);
	
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	
	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
};

//Setup grid vertex buffer, color buffer, index buffer
DensVisual.setupGridBuffers = function(gl, vertices, colors, indices, vertexBuffer, colorBuffer, indexBuffer)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = vertices.length/3;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	colorBuffer.itemSize = 4;
	colorBuffer.numItems = colors.length/4;
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	indexBuffer.itemSize = 1;
	indexBuffer.numItems = indices.length;
};

//Setup points vertex buffer, color buffer
DensVisual.setupPointsBuffers = function(gl, vertices, colors, vertexBuffer, colorBuffer)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = vertices.length/3;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	colorBuffer.itemSize = 4;
	colorBuffer.numItems = colors.length/4;
};

//Draw WebGL graph
DensVisual.drawScene = function(gl, shaderProgram, transMatrix, rotatMatrix, pointsVertexBuffer, pointsColorBuffer)
{
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var mvMatrix = mat4.create();
	var pMatrix  = mat4.create();
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	
	mat4.identity(mvMatrix);
	
	mat4.multiply(mvMatrix, transMatrix);
	mat4.multiply(mvMatrix, rotatMatrix);
	
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	
	//Draw points
	gl.bindBuffer(gl.ARRAY_BUFFER, pointsVertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pointsVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, pointsColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pointsColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.POINTS, 0, pointsVertexBuffer.numItems);
};

//Draw grid
DensVisual.drawGrid = function(gl, shaderProgram, gridVertexBuffer, gridColorBuffer, gridIndexBuffer)
{
	//Draw grid
	gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, gridVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, gridColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, gridColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridIndexBuffer);
	gl.drawElements(gl.LINES, gridIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};
