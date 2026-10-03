# Changelog

## 26.10.4

- Eseguita una nuova repository normalization completa per riallineare tutti i file tracciabili e le cartelle del progetto al commit della release corrente.
- Aggiornata la versione a `26.10.4` in package.json, package-lock.json, Cargo.toml, Cargo.lock, configurazione Tauri, documentazione e test.
- Mantenuta la correzione multipiattaforma del runtime PDFium e il parser Cargo.lock compatibile LF/CRLF.
- Rimosso dal pacchetto sorgente il `pdfium.dll` generato: il runtime resta escluso da Git e viene preparato automaticamente dagli script/workflow per la piattaforma corrente.
- Ricodificati in modo lossless gli asset icona tracciati per registrarli nella release corrente senza modificarne l'aspetto.
- Nessuna modifica funzionale al motore PDF, al rendering PDFium, all'interfaccia o agli strumenti PDF.

## 26.10.3

- Corretto il contratto di test del runtime PDFium: i test non richiedono più una DLL Windows generata prima della fase di preparazione multipiattaforma.
- Il workflow verifica ora esplicitamente, dopo la preparazione PDFium, la presenza del runtime corretto per ciascun runner: `pdfium.dll` su Windows, `libpdfium.dylib` su macOS e `libpdfium.so` su Linux.
- Rafforzata la verifica di sincronizzazione della release includendo package-lock.json e Cargo.lock con parser compatibile LF/CRLF.
- Sincronizzata la versione `26.10.3` in package.json, package-lock.json, Cargo.toml, Cargo.lock, configurazione Tauri, documentazione e test.
- Preservati integralmente motore PDF, rendering PDFium, merge, split, compressione, gestione pagine, protezione, conversione e interfaccia.

## 26.10.2

- Corretta e resa esplicita la gestione dei percorsi del repository nel workflow GitHub Actions e negli script di preparazione PDFium.
- Gli script PDFium risolvono ora la root del progetto in modo indipendente dalla cartella di avvio e individuano la libreria estratta senza dipendere da una struttura fissa dell'archivio.
- Aggiunta una verifica preventiva dei percorsi richiesti prima della build e impostato esplicitamente `projectPath: .` per Tauri Action.
- Sincronizzata la versione `26.10.2` in package.json, package-lock.json, Cargo.toml, Cargo.lock, configurazione Tauri, documentazione e test.
- Esteso il controllo di sincronizzazione anche a package-lock.json e Cargo.lock.
- Reso il parser di Cargo.lock compatibile con checkout Windows CRLF e aggiunto un test di regressione dedicato.
- Eseguita la repository normalization dei file testuali con regole EOL esplicite, mantenendo invariati i contenuti funzionali.
- Preservati integralmente motore PDF, rendering PDFium, merge, split, compressione, gestione pagine, protezione, conversione e interfaccia.

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

