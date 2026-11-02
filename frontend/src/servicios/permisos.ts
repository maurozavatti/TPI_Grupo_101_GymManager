import { consultarSesion } from './sesion.ts'
import { incluyeRol } from './roles.ts'
import type { RolUsuario, UsuarioSesion } from './sesion.ts'

/* Basta con que alguno de los roles de la cuenta coincida
 con los permitidos para mostrar una opcion o abrir una pagina. */
export function tieneRol(
  usuario: UsuarioSesion,
  rolesPermitidos: readonly RolUsuario[],
): boolean {
  return incluyeRol(usuario.rol, rolesPermitidos)
}

/* Sin sesion dirigimos al login. Si el acceso no esta permitido,
 la entrada principal resuelve el destino correspondiente. */
export async function exigirAcceso(
  rolesPermitidos?: readonly RolUsuario[],
): Promise<UsuarioSesion | null> {
  const usuario = await consultarSesion()

  if (!usuario) {
    window.location.replace('/src/autenticacion/login/login.html')
    return null
  }

  if (rolesPermitidos && !tieneRol(usuario, rolesPermitidos)) {
    window.location.replace('/')
    return null
  }

  return usuario
}