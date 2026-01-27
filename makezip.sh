#!/usr/bin/env bash
# required `zip` to run

OUTPUT="scrolled-src.zip"

zip -r "$OUTPUT" . \
  -x ".git/*" \
  -x ".gitignore" \
  -x "dist/*" \
  -x "node_modules/*" \
  -x "LICENSE" \
  -x "makezip.sh" \
  -x "bun.lock" \
  -x "*.zip"
