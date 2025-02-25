import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,  // Can hange this if needed (only use during development)
    open: true,   // Help to open browser automatically
  },
  test: {
    environment : 'jsdom',
    setupFiles : ['src/tests/setup.js'],
    include: ['src/tests/**/*.{test,spec}.{js,jsx}'],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**', 
      '**/cypress/**', 
      '**/.{idea,git,cache,output,temp}/**', 
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['html','text','lcov'], 
      reportsDirectory: './coverage', 
    }

  }
});