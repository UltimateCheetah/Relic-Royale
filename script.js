const screens = document.querySelectorAll('.screen');
const navButtons = document.querySelectorAll('.nav-button');
const selectionCards = document.querySelectorAll('.selection-card');
const relicButtons = document.querySelectorAll('.relic-option');
const playNowBtn = document.getElementById('playNowBtn');
const viewModesBtn = document.getElementById('viewModesBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const summaryToHomeBtn = document.getElementById('summaryToHomeBtn');
const matchMapTitle = document.getElementById('matchMapTitle');
const activeRelicLabel = document.getElementById('activeRelicLabel');
const fragmentsValue = document.getElementById('fragmentsValue');
const placementValue = document.getElementById('placementValue');
const relicScoreValue = document.getElementById('relicScoreValue');
const rewardValue = document.getElementById('rewardValue');
const passValue = document.getElementById('passValue');

const healthValue = document.getElementById('healthValue');
const shieldValue = document.getElementById('shieldValue');
const relicValue = document.getElementById('relicValue');
const stormValue = document.getElementById('stormValue');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let activeScreen = 'home';
let currentMode = 'solo';
let currentRelic = 'Shock Pulse';
let selectedMap = 'Veil Harbor';
let matchActive = false;
let lastTimestamp = 0;

const relics = {
  'Shock Pulse': { cost: 24, label: 'Shock Pulse', description: 'Burst damage in a radial cone.' },
  'Shield Bloom': { cost: 18, label: 'Shield Bloom', description: 'Restores temporary shield.' },
  'Blink Dash': { cost: 20, label: 'Blink Dash', description: 'Short-range repositioning burst.' },
  'Scan Pulse': { cost: 16, label: 'Scan Pulse', description: 'Reveals enemy and loot positions.' }
};

const state = {
  timeLeft: 150,
  player: {
    x: 150,
    y: 240,
    radius: 14,
    speed: 200,
    health: 100,
    shield: 65,
    relic: 72,
    relicCooldown: 0,
    score: 0,
    fragments: 0,
    fireCooldown: 0
  },
  enemies: [],
  loot: [],
  projectiles: [],
  storm: { cx: 460, cy: 280, radius: 280 },
  keys: {},
  mouse: { x: 500, y: 280, down: false },
  matchComplete: false
};

function showScreen(screenName) {
  screens.forEach((screen) => {
    screen.classList.toggle('visible', screen.id === screenName);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.screen === screenName);
  });

  activeScreen = screenName;
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.screen;
    if (target === 'home') {
      showScreen('home');
      return;
    }

    if (target === 'modes') {
      showScreen('modes');
      return;
    }

    if (target === 'relics') {
      showScreen('relics');
      return;
    }

    if (target === 'pass') {
      showScreen('pass');
      return;
    }

    if (target === 'events') {
      showScreen('events');
      return;
    }

    if (target === 'social') {
      showScreen('social');
      return;
    }

    if (target === 'vault') {
      showScreen('vault');
      return;
    }

    if (target === 'settings') {
      showScreen('settings');
      return;
    }

    if (target === 'locker') {
      showScreen('locker');
    }
  });
});

selectionCards.forEach((card) => {
  card.addEventListener('click', () => {
    selectionCards.forEach((item) => item.classList.remove('selected'));
    card.classList.add('selected');
    currentMode = card.dataset.mode;
  });
});

relicButtons.forEach((button) => {
  button.addEventListener('click', () => {
    relicButtons.forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    currentRelic = button.dataset.relic;
    activeRelicLabel.textContent = currentRelic;
  });
});

playNowBtn.addEventListener('click', () => {
  showScreen('modes');
});

viewModesBtn.addEventListener('click', () => {
  showScreen('modes');
});

backToMenuBtn.addEventListener('click', () => {
  stopMatch();
  showScreen('home');
});

playAgainBtn.addEventListener('click', () => {
  startMatch();
});

summaryToHomeBtn.addEventListener('click', () => {
  showScreen('home');
});

function beginMatchFlow() {
  selectedMap = document.getElementById('mapSelect').value;
  matchMapTitle.textContent = selectedMap;
  startMatch();
}

playNowBtn.addEventListener('click', beginMatchFlow);
viewModesBtn.addEventListener('click', beginMatchFlow);

function createEnemy(x, y, radius = 14) {
  return {
    x,
    y,
    radius,
    health: 32,
    speed: 60 + Math.random() * 25,
    dx: (Math.random() - 0.5) * 2,
    dy: (Math.random() - 0.5) * 2,
    color: '#ff7d78'
  };
}

function initMatchState() {
  state.player.x = 150;
  state.player.y = 240;
  state.player.health = 100;
  state.player.shield = 65;
  state.player.relic = 72;
  state.player.score = 0;
  state.player.fragments = 0;
  state.player.fireCooldown = 0;
  state.player.relicCooldown = 0;
  state.timeLeft = 150;
  state.enemies = [];
  state.loot = [];
  state.projectiles = [];
  state.storm = { cx: 460, cy: 280, radius: 280 };
  state.matchComplete = false;

  for (let i = 0; i < 7; i += 1) {
    state.enemies.push(createEnemy(500 + Math.random() * 260, 60 + Math.random() * 380, 12 + Math.random() * 6));
  }

  for (let i = 0; i < 10; i += 1) {
    state.loot.push({
      x: 60 + Math.random() * 780,
      y: 40 + Math.random() * 470,
      radius: 8,
      value: 20,
      type: 'fragment'
    });
  }
}

function startMatch() {
  initMatchState();
  matchActive = true;
  lastTimestamp = 0;
  activeRelicLabel.textContent = currentRelic;
  showScreen('match');
  requestAnimationFrame(gameLoop);
}

function stopMatch() {
  matchActive = false;
}

function triggerRelic() {
  if (!matchActive || state.player.relicCooldown > 0) {
    return;
  }

  const ability = relics[currentRelic];
  if (state.player.relic < ability.cost) {
    return;
  }

  state.player.relic = Math.max(0, state.player.relic - ability.cost);
  state.player.relicCooldown = 1.2;

  if (currentRelic === 'Shock Pulse') {
    for (const enemy of state.enemies) {
      const dist = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
      if (dist < 120) {
        enemy.health -= 26;
        enemy.x += (enemy.x - state.player.x) * 0.18;
        enemy.y += (enemy.y - state.player.y) * 0.18;
      }
    }
  }

  if (currentRelic === 'Shield Bloom') {
    state.player.shield = Math.min(100, state.player.shield + 30);
  }

  if (currentRelic === 'Blink Dash') {
    const dx = state.mouse.x - state.player.x;
    const dy = state.mouse.y - state.player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dashLength = 90;
    state.player.x = Math.max(18, Math.min(902, state.player.x + (dx / dist) * dashLength));
    state.player.y = Math.max(18, Math.min(542, state.player.y + (dy / dist) * dashLength));
  }

  if (currentRelic === 'Scan Pulse') {
    for (const enemy of state.enemies) {
      enemy.color = '#ffe082';
    }
  }
}

function fireProjectile() {
  if (!matchActive) {
    return;
  }

  if (state.player.fireCooldown > 0) {
    return;
  }

  const dx = state.mouse.x - state.player.x;
  const dy = state.mouse.y - state.player.y;
  const dist = Math.hypot(dx, dy) || 1;

  state.projectiles.push({
    x: state.player.x,
    y: state.player.y,
    dx: (dx / dist) * 360,
    dy: (dy / dist) * 360,
    radius: 4,
    ttl: 1.3
  });

  state.player.fireCooldown = 0.25;
}

function update(dt) {
  const player = state.player;

  if (state.keys['w'] || state.keys['ArrowUp']) player.y -= player.speed * dt;
  if (state.keys['s'] || state.keys['ArrowDown']) player.y += player.speed * dt;
  if (state.keys['a'] || state.keys['ArrowLeft']) player.x -= player.speed * dt;
  if (state.keys['d'] || state.keys['ArrowRight']) player.x += player.speed * dt;

  player.x = Math.max(20, Math.min(900, player.x));
  player.y = Math.max(20, Math.min(540, player.y));

  if (player.relicCooldown > 0) player.relicCooldown -= dt;
  if (player.fireCooldown > 0) player.fireCooldown -= dt;
  player.relic = Math.min(100, player.relic + dt * 5);

  state.timeLeft -= dt;
  const shrinkRate = 0.7 * dt;
  state.storm.radius = Math.max(90, state.storm.radius - shrinkRate * 42);

  state.projectiles.forEach((projectile) => {
    projectile.x += projectile.dx * dt;
    projectile.y += projectile.dy * dt;
    projectile.ttl -= dt;
  });

  state.projectiles = state.projectiles.filter((projectile) => {
    if (projectile.ttl <= 0) return false;
    if (projectile.x < 0 || projectile.x > 920 || projectile.y < 0 || projectile.y > 560) return false;
    return true;
  });

  for (const enemy of state.enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / dist) * enemy.speed * dt * 0.7;
    enemy.y += (dy / dist) * enemy.speed * dt * 0.7;

    if (dist < player.radius + enemy.radius + 4) {
      const damage = 10 * dt;
      if (player.shield > 0) {
        player.shield = Math.max(0, player.shield - damage * 1.2);
      } else {
        player.health = Math.max(0, player.health - damage * 1.4);
      }
    }

    for (const projectile of state.projectiles) {
      const projDist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (projDist < enemy.radius + projectile.radius) {
        enemy.health -= 18;
        projectile.ttl = 0;
      }
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.health > 0);

  for (const lootItem of state.loot) {
    const dist = Math.hypot(player.x - lootItem.x, player.y - lootItem.y);
    if (dist < player.radius + lootItem.radius + 4) {
      player.fragments += 1;
      player.score += 20;
      lootItem.x = -9999;
      lootItem.y = -9999;
    }
  }

  state.loot = state.loot.filter((item) => item.x > -5000);

  const distanceToStorm = Math.hypot(player.x - state.storm.cx, player.y - state.storm.cy);
  if (distanceToStorm > state.storm.radius) {
    player.health = Math.max(0, player.health - 10 * dt);
  }

  if (player.health <= 0) {
    endMatch(false);
  }

  if (state.timeLeft <= 0 || state.enemies.length === 0) {
    endMatch(true);
  }

  updateHud();
}

function updateHud() {
  healthValue.textContent = Math.round(state.player.health);
  shieldValue.textContent = Math.round(state.player.shield);
  relicValue.textContent = `${Math.round(state.player.relic)}%`;
  fragmentsValue.textContent = `${state.player.fragments}`;
  const remainingSeconds = Math.max(0, Math.ceil(state.timeLeft));
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  stormValue.textContent = `${minutes}:${seconds}`;
}

function endMatch(victory) {
  if (state.matchComplete) return;
  state.matchComplete = true;
  stopMatch();

  const placement = victory ? '#1' : '#8';
  const relicScore = Math.round((state.player.score || 0) + state.player.fragments * 18 + state.player.relic * 5);
  const reward = `${Math.round(relicScore / 4)} shards`;

  placementValue.textContent = placement;
  relicScoreValue.textContent = String(relicScore);
  rewardValue.textContent = reward;
  passValue.textContent = `+${victory ? 8 : 3}%`;

  showScreen('summary');
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1a2738';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < canvas.width; i += 40) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }

  for (let i = 0; i < canvas.height; i += 40) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(125, 240, 213, 0.8)';
  ctx.lineWidth = 3;
  ctx.arc(state.storm.cx, state.storm.cy, state.storm.radius, 0, Math.PI * 2);
  ctx.stroke();

  for (const lootItem of state.loot) {
    ctx.beginPath();
    ctx.fillStyle = '#7df0d5';
    ctx.arc(lootItem.x, lootItem.y, lootItem.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const projectile of state.projectiles) {
    ctx.beginPath();
    ctx.fillStyle = '#ffd166';
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const enemy of state.enemies) {
    ctx.beginPath();
    ctx.fillStyle = enemy.color || '#ff7d78';
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(enemy.x - 18, enemy.y - 22, 36, 5);
    ctx.fillStyle = '#7df0d5';
    ctx.fillRect(enemy.x - 18, enemy.y - 22, 36 * (enemy.health / 32), 5);
  }

  ctx.beginPath();
  ctx.fillStyle = '#9a8dff';
  ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(state.player.x - 22, state.player.y - 26, 44, 5);
  ctx.fillStyle = '#7df0d5';
  ctx.fillRect(state.player.x - 22, state.player.y - 26, 44 * (state.player.shield / 100), 5);
}

function gameLoop(timestamp) {
  if (!matchActive) {
    return;
  }

  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  update(dt);
  render();

  if (matchActive) {
    requestAnimationFrame(gameLoop);
  }
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  state.keys[key] = true;

  if (key === ' ') {
    event.preventDefault();
    triggerRelic();
  }

  if (key === 'f') {
    fireProjectile();
  }
});

window.addEventListener('keyup', (event) => {
  state.keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  state.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener('click', fireProjectile);

showScreen('home');
updateHud();
render();
