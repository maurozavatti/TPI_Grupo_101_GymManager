import { validarFormulario } from '../validaciones.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'

/* Estos son los elementos necesarios para controlar el login
 y mostrar los mensajes que devuelve el backend.*/
const formulario = document.querySelector<HTMLFormElement>(
  '#formulario-login',
)

const mensaje = document.querySelector<HTMLParagraphElement>(
  '#mensaje-login',
)

const boton = formulario?.querySelector<HTMLButtonElement>(
  'button[type="submit"]',
)

if (formulario && mensaje && boton) {
  let seIntentoEnviar = false
  let enviando = false

  const campos = formulario.querySelectorAll<HTMLInputElement>('input')

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    /* Evitamos enviar otra peticion mientras esperamos
     la respuesta del intento anterior.*/
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

    /* Adaptamos el nombre del campo correo al dato email
     que espera el controlador del backend.*/
    const datos = new FormData(formulario)

    const credenciales = {
      email: String(datos.get('correo') ?? '').trim(),
      contrasena: String(datos.get('contrasena') ?? ''),
    }

    enviando = true
    boton.disabled = true
    boton.textContent = 'Ingresando...'
    formulario.setAttribute('aria-busy', 'true')

    /* Conservamos los valores mientras se comprueban
     las credenciales enviadas.*/
    for (const campo of campos) {
      campo.readOnly = true
    }

    mensaje.classList.remove('mensaje-error', 'mensaje-exito')
    mensaje.textContent = 'Iniciando sesión. Esperá un momento...'

    try {
      await solicitarAPI('/api/login', {
        method: 'POST',
        body: JSON.stringify(credenciales),
      })

      /* El mensaje de exito aparece cuando el backend
       confirma las credenciales y guarda la nueva sesion.
       El navegador recibe la cookie automaticamente.*/
      formulario.reset()
      seIntentoEnviar = false

      mensaje.classList.add('mensaje-exito')
      mensaje.textContent = 'Sesión iniciada correctamente.'
      window.location.replace('/')
    } catch (error) {
      /* Conservamos los datos para corregirlos o volver
       a intentar si hubo un problema de conexion.*/
      mensaje.classList.remove('mensaje-exito')
      mensaje.classList.add('mensaje-error')

      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo iniciar sesión. Intentá nuevamente.'

      /* Marcamos los campos que indique el backend.
       Si las credenciales no coinciden, se marcan ambos.*/
      if (error instanceof ErrorAPI) {
        for (const campo of campos) {
          if (error.campos.includes(campo.id)) {
            campo.setAttribute('aria-invalid', 'true')
          }
        }

        formulario.querySelector<HTMLInputElement>(
          '[aria-invalid="true"]',
        )?.focus()
      }
    } finally {
      /* Restauramos el formulario al terminar la peticion.*/
      enviando = false
      boton.disabled = false
      boton.textContent = 'Ingresar'
      formulario.removeAttribute('aria-busy')

      for (const campo of campos) {
        campo.readOnly = false
      }
    }
  })

  /* Actualizamos las validaciones mientras se corrigen
   los datos, conservando el mensaje durante el envio.*/
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

  /* Utilizamos los mensajes propios del formulario.*/
  formulario.noValidate = true
}