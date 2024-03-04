import { fetchRemoteConfig } from "./kb-helper";
import HidDevice from "./hid_device";
const HID = require("node-hid");
const globalLock = {};
var DeviceCon = (function () {
  var instance;
  function init() {
    return {
      flashing: false,
      supportDeviceList: [],
      currDevice: null,
      connectDeviceList: [],
      connectDeviceIdFlag: "",
      events: {},
      usbDetach: async function (vid, pid) {
        if (this.flashing) return;
        console.log(`device detach`, vid, pid, this.currDevice);
        if (
          this.currDevice &&
          this.currDevice.getDeviceInfo("vendorId") == vid &&
          this.currDevice.getDeviceInfo("productId") == pid
        ) {
          this.reset();
        }
      },
      reset: function (reload) {
        if (this.currDevice) {
          try {
            this.currDevice.hid.close();
          } catch (e) {}
        }
        this.currDevice = null;
         
        this.emit("selectDevice", [null]);
        this.emit("refreshDeviceList", []);
      },
      startFlash: function () {
        this.flashing = true;
        this.flashCheckTimer = setTimeout(() => {
          if (this.flashing) {
            this.flashing = false;
            this.reset();
          }
        }, 60 * 1000);
      },
      endFlash: function () {
        this.flashing = false;
        clearTimeout(this.flashCheckTimer);
        this.reset();
      },
      on: function (name, cb) {
        (this.events[name] || (this.events[name] = [])).push(cb);
      },

      emit: function (name, args) {
        console.log("emit", name, args);
        (this.events[name] || []).forEach((fn) => fn(...args));
      },
      loadConfig: async function () {
        if (this.supportDeviceList.length > 0) return true;
        this.supportDeviceList = await fetchRemoteConfig("config/devices.json");
      },
      regListener: function () {
        try {
          const {usb} = require("usb");
          usb.on("detach", (device) => {
            this.usbDetach(
              device.deviceDescriptor.idVendor,
              device.deviceDescriptor.idProduct
            );
          });
        } catch (e) {
          console.error('regListener', e);
          return;
        }
       
      },
      selectDevice: async function (device, slave) {
        for (let d of Object.keys(globalLock)) {
            if (globalLock[d] instanceof Promise) {
                await globalLock[d];
            }
        }

        if (this.currDevice) {
          try {
            this.currDevice.hid.close();
          } catch (e) {}
        }
        let hidDevice = new HidDevice(device);
        if (slave) {
          await hidDevice.changeActiveSlave(slave);
        }
        hidDevice.on("dongleSlaveChange", (vid, pid) => {
          this.usbDetach(vid, pid);
        });
        hidDevice.fetchDeviceBaseInfo();
        this.currDevice = hidDevice;
        this.emit("selectDevice", [this.currDevice]);
      },
      appendSupportDevice: function (device) {
        const newDevices = [device].map((d) => ({
          ...d,
          product_id: parseInt(d.productId),
          vendor_id: parseInt(d.vendorId),
        }));
        this.supportDeviceList = [
          ...this.supportDeviceList.filter(
            (d) =>
              !newDevices.some(
                (dd) =>
                  parseInt(d.product_id) === parseInt(dd.product_id) &&
                  parseInt(d.vendor_id) === parseInt(dd.vendor_id)
              )
          ),
          ...newDevices,
        ];
      },
      listDevice: async function () {
          let aliveDevices = HID.devices();
          aliveDevices = this.filterUnsupportDevices(aliveDevices);
          return await this.initHidDeviceInfo(aliveDevices);
      },
      filterUnsupportDevices(devices) {
        return devices
          .map((device) => {
            if (!device || !device.vendorId || !device.productId) return false;
            if (device.interface !== 1) return false;

            const { vendorId, productId, product } = device;
            
            let matchedDevices = this.supportDeviceList
              .filter(
                (d) =>
                  parseInt(vendorId) === parseInt(d.vendor_id) &&
                  parseInt(productId) === parseInt(d.product_id)
              );
          
            if (productId == 0x240) {
              matchedDevices = matchedDevices.filter((d) => {
                return product.indexOf('Lele') === -1 ? d.name === 'Egg20 2.4G' : d.name === 'Lele 2.4G';
              });
            }
            if (!matchedDevices.length) return false;
            device.config = matchedDevices[0].config;
            return device;
          }).filter((d) => d).sort((a, b) => parseInt(a.productId) - parseInt(b.productId));
      },
      initHidDeviceInfo: async function (devices) {
        let list = [];
        devices = this.filterUnsupportDevices(devices);
        for (let device of devices) {
          const info = await fetchRemoteConfig(device["config"], true);
          if (!info) continue;
          info.isHub = parseInt(info.productId) === 0x240;
          if (info.layouts && !Array.isArray(info.layouts)) {
            info.layouts = [info.layouts];
          }
          device = Object.assign(device, info);
          if (device.isHub) {
            if (!globalLock[device.path] || Array.isArray(globalLock[device.path])) {
              device.slaveDevices = Array.isArray(globalLock[device.path]) ? globalLock[device.path] : null;
              globalLock[device.path] = new Promise((resolve) => {
                  let hidDevice = new HidDevice(device);
                  hidDevice.getDongleSlaveList().then(async function (res) {
                    await hidDevice.hid.close();
                    resolve(res);
                  });
              });
              console.log(globalLock[device.path])
            }
            globalLock[device.path].then(res => {
              console.log('globalLock', res);
              device.slaveDevices = res;
              globalLock[device.path] = res;
            });
          }
          if (this.currDevice && this.currDevice.getDeviceInfo('path') === device.path) {
            device.isCurrDevice = true;
          }
          list.push(device);
        }
        return list;
      },
    };
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = init();
      }
      return instance;
    },
  };
})();

export default DeviceCon;




















