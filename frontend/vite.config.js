import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// Custom logger to filter Fast Refresh warnings
const logger = createLogger()
const originalWarn = logger.warn
logger.warn = (msg, options) => {
  // Filter out Fast Refresh warnings (they're harmless)
  if (msg.includes('Fast Refresh') || msg.includes('incompatible')) {
    return
  }
  originalWarn(msg, options)
}

export default defineConfig({
  plugins: [
    react({
      // Fast Refresh is enabled by default
      // Warnings about incompatible exports are harmless
    }),
    // Bundle analyzer (run: npm run build -- --mode analyze)
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 5173,
    hmr: {
      // Prevent connection loss issues
      overlay: true,
      clientPort: 5173,
    },
    watch: {
      // Reduce file watching overhead
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form'],
          'dnd-vendor': ['@hello-pangea/dnd'],
          'socket-vendor': ['socket.io-client'],
          // Feature chunks
          'auth': [
            './src/pages/auth/Login',
            './src/pages/auth/Register',
            './src/pages/auth/ForgotPassword',
            './src/pages/auth/ResetPassword',
          ],
          'projects': [
            './src/pages/projects/ProjectsList',
            './src/pages/projects/ProjectDetail',
          ],
          'sprints': [
            './src/pages/sprints/SprintsList',
            './src/pages/sprints/SprintDetail',
            './src/pages/sprints/SprintPlanning',
          ],
        },
        // Optimize chunk file names
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'zustand',
    ],
    exclude: ['react-window'], // Exclude from pre-bundling if needed
  },
  customLogger: logger,
})

