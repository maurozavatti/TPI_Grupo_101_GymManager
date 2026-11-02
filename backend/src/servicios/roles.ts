import type { RolUsuario } from '../controladores/sesion.ts'

/* Una cuenta puede conservar un rol como texto o tener
 varios roles guardados dentro del mismo campo. */
export type RolesCuenta = RolUsuario | RolUsuario[]

/* Comprobamos que el valor sea uno de los roles admitidos. */
function esRolUsuario(valor: unknown): valor is RolUsuario {
  return valor === 'ADMIN'
    || valor === 'ENTRENADOR'
    || valor === 'USUARIO'
}

/* Validamos ambos formatos. Los arrays deben tener al menos
 un rol y no pueden contener valores repetidos o desconocidos. */
export function esRolCuenta(valor: unknown): valor is RolesCuenta {
  if (esRolUsuario(valor)) return true

  return Array.isArray(valor)
    && valor.length > 0
    && valor.every(esRolUsuario)
    && new Set(valor).size === valor.length
}

/* Devolvemos siempre una lista para simplificar las consultas.
 Los valores invalidos no conceden ningun permiso. */
export function obtenerRoles(valor: unknown): RolUsuario[] {
  if (!esRolCuenta(valor)) return []

  return Array.isArray(valor) ? [...valor] : [valor]
}

/* La cuenta tiene acceso cuando alguno de sus roles coincide
 con uno de los permitidos para la operacion. */
export function incluyeRol(
  valor: unknown,
  rolesPermitidos: readonly RolUsuario[],
): boolean {
  return obtenerRoles(valor).some((rol) => rolesPermitidos.includes(rol))
}