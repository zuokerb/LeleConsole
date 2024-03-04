const path = require("path");
const devMode = process.env.NODE_ENV === "development";
if (devMode) {
  const PATH_APP_NODE_MODULES = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "node_modules"
  );
  const Module = require("module");

  // for electron 16 or lower
  Module.globalPaths.push(PATH_APP_NODE_MODULES);
}

import { app, BrowserWindow, ipcMain, Menu, globalShortcut } from "electron";

Menu.setApplicationMenu(null);
import { autoUpdater } from "electron-updater";

import { createLocalStore } from "./../renderer/utils/LocalStore";
const localStore = createLocalStore();
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://d.lelelab.work",
});
autoUpdater.on("update-downloaded", () => {
  console.log("update-downloaded");
  sendUpdateMessage({
    cmd: "update-downloaded",
  });
});
autoUpdater.on("update-available", () => {
  console.log("update-available");
});
autoUpdater.on("error", (event) => {
  console.log(`autoUpdater error ${event}`);
});

if (process.env.NODE_ENV !== "development") {
  global.__static = path.join(__dirname, "/static").replace(/\\/g, "\\\\");
  global.__extra = path
    .join(process.resourcesPath, "/extraResources")
    .replace(/\\/g, "\\\\");
  console.log("__extra path:" + global.__extra);
}

let mainWindow = null;

const winURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:10800"
    : `file://${__dirname}/index.html`;

app.allowRendererProcessReuse = false;
app.disableHardwareAcceleration();

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.whenReady().then(() => {
  console.log(`app ready ${app.getVersion()}`);
  globalShortcut.register("CommandOrControl+Shift+D+E+V", () => {
    console.log("openDevTools");
    mainWindow.webContents.openDevTools();
  });
  globalShortcut.register("CommandOrControl+D+F+U", () => {
    console.log("flash-mode");
    sendUpdateMessage({
      cmd: "flash-mode",
    });
  });

  

  if (mainWindow === null) {
    createWindow();
  }
  // remove menu to stop the window being closed on Ctrl+W. See #121
  mainWindow.setMenu(null);
});
app.on("will-quit", () => {
  globalShortcut.unregister("CommandOrControl+Shift+D+E+V");
  globalShortcut.unregister("CommandOrControl+D+F+U");
  globalShortcut.unregisterAll();
});
app.on("window-all-closed", () => {
  console.log("quitting app...");
  // if (process.platform !== 'darwin') {
  app.quit();
  // }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
app.disableHardwareAcceleration()

ipcMain.on("window-close", (event, arg) => {
  console.log("ipcMain rcv window close");
  mainWindow.close();
});

ipcMain.on("window-reload", (event, arg) => {
  mainWindow.reload();
});


ipcMain.on("window-minimize", (event, arg) => {
  if (arg) {
    mainWindow.hide();
  } else {
    mainWindow.minimize();
  }
});

ipcMain.on("update-now", (e, arg) => {
  console.log("update-now");
  autoUpdater.quitAndInstall();
});

ipcMain.on("check-update", (e, arg) => {
  console.log("check-update");
  try {
    autoUpdater.checkForUpdates();
  } catch (error) {
    console.log(error);
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    backgroundColor: "#000c03",
    fullscreenable: false,
    frame: false,
    icon: path.join(__static, "icon.png"),
    useContentSize: false,
    width: 1280,
    height: 780,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      webSecurity: false
    },
  });

  mainWindow.loadURL(winURL);
  mainWindow.webContents.on("did-finish-load", () => {
    if (process.env.NODE_ENV !== "development") {
      mainWindow.webContents.closeDevTools();
    }
  });

  mainWindow.setResizable(false);
  mainWindow.on("unresponsive", () => {
    mainWindow.close();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.setSize(1280, 780);
    mainWindow.show();
    mainWindow.webContents.setZoomFactor(1);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function sendUpdateMessage(data) {
  console.log("sendUpdateMessage", sendUpdateMessage);
  mainWindow.webContents.send("message", data);
}
