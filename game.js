var game;

var gameOptions = {
  timeLimit: 100,
  gravity: 2000,
  crateSpeed: 500,
  crateHorizontalRange: 540,
  fallingHeight: 700,
  localStorageName: "stackthecratesgame",
  gameWidth: 640,
  gameHeight: 960,
  firstXPosition: 200,
  secondXPosition: 440
}

var GROUNDHEIGHT;
var CRATEHEIGHT;

window.onload = function() {
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var ratio = windowHeight / windowWidth;
  if(ratio >= 1){
    if(ratio < 1.5){
      gameOptions.gameWidth = gameOptions.gameHeight / ratio;
    }
    else{
      gameOptions.gameHeight = gameOptions.gameWidth * ratio;
    }
  }
  game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight, Phaser.CANVAS);
  game.state.add("PlayGame", playGame);
  game.state.start("PlayGame");
}

var playGame = function(){};


playGame.prototype = {
  preload:function(){
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.stage.disableVisibilityChange = true;
    game.load.image("ground", "assets/sprites/ground.png");
    game.load.image("sky", "assets/sprites/sky.png");
    game.load.image("crate", "assets/sprites/crate.png");
    game.load.image("title", "assets/sprites/title.png");
    game.load.image("tap", "assets/sprites/tap.png");

    game.load.image("background", "assets/sprites/bg.png");
    game.load.image("logo", "assets/sprites/logo.png");
    game.load.image("play-button", "assets/sprites/play-button.png");
    game.load.image("bottle-1", "assets/sprites/bottle-1.png");
    game.load.image("bottle-2", "assets/sprites/bottle-2.png");
    game.load.image("mango", "assets/sprites/mango.png");
    game.load.image("jamaica", "assets/sprites/jamaica.png");
    game.load.image("platform", "assets/sprites/platform.jpg");

    game.load.spritesheet("sound", "assets/sprites/sound.png", 64, 54);
    game.load.spritesheet("fruit", "assets/sprites/fruit.png", 80, 88);

    game.load.audio("bgsound", ["assets/sounds/whistle.mp3"]);

    game.load.audio("hit01", ["assets/sounds/hit01.mp3", "assets/sounds/hit01.ogg"]);
    game.load.audio("hit02", ["assets/sounds/hit02.mp3", "assets/sounds/hit02.ogg"]);
    game.load.audio("hit03", ["assets/sounds/hit03.mp3", "assets/sounds/hit03.ogg"]);
    game.load.audio("remove", ["assets/sounds/remove.mp3", "assets/sounds/remove.ogg"]);
    game.load.audio("gameover", ["assets/sounds/gameover.mp3", "assets/sounds/gameover.ogg"]);
    game.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
    game.load.bitmapFont("smallfont", "assets/fonts/smallfont.png", "assets/fonts/smallfont.fnt");
  },
  create: function(){

    // Wrong orientation display settings
    if(!Phaser.Device.desktop){
      game.scale.forceOrientation(false, true);
      game.scale.enterIncorrectOrientation.add(function(){
        game.paused = true;
        document.querySelector("canvas").style.display = "none";
        document.getElementById("wrongorientation").style.display = "block";
      })
      game.scale.leaveIncorrectOrientation.add(function(){
        game.paused = false;
        document.querySelector("canvas").style.display = "block";
        document.getElementById("wrongorientation").style.display = "none";
      })
    }

    // Add music element and play audio
    music = game.add.audio('bgsound');
    //music.play();


    this.lastSoundPlayed = Date.now() ;
    this.savedData = localStorage.getItem(gameOptions.localStorageName) == null ? {score : 0} : JSON.parse(localStorage.getItem(gameOptions.localStorageName));
    this.hitSound = [game.add.audio("hit01"), game.add.audio("hit02"), game.add.audio("hit03")];
    this.gameOverSound = game.add.audio("gameover");
    this.removeSound = game.add.audio("remove");
    this.score = 0;

    this.firstCrate = true;

    // Set background sprite
    var background = game.add.image(0, 0, "background");
    background.width = game.width;
    background.height = game.height;

    this.cameraGroup = game.add.group();
    this.crateGroup = game.add.group();
    this.cameraGroup.add(this.crateGroup);
    game.physics.startSystem(Phaser.Physics.BOX2D);
    this.canDrop = true;

    var platform = game.add.sprite(game.width/2, game.height, "platform");
    platform.y = game.height - platform.height / 2;



    game.physics.box2d.enable(platform);
    platform.body.friction = 1;
    platform.body.static = true;
    platform.body.setCollisionCategory(1);


    //game.input.onDown.add(this.dropCrate, this);

    game.input.onDown.add(this.swipeBottles, this);

    // Main Menu Group

    // Tap (hand) element
     this.menuGroup = game.add.group();
    // var tap = game.add.sprite(game.width / 2, game.height / 2, "tap");
    // tap.anchor.set(0.5);
    // this.menuGroup.add(tap);


    // Logo
    var logo = game.add.image(game.width / 2, 70, "logo");
    logo.anchor.set(0.5, 0);
    this.menuGroup.add(logo);


    // Title
    // var title = game.add.image(game.width / 2, tap.y - 470, "title");
    // title.anchor.set(0.5, 0);
    // this.menuGroup.add(title);

    // Ready text and button
    //var readyText = game.add.bitmapText(game.width / 2, game.height / 2, "smallfont", "¿Estás listo?", 24);
    var readyText = game.add.text(game.width / 2, game.height / 2, "¿Estás listo?", {font: "30px Arial", fill: "#000"});
    readyText.anchor.set(0.5);
    this.menuGroup.add(readyText);

    var readyButton = game.add.button(0, game.height / 2 + 40, 'play-button', this.dropCrate, this, 2, 1, 0);
    this.menuGroup.add(readyButton);

    // this.physics.startSystem(Phaser.Physics.ARCADE);
    // brick = this.add.sprite(100, 100, "crate");

    // this.physics.enable(brick,Phaser.Physics.ARCADE);
    // brick.body.gravity.y = 50;


    game.physics.startSystem(Phaser.Physics.ARCADE);

    this.fruitGroup = game.add.group();
    this.fruitGroup.enableBody = true;

    game.physics.arcade.enable(this.fruitGroup);

    // Bottle 1
    this.bottle1 = game.add.sprite(70, game.height, "bottle-1");
    this.bottle1.y = game.height - 250;
    this.bottle1.x = gameOptions.firstXPosition;
    this.bottle1.anchor.set(0.5);

    // Bottle 2
    this.bottle2 = game.add.sprite(70, game.height, "bottle-2");
    this.bottle2.y = game.height - 250;
    this.bottle2.x = gameOptions.secondXPosition;
    this.bottle2.anchor.set(0.5);

    game.physics.enable([this.bottle1, this.bottle2], Phaser.Physics.ARCADE);
    this.bottle1.body.immovable = false;
    this.bottle2.body.immovable = false;

    this.bottle1.animations.add('swipe');
    this.bottle1.animations.play('swipe', 10, true);

    game.physics.enable(this.fruitGroup, Phaser.Physics.ARCADE);


    this.counter = 0;
    this.counterGoods = 0;
    this.counterBads = 0;
  },

  dropCrate: function(){
    if(this.firstCrate){
      // Audio Button
      this.audioButton = game.add.button(game.width - 110, 35, 'sound', this.toggleMusic, this, 1, 0, 2);
      this.audioButton.anchor.setTo(0.5, 0.5);
      this.controlsGroup = game.add.group();
      this.controlsGroup.add(this.audioButton);
      //music.play();
      // remove comment later

      game.time.events.loop(3000, this.createFruit, this);

      this.firstCrate = false;
      this.menuGroup.destroy();
      this.timer = 0;
      this.timerEvent = game.time.events.loop(Phaser.Timer.SECOND, this.tick, this);
      this.timeText = game.add.bitmapText(game.width / 2 - 20, 10, "font", gameOptions.timeLimit.toString(), 72);
      //this.timeText = game.add.text(game.width / 2 - 20, 10, "00:00", {font: "100px Arial", fill: "#fff"});
    }
    if(this.canDrop && this.timer <= gameOptions.timeLimit){
      this.canDrop = false;
      var fallingCrate = game.add.sprite(this.movingCrate.x, this.movingCrate.y, "crate");
      fallingCrate.hit = false;
      game.physics.box2d.enable(fallingCrate);
      fallingCrate.body.friction = 1;
      fallingCrate.body.bullet = true;
      this.crateGroup.add(fallingCrate);
      fallingCrate.body.setCollisionCategory(1);
      fallingCrate.body.setCategoryContactCallback(1, function(b, b2, fixture1, fixture2, contact, impulseInfo){
        var delay = Date.now() - this.lastSoundPlayed;
        if(delay > 200 && this.timer <= gameOptions.timeLimit){
          this.lastSoundPlayed = Date.now();
          Phaser.ArrayUtils.getRandomItem(this.hitSound).play();
        }
        if(!b.sprite.hit){
          b.sprite.hit = true;
          b.bullet = false;
          this.getMaxHeight();
        }
      }, this);
    }

  },
  update: function(){
    this.crateGroup.forEach(function(i){
      if(i.y > game.height + i.height){
        if(!i.hit){
          this.getMaxHeight();
        }
        i.destroy();
      }
    }, this);

    game.physics.arcade.collide(this.fruitGroup);
    game.physics.arcade.overlap(this.fruitGroup, [this.bottle1, this.bottle2], this.collectFruit, null, this);

    // Rotate each fruit
    this.fruitGroup.forEach(function(fruit) {
      fruit.body.gravity.y = 150;
      fruit.angle += fruit.rotateMe;
    });
  },
  createFruit: function() {
    // Randomize first fruit
    var fruitType = Math.floor(Math.random()*2);

    // Create first fruit
    var firstFruit = game.add.sprite(gameOptions.firstXPosition, 200, 'fruit');
    firstFruit.animations.add('anim', [fruitType], 10, true);
    firstFruit.animations.play('anim');

    // Create second fruit, opposite to second fruit
    var secondFruitType = fruitType === 1 ? 0 : 1;
    var secondFruit = game.add.sprite(gameOptions.secondXPosition, 0, 'fruit');
    secondFruit.animations.add('anim', [secondFruitType], 10, true);
    secondFruit.animations.play('anim');

    // Enable physics on both fruits
    game.physics.enable(firstFruit, Phaser.Physics.ARCADE);
    game.physics.enable(secondFruit, Phaser.Physics.ARCADE);

    // set the anchor (for rotation) to the middle of each item
    firstFruit.anchor.setTo(0.5, 0.5);
    secondFruit.anchor.setTo(0.5, 0.5);

    // Set random rotation value
    firstFruit.rotateMe = (Math.random()*1)-1;
    secondFruit.rotateMe = (Math.random()*1)-1;

    firstFruit.body.collideWorldBounds = true;
    secondFruit.body.collideWorldBounds = true;

    // Add them to the same group
    this.fruitGroup.add(firstFruit);
    this.fruitGroup.add(secondFruit);
  },
  spawnFruit: function() {
    console.log('spawn');
    var dropPos = Math.floor(Math.random()*game.width);
    var mango = game.add.sprite(dropPos, 0, 'mango');
    game.physics.enable(mango, Phaser.Physics.ARCADE);
    this.fruitGroup.add(mango);

  },
  scaleCamera: function(cameraScale){
    var moveTween = game.add.tween(this.cameraGroup).to({
      x: (game.width - game.width * cameraScale) / 2,
      y: game.height - game.height * cameraScale,
    }, 200, Phaser.Easing.Quadratic.IN, true);
    var scaleTween = game.add.tween(this.cameraGroup.scale).to({
      x: cameraScale,
      y: cameraScale,
    }, 200, Phaser.Easing.Quadratic.IN, true);
    scaleTween.onComplete.add(function(){
      this.canDrop = true;
      this.movingCrate.alpha = 1;
    }, this)
  },
  getMaxHeight: function(){
    var maxHeight = 0
    this.crateGroup.forEach(function(i){
      if(i.hit){
        var height = Math.round((game.height - GROUNDHEIGHT - i.y - CRATEHEIGHT / 2) / CRATEHEIGHT) + 1;
        maxHeight = Math.max(height, maxHeight);
      }
    }, this);
    this.movingCrate.y = game.height - GROUNDHEIGHT - maxHeight * CRATEHEIGHT - gameOptions.fallingHeight;
    var newHeight = game.height + CRATEHEIGHT * maxHeight;
    var ratio = game.height / newHeight;
    this.scaleCamera(ratio);
  },
  tick: function(){
    this.timer++;
    this.timeText.text = (gameOptions.timeLimit - this.timer).toString()
    if(this.timer > gameOptions.timeLimit){
      game.time.events.remove(this.timerEvent);
      this.movingCrate.destroy();
      this.timeText.destroy();
      game.time.events.add(Phaser.Timer.SECOND * 2, function(){
        this.crateGroup.forEach(function(i){
          i.body.static = true;
        }, true)
        this.removeEvent = game.time.events.loop(Phaser.Timer.SECOND / 10, this.removeCrate, this);
      }, this);
    }
  },
  removeCrate: function(){
    if(this.crateGroup.children.length > 0){
      var tempCrate = this.crateGroup.getChildAt(0);
      var height = Math.round((game.height - GROUNDHEIGHT - tempCrate.y - CRATEHEIGHT / 2) / CRATEHEIGHT) + 1;
      this.score += height;
      this.removeSound.play();
      var crateScoreText = game.add.bitmapText(tempCrate.x, tempCrate.y, "smallfont", height.toString(), 36);
      crateScoreText.anchor.set(0.5);
      this.cameraGroup.add(crateScoreText);
      tempCrate.destroy();
    }
    else{
      music.stop();
      this.controlsGroup.destroy();
      game.time.events.remove(this.removeEvent);

      this.gameOverSound.play();
      var scoreText = game.add.bitmapText(game.width / 2, game.height / 5, "font", "YOUR SCORE", 72);
      scoreText.anchor.set(0.5);
      var scoreDisplayText = game.add.bitmapText(game.width / 2, game.height / 5 + 140, "font", this.score.toString(), 144);
      scoreDisplayText.anchor.set(0.5);
      localStorage.setItem(gameOptions.localStorageName,JSON.stringify({
        score: Math.max(this.score, this.savedData.score)
      }));
      game.time.events.add(Phaser.Timer.SECOND * 5, function(){
        game.state.start("PlayGame");
      }, this);
    }
  },
  toggleMusic: function () {
    if (music.isPlaying) {
      music.pause();
      this.audioButton.setFrames(1);
    } else {
      music.play();
      this.audioButton.setFrames(2);
    }
  },
  collectFruit: function(bottle, fruit) {
    //console.log('FRUTA QUE', fruit.animations.currentFrame.index);
    //console.log('BOTTELLA', bottle.key);
    var collapsedFruit = fruit.animations.currentFrame.index;
    var collapsedBottle = bottle.key;

    if(
       (collapsedFruit === 1 && collapsedBottle === 'bottle-1') ||
       (collapsedFruit === 0 && collapsedBottle === 'bottle-2')
      ){
      this.counterGoods++;
    } else {
      this.counterBads++;
    }
    console.log('goods ', this.counterGoods);
    console.log('bads ', this.counterBads);
    fruit.kill();
  },
  swipeBottles: function() {
    var posToMoveFirst = this.bottle1.x === gameOptions.firstXPosition ? gameOptions.secondXPosition : gameOptions.firstXPosition;
    var posToMoveSecond = this.bottle2.x === gameOptions.secondXPosition ? gameOptions.firstXPosition : gameOptions.secondXPosition;
    console.log(posToMoveSecond);

    this.tweenBottle1 = game.add.tween(this.bottle1).to({x: posToMoveFirst}, 300, Phaser.Easing.Linear.None);
    this.tweenBottle2 = game.add.tween(this.bottle2).to({x: posToMoveSecond}, 300, Phaser.Easing.Linear.None);

    this.tweenBottle1.start();
    this.tweenBottle2.start();
  }
}
