<template>
  <NuxtLink
    :href="props.href"
    :target="isExternalLink ? '_blank' : '_self'"
    class="underline underline-offset-4"
  >
    <slot />
  </NuxtLink>
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
