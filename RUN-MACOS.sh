#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$ROOT"
command -v node >/dev/null || { echo "[ERRORE] Node.js non trovato."; exit 1; }
command -v cargo >/dev/null || { echo "[ERRORE] Rust/Cargo non trovato. Installa Rust con rustup."; exit 1; }
if ! xcode-select -p >/dev/null 2>&1; then
  echo "[ERRORE] Installa Xcode Command Line Tools con: xcode-select --install"
  exit 1
fi
bash "$ROOT/PREPARE-PDFIUM-UNIX.sh"
npm install --no-audit --no-fund
echo "Avvio _davPDF..."
npm run desktop

