const topbar = document.querySelector(".topbar");
const progressBar = document.querySelector(".scroll-progress-bar");
const toast = document.querySelector(".auth-toast");
const liveTip = document.querySelector("[data-live-tip]");
const formInputs = Array.from(document.querySelectorAll(".auth-form input"));
const forms = Array.from(document.querySelectorAll(".auth-form"));

const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(window.__authToastTimer);
    window.__authToastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 2400);
};

const updateScrollState = () => {
    if (topbar) {
        topbar.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    if (!progressBar) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
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

forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
        if (form.getAttribute("action")) return;
        event.preventDefault();
        showToast("Demo mode: the UI is ready and waiting for backend connection.");
    });
});
