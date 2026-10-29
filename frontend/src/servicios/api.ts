/* Esta clase representa una peticion rechazada por el backend.
 Guarda el estado HTTP y los campos que debemos marcar
 como incorrectos en el formulario.*/
export class ErrorAPI extends Error {
  estado: number
  campos: string[]

  constructor(
    estado: number,
    mensaje: string,
    campos: string[] = [],
  ) {
    super(mensaje)
    this.name = 'ErrorAPI'
    this.estado = estado
    this.campos = campos
  }
}

/* Esta funcion centraliza las peticiones a la API.
 Recibe la ruta y las opciones de envio, y devuelve
 los datos JSON cuando el backend responde correctamente.*/
export async function solicitarAPI<Respuesta>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<Respuesta> {
  const encabezados = new Headers(opciones.headers)

  encabezados.set('Accept', 'application/json')

  /* Cuando enviamos datos, utilizamos el formato JSON.
   El cuerpo se prepara con JSON.stringify al llamar la funcion.*/
  if (opciones.body !== undefined && opciones.body !== null) {
    encabezados.set('Content-Type', 'application/json')
  }

  let respuesta: Response

  try {
    respuesta = await fetch(ruta, {
      ...opciones,
      headers: encabezados,
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch {
    /* Este caso corresponde a un fallo de conexion.
     Un rechazo HTTP del backend se procesa mas adelante.*/
    throw new Error(
      'No se pudo conectar con el servidor. Intentá nuevamente.',
    )
  }

  /* El navegador administra la cookie de sesion.
   No necesitamos leer el token desde JavaScript ni
   guardarlo en localStorage.*/
  let datos: unknown

  try {
    datos = await respuesta.json()
  } catch {
    throw new Error(
      'El servidor devolvió una respuesta que no se pudo interpretar.',
    )
  }

  /* fetch tambien recibe respuestas con estados de error.
   Comprobamos el estado antes de considerar exitosa la operacion.*/
  if (!respuesta.ok) {
    const detalle = (
      datos !== null
      && typeof datos === 'object'
      && !Array.isArray(datos)
    )
      ? datos as Record<string, unknown>
      : {}

    const mensaje = typeof detalle.mensaje === 'string'
      ? detalle.mensaje
      : 'No se pudo completar la operación.'

    const campos = Array.isArray(detalle.campos)
      ? detalle.campos.filter(
          (campo): campo is string => typeof campo === 'string',
        )
      : []

    throw new ErrorAPI(respuesta.status, mensaje, campos)
  }

  /* El tipo indicado por quien llama describe la respuesta.
   Esta conversion no reemplaza las validaciones de los datos.*/
  return datos as Respuesta
}