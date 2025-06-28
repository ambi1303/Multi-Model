import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-core': ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
          'mui-icons': ['@mui/icons-material'],
          'charts': ['recharts'],
          'utils': ['axios', 'lodash'],
          'icons': ['lucide-react']
        }
      }
    },
    minify: 'terser',
    chunkSizeWarningLimit: 1000
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      'lodash',
      'recharts'
    ]
  },
  
  resolve: {
    alias: {
      '@': '/src',
      'lodash': 'lodash'
    }
  }
});
