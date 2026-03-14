<template>
  <div class="min-h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
    <!-- Radial gradient background -->
    <div class="radial-bg" />

    <!-- Noise overlay -->
    <div class="noise-overlay">
      <svg xmlns="http://www.w3.org/2000/svg">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".9"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter="url(#noise)"
        />
      </svg>
    </div>

    <!-- App shell -->
    <LayoutAppHeader />
    <main class="relative z-10 flex-1">
      <NuxtPage />
    </main>
    <LayoutAppFooter />
  </div>
</template>
