import yaml from 'js-yaml';
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

  // Primitive
  entries.push({
    key: prefix.split('.').pop() ?? prefix,
    value: obj,
    path: prefix
  });
}

/**
 * Parse a YAML string into a ConfigTree.
 */
export function parseYaml(raw: string): ConfigTree {
  const entries: ConfigEntry[] = [];
  const errors: ParseError[] = [];

  try {
    const parsed: unknown = yaml.load(raw);

    // yaml.load returns undefined for empty documents
    if (parsed !== undefined && parsed !== null) {
      flatten(parsed, '', entries);
    }
  } catch (err: unknown) {
    let line = 1;
    let column: number | undefined;
    let message: string;

    if (err instanceof yaml.YAMLException) {
      message = err.message;
      if (err.mark) {
        line = (err.mark.line ?? 0) + 1; // js-yaml marks are 0-based
        column = (err.mark.column ?? 0) + 1;
      }
    } else {
      message = err instanceof Error ? err.message : String(err);
    }

    errors.push({ line, column, message });
  }

  return {
    format: 'yaml',
    entries,
    raw,
    errors
  };
}
