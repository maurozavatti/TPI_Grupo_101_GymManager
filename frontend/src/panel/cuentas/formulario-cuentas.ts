/* Preparamos la apertura del alta y su selector de roles.
 La creacion y validacion de cuentas siguen en cuentas.ts. */
export function prepararAltaDesplegable(): void {
  const boton = document.querySelector<HTMLButtonElement>(
    '#abrir-alta-cuenta',
  )
  const panel = document.querySelector<HTMLElement>(
    '#panel-alta-cuenta',
  )
  const formulario = document.querySelector<HTMLFormElement>(
    '#formulario-cuenta',
  )
  const selector = document.querySelector<HTMLDetailsElement>(
    '#selector-roles-alta',
  )
  const resumen = document.querySelector<HTMLElement>(
    '#resumen-roles-alta',
  )

  if (!boton || !panel || !formulario || !selector || !resumen) return

  /* Mostramos un texto breve para no ensanchar el formulario. */
  function actualizarResumen(): void {
    if (!formulario || !resumen) return

    const seleccionados = Array.from(
      formulario.querySelectorAll<HTMLInputElement>(
        'input[name="rol"]:checked',
      ),
      (casilla) => casilla.value,
    )

    resumen.textContent = seleccionados.length === 0
      ? 'Seleccionar'
      : seleccionados.length === 1
        ? seleccionados[0]!
        : `${seleccionados.length} roles`

    resumen.title = seleccionados.join(' / ')
  }

  boton.addEventListener('click', () => {
    if (formulario.getAttribute('aria-busy') === 'true') return

    const abrir = panel.hidden

    panel.hidden = !abrir
    boton.setAttribute('aria-expanded', String(abrir))
    boton.textContent = abrir ? 'Cerrar' : 'Nueva cuenta'

    if (abrir) {
      formulario.querySelector<HTMLInputElement>('#nombre')?.focus()
    } else {
      selector.open = false
    }
  })

  formulario.addEventListener('change', actualizarResumen)

  /* Desplegamos las casillas antes de que la validacion
   intente enfocarlas cuando no hay ningun rol seleccionado. */
  formulario.addEventListener('submit', () => {
    const seleccion = formulario.querySelector(
      'input[name="rol"]:checked',
    )

    if (!seleccion) selector.open = true
  }, { capture: true })

  /* Esperamos a que el navegador complete el reset para
   recuperar el resumen correspondiente a los valores iniciales. */
  formulario.addEventListener('reset', () => {
    queueMicrotask(() => {
      actualizarResumen()
      selector.open = false
    })
  })

  document.addEventListener('pointerdown', (evento) => {
    if (evento.target instanceof Node && !selector.contains(evento.target)) {
      selector.open = false
    }
  })

  selector.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      selector.open = false
      selector.querySelector('summary')?.focus()
    }
  })

  actualizarResumen()
}