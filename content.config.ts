import { defineCollection, defineContentConfig, z } from '@nuxt/content';

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      // Load every file inside the `content` directory
      source: 'blog/*.md',
      // Specify the type of content in this collection
      type: 'page',
      schema: z.object({
        createdAt: z.string(),
      }),
    }),
  },
});
