<script setup lang="ts">
useSeoMeta({
  twitterCard: 'summary_large_image',
  twitterSite: '@373_3',
  ogLocale: 'ja_JP',
});

defineOgImage('Site');

useHead({
  link: [
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'ryuhei373.dev',
      href: 'https://ryuhei373.dev/rss.xml',
    },
  ],
});
</script>

<template>
  <UApp>
    <AppHeader />
    <UContainer>
      <div class="max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </UContainer>
    <AppFooter />
  </UApp>
</template>
