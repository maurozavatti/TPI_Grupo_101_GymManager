import type { IncomingMessage, ServerResponse } from 'node:http'
import { ObjectId } from 'mongodb'
import { conectarDB } from '../db.ts'
import { ErrorHTTP, responder } from '../compartidos/http.ts'
import { exigirRol } from '../servicios/permisos.ts'
import type { RolUsuario } from './sesion.ts'

/* Estos son los campos que utilizamos para listar las cuentas.
 No incluimos la contraseña ni su hash. */
interface CuentaListado {
  _id: ObjectId
  nombre: string
  apellido: string
  email: string
  rol: RolUsuario
  activo: boolean
  clienteId?: ObjectId | null
}

/* Esta funcion consulta las cuentas activas e inactivas.
 La proyeccion limita los datos que se leen de la base. */
async function listarCuentas(respuesta: ServerResponse): Promise<void> {
  const db = await conectarDB()

  const cuentas = await db.collection<CuentaListado>('usuarios')
    .find(
      {},
      {
        projection: {
          _id: 1,
          nombre: 1,
          apellido: 1,
          email: 1,
          rol: 1,
          activo: 1,
          clienteId: 1,
        },
      },
    )
    .sort({ apellido: 1, nombre: 1, email: 1 })
    .toArray()

  /* Convertimos los identificadores para enviarlos como texto.
   Una cuenta puede existir sin una ficha de cliente vinculada. */
  responder(respuesta, 200, {
    cuentas: cuentas.map((cuenta) => ({
      id: cuenta._id.toHexString(),
      nombre: cuenta.nombre,
      apellido: cuenta.apellido,
      email: cuenta.email,
      rol: cuenta.rol,
      activo: cuenta.activo,
      clienteId: cuenta.clienteId instanceof ObjectId
        ? cuenta.clienteId.toHexString()
        : null,
    })),
  })
}

/* Todas las operaciones administrativas de cuentas pasan
 por este controlador y requieren una sesion de ADMIN. */
export async function gestionarCuentas(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  try {
    await exigirRol(solicitud, ['ADMIN'])

    const ruta = new URL(
      solicitud.url ?? '/',
      'http://localhost',
    ).pathname

    if (solicitud.method === 'GET' && ruta === '/api/cuentas') {
      await listarCuentas(respuesta)
      return
    }

    throw new ErrorHTTP(404, 'Ruta no encontrada.')
  } catch (error) {
    if (error instanceof ErrorHTTP) {
      responder(respuesta, error.estado, {
        mensaje: error.message,
        campos: error.campos,
      })
      return
    }

    responder(respuesta, 500, {
      mensaje: 'No se pudieron consultar las cuentas. Intentá nuevamente.',
    })
  }
}