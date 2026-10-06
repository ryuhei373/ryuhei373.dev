// standard.site（AT Protocol 上の長文コンテンツ用 Lexicon）対応 Layer
// 詳細は README.md を参照
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      standardSite: {
        // did と publicationRkey のどちらかが空のときは AT-URI を出さない
        // （link タグ・well-known は出さず、manifest の uri は null）
        // 例: did:plc:xxxx
        did: '',
        // publication レコードの rkey（TID）。作り方は README.md を参照
        publicationRkey: '',
        // マニフェストに含める Nuxt Content のコレクション名
        collections: ['blog'] as string[],
        // publication レコードの icon に使う画像。サイトからの絶対パス（例: /icon.png）か絶対 URL。
        // 空のときはサイトの favicon（/favicon.ico）を使う
        publicationIcon: '',
      },
    },
  },

  hooks: {
    'nitro:config'(nitroConfig) {
      nitroConfig.prerender ??= {};
      nitroConfig.prerender.routes ??= [];
      nitroConfig.prerender.routes.push('/standard-site/documents.json');

      // 未設定時の well-known は 404 を返すため、prerender に含めると generate が失敗する。
      // prerender 時と同じく環境変数による上書きも考慮して判定する
      const config = nitroConfig.runtimeConfig?.public?.standardSite;
      const did = process.env.NUXT_PUBLIC_STANDARD_SITE_DID ?? config?.did;
      const publicationRkey = process.env.NUXT_PUBLIC_STANDARD_SITE_PUBLICATION_RKEY ?? config?.publicationRkey;
      if (did && publicationRkey) {
        nitroConfig.prerender.routes.push('/.well-known/site.standard.publication');
      }
    },
  },
});
