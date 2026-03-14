<script setup lang="ts">
import type { RiskAnnotation } from '~/types/risk';

defineProps<{
  annotations: RiskAnnotation[]
}>();

function severityColor(severity: string): string {
  switch (severity) {
    case 'high': return 'var(--color-risk-high)';
    case 'review': return 'var(--color-risk-review)';
    default: return 'var(--color-risk-info)';
  }
}
</script>

<template>
  <div
    v-if="annotations.length > 0"
    class="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
  >
    <h3 class="mb-3 font-[var(--font-display)] text-sm font-semibold text-[var(--color-text)]">
      Risk Summary
    </h3>
    <div class="flex flex-col gap-2">
      <div
        v-for="(annotation, i) in annotations"
        :key="i"
        class="flex items-start gap-2 rounded-lg bg-[var(--color-bg)] px-3 py-2"
      >
        <span
          class="mt-0.5 h-2 w-2 shrink-0 rounded-full"
          :style="{ backgroundColor: severityColor(annotation.severity) }"
        />
        <div class="min-w-0 flex-1 flex flex-col gap-0.5">
          <span class="break-all font-[var(--font-mono)] text-xs font-medium text-[var(--color-text)]">
            {{ annotation.change.path }}
          </span>
          <span class="break-words font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
            {{ annotation.label }}
          </span>
        </div>
        <UiBaseBadge
          :variant="annotation.severity === 'high' ? 'danger' : annotation.severity === 'review' ? 'warning' : 'default'"
          class="ml-auto shrink-0"
        >
          {{ annotation.severity }}
        </UiBaseBadge>
      </div>
    </div>
  </div>
</template>
