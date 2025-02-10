// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    "@nuxt/ui",
    "@nuxt/content",
    "@nuxt/image",
    '@nuxt/eslint',
  ],

  eslint: {
    config: {
      stylistic: {
        semi: true,
      },
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: "ja",
        prefix: "og: <https://ogp.me/ns#>",
      },
    },
  },

  css: ['~/assets/css/main.css'],

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: "github-light",
            dark: "github-dark",
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
    }
  },

  colorMode: {
    preference: "light",
    fallback: "light",
    classSuffix: "",
  },

  compatibilityDate: "2024-09-03",
});