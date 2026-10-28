import type { IncomingMessage, ServerResponse } from 'node:http'
import { ObjectId } from 'mongodb'
import { conectarDB } from '../db.ts'
import {
  eliminarCookie,
  nombreCookieSesion,
  obtenerHashToken,
} from '../servicios/autenticacion.ts'
import { responder } from '../compartidos/http.ts'

/* Estos son los roles admitidos por la aplicacion.*/
export type RolUsuario = 'ADMIN' | 'ENTRENADOR' | 'USUARIO'

/* Estos son los datos publicos de una cuenta autenticada.
 No se incluyen contraseñas, hashes ni tokens.*/
export interface UsuarioSesion {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolUsuario
  clienteId: string | null
}

/* Esta funcion busca la cookie de sesion en la peticion.
 Solo acepta el formato de token que genera el backend.*/
function obtenerTokenSesion(
  solicitud: IncomingMessage,
): string | null {
  const prefijo = `${nombreCookieSesion}=`

  const cookie = solicitud.headers.cookie
    ?.split(';')
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(prefijo))

  if (!cookie) {
    return null
  }

  const token = cookie.slice(prefijo.length)

  return /^[a-f0-9]{64}$/.test(token) ? token : null
}

/* Esta funcion identifica al usuario de la peticion.
 Devuelve null cuando no existe una sesion valida.
 Los errores de conexion se propagan para que el controlador
 pueda informar que hubo un problema con el servidor.*/
export async function obtenerUsuarioSesion(
  solicitud: IncomingMessage,
  conectar = conectarDB,
): Promise<UsuarioSesion | null> {
  const token = obtenerTokenSesion(solicitud)

  if (!token) {
    return null
  }

  const db = await conectar()

  /* Buscamos el hash del token y comprobamos el vencimiento.
 No dependemos de que el indice TTL ya haya borrado la sesion.*/
  const sesion = await db.collection('sesiones').findOne({
    tokenHash: obtenerHashToken(token),
    fechaVencimiento: { $gt: new Date() },
  })

  if (!sesion || !(sesion.usuarioId instanceof ObjectId)) {
    return null
  }

  /* Consultamos el estado y el rol actuales de la cuenta.
 Si se dio de baja, la sesion deja de permitir el acceso.*/
  const usuario = await db.collection('usuarios').findOne(
    {
      _id: sesion.usuarioId,
      activo: true,
    },
    {
      projection: {
        nombre: 1,
        apellido: 1,
        email: 1,
        rol: 1,
        clienteId: 1,
      },
    },
  )

  if (!usuario) {
    return null
  }

  const rol = usuario.rol

  if (
    rol !== 'ADMIN'
    && rol !== 'ENTRENADOR'
    && rol !== 'USUARIO'
  ) {
    return null
  }

  /* Comprobamos los datos antes de devolverlos.
 La estructura TypeScript no valida por si sola los documentos.*/
  if (
    typeof usuario.nombre !== 'string'
    || typeof usuario.apellido !== 'string'
    || typeof usuario.email !== 'string'
  ) {
    return null
  }

  return {
    id: usuario._id.toHexString(),
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol,
    clienteId: usuario.clienteId instanceof ObjectId
      ? usuario.clienteId.toHexString()
      : null,
  }
}

/* Esta funcion permite consultar la cuenta que tiene una sesion activa.
 Si la sesion no es valida, elimina la cookie del navegador.
 Los errores del servidor se informan sin exponer datos internos.*/
export async function consultarSesion(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  try {
    const usuario = await obtenerUsuarioSesion(solicitud)

    if (!usuario) {
      eliminarCookie(respuesta)

      responder(respuesta, 401, {
        mensaje: 'No hay una sesión iniciada.',
      })
      return
    }

    responder(respuesta, 200, {
      usuario,
    })
  } catch {
    responder(respuesta, 500, {
      mensaje: 'No se pudo consultar la sesión. Intentá nuevamente.',
    })
  }
}