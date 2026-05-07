---
paths:
  - "content/blog/**/*.md"
---

# ブログ記事ルール

## 日付の整合性

記事執筆中に日付を跨いだ場合、以下の 3 箇所を新しい日付に揃えること。

- frontmatter の `createdAt`
- ファイル名（`content/blog/YYYY-MM-DD.md`）
- ブランチ名（`blog/YYYY-MM-DD`）

理由：ファイル名は Nuxt Content の `path` 生成に使われ、ブランチ名・記事日付・ファイル名が一致している前提でワークフロー（`nr blog:init` など）が組まれているため。
