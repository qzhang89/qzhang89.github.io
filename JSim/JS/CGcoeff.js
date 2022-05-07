/*
 * CGcoeff.js
 * Create table of Clebsch-Cordan coefficients
 * Need to include MathJax.js
 */

var CGcoeff = new Object();

window.addEventListener("load", function() {CGcoeff.loadHandler();}, false);
CGcoeff.loadHandler = function()
{
	var cgDivs = document.getElementsByClassName("cg");
	for(var i=0; i<cgDivs.length; i++)
	{
		CGcoeff.setupCGcoeff(cgDivs[i]);
	}
};

//CGoeff setup
CGcoeff.setupCGcoeff = function(container)
{
	//Add HTML elements
	var html = "j<sub>a</sub> = <input type='text' value='1' size='1' />&nbsp;";
	html += "j<sub>b</sub> = <input type='text' value='0.5' size='1' /><br />";
	html += "<input type='button' value='Add' /><br />";
	container.innerHTML = html;
	
	//Get HTML elements
	var jaText    = container.getElementsByTagName("input")[0];
	var jbText    = container.getElementsByTagName("input")[1];
	var addButton = container.getElementsByTagName("input")[2];
	var wrapper   = document.getElementById("wrapper");
	
	//Add event listener
	addButton.addEventListener("click", addHandler, false);
	
	//Event handlers
	function addHandler()
	{
		//Get ja and jb values
		if(isNaN(jaText.value) || !isFinite(jaText.value) || isNaN(jaText.value) || !isFinite(jbText.value))
		{
			alert("Inputs must be numbers!");
			return -1;
		}
		
		var ja = parseFloat(jaText.value);
		var jb = parseFloat(jbText.value);
		
		if(ja%0.5!=0 || jb%0.5!=0 || ja<0 || jb<0)
		{
			alert("Inputs must be non-negative integers or half-integers!");
			return -1;
		}
		
		//Size of CG coefficients table
		var jaDim  = 2*ja+1;
		var jbDim  = 2*jb+1;
		var vecDim = jaDim * jbDim;
		
		//Matrix CG coefficients [ v0 | v1 | ... | vn-1 ]
		var CGmat = new Array();
		
		//Compute coefficients
		var n = 0;
		for(var j=ja+jb; j>=Math.abs(ja-jb); j--)
		{
			var vec = zerosVec(vecDim);
			
			//Find the start vector by orthogonality
			do
			{
				for(var i=0; i<vecDim; i++)
				{
					var ma = getMaMb(i)[0];
					var mb = getMaMb(i)[1];
					if(ma+mb == j)
						vec[i] = Math.random();
				}
				var ref = ja+jb-j;
				for(var jn=ja+jb; jn>j; jn--)
				{
					orthogonalize(vec, CGmat[ref]);
					ref += (2*jn+1)-1;
				}
			} while(dot(vec, vec) < 1e-4);
			
			//Phase convention
			var i=0;
			while(Math.abs(vec[i]) < 1e-8)
				i++;
			if(vec[i] < 0) //if the first non-zero element is negative
				vec = scale(-1, vec);
			
			//Normalize the start vector and push onto CGmat
			CGmat.push(normalize(vec));
			n++;
			
			//Apply J- to get following vectors
			for(var m=j-1; m>=-j; m--)
			{
				vec = zerosVec(vecDim);
				for(var i=0; i<vecDim; i++)
				{
					var ma = getMaMb(i)[0];
					var mb = getMaMb(i)[1];
					if(ma > -ja)
						vec[getIndex(ma-1,mb)] += CGmat[n-1][i]*Math.sqrt((ja*(ja+1)-ma*(ma-1))/(j*(j+1)-m*(m+1)));
					if(mb > -jb)
						vec[getIndex(ma,mb-1)] += CGmat[n-1][i]*Math.sqrt((jb*(jb+1)-mb*(mb-1))/(j*(j+1)-m*(m+1)));
				}
				CGmat.push(normalize(vec));
				n++;
			}
		}
		
		//Print into table with MathJax
		var tex = "\\[\n";
		tex += "\\begin{array} {| r r |";
		for(var j=ja+jb; j>=Math.abs(ja-jb); j--)
		{
			for(var m=j; m>=-j; m--)
				tex += " r";
			tex += " |";
		}
		tex += "}\n\\hline\n";
		tex += "j_a=" + float2frac(ja);
		tex += " & j_b=" + float2frac(jb);
		for(var j=ja+jb; j>=Math.abs(ja-jb); j--)
			for(var m=j; m>=-j; m--)
				tex += " & j=" + float2frac(j);
		tex += " \\\\\n";
		tex += "m_a & m_b";
		for(var j=ja+jb; j>=Math.abs(ja-jb); j--)
			for(var m=j; m>=-j; m--)
				tex += " & m=" + float2frac(m);
		tex += " \\\\ \\hline\n";
		for(var i=0; i<vecDim; i++)
		{
			var ma = getMaMb(i)[0];
			var mb = getMaMb(i)[1];
			tex += float2frac(ma) + " & " + float2frac(mb);
			n = 0;
			for(var j=ja+jb; j>=Math.abs(ja-jb); j--)
			{
				for(var m=j; m>=-j; m--)
				{
					if(ma+mb == m)
						tex += " & " + float2sqrtfrac(CGmat[n][i]);
					else
						tex += " & ";
					n++;
				}
			}
			tex += " \\\\ \n";
		}
		tex += "\\hline\n";
		tex += "\\end{array}\n";
		tex += "\\]";
		var mathDiv = container.getElementsByTagName("div")[0];
		if(!!mathDiv)
			container.removeChild(mathDiv);
		mathDiv = document.createElement("div");
		mathDiv.innerHTML = tex;
		mathDiv.style.display = "inline-block";
		container.appendChild(mathDiv);
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathDiv]);
		MathJax.Hub.Queue(function() {wrapper.style.minWidth = mathDiv.clientWidth + 250 + "px";});
		
		//Get index: [ma, mb] to vector element i
		function getIndex(ma, mb)
		{
			return (ja-ma)*jbDim + (jb-mb);
		}

		//Get ma mb: vector element i to [ma, mb]
		function getMaMb(i)
		{
			var ma = ja - Math.floor(i/jbDim);
			var mb = jb - i%jbDim;
			return [ma, mb];
		}
		
		function zerosVec(n)
		{
			var vec = new Array(n);
			for(var i=0; i<n; i++)
				vec[i] = 0;
			return vec;
		}
		
		function dot(vec1, vec2)
		{
			var n = vec1.length;
			var result = 0;
			for(var i=0; i<n; i++)
				result += vec1[i]*vec2[i];
			return result;
		}
		
		function scale(sca, vec)
		{
			var n = vec.length;
			for(var i=0; i<n; i++)
				vec[i] = sca*vec[i];
			return vec;
		}
		
		function normalize(vec)
		{
			return scale(Math.sqrt(1/dot(vec, vec)), vec);
		}
		
		function orthogonalize(ortVec, refVec)
		{
			var n = ortVec.length;
			var proj = dot(ortVec, refVec); //refVec is unit vector
			for(var i=0; i<n; i++)
				ortVec[i] = ortVec[i] - proj*refVec[i];
			return ortVec;
		}
		
		//Input a float number, Output a latex string of fraction
		function float2frac(r)
		{
			var max = 100000000;
			var ai  = Math.floor(r);
			var m00 = 1, m01 = 0, m10 = 0, m11 = 1;
			
			//Loop finding terms until denomitor gets too big
			while(m10*ai+m11 <= max)
			{
				var t;
				t = Math.floor(m00*ai+m01);
				m01 = m00;
				m00 = t;
				t = Math.floor(m10*ai+m11);
				m11 = m10;
				m10 = t;
				if(r == ai)
					break;
				r = 1 / (r-ai);
				ai = Math.floor(r);
			}
			
			if(m10 != 1)
				return m00 + "/" + m10;
			else
				return m00;
		}
		
		function float2sqrtfrac(r)
		{
			var rr = float2frac(r*r);
			if(Math.abs(r) <= 1e-8)
				return "0";
			else if(Math.abs(r-1) <= 1e-8)
				return "1";
			else if(r > 0)
				return "\\sqrt{" + rr + "}";
			else
				return "-\\sqrt{" + rr + "}";
		}
	}
};
