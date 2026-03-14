<script setup lang="ts">
const {
  leftContent,
  rightContent,
  selectedFormat,
  maskSecrets,
  result,
  risks,
  error,
  compare,
  loadSample,
  clear
} = useCompare();

const { shareUrl, isSharing, copied, share, copyUrl } = useShare();

function handleShare() {
  if (result.value) {
    share(leftContent.value, rightContent.value, selectedFormat.value);
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <!-- Hero -->
    <section class="mb-10 text-center animate-fade-in">
      <h1 class="mb-3 font-[var(--font-display)] text-4xl font-bold tracking-tight md:text-5xl">
        <span class="gradient-text">Config comparison</span><br>
        <span class="text-[var(--color-text)]">that understands structure</span>
      </h1>
      <p class="mx-auto max-w-xl text-base text-[var(--color-muted)]">
        Compare .env, JSON, YAML, TOML, and INI files with semantic diffs, risk detection, and secret masking. <span class="text-[var(--color-accent)]">Order-independent</span> — <span class="text-[var(--color-accent-2)]">key changes matter</span>, not line positions.
      </p>
      <div class="mt-5 flex items-center justify-center gap-3">
        <UiBaseButton
          variant="primary"
          size="lg"
          @click="loadSample"
        >
          Try it
        </UiBaseButton>
        <UiBaseButton
          v-if="result"
          variant="ghost"
          size="lg"
          @click="clear"
        >
          Clear
        </UiBaseButton>
      </div>
    </section>

    <!-- Compare workspace -->
    <section class="animate-slide-up">
      <CompareWorkspace
        v-model:left="leftContent"
        v-model:right="rightContent"
        v-model:format="selectedFormat"
        @compare="compare"
      />
    </section>

    <!-- Error -->
    <section
      v-if="error"
      class="mt-4"
    >
      <div class="rounded-xl border border-[var(--color-accent-2)]/30 bg-[var(--color-removed-bg)] px-4 py-3">
        <pre class="whitespace-pre-wrap font-[var(--font-mono)] text-sm text-[var(--color-accent-2)]">{{ error }}</pre>
      </div>
    </section>

    <!-- Filters -->
    <section
      v-if="result"
      class="mt-4 flex items-center gap-4"
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

    <!-- Results -->
    <section
      v-if="result"
      class="mt-4 animate-slide-up"
    >
      <ResultsPanel
        :result="result"
        :risks="risks"
        :mask-secrets="maskSecrets"
        :share-url="shareUrl"
        :is-sharing="isSharing"
        :copied="copied"
        @share="handleShare"
        @copy-url="copyUrl"
      />
    </section>
  </div>
</template>
