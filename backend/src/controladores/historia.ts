import type { IncomingMessage, ServerResponse } from 'node:http'
import { ObjectId, type Db } from 'mongodb'
import { conectarDB } from '../db.ts'
import { ErrorHTTP, identificador, leerJSON, responder, texto } from '../compartidos/http.ts'
import { incluyeRol } from '../servicios/roles.ts'
import { obtenerUsuarioSesion } from './sesion.ts'

type HistoriaClinica = {
  antecedentes: string
  lesiones: string
  observaciones: string
  fechaActualizacion: Date
  usuarioModificacionId: ObjectId
}

async function resolverCliente(
  db: Db,
  usuario: NonNullable<Awaited<ReturnType<typeof obtenerUsuarioSesion>>>,
  clienteSolicitado: unknown,
) {
  const esPersonal = incluyeRol(usuario.rol, ['ADMIN', 'ENTRENADOR'])
  let clienteId: ObjectId

  if (esPersonal) {
    clienteId = identificador(clienteSolicitado)
  } else {
    if (!incluyeRol(usuario.rol, ['USUARIO'])) {
      throw new ErrorHTTP(403, 'No tenés permiso para acceder a historias clínicas.')
    }
    if (!usuario.clienteId) {
      throw new ErrorHTTP(404, 'Tu cuenta todavía no está vinculada a una ficha de cliente.')
    }
    clienteId = new ObjectId(usuario.clienteId)
    if (clienteSolicitado !== undefined && clienteSolicitado !== clienteId.toHexString()) {
      throw new ErrorHTTP(403, 'Solo podés acceder a tu propia historia clínica.')
    }
  }

  const cliente = await db.collection('clientes').findOne(
    { _id: clienteId },
    { projection: { nombre: 1, apellido: 1, dni: 1, activo: 1, historiaClinica: 1 } },
  )
  if (!cliente) throw new ErrorHTTP(404, 'No encontramos la ficha del cliente.')
  return cliente
}

async function responderHistoria(
  db: Db,
  usuario: NonNullable<Awaited<ReturnType<typeof obtenerUsuarioSesion>>>,
  clienteSolicitado: unknown,
  respuesta: ServerResponse,
): Promise<void> {
  const cliente = await resolverCliente(db, usuario, clienteSolicitado)
  const historia = cliente.historiaClinica as HistoriaClinica | undefined
  let modificadoPor: string | null = null

  if (historia?.usuarioModificacionId instanceof ObjectId) {
    const autor = await db.collection('usuarios').findOne(
      { _id: historia.usuarioModificacionId },
      { projection: { nombre: 1, apellido: 1 } },
    )
    if (autor) modificadoPor = `${autor.nombre ?? ''} ${autor.apellido ?? ''}`.trim()
  }

  responder(respuesta, 200, {
    cliente: {
      id: cliente._id.toHexString(),
      nombre: cliente.nombre ?? '',
      apellido: cliente.apellido ?? '',
      dni: cliente.dni ?? '',
      activo: cliente.activo === true,
    },
    historiaClinica: historia
      ? {
          antecedentes: historia.antecedentes ?? '',
          lesiones: historia.lesiones ?? '',
          observaciones: historia.observaciones ?? '',
          fechaActualizacion: historia.fechaActualizacion ?? null,
          modificadoPor,
        }
      : null,
  })
}

export async function gestionarHistoria(
  solicitud: IncomingMessage,
  respuesta: ServerResponse,
): Promise<void> {
  try {
    const usuario = await obtenerUsuarioSesion(solicitud)
    if (!usuario) throw new ErrorHTTP(401, 'Iniciá sesión para continuar.')
    const db = await conectarDB()
    const url = new URL(solicitud.url ?? '/', 'http://localhost')

    if (solicitud.method === 'GET') {
      await responderHistoria(db, usuario, url.searchParams.get('clienteId') ?? undefined, respuesta)
      return
    }
    if (solicitud.method !== 'POST') throw new ErrorHTTP(405, 'Método no permitido.')

    const datos = await leerJSON(solicitud, 16384)
    const cliente = await resolverCliente(db, usuario, datos.clienteId)
    const historia: HistoriaClinica = {
      antecedentes: texto(datos, 'antecedentes', 4000),
      lesiones: texto(datos, 'lesiones', 4000),
      observaciones: texto(datos, 'observaciones', 4000),
      fechaActualizacion: new Date(),
      usuarioModificacionId: new ObjectId(usuario.id),
    }
    if (!historia.antecedentes && !historia.lesiones && !historia.observaciones) {
      throw new ErrorHTTP(400, 'Completá al menos un campo de la historia clínica.', [
        'antecedentes', 'lesiones', 'observaciones',
      ])
    }

    const cambio = await db.collection('clientes').updateOne(
      { _id: cliente._id },
      { $set: { historiaClinica: historia, fechaModificacion: historia.fechaActualizacion } },
    )
    if (cambio.matchedCount !== 1) throw new ErrorHTTP(409, 'La ficha cambió. Actualizá la pantalla.')

    await responderHistoria(db, usuario, cliente._id.toHexString(), respuesta)
  } catch (error) {
    const estado = error instanceof ErrorHTTP ? error.estado : 500
    const mensaje = error instanceof ErrorHTTP
      ? error.message
      : 'No pudimos cargar la historia clínica. Intentá nuevamente.'
    responder(respuesta, estado, {
      mensaje,
      campos: error instanceof ErrorHTTP ? error.campos : [],
    })
  }
}
