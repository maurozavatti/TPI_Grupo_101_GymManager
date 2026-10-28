import { createServer } from 'node:http'
import { conectarDB, cerrarConexionDB } from './db.ts'
import { servirWeb } from './servicios/archivos.ts'
import { consultarSesion } from './controladores/sesion.ts'
import { registrarUsuario } from './controladores/register.ts'
import { iniciarSesion } from './controladores/login.ts'

const puerto = Number(process.env.PORT ?? 3000)

const servidor = createServer(async (peticion, respuesta) => {
  // Obtenemos la ruta sin los parametros de consulta.
  const ruta = new URL(
    peticion.url ?? '/',
    'http://localhost',
  ).pathname

  // Respondemos las rutas de la API antes de buscar archivos.
  if (peticion.method === 'GET' && ruta === '/api/salud') {
    respuesta.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    respuesta.end(JSON.stringify({
      mensaje: 'Backend de GymManager funcionando',
    }))
    return
  }

    // Consultamos si la peticion corresponde a una sesion activa.
  if (peticion.method === 'GET' && ruta === '/api/sesion') {
    await consultarSesion(peticion, respuesta)
    return
  }

    // Registramos la cuenta y creamos su primera sesion.
  if (peticion.method === 'POST' && ruta === '/api/register') {
    await registrarUsuario(peticion, respuesta)
    return
  }

    // Comprobamos las credenciales y creamos una nueva sesion.
  if (peticion.method === 'POST' && ruta === '/api/login') {
    await iniciarSesion(peticion, respuesta)
    return
  }
  
  // Las rutas de API que todavia no existen devuelven un error.
  if (ruta === '/api' || ruta.startsWith('/api/')) {
    respuesta.writeHead(404, {
      'Content-Type': 'application/json; charset=utf-8',
    })

    respuesta.end(JSON.stringify({
      mensaje: 'Ruta no encontrada',
    }))
    return
  }

  // Para las demas rutas, entregamos los archivos de la web.
  await servirWeb(peticion, respuesta)
})

try {
  // Primero comprobamos que podemos conectarnos a la base.
  await conectarDB()
  console.log('Conexion a MongoDB Atlas exitosa.')

  // Si la conexion funciona, iniciamos el servidor.
  servidor.listen(puerto, () => {
    console.log(`Backend disponible en http://localhost:${puerto}`)
  })
} catch {
  console.error('No se pudo iniciar el backend. Revisá la conexion a MongoDB Atlas.')

  await cerrarConexionDB()
  process.exitCode = 1
}