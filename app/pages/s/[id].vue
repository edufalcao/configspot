<script setup lang="ts">
import type { ConfigFormat } from '~/types/config';
import { parseConfig } from '~/utils/parsers';
import { compareConfigs } from '~/utils/diff';
import { classifyRisks } from '~/utils/risk';
import type { DiffResult } from '~/types/diff';
import type { RiskAnnotation } from '~/types/risk';

const route = useRoute();
const id = route.params.id as string;

const result = ref<DiffResult | null>(null);
const risks = ref<RiskAnnotation[]>([]);
const maskSecrets = ref(true);
const loadError = ref<string | null>(null);
const format = ref<ConfigFormat>('env');

const { shareUrl, isSharing, copied, copyUrl } = useShare();
shareUrl.value = window.location.href;

const activeTab = ref<'semantic' | 'raw' | 'summary'>('semantic');

try {
  const data = await $fetch<{
    left_content: string,
    right_content: string,
    format: string,
    view_count: number
  }>(`/api/share/${id}`);

  const fmt = (data.format === 'auto' ? undefined : data.format) as ConfigFormat | undefined;
  const left = parseConfig(data.left_content, fmt);
  const right = parseConfig(data.right_content, fmt);

  format.value = left.format;
  const diffResult = compareConfigs(left, right);
  result.value = diffResult;
  risks.value = classifyRisks(diffResult.changes);
} catch {
  loadError.value = 'Comparison not found or has expired.';
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div
      v-if="loadError"
      class="py-20 text-center"
    >
      <h1 class="mb-3 font-[var(--font-display)] text-2xl font-bold text-[var(--color-text)]">
        Not Found
      </h1>
      <p class="text-[var(--color-muted)]">
        {{ loadError }}
      </p>
      <NuxtLink
        to="/"
        class="mt-4 inline-block font-[var(--font-mono)] text-sm text-[var(--color-accent)] hover:brightness-110"
      >
        Go to configspot
      </NuxtLink>
    </div>

    <template v-else-if="result">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="font-[var(--font-display)] text-xl font-bold text-[var(--color-text)]">
          Shared comparison
        </h1>
        <NuxtLink
          to="/"
          class="font-[var(--font-mono)] text-sm text-[var(--color-accent)] hover:brightness-110"
        >
          New comparison
        </NuxtLink>
      </div>

      <section
        class="mb-4 flex items-center gap-4"
      >
        <label class="flex items-center gap-2 font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
          <input
            v-model="maskSecrets"
            type="checkbox"
            class="accent-[var(--color-accent)]"
          >
          Mask secrets
        </label>
      </section>

      <ResultsPanel
        v-model:active-tab="activeTab"
        :result="result"
        :risks="risks"
        :mask-secrets="maskSecrets"
        :share-url="shareUrl"
        :is-sharing="isSharing"
        :copied="copied"
        @copy-url="copyUrl"
      />
    </template>
  </div>
</template>
