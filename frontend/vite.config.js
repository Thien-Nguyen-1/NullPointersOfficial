import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  test : {
    coverage: {
      provider: "v8",  
      reporter: ["text", "html"],  // Use "text" and "html" reports
      reportsDirectory: "./tests/coverage",  // coverage folder location
    },
    globals: true, 
    setupFiles: "./tests/setupTests.js", 
    environment: "jsdom",
  },
});
