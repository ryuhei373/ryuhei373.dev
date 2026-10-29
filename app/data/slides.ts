export interface Slide {
  slug: string;
  title: string;
  event: string;
  date: string;
  url: string;
  pdf: string;
}

export const slides: Slide[] = [
  {
    slug: 'vuefes2026',
    title: '結局Nuxt Layersって何ができて何が嬉しいの？',
    event: 'Vue Fes Japan 2026',
    date: '2026-10-24',
    url: 'https://slides.ryuhei373.dev/vuefes2026/',
    pdf: 'https://slides.ryuhei373.dev/vuefes2026/nuxt-layers-lt.pdf',
  },
];
