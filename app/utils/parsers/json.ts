import type { ConfigTree, ConfigEntry, ParseError } from '../../types/config';

/**
 * Strip JSONC comments (single-line `//` and multi-line `/* ... * /`) from a
 * string so it can be fed to `JSON.parse`. Takes care not to strip inside
 * string literals.
 */
function stripJsonComments(text: string): string {
  let result = '';
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    // String literal — pass through verbatim
    if (ch === '"') {
      let j = i + 1;
      while (j < len) {
        if (text[j] === '\\') {
          j += 2; // skip escaped char
        } else if (text[j] === '"') {
          j++;
          break;
        } else {
          j++;
        }
      }
      result += text.slice(i, j);
      i = j;
      continue;
    }

    // Single-line comment
    if (ch === '/' && i + 1 < len && text[i + 1] === '/') {
      // Skip until end of line
      let j = i + 2;
      while (j < len && text[j] !== '\n') j++;
      i = j;
      continue;
    }

    // Multi-line comment
    if (ch === '/' && i + 1 < len && text[i + 1] === '*') {
      let j = i + 2;
      while (j < len) {
        if (text[j] === '*' && j + 1 < len && text[j + 1] === '/') {
          j += 2;
          break;
        }
        j++;
      }
      i = j;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

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
 * Parse a JSON or JSONC string into a ConfigTree.
 */
export function parseJson(raw: string): ConfigTree {
  const entries: ConfigEntry[] = [];
  const errors: ParseError[] = [];

  try {
    const cleaned = stripJsonComments(raw);
    const parsed: unknown = JSON.parse(cleaned);
    flatten(parsed, '', entries);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // Try to extract line/column from the error message
    // Common format: "... at position 123" or "... at line 4 column 12"
    let line = 1;
    let column: number | undefined;

    const posMatch = message.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = Number(posMatch[1]);
      // Convert absolute position to line/column
      const upToPos = raw.slice(0, pos);
      line = (upToPos.match(/\n/g) || []).length + 1;
      column = pos - upToPos.lastIndexOf('\n');
    }

    const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lineColMatch) {
      line = Number(lineColMatch[1]);
      column = Number(lineColMatch[2]);
    }

    errors.push({ line, column, message });
  }

  return {
    format: 'json',
    entries,
    raw,
    errors
  };
}
