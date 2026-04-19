(function () {
    const overlayId = "device-guard-overlay";
    const exactMessage = "the game is incompatible to phone website, even in desktop mode";

    function isBlockedDevice() {
        const ua = navigator.userAgent || "";
        const platform = navigator.platform || "";
        const touchPoints = navigator.maxTouchPoints || 0;
        const screenWidth = window.screen?.width || window.innerWidth || 0;
        const screenHeight = window.screen?.height || window.innerHeight || 0;
        const viewportWidth = window.innerWidth || 0;
        const viewportHeight = window.innerHeight || 0;
        const shortSide = Math.min(screenWidth, screenHeight);
        const viewportShortSide = Math.min(viewportWidth, viewportHeight);
        const pointerCoarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
        const pointerFine = window.matchMedia?.("(pointer: fine)")?.matches ?? false;
        const hoverNone = window.matchMedia?.("(hover: none)")?.matches ?? false;

        const mobileUa = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Phone|Mobile/i.test(ua);
        const tabletUa = /iPad|Tablet|PlayBook|Silk|Kindle|KFAPWI/i.test(ua) || /Android(?!.*Mobile)/i.test(ua);
        const ipadDesktopMode = platform === "MacIntel" && touchPoints > 1;
        const portableTouchDevice = touchPoints > 1 && pointerCoarse && (!pointerFine || shortSide <= 1400);
        const emulatedPhoneOrTabletViewport = viewportWidth <= 1024 && viewportHeight <= 1400;
        const narrowTouchViewport = viewportShortSide <= 900 && (pointerCoarse || hoverNone || touchPoints > 0);
        const suspiciousPortableViewport = viewportWidth <= 1180 && viewportShortSide <= 920 && (!pointerFine || pointerCoarse || hoverNone || touchPoints > 0);

        return mobileUa
            || tabletUa
            || ipadDesktopMode
            || portableTouchDevice
            || emulatedPhoneOrTabletViewport
            || narrowTouchViewport
            || suspiciousPortableViewport;
    }

    function createOverlay() {
        const overlay = document.createElement("div");
        overlay.id = overlayId;
        overlay.className = "device-guard-overlay";
        overlay.innerHTML = [
            '<section class="device-guard-card" role="alertdialog" aria-modal="true" aria-labelledby="device-guard-title">',
            '  <span class="device-guard-kicker">PC Only</span>',
            '  <h1 id="device-guard-title" class="device-guard-title">Desktop or laptop required</h1>',
            `  <p class="device-guard-copy">${exactMessage}</p>`,
            "</section>"
        ].join("");
        return overlay;
    }

    function enableBlock() {
        document.body.classList.add("device-guard-active");
        window.__DARK_ODYSSEY_DEVICE_BLOCKED__ = true;

        if (!document.getElementById(overlayId)) {
            document.body.appendChild(createOverlay());
        }
    }

    function disableBlock() {
        document.body.classList.remove("device-guard-active");
        window.__DARK_ODYSSEY_DEVICE_BLOCKED__ = false;
        document.getElementById(overlayId)?.remove();
    }

    function applyGuard() {
        if (!document.body) {
            return;
        }

        if (isBlockedDevice()) {
            enableBlock();
            return;
        }

        disableBlock();
    }

    ["click", "dblclick", "submit", "keydown", "touchstart", "pointerdown"].forEach((eventName) => {
        window.addEventListener(eventName, (event) => {
            if (!window.__DARK_ODYSSEY_DEVICE_BLOCKED__) {
                return;
            }

            const overlay = document.getElementById(overlayId);
            if (overlay && overlay.contains(event.target)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
        }, true);
    });

    window.addEventListener("resize", applyGuard, { passive: true });
    window.addEventListener("orientationchange", applyGuard, { passive: true });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyGuard, { once: true });
    } else {
        applyGuard();
    }
})();
