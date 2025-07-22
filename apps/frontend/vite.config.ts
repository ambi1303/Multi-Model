import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/robots.txt',
          dest: '.'
        }
      ]
    }),
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
      deleteOriginFile: false,
      threshold: 1024,
    }) as any, // Fix for type incompatibility between viteCompression and Vite's PluginOption
  ],

  build: {
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    outDir: 'dist',
    emptyOutDir: true, // Ensure clean builds by emptying output directory
    rollupOptions: {
      output: {
        // Ensure proper cache busting with hash-based file names
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunking for better cache optimization
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['lodash', 'axios'],
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
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
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Default target for core service
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/emo-buddy': {
        target: 'http://localhost:8005', // EmoBuddy service
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/emo-buddy/, ''),
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    }
  },
});
