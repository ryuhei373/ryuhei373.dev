// standard.site のマニフェスト（/standard-site/documents.json）を読み、
// publication / document レコードを PDS に upsert（putRecord）する
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

interface Manifest {
  publication: ManifestEntry;
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

    if (current && isDeepStrictEqual(current, target.record)) {
      summary.skip++;
      console.log(`skip   ${label}`);
      continue;
    }

    const action = current ? 'update' : 'create';
    summary[action]++;
    const detail = current ? ` (${changedFields(current, target.record).join(', ')})` : '';
    console.log(`${action.padEnd(6)} ${label}${detail}`);

    if (!dryRun) {
      await agent.com.atproto.repo.putRecord({
        repo: sessionDid,
        collection: target.collection,
        rkey: target.rkey,
        record: target.record,
      });
    }
  }

  console.log(`\n${dryRun ? '[dry-run] ' : ''}create: ${summary.create}, update: ${summary.update}, skip: ${summary.skip}`);
};

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(`error: ${error.message}`);
  }
  else {
    console.error(error);
  }
  process.exitCode = 1;
});
