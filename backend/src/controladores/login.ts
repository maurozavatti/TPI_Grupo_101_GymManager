import type { IncomingMessage, ServerResponse } from 'node:http'
import { ObjectId } from 'mongodb'
import { conectarDB } from '../db.ts'
import { ErrorHTTP, leerJSON, responder } from '../compartidos/http.ts'
import { verificarContrasena } from '../servicios/contrasenas.ts'
import {
  enviarCookie,
  nuevaSesion,
  prepararSesiones,
} from '../servicios/autenticacion.ts'

/* Este hash auxiliar permite comparar una contraseña incluso
 cuando el correo no corresponde a una cuenta existente.
 Ayuda a reducir diferencias de tiempo entre ambos casos.
 No pertenece a ningun usuario ni permite iniciar sesion.*/
const hashAuxiliar =
  '$2b$12$.cuIxRWMS42O.annDMkfaurPnqXrlfkvHfv9AsbPj/Ac04KlDNGfm'

/* Esta funcion comprueba las credenciales y crea una sesion.
 El rol y los datos de la cuenta se obtienen de la base.*/
export async function iniciarSesion(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  try {
    const datos = await leerJSON(solicitud, 16 * 1024)

    const email = typeof datos.email === 'string'
      ? datos.email.trim().toLowerCase()
      : ''

    /* Conservamos la contraseña exactamente como fue escrita.*/
    const contrasena = typeof datos.contrasena === 'string'
      ? datos.contrasena
      : ''

    const camposIncorrectos: string[] = []

    if (
      !email
      || email.length > 254
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      camposIncorrectos.push('correo')
    }

    if (!contrasena) {
      camposIncorrectos.push('contrasena')
    }

    if (camposIncorrectos.length > 0) {
      throw new ErrorHTTP(
        400,
        'Ingresá un correo válido y completá la contraseña.',
        camposIncorrectos,
      )
    }

    const db = await conectarDB()

    /* Consultamos solamente los datos necesarios para ingresar.
     El hash se utiliza internamente y nunca se envia al frontend.*/
    const usuario = await db.collection('usuarios').findOne(
      { email },
      {
        projection: {
          nombre: 1,
          apellido: 1,
          email: 1,
          passwordHash: 1,
          rol: 1,
          activo: 1,
          clienteId: 1,
        },
      },
    )

    const hashGuardado = typeof usuario?.passwordHash === 'string'
      ? usuario.passwordHash
      : hashAuxiliar

    const contrasenaCorrecta = await verificarContrasena(
      contrasena,
      hashGuardado,
    )

    /* Usamos el mismo mensaje para una cuenta inexistente,
     una cuenta inactiva o una contraseña incorrecta.*/
    if (
      !usuario
      || usuario.activo !== true
      || typeof usuario.passwordHash !== 'string'
      || !contrasenaCorrecta
    ) {
      throw new ErrorHTTP(
        401,
        'Correo o contraseña incorrectos.',
        ['correo', 'contrasena'],
      )
    }

    const rol = usuario.rol

    /* Comprobamos el rol y los datos publicos antes de permitir
     el acceso. No confiamos en un rol enviado por el navegador.*/
    if (
      (rol !== 'ADMIN' && rol !== 'ENTRENADOR' && rol !== 'USUARIO')
      || typeof usuario.nombre !== 'string'
      || typeof usuario.apellido !== 'string'
      || typeof usuario.email !== 'string'
    ) {
      throw new ErrorHTTP(
        401,
        'Correo o contraseña incorrectos.',
        ['correo', 'contrasena'],
      )
    }

    await prepararSesiones(db)

    /* Cada inicio correcto genera un token nuevo.
     En la base se guarda solamente su hash.*/
    const sesion = nuevaSesion(usuario._id)

    await db.collection('sesiones').insertOne(sesion.documento)

    /* La cookie se envia despues de guardar la sesion.*/
    enviarCookie(respuesta, sesion.token)

    responder(respuesta, 200, {
      mensaje: 'Sesión iniciada correctamente.',
      usuario: {
        id: usuario._id.toHexString(),
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol,
        clienteId: usuario.clienteId instanceof ObjectId
          ? usuario.clienteId.toHexString()
          : null,
      },
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
      mensaje: 'No se pudo iniciar sesión. Intentá nuevamente.',
    })
  }
}