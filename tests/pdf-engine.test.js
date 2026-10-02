import test from 'node:test';
import assert from 'node:assert/strict';
import { estimatedCompressionLevel, formatBytes, movePage, normalizedRotation, outputName, pageOrder, parsePageExpression, splitGroups } from '../src/pdf-engine.js';

test('formats byte sizes', () => {
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(1048576), '1.00 MB');
});

test('parses page expressions', () => {
  assert.deepEqual(parsePageExpression('1-3, 5, 8-7', 10), [1, 2, 3, 5, 7, 8]);
});

test('ignores invalid and out of range pages', () => {
  assert.deepEqual(parsePageExpression('0,2,99,test', 5), [2]);
});

test('splits every page', () => {
  assert.deepEqual(splitGroups('every', 3), [[1], [2], [3]]);
});

test('splits every N pages', () => {
  assert.deepEqual(splitGroups('everyN', 5, '', 2), [[1, 2], [3, 4], [5]]);
});

test('splits explicit ranges', () => {
  assert.deepEqual(splitGroups('ranges', 10, '1-3;5,7;9-10'), [[1, 2, 3], [5, 7], [9, 10]]);
});

test('creates operation output names', () => {
  assert.equal(outputName('contract.pdf', 'compress'), 'contract-compressed.pdf');
  assert.equal(outputName('file', 'unlock'), 'file-unlocked.pdf');
});

test('creates page order', () => {
  assert.deepEqual(pageOrder(4), [1, 2, 3, 4]);
});

test('moves pages safely', () => {
  assert.deepEqual(movePage([1, 2, 3], 1, -1), [2, 1, 3]);
  assert.deepEqual(movePage([1, 2, 3], 0, -1), [1, 2, 3]);
});

test('normalizes rotations', () => {
  assert.equal(normalizedRotation(450), 90);
  assert.equal(normalizedRotation(-90), 270);
});

test('maps compression presets', () => {
  assert.equal(estimatedCompressionLevel('balanced'), 7);
  assert.equal(estimatedCompressionLevel('maximum'), 9);
});

