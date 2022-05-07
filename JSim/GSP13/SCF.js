/*
 * SCF.js
 * Self-consistency by SCF approximation
 * Need to include EigenSolver.js, Painter.js, Painter3D.js
 */

var SCF = new Object();

window.addEventListener("load", function() {SCF.loadHandler();}, false);
SCF.loadHandler = function() {
    var SCFDivs = document.getElementsByClassName("SCF");
    for (var i=0; i<SCFDivs.length; i++) {
        SCF.setupSCF(SCFDivs[i]);
    }
};

// SCF setup
SCF.setupSCF = function(container) {
    // Get data from <div>{JSON}</div>
    var jsonData  = JSON.parse(container.innerHTML);
    var rMinZ     = typeof jsonData.rMinZ  === "undefined" ? 0.0001 : jsonData.rMinZ;
    var rMax      = typeof jsonData.rMax   === "undefined" ? 50.0  : jsonData.rMax;
    var dx        = typeof jsonData.dx     === "undefined" ? 0.002 : jsonData.dx;
    var Rcw       = typeof jsonData.Rcw    === "undefined" ? 300   : jsonData.Rcw;
    var Rch       = typeof jsonData.Rch    === "undefined" ? 300   : jsonData.Rch;
    var rhocw     = typeof jsonData.rhocw  === "undefined" ? 200   : jsonData.rhocw;
    var rhoch     = typeof jsonData.rhoch  === "undefined" ? 170   : jsonData.rhoch;
    var Zeffcw    = typeof jsonData.Zeffcw === "undefined" ? 200   : jsonData.Zeffcw;
    var Zeffch    = typeof jsonData.Zeffch === "undefined" ? 170   : jsonData.Zeffch;
    var bkgdColor = typeof jsonData.bkgdColor === "undefined" ? [1.0,1.0,1.0] : jsonData.bkgdColor;
    var gridColor = typeof jsonData.gridColor === "undefined" ? [0.8,0.8,0.8] : jsonData.gridColor;
    var glcw      = typeof jsonData.glcw      === "undefined" ? 500           : jsonData.glcw;
    var glch      = typeof jsonData.glch      === "undefined" ? 350           : jsonData.glch;
    
    // Add HTML elements
    var html = "<h2>Self-consistent field computation</h2>";
    html += "<table>" +
            "<tr>" +
            "<th class='lbl'>Group</th>" +
            "<th class='lbl'>1</th>" +
            "<th class='lbl'>2</th>" +
            "<th class='lbl'>&nbsp;</th>" +
            "<th class='lbl'>3</th>" +
            "<th class='lbl'>4</th>" +
            "<th class='lbl'>5</th>" +
            "<th class='lbl'>6</th>" +
            "<th class='lbl'>7</th>" +
            "<th class='lbl'>8</th>" +
            "<th class='lbl'>9</th>" +
            "<th class='lbl'>10</th>" +
            "<th class='lbl'>11</th>" +
            "<th class='lbl'>12</th>" +
            "<th class='lbl'>13</th>" +
            "<th class='lbl'>14</th>" +
            "<th class='lbl'>15</th>" +
            "<th class='lbl'>16</th>" +
            "<th class='lbl'>17</th>" +
            "<th class='lbl'>18</th>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>Period</th>" +
            "<td colspan='19'></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>1</th>" +
            "<td class='elem xs'><div class='at_num'>1</div><abbr class='sym' title='hydrogen'>H</abbr></td>" +
            "<td colspan='17'></td>" +
            "<td class='elem xs'><div class='at_num'>2</div><abbr class='sym' title='helium'>He</abbr></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>2</th>" +
            "<td class='elem xs'><div class='at_num'>3</div><abbr class='sym' title='lithium'>Li</abbr></td>" +
            "<td class='elem xs'><div class='at_num'>4</div><abbr class='sym' title='beryllium'>Be</abbr></td>" +
            "<td colspan='11'></td>" +
            "<td class='elem xp'><div class='at_num'>5</div><abbr class='sym' title='boron'>B</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>6</div><abbr class='sym' title='carbon'>C</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>7</div><abbr class='sym' title='nitrogen'>N</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>8</div><abbr class='sym' title='oxygen'>O</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>9</div><abbr class='sym' title='fluorine'>F</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>10</div><abbr class='sym' title='neon'>Ne</abbr></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>3</th>" +
            "<td class='elem xs'><div class='at_num'>11</div><abbr class='sym' title='sodium'>Na</abbr></td>" +
            "<td class='elem xs'><div class='at_num'>12</div><abbr class='sym' title='magnesium'>Mg</abbr></td>" +
            "<td colspan='11'></td>" +
            "<td class='elem xp'><div class='at_num'>13</div><abbr class='sym' title='aluminium (aluminum in US)'>Al</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>14</div><abbr class='sym' title='silicon'>Si</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>15</div><abbr class='sym' title='phosphorus'>P</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>16</div><abbr class='sym' title='sulfur (sulphur in UK and elsewhere)'>S</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>17</div><abbr class='sym' title='chlorine'>Cl</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>18</div><abbr class='sym' title='argon'>Ar</abbr></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>4</th>" +
            "<td class='elem xs'><div class='at_num'>19</div><abbr class='sym' title='potassium'>K</abbr></td>" +
            "<td class='elem xs'><div class='at_num'>20</div><abbr class='sym' title='calcium'>Ca</abbr></td>" +
            "<td></td>" +
            "<td class='elem xd'><div class='at_num'>21</div><abbr class='sym' title='scandium'>Sc</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>22</div><abbr class='sym' title='titanium'>Ti</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>23</div><abbr class='sym' title='vanadium'>V</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>24</div><abbr class='sym' title='chromium'>Cr</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>25</div><abbr class='sym' title='manganese'>Mn</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>26</div><abbr class='sym' title='iron'>Fe</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>27</div><abbr class='sym' title='cobalt'>Co</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>28</div><abbr class='sym' title='nickel'>Ni</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>29</div><abbr class='sym' title='copper'>Cu</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>30</div><abbr class='sym' title='zinc'>Zn</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>31</div><abbr class='sym' title='gallium'>Ga</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>32</div><abbr class='sym' title='germanium'>Ge</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>33</div><abbr class='sym' title='arsenic'>As</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>34</div><abbr class='sym' title='selenium'>Se</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>35</div><abbr class='sym' title='bromine'>Br</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>36</div><abbr class='sym' title='krypton'>Kr</abbr></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>5</th>" +
            "<td class='elem xs'><div class='at_num'>37</div><abbr class='sym' title='rubidium'>Rb</abbr></td>" +
            "<td class='elem xs'><div class='at_num'>38</div><abbr class='sym' title='strontium'>Sr</abbr></td>" +
            "<td></td>" +
            "<td class='elem xd'><div class='at_num'>39</div><abbr class='sym' title='yttrium'>Y</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>40</div><abbr class='sym' title='zirconium'>Zr</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>41</div><abbr class='sym' title='niobium'>Nb</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>42</div><abbr class='sym' title='molybdenum'>Mo</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>43</div><abbr class='sym' title='technetium'>Tc</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>44</div><abbr class='sym' title='ruthenium'>Ru</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>45</div><abbr class='sym' title='rhodium'>Rh</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>46</div><abbr class='sym' title='palladium'>Pd</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>47</div><abbr class='sym' title='silver'>Ag</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>48</div><abbr class='sym' title='cadmium'>Cd</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>49</div><abbr class='sym' title='indium'>In</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>50</div><abbr class='sym' title='tin'>Sn</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>51</div><abbr class='sym' title='antimony'>Sb</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>52</div><abbr class='sym' title='tellurium'>Te</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>53</div><abbr class='sym' title='iodine'>I</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>54</div><abbr class='sym' title='xenon'>Xe</abbr></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>6 </th>" +
            "<td class='elem xs'><div class='at_num'>55</div><abbr class='sym' title='caesium (cesium in US)'>Cs</abbr></td>" +
            "<td class='elem xs'><div class='at_num'>56</div><abbr class='sym' title='barium'>Ba</abbr></td>" +
            "<th class='asterisk'>*</th>" +
            "<td class='elem xd'><div class='at_num'>71</div><abbr class='sym' title='lutetium'>Lu</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>72</div><abbr class='sym' title='hafnium'>Hf</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>73</div><abbr class='sym' title='tantalum'>Ta</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>74</div><abbr class='sym' title='tungsten'>W</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>75</div><abbr class='sym' title='rhenium'>Re</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>76</div><abbr class='sym' title='osmium'>Os</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>77</div><abbr class='sym' title='iridium'>Ir</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>78</div><abbr class='sym' title='platinum'>Pt</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>79</div><abbr class='sym' title='gold'>Au</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>80</div><abbr class='sym' title='mercury'>Hg</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>81</div><abbr class='sym' title='thallium'>Tl</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>82</div><abbr class='sym' title='lead'>Pb</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>83</div><abbr class='sym' title='bismuth'>Bi</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>84</div><abbr class='sym' title='polonium'>Po</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>85</div><abbr class='sym' title='astatine'>At</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>86</div><abbr class='sym' title='radon'>Rn</abbr></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>7 </th>" +
            "<td class='elem xs'><div class='at_num'>87</div><abbr class='sym' title='francium'>Fr</abbr></td>" +
            "<td class='elem xs'><div class='at_num'>88</div><abbr class='sym' title='radium'>Ra</abbr></td>" +
            "<th class='asterisk'>**</th>" +
            "<td class='elem xd'><div class='at_num'>103</div><abbr class='sym' title='lawrencium'>Lr</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>104</div><abbr class='sym' title='rutherfordium'>Rf</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>105</div><abbr class='sym' title='dubnium'>Db</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>106</div><abbr class='sym' title='seaborgium'>Sg</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>107</div><abbr class='sym' title='bohrium'>Bh</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>108</div><abbr class='sym' title='hassium'>Hs</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>109</div><abbr class='sym' title='meitnerium'>Mt</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>110</div><abbr class='sym' title='darmstadtium'>Ds</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>111</div><abbr class='sym' title='roentgenium'>Rg</abbr></td>" +
            "<td class='elem xd'><div class='at_num'>112</div><abbr class='sym' title='copernicium'>Cn</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>113</div><abbr class='sym' title='ununtrium'>Uut</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>114</div><abbr class='sym' title='flerovium'>Fl</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>115</div><abbr class='sym' title='ununpentium'>Uup</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>116</div><abbr class='sym' title='livermorium'>Lv</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>117</div><abbr class='sym' title='ununseptium'>Uus</abbr></td>" +
            "<td class='elem xp'><div class='at_num'>118</div><abbr class='sym' title='ununoctium'>Uuo</abbr></td>" +
            "</tr>" +
            "<tr>" +
            "<td>&nbsp;</td>" +
            "<td colspan='19'></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl' colspan='3'>*Lanthanoids</th>" +
            "<th class='asterisk'>*</th>" +
            "<td class='elem xf'><div class='at_num'>57</div><abbr class='sym' title='lanthanum'>La</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>58</div><abbr class='sym' title='cerium'>Ce</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>59</div><abbr class='sym' title='praseodymium'>Pr</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>60</div><abbr class='sym' title='neodymium'>Nd</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>61</div><abbr class='sym' title='promethium'>Pm</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>62</div><abbr class='sym' title='samarium'>Sm</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>63</div><abbr class='sym' title='europium'>Eu</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>64</div><abbr class='sym' title='gadolinium'>Gd</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>65</div><abbr class='sym' title='terbium'>Tb</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>66</div><abbr class='sym' title='dysprosium'>Dy</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>67</div><abbr class='sym' title='holmium'>Ho</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>68</div><abbr class='sym' title='erbium'>Er</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>69</div><abbr class='sym' title='thulium'>Tm</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>70</div><abbr class='sym' title='ytterbium'>Yb</abbr></td>" +
            "<td colspan='2'></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl' colspan='3'>**Actinoids</th>" +
            "<th class='asterisk'>**</th>" +
            "<td class='elem xf'><div class='at_num'>89</div><abbr class='sym' title='actinium'>Ac</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>90</div><abbr class='sym' title='thorium'>Th</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>91</div><abbr class='sym' title='protactinium'>Pa</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>92</div><abbr class='sym' title='uranium'>U</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>93</div><abbr class='sym' title='neptunium'>Np</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>94</div><abbr class='sym' title='plutonium'>Pu</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>95</div><abbr class='sym' title='americium'>Am</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>96</div><abbr class='sym' title='curium'>Cm</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>97</div><abbr class='sym' title='berkelium'>Bk</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>98</div><abbr class='sym' title='californium'>Cf</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>99</div><abbr class='sym' title='einsteinium'>Es</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>100</div><abbr class='sym' title='fermium'>Fm</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>101</div><abbr class='sym' title='mendelevium'>Md</abbr></td>" +
            "<td class='elem xf'><div class='at_num'>102</div><abbr class='sym' title='nobelium'>No</abbr></td>" +
            "<td colspan='2'></td>" +
            "</tr>" +
            "</table><br />";
    html += "<div class='zval'>Z = </div>";
    html += "Electron configuration: <input type='text' value='[Xe]_6s2_4f14_5d10_6p2' /><br />";
    html += "Exchange-correlation method: <select>";
    html += "<option>None</option>";
    html += "<option>Kohn-Shan-Gaspar</option>";
    html += "<option>Hedin-Lundqvist</option>";
    html += "<option>Gunnarsson-Lundqvist-Wilkins</option>";
    html += "<option>Von Barth-Hedin</option>";
    html += "<option>Ceperley-Alder Perdew-Zunger</option>";
    html += "<option>Ceperley-Alder Vosko-Wilk-Nusair</option>";
    html += "</select><br /><br />";
    html += "<table>";
    html += "<tr><td rowspan='2'><canvas></canvas><br />";
    html += "<td><canvas></canvas><br />";
    html += "<tr><td><canvas></canvas><br />";
    html += "</table>";
    html += "<div class='EtotDiv'>Total Energy = </div><br />";
    html += "Distances are given in units of <select>";
    html += "<option>Bohr radius</option>";
    html += "<option>angstrom</option>";
    html += "</select> and energies in <select>";
    html += "<option>Hartree</option>";
    html += "<option>Rydberg</option>";
    html += "<option>eV</option>";
    html += "</select><br /><br />";
    html += "<input type='button' value='Full SCF' /> ";
    html += "<input type='button' value='SCF Step' /> ";
    html += "<progress max='1' value='0'></progress> ";
    html += "<input type='button' title='Stop Full SCF' value='\u220e' style='color:red;' /><br /><br />";
    html += "<textarea rows='4' cols='35' readonly></textarea><br />";
    html += "<input type='button' value='Visualize' /><br />";
    html += "<h2>Atomic orbital visualization</h2>";
    html += "<div class='glDiv'><canvas></canvas></div>";
    html += "<input type='range'><br />";
    html += "<select></select>    ";
    html += "<select></select><br />";
    container.innerHTML = html;
    
    // Get HTML elements
    var elements   = container.getElementsByClassName("elem");
    var ZText      = container.getElementsByClassName("zval")[0];
    var cfgText    = container.getElementsByTagName("input")[0];
    var xcList     = container.getElementsByTagName("select")[0];
    var RCanvas    = container.getElementsByTagName("canvas")[0];
    var rhoCanvas  = container.getElementsByTagName("canvas")[1];
    var ZeffCanvas = container.getElementsByTagName("canvas")[2];
    var EtotDiv    = container.getElementsByClassName("EtotDiv")[0];
    var fullButton = container.getElementsByTagName("input")[1];
    var stepButton = container.getElementsByTagName("input")[2];
    var stopButton = container.getElementsByTagName("input")[3];
    var prgsBar    = container.getElementsByTagName("progress")[0];
    var lengthList = container.getElementsByTagName("select")[1];
    var energyList = container.getElementsByTagName("select")[2];
    var iterText   = container.getElementsByTagName("textarea")[0];
    var visualButton = container.getElementsByTagName("input")[4];
    var glCanvas   = container.getElementsByTagName("canvas")[3];
    var densRange  = container.getElementsByTagName("input")[5];
    var nlList     = container.getElementsByTagName("select")[3];
    var mList      = container.getElementsByTagName("select")[4];
    
    RCanvas.width     = Rcw;
    RCanvas.height    = Rch;
    rhoCanvas.width   = rhocw;
    rhoCanvas.height  = rhoch;
    ZeffCanvas.width  = Zeffcw;
    ZeffCanvas.height = Zeffch;
    glCanvas.width    = glcw;
    glCanvas.height   = glch;
    
    xcList.selectedIndex = 6;
    
    stopButton.disabled = "disabled";
    densRange.disabled = "disabled";
    
    var colorList = new Array();
    colorList[0] = "rgb(0, 0, 255)";
    colorList[1] = "rgb(255, 155, 0)";
    colorList[2] = "rgb(255, 0, 0)";
    colorList[3] = "rgb(0, 200, 0)";
    colorList[4] = "rgb(155, 0, 255)";
    colorList[5] = "rgb(0, 155, 255)";
    
    var spdList = ["s", "p", "d", "f", "g", "h"];
    
    // Setup
    var Z = 1;
    var x = EigenSolver.setupGrid(Math.log(rMinZ), Math.log(Z*rMax), dx);
    var r = EigenSolver.x2r(x, Z);
    var V = EigenSolver.setupPotential(r, Z);
    var Vnew = new Float64Array(r.length);
    var orbtList = [];
    var rho = new Float64Array(r.length);
    var Zeff = new Float64Array(r.length);
    var Etot = 0;
    var iter = 0;
    var cnvg = 1e6;
    var stopFlag = false;
    var lengthUnit = 1;
    var energyUnit = 1;
    
    var elem = 0;
    
    var isU = false;
    var isLogR = false;
    var isLogZ = false;
    
    // Painter
    var RPainter    = new Painter(RCanvas);
    var rhoPainter  = new Painter(rhoCanvas);
    var ZeffPainter = new Painter(ZeffCanvas);
    RPainter.setLabel("r", "");
    RPainter.setTitle("Energy and R");
    RPainter.setTickSize(5);
    RPainter.setTickLabelSize(10);
    RPainter.setLabelSize(12);
    RPainter.setTitleSize(12);
    RPainter.setMargin(35, 10, 20, 20);
    RPainter.refresh();
    rhoPainter.setLabel("r", "");
    rhoPainter.setTitle("rho*r*r");
    rhoPainter.setTickSize(5);
    rhoPainter.setTickLabelSize(10);
    rhoPainter.setLabelSize(12);
    rhoPainter.setTitleSize(12);
    rhoPainter.setMargin(25, 10, 20, 20);
    rhoPainter.refresh();
    ZeffPainter.setLabel("r", "");
    ZeffPainter.setTitle("Zeff");
    ZeffPainter.setTickSize(5);
    ZeffPainter.setTickLabelSize(10);
    ZeffPainter.setLabelSize(12);
    ZeffPainter.setTitleSize(12);
    ZeffPainter.setMargin(25, 10, 20, 20);
    ZeffPainter.refresh();
    
    RCanvas.title += "\n6. Press \"T\" to toggle R(r) and u(r)";
    rhoCanvas.title += "\n6. Press \"T\" to toggle rho*r*r and log(rho)";
    ZeffCanvas.title += "\n6. Press \"T\" to toggle linear and log scale";
    
    // Initial plot
    plotAll();
    
    // Painter3D
    var glPainter = new Painter3D(glCanvas);
    if (!glPainter.gl) {
        var glDiv = container.getElementsByClassName("glDiv")[0];
        glDiv.innerHTML = "<a href='http://get.webgl.org/'>" +
                          "<img src='glImage.png'" +
                          "alt='Your browser does not support WebGL.'" +
                          "title='Your browser does not support WebGL.' /></a>";
    } else {
        glPainter.setBkgdColor(bkgdColor);
        glPainter.setMatrices([0.0,0.0,-27.0], [-1.2,0.0,-Math.PI*3/4]);
        
        // Setup axis
        glPainter.setupAxis(14, 0.5);
        glPainter.setAxisOn(true);
        
        // Setup grid
        glPainter.setupGridPolar(1, 12, Math.PI/12, gridColor);
        glPainter.setGridOn(true);
        
        // Resize mesh
        var mm = [];
        for (var i=0; i<=24; i++) {
            mm[i] = (i-12)/2;
        }
        glPainter.setupMesh(mm, mm, 0, true);
        
        glPainter.setPointSize(1.5);
        glPainter.setupLight([0.0,1.0,2.0], [0.5,0.5,0.5], [0.6,0.6,0.6], [0.8,0.8,0.8], 100.0);
        
        glPainter.refresh();
    }
    
    // Orbital data (to be read from JSON)
    var rMinJS=0.0001, dxJS=0.002, rJS=[], orbtListJS=[];
    
    // Points vertices, colors
    var pointVertices = [];
    var pointNormals  = [];
    var pointColors   = [];
    
    // Add event listeners
    cfgText.addEventListener("change", changeHandler, false);
    xcList.addEventListener("change", changeHandler, false);
    RCanvas.addEventListener("keydown", RuToggleHandler, false);
    rhoCanvas.addEventListener("keydown", logRToggleHandler, false);
    ZeffCanvas.addEventListener("keydown", logZToggleHandler, false);
    fullButton.addEventListener("click", fullClickHandler, false);
    stepButton.addEventListener("click", stepClickHandler, false);
    stopButton.addEventListener("click", stopClickHandler, false);
    lengthList.addEventListener("change", unitChangeHandler, false);
    energyList.addEventListener("change", unitChangeHandler, false);
    visualButton.addEventListener("click", visualClickHandler, false);
    glCanvas.addEventListener("keydown", keyDownHandler, false);
    densRange.addEventListener("change", densChangeHandler, false);
    nlList.addEventListener("change", nlChangeHandler, false);
    mList.addEventListener("change", mChangeHandler, false);
    
    for (var i=0; i<elements.length; i++) {
        elements[i].addEventListener("click", elemClickHandler, false);
    }
    
    // Event handlers
    // Settings changed reset convergence
    function changeHandler() {
        cnvg = 1e6;
    }
    
    // Click on periodic table
    function elemClickHandler() {
        // Reset iteration number
        iter = 0;
        
        // Clear textarea
        iterText.value = "";
        
        // Remove selection high light
        if (elem) {
            elem.style.outlineStyle = "none";
        }
        elem = this;
        
        // High light
        elem.style.outlineStyle = "solid";
        elem.style.outlineColor = "#0000FF";
        
        // Get Z value
        Z = parseFloat(elem.getElementsByClassName("at_num")[0].innerHTML);
        ZText.innerHTML = "<strong>" + elem.getElementsByClassName("sym")[0].innerHTML + ":</strong> Z = " + Z;
        
        // Set default electron configuration
        if (Z >= 1 && Z <= 2) {
            cfgText.value = "1s" + Z;
        } else if (Z >= 3 && Z <= 4) {
            cfgText.value = "[He]_2s" + (Z-2);
        } else if (Z >= 5 && Z <= 10) {
            cfgText.value = "[He]_2s2_2p" + (Z-4);
        } else if (Z >= 11 && Z <= 12) {
            cfgText.value = "[Ne]_3s" + (Z-10);
        } else if (Z >= 13 && Z <= 18) {
            cfgText.value = "[Ne]_3s2_3p" + (Z-12);
        } else if (Z >= 19 && Z <= 20) {
            cfgText.value = "[Ar]_4s" + (Z-18);
        } else if (Z >= 21 && Z <= 30) {
            cfgText.value = "[Ar]_4s2_3d" + (Z-20);
        } else if (Z >= 31 && Z <= 36) {
            cfgText.value = "[Ar]_4s2_3d10_4p" + (Z-30);
        } else if (Z >= 37 && Z <= 38) {
            cfgText.value = "[Kr]_5s" + (Z-36);
        } else if (Z >= 39 && Z <= 48) {
            cfgText.value = "[Kr]_5s2_4d" + (Z-38);
        } else if (Z >= 49 && Z <= 54) {
            cfgText.value = "[Kr]_5s2_4d10_5p" + (Z-48);
        } else if (Z >= 55 && Z <= 56) {
            cfgText.value = "[Xe]_6s" + (Z-54);
        } else if (Z >= 57 && Z <= 70) {
            cfgText.value = "[Xe]_6s2_4f" + (Z-56);
        } else if (Z >= 71 && Z <= 80) {
            cfgText.value = "[Xe]_6s2_4f14_5d" + (Z-70);
        } else if (Z >= 81 && Z <= 86) {
            cfgText.value = "[Xe]_6s2_4f14_5d10_6p" + (Z-80);
        } else if (Z >= 87 && Z <= 88) {
            cfgText.value = "[Rn]_7s" + (Z-86);
        } else if (Z >= 89 && Z <= 102) {
            cfgText.value = "[Rn]_7s2_5f" + (Z-88);
        } else if (Z >= 103 && Z <= 112) {
            cfgText.value = "[Rn]_7s2_5f14_6d" + (Z-102);
        } else if (Z >= 113 && Z <= 118) {
            cfgText.value = "[Rn]_7s2_5f14_6d10_7p" + (Z-112);
        } else {
            cfgText.value = "1s0";
        }
        
        // Re-setup
        x = EigenSolver.setupGrid(Math.log(rMinZ), Math.log(Z*rMax), dx);
        r = EigenSolver.x2r(x, Z);
        V = EigenSolver.setupPotential(r, Z);
        Vnew = new Float64Array(r.length);
        rho = new Float64Array(r.length);
        Zeff = new Float64Array(r.length);
        
        // Clear orbtList
        orbtList.length = 0;
        
        // Erase convergence
        cnvg = 1e6;
        
        EtotDiv.innerHTML = "Total Energy = ";
        
        visualButton.disabled = "disabled";
        
        // Reset x range
        RPainter.setXRange(0, 3.5*lengthUnit);
        rhoPainter.setXRange(0, 3.5*lengthUnit);
        ZeffPainter.setXRange(0, 3.5*lengthUnit);
        
        // Reset y range
        RPainter.setYRange((-1.05*0.5*Z*Z)*energyUnit, (0.05*0.5*Z*Z)*energyUnit);
        if (isLogR) {
            rhoPainter.setYRange(-5, 1.25*Math.log(Z));
        } else {
            rhoPainter.setYRange(0, 0.15*Z);
        }
        if (isLogZ) {
            ZeffPainter.setYRange(-2, Math.log(Z)/Math.log(10));
        } else {
            ZeffPainter.setYRange(0, Z);
        }
        
        plotAll();
    }
    // Initial click
    var event = document.createEvent("HTMLEvents");
    event.initEvent("click", true, false);
    elements[0].dispatchEvent(event);
    
    // Click full button
    function fullClickHandler() {
        var n = r.length;
        
        if (cnvg <= 1e-6) {
            alert("Solution converged already!");
            return 0;
        }
        
        cnvg = 0;
        for (var i=0; i<n; i++) {
            cnvg += (Vnew[i]-V[i])*(Vnew[i]-V[i]);
        }
        
        var msg = confirm("This may take a few minutes. Continue?");
        if (msg == true) {
            stopButton.disabled = "";
            stepClickHandler(true);
        }
    }
    
    // Click step button
    function stepClickHandler(repeat) {
        // Freeze button
        fullButton.disabled = "disabled";
        stepButton.disabled = "disabled";
        visualButton.disabled = "disabled";
        cfgText.disabled = "disabled";
        xcList.disabled = "disabled";
        
        if (stopFlag) {
            fullButton.disabled = "";
            stepButton.disabled = "";
            stopButton.disabled = "disabled";
            visualButton.disabled = "";
            cfgText.disabled = "";
            xcList.disabled = "";
            stopFlag = false;
            return;
        }
        
        iter++;
        
        var n = r.length;
        
        // Update new potential
        if (orbtList.length > 0) {
            for (var i=0; i<n; i++) {
                V[i] = Vnew[i];
            }
        }
        
        // Read electron configuration
        var closeReg = /\[[A-z]+\]/;
        var openReg  = /\d[spdfgh]\d+/g;
        
        var closeStr = cfgText.value.match(closeReg);
        var openStr  = cfgText.value.match(openReg);
        
        var cfgList = new Array();
        if (closeStr != null) {
            if (closeStr == "[He]") {
                cfgList = ["1s2"];
            } else if (closeStr == "[Ne]") {
                cfgList = ["1s2", "2s2", "2p6"];
            } else if (closeStr == "[Ar]") {
                cfgList = ["1s2", "2s2", "2p6", "3s2", "3p6"];
            } else if (closeStr == "[Kr]") {
                cfgList = ["1s2", "2s2", "2p6", "3s2", "3p6", "4s2", "3d10", "4p6"];
            } else if (closeStr == "[Xe]") {
                cfgList = ["1s2", "2s2", "2p6", "3s2", "3p6", "4s2", "3d10", "4p6", "5s2", "4d10", "5p6"];
            } else if (closeStr == "[Rn]") {
                cfgList = ["1s2", "2s2", "2p6", "3s2", "3p6", "4s2", "3d10", "4p6", "5s2", "4d10", "5p6", "6s2", "4f14", "5d10", "6p6"];
            } else if (closeStr == "[Uno]") {
                cfgList = ["1s2", "2s2", "2p6", "3s2", "3p6", "4s2", "3d10", "4p6", "5s2", "4d10", "5p6", "6s2", "4f14", "5d10", "6p6", "7s2", "5f14", "6d10", "7p6"];
            } else {
                alert(closeStr + " is not a close shell element!");
                stepButton.disabled = "";
                cfgText.disabled = "";
                xcList.disabled = "";
                return -1;
            }
        }
        
        if (openStr != null) {
            cfgList = cfgList.concat(openStr);
        }
        
        if (cfgList.length == 0) {
            alert("Illegal input!\nInput should have an electron configuration format.\ne.g. [Xe]_6s2_4f14_5d10_6p2");
            stepButton.disabled = "";
            cfgText.disabled = "";
            xcList.disabled = "";
            return -1;
        }
        
        var EUp  = 0.2*0.5*Z*Z;
        var ELow = -1.2*0.5*Z*Z;
        
        // Shoot eigen-states for occupied orbitals
        orbtList.length = 0;
        var cfgItem = 0;
        function shootCfgItem() {
            // Update progress bar
            prgsBar.value = (cfgItem+1) / cfgList.length;
            
            if (cfgItem < cfgList.length) {
                var cfgp = parseCfg(cfgList[cfgItem]);
                var nn   = cfgp[0];
                var l    = cfgp[1];
                var ocpt = cfgp[2];
                
                var orbt = EigenSolver.solveNL(x, r, V, nn, l, ELow, EUp, ELow, EUp, 1);
                if (orbt!=-1) {
                    orbt.ocpt = ocpt;
                    orbtList.push(orbt);
                }
                
                cfgItem++;
                
                setTimeout(function() {shootCfgItem();}, 0);
            } else {
                // Compute rho from orbtList
                for (var i=0; i<n; i++) {
                    rho[i] = 0;
                }
                for (var i=0; i<orbtList.length; i++) {
                    var R = orbtList[i].R;
                    var ocpt = orbtList[i].ocpt;
                    for (var j=0; j<n; j++) {
                        rho[j] += ocpt*R[j]*R[j]/(4*Math.PI);
                    }
                }
                
                // Compute Zeff from rho
                var sum = 0;
                for (var i=0; i<n; i++) {
                    sum += rho[i]*dx*r[i]*r[i]*r[i]*(4*Math.PI);
                    Zeff[i] = Z - sum;
                }
                
                plotAll();
                
             // Compute new potential
                var VH = null, Vxc = null;
                if (orbtList.length > 0) {
                    // Hartree potential
                    VH = new Float64Array(n);
                    for (var i=0; i<orbtList.length; i++) {
                        var u = orbtList[i].u;
                        var ocpt = orbtList[i].ocpt;
                        var aVHi = VHi(r, u);
                        for (var j=0; j<n; j++) {
                            VH[j] += ocpt*aVHi[j];
                        }
                    }
                    
                    // Exchange-correlation potential
                    switch (xcList.selectedIndex) {
                    case 0:
                        Vxc = new Float64Array(n);
                        break;
                    case 1:
                        Vxc = VxcKSG(rho);
                        break;
                    case 2:
                        Vxc = VxcHL(rho);
                        break;
                    case 3:
                        Vxc = VxcGLW(rho);
                        break;
                    case 4:
                        Vxc = VxcVBH(rho);
                        break;
                    case 5:
                        Vxc = VxcCAPZ(rho);
                        break;
                    case 6:
                        Vxc = VxcCAVWN(rho);
                        break;
                    default:
                        Vxc = VxcCAVWN(rho);
                        break;
                    }
                    
                    // Mix V
                    var alpha = 0.5;
                    for (var i=0; i<n; i++) {
                        Vnew[i] = (1-alpha)*V[i] + alpha*(-Z/r[i] + VH[i] + Vxc[i]);
                    }
                }
                
                // Total energy
                var exc;
                switch (xcList.selectedIndex) {
                case 0:
                    exc = new Float64Array(n);
                    break;
                case 1:
                    exc = excKSG(rho);
                    break;
                case 2:
                    exc = excHL(rho);
                    break;
                case 3:
                    exc = excGLW(rho);
                    break;
                case 4:
                    exc = excVBH(rho);
                    break;
                case 5:
                    exc = excCAPZ(rho);
                    break;
                case 6:
                    exc = excCAVWN(rho);
                    break;
                default:
                    exc = excCAVWN(rho);
                    break;
                }
                var Eee = 0;
                var Exc = 0;
                var Evxc = 0;
                var fourPI = 4*Math.PI;
                for (var i=0; i<n-1; i++) {
                    Eee += 0.5*fourPI*0.5*(rho[i+1]*VH[i+1]*r[i+1]*r[i+1]+rho[i]*VH[i]*r[i]*r[i])*(r[i+1]-r[i]);
                    Exc += fourPI*0.5*(rho[i+1]*exc[i+1]*r[i+1]*r[i+1]+rho[i]*exc[i]*r[i]*r[i])*(r[i+1]-r[i]);
                    Evxc += fourPI*0.5*(rho[i+1]*Vxc[i+1]*r[i+1]*r[i+1]+rho[i]*Vxc[i]*r[i]*r[i])*(r[i+1]-r[i]);
                }
                var Eeig = 0;
                for (var i=0; i<orbtList.length; i++) {
                    var ocpt = orbtList[i].ocpt;
                    Eeig += ocpt*orbtList[i].E;
                }
                Etot = Eeig - Eee - Evxc + Exc;
                
                EtotDiv.innerHTML = "Total Energy = " + (Etot*energyUnit).toFixed(3);
                
                // Compute convergence
                cnvg = 0;
                for (var i=0; i<n; i++) {
                    cnvg += (Vnew[i]-V[i])*(Vnew[i]-V[i]);
                }
                
                // Update dialog
                iterText.value += "iter = " + (iter<10?"0"+iter:iter) + ", converge = " + cnvg.toPrecision(3) + "\n";
                iterText.scrollTop = iterText.scrollHeight;
                
                /*
                // Compare numerical to exact
                var checkString = "Numer    Exact    AbsEr    RelEr\n";
                for (var i=0; i<orbtList.length; i++) {
                    var nn = parseCfg(cfgList[i])[0];
                    Enum = orbtList[i].E*energyUnit;
                    Eexc = -0.5*Z*Z/(nn*nn)*energyUnit;
                    checkString += Enum.toFixed(3) + "    " + Eexc.toFixed(3) + "    " + Math.abs(Enum-Eexc).toFixed(3) + "    " + Math.abs((Enum-Eexc)/Eexc).toFixed(3) + "\n";
                }
                alert(checkString);
                */
                
                // Check convergence
                if (repeat == true) {
                    if (cnvg <= 1e-6) {
                        alert("Solution converged!");
                        repeat = false;
                    }
                }
                
                prgsBar.value = 0;
                
                if (repeat == true) {
                    stepClickHandler(true);
                } else {
                    fullButton.disabled = "";
                    stepButton.disabled = "";
                    stopButton.disabled = "disabled";
                    visualButton.disabled = "";
                    cfgText.disabled = "";
                    xcList.disabled = "";
                }
            }
        }
        setTimeout(function() {shootCfgItem();}, 0);
    }
    
    function stopClickHandler() {
        stopFlag = true;
    }
    
    // Toggle R(r) and r(r) plots
    function RuToggleHandler(evt) {
        if (evt.keyCode == 84) {
            isU = !isU;
            if (isU) {
                RPainter.setTitle("Energy and u");
            } else {
                RPainter.setTitle("Energy and R");
            }
            plot1();
        }
    }
    
    // Toggle log(rho) and rho*r*r plots
    function logRToggleHandler(evt) {
        if (evt.keyCode == 84) {
            isLogR = !isLogR;
            if (isLogR) {
                rhoPainter.setTitle("log(rho)");
                rhoPainter.setYRange(-5, 1.25*Math.log(Z));
            } else {
                rhoPainter.setTitle("rho*r*r");
                rhoPainter.setYRange(0, 0.15*Z);
            }
            plot2();
        }
    }
    
    // Toggle Zeff and log(Zeff) plots
    function logZToggleHandler(evt) {
        if (evt.keyCode == 84) {
            isLogZ = !isLogZ;
            if (isLogZ) {
                ZeffPainter.setTitle("log(Zeff)");
                ZeffPainter.setYRange(-2, Math.log(Z)/Math.log(10));
            } else {
                ZeffPainter.setTitle("Zeff");
                ZeffPainter.setYRange(0, Z);
            }
            plot3();
        }
    }
    
    function unitChangeHandler() {
        var lengthScale = 1;
        if (lengthList.selectedIndex == 0) {
            // Bohr radius
            lengthScale = 1/lengthUnit;
            lengthUnit = 1;
        } else {
            // angstrom
            lengthScale = 0.529/lengthUnit;
            lengthUnit = 0.529;
        }
        var energyScale = 1;
        if (energyList.selectedIndex == 0) {
            // Hartree
            energyScale = 1/energyUnit;
            energyUnit = 1;
        } else if (energyList.selectedIndex == 1) {
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
        
        // Reset x range for double click reset
        RPainter.setXRange(0, 3.5*lengthUnit);
        rhoPainter.setXRange(0, 3.5*lengthUnit);
        ZeffPainter.setXRange(0, 3.5*lengthUnit);
        
        // Reset y range for double click reset
        RPainter.setYRange((-1.05*0.5*Z*Z)*energyUnit, (0.05*0.5*Z*Z)*energyUnit);
        if (isLogR) {
            rhoPainter.setYRange(-5, 1.25*Math.log(Z));
        } else {
            rhoPainter.setYRange(0, 0.2*Z);
        }
        if (isLogZ) {
            ZeffPainter.setYRange(-5, Math.log(Z)/Math.log(10));
        } else {
            ZeffPainter.setYRange(0, Z);
        }
        
        RPainter.refreshFlag = true;
        rhoPainter.refreshFlag = true;
        ZeffPainter.refreshFlag = true;
        
        // Reset x range
        RPainter.setXRange(RxMin*lengthScale, RxMax*lengthScale);
        rhoPainter.setXRange(rhoxMin*lengthScale, rhoxMax*lengthScale);
        ZeffPainter.setXRange(ZeffxMin*lengthScale, ZeffxMax*lengthScale);
        
        // Reset y range
        RPainter.setYRange(RyMin*energyScale, RyMax*energyScale);
        rhoPainter.setYRange(rhoyMin, rhoyMax);
        ZeffPainter.setYRange(ZeffyMin, ZeffyMax);
        
        RPainter.refreshFlag = false;
        rhoPainter.refreshFlag = false;
        ZeffPainter.refreshFlag = false;
        
        plotAll();
        
        EtotDiv.innerHTML = "Total Energy = " + (Etot*energyUnit).toFixed(3);
    }
    
    // Visualize JSON data
    function visualClickHandler() {
        // Create jsonString
        var jsonString = "";
        if (orbtList.length > 0) {
            jsonString =  "{\n";
            jsonString += "\"elem\" : \"" + elem.getElementsByClassName("sym")[0].innerHTML + "\",\n";
            jsonString += "\"Z\" : " + Z + ",\n";
            jsonString += "\"cfg\" : \"" + cfgText.value + "\",\n";
            jsonString += "\"cnvg\" : " + cnvg + ",\n";
            jsonString += "\"rMin\" : " + rMinZ/Z + ",\n";
            jsonString += "\"rMax\" : " + rMax + ",\n";
            jsonString += "\"dx\" : " + dx + ",\n";
            jsonString += "\"r\" : " + ArrayToString(r) + ",\n";
            jsonString += "\"V\" : " + ArrayToString(V) + ",\n";
            jsonString += "\"rho\" : " + ArrayToString(rho) + ",\n";
            jsonString += "\"Zeff\" : " + ArrayToString(Zeff) + ",\n";
            jsonString += "\"orbtList\" : [\n";
            
            for (var i=0; i<orbtList.length; i++) {
                var R    = orbtList[i].R;
                var E    = orbtList[i].E;
                var n    = orbtList[i].n;
                var l    = orbtList[i].l;
                var ocpt = orbtList[i].ocpt;
                
                jsonString += "{\n";
                jsonString += "\"E\" : " + E + ",\n";
                jsonString += "\"n\" : " + n + ",\n";
                jsonString += "\"l\" : " + l + ",\n";
                jsonString += "\"ocpt\" : " + ocpt + ",\n";
                jsonString += "\"R\" : " + ArrayToString(R) + "\n";
                jsonString += "}";
                if (i != orbtList.length-1) {
                    jsonString += ",";
                }
                jsonString += "\n";
            }
            jsonString += "]\n}\n";
        } else {
            alert("No orbital data available.");
        }
        
        // Parse jsonString
        try {
            var jsonData = JSON.parse(jsonString);
        } catch(e) {
            alert("Expect orbital data!");
            return -1;
        }
        cnvgJS     = jsonData.cnvg;
        rMinJS     = jsonData.rMin;
        dxJS       = jsonData.dx;
        rJS        = jsonData.r;
        orbtListJS = jsonData.orbtList;
        
        if (cnvgJS > 1e7) {
            var msg = confirm("You are trying to plot the atomic orbital with very poor convergence. This may take very long as the sampling curve may not fit. Continue any way?");
            if (msg == false) {
                return -1;
            }
        }
        
        // Update nlList
        nlList.length = 0;
        for (var i=0; i<orbtListJS.length; i++) {
            var option = document.createElement("option");
            var lStr;
            switch (orbtListJS[i].l) {
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
            option.text = orbtListJS[i].n + lStr;
            nlList.add(option, null);
        }
        nlList.selectedIndex = orbtListJS.length-1;
        
        // Invoke nlChangeHandler
        nlChangeHandler();
        
        function ArrayToString(arr) {
            var n = arr.length;
            var str = "[" + arr[0];
            for (var i=0; i<n; i++) {
                str += ", " + arr[i];
            }
            str += "]";
            return str;
        }
    }
    
    // On nlList change
    function nlChangeHandler() {
        var nlIdx = nlList.selectedIndex;
        var l = orbtListJS[nlIdx].l;
        
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
        mList.selectedIndex = 2*l+1;
        
        // Invoke mChangeHandler
        mChangeHandler();
    }
    
    // On mList change
    function mChangeHandler() {
        var nlIdx = nlList.selectedIndex;
        var mIdx  = mList.selectedIndex;
        
        var E = orbtListJS[nlIdx].E;
        var l = orbtListJS[nlIdx].l;
        var R = orbtListJS[nlIdx].R;
        
        var isReal = false;
        
        var cc, ll, mm;
        if (mIdx <= 2*l) {
            // Pure harmonics
            isReal = false;
            cc = [new Complex(1,0)]; ll = [orbtListJS[nlIdx].l]; mm = [mIdx - l];
        } else {
            // Real harmonics
            isReal = true;
            
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
        var beta = Math.sqrt(-2*E);
        var A = Math.abs(R[0])/Math.exp(-beta*rJS[0]);
        for (var i=1; i<R.length; i++) {
            if (Math.abs(R[i]) > 0.001*max) {
                var Ai = Math.abs(R[i])/Math.exp(-beta*rJS[i]);
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
                            
                            if (isReal) {
                                if (Ysum.re>=0) {
                                    pointColors.push(1);
                                    pointColors.push(0);
                                    pointColors.push(0);
                                } else {
                                    pointColors.push(0);
                                    pointColors.push(0);
                                    pointColors.push(1);
                                }
                                pointColors.push(1);
                            } else {
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
                            }
                            
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
            return (Math.log(Z*ri)-Math.log(Z*rMinJS))/dxJS;
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
                console.log("Invalid arguments for Plm.");
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
        for (var i=0; i<orbtList.length; i++) {
            var u = orbtList[i].u;
            var R = orbtList[i].R;
            var E = orbtList[i].E;
            var n = orbtList[i].n;
            var l = orbtList[i].l;
            var ocpt = orbtList[i].ocpt;
            RPainter.plotEnergy(E*energyUnit, n+spdList[l]+ocpt, colorList[l]);
            if (isU) {
                RPainter.plot(scaleL(r), ROnE(u, 0.1*Z*energyUnit, E*energyUnit), colorList[l]);
            } else {
                RPainter.plot(scaleL(r), ROnE(R, 0.1*Z*energyUnit, E*energyUnit), colorList[l]);
            }
        }
    }
    
    function plot2() {
        if (orbtList.length == 0) {
            rhoPainter.plot([0], [0], "rgb(255,255,255)");
        } else {
            if (isLogR) {
                var log10 = Math.log(10);
                var rholog = new Float64Array(rho.length);
                for (var i=0; i<rho.length; i++) {
                    rholog[i] = Math.log(rho[i])/log10;
                }
                rhoPainter.plot(scaleL(r), rholog, "rgb(0, 0, 255)");
            } else {
                var rhorr = new Float64Array(rho.length);
                for (var i=0; i<rho.length; i++) {
                    rhorr[i] = rho[i]*r[i]*r[i];
                }
                rhoPainter.plot(scaleL(r), rhorr, "rgb(0, 0, 255)");
            }
        }
    }
    
    function plot3() {
        if (orbtList.length == 0) {
            ZeffPainter.plot([0], [0], "rgb(255,255,255)");
        } else {
            if (isLogZ) {
                var log10 = Math.log(10);
                var Zefflog = new Float64Array(Zeff.length);
                for (var i=0; i<Zeff.length; i++) {
                    Zefflog[i] = Math.log(Zeff[i])/log10;
                }
                ZeffPainter.plot(scaleL(r), Zefflog, "rgb(0, 0, 255)");
            } else {
                ZeffPainter.plot(scaleL(r), Zeff, "rgb(0, 0, 255)");
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
    };
    
    // Parse electron configuration string
    function parseCfg(cfg) {
        // Regular expression for understanding cfg format
        var dReg    = /\d+/g;
        var lReg    = /[spdfgh]/;
        
        var nStr    = cfg.match(dReg)[0];
        var lStr    = cfg.match(lReg);
        var ocptStr = cfg.match(dReg)[1];
        
        var n = parseFloat(nStr);
        var l;
        switch (lStr.toString()) {
        case "s":
            l = 0;
            break;
        case "p":
            l = 1;
            break;
        case "d":
            l = 2;
            break;
        case "f":
            l = 3;
            break;
        case "g":
            l = 4;
            break;
        case "h":
            l = 5;
            break;
        default:
            l = 0;
        }
        var ocpt = parseFloat(ocptStr);
        
        return [n, l, ocpt];
    }
    
    // 1 electron contribution to Hartree potential
    function VHi(r, u) {
        var n    = r.length;
        var rmax = r[n-1];
        
        var aVHi = new Float64Array(n);
        
        var aQi = Qi(r, u);
        
        aVHi[n-1] = 1/rmax;
        for (var i=n-2; i>=0; i--) {
            aVHi[i] = aVHi[i+1] + 0.5*(aQi[i+1]/(r[i+1]*r[i+1])+aQi[i]/(r[i]*r[i]))*(r[i+1]-r[i]);
        }
        
        return aVHi;
    }
    
    // 1 electron contribution to charge 
    function Qi(r, u) {
        var n = r.length;
        var aQi = new Float64Array(n);
        
        for (var i=1; i<n-1; i++) {
            aQi[i] = aQi[i-1] + 0.5*(u[i+1]*u[i+1]+u[i]*u[i])*(r[i+1]-r[i]);
        }
        aQi[n-1] = 1;
        
        return aQi;
    }
    
    // Exchange-correlation potential correction
    function VxcKSG(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            Vxc[i] = -1/(Math.PI*alpha*rs[i]);
        }
        
        return Vxc;
    }
    
    function VxcHL(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 21.0;
        var Cp    = 0.0225;
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            Vxc[i] = -1/(Math.PI*alpha*rs[i]) - Cp*Math.log(1+Ap/rs[i]);
        }
        
        return Vxc;
    }
    
    function VxcGLW(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 11.4;
        var Cp    = 0.0333;
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            Vxc[i] = -1/(Math.PI*alpha*rs[i]) - Cp*Math.log(1+Ap/rs[i]);
        }
        
        return Vxc;
    }
    
    function VxcVBH(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 30.0;
        var Cp    = 0.0252;
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            Vxc[i] = -1/(Math.PI*alpha*rs[i]) - Cp*Math.log(1+Ap/rs[i]);
        }
        
        return Vxc;
    }
    
    function VxcCAPZ(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var gamma = -0.07115;
        var beta1 = 1.0529;
        var beta2 = 0.3334;
        var A     = 0.01555;
        var B     = -0.024;
        var C     = 0.0010;
        var D     = -0.0058;
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            var rsSqrt = Math.sqrt(rs[i]);
            var rsLn   = Math.log(rs[i]);
            if (!isFinite(rs[i])) {
                Vxc[i] = 0;
            } else if (rs[i] >= 1) {
                Vxc[i] = -1/(Math.PI*alpha*rs[i]) + gamma*(1+7/6*beta1*rsSqrt+4/3*beta2*rs[i])/(1+beta1*rsSqrt+beta2*rs[i]);
            } else {
                Vxc[i] = -1/(Math.PI*alpha*rs[i]) + (A*rsLn+(B-A/3)+2/3*C*rs[i]*rsLn+(2*D-C)/3*rs[i]);
            }
        }
        
        return Vxc;
    }
    
    function VxcCAVWN(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var A     = 0.0310907;
        var b     = 3.72744;
        var c     = 12.9352;
        var x0    = -0.10498;
        var b1    = 9.81379;
        var b2    = 2.82224;
        var b3    = 0.736412;
        var Q     = Math.sqrt(4*c-b*b);
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            var rsSqrt = Math.sqrt(rs[i]);
            var Xr = rs[i] + b*rsSqrt + c;
            if (!isFinite(rs[i])) {
                Vxc[i] = 0;
            } else {
                var eps = A*(Math.log(rs[i]/Xr) + 2*b/Q*Math.atan(Q/(2*rsSqrt+b)) - b*x0/(x0*x0+b*x0+c)*(Math.log((rsSqrt-x0)*(rsSqrt-x0)/Xr)+2*(b+2*x0)/Q*Math.atan(Q/(2*rsSqrt+b))));
                Vxc[i] = -1/(Math.PI*alpha*rs[i]) + (eps - A/3 * (1+b1*rsSqrt)/(1+b1*rsSqrt+b2*rs[i]+b3*Math.sqrt(rs[i]*rs[i]*rs[i])));
            }
        }
        
        return Vxc;
    }
    
    // Exchange-correlation energy density
    function excKSG(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        
        var exc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            exc[i] = -0.75/(Math.PI*alpha*rs[i]);
        }
        
        return exc;
    }
    
    function excHL(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 21.0;
        var Cp    = 0.0225;
        
        var exc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            var xp = rs[i]/Ap;
            exc[i] = -0.75/(Math.PI*alpha*rs[i]) - Cp*((1+xp*xp*xp)*Math.log(1+1/xp)+0.5*xp-xp*xp-1/3);
        }
        
        return exc;
    }
    
    function excGLW(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 11.4;
        var Cp    = 0.0333;
        
        var exc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            var xp = rs[i]/Ap;
            exc[i] = -0.75/(Math.PI*alpha*rs[i]) - Cp*((1+xp*xp*xp)*Math.log(1+1/xp)+0.5*xp-xp*xp-1/3);
        }
        
        return exc;
    }
    
    function excVBH(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var Ap    = 30.0;
        var Cp    = 0.0252;
        
        var exc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            var xp = rs[i]/Ap;
            exc[i] = -0.75/(Math.PI*alpha*rs[i]) - Cp*((1+xp*xp*xp)*Math.log(1+1/xp)+0.5*xp-xp*xp-1/3);
        }
        
        return exc;
    }
    
    function excCAPZ(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var gamma = -0.07115;
        var beta1 = 1.0529;
        var beta2 = 0.3334;
        var A     = 0.01555;
        var B     = -0.024;
        var C     = 0.0010;
        var D     = -0.0058;
        
        var exc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            var rsSqrt = Math.sqrt(rs[i]);
            var rsLn   = Math.log(rs[i]);
            if (!isFinite(rs[i])) {
                exc[i] = 0;
            } else if (rs[i] >= 1) {
                exc[i] = -0.75/(Math.PI*alpha*rs[i]) + gamma/(1+beta1*rsSqrt+beta2*rs[i]);
            } else {
                exc[i] = -0.75/(Math.PI*alpha*rs[i]) + (A*rsLn+B+C*rs[i]*rsLn+D*rs[i]);
            }
        }
        
        return exc;
    }
    
    function excCAVWN(rho) {
        var n = rho.length;
        var rs = new Float64Array(n);
        for (var i=0; i<n; i++) {
            rs[i] = Math.pow(3/(4*Math.PI*rho[i]), 1/3);
        }
        
        var alpha = Math.pow(4/(9*Math.PI), 1/3);
        var A     = 0.0310907;
        var b     = 3.72744;
        var c     = 12.9352;
        var x0    = -0.10498;
        var Q     = Math.sqrt(4*c-b*b);
        
        var exc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            var rsSqrt = Math.sqrt(rs[i]);
            var Xr = rs[i] + b*rsSqrt + c;
            if (!isFinite(rs[i])) {
                exc[i] = 0;
            } else {
                var eps = A*(Math.log(rs[i]/Xr) + 2*b/Q*Math.atan(Q/(2*rsSqrt+b)) - b*x0/(x0*x0+b*x0+c)*(Math.log((rsSqrt-x0)*(rsSqrt-x0)/Xr)+2*(b+2*x0)/Q*Math.atan(Q/(2*rsSqrt+b))));
                exc[i] = -0.75/(Math.PI*alpha*rs[i]) + eps;
            }
        }
        
        return exc;
    }
};
