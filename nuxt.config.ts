// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@/assets/css/main.css'],
  modules: ['@pinia/nuxt'],
  app: {
    head: {
      title: 'Telegram Sticker Maker',
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#2196F3' }
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
      include: ['@vue/devtools-core', '@vue/devtools-kit'],
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core']
    }
  }
})
