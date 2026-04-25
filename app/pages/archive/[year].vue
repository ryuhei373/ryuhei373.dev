<script setup lang="ts">
const route = useRoute();
const year = computed(() => String(route.params.year));

const { data: articles } = await useAsyncData(
  `archive-${year.value}`,
  async () => {
    const all = await queryCollection('blog')
      .select('title', 'path', 'description', 'createdAt', 'tags')
      .order('createdAt', 'DESC')
      .all();
    return all.filter(article =>
      article.createdAt && new Date(article.createdAt).getFullYear() === Number(year.value),
    );
  },
);

if (!articles.value?.length) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Year not found',
    fatal: true,
  });
}

useSeoMeta({
  title: year.value,
  description: `${year.value}年の記事一覧`,
});

defineOgImage('Site');
</script>

<template>
  <div>
    <UPageHeader :title="year" />
    <UPageList divide>
      <UBlogPost
        v-for="article in articles"
        :key="article.path"
        variant="naked"
        orientation="vertical"
      >
        <template #body>
          <ULink
            :to="article.path"
            class="block py-8 hover:text-secondary group"
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
              <div class="underline inline-flex items-center gap-1">
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
    </UPageList>
  </div>
</template>
