$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($Root)) {
  throw "Impossibile determinare la cartella del progetto _davPDF."
}
$TargetDir = Join-Path $Root "src-tauri\resources\pdfium"
$Target = Join-Path $TargetDir "pdfium.dll"
if (Test-Path -LiteralPath $Target) {
  Write-Host "PDFium gia disponibile."
  exit 0
}
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
$Work = Join-Path $env:TEMP ("davpdf-pdfium-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Force -Path $Work | Out-Null
try {
  $Archive = Join-Path $Work "pdfium.tgz"
  $Url = "https://github.com/bblanchon/pdfium-binaries/releases/download/chromium%2F7881/pdfium-win-x64.tgz"
  Write-Host "Download PDFium per Windows x64..."
  Invoke-WebRequest -Uri $Url -OutFile $Archive
  $Tar = Get-Command tar.exe -ErrorAction Stop
  & $Tar.Source -xzf $Archive -C $Work
  if ($LASTEXITCODE -ne 0) {
    throw "Estrazione dell'archivio PDFium non riuscita."
  }
  $Extracted = Get-ChildItem -LiteralPath $Work -Filter "pdfium.dll" -File -Recurse | Select-Object -First 1
  if (-not $Extracted) {
    throw "pdfium.dll non trovato nell'archivio scaricato."
  }
  Copy-Item -LiteralPath $Extracted.FullName -Destination $Target -Force
  if (-not (Test-Path -LiteralPath $Target)) {
    throw "PDFium non e stato copiato nel percorso atteso: $Target"
  }
  Write-Host "PDFium pronto: $Target"
}
finally {
  if (Test-Path -LiteralPath $Work) {
    Remove-Item -LiteralPath $Work -Recurse -Force
  }
}

