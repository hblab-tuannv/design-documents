import { Inter } from 'next/font/google'
import { Provider } from '@/components/provider'
import { i18n } from '@/lib/i18n'
import '../global.css'

const inter = Inter({
  subsets: ['latin'],
})

export default async function Layout({
  params,
  children,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params

  return (
    <html lang={lang} className={inter.className} suppressHydrationWarning>
      <body className='flex min-h-screen flex-col'>
        <Provider lang={lang}>{children}</Provider>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }))
}
