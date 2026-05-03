<script setup lang="ts">
const props = defineProps<{
  objectKey: string;
}>();

const src = computed(() => `https://images.ryuhei373.dev/${props.objectKey}`);
</script>

<template>
  <ProseImg
    :src="src"
    :alt="objectKey"
    sizes="100vw md:768px"
    format="auto"
    :quality="85"
    loading="lazy"
  />
</template>
