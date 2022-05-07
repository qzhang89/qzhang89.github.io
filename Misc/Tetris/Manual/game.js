var left  = {x: -1, y: 0};
var right = {x:  1, y: 0};
var down  = {x:  0, y: 1};

var nRows = 15;
var nCols = 10;
var blockSize = 30;
var Shapes = [
    // O-shape
    [
        [[0, 1], [0, 2], [1, 1], [1, 2]],
        [[0, 1], [0, 2], [1, 1], [1, 2]],
        [[0, 1], [0, 2], [1, 1], [1, 2]],
        [[0, 1], [0, 2], [1, 1], [1, 2]]
    ],
    // I-shape
    [
        [[0, 0], [0, 1], [0, 2], [0, 3]],
        [[0, 1], [1, 1], [2, 1], [3, 1]],
        [[0, 0], [0, 1], [0, 2], [0, 3]],
        [[0, 1], [1, 1], [2, 1], [3, 1]]
    ],
    // Z-shape
    [
        [[0, 0], [0, 1], [1, 1], [1, 2]],
        [[0, 2], [1, 1], [1, 2], [2, 1]],
        [[0, 0], [0, 1], [1, 1], [1, 2]],
        [[0, 2], [1, 1], [1, 2], [2, 1]]
    ],
    // S-shape
    [
        [[0, 1], [0, 2], [1, 0], [1, 1]],
        [[0, 1], [1, 1], [1, 2], [2, 2]],
        [[0, 1], [0, 2], [1, 0], [1, 1]],
        [[0, 1], [1, 1], [1, 2], [2, 2]]
    ],
    // T-shape
    [
        [[0, 1], [1, 0], [1, 1], [1, 2]],
        [[0, 1], [1, 1], [1, 2], [2, 1]],
        [[0, 0], [0, 1], [0, 2], [1, 1]],
        [[0, 1], [1, 0], [1, 1], [2, 1]]
    ],
    // L-shape
    [
        [[0, 1], [1, 1], [2, 1], [2, 2]],
        [[0, 1], [0, 2], [0, 3], [1, 1]],
        [[0, 1], [0, 2], [1, 2], [2, 2]],
        [[0, 2], [1, 0], [1, 1], [1, 2]]
    ],
    // J-shape
    [
        [[0, 2], [1, 2], [2, 1], [2, 2]],
        [[0, 1], [1, 1], [1, 2], [1, 3]],
        [[0, 1], [0, 2], [1, 1], [2, 1]],
        [[0, 0], [0, 1], [0, 2], [1, 2]]
    ]
];

window.onload = function() {
    game = new Game();
    game.display();
    
    // Add EventListeners
    window.addEventListener('keydown', function (event) {
        if (game.isGameOver) {
            return;
        }

        switch (event.key) {
            case 'w':
            case 'ArrowUp':
                game.fallingShape.rotate(game.grid);
                break;

            case 'a':
            case 'ArrowLeft':
                game.fallingShape.move(game.grid, left);
                break;

            case 'd':
            case 'ArrowRight':
                game.fallingShape.move(game.grid, right);
                break;

            case 's':
            case 'ArrowDown':
                for (var i=0; i<nRows; i++) {
                    if (!game.fallingShape.move(game.grid, down)) {
                        break;
                    }
                }
                game.shapeHasLanded();
        }
        game.display();
    });
    
    game.canvas.addEventListener('click', function () {
        if (game.isGameOver) {
            game.start();
        }
    });
};

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

function Game() {
    this.canvas = document.getElementById('myCanvas');
    this.canvas.width  = nCols*blockSize;
    this.canvas.height = nRows*blockSize;
    this.ctxt = this.canvas.getContext('2d');
    this.step     = 0;
    this.score    = 0;
    this.maxscore = 0;
    this.delay    = 50;
    this.isGameOver = true;
    
    this.fallingShape = null;
    
    this.grid = null;
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
    if (this.isGameOver) {
        return;
    }
    
    this.step++;
    if (this.step%this.delay==0) {
        if (!this.fallingShape.move(this.grid, down)) {
            this.shapeHasLanded();
        }
        this.display();
    }
    
    var self = this;
    window.requestAnimationFrame(function () {
        self.update();
    });
};

Game.prototype.newFallingShape = function() {
    this.fallingShape = new Shape(0, 3, Math.floor(Math.random()*7), 0);
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
        if (this.score>this.maxscore) {
            this.maxscore = this.score;
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
    ctxt.fillText('Score     ' + this.score, 10, 20);
    ctxt.fillText('Max Score ' + this.maxscore, 10, 40);
    
    function drawSquare(idx, r, c) {
        var bs = blockSize;
        ctxt.fillStyle = colors[idx];
        ctxt.fillRect(c*bs, r*bs, bs, bs);

        ctxt.lineWidth = 2;
        ctxt.strokeStyle = 'white';
        ctxt.strokeRect(c*bs, r*bs, bs, bs);
    }
};
