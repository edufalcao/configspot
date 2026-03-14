import type { ConfigFormat } from '../../types/config';

/**
 * Auto-detect a configuration format from content heuristics.
 *
 * The detection order matters: more specific formats are checked first so that
 * ambiguous inputs (e.g. a bare key/value line) fall through to the most
 * likely match.
 */
export function detectFormat(content: string): ConfigFormat {
  const trimmed = content.trim();

  // Empty or whitespace-only content — default to env as the simplest format
  if (trimmed.length === 0) {
    return 'env';
  }

  // --- JSON / JSONC ---
  // Starts with `{` or `[` (ignoring leading comments for JSONC)
  const withoutJsoncComments = trimmed.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (withoutJsoncComments.startsWith('{') || withoutJsoncComments.startsWith('[')) {
    return 'json';
  }

  // --- TOML ---
  // Table headers like [section] or [[array]], or bare key = "value" with TOML
  // type markers (triple quotes, datetime literals, etc.)
  // Check for TOML table headers: lines starting with [word] but NOT [section] followed
  // by `key = value` which would also match INI. TOML distinguishes itself with:
  //   - [[array]] double-bracket tables
  //   - Typed values (true/false without quotes, dates, triple-quoted strings)
  //   - Dotted keys like `server.host = ...`
  if (/^\[\[.+\]\]\s*$/m.test(trimmed)) {
    return 'toml';
  }

  // TOML uses `key = value` where value can be typed (bool, number, datetime,
  // arrays, inline tables). INI typically uses `key=value` or `key = value`
  // inside [sections] with untyped (string) values.
  // A line with a dotted key (`a.b = ...`) is TOML-specific.
  if (/^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_.]*\s*=/m.test(trimmed)) {
    return 'toml';
  }

  // --- YAML ---
  // YAML documents may start with `---`, or contain mapping indicators like `key:`
  if (trimmed.startsWith('---')) {
    return 'yaml';
  }
  // YAML uses `key: value` (colon+space), while INI uses `key=value`.
  // Check for `key: value` patterns that are not URLs (http: https:)
  const lines = trimmed.split('\n');
  const yamlMappingPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\s*:\s/;
  const yamlMappingNoValue = /^[a-zA-Z_][a-zA-Z0-9_]*\s*:\s*$/;
  const yamlListItem = /^\s*-\s+/;
  let yamlScore = 0;
  let iniScore = 0;
  let envScore = 0;

  for (const line of lines) {
    const stripped = line.trim();
    if (stripped === '' || stripped.startsWith('#')) continue;

    if (yamlMappingPattern.test(stripped) || yamlMappingNoValue.test(stripped)) {
      yamlScore++;
    }
    if (yamlListItem.test(stripped)) {
      yamlScore++;
    }
    // INI section header
    if (/^\[.+\]$/.test(stripped)) {
      iniScore++;
    }
    // INI/env key=value (no colon)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(stripped)) {
      iniScore++;
      envScore++;
    }
  }

  // --- INI ---
  // INI files have [section] headers
  if (iniScore > 0 && /^\[.+\]\s*$/m.test(trimmed)) {
    // Could be TOML with [section] headers too, but TOML was already checked
    // for its distinguishing features above. Default to INI.
    return 'ini';
  }

  if (yamlScore > envScore && yamlScore > 0) {
    return 'yaml';
  }

  // --- ENV ---
  // KEY=VALUE pattern with uppercase keys is the env convention
  if (/^[A-Z_][A-Z0-9_]*\s*=/m.test(trimmed)) {
    return 'env';
  }

  // Fallback: if there are `key=value` lines, treat as env
  if (envScore > 0) {
    return 'env';
  }

  // Ultimate fallback
  return 'env';
}
