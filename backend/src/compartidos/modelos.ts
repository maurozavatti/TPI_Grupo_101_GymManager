import type { ObjectId } from 'mongodb'

export interface ConfiguracionAgenda {
    franjas: { inicio: string; fin: string }[]
    capacidad: number
    trabajos: { entrenadorId: ObjectId; dias: string[] }[]
}

export interface Turno {
    _id: ObjectId
    dia: string
    horaInicio: string
    horaFin: string
    capacidad: number
    entrenadorId: ObjectId
    activo: boolean
    observaciones?: string
    clientes: ObjectId[]
    historialClientes: {
        clienteId: ObjectId
        accion: string
        fecha: Date
        usuarioId: ObjectId
    }[]
}