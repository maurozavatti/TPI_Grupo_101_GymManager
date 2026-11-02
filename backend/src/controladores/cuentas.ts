import type { IncomingMessage, ServerResponse } from 'node:http'
import { MongoServerError, ObjectId } from 'mongodb'
import { conectarDB } from '../db.ts'
import { ErrorHTTP, leerJSON, responder, texto } from '../compartidos/http.ts'
import { exigirRol } from '../servicios/permisos.ts'
import type { RolUsuario } from './sesion.ts'
import { crearHashContrasena } from '../servicios/contrasenas.ts'

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

/* Esta funcion crea una cuenta con el rol elegido por ADMIN.
 No inicia una sesion nueva ni crea una ficha de cliente. */
async function crearCuenta(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  const datos = await leerJSON(solicitud, 16384)

  const nombre = texto(datos, 'nombre', 100, true)
  const apellido = texto(datos, 'apellido', 100, true)
  const email = texto(datos, 'email', 254, true).toLowerCase()
  const rol = datos.rol

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ErrorHTTP(
      400,
      'Ingresá un correo electrónico válido.',
      ['email'],
    )
  }

  if (rol !== 'ADMIN' && rol !== 'ENTRENADOR' && rol !== 'USUARIO') {
    throw new ErrorHTTP(
      400,
      'Seleccioná un rol válido.',
      ['rol'],
    )
  }

  if (typeof datos.contrasena !== 'string') {
    throw new ErrorHTTP(
      400,
      'Completá la contraseña.',
      ['contrasena'],
    )
  }

  /* Reutilizamos las mismas reglas y generacion del hash
   que se utilizan en el registro y cambio de contraseña. */
  let passwordHash: string

  try {
    passwordHash = await crearHashContrasena(datos.contrasena)
  } catch (error) {
    if (error instanceof RangeError) {
      throw new ErrorHTTP(400, error.message, ['contrasena'])
    }

    throw error
  }

  const db = await conectarDB()

  /* El indice impide duplicar correos incluso si dos
   solicitudes intentan crear la misma cuenta a la vez. */
  await db.collection('usuarios').createIndex(
    { email: 1 },
    { unique: true },
  )

  const ahora = new Date()

  /* clienteId se incorpora al vincular una ficha existente.
   Lo omitimos para respetar su indice unico sparse. */
  await db.collection('usuarios').insertOne({
    nombre,
    apellido,
    email,
    passwordHash,
    rol,
    activo: true,
    fechaCreacion: ahora,
    fechaModificacion: ahora,
  })

  responder(respuesta, 201, {
    mensaje: 'Cuenta creada correctamente.',
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

    if (solicitud.method === 'POST' && ruta === '/api/cuentas') {
      await crearCuenta(solicitud, respuesta)
      return
    }

    throw new ErrorHTTP(404, 'Ruta no encontrada.')
  } catch (error) {
    if (
      error instanceof MongoServerError
      && error.code === 11000
      && error.keyPattern?.email
    ) {
      responder(respuesta, 409, {
        mensaje: 'El correo ya está registrado.',
        campos: ['email'],
      })
      return
    }
    if (error instanceof ErrorHTTP) {
      responder(respuesta, error.estado, {
        mensaje: error.message,
        campos: error.campos,
      })
      return
    }

    responder(respuesta, 500, {
      mensaje: 'No se pudo completar la operación de cuentas. Intentá nuevamente.',
    })
  }
}