const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const characterPicker = document.getElementById("character-picker");
const actionButtons = document.getElementById("action-buttons");
const resetButton = document.getElementById("reset-btn");
const currentCharacterLabel = document.getElementById("current-character");
const currentAnimationLabel = document.getElementById("current-animation");
const currentPositionLabel = document.getElementById("current-position");
const stageShell = document.getElementById("stage-shell");
const entryOverlay = document.getElementById("entry-overlay");
const entryAcknowledge = document.getElementById("entry-acknowledge");
const entryStartButton = document.getElementById("entry-start");
const entryStatus = document.getElementById("entry-status");

ctx.imageSmoothingEnabled = false;

const STAGE = {
  width: canvas.width,
  height: canvas.height,
  groundY: 458,
  gravity: 1900
};

const DEFAULT_ACTION_META = [
  { key: "attack", label: "Attack", hint: "One-shot combat test" },
  { key: "dash", label: "Dash", hint: "Fast burst or fallback" },
  { key: "special", label: "Special", hint: "Unique animation" },
  { key: "hit", label: "Hit", hint: "Reaction test" },
  { key: "death", label: "Death", hint: "Full end-state clip" }
];

const HALL0KIN_COMBO_SEQUENCE = [
  "attack",
  "attack2",
  "rend",
  "special",
  "dash",
  "spears",
  "burst",
  "pulse",
  "aoe",
  "dominion",
  "halo",
  "rain",
  "cataclysm",
  "lattice",
  "forge",
  "prison",
  "blossom",
  "spiral",
  "orbit",
  "quake",
  "lance",
  "mirror",
  "storm",
  "throne",
  "maelstrom"
];
const SHADOW_PARTICLE_COLORS = [
  { fill: "#08101d", glow: "#48d9ff", hot: "#ecffff" },
  { fill: "#132347", glow: "#72a1ff", hot: "#f3f7ff" },
  { fill: "#0c182c", glow: "#74f2ff", hot: "#f0ffff" },
  { fill: "#1d1530", glow: "#ff5fcf", hot: "#fff1fb" },
  { fill: "#15284b", glow: "#9e7dff", hot: "#faf4ff" }
];
const HALL0KIN_PARTICLE_PALETTES = {
  attack: [
    { fill: "#08101d", glow: "#48d9ff", hot: "#ecffff" },
    { fill: "#0d1a2d", glow: "#74f2ff", hot: "#f0ffff" },
    { fill: "#132347", glow: "#72a1ff", hot: "#f3f7ff" }
  ],
  attack2: [
    { fill: "#1d1530", glow: "#ff5fcf", hot: "#fff1fb" },
    { fill: "#291143", glow: "#c26dff", hot: "#fff6ff" },
    { fill: "#101335", glow: "#7d7cff", hot: "#eef0ff" }
  ],
  special: [
    { fill: "#0b1627", glow: "#79f7ff", hot: "#f5ffff" },
    { fill: "#15284b", glow: "#8cc3ff", hot: "#ffffff" },
    { fill: "#111e31", glow: "#9de8ff", hot: "#f6ffff" }
  ],
  dash: [
    { fill: "#07141f", glow: "#39ffc8", hot: "#efffff" },
    { fill: "#0e2230", glow: "#72f2ff", hot: "#f4ffff" },
    { fill: "#16344a", glow: "#60ffea", hot: "#ffffff" }
  ],
  burst: [
    { fill: "#140f25", glow: "#9e7dff", hot: "#faf4ff" },
    { fill: "#21153a", glow: "#ff5fcf", hot: "#fff3fb" },
    { fill: "#101832", glow: "#72a1ff", hot: "#f6f7ff" }
  ],
  aoe: [
    { fill: "#08101d", glow: "#66e4ff", hot: "#efffff" },
    { fill: "#102443", glow: "#7dc4ff", hot: "#ffffff" },
    { fill: "#132347", glow: "#72f2ff", hot: "#f4ffff" }
  ],
  dominion: [
    { fill: "#120f25", glow: "#7d7cff", hot: "#eef0ff" },
    { fill: "#1c1636", glow: "#9e7dff", hot: "#fff5ff" },
    { fill: "#151a42", glow: "#75a1ff", hot: "#f3f6ff" }
  ],
  halo: [
    { fill: "#1b2030", glow: "#fff1a8", hot: "#ffffff" },
    { fill: "#15284b", glow: "#9de8ff", hot: "#ffffff" },
    { fill: "#222038", glow: "#f8d2ff", hot: "#fff9ff" }
  ],
  rain: [
    { fill: "#0d1b31", glow: "#66c8ff", hot: "#f4ffff" },
    { fill: "#102443", glow: "#72f2ff", hot: "#ffffff" },
    { fill: "#162f5a", glow: "#8ea8ff", hot: "#f6f7ff" }
  ],
  cataclysm: [
    { fill: "#1a0f1d", glow: "#ff6fb5", hot: "#fff2fb" },
    { fill: "#140f25", glow: "#9e7dff", hot: "#faf4ff" },
    { fill: "#261126", glow: "#ff8d7a", hot: "#fff5f0" }
  ],
  spears: [
    { fill: "#0b1a2d", glow: "#8cf4ff", hot: "#ffffff" },
    { fill: "#163152", glow: "#a0d8ff", hot: "#f8ffff" },
    { fill: "#112440", glow: "#63dfff", hot: "#efffff" }
  ],
  pulse: [
    { fill: "#18102a", glow: "#b27dff", hot: "#fff5ff" },
    { fill: "#111a34", glow: "#72a1ff", hot: "#f4f7ff" },
    { fill: "#23163c", glow: "#ff79d8", hot: "#fff3fb" }
  ],
  rend: [
    { fill: "#190d16", glow: "#ff667a", hot: "#fff3f6" },
    { fill: "#271020", glow: "#ff5fcf", hot: "#fff1fb" },
    { fill: "#15112a", glow: "#a07dff", hot: "#faf4ff" }
  ],
  lattice: [
    { fill: "#08131f", glow: "#67f2ff", hot: "#f4ffff" },
    { fill: "#161739", glow: "#c37dff", hot: "#fff4ff" },
    { fill: "#10294c", glow: "#7ba6ff", hot: "#f5f7ff" }
  ],
  forge: [
    { fill: "#09141f", glow: "#5dfff2", hot: "#ffffff" },
    { fill: "#14253d", glow: "#9de8ff", hot: "#f8ffff" },
    { fill: "#15212d", glow: "#7dffd5", hot: "#f2fffa" }
  ],
  prison: [
    { fill: "#120f25", glow: "#8e84ff", hot: "#f3f4ff" },
    { fill: "#17193c", glow: "#73c5ff", hot: "#f5ffff" },
    { fill: "#20153a", glow: "#c39dff", hot: "#fff6ff" }
  ],
  blossom: [
    { fill: "#200f20", glow: "#ff77d4", hot: "#fff4fb" },
    { fill: "#16163a", glow: "#89a8ff", hot: "#f5f7ff" },
    { fill: "#131e32", glow: "#81f2ff", hot: "#f4ffff" }
  ],
  spiral: [
    { fill: "#0f1230", glow: "#8f84ff", hot: "#f4f4ff" },
    { fill: "#102443", glow: "#70b8ff", hot: "#f5ffff" },
    { fill: "#1a1236", glow: "#c57eff", hot: "#fff4ff" }
  ],
  orbit: [
    { fill: "#0b1828", glow: "#8fe8ff", hot: "#ffffff" },
    { fill: "#142347", glow: "#75a4ff", hot: "#f6f8ff" },
    { fill: "#1b2030", glow: "#d7ebff", hot: "#ffffff" }
  ],
  quake: [
    { fill: "#111726", glow: "#72dfff", hot: "#f5ffff" },
    { fill: "#151f36", glow: "#8ff6ff", hot: "#ffffff" },
    { fill: "#142a46", glow: "#7fa4ff", hot: "#f6f7ff" }
  ],
  lance: [
    { fill: "#0b1323", glow: "#8ce8ff", hot: "#ffffff" },
    { fill: "#102a4c", glow: "#69b5ff", hot: "#f4f8ff" },
    { fill: "#111a30", glow: "#d2f8ff", hot: "#ffffff" }
  ],
  mirror: [
    { fill: "#1c1023", glow: "#ff87dd", hot: "#fff5fc" },
    { fill: "#122041", glow: "#86b3ff", hot: "#f5f8ff" },
    { fill: "#211833", glow: "#d09bff", hot: "#fff5ff" }
  ],
  storm: [
    { fill: "#0f1627", glow: "#69fff2", hot: "#f4ffff" },
    { fill: "#18213f", glow: "#8d9aff", hot: "#f5f6ff" },
    { fill: "#15162b", glow: "#c482ff", hot: "#fff5ff" }
  ],
  throne: [
    { fill: "#131228", glow: "#ac8dff", hot: "#fff4ff" },
    { fill: "#1c1738", glow: "#ffe39b", hot: "#ffffff" },
    { fill: "#162244", glow: "#8ec8ff", hot: "#f5ffff" }
  ],
  maelstrom: [
    { fill: "#170f24", glow: "#ff73d0", hot: "#fff4fb" },
    { fill: "#101b35", glow: "#79a3ff", hot: "#f4f7ff" },
    { fill: "#0b1828", glow: "#6df0ff", hot: "#f4ffff" }
  ]
};
const HALL0KIN_PARTICLE_PROFILES = {
  attack: {
    burst: 24,
    rate: 60,
    offsetX: 0,
    offsetY: -36,
    spreadX: 56,
    spreadY: 22,
    vxMin: -240,
    vxMax: 240,
    vyMin: -240,
    vyMax: 70,
    sizeMin: 3,
    sizeMax: 8,
    lifeMin: 0.18,
    lifeMax: 0.42,
    layer: "front",
    gravity: 175,
    orientToFacing: false
  },
  attack2: {
    burst: 30,
    rate: 76,
    offsetX: 0,
    offsetY: -42,
    spreadX: 70,
    spreadY: 26,
    vxMin: -280,
    vxMax: 280,
    vyMin: -280,
    vyMax: 90,
    sizeMin: 4,
    sizeMax: 10,
    lifeMin: 0.2,
    lifeMax: 0.46,
    layer: "front",
    gravity: 170,
    orientToFacing: false
  },
  special: {
    burst: 28,
    rate: 72,
    offsetX: 0,
    offsetY: -78,
    spreadX: 36,
    spreadY: 34,
    vxMin: -130,
    vxMax: 130,
    vyMin: -340,
    vyMax: -40,
    sizeMin: 3,
    sizeMax: 9,
    lifeMin: 0.22,
    lifeMax: 0.5,
    layer: "front",
    gravity: 155,
    orientToFacing: false
  },
  dash: {
    burst: 34,
    rate: 124,
    offsetX: 44,
    offsetY: -30,
    spreadX: 72,
    spreadY: 18,
    vxMin: 140,
    vxMax: 420,
    vyMin: -150,
    vyMax: 80,
    sizeMin: 3,
    sizeMax: 8,
    lifeMin: 0.16,
    lifeMax: 0.36,
    layer: "back",
    gravity: 145
  },
  burst: {
    burst: 40,
    rate: 112,
    offsetX: 0,
    offsetY: -46,
    spreadX: 86,
    spreadY: 38,
    vxMin: -340,
    vxMax: 340,
    vyMin: -260,
    vyMax: 150,
    sizeMin: 4,
    sizeMax: 11,
    lifeMin: 0.22,
    lifeMax: 0.54,
    layer: "front",
    gravity: 160,
    orientToFacing: false
  },
  aoe: {
    burst: 50,
    rate: 132,
    offsetX: 0,
    offsetY: -48,
    spreadX: 98,
    spreadY: 42,
    vxMin: -390,
    vxMax: 390,
    vyMin: -300,
    vyMax: 140,
    sizeMin: 4,
    sizeMax: 12,
    lifeMin: 0.26,
    lifeMax: 0.58,
    layer: "front",
    gravity: 150,
    orientToFacing: false
  },
  dominion: {
    burst: 56,
    rate: 138,
    offsetX: 0,
    offsetY: -56,
    spreadX: 110,
    spreadY: 48,
    vxMin: -430,
    vxMax: 430,
    vyMin: -320,
    vyMax: 120,
    sizeMin: 4,
    sizeMax: 13,
    lifeMin: 0.28,
    lifeMax: 0.62,
    layer: "front",
    gravity: 142,
    orientToFacing: false
  },
  halo: {
    burst: 42,
    rate: 102,
    offsetX: 0,
    offsetY: -90,
    spreadX: 76,
    spreadY: 24,
    vxMin: -240,
    vxMax: 240,
    vyMin: -250,
    vyMax: 40,
    sizeMin: 3,
    sizeMax: 10,
    lifeMin: 0.22,
    lifeMax: 0.5,
    layer: "front",
    gravity: 130,
    orientToFacing: false
  },
  rain: {
    burst: 46,
    rate: 116,
    offsetX: 0,
    offsetY: -98,
    spreadX: 106,
    spreadY: 26,
    vxMin: -120,
    vxMax: 120,
    vyMin: 20,
    vyMax: 280,
    sizeMin: 3,
    sizeMax: 10,
    lifeMin: 0.24,
    lifeMax: 0.56,
    layer: "front",
    gravity: 175,
    orientToFacing: false
  },
  cataclysm: {
    burst: 70,
    rate: 152,
    offsetX: 0,
    offsetY: -58,
    spreadX: 122,
    spreadY: 62,
    vxMin: -470,
    vxMax: 470,
    vyMin: -340,
    vyMax: 200,
    sizeMin: 4,
    sizeMax: 14,
    lifeMin: 0.3,
    lifeMax: 0.7,
    layer: "front",
    gravity: 136,
    orientToFacing: false
  },
  spears: {
    burst: 44,
    rate: 124,
    offsetX: 48,
    offsetY: -42,
    spreadX: 34,
    spreadY: 18,
    vxMin: 210,
    vxMax: 480,
    vyMin: -120,
    vyMax: 90,
    sizeMin: 3,
    sizeMax: 10,
    lifeMin: 0.18,
    lifeMax: 0.42,
    layer: "front",
    gravity: 120
  },
  pulse: {
    burst: 54,
    rate: 146,
    offsetX: 0,
    offsetY: -50,
    spreadX: 96,
    spreadY: 54,
    vxMin: -360,
    vxMax: 360,
    vyMin: -260,
    vyMax: 180,
    sizeMin: 4,
    sizeMax: 13,
    lifeMin: 0.24,
    lifeMax: 0.62,
    layer: "front",
    gravity: 148,
    orientToFacing: false
  },
  rend: {
    burst: 38,
    rate: 118,
    offsetX: 30,
    offsetY: -34,
    spreadX: 44,
    spreadY: 20,
    vxMin: 90,
    vxMax: 320,
    vyMin: -170,
    vyMax: 90,
    sizeMin: 3,
    sizeMax: 10,
    lifeMin: 0.18,
    lifeMax: 0.46,
    layer: "front",
    gravity: 158
  },
  lattice: {
    burst: 48,
    rate: 130,
    offsetX: 0,
    offsetY: -48,
    spreadX: 96,
    spreadY: 40,
    vxMin: -320,
    vxMax: 320,
    vyMin: -220,
    vyMax: 120,
    sizeMin: 3,
    sizeMax: 11,
    lifeMin: 0.22,
    lifeMax: 0.54,
    layer: "front",
    gravity: 150,
    orientToFacing: false
  },
  forge: {
    burst: 52,
    rate: 136,
    offsetX: 0,
    offsetY: -88,
    spreadX: 56,
    spreadY: 40,
    vxMin: -180,
    vxMax: 180,
    vyMin: -320,
    vyMax: 40,
    sizeMin: 4,
    sizeMax: 12,
    lifeMin: 0.24,
    lifeMax: 0.58,
    layer: "front",
    gravity: 142,
    orientToFacing: false
  },
  prison: {
    burst: 58,
    rate: 140,
    offsetX: 0,
    offsetY: -52,
    spreadX: 104,
    spreadY: 54,
    vxMin: -280,
    vxMax: 280,
    vyMin: -260,
    vyMax: 150,
    sizeMin: 4,
    sizeMax: 12,
    lifeMin: 0.26,
    lifeMax: 0.62,
    layer: "front",
    gravity: 148,
    orientToFacing: false
  },
  blossom: {
    burst: 46,
    rate: 122,
    offsetX: 0,
    offsetY: -56,
    spreadX: 88,
    spreadY: 48,
    vxMin: -320,
    vxMax: 320,
    vyMin: -280,
    vyMax: 100,
    sizeMin: 3,
    sizeMax: 11,
    lifeMin: 0.24,
    lifeMax: 0.58,
    layer: "front",
    gravity: 152,
    orientToFacing: false
  },
  spiral: {
    burst: 50,
    rate: 132,
    offsetX: 0,
    offsetY: -60,
    spreadX: 84,
    spreadY: 52,
    vxMin: -260,
    vxMax: 260,
    vyMin: -260,
    vyMax: 160,
    sizeMin: 4,
    sizeMax: 12,
    lifeMin: 0.24,
    lifeMax: 0.6,
    layer: "front",
    gravity: 144,
    orientToFacing: false
  },
  orbit: {
    burst: 42,
    rate: 112,
    offsetX: 0,
    offsetY: -64,
    spreadX: 72,
    spreadY: 30,
    vxMin: -220,
    vxMax: 220,
    vyMin: -180,
    vyMax: 80,
    sizeMin: 3,
    sizeMax: 10,
    lifeMin: 0.22,
    lifeMax: 0.52,
    layer: "front",
    gravity: 136,
    orientToFacing: false
  },
  quake: {
    burst: 56,
    rate: 138,
    offsetX: 0,
    offsetY: -10,
    spreadX: 120,
    spreadY: 18,
    vxMin: -360,
    vxMax: 360,
    vyMin: -220,
    vyMax: 60,
    sizeMin: 4,
    sizeMax: 12,
    lifeMin: 0.22,
    lifeMax: 0.52,
    layer: "front",
    gravity: 210,
    orientToFacing: false
  },
  lance: {
    burst: 40,
    rate: 126,
    offsetX: 60,
    offsetY: -40,
    spreadX: 38,
    spreadY: 16,
    vxMin: 260,
    vxMax: 520,
    vyMin: -130,
    vyMax: 80,
    sizeMin: 3,
    sizeMax: 10,
    lifeMin: 0.18,
    lifeMax: 0.42,
    layer: "front",
    gravity: 126
  },
  mirror: {
    burst: 44,
    rate: 118,
    offsetX: 0,
    offsetY: -36,
    spreadX: 92,
    spreadY: 26,
    vxMin: -300,
    vxMax: 300,
    vyMin: -180,
    vyMax: 110,
    sizeMin: 3,
    sizeMax: 10,
    lifeMin: 0.22,
    lifeMax: 0.5,
    layer: "front",
    gravity: 160,
    orientToFacing: false
  },
  storm: {
    burst: 60,
    rate: 148,
    offsetX: 0,
    offsetY: -58,
    spreadX: 110,
    spreadY: 58,
    vxMin: -420,
    vxMax: 420,
    vyMin: -320,
    vyMax: 180,
    sizeMin: 4,
    sizeMax: 13,
    lifeMin: 0.26,
    lifeMax: 0.64,
    layer: "front",
    gravity: 146,
    orientToFacing: false
  },
  throne: {
    burst: 62,
    rate: 144,
    offsetX: 0,
    offsetY: -76,
    spreadX: 88,
    spreadY: 62,
    vxMin: -280,
    vxMax: 280,
    vyMin: -300,
    vyMax: 120,
    sizeMin: 4,
    sizeMax: 13,
    lifeMin: 0.28,
    lifeMax: 0.66,
    layer: "front",
    gravity: 138,
    orientToFacing: false
  },
  maelstrom: {
    burst: 76,
    rate: 168,
    offsetX: 0,
    offsetY: -60,
    spreadX: 132,
    spreadY: 72,
    vxMin: -520,
    vxMax: 520,
    vyMin: -360,
    vyMax: 220,
    sizeMin: 4,
    sizeMax: 15,
    lifeMin: 0.3,
    lifeMax: 0.76,
    layer: "front",
    gravity: 134,
    orientToFacing: false
  }
};
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
  attack: { frames: 5, pixelScale: 4, offsetX: -54, offsetY: -76, width: 44, height: 28, orientToFacing: false },
  attack2: { frames: 6, pixelScale: 4, offsetX: -64, offsetY: -82, width: 48, height: 30, orientToFacing: false },
  special: { frames: 7, pixelScale: 4, offsetX: -38, offsetY: -126, width: 30, height: 40, orientToFacing: false },
  dash: { frames: 6, pixelScale: 4, offsetX: 2, offsetY: -82, width: 56, height: 22, orientToFacing: true },
  burst: { frames: 9, pixelScale: 4, offsetX: -74, offsetY: -102, width: 48, height: 38, orientToFacing: false },
  aoe: { frames: 9, pixelScale: 4, offsetX: -98, offsetY: -120, width: 54, height: 42, orientToFacing: false },
  dominion: { frames: 10, pixelScale: 4, offsetX: -106, offsetY: -130, width: 58, height: 46, orientToFacing: false },
  halo: { frames: 7, pixelScale: 4, offsetX: -92, offsetY: -146, width: 50, height: 38, orientToFacing: false },
  rain: { frames: 9, pixelScale: 4, offsetX: -100, offsetY: -150, width: 54, height: 46, orientToFacing: false },
  cataclysm: { frames: 12, pixelScale: 4, offsetX: -118, offsetY: -138, width: 62, height: 52, orientToFacing: false },
  spears: { frames: 7, pixelScale: 4, offsetX: 12, offsetY: -92, width: 64, height: 28, orientToFacing: true },
  pulse: { frames: 9, pixelScale: 4, offsetX: -98, offsetY: -118, width: 56, height: 48, orientToFacing: false },
  rend: { frames: 7, pixelScale: 4, offsetX: 0, offsetY: -88, width: 56, height: 30, orientToFacing: true },
  lattice: { frames: 8, pixelScale: 4, offsetX: -112, offsetY: -108, width: 62, height: 46, orientToFacing: false },
  forge: { frames: 8, pixelScale: 4, offsetX: -92, offsetY: -132, width: 48, height: 52, orientToFacing: false },
  prison: { frames: 10, pixelScale: 4, offsetX: -108, offsetY: -126, width: 58, height: 50, orientToFacing: false },
  blossom: { frames: 8, pixelScale: 4, offsetX: -88, offsetY: -108, width: 54, height: 42, orientToFacing: false },
  spiral: { frames: 9, pixelScale: 4, offsetX: -96, offsetY: -122, width: 58, height: 50, orientToFacing: false },
  orbit: { frames: 8, pixelScale: 4, offsetX: -102, offsetY: -126, width: 60, height: 46, orientToFacing: false },
  quake: { frames: 8, pixelScale: 4, offsetX: -118, offsetY: -66, width: 68, height: 24, orientToFacing: false },
  lance: { frames: 7, pixelScale: 4, offsetX: 20, offsetY: -96, width: 76, height: 24, orientToFacing: true },
  mirror: { frames: 7, pixelScale: 4, offsetX: -102, offsetY: -90, width: 64, height: 30, orientToFacing: false },
  storm: { frames: 10, pixelScale: 4, offsetX: -106, offsetY: -126, width: 62, height: 50, orientToFacing: false },
  throne: { frames: 11, pixelScale: 4, offsetX: -108, offsetY: -142, width: 62, height: 58, orientToFacing: false },
  maelstrom: { frames: 12, pixelScale: 4, offsetX: -124, offsetY: -144, width: 70, height: 62, orientToFacing: false }
};
const HALL0KIN_AURA_STYLES = {
  attack: { alpha: 0.14, scaleBoost: 1, offsetX: -8, offsetY: -6 },
  attack2: { alpha: 0.16, scaleBoost: 1, offsetX: -10, offsetY: -8 },
  special: { alpha: 0.18, scaleBoost: 2, offsetX: -8, offsetY: -14 },
  dash: { alpha: 0.14, scaleBoost: 1, offsetX: -2, offsetY: -6 },
  burst: { alpha: 0.2, scaleBoost: 2, offsetX: -12, offsetY: -10 },
  aoe: { alpha: 0.22, scaleBoost: 2, offsetX: -14, offsetY: -12 },
  dominion: { alpha: 0.24, scaleBoost: 2, offsetX: -16, offsetY: -16 },
  halo: { alpha: 0.18, scaleBoost: 1, offsetX: -10, offsetY: -14 },
  rain: { alpha: 0.18, scaleBoost: 2, offsetX: -14, offsetY: -18 },
  cataclysm: { alpha: 0.28, scaleBoost: 3, offsetX: -18, offsetY: -18 },
  spears: { alpha: 0.16, scaleBoost: 1, offsetX: 6, offsetY: -10 },
  pulse: { alpha: 0.22, scaleBoost: 2, offsetX: -12, offsetY: -12 },
  rend: { alpha: 0.18, scaleBoost: 1, offsetX: 0, offsetY: -10 },
  lattice: { alpha: 0.2, scaleBoost: 2, offsetX: -14, offsetY: -12 },
  forge: { alpha: 0.2, scaleBoost: 2, offsetX: -10, offsetY: -16 },
  prison: { alpha: 0.22, scaleBoost: 2, offsetX: -16, offsetY: -14 },
  blossom: { alpha: 0.18, scaleBoost: 2, offsetX: -10, offsetY: -12 },
  spiral: { alpha: 0.2, scaleBoost: 2, offsetX: -12, offsetY: -14 },
  orbit: { alpha: 0.18, scaleBoost: 2, offsetX: -14, offsetY: -14 },
  quake: { alpha: 0.16, scaleBoost: 2, offsetX: -18, offsetY: -2 },
  lance: { alpha: 0.18, scaleBoost: 1, offsetX: 8, offsetY: -10 },
  mirror: { alpha: 0.18, scaleBoost: 2, offsetX: -12, offsetY: -10 },
  storm: { alpha: 0.24, scaleBoost: 2, offsetX: -16, offsetY: -16 },
  throne: { alpha: 0.24, scaleBoost: 3, offsetX: -16, offsetY: -18 },
  maelstrom: { alpha: 0.3, scaleBoost: 3, offsetX: -20, offsetY: -20 }
};
const HALL0KIN_ACTION_FX = {
  attack: { shake: 4, flashColor: "rgba(72, 217, 255, 0.12)", flashAlpha: 0.12 },
  attack2: { shake: 5, flashColor: "rgba(255, 95, 207, 0.12)", flashAlpha: 0.14 },
  special: { shake: 6, flashColor: "rgba(128, 233, 255, 0.14)", flashAlpha: 0.16 },
  dash: { shake: 7, flashColor: "rgba(57, 255, 200, 0.12)", flashAlpha: 0.14 },
  burst: { shake: 7, flashColor: "rgba(158, 125, 255, 0.14)", flashAlpha: 0.16 },
  aoe: { shake: 8, flashColor: "rgba(102, 228, 255, 0.14)", flashAlpha: 0.18 },
  dominion: { shake: 8, flashColor: "rgba(125, 124, 255, 0.16)", flashAlpha: 0.2 },
  halo: { shake: 6, flashColor: "rgba(255, 241, 168, 0.14)", flashAlpha: 0.16 },
  rain: { shake: 7, flashColor: "rgba(102, 200, 255, 0.14)", flashAlpha: 0.16 },
  cataclysm: { shake: 10, flashColor: "rgba(255, 111, 181, 0.18)", flashAlpha: 0.24 },
  spears: { shake: 7, flashColor: "rgba(140, 244, 255, 0.14)", flashAlpha: 0.16 },
  pulse: { shake: 8, flashColor: "rgba(178, 125, 255, 0.16)", flashAlpha: 0.2 },
  rend: { shake: 7, flashColor: "rgba(255, 102, 122, 0.14)", flashAlpha: 0.18 },
  lattice: { shake: 8, flashColor: "rgba(103, 242, 255, 0.16)", flashAlpha: 0.18 },
  forge: { shake: 8, flashColor: "rgba(93, 255, 242, 0.16)", flashAlpha: 0.18 },
  prison: { shake: 9, flashColor: "rgba(142, 132, 255, 0.18)", flashAlpha: 0.22 },
  blossom: { shake: 8, flashColor: "rgba(255, 119, 212, 0.16)", flashAlpha: 0.18 },
  spiral: { shake: 8, flashColor: "rgba(143, 132, 255, 0.16)", flashAlpha: 0.18 },
  orbit: { shake: 7, flashColor: "rgba(143, 232, 255, 0.14)", flashAlpha: 0.16 },
  quake: { shake: 10, flashColor: "rgba(114, 223, 255, 0.16)", flashAlpha: 0.2 },
  lance: { shake: 8, flashColor: "rgba(140, 232, 255, 0.16)", flashAlpha: 0.18 },
  mirror: { shake: 8, flashColor: "rgba(255, 135, 221, 0.16)", flashAlpha: 0.18 },
  storm: { shake: 10, flashColor: "rgba(105, 255, 242, 0.18)", flashAlpha: 0.22 },
  throne: { shake: 11, flashColor: "rgba(172, 141, 255, 0.2)", flashAlpha: 0.24 },
  maelstrom: { shake: 12, flashColor: "rgba(255, 115, 208, 0.22)", flashAlpha: 0.28 }
};
const HALL0KIN_ACTION_TRANSFORMS = {
  attack: {
    offsetX: [0, 8, 20, 32, 12],
    offsetY: [0, -2, -4, -2, 0],
    scaleX: [1, 1.02, 1.06, 1.08, 1.02],
    scaleY: [1, 1, 1.02, 1.04, 1],
    shadowScale: [1, 1.08, 1.18, 1.22, 1.06]
  },
  attack2: {
    offsetX: [0, 6, 18, 26, 18, 0],
    offsetY: [0, -1, -3, -4, -2, 0],
    scaleX: [1, 1.03, 1.06, 1.1, 1.04, 1],
    scaleY: [1, 1, 1.04, 1.06, 1.02, 1],
    shadowScale: [1, 1.1, 1.22, 1.34, 1.16, 1]
  },
  special: {
    offsetX: [0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -8, -18, -28, -20, -10, 0],
    scaleX: [1, 1.01, 1.02, 1.04, 1.03, 1.02, 1],
    scaleY: [1, 1.02, 1.08, 1.14, 1.08, 1.04, 1],
    shadowScale: [1, 1, 1.04, 1.1, 1.04, 1, 1]
  },
  dash: {
    offsetX: [8, 24, 48, 66, 82, 48],
    offsetY: [0, -4, -6, -4, -2, 0],
    scaleX: [1.02, 1.06, 1.1, 1.12, 1.08, 1.02],
    scaleY: [1, 1, 1.02, 1.02, 1, 1],
    shadowScale: [1.08, 1.18, 1.3, 1.44, 1.2, 1.04]
  },
  burst: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -6, -10, -12, -10, -8, -6, -2, 0],
    scaleX: [1, 1.04, 1.08, 1.1, 1.12, 1.08, 1.06, 1.02, 1],
    scaleY: [1, 1.02, 1.06, 1.08, 1.1, 1.06, 1.04, 1.02, 1],
    shadowScale: [1, 1.14, 1.28, 1.42, 1.54, 1.38, 1.22, 1.08, 1]
  },
  aoe: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -4, -8, -10, -12, -8, -4, -2, 0],
    scaleX: [0.96, 0.98, 1, 1.04, 1.12, 1.18, 1.1, 1.04, 1],
    scaleY: [1.04, 1.08, 1.12, 1.16, 1.2, 1.14, 1.08, 1.02, 1],
    shadowScale: [1, 1.18, 1.38, 1.58, 1.8, 1.66, 1.38, 1.18, 1]
  },
  dominion: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -6, -12, -18, -22, -18, -12, -8, -4, 0],
    scaleX: [1, 1.02, 1.04, 1.06, 1.08, 1.08, 1.06, 1.04, 1.02, 1],
    scaleY: [1, 1.04, 1.08, 1.12, 1.14, 1.12, 1.1, 1.06, 1.02, 1],
    shadowScale: [1.08, 1.18, 1.3, 1.44, 1.58, 1.52, 1.38, 1.24, 1.12, 1]
  },
  halo: {
    offsetX: [0, 0, 2, 4, 2, 0, 0],
    offsetY: [0, -10, -16, -20, -18, -12, 0],
    scaleX: [1, 1.01, 1.02, 1.04, 1.03, 1.02, 1],
    scaleY: [1, 1.04, 1.08, 1.12, 1.08, 1.04, 1],
    shadowScale: [1, 1.08, 1.18, 1.28, 1.18, 1.08, 1]
  },
  rain: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -8, -12, -14, -14, -12, -10, -6, 0],
    scaleX: [1, 1.01, 1.02, 1.04, 1.04, 1.03, 1.02, 1.01, 1],
    scaleY: [1, 1.06, 1.1, 1.12, 1.12, 1.1, 1.08, 1.04, 1],
    shadowScale: [1, 1.08, 1.22, 1.34, 1.4, 1.32, 1.18, 1.08, 1]
  },
  cataclysm: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -8, -16, -22, -26, -30, -28, -22, -16, -10, -4, 0],
    scaleX: [0.98, 1, 1.04, 1.08, 1.12, 1.16, 1.18, 1.14, 1.1, 1.06, 1.02, 1],
    scaleY: [1.02, 1.06, 1.1, 1.14, 1.18, 1.22, 1.24, 1.18, 1.12, 1.08, 1.04, 1],
    shadowScale: [1.18, 1.34, 1.5, 1.7, 1.9, 2.08, 2.18, 1.88, 1.56, 1.32, 1.12, 1]
  },
  spears: {
    offsetX: [0, 10, 22, 34, 44, 36, 18],
    offsetY: [0, -2, -4, -6, -4, -2, 0],
    scaleX: [1, 1.03, 1.08, 1.12, 1.14, 1.08, 1.02],
    scaleY: [1, 1, 1.02, 1.04, 1.02, 1.01, 1],
    shadowScale: [1, 1.08, 1.2, 1.34, 1.42, 1.22, 1.08]
  },
  pulse: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -4, -10, -16, -20, -16, -10, -4, 0],
    scaleX: [0.98, 1, 1.04, 1.08, 1.12, 1.08, 1.04, 1.02, 1],
    scaleY: [1.02, 1.06, 1.12, 1.18, 1.22, 1.16, 1.1, 1.04, 1],
    shadowScale: [1.02, 1.12, 1.3, 1.5, 1.72, 1.5, 1.28, 1.12, 1]
  },
  rend: {
    offsetX: [0, 8, 20, 28, 24, 12, 0],
    offsetY: [0, -2, -4, -6, -4, -2, 0],
    scaleX: [1, 1.04, 1.1, 1.14, 1.1, 1.04, 1],
    scaleY: [1, 1.02, 1.04, 1.06, 1.04, 1.02, 1],
    shadowScale: [1, 1.1, 1.26, 1.4, 1.26, 1.1, 1]
  },
  lattice: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -4, -8, -10, -8, -6, -4, 0],
    scaleX: [1, 1.02, 1.04, 1.08, 1.1, 1.08, 1.04, 1],
    scaleY: [1, 1.04, 1.08, 1.12, 1.1, 1.08, 1.04, 1],
    shadowScale: [1.02, 1.16, 1.3, 1.46, 1.52, 1.34, 1.18, 1.04]
  },
  forge: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -6, -12, -18, -22, -18, -10, 0],
    scaleX: [1, 0.98, 1, 1.02, 1.04, 1.02, 1, 1],
    scaleY: [1, 1.06, 1.14, 1.22, 1.28, 1.18, 1.08, 1],
    shadowScale: [1.04, 1.18, 1.34, 1.54, 1.72, 1.42, 1.18, 1]
  },
  prison: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -4, -8, -12, -14, -14, -12, -8, -4, 0],
    scaleX: [1, 1.02, 1.04, 1.06, 1.08, 1.08, 1.06, 1.04, 1.02, 1],
    scaleY: [1, 1.04, 1.08, 1.12, 1.16, 1.16, 1.12, 1.08, 1.04, 1],
    shadowScale: [1.02, 1.16, 1.32, 1.48, 1.6, 1.58, 1.42, 1.26, 1.12, 1]
  },
  blossom: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -2, -4, -6, -8, -6, -4, -2],
    scaleX: [1, 1.02, 1.06, 1.1, 1.12, 1.08, 1.04, 1],
    scaleY: [1, 1.02, 1.04, 1.08, 1.1, 1.08, 1.04, 1],
    shadowScale: [1, 1.1, 1.24, 1.4, 1.5, 1.34, 1.18, 1.04]
  },
  spiral: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -4, -8, -12, -16, -14, -10, -6, 0],
    scaleX: [1, 1.01, 1.03, 1.05, 1.08, 1.08, 1.06, 1.03, 1],
    scaleY: [1, 1.04, 1.08, 1.12, 1.16, 1.14, 1.1, 1.06, 1],
    shadowScale: [1, 1.08, 1.18, 1.32, 1.48, 1.44, 1.28, 1.12, 1]
  },
  orbit: {
    offsetX: [0, 4, 8, 10, 8, 4, 0, -2],
    offsetY: [0, -4, -8, -10, -8, -6, -4, 0],
    scaleX: [1, 1.02, 1.04, 1.06, 1.06, 1.04, 1.02, 1],
    scaleY: [1, 1.02, 1.06, 1.08, 1.08, 1.06, 1.02, 1],
    shadowScale: [1, 1.08, 1.18, 1.28, 1.26, 1.18, 1.08, 1]
  },
  quake: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, 4, 8, 10, 6, 2, 0, 0],
    scaleX: [1.02, 1.06, 1.1, 1.12, 1.08, 1.04, 1.02, 1],
    scaleY: [0.98, 0.96, 0.94, 0.92, 0.96, 0.98, 1, 1],
    shadowScale: [1.08, 1.18, 1.32, 1.42, 1.24, 1.12, 1.04, 1]
  },
  lance: {
    offsetX: [0, 14, 32, 50, 62, 40, 12],
    offsetY: [0, -2, -4, -6, -4, -2, 0],
    scaleX: [1, 1.04, 1.08, 1.12, 1.14, 1.08, 1.02],
    scaleY: [1, 1, 1.02, 1.04, 1.02, 1.01, 1],
    shadowScale: [1, 1.12, 1.24, 1.4, 1.48, 1.28, 1.1]
  },
  mirror: {
    offsetX: [0, 0, 4, 8, 4, 0, 0],
    offsetY: [0, -2, -4, -4, -2, 0, 0],
    scaleX: [1, 1.02, 1.04, 1.08, 1.04, 1.02, 1],
    scaleY: [1, 1.02, 1.04, 1.06, 1.04, 1.02, 1],
    shadowScale: [1, 1.08, 1.2, 1.34, 1.2, 1.08, 1]
  },
  storm: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -4, -8, -12, -16, -18, -14, -10, -6, 0],
    scaleX: [1, 1.02, 1.04, 1.08, 1.1, 1.12, 1.1, 1.06, 1.02, 1],
    scaleY: [1, 1.04, 1.08, 1.12, 1.16, 1.18, 1.14, 1.1, 1.04, 1],
    shadowScale: [1.04, 1.16, 1.3, 1.48, 1.66, 1.74, 1.56, 1.34, 1.14, 1]
  },
  throne: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -6, -12, -18, -22, -24, -20, -16, -10, -4, 0],
    scaleX: [1, 1.01, 1.02, 1.04, 1.06, 1.08, 1.08, 1.06, 1.04, 1.02, 1],
    scaleY: [1, 1.06, 1.12, 1.18, 1.22, 1.26, 1.2, 1.14, 1.08, 1.04, 1],
    shadowScale: [1.02, 1.12, 1.28, 1.46, 1.62, 1.78, 1.6, 1.4, 1.22, 1.08, 1]
  },
  maelstrom: {
    offsetX: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    offsetY: [0, -6, -12, -18, -24, -30, -34, -28, -20, -12, -6, 0],
    scaleX: [0.98, 1, 1.04, 1.08, 1.12, 1.16, 1.2, 1.16, 1.12, 1.08, 1.04, 1],
    scaleY: [1.02, 1.06, 1.12, 1.18, 1.24, 1.3, 1.34, 1.24, 1.16, 1.1, 1.04, 1],
    shadowScale: [1.1, 1.24, 1.4, 1.62, 1.82, 2.02, 2.2, 1.92, 1.62, 1.36, 1.16, 1]
  }
};

const ANIMATION_LABELS = {
  idle: "Idle",
  run: "Run",
  jump: "Jump",
  fall: "Fall",
  attack: "Abyss Overture",
  attack2: "Null Fang Waltz",
  dash: "Phantom Breaker",
  special: "Rift Spire",
  burst: "Dread Bloom",
  aoe: "Eclipse Choir",
  dominion: "Gloom Cathedral",
  halo: "Crown Sever",
  rain: "Mourning Meteors",
  cataclysm: "Ebon Genesis",
  spears: "Obsidian Volley",
  pulse: "Zero Pulse",
  rend: "Wraith Talons",
  lattice: "Umbral Lattice",
  forge: "Nether Forge",
  prison: "Grave Prison",
  blossom: "Midnight Blossom",
  spiral: "Veil Spiral",
  orbit: "Nebula Orbit",
  quake: "Hollow Quake",
  lance: "Astral Lance",
  mirror: "Mirror Maw",
  storm: "Tenebre Storm",
  throne: "Void Throne",
  maelstrom: "Abyss Maelstrom",
  hit: "Hit",
  death: "Death"
};

function anim(src, frameWidth, frameHeight, frames, fps, loop = true, options = {}) {
  return { src, frameWidth, frameHeight, frames, fps, loop, ...options };
}

const ROLE_LABELS = {
  protagonist: "Protagonist",
  npc: "NPC",
  mob: "Mob",
  boss: "Boss"
};
const ROLE_TARGET_HEIGHTS = {
  protagonist: 132,
  npc: 132,
  mob: 128,
  boss: 148
};

const NON_ACTION_ANIMATION_KEYS = new Set(["idle", "run", "walk", "jump", "fall"]);

function sheetAnim(src, frameWidth, frameHeight, fps, loop = true, options = {}) {
  const { frames = null, autoTrim = true, trimPadding = 1, ...rest } = options;
  return anim(src, frameWidth, frameHeight, frames, fps, loop, {
    ...rest,
    autoTrim,
    trimPadding
  });
}

function sequenceAnim(frameSources, frameWidth, frameHeight, fps, loop = true, options = {}) {
  const { autoTrim = true, trimPadding = 1, ...rest } = options;
  return anim(frameSources[0], frameWidth, frameHeight, frameSources.length, fps, loop, {
    ...rest,
    autoTrim,
    trimPadding,
    frameSources
  });
}

function fullImageAnim(src, frameWidth, frameHeight, frames, fps, loop = true, options = {}) {
  const { autoTrim = true, trimPadding = 1, ...rest } = options;
  return anim(src, frameWidth, frameHeight, frames, fps, loop, {
    ...rest,
    autoTrim,
    trimPadding,
    fullImage: true
  });
}

function numberedFrameSources(basePath, prefix, count, suffix = ".png") {
  return Array.from({ length: count }, (_, index) => `${basePath}/${prefix}${index + 1}${suffix}`);
}

function getRoleLabel(role) {
  return ROLE_LABELS[role] || "Character";
}

function formatAnimationKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/(\D)(\d)/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const CHARACTERS = {
  hallokin: {
    name: "Hallokin",
    role: "protagonist",
    description: "Source-backed Hallokin local pack using the official free movement and combat sheets that are present in this folder.",
    anchor: { x: 57, y: 80 },
    scaleNormalized: false,
    comboSequence: ["attack", "special", "dash"],
    secondaryActionKeys: ["dash", "special", "hit"],
    actions: [
      { key: "attack", label: "Forward Attack", hint: "Official local slash sheet" },
      { key: "special", label: "Up Attack", hint: "Official upward slash sheet" },
      { key: "dash", label: "Jump Forward Attack", hint: "Official aerial forward slash sheet" },
      { key: "hit", label: "Hit", hint: "Official damage reaction sheet" }
    ],
    sourceNote: "Aligned to the local Hallokin free PNG pack instead of the earlier custom 25-skill remix.",
    scale: 3.4,
    moveSpeed: 275,
    jumpStrength: 760,
    animations: {
      idle: anim("characters/protagonist/Hallokin (protagonist)/png (free)/idle.png", 96, 128, 6, 10, true, {
        frameOrder: [0, 2, 4, 6, 8, 10],
        trim: { x: 36, y: 48, width: 40, height: 36 },
        effect: { type: "hallokinShadowHero" }
      }),
      run: anim("characters/protagonist/Hallokin (protagonist)/png (free)/run.png", 96, 128, 4, 12, true, {
        frameOrder: [0, 2, 4, 6],
        trim: { x: 34, y: 48, width: 42, height: 36 },
        effect: { type: "hallokinShadowHero" }
      }),
      jump: anim("characters/protagonist/Hallokin (protagonist)/png (free)/jump.png", 96, 128, 3, 12, false, {
        frameOrder: [0, 2, 4],
        trim: { x: 32, y: 44, width: 44, height: 40 },
        effect: { type: "hallokinShadowHero" }
      }),
      fall: anim("characters/protagonist/Hallokin (protagonist)/png (free)/fall.png", 96, 128, 3, 12, true, {
        frameOrder: [0, 2, 4],
        trim: { x: 32, y: 44, width: 44, height: 40 },
        effect: { type: "hallokinShadowHero" }
      }),
      attack: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png", 96, 128, 5, 18, false, {
        frameOrder: [0, 0, 2, 4, 6],
        trim: { x: 22, y: 44, width: 70, height: 40 },
        particleProfile: "attack",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "attack" }
      }),
      attack2: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png", 96, 128, 6, 16, false, {
        frameOrder: [2, 4, 6, 8, 10, 12],
        trim: { x: 16, y: 40, width: 78, height: 44 },
        particleProfile: "attack2",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "attack2" }
      }),
      rend: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png", 96, 128, 7, 17, false, {
        frameOrder: [2, 4, 6, 8, 10, 12, 10],
        trim: { x: 14, y: 38, width: 82, height: 46 },
        particleProfile: "rend",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "rend" }
      }),
      dash: anim("characters/protagonist/Hallokin (protagonist)/png (free)/jump - attack forwared.png", 96, 128, 6, 21, false, {
        frameOrder: [0, 0, 2, 4, 6, 8],
        trim: { x: 14, y: 30, width: 80, height: 46 },
        particleProfile: "dash",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "dash" }
      }),
      spears: anim("characters/protagonist/Hallokin (protagonist)/png (free)/jump - attack forwared.png", 96, 128, 7, 16, false, {
        frameOrder: [0, 2, 4, 6, 8, 8, 6],
        trim: { x: 10, y: 24, width: 84, height: 56 },
        particleProfile: "spears",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "spears" }
      }),
      special: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 7, 14, false, {
        frameOrder: [0, 0, 2, 4, 6, 8, 10],
        trim: { x: 18, y: 14, width: 62, height: 66 },
        particleProfile: "special",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "special" }
      }),
      burst: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png", 96, 128, 9, 18, false, {
        frameOrder: [0, 0, 2, 4, 6, 8, 10, 12, 10],
        trim: { x: 14, y: 38, width: 82, height: 48 },
        particleProfile: "burst",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "burst" }
      }),
      pulse: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 9, 15, false, {
        frameOrder: [0, 2, 4, 6, 8, 10, 10, 8, 6],
        trim: { x: 8, y: 8, width: 80, height: 78 },
        particleProfile: "pulse",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "pulse" }
      }),
      aoe: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 9, 16, false, {
        frameOrder: [0, 0, 2, 4, 6, 8, 10, 8, 6],
        trim: { x: 8, y: 8, width: 80, height: 76 },
        particleProfile: "aoe",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "aoe" }
      }),
      dominion: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 10, 13, false, {
        frameOrder: [10, 10, 8, 6, 4, 2, 0, 2, 4, 6],
        trim: { x: 10, y: 6, width: 76, height: 78 },
        particleProfile: "dominion",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "dominion" }
      }),
      halo: anim("characters/protagonist/Hallokin (protagonist)/png (free)/jump - attack forwared.png", 96, 128, 7, 17, false, {
        frameOrder: [0, 0, 2, 4, 6, 8, 6],
        trim: { x: 10, y: 24, width: 84, height: 56 },
        particleProfile: "halo",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "halo" }
      }),
      rain: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 9, 15, false, {
        frameOrder: [2, 2, 4, 6, 8, 10, 10, 8, 6],
        trim: { x: 12, y: 10, width: 72, height: 74 },
        particleProfile: "rain",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "rain" }
      }),
      cataclysm: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 12, 12, false, {
        frameOrder: [0, 0, 2, 4, 6, 8, 10, 10, 8, 6, 4, 2],
        trim: { x: 4, y: 4, width: 86, height: 80 },
        particleProfile: "cataclysm",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "cataclysm" }
      }),
      lattice: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png", 96, 128, 8, 17, false, {
        frameOrder: [0, 2, 4, 6, 8, 10, 12, 10],
        trim: { x: 10, y: 34, width: 84, height: 52 },
        particleProfile: "lattice",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "lattice" }
      }),
      forge: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 8, 14, false, {
        frameOrder: [0, 0, 2, 4, 6, 8, 10, 8],
        trim: { x: 14, y: 6, width: 68, height: 80 },
        particleProfile: "forge",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "forge" }
      }),
      prison: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 10, 12, false, {
        frameOrder: [10, 8, 6, 4, 2, 0, 0, 2, 4, 6],
        trim: { x: 8, y: 6, width: 80, height: 78 },
        particleProfile: "prison",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "prison" }
      }),
      blossom: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png", 96, 128, 8, 17, false, {
        frameOrder: [0, 2, 4, 6, 8, 10, 12, 8],
        trim: { x: 12, y: 36, width: 82, height: 48 },
        particleProfile: "blossom",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "blossom" }
      }),
      spiral: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 9, 16, false, {
        frameOrder: [2, 4, 6, 8, 10, 10, 8, 6, 4],
        trim: { x: 10, y: 8, width: 76, height: 76 },
        particleProfile: "spiral",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "spiral" }
      }),
      orbit: anim("characters/protagonist/Hallokin (protagonist)/png (free)/jump - attack forwared.png", 96, 128, 8, 15, false, {
        frameOrder: [0, 0, 2, 4, 6, 8, 8, 6],
        trim: { x: 12, y: 20, width: 82, height: 60 },
        particleProfile: "orbit",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "orbit" }
      }),
      quake: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png", 96, 128, 8, 15, false, {
        frameOrder: [0, 2, 4, 6, 8, 10, 8, 6],
        trim: { x: 10, y: 42, width: 84, height: 40 },
        particleProfile: "quake",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "quake" }
      }),
      lance: anim("characters/protagonist/Hallokin (protagonist)/png (free)/jump - attack forwared.png", 96, 128, 7, 18, false, {
        frameOrder: [0, 2, 4, 6, 8, 6, 4],
        trim: { x: 10, y: 24, width: 84, height: 56 },
        particleProfile: "lance",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "lance" }
      }),
      mirror: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack-2.png", 96, 128, 7, 18, false, {
        frameOrder: [12, 10, 8, 6, 4, 2, 0],
        trim: { x: 12, y: 38, width: 82, height: 46 },
        particleProfile: "mirror",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "mirror" }
      }),
      storm: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 10, 15, false, {
        frameOrder: [0, 2, 4, 6, 8, 10, 8, 6, 4, 2],
        trim: { x: 8, y: 6, width: 82, height: 80 },
        particleProfile: "storm",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "storm" }
      }),
      throne: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 11, 13, false, {
        frameOrder: [0, 0, 2, 4, 6, 8, 10, 10, 8, 6, 4],
        trim: { x: 6, y: 4, width: 84, height: 82 },
        particleProfile: "throne",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "throne" }
      }),
      maelstrom: anim("characters/protagonist/Hallokin (protagonist)/png (free)/attack up.png", 96, 128, 12, 12, false, {
        frameOrder: [10, 8, 6, 4, 2, 0, 2, 4, 6, 8, 10, 8],
        trim: { x: 4, y: 2, width: 88, height: 84 },
        particleProfile: "maelstrom",
        effect: { type: "hallokinShadowHero" },
        slashEffect: { key: "maelstrom" }
      }),
      hit: anim("characters/protagonist/Hallokin (protagonist)/png (free)/hit.png", 96, 128, 1, 8, false, {
        frameOrder: [0],
        trim: { x: 36, y: 48, width: 40, height: 36 },
        effect: { type: "hallokinShadowHero" }
      })
    }
  },
  shadeflit: {
    name: "Shadeflit",
    role: "npc",
    description: "NPC scout with fast movement and a clean turn animation.",
    anchor: { x: 62, y: 106 },
    scale: 3.05,
    moveSpeed: 190,
    jumpStrength: 720,
    animations: {
      idle: sheetAnim("characters/npc/Shadeflit (npc)/idle.png", 277, 161, 10, true, {
        trim: { x: 30, y: 62, width: 66, height: 46 }
      }),
      run: sheetAnim("characters/npc/Shadeflit (npc)/run.png", 277, 161, 9, true, {
        trim: { x: 30, y: 66, width: 66, height: 42 }
      }),
      special: sheetAnim("characters/npc/Shadeflit (npc)/run-turn.png", 277, 161, 6, false, {
        label: "Turn",
        hint: "Pivot turn preview",
        trim: { x: 30, y: 62, width: 66, height: 46 }
      })
    }
  },
  blindHuntress: {
    name: "Blind Huntress",
    role: "npc",
    description: "NPC assassin pack with the full 15-animation sheet set.",
    scale: 1.95,
    moveSpeed: 320,
    jumpStrength: 780,
    animations: {
      idle: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/1 - Idle.png", 240, 128, 12, true),
      run: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/2 - Run.png", 240, 128, 14, true),
      jump: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/3 - jump.png", 240, 128, 12, false),
      midair: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/4 - mid-air.png", 240, 128, 8, false, {
        label: "Mid Air",
        hint: "Mid-air hold pose"
      }),
      fall: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/5 - fall.png", 240, 128, 12, true),
      dash: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/6 - dash.png", 240, 128, 18, false, {
        label: "Dash",
        hint: "Ground dash burst",
        effect: { type: "shadowHighlights" }
      }),
      jumpAttackUp: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/7 - jump-up-attack.png", 240, 128, 16, false, {
        label: "Jump Up Attack",
        hint: "Rising blade burst",
        effect: { type: "shadowHighlights" }
      }),
      jumpAttackDown: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/8 - jump-down-attack.png", 240, 128, 16, false, {
        label: "Jump Down Attack",
        hint: "Falling strike burst",
        effect: { type: "shadowHighlights" }
      }),
      idleAttackUp: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/9 - idle-up-attack.png", 240, 128, 16, false, {
        label: "Idle Up Attack",
        hint: "Standing upward cut",
        effect: { type: "shadowHighlights" }
      }),
      attack: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/10 - attack 1.png", 240, 128, 18, false, {
        label: "Attack 1",
        hint: "Main slash chain",
        effect: { type: "shadowHighlights" }
      }),
      attack3: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/11 - attack 3.png", 240, 128, 18, false, {
        label: "Attack 3",
        hint: "Heavy combo finisher",
        effect: { type: "shadowHighlights" }
      }),
      dashAttack: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/12 - dash attack.png", 240, 128, 18, false, {
        label: "Dash Attack",
        hint: "Dash follow-up slash",
        effect: { type: "shadowHighlights" }
      }),
      specialDash: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/13 - spetial dash.png", 240, 128, 18, false, {
        label: "Special Dash",
        hint: "Extended shadow dash",
        effect: { type: "shadowHighlights" }
      }),
      hit: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/14 - hit.png", 240, 128, 10, false, {
        label: "Hit",
        hint: "Damage reaction",
        effect: { type: "shadowHighlights" }
      }),
      death: sheetAnim("characters/npc/The Blind Huntress (npc)/Sprite Sheet/15 - death.png", 240, 128, 10, false, {
        label: "Death",
        hint: "Final collapse",
        effect: { type: "shadowHighlights" }
      })
    }
  },
  bringerOfDeath: {
    name: "Bringer Of Death",
    role: "boss",
    description: "Boss reaper pack with walk, cast, spell, hurt, and death sequences.",
    anchor: { x: 105, y: 91 },
    facingScale: -1,
    scale: 3.2,
    moveSpeed: 170,
    jumpStrength: 620,
    actions: [
      { key: "attack", label: "Attack", hint: "Main reaper strike" },
      { key: "cast", label: "Cast + Spell", hint: "Cast and launch the forward spell" },
      { key: "deathSpell", label: "Bringer Of Death", hint: "Cast first, then unleash the new dark spell" },
      { key: "spell", label: "Spell Only", hint: "Projectile preview in the facing direction" },
      { key: "hit", label: "Hurt", hint: "Damage reaction" },
      { key: "death", label: "Death", hint: "Boss defeat" }
    ],
    animations: {
      idle: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/Individual Sprite/Idle", "Bringer-of-Death_Idle_", 8), 140, 93, 10, true),
      walk: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/Individual Sprite/Walk", "Bringer-of-Death_Walk_", 8), 140, 93, 10, true, {
        label: "Walk"
      }),
      attack: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/Individual Sprite/Attack", "Bringer-of-Death_Attack_", 10), 140, 93, 14, false, {
        label: "Attack",
        hint: "Main reaper strike"
      }),
      cast: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/Individual Sprite/Cast", "Bringer-of-Death_Cast_", 9), 140, 93, 12, false, {
        label: "Cast + Spell",
        hint: "Casting stance that launches the spell forward"
      }),
      deathSpell: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/Individual Sprite/Cast", "Bringer-of-Death_Cast_", 9), 140, 93, 12, false, {
        label: "Bringer Of Death",
        hint: "Cast before releasing the new dark spell"
      }),
      spell: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/Individual Sprite/Spell", "Bringer-of-Death_Spell_", 16), 140, 93, 14, false, {
        label: "Spell Only",
        hint: "Detached spell projectile"
      }),
      darkVfx1: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/new skill/Dark VFX 1/Separeted frames", "Dark VFX 1 (40x32)", 17), 40, 32, 18, false, {
        label: "Dark VFX 1",
        hint: "Dark release pulse",
        autoTrim: false,
        trimPadding: 0
      }),
      darkVfx2: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/new skill/Dark VFX 2/Separated Frames", "Dark VFX 2 (48x64)", 16), 48, 64, 18, false, {
        label: "Dark VFX 2",
        hint: "Dark projectile burst",
        autoTrim: false,
        trimPadding: 0
      }),
      hit: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/Individual Sprite/Hurt", "Bringer-of-Death_Hurt_", 3), 140, 93, 12, false, {
        label: "Hurt",
        hint: "Damage reaction"
      }),
      death: sequenceAnim(numberedFrameSources("characters/bosses/Bringer-Of-Death/Individual Sprite/Death", "Bringer-of-Death_Death_", 10), 140, 93, 10, false, {
        label: "Death",
        hint: "Boss defeat"
      })
    }
  },
  duskBorneArchDemon: {
    name: "DuskBorne-ArchDemon",
    role: "boss",
    description: "Boss caster pack with idle, basic attack, hurt, and death sheets.",
    anchor: { x: 66, y: 78 },
    moveSpeed: 155,
    jumpStrength: 560,
    actions: [
      { key: "attack", label: "Basic Attack", hint: "Void projectile cast" },
      { key: "hit", label: "Hurt", hint: "Damage reaction" },
      { key: "death", label: "Death", hint: "Boss defeat" }
    ],
    animations: {
      idle: sheetAnim("characters/bosses/DuskBorne-ArchDemon/SpriteSheets/ArchDemonIdle001-Sheet.png", 128, 128, 10, true, {
        frames: 6
      }),
      attack: sheetAnim("characters/bosses/DuskBorne-ArchDemon/SpriteSheets/ArchDemonBasicAtk001-Sheet.png", 256, 128, 14, false, {
        frames: 15,
        label: "Basic Attack",
        hint: "Wide shadow cast",
        anchor: { x: 66, y: 78 }
      }),
      hit: sheetAnim("characters/bosses/DuskBorne-ArchDemon/SpriteSheets/ArchDemonHurt001-Sheet.png", 128, 128, 10, false, {
        frames: 4,
        label: "Hurt",
        hint: "Damage reaction"
      }),
      death: sheetAnim("characters/bosses/DuskBorne-ArchDemon/SpriteSheets/ArchDemonDeath001-Sheet.png", 128, 128, 10, false, {
        frames: 8,
        label: "Death",
        hint: "Boss defeat"
      })
    }
  },
  evilWizardBoss: {
    name: "Evil Wizard 2",
    role: "boss",
    description: "Boss wizard pack with full combat and movement sheets.",
    scale: 1.75,
    moveSpeed: 180,
    jumpStrength: 660,
    animations: {
      idle: sheetAnim("characters/bosses/EVil Wizard 2/Sprites/Idle.png", 250, 250, 10, true),
      run: sheetAnim("characters/bosses/EVil Wizard 2/Sprites/Run.png", 250, 250, 12, true),
      jump: sheetAnim("characters/bosses/EVil Wizard 2/Sprites/Jump.png", 250, 250, 10, false),
      fall: sheetAnim("characters/bosses/EVil Wizard 2/Sprites/Fall.png", 250, 250, 10, true),
      attack: sheetAnim("characters/bosses/EVil Wizard 2/Sprites/Attack1.png", 250, 250, 14, false, {
        label: "Attack 1",
        hint: "Wizard opening strike"
      }),
      attack2: sheetAnim("characters/bosses/EVil Wizard 2/Sprites/Attack2.png", 250, 250, 14, false, {
        label: "Attack 2",
        hint: "Wizard follow-up strike"
      }),
      hit: sheetAnim("characters/bosses/EVil Wizard 2/Sprites/Take hit.png", 250, 250, 12, false, {
        label: "Take Hit",
        hint: "Damage reaction"
      }),
      death: sheetAnim("characters/bosses/EVil Wizard 2/Sprites/Death.png", 250, 250, 10, false, {
        label: "Death",
        hint: "Boss defeat"
      })
    }
  },
  wildZombie: {
    name: "Wild Zombie",
    role: "mob",
    description: "Mob zombie pack with three attacks and an eating animation.",
    scale: 3.1,
    moveSpeed: 180,
    jumpStrength: 620,
    animations: {
      idle: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Idle.png", 96, 96, 10, true),
      run: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Run.png", 96, 96, 12, true),
      walk: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Walk.png", 96, 96, 10, true, {
        label: "Walk"
      }),
      jump: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Jump.png", 96, 96, 12, false),
      attack: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Attack_1.png", 96, 96, 14, false, {
        label: "Attack 1",
        hint: "Zombie swipe"
      }),
      attack2: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Attack_2.png", 96, 96, 14, false, {
        label: "Attack 2",
        hint: "Zombie follow-up"
      }),
      attack3: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Attack_3.png", 96, 96, 14, false, {
        label: "Attack 3",
        hint: "Zombie heavy strike"
      }),
      eating: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Eating.png", 96, 96, 10, false, {
        label: "Eating",
        hint: "Eating animation"
      }),
      hit: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Hurt.png", 96, 96, 12, false, {
        label: "Hurt",
        hint: "Damage reaction"
      }),
      death: sheetAnim("characters/mobs/zombie - mobs/Wild Zombie/Dead.png", 96, 96, 10, false, {
        label: "Dead",
        hint: "Mob defeat"
      })
    }
  },
  zombieMan: {
    name: "Zombie Man",
    role: "mob",
    description: "Mob zombie pack with bite and three attack sheets.",
    scale: 3.1,
    moveSpeed: 185,
    jumpStrength: 620,
    animations: {
      idle: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Idle.png", 96, 96, 10, true),
      run: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Run.png", 96, 96, 12, true),
      walk: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Walk.png", 96, 96, 10, true, {
        label: "Walk"
      }),
      jump: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Jump.png", 96, 96, 12, false),
      attack: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Attack_1.png", 96, 96, 14, false, {
        label: "Attack 1",
        hint: "Zombie swipe"
      }),
      attack2: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Attack_2.png", 96, 96, 14, false, {
        label: "Attack 2",
        hint: "Zombie follow-up"
      }),
      attack3: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Attack_3.png", 96, 96, 14, false, {
        label: "Attack 3",
        hint: "Zombie heavy strike"
      }),
      bite: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Bite.png", 96, 96, 12, false, {
        label: "Bite",
        hint: "Bite animation"
      }),
      hit: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Hurt.png", 96, 96, 12, false, {
        label: "Hurt",
        hint: "Damage reaction"
      }),
      death: sheetAnim("characters/mobs/zombie - mobs/Zombie Man/Dead.png", 96, 96, 10, false, {
        label: "Dead",
        hint: "Mob defeat"
      })
    }
  },
  zombieWoman: {
    name: "Zombie Woman",
    role: "mob",
    description: "Mob zombie pack with scream and three attack sheets.",
    scale: 3.1,
    moveSpeed: 185,
    jumpStrength: 620,
    animations: {
      idle: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Idle.png", 96, 96, 10, true),
      run: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Run.png", 96, 96, 12, true),
      walk: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Walk.png", 96, 96, 10, true, {
        label: "Walk"
      }),
      jump: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Jump.png", 96, 96, 12, false),
      attack: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Attack_1.png", 96, 96, 14, false, {
        label: "Attack 1",
        hint: "Zombie swipe"
      }),
      attack2: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Attack_2.png", 96, 96, 14, false, {
        label: "Attack 2",
        hint: "Zombie follow-up"
      }),
      attack3: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Attack_3.png", 96, 96, 14, false, {
        label: "Attack 3",
        hint: "Zombie heavy strike"
      }),
      scream: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Scream.png", 96, 96, 12, false, {
        label: "Scream",
        hint: "Scream animation"
      }),
      hit: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Hurt.png", 96, 96, 12, false, {
        label: "Hurt",
        hint: "Damage reaction"
      }),
      death: sheetAnim("characters/mobs/zombie - mobs/Zombie Woman/Dead.png", 96, 96, 10, false, {
        label: "Dead",
        hint: "Mob defeat"
      })
    }
  }
};

const imageCache = new Map();
const effectFrameCache = new Map();
const autoTrimCache = new Map();
const effectCanvas = document.createElement("canvas");
const effectCtx = effectCanvas.getContext("2d");
const pressedKeys = new Set();
const state = {
  currentCharacterKey: "hallokin",
  x: STAGE.width * 0.5,
  y: STAGE.groundY,
  vx: 0,
  vy: 0,
  facing: 1,
  onGround: true,
  activeAction: null,
  currentAnimation: "idle",
  currentFrame: 0,
  frameTimer: 0,
  transition: null,
  comboIndex: 0,
  particleTimer: 0,
  particles: [],
  detachedEffects: [],
  pendingJump: false,
  previewAnimation: null,
  screenShakeStrength: 0,
  screenShakeX: 0,
  screenShakeY: 0,
  stageFlashAlpha: 0,
  stageFlashColor: "rgba(72, 217, 255, 0.12)",
  ready: false,
  lastTimestamp: 0
};

let testerUnlocked = false;
let startupFailed = false;

effectCtx.imageSmoothingEnabled = false;

function setStatus(message, isError = false) {
  if (!entryStatus) {
    return;
  }

  startupFailed = isError;
  entryStatus.textContent = message;
  entryStatus.classList.toggle("error", isError);
  updateEntryGate();
}

function updateEntryGate() {
  if (!entryStatus || !entryStartButton || !entryAcknowledge || testerUnlocked) {
    return;
  }

  if (!startupFailed) {
    if (!state.ready) {
      entryStatus.textContent = "Loading character sheets...";
      entryStatus.classList.remove("error");
    } else if (entryAcknowledge.checked) {
      entryStatus.textContent = "Ready. You can enter the test build now.";
      entryStatus.classList.remove("error");
    } else {
      entryStatus.textContent = "Check the box to continue into the test build.";
      entryStatus.classList.remove("error");
    }
  }

  entryStartButton.disabled = startupFailed || !state.ready || !entryAcknowledge.checked;
}

function unlockTester() {
  if (startupFailed || !state.ready || !entryAcknowledge?.checked) {
    return;
  }

  testerUnlocked = true;
  if (entryOverlay) {
    entryOverlay.hidden = true;
  }
  resetPlayer();
  resetButton.focus();
}

function forceWhiteStage() {
  document.documentElement.style.background = "#ffffff";
  document.body.style.background = "#ffffff";
  document.body.style.backgroundImage = "none";
  stageShell.style.background = "#ffffff";
  stageShell.style.backgroundImage = "none";
  canvas.style.background = "#ffffff";
}

function loadImage(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.src = src;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load asset: ${src}`));
  });

  imageCache.set(src, promise);
  return promise;
}

async function preloadAssets() {
  const sources = new Set();

  Object.values(CHARACTERS).forEach((character) => {
    Object.values(character.animations).forEach((animation) => {
      if (animation.frameSources?.length) {
        animation.frameSources.forEach((source) => sources.add(source));
        return;
      }

      sources.add(animation.src);
    });
  });

  await Promise.all([...sources].map((source) => loadImage(source)));
}

function getCharacter() {
  return CHARACTERS[state.currentCharacterKey];
}

function getAnimation(name) {
  return getCharacter().animations[name];
}

function getCharacterAnimationCount(character = getCharacter()) {
  return Object.keys(character.animations).length;
}

function getBaseAnimationName(character = getCharacter()) {
  if (character.animations.idle) {
    return "idle";
  }

  if (character.animations.walk) {
    return "walk";
  }

  if (character.animations.run) {
    return "run";
  }

  return Object.keys(character.animations)[0];
}

function getAnimationFrameCount(animation) {
  if (animation.frameSources?.length) {
    return animation.frameSources.length;
  }

  if (typeof animation.frames === "number") {
    return animation.frames;
  }

  if (animation.fullImage) {
    return 1;
  }

  const image = imageCache.get(animation.src);
  const resolvedImage = image instanceof Promise ? null : image;
  if (!resolvedImage || !animation.frameWidth) {
    return 1;
  }

  return Math.max(1, Math.floor(resolvedImage.width / animation.frameWidth));
}

function getAnimationSourceFrameCount(animation) {
  if (animation.frameSources?.length) {
    return animation.frameSources.length;
  }

  if (animation.fullImage) {
    return 1;
  }

  const image = imageCache.get(animation.src);
  const resolvedImage = image instanceof Promise ? null : image;
  if (!resolvedImage || !animation.frameWidth) {
    return typeof animation.frames === "number" ? Math.max(1, animation.frames) : 1;
  }

  return Math.max(1, Math.floor(resolvedImage.width / animation.frameWidth));
}

function getCharacterReferenceHeight(character) {
  if (character.referenceVisibleHeight) {
    return character.referenceVisibleHeight;
  }

  const baseAnimationName = getBaseAnimationName(character);
  const animation = character.animations[baseAnimationName];
  if (!animation) {
    return character.referenceFrameHeight || 1;
  }

  const trim = animation.trim;
  const rowOffset = animation.fullImage ? 0 : (animation.row ?? 0) * (animation.frameHeight ?? 0);
  let resolvedImage = null;
  let sourceX = trim?.x ?? 0;
  let sourceY = rowOffset + (trim?.y ?? 0);
  let sourceWidth = trim?.width ?? animation.frameWidth;
  let sourceHeight = trim?.height ?? animation.frameHeight;

  if (animation.frameSources?.length) {
    const frameSource = animation.frameSources[0];
    const frameImage = imageCache.get(frameSource);
    resolvedImage = frameImage instanceof Promise ? null : frameImage;
    if (!resolvedImage) {
      return character.referenceFrameHeight || animation.frameHeight || 1;
    }

    sourceWidth = trim?.width ?? animation.frameWidth ?? resolvedImage.width;
    sourceHeight = trim?.height ?? animation.frameHeight ?? resolvedImage.height;
  } else {
    const image = imageCache.get(animation.src);
    resolvedImage = image instanceof Promise ? null : image;
    if (!resolvedImage) {
      return character.referenceFrameHeight || animation.frameHeight || 1;
    }

    if (animation.fullImage) {
      sourceWidth = trim?.width ?? resolvedImage.width;
      sourceHeight = trim?.height ?? resolvedImage.height;
    } else {
      sourceX = (animation.frameWidth * getFrameIndex(animation, 0)) + (trim?.x ?? 0);
      sourceY = rowOffset + (trim?.y ?? 0);
      sourceWidth = trim?.width ?? animation.frameWidth;
      sourceHeight = trim?.height ?? animation.frameHeight;
    }
  }

  if (animation.autoTrim && resolvedImage) {
    const bounds = getAutoTrimBounds(animation, 0, resolvedImage, sourceX, sourceY, sourceWidth, sourceHeight);
    sourceHeight = bounds.height;
  }

  character.referenceVisibleHeight = Math.max(1, sourceHeight);
  return character.referenceVisibleHeight;
}

function getCharacterGroundInset(character) {
  if (typeof character.referenceGroundInset === "number") {
    return character.referenceGroundInset;
  }

  const baseAnimationName = getBaseAnimationName(character);
  const animation = character.animations[baseAnimationName];
  if (!animation || animation.fullImage || animation.frameSources?.length) {
    character.referenceGroundInset = 0;
    return character.referenceGroundInset;
  }

  const trim = animation.trim;
  const rowOffset = (animation.row ?? 0) * (animation.frameHeight ?? 0);
  const image = imageCache.get(animation.src);
  const resolvedImage = image instanceof Promise ? null : image;
  if (!resolvedImage) {
    return 0;
  }

  const sourceX = (animation.frameWidth * getFrameIndex(animation, 0)) + (trim?.x ?? 0);
  const sourceY = rowOffset + (trim?.y ?? 0);
  const sourceWidth = trim?.width ?? animation.frameWidth ?? resolvedImage.width;
  const sourceHeight = trim?.height ?? animation.frameHeight ?? resolvedImage.height;
  const bounds = animation.autoTrim
    ? getAutoTrimBounds(animation, 0, resolvedImage, sourceX, sourceY, sourceWidth, sourceHeight)
    : { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  const baseFrameHeight = animation.frameHeight ?? sourceHeight;
  const localTrimY = trim?.y ?? 0;
  const visibleBottom = localTrimY + bounds.y + bounds.height;
  character.referenceGroundInset = Math.max(0, baseFrameHeight - visibleBottom);
  return character.referenceGroundInset;
}

function getCharacterDrawScale(character, animation, sourceHeight) {
  if (character.scaleNormalized === false) {
    return character.scale ?? 1;
  }

  const targetHeight = character.targetHeight || ROLE_TARGET_HEIGHTS[character.role];
  if (targetHeight) {
    const referenceHeight = character.referenceFrameHeight || getCharacterReferenceHeight(character) || animation.frameHeight || sourceHeight;
    return targetHeight / Math.max(1, referenceHeight);
  }

  return character.scale ?? 1;
}

function getCharacterFacingScale(characterKey = state.currentCharacterKey) {
  return CHARACTERS[characterKey]?.facingScale ?? 1;
}

function getAnimationLabel(animationName) {
  const animation = getAnimation(animationName);
  if (animation?.label) {
    return animation.label;
  }

  return ANIMATION_LABELS[animationName] || formatAnimationKey(animationName);
}

function getActionMeta() {
  const character = getCharacter();
  if (character.actions) {
    return character.actions;
  }

  const generatedActions = Object.entries(character.animations)
    .map(([key, animation]) => ({
      key,
      label: animation.label || ANIMATION_LABELS[key] || formatAnimationKey(key),
      hint: animation.hint || (animation.loop ? "Loop preview" : `${getRoleLabel(character.role)} animation test`)
    }));

  if (generatedActions.length > 0) {
    return generatedActions;
  }

  return [
    ...DEFAULT_ACTION_META.map((meta) => ({
      ...meta,
      ...(character.actionMeta?.[meta.key] || {})
    })),
    ...(character.extraActions || [])
  ];
}

function getActionKeys(meta) {
  if (meta.preferredKeys) {
    return meta.preferredKeys;
  }

  if (meta.key === "dash") {
    return ["dash", "special"];
  }

  return [meta.key];
}

function getHallokinComboAction() {
  const comboSequence = getCharacter().comboSequence || HALL0KIN_COMBO_SEQUENCE;
  const availableMoves = comboSequence.filter((key) => getAnimation(key));
  if (availableMoves.length === 0) {
    return null;
  }

  const action = availableMoves[state.comboIndex % availableMoves.length];
  state.comboIndex = (state.comboIndex + 1) % availableMoves.length;
  return action;
}

function randomBetween(min, max) {
  return min + (Math.random() * (max - min));
}

function getHallokinParticleProfile(actionName) {
  if (state.currentCharacterKey !== "hallokin") {
    return null;
  }

  const profileKey = getAnimation(actionName)?.particleProfile;
  return profileKey ? HALL0KIN_PARTICLE_PROFILES[profileKey] : null;
}

function getHallokinTransformValue(values, frameNumber, fallback = 0) {
  if (!values || values.length === 0) {
    return fallback;
  }

  return values[Math.min(frameNumber, values.length - 1)] ?? fallback;
}

function getHallokinActionTransform(animationName, frameNumber) {
  const transform = HALL0KIN_ACTION_TRANSFORMS[animationName];
  if (!transform || state.currentCharacterKey !== "hallokin") {
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

function getHallokinParticlePalette(actionName) {
  return HALL0KIN_PARTICLE_PALETTES[actionName] || SHADOW_PARTICLE_COLORS;
}

function isBringerOfDeathSpellAction(actionName) {
  return state.currentCharacterKey === "bringerOfDeath" && actionName === "spell";
}

function isBringerOfDeathDeathSpellAction(actionName) {
  return state.currentCharacterKey === "bringerOfDeath" && actionName === "deathSpell";
}

function spawnDetachedAnimationEffect({
  characterKey,
  animationKey,
  x,
  y,
  vx = 0,
  vy = 0,
  facing = 1,
  scale = 1,
  gravity = 0,
  groundImpact = false,
  floorDrag = 1,
  floorOffset = 0,
  floorImpactScale = 1,
  stormAura = false,
  earthWaveAura = false,
  earthWaveAuraScale = 1,
  travelAfterFrame = 0,
  travelSpeed = 0
}) {
  state.detachedEffects.push({
    characterKey,
    animationKey,
    x,
    y,
    vx,
    vy,
    facing,
    scale,
    gravity,
    groundImpact,
    floorDrag,
    floorOffset,
    floorImpactScale,
    stormAura,
    earthWaveAura,
    earthWaveAuraScale,
    travelAfterFrame,
    travelSpeed,
    travelStarted: travelAfterFrame <= 0,
    hitFloor: false,
    frame: 0,
    frameTimer: 0
  });
}

function launchBringerOfDeathSpell(fromCast = false) {
  if (state.currentCharacterKey !== "bringerOfDeath") {
    return;
  }

  const animation = CHARACTERS.bringerOfDeath.animations.spell;
  if (!animation) {
    return;
  }

  const spellScale = fromCast ? 4.9 : 4.4;
  spawnDetachedAnimationEffect({
    characterKey: "bringerOfDeath",
    animationKey: "spell",
    x: state.x + (state.facing * 124),
    y: state.y - 182,
    vx: 210 * state.facing,
    vy: 120,
    gravity: 1650,
    groundImpact: true,
    floorDrag: 0.88,
    floorOffset: 6,
    floorImpactScale: 1.22,
    stormAura: true,
    facing: state.facing,
    scale: spellScale
  });

  state.screenShakeStrength = Math.max(state.screenShakeStrength, fromCast ? 6 : 4);
  state.stageFlashColor = "rgba(181, 132, 255, 0.2)";
  state.stageFlashAlpha = Math.max(state.stageFlashAlpha, fromCast ? 0.22 : 0.16);

  if (state.detachedEffects.length > 12) {
    state.detachedEffects.splice(0, state.detachedEffects.length - 12);
  }
}

function launchBringerOfDeathDeathSpell() {
  if (state.currentCharacterKey !== "bringerOfDeath") {
    return;
  }

  spawnDetachedAnimationEffect({
    characterKey: "bringerOfDeath",
    animationKey: "darkVfx1",
    x: state.x + (state.facing * 94),
    y: state.y - 138,
    facing: state.facing,
    scale: 3.6
  });

  spawnDetachedAnimationEffect({
    characterKey: "bringerOfDeath",
    animationKey: "darkVfx2",
    x: state.x + (state.facing * 138),
    y: state.y - 164,
    vx: 0,
    vy: 110,
    gravity: 1480,
    groundImpact: true,
    floorDrag: 0.82,
    floorOffset: 14,
    floorImpactScale: 1.28,
    stormAura: true,
    facing: state.facing,
    scale: 4.3,
    travelAfterFrame: 5,
    travelSpeed: 286
  });

  state.screenShakeStrength = Math.max(state.screenShakeStrength, 9);
  state.stageFlashColor = "rgba(120, 72, 210, 0.28)";
  state.stageFlashAlpha = Math.max(state.stageFlashAlpha, 0.26);

  if (state.detachedEffects.length > 12) {
    state.detachedEffects.splice(0, state.detachedEffects.length - 12);
  }
}

function triggerHallokinActionFx(actionName, intensity = 1) {
  if (state.currentCharacterKey !== "hallokin") {
    return;
  }

  const style = HALL0KIN_ACTION_FX[actionName];
  if (!style) {
    return;
  }

  state.screenShakeStrength = Math.max(state.screenShakeStrength, style.shake * intensity);
  if ((style.flashAlpha * intensity) >= state.stageFlashAlpha) {
    state.stageFlashColor = style.flashColor;
  }
  state.stageFlashAlpha = Math.max(state.stageFlashAlpha, style.flashAlpha * intensity);
}

function updateHallokinActionFx(dt) {
  if (state.screenShakeStrength > 0.08) {
    state.screenShakeX = randomBetween(-state.screenShakeStrength, state.screenShakeStrength);
    state.screenShakeY = randomBetween(-(state.screenShakeStrength * 0.35), state.screenShakeStrength * 0.35);
    state.screenShakeStrength = Math.max(0, state.screenShakeStrength - (dt * 26));
  } else {
    state.screenShakeStrength = 0;
    state.screenShakeX = 0;
    state.screenShakeY = 0;
  }

  if (state.stageFlashAlpha > 0) {
    state.stageFlashAlpha = Math.max(0, state.stageFlashAlpha - (dt * 1.75));
  }
}

function spawnHallokinParticles(profile, amount = 1, burstScale = 1, actionName = state.activeAction) {
  if (!profile) {
    return;
  }

  const total = Math.max(1, Math.round(amount * burstScale));
  const paletteSet = getHallokinParticlePalette(actionName);

  for (let i = 0; i < total; i += 1) {
    const orientToFacing = profile.orientToFacing !== false;
    const facingScale = orientToFacing ? state.facing : 1;
    const palette = paletteSet[Math.floor(Math.random() * paletteSet.length)] || SHADOW_PARTICLE_COLORS[Math.floor(Math.random() * SHADOW_PARTICLE_COLORS.length)];
    const particle = {
      x: state.x + ((profile.offsetX ?? 0) * facingScale) + randomBetween(-(profile.spreadX ?? 0), profile.spreadX ?? 0),
      y: state.y + (profile.offsetY ?? 0) + randomBetween(-(profile.spreadY ?? 0), profile.spreadY ?? 0),
      vx: randomBetween(profile.vxMin, profile.vxMax) * facingScale,
      vy: randomBetween(profile.vyMin, profile.vyMax),
      size: randomBetween(profile.sizeMin, profile.sizeMax),
      life: randomBetween(profile.lifeMin, profile.lifeMax),
      maxLife: 0,
      alpha: randomBetween(0.62, 1),
      gravity: profile.gravity ?? 220,
      layer: profile.layer ?? "front",
      color: palette.fill,
      glowColor: palette.glow,
      hotColor: palette.hot,
      glowScale: randomBetween(1.8, 3.1)
    };

    particle.maxLife = particle.life;
    state.particles.push(particle);
  }

  if (state.particles.length > 520) {
    state.particles.splice(0, state.particles.length - 520);
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter((particle) => {
    particle.life -= dt;
    if (particle.life <= 0) {
      return false;
    }

    particle.vy += particle.gravity * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.96;
    return true;
  });

  const profile = getHallokinParticleProfile(state.activeAction);
  if (!profile) {
    state.particleTimer = 0;
    return;
  }

  state.particleTimer += dt * profile.rate;
  while (state.particleTimer >= 1) {
    spawnHallokinParticles(profile, 1, 1, state.activeAction);
    state.particleTimer -= 1;
  }
}

function drawParticles(layer) {
  ctx.save();

  state.particles.forEach((particle) => {
    if (particle.layer !== layer) {
      return;
    }

    const lifeRatio = particle.life / particle.maxLife;
    const size = Math.max(1, Math.round(particle.size * (0.45 + (lifeRatio * 0.7))));
    const drawX = Math.round(particle.x - (size * 0.5));
    const drawY = Math.round(particle.y - (size * 0.5));
    const glowSize = Math.max(size + 4, Math.round(size * particle.glowScale * (0.55 + (lifeRatio * 0.45))));
    const glowX = Math.round(particle.x - (glowSize * 0.5));
    const glowY = Math.round(particle.y - (glowSize * 0.5));
    const hotSize = Math.max(1, Math.round(size * 0.42));
    const hotX = Math.round(particle.x - (hotSize * 0.5));
    const hotY = Math.round(particle.y - (hotSize * 0.5));

    ctx.globalAlpha = particle.alpha * lifeRatio * 0.22;
    ctx.fillStyle = "#030407";
    ctx.fillRect(drawX - 1, drawY - 1, size + 2, size + 2);

    ctx.globalAlpha = particle.alpha * lifeRatio * 0.34;
    ctx.fillStyle = particle.glowColor;
    ctx.fillRect(glowX, glowY, glowSize, glowSize);

    ctx.globalAlpha = particle.alpha * lifeRatio * 0.95;
    ctx.fillStyle = particle.color;
    ctx.fillRect(drawX, drawY, size, size);

    ctx.globalAlpha = particle.alpha * lifeRatio;
    ctx.fillStyle = particle.hotColor;
    ctx.fillRect(hotX, hotY, hotSize, hotSize);
  });

  ctx.restore();
}

function getStatusMessage() {
  if (state.currentCharacterKey === "hallokin") {
    return "Testing Hallokin. Click or press J to cycle the source-backed attack set, use K for Jump Forward Attack, or use the buttons to preview the local free-pack clips.";
  }

  const character = getCharacter();
  const sourceNote = character.sourceNote ? ` ${character.sourceNote}` : "";
  return `Testing ${character.name} (${getRoleLabel(character.role)}). ${getCharacterAnimationCount(character)} animations are loaded, and the buttons now preview every clip in this pack.${sourceNote}`;
}

function refreshHud() {
  const character = getCharacter();
  currentCharacterLabel.textContent = `${character.name} - ${getRoleLabel(character.role)}`;
  currentAnimationLabel.textContent = getAnimationLabel(state.currentAnimation);
  currentPositionLabel.textContent = `${Math.round(state.x)}, ${Math.round(STAGE.groundY - state.y)}`;
}

function setAnimation(name, restart = false) {
  if (!getAnimation(name)) {
    return;
  }

  if (state.currentAnimation !== name || restart) {
    state.currentAnimation = name;
    state.currentFrame = 0;
    state.frameTimer = 0;
  }
}

function resetPlayer() {
  state.x = STAGE.width * 0.5;
  state.y = STAGE.groundY;
  state.vx = 0;
  state.vy = 0;
  state.facing = 1;
  state.onGround = true;
  state.activeAction = null;
  state.transition = null;
  state.comboIndex = 0;
  state.particleTimer = 0;
  state.particles = [];
  state.detachedEffects = [];
  state.pendingJump = false;
  state.previewAnimation = null;
  state.screenShakeStrength = 0;
  state.screenShakeX = 0;
  state.screenShakeY = 0;
  state.stageFlashAlpha = 0;
  state.stageFlashColor = "rgba(72, 217, 255, 0.12)";
  setAnimation(getBaseAnimationName(), true);
  refreshHud();
}

function chooseAction(preferredKeys) {
  const animations = getCharacter().animations;
  return preferredKeys.find((key) => animations[key]) || null;
}

function triggerAction(actionName) {
  const animation = getAnimation(actionName);

  if (!animation || state.activeAction) {
    return;
  }

  if (isBringerOfDeathDeathSpellAction(actionName)) {
    state.activeAction = actionName;
    state.transition = null;
    state.vx = 0;
    state.particleTimer = 0;
    setAnimation(actionName, true);
    refreshHud();
    return;
  }

  if (isBringerOfDeathSpellAction(actionName)) {
    launchBringerOfDeathSpell(false);
    refreshHud();
    return;
  }

  state.activeAction = actionName;
  state.transition = null;
  state.vx = 0;
  state.particleTimer = 0;
  setAnimation(actionName, true);
  triggerHallokinActionFx(actionName);

  const particleProfile = getHallokinParticleProfile(actionName);
  if (particleProfile) {
    spawnHallokinParticles(particleProfile, particleProfile.burst, 1, actionName);
  }

  refreshHud();
}

function triggerPrimaryAction() {
  if (state.activeAction) {
    return;
  }

  const action = state.currentCharacterKey === "hallokin"
    ? getHallokinComboAction()
    : chooseAction(["attack", "attack2", "attack3", "cast", "deathSpell", "spell", "dash", "special", "charge", "bite", "scream", "hit"]);

  if (action) {
    triggerAction(action);
  }
}

function triggerSecondaryAction() {
  if (state.activeAction) {
    return;
  }

  const action = state.currentCharacterKey === "hallokin"
    ? chooseAction(getCharacter().secondaryActionKeys || ["dash", "special", "hit"])
    : chooseAction(["dash", "special", "attack2", "attack3", "deathSpell", "cast", "spell", "charge", "charge2", "fireball", "flameJet", "lightBall", "lightCharge", "magicArrow", "magicSphere", "bite", "scream", "hit", "death"]);

  if (action) {
    triggerAction(action);
  }
}

function jump() {
  if (!state.onGround || state.activeAction === "death") {
    return;
  }

  state.onGround = false;
  state.vy = -getCharacter().jumpStrength;
  state.previewAnimation = null;

  if (getAnimation("jump")) {
    setAnimation("jump", true);
  }
}

function applyInput() {
  const character = getCharacter();
  const moveLeft = pressedKeys.has("ArrowLeft") || pressedKeys.has("a");
  const moveRight = pressedKeys.has("ArrowRight") || pressedKeys.has("d");
  const moveDirection = Number(moveRight) - Number(moveLeft);

  if (state.activeAction && state.activeAction !== "death") {
    return;
  }

  if (moveDirection !== 0 && state.previewAnimation) {
    const previewAnimation = getAnimation(state.previewAnimation);
    if (previewAnimation?.loop) {
      state.previewAnimation = null;
      state.transition = null;
    }
  }

  state.vx = moveDirection * character.moveSpeed;

  if (moveDirection !== 0) {
    state.facing = moveDirection > 0 ? 1 : -1;
  }
}

function chooseMovementAnimation() {
  const character = getCharacter();

  if (state.activeAction) {
    return state.activeAction;
  }

  if (!state.onGround) {
    if (state.vy < 0 && character.animations.jump) {
      return "jump";
    }

    if (Math.abs(state.vy) < 80 && character.animations.midair) {
      return "midair";
    }

    if (character.animations.fall) {
      return "fall";
    }
  }

  if (Math.abs(state.vx) > 8 && character.animations.run) {
    return "run";
  }

  if (Math.abs(state.vx) > 8 && character.animations.walk) {
    return "walk";
  }

  if (state.previewAnimation && character.animations[state.previewAnimation]) {
    return state.previewAnimation;
  }

  return getBaseAnimationName(character);
}

function updateAnimation(dt) {
  const animation = getAnimation(state.currentAnimation);

  if (!animation) {
    return;
  }

  const frameDuration = 1 / animation.fps;
  const totalFrames = Math.max(1, getAnimationFrameCount(animation));
  state.frameTimer += dt;
  let completedAction = null;
  let completedFrame = state.currentFrame;

  while (state.frameTimer >= frameDuration) {
    state.frameTimer -= frameDuration;

    if (state.currentFrame < totalFrames - 1) {
      state.currentFrame += 1;
      continue;
    }

    if (animation.loop) {
      state.currentFrame = 0;
      continue;
    }

    if (state.activeAction === state.currentAnimation) {
      completedAction = state.currentAnimation;
      completedFrame = state.currentFrame;
      state.activeAction = null;
    }

    break;
  }

  if (completedAction) {
    if (state.currentCharacterKey === "bringerOfDeath" && completedAction === "cast") {
      launchBringerOfDeathSpell(true);
    }
    if (state.currentCharacterKey === "bringerOfDeath" && completedAction === "deathSpell") {
      launchBringerOfDeathDeathSpell();
    }

    const completionProfile = getHallokinParticleProfile(completedAction);
    if (completionProfile) {
      spawnHallokinParticles(completionProfile, Math.max(6, Math.round(completionProfile.burst * 0.5)), 1, completedAction);
    }
    triggerHallokinActionFx(completedAction, 0.6);

    const desiredAnimation = chooseMovementAnimation();

    if (desiredAnimation && desiredAnimation !== completedAction) {
      state.transition = {
        from: completedAction,
        frame: completedFrame,
        elapsed: 0,
        duration: 0.18
      };
      setAnimation(desiredAnimation, true);
    }
    return;
  }

  const desiredAnimation = chooseMovementAnimation();
  if (desiredAnimation !== state.currentAnimation && !state.activeAction) {
    setAnimation(desiredAnimation, true);
  }
}

function updatePhysics(dt) {
  state.x += state.vx * dt;
  state.x = Math.min(Math.max(state.x, 80), STAGE.width - 80);

  if (!state.onGround) {
    state.vy += STAGE.gravity * dt;
    state.y += state.vy * dt;
  }

  if (state.y >= STAGE.groundY) {
    state.y = STAGE.groundY;
    state.vy = 0;
    state.onGround = true;
  }

  if (state.onGround && state.pendingJump) {
    state.pendingJump = false;
    jump();
  }
}

function updateTransition(dt) {
  if (!state.transition) {
    return;
  }

  state.transition.elapsed += dt;

  if (state.transition.elapsed >= state.transition.duration) {
    state.transition = null;
  }
}

function updateDetachedEffects(dt) {
  state.detachedEffects = state.detachedEffects.filter((effect) => {
    const character = CHARACTERS[effect.characterKey];
    const animation = character?.animations?.[effect.animationKey];
    if (!animation) {
      return false;
    }

    const frameDuration = 1 / animation.fps;
    effect.frameTimer += dt;

    while (effect.frameTimer >= frameDuration) {
      effect.frameTimer -= frameDuration;
      effect.frame += 1;
    }

    if (!effect.travelStarted && effect.frame >= (effect.travelAfterFrame ?? 0)) {
      effect.travelStarted = true;
      effect.vx = (effect.travelSpeed ?? 0) * effect.facing;
    }

    if (!effect.hitFloor && effect.gravity) {
      effect.vy += effect.gravity * dt;
    }

    effect.x += effect.vx * dt;
    effect.y += effect.vy * dt;

    if (effect.groundImpact) {
      const metrics = getDetachedEffectMetrics(
        effect.characterKey,
        effect.animationKey,
        effect.frame,
        getDetachedEffectRenderScale(effect)
      );

      if (metrics) {
        const floorY = STAGE.groundY - (metrics.drawHeight * 0.5) + (effect.floorOffset ?? 0);

        if (effect.y >= floorY) {
          effect.y = floorY;

          if (!effect.hitFloor) {
            effect.hitFloor = true;
            effect.vy = 0;
            effect.gravity = 0;
            effect.vx *= 0.72;
            state.screenShakeStrength = Math.max(state.screenShakeStrength, 8);
            state.stageFlashColor = "rgba(208, 158, 255, 0.22)";
            state.stageFlashAlpha = Math.max(state.stageFlashAlpha, 0.24);
          } else {
            effect.vx *= effect.floorDrag ?? 1;
          }

          if (Math.abs(effect.vx) < 12) {
            effect.vx = 0;
          }
        }
      }
    }

    return effect.frame < getAnimationFrameCount(animation)
      && effect.x > -220
      && effect.x < STAGE.width + 220
      && effect.y > -220
      && effect.y < STAGE.height + 220;
  });
}

function drawShadow(centerX, drawWidth, shadowScale = 1) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.26)";
  ctx.beginPath();
  ctx.ellipse(centerX, STAGE.groundY + 8, drawWidth * 0.24 * shadowScale, 16 * Math.min(1.8, shadowScale), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getFrameIndex(animation, frameNumber) {
  if (animation.frameOrder) {
    return animation.frameOrder[frameNumber] ?? animation.frameOrder[animation.frameOrder.length - 1];
  }

  return frameNumber;
}

function getAutoTrimBounds(animation, frameIndex, resolvedImage, sourceX, sourceY, sourceWidth, sourceHeight) {
  const cacheKey = [
    resolvedImage.src,
    animation.row ?? 0,
    frameIndex,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    animation.trimPadding ?? 1,
    JSON.stringify(animation.effect ?? null)
  ].join("|");

  if (autoTrimCache.has(cacheKey)) {
    return autoTrimCache.get(cacheKey);
  }

  effectCanvas.width = sourceWidth;
  effectCanvas.height = sourceHeight;
  effectCtx.clearRect(0, 0, sourceWidth, sourceHeight);
  effectCtx.drawImage(
    resolvedImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight
  );

  const imageData = effectCtx.getImageData(0, 0, sourceWidth, sourceHeight);
  const { data } = imageData;
  const backdrop = animation.effect?.type === "removeBackdrop"
    ? { red: data[0], green: data[1], blue: data[2] }
    : null;
  const backdropTolerance = animation.effect?.tolerance ?? 14;
  let minX = sourceWidth;
  let minY = sourceHeight;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < sourceHeight; y += 1) {
    for (let x = 0; x < sourceWidth; x += 1) {
      const dataIndex = ((y * sourceWidth) + x) * 4;
      const alpha = data[dataIndex + 3];
      if (alpha <= 10) {
        continue;
      }

      if (
        backdrop
        && isBackdropMatch(data[dataIndex], data[dataIndex + 1], data[dataIndex + 2], backdrop, backdropTolerance)
      ) {
        continue;
      }

      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
    }
  }

  let bounds;
  if (maxX < minX || maxY < minY) {
    bounds = { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  } else {
    const padding = animation.trimPadding ?? 1;
    bounds = {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(sourceWidth - Math.max(0, minX - padding), (maxX - minX + 1) + (padding * 2)),
      height: Math.min(sourceHeight - Math.max(0, minY - padding), (maxY - minY + 1) + (padding * 2))
    };
  }

  autoTrimCache.set(cacheKey, bounds);
  return bounds;
}

function getDrawMetrics(animationName, frameNumber) {
  const character = getCharacter();
  const animation = getAnimation(animationName);
  const animationFrame = Math.min(frameNumber, Math.max(0, getAnimationFrameCount(animation) - 1));
  const frameIndex = Math.min(
    getFrameIndex(animation, animationFrame),
    Math.max(0, getAnimationSourceFrameCount(animation) - 1)
  );
  const trim = animation.trim;
  const rowOffset = animation.fullImage ? 0 : (animation.row ?? 0) * (animation.frameHeight ?? 0);
  let resolvedImage = null;
  let sourceX = trim?.x ?? 0;
  let sourceY = rowOffset + (trim?.y ?? 0);
  let sourceWidth = trim?.width ?? animation.frameWidth;
  let sourceHeight = trim?.height ?? animation.frameHeight;
  let trimOffsetX = trim?.x ?? 0;
  let trimOffsetY = trim?.y ?? 0;

  if (animation.frameSources?.length) {
    const frameSource = animation.frameSources[Math.min(frameIndex, animation.frameSources.length - 1)];
    const frameImage = imageCache.get(frameSource);
    if (!frameImage) {
      return null;
    }

    resolvedImage = frameImage instanceof Promise ? null : frameImage;
    if (!resolvedImage) {
      return null;
    }

    sourceWidth = trim?.width ?? animation.frameWidth ?? resolvedImage.width;
    sourceHeight = trim?.height ?? animation.frameHeight ?? resolvedImage.height;
  } else {
    const image = imageCache.get(animation.src);
    if (!image) {
      return null;
    }

    resolvedImage = image instanceof Promise ? null : image;
    if (!resolvedImage) {
      return null;
    }

    if (animation.fullImage) {
      sourceWidth = trim?.width ?? resolvedImage.width;
      sourceHeight = trim?.height ?? resolvedImage.height;
    } else {
      sourceX = (animation.frameWidth * frameIndex) + (trim?.x ?? 0);
      sourceY = rowOffset + (trim?.y ?? 0);
      sourceWidth = trim?.width ?? animation.frameWidth;
      sourceHeight = trim?.height ?? animation.frameHeight;
    }
  }

  if (animation.autoTrim) {
    const bounds = getAutoTrimBounds(animation, frameIndex, resolvedImage, sourceX, sourceY, sourceWidth, sourceHeight);
    sourceX += bounds.x;
    sourceY += bounds.y;
    sourceWidth = bounds.width;
    sourceHeight = bounds.height;
    trimOffsetX += bounds.x;
    trimOffsetY += bounds.y;
  }

  const anchor = animation.anchor || character.anchor;
  const baseFrameWidth = animation.fullImage ? sourceWidth : (animation.frameWidth ?? sourceWidth);
  const baseFrameHeight = animation.fullImage ? sourceHeight : (animation.frameHeight ?? sourceHeight);
  const groundInset = anchor ? 0 : getCharacterGroundInset(character);
  const anchorX = anchor ? anchor.x - trimOffsetX : (baseFrameWidth * 0.5) - trimOffsetX;
  const anchorY = anchor ? anchor.y - trimOffsetY : (baseFrameHeight - trimOffsetY - groundInset);
  const drawScale = getCharacterDrawScale(character, animation, sourceHeight);
  const drawWidth = sourceWidth * drawScale;
  const drawHeight = sourceHeight * drawScale;

  return {
    resolvedImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    effect: animation.effect || null,
    slashEffect: animation.slashEffect || null,
    drawWidth,
    drawHeight,
    drawX: -anchorX * drawScale,
    drawY: state.y - (anchorY * drawScale)
  };
}

function getDetachedEffectMetrics(characterKey, animationKey, frameNumber, drawScale = 1) {
  const character = CHARACTERS[characterKey];
  const animation = character?.animations?.[animationKey];
  if (!character || !animation) {
    return null;
  }

  const animationFrame = Math.min(frameNumber, Math.max(0, getAnimationFrameCount(animation) - 1));
  const frameIndex = Math.min(
    getFrameIndex(animation, animationFrame),
    Math.max(0, getAnimationSourceFrameCount(animation) - 1)
  );
  const trim = animation.trim;
  const rowOffset = animation.fullImage ? 0 : (animation.row ?? 0) * (animation.frameHeight ?? 0);
  let resolvedImage = null;
  let sourceX = trim?.x ?? 0;
  let sourceY = rowOffset + (trim?.y ?? 0);
  let sourceWidth = trim?.width ?? animation.frameWidth;
  let sourceHeight = trim?.height ?? animation.frameHeight;

  if (animation.frameSources?.length) {
    const frameSource = animation.frameSources[Math.min(frameIndex, animation.frameSources.length - 1)];
    const frameImage = imageCache.get(frameSource);
    if (!frameImage) {
      return null;
    }

    resolvedImage = frameImage instanceof Promise ? null : frameImage;
    if (!resolvedImage) {
      return null;
    }

    sourceWidth = trim?.width ?? animation.frameWidth ?? resolvedImage.width;
    sourceHeight = trim?.height ?? animation.frameHeight ?? resolvedImage.height;
  } else {
    const image = imageCache.get(animation.src);
    if (!image) {
      return null;
    }

    resolvedImage = image instanceof Promise ? null : image;
    if (!resolvedImage) {
      return null;
    }

    if (animation.fullImage) {
      sourceWidth = trim?.width ?? resolvedImage.width;
      sourceHeight = trim?.height ?? resolvedImage.height;
    } else {
      sourceX = (animation.frameWidth * frameIndex) + (trim?.x ?? 0);
      sourceY = rowOffset + (trim?.y ?? 0);
      sourceWidth = trim?.width ?? animation.frameWidth;
      sourceHeight = trim?.height ?? animation.frameHeight;
    }
  }

  if (animation.autoTrim) {
    const bounds = getAutoTrimBounds(animation, frameIndex, resolvedImage, sourceX, sourceY, sourceWidth, sourceHeight);
    sourceX += bounds.x;
    sourceY += bounds.y;
    sourceWidth = bounds.width;
    sourceHeight = bounds.height;
  }

  return {
    resolvedImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    effect: animation.effect || null,
    drawWidth: sourceWidth * drawScale,
    drawHeight: sourceHeight * drawScale,
    drawX: -(sourceWidth * drawScale * 0.5),
    drawY: -(sourceHeight * drawScale * 0.5)
  };
}

function getDetachedEffectRenderScale(effect) {
  return effect.scale * (effect.hitFloor ? (effect.floorImpactScale ?? 1) : 1);
}

function drawBringerStormAura(effect, metrics) {
  if (
    !effect.stormAura
    || effect.characterKey !== "bringerOfDeath"
    || !["spell", "darkVfx2"].includes(effect.animationKey)
  ) {
    return;
  }

  const isDeathSpell = effect.animationKey === "darkVfx2";
  const pulse = 0.94 + (Math.sin((effect.frame + (effect.frameTimer * 10)) * 0.72) * 0.08);
  const auraWidth = metrics.drawWidth * (effect.hitFloor ? (isDeathSpell ? 2.15 : 1.9) : (isDeathSpell ? 1.68 : 1.45)) * pulse;
  const auraHeight = metrics.drawHeight * (effect.hitFloor ? (isDeathSpell ? 1.34 : 1.18) : (isDeathSpell ? 1.08 : 0.92));

  ctx.save();
  ctx.globalAlpha = effect.hitFloor ? (isDeathSpell ? 0.24 : 0.2) : (isDeathSpell ? 0.17 : 0.14);
  ctx.fillStyle = isDeathSpell ? "#4b1b9e" : "#6c34d6";
  ctx.beginPath();
  ctx.ellipse(0, -metrics.drawHeight * 0.02, auraWidth * 0.5, auraHeight * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = effect.hitFloor ? (isDeathSpell ? 0.14 : 0.16) : (isDeathSpell ? 0.1 : 0.12);
  ctx.fillStyle = isDeathSpell ? "#a880ff" : "#d4b2ff";
  ctx.beginPath();
  ctx.ellipse(0, -metrics.drawHeight * 0.08, auraWidth * 0.26, auraHeight * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (effect.hitFloor) {
    ctx.globalAlpha = isDeathSpell ? 0.18 : 0.14;
    ctx.fillStyle = isDeathSpell ? "#5323ba" : "#7d4aff";
    ctx.beginPath();
    ctx.ellipse(0, metrics.drawHeight * 0.34, auraWidth * 0.58, Math.max(16, auraHeight * 0.12), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = isDeathSpell ? 0.08 : 0.1;
    ctx.fillStyle = isDeathSpell ? "#d8c8ff" : "#e9dcff";
    ctx.beginPath();
    ctx.ellipse(0, metrics.drawHeight * 0.3, auraWidth * 0.3, Math.max(10, auraHeight * 0.07), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function mixPalette(level, start, end) {
  return [
    Math.round(start[0] + ((end[0] - start[0]) * level)),
    Math.round(start[1] + ((end[1] - start[1]) * level)),
    Math.round(start[2] + ((end[2] - start[2]) * level))
  ];
}

function createHallokinShadowHeroFrame(metrics) {
  effectCanvas.width = metrics.sourceWidth;
  effectCanvas.height = metrics.sourceHeight;
  effectCtx.clearRect(0, 0, metrics.sourceWidth, metrics.sourceHeight);
  effectCtx.drawImage(
    metrics.resolvedImage,
    metrics.sourceX,
    metrics.sourceY,
    metrics.sourceWidth,
    metrics.sourceHeight,
    0,
    0,
    metrics.sourceWidth,
    metrics.sourceHeight
  );

  const imageData = effectCtx.getImageData(0, 0, metrics.sourceWidth, metrics.sourceHeight);
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
  frameCanvas.width = metrics.sourceWidth;
  frameCanvas.height = metrics.sourceHeight;
  const frameCtx = frameCanvas.getContext("2d");
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(effectCanvas, 0, 0);
  return frameCanvas;
}

function createShadowWarmHighlightFrame(metrics) {
  effectCanvas.width = metrics.sourceWidth;
  effectCanvas.height = metrics.sourceHeight;
  effectCtx.clearRect(0, 0, metrics.sourceWidth, metrics.sourceHeight);
  effectCtx.drawImage(
    metrics.resolvedImage,
    metrics.sourceX,
    metrics.sourceY,
    metrics.sourceWidth,
    metrics.sourceHeight,
    0,
    0,
    metrics.sourceWidth,
    metrics.sourceHeight
  );

  const imageData = effectCtx.getImageData(0, 0, metrics.sourceWidth, metrics.sourceHeight);
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
    const isWarm = red >= 110 && red > (green + 12) && green >= 45 && blue <= 145 && saturation >= 22;

    if (!isWarm || luminance < 72) {
      continue;
    }

    const level = Math.min(Math.max((luminance - 72) / 128, 0), 1);
    data[i] = getShadowChannel(level, 6, 54);
    data[i + 1] = getShadowChannel(level, 8, 68);
    data[i + 2] = getShadowChannel(level, 16, 98);
  }

  effectCtx.putImageData(imageData, 0, 0);

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = metrics.sourceWidth;
  frameCanvas.height = metrics.sourceHeight;
  const frameCtx = frameCanvas.getContext("2d");
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(effectCanvas, 0, 0);
  return frameCanvas;
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
    drawPixelBlock(
      drawCtx,
      x - Math.floor(thickness * 0.5),
      y - Math.floor(thickness * 0.5),
      thickness,
      thickness,
      HALL0KIN_SLASH_PALETTE[colorIndex],
      scale
    );
  }
}

function drawPixelDiamond(drawCtx, centerX, centerY, radiusX, radiusY, thickness, colorIndex, scale) {
  drawPixelLine(drawCtx, centerX, centerY - radiusY, centerX + radiusX, centerY, thickness, colorIndex, scale);
  drawPixelLine(drawCtx, centerX + radiusX, centerY, centerX, centerY + radiusY, thickness, colorIndex, scale);
  drawPixelLine(drawCtx, centerX, centerY + radiusY, centerX - radiusX, centerY, thickness, colorIndex, scale);
  drawPixelLine(drawCtx, centerX - radiusX, centerY, centerX, centerY - radiusY, thickness, colorIndex, scale);
}

function drawPixelBurstSpokes(drawCtx, centerX, centerY, radiusX, radiusY, spokes, thickness, colorIndex, scale) {
  for (let i = 0; i < spokes; i += 1) {
    const angle = (Math.PI * 2 * i) / spokes;
    const x = Math.round(centerX + (Math.cos(angle) * radiusX));
    const y = Math.round(centerY + (Math.sin(angle) * radiusY));
    drawPixelLine(drawCtx, centerX, centerY, x, y, thickness, colorIndex, scale);
  }
}

function drawPixelRectOutline(drawCtx, x, y, width, height, thickness, colorIndex, scale) {
  drawPixelLine(drawCtx, x, y, x + width, y, thickness, colorIndex, scale);
  drawPixelLine(drawCtx, x + width, y, x + width, y + height, thickness, colorIndex, scale);
  drawPixelLine(drawCtx, x + width, y + height, x, y + height, thickness, colorIndex, scale);
  drawPixelLine(drawCtx, x, y + height, x, y, thickness, colorIndex, scale);
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
    case "attack2": {
      const swing = 14 + (frameNumber * 3);
      drawPixelLine(drawCtx, 8, 30, 20 + swing, 4, 2, 2, scale);
      drawPixelLine(drawCtx, 10, 4, 22 + swing, 28, 2, 3, scale);
      drawPixelCircle(drawCtx, 24, 16, 9 + frameNumber, 2, 1, scale, 0.56);
      drawPixelCircle(drawCtx, 24, 16, 5 + frameNumber, 1, 4, scale, 0.64);
      drawPixelBurstSpokes(drawCtx, 24, 16, 14 + frameNumber, 8 + frameNumber, 8, 1, 4, scale);
      break;
    }
    case "rend": {
      const clawReach = 10 + (frameNumber * 3);
      drawPixelLine(drawCtx, 8, 10, 22 + clawReach, 3, 2, 2, scale);
      drawPixelLine(drawCtx, 10, 18, 24 + clawReach, 11, 2, 3, scale);
      drawPixelLine(drawCtx, 12, 26, 26 + clawReach, 20, 2, 4, scale);
      drawPixelLine(drawCtx, 20, 6, 30 + clawReach, 0, 1, 4, scale);
      drawPixelCircle(drawCtx, 20 + Math.round(clawReach * 0.55), 14, 7 + Math.min(frameNumber, 4), 2, 1, scale, 0.36);
      drawPixelBurstSpokes(drawCtx, 28 + clawReach, 12, 8, 6, 5, 1, 4, scale);
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
    case "spears": {
      const travel = 10 + (frameNumber * 8);
      [8, 14, 20].forEach((laneY, index) => {
        const thickness = index === 1 ? 2 : 1;
        drawPixelLine(drawCtx, 6, laneY, 18 + travel, laneY, thickness, index === 1 ? 2 : 3, scale);
        drawPixelLine(drawCtx, 14 + travel, laneY - 2, 20 + travel, laneY, 1, 4, scale);
        drawPixelLine(drawCtx, 14 + travel, laneY + 2, 20 + travel, laneY, 1, 4, scale);
        drawPixelBlock(drawCtx, 18 + travel, laneY - 1, 3, 3, HALL0KIN_SLASH_PALETTE[4], scale);
      });
      drawPixelCircle(drawCtx, 10 + Math.round(travel * 0.4), 14, 8 + Math.min(frameNumber, 4), 2, 1, scale, 0.32);
      drawPixelBurstSpokes(drawCtx, 18 + travel, 14, 8, 5, 6, 1, 4, scale);
      break;
    }
    case "burst": {
      const grow = 8 + (frameNumber * 2);
      drawPixelCircle(drawCtx, 24, 20, grow + 8, 3, 1, scale, 0.68);
      drawPixelCircle(drawCtx, 24, 20, grow + 2, 2, 2, scale, 0.72);
      drawPixelDiamond(drawCtx, 24, 20, Math.max(8, grow), Math.max(6, Math.round(grow * 0.6)), 2, 3, scale);
      drawPixelBurstSpokes(drawCtx, 24, 20, grow + 10, Math.round((grow + 10) * 0.74), 10, 1, 4, scale);
      drawPixelCircle(drawCtx, 24, 20, 4 + Math.min(frameNumber, 3), 1, 4, scale, 0.8);
      break;
    }
    case "pulse": {
      const radius = 8 + (frameNumber * 3);
      const centerX = 26;
      const centerY = 20;
      drawPixelCircle(drawCtx, centerX, centerY, radius + 10, 3, 1, scale, 0.54);
      drawPixelCircle(drawCtx, centerX, centerY, radius + 4, 2, 2, scale, 0.62);
      drawPixelCircle(drawCtx, centerX, centerY, Math.max(6, radius - 2), 2, 3, scale, 0.72);
      drawPixelBurstSpokes(drawCtx, centerX, centerY, radius + 10, Math.round((radius + 10) * 0.82), 12, 1, 4, scale);
      drawPixelBlock(drawCtx, centerX - 3, centerY - 3, 6, 6, HALL0KIN_SLASH_PALETTE[4], scale);
      break;
    }
    case "aoe": {
      const radius = 12 + (Math.min(frameNumber, 8) * 2);
      const centerX = 26;
      const centerY = 20;
      drawPixelCircle(drawCtx, centerX, centerY, radius + 8, 3, 1, scale, 0.54);
      drawPixelCircle(drawCtx, centerX, centerY, radius + 1, 2, 2, scale, 0.6);
      drawPixelCircle(drawCtx, centerX, centerY, Math.max(8, radius - 6), 2, 3, scale, 0.68);
      drawPixelLine(drawCtx, centerX - radius - 10, centerY, centerX + radius + 10, centerY, 1, 2, scale);
      drawPixelLine(drawCtx, centerX, centerY - radius, centerX, centerY + radius, 1, 2, scale);
      drawPixelLine(drawCtx, centerX - Math.round(radius * 0.86), centerY - Math.round(radius * 0.46), centerX + Math.round(radius * 0.86), centerY + Math.round(radius * 0.46), 1, 4, scale);
      drawPixelLine(drawCtx, centerX - Math.round(radius * 0.86), centerY + Math.round(radius * 0.46), centerX + Math.round(radius * 0.86), centerY - Math.round(radius * 0.46), 1, 4, scale);
      drawPixelCircle(drawCtx, centerX, centerY, 5 + Math.min(frameNumber, 3), 1, 4, scale, 0.8);
      break;
    }
    case "dominion": {
      const radius = 12 + (Math.min(frameNumber, 9) * 2);
      const centerX = 28;
      const centerY = 22;
      drawPixelRectOutline(drawCtx, centerX - radius, centerY - Math.round(radius * 0.55), radius * 2, Math.round(radius * 1.1), 1, 1, scale);
      drawPixelCircle(drawCtx, centerX, centerY, radius + 10, 3, 1, scale, 0.48);
      drawPixelCircle(drawCtx, centerX, centerY, radius + 2, 2, 2, scale, 0.54);
      drawPixelDiamond(drawCtx, centerX, centerY, Math.max(10, radius - 2), Math.max(8, Math.round(radius * 0.6)), 2, 3, scale);
      drawPixelBurstSpokes(drawCtx, centerX, centerY, radius + 8, Math.round((radius + 8) * 0.52), 8, 1, 4, scale);
      drawPixelBlock(drawCtx, centerX - 2, centerY - 2, 4, 4, HALL0KIN_SLASH_PALETTE[4], scale);
      break;
    }
    case "halo": {
      const radius = 11 + (frameNumber * 2);
      const centerX = 24;
      const centerY = 10;
      drawPixelCircle(drawCtx, centerX, centerY, radius + 3, 2, 2, scale, 0.36);
      drawPixelCircle(drawCtx, centerX, centerY, radius - 1, 2, 3, scale, 0.42);
      drawPixelLine(drawCtx, 9, 34, centerX - 6, centerY + 6, 2, 1, scale);
      drawPixelLine(drawCtx, 39, 34, centerX + 6, centerY + 6, 2, 1, scale);
      drawPixelLine(drawCtx, 15, 36, centerX - 2, centerY + 8, 1, 4, scale);
      drawPixelLine(drawCtx, 33, 36, centerX + 2, centerY + 8, 1, 4, scale);
      drawPixelBurstSpokes(drawCtx, centerX, centerY, 10 + frameNumber, 4, 6, 1, 4, scale);
      break;
    }
    case "rain": {
      const drift = frameNumber * 3;
      const columns = [8, 16, 24, 32, 40, 48];
      columns.forEach((x, index) => {
        const endY = 20 + drift + (index % 2 === 0 ? 4 : 0);
        drawPixelLine(drawCtx, x, 2 + Math.max(0, drift - 4), x - 2, endY, index % 2 === 0 ? 2 : 1, index % 2 === 0 ? 2 : 3, scale);
        drawPixelLine(drawCtx, x + 2, 0 + Math.max(0, drift - 6), x, endY - 2, 1, 4, scale);
        drawPixelBlock(drawCtx, x - 2, endY, 3, 3, HALL0KIN_SLASH_PALETTE[4], scale);
      });
      drawPixelCircle(drawCtx, 28, 10, 9 + Math.min(frameNumber, 4), 2, 1, scale, 0.38);
      drawPixelBurstSpokes(drawCtx, 28, 10, 12, 4, 8, 1, 4, scale);
      break;
    }
    case "cataclysm": {
      const radius = 12 + (frameNumber * 2);
      const centerX = 30;
      const centerY = 24;
      drawPixelCircle(drawCtx, centerX, centerY, radius + 12, 3, 1, scale, 0.54);
      drawPixelCircle(drawCtx, centerX, centerY, radius + 4, 2, 2, scale, 0.6);
      drawPixelCircle(drawCtx, centerX, centerY, Math.max(6, radius - 8), 2, 3, scale, 0.72);
      drawPixelDiamond(drawCtx, centerX, centerY, radius + 2, Math.max(8, Math.round(radius * 0.66)), 2, 3, scale);
      drawPixelBurstSpokes(drawCtx, centerX, centerY, radius + 14, Math.round((radius + 14) * 0.74), 10, 1, 4, scale);
      drawPixelLine(drawCtx, centerX - radius - 12, centerY, centerX + radius + 12, centerY, 1, 2, scale);
      drawPixelLine(drawCtx, centerX, centerY - radius - 10, centerX, centerY + radius + 10, 1, 2, scale);
      drawPixelBlock(drawCtx, centerX - 4, centerY - 4, 8, 8, HALL0KIN_SLASH_PALETTE[4], scale);
      break;
    }
    case "lattice": {
      const span = 10 + (frameNumber * 3);
      const width = 18 + span;
      drawPixelRectOutline(drawCtx, 8, 6, width, 24, 1, 1, scale);
      drawPixelLine(drawCtx, 8, 6, 8 + width, 30, 1, 2, scale);
      drawPixelLine(drawCtx, 8, 30, 8 + width, 6, 1, 2, scale);
      drawPixelLine(drawCtx, 14, 6, 14 + width, 30, 1, 3, scale);
      drawPixelLine(drawCtx, 14, 30, 14 + width, 6, 1, 3, scale);
      drawPixelBurstSpokes(drawCtx, 20 + Math.round(width * 0.5), 18, 10, 6, 8, 1, 4, scale);
      break;
    }
    case "forge": {
      const lift = 8 + (frameNumber * 4);
      const topY = 34 - lift;
      [12, 24, 36].forEach((x, index) => {
        drawPixelLine(drawCtx, x, 34, x, topY + (index === 1 ? -4 : 0), 2, index === 1 ? 2 : 3, scale);
        drawPixelBlock(drawCtx, x - 2, topY - (index === 1 ? 5 : 1), 5, 4, HALL0KIN_SLASH_PALETTE[4], scale);
      });
      drawPixelDiamond(drawCtx, 24, topY - 6, 10, 6, 2, 3, scale);
      drawPixelBurstSpokes(drawCtx, 24, topY - 6, 10, 6, 6, 1, 4, scale);
      break;
    }
    case "prison": {
      const radius = 12 + (frameNumber * 2);
      const centerX = 28;
      const centerY = 20;
      const halfW = Math.max(14, radius);
      const halfH = Math.max(10, Math.round(radius * 0.7));
      drawPixelRectOutline(drawCtx, centerX - halfW, centerY - halfH, halfW * 2, halfH * 2, 1, 1, scale);
      [-8, 0, 8].forEach((offset) => {
        drawPixelLine(drawCtx, centerX + offset, centerY - halfH, centerX + offset, centerY + halfH, 1, 2, scale);
      });
      [[-halfW, -halfH], [halfW, -halfH], [-halfW, halfH], [halfW, halfH]].forEach(([dx, dy]) => {
        drawPixelBlock(drawCtx, centerX + dx - 1, centerY + dy - 1, 3, 3, HALL0KIN_SLASH_PALETTE[4], scale);
      });
      drawPixelDiamond(drawCtx, centerX, centerY, 8, 5, 1, 4, scale);
      break;
    }
    case "blossom": {
      const bloom = 8 + (frameNumber * 2);
      const centerX = 26;
      const centerY = 20;
      [[0, -bloom], [bloom, 0], [0, bloom], [-bloom, 0]].forEach(([dx, dy], index) => {
        drawPixelDiamond(drawCtx, centerX + dx, centerY + dy, 6 + (index % 2), 4 + (index % 2), 1, index % 2 === 0 ? 2 : 3, scale);
      });
      drawPixelCircle(drawCtx, centerX, centerY, bloom + 4, 2, 1, scale, 0.36);
      drawPixelCircle(drawCtx, centerX, centerY, Math.max(6, bloom - 2), 1, 4, scale, 0.64);
      break;
    }
    case "spiral": {
      const centerX = 28;
      const centerY = 20;
      const spin = frameNumber * 0.45;
      for (let step = 0; step < 8; step += 1) {
        const angle = spin + (step * 0.72);
        const radius = 4 + (step * 2);
        const x = centerX + Math.round(Math.cos(angle) * radius);
        const y = centerY + Math.round(Math.sin(angle) * Math.max(3, radius * 0.7));
        drawPixelBlock(drawCtx, x - 1, y - 1, step < 4 ? 2 : 3, step < 4 ? 2 : 3, HALL0KIN_SLASH_PALETTE[(step % 3) + 1], scale);
      }
      drawPixelCircle(drawCtx, centerX, centerY, 8 + frameNumber, 1, 2, scale, 0.32);
      drawPixelBlock(drawCtx, centerX - 2, centerY - 2, 4, 4, HALL0KIN_SLASH_PALETTE[4], scale);
      break;
    }
    case "orbit": {
      const centerX = 30;
      const centerY = 20;
      const ring = 10 + (frameNumber * 2);
      drawPixelCircle(drawCtx, centerX, centerY, ring, 2, 1, scale, 0.4);
      drawPixelCircle(drawCtx, centerX, centerY, Math.max(6, ring - 6), 1, 3, scale, 0.5);
      [0, 2.1, 4.2].forEach((angleOffset, index) => {
        const angle = (frameNumber * 0.5) + angleOffset;
        const x = centerX + Math.round(Math.cos(angle) * ring);
        const y = centerY + Math.round(Math.sin(angle) * Math.max(5, ring * 0.55));
        drawPixelBlock(drawCtx, x - 2, y - 2, 4, 4, HALL0KIN_SLASH_PALETTE[index + 2], scale);
      });
      break;
    }
    case "quake": {
      const reach = 12 + (frameNumber * 5);
      const groundY = 24;
      drawPixelLine(drawCtx, 30, groundY, 30 + reach, groundY + 2, 2, 2, scale);
      drawPixelLine(drawCtx, 30, groundY, 30 - reach, groundY + 2, 2, 2, scale);
      drawPixelLine(drawCtx, 18, groundY - 2, 12, groundY + 6, 1, 3, scale);
      drawPixelLine(drawCtx, 42, groundY - 2, 48, groundY + 6, 1, 3, scale);
      drawPixelLine(drawCtx, 24, groundY - 4, 20, groundY + 8, 1, 4, scale);
      drawPixelLine(drawCtx, 36, groundY - 4, 40, groundY + 8, 1, 4, scale);
      drawPixelBurstSpokes(drawCtx, 30, groundY, 8 + frameNumber, 4, 6, 1, 4, scale);
      break;
    }
    case "lance": {
      const travel = 18 + (frameNumber * 10);
      const tipX = 20 + travel;
      drawPixelLine(drawCtx, 6, 18, tipX, 18, 2, 2, scale);
      drawPixelLine(drawCtx, 10, 14, tipX, 18, 1, 3, scale);
      drawPixelLine(drawCtx, 10, 22, tipX, 18, 1, 3, scale);
      drawPixelLine(drawCtx, tipX - 8, 12, tipX + 2, 18, 1, 4, scale);
      drawPixelLine(drawCtx, tipX - 8, 24, tipX + 2, 18, 1, 4, scale);
      drawPixelBlock(drawCtx, tipX, 16, 4, 4, HALL0KIN_SLASH_PALETTE[4], scale);
      break;
    }
    case "mirror": {
      const open = 8 + (frameNumber * 3);
      const centerX = 28;
      const centerY = 18;
      drawPixelLine(drawCtx, centerX - 4, centerY, centerX - open - 10, centerY - 10, 2, 2, scale);
      drawPixelLine(drawCtx, centerX - 2, centerY + 2, centerX - open - 12, centerY + 10, 2, 3, scale);
      drawPixelLine(drawCtx, centerX + 4, centerY, centerX + open + 10, centerY - 10, 2, 2, scale);
      drawPixelLine(drawCtx, centerX + 2, centerY + 2, centerX + open + 12, centerY + 10, 2, 3, scale);
      drawPixelDiamond(drawCtx, centerX, centerY + 1, 5 + Math.min(frameNumber, 3), 4, 1, 4, scale);
      break;
    }
    case "storm": {
      const radius = 12 + (frameNumber * 2);
      const centerX = 28;
      const centerY = 22;
      drawPixelCircle(drawCtx, centerX, centerY, radius + 4, 2, 1, scale, 0.44);
      drawPixelCircle(drawCtx, centerX, centerY, Math.max(8, radius - 2), 2, 2, scale, 0.54);
      drawPixelBurstSpokes(drawCtx, centerX, centerY, radius + 10, Math.round((radius + 10) * 0.8), 12, 1, 4, scale);
      drawPixelLine(drawCtx, centerX - radius, centerY - 4, centerX + radius, centerY + 4, 1, 3, scale);
      drawPixelLine(drawCtx, centerX - radius, centerY + 4, centerX + radius, centerY - 4, 1, 3, scale);
      break;
    }
    case "throne": {
      const rise = 10 + (frameNumber * 2);
      const centerX = 30;
      const centerY = 22;
      drawPixelRectOutline(drawCtx, centerX - 10, centerY - rise, 20, rise + 10, 1, 1, scale);
      drawPixelLine(drawCtx, centerX - 14, centerY + 6, centerX + 14, centerY + 6, 2, 2, scale);
      drawPixelLine(drawCtx, centerX - 6, centerY - rise - 4, centerX - 2, centerY - rise - 12, 1, 4, scale);
      drawPixelLine(drawCtx, centerX, centerY - rise - 6, centerX, centerY - rise - 14, 1, 4, scale);
      drawPixelLine(drawCtx, centerX + 6, centerY - rise - 4, centerX + 2, centerY - rise - 12, 1, 4, scale);
      drawPixelDiamond(drawCtx, centerX, centerY, 8, 5, 1, 3, scale);
      break;
    }
    case "maelstrom": {
      const radius = 12 + (frameNumber * 3);
      const centerX = 30;
      const centerY = 22;
      drawPixelCircle(drawCtx, centerX, centerY, radius + 12, 3, 1, scale, 0.5);
      drawPixelCircle(drawCtx, centerX, centerY, radius + 4, 2, 2, scale, 0.62);
      drawPixelCircle(drawCtx, centerX, centerY, Math.max(8, radius - 4), 2, 3, scale, 0.72);
      drawPixelBurstSpokes(drawCtx, centerX, centerY, radius + 16, Math.round((radius + 16) * 0.82), 12, 1, 4, scale);
      for (let step = 0; step < 10; step += 1) {
        const angle = (frameNumber * 0.35) + (step * 0.62);
        const orbit = 6 + (step * 2);
        const x = centerX + Math.round(Math.cos(angle) * orbit);
        const y = centerY + Math.round(Math.sin(angle) * Math.max(4, orbit * 0.72));
        drawPixelBlock(drawCtx, x - 1, y - 1, step < 4 ? 2 : 3, step < 4 ? 2 : 3, HALL0KIN_SLASH_PALETTE[(step % 3) + 1], scale);
      }
      drawPixelBlock(drawCtx, centerX - 4, centerY - 4, 8, 8, HALL0KIN_SLASH_PALETTE[4], scale);
      break;
    }
    default:
      break;
  }
}

function drawHallokinSlashEffect(animationName, frameNumber, alpha = 1) {
  if (state.currentCharacterKey !== "hallokin") {
    return;
  }

  const slashEffect = getAnimation(animationName)?.slashEffect;
  if (!slashEffect) {
    return;
  }

  const effectConfig = HALL0KIN_SLASH_EFFECTS[slashEffect.key];
  if (!effectConfig) {
    return;
  }

  const frameIndex = Math.min(frameNumber, effectConfig.frames - 1);
  const actionTransform = getHallokinActionTransform(animationName, frameNumber);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(state.x + (actionTransform.offsetX * state.facing), actionTransform.offsetY);
  ctx.scale((effectConfig.orientToFacing === false ? 1 : state.facing) * actionTransform.scaleX, actionTransform.scaleY);
  ctx.translate(effectConfig.offsetX, state.y + effectConfig.offsetY);
  renderHallokinSlashFrame(slashEffect.key, frameIndex, ctx, effectConfig.pixelScale);
  ctx.restore();
}

function drawHallokinBackAura(animationName, frameNumber, alpha = 1) {
  if (state.currentCharacterKey !== "hallokin") {
    return;
  }

  const slashEffect = getAnimation(animationName)?.slashEffect;
  if (!slashEffect) {
    return;
  }

  const effectConfig = HALL0KIN_SLASH_EFFECTS[slashEffect.key];
  const auraStyle = HALL0KIN_AURA_STYLES[slashEffect.key];
  if (!effectConfig || !auraStyle) {
    return;
  }

  const frameIndex = Math.min(frameNumber, effectConfig.frames - 1);
  const actionTransform = getHallokinActionTransform(animationName, frameNumber);

  ctx.save();
  ctx.globalAlpha = alpha * auraStyle.alpha;
  ctx.translate(state.x + (actionTransform.offsetX * state.facing), actionTransform.offsetY);
  ctx.scale((effectConfig.orientToFacing === false ? 1 : state.facing) * actionTransform.scaleX, actionTransform.scaleY);
  ctx.translate(effectConfig.offsetX + auraStyle.offsetX, state.y + effectConfig.offsetY + auraStyle.offsetY);
  renderHallokinSlashFrame(slashEffect.key, frameIndex, ctx, effectConfig.pixelScale + auraStyle.scaleBoost);

  if (auraStyle.scaleBoost > 1) {
    ctx.globalAlpha = alpha * auraStyle.alpha * 0.55;
    ctx.translate(2, 2);
    renderHallokinSlashFrame(slashEffect.key, frameIndex, ctx, effectConfig.pixelScale + Math.max(1, auraStyle.scaleBoost - 1));
  }

  ctx.restore();
}

function getShadowChannel(level, dark, light) {
  return Math.round(dark + ((light - dark) * (1 - level)));
}

function isBackdropMatch(red, green, blue, backdrop, tolerance) {
  return Math.abs(red - backdrop.red) <= tolerance
    && Math.abs(green - backdrop.green) <= tolerance
    && Math.abs(blue - backdrop.blue) <= tolerance;
}

function createBackdropRemovedFrame(metrics) {
  effectCanvas.width = metrics.sourceWidth;
  effectCanvas.height = metrics.sourceHeight;
  effectCtx.clearRect(0, 0, metrics.sourceWidth, metrics.sourceHeight);
  effectCtx.drawImage(
    metrics.resolvedImage,
    metrics.sourceX,
    metrics.sourceY,
    metrics.sourceWidth,
    metrics.sourceHeight,
    0,
    0,
    metrics.sourceWidth,
    metrics.sourceHeight
  );

  const imageData = effectCtx.getImageData(0, 0, metrics.sourceWidth, metrics.sourceHeight);
  const { data } = imageData;
  const tolerance = metrics.effect?.tolerance ?? 14;
  const backdrop = {
    red: data[0],
    green: data[1],
    blue: data[2]
  };

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) {
      continue;
    }

    if (isBackdropMatch(data[i], data[i + 1], data[i + 2], backdrop, tolerance)) {
      data[i + 3] = 0;
    }
  }

  effectCtx.putImageData(imageData, 0, 0);

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = metrics.sourceWidth;
  frameCanvas.height = metrics.sourceHeight;
  const frameCtx = frameCanvas.getContext("2d");
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(effectCanvas, 0, 0);
  return frameCanvas;
}

function createNightBorneCleanupFrame(metrics) {
  effectCanvas.width = metrics.sourceWidth;
  effectCanvas.height = metrics.sourceHeight;
  effectCtx.clearRect(0, 0, metrics.sourceWidth, metrics.sourceHeight);
  effectCtx.drawImage(
    metrics.resolvedImage,
    metrics.sourceX,
    metrics.sourceY,
    metrics.sourceWidth,
    metrics.sourceHeight,
    0,
    0,
    metrics.sourceWidth,
    metrics.sourceHeight
  );

  const imageData = effectCtx.getImageData(0, 0, metrics.sourceWidth, metrics.sourceHeight);
  const { data } = imageData;
  const tolerance = metrics.effect?.tolerance ?? 8;
  const backdrop = {
    red: data[0],
    green: data[1],
    blue: data[2]
  };

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) {
      continue;
    }

    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    if (isBackdropMatch(red, green, blue, backdrop, tolerance)) {
      data[i + 3] = 0;
      continue;
    }

    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const saturation = maxChannel - minChannel;
    const luminance = (red * 0.299) + (green * 0.587) + (blue * 0.114);
    const isPurpleGlow = blue >= 86 && red >= 70 && blue > green && red > green;

    if (isPurpleGlow) {
      const glowLevel = Math.min(Math.max((luminance - 72) / 144, 0), 1);
      const mapped = mixPalette(glowLevel, [124, 84, 214], [244, 214, 255]);
      data[i] = mapped[0];
      data[i + 1] = mapped[1];
      data[i + 2] = mapped[2];
      continue;
    }

    if (luminance < 58) {
      const bodyLevel = Math.min(Math.max(luminance / 58, 0), 1);
      const mapped = mixPalette(bodyLevel, [9, 23, 37], [32, 58, 82]);
      data[i] = mapped[0];
      data[i + 1] = mapped[1];
      data[i + 2] = mapped[2];
      continue;
    }

    if (saturation < 42 && blue >= green && luminance < 108) {
      const midLevel = Math.min(Math.max((luminance - 58) / 50, 0), 1);
      const mapped = mixPalette(midLevel, [24, 42, 60], [58, 82, 110]);
      data[i] = mapped[0];
      data[i + 1] = mapped[1];
      data[i + 2] = mapped[2];
    }
  }

  effectCtx.putImageData(imageData, 0, 0);

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = metrics.sourceWidth;
  frameCanvas.height = metrics.sourceHeight;
  const frameCtx = frameCanvas.getContext("2d");
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(effectCanvas, 0, 0);
  return frameCanvas;
}

function createShadowHighlightFrame(metrics) {
  effectCanvas.width = metrics.sourceWidth;
  effectCanvas.height = metrics.sourceHeight;
  effectCtx.clearRect(0, 0, metrics.sourceWidth, metrics.sourceHeight);
  effectCtx.drawImage(
    metrics.resolvedImage,
    metrics.sourceX,
    metrics.sourceY,
    metrics.sourceWidth,
    metrics.sourceHeight,
    0,
    0,
    metrics.sourceWidth,
    metrics.sourceHeight
  );

  const imageData = effectCtx.getImageData(0, 0, metrics.sourceWidth, metrics.sourceHeight);
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

    if (luminance < 186 || saturation > 72) {
      continue;
    }

    const level = Math.min(Math.max((luminance - 186) / 69, 0), 1);
    data[i] = getShadowChannel(level, 8, 62);
    data[i + 1] = getShadowChannel(level, 10, 72);
    data[i + 2] = getShadowChannel(level, 16, 96);
  }

  effectCtx.putImageData(imageData, 0, 0);

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = metrics.sourceWidth;
  frameCanvas.height = metrics.sourceHeight;
  const frameCtx = frameCanvas.getContext("2d");
  frameCtx.imageSmoothingEnabled = false;
  frameCtx.drawImage(effectCanvas, 0, 0);
  return frameCanvas;
}

function getEffectFrame(metrics) {
  if (!metrics.effect) {
    return null;
  }

  const cacheKey = [
    metrics.effect.type,
    JSON.stringify(metrics.effect),
    metrics.sourceX,
    metrics.sourceY,
    metrics.sourceWidth,
    metrics.sourceHeight,
    metrics.resolvedImage.src
  ].join("|");

  if (effectFrameCache.has(cacheKey)) {
    return effectFrameCache.get(cacheKey);
  }

  let frameImage = null;

  if (metrics.effect.type === "shadowHighlights") {
    frameImage = createShadowHighlightFrame(metrics);
  } else if (metrics.effect.type === "hallokinShadowHero") {
    frameImage = createHallokinShadowHeroFrame(metrics);
  } else if (metrics.effect.type === "shadowWarmHighlights") {
    frameImage = createShadowWarmHighlightFrame(metrics);
  } else if (metrics.effect.type === "nightborneCleanup") {
    frameImage = createNightBorneCleanupFrame(metrics);
  } else if (metrics.effect.type === "removeBackdrop") {
    frameImage = createBackdropRemovedFrame(metrics);
  }

  effectFrameCache.set(cacheKey, frameImage);
  return frameImage;
}

function drawAnimationFrame(animationName, frameNumber, alpha = 1) {
  const metrics = getDrawMetrics(animationName, frameNumber);
  if (!metrics) {
    return null;
  }

  const frameImage = getEffectFrame(metrics);
  const actionTransform = getHallokinActionTransform(animationName, frameNumber);
  const facingScale = state.facing * getCharacterFacingScale();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(state.x + (actionTransform.offsetX * state.facing), actionTransform.offsetY);
  ctx.scale(facingScale * actionTransform.scaleX, actionTransform.scaleY);
  if (frameImage) {
    ctx.drawImage(
      frameImage,
      0,
      0,
      metrics.sourceWidth,
      metrics.sourceHeight,
      metrics.drawX,
      metrics.drawY,
      metrics.drawWidth,
      metrics.drawHeight
    );
  } else {
    ctx.drawImage(
      metrics.resolvedImage,
      metrics.sourceX,
      metrics.sourceY,
      metrics.sourceWidth,
      metrics.sourceHeight,
      metrics.drawX,
      metrics.drawY,
      metrics.drawWidth,
      metrics.drawHeight
    );
  }
  ctx.restore();

  return metrics;
}

function drawDetachedEffects() {
  state.detachedEffects.forEach((effect) => {
    const metrics = getDetachedEffectMetrics(
      effect.characterKey,
      effect.animationKey,
      effect.frame,
      getDetachedEffectRenderScale(effect)
    );
    if (!metrics) {
      return;
    }

    const frameImage = getEffectFrame(metrics);
    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.scale(effect.facing * getCharacterFacingScale(effect.characterKey), 1);
    drawBringerStormAura(effect, metrics);
    if (frameImage) {
      ctx.drawImage(
        frameImage,
        0,
        0,
        metrics.sourceWidth,
        metrics.sourceHeight,
        metrics.drawX,
        metrics.drawY,
        metrics.drawWidth,
        metrics.drawHeight
      );
    } else {
      ctx.drawImage(
        metrics.resolvedImage,
        metrics.sourceX,
        metrics.sourceY,
        metrics.sourceWidth,
        metrics.sourceHeight,
        metrics.drawX,
        metrics.drawY,
        metrics.drawWidth,
        metrics.drawHeight
      );
    }

    ctx.restore();
  });
}

function drawForeground() {
  ctx.strokeStyle = "rgba(28, 34, 44, 0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, STAGE.groundY + 24);
  ctx.lineTo(STAGE.width, STAGE.groundY + 24);
  ctx.stroke();
}

function render() {
  ctx.clearRect(0, 0, STAGE.width, STAGE.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, STAGE.width, STAGE.height);

  const activeMetrics = getDrawMetrics(state.currentAnimation, state.currentFrame);
  const activeTransform = getHallokinActionTransform(state.currentAnimation, state.currentFrame);
  const transitionMetrics = state.transition
    ? getDrawMetrics(state.transition.from, state.transition.frame)
    : null;
  const transitionTransform = state.transition
    ? getHallokinActionTransform(state.transition.from, state.transition.frame)
    : { shadowScale: 1 };
  const shadowWidth = Math.max(activeMetrics?.drawWidth ?? 0, transitionMetrics?.drawWidth ?? 0);
  const shadowScale = Math.max(activeTransform.shadowScale ?? 1, transitionTransform.shadowScale ?? 1);

  ctx.save();
  ctx.translate(state.screenShakeX, state.screenShakeY);

  if (shadowWidth > 0) {
    drawShadow(state.x, shadowWidth, shadowScale);
  }

  drawParticles("back");

  if (state.transition) {
    const blend = Math.min(state.transition.elapsed / state.transition.duration, 1);
    drawHallokinBackAura(state.transition.from, state.transition.frame, 1 - blend);
    drawHallokinBackAura(state.currentAnimation, state.currentFrame, blend);
    drawAnimationFrame(state.transition.from, state.transition.frame, 1 - blend);
    drawAnimationFrame(state.currentAnimation, state.currentFrame, blend);
    drawHallokinSlashEffect(state.transition.from, state.transition.frame, 1 - blend);
    drawHallokinSlashEffect(state.currentAnimation, state.currentFrame, blend);
  } else {
    drawHallokinBackAura(state.currentAnimation, state.currentFrame);
    drawAnimationFrame(state.currentAnimation, state.currentFrame);
    drawHallokinSlashEffect(state.currentAnimation, state.currentFrame);
  }

  drawDetachedEffects();
  drawParticles("front");
  drawForeground();
  ctx.restore();

  if (state.stageFlashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = state.stageFlashAlpha;
    ctx.fillStyle = state.stageFlashColor;
    ctx.fillRect(0, 0, STAGE.width, STAGE.height);
    ctx.restore();
  }
}

function step(timestamp) {
  if (!state.ready) {
    requestAnimationFrame(step);
    return;
  }

  if (!state.lastTimestamp) {
    state.lastTimestamp = timestamp;
  }

  const dt = Math.min((timestamp - state.lastTimestamp) / 1000, 0.033);
  state.lastTimestamp = timestamp;

  applyInput();
  updatePhysics(dt);
  updateAnimation(dt);
  updateTransition(dt);
  updateDetachedEffects(dt);
  updateParticles(dt);
  updateHallokinActionFx(dt);
  render();
  refreshHud();
  requestAnimationFrame(step);
}

function createCharacterButtons() {
  characterPicker.innerHTML = "";

  const roleOrder = { protagonist: 0, npc: 1, mob: 2, boss: 3 };
  Object.entries(CHARACTERS)
    .sort(([, left], [, right]) => {
      const roleDiff = (roleOrder[left.role] ?? 99) - (roleOrder[right.role] ?? 99);
      if (roleDiff !== 0) {
        return roleDiff;
      }

      return left.name.localeCompare(right.name);
    })
    .forEach(([key, character]) => {
    const button = document.createElement("button");
    button.type = "button";
	    button.className = "character-card";
	    button.dataset.character = key;
	    button.innerHTML = `
	      <span class="character-tag">${getRoleLabel(character.role)}</span>
	      <strong>${character.name}</strong>
	    `;
    button.addEventListener("click", () => {
      if (!testerUnlocked) {
        return;
      }

      state.currentCharacterKey = key;
      updateCharacterButtons();
      updateActionButtons();
      resetPlayer();
    });
    characterPicker.appendChild(button);
  });
}

function updateCharacterButtons() {
  [...characterPicker.querySelectorAll(".character-card")].forEach((button) => {
    button.classList.toggle("active", button.dataset.character === state.currentCharacterKey);
  });
}

function createActionButton(meta) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "action-button";
  button.dataset.action = meta.key;
  button.innerHTML = `<strong>${meta.label}</strong><span>${meta.hint}</span>`;

  button.addEventListener("click", () => {
    if (!testerUnlocked) {
      return;
    }

    const actionToPlay = chooseAction(getActionKeys(meta));
    if (actionToPlay) {
      const animation = getAnimation(actionToPlay);
      if (animation?.loop) {
        state.previewAnimation = actionToPlay;
        state.activeAction = null;
        state.transition = null;
        state.vx = 0;
        setAnimation(actionToPlay, true);
        refreshHud();
        return;
      }

      triggerAction(actionToPlay);
    }
  });

  return button;
}

function updateActionButtons() {
  actionButtons.innerHTML = "";

  getActionMeta().forEach((meta) => {
    const button = createActionButton(meta);
    const availableAction = chooseAction(getActionKeys(meta));
    button.disabled = !availableAction;
    actionButtons.appendChild(button);
  });
}

function normalizeKey(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

window.addEventListener("keydown", (event) => {
  const key = normalizeKey(event.key);
  const blockKeys = new Set(["ArrowLeft", "ArrowRight", " ", "Spacebar"]);
  const gameplayKeys = new Set(["a", "d", "j", "k", "r"]);
  const targetTag = event.target instanceof HTMLElement ? event.target.tagName : "";
  const allowOverlayControl = targetTag === "INPUT" || targetTag === "BUTTON";

  if (!testerUnlocked) {
    if (!allowOverlayControl && (blockKeys.has(event.key) || gameplayKeys.has(key))) {
      event.preventDefault();
    }
    return;
  }

  if (blockKeys.has(event.key)) {
    event.preventDefault();
  }

  if (key === " " || key === "Spacebar") {
    state.pendingJump = true;
    return;
  }

  if (key === "j") {
    triggerPrimaryAction();
    return;
  }

  if (key === "k") {
    triggerSecondaryAction();
    return;
  }

  if (key === "r") {
    resetPlayer();
    return;
  }

  pressedKeys.add(key);
});

window.addEventListener("keyup", (event) => {
  if (!testerUnlocked) {
    return;
  }

  const key = normalizeKey(event.key);

  if (key === " " || key === "Spacebar") {
    return;
  }

  pressedKeys.delete(key);
});

canvas.addEventListener("pointerdown", (event) => {
  if (!testerUnlocked) {
    return;
  }

  if (event.button !== 0) {
    return;
  }

  triggerPrimaryAction();
});

resetButton.addEventListener("click", () => {
  if (!testerUnlocked) {
    return;
  }

  resetPlayer();
});

entryAcknowledge.addEventListener("change", updateEntryGate);
entryStartButton.addEventListener("click", unlockTester);

async function init() {
  forceWhiteStage();
  createCharacterButtons();
  updateCharacterButtons();
  updateActionButtons();
  updateEntryGate();

  try {
    await preloadAssets();

    for (const [source, promise] of imageCache.entries()) {
      imageCache.set(source, await promise);
    }

    state.ready = true;
    resetPlayer();
    startupFailed = false;
    updateEntryGate();
  } catch (error) {
    setStatus(error.message, true);
    console.error(error);
  }

  requestAnimationFrame(step);
}

init();


