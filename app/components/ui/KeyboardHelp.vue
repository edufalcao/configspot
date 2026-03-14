<script setup lang="ts">
defineProps<{
  visible: boolean
}>();

const emit = defineEmits<{
  close: []
}>();

const shortcuts = [
  { key: 'Ctrl+Enter', description: 'Run comparison' },
  { key: 'f', description: 'Toggle formatting-only filter' },
  { key: 'r', description: 'Toggle risky-only filter' },
  { key: 's', description: 'Toggle secret masking' },
  { key: '1', description: 'Semantic diff tab' },
  { key: '2', description: 'Raw diff tab' },
  { key: '3', description: 'Tree tab' },
  { key: '4', description: 'Summary tab' },
  { key: '?', description: 'Show/hide this help' },
  { key: 'Esc', description: 'Close this overlay' }
];

function handleBackdrop() {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="help-overlay">
      <div
        v-if="visible"
        class="help-backdrop"
        @click.self="handleBackdrop"
      >
        <div class="help-panel">
          <div class="help-header">
            <h2 class="help-title">
              Keyboard shortcuts
            </h2>
            <button
              class="help-close"
              @click="emit('close')"
            >
              &times;
            </button>
          </div>

          <ul class="help-list">
            <li
              v-for="shortcut in shortcuts"
              :key="shortcut.key"
              class="help-row"
            >
              <kbd class="help-kbd">{{ shortcut.key }}</kbd>
              <span class="help-desc">{{ shortcut.description }}</span>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.help-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.help-panel {
  width: 100%;
  max-width: 420px;
  margin: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-surface);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.help-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.help-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-muted);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  transition: color var(--duration) var(--ease),
    background var(--duration) var(--ease);
}

.help-close:hover {
  color: var(--color-text);
  background: var(--color-elevated);
}

.help-list {
  margin: 0;
  padding: 0.75rem 1.25rem 1rem;
  list-style: none;
}

.help-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.4rem 0;
}

.help-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-elevated);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.help-desc {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-muted);
}

/* Transition */
.help-overlay-enter-active,
.help-overlay-leave-active {
  transition: opacity 0.15s var(--ease);
}

.help-overlay-enter-active .help-panel,
.help-overlay-leave-active .help-panel {
  transition: transform 0.15s var(--ease), opacity 0.15s var(--ease);
}

.help-overlay-enter-from,
.help-overlay-leave-to {
  opacity: 0;
}

.help-overlay-enter-from .help-panel {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}

.help-overlay-leave-to .help-panel {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>
