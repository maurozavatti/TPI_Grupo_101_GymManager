import type { IncomingMessage, ServerResponse } from 'node:http'
import { ObjectId } from 'mongodb'
import { conectarDB, ejecutarTransaccion } from '../db.ts'
import { ErrorHTTP, leerJSON, responder } from '../compartidos/http.ts'
import { exigirSesion } from '../servicios/permisos.ts'
import {
  crearHashContrasena,
  verificarContrasena,
} from '../servicios/contrasenas.ts'
import {
  enviarCookie,
  nuevaSesion,
  prepararSesiones,
} from '../servicios/autenticacion.ts'

/* Esta funcion permite cambiar la contraseña de la cuenta
 autenticada. La cuenta se identifica mediante su sesion,
 sin recibir un identificador de usuario desde el formulario.*/
export async function cambiarContrasena(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  try {
    const usuario = await exigirSesion(solicitud)
    const datos = await leerJSON(solicitud, 16384)

    const actual = datos.actual
    const nueva = datos.nueva
    const confirmacion = datos.confirmacion

    if (typeof actual !== 'string' || !actual) {
      throw new ErrorHTTP(
        400,
        'Completá la contraseña actual.',
        ['actual'],
      )
    }

    if (typeof nueva !== 'string' || !nueva) {
      throw new ErrorHTTP(
        400,
        'Completá la nueva contraseña.',
        ['nueva'],
      )
    }

    if (typeof confirmacion !== 'string' || !confirmacion) {
      throw new ErrorHTTP(
        400,
        'Confirmá la nueva contraseña.',
        ['confirmacion'],
      )
    }

    if (nueva !== confirmacion) {
      throw new ErrorHTTP(
        400,
        'Las contraseñas no coinciden.',
        ['confirmacion'],
      )
    }

    const db = await conectarDB()
    const usuarioId = new ObjectId(usuario.id)

    /* Consultamos solamente los datos necesarios para
     comprobar la contraseña actual de una cuenta activa.*/
    const cuenta = await db.collection('usuarios').findOne(
      { _id: usuarioId, activo: true },
      { projection: { passwordHash: 1 } },
    )

    if (!cuenta || typeof cuenta.passwordHash !== 'string') {
      throw new ErrorHTTP(401, 'Volvé a iniciar sesión.')
    }

    const coincide = await verificarContrasena(
      actual,
      cuenta.passwordHash,
    )

    if (!coincide) {
      throw new ErrorHTTP(
        400,
        'La contraseña actual es incorrecta.',
        ['actual'],
      )
    }

    if (nueva === actual) {
      throw new ErrorHTTP(
        400,
        'La nueva contraseña debe ser distinta de la actual.',
        ['nueva'],
      )
    }

    /* Reutilizamos las reglas de longitud y la generacion
     del hash que ya utiliza el registro de cuentas.*/
    let passwordHash: string

    try {
      passwordHash = await crearHashContrasena(nueva)
    } catch (error) {
      if (error instanceof RangeError) {
        throw new ErrorHTTP(400, error.message, ['nueva'])
      }

      throw error
    }

    await prepararSesiones(db)
    const sesionNueva = nuevaSesion(usuarioId)

    /* Guardamos la contraseña y renovamos la sesion dentro
     de una transaccion para aplicar todos los cambios juntos.*/
    await ejecutarTransaccion(async (base, transaccion) => {
      const cambio = await base.collection('usuarios').updateOne(
        {
          _id: usuarioId,
          activo: true,
          passwordHash: cuenta.passwordHash,
        },
        {
          $set: {
            passwordHash,
            fechaModificacion: new Date(),
          },
        },
        { session: transaccion },
      )

      if (cambio.matchedCount !== 1) {
        throw new ErrorHTTP(
          409,
          'La cuenta cambió durante la operación. Intentá nuevamente.',
        )
      }

      await base.collection('sesiones').deleteMany(
        { usuarioId },
        { session: transaccion },
      )

      await base.collection('sesiones').insertOne(
        sesionNueva.documento,
        { session: transaccion },
      )
    })

    /* La cookie se renueva cuando la transaccion termina.
     Este navegador continua conectado con la nueva sesion.*/
    enviarCookie(respuesta, sesionNueva.token)

    responder(respuesta, 200, {
      mensaje: 'Contraseña actualizada correctamente. Las demás sesiones se cerraron.',
    })
  } catch (error) {
    if (error instanceof ErrorHTTP) {
      responder(respuesta, error.estado, {
        mensaje: error.message,
        campos: error.campos,
      })
      return
    }

    responder(respuesta, 500, {
      mensaje: 'No se pudo cambiar la contraseña. Intentá nuevamente.',
    })
  }
}