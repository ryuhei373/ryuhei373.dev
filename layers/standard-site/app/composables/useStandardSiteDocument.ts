// 記事ページの head に <link rel="site.standard.document"> を出す（document レコードとの双方向検証に使われる）
// rkey は createdAt から導出するため、記事データを受け取れるページ側で呼ぶ
export const useStandardSiteDocument = (article: { createdAt: string }): void => {
  const { did, publicationRkey } = useRuntimeConfig().public.standardSite;
  if (!did || !publicationRkey) return;

  const rkey = documentRkey(toPublishedAt(article.createdAt));
  useHead({
    link: [{ rel: STANDARD_SITE_DOCUMENT_NSID, href: documentUri(did, rkey) }],
  });
};
