import { createServer } from 'node:http'
import { conectarDB, cerrarConexionDB } from './db.ts'

const puerto = Number(process.env.PORT ?? 3000)

const servidor = createServer((_peticion, respuesta) => {
  respuesta.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
  })

  respuesta.end(JSON.stringify({
    mensaje: 'Backend de GymManager funcionando',
  }))
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