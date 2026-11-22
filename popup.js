const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const clearAllButton = document.getElementById("clear-all");

let tasks = [];

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

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && Array.isArray(changes.tasks?.newValue)) {
      tasks = changes.tasks.newValue;
      render();
    }
  });
}

loadTasks();
