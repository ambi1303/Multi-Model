import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import sitemap from 'vite-plugin-sitemap';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://your-domain.com', // TODO: Replace with your actual domain
      dynamicRoutes: [
        '/',
        '/analytics',
        '/chat-analysis',
        '/dashboard',
        '/emobuddy',
        '/enhanced-burnout-survey',
        '/faq',
        '/speech-analysis',
        '/video-analysis',
      ],
    }) as any,
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Emoti-Analyze',
        short_name: 'EmotiAnalyze',
        description: 'Advanced multi-modal emotion analysis platform.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }) as any, // Fix for type incompatibility between VitePWA and Vite's PluginOption
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }) as any, // Fix for type incompatibility between viteCompression and Vite's PluginOption
  ],

  build: {
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    outDir: 'build',
  },

  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@contexts': '/src/contexts',
      '@hooks': '/src/hooks',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@theme': '/src/theme',
      '@utils': '/src/utils',
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
});
