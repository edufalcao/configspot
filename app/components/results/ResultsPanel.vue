<script setup lang="ts">
import type { DiffResult, ResultsTab } from '~/types/diff';
import type { RiskAnnotation } from '~/types/risk';

const props = defineProps<{
  result: DiffResult,
  risks: RiskAnnotation[],
  maskSecrets: boolean,
  shareUrl: string | null,
  isSharing: boolean,
  copied: boolean,
  activeTab: ResultsTab
}>();

const emit = defineEmits<{
  'share': [],
  'copyUrl': [],
  'update:activeTab': [value: ResultsTab]
}>();

const showExportMenu = ref(false);

const {
  exportFeedback,
  exportRawDiff,
  exportSummary,
  exportMarkdownTable,
  exportHtmlReport
} = useExport();

function handleExport(action: string) {
  showExportMenu.value = false;
  switch (action) {
    case 'raw':
      exportRawDiff(props.result.rawDiff);
      break;
    case 'summary':
      exportSummary(props.result.changes);
      break;
    case 'markdown':
      exportMarkdownTable(props.result.changes);
      break;
    case 'html':
      exportHtmlReport(props.result, props.risks);
      break;
  }
}

function closeExportMenu(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.export-dropdown')) {
    showExportMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', closeExportMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeExportMenu);
});

const summaryStats = computed(() => {
  const changes = props.result.changes;
  return {
    added: changes.filter(c => c.type === 'added'),
    removed: changes.filter(c => c.type === 'removed'),
    changed: changes.filter(c => c.type === 'changed'),
    unchanged: changes.filter(c => c.type === 'unchanged')
  };
});

function formatDisplayValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Summary bar -->
    <ResultsSummaryBar
      :stats="result.stats"
      :format="result.format"
      :risk-count="risks.length"
    />

    <!-- Tab controls + share + export -->
    <div class="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      <button
        v-for="tab in (['semantic', 'raw', 'tree', 'summary'] as const)"
        :key="tab"
        :class="[
          'rounded-md px-3 py-1.5 font-[var(--font-mono)] text-xs font-medium transition-colors',
          activeTab === tab
            ? 'bg-[var(--color-elevated)] text-[var(--color-text)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        ]"
        @click="emit('update:activeTab', tab)"
      >
        {{ tab === 'semantic' ? 'Semantic' : tab === 'raw' ? 'Raw Diff' : tab === 'tree' ? 'Tree' : 'Summary' }}
      </button>

      <div class="ml-auto flex items-center gap-2 px-1">
        <!-- Export feedback -->
        <span
          v-if="exportFeedback"
          class="font-[var(--font-mono)] text-xs text-[var(--color-accent)]"
        >
          {{ exportFeedback }}
        </span>

        <!-- Export dropdown -->
        <div class="export-dropdown relative">
          <UiBaseButton
            variant="secondary"
            size="sm"
            @click.stop="showExportMenu = !showExportMenu"
          >
            Export
          </UiBaseButton>
          <div
            v-if="showExportMenu"
            class="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
          >
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-left font-[var(--font-mono)] text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-elevated)]"
              @click="handleExport('raw')"
            >
              Copy Raw Diff
            </button>
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-left font-[var(--font-mono)] text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-elevated)]"
              @click="handleExport('summary')"
            >
              Copy Summary
            </button>
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-left font-[var(--font-mono)] text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-elevated)]"
              @click="handleExport('markdown')"
            >
              Copy Markdown Table
            </button>
            <div class="mx-2 my-1 border-t border-[var(--color-border)]" />
            <button
              class="flex w-full items-center gap-2 px-3 py-2 text-left font-[var(--font-mono)] text-xs text-[var(--color-text)] transition-colors hover:bg-[var(--color-elevated)]"
              @click="handleExport('html')"
            >
              Download HTML Report
            </button>
          </div>
        </div>

        <!-- Share -->
        <UiBaseButton
          v-if="!shareUrl"
          variant="secondary"
          size="sm"
          :disabled="isSharing"
          @click="emit('share')"
        >
          {{ isSharing ? 'Sharing...' : 'Share' }}
        </UiBaseButton>
        <template v-else>
          <span class="truncate font-[var(--font-mono)] text-xs text-[var(--color-muted)]">{{ shareUrl }}</span>
          <UiBaseButton
            variant="secondary"
            size="sm"
            @click="emit('copyUrl')"
          >
            {{ copied ? 'Copied!' : 'Copy' }}
          </UiBaseButton>
        </template>
      </div>
    </div>

    <!-- Content area -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      <div>
        <!-- Semantic diff -->
        <ResultsDiffView
          v-if="activeTab === 'semantic'"
          :changes="result.changes.filter(c => c.type !== 'unchanged')"
          :mask-secrets="maskSecrets"
        />

        <!-- Raw diff -->
        <div
          v-else-if="activeTab === 'raw'"
          class="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <pre class="p-4 font-[var(--font-mono)] text-sm text-[var(--color-text)]">{{ result.rawDiff }}</pre>
        </div>

        <!-- Tree Explorer -->
        <ResultsTreeExplorer
          v-else-if="activeTab === 'tree'"
          :changes="result.changes"
          :risks="risks"
          :mask-secrets="maskSecrets"
        />

        <!-- Smart Summary -->
        <div
          v-else
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <!-- No changes -->
          <div
            v-if="summaryStats.added.length === 0 && summaryStats.removed.length === 0 && summaryStats.changed.length === 0"
            class="px-4 py-8 text-center font-[var(--font-mono)] text-sm text-[var(--color-muted)]"
          >
            No differences found.
          </div>

          <div
            v-else
            class="divide-y divide-[var(--color-border)]"
          >
            <!-- Overview -->
            <div class="flex flex-wrap items-center gap-3 px-4 py-3">
              <span class="font-[var(--font-display)] text-sm font-semibold text-[var(--color-text)]">
                Overview
              </span>
              <span class="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
                {{ result.stats.total }} keys total
              </span>
            </div>

            <!-- Added section -->
            <div
              v-if="summaryStats.added.length > 0"
              class="px-4 py-3"
            >
              <div class="mb-2 flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-accent)]/20 font-[var(--font-mono)] text-xs font-bold text-[var(--color-accent)]">+</span>
                <span class="font-[var(--font-display)] text-sm font-medium text-[var(--color-text)]">
                  Added ({{ summaryStats.added.length }})
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <div
                  v-for="c in summaryStats.added"
                  :key="c.path"
                  class="flex items-center gap-2 rounded-md bg-[var(--color-added-bg)] px-3 py-1.5 font-[var(--font-mono)] text-xs"
                >
                  <span class="font-medium text-[var(--color-text)]">{{ c.path }}</span>
                  <span class="ml-auto text-[var(--color-accent)]">{{ formatDisplayValue(c.newValue) }}</span>
                </div>
              </div>
            </div>

            <!-- Removed section -->
            <div
              v-if="summaryStats.removed.length > 0"
              class="px-4 py-3"
            >
              <div class="mb-2 flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-accent-2)]/20 font-[var(--font-mono)] text-xs font-bold text-[var(--color-accent-2)]">-</span>
                <span class="font-[var(--font-display)] text-sm font-medium text-[var(--color-text)]">
                  Removed ({{ summaryStats.removed.length }})
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <div
                  v-for="c in summaryStats.removed"
                  :key="c.path"
                  class="flex items-center gap-2 rounded-md bg-[var(--color-removed-bg)] px-3 py-1.5 font-[var(--font-mono)] text-xs"
                >
                  <span class="font-medium text-[var(--color-text)]">{{ c.path }}</span>
                  <span class="ml-auto text-[var(--color-accent-2)]">{{ formatDisplayValue(c.oldValue) }}</span>
                </div>
              </div>
            </div>

            <!-- Changed section -->
            <div
              v-if="summaryStats.changed.length > 0"
              class="px-4 py-3"
            >
              <div class="mb-2 flex items-center gap-2">
                <span class="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-risk-review)]/20 font-[var(--font-mono)] text-xs font-bold text-[var(--color-risk-review)]">~</span>
                <span class="font-[var(--font-display)] text-sm font-medium text-[var(--color-text)]">
                  Changed ({{ summaryStats.changed.length }})
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <div
                  v-for="c in summaryStats.changed"
                  :key="c.path"
                  class="flex items-center gap-2 rounded-md bg-[var(--color-changed-bg)] px-3 py-1.5 font-[var(--font-mono)] text-xs"
                >
                  <span class="shrink-0 font-medium text-[var(--color-text)]">{{ c.path }}</span>
                  <span class="ml-auto text-right">
                    <span class="text-[var(--color-accent-2)] line-through opacity-60">{{ formatDisplayValue(c.oldValue) }}</span>
                    <span class="mx-1 text-[var(--color-muted)]">&rarr;</span>
                    <span class="text-[var(--color-accent)]">{{ formatDisplayValue(c.newValue) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Unchanged count -->
            <div
              v-if="summaryStats.unchanged.length > 0"
              class="px-4 py-3"
            >
              <span class="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
                {{ summaryStats.unchanged.length }} key{{ summaryStats.unchanged.length === 1 ? '' : 's' }} unchanged
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk sidebar -->
      <ResultsRiskSidebar :annotations="risks" />
    </div>
  </div>
</template>
