import { ErrorAPI, solicitarAPI } from './api.ts'
import { esRolCuenta } from './roles.ts'
import type { RolesCuenta } from './roles.ts'

export type RolUsuario = 'ADMIN' | 'ENTRENADOR' | 'USUARIO'

/* La sesion conserva el formato de rol recibido del backend:
 un texto para cuentas existentes o un array para varios roles. */
export interface UsuarioSesion {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolesCuenta
  clienteId: string | null
}

/* Comprobamos los datos recibidos antes de utilizarlos.
 Los tipos de TypeScript no validan una respuesta JSON. */
function esUsuarioSesion(valor: unknown): valor is UsuarioSesion {
  if (
    valor === null
    || typeof valor !== 'object'
    || Array.isArray(valor)
  ) {
    return false
  }

  const usuario = valor as Record<string, unknown>

  return (
    typeof usuario.id === 'string'
    && typeof usuario.nombre === 'string'
    && typeof usuario.apellido === 'string'
    && typeof usuario.email === 'string'
    && esRolCuenta(usuario.rol)
    && (
      usuario.clienteId === null
      || typeof usuario.clienteId === 'string'
    )
  )
}

/* El navegador envia la cookie sin que necesitemos leerla
 ni guardar los datos de la cuenta en localStorage. */
export async function consultarSesion(): Promise<UsuarioSesion | null> {
  try {
    const datos = await solicitarAPI<unknown>('/api/sesion')

    if (
      datos === null
      || typeof datos !== 'object'
      || Array.isArray(datos)
    ) {
      throw new Error('La respuesta de sesión no es válida.')
    }

    const usuario = (datos as Record<string, unknown>).usuario

    if (!esUsuarioSesion(usuario)) {
      throw new Error('Los datos de la sesión no son válidos.')
    }

    return usuario
  } catch (error) {
    /* Una sesion ausente se distingue de un problema de conexion. */
    if (error instanceof ErrorAPI && error.estado === 401) {
      return null
    }

    throw error
  }
}

/* El navegador procesa la eliminacion de la cookie.
 La pantalla decide adonde navegar despues del cierre. */
export async function cerrarSesion(): Promise<void> {
  await solicitarAPI('/api/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}