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
        src="https://github.com/ryuhei373.png"
        alt="ryuhei373 のアバター"
      />
      <span>ryuhei373.dev</span>
    </template>
    <template #right>
      <DarkModeToggleSwitch />
    </template>
  </UHeader>
</template>
