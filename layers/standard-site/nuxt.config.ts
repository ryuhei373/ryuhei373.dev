// standard.site（AT Protocol 上の長文コンテンツ用 Lexicon）対応 Layer
// 詳細は README.md を参照
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      standardSite: {
        // 例: did:plc:xxxx。空のときは AT-URI を出さない（link タグ・well-known は出さず、manifest の uri は null）
        did: '',
        publicationRkey: 'self',
        // Nuxt Content のコレクション名 → 記事 URL の prefix
        collections: {
          blog: { prefix: '/blog' },
        } as Record<string, { prefix: string }>,
      },
    },
  },

  hooks: {
    'nitro:config'(nitroConfig) {
      nitroConfig.prerender ??= {};
      nitroConfig.prerender.routes ??= [];
      nitroConfig.prerender.routes.push('/standard-site/documents.json');

      // did 未設定時の well-known は 404 を返すため、prerender に含めると generate が失敗する。
      // prerender 時と同じく環境変数 NUXT_PUBLIC_STANDARD_SITE_DID による上書きも考慮して判定する
      const envDid = process.env.NUXT_PUBLIC_STANDARD_SITE_DID;
      const did = envDid ?? nitroConfig.runtimeConfig?.public?.standardSite?.did;
      if (did) {
        nitroConfig.prerender.routes.push('/.well-known/site.standard.publication');
      }
    },
  },
});
