export const tagDisplayNames = {
  ddr: 'DDR',
  cloudflare: 'Cloudflare',
  nuxt: 'Nuxt',
  life: 'Life',
  recap: 'Recap',
} as const;

export type TagSlug = keyof typeof tagDisplayNames;

export const tagSlugs = Object.keys(tagDisplayNames) as [TagSlug, ...TagSlug[]];

export const getTagDisplayName = (slug: string): string => {
  return tagDisplayNames[slug as TagSlug] ?? slug;
};
