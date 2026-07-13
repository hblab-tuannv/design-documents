'use client'
import { i18nProvider } from 'fumadocs-ui/i18n'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import SearchDialog from '@/components/search'
import { translations } from '@/lib/layout.shared'

export function Provider({
  lang,
  children,
}: {
  lang: string
  children: ReactNode
}) {
  const pathname = usePathname()

  return (
    <RootProvider
      i18n={{
        ...i18nProvider(translations, lang),
        // Switch locale with a full page load instead of client-side
        // navigation: changing the [lang] param remounts the root layout,
        // which re-renders next-themes' init <script> on the client and
        // triggers a React 19 warning (next-themes#387). A full load also
        // serves the prerendered HTML of the target locale directly.
        onLocaleChange: (locale) => {
          const segments = pathname.split('/').filter(Boolean)
          if (segments[0] === lang) segments[0] = locale
          else segments.unshift(locale)
          window.location.href = `/${segments.join('/')}`
        },
      }}
      search={{ SearchDialog }}
    >
      {children}
    </RootProvider>
  )
}
