'use client'

import { useTheme } from 'next-themes'
import { useEffect, useId, useRef, useState } from 'react'

interface RenderResult {
  svg: string
  // Attaches event handlers for interactive directives (e.g. `click`)
  bindFunctions?: (element: Element) => void
}

export function Mermaid({ chart }: { chart: string }) {
  const id = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<RenderResult | null>(null)
  const [error, setError] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    let cancelled = false

    async function render() {
      const { default: mermaid } = await import('mermaid')

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeCSS: 'margin: 1.5rem auto 0;',
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      })

      try {
        const rendered = await mermaid.render(
          // mermaid injects the id into a CSS selector — ':' from useId is invalid there
          id.replaceAll(':', ''),
          chart.replaceAll('\\n', '\n'),
        )
        if (!cancelled) {
          setError(false)
          setResult(rendered)
        }
      } catch (e) {
        console.error('[mermaid]', e)
        if (!cancelled) setError(true)
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [chart, id, resolvedTheme])

  // Runs after React commits the SVG to the DOM — bindFunctions queries
  // the rendered nodes, so it must not run inside the render effect above
  useEffect(() => {
    if (result?.bindFunctions && containerRef.current) {
      result.bindFunctions(containerRef.current)
    }
  }, [result])

  // Surface broken diagrams to doc authors instead of failing silently
  if (error) {
    return (
      <pre>
        <code>{chart}</code>
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG comes from mermaid, not user input
      dangerouslySetInnerHTML={{ __html: result?.svg ?? '' }}
    />
  )
}
