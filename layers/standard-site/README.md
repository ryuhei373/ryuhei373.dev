# standard-site layer

[standard.site](https://standard.site/) に対応するための Nuxt Layer。standard.site は AT Protocol 上で長文コンテンツを扱うための Lexicon 規格で、レコードを自分の PDS に置き、サイト側からもそのレコードを指し返すことで双方向に検証する。

Nuxt 4 は `layers/*` を自動で extends するため、`nuxt.config.ts` への追記は不要。

## 仕組み

HTML 側の対応（Nuxt 内）と PDS への送信（独立スクリプト）を分け、間に公開 JSON マニフェストを置く。

```
Nuxt (generate 時に prerender)
  ├─ /.well-known/site.standard.publication   … AT-URI を text/plain
  ├─ /blog/<slug>                             … <link rel="site.standard.document"> を注入
  └─ /standard-site/documents.json            … publication + documents のマニフェスト
                                                  ↓
scripts/sync.ts（@atproto/api、App Password）… マニフェストを読んで putRecord
```

- rkey は決定的に決める（詳細は「rkey の決め方」）。publication は設定値、document は記事の公開日時から導出した TID
- そのため AT-URI はビルド時に計算でき、ビルドにシークレットもネットワーク書き込みも入らない
- 全ページに `<link rel="site.standard.publication">` も出す（検証の代替ではなく discovery 用のヒント）

| ファイル | 役割 |
|---|---|
| `nuxt.config.ts` | 設定の既定値、prerender 対象の追加 |
| `shared/utils/standardSite.ts` | AT-URI・rkey の組み立て（app / server 共通） |
| `app/plugins/standard-site-head.ts` | 全ページへの `<link rel="site.standard.publication">` の注入 |
| `app/composables/useStandardSiteDocument.ts` | 記事ページへの `<link rel="site.standard.document">` の注入（ページ側で呼ぶ） |
| `server/routes/.well-known/site.standard.publication.ts` | publication の検証用エンドポイント |
| `server/routes/standard-site/documents.json.ts` | マニフェスト |
| `server/utils/standardSiteText.ts` | 記事本文（minimark）の平文化 |
| `public/_headers` | Workers の静的アセット配信で well-known に `Content-Type: text/plain` を付ける |
| `scripts/sync.ts` | マニフェストを読んで PDS に putRecord |

## 設定

`runtimeConfig.public.standardSite`:

| キー | 既定値 | 説明 |
|---|---|---|
| `did` | `''` | レコードを置くアカウントの DID（例: `did:plc:xxxx`） |
| `publicationRkey` | `''` | publication レコードの rkey（TID）。作り方は「rkey の決め方」 |
| `collections` | `['blog']` | マニフェストに含める Nuxt Content のコレクション名 |

`did` と `publicationRkey` のどちらかが空のときは link タグ・well-known を出さず、マニフェストの `uri` は `null` になる。それぞれ環境変数 `NUXT_PUBLIC_STANDARD_SITE_DID`、`NUXT_PUBLIC_STANDARD_SITE_PUBLICATION_RKEY` でも上書きできる。

サイト名・URL・説明はルートの `site` 設定（`@nuxtjs/seo`）から取る。

記事ページでは、ページ側で `useStandardSiteDocument(article)` を呼ぶ（rkey を `createdAt` から導出するため、記事データを持つページで呼ぶ必要がある）。

## rkey の決め方

`site.standard.publication` と `site.standard.document` の Lexicon は rkey を TID（`key: tid`）と定めており、PDS は `self` やスラッグのような値を受け付けない。状態ファイルを持たずに済むよう、タイムスタンプから TID を決定的に作る。

- TID は `(マイクロ秒 UNIX 時刻 << 10) | clockId` の 64bit 値を base32-sortable（`234567abcdefghijklmnopqrstuvwxyz`）で 13 文字にしたもの。clockId は 0 固定
- document の rkey は `publishedAt` から作る。`publishedAt` は frontmatter の `createdAt`（`YYYY-MM-DD`）を JST 0:00 として UTC にした値（例: `2024-01-01` → `2023-12-31T15:00:00.000Z` → `3khty4j2r2222`）
- publication の rkey は初回に一度だけ作り、ルートの `nuxt.config.ts` に設定する。以後は変えない

```sh
node -e "import('./layers/standard-site/shared/utils/standardSite.ts').then(m => console.log(m.tidFromTimestamp(Date.now())))"
```

注意:

- **記事の `createdAt` を変えると rkey が変わり、別のレコードになる。** 古いレコードは PDS に残るので、必要なら手動で削除する
- `createdAt` が同じ記事が 2 件以上あると rkey が重複するため、マニフェストの生成（`nr generate`）がエラーになる

## 初回手順

1. DID を調べる（例: `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=<handle>`）
2. ルートの `nuxt.config.ts` の `runtimeConfig.public.standardSite.did` に設定する
3. publication の rkey を作り（「rkey の決め方」）、`publicationRkey` に設定する
4. `nr generate` で生成し、`.output/public/standard-site/documents.json` の内容を確認する
5. デプロイする（`main` へのマージ）
6. `.env` に認証情報を書き、`nr standard-site:sync --dry-run` で create / update / skip を確認する
7. `nr standard-site:sync` で書き込む
8. https://site-validator.fly.dev で検証する

## 送信スクリプト

```sh
nr standard-site:sync [--dry-run] [--only <rkey | スラッグ | publication>] [--source <URL またはファイルパス>]
```

| オプション | 説明 |
|---|---|
| `--source` | マニフェストの場所。既定は `.output/public/standard-site/documents.json`。`https://ryuhei373.dev/standard-site/documents.json` のように URL も指定できる |
| `--dry-run` | 書き込まずに create / update / skip と、update の場合は差分のあるフィールド名を表示する |
| `--only <対象>` | 1 件だけを対象にする。rkey（例: `3khty4j2r2222`）、記事のスラッグ（例: `2024-01-01`）、`publication` を受け付ける |

既存レコードを `getRecord` で取得し、内容が同じなら skip、違えば `putRecord` で上書きする。ログインしたアカウントの DID とマニフェストの DID が一致しない場合は中断する。title / description / tags が Lexicon の文字数制約を超える場合は警告する（切り詰めはしない）。

### 環境変数

`.env`（gitignore 済み）に書くと `nr standard-site:sync` が読み込む。

| 変数 | 説明 |
|---|---|
| `STANDARD_SITE_IDENTIFIER` | handle または DID |
| `STANDARD_SITE_APP_PASSWORD` | App Password（Bluesky の設定 → App Passwords で発行） |
| `STANDARD_SITE_PDS` | ログイン先。既定は `https://bsky.social` |

## スコープ外

- サイトから消えた記事のレコード削除。必要になったら PDS 側で手動で `deleteRecord` する
- 記事の更新日時（`updatedAt`）、カバー画像、publication のアイコン・テーマ
