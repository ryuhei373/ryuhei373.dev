<script setup lang="ts">
defineProps<{
  posts: { title: string; path: string; createdAt: string }[];
}>();
</script>

<template>
  <ul class="list-none p-0 m-0">
    <li
      v-for="post in posts"
      :key="post.path"
      class="border-b border-default"
    >
      <ULink
        :to="post.path"
        class="flex items-baseline gap-4 py-3 hover:text-secondary"
        inactive-class="text-highlighted"
      >
        <PostedDate
          :created-at="post.createdAt"
          class="shrink-0"
        />
        <span class="min-w-0 truncate">{{ post.title }}</span>
      </ULink>
    </li>
  </ul>
</template>
