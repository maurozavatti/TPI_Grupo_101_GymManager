import { prepararPanel } from '../../panel/estructura.ts'
import { solicitarAPI } from '../../servicios/api.ts'

interface Perfil {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: string | null
  telefono: string
  email: string
  direccion: string
  activo: boolean
}

interface EjercicioRutina {
  orden: number
  series: number
  repeticiones: number
  peso: number
  descanso: number
  observaciones: string
  ejercicio: { nombre: string; grupoMuscular: string } | null
}

interface Rutina {
  fechaAsignacion: string
  observaciones: string
  ejercicios: EjercicioRutina[]
}

interface Turno {
  dia: string
  horaInicio: string
  horaFin: string
  entrenador: string
}

const usuario = await prepararPanel('Mi perfil', ['USUARIO'])

if (usuario) {
  const el = <T extends HTMLElement>(selector: string): T => {
    const resultado = document.querySelector<T>(selector)
    if (!resultado) throw new Error(`Falta el elemento ${selector}`)
    return resultado
  }
  const mensaje = el<HTMLParagraphElement>('#mensaje-perfil')
  const formatoFecha = (valor: string | null): string => {
    if (!valor) return 'Sin informar'
    const fecha = new Date(valor)
    return Number.isNaN(fecha.getTime()) ? 'Sin informar' : fecha.toLocaleDateString('es-AR')
  }

  try {
    const { cliente } = await solicitarAPI<{ cliente: Perfil | null }>('/api/perfil')
    if (!cliente) {
      el<HTMLElement>('#sin-ficha').hidden = false
      mensaje.textContent = ''
    } else {
      el<HTMLElement>('#contenido-perfil').hidden = false
      el<HTMLElement>('#nombre-cliente').textContent = `${cliente.nombre} ${cliente.apellido}`
      el<HTMLElement>('#estado-cliente').textContent = cliente.activo ? 'Ficha activa' : 'Ficha inactiva'
      el<HTMLElement>('#dni-cliente').textContent = cliente.dni || 'Sin informar'
      el<HTMLElement>('#nacimiento-cliente').textContent = formatoFecha(cliente.fechaNacimiento)
      el<HTMLElement>('#telefono-cliente').textContent = cliente.telefono || 'Sin informar'
      el<HTMLElement>('#email-cliente').textContent = cliente.email || 'Sin informar'
      el<HTMLElement>('#direccion-cliente').textContent = cliente.direccion || 'Sin informar'

      const [rutinaResultado, turnosResultado] = await Promise.allSettled([
        solicitarAPI<{ rutina: Rutina | null }>('/api/rutinas/mi'),
        solicitarAPI<{ turnos: Turno[] }>('/api/turnos/mi'),
      ])

      if (rutinaResultado.status === 'fulfilled' && rutinaResultado.value.rutina) {
        const rutina = rutinaResultado.value.rutina
        el<HTMLElement>('#detalle-rutina').hidden = false
        el<HTMLElement>('#imprimir-rutina').hidden = false
        el<HTMLElement>('#fecha-rutina').textContent = `Asignada el ${formatoFecha(rutina.fechaAsignacion)}`
        el<HTMLElement>('#observaciones-rutina').textContent = rutina.observaciones || 'Sin observaciones generales.'
        const cuerpo = el<HTMLTableSectionElement>('#ejercicios-rutina')
        for (const ejercicio of rutina.ejercicios) {
          const fila = document.createElement('tr')
          const valores = [
            String(ejercicio.orden),
            ejercicio.ejercicio?.nombre ?? 'Ejercicio no disponible',
            String(ejercicio.series),
            String(ejercicio.repeticiones),
            `${ejercicio.peso} kg`,
            `${ejercicio.descanso} s`,
            ejercicio.observaciones || '—',
          ]
          for (const valor of valores) {
            const celda = document.createElement('td')
            celda.textContent = valor
            fila.append(celda)
          }
          cuerpo.append(fila)
        }
        el<HTMLButtonElement>('#imprimir-rutina').addEventListener('click', () => window.print())
      } else {
        el<HTMLElement>('#mensaje-rutina').textContent = rutinaResultado.status === 'rejected'
          ? 'No pudimos consultar tu rutina.'
          : 'Todavía no tenés una rutina vigente.'
      }

      const listaTurnos = el<HTMLUListElement>('#lista-turnos')
      if (turnosResultado.status === 'fulfilled' && turnosResultado.value.turnos.length) {
        for (const turno of turnosResultado.value.turnos) {
          const item = document.createElement('li')
          item.textContent = `${turno.dia}: ${turno.horaInicio} a ${turno.horaFin} · Entrenador/a: ${turno.entrenador}`
          listaTurnos.append(item)
        }
      } else {
        el<HTMLElement>('#mensaje-turno').textContent = turnosResultado.status === 'rejected'
          ? 'No pudimos consultar tu turno.'
          : 'No tenés un turno semanal asignado.'
      }
      mensaje.textContent = ''
    }
  } catch (error) {
    mensaje.textContent = error instanceof Error ? error.message : 'No se pudo cargar el perfil.'
    mensaje.classList.add('estado-error')
  }
}
