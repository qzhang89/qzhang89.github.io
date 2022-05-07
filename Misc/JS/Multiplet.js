/*
 * Multiplet.js
 * Need to include Basis.js
 */

var Multiplet = new Object();

window.addEventListener("load", function() {Multiplet.loadHandler();}, false);
Multiplet.loadHandler = function() {
    var MultipletDivs = document.getElementsByClassName("Multiplet");
    for (var i=0; i<MultipletDivs.length; i++) {
        Multiplet.setup(MultipletDivs[i]);
    }
};

// Multiplet setup
Multiplet.setup = function(container) {
    // Add HTML elements
    var html = "";
    html += "<h2>Construction of multiplets</h2>";
    html += "Shell = <select class='lSelect'>";
    html += "<option>s</option><option>p</option><option>d</option><option>f</option>";
    html += "</select>&nbsp;&nbsp;&nbsp;&nbsp;";
    html += "Number of electrons = <select class='NeSelect'></select>&nbsp;&nbsp;&nbsp;&nbsp;";
    html += "<input class='BButton' type='button' value='Basis' />&nbsp;&nbsp;&nbsp;&nbsp;";
    html += "<input class='MButton' type='button' value='Multiplet' /><br /><br />";
    html += "<pre class='basisDiv'></pre>";
    html += "<pre class='mtpDiv'></pre>";
    container.innerHTML = html;
    
    // Get HTML elements
    var lSelect  = container.getElementsByClassName("lSelect")[0];
    var NeSelect = container.getElementsByClassName("NeSelect")[0];
    var BButton  = container.getElementsByClassName("BButton")[0];
    var MButton  = container.getElementsByClassName("MButton")[0];
    var basisDiv = container.getElementsByClassName("basisDiv")[0];
    var mtpDiv   = container.getElementsByClassName("mtpDiv")[0];
    
    // Add event listeners
    lSelect.addEventListener("change", lChangeHandler, false);
    NeSelect.addEventListener("change", NeChangeHandler, false);
    BButton.addEventListener("click", BClickHandler, false);
    MButton.addEventListener("click", MClickHandler, false);
    
    var l  = 0;
    var Ne = 0;
    var LList = ['S', 'P', 'D', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Q'];

    var isBOn = false;
    var isMOn = false;

    lSelect.selectedIndex  = 1;
    lChangeHandler();
    NeSelect.selectedIndex = 2;
    NeChangeHandler();

    function lChangeHandler() {
        NeSelect.length = 0;
        l = lSelect.selectedIndex;
        
        for (var i=0; i<=4*l+2; i++) {
            var option = document.createElement("option");
            option.text = i;
            NeSelect.add(option, null);
        }
        NeChangeHandler();
    }

    function NeChangeHandler() {
        Ne = NeSelect.selectedIndex;
        basisDiv.innerHTML = "";
        mtpDiv.innerHTML = "";
        isBOn = false;
        isMOn = false;
    }

    function BClickHandler() {
        if (isBOn) {
            basisDiv.innerHTML = "";
            isBOn = false;
            return 0;
        }
        var myBasis = new Basis(l, Ne);
        var dim = myBasis.dim;

        var str = "index        conf_10         conf_2             ML             MS\n";
        for (var i=0; i<dim; i++) {
            var iconf = myBasis.conf[i];
            str += pad(i, 5) + " " + pad(iconf, 14) + " "
                   + pad(myBasis.printconf(iconf), 14) + " "
                   + pad(myBasis.ML[i], 14) + " "
                   + pad(myBasis.MS[i], 14) + "\n";
        }
        basisDiv.innerHTML = str;
        isBOn = true;
        return 0;
    }

    function MClickHandler() {
        if (isMOn) {
            mtpDiv.innerHTML = "";
            isMOn = false;
            return 0;
        }
        var myBasis = new Basis(l, Ne);
        var Nsite = myBasis.Nsite;
        var dim = myBasis.dim;

        // Setup ML-MS table (negative and 0.5 index allowed)
        var MLmax = (l+l-Math.ceil(Ne/2)+1)*Math.ceil(Ne/2)/2
                   +(l+l-Math.floor(Ne/2)+1)*Math.floor(Ne/2)/2;
        var MSmax = Ne<=Nsite/2 ? 0.5*Ne : 0.5*(Nsite-Ne);
        var MTable = [];
        for (var ML=-MLmax; ML<=MLmax; ML++) {
            MTable[ML] = [];
            for (var MS=-MSmax; MS<=MSmax; MS++) {
                MTable[ML][MS] = 0;
            }
        }
        for (var i=0; i<dim; i++) {
            ML = myBasis.ML[i];
            MS = myBasis.MS[i];
            MTable[ML][MS]++;
        }

        // Printing ML-MS table
        var tbstr = pad("", 6);
        for (var MS=MSmax; MS>=-MSmax; MS--) {
            tbstr += pad(MS, 5);
        }
        tbstr += "\n";
        tbstr += pad("", 6);
        for (var MS=MSmax; MS>=-MSmax; MS--) {
            tbstr += "-----";
        }
        tbstr += "\n";
        for (var ML=MLmax; ML>=-MLmax; ML--) {
            tbstr += pad(ML, 5) + "|";
            for (var MS=MSmax; MS>=-MSmax; MS--) {
                tbstr += pad(MTable[ML][MS], 5);
            }
            tbstr += "\n";
        }
        tbstr += "\n";

        var mtpstr = "";
        // Apply ladder operators
        for (var S=MSmax; S>=0; S--) {
            for (var L=MLmax; L>=0; L--) {
                // Start from the largest ML MS
                if (MTable[L][S]!=0) {
                    var N = MTable[L][S];  
                    for (var MS=S; MS>=-S; MS--) {
                        // Apply L-
                        for (var ML=L; ML>-L; ML--) {
                            MTable[ML-1][MS]-=N;
                        }
                        // Apply S-
                        if (MS>-S) {
                            MTable[L][MS-1]-=N;
                        }
                    }
                    mtpstr = pad((N>1?N+"x":"") + "("+(2*S+1)+")" + LList[L], 8) + "\n" + mtpstr;
                }
            }
        }
        mtpDiv.innerHTML = tbstr + mtpstr;
        isMOn = true;
        return 0;
    }

    function pad(num, size) {
        var s = num + "";
        while (s.length < size) {
            s = " " + s;
        }
        return s;
    }
};


