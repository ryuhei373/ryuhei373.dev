<script setup lang="ts">
const { path } = useRoute();
const { data: articles } = await useAsyncData(path, () => queryCollection('blog').select('title', 'path', 'description', 'createdAt').order('createdAt', 'DESC').all());
</script>

<template>
  <SnsLinks />
  <UPageList divide>
    <UBlogPost
      v-for="article in articles"
      :key="article.path"
      variant="naked"
      orientation="vertical"
    >
      <template #body>
        <ULink :to="article.path" class="block py-8">
          <h2 class="text-2xl font-bold text-highlighted">
            {{ article.title }}
          </h2>
          <PostedDate :created-at="article.createdAt" class="mb-5" />
          <p class="text-sm/relaxed text-default mb-5">{{ article.description }}</p>
          <div class="flex justify-end">
            <div class="hover:underline inline-flex items-center gap-1">
              Read More
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
            </div>
          </div>
        </ULink>
      </template>
    </UBlogPost>
  </UPageList>
</template>
