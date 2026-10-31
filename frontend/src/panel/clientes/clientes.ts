import '../estructura.css'
import './clientes.css'
import { prepararPanel } from '../estructura.ts'
import { ErrorAPI, solicitarAPI } from '../../servicios/api.ts'
import { validarFormulario } from '../../autenticacion/validaciones.ts'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  activo: boolean
  vinculado: boolean
}

const usuario = await prepararPanel('Clientes')

if (usuario) {
  const esAdmin = usuario.rol === 'ADMIN'

  const mensajeGeneral = document.querySelector<HTMLElement>('#mensaje-clientes')!
  const botonNuevo = document.querySelector<HTMLButtonElement>('#boton-nuevo-cliente')!
  const cuerpoTabla = document.querySelector<HTMLTableSectionElement>('#cuerpo-tabla-clientes')!

  const formularioCliente = document.querySelector<HTMLFormElement>('#formulario-cliente')!
  const tituloFormulario = document.querySelector<HTMLElement>('#titulo-formulario-cliente')!
  const campoClienteId = document.querySelector<HTMLInputElement>('#cliente-id')!
  const mensajeFormularioCliente = document.querySelector<HTMLParagraphElement>('#mensaje-formulario-cliente')!
  const botonCancelarCliente = document.querySelector<HTMLButtonElement>('#boton-cancelar-cliente')!

  const formularioVincular = document.querySelector<HTMLFormElement>('#formulario-vincular')!
  const campoVincularClienteId = document.querySelector<HTMLInputElement>('#vincular-cliente-id')!
  const mensajeFormularioVincular = document.querySelector<HTMLParagraphElement>('#mensaje-formulario-vincular')!
  const botonCancelarVincular = document.querySelector<HTMLButtonElement>('#boton-cancelar-vincular')!

  if (!esAdmin) {
    botonNuevo.hidden = true
  }

  function ocultarFormularios(): void {
    formularioCliente.hidden = true
    formularioVincular.hidden = true
    formularioCliente.reset()
    formularioVincular.reset()
    mensajeFormularioCliente.textContent = ''
    mensajeFormularioVincular.textContent = ''
  }

  async function cargarClientes(): Promise<void> {
    mensajeGeneral.textContent = 'Cargando clientes...'
    mensajeGeneral.classList.remove('mensaje-error')

    try {
      const datos = await solicitarAPI<{ clientes: Cliente[] }>('/api/clientes')
      mensajeGeneral.textContent = ''
      dibujarTabla(datos.clientes)
    } catch (error) {
      mensajeGeneral.classList.add('mensaje-error')
      mensajeGeneral.textContent = error instanceof Error
        ? error.message
        : 'No se pudo cargar el listado de clientes.'
    }
  }

  function dibujarTabla(clientes: Cliente[]): void {
    cuerpoTabla.replaceChildren()

    if (!clientes.length) {
      const fila = document.createElement('tr')
      const celda = document.createElement('td')
      celda.colSpan = 7
      celda.textContent = 'Todavía no hay clientes cargados.'
      fila.append(celda)
      cuerpoTabla.append(fila)
      return
    }

    for (const cliente of clientes) {
      const fila = document.createElement('tr')

      const celdaNombre = document.createElement('td')
      celdaNombre.textContent = `${cliente.apellido}, ${cliente.nombre}`

      const celdaDni = document.createElement('td')
      celdaDni.textContent = cliente.dni

      const celdaTelefono = document.createElement('td')
      celdaTelefono.textContent = cliente.telefono || '—'

      const celdaEmail = document.createElement('td')
      celdaEmail.textContent = cliente.email || '—'

      const celdaEstado = document.createElement('td')
      const etiquetaEstado = document.createElement('span')
      etiquetaEstado.className = `etiqueta-estado ${cliente.activo ? 'etiqueta-activo' : 'etiqueta-inactivo'}`
      etiquetaEstado.textContent = cliente.activo ? 'Activo' : 'Inactivo'
      celdaEstado.append(etiquetaEstado)

      const celdaCuenta = document.createElement('td')
      celdaCuenta.textContent = cliente.vinculado ? 'Vinculada' : 'Sin cuenta'

      const celdaAcciones = document.createElement('td')

      if (esAdmin) {
        const contenedorAcciones = document.createElement('div')
        contenedorAcciones.className = 'acciones-fila'

        const botonEditar = document.createElement('button')
        botonEditar.type = 'button'
        botonEditar.className = 'boton-fila'
        botonEditar.textContent = 'Editar'
        botonEditar.addEventListener('click', () => abrirEdicion(cliente))
        contenedorAcciones.append(botonEditar)

        const botonEstado = document.createElement('button')
        botonEstado.type = 'button'
        botonEstado.className = 'boton-fila'
        botonEstado.textContent = cliente.activo ? 'Dar de baja' : 'Reactivar'
        botonEstado.addEventListener('click', () => cambiarEstado(cliente))
        contenedorAcciones.append(botonEstado)

        if (!cliente.vinculado && cliente.activo) {
          const botonVincular = document.createElement('button')
          botonVincular.type = 'button'
          botonVincular.className = 'boton-fila'
          botonVincular.textContent = 'Vincular cuenta'
          botonVincular.addEventListener('click', () => abrirVinculacion(cliente))
          contenedorAcciones.append(botonVincular)
        }

        celdaAcciones.append(contenedorAcciones)
      } else {
        celdaAcciones.textContent = '—'
      }

      fila.append(celdaNombre, celdaDni, celdaTelefono, celdaEmail, celdaEstado, celdaCuenta, celdaAcciones)
      cuerpoTabla.append(fila)
    }
  }

  function abrirAlta(): void {
    ocultarFormularios()
    tituloFormulario.textContent = 'Nuevo cliente'
    campoClienteId.value = ''
    formularioCliente.hidden = false
    formularioCliente.querySelector<HTMLInputElement>('#cliente-nombre')?.focus()
  }

  function abrirEdicion(cliente: Cliente): void {
    ocultarFormularios()
    tituloFormulario.textContent = `Editar a ${cliente.nombre} ${cliente.apellido}`
    campoClienteId.value = cliente.id
    formularioCliente.querySelector<HTMLInputElement>('#cliente-nombre')!.value = cliente.nombre
    formularioCliente.querySelector<HTMLInputElement>('#cliente-apellido')!.value = cliente.apellido
    formularioCliente.querySelector<HTMLInputElement>('#cliente-dni')!.value = cliente.dni
    formularioCliente.querySelector<HTMLInputElement>('#cliente-telefono')!.value = cliente.telefono
    formularioCliente.querySelector<HTMLInputElement>('#cliente-email')!.value = cliente.email
    formularioCliente.hidden = false
    formularioCliente.querySelector<HTMLInputElement>('#cliente-nombre')?.focus()
  }

  function abrirVinculacion(cliente: Cliente): void {
    ocultarFormularios()
    campoVincularClienteId.value = cliente.id
    formularioVincular.hidden = false
    formularioVincular.querySelector<HTMLInputElement>('#vincular-correo')?.focus()
  }

  async function cambiarEstado(cliente: Cliente): Promise<void> {
    const confirmacion = cliente.activo
      ? `¿Dar de baja a ${cliente.nombre} ${cliente.apellido}? Se liberarán sus turnos asignados.`
      : `¿Reactivar a ${cliente.nombre} ${cliente.apellido}?`

    if (!window.confirm(confirmacion)) return

    mensajeGeneral.classList.remove('mensaje-error')
    mensajeGeneral.textContent = 'Actualizando...'

    try {
      await solicitarAPI(cliente.activo ? '/api/clientes/desactivar' : '/api/clientes/reactivar', {
        method: 'POST',
        body: JSON.stringify({ clienteId: cliente.id }),
      })
      await cargarClientes()
    } catch (error) {
      mensajeGeneral.classList.add('mensaje-error')
      mensajeGeneral.textContent = error instanceof Error
        ? error.message
        : 'No se pudo actualizar el estado del cliente.'
    }
  }

  botonNuevo.addEventListener('click', abrirAlta)
  botonCancelarCliente.addEventListener('click', ocultarFormularios)
  botonCancelarVincular.addEventListener('click', ocultarFormularios)

  formularioCliente.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    if (!validarFormulario(formularioCliente, mensajeFormularioCliente)) return

    const datos = new FormData(formularioCliente)
    const esEdicion = Boolean(campoClienteId.value)

    const cuerpo: Record<string, unknown> = {
      nombre: String(datos.get('nombre') ?? '').trim(),
      apellido: String(datos.get('apellido') ?? '').trim(),
      dni: String(datos.get('dni') ?? '').trim(),
      telefono: String(datos.get('telefono') ?? '').trim(),
      email: String(datos.get('email') ?? '').trim(),
      direccion: String(datos.get('direccion') ?? '').trim(),
      fechaNacimiento: String(datos.get('fechaNacimiento') ?? '').trim(),
      emergenciaNombre: String(datos.get('emergenciaNombre') ?? '').trim(),
      emergenciaTelefono: String(datos.get('emergenciaTelefono') ?? '').trim(),
      emergenciaRelacion: String(datos.get('emergenciaRelacion') ?? '').trim(),
    }

    if (esEdicion) cuerpo.clienteId = campoClienteId.value

    const boton = formularioCliente.querySelector<HTMLButtonElement>('button[type="submit"]')!
    boton.disabled = true
    mensajeFormularioCliente.classList.remove('mensaje-error', 'mensaje-exito')
    mensajeFormularioCliente.textContent = 'Guardando...'

    try {
      await solicitarAPI(esEdicion ? '/api/clientes/editar' : '/api/clientes', {
        method: 'POST',
        body: JSON.stringify(cuerpo),
      })
      ocultarFormularios()
      await cargarClientes()
    } catch (error) {
      mensajeFormularioCliente.classList.add('mensaje-error')
      mensajeFormularioCliente.textContent = error instanceof Error
        ? error.message
        : 'No se pudo guardar el cliente.'

      if (error instanceof ErrorAPI) {
        for (const campo of formularioCliente.querySelectorAll<HTMLInputElement>('input')) {
          if (error.campos.includes(campo.name)) campo.setAttribute('aria-invalid', 'true')
        }
      }
    } finally {
      boton.disabled = false
    }
  })

  formularioVincular.addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const correo = formularioVincular.querySelector<HTMLInputElement>('#vincular-correo')!
    const confirmado = formularioVincular.querySelector<HTMLInputElement>('#vincular-confirmado')!

    if (!validarFormulario(formularioVincular, mensajeFormularioVincular)) return

    if (!confirmado.checked) {
      mensajeFormularioVincular.classList.add('mensaje-error')
      mensajeFormularioVincular.textContent = 'Confirmá que verificaste a quién pertenece la cuenta.'
      return
    }

    const boton = formularioVincular.querySelector<HTMLButtonElement>('button[type="submit"]')!
    boton.disabled = true
    mensajeFormularioVincular.classList.remove('mensaje-error', 'mensaje-exito')
    mensajeFormularioVincular.textContent = 'Vinculando...'

    try {
      await solicitarAPI('/api/clientes/vincular', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: campoVincularClienteId.value,
          correoCuenta: correo.value.trim(),
          confirmado: true,
        }),
      })
      ocultarFormularios()
      await cargarClientes()
    } catch (error) {
      mensajeFormularioVincular.classList.add('mensaje-error')
      mensajeFormularioVincular.textContent = error instanceof Error
        ? error.message
        : 'No se pudo vincular la cuenta.'
    } finally {
      boton.disabled = false
    }
  })

  await cargarClientes()
}