/*
 * WebGLSetup.js
 * Basic WebGL setup
 * Need to include glMatrix.js
 */

var WebGLSetup = new Object();
 
//Load shader source
WebGLSetup.loadShader = function(gl, id)
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
WebGLSetup.setupShaders = function(gl, shaderProgram)
{
	var vertexShader   = WebGLSetup.loadShader(gl, "shader-vs");
	var fragmentShader = WebGLSetup.loadShader(gl, "shader-fs");
	
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
	
	shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
	gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
	
	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.useLightUniform = gl.getUniformLocation(shaderProgram, "uUseLight");
	shaderProgram.lightDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightDirection");
	shaderProgram.lightAmbientUniform = gl.getUniformLocation(shaderProgram, "uLightAmbient");
	shaderProgram.lightDiffuseUniform = gl.getUniformLocation(shaderProgram, "uLightDiffuse");
	shaderProgram.lightSpecularUniform = gl.getUniformLocation(shaderProgram, "uLightSpecular");
	shaderProgram.shininessUniform = gl.getUniformLocation(shaderProgram, "uShininess");
};

//Setup vertex buffer color buffer index buffer
WebGLSetup.setupBuffers = function(gl, vertices, normals, colors, indices, vertexBuffer, normalBuffer, colorBuffer, indexBuffer)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = vertices.length/3;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	normalBuffer.itemSize = 3;
	normalBuffer.numItems = normals.length/3;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	colorBuffer.itemSize = 4;
	colorBuffer.numItems = colors.length/4;
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	indexBuffer.itemSize = 1;
	indexBuffer.numItems = indices.length;
};

//Setup surface vertex buffer
WebGLSetup.setupSurfVertexBuffer = function(gl, x, y, vertices, vertexBuffer)
{
	//Surface vertices
	for(var j=0; j<y.length; j++)
	{
		for(var i=0; i<x.length; i++)
		{
			vertices[3*(j*x.length+i)]   = x[i];
			vertices[3*(j*x.length+i)+1] = y[j];
			vertices[3*(j*x.length+i)+2] = 0;
		}
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 3;
	vertexBuffer.numItems = vertices.length/3;
};

//Updata surface vertex buffer
WebGLSetup.updateSurfVertexBuffer = function(gl, z, vertices, vertexBuffer)
{
	//Updata surface vertices z vaule
	for(var i=0; i<z.length; i++)
	{
		vertices[3*i+2] = z[i];
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
};

//Setup surface normal buffer
WebGLSetup.setupSurfNormalBuffer = function(gl, x, y, z, normalBuffer)
{
	var dx = x[1] - x[0];
	var dy = y[1] - y[0];
	var normals = new Float64Array(3*z.length);
	//inside
	for(var j=1; j<y.length-1; j++)
	{
		for(var i=1; i<x.length-1; i++)
		{
			normals[3*(j*x.length+i)]   = z[j*x.length+i-1] - z[j*x.length+i+1];
			normals[3*(j*x.length+i)+1] = z[(j-1)*x.length+i] - z[(j+1)*x.length+i];
			normals[3*(j*x.length+i)+2] = 2*dx + 2*dy;
		}
	}
	//4 boundaries
	for(var j=1; j<y.length-1; j++)
	{
		normals[3*(j*x.length)]   = 0 - z[j*x.length+1];
		normals[3*(j*x.length)+1] = z[(j-1)*x.length] - z[(j+1)*x.length];
		normals[3*(j*x.length)+2] = 2*dx + 2*dy;
		normals[3*(j*x.length+x.length-1)]   = z[j*x.length+x.length-2] - 0;
		normals[3*(j*x.length+x.length-1)+1] = z[(j-1)*x.length+x.length-1] - z[(j+1)*x.length+x.length-1];
		normals[3*(j*x.length+x.length-1)+2] = 2*dx + 2*dy;
	}
	for(var i=1; i<x.length-1; i++)
	{
		normals[3*(0*x.length+i)]   = z[0*x.length+i-1] - z[0*x.length+i+1];
		normals[3*(0*x.length+i)+1] = 0 - z[1*x.length+i];
		normals[3*(0*x.length+i)+2] = 2*dx + 2*dy;
		normals[3*((y.length-1)*x.length+i)]   = z[(y.length-1)*x.length+i-1] - z[(y.length-1)*x.length+i+1];
		normals[3*((y.length-1)*x.length+i)+1] = z[(y.length-2)*x.length+i] - 0;
		normals[3*((y.length-1)*x.length+i)+2] = 2*dx + 2*dy;
	}
	//4 corners
	normals[3*(0*x.length+0)]   = 0 - z[0*x.length+1];
	normals[3*(0*x.length+0)+1] = 0 - z[1*x.length+0];
	normals[3*(0*x.length+0)+2] = 2*dx + 2*dy;
	normals[3*(0*x.length+x.length-1)]   = z[0*x.length+x.length-2] - 0;
	normals[3*(0*x.length+x.length-1)+1] = 0 - z[1*x.length+x.length-1];
	normals[3*(0*x.length+x.length-1)+2] = 2*dx + 2*dy;
	normals[3*((y.length-1)*x.length+0)]   = 0 - z[(y.length-1)*x.length+1];
	normals[3*((y.length-1)*x.length+0)+1] = z[(y.length-2)*x.length+0] - 0;
	normals[3*((y.length-1)*x.length+0)+2] = 2*dx + 2*dy;
	normals[3*((y.length-1)*x.length+x.length-1)]   = z[(y.length-1)*x.length+x.length-2] - 0;
	normals[3*((y.length-1)*x.length+x.length-1)+1] = z[(y.length-2)*x.length+x.length-1] - 0;
	normals[3*((y.length-1)*x.length+x.length-1)+2] = 2*dx + 2*dy;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	normalBuffer.itemSize = 3;
	normalBuffer.numItems = normals.length/3;
};

//Setup surface color buffer (height to color mapping)
WebGLSetup.setupHeightSurfColorBuffer = function(gl, z, zMin, zMax, colorBuffer)
{
	//Surface colors with "jet" color map
	var normZ = new Float64Array(z.length);
	for(var i=0; i<z.length; i++)
	{
		normZ[i] = (z[i]-zMin) / (zMax-zMin);
	}
	var colors = new Float64Array(4*z.length);
	for(var i=0; i<z.length; i++)
	{
		colors[4*i]   = Math.min(4*normZ[i]-1.5, -4*normZ[i]+4.5);
		colors[4*i+1] = Math.min(4*normZ[i]-0.5, -4*normZ[i]+3.5);
		colors[4*i+2] = Math.min(4*normZ[i]+0.5, -4*normZ[i]+2.5);
		colors[4*i+3] = 1;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	colorBuffer.itemSize = 4;
	colorBuffer.numItems = colors.length/4;
};

//Setup surface color buffer (phase to color mapping) need to include Complex.js
WebGLSetup.setupPhaseSurfColorBuffer = function(gl, complexZ, colorBuffer)
{
	//Surface colors based on phase
	var phi = new Float64Array(complexZ.length);
	for(var i=0; i<complexZ.length; i++)
	{
		if(complexZ[i].im>=0 && complexZ[i].re>0)
			phi[i] = Math.atan(complexZ[i].im/complexZ[i].re);
		else if(complexZ[i].im>0 && complexZ[i].re==0)
			phi[i] = 0.5 * Math.PI;
		else if(complexZ[i].im>0 && complexZ[i].re<0)
			phi[i] = Math.atan(complexZ[i].im/complexZ[i].re) + Math.PI;
		else if(complexZ[i].im<=0 && complexZ[i].re<0)
			phi[i] = Math.atan(complexZ[i].im/complexZ[i].re) + Math.PI;
		else if(complexZ[i].im<0 && complexZ[i].re==0)
			phi[i] = 1.5 * Math.PI;
		else if(complexZ[i].im<0 && complexZ[i].re>0)
			phi[i] = Math.atan(complexZ[i].im/complexZ[i].re) + 2*Math.PI;
		else
			phi[i] = 0;
	}
	var colors = new Float64Array(4*complexZ.length);
	for(var i=0; i<complexZ.length; i++)
	{
		if(phi[i]>=0 && phi[i]<Math.PI/3)
		{
			var r = phi[i]/(Math.PI/3);
			colors[4*i]   = 1;
			colors[4*i+1] = r;
			colors[4*i+2] = 0;
			colors[4*i+3] = 1;
		}
		else if(phi[i]>=Math.PI/3 && phi[i]<Math.PI*2/3)
		{
			var r = (phi[i]-Math.PI/3)/(Math.PI/3);
			colors[4*i]   = 1-r;
			colors[4*i+1] = 1;
			colors[4*i+2] = 0;
			colors[4*i+3] = 1;
		}
		else if(phi[i]>=Math.PI*2/3 && phi[i]<Math.PI)
		{
			var r = (phi[i]-Math.PI*2/3)/(Math.PI/3);
			colors[4*i]   = 0;
			colors[4*i+1] = 1;
			colors[4*i+2] = r;
			colors[4*i+3] = 1;
		}
		else if(phi[i]>=Math.PI && phi[i]<Math.PI*4/3)
		{
			var r = (phi[i]-Math.PI)/(Math.PI/3);
			colors[4*i]   = 0;
			colors[4*i+1] = 1-r;
			colors[4*i+2] = 1;
			colors[4*i+3] = 1;
		}
		else if(phi[i]>=Math.PI*4/3 && phi[i]<Math.PI*5/3)
		{
			var r = (phi[i]-Math.PI*4/3)/(Math.PI/3);
			colors[4*i]   = r;
			colors[4*i+1] = 0;
			colors[4*i+2] = 1;
			colors[4*i+3] = 1;
		}
		else
		{
			var r = (phi[i]-Math.PI*5/3)/(Math.PI/3);
			colors[4*i]   = 1;
			colors[4*i+1] = 0;
			colors[4*i+2] = 1-r;
			colors[4*i+3] = 1;
		}
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	colorBuffer.itemSize = 4;
	colorBuffer.numItems = colors.length/4;
};

//Setup surface index buffer
WebGLSetup.setupSurfIndexBuffer = function(gl, x, y, indexBuffer)
{
	//Surface indices
	var indices = new Uint16Array(6*x.length*y.length);
	for(var j=0; j<y.length-1; j++)
	{
		for(var i=0; i<x.length-1; i++)
		{
			indices[6*(j*x.length+i)]   = j*x.length+i;
			indices[6*(j*x.length+i)+1] = j*x.length+i+1;
			indices[6*(j*x.length+i)+2] = j*x.length+i+1+x.length;
			
			indices[6*(j*x.length+i)+3] = j*x.length+i;
			indices[6*(j*x.length+i)+4] = j*x.length+i+1+x.length;
			indices[6*(j*x.length+i)+5] = j*x.length+i+x.length;
		}
	}
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	indexBuffer.itemSize = 1;
	indexBuffer.numItems = indices.length;
};

//Setup lighting
WebGLSetup.setupLight = function(gl, shaderProgram, useLight, lightDirection, lightAmbient, lightDiffuse, lightSpecular, shininess)
{
	gl.uniform1i(shaderProgram.useLightUniform, useLight);
	if(useLight)
	{
		gl.uniform3fv(shaderProgram.lightDirectionUniform, lightDirection);
		gl.uniform3fv(shaderProgram.lightAmbientUniform, lightAmbient);
		gl.uniform3fv(shaderProgram.lightDiffuseUniform, lightDiffuse);
		gl.uniform3fv(shaderProgram.lightSpecularUniform, lightSpecular);
		gl.uniform1f(shaderProgram.shininessUniform, shininess);
	}
};

//Draw WebGL graph
WebGLSetup.drawScene = function(gl, shaderProgram, transMatrix, rotatMatrix, vertexBuffer, normalBuffer, colorBuffer, indexBuffer)
{
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var mvMatrix = mat4.create();
	var pMatrix  = mat4.create();
	var nMatrix  = mat4.create();
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	
	mat4.identity(mvMatrix);
	
	mat4.multiply(mvMatrix, transMatrix);
	mat4.multiply(mvMatrix, rotatMatrix);
	
	mat4.set(mvMatrix, nMatrix);
	mat4.inverse(nMatrix);
	mat4.transpose(nMatrix);
	
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

//Draw WebGL lines
WebGLSetup.drawLines = function(gl, shaderProgram, vertexBuffer, normalBuffer, colorBuffer, indexBuffer)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.drawElements(gl.LINES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};
