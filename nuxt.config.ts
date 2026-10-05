// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxtjs/seo',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: 'ja',
        prefix: 'og: https://ogp.me/ns#',
      },
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://ryuhei373.dev',
    name: 'ryuhei373.dev',
    description:
      '猫2匹と暮らしているWebアプリケーション開発者。HTMLとCSSが好き。',
    defaultLocale: 'ja',
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: '',
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-light',
            light: 'github-light',
            dark: 'github-dark',
          },
        },
      },
    },
    renderer: {
      anchorLinks: {
        h2: false,
        h3: false,
        h4: false,
      },
    },
  },

  runtimeConfig: {
    public: {
      standardSite: {
        // standard.site（layers/standard-site）のレコードを置く AT Protocol アカウントの DID（例: did:plc:xxxx）
        // 空のときは AT-URI を出さない。環境変数 NUXT_PUBLIC_STANDARD_SITE_DID でも上書きできる
        did: 'did:plc:7mspdpm2los5e37xitulwsxd',
        // publication レコードの rkey（2026-10-05T15:00:00Z から作った TID）
        publicationRkey: '3mx56lh5j2222',
      },
    },
  },

  routeRules: {
    '/rss.xml': {
      headers: { 'content-type': 'application/rss+xml; charset=UTF-8' },
    },
  },

  compatibilityDate: '2024-09-03',

  nitro: {
    prerender: {
      routes: ['/rss.xml'],
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@unhead/schema-org/vue',
      ],
    },
  },

  eslint: {
    config: {
      stylistic: {
        semi: true,
      },
    },
  },

  icon: {
    clientBundle: {
      scan: true,
    },
  },

  image: {
    provider: 'cloudflare',
    cloudflare: {
      baseURL: 'https://images.ryuhei373.dev',
    },
    domains: ['images.ryuhei373.dev'],
  },

  ogImage: {
    zeroRuntime: true,
  },

  seo: {
    fallbackTitle: false,
    // prerender 時の inline style minify が body 内の Shiki 生成 <style> まで
    // 書き換え、payload 由来のクライアント再描画と不一致になるため無効化
    // （コードハイライトを含む記事ページで hydration mismatch が発生する）
    minify: { build: false },
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },
});
