import type { SitemapUrlInput } from '#sitemap/types';

export default defineSitemapEventHandler(async (event) => {
  const articles = await queryCollection(event, 'blog')
    .select('path', 'createdAt', 'tags')
    .all();

  const articleUrls: SitemapUrlInput[] = articles.map(article => ({
    loc: article.path,
    lastmod: article.createdAt,
  }));

  const years = new Set<number>();
  const tags = new Set<string>();
  for (const article of articles) {
    if (article.createdAt) years.add(new Date(article.createdAt).getFullYear());
    for (const tag of article.tags ?? []) tags.add(tag);
  }

  const archiveUrls: SitemapUrlInput[] = [...years].map(year => ({
    loc: `/archive/${year}`,
  }));
  const tagUrls: SitemapUrlInput[] = [...tags].map(tag => ({
    loc: `/tags/${tag}`,
  }));

  return [...articleUrls, ...archiveUrls, ...tagUrls];
});
