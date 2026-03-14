<script setup lang="ts">
defineProps<{
  elevated?: boolean
}>();
</script>

<template>
  <div
    :class="[
      'rounded-xl border border-[var(--color-border)]',
      elevated ? 'bg-[var(--color-elevated)]' : 'bg-[var(--color-surface)]'
    ]"
  >
    <slot />
  </div>
</template>
