import type { DiffChange } from './diff';

export type RiskSeverity = 'info' | 'review' | 'high';

export type RiskCategory
  = | 'credential'
    | 'url'
    | 'port'
    | 'feature-flag'
    | 'dependency-version'
    | 'boolean-flip'
    | 'threshold'
    | 'key-removed'
    | 'placeholder';

export interface RiskAnnotation {
  change: DiffChange,
  severity: RiskSeverity,
  category: RiskCategory,
  label: string
}
