import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to the backend container
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy WebSocket connections
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
      },
    },
    // Required for the container to be accessible from the host
    host: '0.0.0.0',
    port: 5173,
  },
  optimizeDeps: {
    include: [
      'ol/Map',
      'ol/View',
      'ol/layer/Tile',
      'ol/layer/Vector',
      'ol/source/OSM',
      'ol/source/Vector',
      'ol/format/GeoJSON',
      'ol/proj',
      'ol/style',
      'ol/style/Style',
      'ol/style/Circle',
      'ol/style/Fill',
      'ol/style/Stroke',
      'ol/geom/Point',
      'ol/ol.css',
    ],
  },
});