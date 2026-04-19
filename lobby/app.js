const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseButton = document.getElementById('pause-button');
const pauseOverlay = document.getElementById('pause-overlay');
const pauseMain = document.getElementById('pause-main');
const pausePlayButton = document.getElementById('pause-play');
const pauseSettingsButton = document.getElementById('pause-settings');
const pauseExitButton = document.getElementById('pause-exit');
const pauseSettingsPanel = document.getElementById('pause-settings-panel');
const pauseSettingsBackButton = document.getElementById('pause-settings-back');
const pauseExitPanel = document.getElementById('pause-exit-panel');
const pauseExitConfirmButton = document.getElementById('pause-exit-confirm');
const pauseExitCancelButton = document.getElementById('pause-exit-cancel');
const volumeKnob = document.getElementById('volume-knob');
const volumeKnobIndicator = document.getElementById('volume-knob-indicator');
const volumeLabel = document.getElementById('volume-label');
ctx.imageSmoothingEnabled = false;
const effectCanvas = document.createElement('canvas');
const effectCtx = effectCanvas.getContext('2d');
effectCtx.imageSmoothingEnabled = false;
const effectFrameCache = new Map();
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
let progressApi = null;
let currentUser = null;
let currentProfile = null;
let isSavingStats = false;
let paused = false;
let pauseVolume = 1;
let knobDragging = false;
let lobbyZoom = 1;
const MIN_LOBBY_ZOOM = 0.75;
const MAX_LOBBY_ZOOM = 2.25;
const LOBBY_ZOOM_STEP = 0.1;

const TILE_SIZE = 40;
const SOURCE_TILE_SIZE = 16;
// Extended so the far-right scenery (rocks/crystals) isn't clipped at the edge of the map.
const WORLD_WIDTH = 3400;

function resizeCanvas() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;
    applyCanvasZoom();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function getGameWidth() {
    return viewportWidth;
}

function getGameHeight() {
    return viewportHeight;
}

function getGroundLevel() {
    return getGameHeight() - 110;
}

function applyCanvasZoom() {
    canvas.style.transformOrigin = 'center center';
    canvas.style.transform = `scale(${lobbyZoom})`;
}

function setLobbyZoom(nextZoom) {
    const clampedZoom = clamp(nextZoom, MIN_LOBBY_ZOOM, MAX_LOBBY_ZOOM);
    if (Math.abs(clampedZoom - lobbyZoom) < 0.001) {
        return;
    }

    lobbyZoom = clampedZoom;
    applyCanvasZoom();
}

const player = {
    x: 150,
    y: 0,
    width: 30,
    height: 50,
    speed: 6,
    velocityX: 0,
    velocityYGravity: 0,
    jumping: false,
    jumpPower: 15,
    gravity: 0.6,
    level: 1,
    health: 100,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    stats: {
        health: 0,
        mana: 0,
        voidCyclone: 0,
        shadowStrike: 0
    },
    availableStatPoints: 0,
    facingRight: true,
    animationState: 'idle',
    action: null
};

player.y = getGroundLevel() - player.height;

const keys = {};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
    }

    if (paused) {
        return;
    }

    keys[e.key.toLowerCase()] = true;

    if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        if (!player.jumping) {
            player.velocityYGravity = -player.jumpPower;
            player.jumping = true;
        }
    }

    if (e.key === 'e' || e.key === 'E') {
        handleInteraction();
    }

    if (e.key === 'j' || e.key === 'J') {
        triggerPlayerAction('attack');
    }

    if (e.key === 'q' || e.key === 'Q') {
        triggerPlayerAction('special');
    }

    if ((e.key === 'f' || e.key === 'F') && !document.getElementById('interactionPrompt')?.style.display?.includes('block')) {
        triggerPlayerAction('dash');
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('wheel', (event) => {
    if (window.__DARK_ODYSSEY_DEVICE_BLOCKED__) {
        return;
    }

    event.preventDefault();
    const delta = event.deltaY > 0 ? -LOBBY_ZOOM_STEP : LOBBY_ZOOM_STEP;
    setLobbyZoom(lobbyZoom + delta);
}, { passive: false });

window.addEventListener('keydown', (event) => {
    if (window.__DARK_ODYSSEY_DEVICE_BLOCKED__) {
        return;
    }

    if (event.code === 'Equal' || event.code === 'NumpadAdd') {
        event.preventDefault();
        setLobbyZoom(lobbyZoom + LOBBY_ZOOM_STEP);
        return;
    }

    if (event.code === 'Minus' || event.code === 'NumpadSubtract') {
        event.preventDefault();
        setLobbyZoom(lobbyZoom - LOBBY_ZOOM_STEP);
        return;
    }

    if (event.code === 'Digit0' || event.code === 'Numpad0') {
        event.preventDefault();
        setLobbyZoom(1);
    }
});

document.getElementById('dialogueYes')?.addEventListener('click', () => {
    if (activeDialogueKey === 'lloyd' && activeDialogueMode === 'upgrade') {
        openStatsPanel();
        return;
    }

    if (activeDialogueKey === 'portal' && activeDialogueMode === 'portal') {
        window.location.href = buildLoadingUrl(getNextStagePath(), {
            kicker: 'DIMENSIONAL PORTAL',
            title: 'Crossing Into The Dungeon',
            copy: 'The portal is opening. Gathering your power and shaping the next battlefield.'
        });
    }
});

document.getElementById('dialogueNo')?.addEventListener('click', () => {
    hideDialogue();
});

document.getElementById('statsClose')?.addEventListener('click', () => {
    hideStatsPanel();
});

document.getElementById('statsReset')?.addEventListener('click', () => {
    resetStats().catch((error) => {
        console.error('Failed to reset stats:', error);
    });
});

document.querySelectorAll('.stat-add').forEach((button) => {
    button.addEventListener('click', () => {
        upgradeStat(button.dataset.stat).catch((error) => {
            console.error('Failed to upgrade stat:', error);
        });
    });
});

function syncPausePanels(view = 'main') {
    if (!pauseMain || !pauseSettingsPanel || !pauseExitPanel) {
        return;
    }

    pauseMain.hidden = view !== 'main';
    pauseSettingsPanel.hidden = view !== 'settings';
    pauseExitPanel.hidden = view !== 'exit';
}

function syncPauseVolume() {
    const knobAngle = -135 + (pauseVolume * 270);

    if (volumeKnob) {
        volumeKnob.style.setProperty('--knob-angle', `${knobAngle}deg`);
        volumeKnob.setAttribute('aria-valuenow', String(Math.round(pauseVolume * 100)));
    }

    if (volumeKnobIndicator) {
        volumeKnobIndicator.style.setProperty('--knob-angle', `${knobAngle}deg`);
    }

    if (volumeLabel) {
        volumeLabel.textContent = `volume ${Math.round(pauseVolume * 100)}%`;
    }
}

function setPaused(nextPaused) {
    if (!pauseOverlay) {
        return;
    }

    paused = nextPaused;
    pauseOverlay.hidden = !paused;
    document.body.classList.toggle('is-paused', paused);

    if (paused) {
        syncPausePanels('main');
    } else {
        knobDragging = false;
    }

    syncPauseVolume();
}

function togglePause() {
    setPaused(!paused);
}

function updatePauseVolumeFromPointer(clientX, clientY) {
    if (!volumeKnob) {
        return;
    }

    const rect = volumeKnob.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);
    let knobAngle = (Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI) + 90;

    if (knobAngle > 180) {
        knobAngle -= 360;
    }

    knobAngle = Math.max(-135, Math.min(135, knobAngle));
    pauseVolume = Math.max(0, Math.min(1, (knobAngle + 135) / 270));
    syncPauseVolume();
}

pauseButton?.addEventListener('click', () => {
    togglePause();
});

pausePlayButton?.addEventListener('click', () => {
    setPaused(false);
});

pauseSettingsButton?.addEventListener('click', () => {
    syncPausePanels('settings');
});

pauseExitButton?.addEventListener('click', () => {
    syncPausePanels('exit');
});

pauseSettingsBackButton?.addEventListener('click', () => {
    syncPausePanels('main');
});

pauseExitCancelButton?.addEventListener('click', () => {
    syncPausePanels('main');
});

function goToMainMenuWithLoading() {
    window.location.href = buildLoadingUrl('../home.html', {
        kicker: 'RETURN',
        title: 'Leaving The Lobby',
        copy: 'The realm is folding away as you return to the main menu.'
    });
}

pauseExitConfirmButton?.addEventListener('click', () => {
    goToMainMenuWithLoading();
});

volumeKnob?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    knobDragging = true;
    volumeKnob.setPointerCapture?.(event.pointerId);
    updatePauseVolumeFromPointer(event.clientX, event.clientY);
});

window.addEventListener('pointermove', (event) => {
    if (!knobDragging) {
        return;
    }

    updatePauseVolumeFromPointer(event.clientX, event.clientY);
});

window.addEventListener('pointerup', () => {
    knobDragging = false;
});

window.addEventListener('pointercancel', () => {
    knobDragging = false;
});

const camera = {
    x: 0,
    y: 0
};

let lastFrameTime = performance.now();
let activeDialogueKey = null;
let activeDialogueMode = 'text';
const MAX_STAT_LEVEL = 100;

function getPlatforms() {
    return [
        { x: 0, y: getGroundLevel(), width: WORLD_WIDTH, height: 150, type: 'ground' }
    ];
}

function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
}

function loadImageSeries(folder, count) {
    return Array.from({ length: count }, (_, index) => loadImage(`${folder}/${index + 1}.png`));
}

const backgroundImage = loadImage('background.png');
const tilesetImage = loadImage('Tileset.png');
const dimensionalPortalImage = loadImage('Dimensional_Portal.png');
const cloudImages = [
    loadImage('Clouds_black/Shape1/cloud_shape1_1.png'),
    loadImage('Clouds_black/Shape3/cloud_shape3_2.png'),
    loadImage('Clouds_black/Shape5/cloud_shape5_3.png'),
    loadImage('Clouds_black/Shape8/clouds_shape8_1.png')
];
// New lobby map assets (copied from the updated lobby pack).
const caveRockImages = [
    loadImage('assetsG/cave_rocks/cave_rock1.png'),
    loadImage('assetsG/cave_rocks/cave_rock2.png'),
    loadImage('assetsG/cave_rocks/cave_rock3.png'),
    loadImage('assetsG/cave_rocks/cave_rock4.png'),
    loadImage('assetsG/cave_rocks/cave_rock5.png')
];
const whiteGoldCrystalImages = [
    loadImage('assetsG/crystals_white-gold/crystal_white-gold1.png'),
    loadImage('assetsG/crystals_white-gold/crystal_white-gold2.png'),
    loadImage('assetsG/crystals_white-gold/crystal_white-gold3.png'),
    loadImage('assetsG/crystals_white-gold/crystal_white-gold4.png'),
    loadImage('assetsG/crystals_white-gold/crystal_white-gold5.png')
];
const blackCrystalImages = [
    loadImage('assetsG/crystals_black/crystal_black1.png'),
    loadImage('assetsG/crystals_black/crystal_black2.png'),
    loadImage('assetsG/crystals_black/crystal_black3.png'),
    loadImage('assetsG/crystals_black/crystal_black4.png'),
    loadImage('assetsG/crystals_black/crystal_black5.png')
];
const groundTopTileImages = [
    loadImage('assetsG/1 Tiles/Tile_01.png'),
    loadImage('assetsG/1 Tiles/Tile_02.png'),
    loadImage('assetsG/1 Tiles/Tile_03.png'),
    loadImage('assetsG/1 Tiles/Tile_05.png'),
    loadImage('assetsG/1 Tiles/Tile_06.png'),
    loadImage('assetsG/1 Tiles/Tile_07.png'),
    loadImage('assetsG/1 Tiles/Tile_08.png')
];
const groundFillTileImages = [
    loadImage('assetsG/1 Tiles/Tile_10.png'),
    loadImage('assetsG/1 Tiles/Tile_11.png'),
    loadImage('assetsG/1 Tiles/Tile_12.png'),
    loadImage('assetsG/1 Tiles/Tile_13.png')
];
let backgroundFailed = false;
backgroundImage.onerror = () => {
    backgroundFailed = true;
};

const groundTiles = {
    top: { col: 0, row: 0 },
    fill: { col: 0, row: 1 }
};
const GROUND_TILE_DRAW_SIZE = 32;
const lobbyScenery = [
    {
        image: whiteGoldCrystalImages[2],
        x: 560,
        scale: 1.8,
        sink: 3,
        layer: 'back',
        glow: {
            fill: 'rgba(242, 210, 128, 0.24)',
            rim: 'rgba(255, 245, 204, 0.18)',
            pulse: 1.8,
            spread: 0.72
        }
    },
    {
        image: whiteGoldCrystalImages[4],
        x: 1600,
        scale: 1.7,
        sink: 2,
        layer: 'back',
        glow: {
            fill: 'rgba(245, 203, 112, 0.22)',
            rim: 'rgba(255, 242, 194, 0.16)',
            pulse: 1.6,
            spread: 0.7
        }
    },
    {
        image: blackCrystalImages[4],
        x: 2370,
        scale: 1.78,
        sink: 2,
        layer: 'back',
        glow: {
            fill: 'rgba(92, 74, 180, 0.2)',
            rim: 'rgba(165, 147, 255, 0.16)',
            pulse: 1.5,
            spread: 0.72
        }
    },
    { image: caveRockImages[4], x: 2790, scale: 1.6, sink: 2, layer: 'back', shadowScale: 0.17 },
    { image: caveRockImages[2], x: 2970, scale: 1.95, sink: 2, layer: 'back', shadowScale: 0.2 },
    { image: caveRockImages[4], x: 700, scale: 1.34, sink: 1, layer: 'front', shadowScale: 0.13 },
    {
        image: whiteGoldCrystalImages[0],
        x: 1710,
        scale: 1.58,
        sink: 1,
        layer: 'front',
        alpha: 0.95,
        glow: {
            fill: 'rgba(247, 207, 116, 0.18)',
            rim: 'rgba(255, 244, 206, 0.14)',
            pulse: 2.1,
            spread: 0.62
        }
    },
    {
        image: blackCrystalImages[0],
        x: 2520,
        scale: 1.62,
        sink: 1,
        layer: 'front',
        alpha: 0.96,
        glow: {
            fill: 'rgba(72, 60, 150, 0.18)',
            rim: 'rgba(142, 126, 235, 0.14)',
            pulse: 1.7,
            spread: 0.62
        }
    }
];

const hallokinSheets = {
    idle: loadImage('../characters/protagonist/Hallokin (protagonist)/png (free)/idle.png'),
    run: loadImage('../characters/protagonist/Hallokin (protagonist)/png (free)/run.png'),
    jump: loadImage('../characters/protagonist/Hallokin (protagonist)/png (free)/jump.png'),
    fall: loadImage('../characters/protagonist/Hallokin (protagonist)/png (free)/fall.png'),
    attack: loadImage('../characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png'),
    special: loadImage('../characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png'),
    dash: loadImage('../characters/protagonist/Hallokin (protagonist)/png (free)/jump - attack forwared.png')
};

const hallokinAnimations = {
    idle: {
        image: hallokinSheets.idle,
        frameWidth: 96,
        frameHeight: 128,
        frameOrder: [0, 2, 4, 6, 8, 10],
        fps: 10,
        scale: 4.2,
        trim: { x: 36, y: 48, width: 40, height: 36 },
        anchorX: 20,
        groundOffset: 16.8,
        effect: 'hallokinShadowHero'
    },
    run: {
        image: hallokinSheets.run,
        frameWidth: 96,
        frameHeight: 128,
        frameOrder: [0, 2, 4, 6],
        fps: 12,
        scale: 4.2,
        trim: { x: 34, y: 48, width: 42, height: 36 },
        anchorX: 22,
        groundOffset: 18,
        effect: 'hallokinShadowHero'
    },
    jump: {
        image: hallokinSheets.jump,
        frameWidth: 96,
        frameHeight: 128,
        frameOrder: [0, 2, 4],
        fps: 12,
        scale: 4.2,
        trim: { x: 32, y: 44, width: 44, height: 40 },
        anchorX: 24,
        groundOffset: 18,
        effect: 'hallokinShadowHero'
    },
    fall: {
        image: hallokinSheets.fall,
        frameWidth: 96,
        frameHeight: 128,
        frameOrder: [0, 2, 4],
        fps: 12,
        scale: 4.2,
        trim: { x: 32, y: 44, width: 44, height: 40 },
        anchorX: 24,
        groundOffset: 18,
        effect: 'hallokinShadowHero'
    },
    attack: {
        image: hallokinSheets.attack,
        frameWidth: 96,
        frameHeight: 128,
        frameOrder: [0, 0, 2, 4, 6],
        fps: 18,
        scale: 4.2,
        trim: { x: 22, y: 44, width: 70, height: 40 },
        anchorX: 34,
        groundOffset: 18,
        effect: 'hallokinShadowHero'
    },
    special: {
        image: hallokinSheets.special,
        frameWidth: 96,
        frameHeight: 128,
        frameOrder: [0, 0, 2, 4, 6, 8, 10],
        fps: 14,
        scale: 4.2,
        trim: { x: 18, y: 14, width: 62, height: 66 },
        anchorX: 34,
        anchorY: 65,
        groundOffset: 18,
        effect: 'hallokinShadowHero'
    },
    dash: {
        image: hallokinSheets.dash,
        frameWidth: 96,
        frameHeight: 128,
        frameOrder: [0, 0, 2, 4, 6, 8],
        fps: 21,
        scale: 4.2,
        trim: { x: 14, y: 30, width: 80, height: 46 },
        anchorX: 34,
        anchorY: 45,
        groundOffset: 18,
        effect: 'hallokinShadowHero'
    }
};

const HALL0KIN_HERO_PALETTE = {
    abyss: [4, 5, 8],
    deep: [11, 15, 24],
    core: [24, 31, 48],
    edge: [41, 55, 84],
    glow: [85, 111, 164],
    face: [224, 230, 240]
};

const playerActionRules = {
    attack: { duration: 5 / 18, manaCost: 0 },
    special: { duration: 7 / 14, manaCost: 10 },
    dash: { duration: 6 / 21, manaCost: 8 }
};

const npcSprites = {
    drew: {
        idle: { image: loadImage('../characters/us npc/us npc/drew/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 7, fps: 8, scale: 2.1 },
        idle2: { image: loadImage('../characters/us npc/us npc/drew/Idle_2.png'), frameWidth: 128, frameHeight: 128, frames: 8, fps: 8, scale: 2.1 },
        walk: { image: loadImage('../characters/us npc/us npc/drew/Walk.png'), frameWidth: 128, frameHeight: 128, frames: 10, fps: 10, scale: 2.1 },
        run: { image: loadImage('../characters/us npc/us npc/drew/Run.png'), frameWidth: 128, frameHeight: 128, frames: 8, fps: 11, scale: 2.1 },
        jump: { image: loadImage('../characters/us npc/us npc/drew/Jump.png'), frameWidth: 128, frameHeight: 128, frames: 4, fps: 8, scale: 2.1 },
        hurt: { image: loadImage('../characters/us npc/us npc/drew/Hurt.png'), frameWidth: 128, frameHeight: 128, frames: 3, fps: 8, scale: 2.1 },
        attack1: { image: loadImage('../characters/us npc/us npc/drew/Attack_1.png'), frameWidth: 128, frameHeight: 128, frames: 6, fps: 10, scale: 2.1 },
        attack2: { image: loadImage('../characters/us npc/us npc/drew/Attack_2.png'), frameWidth: 128, frameHeight: 128, frames: 6, fps: 10, scale: 2.1 },
        attack3: { image: loadImage('../characters/us npc/us npc/drew/Attack_3.png'), frameWidth: 128, frameHeight: 128, frames: 6, fps: 10, scale: 2.1 },
        dead: { image: loadImage('../characters/us npc/us npc/drew/Dead.png'), frameWidth: 128, frameHeight: 128, frames: 5, fps: 7, scale: 2.1, holdLast: true }
    },
    martin: {
        idle: { image: loadImage('../characters/us npc/us npc/martin/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 5, fps: 8, scale: 2.1 },
        walk: { image: loadImage('../characters/us npc/us npc/martin/Walk.png'), frameWidth: 128, frameHeight: 128, frames: 8, fps: 9, scale: 2.1 },
        run: { image: loadImage('../characters/us npc/us npc/martin/Run.png'), frameWidth: 128, frameHeight: 128, frames: 8, fps: 10, scale: 2.1 },
        jump: { image: loadImage('../characters/us npc/us npc/martin/Jump.png'), frameWidth: 128, frameHeight: 128, frames: 4, fps: 8, scale: 2.1 },
        hurt: { image: loadImage('../characters/us npc/us npc/martin/Hurt.png'), frameWidth: 128, frameHeight: 128, frames: 3, fps: 8, scale: 2.1 },
        protect: { image: loadImage('../characters/us npc/us npc/martin/Protect.png'), frameWidth: 128, frameHeight: 128, frames: 6, fps: 8, scale: 2.1 },
        attack1: { image: loadImage('../characters/us npc/us npc/martin/Attack_1.png'), frameWidth: 128, frameHeight: 128, frames: 6, fps: 10, scale: 2.1 },
        attack2: { image: loadImage('../characters/us npc/us npc/martin/Attack_2.png'), frameWidth: 128, frameHeight: 128, frames: 6, fps: 10, scale: 2.1 },
        attack3: { image: loadImage('../characters/us npc/us npc/martin/Attack_3.png'), frameWidth: 128, frameHeight: 128, frames: 6, fps: 10, scale: 2.1 },
        dead: { image: loadImage('../characters/us npc/us npc/martin/Dead.png'), frameWidth: 128, frameHeight: 128, frames: 5, fps: 7, scale: 2.1, holdLast: true }
    },
    lloyd: {
        idle: { image: loadImage('../characters/us npc/us npc/lloyd/Idle.png'), frameWidth: 128, frameHeight: 128, frames: 14, fps: 8, scale: 2.1 },
        idle2: { image: loadImage('../characters/us npc/us npc/lloyd/Idle_2.png'), frameWidth: 128, frameHeight: 128, frames: 5, fps: 7, scale: 2.1 },
        idle3: { image: loadImage('../characters/us npc/us npc/lloyd/Idle_3.png'), frameWidth: 128, frameHeight: 128, frames: 6, fps: 7, scale: 2.1 },
        dialogue: { image: loadImage('../characters/us npc/us npc/lloyd/Dialogue.png'), frameWidth: 128, frameHeight: 128, frames: 4, fps: 6, scale: 2.1 },
        approval: { image: loadImage('../characters/us npc/us npc/lloyd/Approval.png'), frameWidth: 128, frameHeight: 128, frames: 4, fps: 6, scale: 2.1 }
    }
};

const npcInstances = [
    {
        key: 'drew',
        name: 'Drew',
        x: 1180,
        y: 0,
        width: 70,
        height: 108,
        facingRight: false,
        animationTime: 0,
        animationIndex: 0,
        cycleTime: 0,
        sequence: ['idle'],
        dialogue: 'That portal scares me... it feels like it could drag someone into a place they may never return from.'
    },
    {
        key: 'lloyd',
        name: 'Lloyd',
        x: 1860,
        y: 0,
        width: 70,
        height: 108,
        facingRight: true,
        animationTime: 0,
        animationIndex: 0,
        cycleTime: 0,
        sequence: ['idle'],
        dialogue: 'Do you want to upgrade before you leave?'
    },
    {
        key: 'martin',
        name: 'Martin',
        x: 2580,
        y: 0,
        width: 70,
        height: 108,
        facingRight: false,
        animationTime: 0,
        animationIndex: 0,
        cycleTime: 0,
        sequence: ['idle'],
        dialogue: 'You know that portal will take you somewhere filled with monsters... if you step through it, be ready to fight.'
    }
];

const dimensionalPortal = {
    x: 50,
    groundOffset: 8,
    scale: 6.2,
    frameWidth: 32,
    frameHeight: 32,
    frames: [
        { x: 0, y: 0 },
        { x: 32, y: 0 },
        { x: 64, y: 0 },
        { x: 0, y: 32 },
        { x: 32, y: 32 },
        { x: 64, y: 32 }
    ],
    fps: 9
};

npcInstances.forEach((npc) => {
    npc.y = getGroundLevel() - npc.height;
});

function getObjects() {
    const portalWidth = dimensionalPortal.frameWidth * dimensionalPortal.scale;
    const portalHeight = dimensionalPortal.frameHeight * dimensionalPortal.scale;
    const portalY = getGroundLevel() - portalHeight + dimensionalPortal.groundOffset;

    return [{
        key: 'portal',
        name: 'Dimensional Portal',
        x: dimensionalPortal.x - (portalWidth * 0.5),
        y: portalY,
        width: portalWidth,
        height: portalHeight,
        type: 'portal',
        dialogue: 'The portal hums with a dangerous pull, like it leads somewhere dark and unforgiving.'
    }, ...npcInstances.map((npc) => ({
        key: npc.key,
        name: npc.name,
        x: npc.x,
        y: npc.y,
        width: npc.width,
        height: npc.height,
        type: 'npc',
        dialogue: npc.dialogue
    }))];
}

function updateCamera() {
    const gameWidth = getGameWidth();
    camera.x = Math.max(0, Math.min(player.x - gameWidth * 0.45, WORLD_WIDTH - gameWidth));
    camera.y = 0;
}

function checkPlatformCollision(rect, platform) {
    return rect.x < platform.x + platform.width &&
        rect.x + rect.width > platform.x &&
        rect.y + rect.height <= platform.y + 10 &&
        rect.y + rect.height + rect.velocityYGravity > platform.y;
}

function updatePlayer(deltaFactor) {
    if (player.action) {
        player.action.time += deltaFactor / 60;
        if (player.action.time >= player.action.duration) {
            player.action = null;
        }
    }

    player.velocityX = 0;

    if ((keys.a || keys.arrowleft) && !player.action) {
        player.velocityX = -player.speed * deltaFactor;
        player.facingRight = false;
    }

    if ((keys.d || keys.arrowright) && !player.action) {
        player.velocityX = player.speed * deltaFactor;
        player.facingRight = true;
    }

    player.velocityYGravity += player.gravity * deltaFactor;
    if (player.velocityYGravity > 15 * deltaFactor) {
        player.velocityYGravity = 15 * deltaFactor;
    }

    player.x += player.velocityX;
    player.y += player.velocityYGravity;

    if (player.x < 0) {
        player.x = 0;
    }

    if (player.x + player.width > WORLD_WIDTH) {
        player.x = WORLD_WIDTH - player.width;
    }

    const platforms = getPlatforms();
    platforms.forEach((platform) => {
        if (checkPlatformCollision(player, platform) && player.velocityYGravity > 0) {
            player.y = platform.y - player.height;
            player.velocityYGravity = 0;
            player.jumping = false;
        }
    });

    if (player.y < 0) {
        player.y = 0;
        player.velocityYGravity = 0;
    }

    if (player.action) {
        player.animationState = player.action.name;
    } else if (player.jumping) {
        player.animationState = player.velocityYGravity < 0 ? 'jump' : 'fall';
    } else if (Math.abs(player.velocityX) > 0.2) {
        player.animationState = 'run';
    } else {
        player.animationState = 'idle';
    }
}

function triggerPlayerAction(actionName) {
    const rule = playerActionRules[actionName];
    if (!rule || player.action) {
        return;
    }

    if (rule.manaCost > 0 && player.mana < rule.manaCost) {
        return;
    }

    player.mana = Math.max(0, player.mana - rule.manaCost);
    player.action = {
        name: actionName,
        time: 0,
        duration: rule.duration
    };
}

function updateNPCs(deltaFactor) {
    npcInstances.forEach((npc) => {
        const animationKey = npc.sequence[npc.animationIndex];
        const animation = npcSprites[npc.key]?.[animationKey];
        if (!animation) {
            return;
        }

        const deltaSeconds = deltaFactor / 60;
        const frameCount = animation.frameOrder?.length ?? animation.frames ?? 1;
        const animationDuration = Math.max(frameCount / animation.fps, 0.55);
        const holdTime = animation.holdLast ? 0.35 : 0.18;

        npc.animationTime += deltaSeconds;
        npc.cycleTime += deltaSeconds;

        if (npc.cycleTime >= animationDuration + holdTime) {
            npc.cycleTime = 0;
            npc.animationTime = 0;
            npc.animationIndex = (npc.animationIndex + 1) % npc.sequence.length;
        }
    });
}

function distance(a, b) {
    const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
    const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
}

function checkNearbyInteractions() {
    const interactionRange = 80;
    const objects = getObjects();
    const nearbyEntity = objects.find((obj) => distance(player, obj) < interactionRange);
    const prompt = document.getElementById('interactionPrompt');
    if (prompt) {
        prompt.innerHTML = nearbyEntity
            ? (nearbyEntity.type === 'portal'
                ? `Press <strong>E</strong> to approach <strong>${nearbyEntity.name}</strong>`
                : `Press <strong>E</strong> to talk to <strong>${nearbyEntity.name}</strong>`)
            : 'Press <strong>E</strong> to interact';
        prompt.style.display = nearbyEntity ? 'block' : 'none';
    }

    if (activeDialogueKey && (!nearbyEntity || nearbyEntity.key !== activeDialogueKey)) {
        hideDialogue();
    }
}

function handleInteraction() {
    const interactionRange = 80;
    const objects = getObjects();

    for (const obj of objects) {
        if (distance(player, obj) < interactionRange) {
            if (activeDialogueKey === obj.key) {
                hideDialogue();
            } else {
                if (obj.key === 'portal') {
                    showPortalPrompt(obj.name, obj.key);
                } else if (obj.key === 'lloyd') {
                    showUpgradePrompt(obj.name, obj.key);
                } else {
                    showDialogue(obj.name, obj.dialogue, obj.key);
                }
            }
            return;
        }
    }

    hideDialogue();
}

function drawRepeatedImage(image, x, y, width, height, tileWidth = TILE_SIZE, tileHeight = TILE_SIZE) {
    const columns = Math.ceil(width / tileWidth);
    const rows = Math.ceil(height / tileHeight);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const dx = x + col * tileWidth;
            const dy = y + row * tileHeight;
            const dw = Math.min(tileWidth, x + width - dx);
            const dh = Math.min(tileHeight, y + height - dy);
            ctx.drawImage(image, dx, dy, dw, dh);
        }
    }
}

function drawRepeatedTilesetTile(tile, x, y, width, height, tileWidth = TILE_SIZE, tileHeight = TILE_SIZE) {
    if (!tilesetImage.complete || tilesetImage.naturalWidth <= 0) {
        return;
    }

    const columns = Math.ceil(width / tileWidth);
    const rows = Math.ceil(height / tileHeight);
    const sourceX = tile.col * SOURCE_TILE_SIZE;
    const sourceY = tile.row * SOURCE_TILE_SIZE;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const dx = x + col * tileWidth;
            const dy = y + row * tileHeight;
            const dw = Math.min(tileWidth, x + width - dx);
            const dh = Math.min(tileHeight, y + height - dy);

            ctx.drawImage(
                tilesetImage,
                sourceX,
                sourceY,
                SOURCE_TILE_SIZE,
                SOURCE_TILE_SIZE,
                dx,
                dy,
                dw,
                dh
            );
        }
    }
}

function drawTiledPattern(images, x, y, width, height, tileSize, patternSeed = 0, worldOffsetX = 0) {
    const availableImages = (images ?? []).filter((img) => img && img.complete && img.naturalWidth > 0);
    if (availableImages.length === 0) {
        return false;
    }

    const pad = tileSize * 2;
    const startWorldX = Math.floor((worldOffsetX - pad) / tileSize) * tileSize;
    const endWorldX = worldOffsetX + width + pad;
    const rows = Math.ceil(height / tileSize);

    for (let row = 0; row < rows; row++) {
        const screenY = y + (row * tileSize);
        for (let worldX = startWorldX; worldX < endWorldX; worldX += tileSize) {
            const screenX = Math.round(worldX - worldOffsetX);

            const cellX = Math.floor((worldX + patternSeed) / tileSize);
            const cellY = Math.floor(((row * tileSize) + patternSeed) / tileSize);
            const hash = ((cellX * 73856093) ^ (cellY * 19349663) ^ (Math.floor(patternSeed * 1000) * 83492791)) >>> 0;
            const img = availableImages[hash % availableImages.length];

            // Draw full tiles; letting them overflow slightly avoids edge gaps.
            ctx.drawImage(img, screenX, screenY, tileSize, tileSize);
        }
    }

    return true;
}

function drawRepeatedImagePattern(images, x, y, width, height, tileWidth = TILE_SIZE, tileHeight = TILE_SIZE, patternSeed = 0, worldOffsetX = 0) {
    const availableImages = (images ?? []).filter((img) => img && img.complete && img.naturalWidth > 0);
    if (availableImages.length === 0) {
        return false;
    }

    const startX = Math.floor((x + worldOffsetX) / tileWidth) * tileWidth;
    const startY = Math.floor(y / tileHeight) * tileHeight;
    const endX = x + width;
    const endY = y + height;

    for (let dy = startY; dy < endY; dy += tileHeight) {
        for (let dx = startX; dx < endX; dx += tileWidth) {
            const cellX = Math.floor((dx + patternSeed) / tileWidth);
            const cellY = Math.floor((dy + patternSeed) / tileHeight);
            const hash = ((cellX * 73856093) ^ (cellY * 19349663) ^ (patternSeed * 83492791)) >>> 0;
            const img = availableImages[hash % availableImages.length];

            const screenX = dx - worldOffsetX;
            if (screenX > x + width || screenX + tileWidth < x) {
                continue;
            }

            const drawX = Math.max(x, screenX);
            const drawY = Math.max(y, dy);
            const cropX = drawX - screenX;
            const cropY = drawY - dy;
            const drawW = Math.min(tileWidth - cropX, (x + width) - drawX);
            const drawH = Math.min(tileHeight - cropY, (y + height) - drawY);

            if (drawW <= 0 || drawH <= 0) {
                continue;
            }

            // `tileWidth/tileHeight` are destination sizes. The source images can be smaller (often 16x16),
            // so we must map the crop in destination pixels back into source pixels to avoid invalid drawImage rects.
            const srcW = img.naturalWidth || img.width;
            const srcH = img.naturalHeight || img.height;
            const sx = Math.floor((cropX / tileWidth) * srcW);
            const sy = Math.floor((cropY / tileHeight) * srcH);
            const sw = Math.max(1, Math.ceil((drawW / tileWidth) * srcW));
            const sh = Math.max(1, Math.ceil((drawH / tileHeight) * srcH));
            const safeSW = Math.min(sw, Math.max(1, srcW - sx));
            const safeSH = Math.min(sh, Math.max(1, srcH - sy));

            ctx.drawImage(img, sx, sy, safeSW, safeSH, drawX, drawY, drawW, drawH);
        }
    }

    return true;
}

function stableNoise(value) {
    return Math.abs(Math.sin(value * 12.9898) * 43758.5453) % 1;
}

function drawCloudLayer(gameWidth, gameHeight) {
    const cloudTime = performance.now() * 0.015;
    const clouds = [
        { image: cloudImages[0], worldX: 180, y: 55, width: 190, speed: 0.08, alpha: 0.34, drift: 0.38 },
        { image: cloudImages[1], worldX: 980, y: 100, width: 240, speed: 0.12, alpha: 0.3, drift: 0.48 },
        { image: cloudImages[2], worldX: 1880, y: 70, width: 210, speed: 0.1, alpha: 0.26, drift: 0.34 },
        { image: cloudImages[3], worldX: 2860, y: 120, width: 260, speed: 0.09, alpha: 0.3, drift: 0.42 },
        { image: cloudImages[1], worldX: 4020, y: 80, width: 225, speed: 0.11, alpha: 0.24, drift: 0.3 },
        { image: cloudImages[0], worldX: 5280, y: 130, width: 185, speed: 0.07, alpha: 0.28, drift: 0.28 }
    ];

    clouds.forEach((cloud) => {
        const image = cloud.image;
        if (!image.complete || image.naturalWidth <= 0) {
            return;
        }

        const parallaxX = cloud.worldX + cloudTime * cloud.drift - camera.x * cloud.speed;
        const wrappedX = ((parallaxX % (WORLD_WIDTH + 600)) + (WORLD_WIDTH + 600)) % (WORLD_WIDTH + 600);
        const screenX = wrappedX - 300;
        const drawHeight = (image.naturalHeight / image.naturalWidth) * cloud.width;

        if (screenX > gameWidth + 260 || screenX + cloud.width < -260 || cloud.y > gameHeight * 0.6) {
            return;
        }

        ctx.save();
        ctx.globalAlpha = cloud.alpha;
        ctx.drawImage(image, screenX, cloud.y, cloud.width, drawHeight);
        ctx.globalAlpha = cloud.alpha * 0.35;
        ctx.drawImage(image, screenX, cloud.y, cloud.width, drawHeight);
        ctx.restore();
    });
}

function drawBackground() {
    const gameWidth = getGameWidth();
    const gameHeight = getGameHeight();
    const groundLevel = getGroundLevel();

    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        const scale = gameHeight / backgroundImage.naturalHeight;
        const drawWidth = backgroundImage.naturalWidth * scale;
        const drawHeight = backgroundImage.naturalHeight * scale;
        const drawY = 0;
        const offsetX = (camera.x * 0.25) % drawWidth;
        let startX = -offsetX;

        while (startX < gameWidth) {
            ctx.drawImage(backgroundImage, startX, drawY, drawWidth, drawHeight);
            startX += drawWidth;
        }
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight);
        gradient.addColorStop(0, '#3c6fb6');
        gradient.addColorStop(0.55, '#7aa8d8');
        gradient.addColorStop(1, '#d8eefc');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, gameWidth, gameHeight);

        if (backgroundFailed) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.font = '20px Arial';
            ctx.fillText('background.png failed to load', 24, 36);
        }
    }

    drawCloudLayer(gameWidth, gameHeight);

    const drewGroundFromAssetTiles =
        drawTiledPattern(
            groundFillTileImages,
            0,
            groundLevel + 8,
            gameWidth,
            gameHeight - groundLevel,
            GROUND_TILE_DRAW_SIZE,
            4.2,
            camera.x
        ) &&
        drawTiledPattern(
            groundTopTileImages,
            0,
            groundLevel,
            gameWidth,
            GROUND_TILE_DRAW_SIZE,
            GROUND_TILE_DRAW_SIZE,
            1.6,
            camera.x
        );

    if (drewGroundFromAssetTiles) {
        ctx.fillStyle = 'rgba(20, 34, 24, 0.1)';
        ctx.fillRect(0, groundLevel + GROUND_TILE_DRAW_SIZE, gameWidth, gameHeight - groundLevel - GROUND_TILE_DRAW_SIZE);
    } else if (tilesetImage.complete && tilesetImage.naturalWidth > 0) {
        drawRepeatedTilesetTile(
            groundTiles.fill,
            0,
            groundLevel + 8,
            gameWidth,
            gameHeight - groundLevel,
            GROUND_TILE_DRAW_SIZE,
            GROUND_TILE_DRAW_SIZE
        );
        drawRepeatedTilesetTile(
            groundTiles.top,
            0,
            groundLevel,
            gameWidth,
            GROUND_TILE_DRAW_SIZE,
            GROUND_TILE_DRAW_SIZE,
            GROUND_TILE_DRAW_SIZE
        );

        ctx.fillStyle = 'rgba(20, 34, 24, 0.18)';
        ctx.fillRect(0, groundLevel + GROUND_TILE_DRAW_SIZE, gameWidth, gameHeight - groundLevel - GROUND_TILE_DRAW_SIZE);
    } else {
        ctx.fillStyle = '#5d8f45';
        ctx.fillRect(0, groundLevel, gameWidth, gameHeight - groundLevel);

        ctx.fillStyle = '#8fcf63';
        ctx.fillRect(0, groundLevel, gameWidth, 12);
    }

}

function drawPlatforms() {
    return;
}

function drawObjects() {
    drawDimensionalPortal();

    const objects = getObjects();

    objects.forEach((obj) => {
        if (obj.type === 'npc' || obj.type === 'portal') {
            return;
        }

        const screenX = obj.x - camera.x;
        const screenY = obj.y;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX + obj.width / 2, screenY + obj.height + 5, obj.width / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6c5440';
        ctx.fillRect(screenX, screenY, obj.width, obj.height);
        ctx.strokeStyle = '#2d1810';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, obj.width, obj.height);

        if (obj.icon) {
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.icon, screenX + obj.width / 2, screenY + obj.height / 2);
        }
    });
}

function drawDimensionalPortal() {
    const groundLevel = getGroundLevel();
    const screenX = dimensionalPortal.x - camera.x;
    const time = performance.now() * 0.001;
    const bobOffset = Math.sin(time * 4.5) * 3;
    const pulse = (Math.sin(time * 6.8) + 1) * 0.5;
    const auraScale = 1 + (pulse * 0.14);

    if (dimensionalPortalImage.complete && dimensionalPortalImage.naturalWidth > 0) {
        const frameIndex = Math.floor(time * dimensionalPortal.fps) % dimensionalPortal.frames.length;
        const frame = dimensionalPortal.frames[frameIndex];
        const drawWidth = dimensionalPortal.frameWidth * dimensionalPortal.scale;
        const drawHeight = dimensionalPortal.frameHeight * dimensionalPortal.scale;
        const drawX = Math.round(screenX - (drawWidth * 0.5));
        const drawY = Math.round(groundLevel - drawHeight + dimensionalPortal.groundOffset + bobOffset);

        ctx.save();
        ctx.globalAlpha = 0.24 + (pulse * 0.18);
        ctx.fillStyle = '#0b0318';
        ctx.beginPath();
        ctx.ellipse(screenX, groundLevel + 2, drawWidth * (0.18 + pulse * 0.04), 12 + pulse * 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.16 + (pulse * 0.2);
        ctx.fillStyle = '#6a2cff';
        ctx.beginPath();
        ctx.ellipse(screenX, drawY + drawHeight * 0.52, drawWidth * 0.28 * auraScale, drawHeight * 0.34 * auraScale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.12 + (pulse * 0.16);
        ctx.strokeStyle = '#b176ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(screenX, drawY + drawHeight * 0.52, drawWidth * 0.22 * auraScale, drawHeight * 0.28 * auraScale, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 0.92 + (pulse * 0.08);
        ctx.drawImage(
            dimensionalPortalImage,
            frame.x,
            frame.y,
            dimensionalPortal.frameWidth,
            dimensionalPortal.frameHeight,
            drawX,
            drawY,
            Math.round(drawWidth),
            Math.round(drawHeight)
        );
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.globalAlpha = 0.45 + (pulse * 0.18);
    ctx.fillStyle = 'rgba(97, 37, 181, 0.45)';
    ctx.beginPath();
    ctx.ellipse(screenX, groundLevel - 34 + bobOffset, 26 * auraScale, 42 * auraScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(178, 111, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
}

function drawLobbyScenery(layer) {
    const groundLevel = getGroundLevel();
    const gameWidth = getGameWidth();
    const time = performance.now() * 0.001;

    lobbyScenery.forEach((prop) => {
        if (prop.layer !== layer) {
            return;
        }

        const image = prop.image;
        if (!image || !image.complete || image.naturalWidth <= 0) {
            return;
        }

        const drawWidth = image.naturalWidth * prop.scale;
        const drawHeight = image.naturalHeight * prop.scale;
        const drawX = Math.round(prop.x - camera.x - (drawWidth * 0.5));
        const drawY = Math.round(groundLevel - drawHeight + (prop.sink ?? 0));

        if (drawX > gameWidth + 220 || drawX + drawWidth < -220) {
            return;
        }

        const glow = prop.glow;
        const pulseSeed = stableNoise(prop.x * 0.019);
        const pulse = glow
            ? 0.82 + (((Math.sin((time * glow.pulse) + (pulseSeed * Math.PI * 2)) + 1) * 0.5) * 0.35)
            : 1;

        ctx.save();
        ctx.globalAlpha = prop.shadowAlpha ?? (layer === 'back' ? 0.18 : 0.22);
        ctx.fillStyle = '#05070f';
        ctx.beginPath();
        ctx.ellipse(
            prop.x - camera.x,
            groundLevel + 4,
            drawWidth * (prop.shadowScale ?? (layer === 'back' ? 0.34 : 0.28)),
            layer === 'back' ? 12 : 9,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        if (glow) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = glow.fill;
            ctx.beginPath();
            ctx.ellipse(
                prop.x - camera.x,
                drawY + drawHeight * 0.56,
                drawWidth * glow.spread * pulse,
                drawHeight * 0.44 * pulse,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.fillStyle = glow.rim;
            ctx.beginPath();
            ctx.ellipse(
                prop.x - camera.x,
                groundLevel + 2,
                drawWidth * 0.24 * pulse,
                12 * pulse,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = prop.alpha ?? (layer === 'back' ? 0.92 : 0.98);
        ctx.drawImage(image, drawX, drawY, Math.round(drawWidth), Math.round(drawHeight));
        ctx.restore();
    });
}

function drawBuildings() {
    const gameWidth = getGameWidth();
    const gameHeight = getGameHeight();
    const groundLevel = getGroundLevel();

    const caveGlow = ctx.createLinearGradient(0, groundLevel - 170, 0, gameHeight);
    caveGlow.addColorStop(0, 'rgba(18, 24, 54, 0)');
    caveGlow.addColorStop(0.6, 'rgba(14, 18, 34, 0.08)');
    caveGlow.addColorStop(1, 'rgba(5, 7, 14, 0.24)');
    ctx.fillStyle = caveGlow;
    ctx.fillRect(0, groundLevel - 170, gameWidth, gameHeight - groundLevel + 170);

    drawLobbyScenery('back');
    drawLobbyScenery('front');
}

function drawNPCs() {
    npcInstances.forEach((npc) => {
        const animation = npcSprites[npc.key][npc.sequence[npc.animationIndex]];
        drawAnimatedSprite(animation, npc.x + (npc.width / 2), npc.y + npc.height, npc.facingRight, npc.animationTime, 0.24);
    });
}

function drawPlayer() {
    const animation = hallokinAnimations[player.animationState] ?? hallokinAnimations.idle;
    const animationTime = player.action ? player.action.time : performance.now() / 1000;
    drawAnimatedSprite(animation, player.x + (player.width / 2), player.y + player.height, player.facingRight, animationTime, 0.2);
}

function mixPalette(level, start, end) {
    return [
        Math.round(start[0] + ((end[0] - start[0]) * level)),
        Math.round(start[1] + ((end[1] - start[1]) * level)),
        Math.round(start[2] + ((end[2] - start[2]) * level))
    ];
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function createHallokinShadowFrame(image, sourceX, sourceY, sourceWidth, sourceHeight) {
    const cacheKey = [image.src, sourceX, sourceY, sourceWidth, sourceHeight, 'hallokinShadowHero'].join('|');
    if (effectFrameCache.has(cacheKey)) {
        return effectFrameCache.get(cacheKey);
    }

    effectCanvas.width = sourceWidth;
    effectCanvas.height = sourceHeight;
    effectCtx.clearRect(0, 0, sourceWidth, sourceHeight);
    effectCtx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

    const imageData = effectCtx.getImageData(0, 0, sourceWidth, sourceHeight);
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) {
            continue;
        }

        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const maxChannel = Math.max(red, green, blue);
        const minChannel = Math.min(red, green, blue);
        const saturation = maxChannel - minChannel;
        const luminance = (red * 0.299) + (green * 0.587) + (blue * 0.114);
        const isFaceLight = luminance > 128 && red >= green && green >= blue && saturation < 78;
        const isWarmSlash = red >= 110 && red > (green + 12) && green >= 45 && blue <= 145 && saturation >= 22;
        let mapped;

        if (isFaceLight) {
            mapped = mixPalette(clamp((luminance - 128) / 100, 0, 1), HALL0KIN_HERO_PALETTE.glow, HALL0KIN_HERO_PALETTE.face);
        } else if (isWarmSlash) {
            mapped = mixPalette(clamp((luminance - 72) / 128, 0, 1), HALL0KIN_HERO_PALETTE.deep, HALL0KIN_HERO_PALETTE.glow);
        } else if (luminance > 120) {
            mapped = mixPalette(clamp((luminance - 120) / 90, 0, 1), HALL0KIN_HERO_PALETTE.core, HALL0KIN_HERO_PALETTE.glow);
        } else if (luminance > 70) {
            mapped = mixPalette(clamp((luminance - 70) / 50, 0, 1), HALL0KIN_HERO_PALETTE.deep, HALL0KIN_HERO_PALETTE.edge);
        } else if (luminance > 26) {
            mapped = mixPalette(clamp((luminance - 26) / 44, 0, 1), HALL0KIN_HERO_PALETTE.abyss, HALL0KIN_HERO_PALETTE.core);
        } else {
            mapped = HALL0KIN_HERO_PALETTE.abyss;
        }

        data[i] = mapped[0];
        data[i + 1] = mapped[1];
        data[i + 2] = mapped[2];
    }

    effectCtx.putImageData(imageData, 0, 0);

    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = sourceWidth;
    frameCanvas.height = sourceHeight;
    const frameCtx = frameCanvas.getContext('2d');
    frameCtx.imageSmoothingEnabled = false;
    frameCtx.drawImage(effectCanvas, 0, 0);
    effectFrameCache.set(cacheKey, frameCanvas);
    return frameCanvas;
}

function drawAnimatedSprite(animation, worldCenterX, worldFootY, facingRight, timeSeconds, shadowScale = 0.18) {
    if (!animation || !animation.image.complete || animation.image.naturalWidth <= 0) {
        return;
    }

    const frames = animation.frameOrder ?? Array.from({ length: animation.frames }, (_, index) => index);
    const frameBase = Math.floor(timeSeconds * animation.fps);
    const frameIndex = animation.holdLast ? Math.min(frameBase, frames.length - 1) : (frameBase % frames.length);
    const sourceFrame = frames[frameIndex];
    const trim = animation.trim;
    let sourceX = sourceFrame * animation.frameWidth;
    let sourceY = 0;
    let sourceWidth = animation.frameWidth;
    let sourceHeight = animation.frameHeight;
    let drawWidth = animation.frameWidth * animation.scale;
    let drawHeight = animation.frameHeight * animation.scale;
    const screenX = worldCenterX - camera.x;
    let drawY = worldFootY - drawHeight;

    if (trim) {
        sourceX += trim.x;
        sourceY = trim.y;
        sourceWidth = trim.width;
        sourceHeight = trim.height;
        drawWidth = trim.width * animation.scale;
        drawHeight = trim.height * animation.scale;
        drawY = animation.anchorY != null
            ? worldFootY - (animation.anchorY * animation.scale)
            : worldFootY - drawHeight + (animation.groundOffset ?? 0);
    }

    const renderImage = animation.effect === 'hallokinShadowHero'
        ? createHallokinShadowFrame(animation.image, sourceX, sourceY, sourceWidth, sourceHeight)
        : animation.image;
    const anchorX = (animation.anchorX ?? ((trim?.width ?? animation.frameWidth) * 0.5)) * animation.scale;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(screenX, worldFootY - 4, drawWidth * shadowScale, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(Math.round(screenX), Math.round(drawY));
    ctx.scale(facingRight ? 1 : -1, 1);
    ctx.drawImage(
        renderImage,
        animation.effect === 'hallokinShadowHero' ? 0 : sourceX,
        animation.effect === 'hallokinShadowHero' ? 0 : sourceY,
        sourceWidth,
        sourceHeight,
        Math.round(facingRight ? -anchorX : -(drawWidth - anchorX)),
        0,
        Math.round(drawWidth),
        Math.round(drawHeight)
    );
    ctx.restore();
}

function showDialogue(name, text, key) {
    const dialogueBox = document.getElementById('dialogueBox');
    const dialogueName = document.getElementById('dialogueName');
    const dialogueText = document.getElementById('dialogueText');
    const dialogueActions = document.getElementById('dialogueActions');
    if (!dialogueBox || !dialogueName || !dialogueText) {
        return;
    }

    dialogueName.textContent = name;
    dialogueText.textContent = text;
    if (dialogueActions) {
        dialogueActions.style.display = 'none';
    }
    dialogueBox.style.display = 'block';
    activeDialogueKey = key;
    activeDialogueMode = 'text';
}

function showUpgradePrompt(name, key) {
    const dialogueBox = document.getElementById('dialogueBox');
    const dialogueName = document.getElementById('dialogueName');
    const dialogueText = document.getElementById('dialogueText');
    const dialogueActions = document.getElementById('dialogueActions');
    if (!dialogueBox || !dialogueName || !dialogueText || !dialogueActions) {
        return;
    }

    dialogueName.textContent = name;
    dialogueText.textContent = 'Do you want to open your upgrade stats before you leave?';
    dialogueActions.style.display = 'flex';
    dialogueBox.style.display = 'block';
    activeDialogueKey = key;
    activeDialogueMode = 'upgrade';
}

function showPortalPrompt(name, key) {
    const dialogueBox = document.getElementById('dialogueBox');
    const dialogueName = document.getElementById('dialogueName');
    const dialogueText = document.getElementById('dialogueText');
    const dialogueActions = document.getElementById('dialogueActions');
    const dialogueYes = document.getElementById('dialogueYes');
    const dialogueNo = document.getElementById('dialogueNo');
    if (!dialogueBox || !dialogueName || !dialogueText || !dialogueActions) {
        return;
    }

    dialogueName.textContent = name;
    if (getTotalWins() >= 3) {
        dialogueText.textContent = 'The portal shakes with a final, violent pull. Beyond it waits the deepest darkness yet. Are you sure you want to step through?';
    } else {
        dialogueText.textContent = 'The portal feels unstable, like it leads somewhere dangerous. Are you sure you want to step through?';
    }
    if (dialogueYes) {
        dialogueYes.textContent = 'Yes';
    }
    if (dialogueNo) {
        dialogueNo.textContent = 'No';
    }
    dialogueActions.style.display = 'flex';
    dialogueBox.style.display = 'block';
    activeDialogueKey = key;
    activeDialogueMode = 'portal';
}

function hideDialogue() {
    const dialogueBox = document.getElementById('dialogueBox');
    const dialogueActions = document.getElementById('dialogueActions');
    if (dialogueBox) {
        dialogueBox.style.display = 'none';
    }
    if (dialogueActions) {
        dialogueActions.style.display = 'none';
    }
    activeDialogueKey = null;
    activeDialogueMode = 'text';
}

function openStatsPanel() {
    const statsPanel = document.getElementById('statsPanel');
    if (!statsPanel) {
        return;
    }

    hideDialogue();
    statsPanel.style.display = 'block';
    refreshStatsPanel();
}

function hideStatsPanel() {
    const statsPanel = document.getElementById('statsPanel');
    if (statsPanel) {
        statsPanel.style.display = 'none';
    }
}

function refreshStatsPanel() {
    const statLabels = {
        health: 'statValueHealth',
        mana: 'statValueMana',
        voidCyclone: 'statValueVoidCyclone',
        shadowStrike: 'statValueShadowStrike'
    };

    Object.entries(statLabels).forEach(([key, id]) => {
        const valueNode = document.getElementById(id);
        if (valueNode) {
            valueNode.textContent = `Lv. ${player.stats[key]} / ${MAX_STAT_LEVEL}`;
        }
    });

    const availablePoints = document.getElementById('availablePoints');
    if (availablePoints) {
        availablePoints.textContent = player.availableStatPoints;
    }

    document.querySelectorAll('.stat-add').forEach((button) => {
        const statKey = button.dataset.stat;
        const statValue = player.stats[statKey] ?? 0;
        button.disabled = player.availableStatPoints <= 0 || statValue >= MAX_STAT_LEVEL;
    });

    const resetButton = document.getElementById('statsReset');
    if (resetButton) {
        resetButton.disabled = getSpentStatPoints() <= 0 || isSavingStats;
    }
}

function getSpentStatPoints() {
    return Object.values(player.stats).reduce((sum, value) => sum + value, 0);
}

function applyDerivedStats() {
    player.maxHealth = 100 + (player.stats.health * 2);
    player.health = Math.min(player.health, player.maxHealth);
    if (player.health <= 0) {
        player.health = player.maxHealth;
    }

    player.maxMana = 100 + (player.stats.mana * 2);
    player.mana = Math.min(player.mana, player.maxMana);
    if (player.mana <= 0) {
        player.mana = player.maxMana;
    }
}

async function upgradeStat(statKey) {
    if (!Object.prototype.hasOwnProperty.call(player.stats, statKey)) {
        return;
    }

    if (!currentUser || !progressApi || isSavingStats) {
        return;
    }

    if (player.availableStatPoints <= 0 || player.stats[statKey] >= MAX_STAT_LEVEL) {
        return;
    }

    isSavingStats = true;
    player.stats[statKey] += 1;
    player.availableStatPoints -= 1;
    applyDerivedStats();
    refreshStatsPanel();
    updateHUD();

    try {
        await progressApi.saveUserProfile(currentUser.uid, {
            level: player.level,
            availablePoints: player.availableStatPoints,
            stats: player.stats
        }, currentUser);
    } finally {
        isSavingStats = false;
        refreshStatsPanel();
    }
}

async function resetStats() {
    if (!currentUser || !progressApi || isSavingStats) {
        return;
    }

    const spentPoints = getSpentStatPoints();
    if (spentPoints <= 0) {
        return;
    }

    isSavingStats = true;
    player.availableStatPoints += spentPoints;
    player.stats = {
        health: 0,
        mana: 0,
        voidCyclone: 0,
        shadowStrike: 0
    };
    applyDerivedStats();
    refreshStatsPanel();
    updateHUD();

    try {
        await progressApi.saveUserProfile(currentUser.uid, {
            level: player.level,
            availablePoints: player.availableStatPoints,
            stats: player.stats
        }, currentUser);
    } finally {
        isSavingStats = false;
        refreshStatsPanel();
    }
}

function updateHUD() {
    const playerLevel = document.getElementById('playerLevel');
    const playerHealth = document.getElementById('playerHealth');
    const playerMana = document.getElementById('playerMana');

    if (playerLevel) {
        playerLevel.textContent = player.level;
    }

    if (playerHealth) {
        playerHealth.textContent = player.health;
    }

    if (playerMana) {
        playerMana.textContent = player.mana;
    }
}

function applyProfileToPlayer(profile) {
    const normalizedProfile = progressApi.normalizeProfile(profile, currentUser);
    currentProfile = normalizedProfile;
    player.level = normalizedProfile.level;
    player.availableStatPoints = normalizedProfile.availablePoints;
    player.stats = {
        health: normalizedProfile.stats.health,
        mana: normalizedProfile.stats.mana,
        voidCyclone: normalizedProfile.stats.voidCyclone,
        shadowStrike: normalizedProfile.stats.shadowStrike
    };
    applyDerivedStats();
    player.health = player.maxHealth;
    player.mana = player.maxMana;
    refreshStatsPanel();
    updateHUD();
}

function getTotalWins() {
    return Math.max(0, Number(currentProfile?.stageProgress?.totalWins) || 0);
}

function getNextStagePath() {
    const totalWins = getTotalWins();

    if (totalWins >= 3) {
        return '../stage4.html';
    }

    if (totalWins === 2) {
        return '../stage3.html';
    }

    if (totalWins === 1) {
        return '../stage2.html';
    }

    return '../stage1.html';
}

function buildLoadingUrl(target, options = {}) {
    const loadingUrl = new URL('../loading.html', window.location.href);
    loadingUrl.searchParams.set('target', target);
    if (options.title) {
        loadingUrl.searchParams.set('title', options.title);
    }
    if (options.copy) {
        loadingUrl.searchParams.set('copy', options.copy);
    }
    if (options.kicker) {
        loadingUrl.searchParams.set('kicker', options.kicker);
    }
    return loadingUrl.toString();
}

function showLobbyBanner(title, text) {
    const banner = document.getElementById('lobbyBanner');
    const bannerTitle = document.getElementById('lobbyBannerTitle');
    const bannerText = document.getElementById('lobbyBannerText');
    if (!banner || !bannerTitle || !bannerText) {
        return;
    }

    bannerTitle.textContent = title;
    bannerText.textContent = text;
    banner.style.display = 'block';
    window.clearTimeout(showLobbyBanner.timeoutId);
    showLobbyBanner.timeoutId = window.setTimeout(() => {
        banner.style.display = 'none';
    }, 4200);
}

async function bootstrapAccountState() {
    progressApi = await import('../js/gameProgress.js');
    currentUser = await progressApi.requireAuthenticatedUser('../login.html');
    let profile;
    try {
        profile = await progressApi.getUserProfile(currentUser.uid, currentUser);
    } catch (error) {
        console.warn('Falling back to a local profile because Firestore could not be loaded:', error);
        profile = progressApi.normalizeProfile({}, currentUser);
    }
    applyProfileToPlayer(profile);

    if (profile.pendingAnnouncement?.message) {
        showLobbyBanner(`Level ${profile.level}`, profile.pendingAnnouncement.message);
        progressApi.clearLobbyAnnouncement(currentUser.uid).catch((error) => {
            console.warn('Failed to clear lobby announcement:', error);
        });
    }
}

function gameLoop(currentTime) {
    const deltaFactor = Math.min((currentTime - lastFrameTime) / 16.67, 1.5);
    lastFrameTime = currentTime;

    if (!paused) {
        updatePlayer(deltaFactor);
        updateNPCs(deltaFactor);
        updateCamera();
        checkNearbyInteractions();
        updateHUD();
    }

    drawBackground();
    drawPlatforms();
    drawBuildings();
    drawObjects();
    drawNPCs();
    drawPlayer();

    requestAnimationFrame(gameLoop);
}

function exitGame() {
    console.log('Thanks for playing The Dark Odyssey!');
}

syncPauseVolume();

bootstrapAccountState()
    .catch((error) => {
        console.error('Failed to bootstrap lobby account state:', error);
        if (!currentUser) {
            window.location.href = '../login.html';
        }
    })
    .finally(() => {
        requestAnimationFrame(gameLoop);
    });

const darkOdysseyAudio = window.createDarkOdysseyAudioManager ? window.createDarkOdysseyAudioManager({ scene: "lobby" }) : null;
if (darkOdysseyAudio) {
  pauseVolume = darkOdysseyAudio.getVolume();
}

async function ensureDarkOdysseyAudioUnlocked() {
  if (!darkOdysseyAudio) {
    return;
  }

  try {
    await darkOdysseyAudio.unlock();
  } catch (error) {
    // Ignore audio unlock errors.
  }
}

const originalDarkOdysseySyncPauseVolume = syncPauseVolume;
syncPauseVolume = function patchedDarkOdysseySyncPauseVolume(...args) {
  const result = originalDarkOdysseySyncPauseVolume.apply(this, args);
  if (darkOdysseyAudio) {
    darkOdysseyAudio.setMasterVolume(pauseVolume);
  }
  return result;
};

const originalDarkOdysseyTriggerPlayerAction = triggerPlayerAction;
triggerPlayerAction = function patchedDarkOdysseyTriggerPlayerAction(actionName) {
  if (darkOdysseyAudio) {
    ensureDarkOdysseyAudioUnlocked();
  }

  const hadAction = Boolean(player.action);
  const result = originalDarkOdysseyTriggerPlayerAction(actionName);
  if (!hadAction && player.action && darkOdysseyAudio) {
    darkOdysseyAudio.playAbility(actionName);
  }
  return result;
};

const originalDarkOdysseyHandleInteraction = handleInteraction;
handleInteraction = function patchedDarkOdysseyHandleInteraction(...args) {
  if (darkOdysseyAudio) {
    ensureDarkOdysseyAudioUnlocked();
  }

  const previousDialogueKey = activeDialogueKey;
  const result = originalDarkOdysseyHandleInteraction.apply(this, args);
  if (darkOdysseyAudio && (activeDialogueKey || previousDialogueKey)) {
    if (activeDialogueKey === "portal" || previousDialogueKey === "portal") {
      darkOdysseyAudio.playPortal();
    } else {
      darkOdysseyAudio.playInteraction();
    }
  }
  return result;
};

window.addEventListener("pointerdown", () => {
  ensureDarkOdysseyAudioUnlocked();
}, true);

window.addEventListener("keydown", (event) => {
  if (!darkOdysseyAudio || event.repeat) {
    return;
  }

  ensureDarkOdysseyAudioUnlocked();

  if (event.code === "Escape") {
    darkOdysseyAudio.playUiClick("soft");
    return;
  }

  if (paused) {
    return;
  }

  if (["Space", "KeyW", "ArrowUp"].includes(event.code) && !player.jumping) {
    darkOdysseyAudio.playJump();
  }
}, true);

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || !darkOdysseyAudio) {
    return;
  }

  ensureDarkOdysseyAudioUnlocked();

  if (button.id === "dialogueYes" && activeDialogueKey === "portal") {
    darkOdysseyAudio.playPortal();
    return;
  }

  darkOdysseyAudio.playUiClick(button.id.includes("back") || button.id.includes("cancel") || button.id.includes("close") ? "soft" : "default");
}, true);

syncPauseVolume();
