// standard.site の publication 検証用エンドポイント
// publication レコードの AT-URI を text/plain で返す
export default defineEventHandler((event) => {
  const { did, publicationRkey } = useRuntimeConfig(event).public.standardSite;
  if (!did) {
    throw createError({ statusCode: 404, statusMessage: 'standard.site publication is not configured' });
  }

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return publicationUri(did, publicationRkey);
});
