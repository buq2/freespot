import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/freespot/' : '/',
  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],
          
          // Material-UI core components
          'vendor-mui-core': [
            '@mui/material',
            '@emotion/react',
            '@emotion/styled'
          ],
          
          // Material-UI icons (separate due to size)
          'vendor-mui-icons': ['@mui/icons-material'],
          
          // Material-UI date pickers
          'vendor-mui-pickers': ['@mui/x-date-pickers'],
          
          // Map and geolocation libraries
          'vendor-maps': [
            'leaflet',
            'react-leaflet',
            'geolib'
          ],
          
          // Utility libraries
          'vendor-utils': [
            'date-fns',
            'axios',
            'localforage'
          ]
        }
      }
    }
  }
})
