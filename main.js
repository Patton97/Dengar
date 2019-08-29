//TODO LIST
// Spawn cacti
// Figure out collisions
// Animate dengar movement (pulse)
// Add star twinkle: rng spawn on black sky?  alt sprites?

/************************/
//Autozoom | https://benjymous.gitlab.io/post/2019-08-25-js13k-tips/
onresize=e=>{
  // Zoom the page to maximise content
  // Height = canvas=480 + gamepad=240 + gap= . Gap is bug fix.
  document.body.style.zoom=Math.min(window.innerWidth/640, window.innerHeight/900);
  //document.body.style.zoom=1;
  // Add padding at the top of the page, to centre the content vertically
  document.body.style.paddingTop=((window.innerHeight/document.body.style.zoom)-900)/2;
};
onresize(); //Force resize

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
  x: 600,  y:0,
  sx: 0, sy: 0,
  xVel:   0,  yVel:0,
  jumping: true,
  draw:function()
  {
    //Choose character sprite
    //  TODO: Move code here
    context.drawImage(spritesheet.img,
                      this.sx,   this.sy,   TILESIZE, TILESIZE,  //source image data
                      this.x, this.y, TILESIZE, TILESIZE); //dest.  image data
  }
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
  constructor(height = 1, y = 0, speed = 1, sy = 0)
  {
    this.height = height;
    this.y = y;
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
        let dy = j*TILESIZE + this.y;
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
      //20% Chance to spawn cactus - Possibly just temp solution
      if(Math.floor(Math.random() * 9) % 5 === 0)
      {
        let cactus = new Cactus(-TILESIZE);
      }
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
        console.log("Key #" + event.keyCode + " pressed");
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
gamepad.ontouchstart = gamepad.ontouchmove = gamepad.ontouchend = gamepad.ontouchcancel = cancelEvent;

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


var ObjectManager =
{
  gameObjects: [],
  update:function()
  {
    this.purgeInactive();
    this.checkAllCollisions();
    this.drawAll();
  },
  purgeInactive:function()
  {
    for(let i = 0; i < this.gameObjects.length; i++)
    {
      if(!this.gameObjects[i].active)
      {
        //You'd think this is a stupid idea and would break everything, but as
        // long as you don't splice 2 objects at the same time, it's safe :D
        delete this.gameObjects[i];
        this.gameObjects.splice(i,1);
      }
    }
  },
  checkAllCollisions:function()
  {
    for(let i = 0; i < this.gameObjects.length; i++)
    {
      this.gameObjects[i].checkCollisions();
    }
  },
  drawAll:function()
  {
    for(let i = 0; i < this.gameObjects.length; i++)
    {
      this.gameObjects[i].draw();
    }
  }
}

class GameObject
{
  constructor(x=0,y=0,width=TILESIZE,height=TILESIZE,sx=0,sy=0,collidable=false)
  {
    this.x=x;
    this.y=y;
    this.width=width;
    this.height=height;
    this.sx=sx;
    this.sy=sy;
    this.collidable=collidable;
    this.active=true;
    ObjectManager.gameObjects.push(this);
  }
  draw()
  {
    //Objects should move with floor
    this.x += floor.speed * (16/60);
    //Expanded for readability
    context.drawImage(spritesheet.img,         //Source spritesheet
                      this.sx,    this.sy,     //Source coords
                      this.width, this.height, //Source dimensions
                      this.x,     this.y,      //Destination coords
                      this.width, this.height);//Destination dimensions
    //If object is now offscreen, deactivate
    this.active = this.x < context.canvas.width;
  }
  checkCollisions()
  {
    //If object isn't collidable, skip check
    if(this.collidable)
    {
      //AABB collision test
      if(character.x < this.x + this.width
      && character.x + TILESIZE > this.x
      && character.y < this.y + this.height
      && character.y + TILESIZE > this.y)
      {
        //TODO: Game over sequence
        //For now, player just bounces off
        character.xVel = 10;
        return true;
      }
    }
    //If code reaches this point, no collision detected
    return false;
  }
}

class Cactus extends GameObject
{
  constructor(x)
  {
    //Randomly select which row to place cactus in
    let y = floor.y+(TILESIZE*(Math.floor(Math.random()*5) - 1));
    //Randomly select which cactus sprite to use
    let sx = 96 + (TILESIZE * Math.floor(Math.random() * 2));
    let sy = 64;
    super(x,y,TILESIZE,TILESIZE,sx,sy,true);
  }
}

var prevFrameTime=0;
var fps=0;
function drawFPS(iFrame)
{
  //Update value every 10 frames for better readability
  if(iFrame % 10 === 0)
  {
    fps = Math.floor(1000/(performance.now()-prevFrameTime));
  }
  prevFrameTime = performance.now();
  //Draw text every frame to avoid flickering
  context.font = "normal bold 1em courier new";
  context.fillStyle = "yellow";
  context.textAlign = "right";
  context.fillText(fps, context.canvas.width,10);
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
  character.x += character.xVel;
  character.y += character.yVel;
  character.xVel *= 0.9; //Friction (x)

  //Check Boundaries
  //Floor
  if(character.y + TILESIZE > floor.y)
  {
    character.jumping = false;
    character.y = floor.y - TILESIZE;
    character.yVel = 0;
    character.sy = 0;
  }
  else
  {
    character.sy = 64;
  }
  //Sides of the screen
  if(character.x < 0) {character.x = 1; }
  if(character.x+TILESIZE > context.canvas.width) {character.x = context.canvas.width-TILESIZE}

  //Drawing
  //Draw background
  context.fillStyle = "#3F3F3F";
  context.fillRect(0,0,context.canvas.width,context.canvas.height);

  //Construct next frame
  //Needs organising
  floor.draw();
  sky.draw();
  character.draw();
  ObjectManager.update();
  console.log(ObjectManager.gameObjects.length);

  //DEBUG ONLY
  drawFPS(iFrame);

  //Update iframe (yes ugly ew)
  if(iFrame < 60){iFrame++;}else{iFrame = 0;}

  //Update
  window.requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", controller.keyListener);
window.addEventListener("keyup",   controller.keyListener);
window.requestAnimationFrame(gameLoop);
