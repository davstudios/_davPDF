# Changelog

## 26.10.1

- Adottato il nuovo standard di versioning `_davstudios` `YY.M.REVISIONE`.
- Sincronizzata la versione `26.10.1` nei metadata npm, Tauri e Cargo.
- Standardizzati publisher, homepage, copyright, licenza MIT, descrizioni del pacchetto e metadata Linux.
- Mantenuto invariato l'identifier storico `studio.dav.pdf`.
- Aggiunte al README le istruzioni per le release non firmate su Windows, macOS e Linux.
- Il workflow GitHub usa ora automaticamente la Description bilingue del commit associato al tag come descrizione della GitHub Release.
- Aggiunta la verifica obbligatoria delle sezioni `🇮🇹` e `🇺🇸` prima della pubblicazione.
- Rafforzato il workflow Linux contro repository Microsoft non raggiungibili.
- Nessuna modifica al motore PDF, al rendering PDFium, all'interfaccia o alla logica funzionale dell'app.

## 1.0.2

- La versione mostrata nell'interfaccia viene ora letta automaticamente dal runtime Tauri.
- Rimossi i numeri di versione hardcoded dalla UI.
- Aggiunti test automatici per mantenere sincronizzati package.json, tauri.conf.json e Cargo.toml.
- Aggiunto un controllo che impedisce di reintrodurre versioni hardcoded in src/main.js.

## 1.0.0

First stable release of `_davPDF`.

- Merge PDF.
- Split PDF by page, groups, or ranges.
- Page Manager with real PDFium thumbnails, reorder, rotation, and deletion.
- Structural PDF compression.
- Metadata inspection, editing, and removal.
- PDF password protection.
- Unlock with the correct password only.
- PDF to PNG, JPG, and WebP at configurable DPI.
- Images to PDF with A4, A3, Letter, image-size, margins, Fit, and Fill.
- Bundled PDFium rendering runtime prepared automatically per platform.
- Italian and English interface.
- Shared `_davstudios` design and motion system.
- Buy Me A Coffee and davstudios.it buttons.
- Windows, macOS, and Linux release workflow.
- Source comment audit test.
