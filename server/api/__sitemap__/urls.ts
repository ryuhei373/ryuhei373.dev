import type { SitemapUrlInput } from '#sitemap/types';

export default defineSitemapEventHandler(async (event) => {
  const articles = await queryCollection(event, 'blog')
    .select('path', 'createdAt', 'tags')
    .all();

  const articleUrls: SitemapUrlInput[] = articles.map(article => ({
    loc: article.path,
    lastmod: article.createdAt,
  }));

  const tags = new Set<string>();
  for (const article of articles) {
    for (const tag of article.tags ?? []) tags.add(tag);
  }

  const archiveUrls: SitemapUrlInput[] = [{ loc: '/archive' }];
  const tagUrls: SitemapUrlInput[] = [...tags].map(tag => ({
    loc: `/tags/${tag}`,
  }));

  return [...articleUrls, ...archiveUrls, ...tagUrls];
});
