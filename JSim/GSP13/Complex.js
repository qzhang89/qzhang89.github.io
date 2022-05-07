/**
 * @file Complex class for complex number operations
 * @author Qian Zhang
 */

/**
 * Creates an instance of Complex
 * 
 * @class Complex class for complex number operations
 * @param {Number} re - real part
 * @param {Number} im - imaginary part
 * @property {Number} this.re - real part
 * @property {Number} this.im - imaginary part
 * @example
 * var a = new Complex(2, 3); // Create a complex number 2+3i
 */
function Complex(re, im) {
    this.re = re;
    this.im = im;
}

/**
 * Complex conjugate
 * 
 * @method
 * @returns (Complex) conjugate of the complex number
 * @example
 * var a = new Complex(2, 3);  // Create a complex number 2+3i
 * var aCnjgt = a.conjugate(); // Return the complex conjugate 2-3i
 */
Complex.prototype.conjugate = function() {
    return (new Complex(this.re, -this.im));
};

/**
 * Complex phase
 * 
 * @method
 * @returns (Number) phase of the complex number (0 to 2*PI)
 * @example
 * var a = new Complex(2, 3); // Create a complex number 2+3i
 * var phi = a.phase();       // Return the phase arctan(3/2)
 */
Complex.prototype.phase = function() {
    var phi;
    if (this.im>=0) {
        phi = Math.atan2(this.im, this.re);
    } else {
        phi = Math.atan2(this.im, this.re)+2*Math.PI;
    }
    return phi;
};

/**
 * Add operation
 * 
 * @method
 * @param   {Complex} b - a complex number
 * @returns (Complex) sum of this and b
 * @example
 * var a = new Complex(2, 3); // Create a complex number 2+3i
 * var b = new Complex(1,-4); // Create a complex number 1-4i
 * var c = a.add(b);          // c = a + b
 */
Complex.prototype.add = function(b) {
    var sumRe = this.re+b.re;
    var sumIm = this.im+b.im;
    return (new Complex(sumRe, sumIm));
};

/**
 * Minus operation
 * 
 * @method
 * @param   {Complex} b - a complex number
 * @returns (Complex) difference of this and b
 * @example
 * var a = new Complex(2, 3); // Create a complex number 2+3i
 * var b = new Complex(1,-4); // Create a complex number 1-4i
 * var c = a.minus(b);        // c = a - b
 */
Complex.prototype.minus = function(b) {
    var differenceRe = this.re-b.re;
    var differenceIm = this.im-b.im;
    return (new Complex(differenceRe, differenceIm));
};

/**
 * Multiply operation
 * 
 * @method
 * @param   {Complex} b - a complex number
 * @returns (Complex) product of this and b
 * @example
 * var a = new Complex(2, 3); // Create a complex number 2+3i
 * var b = new Complex(1,-4); // Create a complex number 1-4i
 * var c = a.multiply(b);     // c = a * b
 */
Complex.prototype.multiply = function(b) {
    var productRe = this.re*b.re-this.im*b.im;
    var productIm = this.re*b.im+this.im*b.re;
    return (new Complex(productRe, productIm));
};

/**
 * Divide operation
 * 
 * @method
 * @param   {Complex} b - a complex number
 * @returns (Complex) quotient of this and b
 * @example
 * var a = new Complex(2, 3); // Create a complex number 2+3i
 * var b = new Complex(1,-4); // Create a complex number 1-4i
 * var c = a.divide(b);       // c = a / b
 */
Complex.prototype.divide = function(b) {
    var quotientRe = (this.re*b.re+this.im*b.im)/(b.re*b.re+b.im*b.im);
    var quotientIm = (this.im*b.re-this.re*b.im)/(b.re*b.re+b.im*b.im);
    return (new Complex(quotientRe, quotientIm));
};
