import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: [
      'lokijs',
      'pino-pretty',
      '@wagmi/connectors/walletConnect'
    ],
    include: [
      'buffer',
      'process',
      '@rainbow-me/rainbowkit',
      'wagmi',
      'viem'
    ]
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      }
    }
  }
})
