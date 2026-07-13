import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ImgHTMLAttributes } from 'react'
import { DataTable } from '@/components/data-table'

const DefaultImg = defaultMdxComponents.img

// When remark-image cannot resolve dimensions (unreachable external URL),
// next/image would crash on the missing `width` prop — fall back to <img>
function Img(props: ImgHTMLAttributes<HTMLImageElement>) {
  if (!DefaultImg || !props.width || !props.height) {
    // biome-ignore lint/performance/noImgElement: intentional fallback for unsized images
    // biome-ignore lint/a11y/useAltText: alt comes from the markdown source
    return <img loading='lazy' {...props} />
  }

  return <DefaultImg {...props} />
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    img: Img,
    table: DataTable,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
