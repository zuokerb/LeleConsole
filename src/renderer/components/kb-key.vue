<template>
  <div
    v-if="keycap"
    class="keycap"
    :class="{ ghosted: keycap.ghost, decal: keycap.decal }"
    :style="rotateStyle(keycap)"
  >
    <div
      class="keyborder"
      :style="`left: ${keycap.parms.outercapx}px; top: ${keycap.parms.outercapy}px; width: ${keycap.parms.outercapwidth}px; height: ${keycap.parms.outercapheight}px; border-width: ${keycap.sizes.strokeWidth}px; border-radius: ${keycap.sizes.roundOuter}px;`"
    ></div>
    <div
      v-if="keycap.parms.jShaped"
      class="keyborder"
      :style="`mix-blend-mode:darken;left: ${keycap.parms.outercapx2}px; top: ${keycap.parms.outercapy2}px; width: ${keycap.parms.outercapwidth2}px; height: ${keycap.parms.outercapheight2}px; border-width: ${keycap.sizes.strokeWidth}px; border-radius: ${keycap.sizes.roundOuter}px;`"
    ></div>
    <div
      v-if="keycap.parms.jShaped"
      :style="`left: ${
        keycap.parms.outercapx + keycap.sizes.strokeWidth
      }px; top: ${
        keycap.parms.outercapy + keycap.sizes.strokeWidth
      }px; width: ${
        keycap.parms.outercapwidth - keycap.sizes.strokeWidth * 2
      }px; height: ${
        keycap.parms.outercapheight - keycap.sizes.strokeWidth * 2
      }px; background-color: ${keycap.parms.darkColor}; border-radius: ${
        keycap.sizes.roundOuter
      }px;`"
    ></div>

    <template v-if="!keycap.ghost">
      <template v-if="!keycap.decal">
        <div
          :style="`left: ${keycap.parms.innercapx}px; top: ${keycap.parms.innercapy}px; width: ${keycap.parms.innercapwidth}px; height: ${keycap.parms.innercapheight}px;  border-width: ${keycap.sizes.strokeWidth}px; border-radius: ${keycap.sizes.roundInner}px;`"
          class="keytop"
        ></div>
        <template v-if="keycap.parms.jShaped && !keycap.stepped">
          <div
            :style="`left: ${keycap.parms.innercapx2}px; top: ${
              keycap.parms.innercapy2
            }px; width: ${keycap.parms.innercapwidth2}px; height: ${
              keycap.parms.innercapheight2
            }px;border-width: ${keycap.sizes.strokeWidth}px; border-radius: ${
              keycap.sizes.roundInner
            }px; background-position: ${Math.min(
              keycap.parms.innercapx - keycap.parms.innercapx2,
              0
            )}px ${Math.min(
              keycap.parms.innercapy - keycap.parms.innercapy2,
              0
            )}px; background-size: ${Math.max(
              keycap.parms.innercapwidth,
              keycap.parms.innercapwidth2
            )}px ${Math.max(
              keycap.parms.innercapheight,
              keycap.parms.innercapheight2
            )}px;`"
            class="keytop"
          ></div>
          <div
            :style="`left: ${
              keycap.parms.innercapx + keycap.sizes.strokeWidth
            }px; top: ${
              keycap.parms.innercapy + keycap.sizes.strokeWidth
            }px; width: ${
              keycap.parms.innercapwidth - keycap.sizes.strokeWidth * 2
            }px; height: ${
              keycap.parms.innercapheight - keycap.sizes.strokeWidth * 2
            }px; border-radius: ${
              keycap.sizes.roundInner
            }px; background-position: ${Math.min(
              keycap.parms.innercapx2 - keycap.parms.innercapx,
              0
            )}px ${Math.min(
              keycap.parms.innercapy2 - keycap.parms.innercapy,
              0
            )}px; background-size: ${Math.max(
              keycap.parms.innercapwidth,
              keycap.parms.innercapwidth2
            )}px ${Math.max(
              keycap.parms.innercapheight,
              keycap.parms.innercapheight2
            )}px;`"
            class="keytop"
          ></div>
        </template>
      </template>

      <div
        :style="`left: ${keycap.parms.innercapx}px; top: ${keycap.parms.innercapy}px; width: ${keycap.parms.innercapwidth}px; height: ${keycap.parms.innercapheight}px; padding: ${keycap.sizes.padding}px;`"
        class="keylabels"
      >
        <div
          :class="`keylabel textsize${keycap.parms.textSize}`"
          :style="`width:${keycap.parms.textcapwidth}px; height:${keycap.parms.textcapheight}px;`"
        >
          <div
            :style="`width:${keycap.parms.textcapwidth}px; max-width:${keycap.parms.textcapwidth}px; height:${keycap.parms.textcapheight}px;`"
            v-html="
              `${typeof keycap.label !== 'undefined' ? keycap.label : ''}`
            "
          ></div>
        </div>
      </div>
    </template>
  </div>
</template>
<script>
  export default {
    name: 'kb-key',
    props: ['keycap'],
    methods: {
      textSize(i) {
        return this.keycap.textSize[i] || this.keycap.default.textSize;
      },
      rotateStyle: (keycap) => {
        if (!keycap.rotation_angle) return '';
        return (
          'transform:rotate(' +
          keycap.rotation_angle +
          'deg); transform-origin:' +
          keycap.parms.origin_x +
          'px ' +
          keycap.parms.origin_y +
          'px;'
        );
      },
    },
  };
</script>
<style lang="scss" scoped>
  div {
    position: absolute;
    box-sizing: border-box;
    background-clip: padding-box;
  }



  .keylabels {
    font-weight: bold;
    border-radius: 3px;
    position: absolute;
    box-sizing: border-box;
    border-width: 0;
    .keylabel {
      padding: 4px;
    }
  }

  .textsize12 {
    font-size: 12px;
  }

  .textsize15 {
    font-size: 16px;
  }

  .keylabel > div {
    word-break: break-word;
    display: table-cell;
    position: static !important;
  }

  .keylabel hr {
    display: inline;
  }

  .keylabel hr:before {
    position: relative;
    display: block;
    overflow: hidden;
    white-space: nowrap;
    content: '\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500\2500';
  }

  .HOMING .keylabels {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAACCAYAAABhYU3QAAAAGElEQVQI12P4//+/ODGYAUwwMAThwyA1ACUKJ4H2Fi17AAAAAElFTkSuQmCC');
    background-repeat: no-repeat;
    background-position: center 90%;
  }

  .keytop {
    color: var(--bg-color);
  }

  .ghosted {
    opacity: 0;
  }
</style>
