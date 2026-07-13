'use client'

import { useTranslations } from '@fuma-translate/react'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import { Check, Copy } from 'lucide-react'
import { type ComponentProps, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const cache = new Map<string, Promise<string>>()

function fetchMarkdown(url: string) {
  const cached = cache.get(url)
  if (cached) return cached

  const promise = fetch(url).then((res) => {
    if (!res.ok) throw new Error(`failed to fetch ${url}: ${res.status}`)
    return res.text()
  })
  // don't cache failures, otherwise retries can never succeed
  promise.catch(() => cache.delete(url))
  cache.set(url, promise)
  return promise
}

async function copyText(pending: Promise<string>) {
  // Safari revokes the user activation after a long await — hand the
  // pending promise to ClipboardItem instead of awaiting it first
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.write([
      new ClipboardItem({ 'text/plain': pending }),
    ])
  }

  // the Clipboard API only exists in secure contexts (HTTPS/localhost);
  // on plain-HTTP origins (LAN dev server) fall back to execCommand
  const textarea = document.createElement('textarea')
  textarea.value = await pending
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  try {
    if (!document.execCommand('copy')) throw new Error('execCommand failed')
  } finally {
    textarea.remove()
  }
}

/**
 * Drop-in replacement for fumadocs-ui's `MarkdownCopyButton`: same look and
 * translations, but copying also works outside secure contexts and fetch
 * errors no longer surface as unhandled promise rejections.
 */
export function MarkdownCopyButton({
  markdownUrl,
  ...props
}: ComponentProps<'button'> & { markdownUrl: string }) {
  const t = useTranslations({ note: 'page actions' })
  const [state, setState] = useState<'idle' | 'loading' | 'copied'>('idle')
  const timeoutRef = useRef<number>(undefined)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  async function onClick() {
    window.clearTimeout(timeoutRef.current)
    setState('loading')
    try {
      await copyText(fetchMarkdown(markdownUrl))
      setState('copied')
      timeoutRef.current = window.setTimeout(() => setState('idle'), 1500)
    } catch (error) {
      console.error('[MarkdownCopyButton]', error)
      setState('idle')
    }
  }

  return (
    <button
      type='button'
      disabled={state === 'loading'}
      onClick={onClick}
      {...props}
      className={cn(
        buttonVariants({
          color: 'secondary',
          size: 'sm',
          className: 'gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground',
        }),
        props.className,
      )}
    >
      {state === 'copied' ? <Check /> : <Copy />}
      {props.children ?? t('Copy Markdown')}
    </button>
  )
}
