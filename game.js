const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverText = document.getElementById('gameOver');

// เพิ่มตัวแปรสำหรับอ้างอิง score element
const scoreValueElement = document.getElementById('scoreValue');

// เพิ่มตัวแปรสำหรับอ้างอิง final score element
const finalScoreElement = document.getElementById('finalScore');

// ตั้งค่าขนาด canvas
function resizeCanvas() {
  // ตรวจสอบว่าเป็นมือถือหรือไม่
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // สำหรับมือถือ ใช้ขนาดเต็มหน้าจอ
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // ปรับขนาดตัวละครและสิ่งกีดขวางให้เหมาะสมกับหน้าจอ
    player.width = Math.min(60, canvas.width * 0.15);  // 15% ของความกว้างหน้าจอ แต่ไม่เกิน 60px
    player.height = player.width;
    player.speed = 5;  // ปรับความเร็วให้เหมาะสมกับมือถือ
    
    // ปรับ hitbox ของตัวละคร
    player.hitbox.width = player.width * 0.6;
    player.hitbox.height = player.hitbox.width;
  } else {
    // สำหรับเดสก์ท็อป ใช้ขนาดเดิม
    const containerWidth = Math.min(800, window.innerWidth - 40);
    const containerHeight = window.innerHeight - 150;
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // คืนค่าขนาดเดิมสำหรับเดสก์ท็อป
    player.width = 80;
    player.height = 80;
    player.speed = 6;
    player.hitbox.width = 50;
    player.hitbox.height = 50;
  }
  
  // ปรับตำแหน่งผู้เล่นเมื่อ canvas เปลี่ยนขนาด
  if (player) {
    player.x = Math.min(player.x, canvas.width - player.width);
    player.y = canvas.height - player.height - 20;
  }
}

// เรียกใช้เมื่อโหลดหน้าและเมื่อปรับขนาดหน้าจอ
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// เพิ่มตัวแปรคะแนน
let score = 0;
let gameRunning = true;
let speedMultiplier = 1; // เพิ่มตัวคูณความเร็ว

// สร้างรูปภาพ
const playerImg = new Image();
playerImg.src = 'images/player.png';

const playerLeftImg = new Image();
playerLeftImg.src = 'images/playerl.png';

const kokokImg = new Image();
kokokImg.src = 'images/kokok.png';

const obstacleImg = new Image();
obstacleImg.src = 'images/obstacle.png';

// เพิ่มรูปพื้นหลัง
const backgroundImg = new Image();
backgroundImg.src = 'images/wall.png';

// เพิ่มรูปพื้นหลังสำหรับ game over
const gameOverBackgroundImg = new Image();
gameOverBackgroundImg.src = 'images/surviveclimb.png';

// ตัวแปรเก็บรูปปัจจุบัน
let currentPlayerImg = playerImg;

// ตัวละคร
let player = {
  x: 0,  // จะถูกกำหนดใน resizeCanvas
  y: 0,  // จะถูกกำหนดใน resizeCanvas
  width: 80,
  height: 80,
  speed: 6,
  hitbox: {
    width: 50,
    height: 50
  }
};

// สิ่งกีดขวาง
let obstacles = [];

// สถานะปุ่ม
let left = false;
let right = false;

// ตรวจจับปุ่ม
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') left = true;
  if (e.key === 'ArrowRight') right = true;
  // เพิ่มการกด Spacebar เพื่อเริ่มเกมใหม่
  if (e.key === ' ' && !gameRunning) {
    resetGame();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') left = false;
  if (e.key === 'ArrowRight') right = false;
});

// เพิ่ม touch controls สำหรับมือถือ
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // ป้องกันการ scroll หน้าจอ
  const touch = e.touches[0];
  const touchX = touch.clientX - canvas.getBoundingClientRect().left;
  
  // แบ่งหน้าจอเป็นซ้าย-ขวา
  if (touchX < canvas.width / 2) {
    left = true;
    right = false;
  } else {
    left = false;
    right = true;
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  left = false;
  right = false;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const touchX = touch.clientX - canvas.getBoundingClientRect().left;
  
  // อัพเดททิศทางตามตำแหน่งการแตะ
  if (touchX < canvas.width / 2) {
    left = true;
    right = false;
  } else {
    left = false;
    right = true;
  }
});

function resetGame() {
  score = 0;
  obstacles = [];
  player.x = canvas.width / 2 - player.width / 2;  // จัดให้อยู่ตรงกลาง
  player.y = canvas.height - player.height - 20;   // จัดให้อยู่ด้านล่าง
  gameRunning = true;
  speedMultiplier = 1;
  gameOverText.style.display = 'none';
  scoreValueElement.textContent = '0';  // รีเซ็ตค่า score ใน HTML
  draw();
}

// สร้างสิ่งกีดขวาง
function createObstacle() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const x = Math.floor(Math.random() * (canvas.width - 50));
  
  // ปรับขนาดสิ่งกีดขวางตามประเภทอุปกรณ์
  const obstacleSize = isMobile ? Math.min(90, canvas.width * 0.2) : 120; // 20% ของความกว้างหน้าจอสำหรับมือถือ แต่ไม่เกิน 90px
  
  obstacles.push({
    x,
    y: 0,
    width: obstacleSize,
    height: obstacleSize,
    speed: 3 * speedMultiplier,
    hitbox: {
      width: obstacleSize * 0.33,  // ปรับ hitbox ให้เป็น 1/3 ของขนาด
      height: obstacleSize * 0.33
    }
  });
}

function drawPlayer() {
  // วาดขอบสีขาว
  ctx.save();
  ctx.beginPath();
  ctx.arc(
    player.x + player.width/2,
    player.y + player.height/2,
    player.width/2,
    0,
    Math.PI * 2
  );
//   ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
//   ctx.stroke();
  ctx.restore();

  // วาดรูปผู้เล่นตามทิศทางการเคลื่อนที่
  ctx.drawImage(currentPlayerImg, player.x, player.y, player.width, player.height);
}

function drawObstacles() {
  // วาดรูปสิ่งกีดขวาง
  obstacles.forEach(ob => {
    // วาดขอบสีขาว
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      ob.x + ob.width/2,
      ob.y + ob.height/2,
      ob.width/2,
      0,
      Math.PI * 2
    );
    // ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    // ctx.stroke();
    ctx.restore();

    // วาดรูปสิ่งกีดขวาง
    ctx.drawImage(obstacleImg, ob.x, ob.y, ob.width, ob.height);
  });
}

function drawScore() {
  // อัพเดทค่า score ใน HTML element
  scoreValueElement.textContent = score;
}

function moveObstacles() {
  obstacles.forEach(ob => {
    ob.y += ob.speed;
  });

  // ลบอันที่หลุดจากจอ
  obstacles = obstacles.filter(ob => ob.y < canvas.height);
}

function detectCollision() {
  for (let ob of obstacles) {
    // คำนวณตำแหน่ง center ของ hitbox
    const playerCenterX = player.x + player.width/2;
    const playerCenterY = player.y + player.height/2;
    const obstacleCenterX = ob.x + ob.width/2;
    const obstacleCenterY = ob.y + ob.height/2;

    // คำนวณระยะห่างระหว่างจุดศูนย์กลาง
    const dx = playerCenterX - obstacleCenterX;
    const dy = playerCenterY - obstacleCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // คำนวณระยะห่างที่น้อยที่สุดที่จะชนกัน
    const minDistance = (player.hitbox.width/2 + ob.hitbox.height/2);

    if (distance < minDistance) {
      return true;
    }
  }
  return false;
}

function updateSpeed() {
  // เพิ่มความเร็วทุก 1000 คะแนน แต่จำกัดที่ 10x
  const newMultiplier = Math.min(10, 1 + (Math.floor(score / 1000) * 0.5));
  if (newMultiplier !== speedMultiplier) {
    speedMultiplier = newMultiplier;
    // อัพเดทความเร็วของสิ่งกีดขวางที่มีอยู่
    obstacles.forEach(ob => {
      ob.speed = 3 * speedMultiplier;
    });
  }
}

function drawBackground() {
  // วาดพื้นหลังตามสถานะของเกม
  if (gameRunning) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  } else {
    // วาดพื้นหลัง game over
    ctx.drawImage(gameOverBackgroundImg, 0, 0, canvas.width, canvas.height);
    
    // เพิ่ม overlay สีดำเพื่อให้ข้อความอ่านง่ายขึ้น
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function draw() {
  if (!gameRunning) {
    // วาดพื้นหลัง game over แม้จะไม่มีการเล่น
    drawBackground();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // วาดพื้นหลังก่อน
  drawBackground();

  // เพิ่มคะแนน
  score++;
  
  // อัพเดทความเร็ว
  updateSpeed();

  // ขยับผู้เล่นและเปลี่ยนรูปตามทิศทาง
  if (left && player.x > 0) {
    player.x -= player.speed;
    currentPlayerImg = playerLeftImg;
  }
  if (right && player.x < canvas.width - player.width) {
    player.x += player.speed;
    currentPlayerImg = playerImg;
  }

  drawPlayer();
  drawObstacles();
  drawScore();
  moveObstacles();

  if (detectCollision()) {
    gameRunning = false;
    // คำนวณเปอร์เซ็นต์และแสดงผล
    const percentage = Math.min(Math.round((score / 1000) * 100));
    finalScoreElement.textContent = `Up to ${percentage}%`;
    gameOverText.style.display = 'block';
    // วาดพื้นหลัง game over ทันที
    drawBackground();
    return;
  }

  requestAnimationFrame(draw);
}

// รอให้รูปภาพโหลดเสร็จก่อนเริ่มเกม
Promise.all([
  new Promise(resolve => playerImg.onload = resolve),
  new Promise(resolve => playerLeftImg.onload = resolve),
  new Promise(resolve => kokokImg.onload = resolve),
  new Promise(resolve => obstacleImg.onload = resolve),
  new Promise(resolve => backgroundImg.onload = resolve),
  new Promise(resolve => gameOverBackgroundImg.onload = resolve)
]).then(() => {
  // เริ่มเกม
  setInterval(createObstacle, 1000);
  draw();
});
