import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Db } from 'mongodb';
import { MongoServerError, ObjectId } from 'mongodb';
import { conectarDB } from '../db.ts';
import { obtenerUsuarioSesion } from './sesion.ts';
import { fechaArgentina, ErrorHTTP as ErrorSolicitud, responder, leerJSON, texto as leerTexto } from '../compartidos/http.ts';
import type { Turno } from '../compartidos/modelos.ts';

type Personal = { id: string; rol: 'ADMIN' | 'ENTRENADOR' | 'USUARIO'; clienteId: string | null };

async function prepararIndices(db: Db): Promise<void> {
    await db.collection('clientes').createIndex({ dni: 1 }, { unique: true });
    await db.collection('clientes').createIndex({ usuarioId: 1 }, { unique: true, sparse: true });
}

// --- Cada funcion resuelve una sola ruta ---

async function listarClientes(db: Db, respuesta: ServerResponse): Promise<void> {
    const documentos = await db.collection('clientes')
        .find({}, { projection: { nombre: 1, apellido: 1, dni: 1, telefono: 1, email: 1, activo: 1, usuarioId: 1 } })
        .sort({ apellido: 1, nombre: 1, _id: 1 })
        .toArray();
    const clientes = documentos.map(cliente => ({
        id: cliente._id.toHexString(),
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        dni: cliente.dni,
        telefono: cliente.telefono ?? '',
        email: cliente.email ?? '',
        activo: cliente.activo,
        vinculado: cliente.usuarioId instanceof ObjectId,
    }));
    responder(respuesta, 200, { clientes });
}

async function crearOEditarCliente(db: Db, datos: Record<string, unknown>, esEdicion: boolean, respuesta: ServerResponse): Promise<void> {
    const nombre = leerTexto(datos, 'nombre', 100, true);
    const apellido = leerTexto(datos, 'apellido', 100, true);
    const dni = leerTexto(datos, 'dni', 20, true).replace(/[.\s-]/g, '');
    const telefono = leerTexto(datos, 'telefono', 30);
    const email = leerTexto(datos, 'email', 254).toLowerCase();
    const direccion = leerTexto(datos, 'direccion', 300);
    const nacimiento = leerTexto(datos, 'fechaNacimiento', 10);
    const fechaNacimiento = nacimiento ? fechaArgentina(nacimiento, 'fechaNacimiento') : undefined;
    if (fechaNacimiento && fechaNacimiento > new Date())
        throw new ErrorSolicitud(400, 'La fecha de nacimiento no puede ser futura.', ['fechaNacimiento']);
    const contactoEmergencia = {
        nombre: leerTexto(datos, 'emergenciaNombre', 100),
        telefono: leerTexto(datos, 'emergenciaTelefono', 30),
        relacion: leerTexto(datos, 'emergenciaRelacion', 100),
    };
    if (!/^\d{7,8}$/.test(dni)) throw new ErrorSolicitud(400, 'Ingresá un DNI de siete u ocho dígitos.', ['dni']);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new ErrorSolicitud(400, 'Ingresá un correo de contacto válido.', ['email']);

    await prepararIndices(db);
    const fechaActual = new Date();

    if (esEdicion) {
        const clienteId = leerTexto(datos, 'clienteId', 24, true);
        if (!/^[a-f0-9]{24}$/i.test(clienteId)) throw new ErrorSolicitud(400, 'Seleccioná un cliente válido.');
        const resultado = await db.collection('clientes').updateOne({ _id: new ObjectId(clienteId) }, {
            $set: { nombre, apellido, dni, telefono, email, direccion, contactoEmergencia, fechaModificacion: fechaActual, ...(fechaNacimiento ? { fechaNacimiento } : {}) },
            ...(!fechaNacimiento ? { $unset: { fechaNacimiento: '' } } : {}),
        });
        if (!resultado.matchedCount) throw new ErrorSolicitud(404, 'El cliente no existe.');
        responder(respuesta, 200, { mensaje: 'Ficha actualizada correctamente.' });
        return;
    }

    await db.collection('clientes').insertOne({
        nombre, apellido, dni, activo: true, fechaCreacion: fechaActual, fechaModificacion: fechaActual,
        rutinas: [], direccion, contactoEmergencia,
        ...(fechaNacimiento ? { fechaNacimiento } : {}),
        ...(telefono ? { telefono } : {}),
        ...(email ? { email } : {}),
    });
    responder(respuesta, 201, { mensaje: 'Cliente creado correctamente.' });
}

async function cambiarEstadoCliente(db: Db, datos: Record<string, unknown>, activo: boolean, personal: Personal, respuesta: ServerResponse): Promise<void> {
    const clienteId = leerTexto(datos, 'clienteId', 24, true);
    if (!/^[a-f0-9]{24}$/i.test(clienteId)) throw new ErrorSolicitud(400, 'Seleccioná un cliente válido.');
    const id = new ObjectId(clienteId);
    const ahora = new Date();
    const cambio = await db.collection('clientes').updateOne({ _id: id, activo: !activo }, activo
        ? { $set: { activo: true, fechaModificacion: ahora, inicioCicloCuotas: ahora, cicloCuotasId: new ObjectId() }, $unset: { fechaBaja: '' } }
        : { $set: { activo: false, fechaBaja: ahora, fechaModificacion: ahora } });
    if (!cambio.matchedCount) throw new ErrorSolicitud(409, 'La ficha no existe o ya tiene ese estado.');
    if (!activo) {
        // NOTA: esto deberia ir dentro de la misma transaccion que el update de arriba
        // (ver aviso pendiente a Emanuel sobre ejecutarTransaccion en db.ts). RN-18.
        await db.collection<Turno>('turnos').updateMany({ clientes: id }, {
            $pull: { clientes: id },
            $push: { historialClientes: { clienteId: id, accion: 'BAJA_CLIENTE', fecha: ahora, usuarioId: new ObjectId(personal.id) } },
        });
    }
    responder(respuesta, 200, { mensaje: activo ? 'Cliente reactivado. Podés volver a asignarle turnos.' : 'Cliente dado de baja. Se conservó su historial y se liberaron sus cupos.' });
}

async function vincularCliente(db: Db, datos: Record<string, unknown>, respuesta: ServerResponse): Promise<void> {
    const clienteId = leerTexto(datos, 'clienteId', 24, true);
    const correoCuenta = leerTexto(datos, 'correoCuenta', 254, true).toLowerCase();
    if (!/^[a-f0-9]{24}$/i.test(clienteId)) throw new ErrorSolicitud(400, 'Seleccioná un cliente válido.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoCuenta))
        throw new ErrorSolicitud(400, 'Ingresá un correo de cuenta válido.', ['correoCuenta']);
    if (datos.confirmado !== true)
        throw new ErrorSolicitud(400, 'Confirmá que verificaste a quién pertenece la cuenta.', ['confirmado']);

    await prepararIndices(db);
    const cliente = await db.collection('clientes').findOne({ _id: new ObjectId(clienteId), activo: true }, { projection: { usuarioId: 1 } });
    if (!cliente) throw new ErrorSolicitud(404, 'El cliente no existe o está inactivo.');
    if (cliente.usuarioId != null) throw new ErrorSolicitud(409, 'Este cliente ya tiene una cuenta vinculada.');

    const usuario = await db.collection('usuarios').findOne({ email: correoCuenta, rol: 'USUARIO', activo: true }, { projection: { clienteId: 1 } });
    if (!usuario) throw new ErrorSolicitud(404, 'No encontramos una cuenta de cliente activa con ese correo.', ['correoCuenta']);
    if (usuario.clienteId != null) throw new ErrorSolicitud(409, 'La cuenta ya está vinculada con otra ficha.', ['correoCuenta']);

    const fechaActual = new Date();
    // NOTA: idem arriba, esto deberia ser una transaccion atomica entre usuarios y clientes.
    const cambioUsuario = await db.collection('usuarios').updateOne(
        { _id: usuario._id, clienteId: null, activo: true, rol: 'USUARIO' },
        { $set: { clienteId: cliente._id, fechaModificacion: fechaActual } });
    const cambioCliente = await db.collection('clientes').updateOne(
        { _id: cliente._id, usuarioId: null, activo: true },
        { $set: { usuarioId: usuario._id, fechaModificacion: fechaActual } });
    if (cambioUsuario.matchedCount !== 1 || cambioCliente.matchedCount !== 1)
        throw new ErrorSolicitud(409, 'La vinculación cambió durante la operación. Actualizá el listado.');

    responder(respuesta, 200, { mensaje: 'Cuenta vinculada correctamente.' });
}

// --- Despachador de las funciones, elige a que funcion llamar ---

export function crearGestorClientes(dependencias = {
    conectar: conectarDB, usuario: obtenerUsuarioSesion,
}) {
    return async function gestionarClientes(solicitud: IncomingMessage, respuesta: ServerResponse): Promise<void> {
        try {
            const personal = await dependencias.usuario(solicitud);
            if (!personal) throw new ErrorSolicitud(401, 'Iniciá sesión para continuar.');
            if (personal.rol !== 'ADMIN' && personal.rol !== 'ENTRENADOR')
                throw new ErrorSolicitud(403, 'No tenés permiso para acceder a clientes.');

            const ruta = solicitud.url?.split('?')[0];
            const db = await dependencias.conectar();

            if (solicitud.method === 'GET' && ruta === '/api/clientes') {
                await listarClientes(db, respuesta);
                return;
            }

            if (solicitud.method !== 'POST') throw new ErrorSolicitud(405, 'Método no permitido.');
            if (personal.rol !== 'ADMIN') throw new ErrorSolicitud(403, 'Esta acción requiere permisos de administrador.');

            const datos = await leerJSON(solicitud, 16384);

            if (ruta === '/api/clientes' || ruta === '/api/clientes/editar') {
                await crearOEditarCliente(db, datos, ruta === '/api/clientes/editar', respuesta);
                return;
            }
            if (ruta === '/api/clientes/desactivar' || ruta === '/api/clientes/reactivar') {
                await cambiarEstadoCliente(db, datos, ruta.endsWith('/reactivar'), personal, respuesta);
                return;
            }
            if (ruta === '/api/clientes/vincular') {
                await vincularCliente(db, datos, respuesta);
                return;
            }

            throw new ErrorSolicitud(404, 'Ruta no encontrada.');
        } catch (error) {
            if (error instanceof ErrorSolicitud) {
                responder(respuesta, error.estado, { mensaje: error.message, campos: error.campos });
                return;
            }
            if (error instanceof MongoServerError && error.code === 11000) {
                const esDni = Boolean(error.keyPattern?.dni);
                responder(respuesta, 409, {
                    mensaje: esDni ? 'Ya existe un cliente con ese DNI.' : 'La cuenta o la ficha ya tienen una vinculación.',
                    campos: esDni ? ['dni'] : ['correoCuenta'],
                });
                return;
            }
            responder(respuesta, 500, { mensaje: 'No pudimos completar la operación. Intentá nuevamente.' });
        }
    };
}

export const gestionarClientes = crearGestorClientes();