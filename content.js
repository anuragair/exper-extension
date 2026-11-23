let clipUi = null;
let toast = null;
let selectedText = "";
let hideTimer = null;
let isSaving = false;
let suppressSelectionUntil = 0;
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme) {
  const resolvedTheme =
    theme === "system" ? (systemTheme.matches ? "dark" : "light") : theme;
  document.documentElement.dataset.contextualClipTheme = resolvedTheme;
}

function loadTheme() {
  chrome.storage.local.get(["theme"], (result) => {
    applyTheme(result.theme || "system");
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && typeof changes.theme?.newValue === "string") {
    applyTheme(changes.theme.newValue);
  }
});

systemTheme.addEventListener("change", () => {
  chrome.storage.local.get(["theme"], (result) => {
    if (!result.theme || result.theme === "system") applyTheme("system");
  });
});

loadTheme();

function createUi() {
  clipUi = document.createElement("div");
  clipUi.className = "contextual-clip-ui";
  clipUi.setAttribute("role", "dialog");
  clipUi.setAttribute("aria-label", "Save selected text");
  clipUi.innerHTML = `
    <div class="contextual-clip-toolbar">
      <span class="contextual-clip-preview"></span>
      <button class="contextual-clip-button contextual-clip-cancel" type="button">Cancel</button>
      <button class="contextual-clip-button contextual-clip-save" type="button">Save</button>
    </div>
  `;

  clipUi.querySelector(".contextual-clip-cancel").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideUi();
  });

  clipUi.querySelector(".contextual-clip-save").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    saveSelection();
  });

  clipUi.querySelector(".contextual-clip-save").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  clipUi.querySelector(".contextual-clip-cancel").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  document.documentElement.appendChild(clipUi);
}

function createToast() {
  toast = document.createElement("div");
  toast.className = "contextual-clip-toast";
  toast.setAttribute("role", "status");
  toast.textContent = "Saved to Tasks";
  document.documentElement.appendChild(toast);
}

function positionUi(rect) {
  const uiWidth = 308;
  const uiHeight = 40;
  const gap = 10;
  const margin = 12;

  let left = rect.left + rect.width / 2 - uiWidth / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - uiWidth - margin));

  let top = rect.top - uiHeight - gap;
  if (top < margin) top = rect.bottom + gap;
  top = Math.min(top, window.innerHeight - uiHeight - margin);

  clipUi.style.setProperty("--cc-x", `${left}px`);
  clipUi.style.setProperty("--cc-y", `${top}px`);
  clipUi.style.left = "0";
  clipUi.style.top = "0";
}

function showUi(text, rect) {
  if (!clipUi) createUi();
  clearTimeout(hideTimer);
  selectedText = text;

  const preview = clipUi.querySelector(".contextual-clip-preview");
  preview.textContent = text.length > 32 ? `${text.slice(0, 32)}…` : text;
  preview.title = text;

  positionUi(rect);
  clipUi.removeAttribute("data-saving");
  requestAnimationFrame(() => clipUi.setAttribute("data-visible", "true"));
}

function hideUi() {
  if (!clipUi) return;
  isSaving = false;
  suppressSelectionUntil = Date.now() + 800;
  clearTimeout(handleSelection.timer);
  window.getSelection()?.removeAllRanges();
  clipUi.removeAttribute("data-visible");
  clipUi.removeAttribute("data-saving");
  selectedText = "";
}

function saveSelection() {
  if (!selectedText || !clipUi || isSaving) return;

  isSaving = true;
  suppressSelectionUntil = Date.now() + 1200;
  clearTimeout(handleSelection.timer);
  window.getSelection()?.removeAllRanges();
  clipUi.setAttribute("data-saving", "true");
  const textToSave = selectedText;
  chrome.runtime.sendMessage(
    {
      type: "save-contextual-clip",
      text: textToSave,
      url: window.location.href,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        hideUi();
        return;
      }
      if (!response?.ok) {
        hideUi();
        return;
      }
      showToast();
      hideTimer = window.setTimeout(hideUi, 300);
    }
  );
}

function showToast() {
  if (!toast) createToast();
  toast.setAttribute("data-visible", "true");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.removeAttribute("data-visible");
  }, 1800);
}

function handleSelection() {
  window.clearTimeout(handleSelection.timer);
  handleSelection.timer = window.setTimeout(() => {
    if (isSaving || Date.now() < suppressSelectionUntil) return;
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";

    if (!text) {
      hideUi();
      return;
    }

    if (text.length < 2) return;

    const range = selection.rangeCount ? selection.getRangeAt(0) : null;
    if (!range) return;

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    showUi(text, rect);
  }, 180);
}

document.addEventListener("mouseup", handleSelection);
document.addEventListener("keyup", (event) => {
  if (event.shiftKey || event.key === "ArrowLeft" || event.key === "ArrowRight") {
    handleSelection();
  }
});

document.addEventListener("mousedown", (event) => {
  if (clipUi && clipUi.contains(event.target)) return;
  if (window.getSelection()?.toString().trim()) return;
  hideUi();
});

window.addEventListener("resize", hideUi);
window.addEventListener("scroll", hideUi, true);
