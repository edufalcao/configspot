import type { ConfigFormat } from './config';
import type { RiskSeverity } from './risk';

export type ChangeType = 'added' | 'removed' | 'changed' | 'unchanged';

export type ResultsTab = 'semantic' | 'raw' | 'summary' | 'tree';

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

export interface TreeNodeStats {
  added: number,
  removed: number,
  changed: number,
  unchanged: number
}

export interface TreeNode {
  name: string,
  path: string,
  depth: number,
  change: DiffChange | null,
  children: TreeNode[],
  stats: TreeNodeStats,
  maxRiskSeverity: RiskSeverity | null
}
