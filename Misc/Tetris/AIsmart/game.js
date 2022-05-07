var left  = {x: -1, y: 0};
var right = {x:  1, y: 0};
var down  = {x:  0, y: 1};

var nRows = 16;
var nCols = 10;
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
        population: 12,
        network: [4, [], 1]
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
    alive = 12;
    
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
    this.delay    = 3;
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
    this.update();
};

Game.prototype.update = function() {
    if (!this.isGameOver) {
        if (this.step==0) {
            this.newFallingShape();
            var fs  = this.fallingShape;
            var res = this.think();
            fs.col = res[0];
            fs.rot = res[1];
        }
        this.step++;
        var fs = this.fallingShape;
        if (isFast) {
            for (var i=0; i<nRows; i++) {
                if (!fs.move(this.grid, down)) {
                    break;
                }
            }
            this.shapeHasLanded();
        } else {
            if (this.step%this.delay==0) {
                if (!fs.move(this.grid, down)) {
                    this.shapeHasLanded();
                }
            }
        }
    } else {
        alive--;
        Neuvol.networkScore(this.network, this.score);
        var event = new Event('gameover');
        window.dispatchEvent(event);
        return;
    }
    
    // Animate
    this.display();
    var self = this;
    window.requestAnimationFrame(function() {
        self.update();
    });
};

Game.prototype.think = function() {
    var fs = this.fallingShape;
    
    // All possibilities
    var best  = [0,0];
    var value = 0;
    var tmpGrid = [];
    for (var r=0; r<nRows; r++) {
        tmpGrid[r] = new Array(nCols);
        for (var c=0; c<nCols; c++) {
            tmpGrid[r][c] = -1;
        }
    }
    for (var col=0; col<nCols; col++) {
        for (var rot=0; rot<4; rot++) {
            fs.col = col;
            fs.rot = rot;
            // Check if legal
            var isLegal = true;
            for (var i=0; i<4; i++) {
                var r = fs.row + Shapes[fs.shape][fs.rot][i][0];
                var c = fs.col + Shapes[fs.shape][fs.rot][i][1];
                if (r<0 || r>=nRows || c<0 || c>=nCols) {
                    isLegal = false;
                    break;
                }
            }
            if (isLegal) {
                // Trial drop
                for (var r=0; r<nRows; r++) {
                    for (var c=0; c<nCols; c++) {
                        tmpGrid[r][c] = this.grid[r][c];
                    }
                }
                for (var i=0; i<nRows; i++) {
                    if (!fs.move(this.grid, down)) {
                        break;
                    }
                }
                for (var i=0; i<4; i++) {
                    var r = fs.row + Shapes[fs.shape][fs.rot][i][0];
                    var c = fs.col + Shapes[fs.shape][fs.rot][i][1];
                    tmpGrid[r][c] = fs.shape;
                }
            
                // Trial drop landed
                var surf = [];
                for (var c=0; c<nCols; c++) {
                    surf[c] = nRows;
                    for (var r=0; r<nRows; r++) {
                        if (tmpGrid[r][c]!=-1) {
                            surf[c] = r;
                            break;
                        }
                    }
                }
                var ah = 0; // aggregate height
                var cl = 0; // complete lines
                var ho = 0; // number of holes
                var bp = 0; // bumpiness
                for (var c=0; c<nCols; c++) {
                    ah += nRows-surf[c];
                }
                for (var r=0; r<nRows; r++) {
                    for (var c=0; c<nCols; c++) {
                        if (tmpGrid[r][c]==-1) {
                            break;
                        }
                        if (c==nCols-1) {
                            cl++;
                        }
                    }
                }
                for (var c=0; c<nCols; c++) {
                    for (var r=surf[c]+1; r<nRows; r++) {
                        if (tmpGrid[r][c]==-1) {
                            ho++;
                        }
                    }
                }
                for (var c=0; c<nCols-1; c++) {
                    bp += Math.abs(surf[c]-surf[c+1]);
                }
            
                var out = this.network.compute([ah, cl, ho, bp]);
                if (out>value) {
                    best  = [col, rot];
                    value = out;
                }
            }
            
            // reset
            fs.row = 0;
            fs.col = 0;
        }
    }
    
    return best;
};

Game.prototype.newFallingShape = function() {
    this.fallingShape = new Shape(0, 0, Math.floor(Math.random()*7), 0);
};

Game.prototype.shapeHasLanded = function() {
    var fs = this.fallingShape;
    for (var i=0; i<4; i++) {
        var r = fs.row + Shapes[fs.shape][fs.rot][i][0];
        var c = fs.col + Shapes[fs.shape][fs.rot][i][1];
        this.grid[r][c] = fs.shape;
    }
    
    if (fs.row < 2) {
        this.isGameOver = true;
    } else {
        n = this.removeLines();
        this.score += 10*n*n;
        if (this.score>maxscore) {
            maxscore = this.score;
        }
    }
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
        ctxt.fillText('Tetris', 69, 160);
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
