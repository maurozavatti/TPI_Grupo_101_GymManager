import type { IncomingMessage, ServerResponse } from 'node:http'
import { ObjectId } from 'mongodb'
import { conectarDB } from '../db.ts'
import { ErrorHTTP, responder } from '../compartidos/http.ts'
import { incluyeRol } from '../servicios/roles.ts'
import { obtenerUsuarioSesion } from './sesion.ts'

export async function gestionarPerfil(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  try {
    const usuario = await obtenerUsuarioSesion(solicitud)
    if (!usuario) throw new ErrorHTTP(401, 'Iniciá sesión para continuar.')
    if (solicitud.method !== 'GET') throw new ErrorHTTP(405, 'Método no permitido.')
    if (!incluyeRol(usuario.rol, ['USUARIO'])) {
      throw new ErrorHTTP(403, 'Esta consulta está disponible para clientes con cuenta.')
    }

    if (!usuario.clienteId) {
      responder(respuesta, 200, { cliente: null })
      return
    }

    const db = await conectarDB()
    const cliente = await db.collection('clientes').findOne(
      { _id: new ObjectId(usuario.clienteId) },
      {
        projection: {
          nombre: 1,
          apellido: 1,
          dni: 1,
          fechaNacimiento: 1,
          telefono: 1,
          email: 1,
          direccion: 1,
          activo: 1,
        },
      },
    )

    if (!cliente) {
      responder(respuesta, 200, { cliente: null })
      return
    }

    responder(respuesta, 200, {
      cliente: {
        id: cliente._id.toHexString(),
        nombre: cliente.nombre ?? '',
        apellido: cliente.apellido ?? '',
        dni: cliente.dni ?? '',
        fechaNacimiento: cliente.fechaNacimiento ?? null,
        telefono: cliente.telefono ?? '',
        email: cliente.email ?? '',
        direccion: cliente.direccion ?? '',
        activo: cliente.activo === true,
      },
    })
  } catch (error) {
    const estado = error instanceof ErrorHTTP ? error.estado : 500
    const mensaje = error instanceof ErrorHTTP
      ? error.message
      : 'No pudimos cargar tu perfil. Intentá nuevamente.'
    responder(respuesta, estado, { mensaje })
  }
}
