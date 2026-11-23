# Contextual Clip

An experimental Google Chrome extension for viewing and managing saved contextual clips as tasks.

## Installation

This extension is currently distributed as unpacked source code.

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository folder containing `manifest.json`.
6. Pin **Contextual Clip** from the Extensions menu for quick access.

There are no dependencies to install and no build step is required.

## Usage

1. Click the **Contextual Clip** icon in the Chrome toolbar.
2. The popup displays saved tasks, including their text and source domain.
3. Click a source link to open the original page.
4. Hover over a task and click the trash icon to delete it.
5. Click **Clear All** to remove every saved task.

Tasks are stored locally in Chrome under the `tasks` key in
`chrome.storage.local`. The current repository provides the task list UI; it
does not yet include a browser selection/context-menu action for creating new
tasks.
