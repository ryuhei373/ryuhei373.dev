# AGENTS.md

ryuhei373.dev — 個人ブログ。Nuxt 4 で静的生成し、Cloudflare Workers で配信。

`main` ブランチへのマージで Cloudflare Workers に自動デプロイされる。**PR 作成・マージはユーザーの明示的な指示があるときのみ実行する。**

## Tech stack

- **Nuxt** `^4.4.2` / **Vue** `^3.5.32` / **TypeScript**
- **Nuxt UI** `^4.6.1`（Tailwind CSS、コンポーネントは `U` プレフィックス）
- **Nuxt Content** `^3.13.0`（`content/` 配下の Markdown）
- **Nuxt modules**: `@nuxt/image`, `@nuxt/eslint`, `@nuxtjs/seo`
- **Runtime**: Cloudflare Workers（`wrangler` `^4.83.0`）
- **Node** 24.12.0 / **pnpm** 11.0.3
- **ESLint**: `@nuxt/eslint`（`stylistic.semi=true`、セミコロン必須）
- **textlint**: 日本語の文章規約（`.textlintrc`）
- **lefthook**: pre-commit で staged な `*.{js,ts,vue,mjs}` に `eslint --fix`

## Commands

[ni](https://github.com/antfu-collective/ni) を優先。未インストール時は `pnpm` に置き換えて実行する。

| 用途 | ni | pnpm |
|---|---|---|
| 依存インストール | `ni` | `pnpm install` |
| スクリプト実行 | `nr <script>` | `pnpm run <script>` |
| 一時実行 | `nlx <pkg>` | `pnpm dlx <pkg>` |
| 依存更新 | `nu <pkg>` | `pnpm update <pkg>` |

主要スクリプト:

- `nr dev` — 開発サーバー（**port 3733 固定**）
- `nr lint` / `nr lint:fix`
- `nr textlint` / `nr textlint:fix`（`content/**/*.md` のみ）
- `nr generate` — 静的サイト生成
- `nr preview` — Wrangler ローカルプレビュー
- `nr deploy` — `nuxt generate && wrangler deploy`

開発サーバーを停止する場合: `pkill -f 'nuxt.mjs dev'` もしくは `pkill -f '@nuxt/cli'`（`pkill -f "nuxt dev"` は効かない）。

## 直感に反する設計判断

agents がコードから推測しにくい部分のみ。

- **flexoki カラースキーム**（[stephango.com/flexoki](https://stephango.com/flexoki)）— Tailwind の任意カラーを直接使わず、`app.config.ts` で Nuxt UI の `slots` 経由でテーマを上書き
- **末尾スラッシュ問題** — 過去に踏んでいる。URL 生成・リンク先では trailing slash の有無に注意
- **Nuxt Content カスタムコンポーネント** は `app/components/content/` 配下に配置
- **OG 画像** は `@takumi-rs/core` でランタイム生成（`ogImage.zeroRuntime: true`）
- **アイコン** は `@iconify-json/{ph,ri}`、**画像** は `@nuxt/image`

## Workflow

- 新機能は `main` を最新化してから新ブランチを切る
- `main` マージ＝Cloudflare Workers 自動デプロイ
- `gh pr create` / `gh pr merge` / `gh pr close` / `gh issue close` は **ユーザーの明示的な指示があるときのみ** 実行する（approve はマージ許可ではない）

## Commit conventions

- [Conventional Commits](https://www.conventionalcommits.org/)（`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`）
- 日本語／英語混在可
- 「**改善**」ではなく「**改修**」「**変更**」を使う

例:

```
feat: タグページのページネーションを追加
fix: archive リンクの末尾スラッシュを削除
chore: 依存関係を変更
```

## Content rules

`content/**/*.md` には textlint が適用される（`.textlintrc`）:

- 1 文 max 150 文字、1 文の読点 max 4 個
- 半角と全角の間にスペースを入れない

## References

- [Nuxt](https://nuxt.com/) / [Nuxt UI](https://ui.nuxt.com/) / [Nuxt Content](https://content.nuxt.com/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [flexoki](https://stephango.com/flexoki)
