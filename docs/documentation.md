# LeLeConsole user guide


## Config

### Required Properties


Edit the *metadata.yml* file to set configuration data:

```js
{
  "name": "LelePad",
  "vendorId": "0xCA21",
  "productId": "0x0020",
  "lighting": "none",
  "matrix": {
    "rows": 5,
    "cols": 4
  },
  "layouts": [
    {
      "name": "right",
      "keymap": [
        ["0,3", "0,4", "0,5"],
        ...
      ],
    },
    ...
  ]
}
```

``` md
# name
The name property denotes the name of the keyboard being defined.

# vendorId
This combined with the vendorId is what is used by VIA to identify the keyboard when it is plugged in.

# productId
The productId property corresponds to the usb product id.

# lighting
The lighting property can either a preset: none, qmk_backlight, qmk_rgblight, qmk_backlight_rgblight, wt_rgb_backlight, wt_mono_backlight or for more advanced usage an object that extends one of those presets.
The lighting property can either a preset: none, qmk_backlight, qmk_rgblight, qmk_backlight_rgblight, wt_rgb_backlight, wt_mono_backlight or for more advanced usage an object that extends one of those presets.
Use qmk_backlight if the firmware enables QMK's core backlight feature with BACKLIGHT_ENABLE=yes.
Use qmk_rgblight if the firmware enables QMK's core RGB Lighting feature with RGBLIGHT_ENABLE=yes.
Use qmk_backlight_rgblight if the firmware enables both.
Use of wt_rgb_backlight and wt_mono_backlight is for keyboards that use the lighting code in /keyboards/wilba_tech and not intended to be a generalized interface to other custom lighting implementations. A generalized interface is being developed. Keyboards that do not use QMK's core lighting implementations should wait for the generalized interface instead of implementing the current interface.

# matrix
The matrix property defines how many rows and columns the PCB's switch matrix uses. This must match the MATRIX_ROWS and MATRIX_COLS symbols in the QMK firmware.

# layouts
The keymap property corresponds to the KLE json exported by KLE and has the switch row, col defined in the top-left legends and optionally the group number, option number defined in the bottom-right legends. The KLE can support up to 3 different colored keys which is used to identify the alpha, modifier and accent keys which VIA will automatically apply a theme to.

```


### Optional Properties

```js
{
  ...
  "lighting": {
    ...
    "extends": "none",
    "effects": [
      ["Solid Color 1", 1],
      ["Cycle All", 0]
    ],
    "supportedBacklightValues": [
      10, // Effect
      11  // Effect Speed
    ]
    ...
  },
  "layouts": {
    ...
    "labels": [
      "Split Backspace",
      "ISO Enter",
      "Split Left Shift",
      "Split Right Shift",
      ["Bottom Row", "ANSI", "7U", "HHKB", "WKL"]
    ],
    ...
  }
  ...
}
```

``` md
# lighting.extends
The object must contain the extends key which contains one of the preset names and optionally can include following keys. The other keys defined in the object will override the properties defined in the preset. the-via/reader contains the defined values for each preset.

# lighting.effects
The effects property is an array comprised of tuples that are made up of a string that is the effect label and the number of colors that the effect requires.

# lighting.supportedBacklightValues
The supportedBacklightValues property is an array of all backlight commands supported by the keyboard. This defines what is shown in the Lighting tab for the user to control. An exhaustive list of values are defined in the the-via/reader package.

# layouts.labels
The labels property is an optional array of string or string[] and defines the labels for the layout controls.

The order of the labels is important as the implicit index is used to map to the group number e.g. Split Backspace corresponds to layout option #0, ISO corresponds to layout option #1, etc.

If an item in the labels array is a string, it is presented as a toggle button, the off state maps to layout option choice #0 (the default), the on state maps to layout option choice #1.

If an item in the labels array is a string[], it maps to a select control with the first item in the array being used as the label for the control and the following items being used as labels of layout option choices #0, #1, #2, etc. In the example above, the Bottom Row is the label, ANSI maps to layout option choice #0, 7U maps to layout option choice #1, etc.

```


## References

- [QMK Documentation](https://docs.qmk.fm/#/)