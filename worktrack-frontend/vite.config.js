import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sockjs-client 'global' ko reference karta hai — Vite me define karna zaroori
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      // WebSocket (STOMP/SockJS) → notification-service (8084). ws:true zaroori.
      '/ws': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        ws: true,
      },
      // employee-service (8081) — more specific, must come BEFORE /api
      '/api/employees': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // attendance-service (8082)
      '/api/attendance': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      // leave-service (8083)
      '/api/leaves': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // notification-service (8084)
      '/api/notifications': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      // gamification-service (8086)
      '/api/gamification': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
      // payroll-service (8087)
      '/api/payroll': {
        target: 'http://localhost:8087',
        changeOrigin: true,
      },
      // project-service (8085) — everything else under /api
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
})
