<script setup lang="ts">
defineProps<{
  options: { value: string, label: string }[],
  label?: string
}>();

const model = defineModel<string>();
</script>

<template>
  <label
    v-if="label"
    class="flex flex-col gap-1"
  >
    <span class="font-[var(--font-mono)] text-xs text-[var(--color-muted)]">{{ label }}</span>
    <select
      v-model="model"
      class="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-[var(--font-mono)] text-sm text-[var(--color-text)] outline-none transition-colors duration-[var(--duration)] focus:border-[var(--color-accent)]"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </label>
  <select
    v-else
    v-model="model"
    class="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-[var(--font-mono)] text-sm text-[var(--color-text)] outline-none transition-colors duration-[var(--duration)] focus:border-[var(--color-accent)]"
  >
    <option
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
    >
      {{ opt.label }}
    </option>
  </select>
</template>
