import { i18n } from '@/lib/i18n'

// Static export does not support server redirects — render a meta refresh
// (React 19 hoists <meta> tags into <head>) with a fallback link
export default function RootPage() {
  const url = `/${i18n.defaultLanguage}`

  return (
    <>
      <meta httpEquiv='refresh' content={`0;url=${url}`} />
      <p style={{ padding: '1rem' }}>
        <a href={url}>Đang chuyển hướng đến {url}…</a>
      </p>
    </>
  )
}
