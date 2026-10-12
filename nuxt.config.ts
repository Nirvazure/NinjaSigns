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
  modules: ['@nuxtjs/supabase'],
  alias: { cookie: 'cookie-es' },
  nitro: { alias: { cookie: 'cookie-es' } },
  supabase: {
    redirect: false,
    cookiePrefix: 'naruto-spiritism-auth',
    clientOptions: { db: { schema: 'naruto_spiritism' } },
    types: '~/types/database.types.ts',
  },
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
          content: '从十二基础印开始，用摄像头练习火影忍术，记录修炼进度并召唤你的伙伴。',
        },
        { name: 'theme-color', content: '#eadbb9' },
      ],
      // Keep public icon URLs intact when Vite processes the initial HTML.
      link: (
        [
          { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=scroll' },
          { rel: 'icon', type: 'image/svg+xml', sizes: 'any', href: '/favicon.svg?v=scroll' },
          { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
          { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
          { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
          { rel: 'manifest', href: '/site.webmanifest' },
        ] as const
      ).map((link) => ({ ...link, 'vite-ignore': '' })),
    },
  },
})
