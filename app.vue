<script setup lang="ts">
useSeoMeta({
  title: 'ryuhei373.dev',
  description: '猫2匹と暮らしているWebアプリケーション開発者。HTMLとCSSが好き。',
  twitterCard: 'summary',
  twitterSite: '@373_3',
  twitterTitle: 'ryuhei373.dev',
  ogTitle: 'ryuhei373.dev',
  ogType: 'website',
  ogSiteName: 'ryuhei373.dev',
  ogDescription: '猫2匹と暮らしているWebアプリケーション開発者。HTMLとCSSが好き。',
  ogImage: 'https://github.com/ryuhei373.png',
  ogLocale: 'ja_JP',
  ogUrl: 'https://ryuhei373.dev/',
});

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
    <div class="container mx-auto max-w-screen-md px-6 py-8 md:px-0">
      <AppHeader />
      <NuxtPage />
    </div>
  </UApp>
</template>
