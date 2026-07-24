'use client'

import { useTranslations } from '@fuma-translate/react'
import { Expand, Maximize2, Minus, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/cn'

interface RenderResult {
  svg: string
  // Attaches event handlers for interactive directives (e.g. `click`)
  bindFunctions?: (element: Element) => void
}

interface Transform {
  scale: number
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

const MIN_SCALE = 0.2
const MAX_SCALE = 12
const ZOOM_STEP = 1.3
// Default view fills the viewport width (minus a hair of breathing room)
const FIT_PADDING = 0.98

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function Mermaid({ chart }: { chart: string }) {
  const id = useId()
  const svgRef = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<RenderResult | null>(null)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const t = useTranslations({ note: 'mermaid' })

  useEffect(() => {
    let cancelled = false

    async function render() {
      const { default: mermaid } = await import('mermaid')

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeCSS: 'margin: 0;',
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

  // Bind interactive directives after the SVG is committed. Skipped while the
  // dialog is open, because the inline SVG is unmounted then (see below) to
  // avoid two copies sharing the same element ids.
  useEffect(() => {
    if (!open && result?.bindFunctions && svgRef.current) {
      result.bindFunctions(svgRef.current)
    }
  }, [result, open])

  const openViewer = useCallback(() => setOpen(true), [])
  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }, [])

  // Surface broken diagrams to doc authors instead of failing silently
  if (error) {
    return (
      <pre>
        <code>{chart}</code>
      </pre>
    )
  }

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: intentional — a real button can't wrap the SVG's <a> links */}
      <div
        role='button'
        tabIndex={0}
        aria-label={t('Expand diagram to fullscreen')}
        onClick={openViewer}
        onKeyDown={onKeyDown}
        className='group relative flex w-full cursor-zoom-in justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-fd-ring'
      >
        <div
          ref={svgRef}
          className='w-full [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-none'
          // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG comes from mermaid, not user input
          dangerouslySetInnerHTML={{ __html: open ? '' : (result?.svg ?? '') }}
        />
        <span className='pointer-events-none absolute top-2 right-2 flex items-center gap-1.5 rounded-md border bg-fd-card/90 px-2 py-1 text-fd-muted-foreground text-xs opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100'>
          <Expand className='size-3.5' />
          {t('Expand')}
        </span>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-label={t('Diagram viewer')}
          className='top-0 left-0 h-svh max-h-none w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-fd-background p-0 ring-0 sm:max-w-none'
        >
          <DialogTitle className='sr-only'>{t('Diagram viewer')}</DialogTitle>
          {open && result?.svg && (
            <MermaidCanvas
              svg={result.svg}
              bindFunctions={result.bindFunctions}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function MermaidCanvas({
  svg,
  bindFunctions,
}: {
  svg: string
  bindFunctions?: (element: Element) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size | null>(null)
  const [transform, setTransform] = useState<Transform | null>(null)
  const [panning, setPanning] = useState(false)
  const t = useTranslations({ note: 'mermaid' })

  // Latest natural size / transform, read by handlers that must stay stable
  const sizeRef = useRef<Size | null>(null)
  const transformRef = useRef<Transform | null>(null)
  const panRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current
    const dims = sizeRef.current
    if (!viewport || !dims) return
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    // Fill the width; only shrink further if the diagram would overflow height
    const widthScale = (vw * FIT_PADDING) / dims.width
    const heightScale = vh / dims.height
    const scale = clampScale(Math.min(widthScale, heightScale))
    setTransform({
      scale,
      x: (vw - dims.width * scale) / 2,
      y: (vh - dims.height * scale) / 2,
    })
  }, [])

  // Read the diagram's natural size from the SVG viewBox (unaffected by the
  // dialog's entrance transform), bind interactive directives, and default to
  // a full-screen fit
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const svgEl = viewport?.querySelector('svg')
    const box = svgEl?.viewBox.baseVal
    const natural: Size =
      box && box.width > 0
        ? { width: box.width, height: box.height }
        : { width: svgEl?.clientWidth || 1, height: svgEl?.clientHeight || 1 }
    sizeRef.current = natural
    setSize(natural)
    if (viewport && bindFunctions) bindFunctions(viewport)
    fitToScreen()
  }, [fitToScreen, bindFunctions])

  // Keep the fit correct when the window/viewport changes size
  useEffect(() => {
    window.addEventListener('resize', fitToScreen)
    return () => window.removeEventListener('resize', fitToScreen)
  }, [fitToScreen])

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const viewport = viewportRef.current
      setTransform((prev) => {
        if (!prev) return prev
        const scale = clampScale(prev.scale * factor)
        const ratio = scale / prev.scale
        if (!viewport || clientX === undefined || clientY === undefined) {
          return { ...prev, scale }
        }
        const rect = viewport.getBoundingClientRect()
        const px = clientX - rect.left
        const py = clientY - rect.top
        return {
          scale,
          x: px - (px - prev.x) * ratio,
          y: py - (py - prev.y) * ratio,
        }
      })
    },
    [],
  )

  // Zoom toward the viewport center (used by the pill buttons)
  const zoomFromCenter = useCallback(
    (factor: number) => {
      const rect = viewportRef.current?.getBoundingClientRect()
      if (!rect) return zoomAt(factor)
      zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2)
    },
    [zoomAt],
  )

  // React registers `wheel` as a passive listener, so preventDefault() there is
  // a no-op — attach a native non-passive listener to actually block scroll
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      zoomAt(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, e.clientX, e.clientY)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [zoomAt])

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a')) return
    const current = transformRef.current
    if (!current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: current.x,
      originY: current.y,
    }
    setPanning(true)
  }, [])

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panRef.current
    if (!pan || pan.pointerId !== e.pointerId) return
    setTransform((prev) =>
      prev
        ? {
            ...prev,
            x: pan.originX + (e.clientX - pan.startX),
            y: pan.originY + (e.clientY - pan.startY),
          }
        : prev,
    )
  }, [])

  const endPan = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId === e.pointerId) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      panRef.current = null
      setPanning(false)
    }
  }, [])

  const percent = transform ? Math.round(transform.scale * 100) : 100

  return (
    <>
      {/* Canvas: a stationary dot grid so panning reads as moving over a surface */}
      <div
        ref={viewportRef}
        role='application'
        aria-label={t('Diagram canvas, scroll to zoom, drag to pan')}
        className={cn(
          'h-full w-full touch-none select-none overflow-hidden',
          'bg-[radial-gradient(var(--color-fd-border)_1px,transparent_1px)] bg-size-[22px_22px]',
          panning ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onDoubleClick={fitToScreen}
      >
        <div
          className={cn(
            'origin-top-left [&_svg]:h-full [&_svg]:w-full',
            panning
              ? ''
              : 'transition-transform duration-100 ease-out motion-reduce:transition-none',
          )}
          style={{
            width: size?.width,
            height: size?.height,
            transform: transform
              ? `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
              : 'none',
            opacity: transform ? 1 : 0,
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG comes from mermaid, not user input
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Floating control pill */}
      <div className='absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-fd-card/80 p-1 shadow-lg backdrop-blur'>
        <PillButton
          label={t('Zoom out')}
          onClick={() => zoomFromCenter(1 / ZOOM_STEP)}
        >
          <Minus className='size-4' />
        </PillButton>
        <span className='w-14 text-center font-medium text-fd-foreground text-sm tabular-nums'>
          {percent}%
        </span>
        <PillButton
          label={t('Zoom in')}
          onClick={() => zoomFromCenter(ZOOM_STEP)}
        >
          <Plus className='size-4' />
        </PillButton>
        <div className='mx-0.5 h-5 w-px bg-fd-border' />
        <PillButton label={t('Fit to screen')} onClick={fitToScreen}>
          <Maximize2 className='size-4' />
        </PillButton>
      </div>
    </>
  )
}

function PillButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      onClick={onClick}
      className='inline-flex size-8 items-center justify-center rounded-full text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground'
    >
      {children}
    </button>
  )
}
