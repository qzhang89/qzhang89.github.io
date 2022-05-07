var left  = {x: -1, y: 0};
var right = {x:  1, y: 0};
var down  = {x:  0, y: 1};

var nRows = 10;
var nCols = 8;
var blockSize = 30;
var Shapes = [
    // O-shape
    [
        [[0, 0], [0, 1], [1, 0], [1, 1]],
        [[0, 0], [0, 1], [1, 0], [1, 1]],
        [[0, 0], [0, 1], [1, 0], [1, 1]],
        [[0, 0], [0, 1], [1, 0], [1, 1]]
    ],
    // I-shape
    [
        [[0, 0], [0, 1], [0, 2], [0, 3]],
        [[0, 0], [1, 0], [2, 0], [3, 0]],
        [[0, 0], [0, 1], [0, 2], [0, 3]],
        [[0, 0], [1, 0], [2, 0], [3, 0]]
    ],
    // Z-shape
    [
        [[0, 0], [0, 1], [1, 1], [1, 2]],
        [[0, 1], [1, 0], [1, 1], [2, 0]],
        [[0, 0], [0, 1], [1, 1], [1, 2]],
        [[0, 1], [1, 0], [1, 1], [2, 0]]
    ],
    // S-shape
    [
        [[0, 1], [0, 2], [1, 0], [1, 1]],
        [[0, 0], [1, 0], [1, 1], [2, 1]],
        [[0, 1], [0, 2], [1, 0], [1, 1]],
        [[0, 0], [1, 0], [1, 1], [2, 1]]
    ],
    // T-shape
    [
        [[0, 1], [1, 0], [1, 1], [1, 2]],
        [[0, 0], [1, 0], [1, 1], [2, 0]],
        [[0, 0], [0, 1], [0, 2], [1, 1]],
        [[0, 1], [1, 0], [1, 1], [2, 1]]
    ],
    // L-shape
    [
        [[0, 0], [1, 0], [2, 0], [2, 1]],
        [[0, 0], [0, 1], [0, 2], [1, 0]],
        [[0, 0], [0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 0], [1, 1], [1, 2]]
    ],
    // J-shape
    [
        [[0, 1], [1, 1], [2, 0], [2, 1]],
        [[0, 0], [1, 0], [1, 1], [1, 2]],
        [[0, 0], [0, 1], [1, 0], [2, 0]],
        [[0, 0], [0, 1], [0, 2], [1, 2]]
    ]
];

var maxscore = 0;
var alive = 0;
var Neuvol;
var generation = 0;

var isFast = false;

window.onload = function() {
    Neuvol = new Neuroevolution({
        population: 60,
        network: [45, [50], 10]
    });
    
    document.getElementById('tButton').addEventListener('click', function() {
        isFast = !isFast;
    });
    
    window.addEventListener('gameover', function() {
        if (alive==0) {
            startAll();
        }
    });
    startAll();
};

function startAll() {
    generation++;
    alive = 60;
    
    // Generate neural networks
    var nns = Neuvol.nextGeneration();
    
    var canvases = document.getElementsByTagName('canvas');
    for (var i in nns) {
        var game = new Game(canvases[i], nns[i]);
        game.start();
    }
}

function Shape(row, col, shape, rot) {
    this.row   = row;
    this.col   = col;
    this.shape = shape;
    this.rot   = rot;
}

Shape.prototype.rotate = function(grid) {
    var nextRot = (this.rot+1)%4;
    for (var i=0; i<4; i++) {
        var r = this.row + Shapes[this.shape][nextRot][i][0];
        var c = this.col + Shapes[this.shape][nextRot][i][1];
        if (r<0 || r>=nRows || c<0 || c>=nCols) {
            return false;
        } else {
            if (grid[r][c]!=-1) {
                return false;
            }
        }
    }
    this.rot = nextRot;    
    return true;
};

Shape.prototype.move = function(grid, dir) {
    var nextRow = this.row + dir.y;
    var nextCol = this.col + dir.x;
    for (var i=0; i<4; i++) {
        var r = nextRow + Shapes[this.shape][this.rot][i][0];
        var c = nextCol + Shapes[this.shape][this.rot][i][1];
        if (r<0 || r>=nRows || c<0 || c>=nCols) {
            return false;
        } else {
            if (grid[r][c]!=-1) {
                return false;
            }
        }
    }
    this.row = nextRow;
    this.col = nextCol;
    return true;
};

function Game(canvas, network) {
    this.canvas = canvas;
    this.canvas.width  = nCols*blockSize;
    this.canvas.height = nRows*blockSize;
    this.ctxt   = this.canvas.getContext('2d');
    this.step     = 0;
    this.score    = 0;
    this.isGameOver = true;
    
    this.fallingShape;
    
    this.grid = null;
    
    this.network = network;
}

Game.prototype.start = function() {
    this.grid = [];
    for (var r=0; r<nRows; r++) {
        this.grid[r] = new Array(nCols);
        for (var c=0; c<nCols; c++) {
            this.grid[r][c] = -1;
        }
    }
    this.step  = 0;
    this.score = 0;
    this.isGameOver = false;
    this.newFallingShape();
    this.display();
    
    this.update();
};

Game.prototype.update = function() {
    this.step++;
    if (!this.isGameOver && this.score<10000) {
        if (isFast || this.step%20==0) {
            var res = this.think();
            var fs  = this.fallingShape;
            fs.col = res[0];
            fs.rot = res[1];
            for (var i=0; i<nRows; i++) {
                if (!fs.move(this.grid, down)) {
                    break;
                }
            }
            this.shapeHasLanded();
        }
    } else {
        alive--;
        Neuvol.networkScore(this.network, this.score);
        var event = new Event('gameover');
        window.dispatchEvent(event);
        return;
    }
    
    if (!isFast || (isFast && this.step%4==0)) {
        // Animate
        this.display();
        var self = this;
        window.requestAnimationFrame(function() {
            self.update();
        });
    } else {
        this.update();
    }
};

Game.prototype.think = function() {
    //var inputs = [0,0,0,0,0,0,0];
    var inputs = [0,0];
        
    inputs[this.fallingShape.shape] = 1;
    
    for (var r=5; r<nRows; r++) {
        for (var c=0; c<nCols; c++) {
            inputs.push(this.grid[r][c]==-1?0:1);
        }
    }
    
    // Think very hard
    var outputs = this.network.compute(inputs);
    // Return results
    var max1 = Math.max(outputs[0],outputs[1],outputs[2],outputs[3],outputs[4],outputs[5],outputs[6],outputs[7]);
    //var max2 = Math.max(outputs[8],outputs[9],outputs[10],outputs[11]);
    var max2 = Math.max(outputs[8],outputs[9]);
    var col, rot;
    for (var i=0; i<nCols; i++) {
        if (outputs[i]==max1) {
            col = i;
            break;
        }
    }
    for (var i=0; i<2; i++) {
        if (outputs[nCols+i]==max2) {
            rot = i;
            break;
        }
    }
    return [col, rot];
};

Game.prototype.newFallingShape = function() {
    //this.fallingShape = new Shape(0, 0, Math.floor(Math.random()*7), 0);
    this.fallingShape = new Shape(0, 0, Math.floor(Math.random()*2), 0);
};

Game.prototype.shapeHasLanded = function() {
    var fs = this.fallingShape;
    for (var i=0; i<4; i++) {
        var r = fs.row + Shapes[fs.shape][fs.rot][i][0];
        var c = fs.col + Shapes[fs.shape][fs.rot][i][1];
        this.grid[r][c] = fs.shape;
    }
    
    if (fs.row < 5) {
        this.isGameOver = true;
    } else {
        n = this.removeLines();
        this.score += 1+10*n*n;
        if (this.score>maxscore) {
            maxscore = this.score;
        }
    }
    this.newFallingShape();
    this.step = 0;
};

Game.prototype.removeLines = function() {
    var grid = this.grid;
    var count = 0;
    for (var r=0; r<nRows; r++) {
        for (var c=0; c<nCols; c++) {
            if (grid[r][c]==-1) {
                break;
            }
            if (c==nCols-1) {
                count++;
                this.removeLine(r);
            }
        }
    }
    return count;
};

Game.prototype.removeLine = function(row) {
    var grid = this.grid;
    for (var c=0; c<nCols; c++) {
        grid[row][c] = -1;
    }
    for (var c=0; c<nCols; c++) {
        for (var r=row; r>0; r--) {
            grid[r][c] = grid[r-1][c];
        }
    }
};

Game.prototype.display = function() {
    var colors = ['blue', 'red', 'green', 'darkturquoise', 'chocolate', 'hotpink', 'orange'];
    
    var ctxt = this.ctxt;
    ctxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctxt.fillStyle = '#DDEEFF';
    ctxt.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctxt.lineWidth = 2;
    ctxt.strokeStyle = 'white';
    ctxt.beginPath();
    ctxt.moveTo(0, 5*blockSize);
    ctxt.lineTo(nCols*blockSize, 5*blockSize);
    ctxt.stroke();
    
    // The blocks dropped in the grid
    if (!!this.grid) {
        for (var r=0; r<nRows; r++) {
            for (var c=0; c<nCols; c++) {
                var idx = this.grid[r][c];
                if (idx!=-1) {
                    drawSquare(idx, r, c);
                }
            }
        }
    }

    if (!this.isGameOver) {
        // The falling shape
        var fs = this.fallingShape;
        for (var i=0; i<4; i++) {
            drawSquare(fs.shape, fs.row+Shapes[fs.shape][fs.rot][i][0], fs.col+Shapes[fs.shape][fs.rot][i][1]);
        }
    } else {
        ctxt.font = 'bold 48px monospace';
        ctxt.fillStyle = 'black';
        ctxt.fillText('Tetris', 39, 120);
    }
    
    // Score
    ctxt.fillStyle = 'black';
    ctxt.font = 'bold 18px monospace';
    ctxt.fillText('Score      ' + this.score, 10, 20);
    ctxt.fillText('Max Score  ' + maxscore, 10, 40);
    ctxt.fillText('Generation ' + generation, 10, 60);
    
    function drawSquare(idx, r, c) {
        var bs = blockSize;
        ctxt.fillStyle = colors[idx];
        ctxt.fillRect(c*bs, r*bs, bs, bs);

        ctxt.lineWidth = 2;
        ctxt.strokeStyle = 'white';
        ctxt.strokeRect(c*bs, r*bs, bs, bs);
    }
};
