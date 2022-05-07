/*
 * Radial.js
 * Shooting method for hydrogen atom radial wave function
 * Need to include Painter.js
 */

var Radial = new Object();

window.addEventListener("load", function() {Radial.loadHandler();}, false);
Radial.loadHandler = function()
{
    var radialManuDivs = document.getElementsByClassName("radialManu");
    for(var i=0; i<radialManuDivs.length; i++)
    {
        Radial.setupManu(radialManuDivs[i]);
    }
    var radialAutoDivs = document.getElementsByClassName("radialAuto");
    for(var i=0; i<radialAutoDivs.length; i++)
    {
        Radial.setupAuto(radialAutoDivs[i]);
    }
};

//Shooting method manual control setup
Radial.setupManu = function(container)
{
    //Get data from <div>{JSON}</div>
    var jsonData  = JSON.parse(container.innerHTML);
    var rMin  = typeof jsonData.rMin  === "undefined" ? 0.01  : jsonData.rMin;
    var rMax  = typeof jsonData.rMax  === "undefined" ? 150.0 : jsonData.rMax;
    var dx    = typeof jsonData.dx    === "undefined" ? 0.001 : jsonData.dx;
    var lMin  = typeof jsonData.lMin  === "undefined" ? 0     : jsonData.lMin;
    var lMax  = typeof jsonData.lMax  === "undefined" ? 5     : jsonData.lMax;
    var EMin  = typeof jsonData.EMin  === "undefined" ? 0     : jsonData.EMin;
    var EMax  = typeof jsonData.EMax  === "undefined" ? 50    : jsonData.EMax;
    var cw    = typeof jsonData.cw    === "undefined" ? 0.80  : jsonData.cw;
    var ch    = typeof jsonData.ch    === "undefined" ? 0.65  : jsonData.ch;
    var xRange = typeof jsonData.xRange === "undefined" ? [0, 150] : jsonData.xRange;
    var yRange = typeof jsonData.yRange === "undefined" ? [-0.6, 0.05] : jsonData.yRange;
    
    //Add HTML elements
    var html = "<canvas></canvas><br />";
    html += "<div>l = </div>";
    html += "<input type='range' step='1' /><br />";
    html += "<div>Energy = </div>";
    html += "<input type='range' step='0.001' />";
    container.innerHTML = html;
    
    //Get HTML elements
    var plotCanvas  = container.getElementsByTagName("canvas")[0];
    var lText       = container.getElementsByTagName("div")[0];
    var lRange      = container.getElementsByTagName("input")[0];
    var energyText  = container.getElementsByTagName("div")[1];
    var energyRange = container.getElementsByTagName("input")[1];
    
    lText.innerHTML = "l = " + lMin;
    lRange.min = lMin;
    lRange.max = lMax;
    lRange.value = lMin;
    energyText.innerHTML = "Energy = " + EMin.toFixed(3);
    energyRange.min = EMin;
    energyRange.max = EMax;
    energyRange.value = EMin;
    
    var colorList = [];
    colorList[0] = "rgb(0, 0, 255)";
    colorList[1] = "rgb(255, 155, 0)";
    colorList[2] = "rgb(255, 0, 0)";
    colorList[3] = "rgb(0, 200, 0)";
    colorList[4] = "rgb(155, 0, 255)";
    colorList[5] = "rgb(0, 155, 255)";
    
    var spdList = ["s", "p", "d", "f", "g", "h"];
    
    //Setup
    var Z = 1;
    var l = parseFloat(lRange.value);
    var x = Radial.setupGrid(Math.log(Z*rMin), Math.log(Z*rMax), dx);
    var r = Radial.x2r(x, Z);
    var V = Radial.setupPotential(r, function(ri) {return -Z/ri;});
    var E = parseFloat(energyRange.value);
    var R = Radial.shootManu(x, r, V, l, E);
    
    //Painter
    var myPainter = new Painter(plotCanvas);
    myPainter.setXRange(xRange[0], xRange[1]);
    myPainter.setYRange(yRange[0], yRange[1]);
    myPainter.setLabel("r", "Energy and R");
    myPainter.setTitle("Hydrogen atom radial wave function");
    
    //Initial plot
    plot();
    resize();
    
    //Add event listeners
    window.addEventListener("resize", resize, false);
    plotCanvas.addEventListener("mousemove", manuMoveHandler, false);
    plotCanvas.addEventListener("mousedown", manuDownHandler, false);
    plotCanvas.addEventListener("mouseup", manuUpHandler, false);
    plotCanvas.addEventListener("mouseout", manuOutHandler, false);
    energyRange.addEventListener("change", energyChangeHandler, false);
    energyRange.addEventListener("click", energyClickHandler, false);
    lRange.addEventListener("change", lChangeHandler, false);
    
    //Event handlers
    //Move energy on canvas
    var isDetected = false;
    var isDown     = false;
    var isFocused  = false;
    function manuDownHandler(evt) {evt.preventDefault(); isDown = true;}
    function manuUpHandler() {isDown = false; isFocused = false;}
    function manuOutHandler() {isDetected = false; document.body.style.cursor = "auto"; isDown = false; isFocused = false;}
    function manuMoveHandler(evt)
    {
        var marginWidth  = myPainter.marginWidth;
        var marginHeight = myPainter.marginHeight;
        var plotWidth    = myPainter.plotWidth;
        var plotHeight   = myPainter.plotHeight;
        var yScale     = myPainter.yScale;
        var yOrigin    = myPainter.yOrigin;
        
        var rect = plotCanvas.getBoundingClientRect();
        
        var mouseX = Math.round(evt.clientX - rect.left);
        var mouseY = Math.round(evt.clientY - rect.top);
        
        if(mouseX>=marginWidth && mouseX<=marginWidth+plotWidth && mouseY>=marginHeight && mouseY<=marginHeight+plotHeight)
        {
            if(isFocused == false)
            {
                if(mouseY>=yOrigin-E*yScale-5 && mouseY<=yOrigin-E*yScale+5) //energy detected
                {        
                    isDetected = true;
                    document.body.style.cursor = "pointer";
                    
                    if(isDown == true)
                    {
                        isFocused = true;
                        document.body.style.cursor = "n-resize";
                    }
                }
                else //energy not detected
                {        
                    isDetected = false;
                    document.body.style.cursor = "auto";
                }
            }
            
            //Move energy
            if(isFocused == true)
            {
                //Get new energy
                energyRange.value = (yOrigin-mouseY)/yScale;
                E = parseFloat(energyRange.value);
                energyText.innerHTML = "Energy = " + E.toFixed(3);
                
                R = Radial.shootManu(x, r, V, l, E);
                
                //Plot graph
                plot();
            }
        }
        else
            manuOutHandler();
    }
    
    //l change action
    function lChangeHandler()
    {
        l = parseFloat(lRange.value);
        lText.innerHTML = "l = " + l;
        
        R = Radial.shootManu(x, r, V, l, E);
        
        //Plot graph
        plot();
    }
    
    //Move energy range bar
    function energyChangeHandler()
    {
        E = parseFloat(energyRange.value);
        energyText.innerHTML = "Energy = " + E.toFixed(3);
        
        R = Radial.shootManu(x, r, V, l, E);
        
        //Plot graph
        plot();
    }
    function energyClickHandler() {energyRange.focus();}
    
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
        myPainter.plot(r, V, "rgb(0, 0, 0)");
        myPainter.setHoldOn(true);
        myPainter.plot(r, Radial.ROnE(R, 0.1, E), colorList[l]);
        myPainter.plotEnergy(E, spdList[l], colorList[l]);
    }
};

//Shooting method auto shoot setup
Radial.setupAuto = function(container)
{
    //Get data from <div>{JSON}</div>
    var jsonData  = JSON.parse(container.innerHTML);
    var rMin  = typeof jsonData.rMin  === "undefined" ? 0.01  : jsonData.rMin;
    var rMax  = typeof jsonData.rMax  === "undefined" ? 150.0 : jsonData.rMax;
    var dx    = typeof jsonData.dx    === "undefined" ? 0.001 : jsonData.dx;
    var lMin  = typeof jsonData.lMin  === "undefined" ? 0     : jsonData.lMin;
    var lMax  = typeof jsonData.lMax  === "undefined" ? 5     : jsonData.lMax;
    var lLim  = typeof jsonData.lLim  === "undefined" ? 0.0   : jsonData.lLim;
    var uLim  = typeof jsonData.uLim  === "undefined" ? 60.0  : jsonData.uLim;
    var cw    = typeof jsonData.cw    === "undefined" ? 0.80  : jsonData.cw;
    var ch    = typeof jsonData.ch    === "undefined" ? 0.65  : jsonData.ch;
    var xRange = typeof jsonData.xRange === "undefined" ? [0, 150] : jsonData.xRange;
    var yRange = typeof jsonData.yRange === "undefined" ? [-0.6, 0.05] : jsonData.yRange;
    
    //Add HTML elements
    var html = "<canvas></canvas><br />";
    html += "<div>l = </div>";
    html += "<input type='range' step='1' /><br />";
    html += "Upper limit: <input type='text' value='60.0' size='6' /><br />";
    html += "Lower limit: <input type='text' value='0.0' size='6' /><br />";
    html += "<input type='button' value='Start' />";
    container.innerHTML = html;
    
    //Get HTML elements
    var plotCanvas  = container.getElementsByTagName("canvas")[0];
    var lText       = container.getElementsByTagName("div")[0];
    var lRange      = container.getElementsByTagName("input")[0];
    var upperLimit  = container.getElementsByTagName("input")[1];
    var lowerLimit  = container.getElementsByTagName("input")[2];
    var startButton = container.getElementsByTagName("input")[3];
    
    lText.innerHTML = "l = " + lMin;
    lRange.min = lMin;
    lRange.max = lMax;
    lRange.value = lMin;
    upperLimit.value = uLim;
    lowerLimit.value = lLim;
    
    var colorList = new Array();
    colorList[0] = "rgb(0, 0, 255)";
    colorList[1] = "rgb(255, 155, 0)";
    colorList[2] = "rgb(255, 0, 0)";
    colorList[3] = "rgb(0, 200, 0)";
    colorList[4] = "rgb(155, 0, 255)";
    colorList[5] = "rgb(0, 155, 255)";
    
    var spdList = ["s", "p", "d", "f", "g", "h"];
    
    //Setup
    var Z = 1;
    var l = parseFloat(lRange.value);
    var x = Radial.setupGrid(Math.log(Z*rMin), Math.log(Z*rMax), dx);
    var r = Radial.x2r(x, Z);
    var V = Radial.setupPotential(r, function(ri) {return -Z/ri;});
    var orbitList = new Array();
    
    //Painter
    var myPainter = new Painter(plotCanvas);
    myPainter.setXRange(xRange[0], xRange[1]);
    myPainter.setYRange(yRange[0], yRange[1]);
    myPainter.setLabel("r", "Energy and R");
    myPainter.setTitle("Hydrogen atom radial wave function");
    
    //Initial plot
    plot();
    resize();
    
    //Add event listeners
    window.addEventListener("resize", resize, false);
    startButton.addEventListener("click", startClickHandler, false);
    lRange.addEventListener("change", lChangeHandler, false);
    
    //Event handlers
    //Click start button
    function startClickHandler()
    {
        //Energy limits
        if(isNaN(lowerLimit.value) || !isFinite(lowerLimit.value) || isNaN(upperLimit.value) || !isFinite(upperLimit.value))
        {
            alert("Inputs must be numbers!");
            return -1;
        }
        
        var ELow = parseFloat(lowerLimit.value);
        var EUp  = parseFloat(upperLimit.value);
        
        orbitList = Radial.shootAuto(x, r, V, l, ELow, EUp);
        
        //Plot graph
        plot();
    }
    
    //l change action
    function lChangeHandler()
    {
        l = parseFloat(lRange.value);
        lText.innerHTML = "l = " + l;
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
        myPainter.plot(r, V, "rgb(0, 0, 0)");
        myPainter.setHoldOn(true);
        for(var i=0; i<orbitList.length; i++)
        {
            var rSub = orbitList[i][0];
            var R    = orbitList[i][2];
            var E    = orbitList[i][3];
            var n    = orbitList[i][4];
            myPainter.plot(rSub, Radial.ROnE(R, 0.1, E), colorList[l]);
            myPainter.plotEnergy(E, n+spdList[l], colorList[l]);
        }
    }
};

//Shooting method manual
Radial.shootManu = function(x, r, V, l, E)
{
    var u, R;
    u = Radial.initialize(r, l);
    u = Radial.integrate(x, r, u, V, l, E);
    u = Radial.normalize(x, r, u);
    R = Radial.u2R(r, u);
    
    return R;
};

//Shooting method auto
Radial.shootAuto = function(x, r, V, l, ELow, EUp)
{
    var orbitList = new Array();
    
    var u, R;
    var lowNode, upNode;
    
    //Count nodes
    u = Radial.initialize(r, l);
    u = Radial.integrate(x, r, u, V, l, ELow);
    u = Radial.normalize(x, r, u);
    R = Radial.u2R(r, u);
    lowNode = Radial.countNode(R);
    u = Radial.initialize(r, l);
    u = Radial.integrate(x, r, u, V, l, EUp);
    u = Radial.normalize(x, r, u);
    R = Radial.u2R(r, u);
    upNode  = Radial.countNode(R);
    
    if(upNode-lowNode <= 0)
    {
        alert("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
        return orbitList;
    }
    
    //Recursively divide energy to find only one node difference in between
    function divideEnergy(ELow, EUp)
    {
        var u, R;
        var lowNode, upNode;
        var orbit;
        
        //Count nodes
        u = Radial.initialize(r, l);
        u = Radial.integrate(x, r, u, V, l, ELow);
        u = Radial.normalize(x, r, u);
        R = Radial.u2R(r, u);
        lowNode = Radial.countNode(R);
        u = Radial.initialize(r, l);
        u = Radial.integrate(x, r, u, V, l, EUp);
        u = Radial.normalize(x, r, u);
        R = Radial.u2R(r, u);
        upNode  = Radial.countNode(R);
        
        if(upNode-lowNode == 1) //base case
        {
            orbit = Radial.bisect(x, r, V, l, ELow, EUp);
            if(orbit != -1)
                orbitList.push(orbit);
        }
        else if(upNode-lowNode > 1) //recursion
        {
            divideEnergy(ELow, (EUp+ELow)/2);
            divideEnergy((EUp+ELow)/2, EUp);
        }
    }
    divideEnergy(ELow, EUp);
    
    return orbitList;
};

//Setup 1D grid
Radial.setupGrid = function(xMin, xMax, dx)
{
    var n = Math.round((xMax-xMin)/dx + 1);
    var x = new Float64Array(n);
    for(var i=0; i<n; i++)
    {
        x[i] = xMin + dx*i;
    }
    return x;
};

//x grid (log) to r grid (radial)
Radial.x2r = function(x, Z)
{
    var r = new Float64Array(x.length);
    for(var i=0; i<x.length; i++)
        r[i] = Math.exp(x[i])/Z;
    return r;
};

//Infinite potential well
Radial.setupPotential = function(x, Vi)
{
    var n = x.length;
    var V = new Float64Array(n);
    for(var i=0; i<n; i++)
    {
        V[i] = Vi(x[i]);
    }
    return V;
};

//Initialize u_tilde
Radial.initialize = function(r, l)
{
    var n = r.length;
    var u = new Float64Array(n);
    for(var i=0; i<n; i++)
        u[i] = 0;
    
    //Initial condition
    u[0] = Math.pow(r[0], l+1) / Math.sqrt(r[0]);
    u[1] = Math.pow(r[1], l+1) / Math.sqrt(r[1]);;
    
    return u;
};

//Forward integration for u_tilde and rescale to u = sqrt(r) u_tilde
Radial.integrate = function(x, r, u, V, l, E)
{
    var n  = x.length;
    var dx = x[1] - x[0];
    
    //Integrate for radial wave function
    var kk = new Float64Array(n);
    for(var i=0; i<n; i++)
        kk[i] = r[i]*r[i]*E - r[i]*r[i]*V[i] - 0.5*(l+0.5)*(l+0.5);
    
    for(var i=2; i<n; i++)
    {
        u[i] = ((2-5/3*dx*dx*kk[i-1])*u[i-1] - (1+1/6*dx*dx*kk[i-2])*u[i-2]) / (1+1/6*dx*dx*kk[i]);
        if(isNaN(u[i]) || !isFinite(u[i])) //in case diverges out of machine limit
            u[i] = u[i-1];
    }
    
    //Rescale u_tilde to u
    for(var i=0; i<n; i++)
    {
        u[i] = u[i]*Math.sqrt(r[i]);
        if(isNaN(u[i]) || !isFinite(u[i])) //in case diverges out of machine limit
            u[i] = u[i-1];
    }
    
    return u;
};

//Normalization
Radial.normalize = function(x, r, u)
{
    var n  = x.length;
    var dx = x[1] - x[0];
    
    //Normalization based on convergence behavior
    var stop = Math.floor(n/2); //stop at the middle in case of monotonically increasing function
    for(var i=n-1; i>=0; i--)
    {
        if(Math.abs(u[i-1]) > Math.abs(u[i]))
        {
            stop = i;
            break;
        }
    }
    
    var sum = 0;
    for(var i=0; i<=stop; i++)
        sum = sum + u[i]*u[i]*dx*r[i];
    
    var norm = Math.sqrt(sum);
    for(var i=0; i<n; i++)
        u[i] = u[i]/norm;
    
    return u;
};

//Rescale u to R = u/r
Radial.u2R = function(r, u)
{
    var n = r.length;
    var R = new Float64Array(n);
    for(var i=0; i<n; i++)
    {
        R[i] = u[i] / r[i];
        if(isNaN(R[i]) || !isFinite(R[i])) //in case diverges out of machine limit
            R[i] = R[i-1];
    }
    return R;
};

//*A+E for plotting
Radial.ROnE = function(R, A, E)
{
    var n = R.length;
    var RE = new Float64Array(n);
    
    for(var i=0; i<n; i++)
        RE[i] = R[i]*A + E;
    
    return RE;
};

//Count the number of nodes
Radial.countNode = function(R)
{
    var nNode = 0;
    var preValue = 0;
    var curValue = 0;
    
    var n = R.length;
    for(var i=0; i<n; i++)
    {
        curValue = R[i];
        if(preValue*curValue < 0) //node detected
            nNode++;
        preValue = curValue;
    }
    
    return nNode;
};

//Bisection method
Radial.bisect = function(x, r, V, l, ELow, EUp)
{
    var n = x.length;
    
    var u, R;
    var lowDir     = 0;
    var upDir      = 0;
    var currentDir = 0;
    
    //Determine the initial direction of lowDir
    u = Radial.initialize(r, l);
    u = Radial.integrate(x, r, u, V, l, ELow);
    u = Radial.normalize(x, r, u);
    R = Radial.u2R(r, u);
    lowDir = R[n-1];
    
    //Determine the initial direction of upDir
    u = Radial.initialize(r, l);
    u = Radial.integrate(x, r, u, V, l, EUp);
    u = Radial.normalize(x, r, u);
    R = Radial.u2R(r, u);
    upDir = R[n-1];
    
    if(lowDir*upDir > 0)
    {
        alert("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
        return -1;
    }
    
    var E = (ELow+EUp)/2;
    var itMax = 100;
    for(var it=1; it<=itMax; it++)
    {
        E = (ELow+EUp)/2;
        
        //Determine the direction of currentDir
        u = Radial.initialize(r, l);
        u = Radial.integrate(x, r, u, V, l, E);
        u = Radial.normalize(x, r, u);
        R = Radial.u2R(r, u);
        currentDir = R[n-1];
        
        //Check direction
        var eps = 1e-6;
        if(Math.abs(currentDir) < eps)
        {
            //Truncate diverging tail
            var stop = Math.floor(n/2);
            for(var i=n-1; i>=0; i--)
            {
                if(Math.abs(R[i-1]) > Math.abs(R[i]))
                {
                    stop = i;
                    break;
                }
            }
            var rSub = r.subarray(0, stop);
            var uSub = u.subarray(0, stop);
            var RSub = R.subarray(0, stop);
            var node = Radial.countNode(RSub);
            return [rSub, uSub, RSub, E, node+l+1, l];
        }
        else
        {
            if(lowDir*upDir > 0)
            {
                alert("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
                return -1;
            }
            else if(currentDir*lowDir > 0)
            {
                ELow = E;
                lowDir = currentDir;
            }
            else if(currentDir*upDir > 0)
            {
                EUp = E;
                upDir = currentDir;
            }
            else
            {
                alert("Eigen-energy not found between ELow = " + ELow + " and EUp = " + EUp + "!");
                return -1;
            }
        }
    }
    //Cannot converge due to machine accuracy
    //Truncate diverging tail
    var stop = Math.floor(n/2);
    for(var i=n-1; i>=0; i--)
    {
        if(Math.abs(R[i-1]) > Math.abs(R[i]))
        {
            stop = i;
            break;
        }
    }
    var rSub = r.subarray(0, stop);
    var uSub = u.subarray(0, stop);
    var RSub = R.subarray(0, stop);
    var node = Radial.countNode(RSub);
    return [rSub, uSub, RSub, E, node+l+1, l];
};

//Recursively divide energy to find states with n and l in between ELow adn EUp
Radial.shootNL = function(x, r, V, n, l, ELowLow, ELowUp, EUpLow, EUpUp, checkFlag)
{
    var u, R;
    var lowNode, upNode;
    
    if(checkFlag == 1)
    {
        //Count nodes
        u = Radial.initialize(r, l);
        u = Radial.integrate(x, r, u, V, l, ELowLow);
        u = Radial.normalize(x, r, u);
        R = Radial.u2R(r, u);
        lowNode = Radial.countNode(R);
        u = Radial.initialize(r, l);
        u = Radial.integrate(x, r, u, V, l, EUpUp);
        u = Radial.normalize(x, r, u);
        R = Radial.u2R(r, u);
        upNode = Radial.countNode(R);
        
        if(lowNode > n-l-1 || upNode < n-l)
        {
            alert("Eigen-energy with n = " + n + " and l = " + l + " not found between ELow = " + ELowLow + " and EUp = " + EUpUp + "!");
            return (new Array());
        }
    }
    
    var ELowCur = (ELowLow + ELowUp)/2;
    var EUpCur  = (EUpLow + EUpUp)/2;
    
    //Count nodes
    u = Radial.initialize(r, l);
    u = Radial.integrate(x, r, u, V, l, ELowCur);
    u = Radial.normalize(x, r, u);
    R = Radial.u2R(r, u);
    lowNode = Radial.countNode(R);
    u = Radial.initialize(r, l);
    u = Radial.integrate(x, r, u, V, l, EUpCur);
    u = Radial.normalize(x, r, u);
    R = Radial.u2R(r, u);
    upNode = Radial.countNode(R);
    
    if(lowNode == n-l-1)
    {
        ELowLow = ELowCur;
        ELowUp  = ELowCur;
    }
    else if(lowNode < n-l-1)
        ELowLow = ELowCur;
    else if(lowNode > n-l-1)
        ELowUp  = ELowCur;
    
    if(upNode == n-l)
    {
        EUpLow = EUpCur;
        EUpUp  = EUpCur;
    }
    else if(upNode < n-l)
        EUpLow = EUpCur;
    else if(upNode > n-l)
        EUpUp  = EUpCur;
    
    if(lowNode == n-l-1 && upNode == n-l) //base case, return this eigen state
        return Radial.shootAuto(x, r, V, l, ELowCur, EUpCur)[0];
    else
        return Radial.shootNL(x, r, V, n, l, ELowLow, ELowUp, EUpLow, EUpUp, 0);
};
