import type { DiffChange, TreeNode, TreeNodeStats } from '~/types/diff';
import type { RiskAnnotation, RiskSeverity } from '~/types/risk';

const SEVERITY_ORDER: Record<RiskSeverity, number> = {
  info: 0,
  review: 1,
  high: 2
};

function maxSeverity(a: RiskSeverity | null, b: RiskSeverity | null): RiskSeverity | null {
  if (a === null) return b;
  if (b === null) return a;
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

function emptyStats(): TreeNodeStats {
  return { added: 0, removed: 0, changed: 0, unchanged: 0 };
}

export function buildTree(changes: DiffChange[], risks: RiskAnnotation[] = []): TreeNode[] {
  const riskByPath = new Map<string, RiskSeverity>();
  for (const r of risks) {
    const existing = riskByPath.get(r.change.path);
    riskByPath.set(r.change.path, maxSeverity(existing ?? null, r.severity)!);
  }

  // Virtual root to collect top-level nodes
  const root: TreeNode = {
    name: '',
    path: '',
    depth: -1,
    change: null,
    children: [],
    stats: emptyStats(),
    maxRiskSeverity: null
  };

  for (const change of changes) {
    const segments = change.path.split('.');
    let current = root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      const fullPath = segments.slice(0, i + 1).join('.');
      const isLeaf = i === segments.length - 1;

      let child = current.children.find(c => c.name === segment);
      if (!child) {
        child = {
          name: segment,
          path: fullPath,
          depth: i,
          change: isLeaf ? change : null,
          children: [],
          stats: emptyStats(),
          maxRiskSeverity: null
        };
        current.children.push(child);
      }

      if (isLeaf) {
        child.change = change;
      }

      current = child;
    }
  }

  // Post-order traversal to aggregate stats and risk severity
  function aggregate(node: TreeNode): void {
    if (node.children.length === 0) {
      // Leaf node
      if (node.change) {
        const key = node.change.type as keyof TreeNodeStats;
        if (key in node.stats) {
          node.stats[key] = 1;
        }
        node.maxRiskSeverity = riskByPath.get(node.change.path) ?? null;
      }
      return;
    }

    for (const child of node.children) {
      aggregate(child);
      node.stats.added += child.stats.added;
      node.stats.removed += child.stats.removed;
      node.stats.changed += child.stats.changed;
      node.stats.unchanged += child.stats.unchanged;
      node.maxRiskSeverity = maxSeverity(node.maxRiskSeverity, child.maxRiskSeverity);
    }
  }

  for (const child of root.children) {
    aggregate(child);
  }

  // Sort children alphabetically at each level
  function sortChildren(node: TreeNode): void {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    for (const child of node.children) {
      sortChildren(child);
    }
  }

  for (const child of root.children) {
    sortChildren(child);
  }

  return root.children;
}
