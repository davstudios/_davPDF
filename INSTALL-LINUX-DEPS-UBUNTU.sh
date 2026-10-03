#!/usr/bin/env bash
set -euo pipefail
sudo sed -i '\|packages.microsoft.com|d' /etc/apt/sources.list 2>/dev/null || true
for source_file in /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources; do
  [[ -f "$source_file" ]] || continue
  if sudo grep -q 'packages.microsoft.com' "$source_file"; then
    sudo mv "$source_file" "${source_file}.disabled-davpdf"
  fi
done
sudo apt-get -o Acquire::Retries=3 update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  xdg-utils \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev

echo "Dipendenze Linux per _davPDF installate. Installa anche Node.js e Rust se non sono già presenti."


