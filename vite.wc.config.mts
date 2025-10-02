import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Build the Web Component as a fully self-contained bundle
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/wc',
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/wc/register.tsx', import.meta.url)),
      name: 'TinfoilVerificationCenter',
      fileName: () => 'tinfoil-wc.es.js',
      formats: ['es'],
    },
    cssCodeSplit: false,
    rollupOptions: {
      // Bundle everything, including React and deps, for isolation
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
    sourcemap: true,
    target: 'es2019',
    minify: 'esbuild',
  },
})
