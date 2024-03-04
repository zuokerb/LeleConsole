<template>
  <nav class="titlebar flex-center">
    <div class="nav-wrap flex-center" :style="{ paddingRight: currPanel === 'panelAbout' ? '0' : '200px' }"
      v-if="hidDevice || currPanel === 'panelAbout'">
      <div class="nav-tabs flex-center">
        <template v-if="currPanel === 'panelAbout'">
          <div class="item" style="margin: 5px 300px 0;">
            <div class="logo flex-center hover">
              <span class="iconfont pig"></span><i class="iconfont text">&#xe601;</i>
              <span class="version">v{{ version }}</span>
            </div>
          </div>
          <div class="Icon-wrapper close hover" style="position: absolute;right: 10px;"
            @click.prevent.stop="back">
            <i class="iconfont" style="font-size: 16px;">&#xe63e;</i>
          </div>
        </template>
        <template v-else>
          <div v-for="tab of confTabs" class="item hover" v-if="!tab.disable" :key="tab.component"
            :class="{ active: tab.component === currPanel }" @click="changePanel(tab.component)">
            <div>{{ $t(`configure.${tab.label}`) }}</div>
          </div>
          <div class="item last">
            <div class="device-badge flex-center">
              <div class="hover flex-center" @click="toggleSelect">
                <div class="flex-center bt-change-device" >
                  <i class="iconfont">&#xe6df;</i> <span class="device-name ">{{ hidDevice.getDeviceInfo('name') }}</span>
                </div>
                <div class="caret-bottom">
                  <i class="iconfont">&#xe603;</i>
                  <div v-if="selectOpened" class="select-panel clear-hover">
                    <device-select @close="hideSelect"></device-select>
                  </div>
                </div>
              </div>
              <div class="Icon-wrapper close hover" @click.prevent.stop="reset">
                <i class="iconfont" style="font-size: 16px;">&#xe63e;</i>
              </div>
            </div>

            <div class="header-logo flex-center">
              <div class="connect-type flex-center">
                <div class="left-arrow">
                  <span class="arrow left"></span>
                  <span class="line"></span>
                  <span class="arrow right"></span>
                </div>
                <span class="type">{{ hidDevice.getDeviceInfo('is24G') ? '2.4G' : 'USB' }}</span>
              </div>
              <div class="logo flex-center hover" @click.prevent.stop="changePanel('panelAbout')">
                <span class="iconfont pig"></span><i class="iconfont text">&#xe601;</i>
                <span class="version">v{{ version }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div v-if="isNotMac" class="Icon-group flex-center">
      <div class="Icon-wrapper close hover" @click.prevent.stop="winClose">
       <i class="iconfont" style="font-size: 16px;">&#xe63e;</i>
      </div>
      <div class="Icon-wrapper minimize hover" @click.prevent.stop="winMinimize">
        <i class="iconfont" style="font-size: 16px;">&#xf04f;</i>
      </div>
    </div>
  </nav>
</template>

<script>
import { ipcRenderer } from 'electron'
import { isMacOSPlatform } from "@/utils/global";
import * as pckg from '../../../package.json';
import deviceSelect from "@/components/device-select";
export default {
  props: ['hidDevice'],
  components: {
    deviceSelect,
  },
  data: function () {
    return {
      version: pckg.version,
      isNotMac: !isMacOSPlatform,
      currPanel: '',
      selectOpened: false,
      confTabs: [
        {
          label: 'keymap',
          component: 'panelKeymap',
          disable: 1,
          sidebar: 0,
        },
        {
          label: 'macro',
          component: 'panelMacro',
          disable: 1,
          sidebar: 1,
        },
        {
          label: 'light',
          component: 'panelLight',
          disable: 1,
          sidebar: 1,
        },
        {
          label: 'key_test',
          component: 'panelTest',
          disable: 1,
        },
        {
          label: 'stat',
          component: 'panelKeyStat',
          disable: 1,
        },
        {
          label: 'firmware',
          component: 'panelFirmware',
          disable: 0,
          sidebar: 1,
        },
        {
          label: 'about',
          component: 'panelAbout',
          disable: 1,
          sidebar: 0
        },
      ],
      lastPanel: '',

    };
  },
  watch: {
    "hidDevice.info.layout": function (val) {
        this.setDeviceTabs(this.hidDevice);
    }
  },
  created() {
    if (this.hidDevice) {
      this.setDeviceTabs(this.hidDevice);
    }

    this.deviceCon.on('changePanel', (d) => {
      this.changePanel(d)
    });
  },
  methods: {
    toggleSelect() {
      if (this.selectOpened) {
        return this.hideSelect()
      }
      return this.showSelect()
    },
    showSelect() {
      this.selectOpened = true;
      setTimeout(() => document.addEventListener('click', this.hideSelect), 0);
    },
    hideSelect() {
      document.removeEventListener('click', this.hideSelect);
      this.selectOpened = false;
    },

    winClose() {
      ipcRenderer.send('window-close')
    },
    setDeviceTabs(device) {
      this.confTabs = this.confTabs.map((tab) => {
        const layouts = device.getDeviceInfo('layouts');
        const isHub = device.info.isHub;

        if (layouts && ['panelKeymap', 'panelMacro', 'panelTest'].indexOf(tab.component) !== -1) {
          tab.disable = isHub && !device.getDeviceInfo('isSlave') ? 1 : 0;
        }
        if (tab.component === 'panelLight') {
          const lightPreset = device.getDeviceInfo('lightPreset');
          tab.disable = lightPreset || device.getDeviceInfo('menus') ? 0 : 1;
        }
        if (tab.component === 'panelKeyStat' && this.hidDevice.getDeviceInfo('vendorId') == 0xCA21 && this.hidDevice.getDeviceInfo('productId') == 0x6000) {
          tab.disable = 0;
        }
        return tab;
      });
      const activeTab = this.confTabs.find(t => !t.disable);
      if (activeTab) this.changePanel(activeTab.component);
    },
    winMinimize() {
      ipcRenderer.send('window-minimize')
    },
    changePanel(tab) {
      this.lastPanel = this.currPanel;
      this.currPanel = tab;
      const panel = this.confTabs.filter(t => t.component === this.currPanel)[0];
      this.$emit('changePanel', panel);
    },
    reset() {
      this.changePanel('panelKeymap');
      this.deviceCon.reset();
    },
    back() {
      if (this.lastPanel) {
        this.changePanel(this.lastPanel);
        return;
      }
      this.reset();
    }
  }
}
</script>

<style lang="scss">
.titlebar {
  position: relative;
  height: 80px;
  -webkit-app-region: drag;

  .nav-wrap {
    -webkit-app-region: no-drag;
    margin-top: 10px;
    width: 100%;
    padding-right: 200px;
    border-bottom: 1px solid var(--text-color);

    .nav-tabs {
      padding-right: 60px;
      background-color: var(--bg-color);
      border: 1px solid var(--text-color);
      border-bottom: none;
      border-radius: 10px 10px 0 0;
      z-index: 2;
      padding: 6px 0 6px 10px;
      position: relative;
      bottom: -1px;

      .item {
        cursor: pointer;
        height: 40px;
        box-sizing: border-box;
        line-height: 40px;
        display: inline-block;
        font-size: 14px;
        position: relative;
        margin: 0 30px;
        font-weight: bold;

        &.last {
          margin-right: 0;
        }
      }
    }

  }

  .device-badge {
    position: relative;
    z-index: 2;
    padding: 0 10px;
    height: 100%;

    .bt-change-device {
      padding: 0 18px 1px;
      border-radius: 21px;
      opacity: 1;
      background: rgba(33, 228, 85, 0.26);
    }

    .device-name {
      margin-left: 10px;
    }

    .caret-bottom {
      margin: 0 8px 0 12px;

      i {
        font-size: 16px;
      }

      .select-panel {
        position: absolute;
        right: 10px;
        top: 30px;
        z-index: 9;

      }
    }

  }

  .Icon-group {
    -webkit-app-region: no-drag;
    width: 60px;
    position: fixed;
    left: 15px;
    top: 15px;
    justify-content: space-between;
    z-index: 9;
  }

  .header-logo {
    position: absolute;
    z-index: 1;
    bottom: -10px;
    left: 100%;
    height: 56px;





    .connect-type {
      position: relative;
      margin-left: -35px;
      margin-right: 10px;
      bottom: 0;
      font-size: 12px;
      width: 120px;
      cursor: default;

      .left-arrow {
        position: absolute;
        top: 0;
        bottom: 0;
        transform: rotate(-90deg);

        .line {
          border-right: 2px dashed var(--text-color);
          display: inline-block;
          height: 5rem;
        }

        .arrow {
          position: absolute;
          top: -0.3rem;
          bottom: 0;
          height: 1rem;
          border-right: 2px solid var(--text-color);
          display: inline-block;
        }

        .right {
          left: 0.3rem;
          transform: rotate(-45deg);
        }

        .left {
          right: 0.3rem;
          transform: rotate(45deg);
        }
      }

      .iconfont {
        font-size: 56px;
        position: absolute;
        height: 40px;
      }

      .type {
        position: relative;
        left: 18px;
        bottom: 10px;
        font-size: 12px;
      }
    }
  }

  .logo {
    position: relative;

    .text {
      font-size: 20px;
    }

    .pig {
      position: relative;
      top: -2px;
      font-size: 32px;
      margin-right: 10px;
      font-weight: normal;
    }

    .version {
      position: absolute;
      top: -12px;
      right: -30px;
      font-size: 10px;
    }
  }

  .Icon-wrapper {
    padding: 4px;
  }
}</style>
