// standard.site のレコード送信用マニフェスト
// scripts/sync.ts がこれを読み、PDS に publication / document レコードを putRecord する
interface ManifestEntry<T> {
  rkey: string;
  uri: string | null;
  record: T;
}

// publication は icon の blob 参照をビルド時に作れないため、画像の URL を record の外に置く。
// sync.ts が画像を取得して uploadBlob し、record.icon に入れる
interface PublicationEntry extends ManifestEntry<PublicationRecord> {
  iconUrl: string | null;
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

// 未設定ならサイトの favicon。サイトからの絶対パスはサイト URL と結合し、絶対 URL はそのまま使う
const resolveIconUrl = (siteUrl: string, icon: string): string | null => {
  if (/^https?:\/\//.test(icon)) return icon;
  if (!siteUrl || siteUrl === '/') return null;
  const path = icon || '/favicon.ico';
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export default defineEventHandler(async (event) => {
  const { did, publicationRkey, collections, publicationIcon } = useRuntimeConfig(event).public.standardSite;
  const configured = Boolean(did && publicationRkey);
  const site = getSiteConfig(event);
  const siteUrl = withoutTrailingSlashes(site.url);
  const publicationAtUri = configured ? publicationUri(did, publicationRkey) : null;

  const publication: PublicationEntry = {
    rkey: publicationRkey,
    uri: publicationAtUri,
    record: {
      $type: STANDARD_SITE_PUBLICATION_NSID,
      url: siteUrl,
      name: site.name,
      ...(site.description ? { description: site.description } : {}),
      preferences: { showInDiscover: true },
    },
    iconUrl: resolveIconUrl(siteUrl, publicationIcon),
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
