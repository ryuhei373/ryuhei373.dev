<template>
    <NuxtLink :href="href" :target="target"
        class="underline underline-offset-4">
        <slot />
    </NuxtLink>
</template>

<script setup lang="ts">
defineProps({
    href: {
        type: String,
        default: ''
    },
    target: {
        type: String,
        default: undefined,
        required: false
    }
})
</script>
