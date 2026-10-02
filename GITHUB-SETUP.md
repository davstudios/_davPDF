# GitHub release setup

1. Mantieni la repository pubblica.
2. Inserisci in GitHub Desktop il Summary nel formato `_davPDF v26.10.3`.
3. Inserisci nella Description del commit le modifiche complete in entrambe le lingue, iniziando con `🇮🇹` e `🇺🇸`.
4. Esegui il commit e `Push origin`.
5. Crea e pubblica il tag della release:

```bash
git tag -a v26.10.3 -m "Release _davPDF v26.10.3"
git push origin v26.10.3
```

Il workflow `.github/workflows/release.yml` verifica che tag, `package.json`, `package-lock.json`, Tauri, `Cargo.toml` e `Cargo.lock` abbiano la stessa versione. Dopo la preparazione PDFium verifica inoltre il runtime specifico del runner prima dei test e della build. La Description bilingue del commit associato al tag viene usata automaticamente come descrizione della GitHub Release.

La release viene pubblicata come stabile (`prerelease: false`) con gli asset Windows, macOS e Linux generati dai runner GitHub Actions.

