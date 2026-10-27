import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// Ubicacion del frontend compilado, tanto desde src como desde dist.
const carpetaWeb = fileURLToPath(
  new URL('../../../frontend/dist/', import.meta.url),
)

// Indicamos al navegador que tipo de archivo esta recibiendo.
const tipos: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

export async function servirWeb(
  peticion: IncomingMessage,
  respuesta: ServerResponse,
) {
  // Los archivos de la web se consultan mediante GET o HEAD.
  if (peticion.method !== 'GET' && peticion.method !== 'HEAD') {
    respuesta.writeHead(405, { Allow: 'GET, HEAD' })
    respuesta.end()
    return
  }

  try {
    const ruta = decodeURIComponent(
      new URL(peticion.url ?? '/', 'http://localhost').pathname,
    )

    // Al entrar a la raiz, entregamos index.html.
    const archivo = resolve(
      carpetaWeb,
      ruta === '/' ? 'index.html' : '.' + ruta,
    )

    const tipo = tipos[extname(archivo)]

    // Permitimos solamente archivos dentro del frontend compilado
    // y con alguna de las extensiones indicadas arriba.
    if (!archivo.startsWith(resolve(carpetaWeb) + sep) || !tipo) {
      respuesta.writeHead(404)
      respuesta.end('Archivo no encontrado')
      return
    }

    const contenido = await readFile(archivo)

    respuesta.writeHead(200, {
      'Content-Type': tipo,
      'X-Content-Type-Options': 'nosniff',
    })

    respuesta.end(
      peticion.method === 'HEAD' ? undefined : contenido,
    )
  } catch {
    respuesta.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    })
    respuesta.end('Archivo no encontrado')
  }
}