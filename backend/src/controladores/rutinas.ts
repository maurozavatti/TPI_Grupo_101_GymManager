import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ClientSession, Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import { conectarDB, ejecutarTransaccion } from '../db.ts'
import { obtenerUsuarioSesion } from './sesion.ts'
import type { UsuarioSesion } from './sesion.ts'
import { incluyeRol } from '../servicios/roles.ts'
import {
    ErrorHTTP,
    responder,
    leerJSON,
    texto,
    identificador,
    entero,
} from '../compartidos/http.ts'

type Dependencias = {
    conectar: typeof conectarDB
    usuario: typeof obtenerUsuarioSesion
    transaccion: typeof ejecutarTransaccion
}

type EjercicioRutina = {
    ejercicioId: ObjectId
    series: number
    repeticiones: number
    peso: number
    descanso: number
    orden: number
    observaciones: string
}

type RutinaDocumento = {
    _id: ObjectId
    fechaAsignacion: Date
    entrenadorId: ObjectId
    observaciones: string
    activo: boolean
    fechaCreacion: Date
    fechaModificacion: Date
    fechaBaja: Date | null
    ejercicios: EjercicioRutina[]
}

const LIMITE_RUTINAS = 12

function normalizarEjercicios(valor: unknown): EjercicioRutina[] {
    if (
        !Array.isArray(valor)
        || valor.length < 1
        || valor.length > 50
    ) {
        throw new ErrorHTTP(
            400,
            'La rutina debe contener entre 1 y 50 ejercicios.',
            ['ejercicios'],
        )
    }

    const ejercicios = valor.map((item, indice) => {
        if (
            typeof item !== 'object'
            || item === null
            || Array.isArray(item)
        ) {
            throw new ErrorHTTP(
                400,
                `Revisá los datos del ejercicio ${indice + 1}.`,
            )
        }

        const datos = item as Record<string, unknown>
        const peso = datos.peso

        if (
            typeof peso !== 'number'
            || !Number.isFinite(peso)
            || peso < 0
            || peso > 1000
            || Math.abs(peso * 100 - Math.round(peso * 100)) > 0.00000001
        ) {
            throw new ErrorHTTP(
                400,
                `El peso del ejercicio ${indice + 1} no es válido.`,
                ['peso'],
            )
        }

        return {
            ejercicioId: identificador(datos.ejercicioId),
            series: entero(datos.series, 'series', 1, 20),
            repeticiones: entero(datos.repeticiones, 'repeticiones', 1, 100),
            peso,
            descanso: entero(datos.descanso, 'descanso', 0, 3600),
            orden: entero(datos.orden, 'orden', 1, 50),
            observaciones: texto(datos, 'observaciones', 500),
        }
    })

    const ordenes = ejercicios.map(ejercicio => ejercicio.orden)

    if (new Set(ordenes).size !== ordenes.length) {
        throw new ErrorHTTP(
            400,
            'No puede haber dos ejercicios con el mismo orden.',
            ['orden'],
        )
    }

    return ejercicios
}

async function validarCatalogo(
    db: Db,
    ejercicios: EjercicioRutina[],
    sesion: ClientSession,
): Promise<void> {
    const ids = [
        ...new Map(
            ejercicios.map(ejercicio => [
                ejercicio.ejercicioId.toHexString(),
                ejercicio.ejercicioId,
            ]),
        ).values(),
    ]

    const disponibles = await db.collection('ejercicios')
        .find(
            {
                _id: { $in: ids },
                activo: true,
            },
            { session: sesion },
        )
        .project({ _id: 1 })
        .toArray()

    if (disponibles.length !== ids.length) {
        throw new ErrorHTTP(
            400,
            'Uno o más ejercicios no existen o están dados de baja.',
            ['ejercicios'],
        )
    }
}

function obtenerFecha(valor: unknown): number {
    const fecha = valor instanceof Date
        ? valor.getTime()
        : new Date(String(valor ?? '')).getTime()

    return Number.isFinite(fecha) ? fecha : 0
}

async function prepararRutinas(
    db: Db,
    rutinas: RutinaDocumento[],
): Promise<Record<string, unknown>[]> {
    const ids = [
        ...new Map(
            rutinas.flatMap(rutina =>
                (rutina.ejercicios ?? [])
                    .filter(ejercicio => ejercicio.ejercicioId instanceof ObjectId)
                    .map(ejercicio => [
                        ejercicio.ejercicioId.toHexString(),
                        ejercicio.ejercicioId,
                    ]),
            ),
        ).values(),
    ]

    const documentos = ids.length
        ? await db.collection('ejercicios')
            .find({ _id: { $in: ids } })
            .toArray()
        : []

    const catalogo = new Map(
        documentos.map(ejercicio => [
            ejercicio._id.toHexString(),
            ejercicio,
        ]),
    )

    return rutinas.map(rutina => ({
        id: rutina._id.toHexString(),
        fechaAsignacion: rutina.fechaAsignacion,
        entrenadorId: rutina.entrenadorId.toHexString(),
        observaciones: rutina.observaciones ?? '',
        activo: rutina.activo,
        fechaCreacion: rutina.fechaCreacion,
        fechaModificacion: rutina.fechaModificacion,
        fechaBaja: rutina.fechaBaja ?? null,
        ejercicios: [...(rutina.ejercicios ?? [])]
            .sort((a, b) => a.orden - b.orden)
            .map(ejercicio => {
                const documento = ejercicio.ejercicioId instanceof ObjectId
                    ? catalogo.get(ejercicio.ejercicioId.toHexString())
                    : null

                return {
                    ejercicioId: ejercicio.ejercicioId.toHexString(),
                    series: ejercicio.series,
                    repeticiones: ejercicio.repeticiones,
                    peso: ejercicio.peso,
                    descanso: ejercicio.descanso,
                    orden: ejercicio.orden,
                    observaciones: ejercicio.observaciones ?? '',
                    ejercicio: documento
                        ? {
                            id: documento._id.toHexString(),
                            codigo: documento.codigo ?? '',
                            nombre: documento.nombre ?? '',
                            descripcion: documento.descripcion ?? '',
                            grupoMuscular: documento.grupoMuscular ?? '',
                            activo: documento.activo === true,
                        }
                        : null,
                }
            }),
    }))
}

async function consultarRutinasCliente(
    db: Db,
    clienteId: ObjectId,
    respuesta: ServerResponse,
): Promise<void> {
    const cliente = await db.collection('clientes').findOne(
        { _id: clienteId },
        {
            projection: {
                nombre: 1,
                apellido: 1,
                rutinas: 1,
            },
        },
    )

    if (!cliente) {
        throw new ErrorHTTP(404, 'El cliente no existe.')
    }

    const rutinasGuardadas = Array.isArray(cliente.rutinas)
        ? cliente.rutinas as RutinaDocumento[]
        : []

    const rutinas = await prepararRutinas(db, rutinasGuardadas)

    responder(respuesta, 200, {
        cliente: {
            id: cliente._id.toHexString(),
            nombre: cliente.nombre,
            apellido: cliente.apellido,
        },
        rutinas,
        rutinaVigente: rutinas.find(rutina => rutina.activo) ?? null,
    })
}

async function consultarMiRutina(
    db: Db,
    personal: UsuarioSesion,
    respuesta: ServerResponse,
): Promise<void> {
    if (!incluyeRol(personal.rol, ['USUARIO'])) {
        throw new ErrorHTTP(
            403,
            'Esta consulta está disponible para clientes con cuenta.',
        )
    }

    if (!personal.clienteId) {
        throw new ErrorHTTP(
            404,
            'Tu cuenta todavía no está vinculada a una ficha de cliente.',
        )
    }

    const clienteId = identificador(personal.clienteId)

    const cliente = await db.collection('clientes').findOne(
        { _id: clienteId, activo: true },
        {
            projection: {
                nombre: 1,
                apellido: 1,
                rutinas: 1,
            },
        },
    )

    if (!cliente) {
        throw new ErrorHTTP(
            404,
            'No encontramos una ficha de cliente activa vinculada a tu cuenta.',
        )
    }

    const rutinasGuardadas = Array.isArray(cliente.rutinas)
        ? cliente.rutinas as RutinaDocumento[]
        : []

    const rutinas = await prepararRutinas(db, rutinasGuardadas)
    const rutina = rutinas.find(item => item.activo) ?? null

    responder(respuesta, 200, {
        cliente: {
            id: cliente._id.toHexString(),
            nombre: cliente.nombre,
            apellido: cliente.apellido,
        },
        rutina,
    })
}

async function asignarRutina(
    dependencias: Dependencias,
    datos: Record<string, unknown>,
    personal: UsuarioSesion,
    respuesta: ServerResponse,
): Promise<void> {
    const clienteId = identificador(datos.clienteId)
    const observaciones = texto(datos, 'observaciones', 2000)
    const ejercicios = normalizarEjercicios(datos.ejercicios)

    const entrenadorId = identificador(personal.id)
    const fechaActual = new Date()
    const rutinaId = new ObjectId()

    await dependencias.transaccion(async (db, sesion) => {
        const cliente = await db.collection('clientes').findOne(
            {
                _id: clienteId,
                activo: true,
            },
            {
                session: sesion,
                projection: { rutinas: 1 },
            },
        )

        if (!cliente) {
            throw new ErrorHTTP(
                404,
                'El cliente no existe o está inactivo.',
            )
        }

        await validarCatalogo(db, ejercicios, sesion)

        const anteriores = Array.isArray(cliente.rutinas)
            ? cliente.rutinas as RutinaDocumento[]
            : []

        // La rutina vigente pasa al historial.
        const rutinas: RutinaDocumento[] = anteriores.map(rutina =>
            rutina.activo
                ? {
                    ...rutina,
                    activo: false,
                    fechaBaja: fechaActual,
                    fechaModificacion: fechaActual,
                }
                : rutina,
        )

        const nuevaRutina: RutinaDocumento = {
            _id: rutinaId,
            fechaAsignacion: fechaActual,
            entrenadorId,
            observaciones,
            activo: true,
            fechaCreacion: fechaActual,
            fechaModificacion: fechaActual,
            fechaBaja: null,
            ejercicios,
        }

        rutinas.push(nuevaRutina)

        // Si se supera el límite, quitamos la rutina inactiva más antigua.
        while (rutinas.length > LIMITE_RUTINAS) {
            let indiceMasAntigua = -1
            let fechaMasAntigua = Number.POSITIVE_INFINITY

            rutinas.forEach((rutina, indice) => {
                if (rutina.activo) return

                const fecha = obtenerFecha(rutina.fechaAsignacion)

                if (fecha < fechaMasAntigua) {
                    fechaMasAntigua = fecha
                    indiceMasAntigua = indice
                }
            })

            if (indiceMasAntigua === -1) {
                throw new ErrorHTTP(
                    409,
                    'No se pudo conservar el límite del historial de rutinas.',
                )
            }

            rutinas.splice(indiceMasAntigua, 1)
        }

        const cambio = await db.collection('clientes').updateOne(
            {
                _id: clienteId,
                activo: true,
            },
            {
                $set: {
                    rutinas,
                    fechaModificacion: fechaActual,
                },
            },
            { session: sesion },
        )

        if (cambio.matchedCount !== 1) {
            throw new ErrorHTTP(
                409,
                'El cliente cambió durante la asignación. Actualizá la ficha.',
            )
        }
    })

    responder(respuesta, 201, {
        mensaje: 'Rutina asignada correctamente.',
        rutinaId: rutinaId.toHexString(),
    })
}

async function modificarRutina(
    dependencias: Dependencias,
    datos: Record<string, unknown>,
    respuesta: ServerResponse,
): Promise<void> {
    const clienteId = identificador(datos.clienteId)
    const rutinaId = identificador(datos.rutinaId)
    const observaciones = texto(datos, 'observaciones', 2000)
    const ejercicios = normalizarEjercicios(datos.ejercicios)
    const fechaActual = new Date()

    await dependencias.transaccion(async (db, sesion) => {
        const cliente = await db.collection('clientes').findOne(
            {
                _id: clienteId,
                activo: true,
            },
            {
                session: sesion,
                projection: { rutinas: 1 },
            },
        )

        if (!cliente) {
            throw new ErrorHTTP(
                404,
                'El cliente no existe o está inactivo.',
            )
        }

        await validarCatalogo(db, ejercicios, sesion)

        const rutinas = Array.isArray(cliente.rutinas)
            ? cliente.rutinas as RutinaDocumento[]
            : []

        const indice = rutinas.findIndex(rutina =>
            rutina._id instanceof ObjectId
            && rutina._id.equals(rutinaId)
            && rutina.activo,
        )

        if (indice === -1) {
            throw new ErrorHTTP(
                404,
                'No encontramos una rutina vigente con ese identificador.',
            )
        }

        rutinas[indice] = {
            ...rutinas[indice]!,
            observaciones,
            ejercicios,
            fechaModificacion: fechaActual,
        }

        const cambio = await db.collection('clientes').updateOne(
            {
                _id: clienteId,
                activo: true,
            },
            {
                $set: {
                    rutinas,
                    fechaModificacion: fechaActual,
                },
            },
            { session: sesion },
        )

        if (cambio.matchedCount !== 1) {
            throw new ErrorHTTP(
                409,
                'La rutina cambió durante la modificación. Actualizá la ficha.',
            )
        }
    })

    responder(respuesta, 200, {
        mensaje: 'Rutina modificada correctamente.',
    })
}

export function crearGestorRutinas(
    dependencias: Dependencias = {
        conectar: conectarDB,
        usuario: obtenerUsuarioSesion,
        transaccion: ejecutarTransaccion,
    },
) {
    return async function gestionarRutinas(
        solicitud: IncomingMessage,
        respuesta: ServerResponse,
    ): Promise<void> {
        try {
            const personal = await dependencias.usuario(solicitud)

            if (!personal) {
                throw new ErrorHTTP(401, 'Iniciá sesión para continuar.')
            }

            const url = new URL(
                solicitud.url ?? '/',
                'http://localhost',
            )

            const ruta = url.pathname

            if (solicitud.method === 'GET' && ruta === '/api/rutinas/mi') {
                const db = await dependencias.conectar()
                await consultarMiRutina(db, personal, respuesta)
                return
            }

            if (solicitud.method === 'GET' && ruta === '/api/rutinas') {
                if (!incluyeRol(personal.rol, ['ADMIN', 'ENTRENADOR'])) {
                    throw new ErrorHTTP(
                        403,
                        'No tenés permiso para consultar las rutinas de clientes.',
                    )
                }

                const clienteId = identificador(url.searchParams.get('clienteId'))
                const db = await dependencias.conectar()

                await consultarRutinasCliente(db, clienteId, respuesta)
                return
            }

            if (solicitud.method !== 'POST') {
                throw new ErrorHTTP(405, 'Método no permitido.')
            }

            if (!incluyeRol(personal.rol, ['ADMIN', 'ENTRENADOR'])) {
                throw new ErrorHTTP(
                    403,
                    'La asignación y modificación de rutinas requiere permisos de entrenador.',
                )
            }

            const datos = await leerJSON(solicitud, 65536)

            if (ruta === '/api/rutinas') {
                await asignarRutina(
                    dependencias,
                    datos,
                    personal,
                    respuesta,
                )
                return
            }

            if (ruta === '/api/rutinas/editar') {
                await modificarRutina(
                    dependencias,
                    datos,
                    respuesta,
                )
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

            responder(respuesta, 500, {
                mensaje: 'No pudimos completar la operación. Intentá nuevamente.',
            })
        }
    }
}

export const gestionarRutinas = crearGestorRutinas()