document.addEventListener("DOMContentLoaded", () => {
  const screen = document.querySelector(".presentation-screen");
  if (!screen) return;

  const slides = Array.from(screen.querySelectorAll(".presentation-slide"));
  if (!slides.length) return;

  let index = 0;
  const totalEl = screen.querySelector("#presentation-total");
  const currentEl = screen.querySelector("#presentation-current");
  const prevBtn = screen.querySelector('[data-action="prev"]');
  const nextBtn = screen.querySelector('[data-action="next"]');
  const modalState = { open: false, buttons: [], index: 0, closeModal: null, stepModal: null, openModal: null };

  // Preload edilmiş slide'ları takip et
  const preloadedSlides = new Set();

  const preloadSlideImages = (slideIndex) => {
    if (slideIndex < 0 || slideIndex >= slides.length) return;
    if (preloadedSlides.has(slideIndex)) return;

    const slide = slides[slideIndex];
    const images = slide.querySelectorAll("img[loading='lazy']");
    images.forEach(img => {
      if (img.src && !img.complete) {
        const preloadImg = new Image();
        preloadImg.src = img.src;
      }
    });

    // Gallery butonlarındaki thumbnail'ları da preload et
    const galleryDots = slide.querySelectorAll(".gallery-dot[data-image]");
    galleryDots.forEach(dot => {
      const thumbSrc = dot.dataset.image;
      if (thumbSrc) {
        const preloadImg = new Image();
        preloadImg.src = thumbSrc;
      }
    });

    preloadedSlides.add(slideIndex);
  };

  const update = () => {
    slides.forEach((slide, idx) => {
      slide.classList.toggle("is-active", idx === index);
    });
    if (currentEl) currentEl.textContent = String(index + 1);
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;

    // Mevcut ve sonraki slide'ı preload et
    preloadSlideImages(index);
    preloadSlideImages(index + 1);
  };

  if (totalEl) totalEl.textContent = String(slides.length);
  update();

  const goPrev = () => {
    if (modalState.open) return;
    if (index > 0) {
      index -= 1;
      update();
    }
  };

  const goNext = () => {
    if (modalState.open) return;
    if (index < slides.length - 1) {
      index += 1;
      update();
    }
  };

  prevBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    goPrev();
  });

  nextBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    goNext();
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTypingTarget =
      target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    if (modalState.open) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        modalState.stepModal?.(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        modalState.stepModal?.(1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        modalState.closeModal?.();
      }
      return;
    }

    if (!isTypingTarget && (event.key === "f" || event.key === "F")) {
      const activeSlide = slides[index];
      const firstButton = activeSlide?.querySelector(".gallery-dot");
      if (firstButton && modalState.openModal) {
        event.preventDefault();
        modalState.openModal(firstButton);
        return;
      }
    }

    if (event.key === "ArrowLeft") {
      goPrev();
    }
    if (event.key === "ArrowRight") {
      goNext();
    }
  });

  setupGalleryPopups(screen, modalState);
});

function setupGalleryPopups(root, state) {
  const modal = document.getElementById("image-modal");
  if (!modal) return;

  const imageEl = modal.querySelector("#presentation-modal-image");
  const captionEl = modal.querySelector("#presentation-modal-caption");

  // Tam boyut yükleme durumunu takip et
  let fullSizeLoading = false;

  const showCurrent = () => {
    if (!state.buttons.length) return;
    const button = state.buttons[state.index];
    if (!button) return;

    // Önce thumbnail'ı göster
    const thumbSrc = button.dataset.image;
    const fullSrc = button.dataset.fullsrc || thumbSrc;
    const caption = button.dataset.caption || "";

    if (!thumbSrc) return;

    // Modal'a loading class ekle
    imageEl.classList.add("loading");
    imageEl.src = thumbSrc;
    captionEl.textContent = caption;
    imageEl.alt = caption;

    // Arka planda tam boyut yükle
    if (fullSrc && fullSrc !== thumbSrc) {
      fullSizeLoading = true;
      const fullImg = new Image();
      fullImg.onload = () => {
        // Hala aynı görsel gösteriliyorsa tam boyutu yükle
        if (state.open && state.buttons[state.index] === button) {
          imageEl.src = fullSrc;
          imageEl.classList.remove("loading");
        }
        fullSizeLoading = false;
      };
      fullImg.onerror = () => {
        imageEl.classList.remove("loading");
        fullSizeLoading = false;
      };
      fullImg.src = fullSrc;
    } else {
      imageEl.classList.remove("loading");
    }
  };

  const openModal = (button) => {
    const galleryId = button.dataset.gallery;
    const selector = galleryId
      ? `.gallery-dot[data-gallery="${galleryId}"]`
      : null;
    const buttons = selector
      ? Array.from(root.querySelectorAll(selector))
      : [button];
    state.buttons = buttons.length ? buttons : [button];
    state.index = buttons.indexOf(button);
    if (state.index < 0) state.index = 0;
    state.open = true;
    modal.hidden = false;
    document.body.classList.add("presentation-modal-open");
    showCurrent();
  };

  const closeModal = () => {
    modal.hidden = true;
    imageEl.src = "";
    imageEl.alt = "";
    imageEl.classList.remove("loading");
    captionEl.textContent = "";
    document.body.classList.remove("presentation-modal-open");
    state.open = false;
    state.buttons = [];
    state.index = 0;
  };

  const stepModal = (delta) => {
    if (!state.open || !state.buttons.length) return;
    state.index = (state.index + delta + state.buttons.length) % state.buttons.length;
    showCurrent();
  };

  state.closeModal = closeModal;
  state.stepModal = stepModal;
  state.openModal = openModal;

  root.addEventListener("click", (event) => {
    const button = event.target.closest(".gallery-dot");
    if (!button) return;
    const src = button.dataset.image;
    if (!src) return;
    event.preventDefault();
    openModal(button);
  });

  modal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-dismiss")) {
      closeModal();
    }
  });

  modal.querySelector(".presentation-image-modal__close")?.addEventListener("click", closeModal);
}

