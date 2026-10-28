import type { IncomingMessage, ServerResponse } from 'node:http';
import { ObjectId } from 'mongodb';

export class ErrorHTTP extends Error {
    estado: number;
    campos: string[];
    constructor(estado: number, mensaje: string, campos: string[] = []) {
        super(mensaje);
        this.estado = estado;
        this.campos = campos;
    }
}

export function responder(res: ServerResponse, estado: number, datos: unknown): void {
    res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(datos));
}

export async function leerJSON(req: IncomingMessage, limiteBytes = 65536): Promise<Record<string, unknown>> {
    if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        throw new ErrorHTTP(415, 'Enviá los datos en formato JSON.');
    }
    let cuerpo = '';
    let grande = false;
    req.setEncoding('utf8');
    for await (const parte of req) {
        if (grande) continue;
        cuerpo += parte;
        if (Buffer.byteLength(cuerpo) > limiteBytes) {
            grande = true;
            cuerpo = '';
        }
    }
    if (grande) throw new ErrorHTTP(413, 'Los datos enviados son demasiado extensos.');
    let datos: unknown;
    try {
        datos = JSON.parse(cuerpo);
    } catch {
        throw new ErrorHTTP(400, 'El formato JSON no es válido.');
    }
    if (!datos || typeof datos !== 'object' || Array.isArray(datos))
        throw new ErrorHTTP(400, 'Los datos no son válidos.');
    return datos as Record<string, unknown>;
}

export function texto(datos: Record<string, unknown>, campo: string, maximo = 200, obligatorio = false): string {
    const valor = datos[campo] ?? '';
    if (typeof valor !== 'string' || valor.trim().length > maximo || (obligatorio && !valor.trim())) {
        throw new ErrorHTTP(400, `Revisá el campo ${campo}.`, [campo]);
    }
    return valor.trim();
}

export function identificador(valor: unknown): ObjectId {
    if (typeof valor !== 'string' || !/^[a-f0-9]{24}$/i.test(valor))
        throw new ErrorHTTP(400, 'El identificador no es válido.');
    return new ObjectId(valor);
}

export function entero(valor: unknown, campo: string, minimo: number, maximo: number): number {
    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < minimo || valor > maximo) {
        throw new ErrorHTTP(400, `Revisá el campo ${campo}.`, [campo]);
    }
    return valor;
}

// Fechas de calendario: medianoche argentina
export function fechaArgentina(valor: unknown, campo: string, finDelDia = false): Date {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor))
        throw new ErrorHTTP(400, 'Ingresá una fecha válida.', [campo]);
    const fecha = new Date(`${valor}T${finDelDia ? '23:59:59.999' : '00:00:00.000'}-03:00`);
    if (!Number.isFinite(fecha.getTime()) || fecha.toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }) !== valor) {
        throw new ErrorHTTP(400, 'Ingresá una fecha válida.', [campo]);
    }
    return fecha;
}