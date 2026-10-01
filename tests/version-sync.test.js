import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packageVersion = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
const tauriVersion = JSON.parse(readFileSync(resolve(root, 'src-tauri/tauri.conf.json'), 'utf8')).version;
const cargoText = readFileSync(resolve(root, 'src-tauri/Cargo.toml'), 'utf8');
const cargoVersion = cargoText.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const mainSource = readFileSync(resolve(root, 'src/main.js'), 'utf8');

test('release versions stay aligned', () => {
  assert.equal(packageVersion, '26.10.1');
  assert.equal(tauriVersion, packageVersion);
  assert.equal(cargoVersion, packageVersion);
});

test('UI reads the app version from Tauri instead of hardcoding it', () => {
  assert.match(mainSource, /getVersion/);
  assert.doesNotMatch(mainSource, /v\d+\.\d+\.\d+/);
});
