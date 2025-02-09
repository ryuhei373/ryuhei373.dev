<script setup lang="ts">
const props = defineProps({
    createdAt: {
        type: String,
        required: true,
    },
})

const postedDate = computed(() => {
    const date = new Date(props.createdAt)
    return date.toLocaleDateString('ja-JP', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
})
</script>

<template>
    <time class="text-light-tx-2 dark:text-dark-tx-2 text-sm inline-block">{{ postedDate }}</time>
</template>
