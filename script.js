// Responsive, restartable Flappy Bird logic with looping background music

let moveSpeed = 1.0;            // pipe speed
let gravity = 0.19;             // lighter gravity (easier)
let flapPower = -5.5;           // upward impulse when flapping

const birdEl = document.querySelector('.bird');
const img = document.getElementById('bird-1');
const bgEl = document.querySelector('.background');
const scoreValEl = document.querySelector('.score_val');
const scoreTitleEl = document.querySelector('.score_title');
const messageEl = document.querySelector('.message');

// 🎵 background music (MOV format)
const bgMusic = new Audio('sounds effect/bg-music.mov');
bgMusic.loop = true;
bgMusic.volume = 0.5;

// 💀 death sound (MP3 format)
const soundDie = new Audio('sounds effect/die2.mp3');

let gameState = 'Start';       // 'Start' | 'Play' | 'End'
let birdY = 0;
let birdDy = 0;
let score = 0;

let rafMovePipes = null;
let rafGravity = null;
let rafCreatePipes = null;

img.style.display = 'none';
messageEl.innerHTML = '<p>Press <span style="color: gold;">Space</span> or Tap to Start</p>';

// 🎮 Input handling
function handleInput() {
  if (gameState === 'Start' || gameState === 'End') {
    startGame();
  } else if (gameState === 'Play') {
    flap();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    handleInput();
  }
});

document.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleInput();
}, { passive: false });

// 🕊️ Flap
function flap() {
  birdDy = flapPower;
  img.src = 'images/Bird.png';
  clearTimeout(flap._t);
  flap._t = setTimeout(() => img.src = 'images/Bird.png', 140);
}

// ▶️ Start / Restart
function startGame() {
  document.querySelectorAll('.pipe_sprite').forEach(p => p.remove());

  gameState = 'Play';
  score = 0;
  scoreTitleEl.innerHTML = 'Score: ';
  scoreValEl.innerHTML = '0';
  img.style.display = 'block';
  messageEl.innerHTML = '';

  const vh = window.innerHeight;
  birdY = Math.round(vh * 0.45);
  birdDy = 0;
  birdEl.style.top = birdY + 'px';
  birdEl.style.left = Math.max(20, Math.round(window.innerWidth * 0.25)) + 'px';
  birdEl.style.transform = 'rotate(0deg)';

  // 🎶 Start background music
  try {
    bgMusic.currentTime = 0;
    bgMusic.play();
  } catch (e) {
    console.warn('Autoplay blocked until user interaction');
  }

  cancelLoops();
  requestAnimationFrame(movePipes);
  requestAnimationFrame(applyGravity);
  requestAnimationFrame(createPipes);
}

// 🛑 Cancel previous loops
function cancelLoops() {
  if (rafMovePipes) cancelAnimationFrame(rafMovePipes);
  if (rafGravity) cancelAnimationFrame(rafGravity);
  if (rafCreatePipes) cancelAnimationFrame(rafCreatePipes);
  rafMovePipes = rafGravity = rafCreatePipes = null;
}

// 🚧 Pipe movement
function movePipes() {
  if (gameState !== 'Play') return;

  document.querySelectorAll('.pipe_sprite').forEach(pipe => {
    const rect = pipe.getBoundingClientRect();
    const newLeft = rect.left - moveSpeed;
    pipe.style.left = newLeft + 'px';

    if (rect.right <= 0) {
      pipe.remove();
      return;
    }

    const birdRect = birdEl.getBoundingClientRect();
    if (isCollision(birdRect, rect)) {
      gameOver();
      return;
    }

    if (pipe.increaseScore === '1') {
      if (rect.right < birdRect.left) {
        score++;
        scoreValEl.innerHTML = score;
        pipe.increaseScore = '0';
      }
    }
  });

  rafMovePipes = requestAnimationFrame(movePipes);
}

// 🪂 Gravity
function applyGravity() {
  if (gameState !== 'Play') return;

  const vh = window.innerHeight;
  birdDy += gravity;
  birdY += birdDy;

  if (birdY <= 0) {
    birdY = 0;
    birdDy = 0;
  }

  if (birdY + birdEl.offsetHeight >= vh) {
    birdY = vh - birdEl.offsetHeight;
    birdEl.style.top = birdY + 'px';
    gameOver();
    return;
  }

  birdEl.style.top = birdY + 'px';
  const deg = Math.min(Math.max(birdDy * 3, -30), 60);
  birdEl.style.transform = `rotate(${deg}deg)`;

  rafGravity = requestAnimationFrame(applyGravity);
}

// 🧱 Pipe creation
let pipeTimer = 0;
function createPipes() {
  if (gameState !== 'Play') return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  pipeTimer++;
  if (pipeTimer > 120) {
    pipeTimer = 0;

    const pipeWidth = Math.round(Math.max(60, vw * 0.12));
    const pipeHeight = Math.round(vh * 0.9);
    const pipeGap = Math.round(vh * 0.35); // bigger gap between pipes

    const gapTopMin = Math.round(vh * 0.12);
    const gapTopMax = Math.round(vh * 0.60 - pipeGap);
    const gapTop = Math.floor(Math.random() * (Math.max(1, gapTopMax - gapTopMin) + 1)) + gapTopMin;

    const topPipe = document.createElement('div');
    topPipe.className = 'pipe_sprite';
    topPipe.style.height = pipeHeight + 'px';
    topPipe.style.width = pipeWidth + 'px';
    topPipe.style.left = vw + 'px';
    topPipe.style.top = (gapTop - pipeHeight) + 'px';

    const bottomPipe = document.createElement('div');
    bottomPipe.className = 'pipe_sprite';
    bottomPipe.style.height = pipeHeight + 'px';
    bottomPipe.style.width = pipeWidth + 'px';
    bottomPipe.style.left = vw + 'px';
    bottomPipe.style.top = (gapTop + pipeGap) + 'px';
    bottomPipe.increaseScore = '1';

    document.body.appendChild(topPipe);
    document.body.appendChild(bottomPipe);
  }

  rafCreatePipes = requestAnimationFrame(createPipes);
}

// ⚠️ Collision check
function isCollision(rectA, rectB) {
  return (
    rectA.left < rectB.left + rectB.width &&
    rectA.left + rectA.width > rectB.left &&
    rectA.top < rectB.top + rectB.height &&
    rectA.top + rectA.height > rectB.top
  );
}

// 💥 Game Over (meme edition)
function gameOver() {
  if (gameState === 'End') return;
  gameState = 'End';

  // 🖼️ Replace message box with a meme image
  messageEl.innerHTML = `
    <img src="images/meme.jpg" 
         alt="Game Over Meme" 
         style="max-width:90vw;
                max-height:70vh;
                border-radius:12px;
                box-shadow:0 4px 10px rgba(0,0,0,0.5);">
  `;

  img.style.display = 'none';
  try { soundDie.play(); } catch (e) {}
  try { bgMusic.pause(); } catch (e) {}

  cancelLoops();
}

// 🪄 Responsive resize
window.addEventListener('resize', () => {
  const vh = window.innerHeight;
  if (birdY + birdEl.offsetHeight > vh) {
    birdY = Math.max(0, vh - birdEl.offsetHeight);
    birdEl.style.top = birdY + 'px';
  }
});
