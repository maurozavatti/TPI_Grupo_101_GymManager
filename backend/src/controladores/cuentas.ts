import type { IncomingMessage, ServerResponse } from 'node:http'
import { MongoServerError, ObjectId } from 'mongodb'
import { conectarDB, ejecutarTransaccion } from '../db.ts'
import {
  ErrorHTTP,
  identificador,
  leerJSON,
  responder,
  texto,
} from '../compartidos/http.ts'
import { exigirRol } from '../servicios/permisos.ts'
import { crearHashContrasena } from '../servicios/contrasenas.ts'
import {
  esRolCuenta,
  incluyeRol,
  obtenerRoles,
} from '../servicios/roles.ts'
import type { RolesCuenta } from '../servicios/roles.ts'

/* Estos son los datos publicos utilizados en el listado.
 El rol acepta el formato anterior y el de multiples valores. */
interface CuentaListado {
  _id: ObjectId
  nombre: string
  apellido: string
  email: string
  rol: RolesCuenta
  activo: boolean
  clienteId?: ObjectId | null
}

/* Consultamos cuentas activas e inactivas sin leer
 contraseñas, hashes ni datos de sus sesiones. */
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

/* Creamos una cuenta sin cambiar la sesion del administrador
 ni generar automaticamente una ficha de cliente. */
async function crearCuenta(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  const datos = await leerJSON(solicitud, 16384)

  const nombre = texto(datos, 'nombre', 100, true)
  const apellido = texto(datos, 'apellido', 100, true)
  const email = texto(datos, 'email', 254, true).toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ErrorHTTP(
      400,
      'Ingresá un correo electrónico válido.',
      ['email'],
    )
  }

  if (!esRolCuenta(datos.rol)) {
    throw new ErrorHTTP(
      400,
      'Seleccioná al menos un rol válido.',
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

  await db.collection('usuarios').createIndex(
    { email: 1 },
    { unique: true },
  )

  const ahora = new Date()

  /* Las cuentas creadas desde administracion guardan sus
   roles como array. Las cuentas anteriores siguen siendo validas. */
  await db.collection('usuarios').insertOne({
    nombre,
    apellido,
    email,
    passwordHash,
    rol: obtenerRoles(datos.rol),
    activo: true,
    fechaCreacion: ahora,
    fechaModificacion: ahora,
  })

  responder(respuesta, 201, {
    mensaje: 'Cuenta creada correctamente.',
  })
}

/* Modificamos solamente los roles y la fecha del cambio.
 La vinculacion con el cliente y los demas datos se conservan. */
async function cambiarRoles(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
  administradorId: string,
): Promise<void> {
  const datos = await leerJSON(solicitud, 16384)
  const cuentaId = identificador(datos.id)

  if (!esRolCuenta(datos.rol)) {
    throw new ErrorHTTP(
      400,
      'Seleccioná al menos un rol válido.',
      ['rol'],
    )
  }

  const roles = obtenerRoles(datos.rol)

  /* El administrador puede agregarse ENTRENADOR, pero no
   quitarse ADMIN desde su propia sesion. */
  if (
    cuentaId.toHexString() === administradorId
    && !incluyeRol(roles, ['ADMIN'])
  ) {
    throw new ErrorHTTP(
      409,
      'No podés quitarte el rol ADMIN desde tu propia cuenta.',
      ['rol'],
    )
  }

  const db = await conectarDB()

  const cambio = await db.collection('usuarios').updateOne(
    { _id: cuentaId },
    {
      $set: {
        rol: roles,
        fechaModificacion: new Date(),
      },
    },
  )

  if (cambio.matchedCount !== 1) {
    throw new ErrorHTTP(404, 'La cuenta no existe.')
  }

  /* Las sesiones consultan los roles actuales de la cuenta
   en cada peticion, por lo que no necesitan copiar estos valores. */
  responder(respuesta, 200, {
    mensaje: 'Roles actualizados correctamente.',
  })
}

/* Cambiamos el estado de la cuenta sin borrar sus datos.
 La ficha de cliente vinculada se administra por separado. */
async function cambiarEstadoCuenta(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
  administradorId: string,
  activo: boolean,
): Promise<void> {
  const datos = await leerJSON(solicitud, 16384)
  const cuentaId = identificador(datos.id)

  /* Evitamos que el administrador cierre su propio acceso
   al desactivar la cuenta que esta utilizando. */
  if (!activo && cuentaId.toHexString() === administradorId) {
    throw new ErrorHTTP(
      409,
      'No podés dar de baja tu propia cuenta desde esta sesión.',
    )
  }

  /* La baja y el cierre de sesiones se aplican juntos.
   Si alguna operacion falla, la transaccion deshace los cambios. */
  await ejecutarTransaccion(async (db, transaccion) => {
    const ahora = new Date()

    const cambio = await db.collection('usuarios').updateOne(
      { _id: cuentaId },
      activo
        ? {
            $set: {
              activo: true,
              fechaModificacion: ahora,
            },
            $unset: {
              fechaBaja: '',
            },
          }
        : {
            $set: {
              activo: false,
              fechaBaja: ahora,
              fechaModificacion: ahora,
            },
          },
      { session: transaccion },
    )

    if (cambio.matchedCount !== 1) {
      throw new ErrorHTTP(404, 'La cuenta no existe.')
    }

    /* Reactivar permite volver a iniciar sesion, pero no
     recupera las sesiones eliminadas durante la baja. */
    if (!activo) {
      await db.collection('sesiones').deleteMany(
        { usuarioId: cuentaId },
        { session: transaccion },
      )
    }
  })

  responder(respuesta, 200, {
    mensaje: activo
      ? 'Cuenta reactivada correctamente.'
      : 'Cuenta dada de baja correctamente.',
  })
}

/* Todas las operaciones de este controlador requieren ADMIN,
 tanto si ese rol esta guardado como texto como dentro de un array. */
export async function gestionarCuentas(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  try {
    const administrador = await exigirRol(solicitud, ['ADMIN'])

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

    if (solicitud.method === 'POST' && ruta === '/api/cuentas/roles') {
      await cambiarRoles(solicitud, respuesta, administrador.id)
      return
    }

    if (solicitud.method === 'POST' && ruta === '/api/cuentas/desactivar') {
      await cambiarEstadoCuenta(
        solicitud,
        respuesta,
        administrador.id,
        false,
      )
      return
    }

    if (solicitud.method === 'POST' && ruta === '/api/cuentas/reactivar') {
      await cambiarEstadoCuenta(
        solicitud,
        respuesta,
        administrador.id,
        true,
      )
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