import { parse } from 'ini';
import type { ConfigTree, ConfigEntry, ParseError } from '../../types/config';

/**
 * Flatten parsed INI data into dot-path entries.
 *
 * Top-level keys without a section get their key as the path.
 * Keys within sections get `section.key` paths. Nested sections
 * (from dotted section names like `[section.subsection]`) are flattened
 * recursively.
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

  if (typeof obj === 'object' && !Array.isArray(obj)) {
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

  // Primitive or array
  entries.push({
    key: prefix.split('.').pop() ?? prefix,
    value: obj,
    path: prefix
  });
}

/**
 * Parse an INI string into a ConfigTree.
 *
 * Uses the `ini` package which returns a nested object where section names
 * become top-level keys and key=value pairs within sections become nested
 * properties.
 */
export function parseIni(raw: string): ConfigTree {
  const entries: ConfigEntry[] = [];
  const errors: ParseError[] = [];

  try {
    const parsed = parse(raw);
    flatten(parsed, '', entries);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // The `ini` package rarely throws, but handle it gracefully
    let line = 1;
    const lineMatch = message.match(/line (\d+)/i);
    if (lineMatch) {
      line = Number(lineMatch[1]);
    }

    errors.push({ line, message });
  }

  return {
    format: 'ini',
    entries,
    raw,
    errors
  };
}
