import { validarFormulario } from '../validaciones.ts'

/* Estos son los elementos del HTML que necesitamos
 para controlar el login y mostrar sus mensajes.*/
const formulario = document.querySelector<HTMLFormElement>(
  '#formulario-login',
)

const mensaje = document.querySelector<HTMLParagraphElement>(
  '#mensaje-login',
)

/* Los eventos se preparan solamente si se encontraron
 el formulario y el espacio de mensajes en el HTML.*/
if (formulario && mensaje) {
  let seIntentoEnviar = false

  formulario.addEventListener('submit', (evento) => {
    /* Evitamos el envio tradicional y la recarga de la pagina.*/
    evento.preventDefault()
    seIntentoEnviar = true

    const datosValidos = validarFormulario(formulario, mensaje)

    if (!datosValidos) {
      /* Ubicamos el cursor en el primer campo incorrecto.*/
      formulario.querySelector<HTMLInputElement>(
        '[aria-invalid="true"]',
      )?.focus()

      return
    }

    /* Este mensaje permite probar la validacion.
     Todavia no se comprueban las credenciales en el backend.*/
    mensaje.textContent = 'Datos válidos. Esta prueba todavía no inicia sesión.'
  })

  /* Despues del primer intento de envio, los errores se
   actualizan mientras se corrigen los datos del formulario.*/
  formulario.addEventListener('input', () => {
    if (seIntentoEnviar) {
      validarFormulario(formulario, mensaje)
    }
  })

  /* Desactivamos los carteles nativos del navegador una vez
   que nuestros eventos de validacion ya estan preparados.*/
  formulario.noValidate = true
}