import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // izinkan akses via tunnel cloudflare (ganti subdomain tiap restart)
    allowedHosts: [".trycloudflare.com"],
  },
})
