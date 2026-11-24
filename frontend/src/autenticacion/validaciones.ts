/* Valida los campos de un formulario conforme a las restricciones HTML
 y reglas de negocio del sistema. Aplica atributos de accesibilidad
 para el resaltado visual y gestiona mensajes de retroalimentación
 generales (ante múltiples errores) o específicos (ante un único error). */
export function validarFormulario(
  formulario: HTMLFormElement,
  mensaje: HTMLParagraphElement,
): boolean {
  const campos = formulario.querySelectorAll<HTMLInputElement>('input')
  const errores: string[] = []

  const contrasena = formulario.querySelector<HTMLInputElement>(
    '#contrasena',
  )

  for (const campo of Array.from(campos)) {
    /* Las contraseñas conservan los espacios ingresados por el usuario.
     En los demás campos se normalizan descartando espacios en los extremos. */
    const valor = campo.type === 'password'
      ? campo.value
      : campo.value.trim()

    const etiqueta = campo.labels?.[0]?.textContent?.trim().replace(/\s+/g, ' ') ?? campo.name

    let error = ''

    if (campo.required && valor.length === 0) {
      error = `Completá el campo ${etiqueta}.`
    } else if (campo.maxLength >= 0 && valor.length > campo.maxLength) {
      error = `${etiqueta} admite hasta ${campo.maxLength} caracteres.`
    } else if (
      campo.id === 'confirmacion-contrasena'
      && campo.value !== contrasena?.value
    ) {
      error = 'Las contraseñas no coinciden.'
    } else if (
      campo.type === 'email'
      && (
        campo.validity.typeMismatch
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
      )
    ) {
      error = 'Ingresá un correo electrónico válido, por ejemplo nombre@dominio.com.'
    } else if (
      campo.minLength > 0
      && valor.length < campo.minLength
      && campo.id !== 'confirmacion-contrasena'
    ) {
      error = `${etiqueta} debe tener al menos ${campo.minLength} caracteres.`
    }

    /* Asigna o remueve el estado de error para reflejarlo en la interfaz
     y permitir que sea interpretado por tecnologías de asistencia. */
    if (error) {
      campo.setAttribute('aria-invalid', 'true')
      errores.push(error)
    } else {
      campo.removeAttribute('aria-invalid')
    }
  }

  /* Si se detecta más de un error o faltan completar campos requeridos,
   se muestra un mensaje sintético para simplificar la corrección.
   Ante un único problema, se detalla el campo o motivo correspondiente. */
  if (errores.length > 1) {
    const camposIncompletos = Array.from(campos).filter(
      (campo) =>
        campo.required
        && (campo.type === 'password' ? campo.value : campo.value.trim()).length === 0,
    ).length

    mensaje.textContent = camposIncompletos > 0
      ? 'Completá los campos obligatorios para continuar.'
      : 'Revisá los campos marcados para continuar.'
  } else if (errores.length === 1) {
    mensaje.textContent = errores[0]
  } else {
    mensaje.textContent = ''
  }

  mensaje.classList.toggle('mensaje-error', errores.length > 0)

  return errores.length === 0
}