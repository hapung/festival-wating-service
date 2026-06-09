import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from 'vite-plugin-html'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            VITE_KAKAO_JS_KEY: env.VITE_KAKAO_JS_KEY,
          }
        }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Festival Waiting Service',
          short_name: 'FestWait',
          description: 'AI Festival Waiting and Curation Service',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      strictPort: false,  // 5173 사용 중이면 자동으로 다음 포트 사용
      hmr: {
        // 브라우저가 접속한 포트와 WebSocket 포트를 자동으로 맞춤
        clientPort: undefined, // 서버 포트와 동일하게 자동 설정
      },
      proxy: {
        '/api': {
          target: 'http://18.226.75.182:8080',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://18.226.75.182:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
