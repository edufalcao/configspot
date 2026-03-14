<script setup lang="ts">
import type { DiffResult } from '~/types/diff';
import type { RiskAnnotation } from '~/types/risk';

defineProps<{
  result: DiffResult,
  risks: RiskAnnotation[],
  maskSecrets: boolean,
  shareUrl: string | null,
  isSharing: boolean,
  copied: boolean
}>();

const emit = defineEmits<{
  share: [],
  copyUrl: []
}>();

const activeTab = ref<'semantic' | 'raw' | 'summary'>('semantic');
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Summary bar -->
    <ResultsSummaryBar
      :stats="result.stats"
      :format="result.format"
      :risk-count="risks.length"
    />

    <!-- Tab controls + share -->
    <div class="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      <button
        v-for="tab in (['semantic', 'raw', 'summary'] as const)"
        :key="tab"
        :class="[
          'rounded-md px-3 py-1.5 font-[var(--font-mono)] text-xs font-medium transition-colors',
          activeTab === tab
            ? 'bg-[var(--color-elevated)] text-[var(--color-text)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        ]"
        @click="activeTab = tab"
      >
        {{ tab === 'semantic' ? 'Semantic' : tab === 'raw' ? 'Raw Diff' : 'Summary' }}
      </button>

      <div class="ml-auto flex items-center gap-2 px-1">
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

        <!-- Summary -->
        <div
          v-else
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <pre class="whitespace-pre-wrap p-4 font-[var(--font-mono)] text-sm text-[var(--color-text)]">{{ result.rawDiff ? 'See the semantic or raw diff tabs for detailed changes.' : 'No differences found.' }}</pre>
        </div>
      </div>

      <!-- Risk sidebar -->
      <ResultsRiskSidebar :annotations="risks" />
    </div>
  </div>
</template>
