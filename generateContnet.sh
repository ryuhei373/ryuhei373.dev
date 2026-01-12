#!/bin/bash
TODAY=`date "+%Y-%m-%d"`

echo "---
title: $TODAY
createdAt: $TODAY
updatedAt: $TODAY
---

<!--more-->
" > ./content/blog/$TODAY.md
