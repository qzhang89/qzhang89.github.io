/*
 * OrbtVisual.js
 * Visualization of probability density
 * Need to include Complex.js, Painter3D.js
 */

var OrbtVisual = new Object();

window.addEventListener("load", function() {OrbtVisual.loadHandler();}, false);
OrbtVisual.loadHandler = function() {
    var OrbtVisualDivs = document.getElementsByClassName("OrbtVisual");
    for (var i=0; i<OrbtVisualDivs.length; i++) {
        OrbtVisual.setupOrbtVisual(OrbtVisualDivs[i]);
    }
};

// OrbtVisual setup
OrbtVisual.setupOrbtVisual = function(container) {
    // Get data from <div>{JSON}</div>
    var jsonData  = JSON.parse(container.innerHTML);
    var bkgdColor = typeof jsonData.bkgdColor === "undefined" ? [0.0,0.0,0.0] : jsonData.bkgdColor;
    var gridColor = typeof jsonData.gridColor === "undefined" ? [0.5,0.5,0.5] : jsonData.gridColor;
    var cWidth    = typeof jsonData.cWidth    === "undefined" ? 1.0           : jsonData.cWidth;
    var cHeight   = typeof jsonData.cHeight   === "undefined" ? 1.0           : jsonData.cHeight;
    
    // Add HTML elements
    var html = "";
    html += "<canvas></canvas><br />";
    html += "<input type='range'><br />";
    html += "<select></select>    ";
    html += "<select></select><br />";
    html += "<textarea rows='8' cols='60' readonly></textarea><br />";
    html += "<select style='width:20em;height:10em' multiple></select><br />";
    html += "<input type='button' value='Load data' /> ";
    html += "<input type='button' value='Input data' />  ";
    html += "<input type='button' value='Delete data' /><br />";
    container.innerHTML = html;
    
    // Get HTML elements
    var glCanvas    = container.getElementsByTagName("canvas")[0];
    var densRange   = container.getElementsByTagName("input")[0];
    var nlList      = container.getElementsByTagName("select")[0];
    var mList       = container.getElementsByTagName("select")[1];
    var jsonText    = container.getElementsByTagName("textarea")[0];
    var fileList    = container.getElementsByTagName("select")[2];
    var loadButton  = container.getElementsByTagName("input")[1];
    var inputButton = container.getElementsByTagName("input")[2];
    var delButton   = container.getElementsByTagName("input")[3];
    
    densRange.disabled = "disabled";
    
    // Painter3D
    var glPainter = new Painter3D(glCanvas);
    glPainter.setBkgdColor(bkgdColor);
    glPainter.setMatrices([0.0,0.0,-12.5], [-1.2,0.0,-0.785]);
    
    // Setup axis
    glPainter.setupAxis(7, 0.5);
    glPainter.setAxisOn(true);
    
    // Setup grid
    glPainter.setupGrid(0.5, 12, gridColor);
    glPainter.setGridOn(true);
    
    // Resize mesh
    var mm = [];
    for (var i=0; i<=48; i++) {
        mm[i] = (i-24)/4;
    }
    glPainter.setupMesh(mm, mm, 0, true);
    
    // Initial plot
    resize();
    
    // Orbital data
    var rMin=0.0001, dx=0.002, Z=1, r=[], orbtList=[]; // to be read from JSON
    
    // Points vertices, colors
    var pointVertices = [];
    var pointNormals  = [];
    var pointColors   = [];
    
    // Add event listeners
    window.addEventListener("resize", resize, false);
    glCanvas.addEventListener("keydown", keyDownHandler, false);
    densRange.addEventListener("change", densChangeHandler, false);
    nlList.addEventListener("change", nlChangeHandler, false);
    mList.addEventListener("change", mChangeHandler, false);
    inputButton.addEventListener("click", inputClickHandler, false);
    loadButton.addEventListener("click", loadClickHandler, false);
    delButton.addEventListener("click", delClickHandler, false);
    
    // Read filenames from server
    var nameList = null;
    $.ajaxSetup({async: false});
    $.getJSON("PHP/readJSON.php", function(msg) {nameList = msg;});
    
    for (var i=2; i<nameList.length; i++) {
        var option = document.createElement("option");
        option.text = nameList[i];
        fileList.add(option, null);
    }
    fileList.selectedIndex = 0;    
    
    // Event handlers
    // Load data from server
    function loadClickHandler() {
        $.getJSON("PHP/JSON/"+nameList[fileList.selectedIndex+2], function(msg) {
            jsonText.value = JSON.stringify(msg);
        });
    }
    
    // Delete data on the server
    function delClickHandler() {
        var fname = nameList[fileList.selectedIndex+2];
        
        var cfm = confirm("Are you sure to delete \"" + fname + "\" on the server?");
        if (cfm) {
            $.post("PHP/deleteJSON.php", {filename:"JSON/"+fname, data:jsonText.value}, function(msg1) {
                if (msg1 == "0") {
                    // Re-read filenames from server
                    nameList = null;
                    $.ajaxSetup({async: false});
                    $.getJSON("PHP/readJSON.php", function(msg2) {nameList = msg2;});
                    
                    fileList.length = 0;
                    for (var i=2; i<nameList.length; i++) {
                        var option = document.createElement("option");
                        option.text = nameList[i];
                        fileList.add(option, null);
                    }
                    fileList.selectedIndex = 0;
                }
            });
        }
    }
    
    // Input JSON data
    function inputClickHandler() {
        try {
            var data = JSON.parse(jsonText.value);
        } catch(e) {
            alert("Expect input data!");
            return -1;
        }
        rMin     = data.rMin;
        dx       = data.dx;
        Z        = data.Z;
        r        = data.r;
        orbtList = data.orbtList;
        
        // Update nlList
        nlList.length = 0;
        for (var i=0; i<orbtList.length; i++) {
            var option = document.createElement("option");
            var lStr;
            switch (orbtList[i].l) {
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
            option.text = orbtList[i].n + lStr;
            nlList.add(option, null);
        }
        nlList.selectedIndex = orbtList.length-1;
        
        // Invoke nlChangeHandler
        nlChangeHandler();
    }
    
    // On nlList change
    function nlChangeHandler() {
        var nlIdx = nlList.selectedIndex;
        var l = orbtList[nlIdx].l;
        
        // Update mList
        mList.length = 0;
        for (var m=-l; m<=l; m++) {
            var option = document.createElement("option");
            option.text = "m=" + m;
            mList.add(option, null);
        }
        // Append real harmonics options
        if (l == 0) {
            var option = document.createElement("option");
            option.text = "s";
            mList.add(option, null);
        } else if (l == 1) {
            var option = document.createElement("option");
            option.text = "p_z";
            mList.add(option, null);
            var option = document.createElement("option");
            option.text = "p_x";
            mList.add(option, null);
            var option = document.createElement("option");
            option.text = "p_y";
            mList.add(option, null);
        } else if (l == 2) {
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
        } else if (l == 3) {
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
        
        // Invoke mChangeHandler
        mChangeHandler();
    }
    
    // On mList change
    function mChangeHandler() {
        var nlIdx = nlList.selectedIndex;
        var mIdx  = mList.selectedIndex;
        
        var E = orbtList[nlIdx].E;
        var l = orbtList[nlIdx].l;
        var R = orbtList[nlIdx].R;
        
        var cc, ll, mm;
        if (mIdx <= 2*l) {
            // Pure harmonics
            cc = [new Complex(1,0)]; ll = [orbtList[nlIdx].l]; mm = [mIdx - l];
        } else {
            // Real harmonics
            var sq2inv = 1/Math.sqrt(2.0);
            
            switch (mList[mIdx].value) {
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
        
        function factorial(n) {
            var result = 1;
            for (var i=2; i<=n; i++) {
                result *= i;
            }
            return result;
        }
        
        var fact = new Array();
        for (var i=0; i<len; i++) {
            fact[i] = Math.sqrt((2*ll[i]+1)/(4*Math.PI) * factorial(ll[i]-Math.abs(mm[i])) / factorial(ll[i]+Math.abs(mm[i])));
        }
        
        // Determine sampling curve
        var max = absMax(R);
        var beta = Z/(Math.sqrt((-0.5*Z*Z)/E));
        var A = Math.abs(R[0])/Math.exp(-beta*r[0]);
        for (var i=1; i<R.length; i++) {
            if (Math.abs(R[i]) > 0.001*max) {
                var Ai = Math.abs(R[i])/Math.exp(-beta*r[i]);
                if (Ai > A) {
                    A = Ai;
                }
            }
        }
        
        // Determine sampling sphere for Y
        fmax = Math.sqrt((2*l+1)/(4*Math.PI) * factorial(l-Math.abs(0)) / factorial(l+Math.abs(0)));
        Pmax = lgndr(l, 0, Math.cos(0));
        Ymax = new Complex(fmax*Pmax*Math.cos(0), fmax*Pmax*Math.sin(0));
        YmaxAbs = Math.sqrt(Ymax.multiply(Ymax.conjugate()).re);
        
        // Points vertices, colors
        pointVertices.length = 0;
        pointNormals.length  = 0;
        pointColors.length   = 0;
        
        while (pointVertices.length/3 < 40000) {
            var x  = 2*A*(Math.random()-0.5);
            var y  = 2*A*(Math.random()-0.5);
            var z  = 2*A*(Math.random()-0.5);
            var xi = Math.sqrt(x*x+y*y+z*z);
            
            if (xi <= A) {
                // Map to exp distribution
                var ri  = -Math.log((A-xi)/A)/beta;
                var idx = Math.round(rToIndex(ri));
                
                if (idx < R.length) {
                    // Sample R
                    var Ri = R[idx];
                    
                    var eta = Math.random();
                    if (eta < Math.abs(Ri)/(A*Math.exp(-beta*ri))) {
                        var theta = Math.acos(z/Math.sqrt(x*x+y*y+z*z));
                        var phi;
                        if (y >= 0) {
                            phi = Math.acos(x/Math.sqrt(x*x+y*y));
                        } else {
                            phi = 2*Math.PI - Math.acos(x/Math.sqrt(x*x+y*y));
                        }
                        
                        // Sample Y
                        var Plm = new Array();
                        for (var i=0; i<len; i++) {
                            Plm[i] = lgndr(ll[i], Math.abs(mm[i]), Math.cos(theta));
                            if (mm[i] < 0) {
                                Plm[i] = Math.pow(-1, -mm[i]) * Plm[i];
                            }
                        }
                        
                        var Ysum = new Complex(0, 0);
                        for (var i=0; i<len; i++) {
                            Ysum = Ysum.add(cc[i].multiply((new Complex(fact[i]*Plm[i]*Math.cos(mm[i]*phi), fact[i]*Plm[i]*Math.sin(mm[i]*phi)))));
                        }
                        
                        var YsumAbs = Math.sqrt(Ysum.multiply(Ysum.conjugate()).re);
                        
                        var zeta = YmaxAbs * Math.random();
                        if (zeta < YsumAbs) {
                            x *= ri/xi;
                            y *= ri/xi;
                            z *= ri/xi;
                            
                            // Push vertex
                            pointVertices.push(x);
                            pointVertices.push(y);
                            pointVertices.push(z);
                            
                            // Push color
                            if (Ri < 0) {
                                Ysum = Ysum.multiply(new Complex(-1, 0));
                            }
                            var phase = Ysum.phase();
                            
                            if (phase>=0 && phase<Math.PI/3) {
                                var rat = phase/(Math.PI/3);
                                pointColors.push(1);
                                pointColors.push(rat);
                                pointColors.push(0);
                            } else if (phase>=Math.PI/3 && phase<Math.PI*2/3) {
                                var rat = (phase-Math.PI/3)/(Math.PI/3);
                                pointColors.push(1-rat);
                                pointColors.push(1);
                                pointColors.push(0);
                            } else if (phase>=Math.PI*2/3 && phase<Math.PI) {
                                var rat = (phase-Math.PI*2/3)/(Math.PI/3);
                                pointColors.push(0);
                                pointColors.push(1);
                                pointColors.push(rat);
                            } else if (phase>=Math.PI && phase<Math.PI*4/3) {
                                var rat = (phase-Math.PI)/(Math.PI/3);
                                pointColors.push(0);
                                pointColors.push(1-rat);
                                pointColors.push(1);
                            } else if (phase>=Math.PI*4/3 && phase<Math.PI*5/3) {
                                var rat = (phase-Math.PI*4/3)/(Math.PI/3);
                                pointColors.push(rat);
                                pointColors.push(0);
                                pointColors.push(1);
                            } else {
                                var rat = (phase-Math.PI*5/3)/(Math.PI/3);
                                pointColors.push(1);
                                pointColors.push(0);
                                pointColors.push(1-rat);
                            }
                            pointColors.push(1);
                            
                            // Compute normals
                            var dTheta   = 1e-4;
                            var dPhi     = 1e-4;
                            var sinTheta = Math.sin(theta);
                            var cosTheta = Math.cos(theta);
                            var sinPhi   = Math.sin(phi);
                            var cosPhi   = Math.cos(phi);
                            
                            var PlmpTheta = [];
                            var PlmmTheta = [];
                            for (var i=0; i<len; i++) {
                                PlmpTheta[i] = lgndr(ll[i], Math.abs(mm[i]), Math.cos(theta+dTheta));
                                PlmmTheta[i] = lgndr(ll[i], Math.abs(mm[i]), Math.cos(theta-dTheta));
                                if (mm[i] < 0) {
                                    PlmpTheta[i] = Math.pow(-1, -mm[i]) * PlmpTheta[i];
                                    PlmmTheta[i] = Math.pow(-1, -mm[i]) * PlmmTheta[i];
                                }
                            }
                            var Ysumup    = new Complex(0, 0);
                            var Ysumdown  = new Complex(0, 0);
                            var Ysumleft  = new Complex(0, 0);
                            var Ysumright = new Complex(0, 0);
                            for (var i=0; i<len; i++) {
                                Ysumup    = Ysumup.add(cc[i].multiply((new Complex(fact[i]*PlmmTheta[i]*Math.cos(mm[i]*phi), fact[i]*PlmmTheta[i]*Math.sin(mm[i]*phi)))));
                                Ysumdown  = Ysumdown.add(cc[i].multiply((new Complex(fact[i]*PlmpTheta[i]*Math.cos(mm[i]*phi), fact[i]*PlmpTheta[i]*Math.sin(mm[i]*phi)))));
                                Ysumleft  = Ysumleft.add(cc[i].multiply((new Complex(fact[i]*Plm[i]*Math.cos(mm[i]*phi-dPhi), fact[i]*Plm[i]*Math.sin(mm[i]*phi-dPhi)))));
                                Ysumright = Ysumright.add(cc[i].multiply((new Complex(fact[i]*Plm[i]*Math.cos(mm[i]*phi+dPhi), fact[i]*Plm[i]*Math.sin(mm[i]*phi+dPhi)))));
                            }
                            
                            var Yme    = YsumAbs;
                            var Yup    = Math.sqrt(Ysumup.multiply(Ysumup.conjugate()).re);
                            var Ydown  = Math.sqrt(Ysumdown.multiply(Ysumdown.conjugate()).re);
                            var Yleft  = Math.sqrt(Ysumleft.multiply(Ysumleft.conjugate()).re);
                            var Yright = Math.sqrt(Ysumright.multiply(Ysumright.conjugate()).re);
                            
                            var rCmpnt     = -1/Yme;
                            var thetaCmpnt = 1/(Yme*Yme) * (Ydown-Yup)/(2*dTheta);
                            var phiCmpnt   = 1/(Yme*Yme*sinTheta) * (Yright-Yleft)/(2*dPhi);
                            
                            var xCmpnt = rCmpnt*sinTheta*cosPhi + thetaCmpnt*cosTheta*cosPhi - phiCmpnt*sinPhi;
                            var yCmpnt = rCmpnt*sinTheta*sinPhi + thetaCmpnt*cosTheta*sinPhi + phiCmpnt*cosPhi;
                            var zCmpnt = rCmpnt*cosTheta - thetaCmpnt*sinTheta;
                            
                            if(Math.abs(Yme) < 1e-8) {
                                // avoid division by zero
                                pointNormals.push(0);
                                pointNormals.push(0);
                                pointNormals.push(1);
                            } else {
                                pointNormals.push(-xCmpnt);
                                pointNormals.push(-yCmpnt);
                                pointNormals.push(-zCmpnt);
                            }
                        }
                    }
                }
            }
        }
        
        densRange.max = pointVertices.length/3;
        densRange.value = densRange.max/2;
        densRange.disabled = "";
        
        // Setup points
        glPainter.clearObjectList();
        glPainter.setupObject(pointVertices.slice(0, densRange.value*3), pointNormals.slice(0, densRange.value*3), pointColors.slice(0, densRange.value*4), null, 2, true);
        
        // Draw
        glPainter.refresh();
        
        function rToIndex(ri) {
            return (Math.log(Z*ri)-Math.log(Z*rMin))/dx;
        }
        
        function absMax(arr) {
            var max = Math.abs(arr[0]);
            for (var i=1; i<arr.length; i++) {
                if (Math.abs(arr[i]) > max) {
                    max = Math.abs(arr[i]);
                }
            }
            return max;
        }
        
        // Legendre polynomial Plm(x)
        function lgndr(l, m, x) {
            if (m<0 || m>l || Math.abs(x)>1.0) {
                alert("Invalid arguments for Plm.");
            }
            
            // Compute Pmm
            var Pmm = 1.0;
            if (m > 0) {
                var somx2 = Math.sqrt((1.0+x)*(1.0-x));
                var fact  = 1.0;
                for (var i=1; i<=m; i++) {
                    Pmm  = Pmm * (-fact*somx2);
                    fact = fact + 2.0;
                }
            }
            
            if (l == m) {
                return Pmm;
            } else {
                // Compute Pmp1m
                var Pmp1m = x*(2*m+1)*Pmm;
                if (l == m+1) {
                    return Pmp1m;
                } else {
                    // Compute Plm, l > m + 1
                    var Plm = 0;
                    for (var ll=m+2; ll<=l; ll++) {
                        Plm = (x*(2*ll-1)*Pmp1m - (ll+m-1)*Pmm) / (ll-m);
                        Pmm = Pmp1m;
                        Pmp1m = Plm;
                    }
                    return Plm;
                }
            }
        }
    }
    
    function densChangeHandler() {
        // Setup points
        glPainter.clearObjectList();
        glPainter.setupObject(pointVertices.slice(0, densRange.value*3), pointNormals.slice(0, densRange.value*3), pointColors.slice(0, densRange.value*4), null, 2, true);
        
        // Draw
        glPainter.refresh();
    }
    
    // Change point size
    function keyDownHandler(evt) {
        if (evt.keyCode == 76) {
            // Toggle light
            if (glPainter.lightOn) {
                glPainter.setPointSize(2.5);
            } else {
                glPainter.setPointSize(1.5);
            }
            glPainter.refresh();
        }
    }
    
    // Window resize
    function resize() {
        // Adjust width and height
        glCanvas.width  = document.getElementById("content").clientWidth*cWidth;
        glCanvas.height = document.getElementById("content").clientWidth*cHeight;
        
        glPainter.refresh();
    }
};
