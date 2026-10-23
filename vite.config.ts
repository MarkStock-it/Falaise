import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

const here = process.cwd()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        store: resolve(here, 'index.html'),
        admin: resolve(here, 'admin.html'),
        adminLogin: resolve(here, 'admin-login.html'),
      },
    },
  },
})
