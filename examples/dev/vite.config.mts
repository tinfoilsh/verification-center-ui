import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tinfoilsh/verification-center-ui': resolve(
        __dirname,
        '../../dist/esm/index.js',
      ),
    },
  },
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
  },
})
