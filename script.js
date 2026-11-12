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
const totalDstEl = document.getElementById('totaldst');
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
    const osc = audioCtx.createOScillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch * 1.6, now);
    osc.freQuency.exponentialRampToValueAtTIme(pitch * 0.5, now + 0.12);

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
    gain.gain.exponentialRampToValueAtTIme(0.01, now + 0.24);

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

    const filter = audioCtx.createbiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.linearRampToValueAtTime(60, now + 0.45);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTIme(0.01, now + 0.45);

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

let speedKmh = 45;
let maxSpd = 45;
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

let ripple = [];
let trees = [];
let enemies = [];
let mines = [];
let particles = [];

function initWorld() {
    ripple = [];
    trees = [];
    enemies = [];
    mines = [];
    particles = [];

    for (let i = 0; i < 24; i++) {
        ripple.push({
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
// innput handling 
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'AroowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

function bindTouch(btn, dir) {
    const start = (e) => { e.preventDefault(); keys[dir] = true;};
    const end = (e) => { e.preventDefault(); keys[dir] = false; };
    btn.addEventListener('touchStart', start, { passive: false});
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('mousedowm', start);
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
function drawRiver(dt, flowspd) {
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
    ctx.arc(tx, t.y, t.r, 0, Math,PI * 2);
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
        ctx.moveTo(w * 0.35, offset);
        ctx.lineTo(w * 0.95, offset + oarSwing * 12);
        ctx.stroke();
    }
}