<script setup lang="ts">
import type { ConfigFormat } from '~/types/config';

const model = defineModel<ConfigFormat | 'auto'>({ default: 'auto' });

const options = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'env', label: '.env' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'toml', label: 'TOML' },
  { value: 'ini', label: 'INI' }
];
</script>

<template>
  <UiBaseSelect
    v-model="model"
    :options="options"
    label="Format"
  />
</template>
