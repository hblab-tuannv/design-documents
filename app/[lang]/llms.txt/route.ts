import { llms } from 'fumadocs-core/source'
import { i18n } from '@/lib/i18n'
import { source } from '@/lib/source'

export const revalidate = false

export async function GET(
  _req: Request,
  { params }: RouteContext<'/[lang]/llms.txt'>,
) {
  const { lang } = await params

  return new Response(llms(source).index(lang), {
    headers: {
      // charset is required: without it browsers assume windows-1252 and
      // garble multibyte content (Japanese/Vietnamese)
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }))
}
