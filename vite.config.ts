import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import designTokens from './design-tokens.plugin.ts'
import manifest from './manifest.template.json' with { type: 'json' }
import {
  appName,
  appLongName,
  appSlug,
  appVersion,
  extensionId,
} from './src/app-info.ts'

export default defineConfig({
  plugins: [
    {
      name: `${appSlug}-metadata`,
      transformIndexHtml(html) {
        return html.replaceAll('{{appName}}', appName)
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source:
            JSON.stringify(
              {
                ...manifest,
                name: appLongName,
                version: appVersion,
                action: { ...manifest.action, default_title: appName },
                browser_specific_settings: {
                  ...manifest.browser_specific_settings,
                  gecko: {
                    ...manifest.browser_specific_settings.gecko,
                    id: extensionId,
                  },
                },
              },
              null,
              2,
            ) + '\n',
        })
      },
    },
    designTokens(),
    react(),
  ],
  base: './',
  build: {
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
})
