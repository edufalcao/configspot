<script setup lang="ts">
import { EditorView } from '@codemirror/view';
import { Codemirror } from 'vue-codemirror';

defineProps<{
  label: string,
  placeholder?: string
}>();

const model = defineModel<string>({ default: '' });

const extensions = [
  EditorView.lineWrapping
];

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      model.value = reader.result as string;
    };
    reader.readAsText(file);
  }
}

function handleFileUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      model.value = reader.result as string;
    };
    reader.readAsText(file);
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="font-[var(--font-mono)] text-xs font-medium text-[var(--color-muted)]">{{ label }}</span>
      <label class="cursor-pointer font-[var(--font-mono)] text-xs text-[var(--color-accent)] transition-colors hover:brightness-110">
        Upload
        <input
          type="file"
          class="hidden"
          accept=".env,.json,.yaml,.yml,.toml,.ini,.cfg,.conf,.properties"
          @change="handleFileUpload"
        >
      </label>
    </div>
    <div
      class="config-editor flex-1 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors focus-within:border-[var(--color-accent)]"
      @drop="handleDrop"
      @dragover.prevent
    >
      <Codemirror
        v-model="model"
        :placeholder="placeholder || 'Paste config here or drag & drop a file...'"
        :extensions="extensions"
        :style="{ height: '300px' }"
        :tab-size="2"
      />
    </div>
  </div>
</template>

<style scoped>
.config-editor :deep(.cm-editor) {
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  height: 300px;
}

.config-editor :deep(.cm-scroller) {
  overflow: auto;
}

.config-editor :deep(.cm-editor.cm-focused) {
  outline: none;
}

.config-editor :deep(.cm-gutters) {
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.config-editor :deep(.cm-activeLineGutter) {
  background: var(--color-elevated);
}

.config-editor :deep(.cm-activeLine) {
  background: var(--color-elevated);
}

.config-editor :deep(.cm-content) {
  color: var(--color-text);
  caret-color: var(--color-accent);
  padding-top: 0;
  padding-bottom: 0;
}

.config-editor :deep(.cm-cursor) {
  border-left-color: var(--color-accent);
}

.config-editor :deep(.cm-selectionBackground),
.config-editor :deep(.cm-editor.cm-focused .cm-selectionBackground) {
  background: rgba(0, 229, 204, 0.15) !important;
}

.config-editor :deep(.cm-placeholder) {
  color: var(--color-muted);
  opacity: 0.5;
}
</style>
