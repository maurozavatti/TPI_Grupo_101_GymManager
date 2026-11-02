import type { IncomingMessage } from 'node:http'
import { conectarDB } from '../db.ts'
import { ErrorHTTP } from '../compartidos/http.ts'
import { obtenerUsuarioSesion } from '../controladores/sesion.ts'
import { incluyeRol } from './roles.ts'
import type {
  RolUsuario,
  UsuarioSesion,
} from '../controladores/sesion.ts'

/* Esta funcion comprueba si alguno de los roles de la cuenta
 coincide con los permitidos para una operacion. */
export function tieneRol(
  usuario: Pick<UsuarioSesion, 'rol'>,
  rolesPermitidos: readonly RolUsuario[],
): boolean {
  return incluyeRol(usuario.rol, rolesPermitidos)
}

/* Esta funcion exige una sesion valida para continuar.
 Devuelve la cuenta autenticada o informa que debe iniciar sesion. */
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

/* Esta funcion exige una sesion y al menos uno de los roles
 permitidos. Los roles se obtienen de la cuenta en la base,
 nunca de los datos enviados por el navegador. */
export async function exigirRol(
  solicitud: IncomingMessage,
  rolesPermitidos: readonly RolUsuario[],
  conectar = conectarDB,
): Promise<UsuarioSesion> {
  const usuario = await exigirSesion(solicitud, conectar)

  if (!tieneRol(usuario, rolesPermitidos)) {
    throw new ErrorHTTP(
      403,
      'No tenés permiso para realizar esta operación.',
    )
  }

  return usuario
}