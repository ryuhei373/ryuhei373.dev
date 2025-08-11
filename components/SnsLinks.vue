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
</script>

<template>
  <div class="mt-4">
    <ul class="list-none inline-flex gap-2">
      <li
        v-for="snsLink in snsLinks"
        :key="snsLink.name"
      >
        <ULink
          :to="snsLink.url"
          target="_blank"
        >
          <UIcon
            :name="snsLink.name"
            class="size-5"
          />
        </ULink>
      </li>
    </ul>
  </div>
</template>
