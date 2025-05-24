import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import { resolve, dirname } from 'node:path'
// @ts-ignore
import { fileURLToPath } from 'node:url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


export default defineConfig({
  plugins: [react()],

  // Build configuration
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AudioStreams',
      fileName: 'audio-streams',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    sourcemap: true,
    minify: 'esbuild'
  },

  // Development server
  server: {
    port: 3000,
    host: true,
    headers: {
      // Required for Web Workers and SharedArrayBuffer
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },

  // Worker configuration
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'workers/[name].js'
      }
    }
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  // CSS handling
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },

  // Optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  },
})
