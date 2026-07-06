const isDev = process.env.NODE_ENV !== 'production'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: isDev },
  css: ['@/assets/css/main.css'],
  modules: ['@pinia/nuxt'],
  app: {
    head: {
      title: 'Telegram Sticker Maker',
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#2196F3' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' }
      ]
    }
  },
  nitro: {
    preset: 'vercel'
  },
  routeRules: {
    '/vendor/ffmpeg/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'same-origin'
      }
    }
  },
  vite: {
    optimizeDeps: {
      include: isDev ? ['@vue/devtools-core', '@vue/devtools-kit'] : [],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core']
    }
  }
})
