import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  

  plugins: [react()],

  server: {
    // proxy: {
    //   "/api": "http://127.0.0.1:8000",
    // },
    port: 5173,  // Can hange this if needed (only use during development)
    open: true,   // Help to open browser automatically
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Your Django server address MUST CORRESPOND with one defined in .env
        changeOrigin: true,
        secure: false
      }
    }
  },
  test: {
    globals: true, 
    environment : 'jsdom',
    setupFiles : ['src/tests/setup.js'],
    include: ['src/tests/**/*.{test,spec}.{js,jsx}'],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**', 
      '**/cypress/**', 
      '**/.{idea,git,cache,output,temp}/**', 
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['html','text','lcov'], 
      reportsDirectory: './coverage',
      exclude: [
        'src/tests/**/__mocks__/**',
        './*.config.js',
        'html/*',
        'src/tests/*'
      ]
    },
  }
});
