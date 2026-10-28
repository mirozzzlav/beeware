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
        return source.replaceAll(
          '@media (--compact)',
          `@media (max-width: ${tokens['breakpoint-compact']})`,
        )
      }
    },
  }
}
