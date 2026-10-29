import { consultarSesion } from './sesion.ts'
import type { RolUsuario, UsuarioSesion } from './sesion.ts'

/* Esta funcion indica si la cuenta tiene uno de los roles permitidos.
 Se utiliza para organizar las opciones visibles de cada pantalla.*/
export function tieneRol(
  usuario: UsuarioSesion,
  rolesPermitidos: readonly RolUsuario[],
): boolean {
  return rolesPermitidos.includes(usuario.rol)
}

/* Esta funcion comprueba el acceso antes de cargar una pantalla.
 Sin sesion dirige al login. Si el rol no esta permitido,
 vuelve al inicio autenticado. Devuelve null cuando redirige.*/
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