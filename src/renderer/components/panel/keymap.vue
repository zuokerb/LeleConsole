<template>
  <div class="panel keymap flex-center" style="justify-content: flex-start;margin-top: -10px;height: 100%;">
    <div class="left">
      <div class="keymap" v-if="currLayout && keys" :class="{ preview: previewKeymap }">
        <div class="layer-nav flex-center">
          <template v-if="layouts.length > 1">
            {{ $t('keyboard.keymapLayout') }}
            <div class="keyborder flex-center" v-for="layout of layouts" @click="selectLayout(layout)" :key="layout.name"
              :class="{ active: currLayout.name === layout.name }">{{ layout.name }}</div>
            &nbsp;
          </template>

          {{ $t('keyboard.layer') }}<div class="keyborder flex-center" v-for="i in layerCnt" @click="selectLayer(i - 1)"
            :key="i" :class="{ active: layer === i - 1 }"> {{ i - 1 }}</div>

        </div>
        <kb-preview class="kb-wrap" :keys="keys" :max-width="kbWidth" :layer="layer" @selectPosi="selectPosi"
          @setKeycodeByDrop="setKeycodeByDrop" ref="kbPreview" />
      </div>
      <div class="tab-panel" style="margin-top: 5px;" ref="panel">
        <b-tabs v-model="activeTab" :animated="false">
          <b-tab-item v-for="tab in tabs" :key="tab.label" :value="tab.label"
            :label="$t('keyboard.' + tab.label + 'Tab')">
            <div class="key-list">
              <div @click="openModTapMadel" class="keyborder"
                v-if="tab.label === 'hyper' && hidDevice.getDeviceInfo('mod_tap')">
                <div class="keylabels">Mod-Tap</div>
              </div>
              <drag v-for="key of tab.keycodes" :key="key.name" class="keyborder" :transfer-data="{ keycode: key.byte }">
                <div @click="setKeycode(key.byte)">
                  <b-tooltip v-if="key.title" :label="key.title" multilined>
                    <div class="keylabels" v-html="key.short ? key.short : key.name"></div>
                  </b-tooltip>
                  <div v-else class="keylabels" v-html="key.short ? key.short : key.name"></div>
                </div>
              </drag>
            </div>
          </b-tab-item>
        </b-tabs>
      </div>
    </div>
    <div class="sidebar">


      <kb-preset :hidDevice="hidDevice" @setPreviewKeymap="setPreviewKeymap" @clearCurrLayer="clearCurrLayer"
        @applyPreset="applyPreset" @applyPresetAllLayer="applyPresetAllLayer" />

      <div class="options" v-if="layoutOptions.length">
        <h2>{{ $t(`configure.layoutOptions`) }}</h2>
        <b-field :class="'layout-options'" v-for="opt of layoutOptions" :key="opt.name" :horizontal="!opt.values"
          :label="opt.name">
          <b-switch v-if="!opt.values" v-model="opt.active" @input="changeLayoutOpt">
          </b-switch>
          <b-select v-else v-model="opt.active" @input="changeLayoutOpt" rounded>
            <option v-for="(v, i) of opt.values" :key="v" :value="i">
              {{ v }}
            </option>
          </b-select>
        </b-field>
      </div>

    </div>
    <div v-if="showModtapSetting" class="overlay">
      <div class="modal-card" style="width: 500px;height: 70vh;">
        <section class="modal-card-body">
          <div class="modal-head mb-20">Mod Tap 配置</div>
          <b-field label="短按触发" class="mb-20">
            <multiselect v-model="modTap.basic" name="name" track-by="code" label="name" placeholder="选择短按触发"
              :options="modBasicKeys" :multiple="true" :max="1" :searchable="false" select-label=""
              @click="this.$refs.multiselect.activate()">
              <template slot="maxElements">
                <div class="option__desc">Maximum 1 basic key</div>
              </template>
              <template slot="option" slot-scope="props">
                <div class="keyborder">
                  <div v-html="props.option.name"></div>
                </div>
              </template>

              <template slot="tag" slot-scope="props">
                <span class="multiselect__tag"><span v-html="props.option.name"></span> <i tabindex="1"
                    class="multiselect__tag-icon" @click="modTap.basic = []"></i></span>
              </template>
            </multiselect>
          </b-field>

          <b-field label="长按触发的 Mod 键">
            <multiselect v-model="modTap.mod" name="name" track-by="code" label="name" placeholder="选择长按触发的 Mod 键"
              :options="modKeys" :multiple="true" :max="2" :searchable="false" select-label="" deselect-label=""
              selected-label="">
              <template slot="maxElements">
                <div class="option__desc">Maximum 2 mod key</div>
              </template>
              <template slot="option" slot-scope="props">
                <div class="keyborder">
                  <div v-html="props.option.name"></div>
                </div>
              </template>
            </multiselect>
          </b-field>

        </section>
        <footer class="modal-card-foot flex-center">
          <b-button :label="$t('general.close')" type="is-success" @click="showModtapSetting = false" />
          <b-button :label="$t('general.save')" @click="setModKey" type="is-success" />
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import {
  basicKeycodes,
  numpadKeycodes,
  mediaKeycodes,
  layerKeycodes,
  lightKeycodes,
  macroKeycodes,
  hyperKeycodes,
  modTapKeys,
  modBasicKeys
} from '@/config/key-group.js';
import { getKeyName, parseModTapKey } from '@/utils/kb-helper.js';
import KbSerial from '@/utils/kb-serial';
import KbPreview from '@/components/kb-preview';
import KbPreset from "@/components/panel/kb-preset";


export default {
  name: 'keymap',
  props: ['hidDevice'],
  components: {
    KbPreview,
    KbPreset
  },
  data() {
    return {
      keys: null,
      cacheKeys: null,
      activeTab: 'basic',
      currTab: null,
      layer: 0,
      activePosi: null,
      currLayout: null,
      showModtapSetting: false,
      tabs: [
        basicKeycodes,
        numpadKeycodes,
        mediaKeycodes,
        layerKeycodes,
        lightKeycodes,
        macroKeycodes,
        hyperKeycodes,
      ],
      modTap: {
        basic: [],
        mod: [],
      },
      modBasicKeys: modBasicKeys,
      modKeys: modTapKeys,
      previewKeymap: null,
    };
  },
  mounted() {
    this.checkInit();
  },
  methods: {
    checkInit() {
      if (this.hidDevice.getDeviceInfo('layout')) {
        this.selectLayout();
      } else {
        setTimeout(() => {
          this.checkInit();
        }, 200);
      }
    },
    setModKey() {
      let basicKey = this.modTap.basic;
      if (!basicKey.length) return this.toast(this.$t('help.mod_short'));
      let modKeys = this.modTap.mod.map(i => i.code);
      if (!modKeys.length) return this.toast(this.$t('help.mod_long'));
      const basicCode = basicKey[0].byte;
      const modsCode = modKeys.length == 1 ? modKeys[0] : (modKeys[0] | modKeys[1]);
      const keycode = 0x6000 | (((modsCode) & 0x1F) << 8) | ((basicCode) & 0xFF);
      console.log('setModKey', keycode);
      this.setKeycode(keycode);
      this.showModtapSetting = false;
      this.modTap = {
        basic: [],
        mod: [],
      };
    },
    setPreviewKeymap(keys) {
      this.previewKeymap = keys;
      this.refreshKeys(true);
    },
    async applyPresetAllLayer(layers) {
      console.log('applyPresetAllLayer', layers);
      const matrix = this.hidDevice.getDeviceInfo('matrix');
      const { rows, cols } = matrix;

      for (let layer = 0; layer < layers.length; layer++) {
        const keys = layers[layer].keys;
        let keymapArray = [];
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            let key = keys.find(k => k.posi == `${i},${j}`);
            keymapArray.push(key ? key.byte : 0);
          }
        }
        await this.hidDevice.fastWriteRawMatrix(keymapArray, layer * 2 * rows * cols);
      }
      this.previewKeymap = null;
      this.refreshKeys();
      this.toast(this.$t('configure.config_success'));
    },
    async applyPreset(keys) {
      const matrix = this.hidDevice.getDeviceInfo('matrix');
      const { rows, cols } = matrix;
      let keymapArray = [];
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let key = keys.find(k => k.posi == `${i},${j}`);
          keymapArray.push(key ? key.byte : 0);
        }
      }

      await this.hidDevice.fastWriteRawMatrix(keymapArray, this.layer * 2 * rows * cols);
      this.previewKeymap = null;
      this.refreshKeys();
      this.toast(this.$t('configure.config_success'));
    },
    async clearCurrLayer() {
      const matrix = this.hidDevice.getDeviceInfo('matrix');
      const { rows, cols } = matrix;
      let count = rows * cols;
      const keymapArray = new Array(count).fill(0);
      await this.hidDevice.fastWriteRawMatrix(keymapArray, this.layer * 2 * count);
      this.previewKeymap = null;
      this.refreshKeys();
      this.toast(this.$t('clear_done'));
    },
    changeLayoutOpt() {
      this.hidDevice
        .setLayoutOption(
          this.layoutOptions.map((opt) => {
            if (Array.isArray(opt.values) && opt.values.length) return opt.active;
            return opt.active ? 1 : 0;
          })
        )
        .then((data) => {
          this.refreshKeys();
        });
    },
    openModTapMadel() {
      if (!this.activePosi) return this.toast(this.$t('help.mod_tap_select'));
      let key = this.keys.find((key) => key.posi === this.activePosi);
      if (key && key.label.indexOf('MT') !== -1) {
        let existsMod = parseModTapKey(key.byte);
        this.modTap.basic = [modBasicKeys.find(key => key.byte === existsMod[0])];
        this.modTap.mod = existsMod.slice(1).map((mod) => modTapKeys.find(key => key.code === mod));
      }

      this.showModtapSetting = true;
    },
    setKeycode(code) {
      if (this.activePosi === null) {
        return;
      }
      const poi = this.activePosi.split(',').map(Number);
      this.hidDevice.setKey(this.layer, poi[0], poi[1], code).then((val) => {
        let keys = this.keys.map((key) => {
          if (key.posi === this.activePosi) {
            key.byte = val;
            key.label = getKeyName(val);
          }
          return key;
        });
        this.$set(this, 'keys', keys);
        this.$refs.kbPreview.selectNextPosi();
      });
    },
    setKeycodeByDrop(code, posi) {
      const poi = posi.split(',').map(Number);
      this.hidDevice.setKey(this.layer, poi[0], poi[1], code).then((val) => {
        let keys = this.keys.map((key) => {
          if (key.posi === posi) {
            key.byte = val;
            key.label = getKeyName(val);
          }
          return key;
        });
        this.$set(this, 'keys', keys);
      });
      this.$refs.kbPreview.selectPosi({ posi });
    },
    selectPosi(posi) {
      this.activePosi = posi;
    },
    selectLayout(layout) {
      if (layout) {
        this.currLayout = layout;
        this.hidDevice.setDeviceInfo('layout', layout);
      } else {
        this.currLayout = this.hidDevice.getDeviceInfo('layout');
      }
      this.selectLayer();
    },
    selectLayer(layer) {
      this.layer = layer ? layer : 0;
      this.refreshKeys();
    },
    refreshKeys(useCache = false) {
      if (!this.currLayout) return;
      let keys = KbSerial.deserialize(
        this.currLayout.keymap,
        this.layoutOptions
      );
      if (this.previewKeymap) {
        keys = keys.map((key, i) => {
          let k = this.previewKeymap === 'clear' ? { byte: 0 } : this.previewKeymap.find((k) => k.posi === key.posi);
          key.byte = k.byte;
          key.label = getKeyName(k.byte);
          return key;
        });
        this.$set(this, 'keys', keys);
        return;
      }
      if (useCache && this.cacheKeys) {
        this.$set(this, 'keys', this.cacheKeys);
        return;
      }
      const matrix = this.hidDevice.getDeviceInfo('matrix');
      this.hidDevice.fastReadRawMatrix(matrix, this.layer).then((data) => {
        const cols = matrix.cols;
        keys = keys.map((key, i) => {
          let [row, col] = key.posi.split(',').map(Number);
          key.byte = data[row * cols + col];
          key.label = getKeyName(key.byte);
          return key;
        });
        this.cacheKeys = keys;
        this.$set(this, 'keys', keys);
      });
    },
  },

  computed: {
    kbWidth() {
      return this.currLayout ? this.$refs['panel'].getBoundingClientRect().width : 0;
    },
    layerCnt() {
      return this.hidDevice.getDeviceInfo('layer_cnt') ? this.hidDevice.getDeviceInfo('layer_cnt') : 0;
    },
    layouts() {
      return this.hidDevice.getDeviceInfo('layouts') ? this.hidDevice.getDeviceInfo('layouts') : [];
    },
    layoutOptions() {
      return this.hidDevice.getDeviceInfo('layout_options') ? this.hidDevice.getDeviceInfo('layout_options') : [];
    },
  },
};
</script>
<style lang="scss">
.multiselect__select {
  width: 100% !important;
  text-align: right !important;
  transform: none !important;
  ;
}

.multiselect__content-wrapper {
  border-radius: 5px !important;
}

.tab-panel .tabs a {
  padding: 5px 10px;
  font-size: 14px;
  font-weight: bold;
  background: none;
}

.keymap .preview {
  .keyborder {
    background: transparent;
    border-color: var(--highlight-color);
  }

  .keylabels {
    color: var(--highlight-color);
  }

}
</style>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style lang="scss" scoped>
.layer-nav {
  margin-bottom: 10px;
  justify-content: flex-start;
  position: relative;

  .keyborder {
    min-width: 24px;
    height: 24px;
    padding: 0 5px;
    margin-left: 10px;
    font-size: 12px;

    &.active {
      border-width: 2px;
    }
  }

  .layouts {
    min-width: 180px;
  }
}

.left {
  max-width: 980px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.tab-content {
  padding: 20px 0;
}

.tab-panel {
  width: 980px;

  height: 260px;
}

.key-list {
  display: flex;
  align-content: space-between;
  align-items: center;
  flex-wrap: wrap;

  .keyborder {
    font-size: 12px;
    position: relative;
    height: 40px;
    min-width: 40px;
    margin: 4px 5px 4px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0px;

    &>div {
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .keylabels {
      padding: 7px 8px;
      min-width: 35px;
      min-height: 35px;
      flex-grow: 1;
      line-height: 16px;
      text-align: center;
    }
  }

}

.modal-head {
  font-size: 14px;
  font-weight: bold;
  padding: 10px 0;

  &::after {
    content: ' ';
    display: block;
    width: 200px;
    height: 1px;
    margin: 10px 0;
    background: var(--text-color);
    opacity: 0.5;
  }
}

.overlay {
  display: flex;
  position: fixed;
  width: 100vw;
  height: 100vh;
  left: 0;
  top: 0;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
}

.modal-card-foot {
  justify-content: flex-end;
}
</style>
