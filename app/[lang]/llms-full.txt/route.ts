import { i18n } from '@/lib/i18n'
import { getLLMText, source } from '@/lib/source'

export const revalidate = false

export async function GET(
  _req: Request,
  { params }: RouteContext<'/[lang]/llms-full.txt'>,
) {
  const { lang } = await params
  const scan = source.getPages(lang).map(getLLMText)
  const scanned = await Promise.all(scan)

  return new Response(scanned.join('\n\n'), {
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
