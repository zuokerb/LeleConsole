<template>
  <div class="panel flex-center" style="margin: 0 100px">
    <div class="panel-wrap firmware" style="padding: 20px 60px;">
      <div class=" flex-center" style="flex-direction: column;align-items: flex-start;">
        <b-field v-if="enableNkro" horizontal :label="$t('configure.nkro')">
          <b-switch v-model="nkro"></b-switch>
        </b-field>

        <b-field v-if="enableUsbAutoSleep" horizontal :label="$t('configure.usb_auto_sleep')">
          <b-switch v-model="enable_usb_sleep"></b-switch>
        </b-field>

        <b-field v-if="enableUsbAutoSleep" horizontal>
          <template #label>
            <span style="min-width: 140px;display: inline-block;">{{ $t('configure.auto_sleep') }}</span>{{
              auto_sleep_sec }}
          </template>
          <b-slider v-model="auto_sleep_sec" type="is-success" :min="300" :max="36000"></b-slider>
        </b-field>

        <b-field v-if="enableMatrixScanFreq" horizontal class="brightness">
          <template #label>
            <span style="min-width: 140px;display: inline-block;">{{ $t('configure.matrix_scan_freq') }}</span>{{
              matrix_scan_freq + 'Hz' }}
          </template>
          <b-slider v-model="matrix_scan_freq" type="is-success" :min="30" :max="333"
            :custom-formatter="val => val + 'Hz'"></b-slider>
        </b-field>

        <b-field v-if="enableMatrixScanDebounce" horizontal class="brightness">
          <template #label>
            <span style="min-width: 140px;display: inline-block;">{{ $t('configure.matrix_scan_debounce') }}</span> {{
              matrix_scan_debounce }}
          </template>
          <b-slider v-model="matrix_scan_debounce" type="is-success" :min="0" :max="10"></b-slider>
        </b-field>

        <b-field v-if="enableBlePower" horizontal class="brightness">
          <template #label>
            <span style="min-width: 140px;display: inline-block;">{{ $t('configure.ble_power') }}</span>{{ ble_power +
              'dBm'
            }}
          </template>
          <b-slider v-model="ble_power" type="is-success" :min="0" :max="8"
            :custom-formatter="val => val + 'dBm'"></b-slider>
        </b-field>

        <b-field v-if="enableRadioPower" horizontal class="brightness">
          <template #label>
            <span style="min-width: 140px;display: inline-block;">{{ $t('configure.radio_power') }}</span>{{ radio_power +
              'dBm' }}
          </template>
          <b-slider v-model="radio_power" type="is-success" :min="0" :max="8"
            :custom-formatter="val => val + 'dBm'"></b-slider>
        </b-field>


        <b-button class="btn mt-20 upgrade-btn" v-if="hidDevice.info.firmware_path" @click.prevent="startFlash">{{
          $t('general.upgrade_firmware_to', { version: hidDevice.info.firmware_version }) }}</b-button>
        <b-button class="btn mt-20" v-else disabled>{{ $t('general.is_leatest') }}</b-button>

        <template v-if="!hidDevice.getDeviceInfo('isHub')">
          <b-button class="btn" @click="exportConfig">{{ $t('general.export_config') }}</b-button>
          <b-upload @input="importConfig" class="file-label">
            <b-button class="btn">{{ $t('general.import_config') }}</b-button>
          </b-upload>
        </template>
      </div>
      <b-loading :is-full-page="true" v-model="loading" :can-cancel="false">
        <b-steps v-if="flashMode" v-model="flashStep.current" style="width: 900px" :hasNavigation="false">
          <b-step-item v-for="s of flashStep[flashMode]" :clickable="false" :key="s.step" :step="s.step" :label="s.msg" :headerClass="'step-label'">
          </b-step-item>
          <b-button type="is-success is-light" v-if="flashStep.current === 2"
            style="width: 120px;margin: 40px auto;position: absolute;left: calc(50% - 60px);" @click.stop="finishFlash">{{
              $t('general.finish') }}</b-button>

        </b-steps>
        <div v-else class="flex-center" style="flex-direction: column;">
          <div class="loading-icon" />
          <div class="help-msg" v-html="loadingMessage"></div>
        </div>
      </b-loading>
    </div>
    <DeviceInfo :hidDevice="hidDevice" :showFirmwareUpgrade="true" />
  </div>
</template>

<script>
const fs = require("fs");
const usb = require('usb');
const { DfuUpdates, DfuTransportSerial, DfuOperation } = require("pc-nrf-dfu-js");
const { avrdudeFlash } = require('@/utils/global');
import { checkDfuPort } from "@/utils/kb-helper.js";
const { SerialPort } = require("serialport");
import DeviceInfo from "@/components/device-info";
import { KbValueId } from '@/utils/kb-const';

export default {
  name: 'firmware',
  props: ['hidDevice'],
  components: { DeviceInfo },
  data() {
    return {
      keyboard: null,
      loading: false,
      lister: null,
      timer: null,
      flashMode: 'dfu',
      nkro: false,
      matrix_scan_freq: 30,
      matrix_scan_debounce: 0,
      ble_power: 0,
      radio_power: 0,
      loadingMessage: this.$t('general.processing'),
      loaded: false,
      enable_usb_sleep: false,
      auto_sleep_sec: 0,
      flashStep: {
        current: 0,
        dfu: [
          {
            step: 1,
            msg: this.$t('general.enter_dfu'),
          },
          {
            step: 2,
            msg: this.$t('general.flash_progress'),
          },
          {
            step: 3,
            msg: this.$t("general.flash_success"),
          }
        ],
        avrdude: [
          {
            step: 1,
            msg: this.$t('general.flash_helper'),
          },
          {
            step: 2,
            msg: this.$t('general.flash_progress'),
          },
          {
            step: 3,
            msg: this.$t("general.avrdude_flash_success"),
          }
        ],
      },
    };
  },
  async mounted() {
    if (this.enableNkro) {
      let [v] = await this.hidDevice.getKeyboardValue(KbValueId.id_usb_nkro, 1);
      this.nkro = !!v;
    }
    if (this.enableMatrixScanFreq) {
      let v = await this.hidDevice.getKeyboardValue(KbValueId.matrix_scan_freq, 2);
      console.log('get matrix_scan_freq', v);
      this.matrix_scan_freq = v[0] << 8 | v[1];
    }
    if (this.enableMatrixScanDebounce) {
      [this.matrix_scan_debounce] = await this.hidDevice.getKeyboardValue(KbValueId.matrix_scan_debounce, 1);
    }

    if (this.enableBlePower) {
      [this.ble_power] = await this.hidDevice.getKeyboardValue(KbValueId.ble_power, 1);
    }

    if (this.enableRadioPower) {
      [this.radio_power] = await this.hidDevice.getKeyboardValue(KbValueId.radio_power, 1);
    }
    if (this.enableUsbAutoSleep) {
      let [v] = await this.hidDevice.getKeyboardValue(KbValueId.enable_usb_sleep, 1);
      this.enable_usb_sleep = !!v;
      v = await this.hidDevice.getKeyboardValue(KbValueId.auto_sleep_sec, 2);
      console.log('get auto_sleep_sec', v);
      this.auto_sleep_sec = v[0] << 8 | v[1];
    }
    this.$nextTick(function () {
      this.loaded = true;
    });
  },
  destroyed() {
    clearTimeout(this.timer);
  },
  methods: {
    async exportConfig() {
      this.loading = true;
      this.loadingMessage = this.$t('general.exporting');
      const config = await this.hidDevice.dumpConfig();
      console.log(config);
      const element = document.createElement("a");
      const file = new Blob([JSON.stringify(config, null, 3)], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = this.hidDevice.getDeviceInfo('name') + "_lele_backup.json";
      element.click();
      this.loading = false;
    },
    importConfig(file) {
      if (!file.name.endsWith('.json')) {
        this.toastErr('invalid config file')
        return;
      }
      var reader = new FileReader();
      reader.onload = async (e) => {
        var contents = e.target.result;
        const config = JSON.parse(contents);
        if (
          !config.vendorId ||
          !config.productId ||
          !config.layout_options ||
          !config.keymap ||
          !config.macros ||
          (parseInt(config.vendorId) !== parseInt(this.hidDevice.getDeviceInfo('vendorId')) || parseInt(config.productId) !== parseInt(this.hidDevice.getDeviceInfo('productId')))
        ) {
          this.toastErr('invalid config file')
          return;
        }
        this.loading = true;
        this.loadingMessage = 'importing...';
        await this.hidDevice.importConfig(config);
        this.loading = false;
        this.toast('import config success')
      };
      reader.onerror = (e) => {
        this.toastErr(e)
      };
      reader.readAsText(file);
    },
    startFlash() {
      const mode = this.hidDevice.info.firmware_mode ? this.hidDevice.info.firmware_mode : 'dfu';
      this.$buefy.dialog.confirm({
        message: this.flashMode === 'avrdude' || this.hidDevice.info.isHub ? this.$t('general.confirm_upgrade') : this.$t('configure.firmware_alert'),
        onConfirm: () => {
          this.flashMode = mode;
          this.runFlash()
        }
      })
    },
    async runFlash() {
      this.loading = true;
      if (this.flashMode === 'avrdude') {
        this.flashStep.current = 0;
        this.detectAndFlashForAvrdude();
        return;
      }

      this.flashStep.current = 0;
      this.deviceCon.startFlash();
      checkDfuPort(this.hidDevice.info.serialNumber, async () => {
        await this.gotoDfu();
      }).then((port) => {
        this.flashStep.current = 1;
        this.flashFirmware(port, this.hidDevice.info.firmware_path);
      });
    },
    async gotoDfu() {
      if (this.hidDevice.info.isHub) {
        return await this.hidDevice.dongleJumpToBootloader();
      } else {
        await this.hidDevice.jumpToBootloader();
      }
    },
    async detectAndFlashForAvrdude() {
      this.deviceCon.startFlash();
      const that = this;
      let detectPort = async (vendorId, productId) => {
        return new Promise((resolve) => {
          const check = () => {
            const devices = usb.findByIds(vendorId, productId);
            console.log('detectPort devices', devices);
            if (devices) {
              resolve(devices);
            } else {
              that.timer = setTimeout(check, 1000);
            }
          };
          check();
        });
      };

      await detectPort(0x16c0, 0X05dc);

      console.log("avrdudeFlash", this.hidDevice.info.firmware_path);
      this.flashStep.current = 1;
      try {
        await avrdudeFlash(this.hidDevice.info.firmware_path);
        this.flashStep.current = 2;
      } catch (e) {
        console.log("fail", e);
        if (
          e.indexOf("unable to open programmer usbasp on port usb") !== -1
          || e.indexOf("Library not loaded")
        ) {
          this.loadingMessage = "缺少 USB 相关驱动，下载 qmk toolbox 安装驱动后升级。";
        }
      }
    },
    async flashFirmware(device, file) {
      console.log(`flashFirmware ${device.path} ${file}`);
      const port = new SerialPort({
        path: device.path,
        baudRate: 115200,
        autoOpen: false,
      });

      const updates = await DfuUpdates.fromZipFile(fs.readFileSync(file));
      const serialTransport = new DfuTransportSerial(port, 16);
      const dfu = new DfuOperation(updates, serialTransport);
      dfu
        .start(true)
        .then(() => {
        })
        .catch((err) => {
          console.log('DfuUpdateFail:', err)
          this.toastErr(err);
        }).finally(() => {
          console.log('afterFlashFirmware')
          this.flashStep.current = 2;
        });
    },
    finishFlash() {
      location.reload();
    },
    setKbValue: function (k, t) {
      this.hidDevice.debounceSetKbValue(k, t);
    },
  },
  watch: {
    nkro(val) {
      if (this.loaded) this.setKbValue(KbValueId.id_usb_nkro, val ? 1 : 0);
    },
    matrix_scan_freq(val) {

      if (this.loaded) this.setKbValue(KbValueId.matrix_scan_freq, val);
    },
    matrix_scan_debounce(val) {
      if (this.loaded) this.setKbValue(KbValueId.matrix_scan_debounce, val);
    },
    ble_power(val) {
      if (this.loaded) this.setKbValue(KbValueId.ble_power, val);
    },
    radio_power(val) {
      if (this.loaded) this.setKbValue(KbValueId.radio_power, val);
    },
    enable_usb_sleep(val) {
      if (this.loaded) this.setKbValue(KbValueId.enable_usb_sleep, val ? 1 : 0);
    },
    auto_sleep_sec(val) {
      if (this.loaded) {
        this.setKbValue(KbValueId.auto_sleep_sec, val);
      }
    },
  },
  computed: {
    extraFunc() {
      return this.hidDevice.getDeviceInfo('extra_func');
    },
    enableNkro() {
      return this.extraFunc && this.extraFunc['nkgr']
        && parseInt(this.hidDevice.getDeviceInfo('release')) >= parseInt(this.extraFunc['nkgr']);
    },
    enableMatrixScanFreq() {
      return this.extraFunc && this.extraFunc['matrix_scan_freq']
        && parseInt(this.hidDevice.getDeviceInfo('release')) >= parseInt(this.extraFunc['matrix_scan_freq']);
    },
    enableMatrixScanDebounce() {
      return this.extraFunc && this.extraFunc['matrix_scan_debounce']
        && parseInt(this.hidDevice.getDeviceInfo('release')) >= parseInt(this.extraFunc['matrix_scan_debounce']);
    },
    enableBlePower() {
      return this.extraFunc && this.extraFunc['ble_power']
        && parseInt(this.hidDevice.getDeviceInfo('release')) >= parseInt(this.extraFunc['ble_power']);
    },
    enableRadioPower() {
      return this.extraFunc && this.extraFunc['radio_power']
        && parseInt(this.hidDevice.getDeviceInfo('release')) >= parseInt(this.extraFunc['radio_power']);
    },
    enableUsbAutoSleep() {
      return this.extraFunc && this.extraFunc['enable_usb_sleep']
        && parseInt(this.hidDevice.getDeviceInfo('release')) >= parseInt(this.extraFunc['enable_usb_sleep']);
    },
  }
};
</script>
<style lang="scss" scoped>
.panel-wrap {
  padding-top: 30px;

  .section {
    flex-direction: column;
    margin: 0 auto;
    align-items: flex-start;
  }

  .btn {
    margin-bottom: 12px;


  }

  .help-msg {
    margin-top: 50px;
    color: var(--text-color);
    position: relative;
  }

  .upgrade-btn {
    background: var(--highlight-bg) !important;
    color: var(--highlight-color) !important;
    width: max-content;
    border: 1px solid var(--highlight-color) !important;
  }

}
</style>
<style lang="scss">
.step-label .step-title {
  font-size: 14px !important;
  position: relative;
  top: 10px;
  white-space: pre-line;
}

.step-item.is-active .step-title {
  color: var(--text-color) !important;
}
</style>
