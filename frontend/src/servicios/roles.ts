import type { RolUsuario } from './sesion.ts'

/* Una cuenta puede conservar un rol como texto o tener
 varios roles guardados dentro del mismo campo. */
export type RolesCuenta = RolUsuario | RolUsuario[]

/* Comprobamos que el valor sea uno de los roles admitidos. */
function esRolUsuario(valor: unknown): valor is RolUsuario {
  return valor === 'ADMIN'
    || valor === 'ENTRENADOR'
    || valor === 'USUARIO'
}

/* Validamos ambos formatos antes de utilizar los datos
 recibidos del backend. */
export function esRolCuenta(valor: unknown): valor is RolesCuenta {
  if (esRolUsuario(valor)) return true

  return Array.isArray(valor)
    && valor.length > 0
    && valor.every(esRolUsuario)
    && new Set(valor).size === valor.length
}

/* Devolvemos siempre una lista para consultar y mostrar los roles. */
export function obtenerRoles(valor: unknown): RolUsuario[] {
  if (!esRolCuenta(valor)) return []

  return Array.isArray(valor) ? [...valor] : [valor]
}

/* La cuenta tiene acceso cuando alguno de sus roles coincide
 con uno de los permitidos para la pantalla. */
export function incluyeRol(
  valor: unknown,
  rolesPermitidos: readonly RolUsuario[],
): boolean {
  return obtenerRoles(valor).some((rol) => rolesPermitidos.includes(rol))
}