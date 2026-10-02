# Multipiattaforma

_davPDF è configurato per:

- Windows 10/11 x64 con installer NSIS;
- macOS Universal per Intel e Apple Silicon;
- Linux x64 con AppImage e DEB.

La stessa codebase Tauri viene compilata su runner nativi tramite GitHub Actions.

Il rendering PDF usa PDFium 7881. Gli script di preparazione scaricano automaticamente `pdfium.dll`, `libpdfium.dylib` Universal o `libpdfium.so` in base alla piattaforma e Tauri include il runtime nel pacchetto finale. Il workflow verifica la presenza del runtime corretto subito dopo la preparazione, senza richiedere che i binari generati siano versionati nel repository.


## Release v26.10.3

La release adotta i metadata ufficiali `_davstudios`, la licenza MIT e il versioning `YY.M.REVISIONE`. Le build GitHub continuano a essere generate su runner nativi per Windows, macOS e Linux. Il workflow Linux disabilita eventuali sorgenti Microsoft non raggiungibili prima di `apt-get update`.

Le release Windows e macOS non sono ancora firmate con certificati trusted; le istruzioni per SmartScreen e Gatekeeper sono incluse nel README.

