<script setup lang="ts">
const { data: groups } = await useAsyncData('archive-index', async () => {
  const articles = await queryCollection('blog')
    .select('title', 'path', 'createdAt')
    .order('createdAt', 'DESC')
    .all();
  const byYear = new Map<number, typeof articles>();
  for (const article of articles) {
    const year = new Date(article.createdAt).getFullYear();
    byYear.set(year, [...(byYear.get(year) ?? []), article]);
  }
  return [...byYear].map(([year, posts]) => ({ year, posts }));
});

useSeoMeta({
  title: 'Archive',
  description: 'すべての記事の一覧',
});

defineOgImage('Site');
</script>

<template>
  <div>
    <UPageHeader title="Archive" />
    <section
      v-for="group in groups"
      :key="group.year"
      class="mt-10"
    >
      <h2
        :id="`year-${group.year}`"
        class="mb-2 text-lg font-bold text-highlighted tabular-nums scroll-mt-[calc(var(--ui-header-height)+1rem)]"
      >
        {{ group.year }}
      </h2>
      <PostCompactList
        :posts="group.posts"
      />
    </section>
  </div>
</template>
