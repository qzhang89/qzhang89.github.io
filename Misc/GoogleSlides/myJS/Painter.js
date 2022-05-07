/**
 * @file Painter class for plotting 2D graphs on HTML canvas element
 * @author Qian Zhang
 */

/**
 * Creates an instance of Painter
 * 
 * @class Painter class for plotting 2D graphs on HTML canvas element
 * @param    {DOMElement} canvas      - HTML canvas element
 * @property {DOMElement} this.canvas - HTML canvas element
 * @property {CanvasRenderingContext2D} this.cntx - canvas 2d context
 * @property {Number}       this.canvasWidth   - canvas width (unit px) (default 300)
 * @property {Number}       this.canvasHeight  - canvas height (unit px) (default 150)
 * @property {Number}       this.marginWidth   - margin width (unit px) (default 45)
 * @property {Number}       this.marginHeight  - margin height (unit px) (default 30)
 * @property {Number}       this.plotWidth     - plotWidth = canvasWidth-2*marginWidth
 * @property {Number}       this.plotHeight    - plotHeight = canvasHeight-2*marginHeight
 * @property {Number}       this.xMin          - minimum of x range
 * @property {Number}       this.xMax          - maximum of x range
 * @property {Number}       this.yMin          - minimum of y range
 * @property {Number}       this.yMax          - maximum of y range
 * @property {Array.Number} this.initRange     - initial range for restoring zoomed or panned plot
 * @property {Number}       this.xScale        - number of pixels of one unit in x
 * @property {Number}       this.yScale        - number of pixels of one unit in y
 * @property {Number}       this.xOrigin       - x origin position (unit px)
 * @property {Number}       this.yOrigin       - y origin position (unit px)
 * @property {String}       this.xLabel        - x label (default "")
 * @property {String}       this.yLabel        - y label (default "")
 * @property {String}       this.title         - plot title (default "")
 * @property {Number}       this.tickSize      - size of ticks (unit px) (default 10)
 * @property {Number}       this.tickLabelSize - size of tick labels (unit px) (default 15)
 * @property {Number}       this.labelSize     - size of x y labels (unit px) (default 18)
 * @property {Number}       this.titleSize     - size of title (unit px) (default 18)
 * @property {Boolean}      this.holdOn        - hold on property (true or false) (default false)
 * @property {Boolean}      this.control       - control property (true or false) (default true)
 * @property {Boolean}      this.refreshFlag   - used by refresh() method
 * @property {Array.Object} this.xycolorList   - [{x1,y1,color1}, {x2,y2,color2}, ...]
 * @property {Array.Object} this.xyphaseList   - [{x1,y1,phase1,offset1}, {x2,y2,phase2,offset2}, ...]
 * @property {Array.Object} this.EList         - [{E1,text1,color1}, {E2,text2,color2}, ...]
 * @example
 * var myCanvas = document.getElementsByTagName("canvas")[0]; // Get a canvas element from HTML
 * var myPainter = new Painter(myCanvas);                     // Create a Painter object
 */
function Painter(canvas) {
    // Attributes
    this.canvas        = canvas;
    this.cntx          = this.canvas.getContext("2d");
    this.canvasWidth   = 300;
    this.canvasHeight  = 150;
    this.marginWidth   = 45;
    this.marginHeight  = 30;
    this.plotWidth     = this.canvasWidth-2*this.marginWidth;
    this.plotHeight    = this.canvasHeight-2*this.marginHeight;
    this.xMin          = -5;
    this.xMax          =  5;
    this.yMin          = -5;
    this.yMax          =  5;
    this.initRange     = [this.xMin, this.xMax, this.yMin, this.yMax];
    this.xScale        = this.plotWidth/(this.xMax-this.xMin);
    this.yScale        = this.plotHeight/(this.yMax-this.yMin);
    this.xOrigin       = this.marginWidth-this.xMin*this.xScale;
    this.yOrigin       = this.marginHeight+this.plotHeight+this.yMin*this.yScale;
    this.xLabel        = "";
    this.yLabel        = "";
    this.title         = "";
    this.tickSize      = 10;
    this.tickLabelSize = 15;
    this.labelSize     = 18;
    this.titleSize     = 18;
    this.holdOn        = false;
    this.control       = true;
    this.refreshFlag   = false;
    
    // Data lists
    this.xycolorList = [];
    this.xyphaseList = [];
    this.EList = [];
    
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
    
    // WSAD to zoom the plot
    function addKeyDownHandler(canvas, painter) {
        canvas.addEventListener("keydown", function(evt) {
            if(painter.control) {
                var zoomX = 0, zoomY = 0;
                if (evt.keyCode == 87) {
                    zoomY = 1;
                } else if (evt.keyCode == 83) {
                    zoomY = -1;
                } else if (evt.keyCode == 65) {
                    zoomX = -1;
                } else if (evt.keyCode == 68) {
                    zoomX = 1;
                }
                // Zoom
                if (evt.keyCode==87||evt.keyCode==83||evt.keyCode==65||evt.keyCode==68) {
                    painter.setScale(painter.xScale*(1+0.05*zoomX), painter.yScale*(1+0.05*zoomY));
                    painter.refresh();
                }
            }
        }, false);
    }
    addKeyDownHandler(this.canvas, this);
    
    // Select-zoom or pan the plot
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
            }
        }, false);
        canvas.addEventListener("mouseup", function(evt) {
            if (painter.control) {
                mouseIsDown = false;
                if (isZooming) {
                    var xMin = Math.min((initX-painter.xOrigin)/painter.xScale, (finalX-painter.xOrigin)/painter.xScale);
                    var xMax = Math.max((initX-painter.xOrigin)/painter.xScale, (finalX-painter.xOrigin)/painter.xScale);
                    var yMin = Math.min((-initY+painter.yOrigin)/painter.yScale, (-finalY+painter.yOrigin)/painter.yScale);
                    var yMax = Math.max((-initY+painter.yOrigin)/painter.yScale, (-finalY+painter.yOrigin)/painter.yScale);
                    painter.refreshFlag = true;
                    painter.setXRange(xMin, xMax);
                    painter.setYRange(yMin, yMax);
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
                if (mouseIsDown) {
                    newX = evt.clientX;
                    newY = evt.clientY;
                    var dX = newX - oldX;
                    var dY = newY - oldY;
                    if (shiftIsDown) {
                        // Pan
                        painter.setOrigin(painter.xOrigin+dX, painter.yOrigin+dY);
                        painter.refresh();
                    } else if (zIsDown) {
                        // Select-zoom
                        isZooming = true;
                        finalX = Math.round(newX-rect.left);
                        finalY = Math.round(newY-rect.top);
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
            }
        }, false);
    }
    addZoomPanHandler(this.canvas, this);
    
    // Double-click to restore plot
    function addDoubleClickHandler(canvas, painter) {
        canvas.addEventListener("dblclick", function(evt) {
            evt.preventDefault();
            if(painter.control) {
                painter.setXRange(painter.initRange[0], painter.initRange[1]);
                painter.setYRange(painter.initRange[2], painter.initRange[3]);
                painter.refresh();
            }
        }, false);
    }
    addDoubleClickHandler(this.canvas, this);
}

/**
 * Set margin size of the plot
 * 
 * @method
 * @param {Number} marginWidth  - margin width (unit px)
 * @param {Number} marginHeight - margin height (unit px)
 * @example
 * myPainter.setMargin(30, 20); // marginWidth = 30px; marginHeight = 20px;
 *                              // plotWidth  = canvasWidth - 2*marginWidth;
 *                              // plotHeight = canvasHeight - 2*marginHeight;
 */
Painter.prototype.setMargin = function(marginWidth, marginHeight) {
    this.marginWidth  = marginWidth;
    this.marginHeight = marginHeight;
    this.plotWidth    = this.canvasWidth-2*this.marginWidth;
    this.plotHeight   = this.canvasHeight-2*this.marginHeight;
};

/**
 * Set x range
 * 
 * @method
 * @param {Number} xMin - minimum of x range
 * @param {Number} xMax - maximum of x range
 * @example
 * myPainter.setXRange(-8, 8); // x from -8 to 8
 */
Painter.prototype.setXRange = function(xMin, xMax) {
    this.xMin    = xMin;
    this.xMax    = xMax;
    this.xScale  = this.plotWidth/(xMax-xMin);
    this.xOrigin = this.marginWidth-xMin*this.xScale;
    if (!this.refreshFlag) {
        this.initRange[0] = this.xMin;
        this.initRange[1] = this.xMax;
    }
};

/**
 * Set y range
 * 
 * @method
 * @param {Number} yMin - minimum of y range
 * @param {Number} yMax - maximum of y range
 * @example
 * myPainter.setYRange(-8, 8); // x from -8 to 8
 */
Painter.prototype.setYRange = function(yMin, yMax) {
    this.yMin = yMin;
    this.yMax = yMax;
    this.yScale = this.plotHeight/(yMax-yMin);
    this.yOrigin = this.marginHeight+this.plotHeight+yMin*this.yScale;
    if (!this.refreshFlag) {
        this.initRange[2] = this.yMin;
        this.initRange[3] = this.yMax;
    }
};

/**
 * Set x and y scales of the plot
 * 
 * @method
 * @param {Number} xScale - number of pixels of one unit in x
 * @param {Number} yScale - number of pixels of one unit in y
 * @example
 * myPainter.setScale(10, 5); // one unit in x = 10 px
 *                            // one unit in y = 5 px
 */
Painter.prototype.setScale = function(xScale, yScale) {
    this.xScale = xScale;
    this.yScale = yScale;
    this.xMin = (this.marginWidth-this.xOrigin)/this.xScale;
    this.xMax = (this.marginWidth+this.plotWidth-this.xOrigin)/this.xScale;
    this.yMin = (this.yOrigin-this.marginHeight-this.plotHeight)/this.yScale;
    this.yMax = (this.yOrigin-this.marginHeight)/this.yScale;
};

/**
 * Set position of the origin
 * 
 * @method
 * @param {Number} xOrigin - x origin position (unit px)
 * @param {Number} yOrigin - y origin position (unit px)
 * @example
 * myPainter.setOrigin(150, 75); // Set the origin to pixel coordinate (150, 75)
 */
Painter.prototype.setOrigin = function(xOrigin, yOrigin) {
    this.xOrigin = xOrigin;
    this.yOrigin = yOrigin;
    this.xMin = (this.marginWidth-this.xOrigin)/this.xScale;
    this.xMax = (this.marginWidth+this.plotWidth-this.xOrigin)/this.xScale;
    this.yMin = (this.yOrigin-this.marginHeight-this.plotHeight)/this.yScale;
    this.yMax = (this.yOrigin-this.marginHeight)/this.yScale;
};

/**
 * Set x and y labels
 * 
 * @method
 * @param {String} xLabel - x Label
 * @param {String} yLabel - y Label
 * @example
 * myPainter.setLabel("x-axis", "y-axis"); // Set the labels of x and y axes
 */
Painter.prototype.setLabel = function(xLabel, yLabel) {
    this.xLabel = xLabel;
    this.yLabel = yLabel;
};

/**
 * Set plot title
 * 
 * @method
 * @param {String} title - plot title
 * @example
 * myPainter.setTitle("My fancy plot"); // Set the title of the plot
 */
Painter.prototype.setTitle = function(title) {
    this.title = title;
};

/**
 * Set tick size
 * 
 * @method
 * @param {String} tickSize - size of ticks (unit px)
 * @example
 * myPainter.setTickSize(10); // Set the size of ticks
 */
Painter.prototype.setTickSize = function(tickSize) {
    this.tickSize = tickSize;
};

/**
 * Set tick label size
 * 
 * @method
 * @param {String} tickLabelSize - size of tick labels (unit px)
 * @example
 * myPainter.setTickSize(10); // Set the size of tick labels
 */
Painter.prototype.setTickLabelSize = function(tickLabelSize) {
    this.tickLabelSize = tickLabelSize;
};

/**
 * Set label size
 * 
 * @method
 * @param {String} labelSize - size of labels (unit px)
 * @example
 * myPainter.setLabelSize(10); // Set the size of labels
 */
Painter.prototype.setLabelSize = function(labelSize) {
    this.labelSize = labelSize;
};

/**
 * Set title size
 * 
 * @method
 * @param {String} titleSize - size of title (unit px)
 * @example
 * myPainter.setTitleSize(10); // Set the size of title
 */
Painter.prototype.setTitleSize = function(titleSize) {
    this.titleSize = titleSize;
};

/**
 * Set hold on property
 * 
 * @method
 * @param {Boolean} holdOn - hold on property (true or false)
 * @example
 * myPainter.setHoldOn(true); // Set hold on to true
 *                            // We can over plot graphs
 */
Painter.prototype.setHoldOn = function(holdOn) {
    this.holdOn = holdOn;
};

/**
 * Set control property
 * 
 * @method
 * @param {Boolean} true - control property (true or false)
 * @example
 * myPainter.setControl(true); // Set control to true
 *                             // We can zoom and pan the plot
 */
Painter.prototype.setControl = function(control) {
    this.control = control;
    if (control) {
        this.canvas.title = "1. Click to focus on the plot\n" +
                            "2. Press \"WSAD\" to zoom the plot\n" +
                            "3. Press \"Z\" and drag to zoom the selected region\n" +
                            "4. Press \"Shift\" and drag to pan the plot\n" +
                            "5. Double click to restore the plot";
    } else {
        this.canvas.title = "";
    }
};

/**
 * Two dimensional line plot
 * 
 * @method
 * @param {Array.Number} x     - x coordinate data
 * @param {Array.Number} y     - y coordinate data
 * @param {String}       color - rgb color string
 * @example
 * var x = [-3, -1, 1, 3];                 // x array
 * var y = [-2, 2, 2, -2];                 // y array
 * myPainter.plot(x, y, "rgb(0, 0, 255)"); // Plot a nice blue graph
 */
Painter.prototype.plot = function(x, y, color) {
    var cntx = this.cntx;
    
    // Check data length
    if (x.length!=y.length) {
        console.log("Painter warning: x length != y length");
    }
    
    if (!this.refreshFlag) {
        // Clear data
        if (!this.holdOn) {
            this.xycolorList.length = 0;
            this.xyphaseList.length = 0;
            this.EList.length   = 0;
            this.drawAxis();
        }
        // Register data to painter
        this.xycolorList.push({x:x, y:y, color:color});
    }
    
    // Save current clipping region
    cntx.save();
    
    // Clip plotting region
    cntx.beginPath();
    cntx.rect(this.marginWidth, this.marginHeight, this.plotWidth, this.plotHeight);
    cntx.clip();
    
    // Draw graph
    cntx.strokeStyle = color;
    cntx.beginPath();
    var n = x.length;
    var pointX, pointY;
    for (var i=0; i<n; i++) {
        pointX = Math.round(this.xScale*x[i]);
        pointY = Math.round(this.yScale*y[i]);
        if (i==0) {
            cntx.moveTo(this.xOrigin+pointX, this.yOrigin-pointY);
        } else {
            cntx.lineTo(this.xOrigin+pointX, this.yOrigin-pointY);
        }
    }
    cntx.stroke();
    
    // Restore clipping region
    cntx.restore();
};

/**
 * Bar-chart plot colored by phase
 * 
 * @method
 * @param {Array.Number} x      - x coordinate data
 * @param {Array.Number} y      - y coordinate data
 * @param {Array.Number} phase  - phase data (color of plot)
 * @param {Number}       offset - offset of the bar-chart
 * @example
 * var x = [-3, -1, 1, 3];                           // x array
 * var y = [-2, 2, 2, -2];                           // y array
 * var phase = [0, Math.PI/2, Math.PI, Math.PI*3/2]; // phase array
 * var offset = -4;                                  // offset of the bar-chart
 * myPainter.plotPhase(x, y, phase, offset);         // Plot a colorful bar-chart
 */
Painter.prototype.plotPhase = function(x, y, phase, offset) {
    var cntx = this.cntx;
    
    // Check data length
    if (x.length!=y.length) {
        console.log("Painter warning: x length != y length");
    }
    
    if (!this.refreshFlag) {
        // Clear data
        if (!this.holdOn) {
            this.xycolorList.length = 0;
            this.xyphaseList.length = 0;
            this.EList.length       = 0;
            this.drawAxis();
        }
        // Register data to painter
        this.xyphaseList.push({x:x, y:y, phase:phase, offset:offset});
    }
    
    // Phase colors
    var colors = [];
    for (var i=0; i<phase.length; i++) {
        if (phase[i]>=0&&phase[i]<Math.PI/3) {
            var r = 255*phase[i]/(Math.PI/3);
            colors[i] = "rgb(255,"+Math.round(r)+",0)";
        } else if (phase[i]>=Math.PI/3&&phase[i]<Math.PI*2/3) {
            var r = 255*(phase[i]-Math.PI/3)/(Math.PI/3);
            colors[i] = "rgb("+Math.round(255-r)+",255,0)";
        } else if (phase[i]>=Math.PI*2/3&&phase[i]<Math.PI) {
            var r = 255*(phase[i]-Math.PI*2/3)/(Math.PI/3);
            colors[i] = "rgb(0,255,"+Math.round(r)+")";
        } else if (phase[i]>=Math.PI&&phase[i]<Math.PI*4/3) {
            var r = 255*(phase[i]-Math.PI)/(Math.PI/3);
            colors[i] = "rgb(0,"+Math.round(255-r)+",255)";
        } else if (phase[i]>=Math.PI*4/3&&phase[i]<Math.PI*5/3) {
            var r = 255*(phase[i]-Math.PI*4/3)/(Math.PI/3);
            colors[i] = "rgb("+Math.round(r)+",0,255)";
        } else {
            var r = 255*(phase[i]-Math.PI*5/3)/(Math.PI/3);
            colors[i] = "rgb(255,0,"+Math.round(255-r)+")";
        }
    }
    
    // Save current clipping region
    cntx.save();
    
    // Clip plotting region
    cntx.beginPath();
    cntx.rect(this.marginWidth, this.marginHeight, this.plotWidth, this.plotHeight);
    cntx.clip();
    
    // Draw graph
    var n = x.length;
    var dx = this.xScale*(x[1]-x[0]);
    var yF = this.yScale*offset;
    var pointX, pointY;
    for (var i=0; i<n; i++) {
        pointX = Math.round(this.xScale*x[i]);
        pointY = Math.round(this.yScale*y[i]);
        cntx.beginPath();
        cntx.fillStyle = colors[i];
        cntx.rect(Math.floor(this.xOrigin+pointX-0.5*dx), this.yOrigin-pointY, Math.ceil(dx), pointY-yF);
        cntx.fill();
    }
    
    // Restore clipping region
    cntx.restore();
};

/**
 * Energy level plot
 * 
 * @method
 * @param {Number}  E     - energy level
 * @param {String}  text  - description text
 * @param {String}  color - rgb color string
 * @example
 * var E     = -2.0;                     // Energy level
 * var text  = "2p6";                    // Descriptions
 * var color = "rgb(255, 0, 255)";       // Color
 * myPainter.plotEnergy(E, text, color); // Plot energy level
 */
Painter.prototype.plotEnergy = function(E, text, color) {
    var cntx         = this.cntx;
    var marginWidth  = this.marginWidth;
    var marginHeight = this.marginHeight;
    var plotWidth    = this.plotWidth;
    var plotHeight   = this.plotHeight;
    
    if (!this.refreshFlag) {
        // Clear data
        if (!this.holdOn) {
            this.xycolorList.length = 0;
            this.xyphaseList.length = 0;
            this.EList.length       = 0;
            this.drawAxis();
        }
        // Register data to painter
        this.EList.push({E:E, text:text, color:color});
    }
    
    var Ey = this.yOrigin-E*this.yScale;
    
    // Draw energy
    cntx.strokeStyle = color;
    if (Ey>marginHeight&&Ey<marginHeight+plotHeight) {
        cntx.beginPath();
        cntx.moveTo(marginWidth, Ey);
        cntx.lineTo(marginWidth+plotWidth, Ey);
        cntx.stroke();
    }
    
    // Energy label
    cntx.font = "12px Times New Roman";
    cntx.textAlign = "right";
    cntx.fillStyle = color;
    if (Ey-11>marginHeight&&Ey-5<marginHeight+plotHeight) {
        cntx.fillText(text+"    "+"E = "+E.toFixed(3), marginWidth+plotWidth-10, Ey-5);
    }
};

/**
 * Draw a box of x and y axes
 * 
 * @method
 * @example
 * myPainter.drawAxis(); // Draw a box of axes
 */
Painter.prototype.drawAxis = function() {
    var cntx         = this.cntx;
    var canvasWidth  = this.canvasWidth;
    var canvasHeight = this.canvasHeight;
    var marginWidth  = this.marginWidth;
    var marginHeight = this.marginHeight;
    var plotWidth    = this.plotWidth;
    var plotHeight   = this.plotHeight;
    var xScale       = this.xScale;
    var yScale       = this.yScale;
    var xOrigin      = this.xOrigin;
    var yOrigin      = this.yOrigin;
    
    // Clear canvas
    cntx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Fill white rectangle in plotting area
    cntx.fillStyle = "#FFFFFF";
    cntx.fillRect(marginWidth, marginHeight, plotWidth, plotHeight);
    
    // Draw box
    cntx.strokeStyle = "rgb(0, 0, 0)";
    cntx.beginPath();
    cntx.rect(marginWidth, marginHeight, plotWidth, plotHeight);
    cntx.stroke();
    
    // Grid
    var xLog = Math.log(plotWidth/xScale)/Math.log(10);
    var yLog = Math.log(plotHeight/yScale)/Math.log(10);
    var xOdr = xLog-Math.floor(xLog)<Math.log(2)/Math.log(10) ? Math.floor(xLog)-1 : Math.floor(xLog);
    var yOdr = yLog-Math.floor(yLog)<Math.log(2)/Math.log(10) ? Math.floor(yLog)-1 : Math.floor(yLog);
    var xFix = xOdr>=0 ? 0 : Math.abs(xOdr);
    var yFix = yOdr>=0 ? 0 : Math.abs(yOdr);
    var xGrid = Math.pow(10, xOdr);
    var yGrid = Math.pow(10, yOdr);
    
    cntx.fillStyle = "rgb(0, 0, 0)";
    cntx.textBaseline = "bottom";
    cntx.font = this.tickLabelSize + "px Times New Roman";
    cntx.beginPath();
    var xTickP, xTickN, yTickP, yTickN;
    var tickSize = this.tickSize;
    var tickLabelSize = this.tickLabelSize;
    var xTickLabelHeight = marginHeight+plotHeight+this.tickLabelSize+2;
    var yTickLabelWidth  = marginWidth-4;
    for (var i=0; i<10000; i++) {
        xTickP = xOrigin+xGrid*i*xScale;
        xTickN = xOrigin-xGrid*i*xScale;
        yTickP = yOrigin-yGrid*i*yScale;
        yTickN = yOrigin+yGrid*i*yScale;
        if (xTickP>=marginWidth&&xTickP<=marginWidth+plotWidth) {
            cntx.textAlign = "center";
            cntx.moveTo(xTickP, marginHeight+plotHeight);
            cntx.lineTo(xTickP, marginHeight+plotHeight-tickSize);
            if (Math.abs(xOdr)<4) {
                cntx.fillText((xGrid*i).toFixed(xFix), xTickP, xTickLabelHeight);
            } else {
                cntx.fillText((xGrid*i).toExponential(1), xTickP, xTickLabelHeight);
            }
        }
        if (i!=0&&xTickN>=marginWidth&&xTickN<=marginWidth+plotWidth) {
            cntx.textAlign = "center";
            cntx.moveTo(xTickN, marginHeight+plotHeight);
            cntx.lineTo(xTickN, marginHeight+plotHeight-tickSize);
            if (Math.abs(xOdr)<4) {
                cntx.fillText((-xGrid*i).toFixed(xFix), xTickN, xTickLabelHeight);
            } else {
                cntx.fillText((-xGrid*i).toExponential(1), xTickN, xTickLabelHeight);
            }
        }
        if (yTickP>=marginHeight&&yTickP<=marginHeight+plotHeight) {
            cntx.textAlign = "right";
            cntx.moveTo(marginWidth, yTickP);
            cntx.lineTo(marginWidth+tickSize, yTickP);
            if (Math.abs(yOdr)<4) {
                cntx.fillText((yGrid*i).toFixed(yFix), yTickLabelWidth, yTickP+tickLabelSize*0.5);
            } else {
                cntx.fillText((yGrid*i).toExponential(1), yTickLabelWidth, yTickP+tickLabelSize*0.5);
            }
        }
        if (i!=0&&yTickN>=marginHeight&&yTickN<=marginHeight+plotHeight) {
            cntx.textAlign = "right";
            cntx.moveTo(marginWidth, yTickN);
            cntx.lineTo(marginWidth+tickSize, yTickN);
            if (Math.abs(yOdr)<4) {
                cntx.fillText((-yGrid*i).toFixed(yFix), yTickLabelWidth, yTickN+tickLabelSize*0.5);
            } else {
                cntx.fillText((-yGrid*i).toExponential(1), yTickLabelWidth, yTickN+tickLabelSize*0.5);
            }
        }
        if (xTickP>marginWidth+plotWidth&&xTickN<marginWidth&&
            yTickP<marginHeight&&yTickN>marginHeight+plotHeight) {
            break;
        }
    }
    cntx.stroke();
    
    // Label and Title
    cntx.font = this.labelSize + "px Times New Roman";
    cntx.textAlign = "center";
    cntx.fillText(this.xLabel, canvasWidth*0.5, canvasHeight-1);
    cntx.rotate(-Math.PI/2);
    cntx.fillText(this.yLabel, -canvasHeight*0.5, this.labelSize);
    cntx.rotate(Math.PI/2);
    cntx.font = this.titleSize + "px Times New Roman";
    cntx.fillText(this.title, canvasWidth*0.5, this.titleSize+1);
};

/**
 * Update canvas size and re-plot all data that is registered to the painter
 * 
 * @method
 * @example
 * var x = [-3, -1, 1, 3];                 // x array
 * var y = [-2, 2, 2, -2];                 // y array
 * myPainter.plot(x, y, "rgb(0, 0, 255)"); // Plot a nice blue graph
 * 
 * // Resize the HTML canvas element
 * myCanvas.width  = 500;
 * myCanvas.height = 300;
 * myPainter.refresh();
 * 
 * // Rescale the plot
 * myPainter.setXRange(-8, 8);
 * myPainter.refresh();
 * 
 * // Retitle the plot
 * myPainter.setTitle("My super-fancy plot");
 * myPainter.refresh();
 */
Painter.prototype.refresh = function() {
    this.refreshFlag = true;
    
    // Get width and height from the actual canvas
    var canvasWidth  = this.canvas.width;
    var canvasHeight = this.canvas.height;
    
    // Adjust settings of painter
    if (canvasWidth>2*this.marginWidth&&canvasHeight>2*this.marginHeight) {
        this.canvasWidth  = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.setMargin(this.marginWidth, this.marginHeight);
        this.setXRange(this.xMin, this.xMax);
        this.setYRange(this.yMin, this.yMax);
    }
    
    // Re-plot all registered data
    this.drawAxis();
    var x, y, color;
    for (var i=0; i<this.xycolorList.length; i++) {
        x = this.xycolorList[i].x;
        y = this.xycolorList[i].y;
        color = this.xycolorList[i].color;
        this.plot(x, y, color);
    }
    var x, y, phase, offset;
    for (var i=0; i<this.xyphaseList.length; i++) {
        x = this.xyphaseList[i].x;
        y = this.xyphaseList[i].y;
        phase = this.xyphaseList[i].phase;
        offset = this.xyphaseList[i].offset;
        this.plotPhase(x, y, phase, offset);
    }
    var E, text, color;
    for (var i=0; i<this.EList.length; i++) {
        E = this.EList[i].E;
        text = this.EList[i].text;
        color = this.EList[i].color;
        this.plotEnergy(E, text, color);
    }
    
    this.refreshFlag = false;
};
