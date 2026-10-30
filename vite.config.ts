import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import designTokens from './design-tokens.plugin.ts'
import { createManifest } from './scripts/extension-manifest.ts'
import { defaultLanguage, translate } from './src/features/language/i18n.ts'
import { appName, appSlug } from './src/app-info.ts'

export default defineConfig(({ mode }) => {
  const target = mode === 'firefox' ? 'firefox' : 'chromium'
  return {
    plugins: [
      {
        name: `${appSlug}-metadata`,
        transformIndexHtml(html) {
          const values: Record<string, string> = {
            appName,
            language: defaultLanguage,
            appTitle: translate(defaultLanguage, 'appTitle'),
            settingsPageTitle: translate(defaultLanguage, 'settingsPageTitle'),
          }
          return html.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) =>
            Object.hasOwn(values, key)
              ? values[key].replace(/[&<>"']/g, (character) => {
                  const entities: Record<string, string> = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;',
                  }
                  return entities[character]
                })
              : placeholder,
          )
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'licenses/webextension-polyfill-LICENSE.txt',
            source: readFileSync(
              new URL(
                './node_modules/webextension-polyfill/LICENSE',
                import.meta.url,
              ),
              'utf8',
            ),
          })
          this.emitFile({
            type: 'asset',
            fileName: 'LICENSE',
            source: readFileSync(new URL('./LICENSE', import.meta.url), 'utf8'),
          })
          this.emitFile({
            type: 'asset',
            fileName: 'manifest.json',
            source: JSON.stringify(createManifest(target), null, 2) + '\n',
          })
        },
      },
      designTokens(),
      react(),
    ],
    base: './',
    build: {
      outDir: `dist/${target}`,
      rollupOptions: {
        input: {
          app: 'index.html',
          settings: 'settings.html',
          background: 'src/background.ts',
        },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === 'background'
              ? 'background.js'
              : 'assets/[name]-[hash].js',
        },
      },
    },
  }
})
