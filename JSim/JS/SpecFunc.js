/*
 * SpecFunc.js
 * Generate Hermite, Legendre and Laguerre polynomials
 * Need to include Polynomial.js, Painter.js
 */

var SpecFunc = new Object();

window.addEventListener("load", function() {SpecFunc.loadHandler();}, false);
SpecFunc.loadHandler = function()
{
	var spfnDivs = document.getElementsByClassName("spfn");
	for(var i=0; i<spfnDivs.length; i++)
	{
		SpecFunc.setupSpecFunc(spfnDivs[i]);
	}
};

//SpecFunc setup
SpecFunc.setupSpecFunc = function(container)
{
	//Get data from <div>{JSON}</div>
	var jsonData = JSON.parse(container.innerHTML);
	var name = typeof jsonData.name === "undefined" ? "Hermite" : jsonData.name;
	var xMin = typeof jsonData.xMin === "undefined" ? 0.0       : jsonData.xMin;
	var xMax = typeof jsonData.xMax === "undefined" ? 4.0       : jsonData.xMax;
	var dx   = typeof jsonData.dx   === "undefined" ? 0.01      : jsonData.dx;
	var cw   = typeof jsonData.cw   === "undefined" ? 0.50      : jsonData.cw;
	var ch   = typeof jsonData.ch   === "undefined" ? 0.40      : jsonData.ch;
	var xs   = typeof jsonData.xs   === "undefined" ? 0.125     : jsonData.xs;
	var ys   = typeof jsonData.ys   === "undefined" ? 0.02      : jsonData.ys;
	var xRange = typeof jsonData.xRange === "undefined" ? [-4, 4] : jsonData.xRange;
    var yRange = typeof jsonData.yRange === "undefined" ? [-45, 45] : jsonData.yRange;
	
	//Add HTML elements
	var html = "<h3>" + name + "</h3>";
	if(name == "Associated Legendre")
		html += "l: <input type='text' value='3' size='1' /> m: <input type='text' value='0' size='1' /> ";
	else if(name == "Hydrogen Radial")
		html += "n: <input type='text' value='3' size='1' /> l: <input type='text' value='0' size='1' /> ";
	else
		html += "order: <input type='text' value='3' size='1' /> ";
	html += "<input type='button' value='Create' />";
	html += "<input type='button' value='Clear' /><br />";
	html += "<div></div>";
	html += "<input type='checkbox' />Hold on<br />";
	html += "<canvas></canvas><br />";
	container.innerHTML = html;
	
	//Get HTML elements
	var nText, lText, mText, orderText, createButton, clearButton, holdCheck;
	if(name == "Associated Legendre")
	{
		lText        = container.getElementsByTagName("input")[0];
		mText        = container.getElementsByTagName("input")[1];
		createButton = container.getElementsByTagName("input")[2];
		clearButton  = container.getElementsByTagName("input")[3];
		holdCheck    = container.getElementsByTagName("input")[4];
	}
	else if(name == "Hydrogen Radial")
	{
		nText        = container.getElementsByTagName("input")[0];
		lText        = container.getElementsByTagName("input")[1];
		createButton = container.getElementsByTagName("input")[2];
		clearButton  = container.getElementsByTagName("input")[3];
		holdCheck    = container.getElementsByTagName("input")[4];
	}
	else
	{
		orderText    = container.getElementsByTagName("input")[0];
		createButton = container.getElementsByTagName("input")[1];
		clearButton  = container.getElementsByTagName("input")[2];
		holdCheck    = container.getElementsByTagName("input")[3];
	}
	var mathDiv      = container.getElementsByTagName("div")[0];
	var plotCanvas   = container.getElementsByTagName("canvas")[0];
	
	//Setup
	var x = SpecFunc.setupGrid(xMin, xMax, dx);
	var PList = new Array();
	
	var colorList = new Array();
	colorList[0] = "rgb(0, 0, 255)";
	colorList[1] = "rgb(255, 0, 0)";
	colorList[2] = "rgb(0, 200, 0)";
	colorList[3] = "rgb(155, 0, 255)";
	colorList[4] = "rgb(255, 155, 0)";
	colorList[5] = "rgb(0, 155, 255)";
	
	var mathString = "";
	
	//Painter
    var myPainter = new Painter(plotCanvas);
    myPainter.setXRange(xRange[0], xRange[1]);
    myPainter.setYRange(yRange[0], yRange[1]);
    myPainter.setLabel("x", "y");
    
    //Initial plot
    createHandler();
    resize();
	
	//Add event listener
	window.addEventListener("resize", resize, false);
	createButton.addEventListener("click", createHandler, false);
	clearButton.addEventListener("click", clearHandler, false);
	
	//Event handlers
	function createHandler()
	{
		//Get polynomial indices values
		var n, l, m, order;
		if(name == "Associated Legendre")
		{
			if(isNaN(lText.value) || !isFinite(lText.value) || isNaN(mText.value) || !isFinite(mText.value))
			{
				alert("Inputs must be numbers!");
				return -1;
			}
			
			l = parseFloat(lText.value);
			m = parseFloat(mText.value);
			
			if(Math.abs(m) > l)
			{
				alert("Invalid arguments: |m| > l");
				return -1;
			}
		}
		else if(name == "Hydrogen Radial")
		{
			if(isNaN(nText.value) || !isFinite(nText.value) || isNaN(lText.value) || !isFinite(lText.value))
			{
				alert("Inputs must be numbers!");
				return -1;
			}
			
			n = parseFloat(nText.value);
			l = parseFloat(lText.value);
			
			if(l<0 || l>n-1 || n%1!=0 || l%1!=0)
			{
				alert("Possible l = 0, 1, 2, ..., n-1");
				return -1;
			}
		}
		else
		{
			if(isNaN(orderText.value) || !isFinite(orderText.value))
			{
				alert("Inputs must be numbers!");
				return -1;
			}
			
			order = parseFloat(orderText.value);
			
			if(order<0 || order%1!=0)
			{
				alert("Inputs must be non-negative integers!");
				return -1;
			}
		}
		
		function factorial(n)
		{
			var result = 1;
			for(var i=2; i<=n; i++)
				result *= i;
			return result;
		}
		
		//Create polynomial
		var poly;
		if(name == "Hermite")
		{
			var Hermite = new Array();
			Hermite[0] = new Polynomial([1]);
			Hermite[1] = new Polynomial([0,2]);
			for(var i=2; i<=order; i++)
			{
				Hermite[i] = Hermite[i-1].multScalar(2).multXn(1)
				             .add(Hermite[i-2].multScalar(-2*(i-1)));
			}
			poly = Hermite[order];
			
			//Print
			if(holdCheck.checked)
				mathString += poly.toString();
			else
				mathString = poly.toString();
			mathDiv.innerHTML = mathString;
			
			//Evaluate
			var P = new Float64Array(x.length);
			for(var i=0; i<x.length; i++)
				P[i] = poly.eval(x[i]);
			
			if(holdCheck.checked)
				PList.push(P);
			else
			{
				PList.length = 0;
				PList.push(P);
			}
		}
		else if(name == "Harmonic Oscillator")
		{
			var Hermite = new Array();
			Hermite[0] = new Polynomial([1]);
			Hermite[1] = new Polynomial([0,2]);
			for(var i=2; i<=order; i++)
			{
				Hermite[i] = Hermite[i-1].multScalar(2).multXn(1)
				             .add(Hermite[i-2].multScalar(-2*(i-1)));
			}
			poly = Hermite[order];
			
			//Print
			if(holdCheck.checked)
				mathString += "\\[ \\frac{1}{\\sqrt{2^{" + order + "}" + + order + "!}} H_{" + order + "}(x) e^{-x^2/2} \\]";
			else
				mathString = "\\[ \\frac{1}{\\sqrt{2^{" + order + "}" + + order + "!}} H_{" + order + "}(x) e^{-x^2/2} \\]";
			mathDiv.innerHTML = mathString;
			
			//Evaluate
			var P = new Float64Array(x.length);
			var c = Math.sqrt(5);
			var fact = Math.pow(5/3.14,0.25) / Math.sqrt(Math.pow(2,order)*factorial(order));
			for(var i=0; i<x.length; i++)
				P[i] = fact * poly.eval(c*x[i]) * Math.exp(-c*c*x[i]*x[i]/2);
			
			if(holdCheck.checked)
				PList.push(P);
			else
			{
				PList.length = 0;
				PList.push(P);
			}
		}
		else if(name == "Legendre")
		{
			var Legendre = new Array();
			Legendre[0] = new Polynomial([1]);
			Legendre[1] = new Polynomial([0,1]);
			for(var i=2; i<=order; i++)
			{
				Legendre[i] = (Legendre[i-1].multScalar(2*i-1).multXn(1)
						      .add(Legendre[i-2].multScalar(-i+1)))
				              .multScalar(1/i);
			}
			poly = Legendre[order];
			
			//Print
			if(holdCheck.checked)
				mathString += poly.toString();
			else
				mathString = poly.toString();
			mathDiv.innerHTML = mathString;
			
			//Evaluate
			var P = new Float64Array(x.length);
			for(var i=0; i<x.length; i++)
				P[i] = poly.eval(x[i]);
			
			if(holdCheck.checked)
				PList.push(P);
			else
			{
				PList.length = 0;
				PList.push(P);
			}
		}
		else if(name == "Associated Legendre")
		{
			var Legendre = new Array();
			Legendre[0] = new Polynomial([1]);
			Legendre[1] = new Polynomial([0,1]);
			for(var i=2; i<=l; i++)
			{
				Legendre[i] = (Legendre[i-1].multScalar(2*i-1).multXn(1)
						      .add(Legendre[i-2].multScalar(-i+1)))
				              .multScalar(1/i);
			}
			poly = Legendre[l];
			for(var i=1; i<=Math.abs(m); i++)
				poly = poly.diff();
			
			var eps  = m>=0 ? Math.pow(-1, m) : 1;
			var sign = eps>0 ? "" : "-";
			//Print
			if(holdCheck.checked)
				mathString += "\\[" + sign + "\\sqrt{\\frac{" + (2*l+1) + "}{4\\pi} \\frac{" + (l-Math.abs(m)) + "!}{" + (l+Math.abs(m)) + "!}} (1-x^2)^{" + Math.abs(m) + "/2} \\left(\\frac{d}{dx}\\right)^{" + Math.abs(m) + "} P_{" + l + "}(x) \\]";
			else
				mathString = "\\[" + sign + "\\sqrt{\\frac{" + (2*l+1) + "}{4\\pi} \\frac{" + (l-Math.abs(m)) + "!}{" + (l+Math.abs(m)) + "!}} (1-x^2)^{" + Math.abs(m) + "/2} \\left(\\frac{d}{dx}\\right)^{" + Math.abs(m) + "} P_{" + l + "}(x) \\]";
			mathDiv.innerHTML = mathString;
			
			//Evaluate
			var P = new Float64Array(x.length);
			var fact = eps * Math.sqrt((2*l+1)/(4*Math.PI) * factorial(l-Math.abs(m))/factorial(l+Math.abs(m)));
			for(var i=0; i<x.length; i++)
				P[i] = fact * Math.pow(1-x[i]*x[i], Math.abs(m)/2) * poly.eval(x[i]);
			
			if(holdCheck.checked)
				PList.push(P);
			else
			{
				PList.length = 0;
				PList.push(P);
			}
		}
		else if(name == "Laguerre")
		{
			var Laguerre = new Array();
			Laguerre[0] = new Polynomial([1]);
			Laguerre[1] = new Polynomial([1,-1]);
			for(var i=2; i<=order; i++)
			{
				Laguerre[i] = (Laguerre[i-1].multScalar(2*i-1)
						      .add(Laguerre[i-1].multXn(1).multScalar(-1))
						      .add(Laguerre[i-2].multScalar(-i+1)))
						      .multScalar(1/i);
			}
			poly = Laguerre[order];
			
			//Print
			if(holdCheck.checked)
				mathString += poly.toString();
			else
				mathString = poly.toString();
			mathDiv.innerHTML = mathString;
			
			//Evaluate
			var P = new Float64Array(x.length);
			for(var i=0; i<x.length; i++)
				P[i] = poly.eval(x[i]);
			
			if(holdCheck.checked)
				PList.push(P);
			else
			{
				PList.length = 0;
				PList.push(P);
			}
		}
		else if(name == "Hydrogen Radial")
		{
			var Laguerre = new Array();
			Laguerre[0] = new Polynomial([1]);
			Laguerre[1] = new Polynomial([1,-1]);
			for(var i=2; i<=n+l; i++)
			{
				Laguerre[i] = (Laguerre[i-1].multScalar(2*i-1)
						      .add(Laguerre[i-1].multXn(1).multScalar(-1))
						      .add(Laguerre[i-2].multScalar(-i+1)))
						      .multScalar(1/i);
			}
			poly = Laguerre[n+l];
			poly = poly.multScalar(Math.abs(1/poly.coeffArray[n+l]));
			for(var i=1; i<=2*l+1; i++)
				poly = poly.diff();
			
			var eps  = Math.pow(-1, 2*l+1);
			var sign = eps>0 ? "" : "-";
			//Print
			if(holdCheck.checked)
				mathString += "\\[\\sqrt{\\left(\\frac{2}{" + n + "}\\right)^3 \\frac{" + (n-l-1) + "!}{" + (2*n) + "(" + (n+l)+ "!)^3}} e^{-x/" + n + "} \\left(\\frac{2x}{" + n + "}\\right)^{" + l + "} \\left[" + sign + "\\left(\\frac{d}{dx}\\right)^{" + (2*l+1) + "} L_{" + (n+l) + "}(x)\\right] \\]";
			else
				mathString = "\\[\\sqrt{\\left(\\frac{2}{" + n + "}\\right)^3 \\frac{" + (n-l-1) + "!}{" + (2*n) + "(" + (n+l)+ "!)^3}} e^{-x/" + n + "} \\left(\\frac{2x}{" + n + "}\\right)^{" + l + "} \\left[" + sign + "\\left(\\frac{d}{dx}\\right)^{" + (2*l+1) + "} L_{" + (n+l) + "}(x)\\right] \\]";
			mathDiv.innerHTML = mathString;
			
			//Evaluate
			var P = new Float64Array(x.length);
			var fact = eps * Math.sqrt(Math.pow(2/n,3) * factorial(n-l-1)/(2*n*Math.pow(factorial(n+l),3)));
			for(var i=0; i<x.length; i++)
				P[i] = fact * Math.exp(-x[i]/n) * Math.pow(2*x[i]/n,l) * poly.eval(2*x[i]/n);
			
			if(holdCheck.checked)
				PList.push(P);
			else
			{
				PList.length = 0;
				PList.push(P);
			}
		}
		else
		{
			alert("Polynomial name not found!");
			return -1;
		}
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathDiv]);
		
		//Plot
		plot();
	}
	
	//Clear plot and list
	function clearHandler()
	{
		PList.length = 0;
		mathString = "";
		mathDiv.innerHTML = mathString;
		plot();
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
		if(PList.length == 0)
			myPainter.plot([0], [0], "rgb(255,255,255)");
		else
		{
			myPainter.plot(x, PList[0], colorList[0]);
			myPainter.setHoldOn(true);
			for(var i=1; i<PList.length; i++)
				myPainter.plot(x, PList[i], colorList[i%6]);
		}
	}
};

//Setup 1D grid
SpecFunc.setupGrid = function(xMin, xMax, dx)
{
	var n = Math.round((xMax-xMin)/dx + 1);
	var x = new Float64Array(n);
	for(var i=0; i<n; i++)
	{
		x[i] = xMin + dx*i;
	}
	return x;
};
