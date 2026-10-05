// standard.site のレコード送信用マニフェスト
// scripts/sync.ts がこれを読み、PDS に publication / document レコードを putRecord する
interface ManifestEntry<T> {
  rkey: string;
  uri: string | null;
  record: T;
}

interface PublicationRecord {
  $type: typeof STANDARD_SITE_PUBLICATION_NSID;
  url: string;
  name: string;
  description?: string;
  preferences: { showInDiscover: boolean };
}

interface DocumentRecord {
  $type: typeof STANDARD_SITE_DOCUMENT_NSID;
  site: string | null;
  title: string;
  path: string;
  description?: string;
  publishedAt: string;
  tags?: string[];
  textContent: string;
}

export default defineEventHandler(async (event) => {
  const { did, publicationRkey, collections } = useRuntimeConfig(event).public.standardSite;
  const configured = Boolean(did && publicationRkey);
  const site = getSiteConfig(event);
  const publicationAtUri = configured ? publicationUri(did, publicationRkey) : null;

  const publication: ManifestEntry<PublicationRecord> = {
    rkey: publicationRkey,
    uri: publicationAtUri,
    record: {
      $type: STANDARD_SITE_PUBLICATION_NSID,
      url: withoutTrailingSlashes(site.url),
      name: site.name,
      ...(site.description ? { description: site.description } : {}),
      preferences: { showInDiscover: true },
    },
  };

  const documents: ManifestEntry<DocumentRecord>[] = [];
  const pathsByRkey = new Map<string, string>();
  for (const collection of collections) {
    // コレクション名は設定由来の文字列のため、queryCollection の型付きキーに合わせる
    const articles = await queryCollection(event, collection as 'blog')
      .order('createdAt', 'DESC')
      .all();

    for (const article of articles) {
      const path = withoutTrailingSlashes(article.path);
      const publishedAt = toPublishedAt(article.createdAt);
      const rkey = documentRkey(publishedAt);

      // rkey は publishedAt から導出するため、createdAt が同じ記事があると同じレコードを指してしまう
      const duplicated = pathsByRkey.get(rkey);
      if (duplicated) {
        throw createError({
          statusCode: 500,
          // statusMessage は非 ASCII 文字が除去されるため英語で書く
          statusMessage: `standard.site: duplicate document rkey ${rkey} (same createdAt: ${duplicated}, ${path})`,
        });
      }
      pathsByRkey.set(rkey, path);

      documents.push({
        rkey,
        uri: configured ? documentUri(did, rkey) : null,
        record: {
          $type: STANDARD_SITE_DOCUMENT_NSID,
          site: publicationAtUri,
          title: article.title,
          path,
          ...(article.description ? { description: article.description } : {}),
          publishedAt,
          ...(article.tags?.length ? { tags: [...article.tags] } : {}),
          textContent: minimarkToPlainText(article.body),
        },
      });
    }
  }

  return { publication, documents };
});
