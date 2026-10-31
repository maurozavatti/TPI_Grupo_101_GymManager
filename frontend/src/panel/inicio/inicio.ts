import { prepararPanel } from '../estructura.ts'
import { solicitarAPI } from '../../servicios/api.ts'

/* Estos son los datos que devuelve el backend en /api/resumen.
 El bloque administrativo viene null cuando quien consulta
 es Entrenador, porque ese detalle es exclusivo de ADMIN. */
interface ResumenTurnoHoy {
  horaInicio: string
  horaFin: string
  ocupacion: number
  capacidad: number
}

interface Resumen {
  turnosHoy: {
    turnos: ResumenTurnoHoy[]
    ocupacionPorcentaje: number
  }
  administrativo: {
    clientesActivos: number
    ingresosMes: number
    cuotasVencidas: number
    cuotasProximasAVencer: number
  } | null
}

const usuario = await prepararPanel('Inicio')

if (usuario) {
  function elemento<Elemento extends Element>(selector: string): Elemento {
    const encontrado = document.querySelector<Elemento>(selector)
    if (!encontrado) throw new Error(`Falta el elemento ${selector} en la pantalla de inicio`)
    return encontrado
  }

  const saludo = elemento<HTMLParagraphElement>('#saludo-inicio')
  const mensaje = elemento<HTMLParagraphElement>('#mensaje-inicio')
  const tarjetasAdmin = elemento<HTMLDivElement>('#tarjetas-admin')
  const metricaClientes = elemento<HTMLSpanElement>('#metrica-clientes')
  const metricaOcupacion = elemento<HTMLSpanElement>('#metrica-ocupacion')
  const metricaIngresos = elemento<HTMLSpanElement>('#metrica-ingresos')
  const metricaVencidas = elemento<HTMLSpanElement>('#metrica-vencidas')
  const metricaProximas = elemento<HTMLSpanElement>('#metrica-proximas')
  const tituloTurnosHoy = elemento<HTMLHeadingElement>('#titulo-turnos-hoy')
  const cuerpoTablaTurnosHoy = elemento<HTMLTableSectionElement>('#cuerpo-tabla-turnos-hoy')

  saludo.textContent = `Hola, ${usuario.nombre}`
  tituloTurnosHoy.textContent = usuario.rol === 'ADMIN' ? 'Turnos de hoy' : 'Tus turnos de hoy'

  function dibujarTurnosHoy(turnos: ResumenTurnoHoy[]): void {
    cuerpoTablaTurnosHoy.replaceChildren()

    if (turnos.length === 0) {
      const fila = document.createElement('tr')
      const celda = document.createElement('td')
      celda.colSpan = 2
      celda.textContent = 'No hay turnos programados para hoy.'
      fila.append(celda)
      cuerpoTablaTurnosHoy.append(fila)
      return
    }

    for (const turno of turnos) {
      const fila = document.createElement('tr')

      const celdaHorario = document.createElement('td')
      celdaHorario.textContent = `${turno.horaInicio} a ${turno.horaFin}`

      const celdaOcupacion = document.createElement('td')
      celdaOcupacion.textContent = `${turno.ocupacion} / ${turno.capacidad}`

      fila.append(celdaHorario, celdaOcupacion)
      cuerpoTablaTurnosHoy.append(fila)
    }
  }

  async function cargarResumen(): Promise<void> {
    mensaje.textContent = 'Cargando resumen...'

    try {
      const datos = await solicitarAPI<{ resumen: Resumen }>('/api/resumen')
      mensaje.textContent = ''

      dibujarTurnosHoy(datos.resumen.turnosHoy.turnos)

      if (datos.resumen.administrativo) {
        tarjetasAdmin.hidden = false
        metricaClientes.textContent = String(datos.resumen.administrativo.clientesActivos)
        metricaOcupacion.textContent = `${datos.resumen.turnosHoy.ocupacionPorcentaje}%`
        metricaIngresos.textContent = datos.resumen.administrativo.ingresosMes.toLocaleString('es-AR', {
          style: 'currency',
          currency: 'ARS',
          maximumFractionDigits: 0,
        })
        metricaVencidas.textContent = String(datos.resumen.administrativo.cuotasVencidas)
        metricaProximas.textContent = String(datos.resumen.administrativo.cuotasProximasAVencer)
      }
    } catch (error) {
      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo cargar el resumen de inicio.'
    }
  }

  await cargarResumen()
}
