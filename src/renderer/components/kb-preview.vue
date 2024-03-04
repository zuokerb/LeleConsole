<template>
  <div v-if="outerStyle" class="keyboard" id="keyboard" :style="outerStyle">
    <div class="keyboard-bg" id="keyboard-bg" :class="{test: testMode}" :style="kbStyle">
      <div
        v-for="(keycap, k) in renderKeys"
        class="key"
        :key="k"
        @click="selectPosi(keycap)"
        :class="`${keycap.profile} ${keycap.nub ? 'HOMING' : ''}${
          (currPosi && currPosi === keycap.posi) ||
          activeKeys.indexOf(keycap.byte) !== -1
            ? 'active'
            : ''
        } ${pressedKeys.indexOf(keycap.byte) !== -1 ? 'pressed' : ''}`"
      >
      <drop @drop="(keycode, event) => handleDrop(keycode, keycap.posi)">
        <kb-key
          :keycap="keycap"
        />
      </drop>
      </div>
    </div>
  </div>
</template>
<script>
  import assign  from 'lodash/assign';
  import KbKey from './kb-key.vue';
  export default {
    components: { KbKey },
    props: {
      keys: {
        type: Array,
        default: () => [],
      },
      maxWidth: {
        type: Number,
      },
      activeKeys: {
        type: Array,
        default: () => [],
      },
      pressedKeys: {
        type: Array,
        default: () => [],
      },
      testMode: {
        type: Boolean,
        default: false,
      },
      layer: {
        type: Number,
        default: 0,
      },
      unitWidth: {
        type: Number,
      },
      unitSpacing: {
        type: Number,
      },
    },
    data() {
      return {
        keyboard: null,
        currPosi: null,
        kbWidth: 0,
        kbHeight: 0,
        unitSizes: {
          keySpacing: 2,
          bevelMargin: 2,
          bevelOffsetTop: 3,
          bevelOffsetBottom: 3,
          padding: 0,
          unit: 60,
          roundOuter: 4,
        },
        kbStyle: null,
        outerStyle: null,
      };
    },
    created() {
      if (!Math.Matrix) {
        const Matrix = function (a, b, c, d, e, f) {
          this.a = a || 1;
          this.b = b || 0;
          this.c = c || 0;
          this.d = d || 1;
          this.e = e || 0;
          this.f = f || 0;
        };
        Matrix.prototype.mult = function (Y) {
          return new Matrix(
            this.a * Y.a + this.c * Y.b,
            this.b * Y.a + this.d * Y.b,
            this.a * Y.c + this.c * Y.d,
            this.b * Y.c + this.d * Y.d,
            this.a * Y.e + this.c * Y.f + this.e,
            this.b * Y.e + this.d * Y.f + this.f
          );
        };
        Matrix.prototype.transformPt = function (pt) {
          return {
            x: this.a * pt.x + this.c * pt.y + this.e,
            y: this.b * pt.x + this.d * pt.y + this.f,
          };
        };
        Math.Matrix = function (a, b, c, d, e, f) {
          return new Matrix(a, b, c, d, e, f);
        };
        Math.transMatrix = function (x, y) {
          return new Matrix(1, 0, 0, 1, x, y);
        };
        Math.rotMatrix = function (angleInDegrees) {
          var angleInRad = (angleInDegrees * Math.PI) / 180.0;
          var cos = Math.cos(angleInRad),
            sin = Math.sin(angleInRad);
          return new Matrix(cos, sin, -sin, cos, 0, 0);
        };
      }

      this.calcKbHeight();
    },
    methods: {
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
      handleDrop(key, posi) {
        console.log('handleDrop', key, posi);
        this.$emit('setKeycodeByDrop', key.keycode, posi);
      },
      selectPosi(keycap) {
        console.log('selectPosi', keycap);
        if (this.testMode) return;

        if (keycap && !keycap.ghost) {
          this.currPosi = this.currPosi === keycap.posi ? null :  keycap.posi;
          this.$emit('selectPosi', this.currPosi);
        } else {
          this.currPosi = null;
          this.$emit('selectPosi', this.currPosi);
        }
      },
      selectNextPosi() {
        if (this.currPosi) {
          const currIdx = this.renderKeys.findIndex(
            (keycap) => keycap.posi === this.currPosi
          );
          if (this.renderKeys.length > currIdx + 1) {
            this.currPosi = this.renderKeys[currIdx + 1].posi;
          } else {
            this.currPosi = null;
          }
          this.$emit('selectPosi', this.currPosi);
        }
      },
      calcKbHeight() {
        let right = 0,
          bottom = 0;
        this.renderKeys.forEach(function (key) {
          right = Math.max(right, key.rect.x + key.rect.w);
          bottom = Math.max(bottom, key.rect.y + key.rect.h);
        });
        this.kbWidth = right;
        this.kbHeight = bottom;
        this.setTransform();
      },
      getRenderParms (key, sizes) {
        var parms = {};

        parms.jShaped =
          key.width !== key.width2 ||
          key.height !== key.height2 ||
          key.x2 ||
          key.y2;
        const unitWidth = this.unitWidth ? this.unitWidth : sizes.unit;
        const unitHeight = sizes.unit;
        const unitSpacing = this.unitSpacing ? this.unitSpacing : sizes.keySpacing;

        // Overall dimensions of the unit square(s) that the cap occupies
        parms.capwidth = unitWidth * key.width;
        parms.capheight = unitHeight * key.height;
        parms.capx = unitWidth * key.x;
        parms.capy = unitHeight * key.y;
        if (parms.jShaped) {
          parms.capwidth2 = unitWidth * key.width2;
          parms.capheight2 = unitHeight * key.height2;
          parms.capx2 = unitWidth * (key.x + key.x2);
          parms.capy2 = unitHeight * (key.y + key.y2);
        }

        // Dimensions of the outer part of the cap
        parms.outercapwidth = parms.capwidth - unitSpacing * 2;
        parms.outercapheight = parms.capheight - unitSpacing * 2;
        parms.outercapx = parms.capx + unitSpacing;
        parms.outercapy = parms.capy + unitSpacing;
        if (parms.jShaped) {
          parms.outercapy2 = parms.capy2 + unitSpacing;
          parms.outercapx2 = parms.capx2 + unitSpacing;
          parms.outercapwidth2 = parms.capwidth2 - unitSpacing * 2;
          parms.outercapheight2 = parms.capheight2 - unitSpacing * 2;
        }

        // Dimensions of the top of the cap
        parms.innercapwidth =  parms.outercapwidth - sizes.bevelMargin * 2;
        parms.innercapheight =
          parms.outercapheight -
          sizes.bevelMargin * 2 -
          (sizes.bevelOffsetBottom - sizes.bevelOffsetTop);
        parms.innercapx = parms.outercapx + sizes.bevelMargin;
        parms.innercapy =
          parms.outercapy + sizes.bevelMargin - sizes.bevelOffsetTop;
        if (parms.jShaped) {
          parms.innercapwidth2 = parms.outercapwidth2 - sizes.bevelMargin * 2;
          parms.innercapheight2 = parms.outercapheight2 - sizes.bevelMargin * 2;
          parms.innercapx2 = parms.outercapx2 + sizes.bevelMargin;
          parms.innercapy2 =
            parms.outercapy2 + sizes.bevelMargin - sizes.bevelOffsetTop;
        }

        // Dimensions of the text part of the cap
        parms.textcapwidth = parms.innercapwidth - sizes.padding * 2;
        parms.textcapheight = parms.innercapheight - sizes.padding * 2;
        parms.textcapx = parms.innercapx + sizes.padding;
        parms.textcapy = parms.innercapy + sizes.padding;

        parms.darkColor = key.color;
        parms.textSize = key.label && key.label.length > 1 ? 12 : 15;

        // Rotation matrix about the origin
        parms.origin_x = unitWidth * key.rotation_x;
        parms.origin_y = unitHeight * key.rotation_y;
        var mat = Math.transMatrix(parms.origin_x, parms.origin_y)
          .mult(Math.rotMatrix(key.rotation_angle))
          .mult(Math.transMatrix(-parms.origin_x, -parms.origin_y));

        // Construct the *eight* corner points, transform them, and determine the transformed bbox.
        parms.rect = {
          x: parms.capx,
          y: parms.capy,
          w: parms.capwidth,
          h: parms.capheight,
          x2: parms.capx + parms.capwidth,
          y2: parms.capy + parms.capheight,
        };
        parms.rect2 = parms.jShaped
          ? {
              x: parms.capx2,
              y: parms.capy2,
              w: parms.capwidth2,
              h: parms.capheight2,
              x2: parms.capx2 + parms.capwidth2,
              y2: parms.capy2 + parms.capheight2,
            }
          : parms.rect;
        parms.bbox = { x: 9999999, y: 9999999, x2: -9999999, y2: -9999999 };
        var corners = [
          { x: parms.rect.x, y: parms.rect.y },
          { x: parms.rect.x, y: parms.rect.y2 },
          { x: parms.rect.x2, y: parms.rect.y },
          { x: parms.rect.x2, y: parms.rect.y2 },
        ];
        if (parms.jShaped)
          corners.push(
            { x: parms.rect2.x, y: parms.rect2.y },
            { x: parms.rect2.x, y: parms.rect2.y2 },
            { x: parms.rect2.x2, y: parms.rect2.y },
            { x: parms.rect2.x2, y: parms.rect2.y2 }
          );
        for (var i = 0; i < corners.length; ++i) {
          corners[i] = mat.transformPt(corners[i]);
          parms.bbox.x = Math.min(parms.bbox.x, corners[i].x);
          parms.bbox.y = Math.min(parms.bbox.y, corners[i].y);
          parms.bbox.x2 = Math.max(parms.bbox.x2, corners[i].x);
          parms.bbox.y2 = Math.max(parms.bbox.y2, corners[i].y);
        }
        parms.bbox.w = parms.bbox.x2 - parms.bbox.x;
        parms.bbox.h = parms.bbox.y2 - parms.bbox.y;
        
        
        return parms;
      },
      renderKey(key) {
        let k = assign({}, key);
        let sizes = this.unitSizes; // always in pixels
        let parms = this.getRenderParms(k, sizes);
        k.rect = parms.rect;
        k.mat = Math.transMatrix(parms.origin_x, parms.origin_y)
          .mult(Math.rotMatrix(-k.rotation_angle))
          .mult(Math.transMatrix(-parms.origin_x, -parms.origin_y));
        k.crosshairs = 'none';
        if (k.rotation_x || k.rotation_y || k.rotation_angle) {
          k.crosshairs_x = parms.origin_x;
          k.crosshairs_y = parms.origin_y;
          k.crosshairs = 'block';
        }
        k.parms = parms;
        k.sizes = sizes;
        return k;
      },
      setTransform() {
        const width = Math.floor(this.kbWidth);
        const height = Math.floor(this.kbHeight);
        const scale = Math.min(
          ((this.maxWidth - 20) / this.kbWidth).toFixed(2),
          1
        );
        let style = {
          'border-radius': '6px',
        };
        this.outerStyle = {
          width: width + 'px',
          height: height + 'px',
          transform: `scale(${scale})`,
          transformOrigin: 'left top',
          marginBottom: `-${parseInt(height * (1 - scale) - 20)}px`

        };
        style = assign(style, {
          width: width + 'px',
          height: height + 'px',
        });

        this.kbStyle = style;
      },
    },
    computed: {
      renderKeys() {
        return this.keys.map((key) => this.renderKey(key));
      },
    },
    watch: {
      layer() {
        this.selectPosi(null);
      }
    }
  };
</script>
<style lang="scss" scoped>
  .keyboard {
    border-radius: 3px;
  }

  .keyboard-bg {
    transform-origin: left top;
    position: inherit;
    box-sizing: content-box;
    border-radius: 6px;
    min-width: 56px;
    min-height: 56px;
    margin: 0 auto;
  }

  .keyboard-bg div {
    position: absolute;
    border-color: #000;
    box-sizing: border-box;
  }
</style>
