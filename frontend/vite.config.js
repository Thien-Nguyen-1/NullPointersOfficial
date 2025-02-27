import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,  // Can hange this if needed (only use during development)
    open: true,   // Help to open browser automatically
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Your Django server address
        changeOrigin: true,
        secure: false
      }
    }
  },
});