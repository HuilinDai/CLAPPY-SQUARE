//CLAPPY SQUARE
let cooldown=0
let mic
let playerImg;
let blockImg;
let mySystem;
let soundEffects;
const TITLE = 0;
const SELECT = 1;
const PLAY = 2;
const GAMEOVER = 3;
const GRAVITY = 0.15;
const JUMP_SPEED = 3.0;
const TITLE_NAME = "CLAPPY SQUARE";
const SCORE_ARRAY = [500, 1500, 2500, 4000, 5000];

function preload(){
	playerImg = loadImage('images/square.png');
	bg0Img = loadImage('images/background/bg2.jpg')
	easyImg = loadImage('images/difficulty/1easy.png')
	normalImg = loadImage('images/difficulty/2normal.png')
	hardImg = loadImage('images/difficulty/3hard.png')
	crazyImg = loadImage('images/difficulty/4crazy.png')
	hellImg = loadImage('images/difficulty/5hell.png')
	cloudImg = loadImage('images/cloud1.png')
	blockImg = {upper:[], lower:[]};
	for(let i = 0; i < 5; i++){
		const img_upper = loadImage("block_upper_" + i + "_mini.png");
		const img_lower = loadImage("block_lower_" + i + "_mini.png");
		blockImg.upper.push(img_upper);
		blockImg.lower.push(img_lower);
	}
	soundEffects = {};
	soundEffects.miss = loadSound("audios/death.wav");
	soundEffects.decision = loadSound("audios/click.wav");
}

//主函数
function ResizePicture(){
	playerImg.resize(20,20)
	bg0Img.resize(518,280)
	easyImg.resize(518,280)
	normalImg.resize(518,280)
	hardImg.resize(518,280)
	crazyImg.resize(518,280)
	hellImg.resize(518,280)
	cloudImg.resize(1200,250)
}
function setup(){
	createCanvas(518,280);
	noStroke();
	mySystem = new System();
	mic = new p5.AudioIn();
	mic.start();
	ResizePicture()
}

function draw(){
    mySystem.update();
	mySystem.draw();
	flyOnVoice()
	updateCoolDown();
}

//系统
class System{
	constructor(){
		this.player = new Player();
		this.blockArray = [];
		this.cloudArray = [];
		this.state = TITLE;
		this.score = 0;
		this.hi_score = {easy:0, normal:0, hard:0, crazy:0, hell:0};
		this.level = "easy";
		this.properFrameCount = 0;
		this.levelColor = {easy:"rgba(80,80,80, 0.8)", normal:"rgba(80,80,80, 0.8)", hard:"rgba(80,80,80, 0.8)", crazy:"rgba(80,80,80, 0.8)", hell:"rgba(80,80,80, 0.8)"};
		this.selectColor = {easy:"rgba(90,130,160, 0.9)", normal:"rgba(190,190,180, 0.9)", hard:"rgba(135,135,150, 1)", crazy:"rgba(100,100,165, 0.9)", hell:"rgba(150,90,90, 0.9)"};
		this.validation = {easy:[0.9, 1.0, 1.0, 1.0], normal:[0.6, 0.85, 1.0, 1.0], hard:[0.3, 0.55, 0.75, 1.0], crazy:[0.05, 0.35, 0.6, 1.0], hell:[0.0, 0.0, 0.0, 0.1]};
		this.cloudProb = {easy:0.75, normal:0.5, hard:0.25, crazy:0.10, hell:0.0}; //云出现概率
		this.setBackgrounds();
		this.properFrameCount = 0;
	}
	initialize(){
		this.player.initialize();
		this.blockArray = [];
		this.cloudArray = [];
		this.score = 0;
		this.properFrameCount = 0;
	}
	setBackgrounds(){
		this.backgrounds = {};
		this.backgrounds.title = bg0Img;
		this.backgrounds.easy = easyImg;
		this.backgrounds.normal = normalImg;
		this.backgrounds.hard = hardImg;
		this.backgrounds.crazy = crazyImg;
		this.backgrounds.hell = hellImg;
	}
	hiscoreUpdate(){
		this.hi_score[this.level] = max(this.score, this.hi_score[this.level]);
	}
	getState(){ return this.state; }
    setState(newState){
		this.state = newState;
		if(newState === TITLE){ this.cloudArray = []; }
		if(newState === PLAY){ this.initialize(); } 
		if(newState === GAMEOVER){ soundEffects.miss.play(); } //game over效果音
	}
	getLevel(x, y){
		const tx = width / 6;
		const ty = height * 3 / 4;
		const r = width / 14;
		if(dist(x, y, tx, ty) < r){ return "easy"; }
		if(dist(x, y, tx * 2, ty) < r){ return "normal"; }
		if(dist(x, y, tx * 3, ty) < r){ return "hard"; }
		if(dist(x, y, tx * 4, ty) < r){ return "crazy"; }
		if(dist(x, y, tx * 5, ty) < r){ return "hell"; }
		return "";
	}
	setLevel(x, y){
		const currentSelectLevel = this.getLevel(x, y);
		if(currentSelectLevel === ""){ return ""; }
		this.level = currentSelectLevel;
		return this.level;
	}
	createBlock(type){
		switch(type){
			case 0:
				const y0 = random(-110, 10);
				this.blockArray.push(new Block(width + 40, y0, -2, 0, "upper", 0));
				this.blockArray.push(new Block(width + 40, y0 + 380, -2, 0, "lower", 0));
				break;
			case 1:
                this.createSimpleBlock(0.5, 1);
				break;
			case 2:
				const y2 = random(-100, -50);
				this.blockArray.push(new Block(width + 40, y2, -2, 1, "upper", 2));
				this.blockArray.push(new Block(width + 40, 280 - y2, -2, -1, "lower", 2));
				break;
			case 3:
				this.createSimpleBlock(1.0, 3);
				break;
			case 4:
				this.createSimpleBlock(1.5, 4);
				break;
		}
	}
	createSimpleBlock(v, type){
		const y = random(-100, 0);
		const vy = (random() < 0.5 ? v : -v);
		this.blockArray.push(new Block(width + 40, y, -2, vy, "upper", type));
		this.blockArray.push(new Block(width + 40, y + 380, -2, vy, "lower", type));
	}
	createCloud(){
		const type = (random() < this.cloudProb[this.level] ? "back" : "front");
		this.cloudArray.push(new Cloud(type));
	}
	update(){
		this.properFrameCount++;
		switch(this.state){
			case TITLE:
			case SELECT:
				if(this.properFrameCount % 60 === 0){ this.createCloud(); }
				for(let cloud of this.cloudArray){ cloud.update(); }
				break;
			case PLAY:
				this.playUpdate(); break;
		}
	}
	draw(){
		switch(this.state){
			case TITLE:
				this.titleDraw(); break;
			case SELECT:
				this.titleDraw(); this.selectDraw(); break;
			case PLAY:
				this.playDraw(); break;
			case GAMEOVER:
				this.playDraw(); this.gameoverDraw(); break;
		}
	}
	playUpdate(){
		for(let block of this.blockArray){ block.update(); }
		for(let cloud of this.cloudArray){ cloud.update(); }
		if(this.properFrameCount % 80 === 0){ this.createBlock(this.getType()); }
		if(this.properFrameCount % 120 === 0){ this.createCloud(); }
		this.player.update();
		if(this.properFrameCount %60 === 0){
			
			this.reflesh();
		}
		
		if(this.collisionCheck()){ this.setState(GAMEOVER); return; }
		
		if(!this.player.isAlive()){ this.setState(GAMEOVER); }
	}
	reflesh(){
		
		this.blockArray = this.blockArray.filter((block) => { return block.isAlive(); });
		this.cloudArray = this.cloudArray.filter((cloud) => { return cloud.isAlive(); });
	}
	collisionCheck(){
		for(let block of this.blockArray){
			const check_x = abs(block.x - this.player.x) < block.w + this.player.w;
			const check_y = abs(block.y - this.player.y) < block.h + this.player.h;
			if(check_x && check_y){ return true; }
			if(!block.passed && block.x + block.w < this.player.x - this.player.w){
				this.score += block.score;
				block.passed = true;
				
			}
		}
		return false;
	}
	getType(){
		const r = random(1);
		const z = this.validation[this.level];
		if(r < z[0]){ return 0; }
		if(r < z[1]){ return 1; }
		if(r < z[2]){ return 2; }
		if(r < z[3]){ return 3; }
		return 4;
	}
	titleDraw(){		
		image(this.backgrounds.title, 0, 0);
		for(let cloud of this.cloudArray){ fill(120); cloud.draw(); }
		fill(255);
		textAlign(CENTER, CENTER);
		push()
		textSize(48);
		translate(100,100);		
		applyMatrix(1, 0, 0, -1, 0, 0);
		fill(0, 80);
		pop();
	}
	selectDraw(){
		const currentSelectLevel = this.getLevel(mouseX, mouseY);
		this.drawChoiceCircle("easy", currentSelectLevel, width / 6);
		this.drawChoiceCircle("normal", currentSelectLevel, width * 2 / 6);
		this.drawChoiceCircle("hard", currentSelectLevel, width * 3 / 6);
		this.drawChoiceCircle("crazy", currentSelectLevel, width * 4 / 6);
		this.drawChoiceCircle("hell", currentSelectLevel, width * 5 / 6);
		fill(255);
		textSize(9);
		const h = height * 3 / 4;
		text("EASY", width / 6, h);
		text("NORMAL", width * 2 / 6, h);
		text("HARD", width * 3 / 6, h);
		text("CRAZY", width * 4 / 6, h);
		text("HELL", width * 5 / 6, h);
	}
	drawChoiceCircle(level, currentSelectLevel, x){
		if(level === currentSelectLevel){ fill(this.selectColor[level]); }else{ fill(this.levelColor[level]); }
		ellipse(x, height * 3 / 4, width / 8, width / 8);
	}
	playDraw(){	
		image(this.backgrounds[this.level], 0, 0);
		for(let cloud of this.cloudArray){ fill(120); if(cloud.type === "back"){ cloud.draw(); } }
		for(let block of this.blockArray){ block.draw(); }
		this.player.draw();
		for(let cloud of this.cloudArray){ fill(60); if(cloud.type === "front"){ cloud.draw(); } }
		fill(255);
		textSize(12);
		textAlign(LEFT, TOP);
		text("SCORE:" + this.score, 5, 5);
		text("Hi-SCORE:" + this.hi_score[this.level], 5, 35);
	}
	gameoverDraw(){
		fill(0, 170);
		rect(0, 0, 0, height);
		
		fill('rgba(60,60,60, 0.6)')//title底框
		rect(width * 4/5, height*1/120, width*1/5.7, height *1/8);
		
		fill(255);//字
		textAlign(CENTER, CENTER);
		textSize(16);
		text("RETURN", width *8/9, height* 1/15);
		textSize(22.5);
		text("GAME OVER ...", width * 1/2, height*2 / 4);
		
	}
}

//entit
class Entity{
	constructor(){
		this.x = 0;
		this.y = 0;
		this.vx = 0;
		this.vy = 0;
	}
	setVelocity(vx, vy){
		this.vx = vx;
		this.vy = vy;
	}
	update(){
		this.x += this.vx;
		this.y += this.vy;
	}
	isAlive(){}
	draw(){}
}

//class
class Player extends Entity{
	constructor(){
		super();
		this.image = playerImg;
		this.w = 13;
		this.h = 15;
		this.initialize();
	}
	initialize(){
		this.x = width / 5;
		this.y = height / 2;
		this.vx = 0;
		this.vy = 0;
	}
	applyGravity(){
		this.vy += GRAVITY;
	}
	applyJump(){
		this.vy = -JUMP_SPEED;
		
	}
	update(){
		super.update();
		this.applyGravity();
	}
	isAlive(){
		return (this.y > -80) && (this.y < height + 80);
	}
	draw(){
		image(this.image, this.x - this.w, this.y - this.h);
	}
}

//柱子
class Block extends Entity{
	constructor(x, y, vx, vy, type, kind){
		super();
		this.type = type;
		this.kind = kind;
		this.score = SCORE_ARRAY[kind];
		this.passed = false; 
		this.image = blockImg[type][kind];
		this.w = 20;
		this.h = 150;
		this.initialize(x, y, vx, vy);
	}
	initialize(x, y, vx, vy){
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
	}
	update(){
		super.update();
		this.reverse();
	}
	reverse(){
		switch(this.type){
			case "upper":
				if(this.kind !== 2){
					if(this.y < -110 || this.y > 10){ this.vy *= -1; }
				}else{
					if(this.y < -110 || this.y > -40){ this.vy *= -1; }
				}
				break;
			case "lower":
				if(this.kind !== 2){
					if(this.y < 270 || this.y > 390){ this.vy *= -1; }
				}else{
					if(this.y < 320 || this.y > 390){ this.vy *= -1; }
				}
				break;
		}
	}
	isAlive(){
		return (this.x > -60);
	}
	draw(){
		if(this.type === "upper"){
			image(this.image, this.x - this.w - 20, this.y - this.h);
		}else{
			image(this.image, this.x - this.w - 20, this.y - this.h - 20);
		}
	}
}


//云
class Cloud extends Entity{
	constructor(type){
		super();
		this.type = type; 
		this.initialize();
	}
	initialize(){
		
		this.x = width + 200;
		this.y = random(100, 160);
		this.vx = -1 * random(2.1, 3.9);
		this.vy = random(-0.5,0.5);
		this.w = random(40, 70);
		this.h = this.w * random(0.25, 0.3);
	}
	isAlive(){
		return (this.x > -120);
	}
	draw(){
		
		image(cloudImg, this.x, this.y, this.w, this.h);
	}
}

function touchStarted(){
	touchStartEvent();
	return false;
}

function touchStartEvent(){
	const state = mySystem.getState();
	switch(state){
		case TITLE:
			mySystem.setState(SELECT); soundEffects.decision.play(); break;
		case SELECT:
			if(mySystem.setLevel(mouseX, mouseY) === ""){ return; }
			mySystem.setState(PLAY);
			soundEffects.decision.play();
			
			break;
		case PLAY:
			mySystem.player.applyJump(); break;
		case GAMEOVER:
			mySystem.hiscoreUpdate();
			if(mouseX > width *4/5 && mouseY < height / 6.5){
				mySystem.setState(TITLE);
			}else{
			  mySystem.setState(PLAY);
			}
			soundEffects.decision.play();
			break;
	}
}

function flyOnVoice(){
	const state=mySystem.getState();
	switch(state){
		case PLAY:
			let lvl = Math.floor(mic.getLevel()*100);
			if((lvl>3)&&(cooldown==0)){
				mySystem.player.applyJump();
				cooldown=10;break;
			}
	}
}

function updateCoolDown(){
	if(cooldown>0){
	  cooldown -=1;
	}
}