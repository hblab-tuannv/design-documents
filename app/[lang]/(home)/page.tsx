import Link from 'next/link'

const content = {
  vi: {
    title: 'Xin chào',
    before: 'Bạn có thể mở ',
    after: ' để xem tài liệu.',
  },
  ja: {
    title: 'こんにちは',
    before: '',
    after: ' を開いてドキュメントをご覧ください。',
  },
  en: {
    title: 'Hello World',
    before: 'You can open ',
    after: ' and see the documentation.',
  },
} as const

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  const t = content[lang as keyof typeof content] ?? content.vi

  return (
    <div className='flex flex-1 flex-col justify-center text-center'>
      <h1 className='mb-4 font-bold text-2xl'>{t.title}</h1>
      <p>
        {t.before}
        <Link href={`/${lang}/docs`} className='font-medium underline'>
          /docs
        </Link>
        {t.after}
      </p>
    </div>
  )
}
