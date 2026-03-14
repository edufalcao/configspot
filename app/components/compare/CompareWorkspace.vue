<script setup lang="ts">
import type { ConfigFormat } from '~/types/config';

const leftContent = defineModel<string>('left', { default: '' });
const rightContent = defineModel<string>('right', { default: '' });

const format = defineModel<ConfigFormat | 'auto'>('format', { default: 'auto' });

const emit = defineEmits<{
  compare: []
}>();

function handleCompare() {
  emit('compare');
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Controls bar -->
    <div class="flex items-end gap-4">
      <CompareFormatSelector v-model="format" />
      <UiBaseButton
        variant="primary"
        size="md"
        @click="handleCompare"
      >
        Compare
      </UiBaseButton>
    </div>

    <!-- Editor panels -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CompareConfigEditor
        v-model="leftContent"
        label="Original"
        placeholder="Paste the original config here..."
        :format="format"
      />
      <CompareConfigEditor
        v-model="rightContent"
        label="Updated"
        placeholder="Paste the updated config here..."
        :format="format"
      />
    </div>
  </div>
</template>
