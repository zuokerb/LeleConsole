<template>
  <div class="page-body" style="padding: 20px 0 0 20px;">
    <div class="keyboard-wrap">
      <kb-preview v-if="keyboard" :key="keyboard.length" :keys="keyboard" :max-width="wrapWidth"
        :pressed-keys="pressedKeys" :active-keys="activeKeys" :testMode="true" />
    </div>

    <div class="setting">
      <b-field v-if="hidDevice && !is24G">
        <b-switch v-model="testMatrix">Test Matrix</b-switch>
      </b-field>

      <b-field>
        <b-switch v-model="enabledSound">{{ $t('tester.keySound') }}</b-switch>
      </b-field>

      <b-field>
        <b-button @click="clear" type="is-success">{{
          $t('tester.reset')
        }}</b-button>
      </b-field>
    </div>
  </div>
</template>

<script>
import KbSerial from '@/utils/kb-serial';
import KbPreview from '@/components/kb-preview';
import TestKeys from '@/config/keyboard-tester.json';
import Key2Byte from '@/config/key2byte.js';
import { getEventKeycode } from '@/utils/kb-helper.js';
import { KbValueId } from '@/utils/kb-const';
import union from 'lodash/union';
import path from 'path';

export default {
  name: 'Tester',
  props: ['hidDevice'],
  components: { KbPreview },
  data() {
    return {
      timer: null,
      keyboard: null,
      config: null,
      pressedKeys: [],
      activeKeys: [],
      testMatrix: false,
      matrixStatus: [],
      enabledSound: true,
      audio: null,
    };
  },
  created() {
    this.audio = new Audio(`file://${path.join(__static, 'keydown.mp3')}`);
  },
  mounted() {
    this.keyboard = KbSerial.deserialize([TestKeys]);
  },
  activated() {
    this.registerEvent();
  },
  deactivated() {
    clearTimeout(this.timer);
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    const input = document.querySelector('input[type="checkbox"]');
    if (input) { 
      input.removeEventListener('keydown', this.preventEnter);
      input.removeEventListener('keyup', this.preventEnter);
    }
    this.testMatrix = false;
  },
  methods: {
    registerEvent() {
      console.log('registerEvent');
      window.addEventListener('keydown', this.keydown);
      window.addEventListener('keyup', this.keyup);
      const input = document.querySelector('input[type="checkbox"]');
      if (input) {
        input.addEventListener('keydown', this.preventEnter);
        input.addEventListener('keyup', this.preventEnter);
      }
    },
    preventEnter(e) {
      document.querySelector('input[type="checkbox"]').blur();
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    clear() {
      this.activeKeys = [];
      this.pressedKeys = [];
    },
    changeLayout() {
      this.changeTestMode(true);
    },
    changeTestMode(testMatrix) {
      this.clear();
      let config, kb;
      if (testMatrix) {
        const { cols } = this.matrix;
        const layoutOptions = this.hidDevice.getDeviceInfo('layout_options');
        const layout =  this.hidDevice.getDeviceInfo('layout');
        kb = KbSerial.deserialize(
          layout.keymap,
          layoutOptions,
        );
        kb.forEach((key, i) => {
          const [row, col] = key.posi.split(',').map(Number);
          key.byte = row * cols + col;
          key.label =key.posi;
          return key;
        });
        this.fetchMatrixStatus();
      } else {
        config = [TestKeys];
        kb = KbSerial.deserialize(config);
      }
      this.keyboard = kb;
    },
    async fetchMatrixStatus() {
      clearTimeout(this.timer);
      if (!this.testMatrix) return;
      const { cols, rows } = this.matrix;
      const K = Math.ceil(cols / 8);
      this.matrixStatus = [];

      const offset = this.hidDevice.info.menus ? 1 : 0;
      let o = await this.hidDevice.getKeyboardValue(
        KbValueId.id_switch_matrix_state,
        K * rows + (offset),
      );
      o = o.slice(offset, K * rows + offset);
      let data = o.reduce((e, t, n) => (e + t) ^ (this.matrixStatus[n] || 0), 0);
      if (data) {
        let matrix = Array(rows * cols).fill(0);
        o.reduce((matrix, cur, idx) => {
          const r = cur ^ (this.matrixStatus[idx] || 0);
          if (r === 0) return matrix;

          const row = Math.floor(idx / K);
          const col = 8 * (K - 1 - (idx % K));

          return Array(Math.max(0, Math.min(8, cols - col))).fill(0)
            .reduce((t, n, i) => {
              const a = cols * row + i + col;
              t[a] = (r >> i) & 1;
              return t;
            }, matrix);
        }, matrix);
        this.matrixStatus = matrix;

        let activeKeys = [];
        let pressedKeys = this.pressedKeys;
        this.matrixStatus.forEach((v, i) => {
          if (v) {
            activeKeys.push(i);
            pressedKeys.push(i);
          }
        });
        if (activeKeys.length > 0) {
          this.playSound();
        }
        this.$set(this, 'activeKeys', activeKeys);
        this.$set(this, 'pressedKeys', union(pressedKeys));
      } else {
        this.activeKeys = [];
      }

      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.fetchMatrixStatus();
      }, 40);
    },
    keydown(e) {
      e.preventDefault();
      if (this.testMatrix) return;
      const code = getEventKeycode(e.code);
      if (!code) {
        return;
      }
      const byte = Key2Byte[code];
      console.log('keydown', byte);
      this.pressedKeys.push(byte);
      this.activeKeys.push(byte);
      this.$nextTick(() => {  
        this.playSound();
      });
    },
    playSound() {
      if (this.enabledSound && this.audio) {
        var audio2 = this.audio.cloneNode();
        audio2.play();
      }
    },
    keyup(e) {
      e.preventDefault();
      if (this.testMatrix) return;
      const code = getEventKeycode(e.code);
      if (!code) {
        return;
      }
      const byte = Key2Byte[code];
      setTimeout(() => {
        this.activeKeys = this.activeKeys.filter((key) => key !== byte);
      }, 50);
    },
  },
  computed: {
    wrapWidth() {
      return 1220;
    },
    matrix() {
      return this.hidDevice.getDeviceInfo('matrix');
    },
    is24G() {
      return this.hidDevice.getDeviceInfo('is24G');
    }
  },
  watch: {
    testMatrix(val) {
      this.changeTestMode(val);
    },
  },
};
</script>

<style lang="scss" scoped>
.page-body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .keyboard-wrap {
    width: 100%;
    .layout {
      width: 140px;
      margin: 0 auto;
    }
  }
  .setting {
    padding: 60px 10px;
    .field {
      margin-bottom: 30px;
      max-width: 250px;
    }
    .group {
      display: flex;
      justify-content: space-between;
      padding-right: 50px;
      min-height: 80px;
    }
  }
}
</style>