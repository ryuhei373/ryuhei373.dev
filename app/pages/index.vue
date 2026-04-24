<script setup lang="ts">
const { path } = useRoute();
const { data: articles } = await useAsyncData(path, () => queryCollection('blog').select('title', 'path', 'description', 'createdAt', 'tags').order('createdAt', 'DESC').all());
</script>

<template>
  <UBlogPosts orientation="vertical">
    <UBlogPost
      v-for="article in articles"
      :key="article.path"
      variant="naked"
      orientation="vertical"
    >
      <template #body>
        <ULink
          :to="article.path"
          class="block hover:text-secondary group"
          inactive-class="text-primary"
        >
          <h2 class="text-2xl font-bold text-highlighted">
            {{ article.title }}
          </h2>
          <div class="flex items-baseline flex-wrap gap-x-4 gap-y-1 mb-5">
            <PostedDate :created-at="article.createdAt" />
            <ArticleTags
              v-if="article.tags?.length"
              :tags="article.tags"
            />
          </div>
          <p class="text-sm/relaxed text-default mb-5">{{ article.description }}</p>
          <div class="flex justify-end">
            <div class="group-hover:underline inline-flex items-center gap-1">
              Read More
              <UIcon
                name="i-ri-arrow-right-s-line"
                class="w-4 h-4"
              />
            </div>
          </div>
        </ULink>
      </template>
    </UBlogPost>
  </UBlogPosts>
</template>
