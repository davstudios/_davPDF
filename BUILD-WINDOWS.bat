@echo off
setlocal
set "DAVPDF_ROOT=%~dp0"
cd /d "%DAVPDF_ROOT%"
where node >nul 2>nul || (echo [ERRORE] Node.js non trovato.& pause & exit /b 1)
where cargo >nul 2>nul || (echo [ERRORE] Rust/Cargo non trovato.& pause & exit /b 1)
echo Preparazione renderer PDFium...
powershell -NoProfile -ExecutionPolicy Bypass -File "%DAVPDF_ROOT%PREPARE-PDFIUM-WINDOWS.ps1" || (pause & exit /b 1)
echo Verifica dipendenze npm...
call npm install --no-audit --no-fund || (pause & exit /b 1)
call npm run bundle
if errorlevel 1 (pause & exit /b 1)
echo.
echo Build completata. Controlla: src-tauri\target\release\bundle\
pause

