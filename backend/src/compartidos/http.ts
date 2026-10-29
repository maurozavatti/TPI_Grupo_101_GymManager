import type { IncomingMessage, ServerResponse } from 'node:http'

/* Esta clase representa un error que podemos informar al frontend.
 Guarda el estado HTTP y los campos que deben marcarse como incorrectos.*/
export class ErrorHTTP extends Error {
  estado: number
  campos: string[]

  constructor(
    estado: number,
    mensaje: string,
    campos: string[] = [],
  ) {
    super(mensaje)
    this.name = 'ErrorHTTP'
    this.estado = estado
    this.campos = campos
  }
}

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

/* Esta funcion lee los datos JSON enviados al backend.
 Comprueba el formato y limita el tamaño del contenido recibido.
 Cada controlador valida despues los campos que necesita.*/
export async function leerJSON(
  solicitud: IncomingMessage,
  limiteBytes = 65536,
): Promise<Record<string, unknown>> {
  const tipoContenido = solicitud.headers['content-type']
    ?.split(';')[0]
    .trim()
    .toLowerCase()

  if (tipoContenido !== 'application/json') {
    throw new ErrorHTTP(415, 'Enviá los datos en formato JSON.')
  }

  let cuerpo = ''
  let demasiadoGrande = false

  solicitud.setEncoding('utf8')

  /* Los datos pueden llegar divididos en varias partes.
 Si superan el limite, dejamos de acumularlos en memoria.*/
  for await (const parte of solicitud) {
    if (demasiadoGrande) {
      continue
    }

    cuerpo += parte

    if (Buffer.byteLength(cuerpo, 'utf8') > limiteBytes) {
      demasiadoGrande = true
      cuerpo = ''
    }
  }

  if (demasiadoGrande) {
    throw new ErrorHTTP(413, 'Los datos enviados son demasiado extensos.')
  }

  let datos: unknown

  try {
    datos = JSON.parse(cuerpo)
  } catch {
    throw new ErrorHTTP(400, 'El formato JSON no es válido.')
  }

  /* Esperamos un objeto con campos.
 No aceptamos listas, valores sueltos ni null.*/
  if (
    datos === null
    || typeof datos !== 'object'
    || Array.isArray(datos)
  ) {
    throw new ErrorHTTP(400, 'Los datos no son válidos.')
  }

  return datos as Record<string, unknown>
}