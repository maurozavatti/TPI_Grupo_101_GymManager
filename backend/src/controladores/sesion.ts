import type { IncomingMessage } from 'node:http';

// TEMPORAL: placeholder hasta que Emanuel suba la version real de sesiones.
// Devuelve siempre "sin sesion" para no habilitar acceso por error.
export async function obtenerUsuarioSesion(_solicitud: IncomingMessage) {
    return null as null | { id: string; rol: 'ADMIN' | 'ENTRENADOR' | 'USUARIO'; clienteId: string | null };
}