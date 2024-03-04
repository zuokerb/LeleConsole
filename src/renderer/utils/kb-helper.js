const fs = require("fs");
import path from "path";
import electron from "electron";
const app = electron.app || electron.remote.app;
const https = require("https");
import {
  allKeycodes,
  macroKeys,
  modTapKeys,
  modBasicKeys,
} from "../config/key-group.js";
const { SerialPort } = require("serialport");

const shiftBufferFrom16Bit = (buffer) =>
  buffer.map(shiftFrom16Bit).flatMap((value) => value);
const shiftFrom16Bit = (value) => [value >> 8, value & 255];
const shiftTo16Bit = (hi, lo) => (hi << 8) | lo;
const keymapKey = (row, col) => `${row},${col}`;
const getKeyName = (byte) => {
  const key = getKeyNameFromByte(byte);
  if (key) return key;

  const modTap = parseModTapKey(byte);
  if (!modTap) return "";
  console.log(modTap);
  return (
    '<div class="mod-tooltip">MT: ' +
    getKeyNameFromByte(modTap[0]) +
    "<br/>" +
    getModTapKeyName(modTap[1]) +
    (modTap[2] ? "<br/>" + getModTapKeyName(modTap[2]) : "") +
    "</div>"
  );
};
const getKeyNameFromByte = (byte) => {
  let key = allKeycodes.filter((k) => byte == k.byte);
  if (key.length) return key[0]["short"] ? key[0]["short"] : key[0]["name"];
  return null;
};
const getModTapKeyName = (byte) => {
  let key = modTapKeys.find((k) => k.code == byte);
  if (key) return key["name"];
  return null;
};
const parseModTapKey = (byte) => {
  if (byte < 0x6000 || byte > 0x7fe7) return false;
  const possible_mods = modTapKeys.map((k) => k.code);
  let mods = (byte >> 8) & 0x1f;
  let basicCode = byte & 0xff;
  if (modBasicKeys.find((k) => k.byte == basicCode) == 0) return false;
  for (let mod1 of possible_mods) {
    if (mod1 == mods) return [basicCode, mod1];
    for (let mod2 of possible_mods) {
      if ((mod1 | mod2) === mods) {
        return [basicCode, mod1, mod2];
      }
    }
  }
  return false;
};
const getKeyByte = function (code) {
  let key = allKeycodes.filter((k) => code == k.code);
  if (key.length === 0) return false;
  return key[0]["byte"];
};
const getKeyCode = function (byte) {
  let key = allKeycodes.filter((k) => byte == k.byte);
  if (key.length === 0) return false;
  return key[0]["code"];
};
const hexId = (id) => parseInt(id).toString(16).toUpperCase();

const hs2Hex = function (h, s, l = 100) {
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const isValidMacroKey = function (e) {
  return macroKeys.indexOf(e.toUpperCase()) > -1;
};
const macroExpressCheck = function (expression) {
  if (expression.match(/(?<!\\)\{(?![^{]*})/)) {
    return "Looks like a keycode block - {} - is unclosed! ";
  }
  const t = /(?<!\\){(.*?)}/g;
  let n = [];
  for (; (n = t.exec(expression)); ) {
    const e = n[1].replace(/\s+/g, "");
    if (!e.length) {
      return "Sorry, I can't handle empty {}";
    }
    const invalidK = e
      .split(",")
      .filter((e) => e.trim().length && !isValidMacroKey(e));
    if (invalidK.length) {
      return `Invalid keycodes detected: ${invalidK.join(",")}`;
    }
  }
  return true;
};
function concatTypedArrays(a, b) {
  var c = new a.constructor(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}
const decodeBuffer = (e) => {
  let t = [];
  for (let n = 0; n < e.length; n += 2) t.push(shiftTo16Bit(e[n], e[n + 1]));
  return t;
};
const encodeBuffer = (e) => e.map(shiftFrom16Bit).flatMap((e) => e);

const download = function (downloadUrl, useCache) {
  return new Promise((resolve, reject) => {
    const basename = downloadUrl.split("/").reverse()[0];
    const cacheDir = app.getPath("userData");
    let dest = path.join(cacheDir, basename);
    dest = dest.replace("?", "-");
    if (useCache && checkFileExistsAndValid(dest)) {
      resolve(dest);
      return;
    }
    console.log(`Downloading ${downloadUrl} to ${dest}`);

    const file = fs.createWriteStream(dest);
    const req = https.get(
      downloadUrl,
      {
        headers: {
          "Cache-Control":
            "private, no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
        timeout: 4000,
      },
      function (response) {
        response.pipe(file);
        file.on("finish", function () {
          file.close(resolve(dest));
        });
      }
    );
    req.on("error", (error) => {
      console.log("Downloading error" + error);
      if (checkFileExistsAndValid(dest)) {
        console.log("Downloading fail use local config" + dest);
        resolve(dest);
      } else {
        resolve(false);
      }
    });
    req.end();
  });
};

const fetchRemoteConfig = async function (file, useCache = false) {
  const dest = await download(`https://d.lelelab.work/${file}`, useCache);
  if (dest) {
    let data = fs.readFileSync(dest, "utf8");
    if (data) {
      try {
        // return JSON.parse(data);
      } catch (error) {
        console.error("fetchRemoteConfig", error);
        fs.unlinkSync(dest); 
      }
    }
  }
  let defaultConf = path.join(__static, file.split("?")[0]);
  if (checkFileExistsAndValid(defaultConf)) {
    defaultConf = JSON.parse(fs.readFileSync(defaultConf, "utf8"));
    if (defaultConf) return defaultConf;
  }
  return null;
};

const checkFileExistsAndValid = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.isFile() && stats.size > 100) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const getEventKeycode = function (code) {
  const map = {
    Digit1: "KC_1",
    Digit2: "KC_2",
    Digit3: "KC_3",
    Digit4: "KC_4",
    Digit5: "KC_5",
    Digit6: "KC_6",
    Digit7: "KC_7",
    Digit8: "KC_8",
    Digit9: "KC_9",
    Digit0: "KC_0",
    KeyA: "KC_A",
    KeyB: "KC_B",
    KeyC: "KC_C",
    KeyD: "KC_D",
    KeyE: "KC_E",
    KeyF: "KC_F",
    KeyG: "KC_G",
    KeyH: "KC_H",
    KeyI: "KC_I",
    KeyJ: "KC_J",
    KeyK: "KC_K",
    KeyL: "KC_L",
    KeyM: "KC_M",
    KeyN: "KC_N",
    KeyO: "KC_O",
    KeyP: "KC_P",
    KeyQ: "KC_Q",
    KeyR: "KC_R",
    KeyS: "KC_S",
    KeyT: "KC_T",
    KeyU: "KC_U",
    KeyV: "KC_V",
    KeyW: "KC_W",
    KeyX: "KC_X",
    KeyY: "KC_Y",
    KeyZ: "KC_Z",
    Comma: "KC_COMM",
    Period: "KC_DOT",
    Semicolon: "KC_SCLN",
    Quote: "KC_QUOT",
    BracketLeft: "KC_LBRC",
    BracketRight: "KC_RBRC",
    Backquote: "KC_GRV",
    Slash: "KC_SLSH",
    Backspace: "KC_BSPC",
    Backslash: "KC_BSLS",
    Minus: "KC_MINS",
    Equal: "KC_EQL",
    IntlRo: "KC_RO",
    IntlYen: "KC_JYEN",
    AltLeft: "KC_LALT",
    AltRight: "KC_RALT",
    CapsLock: "KC_CAPS",
    ControlLeft: "KC_LCTL",
    ControlRight: "KC_RCTL",
    MetaLeft: "KC_LGUI",
    MetaRight: "KC_RGUI",
    OSLeft: "KC_LGUI",
    OSRight: "KC_RGUI",
    ShiftLeft: "KC_LSFT",
    ShiftRight: "KC_RSFT",
    ContextMenu: "KC_APP",
    Apps: "KC_APP",
    Enter: "KC_ENT",
    Space: "KC_SPC",
    Tab: "KC_TAB",
    Delete: "KC_DEL",
    End: "KC_END",
    Help: "KC_HELP",
    Home: "KC_HOME",
    Insert: "KC_INS",
    PageDown: "KC_PGDN",
    PageUp: "KC_PGUP",
    ArrowDown: "KC_DOWN",
    ArrowLeft: "KC_LEFT",
    ArrowRight: "KC_RGHT",
    ArrowUp: "KC_UP",
    Escape: "KC_ESC",
    PrintScreen: "KC_PSCR",
    ScrollLock: "KC_SLCK",
    Pause: "KC_PAUS",
    F1: "KC_F1",
    F2: "KC_F2",
    F3: "KC_F3",
    F4: "KC_F4",
    F5: "KC_F5",
    F6: "KC_F6",
    F7: "KC_F7",
    F8: "KC_F8",
    F9: "KC_F9",
    F10: "KC_F10",
    F11: "KC_F11",
    F12: "KC_F12",
    F13: "KC_F13",
    F14: "KC_F14",
    F15: "KC_F15",
    F16: "KC_F16",
    F17: "KC_F17",
    F18: "KC_F18",
    F19: "KC_F19",
    F20: "KC_F20",
    F21: "KC_F21",
    F22: "KC_F22",
    F23: "KC_F23",
    F24: "KC_F24",
    NumLock: "KC_NLCK",
    Numpad0: "KC_P0",
    Numpad1: "KC_P1",
    Numpad2: "KC_P2",
    Numpad3: "KC_P3",
    Numpad4: "KC_P4",
    Numpad5: "KC_P5",
    Numpad6: "KC_P6",
    Numpad7: "KC_P7",
    Numpad8: "KC_P8",
    Numpad9: "KC_P9",
    NumpadAdd: "KC_PPLS",
    NumpadComma: "KC_COMM",
    NumpadDecimal: "KC_PDOT",
    NumpadDivide: "KC_PSLS",
    NumpadEnter: "KC_PENT",
    NumpadEqual: "KC_PEQL",
    NumpadMultiply: "KC_PAST",
    NumpadSubtract: "KC_PMNS",
  };
  if (map[code]) {
    return map[code];
  }
  console.log("Unreacheable keydown code", code);
};

const parseConfigFile = function (file) {
  return new Promise((r, j) => {
    if (!file.name.endsWith(".json")) {
      return j("invalid config file");
    }

    var reader = new FileReader();
    reader.onload = (e) => {
      var contents = e.target.result;
      const device = JSON.parse(contents);
      console.log("parseConfigFile", device);
      if (
        !device.name ||
        !device.vendorId ||
        !device.productId ||
        !device.lighting ||
        !device.matrix ||
        !device.layouts
      ) {
        return j("invalid config file");
      }
      device.layouts = Array.isArray(device.layouts)
        ? device.layouts
        : [Object.assign({ name: "default" }, device.layouts)];
      r(device);
    };
    reader.onerror = (e) => {
      j("invalid config file");
    };
    reader.readAsText(file);
  });
};

const checkDfuPort = async function (no, beforeCall) {
  let beforePorts = await SerialPort.list();
  beforePorts = beforePorts.map((p) => p.path);
  await beforeCall();
  return new Promise(function (r, j) {
    let timer = null;
    let cnt = 0;
    let detectPort = (serialNumber) => {
      const check = async function () {
        console.log("detectAndFlash", serialNumber);
        clearTimeout(timer);
        cnt++;
        if (cnt > 50) return j("timeout");
        const ports = await SerialPort.list();
        console.log(
          "SerialPort serialNumber:",
          ports.map((p) => p.serialNumber)
        );
        let port = ports.find(
          (p) => p.serialNumber && p.serialNumber === serialNumber
        );
        if (port) return r(port);

        console.log("checkDfuPort", beforePorts, ports);
        port = ports.find(
          (p) =>
            beforePorts.indexOf(p.path) === -1 &&
            parseInt(p.vendorId) == 1915 &&
            p.productId.toLowerCase() == "521f"
        );
        if (port) return r(port);
        timer = setTimeout(check, 2000);
      };
      check();
    };
    detectPort(no);
  });
};

let supportDeviceList;
const supportDeviceInfo = (device) => {
  if (!device || !device.vendorId || !device.productId) return null;

  const { vendorId, productId, product } = device;
  const matchedDevices = supportDeviceList.filter(
    (d) =>
      parseInt(vendorId) === parseInt(d.vendor_id) &&
      parseInt(productId) === parseInt(d.product_id)
  );
  const fullMatch = matchedDevices.find((d) => d.name === product);

  return fullMatch || matchedDevices[0] || null;
};

const trimArray = function (arr) {
  let endIndex = arr.length;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== 0) {
      endIndex = i + 1;
      break;
    }
  }
  return arr.slice(0, endIndex);
};

export {
  hexId,
  hs2Hex,
  shiftBufferFrom16Bit,
  shiftFrom16Bit,
  shiftTo16Bit,
  decodeBuffer,
  encodeBuffer,
  keymapKey,
  getKeyCode,
  getKeyName,
  getKeyByte,
  isValidMacroKey,
  macroExpressCheck,
  getEventKeycode,
  parseConfigFile,
  fetchRemoteConfig,
  download,
  checkDfuPort,
  supportDeviceInfo,
  parseModTapKey,
  concatTypedArrays,
  trimArray
};
