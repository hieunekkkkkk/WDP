import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['smearch.io.vn', 'localhost'],
    watch: {
      usePolling: true,
    },
    // proxy: {
    //   '/api': {
    //     target: 'http://backend:3000',
    //     changeOrigin: true,
    //     secure: false,
    //     configure: (proxy, options) => {
    //       // Cho phép proxy từ domain
    //       proxy.on('proxyReq', (proxyReq, req, res) => {
    //         proxyReq.setHeader('Origin', 'http://backend:3000');
    //       });
    //     }
    //   }
    // }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  }
})
