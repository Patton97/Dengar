var context, controller, character, loop;
var sx= 0, sy = 0;

context = document.querySelector("canvas").getContext("2d");

context.canvas.height = 480;
context.canvas.width = 640;

var charIdle = document.getElementById('charIdle');
var charJumping = document.getElementById('charJumping');
var charSpritesheet = document.getElementById('charSpritesheet');
character = {
  height: 32,
  width: 32,
  jumping: true,
  xPos: 600,
  xVel:0,
  yPos:0,
  yVel:0,
  color: "#51FF0D",
  img: charSpritesheet
};

floor = {
  yPos: context.canvas.height - 100
};

controller = {
  left:false,
  right:false,
  up:false,
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

loop = function()
{
  //Default spritesheet selection
  sx=32;sy=32
  //Controller movement
  if(controller.up && !character.jumping)
  {
    character.yVel -= 20;
    character.jumping = true;
  }
  if(controller.left)  { character.xVel -= .5; sx=0; }
  if(controller.right) { character.xVel += .5; sx=64;}
  //Physics
  character.yVel += 1; //Gravity
  character.xPos += character.xVel;
  character.yPos += character.yVel;
  character.xVel *= 0.9; //Friction (x)

  //Collisions
  //Floor
  if(character.yPos + character.height > floor.yPos)
  {
    character.jumping = false;
    character.yPos = floor.yPos - character.height;
    character.yVel = 0;
    sy = 0;
  }
  else {
    sy = 64;
  }

  //Sides of the screen
  if(character.xPos < 0) {character.xPos = 1; }
  if(character.xPos+character.width > context.canvas.width) {character.xPos = context.canvas.width-character.width}

  //Drawing
  //Draw background
  context.fillStyle = "#3F3F3F";
  context.fillRect(0,0,context.canvas.width,context.canvas.height);

  //Draw character
  context.drawImage(character.img, sx, sy, character.width, character.width,
                    character.xPos, character.yPos, character.width, character.width);
  //Draw floor
  context.strokeStyle = "#FFFFFF";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0,floor.yPos);
  context.lineTo(context.canvas.width,floor.yPos);
  context.stroke();

  //Update
  window.requestAnimationFrame(loop);
}

window.addEventListener("keydown", controller.keyListener);
window.addEventListener("keyup",   controller.keyListener);

window.requestAnimationFrame(loop);
