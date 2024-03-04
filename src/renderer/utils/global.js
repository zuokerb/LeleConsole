import electron from 'electron';
import os from 'os';
var child = require('child_process').execFile;
const app = electron.app || electron.remote.app;
app.setAppLogsPath(path.join(app.getPath('userData'), 'logs'));
import path from 'path';
import DeviceCon from "./device_con.js";
import { ToastProgrammatic as Toast } from 'buefy'
const isWindowsPlatform = os.platform()=== 'win32';

const isMacOSPlatform  = os.platform() === 'darwin';

const avrdudeFlash = async function (firmware) {
  return new Promise((resolve, reject) => {
    let exec = 'avrdude';
    if (isWindowsPlatform) {
      exec = path.join(__extra, 'programs/avrdude.exe');
    } else if (isMacOSPlatform) {
      exec = path.join(__extra, 'programs/mac/avrdude');
    }
    console.log(`avrdude binary ${exec}`);
    function argBuilder(mcu, protocol, filepath) {
      return ['-p', mcu, '-c', protocol, '-D', '-U', `flash:w:${filepath}:i`];
    }
    let args = argBuilder('atmega32', 'usbasp', firmware);
    args = args.concat(['-C', path.join(__extra, `programs/${isMacOSPlatform ? 'mac/' : ''}avrdude.conf`)]);
    child(exec, args, function(err, stOut, stErr) {
      console.log(err, stOut, stErr);
      if (stErr.indexOf('avrdude done.') && stErr.indexOf('100%') !== -1) {
        resolve();
      } else {
        reject(stErr.toString());
      }
    }); 
  });
};

export default {
  install(Vue) {
    Vue.prototype.deviceCon = DeviceCon.getInstance();
    Vue.prototype.toastErr = (msg) => {
      Toast.open({
        message: msg,
        type: 'is-danger',
        position: 'is-bottom'
      })
    }
    Vue.prototype.toast = (msg) => {
      Toast.open({
        message: msg,
        type: 'is-success',
        position: 'is-bottom'
      })
    }
  },
};
export { avrdudeFlash, isWindowsPlatform, isMacOSPlatform };
