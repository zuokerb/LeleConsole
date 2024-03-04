<template>
    <div class="panel" style="margin: 0 100px;">
        <div style="margin:  30px 0 10px;">选择固件</div>
        <b-select expanded @input="(d) => firmware = d">
            <option :value="null">请选择</option>
            <option v-for="device of firmwares" :value="device" :key="device.name">
                {{ device.name }} {{ $t('general.version') }}:{{ device.firmware_version }}
            </option>
        </b-select>
        <template v-if="firmware">
            <div style="margin: 30px 0 10px;">设备列表</div>
            <div v-for="p of ports" @click="port = p" class="device" :class="{ active: port === p }">{{ traverseObject(p) }}
            </div>
            <div v-if="!ports.length">find device...</div>
        </template>

        <b-button v-if="firmware && port" style="margin: 20px 0 10px;" type="is-success"
            @click.once.stop="startFlash">写入</b-button>

        <b-button v-if="finish" style="margin: 20px 0 10px;" type="is-success"
            @click.once.stop="reload">{{ $t('general.finish') }}</b-button>
            
    </div>
</template>
  
<script>
const fs = require("fs");
const usb = require('usb');
const { DfuUpdates, DfuTransportSerial, DfuOperation } = require("pc-nrf-dfu-js");
const { avrdudeFlash } = require('@/utils/global');
import { fetchRemoteConfig, download } from "@/utils/kb-helper.js";
const { SerialPort } = require("serialport");
export default {
    name: 'firmware',
    data() {
        return {
            ports: [],
            firmwares: [],
            port: null,
            firmware: null,
            loading: true,
            timer: null,
            finish: false
        }
    },
    async mounted() {
        let devices = await fetchRemoteConfig("config/devices.json");
        for (let i = 0; i < devices.length; i++) {
            const d = devices[i];
            let config = await fetchRemoteConfig(d["config"], true);
            if (config.firmware_file) {
                this.firmwares.push(config);
            }
        }
        this.refreshPort();
        this.loading = false;
    },
    methods: {
        traverseObject(obj, prefix = '') {
            return (prefix ? prefix + ":" : '') + Object.entries(obj).flatMap(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return this.traverseObject(value, key);
                } else {
                    return `${key}:${value}`;
                }
            }).join(prefix ? ',' : '\n');
        },
        async refreshPort() {
            if (this.firmware) {
                if (this.firmware && this.firmware.firmware_mode === 'avrdude') {
                    let ports = usb.findByIds(0x16c0, 0X05dc);
                    console.log('avrdude', ports);
                    this.ports = [ports];
                } else {
                    let ports = await SerialPort.list();
                    console.log('SerialPort', ports);
                    this.ports = ports.filter(p => p.vendorId == "1915" && p.productId.toLowerCase() == "521f");
                }
            }

            this.timer = setTimeout(() => {
                this.refreshPort();
            }, 1000);
        },
        async startFlash() {
            if (!this.firmware || !this.port) return;
            const file = await download(
                `https://d.lelelab.work/${this.firmware.firmware_file}`,
                true
            );
            if (this.firmware.firmware_mode === 'avrdude') {
                await avrdudeFlash(file);
                this.finish = true;
            } else {
                this.flashFirmware(this.port, file);
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
                    this.finish = true;
                })
                .catch((err) => {
                    console.log('DfuUpdateFail:', err);
                });
        },
        reload() {
            location.reload();
        }

    },
};
</script>
<style lang="scss" scoped>
.panel {
    padding-top: 30px;

    .device {
        width: 100%;
        display: block;
        font-size: 12px;
        padding: 10px;
        white-space: break-spaces;
        border: 1px solid;
        border-radius: 10px;
        cursor: pointer;

        &:hover {
            background: var(--highlight-bg);

        }

        &.active {
            background: var(--bg-opcacity-4);
        }
    }

}
</style>
<style lang="scss">
.step-label .step-title {
    font-size: 14px !important;
    position: relative;
    top: 10px;
}

.step-item.is-active .step-title {
    color: var(--text-color) !important;
}
</style>
  