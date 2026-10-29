import '../style.css'
import './estructura.css'
import { exigirAcceso, tieneRol } from '../servicios/permisos.ts'
import { cerrarSesion } from '../servicios/sesion.ts'
import type { RolUsuario, UsuarioSesion } from '../servicios/sesion.ts'

const rolesPersonal: readonly RolUsuario[] = ['ADMIN', 'ENTRENADOR']

/* Detectamos las paginas existentes para no mostrar enlaces
 a modulos que todavia no fueron incorporados al proyecto.*/
const paginasDisponibles = new Set(Object.keys(
  import.meta.glob('/src/**/*.html', { query: '?raw', import: 'default' }),
))

const opcionesMenu: {
  texto: string
  ruta: string
  roles: readonly RolUsuario[]
}[] = [
  { texto: 'Inicio', ruta: '/src/panel/inicio/inicio.html', roles: rolesPersonal },
  { texto: 'Clientes', ruta: '/src/panel/clientes/clientes.html', roles: rolesPersonal },
  { texto: 'Ejercicios', ruta: '/src/panel/ejercicios/ejercicios.html', roles: rolesPersonal },
  { texto: 'Rutinas', ruta: '/src/panel/rutinas/rutinas.html', roles: rolesPersonal },
  { texto: 'Turnos', ruta: '/src/panel/turnos/turnos.html', roles: rolesPersonal },
  { texto: 'Pagos', ruta: '/src/panel/pagos/pagos.html', roles: ['ADMIN'] },
  { texto: 'Cuentas', ruta: '/src/panel/cuentas/cuentas.html', roles: ['ADMIN'] },
  { texto: 'Mi perfil', ruta: '/src/cliente/perfil/perfil.html', roles: ['USUARIO'] },
  { texto: 'Mi cuenta', ruta: '/', roles: ['ADMIN', 'ENTRENADOR', 'USUARIO'] },
]

/* Esta funcion prepara la estructura compartida del panel.
 Conserva el contenido de #vista y lo incorpora al diseño comun.
 Devuelve null si redirige o si no puede preparar la pantalla.*/
export async function prepararPanel(
  titulo: string,
  roles: readonly RolUsuario[] = rolesPersonal,
): Promise<UsuarioSesion | null> {
  const vista = document.querySelector<HTMLElement>('#vista')
  const estado = document.querySelector<HTMLElement>('#estado-panel')
    ?? document.createElement('p')

  estado.className = 'estado-panel'
  estado.setAttribute('role', 'status')
  estado.textContent = 'Comprobando sesión...'

  if (!estado.isConnected) document.body.prepend(estado)
  if (vista) vista.hidden = true

  try {
    const usuario = await exigirAcceso(roles)

    if (!usuario) return null
    if (!vista) throw new Error('Falta el contenedor de la vista')

    const estructura = document.createElement('div')
    estructura.className = 'estructura-panel'

    /* Solo la estructura fija se escribe como HTML.
     Los datos de la cuenta y el titulo se incorporan como texto.*/
    estructura.innerHTML = `
      <aside class="barra-lateral">
        <a class="marca-panel" href="/">GymManager</a>
        <nav class="menu-panel" aria-label="Menu principal"></nav>
        <button class="boton-panel cerrar-panel" type="button">
          Cerrar sesión
        </button>
      </aside>
      <div class="zona-principal">
        <header class="encabezado-panel">
          <h1></h1>
          <div class="cuenta-panel">
            <span class="nombre-panel"></span>
            <span class="rol-panel"></span>
          </div>
        </header>
        <main class="contenido-panel">
          <p class="mensaje-panel" role="status"></p>
        </main>
      </div>
    `

    const encabezado = estructura.querySelector('h1')
    const nombre = estructura.querySelector<HTMLElement>('.nombre-panel')
    const rol = estructura.querySelector<HTMLElement>('.rol-panel')
    const menu = estructura.querySelector('nav')
    const contenido = estructura.querySelector('main')
    const mensaje = estructura.querySelector<HTMLElement>('.mensaje-panel')
    const boton = estructura.querySelector<HTMLButtonElement>('button')

    if (!encabezado || !nombre || !rol || !menu || !contenido || !mensaje || !boton) {
      throw new Error('La estructura del panel esta incompleta')
    }

    encabezado.textContent = titulo
    nombre.textContent = `${usuario.nombre} ${usuario.apellido}`
    rol.textContent = usuario.rol

    const rutaActual = window.location.pathname === '/index.html'
      ? '/'
      : window.location.pathname

    /* Cada opcion requiere un rol permitido y una pagina existente.
     Mi cuenta permanece disponible en la raiz del proyecto.*/
    for (const opcion of opcionesMenu) {
      if (!tieneRol(usuario, opcion.roles)) continue
      if (opcion.ruta !== '/' && !paginasDisponibles.has(opcion.ruta)) continue

      const enlace = document.createElement('a')
      enlace.className = 'opcion-menu'
      enlace.textContent = opcion.texto
      enlace.href = opcion.ruta

      if (rutaActual === opcion.ruta) {
        enlace.setAttribute('aria-current', 'page')
      }

      menu.append(enlace)
    }

    boton.addEventListener('click', async () => {
      if (boton.disabled) return

      boton.disabled = true
      boton.textContent = 'Cerrando sesión...'
      mensaje.textContent = ''

      try {
        await cerrarSesion()
        window.location.replace('/src/autenticacion/login/login.html')
      } catch (error) {
        mensaje.textContent = error instanceof Error
          ? error.message
          : 'No se pudo cerrar la sesión. Intentá nuevamente.'
      } finally {
        boton.disabled = false
        boton.textContent = 'Cerrar sesión'
      }
    })

    /* Movemos el contenido original sin duplicarlo ni perder
     los elementos que cada modulo definio en su HTML.*/
    document.body.replaceChildren(estructura)
    contenido.append(vista)
    vista.hidden = false

    return usuario
  } catch {
    estado.textContent = 'No se pudo abrir la pantalla. Recargá para volver a intentar.'
    estado.classList.add('estado-error')
    return null
  }
}

/* Al volver desde el historial comprobamos otra vez la sesion.*/
window.addEventListener('pageshow', (evento) => {
  if (evento.persisted) window.location.reload()
})