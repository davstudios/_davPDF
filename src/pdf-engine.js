export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let current = value / 1024;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  const digits = current >= 100 ? 0 : current >= 10 ? 1 : 2;
  return `${current.toFixed(digits)} ${units[index]}`;
}

export function parsePageExpression(expression, pageCount) {
  const max = Math.max(0, Number(pageCount) || 0);
  const pages = new Set();
  const input = String(expression || '').trim();
  if (!input) return [];
  for (const raw of input.split(',')) {
    const token = raw.trim();
    if (!token) continue;
    if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page >= 1 && page <= max) pages.add(page);
      continue;
    }
    const match = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) continue;
    let start = Number(match[1]);
    let end = Number(match[2]);
    if (start > end) [start, end] = [end, start];
    for (let page = Math.max(1, start); page <= Math.min(max, end); page += 1) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}

export function splitGroups(mode, pageCount, expression = '', every = 1) {
  const count = Math.max(0, Number(pageCount) || 0);
  if (!count) return [];
  if (mode === 'every') return Array.from({ length: count }, (_, index) => [index + 1]);
  if (mode === 'everyN') {
    const size = Math.max(1, Number(every) || 1);
    const groups = [];
    for (let start = 1; start <= count; start += size) {
      groups.push(Array.from({ length: Math.min(size, count - start + 1) }, (_, index) => start + index));
    }
    return groups;
  }
  if (mode === 'ranges') {
    return String(expression || '').split(/\n|;/).map((part) => parsePageExpression(part, count)).filter((group) => group.length);
  }
  return [];
}

export function outputName(name, operation) {
  const source = String(name || 'document.pdf');
  const stem = source.toLowerCase().endsWith('.pdf') ? source.slice(0, -4) : source;
  const suffixes = { merge: 'merged', split: 'part', pages: 'edited', compress: 'compressed', metadata: 'metadata', protect: 'protected', unlock: 'unlocked', extract: 'extracted' };
  return `${stem}-${suffixes[operation] || 'output'}.pdf`;
}

export function pageOrder(count) {
  return Array.from({ length: Math.max(0, Number(count) || 0) }, (_, index) => index + 1);
}

export function movePage(order, index, direction) {
  const result = [...order];
  const target = index + direction;
  if (index < 0 || index >= result.length || target < 0 || target >= result.length) return result;
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

export function normalizedRotation(value) {
  return ((Number(value) % 360) + 360) % 360;
}

export function estimatedCompressionLevel(preset) {
  return ({ lossless: 4, high: 5, balanced: 7, maximum: 9 })[preset] ?? 7;
}

