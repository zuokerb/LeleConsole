<template>
  <div class="panel-wrap light" style="padding: 0 140px 0 120px;" v-if="(lightPreset || v3Meun) && loaded">
    <template v-if="lightPreset">
      <b-field v-if="lightPreset.supportedLightingValues.indexOf(LightingValue.BACKLIGHT_EFFECT) > -1" horizontal
        :label="$t('light.rgbEffect')">
        <b-select v-model="backlightEffect">
          <option v-for="effect of backlightEffects" :key="effect.name" :value="effect.id">{{ $t(`light.${effect.name}`)
          }}
          </option>
        </b-select>
      </b-field>
      <b-field v-if="showBackBrightness" horizontal :label="$t('light.rgbBrightness')" class="brightness">
        <b-slider v-model="backlightBrightness" type="is-success" :min="0" :max="maxBrightness"></b-slider>
      </b-field>
      <b-field v-if="showSaturation" horizontal :label="$t('light.saturation')">
        <b-slider v-model="color1.saturation" type="is-success" :min="0" :max="100">
        </b-slider>
      </b-field>

      <b-field v-if="showBackSpeed" :style="'width: 50%;'" horizontal :label="$t('light.rgbRate')">
        <b-slider v-model="backlightSpeed" type="is-success" :min="0" :max="4">
        </b-slider>
      </b-field>

      <b-field horizontal v-if="showColor1" :label="$t('light.rgbColor') + '1'" class="color">
        <color-picker :change="setColor1" :initial="color1" />
      </b-field>
      <b-field horizontal v-if="showColor2" :label="$t('light.rgbColor') + '2'" class="color">
        <color-picker :change="setColor2" :initial="color2" />
      </b-field>

      <b-field v-if="lightPreset.supportedLightingValues.indexOf(LightingValue.QMK_RGBLIGHT_EFFECT) > -1" horizontal
        :label="$t('light.underglowEffect')" class="divied">
        <b-select v-model="qmkLightEffect">
          <option v-for="(k, v) of qmkLightEffects" :key="v" :value="v">{{ $t(`light.${k.replace(/\d+$/g, '')}`) +
            (k.match(/\d+$/) ? k.match(/\d+$/)[0] : '') }}</option>
        </b-select>
      </b-field>

      <b-field v-if="lightPreset.supportedLightingValues.indexOf(LightingValue.QMK_RGBLIGHT_BRIGHTNESS) > -1" horizontal
        :label="$t('light.underglowBrightness')" class="brightness">
        <b-slider v-model="qmkLightBrightness" type="is-success" :min="0" :max="255"></b-slider>
      </b-field>

      <b-field v-if="lightPreset.supportedLightingValues.indexOf(LightingValue.QMK_RGBLIGHT_EFFECT_SPEED) > -1" horizontal
        :label="$t('light.underglowSpeed')">
        <b-slider v-model="qmkLightSpeed" type="is-success" :min="0" :max="4">
        </b-slider>
      </b-field>

      <b-field v-if="showQmkColor" horizontal :label="$t('light.underglowColor')">
        <color-picker :change="setQMKColor" :initial="qmkColor" />
      </b-field>

      <template v-if="showLeleMiniBar">
        <b-field horizontal :label="$t('minibar') + ' ' + $t('light.rgbEffect')" class="divied">
          <b-select v-model="minibar.effect">
            <option v-for="(k, v) of miniBarEffects" :key="v" :value="v">{{ $t(`light.minibar.${k.replace(/\d+$/g, '')}`)
              +
              (k.match(/\d+$/) ? k.match(/\d+$/)[0] : '') }}</option>
          </b-select>
        </b-field>
        <b-field horizontal v-if="showMinibarBrightness" :label="$t('minibar') + ' ' + $t('light.rgbBrightness')"
          class="brightness">
          <b-slider v-model="minibar.brightness" type="is-success" :min="0" :max="254"></b-slider>
        </b-field>
        <b-field :style="'width: 50%;'" horizontal v-if="showMinibarSpeed"
          :label="$t('minibar') + ' ' + $t('light.rgbRate')">
          <b-slider v-model="minibar.effect_speed" type="is-success" :min="0" :max="4">
          </b-slider>
        </b-field>
        <b-field horizontal v-if="showMinibarColor1" :label="$t('minibar') + ' ' + $t('light.rgbColor') + '1'"
          class="color">
          <color-picker :change="setMinibarColor1" :initial="minibar.color1" />
        </b-field>
      </template>

      <template v-if="showLelepwm">
        <b-field horizontal :label="$t('pwm.side') + ' ' + $t('light.rgbEffect')" class="divied">
          <b-select v-model="pwm.side.effect">
            <option v-for="(k, v) of sidePwmEffects" :key="v" :value="v">{{ $t(`light.pwm.${k.replace(/\d+$/g, '')}`) +
              (k.match(/\d+$/) ? k.match(/\d+$/)[0] : '') }}</option>
          </b-select>
        </b-field>
        <b-field horizontal v-if="showSidePwmBrightness" :label="$t('pwm.side') + ' ' + $t('light.rgbBrightness')"
          class="brightness">
          <b-slider v-model="pwm.side.brightness" type="is-success" :min="0" :max="10000"></b-slider>
        </b-field>
        <b-field :style="'width: 50%;'" horizontal v-if="showSidePwmSpeed"
          :label="$t('pwm.side') + ' ' + $t('light.rgbRate')">
          <b-slider v-model="pwm.side.effect_speed" type="is-success" :min="0" :max="255">
          </b-slider>
        </b-field>


        <b-field horizontal :label="$t('pwm.bottom') + ' ' + $t('light.rgbEffect')" class="divied">
          <b-select v-model="pwm.bottom.effect">
            <option v-for="(k, v) of bottomPwmEffects" :key="v" :value="v">{{ $t(`light.pwm.${k.replace(/\d+$/g, '')}`) +
              (k.match(/\d+$/) ? k.match(/\d+$/)[0] : '') }}</option>
          </b-select>
        </b-field>
        <b-field horizontal v-if="showBottomPwmBrightness" :label="$t('pwm.bottom') + ' ' + $t('light.rgbBrightness')"
          class="brightness">
          <b-slider v-model="pwm.bottom.brightness" type="is-success" :min="0" :max="10000"></b-slider>
        </b-field>
        <b-field :style="'width: 50%;'" horizontal v-if="showBottomPwmSpeed"
          :label="$t('pwm.bottom') + ' ' + $t('light.rgbRate')">
          <b-slider v-model="pwm.bottom.effect_speed" type="is-success" :min="0" :max="255">
          </b-slider>
        </b-field>

      </template>
    </template>

    <template v-if="v3Meun">
      <div v-for="meun of v3Meun">
        <div v-for="field of commonMenus[meun][0]['content'][0]['content']">
          <template v-if="!field.showIf || checkShow(field.showIf)">
            <b-field v-if="field.type === 'dropdown'" horizontal :label="$t(`light.${field.label}`)" class="divied">
              <b-select v-model="v3MenuProp[field.content[0]]" @input="(v) => changeV3Prop(v, field)">
                <option v-for="(k, v) of field['options']" :key="v" :value="v">{{ k }}</option>
              </b-select>
            </b-field>

            <b-field v-if="field.type === 'range'" horizontal
              :label="$t(`light.${field.label}`)" class="brightness">
              <b-slider v-model="v3MenuProp[field.content[0]]" @input="(v) => changeV3Prop(v, field)" type="is-success" :min="field['options'][0]" :max="field['options'][1]"></b-slider>
            </b-field>

            <b-field v-if="field.type === 'color'" horizontal
              :label="$t(`light.${field.label}`)" class="brightness">
              <color-picker :change="(v) => changeV3ColorProp(v, field)" :initial="v3MenuProp[field.content[0]]" />
            </b-field>

          </template>
            

        </div>
      </div>

    </template>
    


  </div>
  <div v-else style="display: flex;align-items: center;justify-content: center;">
    <b-loading :is-full-page="false" :active="true" :can-cancel="false"></b-loading>
  </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep';
import ColorPicker from '@/components/picker';
import { LightingValue, LightingTypeDefinition } from '@/config/lighting-presets';
import commonMenus from "@/components/menus/index.js";
import {
  CmdId
} from "@/utils/kb-const.js";
export default {
  name: 'light',
  props: ['hidDevice'],
  components: { ColorPicker },
  data() {
    return {
      loaded: false,
      LightingValue,
      backlightEffect: '',
      backlightBrightness: 0,
      backlightSpeed: 0,
      qmkLightBrightness: 0,
      qmkLightEffect: '',
      qmkLightSpeed: 0,
      qmkColor: {
        hue: 50,
        saturation: 100,
        luminosity: 50,
        alpha: 1
      },
      color1: {
        hue: 50,
        saturation: 100,
        luminosity: 50,
        alpha: 1
      },
      color2: {
        hue: 50,
        saturation: 100,
        luminosity: 50,
        alpha: 1
      },
      minibar: {
        brightness: 0,
        effect: '',
        effect_speed: 0,
        color1: {
          hue: 50,
          saturation: 100,
          luminosity: 50,
          alpha: 1
        },
        color2: {
          hue: 50,
          saturation: 100,
          luminosity: 50,
          alpha: 1
        },
      },
      pwm: {
        side: {
          brightness: 0,
          effect: '',
          effect_speed: 0,
        },
        bottom: {
          brightness: 0,
          effect: '',
          effect_speed: 0,
        }
      },
      v3MenuProp: {},
      commonMenus: commonMenus
    };
  },
  mounted() {
    this.hidDevice.getAllLightConfig().then((res) => {
      console.log('getAllLightConfig', res);
      this.backlightBrightness = res.backlightBrightness;
      this.backlightEffect = res.backlightEffect;
      this.backlightSpeed = res.backlightSpeed;
      if (res.qmkLightBrightness !== undefined) {
        this.qmkLightBrightness = res.qmkLightBrightness;
        this.qmkLightEffect = res.qmkLightEffect;
        this.qmkLightSpeed = res.qmkLightSpeed;
        this.qmkColor.hue = res.qmkColor.hue;
        this.qmkColor.saturation = this.getOriginValueForLinerInterpolation(res.qmkColor.sat);
      }

      this.color1.hue = res.color1.hue;
      this.color1.saturation = this.getOriginValueForLinerInterpolation(res.color1.sat);
      this.color2.hue = res.color2.hue;
      this.color2.saturation = this.getOriginValueForLinerInterpolation(res.color2.sat);

      if (!this.showLeleMiniBar && !this.showLelepwm && !this.v3Meun) {
        this.markLoaded();
        return;
      }
      let waitPromise = [];
      if (this.showLelepwm) {
        waitPromise.push(new Promise((resolve) => {
          this.hidDevice.getLelepwmConfig().then((res) => {
            this.pwm.side = res.side;
            this.pwm.bottom = res.bottom;
            resolve();
          })
        }));
      }
      if (this.showLeleMiniBar) {
        waitPromise.push(new Promise((resolve) => {
          this.hidDevice.getMinibarLightConfig().then((res) => {
            this.minibar.brightness = res.brightness;
            this.minibar.effect = res.effect;
            this.minibar.effect_speed = res.effect_speed;
            this.minibar.color1.hue = res.color1.hue;
            this.minibar.color1.saturation = this.getOriginValueForLinerInterpolation(res.color1.sat);
            this.minibar.color2.hue = res.color2.hue;
            this.minibar.color2.saturation = this.getOriginValueForLinerInterpolation(res.color2.sat);
            resolve();
          })
        }));
      }
      if (this.v3Meun) {
        Object.keys(commonMenus).filter((k) => this.v3Meun.indexOf(k) !== -1).map((k) => {
          commonMenus[k][0]['content'][0]['content'].map((v) => {
            
              waitPromise.push(new Promise((resolve) => {
                this.hidDevice.sendRowData(CmdId.get_custom_value, [v.content[1], v.content[2]]).then((res) => {
                  console.log(v.content[0], res);
                  if (v.type === 'range') {
                    this.$set(this.v3MenuProp, v.content[0], res[0]);
                  } else if (v.type === 'dropdown') {
                    this.$set(this.v3MenuProp, v.content[0], res[0]);
                  }  else if (v.type === 'color') {
                    this.$set(this.v3MenuProp, v.content[0], {
                      hue: Math.floor((res[0] / 255) * 360),
                      saturation: this.getOriginValueForLinerInterpolation(res[1]),
                    });
                  }
                  resolve();
                })
              }));
            
          });
        });
      }

      Promise.all(waitPromise).then(() => {
        this.markLoaded();
      });
    });
  },
  methods: {
    markLoaded() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.loaded = true;
        }, 200);
      });
    },
    checkShow(condition) {
      const cmd = condition.replaceAll('v3MenuProp', 'this.v3MenuProp');
      return eval(cmd);
    },
    changeV3Prop(v, field) {
      if (!this.loaded) return;
      this.hidDevice.sendRowData(CmdId.set_custom_value, [field.content[1], field.content[2], v])
    },
    changeV3ColorProp(v, field) {
      this.hidDevice.sendRowData(CmdId.set_custom_value, [field.content[1], field.content[2], Math.floor(v.h / 360 * 255), this.linearInterpolation(v.s)])
    },

    setColor1: function (color) {
      this.color1.hue = color.h;
      this.color1.saturation = color.s;
      console.log(this.color1);
      this.hidDevice.debounceSetLightValue(LightingValue.BACKLIGHT_COLOR_1, Math.floor(this.color1.hue / 360 * 255), this.linearInterpolation(this.color1.saturation));
    },
    setColor1Saturation: function () {
      this.hidDevice.debounceSetLightValue(LightingValue.BACKLIGHT_COLOR_1, Math.floor(this.color1.hue / 360 * 255), this.linearInterpolation(this.color1.saturation));
    },
    setColor2: function (color) {
      this.color2.hue = color.h;
      this.color2.saturation = color.s;
      this.hidDevice.debounceSetLightValue(LightingValue.BACKLIGHT_COLOR_2, Math.floor(this.color2.hue / 360 * 255), this.linearInterpolation(this.color2.saturation));
    },
    setQMKColor: function (color) {
      this.qmkColor.hue = color.h;
      this.qmkColor.saturation = color.s;
      this.hidDevice.debounceSetLightValue(LightingValue.QMK_RGBLIGHT_COLOR, Math.floor(this.qmkColor.hue / 360 * 255), this.linearInterpolation(this.qmkColor.saturation));
    },
    setMinibarColor1: function (color) {
      this.minibar.color1.hue = color.h;
      this.minibar.color1.saturation = color.s;
      this.hidDevice.debounceSetLightValue(LightingValue.LELE_MINIBAR.COLOR_1, Math.floor(this.minibar.color1.hue / 360 * 255), this.linearInterpolation(this.minibar.color1.saturation));
    },
    setMinibarColor2: function (color) {
      this.minibar.color2.hue = color.h;
      this.minibar.color2.saturation = color.s;
      this.hidDevice.debounceSetLightValue(LightingValue.LELE_MINIBAR.COLOR_2, Math.floor(this.minibar.color2.hue / 360 * 255), this.linearInterpolation(this.minibar.color2.saturation));
    },
    setLightValue: function (k, v) {
      this.hidDevice.debounceSetLightValue(k, v);
    },
    linearInterpolation(value, oldMin = 0, oldMax = 100, newMin = 50, newMax = 255) {
      let oldRange = oldMax - oldMin;
      let newRange = newMax - newMin;
      let newValue = (((value - oldMin) * newRange) / oldRange) + newMin;
      return Math.floor(newValue);
    },
    getOriginValueForLinerInterpolation(value, oldMin = 0, oldMax = 100, newMin = 50, newMax = 255) {
      let oldRange = oldMax - oldMin;
      let newRange = newMax - newMin;
      let originValue = (((value - newMin) * oldRange) / newRange) + oldMin;
      return Math.max(0, Math.ceil(originValue));
    },
  },
  computed: {
    maxBrightness() {
      const extra = this.hidDevice.getDeviceInfo('lighting_extra_config');
      if (extra && extra.max_brightness) return extra.max_brightness;
      return 254;
    },
    lightPreset() {
      let preset = this.hidDevice.getDeviceInfo('lightPreset');
      preset = cloneDeep(preset);
      if (this.hidDevice.getDeviceInfo('lightingEffects')) {
        preset.effects = this.hidDevice.getDeviceInfo('lightingEffects');
      }
      return preset;
    },
    backlightEffects() {
      if (!this.lightPreset) return [];
      return this.lightPreset.effects.map((v, i) => {
        return Array.isArray(v) ? {
          name: v[0],
          id: i,
        } : v;
      });
    },
    qmkLightEffects() {
      return this.lightPreset.underglowEffects.map((v) => {
        return v[0];
      });
    },
    miniBarEffects() {
      return this.lightPreset.miniBarEffects.map((v) => {
        return v[0];
      });
    },

    sidePwmEffects() {
      return this.lightPreset.sidePwmEffects.map((v) => {
        return v[0];
      });
    },
    bottomPwmEffects() {
      return this.lightPreset.bottomPwmEffects.map((v) => {
        return v[0];
      });
    },
    currMinibarEffect() {
      if (!this.minibar.effect) return false;
      const effect = this.lightPreset.miniBarEffects.find((e, i) => i === this.minibar.effect);
      if (!effect) return false;
      return effect;
    },
    currSidePwmEffect() {
      if (!this.pwm.side.effect) return false;
      const effect = this.lightPreset.sidePwmEffects.find((e, i) => i === this.pwm.side.effect);
      if (!effect) return false;
      return effect;
    },
    currBottomePwmEffect() {
      if (!this.pwm.bottom.effect) return false;
      const effect = this.lightPreset.bottomPwmEffects.find((e, i) => i === this.pwm.bottom.effect);
      if (!effect) return false;
      return effect;
    },
    currBacklightEffect() {
      if (!this.lightPreset.effects) return false;
      const effect = this.lightPreset.effects.find((e, i) => i === this.backlightEffect);
      if (!effect) return false;
      return effect;
    },
    showSaturation() {
      return this.currBacklightEffect && this.currBacklightEffect[4] && this.currBacklightEffect[4] >= 1;
    },
    showColor1() {
      return this.currBacklightEffect && this.currBacklightEffect[1] >= 1;
    },
    showColor2() {
      return this.currBacklightEffect && this.currBacklightEffect[1] >= 2;
    },
    showBackBrightness() {
      return this.currBacklightEffect && !this.currBacklightEffect[3];
    },
    showBackSpeed() {
      return this.currBacklightEffect && !this.currBacklightEffect[2];
    },
    showQmkColor() {
      const effect = this.lightPreset.underglowEffects[this.qmkLightEffect];
      if (!effect) return false;
      return this.lightPreset.supportedLightingValues.indexOf(LightingValue.QMK_RGBLIGHT_COLOR) > -1 && effect[1] >= 1;
    },
    showMinibarColor1() {
      return this.currMinibarEffect && this.currMinibarEffect[1] >= 1;
    },
    showMinibarSpeed() {
      return this.currMinibarEffect && !this.currMinibarEffect[2];
    },
    showMinibarBrightness() {
      return this.currMinibarEffect && !this.currMinibarEffect[3];
    },
    showLeleMiniBar() {
      if (LightingTypeDefinition.LeleViaLight !== this.hidDevice.getDeviceInfo('lighting')) return false;
      const extra = this.hidDevice.getDeviceInfo('lighting_extra_config');
      return extra && extra.minibar;
    },
    showLelepwm() {
      if (LightingTypeDefinition.LeleViaLight !== this.hidDevice.getDeviceInfo('lighting')) return false;
      const extra = this.hidDevice.getDeviceInfo('lighting_extra_config');
      return extra && extra.pwm;
    },
    showSidePwmBrightness() {
      return this.currSidePwmEffect && !this.currSidePwmEffect[3];
    },
    showSidePwmSpeed() {
      return this.currSidePwmEffect && !this.currSidePwmEffect[2];
    },
    showBottomPwmBrightness() {
      return this.currBottomePwmEffect && !this.currBottomePwmEffect[3];
    },
    showBottomPwmSpeed() {
      return this.currBottomePwmEffect && !this.currBottomePwmEffect[2];
    },
    v3Meun() {
      return this.hidDevice.getDeviceInfo('menus');
    }
  },
  watch: {
    backlightBrightness(value) {
      if (this.loaded) this.setLightValue(LightingValue.BACKLIGHT_BRIGHTNESS, value);
    },
    backlightEffect(value) {
      if (this.loaded) this.setLightValue(LightingValue.BACKLIGHT_EFFECT, value);
    },
    backlightSpeed(value) {
      if (this.loaded) this.setLightValue(LightingValue.BACKLIGHT_EFFECT_SPEED, value);
    },
    qmkLightEffect(value) {
      if (this.loaded) this.setLightValue(LightingValue.QMK_RGBLIGHT_EFFECT, value);
    },
    qmkLightBrightness(value) {
      if (this.loaded) this.setLightValue(LightingValue.QMK_RGBLIGHT_BRIGHTNESS, value);
    },
    qmkLightSpeed(value) {
      if (this.loaded) this.setLightValue(LightingValue.BACKLIGHT_EFFECT_SPEED, value);
    },
    "minibar.effect": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_MINIBAR.EFFECT, value);
    },
    "minibar.brightness": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_MINIBAR.BRIGHTNESS, value);
    },
    "minibar.effect_speed": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_MINIBAR.EFFECT_SPEED, value);
    },
    "pwm.side.effect": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_PWM.SIDE.EFFECT, value);
    },
    "pwm.side.brightness": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_PWM.SIDE.BRIGHTNESS, value);
    },
    "pwm.side.effect_speed": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_PWM.SIDE.SPEED, value);
    },
    "pwm.bottom.effect": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_PWM.BOTTOM.EFFECT, value);
    },
    "pwm.bottom.brightness": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_PWM.BOTTOM.BRIGHTNESS, value);
    },
    "pwm.bottom.effect_speed": function (value) {
      if (this.loaded) this.setLightValue(LightingValue.LELE_PWM.BOTTOM.SPEED, value);
    },
    "color1.saturation": function (val) {
      if (this.loaded) this.setColor1Saturation();
    }
  },
};
</script>
<style lang="scss">
.panel-wrap.light .field {
  &.divied {
    margin-top: 40px;
  }
}

.panel-wrap.light,
.panel-wrap.firmware {
  padding: 20px 80px;
  margin-bottom: 15px !important;

  .field {
    position: relative;
    margin-bottom: 10px;
    width: 100%;

    &.color {
      margin-bottom: 50px;
    }

    .color-wrap {
      position: absolute;
      top: -58px;
    }

    .field-label {
      min-width: 200px;
    }
  }

}</style>
