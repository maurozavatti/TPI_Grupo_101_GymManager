/* Estos son los elementos del HTML que necesitamos
 para controlar el formulario y mostrar sus mensajes.*/
const formulario = document.querySelector<HTMLFormElement>(
  '#formulario-registro',
)

const mensaje = document.querySelector<HTMLParagraphElement>(
  '#mensaje-registro',
)

/* Esta funcion revisa los campos y marca los que contienen
 errores. Devuelve true cuando todos los datos son validos.*/
function validarFormulario(
  formulario: HTMLFormElement,
  mensaje: HTMLParagraphElement,
): boolean {
  const campos = formulario.querySelectorAll<HTMLInputElement>('input')
  const errores: string[] = []

  const contrasena = formulario.querySelector<HTMLInputElement>(
    '#contrasena',
  )

  for (const campo of campos) {
    /* Las contraseñas conservan sus espacios.
     En los demas campos ignoramos los espacios de los extremos.*/
    const valor = campo.type === 'password'
      ? campo.value
      : campo.value.trim()

    const etiqueta = campo.labels?.[0]?.textContent?.trim() ?? campo.name

    let error = ''

    if (campo.required && valor.length === 0) {
      error = `Completá el campo ${etiqueta}.`
    } else if (campo.maxLength >= 0 && valor.length > campo.maxLength) {
      error = `${etiqueta} admite hasta ${campo.maxLength} caracteres.`
    } else if (campo.minLength > 0 && valor.length < campo.minLength) {
      error = `${etiqueta} debe tener al menos ${campo.minLength} caracteres.`
    } else if (
      campo.type === 'email'
      && (
        campo.validity.typeMismatch
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
      )
    ) {
      error = 'Ingresá un correo válido, por ejemplo nombre@dominio.com.'
    } else if (
      campo.id === 'confirmacion-contrasena'
      && campo.value !== contrasena?.value
    ) {
      error = 'Las contraseñas no coinciden.'
    }

    /* Este atributo permite aplicar el borde rojo y comunicar
     a los lectores de pantalla que el campo tiene un error.*/
    if (error) {
      campo.setAttribute('aria-invalid', 'true')
      errores.push(error)
    } else {
      campo.removeAttribute('aria-invalid')
    }
  }

  mensaje.textContent = errores.join(' ')
  mensaje.classList.toggle('mensaje-error', errores.length > 0)

  return errores.length === 0
}

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
     Todavia no se realiza la creacion de la cuenta.*/
    mensaje.textContent = 'Datos válidos. Esta prueba todavía no crea la cuenta.'
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