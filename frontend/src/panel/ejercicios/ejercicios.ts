
import { prepararPanel } from '../estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { tieneRol } from '../../servicios/permisos.ts'

interface Ejercicio {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  grupoMuscular: string
  activo: boolean
  fechaCreacion: string
  fechaModificacion: string
  fechaBaja: string | null
}

interface FilaExcel {
  fila: number
  codigo: string
  nombre: string
  grupoMuscular: string
  descripcion: string
  idExistente?: string
  error: string
  procesada: boolean
}

const usuario = await prepararPanel('Ejercicios')

if (usuario) {
  const esAdmin = tieneRol(usuario, ['ADMIN'])

  function elemento<T extends Element>(selector: string): T {
    const encontrado = document.querySelector<T>(selector)
    if (!encontrado) throw new Error(`Falta el elemento ${selector}`)
    return encontrado
  }

  const formulario = elemento<HTMLFormElement>('#formulario-ejercicio')
  const mensaje = elemento<HTMLParagraphElement>('#mensaje-ejercicios')
  const mensajeFormulario = elemento<HTMLParagraphElement>('#mensaje-formulario')
  const cuerpoTabla = elemento<HTMLTableSectionElement>('#cuerpo-tabla-ejercicios')

  const tarjetaEditor = elemento<HTMLElement>('#tarjeta-editor')
  const tarjetaImportacion = elemento<HTMLElement>('#tarjeta-importacion')

  const campoBuscar = elemento<HTMLInputElement>('#buscar')
  const filtroGrupo = elemento<HTMLSelectElement>('#filtro-grupo')

  const archivoExcel = elemento<HTMLInputElement>('#archivo-ejercicios')
  const botonImportar = elemento<HTMLButtonElement>('#importar-ejercicios')
  const estadoImportacion = elemento<HTMLParagraphElement>('#estado-importacion')
  const vistaImportacion = elemento<HTMLDivElement>('#vista-importacion')

  const botonCancelar = elemento<HTMLButtonElement>('#cancelar-edicion')
  const botonGuardar = elemento<HTMLButtonElement>('#guardar-ejercicio')

  let ejercicios: Ejercicio[] = []
  let filasExcel: FilaExcel[] = []
  let importando = false

  // El entrenador solo puede consultar el catálogo.
  tarjetaEditor.hidden = !esAdmin
  tarjetaImportacion.hidden = !esAdmin

  function mostrarMensaje(texto: string, error = false): void {
    mensaje.textContent = texto
    mensaje.classList.toggle('estado-error', error)
  }

  function limpiarFormulario(): void {
    formulario.reset()
    elemento<HTMLInputElement>('[name="id"]').value = ''

    elemento<HTMLHeadingElement>('#titulo-editor').textContent =
      'Nuevo ejercicio'

    botonGuardar.textContent = 'Guardar ejercicio'
    botonCancelar.hidden = true
    mensajeFormulario.textContent = ''
  }

  function llenarFormulario(ejercicio: Ejercicio): void {
    elemento<HTMLInputElement>('[name="id"]').value = ejercicio.id
    elemento<HTMLInputElement>('#codigo').value = ejercicio.codigo
    elemento<HTMLInputElement>('#nombre').value = ejercicio.nombre
    elemento<HTMLInputElement>('#grupoMuscular').value =
      ejercicio.grupoMuscular
    elemento<HTMLTextAreaElement>('#descripcion').value =
      ejercicio.descripcion

    elemento<HTMLHeadingElement>('#titulo-editor').textContent =
      'Editar ejercicio'

    botonGuardar.textContent = 'Guardar cambios'
    botonCancelar.hidden = false

    formulario.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function actualizarFiltroGrupos(): void {
    const seleccionado = filtroGrupo.value

    const grupos = [...new Set(
      ejercicios.map(e => e.grupoMuscular).filter(Boolean),
    )].sort((a, b) => a.localeCompare(b, 'es'))

    filtroGrupo.replaceChildren(
      new Option('Todos', ''),
      ...grupos.map(grupo => new Option(grupo, grupo)),
    )

    filtroGrupo.value = grupos.includes(seleccionado) ? seleccionado : ''
  }

  function crearCelda(texto: string): HTMLTableCellElement {
    const celda = document.createElement('td')
    celda.textContent = texto
    return celda
  }

  function crearBoton(
    texto: string,
    accion: () => void,
    peligro = false,
  ): HTMLButtonElement {
    const boton = document.createElement('button')
    boton.type = 'button'
    boton.className = peligro ? 'boton-peligro' : 'boton-fila'
    boton.textContent = texto
    boton.addEventListener('click', accion)
    return boton
  }

  function mostrarEjercicios(): void {
    cuerpoTabla.replaceChildren()

    const busqueda = campoBuscar.value.trim().toLowerCase()
    const grupoSeleccionado = filtroGrupo.value

    const filtrados = ejercicios.filter(ejercicio => {
      const coincideTexto = [
        ejercicio.codigo,
        ejercicio.nombre,
        ejercicio.grupoMuscular,
        ejercicio.descripcion,
      ].join(' ').toLowerCase().includes(busqueda)

      const coincideGrupo = !grupoSeleccionado
        || ejercicio.grupoMuscular === grupoSeleccionado

      return coincideTexto && coincideGrupo
    })

    if (!filtrados.length) {
      const fila = document.createElement('tr')
      const celda = crearCelda('No se encontraron ejercicios.')
      celda.colSpan = 6
      fila.append(celda)
      cuerpoTabla.append(fila)
      return
    }

    for (const ejercicio of filtrados) {
      const fila = document.createElement('tr')

      fila.append(
        crearCelda(ejercicio.codigo),
        crearCelda(ejercicio.nombre),
        crearCelda(ejercicio.grupoMuscular),
        crearCelda(ejercicio.descripcion || '—'),
      )

      const estado = document.createElement('span')
      estado.className = ejercicio.activo
        ? 'etiqueta-estado etiqueta-activo'
        : 'etiqueta-estado etiqueta-inactivo'

      estado.textContent = ejercicio.activo ? 'Activo' : 'Inactivo'

      const celdaEstado = document.createElement('td')
      celdaEstado.append(estado)
      fila.append(celdaEstado)

      const celdaAcciones = document.createElement('td')

      if (esAdmin) {
        const acciones = document.createElement('div')
        acciones.className = 'acciones-fila'

        acciones.append(
          crearBoton('Editar', () => llenarFormulario(ejercicio)),
          crearBoton(
            ejercicio.activo ? 'Dar de baja' : 'Reactivar',
            () => cambiarEstado(ejercicio),
            !ejercicio.activo,
          ),
        )

        celdaAcciones.append(acciones)
      } else {
        celdaAcciones.textContent = 'Solo consulta'
      }

      fila.append(celdaAcciones)
      cuerpoTabla.append(fila)
    }
  }

  async function cargarEjercicios(): Promise<void> {
    mostrarMensaje('Cargando catálogo...')

    try {
      const datos = await solicitarAPI<{ ejercicios: Ejercicio[] }>(
        '/api/ejercicios',
      )

      ejercicios = datos.ejercicios
      actualizarFiltroGrupos()
      mostrarEjercicios()

      mostrarMensaje(`${ejercicios.length} ejercicios encontrados.`)
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el catálogo.',
        true,
      )
    }
  }

  async function cambiarEstado(ejercicio: Ejercicio): Promise<void> {
    const accion = ejercicio.activo ? 'dar de baja' : 'reactivar'

    if (!window.confirm(
      `¿Querés ${accion} el ejercicio ${ejercicio.nombre}?`,
    )) return

    try {
      const resultado = await solicitarAPI<{ mensaje: string }>(
        '/api/ejercicios/estado',
        {
          method: 'POST',
          body: JSON.stringify({
            id: ejercicio.id,
            activo: !ejercicio.activo,
          }),
        },
      )

      await cargarEjercicios()
      mostrarMensaje(resultado.mensaje)
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo modificar el estado.',
        true,
      )
    }
  }

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault()

    if (!formulario.reportValidity()) return

    const datos = new FormData(formulario)
    const id = String(datos.get('id') ?? '').trim()

    const cuerpo = {
      ...(id ? { id } : {}),
      codigo: String(datos.get('codigo') ?? '').trim().toUpperCase(),
      nombre: String(datos.get('nombre') ?? '').trim(),
      grupoMuscular: String(datos.get('grupoMuscular') ?? '').trim(),
      descripcion: String(datos.get('descripcion') ?? '').trim(),
    }

    botonGuardar.disabled = true
    mensajeFormulario.textContent = 'Guardando...'

    try {
      const resultado = await solicitarAPI<{ mensaje: string }>(
        '/api/ejercicios',
        {
          method: 'POST',
          body: JSON.stringify(cuerpo),
        },
      )

      limpiarFormulario()
      await cargarEjercicios()
      mostrarMensaje(resultado.mensaje)
    } catch (error) {
      mensajeFormulario.textContent = error instanceof Error
        ? error.message
        : 'No se pudo guardar el ejercicio.'

      if (error instanceof ErrorAPI) {
        for (const campo of formulario.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[name]')) {
          campo.removeAttribute('aria-invalid')
          if (error.campos.includes(campo.name)) {
            campo.setAttribute('aria-invalid', 'true')
          }
        }
      }
    } finally {
      botonGuardar.disabled = false
    }
  })

  botonCancelar.addEventListener('click', limpiarFormulario)

  campoBuscar.addEventListener('input', mostrarEjercicios)
  filtroGrupo.addEventListener('change', mostrarEjercicios)

  elemento<HTMLButtonElement>('#actualizar').addEventListener(
    'click',
    () => void cargarEjercicios(),
  )

  // Normaliza encabezados: admite tildes, espacios y guiones.
  function normalizarEncabezado(valor: string): string {
    return valor.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[\s_-]/g, '')
  }

  function dibujarVistaPrevia(): void {
    vistaImportacion.replaceChildren()

    if (!filasExcel.length) {
      botonImportar.disabled = true
      return
    }

    const tabla = document.createElement('table')
    tabla.className = 'tabla-datos'

    const encabezado = document.createElement('thead')
    const filaEncabezado = document.createElement('tr')

    for (const titulo of ['Fila', 'Código', 'Nombre', 'Grupo muscular', 'Acción', 'Estado']) {
      const th = document.createElement('th')
      th.textContent = titulo
      filaEncabezado.append(th)
    }

    encabezado.append(filaEncabezado)
    tabla.append(encabezado)

    const cuerpo = document.createElement('tbody')

    for (const filaExcel of filasExcel) {
      const fila = document.createElement('tr')

      const existente = filaExcel.idExistente
        ? 'Actualizar'
        : 'Crear'

      const estado = filaExcel.error
        || (filaExcel.procesada ? 'Procesado' : 'Listo para importar')

      fila.append(
        crearCelda(String(filaExcel.fila)),
        crearCelda(filaExcel.codigo),
        crearCelda(filaExcel.nombre),
        crearCelda(filaExcel.grupoMuscular),
        crearCelda(existente),
        crearCelda(estado),
      )

      cuerpo.append(fila)
    }

    tabla.append(cuerpo)
    vistaImportacion.append(tabla)

    botonImportar.disabled = importando
      || !filasExcel.some(f => !f.error && !f.procesada)
  }

  async function leerArchivoExcel(archivo: File): Promise<void> {
    filasExcel = []
    dibujarVistaPrevia()
    estadoImportacion.textContent = ''

    if (!/\.xlsx$/i.test(archivo.name)) {
      throw new Error('Seleccioná un archivo con extensión .xlsx.')
    }

    if (archivo.size > 2 * 1024 * 1024) {
      throw new Error('El archivo no puede superar los 2 MB.')
    }

    const modulo = await import('exceljs')
    const ExcelJS = modulo.default
    const libro = new ExcelJS.Workbook()

    await libro.xlsx.load(await archivo.arrayBuffer())

    const hoja = libro.worksheets[0]

    if (!hoja) {
      throw new Error('El archivo no contiene hojas.')
    }

    if (hoja.rowCount > 1001 || hoja.columnCount > 30) {
      throw new Error('El archivo admite hasta 1000 filas de datos y 30 columnas.')
    }

    const columnas = new Map<string, number>()

    hoja.getRow(1).eachCell((celda, indice) => {
      const clave = normalizarEncabezado(celda.text)

      if (columnas.has(clave)) {
        throw new Error('Hay encabezados repetidos.')
      }

      columnas.set(clave, indice)
    })

    for (const requerida of ['codigo', 'nombre', 'grupomuscular']) {
      if (!columnas.has(requerida)) {
        throw new Error(`Falta la columna ${requerida}.`)
      }
    }

    const existentes = new Map(
      ejercicios.map(e => [e.codigo.toUpperCase(), e.id]),
    )

    const codigosArchivo = new Set<string>()

    hoja.eachRow((fila, numero) => {
      if (numero === 1) return

      const leer = (clave: string) => {
        const columna = columnas.get(clave)
        return columna ? fila.getCell(columna).text.trim() : ''
      }

      const datos = {
        codigo: leer('codigo').toUpperCase(),
        nombre: leer('nombre'),
        grupoMuscular: leer('grupomuscular'),
        descripcion: leer('descripcion'),
      }

      if (!Object.values(datos).some(Boolean)) return

      let error = ''

      if (
        !datos.codigo
        || datos.codigo.length > 30
        || !datos.nombre
        || datos.nombre.length > 120
        || !datos.grupoMuscular
        || datos.grupoMuscular.length > 100
        || datos.descripcion.length > 2000
      ) {
        error = 'Hay campos obligatorios vacíos o demasiado extensos.'
      } else if (codigosArchivo.has(datos.codigo)) {
        error = 'El código está repetido en el archivo.'
      }

      codigosArchivo.add(datos.codigo)

      filasExcel.push({
        fila: numero,
        ...datos,
        idExistente: existentes.get(datos.codigo),
        error,
        procesada: false,
      })
    })

    if (!filasExcel.length) {
      estadoImportacion.textContent = 'El archivo no contiene ejercicios para importar.'
    } else {
      const validas = filasExcel.filter(f => !f.error).length
      estadoImportacion.textContent =
        `${validas} filas listas y ${filasExcel.length - validas} filas con errores.`
    }

    dibujarVistaPrevia()
  }

  archivoExcel.addEventListener('change', () => {
    const archivo = archivoExcel.files?.[0]
    if (!archivo) return

    estadoImportacion.textContent = 'Leyendo archivo...'

    void leerArchivoExcel(archivo).catch(error => {
      estadoImportacion.textContent = error instanceof Error
        ? error.message
        : 'No se pudo leer el archivo.'
      filasExcel = []
      dibujarVistaPrevia()
    })
  })

  botonImportar.addEventListener('click', async () => {
    if (importando) return

    const pendientes = filasExcel.filter(f => !f.error && !f.procesada)

    if (!pendientes.length) return

    if (!window.confirm(
      `¿Importar ${pendientes.length} ejercicios? Los códigos existentes actualizarán sus registros.`,
    )) return

    importando = true
    botonImportar.disabled = true
    archivoExcel.disabled = true

    let procesados = 0
    const errores: string[] = []

    try {
      for (const [indice, fila] of pendientes.entries()) {
        estadoImportacion.textContent =
          `Procesando ${indice + 1} de ${pendientes.length}...`

        try {
          await solicitarAPI('/api/ejercicios', {
            method: 'POST',
            body: JSON.stringify({
              ...(fila.idExistente ? { id: fila.idExistente } : {}),
              codigo: fila.codigo,
              nombre: fila.nombre,
              grupoMuscular: fila.grupoMuscular,
              descripcion: fila.descripcion,
            }),
          })

          fila.procesada = true
          procesados++
        } catch (error) {
          const detalle = error instanceof Error
            ? error.message
            : 'Error desconocido'

          fila.error = detalle
          errores.push(`Fila ${fila.fila}: ${detalle}`)
        }

        dibujarVistaPrevia()
      }

      await cargarEjercicios()

      estadoImportacion.textContent =
        `${procesados} ejercicios procesados. ${errores.length} errores.`
        + (errores.length ? ` ${errores.join(' | ')}` : '')
    } finally {
      importando = false
      archivoExcel.disabled = false
      dibujarVistaPrevia()
    }
  })

  elemento<HTMLButtonElement>('#plantilla-excel').addEventListener(
    'click',
    async () => {
      try {
        const modulo = await import('exceljs')
        const ExcelJS = modulo.default
        const libro = new ExcelJS.Workbook()
        const hoja = libro.addWorksheet('Ejercicios')

        hoja.addRow(['Código', 'Nombre', 'Grupo muscular', 'Descripción'])
        hoja.addRow([
          'EJ-0001',
          'Sentadilla',
          'Piernas',
          'Ejercicio de ejemplo',
        ])

        const datos = await libro.xlsx.writeBuffer()

        const blob = new Blob([datos as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        const url = URL.createObjectURL(blob)
        const enlace = document.createElement('a')

        enlace.href = url
        enlace.download = 'plantilla-ejercicios.xlsx'
        enlace.click()

        URL.revokeObjectURL(url)
      } catch (error) {
        mostrarMensaje(
          error instanceof Error
            ? error.message
            : 'No se pudo generar la plantilla.',
          true,
        )
      }
    },
  )

  await cargarEjercicios()
}
