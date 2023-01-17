const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 600;

//global variables
const cellSize = 100;
const cellGap = 3;
let numberOfRessources = 300;
let enemiesInterval = 600;
let frame = 0;
let score = 0;
let gameOver = false;
const winningScore = 50;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const ressources = [];

//mouse
const mouse = {
    x: 10,
    y: 10,
    width : 0.1,
    height : 0.1,
}

let canvasPosition = canvas.getBoundingClientRect();
console.log(canvasPosition);
canvas.addEventListener('mousemove' , function(e){
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave',function(e){
    mouse.x = undefined;
    mouse.y = undefined;
})

//game board
const controlsBar = {
    width : canvas.width,
    height : cellSize,
}

class Cell {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;

    }

    draw(){
        if(mouse.x && mouse.y && collision(this,mouse)){
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x,this.y,this.width,this.height); 
        }
    }
}

function createGrid(){
    for(let y = cellSize; y < canvas.height; y+= cellSize){
        for(let x = 0; x < canvas.width; x+= cellSize){
            gameGrid.push(new Cell(x,y));
        }
    }
}
createGrid();
function handleGameGrid(){
    for(let i =0; i < gameGrid.length;i++){
        gameGrid[i].draw();
    }
}

//projectiles
class Projectiles {
    constructor(x,y){
        this.x =x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;

    }

    update(){
        this.x += this.speed;
    }

    draw(){
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.width,0,Math.PI *2);
        ctx.fill();
    }
}

function handleProjectiles(){
    for(let i = 0; i<projectiles.length;i++){
        projectiles[i].update();
        projectiles[i].draw();

        for(let j = 0; j< enemies.length;j++){
            if(enemies[j] && projectiles[i] && collision(projectiles[i],enemies[j])){
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i,1);
                i--;
            }
        }

        if(projectiles[i] && projectiles[i].x > canvas.width - cellSize){
            projectiles.splice(i,1);
            i--;
        }
        //console.log('projectiles : ', projectiles.length);
    }
}

//defenders (towers)
const defender1 = new Image();
defender1 .src= 'assets/plant.png';
class Defender{
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap *2;
        this.height = cellSize - cellGap *2;
        this.shooting = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
        this.frameX = 0;
        this.frameY = 0;
        this.spriteWidth = 167;
        this.spriteHeight = 243;
        this.minFrame = 0;
        this.maxFrame = 1;
    }

    draw(){
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15,this.y + 25);
        ctx.drawImage(defender1,this.frameX * this.spriteWidth, this.frameY,this.spriteWidth,this.spriteHeight,this.x,this.y,this.width,this.height);
    }

    update(){
        if(frame % 8 === 0){
            if(this.frameX < this.maxFrame)this.frameX++;
            else this.frameX = this.minFrame;
        }
        
        if(this.shooting){
            this.timer++;
            if(this.timer % 100 === 0){
                projectiles.push(new Projectiles(this.x +70,this.y+50));
            }
        } else {
            this.timer = 0;
        }
        
    }
}

function handleDefenders(){
    for(let i =0; i < defenders.length ; i++){
        defenders[i].draw();
        defenders[i].update();
        //console.log(defenders);

        if(enemyPositions.indexOf(defenders[i].y) !== -1){
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }

        for(let j = 0; j < enemies.length; j++ ){
            if(defenders[i] && collision(defenders[i],enemies[j])){
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;
            }
            if(defenders[i] && defenders[i].health <= 0 ){
                defenders.splice(i,1);
                i--;//i goes to -1
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
}

//floating messages
const floatingMessages = [];
class FloatingMessage {
    constructor(value,x,y,size,color) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;
    }

    update(){
        this.y -= 0.3;
        this.lifeSpan++;
        if(this.opacity > 0.03)this.opacity-=0.03;
    }
    draw(){
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px Orbitron';
        ctx.fillText(this.value,this.x,this.y);
        ctx.globalAlpha = 1;
    }
}

function handleFloatingMessages(){
    for(let i =0;i<floatingMessages.length;i++){
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if(floatingMessages[i].lifeSpan >= 50){
            floatingMessages.splice(i,1);
            i--;
        }
    }
}

//enemies
const enemyTypes = [];
const enemy1 = new Image();
const enemy2 = new Image();
enemy1.src = 'assets/zombie.png';
enemyTypes.push(enemy1);
enemy2.src = 'assets/enemy4.png';
enemyTypes.push(enemy2);


class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap *2;
        this.height = cellSize - cellGap *2;
        this.speed = Math.random() * 0.2 +0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.enemyTypes = enemyTypes[Math.floor(Math.random() *  enemyTypes.length)];
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 7;
        this.spriteWidth = 290;
        this.spriteHeight = 410;
    }
    update(){
        this.x -= this.movement;
        if(frame % 10 === 0){
            if(this.frameX < this.maxFrame)this.frameX++;
            else this.frameX = this.minFrame;
        }
        
    }
    draw(){
        //ctx.fillStyle = 'red';
        //ctx.fillRect(this.x ,this.y ,this.width , this.height);
        ctx.fillStyle = 'black';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15,this.y + 25); 
        ctx.drawImage(this.enemyTypes,this.frameX * this.spriteWidth,0,this.spriteWidth,
            this.spriteHeight,this.x,this.y,this.width,this.height);
    }
}

function handleEnemies(){
    for(let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        if(enemies[i].x < 0){
            gameOver = true;
        }
        if(enemies[i].health <= 0){
            let gainedRessources = enemies[i].maxHealth/10;
            floatingMessages.push(new FloatingMessage('+' + gainedRessources,
            enemies[i].x,enemies[i].y,30,'black'));
            floatingMessages.push(new FloatingMessage('+' + gainedRessources,
            250,50,30,'gold'));

            numberOfRessources += gainedRessources;
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex,1); 
            score += gainedRessources;
            enemies.splice(i,1);
            i--;
        }
    }
    if(frame % enemiesInterval === 0 && score < winningScore){
        let verticalPosition = Math.floor(Math.random() *5 +1) *cellSize + cellGap;
        enemies.push(new Enemy(verticalPosition));
        enemyPositions.push(verticalPosition);
        if(enemiesInterval > 120) enemiesInterval -= 50;
        console.log(enemyPositions);
    }
}

//ressources
const amounts = [20,30,40];
class Ressources{
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) +1) * cellSize + 25;
        this.width = cellSize*0.6
        this.height = cellSize*0.6;
        this.amount = amounts[Math.floor(Math.random()*amounts.length)];
    }
    draw(){
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Orbitron';
        ctx.fillText(this.amount,this.x + 15,this.y+25);
    }
}

function handleRessources(){
    if(frame % 500 === 0 && score < winningScore){
        ressources.push(new Ressources());
    }
    for(let i = 0;i<ressources.length;i++){
        ressources[i].draw();
        if(ressources[i] && mouse.x && mouse.y && collision(ressources[i],mouse)){
            numberOfRessources += ressources[i].amount;
            floatingMessages.push(new FloatingMessage('+' + ressources[i].amount,ressources[i].x,ressources[i].y,30,'black'));
            floatingMessages.push(new FloatingMessage('+' + ressources[i].amount,250,50,30,'gold'));
            ressources.splice(i,1);
            i--;
        }
    }
}

//utilities
function handleGameStatus(){
    ctx.fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    ctx.fillText('Score : ' + score, 20 , 35);
    ctx.fillText('Ressources : ' + numberOfRessources, 20 , 75);
    if(gameOver){
        ctx.fillStyle = 'black';
        ctx.font = '90px Orbitron';
        ctx.fillText('GAME OVER' , 135 , 330);
    }
    if(score >= winningScore && enemies.length === 0){
        ctx.fillStyle = 'black';
        ctx.font = '60px Orbitron';
        ctx.fillText('LEVEL COMPLETE', 130,300);
        ctx.font = '30px Orbitron';
        ctx.fillText('You win with ' + score + ' points!',134,340);
    }
}

canvas.addEventListener('click',function(e){
    const gridPositionX = mouse.x - (mouse.x%cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y%cellSize) + cellGap;
    if(gridPositionY < cellSize)return;
    for(let i = 0; i < defenders.length; i++){
        if(defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)return;
    }
    let defendersCost = 100;
    if(numberOfRessources >= defendersCost){
        defenders.push(new Defender(gridPositionX,gridPositionY));
        numberOfRessources -= defendersCost;
    } else {
        floatingMessages.push(new FloatingMessage('need more ressources',mouse.x,mouse.y,20,'blue'));

    }
})

function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(0,0,controlsBar.width,controlsBar.height);
    handleGameGrid();
    handleRessources();
    handleDefenders();
    handleProjectiles();
    handleEnemies();
    handleGameStatus();
    handleFloatingMessages();
    //console.log(enemies); 
    frame++;
    if(!gameOver)requestAnimationFrame(animate);
}

animate();

function collision(first,second){
    if(!(first.x > second.x + second.width ||
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y
        )){
            return true;
        }
}

window.addEventListener('resize',function(){
    canvasPosition = canvas.getBoundingClientRect();
})