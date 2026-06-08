const viewLinks = [...document.querySelectorAll("[data-view-link]")];
const views = [...document.querySelectorAll(".guide-view")];
const tocPanels = [...document.querySelectorAll("[data-view-toc]")];
let activeViewId = "guide-arbitrage";

const showView = (viewId) => {
  activeViewId = viewId;

  views.forEach((view) => {
    view.classList.toggle("hidden", view.id !== viewId);
    view.classList.toggle("active", view.id === viewId);
  });

  tocPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.viewToc !== viewId);
  });

  viewLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === viewId);
  });

  updateActiveToc();
};

viewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const viewId = link.dataset.viewLink;
    showView(viewId);
    const target = document.querySelector(link.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", link.getAttribute("href"));
  });
});

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll(".carousel-slide")];
  const dots = carousel.querySelector(".carousel-dots");
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  let index = slides.findIndex((slide) => slide.classList.contains("active"));
  if (index < 0) index = 0;

  const render = () => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === index);
    });
    [...dots.children].forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index);
    });
  };

  slides.forEach((_, slideIndex) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.textContent = String(slideIndex + 1);
    dot.setAttribute("aria-label", `${slideIndex + 1}번 사진 보기`);
    dot.addEventListener("click", () => {
      index = slideIndex;
      render();
    });
    dots.appendChild(dot);
  });

  prev.addEventListener("click", () => {
    index = (index - 1 + slides.length) % slides.length;
    render();
  });

  next.addEventListener("click", () => {
    index = (index + 1) % slides.length;
    render();
  });

  render();
});

const setActiveSection = (id) => {
  document.querySelectorAll(".toc a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
  });
};

const updateActiveToc = () => {
  const activeView = document.getElementById(activeViewId);
  if (!activeView) return;

  const sections = [...activeView.querySelectorAll(".step-section, .resource-section")];
  if (!sections.length) return;

  const marker = window.scrollY + 140;
  let current = sections[0];

  sections.forEach((section) => {
    if (section.offsetTop <= marker) current = section;
  });

  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    current = sections[sections.length - 1];
  }

  setActiveSection(current.id);
};

window.addEventListener("scroll", updateActiveToc, { passive: true });
window.addEventListener("resize", updateActiveToc);

const hashViewMap = {
  "#resources": "resources-view",
  "#resource-links": "resources-view",
  "#resource-downloads": "resources-view",
  "#guide-arbitrage": "guide-arbitrage",
  "#arbitrage-notice": "guide-arbitrage",
  "#arbitrage-tools": "guide-arbitrage",
  "#arbitrage-exchanges": "guide-arbitrage",
  "#arbitrage-basics": "guide-arbitrage",
  "#arbitrage-practice": "guide-arbitrage",
  "#arbitrage-safety": "guide-arbitrage",
};

showView(hashViewMap[location.hash] || "guide-arbitrage");

if (location.hash) {
  const target = document.querySelector(location.hash);
  if (target) target.scrollIntoView({ block: "start" });
}
