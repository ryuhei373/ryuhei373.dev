<script setup lang="ts">
type SNSLink = {
  name: string;
  text: string;
  url: string;
};

const snsLinks: SNSLink[] = [
  { name: 'ri:github-fill', text: '@ryuhei373', url: 'https://github.com/ryuhei373' },

  { name: 'ri:bluesky-fill', text: '@ryuhei373.dev', url: 'https://bsky.app/profile/ryuhei373.dev' },
  { name: 'ri:twitter-x-fill', text: '@373_3', url: 'https://x.com/373_3' },
];

const { path } = useRoute();
const { data: articles } = await useAsyncData(path, () => queryCollection('blog').select('title', 'path', 'description', 'createdAt').order('createdAt', 'DESC').all());
</script>

<template>
  <div class="mt-4">
    <ul class="list-none inline-flex gap-2">
      <li
        v-for="snsLink in snsLinks"
        :key="snsLink.name"
      >
        <NuxtLink
          :to="snsLink.url"
          target="_blank"
        >
          <UIcon
            :name="snsLink.name"
            class="size-5"
          />
        </NuxtLink>
      </li>
    </ul>
  </div>
  <div
    v-for="article in articles"
    :key="article.path"
    class="py-8 flex flex-wrap md:flex-nowrap not-last:border-b border-light-ui-3 dark:border-dark-ui-3"
  >
    <NuxtLink
      :to="article.path"
      class="w-full"
    >
      <h2 class="text-light-tx dark:text-dark-tx text-xl font-bold">
        {{ article.title }}
      </h2>
      <PostedDate :created-at="article.createdAt" />
      <p class="pt-4 text-sm leading-loose text-light-tx-2 dark:text-dark-tx-2 ">
        {{ article.description }}
      </p>
      <div
        class="flex items-center justify-end mt-4 gap-1"
      >
        <span>Read More</span>
        <UIcon name="ph:arrow-right-bold" />
      </div>
    </NuxtLink>
  </div>
</template>
