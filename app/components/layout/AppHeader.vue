<script setup lang="ts">
const colorMode = useColorMode();
const { showHelp } = useKeyboardHelp();

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>

<template>
  <header class="relative z-20 border-b border-[var(--color-border)]">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 font-[var(--font-display)] text-lg font-bold tracking-tight"
      >
        <span class="gradient-text">configspot</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <button
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors duration-[var(--duration)] hover:text-[var(--color-text)]"
          aria-label="Keyboard shortcuts"
          @click="showHelp = !showHelp"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              x="2"
              y="4"
              width="20"
              height="16"
              rx="2"
            />
            <path d="M6 8h.001" />
            <path d="M10 8h.001" />
            <path d="M14 8h.001" />
            <path d="M18 8h.001" />
            <path d="M6 12h.001" />
            <path d="M18 12h.001" />
            <path d="M8 16h8" />
          </svg>
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors duration-[var(--duration)] hover:text-[var(--color-text)]"
          aria-label="Toggle theme"
          @click="toggleTheme"
        >
          <svg
            v-if="colorMode.value === 'dark'"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="4"
            />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
