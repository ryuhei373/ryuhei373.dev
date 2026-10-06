// standard.site のマニフェスト（/standard-site/documents.json）を読み、
// publication / document レコードを PDS に upsert（putRecord）する。
// publication の icon は manifest の iconUrl から画像を取得し、必要なときだけ uploadBlob する
//
// 使い方:
//   nr standard-site:sync [--dry-run] [--only <rkey | スラッグ | publication>] [--source <URL またはファイルパス>]
//
// 環境変数:
//   STANDARD_SITE_IDENTIFIER   handle または DID
//   STANDARD_SITE_APP_PASSWORD App Password
//   STANDARD_SITE_PDS          ログイン先（既定 https://bsky.social）
//
// Node の型ストリッピングで直接実行するため、enum / namespace / パラメータプロパティは使わない
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual, parseArgs } from 'node:util';
import { AtpAgent, ComAtprotoRepoGetRecord, XRPCError } from '@atproto/api';

const PUBLICATION_COLLECTION = 'site.standard.publication';
const DOCUMENT_COLLECTION = 'site.standard.document';
const DEFAULT_SOURCE = '.output/public/standard-site/documents.json';
const DEFAULT_PDS = 'https://bsky.social';

interface ManifestEntry {
  rkey: string;
  uri: string | null;
  record: Record<string, unknown>;
}

interface PublicationEntry extends ManifestEntry {
  // icon に使う画像の URL。blob 参照はビルド時に作れないため record の外にある
  iconUrl?: string | null;
}

interface Manifest {
  publication: PublicationEntry;
  documents: ManifestEntry[];
}

interface Target extends ManifestEntry {
  collection: string;
}

// Lexicon の文字数制約（maxGraphemes）
const GRAPHEME_LIMITS: { field: string; max: number }[] = [
  { field: 'title', max: 500 },
  { field: 'description', max: 3000 },
];
const TAG_MAX_GRAPHEMES = 128;
// publication の icon の上限（Lexicon の maxSize）
const MAX_ICON_BYTES = 1_000_000;

const segmenter = new Intl.Segmenter();
const countGraphemes = (text: string): number => [...segmenter.segment(text)].length;

class UsageError extends Error {}

const loadManifest = async (source: string): Promise<Manifest> => {
  const text = /^https?:\/\//.test(source)
    ? await fetch(source).then((res) => {
        if (!res.ok) throw new UsageError(`マニフェストを取得できませんでした: ${source} (${res.status})`);
        return res.text();
      })
    : await readFile(source, 'utf-8').catch(() => {
        throw new UsageError(`マニフェストを読めませんでした: ${source}（先に nr generate を実行するか --source を指定してください）`);
      });
  return JSON.parse(text) as Manifest;
};

const didFromAtUri = (uri: string): string | null => uri.match(/^at:\/\/([^/]+)\//)?.[1] ?? null;

export interface IconImage {
  data: Uint8Array;
  mimeType: string;
}

const startsWith = (data: Uint8Array, bytes: number[], offset = 0): boolean =>
  data.length >= offset + bytes.length && bytes.every((byte, i) => data[offset + i] === byte);

const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const ICO_SIGNATURE = [0x00, 0x00, 0x01, 0x00];
const ascii = (text: string): number[] => [...text].map(char => char.charCodeAt(0));

// Content-Type は配信側の設定で揺れる（image/x-icon、image/vnd.microsoft.icon など）ため、先頭バイトで判定する
const detectImageType = (data: Uint8Array): 'png' | 'jpeg' | 'webp' | 'ico' | null => {
  if (startsWith(data, PNG_SIGNATURE)) return 'png';
  if (startsWith(data, [0xFF, 0xD8, 0xFF])) return 'jpeg';
  if (startsWith(data, ascii('RIFF')) && startsWith(data, ascii('WEBP'), 8)) return 'webp';
  if (startsWith(data, ICO_SIGNATURE)) return 'ico';
  return null;
};

// ICO に含まれる PNG エントリのうち、最大サイズのものを取り出す。PNG エントリが無ければ null。
// ICO のディレクトリエントリの幅・高さは 1 バイト（0 は 256）で 256 を超える画像を表せないため、PNG の IHDR から読む
export const extractPngFromIco = (data: Uint8Array): { png: Uint8Array; width: number; height: number } | null => {
  if (!startsWith(data, ICO_SIGNATURE) || data.length < 6) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count = view.getUint16(4, true);

  let best: { png: Uint8Array; width: number; height: number } | null = null;
  for (let i = 0; i < count; i++) {
    const entry = 6 + i * 16;
    if (entry + 16 > data.length) break;
    const size = view.getUint32(entry + 8, true);
    const offset = view.getUint32(entry + 12, true);
    if (offset + size > data.length) continue;

    const image = data.subarray(offset, offset + size);
    // BMP エントリ（PNG シグネチャで始まらないもの）は対象外
    if (!startsWith(image, PNG_SIGNATURE) || image.length < 24) continue;
    const ihdr = new DataView(image.buffer, image.byteOffset, image.byteLength);
    const width = ihdr.getUint32(16);
    const height = ihdr.getUint32(20);
    if (!best || width * height > best.width * best.height) {
      best = { png: image, width, height };
    }
  }
  return best;
};

// publication の icon に使う画像を取得する。取得・変換できない場合は警告して null を返す（icon なしで続行する）
const loadIcon = async (url: string): Promise<IconImage | null> => {
  const warn = (message: string): null => {
    console.warn(`[warn] icon: ${message}。icon を付けずに続行します`);
    return null;
  };

  let data: Uint8Array;
  try {
    const res = await fetch(url);
    if (!res.ok) return warn(`${url} を取得できませんでした (${res.status})`);
    data = new Uint8Array(await res.arrayBuffer());
  }
  catch (error) {
    return warn(`${url} を取得できませんでした (${error instanceof Error ? error.message : String(error)})`);
  }

  let icon: IconImage;
  switch (detectImageType(data)) {
    case 'png':
      icon = { data, mimeType: 'image/png' };
      break;
    case 'jpeg':
      icon = { data, mimeType: 'image/jpeg' };
      break;
    case 'webp':
      icon = { data, mimeType: 'image/webp' };
      break;
    case 'ico': {
      const extracted = extractPngFromIco(data);
      if (!extracted) return warn(`${url} に PNG のエントリがありません（BMP のみの ICO には対応していません）`);
      console.log(`icon: ${url} から ${extracted.width}x${extracted.height} の PNG を取り出しました`);
      icon = { data: extracted.png, mimeType: 'image/png' };
      break;
    }
    default:
      return warn(`${url} は対応していない形式です（PNG / JPEG / WebP / PNG を含む ICO に対応）`);
  }

  if (icon.data.length >= MAX_ICON_BYTES) {
    return warn(`画像サイズ ${icon.data.length} bytes が上限（${MAX_ICON_BYTES} bytes 未満）を超えています`);
  }
  return icon;
};

// 既存レコードの icon（blob 参照）が今回の画像と同じとみなせるか。
// blob の CID を計算して突き合わせる代わりに、mimeType と size の一致で判定する
const isSameIcon = (current: unknown, icon: IconImage): boolean => {
  if (typeof current !== 'object' || current === null) return false;
  const { mimeType, size } = current as { mimeType?: unknown; size?: unknown };
  return mimeType === icon.mimeType && size === icon.data.length;
};

const warnLimits = (target: Target): void => {
  for (const { field, max } of GRAPHEME_LIMITS) {
    const value = target.record[field];
    if (typeof value === 'string' && countGraphemes(value) > max) {
      console.warn(`[warn] ${target.collection}/${target.rkey}: ${field} が ${max} graphemes を超えています（${countGraphemes(value)}）`);
    }
  }
  const tags = target.record.tags;
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (typeof tag === 'string' && countGraphemes(tag) > TAG_MAX_GRAPHEMES) {
        console.warn(`[warn] ${target.collection}/${target.rkey}: tag "${tag}" が ${TAG_MAX_GRAPHEMES} graphemes を超えています`);
      }
    }
  }
};

const fetchExisting = async (agent: AtpAgent, repo: string, target: Target): Promise<Record<string, unknown> | null> => {
  try {
    const res = await agent.com.atproto.repo.getRecord({ repo, collection: target.collection, rkey: target.rkey });
    return res.data.value as Record<string, unknown>;
  }
  catch (error) {
    if (error instanceof ComAtprotoRepoGetRecord.RecordNotFoundError) return null;
    // 実装によっては InvalidRequest "Could not locate record" を返す
    if (error instanceof XRPCError && /could not locate record/i.test(error.message)) return null;
    throw error;
  }
};

// --only の指定に一致するか。rkey（TID）のほか、記事のスラッグ（path の末尾）・path、publication を受け付ける
const matchesOnly = (target: Target, only: string): boolean => {
  if (target.rkey === only) return true;
  if (target.collection === PUBLICATION_COLLECTION) return only === 'publication';

  const path = typeof target.record.path === 'string' ? target.record.path : '';
  const normalized = only.replace(/\/+$/, '');
  return path === normalized || path.split('/').pop() === normalized;
};

const changedFields = (current: Record<string, unknown>, next: Record<string, unknown>): string[] => {
  const keys = new Set([...Object.keys(current), ...Object.keys(next)]);
  return [...keys].filter(key => !isDeepStrictEqual(current[key], next[key]));
};

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    options: {
      'source': { type: 'string', default: DEFAULT_SOURCE },
      'dry-run': { type: 'boolean', default: false },
      'only': { type: 'string' },
    },
  });
  const dryRun = values['dry-run'];

  const manifest = await loadManifest(values.source);
  if (!manifest.publication?.uri) {
    throw new UsageError('マニフェストに publication の AT-URI がありません。nuxt.config の runtimeConfig.public.standardSite.did と publicationRkey を設定して generate し直してください');
  }
  const manifestDid = didFromAtUri(manifest.publication.uri);

  const targets: Target[] = [
    { ...manifest.publication, collection: PUBLICATION_COLLECTION },
    ...manifest.documents.map(doc => ({ ...doc, collection: DOCUMENT_COLLECTION })),
  ].filter(target => !values.only || matchesOnly(target, values.only));
  if (targets.length === 0) {
    throw new UsageError(`--only ${values.only} に一致するレコードがマニフェストにありません`);
  }
  targets.forEach(warnLimits);

  // 画像の取得・変換は認証より前に行い、認証情報なしでも確認できるようにする
  const iconUrl = manifest.publication.iconUrl;
  const icon = iconUrl && targets.some(target => target.collection === PUBLICATION_COLLECTION)
    ? await loadIcon(iconUrl)
    : null;

  const identifier = process.env.STANDARD_SITE_IDENTIFIER;
  const password = process.env.STANDARD_SITE_APP_PASSWORD;
  if (!identifier || !password) {
    throw new UsageError('環境変数 STANDARD_SITE_IDENTIFIER と STANDARD_SITE_APP_PASSWORD を設定してください（.env に書いて nr standard-site:sync で実行できます）');
  }

  const agent = new AtpAgent({ service: process.env.STANDARD_SITE_PDS || DEFAULT_PDS });
  await agent.login({ identifier, password });
  const sessionDid = agent.session?.did;
  if (!sessionDid || sessionDid !== manifestDid) {
    throw new UsageError(`ログインしたアカウントの DID（${sessionDid}）とマニフェストの DID（${manifestDid}）が一致しません`);
  }

  const summary = { create: 0, update: 0, skip: 0 };
  for (const target of targets) {
    const label = `${target.collection}/${target.rkey}`;
    const current = await fetchExisting(agent, sessionDid, target);
    const record = { ...target.record };

    if (target.collection === PUBLICATION_COLLECTION && iconUrl && !icon && current?.icon) {
      // 画像を取得できなかったときは既存の icon を外さずに残す
      record.icon = current.icon;
      console.log('icon: keep');
    }
    else if (target.collection === PUBLICATION_COLLECTION && icon) {
      if (current && isSameIcon(current.icon, icon)) {
        // 同じ画像とみなし、既存の blob 参照を使い回す（画像が変わらなければ record 全体の比較で skip になる）
        record.icon = current.icon;
        console.log('icon: reuse');
      }
      else {
        console.log(`icon: upload (${icon.data.length} bytes, ${icon.mimeType})`);
        record.icon = dryRun
          // dry-run では uploadBlob しないため、差分表示用の仮の blob 参照を置く
          ? { $type: 'blob', ref: { $link: '(dry-run)' }, mimeType: icon.mimeType, size: icon.data.length }
          : (await agent.com.atproto.repo.uploadBlob(icon.data, { encoding: icon.mimeType })).data.blob;
      }
    }

    if (current && isDeepStrictEqual(current, record)) {
      summary.skip++;
      console.log(`skip   ${label}`);
      continue;
    }

    const action = current ? 'update' : 'create';
    summary[action]++;
    const detail = current ? ` (${changedFields(current, record).join(', ')})` : '';
    console.log(`${action.padEnd(6)} ${label}${detail}`);

    if (!dryRun) {
      await agent.com.atproto.repo.putRecord({
        repo: sessionDid,
        collection: target.collection,
        rkey: target.rkey,
        record,
      });
    }
  }

  console.log(`\n${dryRun ? '[dry-run] ' : ''}create: ${summary.create}, update: ${summary.update}, skip: ${summary.skip}`);
};

// 解析関数を単体で呼べるよう、import されたときは実行しない
if (import.meta.main) {
  main().catch((error: unknown) => {
    if (error instanceof UsageError) {
      console.error(`error: ${error.message}`);
    }
    else {
      console.error(error);
    }
    process.exitCode = 1;
  });
}
