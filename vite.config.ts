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
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
        }
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
