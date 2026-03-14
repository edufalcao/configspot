import type { ConfigFormat, ConfigTree } from '../../types/config';
import { detectFormat } from './detect';
import { parseEnv } from './env';
import { parseJson } from './json';
import { parseYaml } from './yaml';
import { parseToml } from './toml';
import { parseIni } from './ini';

export { detectFormat, parseEnv, parseJson, parseYaml, parseToml, parseIni };

const parsers: Record<ConfigFormat, (raw: string) => ConfigTree> = {
  env: parseEnv,
  json: parseJson,
  yaml: parseYaml,
  toml: parseToml,
  ini: parseIni
};

/**
 * Parse a raw configuration string into a ConfigTree.
 *
 * If `format` is not provided, the format is auto-detected from the content.
 * Delegates to the appropriate format-specific parser.
 */
export function parseConfig(raw: string, format?: ConfigFormat): ConfigTree {
  const resolvedFormat = format ?? detectFormat(raw);
  return parsers[resolvedFormat](raw);
}
