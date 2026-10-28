import type { Document, ObjectId } from 'mongodb';

import type { ObjectId as ObjectIdType } from 'mongodb';

export interface ConfiguracionAgenda {
    franjas: { inicio: string; fin: string }[];
    capacidad: number;
    trabajos: { entrenadorId: ObjectIdType; dias: string[] }[];
}

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