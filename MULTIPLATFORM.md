# Multipiattaforma

_davPDF è configurato per:

- Windows 10/11 x64 con installer NSIS;
- macOS Universal per Intel e Apple Silicon;
- Linux x64 con AppImage e DEB.

La stessa codebase Tauri viene compilata su runner nativi tramite GitHub Actions.

Il rendering PDF usa PDFium 7881. Gli script di preparazione scaricano automaticamente `pdfium.dll`, `libpdfium.dylib` Universal o `libpdfium.so` in base alla piattaforma e Tauri include il runtime nel pacchetto finale.
