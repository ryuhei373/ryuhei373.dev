import * as cheerio from 'cheerio';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'URL parameter is required',
    });
  }

  try {
    const html = await $fetch<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OGPBot/1.0)',
      },
    });

    const $ = cheerio.load(html);

    // OGPタグから情報を取得
    const getOgp = (property: string) => {
      return $(`meta[property="${property}"]`).attr('content') ||
             $(`meta[name="${property}"]`).attr('content') || '';
    };

    const title = getOgp('og:title') || $('title').text() || '';
    const description = getOgp('og:description') ||
                       $('meta[name="description"]').attr('content') || '';
    const image = getOgp('og:image') || '';
    const siteName = getOgp('og:site_name') || '';

    // 相対URLを絶対URLに変換
    const absoluteImage = image && !image.startsWith('http')
      ? new URL(image, url).href
      : image;

    return {
      url,
      title,
      description,
      image: absoluteImage,
      siteName,
    };
  } catch (error) {
    console.error('Failed to fetch OGP data:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch OGP data',
    });
  }
});
