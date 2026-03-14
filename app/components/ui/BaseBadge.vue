<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'accent' | 'danger' | 'warning'
}>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-md px-2 py-0.5 font-[var(--font-mono)] text-xs font-medium',
      {
        'bg-[var(--color-elevated)] text-[var(--color-muted)]': variant === 'default' || !variant,
        'bg-[var(--color-accent)]/10 text-[var(--color-accent)]': variant === 'accent',
        'bg-[var(--color-accent-2)]/10 text-[var(--color-accent-2)]': variant === 'danger',
        'bg-[var(--color-risk-review)]/10 text-[var(--color-risk-review)]': variant === 'warning'
      }
    ]"
  >
    <slot />
  </span>
</template>
