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

1. Select text on any web page. A compact Save/Cancel toolbar appears near the selection.
2. Choose **Save** to add it to your tasks, or **Cancel** to dismiss it.
3. Click the **Contextual Clip** icon in the Chrome toolbar to view saved tasks.
4. Hover over a task to reveal copy and delete actions.
5. Click the copy icon to copy the saved text.
6. Click a source link to open the original page.
7. Click the trash icon to delete it.
8. Click **Clear All** to remove every saved task.
9. Choose **System**, **Light**, or **Dark** in the popup header to set the theme.

Tasks are stored locally in Chrome under the `tasks` key in
`chrome.storage.local`.
