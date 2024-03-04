<template>
  <div id="app">
    <app-titlebar :key="'titlbar' + deviceKey" :hidDevice="hidDevice" @changePanel="changePanel"></app-titlebar>
    <panelFlash v-if="flashMode" />
    <div class="main" :key="deviceKey" v-else-if="hidDevice || currPanel.component === 'panelAbout'">
      <KeepAlive>
        <component v-bind:is="currPanel.component" :hidDevice="hidDevice" ></component>
      </KeepAlive>
    </div>
    <div class="landing flex-center" v-else>
      <div class="logo hover" @click="gotoAbout"><span class="iconfont"></span> LeleConsole</div>
      <device-select></device-select>
    </div>
  </div>
</template>

<script>
import appTitlebar from "@/components/Titlebar";
import deviceSelect from "@/components/device-select";

const { ipcRenderer } = require("electron");
import path from 'path';
import panelKeymap from '@/components/panel/keymap.vue';
import panelMacro from '@/components/panel/macro.vue';
import panelLight from '@/components/panel/light.vue';
import panelFirmware from '@/components/panel/firmware.vue';
import panelTest from "@/components/panel/kb-test";
import panelKeyStat from "@/components/panel/kb-stat";
import panelAbout from "@/components/panel/about";
import panelFlash from "@/components/panel/flash";
export default {
  name: "LeleConsole",
  components: {
    appTitlebar,
    deviceSelect,
    panelKeymap,
    panelLight,
    panelMacro,
    panelFirmware,
    panelTest,
    panelKeyStat,
    panelAbout,
    panelFlash
  },
  data() {
    return {
      hidDevice: null,
      currPanel: {
        label: '',
        component: '',
      },
      deviceKey: '',
      flashMode: false,
    };
  },
  async created() {
    let lang = 'en';
    if (this.$store.getters.lang && this.$store.getters.lang !== 'none') {
      console.log('locale', this.$store.getters.lang);
      lang = this.$store.getters.lang;
    } else {
      let language = window.navigator.languages[0];
      language = language.slice(0, 2);
      if (['en', 'zh', 'de', 'fr', 'ja', 'ko', 'es'].indexOf(language) !== -1) {
        lang = language;
        this.$store.commit('SET_VIEW_STATE', {
          key: 'lang',
          val: lang,
        });
      }
    }
    this.$root.$i18n.locale = lang;

    ipcRenderer.on("message", (event, data) => {
      console.log(`[ipcRenderer] ${JSON.stringify(data)}`);
      if (data.cmd === "update-downloaded") {
        this.$buefy.dialog.confirm({
          message: this.$t("general.update_confirm"),
          confirmText: 'Yes',
          type: 'is-success',
          onConfirm: () => ipcRenderer.send("update-now")
        }).catch(() => { });
      }
      if (data.cmd === "flash-mode") {
        this.flashMode = true;
      }
    });
    await this.deviceCon.loadConfig();
    this.deviceCon.on('selectDevice', (d) => {
      this.hidDevice = d;
      this.deviceKey = this.hidDevice ? this.hidDevice.getDeviceInfo('id') : '';
    });
    this.deviceCon.regListener();
    const cssRule = `
    @font-face {
      font-family: 'iconfont';
      src: url('file:///${path.join(
      __extra,
      "font_2978685_jasds793a3m.woff2"
    ).replaceAll("\\", "/")}');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: "Arial Rounded MT Bold";
      src: url('file:///${path.join(__extra, "arial-rounded-mt-bold.woff").replaceAll("\\", "/")}');
    }
  `;

    const styleElement = document.createElement('style');
    styleElement.textContent = cssRule;
    document.head.appendChild(styleElement);
  },
  mounted() {
    ipcRenderer.send("check-update");
  },
  methods: {
    changePanel(p) {
      console.log('changePanel', p);
      this.currPanel = p;
    },
    gotoAbout() {
      this.deviceCon.emit('changePanel', ['panelAbout'])
    },
  },
};
</script>

<style lang="scss">
@import "~bulma";
@import "~buefy/src/scss/buefy";

.iconfont {
  font-family: "iconfont" !important;
  font-size: 26px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root {
  --bg-color: #000c03;
  --sub-color: #004913;
  --text-color: #21e455;
  --highlight-color: #7441ff;
  --highlight-bg: #14043E;
  --bg-opcacity-4: rgba(33, 228, 85, 0.4);
  --highlight-opcacity-2: rgba(#7441ff, 0.2);
  --text-color-opcacity-2: rgba(#21e455, 0.2);
}

*:focus {
  outline-style: none;
  box-shadow: none;
  border-color: transparent;
  background-color: var(--bg-color);
}

body {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-family: Consolas, "PingFangSC-Light", -apple-system, "PingFang SC",
    "Helvetica Neue", "Helvetica", "Microsoft YaHei", Arial, sans-serif;
  background: var(--bg-color);
  font-size: 14px;
  background: var(--bg-color);
}

*::-webkit-scrollbar {
  width: 0;
}

*::-webkit-scrollbar-track {
  background: var(--bg-color);
}

*::-webkit-scrollbar-thumb {
  background-color: var(--bg-color);
  border-radius: 0;
}

#overwrite {

  .input,
  .textarea,
  .taginput .taginput-container.is-focusable,
  .select select {
    background-color: transparent;
    color: var(--text-color);
    border: 1px solid var(--sub-color);
    box-shadow: none;
  }

  .hover:hover {
    text-shadow: #21E455 0px 0 8px;
    cursor: pointer;
  }

  .clear-hover {
    text-shadow: initial;
  }

  .button {
    background-color: transparent;
    color: var(--text-color);
    border: 1px solid var(--sub-color);
    box-shadow: none;
    background-color: var(--sub-color);
  }

  .label {
    color: var(--text-color);
    text-align: left;
    font-size: 14px;
  }

  .field.is-floating-label .label {
    color: var(--text-color);
  }

  .field.is-floating-label .label:before {
    background: var(--bg-color);
  }

  .tabs ul,
  .tabs a {
    border: none;
  }

  .tabs a {
    color: var(--text-color);
    background: var(--bg-color);
    border-bottom: 4px solid rgba(0, 0, 0, 0);
  }

  .tabs .is-active a {
    border-bottom: 4px solid var(--bg-opcacity-4);
  }

  .nav-tabs .item.active::after {
    display: block;
    position: relative;
    top: -12px;
    content: " ";
    width: 100%;
    height: 4px;
    background: var(--bg-opcacity-4);
  }

  .tabs.is-boxed a:hover {
    color: var(--text-color);
    background: var(--bg-color);
  }

  .select:not(.is-multiple):not(.is-loading)::after {
    border-color: var(--text-color);
  }

  .switch input[type="checkbox"]+.check {
    background: var(--sub-color);
    box-shadow: none;

    &::before {
      background: var(--bg-color);
    }
  }

  .switch input[type="checkbox"]:checked+.check {
    background: var(--text-color);

    &::before {
      background: whitesmoke;
    }
  }

  .b-tabs .tab-content {
    padding: 10px 0;
  }

  .b-tooltip.is-primary .tooltip-content {
    color: var(--text-color);
    background-color: var(--sub-color);
    word-break: break-word;
    font-size: 11px;
    padding: 3px 5px;
    max-width: 100px;
  }
  .panel.keymap .left .tab-panel {
    margin-left: 5px;
  }
  .panel.keymap .left .tab-content {
    margin-left: 5px;
    padding-right: 20px;
    
  }

  .b-tooltip.is-top.is-primary .tooltip-content::before {
    border-top-color: var(--sub-color);

  }

  

  .button.is-success {
    background: var(--sub-color);
    color: var(--text-color);
  }

  .button.is-success:hover {
    background: var(--text-color) !important;
    color: var(--sub-color);
  }

  .b-slider.is-success .b-slider-fill {
    background: var(--text-color) !important;
  }

  .tag:not(body) {
    color: var(--text-color);
    background: var(--sub-color);
  }

  .modal-card-body,
  .modal-card-foot {
    color: var(--text-color);
    background: var(--bg-color);
  }
}

.upload input {
  z-index: 2 !important;
  cursor: pointer;
}

.pointer {
  cursor: pointer;
}

.mb-20 {
  margin-bottom: 20px;
}

.loading-background {
  background: rgba(0, 0, 0, 0.9) !important;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.keyborder {
  border-radius: 4px;
  border: 1px solid rgb(20, 103, 33);
  color: var(--text-color);
  background: rgb(8, 34, 14);
}

.keylabels,
.keyborder {
  cursor: pointer;
}

.test .keyborder,
.test .keylabels {
  cursor: default;
}

.pressed .keyborder,
.pressed.keyborder {
  border-color: var(--highlight-color);
  background: rgb(10, 43, 16);
  border-width: 1px;
}

.active .keyborder,
.active.keyborder {
  border-width: 3px;
  border-color: var(--text-color);
  background: rgb(10, 43, 16);
}

.decal .keyborder {
  border-style: none !important;
  background: transparent !important;
}

.options h2 {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 20px;
}

.layout-options .field-label {
  flex-grow: 8;
  margin-right: 5px;
}

.layout-options .field-label label {
  font-weight: normal;
}

.layout-options .field-body {
  flex-grow: 2;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.panel {
  align-items: flex-start;
}

.modal-background {
  opacity: 0.3;
}

.modal-card {
  border-radius: 5px;
  border: 1px solid var(--text-color);
}

.multiselect__select,
.multiselect__tags,
.multiselect__content-wrapper {
  background: var(--bg-color);
  color: var(--text-color);
  border: none;
}

.multiselect__content-wrapper {
  border: 1px solid var(--text-color);
  font-size: 14px;

  .keyborder {
    width: min-content;
    height: 40px;
    min-width: 40px;
    font-size: 12px;
    padding: 2px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }
}

.multiselect__element {
  display: inline-block;
}

.multiselect__option {
  padding: 5px;
}

.multiselect__tag {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  width: min-content;
  height: 40px;
  min-width: 40px;
  border: 1px solid;
  color: var(--text-color);
  border: 1px solid rgba(33, 228, 85, 0.5);
  background-color: var(--sub-color);
  padding: 15px 20px 15px 15px;
}

.multiselect__content {
  display: flex !important;
  flex-wrap: wrap;
}

.multiselect__tag-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
}

.mod-tooltip {
  width: max-content;
  z-index: 9;
  position: absolute;
  font-size: 9px;
  width: 100%;
  word-break: break-word;
}

.mt-30 {
  margin-top: 30px;
}

.mt-20 {
  margin-top: 20px;
}

#app {
  animation: fade-in 0.5s ease forwards;
  position: relative;
  height: 100vh;
  width: 100%;
  max-width: initial;
  color: var(--text-color);
  background: var(--bg-color);
  word-break: break-all;

  .main {
    width: 100%;
    padding: 20px;
    margin: 0 auto;
    height: calc(100% - 80px);
    position: relative;
  }

  .landing {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 360px;
    margin: 0 auto;
    padding-top: 50px;

    .logo {
      font-family: Consolas, monospace;
      font-size: 28px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: center;

      .iconfont {
        font-size: 34px;
        margin-right: 15px;
      }
    }
  }
}

.modal-card {
  .modal-card-body {
    color: #000;
    font-size: 16px;
  }

  .modal-card-foot {
    background: #fff;
    border: none;
    padding: 15px;

    .button:not(.is-success) {
      background: #bbb;
      border: none;
    }
  }
}
</style>
