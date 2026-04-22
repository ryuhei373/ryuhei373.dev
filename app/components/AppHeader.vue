<template>
  <UHeader
    to="/"
    title="ryuhei373.dev"
    :toggle="false"
    :ui="{
      container: 'flex items-center justify-between gap-3 h-full max-w-(--ui-container) mx-auto px-6',
      title: 'items-center gap-3 text-primary hover:text-secondary',
    }"
  >
    <template #title>
      <UAvatar src="https://github.com/ryuhei373.png" />
      <span>ryuhei373.dev</span>
    </template>
    <template #right>
      <DarkModeToggleSwitch />
    </template>
  </UHeader>
</template>
