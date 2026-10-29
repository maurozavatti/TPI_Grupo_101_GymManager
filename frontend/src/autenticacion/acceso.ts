import { consultarSesion } from '../servicios/sesion.ts'

/* Esta funcion comprueba si corresponde mostrar login o registro.
 Si ya existe una sesion, dirige al inicio autenticado.
 El formulario se habilita solamente cuando termina la consulta.*/
export async function prepararAccesoAutenticacion(
  formulario: HTMLFormElement | null,
  mensaje: HTMLParagraphElement | null,
  boton: HTMLButtonElement | null | undefined,
): Promise<boolean> {
  if (!formulario || !mensaje || !boton) {
    return false
  }

  const campos = formulario.querySelectorAll<HTMLInputElement>('input')
  let permitirFormulario = false

  /* Bloqueamos los envios mientras se consulta la sesion.*/
  const bloquearEnvio = (evento: Event): void => {
    evento.preventDefault()
  }

  formulario.addEventListener('submit', bloquearEnvio)
  formulario.setAttribute('aria-busy', 'true')
  boton.disabled = true

  for (const campo of campos) {
    campo.readOnly = true
  }

  mensaje.classList.remove('mensaje-error', 'mensaje-exito')
  mensaje.textContent = 'Comprobando sesión...'

  try {
    const usuario = await consultarSesion()

    if (usuario) {
      mensaje.textContent = 'Sesión iniciada. Redirigiendo...'
      window.location.replace('/')
      return false
    }

    permitirFormulario = true
    mensaje.textContent = ''
    return true
  } catch (error) {
    /* Un problema de conexion no significa que la sesion
     este cerrada. Informamos el error antes de continuar.*/
    mensaje.classList.add('mensaje-error')

    const detalle = error instanceof Error
      ? error.message
      : 'No se pudo comprobar la sesión.'

    mensaje.textContent =
      `${detalle} Recargá la página para volver a intentar.`

    return false
  } finally {
    formulario.removeAttribute('aria-busy')

    if (permitirFormulario) {
      formulario.removeEventListener('submit', bloquearEnvio)
      boton.disabled = false

      for (const campo of campos) {
        campo.readOnly = false
      }
    }
  }
}