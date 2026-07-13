'use client'

import { useTranslations } from '@fuma-translate/react'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import { Bot, Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { copyText } from '@/lib/clipboard'
import { cn } from '@/lib/utils'

const FILES = [
  { file: 'llms.txt', label: 'Index' },
  { file: 'llms-full.txt', label: 'Full docs' },
] as const

function CopyLinkButton({
  lang,
  file,
  label,
}: {
  lang: string
  file: string
  label: string
}) {
  const t = useTranslations({ note: 'ai links' })
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number>(undefined)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  async function onClick() {
    window.clearTimeout(timeoutRef.current)
    try {
      const url = new URL(`/${lang}/${file}`, window.location.origin)
      await copyText(Promise.resolve(url.toString()))
      setCopied(true)
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('[CopyLinkButton]', error)
    }
  }

  return (
    <button
      type='button'
      onClick={onClick}
      title={t('Copy URL')}
      className={cn(
        buttonVariants({ color: 'secondary', size: 'sm' }),
        'flex-1 gap-1.5 bg-fd-secondary/50 font-normal text-fd-muted-foreground',
        '[&_svg]:size-3.5',
      )}
    >
      {copied ? <Check className='text-fd-primary' /> : <Copy />}
      {t(label)}
    </button>
  )
}

/**
 * Copyable links to the per-language `llms.txt` / `llms-full.txt` exports,
 * so users can paste them into an AI chat as context. Rendered as the docs
 * sidebar banner, right below the search box.
 */
export function AiLinks({ lang }: { lang: string }) {
  const t = useTranslations({ note: 'ai links' })

  return (
    <div className='flex flex-col gap-1.5'>
      <p className='inline-flex items-center gap-1.5 font-medium text-fd-muted-foreground text-xs'>
        <Bot className='size-3.5' />
        {t('Docs for AI')}
      </p>
      <div className='flex gap-1.5'>
        {FILES.map(({ file, label }) => (
          <CopyLinkButton key={file} lang={lang} file={file} label={label} />
        ))}
      </div>
    </div>
  )
}
