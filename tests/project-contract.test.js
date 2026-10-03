import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('workflow GitHub pubblica release stabile con description bilingue', () => {
  const text = fs.readFileSync('.github/workflows/release.yml', 'utf8');
  assert.match(text, /Verify release versions/);
  assert.match(text, /Read release description from tagged commit/);
  assert.match(text, /git log -1 --pretty=%b/);
  assert.match(text, /releaseBody:\s*\$\{\{ steps\.release_description\.outputs\.body \}\}/);
  assert.match(text, /prerelease:\s*false/);
  assert.doesNotMatch(text, /Stable release of _davPDF|generateReleaseNotes:\s*true/);
});

test('metadata pacchetto _davstudios presenti', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
  const cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
  assert.equal(pkg.author, '_davstudios');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.homepage, 'https://davstudios.it');
  assert.equal(tauri.identifier, 'studio.dav.pdf');
  assert.equal(tauri.bundle.publisher, '_davstudios');
  assert.equal(tauri.bundle.homepage, 'https://davstudios.it');
  assert.equal(tauri.bundle.license, 'MIT');
  assert.equal(tauri.bundle.licenseFile, '../LICENSE');
  assert.equal(tauri.bundle.linux.deb.section, 'utils');
  assert.equal(tauri.bundle.linux.deb.priority, 'optional');
  assert.match(cargo, /license = "MIT"/);
  assert.match(cargo, /homepage = "https:\/\/davstudios\.it"/);
});

test('identifier storico resta invariato', () => {
  const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
  assert.equal(tauri.identifier, 'studio.dav.pdf');
});

test('runtime PDFium continua a essere preparato e incluso nel bundle su ogni piattaforma', () => {
  const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
  const workflow = fs.readFileSync('.github/workflows/release.yml', 'utf8');
  const windowsPrepare = fs.readFileSync('PREPARE-PDFIUM-WINDOWS.ps1', 'utf8');
  const unixPrepare = fs.readFileSync('PREPARE-PDFIUM-UNIX.sh', 'utf8');
  const gitignore = fs.readFileSync('.gitignore', 'utf8');

  assert.equal(tauri.bundle.resources['resources/pdfium/'], 'pdfium/');
  assert.equal(fs.existsSync('src-tauri/resources/pdfium/.gitkeep'), true);
  assert.match(windowsPrepare, /pdfium\.dll/);
  assert.match(unixPrepare, /libpdfium\.dylib/);
  assert.match(unixPrepare, /libpdfium\.so/);
  assert.match(workflow, /Verify prepared PDFium runtime/);
  assert.match(workflow, /pdfium\.dll/);
  assert.match(workflow, /libpdfium\.dylib/);
  assert.match(workflow, /libpdfium\.so/);
  assert.match(gitignore, /src-tauri\/resources\/pdfium\/\*\.dll/);
  assert.match(gitignore, /src-tauri\/resources\/pdfium\/\*\.so/);
  assert.match(gitignore, /src-tauri\/resources\/pdfium\/\*\.dylib/);
});

test('set icone Tauri completo', () => {
  for (const file of ['32x32.png', '128x128.png', '128x128@2x.png', 'app-icon.png', 'icon.ico', 'icon.icns']) {
    assert.equal(fs.existsSync(`src-tauri/icons/${file}`), true, `${file} mancante`);
  }
});


test('release workflow usa percorsi repository espliciti e stabili', () => {
  const workflow = fs.readFileSync('.github/workflows/release.yml', 'utf8');
  const windowsPrepare = fs.readFileSync('PREPARE-PDFIUM-WINDOWS.ps1', 'utf8');
  const unixPrepare = fs.readFileSync('PREPARE-PDFIUM-UNIX.sh', 'utf8');
  assert.match(workflow, /Validate repository paths/);
  assert.match(workflow, /GITHUB_WORKSPACE/);
  assert.match(workflow, /projectPath:\s*\./);
  assert.match(windowsPrepare, /\$PSScriptRoot/);
  assert.match(windowsPrepare, /Get-ChildItem[^\n]*-Recurse/);
  assert.match(unixPrepare, /BASH_SOURCE\[0\]/);
  assert.match(unixPrepare, /find "\$WORK" -type f -name/);
});


