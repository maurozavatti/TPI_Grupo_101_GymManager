import { validarFormulario } from '../validaciones.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { prepararAccesoAutenticacion } from '../acceso.ts'

/* Estos son los elementos necesarios para controlar el registro
 y mostrar los mensajes que devuelve el backend.*/
const formulario = document.querySelector<HTMLFormElement>(
  '#formulario-registro',
)

const mensaje = document.querySelector<HTMLParagraphElement>(
  '#mensaje-registro',
)

const boton = formulario?.querySelector<HTMLButtonElement>(
  'button[type="submit"]',
)

/* Comprobamos la sesion antes de preparar el formulario.*/
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

    /* Evitamos enviar otra peticion mientras esperamos
     la respuesta del registro anterior.*/
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

    /* Los nombres del formulario se adaptan a los campos
     que recibe el controlador del backend.*/
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

    /* Mientras se envia el formulario conservamos sus valores
     para que coincidan con los datos que recibe el backend.*/
    for (const campo of campos) {
      campo.readOnly = true
    }

    mensaje.classList.remove('mensaje-error', 'mensaje-exito')
    mensaje.textContent = 'Creando cuenta. Esperá un momento...'

    try {
      await solicitarAPI('/api/register', {
        method: 'POST',
        body: JSON.stringify(registro),
      })

      /* El mensaje de exito aparece solamente cuando el backend
       confirma que guardo la cuenta y su sesion.*/
      formulario.reset()
      seIntentoEnviar = false

      mensaje.classList.add('mensaje-exito')
      mensaje.textContent = 'Cuenta creada correctamente.'
      window.location.replace('/')
    } catch (error) {
      /* Conservamos los datos ingresados para poder corregirlos
       o volver a intentar si hubo un problema de conexion.*/
      mensaje.classList.remove('mensaje-exito')
      mensaje.classList.add('mensaje-error')

      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo crear la cuenta. Intentá nuevamente.'

      /* El backend indica los campos incorrectos mediante
       sus identificadores, como correo o contrasena.*/
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
      /* El formulario vuelve a quedar disponible tanto si
       la operacion termina correctamente como si falla.*/
      enviando = false
      boton.disabled = false
      boton.textContent = 'Registrarse'
      formulario.removeAttribute('aria-busy')

      for (const campo of campos) {
        campo.readOnly = false
      }
    }
  })

  /* Despues del primer intento revisamos los datos mientras
   se corrigen. Durante el envio conservamos el mensaje de espera.*/
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

  /* Utilizamos nuestros mensajes en lugar de los carteles
   de validacion predeterminados del navegador.*/
  formulario.noValidate = true
}