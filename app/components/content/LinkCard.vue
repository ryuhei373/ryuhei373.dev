<script setup lang="ts">
const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
});

interface OgpData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
}

const { data: ogpData, pending, error } = useFetch<OgpData>('/api/ogp', {
  query: { url: props.url },
  // プロップで指定された値がある場合はOGP取得をスキップ
  immediate: !props.title && !props.description,
});

const displayTitle = computed(() => props.title || ogpData.value?.title || props.url);
const displayDescription = computed(() => props.description || ogpData.value?.description || '');
const displayImage = computed(() => props.image || ogpData.value?.image || '');
</script>

<template>
  <ULink
    v-if="!pending"
    :to="url"
    target="_blank"
    class="my-5 block border border-[var(--ui-border-accented)] rounded-lg overflow-hidden hover:border-[var(--ui-border-highlighted)] transition-colors"
  >
    <div class="flex flex-col sm:flex-row sm:items-center sm:h-28">
      <div v-if="displayImage" class="h-48 sm:h-full w-full sm:w-56 flex-shrink-0 sm:order-last">
        <img
          :src="displayImage"
          :alt="displayTitle"
          class="h-full w-full object-cover"
        >
      </div>
      <div class="flex-1 p-4 min-w-0">
        <h3 class="text-base font-semibold text-[var(--ui-text-primary)] mb-1">
          {{ displayTitle }}
        </h3>
        <p class="text-sm text-[var(--ui-text-muted)] line-clamp-2">
          {{ displayDescription }}
        </p>
      </div>
    </div>
  </ULink>
  <div v-else class="my-5 p-6 rounded-lg bg-elevated/50 animate-pulse">
    <div class="h-6 bg-default rounded w-3/4 mb-2" />
    <div class="h-4 bg-default rounded w-full" />
  </div>
</template>
