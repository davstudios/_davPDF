#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$ROOT"
TARGET_DIR="$ROOT/src-tauri/resources/pdfium"
mkdir -p "$TARGET_DIR"
OS="$(uname -s)"
ARCH="$(uname -m)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
if [[ "$OS" == "Darwin" ]]; then
  TARGET="$TARGET_DIR/libpdfium.dylib"
  [[ -f "$TARGET" ]] && { echo "PDFium già disponibile."; exit 0; }
  URL="https://github.com/bblanchon/pdfium-binaries/releases/download/chromium%2F7881/pdfium-mac-univ.tgz"
  NAME="libpdfium.dylib"
elif [[ "$OS" == "Linux" && "$ARCH" == "x86_64" ]]; then
  TARGET="$TARGET_DIR/libpdfium.so"
  [[ -f "$TARGET" ]] && { echo "PDFium già disponibile."; exit 0; }
  URL="https://github.com/bblanchon/pdfium-binaries/releases/download/chromium%2F7881/pdfium-linux-x64.tgz"
  NAME="libpdfium.so"
else
  echo "Piattaforma PDFium non supportata automaticamente: $OS $ARCH"
  exit 1
fi
curl -L --fail --retry 3 "$URL" -o "$WORK/pdfium.tgz"
tar -xzf "$WORK/pdfium.tgz" -C "$WORK"
SOURCE="$(find "$WORK" -type f -name "$NAME" -print -quit)"
if [[ -z "$SOURCE" ]]; then
  echo "$NAME non trovato nell'archivio PDFium scaricato." >&2
  exit 1
fi
cp "$SOURCE" "$TARGET"
[[ -f "$TARGET" ]] || { echo "PDFium non copiato nel percorso atteso: $TARGET" >&2; exit 1; }
echo "PDFium pronto: $TARGET"


