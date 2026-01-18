#!/bin/bash
set -e

TODAY=$(date "+%Y-%m-%d")
BRANCH_NAME="blog/$TODAY"
FILE_PATH="./content/blog/$TODAY.md"

# mainブランチを最新化
git checkout main
git pull origin main

# ブログ記事用ブランチを作成
git checkout -b "$BRANCH_NAME"

# markdownファイルを生成
echo "---
title: $TODAY
createdAt: $TODAY
updatedAt: $TODAY
---

<!--more-->
" > "$FILE_PATH"

echo "Created: $FILE_PATH"
echo "Branch: $BRANCH_NAME"
