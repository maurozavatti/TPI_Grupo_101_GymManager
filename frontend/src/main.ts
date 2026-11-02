import './style.css'
import { consultarSesion } from './servicios/sesion.ts'

/* La entrada principal consulta la sesion y dirige a la
 pantalla correspondiente. No contiene el diseño del panel. */
async function iniciarWeb(): Promise<void> {
  const estado = document.querySelector<HTMLElement>('#estado-inicio')

  try {
    const usuario = await consultarSesion()

    if (!usuario) {
      window.location.replace('/src/autenticacion/login/login.html')
      return
    }

    /* El usuario accede temporalmente a Mi cuenta.
     Su perfil se conectara cuando esa pantalla este disponible. */
    const destino = usuario.rol === 'USUARIO'
      ? '/src/cuenta/cuenta.html'
      : '/src/panel/inicio/inicio.html'

    window.location.replace(destino)
  } catch {
    if (estado) {
      estado.textContent =
        'No se pudo comprobar la sesión. Recargá para volver a intentar.'
      estado.style.color = 'var(--color-error)'
    }
  }
}

void iniciarWeb()