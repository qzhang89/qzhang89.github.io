/*
 * SCF.js
 * Self-consistency by SCF approximation
 * Need to include EigenSolver.js, Painter.js
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
    var Rcw       = typeof jsonData.Rcw    === "undefined" ? 0.30  : jsonData.Rcw;
    var Rch       = typeof jsonData.Rch    === "undefined" ? 0.25  : jsonData.Rch;
    var rhocw     = typeof jsonData.rhocw  === "undefined" ? 0.30  : jsonData.rhocw;
    var rhoch     = typeof jsonData.rhoch  === "undefined" ? 0.25  : jsonData.rhoch;
    var Zeffcw    = typeof jsonData.Zeffcw === "undefined" ? 0.30  : jsonData.Zeffcw;
    var Zeffch    = typeof jsonData.Zeffch === "undefined" ? 0.25  : jsonData.Zeffch;
    
    // Add HTML elements
    var html = "";
    html += "<table>" +
            "<tr>" +
            "<th class='w8'>Group</th>" +
            "<th class='w5'>1</th>" +
            "<th class='w5'>2</th>" +
            "<th class='w2'>&nbsp;</th>" +
            "<th class='w5'>3</th>" +
            "<th class='w5'>4</th>" +
            "<th class='w5'>5</th>" +
            "<th class='w5'>6</th>" +
            "<th class='w5'>7</th>" +
            "<th class='w5'>8</th>" +
            "<th class='w5'>9</th>" +
            "<th class='w5'>10</th>" +
            "<th class='w5'>11</th>" +
            "<th class='w5'>12</th>" +
            "<th class='w5'>13</th>" +
            "<th class='w5'>14</th>" +
            "<th class='w5'>15</th>" +
            "<th class='w5'>16</th>" +
            "<th class='w5'>17</th>" +
            "<th class='w5'>18</th>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>Period</th>" +
            "<td colspan='19'></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>1</th>" +
            "<td class='elem xs'><div class='at_num'>1</div><abbr class='sym' title='hydrogen'>H</abbr><div class='at_wt'>1.008</div></td>" +
            "<td colspan='17'></td>" +
            "<td class='elem xs'><div class='at_num'>2</div><abbr class='sym' title='helium'>He</abbr><div class='at_wt'>4.0026</div></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>2</th>" +
            "<td class='elem xs'><div class='at_num'>3</div><abbr class='sym' title='lithium'>Li</abbr><div class='at_wt'>6.94</div></td>" +
            "<td class='elem xs'><div class='at_num'>4</div><abbr class='sym' title='beryllium'>Be</abbr><div class='at_wt'>9.0122</div></td>" +
            "<td colspan='11'></td>" +
            "<td class='elem xp'><div class='at_num'>5</div><abbr class='sym' title='boron'>B</abbr><div class='at_wt'>10.81</div></td>" +
            "<td class='elem xp'><div class='at_num'>6</div><abbr class='sym' title='carbon'>C</abbr><div class='at_wt'>12.011</div></td>" +
            "<td class='elem xp'><div class='at_num'>7</div><abbr class='sym' title='nitrogen'>N</abbr><div class='at_wt'>14.007</div></td>" +
            "<td class='elem xp'><div class='at_num'>8</div><abbr class='sym' title='oxygen'>O</abbr><div class='at_wt'>15.999</div></td>" +
            "<td class='elem xp'><div class='at_num'>9</div><abbr class='sym' title='fluorine'>F</abbr><div class='at_wt'>18.998</div></td>" +
            "<td class='elem xp'><div class='at_num'>10</div><abbr class='sym' title='neon'>Ne</abbr><div class='at_wt'>20.180</div></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>3</th>" +
            "<td class='elem xs'><div class='at_num'>11</div><abbr class='sym' title='sodium'>Na</abbr><div class='at_wt'>22.990</div></td>" +
            "<td class='elem xs'><div class='at_num'>12</div><abbr class='sym' title='magnesium'>Mg</abbr><div class='at_wt'>24.305</div></td>" +
            "<td colspan='11'></td>" +
            "<td class='elem xp'><div class='at_num'>13</div><abbr class='sym' title='aluminium (aluminum in US)'>Al</abbr><div class='at_wt'>26.982</div></td>" +
            "<td class='elem xp'><div class='at_num'>14</div><abbr class='sym' title='silicon'>Si</abbr><div class='at_wt'>28.085</div></td>" +
            "<td class='elem xp'><div class='at_num'>15</div><abbr class='sym' title='phosphorus'>P</abbr><div class='at_wt'>30.974</div></td>" +
            "<td class='elem xp'><div class='at_num'>16</div><abbr class='sym' title='sulfur (sulphur in UK and elsewhere)'>S</abbr><div class='at_wt'>32.06</div></td>" +
            "<td class='elem xp'><div class='at_num'>17</div><abbr class='sym' title='chlorine'>Cl</abbr><div class='at_wt'>35.45</div></td>" +
            "<td class='elem xp'><div class='at_num'>18</div><abbr class='sym' title='argon'>Ar</abbr><div class='at_wt'>39.948</div></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>4</th>" +
            "<td class='elem xs'><div class='at_num'>19</div><abbr class='sym' title='potassium'>K</abbr><div class='at_wt'>39.098</div></td>" +
            "<td class='elem xs'><div class='at_num'>20</div><abbr class='sym' title='calcium'>Ca</abbr><div class='at_wt'>40.078</div></td>" +
            "<td></td>" +
            "<td class='elem xd'><div class='at_num'>21</div><abbr class='sym' title='scandium'>Sc</abbr><div class='at_wt'>44.956</div></td>" +
            "<td class='elem xd'><div class='at_num'>22</div><abbr class='sym' title='titanium'>Ti</abbr><div class='at_wt'>47.867</div></td>" +
            "<td class='elem xd'><div class='at_num'>23</div><abbr class='sym' title='vanadium'>V</abbr><div class='at_wt'>50.942</div></td>" +
            "<td class='elem xd'><div class='at_num'>24</div><abbr class='sym' title='chromium'>Cr</abbr><div class='at_wt'>51.996</div></td>" +
            "<td class='elem xd'><div class='at_num'>25</div><abbr class='sym' title='manganese'>Mn</abbr><div class='at_wt'>54.938</div></td>" +
            "<td class='elem xd'><div class='at_num'>26</div><abbr class='sym' title='iron'>Fe</abbr><div class='at_wt'>55.845</div></td>" +
            "<td class='elem xd'><div class='at_num'>27</div><abbr class='sym' title='cobalt'>Co</abbr><div class='at_wt'>58.933</div></td>" +
            "<td class='elem xd'><div class='at_num'>28</div><abbr class='sym' title='nickel'>Ni</abbr><div class='at_wt'>58.693</div></td>" +
            "<td class='elem xd'><div class='at_num'>29</div><abbr class='sym' title='copper'>Cu</abbr><div class='at_wt'>63.546</div></td>" +
            "<td class='elem xd'><div class='at_num'>30</div><abbr class='sym' title='zinc'>Zn</abbr><div class='at_wt'>65.38</div></td>" +
            "<td class='elem xp'><div class='at_num'>31</div><abbr class='sym' title='gallium'>Ga</abbr><div class='at_wt'>69.723</div></td>" +
            "<td class='elem xp'><div class='at_num'>32</div><abbr class='sym' title='germanium'>Ge</abbr><div class='at_wt'>72.63</div></td>" +
            "<td class='elem xp'><div class='at_num'>33</div><abbr class='sym' title='arsenic'>As</abbr><div class='at_wt'>74.922</div></td>" +
            "<td class='elem xp'><div class='at_num'>34</div><abbr class='sym' title='selenium'>Se</abbr><div class='at_wt'>78.96</div></td>" +
            "<td class='elem xp'><div class='at_num'>35</div><abbr class='sym' title='bromine'>Br</abbr><div class='at_wt'>79.904</div></td>" +
            "<td class='elem xp'><div class='at_num'>36</div><abbr class='sym' title='krypton'>Kr</abbr><div class='at_wt'>83.798</div></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>5</th>" +
            "<td class='elem xs'><div class='at_num'>37</div><abbr class='sym' title='rubidium'>Rb</abbr><div class='at_wt'>85.468</div></td>" +
            "<td class='elem xs'><div class='at_num'>38</div><abbr class='sym' title='strontium'>Sr</abbr><div class='at_wt'>87.62</div></td>" +
            "<td></td>" +
            "<td class='elem xd'><div class='at_num'>39</div><abbr class='sym' title='yttrium'>Y</abbr><div class='at_wt'>88.906</div></td>" +
            "<td class='elem xd'><div class='at_num'>40</div><abbr class='sym' title='zirconium'>Zr</abbr><div class='at_wt'>91.224</div></td>" +
            "<td class='elem xd'><div class='at_num'>41</div><abbr class='sym' title='niobium'>Nb</abbr><div class='at_wt'>92.906</div></td>" +
            "<td class='elem xd'><div class='at_num'>42</div><abbr class='sym' title='molybdenum'>Mo</abbr><div class='at_wt'>95.96</div></td>" +
            "<td class='elem xd'><div class='at_num'>43</div><abbr class='sym' title='technetium'>Tc</abbr><div class='at_wt'>[97.91]</div></td>" +
            "<td class='elem xd'><div class='at_num'>44</div><abbr class='sym' title='ruthenium'>Ru</abbr><div class='at_wt'>101.07</div></td>" +
            "<td class='elem xd'><div class='at_num'>45</div><abbr class='sym' title='rhodium'>Rh</abbr><div class='at_wt'>102.91</div></td>" +
            "<td class='elem xd'><div class='at_num'>46</div><abbr class='sym' title='palladium'>Pd</abbr><div class='at_wt'>106.42</div></td>" +
            "<td class='elem xd'><div class='at_num'>47</div><abbr class='sym' title='silver'>Ag</abbr><div class='at_wt'>107.87</div></td>" +
            "<td class='elem xd'><div class='at_num'>48</div><abbr class='sym' title='cadmium'>Cd</abbr><div class='at_wt'>112.41</div></td>" +
            "<td class='elem xp'><div class='at_num'>49</div><abbr class='sym' title='indium'>In</abbr><div class='at_wt'>114.82</div></td>" +
            "<td class='elem xp'><div class='at_num'>50</div><abbr class='sym' title='tin'>Sn</abbr><div class='at_wt'>118.71</div></td>" +
            "<td class='elem xp'><div class='at_num'>51</div><abbr class='sym' title='antimony'>Sb</abbr><div class='at_wt'>121.76</div></td>" +
            "<td class='elem xp'><div class='at_num'>52</div><abbr class='sym' title='tellurium'>Te</abbr><div class='at_wt'>127.60</div></td>" +
            "<td class='elem xp'><div class='at_num'>53</div><abbr class='sym' title='iodine'>I</abbr><div class='at_wt'>126.90</div></td>" +
            "<td class='elem xp'><div class='at_num'>54</div><abbr class='sym' title='xenon'>Xe</abbr><div class='at_wt'>131.29</div></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>6 </th>" +
            "<td class='elem xs'><div class='at_num'>55</div><abbr class='sym' title='caesium (cesium in US)'>Cs</abbr><div class='at_wt'>132.91</div></td>" +
            "<td class='elem xs'><div class='at_num'>56</div><abbr class='sym' title='barium'>Ba</abbr><div class='at_wt'>137.33</div></td>" +
            "<th class='asterisk'>*</th>" +
            "<td class='elem xd'><div class='at_num'>71</div><abbr class='sym' title='lutetium'>Lu</abbr><div class='at_wt'>174.97</div></td>" +
            "<td class='elem xd'><div class='at_num'>72</div><abbr class='sym' title='hafnium'>Hf</abbr><div class='at_wt'>178.49</div></td>" +
            "<td class='elem xd'><div class='at_num'>73</div><abbr class='sym' title='tantalum'>Ta</abbr><div class='at_wt'>180.95</div></td>" +
            "<td class='elem xd'><div class='at_num'>74</div><abbr class='sym' title='tungsten'>W</abbr><div class='at_wt'>183.84</div></td>" +
            "<td class='elem xd'><div class='at_num'>75</div><abbr class='sym' title='rhenium'>Re</abbr><div class='at_wt'>186.21</div></td>" +
            "<td class='elem xd'><div class='at_num'>76</div><abbr class='sym' title='osmium'>Os</abbr><div class='at_wt'>190.23</div></td>" +
            "<td class='elem xd'><div class='at_num'>77</div><abbr class='sym' title='iridium'>Ir</abbr><div class='at_wt'>192.22</div></td>" +
            "<td class='elem xd'><div class='at_num'>78</div><abbr class='sym' title='platinum'>Pt</abbr><div class='at_wt'>195.08</div></td>" +
            "<td class='elem xd'><div class='at_num'>79</div><abbr class='sym' title='gold'>Au</abbr><div class='at_wt'>196.97</div></td>" +
            "<td class='elem xd'><div class='at_num'>80</div><abbr class='sym' title='mercury'>Hg</abbr><div class='at_wt'>200.59</div></td>" +
            "<td class='elem xp'><div class='at_num'>81</div><abbr class='sym' title='thallium'>Tl</abbr><div class='at_wt'>204.38</div></td>" +
            "<td class='elem xp'><div class='at_num'>82</div><abbr class='sym' title='lead'>Pb</abbr><div class='at_wt'>207.2</div></td>" +
            "<td class='elem xp'><div class='at_num'>83</div><abbr class='sym' title='bismuth'>Bi</abbr><div class='at_wt'>208.98</div></td>" +
            "<td class='elem xp'><div class='at_num'>84</div><abbr class='sym' title='polonium'>Po</abbr><div class='at_wt'>[208.98]</div></td>" +
            "<td class='elem xp'><div class='at_num'>85</div><abbr class='sym' title='astatine'>At</abbr><div class='at_wt'>[209.99]</div></td>" +
            "<td class='elem xp'><div class='at_num'>86</div><abbr class='sym' title='radon'>Rn</abbr><div class='at_wt'>[222.02]</div></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl'>7 </th>" +
            "<td class='elem xs'><div class='at_num'>87</div><abbr class='sym' title='francium'>Fr</abbr><div class='at_wt'>[223.02]</div></td>" +
            "<td class='elem xs'><div class='at_num'>88</div><abbr class='sym' title='radium'>Ra</abbr><div class='at_wt'>[226.03]</div></td>" +
            "<th class='asterisk'>**</th>" +
            "<td class='elem xd'><div class='at_num'>103</div><abbr class='sym' title='lawrencium'>Lr</abbr><div class='at_wt'>[262.11]</div></td>" +
            "<td class='elem xd'><div class='at_num'>104</div><abbr class='sym' title='rutherfordium'>Rf</abbr><div class='at_wt'>[265.12]</div></td>" +
            "<td class='elem xd'><div class='at_num'>105</div><abbr class='sym' title='dubnium'>Db</abbr><div class='at_wt'>[268.13]</div></td>" +
            "<td class='elem xd'><div class='at_num'>106</div><abbr class='sym' title='seaborgium'>Sg</abbr><div class='at_wt'>[271.13]</div></td>" +
            "<td class='elem xd'><div class='at_num'>107</div><abbr class='sym' title='bohrium'>Bh</abbr><div class='at_wt'>[270]</div></td>" +
            "<td class='elem xd'><div class='at_num'>108</div><abbr class='sym' title='hassium'>Hs</abbr><div class='at_wt'>[277.15]</div></td>" +
            "<td class='elem xd'><div class='at_num'>109</div><abbr class='sym' title='meitnerium'>Mt</abbr><div class='at_wt'>[276.15]</div></td>" +
            "<td class='elem xd'><div class='at_num'>110</div><abbr class='sym' title='darmstadtium'>Ds</abbr><div class='at_wt'>[281.16]</div></td>" +
            "<td class='elem xd'><div class='at_num'>111</div><abbr class='sym' title='roentgenium'>Rg</abbr><div class='at_wt'>[280.16]</div></td>" +
            "<td class='elem xd'><div class='at_num'>112</div><abbr class='sym' title='copernicium'>Cn</abbr><div class='at_wt'>[285.17]</div></td>" +
            "<td class='elem xp'><div class='at_num'>113</div><abbr class='sym' title='ununtrium'>Uut</abbr><div class='at_wt'>[284.18]</div></td>" +
            "<td class='elem xp'><div class='at_num'>114</div><abbr class='sym' title='flerovium'>Fl</abbr><div class='at_wt'>[289.19]</div></td>" +
            "<td class='elem xp'><div class='at_num'>115</div><abbr class='sym' title='ununpentium'>Uup</abbr><div class='at_wt'>[288.19]</div></td>" +
            "<td class='elem xp'><div class='at_num'>116</div><abbr class='sym' title='livermorium'>Lv</abbr><div class='at_wt'>[293]</div></td>" +
            "<td class='elem xp'><div class='at_num'>117</div><abbr class='sym' title='ununseptium'>Uus</abbr><div class='at_wt'>[294]</div></td>" +
            "<td class='elem xp'><div class='at_num'>118</div><abbr class='sym' title='ununoctium'>Uuo</abbr><div class='at_wt'>[294]</div></td>" +
            "</tr>" +
            "<tr>" +
            "<td>&nbsp;</td>" +
            "<td colspan='19'></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl' colspan='3'>*Lanthanoids</th>" +
            "<th class='asterisk'>*</th>" +
            "<td class='elem xf'><div class='at_num'>57</div><abbr class='sym' title='lanthanum'>La</abbr><div class='at_wt'>138.91</div></td>" +
            "<td class='elem xf'><div class='at_num'>58</div><abbr class='sym' title='cerium'>Ce</abbr><div class='at_wt'>140.12</div></td>" +
            "<td class='elem xf'><div class='at_num'>59</div><abbr class='sym' title='praseodymium'>Pr</abbr><div class='at_wt'>140.91</div></td>" +
            "<td class='elem xf'><div class='at_num'>60</div><abbr class='sym' title='neodymium'>Nd</abbr><div class='at_wt'>144.24</div></td>" +
            "<td class='elem xf'><div class='at_num'>61</div><abbr class='sym' title='promethium'>Pm</abbr><div class='at_wt'>[144.91]</div></td>" +
            "<td class='elem xf'><div class='at_num'>62</div><abbr class='sym' title='samarium'>Sm</abbr><div class='at_wt'>150.36</div></td>" +
            "<td class='elem xf'><div class='at_num'>63</div><abbr class='sym' title='europium'>Eu</abbr><div class='at_wt'>151.96</div></td>" +
            "<td class='elem xf'><div class='at_num'>64</div><abbr class='sym' title='gadolinium'>Gd</abbr><div class='at_wt'>157.25</div></td>" +
            "<td class='elem xf'><div class='at_num'>65</div><abbr class='sym' title='terbium'>Tb</abbr><div class='at_wt'>158.93</div></td>" +
            "<td class='elem xf'><div class='at_num'>66</div><abbr class='sym' title='dysprosium'>Dy</abbr><div class='at_wt'>162.50</div></td>" +
            "<td class='elem xf'><div class='at_num'>67</div><abbr class='sym' title='holmium'>Ho</abbr><div class='at_wt'>164.93</div></td>" +
            "<td class='elem xf'><div class='at_num'>68</div><abbr class='sym' title='erbium'>Er</abbr><div class='at_wt'>167.26</div></td>" +
            "<td class='elem xf'><div class='at_num'>69</div><abbr class='sym' title='thulium'>Tm</abbr><div class='at_wt'>168.93</div></td>" +
            "<td class='elem xf'><div class='at_num'>70</div><abbr class='sym' title='ytterbium'>Yb</abbr><div class='at_wt'>173.05</div></td>" +
            "<td colspan='2'></td>" +
            "</tr>" +
            "<tr>" +
            "<th class='lbl' colspan='3'>**Actinoids</th>" +
            "<th class='asterisk'>**</th>" +
            "<td class='elem xf'><div class='at_num'>89</div><abbr class='sym' title='actinium'>Ac</abbr><div class='at_wt'>[227.03]</div></td>" +
            "<td class='elem xf'><div class='at_num'>90</div><abbr class='sym' title='thorium'>Th</abbr><div class='at_wt'>232.04</div></td>" +
            "<td class='elem xf'><div class='at_num'>91</div><abbr class='sym' title='protactinium'>Pa</abbr><div class='at_wt'>231.04</div></td>" +
            "<td class='elem xf'><div class='at_num'>92</div><abbr class='sym' title='uranium'>U</abbr><div class='at_wt'>238.03</div></td>" +
            "<td class='elem xf'><div class='at_num'>93</div><abbr class='sym' title='neptunium'>Np</abbr><div class='at_wt'>[237.05]</div></td>" +
            "<td class='elem xf'><div class='at_num'>94</div><abbr class='sym' title='plutonium'>Pu</abbr><div class='at_wt'>[244.06]</div></td>" +
            "<td class='elem xf'><div class='at_num'>95</div><abbr class='sym' title='americium'>Am</abbr><div class='at_wt'>[243.06]</div></td>" +
            "<td class='elem xf'><div class='at_num'>96</div><abbr class='sym' title='curium'>Cm</abbr><div class='at_wt'>[247.07]</div></td>" +
            "<td class='elem xf'><div class='at_num'>97</div><abbr class='sym' title='berkelium'>Bk</abbr><div class='at_wt'>[247.07]</div></td>" +
            "<td class='elem xf'><div class='at_num'>98</div><abbr class='sym' title='californium'>Cf</abbr><div class='at_wt'>[251.08]</div></td>" +
            "<td class='elem xf'><div class='at_num'>99</div><abbr class='sym' title='einsteinium'>Es</abbr><div class='at_wt'>[252.08]</div></td>" +
            "<td class='elem xf'><div class='at_num'>100</div><abbr class='sym' title='fermium'>Fm</abbr><div class='at_wt'>[257.10]</div></td>" +
            "<td class='elem xf'><div class='at_num'>101</div><abbr class='sym' title='mendelevium'>Md</abbr><div class='at_wt'>[258.10]</div></td>" +
            "<td class='elem xf'><div class='at_num'>102</div><abbr class='sym' title='nobelium'>No</abbr><div class='at_wt'>[259.10]</div></td>" +
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
    html += "</select><br />";
    html += "<table>";
    html += "<tr><td><canvas></canvas></td>";
    html += "<td><canvas></canvas></td>";
    html += "<td><canvas></canvas></td></tr>";
    html += "</table><br />";
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
    html += "<textarea rows='8' cols='60' readonly></textarea><br />";
    html += "<textarea rows='8' cols='60' readonly></textarea><br />";
    html += "<input type='button' value='Output data' /> ";
    html += "<input type='button' value='Upload data' /><br />";
    container.innerHTML = html;
    
    // Get HTML elements
    var elements   = container.getElementsByClassName("elem");
    var ZText      = container.getElementsByClassName("zval")[0];
    var cfgText    = container.getElementsByTagName("input")[0];
    var RCanvas    = container.getElementsByTagName("canvas")[0];
    var rhoCanvas  = container.getElementsByTagName("canvas")[1];
    var ZeffCanvas = container.getElementsByTagName("canvas")[2];
    var xcList     = container.getElementsByTagName("select")[0];
    var fullButton = container.getElementsByTagName("input")[1];
    var stepButton = container.getElementsByTagName("input")[2];
    var stopButton = container.getElementsByTagName("input")[3];
    var prgsBar    = container.getElementsByTagName("progress")[0];
    var lengthList = container.getElementsByTagName("select")[1];
    var energyList = container.getElementsByTagName("select")[2];
    var iterText   = container.getElementsByTagName("textarea")[0];
    var jsonText   = container.getElementsByTagName("textarea")[1];
    var outputButton = container.getElementsByTagName("input")[4];
    var uploadButton = container.getElementsByTagName("input")[5];
    
    xcList.selectedIndex = 6;
    
    stopButton.disabled = "disabled";
    
    var colorList = new Array();
    colorList[0] = "rgb(0, 0, 255)";
    colorList[1] = "rgb(255, 155, 0)";
    colorList[2] = "rgb(255, 0, 0)";
    colorList[3] = "rgb(0, 200, 0)";
    colorList[4] = "rgb(155, 0, 255)";
    colorList[5] = "rgb(0, 155, 255)";
    
    var spdList = ["s", "p", "d", "f", "g", "h"];
    
    // Setup
    var Z = 26;
    var x = EigenSolver.setupGrid(Math.log(Z*rMinZ/Z), Math.log(Z*rMax), dx);
    var r = EigenSolver.x2r(x, Z);
    var V = EigenSolver.setupPotential(r, Z); // Starting potential
    var Vnew = new Float64Array(r.length);
    var orbtList = new Array();
    var rho = new Float64Array(r.length);
    var Zeff = new Float64Array(r.length);
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
    RPainter.setMargin(25, 20);
    RPainter.refresh();
    rhoPainter.setLabel("r", "");
    rhoPainter.setTitle("rho*r*r");
    rhoPainter.setTickSize(5);
    rhoPainter.setTickLabelSize(10);
    rhoPainter.setLabelSize(12);
    rhoPainter.setTitleSize(12);
    rhoPainter.setMargin(20, 20);
    rhoPainter.refresh();
    ZeffPainter.setLabel("r", "");
    ZeffPainter.setTitle("Zeff");
    ZeffPainter.setTickSize(5);
    ZeffPainter.setTickLabelSize(10);
    ZeffPainter.setLabelSize(12);
    ZeffPainter.setTitleSize(12);
    ZeffPainter.setMargin(20, 20);
    ZeffPainter.refresh();
    
    RCanvas.title += "\n6. Press \"T\" to toggle R(r) and u(r)";
    rhoCanvas.title += "\n6. Press \"T\" to toggle rho*r*r and log(rho)";
    ZeffCanvas.title += "\n6. Press \"T\" to toggle linear and log scale";
    
    // Initial plot
    plotAll();
    resize();
    
    // Add event listeners
    window.addEventListener("resize", resize, false);
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
    outputButton.addEventListener("click", outputClickHandler, false);
    uploadButton.addEventListener("click", uploadClickHandler, false);
    
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
        
        // Clear JSON textarea
        iterText.value = "";
        jsonText.value = "";
        
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
        x = EigenSolver.setupGrid(Math.log(Z*rMinZ/Z), Math.log(Z*rMax), dx);
        r = EigenSolver.x2r(x, Z);
        V = EigenSolver.setupPotential(r, Z); // Starting potential
        Vnew = new Float64Array(r.length);
        rho = new Float64Array(r.length);
        Zeff = new Float64Array(r.length);
        
        // Clear orbtList
        orbtList.length = 0;
        
        // Erase convergence
        cnvg = 1e6;
        
        // Reset x range
        RPainter.setXRange(0, 3.5*lengthUnit);
        rhoPainter.setXRange(0, 3.5*lengthUnit);
        ZeffPainter.setXRange(0, 3.5*lengthUnit);
        
        // Reset y range
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
        
        plotAll();
    }
    // Initial click
    var event = document.createEvent("HTMLEvents");
    event.initEvent("click", true, false);
    elements[25].dispatchEvent(event);
    
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
        
        if (stopFlag) {
            fullButton.disabled = "";
            stepButton.disabled = "";
            stopButton.disabled = "disabled";
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
                return -1;
            }
        }
        
        if (openStr != null) {
            cfgList = cfgList.concat(openStr);
        }
        
        if (cfgList.length == 0) {
            alert("Illegal input!\nInput should have an electron configuration format.\ne.g. [Xe]_6s2_4f14_5d10_6p2");
            stepButton.disabled = "";
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
                if (orbtList.length > 0) {
                    Vnew = updateV(r, orbtList, rho, V, Z, xcList.selectedIndex);
                }
                
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
                rhoPainter.setYRange(0, 0.2*Z);
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
                ZeffPainter.setYRange(-5, Math.log(Z)/Math.log(10));
            } else {
                ZeffPainter.setTitle("Zeff");
                ZeffPainter.setYRange(0, Z);
            }
            plot3();
        }
    }
    
    function unitChangeHandler() {
        if (lengthList.selectedIndex == 0) {
            // Bohr radius
            lengthUnit = 1;
        } else {
            // angstrom
            lengthUnit = 0.529;
        }
        
        if (energyList.selectedIndex == 0) {
            // Hartree
            energyUnit = 1;
        } else if (energyList.selectedIndex == 1) {
            // Rydberg
            energyUnit = 2;
        } else {
            // eV
            energyUnit = 27.211385;
        }
        
        // Reset x range
        RPainter.setXRange(0, 3.5*lengthUnit);
        rhoPainter.setXRange(0, 3.5*lengthUnit);
        ZeffPainter.setXRange(0, 3.5*lengthUnit);
        
        // Reset y range
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
        
        plotAll();
    }
    
    // Output JSON data
    function outputClickHandler() {
        if (orbtList.length > 0) {
            jsonText.value =  "{\n";
            jsonText.value += "\"elem\" : \"" + elem.getElementsByClassName("sym")[0].innerHTML + "\",\n";
            jsonText.value += "\"Z\" : " + Z + ",\n";
            jsonText.value += "\"cfg\" : \"" + cfgText.value + "\",\n";
            jsonText.value += "\"cnvg\" : " + cnvg + ",\n";
            jsonText.value += "\"rMin\" : " + rMinZ/Z + ",\n";
            jsonText.value += "\"rMax\" : " + rMax + ",\n";
            jsonText.value += "\"dx\" : " + dx + ",\n";
            jsonText.value += "\"r\" : " + ArrayToString(r) + ",\n";
            jsonText.value += "\"V\" : " + ArrayToString(V) + ",\n";
            jsonText.value += "\"rho\" : " + ArrayToString(rho) + ",\n";
            jsonText.value += "\"Zeff\" : " + ArrayToString(Zeff) + ",\n";
            jsonText.value += "\"orbtList\" : [\n";
            
            for (var i=0; i<orbtList.length; i++) {
                var R    = orbtList[i].R;
                var E    = orbtList[i].E;
                var n    = orbtList[i].n;
                var l    = orbtList[i].l;
                var ocpt = orbtList[i].ocpt;
                
                jsonText.value += "{\n";
                jsonText.value += "\"E\" : " + E + ",\n";
                jsonText.value += "\"n\" : " + n + ",\n";
                jsonText.value += "\"l\" : " + l + ",\n";
                jsonText.value += "\"ocpt\" : " + ocpt + ",\n";
                jsonText.value += "\"R\" : " + ArrayToString(R) + "\n";
                jsonText.value += "}";
                if (i != orbtList.length-1) {
                    jsonText.value += ",";
                }
                jsonText.value += "\n";
            }
            jsonText.value += "]\n}\n";
        } else {
            alert("No orbital data available.");
        }
        
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
    
    // Upload data to server
    function uploadClickHandler() {
        if (jsonText.value == "") {
            alert("No data available for uploading.");
            return -1;
        }
        
        // Generate file name
        var fname = "";
        fname += elem.getElementsByClassName("sym")[0].innerHTML;
        fname += "_" + cfgText.value;
        fname += ".json";
        
        // Upload
        $.post("PHP/writeJSON.php", {filename:"JSON/"+fname, data:jsonText.value}, function(msg) {
            if (msg=="0") {
                alert("File \""+fname+"\" uploaded successfully.");
            } else {
                alert("Failed in uploading file \""+fname+"\".");
            }
        });
    }
    
    // Window resize
    function resize() {
        RCanvas.width     = container.clientWidth*Rcw;
        RCanvas.height    = container.clientWidth*Rch;
        rhoCanvas.width   = container.clientWidth*rhocw;
        rhoCanvas.height  = container.clientWidth*rhoch;
        ZeffCanvas.width  = container.clientWidth*Zeffcw;
        ZeffCanvas.height = container.clientWidth*Zeffch;
        
        RPainter.refresh();
        rhoPainter.refresh();
        ZeffPainter.refresh();
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
    
    // Update V
    function updateV(r, orbtList, rho, V, Z, xcMethod) {
        var n = V.length;
        var Vnew = new Float64Array(n);
        
        // Occupied electrons contribution to potential
        var VH = new Float64Array(n);
        for (var i=0; i<orbtList.length; i++) {
            var u = orbtList[i].u;
            var ocpt = orbtList[i].ocpt;
            var aVHi = VHi(r, u);
            for (var j=0; j<n; j++) {
                VH[j] += ocpt*aVHi[j];
            }
        }
        
        // Exchange-correlation correction to the potential
        var Vxc;
        switch (xcMethod) {
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
        
        // Update V
        var alpha = 0.5;
        for (var i=0; i<n; i++) {
            Vnew[i] = (1-alpha)*V[i] + alpha*(-Z/r[i] + VH[i] + Vxc[i]);
        }
        
        return Vnew;
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
        var Cp    = 0.0450;
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            Vxc[i] = -1/(Math.PI*alpha*rs[i]) - 0.5*Cp*Math.log(1+Ap/rs[i]);
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
        var Cp    = 0.0666;
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            Vxc[i] = -1/(Math.PI*alpha*rs[i]) - 0.5*Cp*Math.log(1+Ap/rs[i]);
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
        var Cp    = 0.0504;
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            Vxc[i] = -1/(Math.PI*alpha*rs[i]) - 0.5*Cp*Math.log(1+Ap/rs[i]);
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
        var gamma = -0.1423;
        var beta1 = 1.0529;
        var beta2 = 0.3334;
        var A     = 0.0311;
        var B     = -0.048;
        var C     = 0.0020;
        var D     = -0.0116;
        
        var Vxc = new Float64Array(n);
        for (var i=0; i<n; i++) {
            var rsSqrt = Math.sqrt(rs[i]);
            var rsLn   = Math.log(rs[i]);
            if (!isFinite(rs[i])) {
                Vxc[i] = 0;
            } else if (rs[i] >= 1) {
                Vxc[i] = -1/(Math.PI*alpha*rs[i]) + 0.5*gamma/(1+beta1*rsSqrt+beta2*rs[i])*(1+7/6*beta1*rsSqrt+4/3*beta2*rs[i])/(1+beta1*rsSqrt+beta2*rs[i]);
            } else {
                Vxc[i] = -1/(Math.PI*alpha*rs[i]) + 0.5*(A*rsLn+(B-A/3)+2/3*C*rs[i]*rsLn+(2*D-C)/3*rs[i]);
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
        var A     = 0.0621814;
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
                Vxc[i] = -1/(Math.PI*alpha*rs[i]) + 0.5*(eps - A/3 * (1+b1*rsSqrt)/(1+b1*rsSqrt+b2*rs[i]+b3*Math.sqrt(rs[i]*rs[i]*rs[i])));
            }
        }
        
        return Vxc;
    }
};
