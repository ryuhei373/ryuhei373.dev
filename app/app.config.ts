export default defineAppConfig({
  ui: {
    container: {
      base: 'w-full max-w-(--ui-container) mx-auto px-6 md:px-0 lg:px-0 py-8',
    },
    prose: {
      a: {
        base: 'underline hover:underline border-none hover:border-none',
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
