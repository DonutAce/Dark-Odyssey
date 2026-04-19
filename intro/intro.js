const sceneImage = document.getElementById("scene-image");
const titleScene = document.getElementById("title-scene");
const sceneCounter = document.getElementById("scene-counter");
const speakerLabel = document.getElementById("speaker-label");
const sceneTitle = document.getElementById("scene-title");
const subtitleText = document.getElementById("subtitle-text");
const skipButton = document.getElementById("skip-button");
const startLink = document.getElementById("start-link");
const urlParams = new URLSearchParams(window.location.search);
const introUid = urlParams.get("uid");
const introReturnPath = urlParams.get("return") || "../lobby/index.html";
const introScenePath = new URL("./awakening.html", window.location.href);

const scenes = [
  {
    title: "The World Before",
    speaker: "Narrator",
    image: "1.png",
    subtitles: [
      "Long before the world fell into silence... it was known as Eryndor.",
      "Where light and shadow coexisted... in fragile peace.",
      "Kingdoms thrived. Magic flowed freely.",
      "And the stars themselves guided the fate of every living soul."
    ]
  },
  {
    title: "The Shattering",
    speaker: "Narrator",
    image: "2.png",
    subtitles: [
      "But everything changed... the night the sky cracked."
    ]
  },
  {
    title: "Darkness Descends",
    speaker: "Narrator",
    image: "3.png",
    subtitles: [
      "A celestial event... known as The Shattering...",
      "...tore open the heavens.",
      "And from the rift... came something ancient.",
      "Something... merciless."
    ]
  },
  {
    title: "Fall of Civilization",
    speaker: "Narrator",
    image: "4.png",
    subtitles: [
      "They devoured cities...",
      "Twisted the land...",
      "And turned hope... into despair."
    ]
  },
  {
    title: "The Gods Fall Silent",
    speaker: "Priest / Narrator",
    image: "5.png",
    subtitles: [
      "Please... hear us... guide us...!",
      "The sun dimmed.",
      "The stars vanished.",
      "And the gods... fell silent."
    ]
  },
  {
    title: "Forbidden Power",
    speaker: "Narrator / Warrior",
    image: "6.png",
    subtitles: [
      "In the chaos... a forbidden power awakened.",
      "A force that feeds on fear... grief... and ambition.",
      "I can control it-!",
      "But those who sought to wield it...",
      "...became the very monsters they feared."
    ]
  },
  {
    title: "Ruined World",
    speaker: "Narrator",
    image: "7.png",
    subtitles: [
      "Now... years later...",
      "The world lies in ruin.",
      "Scattered survivors cling to what remains...",
      "Trust is rare.",
      "And the darkness... is growing stronger."
    ]
  },
  {
    title: "The Whispered Prophecy",
    speaker: "Old Storyteller",
    image: "8.png",
    subtitles: [
      "They say... there is one...",
      "A soul marked by both light... and shadow.",
      "A wanderer... with no past...",
      "...but a fate tied to the very force that broke the world."
    ]
  },
  {
    title: "The Awakening",
    speaker: "Narrator",
    image: "9.png",
    subtitles: [
      "You are that wanderer."
    ]
  },
  {
    title: "First Power Awakens",
    speaker: "Protagonist / Narrator",
    image: "10.png",
    subtitles: [
      "What... is this...?",
      "Half radiant. Half corrupted.",
      "The power answers... but it does not obey."
    ]
  },
  {
    title: "The Journey Begins",
    speaker: "Narrator",
    image: "11.png",
    subtitles: [
      "With nothing but fragments of memory...",
      "And a power you do not understand...",
      "Your journey begins... in the ashes of a forgotten world."
    ]
  },
  {
    title: "The Choice",
    speaker: "Narrator",
    image: null,
    subtitles: [
      "As you uncover buried truths...",
      "And face the horrors of this broken land...",
      "You must decide...",
      "Will you restore the light...",
      "...or embrace the darkness?",
      "This is your path.",
      "This is your fate.",
      "This... is the Dark Odyssey."
    ],
    final: true
  }
];

const SUBTITLE_OUT_MS = 380;
const BASE_LINE_MS = 2600;
const PER_CHAR_MS = 26;
const SCENE_GAP_MS = 420;

let activeTimeouts = [];

function clearTimers() {
  for (const timeoutId of activeTimeouts) {
    clearTimeout(timeoutId);
  }
  activeTimeouts = [];
}

function queue(callback, delay) {
  const timeoutId = window.setTimeout(callback, delay);
  activeTimeouts.push(timeoutId);
}

function lineDuration(line) {
  return Math.max(BASE_LINE_MS, 1200 + (line.length * PER_CHAR_MS));
}

function setSubtitle(line) {
  subtitleText.classList.remove("is-visible", "is-hiding");
  void subtitleText.offsetWidth;
  subtitleText.textContent = line;
  subtitleText.classList.add("is-visible");
}

function hideSubtitle() {
  subtitleText.classList.remove("is-visible");
  subtitleText.classList.add("is-hiding");
}

function renderScene(index) {
  const scene = scenes[index];

  sceneCounter.textContent = `Scene ${index + 1} / ${scenes.length}`;
  speakerLabel.textContent = scene.speaker;
  sceneTitle.textContent = scene.title;

  const isTitleScene = !scene.image;
  sceneImage.hidden = isTitleScene;
  titleScene.hidden = !isTitleScene;

  if (!isTitleScene) {
    sceneImage.src = scene.image;
    sceneImage.alt = `${scene.title} scene artwork`;
  }

  startLink.hidden = !scene.final;
  introScenePath.searchParams.set("return", introReturnPath);
  if (introUid) {
    introScenePath.searchParams.set("uid", introUid);
  }
  startLink.href = introScenePath.toString();
}

function playScene(index) {
  clearTimers();
  renderScene(index);

  const scene = scenes[index];
  let elapsed = 250;

  for (const line of scene.subtitles) {
    const duration = lineDuration(line);

    queue(() => {
      setSubtitle(line);
    }, elapsed);

    queue(() => {
      hideSubtitle();
    }, elapsed + Math.max(900, duration - SUBTITLE_OUT_MS - 160));

    elapsed += duration;
  }

  if (scene.final) {
    queue(() => {
      subtitleText.classList.remove("is-visible", "is-hiding");
      subtitleText.textContent = "";
      startLink.hidden = false;
    }, elapsed + 300);
    return;
  }

  queue(() => {
    playScene(index + 1);
  }, elapsed + SCENE_GAP_MS);
}

function skipIntro() {
  clearTimers();
  playScene(scenes.length - 1);
}

skipButton.addEventListener("click", () => {
  skipIntro();
});

startLink.addEventListener("click", async (event) => {
  event.preventDefault();
  window.location.href = startLink.href;
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    skipIntro();
  }
});

playScene(0);
