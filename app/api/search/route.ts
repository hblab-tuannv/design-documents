import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

export const revalidate = false

export const { staticGET: GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  // Orama has no stemmer for vi/ja — use the default (english) tokenizer.
  // For better Japanese search, add @orama/tokenizers.
  localeMap: {
    vi: { language: 'english' },
    ja: { language: 'english' },
    en: { language: 'english' },
  },
})
