//TODO LIST
// Make floor & sky inherit from "scrollable"
// Spawn cacti
// Figure out collisions
// Animate dengar movement (pulse)
// Fix star twinkle, maybe rng spawn on black sky?


var context = document.querySelector("canvas").getContext("2d");
context.canvas.height = 480;
context.canvas.width = 640;
var iFrame = 0;
const TILESIZE = 32; //Assume square tiles, 32x32
var spritesheet = {
  img: document.getElementById('spritesheet')
}

var character = {
  jumping: true,
  xPos: 600,  yPos:0,
  xVel:0,  yVel:0,
  //Spritesheet
  img: document.getElementById('charSpritesheet'),
  sx: 0, sy: 0
};

//Stores img data on non-collidable tiles
//Note: Could probably just make this all tiles and extend subclasses
class bgTile
{
  constructor(sx,sy,width=32,height=32)
  {
    this.sx = sx;
    this.sy = sy;
    this.width  = width;
    this.height = height;
  }
}

var sky = {
  height: 11, //Number of tiles in each strip
  yPos: 0,
  strips: [],
  speed: 0.25,
  offset: 0
};

//Bool flag indicates whether new strip will append or replace
generateSkyStrip = function (replace = false) {
    let newStrip = [];
    for(let i =0; i < sky.height; i++)
    {
      let sx = 97 + Math.floor(Math.random() * 32);
      let sy = 0;
      let newTile = new bgTile(sx,sy);
      newStrip.push(newTile);
    }
    if(replace) { sky.strips.shift();}
    sky.strips.push(newStrip);
};

var floor = {
  height: 4, //Number of tiles in each strip
  yPos: context.canvas.height - 4*TILESIZE,
  strips: [],
  speed: 4,
  offset: 0
};

//Bool flag indicates whether new strip will just append or replace
generateFloorStrip = function () {
    let newStrip = [];
    for(let i = 0; i < floor.height; i++)
    {
      let sx = 97 + Math.floor(Math.random() * 32);
      let sy = 32;
      let newTile = new bgTile(sx,sy);
      newStrip.push(newTile);
    }

    floor.strips.push(newStrip);
    //Remove head if screen is full (inc. +1 overflow)
    if(floor.strips.length-1 > context.canvas.width / TILESIZE)
    {
      floor.strips.shift();
    }
};

//TEMP solution
//Generate initial strips (fill screen, plus 1 overflow for motion)
for(let i = 0; i <= context.canvas.width / TILESIZE; i++)
{
  generateSkyStrip();
  generateFloorStrip();
}

var controller = {
  left:false, right:false, up:false,
  keyListener:function(event)
  {
    var key_state = (event.type == "keydown")?true:false;
    switch(event.keyCode)
    {
      case 32://Space
        controller.up = key_state;
        break;
      case 37://L-arrow
      case 65://A
        controller.left = key_state;
        break;
      case 39://R-arrow
      case 68://D
        controller.right = key_state;
        break;
      default:
        console.log(event.keyCode + "pressed");
        break;
    }
  }
};
/*End of var declaration*/

//Temp solution, static world
var drawSky = function(iFrame)
{
  //Tiles move 32px per 60 frames
  sky.offset += sky.speed * (32/60);
  //Foreach strip (along x-axis, in reverse)
  for(let i = sky.strips.length-1; i >= 0 ; i--)
  {
    //foreach tile in strip *i* (down y-axis)
    for(let j = 0; j < sky.strips[i].length; j++)
    {
      //Expanded for readability
      let sx = sky.strips[i][j].sx;
      let sy = sky.strips[i][j].sy;
      let dx = (context.canvas.width - (i+1)*TILESIZE) + sky.offset;
      let dy = j*TILESIZE + sky.yPos;
      context.drawImage(spritesheet.img,
                        sx, sy, TILESIZE, TILESIZE,  //source image data
                        dx, dy, TILESIZE, TILESIZE); //dest.  image data
    }
  }

  if(sky.offset >= 32)
  {
    generateSkyStrip(true);
    sky.offset = 0;
  }
}

var drawFloor = function(iFrame)
{
  //Tiles move 32px per 60 frames
  floor.offset += floor.speed * (32/60);
  //Foreach strip (along x-axis, in reverse)
  for(let i = floor.strips.length-1; i >= 0; i--)
  {
    //foreach tile in strip *i* (down y-axis)
    for(let j = 0; j < floor.strips[i].length; j++)
    {
      //Expanded for readability
      let sx = floor.strips[i][j].sx;
      let sy = floor.strips[i][j].sy;
      let dx = (context.canvas.width - (i+1)*TILESIZE) + floor.offset;
      let dy = j*TILESIZE + floor.yPos;
      context.drawImage(spritesheet.img,
                        sx, sy, TILESIZE, TILESIZE,  //source image data
                        dx, dy, TILESIZE, TILESIZE); //dest.  image data
    }
  }

  if(floor.offset >= 32)
  {
    generateFloorStrip(true);
    floor.offset = 0;
  }
}

drawLine = function()
{
  context.strokeStyle = "#FF0000";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0,floor.yPos);
  context.lineTo(context.canvas.width,floor.yPos);
  context.stroke();
}

drawCharacter = function()
{
  context.drawImage(spritesheet.img,
                    character.sx,   character.sy,   TILESIZE, TILESIZE,  //source image data
                    character.xPos, character.yPos, TILESIZE, TILESIZE); //dest.  image data
}


/*Beginning of game programming*/
var gameLoop = function()
{
  //Default spritesheet selection
  character.sx=32; character.sy=32
  //Controller movement
  if(controller.up && !character.jumping)
  {
    character.yVel -= 20;
    character.jumping = true;
  }
  if(controller.left)  { character.xVel -= .5; character.sx=0; }
  if(controller.right) { character.xVel += .5; character.sx=64;}
  //Physics
  character.yVel += 1; //Gravity
  character.xPos += character.xVel;
  character.yPos += character.yVel;
  character.xVel *= 0.9; //Friction (x)

  //Collisions
  //Floor
  if(character.yPos + TILESIZE > floor.yPos)
  {
    character.jumping = false;
    character.yPos = floor.yPos - TILESIZE;
    character.yVel = 0;
    character.sy = 0;
  }
  else
  {
    character.sy = 64;
  }

  //Sides of the screen
  if(character.xPos < 0) {character.xPos = 1; }
  if(character.xPos+TILESIZE > context.canvas.width) {character.xPos = context.canvas.width-TILESIZE}

  //Drawing
  //Draw background
  context.fillStyle = "#3F3F3F";
  context.fillRect(0,0,context.canvas.width,context.canvas.height);

  //Construct next frame
  drawLine(); //Debug only
  drawFloor(iFrame);
  drawSky(iFrame);
  drawCharacter();

  //Update iframe (yes ugly ew)
  if(iFrame < 60){iFrame++;}else{iFrame = 0;}

  //Update
  window.requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", controller.keyListener);
window.addEventListener("keyup",   controller.keyListener);
window.requestAnimationFrame(gameLoop);
