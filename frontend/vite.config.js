import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    gloabls: true,
    environment: "jsdom",
    include: ["tests/**/*.test.jsx"],
    coverage: {
      provider: "v8",
      reporter: ["text","json","html"],
    },
  },
})