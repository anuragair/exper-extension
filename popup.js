const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const clearAllButton = document.getElementById("clear-all");
const themeSelect = document.getElementById("theme-select");

let tasks = [];
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme) {
  const resolvedTheme =
    theme === "system" ? (systemTheme.matches ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = resolvedTheme;
}

function loadTheme() {
  const storage = getStorageArea();
  if (storage) {
    storage.get(["theme"], (result) => {
      const theme = result.theme === "light" || result.theme === "dark" ? result.theme : "system";
      themeSelect.value = theme;
      applyTheme(theme);
    });
  } else {
    const theme = localStorage.getItem("theme") || "system";
    themeSelect.value = theme;
    applyTheme(theme);
  }
}

function getStorageArea() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return chrome.storage.local;
  }
  return null;
}

function loadTasks() {
  const storage = getStorageArea();
  if (storage) {
    storage.get(["tasks"], (result) => {
      tasks = Array.isArray(result.tasks) ? result.tasks : [];
      render();
    });
  } else {
    try {
      tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
      if (!Array.isArray(tasks)) tasks = [];
    } catch {
      tasks = [];
    }
    render();
  }
}

function saveTasks() {
  const storage = getStorageArea();
  if (storage) {
    storage.set({ tasks });
  } else {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }
}

function getDomain(url) {
  if (!url) return "Unknown source";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || "Unknown source";
  }
}

function createLinkIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    '<path d="M6.75 9.25a3 3 0 0 0 4.24 0l1.76-1.76a3 3 0 0 0-4.24-4.24L7.35 4.41M9.25 6.75a3 3 0 0 0-4.24 0L3.25 8.51A3 3 0 0 0 7.49 12.75l1.16-1.16" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>';
  return svg;
}

function createTrashIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    '<path d="M3.5 5h9M6.25 5V3.5h3.5V5M5 5l.5 7.25h5L11 5M7 7v3.25M9 7v3.25" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>';
  return svg;
}

function createCopyIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    '<rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.25"/><path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9A1.5 1.5 0 0 0 3.5 10.5H5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>';
  return svg;
}

async function copyTaskText(button, text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  button.classList.add("copied");
  button.setAttribute("aria-label", "Copied");
  window.setTimeout(() => {
    button.classList.remove("copied");
    button.setAttribute("aria-label", `Copy task: ${text}`);
  }, 1400);
}

function createTaskCard(task, index) {
  const card = document.createElement("article");
  card.className = "task-card";

  const text = document.createElement("p");
  text.className = "task-text";
  text.textContent = task.text || "";
  card.appendChild(text);

  const sourceUrl = task.url || task.sourceUrl || "";
  const source = document.createElement("a");
  source.className = "source";
  source.href = sourceUrl || "#";
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  source.title = sourceUrl ? `Open ${getDomain(sourceUrl)}` : "Source unavailable";
  source.appendChild(createLinkIcon());

  const domain = document.createElement("span");
  domain.className = "source-domain";
  domain.textContent = getDomain(sourceUrl);
  source.appendChild(domain);
  card.appendChild(source);

  const copyButton = document.createElement("button");
  copyButton.className = "copy-button";
  copyButton.type = "button";
  copyButton.setAttribute("aria-label", `Copy task: ${task.text || "untitled"}`);
  copyButton.title = "Copy text";
  copyButton.appendChild(createCopyIcon());
  copyButton.addEventListener("click", () => copyTaskText(copyButton, task.text || ""));
  card.appendChild(copyButton);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete task: ${task.text || "untitled"}`);
  deleteButton.appendChild(createTrashIcon());
  deleteButton.addEventListener("click", () => deleteTask(index));
  card.appendChild(deleteButton);

  return card;
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  render();
}

function render() {
  taskList.replaceChildren();

  tasks.forEach((task, index) => {
    taskList.appendChild(createTaskCard(task, index));
  });

  const count = tasks.length;
  taskCount.textContent = `${count} ${count === 1 ? "task" : "tasks"}`;
  const isEmpty = count === 0;
  taskList.hidden = isEmpty;
  emptyState.hidden = !isEmpty;
  clearAllButton.hidden = isEmpty;
}

clearAllButton.addEventListener("click", () => {
  tasks = [];
  saveTasks();
  render();
});

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;
  applyTheme(theme);
  const storage = getStorageArea();
  if (storage) {
    storage.set({ theme });
  } else {
    localStorage.setItem("theme", theme);
  }
});

systemTheme.addEventListener("change", () => {
  if (themeSelect.value === "system") applyTheme("system");
});

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (Array.isArray(changes.tasks?.newValue)) {
        tasks = changes.tasks.newValue;
        render();
      }
      if (typeof changes.theme?.newValue === "string") {
        themeSelect.value = changes.theme.newValue;
        applyTheme(changes.theme.newValue);
      }
    }
  });
}

loadTheme();
loadTasks();
