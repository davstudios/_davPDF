#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
TARGET_DIR="src-tauri/resources/pdfium"
mkdir -p "$TARGET_DIR"
OS="$(uname -s)"
ARCH="$(uname -m)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
if [[ "$OS" == "Darwin" ]]; then
  TARGET="$TARGET_DIR/libpdfium.dylib"
  [[ -f "$TARGET" ]] && { echo "PDFium già disponibile."; exit 0; }
  URL="https://github.com/bblanchon/pdfium-binaries/releases/download/chromium%2F7881/pdfium-mac-univ.tgz"
  curl -L --fail "$URL" -o "$WORK/pdfium.tgz"
  tar -xzf "$WORK/pdfium.tgz" -C "$WORK"
  cp "$WORK/lib/libpdfium.dylib" "$TARGET"
elif [[ "$OS" == "Linux" && "$ARCH" == "x86_64" ]]; then
  TARGET="$TARGET_DIR/libpdfium.so"
  [[ -f "$TARGET" ]] && { echo "PDFium già disponibile."; exit 0; }
  URL="https://github.com/bblanchon/pdfium-binaries/releases/download/chromium%2F7881/pdfium-linux-x64.tgz"
  curl -L --fail "$URL" -o "$WORK/pdfium.tgz"
  tar -xzf "$WORK/pdfium.tgz" -C "$WORK"
  cp "$WORK/lib/libpdfium.so" "$TARGET"
else
  echo "Piattaforma PDFium non supportata automaticamente: $OS $ARCH"
  exit 1
fi
echo "PDFium pronto."
