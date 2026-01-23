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
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separate large dependencies if any
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

