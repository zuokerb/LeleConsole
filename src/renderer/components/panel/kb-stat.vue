<template>
  <div class="panel stat flex-center" ref="panel" style="width: 1280px;margin-left: -30px;">

    <div class="keymap" v-if="currLayout && keys">
      <div style="margin: 30px 0 40px;text-align: right;">
        <b-button class="btn" @click="clearStatCnt">{{ $t('general.reset_counter') }}</b-button>
        <b-button class="btn" @click="exportCsv">{{ $t('general.export') }}</b-button>
      </div>
      <div class="grid" style="position: relative;">
        <div class="idx" style="display: flex;margin: 20px 0 10px;">
          <div class="row-idx" style="width: 110px;text-align: center;" v-for="i in 10" :key="i">{{ i - 1 }}</div>
        </div>
        <div class="col-idx" style="display: flex;position: absolute;flex-direction: column;left: -30px;">
          <div v-for="i in 6" :key="i" style="height: 60px;line-height: 60px;">{{ i - 1 }}</div>
        </div>

      </div>
      <kb-preview class="kb-wrap" :unitWidth="110" :unitSpacing="4" :keys="keys" :max-width="kbWidth" :layer="layer"
        ref="kbPreview" />
      <div class="key-stat" style="position: relative;text-align: right;padding: 10px 5px;" v-if="logfile">
        Last update: {{ lastUpdate }} <br />
        Log file: <span class="pointer" @click="openLogDir" style="text-decoration: underline;">{{ logFileName }}</span> 
      </div>
    </div>

  </div>
</template>

<script>
import KbSerial from '@/utils/kb-serial';
import KbPreview from '@/components/kb-preview';
import path from "path";
import electron from "electron";
const fs = require("fs");
const app = electron.app || electron.remote.app;
const shell = electron.shell;
import throttle from 'lodash/throttle';
export default {
  name: 'keyStat',
  props: ['hidDevice'],
  components: {
    KbPreview
  },
  data() {
    return {
      keys: null,
      layer: 0,
      currLayout: null,
      keyStat: {},
      sum: null,
      reading: false,
      timer: null,
      logfile: null,
      lastUpdate: null,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.currLayout = this.hidDevice.getDeviceInfo('layout');
      this.checkChange();
    },
    async exportCsv() {
      let rows = [['posi', 'count']];
      this.keys.forEach(k => {
        rows.push([`"${k.posi}"`, k.label]);
      });
      let csv = rows.map(r => r.join(',')).join('\n');
      let blob = new Blob([csv], { type: 'text/csv' });
      let url = URL.createObjectURL(blob);
      let a = document.createElement('a');
      a.href = url;
      a.download = 'keyboard-stat.csv';
      a.click();
    },
    openLogDir() {
      shell.openPath(path.join(app.getPath("userData"), 'switchTester'));
    },
    appLog2File: throttle(function() {
      if (!this.keys) return;
      const cacheDir = path.join(app.getPath("userData"), 'switchTester');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdir(cacheDir, (x) => { });
      }
      const sortedCoordinates = function (coordinates) {
        return coordinates.sort((a, b) => {
          const [aX, aY] = a.posi.split(',').map(Number);
          const [bX, bY] = b.posi.split(',').map(Number);

          if (aX < bX) {
            return -1;
          } else if (aX > bX) {
            return 1;
          }

          if (aY < bY) {
            return -1;
          } else if (aY > bY) {
            return 1;
          }

          return 0;
        })
      };

      let dest = path.join(cacheDir, new Date().toISOString().split('T')[0] + ".log");
      let updateAt = new Date().toISOString().replace(new RegExp('[TZ]', 'g'), ' ').split('.')[0];
      fs.appendFile(dest, `${updateAt},${sortedCoordinates(this.keys).map(i => i.label).join(',')}\n`, (err) => {
        if (err) {
          console.log(err);
          return;
        }
        this.logfile = dest;
        this.lastUpdate = updateAt;
      });
    }, 3000),
    async checkChange() {
      clearTimeout(this.timer);
      let data = await this.hidDevice.getKeyboardCustomValue(60);
      let buf_i = 1;
      let sum = 0;
      sum = data[buf_i++];
      sum <<= 8; sum |= data[buf_i++];
      sum <<= 8; sum |= data[buf_i++];
      sum <<= 8; sum |= data[buf_i++];
      if (this.sum != sum && !this.reading) {
        this.sum = sum;
        this.reading = true;
        await this.refreshStat();
        this.appLog2File();
      }
      this.timer = setTimeout(this.checkChange, 200);
    },

    async readKeyStat(idx = 0) {
      if (idx < 60) {
        let data = await this.hidDevice.getKeyboardCustomValue(idx);
        let buf_i = 1;
        while (buf_i < 24) {
          let cnt = 0;
          cnt = data[buf_i++];
          cnt <<= 8; cnt |= data[buf_i++];
          cnt <<= 8; cnt |= data[buf_i++];
          cnt <<= 8; cnt |= data[buf_i++];
          let label = cnt.toLocaleString(
            undefined,
            { minimumFractionDigits: 0 }
          );
          let keyIdx = idx++;
          this.keyStat[keyIdx] = label;
        }
        await this.readKeyStat(idx);
      }
    },
    async refreshStat() {
      if (!this.currLayout) return;
      let keys = KbSerial.deserialize(
        this.currLayout.keymap
      );
      await this.readKeyStat();
      keys = keys.map((key, i) => {
        key.byte = i;
        key.label = this.keyStat[i];
        return key;
      });
      this.$set(this, 'keys', keys);

      this.reading = false;
    },
    async clearStatCnt() {
      let arr = new Array(33).fill(0);
      for (let i = 4; i < 11; i++) {
        arr[i] = i + 0x11;
      }
      await this.hidDevice.setKeyboardCustomValue(arr.slice(2));
      this.checkChange();
    }
  },
  destroyed() {
    clearTimeout(this.timer);
  },
  computed: {
    kbWidth() {
      return this.currLayout ? this.$refs['panel'].getBoundingClientRect().width : 0;
    },
    layouts() {
      return this.hidDevice.getDeviceInfo('layouts') ? this.hidDevice.getDeviceInfo('layouts') : [];
    },
    layoutOptions() {
      return this.hidDevice.getDeviceInfo('layout_options') ? this.hidDevice.getDeviceInfo('layout_options') : [];
    },
    logFileName() {
      return path.basename(this.logfile);
    }
  },
};
</script>
<style lang="scss">
.panel.stat .keylabel {
  font-size: 15px !important;
  line-height: 48px;
  text-align: center;
}
</style>