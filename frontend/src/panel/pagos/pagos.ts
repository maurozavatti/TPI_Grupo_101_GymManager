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
  const buscarCliente = elemento<HTMLInputElement>('#buscar-pago-cliente')
  const botonNuevoPago = elemento<HTMLButtonElement>('#boton-nuevo-pago')
  const botonMesAnterior = elemento<HTMLButtonElement>('#mes-anterior')
  const botonMesSiguiente = elemento<HTMLButtonElement>('#mes-siguiente')
  const textoMesActual = elemento<HTMLSpanElement>('#mes-actual-texto')
  const grillaCalendario = elemento<HTMLDivElement>('#calendario-grilla')
  const botonVerTodoMes = elemento<HTMLButtonElement>('#boton-ver-todo-mes')

  /* Guardamos el ultimo listado pedido al backend para poder filtrarlo
   en vivo por nombre, sin pedirlo de nuevo en cada tecla. */
  let pagosCargados: Pago[] = []

  /* El mes que se esta mirando (1 = enero). Arranca en el mes actual
   y se mueve con los botones < y >, sin salir de esta pantalla. */
  const hoy = new Date()
  let anioActual = hoy.getFullYear()
  let mesActual = hoy.getMonth() + 1

  /* Dia puntual elegido en el calendario (1-31), dentro del mes que se
   esta mirando. null = no hay ningun dia elegido, se ve el mes entero. */
  let diaSeleccionado: number | null = null

  function formatoMes(anio: number, mes: number): string {
    return `${anio}-${String(mes).padStart(2, '0')}`
  }

  function actualizarTextoMes(): void {
    const texto = new Date(anioActual, mesActual - 1, 1)
      .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    textoMesActual.textContent = texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  function cambiarMes(delta: number): void {
    mesActual += delta
    if (mesActual < 1) {
      mesActual = 12
      anioActual -= 1
    } else if (mesActual > 12) {
      mesActual = 1
      anioActual += 1
    }
    diaSeleccionado = null
    botonVerTodoMes.hidden = true
    actualizarTextoMes()
    void cargarPagos()
  }

  function normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  /* Fecha de un pago (fechaPago o fechaVencimiento) en formato
   AAAA-MM-DD y horario argentino, para compararla con un dia del
   calendario. null si el pago no tiene esa fecha. */
  function fechaArgentinaISO(valor: string | null): string | null {
    if (!valor) return null
    return new Date(valor).toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })
  }

  function pagoPerteneceAlDia(pago: Pago, diaISO: string): boolean {
    return fechaArgentinaISO(pago.fechaPago) === diaISO || fechaArgentinaISO(pago.fechaVencimiento) === diaISO
  }

  /* Combina el filtro de texto (cliente) con el dia elegido en el
   calendario, si hay uno, y vuelve a dibujar la tabla. */
  function aplicarFiltros(): void {
    const busqueda = normalizarTexto(buscarCliente.value.trim())
    const diaISO = diaSeleccionado !== null ? `${formatoMes(anioActual, mesActual)}-${String(diaSeleccionado).padStart(2, '0')}` : null

    const filtrados = pagosCargados.filter((pago) => {
      if (diaISO && !pagoPerteneceAlDia(pago, diaISO)) return false
      if (!busqueda) return true
      const nombre = nombresClientes.get(pago.clienteId) ?? ''
      return normalizarTexto(nombre).includes(busqueda)
    })

    dibujarTabla(filtrados)
  }

  /* Dibuja la grilla de dias del mes elegido. Cada dia con algun pago
   o vencimiento queda marcado con un punto; al hacer click se filtra
   la tabla a ese dia (ver aplicarFiltros). */
  function dibujarCalendario(): void {
    grillaCalendario.replaceChildren()

    const diasEnElMes = new Date(anioActual, mesActual, 0).getDate()
    /* getDay() da 0 = domingo. Acomodamos para que la semana arranque
     en lunes, como se la muestra en el encabezado L M M J V S D. */
    const primerDiaSemana = (new Date(anioActual, mesActual - 1, 1).getDay() + 6) % 7

    for (let i = 0; i < primerDiaSemana; i++) {
      grillaCalendario.append(document.createElement('span'))
    }

    for (let dia = 1; dia <= diasEnElMes; dia++) {
      const diaISO = `${formatoMes(anioActual, mesActual)}-${String(dia).padStart(2, '0')}`
      const tieneActividad = pagosCargados.some(pago => pagoPerteneceAlDia(pago, diaISO))

      const boton = document.createElement('button')
      boton.type = 'button'
      boton.className = 'dia-calendario'
      boton.textContent = String(dia)
      boton.setAttribute('aria-pressed', String(diaSeleccionado === dia))
      if (tieneActividad) boton.classList.add('dia-con-pago')
      if (diaSeleccionado === dia) boton.classList.add('dia-seleccionado')
      boton.addEventListener('click', () => seleccionarDia(dia))
      grillaCalendario.append(boton)
    }
  }

  function seleccionarDia(dia: number): void {
    diaSeleccionado = diaSeleccionado === dia ? null : dia
    botonVerTodoMes.hidden = diaSeleccionado === null
    dibujarCalendario()
    aplicarFiltros()
  }

  function verTodoElMes(): void {
    diaSeleccionado = null
    botonVerTodoMes.hidden = true
    dibujarCalendario()
    aplicarFiltros()
  }

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

    selectClienteId.replaceChildren()

    for (const cliente of datos.clientes) {
      if (cliente.activo) selectClienteId.append(crearOpcion(cliente.id, `${cliente.apellido}, ${cliente.nombre}`))
    }
  }

  function crearOpcion(valor: string, texto: string): HTMLOptionElement {
    const opcion = document.createElement('option')
    opcion.value = valor
    opcion.textContent = texto
    return opcion
  }

  /* Pide al backend los pagos del mes elegido y vuelve a dibujar el
   calendario y la tabla. El filtrado por cliente y por dia se hace en
   vivo sobre ese listado, sin pedirle nada mas al backend (ver
   aplicarFiltros). */
  async function cargarPagos(): Promise<void> {
    mensaje.textContent = 'Cargando pagos...'

    try {
      const mes = formatoMes(anioActual, mesActual)
      const datos = await solicitarAPI<{ pagos: Pago[] }>(`/api/pagos?mes=${mes}`)
      mensaje.textContent = ''
      pagosCargados = datos.pagos
      dibujarCalendario()
      aplicarFiltros()
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
  buscarCliente.addEventListener('input', aplicarFiltros)
  botonMesAnterior.addEventListener('click', () => cambiarMes(-1))
  botonMesSiguiente.addEventListener('click', () => cambiarMes(1))
  botonVerTodoMes.addEventListener('click', verTodoElMes)

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

  actualizarTextoMes()
  await cargarClientes()
  await cargarPagos()
}