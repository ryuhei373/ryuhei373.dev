<script setup lang="ts">
const route = useRoute();
const tag = route.params.tag as string;

const { data: allArticles } = await useAsyncData('all-articles', () =>
  queryCollection('blog')
    .select('title', 'path', 'description', 'createdAt', 'tags')
    .order('createdAt', 'DESC')
    .all(),
);

const articles = computed(() => {
  return allArticles.value?.filter(article =>
    article.tags?.includes(tag),
  ) || [];
});

useSeoMeta({
  title: `${tag} | ryuhei373.dev`,
  description: `${tag}タグの記事一覧`,
  ogTitle: `${tag} | ryuhei373.dev`,
  ogDescription: `${tag}タグの記事一覧`,
  ogUrl: `https://ryuhei373.dev/tags/${tag}`,
});
</script>

<template>
  <UPage>
    <UPageHeader :title="`タグ: ${tag}`">
      <template #description>
        {{ articles.length }}件の記事
      </template>
    </UPageHeader>

    <UPageBody>
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
              <PostedDate :created-at="article.createdAt" class="mb-3" />
              <ArticleTags :tags="article.tags" class="mb-5" />
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
    </UPageBody>
  </UPage>
</template>
