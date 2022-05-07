/*
 * @file Spectrum class for plotting multiplet energies on HTML canvas element
 * @author Qian Zhang
 */

function Spectrum(canvas) {
    // Attributes
    this.canvas       = canvas;
    this.cntx         = this.canvas.getContext("2d");
    this.canvasWidth  = 300;
    this.canvasHeight = 150;
    this.marginLeft   = 5;
    this.marginRight  = 5;
    this.marginTop    = 5;
    this.marginBottom = 20;
    this.plotWidth    = this.canvasWidth-this.marginLeft-this.marginRight;
    this.plotHeight   = this.canvasHeight-this.marginTop-this.marginBottom;
    this.EMin         = -5;
    this.EMax         =  5;
    this.initRange    = [this.EMin, this.EMax];
    this.EScale       = this.plotHeight/(this.EMax-this.EMin);
    this.EOrigin      = this.marginTop+this.plotHeight+this.EMin*this.EScale;
    this.barLength    = 50;
    this.barWidth     = 3;
    this.cfgLabel     = "";
    this.label        = ["Config", "Coulomb", "SO", "Hu+Hso", "Coulomb", "SO", "Config"];
    this.title        = "";
    this.tagSize      = 16;
    this.labelSize    = 16;
    this.titleSize    = 18;
    this.labelFlag    = 0;
    this.colFlag      = -1;
    this.ichoose      = 0;
    this.jchoose      = 0;
    this.control      = true;
    this.refreshFlag  = false;
    
    // Data lists
    this.Eavg       = 0;
    this.EuList     = [];
    this.LuList     = [];
    this.KuList     = [];
    this.EusoList   = [];
    this.LusoList   = [];
    this.KusoList   = [];
    this.CusoList   = [];
    this.EintList   = [];
    this.LintList   = [];
    this.CintList   = [];
    this.EintjjList = [];
    this.LintjjList = [];
    this.CintjjList = [];
    this.EsouList   = [];
    this.LsouList   = [];
    this.KsouList   = [];
    this.CsouList   = [];
    this.EsoList    = [];
    this.LsoList    = [];
    this.KsoList    = [];
    
    // Make the canvas focusable
    this.canvas.setAttribute("tabindex", "0");
    
    // Set control message
    this.setControl(this.control);
    
    // Initial plot
    this.refresh();
    
    // Add event listeners
    // Click to focus the canvas
    function addClickHandler(canvas, painter) {
        canvas.addEventListener("click", function(evt) {
            canvas.focus();
        }, false);
    }
    addClickHandler(this.canvas, this);
    
    // WS to zoom the plot and L to toggle labels
    function addKeyDownHandler(canvas, painter) {
        canvas.addEventListener("keydown", function(evt) {
            if(painter.control) {
                var zoom = 0;
                if (evt.keyCode == 87) {
                    zoom = -1;
                } else if (evt.keyCode == 83) {
                    zoom = 1;
                }
                // Zoom
                if (evt.keyCode==87||evt.keyCode==83) {
                    var zoomOrigin = 0.5*(painter.EMin+painter.EMax);
                    painter.refreshFlag = true;
                    painter.setERange(painter.EMin+(painter.EMin-zoomOrigin)*0.05*zoom,
                                      painter.EMax+(painter.EMax-zoomOrigin)*0.05*zoom);
                    painter.refreshFlag = false;
                    painter.refresh();
                }
            }
        }, false);
        canvas.addEventListener("keydown", function(evt) {
            if(painter.control) {
                if (evt.keyCode == 76) {
                    painter.labelFlag = (painter.labelFlag+1)%3;
                    painter.refresh();
                }
            }
        }, false);
    }
    addKeyDownHandler(this.canvas, this);
    
    // Select-zoom or pan the plot or choose multiplet
    function addZoomPanHandler(canvas, painter) {
        var rect = null;
        var initX = 0, initY = 0;
        var finalX = 0, finalY = 0;
        var oldX = 0, oldY = 0;
        var newX = 0, newY = 0;
        var zIsDown = false;
        var isZooming = false;
        var shiftIsDown = false;
        var mouseIsDown = false;
        var column = -1, ichoose = 0; jchoose = 0;
        canvas.addEventListener("keydown", function(evt) {
            if (painter.control) {
                if (evt.keyCode==16) {
                    shiftIsDown = true;
                } else if (evt.keyCode==90) {
                    zIsDown = true;
                }
            }
        }, false);
        canvas.addEventListener("keyup", function(evt) {
            if (painter.control) {
                if (evt.keyCode==16) {
                    shiftIsDown = false;
                } else if (evt.keyCode==90) {
                    zIsDown = false;
                }
            }
        }, false);
        canvas.addEventListener("mousedown", function(evt) {
            evt.preventDefault();
            if (painter.control) {
                mouseIsDown = true;
                oldX = evt.clientX;
                oldY = evt.clientY;
                rect = painter.canvas.getBoundingClientRect();
                initX = Math.round(oldX-rect.left);
                initY = Math.round(oldY-rect.top);
                
                // Choose multiplet
                if (!shiftIsDown && !zIsDown && column!=-1) {
                    painter.colFlag = column;
                    painter.ichoose = ichoose;
                    painter.jchoose = jchoose;
                    painter.refresh();
                }
            }
        }, false);
        canvas.addEventListener("mouseup", function(evt) {
            if (painter.control) {
                mouseIsDown = false;
                if (isZooming) {
                    var EMin = Math.min((-initY+painter.EOrigin)/painter.EScale, (-finalY+painter.EOrigin)/painter.EScale);
                    var EMax = Math.max((-initY+painter.EOrigin)/painter.EScale, (-finalY+painter.EOrigin)/painter.EScale);
                    painter.refreshFlag = true;
                    painter.setERange(EMin, EMax);
                    painter.refreshFlag = false;
                    painter.refresh();
                    isZooming = false;
                }
            }
        }, false);
        canvas.addEventListener("mouseout", function(evt) {
            if (painter.control) {
                mouseIsDown = false;
                if (isZooming) {
                    painter.refresh();
                    isZooming = false;
                }
            }
        }, false);
        canvas.addEventListener("mousemove", function(evt) {
            if (painter.control) {
                newX = evt.clientX;
                newY = evt.clientY;
                rect = painter.canvas.getBoundingClientRect();
                finalX = Math.round(newX-rect.left);
                finalY = Math.round(newY-rect.top);
                if (mouseIsDown) {
                    var dX = newX - oldX;
                    var dY = newY - oldY;
                    if (shiftIsDown) {
                        // Pan
                        painter.setEOrigin(painter.EOrigin+dY);
                        painter.refresh();
                    } else if (zIsDown) {
                        // Select-zoom
                        isZooming = true;
                        if (dX!=0 || dY!=0) {
                            painter.refresh();
                            painter.cntx.strokeStyle = "rgb(255, 0, 255)";
                            painter.cntx.beginPath();
                            painter.cntx.rect(initX,initY,finalX-initX,finalY-initY);
                            painter.cntx.stroke();
                        }
                    }
                    oldX = newX;
                    oldY = newY;
                }
                // Choose multiplet
                if (!mouseIsDown && !shiftIsDown && !zIsDown) {
                    column = -1;
                    var thisE = (painter.EOrigin-finalY)/painter.EScale;
                    var dE = 5/painter.EScale;
                    if (finalX>=painter.marginLeft+painter.plotWidth*3/14-0.5*painter.barLength &&
                        finalX<=painter.marginLeft+painter.plotWidth*3/14+0.5*painter.barLength) {
                        // Hu column
                        for (var i=0; i<painter.EuList.length; i++) {
                            var dEi = Math.abs(painter.EuList[i]-thisE);
                            if (dEi < dE) {
                                column = 1;
                                ichoose = i;
                                dE = dEi;
                            }
                        }
                    } else if (finalX>=painter.marginLeft+painter.plotWidth*5/14-0.5*painter.barLength &&
                               finalX<=painter.marginLeft+painter.plotWidth*5/14+0.5*painter.barLength) {
                        // Huso column
                        for (var i=0; i<painter.EusoList.length; i++) {
                            var EList = painter.EusoList[i];
                            for (var j=0; j<EList.length; j++) {
                                var dEi = Math.abs(EList[j]-thisE);
                                if (dEi < dE) {
                                    column = 2;
                                    ichoose = i;
                                    jchoose = j;
                                    dE = dEi;
                                }
                            }
                        }
                    } else if (finalX>=painter.marginLeft+painter.plotWidth*9/14-0.5*painter.barLength &&
                               finalX<=painter.marginLeft+painter.plotWidth*9/14+0.5*painter.barLength) {
                        // Hsou column
                        for (var i=0; i<painter.EsouList.length; i++) {
                            var EList = painter.EsouList[i];
                            for (var j=0; j<EList.length; j++) {
                                var dEi = Math.abs(EList[j]-thisE);
                                if (dEi < dE) {
                                    column = 3;
                                    ichoose = i;
                                    jchoose = j;
                                    dE = dEi;
                                }
                            }
                        }
                    } else if (finalX>=painter.marginLeft+painter.plotWidth*11/14-0.5*painter.barLength &&
                               finalX<=painter.marginLeft+painter.plotWidth*11/14+0.5*painter.barLength) {
                        // Hso column
                        for (var i=0; i<painter.EsoList.length; i++) {
                            var dEi = Math.abs(painter.EsoList[i]-thisE);
                            if (dEi < dE) {
                                column = 4;
                                ichoose = i;
                                dE = dEi;
                            }
                        }
                    } else if ((finalX>=painter.marginLeft+painter.plotWidth*1/14-0.5*painter.barLength &&
                                finalX<=painter.marginLeft+painter.plotWidth*1/14+0.5*painter.barLength) &&
                               Math.abs(painter.Eavg-thisE)<dE) {
                        column = 0;
                    } else if ((finalX>=painter.marginLeft+painter.plotWidth*13/14-0.5*painter.barLength &&
                                finalX<=painter.marginLeft+painter.plotWidth*13/14+0.5*painter.barLength) &&
                               Math.abs(painter.Eavg-thisE)<dE) {
                        column = 5;
                    }
                    if (column!=-1) {
                        document.body.style.cursor = "pointer";
                    } else {
                        document.body.style.cursor = "auto";
                    }
                }
            }
        }, false);
    }
    addZoomPanHandler(this.canvas, this);
    
    // Double-click to restore plot
    function addDoubleClickHandler(canvas, painter) {
        canvas.addEventListener("dblclick", function(evt) {
            evt.preventDefault();
            if(painter.control) {
                painter.refreshFlag = true;
                painter.colFlag = -1;
                painter.ichoose = 0;
                painter.jchoose = 0;
                painter.setERange(painter.initRange[0], painter.initRange[1]);
                painter.refreshFlag = false;
                painter.refresh();
            }
        }, false);
    }
    addDoubleClickHandler(this.canvas, this);
}

Spectrum.prototype.setMargin = function(marginLeft, marginRight, marginTop, marginBottom) {
    this.marginLeft   = marginLeft;
    this.marginRight  = marginRight;
    this.marginTop    = marginTop;
    this.marginBottom = marginBottom;
    this.plotWidth    = this.canvasWidth-this.marginLeft-this.marginRight;
    this.plotHeight   = this.canvasHeight-this.marginTop-this.marginBottom;
};

Spectrum.prototype.setERange = function(EMin, EMax) {
    this.EMin = EMin;
    this.EMax = EMax;
    this.EScale = this.plotHeight/(EMax-EMin);
    this.EOrigin = this.marginTop+this.plotHeight+EMin*this.EScale;
    if (!this.refreshFlag) {
        this.initRange[0] = this.EMin;
        this.initRange[1] = this.EMax;
    }
};

Spectrum.prototype.setEScale = function(EScale) {
    this.EScale = EScale;
    this.EMin = (this.EOrigin-this.marginTop-this.plotHeight)/this.EScale;
    this.EMax = (this.EOrigin-this.marginTop)/this.EScale;
};

Spectrum.prototype.setEOrigin = function(EOrigin) {
    this.EOrigin = EOrigin;
    this.EMin = (this.EOrigin-this.marginTop-this.plotHeight)/this.EScale;
    this.EMax = (this.EOrigin-this.marginTop)/this.EScale;
};

Spectrum.prototype.setBarLength = function(barLength) {
    this.barLength = barLength;
};

Spectrum.prototype.setBarWidth = function(barWidth) {
    this.barWidth = barWidth;
};

Spectrum.prototype.setCfgLabel = function(cfgLabel) {
    this.cfgLabel = cfgLabel;
};

Spectrum.prototype.setLabel = function(label) {
    this.label = label;
};

Spectrum.prototype.setTitle = function(title) {
    this.title = title;
};

Spectrum.prototype.setTagSize = function(tagSize) {
    this.tagSize = tagSize;
};

Spectrum.prototype.setLabelSize = function(labelSize) {
    this.labelSize = labelSize;
};

Spectrum.prototype.setTitleSize = function(titleSize) {
    this.titleSize = titleSize;
};

Spectrum.prototype.setControl = function(control) {
    this.control = control;
    if (control) {
        this.canvas.title = "1. Click to focus on the plot\n" +
                            "2. Press \"L\" to toggle labels\n" +
                            "3. Press \"WS\" to zoom the plot\n" +
                            "4. Press \"Z\" and drag to zoom a region\n" +
                            "5. Press \"Shift\" and drag to pan the plot\n" +
                            "6. Double click to restore the plot";
    } else {
        this.canvas.title = "";
    }
};

Spectrum.prototype.plot = function(Eavg, EuList, LuList, KuList, EusoList, LusoList, KusoList, CusoList, EintList, LintList, CintList, EintjjList, LintjjList, CintjjList, EsouList, LsouList, KsouList, CsouList, EsoList, LsoList, KsoList) {
    var cntx = this.cntx;
    var canvasWidth  = this.canvasWidth;
    var canvasHeight = this.canvasHeight;
    var marginLeft = this.marginLeft;
    var marginTop  = this.marginTop;
    var plotWidth  = this.plotWidth;
    var plotHeight = this.plotHeight;
    
    if (!this.refreshFlag) {
        var Emax = EintList[0];
        var Emin = EintList[0];
        var Eumax = EuList[0];
        var Eumin = EuList[0];
        for (var i=1; i<EintList.length; i++) {
            if (Emax<EintList[i]) {
                Emax = EintList[i];
            }
            if (Emin>EintList[i]) {
                Emin = EintList[i];
            }
            if (Eumax<EuList[i]) {
                Eumax = EuList[i];
            }
            if (Eumin>EuList[i]) {
                Eumin = EuList[i];
            }
        }
        var dE = Emax-Emin==0 ? 1 : Emax-Emin;
        this.setERange(Emin-0.1*dE, Emax+0.1*dE);
        
        this.Eavg     = Eavg;
        this.EuList   = EuList;
        this.LuList   = LuList;
        this.KuList   = KuList;
        this.EusoList = EusoList;
        this.LusoList = LusoList;
        this.KusoList = KusoList;
        this.CusoList = CusoList;
        this.EintList = EintList;
        this.LintList = LintList;
        this.CintList = CintList;
        this.EintjjList = EintjjList;
        this.LintjjList = LintjjList;
        this.CintjjList = CintjjList;
        this.EsouList = EsouList;
        this.LsouList = LsouList;
        this.KsouList = KsouList;
        this.CsouList = CsouList;
        this.EsoList  = EsoList;
        this.LsoList  = LsoList;
        this.KsoList  = KsoList;
    }
    
    // Clear canvas
    cntx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.drawAxis();
    
    // Save current clipping region
    cntx.save();
    
    // Clip plotting region
    cntx.beginPath();
    cntx.rect(marginLeft, marginTop, plotWidth, plotHeight);
    cntx.clip();
    
    cntx.lineWidth = this.barWidth;
    
    // Central line
    var Eavgpx = this.EOrigin-Eavg*this.EScale;
    var cfgLeft = marginLeft+plotWidth/14-0.5*this.barLength;
    var cfgRight = marginLeft+plotWidth/14+0.5*this.barLength;
    var cfgLeft2 = marginLeft+plotWidth*13/14-0.5*this.barLength;
    var cfgRight2 = marginLeft+plotWidth*13/14+0.5*this.barLength;
    if (EuList.length != 0) {
        /*
        var myGradient = cntx.createLinearGradient(cfgLeft, 0, cfgRight, 0);
        myGradient.addColorStop(0,"rgb(255,0,0)");
        myGradient.addColorStop(1/4,"rgb(255,255,0)");
        myGradient.addColorStop(2/4,"rgb(0,255,0)");
        myGradient.addColorStop(3/4,"rgb(0,255,255)");
        myGradient.addColorStop(1,"rgb(0,0,255)");
        cntx.fillStyle=myGradient;
        cntx.fillRect(cfgLeft, Eavgpx-this.barWidth*0.5, this.barLength, this.barWidth);
        
        var myGradient = cntx.createLinearGradient(cfgLeft2, 0, cfgRight2, 0);
        myGradient.addColorStop(0,"rgb(255,0,0)");
        myGradient.addColorStop(1/4,"rgb(255,255,0)");
        myGradient.addColorStop(2/4,"rgb(0,255,0)");
        myGradient.addColorStop(3/4,"rgb(0,255,255)");
        myGradient.addColorStop(1,"rgb(0,0,255)");
        cntx.fillStyle=myGradient;
        cntx.fillRect(cfgLeft2, Eavgpx-this.barWidth*0.5, this.barLength, this.barWidth);
        */
        
        cntx.strokeStyle = "rgb(0,0,0)";
        cntx.beginPath();
        cntx.moveTo(cfgLeft, Eavgpx);
        cntx.lineTo(cfgRight, Eavgpx);
        cntx.stroke();
        
        cntx.beginPath();
        cntx.moveTo(cfgLeft2, Eavgpx);
        cntx.lineTo(cfgRight2, Eavgpx);
        cntx.stroke();
        
        // Central label
        cntx.font = this.tagSize+"px Times New Roman";
        cntx.textAlign = "center";
        cntx.fillStyle = "rgb(0,0,0)";
        if (this.labelFlag == 0) {
            cntx.fillText(this.cfgLabel, marginLeft+plotWidth/14, Eavgpx-5);
            cntx.fillText(this.cfgLabel, marginLeft+plotWidth*13/14, Eavgpx-5);
        } else if (this.labelFlag == 1) {
            cntx.fillText(Eavg.toFixed(6), marginLeft+plotWidth/14, Eavgpx-5);
            cntx.fillText(Eavg.toFixed(6), marginLeft+plotWidth*13/14, Eavgpx-5);
        }
    }
    
    // Draw energy
    var uLeft  = marginLeft+plotWidth*3/14-0.5*this.barLength;
    var uRight = marginLeft+plotWidth*3/14+0.5*this.barLength;
    for (var i=0; i<EuList.length; i++) {
        var E = EuList[i];
        var Epx = this.EOrigin-E*this.EScale;
        cntx.strokeStyle = "rgb(0,0,0)";
        cntx.beginPath();
        cntx.moveTo(uLeft, Epx);
        cntx.lineTo(uRight, Epx);
        cntx.stroke();
        
        // Energy label
        cntx.fillStyle = "rgb(0,0,0)";
        if (this.labelFlag == 0) {
            cntx.fillText(LuList[i], marginLeft+plotWidth*3/14, Epx-5);
        } else if (this.labelFlag == 1) {
            cntx.fillText(E.toFixed(6), marginLeft+plotWidth*3/14, Epx-5);
        }
    }
    var soLeft  = marginLeft+plotWidth*11/14-0.5*this.barLength;
    var soRight = marginLeft+plotWidth*11/14+0.5*this.barLength;
    for (var i=0; i<EsoList.length; i++) {
        var E = EsoList[i];
        var Epx = this.EOrigin-E*this.EScale;
        cntx.strokeStyle = "rgb(0,0,0)";
        cntx.beginPath();
        cntx.moveTo(soLeft, Epx);
        cntx.lineTo(soRight, Epx);
        cntx.stroke();
        
        // Energy label
        cntx.fillStyle = "rgb(0,0,0)";
        if (this.labelFlag == 0) {
            cntx.fillText(LsoList[i].L1, marginLeft+plotWidth*11/14, Epx-20);
            cntx.fillText(LsoList[i].L2, marginLeft+plotWidth*11/14, Epx-13);
            cntx.fillText(LsoList[i].L3, marginLeft+plotWidth*11/14, Epx-3);
        } else if (this.labelFlag == 1) {
            cntx.fillText(E.toFixed(6), marginLeft+plotWidth*11/14, Epx-5);
        }
    }
    
    var usoLeft  = marginLeft+plotWidth*5/14-0.5*this.barLength;
    var usoRight = marginLeft+plotWidth*5/14+0.5*this.barLength;
    for (var i=0; i<EusoList.length; i++) {
        var EList = EusoList[i];
        for (var j=0; j<EList.length; j++) {
            var E = EList[j];
            var Epx = this.EOrigin-E*this.EScale;
            cntx.strokeStyle = CusoList[i][j];
            cntx.beginPath();
            cntx.moveTo(usoLeft, Epx);
            cntx.lineTo(usoRight, Epx);
            cntx.stroke();
            
            // Energy label
            cntx.fillStyle = CusoList[i][j];
            if (this.labelFlag == 0) {
                cntx.fillText(LusoList[i][j], marginLeft+plotWidth*5/14, Epx-5);
            } else if (this.labelFlag == 1) {
                cntx.fillText(E.toFixed(6), marginLeft+plotWidth*5/14, Epx-5);
            }
        }
    }
    var souLeft  = marginLeft+plotWidth*9/14-0.5*this.barLength;
    var souRight = marginLeft+plotWidth*9/14+0.5*this.barLength;
    for (var i=0; i<EsouList.length; i++) {
        var EList = EsouList[i];
        for (var j=0; j<EList.length; j++) {
            var E = EList[j];
            var Epx = this.EOrigin-E*this.EScale;
            cntx.strokeStyle = CsouList[i][j];
            cntx.beginPath();
            cntx.moveTo(souLeft, Epx);
            cntx.lineTo(souRight, Epx);
            cntx.stroke();
            
            // Energy label
            cntx.fillStyle = CsouList[i][j];
            if (this.labelFlag == 0) {
                cntx.fillText(LsouList[i][j].L1, marginLeft+plotWidth*9/14, Epx-20);
                cntx.fillText(LsouList[i][j].L2, marginLeft+plotWidth*9/14, Epx-13);
                cntx.fillText(LsouList[i][j].L3, marginLeft+plotWidth*9/14, Epx-3);
            } else if (this.labelFlag == 1) {
                cntx.fillText(E.toFixed(6), marginLeft+plotWidth*9/14, Epx-5);
            }
        }
    }
    
    var colFlag = this.colFlag;
    var intLeft  = marginLeft+plotWidth*7/14-0.5*this.barLength;
    var intRight = marginLeft+plotWidth*7/14+0.5*this.barLength;
    var NDEList = [];
    var NDJList = [];
    for (var i=0; i<EintList.length; i++) {
        var E = colFlag<3 ? EintList[i] : EintjjList[i];
        var L = colFlag<3 ? LintList[i] : LintjjList[i];
        var C = colFlag<3 ? CintList[i] : CintjjList[i];
        
        // Ignore if is degenerate
        var isDgrt = false;
        for (var k=0; k<NDEList.length; k++) {
            if (Math.abs(E-NDEList[k])<1e-12 && L==NDJList[k]) {
                isDgrt = true;
                break;
            }
        }
        if (isDgrt) {
            continue;
        } else {
            NDEList.push(E);
            NDJList.push(L);
        }
        
        var Epx = this.EOrigin-E*this.EScale;
        if (this.colFlag==-1 || this.colFlag==0 || this.colFlag==5) {
            cntx.strokeStyle = C;
        } else if (this.colFlag==1) {
            cntx.strokeStyle = C.replace(")",","+KuList[this.ichoose][i].toFixed(2)+")").replace("rgb","rgba");
        } else if (this.colFlag==2) {
            cntx.strokeStyle = C.replace(")",","+KusoList[this.ichoose][this.jchoose][i].toFixed(2)+")").replace("rgb","rgba");
        } else if (this.colFlag==3) {
            cntx.strokeStyle = C.replace(")",","+KsouList[this.ichoose][this.jchoose][i].toFixed(2)+")").replace("rgb","rgba");
        } else if (this.colFlag==4) {
            cntx.strokeStyle = C.replace(")",","+KsoList[this.ichoose][i].toFixed(2)+")").replace("rgb","rgba");
        }
        cntx.beginPath();
        cntx.moveTo(intLeft, Epx);
        cntx.lineTo(intRight, Epx);
        cntx.stroke();
        
        // Energy label
        cntx.fillStyle = cntx.strokeStyle;
        if (this.labelFlag == 0) {
            cntx.fillText(L, marginLeft+plotWidth*7/14, Epx-5);
        } else if (this.labelFlag == 1) {
            cntx.fillText(E.toFixed(6), marginLeft+plotWidth*7/14, Epx-5);
        }
    }
    
    // Connections
    cntx.lineWidth = 1;
    cntx.strokeStyle = "rgb(200,200,200)";
    for (var i=0; i<EuList.length; i++) {
        var E = EuList[i];
        var Epx = this.EOrigin-E*this.EScale;
        cntx.beginPath();
        cntx.moveTo(cfgRight, Eavgpx);
        cntx.lineTo(uLeft, Epx);
        cntx.stroke();
    }
    for (var i=0; i<EsoList.length; i++) {
        var E = EsoList[i];
        var Epx = this.EOrigin-E*this.EScale;
        cntx.beginPath();
        cntx.moveTo(cfgLeft2, Eavgpx);
        cntx.lineTo(soRight, Epx);
        cntx.stroke();
    }
    for (var i=0; i<EuList.length; i++) {
        var uE = EuList[i];
        var uEpx = this.EOrigin-uE*this.EScale;
        for (var j=0; j<EusoList[i].length; j++) {
            var usoE = EusoList[i][j];
            var usoEpx = this.EOrigin-usoE*this.EScale;
            cntx.beginPath();
            cntx.moveTo(uRight, uEpx);
            cntx.lineTo(usoLeft, usoEpx);
            cntx.stroke();
        }
    }
    for (var i=0; i<EsoList.length; i++) {
        var soE = EsoList[i];
        var soEpx = this.EOrigin-soE*this.EScale;
        for (var j=0; j<EsouList[i].length; j++) {
            var souE = EsouList[i][j];
            var souEpx = this.EOrigin-souE*this.EScale;
            cntx.beginPath();
            cntx.moveTo(soLeft, soEpx);
            cntx.lineTo(souRight, souEpx);
            cntx.stroke();
        }
    }
    
    // Restore clipping region
    cntx.restore();
};

Spectrum.prototype.drawAxis = function() {
    var cntx         = this.cntx;
    var canvasHeight = this.canvasHeight;
    var marginLeft   = this.marginLeft;
    var plotWidth    = this.plotWidth;
    
    // Label and Title
    cntx.font = this.labelSize + "px Times New Roman";
    cntx.textAlign = "center";
    cntx.fillText(this.label[0], marginLeft+plotWidth*(1/14), canvasHeight-5);
    cntx.fillText(this.label[1], marginLeft+plotWidth*(3/14), canvasHeight-5);
    cntx.fillText(this.label[2], marginLeft+plotWidth*(5/14), canvasHeight-5);
    cntx.fillText(this.label[3], marginLeft+plotWidth*(7/14), canvasHeight-5);
    cntx.fillText(this.label[4], marginLeft+plotWidth*(9/14), canvasHeight-5);
    cntx.fillText(this.label[5], marginLeft+plotWidth*(11/14), canvasHeight-5);
    cntx.fillText(this.label[6], marginLeft+plotWidth*(13/14), canvasHeight-5);
    cntx.font = this.titleSize + "px Times New Roman";
    cntx.fillText(this.title, marginLeft+plotWidth*0.5, this.titleSize+1);
};

Spectrum.prototype.refresh = function() {
    this.refreshFlag = true;
    
    // Get width and height from the actual canvas
    var canvasWidth  = this.canvas.width;
    var canvasHeight = this.canvas.height;
    
    // Adjust settings of painter
    if (canvasWidth>2*this.marginLeft&&canvasHeight>2*this.marginTop) {
        this.canvasWidth  = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.setMargin(this.marginLeft, this.marginRight, this.marginTop, this.marginBottom);
        this.setERange(this.EMin, this.EMax);
    }
    
    // Re-plot all registered data
    this.plot(this.Eavg, this.EuList, this.LuList, this.KuList, this.EusoList, this.LusoList, this.KusoList, this.CusoList, this.EintList, this.LintList, this.CintList, this.EintjjList, this.LintjjList, this.CintjjList, this.EsouList, this.LsouList, this.KsouList, this.CsouList, this.EsoList, this.LsoList, this.KsoList);
    
    this.refreshFlag = false;
};
