#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$ROOT"
command -v node >/dev/null || { echo "[ERRORE] Node.js non trovato."; exit 1; }
command -v cargo >/dev/null || { echo "[ERRORE] Rust/Cargo non trovato. Installa Rust con rustup."; exit 1; }
bash "$ROOT/PREPARE-PDFIUM-UNIX.sh"
npm install --no-audit --no-fund
npm run bundle
echo
echo "Build completata. Controlla: src-tauri/target/release/bundle/"


