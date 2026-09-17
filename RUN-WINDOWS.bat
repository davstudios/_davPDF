@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo [ERRORE] Node.js non trovato. Installa Node.js e riapri questo file.& pause & exit /b 1)
where cargo >nul 2>nul || (echo [ERRORE] Rust/Cargo non trovato. Installa Rust da rustup.rs e i Microsoft C++ Build Tools.& pause & exit /b 1)
echo Preparazione renderer PDFium...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0PREPARE-PDFIUM-WINDOWS.ps1" || (pause & exit /b 1)
echo Verifica dipendenze npm...
call npm install --no-audit --no-fund || (pause & exit /b 1)
echo Controllo sessione di sviluppo...
call npm run desktop
if errorlevel 1 pause
