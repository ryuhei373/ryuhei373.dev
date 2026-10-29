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
    <AppMobileNav />
    <UContainer as="main">
      <NuxtPage />
    </UContainer>
    <AppFooter />
  </UApp>
</template>
