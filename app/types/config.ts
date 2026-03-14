export type ConfigFormat = 'env' | 'json' | 'yaml' | 'toml' | 'ini';

export interface ConfigEntry {
  key: string,
  value: unknown,
  path: string,
  comment?: string
}

export interface ConfigTree {
  format: ConfigFormat,
  entries: ConfigEntry[],
  raw: string,
  errors: ParseError[]
}

export interface ParseError {
  line: number,
  column?: number,
  message: string
}
