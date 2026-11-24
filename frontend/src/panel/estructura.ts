import '../style.css'
import './estructura.css'
import { exigirAcceso, tieneRol } from '../servicios/permisos.ts'
import { cerrarSesion } from '../servicios/sesion.ts'
import type { RolUsuario, UsuarioSesion } from '../servicios/sesion.ts'
import { obtenerRoles } from '../servicios/roles.ts'
import { createIcons, Menu } from 'lucide'

/* Roles con privilegios de gestión técnica y administrativa en el panel */
const rolesPersonal: readonly RolUsuario[] = ['ADMIN', 'ENTRENADOR']

/* Conjunto de rutas estáticas disponibles resueltas en tiempo de compilación */
const paginasDisponibles = new Set(Object.keys(
  import.meta.glob('/src/**/*.html', { query: '?raw', import: 'default' }),
))

/* Definición de la estructura de navegación y matriz de control de acceso por rol */
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
  { texto: 'Historia clínica', ruta: '/src/cliente/historia/historia.html', roles: ['ADMIN', 'ENTRENADOR', 'USUARIO'] },
]

/**
 * Inicializa y renderiza la estructura compartida del panel de la aplicación.
 * Verifica la validez de la sesión activa, aplica restricciones de acceso basadas en roles
 * e integra el contenedor de vista (#vista) en el diseño unificado.
 *
 * @param titulo Identificador contextual de la pantalla para soporte de accesibilidad.
 * @param roles Lista de roles habilitados para consumir la vista invocadora.
 * @returns Objeto de sesión verificada o null si no se superó la autenticación.
 */
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

    /* Estructura semántica base: incluye encabezado de escritorio, navegación flotante móvil y área de contenido */
    estructura.innerHTML = `
      <!-- Control de apertura de navegación para resoluciones reducidas -->
      <button
        class="boton-fijo-movil"
        type="button"
        aria-expanded="false"
        aria-controls="menu-movil"
        aria-label="Abrir menú de navegación"
      >
        <i data-lucide="menu"></i>
      </button>

      <!-- Panel de navegación flotante compacto para dispositivos móviles -->
      <div id="menu-movil" class="menu-movil-desplegable" role="dialog" aria-label="Menú principal" hidden>
        <nav class="nav-movil" aria-label="Navegación principal"></nav>
        <div class="perfil-movil">
          <a class="opcion-movil opcion-cuenta-movil" href="/src/cuenta/cuenta.html">
            Mi cuenta
          </a>
          <button
            class="opcion-movil opcion-cerrar-movil"
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <!-- Encabezado persistente para visualización en escritorio -->
      <header class="encabezado-panel">
        <div class="barra-superior">
          <div class="cabecera-izquierda">
            <a class="marca-panel" href="/">GymManager</a>
            <h1 class="sr-only"></h1>
            <nav id="menu-panel" class="menu-panel" aria-label="Menú principal"></nav>
          </div>

          <div class="bloque-superior-derecho">
            <div class="contenedor-usuario">
              <button
                class="cuenta-panel boton-usuario"
                type="button"
                aria-expanded="false"
                aria-haspopup="menu"
                aria-controls="menu-usuario"
                aria-label="Menú de usuario"
              >
                <span class="avatar-cuenta" aria-hidden="true"></span>
                <span class="datos-cuenta-panel">
                  <span class="nombre-panel"></span>
                  <span class="rol-panel"></span>
                </span>
              </button>

              <div id="menu-usuario" class="desplegable-usuario" role="menu" hidden>
                <a class="opcion-desplegable" role="menuitem" href="/src/cuenta/cuenta.html">
                  Mi cuenta
                </a>
                <button
                  class="opcion-desplegable opcion-cerrar-sesion cerrar-panel"
                  role="menuitem"
                  type="button"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main class="contenido-panel">
        <p class="mensaje-panel" role="status"></p>
      </main>
    `

    const encabezado = estructura.querySelector('h1')
    const nombre = estructura.querySelector<HTMLElement>('.nombre-panel')
    const rol = estructura.querySelector<HTMLElement>('.rol-panel')
    const avatar = estructura.querySelector<HTMLElement>('.avatar-cuenta')
    const botonUsuario = estructura.querySelector<HTMLButtonElement>('.boton-usuario')
    const menuUsuario = estructura.querySelector<HTMLElement>('#menu-usuario')
    const enlaceMiCuenta = estructura.querySelector<HTMLAnchorElement>('#menu-usuario a')
    const menuDesktop = estructura.querySelector<HTMLElement>('#menu-panel')
    const contenido = estructura.querySelector('main')
    const mensaje = estructura.querySelector<HTMLElement>('.mensaje-panel')
    const botonCerrar = estructura.querySelector<HTMLButtonElement>('.cerrar-panel')
    const botonMovil = estructura.querySelector<HTMLButtonElement>('.boton-fijo-movil')
    const menuMovil = estructura.querySelector<HTMLElement>('#menu-movil')
    const menuMovilNav = estructura.querySelector<HTMLElement>('.nav-movil')
    const botonCerrarMovil = estructura.querySelector<HTMLButtonElement>('.opcion-cerrar-movil')
    const enlaceCuentaMovil = estructura.querySelector<HTMLAnchorElement>('.opcion-cuenta-movil')

    if (
      !encabezado
      || !nombre
      || !rol
      || !avatar
      || !botonUsuario
      || !menuUsuario
      || !enlaceMiCuenta
      || !menuDesktop
      || !contenido
      || !mensaje
      || !botonCerrar
      || !botonMovil
      || !menuMovil
      || !menuMovilNav
      || !botonCerrarMovil
      || !enlaceCuentaMovil
    ) {
      throw new Error('La estructura del panel esta incompleta')
    }

    encabezado.textContent = titulo
    nombre.textContent = `${usuario.nombre} ${usuario.apellido}`
    const rolesTexto = obtenerRoles(usuario.rol).join(' / ')
    rol.textContent = rolesTexto

    const iniciales = (
      usuario.nombre.trim().charAt(0)
      + usuario.apellido.trim().charAt(0)
    ).toUpperCase() || 'GM'
    avatar.textContent = iniciales

    botonUsuario.setAttribute(
      'aria-label',
      `Menú de usuario: ${usuario.nombre} ${usuario.apellido} (${rolesTexto})`,
    )

    const rutaActual = window.location.pathname === '/index.html'
      ? '/'
      : window.location.pathname

    if (rutaActual === '/src/cuenta/cuenta.html') {
      enlaceMiCuenta.setAttribute('aria-current', 'page')
      enlaceCuentaMovil.setAttribute('aria-current', 'page')
    }

    /* Construcción dinámica de elementos de navegación filtrados por privilegios y rutas activas */
    for (const opcion of opcionesMenu) {
      if (!tieneRol(usuario, opcion.roles)) continue
      if (opcion.ruta !== '/' && !paginasDisponibles.has(opcion.ruta)) continue

      /* Pestaña de navegación para interfaz de escritorio */
      const enlaceDesktop = document.createElement('a')
      enlaceDesktop.className = 'opcion-menu'
      enlaceDesktop.textContent = opcion.texto
      enlaceDesktop.href = opcion.ruta

      if (rutaActual === opcion.ruta) {
        enlaceDesktop.setAttribute('aria-current', 'page')
      }

      menuDesktop.append(enlaceDesktop)

      /* Elemento de lista para el menú desplegable en pantallas móviles */
      const enlaceMovil = document.createElement('a')
      enlaceMovil.className = 'opcion-movil'
      enlaceMovil.textContent = opcion.texto
      enlaceMovil.href = opcion.ruta

      if (rutaActual === opcion.ruta) {
        enlaceMovil.setAttribute('aria-current', 'page')
      }

      menuMovilNav.append(enlaceMovil)
    }

    /* Garantiza visibilidad inicial de la pestaña activa en contenedores con desbordamiento horizontal */
    const enlaceActivoDesktop = menuDesktop.querySelector<HTMLElement>('[aria-current="page"]')
    if (enlaceActivoDesktop) {
      enlaceActivoDesktop.scrollIntoView({ inline: 'nearest', block: 'nearest' })
    }

    /* Inicialización del vector gráfico (SVG) correspondiente al disparador móvil */
    createIcons({
      icons: { Menu },
      root: botonMovil,
      attrs: {
        width: 20,
        height: 20,
        'aria-hidden': 'true',
        focusable: 'false',
      },
    })

    /* Control de estado y visibilidad del menú contextual móvil */
    let menuMovilAbierto = false

    function alternarMenuMovil(abrir?: boolean): void {
      menuMovilAbierto = typeof abrir === 'boolean' ? abrir : !menuMovilAbierto
      if (botonMovil) {
        botonMovil.setAttribute('aria-expanded', String(menuMovilAbierto))
        botonMovil.setAttribute(
          'aria-label',
          menuMovilAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación',
        )
      }
      if (menuMovil) {
        menuMovil.hidden = !menuMovilAbierto
      }
    }

    botonMovil.addEventListener('click', (evento) => {
      evento.stopPropagation()
      alternarMenuMovil()
    })

    /* Cierre automático del menú móvil al seleccionar una opción de navegación */
    menuMovil.addEventListener('click', (evento) => {
      const opcion = (evento.target as HTMLElement).closest('.opcion-movil')
      if (opcion) {
        alternarMenuMovil(false)
      }
    })

    /* Control de estado y despliegue del menú de usuario en escritorio */
    let menuUsuarioAbierto = false

    function alternarMenuUsuario(abrir?: boolean): void {
      menuUsuarioAbierto = typeof abrir === 'boolean' ? abrir : !menuUsuarioAbierto
      if (botonUsuario && menuUsuario) {
        botonUsuario.setAttribute('aria-expanded', String(menuUsuarioAbierto))
        menuUsuario.hidden = !menuUsuarioAbierto
      }
    }

    botonUsuario.addEventListener('click', (evento) => {
      evento.stopPropagation()
      alternarMenuUsuario()
    })

    enlaceMiCuenta.addEventListener('click', () => {
      alternarMenuUsuario(false)
    })

    /* Accesibilidad por teclado: cierre de menús abiertos mediante la tecla Escape */
    window.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') {
        if (menuUsuarioAbierto) {
          alternarMenuUsuario(false)
          botonUsuario.focus()
        }
        if (menuMovilAbierto) {
          alternarMenuMovil(false)
          botonMovil.focus()
        }
      }
    })

    /* Detección de clics externos para el cierre automático de menús superpuestos */
    document.addEventListener('click', (evento) => {
      if (
        menuUsuarioAbierto
        && evento.target instanceof Node
        && !menuUsuario.contains(evento.target)
        && !botonUsuario.contains(evento.target)
      ) {
        alternarMenuUsuario(false)
      }

      if (
        menuMovilAbierto
        && evento.target instanceof Node
        && !menuMovil.contains(evento.target)
        && !botonMovil.contains(evento.target)
      ) {
        alternarMenuMovil(false)
      }
    })

    /* Procedimiento unificado para revocación de credenciales y redirección de acceso */
    async function ejecutarCierreSesion(boton: HTMLButtonElement): Promise<void> {
      if (boton.disabled) return

      boton.disabled = true
      const textoOriginal = boton.textContent
      boton.textContent = 'Cerrando sesión...'
      if (mensaje) {
        mensaje.textContent = ''
      }

      try {
        await cerrarSesion()
        window.location.replace('/src/autenticacion/login/login.html')
      } catch (error) {
        if (mensaje) {
          mensaje.textContent = error instanceof Error
            ? error.message
            : 'No se pudo cerrar la sesión. Intentá nuevamente.'
        }
        alternarMenuUsuario(false)
        alternarMenuMovil(false)
      } finally {
        boton.disabled = false
        boton.textContent = textoOriginal
      }
    }

    botonCerrar.addEventListener('click', () => {
      void ejecutarCierreSesion(botonCerrar)
    })

    botonCerrarMovil.addEventListener('click', () => {
      void ejecutarCierreSesion(botonCerrarMovil)
    })

    /* Inyección de la vista modular dentro del contenedor principal del layout */
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

/* Revalidación del estado de sesión ante navegaciones restauradas desde caché de historial (bfcache) */
window.addEventListener('pageshow', (evento) => {
  if (evento.persisted) window.location.reload()
})
