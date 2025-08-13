// @ts-check
import withNuxt from '.nuxt/eslint.config.mjs';

export default withNuxt({
  ignores: [
    '**/coverage',
    '.vscode/**',
  ],
  rules: {
    'vue/no-multiple-template-root': 'off',
  },
});
