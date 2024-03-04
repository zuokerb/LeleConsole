<template>
  <div class="about">

    <div class="text">
      <span @click="showUUID = !showUUID">{{ $t('general.version') }} {{ version }}</span>
    </div>
    <div class="text" v-if="showUUID" @click="copyTextToClipboard(uuid)">
      DeviceId: {{ uuid }}</div>
    <div class="text">{{ $t('settings.powerBy') }}
      <external-link :url="'https://www.lelelab.work/'" :label="'LeleLab'" />
    </div>
    <b-field class="text" :label="$t('settings.lang')">
      <b-select v-model="currLang" @input="changeLang">
        <option v-for="lang of langs" :value="lang.val" :key="lang.val">
          {{ lang.label }}
        </option>
      </b-select>
    </b-field>

    <b-field class="text" :label="$t('tools.localConfig')">
      <div class="file-upload">
        <b-upload @input="readFile" class="file-label">
          <b-button type="is-success">{{ $t('tools.import') }}</b-button>
        </b-upload>
      </div>
    </b-field>
  </div>
</template>

<script>
import * as pckg from '../../../../package.json';
import ExternalLink from '@/components/external-link';
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import { parseConfigFile } from '@/utils/kb-helper.js';
export default {
  components: { ExternalLink },
  name: 'settings',
  data() {
    return {
      version: pckg.version,
      currLang: 'en',
      showUUID: false,
      langs: [
        { val: 'en', label: 'English' },
        { val: 'zh', label: '中文' },
        { val: 'de', label: 'Deutsch' },
        { val: 'fr', label: 'Français' },
        { val: 'ja', label: '日本語' },
        { val: 'ko', label: '조선말' },
        { val: 'es', label: 'Español' },
      ],
    };
  },
  computed: {
    appName() {
      return upperFirst(camelCase(pckg.name));
    },
    uuid() {
      return this.$store.getters.uuid;
    },
  },
  mounted() {
    this.currLang =
      typeof this.$store.getters.lang !== 'undefined'
        ? this.$store.getters.lang
        : 'en';
  },
  methods: {
    copyTextToClipboard(text) {
      navigator.clipboard.writeText(text).then(
        () => {
          this.toast(this.$t('general.uuid_copied'));
        },
        () => {
          this.open('failed to copy');
        }
      );
    },
    changeLang(lang) {
      this.$root.$i18n.locale = lang;
      this.$store.commit('SET_VIEW_STATE', {
        key: 'lang',
        val: lang,
      });
    },
    readFile(file) {
      parseConfigFile(file)
        .then((device) => {
          this.deviceCon.appendSupportDevice(device);
          this.toast(this.$t('general.load_done'));
          setTimeout(() => {
            this.deviceCon.reset();
          }, 2000);
        })
        .catch((err) => {
          this.toastErr(err);
        });
    },
  },
};
</script>
<style lang="scss">
.about {
  flex-direction: column;
  width: 700px;
  margin: 0 auto;
  align-items: flex-start;
  padding: 50px 0;

  .text,
  .field {
    font-size: 14px;
    margin-bottom: 20px !important;
    color: var(--text-color);
  }

  .label {
    font-weight: normal;
  }
}
</style>
