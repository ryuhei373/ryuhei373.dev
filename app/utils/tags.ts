export const tagDisplayNames: Record<string, string> = {
  ddr: 'DDR',
  sake: '日本酒',
  nuxt: 'Nuxt',
  dev: '開発',
  life: '暮らし',
  recap: '振り返り',
};

export const getTagDisplayName = (slug: string): string => {
  return tagDisplayNames[slug] ?? slug;
};
