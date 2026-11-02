import './cuentas.css'
import { prepararPanel } from '../estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { validarFormulario } from '../../autenticacion/validaciones.ts'
import { obtenerRoles } from '../../servicios/roles.ts'
import type { RolesCuenta } from '../../servicios/roles.ts'
import type { RolUsuario } from '../../servicios/sesion.ts'

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
    grupo.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'),
    (casilla) => casilla.value as RolUsuario,
  )
}

/* Mostramos el mensaje usando los colores generales de estado. */
function mostrarMensaje(
  elementoMensaje: HTMLElement,
  texto: string,
  estado: 'error' | 'exito' | 'normal' = 'normal',
): void {
  elementoMensaje.textContent = texto
  elementoMensaje.classList.toggle('mensaje-error', estado === 'error')
  elementoMensaje.classList.toggle('mensaje-exito', estado === 'exito')
}

function revisarAcceso(error: unknown): void {
  if (!(error instanceof ErrorAPI)) return

  if (error.estado === 401) {
    window.location.replace('/src/autenticacion/login/login.html')
  } else if (error.estado === 403) {
    window.location.replace('/')
  }
}

const usuario = await prepararPanel('Cuentas', ['ADMIN'])

if (usuario) {
  prepararCuentas(usuario.id)
}

function prepararCuentas(usuarioActualId: string): void {
  const listado = elemento<HTMLTableSectionElement>('#listado-cuentas')
  const mensajeListado = elemento<HTMLParagraphElement>('#mensaje-cuentas')
  const botonActualizar = elemento<HTMLButtonElement>('#actualizar-cuentas')

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

  /* Creamos las casillas de una cuenta con sus roles actuales.
   Los nombres y correos siempre se incorporan como texto. */
  function dibujarCuentas(cuentas: Cuenta[]): void {
    listado.replaceChildren()

    if (cuentas.length === 0) {
      const fila = document.createElement('tr')
      const celda = document.createElement('td')

      celda.colSpan = 5
      celda.textContent = 'No hay cuentas registradas.'
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

      const grupo = document.createElement('fieldset')
      grupo.className = 'roles-cuenta'

      const leyenda = document.createElement('legend')
      leyenda.textContent = 'Roles'
      grupo.append(leyenda)

      const actuales = obtenerRoles(cuenta.rol)

      for (const rol of rolesDisponibles) {
        const etiqueta = document.createElement('label')
        etiqueta.className = 'opcion-rol'

        const casilla = document.createElement('input')
        casilla.type = 'checkbox'
        casilla.value = rol
        casilla.checked = actuales.includes(rol)

        etiqueta.append(casilla, document.createTextNode(rol))
        grupo.append(etiqueta)
      }

      grupo.addEventListener('change', () => {
        grupo.removeAttribute('aria-invalid')
      })

      const guardar = document.createElement('button')
      guardar.type = 'button'
      guardar.className = 'boton-panel'
      guardar.textContent = 'Guardar roles'

      guardar.addEventListener('click', () => {
        void guardarRoles(cuenta, grupo, guardar)
      })

      celdaRoles.append(grupo)
      acciones.append(guardar)
      fila.append(nombre, correo, celdaRoles, estado, acciones)
      listado.append(fila)
    }
  }

  /* Conservamos el resultado de la consulta mas reciente. */
  async function cargarCuentas(): Promise<void> {
    const version = ++versionListado

    botonActualizar.disabled = true
    listado.setAttribute('aria-busy', 'true')
    mostrarMensaje(mensajeListado, 'Cargando cuentas...')

    try {
      const datos = await solicitarAPI<{ cuentas: Cuenta[] }>('/api/cuentas')

      if (version !== versionListado) return

      dibujarCuentas(datos.cuentas)
      mostrarMensaje(
        mensajeListado,
        `Cuentas registradas: ${datos.cuentas.length}.`,
      )
    } catch (error) {
      if (version !== versionListado) return

      listado.replaceChildren()
      mostrarMensaje(
        mensajeListado,
        error instanceof Error ? error.message : 'No se pudieron cargar las cuentas.',
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

  /* Guardamos los roles de la fila seleccionada.
   La comprobacion definitiva de permisos la realiza el backend. */
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

      /* Actualizamos tambien el encabezado y el menu si
       el cambio corresponde a la cuenta que esta conectada. */
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
        error instanceof Error ? error.message : 'No se pudieron guardar los roles.',
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

  /* Reutilizamos las validaciones de los datos personales
   y comprobamos por separado el grupo de casillas. */
  function validarAlta(): boolean {
    const datosValidos = validarFormulario(formulario, mensajeAlta)
    const rolesValidos = rolesSeleccionados(grupoRolesAlta).length > 0

    grupoRolesAlta.removeAttribute('aria-invalid')

    if (!rolesValidos) {
      grupoRolesAlta.setAttribute('aria-invalid', 'true')
      const anterior = mensajeAlta.textContent ?? ''
      mostrarMensaje(
        mensajeAlta,
        `${anterior} Seleccioná al menos un rol.`.trim(),
        'error',
      )
    }

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

    const datos = new FormData(formulario)
    const roles = rolesSeleccionados(grupoRolesAlta)

    enviandoAlta = true
    botonCrear.disabled = true
    botonCrear.textContent = 'Creando cuenta...'
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
      botonCrear.textContent = 'Crear cuenta'
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

  void cargarCuentas()
}