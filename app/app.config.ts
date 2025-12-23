export default defineAppConfig({
  ui: {
    icons: {
      light: 'i-ph-sun-bold',
      dark: 'i-ph-moon-bold',
    },
    container: {
      base: 'w-full max-w-(--ui-container) mx-auto px-6 md:px-0 lg:px-0 py-8',
    },
    prose: {
      a: {
        base: 'text-primary hover:text-secondary underline hover:underline border-none hover:border-none',
      },
    },
    page: {
      slots: {
        root: 'mt-8',
      },
    },
    pageHeader: {
      slots: {
        root: 'border-b-0 py-0',
      },
    },
  },
});
