import { defineCollection, defineContentConfig, z } from '@nuxt/content';
import { tagSlugs } from './app/utils/tags';

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      // Load every file inside the `content` directory
      source: 'blog/*.md',
      // Specify the type of content in this collection
      type: 'page',
      schema: z.object({
        createdAt: z.string(),
        tags: z.array(z.enum(tagSlugs)).optional(),
      }),
    }),
  },
});
