export const STANDARD_SITE_PUBLICATION_NSID = 'site.standard.publication';
export const STANDARD_SITE_DOCUMENT_NSID = 'site.standard.document';

export const publicationUri = (did: string, rkey: string): string =>
  `at://${did}/${STANDARD_SITE_PUBLICATION_NSID}/${rkey}`;

export const documentUri = (did: string, rkey: string): string =>
  `at://${did}/${STANDARD_SITE_DOCUMENT_NSID}/${rkey}`;

// 末尾スラッシュを除去する（ルート `/` はそのまま）
export const withoutTrailingSlashes = (path: string): string =>
  path.replace(/\/+$/, '') || '/';

// createdAt は日付のみ（YYYY-MM-DD）なので Asia/Tokyo の 0:00 として扱い、ISO 8601（UTC）にする。
// document の rkey はこの値から導出するため、マニフェストと link タグで必ずこの関数を使う
export const toPublishedAt = (createdAt: string): string => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(createdAt)
    ? new Date(`${createdAt}T00:00:00+09:00`)
    : new Date(createdAt);
  return date.toISOString();
};

const TID_ALPHABET = '234567abcdefghijklmnopqrstuvwxyz';

// タイムスタンプから決定的に TID を作る
// TID = (マイクロ秒 UNIX 時刻 << 10) | clockId を base32-sortable で 13 文字にしたもの。clockId は 0 固定
export const tidFromTimestamp = (isoOrMs: string | number): string => {
  const ms = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
  if (!Number.isFinite(ms)) throw new TypeError(`Invalid timestamp: ${isoOrMs}`);

  // Nitro のビルドターゲット（es2019）では BigInt リテラルが警告になるため BigInt() で作る
  const value = (BigInt(ms) * BigInt(1000)) << BigInt(10);
  let tid = '';
  for (let shift = 60; shift >= 0; shift -= 5) {
    tid += TID_ALPHABET[Number((value >> BigInt(shift)) & BigInt(31))];
  }
  return tid;
};

// document の rkey は publishedAt（toPublishedAt の結果）から導出する
export const documentRkey = (publishedAt: string): string => tidFromTimestamp(publishedAt);
