import type { ServerResponse } from 'node:http'

/* Esta funcion envia una respuesta JSON con el estado indicado.
 Evita que el navegador guarde respuestas de la API en cache.*/
export function responder(
  respuesta: ServerResponse,
  estado: number,
  datos: unknown,
): void {
  respuesta.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })

  respuesta.end(JSON.stringify(datos))
}