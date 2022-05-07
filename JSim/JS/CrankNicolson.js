/*
 * CrankNicolson.js
 * Solve tridiagonal linear systems with complex numbers
 * Need to include Complex.js
 */

var CrankNicolson = new Object();

//Complex tridiagonal matrix solver
CrankNicolson.complexTridiagmatrixSolver = function(a, b, c, d)
{
	//a, b, c are the 3 diagonal vectors of the tridiagonal matrix
	//d is the RHS vector, x is the solution vector
	//a[0] and c[n-1] are redundant
	
	var n = d.length;
	
	var cPrime = new Array(n);
	var dPrime = new Array(n);
	
	var x = new Array(n);
	
	//Modify the first-row coefficients
	cPrime[0] = c[0].divide(b[0]); //division by zero risk
	dPrime[0] = d[0].divide(b[0]); //division by zero risk
	
	//Modify the other-rows coefficients
	for(var i=1; i<n; i++)
	{
		var div = (new Complex(1, 0)).divide(b[i].minus(cPrime[i-1].multiply(a[i]))); //division by zero risk
		cPrime[i] = c[i].multiply(div);                                               //c[n-1] is redundant
		dPrime[i] = div.multiply(d[i].minus(dPrime[i-1].multiply(a[i])));
	}
	
	//Back substitution
	x[n-1] = dPrime[n-1];
	for(var i=n-2; i>=0; i--)
	{
		x[i] = dPrime[i].minus(cPrime[i].multiply(x[i+1]));
	}
	
	return x;
};

//Complex tridiagonal matrix multiply by vector
CrankNicolson.complexTridiagmatrixMultiplyVector = function(a, b, c, d)
{
	//a, b, c are the 3 diagonal vectors of the tridiagonal matrix
	//d is the multiplying vector, x is the resulting vector
	//a[0] and c[n-1] are redundant
	
	var n = d.length;
	var x = new Array(n);
	
	//x[0]
	x[0] = b[0].multiply(d[0]).add(c[0].multiply(d[1]));
	
	//x[1] to x[n-2]
	for(var i=1; i<=n-2; i++)
	{
		x[i] = a[i].multiply(d[i-1]).add(b[i].multiply(d[i])).add(c[i].multiply(d[i+1]));
	}
	
	//x[n-1]
	x[n-1] = a[n-1].multiply(d[n-2]).add(b[n-1].multiply(d[n-1]));
	
	return x;
};

//Complex periodic tridiagonal matrix solver
CrankNicolson.complexPeriodicTridiagmatrixSolver = function(a, b, c, d)
{
	//a, b, c are the 3 diagonal vectors of the tridiagonal matrix
	//d is the RHS vector, x is the solution vector
	//a[0] and c[n-1] are periodic matrix perturbation
	
	var n = d.length;
	
	//Perturbation
	var u = new Array(n);
	var v = new Array(n);
	for(var i=0; i<n; i++)
	{
		u[i] = new Complex(0, 0);
		v[i] = new Complex(0, 0);
	}
	u[0]   = new Complex(1, 0);
	u[n-1] = new Complex(1, 0);
	v[0]   = c[n-1];
	v[n-1] = a[0];

	var x = new Array(n);
	var y = new Array(n);
	var z = new Array(n);
	
	var bPrime = new Array(n);
	for(var i=0; i<n; i++)
	{
		bPrime[i] = b[i];
	}
	bPrime[0]   = b[0].minus(c[n-1]);
	bPrime[n-1] = b[n-1].minus(a[0]);
	
	y = CrankNicolson.complexTridiagmatrixSolver(a, bPrime, c, d);
	z = CrankNicolson.complexTridiagmatrixSolver(a, bPrime, c, u);
	
	var vy = new Complex(0, 0);
	var vz = new Complex(0, 0);
	for(var i=0; i<n; i++)
	{
		vy = vy.add(v[i].multiply(y[i]));
		vz = vz.add(v[i].multiply(z[i]));
	}
	
	for(var i=0; i<n; i++)
	{
		x[i] = y[i].minus(vy.divide((new Complex(1, 0)).add(vz)).multiply(z[i]));
	}
	
	return x;
};

//Complex periodic tridiagonal matrix multiply by vector
CrankNicolson.complexPeriodicTridiagmatrixMultiplyVector = function(a, b, c, d)
{
	//a, b, c are the 3 diagonal vectors of the tridiagonal matrix
	//d is the multiplying vector, x is the resulting vector
	//a[0] and c[n-1] are periodic matrix perturbation
	
	var n = d.length;
	var x = new Array(n);
	
	//x[0]
	x[0] = a[0].multiply(d[n-1]).add(b[0].multiply(d[0])).add(c[0].multiply(d[1]));
	
	//x[1] to x[n-2]
	for(var i=1; i<=n-2; i++)
	{
		x[i] = a[i].multiply(d[i-1]).add(b[i].multiply(d[i])).add(c[i].multiply(d[i+1]));
	}
	
	//x[n-1]
	x[n-1] = a[n-1].multiply(d[n-2]).add(b[n-1].multiply(d[n-1])).add(c[n-1].multiply(d[0]));
	
	return x;
};

//Complex Alternating Direction Implicit method
CrankNicolson.complexADI = function(Psi, AaX, AbX, AcX, BaX, BbX, BcX, AaY, AbY, AcY, BaY, BbY, BcY)
{
	var nx = AaX.length;
	var ny = AaY.length;
	
	var PsiX = new Array(ny);
	var PsiY = new Array(nx);
	var RHSX = new Array(nx);
	var RHSY = new Array(ny);
	
	//Crank Nicolson integration row-wise
	//j = 0
	for(var i=0; i<nx; i++)
	{
		RHSX[i] = BbY[0].multiply(Psi[0*nx+i]).add(BcY[0].multiply(Psi[1*nx+i]));
	}
	PsiX[0] = CrankNicolson.complexTridiagmatrixSolver(AaX, AbX, AcX, RHSX);
	//j = 1:ny-2
	for(var j=1; j<ny-1; j++)
	{
		for(var i=0; i<nx; i++)
		{
			RHSX[i] = BaY[j].multiply(Psi[(j-1)*nx+i]).add(BbY[j].multiply(Psi[j*nx+i])).add(BcY[j].multiply(Psi[(j+1)*nx+i]));
		}
		PsiX[j] = CrankNicolson.complexTridiagmatrixSolver(AaX, AbX, AcX, RHSX);
	}
	//j = ny-1
	for(var i=0; i<nx; i++)
	{
		RHSX[i] = BaY[ny-1].multiply(Psi[(ny-2)*nx+i]).add(BbY[ny-1].multiply(Psi[(ny-1)*nx+i]));
	}
	PsiX[ny-1] = CrankNicolson.complexTridiagmatrixSolver(AaX, AbX, AcX, RHSX);
	
	//Update n+1/2
	for(var j=0; j<ny; j++)
	{
		for(var i=0; i<nx; i++)
		{
			Psi[j*nx+i] = PsiX[j][i];
		}
	}
	
	//Crank Nicolson integration column-wise
	//i = 0
	for(var j=0; j<ny; j++)
	{
		RHSY[j] = BbX[0].multiply(Psi[j*nx]).add(BcX[0].multiply(Psi[j*nx+1]));
	}
	PsiY[0] = CrankNicolson.complexTridiagmatrixSolver(AaY, AbY, AcY, RHSY);
	//i = 1:nx-2
	for(var i=1; i<nx-1; i++)
	{
		for(var j=0; j<ny; j++)
		{
			RHSY[j] = BaX[i].multiply(Psi[j*nx+i-1]).add(BbX[i].multiply(Psi[j*nx+i])).add(BcX[i].multiply(Psi[j*nx+i+1]));
		}
		PsiY[i] = CrankNicolson.complexTridiagmatrixSolver(AaY, AbY, AcY, RHSY);
	}
	//i = nx-1
	for(var j=0; j<ny; j++)
	{
		RHSY[j] = BaX[nx-1].multiply(Psi[j*nx+nx-2]).add(BbX[nx-1].multiply(Psi[j*nx+nx-1]));
	}
	PsiY[nx-1] = CrankNicolson.complexTridiagmatrixSolver(AaY, AbY, AcY, RHSY);
	
	//Update n+1
	for(var i=0; i<nx; i++)
	{
		for(var j=0; j<ny; j++)
		{
			Psi[j*nx+i] = PsiY[i][j];
		}
	}
	
	return Psi;
};
