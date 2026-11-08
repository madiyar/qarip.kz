#!/bin/bash
# Qarip local admin (macOS): double-click to start. See scripts/local-admin.mjs.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null; then
  echo "Node.js не найден. Установите его с https://nodejs.org и запустите заново."
  read -r -p "Нажмите Enter…"
  exit 1
fi
node scripts/local-admin.mjs
