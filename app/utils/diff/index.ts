import type { ConfigTree } from '~/types/config';
import type { DiffResult, DiffStats } from '~/types/diff';
import { rawDiff } from './raw';
import { semanticDiff } from './semantic';

export { rawDiff } from './raw';
export { semanticDiff } from './semantic';
export { generateSummary } from './summary';

export function compareConfigs(left: ConfigTree, right: ConfigTree): DiffResult {
  const changes = semanticDiff(left, right);
  const raw = rawDiff(left.raw, right.raw);

  const stats: DiffStats = {
    added: changes.filter(c => c.type === 'added').length,
    removed: changes.filter(c => c.type === 'removed').length,
    changed: changes.filter(c => c.type === 'changed').length,
    unchanged: changes.filter(c => c.type === 'unchanged').length,
    total: changes.length
  };

  return {
    format: left.format,
    changes,
    stats,
    rawDiff: raw
  };
}
