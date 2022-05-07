
function PTable(svg, svgWidth, svgHeight) {
    // Attributes
    this.svg          = svg;
    this.marginWidth  = 10;
    this.marginHeight = 10;
    this.elemWidth    = 35;
    this.elemHeight   = 45;
    this.elemGap      = 0;
    this.strokeWidth  = 1;
    this.opacity      = 1.0;
    
    if (typeof svgHeight === "undefined") {
        this.svgWidth  = 300;
        this.svgHeight = 150;
    } else {
        this.svgWidth  = svgWidth;
        this.svgHeight = svgHeight;
    }
    this.svg.setAttribute("width",  this.svgWidth);
    this.svg.setAttribute("height", this.svgHeight);
    
    this.isLong = false;
    
    this.fillColor   = ["rgb(102,153,255)", "rgb(255,204,0)", "rgb(255,153,153)", "rgb(0,204,51)"];
    this.strokeColor = ["rgb(51,102,153)", "rgb(204,153,0)", "rgb(204,102,102)", "rgb(0,153,0)"];
    
    // Block starting offsets
    this.offset = [];
    this.offset[10] = [0,0,1];
    this.offset[20] = [0,1,3];
    this.offset[30] = [0,2,11];
    this.offset[40] = [0,3,19];
    this.offset[50] = [0,4,37];
    this.offset[60] = [0,5,55];
    this.offset[70] = [0,6,87];
    this.offset[21] = [12.5,1,5];
    this.offset[31] = [12.5,2,13];
    this.offset[41] = [12.5,3,31];
    this.offset[51] = [12.5,4,49];
    this.offset[61] = [12.5,5,81];
    this.offset[71] = [12.5,6,113];
    this.offset[32] = [2.5,3,21];
    this.offset[42] = [2.5,4,39];
    this.offset[52] = [2.5,5,71];
    this.offset[62] = [2.5,6,103];
    this.offset[43] = [2.5,7.5,57];
    this.offset[53] = [2.5,8.5,89];
    
    this.atomList = [
        ,
        {Z:1,   n:1, l:0, symb:"H",   weight:1.008,      name:"Hydrogen"},
        {Z:2,   n:1, l:0, symb:"He",  weight:4.0026,     name:"Helium"},
        {Z:3,   n:2, l:0, symb:"Li",  weight:6.94,       name:"Lithium"},
        {Z:4,   n:2, l:0, symb:"Be",  weight:9.0122,     name:"Beryllium"},
        {Z:5,   n:2, l:1, symb:"B",   weight:10.81,      name:"Boron"},
        {Z:6,   n:2, l:1, symb:"C",   weight:12.011,     name:"Carbon"},
        {Z:7,   n:2, l:1, symb:"N",   weight:14.007,     name:"Nitrogen"},
        {Z:8,   n:2, l:1, symb:"O",   weight:15.999,     name:"Oxygen"},
        {Z:9,   n:2, l:1, symb:"F",   weight:18.998,     name:"Fluorine"},
        {Z:10,  n:2, l:1, symb:"Ne",  weight:20.180,     name:"Neon"},
        {Z:11,  n:3, l:0, symb:"Na",  weight:22.990,     name:"Sodium"},
        {Z:12,  n:3, l:0, symb:"Mg",  weight:24.305,     name:"Magnesium"},
        {Z:13,  n:3, l:1, symb:"Al",  weight:26.982,     name:"Aluminium"},
        {Z:14,  n:3, l:1, symb:"Si",  weight:28.085,     name:"Silicon"},
        {Z:15,  n:3, l:1, symb:"P",   weight:30.974,     name:"Phosphorus"},
        {Z:16,  n:3, l:1, symb:"S",   weight:32.06,      name:"Sulfur"},
        {Z:17,  n:3, l:1, symb:"Cl",  weight:35.45,      name:"Chlorine"},
        {Z:18,  n:3, l:1, symb:"Ar",  weight:39.948,     name:"Argon"},
        {Z:19,  n:4, l:0, symb:"K",   weight:39.098,     name:"Potassium"},
        {Z:20,  n:4, l:0, symb:"Ca",  weight:40.078,     name:"Calcium"},
        {Z:21,  n:3, l:2, symb:"Sc",  weight:44.956,     name:"Scandium"},
        {Z:22,  n:3, l:2, symb:"Ti",  weight:47.867,     name:"Titanium"},
        {Z:23,  n:3, l:2, symb:"V",   weight:50.942,     name:"Vanadium"},
        {Z:24,  n:3, l:2, symb:"Cr",  weight:51.996,     name:"Chromium"},
        {Z:25,  n:3, l:2, symb:"Mn",  weight:54.938,     name:"Manganese"},
        {Z:26,  n:3, l:2, symb:"Fe",  weight:55.845,     name:"Iron"},
        {Z:27,  n:3, l:2, symb:"Co",  weight:58.933,     name:"Cobalt"},
        {Z:28,  n:3, l:2, symb:"Ni",  weight:58.693,     name:"Nickel"},
        {Z:29,  n:3, l:2, symb:"Cu",  weight:63.546,     name:"Copper"},
        {Z:30,  n:3, l:2, symb:"Zn",  weight:65.38,      name:"Zinc"},
        {Z:31,  n:4, l:1, symb:"Ga",  weight:69.723,     name:"Gallium"},
        {Z:32,  n:4, l:1, symb:"Ge",  weight:72.63,      name:"Germanium"},
        {Z:33,  n:4, l:1, symb:"As",  weight:74.922,     name:"Arsenic"},
        {Z:34,  n:4, l:1, symb:"Se",  weight:78.96,      name:"Selenium"},
        {Z:35,  n:4, l:1, symb:"Br",  weight:79.904,     name:"Bromine"},
        {Z:36,  n:4, l:1, symb:"Kr",  weight:83.798,     name:"Krypton"},
        {Z:37,  n:5, l:0, symb:"Rb",  weight:85.468,     name:"Rubidium"},
        {Z:38,  n:5, l:0, symb:"Sr",  weight:87.62,      name:"Strontium"},
        {Z:39,  n:4, l:2, symb:"Y",   weight:88.906,     name:"Yttrium"},
        {Z:40,  n:4, l:2, symb:"Zr",  weight:91.224,     name:"Zirconium"},
        {Z:41,  n:4, l:2, symb:"Nb",  weight:92.906,     name:"Niobium"},
        {Z:42,  n:4, l:2, symb:"Mo",  weight:95.96,      name:"Molybdenum"},
        {Z:43,  n:4, l:2, symb:"Tc",  weight:"[97.91]",  name:"Technetium"},
        {Z:44,  n:4, l:2, symb:"Ru",  weight:101.07,     name:"Ruthenium"},
        {Z:45,  n:4, l:2, symb:"Rh",  weight:102.91,     name:"Rhodium"},
        {Z:46,  n:4, l:2, symb:"Pd",  weight:106.42,     name:"Palladium"},
        {Z:47,  n:4, l:2, symb:"Ag",  weight:107.87,     name:"Silver"},
        {Z:48,  n:4, l:2, symb:"Cd",  weight:112.41,     name:"Cadmium"},
        {Z:49,  n:5, l:1, symb:"In",  weight:114.82,     name:"Indium"},
        {Z:50,  n:5, l:1, symb:"Sn",  weight:118.71,     name:"Tin"},
        {Z:51,  n:5, l:1, symb:"Sb",  weight:121.76,     name:"Antimony"},
        {Z:52,  n:5, l:1, symb:"Te",  weight:127.60,     name:"Tellurium"},
        {Z:53,  n:5, l:1, symb:"I",   weight:126.90,     name:"Iodine"},
        {Z:54,  n:5, l:1, symb:"Xe",  weight:131.29,     name:"Xenon"},
        {Z:55,  n:6, l:0, symb:"Cs",  weight:132.91,     name:"Caesium"},
        {Z:56,  n:6, l:0, symb:"Ba",  weight:137.33,     name:"Barium"},
        {Z:57,  n:4, l:3, symb:"La",  weight:138.91,     name:"Lanthanum"},
        {Z:58,  n:4, l:3, symb:"Ce",  weight:140.12,     name:"Cerium"},
        {Z:59,  n:4, l:3, symb:"Pr",  weight:140.91,     name:"Praseodymium"},
        {Z:60,  n:4, l:3, symb:"Nd",  weight:144.24,     name:"Neodymium"},
        {Z:61,  n:4, l:3, symb:"Pm",  weight:"[144.91]", name:"Promethium"},
        {Z:62,  n:4, l:3, symb:"Sm",  weight:150.36,     name:"Samarium"},
        {Z:63,  n:4, l:3, symb:"Eu",  weight:151.96,     name:"Europium"},
        {Z:64,  n:4, l:3, symb:"Gd",  weight:157.25,     name:"Gadolinium"},
        {Z:65,  n:4, l:3, symb:"Tb",  weight:158.93,     name:"Terbium"},
        {Z:66,  n:4, l:3, symb:"Dy",  weight:162.50,     name:"Dysprosium"},
        {Z:67,  n:4, l:3, symb:"Ho",  weight:164.93,     name:"Holmium"},
        {Z:68,  n:4, l:3, symb:"Er",  weight:167.26,     name:"Erbium"},
        {Z:69,  n:4, l:3, symb:"Tm",  weight:168.93,     name:"Thulium"},
        {Z:70,  n:4, l:3, symb:"Yb",  weight:173.05,     name:"Ytterbium"},
        {Z:71,  n:5, l:2, symb:"Lu",  weight:174.97,     name:"Lutetium"},
        {Z:72,  n:5, l:2, symb:"Hf",  weight:178.49,     name:"Hafnium"},
        {Z:73,  n:5, l:2, symb:"Ta",  weight:180.95,     name:"Tantalum"},
        {Z:74,  n:5, l:2, symb:"W",   weight:183.84,     name:"Tungsten"},
        {Z:75,  n:5, l:2, symb:"Re",  weight:186.21,     name:"Rhenium"},
        {Z:76,  n:5, l:2, symb:"Os",  weight:190.23,     name:"Osmium"},
        {Z:77,  n:5, l:2, symb:"Ir",  weight:192.22,     name:"Iridium"},
        {Z:78,  n:5, l:2, symb:"Pt",  weight:195.08,     name:"Platinum"},
        {Z:79,  n:5, l:2, symb:"Au",  weight:196.97,     name:"Gold"},
        {Z:80,  n:5, l:2, symb:"Hg",  weight:200.59,     name:"Mercury"},
        {Z:81,  n:6, l:1, symb:"Tl",  weight:204.38,     name:"Thallium"},
        {Z:82,  n:6, l:1, symb:"Pb",  weight:207.2,      name:"Lead"},
        {Z:83,  n:6, l:1, symb:"Bi",  weight:208.98,     name:"Bismuth"},
        {Z:84,  n:6, l:1, symb:"Po",  weight:"[208.98]", name:"Polonium"},
        {Z:85,  n:6, l:1, symb:"At",  weight:"[209.99]", name:"Astatine"},
        {Z:86,  n:6, l:1, symb:"Rn",  weight:"[222.02]", name:"Radon"},
        {Z:87,  n:7, l:0, symb:"Fr",  weight:"[223.02]", name:"Francium"},
        {Z:88,  n:7, l:0, symb:"Ra",  weight:"[226.03]", name:"Radium"},
        {Z:89,  n:5, l:3, symb:"Ac",  weight:"[227.03]", name:"Actinium"},
        {Z:90,  n:5, l:3, symb:"Th",  weight:232.04,     name:"Thorium"},
        {Z:91,  n:5, l:3, symb:"Pa",  weight:231.04,     name:"Protactinium"},
        {Z:92,  n:5, l:3, symb:"U",   weight:238.03,     name:"Uranium"},
        {Z:93,  n:5, l:3, symb:"Np",  weight:"[237.05]", name:"Neptunium"},
        {Z:94,  n:5, l:3, symb:"Pu",  weight:"[244.06]", name:"Plutonium"},
        {Z:95,  n:5, l:3, symb:"Am",  weight:"[243.06]", name:"Americium"},
        {Z:96,  n:5, l:3, symb:"Cm",  weight:"[247.07]", name:"Curium"},
        {Z:97,  n:5, l:3, symb:"Bk",  weight:"[247.07]", name:"Berkelium"},
        {Z:98,  n:5, l:3, symb:"Cf",  weight:"[251.08]", name:"Californium"},
        {Z:99,  n:5, l:3, symb:"Es",  weight:"[252.08]", name:"Einsteinium"},
        {Z:100, n:5, l:3, symb:"Fm",  weight:"[257.10]", name:"Fermium"},
        {Z:101, n:5, l:3, symb:"Md",  weight:"[258.10]", name:"Mendelevium"},
        {Z:102, n:5, l:3, symb:"No",  weight:"[259.10]", name:"Nobelium"},
        {Z:103, n:6, l:2, symb:"Lr",  weight:"[262.11]", name:"Lawrencium"},
        {Z:104, n:6, l:2, symb:"Rf",  weight:"[265.12]", name:"Rutherfordium"},
        {Z:105, n:6, l:2, symb:"Db",  weight:"[268.13]", name:"Dubnium"},
        {Z:106, n:6, l:2, symb:"Sg",  weight:"[271.13]", name:"Seaborgium"},
        {Z:107, n:6, l:2, symb:"Bh",  weight:"[270]",    name:"Bohrium"},
        {Z:108, n:6, l:2, symb:"Hs",  weight:"[277.15]", name:"Hassium"},
        {Z:109, n:6, l:2, symb:"Mt",  weight:"[276.15]", name:"Meitnerium"},
        {Z:110, n:6, l:2, symb:"Ds",  weight:"[281.16]", name:"Darmstadtium"},
        {Z:111, n:6, l:2, symb:"Rg",  weight:"[280.16]", name:"Roentgenium"},
        {Z:112, n:6, l:2, symb:"Cn",  weight:"[285.17]", name:"Copernicium"},
        {Z:113, n:7, l:1, symb:"Nh", weight:"[284.18]",  name:"Nihonium"},
        {Z:114, n:7, l:1, symb:"Fl",  weight:"[289.19]", name:"Flerovium"},
        {Z:115, n:7, l:1, symb:"Mc", weight:"[288.19]",  name:"Moscovium"},
        {Z:116, n:7, l:1, symb:"Lv",  weight:"[293]",    name:"Livermorium"},
        {Z:117, n:7, l:1, symb:"Ts", weight:"[294]",     name:"Tennessine"},
        {Z:118, n:7, l:1, symb:"Og", weight:"[294]",     name:"Oganesson"},
    ];
    
    // Set electron configurations
    for (var Z=1; Z<this.atomList.length; Z++) {
        var atom = this.atomList[Z];
        if (Z >= 1 && Z <= 2) {
            atom.cfg    = "1s" + Z;
            atom.cfgAuf = "1s" + Z;
        } else if (Z >= 3 && Z <= 4) {
            atom.cfg    = "[He] 2s" + (Z-2);
            atom.cfgAuf = "[He] 2s" + (Z-2);
        } else if (Z >= 5 && Z <= 10) {
            atom.cfg    = "[He] 2s2 2p" + (Z-4);
            atom.cfgAuf = "[He] 2s2 2p" + (Z-4);
        } else if (Z >= 11 && Z <= 12) {
            atom.cfg    = "[Ne] 3s" + (Z-10);
            atom.cfgAuf = "[Ne] 3s" + (Z-10);
        } else if (Z >= 13 && Z <= 18) {
            atom.cfg    = "[Ne] 3s2 3p" + (Z-12);
            atom.cfgAuf = "[Ne] 3s2 3p" + (Z-12);
        } else if (Z >= 19 && Z <= 20) {
            atom.cfg    = "[Ar] 4s" + (Z-18);
            atom.cfgAuf = "[Ar] 4s" + (Z-18);
        } else if (Z >= 21 && Z <= 30) {
            atom.cfg    = "[Ar] 4s2 3d" + (Z-20);
            atom.cfgAuf = "[Ar] 4s2 3d" + (Z-20);
        } else if (Z >= 31 && Z <= 36) {
            atom.cfg    = "[Ar] 4s2 3d10 4p" + (Z-30);
            atom.cfgAuf = "[Ar] 4s2 3d10 4p" + (Z-30);
        } else if (Z >= 37 && Z <= 38) {
            atom.cfg    = "[Kr] 5s" + (Z-36);
            atom.cfgAuf = "[Kr] 5s" + (Z-36);
        } else if (Z >= 39 && Z <= 48) {
            atom.cfg    = "[Kr] 5s2 4d" + (Z-38);
            atom.cfgAuf = "[Kr] 5s2 4d" + (Z-38);
        } else if (Z >= 49 && Z <= 54) {
            atom.cfg    = "[Kr] 5s2 4d10 5p" + (Z-48);
            atom.cfgAuf = "[Kr] 5s2 4d10 5p" + (Z-48);
        } else if (Z >= 55 && Z <= 56) {
            atom.cfg    = "[Xe] 6s" + (Z-54);
            atom.cfgAuf = "[Xe] 6s" + (Z-54);
        } else if (Z >= 57 && Z <= 70) {
            atom.cfg    = "[Xe] 6s2 4f" + (Z-56);
            atom.cfgAuf = "[Xe] 6s2 4f" + (Z-56);
        } else if (Z >= 71 && Z <= 80) {
            atom.cfg    = "[Xe] 6s2 4f14 5d" + (Z-70);
            atom.cfgAuf = "[Xe] 6s2 4f14 5d" + (Z-70);
        } else if (Z >= 81 && Z <= 86) {
            atom.cfg    = "[Xe] 6s2 4f14 5d10 6p" + (Z-80);
            atom.cfgAuf = "[Xe] 6s2 4f14 5d10 6p" + (Z-80);
        } else if (Z >= 87 && Z <= 88) {
            atom.cfg    = "[Rn] 7s" + (Z-86);
            atom.cfgAuf = "[Rn] 7s" + (Z-86);
        } else if (Z >= 89 && Z <= 102) {
            atom.cfg    = "[Rn] 7s2 5f" + (Z-88);
            atom.cfgAuf = "[Rn] 7s2 5f" + (Z-88);
        } else if (Z >= 103 && Z <= 112) {
            atom.cfg    = "[Rn] 7s2 5f14 6d" + (Z-102);
            atom.cfgAuf = "[Rn] 7s2 5f14 6d" + (Z-102);
        } else if (Z >= 113 && Z <= 118) {
            atom.cfg    = "[Rn] 7s2 5f14 6d10 7p" + (Z-112);
            atom.cfgAuf = "[Rn] 7s2 5f14 6d10 7p" + (Z-112);
        } else {
            atom.cfg    = "1s0";
            atom.cfgAuf = "1s0";
        }
        switch (Z) {
        case 24:
            atom.cfg = "[Ar] 4s1 3d5"; break;
        case 29:
            atom.cfg = "[Ar] 4s1 3d10"; break;
        case 41:
            atom.cfg = "[Kr] 5s1 4d4"; break;
        case 42:
            atom.cfg = "[Kr] 5s1 4d5"; break;
        case 44:
            atom.cfg = "[Kr] 5s1 4d7"; break;
        case 45:
            atom.cfg = "[Kr] 5s1 4d8"; break;
        case 46:
            atom.cfg = "[Kr] 4d10"; break;
        case 47:
            atom.cfg = "[Kr] 5s1 4d10"; break;
        case 57:
            atom.cfg = "[Xe] 6s2 5d1"; break;
        case 58:
            atom.cfg = "[Xe] 6s2 4f1 5d1"; break;
        case 64:
            atom.cfg = "[Xe] 6s2 4f7 5d1"; break;
        case 78:
            atom.cfg = "[Xe] 6s1 4f14 5d9"; break;
        case 79:
            atom.cfg = "[Xe] 6s1 4f14 5d10"; break;
        case 89:
            atom.cfg = "[Rn] 7s2 6d1"; break;
        case 90:
            atom.cfg = "[Rn] 7s2 6d2"; break;
        case 91:
            atom.cfg = "[Rn] 7s2 5f2 6d1"; break;
        case 92:
            atom.cfg = "[Rn] 7s2 5f3 6d1"; break;
        case 93:
            atom.cfg = "[Rn] 7s2 5f4 6d1"; break;
        case 96:
            atom.cfg = "[Rn] 7s2 5f7 6d1"; break;
        case 103:
            atom.cfg = "[Rn] 7s2 5f14 7p1"; break;
        default:
            break;
        }
    }
    
    // Initial plot
    this.create();
}

PTable.prototype.setElemGap = function(elemGap) {
    this.elemGap = elemGap;
};

PTable.prototype.setOpacity = function(opacity) {
    this.opacity = opacity;
};

PTable.prototype.setMargin = function(marginWidth, marginHeight) {
    this.marginWidth  = marginWidth;
    this.marginHeight = marginHeight;
};

PTable.prototype.setLong = function(isLong) {
    this.isLong = isLong;
    
    if (isLong) {
        this.offset[10] = [0,0,1];
        this.offset[20] = [0,1,3];
        this.offset[30] = [0,2,11];
        this.offset[40] = [0,3,19];
        this.offset[50] = [0,4,37];
        this.offset[60] = [0,5,55];
        this.offset[70] = [0,6,87];
        this.offset[21] = [25,1,5];
        this.offset[31] = [25,2,13];
        this.offset[41] = [25,3,31];
        this.offset[51] = [25,4,49];
        this.offset[61] = [25,5,81];
        this.offset[71] = [25,6,113];
        this.offset[32] = [15,3,21];
        this.offset[42] = [15,4,39];
        this.offset[52] = [15,5,71];
        this.offset[62] = [15,6,103];
        this.offset[43] = [2,5,57];
        this.offset[53] = [2,6,89];
    } else {
        this.offset[10] = [0,0,1];
        this.offset[20] = [0,1,3];
        this.offset[30] = [0,2,11];
        this.offset[40] = [0,3,19];
        this.offset[50] = [0,4,37];
        this.offset[60] = [0,5,55];
        this.offset[70] = [0,6,87];
        this.offset[21] = [12.5,1,5];
        this.offset[31] = [12.5,2,13];
        this.offset[41] = [12.5,3,31];
        this.offset[51] = [12.5,4,49];
        this.offset[61] = [12.5,5,81];
        this.offset[71] = [12.5,6,113];
        this.offset[32] = [2.5,3,21];
        this.offset[42] = [2.5,4,39];
        this.offset[52] = [2.5,5,71];
        this.offset[62] = [2.5,6,103];
        this.offset[43] = [2.5,7.5,57];
        this.offset[53] = [2.5,8.5,89];
    }
};

PTable.prototype.atom2svgg = function(atom) {
    var ew  = this.elemWidth;
    var eh  = this.elemHeight;
    var eg  = this.elemGap;
    var off = this.offset[atom.n*10+atom.l];
    
    var x = atom.Z==2 ? (this.offset[21][0]+5)*(ew+eg) : (off[0]+atom.Z-off[2])*(ew+eg);
    x += this.marginWidth;
    var y = off[1]*(eh+eg);
    y += this.marginHeight;
    
    // <g>
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "Z"+atom.Z);
    g.setAttribute("transform", "translate(" + x + "," + y + ")");
    
    // Children of <g>
    var rect  = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("class", "rect");
    rect.setAttribute("width", ew);
    rect.setAttribute("height", eh);
    rect.setAttribute("style", "fill:"+this.fillColor[atom.l]+"; stroke:"+this.strokeColor[atom.l]+
                      "; stroke-width:"+this.strokeWidth+"; opacity:"+this.opacity + ";");
    g.appendChild(rect);
    
    var textZ = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textZ.textContent = atom.Z;
    textZ.setAttribute("class", "textZ");
    textZ.setAttribute("x", ew*0.5);
    textZ.setAttribute("y", eh*0.2);
    textZ.setAttribute("style", "font-size:"+Math.min(ew,eh)*0.35+
                       "px; text-anchor:middle; alignment-baseline:central;");
    g.appendChild(textZ);

    var textE = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textE.textContent = atom.symb;
    textE.setAttribute("class", "textE");
    textE.setAttribute("x", ew*0.5);
    textE.setAttribute("y", eh*0.6);
    textE.setAttribute("style", "font-size:"+Math.min(ew,eh)*0.50+
                       "px; font-weight:bold; text-anchor:middle; alignment-baseline:central;");
    g.appendChild(textE);
    
    var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = atom.name;
    g.appendChild(title);
    
    g.Z = atom.Z;
    g.n = atom.n;
    g.l = atom.l;
    g.symb = atom.symb;
    g.name = atom.name;
    g.weight = atom.weight;
    g.cfg    = atom.cfg;
    g.cfgAuf = atom.cfgAuf;
    
    return g;
};

PTable.prototype.create = function() {
    // Note: svg.innerHTML does not work (not a standard)
    
    var svg = this.svg;
    var mw  = this.marginWidth;
    var mh  = this.marginHeight;
    var eg  = this.elemGap;
    var atomList = this.atomList;
    
    var sw = svg.getAttribute("width");
    var sh = svg.getAttribute("height");
    this.svgWidth  = sw;
    this.svgHeight = sh;
    
    var ew, eh;
    if (this.isLong) {
        ew = (sw-2*mw-30*eg)/32;
        eh = (sh-2*mh-6*eg)/7;
    } else {
        ew = (sw-2*mw-17*eg)/18.5;
        eh = (sh-2*mh-9*eg)/9.5;
    }
    
    this.elemWidth  = ew;
    this.elemHeight = eh;
    
    // Clear svg children
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
    
    // Add svg children
    for (var Z=1; Z<atomList.length; Z++) {
        svg.appendChild(this.atom2svgg(atomList[Z]));
    }
    
    // Connect f-shells
    if (!this.isLong) {
        var off = this.offset[60];
        var cx  = mw + (off[0]+2.25)*ew + (off[0]+1.75)*eg;
        var cy1 = mh + off[1]*(eh+eg)+0.5*eh;
        var cy2 = cy1 + (eh+eg);
        var y4f = cy2 + 1.5*eh + 1.5*eg;
        var y5f = y4f + (eh+eg);
        
        var line1   = document.createElementNS("http://www.w3.org/2000/svg", "line");
        var line2   = document.createElementNS("http://www.w3.org/2000/svg", "line");
        var line3   = document.createElementNS("http://www.w3.org/2000/svg", "line");
        var circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        var circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        
        line1.setAttribute("class", "line1");
        line1.setAttribute("x1", cx);
        line1.setAttribute("y1", cy1);
        line1.setAttribute("x2", cx);
        line1.setAttribute("y2", y5f+this.strokeWidth);
        line1.setAttribute("style", "stroke:"+this.strokeColor[3]+"; stroke-width:"+
                           2*this.strokeWidth+"; opacity:"+this.opacity + ";");
        
        line2.setAttribute("class", "line2");
        line2.setAttribute("x1", cx);
        line2.setAttribute("y1", y4f);
        line2.setAttribute("x2", cx+0.25*ew+0.75*eg);
        line2.setAttribute("y2", y4f);
        line2.setAttribute("style", "stroke:"+this.strokeColor[3]+"; stroke-width:"+
                           2*this.strokeWidth+"; opacity:" + this.opacity + ";");
        
        line3.setAttribute("class", "line3");
        line3.setAttribute("x1", cx);
        line3.setAttribute("y1", y5f);
        line3.setAttribute("x2", cx+0.25*ew+0.75*eg);
        line3.setAttribute("y2", y5f);
        line3.setAttribute("style", "stroke:"+this.strokeColor[3]+"; stroke-width:"+
                           2*this.strokeWidth+"; opacity:" + this.opacity + ";");
        
        circle1.setAttribute("class", "circle1");
        circle1.setAttribute("cx", cx);
        circle1.setAttribute("cy", cy1);
        circle1.setAttribute("r",  Math.min(ew*0.5, eh)*0.25);
        circle1.setAttribute("style", "fill:"+this.fillColor[3]+"; stroke:"+this.strokeColor[3]+
                             "; stroke-width:"+this.strokeWidth+"; opacity:"+this.opacity+";");
        
        circle2.setAttribute("class", "circle2");
        circle2.setAttribute("cx", cx);
        circle2.setAttribute("cy", cy2);
        circle2.setAttribute("r",  Math.min(ew*0.5, eh)*0.25);
        circle2.setAttribute("style", "fill:"+this.fillColor[3]+"; stroke:"+this.strokeColor[3]+
                             "; stroke-width:"+this.strokeWidth+"; opacity:"+this.opacity+";");
        
        svg.appendChild(line1);
        svg.appendChild(line2);
        svg.appendChild(line3);
        svg.appendChild(circle1);
        svg.appendChild(circle2);
    }
};

PTable.prototype.refresh = function() {
    var svg = this.svg;
    var mw  = this.marginWidth;
    var mh  = this.marginHeight;
    var eg  = this.elemGap;
    var atomList = this.atomList;
    
    var sw = svg.getAttribute("width");
    var sh = svg.getAttribute("height");
    this.svgWidth  = sw;
    this.svgHeight = sh;
    
    var ew, eh;
    if (this.isLong) {
        ew = (sw-2*mw-30*eg)/32;
        eh = (sh-2*mh-6*eg)/7;
    } else {
        ew = (sw-2*mw-17*eg)/18.5;
        eh = (sh-2*mh-9*eg)/9.5;
    }
    
    this.elemWidth  = ew;
    this.elemHeight = eh;
        
    // Resize svg children
    for (var Z=1; Z<atomList.length; Z++) {
        var atom = atomList[Z];
        var g = svg.getElementsByClassName("Z"+Z)[0];
        var off = this.offset[atom.n*10+atom.l];
        
        // Re-position <g>
        var x = atom.Z==2 ? (this.offset[21][0]+5)*(ew+eg) : (off[0]+atom.Z-off[2])*(ew+eg);
        x += this.marginWidth;
        var y = off[1]*(eh+eg);
        y += this.marginHeight;
        g.setAttribute("transform", "translate(" + x + "," + y + ")");
                
        // Children of <g>
        var rect = g.getElementsByClassName("rect")[0];
        rect.setAttribute("width", ew);
        rect.setAttribute("height", eh);
        rect.setAttribute("style", "fill:"+this.fillColor[atom.l]+"; stroke:"+this.strokeColor[atom.l]+
                          "; stroke-width:"+this.strokeWidth+"; opacity:"+this.opacity + ";");
        
        var textZ = g.getElementsByClassName("textZ")[0];
        textZ.textContent = atom.Z;
        textZ.setAttribute("x", ew*0.5);
        textZ.setAttribute("y", eh*0.2);
        textZ.setAttribute("style", "font-size:"+Math.min(ew,eh)*0.35+
                           "px; text-anchor:middle; alignment-baseline:central;");
        
        var textE = g.getElementsByClassName("textE")[0];
        textE.textContent = atom.symb;
        textE.setAttribute("x", ew*0.5);
        textE.setAttribute("y", eh*0.6);
        textE.setAttribute("style", "font-size:"+Math.min(ew,eh)*0.50+
                           "px; font-weight:bold; text-anchor:middle; alignment-baseline:central;");
    }
    
    // Connect f-shells
    if (!this.isLong) {
        var off = this.offset[60];
        var cx  = mw + (off[0]+2.25)*ew + (off[0]+1.75)*eg;
        var cy1 = mh + off[1]*(eh+eg)+0.5*eh;
        var cy2 = cy1 + (eh+eg);
        var y4f = cy2 + 1.5*eh + 1.5*eg;
        var y5f = y4f + (eh+eg);
        
        var line1   = svg.getElementsByClassName("line1")[0];
        var line2   = svg.getElementsByClassName("line2")[0];
        var line3   = svg.getElementsByClassName("line3")[0];
        var circle1 = svg.getElementsByClassName("circle1")[0];
        var circle2 = svg.getElementsByClassName("circle2")[0];
        
        line1.setAttribute("x1", cx);
        line1.setAttribute("y1", cy1);
        line1.setAttribute("x2", cx);
        line1.setAttribute("y2", y5f+this.strokeWidth);
        line1.setAttribute("style", "stroke:"+this.strokeColor[3]+"; stroke-width:"+
                           2*this.strokeWidth+"; opacity:"+this.opacity + ";");
        
        line2.setAttribute("x1", cx);
        line2.setAttribute("y1", y4f);
        line2.setAttribute("x2", cx+0.25*ew+0.75*eg);
        line2.setAttribute("y2", y4f);
        line2.setAttribute("style", "stroke:"+this.strokeColor[3]+"; stroke-width:"+
                           2*this.strokeWidth+"; opacity:" + this.opacity + ";");
        
        line3.setAttribute("x1", cx);
        line3.setAttribute("y1", y5f);
        line3.setAttribute("x2", cx+0.25*ew+0.75*eg);
        line3.setAttribute("y2", y5f);
        line3.setAttribute("style", "stroke:"+this.strokeColor[3]+"; stroke-width:"+
                           2*this.strokeWidth+"; opacity:" + this.opacity + ";");
        
        circle1.setAttribute("cx", cx);
        circle1.setAttribute("cy", cy1);
        circle1.setAttribute("r",  Math.min(ew*0.5, eh)*0.25);
        circle1.setAttribute("style", "fill:"+this.fillColor[3]+"; stroke:"+this.strokeColor[3]+
                             "; stroke-width:"+this.strokeWidth+"; opacity:"+this.opacity+";");
        
        circle2.setAttribute("cx", cx);
        circle2.setAttribute("cy", cy2);
        circle2.setAttribute("r",  Math.min(ew*0.5, eh)*0.25);
        circle2.setAttribute("style", "fill:"+this.fillColor[3]+"; stroke:"+this.strokeColor[3]+
                             "; stroke-width:"+this.strokeWidth+"; opacity:"+this.opacity+";");
    }
};
