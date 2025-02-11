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
import type { PropType } from 'vue';

const props = defineProps({
  href: {
    type: String,
    default: '',
  },
  target: {
    type: String as PropType<'_blank' | '_parent' | '_self' | '_top' | (string & object) | null | undefined>,
    default: undefined,
    required: false,
  },
});

const isExternalLink = computed(() => {
  return props.href.startsWith('http://') || props.href.startsWith('https://');
});
</script>
