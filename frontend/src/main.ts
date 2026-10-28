import './style.css'
import './autenticacion/autenticacion.css'
import { consultarSesion, cerrarSesion } from './servicios/sesion.ts'

/* Estos son los elementos de la pantalla inicial.*/
const titulo = document.querySelector<HTMLHeadingElement>('#titulo-inicio')
const datos = document.querySelector<HTMLDivElement>('#datos-sesion')
const nombre = document.querySelector<HTMLParagraphElement>('#nombre-usuario')
const correo = document.querySelector<HTMLParagraphElement>('#correo-usuario')
const rol = document.querySelector<HTMLParagraphElement>('#rol-usuario')
const mensaje = document.querySelector<HTMLParagraphElement>('#mensaje-inicio')

const botonCerrar = document.querySelector<HTMLButtonElement>(
  '#boton-cerrar-sesion',
)

const botonReintentar = document.querySelector<HTMLButtonElement>(
  '#boton-reintentar',
)

const rutaLogin = '/src/autenticacion/login/login.html'

if (
  titulo
  && datos
  && nombre
  && correo
  && rol
  && mensaje
  && botonCerrar
  && botonReintentar
) {
  /* Esta funcion decide que mostrar al abrir la web.
   Sin una sesion valida, se dirige al inicio de sesion.*/
const iniciarAplicacion = async (): Promise<void> => {
    titulo.textContent = 'Comprobando sesión'
    mensaje.textContent = 'Esperá un momento...'
    mensaje.classList.remove('mensaje-error')

    datos.hidden = true
    botonCerrar.hidden = true
    botonReintentar.hidden = true

    try {
      const usuario = await consultarSesion()

      if (!usuario) {
        window.location.replace(rutaLogin)
        return
      }

      /* Mostramos los datos como texto para evitar interpretar
       contenido del usuario como codigo HTML.*/
      titulo.textContent = 'Mi cuenta'
      nombre.textContent = `${usuario.nombre} ${usuario.apellido}`
      correo.textContent = usuario.email
      rol.textContent = `Rol: ${usuario.rol}`

      mensaje.textContent = ''
      datos.hidden = false
      botonCerrar.hidden = false
    } catch (error) {
      /* Un fallo del servidor no se interpreta como una sesion
       cerrada. Permitimos volver a consultar.*/
      titulo.textContent = 'No se pudo comprobar la sesión'
      mensaje.classList.add('mensaje-error')

      mensaje.textContent = error instanceof Error
        ? error.message
        : 'Ocurrió un problema. Intentá nuevamente.'

      botonReintentar.hidden = false
    }
  }

  /* Esta accion elimina la sesion y vuelve al login
   solamente cuando el backend confirma el cierre.*/
  botonCerrar.addEventListener('click', async () => {
    if (botonCerrar.disabled) {
      return
    }

    botonCerrar.disabled = true
    botonCerrar.textContent = 'Cerrando sesión...'
    mensaje.classList.remove('mensaje-error')
    mensaje.textContent = ''

    try {
      await cerrarSesion()
      window.location.replace(rutaLogin)
    } catch (error) {
      mensaje.classList.add('mensaje-error')

      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo cerrar la sesión. Intentá nuevamente.'
    } finally {
      botonCerrar.disabled = false
      botonCerrar.textContent = 'Cerrar sesión'
    }
  })

  botonReintentar.addEventListener('click', () => {
    void iniciarAplicacion()
  })

  /* Si el navegador restaura la pantalla desde su historial,
   volvemos a comprobar que la sesion siga siendo valida.*/
  window.addEventListener('pageshow', (evento) => {
    if (evento.persisted) {
      void iniciarAplicacion()
    }
  })

  void iniciarAplicacion()
}