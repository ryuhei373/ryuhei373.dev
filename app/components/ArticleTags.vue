<script setup lang="ts">
import { getTagDisplayName } from '~/utils/tags';

defineProps({
  tags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  linked: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <ul
    v-if="tags.length > 0"
    class="flex flex-wrap gap-x-2 gap-y-1 list-none p-0 m-0"
  >
    <li
      v-for="tag in tags"
      :key="tag"
    >
      <ULink
        v-if="linked"
        :to="`/tags/${tag}/`"
        class="text-muted text-sm hover:text-primary"
        active-class=""
        inactive-class=""
      >
        #{{ getTagDisplayName(tag) }}
      </ULink>
      <span
        v-else
        class="text-muted text-sm"
      >
        #{{ getTagDisplayName(tag) }}
      </span>
    </li>
  </ul>
</template>
