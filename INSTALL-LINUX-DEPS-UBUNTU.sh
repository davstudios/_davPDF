#!/usr/bin/env bash
set -euo pipefail
sudo apt-get update
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
