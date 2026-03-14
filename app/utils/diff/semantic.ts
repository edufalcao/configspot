import type { ConfigTree } from '~/types/config';
import type { DiffChange } from '~/types/diff';

export function semanticDiff(left: ConfigTree, right: ConfigTree): DiffChange[] {
  const changes: DiffChange[] = [];

  const leftByPath = new Map(left.entries.map(e => [e.path, e]));
  const rightByPath = new Map(right.entries.map(e => [e.path, e]));

  // Detect removed and changed entries
  for (const [path, leftEntry] of leftByPath) {
    const rightEntry = rightByPath.get(path);

    if (!rightEntry) {
      changes.push({ path, type: 'removed', oldValue: leftEntry.value });
    } else if (!valuesEqual(leftEntry.value, rightEntry.value)) {
      changes.push({ path, type: 'changed', oldValue: leftEntry.value, newValue: rightEntry.value });
    } else {
      changes.push({ path, type: 'unchanged', oldValue: leftEntry.value, newValue: rightEntry.value });
    }
  }

  // Detect added entries
  for (const [path, rightEntry] of rightByPath) {
    if (!leftByPath.has(path)) {
      changes.push({ path, type: 'added', newValue: rightEntry.value });
    }
  }

  return changes;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => valuesEqual(val, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => key in bObj && valuesEqual(aObj[key], bObj[key]));
  }

  return false;
}
