const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const spdEl = document.getElementById('spd');
const dstEl = document.getElementById('dst');
const killsEl = document.getElementById('kills');
const ramBadge = document.getElementById('ramBadge');

const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const goBtn = document.getElementById('goBtn');
const resetBtn = document.getElementById('resetBtn');

const topSpdEl = document.getElementById('topSpd');
const totalDstEl = document.getElementById('totalDst');
const totalKillsEl = document.getElementById('totalKills');

const lBtn = document.getElementById('lBtn');
const rBtn = document.getElementById('rBtn');

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}
function playDrum(pitch = 110) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch * 1.6, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(pitch * 0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
}

function playRamSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain(); 


    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
}

function playBlastSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const bufSize = audioCtx.sampleRate * 0.45;
    const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.linearRampToValueAtTime(60, now + 0.45);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(now);
}

const W = canvas.width;
const H = canvas.height;
const BANK_W = 44;

let running = false;
let lastTime = 0;

let speedKmh = 42;
let maxSpd = 42;
let dist = 0;
let kills = 0;

let speedTimer = 0;
let drumTimer = 0;
let enemyTimer = 0;
let mineTimer = 0;
let shake = 0;

const keys = {
    left: false, right: false
};

const player = {
    x: W / 2, y: H - 140, vx: 0, w: 28, h: 110, tilt: 0, oarPhase: 0
};

let ripples = [];
let trees = [];
let enemies = [];
let mines = [];
let particles = [];

function initWorld() {
    ripples = [];
    trees = [];
    enemies = [];
    mines = [];
    particles = [];

    for (let i = 0; i < 24; i++) {
        ripples.push({
            x: BANK_W + 15 + Math.random() * (W - BANK_W * 2 - 30),
            y: Math.random() * H,
            len: 18 + Math.random() * 28
        });
    }

    for (let i = 0; i < 10; i++) {
        trees.push({
            side: i % 2 === 0 ? 'L' : 'R',
            y: (i * H) / 10,
            r: 14 + (i % 3) * 4
        });
    }
}
// input handling 
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === ' ' && !running) {
        startGame();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

function bindTouch(btn, dir) {

    if(!btn) return;
    const start = (e) => { e.preventDefault(); keys[dir] = true;};
    const end = (e) => { e.preventDefault(); keys[dir] = false; };
    btn.addEventListener('touchstart', start, { passive: false});
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
}
bindTouch(lBtn, 'left');
bindTouch(rBtn, 'right');

function spawnEnemy() {
    const minX = BANK_W + 32;
    const maxX = W - BANK_W - 32;
    enemies.push({
        x: minX + Math.random() * (maxX - minX),
        y: -120,
        vx: 0,
        w: 26,
        h: 100,
        kicked: false,
        spin: 0,
        color: Math.random() > 0.5 ? '#0f766e' : '#b45309'
    });
}
function spawnMine() {
    const minX = BANK_W + 30;
    const maxX = W - BANK_W - 30;
    mines.push({
        x: minX + Math.random() * (maxX - minX),
        y: -50,
        r: 16,
        pulse: 0
    });
}
function addSplash(x, y, color, count = 12) {
    for(let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 140;
        particles.push({
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            size: 2.5 + Math.random() * 3.5,
            color
        });
    }
}
function drawRiver(dt, flowSpd) {
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#99f6e4');
    grad.addColorStop(0.5, '#ccfbf1');
    grad.addColorStop(1, '#99f6e4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.28)';
    ctx.lineWidth = 2;
    for (let r of ripples) {
        r.y += flowSpd * dt;
        if (r.y > H + 30) {
            r.y = -30;
            r.x = BANK_W + 15 + Math.random() * (W - BANK_W * 2 - 30);
        }
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x, r.y + r.len);
        ctx.stroke();
    }
    ctx.fillStyle = '#115e59';
    ctx.fillRect(0, 0, BANK_W, H);
    ctx.fillRect(W - BANK_W, 0, BANK_W, H);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(BANK_W - 4, 0, 4, H);
    ctx.fillRect(W - BANK_W, 0, 4, H);

    for (let t of trees) {
    t.y += flowSpd * 0.85 * dt;
    if (t.y > H + 40) t.y = -40;
    const tx = t.side === 'L' ? 20 : W -20;
    ctx.fillStyle = '#042f2e';
    ctx.beginPath();
    ctx.arc(tx, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(tx - 2, t.y - 2, t.r * 0.65, 0, Math.PI * 2);
    ctx.fill();
}
}
function drawSnakeBoat(x, y, w, h, tilt, oarAngle, hullcol, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    const oarSwing = Math.sin(oarAngle) * 0.45;
    ctx.strokeStyle = '#042f2e';
    ctx.lineWidth = 2;
    for (let offset = -h * 0.32; offset <= h * 0.28; offset += 14) {
        ctx.beginPath();
        ctx.moveTo(-w * 0.35, offset);
        ctx.lineTo(-w * 0.95, offset + oarSwing * 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w * 0.35, offset );
        ctx.lineTo(w * 0.95, offset + oarSwing * 12);
        ctx.stroke();
    }
    ctx.fillStyle = hullcol;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.55);
    ctx.quadraticCurveTo(w * 0.6, -h * 0.1, w * 0.42, h * 0.48);
    ctx.quadraticCurveTo(0, h * 0.62, -w * 0.42, h * 0.48);
    ctx.quadraticCurveTo(-w * 0.6, -h * 0.1, 0, -h * 0.55);
    ctx.fill();

    ctx.strokeStyle = isPlayer ? '#fbbf24' : '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.46);
    ctx.lineTo(0, h * 0.45);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, h * 0.44, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function drawMine(m) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.strokeStyle = '#042f2e';
    ctx.lineWidth = 2.5;
    for(let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + m.pulse * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * (m.r + 5), Math.sin(a) * (m.r + 5));
        ctx.stroke();
    }
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, m.r, 0, Math.PI * 2);
    ctx.fill();
    const glow = Math.sin(m.pulse * 6) > 0 ? '#ef4444': '#7f1d1d';
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, m.r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function update(dt) {
    speedTimer += dt;
    if (speedTimer >= 3.0) {
        speedTimer = 0;
        speedKmh += 7;
        if (speedKmh > maxSpd) maxSpd = speedKmh;
        spdEl.textContent = speedKmh;
    }
    const flowSpd = speedKmh * 4.4;
    dist += (speedKmh * dt) / 2.2;
    dstEl.textContent = Math.floor(dist);
    
    const beatTnterval = Math.max(0.18, 0.52 - speedKmh * 0.0018 );
    drumTimer += dt;
    if (drumTimer >= beatTnterval) {
        drumTimer = 0;
        playDrum(105 + Math.min(speedKmh * 0.25, 60));
    }
    const steerForce = 920;
    if (keys.left) player.vx -= steerForce * dt;
    if (keys.right) player.vx += steerForce * dt;
    player.vx *= Math.pow(0.06, dt);
    player.x += player.vx * dt;
    player.tilt = (player.vx / 420) * 0.22;
    player.oarPhase += dt * (8 + speedKmh * 0.06);
    const minX = BANK_W + player.w * 0.7;
    const maxX = W - BANK_W - player.w * 0.7;
    if (player.x < minX){
        player.x = minX;
        player.vx = 0;
    } else if (player.x > maxX) {
        player.x = maxX;
        player.vx = 0;
    }
    enemyTimer += dt;
    const enemyRate = Math.max(0.65, 1.85 - speedKmh * 0.005);
    if (enemyTimer >= enemyRate) {
        enemyTimer = 0;
        spawnEnemy();
    }
    mineTimer += dt;
    const mineRate = Math.max(0.85, 2.3 - speedKmh * 0.006);
    if(mineTimer >= mineRate) {
        mineTimer = 0;
        spawnMine();
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += (flowSpd * 0.58) * dt;
        e.x += e.vx * dt;

        if (e.kicked) {
            e.spin += 9 * dt;
            if (e.x < BANK_W || e.x > W - BANK_W) {
                addSplash(e.x, e.y, '#14b8a6', 16);
                enemies.splice(i, 1);
                continue;
            }
        } else {
            const dx = Math.abs(player.x - e.x);
            const dy = Math.abs(player.y - e.y);
            if (dx < (player.w + e.w) * 0.55 && dy < (player.h + e.h) * 0.42) {
                e.kicked = true;
                const pushDir = e.x >= player.x ? 1 : -1;
                e.vx = pushDir * (380 + Math.abs(player.vx) * 0.5);
                player.vx = -pushDir * 130;
                kills++;
                killsEl.textContent = kills;
                console.log("boat kicked! total : ", kills);
                ramBadge.style.transform = 'translateX(-50%) scale(1.18)';
                setTimeout(() => {
                    ramBadge.style.transform = 'translateX(-50%) scale(1)';
                }, 150);
                shake = 8;
                playRamSound();
                addSplash((player.x + e.x) / 2, (player.y + e.y) / 2, '#fbbf24', 15);
            }
        }
        if (e.y > H + 140) enemies.splice(i, 1);
    }
    for (let i = mines.length - 1; i >= 0; i--) {
        const m = mines[i];
        m.y += flowSpd * 0.78 * dt;
        m.pulse += dt;
        const dx = player.x - m.x;
        const dy = player.y - m.y;
        if (Math.abs(dx) < player.w * 0.55 + m.r * 0.75 && Math.abs(dy) < player.h * 0.44 + m.r * 0.75) {
            playBlastSound();
            addSplash(m.x, m.y, '#ef4444', 28);
            triggerGameOver();
            return;
        }
        if (m.y > H + 60) mines.splice(i, 1);
    }
for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
}
if (shake > 0) shake = Math.max(0, shake - 28 * dt);
}
function render(dt) {
    ctx.save();
    if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    const flowSpd = speedKmh * 4.4;
    drawRiver(dt, flowSpd);
    for (let m of mines) drawMine(m);
    for (let e of enemies) {
        drawSnakeBoat(e.x, e.y, e.w, e.h, e.spin, player.oarPhase * 0.8, e.color, false);
    }
    drawSnakeBoat(player.x, player.y, player.w, player.h, player.tilt, player.oarPhase, '#042f2e', true);
    for (let p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}
function loop(timestamp) {
  if (!running) return;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  render(dt);

  if (running) requestAnimationFrame(loop);
}

function startGame() {
  initAudio();
  running = true;
  console.log("game started");

  speedKmh = 42;
  maxSpd = 42;
  dist = 0;
  kills = 0;
  speedTimer = 0;
  enemyTimer = 0;
  mineTimer = 0;

  player.x = W / 2;
  player.vx = 0;
  player.tilt = 0;

  if (spdEl)spdEl.textContent = speedKmh;
  if (dstEl) dstEl.textContent = '0';
  if (killsEl)killsEl.textContent = '0';

  initWorld();
  if (startScreen) startScreen.classList.add('hide');
  if (endScreen)endScreen.classList.add('hide');

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function triggerGameOver() {
  running = false;
  const finalM = Math.floor(dist);
  if (finalM > bestDist) {
    bestDist = finalM;
    localStorage.setItem('oddam_best', bestDist);
    if (bestScoreEl) bestScoreEl.textContent = bestDist;
    console.log("new high score: ", bestDist);
  }
  if (topSpdEl) topSpdEl.textContent = maxSpd + ' KM/H';
  if (totalDstEl) totalDstEl.textContent = Math.floor(dist) + ' M';
  if (totalKillsEl) totalKillsEl.textContent = kills;
  if (endScreen) endScreen.classList.remove('hide');
}

goBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', startGame);
initWorld();
render(0.016);