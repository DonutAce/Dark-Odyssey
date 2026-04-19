const canvas = document.getElementById("stage3-canvas");
const ctx = canvas.getContext("2d");
const zoneName = document.getElementById("zone-name");
const distanceValue = document.getElementById("distance-value");
const objectiveText = document.getElementById("objective-text");
const bossState = document.getElementById("boss-state");
const progressFill = document.getElementById("progress-fill");
const lifeValue = document.getElementById("life-value");
const lifeFill = document.getElementById("life-fill");
const energyValue = document.getElementById("energy-value");
const energyFill = document.getElementById("energy-fill");
const cooldownValue = document.getElementById("cooldown-value");
const difficultyLabel = document.getElementById("difficulty-label");
const difficultySelect = document.getElementById("difficulty-select");
const loadingScreen = document.getElementById("loading-screen");
const touchButtons = [...document.querySelectorAll("[data-input]")];
const pauseButton = document.getElementById("pause-button");
const pauseOverlay = document.getElementById("pause-overlay");
const bossDialogueOverlay = document.getElementById("boss-dialogue-overlay");
const bossDialogueSpeaker = document.getElementById("boss-dialogue-speaker");
const bossDialogueText = document.getElementById("boss-dialogue-text");
const bossHud = document.getElementById("boss-hud");
const bossHudFill = document.getElementById("boss-hud-fill");
const bossHudName = document.getElementById("boss-hud-name");
const pauseMain = document.getElementById("pause-main");
const pausePlayButton = document.getElementById("pause-play");
const pauseSettingsButton = document.getElementById("pause-settings");
const pauseExitButton = document.getElementById("pause-exit");
const pauseSettingsPanel = document.getElementById("pause-settings-panel");
const pauseSettingsBackButton = document.getElementById("pause-settings-back");
const pauseExitPanel = document.getElementById("pause-exit-panel");
const pauseExitConfirmButton = document.getElementById("pause-exit-confirm");
const pauseExitCancelButton = document.getElementById("pause-exit-cancel");
const volumeKnob = document.getElementById("volume-knob");
const volumeKnobIndicator = document.getElementById("volume-knob-indicator");
const volumeLabel = document.getElementById("volume-label");
const skillButtonQ = document.getElementById("skill-button-q");
const skillButtonE = document.getElementById("skill-button-e");
const skillCooldownQ = document.getElementById("skill-cooldown-q");
const skillCooldownE = document.getElementById("skill-cooldown-e");

ctx.imageSmoothingEnabled = false;

const VIEW = {
  width: canvas.width,
  height: canvas.height
};

const TILE = 32;
const WORLD = {
  width: 9600,
  floorY: 692,
  gravity: 2400
};

const ARENA = {
  start: 7520,
  end: WORLD.width - 160
};

const SECTION_DATA = [
  {
    label: "Container Yard",
    start: 0,
    end: 2600,
    objective: "Move through the first cargo yard and clear the opening patrol lane.",
    checkpoint: { x: 240, y: WORLD.floorY }
  },
  {
    label: "Crane Passage",
    start: 2600,
    end: 5080,
    objective: "Advance under the heavy cranes and across the wider dock floor.",
    checkpoint: { x: 2860, y: WORLD.floorY }
  },
  {
    label: "Harbor Spine",
    start: 5080,
    end: ARENA.start,
    objective: "Cross the stacked container lanes and push toward the final wharf.",
    checkpoint: { x: 5480, y: WORLD.floorY }
  },
  {
    label: "Boss Wharf",
    start: ARENA.start,
    end: WORLD.width,
    objective: "Final arena. The dock opens into a broad wharf built for the boss fight.",
    checkpoint: { x: ARENA.start + 120, y: WORLD.floorY }
  }
];

const basePlatforms = [
  { x: 0, y: WORLD.floorY, width: 2740, height: 128, style: "main" },
  { x: 2960, y: WORLD.floorY, width: 2380, height: 128, style: "main" },
  { x: 5560, y: WORLD.floorY, width: 1540, height: 128, style: "main" },
  { x: 7260, y: WORLD.floorY, width: 260, height: 128, style: "main" },
  { x: ARENA.start, y: WORLD.floorY, width: WORLD.width - ARENA.start, height: 160, style: "arena" }
];

const catwalkPlatforms = [
  { x: 960, y: 564, width: 512, height: 64, style: "catwalk", supportEvery: 160 },
  { x: 3440, y: 540, width: 640, height: 64, style: "catwalk", supportEvery: 176 },
  { x: 6120, y: 548, width: 576, height: 64, style: "catwalk", supportEvery: 176 },
  { x: 8040, y: 588, width: 1040, height: 64, style: "arena" }
];

const platforms = [...basePlatforms, ...catwalkPlatforms.filter((platform) => platform.style === "arena")]
  .sort((a, b) => a.y - b.y);

const gaps = [
  { x: 2740, width: 220, waterY: WORLD.floorY + 32, depth: 186 },
  { x: 5340, width: 220, waterY: WORLD.floorY + 32, depth: 186 },
  { x: 7100, width: 160, waterY: WORLD.floorY + 32, depth: 186 }
];

const craneProps = [
  { x: 1820, y: WORLD.floorY, scale: 2.22 },
  { x: 4420, y: WORLD.floorY, scale: 2.22 },
  { x: 8900, y: WORLD.floorY, scale: 2.34 }
];

const cargoProps = [
  { x: 286, y: WORLD.floorY, variant: 0, scale: 2.95 },
  { x: 318, y: WORLD.floorY - 142, variant: 1, scale: 2.95 },
  { x: 520, y: WORLD.floorY, variant: 4, scale: 2.7 },
  { x: 840, y: WORLD.floorY, variant: 0, scale: 2.95 },
  { x: 840, y: WORLD.floorY - 142, variant: 3, scale: 2.95 },
  { x: 1120, y: WORLD.floorY, variant: 1, scale: 2.95 },
  { x: 1450, y: WORLD.floorY, variant: 3, scale: 2.95 },
  { x: 1730, y: WORLD.floorY, variant: 4, scale: 2.78 },
  { x: 2005, y: WORLD.floorY, variant: 0, scale: 2.95 },
  { x: 2005, y: WORLD.floorY - 142, variant: 1, scale: 2.95 },
  { x: 3320, y: WORLD.floorY, variant: 3, scale: 2.95 },
  { x: 3320, y: WORLD.floorY - 142, variant: 0, scale: 2.95 },
  { x: 3600, y: WORLD.floorY, variant: 1, scale: 2.95 },
  { x: 3930, y: WORLD.floorY, variant: 4, scale: 2.75 },
  { x: 4230, y: WORLD.floorY, variant: 0, scale: 2.95 },
  { x: 4510, y: WORLD.floorY, variant: 3, scale: 2.95 },
  { x: 4510, y: WORLD.floorY - 142, variant: 1, scale: 2.95 },
  { x: 4860, y: WORLD.floorY, variant: 4, scale: 2.68 },
  { x: 5840, y: WORLD.floorY, variant: 3, scale: 2.95 },
  { x: 5840, y: WORLD.floorY - 142, variant: 0, scale: 2.95 },
  { x: 6160, y: WORLD.floorY, variant: 1, scale: 2.95 },
  { x: 6500, y: WORLD.floorY, variant: 4, scale: 2.76 },
  { x: 6800, y: WORLD.floorY, variant: 0, scale: 2.95 },
  { x: 7840, y: WORLD.floorY, variant: 3, scale: 2.95 },
  { x: 8120, y: WORLD.floorY, variant: 0, scale: 2.95 },
  { x: 8120, y: WORLD.floorY - 142, variant: 1, scale: 2.95 },
  { x: 8420, y: WORLD.floorY, variant: 4, scale: 2.72 },
  { x: 8750, y: WORLD.floorY, variant: 0, scale: 2.95 },
  { x: 8750, y: WORLD.floorY - 142, variant: 3, scale: 2.95 },
  { x: 9050, y: WORLD.floorY, variant: 1, scale: 2.95 }
];

const boxProps = [
  { x: 108, y: WORLD.floorY, variant: 0, scale: 4 },
  { x: 1230, y: WORLD.floorY, variant: 3, scale: 4.1 },
  { x: 2790, y: WORLD.floorY, variant: 1, scale: 4.1 },
  { x: 5440, y: WORLD.floorY, variant: 5, scale: 4.1 },
  { x: 7378, y: WORLD.floorY, variant: 2, scale: 4.1 },
  { x: 9300, y: WORLD.floorY, variant: 4, scale: 4.1 }
];

const fenceRuns = [
  { startX: 24, y: WORLD.floorY, count: 3, scale: 2.7, front: true },
  { startX: 1290, y: WORLD.floorY, count: 2, scale: 2.7, front: true },
  { startX: 2720, y: WORLD.floorY, count: 3, scale: 2.7, front: true },
  { startX: 5320, y: WORLD.floorY, count: 3, scale: 2.7, front: true },
  { startX: 7130, y: WORLD.floorY, count: 2, scale: 2.7, front: true },
  { startX: ARENA.start + 48, y: WORLD.floorY, count: 8, scale: 2.7, front: true }
];

const bossGateLights = [
  { x: ARENA.start + 32, y: 212, phase: 0.1 },
  { x: ARENA.start + 32, y: 302, phase: 0.42 },
  { x: WORLD.width - 170, y: 212, phase: 0.7 },
  { x: WORLD.width - 170, y: 302, phase: 0.95 }
];

const controls = {
  left: false,
  right: false
};

let jumpQueued = false;
let currentCheckpoint = SECTION_DATA[0].checkpoint;
let lastTime = 0;
let gameReady = false;
let paused = false;
let pauseVolume = 1;
let knobDragging = false;
let renderTimeSeconds = 0;
const firstSpawn = { ...SECTION_DATA[0].checkpoint };

const camera = {
  x: 0
};

const hero = {
  x: 80,
  y: WORLD.floorY,
  vx: 0,
  vy: 0,
  width: 56,
  height: 142,
  speed: 430,
  jumpSpeed: 980,
  onGround: true,
  facing: 1,
  animation: "idle",
  action: null,
  hurtTimer: 0,
  invulnerableTimer: 0,
  maxLife: 100,
  life: 100,
  maxEnergy: 100,
  energy: 100,
  respawnWalkActive: true
};

const HERO_ACTION_RULES = {
  attack: { cooldown: 0.4, energyCost: 10, damage: 18, range: 132, verticalRange: 110, hitTime: 0.16 },
  special: { cooldown: 5, energyCost: 25, damage: 34, range: 212, verticalRange: 182, hitTime: 0.32 },
  dash: { cooldown: 5, energyCost: 25, damage: 28, range: 228, verticalRange: 196, hitTime: 0.2 }
};
let heroEnergyRegenPerSecond = 18;

const heroCooldowns = {
  attack: 0,
  special: 0,
  dash: 0
};

let progressApi = null;
let currentStageUser = null;
let currentStageProfile = null;
let stageRewardPromise = null;

const DIFFICULTY_PRESETS = {
  easy: { label: "Easy", heroDamage: 1.25, mobLife: 0.55, mobDamage: 0.65, bossSpeed: 0.72 },
  medium: { label: "Medium", heroDamage: 1, mobLife: 1, mobDamage: 1, bossSpeed: 1 },
  hard: { label: "Hard", heroDamage: 0.85, mobLife: 2.1, mobDamage: 1.6, bossSpeed: 1.3 }
};

let currentDifficulty = "medium";

const mobTemplates = {
  zombie: {
    walk: {
      type: "sheet",
      key: "zombieWalk",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3, 4, 5, 6, 7],
      fps: 8,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    },
    attack: {
      type: "sheet",
      key: "zombieAttack",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 10,
      scale: 1.72,
      anchor: { x: 48, y: 92 },
      hitFrame: 2
    },
    hurt: {
      type: "sheet",
      key: "zombieHurt",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2],
      fps: 10,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    },
    death: {
      type: "sheet",
      key: "zombieDeath",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 8,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    }
  },
  zombieWoman: {
    walk: {
      type: "sheet",
      key: "zombieWomanWalk",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3, 4, 5, 6],
      fps: 8,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    },
    attack: {
      type: "sheet",
      key: "zombieWomanAttack",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3],
      fps: 10,
      scale: 1.72,
      anchor: { x: 48, y: 92 },
      hitFrame: 2
    },
    hurt: {
      type: "sheet",
      key: "zombieWomanHurt",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2],
      fps: 10,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    },
    death: {
      type: "sheet",
      key: "zombieWomanDeath",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 8,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    }
  },
  wildZombie: {
    walk: {
      type: "sheet",
      key: "wildZombieWalk",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      fps: 9,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    },
    attack: {
      type: "sheet",
      key: "wildZombieAttack",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3],
      fps: 10,
      scale: 1.72,
      anchor: { x: 48, y: 92 },
      hitFrame: 2
    },
    hurt: {
      type: "sheet",
      key: "wildZombieHurt",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 10,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    },
    death: {
      type: "sheet",
      key: "wildZombieDeath",
      frameWidth: 96,
      frameHeight: 96,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 8,
      scale: 1.72,
      anchor: { x: 48, y: 92 }
    }
  },
  urbanZombie1: {
    walk: {
      type: "sheet",
      key: "urbanZombie1Walk",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      fps: 9,
      scale: 1.68,
      anchor: { x: 64, y: 122 }
    },
    attack: {
      type: "sheet",
      key: "urbanZombie1Attack",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 11,
      scale: 1.68,
      anchor: { x: 64, y: 122 },
      hitFrame: 2
    },
    hurt: {
      type: "sheet",
      key: "urbanZombie1Hurt",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3],
      fps: 10,
      scale: 1.68,
      anchor: { x: 64, y: 122 }
    },
    death: {
      type: "sheet",
      key: "urbanZombie1Death",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 9,
      scale: 1.68,
      anchor: { x: 64, y: 122 }
    }
  },
  urbanZombie2: {
    walk: {
      type: "sheet",
      key: "urbanZombie2Walk",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      fps: 9,
      scale: 1.7,
      anchor: { x: 64, y: 122 }
    },
    attack: {
      type: "sheet",
      key: "urbanZombie2Attack",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 11,
      scale: 1.7,
      anchor: { x: 64, y: 122 },
      hitFrame: 2
    },
    hurt: {
      type: "sheet",
      key: "urbanZombie2Hurt",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3],
      fps: 10,
      scale: 1.7,
      anchor: { x: 64, y: 122 }
    },
    death: {
      type: "sheet",
      key: "urbanZombie2Death",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 9,
      scale: 1.7,
      anchor: { x: 64, y: 122 }
    }
  },
  urbanZombie3: {
    walk: {
      type: "sheet",
      key: "urbanZombie3Walk",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      fps: 9,
      scale: 1.74,
      anchor: { x: 64, y: 122 }
    },
    attack: {
      type: "sheet",
      key: "urbanZombie3Attack",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 11,
      scale: 1.74,
      anchor: { x: 64, y: 122 },
      hitFrame: 2
    },
    hurt: {
      type: "sheet",
      key: "urbanZombie3Hurt",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3],
      fps: 10,
      scale: 1.74,
      anchor: { x: 64, y: 122 }
    },
    death: {
      type: "sheet",
      key: "urbanZombie3Death",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 9,
      scale: 1.74,
      anchor: { x: 64, y: 122 }
    }
  },
  urbanZombie4: {
    walk: {
      type: "sheet",
      key: "urbanZombie4Walk",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      fps: 9,
      scale: 1.78,
      anchor: { x: 64, y: 122 }
    },
    attack: {
      type: "sheet",
      key: "urbanZombie4Attack",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 11,
      scale: 1.78,
      anchor: { x: 64, y: 122 },
      hitFrame: 2
    },
    hurt: {
      type: "sheet",
      key: "urbanZombie4Hurt",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3],
      fps: 10,
      scale: 1.78,
      anchor: { x: 64, y: 122 }
    },
    death: {
      type: "sheet",
      key: "urbanZombie4Death",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4],
      fps: 9,
      scale: 1.78,
      anchor: { x: 64, y: 122 }
    }
  },
  wizard: {
    walk: {
      type: "sheet",
      key: "wizardWalk",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3, 4, 5],
      fps: 7,
      scale: 1.36,
      anchor: { x: 64, y: 122 }
    },
    attack: {
      type: "sheet",
      key: "wizardAttack",
      frameWidth: 128,
      frameHeight: 128,
      frameOrder: [0, 1, 2, 3],
      fps: 8,
      scale: 1.36,
      anchor: { x: 64, y: 122 },
      hitFrame: 2
    }
  }
};

const ZOMBIE_MOB_LAYOUTS = {
  easy: [
    { type: "urbanZombie1", x: 920, y: WORLD.floorY, minX: 860, maxX: 1380, speed: 64 },
    { type: "zombie", x: 1180, y: WORLD.floorY, minX: 900, maxX: 1710, speed: 66 },
    { type: "urbanZombie2", x: 1480, y: WORLD.floorY, minX: 1160, maxX: 1920, speed: 64 },
    { type: "zombieWoman", x: 3050, y: WORLD.floorY, minX: 2560, maxX: 3920, speed: 62 },
    { type: "urbanZombie3", x: 3520, y: WORLD.floorY, minX: 3140, maxX: 4120, speed: 64 },
    { type: "wildZombie", x: 4980, y: WORLD.floorY, minX: 4660, maxX: 5660, speed: 68 },
    { type: "urbanZombie4", x: 6480, y: WORLD.floorY, minX: 6060, maxX: 7000, speed: 66 },
    { type: "urbanZombie4", x: 8060, y: WORLD.floorY, minX: 7860, maxX: 8520, speed: 68 },
    { type: "zombieWoman", x: 8190, y: WORLD.floorY, minX: 7880, maxX: 8940, speed: 70 }
  ],
  medium: [
    { type: "urbanZombie1", x: 900, y: WORLD.floorY, minX: 860, maxX: 1380, speed: 65 },
    { type: "zombie", x: 1160, y: WORLD.floorY, minX: 920, maxX: 1660, speed: 68 },
    { type: "urbanZombie2", x: 1360, y: WORLD.floorY, minX: 980, maxX: 1820, speed: 67 },
    { type: "zombieWoman", x: 1580, y: WORLD.floorY, minX: 1100, maxX: 2140, speed: 64 },
    { type: "urbanZombie3", x: 1840, y: WORLD.floorY, minX: 1380, maxX: 2240, speed: 68 },
    { type: "zombieWoman", x: 3050, y: WORLD.floorY, minX: 2560, maxX: 3920, speed: 64 },
    { type: "urbanZombie4", x: 3440, y: WORLD.floorY, minX: 2980, maxX: 4140, speed: 68 },
    { type: "wildZombie", x: 3560, y: WORLD.floorY, minX: 3000, maxX: 4080, speed: 72 },
    { type: "wildZombie", x: 4980, y: WORLD.floorY, minX: 4660, maxX: 5660, speed: 70 },
    { type: "urbanZombie1", x: 5420, y: WORLD.floorY, minX: 5000, maxX: 5860, speed: 68 },
    { type: "zombieWoman", x: 6410, y: WORLD.floorY, minX: 5900, maxX: 7000, speed: 66 },
    { type: "urbanZombie2", x: 6680, y: WORLD.floorY, minX: 6300, maxX: 7100, speed: 69 },
    { type: "zombie", x: 6820, y: WORLD.floorY, minX: 6280, maxX: 7040, speed: 70 },
    { type: "urbanZombie3", x: 8060, y: WORLD.floorY, minX: 7880, maxX: 8460, speed: 70 },
    { type: "wildZombie", x: 8190, y: WORLD.floorY, minX: 7880, maxX: 8940, speed: 74 }
    ,{ type: "urbanZombie4", x: 8600, y: WORLD.floorY, minX: 8240, maxX: 8940, speed: 72 }
  ],
  hard: [
    { type: "zombie", x: 960, y: WORLD.floorY, minX: 860, maxX: 1710, speed: 70 },
    { type: "urbanZombie1", x: 1120, y: WORLD.floorY, minX: 900, maxX: 1600, speed: 66 },
    { type: "zombieWoman", x: 1260, y: WORLD.floorY, minX: 920, maxX: 1780, speed: 66 },
    { type: "urbanZombie2", x: 1460, y: WORLD.floorY, minX: 1100, maxX: 1980, speed: 68 },
    { type: "wildZombie", x: 1600, y: WORLD.floorY, minX: 1240, maxX: 2140, speed: 74 },
    { type: "urbanZombie3", x: 1940, y: WORLD.floorY, minX: 1520, maxX: 2320, speed: 70 },
    { type: "zombieWoman", x: 2920, y: WORLD.floorY, minX: 2560, maxX: 3400, speed: 66 },
    { type: "urbanZombie4", x: 3180, y: WORLD.floorY, minX: 2780, maxX: 3700, speed: 70 },
    { type: "zombie", x: 3360, y: WORLD.floorY, minX: 2900, maxX: 3920, speed: 70 },
    { type: "wildZombie", x: 3820, y: WORLD.floorY, minX: 3320, maxX: 4200, speed: 76 },
    { type: "urbanZombie1", x: 4140, y: WORLD.floorY, minX: 3680, maxX: 4460, speed: 72 },
    { type: "wildZombie", x: 4980, y: WORLD.floorY, minX: 4660, maxX: 5660, speed: 72 },
    { type: "urbanZombie2", x: 5220, y: WORLD.floorY, minX: 4840, maxX: 5600, speed: 70 },
    { type: "zombieWoman", x: 5340, y: WORLD.floorY, minX: 4860, maxX: 5860, speed: 68 },
    { type: "urbanZombie3", x: 5740, y: WORLD.floorY, minX: 5340, maxX: 6120, speed: 72 },
    { type: "zombie", x: 6120, y: WORLD.floorY, minX: 5760, maxX: 6480, speed: 70 },
    { type: "urbanZombie4", x: 6340, y: WORLD.floorY, minX: 5940, maxX: 6780, speed: 72 },
    { type: "zombieWoman", x: 6480, y: WORLD.floorY, minX: 6120, maxX: 7000, speed: 68 },
    { type: "wildZombie", x: 6940, y: WORLD.floorY, minX: 6500, maxX: 7080, speed: 78 },
    { type: "urbanZombie1", x: 7240, y: WORLD.floorY, minX: 6840, maxX: 7440, speed: 72 },
    { type: "zombie", x: 7940, y: WORLD.floorY, minX: 7880, maxX: 8460, speed: 72 },
    { type: "urbanZombie2", x: 8160, y: WORLD.floorY, minX: 7900, maxX: 8540, speed: 72 },
    { type: "wildZombie", x: 8420, y: WORLD.floorY, minX: 8040, maxX: 8940, speed: 78 }
    ,{ type: "urbanZombie3", x: 8700, y: WORLD.floorY, minX: 8340, maxX: 8980, speed: 74 }
  ]
};

let mobs = [];

const boss = {
  x: 8840,
  y: WORLD.floorY,
  minX: ARENA.start + 280,
  maxX: WORLD.width - 280,
  speed: 54,
  direction: -1,
  active: false,
  wakeTimer: 0,
  animation: "idle",
  attackTimer: 0,
  actionTime: 0,
  hitApplied: false,
  spellTargetX: null,
  maxLife: 260,
  life: 260
};

const assetPaths = {
  background: "maps/stage 3 map - factory/3 Background/Day/Background.png",
  skyline: "maps/stage 3 map - factory/3 Background/Day/2.png",
  gantry: "maps/stage 3 map - factory/3 Background/Day/3.png",
  skylineBack: "maps/stage 3 map - factory/3 Background/Day/5.png",
  crane: "maps/stage 3 map - factory/3 Objects/4 Overhead crane/Overhead-crane.png",
  cargo: [
    "maps/stage 3 map - factory/3 Objects/1 Cargos/1.png",
    "maps/stage 3 map - factory/3 Objects/1 Cargos/6.png",
    "maps/stage 3 map - factory/3 Objects/1 Cargos/12.png",
    "maps/stage 3 map - factory/3 Objects/1 Cargos/18.png",
    "maps/stage 3 map - factory/3 Objects/1 Cargos/24.png"
  ],
  boxes: [
    "maps/stage 3 map - factory/3 Objects/3 Box/1.png",
    "maps/stage 3 map - factory/3 Objects/3 Box/2.png",
    "maps/stage 3 map - factory/3 Objects/3 Box/3.png",
    "maps/stage 3 map - factory/3 Objects/3 Box/4.png",
    "maps/stage 3 map - factory/3 Objects/3 Box/5.png",
    "maps/stage 3 map - factory/3 Objects/3 Box/6.png"
  ],
  fences: [
    "maps/stage 3 map - factory/3 Objects/2 Fencing/1.png",
    "maps/stage 3 map - factory/3 Objects/2 Fencing/2.png",
    "maps/stage 3 map - factory/3 Objects/2 Fencing/3.png",
    "maps/stage 3 map - factory/3 Objects/2 Fencing/4.png",
    "maps/stage 3 map - factory/3 Objects/2 Fencing/5.png",
    "maps/stage 3 map - factory/3 Objects/2 Fencing/6.png",
    "maps/stage 3 map - factory/3 Objects/2 Fencing/7.png",
    "maps/stage 3 map - factory/3 Objects/2 Fencing/8.png"
  ],
  tileTop: [
    "maps/stage 3 map - factory/1 Tiles/Tile_01.png",
    "maps/stage 3 map - factory/1 Tiles/Tile_02.png",
    "maps/stage 3 map - factory/1 Tiles/Tile_03.png",
    "maps/stage 3 map - factory/1 Tiles/Tile_20.png"
  ],
  tileBody: "maps/stage 3 map - factory/1 Tiles/Tile_19.png",
  tileAccent: "maps/stage 3 map - factory/1 Tiles/Tile_14.png",
  heroIdle: "characters/protagonist/Hallokin (protagonist)/png (free)/idle.png",
  heroRun: "characters/protagonist/Hallokin (protagonist)/png (free)/run.png",
  heroJump: "characters/protagonist/Hallokin (protagonist)/png (free)/jump.png",
  heroFall: "characters/protagonist/Hallokin (protagonist)/png (free)/fall.png",
  heroAttack: "characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png",
  heroUpAttack: "characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png",
  heroJumpForwardAttack: "characters/protagonist/Hallokin (protagonist)/png (free)/jump - attack forwared.png",
  heroDarkSpell01Frames: Array.from({ length: 9 }, (_, index) => `characters/protagonist/Hallokin (protagonist)/DarkSpells new skill/DarkSpells/DarkSpell_01/Frames/Darkspell_01_frame${index + 1}.png`),
  heroDarkSpell02Frames: Array.from({ length: 8 }, (_, index) => `characters/protagonist/Hallokin (protagonist)/DarkSpells new skill/DarkSpells/DarkSpell_02/Frames/DarkSpell_02_frame${index + 1}.png`),
  zombieWalk: "characters/mobs/zombie - mobs/Zombie Man/Walk.png",
  zombieAttack: "characters/mobs/zombie - mobs/Zombie Man/Attack_1.png",
  zombieHurt: "characters/mobs/zombie - mobs/Zombie Man/Hurt.png",
  zombieDeath: "characters/mobs/zombie - mobs/Zombie Man/Dead.png",
  zombieWomanWalk: "characters/mobs/zombie - mobs/Zombie Woman/Walk.png",
  zombieWomanAttack: "characters/mobs/zombie - mobs/Zombie Woman/Attack_1.png",
  zombieWomanHurt: "characters/mobs/zombie - mobs/Zombie Woman/Hurt.png",
  zombieWomanDeath: "characters/mobs/zombie - mobs/Zombie Woman/Dead.png",
  wildZombieWalk: "characters/mobs/zombie - mobs/Wild Zombie/Walk.png",
  wildZombieAttack: "characters/mobs/zombie - mobs/Wild Zombie/Attack_1.png",
  wildZombieHurt: "characters/mobs/zombie - mobs/Wild Zombie/Hurt.png",
  wildZombieDeath: "characters/mobs/zombie - mobs/Wild Zombie/Dead.png",
  urbanZombie1Walk: "characters/mobs/zombie mobs for stage 4/Zombie_1/Walk.png",
  urbanZombie1Attack: "characters/mobs/zombie mobs for stage 4/Zombie_1/Attack.png",
  urbanZombie1Hurt: "characters/mobs/zombie mobs for stage 4/Zombie_1/Hurt.png",
  urbanZombie1Death: "characters/mobs/zombie mobs for stage 4/Zombie_1/Dead.png",
  urbanZombie2Walk: "characters/mobs/zombie mobs for stage 4/Zombie_2/Walk.png",
  urbanZombie2Attack: "characters/mobs/zombie mobs for stage 4/Zombie_2/Attack.png",
  urbanZombie2Hurt: "characters/mobs/zombie mobs for stage 4/Zombie_2/Hurt.png",
  urbanZombie2Death: "characters/mobs/zombie mobs for stage 4/Zombie_2/Dead.png",
  urbanZombie3Walk: "characters/mobs/zombie mobs for stage 4/Zombie_3/Walk.png",
  urbanZombie3Attack: "characters/mobs/zombie mobs for stage 4/Zombie_3/Attack.png",
  urbanZombie3Hurt: "characters/mobs/zombie mobs for stage 4/Zombie_3/Hurt.png",
  urbanZombie3Death: "characters/mobs/zombie mobs for stage 4/Zombie_3/Dead.png",
  urbanZombie4Walk: "characters/mobs/zombie mobs for stage 4/Zombie_4/Walk.png",
  urbanZombie4Attack: "characters/mobs/zombie mobs for stage 4/Zombie_4/Attack.png",
  urbanZombie4Hurt: "characters/mobs/zombie mobs for stage 4/Zombie_4/Hurt.png",
  urbanZombie4Death: "characters/mobs/zombie mobs for stage 4/Zombie_4/Dead.png",
  wizardWalk: "characters/mobs/zombie - mobs/Wild Zombie/Walk.png",
  wizardAttack: "characters/mobs/zombie - mobs/Wild Zombie/Attack_1.png",
  waterFrames: Array.from({ length: 40 }, (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return `maps/stage 3 map - factory/1 Tiles/WaterTile_${suffix}.png`;
  }),
  bossIdle: "characters/bosses/EVil Wizard 2/Sprites/Idle.png",
  bossWalk: "characters/bosses/EVil Wizard 2/Sprites/Run.png",
  bossAttack: "characters/bosses/EVil Wizard 2/Sprites/Attack1.png",
  bossAttack2: "characters/bosses/EVil Wizard 2/Sprites/Attack2.png"
};

const assets = {};
const effectFrameCache = new Map();
const effectCanvas = document.createElement("canvas");
const effectCtx = effectCanvas.getContext("2d");
effectCtx.imageSmoothingEnabled = false;
const HALL0KIN_SLASH_PALETTE = ["#04050a", "#0a0d16", "#18233a", "#304670", "#7a9ced"];
const HALL0KIN_HERO_PALETTE = {
  abyss: [4, 5, 8],
  deep: [11, 15, 24],
  core: [24, 31, 48],
  edge: [41, 55, 84],
  glow: [85, 111, 164],
  face: [224, 230, 240]
};
const HALL0KIN_SLASH_EFFECTS = {
  attack: { frames: 5, pixelScale: 4, offsetX: -22, offsetY: -92, width: 44, height: 28, orientToFacing: true },
  special: { frames: 7, pixelScale: 4, offsetX: -18, offsetY: -136, width: 30, height: 40, orientToFacing: true },
  dash: { frames: 6, pixelScale: 4, offsetX: -8, offsetY: -96, width: 56, height: 22, orientToFacing: true }
};
const HALL0KIN_AURA_STYLES = {
  attack: { alpha: 0.14, scaleBoost: 1, offsetX: -4, offsetY: -10 },
  special: { alpha: 0.18, scaleBoost: 2, offsetX: -4, offsetY: -20 },
  dash: { alpha: 0.14, scaleBoost: 1, offsetX: -2, offsetY: -10 }
};
const HALL0KIN_ACTION_TRANSFORMS = {
  attack: {
    offsetX: [0, 0, 0, 0, 0],
    offsetY: [0, 0, 0, 0, 0],
    scaleX: [1, 1, 1, 1, 1],
    scaleY: [1, 1, 1, 1, 1],
    shadowScale: [1, 1, 1, 1, 1]
  },
  special: {
    offsetX: [0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, 0, 0, 0, 0, 0, 0],
    scaleX: [1, 1, 1, 1, 1, 1, 1],
    scaleY: [1, 1, 1, 1, 1, 1, 1],
    shadowScale: [1, 1, 1, 1, 1, 1, 1]
  },
  dash: {
    offsetX: [0, 0, 0, 0, 0, 0],
    offsetY: [0, 0, 0, 0, 0, 0],
    scaleX: [1, 1, 1, 1, 1, 1],
    scaleY: [1, 1, 1, 1, 1, 1],
    shadowScale: [1, 1, 1, 1, 1, 1]
  }
};
const HALL0KIN_DARK_SPELLS = {
  special: {
    castHoldFrame: 4,
    effectDuration: 0.56,
    assetKey: "heroDarkSpell01Frames",
    anchorOffsetX: 118,
    anchorOffsetY: 12,
    driftX: 138,
    driftY: 10,
    scale: 2.95,
    alpha: 0.98,
    orientToFacing: true,
    glowWidth: 152,
    glowHeight: 44
  },
  dash: {
    castHoldFrame: 3,
    effectDuration: 0.52,
    assetKey: "heroDarkSpell02Frames",
    anchorOffsetX: 126,
    anchorOffsetY: 12,
    driftX: 168,
    driftY: 12,
    scale: 2.85,
    alpha: 0.96,
    orientToFacing: true,
    glowWidth: 168,
    glowHeight: 44
  }
};

const heroAnimations = {
  idle: {
    type: "sheet",
    key: "heroIdle",
    frameWidth: 96,
    frameHeight: 128,
    frameOrder: [0, 2, 4, 6, 8, 10],
    fps: 10,
    scale: 4.2,
    trim: { x: 36, y: 48, width: 40, height: 36 },
    anchorX: 20,
    groundOffset: 16.8,
    effect: "hallokinShadowHero"
  },
  run: {
    type: "sheet",
    key: "heroRun",
    frameWidth: 96,
    frameHeight: 128,
    frameOrder: [0, 2, 4, 6],
    fps: 12,
    scale: 4.2,
    trim: { x: 34, y: 48, width: 42, height: 36 },
    anchorX: 22,
    groundOffset: 18,
    effect: "hallokinShadowHero"
  },
  jump: {
    type: "sheet",
    key: "heroJump",
    frameWidth: 96,
    frameHeight: 128,
    frameOrder: [0, 2, 4],
    fps: 12,
    scale: 4.2,
    trim: { x: 32, y: 44, width: 44, height: 40 },
    anchorX: 24,
    groundOffset: 18,
    effect: "hallokinShadowHero"
  },
  fall: {
    type: "sheet",
    key: "heroFall",
    frameWidth: 96,
    frameHeight: 128,
    frameOrder: [0, 2, 4],
    fps: 12,
    scale: 4.2,
    trim: { x: 32, y: 44, width: 44, height: 40 },
    anchorX: 24,
    groundOffset: 18,
    effect: "hallokinShadowHero"
  },
  attack: {
    type: "sheet",
    key: "heroAttack",
    frameWidth: 96,
    frameHeight: 128,
    frameOrder: [0, 0, 2, 4, 6],
    fps: 18,
    scale: 4.2,
    trim: { x: 22, y: 44, width: 70, height: 40 },
    anchorX: 34,
    groundOffset: 18,
    effect: "hallokinShadowHero",
    slashEffect: { key: "attack" }
  },
  special: {
    type: "sheet",
    key: "heroUpAttack",
    frameWidth: 96,
    frameHeight: 128,
    frameOrder: [0, 0, 2, 4, 6, 8, 10],
    fps: 14,
    scale: 4.2,
    trim: { x: 18, y: 14, width: 62, height: 66 },
    anchorX: 34,
    anchorY: 65,
    groundOffset: 18,
    effect: "hallokinShadowHero",
    spellEffect: { key: "special" }
  },
  dash: {
    type: "sheet",
    key: "heroJumpForwardAttack",
    frameWidth: 96,
    frameHeight: 128,
    frameOrder: [0, 0, 2, 4, 6, 8],
    fps: 21,
    scale: 4.2,
    trim: { x: 14, y: 30, width: 80, height: 46 },
    anchorX: 34,
    anchorY: 45,
    groundOffset: 18,
    effect: "hallokinShadowHero",
    spellEffect: { key: "dash" }
  }
};

const bossAnimations = {
  idle: {
    type: "sheet",
    key: "bossIdle",
    frameWidth: 250,
    frameHeight: 250,
    frameOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    fps: 10,
    scale: 2.4,
    anchorX: 125,
    anchorY: 166
  },
  walk: {
    type: "sheet",
    key: "bossWalk",
    frameWidth: 250,
    frameHeight: 250,
    frameOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    fps: 12,
    scale: 2.4,
    anchorX: 125,
    anchorY: 166
  },
  attack: {
    type: "sheet",
    key: "bossAttack",
    frameWidth: 250,
    frameHeight: 250,
    frameOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    fps: 14,
    scale: 2.4,
    anchorX: 125,
    anchorY: 166,
    hitFrame: 3,
    duration: 8 / 14
  },
  attack2: {
    type: "sheet",
    key: "bossAttack2",
    frameWidth: 250,
    frameHeight: 250,
    frameOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    fps: 14,
    scale: 2.4,
    anchorX: 125,
    anchorY: 166,
    hitFrame: 4,
    duration: 8 / 14
  }
};

function createMob(type, x, y, minX, maxX, speed) {
  const aggroRange = type === "wizard" ? 320 : 170;
  const attackRange = type === "wizard" ? 140 : 92;
  const attackCooldown = type === "wizard" ? 1.25 : 1.1;
  const attackAnimation = mobTemplates[type].attack;
  const hurtAnimation = mobTemplates[type].hurt;
  const deathAnimation = mobTemplates[type].death;
  const walkAnimation = mobTemplates[type].walk;
  const chaseSpeed = type === "wizard" ? speed * 1.75 : speed * 2.1;
  const baseLife = type === "wildZombie"
    ? 54
    : type === "zombieWoman"
      ? 46
      : type === "wizard"
        ? 52
        : type === "urbanZombie4"
          ? 58
          : type === "urbanZombie3"
            ? 54
            : type === "urbanZombie2"
              ? 52
              : type === "urbanZombie1"
                ? 50
                : 48;
  const baseDamage = type === "wizard" ? 18 : 14;
  return {
    type,
    x,
    y,
    minX,
    maxX,
    speed,
    chaseSpeed,
    direction: Math.random() > 0.5 ? 1 : -1,
    phaseOffset: Math.random() * 10,
    aggroRange,
    attackRange,
    gapProbe: Math.max(44, ((walkAnimation?.anchor?.x ?? 48) * (walkAnimation?.scale ?? 1)) * 0.72),
    attackCooldown,
    attackTimer: Math.random() * 0.35,
    hitFlash: 0,
    animation: "walk",
    attackTime: 0,
    attackDuration: attackAnimation.frameOrder.length / attackAnimation.fps,
    hurtTime: 0,
    hurtDuration: hurtAnimation ? (hurtAnimation.frameOrder.length / hurtAnimation.fps) : 0,
    deathTime: 0,
    deathDuration: deathAnimation ? (deathAnimation.frameOrder.length / deathAnimation.fps) : 0,
    hitApplied: false,
    baseLife,
    maxLife: baseLife,
    life: baseLife,
    baseDamage,
    dead: false,
    corpse: false
  };
}

function buildMobsForDifficulty(level) {
  const layout = ZOMBIE_MOB_LAYOUTS[level] ?? ZOMBIE_MOB_LAYOUTS.medium;
  return layout
    .filter((entry) => !gaps.some((gap) => entry.maxX > gap.x && entry.minX < gap.x + gap.width))
    .map((entry) => createMob(entry.type, entry.x, entry.y, entry.minX, entry.maxX, entry.speed));
}

function applyDifficultySettings(level) {
  currentDifficulty = DIFFICULTY_PRESETS[level] ? level : "medium";
  const preset = DIFFICULTY_PRESETS[currentDifficulty];
  mobs = buildMobsForDifficulty(currentDifficulty);
  for (const mob of mobs) {
    const lifeRatio = mob.maxLife > 0 ? mob.life / mob.maxLife : 1;
    mob.maxLife = Math.round(mob.baseLife * preset.mobLife);
    mob.life = Math.max(0, Math.min(mob.maxLife, Math.round(mob.maxLife * lifeRatio)));
  }
  if (difficultyLabel) {
    difficultyLabel.textContent = preset.label;
  }
}

function applyProfileToStageHero() {
  if (!progressApi || !currentStageProfile) {
    return;
  }

  const derived = progressApi.deriveHeroStats(currentStageProfile);
  const combat = progressApi.deriveHeroCombat(currentStageProfile);
  hero.maxLife = derived.maxLife;
  hero.maxEnergy = derived.maxEnergy;
  hero.life = hero.maxLife;
  hero.energy = hero.maxEnergy;
  heroEnergyRegenPerSecond = derived.energyRegen ?? 18;
  HERO_ACTION_RULES.attack.damage = combat.attackDamage;
  HERO_ACTION_RULES.special.damage = combat.specialDamage;
  HERO_ACTION_RULES.dash.damage = combat.dashDamage;
}

function applyProfileEnemyScaling() {
  if (!progressApi || !currentStageProfile) {
    return;
  }

  const scaling = progressApi.getEnemyScaling(currentStageProfile);
  for (const mob of mobs) {
    const lifeRatio = mob.maxLife > 0 ? mob.life / mob.maxLife : 1;
    mob.maxLife = Math.max(1, Math.round(mob.maxLife * scaling.mobMultiplier));
    mob.life = Math.max(1, Math.round(mob.maxLife * lifeRatio));
    mob.baseDamage = Math.max(1, Math.round(mob.baseDamage * scaling.mobDamageMultiplier));
  }

  boss.maxLife = Math.max(1, Math.round(boss.maxLife * scaling.bossMultiplier));
  boss.life = boss.maxLife;
}

async function bootstrapStageProfile() {
  progressApi = await import("./gameProgress.js");
  currentStageUser = await progressApi.requireAuthenticatedUser("./login.html");
  try {
    currentStageProfile = await progressApi.getUserProfile(currentStageUser.uid, currentStageUser);
  } catch (error) {
    console.warn("Falling back to a local stage profile because Firestore could not be loaded:", error);
    currentStageProfile = progressApi.normalizeProfile({}, currentStageUser);
  }
  applyProfileToStageHero();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function approach(value, target, delta) {
  if (value < target) {
    return Math.min(value + delta, target);
  }
  return Math.max(value - delta, target);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

async function loadAssets() {
  const entries = Object.entries(assetPaths);
  await Promise.all(entries.map(async ([key, value]) => {
    if (Array.isArray(value)) {
      assets[key] = await Promise.all(value.map((src) => loadImage(src)));
      return;
    }
    assets[key] = await loadImage(value);
  }));
}

function getCurrentSection(x) {
  return SECTION_DATA.find((section) => x >= section.start && x < section.end) ?? SECTION_DATA[SECTION_DATA.length - 1];
}

function isInsideGap(x) {
  return gaps.some((gap) => x >= gap.x && x <= gap.x + gap.width);
}

function isNearGap(x, padding = 0) {
  return gaps.some((gap) => x >= gap.x - padding && x <= gap.x + gap.width + padding);
}

function mobWouldEnterGap(mob, nextX) {
  const footprint = mob.gapProbe ?? Math.max(44, mob.attackRange * 0.8);
  const frontX = nextX + (mob.direction * footprint);
  const leadingEdgeX = nextX + (mob.direction * (footprint * 0.62));
  const trailingEdgeX = nextX - (mob.direction * (footprint * 0.44));
  return isInsideGap(frontX) || isInsideGap(leadingEdgeX) || isInsideGap(trailingEdgeX) || isInsideGap(nextX);
}

function updateCheckpoint() {
  for (const section of SECTION_DATA) {
    if (hero.x >= section.checkpoint.x) {
      currentCheckpoint = section.checkpoint;
    }
  }
}

function triggerRespawn() {
  hero.x = firstSpawn.x - 160;
  hero.y = firstSpawn.y;
  hero.vx = 0;
  hero.vy = 0;
  hero.onGround = true;
  hero.animation = "idle";
  hero.action = null;
  hero.hurtTimer = 0;
  hero.invulnerableTimer = 0.7;
  hero.life = hero.maxLife;
  hero.energy = hero.maxEnergy;
  hero.respawnWalkActive = true;
  heroCooldowns.attack = 0;
  heroCooldowns.special = 0;
  heroCooldowns.dash = 0;
  applyDifficultySettings(currentDifficulty);
  applyProfileEnemyScaling();
  boss.active = false;
  boss.wakeTimer = 0;
}

function hitHero(attackerX, force = 240) {
  if (hero.invulnerableTimer > 0) {
    return;
  }

  hero.action = null;
  hero.hurtTimer = 0.35;
  hero.invulnerableTimer = 0.7;
  const preset = DIFFICULTY_PRESETS[currentDifficulty];
  const mob = mobs.find((entry) => Math.abs(entry.x - attackerX) < 8 && !entry.dead);
  const damage = mob ? Math.round(mob.baseDamage * preset.mobDamage) : 14;
  hero.life = Math.max(0, hero.life - damage);
  hero.vx = hero.x < attackerX ? -force : force;
  hero.vy = -280;
  hero.onGround = false;

  if (hero.life === 0) {
    triggerRespawn();
  }
}

function hitHeroDirect(damage, attackerX, force = 320) {
  if (hero.invulnerableTimer > 0) {
    return;
  }

  const preset = DIFFICULTY_PRESETS[currentDifficulty];
  hero.action = null;
  hero.hurtTimer = 0.45;
  hero.invulnerableTimer = 0.8;
  hero.life = Math.max(0, hero.life - Math.round(damage * preset.mobDamage));
  hero.vx = hero.x < attackerX ? -force : force;
  hero.vy = -300;
  hero.onGround = false;

  if (hero.life === 0) {
    triggerRespawn();
  }
}

function hitMob(mob, actionName) {
  if (mob.dead || mob.corpse) {
    return;
  }
  const rule = HERO_ACTION_RULES[actionName];
  const preset = DIFFICULTY_PRESETS[currentDifficulty];
  mob.life = Math.max(0, mob.life - Math.round(rule.damage * preset.heroDamage));
  mob.hitFlash = 0.2;
  if (mob.life === 0) {
    mob.dead = true;
    mob.animation = "death";
    mob.attackTime = 0;
    mob.attackTimer = 0;
    mob.hitApplied = true;
    mob.deathTime = 0;
  } else if (mobTemplates[mob.type].hurt) {
    mob.animation = "hurt";
    mob.hurtTime = 0;
  }
}

function applyHeroActionDamage(actionName) {
  const rule = HERO_ACTION_RULES[actionName];
  if (!rule) {
    return;
  }

  if (actionName === "special" || actionName === "dash") {
    const spellConfig = getHallokinDarkSpellConfig(actionName);
    const centerX = hero.x + ((spellConfig?.anchorOffsetX ?? 0) * hero.facing) + ((spellConfig?.driftX ?? 0) * hero.facing * 0.72);
    const centerY = hero.y + (spellConfig?.anchorOffsetY ?? 0) + ((spellConfig?.driftY ?? 0) * 0.55);

    for (const mob of mobs) {
      if (mob.dead) {
        continue;
      }
      const dx = mob.x - centerX;
      const dy = mob.y - centerY;
      if (Math.abs(dx) <= rule.range && Math.abs(dy) <= rule.verticalRange) {
        hitMob(mob, actionName);
      }
    }

    if (boss.active && boss.life > 0) {
      const dx = boss.x - centerX;
      const dy = boss.y - centerY;
      if (Math.abs(dx) <= rule.range && Math.abs(dy) <= rule.verticalRange) {
        boss.life = Math.max(0, boss.life - (rule.damage * DIFFICULTY_PRESETS[currentDifficulty].heroDamage));
      }
    }
    return;
  }

  for (const mob of mobs) {
    if (mob.dead) {
      continue;
    }
    const dx = mob.x - hero.x;
    const dy = Math.abs(mob.y - hero.y);
    const inFront = hero.facing === 1 ? dx >= -16 : dx <= 16;
    if (!inFront || dy > rule.verticalRange || Math.abs(dx) > rule.range) {
      continue;
    }
    hitMob(mob, actionName);
  }

  if (boss.active && boss.life > 0) {
    const dx = boss.x - hero.x;
    const dy = Math.abs(boss.y - hero.y);
    const inFront = hero.facing === 1 ? dx >= -24 : dx <= 24;
    if (inFront && dy <= (rule.verticalRange + 24) && Math.abs(dx) <= (rule.range + 28)) {
      boss.life = Math.max(0, boss.life - (rule.damage * DIFFICULTY_PRESETS[currentDifficulty].heroDamage));
    }
  }
}

function triggerHeroAction(actionName) {
  const animation = heroAnimations[actionName];
  if (!animation) {
    return false;
  }

  const rule = HERO_ACTION_RULES[actionName];
  if (hero.action || !rule) {
    return false;
  }

  if (heroCooldowns[actionName] > 0 || hero.energy < rule.energyCost) {
    return false;
  }

  const spellConfig = getHallokinDarkSpellConfig(actionName);
  const castDuration = spellConfig
    ? getHallokinDarkSpellCastDuration(actionName)
    : (animation.frameOrder.length / animation.fps);

  hero.action = {
    name: actionName,
    time: 0,
    duration: castDuration + (spellConfig?.effectDuration ?? 0),
    facing: hero.facing,
    hitApplied: false,
    hitTime: spellConfig ? castDuration : rule.hitTime
  };
  hero.energy = Math.max(0, hero.energy - rule.energyCost);
  heroCooldowns[actionName] = rule.cooldown;

  hero.vx = 0;

  return true;
}

function updateHero(dt) {
  hero.hurtTimer = Math.max(0, hero.hurtTimer - dt);
  hero.invulnerableTimer = Math.max(0, hero.invulnerableTimer - dt);
  hero.energy = Math.min(hero.maxEnergy, hero.energy + (heroEnergyRegenPerSecond * dt));
  heroCooldowns.attack = Math.max(0, heroCooldowns.attack - dt);
  heroCooldowns.special = Math.max(0, heroCooldowns.special - dt);
  heroCooldowns.dash = Math.max(0, heroCooldowns.dash - dt);

  const respawnWalkEndX = firstSpawn.x + 48;
  if (hero.respawnWalkActive && hero.x >= respawnWalkEndX) {
    hero.respawnWalkActive = false;
  }

  if (hero.action) {
    hero.action.time += dt;
    hero.facing = hero.action.facing;
    hero.vx = 0;
    const rule = HERO_ACTION_RULES[hero.action.name];
    if (rule && !hero.action.hitApplied && hero.action.time >= hero.action.hitTime) {
      hero.action.hitApplied = true;
      applyHeroActionDamage(hero.action.name);
    }
    if (hero.action.time >= hero.action.duration) {
      hero.action = null;
    }
  }

  const moveAxis = hero.respawnWalkActive ? 1 : (Number(controls.right) - Number(controls.left));
  const movementLocked = Boolean(hero.action);
  const targetSpeed = movementLocked ? 0 : moveAxis * hero.speed;
  const acceleration = hero.onGround ? 1800 : 980;
  hero.vx = approach(hero.vx, targetSpeed, acceleration * dt);

  if (moveAxis === 0 && hero.onGround) {
    hero.vx = approach(hero.vx, 0, 2200 * dt);
  }

  if (moveAxis !== 0 && !hero.action) {
    hero.facing = moveAxis > 0 ? 1 : -1;
  }

  if (!hero.respawnWalkActive && jumpQueued && hero.onGround) {
    hero.vy = -hero.jumpSpeed;
    hero.onGround = false;
  }

  jumpQueued = false;

  hero.x = clamp(hero.x + hero.vx * dt, hero.width * 0.5, WORLD.width - hero.width * 0.5);
  hero.vy += WORLD.gravity * dt;

  const previousY = hero.y;
  hero.y += hero.vy * dt;
  hero.onGround = false;

  for (const platform of platforms) {
    const overlapsX = hero.x + hero.width * 0.44 > platform.x && hero.x - hero.width * 0.44 < platform.x + platform.width;
    const crossedTop = previousY <= platform.y && hero.y >= platform.y;
    if (overlapsX && crossedTop && hero.vy >= 0) {
      hero.y = platform.y;
      hero.vy = 0;
      hero.onGround = true;
      break;
    }
  }

  if (isInsideGap(hero.x) && hero.y >= WORLD.floorY) {
    hero.onGround = false;
  }

  if (hero.y > VIEW.height + 220) {
    triggerRespawn();
  }

  if (hero.action) {
    hero.animation = hero.action.name;
  } else if (!hero.onGround) {
    hero.animation = hero.vy < 0 ? "jump" : "fall";
  } else if (Math.abs(hero.vx) > 24) {
    hero.animation = "run";
  } else {
    hero.animation = "idle";
  }

  updateCheckpoint();
}

function updateCamera(dt) {
  const lookAhead = hero.facing * 150 + hero.vx * 0.18;
  const targetX = hero.x - VIEW.width * 0.42 + lookAhead;
  camera.x = approach(camera.x, clamp(targetX, 0, WORLD.width - VIEW.width), 2200 * dt);
}

function updateMobs(dt) {
  for (const mob of mobs) {
    if (mob.corpse) {
      continue;
    }
    mob.attackTimer = Math.max(0, mob.attackTimer - dt);
    mob.hitFlash = Math.max(0, mob.hitFlash - dt);
    const attackAnimation = mobTemplates[mob.type].attack;

    if (mob.dead) {
      mob.deathTime += dt;
      if (mob.deathTime >= mob.deathDuration) {
        mob.corpse = true;
      }
      continue;
    }

    if (mob.animation === "hurt") {
      mob.hurtTime += dt;
      if (mob.hurtTime >= mob.hurtDuration) {
        mob.animation = "walk";
        mob.hurtTime = 0;
      }
      continue;
    }

    if (mob.animation === "attack") {
      mob.attackTime += dt;
      const attackFrame = Math.min(
        Math.floor(mob.attackTime * attackAnimation.fps),
        attackAnimation.frameOrder.length - 1
      );
      const dx = hero.x - mob.x;
      const dy = Math.abs(hero.y - mob.y);
      const stillInFront = Math.sign(dx || mob.direction) === mob.direction;
      const stillInRange = Math.abs(dx) <= mob.attackRange;
      const stillSameLane = dy < (mob.type === "wizard" ? 160 : 120);

      if (!mob.hitApplied && attackFrame >= attackAnimation.hitFrame && stillInFront && stillInRange && stillSameLane) {
        mob.hitApplied = true;
        mob.hitFlash = 0.18;
        hitHero(mob.x, mob.type === "wizard" ? 360 : 280);
      }

      if (mob.attackTime >= mob.attackDuration) {
        mob.animation = "walk";
        mob.attackTime = 0;
        mob.hitApplied = false;
      }
      continue;
    }

    const dx = hero.x - mob.x;
    const dy = Math.abs(hero.y - mob.y);
    const sameLane = dy < (mob.type === "wizard" ? 160 : 120);
    const canEngage = sameLane && Math.abs(dx) <= mob.aggroRange;
    const facingHero = Math.sign(dx || mob.direction) === mob.direction;
    const closeEnoughToAttack = Math.abs(dx) <= mob.attackRange;

    mob.animation = "walk";

    if (canEngage) {
      mob.direction = dx >= 0 ? 1 : -1;
      if (!closeEnoughToAttack) {
        const nextX = mob.x + (mob.direction * mob.chaseSpeed * dt);
        if (mobWouldEnterGap(mob, nextX)) {
          mob.direction *= -1;
        } else {
          mob.x = nextX;
        }
      } else if (mob.attackTimer === 0 && facingHero) {
        mob.attackTimer = mob.attackCooldown;
        mob.animation = "attack";
        mob.attackTime = 0;
        mob.hitApplied = false;
      }
    } else {
      const nextX = mob.x + (mob.direction * mob.speed * dt);
      if (mobWouldEnterGap(mob, nextX)) {
        mob.direction *= -1;
      } else {
        mob.x = nextX;
      }
    }

    if (mob.x < mob.minX) {
      mob.x = mob.minX;
      mob.direction = 1;
    }

    if (mob.x > mob.maxX) {
      mob.x = mob.maxX;
      mob.direction = -1;
    }
  }
}

function updateBoss(dt) {
  const preset = DIFFICULTY_PRESETS[currentDifficulty];
  if (!boss.active && hero.x >= ARENA.start - 120) {
    boss.active = true;
  }

  if (!boss.active) {
    boss.wakeTimer = 0;
    return;
  }

  boss.wakeTimer += dt;
  boss.attackTimer = Math.max(0, boss.attackTimer - dt);
  const dx = hero.x - boss.x;
  const distance = Math.abs(dx);
  boss.direction = dx >= 0 ? 1 : -1;

  if (boss.animation === "attack" || boss.animation === "attack2") {
    const animation = bossAnimations[boss.animation];
    boss.actionTime += dt;
    const frame = Math.min(Math.floor(boss.actionTime * animation.fps), animation.frameOrder.length - 1);

    if (!boss.hitApplied && frame >= animation.hitFrame) {
      boss.hitApplied = true;
      if (boss.animation === "attack") {
        const inFront = Math.sign(dx || boss.direction) === boss.direction;
        if (distance <= 190 && inFront && Math.abs(hero.y - boss.y) < 140) {
          hitHeroDirect(32, boss.x, 360);
        }
      } else if (boss.animation === "attack2") {
        const targetX = boss.spellTargetX ?? hero.x;
        const inBlast = Math.abs(hero.x - targetX) <= 130 && Math.abs(hero.y - boss.y) < 170;
        if (inBlast) {
          hitHeroDirect(40, targetX, 420);
        }
      }
    }

    if (boss.actionTime >= animation.duration) {
      boss.animation = "idle";
      boss.actionTime = 0;
      boss.hitApplied = false;
      boss.spellTargetX = null;
    }
  } else {
    if (distance > 260) {
      boss.animation = "walk";
      boss.x += boss.direction * boss.speed * 2.15 * preset.bossSpeed * dt;
    } else {
      boss.animation = "idle";
    }

    if (boss.attackTimer === 0) {
      if (distance <= 190) {
        boss.animation = "attack";
        boss.attackTimer = currentDifficulty === "hard" ? 1.55 : currentDifficulty === "medium" ? 1.7 : 1.9;
        boss.actionTime = 0;
        boss.hitApplied = false;
      } else if (distance <= 460) {
        boss.animation = "attack2";
        boss.attackTimer = currentDifficulty === "hard" ? 2.1 : currentDifficulty === "medium" ? 2.3 : 2.55;
        boss.actionTime = 0;
        boss.hitApplied = false;
        boss.spellTargetX = hero.x + (hero.vx * 0.18);
      }
    }
  }

  if (boss.x < boss.minX) {
    boss.x = boss.minX;
    boss.direction = 1;
  }

  if (boss.x > boss.maxX) {
    boss.x = boss.maxX;
    boss.direction = -1;
  }
}

function drawParallaxLayer(image, ratio, scale, alpha, bottomOffset) {
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  let x = -((camera.x * ratio) % drawWidth) - drawWidth;

  ctx.save();
  ctx.globalAlpha = alpha;
  while (x < VIEW.width + drawWidth) {
    ctx.drawImage(image, Math.round(x), Math.round(VIEW.height - drawHeight - bottomOffset), Math.round(drawWidth), Math.round(drawHeight));
    x += drawWidth;
  }
  ctx.restore();
}

function drawBackdrop(time) {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  skyGradient.addColorStop(0, "#efb9cf");
  skyGradient.addColorStop(0.12, "#f4dbe7");
  skyGradient.addColorStop(0.32, "#eef8fb");
  skyGradient.addColorStop(1, "#c4d9e7");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  drawParallaxLayer(assets.background, 0.04, 2.78, 1, 8);
  drawParallaxLayer(assets.skylineBack, 0.11, 2.76, 0.9, 18);
  drawParallaxLayer(assets.skyline, 0.18, 2.72, 0.88, 24);
  drawParallaxLayer(assets.gantry, 0.24, 2.68, 0.86, 42);

  const glowPulse = 0.12 + Math.sin(time * 1.2) * 0.03;
  const haze = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  haze.addColorStop(0, `rgba(115, 225, 247, ${glowPulse})`);
  haze.addColorStop(0.36, "rgba(115, 225, 247, 0.04)");
  haze.addColorStop(1, "rgba(8, 12, 20, 0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawBossArenaFrame(time) {
  const startX = Math.round(ARENA.start - camera.x);
  const width = WORLD.width - ARENA.start;

  ctx.fillStyle = "#0f1c29";
  ctx.font = 'bold 28px "Lucida Console", monospace';
  ctx.textAlign = "center";
  ctx.fillText("", startX + width * 0.5, 164);

  for (const light of bossGateLights) {
    drawBeacon(light.x - camera.x, light.y, time + light.phase, "#ff8b5d");
  }
}

function drawBeacon(x, y, time, color) {
  const intensity = 0.38 + Math.sin(time * 4) * 0.18;
  ctx.save();
  ctx.fillStyle = "#1c2630";
  ctx.fillRect(Math.round(x), Math.round(y), 24, 58);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.65 + intensity * 0.4;
  ctx.fillRect(Math.round(x + 6), Math.round(y + 8), 12, 18);
  ctx.globalAlpha = 0.16 + intensity * 0.1;
  ctx.fillRect(Math.round(x - 10), Math.round(y - 8), 44, 42);
  ctx.restore();
}

function drawSupportColumn(x, topY, bottomY) {
  const bodyTile = assets.tileBody;
  let y = topY;
  while (y < bottomY) {
    ctx.drawImage(bodyTile, Math.round(x - camera.x), Math.round(y), TILE, TILE);
    y += TILE;
  }
}

function drawPlatform(platform) {
  const startTile = Math.floor(platform.x / TILE);
  const tileWidth = Math.ceil(platform.width / TILE);
  const tileHeight = Math.ceil(platform.height / TILE);
  const isMainDeck = platform.style === "main" || platform.style === "arena";
  const isSurfaceDeck = isMainDeck || platform.style === "catwalk";
  const isCatwalk = platform.style === "catwalk";

  if (isCatwalk) {
    return;
  }

  for (let row = 0; row < tileHeight; row += 1) {
    if ((isMainDeck && row >= 2) || (isCatwalk && row >= 1)) {
      break;
    }

    for (let col = 0; col < tileWidth; col += 1) {
      const drawX = startTile * TILE + col * TILE - camera.x;
      const drawY = platform.y + row * TILE;

      if (drawX < -TILE || drawX > VIEW.width + TILE) {
        continue;
      }

      const image = row === 0
        ? assets.tileTop[(startTile + col) % assets.tileTop.length]
        : assets.tileBody;

      ctx.drawImage(image, Math.round(drawX), Math.round(drawY), TILE, TILE);

      if (isMainDeck && row === 1) {
        ctx.fillStyle = "rgba(201, 207, 226, 0.92)";
        ctx.fillRect(Math.round(drawX), Math.round(drawY), TILE, TILE);
      }

      if (platform.style === "arena" && row === 0) {
        ctx.fillStyle = "rgba(255, 120, 90, 0.12)";
        ctx.fillRect(Math.round(drawX), Math.round(drawY), TILE, TILE);
      }

      if (!isSurfaceDeck && row === 1 && (col === 0 || col === tileWidth - 1 || (col + row) % 6 === 0)) {
        ctx.drawImage(assets.tileAccent, Math.round(drawX), Math.round(drawY), TILE, TILE);
      }
    }
  }

  if (isMainDeck) {
    const screenX = Math.round(platform.x - camera.x);
    const deckY = platform.y + TILE;
    const deckHeight = 22;
    const deckWidth = Math.round(platform.width);

    ctx.fillStyle = "#c8d0e6";
    ctx.fillRect(screenX, deckY, deckWidth, deckHeight);

    ctx.fillStyle = "#d8def0";
    ctx.fillRect(screenX, deckY, deckWidth, 6);

    ctx.fillStyle = "#9ba7c4";
    ctx.fillRect(screenX, deckY + deckHeight - 4, deckWidth, 4);

    const slabTop = deckY + deckHeight;
    const slabBottom = VIEW.height;
    const slabHeight = slabBottom - slabTop;

    for (let x = 0; x < deckWidth; x += TILE) {
      const slabX = screenX + x;
      const slabWidth = Math.min(TILE, deckWidth - x);

      ctx.fillStyle = "#c7cee4";
      ctx.fillRect(slabX, slabTop, slabWidth, slabHeight);

      ctx.fillStyle = "#d8def0";
      ctx.fillRect(slabX, slabTop, slabWidth, 6);

      ctx.fillStyle = "#9aa5bf";
      ctx.fillRect(slabX + slabWidth - 3, slabTop, 3, slabHeight);

      ctx.strokeStyle = "rgba(134, 146, 178, 0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(slabX + 0.5, slabTop + 0.5, Math.max(0, slabWidth - 1), Math.max(0, slabHeight - 1));
    }
  }

  if (platform.supportEvery && !isCatwalk) {
    for (let x = platform.x + 24; x < platform.x + platform.width; x += platform.supportEvery) {
      drawSupportColumn(x, platform.y + TILE * 2, WORLD.floorY + 96);
    }
  }
}

function drawGap(gap, time) {
  const screenX = gap.x - camera.x;
  const topY = WORLD.floorY + TILE;
  const waterTop = gap.waterY;
  const waterBottom = gap.waterY + gap.depth;
  const animationOffset = Math.floor(time * 8) % 4;
  const topFrames = assets.waterFrames.slice(animationOffset, animationOffset + 4).length === 4
    ? assets.waterFrames.slice(animationOffset, animationOffset + 4)
    : [
        assets.waterFrames[animationOffset % 4],
        assets.waterFrames[(animationOffset + 1) % 4],
        assets.waterFrames[(animationOffset + 2) % 4],
        assets.waterFrames[(animationOffset + 3) % 4]
      ];

  ctx.fillStyle = "#c8d0e6";
  ctx.fillRect(Math.round(screenX), topY, gap.width, gap.depth);

  ctx.fillStyle = "rgba(59, 164, 225, 1)";
  ctx.fillRect(Math.round(screenX), Math.round(waterTop), gap.width, Math.round(waterBottom - waterTop));

  for (let x = 0; x < gap.width; x += TILE) {
    const frame = topFrames[Math.floor(x / TILE) % topFrames.length];
    ctx.drawImage(frame, Math.round(screenX + x), Math.round(waterTop), TILE, TILE);
  }

  const blendGradient = ctx.createLinearGradient(0, waterTop + TILE - 4, 0, waterTop + TILE + 34);
  blendGradient.addColorStop(0, "rgba(59, 164, 225, 0.06)");
  blendGradient.addColorStop(0.35, "rgba(59, 164, 225, 0.34)");
  blendGradient.addColorStop(1, "rgba(59, 164, 225, 0)");
  ctx.fillStyle = blendGradient;
  ctx.fillRect(Math.round(screenX), Math.round(waterTop + TILE - 4), gap.width, 38);

  for (let y = waterTop + TILE; y < waterBottom; y += TILE) {
    ctx.drawImage(assets.tileBody, Math.round(screenX - TILE), Math.round(y), TILE, TILE);
    ctx.drawImage(assets.tileBody, Math.round(screenX + gap.width), Math.round(y), TILE, TILE);
  }
}

function drawCrane(prop, time) {
  const image = assets.crane;
  const width = image.width * prop.scale;
  const height = image.height * prop.scale;
  const x = prop.x - camera.x;
  const y = prop.y - height;

  if (x > VIEW.width + width || x < -width) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  ctx.restore();

  const cableX = x + width * 0.5 + Math.sin(time * 1.6 + prop.x * 0.002) * 8;
  ctx.strokeStyle = "rgba(255, 184, 77, 0.26)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.round(cableX), Math.round(y + height * 0.18));
  ctx.lineTo(Math.round(cableX), Math.round(y + height * 0.72));
  ctx.stroke();
}

function drawGroundProp(image, x, y, scale, alpha = 1, options = {}) {
  if (y >= WORLD.floorY - 12 && isNearGap(x, 84)) {
    return;
  }

  const width = image.width * scale;
  const height = image.height * scale;
  const screenX = x - camera.x - width * 0.5;
  const baseOffsetY = options.baseOffsetY ?? 0;

  if (screenX > VIEW.width + width || screenX < -width) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x - camera.x, y + baseOffsetY + 8, width * 0.34, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(image, Math.round(screenX), Math.round(y + baseOffsetY - height), Math.round(width), Math.round(height));
  ctx.restore();
}

function drawFenceRuns() {
  for (const run of fenceRuns) {
    for (let index = 0; index < run.count; index += 1) {
      const image = assets.fences[(index + run.count) % assets.fences.length];
      const step = image.width * run.scale * 0.76;
      const propX = run.startX + step * index;
      if (run.y >= WORLD.floorY - 12 && isNearGap(propX, 72)) {
        continue;
      }
      drawGroundProp(image, propX, run.y, run.scale, run.front ? 0.95 : 0.72);
    }
  }
}

function drawStageDetails(time) {
  for (const crane of craneProps) {
    drawCrane(crane, time);
  }

  for (const cargo of cargoProps) {
    drawGroundProp(assets.cargo[cargo.variant % assets.cargo.length], cargo.x, cargo.y, cargo.scale, 0.96);
  }

  for (const box of boxProps) {
    drawGroundProp(assets.boxes[box.variant % assets.boxes.length], box.x, box.y, box.scale, 0.96);
  }
}

function getAnimationFrame(animation, timeSeconds) {
  const order = animation.frameOrder ?? [];
  if (order.length === 0) {
    return 0;
  }
  const index = Math.floor(timeSeconds * animation.fps) % order.length;
  return order[index];
}

function mixPalette(level, start, end) {
  return [
    Math.round(start[0] + ((end[0] - start[0]) * level)),
    Math.round(start[1] + ((end[1] - start[1]) * level)),
    Math.round(start[2] + ((end[2] - start[2]) * level))
  ];
}

function getHallokinTransformValue(values, frameNumber, fallback = 0) {
  if (!values || values.length === 0) {
    return fallback;
  }

  return values[Math.min(frameNumber, values.length - 1)] ?? fallback;
}

function getHeroActionFrameNumber(actionName, actionTime = 0) {
  const animation = heroAnimations[actionName];
  if (!animation?.frameOrder?.length) {
    return 0;
  }

  return Math.min(Math.floor(actionTime * animation.fps), animation.frameOrder.length - 1);
}

function getHallokinActionTransform(animationName, frameNumber) {
  const transform = HALL0KIN_ACTION_TRANSFORMS[animationName];
  if (!transform) {
    return {
      offsetX: 0,
      offsetY: 0,
      scaleX: 1,
      scaleY: 1,
      shadowScale: 1
    };
  }

  return {
    offsetX: getHallokinTransformValue(transform.offsetX, frameNumber, 0),
    offsetY: getHallokinTransformValue(transform.offsetY, frameNumber, 0),
    scaleX: getHallokinTransformValue(transform.scaleX, frameNumber, 1),
    scaleY: getHallokinTransformValue(transform.scaleY, frameNumber, 1),
    shadowScale: getHallokinTransformValue(transform.shadowScale, frameNumber, 1)
  };
}

function getHallokinDarkSpellConfig(actionName) {
  return HALL0KIN_DARK_SPELLS[actionName] ?? null;
}

function getHallokinDarkSpellCastDuration(actionName) {
  const spellConfig = getHallokinDarkSpellConfig(actionName);
  const animation = heroAnimations[actionName];
  if (!animation || !spellConfig) {
    return animation ? (animation.frameOrder.length / animation.fps) : 0;
  }

  const holdFrame = Math.min(spellConfig.castHoldFrame, animation.frameOrder.length - 1);
  return (holdFrame + 1) / animation.fps;
}

function getHallokinActionDrawTime(actionName, actionTime) {
  const animation = heroAnimations[actionName];
  const spellConfig = getHallokinDarkSpellConfig(actionName);
  if (!animation || !spellConfig) {
    return actionTime;
  }

  const castDuration = getHallokinDarkSpellCastDuration(actionName);
  return Math.min(actionTime, Math.max(0, castDuration - (1 / animation.fps)));
}

function getHallokinDarkSpellState(actionName, actionTime) {
  const spellConfig = getHallokinDarkSpellConfig(actionName);
  if (!spellConfig) {
    return null;
  }

  const spellTime = actionTime - getHallokinDarkSpellCastDuration(actionName);
  if (spellTime < 0 || spellTime > spellConfig.effectDuration) {
    return null;
  }

  const progress = clamp(spellTime / spellConfig.effectDuration, 0, 1);
  const eased = 1 - ((1 - progress) * (1 - progress));
  return {
    progress,
    alpha: Math.sin(progress * Math.PI) * spellConfig.alpha,
    scale: spellConfig.scale * (0.86 + (eased * 0.16)),
    offsetX: spellConfig.anchorOffsetX + (spellConfig.driftX * eased),
    offsetY: spellConfig.anchorOffsetY + (spellConfig.driftY * eased)
  };
}

function drawHallokinDarkSpell(actionName, actionTime, heroCenterX, heroFootY, facing) {
  const spellConfig = getHallokinDarkSpellConfig(actionName);
  const spellState = getHallokinDarkSpellState(actionName, actionTime);
  const spellFrames = spellConfig ? assets[spellConfig.assetKey] : null;
  if (!spellConfig || !spellState || !Array.isArray(spellFrames) || spellFrames.length === 0) {
    return;
  }

  const frameIndex = Math.min(Math.floor(spellState.progress * spellFrames.length), spellFrames.length - 1);
  const spellImage = spellFrames[frameIndex];
  if (!spellImage) {
    return;
  }

  const drawWidth = spellImage.width * spellState.scale;
  const drawHeight = spellImage.height * spellState.scale;
  const orientedOffsetX = spellConfig.orientToFacing === false
    ? spellState.offsetX
    : spellState.offsetX * facing;
  const drawX = Math.round(heroCenterX - camera.x + orientedOffsetX);
  const drawY = Math.round(heroFootY + spellState.offsetY);

  ctx.save();
  ctx.globalAlpha = spellState.alpha * 0.28;
  ctx.fillStyle = "#6e5bc8";
  ctx.beginPath();
  ctx.ellipse(drawX, Math.round(heroFootY + 6), spellConfig.glowWidth + (spellState.progress * 14), spellConfig.glowHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = spellState.alpha;
  ctx.translate(drawX, drawY);
  if (spellConfig.orientToFacing !== false && facing === -1) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(spellImage, Math.round(-drawWidth * 0.5), Math.round(-drawHeight), Math.round(drawWidth), Math.round(drawHeight));
  ctx.restore();
}

function drawPixelBlock(drawCtx, x, y, w, h, color, scale) {
  drawCtx.fillStyle = color;
  drawCtx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(w * scale), Math.round(h * scale));
}

function drawPixelLine(drawCtx, x0, y0, x1, y1, thickness, colorIndex, scale) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  while (true) {
    drawPixelBlock(drawCtx, x - Math.floor(thickness * 0.5), y - Math.floor(thickness * 0.5), thickness, thickness, HALL0KIN_SLASH_PALETTE[colorIndex], scale);
    if (x === x1 && y === y1) {
      break;
    }

    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function drawPixelCircle(drawCtx, centerX, centerY, radius, thickness, colorIndex, scale, yScale = 1) {
  const plotted = new Set();

  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 24) {
    const x = Math.round(centerX + (Math.cos(angle) * radius));
    const y = Math.round(centerY + (Math.sin(angle) * radius * yScale));
    const key = `${x},${y}`;
    if (plotted.has(key)) {
      continue;
    }

    plotted.add(key);
    drawPixelBlock(drawCtx, x - Math.floor(thickness * 0.5), y - Math.floor(thickness * 0.5), thickness, thickness, HALL0KIN_SLASH_PALETTE[colorIndex], scale);
  }
}

function drawPixelBurstSpokes(drawCtx, centerX, centerY, radiusX, radiusY, spokes, thickness, colorIndex, scale) {
  for (let i = 0; i < spokes; i += 1) {
    const angle = (Math.PI * 2 * i) / spokes;
    const x = Math.round(centerX + (Math.cos(angle) * radiusX));
    const y = Math.round(centerY + (Math.sin(angle) * radiusY));
    drawPixelLine(drawCtx, centerX, centerY, x, y, thickness, colorIndex, scale);
  }
}

function renderHallokinSlashFrame(effectName, frameNumber, drawCtx, scale) {
  switch (effectName) {
    case "attack": {
      const sweep = 12 + (frameNumber * 3);
      drawPixelCircle(drawCtx, 14, 20, sweep, 2, 1, scale, 0.42);
      drawPixelCircle(drawCtx, 22, 18, Math.max(8, sweep - 5), 2, 2, scale, 0.5);
      drawPixelLine(drawCtx, 6, 28, 28 + (frameNumber * 3), 8, 2, 3, scale);
      drawPixelLine(drawCtx, 10, 30, 34 + (frameNumber * 2), 13, 1, 4, scale);
      drawPixelBurstSpokes(drawCtx, 28 + (frameNumber * 2), 12, 6, 4, 4, 1, 4, scale);
      break;
    }
    case "special": {
      const lift = 12 + (frameNumber * 4);
      const topY = 36 - lift;
      drawPixelLine(drawCtx, 18, 34, 18, topY, 3, 2, scale);
      drawPixelLine(drawCtx, 12, 34, 18, topY + 10, 2, 1, scale);
      drawPixelLine(drawCtx, 24, 34, 18, topY + 10, 2, 1, scale);
      drawPixelCircle(drawCtx, 18, 34, 8 + Math.min(frameNumber, 2), 2, 3, scale, 0.5);
      drawPixelCircle(drawCtx, 18, topY, 6 + Math.min(frameNumber, 4), 2, 4, scale, 0.48);
      drawPixelBurstSpokes(drawCtx, 18, topY, 10, 6, 8, 1, 4, scale);
      break;
    }
    case "dash": {
      const reach = 20 + (frameNumber * 7);
      drawPixelLine(drawCtx, 2, 15, 12 + reach, 11, 3, 1, scale);
      drawPixelLine(drawCtx, 3, 20, 12 + reach, 17, 3, 2, scale);
      drawPixelLine(drawCtx, 10, 9, 12 + reach, 13, 1, 4, scale);
      drawPixelLine(drawCtx, 8, 24, 12 + Math.max(0, reach - 10), 19, 1, 3, scale);
      drawPixelCircle(drawCtx, 14 + reach, 14, 7 + frameNumber, 2, 3, scale, 0.46);
      drawPixelBurstSpokes(drawCtx, 14 + reach, 14, 10, 5, 6, 1, 4, scale);
      break;
    }
    default:
      break;
  }
}

function createHallokinShadowFrame(image, sourceX, sourceY, sourceWidth, sourceHeight) {
  const cacheKey = [image.src, sourceX, sourceY, sourceWidth, sourceHeight, "hallokinShadowHero"].join("|");
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
    const alpha = data[i + 3];
    if (alpha === 0) {
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
      const heroLevel = Math.min(Math.max((luminance - 128) / 100, 0), 1);
      mapped = mixPalette(heroLevel, HALL0KIN_HERO_PALETTE.glow, HALL0KIN_HERO_PALETTE.face);
    } else if (isWarmSlash) {
      const slashLevel = Math.min(Math.max((luminance - 72) / 128, 0), 1);
      mapped = mixPalette(slashLevel, HALL0KIN_HERO_PALETTE.deep, HALL0KIN_HERO_PALETTE.glow);
    } else if (luminance > 120) {
      const brightLevel = Math.min(Math.max((luminance - 120) / 90, 0), 1);
      mapped = mixPalette(brightLevel, HALL0KIN_HERO_PALETTE.core, HALL0KIN_HERO_PALETTE.glow);
    } else if (luminance > 70) {
      const midLevel = Math.min(Math.max((luminance - 70) / 50, 0), 1);
      mapped = mixPalette(midLevel, HALL0KIN_HERO_PALETTE.deep, HALL0KIN_HERO_PALETTE.edge);
    } else if (luminance > 26) {
      const darkLevel = Math.min(Math.max((luminance - 26) / 44, 0), 1);
      mapped = mixPalette(darkLevel, HALL0KIN_HERO_PALETTE.abyss, HALL0KIN_HERO_PALETTE.core);
    } else {
      mapped = HALL0KIN_HERO_PALETTE.abyss;
    }

    data[i] = mapped[0];
    data[i + 1] = mapped[1];
    data[i + 2] = mapped[2];
  }

  effectCtx.putImageData(imageData, 0, 0);

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = sourceWidth;
  frameCanvas.height = sourceHeight;
  const frameCtx = frameCanvas.getContext("2d");
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(effectCanvas, 0, 0);
  effectFrameCache.set(cacheKey, frameCanvas);
  return frameCanvas;
}

function drawSheetAnimation(animation, x, y, facing, timeSeconds, transform = null) {
  const image = assets[animation.key];
  const frameIndex = getAnimationFrame(animation, timeSeconds);
  const trim = animation.trim;
  const actionTransform = transform ?? {
    offsetX: 0,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    shadowScale: 1
  };

  let sourceX = frameIndex * animation.frameWidth;
  let sourceY = 0;
  let sourceWidth = animation.frameWidth;
  let sourceHeight = animation.frameHeight;
  let drawWidth = animation.frameWidth * animation.scale;
  let drawHeight = animation.frameHeight * animation.scale;
  let drawX = x - camera.x - drawWidth * 0.5;
  let drawY = animation.anchorY != null
    ? y - (animation.anchorY * animation.scale)
    : y - drawHeight;

  if (trim) {
    sourceX += trim.x;
    sourceY = trim.y;
    sourceWidth = trim.width;
    sourceHeight = trim.height;
    drawWidth = trim.width * animation.scale;
    drawHeight = trim.height * animation.scale;
    const anchorX = (animation.anchorX ?? (trim.width * 0.5)) * animation.scale;
    drawX = x - camera.x - anchorX;
    drawY = animation.anchorY != null
      ? y - (animation.anchorY * animation.scale)
      : y - drawHeight + (animation.groundOffset ?? 0);
  }

  const frameImage = animation.effect === "hallokinShadowHero"
    ? createHallokinShadowFrame(image, sourceX, sourceY, sourceWidth, sourceHeight)
    : image;
  ctx.save();
  ctx.translate(
    Math.round(x - camera.x + (actionTransform.offsetX * facing)),
    Math.round(drawY + actionTransform.offsetY)
  );
  ctx.scale(facing, 1);
  const anchorX = (animation.anchorX ?? ((trim?.width ?? animation.frameWidth) * 0.5)) * animation.scale;
  const localDrawX = facing === 1
    ? -anchorX
    : -(drawWidth - anchorX);
  ctx.drawImage(
    frameImage,
    animation.effect === "hallokinShadowHero" ? 0 : sourceX,
    animation.effect === "hallokinShadowHero" ? 0 : sourceY,
    sourceWidth,
    sourceHeight,
    Math.round(localDrawX),
    0,
    Math.round(drawWidth),
    Math.round(drawHeight)
  );
  ctx.restore();
}

function drawSequenceAnimation(animation, x, y, facing, timeSeconds) {
  const frames = assets[animation.key];
  const frameIndex = Math.floor(timeSeconds * animation.fps) % frames.length;
  const image = frames[frameIndex];
  const width = image.width * animation.scale;
  const height = image.height * animation.scale;
  const anchor = animation.anchor;
  const drawX = x - camera.x;
  const drawY = y;

  ctx.save();
  ctx.translate(Math.round(drawX), Math.round(drawY - anchor.y * animation.scale));
  ctx.scale(facing, 1);
  ctx.drawImage(
    image,
    Math.round(-anchor.x * animation.scale * facing),
    0,
    Math.round(width),
    Math.round(height)
  );
  ctx.restore();
}

function drawHero(time) {
  const animation = heroAnimations[hero.animation];
  const frameNumber = hero.action ? getHeroActionFrameNumber(hero.action.name, hero.action.time) : 0;
  const actionTransform = hero.action ? getHallokinActionTransform(hero.action.name, frameNumber) : null;
  const slashEffect = hero.action ? animation.slashEffect : null;
  const spellEffect = hero.action ? animation.spellEffect : null;
  const animationTime = hero.action
    ? getHallokinActionDrawTime(hero.action.name, hero.action.time)
    : time;

  if (slashEffect) {
    const effectConfig = HALL0KIN_SLASH_EFFECTS[slashEffect.key];
    const auraStyle = HALL0KIN_AURA_STYLES[slashEffect.key];
    if (effectConfig && auraStyle) {
      ctx.save();
      ctx.globalAlpha = auraStyle.alpha;
      ctx.translate(hero.x - camera.x + (actionTransform.offsetX * hero.facing), actionTransform.offsetY);
      ctx.scale((effectConfig.orientToFacing === false ? 1 : hero.facing) * actionTransform.scaleX, actionTransform.scaleY);
      ctx.translate(effectConfig.offsetX + auraStyle.offsetX, hero.y + effectConfig.offsetY + auraStyle.offsetY);
      renderHallokinSlashFrame(slashEffect.key, frameNumber, ctx, effectConfig.pixelScale + auraStyle.scaleBoost);
      if (auraStyle.scaleBoost > 1) {
        ctx.globalAlpha = auraStyle.alpha * 0.55;
        ctx.translate(2, 2);
        renderHallokinSlashFrame(slashEffect.key, frameNumber, ctx, effectConfig.pixelScale + Math.max(1, auraStyle.scaleBoost - 1));
      }
      ctx.restore();
    }
  }

  if (hero.hurtTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.22, 0.34 + (Math.sin(time * 40) * 0.2));
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(hero.x - camera.x, hero.y + 8, 26, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSheetAnimation(animation, hero.x, hero.y, hero.facing, animationTime, actionTransform);

  if (slashEffect) {
    const effectConfig = HALL0KIN_SLASH_EFFECTS[slashEffect.key];
    if (effectConfig) {
      ctx.save();
      ctx.translate(hero.x - camera.x + (actionTransform.offsetX * hero.facing), actionTransform.offsetY);
      ctx.scale((effectConfig.orientToFacing === false ? 1 : hero.facing) * actionTransform.scaleX, actionTransform.scaleY);
      ctx.translate(effectConfig.offsetX, hero.y + effectConfig.offsetY);
      renderHallokinSlashFrame(slashEffect.key, frameNumber, ctx, effectConfig.pixelScale);
      ctx.restore();
    }
  }

  if (spellEffect && hero.action) {
    drawHallokinDarkSpell(spellEffect.key, hero.action.time, hero.x, hero.y, hero.facing);
  }
}

function drawMobs(time) {
  for (const mob of mobs) {
    const animationSet = mobTemplates[mob.type];
    const animation = mob.dead
      ? animationSet.death
      : (animationSet[mob.animation] ?? animationSet.walk);
    const image = assets[animation.key];
    const animationTime = mob.dead
      ? mob.deathTime
      : (mob.animation === "attack"
        ? mob.attackTime
        : (mob.animation === "hurt" ? mob.hurtTime : (time + mob.phaseOffset)));
    const rawFrameIndex = mob.dead
      ? Math.min(Math.floor(animationTime * animation.fps), animation.frameOrder.length - 1)
      : (mob.animation === "hurt"
        ? Math.min(Math.floor(animationTime * animation.fps), animation.frameOrder.length - 1)
        : Math.floor(animationTime * animation.fps) % animation.frameOrder.length);
    const sourceFrame = animation.frameOrder[rawFrameIndex];
    const drawWidth = animation.frameWidth * animation.scale;
    const drawHeight = animation.frameHeight * animation.scale;
    const screenX = mob.x - camera.x;
    const facing = mob.direction >= 0 ? 1 : -1;

    ctx.save();
    if (mob.hitFlash > 0) {
      ctx.globalAlpha = 0.82 + (mob.hitFlash * 1.2);
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(screenX, mob.y + 7, drawWidth * 0.18, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(Math.round(screenX), Math.round(mob.y - animation.anchor.y * animation.scale));
    ctx.scale(facing, 1);
    const localDrawX = facing === 1
      ? -animation.anchor.x * animation.scale
      : -(drawWidth - (animation.anchor.x * animation.scale));
    ctx.drawImage(
      image,
      sourceFrame * animation.frameWidth,
      0,
      animation.frameWidth,
      animation.frameHeight,
      Math.round(localDrawX),
      0,
      Math.round(drawWidth),
      Math.round(drawHeight)
    );
    ctx.restore();
  }
}

function drawBoss(time) {
  const ringPulse = 0.26 + Math.sin(time * 2.4) * 0.08;
  ctx.save();
  ctx.fillStyle = `rgba(255, 107, 107, ${boss.active ? 0.24 + ringPulse : 0.12})`;
  ctx.beginPath();
  ctx.ellipse(boss.x - camera.x, boss.y + 12, 126, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (boss.animation === "attack2" && boss.spellTargetX != null) {
    const telegraphPulse = 0.26 + Math.sin(time * 12) * 0.1;
    ctx.save();
    ctx.fillStyle = `rgba(255, 86, 86, ${telegraphPulse})`;
    ctx.beginPath();
    ctx.ellipse(boss.spellTargetX - camera.x, WORLD.floorY + 14, 130, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 196, 120, 0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  const animation = boss.active
    ? (bossAnimations[boss.animation] ?? bossAnimations.idle)
    : bossAnimations.idle;
  if (animation.type === "sheet") {
    drawSheetAnimation(animation, boss.x, boss.y, boss.direction, time);
  } else {
    drawSequenceAnimation(animation, boss.x, boss.y, boss.direction, time);
  }
}

function drawForeground(time) {
  drawFenceRuns();

  const floorGradient = ctx.createLinearGradient(0, WORLD.floorY + 12, 0, VIEW.height);
  floorGradient.addColorStop(0, "rgba(15, 28, 41, 0)");
  floorGradient.addColorStop(1, "rgba(15, 28, 41, 0.22)");
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, WORLD.floorY + 12, VIEW.width, VIEW.height - WORLD.floorY);
}

function updateHud() {
  const section = getCurrentSection(hero.x);
  const progress = clamp((hero.x / WORLD.width) * 100, 0, 100);
  const attackText = heroCooldowns.attack > 0 ? `Click ${heroCooldowns.attack.toFixed(1)}s` : "Click Ready";
  const specialText = heroCooldowns.special > 0 ? `Q ${heroCooldowns.special.toFixed(1)}s` : "Q Ready";
  const dashText = heroCooldowns.dash > 0 ? `E ${heroCooldowns.dash.toFixed(1)}s` : "E Ready";

  if (zoneName) {
    zoneName.textContent = section.label;
  }
  if (distanceValue) {
    distanceValue.textContent = `${Math.round(progress)}%`;
  }
  if (objectiveText) {
    objectiveText.textContent = section.objective;
  }
  if (lifeValue) {
    lifeValue.textContent = `${Math.ceil(hero.life)} / ${hero.maxLife}`;
  }
  if (lifeFill) {
    lifeFill.style.width = `${clamp((hero.life / hero.maxLife) * 100, 0, 100)}%`;
  }
  if (energyValue) {
    energyValue.textContent = `${Math.floor(hero.energy)} / ${hero.maxEnergy}`;
  }
  if (energyFill) {
    energyFill.style.width = `${clamp((hero.energy / hero.maxEnergy) * 100, 0, 100)}%`;
  }
  if (cooldownValue) {
    cooldownValue.textContent = `${attackText} | ${specialText} | ${dashText}`;
  }
  if (difficultyLabel) {
    difficultyLabel.textContent = DIFFICULTY_PRESETS[currentDifficulty].label;
  }
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }

  if (bossState) {
    if (boss.active) {
      bossState.textContent = "Open";
      bossState.classList.remove("hud-alert");
      bossState.style.color = "#ffd27a";
    } else {
      bossState.textContent = "Locked";
      bossState.classList.add("hud-alert");
      bossState.style.color = "#ffffff";
    }
  }

  updateSkillButtons();


  if (bossHud && bossHudFill && bossHudName) {
    const showBossHud = boss.active && boss.life > 0 && !stageClearState.active;
    bossHud.hidden = !showBossHud;
    if (showBossHud) {
      bossHudFill.style.width = `${clamp((boss.life / boss.maxLife) * 100, 0, 100)}%`;
      bossHudName.textContent = "Evil Wizard 2";
    }
  }
}

function render(time) {
  drawBackdrop(time);

  if (camera.x + VIEW.width > ARENA.start - 320) {
    drawBossArenaFrame(time);
  }

  for (const gap of gaps) {
    if (gap.x + gap.width > camera.x - 80 && gap.x < camera.x + VIEW.width + 80) {
      drawGap(gap, time);
    }
  }

  for (const platform of platforms) {
    if (platform.x + platform.width > camera.x - 120 && platform.x < camera.x + VIEW.width + 120) {
      drawPlatform(platform);
    }
  }

  drawStageDetails(time);
  drawMobs(time);
  drawBoss(time);
  drawHero(time);
  drawForeground(time);
}

function update(dt) {
  updateHero(dt);
  updateCamera(dt);
  updateMobs(dt);
  updateBoss(dt);
  updateHud();
}

function onKeyChange(code, pressed) {
  if (code === "KeyA" || code === "ArrowLeft") {
    controls.left = pressed;
  }

  if (code === "KeyD" || code === "ArrowRight") {
    controls.right = pressed;
  }

  if ((code === "Space" || code === "KeyW" || code === "ArrowUp") && pressed) {
    jumpQueued = true;
  }

  if (pressed && code === "KeyQ") {
    triggerHeroAction("special");
  }

  if (pressed && code === "KeyE") {
    triggerHeroAction("dash");
  }

}

function syncPausePanels(view = "main") {
  if (!pauseMain || !pauseSettingsPanel || !pauseExitPanel) {
    return;
  }

  pauseMain.hidden = view !== "main";
  pauseSettingsPanel.hidden = view !== "settings";
  pauseExitPanel.hidden = view !== "exit";
}

function syncPauseVolume() {
  const knobAngle = -135 + (pauseVolume * 270);

  if (volumeKnob) {
    volumeKnob.style.setProperty("--knob-angle", `${knobAngle}deg`);
    volumeKnob.setAttribute("aria-valuenow", String(Math.round(pauseVolume * 100)));
  }

  if (volumeKnobIndicator) {
    volumeKnobIndicator.style.setProperty("--knob-angle", `${knobAngle}deg`);
  }

  if (volumeLabel) {
    volumeLabel.textContent = `volume ${Math.round(pauseVolume * 100)}%`;
  }
}

function releaseControls() {
  controls.left = false;
  controls.right = false;
  jumpQueued = false;
}

function setPaused(nextPaused) {
  if (!pauseOverlay) {
    return;
  }

  paused = nextPaused;
  pauseOverlay.hidden = !paused;
  document.body.classList.toggle("is-paused", paused);

  if (paused) {
    syncPausePanels("main");
    releaseControls();
  } else {
    knobDragging = false;
  }

  lastTime = 0;
  syncPauseVolume();
}

function togglePause() {
  if (!gameReady || !pauseOverlay) {
    return;
  }

  setPaused(!paused);
}

function updatePauseVolumeFromPointer(clientX, clientY) {
  if (!volumeKnob) {
    return;
  }

  const rect = volumeKnob.getBoundingClientRect();
  const centerX = rect.left + (rect.width / 2);
  const centerY = rect.top + (rect.height / 2);
  let knobAngle = (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI + 90;

  if (knobAngle > 180) {
    knobAngle -= 360;
  }

  knobAngle = clamp(knobAngle, -135, 135);
  pauseVolume = clamp((knobAngle + 135) / 270, 0, 1);
  syncPauseVolume();
}

function updateSkillButtons() {
  const qCooling = heroCooldowns.special > 0;
  const eCooling = heroCooldowns.dash > 0;

  if (skillButtonQ) {
    skillButtonQ.classList.toggle("is-cooling", qCooling);
  }

  if (skillButtonE) {
    skillButtonE.classList.toggle("is-cooling", eCooling);
  }

  if (skillCooldownQ) {
    skillCooldownQ.textContent = qCooling ? String(Math.max(1, Math.ceil(heroCooldowns.special))) : "Ready";
  }

  if (skillCooldownE) {
    skillCooldownE.textContent = eCooling ? String(Math.max(1, Math.ceil(heroCooldowns.dash))) : "Ready";
  }
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (paused) {
    return;
  }

  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  onKeyChange(event.code, true);
});

window.addEventListener("keyup", (event) => {
  if (paused) {
    onKeyChange(event.code, false);
    return;
  }

  onKeyChange(event.code, false);
});

canvas.addEventListener("pointerdown", () => {
  if (paused) {
    return;
  }

  triggerHeroAction("attack");
});

if (pauseButton) {
  pauseButton.addEventListener("click", () => {
    togglePause();
  });
}

if (pausePlayButton) {
  pausePlayButton.addEventListener("click", () => {
    setPaused(false);
  });
}

if (pauseSettingsButton) {
  pauseSettingsButton.addEventListener("click", () => {
    syncPausePanels("settings");
  });
}

if (pauseExitButton) {
  pauseExitButton.addEventListener("click", () => {
    syncPausePanels("exit");
  });
}

if (pauseSettingsBackButton) {
  pauseSettingsBackButton.addEventListener("click", () => {
    syncPausePanels("main");
  });
}

if (pauseExitCancelButton) {
  pauseExitCancelButton.addEventListener("click", () => {
    syncPausePanels("main");
  });
}

  if (pauseExitConfirmButton) {
    pauseExitConfirmButton.addEventListener("click", () => {
      window.location.href = buildStageLoadingUrl("./lobby/index.html", {
        kicker: "RETURN",
        title: "Returning To The Lobby",
        copy: "Leaving the battlefield and reforming the world around you."
      });
    });
  }

if (volumeKnob) {
  volumeKnob.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    knobDragging = true;
    volumeKnob.setPointerCapture?.(event.pointerId);
    updatePauseVolumeFromPointer(event.clientX, event.clientY);
  });
}

window.addEventListener("pointermove", (event) => {
  if (!knobDragging) {
    return;
  }

  updatePauseVolumeFromPointer(event.clientX, event.clientY);
});

window.addEventListener("pointerup", () => {
  knobDragging = false;
});

window.addEventListener("pointercancel", () => {
  knobDragging = false;
});

if (difficultySelect) {
  difficultySelect.addEventListener("change", () => {
    applyDifficultySettings(difficultySelect.value);
    applyProfileEnemyScaling();
    updateHud();
  });
}

for (const button of touchButtons) {
  const input = button.dataset.input;
  const isDirectional = input === "left" || input === "right";

  const release = () => {
    if (isDirectional) {
      controls[input] = false;
    }
    button.classList.remove("is-active");
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.classList.add("is-active");

    if (isDirectional) {
      controls[input] = true;
    } else {
      jumpQueued = true;
    }
  });

  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
}

function loop(timestamp) {
  if (!gameReady) {
    requestAnimationFrame(loop);
    return;
  }

  if (!lastTime) {
    lastTime = timestamp;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 1 / 24);
  lastTime = timestamp;

  if (!paused) {
    update(dt);
    renderTimeSeconds = timestamp / 1000;
  }

  updateSkillButtons();
  render(renderTimeSeconds || timestamp / 1000);
  requestAnimationFrame(loop);
}

async function start() {
  try {
    await bootstrapStageProfile();
    await loadAssets();
    applyDifficultySettings(currentDifficulty);
    applyProfileEnemyScaling();
    gameReady = true;
    loadingScreen.hidden = true;
    updateHud();
    requestAnimationFrame(loop);
  } catch (error) {
    loadingScreen.hidden = false;
    loadingScreen.innerHTML = `
      <span class="loading-kicker">Stage 3</span>
      <strong>Asset load failed</strong>
      <p>${error.message}</p>
    `;
    console.error(error);
  }
}

start();
syncPauseVolume();
updateSkillButtons();

function buildStageLoadingUrl(target, options = {}) {
  const loadingUrl = new URL("./loading.html", window.location.href);
  loadingUrl.searchParams.set("target", target);
  if (options.title) {
    loadingUrl.searchParams.set("title", options.title);
  }
  if (options.copy) {
    loadingUrl.searchParams.set("copy", options.copy);
  }
  if (options.kicker) {
    loadingUrl.searchParams.set("kicker", options.kicker);
  }
  return loadingUrl.toString();
}

const STAGE_CLEAR_RETURN_URL = buildStageLoadingUrl("./lobby/index.html", {
  kicker: "VICTORY",
  title: "Returning To The Lobby",
  copy: "Your victory is sealed. Carrying your rewards and memories back through the veil."
});
const STAGE_CLEAR_LINES = [
  { speaker: "Evil Wizard 2", text: "The sea carried the dead to me... and still you cut your way through the tide." },
  { speaker: "Hallokin", text: "Every place I reach is already drowning in the same darkness. I need to know where it began." },
  { speaker: "Evil Wizard 2", text: "Follow the ruin inland, wanderer. The shadow at your back is older than any storm." },
  { speaker: "Hallokin", text: "Then I will chase it to its source, even if the answer was buried with the world." }
];
const stageClearState = {
  active: false,
  timer: 0,
  lineDuration: 2.5,
  fadeDuration: 1.2,
  currentLineIndex: -1,
  redirected: false
};

function syncStageClearDialogue() {
  if (!bossDialogueOverlay || !bossDialogueSpeaker || !bossDialogueText) {
    return;
  }

  if (!stageClearState.active) {
    bossDialogueOverlay.hidden = true;
    return;
  }

  const lineIndex = Math.min(STAGE_CLEAR_LINES.length - 1, Math.floor(stageClearState.timer / stageClearState.lineDuration));
  if (lineIndex === stageClearState.currentLineIndex) {
    return;
  }

  stageClearState.currentLineIndex = lineIndex;
  const line = STAGE_CLEAR_LINES[lineIndex];
  bossDialogueSpeaker.textContent = line.speaker;
  bossDialogueText.textContent = line.text;
  bossDialogueOverlay.hidden = false;
}

function triggerStageClearSequence() {
  if (stageClearState.active) {
    return;
  }

  stageClearState.active = true;
  stageClearState.timer = 0;
  stageClearState.currentLineIndex = -1;
  boss.life = 0;
  boss.attackTimer = Number.POSITIVE_INFINITY;
  boss.hitApplied = true;
  boss.spellTargetX = null;
  boss.animation = "idle";
  paused = false;
  if (pauseOverlay) {
    pauseOverlay.hidden = true;
  }
    if (!stageRewardPromise && progressApi && currentStageUser) {
      stageRewardPromise = progressApi.awardStageCompletion(currentStageUser.uid, "stage3", currentStageUser).catch((error) => {
        console.error("Failed to save stage 3 completion:", error);
      });
    }
  syncStageClearDialogue();
}

function updateStageClearSequence(dt) {
  if (!stageClearState.active) {
    return;
  }

  stageClearState.timer += dt;
  syncStageClearDialogue();
  const totalDuration = (STAGE_CLEAR_LINES.length * stageClearState.lineDuration) + stageClearState.fadeDuration;
  if (!stageClearState.redirected && stageClearState.timer >= totalDuration) {
    stageClearState.redirected = true;
    if (bossDialogueOverlay) {
      bossDialogueOverlay.hidden = true;
    }
    Promise.race([Promise.resolve(stageRewardPromise), new Promise((resolve) => window.setTimeout(resolve, 350))]).finally(() => {
      window.location.href = STAGE_CLEAR_RETURN_URL;
    });
  }
}

function drawStageClearSequence(time) {
  if (!stageClearState.active) {
    return;
  }

  const dialogueDuration = STAGE_CLEAR_LINES.length * stageClearState.lineDuration;
  const fadeProgress = clamp((stageClearState.timer - dialogueDuration) / stageClearState.fadeDuration, 0, 1);
  const overlayAlpha = 0.18 + (fadeProgress * 0.62);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `rgba(4, 6, 14, ${overlayAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

const originalApplyHeroActionDamage = applyHeroActionDamage;
applyHeroActionDamage = function patchedApplyHeroActionDamage(actionName) {
  originalApplyHeroActionDamage(actionName);
  if (boss.life <= 0) {
    triggerStageClearSequence();
  }
};

const originalUpdate = update;
update = function patchedUpdate(dt) {
  if (stageClearState.active) {
    updateStageClearSequence(dt);
    updateHud();
    return;
  }

  originalUpdate(dt);
  if (boss.life <= 0) {
    triggerStageClearSequence();
  }
  updateStageClearSequence(dt);
};

const originalRender = render;
render = function patchedRender(time) {
  originalRender(time);
  drawStageClearSequence(time);
};

const darkOdysseyAudio = window.createDarkOdysseyAudioManager ? window.createDarkOdysseyAudioManager({ scene: "stage3" }) : null;
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

const originalDarkOdysseyTriggerHeroAction = triggerHeroAction;
triggerHeroAction = function patchedDarkOdysseyTriggerHeroAction(actionName) {
  if (darkOdysseyAudio) {
    ensureDarkOdysseyAudioUnlocked();
  }

  const hadAction = Boolean(hero.action);
  const result = originalDarkOdysseyTriggerHeroAction(actionName);
  if (!hadAction && hero.action && darkOdysseyAudio) {
    darkOdysseyAudio.playAbility(actionName);
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

  if (["Space", "KeyW", "ArrowUp"].includes(event.code) && hero.onGround) {
    darkOdysseyAudio.playJump();
  }
}, true);

canvas?.addEventListener("pointerdown", () => {
  if (!darkOdysseyAudio || paused) {
    return;
  }

  ensureDarkOdysseyAudioUnlocked();
  darkOdysseyAudio.playAbility("attack");
}, true);

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || !darkOdysseyAudio) {
    return;
  }

  ensureDarkOdysseyAudioUnlocked();

  if (button.id === "pause-exit-confirm") {
    darkOdysseyAudio.playPortal();
    return;
  }

  darkOdysseyAudio.playUiClick(button.id.includes("back") || button.id.includes("cancel") ? "soft" : "default");
}, true);

syncPauseVolume();
