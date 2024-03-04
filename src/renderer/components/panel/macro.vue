<template>
  <div class="panel-wrap macro" style="margin-top: -10px;">
    <b-tabs v-model="currMacro" :animated="false" type="is-boxed">
      <b-tab-item
        v-for="(macro, idx) in macros"
        :key="idx"
        :value="`${idx}`"
        :label="`${idx}`"
      >
          <b-input v-model="macros[idx]" class="macros-input"></b-input>
      </b-tab-item>
    </b-tabs>
    <div class="bottom">
      <div class="key-list" v-if="enableKeys.length">
        <div v-for="(key, idx) in enableKeys" :key="idx" class="keyborder" @click="pushKey(key)">
          <div
            class="keylabels"
            v-html="key.short ? key.short : key.name"
          ></div>
        </div>
      </div>
    </div>
    <div class="confirm">
      <b-button type="is-success" @click="saveMacro">{{ $t('general.save') }}</b-button>
    </div>
  </div>
</template>

<script>
  import { macroKeys, allKeycodes } from '@/config/key-group';
  export default {
    name: 'macro',
    props: ['hidDevice'],
    data() {
      return {
        isDragging: false,
        currMacro: '0',
        enableKeys: [],
        macros: [],
      };
    },
    created() {
      this.macros = Array.from({ length: this.hidDevice.getDeviceInfo('macro_count') }, () => '');

      this.enableKeys = [...macroKeys].filter(k  => k !== 'KC_NO')
        .map((key) => {
          let c = allKeycodes.filter((k) => key == k.code);
          if (!c.length) {
            return false;
          }
          return Object.assign({}, c[0]);
        })
        .filter((k) => k);

      this.hidDevice.readMacroExpressions().then((res) => {
        console.log('readMacroExpressions', res);
        this.macros = res;
      });
    },
    methods: {
      pushKey(key) {
        let curr = this.macros[this.currMacro];
        if (curr.endsWith('}')) {
          curr = [curr.slice(0, -1), ',', key.code, curr.slice(-1)].join('');
        } else if (curr) {
          curr += `,${key.code}`;
        } else {
          curr = `{${key.code}}`;
        } 
        this.$set(this.macros, this.currMacro, curr);
      },
      saveMacro() {
        this.hidDevice.writeMacroExpressions([...this.macros]);
      },
    },
    computed: {
      placeholder() {
        return `Enter the macro you want to execute`;
      },
    },
  };
</script>
<style lang="scss" scope>
  .panel-wrap {
    width: 100%;
    .bottom {
      display: flex;
      justify-content: space-between;
      width: 100%;
      .help {
        width: 40%;
        flex-shrink: 0;
      }
    }
    .key-list {
      display: flex;
      align-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      .keyborder {
        font-size: 12px;
        position: relative;
        height: 40px;
        min-width: 40px;
        margin: 4px 5px 4px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5px;
        .keylabels {
          padding: 4px 6px;
          line-height: 16px;
        }
      }
      .del {
        width: 16px;
        height: 16px;
        position: absolute;
        right: -4px;
        top: -4px;
      }
    }
    .macros-input input {
      background: transparent;
      color: #fff;
    }
    .flip-list-move {
      transition: transform 0.5s;
    }
    .no-move {
      transition: transform 0s;
    }
    .ghost {
      opacity: 0.5;
      background: #c8ebfb;
    }
    .list-group-item {
      cursor: move;
    }
    .confirm {
      margin: 15px 0;
    }
  }
</style>
<style>
.panel-wrap.macro .b-tabs .tab-content {
  padding: 1em 0;

}
.panel-wrap.macro .tabs .is-active a {
  border-bottom-color: var(--bg-opcacity-4)!important;
}
</style>