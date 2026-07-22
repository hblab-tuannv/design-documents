import { ImageZoom } from 'fumadocs-ui/components/image-zoom'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ImgHTMLAttributes } from 'react'
import { DataTable } from '@/components/data-table'
import { Mermaid } from '@/components/mdx/mermaid'

// Local images are statically imported by remark-image, so `src` is a
// StaticImageData object with dimensions baked in (no top-level width/height).
// Only a string `src` with no width/height means remark-image couldn't fetch
// an external URL's dimensions — next/image would crash there, so fall back
// to a plain <img>.
function Img(props: ImgHTMLAttributes<HTMLImageElement>) {
  if (typeof props.src === 'string' && !props.width && !props.height) {
    // biome-ignore lint/performance/noImgElement: intentional fallback for unsized images
    // biome-ignore lint/a11y/useAltText: alt comes from the markdown source
    return <img loading='lazy' {...props} />
  }

  // biome-ignore lint/suspicious/noExplicitAny: local images pass a StaticImageData object as `src`, wider than ImgHTMLAttributes' `string` typing
  return <ImageZoom {...(props as any)} />
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    img: Img,
    table: DataTable,
    Mermaid,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
