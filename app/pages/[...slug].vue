<script setup lang="ts">
const route = useRoute();
const path = route.path.replace(/\/$/, '');
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
  <UPage v-if="article" as="article">
    <UPageHeader :title="article.title">
      <PostedDate :created-at="article.createdAt" />
    </UPageHeader>

    <UPageBody>
      <ContentRenderer :value="article" />
    </UPageBody>
  </UPage>
</template>
