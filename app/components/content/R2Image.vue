<script setup lang="ts">
const props = defineProps<{
  objectKey: string;
  width?: number | string;
  height?: number | string;
  caption?: string;
}>();

const src = computed(() => `/${props.objectKey}`);
</script>

<template>
  <figure class="my-6">
    <ProseImg
      :src="src"
      :alt="caption ?? objectKey"
      :zoom="false"
      :width="width"
      :height="height"
      sizes="100vw md:768px"
      format="auto"
      :quality="85"
      loading="lazy"
    />
    <figcaption
      v-if="caption"
      class="mt-2 text-sm text-muted text-center"
    >
      {{ caption }}
    </figcaption>
  </figure>
</template>
