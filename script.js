(function () {
  const menuButton = document.querySelector(".menu-button");
  const sidebar = document.querySelector(".sidebar");
  const guideButtons = Array.from(document.querySelectorAll("[data-guide-target]"));
  const guidePages = Array.from(document.querySelectorAll("[data-guide-page]"));
  const guideNavs = Array.from(document.querySelectorAll("[data-guide-nav]"));
  const topButton = document.querySelector(".top-button");
  const dialog = document.querySelector(".image-dialog");
  const dialogImage = dialog.querySelector("img");
  const dialogCaption = dialog.querySelector("p");
  const dialogClose = dialog.querySelector(".dialog-close");
  const dialogPrev = dialog.querySelector(".dialog-prev");
  const dialogNext = dialog.querySelector(".dialog-next");
  let activeGuide = document.querySelector(".guide-page.active")?.dataset.guidePage || "xlence";
  let sectionObserver;
  let dialogGallery = [];
  let dialogGalleryIndex = 0;

  function setMenuOpen(isOpen) {
    sidebar.classList.toggle("is-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
  }

  function visibleNavLinks() {
    const activeNav = document.querySelector(`[data-guide-nav="${activeGuide}"]`);
    return Array.from(activeNav?.querySelectorAll("a") || []);
  }

  function updateActiveSection(hash) {
    visibleNavLinks().forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === hash);
    });
  }

  function syncBottomActiveSection() {
    if (activeGuide === "home") {
      return;
    }

    const distanceFromBottom =
      document.documentElement.scrollHeight - window.innerHeight - window.scrollY;

    if (distanceFromBottom <= 4) {
      updateActiveSection(visibleNavLinks().at(-1)?.getAttribute("href") || "");
    }
  }

  function observeCurrentGuide() {
    if (sectionObserver) {
      sectionObserver.disconnect();
    }

    sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          updateActiveSection(`#${visible.target.id}`);
        }
      },
      {
        rootMargin: "-20% 0px -68% 0px",
        threshold: [0.08, 0.2, 0.5],
      }
    );

    visibleNavLinks()
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean)
      .forEach((section) => sectionObserver.observe(section));
  }

  function switchGuide(nextGuide, shouldScroll) {
    activeGuide = nextGuide;
    document.body.classList.toggle("is-home", nextGuide === "home");

    guidePages.forEach((page) => {
      const isActive = page.dataset.guidePage === nextGuide;
      page.hidden = !isActive;
      page.classList.toggle("active", isActive);
    });

    guideNavs.forEach((nav) => {
      nav.hidden = nav.dataset.guideNav !== nextGuide;
    });

    guideButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.guideTarget === nextGuide);
    });

    observeCurrentGuide();
    updateActiveSection(visibleNavLinks()[0]?.getAttribute("href") || "");
    syncBottomActiveSection();
    setMenuOpen(false);

    if (shouldScroll) {
      document
        .querySelector(`[data-guide-page="${nextGuide}"] .guide-title, [data-guide-page="${nextGuide}"] .home-hero`)
        ?.scrollIntoView({ behavior: "smooth", block: nextGuide === "home" ? "start" : "center" });
    }
  }

  menuButton.addEventListener("click", () => {
    setMenuOpen(!sidebar.classList.contains("is-open"));
  });

  guideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchGuide(button.dataset.guideTarget, true);
    });
  });

  document.querySelectorAll("[data-slider]").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".image-slide"));
    const dots = Array.from(slider.querySelectorAll("[data-slide-index]"));
    const prevButton = slider.querySelector("[data-slider-prev]");
    const nextButton = slider.querySelector("[data-slider-next]");
    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));

    function setSlide(nextIndex) {
      activeIndex = (nextIndex + slides.length) % slides.length;

      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.hidden = !isActive;
        slide.classList.toggle("is-active", isActive);
      });

      dots.forEach((dot, index) => {
        const isActive = index === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        setSlide(Number(dot.dataset.slideIndex));
      });
    });

    prevButton?.addEventListener("click", () => setSlide(activeIndex - 1));
    nextButton?.addEventListener("click", () => setSlide(activeIndex + 1));
    setSlide(activeIndex);
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".chapter-nav a");

    if (!link) {
      return;
    }

    event.preventDefault();

    const targetId = link.getAttribute("href")?.slice(1);
    const target = targetId ? document.getElementById(targetId) : null;

    setMenuOpen(false);
    updateActiveSection(link.getAttribute("href"));

    if (target) {
      const blockPosition = target.classList.contains("step-card") ? "center" : "start";
      target.scrollIntoView({ behavior: "smooth", block: blockPosition });
      history.pushState(null, "", `#${targetId}`);
    }
  });

  document.querySelectorAll(".image-slot").forEach((slot) => {
    const image = slot.querySelector("img");
    const source = image.dataset.src;

    image.addEventListener("error", () => {
      slot.classList.add("is-missing");
      image.removeAttribute("src");
    });

    image.addEventListener("load", () => {
      if (image.naturalWidth > 0) {
        slot.classList.remove("is-missing");
      }
    });

    if (source) {
      image.src = source;
    }

    function getDialogGallery() {
      const slider = slot.closest("[data-slider]");
      const stack = slot.closest(".image-stack");
      const card = slot.closest(".step-card, .map-card");
      const scope = slider || stack || card;
      const slots = scope ? Array.from(scope.querySelectorAll(".image-slot")) : [slot];

      return slots.filter((candidate) => {
        const candidateImage = candidate.querySelector("img");
        return candidateImage && !candidate.classList.contains("is-missing");
      });
    }

    slot.addEventListener("click", () => {
      if (slot.classList.contains("is-missing") || !dialog.showModal) {
        return;
      }

      dialogGallery = getDialogGallery();
      dialogGalleryIndex = Math.max(0, dialogGallery.indexOf(slot));
      showDialogImage(dialogGalleryIndex);
      dialog.showModal();
      document.body.classList.add("dialog-open");
    });
  });

  function showDialogImage(nextIndex) {
    if (!dialogGallery.length) {
      return;
    }

    dialogGalleryIndex = (nextIndex + dialogGallery.length) % dialogGallery.length;
    const slot = dialogGallery[dialogGalleryIndex];
    const image = slot.querySelector("img");

    dialogImage.src = image.currentSrc || image.src || image.dataset.src;
    dialogImage.alt = image.alt;
    dialogCaption.textContent = "";

    const hasMultipleImages = dialogGallery.length > 1;
    dialogPrev.hidden = !hasMultipleImages;
    dialogNext.hidden = !hasMultipleImages;
  }

  function showPreviousDialogImage() {
    showDialogImage(dialogGalleryIndex - 1);
  }

  function showNextDialogImage() {
    showDialogImage(dialogGalleryIndex + 1);
  }

  function closeDialog() {
    dialog.close();
    dialogImage.removeAttribute("src");
    dialogGallery = [];
    dialogGalleryIndex = 0;
    document.body.classList.remove("dialog-open");
  }

  dialogClose.addEventListener("click", closeDialog);
  dialogPrev.addEventListener("click", showPreviousDialogImage);
  dialogNext.addEventListener("click", showNextDialogImage);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousDialogImage();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextDialogImage();
    }
  });

  window.addEventListener("scroll", () => {
    topButton.classList.toggle("is-visible", window.scrollY > 520);
    syncBottomActiveSection();
  });

  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  switchGuide(activeGuide, false);
})();
