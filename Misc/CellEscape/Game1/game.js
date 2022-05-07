var game;

window.onload = function() {
    game = new Game();
    game.start();
    game.update();
};

function Cell(json){
    this.x = 250;
    this.y = 250;
    this.r = 10;
    
    this.feelLen = 100;
    this.feelers = [];
    for (var i=0; i<16; i++) {
        this.feelers[i] = this.feelLen;
    }
    
    this.alive  = true;

    this.init(json);
}

Cell.prototype.init = function(json) {
    for (var i in json) {
        this[i] = json[i];
    }
};

Cell.prototype.update = function(canvasWidth, canvasHeight, blocks) {
    var force = [0,0];
    for (var i=0; i<16; i++) {
        var theta = i/8 * Math.PI;
        var d = this.feelLen-this.feelers[i];
        force[0] -= d*Math.cos(theta);
        force[1] += d*Math.sin(theta);
    }
    this.x += 0.1*force[0];
    this.y += 0.1*force[1];
    this.detect(canvasWidth, canvasHeight, blocks)
};

Cell.prototype.detect = function(canvasWidth, canvasHeight, blocks) {
    function intersect(rayStart, rayEnd, center, r) {
        var d = [rayEnd[0]-rayStart[0], rayEnd[1]-rayStart[1]];
        var f = [rayStart[0]-center[0], rayStart[1]-center[1]];
        var a = d[0]*d[0]+d[1]*d[1];
        var b = 2*(f[0]*d[0]+f[1]*d[1]);
        var c = f[0]*f[0]+f[1]*f[1]-r*r;
        var disc = b*b-4*a*c;
        if (disc<0) {
            return false;
        }
        disc = Math.sqrt(disc);
        var t1 = (-b-disc)/(2*a);
        var t2 = (-b+disc)/(2*a);
        if (t1>=0 && t1<=1) {
            return t1*Math.sqrt(a);
        }
        return false;
    }
    
    var R = this.feelLen;
    for (var n=0; n<16; n++) {
        var theta = n/8 * Math.PI;
        var feel = R;
        for (var i in blocks) {
            var b = blocks[i];
            var hit = intersect([this.x,this.y], [this.x+R*Math.cos(theta),this.y-R*Math.sin(theta)], [b.x,b.y], b.r);
            if (!!hit && hit<feel) {
                feel = hit;
            }
        }
        if (theta<Math.PI/2 || theta>Math.PI*3/2) {
            feel = Math.min(feel, (canvasWidth-this.x)/Math.cos(theta));
        }
        if (theta>0 && theta<Math.PI) {
            feel = Math.min(feel, this.y/Math.sin(theta));
        }
        if (theta>Math.PI/2 && theta<Math.PI*3/2) {
            feel = Math.min(feel, -this.x/Math.cos(theta));
        }
        if (theta>Math.PI && theta<Math.PI*2) {
            feel = Math.min(feel, (this.y-canvasWidth)/Math.sin(theta));
        }
        this.feelers[n] = feel;
    }
};

Cell.prototype.isDead = function(canvasWidth, canvasHeight, blocks) {
    if (this.x-this.r<=0 || this.x+this.r>=canvasWidth ||
        this.y-this.r<=0 || this.y+this.r>=canvasHeight) {
        return true;
    }
    for (var i in blocks) {
        var b = blocks[i];
        var dist = Math.sqrt(Math.pow(this.x-b.x,2)+Math.pow(this.y-b.y,2));
        if (dist <= this.r+b.r) {
            return true;
        }
    }
    return false;
};

function Block(json) {
    this.x = 0;
    this.y = 0;
    this.r = 30;
    this.vx = 0;
    this.vy = 0;

    this.init(json);
}

Block.prototype.init = function(json) {
    for (var i in json) {
        this[i] = json[i];
    }
};

Block.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
};

Block.prototype.isOut = function(canvasWidth, canvasHeight) {
    if (this.x+this.r<=0 || this.x-this.r>=canvasWidth ||
        this.y+this.r<=0 || this.y-this.r>=canvasHeight) {
        return true;
    }
    return false;
};

function Game() {
    this.cell     = null;
    this.blocks   = [];
    this.score    = 0;
    this.maxScore = 0;
    this.canvas   = document.getElementById("myCanvas");
    this.ctxt     = this.canvas.getContext("2d");
}

Game.prototype.start = function(){
    this.score  = 0;
    this.blocks = [];
    this.cell   = new Cell();
};

Game.prototype.update = function() {
    var cell   = this.cell;
    var blocks = this.blocks;
    
    var canvasWidth  = this.canvas.width;
    var canvasHeight = this.canvas.height;

    // Spawn new block
    if (this.score%3 == 0){
        var rand = Math.random();
        var x = randomIntFromInterval(0, canvasWidth-30);
        var y = randomIntFromInterval(0, canvasHeight-30);
        var vx = randomIntFromInterval(-5, 5);
        var vy = randomIntFromInterval(-5, 5);
        if (rand>=0.75) {
            this.blocks.push(new Block({x:x, y:-30, vx:vx, vy:vy}));
        } else if (rand>=0.5) {
            this.blocks.push(new Block({x:x, y:canvasHeight+30, vx:vx, vy:vy}));
        } else if (rand>=0.25) {
            this.blocks.push(new Block({x:-30, y:y, vx:vx, vy:vy}));
        } else {
            this.blocks.push(new Block({x:canvasWidth+30, y:y, vx:vx, vy:vy}));
        }
    }
    
    // Update blocks
    for (var i=0; i<blocks.length; i++) {
        blocks[i].update();
        if (blocks[i].isOut()) {
            blocks.splice(i, 1);
            i--;
        }
    }

    // Update cell
    if (cell.alive) {
        this.score++;
        this.maxScore = (this.score>this.maxScore) ? this.score : this.maxScore;
        cell.update(canvasWidth, canvasHeight, blocks);
        if (cell.isDead(canvasWidth, canvasHeight, blocks)) {
            cell.alive = false;
            this.start();
        }
    }
    
    // Animate
    this.display();
    var self = this;
    window.requestAnimationFrame(function() {
        self.update();
    });
    
    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random()*(max-min+1)+min);
    }
};

Game.prototype.display = function() {
    var ctxt   = this.ctxt;
    var cell   = this.cell;
    var blocks = this.blocks;
    
    // Draw background
    ctxt.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw blocks
    ctxt.strokeStyle = "black";
    ctxt.lineWidth = 1;
    for (var i in blocks) {
        var b = blocks[i];
        ctxt.beginPath();
        ctxt.arc(b.x, b.y, b.r, 0, 2*Math.PI);
        ctxt.stroke();
    }
    
    // Draw cell
    ctxt.strokeStyle = "blue";
    ctxt.lineWidth = 3;
    ctxt.beginPath();
    ctxt.arc(cell.x, cell.y, cell.r, 0, 2*Math.PI);
    ctxt.stroke();
    
    // Draw feelers
    for (var i in cell.feelers) {
        var theta = i/8 * Math.PI;
        var feel = cell.feelers[i];
        ctxt.strokeStyle = "green";
        ctxt.lineWidth = 1;
        ctxt.beginPath();
        ctxt.moveTo(cell.x, cell.y);
        ctxt.lineTo(cell.x+feel*Math.cos(theta), cell.y-feel*Math.sin(theta));
        ctxt.stroke();
        ctxt.fillStyle = "red";
        ctxt.beginPath();
        ctxt.arc(cell.x+feel*Math.cos(theta), cell.y-feel*Math.sin(theta), 3, 0, 2*Math.PI);
        ctxt.fill();
    }
    
    // Draw scores
    ctxt.fillStyle = "black";
    ctxt.font="20px Oswald, sans-serif";
    ctxt.fillText("Score : "+this.score, 10, 25);
    ctxt.fillText("Max Score : "+this.maxScore, 10, 50);
};
