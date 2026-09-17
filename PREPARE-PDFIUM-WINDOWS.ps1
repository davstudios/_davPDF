$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetDir = Join-Path $Root "src-tauri\resources\pdfium"
$Target = Join-Path $TargetDir "pdfium.dll"
if (Test-Path $Target) {
  Write-Host "PDFium gia disponibile."
  exit 0
}
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
$Work = Join-Path $env:TEMP ("davpdf-pdfium-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Force -Path $Work | Out-Null
$Archive = Join-Path $Work "pdfium.tgz"
$Url = "https://github.com/bblanchon/pdfium-binaries/releases/download/chromium%2F7881/pdfium-win-x64.tgz"
Write-Host "Download PDFium per Windows x64..."
Invoke-WebRequest -Uri $Url -OutFile $Archive
& tar.exe -xzf $Archive -C $Work
Copy-Item (Join-Path $Work "bin\pdfium.dll") $Target -Force
Remove-Item $Work -Recurse -Force
Write-Host "PDFium pronto."
