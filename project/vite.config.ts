import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),
    
    // Enable gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
    }),
    
    // Enable brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    
    // Bundle analyzer for production builds
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  
  build: {
    // Enable aggressive optimizations
    rollupOptions: {
      output: {
        // Aggressive manual chunk splitting for optimal caching
        manualChunks: (id) => {
          // Critical vendor chunks (loaded first)
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@mui/material') || id.includes('@emotion/')) {
              return 'mui-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            return 'vendor-misc';
          }
          
          // Critical home page components (highest priority)
          if (id.includes('/pages/Home.') || 
              id.includes('/components/landing/HeroSection.') ||
              id.includes('/components/layout/Header.') ||
              id.includes('/components/layout/Sidebar.')) {
            return 'critical';
          }
          
          // Landing page sections (lazy loaded)
          if (id.includes('/components/landing/')) {
            return 'landing';
          }
          
          // Page-specific chunks
          if (id.includes('/pages/Dashboard.')) return 'dashboard';
          if (id.includes('/pages/VideoAnalysis.')) return 'video';
          if (id.includes('/pages/SpeechAnalysis.')) return 'speech';
          if (id.includes('/pages/ChatAnalysis.')) return 'chat';
          if (id.includes('/pages/Analytics.')) return 'analytics';
          
          // Component-specific chunks
          if (id.includes('/components/charts/') || id.includes('/components/analytics/')) return 'charts';
          if (id.includes('/components/dashboard/')) return 'dashboard-components';
          if (id.includes('/components/common/')) return 'common';
          
          // Utility chunks
          if (id.includes('/services/')) return 'services';
          if (id.includes('/hooks/')) return 'hooks';
          if (id.includes('/utils/')) return 'utils';
        },
        
        // Optimize chunk file names for better caching
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `${extType}/[name]-[hash][extname]`;
        },
      },
      
      // External dependencies (load from CDN for better caching)
      external: process.env.NODE_ENV === 'production' ? [] : [],
    },
    
    // Aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple passes for better optimization
      },
      mangle: {
        safari10: true,
      },
    },
    
    // Target modern browsers for smaller bundles
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    
    // Enable tree shaking
    treeshake: {
      preset: 'smallest',
      propertyReadSideEffects: false,
      moduleSideEffects: false,
    },
    
    // Disable source maps for production (smaller builds)
    sourcemap: false,
    
    // Reduce chunk size warning limit
    chunkSizeWarningLimit: 500,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Optimize CSS
    cssMinify: true,
  },
  
  optimizeDeps: {
    // Pre-bundle critical dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      'framer-motion',
      'lucide-react',
    ],
    exclude: [
      '@mui/icons-material', // Completely exclude problematic package
    ],
    force: true,
    // Enable esbuild optimization
    esbuildOptions: {
      target: 'es2020',
    },
  },
  
  // Server configuration for development
  server: {
    fs: {
      cachedChecks: false,
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    // Enable HTTP/2 for better multiplexing
    https: false,
  },
  
  // Preview configuration
  preview: {
    port: 4173,
    host: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
    // Fix MIME type issues
    middlewareMode: false,
    cors: true,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@hooks': '/src/hooks',
      '@types': '/src/types',
    },
  },
  
  // Enable experimental features
  experimental: {
    renderBuiltUrl(filename) {
      return filename;
    },
  },
  
  // CSS optimization
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        charset: false,
      },
    },
  },
});
