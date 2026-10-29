<script setup lang="ts">
import { navItems, navUi } from '~/data/nav';
</script>

<template>
  <div class="sm:hidden">
    <UContainer class="h-11 py-0 flex items-center">
      <UNavigationMenu
        :items="navItems"
        variant="link"
        :ui="{ ...navUi, list: '-mx-2' }"
      />
    </UContainer>
  </div>
</template>
