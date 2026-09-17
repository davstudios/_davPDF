# GitHub setup

1. Crea una repository chiamata `_davPDF`.
2. Copia il contenuto del progetto nella root della repository.
3. Esegui `npm test` e prova l'app con lo script `RUN-*` della tua piattaforma; lo script prepara automaticamente PDFium.
4. Fai commit e push.
5. Per creare la release stabile automatica crea il tag `v1.0.2` e pubblicalo:

```bash
git tag -a v1.0.2 -m "Release _davPDF v1.0.2"
git push origin v1.0.2
```

La GitHub Action eseguirà i test, compilerà Windows, macOS e Linux e allegherà i pacchetti alla GitHub Release.
