const isDev = process.env.NODE_ENV !== 'production'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: isDev },
  css: ['@/assets/css/main.css'],
  modules: ['@pinia/nuxt'],
  app: {
    // Apply the saved theme + language before first paint to avoid a light
    // flash for dark-mode users and a Chinese-first flash for English users;
    // layouts/default.vue keeps the reactive state in sync.
    head: {
      title: 'Telegram Sticker Maker',
      htmlAttrs: {
        lang: 'zh-CN'
      },
      script: [
        {
          innerHTML: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.setAttribute('data-theme','dark')}else if(t==='light'){document.documentElement.setAttribute('data-theme','light')}var l=localStorage.getItem('locale');if(l==='zh'||l==='en'){document.documentElement.setAttribute('lang',l==='zh'?'zh-CN':'en')}}catch(e){}})();`
        }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon.png' }
      ],
      meta: [
        { name: 'theme-color', content: '#f4f4f1', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0e0e10', media: '(prefers-color-scheme: dark)' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '把图片、GIF 和视频转换为 Telegram 贴纸格式，支持批量处理、历史缓存和 Bot 上传。' },
        { property: 'og:title', content: 'Telegram Sticker Maker' },
        { property: 'og:description', content: '把图片、GIF 和视频转换为 Telegram 贴纸格式，支持批量处理、历史缓存和 Bot 上传。' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/icon.png' },
        { property: 'og:image:width', content: '512' },
        { property: 'og:image:height', content: '512' },
        { property: 'og:locale', content: 'zh_CN' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:image', content: '/icon.png' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  nitro: {
    preset: 'vercel'
  },
  // Nuxt merges `webworker` into the app lib, which loads a second copy of every
  // DOM interface. With both present, browser code (ResizeObserver, CSSRule, …)
  // stops type-checking. This app has no service worker, so keep browser libs only.
  typescript: {
    tsConfig: {
      compilerOptions: {
        lib: ['ESNext', 'DOM', 'DOM.Iterable']
      }
    }
  },
  hooks: {
    'prepare:types'(options) {
      // `typescript.tsConfig` only appends to the generated lib list, so strip
      // the worker libs here before .nuxt/tsconfig.app.json is written.
      for (const config of [options.tsConfig]) {
        const lib = config.compilerOptions?.lib
        if (Array.isArray(lib)) {
          config.compilerOptions!.lib = lib.filter(name => !/webworker/i.test(String(name)))
        }
      }
    }
  },
  routeRules: {
    '/vendor/ffmpeg/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'same-origin'
      }
    },
    // The API only ever accepts JSON/multipart POSTs from this same origin.
    '/api/**': {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
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
