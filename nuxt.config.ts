// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/eslint',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: 'ja',
        prefix: 'og: <https://ogp.me/ns#>',
      },
    },
  },

  css: ['~/assets/css/main.css'],

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

  compatibilityDate: '2024-09-03',

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
});
