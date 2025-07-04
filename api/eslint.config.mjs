import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import json from '@eslint/json'
import css from '@eslint/css'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  { 
    files: ['**/*.{js,mjs,cjs,vue}'], 
    plugins: { js }, 
    extends: ['js/recommended'],
    rules: {
      "no-unused-vars": "warn",
    } 
  },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  pluginVue.configs['flat/essential'],
  { files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },
  {
    files: ['**/*.jsonc'],
    plugins: { json },
    language: 'json/jsonc',
    extends: ['json/recommended'],
  },
  {
    files: ['**/*.json5'],
    plugins: { json },
    language: 'json/json5',
    extends: ['json/recommended'],
  },
  { files: ['**/*.css'], plugins: { css }, language: 'css/css', extends: ['css/recommended'] },
])
