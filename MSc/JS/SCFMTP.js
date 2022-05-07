/*
 * SCFMTP.js
 * Multiplet calculations
 * Need to include PTabel.js, Orbit.js, SCFSolver.js, Painter.js
 * Painter3D.js, Visualizer.js, Complex.js, Spectrum.js,
 * Gaunt.js, CGcoeff.js, Vec.js, Basis.js, BasisJJ.js, Multiplet.js,
 * Crystal.js, CrysView.js 
 */

var SCFMTP = new Object();

window.addEventListener("load", function() {SCFMTP.loadHandler();}, false);
SCFMTP.loadHandler = function() {
    var SCFMTPDivs = document.getElementsByClassName("SCFMTP");
    for (var i=0; i<SCFMTPDivs.length; i++) {
        SCFMTP.setup(SCFMTPDivs[i]);
    }
};

// SCFMTP setup
SCFMTP.setup = function(container) {
    var ptcw   = 0.45;
    var ptch   = 0.36;
    var glcw   = 0.30;
    var glch   = 0.30;
    var Rcw    = 0.37;
    var Rch    = 0.40;
    var rhocw  = 0.22;
    var rhoch  = 0.185;
    var Zeffcw = 0.22;
    var Zeffch = 0.185;
    var mtpcw  = 0.74;
    var mtpch  = 0.40;
    var cfcw   = 0.40;
    var cfch   = 0.40;
    var tscw   = 0.40;
    var tsch   = 0.30;
    
    // Add HTML elements (SCF)
    var html = "";
    html += "<div class='setElem'>";
    html += "<div class='ptable'><svg class='ptSVG' xmlns='http://www.w3.org/2000/svg'></svg></div>";
    html += "<div class='ptDispDiv'>";
    html += "<div class='elemDispDiv'>";
    html += "<div class='elemNumDiv'></div>";
    html += "<div class='elemSymbDiv'><span class='elemSymbSpan'></span>";
    html += "<sup class='elemIonSup'></sup></div>";
    html += "<div class='elemNameDiv'></div>";
    html += "<div class='elemWeightDiv'></div>";
    html += "<input class='elemCfgText' type='text' />";
    html += "</div>"; // end elemDispDiv
    html += "<div class='dfcfgDiv'>Default Configuration: ";
    html += "<select class='aufSelect'><option>Realistic</option>";
    html += "<option>Aufbau</option></select></div>";
    html += "</div>"; // end ptDispDiv
    html += "<div class='visual'>";
    html += "<div class='glDiv'><canvas class='glCanvas'></canvas></div>";
    html += "<input type='button' value='Visualize' class='visButton' />";
    html += "&nbsp;&nbsp;<select class='nlSelect'></select>";
    html += "&nbsp;&nbsp;<select class='mSelect'></select><br />";
    html += "<input type='range' class='densRange' />";
    html += "</div>"; // end visual
    html += "</div>"; // end setElem
    html += "<h2>Self-consistent field computation</h2>";
    html += "<div class='scf'>";
    html += "<div class='comp'>";
    html += "<h3>Self-consistent iterations</h3><div class='iterDiv'>";
    html += "Converge total energy to <select class='digSelect'>";
    html += "<option>4</option><option>5</option><option>6</option>";
    html += "<option>7</option><option>8</option></select> digits<br />";
    html += "<textarea rows='10' cols='35' readonly class='iterText'>";
    html += "</textarea><br />";
    html += "<input type='button' value='Full SCF' class='fullButton' /> ";
    html += "<input type='button' value='SCF Step' class='stepButton' /> ";
    html += "<progress max='1' value='0' class='prgsBar'></progress> ";
    html += "<input type='button' title='Stop Full SCF' value='\u25A0' ";
    html += "style='color:red;' class='stopButton' /></div>"; // end iterDiv
    html += "<h3>Exchange-correlation method</h3>";
    html += "<div class='xcDiv'><select class='xcSelect'>";
    html += "<option>None</option>";
    html += "<option>Kohn-Sham-Gaspar</option>";
    html += "<option>Hedin-Lundqvist</option>";
    html += "<option>Gunnarsson-Lundqvist-Wilkins</option>";
    html += "<option>Von Barth-Hedin</option>";
    html += "<option>Ceperley-Alder Perdew-Zunger</option>";
    html += "<option>Ceperley-Alder Vosko-Wilk-Nusair</option>";
    html += "</select></div>";
    html += "<h3>Generate report</h3>";
    html += "<div class='genDiv'>";
    html += "Sorting&nbsp;&nbsp;<select class='ordSelect'>";
    html += "<option>Shell n</option><option>Shell l</option>";
    html += "<option>Energy</option><option>Config</option>";
    html += "</select>&nbsp;&nbsp;";
    html += "<select class='ascSelect'>";
    html += "<option>Ascend</option><option>Decend</option>";
    html += "</select><br />";
    html += "Report digits&nbsp;&nbsp;<select class='rdigSelect'>";
    html += "<option>4</option><option>5</option><option>6</option>";
    html += "<option>7</option><option>8</option></select>&nbsp;&nbsp;";
    html += "<input type='button' value='Generate' class='rptButton' />";
    html += "</div>"; // end genDiv
    html += "</div>"; // end comp
    html += "<div class='plots'>";
    html += "<h3>Units</h3>";
    html += "<div class='unitDiv'>Distance unit <select class='lengthSelect'>";
    html += "<option>Bohr radius</option>";
    html += "<option>Angstrom</option>";
    html += "</select>&nbsp;&nbsp;";
    html += "Energy unit <select class='energySelect'>";
    html += "<option>Hartree</option>";
    html += "<option>Rydberg</option>";
    html += "<option>eV</option>";
    html += "</select></div>";
    html += "<h3>Wave function plots</h3>";
    html += "<table class='plottable'>";
    html += "<tr><td rowspan='2'><select class='RuSelect'>";
    html += "<option>Energy and R</option>";
    html += "<option>Energy and u</option></select><br />";
    html += "<canvas class='RCanvas'></canvas></td>";
    html += "<td><select class='rhoSelect'>";
    html += "<option>rho*r*r</option>";
    html += "<option>log(rho)</option></select><br />";
    html += "<canvas class='rhoCanvas'></canvas></td></tr>";
    html += "<tr><td><select class='ZeffSelect'>";
    html += "<option>Zeff</option>";
    html += "<option>log(Zeff)</option></select><br />";
    html += "<canvas class='ZeffCanvas'></canvas></td></tr>";
    html += "</table>";
    html += "</div>"; // end plots
    html += "</div>"; // end scf
    html += "<div class='rptDiv'><pre class='rptPre'></pre></div>";
    
    // Add HTML elements (MTP)
    html += "<h2>Multiplet calculation</h2>";
    html += "<div class='mtp'>";
    html += "<div class='panel'>";
    html += "<table><tr>";
    html += "<td class='shell xs'><div class='sym'>s</div></td>";
    html += "<td class='shell xp'><div class='sym'>p</div></td>";
    html += "<td class='shell xd'><div class='sym'>d</div></td>";
    html += "<td class='shell xf'><div class='sym'>f</div></td>";
    html += "</tr></table><br />";
    html += "<div>F<sup>(0)</sup> = <input class='F0Text' type='text' size='10' /></div>";
    html += "<div>F<sup>(2)</sup> = <input class='F2Text' type='text' size='10' /></div>";
    html += "<div>F<sup>(4)</sup> = <input class='F4Text' type='text' size='10' /></div>";
    html += "<div>F<sup>(6)</sup> = <input class='F6Text' type='text' size='10' /></div>";
    html += "<div><sup>&nbsp;</sup>SO = <input class='SOText' type='text' size='10' value='10.000000' /></div>";
    html += "<div class='confDiv'></div>";
    html += "Number of <select class='ehSelect'><option>e-</option><option>h+</option></select> = ";
    html += "<span class='neSpan'></span><br />";
    html += "<input class='neRange' type='range' /><br />";
    html += "<input class='MButton' type='button' value='Multiplet' /><br />";
    html += "</div>"; // end panel
    html += "<div class='spect'><canvas class='mtpCanvas'></canvas></div>";
    html += "<div class='mtpDiv'></div>";
    html += "</div>"; // end mtp
    
    // Add HTML elements (Crystal)
    html += "<h2>Crystal field effect</h2>";
    html += "<div class='crystal'>";
    html += "<div class='viewCrystal'>";
    html += "<div class='cfDiv'><canvas class='cfCanvas'></canvas></div>";
    html += "<div class='tsCrystal'><canvas class='tsCanvas'></canvas></div>";
    html += "</div>"; // end viewCrystal
    html += "<div class='setCrystal'>";
    html += "<h3>Crystal structure</h3>";
    html += "<div class='structDiv'>";
    html += "<select class='symSelect'>";
    html += "<option>Tetrahedral</option>";
    html += "<option>Hexahedral</option>";
    html += "<option>Octahedral</option>";
    html += "<option>Dodecahedral</option>";
    html += "<option>Icosahedral</option>";
    html += "</select><br />";
    html += "q<sub>0</sub> = <input class='q0Text' type='text' size='3' value='1' />&nbsp;&nbsp;&nbsp;&nbsp;";
    html += "r<sub>0</sub> = <input class='r0Text' type='text' size='3' value='10.0' />";
    html += "<div class='mdDiv'>";
    html += "<div class='mdq1Div'>Mode Q1: <input type='range' class='mdq1Range' /></div>";
    html += "<div class='mdq2Div'>Mode Q2: <input type='range' class='mdq2Range' /></div>";
    html += "<div class='mdq3Div'>Mode Q3: <input type='range' class='mdq3Range' /></div>";
    html += "</div>"; // end mdDiv
    html += "<table class='cfTable' border=1>";
    html += "<tr><th>#</th><th>q</th><th>r</th><th>&theta;(*&pi;)</th><th>&phi;(*&pi;)</th></tr>";
    html += "</table><br />";
    html += "<input class='AQButton' type='button' value='Add charge' />&nbsp;";
    html += "<input class='DQButton' type='button' value='Delete charge' />&nbsp;";
    html += "<input class='STButton' type='button' value='Setup' />&nbsp;";
    html += "<input class='CEButton' type='button' value='Spectrum' /><br />";
    html += "<table class='enTable' border=1>";
    html += "<tr><th>Energy</th><th>Degeneracy</th></tr>";
    html += "</table><br />";
    html += "</div>"; // end structDiv
    html += "<h3>Orbital in crystal</h3>";
    html += "<div class='IkDiv'>";
    html += "<div class='cbtDiv'>s<sup>1</sup></div>";
    html += "<div>I<sup>(2)</sup> = <input class='I2Text' type='text' size='10' /></div>";
    html += "<div>I<sup>(4)</sup> = <input class='I4Text' type='text' size='10' /></div>";
    html += "<div>I<sup>(6)</sup> = <input class='I6Text' type='text' size='10' /></div>";
    html += "</div>"; // end IkDiv
    html += "<h3>Field strength</h3>";
    html += "<div class='funSelectDiv'><select class='funSelect'>";
    html += "<option>Field strengths I(k) as functions of &alpha;</option>";
    html += "<option>Geometry modes as functions of &alpha;</option>";
    html += "</select></div>";
    html += "<div class='IfunDiv'>";
    html += "I(2): <input class='I2funText' type='text' value='function(a, I2) {return a*I2;}' size='25' /><br />";
    html += "I(4): <input class='I4funText' type='text' value='function(a, I4) {return a*I4;}' size='25' /><br />";
    html += "I(6): <input class='I6funText' type='text' value='function(a, I6) {return a*I6;}' size='25' />";
    html += "</div>";
    html += "<div class='QfunDiv'>";
    html += "Q1: <input class='Q1funText' type='text' value='function(a) ";
    html += "{return a;}' size='25' /><br />";
    html += "Q2: <input class='Q2funText' type='text' value='function(a) "
    html += "{return -0.01907*a+0.09873;}' size='25' /><br />";
    html += "Q3: <input class='Q3funText' type='text' value='function(a) ";
    html += "{return 144.65*a*a*a-437.685*a*a+441.44*a-148.45;}' size='25' />";
    html += "</div>";
    html += "<div class='alphaDiv'>";
    html += "&alpha;<sub>min</sub> = <input class='aminText' type='text' value='0' size='2' /> ";
    html += "&alpha;<sub>max</sub> = <input class='amaxText' type='text' value='10' size='2' /> ";
    html += "&Delta;&alpha; = <input class='daText' type='text' value='1' size='2' /> ";
    html += "<input class='hfButton' type='button' value='Half' /><br />";
    html += "<input class='aEButton' type='button' value='Tanabe-Sugano Diagram' />";
    html += "</div>"; // end alphaDiv
    html += "</div>"; // end setCrystal
    html += "</div>"; // end crystal
    container.innerHTML = html;
    
    // Get HTML elements (SCF)
    var ptSVG = container.getElementsByClassName("ptSVG")[0];
    var myPTable = new PTable(ptSVG);
    myPTable.setOpacity(0.5);
    var elemList = [];
    for (var i=1; i<myPTable.atomList.length; i++) {
        elemList[i] = container.getElementsByClassName("Z"+i)[0];
    }
    var aufSelect    = container.getElementsByClassName("aufSelect")[0];
    var xcSelect     = container.getElementsByClassName("xcSelect")[0];
    var elemDispDiv  = container.getElementsByClassName("elemDispDiv")[0];
    var elemNumDiv   = container.getElementsByClassName("elemNumDiv")[0];
    var elemSymbSpan = container.getElementsByClassName("elemSymbSpan")[0];
    var elemIonSup   = container.getElementsByClassName("elemIonSup")[0];
    var elemNameDiv  = container.getElementsByClassName("elemNameDiv")[0];
    var elemWeightDiv = container.getElementsByClassName("elemWeightDiv")[0];
    var elemCfgText  = container.getElementsByClassName("elemCfgText")[0];
    var visButton    = container.getElementsByClassName("visButton")[0];
    var glDiv        = container.getElementsByClassName("glDiv")[0];
    var glCanvas     = container.getElementsByClassName("glCanvas")[0];
    var densRange    = container.getElementsByClassName("densRange")[0];
    var nlSelect     = container.getElementsByClassName("nlSelect")[0];
    var mSelect      = container.getElementsByClassName("mSelect")[0];
    var RuSelect     = container.getElementsByClassName("RuSelect")[0];
    var rhoSelect    = container.getElementsByClassName("rhoSelect")[0];
    var ZeffSelect   = container.getElementsByClassName("ZeffSelect")[0];
    var RCanvas      = container.getElementsByClassName("RCanvas")[0];
    var rhoCanvas    = container.getElementsByClassName("rhoCanvas")[0];
    var ZeffCanvas   = container.getElementsByClassName("ZeffCanvas")[0];
    var fullButton   = container.getElementsByClassName("fullButton")[0];
    var stepButton   = container.getElementsByClassName("stepButton")[0];
    var stopButton   = container.getElementsByClassName("stopButton")[0];
    var prgsBar      = container.getElementsByClassName("prgsBar")[0];
    var lengthSelect = container.getElementsByClassName("lengthSelect")[0];
    var energySelect = container.getElementsByClassName("energySelect")[0];
    var digSelect    = container.getElementsByClassName("digSelect")[0];
    var iterText     = container.getElementsByClassName("iterText")[0];
    var ordSelect    = container.getElementsByClassName("ordSelect")[0];
    var ascSelect    = container.getElementsByClassName("ascSelect")[0];
    var rdigSelect   = container.getElementsByClassName("rdigSelect")[0];
    var rptButton    = container.getElementsByClassName("rptButton")[0];
    var rptPre       = container.getElementsByClassName("rptPre")[0];
    
    xcSelect.selectedIndex = 6;
    
    stopButton.disabled = "disabled";
    densRange.disabled = "disabled";
    
    var colorList = [];
    colorList[0] = "rgb(0, 0, 255)";
    colorList[1] = "rgb(255, 155, 0)";
    colorList[2] = "rgb(255, 0, 0)";
    colorList[3] = "rgb(0, 200, 0)";
    colorList[4] = "rgb(155, 0, 255)";
    colorList[5] = "rgb(0, 155, 255)";
    
    var spdList = ["s", "p", "d", "f", "g", "h"];
    
    // Setup
    var rMinZ     = 0.0001;
    var rMax      = 50.0;
    var dx        = 0.002;
    var bkgdColor = [1.0,1.0,1.0];
    var gridColor = [0.8,0.8,0.8];
    var Z = 1, totNe = 1;
    var r = null, V = null;
    var orbList = null;
    var rho = null, Zeff = null;
    var Etot = 0, Ekin = 0, Eee = 0, Een = 0, Exc = 0;
    var SC = 0, SO = 0;
    var stopFlag = false;
    var lengthUnit = 1;
    var energyUnit = 1;
    var dig = 4, tol = 1e-4;
    var rdig = 4;
    
    var elem = null;
    var currentCfg = "";
    
    // SCFSolver
    var scfSolver = null;
    
    // Painter
    var RPainter    = new Painter(RCanvas);
    var rhoPainter  = new Painter(rhoCanvas);
    var ZeffPainter = new Painter(ZeffCanvas);
    RPainter.setLabel("r", "");
    RPainter.setTickSize(10);
    RPainter.setTickLabelSize(14);
    RPainter.setLabelSize(20);
    RPainter.setMargin(40, 10, 5, 30);
    RPainter.refresh();
    rhoPainter.setLabel("r", "");
    rhoPainter.setTickSize(10);
    rhoPainter.setTickLabelSize(14);
    rhoPainter.setLabelSize(20);
    rhoPainter.setMargin(40, 10, 5, 30);
    rhoPainter.refresh();
    ZeffPainter.setLabel("r", "");
    ZeffPainter.setTickSize(10);
    ZeffPainter.setTickLabelSize(14);
    ZeffPainter.setLabelSize(20);
    ZeffPainter.setMargin(40, 10, 5, 30);
    ZeffPainter.refresh();
    
    // Painter3D
    var glPainter = new Painter3D(glCanvas);
    if (!glPainter.gl) {
        glDiv.innerHTML = "<a href='http://get.webgl.org/'>" +
                          "<img class='glImg' src='Images/glImage.png' " +
                          "alt='Your browser does not support WebGL.' " +
                          "title='Your browser does not support WebGL.' " +
                          "width=100% height=100%/></a>";
    } else {
        glPainter.setBkgdColor(bkgdColor);
        glPainter.setMatrices([0.0,0.0,-38.0], [-1.2,0.0,-Math.PI*3/4]);
        
        // Setup axis
        glPainter.setupAxis(14, 0.75);
        glPainter.setAxisOn(true);
        
        // Setup grid
        glPainter.setupGrid(1, 12, gridColor);
        glPainter.setGridOn(false);
        
        // Resize mesh
        var mm = [];
        for (var i=0; i<=24; i++) {
            mm[i] = (i-12)/2;
        }
        glPainter.setupMesh(mm, mm, 0, true);
        
        glPainter.setPointSize(1.5);
        glPainter.setupLight([0.0,1.0,2.0], [0.5,0.5,0.5], [0.6,0.6,0.6], [0.8,0.8,0.8], 100.0);
    }
    
    // Points vertices, normals colors
    var pointVertices = null;
    var pointNormals  = null;
    var pointColors   = null;
    
    // Add event listeners
    window.addEventListener("resize", resize, false);
    aufSelect.addEventListener("change", aufChangeHandler, false);
    elemCfgText.addEventListener("change", cfgChangeHandler, false);
    xcSelect.addEventListener("change", xcChangeHandler, false);
    visButton.addEventListener("click", visualClickHandler, false);
    glCanvas.addEventListener("keydown", keyDownHandler, false);
    densRange.addEventListener("change", densChangeHandler, false);
    nlSelect.addEventListener("change", nlChangeHandler, false);
    mSelect.addEventListener("change", mChangeHandler, false);
    RuSelect.addEventListener("change", RuToggleHandler, false);
    rhoSelect.addEventListener("change", rhoToggleHandler, false);
    ZeffSelect.addEventListener("change", ZeffToggleHandler, false);
    fullButton.addEventListener("click", fullClickHandler, false);
    stepButton.addEventListener("click", stepClickHandler, false);
    stopButton.addEventListener("click", stopClickHandler, false);
    lengthSelect.addEventListener("change", unitChangeHandler, false);
    energySelect.addEventListener("change", unitChangeHandler, false);
    digSelect.addEventListener("change", digChangeHandler, false);
    rdigSelect.addEventListener("change", rdigChangeHandler, false);
    rptButton.addEventListener("click", rptClickHandler, false);
    
    for (var i=1; i<elemList.length; i++) {
        elemList[i].addEventListener("mouseenter", elemEnterHandler, false);
        elemList[i].addEventListener("mouseleave", elemLeaveHandler, false);
        elemList[i].addEventListener("click", elemClickHandler, false);
    }
    
    // Get HTML elements (MTP)
    var shells    = container.getElementsByClassName("shell");
    var F0Text    = container.getElementsByClassName("F0Text")[0];
    var F2Text    = container.getElementsByClassName("F2Text")[0];
    var F4Text    = container.getElementsByClassName("F4Text")[0];
    var F6Text    = container.getElementsByClassName("F6Text")[0];
    var SOText    = container.getElementsByClassName("SOText")[0];
    var confDiv   = container.getElementsByClassName("confDiv")[0];
    var ehSelect  = container.getElementsByClassName("ehSelect")[0];
    var neSpan    = container.getElementsByClassName("neSpan")[0];
    var neRange   = container.getElementsByClassName("neRange")[0];
    var MButton   = container.getElementsByClassName("MButton")[0];
    var mtpCanvas = container.getElementsByClassName("mtpCanvas")[0];
    var mtpDiv    = container.getElementsByClassName("mtpDiv")[0];
    
    var shell = null;
    var isElec = true;
    var Fk = [];
    var l = 0, Ne = 0;
    var myBasis = null, myMTP = null, myEnergy = null;
    var lList = ["s", "p", "d", "f"];
    var LList = ["S", "P", "D", "F", "G", "H", "I", "K", "L", "M", "N", "O", "Q", "R", "T", "U", "V"];
    var sF0 = 0.625000;
    var pF0 = 0.181641;
    var pF2 = 0.087891;
    var pSO = 0.001000;
    var dF0 = 0.086046;
    var dF2 = 0.045421;
    var dF4 = 0.029622;
    var dSO = 0.000100;
    var fF0 = 0.050226;
    var fF2 = 0.028140;
    var fF4 = 0.018802;
    var fF6 = 0.013910;
    var fSO = 0.000010;
    
    // Multiplet colors [2S+1]
    var color = [];
    color[0]  = "rgb(0,0,255)";
    color[1]  = "rgb(255,0,0)";
    color[2]  = "rgb(0,127,0)";
    color[3]  = "rgb(255,0,127)";
    color[4]  = "rgb(255,127,0)";
    color[5]  = "rgb(127,127,0)";
    color[6]  = "rgb(0,127,255)";
    color[7]  = "rgb(127,0,127)";
    color[8]  = "rgb(0,0,127)";
    color[9]  = "rgb(0,127,127)";
    color[10] = "rgb(127,0,0)";
    color[11] = "rgb(127,0,255)";
    color[12] = "rgb(255,127,127)";
    color[13] = "rgb(127,255,127)";
    color[14] = "rgb(127,127,255)";
    color[15] = "rgb(127,127,127)";
    
    // Spectrum
    var mtpSpectrum = new Spectrum(mtpCanvas);
    mtpSpectrum.setBarLength(65);
    mtpSpectrum.setLabel(["Config", "Coulomb", "Spin-Orbit", "Hu+Hso", "Coulomb", "Spin-Orbit", "Config"]);
    mtpSpectrum.setTagSize(14);
    mtpSpectrum.setLabelSize(16);
    mtpSpectrum.refresh();
    
    // Add event listeners
    F0Text.addEventListener("change", FkSOChangeHandler, false);
    F2Text.addEventListener("change", FkSOChangeHandler, false);
    F4Text.addEventListener("change", FkSOChangeHandler, false);
    F6Text.addEventListener("change", FkSOChangeHandler, false);
    SOText.addEventListener("change", FkSOChangeHandler, false);
    neRange.addEventListener("change", neChangeHandler, false);
    ehSelect.addEventListener("change", neChangeHandler, false);
    MButton.addEventListener("click", MClickHandler, false);
    
    for (var i=0; i<shells.length; i++) {
        shells[i].addEventListener("click", shellClickHandler, false);
    }
    
    // Get HTML elements (Crystal)
    var cfDiv     = container.getElementsByClassName("cfDiv")[0];
    var cfCanvas  = container.getElementsByClassName("cfCanvas")[0];
    var tsCanvas  = container.getElementsByClassName("tsCanvas")[0];
    var cfTable   = container.getElementsByClassName("cfTable")[0];
    var symSelect = container.getElementsByClassName("symSelect")[0];
    var q0Text    = container.getElementsByClassName("q0Text")[0];
    var r0Text    = container.getElementsByClassName("r0Text")[0];
    var mdq1Div   = container.getElementsByClassName("mdq1Div")[0];
    var mdq2Div   = container.getElementsByClassName("mdq2Div")[0];
    var mdq3Div   = container.getElementsByClassName("mdq3Div")[0];
    var mdq1Range = container.getElementsByClassName("mdq1Range")[0];
    var mdq2Range = container.getElementsByClassName("mdq2Range")[0];
    var mdq3Range = container.getElementsByClassName("mdq3Range")[0];
    var AQButton  = container.getElementsByClassName("AQButton")[0];
    var DQButton  = container.getElementsByClassName("DQButton")[0];
    var STButton  = container.getElementsByClassName("STButton")[0];
    var CEButton  = container.getElementsByClassName("CEButton")[0];
    var enTable   = container.getElementsByClassName("enTable")[0];
    var cbtDiv    = container.getElementsByClassName("cbtDiv")[0];
    var I2Text    = container.getElementsByClassName("I2Text")[0];
    var I4Text    = container.getElementsByClassName("I4Text")[0];
    var I6Text    = container.getElementsByClassName("I6Text")[0];
    var funSelect = container.getElementsByClassName("funSelect")[0];
    var IfunDiv   = container.getElementsByClassName("IfunDiv")[0];
    var QfunDiv   = container.getElementsByClassName("QfunDiv")[0];
    var I2funText = container.getElementsByClassName("I2funText")[0];
    var I4funText = container.getElementsByClassName("I4funText")[0];
    var I6funText = container.getElementsByClassName("I6funText")[0];
    var Q1funText = container.getElementsByClassName("Q1funText")[0];
    var Q2funText = container.getElementsByClassName("Q2funText")[0];
    var Q3funText = container.getElementsByClassName("Q3funText")[0];
    var aminText  = container.getElementsByClassName("aminText")[0];
    var amaxText  = container.getElementsByClassName("amaxText")[0];
    var daText    = container.getElementsByClassName("daText")[0];
    var aEButton  = container.getElementsByClassName("aEButton")[0];
    var hfButton  = container.getElementsByClassName("hfButton")[0];
    
    symSelect.selectedIndex = 2;
    
    mdq1Range.max   = 2;
    mdq1Range.min   = 1;
    mdq1Range.step  = 0.01;
    mdq1Range.value = 1;
    mdq2Range.max   = 0.25;
    mdq2Range.min   = -0.25;
    mdq2Range.step  = 0.01;
    mdq2Range.value = 0;
    mdq3Range.max   = 0.25;
    mdq3Range.min   = -0.25;
    mdq3Range.step  = 0.01;
    mdq3Range.value = 0;
    
    var q0 = 1.0;
    var r0 = 5.0;
    
    var qList = [];
    var qavg = 0;
    var Ravg = 0;
    var Ik = [];
    var EArray = [];
    var NArray = [];
    var TSaList = [];
    var TSEList = [];
    
    var pI2 = 0.087891;
    var dI2 = 0.045421;
    var dI4 = 0.029622;
    var fI2 = 0.028140;
    var fI4 = 0.018802;
    var fI6 = 0.013910;
    
    var tsPainter = new Painter(tsCanvas);
    tsPainter.setLabel("\u03B1", "E");
    tsPainter.setMargin(35, 10, 5, 35);
    tsPainter.setTickSize(10);
    tsPainter.setTickLabelSize(16);
    tsPainter.setLabelSize(20);
    tsPainter.setLineOn(false);
    tsPainter.setMarkerOn(true);
    tsPainter.setMarkerSize(1);
    tsPainter.setMarkerType(1);
    tsPainter.setXRange(0, 5);
    tsPainter.refresh();
    
    // Painter3D
    var cfPainter = new Painter3D(cfCanvas);
    if (!cfPainter.gl) {
        cfDiv.innerHTML = "<a href='http://get.webgl.org/'>" +
                          "<img class='cfImg' src='Images/cfImage.png'" +
                          "alt='Your browser does not support WebGL.'" +
                          "title='Your browser does not support WebGL.'" +
                          "width=100% height=100%/></a>";
    } else {
        cfPainter.setBkgdColor(bkgdColor);
        cfPainter.setMatrices([0.0,0.0,-38.0], [-1.2,0.0,-Math.PI*3/4]);
        
        // Setup axis
        cfPainter.setupAxis(14, 0.75);
        cfPainter.setAxisOn(true);
        
        // Setup grid
        cfPainter.setupGrid(1, 12, gridColor);
        cfPainter.setGridOn(false);
        
        // Resize mesh
        var mm = [];
        for (var i=0; i<=24; i++) {
            mm[i] = (i-12)/2;
        }
        cfPainter.setupMesh(mm, mm, 0, true);
        
        cfPainter.setupLight([0.0,1.0,2.0], [0.5,0.5,0.5], [0.6,0.6,0.6], [0.8,0.8,0.8], 100.0);
        cfPainter.setLightOn(true);
        cfPainter.refresh();
    }
    
    // Add even listeners
    symSelect.addEventListener("change", symChangeHandler, false);
    q0Text.addEventListener("change", q0r0ChangeHandler, false);
    r0Text.addEventListener("change", q0r0ChangeHandler, false);
    mdq1Range.addEventListener("change", mdChangeHandler, false);
    mdq2Range.addEventListener("change", mdChangeHandler, false);
    mdq3Range.addEventListener("change", mdChangeHandler, false);
    AQButton.addEventListener("click", AQClickHandler, false);
    DQButton.addEventListener("click", DQClickHandler, false);
    STButton.addEventListener("click", STClickHandler, false);
    CEButton.addEventListener("click", CEClickHandler, false);
    I2Text.addEventListener("change", IkChangeHandler, false);
    I4Text.addEventListener("change", IkChangeHandler, false);
    I6Text.addEventListener("change", IkChangeHandler, false);
    funSelect.addEventListener("change", funSelectChangeHandler, false);
    aEButton.addEventListener("click", aEClickHandler, false);
    hfButton.addEventListener("click", hfClickHandler, false);
    
    // Web Workers
    var worker1 = null;
    var worker2 = null;
    var worker3 = null;
    try {
        worker1 = new Worker("JS/work1.js");
        worker2 = new Worker("JS/work2.js");
        worker3 = new Worker("JS/work3.js");
        worker1.addEventListener("message", worker1CallBackHandler, false);
        worker2.addEventListener("message", worker2CallBackHandler, false);
        worker3.addEventListener("message", worker3CallBackHandler, false);
    } catch(err) {
        console.log("Failed to create web worker. If you are running this page locally with chrome, open with flag:\n google-chrome --allow-file-access-from-files");
    }
    
    // Event handlers (SCF)
    // Default electron configuration
    function aufChangeHandler() {
        if (aufSelect.selectedIndex==0) {
            elemCfgText.value = elem.cfg;
        } else {
            elemCfgText.value = elem.cfgAuf;
        }
        cfgChangeHandler();
    }
    
    // Read electron configuration
    function cfgChangeHandler() {
        elemSymbSpan.innerHTML = elem.symb;
        
        try {
            scfSolver.parseCfg(elemCfgText.value);
        } catch (err) {
            alert(err);
            fullButton.disabled = "disabled";
            stepButton.disabled = "disabled";
            return -1;
        }
        fullButton.disabled = "";
        stepButton.disabled = "";
        
        // Update open shell
        var openshell = scfSolver.cfgList[scfSolver.cfgList.length-1];
        var event = document.createEvent("HTMLEvents");
        event.initEvent("click", true, false);
        shells[openshell.l].dispatchEvent(event);
        neRange.value = openshell.occ;
        neChangeHandler();
        
        // Total number of electrons
        totNe = scfSolver.Ne;
        // Highlight if is ion
        if (totNe < Z) {
            elemIonSup.innerHTML = Z-totNe==1 ? "+" : (Z-totNe)+"+";
        } else if (totNe > Z) {
            elemIonSup.innerHTML = totNe-Z==1 ? "&#8722;" : (totNe-Z)+"&#8722;";
        } else {
            elemIonSup.innerHTML = "";
        }
        
        currentCfg = elemCfgText.value;
        scfSolver.cnvg = Infinity;
    }
    
    // Change xcMethod
    function xcChangeHandler() {
        scfSolver.xcMethod = xcSelect.selectedIndex;
        scfSolver.cnvg = Infinity;
    }
    
    // Change convergence digits
    function digChangeHandler() {
        dig = parseFloat(digSelect.value);
        tol = Math.pow(10, -dig);
    }
    
    // Change report digits
    function rdigChangeHandler() {
        rdig = parseFloat(rdigSelect.value);
    }
    
    // Mouse over element
    function elemEnterHandler() {
        this.setAttribute("style", "cursor:pointer;");
        this.getElementsByClassName("rect")[0].setAttribute("style",
        "fill:"+myPTable.fillColor[this.l]+"; stroke:"+myPTable.strokeColor[this.l]+
        "; stroke-width:"+myPTable.strokeWidth+"; opacity:1.0;");
        
        // Element display
        elemNumDiv.innerHTML    = this.Z;
        elemSymbSpan.innerHTML  = this.symb;
        elemNameDiv.innerHTML   = this.name;
        elemWeightDiv.innerHTML = this.weight;
        if (aufSelect.selectedIndex==0) {
            elemCfgText.value = this.cfg;
        } else {
            elemCfgText.value = this.cfgAuf;
        }
        
        if (this!=elem) {
            if (this.l==0) {
                elemDispDiv.setAttribute("style", "background-color: rgba(102,153,255,0.5); border: 1px solid #336699;");
                elemCfgText.setAttribute("style", "background-color: rgba(102,153,255,0.0);");
            } else if (this.l==1) {
                elemDispDiv.setAttribute("style", "background-color: rgba(255,204,0,0.5); border: 1px solid #cc9900;");
                elemCfgText.setAttribute("style", "background-color: rgba(255,204,0,0.0);");
            } else if (this.l==2) {
                elemDispDiv.setAttribute("style", "background-color: rgba(255,153,153,0.5); border: 1px solid #cc6666;");
                elemCfgText.setAttribute("style", "background-color: rgba(255,153,153,0.0);");
            } else if (this.l==3) {
                elemDispDiv.setAttribute("style", "background-color: rgba(0,204,51,0.5); border: 1px solid #009900;");
                elemCfgText.setAttribute("style", "background-color: rgba(0,204,51,0.0);");
            }
        }
        elemIonSup.innerHTML = "";
    }
    
    // Mouse leave element
    function elemLeaveHandler() {
        if (this!=elem) {
            this.setAttribute("style", "cursor:default;");
            this.getElementsByClassName("rect")[0].setAttribute("style",
            "fill:"+myPTable.fillColor[this.l]+"; stroke:"+myPTable.strokeColor[this.l]+
            "; stroke-width:"+myPTable.strokeWidth+"; opacity:0.5;");
        }
        
        // Element display
        elemNumDiv.innerHTML    = elem.Z;
        elemSymbSpan.innerHTML  = elem.symb;
        elemNameDiv.innerHTML   = elem.name;
        elemWeightDiv.innerHTML = elem.weight;
        elemCfgText.value = currentCfg;
        
        if (elem.l==0) {
            elemDispDiv.setAttribute("style", "background-color: #6699ff; border: 1px solid #336699;");
            elemCfgText.setAttribute("style", "background-color: #6699ff;");
        } else if (elem.l==1) {
            elemDispDiv.setAttribute("style", "background-color: #ffcc00; border: 1px solid #cc9900;");
            elemCfgText.setAttribute("style", "background-color: #ffcc00;");
        } else if (elem.l==2) {
            elemDispDiv.setAttribute("style", "background-color: #ff9999; border: 1px solid #cc6666;");
            elemCfgText.setAttribute("style", "background-color: #ff9999;");
        } else if (elem.l==3) {
            elemDispDiv.setAttribute("style", "background-color: #00cc33; border: 1px solid #009900;");
            elemCfgText.setAttribute("style", "background-color: #00cc33;");
        }
        
        // Highlight if is ion
        if (totNe < Z) {
            elemIonSup.innerHTML = Z-totNe==1 ? "+" : (Z-totNe)+"+";
        } else if (totNe > Z) {
            elemIonSup.innerHTML = totNe-Z==1 ? "&#8722;" : (totNe-Z)+"&#8722;";
        }
    }
    
    // Click on periodic table
    function elemClickHandler() {
        // Prevent click while computing
        if (stepButton.disabled) {  
            return 0;
        }
        
        // Clear textarea
        iterText.value = "";
        
        if (elem) {
            elem.getElementsByClassName("rect")[0].setAttribute("style",
            "fill:"+myPTable.fillColor[elem.l]+"; stroke:"+myPTable.strokeColor[elem.l]+
            "; stroke-width:"+myPTable.strokeWidth+"; opacity:0.5;");
        }
        elem = this;
        elem.getElementsByClassName("rect")[0].setAttribute("style",
        "fill:"+myPTable.fillColor[elem.l]+"; stroke:"+myPTable.strokeColor[elem.l]+
        "; stroke-width:"+myPTable.strokeWidth+"; opacity:1.0;");
        
        // Get Z value
        Z = elem.Z;
        
        // Get electron configuration
        if (aufSelect.selectedIndex==0) {
            elemCfgText.value = elem.cfg;
        } else {
            elemCfgText.value = elem.cfgAuf;
        }
        
        // Re-setup
        scfSolver = new SCFSolver(Z, rMinZ/Z, rMax, dx, elemCfgText.value, xcSelect.selectedIndex);
        orbList = scfSolver.orbList;
        r    = scfSolver.G.r;
        rho  = scfSolver.rho;
        Zeff = scfSolver.Zeff;
        V = new Float64Array(r.length); // Duplicate old value
        for (var i=0; i<r.length; i++) {
            V[i] = scfSolver.G.V[i];
        }
        cfgChangeHandler();
        
        // Element display
        elemNumDiv.innerHTML    = elem.Z;
        elemSymbSpan.innerHTML  = elem.symb;
        elemNameDiv.innerHTML   = elem.name;
        elemWeightDiv.innerHTML = elem.weight;
        if (aufSelect.selectedIndex==0) {
            elemCfgText.value = elem.cfg;
        } else {
            elemCfgText.value = elem.cfgAuf;
        }
        
        if (elem.l==0) {
            elemDispDiv.setAttribute("style", "background-color: #6699ff; border: 1px solid #336699;");
            elemCfgText.setAttribute("style", "background-color: #6699ff;");
        } else if (elem.l==1) {
            elemDispDiv.setAttribute("style", "background-color: #ffcc00; border: 1px solid #cc9900;");
            elemCfgText.setAttribute("style", "background-color: #ffcc00;");
        } else if (elem.l==2) {
            elemDispDiv.setAttribute("style", "background-color: #ff9999; border: 1px solid #cc6666;");
            elemCfgText.setAttribute("style", "background-color: #ff9999;");
        } else if (elem.l==3) {
            elemDispDiv.setAttribute("style", "background-color: #00cc33; border: 1px solid #009900;");
            elemCfgText.setAttribute("style", "background-color: #00cc33;");
        }
        
        fullButton.disabled  = "";
        stepButton.disabled  = "";
        stopButton.disabled  = "disabled";
        elemCfgText.disabled = "";
        xcSelect.disabled    = "";
        prgsBar.value = 0;
        
        if (!!glPainter.gl) {
            glPainter.clearObjectList();
            glPainter.refresh();
        }
        densRange.disabled = "disabled";
        nlSelect.options.length = 0;
        mSelect.options.length = 0;
        
        rptPre.innerHTML = "";
        
        visButton.disabled = "disabled";
        rptButton.disabled = "disabled";
                
        // Reset x range
        RPainter.setXRange(0, 3.5*lengthUnit);
        rhoPainter.setXRange(0, 3.5*lengthUnit);
        ZeffPainter.setXRange(0, 3.5*lengthUnit);
        
        // Reset y range
        RPainter.setYRange((-1.05*0.5*Z*Z)*energyUnit, (0.05*0.5*Z*Z)*energyUnit);
        if (rhoSelect.selectedIndex == 1) {
            rhoPainter.setYRange(-5, 1.25*Math.log(Z));
        } else {
            rhoPainter.setYRange(0, 0.15*Z);
        }
        if (ZeffSelect.selectedIndex == 1) {
            ZeffPainter.setYRange(-2, Math.log(Z)/Math.log(10));
        } else {
            ZeffPainter.setYRange(0, Z);
        }
        
        plotAll();
        
        setupCrystal();
        clearTS();
    }
    // Initial click
    var event = document.createEvent("HTMLEvents");
    event.initEvent("click", true, false);
    elemList[1].dispatchEvent(event);
    
    // Click full button
    function fullClickHandler() {       
        if (scfSolver.cnvg*energyUnit <= tol) {
            iterText.value += "Solution converged to " + dig + " digits!\n";
            iterText.scrollTop = iterText.scrollHeight;
            return 0;
        }
        
        stopButton.disabled = "";
        stepClickHandler(true);
    }
    
    // Click step button
    function stepClickHandler(repeat) {
        // Freeze button
        fullButton.disabled  = "disabled";
        stepButton.disabled  = "disabled";
        visButton.disabled   = "disabled";
        rptButton.disabled   = "disabled";
        elemCfgText.disabled = "disabled";
        xcSelect.disabled    = "disabled";
        
        if (stopFlag) {
            fullButton.disabled  = "";
            stepButton.disabled  = "";
            stopButton.disabled  = "disabled";
            visButton.disabled   = "";
            rptButton.disabled   = "";
            elemCfgText.disabled = "";
            xcSelect.disabled    = "";
            stopFlag = false;
            return;
        }
        
        scfSolver.step(prgsBar, updateSCF);
        
        function updateSCF() {
            orbList = scfSolver.orbList;
            rho  = scfSolver.rho;
            Zeff = scfSolver.Zeff;
            plotAll();
            // Update V after plot
            for (var i=0; i<r.length; i++) {
                V[i] = scfSolver.G.V[i];
            }
            
            Ekin = scfSolver.Ekin;
            Eee  = scfSolver.Eee;
            Een  = scfSolver.Een;
            Exc  = scfSolver.Exc;
            Etot = scfSolver.Etot;
            
            // Update dialog
            var iter = scfSolver.iter;
            var cnvg = scfSolver.cnvg*energyUnit;
            iterText.value += "iter = " + (iter<10?"0"+iter:iter)
                            + ", converge = " + cnvg.toFixed(dig) + "\n";
            iterText.scrollTop = iterText.scrollHeight;
            
            // Clear progress bar
            prgsBar.value = 0;
            
            // Update MTP inputs and Crystal inputs
            var orb0 = orbList[orbList.length-1];
            var u0 = orb0.u;
            if (orb0.l==l) {
                switch (l) {
                case 0:
                    sF0 = scfSolver.Slater(0, u0, u0, u0, u0);
                    F0Text.value = (sF0*energyUnit).toFixed(6);
                    SOText.value = "";
                    break;
                case 1:
                    pF0 = scfSolver.Slater(0, u0, u0, u0, u0);
                    pF2 = scfSolver.Slater(2, u0, u0, u0, u0);
                    pSO = scfSolver.SO(u0);
                    pI2 = scfSolver.Ik(qavg, Ravg, 2, u0, u0);
                    F0Text.value = (pF0*energyUnit).toFixed(6);
                    F2Text.value = (pF2*energyUnit).toFixed(6);
                    SOText.value = (pSO*energyUnit).toFixed(6);
                    I2Text.value = (pI2*energyUnit).toFixed(6);
                    break;
                case 2:
                    dF0 = scfSolver.Slater(0, u0, u0, u0, u0);
                    dF2 = scfSolver.Slater(2, u0, u0, u0, u0);
                    dF4 = scfSolver.Slater(4, u0, u0, u0, u0);
                    dSO = scfSolver.SO(u0);
                    dI2 = scfSolver.Ik(qavg, Ravg, 2, u0, u0);
                    dI4 = scfSolver.Ik(qavg, Ravg, 4, u0, u0);
                    F0Text.value = (dF0*energyUnit).toFixed(6);
                    F2Text.value = (dF2*energyUnit).toFixed(6);
                    F4Text.value = (dF4*energyUnit).toFixed(6);
                    SOText.value = (dSO*energyUnit).toFixed(6);
                    I2Text.value = (dI2*energyUnit).toFixed(6);
                    I4Text.value = (dI4*energyUnit).toFixed(6);
                    break;
                case 3:
                    fF0 = scfSolver.Slater(0, u0, u0, u0, u0);
                    fF2 = scfSolver.Slater(2, u0, u0, u0, u0);
                    fF4 = scfSolver.Slater(4, u0, u0, u0, u0);
                    fF6 = scfSolver.Slater(6, u0, u0, u0, u0);
                    fSO = scfSolver.SO(u0);
                    fI2 = scfSolver.Ik(qavg, Ravg, 2, u0, u0);
                    fI4 = scfSolver.Ik(qavg, Ravg, 4, u0, u0);
                    fI6 = scfSolver.Ik(qavg, Ravg, 6, u0, u0);
                    F0Text.value = (fF0*energyUnit).toFixed(6);
                    F2Text.value = (fF2*energyUnit).toFixed(6);
                    F4Text.value = (fF4*energyUnit).toFixed(6);
                    F6Text.value = (fF6*energyUnit).toFixed(6);
                    SOText.value = (fSO*energyUnit).toFixed(6);
                    I2Text.value = (fI2*energyUnit).toFixed(6);
                    I4Text.value = (fI4*energyUnit).toFixed(6);
                    I6Text.value = (fI6*energyUnit).toFixed(6);
                    break;
                default:
                    break;
                }
                FkSOChangeHandler();
                IkChangeHandler();
            }
            
            // Check convergence
            if (repeat == true) {
                if (cnvg <= tol) {
                    iterText.value += "Solution converged to " + dig + " digits!\n";
                    iterText.scrollTop = iterText.scrollHeight;
                    repeat = false;
                    
                    /*
                    umax = 0;
                    imax = 0;
                    for (var i=0; i<scfSolver.n; i++) {
                        ui = Math.abs(u0[i]);
                        if (ui>umax) {
                            umax = ui;
                            imax = i;
                        }
                    }
                    console.log(scfSolver.r[imax].toFixed(5));
                    */
                }
            }
            
            if (repeat == true) {
                stepClickHandler(true);
            } else {
                fullButton.disabled  = "";
                stepButton.disabled  = "";
                stopButton.disabled  = "disabled";
                visButton.disabled   = "";
                rptButton.disabled   = "";
                elemCfgText.disabled = "";
                xcSelect.disabled    = "";
            }
            
            /*
            // Compare numerical to exact
            var EH  = [-0.233471];
            var EC  = [-9.947718, -0.500866, -0.199186];
            var EFe = [-254.225505, -29.564860, -25.551766, -3.360621, -2.187523, -0.197978, -0.295049];
            var EAg = [-900.324578, -129.859807, -120.913351, -23.678437, -20.067630, -3.223090,
                       -13.367803, -2.086602, -0.157407, -0.298706];
            var EU  = [-3689.355141, -639.778728, -619.108550, -161.118073, -150.978980, -40.528084,
                       -131.977358, -35.853321, -8.824089, -27.123212, -7.018092, -1.325976,
                       -15.027460, -3.866175, -0.822538, -0.130948, -0.366543, -0.143190];
            var checkString = "\n";
            for (var i=0; i<orbList.length; i++) {
                var orb = orbList[i];
                var pn = orb.n;
                var l = orb.l;
                var occ = orb.occ;
                Enum = orb.E*energyUnit;
                Eexa = -0.5*Z*Z/(pn*pn)*energyUnit;
                //Eexa = EAg[i];
                checkString += "    &  $" + pn + spdList[l] + "^" + occ + "$  &  " +
                               Enum.toFixed(6) + "  &  " +
                               Eexa.toFixed(6) + "  &  " +
                               Math.abs(Enum.toFixed(6)-Eexa.toFixed(6)).toFixed(6) + "  &  " +
                               Math.abs((Enum.toFixed(6)-Eexa.toFixed(6))/Eexa.toFixed(6)).toFixed(6) + " \\\\ \n";
            }
            console.log(checkString);
            */
        }
    }
    
    function stopClickHandler() {
        stopFlag = true;
    }
    
    // Toggle R(r) and r(r) plots
    function RuToggleHandler(evt) {
        plot1();
    }
    
    // Toggle log(rho) and rho*r*r plots
    function rhoToggleHandler() {
        if (rhoSelect.selectedIndex == 0) {
            rhoPainter.setYRange(0, 0.15*Z);
        } else {
            rhoPainter.setYRange(-5, 1.25*Math.log(Z));
        }
        plot2();
    }
    
    // Toggle Zeff and log(Zeff) plots
    function ZeffToggleHandler() {
        if (ZeffSelect.selectedIndex == 0) {
            ZeffPainter.setYRange(0, Z);
        } else {
            ZeffPainter.setYRange(-2, Math.log(Z)/Math.log(10));
        }
        plot3();
    }
    
    function unitChangeHandler() {
        var lengthScale = 1;
        if (lengthSelect.selectedIndex == 0) {
            // Bohr radius
            lengthScale = 1/lengthUnit;
            lengthUnit = 1;
        } else {
            // angstrom
            lengthScale = 0.529/lengthUnit;
            lengthUnit = 0.529;
        }
        var energyScale = 1;
        if (energySelect.selectedIndex == 0) {
            // Hartree
            energyScale = 1/energyUnit;
            energyUnit = 1;
        } else if (energySelect.selectedIndex == 1) {
            // Rydberg
            energyScale = 2/energyUnit;
            energyUnit = 2;
        } else {
            // eV
            energyScale = 27.211385/energyUnit;
            energyUnit = 27.211385;
        }
        
        var RxMin = RPainter.xMin;
        var RxMax = RPainter.xMax;
        var RyMin = RPainter.yMin;
        var RyMax = RPainter.yMax;
        var rhoxMin = rhoPainter.xMin;
        var rhoxMax = rhoPainter.xMax;
        var rhoyMin = rhoPainter.yMin;
        var rhoyMax = rhoPainter.yMax;
        var ZeffxMin = ZeffPainter.xMin;
        var ZeffxMax = ZeffPainter.xMax;
        var ZeffyMin = ZeffPainter.yMin;
        var ZeffyMax = ZeffPainter.yMax;
        var TSxMin = tsPainter.xMin;
        var TSxMax = tsPainter.xMax;
        var TSyMin = tsPainter.yMin;
        var TSyMax = tsPainter.yMax;
        
        // Reset x range for double click reset
        RPainter.setXRange(0, 3.5*lengthUnit);
        rhoPainter.setXRange(0, 3.5*lengthUnit);
        ZeffPainter.setXRange(0, 3.5*lengthUnit);
        
        // Reset y range for double click reset
        RPainter.setYRange((-1.05*0.5*Z*Z)*energyUnit, (0.05*0.5*Z*Z)*energyUnit);
        if (rhoSelect.selectedIndex == 0) {
            rhoPainter.setYRange(0, 0.15*Z);
        } else {
            rhoPainter.setYRange(-5, 1.25*Math.log(Z));
        }
        if (ZeffSelect.selectedIndex == 0) {
            ZeffPainter.setYRange(0, Z);
        } else {
            ZeffPainter.setYRange(-2, Math.log(Z)/Math.log(10));
        }
        
        rangeTS();
        
        RPainter.refreshFlag = true;
        rhoPainter.refreshFlag = true;
        ZeffPainter.refreshFlag = true;
        tsPainter.refreshFlag = true;
        
        // Reset x range
        RPainter.setXRange(RxMin*lengthScale, RxMax*lengthScale);
        rhoPainter.setXRange(rhoxMin*lengthScale, rhoxMax*lengthScale);
        ZeffPainter.setXRange(ZeffxMin*lengthScale, ZeffxMax*lengthScale);
        tsPainter.setXRange(TSxMin, TSxMax);
        
        // Reset y range
        RPainter.setYRange(RyMin*energyScale, RyMax*energyScale);
        rhoPainter.setYRange(rhoyMin, rhoyMax);
        ZeffPainter.setYRange(ZeffyMin, ZeffyMax);
        tsPainter.setYRange(TSyMin*energyScale, TSyMax*energyScale);
        
        RPainter.refreshFlag = false;
        rhoPainter.refreshFlag = false;
        ZeffPainter.refreshFlag = false;
        tsPainter.refreshFlag = false;
        
        plotAll();
        
        // Re-tabulate
        tabulateEN();
        
        // Re-plot TS diagram
        plotTS();
        
        // Re-write text inputs
        switch (l) {
        case 0:
            F0Text.value = (sF0*energyUnit).toFixed(6);
            SOText.value = "";
            break;
        case 1:
            F0Text.value = (pF0*energyUnit).toFixed(6);
            F2Text.value = (pF2*energyUnit).toFixed(6);
            SOText.value = (pSO*energyUnit).toFixed(6);
            I2Text.value = (pI2*energyUnit).toFixed(6);
            break;
        case 2:
            F0Text.value = (dF0*energyUnit).toFixed(6);
            F2Text.value = (dF2*energyUnit).toFixed(6);
            F4Text.value = (dF4*energyUnit).toFixed(6);
            SOText.value = (dSO*energyUnit).toFixed(6);
            I2Text.value = (dI2*energyUnit).toFixed(6);
            I4Text.value = (dI4*energyUnit).toFixed(6);
            break;
        case 3:
            F0Text.value = (fF0*energyUnit).toFixed(6);
            F2Text.value = (fF2*energyUnit).toFixed(6);
            F4Text.value = (fF4*energyUnit).toFixed(6);
            F6Text.value = (fF6*energyUnit).toFixed(6);
            SOText.value = (fSO*energyUnit).toFixed(6);
            I2Text.value = (fI2*energyUnit).toFixed(6);
            I4Text.value = (fI4*energyUnit).toFixed(6);
            I6Text.value = (fI6*energyUnit).toFixed(6);
            break;
        default:
            break;
        }
        
        // Re-plot spectrum
        if (!!myMTP) {
            plotSpectrum();
        }
    }
    
    // Generate report
    function rptClickHandler() {
        var rptText = "";
        for (var i=0; i<80; i++) {
            rptText += "-";
        }
        
        // Basic information
        rptText += "\n";
        rptText += "Element:       " + elem.symb + " (Z=" + Z + ")\n";
        rptText += "Oxidation:     " + (Z-totNe==0?"neutral":Z-totNe) + "\n";
        rptText += "Configuration: " + elemCfgText.value + "\n";
        rptText += "Exch-correl:   " + xcSelect.options[xcSelect.selectedIndex].value + "\n";
        rptText += "Length unit:   " + lengthSelect.options[lengthSelect.selectedIndex].value + "\n";
        rptText += "Energy unit:   " + energySelect.options[energySelect.selectedIndex].value + "\n";
        for (var i=0; i<80; i++) {
            rptText += "-";
        }
        rptText += "\n";
        
        // Total energy
        // Figure out display length
        var Tdig = 6;
        var dlen = 4;
        dlen = (Etot*energyUnit).toFixed(rdig).length;
        if (dlen>Tdig) {
            Tdig = dlen;
        }
        dlen = (Ekin*energyUnit).toFixed(rdig).length;
        if (dlen>Tdig) {
            Tdig = dlen;
        }
        dlen = (Eee*energyUnit).toFixed(rdig).length;
        if (dlen>Tdig) {
            Tdig = dlen;
        }
        dlen = (Een*energyUnit).toFixed(rdig).length;
        if (dlen>Tdig) {
            Tdig = dlen;
        }
        dlen = (Exc*energyUnit).toFixed(rdig).length;
        if (dlen>Tdig) {
            Tdig = dlen;
        }
        
        // Tabulate
        rptText += "Convergence: " + (scfSolver.cnvg*energyUnit).toExponential(rdig) + "\n";
        rptText += "Etot: " + pad((Etot*energyUnit).toFixed(rdig), Tdig) + "\n";
        rptText += "Ekin: " + pad((Ekin*energyUnit).toFixed(rdig), Tdig) + "\n";
        rptText += "Ee-e: " + pad((Eee*energyUnit).toFixed(rdig), Tdig) + "\n";
        rptText += "Ee-n: " + pad((Een*energyUnit).toFixed(rdig), Tdig) + "\n";
        rptText += "Exc:  " + pad((Exc*energyUnit).toFixed(rdig), Tdig) + "\n";
        for (var i=0; i<80; i++) {
            rptText += "-";
        }
        rptText += "\n";
        
        // Orbitals
        // Create data list
        var dataList = [];
        for (var i=0; i<orbList.length; i++) {
            var orb = orbList[i];
            var row = {};
            row.n  = orb.n;
            row.l  = orb.l;
            row.E  = orb.E*energyUnit;
            row.r1 = scfSolver.rk(1, orb.u)*lengthUnit;
            row.r2 = scfSolver.rk(2, orb.u)*lengthUnit;
            row.F0 = orb.l>=0 ? scfSolver.Slater(0, orb.u, orb.u, orb.u, orb.u)*energyUnit : 0;
            row.F2 = orb.l>=1 ? scfSolver.Slater(2, orb.u, orb.u, orb.u, orb.u)*energyUnit : 0;
            row.F4 = orb.l>=2 ? scfSolver.Slater(4, orb.u, orb.u, orb.u, orb.u)*energyUnit : 0;
            row.F6 = orb.l>=3 ? scfSolver.Slater(6, orb.u, orb.u, orb.u, orb.u)*energyUnit : 0;
            row.SO = orb.l>=1 ? scfSolver.SO(orb.u)*energyUnit : 0;
            
            dataList.push(row);
        }
        
        // Sort data list
        if (ordSelect.selectedIndex==0) {
            // Sort n
            for (var i=0; i<dataList.length-1; i++) {
                for (var j=0; j<dataList.length-1-i; j++) {
                    var row1 = dataList[j];
                    var row2 = dataList[j+1];
                    if (row1.n>row2.n || (row1.n==row2.n&&row1.l>row2.l)) {
                        dataList[j]   = row2;
                        dataList[j+1] = row1;
                    }
                }
            }
        } else if (ordSelect.selectedIndex==1) {
            // Sort l
            for (var i=0; i<dataList.length-1; i++) {
                for (var j=0; j<dataList.length-1-i; j++) {
                    var row1 = dataList[j];
                    var row2 = dataList[j+1];
                    if (row1.l>row2.l || (row1.l==row2.l&&row1.n>row2.n)) {
                        dataList[j]   = row2;
                        dataList[j+1] = row1;
                    }
                }
            }
        } else if (ordSelect.selectedIndex==2) {
            // Sort E
            for (var i=0; i<dataList.length-1; i++) {
                for (var j=0; j<dataList.length-1-i; j++) {
                    var row1 = dataList[j];
                    var row2 = dataList[j+1];
                    if (row1.E>row2.E) {
                        dataList[j]   = row2;
                        dataList[j+1] = row1;
                    }
                }
            }
        }
        
        // Figure out display length
        var Edig = 6, r1dig = 6, r2dig = 6;
        var F0dig = 6, F2dig = 6, F4dig = 6, F6dig = 6;
        var SOdig = 6;
        for (var i=0; i<dataList.length; i++) {
            var row = dataList[i];
            dlen = (row.E).toFixed(rdig).length;
            if (dlen>Edig) {
                Edig = dlen;
            }
            dlen = (row.r1).toFixed(rdig).length;
            if (dlen>r1dig) {
                r1dig = dlen;
            }
            dlen = (row.r2).toFixed(rdig).length;
            if (dlen>r2dig) {
                r2dig = dlen;
            }
            dlen = (row.F0).toFixed(rdig).length;
            if (dlen>F0dig) {
                F0dig = dlen;
            }
            dlen = (row.F2).toFixed(rdig).length;
            if (dlen>F2dig) {
                F2dig = dlen;
            }
            dlen = (row.F4).toFixed(rdig).length;
            if (dlen>F4dig) {
                F4dig = dlen;
            }
            dlen = (row.F6).toFixed(rdig).length;
            if (dlen>F6dig) {
                F6dig = dlen;
            }
            dlen = (row.SO).toFixed(rdig).length;
            if (dlen>SOdig) {
                SOdig = dlen;
            }
        }
        
        // Tabulate
        rptText += pad("E", 4+Edig) + pad("<r>", 2+r1dig).replace("<r>", "&lt;r&gt;")
                 + pad("<r2>", 2+r2dig).replace("<r2>", "&lt;r<sup>2</sup>&gt;")
                 + pad("F0", 2+F0dig) + pad("F2", 2+F2dig)
                 + pad("F4", 2+F4dig)  + pad("F6", 2+F6dig)  + pad("SO", 2+SOdig) + "\n";
        for (var i=0; i<dataList.length; i++) {
            var row = ascSelect.selectedIndex==0 ? dataList[i] : dataList[dataList.length-1-i];
            rptText += row.n + spdList[row.l];
            rptText += pad((row.E).toFixed(rdig), 2+Edig);
            rptText += pad((row.r1).toFixed(rdig), 2+r1dig);
            rptText += pad((row.r2).toFixed(rdig), 2+r2dig);
            rptText += row.l>=0 ? pad((row.F0).toFixed(rdig), 2+F0dig)
                                : pad("", 2+F0dig);
            rptText += row.l>=1 ? pad((row.F2).toFixed(rdig), 2+F2dig)
                                : pad("", 2+F2dig);
            rptText += row.l>=2 ? pad((row.F4).toFixed(rdig), 2+F4dig)
                                : pad("", 2+F4dig);
            rptText += row.l>=3 ? pad((row.F6).toFixed(rdig), 2+F6dig)
                                : pad("", 2+F6dig);
            rptText += row.l>=1 ? pad((row.SO).toFixed(rdig), 2+SOdig)
                                : pad("", 2+SOdig);
            rptText += "\n";
        }
        for (var i=0; i<80; i++) {
            rptText += "-";
        }
        rptText += "\n";
        
        rptPre.innerHTML = rptText;
    }
    
    // Visualize JSON data
    function visualClickHandler() {
        // Update nlSelect
        nlSelect.length = 0;
        for (var i=0; i<orbList.length; i++) {
            var option = document.createElement("option");
            var lStr = spdList[orbList[i].l];
            option.text = orbList[i].n + lStr;
            nlSelect.add(option, null);
        }
        nlSelect.selectedIndex = orbList.length-1;
        
        // Invoke nlChangeHandler
        nlChangeHandler();
    }
    
    // On nlSelect change
    function nlChangeHandler() {
        var nlIdx = nlSelect.selectedIndex;
        var l = orbList[nlIdx].l;
        
        // Update mSelect
        mSelect.length = 0;
        for (var m=-l; m<=l; m++) {
            var option = document.createElement("option");
            option.text = "m=" + m;
            mSelect.add(option, null);
        }
        // Append real harmonics options
        if (l == 0) {
            var option = document.createElement("option");
            option.text = "s";
            mSelect.add(option, null);
        } else if (l == 1) {
            var option = document.createElement("option");
            option.text = "p_z";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "p_x";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "p_y";
            mSelect.add(option, null);
        } else if (l == 2) {
            var option = document.createElement("option");
            option.text = "d_3zz-1";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "d_xz";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "d_yz";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "d_xx-yy";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "d_xy";
            mSelect.add(option, null);
        } else if (l == 3) {
            var option = document.createElement("option");
            option.text = "f_z(5zz-3)";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "f_x(5zz-1)";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "f_y(5zz-1)";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "f_z(xx-yy)";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "f_xyz";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "f_x(xx-3yy)";
            mSelect.add(option, null);
            var option = document.createElement("option");
            option.text = "f_y(3xx-yy)";
            mSelect.add(option, null);
        }
        mSelect.selectedIndex = 2*l+1<mSelect.length ? 2*l+1 : l;
        
        // Invoke mChangeHandler
        mChangeHandler();
    }
    
    // On mSelect change
    function mChangeHandler() {
        var nlIdx = nlSelect.selectedIndex;
        var mIdx  = mSelect.selectedIndex;
        
        var orb = orbList[nlIdx];
        var l = orb.l;
        
        var isReal = false;
        var cc, ll, mm;
        if (mIdx <= 2*l) {
            // Pure harmonics
            isReal = false;
            cc = [new Complex(1,0)]; ll = [orbList[nlIdx].l]; mm = [mIdx - l];
        } else {
            // Real harmonics
            isReal = true;
            
            var sq2inv = 1/Math.sqrt(2.0);
            
            switch (mSelect[mIdx].value) {
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
        
        // Generate density points
        var points = Visualizer.generatePoints(orb, cc, ll, mm, 40000, isReal);
        pointVertices = points.vertices;
        pointNormals  = points.normals;
        pointColors   = points.colors;
        
        // Range bar
        densRange.max = pointVertices.length/3;
        densRange.value = densRange.max/2;
        densRange.disabled = "";
        
        // Setup points
        if (!!glPainter.gl) {
            glPainter.clearObjectList();
            glPainter.setupObject(pointVertices.slice(0, densRange.value*3),
                                  pointNormals.slice(0, densRange.value*3),
                                  pointColors.slice(0, densRange.value*4),
                                  null, 2, true);
            
            // Draw
            glPainter.refresh();
        }
    }
    
    function densChangeHandler() {
        if (!!glPainter.gl) {
            // Setup points
            glPainter.clearObjectList();
            glPainter.setupObject(pointVertices.slice(0, densRange.value*3),
                                  pointNormals.slice(0, densRange.value*3),
                                  pointColors.slice(0, densRange.value*4),
                                  null, 2, true);
            // Draw
            glPainter.refresh();
        }
    }
    
    // Change point size
    function keyDownHandler(evt) {
        if (evt.keyCode == 76) {
            // Toggle light
            if (glPainter.lightOn) {
                glPainter.setPointSize(2.0);
            } else {
                glPainter.setPointSize(1.5);
            }
            glPainter.refresh();
        }
    }
    
    function plot1() {
        RPainter.setHoldOn(false);
        RPainter.plot(scaleL(r), scaleE(V), "rgb(0, 0, 0)");
        RPainter.setHoldOn(true);
        for (var i=0; i<orbList.length; i++) {
            var u = orbList[i].u;
            var R = orbList[i].R;
            var E = orbList[i].E;
            var n = orbList[i].n;
            var l = orbList[i].l;
            var occ = orbList[i].occ;
            RPainter.plotEnergy(E*energyUnit, n+spdList[l]+occ, colorList[l]);
            if (RuSelect.selectedIndex == 0) {
                RPainter.plot(scaleL(r), ROnE(R, 0.1*Z*energyUnit, E*energyUnit), colorList[l]);
            } else {
                RPainter.plot(scaleL(r), ROnE(u, 0.1*Z*energyUnit, E*energyUnit), colorList[l]);
            }
        }
    }
    
    function plot2() {
        if (orbList.length == 0) {
            rhoPainter.plot([0], [0], "rgb(255,255,255)");
        } else {
            if (rhoSelect.selectedIndex == 0) {
                var rhorr = new Float64Array(rho.length);
                for (var i=0; i<rho.length; i++) {
                    rhorr[i] = rho[i]*r[i]*r[i];
                }
                rhoPainter.plot(scaleL(r), rhorr, "rgb(0, 0, 255)");
            } else {
                var log10 = Math.log(10);
                var rholog = new Float64Array(rho.length);
                for (var i=0; i<rho.length; i++) {
                    rholog[i] = Math.log(rho[i])/log10;
                }
                rhoPainter.plot(scaleL(r), rholog, "rgb(0, 0, 255)");
            }
        }
    }
    
    function plot3() {
        if (orbList.length == 0) {
            ZeffPainter.plot([0], [0], "rgb(255,255,255)");
        } else {
            if (ZeffSelect.selectedIndex == 0) {
                ZeffPainter.plot(scaleL(r), Zeff, "rgb(0, 0, 255)");
            } else {
                var log10 = Math.log(10);
                var Zefflog = new Float64Array(Zeff.length);
                for (var i=0; i<Zeff.length; i++) {
                    Zefflog[i] = Math.log(Zeff[i])/log10;
                }
                ZeffPainter.plot(scaleL(r), Zefflog, "rgb(0, 0, 255)");
            }
        }
    }
    
    function plotAll() {
        plot1();
        plot2();
        plot3();
    }
    
    function scaleL(a) {
        var b = new Float64Array(a.length);
        for (var i=0; i<a.length; i++) {
            b[i] = a[i]*lengthUnit;
        }
        return b;
    }
    
    function scaleE(a) {
        var b = new Float64Array(a.length);
        for (var i=0; i<a.length; i++) {
            b[i] = a[i]*energyUnit;
        }
        return b;
    }
    
    function ROnE(R, A, E) {
        var RE = new Float64Array(R.length);
        for(var i=0; i<R.length; i++) {
            RE[i] = A*R[i] + E;
        }
        return RE;
    }
    
    // Event handlers (MTP)
    function shellClickHandler() {
        // Remove selection high light
        if (shell) {
            shell.style.outlineStyle = "none";
        }
        shell = this;
        
        // High light
        shell.style.outlineStyle = "solid";
        shell.style.outlineColor = "#0000FF";
        
        F0Text.disabled = "";
        F2Text.disabled = "";
        F4Text.disabled = "";
        F6Text.disabled = "";
        SOText.disabled = "";
        I2Text.disabled = "";
        I4Text.disabled = "";
        I6Text.disabled = "";
        F0Text.value = "";
        F2Text.value = "";
        F4Text.value = "";
        F6Text.value = "";
        SOText.value = "";
        I2Text.value = "";
        I4Text.value = "";
        I6Text.value = "";
        
        // Get l value
        var thisl = shell.getElementsByClassName("sym")[0].innerHTML;
        switch (thisl) {
        case "s":
            l = 0;
            F0Text.value = (sF0*energyUnit).toFixed(6);
            F2Text.disabled = "disabled";
            F4Text.disabled = "disabled";
            F6Text.disabled = "disabled";
            SOText.disabled = "disabled";
            I2Text.disabled = "disabled";
            I4Text.disabled = "disabled";
            I6Text.disabled = "disabled";
            break;
        case "p":
            l = 1;
            F0Text.value = (pF0*energyUnit).toFixed(6);
            F2Text.value = (pF2*energyUnit).toFixed(6);
            SOText.value = (pSO*energyUnit).toFixed(6);
            I2Text.value = (pI2*energyUnit).toFixed(6);
            F4Text.disabled = "disabled";
            F6Text.disabled = "disabled";
            I4Text.disabled = "disabled";
            I6Text.disabled = "disabled";
            break;
        case "d":
            l = 2;
            F0Text.value = (dF0*energyUnit).toFixed(6);
            F2Text.value = (dF2*energyUnit).toFixed(6);
            F4Text.value = (dF4*energyUnit).toFixed(6);
            SOText.value = (dSO*energyUnit).toFixed(6);
            I2Text.value = (dI2*energyUnit).toFixed(6);
            I4Text.value = (dI4*energyUnit).toFixed(6);
            F6Text.disabled = "disabled";
            I6Text.disabled = "disabled";
            break;
        case "f":
            l = 3;
            F0Text.value = (fF0*energyUnit).toFixed(6);
            F2Text.value = (fF2*energyUnit).toFixed(6);
            F4Text.value = (fF4*energyUnit).toFixed(6);
            F6Text.value = (fF6*energyUnit).toFixed(6);
            SOText.value = (fSO*energyUnit).toFixed(6);
            I2Text.value = (fI2*energyUnit).toFixed(6);
            I4Text.value = (fI4*energyUnit).toFixed(6);
            I6Text.value = (fI6*energyUnit).toFixed(6);
            break;
        default:
            l = 0;
            F0Text.disabled = "disabled";
            F2Text.disabled = "disabled";
            F4Text.disabled = "disabled";
            F6Text.disabled = "disabled";
            SOText.disabled = "disabled";
            I2Text.disabled = "disabled";
            I4Text.disabled = "disabled";
            I6Text.disabled = "disabled";
            break;
        }
        FkSOChangeHandler();
        IkChangeHandler();
        
        neRange.min = 0;
        neRange.max = 4*l+2;
        neRange.value = 2*l+1;
        neChangeHandler();
    }
    
    function FkSOChangeHandler() {
        switch (l) {
        case 0:
            if (isNaN(F0Text.value) || !isFinite(F0Text.value)) {
                alert("Inputs must be numbers!");
                return -1;
            }
            sF0 = parseFloat(F0Text.value)/energyUnit;
            Fk[0] = sF0;
            break;
        case 1:
            if (isNaN(F0Text.value) || !isFinite(F0Text.value) ||
                isNaN(F2Text.value) || !isFinite(F2Text.value) ||
                isNaN(SOText.value) || !isFinite(SOText.value)) {
                alert("Inputs must be numbers!");
                return -1;
            }
            pF0 = parseFloat(F0Text.value)/energyUnit;
            pF2 = parseFloat(F2Text.value)/energyUnit;
            pSO = parseFloat(SOText.value)/energyUnit;
            Fk[0] = pF0;
            Fk[2] = pF2;
            SO    = pSO;
            break;
        case 2:
            if (isNaN(F0Text.value) || !isFinite(F0Text.value) ||
                isNaN(F2Text.value) || !isFinite(F2Text.value) ||
                isNaN(F4Text.value) || !isFinite(F4Text.value) ||
                isNaN(SOText.value) || !isFinite(SOText.value)) {
                alert("Inputs must be numbers!");
                return -1;
            }
            dF0 = parseFloat(F0Text.value)/energyUnit;
            dF2 = parseFloat(F2Text.value)/energyUnit;
            dF4 = parseFloat(F4Text.value)/energyUnit;
            dSO = parseFloat(SOText.value)/energyUnit;
            Fk[0] = dF0;
            Fk[2] = dF2;
            Fk[4] = dF4;
            SO    = dSO;
            break;
        case 3:
            if (isNaN(F0Text.value) || !isFinite(F0Text.value) ||
                isNaN(F2Text.value) || !isFinite(F2Text.value) ||
                isNaN(F4Text.value) || !isFinite(F4Text.value) ||
                isNaN(F6Text.value) || !isFinite(F6Text.value) ||
                isNaN(SOText.value) || !isFinite(SOText.value)) {
                alert("Inputs must be numbers!");
                return -1;
            }
            fF0 = parseFloat(F0Text.value)/energyUnit;
            fF2 = parseFloat(F2Text.value)/energyUnit;
            fF4 = parseFloat(F4Text.value)/energyUnit;
            fF6 = parseFloat(F6Text.value)/energyUnit;
            fSO = parseFloat(SOText.value)/energyUnit;
            Fk[0] = fF0;
            Fk[2] = fF2;
            Fk[4] = fF4;
            Fk[6] = fF6;
            SO    = fSO;
            break;
        default:
            break;
        }
    }
    
    function IkChangeHandler() {
        switch (l) {
        case 1:
            if (isNaN(I2Text.value) || !isFinite(I2Text.value)) {
                alert("Inputs must be numbers!");
                return -1;
            }
            pI2 = parseFloat(I2Text.value)/energyUnit;
            Ik[2] = pI2;
            break;
        case 2:
            if (isNaN(I2Text.value) || !isFinite(I2Text.value) ||
                isNaN(I4Text.value) || !isFinite(I4Text.value)) {
                alert("Inputs must be numbers!");
                return -1;
            }
            dI2 = parseFloat(I2Text.value)/energyUnit;
            dI4 = parseFloat(I4Text.value)/energyUnit;
            Ik[2] = dI2;
            Ik[4] = dI4;
            break;
        case 3:
            if (isNaN(I2Text.value) || !isFinite(I2Text.value) ||
                isNaN(I4Text.value) || !isFinite(I4Text.value) ||
                isNaN(I6Text.value) || !isFinite(I6Text.value)) {
                alert("Inputs must be numbers!");
                return -1;
            }
            fI2 = parseFloat(I2Text.value)/energyUnit;
            fI4 = parseFloat(I4Text.value)/energyUnit;
            fI6 = parseFloat(I6Text.value)/energyUnit;
            Ik[2] = fI2;
            Ik[4] = fI4;
            Ik[6] = fI6;
            break;
        default:
            break;
        }
    }
    
    function neChangeHandler() {
        neSpan.innerHTML = neRange.value;
        
        isElec = ehSelect.selectedIndex==0 ? true : false;
        if (isElec) {
            Ne = parseFloat(neRange.value);
        } else {
            Ne = 4*l+2-parseFloat(neRange.value);
        }
        
        myMTP = null;
        
        mtpSpectrum.Eavg = 0;
        mtpSpectrum.EuList.length = 0;
        mtpSpectrum.EusoList.length = 0;
        mtpSpectrum.EintList.length = 0;
        mtpSpectrum.EintjjList.length = 0;
        mtpSpectrum.EsouList.length = 0;
        mtpSpectrum.EsoList.length = 0;
        mtpSpectrum.colFlag = -1;
        mtpSpectrum.setCfgLabel(lList[l]+Ne);
        mtpSpectrum.refresh();
        
        mtpDiv.innerHTML = "";
        
        var tex = "\\[\n";
        tex += "\\begin{array}{|";
        for (var i=0; i<2*l+1; i++) {
            tex += "c|";
        }
        tex += "}\n\\hline\n";
        for (var i=0; i<2*l+1; i++) {
            tex += i<Ne ? "\\bullet" : "\\phantom{\\bullet}";
            tex += i<2*l ? " & " : " \\\\ \\hline\n";
        }
        for (var i=2*l+1; i<4*l+2; i++) {
            tex += i<Ne ? "\\bullet" : "\\phantom{\\bullet}";
            tex += i<4*l+1 ? " & " : " \\\\ \n";
        }
        tex += "\\hline\n\\end{array}\n";
        tex += "\\]";
        confDiv.innerHTML = tex;
        try {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, confDiv]);
        } catch(err) {
            console.log("MathJax not available.");
        }
        
        // Update cbt
        cbtDiv.innerHTML = spdList[l]+"<sup>"+Ne+"</sup>";
        setupCrystal();
        clearTS();
    }
    
    // Click on Multiplet button
    function MClickHandler() {
        // Start worker thread for Multiplet calculation
        var msg = true;
        if (l==3 && Ne>=4 && Ne<=10) {
            var Nsite = 4*l+2;
            var dim = 1;
            for (var k=1; k<=Ne; k++) {
                dim *= Nsite-k+1;
                dim /= k;
            }
            msg = confirm("This task involves a matrix diagonalization with dimension " + dim + ". " +
                          "This may take a few minutes. Continue?");
        }
        if (msg == true) {
            worker1.postMessage({"l":l, "Ne":Ne, "Fk":Fk, "SO":SO});
            
            // Change input status
            ehSelect.disabled = "disabled";
            neRange.disabled = "disabled";
            MButton.disabled = "disabled";
            MButton.value = "Calculating...";
            MButton.style.color = "#FF0000";
        }
    }
    
    // Worker call back
    function worker1CallBackHandler(evt) {
        var data = evt.data;
        
        myMTP    = data.mtp;
        myEnergy = data.energy;
        myBasis  = myMTP.basis;
        plotSpectrum();
        
        // List out multiplets
        var utList = myMTP.utList;
        mtpDiv.innerHTML = "";
        for (var p=0; p<utList.length; p++) {
            var L = utList[p].L;
            var S = utList[p].S;
            var N = utList[p].N;
            var tex = "\\[";
            tex += N>1 ? "\\stackrel{"+N+"\\times}{" : "";
            tex += "^{"+(2*S+1)+"}"+LList[L];
            tex += N>1 ? "}\\]" : "\\]";
            var itemDiv = document.createElement("div");
            itemDiv.className = "mtpItem";
            itemDiv.innerHTML = tex;
            var idxDiv = document.createElement("div");
            idxDiv.className = "mtpIdx";
            idxDiv.innerHTML = p;
            itemDiv.appendChild(idxDiv);
            var statusDiv = document.createElement("div");
            statusDiv.className = "mtpStatus";
            statusDiv.innerHTML = 0;
            itemDiv.appendChild(statusDiv);
            mtpDiv.appendChild(itemDiv);
            itemDiv.addEventListener("click", mtpClickHandler, false);
        }
        try {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, mtpDiv]);
        } catch(err) {
            console.log("MathJax not available.");
        }
        
        // Change input status
        ehSelect.disabled = "";
        neRange.disabled = "";
        MButton.disabled = "";
        MButton.value = "Multiplet";
        MButton.style.color = "#000000";
    }
    
    function plotSpectrum() {
        var utList = myMTP.utList;
        var Eavg = myEnergy.Eavg;
        var Eu   = myEnergy.Eu;
        var Euso = myEnergy.Euso;
        var Eint = myEnergy.Eint;
        var Ku   = myEnergy.Ku;
        var Kuso = myEnergy.Kuso;
        var Jint = myEnergy.Jint;
        
        var sotList  = myMTP.sotList;
        var soutList = myMTP.soutList;
        var Eso    = myEnergy.Eso;
        var Esou   = myEnergy.Esou;
        var Eintjj = myEnergy.Eintjj;
        var Kso    = myEnergy.Kso;
        var Ksou   = myEnergy.Ksou;
        var Jintjj = myEnergy.Jintjj;
        
        // Plot multiplet energies
        var EuList = [];
        var LuList = [];
        var KuList = [];
        var EusoList = [];
        var LusoList = [];
        var KusoList = [];
        var CusoList = [];
        
        var EintList = [];
        var LintList = [];
        var CintList = [];
        var EintjjList = [];
        var LintjjList = [];
        var CintjjList = [];
        
        var EsouList = [];
        var LsouList = [];
        var KsouList = [];
        var CsouList = [];
        var EsoList  = [];
        var LsoList  = [];
        var KsoList  = [];
        
        for (var p=0; p<utList.length; p++) {
            var L = utList[p].L;
            var S = utList[p].S;
            var N = utList[p].N;
            var Jmin = Math.abs(L-S);
            var Jmax = Math.abs(L+S);
            for (var sn=0; sn<N; sn++) {
                EuList.push(Eu[p][sn]*energyUnit);
                LuList.push((2*S+1)+LList[L]);
                KuList.push(Ku[p][sn]);
                var EusoGroup = [];
                for (var i=0; i<Euso[p][sn].length; i++) {
                    EusoGroup[i] = Euso[p][sn][i]*energyUnit;
                }
                EusoList.push(EusoGroup);
                var label = [];
                var col = [];
                for (var J=Jmax; J>=Jmin; J--) {
                    var Jfrac = float2frac(J);
                    label.push((S*2+1)+LList[L]+"("+Jfrac[0]+(Jfrac[1]==1?"":"/"+Jfrac[1])+")");
                    col.push(color[Math.floor(J)]);
                }
                LusoList.push(label);
                KusoList.push(Kuso[p][sn]);
                CusoList.push(col);
            }
        }
        for (var i=0; i<Eint.length; i++) {
            var Jfrac   = float2frac(Jint[i]);
            var Jfracjj = float2frac(Jintjj[i]);
            EintList[i]   = Eint[i]*energyUnit;
            LintList[i]   = Jfrac[0]+(Jfrac[1]==1?"":"/"+Jfrac[1]);
            CintList[i]   = color[Math.floor(Jint[i])];
            EintjjList[i] = Eintjj[i]*energyUnit;
            LintjjList[i] = Jfracjj[0]+(Jfracjj[1]==1?"":"/"+Jfracjj[1]);
            CintjjList[i] = color[Math.floor(Jintjj[i])];
        }
        for (var p=0; p<sotList.length; p++) {
            var jList = sotList[p].jList;
            var jjL1 = " ";
            for (var i=0; i<jList.length; i++) {
                jjL1 += jList[i]*2 + " ";
            }
            var jjL2 = "(";
            for (var i=0; i<jList.length; i++) {
                jjL2 += "\u2013" + (i!=jList.length-1?",":"");
            }
            jjL2 += ")";
            var jjL3 = " ";
            for (var i=0; i<jList.length; i++) {
                jjL3 += "2 ";
            }
            EsoList.push(Eso[p]*energyUnit);
            LsoList.push({L1:jjL1, L2:jjL2, L3:jjL3});
            KsoList.push(Kso[p]);
            
            var EsouGroup = [];
            var LsouGroup = [];
            var KsouGroup = [];
            var CsouGroup = [];
            for (var pp=0; pp<soutList.length; pp++) {
                if (soutList[pp].jList.toString()==jList.toString()) {
                    var J = soutList[pp].J;
                    var Jfrac = float2frac(J);
                    var L3space = "";
                    if (Jfrac[1]==1) {
                        L3space = Jfrac[0]<10 ? "  " : "    ";
                    } else {
                        L3space = Jfrac[0]<10 ? "     " : "       ";
                    }
                    for (var sn=0; sn<soutList[pp].N; sn++) {
                        EsouGroup.push(Esou[pp][sn]*energyUnit);
                        LsouGroup.push({L1:jjL1, L2:jjL2,
                                        L3:L3space+jjL3+Jfrac[0]
                                        +(Jfrac[1]==1?"":"/"+Jfrac[1])});
                        KsouGroup.push(Ksou[pp][sn]);
                        CsouGroup.push(color[Math.floor(J)]);
                    }
                }
            }
            EsouList.push(EsouGroup);
            LsouList.push(LsouGroup);
            KsouList.push(KsouGroup);
            CsouList.push(CsouGroup);
        }
        mtpSpectrum.plot(Eavg*energyUnit,
                         EuList, LuList, KuList,
                         EusoList, LusoList, KusoList, CusoList,
                         EintList, LintList, CintList,
                         EintjjList, LintjjList, CintjjList,
                         EsouList, LsouList, KsouList, CsouList,
                         EsoList, LsoList, KsoList);
    }
    
    // Click on one Multiplet item
    function mtpClickHandler() {
        var thisDiv = this;
        
        var p = parseFloat(thisDiv.getElementsByClassName("mtpIdx")[0].innerHTML);
        var status = parseFloat(thisDiv.getElementsByClassName("mtpStatus")[0].innerHTML);
        
        if (status==1) {
            thisDiv.getElementsByClassName("mtpMath")[0].style.display = "none";
            thisDiv.getElementsByClassName("mtpStatus")[0].innerHTML = -1;
        } else if (status==-1) {
            thisDiv.getElementsByClassName("mtpMath")[0].style.display = "";
            thisDiv.getElementsByClassName("mtpStatus")[0].innerHTML = 1;
        } else {
            // Basis
            var dim = myBasis.dim;
            var utList = myMTP.utList;
            var vuList = myMTP.vuList;
            var euList = myEnergy.euList;
            var L = utList[p].L;
            var S = utList[p].S;
            var N = utList[p].N;
            
            // Eigen-energy
            var tex = "\\[\n";
            tex += "E = \n";
            for (var k=0; k<=2*l; k+=2) {
                tex += "F^{("+k+")} \n";
                tex += "\\begin{bmatrix}\n";
                for (var n1=0; n1<N; n1++) {
                    for (var n2=0; n2<N; n2++) {
                        tex += l<3 ? float2sqrtfrac(euList[p][k][n1*N+n2]) : euList[p][k][n1*N+n2].toFixed(3);
                        if (n2<N-1) {
                            tex += " & ";
                        }
                    }
                    if (n1<N-1) {
                        tex += " \\\\ \n";
                    }
                }
                tex += "\n\\end{bmatrix}\n";
                if (k<2*l) {
                    tex += "+\n";
                }
            }
            tex += "\\]\n";
            
            var mathDiv = document.createElement("div");
            mathDiv.className = "mtpMath";
            mathDiv.innerHTML = tex;
            
            // Eigen-vectors in 2nd quantization
            var tex = "\\[\n";
            tex += "\\begin{aligned}\n";
            for (var ML=L; ML>=-L; ML--) {
                for (var MS=S; MS>=-S; MS--) {
                    for (var sn=0; sn<N; sn++) {
                        // Non-zero terms
                        var indexList = [];
                        var coeffList = [];
                        for (var i=0; i<dim; i++) {
                            var coeff = vuList[L][S][ML][MS][sn][i];
                            if (Math.abs(coeff)>1e-8) {
                                indexList.push(i);
                                coeffList.push(coeff);
                            }
                        }
                        var nzrs = coeffList.length;
                        
                        // Find the least common multiple
                        var lcm = 1;
                        if (N==1 || l<=2) {
                            var isFact = false;
                            while (!isFact) {
                                var denom = 1;
                                isFact = true;
                                for (var i=0; i<nzrs; i++) {
                                    var coeff = coeffList[i];
                                    var tmp = float2frac(coeff*coeff)[1];
                                    if (tmp!=1) {
                                        isFact = false;
                                    }
                                    if (tmp>denom) {
                                        denom = tmp;
                                    }
                                }
                                for (var i=0; i<nzrs; i++) {
                                    coeffList[i] *= Math.sqrt(denom);
                                }
                                lcm *= denom;
                            }
                        }
                        
                        var MLsign = ML>=0 ? "\\phantom{-}" : "-";
                        var MSsign = MS>=0 ? "\\phantom{-}" : "-";
                        var seni = N>1 ? ","+sn : "";
                        var fS = float2frac(S);
                        var Stex = fS[1]==1?fS[0]:"\\frac{"+fS[0]+"}{"+fS[1]+"}";
                        var fMS = float2frac(Math.abs(MS));
                        var MStex = fMS[1]==1?fMS[0]:"\\frac{"+fMS[0]+"}{"+fMS[1]+"}";
                        tex += "|"+L+","+MLsign+Math.abs(ML)+","+Stex+","+MSsign+MStex+seni+"\\rangle & = ";
                        tex += lcm>1 ? "\\frac{1}{\\sqrt{"+lcm+"}} " : "";
                        tex += nzrs>1 ? "\\left( " : "";
                        var isFirst = true;
                        for (var i=0; i<nzrs; i++) {
                            var coeff = coeffList[i];
                            tex += (!isFirst)&&(coeff>0) ? "+" : "";
                            tex += (N>1&&l>2) ? coeff.toFixed(3) : float2sqrt(coeff);
                            if (isElec) {
                                tex += printconf2nd(myBasis.conf[indexList[i]]);
                            } else {
                                tex += printconf2ndHole(myBasis.conf[indexList[i]]);
                            }
                            isFirst = false;
                        }
                        tex += nzrs>1 ? "\\right)" : "";
                        tex += isElec ? "|0\\rangle " : "|\\text{full}\\rangle ";
                        tex += "\\\\ \n";
                    }
                }
            }
            tex += "\\end{aligned}\n";
            tex += "\\]";
            
            mathDiv.innerHTML += tex;
            thisDiv.appendChild(mathDiv);
            try {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, mathDiv]);
            } catch(err) {
                console.log("MathJax not available.");
            }
            
            thisDiv.getElementsByClassName("mtpStatus")[0].innerHTML = 1;
        }
        
        // Output the configuration string in 2nd quantization format
        function printconf2nd(iconf) {
            var Nsite = myBasis.Nsite;
            var str = "";
            for (var i=Nsite-1; i>=0; i--) {
                var bit = iconf>>(Nsite-1-i)&01;
                if (bit) {
                    var ml = myBasis.ml[i];
                    var ms = i<Nsite/2 ? "\\uparrow" : "\\downarrow";
                    str += "c_{"+ml+ms+"}^\\dagger ";
                }
            }
            return str;
        }

        // Output the configuration string in 2nd quantization format (hole)
        function printconf2ndHole(iconf) {
            var Nsite = myBasis.Nsite;
            var str = "";
            for (var i=Nsite-1; i>=0; i--) {
                var bit = iconf>>(Nsite-1-i)&01;
                if (!bit) {
                    var ml = -myBasis.ml[i];;
                    var ms = i<Nsite/2 ? "\\downarrow" : "\\uparrow";
                    str += "h_{"+ml+ms+"}^\\dagger ";
                }
            }
            return str;
        }
    }
    
    function q0r0ChangeHandler() {
        if (isNaN(q0Text.value) || !isFinite(q0Text.value) ||
            isNaN(r0Text.value) || !isFinite(r0Text.value)) {
            alert("Inputs must be numbers!");
            return -1;
        }
        
        q0 = parseFloat(q0Text.value);
        r0 = parseFloat(r0Text.value);
        
        symChangeHandler();
    }
    // Initial crystal
    q0r0ChangeHandler();
    
    // Pre-defined symmetry
    function symChangeHandler() {
        // Clear table
        var nrow = cfTable.rows.length;
        for (var i=1; i<nrow; i++) {
            cfTable.deleteRow(1);
        }
        
        mdq1Div.style.display = "";
        mdq2Div.style.display = "none";
        mdq3Div.style.display = "none";
        
        var tcList = [];
        var pcList = [];
        switch (symSelect.selectedIndex) {
        case 0:
            tcList = [0.695913,0.695913,0.304087,0.304087];
            pcList = [0,1,0.5,1.5];
            break;
        case 1:
            tcList = [0.304087,0.304087,0.304087,0.304087,
                      0.695913,0.695913,0.695913,0.695913];
            pcList = [0.25,0.75,1.25,1.75,0.25,0.75,1.25,1.75];
            break;
        case 2:
            tcList = [0.5,0.5,0.5,0.5,0,1];
            pcList = [0,1,0.5,1.5,0,0];
            mdq2Div.style.display = "";
            mdq3Div.style.display = "";
            break;
        case 3:
            tcList = [0.304087,0.304087,0.304087,0.304087,
                      0.695913,0.695913,0.695913,0.695913,
                      0.116140,0.116140,0.883860,0.883860,
                      0.5,0.5,0.5,0.5,
                      0.383860,0.383860,0.616140,0.616140];
            pcList = [0.25,0.75,1.25,1.75,0.25,0.75,1.25,1.75,
                      0.5,1.5,0.5,1.5,
                      0.383860,1.616140,0.616140,1.383860,
                      0,1,0,1];
            break;
        case 4:
            tcList = [0.176208,0.176208,0.823792,0.823792,
                      0.5,0.5,0.5,0.5,
                      0.323792,0.323792,0.676208,0.676208];
            pcList = [0.5,1.5,0.5,1.5,
                      0.323792,0.676208,1.323792,1.676208,
                      0,1,0,1];
            break;
        default:
            break;
        }
        
        // Set table
        for (var i=1; i<=tcList.length; i++) {
            var row = cfTable.insertRow(i);
            var c0  = row.insertCell(0);
            var c1  = row.insertCell(1);
            var c2  = row.insertCell(2);
            var c3  = row.insertCell(3);
            var c4  = row.insertCell(4);
            c0.innerHTML = i;
            c1.innerHTML = "<span class='qc' contenteditable='true'>"+q0+"</span>";
            c2.innerHTML = "<span class='rc' contenteditable='true'>"+r0+"</span>";
            c3.innerHTML = "<span class='tc' contenteditable='true'>"+tcList[i-1]+"</span>";
            c4.innerHTML = "<span class='pc' contenteditable='true'>"+pcList[i-1]+"</span>";
        }
        setupCrystal();
        clearTS();
    }
    
    // Mode change
    function mdChangeHandler() {
        var Q1 = parseFloat(mdq1Range.value);
        var Q2 = parseFloat(mdq2Range.value);
        var Q3 = parseFloat(mdq3Range.value);
        
        updateMode(Q1, Q2, Q3);
        
        setupCrystal();
        clearTS();
    }
    
    function updateMode(Q1, Q2, Q3) {
        var nrow = cfTable.rows.length-1;
        
        if (symSelect.selectedIndex==0) {
            for (var i=1; i<=Math.min(4,nrow); i++) {
                var c2 = cfTable.rows[i].cells[2];
                c2.innerHTML = "<span class='rc' contenteditable='true'>"+(r0*Q1).toFixed(3)+"</span>";
            }
        } else if (symSelect.selectedIndex==1) {
            for (var i=1; i<=Math.min(8,nrow); i++) {
                var c2 = cfTable.rows[i].cells[2];
                c2.innerHTML = "<span class='rc' contenteditable='true'>"+(r0*Q1).toFixed(3)+"</span>";
            }
        } else if (symSelect.selectedIndex==2) {
            var yQ3 = (4*r0*r0+4*Q3*r0-Math.sqrt(8*r0*r0*r0*(2*r0+2*Q3)))/(4*Q3+4*r0);
            for (var i=1; i<=Math.min(2,nrow); i++) {
                var c2 = cfTable.rows[i].cells[2];
                c2.innerHTML = "<span class='rc' contenteditable='true'>"+(r0*Q1*(1+Q2-yQ3)).toFixed(3)+"</span>";
            }
            for (var i=3; i<=Math.min(4,nrow); i++) {
                var c2 = cfTable.rows[i].cells[2];
                c2.innerHTML = "<span class='rc' contenteditable='true'>"+(r0*Q1*(1-Q2-yQ3)).toFixed(3)+"</span>";
            }
            for (var i=5; i<=Math.min(6,nrow); i++) {
                var c2 = cfTable.rows[i].cells[2];
                c2.innerHTML = "<span class='rc' contenteditable='true'>"+(r0*Q1*(1+Q3)).toFixed(3)+"</span>";
            }
        } else if (symSelect.selectedIndex==3) {
            for (var i=1; i<=Math.min(20,nrow); i++) {
                var c2 = cfTable.rows[i].cells[2];
                c2.innerHTML = "<span class='rc' contenteditable='true'>"+(r0*Q1).toFixed(3)+"</span>";
            }
        } else if (symSelect.selectedIndex==4) {
            for (var i=1; i<=Math.min(12,nrow); i++) {
                var c2 = cfTable.rows[i].cells[2];
                c2.innerHTML = "<span class='rc' contenteditable='true'>"+(r0*Q1).toFixed(3)+"</span>";
            }
        } else {
            for (var i=1; i<=nrow; i++) {
                var c2 = cfTable.rows[i].cells[2];
                c2.innerHTML = "<span class='rc' contenteditable='true'>"+(r0*Q1).toFixed(3)+"</span>";
            }
        }
    }
    
    // Add charge
    function AQClickHandler() {
        var qc = q0;
        var rc = r0;
        var tc = Math.random();
        var pc = 2*Math.random();
        
        var row = cfTable.insertRow(cfTable.rows.length);
        var c0  = row.insertCell(0);
        var c1  = row.insertCell(1);
        var c2  = row.insertCell(2);
        var c3  = row.insertCell(3);
        var c4  = row.insertCell(4);
        c0.innerHTML = cfTable.rows.length-1;
        c1.innerHTML = "<span class='qc' contenteditable='true'>"+qc+"</span>";
        c2.innerHTML = "<span class='rc' contenteditable='true'>"+rc+"</span>";
        c3.innerHTML = "<span class='tc' contenteditable='true'>"+tc.toFixed(2)+"</span>";
        c4.innerHTML = "<span class='pc' contenteditable='true'>"+pc.toFixed(2)+"</span>";
    }
    
    // Delete charge
    function DQClickHandler() {
        if (cfTable.rows.length-1 > 0) {
            cfTable.deleteRow(cfTable.rows.length-1);
        }
    }
    
    // Setup crystal
    function setupCrystal() {
        var qcList = container.getElementsByClassName("qc");
        var rcList = container.getElementsByClassName("rc");
        var tcList = container.getElementsByClassName("tc");
        var pcList = container.getElementsByClassName("pc");
        
        qList = [];
        for (var c=0; c<qcList.length; c++) {
            if (isNaN(qcList[c].innerHTML) || !isFinite(qcList[c].innerHTML) ||
                isNaN(rcList[c].innerHTML) || !isFinite(rcList[c].innerHTML) ||
                isNaN(tcList[c].innerHTML) || !isFinite(tcList[c].innerHTML) ||
                isNaN(pcList[c].innerHTML) || !isFinite(pcList[c].innerHTML)) {
                alert("Inputs must be numbers!");
                return -1;
            }
            
            var qc = parseFloat(qcList[c].innerHTML);
            var rc = parseFloat(rcList[c].innerHTML);
            var tc = parseFloat(tcList[c].innerHTML)*Math.PI;
            var pc = parseFloat(pcList[c].innerHTML)*Math.PI;
            
            qList.push({q:qc, r:rc, theta:tc, phi:pc});
        }
        if (qList.length!=0) {
            // qavg and Ravg
            var Nq = qList.length;
            qavg = 0;
            Ravg = 0;
            for (var c=0; c<Nq; c++) {
                qavg += qList[c].q;
                Ravg += qList[c].r;
            }
            qavg /= Nq;
            Ravg /= Nq;
            
            // Update Crystal Ik inputs
            if (orbList.length!=0) {
                var orb0 = orbList[orbList.length-1];
                var u0 = orb0.u;
                if (orb0.l==l) {
                    switch (l) {
                    case 1:
                        pI2 = scfSolver.Ik(qavg, Ravg, 2, u0, u0);
                        I2Text.value = (pI2*energyUnit).toFixed(6);
                        break;
                    case 2:
                        dI2 = scfSolver.Ik(qavg, Ravg, 2, u0, u0);
                        dI4 = scfSolver.Ik(qavg, Ravg, 4, u0, u0);
                        I2Text.value = (dI2*energyUnit).toFixed(6);
                        I4Text.value = (dI4*energyUnit).toFixed(6);
                        break;
                    case 3:
                        fI2 = scfSolver.Ik(qavg, Ravg, 2, u0, u0);
                        fI4 = scfSolver.Ik(qavg, Ravg, 4, u0, u0);
                        fI6 = scfSolver.Ik(qavg, Ravg, 6, u0, u0);
                        I2Text.value = (fI2*energyUnit).toFixed(6);
                        I4Text.value = (fI4*energyUnit).toFixed(6);
                        I6Text.value = (fI6*energyUnit).toFixed(6);
                        break;
                    default:
                        break;
                    }
                    IkChangeHandler();
                }
            }
        }
        enTable.style.display = "none";
        
        if (!!cfPainter.gl) {
            CrysView.plot(qList, cfPainter);
        }
    }
    
    // Click on Setup Crystal button
    function STClickHandler() {
        setupCrystal();
        clearTS();
    }
    
    // Click on Crystal Eigen button
    function CEClickHandler() {
        // Check if is s shell
        if (l==0) {
            return 0;
        }
        
        // Start worker thread for crystal eigen-energy calculation
        var msg = true;
        if (l==3 && Ne>=4 && Ne<=10) {
            var Nsite = 4*l+2;
            var dim = 1;
            for (var k=1; k<=Ne; k++) {
                dim *= Nsite-k+1;
                dim /= k;
            }
            msg = confirm("This task involves a matrix diagonalization with dimension " + dim + ". " +
                          "This may take a few minutes. Continue?");
        }
        if (msg == true) {
            worker2.postMessage({"qList":qList, "l":l, "Ne":Ne, "Fk":Fk, "SO":SO, "Ik":Ik});
            
            // Change input status
            CEButton.disabled = "disabled";
            CEButton.value = "Calculating...";
            CEButton.style.color = "#FF0000";
        }
    }
    
    // Worker call back
    function worker2CallBackHandler(evt) {
        var data = evt.data;
        
        // Sort energy
        var energyArray = Array.prototype.slice.call(data.energy);
        energyArray.sort(function(a, b){return b-a;});
        EArray = [];
        NArray = [];
        var energy = energyArray[0];
        var degen  = 1;
        for (var i=1; i<energyArray.length; i++) {
            if (Math.abs(energy-energyArray[i])<1e-12) {
                degen++;
            } else {
                EArray.push(energy);
                NArray.push(degen);
                energy = energyArray[i];
                degen  = 1;
            }
        }
        EArray.push(energy);
        NArray.push(degen);
        tabulateEN();
        enTable.style.display = "";
        
        // Change input status
        CEButton.disabled = "";
        CEButton.value = "Spectrum";
        CEButton.style.color = "#000000";
    }
    
    function tabulateEN() {
        // Tabulate
        var nrow = enTable.rows.length;
        for (var i=1; i<nrow; i++) {
            enTable.deleteRow(1);
        }
        for (var i=0; i<EArray.length; i++) {
            var row = enTable.insertRow(i+1);
            var c0  = row.insertCell(0);
            var c1  = row.insertCell(1);
            c0.innerHTML = (energyUnit*EArray[i]).toFixed(6);
            c1.innerHTML = NArray[i];
        }
    }
    
    // Alpha function select
    function funSelectChangeHandler() {
        if (funSelect.selectedIndex==0) {
            IfunDiv.style.display = "";
            QfunDiv.style.display = "none";
            aminText.value = 0;
            amaxText.value = 10;
            daText.value = 1;
        } else if (funSelect.selectedIndex==1) {
            IfunDiv.style.display = "none";
            QfunDiv.style.display = "";
            aminText.value = 1;
            amaxText.value = 1.15;
            daText.value = 0.01;
        }
    }
    funSelectChangeHandler();
    
    // A range of Crystal Eigen click
    function aEClickHandler() {
        // Parse functions
        var I2fun = null;
        var I4fun = null;
        var I6fun = null;
        var Q1fun = null;
        var Q2fun = null;
        var Q3fun = null;
        try {
            if (funSelect.selectedIndex==0) {
                I2fun = eval("("+I2funText.value+")");
                I4fun = eval("("+I4funText.value+")");
                I6fun = eval("("+I6funText.value+")");
            } else if (funSelect.selectedIndex==1) {
                Q1fun = eval("("+Q1funText.value+")");
                Q2fun = eval("("+Q2funText.value+")");
                Q3fun = eval("("+Q3funText.value+")");
            }
        } catch (e) {
            alert("Illegal functions.");
            return -1;
        }
        
        if (isNaN(aminText.value) || !isFinite(aminText.value) ||
            isNaN(amaxText.value) || !isFinite(amaxText.value) ||
            isNaN(daText.value) || !isFinite(daText.value)) {
            alert("Inputs must be numbers!");
            return -1;
        }
        
        var amin = parseFloat(aminText.value);
        var amax = parseFloat(amaxText.value);
        var da   = parseFloat(daText.value);
        
        if (da<=0) {
            alert("Delta alpha must be positive!");
            return -1;
        }
        
        // Check if is s shell
        if (l==0) {
            return 0;
        }
        
        var aList = [];
        var cList = [];
        for (var a=amin; a<=amax; a+=da) {
            var isDone = false;
            for (var i=0; i<TSaList.length; i++) {
                if (a==TSaList[i]) {
                    isDone = true;
                    break;
                }
            }
            if (isDone) {
                continue;
            }
            aList.push(a);
            // How to use alpha
            if (funSelect.selectedIndex==0) {
                var aIk = [];
                aIk[2] = I2fun(a, Ik[2]);
                aIk[4] = I4fun(a, Ik[4]);
                aIk[6] = I6fun(a, Ik[6]);
                var ci = {qList:qList, l:l, Ne:Ne, Fk:Fk, SO:SO, Ik:aIk};
                cList.push(ci);
            } else if (funSelect.selectedIndex==1) {
                var Q1 = Q1fun(a);
                var Q2 = Q2fun(a);
                var Q3 = Q3fun(a);
                updateMode(Q1, Q2, Q3);
                setupCrystal();
                var aIk = [];
                aIk[2] = Ik[2];
                aIk[4] = Ik[4];
                aIk[6] = Ik[6];
                var ci = {qList:qList, l:l, Ne:Ne, Fk:Fk, SO:SO, Ik:aIk};
                cList.push(ci);
            }
        }
        
        if (aList.length>0) {
            // Start worker thread for crystal eigen-energy calculation
            if (l==3 && Ne>=4 && Ne<=10) {
                var Nsite = 4*l+2;
                var dim = 1;
                for (var k=1; k<=Ne; k++) {
                    dim *= Nsite-k+1;
                    dim /= k;
                }
                var msg = confirm("This task involves matrix diagonalizations with dimension " + dim + ". " +
                                  "This may take a few minutes. Continue?");
                if (msg == true) {
                    worker3.postMessage({"cList":cList, "aList":aList});
                    
                    // Change input status
                    aEButton.disabled = "disabled";
                    aEButton.value = "Calculating...";
                    aEButton.style.color = "#FF0000";
                }
            } else {
                worker3.postMessage({"cList":cList, "aList":aList});
                
                // Change input status
                aEButton.disabled = "disabled";
                aEButton.value = "Calculating...";
                aEButton.style.color = "#FF0000";
            }
        }
    }
    
    // Worker call back
    function worker3CallBackHandler(evt) {
        var data = evt.data;
        var aList = data.aList;
        var energyList = data.energyList;
        
        for (var i=0; i<aList.length; i++) {
            TSaList.push(aList[i]);
            TSEList.push(energyList[i]);
        }
        
        rangeTS();
        plotTS();
        
        // Change input status
        aEButton.disabled = "";
        aEButton.value = "Tanabe-Sugano Diagram";
        aEButton.style.color = "#000000";
    }
    
    function rangeTS() {
        if (TSaList.length==0) {
            return -1;
        }
        // Find plot range
        var amax = TSaList[0];
        var amin = TSaList[0];
        var Emax = TSEList[0][0];
        var Emin = TSEList[0][0];
        for (var i=0; i<TSaList.length; i++) {
            if (amax<TSaList[i]) {
                amax = TSaList[i];
            }
            if (amin>TSaList[i]) {
                amin = TSaList[i];
            }
            for (var j=0; j<TSEList[i].length; j++) {
                if (Emax<TSEList[i][j]) {
                    Emax = TSEList[i][j];
                }
                if (Emin>TSEList[i][j]) {
                    Emin = TSEList[i][j];
                }
            }
        }
        var da = amax-amin==0 ? 1 : amax-amin;
        var dE = Emax-Emin==0 ? 1 : Emax-Emin;
        tsPainter.setXRange((amin-0.1*da), (amax+0.1*da));
        tsPainter.setYRange(energyUnit*(Emin-0.1*dE), energyUnit*(Emax+0.1*dE));
    }
    
    function plotTS() {
        // Plot E vs alpha
        for (var i=0; i<TSaList.length; i++) {
            tsPainter.plot(Vec.alphas(TSaList[i],TSEList[i].length), scaleE(TSEList[i]), "rgb(0,0,255)");
            tsPainter.setHoldOn(true);
        }
        tsPainter.setHoldOn(false);
    }
    
    function hfClickHandler() {
        if (isNaN(daText.value) || !isFinite(daText.value)) {
            alert("Inputs must be numbers!");
            return -1;
        }
        var da = parseFloat(daText.value);
        daText.value = da*0.5;
    }
    
    function clearTS() {
        TSaList.length = 0;
        TSEList.length = 0;
        tsPainter.plot([],[],"rgb(0,0,0)");
    }
    
    //Window resize
    function resize() {
        // Get container width
        var contWidth  = container.clientWidth;
        
        // Set new width and height (height depends on width)
        ptSVG.setAttribute("width",  contWidth*ptcw);
        ptSVG.setAttribute("height", contWidth*ptch);
        glCanvas.width    = contWidth*glcw;
        glCanvas.height   = contWidth*glch;
        RCanvas.width     = contWidth*Rcw;
        RCanvas.height    = contWidth*Rch;
        rhoCanvas.width   = contWidth*rhocw;
        rhoCanvas.height  = contWidth*rhoch;
        ZeffCanvas.width  = contWidth*Zeffcw;
        ZeffCanvas.height = contWidth*Zeffch;
        mtpCanvas.width   = contWidth*mtpcw;
        mtpCanvas.height  = contWidth*mtpch;
        cfCanvas.width    = contWidth*cfcw;
        cfCanvas.height   = contWidth*cfch;
        tsCanvas.width    = contWidth*tscw;
        tsCanvas.height   = contWidth*tsch;
        
        // Refresh
        myPTable.refresh();
        elem.getElementsByClassName("rect")[0].setAttribute("style",
        "fill:"+myPTable.fillColor[elem.l]+"; stroke:"+myPTable.strokeColor[elem.l]+
        "; stroke-width:"+myPTable.strokeWidth+"; opacity:1.0;");
        if (glPainter.gl) {
            glPainter.refresh();
        }
        RPainter.refresh();
        rhoPainter.refresh();
        ZeffPainter.refresh();
        ZeffPainter.refresh();
        mtpSpectrum.refresh();
        if (cfPainter.gl) {
            cfPainter.refresh();
        }
        tsPainter.refresh();
    }
    resize();
    
    //Input a float number, Output a LaTeX string of fraction
    function float2frac(r) {
        var max = 100000000;
        var ai  = Math.floor(r);
        var m00 = 1, m01 = 0, m10 = 0, m11 = 1;
        
        //Loop finding terms until denomitor gets too big
        while (m10*ai+m11 <= max) {
            var t;
            t = Math.floor(m00*ai+m01);
            m01 = m00;
            m00 = t;
            t = Math.floor(m10*ai+m11);
            m11 = m10;
            m10 = t;
            if(r == ai) {
                break;
            }
            r = 1 / (r-ai);
            ai = Math.floor(r);
        }
        
        if(m10 != 1) {
            return [m00, m10];
        } else {
            return [m00, 1];
        }
    }
    
    function float2sqrt(r) {
        var rr = r*r;
        if (Math.abs(rr) <= 1e-8) {
            return "0";
        } else if (Math.abs(r-1) <= 1e-8) {
            return "";
        } else if (Math.abs(r+1) <= 1e-8) {
            return "-";
        } else if (Math.abs(Math.abs(r)%1)<=1e-8 || Math.abs(Math.abs(r)%1-1)<=1e-8) {
            return r.toFixed(0);
        } else if (Math.abs(Math.abs(rr)%1)<=1e-8 || Math.abs(Math.abs(rr)%1-1)<=1e-8) {
            return (r>0?"":"-") + "\\sqrt{"+rr.toFixed(0)+"}";
        } else {
            return (r>0?"":"-") + "\\sqrt{"+rr+"}";
        }
    }
    
    function float2sqrtfrac(r) {
        var r2 = r*r;
        var fracr2 = float2frac(r2);
        var fracr1 = [Math.sqrt(fracr2[0]), Math.sqrt(fracr2[1])];
        if (Math.abs(r2) <= 1e-8) {
            return "0";
        } else if (Math.abs(Math.abs(r)%1)<=1e-8 || Math.abs(Math.abs(r)%1-1)<=1e-8) {
            // Integer
            return r.toFixed(0);
        } else if (fracr1[0]%1==0 && fracr1[1]%1==0) {
            // Integer fraction
            return (r>0?"":"-") + "\\frac{" + fracr1[0] + "}{" + fracr1[1] + "}";
        } else if (Math.abs(Math.abs(r2)%1)<=1e-8 || Math.abs(Math.abs(r2)%1-1)<=1e-8) {
            // Sqrt integer
            return (r>0?"":"-") + "\\sqrt{"+r2.toFixed(0)+"}";
        } else {
            // Sqrt integer fraction
            return (r>0?"":"-") + "\\sqrt{\\frac{" + fracr2[0] + "}{" + fracr2[1] + "}}";
        }
    }
    
    // Number padding
    function pad(num, size) {
        var s = num + "";
        while (s.length < size) {
            s = " " + s;
        }
        return s;
    }
};
