import { app } from "../main.js";
import KbSerial from "@/utils/kb-serial";
import {
  CmdId,
  KbValueId,
  DongleValueId,
  DongleSlaveValueId,
} from "./kb-const.js";
import {
  LightingValue,
  LightingPreset,
  LightingTypeDefinition,
} from "../config/lighting-presets";
import {
  shiftTo16Bit,
  getKeyByte,
  shiftBufferFrom16Bit,
  shiftFrom16Bit,
  macroExpressCheck,
  getKeyCode,
  decodeBuffer,
  download,
  trimArray,
} from "./kb-helper.js";
import { isArray } from "lodash";

const LayoutOpt = function (e) {
  return (
    1 +
    Array(5)
      .fill(0)
      .findIndex((t, n) => {
        return 2 << n >= e;
      })
  );
};
const MacroType = {
  Tap: 1,
  Down: 2,
  Up: 3,
};
function queueWrap(context, call) {
  return new Promise(function (resolve, rej) {
    function handle(job) {
      if (job.done) {
        resolve(job.value);
      } else {
        job.value.then((result) => {
          handle(call.next(result));
        });
      }
    }
    handle((call = call.apply(context, [])).next());
  });
}

class HidDevice {
  constructor(info) {
    return (() => {
      info.id = `${info.vendorId}-${info.productId}-${info.path}`;
      this.info =  Object.assign({
        layout: null,
        lightPreset: null,
        layer_cnt: 4,
        uptime: 0,
        macro_count: 16,
        battery_status: null,
        layout_options: null
      }, info);
      try {
        const HID = require("node-hid");
        this.hid = new HID.HID(info.path);
      } catch (e) {
        console.error(e);
        throw "HID device open failed";
      }
     
      this.events = [];
      this.slaveDeviceCheckTimer = null;
      this.cmdQueue = {
        flushing: false,
        stack: [],
        lightValue: {
          flushing: false,
          props: {},
        },
        kbValue: {
          flushing: false,
          props: {},
        },
      };
      this.activeSlave = null;
      this.slaveDevices = [];
      return this;
    })();
  }

  async fetchDeviceBaseInfo() {
    if (this.info.isHub) {
      const slaveCheckTimer = async () => {
        clearTimeout(this.slaveDeviceCheckTimer);
        let [slave_map] = await this.getDongleValue(DongleValueId.slave_map);
        if (this.slave_map === undefined) {
          this.slave_map = slave_map;
        }
        console.log("slaveCheckTimer slave_map ", this.slave_map,  slave_map);
        if (this.slave_map && slave_map !== this.slave_map) {
          console.log('dongleSlaveChange');
          this.emit("dongleSlaveChange", [
            this.getDeviceInfo("vendorId"),
            this.getDeviceInfo("productId")
          ]);
        } else {         this.slaveDeviceCheckTimer = setTimeout(
            () => slaveCheckTimer(),
            4000
          );
        }
      };
      setTimeout(() => slaveCheckTimer(), 4000);
      return;
    }
    this.readViaDeviceInfo(this.info);
    this.checkFirmwareUpgrade();
  }

  isCurrDevice(sid) {
    if (!app.deviceCon.currDevice) return false;
    return (
      (sid ? sid : this.info.id) ===
      app.deviceCon.currDevice.getDeviceInfo("id")
    );
  }

  on(name, cb) {
    (this.events[name] || (this.events[name] = [])).push(cb);
  }

  emit(name, args) {
    (this.events[name] || []).forEach((fn) => fn(...args));
  }

  async checkFirmwareUpgrade() {
    console.log('checkFirmwareUpgrade', this.info.firmware_version, this.info.firmware_file )
    const currVer = parseInt(this.info.release);
    if (
      !this.info.firmware_version ||
      !this.info.firmware_file ||
      currVer >= parseInt(this.info.firmware_version)
    ) {
      return;
    }
    console.log('checkFirmwareUpgrade', currVer )
    const dest = await download(
      `https://d.lelelab.work/${this.info.firmware_file}`,
      true
    );
    if (!dest) return;

    this.info.firmware_path = dest;
  }

  getLayerCount(protocolVer) {
    return queueWrap(this, function* () {
      if (protocolVer >= 8) {
        const [, e] = yield this.hidCommand(
          CmdId.dynamic_keymap_get_layer_count
        );
        console.log("getLayerCount", e);
        return e;
      }
      if (protocolVer === 7) return 4;
    });
  }

  getBatteryStatus() {
    return queueWrap(this, function* () {
      if (this.info.isHub && !this.activeSlave) return null;
      const [, , b2, b3, b4] = yield this.hidCommand(CmdId.get_keyboard_value, [
        KbValueId.id_battery_status,
      ]);
      if (b2 == 0) {
        return null;
      }
      return {
        percent: Math.max(0, Math.min(b3, 100)),
        charging: {
          enable: b2 & 2 ? 1 : 0,
          charge: b4,
        },
      };
    });
  }

  getUpTime() {
    return queueWrap(this, function* () {
      const [, , b2, b3, b4, b5] = yield this.hidCommand(
        CmdId.get_keyboard_value,
        [KbValueId.id_uptime]
      );

      let v = (b2 << 24) | (b3 << 16) | (b4 << 8) | b5;

      console.log("getUpTime", v);
      return v;
    });
  }

  getProtocolVersion() {
    console.log("getProtocolVersion");
    return queueWrap(this, function* () {
      const [, e, t] = yield this.hidCommand(CmdId.get_protocol_version);
      const val = shiftTo16Bit(e, t);
      console.log("getProtocolVersion", val);
      return val;
    });
  }

  async getDongleSlaveList() {
    let [slave_map] = await this.getDongleValue(DongleValueId.slave_map);
    if (slave_map < 1) return [];
    let slaveDevices = [];
    for (let i = 0; Math.pow(2, i) <= slave_map; i++) {
      await this.setDongleValue(DongleValueId.curr_slave, Math.pow(2, i));
      let slave = await this.getDongleSlaveDeviceInfo();
      if (slave) {
        slave.id = Math.pow(2, i);
        slave.isSlave = 1;
        slave.is24G = true;
        slaveDevices.push(slave);
      }
    }
    console.log("slaveDevices", slaveDevices);
    return slaveDevices;
  }

  async getDongleSlaveDeviceInfo() {
    console.log("getDongleSlaveDeviceInfo");
    const pidvid = await this.getSlavePidVid();
    const ver = await this.getSlaveValue(DongleSlaveValueId.fw_ver, 4);
    const devices = await app.deviceCon.initHidDeviceInfo([
      { vendorId: pidvid[1], productId: pidvid[0], interface: 1 },
    ]);
    console.log("getDongleSlaveDevice", devices);
    if (!devices.length) return false;

    return Object.assign(
      {
        release: parseInt(`0x${ver[0]}${ver[1]}${ver[2]}${ver[3]}`),
        productId: pidvid[0],
        vendorId: pidvid[1],
      },
      devices[0]
    );
  }

  getSlavePidVid() {
    return queueWrap(this, function* () {
      const [, , b2, b3, b4, b5] = yield this.hidCommand(
        CmdId.dongle_get_slave_usb_val,
        [DongleSlaveValueId.vidpid]
      );
      return [(b3 << 8) + b2, (b5 << 8) + b4];
    });
  }

  getSlaveValue(e, t = 1) {
    return queueWrap(this, function* () {
      return (yield this.hidCommand(CmdId.dongle_get_slave_usb_val, [e])).slice(
        2,
        2 + t
      );
    });
  }

  async changeActiveSlave(slave) {
    console.log("changeActiveSlave", slave);
    if (!slave) return (this.activeSlave = null);

    this.activeSlave = Object.assign({
      layout: null,
      lightPreset: null,
      layer_cnt: 4,
      uptime: 0,
      macro_count: 16,
      battery_status: null,
      layout_options: null,
    }, slave);
    this.readViaDeviceInfo(this.activeSlave);
  }

  async readViaDeviceInfo(deviceInfo) {
    let layout_options = [];
    const layouts = this.getDeviceInfo("layouts");
    if (layouts && layouts[0].labels) {
      const bytes = await this.getKeyboardValue(KbValueId.id_layout_options, 4);
      layout_options = this.parseLayoutBytes(bytes);
    }

   
    const keycodes = this.getDeviceInfo("keycodes");
    const lighting = this.getDeviceInfo("lighting");
    let lightPreset = LightingPreset[lighting]
      ? LightingPreset[lighting]
      : false;
    if (
      !lightPreset &&
      keycodes &&
      keycodes.find((e) => e === "via/wt_lighting")
    ) {
      lightPreset = LightingPreset[LightingTypeDefinition.WTRGBBacklight];
    }
    Object.assign(deviceInfo, {
      layout: layouts[0],
      lightPreset: lightPreset,
      uptime: await this.getUpTime(),
      macro_count: await this.getMacroCount(),
      battery_status: await this.getBatteryStatus(),
      layout_options: layout_options,
    });
  }

  async importConfig(config) {
    this.setKeyboardValue(
      KbValueId.id_layout_options,
      ...config.layout_options.data
    );
    this.writeMacroExpressions([...config.macros]);
    if (config.light) {
      for (let k of Object.keys(config.light)) {
        await this.hidCommand(
          CmdId.lighting_set_value,
          config.light[k]["data"].slice(1, 8)
        );
      }
    }

    const matrix = this.getDeviceInfo("matrix");
    const layer_cnt = this.getDeviceInfo("layer_cnt");
    let cols = matrix.cols;
    for (let layer = 0; layer < layer_cnt; layer++) {
      let keys = config.keymap[layer];
      const data = await this.fastReadRawMatrix(matrix, layer);
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let [row, col] = key.posi.split(",").map(Number);
        let oldCode = data[row * cols + col];
        let target = keys.filter((e) => e.posi === key.posi);
        if (target.length && target[0].byte !== oldCode) {
          console.log(
            `reset  ${key.posi} keycode ${oldCode} ${target[0].byte}`
          );
          await this.setKey(layer, row, col, target[0].byte);
        }
      }
    }

    return true;
  }

  async dumpConfig() {
    let config = {};
    config.product = this.getDeviceInfo("product");
    config.productId = this.getDeviceInfo("productId");
    config.vendorId = this.getDeviceInfo("vendorId");
    config.macros = await this.readMacroExpressions();
    config.layout_options = await this.getKeyboardValue(
      KbValueId.id_layout_options,
      4
    );
    const options = this.parseLayoutBytes(config.layout_options);
    const lighting = this.getDeviceInfo("lighting");
    const lightPreset = this.getDeviceInfo("lightPreset");
    if (lighting && lightPreset) {
      let lightConf = {};
      for (let k of Object.keys(LightingValue)) {
        console.log(typeof LightingValue[k]);
        if (typeof LightingValue[k] == "object") {
          for (let sk of Object.keys(LightingValue[k])) {
            console.log("lighting_get_value", sk);
            lightConf[sk] = await this.hidCommand(CmdId.lighting_get_value, [
              LightingValue[k][sk],
            ]);
          }
        } else {
          console.log("lighting_get_value", k);
          lightConf[k] = await this.hidCommand(CmdId.lighting_get_value, [
            LightingValue[k],
          ]);
        }
      }
      config.light = lightConf;
    }

    const layout = this.getDeviceInfo("layout");
    let keys = KbSerial.deserialize(layout.keymap, options);
    let keymap = {};
    const matrix = this.getDeviceInfo("matrix");
    const layer_cnt = this.getDeviceInfo("layer_cnt");
    let cols = matrix.cols;
    for (let layer = 0; layer < layer_cnt; layer++) {
      const data = await this.fastReadRawMatrix(matrix, layer);
      const map = keys.map((key, i) => {
        let [row, col] = key.posi.split(",").map(Number);
        return {
          posi: key.posi,
          byte: data[row * cols + col],
        };
      });
      keymap[layer] = map;
    }
    config.keymap = keymap;
    return config;
  }

  getAllLightConfig() {
    return queueWrap(this, function* () {
      const [, , backlightBrightness] = yield this.hidCommand(
        CmdId.lighting_get_value,
        [LightingValue.BACKLIGHT_BRIGHTNESS]
      );
      const [, , backlightEffect] = yield this.hidCommand(
        CmdId.lighting_get_value,
        [LightingValue.BACKLIGHT_EFFECT]
      );
      const [, , backlightSpeed] = yield this.hidCommand(
        CmdId.lighting_get_value,
        [LightingValue.BACKLIGHT_EFFECT_SPEED]
      );

      let lightProps = {
        backlightBrightness: backlightBrightness,
        backlightEffect: backlightEffect,
        backlightSpeed: backlightSpeed,
        color1: yield this.getColor(LightingValue.BACKLIGHT_COLOR_1),
        color2: yield this.getColor(LightingValue.BACKLIGHT_COLOR_2),
      };
      if (this.info.lighting === LightingTypeDefinition.QMKRGBLight) {
        const [, , qmkLightBrightness] = yield this.hidCommand(
          CmdId.lighting_get_value,
          [LightingValue.QMK_RGBLIGHT_BRIGHTNESS]
        );
        const [, , qmkLightEffect] = yield this.hidCommand(
          CmdId.lighting_get_value,
          [LightingValue.QMK_RGBLIGHT_EFFECT]
        );
        const [, , qmkLightSpeed] = yield this.hidCommand(
          CmdId.lighting_get_value,
          [LightingValue.QMK_RGBLIGHT_EFFECT_SPEED]
        );
        Object.assign(lightProps, {
          qmkLightBrightness: qmkLightBrightness,
          qmkLightEffect: qmkLightEffect,
          qmkLightSpeed: qmkLightSpeed,
          qmkColor: yield this.getColor(LightingValue.QMK_RGBLIGHT_COLOR),
        });
      }
      return lightProps;
    });
  }

  getLelepwmConfig() {
    return queueWrap(this, function* () {
      const [, , side_effect] = yield this.hidCommand(
        CmdId.lighting_get_value,
        [LightingValue.LELE_PWM.SIDE.EFFECT]
      );
      let t = yield this.hidCommand(CmdId.lighting_get_value, [
        LightingValue.LELE_PWM.SIDE.BRIGHTNESS,
      ]);

      const side_brightness = shiftTo16Bit(t[2], t[3]);
      t = yield this.hidCommand(CmdId.lighting_get_value, [
        LightingValue.LELE_PWM.SIDE.SPEED,
      ]);
      const side_speed = shiftTo16Bit(t[2], t[3]);

      const [, , bottom_effect] = yield this.hidCommand(
        CmdId.lighting_get_value,
        [LightingValue.LELE_PWM.BOTTOM.EFFECT]
      );
      t = yield this.hidCommand(CmdId.lighting_get_value, [
        LightingValue.LELE_PWM.BOTTOM.BRIGHTNESS,
      ]);
      const bottom_bright = shiftTo16Bit(t[2], t[3]);
      t = yield this.hidCommand(CmdId.lighting_get_value, [
        LightingValue.LELE_PWM.BOTTOM.SPEED,
      ]);
      const bottom_speed = shiftTo16Bit(t[2], t[3]);

      return {
        side: {
          effect: side_effect,
          brightness: side_brightness,
          effect_speed: side_speed,
        },
        bottom: {
          effect: bottom_effect,
          brightness: bottom_bright,

          effect_speed: bottom_speed,
        },
      };
    });
  }

  getMinibarLightConfig() {
    return queueWrap(this, function* () {
      const [, , brightness] = yield this.hidCommand(CmdId.lighting_get_value, [
        LightingValue.LELE_MINIBAR.BRIGHTNESS,
      ]);

      const [, , effect] = yield this.hidCommand(CmdId.lighting_get_value, [
        LightingValue.LELE_MINIBAR.EFFECT,
      ]);
      const [, , effect_speed] = yield this.hidCommand(
        CmdId.lighting_get_value,
        [LightingValue.LELE_MINIBAR.EFFECT_SPEED]
      );
      return {
        brightness: brightness,
        effect: effect,
        effect_speed: effect_speed,
        color1: yield this.getColor(LightingValue.LELE_MINIBAR.COLOR_1),
        color2: yield this.getColor(LightingValue.LELE_MINIBAR.COLOR_2),
      };
    });
  }

  getDeviceInfo(attr) {
    return this.activeSlave
      ? this.activeSlave[attr]
        ? this.activeSlave[attr]
        : this.info[attr]
      : this.info[attr];
  }

  setDeviceInfo(attr, v) {
    if (this.activeSlave) {
      this.activeSlave[attr] = v;
    } else {
      this.info[attr] = v;
    }
  }

  parseLayoutBytes(option) {
    const layouts = this.getDeviceInfo("layouts");
    if (!layouts || !layouts[0].labels) {
      return [];
    }
    const parse = (e) =>
      ((e[0] << 24) | (e[1] << 16) | (e[2] << 8) | e[3]) >>> 0;

    let bits = parse(option);
    const labels = layouts[0].labels;
    const flag = labels
      .map((e) => (Array.isArray(e) ? e.slice(1).length : 2))
      .reverse()
      .reduce(
        ({ res, bits }, n) => {
          return {
            bits: bits >> LayoutOpt(n),
            res: [bits & ((1 << LayoutOpt(n)) - 1), ...res],
          };
        },
        {
          bits,
          res: [],
        }
      ).res;

    console.log("parseLayoutBytes", flag);
    return labels.map((label, i) => {
      if (typeof label === "string") {
        return {
          name: label,
          active: flag[i] ? true : false,
        };
      } else {
        return {
          name: label[0],
          values: label.slice(1),
          active: flag[i],
        };
      }
    });
  }

  setLayoutOption(values) {
    const labels = this.getDeviceInfo("layouts")[0].labels;
    const conf = labels.map((e) => (Array.isArray(e) ? e.slice(1).length : 2));
    const options = values.map((e, t) => [e, conf[t]]);
    console.log("options", options);

    const flag =
      options.reduce((e, [t, n]) => (e << LayoutOpt(n)) | t, 0) >>> 0;
    const bytes = [flag >> 24, flag >> 16, flag >> 8, flag].map((e) => 255 & e);
    console.log("bytes", bytes);

    return queueWrap(this, function* () {
      yield this.setKeyboardValue(KbValueId.id_layout_options, ...bytes);

      const newValue = yield this.getKeyboardValue(
        KbValueId.id_layout_options,
        4
      );
      return this.parseLayoutBytes(newValue);
    });
  }

  getKeymapBuffer(e, t) {
    return queueWrap(this, function* () {
      if (t > 28) throw "Max data length is 28.";
      return [
        ...(yield this.hidCommand(CmdId.dynamic_keymap_get_buffer, [
          ...shiftFrom16Bit(e),
          t,
        ])),
      ].slice(4, t + 4);
    });
  }

  setKey(layer, row, col, val) {
    return queueWrap(this, function* () {
      const r = yield this.hidCommand(CmdId.dynamic_keymap_set_keycode, [
        layer,
        row,
        col,
        ...shiftFrom16Bit(val),
      ]);
      return shiftTo16Bit(r[4], r[5]);
    });
  }

  async fastWriteRawMatrix(data, writeOffset) {
    console.log("fastWriteRawMatrix", writeOffset, data);
    const shiftedData = shiftBufferFrom16Bit(data);
    const bufferSize = 28;
    for (let offset = 0; offset < shiftedData.length; offset += bufferSize) {
      const buffer = shiftedData.slice(offset, offset + bufferSize);
      await this.hidCommand(CmdId.dynamic_keymap_set_buffer, [
        ...shiftFrom16Bit(offset + writeOffset),
        buffer.length,
        ...buffer,
      ]);
    }
  }

  fastReadRawMatrix({ rows, cols }, n) {
    return queueWrap(this, function* () {
      const o = rows * cols,
        r = new Array(Math.ceil(o / 14)).fill(0),
        { res: a } = r.reduce(
          ({ res, remaining }) =>
            remaining < 14
              ? {
                  res: [
                    ...res,
                    this.getKeymapBuffer(
                      n * o * 2 + 2 * (o - remaining),
                      2 * remaining
                    ),
                  ],
                  remaining: 0,
                }
              : {
                  res: [
                    ...res,
                    this.getKeymapBuffer(n * o * 2 + 2 * (o - remaining), 28),
                  ],
                  remaining: remaining - 14,
                },
          {
            res: [],
            remaining: o,
          }
        );
      return (yield Promise.all(a)).flatMap(decodeBuffer);
    });
  }

  getKey(e, t, n) {
    return queueWrap(this, function* () {
      const o = yield this.hidCommand(CmdId.dynamic_keymap_get_keycode, [
        e,
        t,
        n,
      ]);
      return shiftTo16Bit(o[4], o[5]);
    });
  }

  getDongleValue(e, t = 1) {
    return queueWrap(this, function* () {
      return (yield this.hidCommand(CmdId.dongle_get_value, [e])).slice(
        2,
        2 + t
      );
    });
  }

  setDongleValue(e, ...t) {
    return queueWrap(this, function* () {
      const n = [e, ...t];
      yield this.hidCommand(CmdId.dongle_set_value, n);
    });
  }

  getKeyboardCustomValue(e) {
    return queueWrap(this, function* () {
      return (yield this.hidCommand(CmdId.get_custom_value, [0, e])).slice(
        2,
        30
      );
    });
  }

  setKeyboardCustomValue(n) {
    return queueWrap(this, function* () {
      yield this.hidCommand(CmdId.set_custom_value, n);
    });
  }

  sendRowData(cmd, n) {
    return queueWrap(this, function* () {
      return (yield this.hidCommand(cmd, n)).slice(
        3,
        30
      );
    });
  }



  getKeyboardValue(e, t = 1) {
    return queueWrap(this, function* () {
      return (yield this.hidCommand(CmdId.get_keyboard_value, [e])).slice(
        2,
        2 + t
      );
    });
  }

  debounceSetKbValue(k, v) {
    if (this.cmdQueue.kbValue.props[k] === v) return;
    this.cmdQueue.kbValue.props[k] = v;
    this.flushingKeyboardValueUpdate();
  }

  async flushingKeyboardValueUpdate() {
    if (this.cmdQueue.kbValue.flushing) return;

    let props = Object.keys(this.cmdQueue.kbValue.props);
    if (!props.length) return;

    this.cmdQueue.kbValue.flushing = true;

    let prop = props.shift();
    let v = this.cmdQueue.kbValue.props[prop];
    await this.setKeyboardValue(parseInt(prop), parseInt(v));
    if (this.cmdQueue.kbValue.props[prop] === v) {
      delete this.cmdQueue.kbValue.props[prop];
    }
    this.cmdQueue.kbValue.flushing = false;
    this.flushingLightValueUpdate();
  }

  setKeyboardValue(k, v) {
    return queueWrap(this, function* () {
      const twoBit =
        [KbValueId.matrix_scan_freq, KbValueId.auto_sleep_sec].indexOf(k) > -1;
      let t;
      console.log(
        "setKeyboardValue",
        k,
        v,
        KbValueId.matrix_scan_freq,
        KbValueId.auto_sleep_sec,
        ...shiftFrom16Bit(v)
      );
      if (twoBit) {
        t = [k, ...shiftFrom16Bit(v)];
      } else {
        t = [k, v];
      }
      yield this.hidCommand(CmdId.set_keyboard_value, t);
    });
  }

  getColor(e) {
    return queueWrap(this, function* () {
      const t = [e],
        [, , n, o] = yield this.hidCommand(CmdId.lighting_get_value, t);
      return {
        hue: Math.floor((n / 255) * 360),
        sat: o,
      };
    });
  }

  debounceSetLightValue(k, ...n) {
    let v = [...n];
    console.log('debounceSetLightValue', k, v);
    if (JSON.stringify(this.cmdQueue.lightValue.props[k]) === JSON.stringify(v)) return;
    this.cmdQueue.lightValue.props[k] = v;
    this.flushingLightValueUpdate();
  }

  async flushingLightValueUpdate() {
    if (this.cmdQueue.lightValue.flushing) return;

    let props = Object.keys(this.cmdQueue.lightValue.props);
    if (!props.length) {
      await this.hidCommand(CmdId.lighting_save);
      return;
    }

    this.cmdQueue.lightValue.flushing = true;

    let prop = props.shift();
    let v = this.cmdQueue.lightValue.props[prop];

    await this.setLightValue(parseInt(prop), v);
    console.log(JSON.stringify(this.cmdQueue.lightValue.props[prop]) === JSON.stringify(v), JSON.stringify(this.cmdQueue.lightValue.props[prop]), JSON.stringify(v))
    if (JSON.stringify(this.cmdQueue.lightValue.props[prop]) === JSON.stringify(v)) {
      delete this.cmdQueue.lightValue.props[prop];
    }
    this.cmdQueue.lightValue.flushing = false;
    this.flushingLightValueUpdate();
  }

  setLightValue(k, v) {
    return queueWrap(this, function* () {
      const twoBit =
        [
          LightingValue.LELE_PWM.SIDE.BRIGHTNESS,
          LightingValue.LELE_PWM.SIDE.SPEED,
          LightingValue.LELE_PWM.BOTTOM.BRIGHTNESS,
          LightingValue.LELE_PWM.BOTTOM.SPEED,
        ].indexOf(k) > -1;
      let t;
      if (twoBit) {
        t = [k, ...shiftFrom16Bit(v)];
      } else if (isArray(v)) {
        t = [k, ...v];
      } else {
        t = [k, v];
      }
      yield this.hidCommand(CmdId.lighting_set_value, t);
    });
  }

  resetEEPROM() {
    return queueWrap(this, function* () {
      yield this.hidCommand(CmdId.eeprom_reset);
    });
  }

  jumpToBootloader() {
    return queueWrap(this, function* () {
      yield this.hidCommand(CmdId.bootloader_jump);
    });
  }

  dongleJumpToBootloader() {
    console.log("dongleJumpToBootloader");
    return queueWrap(this, function* () {
      yield this.hidCommand(CmdId.dongle_bootloader_jump);
    });
  }

  getMacroCount() {
    return queueWrap(this, function* () {
      const [, e] = yield this.hidCommand(CmdId.dynamic_keymap_macro_get_count);
      console.log("getMacroCount", e);
      return e;
    });
  }

  getMacroBytes() {
    return queueWrap(this, function* () {
      const e = yield this.getMacroBufferSize();
      let t = [];
      for (let n = 0; n < e; n += 28) {
        const [, , , , ...e] = yield this.hidCommand(
          CmdId.dynamic_keymap_macro_get_buffer,
          [...shiftFrom16Bit(n), 28]
        );
        t.push(...e);
      }
      return t;
    });
  }

  getMacroBufferSize() {
    return queueWrap(this, function* () {
      const [, e, t] = yield this.hidCommand(
        CmdId.dynamic_keymap_macro_get_buffer_size
      );
      return shiftTo16Bit(e, t);
    });
  }

  readMacroExpressions() {
    return queueWrap(this, function* () {
      const e = yield this.getMacroBytes(),
        macroCnt = this.getDeviceInfo("macro_count");
      let r = 0,
        c = [],
        K = [],
        s = [];
      for (let n = 0; r < e.length && n < macroCnt; ) {
        let t = e[r];
        switch (t) {
          case 0:
            (c[n] = K.join("")), n++, (K = []);
            break;
          case MacroType.Tap:
            (t = e[++r]), K.push(`{${getKeyCode(t)}}`);
            break;
          case MacroType.Down:
            (t = e[++r]), s.push(getKeyCode(t));
            break;
          case MacroType.Up:
            for (; e[r + 2] === 3 && r < e.length; ) r += 2;
            K.push(`{${s.join(",")}}`), (s = []), r++;
            break;
          default:
            const l = String.fromCharCode(t);
            "{" === l && K.push("\\"), K.push(l);
        }
        r++;
      }
      return c;
    });
  }
  writeMacroExpressions(expressions) {
    return queueWrap(this, function* () {
      const t = expressions.flatMap((e) => {
        const t = macroExpressCheck(e);
        if (t !== true) throw t;
        console.log("writeMacroExpressions");
        let n = [],
          r = 0;
        for (; r < e.length; ) {
          const t = e[r];
          if ("{" === t && "\\" !== e[r - 1]) {
            const t = e.indexOf("}", r + 1);
            if (t < 0) throw "Syntax error: KeyAction block must end with '}'";
            const a = e
              .substr(r + 1, t - r - 1)
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e.length);
            switch (a.length) {
              case 0:
                throw "Syntax error: Keycodes expected within block. Use \\{} to define literal {}";
              case 1:
                n.push(MacroType.Tap), n.push(getKeyByte(a[0]));
                break;
              default:
                a.forEach((e) => {
                  n.push(MacroType.Down), n.push(getKeyByte(e));
                }),
                  a.reverse().forEach((e) => {
                    n.push(MacroType.Up), n.push(getKeyByte(e));
                  });
            }
            r = t;
          } else {
            ("\\" === t && "{" === e[r + 1]) || n.push(t.charCodeAt(0));
          }
          r++;
        }
        return n.push(0), n;
      });
      yield this.setMacroBytes(t);
      console.log("writeMacroExpressions done");
    });
  }

  setMacroBytes(e) {
    return queueWrap(this, function* () {
      const t = yield this.getMacroBufferSize(),
        n = e.length;
      if (n > t)
        throw new Error(`Macro size (${n}) exceeds buffer size (${t})`);
      const o = t - 1,
        r = shiftFrom16Bit(o);
      yield this.resetMacros();
      try {
        yield this.hidCommand(CmdId.dynamic_keymap_macro_set_buffer, [
          ...shiftFrom16Bit(o),
          1,
          255,
        ]);
        const t = 28;
        for (let n = 0; n < e.length; n += t) {
          const o = e.slice(n, n + t);
          yield this.hidCommand(CmdId.dynamic_keymap_macro_set_buffer, [
            ...shiftFrom16Bit(n),
            o.length,
            ...o,
          ]);
        }
      } finally {
        yield this.hidCommand(CmdId.dynamic_keymap_macro_set_buffer, [
          ...r,
          1,
          0,
        ]);
      }
    });
  }

  resetMacros() {
    return queueWrap(this, function* () {
      yield this.hidCommand(CmdId.dynamic_keymap_macro_reset);
    });
  }

  hidCommand(e, t = []) {
    return queueWrap(this, function* () {
      return new Promise((res, rej) =>
        queueWrap(this, function* () {
          this.cmdQueue.stack.push({
            res,
            rej,
            args: [e, t],
          });
          this.cmdQueue.flushing || this.flushQueue();
        })
      );
    });
  }

  getByteBuffer() {
    return queueWrap(this, function* () {
      return new Promise((r, j) => {
        try {
          this.hid.read((e, o) => {
            e ? j(e) : r(o);
          });
        } catch (e) {
          r(false);
        }
      });
    });
  }

  flushQueue() {
    return queueWrap(this, function* () {
      if (!this.cmdQueue.flushing) {
        for (this.cmdQueue.flushing = true; this.cmdQueue.stack.length; ) {
          const { res, rej, args } = this.cmdQueue.stack.shift();
          res(yield this.runHidCmd(...args));
        }
        this.cmdQueue.flushing = false;
      }
    });
  }

  runHidCmd(t, n = []) {
    return queueWrap(this, function* () {
      if (!this.hid) return new Array(32).fill(0);
      const bufferArr = new Uint8Array(33);
      const data = [0, t, ...n];
      bufferArr.set(data);
      try {
        this.hid.write(bufferArr);
      } catch (error) {
        console.error("Error writing", error);
        return new Array(32).fill(0);
      }
      if (
        [
          CmdId.bootloader_jump,
          CmdId.dongle_bootloader_jump,
          CmdId.dongle_set_value,
        ].indexOf(t) !== -1
      ) {
        return new Array(32).fill(0);
      }

      const resp = yield this.getByteBuffer();
      
      // console.log(
      //   `HidCmdResp ${cmdKey}:`,
      //   trimArray(resp),
      //   "Time ",
      //   Date.now() - start
      // );
      if (!resp) {
        return new Array(32).fill(0);
      }

      return resp;
    });
  }
}

export default HidDevice;
