export default defineAppConfig({
  ui: {
    // カスタムカラーテーマの適用（Nuxt UI 公式ルート）。
    // スケール定義は assets/css/initialize.css の @theme、シェード調整は main.css
    colors: {
      primary: 'orange',
      secondary: 'orange',
      neutral: 'flexoki-base',
    },
    icons: {
      light: 'i-ph-sun-bold',
      dark: 'i-ph-moon-bold',
    },
    container: {
      base: 'w-full max-w-(--ui-container) mx-auto px-6 py-8',
    },
    prose: {
      a: {
        base: 'text-primary hover:text-secondary underline hover:underline border-none hover:border-none',
      },
      code: {
        base: 'px-1.5 py-0.5 text-sm font-mono font-medium rounded-md inline-block break-words max-w-full',
      },
    },
    kbd: {
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'outline',
          class: 'ring-0 border border-muted bg-muted text-default',
        },
      ],
    },
    page: {
      slots: {
        root: 'mt-8',
      },
    },
    pageHeader: {
      slots: {
        root: 'border-b-0 py-0',
        title: 'text-[clamp(1.875rem,1.75rem+0.625vw,2.25rem)] sm:text-[clamp(1.875rem,1.75rem+0.625vw,2.25rem)] leading-tight text-pretty font-bold text-highlighted',
      },
    },
  },
});
