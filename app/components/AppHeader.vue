<script setup lang="ts">
import { navItems, navUi } from '~/data/nav';
</script>

<template>
  <UHeader
    to="/"
    title="ryuhei373.dev"
    :toggle="false"
    :ui="{
      title: 'items-center gap-3 text-primary hover:text-secondary',
    }"
  >
    <template #title>
      <UAvatar
        :as="{ img: 'img' }"
        src="https://github.com/ryuhei373.png"
        alt="373.3 のアバター"
      />
      <span>ryuhei373.dev</span>
    </template>
    <template #right>
      <UNavigationMenu
        :items="navItems"
        variant="link"
        :ui="navUi"
        class="hidden sm:flex"
      />
      <DarkModeToggleSwitch />
    </template>
  </UHeader>
</template>
