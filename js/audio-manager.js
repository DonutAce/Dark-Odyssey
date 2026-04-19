const AUDIO_STORAGE_KEY = "darkOdysseyAudioSettings";

const SCENE_CONFIG = {
  lobby: {
    tempo: 88,
    bass: ["C3", null, "G2", null, "A2", null, "F2", null],
    lead: ["E4", "G4", "A4", "G4", "C5", "A4", "G4", "E4"],
    bassType: "triangle",
    leadType: "sine",
    bassGain: 0.055,
    leadGain: 0.028,
    padGain: 0.018
  },
  stage1: {
    tempo: 102,
    bass: ["D3", null, "F3", null, "G3", null, "A2", null],
    lead: ["D4", "F4", "A4", "F4", "G4", "A4", "F4", "D4"],
    bassType: "sawtooth",
    leadType: "triangle",
    bassGain: 0.06,
    leadGain: 0.03,
    padGain: 0.018
  },
  stage2: {
    tempo: 112,
    bass: ["E3", null, "B2", null, "C3", null, "A2", null],
    lead: ["E4", "G4", "B4", "G4", "C5", "B4", "G4", "E4"],
    bassType: "square",
    leadType: "triangle",
    bassGain: 0.06,
    leadGain: 0.03,
    padGain: 0.018
  },
  stage3: {
    tempo: 118,
    bass: ["F3", null, "D3", null, "A2", null, "E3", null],
    lead: ["F4", "A4", "C5", "A4", "D5", "C5", "A4", "F4"],
    bassType: "sawtooth",
    leadType: "square",
    bassGain: 0.062,
    leadGain: 0.028,
    padGain: 0.017
  },
  stage4: {
    tempo: 126,
    bass: ["D3", null, "Bb2", null, "F2", null, "C3", null],
    lead: ["D4", "F4", "A4", "C5", "Bb4", "A4", "F4", "D4"],
    bassType: "sawtooth",
    leadType: "square",
    bassGain: 0.064,
    leadGain: 0.03,
    padGain: 0.018
  }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function noteToFrequency(note) {
  if (!note) {
    return null;
  }

  const match = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!match) {
    return null;
  }

  const [, letter, accidental, octaveText] = match;
  const semitoneMap = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11
  };

  let semitone = semitoneMap[letter];
  if (accidental === "#") {
    semitone += 1;
  } else if (accidental === "b") {
    semitone -= 1;
  }

  const octave = Number(octaveText);
  const midi = ((octave + 1) * 12) + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function loadPersistedVolume() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(AUDIO_STORAGE_KEY) || "{}");
    return clamp(Number(parsed.volume), 0, 1);
  } catch (error) {
    return 1;
  }
}

function persistVolume(volume) {
  try {
    window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({ volume }));
  } catch (error) {
    // Ignore storage failures.
  }
}

function createDarkOdysseyAudioManager(options = {}) {
  const scene = options.scene && SCENE_CONFIG[options.scene] ? options.scene : "lobby";
  const sceneConfig = SCENE_CONFIG[scene];
  let masterVolume = Number.isFinite(options.volume) ? clamp(options.volume, 0, 1) : loadPersistedVolume();
  if (!Number.isFinite(masterVolume)) {
    masterVolume = 1;
  }

  let audioContext = null;
  let masterGain = null;
  let bgmGain = null;
  let sfxGain = null;
  let schedulerId = null;
  let nextStepTime = 0;
  let stepIndex = 0;
  let unlocked = false;

  function ensureContext() {
    if (audioContext) {
      return audioContext;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    bgmGain = audioContext.createGain();
    sfxGain = audioContext.createGain();

    bgmGain.gain.value = 0.64;
    sfxGain.gain.value = 0.92;
    masterGain.gain.value = masterVolume;

    bgmGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(audioContext.destination);

    return audioContext;
  }

  function scheduleTone({
    frequency,
    when,
    duration,
    type = "sine",
    volume = 0.03,
    attack = 0.01,
    release = 0.08,
    detune = 0
  }) {
    if (!frequency) {
      return;
    }

    const context = ensureContext();
    if (!context || !sfxGain || !bgmGain) {
      return;
    }

    const destination = when >= context.currentTime ? bgmGain : sfxGain;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.detune.setValueAtTime(detune, when);

    gainNode.gain.setValueAtTime(0.0001, when);
    gainNode.gain.linearRampToValueAtTime(volume, when + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, when + duration + release);

    oscillator.connect(gainNode);
    gainNode.connect(destination);

    oscillator.start(when);
    oscillator.stop(when + duration + release + 0.02);
  }

  function schedulePad(rootFrequency, when, duration, volume) {
    if (!rootFrequency) {
      return;
    }

    scheduleTone({
      frequency: rootFrequency * 0.5,
      when,
      duration,
      type: "sine",
      volume: volume * 0.7,
      attack: 0.08,
      release: 0.18
    });

    scheduleTone({
      frequency: rootFrequency * 0.75,
      when: when + 0.02,
      duration,
      type: "triangle",
      volume: volume * 0.45,
      attack: 0.1,
      release: 0.22,
      detune: -4
    });
  }

  function scheduleBgmStep() {
    if (!audioContext || !unlocked) {
      return;
    }

    const stepDuration = 60 / sceneConfig.tempo;
    const bassNote = sceneConfig.bass[stepIndex % sceneConfig.bass.length];
    const leadNote = sceneConfig.lead[stepIndex % sceneConfig.lead.length];
    const bassFrequency = noteToFrequency(bassNote);
    const leadFrequency = noteToFrequency(leadNote);
    const isAccent = stepIndex % 4 === 0;

    if (bassFrequency) {
      scheduleTone({
        frequency: bassFrequency,
        when: nextStepTime,
        duration: stepDuration * (isAccent ? 0.9 : 0.62),
        type: sceneConfig.bassType,
        volume: sceneConfig.bassGain + (isAccent ? 0.008 : 0),
        attack: 0.008,
        release: 0.06
      });

      if (isAccent) {
        schedulePad(bassFrequency, nextStepTime, stepDuration * 1.5, sceneConfig.padGain);
      }
    }

    if (leadFrequency) {
      scheduleTone({
        frequency: leadFrequency,
        when: nextStepTime + 0.03,
        duration: stepDuration * 0.45,
        type: sceneConfig.leadType,
        volume: sceneConfig.leadGain,
        attack: 0.01,
        release: 0.07,
        detune: stepIndex % 2 === 0 ? 3 : -3
      });
    }

    nextStepTime += stepDuration;
    stepIndex += 1;
  }

  function runScheduler() {
    if (!audioContext || schedulerId || !unlocked) {
      return;
    }

    if (!nextStepTime) {
      nextStepTime = audioContext.currentTime + 0.06;
    }

    schedulerId = window.setInterval(() => {
      if (!audioContext || audioContext.state !== "running") {
        return;
      }

      while (nextStepTime < audioContext.currentTime + 0.35) {
        scheduleBgmStep();
      }
    }, 120);
  }

  async function unlock() {
    const context = ensureContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    unlocked = true;
    runScheduler();
  }

  function setMasterVolume(nextVolume) {
    masterVolume = clamp(nextVolume, 0, 1);
    persistVolume(masterVolume);
    if (masterGain && audioContext) {
      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setTargetAtTime(masterVolume, audioContext.currentTime, 0.04);
    }
  }

  function playUiClick(variant = "default") {
    if (!unlocked) {
      return;
    }

    const context = ensureContext();
    if (!context) {
      return;
    }

    const start = context.currentTime;
    if (variant === "soft") {
      scheduleTone({ frequency: 540, when: start, duration: 0.03, type: "triangle", volume: 0.028, attack: 0.002, release: 0.03 });
      scheduleTone({ frequency: 720, when: start + 0.018, duration: 0.028, type: "sine", volume: 0.02, attack: 0.002, release: 0.03 });
      return;
    }

    scheduleTone({ frequency: 680, when: start, duration: 0.025, type: "square", volume: 0.026, attack: 0.002, release: 0.02 });
    scheduleTone({ frequency: 920, when: start + 0.02, duration: 0.035, type: "triangle", volume: 0.02, attack: 0.002, release: 0.04 });
  }

  function playJump() {
    if (!unlocked) {
      return;
    }

    const context = ensureContext();
    if (!context) {
      return;
    }

    const start = context.currentTime;
    scheduleTone({ frequency: 330, when: start, duration: 0.05, type: "triangle", volume: 0.03, attack: 0.003, release: 0.05 });
    scheduleTone({ frequency: 510, when: start + 0.02, duration: 0.06, type: "sine", volume: 0.024, attack: 0.003, release: 0.06 });
  }

  function playInteraction() {
    if (!unlocked) {
      return;
    }

    const context = ensureContext();
    if (!context) {
      return;
    }

    const start = context.currentTime;
    scheduleTone({ frequency: 392, when: start, duration: 0.06, type: "triangle", volume: 0.024, attack: 0.003, release: 0.05 });
    scheduleTone({ frequency: 523.25, when: start + 0.045, duration: 0.08, type: "sine", volume: 0.022, attack: 0.003, release: 0.07 });
  }

  function playPortal() {
    if (!unlocked) {
      return;
    }

    const context = ensureContext();
    if (!context) {
      return;
    }

    const start = context.currentTime;
    scheduleTone({ frequency: 180, when: start, duration: 0.22, type: "sawtooth", volume: 0.03, attack: 0.01, release: 0.14 });
    scheduleTone({ frequency: 360, when: start + 0.06, duration: 0.2, type: "triangle", volume: 0.024, attack: 0.01, release: 0.14, detune: 8 });
    scheduleTone({ frequency: 720, when: start + 0.1, duration: 0.14, type: "sine", volume: 0.016, attack: 0.01, release: 0.1 });
  }

  function playAbility(actionName) {
    if (!unlocked) {
      return;
    }

    const context = ensureContext();
    if (!context) {
      return;
    }

    const start = context.currentTime;
    if (actionName === "attack") {
      scheduleTone({ frequency: 180, when: start, duration: 0.04, type: "square", volume: 0.032, attack: 0.002, release: 0.03 });
      scheduleTone({ frequency: 240, when: start + 0.02, duration: 0.05, type: "sawtooth", volume: 0.024, attack: 0.002, release: 0.035 });
      return;
    }

    if (actionName === "special") {
      scheduleTone({ frequency: 220, when: start, duration: 0.08, type: "sawtooth", volume: 0.03, attack: 0.004, release: 0.05, detune: -8 });
      scheduleTone({ frequency: 440, when: start + 0.03, duration: 0.12, type: "triangle", volume: 0.022, attack: 0.004, release: 0.08 });
      scheduleTone({ frequency: 660, when: start + 0.06, duration: 0.12, type: "sine", volume: 0.018, attack: 0.004, release: 0.1 });
      return;
    }

    if (actionName === "dash") {
      scheduleTone({ frequency: 150, when: start, duration: 0.06, type: "square", volume: 0.03, attack: 0.002, release: 0.03 });
      scheduleTone({ frequency: 300, when: start + 0.015, duration: 0.08, type: "sawtooth", volume: 0.022, attack: 0.002, release: 0.04, detune: 10 });
      scheduleTone({ frequency: 520, when: start + 0.035, duration: 0.06, type: "triangle", volume: 0.016, attack: 0.002, release: 0.03 });
    }
  }

  return {
    scene,
    unlock,
    setMasterVolume,
    getVolume() {
      return masterVolume;
    },
    playUiClick,
    playJump,
    playInteraction,
    playPortal,
    playAbility
  };
}

window.createDarkOdysseyAudioManager = createDarkOdysseyAudioManager;
