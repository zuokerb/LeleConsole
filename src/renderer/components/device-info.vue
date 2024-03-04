<template>
    <div class="intro sidebar">
        <div class="intro-title">{{ $t('configure.deviceInfo') }}</div>

        <battery v-if="active" :hidDevice="hidDevice" /> 
        <p>{{ $t('configure.manufacturer') }}: {{ hidDevice.getDeviceInfo('manufacturer') }}</p>
        <p>
            {{ $t('configure.vendorId') }}: {{
                hidDevice.getDeviceInfo('vendorId') | hexId
            }}
        </p>
        <p>
            {{ $t('configure.productId') }}: {{
                hidDevice.getDeviceInfo('productId') | hexId
            }}
        </p>
        <p>
            {{ $t('configure.serialNumber') }}: {{ hidDevice.getDeviceInfo('serialNumber') }}
        </p>
        <p>
            <span>{{ $t('configure.firmwareVersion') }}: {{ hidDevice.getDeviceInfo('release') | hexId }}
            </span>
        </p>
        <p v-if="uptime">
            <span>{{ $t('configure.uptime') }}:</span> <span>{{ uptimeStr }}</span>
        </p>

        <p>
            <span class="highlight">{{ $t('general.connect_by', { type: hidDevice.getDeviceInfo('is24G') ? '2.4G' : 'USB' }) }}</span>
            </p>

    </div>
</template>
  
<script>
import Battery from "@/components/battery";
export default {
    props: ['hidDevice'],
    components: {
        Battery
    },
    data() {
        return {
            uptime: 0,
            uptimeStr: '',
            uptimeTimer: null,
            layouts: [],
            active: false,
        }
    },
    mounted() {
        this.uptime = this.hidDevice.getDeviceInfo('uptime') / 1000;
        this.setUptimeStr();
    },
    activated() {
        this.uptime = this.hidDevice.getDeviceInfo('uptime') / 1000;
        this.setUptimeStr();
        this.active = true;
    },
    deactivated() {
        this.active = false;
    },
    methods: {
        setUptimeStr() {
            this.uptime = this.uptime + 1;
            let d = Math.floor(this.uptime / (3600 * 24));
            let h = Math.floor((this.uptime % (3600 * 24)) / 3600);
            let m = Math.floor((this.uptime % 3600) / 60);
            let s = Math.floor(this.uptime % 60);
            this.uptimeStr = `${d ? d + 'd' : ''} ${h.toString().padStart(2, 0)}:${m
                .toString()
                .padStart(2, 0)}:${s.toString().padStart(2, 0)}`;
            clearTimeout(this.uptimeTimer);
            this.uptimeTimer = setTimeout(() => {
                this.setUptimeStr();
            }, 1000);
        }
    },
    destroyed() {
        clearInterval(this.uptimeInterval);
    },
};
</script>
<style lang="scss" scoped>
.intro {
    .intro-title {
        font-size: 14px;
        font-weight: bold;
        margin-top: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--sub-color);
        margin-bottom: 20px;
    }

    p {
        margin-bottom: 10px;
        font-size: 12px;
        word-break: break-word;

        .highlight {
            color: var(--highlight-color);
        }
    }
}
</style>