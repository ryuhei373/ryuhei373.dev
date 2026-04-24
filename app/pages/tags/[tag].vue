<script setup lang="ts">
import { getTagDisplayName } from '~/utils/tags';

const route = useRoute();
const tag = computed(() => String(route.params.tag));
const displayName = computed(() => getTagDisplayName(tag.value));

const { data: articles } = await useAsyncData(
  `tags-${tag.value}`,
  async () => {
    const all = await queryCollection('blog')
      .select('title', 'path', 'description', 'createdAt', 'tags')
      .order('createdAt', 'DESC')
      .all();
    return all.filter(article => article.tags?.includes(tag.value));
  },
);

if (!articles.value?.length) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Tag not found',
    fatal: true,
  });
}

useSeoMeta({
  title: `#${displayName.value}`,
  description: `${displayName.value} に関する記事一覧`,
});

defineOgImage('Site');
</script>

<template>
  <UPageHeader :title="`#${displayName}`" />
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
</template>
