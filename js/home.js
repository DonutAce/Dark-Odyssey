const nav = document.querySelector(".head-nav");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const scrollHint = document.querySelector(".scroll-hint");
const currentPage = document.body.dataset.page || "";

const updateNavState = () => {
    navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.page === currentPage);
    });

    if (nav) {
        nav.classList.toggle("scrolled", window.scrollY > 12);
    }

    if (scrollHint) {
        scrollHint.classList.toggle("is-hidden", window.scrollY > 80);
    }
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
        }
    });
}, {
    threshold: 0.16,
    rootMargin: "0px 0px -10% 0px"
});

revealItems.forEach((item) => revealObserver.observe(item));

window.addEventListener("scroll", updateNavState, { passive: true });
window.addEventListener("load", updateNavState);
updateNavState();

