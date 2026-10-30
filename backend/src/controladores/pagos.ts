import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import { conectarDB } from '../db.ts'
import { obtenerUsuarioSesion } from './sesion.ts'
import { ErrorHTTP, responder, leerJSON, texto, identificador, entero, fechaArgentina } from '../compartidos/http.ts'

const tiposPago = ['INSCRIPCION', 'CUOTA'] as const

async function promoverVencidos(db: Db): Promise<void> {
    await db.collection('pagos').updateMany(
        { estado: 'PENDIENTE', fechaVencimiento: { $lt: new Date() } },
        { $set: { estado: 'VENCIDO' } },
    )
}

async function listarPagos(db: Db, datos: URLSearchParams, respuesta: ServerResponse): Promise<void> {
    await promoverVencidos(db)
    const clienteId = datos.get('clienteId')
    const filtro = clienteId ? { clienteId: identificador(clienteId) } : {}
    const pagos = await db.collection('pagos').find(filtro).sort({ fechaVencimiento: -1, fechaPago: -1 }).toArray()
    responder(respuesta, 200, {
        pagos: pagos.map(pago => ({
            id: pago._id.toHexString(),
            clienteId: pago.clienteId.toHexString(),
            tipo: pago.tipo,
            monto: pago.monto,
            fechaPago: pago.fechaPago ?? null,
            fechaVencimiento: pago.fechaVencimiento ?? null,
            estado: pago.estado,
            observaciones: pago.observaciones ?? '',
        })),
    })
}

async function registrarPago(db: Db, datos: Record<string, unknown>, respuesta: ServerResponse): Promise<void> {
    const clienteId = identificador(datos.clienteId)
    const tipo = texto(datos, 'tipo', 20, true)
    if (!tiposPago.includes(tipo as typeof tiposPago[number]))
        throw new ErrorHTTP(400, 'Seleccioná un tipo de pago válido.', ['tipo'])
    const monto = entero(datos.monto, 'monto', 1, 100_000_000)
    const observaciones = texto(datos, 'observaciones', 500)
    const vencimientoTexto = texto(datos, 'fechaVencimiento', 10)
    const fechaVencimiento = vencimientoTexto ? fechaArgentina(vencimientoTexto, 'fechaVencimiento', true) : undefined
    const pagado = datos.pagado === true

    const cliente = await db.collection('clientes').findOne({ _id: clienteId, activo: true })
    if (!cliente) throw new ErrorHTTP(404, 'El cliente no existe o está inactivo.')

    if (pagado) {
        await db.collection('pagos').insertOne({
            clienteId, tipo, monto, observaciones,
            fechaPago: new Date(),
            estado: 'PAGADO',
            ...(fechaVencimiento ? { fechaVencimiento } : {}),
        })
        responder(respuesta, 201, { mensaje: 'Pago registrado correctamente.' })
        return
    }

    if (!fechaVencimiento) throw new ErrorHTTP(400, 'Indicá la fecha de vencimiento de la cuota.', ['fechaVencimiento'])
    await db.collection('pagos').insertOne({
        clienteId, tipo, monto, observaciones, fechaVencimiento,
        fechaPago: null,
        estado: 'PENDIENTE',
    })
    responder(respuesta, 201, { mensaje: 'Cuota pendiente registrada correctamente.' })
}

async function marcarPagado(db: Db, datos: Record<string, unknown>, respuesta: ServerResponse): Promise<void> {
    const id = identificador(datos.pagoId)
    const resultado = await db.collection('pagos').updateOne(
        { _id: id, estado: { $in: ['PENDIENTE', 'VENCIDO'] } },
        { $set: { estado: 'PAGADO', fechaPago: new Date() } },
    )
    if (!resultado.matchedCount) throw new ErrorHTTP(409, 'El pago no existe o ya estaba registrado como pagado.')
    responder(respuesta, 200, { mensaje: 'Pago marcado como pagado.' })
}

export function crearGestorPagos(dependencias = {
    conectar: conectarDB, usuario: obtenerUsuarioSesion,
}) {
    return async function gestionarPagos(solicitud: IncomingMessage, respuesta: ServerResponse): Promise<void> {
        try {
            const personal = await dependencias.usuario(solicitud)
            if (!personal) throw new ErrorHTTP(401, 'Iniciá sesión para continuar.')
            if (personal.rol !== 'ADMIN') throw new ErrorHTTP(403, 'Esta sección requiere permisos de administrador.')

            const url = new URL(solicitud.url ?? '/', 'http://localhost')
            const ruta = url.pathname
            const db = await dependencias.conectar()

            if (solicitud.method === 'GET' && ruta === '/api/pagos') {
                await listarPagos(db, url.searchParams, respuesta)
                return
            }

            if (solicitud.method !== 'POST') throw new ErrorHTTP(405, 'Método no permitido.')
            const datos = await leerJSON(solicitud, 16384)

            if (ruta === '/api/pagos') {
                await registrarPago(db, datos, respuesta)
                return
            }
            if (ruta === '/api/pagos/pagar') {
                await marcarPagado(db, datos, respuesta)
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

export const gestionarPagos = crearGestorPagos()