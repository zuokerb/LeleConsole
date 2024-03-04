<template>
  <div v-if="loaded" class="device-tree-wrap" @click.prevent.stop>

    <div class="head">
      {{ devices.length ? $t('general.select_device') : $t('general.connect_device') }}
    </div>
    <div class="tree" v-if="devices.length" >
      <div class="tree-root" v-for="d of devices" :key="d.path">
        <div class="tree-node" @click.prevent.stop="selectDevice(d)"
          :class="{ active: d.isCurrDevice, hasChild: d.slaveDevices }">
          <div class="name">
            <span class="hover">{{ d.name ? d.name : d.product }}</span>
            <span v-if="d.firmware_version && d.firmware_version > d.release" class="new_firmware tag"> {{ $t('configure.new_firmware') }}</span>
          </div>
        </div>
        <template v-if="d.slaveDevices" >
          <div  v-for="slaver of d.slaveDevices" :key="slaver.id" class="tree-node children" @click.prevent.stop="selectDevice(d, slaver)"
            :class="{ active: d.isCurrDevice }">
            <div class="name"> <span class="hover">{{ slaver.name }}</span> </div>
          </div>
        </template>
      </div>
    </div>
  </div>
  <div v-else style="display: flex;align-items: center;justify-content: center;">
    <b-loading :is-full-page="false" :active="true" :can-cancel="false"></b-loading>
  </div>
</template>

<script>
export default {
  name: "device-select",
  data() {
    return {
      devices: [],
      refreshTimer: null,
      loaded: false,
    };
  },
  async created() {
    this.deviceCon.on('refreshDeviceList', this.refreshDeviceList);
    await this.refreshDeviceList(true);
    this.loaded = true;
  },
  destroyed() {
    clearTimeout(this.refreshTimer);
  },
  methods: {
    async refreshDeviceList(setTimer = false) {
      this.devices = await this.deviceCon.listDevice();
      
      if (setTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => {
          this.refreshDeviceList(true);
        }, 2000);
      }
    },
    selectDevice(device, slaver) {
      if (device.isCurrDevice) return;
      this.deviceCon.selectDevice(device, slaver);
      this.$emit('close');
    }
  },
};
</script>
<style scoped lang="scss">
.device-tree-wrap {
  min-width: 260px;
  margin: 20px 0;
  border: 1px solid var(--text-color);
  border-radius: 5px;
  overflow: hidden;
}

.head {
  padding: 0 20px;
  height: 40px;
  line-height: 40px;
  background: var(--sub-color);
  position: relative;
}

.tree {
  background-color: var(--bg-color);
  padding: 10px 0;
}

.tree-root {
  margin-bottom: 4px;
}

.tree-node {
  cursor: pointer;
  padding: 0 25px;
  width: 100%;
  min-width: max-content;

  &.active {
    background-color: var(--highlight-bg);
  }

  .name {
    position: relative;
    display: inline-block;
    height: 40px;
    line-height: 40px;

    .tag {
      font-size: 9px;
      margin: 0 10px;
      padding: 2px 5px;
      position: relative;

      &.new_firmware {
        padding: 3px 10px;
        color: var(--highlight-color) !important;
        border-radius: 20px;
        background: var(--highlight-bg) !important;
        bottom: 6px;
        margin: 0;
      }
    }
  }



  &.children {
    position: relative;
    padding-left: 60px;
    cursor: pointer;
    margin-top: 0;

    &::before {
      display: inline-block;
      content: " ";
      width: 30px;
      height: 60%;
      border-left: 1px solid var(--text-color);
      border-bottom: 1px solid var(--text-color);
      position: absolute;
      left: 28px;
      bottom: 18px;
    }
  }

}
</style>
  