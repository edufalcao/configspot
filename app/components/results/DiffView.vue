<script setup lang="ts">
import type { DiffChange } from '~/types/diff';
import { maskValue, isLikelySecret } from '~/utils/risk';

defineProps<{
  changes: DiffChange[],
  maskSecrets: boolean
}>();

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function shouldMask(path: string, value: unknown): boolean {
  return isLikelySecret(path, String(value ?? ''));
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
    <div class="divide-y divide-[var(--color-border)]">
      <div
        v-for="change in changes"
        :key="change.path"
        :class="[
          'flex items-start gap-3 px-4 py-2 font-[var(--font-mono)] text-sm',
          {
            'bg-[var(--color-added-bg)]': change.type === 'added',
            'bg-[var(--color-removed-bg)]': change.type === 'removed',
            'bg-[var(--color-changed-bg)]': change.type === 'changed'
          }
        ]"
      >
        <!-- Change type indicator -->
        <span
          :class="[
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold',
            {
              'bg-[var(--color-accent)]/20 text-[var(--color-accent)]': change.type === 'added',
              'bg-[var(--color-accent-2)]/20 text-[var(--color-accent-2)]': change.type === 'removed',
              'bg-[var(--color-risk-review)]/20 text-[var(--color-risk-review)]': change.type === 'changed',
              'text-[var(--color-muted)]': change.type === 'unchanged'
            }
          ]"
        >
          {{ change.type === 'added' ? '+' : change.type === 'removed' ? '-' : change.type === 'changed' ? '~' : ' ' }}
        </span>

        <!-- Path -->
        <span class="shrink-0 text-[var(--color-text)]">{{ change.path }}</span>

        <!-- Values -->
        <span
          v-if="change.type === 'changed'"
          class="flex-1 text-right"
        >
          <span class="text-[var(--color-accent-2)] line-through opacity-60">
            {{ maskSecrets && shouldMask(change.path, change.oldValue) ? maskValue(formatValue(change.oldValue)) : formatValue(change.oldValue) }}
          </span>
          <span class="mx-1 text-[var(--color-muted)]">&rarr;</span>
          <span class="text-[var(--color-accent)]">
            {{ maskSecrets && shouldMask(change.path, change.newValue) ? maskValue(formatValue(change.newValue)) : formatValue(change.newValue) }}
          </span>
        </span>
        <span
          v-else-if="change.type === 'added'"
          class="flex-1 text-right text-[var(--color-accent)]"
        >
          {{ maskSecrets && shouldMask(change.path, change.newValue) ? maskValue(formatValue(change.newValue)) : formatValue(change.newValue) }}
        </span>
        <span
          v-else-if="change.type === 'removed'"
          class="flex-1 text-right text-[var(--color-accent-2)]"
        >
          {{ maskSecrets && shouldMask(change.path, change.oldValue) ? maskValue(formatValue(change.oldValue)) : formatValue(change.oldValue) }}
        </span>
        <span
          v-else
          class="flex-1 text-right text-[var(--color-muted)]"
        >
          {{ formatValue(change.newValue ?? change.oldValue) }}
        </span>
      </div>

      <div
        v-if="changes.length === 0"
        class="px-4 py-8 text-center text-sm text-[var(--color-muted)]"
      >
        No differences found.
      </div>
    </div>
  </div>
</template>
