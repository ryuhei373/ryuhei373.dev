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
        prefix: 'og: <https://ogp.me/ns#>',
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
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },
});
