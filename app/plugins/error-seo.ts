export default defineNuxtPlugin({
  name: 'error-seo',
  setup() {
    const err = useError();
    useHead({
      title: () => err.value ? `${err.value.statusCode} | ryuhei373.dev` : null,
    });
  },
});
