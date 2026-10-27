import { defineConfig } from 'vite'
import { readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/* Obtenemos la ubicacion de la carpeta frontend a partir de este
 archivo. Asi las rutas no dependen de la carpeta desde la que
 se ejecuten los comandos.*/
const carpetaFrontend = dirname(fileURLToPath(import.meta.url))

/* Buscamos los archivos HTML dentro de una carpeta y sus
 subcarpetas. Esto permite agregar paginas dentro de src
 sin tener que escribir cada ruta manualmente.*/
function buscarPaginas(carpeta: string): string[] {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = resolve(carpeta, entrada.name)

    if (entrada.isDirectory()) {
      return buscarPaginas(ruta)
    }

    if (entrada.isFile() && entrada.name.endsWith('.html')) {
      return [ruta]
    }

    return []
  })
}

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

  build: {
    rolldownOptions: {
      /* Al compilar, incluimos index.html y todos los HTML
       encontrados dentro de src. Las paginas se detectan
       nuevamente cada vez que ejecutamos npm run build.*/
      input: [
        resolve(carpetaFrontend, 'index.html'),
        ...buscarPaginas(resolve(carpetaFrontend, 'src')),
      ],
    },
  },
})