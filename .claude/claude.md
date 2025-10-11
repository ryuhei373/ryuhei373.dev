# コーディング規約

このドキュメントは、このリポジトリでコードを扱う際の Claude Code (claude.ai/code) へのガイダンスを定義します。

### コミュニケーションスタイル

- 「完璧です！」や「全くもって同意です」のような過度な賛美表現は使用しない
- 簡潔で直接的な回答を心がける
- 必要以上に丁寧語や敬語を重ねない
- 「完全に原因が特定」「驚くべき結果！」などの過度に断定的な表現を使用しない
  - 対応の結果、要求が満たされたかは私（claude-code と対話している）が判断するため
  - 表現の修正の例
    - 「完全に原因が特定できました」→「原因が分かりました」
    - 「驚くべき結果！」→「結果として」
    - 「重要な発見！」→「確認できました」

## プロジェクト概要

- **フレームワーク**: Nuxt 4 + Vue 3
- **UI ライブラリ**: Nuxt UI v4
- **コンテンツ管理**: Nuxt Content v3
- **デプロイ先**: Cloudflare Workers (Wrangler)
- **パッケージマネージャー**: pnpm + [ni](https://github.com/antfu-collective/ni)
- **Linter**: ESLint (@nuxt/eslint)
- **言語**: TypeScript

## コードスタイル

### 基本原則

- セミコロンは必須
- インデントはスペース2つ
- シングルクォートではなくダブルクォートを使用しない（デフォルトに従う）
- ESLint の設定に従う
- 新たに機能開発を行う際は、必ずmainブランチを最新化し、そこから新しいブランチを作成する

### TypeScript

- 型定義を明示的に記述する
- `any` の使用は極力避ける
- 可能な限り型推論を活用する

```typescript
// Good
const getOgp = (property: string): string => {
  return $(`meta[property="${property}"]`).attr('content') || '';
};

// Bad
const getOgp = (property: any) => {
  return $(`meta[property="${property}"]`).attr('content') || '';
};
```

### Vue コンポーネント

#### ファイル構成

- Composition API を使用
- `<script setup>` 構文を優先
- SFC の順序: `<script>` → `<template>` → `<style>`

```vue
<script setup lang="ts">
// imports
// composables
// reactive state
// computed
// methods
</script>

<template>
  <div>
    <!-- content -->
  </div>
</template>

<style scoped>
/* styles */
</style>
```

#### テンプレート

- ケバブケースで属性を記述
- Nuxt UI コンポーネントのプレフィックスは `U`

```vue
<!-- Good -->
<ULink
  to="/"
  class="flex items-center gap-3"
>
  <UAvatar src="https://github.com/ryuhei373.png" />
  <span class="text-xl font-bold">ryuhei373.dev</span>
</ULink>

<!-- Bad -->
<ULink to="/" class="flex items-center gap-3">
  <UAvatar src="https://github.com/ryuhei373.png" />
  <span class="text-xl font-bold">ryuhei373.dev</span>
</ULink>
```

### スタイリング

- Tailwind CSS を使用
- `app.config.ts` で Nuxt UI のスタイルカスタマイズを行う
- scoped スタイルは必要に応じて使用
- グローバルスタイルは `assets/css/main.css` に記述
- カラースキームは [flexoki](https://stephango.com/flexoki)を使用

### ファイル・ディレクトリ構造

```
app/
  ├── components/        # コンポーネント
  │   └── content/       # Nuxt Content 用コンポーネント
  ├── pages/            # ページ
  ├── app.vue           # ルートコンポーネント
  └── app.config.ts     # アプリケーション設定
server/
  ├── api/              # API エンドポイント
  └── routes/           # サーバールート
content/                # Markdown コンテンツ
assets/
  └── css/              # グローバル CSS
```

### 設定ファイル

#### nuxt.config.ts

- モジュールは配列で管理
- 設定は機能ごとにグループ化
- コメントは必要に応じて記述

#### app.config.ts

- UI コンポーネントのカスタマイズに使用
- Nuxt UI の `slots` を活用してスタイルを上書き

### コミットメッセージ

- Conventional Commits に従う
- プレフィックス: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` など
- 日本語または英語（混在可）

```
feat: OGP取得APIを追加
fix: trailing slash問題を修正
docs: READMEを更新
refactor: コンポーネントを整理
chore: 依存関係を更新
```

## 開発ワークフロー

### パッケージマネージャーコマンド

このプロジェクトでは [ni](https://github.com/antfu-collective/ni) を使用します:

- `ni` - 依存関係のインストール（`pnpm install` の代わり）
- `nr <script>` - スクリプト実行（`pnpm run <script>` の代わり）
- `nlx <package>` - パッケージ実行（`pnpm dlx <package>` の代わり）
- `nu <package>` - パッケージ更新（`pnpm update <package>` の代わり）

### 開発サーバー

```bash
nr dev  # ポート 3733 で起動
```

### ビルド・デプロイ

```bash
nr generate   # 静的サイト生成
nr preview    # プレビュー（Wrangler）
nr deploy     # デプロイ
```

### Lint

```bash
nr lint       # Lint チェック
nr lint:fix   # 自動修正
```

## 注意事項

### Nuxt Content

- Markdown ファイルは `content/` ディレクトリに配置
- カスタムコンポーネントは `app/components/content/` に配置

### パフォーマンス

- 画像は Nuxt Image を使用して最適化
- アイコンは `@iconify-json` を使用

## リファレンス

- [Nuxt 公式ドキュメント](https://nuxt.com/)
- [Nuxt UI 公式ドキュメント](https://ui.nuxt.com/)
- [Nuxt Content 公式ドキュメント](https://content.nuxt.com/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
