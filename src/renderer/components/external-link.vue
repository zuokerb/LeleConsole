<template>
  <a @click="openUrl">{{label}}</a>
</template>

<script>
  import { shell } from 'electron';
  export default {
    props: {
      url: {
        type: String,
      },
      label: {
        type: String,
      },
    },
    methods: {
      openUrl() {
        shell.openExternal(this.url);
      },
    },
  };
</script>
