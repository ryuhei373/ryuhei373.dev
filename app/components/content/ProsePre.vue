<template>
  <pre
    :class="$props.class"
    class="bg-light-ui border-light-ui-2 dark:bg-dark-ui dark:border-dark-ui-2 border border-solid px-4 py-2 rounded overflow-x-auto text-sm"
  ><slot /></pre>
</template>

<script setup lang="ts">
defineProps({
  code: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: null,
  },
  filename: {
    type: String,
    default: null,
  },
  highlights: {
    type: Array as () => number[],
    default: () => [],
  },
  meta: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: null,
  },
});
</script>

<style>
pre code .line {
    display: block;
}
</style>
