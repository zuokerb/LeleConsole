import Vue from 'vue';

import App from './App.vue';
import store from './store';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faTimes,
  faWindowMinimize,
  faTools,
  faToolbox,
  faKeyboard,
  faCogs,
  faInfoCircle,
  faCircle,
  faMusic,
  faLayerGroup,
  faLightbulb,
  faStar,
  faDotCircle,
  faTimesCircle,
  faUpload,
  faQuestionCircle,
  faArrowAltCircleRight,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import Buefy from 'buefy';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));

library.add(
  faTimes,
  faWindowMinimize,
  faTools,
  faToolbox,
  faKeyboard,
  faCogs,
  faInfoCircle,
  faCircle,
  faDotCircle,
  faMusic,
  faLayerGroup,
  faLightbulb,
  faStar,
  faTimesCircle,
  faUpload,
  faQuestionCircle,
  faSyncAlt
);
Vue.component('vue-fontawesome', FontAwesomeIcon);
Vue.use(Buefy, {
  defaultIconComponent: 'vue-fontawesome',
  defaultIconPack: 'fas',
});

import GlobalHelper from '@/utils/global';
Vue.use(GlobalHelper);

import VueDragDrop from 'vue-drag-drop';
Vue.use(VueDragDrop);

import Multiselect from 'vue-multiselect';
Vue.component('multiselect', Multiselect);

Vue.filter('hexId', function (value) {
  return '0x' + parseInt(value).toString(16).toUpperCase()
})

import VueI18n from 'vue-i18n';
Vue.use(VueI18n);

import messages from './lang/index.js';

const i18n = new VueI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  silentFallbackWarn: true,
  messages,
});

Vue.config.productionTip = false;
export const app = new Vue({
  components: { App },
  store,
  i18n,
  template: '<App/>',
}).$mount('#app');
