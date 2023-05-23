let mainGame = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function mainGame() {
        Phaser.Scene.call(this, { key: 'mainGame' });
        this.bird = null;
        this.pipes = null;
        this.score = 1;
        this.scoreText = null;
        this.mainMenuGroup = null;
        this.titleText = null;
        this.subTitleText = null;
        this.gameover = false;
        this.dead = false;
        this.gameStarted = false;
        this.canRestart = true;
        this.pipeGap = window.innerWidth < window.innerHeight ? 1400 : 1400;
        this.pipeDelay = window.innerWidth < window.innerHeight ? 1000 : 1250;
        this.pointerDownListener = null;
        this.passedPipes = [];
    },

    preload: function() {
        this.load.image('bird', 'assets/bird.png');
        this.load.image('pipe', 'assets/pipe.png');
        this.load.image('background', 'assets/background.png');
        
        // load audio
        this.load.audio('flap', 'assets/pew_pew.mp3');
        this.load.audio('hit', 'assets/hit.mp3');
        this.load.audio('game_end', 'assets/boom.mp3');
    },

    create: function() {
        // Register Sound
        this.flapSound = this.sound.add('flap');
        this.hitSound = this.sound.add('hit');
        this.gameEndSound = this.sound.add('game_end');


        let bg = this.add.image(0, 0, 'background');
        bg.setOrigin(0, 0);
        bg.displayWidth = this.sys.canvas.width;
        bg.displayHeight = this.sys.canvas.height;

        this.bird = this.physics.add.image(window.innerWidth / 2, window.innerHeight / 2, 'bird');
        this.bird.setCircle(this.bird.width / 2);
        this.bird.body.gravity.y = 1500;

        this.nametag = this.add.text(this.bird.x, this.bird.y - 65, 'Slachy', { fontSize: '24px', fill: '#ffffff', align: 'center' });
        this.nametag.setOrigin(0.5);

        this.pipes = this.physics.add.group();
        this.physics.add.collider(this.bird, this.pipes, this.endGame, null, this);

        this.addPipes(true);
        this.physics.pause();

        this.pointerDownListener = this.input.on('pointerdown', this.handlePointerDown, this);

        // text group
        this.mainMenuGroup = this.add.group();
        let backgroundOverlay = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000, 0.5).setOrigin(0, 0);
        let titleText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'SlachyBird', { fontSize: '50px', fill: '#ffffff', stroke: '#007BFF', strokeThickness: 5 }).setOrigin(0.5);
        titleText.setY(titleText.y - titleText.height / 2);
        let subTitleText = this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 100, 'Click to Start!', { fontSize: '30px', fill: '#ffffff', stroke: '#007BFF', strokeThickness: 5 }).setOrigin(0.5);
        subTitleText.setY(subTitleText.y - subTitleText.height / 2 - 50);
        this.mainMenuGroup.add(titleText);
        this.mainMenuGroup.add(subTitleText);
        this.mainMenuGroup.add(backgroundOverlay);

        this.scoreText = this.add.text(window.innerWidth - 20, 20, '', { fontSize: '38px', fill: '#ffffff', align: 'right', stroke: '#000000', strokeThickness: 5, fontWeight: 'bold' });
        this.scoreText.setOrigin(1, 0);

        this.scoreText.depth = 1;
        this.nametag.depth = 1;
    },

    update: function() {
        if (this.bird.y > window.innerHeight || this.bird.y < 0) {
            this.endGame();
        }

        if (this.gameover && this.input.activePointer.isDown && !this.pointerDownListener.isDown) {
            this.gameover = false;
            this.gameStarted = false;
            this.scene.start('mainGame');
        }

        if (this.gameStarted) {
            if (!this.dead) {
                Phaser.Actions.IncX(this.pipes.getChildren(), -2);
            }

            this.nametag.x = this.bird.x;
            this.nametag.y = this.bird.y - 65;

            // Check if the bird has passed through a pipe
            this.pipes.getChildren().forEach((pipe) => {
                if (pipe.x < this.bird.x && !this.passedPipes.includes(pipe)) {
                    this.passedPipes.push(pipe);
                    this.incrementScore();
                }
            });
        }
    },

    addPipes: function(first = false) {
        let pipeHolePosition;
        let lastPipe = this.pipes.getLast(true);
    
        // the sprite is 630px height, so we need to ensure it positions the gap properly
        if (first) {
            pipeHolePosition = window.innerHeight / 2;
        } else {
            pipeHolePosition = Phaser.Math.Between(300, window.innerHeight - 300);
        }
    
        let xOffset = Phaser.Math.Between(0, 50);
        let distanceMultiplier = 1;
        let heightMultiplier = 1;
    
        if (lastPipe) {
            let lastPipeX = lastPipe.getBounds().right;
            let lastPipeY = lastPipe.getBounds().top;
            let lastPipeHeight = lastPipe.getBounds().height;
    
            let lastPipeDistance = window.innerWidth - lastPipeX;
            let lastPipeYOffset = lastPipeY + lastPipeHeight / 2;
    
            if (lastPipeDistance < 200) {
                distanceMultiplier = 2;
            } else if (lastPipeDistance < 100) {
                distanceMultiplier = 3;
            }
    
            if (lastPipeYOffset < window.innerHeight / 2) {
                heightMultiplier = 2;
            } else if (lastPipeYOffset < window.innerHeight / 3) {
                heightMultiplier = 3;
            }
        }
    
        xOffset *= distanceMultiplier;
        pipeHolePosition *= heightMultiplier;
    
        // ensure the pipes are within the screen
        let upperPipe = this.pipes.create(window.innerWidth + xOffset, pipeHolePosition - (this.pipeGap / 2), 'pipe').setScale(2);
        let lowerPipe = this.pipes.create(window.innerWidth + xOffset, pipeHolePosition + (this.pipeGap / 2), 'pipe').setScale(2);
    
        upperPipe.angle = 180;
    
        upperPipe.body.immovable = true;
        lowerPipe.body.immovable = true;
    
        upperPipe.body.allowGravity = false;
        lowerPipe.body.allowGravity = false;
    },
    

    incrementScore: function() {
        let passedPipe = false;
        let collidedPipe = false;
        this.pipes.getChildren().forEach((pipe) => {
            if (pipe.getBounds().right < this.bird.getBounds().left && !pipe.passed) {
                pipe.passed = true;
                passedPipe = true;
            }
            if (this.physics.overlap(this.bird, pipe)) {
                collidedPipe = true;
            }
        });
    
        if (passedPipe && !collidedPipe) {
            this.score += 1;
            this.scoreText.setText('Score: ' + Math.floor(this.score));
        }
    },

    endGame: function() {
        if (this.dead)
            return;

        this.canRestart = false;
        this.dead = true;

        if ( !this.hitSound.isPlaying ){
            this.hitSound.play();
        }

        this.nametag.destroy();
        this.physics.pause();
        this.bird.setTint(0xff0000);
        this.tweens.add({
            targets: this.bird,
            alpha: 0,
            duration: 850,
            ease: 'Power2',
            onComplete: function() {
                this.gameEndSound.play();
                let gameOverText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Banned', { fontSize: '50px', fill: '#ffffff', stroke: '#007BFF', strokeThickness: 5 }).setOrigin(0.5);
                gameOverText.setY(gameOverText.y - gameOverText.height / 2);
                let restartText = this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 100, 'Click to Restart!', { fontSize: '30px', fill: '#ffffff', stroke: '#007BFF', strokeThickness: 3 }).setOrigin(0.5);
                restartText.setY(restartText.y - restartText.height / 2 - 50);
                restartText.setInteractive();
                this.canRestart = true;
                this.gameover = true;
            },
            callbackScope: this
        });

        if (this.pipeTimerEvent) {
            this.pipeTimerEvent.remove();
            this.pipeTimerEvent = null;
        }
    },

    handlePointerDown: function() {
        if (!this.gameStarted) {
            this.mainMenuGroup.clear(true, true);
            this.scoreText.setText('Score: 1');
            
            this.gameStarted = true;
            this.dead = false;
            this.physics.resume();
            this.pipeTimerEvent = this.time.addEvent({ delay: this.pipeDelay, callback: () => this.addPipes(false), callbackScope: this, loop: true });
        }

        if (!this.gameover && !this.dead) {
            this.bird.setVelocityY(-600);
            // play
            this.flapSound.play();
        }
    },

    shutdown: function() {
        if (this.pointerDownListener) {
            this.pointerDownListener.off('pointerdown', this.handlePointerDown, this);
        }
    }
});

let config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: false
        }
    },
    scene: [mainGame]
};

let game = new Phaser.Game(config);