const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let lives = 5;
let escapedInsects = 0; // Counter for escaped normal insects (not enemies)
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");

const spider = { x: canvas.width / 2, y: canvas.height / 2, size: 50 }; // Spider size
const insects = [];
let celebrationTimer = 0; // Timer for celebration effect
let deCelebrationTimer = 0; // Timer for de-celebration effect

// Load sounds
const smallWinSound = new Audio("small-win.mp3");
const bigWinSound = new Audio("big-win.mp3");
const lossSound = new Audio("loss.mp3");

// Particle class for burst effect
class Particle {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = Math.random() * 3 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.life = 30; // Particle life in frames
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const particles = [];

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function drawSpider(spider, isCelebrating, isDeCelebrating) {
    ctx.beginPath();
    for (let i = 0; i < 333; i++) {
        let angle = (i / 333) * Math.PI * 2;
        let radius = randomRange(5, spider.size); // Use spider size for radius
        let x = spider.x + Math.cos(angle) * radius;
        let y = spider.y + Math.sin(angle) * radius;
        ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (isCelebrating) {
        // Create a rainbow gradient for celebration
        const gradient = ctx.createRadialGradient(
            spider.x, spider.y, 5,
            spider.x, spider.y, spider.size
        );
        gradient.addColorStop(0, "red");
        gradient.addColorStop(0.2, "orange");
        gradient.addColorStop(0.4, "yellow");
        gradient.addColorStop(0.6, "green");
        gradient.addColorStop(0.8, "blue");
        gradient.addColorStop(1, "purple");
        ctx.strokeStyle = gradient;
    } else if (isDeCelebrating) {
        // Gray color for de-celebration
        ctx.strokeStyle = "gray";
    } else {
        ctx.strokeStyle = "white"; // Default color
    }
    ctx.stroke();
}

function drawEnemy(enemy) {
    ctx.beginPath();
    for (let i = 0; i < 333; i++) {
        let angle = (i / 333) * Math.PI * 2;
        let radius = randomRange(5, enemy.size); // Use enemy size for radius
        let x = enemy.x + Math.cos(angle) * radius;
        let y = enemy.y + Math.sin(angle) * radius;
        ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "red"; // Red color for enemy
    ctx.stroke();
}

function drawInsect(insect) {
    if (insect.isEnemy) {
        drawEnemy(insect); // Draw enemy as a custom red shape
    } else if (insect.isLifeInsect) {
        // Draw life insect with a green stroke
        ctx.font = `bold ${insect.size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.strokeText(insect.emoji, insect.x, insect.y);
        ctx.fillStyle = "white";
        ctx.fillText(insect.emoji, insect.x, insect.y);
    } else {
        // Draw normal insect with bold text and stroke
        ctx.font = `bold ${insect.size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeText(insect.emoji, insect.x, insect.y);
        ctx.fillStyle = "white";
        ctx.fillText(insect.emoji, insect.x, insect.y);
    }
}

function animate() {
    if (lives <= 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "48px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if the score is a multiple of 10 for celebration
    const isCelebrating = score > 0 && score % 10 === 0;
    if (isCelebrating && celebrationTimer === 0) {
        celebrationTimer = 30; // Set celebration timer (30 frames)
        bigWinSound.play(); // Play big win sound
    }

    // Check if de-celebration is active
    const isDeCelebrating = deCelebrationTimer > 0;

    // Draw spider with appropriate effect
    drawSpider(spider, celebrationTimer > 0, deCelebrationTimer > 0);

    // Move and draw insects
    for (let i = insects.length - 1; i >= 0; i--) {
        let insect = insects[i];
        insect.y += insect.speed;
        drawInsect(insect);

        // Check collision with spider
        let dx = insect.x - spider.x;
        let dy = insect.y - spider.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < spider.size / 2 + insect.size / 2) {
            if (insect.isEnemy) {
                // If it's an enemy insect, decrease lives and trigger de-celebration
                lives--;
                livesDisplay.textContent = `Lives: ${lives}`;
                deCelebrationTimer = 30; // Set de-celebration timer (30 frames)
                lossSound.play(); // Play loss sound
            } else if (insect.isLifeInsect) {
                // If it's a life insect, increase lives
                lives++;
                livesDisplay.textContent = `Lives: ${lives}`;
                smallWinSound.play(); // Play small win sound
            } else {
                // If it's a normal insect, increase score and play small win sound
                score++;
                scoreDisplay.textContent = `Score: ${score}`;
                smallWinSound.play(); // Play small win sound
            }

            // Create burst effect
            for (let j = 0; j < 20; j++) {
                particles.push(new Particle(insect.x, insect.y, 2, insect.isEnemy ? "red" : insect.isLifeInsect ? "green" : "yellow"));
            }

            insects.splice(i, 1); // Remove the insect
        }

        // Remove insect if it falls off screen
        if (insect.y > canvas.height) {
            // Only increment escapedInsects if it's a normal insect (not an enemy or life insect)
            if (!insect.isEnemy && !insect.isLifeInsect) {
                escapedInsects++; // Increment escaped insects counter
                if (escapedInsects >= 3) {
                    lives--; // Decrease lives by one
                    livesDisplay.textContent = `Lives: ${lives}`;
                    escapedInsects = 0; // Reset the counter
                    lossSound.play(); // Play loss sound
                }
            }
            insects.splice(i, 1); // Remove the insect
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Spawn life insect if lives are down to 1
    if (lives === 1 && !insects.some(insect => insect.isLifeInsect)) {
        spawnLifeInsect();
    }

    // Update timers
    if (celebrationTimer > 0) celebrationTimer--;
    if (deCelebrationTimer > 0) deCelebrationTimer--;

    requestAnimationFrame(animate);
}

function spawnInsect() {
    const insectEmojis = ["🦋", "🐝", "🐞", "🦗", "🐛", "🦂", "🦗", "🦟"];
    const isEnemy = Math.random() < 0.2; // 20% chance to spawn an enemy
    const emoji = isEnemy ? "" : insectEmojis[Math.floor(Math.random() * insectEmojis.length)]; // No emoji for enemy
    insects.push({
        x: randomRange(0, canvas.width),
        y: 0,
        size: 30,
        speed: randomRange(2, 5),
        emoji: emoji,
        isEnemy: isEnemy, // Mark if it's an enemy
        isLifeInsect: false // Mark if it's a life insect
    });
}

function spawnLifeInsect() {
    insects.push({
        x: randomRange(0, canvas.width),
        y: 0,
        size: 40,
        speed: randomRange(2, 4),
        emoji: "❤️", // Life insect emoji
        isEnemy: false,
        isLifeInsect: true // Mark as life insect
    });
}

// Mouse movement for desktop
window.addEventListener("mousemove", event => {
    spider.x = event.clientX;
    spider.y = event.clientY;
});

// Touch movement for mobile
window.addEventListener("touchmove", event => {
    event.preventDefault(); // Prevent default touch behavior (e.g., scrolling)
    const touch = event.touches[0]; // Get the first touch point
    spider.x = touch.clientX;
    spider.y = touch.clientY;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

setInterval(spawnInsect, 1000);
animate();
