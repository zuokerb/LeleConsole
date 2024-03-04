import { localStore } from './index';

const state = {
  lang: localStore.get('lang'),
  uuid: localStore.get('fingerprint'),
};

const getters = {
  lang() {
    return state.lang;
  },
  uuid() {
    return state.uuid;
  },
};

const mutations = {
  SET_VIEW_STATE(state, payload) {
    state[payload.key] = payload.val;
    localStore.set(payload.key, payload.val);
  },
};

const actions = {};

export default {
  state,
  getters,
  mutations,
  actions,
};
