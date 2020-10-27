//Special thanks to the following video for basic logic and game structure format
//Intro to Game Development with JavaScript - Full Tutorial by freeCodeCamp.org
//https://www.youtube.com/watch?v=3EMxBkqC4z0

//Gets our canvas
let canvas = document.getElementById("gameScreen");
//Gets our 2d context
let ctx = canvas.getContext("2d");

//Constant width and height for the game. Same dimensions as the canvas in html
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

//Arrays to store arrays of preset wave structures. Each sub-array is one wave of enemies 
//where 1 = enemy 0 = empty
//EASY
const level1 = [
	[0, 0, 1, 0, 0],
	[0, 1, 0, 0, 0],
	[0, 0, 0, 1, 0],
	[1, 0, 0, 0, 1],
	[0, 1, 0, 1, 0],
	[1, 0, 1, 0, 1],
	[0, 1, 1, 1, 0],
	[1, 0, 0, 1, 0],
	[0, 1, 0, 0, 1]
];
//HARD
const level2 = [
	[0, 1, 0, 1, 0],
	[0, 1, 1, 1, 0],
	[1, 1, 1, 0, 0],
	[0, 0, 1, 1, 1],
	[1, 1, 0, 1, 0],
	[0, 1, 0, 1, 1],
	[1, 1, 0, 1, 1],
	[1, 1, 1, 1, 0],
	[0, 1, 1, 1, 1],
	[1, 0, 1, 1, 1],
	[1, 1, 1, 0, 1],
	[1, 1, 1, 1, 1],
];
//INFINITE
//Blank array allows later code to generate random waves
const infinite = [];

//States of the game which determine whether different functions can run or not
const GAMESTATE = {
	PAUSED: 0,
	RUNNING: 1,
	MENU: 2,
	GAMEOVER: 3,
	SUCCESS: 4
};

//Builds levels by taking in a level variable created above
function buildLevel(game, level) {
	//An array to store the enemy objects in
	let enemies = [];

	//If it's an empty level array, it will generate a random row of enemies
	if(level.length === 0) {
		for(i = 0; i < 5; i++) {
			if(Math.round(Math.random())) {
				let position = {
					x: game.gameWidth, //Start just off screen
					y: 126 * i //120 plus the difference of enemy height / 5
				};
				//Add created enemies to the array
				//Enemy speed increases per enemies destroyed
				enemies.push(new EnemyCraft(game, position, 5 + game.score / 5));
			}
		}
	}
	//Iterate over each array within the level array to build the enemies
	level.forEach((row, rowIndex) => {
		row.forEach((enemy, enemyIndex) => {
			if(enemy === 1) {
				let position = {
					x: game.gameWidth + game.gameWidth * rowIndex * 2, //Extra space prevents overlapping waves
					y: 126 * enemyIndex //120 plus the difference of enemy height / 5
				};
				//Add created enemies to the array, also makes enemies faster in later rows
				enemies.push(new EnemyCraft(game, position, 5 + rowIndex / 3));
			}
		});
	});
	return enemies;
}

//Checks for collision using entersecting boxes and returns a boolean
function detectContact(playerObject, gameObject) {
	//Collision boundaries
	let playerObjectHitboxTop = playerObject.position.y;
	let playerObjectHitboxBottom = playerObject.position.y + playerObject.height;
	let playerObjectHitboxLeft = playerObject.position.x;
	let playerObjectHitboxRight = playerObject.position.x + playerObject.width;
	let gameObjectHitboxTop = gameObject.position.y;
	let gameObjectHitboxBottom = gameObject.position.y + gameObject.height;
	let gameObjectHitboxLeft = gameObject.position.x;
	let gameObjectHitboxRight = gameObject.position.x + gameObject.width;

	//Checkscollisions
	if(playerObjectHitboxRight >= gameObjectHitboxLeft && 
		playerObjectHitboxLeft <= gameObjectHitboxRight &&
		playerObjectHitboxTop <= gameObjectHitboxBottom &&
		playerObjectHitboxBottom >= gameObjectHitboxTop) {
		return true;
	}
	else {
		return false;
	}
}

//The craft that the player controls
class PlayerCraft {
	constructor(game) {
		//Saving the game object for use
		this.game = game;
		//Saving the width and height from the game class for reference
		this.gameWidth = game.gameWidth;
		this.gameHeight = game.gameHeight;
		//Sprite sheet for the craft
		this.image = document.getElementById('img_playerCraft');
		//The width and height of the craft
		this.width = 160;
		this.height = 120;
		//The number of pixels the playercraft will move per frame
		this.maxSpeed = 10;
		//Used to calculate new postion in the draw function
		this.speed = {
			x: 0,
			y: 0
		};
		//Current coordinates for drawing. Starts at the center left edge of the screen
		this.position = {
			x: 20,
			y: game.gameHeight / 2 - this.height / 2
		};
		//Coordinates for the sprite sheet
		this.imgPosition = {
			x: 0, //Default is set to armed (no missile live) position
			y: 120 //Default is in the middle row for neutral
		};
		//Used for changing sprite sheet based on the missile class condition
		this.liveprojectile = false;
	}
	//negative x speed moves coordinates to the left
	moveLeft() {
		this.speed.x = -this.maxSpeed;
	}
	//positive x speed moves coordinates to the right
	moveRight() {
		this.speed.x = this.maxSpeed;
	}
	//negative y speed moves coordinates up (0,0 is the top left corner)
	moveUp() {
		this.speed.y = -this.maxSpeed;
		this.imgPosition.y = 0; //Sets sprite value on vertical axis to show image for moving up
	}
	//positive y speed moves coordinates down (0,0 is the top left corner)
	moveDown() {
		this.speed.y = this.maxSpeed;
		this.imgPosition.y = 240; //Sets sprite value on vertical axis to show image for moving down
	}
	//stops changes in the x position
	stopX() {
		this.speed.x = 0;
	}
	//stops changes in the y position
	stopY() {
		this.speed.y = 0;
		this.imgPosition.y = 120; //Sets sprite value on vertical axis to show image for horizontal only
	}

	//Places the object on the canvas
	draw(ctx) {
		ctx.drawImage(this.image, this.imgPosition.x, this.imgPosition.y, this.width, this.height,//sprite coords and dimensions
			this.position.x, this.position.y, this.width, this.height); //placement coords and dimensions(same)
	}

	//Checks if values need to change and changes accordingly
	//deltaTime (change in time) allows adjustments every frame
	update(deltaTime) {
		if(!deltaTime) return; //Allows the program to not soft lock
		if(this.liveprojectile) this.imgPosition.x = 160; //If the missile is live, sprite value is changed horizontally
		else this.imgPosition.x = 0; //If the missile is not live, sprite value is set to default horizontally
		this.position.x += this.speed.x; //Position changes is speed is active
		this.position.y += this.speed.y; //Position changes is speed is active
		if(this.position.x < 0) this.position.x = 0; //Prevents movement off screen to the left
		if(this.position.x + this.width > this.gameWidth) this.position.x = this.gameWidth - this.width;
		//Prevents movement off screen to the right
		//The following allows the playercraft to warp from the top to the bottom and vice versa once halfway across
		if(this.position.y < 0 - this.height / 2) this.position.y = this.gameHeight - this.height / 2;
		if(this.position.y + this.height > this.gameHeight + this.height / 2) this.position.y = -this.height / 2;
	}
}
//The enemies that will populate the level waves
class EnemyCraft {
	//Position is passed in since it will change based on when the craft is generated
	constructor(game, position, speed) {
		//Similar attributes to the playercraft
		this.game = game;
		this.gameWidth = game.gameWidth;
		this.gameHeight = game.gameHeight;
		this.image = document.getElementById('img_enemyCraft');
		this.width = 120;
		this.height = 90;
		this.speed = speed;
		this.position = {
			x: position.x,
			y: position.y
		};
		this.imgPosition = {
			x: 0,
			y:0
		};
		//Boolean to store whether or not the enemy has been hit by the player
		this.hit = false;
		//Boolean for if the enemy leaves the screen
		this.gone = false;
	}
	//Same concept as the playercraft
	update(deltaTime) {
		if(!deltaTime) return;
		//The enemy will always move to the left
		this.position.x -= this.speed;
		//If the enemy is hit by a missile and has not already been hit,
		//it is marked as hit and the player gets a point
		if(detectContact(this.game.missile, this)) {
			if(!this.hit) {
				this.game.missile.position.y = this.gameHeight + 1; //Missile is moved off screen
				this.game.missile.live = false; //Missile is no longer live and can be fired again
	
				this.hit = true;
				this.imgPosition.x = 120; //Sprite value for destroyed image
				this.game.score++;
			}
		}
		//If the enemy runs into a player and has not already been hit, 
		//the enemy is marked as hit and the player loses health but gets a point
		if(detectContact(this.game.playercraft, this)) {
			if(!this.hit) {
				this.hit = true;
				this.imgPosition.x = 120; //Sprite value for destroyed image
				this.game.playerhealth--;
				this.game.score++;
			}
		}
		//If the enemy exits the stage and is not hit, the base loses health and the enemy is removed
		if(this.position.x <= 0 - this.width) {
			this.gone = true;
			if(!this.hit) this.game.health--;
		}
	}
	//Same as playercraft
	draw(ctx) {
		ctx.drawImage(this.image, this.imgPosition.x, this.imgPosition.y, this.width, this.height,
			this.position.x, this.position.y, this.width, this.height);
	}
}
//The projectile that the playercraft may fire
class Missile {
	constructor(game) {
		//Similar variables to playercraft
		this.game = game;
		this.gameWidth = game.gameWidth;
		this.gameHeight = game.gameHeight;
		this.image = document.getElementById('img_projectile');
		this.width = 80;
		this.height = 30;
		this.speed = 25;
		this.position = {
			x: game.gameWidth,
			y: game.gameHeight + 1
		};
		//Boolean used to ensure a missile cannot be re-fired before it has hit anything
		this.live = false;
	}

	fire(playercraft) {
		//If there is a missile already live, return
		if(this.live) return;
		//Sets the starting position at the center of the playercraft
		this.position.x = playercraft.position.x + playercraft.width / 2 - this.width / 2;
		this.position.y = playercraft.position.y + playercraft.height / 2 - this.height / 2;
		//Missile is now live. Fox 2!
		this.live = true;
	}

	//Same as playercraft, but without the extra sprite sheet coordinates
	draw(ctx) {
		ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
	}

	//Same concept as the playercraft
	update(deltaTime) {
		if(!deltaTime) return;
		if(this.live) this.position.x += this.speed;
		//If the missile goes off the screen, it is no longer live and a new one may be fired
		if(this.position.x > this.gameWidth) {
			this.live = false;
			this.position.y = this.gameHeight + 1; //set missile position off screen
		};
	}
}
//The dynamic background layers
class Space {
	constructor(game) {
		this.game = game;
		this.gameWidth = game.gameWidth;
		this.gameHeight = game.gameHeight;
		this.imageb1 = document.getElementById('img_background');
		this.imageb2 = document.getElementById('img_background');
		this.imagef1 = document.getElementById('img_foreground');
		this.imagef2 = document.getElementById('img_foreground');
		//Images widths will be the same as the game dimensions
		this.width = this.gameWidth;
		this.height = this.gameHeight;
		//Change in coordinates for the background. The foreground image moves faster
		this.speed = {
			back: 1,
			front: 2
		};
		//The identical images will constantly be one after the other
		this.position = {
			f1: 0,
			f2: this.gameWidth,
			b1: 0,
			b2: this.gameWidth
		};
	}

	draw(ctx) {
		//Background first to allow it to be behind
		ctx.drawImage(this.imageb1, this.position.f1, 0, this.width, this.height);
		ctx.drawImage(this.imageb2, this.position.f2, 0, this.width, this.height);
		//Foreground
		ctx.drawImage(this.imagef1, this.position.b1, 0, this.width, this.height);
		ctx.drawImage(this.imagef2, this.position.b2, 0, this.width, this.height);
	}

	update(deltaTime) {
		if(!deltaTime) return;
		//Background changes
		this.position.f1 -= this.speed.back;
		this.position.f2 -= this.speed.back;
		//Foreground changes
		this.position.b1 -= this.speed.front;
		this.position.b2 -= this.speed.front;
		//If the image reaches its end, move it to the end of the other identical image
		if(this.position.f1 <= -this.gameWidth) this.position.f1 = this.gameWidth;
		if(this.position.f2 <= -this.gameWidth) this.position.f2 = this.gameWidth;
		if(this.position.b1 <= -this.gameWidth) this.position.b1 = this.gameWidth;
		if(this.position.b2 <= -this.gameWidth) this.position.b2 = this.gameWidth;
	}
}
//Takes all input from the user
class InputHandler {
	constructor(playercraft, missile, game) {
		//For when the user presses a key
		document.addEventListener('keydown', (event) => {
			switch(event.keyCode) {
				case 37: //Left arrow
				playercraft.moveLeft();
				break;

				case 38: //Up arrow
				if(game.gamestate === GAMESTATE.PAUSED || game.gamestate === GAMESTATE.GAMEOVER
					|| game.gamestate === GAMESTATE.SUCCESS) break; //Prevents icon from changing during pause or game over
				playercraft.moveUp();
				break;

				case 39: //Right arrow
				playercraft.moveRight();
				break;

				case 40: //Down arrow
				if(game.gamestate === GAMESTATE.PAUSED || game.gamestate === GAMESTATE.GAMEOVER
					|| game.gamestate === GAMESTATE.SUCCESS) break; //Prevents icon from changing during pause or game over
				playercraft.moveDown();
				break;

				case 32: //Spacebar
				if(game.gamestate === GAMESTATE.PAUSED || game.gamestate === GAMESTATE.GAMEOVER
					|| game.gamestate === GAMESTATE.SUCCESS) break; //Prevents icon from changing during pause or game over
				missile.fire(playercraft);
				break;

				case 27: //Escape
				if(game.gamestate != GAMESTATE.RUNNING && game.gamestate != GAMESTATE.PAUSED) break;
				//Prevents player from accessing pause while on anything but the running game or pause menu
				game.togglePause();
				break;

				case 49: //1 key
				game.level = level1;
				game.start(); //generates new game based on the given level array
				break;

				case 50: //2 key
				game.level = level2;
				game.start(); //generates new game based on the given level array
				break;

				case 51: //3 key
				game.level = infinite;
				game.start(); //generates new game based on the given level array
				break;

				case 48: //0 key
				if(game.gamestate === GAMESTATE.PAUSED || game.gamestate === GAMESTATE.GAMEOVER ||
					game.gamestate === GAMESTATE.SUCCESS) //Only works in pause states
					location.reload(); //Reloads the page, defaulting to the MENU gamestate
				break;
			}
		});
		//For when the user releases a key
		document.addEventListener('keyup', (event) => {
			switch(event.keyCode) {
				case 37: //Left arrow
				if(playercraft.speed.x < 0) playercraft.stopX();
				break;
				case 38: //Up arrow
				if(playercraft.speed.y < 0)playercraft.stopY();				
				break;
				case 39: //Right arrow
				if(playercraft.speed.x > 0) playercraft.stopX();				
				break;
				case 40: //Down arrow
				if(playercraft.speed.y > 0)playercraft.stopY();				
				break;
			}
		});
	}


}

//Manages all the different game elements
class Game {
	//Stores global attributes for other classes to call 
	constructor(gameWidth, gameHeight) {
		this.gameWidth = gameWidth;
		this.gameHeight = gameHeight;
		//Image for the home screen
		this.image = document.getElementById('img_menu');
		//Sets default gamestate and instantiates objects and empty arrays
		this.gamestate = GAMESTATE.MENU;
		this.playercraft = new PlayerCraft(this);
		this.missile = new Missile(this);
		this.gameObjects = [];
		this.enemies = [];
		//Current level, determined in the InputHandler
		this.level = [];
		//Health if enemies pass over the far left side
		this.health = 5;
		//Health if player is hit
		this.playerhealth = 5;
		//Number of enemies the player has actively hit
		this.score = 0;
		new InputHandler(this.playercraft, this.missile, this);		
	}

	//Instantiates and populates all game objects and arrays
	start() {
		//Prevents the player from reinitializing the game while not on the menu
		if(this.gamestate !== GAMESTATE.MENU) return;
		//Background created
		this.space = new Space(this);
		//Generates the enemies based on the arrays stored in the level selected by player input
		this.enemies = buildLevel(this, this.level);

		//Creates an array to make iterating over the draw and update functions easier
		//Order is important for draw to ensure the correct objects are on top of each other
		this.gameObjects = [
			this.space,
			this.missile,
			this.playercraft
		];

		//Allows the game to begin and unlocks certain functions and inputs
		this.gamestate = GAMESTATE.RUNNING;
	}

	update(deltaTime) {
		//Checks to make sure the health does not enter the negative, and checks if the game is over
		if(this.health <= 0) this.health = 0;
		if(this.playerhealth <= 0) this.playerhealth = 0;
		//Loss conditions are either the player reaches 0 health or 5 enemies have gotten through
		if(this.health <= 0 || this.playerhealth <= 0) {
			this.gamestate = GAMESTATE.GAMEOVER;
			this.playercraft.imgPosition.x = 320; //playercraft sprite changes to horizontal position to destroyed
		}

		//If the game is not running, nothing updates
		if(this.gamestate === GAMESTATE.PAUSED ||
			this.gamestate === GAMESTATE.MENU ||
			this.gamestate === GAMESTATE.GAMEOVER ||
			this.gamestate === GAMESTATE.SUCCESS) return;
		
		//Checks if the player has reached the end of the waves
		if(this.gamestate === GAMESTATE.RUNNING) {
			//Success is only reached on finite levels
			if(this.enemies.length === 0 && this.level != 0) this.gamestate = GAMESTATE.SUCCESS;
			//Creates another row of enemies if on the infinite level
			if(this.enemies.length === 0)this.enemies = buildLevel(this, this.level);
		}
		//Adjusts the sprite of the playercraft if there is a live missile
		this.playercraft.liveprojectile = this.missile.live;

		//Iterates over all game objects to update them
		[...this.gameObjects, ...this.enemies].forEach(object => object.update(deltaTime));

		//Deletes enemies from the array if they have passed over the left side
		this.enemies = this.enemies.filter(enemy => !enemy.gone);
	}

	draw(ctx) {
		//Iterates over all game objects to draw them
		[...this.gameObjects, ...this.enemies].forEach(object => object.draw(ctx));

		//The display for the health and pause controls
		ctx.font = "20px Arial";
		ctx.fillStyle = "white";
		ctx.textAlign = "left";
		ctx.fillText("Base Health: " + this.health + "\tPlayer Health: " + this.playerhealth, 
			20, 30);
		ctx.textAlign = "right";
		ctx.fillText("Press ESC to Pause", 780, 30);

		//Displays menu image while in the menu state
		if(this.gamestate === GAMESTATE.MENU) {
			ctx.rect(0, 0, this.gameWidth, this.gameHeight);
			ctx.fillStyle = "rgba(0,0,0,1)";
			ctx.fill();
			ctx.drawImage(this.image, 0, 0, this.gameWidth, this.gameHeight);
		}

		//Special text and screen for if the game is paused
		if(this.gamestate === GAMESTATE.PAUSED) {
			ctx.rect(0, 0, this.gameWidth, this.gameHeight);
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fill();

			ctx.font = "30px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "center";
			ctx.fillText("Press ESC to unpause", this.gameWidth / 2, this.gameHeight / 2 - 40);
			ctx.fillText("Press 0 to return to Menu", this.gameWidth / 2, this.gameHeight / 2);
			ctx.fillText("Current Score: " + this.score, this.gameWidth / 2, this.gameHeight / 2 + 40);
		}

		//Special text and screen for if the game is over
		if(this.gamestate === GAMESTATE.GAMEOVER) {
			ctx.rect(0, 0, this.gameWidth, this.gameHeight);
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fill();

			ctx.font = "30px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "center";
			ctx.fillText("Mission Finished", this.gameWidth / 2, this.gameHeight / 2 - 40);
			ctx.fillText("Press 0 to return to Menu", this.gameWidth / 2, this.gameHeight / 2);
			ctx.fillText("Final Score: " + this.score, this.gameWidth / 2, this.gameHeight / 2 + 40);
		}

		//Special text and screen for if the user completes a finite level
		if(this.gamestate === GAMESTATE.SUCCESS) {
			ctx.rect(0, 0, this.gameWidth, this.gameHeight);
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fill();

			ctx.font = "30px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "center";
			ctx.fillText("Mission Success", this.gameWidth / 2, this.gameHeight / 2 - 40);
			ctx.fillText("Press 0 to return to Menu", this.gameWidth / 2, this.gameHeight / 2);
			ctx.fillText("Final Score: " + this.score, this.gameWidth / 2, this.gameHeight / 2 + 40);
		}
	}

	togglePause() {
		//Changes the gamestate to pause or running based on whether the game is running or paused
		if(this.gamestate === GAMESTATE.PAUSED) {
			this.gamestate = GAMESTATE.RUNNING;
		}
		else {
			this.gamestate = GAMESTATE.PAUSED;
		}
	}
}

//Instance of the game object
let game = new Game(GAME_WIDTH, GAME_HEIGHT);

//An active counter for frames
let lastTime = 0;

//The game loop
function gameLoop(timestamp) {
	let deltaTime = timestamp - lastTime;
	lastTime = timestamp;
	//Clears canvas every frame so new images are not drawn over old ones
	ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
	//Updates and draws game elements
	game.update(deltaTime);
	game.draw(ctx);
	//Recursion
	requestAnimationFrame(gameLoop);
}
//Play the game
gameLoop();