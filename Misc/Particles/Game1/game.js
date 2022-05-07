var game;
var keysDown = {};

window.onload = function() {
    game = new Game();
        
    // Add EventListeners
    window.addEventListener("keydown", function(evt) {
        keysDown[evt.keyCode] = true;
    }, false);
    window.addEventListener("keyup", function(evt) {
        delete keysDown[evt.keyCode];
    }, false);
    
    game.start();
    game.update();
};

function Cell(json){
    this.x = 250;
    this.y = 250;
    this.r = 10;
    this.alive = true;

    this.init(json);
}

Cell.prototype.init = function(json) {
    for (var i in json) {
        this[i] = json[i];
    }
};

Cell.prototype.update = function(canvasWidth, canvasHeight, blocks) {
    var force = [0, 0];
    for (i in blocks) {
        var block = blocks[i];
        var dx  = (block.x - this.x)/canvasWidth;
        var dy  = (block.y - this.y)/canvasHeight;
        var dr2 = dx*dx + dy*dy;
        var theta = Math.atan2(dy,dx);
        force[0] -= 1/dr2*Math.cos(theta);
        force[1] -= 1/dr2*Math.sin(theta);
    }
    force[0] += 1/Math.pow(this.x/canvasWidth,2)  - 1/Math.pow(1-this.x/canvasWidth,2);
    force[1] += 1/Math.pow(this.y/canvasHeight,2) - 1/Math.pow(1-this.y/canvasHeight,2);
    this.x += 5*(1/(1+Math.exp(-force[0]))-0.5);
    this.y += 5*(1/(1+Math.exp(-force[1]))-0.5);
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
    this.r = 10;
    this.vx = 0;
    this.vy = 0;

    this.init(json);
}

Block.prototype.init = function(json) {
    for (var i in json) {
        this[i] = json[i];
    }
};

Block.prototype.update = function(canvasWidth, canvasHeight) {
    if (this.x-this.r<=0 || this.x+this.r>=canvasWidth) {
        this.vx *= -1;
    }
    if (this.y-this.r<=0 || this.y+this.r>=canvasHeight) {
        this.vy *= -1;
    }
    this.x += this.vx;
    this.y += this.vy;
};

function Game() {
    this.cell     = null;
    this.blocks   = [];
    this.score    = 0;
    this.maxScore = 0;
    this.canvas   = document.getElementById("myCanvas");
    this.ctxt     = this.canvas.getContext("2d");
}

Game.prototype.start = function() {
    this.score = 0;
    this.blocks = [];
    for (var i=0; i<30; i++) {
        var theta = i/15*Math.PI;
        var r = Math.min(this.canvas.width, this.canvas.height)/4;
        var x = this.canvas.width/2+r*Math.cos(theta);
        var y = this.canvas.height/2+r*Math.sin(theta);
        var v = 3;
        var vtheta = Math.random()*Math.PI*2;
        var vx = v*Math.cos(vtheta);
        var vy = v*Math.sin(vtheta);
        var block = new Block({x:x, y:y, vx:vx, vy:vy});
        this.blocks.push(block);
    }
    this.cell = new Cell();
};

Game.prototype.update = function() {
    var cell   = this.cell;
    var blocks = this.blocks;
    var canvasWidth  = this.canvas.width;
    var canvasHeight = this.canvas.height;
    
    // Update blocks
    for (var i=0; i<blocks.length; i++) {
        blocks[i].update(canvasWidth, canvasHeight);
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
    
    // Draw scores
    ctxt.fillStyle = "black";
    ctxt.font="20px Oswald, sans-serif";
    ctxt.fillText("Score : "+this.score, 10, 25);
    ctxt.fillText("Max Score : "+this.maxScore, 10, 50);
};
