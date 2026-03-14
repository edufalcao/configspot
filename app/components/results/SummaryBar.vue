<script setup lang="ts">
import type { DiffStats } from '~/types/diff';
import type { ConfigFormat } from '~/types/config';

defineProps<{
  stats: DiffStats,
  format: ConfigFormat,
  riskCount: number
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
    <UiBaseBadge variant="accent">
      +{{ stats.added }} added
    </UiBaseBadge>
    <UiBaseBadge variant="danger">
      -{{ stats.removed }} removed
    </UiBaseBadge>
    <UiBaseBadge variant="warning">
      ~{{ stats.changed }} changed
    </UiBaseBadge>
    <UiBaseBadge
      v-if="riskCount > 0"
      variant="danger"
    >
      {{ riskCount }} risky
    </UiBaseBadge>
    <span class="ml-auto font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
      format: {{ format }}
    </span>
  </div>
</template>
