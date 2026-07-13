import { notFound } from 'next/navigation'
import { i18n } from '@/lib/i18n'
import { getLLMText, getPageMarkdownUrl, source } from '@/lib/source'

export const revalidate = false

export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>,
) {
  const { slug } = await params
  if (!slug || slug.length < 2) notFound()

  // slug has the shape [lang, ...slugs, 'content.md']
  const page = source.getPage(slug.slice(1, -1), slug[0])
  if (!page) notFound()

  return new Response(await getLLMText(page), {
    headers: {
      // charset is required: without it browsers assume windows-1252 and
      // garble multibyte content (Japanese/Vietnamese)
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}

export function generateStaticParams() {
  return i18n.languages.flatMap((lang) =>
    source.getPages(lang).map((page) => ({
      slug: getPageMarkdownUrl(page).segments,
    })),
  )
}
