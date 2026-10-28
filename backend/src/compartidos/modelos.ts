import type { Document, ObjectId } from 'mongodb';

export interface Turno {
    dia: string;
    horaInicio: string;
    horaFin: string;
    capacidad: number;
    entrenadorId: ObjectId;
    activo: boolean;
    observaciones?: string;
    origen?: string;
    clientes: ObjectId[];
    historialClientes: Document[];
}