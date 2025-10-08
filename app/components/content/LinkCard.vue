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
const displayDomain = computed(() => {
  try {
    return new URL(props.url).hostname.replace('www.', '');
  } catch {
    return props.url;
  }
});
const faviconUrl = computed(() => `https://www.google.com/s2/favicons?domain=${props.url}&sz=32`);

const handleFaviconError = (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLElement) {
    target.style.display = 'none';
  }
};
</script>

<template>
  <ULink
    v-if="!pending"
    :to="url"
    target="_blank"
    class="my-5 block border border-accented rounded-lg overflow-hidden hover:border-secondary transition-colors group"
  >
    <div class="flex items-center h-28">
      <div class="flex-1 p-4 min-w-0">
        <h3 class="text-base font-semibold text-primary group-hover:text-secondary mb-1 line-clamp-1">
          {{ displayTitle }}
        </h3>
        <p class="text-sm text-muted line-clamp-1 mb-2">
          {{ displayDescription }}
        </p>
        <div class="flex items-center gap-1 text-xs text-default">
          <img
            :src="faviconUrl"
            :alt="`${displayDomain} favicon`"
            class="w-4 h-4"
            @error="handleFaviconError"
          >
          <span class="truncate">{{ displayDomain }}</span>
        </div>
      </div>
      <div v-if="displayImage" class="h-full w-28 sm:w-56 flex-shrink-0">
        <img
          :src="displayImage"
          :alt="displayTitle"
          class="h-full w-full object-cover"
        >
      </div>
    </div>
  </ULink>
  <div v-else class="my-5 p-6 rounded-lg bg-elevated/50 animate-pulse">
    <div class="h-6 bg-default rounded w-3/4 mb-2" />
    <div class="h-4 bg-default rounded w-full" />
  </div>
</template>
