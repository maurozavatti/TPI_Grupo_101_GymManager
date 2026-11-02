import './cuentas.css'
import { prepararPanel } from '../estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import type { RolUsuario } from '../../servicios/sesion.ts'

/* Estos son los datos publicos que devuelve el listado de cuentas. */
interface Cuenta {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolUsuario
  activo: boolean
  clienteId: string | null
}

/* Esta pantalla esta disponible solamente para ADMIN.
 El backend tambien comprueba ese permiso en cada consulta. */
const usuario = await prepararPanel('Cuentas', ['ADMIN'])

if (usuario) {
  prepararListado()
}

/* Conectamos los elementos una vez que el panel esta preparado. */
function prepararListado(): void {
  const listado = document.querySelector<HTMLTableSectionElement>(
    '#listado-cuentas',
  )
  const mensaje = document.querySelector<HTMLParagraphElement>(
    '#mensaje-cuentas',
  )
  const boton = document.querySelector<HTMLButtonElement>(
    '#actualizar-cuentas',
  )

  if (!listado || !mensaje || !boton) return

  /* Cada valor recibido se coloca como texto para evitar
   interpretar los datos de una cuenta como codigo HTML. */
  function dibujarCuentas(cuentas: Cuenta[]): void {
    if (!listado) return

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
        cuenta.rol,
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

  /* Actualizamos el listado sin recargar toda la pagina.
   Mientras esperamos, bloqueamos nuevas consultas del boton. */
  async function cargarCuentas(): Promise<void> {
    if (!listado || !mensaje || !boton || boton.disabled) return

    boton.disabled = true
    listado.setAttribute('aria-busy', 'true')
    mensaje.classList.remove('mensaje-error')
    mensaje.textContent = 'Cargando cuentas...'

    try {
      const datos = await solicitarAPI<{ cuentas: Cuenta[] }>(
        '/api/cuentas',
      )

      dibujarCuentas(datos.cuentas)
      mensaje.textContent = `Cuentas registradas: ${datos.cuentas.length}.`
    } catch (error) {
      listado.replaceChildren()
      mensaje.classList.add('mensaje-error')
      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudieron cargar las cuentas.'

      /* Si la sesion vencio, volvemos al login. Si cambio
       el rol de la cuenta, volvemos a resolver su destino. */
      if (error instanceof ErrorAPI) {
        if (error.estado === 401) {
          window.location.replace('/src/autenticacion/login/login.html')
        } else if (error.estado === 403) {
          window.location.replace('/')
        }
      }
    } finally {
      boton.disabled = false
      listado.removeAttribute('aria-busy')
    }
  }

  boton.addEventListener('click', () => {
    void cargarCuentas()
  })

  void cargarCuentas()
}