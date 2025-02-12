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
  <article
    v-if="article"
    class="mt-8 break-words"
  >
    <h1 class="text-3xl font-bold mb-2">
      {{ article.title }}
    </h1>
    <PostedDate :created-at="article.createdAt" />
    <ContentRenderer
      class="pt-8 text-[106.25%]"
      :value="article"
    />
  </article>
</template>
