/*
 * Complex.js
 * Define complex number object and methods
 */

//Complex number object
function Complex(re, im)
{
	this.re = re;
	this.im = im;
}

//Complex conjugate
Complex.prototype.conjugate = function()
{
	return(new Complex(this.re, -this.im));
};

//Complex add
Complex.prototype.add = function(c)
{
	var sumRe = this.re + c.re;
	var sumIm = this.im + c.im;
	return(new Complex(sumRe, sumIm));
};

//Complex minus
Complex.prototype.minus = function(c)
{
	var differenceRe = this.re - c.re;
	var differenceIm = this.im - c.im;
	return(new Complex(differenceRe, differenceIm));
};

//Complex multiply
Complex.prototype.multiply = function(c)
{
	var productRe = this.re*c.re - this.im*c.im;
	var productIm = this.re*c.im + this.im*c.re;
	return(new Complex(productRe, productIm));
};

//Complex divide
Complex.prototype.divide = function(c)
{
	var quotientRe = (this.re*c.re + this.im*c.im) / (c.re*c.re + c.im*c.im);
	var quotientIm = (this.im*c.re - this.re*c.im) / (c.re*c.re + c.im*c.im);
	return(new Complex(quotientRe, quotientIm));
};
