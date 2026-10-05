// 全ページの head に <link rel="site.standard.publication"> を出す（検証の代替ではなく discovery hint）
// 記事ページの <link rel="site.standard.document"> は useStandardSiteDocument で出す
export default defineNuxtPlugin({
  name: 'standard-site-head',
  setup() {
    const { did, publicationRkey } = useRuntimeConfig().public.standardSite;
    if (!did || !publicationRkey) return;

    useHead({
      link: [{ rel: STANDARD_SITE_PUBLICATION_NSID, href: publicationUri(did, publicationRkey) }],
    });
  },
});
