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

useSeoMeta({
  title: `${year.value} | ryuhei373.dev`,
  description: `${year.value}年の記事一覧`,
  ogTitle: `${year.value} | ryuhei373.dev`,
  ogType: 'website',
  ogDescription: `${year.value}年の記事一覧`,
  ogUrl: `https://ryuhei373.dev/archive/${year.value}/`,
});
</script>

<template>
  <UPageHeader :title="year" />
  <UPageList
    v-if="articles?.length"
    divide
  >
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
  </UPageList>
  <p
    v-else
    class="text-muted text-sm mt-8"
  >
    この年の記事はまだありません。
  </p>
</template>
