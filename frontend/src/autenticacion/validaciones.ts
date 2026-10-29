/* Esta funcion revisa los campos de un formulario y marca
 los que contienen errores. Se utiliza tanto en login como
 en registro y devuelve true cuando los datos son validos.*/
export function validarFormulario(
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

  /* Los mensajes se muestran como texto y su color se toma
   de la clase mensaje-error definida en autenticacion.css.*/
  mensaje.textContent = errores.join(' ')
  mensaje.classList.toggle('mensaje-error', errores.length > 0)

  return errores.length === 0
}