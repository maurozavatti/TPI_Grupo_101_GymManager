import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Db } from 'mongodb'
import { conectarDB } from '../db.ts'
import { obtenerUsuarioSesion } from './sesion.ts'
import type { UsuarioSesion } from './sesion.ts'
import { ErrorHTTP, responder } from '../compartidos/http.ts'
import { diasSemana } from '../compartidos/reglas.ts'
import type { Turno } from '../compartidos/modelos.ts'

type Dependencias = {
    conectar: typeof conectarDB
    usuario: typeof obtenerUsuarioSesion
}

/* Devuelve el dia de hoy con el mismo formato que usa turnos.ts
 (LUNES, MARTES, etc.), segun el huso horario de Argentina. */
function diaDeHoy(): string {
    const nombre = new Date().toLocaleDateString('es-AR', {
        weekday: 'long',
        timeZone: 'America/Argentina/Buenos_Aires',
    })
    const normalizado = nombre
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
    return diasSemana.includes(normalizado) ? normalizado : 'LUNES'
}

/* Resume los turnos de hoy. Para el Entrenador se filtran los
 propios; para el Administrador se consideran todos. */
async function resumenTurnosHoy(db: Db, personal: UsuarioSesion): Promise<{
    turnos: { horaInicio: string, horaFin: string, ocupacion: number, capacidad: number }[]
    ocupacionPorcentaje: number
}> {
    const dia = diaDeHoy()

    const turnosDelDia = await db.collection<Turno>('turnos')
        .find({ dia, activo: true })
        .sort({ horaInicio: 1 })
        .toArray()

    const turnosFiltrados = personal.rol === 'ENTRENADOR'
        ? turnosDelDia.filter(t => t.entrenadorId.toHexString() === personal.id)
        : turnosDelDia

    const capacidadTotal = turnosFiltrados.reduce((total, t) => total + t.capacidad, 0)
    const ocupacionTotal = turnosFiltrados.reduce((total, t) => total + (t.clientes ?? []).length, 0)

    return {
        turnos: turnosFiltrados.map(t => ({
            horaInicio: t.horaInicio,
            horaFin: t.horaFin,
            ocupacion: (t.clientes ?? []).length,
            capacidad: t.capacidad,
        })),
        ocupacionPorcentaje: capacidadTotal > 0 ? Math.round((ocupacionTotal / capacidadTotal) * 100) : 0,
    }
}

/* Resume los indicadores administrativos: clientes activos, ingresos
 del mes y cuotas vencidas o proximas a vencer. Solo para ADMIN. */
async function resumenAdministrativo(db: Db) {
    const ahora = new Date()
    const inicioDeMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const limiteProximas = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)

    const clientesActivos = await db.collection('clientes').countDocuments({ activo: true })

    const pagosDelMes = await db.collection('pagos')
        .find({ estado: 'PAGADO', fechaPago: { $gte: inicioDeMes } })
        .toArray()
    const ingresosMes = pagosDelMes.reduce((total, pago) => total + pago.monto, 0)

    const cuotasVencidas = await db.collection('pagos').countDocuments({
        $or: [
            { estado: 'VENCIDO' },
            { estado: 'PENDIENTE', fechaVencimiento: { $lt: ahora } },
        ],
    })

    const cuotasProximasAVencer = await db.collection('pagos').countDocuments({
        estado: 'PENDIENTE',
        fechaVencimiento: { $gte: ahora, $lte: limiteProximas },
    })

    return { clientesActivos, ingresosMes, cuotasVencidas, cuotasProximasAVencer }
}

async function consultarResumen(db: Db, personal: UsuarioSesion, respuesta: ServerResponse): Promise<void> {
    const turnosHoy = await resumenTurnosHoy(db, personal)
    const administrativo = personal.rol === 'ADMIN' ? await resumenAdministrativo(db) : null

    responder(respuesta, 200, {
        resumen: {
            turnosHoy,
            administrativo,
        },
    })
}

export function crearGestorResumen(dependencias: Dependencias = {
    conectar: conectarDB, usuario: obtenerUsuarioSesion,
}) {
    return async function gestionarResumen(solicitud: IncomingMessage, respuesta: ServerResponse): Promise<void> {
        try {
            const personal = await dependencias.usuario(solicitud)
            if (!personal) throw new ErrorHTTP(401, 'Iniciá sesión para continuar.')
            if (personal.rol !== 'ADMIN' && personal.rol !== 'ENTRENADOR')
                throw new ErrorHTTP(403, 'No tenés permiso para acceder al resumen.')

            if (solicitud.method !== 'GET' || solicitud.url?.split('?')[0] !== '/api/resumen')
                throw new ErrorHTTP(404, 'Ruta no encontrada.')

            const db = await dependencias.conectar()
            await consultarResumen(db, personal, respuesta)
        } catch (error) {
            if (error instanceof ErrorHTTP) {
                responder(respuesta, error.estado, { mensaje: error.message, campos: error.campos })
                return
            }
            responder(respuesta, 500, { mensaje: 'No pudimos completar la operación. Intentá nuevamente.' })
        }
    }
}

export const gestionarResumen = crearGestorResumen()
