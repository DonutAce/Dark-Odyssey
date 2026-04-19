import { auth, rtdb } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const topbar = document.querySelector(".topbar");
const progressBar = document.querySelector(".scroll-progress-bar");
const toast = document.querySelector(".auth-toast");
const liveTip = document.querySelector("[data-live-tip]");
const formInputs = Array.from(document.querySelectorAll(".auth-form input"));
const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const forgotPasswordLink = document.querySelector("[data-forgot-password]");
const primaryButton = document.querySelector(".primary-btn");
const postAuthPage = "loading.html";
const RECENT_AUTH_KEY = "dark_odyssey_recent_auth";

const AUTH_ERROR_MESSAGES = {
    "auth/email-already-in-use": "That email is already tied to another account.",
    "auth/invalid-email": "That email address is not valid.",
    "auth/user-not-found": "No account was found with that email.",
    "auth/wrong-password": "The password is incorrect.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "auth/missing-password": "Enter your password to continue.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/operation-not-allowed": "Email/password sign-up is disabled in Firebase. Enable Email/Password in Firebase Authentication.",
    "auth/configuration-not-found": "Firebase Authentication is not fully configured. Enable Email/Password and check your Firebase settings.",
    "auth/unauthorized-domain": "This domain is not authorized in Firebase. Use localhost or add 127.0.0.1 in Firebase Authentication -> Settings -> Authorized domains.",
    "auth/internal-error": "Firebase returned an internal error. Check your Firebase Authentication setup and try again."
};

const showToast = (message, isError = false) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    toast.style.borderColor = isError ? "rgba(255, 120, 120, 0.85)" : "rgba(111, 223, 164, 0.85)";
    toast.style.color = isError ? "#ffd8d8" : "#dfffea";
    window.clearTimeout(window.__authToastTimer);
    window.__authToastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
};

const getErrorMessage = (error) => {
    const code = error?.code || "";
    if (AUTH_ERROR_MESSAGES[code]) {
        return AUTH_ERROR_MESSAGES[code];
    }

    if (code) {
        return `Firebase error: ${code}`;
    }

    return error?.message || "Something went wrong while contacting Firebase.";
};

const reportAuthError = (error) => {
    console.error("Firebase auth failure:", {
        code: error?.code || null,
        message: error?.message || null,
        name: error?.name || null,
        customData: error?.customData || null
    });
    showToast(getErrorMessage(error), true);
};

async function syncUserDocument(user, profile = {}) {
    if (!user) {
        return;
    }

    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const existing = snapshot.exists() ? snapshot.val() : {};
    const payload = {
        ...existing,
        uid: user.uid,
        email: user.email || profile.email || "",
        username: profile.username || user.displayName || existing.username || "",
        introSeen: profile.introSeen != null ? Boolean(profile.introSeen) : Boolean(existing.introSeen),
        level: Number(existing.level) > 0 ? Number(existing.level) : 1,
        availablePoints: Number.isFinite(Number(existing.availablePoints)) ? Number(existing.availablePoints) : 0,
        stats: existing.stats || {
            health: 0,
            mana: 0,
            voidCyclone: 0,
            shadowStrike: 0
        },
        stageProgress: existing.stageProgress || {
            clearedStages: [],
            clearCounts: {},
            totalWins: 0
        },
        pendingAnnouncement: existing.pendingAnnouncement ?? null,
        createdAt: existing.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
    };

    if (profile.isNewUser) {
        payload.introSeen = false;
    }

    await set(userRef, payload);
}

async function syncUserDocumentSafely(user, profile = {}) {
    try {
        await syncUserDocument(user, profile);
        return true;
    } catch (error) {
        console.error("Realtime Database user sync failed:", {
            code: error?.code || null,
            message: error?.message || null
        });
        return false;
    }
}

const updateScrollState = () => {
    if (topbar) {
        topbar.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    if (!progressBar) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
};

const setButtonBusy = (button, busy, busyLabel) => {
    if (!button) return;
    if (!button.dataset.defaultLabel) {
        button.dataset.defaultLabel = button.textContent;
    }
    button.disabled = busy;
    button.textContent = busy ? busyLabel : button.dataset.defaultLabel;
};

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("load", updateScrollState);
updateScrollState();

document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const input = targetId ? document.getElementById(targetId) : null;
        if (!input) return;

        const nextType = input.type === "password" ? "text" : "password";
        input.type = nextType;
        button.textContent = nextType === "password" ? "Show" : "Hide";
    });
});

if (liveTip) {
    const defaultTip = liveTip.textContent;
    formInputs.forEach((input) => {
        input.addEventListener("focus", () => {
            liveTip.textContent = input.dataset.tip || defaultTip;
        });

        input.addEventListener("blur", () => {
            liveTip.textContent = defaultTip;
        });
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("login-email")?.value.trim() || "";
        const password = document.getElementById("login-password")?.value || "";

        if (!email || !password) {
            showToast("Enter both your email and password.", true);
            return;
        }

        setButtonBusy(primaryButton, true, "Entering...");

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const syncSucceeded = await syncUserDocumentSafely(credential.user, { email });
            showToast(syncSucceeded
                ? "Login successful. Returning you to the realm."
                : "Login successful, but your cloud profile could not be updated yet.");
            window.sessionStorage.setItem(RECENT_AUTH_KEY, String(Date.now()));
            window.setTimeout(() => {
                window.location.href = postAuthPage;
            }, 900);
        } catch (error) {
            reportAuthError(error);
        } finally {
            setButtonBusy(primaryButton, false, "Entering...");
        }
    });
}

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("signup-name")?.value.trim() || "";
        const email = document.getElementById("signup-email")?.value.trim() || "";
        const password = document.getElementById("signup-password")?.value || "";
        const confirmPassword = document.getElementById("signup-confirm")?.value || "";

        if (!username || !email || !password || !confirmPassword) {
            showToast("Fill in every field before creating your account.", true);
            return;
        }

        if (password !== confirmPassword) {
            showToast("Your passwords do not match.", true);
            return;
        }

        setButtonBusy(primaryButton, true, "Creating...");

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: username });
            const syncSucceeded = await syncUserDocumentSafely(credential.user, {
                username,
                email,
                introSeen: false,
                isNewUser: true
            });
            showToast(syncSucceeded
                ? "Account created. Your legend begins now."
                : "Account created, but your cloud profile could not be saved yet.");
            window.sessionStorage.setItem(RECENT_AUTH_KEY, String(Date.now()));
            window.setTimeout(() => {
                window.location.href = postAuthPage;
            }, 900);
        } catch (error) {
            reportAuthError(error);
        } finally {
            setButtonBusy(primaryButton, false, "Creating...");
        }
    });
}

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", async (event) => {
        event.preventDefault();
        const email = document.getElementById("login-email")?.value.trim() || "";
        if (!email) {
            showToast("Enter your email first so the reset link knows where to go.", true);
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            showToast("Password reset email sent.");
        } catch (error) {
            reportAuthError(error);
        }
    });
}

