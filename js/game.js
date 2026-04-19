const TILE_SIZE = 35;
const TILE_FILES = [
    "asset/tiles/tile_0000.png",
    "asset/tiles/tile_0001.png",
    "asset/tiles/tile_0002.png"
];

const grid = document.querySelector(".map-grid");
const cityLayer = document.querySelector(".city-layer");
const viewport = document.querySelector(".game-viewport");
const player = document.querySelector(".player");
const areaValue = document.querySelector(".area-value");
const coinsValue = document.querySelector(".coins-value");
const pauseOverlay = document.querySelector(".pause-overlay");
const shopOverlay = document.querySelector(".shop-overlay");
const dialogueToast = document.querySelector(".dialogue-toast");
const dialogueText = document.querySelector(".dialogue-text");
const weatherRain = document.querySelector(".weather-layer.rain");
const weatherFog = document.querySelector(".weather-layer.fog");
const dayNight = document.querySelector(".day-night");
const bossTelegraph = document.querySelector(".boss-telegraph");
const hudHp = document.querySelector(".hud-bar .bar-inner.hp");
const hudMp = document.querySelector(".hud-bar .bar-inner.mp");
const hudXp = document.querySelector(".hud-bar .bar-inner.xp");
const hudSt = document.querySelector(".hud-bar .bar-inner.st");
const hudHpText = document.querySelectorAll(".hud-bar .hud-value")[0];
const hudMpText = document.querySelectorAll(".hud-bar .hud-value")[1];
const hudXpText = document.querySelectorAll(".hud-bar .hud-value")[2];
const hudStText = document.querySelectorAll(".hud-bar .hud-value")[3];
const hudLevelPill = document.querySelector(".hud-right .mini-pill");
const hotbarSlots = Array.from(document.querySelectorAll(".hotbar .slot"));
const minimapCanvas = document.getElementById("minimap");
const minimapCtx = minimapCanvas ? minimapCanvas.getContext("2d") : null;
const questTracker = document.querySelector(".quest-tracker");
const questProgress = document.querySelector(".quest-progress");
const vendor = document.querySelector(".npc.vendor");
const enemies = Array.from(document.querySelectorAll(".enemy"));
const enemyData = enemies.map((enemy, index) => ({
    el: enemy,
    x: index * 7 + 5,
    y: index * 6 + 4,
    hp: 3,
    maxHp: 3,
    speed: 1,
    hue: 140,
    alive: true
}));
const faceClasses = ["face-up", "face-down", "face-left", "face-right"];
const stateClasses = ["idle", "moving"];

const seedKey = "pixel_odyssey_seed";
let seed = Number(window.localStorage.getItem(seedKey));
if (!Number.isFinite(seed)) {
    seed = Date.now() >>> 0;
    window.localStorage.setItem(seedKey, String(seed));
}

const randFromCoords = (x, y) => {
    let t = (seed ^ (x * 0x9e3779b9) ^ (y * 0x85ebca6b)) >>> 0;
    t = Math.imul(t ^ (t >>> 16), 0x7feb352d);
    t = Math.imul(t ^ (t >>> 13), 0x846ca68b);
    t = (t ^ (t >>> 16)) >>> 0;
    return t / 4294967296;
};

const CHUNK_SIZE = 20;
const AREA_TYPES = [
    { name: "NOX GROVE", type: "meadow" },
    { name: "STONEBRIDGE CITY", type: "city" },
    { name: "DUSK MARSH", type: "marsh" },
    { name: "RUINED EDGE", type: "ruins" }
];

const areaAt = (x, y) => {
    const ax = Math.floor(x / CHUNK_SIZE);
    const ay = Math.floor(y / CHUNK_SIZE);
    const roll = randFromCoords(ax * 13, ay * 17);
    const index = Math.floor(roll * AREA_TYPES.length);
    return AREA_TYPES[Math.max(0, Math.min(AREA_TYPES.length - 1, index))];
};

const spawnEnemies = (areaType) => {
    enemyData.forEach((enemy, index) => {
        enemy.alive = true;
        enemy.el.style.display = "block";
        const angle = (index / enemyData.length) * Math.PI * 2;
        enemy.x = worldX + Math.cos(angle) * 4;
        enemy.y = worldY + Math.sin(angle) * 4;
        if (areaType === "city") {
            enemy.maxHp = 4;
            enemy.hp = 4;
            enemy.speed = 1.1;
            enemy.hue = 60;
        } else if (areaType === "marsh") {
            enemy.maxHp = 3;
            enemy.hp = 3;
            enemy.speed = 0.9;
            enemy.hue = 200;
        } else if (areaType === "ruins") {
            enemy.maxHp = 5;
            enemy.hp = 5;
            enemy.speed = 1.3;
            enemy.hue = 320;
        } else {
            enemy.maxHp = 3;
            enemy.hp = 3;
            enemy.speed = 1;
            enemy.hue = 140;
        }
        const sprite = enemy.el.querySelector(".enemy-sprite");
        if (sprite) {
            sprite.style.filter = `hue-rotate(${enemy.hue}deg) saturate(1.2)`;
        }
    });
};

const pickTile = (x, y) => {
    const area = areaAt(x, y).type;
    const roll = randFromCoords(x, y);
    if (area === "city") {
        if (roll < 0.7) return TILE_FILES[2];
        return roll < 0.85 ? TILE_FILES[1] : TILE_FILES[0];
    }
    if (area === "marsh") {
        if (roll < 0.6) return TILE_FILES[1];
        return roll < 0.9 ? TILE_FILES[2] : TILE_FILES[0];
    }
    if (area === "ruins") {
        if (roll < 0.5) return TILE_FILES[2];
        return roll < 0.8 ? TILE_FILES[0] : TILE_FILES[1];
    }
    if (roll < 0.55) return TILE_FILES[0];
    if (roll < 0.85) return TILE_FILES[1];
    return TILE_FILES[2];
};

let worldX = 0;
let worldY = 0;
let cols = 0;
let rows = 0;
let lastChunkKey = "";
const cityChunks = new Map();

const buildGrid = () => {
    if (!grid || !viewport) return;
    const { clientWidth, clientHeight } = viewport;
    cols = Math.ceil(clientWidth / TILE_SIZE) + 2;
    rows = Math.ceil(clientHeight / TILE_SIZE) + 2;

    grid.style.setProperty("--cols", cols);
    grid.style.setProperty("--rows", rows);
    grid.style.setProperty("--tile", `${TILE_SIZE}px`);

    grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            const tile = document.createElement("div");
            tile.className = "map-tile";
            frag.appendChild(tile);
        }
    }
    grid.appendChild(frag);
    renderGrid();
};

const renderGrid = () => {
    if (!grid) return;
    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);
    const tiles = grid.children;
    let i = 0;
    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            const wx = Math.floor(worldX) + (c - centerCol);
            const wy = Math.floor(worldY) + (r - centerRow);
            tiles[i].style.backgroundImage = `url("${pickTile(wx, wy)}")`;
            i += 1;
        }
    }
};

const chunkKey = (cx, cy) => `${cx},${cy}`;

const buildCityChunk = (cx, cy) => {
    const chunk = document.createElement("div");
    chunk.className = "city-chunk";

    const roadH = document.createElement("div");
    roadH.className = "city-road";
    roadH.style.left = "0";
    roadH.style.top = "46%";
    roadH.style.width = "100%";
    roadH.style.height = "12%";
    chunk.appendChild(roadH);

    const roadV = document.createElement("div");
    roadV.className = "city-road";
    roadV.style.left = "46%";
    roadV.style.top = "0";
    roadV.style.width = "12%";
    roadV.style.height = "100%";
    chunk.appendChild(roadV);

    const blockPositions = [
        { x: 8, y: 8, w: 180, h: 140 },
        { x: 260, y: 6, w: 160, h: 160 },
        { x: 430, y: 30, w: 180, h: 120 },
        { x: 30, y: 320, w: 190, h: 150 },
        { x: 280, y: 300, w: 160, h: 170 },
        { x: 430, y: 340, w: 180, h: 130 }
    ];

    blockPositions.forEach((pos) => {
        const block = document.createElement("div");
        block.className = "city-block";
        block.style.left = `${pos.x}px`;
        block.style.top = `${pos.y}px`;
        block.style.width = `${pos.w}px`;
        block.style.height = `${pos.h}px`;
        chunk.appendChild(block);
    });

    return chunk;
};

const renderCityLayer = () => {
    if (!cityLayer || !viewport) return;
    const viewCols = Math.ceil(cols / CHUNK_SIZE) + 2;
    const viewRows = Math.ceil(rows / CHUNK_SIZE) + 2;
    const centerChunkX = Math.floor(worldX / CHUNK_SIZE);
    const centerChunkY = Math.floor(worldY / CHUNK_SIZE);
    const needed = new Set();

    for (let y = -viewRows; y <= viewRows; y += 1) {
        for (let x = -viewCols; x <= viewCols; x += 1) {
            const cx = centerChunkX + x;
            const cy = centerChunkY + y;
            const area = areaAt(cx * CHUNK_SIZE, cy * CHUNK_SIZE);
            if (area.type !== "city") continue;
            const key = chunkKey(cx, cy);
            needed.add(key);
            if (!cityChunks.has(key)) {
                const chunk = buildCityChunk(cx, cy);
                cityChunks.set(key, { el: chunk, cx, cy });
                cityLayer.appendChild(chunk);
            }
        }
    }

    cityChunks.forEach((value, key) => {
        if (!needed.has(key)) {
            value.el.remove();
            cityChunks.delete(key);
        }
    });

    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;
    cityChunks.forEach((value) => {
        const px = (value.cx * CHUNK_SIZE - worldX) * TILE_SIZE + centerX;
        const py = (value.cy * CHUNK_SIZE - worldY) * TILE_SIZE + centerY;
        value.el.style.transform = `translate(${px}px, ${py}px)`;
    });
};

buildGrid();
window.addEventListener("resize", () => {
    clearTimeout(window.__tileResize);
    window.__tileResize = setTimeout(buildGrid, 120);
});

// Smooth movement
const keys = new Set();
const SPEED = 120; // px per second
const RUN_MULT = 1.8;
let lastFrame = performance.now();
let coins = 0;
const lootDrops = [];
let paused = false;
let level = 7;
let xp = 10;
let xpMax = 100;
let hp = 82;
let hpMax = 100;
let mp = 48;
let mpMax = 100;
let st = 100;
let stMax = 100;
let kills = 0;
const killTarget = 3;
let combo = 0;
let lastHitTime = 0;
let shopOpen = false;
let vendorX = 6;
let vendorY = 6;
let rollUntil = 0;
let rollCooldownUntil = 0;
let invincible = false;
let lastAreaType = "";
let lastDialogueTime = 0;
let bossCooldown = 0;
let vendorNear = false;

const saveKey = "pixel_odyssey_save";
const saveGame = () => {
    const data = { worldX, worldY, coins, level, xp, xpMax, hp, hpMax, mp, mpMax, st, stMax, kills };
    window.localStorage.setItem(saveKey, JSON.stringify(data));
};

const loadGame = () => {
    const raw = window.localStorage.getItem(saveKey);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        worldX = data.worldX ?? worldX;
        worldY = data.worldY ?? worldY;
        coins = data.coins ?? coins;
        level = data.level ?? level;
        xp = data.xp ?? xp;
        xpMax = data.xpMax ?? xpMax;
        hp = data.hp ?? hp;
        hpMax = data.hpMax ?? hpMax;
        mp = data.mp ?? mp;
        mpMax = data.mpMax ?? mpMax;
        st = data.st ?? st;
        stMax = data.stMax ?? stMax;
        kills = data.kills ?? kills;
    } catch (_) {
        // ignore bad save
    }
};

const dirFromKey = (key) => {
    if (key === "w" || key === "arrowup") return "up";
    if (key === "s" || key === "arrowdown") return "down";
    if (key === "a" || key === "arrowleft") return "left";
    if (key === "d" || key === "arrowright") return "right";
    return null;
};

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        event.preventDefault();
    }
    keys.add(key);
});

window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => {
    keys.clear();
});

let lastAreaName = "";

const update = (time) => {
    const dt = Math.min(0.05, (time - lastFrame) / 1000);
    lastFrame = time;
    if (paused) {
        window.requestAnimationFrame(update);
        return;
    }

    let dx = 0;
    let dy = 0;
    if (keys.has("w") || keys.has("arrowup")) dy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;

    const nowMs = time;
    const rolling = nowMs < rollUntil;
    invincible = rolling;
    const running = keys.has("shift") && st > 0 && !rolling;
    const isMoving = dx !== 0 || dy !== 0;
    if (player) {
        player.classList.remove(...stateClasses);
        player.classList.add(isMoving ? "moving" : "idle");
        if (isMoving) {
            player.classList.remove(...faceClasses);
            if (Math.abs(dx) > Math.abs(dy)) {
                player.classList.add(dx > 0 ? "face-right" : "face-left");
            } else {
                player.classList.add(dy > 0 ? "face-down" : "face-up");
            }
        }
    }

    if (isMoving) {
        const len = Math.hypot(dx, dy) || 1;
        const rollMult = rolling ? 3 : 1;
        const speed = SPEED * (running ? RUN_MULT : 1) * rollMult;
        worldX += (dx / len) * (speed * dt) / TILE_SIZE;
        worldY += (dy / len) * (speed * dt) / TILE_SIZE;

        const offsetX = -((worldX % 1 + 1) % 1) * TILE_SIZE;
        const offsetY = -((worldY % 1 + 1) % 1) * TILE_SIZE;
        if (grid) {
            grid.style.setProperty("--offset-x", `${offsetX}px`);
            grid.style.setProperty("--offset-y", `${offsetY}px`);
        }
        renderGrid();
    }

    if (running) {
        st = Math.max(0, st - 20 * dt);
    } else if (!rolling) {
        st = Math.min(stMax, st + 25 * dt);
    }

    if (areaValue) {
        const area = areaAt(worldX, worldY);
        const areaName = area.name;
        if (areaName !== lastAreaName) {
            areaValue.textContent = areaName;
            lastAreaName = areaName;
        }
        if (area.type !== lastAreaType) {
            lastAreaType = area.type;
            spawnEnemies(area.type);
            if (weatherRain) weatherRain.classList.toggle("active", area.type === "marsh");
            if (weatherFog) weatherFog.classList.toggle("active", area.type === "ruins");
            if (dialogueToast && dialogueText) {
                dialogueText.textContent = `Entered ${areaName}`;
                dialogueToast.classList.add("show");
                lastDialogueTime = nowMs;
            }
        }
    }

    if (coinsValue) {
        coinsValue.textContent = String(coins);
    }

    if (hudHp && hudHpText) {
        hudHp.style.width = `${(hp / hpMax) * 100}%`;
        hudHpText.textContent = `${hp}/${hpMax}`;
    }
    if (hudMp && hudMpText) {
        hudMp.style.width = `${(mp / mpMax) * 100}%`;
        hudMpText.textContent = `${mp}/${mpMax}`;
    }
    if (hudXp && hudXpText) {
        hudXp.style.width = `${(xp / xpMax) * 100}%`;
        hudXpText.textContent = `${xp}/${xpMax}`;
    }
    if (hudSt && hudStText) {
        hudSt.style.width = `${(st / stMax) * 100}%`;
        hudStText.textContent = `${Math.round(st)}/${stMax}`;
    }
    if (hudLevelPill) {
        hudLevelPill.textContent = `LV ${String(level).padStart(2, "0")}`;
    }

    if (questProgress) {
        questProgress.textContent = `${kills}/${killTarget}`;
    }
    if (questTracker) {
        questTracker.classList.toggle("completed", kills >= killTarget);
    }

    const chunkKeyNow = `${Math.floor(worldX / CHUNK_SIZE)},${Math.floor(worldY / CHUNK_SIZE)}`;
    if (chunkKeyNow !== lastChunkKey) {
        lastChunkKey = chunkKeyNow;
        renderCityLayer();
    } else {
        renderCityLayer();
    }

    if (dialogueToast && nowMs - lastDialogueTime > 1800) {
        dialogueToast.classList.remove("show");
    }

    if (dayNight) {
        const cycle = (Math.sin(time / 30000) + 1) / 2;
        dayNight.style.opacity = `${0.2 + (1 - cycle) * 0.45}`;
    }

    // Enemy AI: wander + chase
    enemyData.forEach((enemy, index) => {
        if (!enemy.alive) return;
        const dxE = worldX - enemy.x;
        const dyE = worldY - enemy.y;
        const dist = Math.hypot(dxE, dyE);
        let vx = 0;
        let vy = 0;
        if (dist < 6) {
            vx = dxE / (dist || 1);
            vy = dyE / (dist || 1);
        } else {
            vx = Math.sin(time * 0.001 + index) * 0.2;
            vy = Math.cos(time * 0.0012 + index) * 0.2;
        }
        enemy.x += vx * dt * enemy.speed;
        enemy.y += vy * dt * enemy.speed;
    });

    if (viewport && enemyData.length) {
        const t = time / 1000;
        const centerX = viewport.clientWidth / 2;
        const centerY = viewport.clientHeight / 2;
        enemyData.forEach((enemy, index) => {
            const driftX = Math.sin(t * (0.6 + index * 0.2)) * 6;
            const driftY = Math.cos(t * (0.5 + index * 0.25)) * 4;
            const screenX = centerX + (enemy.x - worldX) * TILE_SIZE;
            const screenY = centerY + (enemy.y - worldY) * TILE_SIZE;
            enemy.el.style.left = `${screenX}px`;
            enemy.el.style.top = `${screenY}px`;
            enemy.el.style.transform = `translate(-50%, -50%) translate(${driftX}px, ${driftY}px)`;
            const hpBar = enemy.el.querySelector(".enemy-hp span");
            if (hpBar) {
                const pct = Math.max(0, enemy.hp / enemy.maxHp);
                hpBar.style.width = `${pct * 100}%`;
            }
        });
    }

    // Vendor
    if (vendor && viewport) {
        const centerX = viewport.clientWidth / 2;
        const centerY = viewport.clientHeight / 2;
        const screenX = centerX + (vendorX - worldX) * TILE_SIZE;
        const screenY = centerY + (vendorY - worldY) * TILE_SIZE;
        vendor.style.left = `${screenX}px`;
        vendor.style.top = `${screenY}px`;
        vendor.style.transform = "translate(-50%, -50%)";
        const dist = Math.hypot(vendorX - worldX, vendorY - worldY);
        vendorNear = dist < 1.2;
        if (vendorNear && dialogueToast && dialogueText && nowMs - lastDialogueTime > 800) {
            dialogueText.textContent = "Press E to shop";
            dialogueToast.classList.add("show");
            lastDialogueTime = nowMs;
        }
    }

    // Boss arena telegraph + damage
    const bossActive =
        Math.abs(Math.floor(worldX / CHUNK_SIZE)) % 5 === 0 &&
        Math.abs(Math.floor(worldY / CHUNK_SIZE)) % 5 === 0;
    if (bossTelegraph) {
        bossTelegraph.classList.toggle("active", bossActive);
    }
    if (bossActive && nowMs > bossCooldown) {
        bossCooldown = nowMs + 2000;
        const dist = Math.hypot(worldX % 5, worldY % 5);
        if (dist < 3 && !invincible) {
            hp = Math.max(0, hp - 8);
            if (dialogueToast && dialogueText) {
                dialogueText.textContent = "Boss shockwave!";
                dialogueToast.classList.add("show");
                lastDialogueTime = nowMs;
            }
        }
    }

    // Loot drops
    if (viewport && lootDrops.length) {
        const centerX = viewport.clientWidth / 2;
        const centerY = viewport.clientHeight / 2;
        for (let i = lootDrops.length - 1; i >= 0; i -= 1) {
            const drop = lootDrops[i];
            const screenX = centerX + (drop.x - worldX) * TILE_SIZE;
            const screenY = centerY + (drop.y - worldY) * TILE_SIZE;
            drop.el.style.left = `${screenX}px`;
            drop.el.style.top = `${screenY}px`;
            const dist = Math.hypot(drop.x - worldX, drop.y - worldY);
            if (dist < 0.9) {
                coins += drop.rarity || 1;
                drop.el.remove();
                lootDrops.splice(i, 1);
            }
        }
    }

    // Minimap
    if (minimapCtx) {
        minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        minimapCtx.fillStyle = "rgba(20, 30, 20, 0.9)";
        minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        minimapCtx.fillStyle = "#8fd38f";
        minimapCtx.fillRect(76, 76, 8, 8);
        minimapCtx.fillStyle = "#ff8b8b";
        enemyData.forEach((enemy) => {
            if (!enemy.alive) return;
            const dx = (enemy.x - worldX) * 4;
            const dy = (enemy.y - worldY) * 4;
            minimapCtx.fillRect(80 + dx, 80 + dy, 4, 4);
        });
        minimapCtx.fillStyle = "#ffd27a";
        minimapCtx.fillRect(80 + (vendorX - worldX) * 4, 80 + (vendorY - worldY) * 4, 4, 4);
    }

    window.requestAnimationFrame(update);
};

window.requestAnimationFrame(update);

if (hotbarSlots.length) {
    hotbarSlots[0].classList.add("active");
}

const isAnySlotActive = () => hotbarSlots.some((slot) => slot.classList.contains("active"));
const activeSlot = () => hotbarSlots.find((slot) => slot.classList.contains("active"));

const ATTACK_RANGE = 1.6;
const ATTACK_COOLDOWN = 400;
let lastAttack = 0;

const tryRoll = () => {
    const now = performance.now();
    if (now < rollCooldownUntil) return;
    if (st < 25) return;
    rollUntil = now + 200;
    rollCooldownUntil = now + 700;
    st = Math.max(0, st - 25);
    if (dialogueToast && dialogueText) {
        dialogueText.textContent = "Dodge!";
        dialogueToast.classList.add("show");
        lastDialogueTime = now;
    }
};

const tryAttack = () => {
    const now = performance.now();
    if (now - lastAttack < ATTACK_COOLDOWN) return;
    if (!isAnySlotActive()) return;
    if (st < 10) return;
    lastAttack = now;
    st = Math.max(0, st - 10);

    if (now - lastHitTime < 700) {
        combo = Math.min(3, combo + 1);
    } else {
        combo = 1;
    }
    lastHitTime = now;
    const damage = combo;

    if (dialogueToast && dialogueText && combo > 1) {
        dialogueText.textContent = `Combo x${combo}`;
        dialogueToast.classList.add("show");
        lastDialogueTime = now;
    }

    if (viewport) {
        viewport.classList.remove("shake");
        void viewport.offsetWidth;
        viewport.classList.add("shake");
    }

    // Simple audio feedback
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 220;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (_) {
        // no-op
    }

    const cooldownEl = activeSlot() ? activeSlot().querySelector(".cooldown") : null;
    if (cooldownEl) {
        cooldownEl.classList.add("active");
        cooldownEl.style.transform = "scaleY(1)";
        setTimeout(() => {
            cooldownEl.style.transform = "scaleY(0)";
            cooldownEl.classList.remove("active");
        }, ATTACK_COOLDOWN);
    }

    if (player) {
        player.classList.add("attacking");
        setTimeout(() => player.classList.remove("attacking"), 500);
    }

    enemyData.forEach((enemy) => {
        if (!enemy.alive) return;
        const dx = enemy.x - worldX;
        const dy = enemy.y - worldY;
        const dist = Math.hypot(dx, dy);
        if (dist <= ATTACK_RANGE) {
            enemy.hp -= damage;
            enemy.x += (dx / (dist || 1)) * 0.6;
            enemy.y += (dy / (dist || 1)) * 0.6;
            enemy.el.classList.add("hit");
            setTimeout(() => enemy.el.classList.remove("hit"), 350);
            if (viewport) {
                const dmg = document.createElement("div");
                dmg.className = "damage-float";
                dmg.textContent = `-${damage}`;
                viewport.appendChild(dmg);
                const centerX = viewport.clientWidth / 2 + (enemy.x - worldX) * TILE_SIZE;
                const centerY = viewport.clientHeight / 2 + (enemy.y - worldY) * TILE_SIZE - 10;
                dmg.style.left = `${centerX}px`;
                dmg.style.top = `${centerY}px`;
                setTimeout(() => dmg.remove(), 600);
            }
            if (enemy.hp <= 0) {
                enemy.alive = false;
                enemy.el.style.display = "none";
                kills += 1;
                xp += 25;
                if (xp >= xpMax) {
                    xp -= xpMax;
                    level += 1;
                    xpMax = Math.round(xpMax * 1.2);
                    hpMax += 10;
                    hp = hpMax;
                }
                if (viewport) {
                    const drop = document.createElement("div");
                    const roll = Math.random();
                    if (roll < 0.7) drop.className = "loot common";
                    else if (roll < 0.93) drop.className = "loot rare";
                    else drop.className = "loot epic";
                    viewport.appendChild(drop);
                    lootDrops.push({ el: drop, x: enemy.x, y: enemy.y, rarity: drop.classList.contains("epic") ? 3 : drop.classList.contains("rare") ? 2 : 1 });
                }
            }
        }
    });
    saveGame();
};

window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "p") {
        paused = !paused;
        if (pauseOverlay) {
            pauseOverlay.classList.toggle("active", paused);
        }
    }
});

window.addEventListener("beforeunload", saveGame);

loadGame();

window.addEventListener("keydown", (event) => {
    const key = event.key;
    if (key.toLowerCase() === "q") {
        event.preventDefault();
        tryRoll();
    }
    if (key.toLowerCase() === "e" && vendorNear) {
        event.preventDefault();
        shopOpen = !shopOpen;
        paused = shopOpen;
        if (shopOverlay) {
            shopOverlay.classList.toggle("active", shopOpen);
        }
        return;
    }
    if (key.toLowerCase() === "b" && shopOpen) {
        event.preventDefault();
        if (coins >= 10) {
            coins -= 10;
            hp = Math.min(hpMax, hp + 25);
            if (dialogueToast && dialogueText) {
                dialogueText.textContent = "Potion used!";
                dialogueToast.classList.add("show");
                lastDialogueTime = performance.now();
            }
            saveGame();
        }
        return;
    }
    if (key === " " || key.toLowerCase() === "j") {
        event.preventDefault();
        tryAttack();
    }
    if (!/^[0-9]$/.test(key)) return;
    const slotIndex = key === "0" ? 9 : Number(key) - 1;
    hotbarSlots.forEach((slot, index) => {
        slot.classList.toggle("active", index === slotIndex);
    });
});

