import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      // Emulate site usage: consume the built WC bundle directly
      {
        find: '@tinfoilsh/verification-center-ui',
        replacement: resolve(__dirname, '../../dist/wc/tinfoil-wc.es.js'),
      },
    ],
  },
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
  },
})
