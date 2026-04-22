<script setup lang="ts">
const { path } = useRoute();
const { data: article } = await useAsyncData(path, () => queryCollection('blog').path(path).first());

useSeoMeta(
  {
    title: `${article?.value?.title} | ryuhei373.dev`,
    description: article?.value?.description,
    twitterTitle: article?.value?.title,
    ogTitle: article?.value?.title,
    ogType: 'article',
    ogDescription: article?.value?.description,
    ogUrl: `https://ryuhei373.dev${path}`,
  },
);
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
