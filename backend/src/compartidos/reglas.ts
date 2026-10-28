import { ErrorHTTP } from './http.ts';

export const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

export function validarHorario(inicio: string, fin: string): void {
    const patron = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!patron.test(inicio) || !patron.test(fin) || inicio >= fin) {
        throw new ErrorHTTP(400, 'El horario final debe ser posterior al inicial.', ['horaInicio', 'horaFin']);
    }
}