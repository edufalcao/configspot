// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({

  modules: ['@nuxtjs/google-fonts', '@nuxtjs/color-mode', '@nuxt/eslint'],
  ssr: false,

  devtools: { enabled: true },

  app: {
    head: {
      title: 'configspot — Config Comparison & Validation Tool',
      meta: [
        { name: 'description', content: 'Compare. Validate. Ship. A developer-focused config comparison and validation tool for .env, JSON, YAML, TOML, and INI files.' },
        { name: 'theme-color', content: '#0d0d0d' },
        // OpenGraph
        { property: 'og:title', content: 'configspot — Config Comparison & Validation Tool' },
        { property: 'og:description', content: 'Compare. Validate. Ship. A developer-focused config comparison and validation tool for .env, JSON, YAML, TOML, and INI files.' },
        { property: 'og:image', content: 'https://configspot.edufalcao.com/og.png' },
        { property: 'og:url', content: 'https://configspot.edufalcao.com' },
        { property: 'og:type', content: 'website' },
        // Twitter/X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'configspot — Config Comparison & Validation Tool' },
        { name: 'twitter:description', content: 'Compare. Validate. Ship. A developer-focused config comparison and validation tool for .env, JSON, YAML, TOML, and INI files.' },
        { name: 'twitter:image', content: 'https://configspot.edufalcao.com/og.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'canonical', href: 'https://configspot.edufalcao.com' }
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            'name': 'configspot',
            'url': 'https://configspot.edufalcao.com',
            'description': 'Compare. Validate. Ship. A developer-focused config comparison and validation tool for .env, JSON, YAML, TOML, and INI files.',
            'applicationCategory': 'DeveloperApplication',
            'operatingSystem': 'Any',
            'offers': {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD'
            },
            'author': {
              '@type': 'Person',
              'name': 'Eduardo Falcão',
              'url': 'https://edufalcao.com'
            }
          })
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark'
  },

  compatibilityDate: '2025-07-15',

  nitro: {
    preset: 'cloudflare-pages',
    modules: ['nitro-cloudflare-dev']
  },

  vite: {
    plugins: [tailwindcss()]
  },

  eslint: {
    config: {
      stylistic: {
        semi: true,
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  googleFonts: {
    families: {
      'Space Grotesk': [400, 500, 600, 700],
      'DM Sans': [400, 500, 600, 700],
      'JetBrains Mono': [400, 500, 600, 700]
    },
    display: 'swap'
  }
});
