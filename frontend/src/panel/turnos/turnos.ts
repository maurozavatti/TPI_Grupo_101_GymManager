import { prepararPanel } from '../estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { validarFormulario } from '../../autenticacion/validaciones.ts'

/* Estos son los dias admitidos por el backend (compartidos/reglas.ts).
 El texto que ve la persona se genera a partir de este mismo valor. */
const diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

function textoDia(dia: string): string {
  return dia.charAt(0) + dia.slice(1).toLowerCase()
}

/* Estos son los datos de cada turno tal como los devuelve
 el backend en /api/turnos. */
interface Turno {
  id: string
  dia: string
  horaInicio: string
  horaFin: string
  capacidad: number
  entrenadorId: string
  activo: boolean
  observaciones: string
  ocupacion: number
}

interface Franja {
  inicio: string
  fin: string
}

interface Trabajo {
  entrenadorId: string
  dias: string[]
}

interface Configuracion {
  franjas: Franja[]
  capacidad: number
  trabajos: Trabajo[]
}

interface ClienteOpcion {
  id: string
  nombre: string
  apellido: string
  activo: boolean
}

const usuario = await prepararPanel('Turnos')

if (usuario) {
  /* Repetimos la referencia en una constante del bloque para que las
   funciones definidas mas abajo no pierdan el estrechamiento de tipo
   (TypeScript no lo conserva dentro de funciones anidadas). */
  const sesion = usuario
  const esAdmin = sesion.rol === 'ADMIN'

  /* Comprobamos que todos los elementos existan antes de usarlos.
   Si falta alguno, la pantalla no puede funcionar. */
  function elemento<Elemento extends Element>(selector: string): Elemento {
    const encontrado = document.querySelector<Elemento>(selector)
    if (!encontrado) throw new Error(`Falta el elemento ${selector} en la pantalla de turnos`)
    return encontrado
  }

  const mensaje = elemento<HTMLParagraphElement>('#mensaje-turnos')
  const cuerpoTabla = elemento<HTMLTableSectionElement>('#cuerpo-tabla-turnos')
  const columnaSeleccion = elemento<HTMLTableCellElement>('#columna-seleccion')
  const botonNuevoTurno = elemento<HTMLButtonElement>('#boton-nuevo-turno')
  const botonGenerarAgenda = elemento<HTMLButtonElement>('#boton-generar-agenda')

  const formularioTurno = elemento<HTMLFormElement>('#formulario-turno')
  const mensajeFormularioTurno = elemento<HTMLParagraphElement>('#mensaje-formulario-turno')
  const tituloFormularioTurno = elemento<HTMLHeadingElement>('#titulo-formulario-turno')
  const campoTurnoId = elemento<HTMLInputElement>('#turnoId')
  const campoDia = elemento<HTMLSelectElement>('#dia')
  const campoEntrenadorId = elemento<HTMLInputElement>('#entrenadorId')
  const botonCancelarTurno = elemento<HTMLButtonElement>('#boton-cancelar-turno')

  const formularioGenerar = elemento<HTMLFormElement>('#formulario-generar')
  const mensajeFormularioGenerar = elemento<HTMLParagraphElement>('#mensaje-formulario-generar')
  const campoCapacidadAgenda = elemento<HTMLInputElement>('#capacidadAgenda')
  const listaFranjas = elemento<HTMLDivElement>('#lista-franjas')
  const listaTrabajos = elemento<HTMLDivElement>('#lista-trabajos')
  const botonAgregarFranja = elemento<HTMLButtonElement>('#boton-agregar-franja')
  const botonAgregarTrabajo = elemento<HTMLButtonElement>('#boton-agregar-trabajo')
  const botonCancelarGenerar = elemento<HTMLButtonElement>('#boton-cancelar-generar')

  const formularioAsignar = elemento<HTMLFormElement>('#formulario-asignar')
  const mensajeFormularioAsignar = elemento<HTMLParagraphElement>('#mensaje-formulario-asignar')
  const campoAsignarTurnoId = elemento<HTMLInputElement>('#asignarTurnoId')
  const selectClienteAsignar = elemento<HTMLSelectElement>('#clienteAsignar')
  const botonAsignarCliente = elemento<HTMLButtonElement>('#boton-asignar-cliente')
  const botonRetirarCliente = elemento<HTMLButtonElement>('#boton-retirar-cliente')
  const botonCancelarAsignar = elemento<HTMLButtonElement>('#boton-cancelar-asignar')

  const accionesLote = elemento<HTMLDivElement>('#acciones-lote')
  const contadorSeleccion = elemento<HTMLSpanElement>('#contador-seleccion')
  const botonBajaLote = elemento<HTMLButtonElement>('#boton-baja-lote')
  const botonEliminarLote = elemento<HTMLButtonElement>('#boton-eliminar-lote')

  /* Solo el Administrador puede operar en lote. Para el Entrenador
   ni siquiera mostramos la columna de seleccion. */
  if (!esAdmin) columnaSeleccion.hidden = true

  const seleccionLote = new Set<string>()

  /* Carga las opciones del select de dia, una sola vez. */
  for (const dia of diasSemana) {
    const opcion = document.createElement('option')
    opcion.value = dia
    opcion.textContent = textoDia(dia)
    campoDia.append(opcion)
  }

  function ocultarFormularios(): void {
    formularioTurno.hidden = true
    formularioGenerar.hidden = true
    formularioAsignar.hidden = true
    mensajeFormularioTurno.textContent = ''
    mensajeFormularioGenerar.textContent = ''
    mensajeFormularioAsignar.textContent = ''
  }

  /* Indica si la persona autenticada puede operar este turno puntual.
   El Administrador puede con todos; el Entrenador solo con los propios. */
  function puedeOperar(turno: Turno): boolean {
    return esAdmin || turno.entrenadorId === sesion.id
  }

  function abrirAltaTurno(): void {
    ocultarFormularios()
    formularioTurno.reset()
    campoTurnoId.value = ''
    tituloFormularioTurno.textContent = 'Nuevo turno'
    if (!esAdmin) campoEntrenadorId.value = sesion.id
    formularioTurno.hidden = false
  }

  function abrirEdicionTurno(turno: Turno): void {
    ocultarFormularios()
    formularioTurno.reset()
    campoTurnoId.value = turno.id
    tituloFormularioTurno.textContent = 'Editar turno'

    const campos: Record<string, string> = {
      dia: turno.dia,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      capacidad: String(turno.capacidad),
      entrenadorId: turno.entrenadorId,
      observaciones: turno.observaciones,
    }

    for (const [idCampo, valor] of Object.entries(campos)) {
      const campo = formularioTurno.querySelector<HTMLInputElement | HTMLSelectElement>(`#${idCampo}`)
      if (campo) campo.value = valor
    }

    formularioTurno.hidden = false
  }

  /* Pide los turnos al backend y vuelve a dibujar la tabla. */
  async function cargarTurnos(): Promise<void> {
    mensaje.textContent = 'Cargando turnos...'

    try {
      const datos = await solicitarAPI<{ turnos: Turno[] }>('/api/turnos')
      mensaje.textContent = ''
      seleccionLote.clear()
      actualizarAccionesLote()
      dibujarTabla(datos.turnos)
    } catch (error) {
      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo cargar el listado de turnos.'
    }
  }

  function actualizarAccionesLote(): void {
    accionesLote.hidden = !esAdmin || seleccionLote.size === 0
    contadorSeleccion.textContent = `${seleccionLote.size} turnos seleccionados`
  }

  function dibujarTabla(turnos: Turno[]): void {
    cuerpoTabla.replaceChildren()

    if (turnos.length === 0) {
      const fila = document.createElement('tr')
      const celda = document.createElement('td')
      celda.colSpan = esAdmin ? 8 : 7
      celda.textContent = 'Todavía no hay turnos creados.'
      fila.append(celda)
      cuerpoTabla.append(fila)
      return
    }

    for (const turno of turnos) {
      cuerpoTabla.append(dibujarFila(turno))
    }
  }

  function dibujarFila(turno: Turno): HTMLTableRowElement {
    const fila = document.createElement('tr')

    const celdaSeleccion = document.createElement('td')
    if (esAdmin) {
      const casilla = document.createElement('input')
      casilla.type = 'checkbox'
      casilla.addEventListener('change', () => {
        if (casilla.checked) seleccionLote.add(turno.id)
        else seleccionLote.delete(turno.id)
        actualizarAccionesLote()
      })
      celdaSeleccion.append(casilla)
    } else {
      celdaSeleccion.hidden = true
    }

    const celdaDia = document.createElement('td')
    celdaDia.textContent = textoDia(turno.dia)

    const celdaHorario = document.createElement('td')
    celdaHorario.textContent = `${turno.horaInicio} a ${turno.horaFin}`

    const celdaEntrenador = document.createElement('td')
    celdaEntrenador.textContent = turno.entrenadorId

    const celdaCupo = document.createElement('td')
    celdaCupo.textContent = String(turno.capacidad)

    const celdaOcupacion = document.createElement('td')
    celdaOcupacion.textContent = `${turno.ocupacion} / ${turno.capacidad}`

    const celdaEstado = document.createElement('td')
    const etiquetaEstado = document.createElement('span')
    etiquetaEstado.className = `etiqueta-estado ${turno.activo ? 'etiqueta-activo' : 'etiqueta-inactivo'}`
    etiquetaEstado.textContent = turno.activo ? 'Activo' : 'Inactivo'
    celdaEstado.append(etiquetaEstado)

    const celdaAcciones = document.createElement('td')
    if (puedeOperar(turno)) celdaAcciones.append(dibujarAcciones(turno))

    fila.append(
      celdaSeleccion, celdaDia, celdaHorario, celdaEntrenador,
      celdaCupo, celdaOcupacion, celdaEstado, celdaAcciones,
    )
    return fila
  }

  function dibujarAcciones(turno: Turno): HTMLDivElement {
    const contenedor = document.createElement('div')
    contenedor.className = 'acciones-fila'

    const botonEditar = document.createElement('button')
    botonEditar.type = 'button'
    botonEditar.className = 'boton-fila'
    botonEditar.textContent = 'Editar'
    botonEditar.addEventListener('click', () => abrirEdicionTurno(turno))
    contenedor.append(botonEditar)

    const botonEstado = document.createElement('button')
    botonEstado.type = 'button'
    botonEstado.className = 'boton-fila'
    botonEstado.textContent = turno.activo ? 'Dar de baja' : 'Reactivar'
    botonEstado.addEventListener('click', () => cambiarEstado(turno))
    contenedor.append(botonEstado)

    const botonClientes = document.createElement('button')
    botonClientes.type = 'button'
    botonClientes.className = 'boton-fila'
    botonClientes.textContent = 'Clientes'
    botonClientes.addEventListener('click', () => abrirAsignacion(turno.id))
    contenedor.append(botonClientes)

    return contenedor
  }

  async function cambiarEstado(turno: Turno): Promise<void> {
    const accion = turno.activo ? 'dar de baja' : 'reactivar'
    if (!window.confirm(`¿Querés ${accion} el turno del ${textoDia(turno.dia)} de ${turno.horaInicio} a ${turno.horaFin}?`)) return

    mensaje.textContent = ''

    try {
      await solicitarAPI('/api/turnos/estado', {
        method: 'POST',
        body: JSON.stringify({ turnoId: turno.id, activo: !turno.activo }),
      })
      await cargarTurnos()
    } catch (error) {
      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo actualizar el estado del turno.'
    }
  }

  /* Trae el listado de clientes activos para el select de asignacion.
   Se reutiliza el mismo endpoint que usa la pantalla de Clientes. */
  async function cargarClientesParaAsignar(): Promise<void> {
    selectClienteAsignar.replaceChildren()

    try {
      const datos = await solicitarAPI<{ clientes: ClienteOpcion[] }>('/api/clientes')
      for (const cliente of datos.clientes.filter(c => c.activo)) {
        const opcion = document.createElement('option')
        opcion.value = cliente.id
        opcion.textContent = `${cliente.apellido}, ${cliente.nombre}`
        selectClienteAsignar.append(opcion)
      }
    } catch (error) {
      mensajeFormularioAsignar.textContent = error instanceof Error
        ? error.message
        : 'No se pudo cargar el listado de clientes.'
    }
  }

  async function abrirAsignacion(turnoId: string): Promise<void> {
    ocultarFormularios()
    campoAsignarTurnoId.value = turnoId
    formularioAsignar.hidden = false
    await cargarClientesParaAsignar()
  }

  async function asignarORetirar(asignar: boolean): Promise<void> {
    if (!selectClienteAsignar.value) {
      mensajeFormularioAsignar.textContent = 'Seleccioná un cliente.'
      return
    }

    mensajeFormularioAsignar.textContent = ''
    botonAsignarCliente.disabled = true
    botonRetirarCliente.disabled = true

    try {
      await solicitarAPI(asignar ? '/api/turnos/asignar' : '/api/turnos/retirar', {
        method: 'POST',
        body: JSON.stringify({ turnoId: campoAsignarTurnoId.value, clienteId: selectClienteAsignar.value }),
      })
      mensajeFormularioAsignar.textContent = asignar ? 'Cliente asignado.' : 'Cliente retirado.'
      await cargarTurnos()
    } catch (error) {
      mensajeFormularioAsignar.textContent = error instanceof Error
        ? error.message
        : 'No se pudo completar la operación.'
    } finally {
      botonAsignarCliente.disabled = false
      botonRetirarCliente.disabled = false
    }
  }

  /* --- Generacion automatica de la agenda --- */

  function agregarFilaFranja(franja: Franja = { inicio: '', fin: '' }): void {
    const fila = document.createElement('div')
    fila.className = 'fila-franja'

    const campoInicio = document.createElement('input')
    campoInicio.type = 'time'
    campoInicio.required = true
    campoInicio.value = franja.inicio
    campoInicio.disabled = !esAdmin

    const campoFin = document.createElement('input')
    campoFin.type = 'time'
    campoFin.required = true
    campoFin.value = franja.fin
    campoFin.disabled = !esAdmin

    fila.append(campoInicio, campoFin)

    if (esAdmin) {
      const botonQuitar = document.createElement('button')
      botonQuitar.type = 'button'
      botonQuitar.className = 'boton-fila'
      botonQuitar.textContent = 'Quitar'
      botonQuitar.addEventListener('click', () => fila.remove())
      fila.append(botonQuitar)
    }

    listaFranjas.append(fila)
  }

  function agregarFilaTrabajo(trabajo: Trabajo = { entrenadorId: esAdmin ? '' : sesion.id, dias: [] }): void {
    const fila = document.createElement('div')
    fila.className = 'fila-trabajo'

    const campoEntrenador = document.createElement('input')
    campoEntrenador.type = 'text'
    campoEntrenador.placeholder = 'ID del entrenador'
    campoEntrenador.required = true
    campoEntrenador.value = trabajo.entrenadorId
    campoEntrenador.disabled = !esAdmin

    const contenedorDias = document.createElement('div')
    contenedorDias.className = 'dias-trabajo'

    for (const dia of diasSemana) {
      const etiqueta = document.createElement('label')
      const casilla = document.createElement('input')
      casilla.type = 'checkbox'
      casilla.value = dia
      casilla.checked = trabajo.dias.includes(dia)
      etiqueta.append(casilla, document.createTextNode(textoDia(dia)))
      contenedorDias.append(etiqueta)
    }

    fila.append(campoEntrenador, contenedorDias)

    if (esAdmin) {
      const botonQuitar = document.createElement('button')
      botonQuitar.type = 'button'
      botonQuitar.className = 'boton-fila'
      botonQuitar.textContent = 'Quitar'
      botonQuitar.addEventListener('click', () => fila.remove())
      fila.append(botonQuitar)
    }

    listaTrabajos.append(fila)
  }

  /* El Entrenador solo puede generar su propia agenda, con las franjas
   y el cupo que ya tiene definidos el Administrador. Por eso le
   mostramos los valores actuales pero deshabilitados. */
  async function abrirGenerarAgenda(): Promise<void> {
    ocultarFormularios()
    mensajeFormularioGenerar.textContent = 'Cargando configuración...'
    formularioGenerar.hidden = false
    listaFranjas.replaceChildren()
    listaTrabajos.replaceChildren()
    botonAgregarFranja.hidden = !esAdmin
    botonAgregarTrabajo.hidden = !esAdmin

    try {
      const datos = await solicitarAPI<{ configuracion: Configuracion }>('/api/turnos/configuracion')
      mensajeFormularioGenerar.textContent = ''
      campoCapacidadAgenda.value = String(datos.configuracion.capacidad)
      campoCapacidadAgenda.disabled = !esAdmin

      for (const franja of datos.configuracion.franjas) agregarFilaFranja(franja)

      if (esAdmin) {
        for (const trabajo of datos.configuracion.trabajos) agregarFilaTrabajo(trabajo)
        if (datos.configuracion.trabajos.length === 0) agregarFilaTrabajo()
      } else {
        const propio = datos.configuracion.trabajos.find(t => t.entrenadorId === sesion.id)
        agregarFilaTrabajo(propio ?? { entrenadorId: sesion.id, dias: [] })
      }
    } catch (error) {
      mensajeFormularioGenerar.textContent = error instanceof Error
        ? error.message
        : 'No se pudo cargar la configuración de la agenda.'
    }
  }

  function recolectarFranjas(): Franja[] {
    return [...listaFranjas.querySelectorAll<HTMLDivElement>('.fila-franja')].map((fila) => {
      const [inicio, fin] = fila.querySelectorAll<HTMLInputElement>('input[type="time"]')
      return { inicio: inicio?.value ?? '', fin: fin?.value ?? '' }
    })
  }

  function recolectarTrabajos(): Trabajo[] {
    return [...listaTrabajos.querySelectorAll<HTMLDivElement>('.fila-trabajo')].map((fila) => {
      const campoEntrenador = fila.querySelector<HTMLInputElement>('input[type="text"]')
      const dias = [...fila.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')].map(c => c.value)
      return { entrenadorId: campoEntrenador?.value ?? '', dias }
    })
  }

  async function enviarGenerarAgenda(): Promise<void> {
    mensajeFormularioGenerar.textContent = ''
    const boton = formularioGenerar.querySelector<HTMLButtonElement>('button[type="submit"]')
    if (boton) boton.disabled = true

    try {
      await solicitarAPI('/api/turnos/generar', {
        method: 'POST',
        body: JSON.stringify({
          capacidad: Number(campoCapacidadAgenda.value),
          franjas: recolectarFranjas(),
          trabajos: recolectarTrabajos(),
        }),
      })
      ocultarFormularios()
      await cargarTurnos()
    } catch (error) {
      mensajeFormularioGenerar.textContent = error instanceof Error
        ? error.message
        : 'No se pudo generar la agenda.'
    } finally {
      if (boton) boton.disabled = false
    }
  }

  /* --- Operaciones en lote (solo Administrador) --- */

  async function operarEnLote(eliminar: boolean): Promise<void> {
    const accion = eliminar ? 'eliminar definitivamente' : 'dar de baja'
    if (!window.confirm(`¿Querés ${accion} los ${seleccionLote.size} turnos seleccionados?`)) return

    mensaje.textContent = ''

    try {
      await solicitarAPI('/api/turnos/lote', {
        method: 'POST',
        body: JSON.stringify({ ids: [...seleccionLote], eliminar, confirmado: true }),
      })
      await cargarTurnos()
    } catch (error) {
      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo completar la operación en lote.'
    }
  }

  /* --- Eventos --- */

  botonNuevoTurno.addEventListener('click', abrirAltaTurno)
  botonCancelarTurno.addEventListener('click', ocultarFormularios)
  botonGenerarAgenda.addEventListener('click', abrirGenerarAgenda)
  botonCancelarGenerar.addEventListener('click', ocultarFormularios)
  botonCancelarAsignar.addEventListener('click', ocultarFormularios)
  botonAgregarFranja.addEventListener('click', () => agregarFilaFranja())
  botonAgregarTrabajo.addEventListener('click', () => agregarFilaTrabajo())
  botonAsignarCliente.addEventListener('click', () => asignarORetirar(true))
  botonRetirarCliente.addEventListener('click', () => asignarORetirar(false))
  botonBajaLote.addEventListener('click', () => operarEnLote(false))
  botonEliminarLote.addEventListener('click', () => operarEnLote(true))

  formularioTurno.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    if (!validarFormulario(formularioTurno, mensajeFormularioTurno)) return

    const esEdicion = campoTurnoId.value.length > 0
    const boton = formularioTurno.querySelector<HTMLButtonElement>('button[type="submit"]')
    const datos = new FormData(formularioTurno)

    if (boton) boton.disabled = true

    try {
      await solicitarAPI(esEdicion ? '/api/turnos/editar' : '/api/turnos', {
        method: 'POST',
        body: JSON.stringify({
          ...Object.fromEntries(datos),
          /* FormData entrega todo como texto. El backend exige que
           capacidad sea un numero (ver entero() en compartidos/http.ts). */
          capacidad: Number(datos.get('capacidad')),
        }),
      })
      ocultarFormularios()
      await cargarTurnos()
    } catch (error) {
      if (error instanceof ErrorAPI) {
        mensajeFormularioTurno.textContent = error.message
        for (const campo of error.campos) {
          formularioTurno.querySelector(`#${campo}`)?.setAttribute('aria-invalid', 'true')
        }
      } else {
        mensajeFormularioTurno.textContent = error instanceof Error
          ? error.message
          : 'No se pudo guardar el turno.'
      }
    } finally {
      if (boton) boton.disabled = false
    }
  })

  formularioGenerar.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    await enviarGenerarAgenda()
  })

  await cargarTurnos()
}
