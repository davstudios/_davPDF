# _davPDF v1.0.0 build notes

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
