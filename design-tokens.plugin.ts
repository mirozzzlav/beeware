import type { Plugin } from 'vite'
import { appSlug } from './src/app-info.ts'
import tokens from './src/tokens.json' with { type: 'json' }

const virtualId = 'virtual:tokens.css'
const resolvedId = '\0' + virtualId

export default function designTokens(): Plugin {
  return {
    name: `${appSlug}-design-tokens`,
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id === resolvedId) {
        return (
          ':root {\n' +
          Object.entries(tokens)
            .map(([name, value]) => `  --${name}: ${value};`)
            .join('\n') +
          '\n}'
        )
      }
    },
    transform(source, id) {
      if (id.split('?')[0].endsWith('.css')) {
        for (const [name, width] of Object.entries(tokens)) {
          if (!name.startsWith('breakpoint-')) continue
          const breakpoint = name.slice('breakpoint-'.length)
          source = source
            .replaceAll(
              `@media (--${breakpoint})`,
              `@media (width >= ${width})`,
            )
            .replaceAll(
              `@media (--max-${breakpoint})`,
              `@media (width < ${width})`,
            )
        }
        return source
      }
    },
  }
}
