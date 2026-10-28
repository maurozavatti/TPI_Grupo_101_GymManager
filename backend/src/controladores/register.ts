import type { IncomingMessage, ServerResponse } from 'node:http'
import { MongoServerError, ObjectId } from 'mongodb'
import { conectarDB, ejecutarTransaccion } from '../db.ts'
import { ErrorHTTP, leerJSON, responder } from '../compartidos/http.ts'
import { crearHashContrasena } from '../servicios/contrasenas.ts'
import {
  enviarCookie,
  nuevaSesion,
  prepararSesiones,
} from '../servicios/autenticacion.ts'

/* Esta funcion registra una cuenta y crea su primera sesion.
 El rol del registro publico siempre es USUARIO.*/
export async function registrarUsuario(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  try {
    /* Leemos un objeto JSON de hasta 16 KiB.
     Las validaciones del backend se aplican aunque el
     frontend ya haya comprobado el formulario.*/
    const datos = await leerJSON(solicitud, 16 * 1024)

    const nombre = typeof datos.nombre === 'string'
      ? datos.nombre.trim()
      : ''

    const apellido = typeof datos.apellido === 'string'
      ? datos.apellido.trim()
      : ''

    const email = typeof datos.email === 'string'
      ? datos.email.trim().toLowerCase()
      : ''

    /* La contraseña se conserva tal como fue escrita.
     No eliminamos espacios ni cambiamos sus caracteres.*/
    const contrasena = typeof datos.contrasena === 'string'
      ? datos.contrasena
      : ''

    const camposIncorrectos: string[] = []

    if (!nombre || nombre.length > 100) {
      camposIncorrectos.push('nombre')
    }

    if (!apellido || apellido.length > 100) {
      camposIncorrectos.push('apellido')
    }

    if (camposIncorrectos.length > 0) {
      throw new ErrorHTTP(
        400,
        'Nombre y apellido son obligatorios y admiten hasta 100 caracteres cada uno.',
        camposIncorrectos,
      )
    }

    if (
      !email
      || email.length > 254
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new ErrorHTTP(
        400,
        'Ingresá un correo electrónico válido de hasta 254 caracteres.',
        ['correo'],
      )
    }

    /* Generamos el hash antes de comenzar la transaccion.
     El servicio comprueba los limites de la contraseña.*/
    let passwordHash: string

    try {
      passwordHash = await crearHashContrasena(contrasena)
    } catch (error) {
      if (error instanceof RangeError) {
        throw new ErrorHTTP(400, error.message, ['contrasena'])
      }

      throw error
    }

    const db = await conectarDB()

    /* Preparamos los indices fuera de la transaccion.
     El indice unico de correo tambien evita duplicados
     cuando llegan dos registros al mismo tiempo.*/
    await db.collection('usuarios').createIndex(
      { email: 1 },
      { unique: true },
    )

    await prepararSesiones(db)

    const usuarioId = new ObjectId()
    const fechaActual = new Date()

    const usuario = {
      _id: usuarioId,
      nombre,
      apellido,
      email,
      passwordHash,
      rol: 'USUARIO' as const,
      activo: true,
      fechaCreacion: fechaActual,
      fechaModificacion: fechaActual,
    }

    /* No guardamos clienteId hasta que se vincule una ficha.
     Asi las cuentas sin cliente asociado no colisionan
     con el indice unico sparse de ese campo.*/
    const sesion = nuevaSesion(usuarioId)

    /* Las dos inserciones usan la misma transaccion.
     La cuenta y su sesion se guardan juntas.*/
    await ejecutarTransaccion(async (base, transaccion) => {
      await base.collection('usuarios').insertOne(
        usuario,
        { session: transaccion },
      )

      await base.collection('sesiones').insertOne(
        sesion.documento,
        { session: transaccion },
      )
    })

    /* Enviamos la cookie solamente despues de confirmar
     que la cuenta y la sesion quedaron guardadas.*/
    enviarCookie(respuesta, sesion.token)

    responder(respuesta, 201, {
      mensaje: 'Cuenta creada correctamente.',
      usuario: {
        id: usuarioId.toHexString(),
        nombre,
        apellido,
        email,
        rol: usuario.rol,
        clienteId: null,
      },
    })
  } catch (error) {
    /* Los errores de validacion incluyen los campos que
     el frontend debe marcar como incorrectos.*/
    if (error instanceof ErrorHTTP) {
      responder(respuesta, error.estado, {
        mensaje: error.message,
        campos: error.campos,
      })
      return
    }

    /* MongoDB informa el codigo 11000 cuando se intenta
     repetir un valor protegido por un indice unico.*/
    if (
      error instanceof MongoServerError
      && error.code === 11000
      && error.keyPattern?.email
    ) {
      responder(respuesta, 409, {
        mensaje: 'El correo ya está registrado.',
        campos: ['correo'],
      })
      return
    }

    responder(respuesta, 500, {
      mensaje: 'No se pudo crear la cuenta. Intentá nuevamente.',
    })
  }
}