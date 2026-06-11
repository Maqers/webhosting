import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Use esbuild minification (built-in, no extra dependencies needed)
    minify: 'esbuild',
    // esbuild minification options
    minifySyntax: true,
    minifyIdentifiers: true,
    minifyWhitespace: true,
    
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          if (id.includes('/src/data/catalog')) {
            return 'catalog-data';
          }
          if (id.includes('/src/data/searchIndex')) {
            return 'search-index';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Enable source maps for production debugging (optional - disable for smaller builds)
    sourcemap: false,
    
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
  },
  
  // Server optimizations for dev
  server: {
    port: parseInt(process.env.PORT) || 5173,
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  
  // Preview server optimizations
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
})

