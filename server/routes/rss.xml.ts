import { Feed } from 'feed';

const basePath = 'https://ryuhei373.dev';

// export default defineEventHandler(async (event) => {
//   const { slug } = getRouterParams(event);
//   const page = await queryCollection(event, 'blog').path(slug).first();
//   return page;
// });

export default defineEventHandler(async (event) => {
  const docs = await queryCollection(event, 'blog').select('title', 'path', 'description', 'created_at').order('created_at', 'DESC').limit(10).all();
  // console.log(docs);
  // const docs = await serverQueryContent(event, {
  //   only: ['title', 'description', '_path', 'created_at'],
  //   sort: { createdAt: -1 },
  //   limit: 10,
  // }).find();

  const feed = new Feed({
    title: 'ryuhei373.dev',
    description: '猫2匹と暮らしているWebアプリケーション開発者。HTMLとCSSが好き。',
    id: basePath,
    link: basePath,
    language: 'ja',
    favicon: basePath + '/favicon.ico',
    copyright: 'All rights reserved 2025, ryuhei373',
    feedLinks: {
      rss: basePath + '/rss.xml',
    },
    author: {
      name: 'ryuhei373',
      email: 'mail@ryuhei.dev',
      link: basePath,
    },
  });

  docs.forEach((doc) => {
    feed.addItem({
      title: doc.title,
      id: basePath + doc.path,
      link: basePath + doc.path,
      description: doc.description,
      date: new Date(doc.created_at),
    });
  });

  return feed.rss2();
});
