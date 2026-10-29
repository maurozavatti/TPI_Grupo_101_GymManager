import { createHash, randomBytes } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import type { Db, ObjectId } from 'mongodb'

/* Estos valores identifican la cookie y definen
 una duracion inicial de ocho horas para la sesion.*/
export const nombreCookieSesion = 'gymmanager_sesion'

const duracionSesionSegundos = 8 * 60 * 60

/* Esta funcion genera el hash del token de sesion.
 En la base se guarda el hash y no el token original.*/
export function obtenerHashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/* Esta funcion prepara una nueva sesion para un usuario.
 Devuelve el token que recibira el navegador y el documento
 que despues se guardara en la coleccion sesiones.*/
export function nuevaSesion(usuarioId: ObjectId) {
  const token = randomBytes(32).toString('hex')
  const fechaCreacion = new Date()

  const documento = {
    usuarioId,
    tokenHash: obtenerHashToken(token),
    fechaCreacion,
    fechaVencimiento: new Date(
      fechaCreacion.getTime() + duracionSesionSegundos * 1000,
    ),
  }

  return { token, documento }
}

/* Estos indices evitan tokens duplicados y permiten que
 MongoDB elimine automaticamente las sesiones vencidas.*/
export async function prepararSesiones(db: Db): Promise<void> {
  await db.collection('sesiones').createIndex(
    { tokenHash: 1 },
    { unique: true },
  )

  await db.collection('sesiones').createIndex(
    { fechaVencimiento: 1 },
    { expireAfterSeconds: 0 },
  )
}

/* Esta funcion prepara los atributos de la cookie.
 HttpOnly impide leerla desde JavaScript y Secure exige
 HTTPS cuando el backend se ejecuta en produccion.*/
function crearCookie(token: string, duracion: number): string {
  const atributos = [
    `${nombreCookieSesion}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${duracion}`,
  ]

  if (process.env.NODE_ENV === 'production') {
    atributos.push('Secure')
  }

  return atributos.join('; ')
}

/* Esta funcion envia la cookie al navegador.
 Se utiliza despues de guardar correctamente la sesion.*/
export function enviarCookie(
  respuesta: ServerResponse,
  token: string,
): void {
  respuesta.setHeader(
    'Set-Cookie',
    crearCookie(token, duracionSesionSegundos),
  )
}

/* Esta funcion indica al navegador que elimine la cookie.
 El cierre de sesion tambien debe eliminar su registro
 de la base de datos.*/
export function eliminarCookie(respuesta: ServerResponse): void {
  respuesta.setHeader(
    'Set-Cookie',
    crearCookie('', 0),
  )
}