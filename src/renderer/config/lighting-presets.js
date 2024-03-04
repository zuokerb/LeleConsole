const LightingTypeDefinition = {
  None: 'none',
  QMKRGBLight: 'qmk_rgblight',
  WTRGBBacklight: 'wt_rgb_backlight',
  WTMonoBacklight: 'wt_mono_backlight',
  LeleViaLight: 'lele_via_light',
  QMKLighting: 'qmk_backlight',
  QMKBacklightRGBLight: 'qmk_backlight_rgblight',
  QMKRGBMatrix: "qmk_rgb_matrix"
}

const LightingValue = {
  BACKLIGHT_USE_SPLIT_BACKSPACE: 0x01,
  BACKLIGHT_USE_SPLIT_LEFT_SHIFT: 0x02,
  BACKLIGHT_USE_SPLIT_RIGHT_SHIFT: 0x03,
  BACKLIGHT_USE_7U_SPACEBAR: 0x04,
  BACKLIGHT_USE_ISO_ENTER: 0x05,
  BACKLIGHT_DISABLE_HHKB_BLOCKER_LEDS: 0x06,
  BACKLIGHT_DISABLE_WHEN_USB_SUSPENDED: 0x07,
  BACKLIGHT_DISABLE_AFTER_TIMEOUT: 0x08,
  BACKLIGHT_BRIGHTNESS: 0x09,
  BACKLIGHT_EFFECT: 0x0a,
  BACKLIGHT_EFFECT_SPEED: 0x0b,
  BACKLIGHT_COLOR_1: 0x0c,
  BACKLIGHT_COLOR_2: 0x0d,
  BACKLIGHT_CAPS_LOCK_INDICATOR_COLOR: 0x0e,
  BACKLIGHT_CAPS_LOCK_INDICATOR_ROW_COL: 0x0f,
  BACKLIGHT_LAYER_1_INDICATOR_COLOR: 0x10,
  BACKLIGHT_LAYER_1_INDICATOR_ROW_COL: 0x11,
  BACKLIGHT_LAYER_2_INDICATOR_COLOR: 0x12,
  BACKLIGHT_LAYER_2_INDICATOR_ROW_COL: 0x13,
  BACKLIGHT_LAYER_3_INDICATOR_COLOR: 0x14,
  BACKLIGHT_LAYER_3_INDICATOR_ROW_COL: 0x15,
  BACKLIGHT_CUSTOM_COLOR: 0x17,
  BACKLIGHT_ALPHAS_MODS: 0x16,
  // QMK RGBLIGHT
  QMK_RGBLIGHT_BRIGHTNESS: 0x80,
  QMK_RGBLIGHT_EFFECT: 0x81,
  QMK_RGBLIGHT_EFFECT_SPEED: 0x82,
  QMK_RGBLIGHT_COLOR: 0x83,

  // LELE MINIBAR
  LELE_MINIBAR: {
    BRIGHTNESS : 0x19,
    EFFECT : 0x1A,
    EFFECT_SPEED : 0x1B,
    COLOR_1 : 0x1C,
    COLOR_2 : 0x1D,
  },
  LELE_PWM : {
    SIDE : {
        EFFECT: 0X20,
        BRIGHTNESS: 0X21,
        SPEED: 0X22,
    },
    BOTTOM: {
        EFFECT: 0X30,
        BRIGHTNESS: 0X31,
        SPEED: 0X32,
    }
  },


}

const LightingPreset = {
  [LightingTypeDefinition.QMKLighting]: {
    effects: [
      ['Off', 0],
      ['On', 0]
    ],
    underglowEffects: [],
    supportedLightingValues: [
      LightingValue.BACKLIGHT_BRIGHTNESS,
      LightingValue.BACKLIGHT_EFFECT
    ]
  },
  [LightingTypeDefinition.QMKBacklightRGBLight]: {
    effects: [
      ['Off', 0],
      ['On', 0]
    ],
    underglowEffects: [
      ['AllOff', 0],
      ['solidColor', 1],
      ['Breathing1', 1],
      ['Breathing2', 1],
      ['Breathing3', 1],
      ['Breathing4', 1],
      ['RainbowMood1', 0],
      ['RainbowMood2', 0],
      ['RainbowMood3', 0],
      ['RainbowSwirl1', 0],
      ['RainbowSwirl2', 0],
      ['RainbowSwirl3', 0],
      ['RainbowSwirl4', 0],
      ['RainbowSwirl5', 0],
      ['RainbowSwirl6', 0],
      ['Snake1', 1],
      ['Snake2', 1],
      ['Snake3', 1],
      ['Snake4', 1],
      ['Snake5', 1],
      ['Snake6', 1],
      ['Knight1', 1],
      ['Knight2', 1],
      ['Knight3', 1],
      ['Christmas', 1],
      ['Gradient1', 1],
      ['Gradient2', 1],
      ['Gradient3', 1],
      ['Gradient4', 1],
      ['Gradient5', 1],
      ['Gradient6', 1],
      ['Gradient7', 1],
      ['Gradient8', 1],
      ['Gradient9', 1],
      ['Gradient10', 1],
      ['RGBTest', 1],
      ['Alternating', 1]
    ],
    supportedLightingValues: [
      LightingValue.BACKLIGHT_BRIGHTNESS,
      LightingValue.BACKLIGHT_EFFECT,
      LightingValue.QMK_RGBLIGHT_BRIGHTNESS,
      LightingValue.QMK_RGBLIGHT_EFFECT,
      LightingValue.QMK_RGBLIGHT_EFFECT_SPEED,
      LightingValue.QMK_RGBLIGHT_COLOR
    ]
  },
  [LightingTypeDefinition.QMKRGBLight]: {
    effects: [],
    underglowEffects: [
      ['AllOff', 0],
      ['solidColor', 1],
      ['Breathing1', 1],
      ['Breathing2', 1],
      ['Breathing3', 1],
      ['Breathing4', 1],
      ['RainbowMood1', 0],
      ['RainbowMood2', 0],
      ['RainbowMood3', 0],
      ['RainbowSwirl1', 0],
      ['RainbowSwirl2', 0],
      ['RainbowSwirl3', 0],
      ['RainbowSwirl4', 0],
      ['RainbowSwirl5', 0],
      ['RainbowSwirl6', 0],
      ['Snake1', 1],
      ['Snake2', 1],
      ['Snake3', 1],
      ['Snake4', 1],
      ['Snake5', 1],
      ['Snake6', 1],
      ['Knight1', 1],
      ['Knight2', 1],
      ['Knight3', 1],
      ['Christmas', 1],
      ['Gradient1', 1],
      ['Gradient2', 1],
      ['Gradient3', 1],
      ['Gradient4', 1],
      ['Gradient5', 1],
      ['Gradient6', 1],
      ['Gradient7', 1],
      ['Gradient8', 1],
      ['Gradient9', 1],
      ['Gradient10', 1],
      ['RGBTest', 1],
      ['Alternating', 1]
    ],
    supportedLightingValues: [
      LightingValue.QMK_RGBLIGHT_BRIGHTNESS,
      LightingValue.QMK_RGBLIGHT_EFFECT,
      LightingValue.QMK_RGBLIGHT_EFFECT_SPEED,
      LightingValue.QMK_RGBLIGHT_COLOR
    ]
  },
  [LightingTypeDefinition.WTMonoBacklight]: {
    effects: [
      ['AllOff', 0],
      ['AllOn', 0],
      ['raindrops', 0]
    ],
    underglowEffects: [],
    supportedLightingValues: [
      LightingValue.BACKLIGHT_BRIGHTNESS,
      LightingValue.BACKLIGHT_EFFECT,
      LightingValue.BACKLIGHT_EFFECT_SPEED,
      LightingValue.BACKLIGHT_DISABLE_AFTER_TIMEOUT,
      LightingValue.BACKLIGHT_DISABLE_WHEN_USB_SUSPENDED
    ]
  },
  [LightingTypeDefinition.WTRGBBacklight]: {
    effects: [
      ['AllOff', 0],
      ['solidColor', 1],
      ['alphaMods', 2],
      ['gradientUpDown', 2],
      ['raindrops', 2],
      ['cycleAll', 0],
      ['cycleLeftRight', 0],
      ['cycleUpDown', 0],
      ['jellybeanRaindrops', 0],
      ['cycleRadial1', 0],
      ['cycleRadial2', 1],
    ],
    underglowEffects: [],
    supportedLightingValues: [
      LightingValue.BACKLIGHT_BRIGHTNESS,
      LightingValue.BACKLIGHT_EFFECT,
      LightingValue.BACKLIGHT_EFFECT_SPEED,
      LightingValue.BACKLIGHT_DISABLE_AFTER_TIMEOUT,
      LightingValue.BACKLIGHT_DISABLE_WHEN_USB_SUSPENDED,
      LightingValue.BACKLIGHT_COLOR_1,
      LightingValue.BACKLIGHT_COLOR_2,
      LightingValue.BACKLIGHT_CAPS_LOCK_INDICATOR_COLOR,
      LightingValue.BACKLIGHT_CAPS_LOCK_INDICATOR_ROW_COL,
      LightingValue.BACKLIGHT_LAYER_1_INDICATOR_COLOR,
      LightingValue.BACKLIGHT_LAYER_1_INDICATOR_ROW_COL,
      LightingValue.BACKLIGHT_LAYER_2_INDICATOR_COLOR,
      LightingValue.BACKLIGHT_LAYER_2_INDICATOR_ROW_COL,
      LightingValue.BACKLIGHT_LAYER_3_INDICATOR_COLOR,
      LightingValue.BACKLIGHT_LAYER_3_INDICATOR_ROW_COL
    ]
  },
  [LightingTypeDefinition.LeleViaLight]: {
    effects: [
      // name,       showColor,  noSpeed, noBrightness, showSaturation
      ['AllOff',             0,        1,         1        ],
      ['solidColor',         1,        1,         0        ],
      ['alphaMods',          2,        1,         0        ],
      ['gradientUpDown',     2,        1,         0        ],
      ['raindrops',          1,        0,         0        ],
      ['cycleAll',           0,        0,         0,     1 ],
      ['cycleLeftRight',     0,        0,         0,     1 ],
      ['cycleUpDown',        0,        0,         0,     1 ],
      ['jellybeanRaindrops', 1,        0,         0        ],
      ['cycleRadial1',       0,        0,         0,     1 ],
      ['cycleRadial2',       0,        0,         0,     1 ],
      ['rgbTest',            0,        1,         1        ],
      ['popo',               0,        1,         1        ],
      ['testLedChain',       0,        1,         1        ],
      ['ripple',             1,        1,         0        ],
      ['rippleRgb',          0,        1,         0,     1 ],
      ['trackRipple',        1,        1,         0        ],
      ['trackRippleRgb',     0,        1,         0,     1 ],
    ],
    underglowEffects: [],
    miniBarEffects: [
        ['inherit',          0,        1,         1 ],
        ['reverse_hue',      0,        1,         1 ],
        ['type_flash',       1,        1,         0 ],
        ['solid',            1,        1,         0 ],
        ['cycle_all',        0,        0,         0 ],
        ['cycle_up_down',    0,        0,         0 ],
        ['breath',           1,        0,         0 ],
    ],
    sidePwmEffects: [
      ['off',          0,        1,         1 ],
      ['solid',      0,        1,         0 ],
      ['breath',       0,        0,         0 ],
      ['flash',            0,        0,         0 ],
      ['random_flash',        0,        0,         0 ],
    ],
    bottomPwmEffects: [
      ['off',          0,        1,         1 ],
      ['solid',      0,        1,         0 ],
      ['breath',       0,        0,         0 ],
    ],
    supportedLightingValues: [
      LightingValue.BACKLIGHT_BRIGHTNESS,
      LightingValue.BACKLIGHT_EFFECT,
      LightingValue.BACKLIGHT_EFFECT_SPEED,
      LightingValue.BACKLIGHT_COLOR_1,
      LightingValue.BACKLIGHT_COLOR_2,
      LightingValue.LELE_MINIBAR.BRIGHTNESS,
      LightingValue.LELE_MINIBAR.EFFECT,
      LightingValue.LELE_MINIBAR.EFFECT_SPEED,
      LightingValue.LELE_MINIBAR.COLOR_1,
      LightingValue.LELE_MINIBAR.COLOR_2,
    ]
  }
};
export {  LightingValue, LightingTypeDefinition, LightingPreset };
