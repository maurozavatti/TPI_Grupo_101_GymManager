import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AnyBulkWriteOperation, Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import { conectarDB, ejecutarTransaccion } from '../db.ts'
import { obtenerUsuarioSesion } from './sesion.ts'
import type { UsuarioSesion } from './sesion.ts'
import { ErrorHTTP, responder, leerJSON, texto, identificador, entero } from '../compartidos/http.ts'
import { diasSemana, validarHorario } from '../compartidos/reglas.ts'
import type { ConfiguracionAgenda, Turno } from '../compartidos/modelos.ts'

type Dependencias = {
    conectar: typeof conectarDB
    usuario: typeof obtenerUsuarioSesion
    transaccion: typeof ejecutarTransaccion
}

const idConfiguracion = new ObjectId('000000000000000000000001')
const configuracionInicial: ConfiguracionAgenda = { franjas: [{ inicio: '09:00', fin: '21:00' }], capacidad: 5, trabajos: [] }

const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))
const hora = (valor: number) => `${String(Math.floor(valor / 60)).padStart(2, '0')}:${String(valor % 60).padStart(2, '0')}`

function exigirTurnoPropio(personal: UsuarioSesion, entrenadorId: ObjectId): void {
    if (personal.rol === 'ENTRENADOR' && entrenadorId.toHexString() !== personal.id)
        throw new ErrorHTTP(403, 'Solo podés administrar tus propios turnos.')
}

async function validarEntrenador(db: Db, entrenadorId: ObjectId): Promise<void> {
    const cuenta = await db.collection('usuarios').findOne({ _id: entrenadorId, rol: 'ENTRENADOR', activo: true })
    if (!cuenta) throw new ErrorHTTP(400, 'Seleccioná un entrenador activo.', ['entrenadorId'])
}

async function sinSolapamientos(db: Db, dia: string, inicio: string, fin: string, entrenadorId: ObjectId, omitir?: ObjectId): Promise<void> {
    const existentes = await db.collection<Turno>('turnos').find({ dia, entrenadorId, activo: true }).toArray()
    if (existentes.some(t => !t._id.equals(omitir) && t.horaInicio < fin && t.horaFin > inicio)) {
        throw new ErrorHTTP(409, `Ya existe un turno de este entrenador el ${dia} entre ${inicio} y ${fin}. Revisá o desactivá el turno anterior.`)
    }
}

async function consultarConfiguracion(db: Db): Promise<ConfiguracionAgenda> {
    const guardada = await db.collection('configuracion').findOne({ _id: idConfiguracion })
    return {
        franjas: guardada?.franjas ?? configuracionInicial.franjas,
        capacidad: guardada?.capacidad ?? configuracionInicial.capacidad,
        trabajos: guardada?.trabajos ?? [],
    }
}

async function listarTurnos(db: Db, respuesta: ServerResponse): Promise<void> {
    const turnos = await db.collection<Turno>('turnos').find({}).sort({ dia: 1, horaInicio: 1 }).toArray()
    responder(respuesta, 200, {
        turnos: turnos.map(turno => ({
            id: turno._id.toHexString(),
            dia: turno.dia,
            horaInicio: turno.horaInicio,
            horaFin: turno.horaFin,
            capacidad: turno.capacidad,
            entrenadorId: turno.entrenadorId.toHexString(),
            activo: turno.activo,
            observaciones: turno.observaciones ?? '',
            ocupacion: (turno.clientes ?? []).length,
        })),
    })
}

async function consultarConfiguracionEndpoint(db: Db, personal: UsuarioSesion, respuesta: ServerResponse): Promise<void> {
    const configuracion = await consultarConfiguracion(db)
    responder(respuesta, 200, {
        configuracion: {
            ...configuracion,
            trabajos: personal.rol === 'ENTRENADOR'
                ? configuracion.trabajos.filter(t => t.entrenadorId.toHexString() === personal.id)
                : configuracion.trabajos,
        },
    })
}

async function crearOEditarTurno(db: Db, datos: Record<string, unknown>, esEdicion: boolean, personal: UsuarioSesion, respuesta: ServerResponse): Promise<void> {
    const dia = texto(datos, 'dia', 20, true)
    if (!diasSemana.includes(dia)) throw new ErrorHTTP(400, 'Seleccioná un día válido.', ['dia'])
    const horaInicio = texto(datos, 'horaInicio', 5, true)
    const horaFin = texto(datos, 'horaFin', 5, true)
    validarHorario(horaInicio, horaFin)
    const capacidad = entero(datos.capacidad, 'capacidad', 1, 100)
    const entrenadorId = identificador(datos.entrenadorId)
    const observaciones = texto(datos, 'observaciones', 2000)

    exigirTurnoPropio(personal, entrenadorId)
    await validarEntrenador(db, entrenadorId)

    if (esEdicion) {
        const id = identificador(datos.turnoId)
        const existente = await db.collection<Turno>('turnos').findOne({ _id: id })
        if (!existente) throw new ErrorHTTP(404, 'El turno no existe.')
        exigirTurnoPropio(personal, existente.entrenadorId)
        if ((existente.clientes ?? []).length > capacidad)
            throw new ErrorHTTP(409, 'El cupo no puede ser menor a la cantidad de clientes ya asignados.', ['capacidad'])
        if (existente.activo) await sinSolapamientos(db, dia, horaInicio, horaFin, entrenadorId, id)
        await db.collection<Turno>('turnos').updateOne({ _id: id }, { $set: { dia, horaInicio, horaFin, capacidad, entrenadorId, observaciones } })
        responder(respuesta, 200, { mensaje: 'Turno actualizado correctamente.' })
        return
    }

    await sinSolapamientos(db, dia, horaInicio, horaFin, entrenadorId)
    await db.collection('turnos').insertOne({
        dia, horaInicio, horaFin, capacidad, entrenadorId, observaciones,
        activo: true, clientes: [], historialClientes: [],
    })
    responder(respuesta, 201, { mensaje: 'Turno creado correctamente.' })
}

async function cambiarEstadoTurno(db: Db, datos: Record<string, unknown>, respuesta: ServerResponse, personal: UsuarioSesion): Promise<void> {
    const id = identificador(datos.turnoId)
    const activo = datos.activo
    if (typeof activo !== 'boolean') throw new ErrorHTTP(400, 'El estado no es válido.')

    const turno = await db.collection<Turno>('turnos').findOne({ _id: id })
    if (!turno) throw new ErrorHTTP(404, 'El turno no existe.')
    exigirTurnoPropio(personal, turno.entrenadorId)

    if (activo) await sinSolapamientos(db, turno.dia, turno.horaInicio, turno.horaFin, turno.entrenadorId, turno._id)

    await db.collection<Turno>('turnos').updateOne({ _id: turno._id }, { $set: { activo } })
    responder(respuesta, 200, { mensaje: activo ? 'Turno reactivado.' : 'Turno dado de baja.' })
}

async function asignarORetirarCliente(db: Db, datos: Record<string, unknown>, asignar: boolean, personal: UsuarioSesion, respuesta: ServerResponse): Promise<void> {
    const turnoId = identificador(datos.turnoId)
    const clienteId = identificador(datos.clienteId)
    const turno = await db.collection<Turno>('turnos').findOne({ _id: turnoId })
    if (!turno) throw new ErrorHTTP(404, 'El turno no existe.')
    exigirTurnoPropio(personal, turno.entrenadorId)

    if (asignar) {
        if (!turno.activo) throw new ErrorHTTP(409, 'El turno está inactivo.')
        if ((turno.clientes ?? []).some((id: ObjectId) => id.equals(clienteId)))
            throw new ErrorHTTP(409, 'El cliente ya está asignado a este turno.')
        if ((turno.clientes ?? []).length >= turno.capacidad)
            throw new ErrorHTTP(409, 'El turno ya alcanzó su cupo máximo.')
        const cliente = await db.collection('clientes').findOne({ _id: clienteId, activo: true })
        if (!cliente) throw new ErrorHTTP(404, 'El cliente no existe o está inactivo.')
        const otros = await db.collection<Turno>('turnos').find({ dia: turno.dia, clientes: clienteId, activo: true }).toArray()
        if (otros.some(t => t.horaInicio < turno.horaFin && t.horaFin > turno.horaInicio))
            throw new ErrorHTTP(409, 'El cliente ya tiene otro turno en ese horario.')
    }
    else if (!(turno.clientes ?? []).some((id: ObjectId) => id.equals(clienteId))) {
        throw new ErrorHTTP(409, 'El cliente no está asignado a este turno.')
    }

    await db.collection<Turno>('turnos').updateOne({ _id: turnoId }, {
        ...(asignar ? { $addToSet: { clientes: clienteId } } : { $pull: { clientes: clienteId } }),
        $push: { historialClientes: { clienteId, accion: asignar ? 'ASIGNACION' : 'RETIRO', fecha: new Date(), usuarioId: new ObjectId(personal.id) } },
    })
    responder(respuesta, 200, { mensaje: asignar ? 'Cliente asignado al turno.' : 'Cliente retirado del turno.' })
}

async function generarAgenda(dependencias: Dependencias, datos: Record<string, unknown>, personal: UsuarioSesion, respuesta: ServerResponse): Promise<void> {
    const db = await dependencias.conectar()
    const configuracion = await consultarConfiguracion(db)

    const conservaApertura = Array.isArray(datos.franjas) && datos.franjas.length === configuracion.franjas.length
        && datos.franjas.every((f: unknown, i: number) => typeof f === 'object' && f !== null
            && (f as Record<string, unknown>).inicio === configuracion.franjas[i]!.inicio
            && (f as Record<string, unknown>).fin === configuracion.franjas[i]!.fin)
    if (personal.rol === 'ENTRENADOR' && (datos.capacidad !== configuracion.capacidad || !conservaApertura))
        throw new ErrorHTTP(403, 'Solo el Administrador puede cambiar los horarios de apertura y el cupo por defecto.')

    const capacidad = entero(datos.capacidad, 'capacidad', 1, 100)
    if (!Array.isArray(datos.franjas) || datos.franjas.length < 1 || datos.franjas.length > 4)
        throw new ErrorHTTP(400, 'Indicá entre una y cuatro franjas de apertura.')
    const franjas = datos.franjas.map((valor: unknown) => {
        if (!valor || typeof valor !== 'object') throw new ErrorHTTP(400, 'Revisá las franjas de apertura.')
        const campos = valor as Record<string, unknown>
        const inicio = texto(campos, 'inicio', 5, true), fin = texto(campos, 'fin', 5, true)
        validarHorario(inicio, fin)
        if ((minutos(fin) - minutos(inicio)) % 60 !== 0)
            throw new ErrorHTTP(400, 'Cada franja debe contener un número entero de horas.')
        return { inicio, fin }
    }).sort((a, b) => a.inicio.localeCompare(b.inicio))
    if (franjas.some((f, i) => i > 0 && f.inicio < franjas[i - 1]!.fin))
        throw new ErrorHTTP(400, 'Las franjas de apertura no pueden superponerse.')

    if (!Array.isArray(datos.trabajos) || !datos.trabajos.length || datos.trabajos.length > 50)
        throw new ErrorHTTP(400, 'Seleccioná los días de trabajo de al menos un entrenador.')
    const trabajos = datos.trabajos.map((valor: unknown) => {
        if (!valor || typeof valor !== 'object') throw new ErrorHTTP(400, 'Revisá los días de cada entrenador.')
        const campos = valor as Record<string, unknown>
        if (!Array.isArray(campos.dias) || !campos.dias.length || campos.dias.some((d: unknown) => typeof d !== 'string' || !diasSemana.includes(d)))
            throw new ErrorHTTP(400, 'Revisá los días de cada entrenador.')
        return { entrenadorId: identificador(campos.entrenadorId), dias: [...new Set(campos.dias as string[])] }
    })
    if (new Set(trabajos.map(t => t.entrenadorId.toHexString())).size !== trabajos.length)
        throw new ErrorHTTP(400, 'Un entrenador aparece repetido.')
    if (personal.rol === 'ENTRENADOR' && (trabajos.length !== 1 || trabajos[0]!.entrenadorId.toHexString() !== personal.id))
        throw new ErrorHTTP(403, 'Solo podés generar los turnos de tu propia agenda.')
    for (const trabajo of trabajos) await validarEntrenador(db, trabajo.entrenadorId)

    let creados = 0, conservados = 0

    await dependencias.transaccion(async (baseTransaccional, sesion) => {
        const existentes = await baseTransaccional.collection<Turno>('turnos').find({}, { session: sesion }).toArray()
        const operaciones: AnyBulkWriteOperation[] = []

        for (const trabajo of trabajos) {
            for (const dia of trabajo.dias) {
                for (const franja of franjas) {
                    for (let minuto = minutos(franja.inicio); minuto < minutos(franja.fin); minuto += 60) {
                        const horaInicio = hora(minuto), horaFin = hora(minuto + 60)
                        const existente = existentes.find(t => t.dia === dia && t.entrenadorId.equals(trabajo.entrenadorId) && t.horaInicio === horaInicio && t.horaFin === horaFin)
                        if (existente && (existente.clientes?.length ?? 0) > capacidad)
                            throw new ErrorHTTP(409, `Hay un turno el ${dia} ${horaInicio}-${horaFin} con más clientes que el cupo indicado. No se generó la agenda.`)
                        const solapado = existentes.some(t => t.activo && t.dia === dia && t.entrenadorId.equals(trabajo.entrenadorId)
                            && !t._id.equals(existente?._id) && t.horaInicio < horaFin && t.horaFin > horaInicio)
                        if (solapado)
                            throw new ErrorHTTP(409, `Hay un turno anterior superpuesto el ${dia} entre ${horaInicio} y ${horaFin}. Editalo o desactivalo antes de generar la agenda.`)
                        if (existente) {
                            operaciones.push({ updateOne: { filter: { _id: existente._id }, update: { $set: { capacidad, activo: true } } } })
                            conservados++
                        }
                        else {
                            operaciones.push({ insertOne: { document: { dia, horaInicio, horaFin, capacidad, entrenadorId: trabajo.entrenadorId, observaciones: '', activo: true, clientes: [], historialClientes: [] } } })
                            creados++
                        }
                    }
                }
            }
        }

        if (operaciones.length) await baseTransaccional.collection('turnos').bulkWrite(operaciones, { session: sesion })

        const seleccionados = new Set(trabajos.map(t => t.entrenadorId.toHexString()))
        const trabajosActualizados = [...configuracion.trabajos.filter(t => !seleccionados.has(t.entrenadorId.toHexString())), ...trabajos]
        await baseTransaccional.collection('configuracion').updateOne({ _id: idConfiguracion }, {
            $set: {
                ...(personal.rol === 'ADMIN' ? { franjas, capacidad } : {}),
                trabajos: trabajosActualizados,
                fechaModificacion: new Date(),
            },
        }, { upsert: true, session: sesion })
    })

    responder(respuesta, 200, { mensaje: `Agenda generada: ${creados} turnos nuevos y ${conservados} conservados.` })
}

async function operarEnLote(dependencias: Dependencias, datos: Record<string, unknown>, personal: UsuarioSesion, respuesta: ServerResponse): Promise<void> {
    if (personal.rol !== 'ADMIN') throw new ErrorHTTP(403, 'Solo el Administrador puede operar turnos en lote.')
    if (!Array.isArray(datos.ids) || !datos.ids.length || datos.ids.length > 2000 || typeof datos.eliminar !== 'boolean' || datos.confirmado !== true)
        throw new ErrorHTTP(400, 'Seleccioná turnos y confirmá la operación.')
    const ids = [...new Map(datos.ids.map(valor => { const id = identificador(valor); return [id.toHexString(), id] as const })).values()]

    await dependencias.transaccion(async (baseTransaccional, sesion) => {
        const coleccion = baseTransaccional.collection<Turno>('turnos')
        if (await coleccion.countDocuments({ _id: { $in: ids } }, { session: sesion }) !== ids.length)
            throw new ErrorHTTP(409, 'La selección cambió. Actualizá la agenda.')
        if (datos.eliminar) await coleccion.deleteMany({ _id: { $in: ids } }, { session: sesion })
        else await coleccion.updateMany({ _id: { $in: ids } }, { $set: { activo: false } }, { session: sesion })
    })

    responder(respuesta, 200, { mensaje: `${ids.length} turnos ${datos.eliminar ? 'eliminados definitivamente' : 'dados de baja'}.` })
}

export function crearGestorTurnos(dependencias: Dependencias = {
    conectar: conectarDB, usuario: obtenerUsuarioSesion, transaccion: ejecutarTransaccion,
}) {
    return async function gestionarTurnos(solicitud: IncomingMessage, respuesta: ServerResponse): Promise<void> {
        try {
            const personal = await dependencias.usuario(solicitud)
            if (!personal) throw new ErrorHTTP(401, 'Iniciá sesión para continuar.')
            if (personal.rol !== 'ADMIN' && personal.rol !== 'ENTRENADOR')
                throw new ErrorHTTP(403, 'No tenés permiso para acceder a turnos.')

            const ruta = solicitud.url?.split('?')[0]
            const db = await dependencias.conectar()

            if (solicitud.method === 'GET' && ruta === '/api/turnos') {
                await listarTurnos(db, respuesta)
                return
            }
            if (solicitud.method === 'GET' && ruta === '/api/turnos/configuracion') {
                await consultarConfiguracionEndpoint(db, personal, respuesta)
                return
            }

            if (solicitud.method !== 'POST') throw new ErrorHTTP(405, 'Método no permitido.')
            const datos = await leerJSON(solicitud, 16384)

            if (ruta === '/api/turnos' || ruta === '/api/turnos/editar') {
                await crearOEditarTurno(db, datos, ruta === '/api/turnos/editar', personal, respuesta)
                return
            }
            if (ruta === '/api/turnos/estado') {
                await cambiarEstadoTurno(db, datos, respuesta, personal)
                return
            }
            if (ruta === '/api/turnos/asignar' || ruta === '/api/turnos/retirar') {
                await asignarORetirarCliente(db, datos, ruta.endsWith('/asignar'), personal, respuesta)
                return
            }
            if (ruta === '/api/turnos/generar') {
                await generarAgenda(dependencias, datos, personal, respuesta)
                return
            }
            if (ruta === '/api/turnos/lote') {
                await operarEnLote(dependencias, datos, personal, respuesta)
                return
            }

            throw new ErrorHTTP(404, 'Ruta no encontrada.')
        } catch (error) {
            if (error instanceof ErrorHTTP) {
                responder(respuesta, error.estado, { mensaje: error.message, campos: error.campos })
                return
            }
            responder(respuesta, 500, { mensaje: 'No pudimos completar la operación. Intentá nuevamente.' })
        }
    }
}

export const gestionarTurnos = crearGestorTurnos()