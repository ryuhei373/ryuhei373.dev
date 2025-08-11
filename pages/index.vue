<script setup lang="ts">
const { path } = useRoute();
const { data: articles } = await useAsyncData(path, () => queryCollection('blog').select('title', 'path', 'description', 'createdAt').order('createdAt', 'DESC').all());
</script>

<template>
  <SnsLinks />
  <div
    v-for="article in articles"
    :key="article.path"
    class="py-8 flex flex-wrap md:flex-nowrap not-last:border-b border-light-ui-3 dark:border-dark-ui-3"
  >
    <ULink
      :to="article.path"
      class="w-full"
    >
      <h2 class="text-2xl font-bold text-primary">
        {{ article.title }}
      </h2>
      <PostedDate :created-at="article.createdAt" />
      <p class="pt-4 text-sm/relaxed text-primary">
        {{ article.description }}
      </p>
      <div
        class="flex items-center justify-end mt-4 gap-1"
      >
        <span>Read More</span>
        <UIcon name="ph:arrow-right-bold" />
      </div>
    </ULink>
  </div>
</template>
