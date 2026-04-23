<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number;
    statusMessage?: string;
    message?: string;
  };
}>();

useSeoMeta({
  title: String(props.error.statusCode),
});

const message = computed(() => {
  if (props.error.statusCode === 404) {
    return 'お探しのページは見つかりませんでした。';
  }
  return props.error.statusMessage || '予期せぬエラーが発生しました。';
});

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <UApp>
    <AppHeader />
    <UContainer>
      <div class="max-w-2xl mx-auto py-16">
        <h1 class="text-[clamp(3rem,2rem+5vw,5rem)] leading-none font-bold text-highlighted tabular-nums">
          {{ error.statusCode }}
        </h1>
        <p class="mt-6 text-lg text-default">
          {{ message }}
        </p>
        <div class="mt-10">
          <UButton
            color="primary"
            variant="solid"
            @click="handleError"
          >
            トップに戻る
          </UButton>
        </div>
      </div>
    </UContainer>
    <AppFooter />
  </UApp>
</template>
