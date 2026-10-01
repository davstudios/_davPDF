# GitHub release setup

1. Mantieni la repository pubblica.
2. Inserisci in GitHub Desktop il Summary nel formato `_davPDF v26.10.1`.
3. Inserisci nella Description del commit le modifiche complete in entrambe le lingue, iniziando con `🇮🇹` e `🇺🇸`.
4. Esegui il commit e `Push origin`.
5. Crea e pubblica il tag della release:

```bash
git tag -a v26.10.1 -m "Release _davPDF v26.10.1"
git push origin v26.10.1
```

Il workflow `.github/workflows/release.yml` verifica che tag, `package.json`, Tauri e Cargo abbiano la stessa versione. La Description bilingue del commit associato al tag viene usata automaticamente come descrizione della GitHub Release.

La release viene pubblicata come stabile (`prerelease: false`) con gli asset Windows, macOS e Linux generati dai runner GitHub Actions.
