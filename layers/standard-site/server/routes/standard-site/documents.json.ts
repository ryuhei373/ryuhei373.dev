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

// createdAt は日付のみ（YYYY-MM-DD）なので Asia/Tokyo の 0:00 として扱う
const toPublishedAt = (createdAt: string): string => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(createdAt)
    ? new Date(`${createdAt}T00:00:00+09:00`)
    : new Date(createdAt);
  return date.toISOString();
};

export default defineEventHandler(async (event) => {
  const { did, publicationRkey, collections } = useRuntimeConfig(event).public.standardSite;
  const site = getSiteConfig(event);
  const publicationAtUri = did ? publicationUri(did, publicationRkey) : null;

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
  for (const [collection, { prefix }] of Object.entries(collections)) {
    // コレクション名は設定由来の文字列のため、queryCollection の型付きキーに合わせる
    const articles = await queryCollection(event, collection as 'blog')
      .order('createdAt', 'DESC')
      .all();

    for (const article of articles) {
      const path = withoutTrailingSlashes(article.path);
      const rkey = documentRkeyFromPath(path, prefix);
      if (!rkey) continue;

      documents.push({
        rkey,
        uri: did ? documentUri(did, rkey) : null,
        record: {
          $type: STANDARD_SITE_DOCUMENT_NSID,
          site: publicationAtUri,
          title: article.title,
          path,
          ...(article.description ? { description: article.description } : {}),
          publishedAt: toPublishedAt(article.createdAt),
          ...(article.tags?.length ? { tags: [...article.tags] } : {}),
          textContent: minimarkToPlainText(article.body),
        },
      });
    }
  }

  return { publication, documents };
});
