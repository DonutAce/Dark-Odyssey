import { rtdb } from "../js/firebase.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const speakerName = document.getElementById("speaker-name");
const lineCount = document.getElementById("line-count");
const dialogueText = document.getElementById("dialogue-text");
const advanceButton = document.getElementById("advance-button");
const skipButton = document.getElementById("skip-button");

const urlParams = new URLSearchParams(window.location.search);
const introUid = urlParams.get("uid");
const returnPath = urlParams.get("return") || "../lobby/index.html";
const introSeenKey = introUid ? `dark_odyssey_intro_seen_${introUid}` : "dark_odyssey_intro_seen_guest";

const lines = [
  { speaker: "???", text: "Can you hear me?" },
  { speaker: "Main Character", text: "W-What...?" },
  { speaker: "???", text: "Good... you're still breathing." },
  { speaker: "Main Character", text: "Who... said that?" },
  { speaker: "???", text: "Wake up... wanderer. This is not where your story ends." },
  { speaker: "Main Character", text: "Where am I?! I can't see anything!" },
  { speaker: "???", text: "Do not struggle... your body remembers what your mind cannot." },
  { speaker: "Main Character", text: "My... mind?\nI don't remember... anything..." },
  { speaker: "???", text: "The world you knew is gone. Broken... consumed... forgotten." },
  { speaker: "Main Character", text: "No... that can't be true..." },
  { speaker: "Main Character", text: "Ah-! What... what is this?!" },
  { speaker: "???", text: "Do you feel it?\nThat power... buried within you." },
  { speaker: "Main Character", text: "Power...?\nI don't understand!" },
  { speaker: "???", text: "You don't need to... not yet." },
  { speaker: "Main Character", text: "Something's out there..." },
  { speaker: "???", text: "Yes. And it is already searching for you." },
  { speaker: "Main Character", text: "Searching... for me? Why?!" },
  { speaker: "???", text: "Because you should not exist." },
  { speaker: "Main Character", text: "...What?" },
  { speaker: "???", text: "You were not meant to survive." },
  { speaker: "Main Character", text: "Then tell me- what am I?!" },
  { speaker: "???", text: "That... is something you must discover." },
  { speaker: "Main Character", text: "Wait! Don't leave! I need answers!" },
  { speaker: "???", text: "Find the truth behind your past... before it finds you." },
  { speaker: "Main Character", text: "At least tell me your name!" },
  { speaker: "???", text: "Trust no one... not even the light." },
  { speaker: "Main Character", text: "Then I'll find the truth myself." },
  { speaker: "Main Character", text: "...Whatever this is... I won't run." }
];

let currentIndex = 0;
let finishing = false;

function renderLine() {
  const line = lines[currentIndex];
  speakerName.textContent = line.speaker;
  speakerName.classList.toggle("is-hero", line.speaker === "Main Character");
  dialogueText.textContent = line.text;
  lineCount.textContent = `${currentIndex + 1} / ${lines.length}`;
  advanceButton.textContent = currentIndex === lines.length - 1 ? "Enter The Lobby" : "Continue";
}

async function finishScene() {
  if (finishing) {
    return;
  }

  finishing = true;
  window.localStorage.setItem(introSeenKey, "true");

  if (introUid) {
    try {
      const userRef = ref(rtdb, `users/${introUid}`);
      const snapshot = await get(userRef);
      const existing = snapshot.exists() ? snapshot.val() : {};
      await set(userRef, {
        ...existing,
        introSeen: true,
        introSeenAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Could not save awakening progress:", error);
    }
  }

  window.location.href = returnPath;
}

function advanceDialogue() {
  if (currentIndex >= lines.length - 1) {
    finishScene();
    return;
  }

  currentIndex += 1;
  renderLine();
}

advanceButton.addEventListener("click", advanceDialogue);
skipButton.addEventListener("click", finishScene);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    advanceDialogue();
  }
});

window.addEventListener("click", (event) => {
  if (event.target === advanceButton || event.target === skipButton) {
    return;
  }
  advanceDialogue();
});

renderLine();
