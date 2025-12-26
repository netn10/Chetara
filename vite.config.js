import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import removeConsole from 'vite-plugin-remove-console'

export default defineConfig({
  plugins: [
    react(),
    // Remove console logs in production builds only
    removeConsole({
      external: ['error', 'warn'], // Keep console.error and console.warn
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    // Ensure client-side routing works on refresh
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
  },
})
