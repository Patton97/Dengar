//TODO LIST
// Spawn cacti
// Figure out collisions
// Animate dengar movement (pulse)
// Fix star twinkle, maybe rng spawn on black sky?

//Autozoom test
/************************/
//https://benjymous.gitlab.io/post/2019-08-25-js13k-tips/
//zoom the page to fit the window
onresize=e=>{
  // zoom the page to maximise your content within the window.
  // This assumes a 640x480 canvas - change the numbers to match your canvas size
  document.body.style.zoom=Math.min(window.innerWidth/640, window.innerHeight/480);
  // Add padding at the top of the page, to centre the content vertically
  document.body.style.paddingTop=((window.innerHeight/document.body.style.zoom)-480)/2;
};

onresize(); // manually call the onresize handler, to make sure it's the right
//size from the start

// Set the left and right margins, to centre the content horizontally
document.body.style.maxWidth=640;
document.body.style.margin="auto";
/************************/

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

class Scrollable
{
  constructor(height = 1, yPos = 0, speed = 1, sy = 0)
  {
    this.height = height;
    this.yPos = yPos;
    this.speed = speed;
    this.sy = sy;
    this.strips = [];
    this.offset = 0;

    //Generate initial strips (fill screen, plus 1 overflow for motion)
    for(let i = 0; i <= context.canvas.width / TILESIZE; i++)
    {
      this.makeNewStrip();
    }
  }
  makeNewStrip()
  {
    let newStrip = [];
    for(let i =0; i < this.height; i++)
    {
      let sx = 97 + Math.floor(Math.random() * 32);
      let sy = this.sy;
      let newTile = new bgTile(sx,sy);
      newStrip.push(newTile);
    }
    //Push new strip to 'strips' array
    this.strips.push(newStrip);
    //Remove head if screen is full (inc. +1 overflow)
    if(this.strips.length-1 > context.canvas.width / TILESIZE)
    {
      this.strips.shift();
    }
  }
  draw()
  {
    //Assumes base speed (1) moves 16px per 60 frames
    this.offset += this.speed * (16/60);
    //Foreach strip (along x-axis, in reverse)
    for(let i = this.strips.length-1; i >= 0 ; i--)
    {
      //foreach tile in strip *i* (down y-axis)
      for(let j = 0; j < this.strips[i].length; j++)
      {
        //Expanded for readability
        let sx = this.strips[i][j].sx;
        let sy = this.strips[i][j].sy;
        let dx = (context.canvas.width - (i+1)*TILESIZE) + Math.floor(this.offset);
        let dy = j*TILESIZE + this.yPos;
        context.drawImage(spritesheet.img,
                          sx, sy, TILESIZE, TILESIZE,  //source image data
                          dx, dy, TILESIZE, TILESIZE); //dest.  image data
      }
    }
    //If furthest strip is offscreen, purge & replace
    if(this.offset >= 32)
    {
      this.makeNewStrip();
      this.offset = 0;
    }
  }
}

var sky   = new Scrollable(11,0,1);
var floor = new Scrollable(4,context.canvas.height - 4*TILESIZE,10,32);

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

//Gamepad controller for mobile
//Block default behaviour
cancelEvent=e=>{
  e.preventDefault();
  e.stopPropagation();
  e.cancelBubble = true;
  e.returnValue = false
};
dpad.ontouchstart = dpad.ontouchmove = dpad.ontouchend = dpad.ontouchcancel = cancelEvent;

//On Android and iOS, use touchstart/end
if( /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) )
{
  d = "touchstart";
  u = "touchend";
}
//On PC, use mousedown/up
else
{
  d = "mousedown";
  u = "mouseup";
};

//Event Handlers
//Jump
touchJ.addEventListener(d,e=>{
  cancelEvent(e);
  controller.up=true;
}, {passive:false});
touchJ.addEventListener(u,e=>{
  cancelEvent(e);
  controller.up=false;
}, {passive:false});

//left
touchL.addEventListener(d,e=>{
  cancelEvent(e);
  controller.left=true;
}, {passive:false});
touchL.addEventListener(u,e=>{
  cancelEvent(e);
  controller.left=false;
}, {passive:false});

//Right
touchR.addEventListener(d,e=>{
  cancelEvent(e);
  controller.right=true;
}, {passive:false});
touchR.addEventListener(u,e=>{
  cancelEvent(e);
  controller.right=false;
}, {passive:false});

//End of Gamepad

//Draw character
drawCharacter = function()
{
  //Animate "walk"
  //Looks like shit
  //if(!character.jumping && iFrame > 50) { character.sy = 32;  }
  context.drawImage(spritesheet.img,
                    character.sx,   character.sy,   TILESIZE, TILESIZE,  //source image data
                    character.xPos, character.yPos, TILESIZE, TILESIZE); //dest.  image data
}

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
  floor.draw();
  sky.draw();
  drawCharacter();

  //Update iframe (yes ugly ew)
  if(iFrame < 60){iFrame++;}else{iFrame = 0;}




  //Update
  window.requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", controller.keyListener);
window.addEventListener("keyup",   controller.keyListener);
window.requestAnimationFrame(gameLoop);
