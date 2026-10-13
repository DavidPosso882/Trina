import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // En compose el proxy apunta al servicio `api`; en host, al localhost.
    proxy: {
      '/api': process.env.VITE_API_PROXY ?? 'http://localhost:8080',
      '/media': process.env.VITE_MEDIA_PROXY ?? 'http://localhost:9000'
    }
  },
  build: {
    // Code-splitting por ruta: el mapa solo se carga donde se usa (RNF-02, §8 diseño UI).
    // manualChunks como función para que React quede en el chunk principal y no se duplique
    // en el chunk del mapa.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'mapa';
          }
          if (id.includes('node_modules/recharts')) {
            return 'graficos';
          }
          return undefined;
        }
      }
    }
  }
});
