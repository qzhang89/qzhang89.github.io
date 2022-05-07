/*
 * Polynomial.js
 * Class representing polynomials
 * Need to include MathJax.js
 */

//Polynomial object
function Polynomial(coeffArray)
{
	this.coeffArray = coeffArray;
}

//Evaluate value of the polynomial
Polynomial.prototype.eval = function(x)
{
	var xi = 1;
	var result = this.coeffArray[0];
	for(var i=1; i<this.coeffArray.length; i++)
	{
		xi *= x;
		result += this.coeffArray[i] * xi;
	}
	return result;
};

//Convert polynomial as a string
Polynomial.prototype.toString = function()
{
	function float2frac(r)
	{
		var max = 1000000;
		var ai  = Math.floor(r);
		var m00 = 1, m01 = 0, m10 = 0, m11 = 1;
		
		//Loop finding terms until denominator gets too big
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
			return "\\frac{" + m00 + "}{" + m10 + "}";
		else
			return m00;
	}
	
	var sign;
	var str = "\\[ ";
	for(var i=this.coeffArray.length-1; i>=0; i--) //print in reverse order
	{
		if(Math.abs(this.coeffArray[i]) > 1e-8)
		{
			this.coeffArray[i]>0 ? sign=" + " : sign=" - ";
			if(str==="\\[ " && sign===" + ")
				sign = ""; //remove the leading +
			str += sign + float2frac(Math.abs(this.coeffArray[i]));
			if(i > 1)
				str += "x^{" + i + "}";
			else if(i == 1)
				str += "x";
		}
	}
	str += " \\]";
	return str;
};

//Polynomial multiply by a scalar
Polynomial.prototype.multScalar = function(a)
{
	var poly = new Polynomial([]);
	for(var i=0; i<this.coeffArray.length; i++)
		poly.coeffArray[i] = a*this.coeffArray[i];
	return poly;
};

//Polynomial multiply by a x^n
Polynomial.prototype.multXn = function(n)
{
	if(n < 0)
	{
		alert("Called multXn with n<0!");
		return -1;
	}
	var poly = new Polynomial([]);
	for(var i=0; i<n; i++)
		poly.coeffArray[i] = 0;
	for(var i=0; i<this.coeffArray.length; i++)
		poly.coeffArray[i+n] = this.coeffArray[i];
	return poly;
};

//Polynomial add a polynomial
Polynomial.prototype.add = function(p)
{
	var poly = new Polynomial(this.coeffArray);
	for(var i=0; i<p.coeffArray.length; i++)
	{
		if(typeof poly.coeffArray[i] === "number")
			poly.coeffArray[i] += p.coeffArray[i];
		else
			poly.coeffArray[i] = p.coeffArray[i];
	}
	return poly;
};

//Polynomial differentiation
Polynomial.prototype.diff = function()
{
	var poly = new Polynomial([]);
	for(var i=0; i<this.coeffArray.length-1; i++)
		poly.coeffArray[i] = this.coeffArray[i+1]*(i+1);
	return poly;
};
