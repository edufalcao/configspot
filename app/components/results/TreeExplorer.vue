<script setup lang="ts">
import type { DiffChange, TreeNode } from '~/types/diff';
import type { RiskAnnotation } from '~/types/risk';
import { buildTree } from '~/utils/diff/tree';
import { maskValue, isLikelySecret } from '~/utils/risk';

const props = defineProps<{
  changes: DiffChange[],
  risks: RiskAnnotation[],
  maskSecrets: boolean
}>();

const tree = computed(() => buildTree(props.changes, props.risks));

const collapsed = ref(new Set<string>());

// Default: top-level expanded, deeper levels collapsed
watch(tree, (nodes) => {
  const toCollapse = new Set<string>();
  function walk(node: TreeNode) {
    if (node.children.length > 0 && node.depth >= 1) {
      toCollapse.add(node.path);
    }
    for (const child of node.children) {
      walk(child);
    }
  }
  for (const node of nodes) {
    walk(node);
  }
  collapsed.value = toCollapse;
}, { immediate: true });

function toggle(path: string) {
  const next = new Set(collapsed.value);
  if (next.has(path)) {
    next.delete(path);
  } else {
    next.add(path);
  }
  collapsed.value = next;
}

function expandAll() {
  collapsed.value = new Set();
}

function collapseAll() {
  const all = new Set<string>();
  function walk(node: TreeNode) {
    if (node.children.length > 0) {
      all.add(node.path);
    }
    for (const child of node.children) {
      walk(child);
    }
  }
  for (const node of tree.value) {
    walk(node);
  }
  collapsed.value = all;
}

interface FlatRow {
  node: TreeNode,
  isBranch: boolean,
  isExpanded: boolean
}

const visibleRows = computed<FlatRow[]>(() => {
  const rows: FlatRow[] = [];
  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      const isBranch = node.children.length > 0;
      const isExpanded = isBranch && !collapsed.value.has(node.path);
      rows.push({ node, isBranch, isExpanded });
      if (isExpanded) {
        walk(node.children);
      }
    }
  }
  walk(tree.value);
  return rows;
});

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function shouldMask(path: string, value: unknown): boolean {
  return isLikelySecret(path, String(value ?? ''));
}

function displayValue(path: string, value: unknown): string {
  const formatted = formatValue(value);
  if (props.maskSecrets && shouldMask(path, value)) {
    return maskValue(formatted);
  }
  return formatted;
}

const riskDotColor: Record<string, string> = {
  high: 'bg-[var(--color-risk-high)]',
  review: 'bg-[var(--color-risk-review)]',
  info: 'bg-[var(--color-risk-info)]'
};
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2">
      <button
        class="rounded-md px-2 py-1 font-[var(--font-mono)] text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-elevated)] hover:text-[var(--color-text)]"
        @click="expandAll"
      >
        Expand all
      </button>
      <button
        class="rounded-md px-2 py-1 font-[var(--font-mono)] text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-elevated)] hover:text-[var(--color-text)]"
        @click="collapseAll"
      >
        Collapse all
      </button>
    </div>

    <!-- Tree rows -->
    <div class="divide-y divide-[var(--color-border)]">
      <div
        v-for="row in visibleRows"
        :key="row.node.path"
        :class="[
          'flex items-center gap-2 py-1.5 pr-4 font-[var(--font-mono)] text-sm',
          !row.isBranch && row.node.change ? {
            'bg-[var(--color-added-bg)]': row.node.change.type === 'added',
            'bg-[var(--color-removed-bg)]': row.node.change.type === 'removed',
            'bg-[var(--color-changed-bg)]': row.node.change.type === 'changed'
          } : ''
        ]"
        :style="{ paddingLeft: `${(row.node.depth * 20) + 16}px` }"
      >
        <!-- Branch row -->
        <template v-if="row.isBranch">
          <button
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-elevated)] hover:text-[var(--color-text)]"
            @click="toggle(row.node.path)"
          >
            {{ row.isExpanded ? '▼' : '▶' }}
          </button>

          <span class="font-medium text-[var(--color-text)]">{{ row.node.name }}</span>

          <!-- Compact badges -->
          <span
            v-if="row.node.stats.added > 0"
            class="rounded-full bg-[var(--color-accent)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
          >
            +{{ row.node.stats.added }}
          </span>
          <span
            v-if="row.node.stats.changed > 0"
            class="rounded-full bg-[var(--color-risk-review)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-risk-review)]"
          >
            ~{{ row.node.stats.changed }}
          </span>
          <span
            v-if="row.node.stats.removed > 0"
            class="rounded-full bg-[var(--color-accent-2)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-accent-2)]"
          >
            -{{ row.node.stats.removed }}
          </span>

          <!-- Risk dot -->
          <span
            v-if="row.node.maxRiskSeverity"
            :class="['ml-auto h-2 w-2 shrink-0 rounded-full', riskDotColor[row.node.maxRiskSeverity]]"
          />
        </template>

        <!-- Leaf row -->
        <template v-else-if="row.node.change">
          <span
            :class="[
              'flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold',
              {
                'bg-[var(--color-accent)]/20 text-[var(--color-accent)]': row.node.change.type === 'added',
                'bg-[var(--color-accent-2)]/20 text-[var(--color-accent-2)]': row.node.change.type === 'removed',
                'bg-[var(--color-risk-review)]/20 text-[var(--color-risk-review)]': row.node.change.type === 'changed',
                'text-[var(--color-muted)]': row.node.change.type === 'unchanged'
              }
            ]"
          >
            {{ row.node.change.type === 'added' ? '+' : row.node.change.type === 'removed' ? '-' : row.node.change.type === 'changed' ? '~' : ' ' }}
          </span>

          <span class="shrink-0 text-[var(--color-text)]">{{ row.node.name }}</span>

          <!-- Values -->
          <span
            v-if="row.node.change.type === 'changed'"
            class="ml-auto text-right"
          >
            <span class="text-[var(--color-accent-2)] line-through opacity-60">{{ displayValue(row.node.change.path, row.node.change.oldValue) }}</span>
            <span class="mx-1 text-[var(--color-muted)]">&rarr;</span>
            <span class="text-[var(--color-accent)]">{{ displayValue(row.node.change.path, row.node.change.newValue) }}</span>
          </span>
          <span
            v-else-if="row.node.change.type === 'added'"
            class="ml-auto text-right text-[var(--color-accent)]"
          >
            {{ displayValue(row.node.change.path, row.node.change.newValue) }}
          </span>
          <span
            v-else-if="row.node.change.type === 'removed'"
            class="ml-auto text-right text-[var(--color-accent-2)]"
          >
            {{ displayValue(row.node.change.path, row.node.change.oldValue) }}
          </span>
          <span
            v-else
            class="ml-auto text-right text-[var(--color-muted)]"
          >
            {{ displayValue(row.node.change.path, row.node.change.newValue ?? row.node.change.oldValue) }}
          </span>

          <!-- Risk dot for leaf -->
          <span
            v-if="row.node.maxRiskSeverity"
            :class="['h-2 w-2 shrink-0 rounded-full', riskDotColor[row.node.maxRiskSeverity]]"
          />
        </template>
      </div>

      <div
        v-if="visibleRows.length === 0"
        class="px-4 py-8 text-center text-sm text-[var(--color-muted)]"
      >
        No differences found.
      </div>
    </div>
  </div>
</template>
