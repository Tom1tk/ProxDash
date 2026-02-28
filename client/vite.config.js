import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png}']
      }
    })
  ],
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/terminal': { target: 'ws://localhost:3001', ws: true }
    }
  }
})
