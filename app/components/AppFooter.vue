<script setup lang="ts">
const { data: years } = await useAsyncData('footer-archive-years', async () => {
  const posts = await queryCollection('blog').select('createdAt').all();
  const set = new Set<number>();
  for (const post of posts) {
    if (post.createdAt) set.add(new Date(post.createdAt).getFullYear());
  }
  return [...set].sort((a, b) => b - a);
});

const connectLinks = [
  { icon: 'ri:github-fill', label: '@ryuhei373', url: 'https://github.com/ryuhei373' },
  { icon: 'ri:bluesky-fill', label: '@ryuhei373.dev', url: 'https://bsky.app/profile/ryuhei373.dev' },
  { icon: 'ri:twitter-x-fill', label: '@373_3', url: 'https://x.com/373_3' },
];
</script>

<template>
  <UFooter
    :ui="{
      root: 'border-t border-muted mt-16',
    }"
  >
    <template #top>
      <UContainer class="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div>
          <h2 class="text-sm font-semibold text-highlighted mb-3">
            Archive
          </h2>
          <ul class="list-none p-0 m-0 space-y-2">
            <li
              v-for="year in years"
              :key="year"
            >
              <ULink
                :to="`/archive/${year}/`"
                class="text-sm text-muted hover:text-secondary tabular-nums"
                active-class=""
                inactive-class=""
              >
                {{ year }}
              </ULink>
            </li>
          </ul>
        </div>
        <div>
          <h2 class="text-sm font-semibold text-highlighted mb-3">
            Connect
          </h2>
          <ul class="list-none p-0 m-0 space-y-2">
            <li
              v-for="link in connectLinks"
              :key="link.label"
            >
              <ULink
                :to="link.url"
                target="_blank"
                class="inline-flex items-center gap-2 text-sm text-muted hover:text-secondary"
                active-class=""
                inactive-class=""
              >
                <UIcon
                  :name="link.icon"
                  class="size-4"
                />
                {{ link.label }}
              </ULink>
            </li>
            <li>
              <ULink
                to="/rss.xml"
                external
                class="inline-flex items-center gap-2 text-sm text-muted hover:text-secondary"
                active-class=""
                inactive-class=""
              >
                <UIcon
                  name="ri:rss-fill"
                  class="size-4"
                />
                RSS
              </ULink>
            </li>
          </ul>
        </div>
        <div>
          <h2 class="text-sm font-semibold text-highlighted mb-3">
            Colophon
          </h2>
          <ul class="list-none p-0 m-0 space-y-2 text-sm text-muted">
            <li>Built with Nuxt 4 / Nuxt UI / Nuxt Content</li>
            <li>Hosted on Cloudflare Workers</li>
            <li>
              Themed with
              <ULink
                to="https://stephango.com/flexoki"
                target="_blank"
                class="underline hover:text-secondary"
                inactive-class="text-primary"
              >
                flexoki
              </ULink>
            </li>
            <li>
              <ULink
                to="https://github.com/ryuhei373/ryuhei373.dev"
                target="_blank"
                class="hover:text-secondary"
                inactive-class="text-primary"
              >
                Source on GitHub
              </ULink>
            </li>
          </ul>
        </div>
      </UContainer>
    </template>
  </UFooter>
</template>
