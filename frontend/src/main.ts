import './style.css'
import { consultarSesion } from './servicios/sesion.ts'
import { incluyeRol } from './servicios/roles.ts'

/* La entrada principal consulta la sesion y resuelve el destino.
 Las pantallas mantienen sus propios controles de acceso. */
async function iniciarWeb(): Promise<void> {
  const estado = document.querySelector<HTMLElement>('#estado-inicio')

  try {
    const usuario = await consultarSesion()

    if (!usuario) {
      window.location.replace('/src/autenticacion/login/login.html')
      return
    }

    /* Los roles del personal tienen prioridad cuando una cuenta
     tiene varios roles. */
    const esPersonal = incluyeRol(
      usuario.rol,
      ['ADMIN', 'ENTRENADOR'],
    )

    const destino = esPersonal
      ? '/src/panel/inicio/inicio.html'
      : incluyeRol(usuario.rol, ['USUARIO'])
        ? '/src/cliente/perfil/perfil.html'
        : '/src/cuenta/cuenta.html'

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
