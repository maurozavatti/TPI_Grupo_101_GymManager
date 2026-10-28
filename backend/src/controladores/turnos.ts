import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import { conectarDB } from '../db.ts';
import { obtenerUsuarioSesion } from './sesion.ts';
import { ErrorHTTP as ErrorSolicitud, responder, leerJSON, texto as leerTexto, identificador, entero } from '../compartidos/http.ts';
import { diasSemana, validarHorario } from '../compartidos/reglas.ts';
import type { Turno } from '../compartidos/modelos.ts';

type Personal = { id: string; rol: 'ADMIN' | 'ENTRENADOR' | 'USUARIO'; clienteId: string | null };

// RN-16: un Entrenador solo administra los turnos donde el mismo es el entrenador responsable.
function exigirTurnoPropio(personal: Personal, entrenadorId: ObjectId): void {
    if (personal.rol === 'ENTRENADOR' && entrenadorId.toHexString() !== personal.id)
        throw new ErrorSolicitud(403, 'Solo podés administrar tus propios turnos.');
}

async function validarEntrenador(db: Db, entrenadorId: ObjectId): Promise<void> {
    const cuenta = await db.collection('usuarios').findOne({ _id: entrenadorId, rol: 'ENTRENADOR', activo: true });
    if (!cuenta) throw new ErrorSolicitud(400, 'Seleccioná un entrenador activo.', ['entrenadorId']);
}

async function listarTurnos(db: Db, respuesta: ServerResponse): Promise<void> {
    // Sin restriccion de lectura: Admin y Entrenador ven toda la agenda (RN-16 restringe administrar, no consultar).
    const turnos = await db.collection<Turno>('turnos').find({}).sort({ dia: 1, horaInicio: 1 }).toArray();
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
    });
}

async function crearOEditarTurno(db: Db, datos: Record<string, unknown>, esEdicion: boolean, personal: Personal, respuesta: ServerResponse): Promise<void> {
    const dia = leerTexto(datos, 'dia', 20, true);
    if (!diasSemana.includes(dia)) throw new ErrorSolicitud(400, 'Seleccioná un día válido.', ['dia']);
    const horaInicio = leerTexto(datos, 'horaInicio', 5, true);
    const horaFin = leerTexto(datos, 'horaFin', 5, true);
    validarHorario(horaInicio, horaFin);
    const capacidad = entero(datos.capacidad, 'capacidad', 1, 100);
    const entrenadorId = identificador(datos.entrenadorId);
    const observaciones = leerTexto(datos, 'observaciones', 2000);

    exigirTurnoPropio(personal, entrenadorId);
    await validarEntrenador(db, entrenadorId);

    if (esEdicion) {
        const turnoId = leerTexto(datos, 'turnoId', 24, true);
        if (!/^[a-f0-9]{24}$/i.test(turnoId)) throw new ErrorSolicitud(400, 'Seleccioná un turno válido.');
        const id = new ObjectId(turnoId);
        const existente = await db.collection<Turno>('turnos').findOne({ _id: id });
        if (!existente) throw new ErrorSolicitud(404, 'El turno no existe.');
        exigirTurnoPropio(personal, existente.entrenadorId);
        if ((existente.clientes ?? []).length > capacidad)
            throw new ErrorSolicitud(409, 'El cupo no puede ser menor a la cantidad de clientes ya asignados.', ['capacidad']);
        await db.collection<Turno>('turnos').updateOne({ _id: id }, { $set: { dia, horaInicio, horaFin, capacidad, entrenadorId, observaciones } });
        responder(respuesta, 200, { mensaje: 'Turno actualizado correctamente.' });
        return;
    }

    await db.collection<Turno>('turnos').insertOne({
        dia, horaInicio, horaFin, capacidad, entrenadorId, observaciones,
        activo: true, clientes: [], historialClientes: [],
    });
    responder(respuesta, 201, { mensaje: 'Turno creado correctamente.' });
}

async function cambiarEstadoTurno(db: Db, datos: Record<string, unknown>, respuesta: ServerResponse, personal: Personal): Promise<void> {
    const turnoId = leerTexto(datos, 'turnoId', 24, true);
    if (!/^[a-f0-9]{24}$/i.test(turnoId)) throw new ErrorSolicitud(400, 'Seleccioná un turno válido.');
    const activo = datos.activo;
    if (typeof activo !== 'boolean') throw new ErrorSolicitud(400, 'El estado no es válido.');

    const turno = await db.collection<Turno>('turnos').findOne({ _id: new ObjectId(turnoId) });
    if (!turno) throw new ErrorSolicitud(404, 'El turno no existe.');
    exigirTurnoPropio(personal, turno.entrenadorId);

    await db.collection<Turno>('turnos').updateOne({ _id: turno._id }, { $set: { activo } });
    responder(respuesta, 200, { mensaje: activo ? 'Turno reactivado.' : 'Turno dado de baja.' });
}

async function asignarORetirarCliente(db: Db, datos: Record<string, unknown>, asignar: boolean, personal: Personal, respuesta: ServerResponse): Promise<void> {
    const turnoId = identificador(datos.turnoId);
    const clienteId = identificador(datos.clienteId);
    const turno = await db.collection<Turno>('turnos').findOne({ _id: turnoId });
    if (!turno) throw new ErrorSolicitud(404, 'El turno no existe.');
    exigirTurnoPropio(personal, turno.entrenadorId);

    if (asignar) {
        if (!turno.activo) throw new ErrorSolicitud(409, 'El turno está inactivo.');
        if ((turno.clientes ?? []).some((id: ObjectId) => id.equals(clienteId)))
            throw new ErrorSolicitud(409, 'El cliente ya está asignado a este turno.');
        if ((turno.clientes ?? []).length >= turno.capacidad)
            throw new ErrorSolicitud(409, 'El turno ya alcanzó su cupo máximo.');
        const cliente = await db.collection('clientes').findOne({ _id: clienteId, activo: true });
        if (!cliente) throw new ErrorSolicitud(404, 'El cliente no existe o está inactivo.');
    }
    else if (!(turno.clientes ?? []).some((id: ObjectId) => id.equals(clienteId))) {
        throw new ErrorSolicitud(409, 'El cliente no está asignado a este turno.');
    }

    await db.collection<Turno>('turnos').updateOne({ _id: turnoId }, {
        ...(asignar ? { $addToSet: { clientes: clienteId } } : { $pull: { clientes: clienteId } }),
        $push: { historialClientes: { clienteId, accion: asignar ? 'ASIGNACION' : 'RETIRO', fecha: new Date(), usuarioId: new ObjectId(personal.id) } },
    });
    responder(respuesta, 200, { mensaje: asignar ? 'Cliente asignado al turno.' : 'Cliente retirado del turno.' });
}

export function crearGestorTurnos(dependencias = {
    conectar: conectarDB, usuario: obtenerUsuarioSesion,
}) {
    return async function gestionarTurnos(solicitud: IncomingMessage, respuesta: ServerResponse): Promise<void> {
        try {
            const personal = await dependencias.usuario(solicitud);
            if (!personal) throw new ErrorSolicitud(401, 'Iniciá sesión para continuar.');
            if (personal.rol !== 'ADMIN' && personal.rol !== 'ENTRENADOR')
                throw new ErrorSolicitud(403, 'No tenés permiso para acceder a turnos.');

            const ruta = solicitud.url?.split('?')[0];
            const db = await dependencias.conectar();

            if (solicitud.method === 'GET' && ruta === '/api/turnos') {
                await listarTurnos(db, respuesta);
                return;
            }

            if (solicitud.method !== 'POST') throw new ErrorSolicitud(405, 'Método no permitido.');
            const datos = await leerJSON(solicitud, 16384);

            if (ruta === '/api/turnos' || ruta === '/api/turnos/editar') {
                await crearOEditarTurno(db, datos, ruta === '/api/turnos/editar', personal, respuesta);
                return;
            }
            if (ruta === '/api/turnos/estado') {
                await cambiarEstadoTurno(db, datos, respuesta, personal);
                return;
            }
            if (ruta === '/api/turnos/asignar' || ruta === '/api/turnos/retirar') {
                await asignarORetirarCliente(db, datos, ruta.endsWith('/asignar'), personal, respuesta);
                return;
            }

            throw new ErrorSolicitud(404, 'Ruta no encontrada.');
        } catch (error) {
            if (error instanceof ErrorSolicitud) {
                responder(respuesta, error.estado, { mensaje: error.message, campos: error.campos });
                return;
            }
            responder(respuesta, 500, { mensaje: 'No pudimos completar la operación. Intentá nuevamente.' });
        }
    };
}

export const gestionarTurnos = crearGestorTurnos();