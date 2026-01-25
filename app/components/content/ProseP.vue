<script setup lang="ts">
// Nuxt UI のデフォルト prose.p から text-pretty を削除
// iOS Safari で折り返しが不安定になる問題の対策
</script>

<template>
  <p class="my-5 leading-7">
    <slot />
  </p>
</template>
