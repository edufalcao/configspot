import type { ConfigTree, ConfigEntry, ParseError } from '../../types/config';

/**
 * Parse `.env`-style configuration content.
 *
 * Handles:
 * - KEY=VALUE pairs
 * - Quoted values (single, double, backtick)
 * - Comments (lines starting with #, inline comments after unquoted values)
 * - Blank lines (ignored)
 * - Variable interpolation references like ${VAR} (preserved as-is in the value)
 * - `export` prefix (e.g. `export KEY=VALUE`)
 */
export function parseEnv(raw: string): ConfigTree {
  const entries: ConfigEntry[] = [];
  const errors: ParseError[] = [];
  const lines = raw.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i]!;
    const trimmed = line.trim();

    // Skip blank lines and full-line comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    // Strip optional `export ` prefix
    const effective = trimmed.startsWith('export ')
      ? trimmed.slice(7).trim()
      : trimmed;

    // Find the first `=`
    const eqIndex = effective.indexOf('=');
    if (eqIndex === -1) {
      errors.push({ line: lineNum, message: `Expected KEY=VALUE pair, got: "${trimmed}"` });
      continue;
    }

    const key = effective.slice(0, eqIndex).trim();

    // Validate key
    if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(key)) {
      errors.push({ line: lineNum, message: `Invalid key name: "${key}"` });
      continue;
    }

    let rawValue = effective.slice(eqIndex + 1);
    let value: string;
    let comment: string | undefined;

    // Check for quoted values
    const firstChar = rawValue.charAt(0);
    if (firstChar === '"' || firstChar === '\'' || firstChar === '`') {
      const quote = firstChar;
      // Find matching closing quote
      const closeIndex = rawValue.indexOf(quote, 1);
      if (closeIndex === -1) {
        errors.push({ line: lineNum, message: `Unterminated ${quote} quote for key "${key}"` });
        // Use the rest as the value anyway
        value = rawValue.slice(1);
      } else {
        value = rawValue.slice(1, closeIndex);
        // Anything after the closing quote could be a comment
        const remainder = rawValue.slice(closeIndex + 1).trim();
        if (remainder.startsWith('#')) {
          comment = remainder.slice(1).trim();
        }
      }

      // Handle escape sequences in double-quoted values
      if (quote === '"') {
        value = value
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"');
      }
    } else {
      // Unquoted value — strip inline comment
      const commentIndex = rawValue.indexOf(' #');
      if (commentIndex !== -1) {
        comment = rawValue.slice(commentIndex + 2).trim();
        rawValue = rawValue.slice(0, commentIndex);
      }
      value = rawValue.trim();
    }

    entries.push({
      key,
      value,
      path: key,
      ...(comment !== undefined && { comment })
    });
  }

  return {
    format: 'env',
    entries,
    raw,
    errors
  };
}
