import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

async function comprobarBackend() {
  if (!app) return

  app.textContent = 'Conectando con el backend...'

  try {
    // Pedimos al backend su estado a traves del proxy de Vite.
    const respuesta = await fetch('/api/salud')

    // Si el backend devuelve un error, pasamos al catch.
    if (!respuesta.ok) {
      throw new Error('El backend devolvio un error')
    }

    // Convertimos la respuesta JSON y mostramos su mensaje.
    const datos = await respuesta.json()

    app.textContent = `GymManager — ${datos.mensaje}`
  } catch {
    app.textContent = 'GymManager — No se pudo conectar con el backend.'
  }
}

comprobarBackend()