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

test('runtime PDFium continua a essere incluso nel bundle', () => {
  const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
  assert.equal(tauri.bundle.resources['resources/pdfium/'], 'pdfium/');
  assert.equal(fs.existsSync('src-tauri/resources/pdfium/pdfium.dll'), true);
});

test('set icone Tauri completo', () => {
  for (const file of ['32x32.png', '128x128.png', '128x128@2x.png', 'app-icon.png', 'icon.ico', 'icon.icns']) {
    assert.equal(fs.existsSync(`src-tauri/icons/${file}`), true, `${file} mancante`);
  }
});
