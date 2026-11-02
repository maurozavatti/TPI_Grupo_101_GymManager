import './cuenta.css'
import { validarFormulario } from '../autenticacion/validaciones.ts'
import { ErrorAPI, solicitarAPI } from '../servicios/api.ts'
import { prepararPanel } from '../panel/estructura.ts'
import { obtenerRoles } from '../servicios/roles.ts'

function elemento<T extends Element>(selector: string): T {
  const encontrado = document.querySelector<T>(selector)

  if (!encontrado) {
    throw new Error(`Falta el elemento ${selector} en Mi cuenta.`)
  }

  return encontrado
}

/* Conectamos el formulario una vez que el panel esta preparado. */
export function prepararCambioContrasena(): void {
  const formulario = elemento<HTMLFormElement>('#formulario-contrasena')
  const panel = elemento<HTMLElement>('#panel-contrasena')
  const mensaje = elemento<HTMLParagraphElement>('#mensaje-contrasena')
  const alternar = elemento<HTMLButtonElement>('#alternar-contrasena')
  const guardar = elemento<HTMLButtonElement>('#guardar-contrasena')
  const cancelar = elemento<HTMLButtonElement>('#cancelar-contrasena')
  const actual = elemento<HTMLInputElement>('#contrasena-actual')

  const campos = Array.from(
    formulario.querySelectorAll<HTMLInputElement>('input'),
  )

  let enviando = false
  let intentoEnviar = false

  function mostrarMensaje(
    texto: string,
    estado: 'error' | 'exito' | 'normal' = 'normal',
  ): void {
    mensaje.textContent = texto
    mensaje.classList.toggle('mensaje-error', estado === 'error')
    mensaje.classList.toggle('mensaje-exito', estado === 'exito')
  }

  /* Al cerrar limpiamos las claves para no dejarlas escritas.
   Durante el envio no permitimos cerrar el formulario. */
  function cambiarVisibilidad(abrir: boolean): void {
    if (enviando) return

    panel.hidden = !abrir
    alternar.setAttribute('aria-expanded', String(abrir))
    alternar.textContent = abrir ? 'Cerrar' : 'Cambiar contraseña'

    if (abrir) {
      actual.focus()
      return
    }

    formulario.reset()
    intentoEnviar = false
    campos.forEach((campo) => campo.removeAttribute('aria-invalid'))
    mostrarMensaje('')
    alternar.focus()
  }

  /* Conservamos los bordes de todos los errores y resumimos
   el mensaje si hay mas de un campo incorrecto. */
  function validarClave(): boolean {
    const valido = validarFormulario(formulario, mensaje)

    const errores = formulario.querySelectorAll(
      'input[aria-invalid="true"]',
    ).length

    if (errores > 1) {
      mostrarMensaje('Revisá los campos marcados.', 'error')
    }

    return valido
  }

  alternar.addEventListener('click', () => {
    cambiarVisibilidad(panel.hasAttribute('hidden'))
  })

  cancelar.addEventListener('click', () => {
    cambiarVisibilidad(false)
  })

  formulario.addEventListener('input', () => {
    if (enviando) return

    mensaje.classList.remove('mensaje-exito')

    if (intentoEnviar) {
      validarClave()
    } else {
      mostrarMensaje('')
    }
  })

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    if (enviando) return

    intentoEnviar = true
    mensaje.classList.remove('mensaje-exito')

    if (!validarClave()) {
      formulario.querySelector<HTMLInputElement>(
        '[aria-invalid="true"]',
      )?.focus()
      return
    }

    /* Capturamos los valores antes de bloquear los controles.
     Las contraseñas no se recortan ni se modifican. */
    const datos = new FormData(formulario)

    enviando = true
    guardar.disabled = true
    cancelar.disabled = true
    alternar.disabled = true
    guardar.textContent = 'Guardando...'
    formulario.setAttribute('aria-busy', 'true')
    campos.forEach((campo) => { campo.readOnly = true })

    mostrarMensaje('Actualizando contraseña...')

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

      /* Conservamos abierto el panel para que pueda leerse
       la confirmacion del cambio realizado. */
      mostrarMensaje(respuesta.mensaje, 'exito')
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo cambiar la contraseña. Intentá nuevamente.',
        'error',
      )

      if (error instanceof ErrorAPI) {
        campos.forEach((campo) => {
          if (error.campos.includes(campo.name)) {
            campo.setAttribute('aria-invalid', 'true')
          }
        })

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
      guardar.disabled = false
      cancelar.disabled = false
      alternar.disabled = false
      guardar.textContent = 'Guardar'
      formulario.removeAttribute('aria-busy')
      campos.forEach((campo) => { campo.readOnly = false })
    }
  })
}

/* Los datos visibles siempre se obtienen de la sesion verificada. */
const usuario = await prepararPanel(
  'Mi cuenta',
  ['ADMIN', 'ENTRENADOR', 'USUARIO'],
)

if (usuario) {
  const nombre = elemento<HTMLElement>('#nombre-usuario')
  const correo = elemento<HTMLElement>('#correo-usuario')
  const roles = elemento<HTMLElement>('#rol-usuario')
  const iniciales = elemento<HTMLElement>('#iniciales-usuario')

  nombre.textContent = `${usuario.nombre} ${usuario.apellido}`
  correo.textContent = usuario.email

  iniciales.textContent = (
    usuario.nombre.trim().charAt(0)
    + usuario.apellido.trim().charAt(0)
  ).toUpperCase() || 'GM'

  roles.replaceChildren()

  for (const rol of obtenerRoles(usuario.rol)) {
    const etiqueta = document.createElement('span')
    etiqueta.className = `etiqueta-rol etiqueta-rol-${rol.toLowerCase()}`
    etiqueta.textContent = rol
    roles.append(etiqueta)
  }

  prepararCambioContrasena()
}