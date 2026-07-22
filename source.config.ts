import { remarkMdxMermaid, remarkSteps } from 'fumadocs-core/mdx-plugins'
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
})

export default defineConfig({
  mdxOptions: {
    // Turn ```mermaid codeblocks into <Mermaid chart='...'/> at compile time
    // remarkSteps turns <Steps>/<Step> markdown into numbered step markers
    remarkPlugins: [remarkMdxMermaid, remarkSteps],
    remarkImageOptions: {
      // Keep unreachable external images as plain <img> instead of
      // failing the whole MDX compilation (default onError is 'error')
      onError: (error) => console.warn('[remark-image]', error.message),
    },
  },
})
