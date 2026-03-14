<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost',
  size?: 'sm' | 'md' | 'lg',
  disabled?: boolean
}>();
</script>

<template>
  <button
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-lg font-[var(--font-mono)] font-medium transition-all duration-[var(--duration)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50',
      {
        'bg-[var(--color-accent)] text-[var(--color-bg)] hover:brightness-110 glow-hover': variant === 'primary' || !variant,
        'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-elevated)]': variant === 'secondary',
        'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]': variant === 'ghost'
      },
      {
        'h-7 px-2.5 text-xs': size === 'sm',
        'h-9 px-4 text-sm': size === 'md' || !size,
        'h-11 px-6 text-base': size === 'lg'
      }
    ]"
  >
    <slot />
  </button>
</template>
