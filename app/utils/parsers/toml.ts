import { parse } from 'smol-toml';
import type { ConfigTree, ConfigEntry, ParseError } from '../../types/config';

/**
 * Flatten an arbitrary JS value into dot-path entries.
 */
function flatten(obj: unknown, prefix: string, entries: ConfigEntry[]): void {
  if (obj === null || obj === undefined) {
    entries.push({
      key: prefix.split('.').pop() ?? prefix,
      value: obj,
      path: prefix
    });
    return;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      entries.push({
        key: prefix.split('.').pop() ?? prefix,
        value: obj,
        path: prefix
      });
      return;
    }
    for (let i = 0; i < obj.length; i++) {
      flatten(obj[i], prefix ? `${prefix}.${i}` : String(i), entries);
    }
    return;
  }

  if (obj instanceof Date) {
    entries.push({
      key: prefix.split('.').pop() ?? prefix,
      value: obj.toISOString(),
      path: prefix
    });
    return;
  }

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 0) {
      entries.push({
        key: prefix.split('.').pop() ?? prefix,
        value: obj,
        path: prefix
      });
      return;
    }
    for (const key of keys) {
      flatten(record[key], prefix ? `${prefix}.${key}` : key, entries);
    }
    return;
  }

  // Primitive (string, number, boolean, bigint)
  entries.push({
    key: prefix.split('.').pop() ?? prefix,
    value: obj,
    path: prefix
  });
}

/**
 * Parse a TOML string into a ConfigTree.
 */
export function parseToml(raw: string): ConfigTree {
  const entries: ConfigEntry[] = [];
  const errors: ParseError[] = [];

  try {
    const parsed = parse(raw);
    flatten(parsed, '', entries);
  } catch (err: unknown) {
    let line = 1;
    let column: number | undefined;
    const message = err instanceof Error ? err.message : String(err);

    // smol-toml error messages often contain line numbers
    const lineMatch = message.match(/at line (\d+)/i);
    if (lineMatch) {
      line = Number(lineMatch[1]);
    }

    const colMatch = message.match(/column (\d+)/i);
    if (colMatch) {
      column = Number(colMatch[1]);
    }

    errors.push({ line, column, message });
  }

  return {
    format: 'toml',
    entries,
    raw,
    errors
  };
}
