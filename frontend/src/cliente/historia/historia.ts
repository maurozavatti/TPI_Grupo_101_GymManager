import { prepararPanel } from '../../panel/estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { incluyeRol } from '../../servicios/roles.ts'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  dni: string
  activo: boolean
}

interface HistoriaClinica {
  antecedentes: string
  lesiones: string
  observaciones: string
  fechaActualizacion: string | null
  modificadoPor: string | null
}

const usuario = await prepararPanel('Historia clínica', ['ADMIN', 'ENTRENADOR', 'USUARIO'])

if (usuario) {
  const esPersonal = incluyeRol(usuario.rol, ['ADMIN', 'ENTRENADOR'])
  const el = <T extends HTMLElement>(selector: string): T => {
    const resultado = document.querySelector<T>(selector)
    if (!resultado) throw new Error(`Falta el elemento ${selector}`)
    return resultado
  }
  const selectorSeccion = el<HTMLElement>('#selector-seccion')
  const selectorCliente = el<HTMLSelectElement>('#selector-cliente')
  const tarjeta = el<HTMLElement>('#tarjeta-historia')
  const mensaje = el<HTMLParagraphElement>('#mensaje-historia')
  const formulario = el<HTMLFormElement>('#formulario-historia')
  const botonGuardar = el<HTMLButtonElement>('#guardar-historia')
  let clienteActual: Cliente | null = null

  function limpiarCampos(): void {
    el<HTMLTextAreaElement>('#antecedentes').value = ''
    el<HTMLTextAreaElement>('#lesiones').value = ''
    el<HTMLTextAreaElement>('#observaciones').value = ''
  }

  async function cargarHistoria(clienteId?: string): Promise<void> {
    tarjeta.hidden = true
    mensaje.textContent = 'Cargando historia clínica...'
    const ruta = esPersonal && clienteId
      ? `/api/historia?clienteId=${encodeURIComponent(clienteId)}`
      : '/api/historia'

    try {
      const datos = await solicitarAPI<{
        cliente: Cliente
        historiaClinica: HistoriaClinica | null
      }>(ruta)
      clienteActual = datos.cliente
      el<HTMLElement>('#nombre-cliente').textContent =
        `${datos.cliente.apellido}, ${datos.cliente.nombre} · DNI ${datos.cliente.dni}`
      el<HTMLElement>('#estado-historia').textContent = datos.cliente.activo
        ? 'Ficha activa'
        : 'Ficha inactiva'
      limpiarCampos()
      if (datos.historiaClinica) {
        el<HTMLTextAreaElement>('#antecedentes').value = datos.historiaClinica.antecedentes
        el<HTMLTextAreaElement>('#lesiones').value = datos.historiaClinica.lesiones
        el<HTMLTextAreaElement>('#observaciones').value = datos.historiaClinica.observaciones
        const fecha = datos.historiaClinica.fechaActualizacion
          ? new Date(datos.historiaClinica.fechaActualizacion).toLocaleString('es-AR')
          : 'Fecha no disponible'
        const autor = datos.historiaClinica.modificadoPor
          ? ` · Modificada por ${datos.historiaClinica.modificadoPor}`
          : ''
        el<HTMLElement>('#fecha-historia').textContent = `Última actualización: ${fecha}${autor}`
      } else {
        el<HTMLElement>('#fecha-historia').textContent = 'Todavía no hay información cargada.'
      }
      tarjeta.hidden = false
      mensaje.textContent = ''
    } catch (error) {
      clienteActual = null
      mensaje.textContent = error instanceof Error ? error.message : 'No se pudo consultar la historia clínica.'
      mensaje.classList.add('estado-error')
    }
  }

  if (esPersonal) {
    selectorSeccion.hidden = false
    try {
      const datos = await solicitarAPI<{ clientes: Cliente[] }>('/api/clientes')
      const clientes = datos.clientes
        .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'))
      selectorCliente.replaceChildren(new Option('Seleccioná un cliente', ''))
      for (const cliente of clientes) {
        selectorCliente.add(new Option(
          `${cliente.apellido}, ${cliente.nombre} · DNI ${cliente.dni}${cliente.activo ? '' : ' (inactivo)'}`,
          cliente.id,
        ))
      }
      mensaje.textContent = 'Seleccioná un cliente para consultar o actualizar su historia.'
    } catch (error) {
      mensaje.textContent = error instanceof Error ? error.message : 'No se pudo cargar el listado de clientes.'
      mensaje.classList.add('estado-error')
    }
    selectorCliente.addEventListener('change', () => {
      if (!selectorCliente.value) {
        tarjeta.hidden = true
        clienteActual = null
        return
      }
      void cargarHistoria(selectorCliente.value)
    })
  } else {
    await cargarHistoria()
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault()
    if (!clienteActual) return
    const clienteId = clienteActual.id
    const antecedentes = el<HTMLTextAreaElement>('#antecedentes').value.trim()
    const lesiones = el<HTMLTextAreaElement>('#lesiones').value.trim()
    const observaciones = el<HTMLTextAreaElement>('#observaciones').value.trim()
    if (!antecedentes && !lesiones && !observaciones) {
      mensaje.textContent = 'Completá al menos un campo de la historia clínica.'
      mensaje.classList.add('estado-error')
      return
    }

    botonGuardar.disabled = true
    mensaje.textContent = 'Guardando historia clínica...'
    mensaje.classList.remove('estado-error')
    try {
      await solicitarAPI('/api/historia', {
        method: 'POST',
        body: JSON.stringify({
          ...(esPersonal ? { clienteId } : {}),
          antecedentes,
          lesiones,
          observaciones,
        }),
      })
      await cargarHistoria(esPersonal ? clienteId : undefined)
      mensaje.textContent = 'Historia clínica guardada correctamente.'
    } catch (error) {
      mensaje.textContent = error instanceof Error ? error.message : 'No se pudo guardar la historia clínica.'
      mensaje.classList.add('estado-error')
      if (error instanceof ErrorAPI) {
        for (const campo of formulario.querySelectorAll<HTMLTextAreaElement>('textarea')) {
          campo.toggleAttribute('aria-invalid', error.campos.includes(campo.name))
        }
      }
    } finally {
      botonGuardar.disabled = false
    }
  })
}
