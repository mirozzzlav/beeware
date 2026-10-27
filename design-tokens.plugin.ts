import type { Plugin } from 'vite'
import tokens from './src/tokens.json' with { type: 'json' }

const virtualId = 'virtual:tokens.css'
const resolvedId = '\0' + virtualId

export default function designTokens(): Plugin {
  return {
    name: 'beeware-design-tokens',
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
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'icon.svg',
        source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="24" fill="${tokens['palette-brand-gold']}"/>
  <path d="M30 22h10v24a17 17 0 1 1-10 15V22zm10 39a7 7 0 1 0 14 0 7 7 0 0 0-14 0z" fill="${tokens['palette-brand-ink']}"/>
  <circle cx="73" cy="73" r="6" fill="${tokens['palette-brand-ink']}"/>
</svg>\n`,
      })
    },
  }
}
