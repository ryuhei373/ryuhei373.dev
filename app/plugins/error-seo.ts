// error.vue の setup 内で useSeoMeta を呼ぶと、直接 URL で 404 にアクセスされた際に
// unhead コンテキストにバインドされず title が反映されないケースがあるため plugin 化。
// また nuxt-seo-utils の titleTemplate はエラー時に siteName suffix を付けない
// (`err ? "%s" : "%s %separator %siteName"`) ので、ここで明示的に付与する。
export default defineNuxtPlugin({
  name: 'error-seo',
  setup() {
    const err = useError();
    const site = useSiteConfig();
    useHead({
      title: () => err.value ? `${err.value.statusCode} | ${site.name}` : null,
    });
  },
});
