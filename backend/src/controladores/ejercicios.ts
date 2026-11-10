
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Db } from 'mongodb'
import { MongoServerError } from 'mongodb'
import { conectarDB } from '../db.ts'
import { obtenerUsuarioSesion } from './sesion.ts'
import {
    ErrorHTTP,
    responder,
    leerJSON,
    texto,
    identificador,
} from '../compartidos/http.ts'
import { incluyeRol } from '../servicios/roles.ts'

type Dependencias = {
    conectar: typeof conectarDB
    usuario: typeof obtenerUsuarioSesion
}

async function listarEjercicios(
    db: Db,
    respuesta: ServerResponse,
    esAdmin: boolean,
): Promise<void> {
    // El entrenador solamente consulta ejercicios activos.
    const filtro = esAdmin ? {} : { activo: true }

    const documentos = await db.collection('ejercicios')
        .find(filtro)
        .sort({ nombre: 1, codigo: 1 })
        .toArray()

    const ejercicios = documentos.map(ejercicio => ({
        id: ejercicio._id.toHexString(),
        codigo: ejercicio.codigo,
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion ?? '',
        grupoMuscular: ejercicio.grupoMuscular ?? '',
        activo: ejercicio.activo,
        fechaCreacion: ejercicio.fechaCreacion,
        fechaModificacion: ejercicio.fechaModificacion,
        fechaBaja: ejercicio.fechaBaja ?? null,
    }))

    responder(respuesta, 200, { ejercicios })
}

async function crearOEditarEjercicio(
    db: Db,
    datos: Record<string, unknown>,
    respuesta: ServerResponse,
): Promise<void> {
    const codigo = texto(datos, 'codigo', 30, true).toUpperCase()
    const nombre = texto(datos, 'nombre', 120, true)
    const grupoMuscular = texto(datos, 'grupoMuscular', 100, true)
    const descripcion = texto(datos, 'descripcion', 2000)

    const fechaActual = new Date()

    const campos = {
        codigo,
        nombre,
        grupoMuscular,
        descripcion,
        fechaModificacion: fechaActual,
    }

    // Garantizamos la unicidad del código en MongoDB.
    await db.collection('ejercicios').createIndex(
        { codigo: 1 },
        { unique: true },
    )

    if (datos.id) {
        const id = identificador(datos.id)

        const resultado = await db.collection('ejercicios').updateOne(
            { _id: id },
            { $set: campos },
        )

        if (!resultado.matchedCount) {
            throw new ErrorHTTP(404, 'El ejercicio no existe.')
        }

        responder(respuesta, 200, {
            mensaje: 'Ejercicio actualizado correctamente.',
        })
        return
    }

    await db.collection('ejercicios').insertOne({
        ...campos,
        activo: true,
        fechaCreacion: fechaActual,
    })

    responder(respuesta, 201, {
        mensaje: 'Ejercicio creado correctamente.',
    })
}

async function cambiarEstadoEjercicio(
    db: Db,
    datos: Record<string, unknown>,
    respuesta: ServerResponse,
): Promise<void> {
    const id = identificador(datos.id)

    if (typeof datos.activo !== 'boolean') {
        throw new ErrorHTTP(400, 'El estado del ejercicio no es válido.')
    }

    const fechaActual = new Date()

    const resultado = await db.collection('ejercicios').updateOne(
        { _id: id },
        datos.activo
            ? {
                $set: {
                    activo: true,
                    fechaModificacion: fechaActual,
                },
                $unset: {
                    fechaBaja: '',
                },
            }
            : {
                $set: {
                    activo: false,
                    fechaBaja: fechaActual,
                    fechaModificacion: fechaActual,
                },
            },
    )

    if (!resultado.matchedCount) {
        throw new ErrorHTTP(404, 'El ejercicio no existe.')
    }

    responder(respuesta, 200, {
        mensaje: datos.activo
            ? 'Ejercicio reactivado correctamente.'
            : 'Ejercicio dado de baja correctamente.',
    })
}

export function crearGestorEjercicios(
    dependencias: Dependencias = {
        conectar: conectarDB,
        usuario: obtenerUsuarioSesion,
    },
) {
    return async function gestionarEjercicios(
        solicitud: IncomingMessage,
        respuesta: ServerResponse,
    ): Promise<void> {
        try {
            const personal = await dependencias.usuario(solicitud)

            // Primero comprobamos que exista una sesión válida.
            if (!personal) {
                throw new ErrorHTTP(401, 'Iniciá sesión para continuar.')
            }

            // Ahora TypeScript sabe que personal no es null.
            const esAdmin = incluyeRol(personal.rol, ['ADMIN'])
            const esEntrenador = incluyeRol(personal.rol, ['ENTRENADOR'])

            if (!esAdmin && !esEntrenador) {
                throw new ErrorHTTP(
                    403,
                    'No tenés permiso para acceder al catálogo.',
                )
            }

            const url = new URL(
                solicitud.url ?? '/',
                'http://localhost',
            )

            const ruta = url.pathname
            const db = await dependencias.conectar()

            if (
                solicitud.method === 'GET'
                && ruta === '/api/ejercicios'
            ) {
                await listarEjercicios(db, respuesta, esAdmin)
                return
            }

            if (solicitud.method !== 'POST') {
                throw new ErrorHTTP(405, 'Método no permitido.')
            }

            // Las modificaciones son exclusivas del Administrador.
            if (!esAdmin) {
                throw new ErrorHTTP(
                    403,
                    'Esta operación requiere permisos de administrador.',
                )
            }

            const datos = await leerJSON(solicitud, 16384)

            if (ruta === '/api/ejercicios') {
                await crearOEditarEjercicio(db, datos, respuesta)
                return
            }

            if (ruta === '/api/ejercicios/estado') {
                await cambiarEstadoEjercicio(db, datos, respuesta)
                return
            }

            throw new ErrorHTTP(404, 'Ruta no encontrada.')
        } catch (error) {
            if (error instanceof ErrorHTTP) {
                responder(respuesta, error.estado, {
                    mensaje: error.message,
                    campos: error.campos,
                })
                return
            }

            if (
                error instanceof MongoServerError
                && error.code === 11000
            ) {
                responder(respuesta, 409, {
                    mensaje: 'Ya existe un ejercicio con ese código.',
                    campos: ['codigo'],
                })
                return
            }

            responder(respuesta, 500, {
                mensaje: 'No pudimos completar la operación. Intentá nuevamente.',
            })
        }
    }
}

export const gestionarEjercicios = crearGestorEjercicios()
