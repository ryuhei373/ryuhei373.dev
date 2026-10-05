export const STANDARD_SITE_PUBLICATION_NSID = 'site.standard.publication';
export const STANDARD_SITE_DOCUMENT_NSID = 'site.standard.document';

export const publicationUri = (did: string, rkey: string): string =>
  `at://${did}/${STANDARD_SITE_PUBLICATION_NSID}/${rkey}`;

export const documentUri = (did: string, rkey: string): string =>
  `at://${did}/${STANDARD_SITE_DOCUMENT_NSID}/${rkey}`;

// 末尾スラッシュを除去する（ルート `/` はそのまま）
export const withoutTrailingSlashes = (path: string): string =>
  path.replace(/\/+$/, '') || '/';

// `/blog/2024-01-01` + `/blog` → `2024-01-01`。prefix 直下の 1 セグメントのみを document とみなす
export const documentRkeyFromPath = (path: string, prefix: string): string | null => {
  const normalizedPath = withoutTrailingSlashes(path);
  const normalizedPrefix = withoutTrailingSlashes(prefix);
  const base = normalizedPrefix === '/' ? '/' : `${normalizedPrefix}/`;
  if (!normalizedPath.startsWith(base)) return null;

  const rest = normalizedPath.slice(base.length);
  if (!rest || rest.includes('/')) return null;
  return rest;
};
