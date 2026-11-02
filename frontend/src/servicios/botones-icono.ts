import {
  createIcons,
  Pencil,
  Save,
  Trash2,
  X,
  Recycle,
  ChevronLeft,
  ChevronRight,
} from 'lucide'
import './botones-icono.css'

const nombresIconos = {
  editar: 'pencil',
  guardar: 'save',
  baja: 'trash-2',
  reactivar: 'recycle',
  cancelar: 'x',
  anterior: 'chevron-left',
  siguiente: 'chevron-right',
} as const

type AccionBoton = keyof typeof nombresIconos

const preparados = new WeakSet<HTMLButtonElement>()

let ayuda: HTMLDivElement | null = null
let propietario: HTMLButtonElement | null = null

/* Compartimos una sola ayuda flotante entre los botones.
 Se coloca fuera de la tabla para evitar que el scroll la recorte. */
function obtenerAyuda(): HTMLDivElement {
  if (!ayuda) {
    ayuda = document.createElement('div')
    ayuda.id = 'ayuda-boton-icono'
    ayuda.className = 'ayuda-boton-icono'
    ayuda.setAttribute('role', 'tooltip')
    ayuda.hidden = true
  }

  if (!ayuda.isConnected) {
    document.body.append(ayuda)
  }

  return ayuda
}

function ocultarAyuda(): void {
  if (ayuda) ayuda.hidden = true

  propietario?.removeAttribute('aria-describedby')
  propietario = null
}

/* Ajustamos la posicion para mantener la ayuda dentro de la pantalla. */
function mostrarAyuda(boton: HTMLButtonElement): void {
  if (!boton.isConnected || boton.disabled) return

  ocultarAyuda()

  const cuadro = obtenerAyuda()
  cuadro.textContent = boton.dataset.ayuda ?? ''
  cuadro.hidden = false

  const posicion = boton.getBoundingClientRect()
  const ancho = cuadro.offsetWidth
  const alto = cuadro.offsetHeight

  const izquierda = Math.max(
    8,
    Math.min(
      posicion.left + posicion.width / 2 - ancho / 2,
      window.innerWidth - ancho - 8,
    ),
  )

  let arriba = posicion.top - alto - 8

  if (arriba < 8) {
    arriba = posicion.bottom + 8
  }

  arriba = Math.max(
    8,
    Math.min(arriba, window.innerHeight - alto - 8),
  )

  cuadro.style.left = `${izquierda}px`
  cuadro.style.top = `${arriba}px`

  propietario = boton
  boton.setAttribute('aria-describedby', cuadro.id)
}

/* Configuramos el icono y su nombre accesible.
 Puede volver a llamarse para mostrar el estado de guardado. */
export function ponerIconoBoton(
  boton: HTMLButtonElement,
  accion: AccionBoton,
  descripcion: string,
): void {
  ocultarAyuda()

  boton.classList.add('boton-icono')
  boton.dataset.accion = accion
  boton.dataset.ayuda = descripcion
  boton.setAttribute('aria-label', descripcion)
  boton.removeAttribute('title')

  const icono = document.createElement('i')
  icono.setAttribute('data-lucide', nombresIconos[accion])

  boton.replaceChildren(icono)

  createIcons({
    icons: {
      Pencil,
      Save,
      Trash2,
      X,
      Recycle,
      ChevronLeft,
      ChevronRight,
    },
    root: boton,
    attrs: {
      width: 20,
      height: 20,
      'aria-hidden': 'true',
      focusable: 'false',
    },
  })

  /* Los eventos se agregan una sola vez por boton. */
  if (preparados.has(boton)) return

  preparados.add(boton)

  let temporizador: number | undefined
  let bloquearClick = false
  let inicioX = 0
  let inicioY = 0

  function cancelarEspera(): void {
    window.clearTimeout(temporizador)
    temporizador = undefined
  }

  boton.addEventListener('pointerenter', (evento) => {
    if (evento.pointerType === 'mouse') {
      mostrarAyuda(boton)
    }
  })

  boton.addEventListener('pointerleave', (evento) => {
    if (evento.pointerType === 'mouse') {
      ocultarAyuda()
    }
  })

  boton.addEventListener('focus', () => {
    if (boton.matches(':focus-visible')) {
      mostrarAyuda(boton)
    }
  })

  boton.addEventListener('blur', ocultarAyuda)

  boton.addEventListener('keydown', (evento) => {
    bloquearClick = false

    if (evento.key === 'Escape') {
      ocultarAyuda()
    }
  })

  /* En pantallas tactiles esperamos antes de mostrar la ayuda.
   Un toque corto sigue ejecutando la accion normalmente. */
  boton.addEventListener('pointerdown', (evento) => {
    cancelarEspera()
    ocultarAyuda()
    bloquearClick = false

    if (evento.pointerType === 'mouse') return

    inicioX = evento.clientX
    inicioY = evento.clientY

    temporizador = window.setTimeout(() => {
      if (!boton.isConnected || boton.disabled) return

      bloquearClick = true
      mostrarAyuda(boton)
    }, 550)
  })

  /* Si el dedo se mueve, interpretamos que quiere desplazarse,
   no consultar la ayuda del boton. */
  boton.addEventListener('pointermove', (evento) => {
    if (evento.pointerType === 'mouse') return

    const distancia = Math.hypot(
      evento.clientX - inicioX,
      evento.clientY - inicioY,
    )

    if (distancia > 10) {
      cancelarEspera()

      if (propietario === boton) ocultarAyuda()
    }
  })

  boton.addEventListener('pointerup', cancelarEspera)

  boton.addEventListener('pointercancel', () => {
    cancelarEspera()

    if (propietario === boton) ocultarAyuda()
  })

  /* Evitamos el menu nativo al mantener pulsado el icono. */
  boton.addEventListener('contextmenu', (evento) => {
    evento.preventDefault()
  })

  /* La pulsacion larga consulta la ayuda, pero no guarda,
   modifica ni da de baja una cuenta. */
  boton.addEventListener('click', (evento) => {
    if (!bloquearClick) return

    evento.preventDefault()
    evento.stopImmediatePropagation()
    bloquearClick = false
  }, { capture: true })
}

/* Cerramos la ayuda al desplazarse o tocar otra zona. */
window.addEventListener('scroll', ocultarAyuda, true)
window.addEventListener('resize', ocultarAyuda)

document.addEventListener('pointerdown', (evento) => {
  if (
    propietario
    && evento.target instanceof Node
    && !propietario.contains(evento.target)
  ) {
    ocultarAyuda()
  }
})