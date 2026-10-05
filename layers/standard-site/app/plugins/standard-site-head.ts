// standard.site の discovery 用 link タグを全ページの head に注入する
// - 全ページ: <link rel="site.standard.publication">（検証の代替ではなく discovery hint）
// - 記事ページ: <link rel="site.standard.document">（document レコードとの双方向検証に使われる）
export default defineNuxtPlugin({
  name: 'standard-site-head',
  setup() {
    const route = useRoute();
    const { did, publicationRkey, collections } = useRuntimeConfig().public.standardSite;

    useHead({
      link: computed(() => {
        if (!did) return [];

        const links = [
          { rel: STANDARD_SITE_PUBLICATION_NSID, href: publicationUri(did, publicationRkey) },
        ];
        for (const { prefix } of Object.values(collections)) {
          const rkey = documentRkeyFromPath(route.path, prefix);
          if (rkey) {
            links.push({ rel: STANDARD_SITE_DOCUMENT_NSID, href: documentUri(did, rkey) });
            break;
          }
        }
        return links;
      }),
    });
  },
});
