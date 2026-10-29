<script setup lang="ts">
import { slides } from '~/data/slides';

useSeoMeta({
  title: 'Slides',
  description: '登壇スライドの一覧',
});

defineOgImage('Site');
</script>

<template>
  <div>
    <UPageHeader title="Slides" />
    <ul class="list-none p-0 mt-10 mb-0">
      <li
        v-for="slide in slides"
        :key="slide.slug"
        class="border-b border-default py-3"
      >
        <p class="font-bold text-highlighted">
          {{ slide.title }}
        </p>
        <div class="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <PostedDate :created-at="slide.date" />
          <span class="text-sm text-muted">{{ slide.event }}</span>
          <span class="flex gap-4 text-sm">
            <ULink
              :to="slide.url"
              external
              target="_blank"
              class="underline hover:text-secondary"
              active-class=""
              inactive-class=""
            >
              スライド
            </ULink>
            <ULink
              :to="slide.pdf"
              external
              target="_blank"
              class="underline hover:text-secondary"
              active-class=""
              inactive-class=""
            >
              PDF
            </ULink>
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>
