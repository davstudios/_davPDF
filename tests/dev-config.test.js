import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tauri = JSON.parse(fs.readFileSync(new URL('../src-tauri/tauri.conf.json', import.meta.url), 'utf8'));
const vite = fs.readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');
const preflight = fs.readFileSync(new URL('../scripts/dev-preflight.mjs', import.meta.url), 'utf8');
const render = fs.readFileSync(new URL('../src-tauri/src/pdf_render.rs', import.meta.url), 'utf8');

test('development port is dedicated and consistent', () => {
  assert.equal(tauri.build.devUrl, 'http://127.0.0.1:17333');
  assert.match(vite, /port:\s*17333/);
  assert.match(packageJson.scripts.predesktop, /17333/);
});

test('desktop launch runs the preflight automatically', () => {
  assert.equal(packageJson.scripts.desktop, 'tauri dev');
  assert.match(packageJson.scripts.predesktop, /dev-preflight\.mjs/);
  assert.match(preflight, /Get-NetTCPConnection/);
  assert.match(preflight, /taskkill\.exe/);
});

test('pdfium page indices use the current signed index type', () => {
  assert.doesNotMatch(render, /pages\(\)\.get\([^\n]*as u16/);
  assert.match(render, /pages\(\)\.get\(\(page_number - 1\) as i32\)/);
});


