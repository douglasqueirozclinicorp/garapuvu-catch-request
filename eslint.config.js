import js from '@eslint/js';
import security from 'eslint-plugin-security';
import html from 'eslint-plugin-html';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'fixtures/**',
      'dist/**',
      'build/**',
    ],
  },
  // JS embutido nos HTML da aplicacao (src/)
  {
    files: ['src/**/*.html'],
    plugins: { html, security },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    rules: {
      ...security.configs.recommended.rules,
    },
  },
  // Testes e demais scripts JS
  {
    files: ['**/*.js'],
    plugins: { security },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...security.configs.recommended.rules,
    },
  },
];
