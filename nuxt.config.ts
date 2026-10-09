// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  buildDir: process.env.NUXT_BUILD_DIR || '.nuxt',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: [
    '@fontsource/press-start-2p/400.css',
    '@fontsource/noto-sans-sc/400.css',
    '@fontsource/ma-shan-zheng/400.css',
    '~/assets/main.css',
  ],
  ssr: false,
  ignore: ['**/playwright-report/**', '**/test-results/**', '**/docs/validation/**'],
  server: {
    builder:
      process.env.NUXT_SERVER_BUILDER ?? (process.env.NODE_ENV === 'production' ? 'nitro' : 'vite'),
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: '结印修炼场 · 火影忍术',
      meta: [
        {
          name: 'description',
          content: '十二结印，三卷忍术。用摄像头练习火影结印，召唤你的伙伴。',
        },
        { name: 'theme-color', content: '#eadbb9' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
