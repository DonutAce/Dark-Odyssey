import { auth, rtdb } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { get, ref, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const loadingFill = document.getElementById("loading-fill");
const loadingStatus = document.getElementById("loading-status");
const loadingTitle = document.querySelector(".loading-panel h1");
const loadingCopy = document.querySelector(".loading-copy");
const loadingKicker = document.querySelector(".loading-kicker");
const urlParams = new URLSearchParams(window.location.search);
const explicitTarget = urlParams.get("target");
const customTitle = urlParams.get("title");
const customCopy = urlParams.get("copy");
const customKicker = urlParams.get("kicker");

const steps = [
    { progress: 14, label: "Initializing the realm..." },
    { progress: 32, label: "Binding combat controls..." },
    { progress: 54, label: "Opening skills and memory fragments..." },
    { progress: 76, label: "Checking whether this soul is newly awakened..." },
    { progress: 100, label: "The path is ready." }
];

const INTRO_PATH = "./intro/intro.html";
const LOBBY_PATH = "./lobby/index.html";
const INTRO_SEEN_KEY_PREFIX = "dark_odyssey_intro_seen_";
const RECENT_AUTH_KEY = "dark_odyssey_recent_auth";

function setProgress(progress, label) {
    if (loadingFill) {
        loadingFill.style.width = `${progress}%`;
    }
    if (loadingStatus) {
        loadingStatus.textContent = label;
    }
}

function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

if (loadingTitle && customTitle) {
    loadingTitle.textContent = customTitle;
}

if (loadingCopy && customCopy) {
    loadingCopy.textContent = customCopy;
}

if (loadingKicker && customKicker) {
    loadingKicker.textContent = customKicker;
}

function getRecentAuthAge() {
    const rawValue = window.sessionStorage.getItem(RECENT_AUTH_KEY);
    const timestamp = Number(rawValue);
    if (!Number.isFinite(timestamp)) {
        return Number.POSITIVE_INFINITY;
    }
    return Date.now() - timestamp;
}

function getIntroSeenKey(uid) {
    return `${INTRO_SEEN_KEY_PREFIX}${uid}`;
}

function hasLocalIntroSeen(uid) {
    if (!uid) {
        return false;
    }

    return window.localStorage.getItem(getIntroSeenKey(uid)) === "true";
}

function isLikelyNewUser(user) {
    const creationTime = Date.parse(user?.metadata?.creationTime || "");
    const lastSignInTime = Date.parse(user?.metadata?.lastSignInTime || "");

    if (!Number.isFinite(creationTime) || !Number.isFinite(lastSignInTime)) {
        return false;
    }

    return Math.abs(lastSignInTime - creationTime) < 10_000;
}

async function getUserProfile(user) {
    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
        const fallbackProfile = {
            uid: user.uid,
            email: user.email || "",
            username: user.displayName || "",
            introSeen: false,
            level: 1,
            availablePoints: 0,
            stats: {
                health: 0,
                mana: 0,
                voidCyclone: 0,
                shadowStrike: 0
            },
            stageProgress: {
                clearedStages: [],
                clearCounts: {},
                totalWins: 0
            },
            pendingAnnouncement: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        };

        await set(userRef, fallbackProfile);
        return fallbackProfile;
    }

    return snapshot.val();
}

async function playLoadingSequence(user) {
    for (const step of steps) {
        setProgress(step.progress, step.label);
        await wait(step.progress === 100 ? 420 : 640);
    }

    if (explicitTarget) {
        window.location.href = explicitTarget;
        return;
    }

    let profile = null;

    try {
        profile = await getUserProfile(user);
    } catch (error) {
        console.error("Could not load Firestore profile:", error);
    }

    if (profile?.introSeen || hasLocalIntroSeen(user.uid)) {
        window.location.href = LOBBY_PATH;
        return;
    }

    if (!profile && !isLikelyNewUser(user)) {
        window.location.href = LOBBY_PATH;
        return;
    }

    const introUrl = new URL(INTRO_PATH, window.location.href);
    introUrl.searchParams.set("uid", user.uid);
    introUrl.searchParams.set("return", LOBBY_PATH);
    window.location.href = introUrl.toString();
}

async function resolveAuthenticatedUser() {
    if (typeof auth.authStateReady === "function") {
        try {
            await auth.authStateReady();
        } catch (error) {
            console.warn("authStateReady failed:", error);
        }
    } else {
        await wait(700);
    }

    if (auth.currentUser) {
        return auth.currentUser;
    }

    if (getRecentAuthAge() < 15000) {
        setProgress(82, "Restoring your account session...");
        await wait(1800);
        if (auth.currentUser) {
            return auth.currentUser;
        }
    }

    return await new Promise((resolve) => {
        let settled = false;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (settled) {
                return;
            }
            settled = true;
            unsubscribe();
            resolve(user || null);
        });

        window.setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            unsubscribe();
            resolve(auth.currentUser || null);
        }, 2200);
    });
}

async function bootLoadingFlow() {
    const user = await resolveAuthenticatedUser();

    if (!user) {
        window.sessionStorage.removeItem(RECENT_AUTH_KEY);
        window.location.href = "login.html";
        return;
    }

    await playLoadingSequence(user);
}

bootLoadingFlow().catch((error) => {
    console.error("Loading flow failed:", error);
    setProgress(100, "Could not restore your account. Returning to login...");
    window.setTimeout(() => {
        window.location.href = "login.html";
    }, 900);
});

