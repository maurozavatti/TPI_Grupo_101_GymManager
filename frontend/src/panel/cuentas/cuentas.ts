import './cuentas.css'
import { prepararPanel } from '../estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { validarFormulario } from '../../autenticacion/validaciones.ts'
import {obtenerRoles, type RolesCuenta,} from '../../servicios/roles.ts'

/* Estos son los datos publicos que devuelve el listado de cuentas. */
interface Cuenta {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolesCuenta
  activo: boolean
  clienteId: string | null
}

/* Buscamos los elementos necesarios sin continuar con una
 referencia nula si el HTML tiene un identificador incorrecto. */
function elemento<T extends Element>(selector: string): T {
  const encontrado = document.querySelector<T>(selector)

  if (!encontrado) {
    throw new Error(`Falta el elemento ${selector} en la pantalla de cuentas.`)
  }

  return encontrado
}

/* Si la sesion vencio o cambio el permiso, resolvemos el acceso. */
function revisarAcceso(error: unknown): void {
  if (!(error instanceof ErrorAPI)) return

  if (error.estado === 401) {
    window.location.replace('/src/autenticacion/login/login.html')
  } else if (error.estado === 403) {
    window.location.replace('/')
  }
}

/* El backend tambien exige ADMIN en cada operacion. */
const usuario = await prepararPanel('Cuentas', ['ADMIN'])

if (usuario) {
  prepararCuentas()
}

function prepararCuentas(): void {
  const listado = elemento<HTMLTableSectionElement>('#listado-cuentas')
  const mensajeListado = elemento<HTMLParagraphElement>('#mensaje-cuentas')
  const botonActualizar = elemento<HTMLButtonElement>('#actualizar-cuentas')

  const formulario = elemento<HTMLFormElement>('#formulario-cuenta')
  const mensajeAlta = elemento<HTMLParagraphElement>('#mensaje-alta')
  const botonCrear = elemento<HTMLButtonElement>(
    '#formulario-cuenta button[type="submit"]',
  )

  const campos = Array.from(
    formulario.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      'input, select',
    ),
  )

  let enviando = false
  let intentoEnviar = false
  let versionListado = 0

  /* Los datos recibidos se incorporan como texto, sin
   interpretar nombres o correos como contenido HTML. */
  function dibujarCuentas(cuentas: Cuenta[]): void {
    listado.replaceChildren()

    if (cuentas.length === 0) {
      const fila = document.createElement('tr')
      const celda = document.createElement('td')

      celda.colSpan = 4
      celda.textContent = 'No hay cuentas registradas.'

      fila.append(celda)
      listado.append(fila)
      return
    }

    for (const cuenta of cuentas) {
      const fila = document.createElement('tr')

      const valores = [
        `${cuenta.nombre} ${cuenta.apellido}`,
        cuenta.email,
        obtenerRoles(cuenta.rol).join(' / '),
        cuenta.activo ? 'Activa' : 'Inactiva',
      ]

      for (const valor of valores) {
        const celda = document.createElement('td')
        celda.textContent = valor
        fila.append(celda)
      }

      listado.append(fila)
    }
  }

  /* Conservamos el resultado de la consulta mas reciente
   si coinciden una actualizacion manual y un alta. */
  async function cargarCuentas(): Promise<void> {
    const version = ++versionListado

    botonActualizar.disabled = true
    listado.setAttribute('aria-busy', 'true')
    mensajeListado.classList.remove('mensaje-error')
    mensajeListado.textContent = 'Cargando cuentas...'

    try {
      const datos = await solicitarAPI<{ cuentas: Cuenta[] }>(
        '/api/cuentas',
      )

      if (version !== versionListado) return

      dibujarCuentas(datos.cuentas)
      mensajeListado.textContent =
        `Cuentas registradas: ${datos.cuentas.length}.`
    } catch (error) {
      if (version !== versionListado) return

      listado.replaceChildren()
      mensajeListado.classList.add('mensaje-error')
      mensajeListado.textContent = error instanceof Error
        ? error.message
        : 'No se pudieron cargar las cuentas.'

      revisarAcceso(error)
    } finally {
      if (version === versionListado) {
        botonActualizar.disabled = false
        listado.removeAttribute('aria-busy')
      }
    }
  }

  botonActualizar.addEventListener('click', () => {
    void cargarCuentas()
  })

  /* Al corregir un dato revisamos nuevamente las validaciones. */
  formulario.addEventListener('input', () => {
    if (enviando) return

    mensajeAlta.classList.remove('mensaje-exito')

    if (intentoEnviar) {
      validarFormulario(formulario, mensajeAlta)
    } else {
      mensajeAlta.textContent = ''
    }
  })

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    if (enviando) return

    intentoEnviar = true
    mensajeAlta.classList.remove('mensaje-exito')

    if (!validarFormulario(formulario, mensajeAlta)) {
      formulario.querySelector<HTMLInputElement>(
        '[aria-invalid="true"]',
      )?.focus()
      return
    }

    /* Capturamos los datos antes de bloquear los controles.
     La contraseña conserva exactamente lo que se escribio. */
    const datos = new FormData(formulario)

    enviando = true
    botonCrear.disabled = true
    botonCrear.textContent = 'Creando cuenta...'
    formulario.setAttribute('aria-busy', 'true')

    campos.forEach((campo) => {
      campo.disabled = true
    })

    mensajeAlta.classList.remove('mensaje-error')
    mensajeAlta.textContent = 'Guardando cuenta...'

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
            rol: datos.get('rol'),
          }),
        },
      )

      formulario.reset()
      intentoEnviar = false

      campos.forEach((campo) => {
        campo.removeAttribute('aria-invalid')
      })

      mensajeAlta.classList.remove('mensaje-error')
      mensajeAlta.classList.add('mensaje-exito')
      mensajeAlta.textContent = respuesta.mensaje

      await cargarCuentas()
    } catch (error) {
      mensajeAlta.classList.remove('mensaje-exito')
      mensajeAlta.classList.add('mensaje-error')
      mensajeAlta.textContent = error instanceof Error
        ? error.message
        : 'No se pudo crear la cuenta.'

      /* Marcamos los campos indicados por el backend.
       Sus nombres coinciden con los atributos name del HTML. */
      if (error instanceof ErrorAPI) {
        campos.forEach((campo) => {
          if (error.campos.includes(campo.name)) {
            campo.setAttribute('aria-invalid', 'true')
          }
        })
      }

      revisarAcceso(error)
    } finally {
      enviando = false
      botonCrear.disabled = false
      botonCrear.textContent = 'Crear cuenta'
      formulario.removeAttribute('aria-busy')

      campos.forEach((campo) => {
        campo.disabled = false
      })

      formulario.querySelector<HTMLInputElement | HTMLSelectElement>(
        '[aria-invalid="true"]',
      )?.focus()
    }
  })

  void cargarCuentas()
}