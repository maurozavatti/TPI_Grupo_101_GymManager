import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      /* Durante el desarrollo local, el frontend y el backend usan
       puertos diferentes. Este proxy reenvia las peticiones que
       empiezan con /api al backend ubicado en localhost:3000.
       Asi el frontend puede usar rutas como fetch('/api/salud')
       sin escribir la direccion completa del backend.*/
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})