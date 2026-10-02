# _davPDF v26.10.3 build notes

## Requirements

- Node.js LTS
- Rust 1.88 or newer
- Tauri 2 platform prerequisites

## PDFium

Page rendering uses PDFium release 7881 through `pdfium-render 0.9.4`. The project scripts download the matching dynamic library from `bblanchon/pdfium-binaries` into `src-tauri/resources/pdfium/`. Tauri bundles that runtime with the application.

## Windows

Run `RUN-WINDOWS.bat` for development or `BUILD-WINDOWS.bat` for a bundle. Both scripts prepare `pdfium.dll` automatically.

## macOS

Run `./RUN-MACOS.sh` for development or `./BUILD-MACOS.sh` for a bundle. The script prepares the Universal `libpdfium.dylib`.

## Linux

On Ubuntu/Debian first run `./INSTALL-LINUX-DEPS-UBUNTU.sh`, then `./RUN-LINUX.sh` or `./BUILD-LINUX.sh`. The script prepares `libpdfium.so` for x64.

## Development launcher reliability

The development server uses the dedicated local port `17333`. Before `tauri dev` starts, `_davPDF` checks for stale development processes from the same project on Windows and cleans them up. Processes belonging to other applications are never terminated automatically.


## Release metadata

This release adopts the `_davstudios` package metadata standard: MIT license, publisher, homepage, copyright, package descriptions and Linux DEB metadata are declared in the application bundle configuration.

## GitHub Release description

The release workflow reads the bilingual Description/body from the commit referenced by the release tag. Both `🇮🇹` and `🇺🇸` sections are required before publication.

## Unsigned distribution

Windows and macOS packages are currently distributed without a trusted commercial Windows code-signing certificate or Apple Developer ID/notarization. The README documents the expected SmartScreen and Gatekeeper flows.

## Path-safe release preparation

Release scripts resolve the repository root from their own location instead of relying on the caller working directory. PDFium archive extraction searches for the expected runtime library recursively before copying it into `src-tauri/resources/pdfium/`. GitHub Actions validates required project paths before starting the native build and verifies the platform-specific PDFium runtime immediately after preparation: `pdfium.dll` on Windows, `libpdfium.dylib` on macOS and `libpdfium.so` on Linux.

