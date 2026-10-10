import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Постоянный адрес сохраняет доступ к localStorage между запусками.
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
