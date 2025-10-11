<script setup lang="ts">
defineProps<{
  tags?: string[];
}>();
</script>

<template>
  <div
    v-if="tags && tags.length > 0"
    class="flex gap-2 flex-wrap"
  >
    <ULink
      v-for="tag in tags"
      :key="tag"
      :to="`/blog/tags/${tag}`"
    >
      <UBadge
        variant="soft"
        color="neutral"
        size="sm"
      >
        {{ tag }}
      </UBadge>
    </ULink>
  </div>
</template>
