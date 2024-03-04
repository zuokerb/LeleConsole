<template>
  <div class="battery-wrapper" v-if="batteryStatus">
    <i class="iconfont battery-icon">&#xe669;</i>

    <div class="battery-overlay">
      <i v-if="charging" class="iconfont charging">&#xe6af;</i>
      <template v-else>
        <div class="battery-power" :class="{ active: batteryStatus['percent'] > 20 }"></div>
        <div class="battery-power" :class="{ active: batteryStatus['percent'] > 40 }"></div>
        <div class="battery-power" :class="{ active: batteryStatus['percent'] > 80 }"></div>
      </template>
    </div>
    <div class="num">{{ batteryStatus['percent'] }}% {{ msg }}</div>
  </div>
</template>

<script>
export default {
  props: ['hidDevice'],
  data() {
    return {
      timer: null,
      batteryStatus: null,
    }
  },
  created() {
    this.refreshPercent();
  },
  methods: {
    async refreshPercent() {
      clearTimeout(this.timer);
      this.batteryStatus = await this.hidDevice.getBatteryStatus();
      this.timer = setTimeout(() => {
        this.refreshPercent();
      }, 10000);
    }
  },
  computed: {
    charging() {
      return this.batteryStatus && this.batteryStatus['charging']['enable'] && this.batteryStatus['charging']['charge'];
    },
    msg() {
      if (this.charging) return this.$t('general.charging');
      return this.$t('general.discharge');
    }
  },
  beforeDestroy() {
    clearTimeout(this.timer);
  }
};
</script>
<style lang="scss" scoped>
.battery-wrapper {
  width: 32px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  position: relative;
  margin-bottom: 20px;
  margin-top: 10px;
  font-size: 12px;
}

.battery-icon {
  transform: scaleX(1.2);
  font-size: 24px;
  position: absolute;
  left: 0;
  transform-origin: left;
}
.num {
  position: absolute;
  left: 42px;
  color: var(--text-color);
  width: max-content;
}
i.charging {
  transform: rotate(90deg);
  left: 7px;
  position: relative;
  font-size: 22px;
}

.battery-overlay {
  width: 24px;
  height: 14px;
  position: absolute;
  display: flex;
  left: 4px;
  color: var(--bg-color);
}

.battery-power {
  width: 4px;
  height: 10px;
  margin: 2px 2px 2px 0;
  display: inline-block;
  background: var(--bg-color);
  opacity: 0;

  &.active {
    opacity: 1;
  }
}


.battery-power-1_2,
.battery-power-2_2,
.battery-power-3_2,
.battery-power-4_2 {
  opacity: 0;
  background: var(--text-color);
}</style>
