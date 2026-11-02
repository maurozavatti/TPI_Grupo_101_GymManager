import './cuenta.css'
import { validarFormulario } from '../autenticacion/validaciones.ts'
import { ErrorAPI, solicitarAPI } from '../servicios/api.ts'
import { prepararPanel } from '../panel/estructura.ts'
import { obtenerRoles } from '../servicios/roles.ts'

/* Esta funcion conecta el formulario de contraseña una vez
 que la estructura del panel y la sesion estan preparadas. */
export function prepararCambioContrasena(): void {
  const formulario = document.querySelector<HTMLFormElement>(
    '#formulario-contrasena',
  )
  const mensaje = document.querySelector<HTMLParagraphElement>(
    '#mensaje-contrasena',
  )
  const boton = formulario?.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  )

  if (!formulario || !mensaje || !boton) return

  const campos = Array.from(
    formulario.querySelectorAll<HTMLInputElement>('input'),
  )

  let enviando = false
  let intentoEnviar = false

  /* Al corregir un campo revisamos nuevamente los errores.
   Mientras se envia la peticion no cambiamos su estado. */
  formulario.addEventListener('input', () => {
    if (enviando) return

    mensaje.classList.remove('mensaje-exito')

    if (intentoEnviar) {
      validarFormulario(formulario, mensaje)
    } else {
      mensaje.textContent = ''
    }
  })

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    if (enviando) return

    intentoEnviar = true
    mensaje.classList.remove('mensaje-exito')

    if (!validarFormulario(formulario, mensaje)) {
      formulario.querySelector<HTMLInputElement>(
        '[aria-invalid="true"]',
      )?.focus()
      return
    }

    /* Tomamos los valores antes de bloquear el formulario.
     Las contraseñas se envian exactamente como se escribieron. */
    const datos = new FormData(formulario)

    enviando = true
    boton.disabled = true
    boton.textContent = 'Guardando...'
    formulario.setAttribute('aria-busy', 'true')
    campos.forEach((campo) => { campo.readOnly = true })

    mensaje.classList.remove('mensaje-error')
    mensaje.textContent = 'Actualizando contraseña...'

    try {
      const respuesta = await solicitarAPI<{ mensaje: string }>(
        '/api/cuenta/contrasena',
        {
          method: 'POST',
          body: JSON.stringify({
            actual: datos.get('actual'),
            nueva: datos.get('nueva'),
            confirmacion: datos.get('confirmacion'),
          }),
        },
      )

      formulario.reset()
      intentoEnviar = false
      campos.forEach((campo) => campo.removeAttribute('aria-invalid'))

      mensaje.classList.remove('mensaje-error')
      mensaje.classList.add('mensaje-exito')
      mensaje.textContent = respuesta.mensaje
    } catch (error) {
      mensaje.classList.remove('mensaje-exito')
      mensaje.classList.add('mensaje-error')
      mensaje.textContent = error instanceof Error
        ? error.message
        : 'No se pudo cambiar la contraseña. Intentá nuevamente.'

      /* El backend identifica los campos incorrectos por nombre.
       Marcamos sus bordes y enfocamos el primero. */
      if (error instanceof ErrorAPI) {
        for (const campo of campos) {
          if (error.campos.includes(campo.name)) {
            campo.setAttribute('aria-invalid', 'true')
          }
        }

        if (error.estado === 401) {
          window.location.replace('/src/autenticacion/login/login.html')
          return
        }
      }

      formulario.querySelector<HTMLInputElement>(
        '[aria-invalid="true"]',
      )?.focus()
    } finally {
      enviando = false
      boton.disabled = false
      boton.textContent = 'Guardar contraseña'
      formulario.removeAttribute('aria-busy')
      campos.forEach((campo) => { campo.readOnly = false })
    }
  })
}

/* Preparamos la pagina de cuenta para cualquiera de los roles.
 Los datos visibles se obtienen de la sesion verificada. */
const usuario = await prepararPanel(
  'Mi cuenta',
  ['ADMIN', 'ENTRENADOR', 'USUARIO'],
)

if (usuario) {
  const nombre = document.querySelector<HTMLElement>('#nombre-usuario')
  const correo = document.querySelector<HTMLElement>('#correo-usuario')
  const rol = document.querySelector<HTMLElement>('#rol-usuario')

  if (nombre) nombre.textContent = `${usuario.nombre} ${usuario.apellido}`
  if (correo) correo.textContent = usuario.email
  if (rol) rol.textContent = obtenerRoles(usuario.rol).join(' / ')

  prepararCambioContrasena()
}