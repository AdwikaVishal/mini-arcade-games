// Warrior Arena Game - Enhanced Version with Asset Loading

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game state
const GameState = {
  MENU: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  LEVEL_COMPLETE: 3,
  LOADING: 4
};

let currentState = GameState.LOADING;

// UI Elements
const healthFill = document.getElementById("healthFill");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const treasureCountElement = document.getElementById("treasureCount");
const finalScoreElement = document.getElementById("finalScore");
const gameMenu = document.getElementById("gameMenu");
const gameOverScreen = document.getElementById("gameOverScreen");
const levelCompleteScreen = document.getElementById("levelCompleteScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const loadingScreen = document.getElementById("loadingScreen");
const loadingProgress = document.getElementById("loadingProgress");
const loadingText = document.getElementById("loadingText");

// Audio elements
const bgMusic = document.getElementById("bgMusic");
const collectSound = document.getElementById("collectSound");
const hitSound = document.getElementById("hitSound");
const powerupSound = document.getElementById("powerupSound");
const winSound = document.getElementById("winSound");
const doorSound = document.getElementById("doorSound");

// Audio settings
let soundEnabled = true;

// Asset loading system
let assetsLoaded = 0;
let totalAssets = 0;
let assets = {};

// Define all assets with their paths
const assetManifest = {
  images: {
    warrior: "assets/images/warrior.png",
    enemy: "assets/images/enemy.png",
    treasure: "assets/images/treasure.svg",
    door: "assets/images/door.png",
    healthPowerup: "assets/images/health_powerup.png",
    speedPowerup: "assets/images/speed_powerup.png",
    invincibilityPowerup: "assets/images/invincibility_powerup.png",
    backgrounds: [
      "assets/images/background1.png",
      "assets/images/background2.png",
      "assets/images/background3.png",
      "assets/images/background4.png",
      "assets/images/background5.png"
    ]
  }
};

// --- Asset Loading ---
function loadAssets() {
  // Count total assets
  totalAssets = Object.keys(assetManifest.images).length;
  totalAssets += assetManifest.images.backgrounds.length;
  
  // Load images
  for (const [key, path] of Object.entries(assetManifest.images)) {
    if (key === 'backgrounds') continue; // Skip backgrounds for now
    
    const img = new Image();
    img.onload = () => assetLoaded();
    img.onerror = () => {
      console.error(`Failed to load image: ${path}`);
      // Create a placeholder for failed images
      createPlaceholderImage(img, key);
      assetLoaded();
    };
    img.src = path;
    assets[key] = img;
  }
  
  // Load backgrounds
  assets.backgrounds = [];
  assetManifest.images.backgrounds.forEach((path, index) => {
    const img = new Image();
    img.onload = () => assetLoaded();
    img.onerror = () => {
      console.error(`Failed to load background: ${path}`);
      // Create a placeholder for failed backgrounds
      createPlaceholderImage(img, `background${index+1}`);
      assetLoaded();
    };
    img.src = path;
    assets.backgrounds.push(img);
  });
}

function createPlaceholderImage(img, type) {
  // Create a canvas to generate a placeholder image
  const canvas = document.createElement('canvas');
  canvas.width = 50;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  
  // Different colors for different types
  let color = '#999';
  if (type.includes('warrior')) color = '#3498db';
  if (type.includes('enemy')) color = '#e74c3c';
  if (type.includes('treasure')) color = '#f1c40f';
  if (type.includes('door')) color = '#2ecc71';
  if (type.includes('powerup')) color = '#9b59b6';
  if (type.includes('background')) {
    canvas.width = 800;
    canvas.height = 600;
    color = '#34495e';
  }
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(type, canvas.width/2, canvas.height/2);
  
  img.src = canvas.toDataURL();
}

function assetLoaded() {
  assetsLoaded++;
  const progress = Math.floor((assetsLoaded / totalAssets) * 100);
  loadingProgress.value = progress;
  loadingText.textContent = `Loading... ${progress}%`;
  
  if (assetsLoaded >= totalAssets) {
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
      currentState = GameState.MENU;
    }, 500);
  }
}

// --- Game Variables ---
let warrior = {
  x: 50,
  y: 400,
  w: 50,
  h: 60,
  speed: 5,
  dx: 0,
  dy: 0,
  health: 100,
  maxHealth: 100,
  score: 0,
  treasures: 0,
  invincible: false,
  invincibilityTimer: 0
};

let enemies = [];
let treasures = [];
let powerups = [];
let particles = [];

let door = { x: 750, y: 380, w: 50, h: 100 };

let currentLevel = 0;
let levelCompleteTimer = 0;
let gameTime = 0;

// Level configurations
const levelConfigs = [
  { // Level 1
    enemyCount: 2,
    treasureCount: 3,
    powerupCount: 1,
    enemySpeed: 1.5
  },
  { // Level 2
    enemyCount: 3,
    treasureCount: 4,
    powerupCount: 2,
    enemySpeed: 1.5,
  },
  { // Level 3
    enemyCount: 4,
    treasureCount: 5,
    powerupCount: 2,
    enemySpeed: 2
  },
  { // Level 4
    enemyCount: 5,
    treasureCount: 6,
    powerupCount: 3,
    enemySpeed: 2.1
  },
  { // Level 5
    enemyCount: 6,
    treasureCount: 7,
    powerupCount: 3,
    enemySpeed: 2.2,
  }
];

// --- Initialize Game ---
function initGame() {
  currentLevel = 0;
  warrior = {
    x: 50,
    y: 400,
    w: 50,
    h: 60,
    speed: 5,
    dx: 0,
    dy: 0,
    health: 100,
    maxHealth: 100,
    score: 0,
    treasures: 0,
    invincible: false,
    invincibilityTimer: 0
  };
  
  loadLevel(currentLevel);
  updateUI();
  
  if (soundEnabled) {
    bgMusic.volume = 0.3;
    bgMusic.play().catch(e => console.log("Audio play failed:", e));
  }
}

// --- Load Level ---
function loadLevel(level) {
  const config = levelConfigs[level];
  
  // Create enemies
  enemies = [];
  for (let i = 0; i < config.enemyCount; i++) {
    const x = 100 + Math.random() * (WIDTH - 200);
    const y = 100 + Math.random() * (HEIGHT - 200);
    const dir = Math.random() > 0.5 ? 1 : -1;
    
    enemies.push({
      x: x,
      y: y,
      w: 50,
      h: 60,
      dir: dir,
      speed: config.enemySpeed,
      type: Math.floor(Math.random() * 3) // 0: normal, 1: fast, 2: big
    });
  }
  
  // Create treasures
  treasures = [];
  for (let i = 0; i < config.treasureCount; i++) {
    const x = 150 + Math.random() * (WIDTH - 300);
    const y = 150 + Math.random() * (HEIGHT - 300);
    
    treasures.push({
      x: x,
      y: y,
      w: 30,
      h: 30,
      collected: false,
      floating: true
    });
  }
  
  // Create powerups
  powerups = [];
  for (let i = 0; i < config.powerupCount; i++) {
    const x = 100 + Math.random() * (WIDTH - 200);
    const y = 100 + Math.random() * (HEIGHT - 200);
    const type = Math.floor(Math.random() * 3); // 0: health, 1: speed, 2: invincibility
    
    powerups.push({
      x: x,
      y: y,
      w: 30,
      h: 30,
      type: type,
      active: true
    });
  }
  
  // Reset door position
  door.x = 750;
  door.y = 380;
  
  // Update UI
  levelElement.textContent = `Level: ${currentLevel + 1}`;
  treasureCountElement.textContent = `Treasures: ${warrior.treasures}/${config.treasureCount}`;
}

// --- Update UI ---
function updateUI() {
  healthFill.style.width = `${(warrior.health / warrior.maxHealth) * 100}%`;
  scoreElement.textContent = `Score: ${warrior.score}`;
  levelElement.textContent = `Level: ${currentLevel + 1}`;
  treasureCountElement.textContent = `Treasures: ${warrior.treasures}/${levelConfigs[currentLevel].treasureCount}`;
}

// --- Controls ---
document.addEventListener("keydown", (e) => {
  if (currentState !== GameState.PLAYING) return;
  
  if (e.key === "ArrowRight") warrior.dx = warrior.speed;
  if (e.key === "ArrowLeft") warrior.dx = -warrior.speed;
  if (e.key === "ArrowUp") warrior.dy = -warrior.speed;
  if (e.key === "ArrowDown") warrior.dy = warrior.speed;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") warrior.dx = 0;
  if (e.key === "ArrowUp" || e.key === "ArrowDown") warrior.dy = 0;
});

// --- Collision Check ---
function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// --- Create Particles ---
function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const size = 2 + Math.random() * 4;
    const life = 20 + Math.random() * 30;
    
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: size,
      color: color,
      life: life,
      maxLife: life
    });
  }
}

// --- Update Particles ---
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// --- Draw Particles ---
function drawParticles() {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// --- Update Game ---
function update() {
  if (currentState !== GameState.PLAYING) return;
  
  gameTime++;
  
  // Move warrior
  warrior.x += warrior.dx;
  warrior.y += warrior.dy;
  
  // Boundaries
  if (warrior.x < 0) warrior.x = 0;
  if (warrior.y < 0) warrior.y = 0;
  if (warrior.x + warrior.w > WIDTH) warrior.x = WIDTH - warrior.w;
  if (warrior.y + warrior.h > HEIGHT) warrior.y = HEIGHT - warrior.h;
  
  // Update invincibility timer
  if (warrior.invincible) {
    warrior.invincibilityTimer--;
    if (warrior.invincibilityTimer <= 0) {
      warrior.invincible = false;
    }
  }
  
  // Move enemies
  enemies.forEach(enemy => {
    // Simple AI: Move toward player if nearby
    const dx = warrior.x - enemy.x;
    const dy = warrior.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 200) {
      // Chase player
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    } else {
      // Patrol
      enemy.x += enemy.dir * enemy.speed;
      if (enemy.x < 100 || enemy.x > WIDTH - 100) {
        enemy.dir *= -1;
      }
    }
    
    // Enemy collision with player
    if (isColliding(warrior, enemy) && !warrior.invincible) {
      warrior.health -= 10;
      updateUI();
      
      if (soundEnabled) hitSound.play();
      
      // Create hit particles
      createParticles(
        warrior.x + warrior.w/2, 
        warrior.y + warrior.h/2, 
        "#ff0000", 
        10
      );
      
      // Knockback
      warrior.x -= dx/dist * 20;
      warrior.y -= dy/dist * 20;
      
      if (warrior.health <= 0) {
        gameOver();
      }
    }
  });
  
  // Treasure collection
  treasures.forEach(treasure => {
    if (!treasure.collected && isColliding(warrior, treasure)) {
      treasure.collected = true;
      warrior.treasures++;
      warrior.score += 100;
      updateUI();
      
      if (soundEnabled) collectSound.play();
      
      // Create collection particles
      createParticles(
        treasure.x + treasure.w/2, 
        treasure.y + treasure.h/2, 
        "#ffcc00", 
        15
      );
    }
  });
  
  // Powerup collection
  powerups.forEach(powerup => {
    if (powerup.active && isColliding(warrior, powerup)) {
      powerup.active = false;
      
      if (soundEnabled) powerupSound.play();
      
      // Apply powerup effect
      switch (powerup.type) {
        case 0: // Health
          warrior.health = Math.min(warrior.health + 30, warrior.maxHealth);
          createParticles(
            powerup.x + powerup.w/2, 
            powerup.y + powerup.h/2, 
            "#00ff00", 
            15
          );
          break;
        case 1: // Speed
          warrior.speed += 2;
          setTimeout(() => { warrior.speed -= 2; }, 10000);
          createParticles(
            powerup.x + powerup.w/2, 
            powerup.y + powerup.h/2, 
            "#00aaff", 
            15
          );
          break;
        case 2: // Invincibility
          warrior.invincible = true;
          warrior.invincibilityTimer = 300; // 5 seconds at 60fps
          createParticles(
            powerup.x + powerup.w/2, 
            powerup.y + powerup.h/2, 
            "#ffff00", 
            15
          );
          break;
      }
      
      updateUI();
    }
  });
  
  // Door check
  if (warrior.treasures >= levelConfigs[currentLevel].treasureCount && 
      isColliding(warrior, door)) {
    if (soundEnabled) doorSound.play();
    levelComplete();
  }
  
  // Update particles
  updateParticles();
}

// --- Draw Game ---
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  
  // Draw background
  if (assets.backgrounds && assets.backgrounds[currentLevel]) {
    ctx.drawImage(assets.backgrounds[currentLevel], 0, 0, WIDTH, HEIGHT);
  }
  
  // Draw door
  if (assets.door) {
    ctx.drawImage(assets.door, door.x, door.y, door.w, door.h);
  }
  
  // Draw treasures
  treasures.forEach(treasure => {
    if (!treasure.collected && assets.treasure) {
      // Add floating animation
      const floatOffset = treasure.floating ? Math.sin(gameTime / 10) * 5 : 0;
      ctx.drawImage(assets.treasure, treasure.x, treasure.y + floatOffset, treasure.w, treasure.h);
    }
  });
  
  // Draw powerups
  powerups.forEach(powerup => {
    if (powerup.active) {
      let img;
      switch (powerup.type) {
        case 0: img = assets.healthPowerup; break;
        case 1: img = assets.speedPowerup; break;
        case 2: img = assets.invincibilityPowerup; break;
      }
      
      if (img) {
        const floatOffset = Math.sin(gameTime / 8) * 5;
        ctx.drawImage(img, powerup.x, powerup.y + floatOffset, powerup.w, powerup.h);
      }
    }
  });
  
  // Draw enemies
  enemies.forEach(enemy => {
    if (assets.enemy) {
      // Different enemy types have different colors
      ctx.save();
      switch (enemy.type) {
        case 0: ctx.filter = "hue-rotate(0deg)"; break; // Normal (red)
        case 1: ctx.filter = "hue-rotate(200deg)"; break; // Fast (blue)
        case 2: ctx.filter = "hue-rotate(60deg)"; break; // Big (yellow)
      }
      ctx.drawImage(assets.enemy, enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.restore();
    }
  });
  
  // Draw warrior
  if (assets.warrior) {
    // Flash when invincible
    if (warrior.invincible && Math.floor(gameTime / 5) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    ctx.drawImage(assets.warrior, warrior.x, warrior.y, warrior.w, warrior.h);
    ctx.globalAlpha = 1;
  }
  
  // Draw particles
  drawParticles();
  
  // Draw UI elements
  //ctx.font = "16px Arial";
  //ctx.fillStyle = "white";
  //ctx.textAlign = "left";
  //ctx.fillText(`Score: ${warrior.score}`, 10, 25);
  //ctx.fillText(`Level: ${currentLevel + 1}`, 10, 45);
  //ctx.fillText(`Health: ${warrior.health}%`, 10, 65);
  //ctx.fillText(`Treasures: ${warrior.treasures}/${levelConfigs[currentLevel].treasureCount}`, 10, 85);
  
  // Draw game state screens
  if (currentState === GameState.GAME_OVER) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER!", WIDTH/2, HEIGHT/2 - 50);
    
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText(`Final Score: ${warrior.score}`, WIDTH/2, HEIGHT/2);
  }
  
  if (currentState === GameState.LEVEL_COMPLETE) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.fillStyle = "gold";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("LEVEL COMPLETE!", WIDTH/2, HEIGHT/2 - 50);
    
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText(`Preparing level ${currentLevel + 2}...`, WIDTH/2, HEIGHT/2);
  }
}

// --- Game Over ---
function gameOver() {
  currentState = GameState.GAME_OVER;
  finalScoreElement.textContent = warrior.score;
  gameOverScreen.classList.remove("hidden");
  
  if (soundEnabled) {
    bgMusic.pause();
    hitSound.play();
  }
}

// --- Level Complete ---
function levelComplete() {
  currentState = GameState.LEVEL_COMPLETE;
  levelCompleteTimer = 120; // 2 seconds at 60fps
  
  if (soundEnabled) winSound.play();
  
  // Bonus points for remaining health
  const healthBonus = Math.floor(warrior.health / 10) * 50;
  warrior.score += healthBonus;
  
  // Show level complete screen
  levelCompleteScreen.classList.remove("hidden");
  setTimeout(() => {
    levelCompleteScreen.classList.add("hidden");
    nextLevel();
  }, 2000);
}

// --- Next Level ---
function nextLevel() {
  currentLevel++;
  
  if (currentLevel >= levelConfigs.length) {
    // Game completed
    currentState = GameState.GAME_OVER;
    finalScoreElement.textContent = warrior.score;
    gameOverScreen.classList.remove("hidden");
    document.querySelector("#gameOverScreen h2").textContent = "YOU WIN!";
    document.querySelector("#gameOverScreen p").textContent = "Congratulations! You completed all levels!";
    return;
  }
  
  // Reset player position but keep score and health
  warrior.x = 50;
  warrior.y = 400;
  warrior.treasures = 0;
  
  // Load next level
  loadLevel(currentLevel);
  currentState = GameState.PLAYING;
}

// --- Game Loop ---
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// --- Event Listeners for UI ---
startButton.addEventListener("click", () => {
  gameMenu.classList.add("hidden");
  currentState = GameState.PLAYING;
  initGame();
});

restartButton.addEventListener("click", () => {
  gameOverScreen.classList.add("hidden");
  gameMenu.classList.remove("hidden");
});

// --- Start Game ---
// First load all assets, then start the game
loadAssets();
gameLoop();
