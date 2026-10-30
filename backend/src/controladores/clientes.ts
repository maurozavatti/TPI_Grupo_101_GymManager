import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Db } from 'mongodb'
import { MongoServerError, ObjectId } from 'mongodb'
import { conectarDB, ejecutarTransaccion } from '../db.ts'
import { obtenerUsuarioSesion } from './sesion.ts'
import type { UsuarioSesion } from './sesion.ts'
import { ErrorHTTP, responder, leerJSON, texto, identificador, fechaArgentina } from '../compartidos/http.ts'
import type { Turno } from '../compartidos/modelos.ts'

type Dependencias = {
    conectar: typeof conectarDB
    usuario: typeof obtenerUsuarioSesion
    transaccion: typeof ejecutarTransaccion
}

async function prepararIndices(db: Db): Promise<void> {
    await db.collection('clientes').createIndex({ dni: 1 }, { unique: true })
    await db.collection('clientes').createIndex({ usuarioId: 1 }, { unique: true, sparse: true })
}

async function listarClientes(db: Db, respuesta: ServerResponse): Promise<void> {
    const documentos = await db.collection('clientes')
        .find({}, { projection: { nombre: 1, apellido: 1, dni: 1, telefono: 1, email: 1, activo: 1, usuarioId: 1 } })
        .sort({ apellido: 1, nombre: 1, _id: 1 })
        .toArray()
    const clientes = documentos.map(cliente => ({
        id: cliente._id.toHexString(),
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        dni: cliente.dni,
        telefono: cliente.telefono ?? '',
        email: cliente.email ?? '',
        activo: cliente.activo,
        vinculado: cliente.usuarioId instanceof ObjectId,
    }))
    responder(respuesta, 200, { clientes })
}

async function crearOEditarCliente(db: Db, datos: Record<string, unknown>, esEdicion: boolean, respuesta: ServerResponse): Promise<void> {
    const nombre = texto(datos, 'nombre', 100, true)
    const apellido = texto(datos, 'apellido', 100, true)
    const dni = texto(datos, 'dni', 20, true).replace(/[.\s-]/g, '')
    const telefono = texto(datos, 'telefono', 30)
    const email = texto(datos, 'email', 254).toLowerCase()
    const direccion = texto(datos, 'direccion', 300)
    const nacimiento = texto(datos, 'fechaNacimiento', 10)
    const fechaNacimiento = nacimiento ? fechaArgentina(nacimiento, 'fechaNacimiento') : undefined
    if (fechaNacimiento && fechaNacimiento > new Date())
        throw new ErrorHTTP(400, 'La fecha de nacimiento no puede ser futura.', ['fechaNacimiento'])
    const contactoEmergencia = {
        nombre: texto(datos, 'emergenciaNombre', 100),
        telefono: texto(datos, 'emergenciaTelefono', 30),
        relacion: texto(datos, 'emergenciaRelacion', 100),
    }
    if (!/^\d{7,8}$/.test(dni)) throw new ErrorHTTP(400, 'Ingresá un DNI de siete u ocho dígitos.', ['dni'])
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new ErrorHTTP(400, 'Ingresá un correo de contacto válido.', ['email'])

    await prepararIndices(db)
    const fechaActual = new Date()

    if (esEdicion) {
        const id = identificador(datos.clienteId)
        const resultado = await db.collection('clientes').updateOne({ _id: id }, {
            $set: { nombre, apellido, dni, telefono, email, direccion, contactoEmergencia, fechaModificacion: fechaActual, ...(fechaNacimiento ? { fechaNacimiento } : {}) },
            ...(!fechaNacimiento ? { $unset: { fechaNacimiento: '' } } : {}),
        })
        if (!resultado.matchedCount) throw new ErrorHTTP(404, 'El cliente no existe.')
        responder(respuesta, 200, { mensaje: 'Ficha actualizada correctamente.' })
        return
    }

    await db.collection('clientes').insertOne({
        nombre, apellido, dni, activo: true, fechaCreacion: fechaActual, fechaModificacion: fechaActual,
        rutinas: [], direccion, contactoEmergencia,
        ...(fechaNacimiento ? { fechaNacimiento } : {}),
        ...(telefono ? { telefono } : {}),
        ...(email ? { email } : {}),
    })
    responder(respuesta, 201, { mensaje: 'Cliente creado correctamente.' })
}

async function cambiarEstadoCliente(dependencias: Dependencias, datos: Record<string, unknown>, activo: boolean, personal: UsuarioSesion, respuesta: ServerResponse): Promise<void> {
    const id = identificador(datos.clienteId)
    await dependencias.transaccion(async (db, sesion) => {
        const ahora = new Date()
        const cambio = await db.collection('clientes').updateOne({ _id: id, activo: !activo }, activo
            ? { $set: { activo: true, fechaModificacion: ahora, inicioCicloCuotas: ahora, cicloCuotasId: new ObjectId() }, $unset: { fechaBaja: '' } }
            : { $set: { activo: false, fechaBaja: ahora, fechaModificacion: ahora } }, { session: sesion })
        if (!cambio.matchedCount) throw new ErrorHTTP(409, 'La ficha no existe o ya tiene ese estado.')
        if (!activo) {
            await db.collection<Turno>('turnos').updateMany({ clientes: id }, {
                $pull: { clientes: id },
                $push: { historialClientes: { clienteId: id, accion: 'BAJA_CLIENTE', fecha: ahora, usuarioId: new ObjectId(personal.id) } },
            }, { session: sesion })
        }
    })
    responder(respuesta, 200, { mensaje: activo ? 'Cliente reactivado. Podés volver a asignarle turnos.' : 'Cliente dado de baja. Se conservó su historial y se liberaron sus cupos.' })
}

async function vincularCliente(dependencias: Dependencias, datos: Record<string, unknown>, respuesta: ServerResponse): Promise<void> {
    const clienteId = identificador(datos.clienteId)
    const correoCuenta = texto(datos, 'correoCuenta', 254, true).toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoCuenta))
        throw new ErrorHTTP(400, 'Ingresá un correo de cuenta válido.', ['correoCuenta'])
    if (datos.confirmado !== true)
        throw new ErrorHTTP(400, 'Confirmá que verificaste a quién pertenece la cuenta.', ['confirmado'])

    await dependencias.transaccion(async (db, sesion) => {
        await prepararIndices(db)
        const cliente = await db.collection('clientes').findOne({ _id: clienteId, activo: true }, { session: sesion, projection: { usuarioId: 1 } })
        if (!cliente) throw new ErrorHTTP(404, 'El cliente no existe o está inactivo.')
        if (cliente.usuarioId != null) throw new ErrorHTTP(409, 'Este cliente ya tiene una cuenta vinculada.')

        const usuario = await db.collection('usuarios').findOne({ email: correoCuenta, rol: 'USUARIO', activo: true }, { session: sesion, projection: { clienteId: 1 } })
        if (!usuario) throw new ErrorHTTP(404, 'No encontramos una cuenta de cliente activa con ese correo.', ['correoCuenta'])
        if (usuario.clienteId != null) throw new ErrorHTTP(409, 'La cuenta ya está vinculada con otra ficha.', ['correoCuenta'])

        const fechaActual = new Date()
        const cambioUsuario = await db.collection('usuarios').updateOne(
            { _id: usuario._id, clienteId: null, activo: true, rol: 'USUARIO' },
            { $set: { clienteId: cliente._id, fechaModificacion: fechaActual } }, { session: sesion })
        const cambioCliente = await db.collection('clientes').updateOne(
            { _id: cliente._id, usuarioId: null, activo: true },
            { $set: { usuarioId: usuario._id, fechaModificacion: fechaActual } }, { session: sesion })
        if (cambioUsuario.matchedCount !== 1 || cambioCliente.matchedCount !== 1)
            throw new ErrorHTTP(409, 'La vinculación cambió durante la operación. Actualizá el listado.')
    })
    responder(respuesta, 200, { mensaje: 'Cuenta vinculada correctamente.' })
}

export function crearGestorClientes(dependencias: Dependencias = {
    conectar: conectarDB, usuario: obtenerUsuarioSesion, transaccion: ejecutarTransaccion,
}) {
    return async function gestionarClientes(solicitud: IncomingMessage, respuesta: ServerResponse): Promise<void> {
        try {
            const personal = await dependencias.usuario(solicitud)
            if (!personal) throw new ErrorHTTP(401, 'Iniciá sesión para continuar.')
            if (personal.rol !== 'ADMIN' && personal.rol !== 'ENTRENADOR')
                throw new ErrorHTTP(403, 'No tenés permiso para acceder a clientes.')

            const ruta = solicitud.url?.split('?')[0]
            const db = await dependencias.conectar()

            if (solicitud.method === 'GET' && ruta === '/api/clientes') {
                await listarClientes(db, respuesta)
                return
            }

            if (solicitud.method !== 'POST') throw new ErrorHTTP(405, 'Método no permitido.')
            if (personal.rol !== 'ADMIN') throw new ErrorHTTP(403, 'Esta acción requiere permisos de administrador.')

            const datos = await leerJSON(solicitud, 16384)

            if (ruta === '/api/clientes' || ruta === '/api/clientes/editar') {
                await crearOEditarCliente(db, datos, ruta === '/api/clientes/editar', respuesta)
                return
            }
            if (ruta === '/api/clientes/desactivar' || ruta === '/api/clientes/reactivar') {
                await cambiarEstadoCliente(dependencias, datos, ruta.endsWith('/reactivar'), personal, respuesta)
                return
            }
            if (ruta === '/api/clientes/vincular') {
                await vincularCliente(dependencias, datos, respuesta)
                return
            }

            throw new ErrorHTTP(404, 'Ruta no encontrada.')
        } catch (error) {
            if (error instanceof ErrorHTTP) {
                responder(respuesta, error.estado, { mensaje: error.message, campos: error.campos })
                return
            }
            if (error instanceof MongoServerError && error.code === 11000) {
                const esDni = Boolean(error.keyPattern?.dni)
                responder(respuesta, 409, {
                    mensaje: esDni ? 'Ya existe un cliente con ese DNI.' : 'La cuenta o la ficha ya tienen una vinculación.',
                    campos: esDni ? ['dni'] : ['correoCuenta'],
                })
                return
            }
            responder(respuesta, 500, { mensaje: 'No pudimos completar la operación. Intentá nuevamente.' })
        }
    }
}

export const gestionarClientes = crearGestorClientes()