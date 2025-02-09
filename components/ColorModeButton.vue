<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed({
    get() {
        return colorMode.value === 'dark'
    },
    set() {
        colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
    }
})

const buttonIconName = computed(() => isDark.value ? 'ph:moon-bold' : 'ph:sun-bold')
const buttonAriaLabel = computed(() => isDark.value ? 'dark theme' : 'light theme')

const toggleTheme = () => {
    isDark.value = !isDark.value
}
</script>

<template>
    <UButton :icon="buttonIconName" class="p-0 cursor-pointer" color="neutral" size="xl" type="button" variant="ghost" :aria-label="buttonAriaLabel" @click="toggleTheme" />
</template>
