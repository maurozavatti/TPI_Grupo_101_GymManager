import type { IncomingMessage } from 'node:http'
import { conectarDB } from '../db.ts'
import { ErrorHTTP } from '../compartidos/http.ts'
import { obtenerUsuarioSesion } from '../controladores/sesion.ts'
import type {
  RolUsuario,
  UsuarioSesion,
} from '../controladores/sesion.ts'

/* Esta funcion exige una sesion valida para continuar.
 Devuelve la cuenta autenticada o informa que debe iniciar sesion.*/
export async function exigirSesion(
  solicitud: IncomingMessage,
  conectar = conectarDB,
): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuarioSesion(solicitud, conectar)

  if (!usuario) {
    throw new ErrorHTTP(
      401,
      'Tenés que iniciar sesión para realizar esta operación.',
    )
  }

  return usuario
}

/* Esta funcion exige una sesion y uno de los roles indicados.
 El rol se obtiene de la cuenta consultada por el backend,
 nunca de un valor enviado por el navegador.*/
export async function exigirRol(
  solicitud: IncomingMessage,
  rolesPermitidos: readonly RolUsuario[],
  conectar = conectarDB,
): Promise<UsuarioSesion> {
  const usuario = await exigirSesion(solicitud, conectar)

  if (!rolesPermitidos.includes(usuario.rol)) {
    throw new ErrorHTTP(
      403,
      'No tenés permiso para realizar esta operación.',
    )
  }

  return usuario
}