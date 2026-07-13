import { defineI18n } from 'fumadocs-core/i18n'

// Static export cannot use middleware, so keep hideLocale 'never'
// (the default) — every URL carries a locale prefix: /vi/docs, /ja/docs
export const i18n = defineI18n({
  defaultLanguage: 'vi',
  languages: ['vi', 'ja', 'en'],
  // content lives in per-locale folders: docs/vi/, docs/ja/, docs/en/
  parser: 'dir',
})
