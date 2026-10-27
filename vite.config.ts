import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import designTokens from './design-tokens.plugin.ts'

export default defineConfig({
  plugins: [designTokens(), react()],
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
