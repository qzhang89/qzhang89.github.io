// Original code from github.com/xviniette/FlappyLearning

var game;
var images = {};

function loadImages(sources, callback) {
    var count  = Object.keys(sources).length;
    var loaded = 0;
    var imgs = {};
    for(var i in sources){
        imgs[i] = new Image();
        imgs[i].src = sources[i];
        imgs[i].onload = function() {
            loaded++;
            if(loaded == count){
                callback(imgs);
            }
        }
    }
}

function is_touch_device() {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function(query) {
        return window.matchMedia(query).matches;
    }
    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
        return true;
    }
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
}

window.onload = function() {
    var sprites = {
        bird:"./img/bird.png",
        birddead:"./img/birddead.png",
        background:"./img/background.png",
        pipetop:"./img/pipetop.png",
        pipebtm:"./img/pipebtm.png"
    }

    // Game starts if images loaded
    loadImages(sprites, function(imgs) {
        images = imgs;
        game = new Game();
        
        // Add EventListeners
        window.addEventListener("keydown", function(evt) {
            if (evt.keyCode==32 && game.bird.alive) {
                game.bird.flap();
            }
        }, false);
        if (is_touch_device()) {
            game.canvas.addEventListener("touchstart", function(evt) {
                if (game.bird.alive) {
                    game.bird.flap();
                }
            }, false);
        } else {
            game.canvas.addEventListener("click", function(evt) {
                if (game.bird.alive) {
                    game.bird.flap();
                }
            }, false);
        }
        
        game.start();
        game.update();
    })
};

function Bird(json){
    this.x = 100;
    this.y = 250;
    this.width  = 40;
    this.height = 30;

    this.gravity  = 0.3;
    this.velocity = 0;
    this.jump     = -6;
    this.alive    = true;

    this.init(json);
}

Bird.prototype.init = function(json) {
    for (var i in json) {
        this[i] = json[i];
    }
};

Bird.prototype.flap = function() {
    this.velocity = this.jump;
};

Bird.prototype.update = function() {
    this.velocity += this.gravity;
    this.y += this.velocity;
};

Bird.prototype.isDead = function(canvasHeight, pipes) {
    if (this.y>=canvasHeight || this.y+this.height<=0) {
        return true;
    }
    for (var i in pipes) {
        var p = pipes[i];
        if (!(this.x>p.x+p.width || this.x+this.width<p.x ||
             (this.y>p.openUp && this.y+this.height<p.openDn))) {
            return true;
        }
    }
    return false;
};

Bird.prototype.isOut = function() {
    if (this.x+this.width < 0) {
        return true;
    }
    return false;
};

function Pipe(json) {
    this.x = 0;
    this.y = 0;
    this.width  = 50;
    this.height = 512;
    this.openUp = 206;
    this.openDn = 306;
    this.speed  = 3;

    this.init(json);
}

Pipe.prototype.init = function(json) {
    for (var i in json) {
        this[i] = json[i];
    }
};

Pipe.prototype.update = function() {
    this.x -= this.speed;
};

Pipe.prototype.isOut = function() {
    if (this.x+this.width < 0) {
        return true;
    }
    return false;
};

function Game() {
    this.bird     = null;
    this.pipes    = [];
    this.step     = 0;
    this.score    = 0;
    this.maxScore = 0;
    this.canvas   = document.getElementById("myCanvas");
    this.ctxt     = this.canvas.getContext("2d");
    this.bgx      = 0;
    this.bgSpeed  = 0.5;
}

Game.prototype.start = function(){
    this.step  = 0;
    this.score = 0;
    this.pipes = [];
    this.bird  = new Bird();
};

Game.prototype.update = function() {
    this.bgx += this.bgSpeed;
    
    var bird  = this.bird;
    var pipes = this.pipes;

    // Spawn new pipe
    if (this.step%90 == 0){
        var margin   = 50;
        var openSize = 100;
        var openUp   = Math.round(Math.random()*(this.canvas.height-margin*2-openSize))+margin;
        this.pipes.push(new Pipe({x:this.canvas.width, openUp:openUp, openDn:openUp+openSize}));
    }
    this.step++;
    
    // Update pipes
    for (var i=0; i<pipes.length; i++) {
        pipes[i].update();
        if (pipes[i].isOut()) {
            pipes.splice(i, 1);
            i--;
        }
    }

    // Update bird
    if (bird.alive) {
        this.score++;
        this.maxScore = (this.score>this.maxScore) ? this.score : this.maxScore;
        bird.update();
        if (bird.isDead(this.canvas.height, pipes)) {
            bird.alive = false;
        }
    } else {
        bird.x -= pipes[0].speed;
        if (bird.isOut()) {
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
    var ctxt  = this.ctxt;
    var bird  = this.bird;
    var pipes = this.pipes;
    
    // Draw background
    ctxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (var i=0; i<Math.ceil(this.canvas.width/images.background.width)+1; i++) {
        ctxt.drawImage(images.background, i*images.background.width-Math.floor(this.bgx%images.background.width), 0);
    }

    // Draw pipes
    for (var i in pipes) {
        var p = pipes[i];
        ctxt.drawImage(images.pipetop, p.x, p.openUp-images.pipetop.height, p.width, images.pipetop.height);
        ctxt.drawImage(images.pipebtm, p.x, p.openDn,                       p.width, images.pipebtm.height);
    }
    
    // Draw bird
    ctxt.save();
    ctxt.translate(bird.x+bird.width/2, bird.y+bird.height/2);
    ctxt.rotate(Math.PI*bird.velocity/40);
    ctxt.drawImage(bird.alive?images.bird:images.birddead, -bird.width/2, -bird.height/2, bird.width, bird.height);
    ctxt.restore();

    // Draw scores
    ctxt.fillStyle = "white";
    ctxt.font="20px Oswald, sans-serif";
    ctxt.fillText("Score : "+this.score, 10, 25);
    ctxt.fillText("Max Score : "+this.maxScore, 10, 50);
};
