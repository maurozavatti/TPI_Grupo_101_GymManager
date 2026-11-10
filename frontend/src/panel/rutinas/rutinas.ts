import { prepararPanel } from '../estructura.ts'
import { solicitarAPI } from '../../servicios/api.ts'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  activo: boolean
  vinculado: boolean
}

interface EjercicioCatalogo {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  grupoMuscular: string
  activo: boolean
}

interface EjercicioRutina {
  ejercicioId: string
  series: number
  repeticiones: number
  peso: number
  descanso: number
  orden: number
  observaciones: string
  ejercicio: EjercicioCatalogo | null
}

interface Rutina {
  id: string
  fechaAsignacion: string
  entrenadorId: string
  observaciones: string
  activo: boolean
  fechaCreacion: string
  fechaModificacion: string
  fechaBaja: string | null
  ejercicios: EjercicioRutina[]
}

const usuario = await prepararPanel('Rutinas')

if (usuario) {
  function elemento<T extends Element>(selector: string): T {
    const encontrado = document.querySelector<T>(selector)

    if (!encontrado) {
      throw new Error(`Falta el elemento ${selector}`)
    }

    return encontrado
  }

  const selectorCliente = elemento<HTMLSelectElement>('#selector-cliente')
  const mensajeGeneral = elemento<HTMLParagraphElement>('#mensaje-rutinas')
  const datosCliente = elemento<HTMLElement>('#datos-cliente')
  const nombreCliente = elemento<HTMLElement>('#nombre-cliente')
  const estadoCliente = elemento<HTMLElement>('#estado-cliente')

  const tarjetaHistorial = elemento<HTMLElement>('#tarjeta-historial')
  const listaHistorial = elemento<HTMLDivElement>('#lista-historial')

  const tarjetaEditor = elemento<HTMLElement>('#tarjeta-editor')
  const formulario = elemento<HTMLFormElement>('#formulario-rutina')
  const tituloEditor = elemento<HTMLElement>('#titulo-editor')
  const observacionesRutina = elemento<HTMLTextAreaElement>('#observaciones-rutina')
  const listaEjercicios = elemento<HTMLDivElement>('#lista-ejercicios')
  const mensajeFormulario = elemento<HTMLParagraphElement>('#mensaje-formulario-rutina')

  const botonNueva = elemento<HTMLButtonElement>('#boton-nueva-rutina')
  const botonAgregar = elemento<HTMLButtonElement>('#boton-agregar-ejercicio')
  const botonGuardar = elemento<HTMLButtonElement>('#boton-guardar-rutina')
  const botonCancelar = elemento<HTMLButtonElement>('#boton-cancelar-editor')

  const tarjetaDetalle = elemento<HTMLElement>('#tarjeta-detalle')
  const tituloRutina = elemento<HTMLElement>('#titulo-rutina')
  const fechaRutina = elemento<HTMLElement>('#fecha-rutina')
  const clienteImpresion = elemento<HTMLElement>('#cliente-impresion')
  const observacionesDetalle = elemento<HTMLElement>('#observaciones-detalle')
  const cuerpoDetalle = elemento<HTMLTableSectionElement>('#cuerpo-ejercicios-detalle')
  const avisoRutina = elemento<HTMLParagraphElement>('#aviso-rutina')

  const botonEditar = elemento<HTMLButtonElement>('#boton-editar-rutina')
  const botonImprimir = elemento<HTMLButtonElement>('#boton-imprimir-rutina')

  let clientes: Cliente[] = []
  let catalogo: EjercicioCatalogo[] = []
  let clienteSeleccionado: Cliente | null = null
  let rutinas: Rutina[] = []
  let rutinaSeleccionadaId = ''
  let modoFormulario: 'nueva' | 'editar' = 'nueva'

  function mostrarMensaje(texto: string, error = false): void {
    mensajeGeneral.textContent = texto
    mensajeGeneral.classList.toggle('estado-error', error)
  }

  function formatearFecha(valor: string): string {
    const fecha = new Date(valor)

    if (!Number.isFinite(fecha.getTime())) return 'Fecha no disponible'

    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
    }).format(fecha)
  }

  function rutinaSeleccionada(): Rutina | null {
    return rutinas.find(rutina => rutina.id === rutinaSeleccionadaId) ?? null
  }

  function obtenerCliente(id: string): Cliente | null {
    return clientes.find(cliente => cliente.id === id) ?? null
  }

  function mostrarDatosCliente(cliente: Cliente): void {
    datosCliente.hidden = false
    nombreCliente.textContent = `${cliente.nombre} ${cliente.apellido}`

    estadoCliente.className = cliente.vinculado
      ? 'etiqueta-estado etiqueta-activo'
      : 'etiqueta-estado etiqueta-inactivo'

    estadoCliente.textContent = cliente.vinculado
      ? 'Cuenta vinculada'
      : 'Sin cuenta: puede imprimir su rutina'
  }

  async function cargarDatosIniciales(): Promise<void> {
    mostrarMensaje('Cargando clientes y catálogo de ejercicios...')

    try {
      const [datosClientes, datosEjercicios] = await Promise.all([
        solicitarAPI<{ clientes: Cliente[] }>('/api/clientes'),
        solicitarAPI<{ ejercicios: EjercicioCatalogo[] }>('/api/ejercicios'),
      ])

      clientes = datosClientes.clientes.filter(cliente => cliente.activo)
      catalogo = datosEjercicios.ejercicios.filter(ejercicio => ejercicio.activo)

      selectorCliente.replaceChildren(
        new Option('Seleccioná un cliente...', ''),
        ...clientes.map(cliente => new Option(
          `${cliente.apellido}, ${cliente.nombre}`,
          cliente.id,
        )),
      )

      mostrarMensaje(
        `${clientes.length} clientes activos y ${catalogo.length} ejercicios disponibles.`,
      )

      if (!clientes.length) {
        mostrarMensaje('Todavía no hay clientes activos para asignar rutinas.')
      }

      if (!catalogo.length) {
        mostrarMensaje('No hay ejercicios activos en el catálogo. Primero cargá ejercicios.')
      }
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los datos iniciales.',
        true,
      )
    }
  }

  async function cargarRutinasCliente(clienteId: string): Promise<void> {
    mostrarMensaje('Consultando historial de rutinas...')

    try {
      const datos = await solicitarAPI<{
        rutinas: Rutina[]
        rutinaVigente: Rutina | null
      }>(`/api/rutinas?clienteId=${encodeURIComponent(clienteId)}`)

      rutinas = datos.rutinas

      rutinaSeleccionadaId = datos.rutinaVigente?.id
        ?? [...rutinas]
          .sort((a, b) =>
            new Date(b.fechaAsignacion).getTime()
            - new Date(a.fechaAsignacion).getTime(),
          )[0]?.id
        ?? ''

      tarjetaHistorial.hidden = false
      tarjetaEditor.hidden = true
      tarjetaDetalle.hidden = false

      mostrarHistorial()
      mostrarDetalle()

      mostrarMensaje(
        `${rutinas.length} rutinas encontradas para el cliente.`,
      )
    } catch (error) {
      rutinas = []
      rutinaSeleccionadaId = ''
      mostrarHistorial()
      mostrarDetalle()

      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudieron consultar las rutinas.',
        true,
      )
    }
  }

  function crearCampoNumero(
    etiqueta: string,
    nombre: string,
    minimo: number,
    maximo: number,
    valor: number,
    paso = '1',
  ): HTMLLabelElement {
    const label = document.createElement('label')
    label.className = 'campo-ejercicio'

    const texto = document.createElement('span')
    texto.textContent = etiqueta

    const input = document.createElement('input')
    input.type = 'number'
    input.name = nombre
    input.min = String(minimo)
    input.max = String(maximo)
    input.step = paso
    input.value = String(valor)
    input.required = true

    label.append(texto, input)
    return label
  }

  function agregarFilaEjercicio(ejercicio?: EjercicioRutina): void {
    const fila = document.createElement('div')
    fila.className = 'fila-ejercicio'

    const selector = document.createElement('label')
    selector.className = 'campo-ejercicio campo-ejercicio-nombre'

    const titulo = document.createElement('span')
    titulo.textContent = 'Ejercicio'

    const select = document.createElement('select')
    select.name = 'ejercicioId'
    select.required = true

    select.append(new Option('Seleccioná un ejercicio...', ''))

    for (const item of catalogo) {
      select.append(new Option(
        `${item.codigo} — ${item.nombre}`,
        item.id,
      ))
    }

    if (ejercicio) {
      select.value = ejercicio.ejercicioId
    }

    selector.append(titulo, select)

    const series = crearCampoNumero(
      'Series',
      'series',
      1,
      20,
      ejercicio?.series ?? 3,
    )

    const repeticiones = crearCampoNumero(
      'Repeticiones',
      'repeticiones',
      1,
      100,
      ejercicio?.repeticiones ?? 12,
    )

    const peso = crearCampoNumero(
      'Peso (kg)',
      'peso',
      0,
      1000,
      ejercicio?.peso ?? 0,
      '0.01',
    )

    const descanso = crearCampoNumero(
      'Descanso (seg.)',
      'descanso',
      0,
      3600,
      ejercicio?.descanso ?? 60,
    )

    const observaciones = document.createElement('label')
    observaciones.className = 'campo-ejercicio campo-ejercicio-observaciones'

    const textoObservaciones = document.createElement('span')
    textoObservaciones.textContent = 'Observaciones'

    const inputObservaciones = document.createElement('input')
    inputObservaciones.type = 'text'
    inputObservaciones.name = 'observaciones'
    inputObservaciones.maxLength = 500
    inputObservaciones.value = ejercicio?.observaciones ?? ''
    inputObservaciones.placeholder = 'Indicaciones opcionales'

    observaciones.append(textoObservaciones, inputObservaciones)

    const botonQuitar = document.createElement('button')
    botonQuitar.type = 'button'
    botonQuitar.className = 'boton-peligro'
    botonQuitar.textContent = 'Quitar'

    botonQuitar.addEventListener('click', () => {
      fila.remove()
      actualizarBotonesQuitar()
    })

    fila.append(
      selector,
      series,
      repeticiones,
      peso,
      descanso,
      observaciones,
      botonQuitar,
    )

    listaEjercicios.append(fila)
    actualizarBotonesQuitar()
  }

  function actualizarBotonesQuitar(): void {
    const filas = listaEjercicios.querySelectorAll<HTMLElement>('.fila-ejercicio')

    for (const fila of filas) {
      const boton = fila.querySelector<HTMLButtonElement>('.boton-peligro')

      if (boton) {
        boton.disabled = filas.length === 1
      }
    }
  }

  function abrirEditor(rutina?: Rutina): void {
    if (!clienteSeleccionado) return

    if (!catalogo.length) {
      mostrarMensaje('No hay ejercicios activos para armar una rutina.', true)
      return
    }

    modoFormulario = rutina ? 'editar' : 'nueva'

    tituloEditor.textContent = rutina
      ? 'Modificar rutina vigente'
      : 'Asignar nueva rutina'

    botonGuardar.textContent = rutina
      ? 'Guardar cambios'
      : 'Asignar rutina'

    observacionesRutina.value = rutina?.observaciones ?? ''
    listaEjercicios.replaceChildren()

    if (rutina) {
      for (const ejercicio of rutina.ejercicios) {
        agregarFilaEjercicio(ejercicio)
      }
    } else {
      agregarFilaEjercicio()
    }

    mensajeFormulario.textContent = ''
    tarjetaEditor.hidden = false

    tarjetaEditor.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function cerrarEditor(): void {
    tarjetaEditor.hidden = true
    formulario.reset()
    listaEjercicios.replaceChildren()
    mensajeFormulario.textContent = ''
  }

  function crearCelda(texto: string): HTMLTableCellElement {
    const celda = document.createElement('td')
    celda.textContent = texto
    return celda
  }

  function mostrarHistorial(): void {
    listaHistorial.replaceChildren()

    if (!rutinas.length) {
      const mensaje = document.createElement('p')
      mensaje.className = 'nota-modulo'
      mensaje.textContent = 'Este cliente todavía no tiene rutinas asignadas.'
      listaHistorial.append(mensaje)
      return
    }

    const ordenadas = [...rutinas].sort((a, b) =>
      new Date(b.fechaAsignacion).getTime()
      - new Date(a.fechaAsignacion).getTime(),
    )

    for (const rutina of ordenadas) {
      const item = document.createElement('div')
      item.className = 'item-historial'

      if (rutina.id === rutinaSeleccionadaId) {
        item.classList.add('item-historial-seleccionado')
      }

      const informacion = document.createElement('div')
      informacion.className = 'informacion-historial'

      const fecha = document.createElement('strong')
      fecha.textContent = formatearFecha(rutina.fechaAsignacion)

      const detalle = document.createElement('span')
      detalle.textContent =
        `${rutina.ejercicios.length} ejercicios`

      const estado = document.createElement('span')
      estado.className = rutina.activo
        ? 'etiqueta-estado etiqueta-activo'
        : 'etiqueta-estado etiqueta-inactivo'

      estado.textContent = rutina.activo ? 'Vigente' : 'Histórica'

      informacion.append(fecha, detalle, estado)

      const boton = document.createElement('button')
      boton.type = 'button'
      boton.className = 'boton-fila'
      boton.textContent = 'Consultar'

      boton.addEventListener('click', () => {
        rutinaSeleccionadaId = rutina.id
        mostrarHistorial()
        mostrarDetalle()
      })

      item.append(informacion, boton)
      listaHistorial.append(item)
    }
  }

  function mostrarDetalle(): void {
    const rutina = rutinaSeleccionada()

    if (!rutina || !clienteSeleccionado) {
      tarjetaDetalle.hidden = true
      return
    }

    tarjetaDetalle.hidden = false

    tituloRutina.textContent = rutina.activo
      ? 'Rutina vigente'
      : 'Rutina histórica'

    fechaRutina.textContent =
      `Fecha de asignación: ${formatearFecha(rutina.fechaAsignacion)}`

    clienteImpresion.textContent =
      `Cliente: ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`

    observacionesDetalle.textContent =
      rutina.observaciones || 'Sin observaciones generales.'

    cuerpoDetalle.replaceChildren()

    const ordenados = [...rutina.ejercicios].sort(
      (a, b) => a.orden - b.orden,
    )

    for (const ejercicio of ordenados) {
      const fila = document.createElement('tr')

      const nombre = ejercicio.ejercicio
        ? `${ejercicio.ejercicio.nombre}${ejercicio.ejercicio.activo ? '' : ' (Inactivo)'}`
        : 'Ejercicio no disponible'

      fila.append(
        crearCelda(String(ejercicio.orden)),
        crearCelda(nombre),
        crearCelda(String(ejercicio.series)),
        crearCelda(String(ejercicio.repeticiones)),
        crearCelda(String(ejercicio.peso)),
        crearCelda(String(ejercicio.descanso)),
        crearCelda(ejercicio.observaciones || '—'),
      )

      cuerpoDetalle.append(fila)
    }

    const tieneEjerciciosInactivos = rutina.ejercicios.some(
      ejercicio => !ejercicio.ejercicio?.activo,
    )

    botonEditar.hidden = !rutina.activo || tieneEjerciciosInactivos

    if (tieneEjerciciosInactivos) {
      avisoRutina.textContent =
        'Esta rutina contiene ejercicios que ya no están activos en el catálogo. Podés consultarla e imprimirla, pero no modificarla.'
    } else if (!rutina.activo) {
      avisoRutina.textContent =
        'Esta es una rutina histórica. Solo se permite consultar e imprimir.'
    } else {
      avisoRutina.textContent = ''
    }
  }

  function obtenerEjerciciosFormulario(): {
    ejercicioId: string
    series: number
    repeticiones: number
    peso: number
    descanso: number
    orden: number
    observaciones: string
  }[] {
    const filas = listaEjercicios.querySelectorAll<HTMLElement>('.fila-ejercicio')

    return [...filas].map((fila, indice) => {
      const valor = (nombre: string): string => {
        const campo = fila.querySelector<HTMLInputElement | HTMLSelectElement>(
          `[name="${nombre}"]`,
        )

        if (!campo) {
          throw new Error(`Falta el campo ${nombre}.`)
        }

        return campo.value
      }

      return {
        ejercicioId: valor('ejercicioId'),
        series: Number(valor('series')),
        repeticiones: Number(valor('repeticiones')),
        peso: Number(valor('peso')),
        descanso: Number(valor('descanso')),
        orden: indice + 1,
        observaciones: valor('observaciones').trim(),
      }
    })
  }

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault()

    if (!clienteSeleccionado) return
    if (!formulario.reportValidity()) return

    let ejercicios: ReturnType<typeof obtenerEjerciciosFormulario>

    try {
      ejercicios = obtenerEjerciciosFormulario()
    } catch (error) {
      mensajeFormulario.textContent = error instanceof Error
        ? error.message
        : 'Revisá los ejercicios ingresados.'
      return
    }

    if (!ejercicios.length) {
      mensajeFormulario.textContent = 'Agregá al menos un ejercicio.'
      return
    }

    const rutinaActual = rutinaSeleccionada()

    const cuerpo = {
      clienteId: clienteSeleccionado.id,
      observaciones: observacionesRutina.value.trim(),
      ejercicios,
      ...(modoFormulario === 'editar' && rutinaActual
        ? { rutinaId: rutinaActual.id }
        : {}),
    }

    botonGuardar.disabled = true
    botonCancelar.disabled = true
    mensajeFormulario.textContent = 'Guardando rutina...'

    try {
      const ruta = modoFormulario === 'editar'
        ? '/api/rutinas/editar'
        : '/api/rutinas'

      const resultado = await solicitarAPI<{ mensaje: string }>(ruta, {
        method: 'POST',
        body: JSON.stringify(cuerpo),
      })

      cerrarEditor()
      await cargarRutinasCliente(clienteSeleccionado.id)
      mostrarMensaje(resultado.mensaje)
    } catch (error) {
      mensajeFormulario.textContent = error instanceof Error
        ? error.message
        : 'No se pudo guardar la rutina.'
    } finally {
      botonGuardar.disabled = false
      botonCancelar.disabled = false
    }
  })

  selectorCliente.addEventListener('change', async () => {
    const cliente = obtenerCliente(selectorCliente.value)

    clienteSeleccionado = cliente
    cerrarEditor()

    if (!cliente) {
      datosCliente.hidden = true
      tarjetaHistorial.hidden = true
      tarjetaDetalle.hidden = true
      mostrarMensaje('Seleccioná un cliente para consultar sus rutinas.')
      return
    }

    mostrarDatosCliente(cliente)
    await cargarRutinasCliente(cliente.id)
  })

  botonNueva.addEventListener('click', () => {
    abrirEditor()
  })

  botonAgregar.addEventListener('click', () => {
    agregarFilaEjercicio()
  })

  botonCancelar.addEventListener('click', cerrarEditor)

  botonEditar.addEventListener('click', () => {
    const rutina = rutinaSeleccionada()

    if (rutina?.activo) {
      abrirEditor(rutina)
    }
  })

  botonImprimir.addEventListener('click', () => {
    if (!rutinaSeleccionada()) return
    window.print()
  })

  await cargarDatosIniciales()
}