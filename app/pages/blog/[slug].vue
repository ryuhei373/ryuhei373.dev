<script setup lang="ts">
const { path } = useRoute();
const { data: article } = await useAsyncData(path, () => queryCollection('blog').path(path).first());

if (!article.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Article not found',
    fatal: true,
  });
}

useSeoMeta({
  title: article.value.title,
  description: article.value.description,
  ogType: 'article',
});
</script>

<template>
  <UPage
    v-if="article"
    as="article"
  >
    <UPageHeader :title="article.title">
      <div class="flex items-baseline flex-wrap gap-x-4 gap-y-1">
        <PostedDate :created-at="article.createdAt" />
        <ArticleTags
          v-if="article.tags?.length"
          :tags="article.tags"
          linked
        />
      </div>
    </UPageHeader>

    <UPageBody>
      <ContentRenderer :value="article" />
    </UPageBody>
  </UPage>
</template>
