import { prepararPanel } from '../estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { validarFormulario } from '../../autenticacion/validaciones.ts'

/* Estos son los datos de cada pago tal como los devuelve
 el backend en /api/pagos. */
interface Pago {
  id: string
  clienteId: string
  tipo: 'INSCRIPCION' | 'CUOTA'
  monto: number
  fechaPago: string | null
  fechaVencimiento: string | null
  estado: 'PAGADO' | 'PENDIENTE' | 'VENCIDO'
  observaciones: string
}

interface ClienteOpcion {
  id: string
  nombre: string
  apellido: string
  activo: boolean
}

function formatearFecha(valor: string | null): string {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-AR')
}

function textoEstado(estado: Pago['estado']): string {
  if (estado === 'PAGADO') return 'Pagado'
  if (estado === 'VENCIDO') return 'Vencido'
  return 'Pendiente'
}

function claseEstado(estado: Pago['estado']): string {
  if (estado === 'PAGADO') return 'etiqueta-pagado'
  if (estado === 'VENCIDO') return 'etiqueta-vencido'
  return 'etiqueta-pendiente'
}

/* Solo el Administrador accede a este modulo, igual que lo
 exige el backend en pagos.ts. */
const usuario = await prepararPanel('Pagos', ['ADMIN'])

if (usuario) {
  function elemento<Elemento extends Element>(selector: string): Elemento {
    const encontrado = document.querySelector<Elemento>(selector)
    if (!encontrado) throw new Error(`Falta el elemento ${selector} en la pantalla de pagos`)
    return encontrado
  }

  const mensaje = elemento<HTMLParagraphElement>('#mensaje-pagos')
  const cuerpoTabla = elemento<HTMLTableSectionElement>('#cuerpo-tabla-pagos')
  const filtroCliente = elemento<HTMLSelectElement>('#filtroCliente')
  const botonNuevoPago = elemento<HTMLButtonElement>('#boton-nuevo-pago')

  const formularioPago = elemento<HTMLFormElement>('#formulario-pago')
  const mensajeFormularioPago = elemento<HTMLParagraphElement>('#mensaje-formulario-pago')
  const selectClienteId = elemento<HTMLSelectElement>('#clienteId')
  const campoFechaVencimiento = elemento<HTMLInputElement>('#fechaVencimiento')
  const campoPagado = elemento<HTMLInputElement>('#pagado')
  const botonCancelarPago = elemento<HTMLButtonElement>('#boton-cancelar-pago')

  /* Guardamos los nombres por id para no pedirlos de nuevo
   cada vez que dibujamos la tabla. */
  let nombresClientes = new Map<string, string>()

  function ocultarFormulario(): void {
    formularioPago.hidden = true
    mensajeFormularioPago.textContent = ''
  }

  function abrirFormulario(): void {
    formularioPago.reset()
    mensajeFormularioPago.textContent = ''
    formularioPago.hidden = false
  }

  /* Carga el listado de clientes para el filtro y para el select
   del formulario de alta. Se reutiliza /api/clientes. */
  async function cargarClientes(): Promise<void> {
    const datos = await solicitarAPI<{ clientes: ClienteOpcion[] }>('/api/clientes')
    nombresClientes = new Map(datos.clientes.map(c => [c.id, `${c.apellido}, ${c.nombre}`]))

    filtroCliente.replaceChildren(crearOpcion('', 'Todos los clientes'))
    selectClienteId.replaceChildren()

    for (const cliente of datos.clientes) {
      filtroCliente.append(crearOpcion(cliente.id, `${cliente.apellido}, ${cliente.nombre}`))
      if (cliente.activo) selectClienteId.append(crearOpcion(cliente.id, `${cliente.apellido}, ${cliente.nombre}`))
    }
  }

  function crearOpcion(valor: string, texto: string): HTMLOptionElement {
    const opcion = document.createElement('option')
    opcion.value = valor
    opcion.textContent = texto
    return opcion
  }

  /* Pide los pagos al backend, filtrando por cliente cuando
   corresponde, y vuelve a dibujar la tabla. */
  async function cargarPagos(): Promise<void> {
    mensaje.textContent = 'Cargando pagos...'

    try {
      const ruta = filtroCliente.value
        ? `/api/pagos?clienteId=${encodeURIComponent(filtroCliente.value)}`
        : '/api/pagos'
      const datos = await solicitarAPI<{ pagos: Pago[] }>(ruta)
      mensaje.textContent = ''
      dibujarTabla(datos.pagos)
    } catch (error) {
      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo cargar el listado de pagos.'
    }
  }

  function dibujarTabla(pagos: Pago[]): void {
    cuerpoTabla.replaceChildren()

    if (pagos.length === 0) {
      const fila = document.createElement('tr')
      const celda = document.createElement('td')
      celda.colSpan = 7
      celda.textContent = 'Todavía no hay pagos registrados.'
      fila.append(celda)
      cuerpoTabla.append(fila)
      return
    }

    for (const pago of pagos) cuerpoTabla.append(dibujarFila(pago))
  }

  function dibujarFila(pago: Pago): HTMLTableRowElement {
    const fila = document.createElement('tr')

    const celdaCliente = document.createElement('td')
    celdaCliente.textContent = nombresClientes.get(pago.clienteId) ?? pago.clienteId

    const celdaTipo = document.createElement('td')
    celdaTipo.textContent = pago.tipo === 'INSCRIPCION' ? 'Inscripción' : 'Cuota'

    const celdaMonto = document.createElement('td')
    celdaMonto.textContent = pago.monto.toLocaleString('es-AR')

    const celdaFechaPago = document.createElement('td')
    celdaFechaPago.textContent = formatearFecha(pago.fechaPago)

    const celdaVencimiento = document.createElement('td')
    celdaVencimiento.textContent = formatearFecha(pago.fechaVencimiento)

    const celdaEstado = document.createElement('td')
    const etiqueta = document.createElement('span')
    etiqueta.className = `etiqueta-estado ${claseEstado(pago.estado)}`
    etiqueta.textContent = textoEstado(pago.estado)
    celdaEstado.append(etiqueta)

    const celdaAcciones = document.createElement('td')
    if (pago.estado !== 'PAGADO') {
      const boton = document.createElement('button')
      boton.type = 'button'
      boton.className = 'boton-fila'
      boton.textContent = 'Marcar pagado'
      boton.addEventListener('click', () => marcarPagado(pago))
      celdaAcciones.append(boton)
    }

    fila.append(celdaCliente, celdaTipo, celdaMonto, celdaFechaPago, celdaVencimiento, celdaEstado, celdaAcciones)
    return fila
  }

  async function marcarPagado(pago: Pago): Promise<void> {
    const nombre = nombresClientes.get(pago.clienteId) ?? 'este cliente'
    if (!window.confirm(`¿Confirmás que ${nombre} pagó esta ${pago.tipo === 'CUOTA' ? 'cuota' : 'inscripción'}?`)) return

    mensaje.textContent = ''

    try {
      await solicitarAPI('/api/pagos/pagar', {
        method: 'POST',
        body: JSON.stringify({ pagoId: pago.id }),
      })
      await cargarPagos()
    } catch (error) {
      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo marcar el pago como pagado.'
    }
  }

  botonNuevoPago.addEventListener('click', abrirFormulario)
  botonCancelarPago.addEventListener('click', ocultarFormulario)
  filtroCliente.addEventListener('change', cargarPagos)

  /* Cuando se tilda "Ya está pagado" la fecha de vencimiento pasa
   a ser opcional, igual que lo espera el backend. */
  campoPagado.addEventListener('change', () => {
    campoFechaVencimiento.required = !campoPagado.checked
  })
  campoFechaVencimiento.required = true

  formularioPago.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    if (!validarFormulario(formularioPago, mensajeFormularioPago)) return

    const boton = formularioPago.querySelector<HTMLButtonElement>('button[type="submit"]')
    const datos = new FormData(formularioPago)
    const cuerpo = {
      ...Object.fromEntries(datos),
      /* FormData entrega todo como texto. El backend exige que
       monto sea un numero (ver entero() en compartidos/http.ts). */
      monto: Number(datos.get('monto')),
      pagado: datos.get('pagado') === 'on',
    }

    if (boton) boton.disabled = true

    try {
      await solicitarAPI('/api/pagos', {
        method: 'POST',
        body: JSON.stringify(cuerpo),
      })
      ocultarFormulario()
      await cargarPagos()
    } catch (error) {
      if (error instanceof ErrorAPI) {
        mensajeFormularioPago.textContent = error.message
        for (const campo of error.campos) {
          formularioPago.querySelector(`#${campo}`)?.setAttribute('aria-invalid', 'true')
        }
      } else {
        mensajeFormularioPago.textContent = error instanceof Error
          ? error.message
          : 'No se pudo registrar el pago.'
      }
    } finally {
      if (boton) boton.disabled = false
    }
  })

  await cargarClientes()
  await cargarPagos()
}
