import type { DiffChange } from '~/types/diff';

export function generateSummary(changes: DiffChange[]): string {
  const added = changes.filter(c => c.type === 'added');
  const removed = changes.filter(c => c.type === 'removed');
  const changed = changes.filter(c => c.type === 'changed');
  const unchanged = changes.filter(c => c.type === 'unchanged');

  const lines: string[] = [];

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    lines.push('No differences found.');
    return lines.join('\n');
  }

  const parts: string[] = [];
  if (added.length > 0) parts.push(`${added.length} added`);
  if (removed.length > 0) parts.push(`${removed.length} removed`);
  if (changed.length > 0) parts.push(`${changed.length} changed`);
  if (unchanged.length > 0) parts.push(`${unchanged.length} unchanged`);
  lines.push(`Summary: ${parts.join(', ')}`);

  if (added.length > 0) {
    lines.push('');
    lines.push('Added:');
    for (const c of added) {
      lines.push(`  + ${c.path} = ${formatValue(c.newValue)}`);
    }
  }

  if (removed.length > 0) {
    lines.push('');
    lines.push('Removed:');
    for (const c of removed) {
      lines.push(`  - ${c.path} = ${formatValue(c.oldValue)}`);
    }
  }

  if (changed.length > 0) {
    lines.push('');
    lines.push('Changed:');
    for (const c of changed) {
      lines.push(`  ~ ${c.path}: ${formatValue(c.oldValue)} → ${formatValue(c.newValue)}`);
    }
  }

  return lines.join('\n');
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
