import './cuentas.css'
import { prepararPanel } from '../estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { validarFormulario } from '../../autenticacion/validaciones.ts'
import { obtenerRoles } from '../../servicios/roles.ts'
import type { RolesCuenta } from '../../servicios/roles.ts'
import type { RolUsuario } from '../../servicios/sesion.ts'
import { prepararAltaDesplegable } from './formulario-cuentas.ts'

interface Cuenta {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolesCuenta
  activo: boolean
  clienteId: string | null
}

const rolesDisponibles: readonly RolUsuario[] = [
  'USUARIO',
  'ENTRENADOR',
  'ADMIN',
]

/* Buscamos los elementos necesarios para preparar la pantalla. */
function elemento<T extends Element>(selector: string): T {
  const encontrado = document.querySelector<T>(selector)

  if (!encontrado) {
    throw new Error(`Falta el elemento ${selector} en la pantalla de cuentas.`)
  }

  return encontrado
}

/* Leemos las casillas marcadas dentro del grupo indicado. */
function rolesSeleccionados(grupo: HTMLElement): RolUsuario[] {
  return Array.from(
    grupo.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]:checked',
    ),
    (casilla) => casilla.value as RolUsuario,
  )
}

/* Los mensajes utilizan los colores generales de estado. */
function mostrarMensaje(
  mensaje: HTMLElement,
  texto: string,
  estado: 'error' | 'exito' | 'normal' = 'normal',
): void {
  mensaje.textContent = texto
  mensaje.classList.toggle('mensaje-error', estado === 'error')
  mensaje.classList.toggle('mensaje-exito', estado === 'exito')
}

/* Si cambio el acceso de la cuenta, resolvemos su destino. */
function revisarAcceso(error: unknown): void {
  if (!(error instanceof ErrorAPI)) return

  if (error.estado === 401) {
    window.location.replace('/src/autenticacion/login/login.html')
  } else if (error.estado === 403) {
    window.location.replace('/')
  }
}

/* Esta ventana confirma el cambio de estado utilizando
 el diseño de la web en lugar del cartel del navegador. */
function confirmarCambioEstado(cuenta: Cuenta): Promise<boolean> {
  return new Promise((resolver) => {
    const dialogo = document.createElement('dialog')
    dialogo.className = 'confirmacion-cuenta'
    dialogo.setAttribute('aria-labelledby', 'titulo-confirmacion-cuenta')

    const titulo = document.createElement('h2')
    titulo.id = 'titulo-confirmacion-cuenta'
    titulo.textContent = cuenta.activo
      ? 'Dar de baja la cuenta'
      : 'Reactivar la cuenta'

    const descripcion = document.createElement('p')
    descripcion.textContent = cuenta.activo
      ? `La cuenta de ${cuenta.nombre} ${cuenta.apellido} no podrá ingresar y se cerrarán sus sesiones. Sus datos se conservarán.`
      : `La cuenta de ${cuenta.nombre} ${cuenta.apellido} podrá volver a iniciar sesión.`

    const aclaracion = document.createElement('p')
    aclaracion.className = 'ayuda-cuentas'
    aclaracion.textContent =
      'Los cambios de roles que todavía no guardaste se descartarán al actualizar el listado.'

    const acciones = document.createElement('div')
    acciones.className = 'acciones-cuenta'

    const confirmar = document.createElement('button')
    confirmar.type = 'button'
    confirmar.className = cuenta.activo
      ? 'boton-panel boton-baja-cuenta'
      : 'boton-panel'
    confirmar.textContent = cuenta.activo
      ? 'Confirmar baja'
      : 'Reactivar cuenta'

    const cancelar = document.createElement('button')
    cancelar.type = 'button'
    cancelar.className = 'boton-panel boton-cancelar-cuenta'
    cancelar.textContent = 'Cancelar'

    confirmar.addEventListener('click', () => {
      dialogo.close('confirmar')
    })

    cancelar.addEventListener('click', () => {
      dialogo.close('cancelar')
    })

    /* Escape tambien cierra la ventana sin confirmar. */
    dialogo.addEventListener('close', () => {
      const confirmado = dialogo.returnValue === 'confirmar'
      dialogo.remove()
      resolver(confirmado)
    }, { once: true })

    acciones.append(confirmar, cancelar)
    dialogo.append(titulo, descripcion, aclaracion, acciones)
    document.body.append(dialogo)

    dialogo.showModal()
    cancelar.focus()
  })
}

const usuario = await prepararPanel('Cuentas', ['ADMIN'])

if (usuario) {
  prepararAltaDesplegable()
  prepararCuentas(usuario.id)
}

function prepararCuentas(usuarioActualId: string): void {
  const listado = elemento<HTMLTableSectionElement>('#listado-cuentas')
  const mensajeListado = elemento<HTMLParagraphElement>('#mensaje-cuentas')
  const botonActualizar = elemento<HTMLButtonElement>('#actualizar-cuentas')

  const busqueda = elemento<HTMLInputElement>('#buscar-cuenta')
  const filtroRol = elemento<HTMLSelectElement>('#filtrar-rol')
  const filtroEstado = elemento<HTMLSelectElement>('#filtrar-estado')

  const formulario = elemento<HTMLFormElement>('#formulario-cuenta')
  const grupoRolesAlta = elemento<HTMLFieldSetElement>('#roles-alta')
  const mensajeAlta = elemento<HTMLParagraphElement>('#mensaje-alta')
  const botonCrear = elemento<HTMLButtonElement>(
    '#formulario-cuenta button[type="submit"]',
  )

  const camposAlta = Array.from(
    formulario.querySelectorAll<HTMLInputElement>('input'),
  )

  let enviandoAlta = false
  let intentoEnviar = false
  let versionListado = 0
  let cuentasCargadas: Cuenta[] = []

  /* Ignoramos diferencias de mayusculas y tildes al buscar. */
  function normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  /* Combinamos busqueda, rol y estado sin consultar nuevamente
   al servidor. Las cuentas con varios roles coinciden con
   cualquiera de los roles que tengan asignados. */
  function aplicarFiltros(): void {
    const palabras = normalizarTexto(busqueda.value)
      .split(/\s+/)
      .filter(Boolean)

    const rolElegido = filtroRol.value
    const estadoElegido = filtroEstado.value

    const filtradas = cuentasCargadas.filter((cuenta) => {
      const texto = normalizarTexto(
        `${cuenta.nombre} ${cuenta.apellido} ${cuenta.email}`,
      )

      const coincideBusqueda = palabras.every(
        (palabra) => texto.includes(palabra),
      )

      const coincideRol = !rolElegido
        || obtenerRoles(cuenta.rol).some((rol) => rol === rolElegido)

      const coincideEstado = !estadoElegido
        || (estadoElegido === 'activo' && cuenta.activo)
        || (estadoElegido === 'inactivo' && !cuenta.activo)

      return coincideBusqueda && coincideRol && coincideEstado
    })

    dibujarCuentas(filtradas)

    mostrarMensaje(
      mensajeListado,
      `Mostrando ${filtradas.length} de ${cuentasCargadas.length} cuentas.`,
    )
  }

  /* Por defecto mostramos los roles como texto.
   Los controles aparecen solamente al presionar Editar. */
  function dibujarCuentas(cuentas: Cuenta[]): void {
    listado.replaceChildren()

    if (cuentas.length === 0) {
      const fila = document.createElement('tr')
      const celda = document.createElement('td')

      celda.colSpan = 5
      celda.textContent =
        'No hay cuentas que coincidan con la búsqueda y los filtros.'

      fila.append(celda)
      listado.append(fila)
      return
    }

    for (const cuenta of cuentas) {
      const fila = document.createElement('tr')
      const nombre = document.createElement('td')
      const correo = document.createElement('td')
      const celdaRoles = document.createElement('td')
      const estado = document.createElement('td')
      const acciones = document.createElement('td')

      nombre.textContent = `${cuenta.nombre} ${cuenta.apellido}`
      correo.textContent = cuenta.email
      estado.textContent = cuenta.activo ? 'Activa' : 'Inactiva'
      celdaRoles.className = 'celda-roles'

      const actuales = obtenerRoles(cuenta.rol)

      const textoRoles = document.createElement('span')
      textoRoles.textContent = actuales.join(' / ')

      const grupo = document.createElement('fieldset')
      grupo.className = 'roles-cuenta'
      grupo.hidden = true

      const leyenda = document.createElement('legend')
      leyenda.textContent = 'Roles'
      grupo.append(leyenda)

      const casillas: HTMLInputElement[] = []

      for (const rol of rolesDisponibles) {
        const etiqueta = document.createElement('label')
        etiqueta.className = 'opcion-rol'

        const casilla = document.createElement('input')
        casilla.type = 'checkbox'
        casilla.value = rol
        casilla.checked = actuales.includes(rol)

        casillas.push(casilla)
        etiqueta.append(casilla, document.createTextNode(rol))
        grupo.append(etiqueta)
      }

      grupo.addEventListener('change', () => {
        grupo.removeAttribute('aria-invalid')
      })

      const contenedorAcciones = document.createElement('div')
      contenedorAcciones.className = 'acciones-cuenta'

      const editar = document.createElement('button')
      editar.type = 'button'
      editar.className = 'boton-panel'
      editar.textContent = 'Editar'
      editar.setAttribute('aria-expanded', 'false')
      editar.setAttribute(
        'aria-label',
        `Editar cuenta de ${cuenta.nombre} ${cuenta.apellido}`,
      )

      const guardar = document.createElement('button')
      guardar.type = 'button'
      guardar.className = 'boton-panel'
      guardar.textContent = 'Guardar roles'
      guardar.hidden = true

      const cambiarEstado = document.createElement('button')
      cambiarEstado.type = 'button'
      cambiarEstado.className = cuenta.activo
        ? 'boton-panel boton-baja-cuenta'
        : 'boton-panel'
      cambiarEstado.textContent = cuenta.activo
        ? 'Dar de baja'
        : 'Reactivar'
      cambiarEstado.hidden = true

      const cancelar = document.createElement('button')
      cancelar.type = 'button'
      cancelar.className = 'boton-panel boton-cancelar-cuenta'
      cancelar.textContent = 'Cancelar'
      cancelar.hidden = true

      /* Cancelar recupera los valores originales sin guardarlos. */
      function cambiarEdicion(editando: boolean): void {
        casillas.forEach((casilla) => {
          casilla.checked = actuales.includes(casilla.value as RolUsuario)
        })

        grupo.removeAttribute('aria-invalid')
        grupo.hidden = !editando
        textoRoles.hidden = editando

        editar.hidden = editando
        editar.setAttribute('aria-expanded', String(editando))
        guardar.hidden = !editando
        cambiarEstado.hidden = !editando
        cancelar.hidden = !editando

        if (editando) {
          casillas[0]?.focus()
        } else {
          editar.focus()
        }
      }

      editar.addEventListener('click', () => {
        cambiarEdicion(true)
      })

      cancelar.addEventListener('click', () => {
        cambiarEdicion(false)
      })

      guardar.addEventListener('click', async () => {
        cancelar.disabled = true
        cambiarEstado.disabled = true

        try {
          await guardarRoles(cuenta, grupo, guardar)
        } finally {
          cancelar.disabled = false
          cambiarEstado.disabled = false
        }
      })

      cambiarEstado.addEventListener('click', async () => {
        if (guardar.disabled || cambiarEstado.disabled) return

        guardar.disabled = true
        cancelar.disabled = true
        grupo.disabled = true

        try {
          await actualizarEstadoCuenta(cuenta, cambiarEstado)
        } finally {
          guardar.disabled = false
          cancelar.disabled = false
          grupo.disabled = false
        }
      })

      celdaRoles.append(textoRoles, grupo)
      contenedorAcciones.append(
        editar,
        guardar,
        cambiarEstado,
        cancelar,
      )
      acciones.append(contenedorAcciones)

      fila.append(nombre, correo, celdaRoles, estado, acciones)
      listado.append(fila)
    }
  }

  /* Actualizamos los datos y conservamos los filtros elegidos.
   Si coinciden consultas, utilizamos la respuesta mas reciente. */
  async function cargarCuentas(): Promise<void> {
    const version = ++versionListado

    botonActualizar.disabled = true
    listado.setAttribute('aria-busy', 'true')
    mostrarMensaje(mensajeListado, 'Cargando cuentas...')

    try {
      const datos = await solicitarAPI<{ cuentas: Cuenta[] }>('/api/cuentas')

      if (version !== versionListado) return

      cuentasCargadas = datos.cuentas
      aplicarFiltros()
    } catch (error) {
      if (version !== versionListado) return

      cuentasCargadas = []
      listado.replaceChildren()

      mostrarMensaje(
        mensajeListado,
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las cuentas.',
        'error',
      )

      revisarAcceso(error)
    } finally {
      if (version === versionListado) {
        botonActualizar.disabled = false
        listado.removeAttribute('aria-busy')
      }
    }
  }

  /* Guardamos los roles elegidos para una cuenta existente. */
  async function guardarRoles(
    cuenta: Cuenta,
    grupo: HTMLFieldSetElement,
    boton: HTMLButtonElement,
  ): Promise<void> {
    if (boton.disabled) return

    const roles = rolesSeleccionados(grupo)

    if (roles.length === 0) {
      grupo.setAttribute('aria-invalid', 'true')

      mostrarMensaje(
        mensajeListado,
        'Seleccioná al menos un rol para la cuenta.',
        'error',
      )

      grupo.querySelector<HTMLInputElement>('input')?.focus()
      return
    }

    boton.disabled = true
    grupo.disabled = true
    boton.textContent = 'Guardando...'
    mostrarMensaje(mensajeListado, 'Actualizando roles...')

    try {
      const respuesta = await solicitarAPI<{ mensaje: string }>(
        '/api/cuentas/roles',
        {
          method: 'POST',
          body: JSON.stringify({
            id: cuenta.id,
            rol: roles,
          }),
        },
      )

      /* Actualizamos tambien el menu si cambiamos nuestros roles. */
      if (cuenta.id === usuarioActualId) {
        window.location.reload()
        return
      }

      await cargarCuentas()

      if (!mensajeListado.classList.contains('mensaje-error')) {
        mostrarMensaje(mensajeListado, respuesta.mensaje, 'exito')
      }
    } catch (error) {
      mostrarMensaje(
        mensajeListado,
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los roles.',
        'error',
      )

      if (error instanceof ErrorAPI && error.campos.includes('rol')) {
        grupo.setAttribute('aria-invalid', 'true')
      }

      revisarAcceso(error)
    } finally {
      boton.disabled = false
      grupo.disabled = false
      boton.textContent = 'Guardar roles'
    }
  }

  /* Confirmamos y enviamos el cambio de estado.
   El backend comprueba el permiso y protege la cuenta propia. */
  async function actualizarEstadoCuenta(
    cuenta: Cuenta,
    boton: HTMLButtonElement,
  ): Promise<void> {
    if (boton.disabled) return

    boton.disabled = true

    try {
      const confirmado = await confirmarCambioEstado(cuenta)

      if (!confirmado) return

      boton.textContent = 'Guardando...'
      mostrarMensaje(mensajeListado, 'Actualizando estado de la cuenta...')

      const ruta = cuenta.activo
        ? '/api/cuentas/desactivar'
        : '/api/cuentas/reactivar'

      const respuesta = await solicitarAPI<{ mensaje: string }>(
        ruta,
        {
          method: 'POST',
          body: JSON.stringify({ id: cuenta.id }),
        },
      )

      await cargarCuentas()

      if (!mensajeListado.classList.contains('mensaje-error')) {
        mostrarMensaje(mensajeListado, respuesta.mensaje, 'exito')
      }
    } catch (error) {
      mostrarMensaje(
        mensajeListado,
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado de la cuenta.',
        'error',
      )

      revisarAcceso(error)
    } finally {
      boton.disabled = false
      boton.textContent = cuenta.activo ? 'Dar de baja' : 'Reactivar'
    }
  }

    /* Marcamos todos los campos incorrectos, pero mostramos
   un mensaje general cuando hay varios errores. */
  function validarAlta(): boolean {
    const datosValidos = validarFormulario(formulario, mensajeAlta)
    const rolesValidos = rolesSeleccionados(grupoRolesAlta).length > 0

    grupoRolesAlta.removeAttribute('aria-invalid')

    if (!rolesValidos) {
      grupoRolesAlta.setAttribute('aria-invalid', 'true')
    }

    const erroresCampos = formulario.querySelectorAll(
      'input[aria-invalid="true"]',
    ).length

    const cantidadErrores = erroresCampos + (rolesValidos ? 0 : 1)

    if (cantidadErrores > 1) {
      mostrarMensaje(
        mensajeAlta,
        'Revisá los campos marcados.',
        'error',
      )
    } else if (!rolesValidos) {
      mostrarMensaje(
        mensajeAlta,
        'Seleccioná al menos un rol.',
        'error',
      )
    }

    /* Si solamente hay un campo incorrecto, conservamos
     el mensaje especifico del validador compartido. */
    return datosValidos && rolesValidos
  }
  formulario.addEventListener('input', () => {
    if (enviandoAlta) return

    mensajeAlta.classList.remove('mensaje-exito')

    if (intentoEnviar) {
      validarAlta()
    } else {
      mensajeAlta.textContent = ''
    }
  })

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    if (enviandoAlta) return

    intentoEnviar = true
    mensajeAlta.classList.remove('mensaje-exito')

    if (!validarAlta()) {
      const primerError = formulario.querySelector<HTMLInputElement>(
        'input[aria-invalid="true"]',
      )

      if (primerError) {
        primerError.focus()
      } else {
        grupoRolesAlta.querySelector<HTMLInputElement>('input')?.focus()
      }

      return
    }

    /* Capturamos los valores antes de bloquear los campos. */
    const datos = new FormData(formulario)
    const roles = rolesSeleccionados(grupoRolesAlta)

    enviandoAlta = true
    botonCrear.disabled = true
    botonCrear.textContent = 'Creando...'
    formulario.setAttribute('aria-busy', 'true')
    camposAlta.forEach((campo) => { campo.disabled = true })

    mostrarMensaje(mensajeAlta, 'Guardando cuenta...')

    try {
      const respuesta = await solicitarAPI<{ mensaje: string }>(
        '/api/cuentas',
        {
          method: 'POST',
          body: JSON.stringify({
            nombre: datos.get('nombre'),
            apellido: datos.get('apellido'),
            email: datos.get('email'),
            contrasena: datos.get('contrasena'),
            rol: roles,
          }),
        },
      )

      formulario.reset()
      intentoEnviar = false
      grupoRolesAlta.removeAttribute('aria-invalid')
      camposAlta.forEach((campo) => campo.removeAttribute('aria-invalid'))

      mostrarMensaje(mensajeAlta, respuesta.mensaje, 'exito')
      await cargarCuentas()
    } catch (error) {
      mostrarMensaje(
        mensajeAlta,
        error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
        'error',
      )

      if (error instanceof ErrorAPI) {
        camposAlta.forEach((campo) => {
          if (error.campos.includes(campo.name)) {
            campo.setAttribute('aria-invalid', 'true')
          }
        })

        if (error.campos.includes('rol')) {
          grupoRolesAlta.setAttribute('aria-invalid', 'true')
        }
      }

      revisarAcceso(error)
    } finally {
      enviandoAlta = false
      botonCrear.disabled = false
      botonCrear.textContent = 'Crear'
      formulario.removeAttribute('aria-busy')
      camposAlta.forEach((campo) => { campo.disabled = false })

      formulario.querySelector<HTMLInputElement>(
        'input[aria-invalid="true"]',
      )?.focus()
    }
  })

  botonActualizar.addEventListener('click', () => {
    void cargarCuentas()
  })

  busqueda.addEventListener('input', aplicarFiltros)
  filtroRol.addEventListener('change', aplicarFiltros)
  filtroEstado.addEventListener('change', aplicarFiltros)

  void cargarCuentas()
}