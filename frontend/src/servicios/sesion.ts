import { ErrorAPI, solicitarAPI } from './api.ts'

/* Estos son los roles admitidos por la aplicacion.*/
export type RolUsuario = 'ADMIN' | 'ENTRENADOR' | 'USUARIO'

/* Estos son los datos publicos que devuelve el backend
 cuando existe una sesion valida.*/
export interface UsuarioSesion {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolUsuario
  clienteId: string | null
}

/* Esta funcion comprueba la estructura de los datos recibidos.
 Los tipos de TypeScript no validan por si solos una respuesta JSON.*/
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
    && (
      usuario.rol === 'ADMIN'
      || usuario.rol === 'ENTRENADOR'
      || usuario.rol === 'USUARIO'
    )
    && (
      usuario.clienteId === null
      || typeof usuario.clienteId === 'string'
    )
  )
}

/* Esta funcion consulta la sesion actual en el backend.
 El navegador envia la cookie sin que necesitemos leerla
 ni guardar el usuario en localStorage.*/
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
    /* El estado 401 indica que no hay una sesion valida.
     Los errores de conexion o del servidor se propagan
     para mostrarlos sin confundirlos con una sesion cerrada.*/
    if (error instanceof ErrorAPI && error.estado === 401) {
      return null
    }

    throw error
  }
}

/* Esta funcion solicita el cierre de la sesion actual.
 El navegador procesa la eliminacion de la cookie.
 La pagina que la utiliza decide adonde navegar despues.*/
export async function cerrarSesion(): Promise<void> {
  await solicitarAPI('/api/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}