// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load Player Image
const playerImage = new Image();
playerImage.src = '1252413641714831431.png';
let imageLoaded = false;

playerImage.onload = function() {
    imageLoaded = true;
    // Redraw initial screen when image loads
    drawInitialScreen();
};

// Game State
let gameState = 'menu'; // menu, playing, paused, gameover
let score = 0;
let lives = 3;
let level = 1;
let gameSpeed = 2;
let animationId;

// Player (the cute blob character)
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 70,
    height: 70,
    speed: 8,
    moveLeft: false,
    moveRight: false
};

// Game Objects
let fallingItems = [];
let particles = [];
let stars = [];
let floatingTexts = [];

// Item Types (Space Theme)
const itemTypes = {
    star: { points: 10, color: '#FFD700', emoji: '🌟' },      // Ngôi sao lấp lánh
    planet: { points: 25, color: '#4169E1', emoji: '🪐' },    // Hành tinh Saturn
    ufo: { points: 50, color: '#00FF00', emoji: '🛸' },       // UFO (hiếm, nhiều điểm)
    meteor: { points: -1, color: '#FF4500', emoji: '☄️' }     // Thiên thạch (tránh)
};

// Initialize Stars Background
function initStars() {
    stars = [];
    for (let i = 0; i < 80; i++) {  // Giảm từ 150 xuống 80
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            opacity: Math.random(),
            twinkleSpeed: 0.01 + Math.random() * 0.02,
            twinkleDirection: Math.random() > 0.5 ? 1 : -1
        });
    }
}

// Draw Lives (Hearts) on screen with better visibility
function drawLives() {
    ctx.font = 'bold 35px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw hearts for remaining lives
    for (let i = 0; i < lives; i++) {
        // White glow background
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        
        // White outline
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeText('❤️', 20 + i * 45, 15);
        
        // Draw heart
        ctx.fillText('❤️', 20 + i * 45, 15);
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw empty hearts for lost lives
    for (let i = lives; i < 3; i++) {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText('🖤', 20 + i * 45, 15);
        ctx.fillText('🖤', 20 + i * 45, 15);
    }
}

// Draw the Player Character (Using the actual image)
function drawPlayer() {
    if (!imageLoaded) {
        // Show loading text if image not ready
        ctx.fillStyle = '#667eea';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', player.x + player.width / 2, player.y + player.height / 2);
        return;
    }
    
    const centerX = player.x + player.width / 2;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(centerX, player.y + player.height + 5, player.width / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the actual character image
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

// Draw Space Background with Stars (optimized)
function drawSpaceBackground() {
    // Dark space gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(0.5, '#1a1f3a');
    gradient.addColorStop(1, '#0f0c29');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars (batch rendering for better performance)
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);  // Dùng fillRect thay vì arc
        
        // Twinkle effect
        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity <= 0.1 || star.opacity >= 1) {
            star.twinkleDirection *= -1;
        }
    });
    
    // Simplified distant galaxies
    ctx.fillStyle = 'rgba(138, 43, 226, 0.08)';
    ctx.fillRect(canvas.width * 0.2 - 30, canvas.height * 0.3 - 30, 60, 60);
    
    ctx.fillStyle = 'rgba(100, 149, 237, 0.08)';
    ctx.fillRect(canvas.width * 0.8 - 40, canvas.height * 0.2 - 40, 80, 80);
}

// Create Falling Item
function createFallingItem() {
    // Balanced with more meteors for challenge
    const types = ['star', 'star', 'planet', 'planet', 'ufo', 'meteor', 'meteor', 'meteor'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Meteor falls diagonally
    if (randomType === 'meteor') {
        const direction = Math.random() > 0.5 ? 1 : -1; // Random left or right
        fallingItems.push({
            x: direction > 0 ? -50 : canvas.width + 50, // Start from side
            y: Math.random() * canvas.height * 0.3, // Start from top area
            width: 45,
            height: 45,
            type: randomType,
            speed: gameSpeed + Math.random() * 2,
            vx: direction * (3 + Math.random() * 2), // Horizontal speed
            vy: 4 + Math.random() * 2, // Vertical speed
            rotation: direction > 0 ? -0.5 : 0.5, // Fixed angle
            rotationSpeed: 0
        });
    } else {
        // Normal items
        fallingItems.push({
            x: Math.random() * (canvas.width - 50),
            y: -50,
            width: 45,
            height: 45,
            type: randomType,
            speed: gameSpeed + Math.random() * 2,
            vx: 0,
            vy: 0,
            rotation: 0,
            rotationSpeed: 0.05 + Math.random() * 0.1
        });
    }
}

// Draw Falling Items (optimized)
function drawFallingItems() {
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    fallingItems.forEach((item, index) => {
        const itemInfo = itemTypes[item.type];
        
        // Simplified meteor trail
        if (item.type === 'meteor') {
            ctx.fillStyle = 'rgba(255, 140, 0, 0.3)';
            ctx.fillRect(
                item.x + item.width / 2 - item.vx * 5, 
                item.y + item.height / 2 - item.vy * 3, 
                10, 10
            );
        }
        
        ctx.save();
        ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
        ctx.rotate(item.rotation);
        
        // Single white outline only
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeText(itemInfo.emoji, 0, 0);
        
        // Draw emoji
        ctx.fillText(itemInfo.emoji, 0, 0);
        
        ctx.restore();
        
        // Update position
        if (item.type === 'meteor') {
            item.x += item.vx;
            item.y += item.vy;
        } else {
            item.y += item.speed;
            item.rotation += item.rotationSpeed;
        }
        
        // Remove if off screen
        if (item.y > canvas.height || item.x < -100 || item.x > canvas.width + 100) {
            fallingItems.splice(index, 1);
        }
        
        // Check collision with player
        if (checkCollision(player, item)) {
            handleCollision(item);
            fallingItems.splice(index, 1);
        }
    });
}

// Check Collision
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Handle Collision
function handleCollision(item) {
    const itemInfo = itemTypes[item.type];
    
    if (item.type === 'meteor') {
        lives--;
        updateLives();
        createParticles(item.x, item.y, '#FF4500', 8);  // Giảm particles
        createFloatingText(item.x + item.width / 2, item.y, '-1 ❤️', '#FF0000');
        
        if (lives <= 0) {
            endGame();
        }
    } else {
        score += itemInfo.points;
        updateScore();
        
        // Create floating text showing points gained
        createFloatingText(
            item.x + item.width / 2, 
            item.y, 
            '+' + itemInfo.points, 
            itemInfo.color
        );
        
        // Reduced particles for better performance
        createParticles(item.x, item.y, itemInfo.color, 3);
        
        // Level up every 200 points
        const newLevel = Math.floor(score / 200) + 1;
        if (newLevel > level) {
            level = newLevel;
            gameSpeed += 0.5;
            updateLevel();
            createFloatingText(canvas.width / 2, canvas.height / 2, 'LEVEL UP!', '#FFD700');
        }
    }
}

// Create Floating Text
function createFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        opacity: 1,
        vy: -2, // Move upward
        life: 1
    });
}

// Create Particles
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1,
            color: color,
            size: Math.random() * 5 + 2
        });
    }
}

// Draw Floating Texts (optimized)
function drawFloatingTexts() {
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    floatingTexts.forEach((text, index) => {
        ctx.globalAlpha = text.opacity;
        
        // Simplified outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(text.text, text.x, text.y);
        
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, text.x, text.y);
        
        // Animate text moving up and fading
        text.y += text.vy;
        text.opacity -= 0.015;
        text.life -= 0.015;
        
        if (text.life <= 0) {
            floatingTexts.splice(index, 1);
        }
    });
    
    ctx.globalAlpha = 1;
}

// Draw Particles
function drawParticles() {
    particles.forEach((particle, index) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Update Player Position
function updatePlayer() {
    if (player.moveLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (player.moveRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// Update UI
function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function updateLevel() {
    document.getElementById('level').textContent = level;
}

// Game Loop
let lastItemTime = 0;
const itemInterval = 1000; // Create item every 1 second

function gameLoop(timestamp) {
    if (gameState !== 'playing') return;
    
    // Draw space background with stars
    drawSpaceBackground();
    
    // Create falling items
    if (timestamp - lastItemTime > itemInterval) {
        createFallingItem();
        lastItemTime = timestamp;
    }
    
    // Update and draw
    updatePlayer();
    drawFallingItems();
    drawParticles();
    drawFloatingTexts();
    drawPlayer();
    drawLives();  // Draw lives on top
    
    animationId = requestAnimationFrame(gameLoop);
}

// Start Game
function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    gameSpeed = 2;
    fallingItems = [];
    particles = [];
    floatingTexts = [];
    
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    
    updateScore();
    updateLives();
    updateLevel();
    
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-block';
    document.getElementById('gameOver').classList.add('hidden');
    
    lastItemTime = 0;
    animationId = requestAnimationFrame(gameLoop);
}

// End Game
function endGame() {
    gameState = 'gameover';
    cancelAnimationFrame(animationId);
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('startBtn').style.display = 'inline-block';
}

// Pause/Resume Game
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseBtn').textContent = 'Resume';
        cancelAnimationFrame(animationId);
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseBtn').textContent = 'Pause';
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Event Listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        player.moveLeft = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        player.moveRight = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        player.moveLeft = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        player.moveRight = false;
    }
});

// Initialize
initStars();

// Draw initial state with space theme
function drawInitialScreen() {
    drawSpaceBackground();
    drawPlayer();
    drawLives();  // Show lives even in menu
    
    // Welcome message
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(138, 43, 226, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillText('Space Blob Adventure!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText('Press START to begin!', canvas.width / 2, canvas.height / 2 + 10);
    ctx.shadowBlur = 0;
}

drawInitialScreen();

