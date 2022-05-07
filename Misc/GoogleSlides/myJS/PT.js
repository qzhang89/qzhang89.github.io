/*
 * PT.js
 * Display periodic table
 * Need to include PTable.js
 */

var PT = new Object();

window.addEventListener("load", function() {PT.loadHandler();}, false);
PT.loadHandler = function() {
    var PTDivs = document.getElementsByClassName("PT");
    for (var i=0; i<PTDivs.length; i++) {
        PT.setupPT(PTDivs[i]);
    }
};

// PT setup
PT.setupPT = function(container) {
    // Add HTML elements
    var html = "";
    html += "<svg class='ptSVG'></svg>";
    
    container.innerHTML = html;
    
    // Get HTML elements
    var ptSVG = container.getElementsByClassName("ptSVG")[0];

    // Setup
    var myPTable = new PTable(ptSVG);
    myPTable.setOpacity(0.3);
    myPTable.refresh();
    
    // Get svg group elements
    var elemList = [];
    for (var i=1; i<myPTable.atomList.length; i++) {
        elemList[i] = container.getElementsByClassName("Z"+i)[0];
        elemList[i].isClicked = false;
    }
    var elem = null;
    
    // Add event listeners
    window.addEventListener("resize", resize, false);
    for (var Z=1; Z<elemList.length; Z++) {
        elemList[Z].addEventListener("mouseenter", elemEnterHandler, false);
        elemList[Z].addEventListener("mouseleave", elemLeaveHandler, false);
        elemList[Z].addEventListener("click", elemClickHandler, false);
    }
    
    // Mouse over element
    function elemEnterHandler() {
        this.setAttribute("style", "cursor:pointer;");
        this.getElementsByClassName("rect")[0].setAttribute("style",
        "fill:"+myPTable.fillColor[this.l]+"; stroke:"+myPTable.strokeColor[this.l]+
        "; stroke-width:"+myPTable.strokeWidth+"; opacity:1.0;");
    }
    
    // Mouse leave element
    function elemLeaveHandler() {
        this.setAttribute("style", "cursor:default;");
        if (!this.isClicked) {
            this.getElementsByClassName("rect")[0].setAttribute("style",
            "fill:"+myPTable.fillColor[this.l]+"; stroke:"+myPTable.strokeColor[this.l]+
            "; stroke-width:"+myPTable.strokeWidth+"; opacity:0.3;");
        }
    }
    
    function elemClickHandler() {
        elem = this;
        if (!elem.isClicked) {
            elem.getElementsByClassName("rect")[0].setAttribute("style",
            "fill:"+myPTable.fillColor[elem.l]+"; stroke:"+myPTable.strokeColor[elem.l]+
            "; stroke-width:"+myPTable.strokeWidth+"; opacity:1.0;");
            elem.isClicked = true;
        } else {
            elem.getElementsByClassName("rect")[0].setAttribute("style",
            "fill:"+myPTable.fillColor[elem.l]+"; stroke:"+myPTable.strokeColor[elem.l]+
            "; stroke-width:"+myPTable.strokeWidth+"; opacity:0.3;");
            elem.isClicked = false;
        }
    }

    //Window resize
    function resize() {
        // Get container width
        var contWidth  = container.clientWidth;
        
        // Set new width and height (height depends on width)
        ptSVG.setAttribute("width",  contWidth*0.4);
        ptSVG.setAttribute("height", contWidth*0.3);
        
        // Refresh
        myPTable.refresh();
        for (var i=1; i<elemList.length; i++) {
            if (elemList[i].isClicked) {
                elemList[i].getElementsByClassName("rect")[0].setAttribute("style",
                "fill:"+myPTable.fillColor[elemList[i].l]+"; stroke:"+myPTable.strokeColor[elemList[i].l]+
                "; stroke-width:"+myPTable.strokeWidth+"; opacity:1.0;");
            }
        }
    }
    resize();
};
