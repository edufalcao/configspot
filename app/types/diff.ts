import type { ConfigFormat } from './config';

export type ChangeType = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffChange {
  path: string,
  type: ChangeType,
  oldValue?: unknown,
  newValue?: unknown
}

export interface DiffResult {
  format: ConfigFormat,
  changes: DiffChange[],
  stats: DiffStats,
  rawDiff: string
}

export interface DiffStats {
  added: number,
  removed: number,
  changed: number,
  unchanged: number,
  total: number
}
