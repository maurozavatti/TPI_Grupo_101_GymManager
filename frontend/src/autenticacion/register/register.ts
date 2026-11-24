import { validarFormulario } from '../validaciones.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { prepararAccesoAutenticacion } from '../acceso.ts'

/* Elementos interactivos del formulario de registro y visualización de estados. */
const formulario = document.querySelector<HTMLFormElement>(
  '#formulario-registro',
)

const mensaje = document.querySelector<HTMLParagraphElement>(
  '#mensaje-registro',
)

const boton = formulario?.querySelector<HTMLButtonElement>(
  'button[type="submit"]',
)

/* Verifica el estado de sesión previo para redirigir si el usuario ya está autenticado. */
const puedeMostrarFormulario = await prepararAccesoAutenticacion(
  formulario,
  mensaje,
  boton,
)

if (formulario && mensaje && boton && puedeMostrarFormulario) {
  let seIntentoEnviar = false
  let enviando = false

  const campos = formulario.querySelectorAll<HTMLInputElement>('input')

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    /* Previene envíos concurrentes mientras se procesa la solicitud actual. */
    if (enviando) {
      return
    }

    seIntentoEnviar = true
    mensaje.classList.remove('mensaje-exito')

    if (!validarFormulario(formulario, mensaje)) {
      formulario.querySelector<HTMLInputElement>(
        '[aria-invalid="true"]',
      )?.focus()

      return
    }

    /* Normaliza los datos del formulario al esquema de registro esperado por la API. */
    const datos = new FormData(formulario)

    const registro = {
      nombre: String(datos.get('nombre') ?? '').trim(),
      apellido: String(datos.get('apellido') ?? '').trim(),
      email: String(datos.get('correo') ?? '').trim(),
      contrasena: String(datos.get('contrasena') ?? ''),
    }

    enviando = true
    boton.disabled = true
    boton.textContent = 'Creando cuenta...'
    formulario.setAttribute('aria-busy', 'true')

    /* Bloquea la edición de los campos durante el procesamiento de la solicitud. */
    for (const campo of Array.from(campos)) {
      campo.readOnly = true
    }

    mensaje.classList.remove('mensaje-error', 'mensaje-exito')
    mensaje.textContent = 'Creando cuenta. Esperá un momento...'

    try {
      await solicitarAPI('/api/register', {
        method: 'POST',
        body: JSON.stringify(registro),
      })

      /* Procesa el registro exitoso confirmado por el servidor y redirige a la raíz. */
      formulario.reset()
      seIntentoEnviar = false

      mensaje.classList.add('mensaje-exito')
      mensaje.textContent = 'Cuenta creada correctamente.'
      window.location.replace('/')
    } catch (error) {
      /* Gestiona errores devueltos por el backend o problemas de conexión. */
      mensaje.classList.remove('mensaje-exito')
      mensaje.classList.add('mensaje-error')

      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo crear la cuenta. Intentá nuevamente.'

      /* Resalta los campos rechazados por la API y enfoca el primer elemento inválido. */
      if (error instanceof ErrorAPI) {
        for (const campo of Array.from(campos)) {
          if (error.campos.includes(campo.id)) {
            campo.setAttribute('aria-invalid', 'true')
          }
        }

        formulario.querySelector<HTMLInputElement>(
          '[aria-invalid="true"]',
        )?.focus()
      }
    } finally {
      /* Restaura la interactividad del formulario al finalizar la solicitud. */
      enviando = false
      boton.disabled = false
      boton.textContent = 'Registrarse'
      formulario.removeAttribute('aria-busy')

      for (const campo of Array.from(campos)) {
        campo.readOnly = false
      }
    }
  })

  /* Revalida los campos de forma dinámica al escribir tras un intento previo de envío. */
  formulario.addEventListener('input', () => {
    if (enviando) {
      return
    }

    mensaje.classList.remove('mensaje-exito')

    if (seIntentoEnviar) {
      validarFormulario(formulario, mensaje)
    } else {
      mensaje.textContent = ''
      mensaje.classList.remove('mensaje-error')
    }
  })

  /* Desactiva la validación nativa del navegador para aplicar el esquema de validación personalizado. */
  formulario.noValidate = true
}