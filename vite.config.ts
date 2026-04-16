import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: 'localhost',
    open: false
  },
  preview: {
    port: 8080,
    host: 'localhost'
  }
})
