<template>
    <b-tabs v-model="activeTab" class="kb-preset" :animated="false">
        <b-tab-item :label="$t('configure.fast_config')">
            <div class="preset-card pointer" v-for="preset of presets" @mouseenter="setPreviewKeymap(preset, 0)"
                @mouseleave="setPreviewKeymap()">

                <div>{{ preset.name }}
                    <div class="layer-nav" v-if="preset.layers && preset.layers.length > 1">
                        <template v-for="l of preset.layers">
                            <span class="layer-idx" :class="{ active: activePreset && activePreset.name == preset.name && activeLayer == l.layer }"
                                @mouseenter="setPreviewKeymap(preset, l.layer)">{{ l.layer }}</span>
                        </template>
                    </div>
                </div>
                <div class="set-row" style="margin-top: 10px;">
                    <div class="btn" @click.prevent.stop="applyPreset(false)">{{ $t('configure.set_curr_layer') }}</div>
                    <div class="btn" v-if="preset.enable_all" @click.prevent.stop="applyPreset(true)">{{
                        $t('configure.set_all_layer')
                    }}</div>
                </div>
            </div>
        </b-tab-item>

        <b-tab-item :label="$t('general.help')" icon="question-circle">
            <div style="padding: 10px;">
                <br />
                <b-icon icon="question-circle" size="is-small" :style="`position:relative;top:2px;left: -2px;`"></b-icon><span v-html="$t('configure.help_text')"></span>
            </div>
        </b-tab-item>
    </b-tabs>
</template>
  
<script>
import debounce from 'lodash/debounce';


export default {
    props: ['hidDevice'],
    components: {
    },
    data() {
        return {
            activeTab: 0,
            activeLayer: 0,
            presets: [
                {
                    name: this.$t('configure.clear_all'),
                    enable_all: 0,
                    type: 'clear',
                }
            ],
            activePreset: null
        }
    },
    async created() {
        const presets = this.hidDevice.getDeviceInfo('keymap_presets');
        if (presets && presets.length) {
            presets.map(p => {
                let layers = [];
                Object.keys(p.keymap).map(k => {
                    layers.push({
                        layer: parseInt(k),
                        keys: p.keymap[k]
                    });
                });

                this.presets.unshift({
                    name: p.name,
                    enable_all: 1,
                    layers: layers
                });
            });
            return;
        }
        const factoryConf = this.hidDevice.getDeviceInfo('factory_config');
        if (factoryConf && factoryConf.keymap) {
            let layers = [];
            Object.keys(factoryConf.keymap).map(k => {
                layers.push({
                    layer: parseInt(k),
                    keys: factoryConf.keymap[k]
                });
            });

            this.presets.unshift({
                name: this.$t('reset_factory'),
                enable_all: 1,
                layers: layers
            });
        }

    },
    methods: {
        setPreviewKeymap: debounce(function (preset, layer) {
            let keys = null;
            if (preset) {
                keys = preset.type === 'clear' ? 'clear' : preset.layers[layer].keys;
            }
            this.activePreset = preset;
            this.activeLayer = layer;
            this.$emit('setPreviewKeymap', keys);
        }, 200),
        applyPreset(allLayer = false) {
            console.log('applyPreset', allLayer, this.activePreset);
            if (!this.activePreset) return;
            if (this.activePreset.type === 'clear') {
                this.$emit('clearCurrLayer');
                return;
            }

            if (allLayer) {
                this.$emit('applyPresetAllLayer', this.activePreset.layers);
            } else {
                this.$emit('applyPreset', this.activePreset.layers[this.activeLayer].keys);
            }
        }
    },
};
</script>
<style lang="scss">
.kb-preset.b-tabs {
    color: var(--highlight-color) !important;

    .tabs {
        border-bottom: 1px solid var(--highlight-color);
        margin: 10px 0 0 0;

        .icon {
            margin-right: 5px !important;
            font-size: 14px;
        }
    }

    .is-active a {
        border-bottom-color: var(--highlight-color) !important;
    }

    a {
        margin: 0 7px;
        padding: 5px 6px 5px 2px;
        color: var(--highlight-color) !important;
    }

    .tab-content {
        max-height: 660px;
        overflow: scroll;
        font-size: 12px;
    }
}
</style>
<style lang="scss" scoped>
.preset-card {
    position: relative;
    width: 100%;
    margin: 20px 0;
    padding: 14px 16px;
    border-radius: 5px;
    background: var(--highlight-opcacity-2);
    box-sizing: border-box;
    border: 1px solid var(--highlight-color);
    color: var(--highlight-color);
    transition: max-height 0.2s ease-out;
    max-height: 48px;
    overflow: hidden;
    &:hover {
        max-height: 300px;
    }

    .layer-nav {
        position: absolute;
        right: 20px;
        top: 12px;
        border-radius: 5px;
        opacity: 1;
        background: rgba(#7441FF, 0.14);
    }

    .layer-idx {
        display: inline-block;
        padding: 2px 7px;
        opacity: 0.5;

        &.active {
            opacity: 1;
        }
    }

    .set-row {
        text-align: right;
        .btn {
            padding: 4px 10px;
            border-radius: 100px;
            box-sizing: border-box;
            border: 1px solid var(--highlight-color);
            display: inline-block;
            margin-top: 10px;

            &:hover {
                border: 1px solid var(--text-color);
                color: var(--text-color);
            }
        }
    }

}
</style>

