<script setup lang="ts">
const props = defineProps<{
  path: string;
}>();

const { data: surround } = await useAsyncData(`${props.path}-surround`, () => {
  return queryCollectionItemSurroundings('blog', props.path, {
    fields: ['title', 'path'],
  }).order('createdAt', 'DESC');
});

const prev = computed(() => surround.value?.[0]);
const next = computed(() => surround.value?.[1]);

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
</script>

<template>
  <nav
    aria-label="記事ナビゲーション"
    class="mt-16 pt-10 border-t border-default"
  >
    <div
      v-if="prev || next"
      class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
    >
      <ULink
        v-if="prev"
        :to="prev.path"
        class="group block"
        active-class=""
        inactive-class=""
      >
        <span class="inline-flex items-center gap-1 text-xs tracking-wider text-muted">
          <UIcon
            name="i-ri-arrow-left-s-line"
            class="size-4 transition-transform group-hover:-translate-x-0.5"
          />
          前の記事
        </span>
        <h3 class="mt-2 text-lg font-bold text-highlighted leading-snug decoration-1 underline-offset-4 group-hover:text-secondary group-hover:underline">
          {{ prev.title }}
        </h3>
      </ULink>

      <ULink
        v-if="next"
        :to="next.path"
        class="group block md:col-start-2 md:text-right"
        active-class=""
        inactive-class=""
      >
        <span class="inline-flex items-center gap-1 text-xs tracking-wider text-muted">
          次の記事
          <UIcon
            name="i-ri-arrow-right-s-line"
            class="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
        <h3 class="mt-2 text-lg font-bold text-highlighted leading-snug decoration-1 underline-offset-4 group-hover:text-secondary group-hover:underline">
          {{ next.title }}
        </h3>
      </ULink>
    </div>

    <div class="mt-12 flex justify-center">
      <button
        type="button"
        class="inline-flex items-center gap-1 text-sm text-muted hover:text-secondary underline underline-offset-4"
        @click="scrollToTop"
      >
        <UIcon
          name="i-ri-arrow-up-s-line"
          class="size-4"
        />
        記事の先頭へ
      </button>
    </div>
  </nav>
</template>
