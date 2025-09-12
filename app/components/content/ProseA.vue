<template>
  <ULink
    :href="props.href"
    :target="isExternalLink ? '_blank' : '_self'"
    class=""
  >
    <slot />
  </ULink>
</template>

<script setup lang="ts">
const props = defineProps({
  href: {
    type: String,
    default: '',
  },
});

const isExternalLink = computed(() => {
  return props.href.startsWith('http://') || props.href.startsWith('https://');
});
</script>
