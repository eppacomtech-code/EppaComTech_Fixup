"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector(".site-nav");

if (menuToggle && siteNavigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
    siteNavigation.classList.toggle("is-open", !isExpanded);
  });

  siteNavigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      siteNavigation.classList.remove("is-open");
    }
  });
}

const filterButtons = document.querySelectorAll(".filter-button");
const serviceCards = document.querySelectorAll(".service-card");
const emptyMessage = document.querySelector(".filter-empty");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;
    let visibleCount = 0;

    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    serviceCards.forEach((card) => {
      const isVisible = selectedFilter === "all" || card.dataset.category === selectedFilter;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (emptyMessage) emptyMessage.hidden = visibleCount > 0;
  });
});

const copyAddressButton = document.querySelector(".copy-address");
const copyFeedback = document.querySelector(".copy-feedback");
const shopAddress = "No. 7A, Jekenu, NAF Villa, Asokoro, Abuja, FCT, Nigeria";

if (copyAddressButton && copyFeedback) {
  copyAddressButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shopAddress);
      copyFeedback.textContent = "Address copied to clipboard.";
    } catch (error) {
      copyFeedback.textContent = "Copy unavailable. Address: " + shopAddress;
    }
  });
}

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

const headings = document.querySelectorAll("h1, h2, h3");

headings.forEach((heading, headingIndex) => {
  const accessibleText = heading.innerText.replace(/\s+/g, " ").trim();
  let letterIndex = 0;
  let initialDecorated = false;

  const wrapLetters = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const fragment = document.createDocumentFragment();

        for (const character of child.textContent) {
          if (/\s/.test(character)) {
            fragment.append(document.createTextNode(character));
            continue;
          }

          const letter = document.createElement("span");
          letter.className = "heading-letter";
          if (!initialDecorated) {
            letter.classList.add("heading-initial");
            initialDecorated = true;
          }
          letter.setAttribute("aria-hidden", "true");
          letter.style.setProperty(
            "--wave-delay",
            `${-(letterIndex * 0.14 + headingIndex * 0.6)}s`,
          );
          letter.textContent = character;
          fragment.append(letter);
          letterIndex += 1;
        }

        child.replaceWith(fragment);
      } else if (child instanceof HTMLElement) {
        wrapLetters(child);
      }
    });
  };

  heading.setAttribute("aria-label", accessibleText);
  wrapLetters(heading);
});

const heroTitle = document.querySelector(".hero h1");
const heroTitleLetters = heroTitle?.querySelectorAll(".heading-letter");
const heroTitleLastLetter = heroTitleLetters?.[heroTitleLetters.length - 1];
const reducedMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

if (heroTitle && heroTitleLetters?.length && heroTitleLastLetter && !reducedMotionPreference.matches) {
  heroTitleLetters.forEach((letter, index) => {
    letter.style.setProperty("--hero-letter-delay", `${index * 0.1}s`);
  });

  let heroTitleTimers = [];
  const clearHeroTitleTimers = () => {
    heroTitleTimers.forEach((timer) => window.clearTimeout(timer));
    heroTitleTimers = [];
  };

  const startHeroTitleCycle = () => {
    clearHeroTitleTimers();
    if (reducedMotionPreference.matches) return;
    heroTitle.classList.remove("is-hidden", "hero-title-animated");
    void heroTitle.offsetWidth;
    heroTitle.classList.add("hero-title-animated");

    const letterSequenceDuration = (heroTitleLetters.length - 1) * 100 + 650;
    heroTitleTimers.push(window.setTimeout(() => {
      heroTitleTimers.push(window.setTimeout(() => {
        heroTitle.classList.add("is-hidden");
        heroTitleTimers.push(window.setTimeout(startHeroTitleCycle, 2250));
      }, 120000));
    }, letterSequenceDuration));
  };

  reducedMotionPreference.addEventListener("change", () => {
    clearHeroTitleTimers();
    if (reducedMotionPreference.matches) {
      heroTitle.classList.remove("hero-title-animated", "is-hidden");
    } else {
      startHeroTitleCycle();
    }
  });
  startHeroTitleCycle();
}

const editablePhotos = document.querySelectorAll(".portrait-photo, .service-image");
const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];
const maxPhotoSize = 5 * 1024 * 1024;
const maxAlbumPhotos = 100;
const photoObjectUrls = new WeakMap();
const albumObjectUrls = [];
const photoAlbums = {
  laptops: {
    label: "laptop",
    base: [
      { src: "assets/laptops/laptop-stock-1.jpg", alt: "HP laptop stock at EppaComTech" },
      { src: "assets/laptops/laptop-stock-2.jpg", alt: "Open HP laptop available from EppaComTech" },
      { src: "assets/laptops/laptop-stock-3.jpg", alt: "HP laptop with touchscreen and keyboard" },
    ],
    uploaded: [],
  },
  desktops: {
    label: "desktop",
    base: [
      { src: "assets/desktops/desktop-stock-1.jpg", alt: "Desktop computer setup with monitor, keyboard, and speakers" },
      { src: "assets/desktops/desktop-stock-2.jpg", alt: "Desktop tower computer hardware" },
    ],
    uploaded: [],
  },
  phones: {
    label: "phone",
    base: [{ src: "assets/service-phones.jpg", alt: "iPhone and Android phone selection" }],
    uploaded: [],
  },
  accessories: {
    label: "accessory",
    base: [{ src: "assets/service-accessories.jpg", alt: "Headphones and personal technology accessories" }],
    uploaded: [],
  },
};
let photoDatabase;
let photoStorageError = "";
let photoDatabaseRequest;

try {
  if (!window.indexedDB) throw new Error("IndexedDB is unavailable in this browser.");
  photoDatabaseRequest = window.indexedDB.open("eppacomtech-photos", 1);
  photoDatabaseRequest.addEventListener("upgradeneeded", () => {
    photoDatabaseRequest.result.createObjectStore("photos");
  });
  photoDatabaseRequest.addEventListener("success", () => {
    photoDatabase = photoDatabaseRequest.result;
    photoDatabase.addEventListener("versionchange", () => photoDatabase.close());

    editablePhotos.forEach((photo) => {
      const transaction = photoDatabase.transaction("photos", "readonly");
      const request = transaction.objectStore("photos").get(photo.dataset.photoKey);
      request.addEventListener("success", () => {
        if (request.result instanceof Blob) {
          setPhotoSource(photo, request.result);
          photo.closest(".editable-photo")?.querySelector(".photo-restore-button")?.removeAttribute("hidden");
        }
      });
      request.addEventListener("error", () => {
        const status = photo.closest(".editable-photo")?.querySelector(".photo-upload-status");
        if (status) status.textContent = "Could not load this saved photo.";
      });
    });
    loadPhotoAlbums();
  });
  photoDatabaseRequest.addEventListener("error", () => {
    photoStorageError = photoDatabaseRequest.error?.message || "Photo storage could not be opened.";
    editablePhotos.forEach((photo) => {
      const status = photo.closest(".editable-photo")?.querySelector(".photo-upload-status");
      if (status) status.textContent = "Photo storage is unavailable; changes may not persist after closing this page.";
    });
  });
} catch (error) {
  photoStorageError = error instanceof Error ? error.message : "Photo storage could not be opened.";
}

function setPhotoSource(photo, blob) {
  editablePhotos.forEach((candidate) => {
    if (candidate.dataset.photoKey !== photo.dataset.photoKey) return;
    const previousUrl = photoObjectUrls.get(candidate);
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    const photoUrl = URL.createObjectURL(blob);
    photoObjectUrls.set(candidate, photoUrl);
    candidate.src = photoUrl;
    const restoreButton = candidate.closest(".editable-photo")?.querySelector(".photo-restore-button");
    if (restoreButton instanceof HTMLButtonElement) restoreButton.hidden = false;
    const status = candidate.closest(".editable-photo")?.querySelector(".photo-upload-status");
    if (status) status.textContent = "Photo updated and saved in this browser.";
  });
}

function restorePhotoSource(photo, originalSource) {
  editablePhotos.forEach((candidate) => {
    if (candidate.dataset.photoKey !== photo.dataset.photoKey) return;
    const previousUrl = photoObjectUrls.get(candidate);
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    photoObjectUrls.delete(candidate);
    candidate.src = originalSource;
    const restoreButton = candidate.closest(".editable-photo")?.querySelector(".photo-restore-button");
    if (restoreButton instanceof HTMLButtonElement) restoreButton.hidden = true;
    const status = candidate.closest(".editable-photo")?.querySelector(".photo-upload-status");
    if (status) status.textContent = "Original photo restored.";
  });
}

function storePhoto(key, blob) {
  return new Promise((resolve, reject) => {
    const transaction = photoDatabase.transaction("photos", "readwrite");
    transaction.objectStore("photos").put(blob, key);
    transaction.addEventListener("complete", resolve, { once: true });
    transaction.addEventListener("error", () => reject(transaction.error), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error), { once: true });
  });
}

function removeStoredPhoto(key) {
  return new Promise((resolve, reject) => {
    const transaction = photoDatabase.transaction("photos", "readwrite");
    transaction.objectStore("photos").delete(key);
    transaction.addEventListener("complete", resolve, { once: true });
    transaction.addEventListener("error", () => reject(transaction.error), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error), { once: true });
  });
}

function getStoredAlbum(key) {
  return new Promise((resolve, reject) => {
    const transaction = photoDatabase.transaction("photos", "readonly");
    const request = transaction.objectStore("photos").get(`album:${key}`);
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });
}

function saveStoredAlbum(key, blobs) {
  return new Promise((resolve, reject) => {
    const transaction = photoDatabase.transaction("photos", "readwrite");
    transaction.objectStore("photos").put(blobs, `album:${key}`);
    transaction.addEventListener("complete", resolve, { once: true });
    transaction.addEventListener("error", () => reject(transaction.error), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error), { once: true });
  });
}

function albumPhotos(key) {
  const album = photoAlbums[key];
  return album ? [...album.base, ...album.uploaded] : [];
}

const catalogItemDetailsKey = "eppacomtech-catalog-item-details-v1";
let catalogItemDetails = {};

try {
  const savedDetails = JSON.parse(window.localStorage.getItem(catalogItemDetailsKey) || "{}");
  if (savedDetails && typeof savedDetails === "object" && !Array.isArray(savedDetails)) {
    catalogItemDetails = savedDetails;
  }
} catch (error) {
  console.error("Could not load saved catalog item details.", error);
}

function formatCatalogPrice(price) {
  if (price === "") return "Price on request";
  const amount = Number(price);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)
    : "Price on request";
}

function setupCatalogItemDetails(card, itemKey) {
  const heading = card.querySelector("h3");
  const description = card.querySelector("p");
  if (!heading || !description || card.querySelector(".catalog-item-editor")) return;

  const defaultDescription = description.textContent.trim();
  const saved = catalogItemDetails[itemKey];
  const currentDescription = typeof saved?.description === "string" ? saved.description : defaultDescription;
  const currentPrice = typeof saved?.price === "string" ? saved.price : "";

  description.classList.add("catalog-item-description");
  description.textContent = currentDescription;

  const price = document.createElement("p");
  price.className = "catalog-item-price";
  const priceLabel = document.createElement("strong");
  priceLabel.textContent = "Price: ";
  const priceValue = document.createElement("span");
  priceValue.textContent = formatCatalogPrice(currentPrice);
  price.append(priceLabel, priceValue);

  const form = document.createElement("form");
  form.className = "catalog-item-editor";
  const editorTitle = document.createElement("strong");
  editorTitle.className = "catalog-item-editor-title";
  editorTitle.textContent = "Item details";

  const descriptionLabel = document.createElement("label");
  descriptionLabel.textContent = "Description";
  const descriptionInput = document.createElement("textarea");
  descriptionInput.rows = 3;
  descriptionInput.required = true;
  descriptionInput.maxLength = 500;
  descriptionInput.value = currentDescription;
  descriptionLabel.append(descriptionInput);

  const priceLabelInput = document.createElement("label");
  priceLabelInput.textContent = "Price (NGN)";
  const priceInput = document.createElement("input");
  priceInput.type = "number";
  priceInput.min = "0";
  priceInput.step = "1";
  priceInput.placeholder = "Leave blank for price on request";
  priceInput.value = currentPrice;
  priceLabelInput.append(priceInput);

  const saveButton = document.createElement("button");
  saveButton.className = "catalog-item-save";
  saveButton.type = "submit";
  saveButton.textContent = "Save item details";
  const status = document.createElement("span");
  status.className = "catalog-item-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  form.append(editorTitle, descriptionLabel, priceLabelInput, saveButton, status);
  card.append(price, form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const updatedDetails = {
      ...catalogItemDetails,
      [itemKey]: {
        description: descriptionInput.value.trim(),
        price: priceInput.value,
      },
    };

    try {
      window.localStorage.setItem(catalogItemDetailsKey, JSON.stringify(updatedDetails));
      catalogItemDetails = updatedDetails;
      description.textContent = descriptionInput.value.trim();
      priceValue.textContent = formatCatalogPrice(priceInput.value);
      status.textContent = "Item details saved in this browser.";
    } catch (error) {
      status.textContent = `Could not save item details: ${error instanceof Error ? error.message : "browser storage error"}`;
    }
  });
}

document.querySelectorAll(".catalog-panel .catalog-product-grid:not(.uploaded-product-grid) .catalog-product").forEach((card, index) => {
  const panel = card.closest(".catalog-panel");
  if (panel) setupCatalogItemDetails(card, `${panel.id}-${index}`);
});

function renderAlbum(key) {
  const album = photoAlbums[key];
  if (!album) return;

  const uploadGrid = document.querySelector(`[data-grid-for="${key}"]`);
  const photoCount = document.querySelector(`[data-count-for="${key}"]`);
  if (photoCount) photoCount.textContent = `${album.base.length + album.uploaded.length} / ${maxAlbumPhotos} photos`;
  if (!uploadGrid) return;

  uploadGrid.replaceChildren();
  uploadGrid.hidden = album.uploaded.length === 0;
  album.uploaded.forEach((photo, index) => {
    const card = document.createElement("article");
    card.className = "catalog-product";
    const image = document.createElement("img");
    image.className = "catalog-uploaded-photo";
    image.src = photo.src;
    image.alt = photo.alt;
    const heading = document.createElement("h3");
    heading.textContent = `${album.label[0].toUpperCase()}${album.label.slice(1)} photo ${album.base.length + index + 1}`;
    const description = document.createElement("p");
    description.textContent = "Added to this photo collection.";
    card.append(image, heading, description);
    setupCatalogItemDetails(card, `catalog-${key}-uploaded-${index}`);
    uploadGrid.append(card);
  });
}

function loadPhotoAlbums() {
  Object.entries(photoAlbums).forEach(([key, album]) => {
    getStoredAlbum(key).then((storedPhotos) => {
      if (!Array.isArray(storedPhotos)) {
        renderAlbum(key);
        return;
      }

      const availableSlots = Math.max(0, maxAlbumPhotos - album.base.length);
      album.uploaded = storedPhotos.slice(0, availableSlots).filter((blob) => blob instanceof Blob).map((blob, index) => {
        const src = URL.createObjectURL(blob);
        albumObjectUrls.push(src);
        return { blob, src, alt: `${album.label} photo ${album.base.length + index + 1}` };
      });
      renderAlbum(key);
    }).catch((error) => {
      const status = document.querySelector(`[data-status-for="${key}"]`);
      if (status) status.textContent = `Could not load saved photos: ${error instanceof Error ? error.message : "browser storage error"}`;
    });
  });
}

document.querySelectorAll(".catalog-photo-input").forEach((input) => {
  input.addEventListener("change", async () => {
    const key = input.dataset.album;
    const album = key ? photoAlbums[key] : undefined;
    const status = key ? document.querySelector(`[data-status-for="${key}"]`) : null;
    const files = Array.from(input.files || []);
    input.value = "";
    if (!album || !status || files.length === 0) return;

    if (!photoDatabase) {
      status.textContent = `Photo storage is unavailable: ${photoStorageError || "please reload and try again."}`;
      return;
    }

    if (files.some((file) => !allowedPhotoTypes.includes(file.type))) {
      status.textContent = "Use JPG, PNG, or WebP images only.";
      return;
    }
    if (files.some((file) => file.size > maxPhotoSize)) {
      status.textContent = "Each photo must be smaller than 5 MB.";
      return;
    }

    const remainingSlots = maxAlbumPhotos - album.base.length - album.uploaded.length;
    if (files.length > remainingSlots) {
      status.textContent = `This collection has room for ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} (maximum ${maxAlbumPhotos}).`;
      return;
    }

    try {
      const additions = files.map((file, index) => {
        const blob = file.slice(0, file.size, file.type);
        const src = URL.createObjectURL(blob);
        albumObjectUrls.push(src);
        return {
          blob,
          src,
          alt: `${album.label} photo ${album.base.length + album.uploaded.length + index + 1}`,
        };
      });
      await saveStoredAlbum(key, [...album.uploaded, ...additions].map((photo) => photo.blob));
      album.uploaded.push(...additions);
      renderAlbum(key);
      status.textContent = `${files.length} photo${files.length === 1 ? "" : "s"} added. This collection now has ${album.base.length + album.uploaded.length} of ${maxAlbumPhotos} photos.`;
    } catch (error) {
      status.textContent = `Could not save these photos: ${error instanceof Error ? error.message : "browser storage error"}`;
    }
  });
});

editablePhotos.forEach((photo, index) => {
  const originalSource = photo.getAttribute("src");
  const wrapper = document.createElement("span");
  wrapper.className = "editable-photo";
  wrapper.dataset.photoIndex = String(index);
  photo.dataset.photoKey = photo.dataset.photoKey || originalSource;
  photo.parentNode.insertBefore(wrapper, photo);
  wrapper.append(photo);

  const controls = document.createElement("span");
  controls.className = "editable-photo-controls";
  const changeLabel = document.createElement("label");
  changeLabel.className = "photo-change-button";
  changeLabel.textContent = "✎";
  changeLabel.setAttribute("aria-label", `Change photo: ${photo.alt}`);
  changeLabel.title = "Change photo";

  const input = document.createElement("input");
  input.className = "photo-file-input";
  input.type = "file";
  input.accept = allowedPhotoTypes.join(",");
  input.setAttribute("aria-label", `Select replacement image for ${photo.alt}`);
  changeLabel.append(input);

  const restoreButton = document.createElement("button");
  restoreButton.className = "photo-restore-button";
  restoreButton.type = "button";
  restoreButton.textContent = "↺";
  restoreButton.setAttribute("aria-label", `Restore original photo: ${photo.alt}`);
  restoreButton.title = "Restore original photo";
  restoreButton.hidden = true;

  controls.append(changeLabel, restoreButton);
  wrapper.append(controls);

  const status = document.createElement("span");
  status.className = "photo-upload-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  if (photoStorageError) status.textContent = "Photo storage is unavailable; changes may not persist after closing this page.";
  wrapper.append(status);

  input.addEventListener("change", async () => {
    const selectedFile = input.files?.[0];
    input.value = "";
    if (!selectedFile) return;

    if (!allowedPhotoTypes.includes(selectedFile.type)) {
      status.textContent = "Choose a JPG, PNG, or WebP image.";
      return;
    }

    if (selectedFile.size > maxPhotoSize) {
      status.textContent = "Choose an image smaller than 5 MB.";
      return;
    }

    if (!photoDatabase) {
      status.textContent = `Photo storage is unavailable: ${photoStorageError || "please reload and try again."}`;
      return;
    }

    try {
      await storePhoto(photo.dataset.photoKey, selectedFile);
      setPhotoSource(photo, selectedFile);
      restoreButton.hidden = false;
      status.textContent = "Photo updated and saved in this browser.";
    } catch (error) {
      status.textContent = `Could not save this photo: ${error instanceof Error ? error.message : "browser storage error"}`;
    }
  });

  restoreButton.addEventListener("click", async () => {
    if (!photoDatabase) {
      status.textContent = `Photo storage is unavailable: ${photoStorageError || "please reload and try again."}`;
      return;
    }

    try {
      await removeStoredPhoto(photo.dataset.photoKey);
      restorePhotoSource(photo, originalSource);
      restoreButton.hidden = true;
      status.textContent = "Original photo restored.";
    } catch (error) {
      status.textContent = `Could not restore this photo: ${error instanceof Error ? error.message : "browser storage error"}`;
    }
  });
});

const computerCatalog = document.querySelector(".computer-catalog");
const computerCatalogCloseButton = document.querySelector(".computer-catalog-close");
const catalogTabs = document.querySelectorAll(".catalog-tab");
const laptopServiceCard = document.querySelector(".service-card-laptops");

function openComputerCatalog(album = "laptops") {
  if (computerCatalog instanceof HTMLDialogElement && !computerCatalog.open) {
    computerCatalog.showModal();
  }
  const albumTab = document.querySelector(`#catalog-${album}-tab`);
  if (albumTab instanceof HTMLButtonElement) albumTab.click();
}

if (computerCatalog instanceof HTMLDialogElement) {
  document.querySelectorAll(".album-open-button, .catalog-open-button").forEach((button) => {
    button.addEventListener("click", () => openComputerCatalog(button.dataset.album || "laptops"));
  });
  computerCatalogCloseButton?.addEventListener("click", () => computerCatalog.close());
  computerCatalog.addEventListener("click", (event) => {
    if (event.target === computerCatalog) computerCatalog.close();
  });

  catalogTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      catalogTabs.forEach((candidate) => {
        const selected = candidate === tab;
        candidate.classList.toggle("is-active", selected);
        candidate.setAttribute("aria-selected", String(selected));
      });
      document.querySelectorAll(".catalog-panel").forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute("aria-controls");
      });
    });
  });
}

if (laptopServiceCard) {
  laptopServiceCard.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest(".editable-photo-controls, .photo-file-input, .catalog-open-button")
    ) return;
    openComputerCatalog();
  });
}

const imageViewer = document.querySelector(".image-viewer");
const imageViewerPhoto = document.querySelector(".image-viewer-photo");
const imageViewerCaption = document.querySelector(".image-viewer-caption");
const imageViewerStage = document.querySelector(".image-viewer-stage");
const imageZoomIn = document.querySelector(".image-zoom-in");
const imageZoomOut = document.querySelector(".image-zoom-out");
const imageRotateLeft = document.querySelector(".image-rotate-left");
const imageRotateRight = document.querySelector(".image-rotate-right");
const imageViewerClose = document.querySelector(".image-viewer-close");
const zoomablePhotos = document.querySelectorAll(".portrait-photo, .service-image");
let activePhoto = null;
let imageZoom = 1;
let imageFitScale = 1;
let imageRotation = 0;

if (
  imageViewer instanceof HTMLDialogElement &&
  imageViewerPhoto instanceof HTMLImageElement &&
  imageViewerCaption &&
  imageViewerStage &&
  imageZoomIn &&
  imageZoomOut &&
  imageRotateLeft &&
  imageRotateRight &&
  imageViewerClose
) {
  const updateZoom = () => {
    if (!activePhoto) return;

    imageViewerPhoto.style.width = `${activePhoto.naturalWidth * imageFitScale * imageZoom}px`;
    imageViewerPhoto.style.height = `${activePhoto.naturalHeight * imageFitScale * imageZoom}px`;
    imageViewerPhoto.style.transform = `rotate(${imageRotation}deg)`;
    imageZoomIn.disabled = imageZoom >= 4;
    imageZoomOut.disabled = imageZoom <= 1;
  };

  const rotatePhoto = (degrees) => {
    if (!activePhoto) return;

    imageRotation = (imageRotation + degrees + 360) % 360;
    const isQuarterTurn = imageRotation % 180 !== 0;
    const fittedWidth = isQuarterTurn ? activePhoto.naturalHeight : activePhoto.naturalWidth;
    const fittedHeight = isQuarterTurn ? activePhoto.naturalWidth : activePhoto.naturalHeight;
    imageFitScale = Math.min(
      (window.innerWidth * 0.86) / fittedWidth,
      (window.innerHeight * 0.7) / fittedHeight,
      1,
    );
    updateZoom();
  };

  const openPhoto = (photo) => {
    if (!photo.complete || !photo.naturalWidth) return;

    if (photo.closest(".service-gallery")) {
      openComputerCatalog("laptops");
      return;
    }

    if (photo.classList.contains("laptop-card-photo")) {
      openComputerCatalog("laptops");
      return;
    }

    if (photo.dataset.photoAlbum) {
      openComputerCatalog(photo.dataset.photoAlbum);
      return;
    }

    activePhoto = photo;
    imageZoom = photo.closest(".service-gallery") ? 1.5 : 1;
    imageRotation = 0;
    imageFitScale = Math.min(
      (window.innerWidth * 0.86) / photo.naturalWidth,
      (window.innerHeight * 0.7) / photo.naturalHeight,
      1,
    );
    imageViewerPhoto.src = photo.currentSrc || photo.src;
    imageViewerPhoto.alt = photo.alt;
    imageViewerCaption.textContent = photo.alt;
    updateZoom();
    imageViewerStage.scrollTo(0, 0);
    imageViewer.showModal();
  };

  zoomablePhotos.forEach((photo) => {
    photo.tabIndex = 0;
    photo.setAttribute("role", "button");
    photo.setAttribute("aria-label", `View larger: ${photo.alt}`);
    photo.addEventListener("click", () => openPhoto(photo));
    photo.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPhoto(photo);
      }
    });
  });

  imageZoomIn.addEventListener("click", () => {
    imageZoom = Math.min(4, imageZoom + 0.5);
    updateZoom();
  });

  imageZoomOut.addEventListener("click", () => {
    imageZoom = Math.max(1, imageZoom - 0.5);
    updateZoom();
  });

  imageRotateLeft.addEventListener("click", () => rotatePhoto(-90));
  imageRotateRight.addEventListener("click", () => rotatePhoto(90));
  imageViewerClose.addEventListener("click", () => imageViewer.close());
  imageViewer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      imageViewer.close();
    }
  });
  imageViewer.addEventListener("click", (event) => {
    if (event.target === imageViewer) imageViewer.close();
  });
  imageViewer.addEventListener("close", () => {
    if (activePhoto) activePhoto.focus({ preventScroll: true });
    activePhoto = null;
  });
}
