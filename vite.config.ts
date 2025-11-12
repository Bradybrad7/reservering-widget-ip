import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Library build for embedding (npm run build:lib)
  if (mode === 'lib') {
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'ReservationWidget',
          formats: ['es', 'umd'],
          fileName: (format) => `reservation-widget.${format}.js`
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM'
            }
          }
        }
      },
      css: {
        postcss: './postcss.config.js',
      }
    }
  }
  
  // Default: Multi-page app build for Firebase Hosting
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false, // Disable sourcemaps for production
      chunkSizeWarningLimit: 1000, // Increase limit to 1000kb
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
        },
        output: {
          // Manual chunk splitting for better caching
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // React & Core
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              // Firebase
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              // UI Libraries
              if (id.includes('lucide-react') || id.includes('recharts')) {
                return 'vendor-ui';
              }
              // Export libraries
              if (id.includes('jspdf') || id.includes('xlsx')) {
                return 'vendor-export';
              }
              // Forms
              if (id.includes('react-hook-form') || id.includes('hookform') || id.includes('zod')) {
                return 'vendor-forms';
              }
              // Date utilities
              if (id.includes('date-fns')) {
                return 'vendor-date';
              }
              // State management
              if (id.includes('zustand')) {
                return 'vendor-state';
              }
              // Other vendors
              return 'vendor-other';
            }
          },
        },
      },
      // Note: Minify is enabled by default in production
    },
    css: {
      postcss: './postcss.config.js',
    },
    // ✨ Define environment mode for better optimization
    define: {
      'import.meta.env.PROD': mode === 'production',
      'import.meta.env.DEV': mode === 'development',
    }
  }
})
