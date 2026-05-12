/**
 * Electron auto-updater — checks GitHub Releases for new versions.
 *
 * macOS (no code signing): notifies user and opens GitHub release page.
 * Windows / Linux: downloads and installs via electron-updater.
 */

import { autoUpdater, type UpdateInfo, type ProgressInfo } from "electron-updater";
import { BrowserWindow, shell } from "electron";
import { IS_MAC, GITHUB_REPO } from "./constants.js";

export interface AutoUpdateState {
  checking: boolean;
  updateAvailable: boolean;
  downloading: boolean;
  downloaded: boolean;
  progress: number;
  version: string | null;
  releaseUrl: string | null;
  error: string | null;
}

interface AutoUpdaterOptions {
  getMainWindow: () => BrowserWindow | null;
  rebuildTrayMenu: () => void;
  autoUpdate?: boolean;
  autoDownload?: boolean;
  showUpdateDialog?: boolean;
  allowPrerelease?: boolean;
}

const state: AutoUpdateState = {
  checking: false,
  updateAvailable: false,
  downloading: false,
  downloaded: false,
  progress: 0,
  version: null,
  releaseUrl: null,
  error: null,
};

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const INITIAL_DELAY_MS = 30_000; // 30 seconds after startup

let checkTimer: ReturnType<typeof setInterval> | null = null;
let initialTimer: ReturnType<typeof setTimeout> | null = null;

export function getAutoUpdateState(): AutoUpdateState {
  return { ...state };
}

export function initAutoUpdater(options: AutoUpdaterOptions): void {
  const isAutoUpdate = options.autoUpdate ?? true;
  const isAutoDownload = (options.autoDownload ?? false) && !IS_MAC;

  // auto_download: true  → download silently
  // auto_download: false → keep installer download/manual action in tray/menu
  // Update discovery stays silent; tray/menu and manual checks expose actions.
  // macOS always false — ad-hoc signed zips can't be auto-installed
  autoUpdater.autoDownload = isAutoDownload;
  autoUpdater.autoInstallOnAppQuit = !IS_MAC;
  // Beta channel opt-in via config.update.allow_prerelease (default false).
  // electron-builder writes beta-mac.yml / beta.yml for tags like vX.Y.Z-beta.SHA;
  // setting allowPrerelease=true makes electron-updater consume that channel.
  autoUpdater.allowPrerelease = options.allowPrerelease ?? false;

  autoUpdater.on("checking-for-update", () => {
    state.checking = true;
    state.error = null;
  });

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    state.checking = false;
    state.updateAvailable = true;
    state.version = info.version;
    state.releaseUrl = `https://github.com/${GITHUB_REPO}/releases/tag/v${info.version}`;
    options.rebuildTrayMenu();

    // autoDownload handles it silently — no dialog needed
    if (isAutoDownload) return;
  });

  autoUpdater.on("update-not-available", () => {
    state.checking = false;
    state.updateAvailable = false;
  });

  autoUpdater.on("download-progress", (progress: ProgressInfo) => {
    state.downloading = true;
    const rounded = Math.round(progress.percent);
    // Update dock/taskbar progress bar
    const win = options.getMainWindow();
    if (win) win.setProgressBar(progress.percent / 100);
    // Throttle tray rebuilds to every 10% increment
    if (rounded - state.progress >= 10 || rounded === 100) {
      state.progress = rounded;
      options.rebuildTrayMenu();
    } else {
      state.progress = rounded;
    }
  });

  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    state.downloading = false;
    state.downloaded = true;
    state.progress = 100;
    options.rebuildTrayMenu();

    const win = options.getMainWindow();
    // Clear dock/taskbar progress bar
    if (win) win.setProgressBar(-1);
  });

  autoUpdater.on("error", (err: Error) => {
    state.checking = false;
    state.downloading = false;
    state.error = err.message;
    console.error("[AutoUpdater] Error:", err.message);
    options.rebuildTrayMenu();
    // Clear dock/taskbar progress bar on error
    const win = options.getMainWindow();
    if (win) win.setProgressBar(-1);
  });

  if (isAutoUpdate) {
    // Initial check after delay
    initialTimer = setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err: Error) => {
        console.warn("[AutoUpdater] Initial check failed:", err.message);
      });
    }, INITIAL_DELAY_MS);

    // Periodic check
    checkTimer = setInterval(() => {
      autoUpdater.checkForUpdates().catch((err: Error) => {
        console.warn("[AutoUpdater] Periodic check failed:", err.message);
      });
    }, CHECK_INTERVAL_MS);
    if (checkTimer.unref) checkTimer.unref();
  }
}

export function checkForUpdateManual(): void {
  autoUpdater.checkForUpdates().catch((err: Error) => {
    console.warn("[AutoUpdater] Manual check failed:", err.message);
  });
}

/** Open release page on macOS; download installer on Windows/Linux. */
export function downloadUpdate(): void {
  if (IS_MAC) {
    if (state.releaseUrl) {
      shell.openExternal(state.releaseUrl).catch((err: unknown) => {
        console.error("[AutoUpdater] Failed to open release page:", err instanceof Error ? err.message : err);
      });
    }
    return;
  }
  autoUpdater.downloadUpdate().catch((err: Error) => {
    console.warn("[AutoUpdater] Download failed:", err.message);
  });
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall(false, true);
}

export function stopAutoUpdater(): void {
  autoUpdater.removeAllListeners();
  if (initialTimer) {
    clearTimeout(initialTimer);
    initialTimer = null;
  }
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}
