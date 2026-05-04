<script setup lang="ts">
const props = defineProps<{
  objectKey: string;
  width?: number | string;
  height?: number | string;
}>();

const src = computed(() => `/${props.objectKey}`);
</script>

<template>
  <ProseImg
    :src="src"
    :alt="objectKey"
    :zoom="false"
    :width="width"
    :height="height"
    sizes="100vw md:768px"
    format="auto"
    :quality="85"
    loading="lazy"
  />
</template>
